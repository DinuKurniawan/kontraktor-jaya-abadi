// Setup Vitest: environment dan folder upload tes dimuat sebelum module aplikasi.
import { loadTestEnv } from "./test-env.js";

export const { uploadDir } = loadTestEnv({ withUploads: true });
await import("./guard.js");
