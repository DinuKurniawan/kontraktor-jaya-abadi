// Layanan — daftar (redesain 2026) & detail (TanStack Query, loading + error + 404)
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ChevronRight, CircleDot, Clock, Download, MessageCircle, Phone, Send, Star, Wrench } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import PillButton from "../../components/public/PillButton.jsx";
import Seo from "../../components/public/Seo.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import { SERVICE_ICONS } from "../../lib/service-icons.jsx";
import ServicesBanner from "../../components/public/services/ServicesBanner.jsx";
import ServiceGrid from "../../components/public/services/ServiceGrid.jsx";
import IntegratedServices from "../../components/public/services/IntegratedServices.jsx";
import ServiceProcess from "../../components/public/services/ServiceProcess.jsx";
import SectorsServed from "../../components/public/services/SectorsServed.jsx";
import RelatedProjects from "../../components/public/services/RelatedProjects.jsx";
import ServiceTestimonials from "../../components/public/services/ServiceTestimonials.jsx";
import ServiceFaq from "../../components/public/services/ServiceFaq.jsx";
import ServiceCta from "../../components/public/services/ServiceCta.jsx";
import AspectImage from "../../components/ui/AspectImage.jsx";

const SITE = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

function ErrorNote({ message }) {
  return <p className="py-16 text-center text-sm text-danger">{message}</p>;
}

const SKELETON_SECTIONS = [
  { key: "grid", cls: "bg-cream py-16" },
  { key: "integrated", cls: "bg-white py-16" },
  { key: "process", cls: "bg-cream py-16" },
  { key: "sektor", cls: "bg-white py-16" },
  { key: "proyek", cls: "bg-cream py-16" },
  { key: "testi", cls: "bg-white py-16" },
  { key: "faq", cls: "bg-cream py-16" },
];

function PageSkeleton() {
  return (
    <div aria-busy="true">
      <div className="bg-cream-deep p-10"><Container><div className="h-40 animate-pulse rounded-2xl bg-white/60" aria-hidden /></Container></div>
      {SKELETON_SECTIONS.map(({ key, cls }) => (
        <div key={key} className={cls}><Container><div className="h-64 animate-pulse rounded-2xl bg-cream-deep" aria-hidden /></Container></div>
      ))}
      <div className="bg-brand py-16"><Container><div className="h-48 animate-pulse rounded-2xl bg-white/20" aria-hidden /></Container></div>
    </div>
  );
}

