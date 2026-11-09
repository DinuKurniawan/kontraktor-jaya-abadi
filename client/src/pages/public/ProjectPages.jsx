// Proyek — daftar (filter kategori/status/search + pagination tersinkron URL)
// dan detail (hero, info ikon, galeri + lightbox, bagikan, deskripsi, serupa)
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Layers,
  Loader2,
  MapPin,
  MessageCircle,
  Play,
  Ruler,
  SearchX,
  Send,
  Share2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import Reveal from "../../components/public/Reveal.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import ProjectsBanner from "../../components/public/projects/ProjectsBanner.jsx";
import FeaturedProjectsStrip from "../../components/public/projects/FeaturedProjectsStrip.jsx";
import ProjectFilterBar from "../../components/public/projects/ProjectFilterBar.jsx";
import ProjectCardV2 from "../../components/public/projects/ProjectCardV2.jsx";
import ProjectListItem from "../../components/public/projects/ProjectListItem.jsx";
import ProjectGallery from "../../components/public/projects/ProjectGallery.jsx";
import ProjectsMap from "../../components/public/projects/ProjectsMap.jsx";
import ProjectsCta from "../../components/public/projects/ProjectsCta.jsx";
import { useSiteSettings } from "../../components/public/home/HeroSection.jsx";
import PillButton from "../../components/public/PillButton.jsx";
import Pagination from "../../components/public/Pagination.jsx";
import Breadcrumb from "../../components/public/Breadcrumb.jsx";
import Seo from "../../components/public/Seo.jsx";
import { STATUS_LABEL } from "./project-labels.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const LIMIT = 12;
const STATUS_BADGE = {
  COMPLETED: "border-emerald-700/20 bg-emerald-700 text-white",
  ONGOING: "border-amber-700/20 bg-amber-700 text-white",
  PLANNING: "border-gray-400/20 bg-gray-200 text-gray-800",
};

const num = (value) => Number(value).toLocaleString("id-ID");
const ProjectLocationMap = lazy(() => import("../../components/public/projects/ProjectLocationMap.jsx"));

function projectQueryParams({ page, q, layanan, tahun, kategori, status, urutan }) {
  return {
    page,
    limit: LIMIT,
    search: q || undefined,
    service: layanan || undefined,
    year: tahun || undefined,
    category: kategori || undefined,
    status: status || undefined,
    sort: urutan,
  };
}

function projectQueryKey(filters) {
  return ["public-projects", filters];
}

async function fetchProjects(filters) {
  return (await api.get("/public/projects", { params: projectQueryParams(filters) })).data;
}

