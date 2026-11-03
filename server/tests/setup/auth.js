// Helper login test: cookie dikembalikan per role tanpa menyentuh akun production.
import request from "supertest";
import app from "../../src/app.js";

export const TEST_USERS = {
  SUPER_ADMIN: "test.super_admin@jayaabadi.test",
  ADMIN: "test.admin@jayaabadi.test",
  EDITOR: "test.editor@jayaabadi.test",
};

export async function loginWithCredentials(email, password = process.env.TEST_PASSWORD) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  if (response.status !== 200) {
    throw new Error(`Login test gagal dengan status ${response.status}`);
  }

  return {
    cookie: response.headers["set-cookie"] ?? [],
    token: response.body.meta?.token,
    user: response.body.data,
  };
}

export function loginAs(role) {
  const normalizedRole = String(role).toUpperCase();
  const email = TEST_USERS[normalizedRole];
  if (!email) throw new Error(`Role login test tidak dikenal: ${role}`);
  return loginWithCredentials(email);
}

export async function cookiesByRole() {
  const result = {};
  for (const role of Object.keys(TEST_USERS)) result[role] = (await loginAs(role)).cookie;
  return result;
}