export function ServicesPage() {
  const { data: services, isLoading, isError } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });
  const rows = services ?? [];
  // JSON-LD: ItemList layanan + tiap Service
  const jsonLd = rows.length > 0 ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        itemListElement: rows.map((s, i) => ({
          "@type": "ListItem", position: i + 1,
          url: `${SITE}/layanan/${s.slug}`, name: s.title,
        })),
      },
      ...rows.map((s) => ({
        "@type": "Service",
        name: s.title,
        description: s.shortDesc || undefined,
        url: `${SITE}/layanan/${s.slug}`,
        provider: { "@type": "GeneralContractor", name: "Jaya Abadi — Kontraktor", url: SITE },
        ...(s.startingPrice ? { offers: { "@type": "Offer", price: s.startingPrice, priceCurrency: "IDR" } } : {}),
      })),
    ],
  } : null;

  if (isError) return <ErrorNote message="Gagal memuat layanan. Coba muat ulang halaman." />;
  if (isLoading) return <><Seo path="/layanan" title="Layanan" /><PageSkeleton /></>;

  return (
    <>
      <Seo path="/layanan" title="Layanan" description="Solusi konstruksi lengkap — dari desain hingga serah terima kunci." jsonLd={jsonLd} />
      <ServicesBanner />

      {/* Section disembunyikan bila datanya kosong */}
      {rows.length > 0 && (
        <section id="layanan" className="scroll-mt-32 bg-cream py-16 sm:py-20">
          <Container>
            <ServiceGrid services={rows} isLoading={false} isError={false} />
          </Container>
        </section>
      )}
      <IntegratedServices services={rows} />
      <ServiceProcess services={rows} />
      <SectorsServed tone="white" />
      <RelatedProjects services={rows} tone="cream" />
      <ServiceTestimonials services={rows} tone="white" />
      <ServiceFaq services={rows} tone="cream" />
      <ServiceCta services={rows} />
    </>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams();
  const { data: service, isLoading, isError, error } = useQuery({
    queryKey: ["public-service", slug],
    queryFn: async () => (await api.get(`/public/services/${slug}`)).data.data,
    retry: false,
  });
  const { data: others } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/public/settings")).data.data,
  });

  if (isError) {
    const is404 = error?.response?.status === 404;
    return (
      <>
        <Seo path={`/layanan/${slug}`} title="Layanan tidak ditemukan" noindex />
        <PageBanner title="Layanan tidak ditemukan" crumbs={[{ label: "Layanan", to: "/layanan" }, { label: "404" }]} />
        <Container className="py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-deep text-brand"><Wrench size={30} /></span>
          <h1 className="mt-5 font-jakarta text-2xl font-extrabold text-ink">{is404 ? "Halaman tidak ditemukan" : "Gagal memuat"}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {is404 ? "Layanan yang Anda cari tidak ada atau sudah dipindahkan. Lihat layanan lainnya di bawah." : "Terjadi kesalahan — coba muat ulang halaman."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PillButton variant="primary" to="/layanan">Semua Layanan</PillButton>
            <PillButton variant="outline" to="/">Beranda</PillButton>
          </div>
          {(others ?? []).length > 0 && (
            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
              {(others ?? []).map((s) => (
                <Link key={s.id} to={`/layanan/${s.slug}`} className="rounded-full bg-cream-deep px-4 py-2 text-sm font-semibold text-ink-soft transition hover:text-brand">
                  {s.title}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </>
    );
  }

  // Skeleton saat data belum ada
  if (!service) {
    return (
      <div aria-busy="true">
        <div className="bg-cream-deep"><Container><div className="my-16 h-56 animate-pulse rounded-2xl bg-ink/10" aria-hidden /></Container></div>
        <Container className="grid gap-10 py-16 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className={`animate-pulse rounded bg-cream-deep ${i % 2 ? "h-4 w-3/4" : "h-4 w-full"}`} aria-hidden />)}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-cream-deep" aria-hidden />
        </Container>
      </div>
    );
  }

  const wa = (settings?.company_whatsapp ?? "").replace(/\D/g, "");
  const rupiahFmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);
  const imgS = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
  const otherServices = (others ?? []).filter((s) => s.slug !== slug).slice(0, 4);

  return (
    <>
      <Seo
        path={`/layanan/${slug}`}
        title={service.metaTitle || service.title}
        description={service.metaDescription || service.shortDesc}
        type="article"
        image={imgS(service.heroImage || service.image) || undefined}
      />

      {/* ===== Hero: gambar lebar + breadcrumb + judul + harga + CTA ===== */}
      <header className="relative bg-ink text-cream">
        <div className="absolute inset-0">
          <AspectImage src={imgS(service.heroImage || service.image)} alt={service.title} ratio="16/9" className="h-full max-h-[36rem] w-full opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        </div>
        <Container className="relative pb-14 pt-28 sm:pt-32">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-cream/60">
            <Link to="/" className="transition hover:text-brand">Home</Link>
            <ChevronRight size={12} />
            <Link to="/layanan" className="transition hover:text-brand">Layanan</Link>
            <ChevronRight size={12} />
            <span className="text-cream">{service.title}</span>
          </nav>
          <div className="mt-4 flex items-center gap-3">
            {(() => { const I = SERVICE_ICONS[service.icon] ?? Wrench; return <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-soft-lg"><I size={22} /></span>; })()}
            <h1 className="font-jakarta text-3xl font-extrabold sm:text-5xl">{service.title}</h1>
          </div>
          {service.shortDesc && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/85 sm:text-base">{service.shortDesc}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {service.startingPrice ? (
              <span className="rounded-full bg-cream/10 px-4 py-2 text-sm font-semibold text-cream backdrop-blur">
                Mulai dari <b className="font-jakarta text-base">{rupiahFmt(service.startingPrice)}</b>
              </span>
            ) : null}
            <PillButton variant="primary" to={`/kontak?layanan=${slug}`}>Minta Penawaran <ArrowRight size={15} /></PillButton>
            {service.brochureUrl ? (
              <a href={imgS(service.brochureUrl)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-cream/25 px-6 py-3 text-sm font-bold text-cream transition hover:border-brand hover:text-brand">
                <Download size={15} /> Unduh Brosur
              </a>
            ) : null}
          </div>
        </Container>
      </header>

      {/* ===== Dua kolom: konten + sidebar sticky ===== */}
      <div className="bg-cream py-14">
        {/* Tombol kembali ke daftar layanan */}
        <Container>
          <Link
            to="/layanan"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink-soft shadow-soft transition hover:border-brand hover:text-brand"
          >
            <ArrowLeft size={15} /> Kembali ke Layanan
          </Link>
        </Container>
        <Container className="mt-6 grid gap-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-3">
          <main className="min-w-0 space-y-12 lg:col-span-2">
            {/* Deskripsi lengkap */}
            {(service.longDescription || service.description) && (
              <section aria-label="Deskripsi layanan">
                <div className="prose-jaya whitespace-pre-line leading-relaxed text-ink-soft">
                  {service.longDescription || service.description}
                </div>
              </section>
            )}

            {/* Ruang lingkup */}
            {(service.scopes ?? []).length > 0 && (
              <section aria-label="Ruang lingkup" id="detail-scope" className="scroll-mt-28">
                <h2 className="font-jakarta text-2xl font-extrabold text-ink">Ruang <span className="text-brand">Lingkup</span></h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {service.scopes.map((sc, i) => {
                    const Icon = SERVICE_ICONS[sc.icon] ?? Wrench;
                    return (
                      <div key={sc.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><Icon size={19} /></span>
                        <div>
                          <p className="font-jakarta text-sm font-bold text-ink">{sc.title}</p>
                          {sc.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-light">{sc.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Alur kerja khusus layanan — timeline vertikal */}
            {(service.processSteps ?? []).length > 0 && (
              <section aria-label="Alur kerja" id="detail-alur" className="scroll-mt-28">
                <h2 className="font-jakarta text-2xl font-extrabold text-ink">Alur <span className="text-brand">Kerja</span></h2>
                <ol className="relative mt-6 space-y-6 border-l-2 border-dashed border-ink/15 pl-6" role="list">
                  {service.processSteps.map((st, i) => {
                    const Icon = SERVICE_ICONS[st.icon] ?? Wrench;
                    return (
                      <li key={st.id} className="relative">
                        <span className="absolute -left-[2.42rem] flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand bg-cream text-brand">
                          <Icon size={16} />
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-cream">{i + 1}</span>
                        </span>
                        <div className="rounded-2xl bg-white p-4 shadow-soft">
                          <p className="font-jakarta text-sm font-bold text-ink">{st.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{st.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Proyek terkait — carousel */}
            {(service.projects ?? []).length > 0 && (
              <section aria-label="Proyek terkait">
                <h2 className="font-jakarta text-2xl font-extrabold text-ink">Proyek <span className="text-brand">Terkait</span></h2>
                <div className="-mx-5 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {service.projects.map((p) => (
                    <Link key={p.id} to={`/proyek/${p.slug}`} className="w-[75%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.8335rem)]">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-deep">
                        <img src={imgS(p.coverImage)} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                        <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink/70 px-3 py-1 text-[11px] font-medium text-cream backdrop-blur">{[p.location, p.year].filter(Boolean).join(" · ")}</span>
                      </div>
                      <p className="mt-2.5 font-jakarta font-bold text-ink transition hover:text-brand">{p.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Testimoni terkait */}
            {(service.testimonials ?? []).length > 0 && (
              <section aria-label="Testimoni">
                <h2 className="font-jakarta text-2xl font-extrabold text-ink">Testimoni <span className="text-brand">klien</span></h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {service.testimonials.slice(0, 4).map((t) => (
                    <figure key={t.id} className="rounded-2xl bg-white p-5 shadow-soft">
                      <div role="img" className="flex gap-0.5" aria-label={`${t.rating ?? 5} dari 5 bintang`}>
                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= (t.rating ?? 5) ? "fill-brand text-brand" : "text-ink/15"} />)}
                      </div>
                      <blockquote className="mt-2 text-sm leading-relaxed text-ink-soft">“{t.content}”</blockquote>
                      <figcaption className="mt-3 text-xs font-semibold text-ink">{t.name}<span className="font-normal text-ink-light">{t.position ? ` · ${t.position}` : ""}{t.company ? `, ${t.company}` : ""}</span></figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ khusus layanan — reuse ServiceFaq */}
            {(service.faqs ?? []).length > 0 && <ServiceFaq services={[{ ...service }]} />}
          </main>

          {/* ===== Sidebar sticky: menempel saat halaman di-scroll ===== */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4">
              {/* Kartu kontak cepat */}
              <div className="rounded-2xl bg-ink p-6 text-cream">
                <h2 className="font-jakarta font-bold">Tertarik dengan {service.title}?</h2>
                <p className="mt-1 text-xs text-cream/70">Konsultasi gratis — balasan cepat di jam kerja.</p>
                <PillButton variant="primary" to={`/kontak?layanan=${slug}`} className="mt-4 w-full !py-2.5">Minta Penawaran</PillButton>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a href={`tel:${(settings?.company_phone ?? "").replace(/\s/g, "")}`} aria-label="Telepon" className="flex items-center justify-center rounded-xl bg-white/10 py-2.5 transition hover:bg-brand"><Phone size={16} /></a>
                  <a href={wa ? `https://wa.me/${wa}` : "#"} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex items-center justify-center rounded-xl bg-white/10 py-2.5 transition hover:bg-brand"><MessageCircle size={16} /></a>
                  <span className="sr-only">Form mini di bagian bawah layar di perangkat seluler</span>
                  <a href="#quick-form" aria-label="Form mini" className="flex items-center justify-center rounded-xl bg-white/10 py-2.5 transition hover:bg-brand"><Send size={16} /></a>
                </div>
              </div>

              {service.brochureUrl ? (
                <a href={imgS(service.brochureUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 bg-white p-4 transition hover:border-brand">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><Download size={18} /></span>
                  <span className="text-sm font-bold text-ink">Unduh <span className="text-brand">Brosur</span> {service.title}</span>
                </a>
              ) : null}

              {/* Layanan lain — penanda aktif */}
              <div className="rounded-2xl bg-white p-5 shadow-soft">
                <h2 className="font-jakarta text-sm font-bold text-ink">Layanan Lain</h2>
                <ul className="mt-3 space-y-1.5" role="list">
                  {(others ?? []).map((s) => (
                    <li key={s.id}>
                      <Link to={`/layanan/${s.slug}`} aria-current={s.slug === slug ? "page" : undefined}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          s.slug === slug ? "bg-brand-soft text-brand-dark font-bold" : "text-ink-soft hover:bg-cream-deep hover:text-brand"
                        }`}>
                        {s.title}
                        {s.slug === slug ? <CircleDot size={13} /> : <ChevronRight size={13} className="opacity-40" />}
                      </Link>
                    </li>
                  ))}
                </ul>
                {/* Form mini (target #quick-form) — nama + WhatsApp */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await api.post("/public/messages", { name: fd.get("name"), phone: fd.get("phone"), subject: `Konsultasi ${service.title}`, body: `Saya tertarik layanan ${service.title} — mohon dihubungi.`, }).catch(() => e.target.reset());
                  toast.success("Terkirim! Kami akan menghubungi Anda.");
                  e.target.reset();
                }} id="quick-form" className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                  <p className="font-jakarta text-sm font-bold text-ink">Resume singkat</p>
                  <input name="name" required minLength={2} placeholder="Nama Anda" aria-label="Nama" className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-3.5 py-2 text-sm outline-none focus:border-brand" />
                  <input name="phone" required minLength={6} type="tel" placeholder="No. WhatsApp" aria-label="Nomor WhatsApp" className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-3.5 py-2 text-sm outline-none focus:border-brand" />
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <button type="submit" className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark">Hubungi Saya</button>
                </form>
              </div>

              {/* Jam kerja */}
              {settings?.company_work_hours && (
                <div className="flex items-start gap-3 rounded-2xl bg-cream-deep p-4">
                  <Clock size={16} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-light">Jam Kerja</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{settings.company_work_hours}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </Container>
      </div>

      {/* Bar melayang mobile: Telepon / WhatsApp */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-ink/10 bg-white/95 p-3 shadow-soft-lg backdrop-blur lg:hidden">
        <a href={`tel:${(settings?.company_phone ?? "").replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 py-2.5 text-sm font-bold text-ink">
          <Phone size={16} /> Telepon
        </a>
        <a href={wa ? `https://wa.me/${wa}` : "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-white">
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>
      {/* Spacer agar bar melayang tidak menutupi konten terakhir di mobile */}
      <div aria-hidden className="h-16 lg:hidden" />
    </>
  );
}
