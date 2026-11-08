// Hero beranda — judul besar + kolase 3 foto, slider otomatis 6 detik (jika >1 slide)
// Data: GET /api/public/hero-slides (hanya slide aktif)
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "./Container.jsx";
import PillButton from "./PillButton.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);

const AUTOPLAY_MS = 6000;

// Kolase 3 foto: satu besar kiri + dua menumpuk kanan (rasio beda seperti referensi)
function Collage({ slides }) {
  const [main, ...rest] = slides;
  const small = rest.slice(0, 2);
  return (
    <div className="grid grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
      <div className="col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(28,25,23,0.18)]">
        <img
          key={main.id}
          src={img(main.image)}
          alt={main.title}
          width={1000}
          height={1000}
          fetchPriority="high"
          className="h-full w-full animate-fade-in object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>
      {small.map((s, i) => (
        <div key={s.id} className={`col-span-2 overflow-hidden rounded-2xl shadow-soft-lg ${i === 0 ? "" : "hidden sm:block"}`}>
          <img
            src={img(s.image)}
            alt={s.title}
            width={480}
            height={480}
            loading="lazy"
            className="h-full w-full animate-fade-in object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      ))}
    </div>
  );
}

// Skeleton loading — meniru bentuk hero
function HeroSkeleton() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="h-14 w-4/5 animate-pulse rounded-2xl bg-cream-deep lg:h-16" />
        <div className="h-14 w-3/5 animate-pulse rounded-2xl bg-cream-deep lg:h-16" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-cream-deep" />
        <div className="flex gap-3 pt-2">
          <div className="h-12 w-40 animate-pulse rounded-full bg-cream-deep" />
          <div className="h-12 w-36 animate-pulse rounded-full bg-cream-deep" />
        </div>
      </div>
      <div className="grid grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
        <div className="col-span-3 row-span-2 animate-pulse rounded-2xl bg-cream-deep" />
        <div className="col-span-2 animate-pulse rounded-2xl bg-cream-deep" />
        <div className="col-span-2 animate-pulse rounded-2xl bg-cream-deep" />
      </div>
    </div>
  );
}

// Fallback data kosong — tetap ada CTA
function HeroFallback() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <h1 className="font-jakarta text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
          Membangun Impian <br />
          <span className="text-brand underline decoration-brand/40 decoration-[6px] underline-offset-8">Bersama</span> Anda
        </h1>
        <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
          Jasa konstruksi, renovasi, dan desain untuk rumah & bangunan komersial — rapi, tepat waktu, RAB transparan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PillButton variant="primary" to="/kontak">Konsultasi Gratis</PillButton>
          <PillButton variant="outline" to="/proyek">Lihat Proyek</PillButton>
        </div>
      </div>
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-cream-deep text-ink-light">
        <span className="inline-flex items-center gap-2 text-sm">
          <Camera size={18} /> Hero belum diisi lewat CMS
        </span>
      </div>
    </div>
  );
}

export default function Hero() {
  const { data, isLoading } = useQuery({
    queryKey: ["hero-slides-public"],
    queryFn: async () => (await api.get("/public/hero-slides")).data.data,
  });

  const slides = data ?? [];
  const [index, setIndex] = useState(0);

  // Slider otomatis tiap 6 detik — hanya bila ada >1 slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (isLoading) return <HeroSkeleton />;
  if (slides.length === 0) return <HeroFallback />;

  // Putar urutan agar slide aktif selalu pertama di kolase
  const ordered = slides.map((_, i) => slides[(index + i) % slides.length]);
  const current = ordered[0];

  // Kata terakhir judul diberi aksen oranye + garis bawah (gaya referensi)
  const words = (current.title ?? "").split(" ");
  const last = words.pop();
  const accent = (text) => (
    <span key={text} className="text-brand underline decoration-brand/40 decoration-[6px] underline-offset-8">
      {text}
    </span>
  );

  return (
    <section className="overflow-hidden bg-cream">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        {/* Kiri: teks */}
        <div key={current.id} className="animate-fade-in">
          <h1 className="font-jakarta text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
            {words.join(" ")} {accent(last)}
          </h1>
          {current.subtitle && (
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{current.subtitle}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <PillButton variant="primary" to={current.ctaUrl || "/kontak"}>
              {current.ctaLabel || "Konsultasi Gratis"}
            </PillButton>
            <PillButton variant="outline" to="/proyek">
              Lihat Proyek <ArrowRight size={16} />
            </PillButton>
          </div>
        </div>

        {/* Kanan: kolase 3 foto */}
        <Collage slides={ordered} />

        {/* Indikator titik */}
        {slides.length > 1 && (
          <div className="flex gap-2 lg:col-span-2 lg:justify-center" role="tablist" aria-label="Slide hero">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                onClick={() => setIndex(i)}
                className="flex h-6 w-7 items-center justify-center p-0"
              >
                <span
                  className={`h-2 w-full rounded-full transition-colors ${
                    i === index ? "bg-brand" : "bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
