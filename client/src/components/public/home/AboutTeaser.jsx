/*
 * AboutTeaser — dua foto bertumpuk + lencana "{n} Tahun Pengalaman" (kiri),
 * label, judul, paragraf (settings about_text), 4 ceklis, CTA /tentang,
 * dan tanda tangan direktur (kanan). Animasi masuk kiri/kanan.
 */
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Feather } from "lucide-react";
import Container from "../Container.jsx";
import PillButton from "../PillButton.jsx";
import { useSiteSettings } from "./HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const CHECKS = ["Tim bersertifikat", "RAB transparan", "Tepat waktu", "Garansi pekerjaan"];

export default function AboutTeaser() {
  const { data: s } = useSiteSettings();
  const years = Number(s?.stat_years_experience) || 20;
  const about = s?.about_text ?? s?.about_description;

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        {/* Kiri: komposisi foto bertumpuk + lencana bundar */}
        <div className="animate-in-left relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl shadow-soft-lg">
            {s?.about_image ? (
              <img src={img(s.about_image)} alt="Tim Jaya Abadi" width={640} height={480} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-cream text-sm text-ink-light">Foto tentang kami belum diisi</div>
            )}
          </div>
          {s?.company_logo && (
            <div className="absolute -bottom-6 right-0 hidden w-40 overflow-hidden rounded-2xl border-4 border-cream-deep shadow-soft-lg sm:block">
              <img src={img(s.company_logo)} alt="Logo perusahaan" width={160} height={120} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          )}
          {/* Lencana bundar pengalaman */}
          <div className="absolute -left-4 -top-6 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-brand text-center text-white shadow-soft-lg">
            <span className="font-jakarta text-3xl font-extrabold leading-none">{years}+</span>
            <span className="mt-1 px-3 text-[10px] font-bold uppercase tracking-wide">Tahun Pengalaman</span>
          </div>
        </div>

        {/* Kanan: teks */}
        <div className="animate-in-right">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Tentang Kami</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Bangunan berkualitas dari tim <span className="text-brand">yang tepat</span>
          </h2>
          {about && <p className="mt-4 leading-relaxed text-ink-soft line-clamp-6">{about}</p>}

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CheckCircle2 size={17} className="shrink-0 text-brand" /> {c}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-6">
            <PillButton variant="primary" to="/tentang">Selengkapnya</PillButton>
            {/* Tanda tangan / nama direktur — fallback nama seed */}
            <div>
              <p className="flex items-center gap-1.5 font-jakarta text-xl italic text-ink/80" style={{ fontFamily: "'Segoe Script', cursive" }}>
                <Feather size={14} className="text-brand" /> {s?.director_name ?? "Agus Hartanto"}
              </p>
              <p className="text-xs text-ink-light">{s?.director_title ?? "Direktur Utama"}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
