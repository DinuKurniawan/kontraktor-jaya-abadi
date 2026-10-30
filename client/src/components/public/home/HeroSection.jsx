/*
 * HeroSection — beranda, layout dua kolom:
 * kiri: judul/subjudul slide aktif (rotasi 6s, banyak slide) + badge kepercayaan + CTA + tombol video;
 * kanan: kolase foto rounded bertumpuk + dua kartu kecil melayang (data settings).
 * Latar pola blueprint garis tipis; indikator scroll di bawah.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, FileText, Play, ScrollText, ShieldCheck } from "lucide-react";
import api from "../../../lib/axios.js";
import Modal from "../../ui/Modal.jsx";
import PillButton from "../PillButton.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);

const AUTOPLAY_MS = 6000;

// ID video YouTube dari URL apa pun (watch, youtu.be, shorts, embed)
function youtubeId(url) {
  if (!url) return "";
  const m = String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m?.[1] ?? "";
}

const BADGES = [
  { icon: BadgeCheck, label: "Berizin resmi" },
  { icon: ShieldCheck, label: "Bergaransi" },
  { icon: FileText, label: "Transparan RAB" },
];

// Ambil settings sekali (dipakai kartu melayang & video)
export function useSiteSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await api.get("/public/settings")).data.data,
    staleTime: 600000,
  });
}

// Foto dengan skeleton saat memuat — object-cover, ukuran konsisten
function Photo({ src, alt, className = "", eager = false }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative h-full w-full overflow-hidden bg-cream-deep ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-cream-deep" aria-hidden />}
      {src && (
        <img
          src={src}
          alt={alt}
          width={800}
          height={800}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

export default function HeroSection() {
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-slides-public"],
    queryFn: async () => (await api.get("/public/hero-slides")).data.data,
  });
  const { data: s } = useSiteSettings();
  const [index, setIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => setIndex(0), [slides.length]);
  // Rotasi hanya bila ada >1 slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  const slide = slides.length ? slides[index % slides.length] : null;
  const word = (slide?.title ?? "").split(" ");
  const lastWord = word.pop();
  const years = s?.stat_years_experience;
  const projects = s?.stat_completed_projects;
  const videoId = youtubeId(s?.profile_video);

  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Pola blueprint tipis (garis krem gelap) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(28,25,23,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.045) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          {/* Kolom teks */}
          <div>
            {isLoading ? (
              <div className="space-y-4" aria-hidden>
                <div className="h-14 w-4/5 animate-pulse rounded-2xl bg-cream-deep" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-cream-deep" />
                <div className="h-12 w-40 animate-pulse rounded-full bg-cream-deep" />
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cream">
                  <ScrollText size={13} /> Kontraktor sejak {years ?? "2006"}
                </span>
                <h1 className="mt-5 font-jakarta text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
                  {word.join(" ")}{" "}
                  <span className="text-brand underline decoration-brand/40 decoration-[6px] underline-offset-8">{lastWord}</span>
                </h1>
                {slide?.subtitle && <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{slide.subtitle}</p>}

                {/* Lencana kepercayaan */}
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Jaminan kami">
                  {BADGES.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                      <Icon size={16} className="text-brand" /> {label}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <PillButton variant="primary" to="/kontak">Konsultasi Gratis</PillButton>
                  <PillButton variant="outline" to="/proyek">Lihat Proyek</PillButton>
                  {videoId && (
                    <button
                      type="button"
                      onClick={() => setVideoOpen(true)}
                      className="group inline-flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-sm font-semibold text-ink transition hover:text-brand"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-soft transition group-hover:scale-105">
                        <Play size={16} className="ml-0.5" />
                      </span>
                      Putar profil perusahaan
                    </button>
                  )}
                </div>

                {/* Titik indikator slide */}
                {slides.length > 1 && (
                  <div className="mt-7 flex gap-2" role="tablist" aria-label="Slide hero">
                    {slides.map((sl, i) => (
                      <button
                        key={sl.id}
                        type="button"
                        role="tab"
                        aria-selected={i === index % slides.length}
                        aria-label={`Slide ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === index % slides.length ? "w-7 bg-brand" : "w-2 bg-ink/20 hover:bg-ink/40"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kolom kolase + kartu melayang */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="grid grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
              <div className="col-span-5 row-span-2 overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(28,25,23,0.18)] sm:col-span-4">
                <Photo eager src={img(slide?.image)} alt={slide?.title ?? "Proyek Jaya Abadi"} />
              </div>
              {/* Dua foto kecil bertumpuk di kanan (tablet ke atas) */}
              {slides[1] && (
                <div className="col-span-2 hidden overflow-hidden rounded-2xl shadow-soft-lg sm:col-span-1 sm:block">
                  <Photo src={img(slides[(index + 1) % slides.length]?.image)} alt="Kegiatan proyek" />
                </div>
              )}
              {slides[2] && (
                <div className="col-span-1 hidden overflow-hidden rounded-2xl shadow-soft-lg sm:block">
                  <Photo src={img(slides[(index + 2) % slides.length]?.image)} alt="Detail pengerjaan" />
                </div>
              )}
            </div>

            {/* Kartu kecil melayang — animasi float */}
            {years && (
              <div className="animate-float absolute -left-3 top-8 rounded-2xl bg-white/95 px-4 py-3 shadow-soft-lg backdrop-blur sm:-left-8">
                <p className="font-jakarta text-2xl font-extrabold text-brand">{years}+</p>
                <p className="text-xs font-semibold text-ink-soft">tahun pengalaman</p>
              </div>
            )}
            {projects && (
              <div className="animate-float [animation-delay:1.6s] absolute -bottom-5 right-2 rounded-2xl bg-white/95 px-4 py-3 shadow-soft-lg backdrop-blur sm:-right-4">
                <p className="font-jakarta text-2xl font-extrabold text-ink">{projects}+</p>
                <p className="text-xs font-semibold text-ink-soft">proyek selesai</p>
              </div>
            )}
          </div>
        </div>

        {/* Indikator scroll */}
        <div className="flex justify-center pb-6" aria-hidden>
          <span className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-ink/25 pt-1.5">
            <span className="animate-scroll-dot h-2 w-1 rounded-full bg-brand" />
          </span>
        </div>
      </div>

      {/* Modal video profil */}
      <Modal open={videoOpen} onClose={() => setVideoOpen(false)} title="Profil Perusahaan" size="lg">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Profil perusahaan Jaya Abadi"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full rounded-xl"
          />
        </div>
      </Modal>
    </section>
  );
}
