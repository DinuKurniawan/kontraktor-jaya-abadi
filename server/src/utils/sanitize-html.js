// Sanitasi HTML konten artikel: buang script, iframe, objek berbahaya, atribut on*, dan javascript: URI.
// Sanitizer regex ini lapisan pertahanan tambahan. Editor admin tetap sumber konten tepercaya;
// ganti dengan parser AST (mis. DOMPurify) bila nanti menerima HTML dari pengguna publik.
export function sanitizeHtml(raw) {
  if (!raw || typeof raw !== "string") return "";

  return raw
    // 1. Buang tag berbahaya beserta isinya
    .replace(/<(script|style|iframe|object|embed|form|textarea|button|input)[\s\S]*?<\/\1>/gi, "")
    // 2. Buang tag berbahaya tanpa pasangan/self-closing
    .replace(/<\/?(script|style|iframe|object|embed|form|textarea|button|input|meta|link|base)[^>]*>/gi, "")
    // 3. Buang event handlers (onclick, onerror, onload, dll)
    .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    // 4. Buang javascript: / vbscript: URI
    .replace(/\s+(href|src)\s*=\s*(['"])\s*(?:javascript|vbscript):[\s\S]*?\2/gi, "")
    .replace(/\s+(href|src)\s*=\s*(?:javascript|vbscript):[^\s>]*/gi, "");
}
