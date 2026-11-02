// ContactFaq — FAQ umum, accordion aksesibel, CTA kontak, dan JSON-LD FAQPage.
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ChevronDown, MessageCircle, Phone } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

export default function ContactFaq({ settings, branch }) {
  const [openId, setOpenId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["public-contact-faqs"],
    queryFn: async () => (await api.get("/public/faqs")).data.data,
  });
  const rows = useMemo(() => (data ?? []).filter((faq) => !faq.serviceId).slice(0, 10), [data]);

  useEffect(() => {
    setOpenId((current) => rows.some((faq) => faq.id === current) ? current : rows[0]?.id ?? null);
  }, [rows]);

  const whatsapp = String(branch?.whatsapp || settings?.company_whatsapp || "").replace(/\D/g, "");
  const phone = branch?.phone || settings?.company_phone || "";
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Jaya Abadi, saya masih memiliki pertanyaan tentang konsultasi proyek.")}` : "#";
  const phoneHref = phone ? `tel:${phone.replace(/\D/g, "")}` : "#";
  const jsonLd = rows.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rows.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null;

  return (
    <section className="bg-cream-deep py-14 sm:py-16" aria-labelledby="contact-faq-title">
      {jsonLd && <Helmet><script type="application/ld+json">{JSON.stringify(jsonLd)}</script></Helmet>}
      <Container>
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">FAQ Umum</p><h2 id="contact-faq-title" className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Pertanyaan yang <span className="text-brand">sering diajukan</span></h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">Jawaban singkat untuk membantu Anda memulai konsultasi proyek.</p></div>
        <div className="mx-auto mt-9 max-w-4xl">
          {isLoading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/70" aria-hidden />)}</div> : rows.length === 0 ? <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-light">Belum ada pertanyaan umum yang tersedia.</p> : <div className="space-y-3">{rows.map((faq) => { const isOpen = openId === faq.id; const panelId = `contact-faq-panel-${faq.id}`; const buttonId = `contact-faq-button-${faq.id}`; return <div key={faq.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft transition focus-within:border-brand/40"><h3><button type="button" id={buttonId} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenId(isOpen ? null : faq.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-jakarta text-sm font-bold text-ink transition hover:text-brand sm:px-6 sm:py-5">{faq.question}<ChevronDown size={18} className={`shrink-0 text-brand transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden /></button></h3><div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-ink-soft whitespace-pre-line sm:px-6">{faq.answer}</div></div>; })}</div>}
          <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-ink px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h3 className="font-jakarta text-lg font-extrabold text-cream">Masih ada pertanyaan?</h3><p className="mt-1 text-sm text-cream/70">Tim kami siap membantu menjawab kebutuhan proyek Anda.</p></div><div className="flex flex-wrap gap-2"><a href={whatsappHref} target={whatsapp !== "" ? "_blank" : undefined} rel={whatsapp !== "" ? "noreferrer" : undefined} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white transition ${whatsapp ? "bg-[#25D366] hover:brightness-105" : "pointer-events-none bg-white/20"}`}><MessageCircle size={15} /> WhatsApp</a><a href={phoneHref} className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${phone ? "border-white/30 text-white hover:border-white" : "pointer-events-none border-white/10 text-white/40"}`}><Phone size={15} /> Telepon</a></div></div>
        </div>
      </Container>
    </section>
  );
}
