/*
 * CoreValues — judul tengah, 5 kartu (ikon bundar, judul, deskripsi);
 * hover: naik + ganti latar oranye lembut; mobile: carousel snap geser.
 * Data: GET /api/public/core-values.
 */
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";

export default function CoreValuesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-core-values"],
    queryFn: async () => (await api.get("/public/core-values")).data.data,
  });
  const items = data ?? [];

  return (
    <section className="bg-cream-deep py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Core Values</p>
          <h2 className="mt-2 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Nilai yang <span className="text-brand">Kami Pegang</span></h2>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/60" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-light">Belum ada nilai perusahaan.</p>
        ) : (
          /* Desktop grid; mobile carousel snap */
          <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5 sm:px-0 lg:pb-0">
            {items.slice(0, 5).map((v, i) => {
              const Icon = SERVICE_ICONS[v.icon] ?? Sparkles;
              return (
                <div
                  key={v.id}
                  className="group w-[80%] shrink-0 snap-center rounded-2xl bg-white p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:bg-brand-soft hover:shadow-soft-lg sm:w-auto sm:snap-align-none"
                  style={{ animation: `fade-in 0.5s ease-out both ${i * 0.08}s` }}
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 font-jakarta font-bold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
