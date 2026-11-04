/*
 * TeamSection — tab filter divisi, statistik kecil (anggota & divisi),
 * kartu 4:5 (foto object-cover / avatar inisial berwarna), overlay hover
 * ikon sosial, klik kartu → Modal profil (bio + kontak).
 * Data: GET /api/public/team (filter divisi di sisi klien).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Users, X } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import PillButton from "../PillButton.jsx";
import { teamDeptLabel } from "../../../lib/team.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

const AVATAR_COLORS = ["bg-brand-soft text-brand-dark", "bg-ink/10 text-ink", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-800"];

// Brand icons tidak tersedia di lucide-react — SVG inline sederhana
const IgIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);
const InIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.98 3.5A2.5 2.5 0 1 1 2.5 6a2.5 2.5 0 0 1 2.48-2.5zM3 8.5h4V21H3zM9.5 8.5h3.8v1.7h.05c.53-1 1.83-2.06 3.77-2.06 4 0 4.78 2.63 4.78 6.05V21h-4v-5.9c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21h-4z" />
  </svg>
);

export default function TeamSection() {
  const { data } = useQuery({
    queryKey: ["public-team"],
    queryFn: async () => (await api.get("/public/team")).data.data,
  });
  const rows = data ?? [];
  const [divisi, setDivisi] = useState("");
  const [zoom, setZoom] = useState(null);

  // Tab kategori diambil dari divisi yang benar-benar ada di data tim (sumber: admin).
  const divisiSet = Array.from(new Set(rows.map((m) => m.department).filter(Boolean))).sort();
  const DIVISIONS = [["", "Semua"], ...divisiSet.map((v) => [v, teamDeptLabel(v)])];
  const filtered = rows.filter((m) => !divisi || m.department === divisi);
  const nDivisi = divisiSet.length;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Avatar = ({ m, i, big }) =>
    m.photo ? (
      <img src={img(m.photo)} alt={m.name} width={400} height={500} loading="lazy" className="h-full w-full object-cover" />
    ) : (
      <div className={`flex h-full items-center justify-center font-jakarta ${big ? "text-7xl" : "text-5xl"} font-extrabold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
        {(m.name?.[0] ?? "★").toUpperCase()}
      </div>
    );

  return (
    <section id="tim" className="scroll-mt-32 bg-white py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Tim Kami</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Orang-orang di balik <span className="text-brand">setiap proyek</span></h2>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cream-deep px-4 py-1.5 text-sm font-semibold text-ink-soft">
            <Users size={15} className="text-brand" /> {rows.length} anggota · {nDivisi} divisi
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DIVISIONS.map(([v, label]) => (
            <button key={v || "all"} type="button" onClick={() => setDivisi(v)} aria-pressed={divisi === v}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${divisi === v ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((m, i) => (
            <button key={m.id} type="button" onClick={() => setZoom(m)} className="group text-left" aria-label={`Profil ${m.name}`}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-deep">
                <Avatar m={m} i={i} />
                {/* Overlay sosial saat hover */}
                <span className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
                  {m.email && <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition hover:bg-brand hover:text-white"><Mail size={15} /></span>}
                  {m.linkedin && <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition hover:bg-brand hover:text-white"><InIcon /></span>}
                  {m.instagram && <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition hover:bg-brand hover:text-white"><IgIcon /></span>}
                </span>
              </div>
              <p className="mt-3 font-jakarta font-bold text-ink">{m.name}</p>
              <p className="text-sm text-brand">{m.position}</p>
            </button>
          ))}
        </div>
      </Container>

      {/* Modal profil */}
      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={`Profil ${zoom.name}`} onClick={() => setZoom(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-[4/3] w-full overflow-hidden bg-cream-deep">
              <div className="mx-auto h-full w-44"><Avatar m={zoom} i={0} big /></div>
            </div>
            <div className="p-6">
              <h3 className="font-jakarta text-xl font-extrabold text-ink">{zoom.name}</h3>
              <p className="text-sm font-semibold text-brand">{zoom.position}</p>
              {zoom.bio && <p className="mt-3 leading-relaxed text-ink-soft">{zoom.bio}</p>}
              <div className="mt-5">
                <PillButton variant="primary" to="/kontak"><Mail size={15} /> Hubungi {zoom.name?.split(" ")[0] ?? "Kami"}</PillButton>
              </div>
            </div>
            <button type="button" onClick={() => setZoom(null)} aria-label="Tutup"
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-ink shadow-soft transition hover:bg-brand hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
