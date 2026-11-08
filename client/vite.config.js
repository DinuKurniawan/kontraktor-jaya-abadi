import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const rawApi = env.VITE_API_URL || "";
  let apiOrigin = "";
  try {
    if (rawApi) {
      const u = new URL(rawApi);
      if (!/localhost|127\.0\.0\.1/.test(u.hostname)) apiOrigin = u.origin;
    }
  } catch {}

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Preconnect otomatis ke origin API jika disetel ke production
      {
        name: "api-preconnect",
        transformIndexHtml(html) {
          if (!apiOrigin) return html;
          return html.replace(
            "</head>",
            `    <link rel="preconnect" href="${apiOrigin}" crossorigin />\n  </head>`
          );
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "vendor-react";
            if (id.includes("node_modules/react-router") || id.includes("node_modules/react-router-dom")) return "vendor-router";
            if (id.includes("node_modules/@tanstack/react-query")) return "vendor-query";
          },
        },
      },
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
  };
});
