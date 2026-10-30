/*
 * CompanyProfile — kiri: foto bertumpuk + lencana "{n} Tahun Berpengalaman" +
 * tombol play (Modal video dari setting about_video_url); kanan: label oranye,
 * judul, cerita perusahaan (about_story per paragraf), 4 poin centang,
 * tombol "Hubungi Kami" & "Unduh Company Profile" (bila profile_pdf terisi).
 * Animasi masuk kiri-kanan. Section id="profil" (anchor AboutBanner).
 */
import { useState } from "react";
import { CheckCircle2, Download, Handshake, Play, X } from "lucide-react";
import Container from "../Container.jsx";
import PillButton from "../PillButton.jsx";
import { useSiteSettings } from "../home/HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const CHECKS = ["Tim bersertifikat", "RAB transparan", "Tepat waktu", "Garansi pekerjaan"];

// ID YouTube dari URL apa pun (watch, youtu.be, shorts, embed)
const ytId = (url) => {
  const m = String(url ?? "").match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
};

export default function CompanyProfile() {
  const { data: s } = useSiteSettings();
  const [videoOpen, setVideoOpen] = useState(false);
  const years = Number(s?.stat_years_experience) || 20;
  const paragraphs = (s?.about_story ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const video = s?.about_video_url;

  return (
    <section id="profil" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        {/* Kiri: komposisi foto */}
        <div className="animate-in-left relative mx-auto w-full max-w-md">
          {s?.about_image ? (
            <div className="overflow-hidden rounded-3xl shadow-soft-lg">
              <img src={img(s.about_image)} alt="Profil perusahaan" width={640} height={480} className="aspect-[4/3] w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[4/3] w-full rounded-3xl bg-cream-deep" />
          )}
          {s?.company_logo && (
            <img src={img(s.company_logo)} alt="Logo perusahaan"
              className="absolute -bottom-6 right-0 hidden w-36 rounded-2xl border-4 border-white object-contain p-2 shadow-soft-lg sm:block" />
          )}
          {/* Lencana bundar pengalaman */}
          <div className="absolute -left-4 -top-6 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-brand text-center text-white shadow-soft-lg">
            <span className="font-jakarta text-3xl font-extrabold leading-none">{years}+</span>
            <span className="mt-1 px-3 text-[10px] font-bold uppercase tracking-wide">Tahun Berpengalaman</span>
          </div>
          {/* Tombol play video profil */}
          {video && (
            <button type="button" onClick={() => setVideoOpen(true)}
              aria-label="Putar video profil perusahaan"
              className="absolute bottom-6 left-6 flex items-center gap-2.5 rounded-full bg-white/95 py-2 pl-2 pr-5 shadow-soft-lg backdrop-blur transition hover:scale-105">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"><Play size={16} className="ml-0.5 fill-current" /></span>
              <span className="text-sm font-jakarta font-bold text-ink">Video Profil</span>
            </button>
          )}
        </div>

        {/* Kanan: teks */}
        <div className="animate-in-right">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Profil Perusahaan</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {s?.about_headline ?? "Membangun Kepercayaan Sejak 2006"}
          </h2>
          {(paragraphs.length > 0 ? paragraphs : ["Jaya Abadi adalah perusahaan kontraktor yang berdiri sejak 2006, bergerak di bidang konstruksi bangunan, renovasi, interior, dan pengawasan proyek dengan standar mutu serta ketepatan waktu."]).map((p, i) => (
            <p key={i} className="mt-4 leading-relaxed text-ink-soft">{p}</p>
          ))}

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CheckCircle2 size={17} className="shrink-0 text-brand" /> {c}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PillButton variant="primary" to="/kontak"><Handshake size={15} /> Hubungi Kami</PillButton>
            {s?.profile_pdf && (
              <a href={img(s.profile_pdf)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand">
                <Download size={15} /> Unduh Company Profile
              </a>
            )}
          </div>
        </div>
      </Container>

      {/* Modal video */}
      {videoOpen && (
        <div role="dialog" aria-modal="true" aria-label="Video profil perusahaan"
          onClick={() => setVideoOpen(false)} className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
          onKeyDown={(e) => e.key === "Escape" && setVideoOpen(false)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {ytId(video) ? (
              <iframe src={`https://www.youtube.com/embed/${ytId(video)}?autoplay=1`} title="Video profil perusahaan" allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="aspect-video w-full rounded-2xl shadow-soft-lg" />
            ) : (
              <video src={img(video)} controls autoPlay className="aspect-video w-full rounded-2xl shadow-soft-lg" />
            )}
            <button type="button" onClick={() => setVideoOpen(false)} aria-label="Tutup video"
              className="absolute right-5 top-5 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30"><X size={20} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
