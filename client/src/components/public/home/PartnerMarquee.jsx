/*
 * PartnerMarquee — "Dipercaya oleh": logo mitra berjalan (CSS marquee murni),
 * grayscale → berwarna saat hover, Pause saat hover, dua baris arah berlawanan di desktop.
 * Data: GET /api/public/partners. Section disembunyikan bila data kosong.
 */
import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { useSiteSettings } from "./HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// Satu baris marquee: konten diduplikasi (x2) agar loop -50% mulus
function MarqueeRow({ items, reverse = false, duration }) {
  const doubled = [...items.filter((p) => p.logo), ...items.filter((p) => p.logo)];
  if (doubled.length === 0) return null;
  return (
    <div className="marquee-mask overflow-hidden">
      <div
        className={`flex w-max items-center gap-12 pr-12 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ "--marquee-duration": duration }}
      >
        {doubled.map((p, i) => (
          <img
            key={`${p.id}-${i}`}
            src={img(p.logo)}
            alt={p.name}
            title={p.name}
            loading="lazy"
            width={140}
            height={56}
            className="h-12 w-auto max-w-[8.75rem] object-contain opacity-70 grayscale transition duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0"
          />
        ))}
      </div>
    </div>
  );
}

export default function PartnerMarquee() {
  const { data } = useQuery({
    queryKey: ["public-partners"],
    queryFn: async () => (await api.get("/public/partners")).data.data,
  });
  const { data: s } = useSiteSettings();
  const rows = data ?? [];
  if (rows.length < 2) return null; // terlalu sedikit untuk marquee

  const half = Math.ceil(rows.length / 2);
  const rowA = rows.slice(0, half);
  const rowB = rows.slice(half);
  const name = s?.company_name ?? "Jaya Abadi";

  return (
    <section className="border-y border-ink/8 bg-white py-10">
      <Container>
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-ink-light">
          Dipercaya oleh
        </p>
        <div className="group/marquee space-y-6" role="region" aria-label={`Mitra dan klien ${name}`}>
          <MarqueeRow items={rowA} duration="32s" />
          {rowB.length > 0 && (
            <div className="hidden sm:block">
              <MarqueeRow items={rowB} reverse duration="38s" />
            </div>
          )}
        </div>
        {/* Aksesibilitas: daftar statis untuk pembaca layar */}
        <ul className="sr-only">
          {rows.map((p) => (
            <li key={p.id}>{p.name}{p.website ? ` — ${p.website}` : ""}</li>
          ))}
        </ul>
        {rows.every((p) => !p.logo) && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-light"><Handshake size={15} /> Logo mitra belum diunggah</p>
        )}
      </Container>
    </section>
  );
}
