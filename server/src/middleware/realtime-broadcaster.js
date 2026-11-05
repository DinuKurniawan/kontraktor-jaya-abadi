// Middleware yang memantau response sukses pada metode non-GET dan memancarkan event SSE
import { emitChange } from "../lib/events.js";

// Pemetaan path URL ke resource name standar
function resolveResource(path) {
  // Contoh: /admin/projects/123 -> projects
  // Contoh: /admin/service-categories -> service-categories
  // Contoh: /public/messages -> messages
  // Contoh: /public/subscribe -> subscribers
  // Contoh: /media/upload -> media
  const clean = path.replace(/^\/api\//, "").replace(/^\//, "");
  const segments = clean.split("/");

  if (segments[0] === "public" && segments[1] === "subscribe") {
    return "subscribers";
  }
  
  if (segments[0] === "admin" && segments[1]) {
    return segments[1];
  }
  if (segments[0] === "public" && segments[1]) {
    return segments[1];
  }
  return segments[0] || "general";
}

export function realtimeBroadcaster(req, res, next) {
  // Hanya pantau metode perubahan data
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Intercept saat response selesai (finish)
  res.on("finish", () => {
    // Hanya broadcast jika response sukses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const resource = resolveResource(req.baseUrl ? `${req.baseUrl}${req.path}` : req.originalUrl || req.url);
      const action = req.method.toLowerCase();
      emitChange(resource, action);
    }
  });

  next();
}