export function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const q = params.get("q") ?? "";
  const layanan = params.get("layanan") ?? "";
  const tahun = params.get("tahun") ?? "";
  const kategori = params.get("kategori") ?? "";
  const status = params.get("status") ?? "";
  const urutan = params.get("urutan") ?? "terbaru";
  const page = Math.max(1, Number(params.get("halaman")) || 1);
  const resultsRef = useRef(null);
  const previousPageRef = useRef(page);
  const rawView = params.get("tampilan");
  const tampilan = ["grid", "daftar", "peta"].includes(rawView) ? rawView : "grid";

  // Ganti halaman lewat URL (halaman=1 dihilangkan agar URL bersih)
  const setPage = (next) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next > 1) p.set("halaman", String(next));
      else p.delete("halaman");
      return p;
    });
  };

  // Hapus semua filter (dipakai empty state) — mode tampilan dipertahankan
  const resetFilters = () => setParams((prev) => {
    const next = new URLSearchParams();
    const view = prev.get("tampilan");
    if (view && view !== "grid") next.set("tampilan", view);
    return next;
  }, { replace: true });

  const filters = { page, q, layanan, tahun, kategori, status, urutan };
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: projectQueryKey(filters),
    // Pertahankan hasil lama saat berpindah halaman agar tidak berkedip kosong
    placeholderData: keepPreviousData,
    queryFn: () => fetchProjects(filters),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const facets = data?.facets;

  // Siapkan halaman berikutnya saat metadata halaman aktif sudah tersedia.
  useEffect(() => {
    if (tampilan === "peta" || !meta || page >= meta.totalPages) return;
    const nextFilters = { ...filters, page: page + 1 };
    queryClient.prefetchQuery({
      queryKey: projectQueryKey(nextFilters),
      queryFn: () => fetchProjects(nextFilters),
    });
  }, [queryClient, page, q, layanan, tahun, kategori, status, urutan, tampilan, meta]);

  // Fokuskan kembali perhatian pengguna ke awal hasil ketika halaman berubah.
  useEffect(() => {
    if (previousPageRef.current === page) return;
    previousPageRef.current = page;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  return (
    <div className="overflow-x-clip">
      <Seo path="/proyek" title="Proyek" description="Portofolio bangunan yang kami selesaikan dan yang sedang berjalan." />
      <ProjectsBanner />
      {/* Proyek unggulan hanya di halaman 1 tanpa filter aktif.
          Tanpa Reveal: elemen LCP di atas lipatan tidak boleh menunggu animasi opacity. */}
      {page === 1 && !q && !kategori && !status && !layanan && !tahun && (
        <FeaturedProjectsStrip />
      )}
      <Container className="py-14">
        <Reveal as="section" aria-label="Filter proyek" delay={120}>
          <ProjectFilterBar facets={facets} meta={meta} shown={rows.length} page={page} limit={LIMIT} />
        </Reveal>

        {/* Hasil: Grid / Daftar / Peta */}
        <Reveal as="section" className="scroll-mt-6" delay={160}>
        <div ref={resultsRef}>
          {tampilan === "peta" ? (
            <ProjectsMap q={q} layanan={layanan} tahun={tahun} kategori={kategori} status={status} />
          ) : isLoading ? (
            tampilan === "daftar" ? (
              <div className="mt-8 space-y-4" aria-busy="true">
                <span className="sr-only">Memuat proyek…</span>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex animate-pulse gap-4 rounded-2xl border border-ink/10 p-3 sm:p-4">
                    <div className="aspect-[4/3] w-28 shrink-0 rounded-xl bg-cream-deep sm:w-44 lg:w-56" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-1/4 rounded bg-cream-deep" />
                      <div className="h-5 w-3/4 rounded bg-cream-deep" />
                      <div className="hidden h-4 w-full rounded bg-cream-deep sm:block" />
                      <div className="h-4 w-1/2 rounded bg-cream-deep" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
                <span className="sr-only">Memuat proyek…</span>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-2xl bg-cream-deep" />
                    <div className="mt-4 h-5 w-4/5 rounded bg-cream-deep" />
                    <div className="mt-2 h-5 w-2/5 rounded bg-cream-deep" />
                  </div>
                ))}
              </div>
            )
          ) : isError ? (
            <p className="mt-10 text-center text-sm text-danger">Gagal memuat proyek. Coba muat ulang halaman.</p>
          ) : rows.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-deep text-ink-light">
                <SearchX size={24} />
              </span>
              <p className="font-jakarta text-lg font-bold text-ink">Tidak ada proyek yang cocok</p>
              <p className="max-w-sm text-sm text-ink-light">Coba ubah kata kunci, layanan, tahun, status, atau kategori — atau mulai lagi tanpa filter.</p>
              <PillButton variant="dark" onClick={resetFilters}>Reset Filter</PillButton>
            </div>
          ) : tampilan === "daftar" ? (
            <div className={`mt-8 space-y-4 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
              {rows.map((p) => <ProjectListItem key={p.id} project={p} />)}
            </div>
          ) : (
            <div className={`mt-10 grid grid-cols-2 gap-6 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${isFetching ? "opacity-60" : ""}`}>
              {rows.map((p) => <ProjectCardV2 key={p.id} project={p} />)}
            </div>
          )}
        </div>
        </Reveal>

        {tampilan !== "peta" && meta && meta.total > LIMIT && (
          <Reveal as="div" className="mt-12" delay={200}>
            <Pagination page={page} totalPages={meta.totalPages} onChange={setPage} label="Paginasi proyek" />
          </Reveal>
        )}
      </Container>
      <Reveal as="div" delay={100}>
        <ProjectsCta backgroundImage={rows[0]?.coverImage} />
      </Reveal>
    </div>
  );
}

// ===== Detail =====
function Lightbox({ images, index, onClose, onMove }) {
  const touchStartRef = useRef(null);

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
      <figure
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStartRef.current = e.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          const start = touchStartRef.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartRef.current = null;
          if (start == null || end == null || Math.abs(end - start) < 45) return;
          onMove(end < start ? 1 : -1);
        }}
        className="max-w-4xl touch-pan-y select-none"
      >
        <img src={img(current.url)} alt={current.caption ?? ""} className="max-h-[80vh] w-full rounded-xl object-contain" />
        {current.caption && <figcaption className="mt-2 text-center text-sm text-white/70">{current.caption}</figcaption>}
      </figure>
    </div>
  );
}

// ProjectHero — overlay teks di atas gambar (landscape), grid samping (portrait desktop).
function ProjectHero({ image, title, location, category, status, onClickImage }) {
  const [ratio, setRatio] = useState(16 / 9);
  const landscape = ratio >= 1.2;

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w && h) setRatio(w / h);
  };

  // Badge + judul + lokasi — satu wadah rata kiri, gap seragam
  const overlay = (
    <div className="flex flex-col items-start gap-3 text-left">
      <div className="flex flex-wrap items-center justify-start gap-2">
        {category && <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-cream backdrop-blur-sm">{category}</span>}
        {status && (
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${STATUS_BADGE[status] ?? STATUS_BADGE.PLANNING}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        )}
      </div>
      <h1 className="w-full max-w-[70%] break-words font-jakarta text-[clamp(1.5rem,3.5vw,2.75rem)] font-extrabold leading-tight text-white line-clamp-2 text-left">{title}</h1>
      {location && (
        <p className="flex items-center justify-start gap-1.5 text-sm font-semibold text-cream/90 sm:text-base">
          <MapPin size={17} className="shrink-0 text-brand" /> {location}
        </p>
      )}
    </div>
  );

  if (!image) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-ink shadow-soft-lg">
        <div className="flex aspect-video items-center justify-center text-sm text-ink-light">Foto proyek belum tersedia</div>
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">{overlay}</div>
      </div>
    );
  }

  // Mode A — landscape: gambar penuh lebar, overlay di bawah
  if (landscape) {
    return (
      <button type="button" onClick={onClickImage} className="group relative mt-4 block w-full overflow-hidden rounded-3xl shadow-soft-lg" aria-label="Perbesar gambar hero">
        <img src={image} alt={title} loading="eager" fetchPriority="high" onLoad={handleLoad} className="block h-full w-full transition-transform duration-300 group-hover:scale-[1.02]" style={{ aspectRatio: ratio }} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.35) 40%, transparent 55%)" }} />
        <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-8">{overlay}</div>
      </button>
    );
  }

  // Mode B — portrait/persegi
  return (
    <div className="mt-4 overflow-hidden rounded-3xl shadow-soft-lg">
      {/* Mobile: overlay di atas gambar */}
      <button type="button" onClick={onClickImage} className="group relative block w-full md:hidden" aria-label="Perbesar gambar hero">
        <img src={image} alt={title} loading="eager" fetchPriority="high" onLoad={handleLoad} className="block h-full w-full" style={{ aspectRatio: ratio }} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 45%, transparent 65%)" }} />
        <div className="absolute inset-x-0 bottom-0 z-10 p-5">{overlay}</div>
      </button>
      {/* Desktop: grid samping — teks kiri, gambar kanan */}
      <div className="hidden bg-ink md:grid md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col items-start justify-end p-10">{overlay}</div>
        <button type="button" onClick={onClickImage} className="group block" aria-label="Perbesar gambar hero">
          <img src={image} alt={title} loading="eager" fetchPriority="high" onLoad={handleLoad} className="block h-full max-h-[70vh] w-auto transition-transform duration-300 group-hover:scale-[1.02]" style={{ aspectRatio: ratio }} />
        </button>
      </div>
    </div>
  );
}

function ShareActions({ title, url, copied, onCopy }) {
  const shareText = encodeURIComponent(`${title} — ${url}`);
  const shareWa = `https://wa.me/?text=${shareText}`;
  const shareFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep text-brand">
          <Share2 size={16} />
        </span>
        Bagikan proyek
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={shareWa}
          target="_blank"
          rel="noreferrer"
          aria-label="Bagikan proyek ke WhatsApp"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/12 px-4 py-2 text-xs font-semibold text-[#128C4A] transition hover:bg-[#25D366]/25"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
        <a
          href={shareFb}
          target="_blank"
          rel="noreferrer"
          aria-label="Bagikan proyek ke Facebook"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2]/12 px-4 py-2 text-xs font-semibold text-[#1877F2] transition hover:bg-[#1877F2]/25"
        >
          <span aria-hidden className="font-bold">f</span> Facebook
        </a>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Salin tautan proyek"
          className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-cream"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Tersalin" : "Salin tautan"}
        </button>
      </div>
    </div>
  );
}

