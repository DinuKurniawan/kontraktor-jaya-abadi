/*
 * ServicesBanner — latar krem gelap + pola blueprint tipis, breadcrumb,
 * judul beraksen oranye, subjudul, tombol (Konsultasi Gratis + Unduh Brosur
 * bila ada), 3 angka ringkas di kanan (layanan, proyek selesai, tahun pengalaman),
 * sub-navigasi anchor sticky dengan scroll-spy (section yang belum ada dilewati).
 */
import { useEffect, useState } from "react";
import { ChevronRight, ChevronRight as Crumb, Download, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { useSiteSettings } from "../home/HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const anchorImg = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const SECTIONS = [
  ["layanan", "Layanan"],
  ["alur", "Alur"],
  ["proyek", "Proyek"],
  ["testimoni", "Testimoni"],
  ["faq", "FAQ"],
];

export default function ServicesBanner() {
  const { data: s } = useSiteSettings();
  const { data: services } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => (await api.get("/public/services")).data.data,
  });
  const [active, setActive] = useState("layanan");

  // Scroll-spy: hanya section yang benar-benar ada di halaman
  useEffect(() => {
    let io = null;
    const iv = setInterval(() => {
      if (document.getElementById("layanan")) {
        clearInterval(iv);
        const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean);
        if (els.length === 0) return;
        io = new IntersectionObserver(
          (entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); },
          { rootMargin: "-30% 0px -60% 0px" },
        );
        els.forEach((el) => io.observe(el));
      }
    }, 300);
    return () => { clearInterval(iv); io?.disconnect(); };
  }, []);

  const jump = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  };

  const stats = [
    [services?.length ?? 4, "Layanan"],
    [s?.stat_completed_projects ?? "200", "Proyek Selesai"],
    [s?.stat_years_experience ?? "20", "Tahun Pengalaman"],
  ];
  const brochure = s?.services_brochure_url;

  return (
    <header className="relative">
      <div className="bg-cream-deep" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }}>
        <Container className="grid items-center gap-10 pb-14 pt-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-ink-light">
              <a href="/" className="transition hover:text-brand">Home</a>
              <Crumb size={12} />
              <span className="text-ink">Layanan</span>
            </nav>
            <h1 className="mt-3 font-jakarta text-4xl font-extrabold text-ink sm:text-5xl">
              Layanan <span className="text-brand">Kami</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
              Solusi konstruksi lengkap — dari desain hingga serah terima kunci, semua dalam satu tim yang bertanggung jawab.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a href="/kontak" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft-lg transition hover:bg-brand-dark">
                <MessageCircle size={16} /> Konsultasi Gratis
              </a>
              {brochure ? (
                <a href={anchorImg(brochure)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-white/70 px-6 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">
                  <Download size={16} /> Unduh Brosur
                </a>
              ) : null}
            </div>
          </div>

          {/* Angka ringkas */}
          <div className="grid grid-cols-3 gap-3 lg:justify-self-end">
            {stats.map(([num, label]) => (
              <div key={label} className="rounded-2xl bg-white/80 px-4 py-5 text-center shadow-soft backdrop-blur">
                <p className="font-jakarta text-2xl font-extrabold text-brand sm:text-3xl">{num}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-light">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Sub-navigasi anchor sticky */}
      <nav aria-label="Bagian halaman layanan" className="sticky top-[4.25rem] z-30 border-b border-ink/8 bg-white/95 shadow-soft backdrop-blur">
        <Container className="flex gap-1 overflow-x-auto py-2 sm:gap-6">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={jump(id)}
              aria-current={active === id ? "true" : undefined}
              className={`shrink-0 border-b-2 px-1 py-2 text-sm font-semibold transition ${
                active === id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
              }`}>
              {label}
            </a>
          ))}
        </Container>
      </nav>
    </header>
  );
}
