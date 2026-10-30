/*
 * VisionMission — dua kartu tinggi sama: Visi oranye (teks putih, ikon samar),
 * Misi putih (daftar bernomor lingkaran oranye). Animasi masuk bergantian.
 * Section id="visi-misi". Data: settings about_vision & about_mission (per baris).
 */
import { useSiteSettings } from "../home/HeroSection.jsx";
import { Target } from "lucide-react";

export default function VisionMission() {
  const { data: s } = useSiteSettings();
  const misi = (s?.about_mission ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <section id="visi-misi" className="scroll-mt-32 bg-cream py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-2">
        {/* Visi — oranye */}
        <div className="animate-in-left relative flex min-h-[16rem] flex-col overflow-hidden rounded-3xl bg-brand p-8 text-white shadow-soft-lg">
          <Target aria-hidden className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 opacity-20" strokeWidth={1.2} />
          <h2 className="font-jakarta text-xl font-extrabold uppercase tracking-wide">Visi</h2>
          <p className="mt-4 max-w-md flex-1 text-lg font-medium leading-relaxed text-white/95">
            {s?.about_vision ?? "Menjadi kontraktor nasional terdepan yang membangun ruang hidup dan bekerja dengan mutu unggul serta berkelanjutan."}
          </p>
        </div>

        {/* Misi — putih, daftar bernomor */}
        <div className="animate-in-right rounded-3xl bg-white p-8 shadow-soft-lg">
          <h2 className="font-jakarta text-xl font-extrabold uppercase tracking-wide text-ink">Misi</h2>
          <ol className="mt-4 space-y-3.5">
            {(misi.length > 0 ? misi : [
              "Menghadirkan hasil kerja konstruksi yang aman, rapi, dan tepat waktu.",
              "Mengedepankan komunikasi terbuka dan laporan proyek yang transparan.",
              "Mengembangkan kompetensi tim dan mitra lokal secara berkelanjutan.",
              "Menjalankan usaha dengan integritas dan tanggung jawab sosial.",
            ]).map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                <p className="leading-relaxed text-ink-soft">{m}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
