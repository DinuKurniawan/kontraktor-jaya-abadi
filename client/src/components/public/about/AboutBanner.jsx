/*
 * AboutBanner — banner foto (setting about_image) + overlay gradasi gelap,
 * breadcrumb, judul dengan aksen oranye, subjudul dari about_headline,
 * dan baris anchor sticky yang menandai section aktif saat scroll (smooth scroll).
 */
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useSiteSettings } from "../home/HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// ponytail: HistoryTimeline.jsx sudah ada — anchor "Sejarah" aktif kembali
const SECTIONS = [
  ["profil", "Profil"],
  ["visi-misi", "Visi Misi"],
  ["sejarah", "Sejarah"],
  ["tim", "Tim"],
  ["legalitas", "Legalitas"],
  ["galeri", "Galeri"],
];

export default function AboutBanner() {
  const { data: s } = useSiteSettings();
  const [active, setActive] = useState("profil");

  // Scroll-spy: section teratas yang terlihat jadi anchor aktif
  useEffect(() => {
    const observe = () => {
      const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean);
      if (els.length === 0) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
        },
        // Anchor aktif = section lewat ~1/3 atas layar
        { rootMargin: "-30% 0px -60% 0px" },
      );
      els.forEach((el) => io.observe(el));
      return io;
    };
    let io = null;
    const iv = setInterval(() => {
      if (document.getElementById("profil")) {
        clearInterval(iv);
        io = observe();
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
    // Kompensasi tinggi navbar + bar anchor sticky
    return false;
  };

  return (
    <header className="relative">
      <div className="relative min-h-[19rem]">
        {s?.about_image && (
          <img src={img(s.about_image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/60 to-ink/85" />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-5 pb-16 pt-28 sm:pb-24">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-cream/70">
            <a href="/" className="transition hover:text-brand">Home</a>
            <ChevronRight size={12} />
            <span className="text-cream">Tentang Kami</span>
          </nav>
          <h1 className="mt-3 font-jakarta text-4xl font-extrabold text-white sm:text-5xl">
            Tentang <span className="text-brand">Kami</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-cream/80 sm:text-base">
            {s?.about_headline ?? "Membangun Kepercayaan Sejak 2006"}
          </p>
        </div>
      </div>

      {/* Sub-navigasi anchor — sticky di bawah navbar */}
      <nav aria-label="Bagian halaman tentang" className="sticky top-[4.25rem] z-30 border-b border-ink/8 bg-white/95 shadow-soft backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2 sm:gap-6">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={jump(id)}
              aria-current={active === id ? "true" : undefined}
              className={`shrink-0 border-b-2 px-1 py-2 text-sm font-semibold transition ${
                active === id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
              }`}>
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
