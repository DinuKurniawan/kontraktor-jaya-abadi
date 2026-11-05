// Route SSE (Server-Sent Events) untuk streaming event perubahan data ke client
import express from "express";
import { realtimeEmitter } from "../../lib/events.js";

const router = express.Router();

router.get("/stream", (req, res) => {
  // Set header wajib untuk SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Cegah buffering oleh Nginx
  });

  // Kirim initial connection handshake
  res.write(`data: ${JSON.stringify({ type: "connected", time: Date.now() })}\n\n`);

  // Handler kirim event ke client ini
  const onDataChange = (payload) => {
    res.write(`event: change\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  realtimeEmitter.on("change", onDataChange);

  // Heartbeat ping tiap 25 detik agar koneksi tetap hidup
  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  // Bersihkan listener saat client disconnect / tutup tab
  req.on("close", () => {
    clearInterval(keepAlive);
    realtimeEmitter.off("change", onDataChange);
  });
});

export default router;
