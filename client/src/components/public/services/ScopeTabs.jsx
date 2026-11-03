/*
 * ScopeTabs — tab horizontal per layanan (scroll geser di mobile);
 * isi: gambar satu sisi + grid ruang lingkup (ikon, judul, deskripsi) di sisi lain,
 * transisi fade antar tab, tombol "Detail layanan" & "Minta penawaran"
 * (/kontak?layanan=slug). Tab aktif di URL ?tab=slug.
 */
import { useSearchParams } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import Container from "../Container.jsx";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";
import { Wrench } from "lucide-react";
import AspectImage from "../../ui/AspectImage.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

export default function ScopeTabs({ services }) {
  const [sp, setSp] = useSearchParams();
  const rows = (services ?? []);
  if (rows.length === 0) return null;

  const urlTab = sp.get("tab");
  const current = rows.find((s) => s.slug === urlTab) ?? rows[0];
  const setTab = (slug) => {
    setSp((previous) => {
      const next = new URLSearchParams(previous);
      if (slug === rows[0].slug) next.delete("tab");
      else next.set("tab", slug);
      return next;
    });
  };

  return (
    <section id="ruang-lingkup" className="scroll-mt-32 bg-cream py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Ruang Lingkup</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Apa saja yang <span className="text-brand">kami kerjakan</span></h2>
        </div>

        {/* Tab bar (geser di mobile) */}
        <div role="tablist" aria-label="Pilih layanan" className="mt-8 -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {rows.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={current.slug === s.slug} onClick={() => setTab(s.slug)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${current.slug === s.slug ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
              {s.title}
            </button>
          ))}
        </div>

        {/* Isi tab */}
        <div key={current.slug} className="mt-8 grid items-start gap-8 rounded-3xl bg-white p-6 shadow-soft sm:p-8 lg:grid-cols-5" style={{ animation: "fade-in 0.4s ease-out both" }}>
          {/* Gambar */}
          <div className="lg:col-span-2">
            <AspectImage src={img(current.image || current.heroImage)} alt={current.title} ratio="4/3" className="rounded-2xl" />
            {current.startingPrice ? (
              <p className="mt-3 text-sm text-ink-light">Mulai dari <span className="font-jakarta font-bold text-ink">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(current.startingPrice)}</span></p>
            ) : null}
          </div>

          {/* Grid scopes */}
          <div className="lg:col-span-3">
            <h3 className="font-jakarta text-xl font-extrabold text-ink">{current.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{current.shortDesc}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(current.scopes ?? []).map((sc, i) => {
                const Icon = SERVICE_ICONS[sc.icon] ?? Wrench;
                return (
                  <div key={sc.id} className="flex items-start gap-3 rounded-2xl bg-cream-deep/60 p-4" style={{ animation: `fade-in 0.4s ease-out both ${i * 0.06}s` }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><Icon size={18} /></span>
                    <div>
                      <p className="font-jakarta text-sm font-bold text-ink">{sc.title}</p>
                      {sc.description && <p className="mt-0.5 break-words text-xs leading-relaxed text-ink-light">{sc.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`/layanan/${current.slug}`} className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">
                Detail layanan <ArrowRight size={15} />
              </a>
              <a href={`/kontak?layanan=${current.slug}`} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft-lg transition hover:bg-brand-dark">
                <MessageCircle size={15} /> Minta Penawaran
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
