import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.cwd(), "client");
const { preview } = await import(pathToFileURL(resolve(root, "node_modules/vite/dist/node/index.js")).href);
const server = await preview({ root, configFile: resolve(root, "vite.config.js"), preview: { host: "127.0.0.1", port: 4173, strictPort: true } });
const browser = await chromium.launch({ channel: "chrome", headless: true });

const routes = ["/", "/tentang", "/layanan", "/proyek", "/artikel", "/kontak", "/404"];
const report = {};

for (const route of routes) {
  const page = await browser.newPage();
  const requests = [];
  const consoleErrors = [];
  const failedResponses = [];

  page.on("request", (req) => {
    requests.push(req.url());
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      failedResponses.push({ url: res.url(), status: res.status() });
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: "networkidle" });

  const authMeCalls = requests.filter((u) => u.includes("/auth/me"));
  report[route] = {
    authMeCalls,
    failedResponses,
    consoleErrors,
    totalRequests: requests.length,
  };

  await page.close();
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));

console.log(JSON.stringify(report, null, 2));
