import assert from "node:assert/strict";
import { sanitizeHtml } from "./sanitize-html.js";

// 1. Script tag dibuang
assert.equal(sanitizeHtml("<p>Halo</p><script>alert('xss')</script>"), "<p>Halo</p>");

// 2. Onerror / event handler dibuang
assert.equal(sanitizeHtml('<img src="foto.webp" onerror="alert(1)" />'), '<img src="foto.webp" />');

// 3. Javascript: URI dibuang
assert.equal(sanitizeHtml('<a href="javascript:alert(1)">Klik</a>'), "<a>Klik</a>");

// 4. Tag aman tetap dipertahankan
const safeHtml = "<h2>Tips Bangun Rumah</h2><p>Gunakan material standar SNI.</p>";
assert.equal(sanitizeHtml(safeHtml), safeHtml);

console.log("✅ Semua uji sanitasi HTML lulus.");
