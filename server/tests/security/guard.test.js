// Verifikasi bahwa guard memang aktif pada proses suite.
import { describe, expect, it } from "vitest";
import { assertTestEnvironment } from "../setup/guard.js";

describe("test environment guard", () => {
  it("menerima hanya environment database tes lokal", () => {
    expect(() => assertTestEnvironment()).not.toThrow();
  });
});
