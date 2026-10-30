// Konfigurasi JWT + cookie sesi
import jwt from "jsonwebtoken";

export const TOKEN_COOKIE = "token";
const SECRET = process.env.JWT_SECRET || "dev-secret-jaya-abadi";
const EXPIRES_IN = "7d";

// Buat token JWT berisi id + role user
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production", // hanya https di production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  path: "/",
};
