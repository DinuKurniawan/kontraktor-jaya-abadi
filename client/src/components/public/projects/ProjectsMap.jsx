/*
 * ProjectsMap — wrapper lazy load untuk peta proyek berbasis react-leaflet.
 * Data peta memakai endpoint khusus tanpa pagination agar semua titik hasil
 * filter tampil sekaligus.
 */
import { lazy, Suspense } from "react";

const ProjectsMapClient = lazy(() => import("./ProjectsMapClient.jsx"));

function MapLoading() {
  return (
    <div className="mt-8 flex h-[420px] items-center justify-center animate-pulse rounded-2xl bg-cream-deep sm:h-[520px]">
      <span className="text-sm font-semibold text-ink-soft">Memuat peta…</span>
    </div>
  );
}

export default function ProjectsMap(props) {
  return (
    <Suspense fallback={<MapLoading />}>
      <ProjectsMapClient {...props} />
    </Suspense>
  );
}
