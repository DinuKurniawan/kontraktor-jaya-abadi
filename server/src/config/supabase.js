import { createClient } from "@supabase/supabase-js";
import ApiError from "../utils/api-error.js";

// Default 1 GB (free tier Supabase Storage). Override via env SUPABASE_STORAGE_LIMIT_BYTES.
export const STORAGE_LIMIT_BYTES = Number(process.env.SUPABASE_STORAGE_LIMIT_BYTES) || 1_073_741_824;

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

// Sum object sizes in the bucket (recursive, paginated). Used to enforce the free-tier cap.
export async function getBucketUsage() {
  validConfiguration();
  const bucket = storage();
  let bytes = 0;
  let objects = 0;
  const queue = [""];
  while (queue.length) {
    const prefix = queue.pop();
    let offset = 0;
    for (;;) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
      if (error) throw new ApiError(502, `Gagal menghitung pemakaian storage: ${error.message}`);
      const page = data ?? [];
      for (const item of page) {
        if (item.id === null) queue.push(prefix ? `${prefix}/${item.name}` : item.name);
        else {
          objects += 1;
          bytes += Number(item.metadata?.size ?? 0);
        }
      }
      if (page.length < 1000) break;
      offset += 1000;
    }
  }
  return { bytes, objects, limit: STORAGE_LIMIT_BYTES };
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
