// Menyiapkan database tes lokal tanpa pernah memuat server/.env production.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverRoot = path.join(repoRoot, "server");
const isWindows = process.platform === "win32";
const { loadTestEnv } = await import("../server/tests/setup/test-env.js");
loadTestEnv();
await import("../server/tests/setup/guard.js");

const databaseUrl = new URL(process.env.DATABASE_URL);
const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ""));
const databaseUser = decodeURIComponent(databaseUrl.username);
const databasePassword = decodeURIComponent(databaseUrl.password);
const databaseHost = databaseUrl.hostname;
const databasePort = databaseUrl.port || "5432";

function findPostgresBinary(name) {
  const executable = isWindows ? `${name}.exe` : name;
  const configured = process.env.PG_BIN ? path.join(process.env.PG_BIN, executable) : null;
  if (configured && fs.existsSync(configured)) return configured;

  const installationRoot = isWindows ? "C:\\Program Files\\PostgreSQL" : null;
  if (installationRoot && fs.existsSync(installationRoot)) {
    const versions = fs.readdirSync(installationRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .sort((a, b) => Number(b.name) - Number(a.name));
    for (const version of versions) {
      const candidate = path.join(installationRoot, version.name, "bin", executable);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return executable;
}

const psql = findPostgresBinary("psql");
const createdb = findPostgresBinary("createdb");
const postgresEnv = { ...process.env };
if (databasePassword) postgresEnv.PGPASSWORD = databasePassword;

function run(command, args, { cwd = repoRoot, capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: postgresEnv,
    encoding: "utf8",
    shell: isWindows && command.toLowerCase().endsWith(".cmd"),
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Perintah ${path.basename(command)} gagal`);
  return result.stdout?.trim() ?? "";
}

function databaseArgs(targetDatabase) {
  return ["-w", "-h", databaseHost, "-p", databasePort, "-U", databaseUser, "-d", targetDatabase];
}

function ensureDatabase() {
  const checkSql = `SELECT 1 FROM pg_database WHERE datname = '${databaseName.replaceAll("'", "''")}'`;
  const result = run(psql, [...databaseArgs("postgres"), "-Atc", checkSql], { capture: true });
  if (result === "1") return;
  run(createdb, ["-w", "-h", databaseHost, "-p", databasePort, "-U", databaseUser, databaseName]);
  console.log(`✅ Database tes siap: ${databaseName}`);
}

function prismaCommand(args) {
  const executable = path.join(serverRoot, "node_modules", ".bin", isWindows ? "prisma.cmd" : "prisma");
  if (!fs.existsSync(executable)) throw new Error("Prisma CLI server belum terpasang");
  run(executable, [...args, "--schema", "server/prisma/schema.prisma"]);
}

async function seed() {
  const { seedTestData } = await import("../server/tests/setup/seed.js");
  await seedTestData();
  console.log("✅ Seed tes selesai");
}

async function resetData() {
  const { default: prisma } = await import("../server/src/config/prisma.js");
  const tables = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'");
  const names = tables.map(({ tablename }) => `\"${tablename.replaceAll('"', '""')}\"`);
  if (names.length > 0) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names.join(", ")} RESTART IDENTITY CASCADE`);
  await seed();
  await prisma.$disconnect();
}

async function main() {
  const action = process.argv[2] ?? "setup";
  if (!new Set(["setup", "reset"]).has(action)) throw new Error("Gunakan aksi setup atau reset");
  ensureDatabase();
  prismaCommand(["migrate", "deploy"]);
  if (action === "setup") await seed();
  if (action === "reset") await resetData();
}

try {
  await main();
} catch (error) {
  const safeMessage = String(error?.message ?? error).replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://[redacted]");
  console.error(`[TEST DB] ${safeMessage}`);
  process.exitCode = 1;
}
