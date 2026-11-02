// QuickChannels — empat kanal kontak utama dengan tautan langsung.
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Container from "../Container.jsx";

export default function QuickChannels({ branch, settings, responseTime = "15 menit" }) {
  const whatsapp = String(branch?.whatsapp || settings?.company_whatsapp || "").replace(/\D/g, "");
  const phone = branch?.phone || settings?.company_phone || "";
  const email = branch?.email || settings?.company_email || "";
  const maps = branch?.latitude != null && branch?.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    : branch?.mapEmbedUrl || "https://www.google.com/maps";
  const channels = [
    { label: "WhatsApp", description: "Konsultasi cepat", value: branch?.whatsapp || settings?.company_whatsapp, href: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Jaya Abadi, saya ingin konsultasi proyek.")}` : "#", icon: MessageCircle, className: "bg-success-soft text-success", response: `Dibalas rata-rata ${responseTime}` },
    { label: "Telepon", description: "Bicara langsung dengan tim", value: phone, href: phone ? `tel:${phone.replace(/\D/g, "")}` : "#", icon: Phone, className: "bg-brand-soft text-brand-dark", response: "Respons langsung" },
    { label: "Email", description: "Kirim detail kebutuhan proyek", value: email, href: email ? `mailto:${email}` : "#", icon: Mail, className: "bg-sky-100 text-sky-700", response: `Dibalas rata-rata ${responseTime}` },
    { label: "Petunjuk Arah", description: branch?.city ? `Menuju kantor ${branch.city}` : "Buka lokasi kantor", value: "Google Maps", href: maps, icon: MapPin, className: "bg-amber-100 text-amber-700", response: "Buka peta" },
  ];

  return (
    <section className="py-10 sm:py-12" aria-labelledby="quick-channels-title">
      <Container>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Pilih cara Anda</p><h2 id="quick-channels-title" className="mt-2 font-jakarta text-2xl font-extrabold text-ink sm:text-3xl">Kanal <span className="text-brand">Cepat</span></h2></div><p className="w-full text-xs font-semibold text-ink-light sm:w-auto sm:text-right">WhatsApp & email: dibalas rata-rata {responseTime}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ label, description, value, href, icon: Icon, className, response }) => <a key={label} href={href} target={label === "WhatsApp" || label === "Petunjuk Arah" ? "_blank" : undefined} rel={label === "WhatsApp" || label === "Petunjuk Arah" ? "noreferrer" : undefined} className="group flex min-h-40 flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}><Icon size={20} /></span><h3 className="mt-4 font-jakarta text-base font-extrabold text-ink group-hover:text-brand">{label}</h3><p className="mt-1 text-xs text-ink-light">{description}</p><p className="mt-auto truncate pt-4 text-sm font-bold text-ink">{value || "Belum tersedia"}</p><p className="mt-1 text-[11px] font-semibold text-brand">{response}</p></a>)}
        </div>
      </Container>
    </section>
  );
}
