/*
 * CertificateSection — grid 4 kartu sertifikat (gambar, judul, penerbit, tahun),
 * klik → lightbox sederhana (overlay, tutup Esc/klik luar), plus daftar legalitas
 * (NIB, SBU, ISO) dengan ikon centang di sisi kanan. Data: GET /api/public/certificates.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, X } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import SectionHeading from "../SectionHeading.jsx";
import { useSiteSettings } from "./HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const LEGALITY = ["NIB (Nomor Induk Berusaha)", "SBU Konstruksi", "ISO 9001:2015"];

export default function CertificateSection() {
  const { data } = useQuery({
    queryKey: ["public-certificates"],
    queryFn: async () => (await api.get("/public/certificates")).data.data,
  });
  const { data: s } = useSiteSettings();
  const rows = (data ?? []).slice(0, 4);
  const [zoom, setZoom] = useState(null);

  // Tutup lightbox dengan Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading title={<>Sertifikat &amp; <span className="text-brand">Legalitas</span></>} />
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((c) => (
              <button key={c.id} type="button" onClick={() => c.image && setZoom(c)}
                className={`group rounded-2xl bg-white p-3 text-left shadow-soft transition hover:shadow-soft-lg ${c.image ? "cursor-zoom-in" : "cursor-default"}`}>
                {c.image ? (
                  <img src={img(c.image)} alt={c.title} width={400} height={280} loading="lazy"
                    className="aspect-[10/7] w-full rounded-xl object-cover transition duration-500 group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex aspect-[10/7] items-center justify-center rounded-xl bg-cream-deep text-xs text-ink-light">Sertifikat belum diunggah</div>
                )}
                <h3 className="mt-3 line-clamp-1 font-jakarta font-bold text-ink">{c.title}</h3>
                <p className="mt-0.5 text-xs text-ink-light">{[c.issuer, c.year].filter(Boolean).join(" · ")}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Legalitas singkat */}
        <div className="self-start rounded-3xl bg-ink p-7 text-cream sm:p-8">
          <h3 className="font-jakarta text-xl font-extrabold">Perusahaan resmi &amp; terstandar</h3>
          <p className="mt-2 text-sm text-cream/70">{s?.company_name ?? "Jaya Abadi"} beroperasi penuh dengan legalitas lengkap.</p>
          <ul className="mt-5 space-y-3">
            {LEGALITY.map((l) => (
              <li key={l} className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 size={17} className="shrink-0 text-brand" /> {l}
              </li>
            ))}
          </ul>
          {s?.stat_years_experience && (
            <p className="mt-6 border-t border-white/10 pt-4 text-sm text-cream/70">
              Melayani sejak {new Date().getFullYear() - Number(s.stat_years_experience)}.
            </p>
          )}
        </div>
      </Container>

      {/* Lightbox */}
      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={zoom.title}
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
          <img src={img(zoom.image)} alt={zoom.title} onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl shadow-soft-lg" />
          <button type="button" onClick={() => setZoom(null)} aria-label="Tutup"
            className="absolute right-5 top-5 rounded-full bg-white/15 p-2.5 text-white transition hover:bg-white/30">
            <X size={20} />
          </button>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-jakarta font-bold text-white">{zoom.title}</p>
        </div>
      )}
    </section>
  );
}
