import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

// ponytail: aktifkan stylesheet non-render-blocking via module JS agar tidak melanggar CSP script-src 'self'
document.querySelectorAll("link[data-deferred-css]").forEach((link) => {
  link.media = "all";
});

import App from "./App.jsx";
import { ToastHost } from "./components/ui/Toast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Konfigurasi global TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Data publik sudah cache HTTP 5 menit; samakan cache klien agar mount ulang
      // tidak mengirim request duplikat. Turunkan per-query bila data harus lebih segar.
      staleTime: 5 * 60 * 1000,
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
