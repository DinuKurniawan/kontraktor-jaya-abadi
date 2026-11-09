/*
 * ProjectsMap — wrapper lazy load untuk peta proyek berbasis react-leaflet.
 * Data peta memakai endpoint khusus tanpa pagination agar semua titik hasil
 * filter tampil sekaligus.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const ProjectsMapClient = lazy(() => import("./ProjectsMapClient.jsx"));

function MapLoading({ visible = false }) {
  return (
    <div
      className="mt-8 flex h-[420px] min-h-[420px] items-center justify-center rounded-2xl bg-cream-deep sm:h-[520px] sm:min-h-[520px]"
      aria-busy={visible}
    >
      <span className="text-sm font-semibold text-ink-soft">{visible ? "Memuat peta…" : "Peta proyek"}</span>
    </div>
  );
}

export default function ProjectsMap(props) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="min-h-[452px] sm:min-h-[552px]">
      {visible ? (
        <Suspense fallback={<MapLoading visible />}>
          <ProjectsMapClient {...props} />
        </Suspense>
      ) : <MapLoading />}
    </div>
  );
}
