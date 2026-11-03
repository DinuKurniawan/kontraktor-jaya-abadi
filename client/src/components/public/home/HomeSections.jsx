// Section beranda: strip statistik (count-up), layanan, proyek unggulan,
// testimoni highlight, artikel terbaru, banner CTA — data dari endpoint publik
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Building2, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Star, Users, Wrench } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import SectionHeading from "../SectionHeading.jsx";
import PillButton from "../PillButton.jsx";
import ArticleCard from "../ArticleCard.jsx";
import useReveal from "../../../hooks/useReveal.js";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";
import { toast } from "../../ui/Toast.jsx";
import { useSiteSettings } from "./HeroSection.jsx";
import AspectImage from "../../ui/AspectImage.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// ===== Statistik: 4 angka besar oranye + ikon + pemisah, hitung naik saat terlihat
// CATATAN: IO dengan fallback 2,5 dtk — nilai akhir selalu tampil meski animasi gagal.
const STAT_ICONS = [CalendarClock, Building2, Users, Award];

function CountUp({ target, label, icon: Icon }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [active, setActive] = useState(false); // terlihat / fallback
  const goal = Math.max(0, parseInt(target, 10) || 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || goal === 0) return;
    // Reduced-motion → langsung angka akhir
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(goal);
      return;
    }
    let raf, done = false;
    const start = () => {
      if (done) return;
      done = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1300);
        setValue(Math.round(goal * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // IntersectionObserver + fallback waktu: tak mungkin angka tak muncul
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => e.isIntersecting && (start(), io.disconnect()), { threshold: 0.3 }) : null;
    io?.observe(el);
    const fallback = setTimeout(start, 2500);
    return () => { clearTimeout(fallback); io?.disconnect(); cancelAnimationFrame(raf); };
  }, [goal]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 px-4 text-center">
      {Icon && <Icon size={26} className="text-brand/80" strokeWidth={1.8} />}
      <p className="font-jakarta text-4xl font-extrabold text-brand sm:text-5xl">
        {value}
        {goal > 10 ? "+" : ""}
      </p>
      <p className="text-sm text-cream/70">{label}</p>
    </div>
  );
}

export function StatsStrip() {
  const { data: s } = useSiteSettings();
  // Utama: homepage_stats_i — fallback: stat_* legacy agar strip tak pernah kosong
  const items = [1, 2, 3, 4]
    .map((i) => [s?.[`homepage_stats_${i}`], s?.[`homepage_stats_${i}_label`]])
    .filter(([num]) => num && !isNaN(parseInt(num, 10)));
  const list = items.length === 4 ? items : [
    [s?.stat_years_experience ?? "20", "Tahun Pengalaman"],
    [s?.stat_completed_projects ?? "200", "Proyek Selesai"],
    [s?.stat_clients ?? "150", "Klien Puas"],
    [s?.stat_experts ?? "80", "Tenaga Ahli"],
  ];
  const year = Number(s?.stat_years_experience) || 20;
  const since = new Date().getFullYear() - year;

  return (
    <section className="bg-ink">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {list.map(([num, label], i) => (
            <CountUp key={label ?? i} target={num} label={label} icon={STAT_ICONS[i % 4]} />
          ))}
        </div>
        <p className="mt-10 text-center text-sm font-medium tracking-wide text-cream/60">
          Dipercaya sejak {since}
        </p>
      </Container>
    </section>
  );
}
// ===== Layanan — kartu gambar latar, ikon oranye, hover zoom/overlay/panah
// Grid 4 kolom; kartu pertama 2x2 di desktop; tinggi kartu sejajar (auto-rows-fr).
export function ServicesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });

  const card = (s, big) => {
    const Icon = SERVICE_ICONS[s.icon];
    return (
      <Link
        key={s.id}
        to={`/layanan/${s.slug}`}
        className={`group relative block overflow-hidden rounded-2xl shadow-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${big ? "sm:col-span-2 sm:row-span-2" : ""}`}
      >
        <div className="relative">
          <AspectImage src={img(s.image || s.heroImage)} alt={s.title} ratio="4/3" className="w-full transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10 transition group-hover:from-ink/95 group-hover:via-ink/50" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-soft transition group-hover:scale-110">
            {Icon ? <Icon size={20} /> : <Wrench size={20} />}
          </span>
          <h3 className={`font-jakarta font-bold text-white ${big ? "text-2xl" : "text-lg"}`}>{s.title}</h3>
          <p className={`mt-1 break-words text-cream/80 ${big ? "line-clamp-3 max-w-sm text-sm" : "line-clamp-2 text-xs"}`}>{s.shortDesc}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand opacity-0 transition group-hover:opacity-100">
            Selengkapnya <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    );
  };

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <SectionHeading
          title={<>Layanan <span className="text-brand">Kami</span></>}
          to="/layanan"
          actionLabel="Lihat semua layanan"
        />
        {isLoading ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-cream-deep" />)}
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-ink-light">Layanan belum tersedia.</p>
        ) : (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-4">
            {(data ?? []).slice(0, 5).map((s, i) => card(s, i === 0))}
          </div>
        )}
      </Container>
    </section>
  );
}

