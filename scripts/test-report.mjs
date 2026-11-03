// Ringkas hasil runner yang sudah dijalankan menjadi laporan Markdown.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(repoRoot, "test-results");
const reportPath = path.join(repoRoot, "docs", "TEST_REPORT.md");

async function readJson(fileName) {
  try {
    return JSON.parse(await fs.readFile(path.join(resultsDir, fileName), "utf8"));
  } catch {
    return null;
  }
}

function vitestStatus(result) {
  if (!result) return "Belum dijalankan";
  if (result.success === true) return `Lulus (${result.numPassedTests ?? 0} tes)`;
  return `Gagal (${result.numFailedTests ?? 0} gagal)`;
}

const api = await readJson("vitest-api.json");
const security = await readJson("vitest-security.json");
const e2eReport = await fs.access(path.join(repoRoot, "playwright-report", "index.html")).then(() => true).catch(() => false);
const generatedAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

const content = `# Laporan Tes Jaya Abadi

Dibuat: ${generatedAt} WIB

## Ringkasan

| Suite | Hasil |
| --- | --- |
| API (Vitest) | ${vitestStatus(api)} |
| Security (Vitest) | ${vitestStatus(security)} |
| E2E (Playwright Chromium) | ${e2eReport ? "Report tersedia" : "Belum dijalankan / report belum tersedia"} |

## Environment

- Database: PostgreSQL lokal `jayaabadi_test`
- API test: `http://127.0.0.1:4001`
- Client test: `http://127.0.0.1:5174`
- Browser E2E: Chromium desktop 1440px dan mobile 375px

## Artefak

- JSON Vitest: `test-results/vitest-api.json`, `test-results/vitest-security.json`
- Report Playwright: `playwright-report/`
`;

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, content, "utf8");
console.log(`✅ Laporan tes ditulis ke ${path.relative(repoRoot, reportPath)}`);
