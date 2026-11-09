/*
 * AboutCta — banner foto proyek + overlay gelap, judul, dua tombol
 * (WhatsApp / Lihat Proyek), baris kontak cepat (telepon & email) dari settings.
 */
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useSiteSettings } from "../home/HeroSection.jsx";
import Container from "../Container.jsx";
import { imageProps, img } from "../../../lib/image.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

export default function AboutCta() {
  const { data: s } = useSiteSettings();
  const wa = (s?.whatsapp ?? "6281234567890").replace(/\D/g, "");
  const phone = s?.phone ?? "(021) 555-2006";
  const email = s?.email ?? "info@jayaabadi.co.id";
  // Foto banner: about_image, fallback picsum agar section tak pernah polos
  const bg = s?.about_image ? img(s.about_image) : "https://picsum.photos/seed/ja-cta/800/350.webp";
  const { src, srcSet, width, height, sizes, loading, fetchPriority, decoding } = imageProps(bg, { width: 800, height: 350 });

  return (
    <section className="relative overflow-hidden">
      <img src={src} srcSet={srcSet} sizes={sizes} width={width} height={height} loading={loading} fetchPriority={fetchPriority} decoding={decoding} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/75 to-ink/50" />
      <Container className="relative py-20 text-center sm:py-24">
        <h2 className="mx-auto max-w-2xl font-jakarta text-3xl font-extrabold text-white sm:text-4xl">
          Mari Wujudkan <span className="text-brand">Proyek Anda</span> Bersama Kami
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-cream/80">
          Konsultasi gratis — ceritakan kebutuhan pembangunan atau renovasi Anda hari ini.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft-lg transition hover:bg-brand-dark">
            <MessageCircle size={16} /> Konsultasi via WhatsApp
          </a>
          <a href="/proyek"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:border-brand hover:text-brand">
            Lihat Proyek
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-cream/80">
          <a href={`tel:${String(phone).replace(/\D/g, "")}`} className="flex items-center gap-2 transition hover:text-brand">
            <Phone size={15} /> {phone}
          </a>
          <a href={`mailto:${email}`} className="flex items-center gap-2 transition hover:text-brand">
            <Mail size={15} /> {email}
          </a>
        </div>
      </Container>
    </section>
  );
}
