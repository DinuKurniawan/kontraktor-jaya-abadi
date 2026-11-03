// Smoke test API paling dasar untuk memverifikasi aplikasi Express dapat dijalankan.
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("GET /api/health", () => {
  it("mengembalikan status server Jaya Abadi", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });
});
