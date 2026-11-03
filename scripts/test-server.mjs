// Entry point server untuk E2E: port dan upload dipisahkan dari development.
import fs from "node:fs/promises";
import { loadTestEnv } from "../server/tests/setup/test-env.js";

const { uploadDir } = loadTestEnv({ withUploads: true });
await import("../server/tests/setup/guard.js");
const { default: app } = await import("../server/src/app.js");
const { default: prisma } = await import("../server/src/config/prisma.js");

const port = Number(process.env.PORT || 4001);
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`✅ Test server berjalan di http://127.0.0.1:${port}`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Menerima ${signal}, menghentikan test server...`);
  server.close(async () => {
    await prisma.$disconnect();
    await fs.rm(uploadDir, { recursive: true, force: true });
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
