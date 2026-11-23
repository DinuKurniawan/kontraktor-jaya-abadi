// Server statis untuk audit: meniru rewrite vercel.json — path halaman bersih
// dilayani file prerender-nya, sisanya jatuh ke index.html (SPA).
// Vite preview tidak bisa dipakai karena fallback SPA-nya menutupi hasil prerender.
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const PAGES = new Set(["/tentang", "/layanan", "/proyek", "/artikel", "/kontak", "/404"]);
const COMPRESSIBLE_EXT = new Set([".html", ".js", ".css", ".json", ".svg", ".xml", ".txt", ".map"]);

export function startStaticPreview({ dir, port, host = "localhost" }) {
  const rootDir = resolve(dir);
  const file = (p) => {
    try {
      return statSync(p).isFile() ? p : "";
    } catch {
      return "";
    }
  };

  const server = createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://audit").pathname);
    } catch {
      res.statusCode = 400;
      return res.end();
    }

    const target = pathname === "/" ? "/index.html" : PAGES.has(pathname) ? `${pathname}/index.html` : pathname;
    const candidate = resolve(join(rootDir, normalize(target)));
    const found = candidate.startsWith(rootDir + sep) ? file(candidate) : "";
    const path = found || join(rootDir, "index.html");

    res.setHeader("Content-Type", TYPES[extname(path)] || "application/octet-stream");
    // Samakan dengan Vercel: aset ber-hash di-cache permanen, HTML selalu revalidasi.
    res.setHeader("Cache-Control", path.includes(`${sep}assets${sep}`) ? "public, max-age=31536000, immutable" : "no-cache");

    let body = readFileSync(path);
    if (COMPRESSIBLE_EXT.has(extname(path)) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      body = gzipSync(body);
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Vary", "Accept-Encoding");
    }
    res.setHeader("Content-Length", body.length);
    res.statusCode = 200;
    return res.end(body);
  });

  return new Promise((done) => {
    server.listen(port, host, () => done({ httpServer: server }));
  });
}
