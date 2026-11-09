/*
 * ServiceTestimonials — kartu testimoni berjalan otomatis (marquee), sama seperti
 * section "Dipercaya oleh": satu baris, konten diduplikasi agar loop mulus, dan
 * berhenti saat kursor di atasnya. Hormati prefers-reduced-motion → grid statis.
 * Data: GET /api/public/testimonials?serviceId= (mapping id → label layanan di client).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import PartnerMarquee from "../home/PartnerMarquee.jsx";

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? "fill-brand text-brand" : "text-ink/15"} />
      ))}
    </div>
  );
}

function TestimonialCard({ t, label, className = "" }) {
  return (
    <article className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-soft ${className}`}>
      <Quote size={26} className="absolute right-5 top-5 text-brand/15" aria-hidden />
      <Stars rating={t.rating ?? 5} />
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">“{t.content}”</p>
      <div className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-jakarta text-sm font-extrabold text-brand-dark">
          {(t.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="font-jakarta text-sm font-bold text-ink">{t.name}</p>
          <p className="text-xs text-ink-light">{[t.position, t.company].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {label && (
        <span className="mt-3 self-start rounded-full bg-cream-deep px-3 py-1 text-[11px] font-bold text-ink-soft">{label}</span>
      )}
    </article>
  );
}

export default function ServiceTestimonials({ services, tone = "cream" }) {
  const [reduced, setReduced] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["public-testimonials", "all"],
    queryFn: async () => (await api.get("/public/testimonials")).data.data,
  });
  const rows = data ?? [];
  const labelFor = (id) => (services ?? []).find((s) => s.id === id)?.title ?? null;
  // Latar section bisa diganti agar warna antar-section tetap selang-seling
  const bgClass = tone === "white" ? "bg-white" : "bg-cream";

  // Pengguna yang memilih animasi minimal mendapat grid biasa, bukan marquee
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Satu set minimal 6 kartu agar setengah trek selalu lebih lebar dari layar
  const perSet = rows.length > 0 ? Math.max(2, Math.ceil(6 / rows.length)) : 0;
  const set = Array.from({ length: perSet }, () => rows).flat();
  const track = [...set, ...set]; // x2 → geser -50% terlihat mulus

  return (
    <section id="testimoni" className={`scroll-mt-32 ${bgClass} py-16 sm:py-20`}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Testimoni</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Kata <span className="text-brand">mereka</span></h2>
        </div>

        {/* Filter testimoni: hanya tampilkan semua */}
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter testimoni per layanan">
          <button type="button" aria-pressed="true" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream">
            Semua
          </button>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-cream-deep" aria-hidden />)}
          </div>
        ) : rows.length === 0 ? null : reduced ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {rows.map((t) => <TestimonialCard key={t.id} t={t} label={labelFor(t.serviceId)} />)}
          </div>
        ) : (
          // py-2 memberi ruang agar bayangan kartu tidak terpotong overflow-hidden
          <div className="group/marquee marquee-mask mt-10 overflow-hidden py-2">
            <div
              className="flex w-max animate-marquee items-stretch gap-5 pr-5"
              style={{ "--marquee-duration": "60s" }}
            >
              {track.map((t, i) => (
                <div key={`${t.id}-${i}`} aria-hidden={i >= set.length} className="w-[20rem] shrink-0 sm:w-[22rem]">
                  <TestimonialCard t={t} label={labelFor(t.serviceId)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14">
          <PartnerMarquee />
        </div>
      </Container>
    </section>
  );
}
