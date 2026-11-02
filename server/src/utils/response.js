// Helper respons sukses dengan format seragam: { success, data, meta, ...extra (mis. facets) }
export function sendSuccess(res, { data = null, meta = null, status = 200, ...extra } = {}) {
  return res.status(status).json({ success: true, data, meta, ...extra });
}
