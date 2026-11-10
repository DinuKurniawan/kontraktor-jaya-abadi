import { createClient } from "@supabase/supabase-js";
import ApiError from "../utils/api-error.js";

function cleanEnv(value) {
  if (!value) return "";
  return String(value).trim().replace(/^["']|["']$/g, "");
}

const rawUrl = cleanEnv(process.env.SUPABASE_URL);
const url = rawUrl.replace(/\/+$/, "");
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const STORAGE_BUCKET = cleanEnv(process.env.SUPABASE_STORAGE_BUCKET || "uploads").replace(/^\/+|\/+$/g, "");

let client;

function validConfiguration() {
  if (!url || !serviceRoleKey) throw new ApiError(503, "Penyimpanan gambar belum dikonfigurasi");
  try {
    const parsed = new URL(url);
    if (parsed.pathname !== "" && parsed.pathname !== "/") {
      throw new ApiError(503, "SUPABASE_URL harus Project URL saja, tanpa /storage/v1 atau path lain");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "SUPABASE_URL tidak valid");
  }
  if (!/^[a-z0-9][a-z0-9._-]{0,62}$/i.test(STORAGE_BUCKET)) {
    throw new ApiError(503, "SUPABASE_STORAGE_BUCKET harus nama bucket saja, misalnya uploads");
  }
}

export function storage() {
  validConfiguration();
  client ??= createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage.from(STORAGE_BUCKET);
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
