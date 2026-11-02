// ContactCta — banner foto proyek, CTA kontak, dan schema bisnis lokal.
import { Helmet } from "react-helmet-async";
import { MessageCircle, Phone } from "lucide-react";
import Container from "../Container.jsx";

const SITE = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80";
const DAY_NAMES = { Senin: "Monday", Selasa: "Tuesday", Rabu: "Wednesday", Kamis: "Thursday", Jumat: "Friday", Sabtu: "Saturday", Minggu: "Sunday" };
const DEFAULT_AREAS = ["Jakarta", "Bogor", "Depok", "Tangerang", "Bekasi"];

function imageUrl(path) { return path?.startsWith("http") ? path : path ? `${SERVER}${path}` : ""; }

function readAreas(settings, branches) {
  const raw = settings?.service_area ?? settings?.service_areas ?? settings?.area_layanan;
  let configured = [];
  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      configured = Array.isArray(parsed) ? parsed : String(raw).split(",");
    } catch {
      configured = String(raw).split(",");
    }
  }
  const branchCities = (branches ?? []).map((branch) => branch.city).filter(Boolean);
  return [...new Set([...configured, ...branchCities, ...DEFAULT_AREAS].map((area) => String(area).trim()).filter(Boolean))];
}

function openingHours(branch) {
  return (Array.isArray(branch?.openingHours) ? branch.openingHours : [])
    .filter((item) => !item.libur && item.buka && item.tutup && DAY_NAMES[item.hari])
    .map((item) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[item.hari]}`,
      opens: item.buka,
      closes: item.tutup,
    }));
}

export function getContactCtaImage(settings, branch) {
  return imageUrl(settings?.contact_cta_image || settings?.about_image || settings?.hero_image || branch?.photo) || FALLBACK_IMAGE;
}

export function buildContactBusinessJsonLd({ settings, branch, branches = [], image }) {
  const address = branch?.address || settings?.company_address || "";
  const telephone = branch?.phone || settings?.company_phone || "";
  const point = Number.isFinite(Number(branch?.latitude)) && Number.isFinite(Number(branch?.longitude));
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "GeneralContractor"],
    name: settings?.company_name || "Jaya Abadi",
    description: "Kontraktor konstruksi, renovasi, interior, dan pengawasan proyek.",
    url: `${SITE}/kontak`,
    image,
    ...(telephone ? { telephone } : {}),
    ...(settings?.company_email || branch?.email ? { email: branch?.email || settings.company_email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      ...(branch?.city ? { addressLocality: branch.city } : {}),
      addressCountry: "ID",
    },
    ...(openingHours(branch).length ? { openingHoursSpecification: openingHours(branch) } : {}),
    ...(point ? { geo: { "@type": "GeoCoordinates", latitude: Number(branch.latitude), longitude: Number(branch.longitude) } } : {}),
    areaServed: readAreas(settings, branches).map((area) => ({ "@type": "City", name: area })),
  };
}

export default function ContactCta({ settings, branch, branches = [] }) {
  const image = getContactCtaImage(settings, branch);
  const businessJsonLd = buildContactBusinessJsonLd({ settings, branch, branches, image });
  const whatsapp = String(branch?.whatsapp || settings?.company_whatsapp || "").replace(/\D/g, "");
  const phone = branch?.phone || settings?.company_phone || "";
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Jaya Abadi, saya siap memulai proyek dan ingin berkonsultasi.")}` : "#";
  const phoneHref = phone ? `tel:${phone.replace(/\D/g, "")}` : "#";

  return (
    <section className="relative isolate overflow-hidden bg-ink" aria-labelledby="contact-cta-title">
      <Helmet><script type="application/ld+json">{JSON.stringify(businessJsonLd)}</script></Helmet>
      <img src={image} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/55" />
      <Container className="relative py-20 sm:py-24"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Mulai bersama Jaya Abadi</p><h2 id="contact-cta-title" className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-white sm:text-5xl">Siap memulai <span className="text-brand">proyek Anda?</span></h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-base">Ceritakan rencana Anda kepada tim kami. Kami siap membantu menyusun langkah awal, survei lokasi, hingga penawaran yang transparan.</p><div className="mt-8 flex flex-wrap gap-3"><a href={whatsappHref} target={whatsapp ? "_blank" : undefined} rel={whatsapp ? "noopener noreferrer" : undefined} className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-jakarta text-sm font-bold text-white shadow-soft-lg transition ${whatsapp ? "bg-brand hover:bg-brand-dark" : "pointer-events-none bg-white/20"}`}><MessageCircle size={17} /> WhatsApp</a><a href={phoneHref} className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 font-jakarta text-sm font-bold transition ${phone ? "border-white/45 text-white hover:border-white" : "pointer-events-none border-white/15 text-white/40"}`}><Phone size={17} /> Telepon</a></div></div></Container>
    </section>
  );
}
