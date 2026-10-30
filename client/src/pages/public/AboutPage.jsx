// Tentang Kami — hanya merakit section. Section: components/public/about/*
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios.js";
import AboutBanner from "../../components/public/about/AboutBanner.jsx";
import CompanyProfile from "../../components/public/about/CompanyProfile.jsx";
import DirectorMessage from "../../components/public/about/DirectorMessage.jsx";
import VisionMission from "../../components/public/about/VisionMission.jsx";
import CoreValuesSection from "../../components/public/about/CoreValues.jsx";
import ComparisonTable from "../../components/public/about/ComparisonTable.jsx";
import HistoryTimeline from "../../components/public/about/HistoryTimeline.jsx";
import AboutStats from "../../components/public/about/AboutStats.jsx";
import TeamSection from "../../components/public/about/TeamSection.jsx";
import GallerySection from "../../components/public/about/GallerySection.jsx";
import LegalitySection from "../../components/public/about/LegalitySection.jsx";
import AboutCta from "../../components/public/about/AboutCta.jsx";
import PartnerMarquee from "../../components/public/home/PartnerMarquee.jsx";
import Reveal from "../../components/public/Reveal.jsx";
import Seo from "../../components/public/Seo.jsx";
import { useSiteSettings } from "../../components/public/home/HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// JSON-LD Organization dari settings
function useOrgJsonLd() {
  const { data: s } = useSiteSettings();
  if (!s) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.company_name ?? "Jaya Abadi",
    url: import.meta.env.VITE_SITE_URL || "http://localhost:5173",
    logo: s.company_logo ? img(s.company_logo) : undefined,
    telephone: s.phone ?? undefined,
    email: s.email ?? undefined,
    address: s.company_address ? { "@type": "PostalAddress", streetAddress: s.company_address } : undefined,
    sameAs: [s.social_instagram, s.social_linkedin, s.social_facebook].filter(Boolean),
  };
}

// Skeleton generik per section saat data belum tiba — ponytail: satu pola blok
const Skeleton = () => (
  <div className="mx-auto max-w-7xl px-5 py-16" aria-hidden>
    <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-ink/10" />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-ink/10" />)}
    </div>
  </div>
);

export default function AboutPage() {
  const jsonLd = useOrgJsonLd();
  // Sembunyikan Team bila kosong (setelah loading)
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["public-team"],
    queryFn: async () => (await api.get("/public/team")).data.data,
  });

  return (
    <>
      <Seo path="/tentang" title="Tentang Kami"
        description="Profil, visi misi, sejarah, tim, legalitas, dan galeri Jaya Abadi — kontraktor terpercaya sejak 2006."
        jsonLd={jsonLd} />
      <AboutBanner />
      <CompanyProfile />
      <DirectorMessage />
      <VisionMission />
      <Reveal><CoreValuesSection /></Reveal>
      <Reveal><ComparisonTable /></Reveal>
      <HistoryTimeline />
      <Reveal><AboutStats /></Reveal>
      {teamLoading ? <Skeleton /> : (team?.length ?? 0) > 0 && <Reveal><TeamSection /></Reveal>}
      <Reveal><GallerySection /></Reveal>
      <PartnerMarquee />
      <LegalitySection />
      <AboutCta />
    </>
  );
}
