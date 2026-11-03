import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["server/tests/**/*.test.js"],
    environment: "node",
    setupFiles: [path.resolve(__dirname, "server/tests/setup/vitest.setup.js")],
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    sequence: { concurrent: false, shuffle: false },
    maxConcurrency: 1,
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
