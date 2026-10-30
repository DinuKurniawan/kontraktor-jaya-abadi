/*
 * BeforeAfterSection — slider perbandingan foto (handle tengah, drag mouse/sentuh,
 * keyboard panah), label Sebelum/Sesudah, navigasi panah + thumbnail,
 * tombol "Lihat proyek" bila item punya relasi proyek. Tanpa library eksternal.
 * Data: GET /api/public/before-after.
 */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import SectionHeading from "../SectionHeading.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// Slider satu item: "sebelum" di bawah, "sesudah" terpotong dari kiri (clip-path)
function CompareSlider({ item }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(50); // persen handle dari kiri
  const dragging = useRef(false);

  const move = (clientX) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      ref={ref}
      // Genggam bebas: pointer events menangani mouse + sentuh sekaligus
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => { dragging.current = false; }}
      className="relative aspect-[16/10] cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl shadow-soft-lg"
    >
      <img src={img(item.beforeImage)} alt={`Sebelum: ${item.title}`} draggable="false"
        className="absolute inset-0 h-full w-full object-cover" />
      <img src={img(item.afterImage)} alt={`Sesudah: ${item.title}`} draggable="false"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
      {/* Handle */}
      <div
        role="slider" tabIndex={0} aria-label={`Perbandingan sebelum-sesudah ${item.title}`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((v) => Math.max(0, v - 5));
          if (e.key === "ArrowRight") setPos((v) => Math.min(100, v + 5));
        }}
        className="absolute inset-y-0 focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-brand"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-soft" />
        <span className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-ink/80 text-white backdrop-blur-sm">
          <ChevronLeft size={16} /><ChevronRight size={16} className="-ml-1.5" />
        </span>
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">Sebelum</span>
      <span className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Sesudah</span>
    </div>
  );
}

export default function BeforeAfterSection() {
  const { data } = useQuery({
    queryKey: ["public-before-after"],
    queryFn: async () => (await api.get("/public/before-after")).data.data,
  });
  const rows = data ?? [];
  const [i, setI] = useState(0);
  if (rows.length === 0) return null;
  const item = rows[i % rows.length];
  const move = (d) => setI((v) => (v + d + rows.length) % rows.length);

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container>
        <SectionHeading title={<>Sebelum &amp; <span className="text-brand">Sesudah</span></>} />
        <div className="grid items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CompareSlider key={item.id} item={item} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">
              Proyek {(i % rows.length) + 1} / {rows.length}
            </p>
            <h3 key={item.id} className="mt-2 animate-fade-in font-jakarta text-2xl font-extrabold text-ink">{item.title}</h3>
            {item.location && <p className="mt-1 text-sm text-ink-soft">{item.location}</p>}
            {item.project && (
              <Link
                to={`/proyek/${item.project.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
              >
                Lihat proyek <ExternalLink size={14} />
              </Link>
            )}
            {/* Navigasi */}
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => move(-1)} aria-label="Sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-soft transition hover:bg-brand hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => move(1)} aria-label="Berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-soft transition hover:bg-brand hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Thumbnail */}
            <div className="mt-5 flex flex-wrap gap-2">
              {rows.map((r, idx) => (
                <button key={r.id} type="button" onClick={() => setI(idx)} aria-label={`Tampilkan ${r.title}`}
                  className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition ${idx === i % rows.length ? "border-brand opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img(r.afterImage)} alt="" width={80} height={56} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
