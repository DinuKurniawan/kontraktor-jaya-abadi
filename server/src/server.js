// Entry point server Jaya Abadi — memulai HTTP server + graceful shutdown
import "dotenv/config";
import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});

// Matikan dengan rapi: tutup server dulu, lepaskan koneksi database
async function shutdown(signal) {
  console.log(`\nMenerima ${signal}, menghentikan server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
