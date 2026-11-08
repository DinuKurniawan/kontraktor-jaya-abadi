/*
 * WhyUsSection — layout bento: kartu besar bergambar (kiri) berisi pernyataan
 * nilai utama + tombol, dan grid 2x3 enam kartu keunggulan (kanan).
 * Kartu bergantian krem (bg-white) dan oranye lembut (bg-brand-soft).
 * Data: GET /api/public/features.
 */
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wrench } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import PillButton from "../PillButton.jsx";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";
import { useSiteSettings } from "./HeroSection.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);

export default function WhyUsSection() {
  const { data } = useQuery({
    queryKey: ["public-features"],
    queryFn: async () => (await api.get("/public/features")).data.data,
  });
  const { data: s } = useSiteSettings();
  const rows = (data ?? []).slice(0, 6);

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container className="grid gap-6 lg:grid-cols-2">
        {/* Kartu besar: pernyataan nilai utama */}
        <div className="relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-3xl p-7 sm:p-9">
          {s?.about_image && (
            <img src={img(s.about_image)} alt="" width={900} height={700} loading="lazy"
              className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-light">Kenapa Kami</p>
            <h2 className="mt-2 max-w-md font-jakarta text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Kualitas yang bisa diandalkan, dari fondasi hingga serah terima
            </h2>
            <PillButton variant="primary" to="/proyek" className="mt-5">
              Lihat Hasil Kerja Kami <ArrowRight size={15} />
            </PillButton>
          </div>
        </div>

        {/* Grid 2x3 keunggulan */}
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((f, i) => {
            const Icon = SERVICE_ICONS[f.icon] ?? Wrench;
            return (
              <div
                key={f.id}
                className={`animate-fade-in rounded-2xl p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg ${i % 2 === 0 ? "bg-white" : "bg-brand-soft"}`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${i % 2 === 0 ? "bg-brand-soft text-brand-dark" : "bg-white text-brand"}`}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <h3 className="mt-3 font-jakarta font-bold text-ink">{f.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-soft">{f.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
