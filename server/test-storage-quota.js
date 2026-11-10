import assert from "node:assert/strict";
import { STORAGE_LIMIT_BYTES } from "./src/config/supabase.js";

assert.equal(typeof STORAGE_LIMIT_BYTES, "number");
assert.ok(STORAGE_LIMIT_BYTES >= 1024 * 1024 * 100);

const usage = { bytes: 1_000_000_000, limit: 1_073_741_824 };
const incomingSmall = 10_000_000;
assert.ok(usage.bytes + incomingSmall <= usage.limit);

const incomingLarge = 100_000_000;
assert.ok(usage.bytes + incomingLarge > usage.limit);

console.log("storage quota check: pass");
