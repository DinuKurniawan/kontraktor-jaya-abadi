/*
 * ProcessSection — timeline alur kerja (Konsultasi → … → Serah Terima).
 * Desktop: garis horizontal putus-putus, progress terisi bertahap saat terlihat.
 * Mobile: vertikal. Ikon dari SERVICE_ICONS (sama dgn admin ProcessSteps).
 * Data: GET /api/public/process-steps.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hammer } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";

// id dipakai saat section ini jadi target anchor sub-navigasi (mis. "Alur" di /layanan)
export default function ProcessSection({ services, id }) {
  const { data } = useQuery({
    queryKey: ["public-process-steps"],
    queryFn: async () => (await api.get("/public/process-steps")).data.data,
  });
  const all = (data ?? []).slice(0, 6);
  const rows = all;
  const ref = useRef(null);
  const [p, setP] = useState(0); // 0..1 progress garis terisi

  useEffect(() => {
    const el = ref.current;
    if (!el || rows.length === 0) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setP(1); io.disconnect(); } },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rows.length]);

  if (rows.length === 0 && !services?.length) return null;

  return (
    <section id={id} ref={ref} className={`${id ? "scroll-mt-32" : ""} bg-cream py-16 sm:py-20`}>
      <Container className={rows.length > 4 ? "max-w-7xl" : ""}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Cara Kami Bekerja</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">
            Lima langkah, <span className="text-brand">tanpa drama</span>
          </h2>
        </div>

        {/* Filter alur kerja: hanya tampilkan semua langkah */}
        {services?.length ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter alur kerja per layanan">
            <button type="button" aria-pressed="true" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream">
              Semua
            </button>
          </div>
        ) : null}

        <ol className="relative mt-12 space-y-8 md:flex md:space-y-0">
          {/* Garis dasar putus-putus */}
          <div aria-hidden className="absolute left-[1.4rem] top-2 h-full border-l-2 border-dashed border-ink/15 md:left-8 md:top-7 md:h-0 md:w-[calc(100%-4rem)] md:border-l-0 md:border-t-2" />
          {/* Garis terisi horizontal saat terlihat (desktop saja; di mobile pakai garis vertikal) */}
          <div aria-hidden className="absolute left-8 top-7 hidden h-0 border-t-2 border-brand transition-[width] duration-1000 ease-out md:block"
            style={{ width: `${p * 100}%` }} />
          {rows.map((s, i) => {
            const Icon = SERVICE_ICONS[s.icon] ?? Hammer;
            const last = i === rows.length - 1;
            return (
              <li key={s.id} className="relative flex gap-4 pl-1 md:flex-1 md:flex-col md:items-center md:gap-0 md:pl-0 md:text-center">
                <span
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-700 md:h-16 md:w-16 ${
                    p >= (i + 0.5) / rows.length ? "border-brand bg-brand text-white" : "border-ink/15 bg-cream text-ink-soft"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <Icon size={22} strokeWidth={1.9} />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-cream">{i + 1}</span>
                </span>
                <div className="md:mt-4">
                  <h3 className="font-jakarta font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-ink-soft">{s.description}</p>
                </div>
                {/* last pseudo separator padding: nothing */}
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
