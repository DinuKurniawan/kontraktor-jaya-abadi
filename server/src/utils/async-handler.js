// Bungkus route handler async agar error otomatis diteruskan ke errorHandler
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
