import { createClient } from "@supabase/supabase-js";
import ApiError from "../utils/api-error.js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

let client;

export function storage() {
  if (!url || !serviceRoleKey) {
    throw new ApiError(503, "Penyimpanan gambar belum dikonfigurasi");
  }
  client ??= createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client.storage.from(STORAGE_BUCKET);
}

export function publicStorageUrl(objectPath) {
  if (!url) return null;
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

export function storageObjectPath(value) {
  try {
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const pathname = new URL(value).pathname;
    if (pathname.startsWith(prefix)) return decodeURIComponent(pathname.slice(prefix.length));
  } catch { /* legacy relative URL or malformed value */ }
  return null;
}
