import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(repoRoot, "client");
const { preview } = await import(pathToFileURL(resolve(root, "node_modules/vite/dist/node/index.js")));
const routes = ["/", "/tentang", "/layanan", "/proyek", "/artikel", "/kontak", "/404"];
const server = await preview({ root, configFile: resolve(root, "vite.config.js"), preview: { host: "127.0.0.1", port: 4174, strictPort: true } });
let browser;

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return await chromium.launch({ channel: "chrome", headless: true });
  }
}

try {
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    for (const route of routes) {
      await page.goto(`http://127.0.0.1:4174${route}`, { waitUntil: "networkidle" });
      // Pemicu IntersectionObserver agar bagian di bawah lipatan ikut dirender.
      await page.evaluate(() => {
        const step = window.innerHeight || 800;
        const max = document.body.scrollHeight;
        const scrollAndObserve = () => {
          if (window.scrollY + window.innerHeight >= max) {
            window.scrollTo(0, 0);
            return;
          }
          window.scrollTo(0, window.scrollY + step);
          setTimeout(scrollAndObserve, 100);
        };
        scrollAndObserve();
      });
      // Tunggu sebentar agar observer/komponen selesai mount.
      await page.waitForTimeout(500);
      const html = await page.content();
      const target = route === "/" ? resolve(root, "dist/index.html") : resolve(root, `dist${route}/index.html`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, `<!doctype html>\n${html.slice(html.indexOf("<html"))}`, "utf8");
    }
  } catch (err) {
    // ponytail: environment tanpa browser (contoh Vercel SPA build) — skip prerender,
    // tetap keluar kode 0 agar build Vite tidak gagal.
    console.warn("prerender skipped: browser unavailable —", err.message);
  }
} finally {
  await browser?.close();
  if (server.httpServer) {
    await new Promise((res) => server.httpServer.close(res));
  }
}
