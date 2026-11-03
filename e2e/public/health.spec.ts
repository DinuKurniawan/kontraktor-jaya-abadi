import { expect, test } from "@playwright/test";

test("GET /api/health tersedia pada test server", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4001/api/health");

  expect(response.ok()).toBeTruthy();
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toMatchObject({
    success: true,
    data: { status: "ok" },
  });
});
