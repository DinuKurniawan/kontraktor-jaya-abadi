/*
 * FeaturedProjectsStrip — carousel besar proyek unggulan (1 slide per layar).
 * Slide: foto + judul, lokasi, luas, durasi, tombol "Lihat proyek".
 * Navigasi: panah, titik, dan geser sentuh (scroll-snap horizontal native).
 * Data: GET /api/public/projects?featured=true.
 * Komponen menyembunyikan diri bila tidak ada proyek unggulan.
 */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const num = (v) => Number(v).toLocaleString("id-ID");

export default function FeaturedProjectsStrip() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-featured-projects"],
    queryFn: async () => (await api.get("/public/projects", { params: { featured: true, limit: 8 } })).data,
  });

  const rows = data?.data ?? [];

  // Tidak ada unggulan (atau gagal memuat) → tidak merender apa pun
  if (isLoading || isError || rows.length === 0) return null;

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const target = Math.max(0, Math.min(rows.length - 1, i));
    const card = el.children[target];
    const baseOffset = el.children[0].offsetLeft;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - baseOffset, behavior: "smooth" });
    }
    setIndex(target);
  };
  const step = (dir) => goTo(index + dir);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const baseOffset = el.children[0].offsetLeft;
    const scrollLeft = el.scrollLeft;
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const cardPos = el.children[i].offsetLeft - baseOffset;
      const diff = Math.abs(cardPos - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    setIndex(closest);
  };

  return (
    <section className="bg-cream py-14 sm:py-16" aria-labelledby="proyek-unggulan">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Pilihan kami</p>
            <h2 id="proyek-unggulan" className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">
              Proyek <span className="text-brand">Unggulan</span>
            </h2>
          </div>

          {/* Panah — disembunyikan di layar sangat kecil, geser sentuh tetap tersedia */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index === 0}
              aria-label="Proyek sebelumnya"
              className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={index >= rows.length - 1}
              aria-label="Proyek berikutnya"
              className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Track carousel */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Proyek unggulan"
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {rows.map((p, i) => (
            <article
              key={p.id}
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${rows.length}: ${p.title}`}
              className="flex h-[700px] w-[645px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-soft"
            >
              {/* Foto — memenuhi area tanpa ruang kosong */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-deep">
                <img
                  src={img(p.coverImage)}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                  style={p.coverImagePosition ? { objectPosition: p.coverImagePosition } : undefined}
                />
                {p.category?.name && (
                  <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold text-ink backdrop-blur">
                    {p.category.name}
                  </span>
                )}
              </div>

              {/* Info di bawah gambar (bukan overlay) */}
              <div className="flex shrink-0 flex-col gap-3 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Proyek unggulan</p>
                <h3 className="line-clamp-2 font-jakarta text-xl font-extrabold leading-snug text-ink">
                  {p.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                  {p.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} className="text-brand" /> {p.location}
                    </span>
                  )}
                  {p.area ? (
                    <span className="inline-flex items-center gap-1">
                      <Ruler size={13} className="text-brand" /> {num(p.area)} m²
                    </span>
                  ) : null}
                  {p.durationMonths ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} className="text-brand" /> {num(p.durationMonths)} bulan
                    </span>
                  ) : null}
                </div>
                {p.summary && <p className="line-clamp-2 text-sm leading-relaxed text-ink-light">{p.summary}</p>}
                <div>
                  <Link
                    to={`/proyek/${p.slug}`}
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-jakarta text-xs font-semibold text-cream transition-colors hover:bg-brand"
                  >
                    Lihat proyek <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Titik navigasi */}
        {rows.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Posisi carousel proyek unggulan">
            {rows.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span className={`rounded-full transition-all ${index === i ? "h-2 w-6 bg-brand" : "h-2 w-2 bg-ink/20 hover:bg-ink/40"}`} />
              </button>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
