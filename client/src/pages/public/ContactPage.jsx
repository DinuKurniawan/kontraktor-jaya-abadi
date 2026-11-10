// Kontak — kanal cepat, info cabang, dan konsultasi tiga langkah.
import { useQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import ContactBanner from "../../components/public/contact/ContactBanner.jsx";
import ConsultationForm from "../../components/public/contact/ConsultationForm.jsx";
import ContactFaq from "../../components/public/contact/ContactFaq.jsx";
import ContactCta, { getContactCtaImage } from "../../components/public/contact/ContactCta.jsx";
import OfficeMap from "../../components/public/contact/OfficeMap.jsx";
import QuickChannels from "../../components/public/contact/QuickChannels.jsx";
import WhatNext from "../../components/public/contact/WhatNext.jsx";
import Reveal from "../../components/public/services/Reveal.jsx";
import Seo from "../../components/public/Seo.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { usePublicSettings } from "../../hooks/usePublicData.js";

function ContactSectionSkeleton() {
  return <section className="py-10 sm:py-12" aria-busy="true" aria-label="Memuat kanal kontak"><Container><div className="mb-5"><Skeleton className="h-3 w-28" /><Skeleton className="mt-3 h-8 w-56" /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-40 w-full" rounded="rounded-2xl" />)}</div></Container></section>;
}

function ContactInfoSkeleton() {
  return <div className="space-y-4" role="status" aria-busy="true" aria-label="Memuat informasi kontak">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="rounded-2xl bg-white p-4 shadow-soft"><div className="flex gap-4"><Skeleton className="h-11 w-11 shrink-0" rounded="rounded-xl" /><div className="min-w-0 flex-1"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-4 w-40" /></div></div></div>)}</div>;
}

export default function ContactPage() {
  const { data: s, isLoading: settingsLoading } = usePublicSettings();
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await api.get("/public/branches")).data.data,
  });
  const mainBranch = branches?.find((branch) => branch.isMain) ?? branches?.[0];
  const configuredResponseTime = s?.contact_response_time ?? s?.average_response_time ?? s?.response_time_minutes ?? "15 menit";
  const responseTime = /^\d+$/.test(String(configuredResponseTime)) ? `${configuredResponseTime} menit` : String(configuredResponseTime);

  const SITE = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
  const localBusiness = s ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: s.company_name ?? "Jaya Abadi",
    url: SITE,
    telephone: s.company_phone ?? undefined,
    email: s.company_email ?? undefined,
    address: s.company_address ? { "@type": "PostalAddress", streetAddress: s.company_address } : undefined,
    sameAs: [s.social_instagram, s.social_linkedin, s.social_facebook, s.social_youtube].filter(Boolean),
    openingHoursSpecification: s.company_work_hours ? [{ "@type": "OpeningHoursSpecification", opens: "08:00", closes: "17:00", dayOfWeek: "Monday-Saturday" }] : undefined,
  } : undefined;

  const waNumber = (s?.company_whatsapp ?? "").replace(/\D/g, "");
  const infoItems = [
    [MapPin, "Alamat", s?.company_address, null],
    [Phone, "Telepon", s?.company_phone, s?.company_phone ? `tel:${s.company_phone.replace(/\s/g, "")}` : null],
    [Mail, "Email", s?.company_email, s?.company_email ? `mailto:${s.company_email}` : null],
    [MessageCircle, "WhatsApp", s?.company_whatsapp, waNumber ? `https://wa.me/${waNumber}` : null],
    [Clock, "Jam Kerja", s?.company_work_hours, null],
  ].filter(([, , value]) => value);
  const contactDataLoading = settingsLoading || branchesLoading;

  return (
    <>
      <Seo path="/kontak" title="Kontak Jaya Abadi" description="Hubungi Jaya Abadi untuk konsultasi konstruksi, renovasi, interior, dan pengawasan proyek di Jabodetabek." image={getContactCtaImage(s, mainBranch)} jsonLd={localBusiness} />
      <Reveal><ContactBanner branch={mainBranch} /></Reveal>
      <Reveal delay={60}>{contactDataLoading ? <ContactSectionSkeleton /> : <QuickChannels branch={mainBranch} settings={s} responseTime={responseTime} />}</Reveal>

      <Reveal delay={120}>
        <Container className="grid min-w-0 gap-10 py-14 lg:items-stretch lg:grid-cols-5">
        {/* Info kontak */}
        <aside className="space-y-4 lg:col-span-2 lg:flex lg:h-full lg:flex-col">
          {contactDataLoading ? <ContactInfoSkeleton /> : infoItems.map(([Icon, label, value, href]) => (
            <div key={label} className="flex gap-4 rounded-2xl bg-white p-4 shadow-soft"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><Icon size={19} /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</p>{href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="break-words text-sm font-semibold text-ink transition hover:text-brand">{value}</a> : <p className="break-words text-sm font-semibold text-ink">{value}</p>}</div></div>
          ))}

        </aside>

        {/* Konsultasi tiga langkah */}
        <div className="min-w-0 lg:col-span-3 lg:h-full">
          <ConsultationForm settings={s} branch={mainBranch} />
        </div>
        </Container>
      </Reveal>
      <Reveal delay={180}><OfficeMap branches={branches} /></Reveal>
      <Reveal delay={240}><WhatNext settings={s} /></Reveal>
      <Reveal delay={300}><ContactFaq settings={s} branch={mainBranch} /></Reveal>
      <Reveal delay={360}><ContactCta settings={s} branch={mainBranch} branches={branches} /></Reveal>
    </>
  );
}
