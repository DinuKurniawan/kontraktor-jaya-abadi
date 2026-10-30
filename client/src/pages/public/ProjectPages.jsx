// Proyek — daftar (filter kategori/status/search tersinkron URL + muat lebih banyak)
// dan detail (galeri + lightbox, info tabel, deskripsi, serupa)
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import PillButton from "../../components/public/PillButton.jsx";
import Breadcrumb from "../../components/public/Breadcrumb.jsx";
import ProjectCard from "../../components/public/ProjectCard.jsx";
import Seo from "../../components/public/Seo.jsx";
import { STATUS_LABEL } from "./project-labels.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const STATUS_FILTERS = [
  { label: "Semua status", value: "" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Berjalan", value: "ONGOING" },
  { label: "Perencanaan", value: "PLANNING" },
];

export function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("kategori") ?? "";
  const status = params.get("status") ?? "";
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);

  const setParam = (key) => (value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-projects", { page, search, category, status }],
    queryFn: async () => (await api.get("/public/projects", { params: { page, limit: 8, search: search || undefined, category: category || undefined, status: status || undefined } })).data,
  });

  // Akumulasi hasil untuk "Muat lebih banyak"; reset saat filter berubah
  useEffect(() => setItems([]), [search, category, status]);
  useEffect(() => {
    if (data?.data && page === 1) setItems(data.data);
    else if (data?.data) setItems((prev) => (data.data.some((p) => p.id === prev[0]?.id) ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const { data: cats } = useQuery({
    queryKey: ["public-categories-project"],
    queryFn: async () => (await api.get("/public/categories", { params: { type: "PROJECT", limit: 20 } })).data.data,
  });

  return (
    <>
      <Seo path="/proyek" title="Proyek" description="Portofolio bangunan yang kami selesaikan dan yang sedang berjalan." />
      <PageBanner
        title={<>Proyek <span className="text-brand">Kami</span></>}
        crumbs={[{ label: "Proyek" }]}
        description="Portofolio bangunan yang kami selesaikan dan yang sedang berjalan."
      />
      <Container className="py-14">
        {/* Filter bar */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setParam("q")(e.target.value)}
              placeholder="Cari judul atau lokasi…"
              aria-label="Cari proyek"
              className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand"
            />
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
          </div>

          {/* Tab status */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setParam("status")(f.value)}
                aria-pressed={status === f.value}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${status === f.value ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Pill kategori */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
            <button
              type="button"
              onClick={() => setParam("kategori")("")}
              aria-pressed={category === ""}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${category === "" ? "border-brand bg-brand text-white" : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"}`}
            >
              Semua
            </button>
            {(cats ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setParam("kategori")(c.slug)}
                aria-pressed={category === c.slug}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${category === c.slug ? "border-brand bg-brand text-white" : "border-ink/15 text-ink-soft hover:border-brand hover:text-brand"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="animate-pulse rounded-2xl bg-cream-deep aspect-[4/5]" />)}
          </div>
        ) : isError ? (
          <p className="mt-10 text-center text-sm text-danger">Gagal memuat proyek. Coba muat ulang halaman.</p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-light">Tidak ada proyek yang cocok dengan filter.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <Link key={p.id} to={`/proyek/${p.slug}`} className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                <ProjectCard title={p.title} location={p.location} category={p.category?.name} image={img(p.coverImage)} />
              </Link>
            ))}
          </div>
        )}

        {data && items.length < data.meta.total && (
          <div className="mt-10 text-center">
            <PillButton variant="dark" onClick={() => setPage((p) => p + 1)}>Muat lebih banyak</PillButton>
          </div>
        )}
      </Container>
    </>
  );
}

