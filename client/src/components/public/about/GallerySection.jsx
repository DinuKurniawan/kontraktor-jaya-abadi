/*
 * GallerySection — filter kategori (tab), grid 12/halaman (4/3/2 kolom),
 * pagination server-side (meta), lightbox panah/swipe/Esc + penghitung.
 * Kategori & halaman di query string (?kategori=&hal=) — share & Back aman.
 * Data: GET /api/public/gallery?category=&page=&limit=12 → { data, meta }.
 * id="galeri" (anchor AboutBanner).
 */
import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import Pagination from "../Pagination.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const CATEGORY_KEYS = ["KEGIATAN", "PROYEK", "KANTOR", "PENGHARGAAN"];
const CATEGORIES = [["", "Semua"], ["KEGIATAN", "Kegiatan"], ["PROYEK", "Proyek"], ["KANTOR", "Kantor"], ["PENGHARGAAN", "Penghargaan"]];
const LIMIT = 12;

export default function GallerySection() {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();
  const grid = useRef(null);
  const touchX = useRef(null);
  const [zoom, setZoom] = useState(null); // indeks foto di halaman aktif

  const urlCat = sp.get("kategori") ?? "";
  const category = CATEGORY_KEYS.includes(urlCat) ? urlCat : undefined;
  const page = Math.max(1, Number.parseInt(sp.get("hal"), 10) || 1);

  const { data, isFetching } = useQuery({
    queryKey: ["public-gallery", category ?? "all", page],
    queryFn: async () =>
      (await api.get("/public/gallery", { params: { category, page, limit: LIMIT } })).data,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  // Set params: kategori selalu reset ke halaman 1; halaman menyertakan kategori
  const setParams = (cat, pg) => {
    const next = {};
    if (cat) next.kategori = cat;
    if (pg > 1) next.hal = String(pg);
    setSp(next, { replace: false });
  };
  const setPage = (pg) => {
    setParams(urlCat, pg);
    // Scroll halus ke atas section (kompensasi navbar + sub-navigasi sticky)
    grid.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  };

  // Prefetch halaman berikutnya
  useEffect(() => {
    const next = meta?.totalPages && page < meta.totalPages ? page + 1 : null;
    if (!next) return;
    qc.prefetchQuery({
      queryKey: ["public-gallery", category ?? "all", next],
      queryFn: async () =>
        (await api.get("/public/gallery", { params: { category, page: next, limit: LIMIT } })).data,
    });
  }, [qc, category, page, meta?.totalPages]);

  // Esc untuk lightbox
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight" && zoom !== null) setZoom((z) => (z + 1) % rows.length);
      if (e.key === "ArrowLeft" && zoom !== null) setZoom((z) => (z - 1 + rows.length) % rows.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, rows.length]);

  return (
    <section id="galeri" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Galeri</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Momen di balik <span className="text-brand">layar proyek</span></h2>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(([v, label]) => (
            <button key={v || "all"} type="button" aria-pressed={urlCat === v}
              onClick={() => { setParams(v, 1); setZoom(null); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${urlCat === v ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Grid — min-height stabil agar tak melompat antar halaman */}
        <div ref={grid} className={`mt-8 grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 lg:grid-cols-4 ${isFetching ? "opacity-60" : ""}`}>
          {!data ? (
            [...Array(LIMIT)].map((_, i) => <div key={i} aria-hidden className="aspect-[4/3] animate-pulse rounded-xl bg-cream-deep" />)
          ) : rows.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-2 py-12 text-center text-ink-light">
              <ImageOff size={28} className="text-ink/30" />
              <p className="text-sm font-semibold">Belum ada foto di kategori ini</p>
            </div>
          ) : (
            rows.map((g, i) => (
              <button key={g.id} type="button" onClick={() => setZoom(i)} aria-label={`Perbesar ${g.caption ?? "foto"}`}
                className="group relative overflow-hidden rounded-xl">
                <img src={img(g.image)} alt={g.caption ?? "Galeri"} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                {g.caption && (
                  <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                    <span className="text-left text-xs font-semibold text-white">{g.caption}</span>
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Pagination + ringkasan (sembunyi bila total ≤ 12) */}
        {meta && meta.total > LIMIT && (
          <div className="mt-8 space-y-3">
            <Pagination label="Paginasi galeri" page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
            <p className="text-center text-xs text-ink-light" aria-live="polite">
              Menampilkan {(meta.page - 1) * LIMIT + 1}–{Math.min(meta.page * LIMIT, meta.total)} dari {meta.total} foto
            </p>
          </div>
        )}
      </Container>

      {/* Lightbox halaman aktif: panah, swipe, Esc, penghitung */}
      {zoom !== null && rows[zoom] && (
        <div role="dialog" aria-modal="true" aria-label={rows[zoom].caption ?? "Foto galeri"}
          onClick={() => setZoom(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) setZoom((z) => (z + (dx < 0 ? 1 : -1) + rows.length) % rows.length);
            touchX.current = null;
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm">
          <img src={img(rows[zoom].image)} alt={rows[zoom].caption ?? ""} className="max-h-[82vh] max-w-full rounded-2xl shadow-soft-lg" />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
            {zoom + 1} / {rows.length}{rows[zoom].caption ? ` — ${rows[zoom].caption}` : ""}
          </p>
          <button type="button" aria-label="Foto sebelumnya" onClick={(e) => { e.stopPropagation(); setZoom((zoom - 1 + rows.length) % rows.length); }}
            className="absolute left-4 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30"><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Foto berikutnya" onClick={(e) => { e.stopPropagation(); setZoom((zoom + 1) % rows.length); }}
            className="absolute right-4 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30"><ChevronRight size={20} /></button>
          <button type="button" onClick={() => setZoom(null)} aria-label="Tutup"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30"><X size={20} /></button>
        </div>
      )}
    </section>
  );
}