// ===== Proyek unggulan: bento (1 besar 2x2 + kecil), overlay info + badge status,
// tab kategori tanpa reload (data lama tampil selama fetch — transisi halus),
// dan baris angka ringkas dari settings (opsional).
const FEATURED_TABS = [
  { label: "Semua", value: "" },
  { label: "Gedung", value: "gedung" },
  { label: "Rumah Tinggal", value: "rumah-tinggal" },
  { label: "Renovasi", value: "renovasi" },
];

const STATUS_BADGE = {
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ONGOING: "bg-amber-100 text-amber-800",
  PLANNING: "bg-sky-100 text-sky-800",
};
const STATUS_LABEL = { COMPLETED: "Selesai", ONGOING: "Berjalan", PLANNING: "Perencanaan" };

function BentoProjectCard({ p, big = false }) {
  return (
    <Link
      to={`/proyek/${p.slug}`}
      className={`group relative block overflow-hidden rounded-2xl shadow-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${big ? "sm:col-span-2 sm:row-span-2" : ""}`}
    >
      <div className={`${big ? "h-80 sm:h-full sm:min-h-[34rem]" : "h-72"} relative`}>
        <img src={img(p.coverImage)} alt={p.title} width={big ? 1200 : 800} height={big ? 1200 : 600}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent transition group-hover:from-ink/95" />
      </div>
      {p.status && (
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[p.status] ?? "bg-white text-ink"}`}>
          {STATUS_LABEL[p.status] ?? p.status}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {[p.category?.name, p.location, p.year].filter(Boolean).join(" · ")}
        </p>
        <h3 className={`mt-1 font-jakarta font-bold text-white ${big ? "text-2xl" : "text-lg"}`}>{p.title}</h3>
      </div>
    </Link>
  );
}

export function FeaturedProjects() {
  const [tab, setTab] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["public-projects-featured", tab],
    queryFn: async () => (await api.get("/public/projects", { params: { featured: "true", category: tab || undefined, limit: 5 } })).data,
    // Tanpa reload: data tab sebelumnya tetap tampil (dim) selama data baru diambil
    placeholderData: (prev) => prev,
  });
  const { data: s } = useSiteSettings();
  const rows = data?.data ?? [];

  // Baris angka opsional — hanya tampil bila setting tersedia
  const statsRow = [
    [s?.stat_completed_projects, "Proyek Selesai"],
    [s?.stat_ongoing_projects, "Sedang Berjalan"],
    [s?.stat_total_value, "Total Nilai Proyek"],
  ].filter(([v]) => v);

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container>
        <SectionHeading title={<>Proyek <span className="text-brand">Unggulan</span></>} to="/proyek" actionLabel="Jelajahi semua proyek" />

        {statsRow.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-x-10 gap-y-3">
            {statsRow.map(([v, label]) => (
              <div key={label}>
                <p className="font-jakarta text-2xl font-extrabold text-ink">{v}</p>
                <p className="text-xs text-ink-light">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab kategori */}
        <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter kategori proyek">
          {FEATURED_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t.value ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          isFetching ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-white/60" />)}
            </div>
          ) : (
            <p className="text-sm text-ink-light">Belum ada proyek unggulan pada kategori ini.</p>
          )
        ) : (
          <>
            {/* Bento desktop: kartu pertama 2x2; dim selama fetch tab baru */}
            <div className={`hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-fr transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`} role="tabpanel">
              {rows.map((p, i) => <BentoProjectCard key={p.id} p={p} big={i === 0} />)}
            </div>
            {/* Carousel geser di mobile */}
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:hidden">
              {rows.map((p) => (
                <div key={p.id} className="w-[85%] shrink-0 snap-start"><BentoProjectCard p={p} /></div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <PillButton variant="outline" to="/proyek">Jelajahi semua proyek</PillButton>
        </div>
      </Container>
    </section>
  );
}

// ===== Testimoni: kiri = ringkasan rating + kutipan besar (carousel otomatis,
// panah, titik, swipe sentuh); kanan = foto proyek terkait berganti ikut index =====
export function TestimonialHighlight() {
  const { data } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: async () => (await api.get("/public/testimonials")).data.data,
  });
  const { data: photo } = useQuery({
    queryKey: ["public-projects-photo-1"],
    queryFn: async () => (await api.get("/public/projects", { params: { featured: "true", limit: 4 } })).data,
  });
  const rows = data ?? [];
  const photos = photo?.data ?? [];
  const [i, setI] = useState(0);
  const downX = useRef(null);
  useEffect(() => setI(0), [rows.length]);
  // Autoplay — reset tiap pergantian slide; tanpa timer bila <2 testimoni
  useEffect(() => {
    if (rows.length < 2) return;
    const id = setTimeout(() => setI((v) => (v + 1) % rows.length), 6000);
    return () => clearTimeout(id);
  }, [i, rows.length]);
  if (rows.length === 0) return null;
  const t = rows[i % rows.length];
  const move = (d) => setI((v) => (v + d + rows.length) % rows.length);
  const avg = (rows.reduce((a, r) => a + (r.rating ?? 0), 0) / rows.length).toFixed(1);
  const cur = photos[i % Math.max(1, photos.length)];

  return (
    <section className="bg-cream py-12 sm:py-16">
      <Container>
        <SectionHeading title={<>Kata <span className="text-brand">Klien</span> Kami</>} />
        <div className="grid items-stretch gap-8 lg:grid-cols-5">
          {/* Kiri */}
          <div
            className="lg:col-span-3"
            // Swipe sentuh/mobile: catat titik tekan, bandingkan saat dilepas
            onPointerDown={(e) => { downX.current = e.clientX; }}
            onPointerUp={(e) => {
              if (downX.current === null) return;
              const dx = e.clientX - downX.current;
              if (Math.abs(dx) > 40) move(dx > 0 ? -1 : 1);
              downX.current = null;
            }}
          >
            {/* Ringkasan rating */}
            <div className="flex items-center gap-4">
              <p className="font-jakarta text-5xl font-extrabold text-ink sm:text-6xl">{avg.replace(".", ",")}</p>
              <div>
                <div className="flex gap-0.5" aria-label={`Rata-rata ${avg} dari 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} className={n <= Math.round(avg) ? "fill-brand text-brand" : "fill-cream-deep text-cream-deep"} />
                  ))}
                </div>
                <p className="mt-1 text-sm text-ink-light">{rows.length} ulasan klien</p>
              </div>
            </div>

            {/* Kutipan besar + tanda kutip dekoratif */}
            <div key={t.id} className="relative mt-6 animate-fade-in">
              <span aria-hidden className="absolute -left-2 -top-7 font-jakarta text-8xl leading-none text-brand/20 sm:-left-4">“</span>
              <blockquote className="pl-4 font-jakarta text-2xl font-bold leading-snug text-ink sm:text-3xl sm:pl-6">
                {t.content}
              </blockquote>
            </div>
            <figcaption className="mt-5 flex items-center gap-3 pl-4 sm:pl-6">
              {t.avatar ? (
                <img src={img(t.avatar)} alt={t.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft font-jakarta text-lg font-bold text-brand-dark">
                  {(t.name?.[0] ?? "★").toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-jakarta font-bold text-ink">{t.name}</p>
                <p className="text-sm text-ink-light">{[t.position, t.company].filter(Boolean).join(", ")}</p>
              </div>
            </figcaption>

            {/* Navigasi: panah + titik */}
            {rows.length > 1 && (
              <div className="mt-7 flex items-center gap-3 pl-4 sm:pl-6">
                <button type="button" onClick={() => move(-1)} aria-label="Testimoni sebelumnya" className="rounded-full border border-ink/15 p-2.5 text-ink transition hover:bg-ink hover:text-cream">
                  <ChevronLeft size={17} />
                </button>
                <button type="button" onClick={() => move(1)} aria-label="Testimoni berikutnya" className="rounded-full border border-ink/15 p-2.5 text-ink transition hover:bg-ink hover:text-cream">
                  <ChevronRight size={17} />
                </button>
                <div className="ml-2 flex gap-1.5">
                  {rows.map((r, idx) => (
                    <button key={r.id} type="button" onClick={() => setI(idx)} aria-label={`Ulasan ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${idx === i % rows.length ? "w-6 bg-brand" : "w-2 bg-ink/20 hover:bg-ink/40"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kanan: foto proyek terkait — berganti mengikuti testimoni aktif */}
          {cur && (
            <div className="hidden lg:col-span-2 lg:block">
              <div className="overflow-hidden rounded-2xl shadow-soft-lg">
                <img key={cur.id} src={img(cur.coverImage)} alt={cur.title} loading="lazy"
                  className="aspect-[4/5] w-full animate-fade-in object-cover" />
              </div>
              <p className="mt-2 text-center text-xs text-ink-light">Proyek: {cur.title}</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

// Form newsletter ringkas — email saja ke POST /api/public/subscribe
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const send = useMutation({
    mutationFn: async () => (await api.post("/public/subscribe", { email })).data,
    onSuccess: () => { setDone(true); setEmail(""); },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal berlangganan"),
  });
  if (done) return <p className="text-sm font-semibold text-brand">Terima kasih! Email terdaftar.</p>;
  return (
    <form className="flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <label htmlFor="nl-email" className="sr-only">Email newsletter</label>
      <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Anda" autoComplete="email"
        className="w-full flex-1 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm outline-none focus:border-brand" />
      <button type="submit" disabled={send.isPending}
        className="rounded-full bg-brand px-6 py-3 font-jakarta text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
        Berlangganan
      </button>
    </form>
  );
}

// ===== Artikel terbaru: 1 besar kiri + 3 kecil kanan (+ newsletter) =====
export function LatestArticles() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-posts-latest"],
    queryFn: async () => (await api.get("/public/posts", { params: { limit: 4 } })).data,
  });
  const rows = data?.data ?? [];
  if (!isLoading && rows.length === 0) return null;
  const [first, ...rest] = rows;
  const fmt = (d) => d && new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  // Isi slot kecil agar grid tetap 3 & tinggi seimbang walau artikel < 4
  const fillers = Math.max(0, 3 - rest.length);

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container>
        <SectionHeading title={<>Artikel <span className="text-brand">Terbaru</span></>} to="/artikel" />
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-white/60" />
            <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />)}</div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {first && (
              <Link to={`/artikel/${first.slug}`} className="group block rounded-2xl bg-white p-3 shadow-soft">
                <ArticleCard title={first.title} category={first.category?.name} date={fmt(first.publishedAt)} readTime={first.readTime} image={img(first.coverImage)} />
              </Link>
            )}
            <div className="flex flex-col gap-4">
              {rest.map((p) => (
                <Link key={p.id} to={`/artikel/${p.slug}`} className="group flex flex-1 gap-4 rounded-2xl bg-white p-3 shadow-soft transition hover:shadow-soft-lg">
                  <img src={img(p.coverImage)} alt={p.title} width={112} height={80} loading="lazy" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    {p.category?.name && <span className="text-[11px] font-semibold uppercase text-brand">{p.category.name}</span>}
                    <h3 className="line-clamp-2 font-jakarta font-bold leading-snug text-ink group-hover:text-brand">{p.title}</h3>
                    <p className="mt-1 text-xs text-ink-light">{fmt(p.publishedAt)}  ·  {p.readTime} mnt baca</p>
                  </div>
                </Link>
              ))}
              {Array.from({ length: fillers }).map((_, i) => (
                <Link key={`fill-${i}`} to="/artikel"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/10 p-3 text-sm font-semibold text-ink-light transition hover:border-brand hover:text-brand">
                  Lihat semua artikel <ChevronRight size={15} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <h3 className="font-jakarta text-lg font-bold text-ink">Dapatkan tips konstruksi &amp; promo di inbox Anda</h3>
          <p className="mt-1 text-sm text-ink-light">Satu email per bulan. Berhenti kapan saja.</p>
          <div className="mt-4"><NewsletterForm /></div>
        </div>
      </Container>
    </section>
  );
}

// ===== CTA: form 3 langkah (jenis proyek → lokasi & anggaran → nama & WA) =====
const PROJECT_TYPES = ["Rumah Tinggal", "Gedung / Ruko", "Renovasi", "Interior"];
const BUDGETS = ["< 200 juta", "200 juta - 500 juta", "500 juta - 1 M", "> 1 M"];
const GUARANTEES = [
  ["Berizin resmi", "Legalitas lengkap (NIB, SBU)"],
  ["Bergaransi", "Garansi struktur 5 tahun"],
  ["RAB transparan", "Tanpa biaya tersembunyi"],
];

export function CtaBanner() {
  const { data } = useQuery({
    queryKey: ["public-projects-photo-3"],
    queryFn: async () => (await api.get("/public/projects", { params: { featured: "true", limit: 3 } })).data,
  });
  const { data: s } = useSiteSettings();
  const bg = data?.data?.[0]?.coverImage;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ type: "", location: "", budget: "", name: "", phone: "" });
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      api.post("/public/messages", {
        name: form.name,
        phone: form.phone,
        subject: `Permintaan Konsultasi — ${form.type}`,
        body: `Jenis proyek: ${form.type}\nLokasi: ${form.location}\nEstimasi anggaran: ${form.budget}\nMohon dihubungi via WhatsApp.`,
      }),
    onSuccess: () => { setSent(true); toast.success("Permintaan terkirim! Tim kami akan menghubungi Anda."); },
    onError: (err) => toast.error(err.response?.data?.message ?? "Gagal mengirim — coba lagi"),
  });

  const next = () => {
    if (step === 1 && !form.type) return toast.error("Pilih jenis proyek");
    if (step === 2) {
      if (form.location.trim().length < 3) return toast.error("Isi lokasi proyek");
      if (!form.budget) return toast.error("Pilih estimasi anggaran");
    }
    setStep((v) => Math.min(3, v + 1));
  };
  const submit = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Isi nama Anda");
    if (form.phone.replace(/\D/g, "").length < 8) return toast.error("Isi nomor WhatsApp yang valid");
    mutation.mutate();
  };
  const field = "w-full rounded-full bg-white px-5 py-3 text-sm text-ink outline-none placeholder:text-ink-light";
  const choice = (active) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-brand text-white" : "bg-white/15 text-cream hover:bg-white/25"}`;
  const phone = s?.company_phone ?? "(021) 555-0123";

  return (
    <section className="relative overflow-hidden">
      <img src={bg ? img(bg) : "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=60"} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-ink/85" />
      <Container className="relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
        {/* Kiri: jaminan + telepon besar */}
        <div>
          <h2 className="font-jakarta text-3xl font-extrabold leading-tight text-cream sm:text-4xl">
            Wujudkan <span className="text-brand">Bangunan Impian</span> Anda
          </h2>
          <ul className="mt-6 space-y-3">
            {GUARANTEES.map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-sm text-cream/85"><span className="font-jakarta font-bold text-cream">{title}</span> — {desc}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-cream/50">Telepon / WhatsApp</p>
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="font-jakarta text-3xl font-extrabold text-cream transition hover:text-brand sm:text-4xl">
            {phone}
          </a>
        </div>

        {/* Kanan: wizard 3 langkah */}
        <div className="rounded-3xl bg-white p-6 shadow-soft-lg sm:p-8">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-2" aria-label={`Langkah ${step} dari 3`}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= step ? "bg-brand" : "bg-cream-deep"}`} />
            ))}
            <span className="ml-2 text-xs font-bold text-ink-light">{step}/3</span>
          </div>

          {sent ? (
            <div className="animate-fade-in py-6 text-center">
              <CheckCircle2 size={44} className="mx-auto text-brand" />
              <h3 className="mt-3 font-jakarta text-xl font-extrabold text-ink">Terkirim!</h3>
              <p className="mt-1 text-sm text-ink-soft">Terima kasih, {form.name}. Tim kami menghubungi Anda segera.</p>
            </div>
          ) : step === 1 ? (
            <fieldset key="s1" className="animate-fade-in">
              <legend className="mb-3 font-jakarta font-bold text-ink">Jenis proyek apa yang Anda rencanakan?</legend>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))} aria-pressed={form.type === t} className={choice(form.type === t)}>{t}</button>
                ))}
              </div>
              <button type="button" onClick={next} className="mt-6 w-full rounded-full bg-brand px-6 py-3 font-jakarta font-bold text-white transition hover:bg-brand-dark">Lanjut</button>
            </fieldset>
          ) : step === 2 ? (
            <fieldset key="s2" className="animate-fade-in">
              <legend className="mb-3 font-jakarta font-bold text-ink">Di mana lokasi &amp; perkiraan anggaran?</legend>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Lokasi (mis. Bogor, Jawa Barat)" aria-label="Lokasi proyek" className={field} />
              <div className="mt-3 flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button key={b} type="button" onClick={() => setForm((f) => ({ ...f, budget: b }))} aria-pressed={form.budget === b} className={choice(form.budget === b)}>{b}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-full px-5 py-3 text-sm font-semibold text-ink-soft hover:text-ink">Kembali</button>
                <button type="button" onClick={next} className="flex-1 rounded-full bg-brand px-6 py-3 font-jakarta font-bold text-white transition hover:bg-brand-dark">Lanjut</button>
              </div>
            </fieldset>
          ) : (
            <form key="s3" className="animate-fade-in" onSubmit={submit} noValidate>
              <p className="mb-3 font-jakarta font-bold text-ink">Terakhir — siapa yang kami hubungi?</p>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nama Anda" aria-label="Nama" className={field} />
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="No. WhatsApp" aria-label="Nomor WhatsApp" type="tel" className={field} />
              </div>
              <p className="mt-3 rounded-xl bg-cream-deep px-4 py-2.5 text-xs text-ink-light">
                {form.type} · {form.location} · {form.budget}
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="rounded-full px-5 py-3 text-sm font-semibold text-ink-soft hover:text-ink">Kembali</button>
                <button type="submit" disabled={mutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-jakarta font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
                  {mutation.isPending && <Loader2 size={15} className="animate-spin" />} Kirim
                </button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
