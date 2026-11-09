// Helper tunggal URL gambar publik: resolve server, varian ukuran (srcSet 1x/2x),
// dan format modern (WebP) untuk picsum, upload server, dan Unsplash.
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

// Path relatif (/uploads/x.webp) → URL absolut server API.
export const img = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return `${SERVER}${p}`;
};

const PICSUM = /^(https?:\/\/(?:fastly\.)?picsum\.photos\/seed\/[^/]+)\/\d+\/\d+/;
const UPLOAD = /\/uploads\/[^/?#]+\.webp(\?.*)?$/i;
const UNSPLASH = /^https?:\/\/images\.unsplash\.com\//;

// Satu varian gambar pada w×h. Server hanya punya -thumb.webp 480px untuk upload,
// jadi lebar di bawah itu memakai thumbnail, sisanya file asli (maks 1600px).
function variant(url, w, h) {
  const n = (v) => Math.max(1, Math.round(v));
  if (PICSUM.test(url)) return `${url.match(PICSUM)[1]}/${n(w)}/${n(h)}.webp`;
  if (UNSPLASH.test(url)) {
    const u = new URL(url);
    u.searchParams.set("w", n(w));
    u.searchParams.set("h", n(h));
    u.searchParams.set("fit", "crop");
    u.searchParams.set("q", "72");
    u.searchParams.set("auto", "format");
    return u.toString();
  }
  if (UPLOAD.test(url)) return w <= 480 ? url.replace(/\.webp(\?.*)?$/i, "-thumb.webp") : url;
  return url;
}

// Props <img> siap sebar: width/height memakai rasio yang sama dengan gambar yang
// dikirim, sehingga rasio intrinsik selalu cocok dengan tampilan.
export function imageProps(src, { width = 800, height, priority = false } = {}) {
  const url = img(src);
  if (!url) return {};
  const h = height ?? Math.round((width * 2) / 3);
  const one = variant(url, width, h);
  const two = variant(url, width * 2, h * 2);
  return {
    src: one,
    srcSet: one === two ? undefined : `${one} 1x, ${two} 2x`,
    width: Math.round(width),
    height: Math.round(h),
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : undefined,
    decoding: "async",
  };
}
