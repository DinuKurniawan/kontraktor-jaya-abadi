/*
 * HistoryTimeline — timeline vertikal bergantian kiri-kanan (desktop, garis
 * tengah + titik oranye), satu kolom di mobile. Garis terisi progresif saat
 * scroll; kartu muncul bergantian. Data: GET /api/public/milestones (sort tahun).
 * id="sejarah" (anchor AboutBanner).
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

export default function HistoryTimeline() {
  const { data } = useQuery({
    queryKey: ["public-milestones"],
    queryFn: async () => (await api.get("/public/milestones")).data.data,
  });
  const rows = (data ?? []).slice().sort((a, b) => a.year - b.year);
  const wrap = useRef(null);
  const [fill, setFill] = useState(0);

  // Isi garis proporsional posisi scroll melewati section
  useEffect(() => {
    if (rows.length === 0) return;
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
      setFill(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [rows.length]);

  if (rows.length === 0) return null;

  return (
    <section id="sejarah" className="scroll-mt-32 bg-white py-16 sm:py-20" ref={wrap}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Perjalanan Kami</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Sejak <span className="text-brand">2006</span>, satu langkah demi satu langkah</h2>
        </div>

        <div className="relative mt-12">
          {/* Garis tengah + garis progres */}
          <div aria-hidden className="absolute left-4 top-0 h-full w-px bg-ink/10 md:left-1/2" />
          <div aria-hidden className="absolute left-4 top-0 w-px bg-brand transition-[height] duration-300 md:left-1/2" style={{ height: `${fill * 100}%` }} />

          <ol className="space-y-10">
            {rows.map((m, i) => (
              <li key={m.id} className={`relative flex md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-12" : "md:flex-row-reverse md:pr-12 md:text-right"} pl-12 md:pl-0`}>
                {/* Titik */}
                <span aria-hidden className={`absolute left-4 top-6 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-brand bg-white transition-colors md:left-auto ${i % 2 ? "md:left-0" : "md:right-0"} ${fill * rows.length > i ? "bg-brand" : ""}`} />
                {/* Kartu */}
                <div className={`w-full overflow-hidden rounded-2xl border border-ink/8 bg-cream-deep/60 shadow-soft transition-all duration-500 ${i % 2 ? "animate-in-right" : "animate-in-left"}`}>
                  {m.image && <img src={img(m.image)} alt={m.title} loading="lazy" className="h-40 w-full object-cover" />}
                  <div className="p-5">
                    <p className="font-jakarta text-xl font-extrabold text-brand">{m.year}</p>
                    <h3 className="mt-1 font-jakarta font-bold text-ink">{m.title}</h3>
                    {m.description && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.description}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
