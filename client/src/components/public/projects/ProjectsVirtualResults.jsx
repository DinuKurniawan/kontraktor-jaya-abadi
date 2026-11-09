/*
 * ProjectsVirtualResults — hasil proyek (grid/daftar) dengan virtualisasi window.
 * Data dipotong per baris sesuai jumlah kolom responsif, lalu hanya baris yang
 * terlihat yang dirender (react-virtual). Tinggi tiap baris diukur ulang lewat
 * measureElement agar judul 1–2 baris tetap rapi.
 */
import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import ProjectCardV2 from "./ProjectCardV2.jsx";
import ProjectListItem from "./ProjectListItem.jsx";

// Breakpoint sama dengan kelas grid Tailwind (grid-cols-2 md:3 lg:4).
function useColumns() {
  const [columns, setColumns] = useState(2);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setColumns(lg.matches ? 4 : md.matches ? 3 : 2);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return columns;
}

export default function ProjectsVirtualResults({ rows, mode = "grid", dimmed = false }) {
  const responsiveColumns = useColumns();
  const columns = mode === "daftar" ? 1 : responsiveColumns;
  const rowCount = Math.ceil(rows.length / columns);

  const listRef = useRef(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const update = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (mode === "daftar" ? 200 : 360),
    overscan: 3,
    scrollMargin,
    getItemKey: (index) => rows[index * columns]?.id ?? index,
  });

  // Jumlah kolom berubah → kunci baris berubah, ukur ulang semua baris.
  useEffect(() => {
    virtualizer.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, mode]);

  return (
    <div
      ref={listRef}
      className={`mt-10 relative transition-opacity ${dimmed ? "opacity-60" : ""}`}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columns;
        const items = rows.slice(start, start + columns);
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className={
              mode === "daftar"
                ? "absolute inset-x-0 top-0 pb-4"
                : "absolute inset-x-0 top-0 grid grid-cols-2 gap-x-6 pb-6 md:grid-cols-3 lg:grid-cols-4"
            }
            style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
          >
            {items.map((project) =>
              mode === "daftar" ? (
                <ProjectListItem key={project.id} project={project} />
              ) : (
                <ProjectCardV2 key={project.id} project={project} />
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
