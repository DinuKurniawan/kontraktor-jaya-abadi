// OfficeMap — tab cabang, peta, detail kantor, jam operasional, dan aksi alamat.
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock3, Copy, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import OfficeMapClient from "./OfficeMapClient.jsx";
const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const DAY_NAMES = { Sunday: "Minggu", Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu" };
const FALLBACK_HOURS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((hari) => ({ hari, buka: "", tutup: "", libur: true }));

function imageUrl(path) { return path?.startsWith("http") ? path : path ? `${SERVER}${path}` : ""; }

function todayName() {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "long" }).format(new Date());
  return DAY_NAMES[weekday];
}

function hoursFor(branch) {
  return Array.isArray(branch?.openingHours) && branch.openingHours.length ? branch.openingHours : FALLBACK_HOURS;
}

function formatHours(item) {
  if (!item || item.libur || !item.buka || !item.tutup) return "Tutup";
  return `${String(item.buka).replace(":", ".")}–${String(item.tutup).replace(":", ".")} WIB`;
}

function ContactLine({ icon: Icon, label, value, href }) {
  const content = <><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark"><Icon size={16} /></span><span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide text-ink-light">{label}</span><span className="mt-0.5 block break-words text-sm font-semibold text-ink">{value || "Belum tersedia"}</span></span></>;
  return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="flex items-start gap-3 rounded-xl p-2 -m-2 transition hover:bg-cream-deep">{content}</a> : <div className="flex items-start gap-3">{content}</div>;
}

export default function OfficeMap({ branches: suppliedBranches }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { data: queriedBranches, isLoading } = useQuery({
    queryKey: ["public-branches"],
    queryFn: async () => (await api.get("/public/branches")).data.data,
    enabled: !suppliedBranches,
  });
  const branches = suppliedBranches ?? queriedBranches ?? [];
  const selected = branches[selectedIndex] ?? branches[0];
  const hours = useMemo(() => hoursFor(selected), [selected]);
  const today = todayName();

  useEffect(() => {
    if (selectedIndex >= branches.length && branches.length) setSelectedIndex(0);
  }, [branches.length, selectedIndex]);

  const copyAddress = async () => {
    if (!selected?.address) return;
    try {
      await navigator.clipboard.writeText(`${selected.address}, ${selected.city}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (isLoading && !branches.length) return <section className="py-14"><Container><div className="h-[28rem] animate-pulse rounded-3xl bg-cream-deep" /></Container></section>;
  if (!branches.length) return null;

  const phoneHref = selected.phone ? `tel:${selected.phone.replace(/\D/g, "")}` : undefined;
  const whatsapp = String(selected.whatsapp || "").replace(/\D/g, "");
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Halo Jaya Abadi, saya ingin menghubungi ${selected.name}.`)}` : undefined;
  const directionsHref = Number.isFinite(Number(selected.latitude)) && Number.isFinite(Number(selected.longitude))
    ? `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`
    : selected.mapEmbedUrl;

  return (
    <section className="bg-cream-deep py-14 sm:py-16" aria-labelledby="office-map-title">
      <Container>
        <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Kantor Jaya Abadi</p><h2 id="office-map-title" className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Temui kami <span className="text-brand">di lokasi</span></h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">Pilih kantor terdekat untuk melihat detail alamat, jam operasional, dan petunjuk arah.</p></div>
        {branches.length > 1 && <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih cabang kantor">{branches.map((branch, index) => <button key={branch.id} type="button" role="tab" aria-selected={index === selectedIndex} onClick={() => { setSelectedIndex(index); setCopied(false); }} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${index === selectedIndex ? "bg-brand text-white shadow-soft" : "bg-white text-ink-soft hover:text-brand"}`}>{branch.name}{branch.isMain && <span className="ml-1.5 text-[10px] opacity-75">(Pusat)</span>}</button>)}</div>}
        <div className="grid overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft-lg lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-h-[22rem] bg-cream-deep lg:min-h-[36rem]">
            <OfficeMapClient branch={selected} />
          </div>
          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex items-start gap-4">{selected.photo ? <img src={imageUrl(selected.photo)} alt={`Foto ${selected.name}`} className="h-20 w-24 rounded-xl object-cover" /> : <div className="flex h-20 w-24 items-center justify-center rounded-xl bg-brand-soft text-brand"><MapPin size={28} /></div>}<div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-brand">{selected.isMain ? "Kantor pusat" : "Kantor cabang"}</p><h3 className="mt-1 font-jakarta text-xl font-extrabold text-ink">{selected.name}</h3></div></div>
            <div className="mt-6 space-y-4"><ContactLine icon={MapPin} label="Alamat" value={`${selected.address}, ${selected.city}`} /><ContactLine icon={Phone} label="Telepon" value={selected.phone} href={phoneHref} /><ContactLine icon={MessageCircle} label="WhatsApp" value={selected.whatsapp} href={whatsappHref} /><ContactLine icon={Mail} label="Email" value={selected.email} href={selected.email ? `mailto:${selected.email}` : undefined} /></div>
            <div className="mt-7"><div className="mb-2 flex items-center gap-2"><Clock3 size={16} className="text-brand" /><h4 className="text-sm font-extrabold text-ink">Jam operasional</h4><span className="text-xs text-ink-light">WIB</span></div><div className="overflow-hidden rounded-xl border border-ink/10"><table className="w-full text-sm"><tbody>{hours.map((item) => { const isToday = item.hari === today; return <tr key={item.hari} aria-current={isToday ? "date" : undefined} className={isToday ? "bg-brand-soft/60 font-bold text-brand-dark" : "text-ink-soft"}><td className="px-3 py-2">{item.hari}{isToday && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">Hari ini</span>}</td><td className="px-3 py-2 text-right">{formatHours(item)}</td></tr>; })}</tbody></table></div></div>
            <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row"><a href={directionsHref || "#"} target={directionsHref ? "_blank" : undefined} rel={directionsHref ? "noreferrer" : undefined} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${directionsHref ? "bg-brand hover:bg-brand-dark" : "pointer-events-none bg-ink/20"}`}><Navigation size={16} /> Petunjuk Arah</a><button type="button" onClick={copyAddress} disabled={!selected.address} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Tersalin" : "Salin Alamat"}</button></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
