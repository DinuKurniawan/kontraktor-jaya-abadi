/*
 * FaqSection — kiri: judul, deskripsi singkat, tombol "Tanya via WhatsApp";
 * kanan: accordion (satu terbuka, animasi grid-rows halus, aria-expanded,
 * dapat dioperasikan keyboard). Data: GET /api/public/faqs.
 * JSON-LD FAQPage disuntikkan untuk SEO.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MessageCircle } from "lucide-react";
import api from "../../../lib/axios.js";

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`faq-${faq.id}`} id={`faq-btn-${faq.id}`}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-jakarta font-bold text-ink">
          {faq.question}
          <ChevronDown size={18} className={`shrink-0 text-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {/* Animasi tinggi: grid-rows 0fr→1fr (murni CSS, tanpa ukur px) */}
      <div id={`faq-${faq.id}`} role="region" aria-labelledby={`faq-btn-${faq.id}`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0">
          <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const { data } = useQuery({
    queryKey: ["public-faqs"],
    queryFn: async () => (await api.get("/public/faqs")).data.data,
  });
  const rows = (data ?? []).slice(0, 8);
  const [openId, setOpenId] = useState(null);

  useEffect(() => setOpenId(rows[0]?.id ?? null), [rows]); // satu terbuka pertama
  useEffect(() => {
    if (rows.length === 0) return;
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: rows.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
    document.head.appendChild(ld);
    return () => ld.remove();
  }, [rows]);

  if (rows.length === 0) return null;
  const wa = import.meta.env.VITE_WA_NUMBER ?? "6281234567890";

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">FAQ</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Pertanyaan yang <span className="text-brand">sering diajukan</span>
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Belum menemukan jawaban? Tim kami siap membantu via WhatsApp — balasan cepat di jam kerja.
          </p>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-jakarta font-bold text-white shadow-soft transition hover:brightness-105">
            <MessageCircle size={16} /> Tanya via WhatsApp
          </a>
        </div>
        <div className="space-y-3 lg:col-span-3">
          {rows.map((f) => (
            <FaqItem key={f.id} faq={f} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
