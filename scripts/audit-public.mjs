import { chromium } from "playwright";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(repoRoot, "client");
const { preview } = await import(pathToFileURL(resolve(root, "node_modules/vite/dist/node/index.js")));
const routes = ["/", "/tentang", "/layanan", "/proyek", "/artikel", "/kontak", "/404"];
const port = 4173;
const base = `http://127.0.0.1:${port}`;
const server = await preview({ root, configFile: resolve(root, "vite.config.js"), preview: { host: "127.0.0.1", port, strictPort: true } });

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return await chromium.launch({ channel: "chrome", headless: true });
  }
}

// ponytail: pakai binary Chromium Playwright bila ada agar CI deterministik;
// fallback sistem Chrome bila binary Playwright belum terunduh (dev lokal).
function chromiumPath() {
  const p = chromium.executablePath();
  return existsSync(p) ? p : undefined;
}

let chrome;
try {
  const browser = await launchBrowser();
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  const axe = await readFile(resolve(repoRoot, "node_modules/axe-core/axe.min.js"), "utf8");
  const failures = [];

  for (const route of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axe });
    const result = await page.evaluate(async () => window.axe.run(document, { resultTypes: ["violations"] }));
    const blockingViolations = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
    if (blockingViolations.length) {
      failures.push({
        route,
        violations: blockingViolations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    }
  }
  await browser.close();

  chrome = await launch({ chromePath: chromiumPath(), chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"] });
  const lighthouseResults = {};
  for (const route of routes) {
    const result = await lighthouse(`${base}${route}`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    lighthouseResults[route] = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])
    );
  }

  await chrome.kill();
  chrome = null;

  console.log(JSON.stringify({ axe: failures, lighthouse: lighthouseResults }, null, 2));
  const thresholds = { performance: 80, accessibility: 90, "best-practices": 90, seo: 90 };
  const lighthouseFailures = Object.entries(lighthouseResults).flatMap(([route, scores]) => Object.entries(thresholds)
    .filter(([category, minimum]) => scores[category] < minimum)
    .map(([category, minimum]) => ({ route, category, score: scores[category], minimum })));
  if (failures.length || lighthouseFailures.length) {
    if (lighthouseFailures.length) console.error(JSON.stringify({ lighthouseFailures }, null, 2));
    process.exitCode = 1;
  }
} finally {
  if (chrome) await chrome.kill();
  if (server.httpServer) {
    await new Promise((res) => server.httpServer.close(res));
  }
}
