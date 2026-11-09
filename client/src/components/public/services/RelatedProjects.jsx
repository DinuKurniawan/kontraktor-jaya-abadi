/*
 * RelatedProjects — tab layanan (Semua + per layanan, tab tanpa proyek disembunyikan),
 * grid kartu proyek 8 per halaman + paginasi (muncul bila total > 8),
 * tombol "Lihat semua proyek".
 * Data: GET /api/public/projects?service=<slug>&page=&limit=8.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import ProjectCard from "../ProjectCard.jsx";
import Pagination from "../Pagination.jsx";
import Reveal from "./Reveal.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

const STATUS_LABEL = { PLANNING: "Perencanaan", ONGOING: "Berjalan", COMPLETED: "Selesai" };

const PER_PAGE = 8; // jumlah kartu per halaman

export default function RelatedProjects({ services, tone = "white" }) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [tab, setTab] = useState(""); // "" = Semua
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-related-projects", tab, page],
    queryFn: async () =>
      (await api.get("/public/projects", { params: { limit: PER_PAGE, page, ...(tab ? { service: tab } : {}) } })).data,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  // Sembunyikan tab yang tidak punya proyek — cek total per layanan sekali ("Semua" selalu tampil)
  const { data: allData } = useQuery({
    queryKey: ["public-related-projects-counts"],
    queryFn: async () => (await api.get("/public/projects", { params: { limit: 60 } })).data,
  });
  const counts = allData ?? { data: [] };
  const visibleServices = (services ?? []).filter((s) => (counts.data ?? []).some((p) => p.serviceId === s.id));

  // Ganti tab → kembali ke halaman pertama
  const changeTab = (slug) => {
    setTab(slug);
    setPage(1);
  };

  // Ganti halaman → gulir ke awal section agar kartu baru langsung terlihat
  const changePage = (next) => {
    setPage(next);
    const el = sectionRef.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  };

  // Data halaman berkurang (mis. setelah filter) → jaga halaman tetap valid
  useEffect(() => {
    if (meta && page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, page]);

  return (
    <section ref={sectionRef} id="proyek" className={`scroll-mt-32 ${tone === "cream" ? "bg-cream" : "bg-white"} py-16 sm:py-20`}>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Portofolio</p>
            <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Proyek <span className="text-brand">terkait layanan</span></h2>
          </div>
          {/* Tab layanan — sisip di kanan judul, geser di mobile */}
          <div role="group" aria-label="Filter proyek per layanan" className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" aria-pressed={tab === ""} onClick={() => changeTab("")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "" ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              Semua
            </button>
            {visibleServices.map((s) => (
              <button key={s.id} type="button" aria-pressed={tab === s.slug} onClick={() => changeTab(s.slug)}
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
            {/* Grid kartu proyek — semua kartu tampil tanpa scroll */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {rows.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 3) * 70}>
                  <ProjectCard
                    title={p.title} location={p.location} year={p.year}
                    image={p.coverImage?.startsWith("http") ? p.coverImage : `${SERVER}${p.coverImage}`}
                    category={p.category?.name} badge={STATUS_LABEL[p.status]}
                    onClick={() => navigate(`/proyek/${p.slug}`)}
                  />
                </Reveal>
              ))}
            </div>

            {/* Paginasi hanya bila kartu lebih dari satu halaman */}
            {meta && meta.total > PER_PAGE && (
              <div className="mt-10">
                <Pagination page={meta.page} totalPages={meta.totalPages} onChange={changePage} label="Paginasi proyek terkait" />
              </div>
            )}

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
