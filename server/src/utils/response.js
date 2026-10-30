// Helper respons sukses dengan format seragam: { success, data, meta }
export function sendSuccess(res, { data = null, meta = null, status = 200 } = {}) {
  return res.status(status).json({ success: true, data, meta });
}
