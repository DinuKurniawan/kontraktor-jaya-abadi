/*
 * LegalitySection — kiri: kartu legalitas (NIB/SBU/NPWP/alamat) + tombol salin,
 * lencana "Terverifikasi"; kanan: grid sertifikat (judul, penerbit, tahun)
 * dengan lightbox. Data: settings legal_* + GET /api/public/certificates.
 * id="legalitas" (anchor AboutBanner).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Copy, Check, X } from "lucide-react";
import api from "../../../lib/axios.js";
import { useSiteSettings } from "../home/HeroSection.jsx";
import Container from "../Container.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

export default function LegalitySection() {
  const { data: s } = useSiteSettings();
  const { data: certs } = useQuery({
    queryKey: ["public-certificates"],
    queryFn: async () => (await api.get("/public/certificates")).data.data,
  });
  const [copied, setCopied] = useState("");
  const [zoom, setZoom] = useState(null);

  const items = [
    ["NIB", s?.legal_nib],
    ["SBU", s?.legal_sbu],
    ["NPWP", s?.legal_npwp],
    ["Alamat Legal", s?.legal_address],
  ].filter(([, v]) => v);
  const rows = certs ?? [];

  const copy = (label, v) => {
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? "" : c)), 1500);
    });
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (items.length === 0 && rows.length === 0) return null;

  return (
    <section id="legalitas" className="scroll-mt-32 bg-ink py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-light">Legalitas</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-cream">Resmi, berizin, <span className="text-brand">terdaftar</span></h2>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-5">
          {/* Kiri: kartu legalitas */}
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand-light">
              <BadgeCheck size={14} /> Terverifikasi
            </span>
            <div className="mt-4 space-y-3">
              {items.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-cream/50">{label}</p>
                    <p className="mt-1 break-words font-jakarta font-bold text-cream">{value}</p>
                  </div>
                  <button type="button" onClick={() => copy(label, value)} aria-label={`Salin ${label}`}
                    className="shrink-0 rounded-lg p-2 text-cream/60 transition hover:bg-white/10 hover:text-brand">
                    {copied === label ? <Check size={15} className="text-brand" /> : <Copy size={15} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: grid sertifikat */}
          {rows.length > 0 && (
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {rows.map((c) => (
                  <button key={c.id} type="button" onClick={() => setZoom(c)} aria-label={`Perbesar ${c.title}`}
                    className="group text-left">
                    <div className="overflow-hidden rounded-xl bg-white/10">
                      {c.image && <img src={img(c.image)} alt={c.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />}
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-jakarta font-bold text-cream">{c.title}</p>
                    <p className="text-xs text-cream/50">{[c.issuer, c.year].filter(Boolean).join(" · ")}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>

      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={zoom.title} onClick={() => setZoom(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
          <img src={img(zoom.image)} alt={zoom.title} className="max-h-[80vh] max-w-full rounded-2xl shadow-soft-lg" />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center font-jakarta font-bold text-white">
            {zoom.title}{zoom.issuer ? ` — ${zoom.issuer}` : ""}{zoom.year ? ` (${zoom.year})` : ""}
          </p>
          <button type="button" onClick={() => setZoom(null)} aria-label="Tutup"
            className="absolute right-5 top-5 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30"><X size={20} /></button>
        </div>
      )}
    </section>
  );
}
