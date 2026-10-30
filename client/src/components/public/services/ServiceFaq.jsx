/*
 * ServiceFaq — tab layanan (kiri desktop / atas mobile) + accordion FAQ
 * (satu terbuka, aria-expanded/controls), kolom "Belum terjawab?" + tombol WhatsApp.
 * JSON-LD FAQPage disisipkan via Helmet.
 * Data: GET /api/public/faqs?serviceId=.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ChevronDown, MessageCircle } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

const SITE = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const WA = "6281234567890"; // ponytail: nomor WA hardcode — ganti ke site_settings saat admin form tersedia

export default function ServiceFaq({ services }) {
  const [svc, setSvc] = useState(services?.[0]?.slug ?? "");
  const [open, setOpen] = useState(null); // index FAQ terbuka

  const active = useMemo(() => (services ?? []).find((s) => s.slug === svc) ?? null, [services, svc]);
  const { data, isLoading } = useQuery({
    queryKey: ["public-faqs", active?.id ?? "all"],
    queryFn: async () => (await api.get("/public/faqs", { params: active?.id ? { serviceId: active.id } : {} })).data.data,
  });
  const rows = (data ?? []).slice(0, 10);
  const scope = active ? `${active.title} — Faq` : "Faq Umum";

  return (
    <section id="faq" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: rows.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        })}</script>
      </Helmet>

      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">FAQ</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Pertanyaan yang <span className="text-brand">sering diajukan</span></h2>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Tab layanan */}
          <div role="tablist" aria-label="Pilih layanan untuk FAQ" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <button type="button" role="tab" aria-selected={svc === ""} onClick={() => { setSvc(""); setOpen(null); }}
              className={`shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition lg:w-full lg:rounded-2xl ${svc === "" ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              Semua Layanan
            </button>
            {(services ?? []).map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={svc === s.slug} onClick={() => { setSvc(s.slug); setOpen(null); }}
                className={`shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition lg:w-full lg:rounded-2xl ${svc === s.slug ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
                {s.title}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-cream-deep" aria-hidden />)}
              </div>
            ) : rows.length === 0 ? (
              <p className="rounded-2xl bg-cream-deep p-6 text-sm text-ink-light">Belum ada FAQ untuk {scope.toLowerCase()} — silakan tanya langsung lewat WhatsApp.</p>
            ) : (
              <ul className="space-y-3" role="list">
                {rows.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <li key={f.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-cream-deep/50 transition focus-within:border-brand/40">
                      <button type="button" aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} id={`faq-btn-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-jakarta text-sm font-bold text-ink transition hover:text-brand">
                        {f.question}
                        <ChevronDown size={17} className={`shrink-0 text-brand transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} hidden={!isOpen}
                        className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                        {f.answer}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* CTA WhatsApp */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-5">
              <div>
                <p className="font-jakarta text-sm font-bold text-cream">Pertanyaan Anda belum terjawab?</p>
                <p className="mt-0.5 text-xs text-cream/70">Tanya langsung ke tim kami — gratis, tanpa komitmen.</p>
              </div>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark">
                <MessageCircle size={15} /> Tanya via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
