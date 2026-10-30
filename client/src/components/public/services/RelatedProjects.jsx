/*
 * RelatedProjects — tab layanan (Semua + per layanan, tab tanpa proyek disembunyikan),
 * carousel ProjectCard (arrows + dots, scroll-snap), tombol "Lihat semua proyek".
 * Data: GET /api/public/projects?service=<slug>&limit=8.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import ProjectCard from "../ProjectCard.jsx";
import Reveal from "./Reveal.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

const STATUS_LABEL = { PLANNING: "Perencanaan", ONGOING: "Berjalan", COMPLETED: "Selesai" };

export default function RelatedProjects({ services }) {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [tab, setTab] = useState(""); // "" = Semua

  const { data, isLoading } = useQuery({
    queryKey: ["public-related-projects", tab],
    queryFn: async () => (await api.get("/public/projects", { params: { limit: 8, ...(tab ? { service: tab } : {}) } })).data,
  });
  const rows = data?.data ?? [];

  // Sembunyikan tab yang tidak punya proyek — cek total per layanan sekali ("Semua" selalu tampil)
  const { data: allData } = useQuery({
    queryKey: ["public-related-projects-counts"],
    queryFn: async () => (await api.get("/public/projects", { params: { limit: 60 } })).data,
  });
  const counts = allData ?? { data: [] };
  const visibleServices = (services ?? []).filter((s) => (counts.data ?? []).some((p) => p.serviceId === s.id));

  // Kembali ke awal track saat ganti tab
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    setDot(0);
  }, [tab]);
  const [dot, setDot] = useState(0);
  const perView = () => (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1);
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const upd = () => setDotCount(Math.max(1, Math.ceil(rows.length / perView())));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, [rows.length]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = trackRef.current;
    if (el) setDot(Math.round(el.scrollLeft / el.clientWidth));
  };
  const jump = (i) => trackRef.current?.scrollTo({ left: i * trackRef.current.clientWidth, behavior: "smooth" });

  return (
    <section id="proyek" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Portofolio</p>
            <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Proyek <span className="text-brand">terkait layanan</span></h2>
          </div>
          {/* Tab layanan — sisip di kanan judul, geser di mobile */}
          <div role="tablist" aria-label="Filter proyek per layanan" className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" role="tab" aria-selected={tab === ""} onClick={() => setTab("")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "" ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              Semua
            </button>
            {visibleServices.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={tab === s.slug} onClick={() => setTab(s.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === s.slug ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-cream-deep" aria-hidden />)}
          </div>
        ) : rows.length === 0 ? null : (
          <>
            <div className="relative mt-8">
              <div ref={trackRef} onScroll={onScroll}
                className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rows.map((p, i) => (
                  <Reveal key={p.id} delay={Math.min(i, 3) * 70} className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]">
                    <ProjectCard
                      title={p.title} location={p.location} year={p.year}
                      image={p.coverImage?.startsWith("http") ? p.coverImage : `${SERVER}${p.coverImage}`}
                      category={p.category?.name} badge={STATUS_LABEL[p.status]}
                      onClick={() => navigate(`/proyek/${p.slug}`)}
                    />
                  </Reveal>
                ))}
              </div>
              {/* Panah */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => scrollBy(-1)} aria-label="Geser kiri"
                  className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={() => scrollBy(1)} aria-label="Geser kanan"
                  className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand">
                  <ChevronRight size={18} />
                </button>
              </div>
              {/* Dots */}
              {dotCount > 1 && (
                <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Posisi carousel">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <button key={i} type="button" role="tab" aria-selected={dot === i} aria-label={`Halaman ${i + 1}`} onClick={() => jump(i)}
                      className="flex h-6 w-6 items-center justify-center">
                      <span className={`rounded-full transition-all ${dot === i ? "h-2 w-6 bg-brand" : "h-2 w-2 bg-ink/20 hover:bg-ink/40"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <a href="/proyek" className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-6 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">
                Lihat semua proyek <ChevronRight size={16} />
              </a>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
