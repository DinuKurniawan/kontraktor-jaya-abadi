import { createClient } from "@supabase/supabase-js";
import ApiError from "../utils/api-error.js";

function cleanEnv(value) {
  if (!value) return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

function normalizeProjectUrl(raw) {
  if (!raw) return "";
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    return parsed.origin; // selalu menghasilkan "https://xxxx.supabase.co" tanpa path /storage/v1 dll
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

function normalizeBucketName(raw) {
  const cleaned = cleanEnv(raw || "uploads").replace(/^\/+|\/+$/g, "");
  // Jika pengguna memasukkan path seperti "storage/v1/object/public/uploads"
  const segments = cleaned.split("/").filter(Boolean);
  return segments.pop() || "uploads";
}

const rawUrl = cleanEnv(process.env.SUPABASE_URL);
const url = normalizeProjectUrl(rawUrl);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const STORAGE_BUCKET = normalizeBucketName(process.env.SUPABASE_STORAGE_BUCKET);

let client;

function validConfiguration() {
  if (!url || !serviceRoleKey) throw new ApiError(503, "Penyimpanan gambar belum dikonfigurasi");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(url) && !url.startsWith("http")) {
    throw new ApiError(503, "SUPABASE_URL tidak valid");
  }
}

export function storage() {
  validConfiguration();
  client ??= createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage.from(STORAGE_BUCKET);
}

export async function ensureBucket() {
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw new ApiError(502, `Gagal memeriksa bucket: ${listError.message}`);
  
  const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(STORAGE_BUCKET, { public: true });
    if (createError) throw new ApiError(502, `Gagal membuat bucket: ${createError.message}`);
  }
}

export function publicStorageUrl(objectPath) {
  if (!url) return null;
  const cleanPath = String(objectPath).replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
}

export function storageObjectPath(value) {
  try {
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const pathname = new URL(value).pathname;
    if (pathname.startsWith(prefix)) return decodeURIComponent(pathname.slice(prefix.length));
  } catch { /* legacy relative URL or malformed value */ }
  return null;
}
