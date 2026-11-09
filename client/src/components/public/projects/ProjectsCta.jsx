/*
 * ProjectsCta — CTA penutup halaman proyek dengan foto proyek, overlay gelap,
 * dua jalur kontak, dan tiga jaminan singkat.
 */
import { BadgeCheck, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "../home/HeroSection.jsx";
import Container from "../Container.jsx";
import PillButton from "../PillButton.jsx";
import { imageProps, img } from "../../../lib/image.js";

const FALLBACK_IMAGE = "https://picsum.photos/seed/ja-project-cta/800/360.webp";

const GUARANTEES = [
  [ShieldCheck, "Garansi pekerjaan"],
  [FileText, "RAB transparan"],
  [BadgeCheck, "Progress terpantau"],
];

export default function ProjectsCta({ backgroundImage = "" }) {
  const { data: settings } = useSiteSettings();
  const wa = String(settings?.company_whatsapp || settings?.whatsapp || "6281234567890").replace(/\D/g, "");
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent("Halo Jaya Abadi, saya ingin mendiskusikan proyek serupa.")}`;

  return (
    <section className="relative isolate overflow-hidden bg-ink" aria-labelledby="projects-cta-title">
      <img
        src={img(backgroundImage) || FALLBACK_IMAGE}
        {...imageProps(backgroundImage || FALLBACK_IMAGE, { width: 800, height: 360 })}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/85 to-ink/60" />

      <Container className="relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Siap mulai?</p>
          <h2 id="projects-cta-title" className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Punya proyek serupa? <span className="text-brand">Mari diskusikan</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">
            Ceritakan kebutuhan bangunan, renovasi, interior, atau pengawasan proyek Anda. Tim Jaya Abadi siap membantu dari tahap awal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-jakarta text-sm font-semibold text-white shadow-[0_10px_24px_rgba(242,107,58,0.3)] transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <MessageCircle size={16} /> Konsultasi via WhatsApp
            </a>
            <PillButton
              variant="outline"
              to="/kontak"
              className="!border-white/40 !text-white hover:!border-white hover:!bg-white hover:!text-ink"
            >
              Hubungi Kami
            </PillButton>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-cream/85" aria-label="Jaminan Jaya Abadi">
            {GUARANTEES.map(([Icon, label]) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon size={16} className="text-brand" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
