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
      apiOrigin = u.origin;
    }
  } catch {}

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Preconnect otomatis & injeksi CSP dinamis mengikuti VITE_API_URL
      {
        name: "api-preconnect-and-csp",
        transformIndexHtml(html) {
          const apiSource = apiOrigin ? ` ${apiOrigin}` : "";
          const preconnect = apiOrigin && !/localhost|127\.0\.0\.1/.test(apiOrigin)
            ? `    <link rel="preconnect" href="${apiOrigin}" crossorigin />\n`
            : "";
          // Catatan: frame-ancestors TIDAK valid di <meta>, hanya valid di header HTTP.
          const csp = `    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://picsum.photos https://fastly.picsum.photos https://*.picsum.photos https://images.unsplash.com https://*.tile.openstreetmap.org https://i.ytimg.com${apiSource}; font-src 'self' data:; connect-src 'self'${apiSource} https://nominatim.openstreetmap.org; frame-src https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com; base-uri 'self'; form-action 'self'; object-src 'none'" />\n`;
          return html.replace("</head>", `${preconnect}${csp}  </head>`);
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
