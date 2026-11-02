/*
 * ProjectsBanner — latar krem gelap + pola blueprint tipis, breadcrumb,
 * judul beraksen oranye, subjudul, dan baris 4 statistik dari
 * GET /api/public/projects/stats (Total Proyek, Selesai, Sedang Berjalan,
 * Kota Terjangkau). Angka berhitung naik saat blok statistik terlihat.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, Clock3, MapPin } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import Breadcrumb from "../Breadcrumb.jsx";

const STATS = [
  ["total", "Total Proyek", Building2],
  ["completed", "Selesai", CheckCircle2],
  ["ongoing", "Sedang Berjalan", Clock3],
  ["cities", "Kota Terjangkau", MapPin],
];

// Angka berhitung naik saat elemen masuk viewport (sekali saja)
function CountUp({ target }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const goal = Number(target) || 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setValue(goal); return; }

    let raf;
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1300);
        setValue(Math.round(goal * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(([e]) => e.isIntersecting && (start(), io.disconnect()), { threshold: 0.4 })
      : null;
    io?.observe(ref.current);
    // Jaring pengaman: tetap tampil walau observer tidak pernah terpicu
    const fallback = setTimeout(start, 2500);

    return () => {
      clearTimeout(fallback);
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return <span ref={ref}>{value.toLocaleString("id-ID")}</span>;
}

export default function ProjectsBanner() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["public-project-stats"],
    queryFn: async () => (await api.get("/public/projects/stats")).data.data,
  });

  return (
    <header
      className="relative overflow-hidden border-b border-ink/10 bg-cream-deep"
      style={{
        backgroundImage:
          "linear-gradient(rgba(17,17,17,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.045) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    >
      {/* Aksen hangat tipis agar bidang blueprint tidak terasa datar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 82% 8%, rgba(242,107,58,0.12), transparent 42%)" }}
      />

      <Container className="relative py-12 sm:py-16">
        <Breadcrumb items={[{ label: "Proyek" }]} />

        <h1 className="mt-3 font-jakarta text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Proyek <span className="text-brand">Kami</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Portofolio bangunan yang kami selesaikan dan yang sedang berjalan — dari rumah tinggal hingga infrastruktur publik.
        </p>

        {/* Baris statistik */}
        <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map(([key, label, Icon]) => (
            <div
              key={key}
              className="relative rounded-2xl border border-ink/10 bg-white/75 px-5 py-5 shadow-soft backdrop-blur"
            >
              <Icon size={16} className="absolute right-4 top-4 text-brand/70" aria-hidden />
              {isLoading ? (
                <>
                  <div className="h-8 w-16 animate-pulse rounded-md bg-cream-deep" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-cream-deep" />
                </>
              ) : (
                <div className="flex flex-col-reverse">
                  <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-light">{label}</dt>
                  <dd className="font-jakarta text-3xl font-extrabold leading-none text-brand sm:text-4xl">
                    {isError ? "—" : <CountUp target={stats?.[key] ?? 0} />}
                  </dd>
                </div>
              )}
            </div>
          ))}
        </dl>
      </Container>
    </header>
  );
}
