import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { z } from "zod";
import "./index.css";

// ponytail: aktifkan stylesheet non-render-blocking via module JS agar tidak melanggar CSP script-src 'self'
document.querySelectorAll("link[data-deferred-css]").forEach((link) => {
  link.media = "all";
});

// CSP publik tidak mengizinkan eval. Zod 4 default JIT memakai Function().
// shortcut: jitless global, cukup sampai CSP butuh nonce/script dinamis.
z.config({ jitless: true });
import App from "./App.jsx";
import { ToastHost } from "./components/ui/Toast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Konfigurasi global TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // ponytail: 1 menit cukup antar-navigasi; naikkan ke 5–10 menit bila
      // masih terasa berat, atau tambahkan per-query untuk data yang jarang berubah
      staleTime: 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
            <ToastHost />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
