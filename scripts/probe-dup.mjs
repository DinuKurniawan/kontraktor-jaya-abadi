import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.cwd(), "client");
const { preview } = await import(pathToFileURL(resolve(root, "node_modules/vite/dist/node/index.js")).href);
const server = await preview({ root, configFile: resolve(root, "vite.config.js"), preview: { host: "localhost", port: 4173, strictPort: true } });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const cdp = await page.context().newCDPSession(page);

await cdp.send("Network.enable");
const seen = [];
cdp.on("Network.requestWillBeSent", (e) => {
  const url = e.request.url;
  if (!url.includes("/public/services") && !url.includes("/public/testimonials")) return;
  seen.push({
    url,
    type: e.type,
    initiator: e.initiator,
    timestamp: e.timestamp,
  });
});

for (const route of ["/kontak", "/layanan"]) {
  seen.length = 0;
  console.log("=== route", route);
  await page.goto(`http://localhost:4173${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  const t0 = seen[0]?.timestamp ?? 0;
  for (const s of seen) {
    console.log(`+${((s.timestamp - t0) * 1000).toFixed(0)}ms`, s.type, s.url);
    console.log("   initiator:", JSON.stringify(s.initiator));
  }
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));
