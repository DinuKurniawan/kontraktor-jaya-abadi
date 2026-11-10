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
const lighthouseConfig = {
  throttlingMethod: "simulate",
  formFactor: "mobile",
  screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1 },
};
const port = 4173;
// Origin harus sama dengan CLIENT_URL server (CORS) agar audit mengukur kondisi nyata.
const base = `http://localhost:${port}`;
const server = await preview({ root, configFile: resolve(root, "vite.config.js"), preview: { host: "localhost", port, strictPort: true } });

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

const isApi = (url) => /\/api\//.test(url);
const isFontHost = (url) => /fonts\.(googleapis|gstatic)\.com/.test(url);
// Gambar "original" = file non-WebP, atau URL picsum tanpa dimensi eksplisit.
const isOriginalImage = (url) => {
  if (/\.(jpe?g|png)(\?|$)/i.test(url)) return true;
  if (/picsum\.photos\/seed\/[^/]+$/.test(new URL(url).pathname)) return true;
  return false;
};

let chrome;
try {
  const browser = await launchBrowser();
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  const axe = await readFile(resolve(repoRoot, "node_modules/axe-core/axe.min.js"), "utf8");
  const failures = [];
  const network = {};

  for (const route of routes) {
    const requests = [];
    const apiFailures = [];
    const consoleErrors = [];
    const requestFailed = [];

    const onRequest = (req) => requests.push({ url: req.url(), method: req.method(), type: req.resourceType() });
    const onResponse = (res) => {
      if (res.status() >= 400) apiFailures.push({ url: res.url(), status: res.status() });
    };
    const onRequestFailed = (req) => requestFailed.push({ url: req.url(), error: req.failure()?.errorText ?? "failed" });
    const onConsole = (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    };

    page.on("request", onRequest);
    page.on("response", onResponse);
    page.on("requestfailed", onRequestFailed);
    page.on("console", onConsole);

    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    // Tunggu lagi untuk menangkap polling/duplikasi request berkala.
    await page.waitForTimeout(4000);

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

    const imageSources = await page.evaluate(() =>
      Array.from(document.images).map((img) => img.currentSrc || img.src).filter(Boolean)
    );

    const counts = new Map();
    for (const req of requests) {
      const key = `${req.method} ${req.url}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    network[route] = {
      authMeCalls: requests.filter((r) => r.url.includes("/auth/me")).map((r) => r.url),
      apiFailures: apiFailures.filter((r) => isApi(r.url)),
      nonApiFailures: apiFailures.filter((r) => !isApi(r.url)),
      requestFailed: requestFailed.filter((r) => isApi(r.url)),
      consoleErrors,
      externalFonts: requests.filter((r) => isFontHost(r.url)).map((r) => r.url),
      originalImages: [...new Set(imageSources.filter(isOriginalImage))],
      duplicateRequests: [...counts.entries()].filter(([, n]) => n > 1).map(([key, n]) => ({ request: key, count: n })),
      chunks: [...new Set(requests.filter((r) => r.type === "script").map((r) => r.url.split("/").pop()))],
    };

    page.off("request", onRequest);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
    page.off("console", onConsole);
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
      ...lighthouseConfig,
    });
    lighthouseResults[route] = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])
    );
  }

  await chrome.kill();
  chrome = null;

  console.log(JSON.stringify({ axe: failures, network, lighthouse: lighthouseResults }, null, 2));

  const thresholds = { performance: 80, accessibility: 90, "best-practices": 90, seo: 90 };
  const lighthouseFailures = Object.entries(lighthouseResults).flatMap(([route, scores]) => Object.entries(thresholds)
    .filter(([category, minimum]) => scores[category] < minimum)
    .map(([category, minimum]) => ({ route, category, score: scores[category], minimum })));

  // Regresi jaringan yang harus menggagalkan audit.
  const networkFailures = Object.entries(network).flatMap(([route, report]) => {
    const issues = [];
    if (report.apiFailures.length) issues.push({ kind: "api-failure", count: report.apiFailures.length });
    if (report.requestFailed.length) issues.push({ kind: "api-request-failed", count: report.requestFailed.length });
    if (report.authMeCalls.length) issues.push({ kind: "auth-me-on-public", count: report.authMeCalls.length });
    if (report.externalFonts.length) issues.push({ kind: "external-font", count: report.externalFonts.length });
    if (report.originalImages.length) issues.push({ kind: "original-image", count: report.originalImages.length });
    return issues.map((issue) => ({ route, ...issue }));
  });

  if (failures.length || lighthouseFailures.length || networkFailures.length) {
    if (lighthouseFailures.length) console.error(JSON.stringify({ lighthouseFailures }, null, 2));
    if (networkFailures.length) console.error(JSON.stringify({ networkFailures }, null, 2));
    process.exitCode = 1;
  }
} finally {
  if (chrome) await chrome.kill();
  if (server.httpServer) {
    await new Promise((res) => server.httpServer.close(res));
  }
}
