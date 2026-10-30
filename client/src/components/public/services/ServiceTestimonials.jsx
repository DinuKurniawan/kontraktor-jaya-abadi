/*
 * ServiceTestimonials — filter layanan + 3 kartu testimoni (bintang, kutipan,
 * nama, jabatan, label layanan). PartnerMarquee di bawahnya.
 * Data: GET /api/public/testimonials?serviceId= (mapping id → label layanan di client).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import PartnerMarquee from "../home/PartnerMarquee.jsx";
import Reveal from "./Reveal.jsx";

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? "fill-brand text-brand" : "text-ink/15"} />
      ))}
    </div>
  );
}

export default function ServiceTestimonials({ services }) {
  const [svc, setSvc] = useState(""); // "" = Semua
  const active = (services ?? []).find((s) => s.slug === svc) ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["public-testimonials", active?.id ?? "all"],
    queryFn: async () => (await api.get("/public/testimonials", { params: active?.id ? { serviceId: active.id } : {} })).data.data,
  });
  const rows = (data ?? []).slice(0, 3);
  const labelFor = (id) => (services ?? []).find((s) => s.id === id)?.title ?? null;

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Testimoni</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Kata <span className="text-brand">mereka</span></h2>
        </div>

        {/* Filter layanan */}
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter testimoni per layanan">
          <button type="button" role="tab" aria-selected={svc === ""} onClick={() => setSvc("")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${svc === "" ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
            Semua
          </button>
          {(services ?? []).map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={svc === s.slug} onClick={() => setSvc(s.slug)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${svc === s.slug ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
              {s.title}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-cream-deep" aria-hidden />)}
          </div>
        ) : rows.length === 0 ? null : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {rows.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}
                className="relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-soft">
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
                {labelFor(t.serviceId) && (
                  <span className="mt-3 self-start rounded-full bg-cream-deep px-3 py-1 text-[11px] font-bold text-ink-soft">{labelFor(t.serviceId)}</span>
                )}
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-14">
          <PartnerMarquee />
        </div>
      </Container>
    </section>
  );
}
