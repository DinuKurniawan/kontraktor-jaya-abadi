// WhatNext — timeline empat langkah setelah pengunjung menghubungi Jaya Abadi.
import { FileText, Inbox, MapPinned, MessageCircle } from "lucide-react";
import Container from "../Container.jsx";

const STATIC_STEPS = [
  { title: "Pesan diterima", description: "Permintaan Anda masuk ke tim kami dan mendapatkan nomor tiket.", time: "Dalam beberapa menit", icon: Inbox },
  { title: "Konsultasi awal via telepon/WhatsApp", description: "Kami menghubungi Anda untuk memahami kebutuhan dan rencana proyek.", time: "15–30 menit", icon: MessageCircle },
  { title: "Survei lokasi", description: "Tim kami menjadwalkan kunjungan untuk melihat kondisi lokasi secara langsung.", time: "1–3 hari kerja", icon: MapPinned },
  { title: "Penawaran dan RAB", description: "Anda menerima penawaran transparan dan RAB sesuai hasil konsultasi serta survei.", time: "2–5 hari kerja", icon: FileText },
];

function settingSteps(settings) {
  const raw = settings?.contact_next_steps ?? settings?.what_next_steps;
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed) || parsed.length !== 4) return null;
    return parsed.map((step, index) => ({ ...STATIC_STEPS[index], ...step, icon: STATIC_STEPS[index].icon }));
  } catch {
    return null;
  }
}

export default function WhatNext({ settings }) {
  const steps = settingSteps(settings) ?? STATIC_STEPS;

  return (
    <section className="bg-white py-14 sm:py-16" aria-labelledby="what-next-title">
      <Container>
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Proses yang jelas</p><h2 id="what-next-title" className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Apa yang terjadi setelah <span className="text-brand">Anda menghubungi kami?</span></h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">Kami menjaga setiap langkah tetap transparan, terarah, dan mudah diikuti.</p></div>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-5" aria-label="Tahapan setelah menghubungi Jaya Abadi">
          <div aria-hidden className="absolute left-6 top-7 h-[calc(100%-3.5rem)] border-l-2 border-dashed border-brand/25 md:left-[12.5%] md:right-[12.5%] md:top-7 md:h-0 md:border-l-0 md:border-t-2" />
          {steps.map(({ title, description, time, icon: Icon }, index) => (
            <li key={`${title}-${index}`} className="relative flex gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_20px_rgba(242,107,58,0.22)] md:h-16 md:w-16 md:rounded-full"><Icon size={23} strokeWidth={1.9} /><span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-cream">{index + 1}</span></span>
              <div className="pt-1 md:pt-5"><p className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark">{time}</p><h3 className="mt-2 font-jakarta text-base font-extrabold text-ink">{title}</h3><p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p></div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
