// Sesi di in one: verifikasi JWT dari cookie/Authorization header
import prisma from "../config/prisma.js";
import { TOKEN_COOKIE, verifyToken } from "../config/jwt.js";
import ApiError from "../utils/api-error.js";
import { USER_SELECT } from "../modules/users/service.js";

// Ambil token dari cookie "token" atau header Authorization: Bearer <token>
function extractToken(req) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return req.cookies?.[TOKEN_COOKIE] || bearer || null;
}

// Wajib login: validasi token, ambil user terbaru, pastikan masih aktif
export async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, "Belum masuk — token tidak ditemukan");

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, "Sesi tidak valid atau sudah kedaluwarsa");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: USER_SELECT,
    });
    if (!user || !user.isActive) {
      throw new ApiError(401, "Akun tidak ditemukan atau telah dinonaktifkan");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Batasi akses berdasarkan role
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, "Akses ditolak — peran tidak sesuai"));
      return;
    }
    next();
  };
}
