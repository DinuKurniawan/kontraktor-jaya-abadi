// Entry point Vercel Serverless Function.
// Express app dipakai apa adanya sebagai handler (req, res) — tidak memanggil
// app.listen() karena Vercel yang mengelola siklus hidup HTTP server.
import app from "../src/app.js";

export default function handler(req, res) {
  return app(req, res);
}
