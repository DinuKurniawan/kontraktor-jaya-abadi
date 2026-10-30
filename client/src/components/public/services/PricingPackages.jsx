/*
 * PricingPackages — pilihan layanan (segmented control), kartu paket per layanan.
 * Popular: lebih besar + lencana "Paling Populer" + bingkai oranye. Mobile: carousel
 * scroll-snap. Tombol paket → modal singkat (nama, WhatsApp, luas/lokasi) →
 * POST /api/public/messages. Catatan harga indikatif + tautan estimasi biaya.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Check, ChevronDown, MessageCircle, Star, X } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import Reveal from "./Reveal.jsx";

export const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const EMPTY_FORM = { name: "", phone: "", note: "", website: "" };

export default function PricingPackages({ services }) {
  const [svcSlug, setSvcSlug] = useState(services?.[0]?.slug ?? "");
  const [form, setForm] = useState(null); // null = modal tertutup; {pkg, fields}
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const active = useMemo(() => services?.find((s) => s.slug === svcSlug) ?? services?.[0], [services, svcSlug]);
  const { data, isLoading } = useQuery({
    queryKey: ["public-service-packages", active?.id],
    enabled: !!active?.id,
    queryFn: async () => (await api.get("/public/service-packages", { params: { serviceId: active.id } })).data.data,
  });
  const rows = data ?? [];

  // Kirim pesan paket — hindari kirim ganda via state sending
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const f = form.fields;
    if (f.name.trim().length < 2) return setErr("Nama minimal 2 karakter");
    if (f.phone.trim().length < 6) return setErr("Nomor WhatsApp minimal 6 karakter");
    if ((f.note ?? "").trim().length < 10) return setErr("Tuliskan kebutuhan singkat (min. 10 karakter)");
    setSending(true);
    try {
      await api.post("/public/messages", {
        name: f.name.trim(),
        phone: f.phone.trim(),
        subject: `Paket ${form.pkg.name} — ${active.title}`,
        body: `Saya tertarik paket "${form.pkg.name}" (${rupiah(form.pkg.priceFrom)} ${form.pkg.priceUnit ?? ""}) untuk layanan ${active.title}. ${f.note.trim()} Luas/lokasi: ${f.note.trim()}`,
        website: f.website, // honeypot
      });
      setDone(true);
    } catch {
      setErr("Gagal mengirim — coba lagi.");
    } finally {
      setSending(false);
    }
  };

  if (!active) return null;

  return (
    <section id="paket" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Paket Layanan</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Harga jelas <span className="text-brand">sejak awal</span></h2>
        </div>

        {/* Segmented control layanan */}
        <div className="mx-auto mt-8 flex max-w-fit flex-wrap justify-center gap-1 rounded-full bg-cream-deep p-1.5" role="tablist" aria-label="Pilih layanan untuk paket harga">
          {services.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={active.slug === s.slug} onClick={() => setSvcSlug(s.slug)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active.slug === s.slug ? "bg-ink text-cream shadow-soft" : "text-ink-soft hover:text-brand"}`}>
              {s.title}
            </button>
          ))}
        </div>

        {/* Kartu paket — carousel scroll-snap di mobile */}
        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-cream-deep" aria-hidden />)}
          </div>
        ) : rows.length === 0 ? null : (
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:flex-wrap">
            {rows.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}
                className={`w-[82%] shrink-0 snap-center sm:w-auto ${p.isPopular ? "sm:row-span-1 lg:scale-[1.04]" : ""}`}>
                <div className={`relative flex h-full flex-col rounded-3xl border-2 p-6 transition hover:shadow-soft-lg ${
                  p.isPopular ? "border-brand bg-brand-soft/40 shadow-soft-lg" : "border-ink/10 bg-white"
                }`}>
                  {p.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">
                      <Star size={11} /> Paling Populer
                    </span>
                  )}
                  <h3 className="font-jakarta text-lg font-extrabold text-ink">{p.name}</h3>
                  {p.description && <p className="mt-1 text-sm text-ink-light">{p.description}</p>}
                  <p className="mt-4 font-jakarta text-2xl font-extrabold text-brand">
                    {rupiah(p.priceFrom)} {p.priceUnit && <span className="text-sm font-semibold text-ink-light">/ {p.priceUnit}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-light">Mulai dari</p>
                  <ul className="mt-4 flex-1 space-y-2.5" role="list">
                    {(p.features ?? []).map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-ink-soft">
                        <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand"><Check size={11} strokeWidth={3} /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => { setForm({ pkg: p, fields: { ...EMPTY_FORM } }); setDone(false); setErr(""); }}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                      p.isPopular ? "bg-brand text-white hover:bg-brand-dark" : "border-2 border-ink/15 bg-white text-ink hover:border-brand hover:text-brand"
                    }`}>
                    <MessageCircle size={15} /> {p.ctaLabel || "Konsultasi Sekarang"}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-ink-light">
          <span>Harga indikatif — penawaran final setelah survei lokasi.</span>
          <a href="/#estimasi" className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">
            <Calculator size={14} /> Hitung estimasi biaya
          </a>
        </p>
      </Container>

      {/* Modal form singkat */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Minta penawaran ${form.pkg.name}`}>
          <button type="button" aria-label="Tutup" onClick={() => setForm(null)} className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-soft-lg" style={{ animation: "fade-in 0.25s ease-out both" }}>
            <button type="button" onClick={() => setForm(null)} aria-label="Tutup" className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-light transition hover:bg-cream-deep hover:text-ink"><X size={18} /></button>
            {done ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"><Check size={22} /></span>
                <h3 className="mt-4 font-jakarta text-lg font-bold text-ink">Permintaan terkirim!</h3>
                <p className="mt-1.5 text-sm text-ink-soft">Tim kami akan menghubungi WhatsApp Anda maksimal 1×24 jam kerja.</p>
                <button type="button" onClick={() => setForm(null)} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-cream transition hover:bg-ink/80">Mengerti</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h3 className="font-jakarta text-lg font-bold text-ink">Minta penawaran — {form.pkg.name}</h3>
                <p className="mt-0.5 text-sm text-ink-light">{rupiah(form.pkg.priceFrom)} {form.pkg.priceUnit ?? ""} · {active.title}</p>
                <div className="mt-4 space-y-3">
                  <input type="hidden" name="website" value={form.fields.website} /> {/* honeypot */}
                  <input value={form.fields.name} onChange={(e) => setForm({ ...form, fields: { ...form.fields, name: e.target.value } })}
                    placeholder="Nama Anda" aria-label="Nama" required className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  <input type="tel" value={form.fields.phone} onChange={(e) => setForm({ ...form, fields: { ...form.fields, phone: e.target.value } })}
                    placeholder="No. WhatsApp (cth: 0812xxxx)" aria-label="Nomor WhatsApp" required className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  <textarea rows={3} value={form.fields.note} onChange={(e) => setForm({ ...form, fields: { ...form.fields, note: e.target.value } })}
                    placeholder="Luas area / lokasi & kebutuhan singkat" aria-label="Luas, lokasi, dan kebutuhan" required
                    className="w-full rounded-xl border border-ink/10 bg-cream-deep/60 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
                {err && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{err}</p>}
                <button type="submit" disabled={sending}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? "Mengirim…" : <><MessageCircle size={15} /> Kirim via WhatsApp</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
