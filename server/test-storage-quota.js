import assert from "node:assert/strict";
import { STORAGE_LIMIT_BYTES, wouldExceedStorageLimit } from "./src/config/supabase.js";

assert.equal(typeof STORAGE_LIMIT_BYTES, "number");
assert.equal(STORAGE_LIMIT_BYTES, 900 * 1024 * 1024);
assert.equal(wouldExceedStorageLimit(STORAGE_LIMIT_BYTES - 100, 50), false);
assert.equal(wouldExceedStorageLimit(STORAGE_LIMIT_BYTES - 100, 101), true);

console.log("storage quota check: pass");
