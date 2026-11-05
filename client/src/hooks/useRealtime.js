// Hook global untuk mendengarkan Server-Sent Events (SSE) dan otomatis
// meng-invalidate cache React Query sehingga halaman publik dan admin real-time tanpa refresh.
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

// Pemetaan nama resource dari server ke daftar queryKey React Query yang harus di-refresh
const RESOURCE_QUERY_MAP = {
  projects: [
    ["projects"],
    ["project"],
    ["public-projects"],
    ["public-project"],
    ["public-featured-projects"],
    ["public-projects-featured"],
    ["public-projects-map"],
    ["public-projects-photo-1"],
    ["public-projects-photo-3"],
    ["public-project-stats"],
    ["public-related-projects"],
    ["public-related-projects-counts"],
    ["dashboard"],
    ["before-after"],
  ],
  posts: [
    ["posts"],
    ["post"],
    ["public-posts"],
    ["public-post"],
    ["public-tags"],
    ["public-categories-post"],
    ["public-post-category-facets"],
    ["public-posts-suggestions"],
    ["public-posts-popular-sidebar"],
    ["public-posts-featured"],
    ["public-posts-latest"],
    ["dashboard"],
  ],
  categories: [
    ["categories"],
    ["public-categories"],
    ["public-categories-post"],
    ["public-categories-project"],
    ["public-post-category-facets"],
    ["projects"],
    ["posts"],
    ["public-projects"],
    ["public-posts"],
  ],
  services: [
    ["services"],
    ["service"],
    ["public-services"],
    ["public-service"],
    ["public-services-grid"],
    ["public-service-categories"],
    ["service-categories"],
    ["service-packages"],
    ["admin-services-message-filter"],
    ["dashboard"],
  ],
  "service-categories": [
    ["service-categories"],
    ["services"],
    ["public-services"],
    ["public-services-grid"],
    ["public-service-categories"],
  ],
  "service-packages": [["service-packages"], ["public-services"]],
  testimonials: [
    ["testimonials"],
    ["public-testimonials"],
    ["public-services"],
  ],
  team: [["team"], ["public-team"]],
  partners: [["partners"], ["public-partners"]],
  certificates: [["certificates"], ["public-certificates"]],
  faqs: [["faqs"], ["public-faqs"], ["public-contact-faqs"]],
  features: [["features"], ["public-features"]],
  "process-steps": [["process-steps"], ["public-process-steps"]],
  "before-after": [["before-after"], ["public-before-after"]],
  "estimate-prices": [["estimate-prices"], ["public-estimate-prices"]],
  subscribers: [["admin-subscribers"]],
  milestones: [["milestones"], ["public-milestones"]],
  "core-values": [["core-values"], ["public-core-values"]],
  gallery: [["gallery"], ["public-gallery"]],
  "hero-slides": [["hero-slides"], ["public-hero-slides"], ["hero-slides-public"]],
  branches: [["admin-branches"], ["public-branches"]],
  messages: [
    ["messages"],
    ["message"],
    ["unread-count"],
    ["admin-messages"],
    ["dashboard"],
  ],
  settings: [["settings"], ["public-settings"]],
  users: [["users"], ["me"]],
  tags: [
    ["tags"],
    ["public-tags"],
    ["posts"],
    ["public-posts"],
  ],
  media: [["media"], ["media-usage"]],
};

export function useRealtime() {
  const queryClient = useQueryClient();
  const esRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout;
    let isActive = true;

    function connect() {
      if (!isActive) return;

      try {
        const es = new EventSource(`${SERVER}/api/realtime/stream`, { withCredentials: true });
        esRef.current = es;

        es.addEventListener("change", (e) => {
          try {
            const data = JSON.parse(e.data);
            const { resource } = data;

            const queryKeys = RESOURCE_QUERY_MAP[resource];
            if (queryKeys && queryKeys.length > 0) {
              queryKeys.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key });
              });
            } else {
              // Jika resource belum terdaftar, invalidate query sesuai nama resourcenya
              queryClient.invalidateQueries({ queryKey: [resource] });
              queryClient.invalidateQueries({ queryKey: [`public-${resource}`] });
            }
          } catch (err) {
            console.error("Gagal memproses event real-time:", err);
          }
        });

        es.onerror = () => {
          es.close();
          // Coba reconnect setelah 5 detik jika koneksi terputus
          if (isActive) {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };
      } catch (err) {
        if (isActive) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isActive = false;
      clearTimeout(reconnectTimeout);
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, [queryClient]);
}