// ===== Detail =====
function Lightbox({ images, index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(-1);
      if (e.key === "ArrowRight") onMove(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onMove]);

  const current = images[index];
  if (!current) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Galeri foto" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20">
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Sebelumnya" onClick={(e) => { e.stopPropagation(); onMove(-1); }} className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronLeft size={22} />
          </button>
          <button type="button" aria-label="Berikutnya" onClick={(e) => { e.stopPropagation(); onMove(1); }} className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronRight size={22} />
          </button>
        </>
      )}
      <figure onClick={(e) => e.stopPropagation()} className="max-w-4xl">
        <img src={img(current.url)} alt={current.caption ?? ""} className="max-h-[80vh] rounded-xl object-contain" />
        {current.caption && <figcaption className="mt-2 text-center text-sm text-white/70">{current.caption}</figcaption>}
      </figure>
    </div>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState(null); // index foto | null

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["public-project", slug],
    queryFn: async () => (await api.get(`/public/projects/${slug}`)).data.data,
    retry: false,
  });

  if (isError) {
    const is404 = error?.response?.status === 404;
    return (
      <>
        <PageBanner title="Proyek tidak ditemukan" crumbs={[{ label: "Proyek", to: "/proyek" }, { label: "404" }]} />
        <Container className="py-16 text-center">
          <p className="text-ink-soft">{is404 ? "Proyek yang Anda cari tidak ada atau belum dipublikasikan." : "Gagal memuat. Coba muat ulang halaman."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <PillButton variant="outline" to="/proyek">Semua Proyek</PillButton>
            <PillButton variant="primary" to="/">Beranda</PillButton>
          </div>
        </Container>
      </>
    );
  }

  if (isLoading || !project) {
    return (
      <>
        <PageBanner title="…" crumbs={[{ label: "Proyek", to: "/proyek" }]} />
        <Container className="py-14">
          <div className="aspect-[16/9] animate-pulse rounded-2xl bg-cream-deep" />
          <div className="mt-6 h-4 w-2/3 animate-pulse rounded bg-cream-deep" />
        </Container>
      </>
    );
  }

  const gallery = project.images ?? [];
  const info = [
    ["Klien", project.clientName],
    ["Lokasi", project.location],
    ["Tahun", project.year],
    ["Status", STATUS_LABEL[project.status] ?? project.status],
    ...(project.value ? [["Nilai Kontrak", project.value]] : []),
  ];

  return (
    <>
      <Seo
        path={`/proyek/${slug}`}
        title={project.title}
        description={project.summary}
        type="article"
        image={img(project.coverImage) || undefined}
      />
      <Container className="pt-10">
        <Breadcrumb items={[{ label: "Proyek", to: "/proyek" }, { label: project.title }]} />
        <h1 className="mt-3 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">{project.title}</h1>
        <p className="mt-2 text-ink-soft">{project.summary}</p>
      </Container>

      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        {/* Galeri */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={() => gallery.length > 0 && setLightbox(0)}
            className="block w-full overflow-hidden rounded-2xl"
            aria-label="Perbesar foto utama"
          >
            <img src={img(project.coverImage)} alt={project.title} className="aspect-[16/10] w-full object-cover" />
          </button>
          {gallery.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[project.coverImage, ...gallery.map((g) => g.url)].slice(0, 8).map((url, i) => (
                <button key={i} type="button" onClick={() => setLightbox(Math.max(0, i - 1))} className="overflow-hidden rounded-xl" aria-label={`Lihat foto ${i + 1}`}>
                  <img src={img(url)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition hover:scale-105" />
                </button>
              ))}
            </div>
          )}
          <div className="prose-jaya mt-8 whitespace-pre-line leading-relaxed text-ink-soft">{project.description}</div>
        </div>

        {/* Info tabel */}
        <aside className="space-y-8">
          <dl className="divide-y divide-ink/8 rounded-2xl bg-white p-5 shadow-soft">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <dt className="text-ink-light">{k}</dt>
                <dd className="text-right font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-2xl bg-brand p-5 text-white">
            <h3 className="font-jakarta font-bold">Punya proyek serupa?</h3>
            <PillButton variant="dark" to="/kontak" className="mt-3 w-full !py-2.5">Konsultasi Gratis</PillButton>
          </div>
        </aside>
      </Container>

      {/* Proyek serupa */}
      {(project.related ?? []).length > 0 && (
        <section className="bg-cream-deep py-14">
          <Container>
            <h2 className="mb-7 font-jakarta text-2xl font-extrabold text-ink">Proyek <span className="text-brand">Serupa</span></h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {project.related.map((p) => (
                <Link key={p.id} to={`/proyek/${p.slug}`}>
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                    <img src={img(p.coverImage)} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  </div>
                  <p className="mt-2.5 font-jakarta font-bold text-ink">{p.title}</p>
                  <p className="text-xs text-ink-light">{p.location}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {lightbox !== null && gallery.length > 0 && (
        <Lightbox
          images={[{ url: project.coverImage }, ...gallery].map((g) => ({ url: g.url ?? g, caption: g.caption }))}
          index={lightbox + 1}
          onClose={() => setLightbox(null)}
          onMove={(d) => setLightbox((v) => (v + d + gallery.length) % gallery.length)}
        />
      )}
    </>
  );
}