function youtubeId(url) {
  if (!url) return "";
  return String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)?.[1] ?? "";
}

function LazyYouTube({ videoUrl, title }) {
  const id = youtubeId(videoUrl);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "240px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!id) return null;
  return (
    <div ref={ref} className="aspect-video overflow-hidden rounded-2xl bg-ink shadow-soft-lg">
      {visible ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title={`Video proyek ${title}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setVisible(true)} className="group relative h-full w-full text-left">
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-75 transition group-hover:opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/25">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-soft-lg">
              <Play size={16} fill="currentColor" /> Muat video
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function ProjectInterestForm({ project }) {
  const { data: settings } = useSiteSettings();
  const serviceLabel = project.service?.title ?? "Konsultasi proyek";
  const waNumber = String(settings?.company_whatsapp || "6281234567890").replace(/\D/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Jaya Abadi, saya tertarik dengan proyek ${project.title}.`)}`;
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setStatus({ type: "error", message: "Nama minimal 2 karakter." });
    if (form.phone.trim().length < 6) return setStatus({ type: "error", message: "Nomor WhatsApp minimal 6 karakter." });
    setSending(true);
    setStatus({ type: "", message: "" });
    try {
      await api.post("/public/messages", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        subject: `Konsultasi proyek — ${project.title}`,
        body: [`Proyek: ${project.title}`, `Layanan terkait: ${serviceLabel}`, `Pesan: ${form.note.trim() || "Mohon hubungi saya untuk konsultasi."}`].join("\n"),
        website: "",
      });
      setForm({ name: "", phone: "", note: "" });
      setStatus({ type: "success", message: "Permintaan terkirim. Tim kami akan segera menghubungi Anda." });
    } catch {
      setStatus({ type: "error", message: "Gagal mengirim. Silakan coba lagi." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sticky top-24 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft-lg">
      <p className="text-xs font-bold uppercase tracking-widest text-brand">Konsultasi proyek</p>
      <h2 className="mt-2 font-jakarta text-xl font-extrabold text-ink">Tertarik proyek serupa?</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-light">Ceritakan kebutuhan Anda, kami bantu siapkan langkah awalnya.</p>

      <div className="mt-4 rounded-xl bg-cream-deep px-3.5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Layanan terkait</p>
        <p className="mt-1 text-sm font-bold text-ink">{serviceLabel}</p>
      </div>

      <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">Nama</span>
          <input
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            placeholder="Nama Anda"
            className="w-full rounded-xl border border-ink/10 bg-cream/60 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">No. WhatsApp</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
            placeholder="0812xxxx"
            className="w-full rounded-xl border border-ink/10 bg-cream/60 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">Kebutuhan singkat <span className="font-normal text-ink-light">(opsional)</span></span>
          <textarea
            rows={3}
            value={form.note}
            onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))}
            placeholder="Ceritakan rencana proyek Anda"
            className="w-full resize-none rounded-xl border border-ink/10 bg-cream/60 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand"
          />
        </label>
        {status.message && <p role={status.type === "error" ? "alert" : "status"} className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold ${status.type === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>{status.message}</p>}
        <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Mengirim…" : "Kirim permintaan"}
        </button>
      </form>

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-2.5 text-sm font-bold text-[#128C4A] transition hover:bg-[#25D366]/20">
        <MessageCircle size={16} /> Chat via WhatsApp
      </a>
      <a href={`/kontak?proyek=${encodeURIComponent(project.title)}${project.service?.slug ? `&layanan=${encodeURIComponent(project.service.slug)}` : ""}`} className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-ink/10 px-5 py-2.5 text-xs font-bold text-ink-soft transition hover:border-brand hover:text-brand">
        Isi formulir konsultasi lengkap
      </a>
    </div>
  );
}

function RelatedProjectsCarousel({ projects }) {
  const trackRef = useRef(null);
  if (!projects.length) return null;

  const move = (direction) => trackRef.current?.scrollBy({ left: direction * (trackRef.current.clientWidth * 0.85), behavior: "smooth" });
  return (
    <section className="bg-cream-deep py-14" aria-labelledby="proyek-serupa">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Pilihan terkait</p>
            <h2 id="proyek-serupa" className="mt-2 font-jakarta text-2xl font-extrabold text-ink sm:text-3xl">Proyek <span className="text-brand">Serupa</span></h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => move(-1)} aria-label="Proyek serupa sebelumnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => move(1)} aria-label="Proyek serupa berikutnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div ref={trackRef} className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {projects.map((project) => (
            <article key={project.id} className="w-[84%] shrink-0 snap-start sm:w-[48%] lg:w-[31%]">
              <ProjectCardV2 project={project} />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProjectSiblingNavigation({ previous, next }) {
  if (!previous && !next) return null;
  return (
    <Container className="py-8 sm:py-10">
      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Navigasi proyek">
        {previous ? (
          <Link to={`/proyek/${previous.slug}`} className="group rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-brand/40 hover:shadow-soft">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-light group-hover:text-brand"><ChevronLeft size={14} /> Proyek Sebelumnya</span>
            <span className="mt-2 block truncate font-jakarta font-bold text-ink group-hover:text-brand">{previous.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/proyek/${next.slug}`} className="group rounded-2xl border border-ink/10 bg-white p-4 text-right transition hover:border-brand/40 hover:shadow-soft">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-light group-hover:text-brand">Proyek Berikutnya <ChevronRight size={14} /></span>
            <span className="mt-2 block truncate font-jakarta font-bold text-ink group-hover:text-brand">{next.title}</span>
          </Link>
        )}
      </nav>
    </Container>
  );
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState(null); // index foto | null
  const [copied, setCopied] = useState(false);

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
  const galleryImages = [{ url: project.coverImage }, ...gallery].filter((photo) => photo.url);
  const infoItems = [
    [Building2, "Klien", project.clientName],
    [MapPin, "Lokasi", project.location],
    [CalendarDays, "Tahun", project.year],
    [Ruler, "Luas", project.area != null ? `${num(project.area)} m²` : null],
    [Layers, "Jumlah lantai", project.floors != null ? `${num(project.floors)} lantai` : null],
    [Clock3, "Durasi", project.durationMonths != null ? `${num(project.durationMonths)} bulan` : null],
    [UserRound, "Arsitek", project.architect],
    [Wallet, "Nilai proyek", project.value],
  ].filter(([, , value]) => value !== null && value !== undefined && value !== "");
  const storyBlocks = [
    ["01", "Tantangan", project.challenge],
    ["02", "Solusi", project.solution],
    ["03", "Hasil", project.result],
  ].filter(([, , value]) => value?.trim());
  const highlights = Array.isArray(project.highlights)
    ? project.highlights.filter((item) => typeof item === "string" && item.trim())
    : [];
  const videoId = youtubeId(project.videoUrl);
  const hasCoordinates = project.latitude != null && project.longitude != null;
  const url = window.location.href;
  const seoTitle = project.metaTitle || project.title;
  const seoDescription = project.metaDescription || project.summary || project.description?.slice(0, 160);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: seoDescription,
    url,
    image: img(project.coverImage) || undefined,
    creator: { "@type": "Organization", name: "Jaya Abadi" },
    about: project.service?.title || undefined,
    dateCreated: project.year ? `${project.year}-01-01` : undefined,
    locationCreated: project.location ? { "@type": "Place", name: project.location } : undefined,
    keywords: [project.category?.name, project.service?.title, ...(Array.isArray(project.tags) ? project.tags : [])].filter(Boolean).join(", ") || undefined,
  };
  const copyLink = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Seo
        path={`/proyek/${slug}`}
        title={seoTitle}
        description={seoDescription}
        type="article"
        image={img(project.coverImage) || undefined}
        jsonLd={jsonLd}
      />
      <Container className="pt-8 sm:pt-10">
        <Link to="/proyek" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand" aria-label="Kembali ke daftar proyek">
          <ChevronLeft size={16} /> Kembali
        </Link>
        <Breadcrumb items={[{ label: "Proyek", to: "/proyek" }, { label: project.title }]} />
        <ProjectHero
          image={project.coverImage ? img(project.coverImage) : null}
          title={project.title}
          location={project.location}
          category={project.category?.name}
          status={project.status}
          onClickImage={() => setLightbox(0)}
        />
      </Container>

      <Container className="py-8 sm:py-10">
        {project.summary && <p className="max-w-3xl text-sm leading-relaxed text-ink-soft sm:text-base">{project.summary}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {infoItems.map(([Icon, label, value]) => (
            <div key={label} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-deep text-brand"><Icon size={18} /></span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-light">{label}</p>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
        <ShareActions title={project.title} url={url} copied={copied} onCopy={copyLink} />
      </Container>

      <Container className="grid gap-10 pb-14 lg:grid-cols-3">
        {/* Isi utama detail */}
        <div className="lg:col-span-2">
          {project.description?.trim() && (
            <section aria-labelledby="deskripsi-proyek">
              <h2 id="deskripsi-proyek" className="font-jakarta text-2xl font-extrabold text-ink">Tentang proyek</h2>
              <div className="prose-jaya mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{project.description}</div>
            </section>
          )}

          {storyBlocks.length > 0 && (
            <section className="mt-10" aria-labelledby="cerita-proyek">
              <h2 id="cerita-proyek" className="font-jakarta text-2xl font-extrabold text-ink">Cerita <span className="text-brand">proyek</span></h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {storyBlocks.map(([number, label, text]) => (
                  <article key={label} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
                    <span className="font-jakarta text-3xl font-extrabold text-brand/35">{number}</span>
                    <h3 className="mt-3 font-jakarta text-lg font-bold text-ink">{label}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{text}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {highlights.length > 0 && (
            <section className="mt-10" aria-labelledby="sorotan-proyek">
              <h2 id="sorotan-proyek" className="font-jakarta text-2xl font-extrabold text-ink">Sorotan <span className="text-brand">proyek</span></h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2" role="list">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 rounded-xl bg-cream-deep/70 px-4 py-3 text-sm font-semibold text-ink-soft">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {galleryImages.length > 0 && (
            <div className="mt-10">
              <ProjectGallery
                images={galleryImages.map((photo) => ({ ...photo, url: img(photo.url) }))}
                title={project.title}
                onOpen={setLightbox}
              />
            </div>
          )}

          {videoId && (
            <section className="mt-10" aria-labelledby="video-proyek">
              <h2 id="video-proyek" className="font-jakarta text-2xl font-extrabold text-ink">Video <span className="text-brand">proyek</span></h2>
              <div className="mt-5"><LazyYouTube videoUrl={project.videoUrl} title={project.title} /></div>
            </section>
          )}

          {hasCoordinates && (
            <section className="mt-10" aria-labelledby="lokasi-proyek">
              <h2 id="lokasi-proyek" className="font-jakarta text-2xl font-extrabold text-ink">Lokasi <span className="text-brand">proyek</span></h2>
              <div className="mt-5">
                <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cream-deep" aria-busy="true" />}>
                  <ProjectLocationMap latitude={project.latitude} longitude={project.longitude} title={project.title} location={project.location} />
                </Suspense>
              </div>
            </section>
          )}
        </div>

        <aside>
          <ProjectInterestForm project={project} />
        </aside>
      </Container>

      <RelatedProjectsCarousel projects={project.related ?? []} />
      <ProjectSiblingNavigation previous={project.prev} next={project.next} />
      <ProjectsCta backgroundImage={project.coverImage} />

      {lightbox !== null && galleryImages.length > 0 && (
        <Lightbox
          images={galleryImages.map((g) => ({ url: g.url ?? g, caption: g.caption }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onMove={(d) => setLightbox((v) => (v + d + galleryImages.length) % galleryImages.length)}
        />
      )}
    </>
  );
}
