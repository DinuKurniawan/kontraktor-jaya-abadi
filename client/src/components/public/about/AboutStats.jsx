/*
 * AboutStats — latar gelap + pola blueprint tipis, 4 angka besar count-up
 * (Tahun Pengalaman, Proyek Selesai, Klien Puas, Tenaga Ahli) + baris mini
 * dari settings: luas bangunan terbangun, jumlah kota, tepat waktu (%).
 */
import { useEffect, useRef, useState } from "react";
import { Building2, MapPin, Timer } from "lucide-react";
import Container from "../Container.jsx";
import { useSiteSettings } from "../home/HeroSection.jsx";

function CountUp({ target }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const goal = parseInt(String(target), 10) || 0;
    let raf, done = false;
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
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => e.isIntersecting && (start(), io.disconnect()), { threshold: 0.3 }) : null;
    io?.observe(ref.current);
    const fb = setTimeout(start, 2500);
    return () => { clearTimeout(fb); io?.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);
  return <span ref={ref}>{value}</span>;
}

export default function AboutStats() {
  const { data: s } = useSiteSettings();
  const items = [
    [s?.stat_years_experience ?? "20", "Tahun Pengalaman"],
    [s?.stat_completed_projects ?? "200", "Proyek Selesai"],
    [s?.stat_clients ?? "150", "Klien Puas"],
    [s?.stat_experts ?? "80", "Tenaga Ahli"],
  ];
  const mini = [
    [Building2, `${s?.stat_total_area ?? "120"} Ribu m²`, "Luas bangunan terbangun"],
    [MapPin, `${s?.stat_cities ?? "12"} Kota`, "Jangkauan layanan"],
    [Timer, `${s?.stat_ontime_rate ?? "98"}%`, "Proyek tepat waktu"],
  ];

  return (
    <section
      className="bg-ink"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {items.map(([num, label]) => (
            <div key={label} className="flex flex-col items-center gap-2 px-4 text-center">
              <p className="font-jakarta text-4xl font-extrabold text-brand sm:text-5xl">
                <CountUp target={num} />
                {(parseInt(num, 10) || 0) > 10 ? "+" : ""}
              </p>
              <p className="text-sm text-cream/70">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-white/10 pt-6">
          {mini.map(([Icon, v, l]) => (
            <p key={l} className="flex items-center gap-2 text-sm text-cream/70">
              <Icon size={16} className="text-brand" /> <span className="font-jakarta font-bold text-cream">{v}</span> · {l}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
