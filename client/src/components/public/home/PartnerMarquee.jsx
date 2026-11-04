/*
 * PartnerMarquee — "Dipercaya oleh": satu baris logo mitra berjalan (CSS marquee murni),
 * gambar tampil normal (tanpa grayscale/redup), membesar sedikit saat hover.
 * Data: GET /api/public/partners. Section disembunyikan bila data kosong.
 */
import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { useSiteSettings } from "./HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

// Satu set minimal 12 logo. Kalau mitra sedikit, satu set bisa lebih sempit dari
// kontainer sehingga setelah logo terakhir muncul ruang kosong sebelum logo pertama
// kembali — itulah yang terlihat seperti "berhenti". Dengan diulang, set selalu
// lebih lebar dari layar sehingga logo terus mengalir tanpa jeda.
const MIN_ITEMS_PER_SET = 12;

// Satu baris marquee: satu set konten diduplikasi (x2) agar loop -50% mulus.
// Durasi mengikuti jumlah logo (≈9 detik per logo) supaya kecepatan geser tetap
// sama enaknya meski jumlah logo dalam satu set berubah.
function MarqueeRow({ items }) {
  const logos = items.filter((p) => p.logo);
  if (logos.length === 0) return null;
  const reps = Math.max(1, Math.ceil(MIN_ITEMS_PER_SET / logos.length));
  const set = Array.from({ length: reps }, () => logos).flat();
  const track = [...set, ...set]; // x2 → geser -50% tepat selebar satu set
  const duration = `${set.length * 9}s`;
  return (
    <div className="marquee-mask overflow-hidden">
      <div
        className="flex w-max items-center gap-14 pr-14 animate-marquee"
        style={{ "--marquee-duration": duration }}
      >
        {track.map((p, i) => (
          <img
            key={`${p.id}-${i}`}
            src={img(p.logo)}
            alt={i < set.length ? p.name : ""}
            aria-hidden={i >= set.length}
            title={p.name}
            loading="lazy"
            width={224}
            height={112}
            className="h-24 w-auto max-w-[14rem] object-contain transition duration-300 hover:scale-105"
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

  const name = s?.company_name ?? "Jaya Abadi";

  return (
    <section className="border-y border-ink/8 bg-white py-10">
      <Container>
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-ink-light">
          Dipercaya oleh
        </p>
        {/* Cukup satu baris mitra */}
        <div className="group/marquee" role="region" aria-label={`Mitra dan klien ${name}`}>
          <MarqueeRow items={rows} />
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
