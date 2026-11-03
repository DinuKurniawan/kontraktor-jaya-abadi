/*
 * ServiceGrid — kartu layanan bergambar (4:3) + ikon bundar menimpa gambar,
 * 3 poin ruang lingkup teratas, label "Mulai dari", tautan "Lihat detail".
 * Featured → span 2 kolom + lencana "Paling Dicari". Kolom: 1 mobile / 2 tablet
 * & md / 4 desktop lebar; jumlah ganjil → kartu terakhir melebar penuh.
 * Pencarian + filter kategori dari API tanpa reload.
 * Seluruh kartu = satu tautan; tinggi seragam (h-full flex).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, Wrench } from "lucide-react";
import api from "../../../lib/axios.js";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";
import AspectImage from "../../ui/AspectImage.jsx";
import EmptyState from "../../ui/EmptyState.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ServiceGrid({ services: initialServices, isLoading: initialLoading, isError: initialError }) {
  const [sp, setSp] = useSearchParams();
  const requestedCategory = sp.get("kategori") ?? "";
  const q = sp.get("q") ?? "";
  const debouncedQ = useDebounced(q);
  const { data: facetData, isLoading: facetsLoading } = useQuery({
    queryKey: ["public-service-categories"],
    queryFn: async () => (await api.get("/public/service-categories")).data,
  });
  const categories = facetData?.data?.categories ?? [];
  const activeCategory = categories.some((category) => category.slug === requestedCategory) ? requestedCategory : "";

  useEffect(() => {
    if (!facetsLoading && requestedCategory && !categories.some((category) => category.slug === requestedCategory)) {
      setSp((previous) => {
        const next = new URLSearchParams(previous);
        next.delete("kategori");
        return next;
      });
    }
  }, [categories, facetsLoading, requestedCategory, setSp]);

  const { data, isLoading: servicesLoading, isError: servicesError } = useQuery({
    queryKey: ["public-services-grid", activeCategory, debouncedQ],
    queryFn: async () => (await api.get("/public/services", { params: { category: activeCategory || undefined, search: debouncedQ.trim() || undefined } })).data,
    initialData: !activeCategory && !debouncedQ && initialServices?.length ? { data: initialServices } : undefined,
  });
  const rows = data?.data ?? [];
  const isLoading = initialLoading || servicesLoading;
  const isError = initialError || servicesError;

  const updateParam = (key, value) => {
    setSp((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };
  const resetFilters = () => setSp((previous) => {
    const next = new URLSearchParams(previous);
    next.delete("kategori");
    next.delete("q");
    return next;
  });

  const showChips = !facetsLoading && categories.length > 1;

  const odd = rows.length % 2 === 1;

  return (
    <div>
       {/* Pencarian + filter dari data kategori layanan */}
       <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div className="relative sm:w-72">
           <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light" />
           <input type="search" value={q} onChange={(e) => updateParam("q", e.target.value.trimStart())} placeholder="Cari layanan…"
             aria-label="Cari layanan"
             className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
         </div>
         {facetsLoading ? (
           <div className="flex gap-2" aria-busy="true" aria-label="Memuat filter kategori">
             {[0, 1, 2].map((i) => <span key={i} className="h-10 w-24 animate-pulse rounded-full bg-white" aria-hidden />)}
           </div>
         ) : showChips ? (
           <div className="relative min-w-0 sm:max-w-[calc(100%-19rem)]">
             <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-end sm:overflow-visible" role="tablist" aria-label="Filter layanan">
               <button type="button" role="tab" aria-selected={activeCategory === ""} onClick={() => updateParam("kategori", "")}
                 className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === "" ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
                 Semua ({facetData?.data?.totalServiceCount ?? 0})
               </button>
               {categories.map((category) => (
                 <button key={category.id} type="button" role="tab" aria-selected={activeCategory === category.slug} onClick={() => updateParam("kategori", category.slug)}
                   className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category.slug ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
                   {category.name} ({category.serviceCount})
                 </button>
               ))}
             </div>
             <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-10 w-8 bg-gradient-to-l from-cream to-transparent sm:hidden" />
           </div>
         ) : null}
       </div>

       {!isLoading && !isError && <p className="mt-4 text-sm text-ink-light">{rows.length} layanan ditemukan</p>}

       {isError ? (
         <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-ink-soft">Gagal memuat layanan — muat ulang halaman.</p>
       ) : isLoading ? (
         <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
           {[...Array(4)].map((_, i) => (
             <div key={i} aria-hidden className="overflow-hidden rounded-2xl bg-white shadow-soft">
               <div className="aspect-[4/3] animate-pulse bg-cream-deep" />
               <div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-cream-deep" /><div className="h-3 w-full animate-pulse rounded bg-cream-deep" /><div className="h-3 w-4/5 animate-pulse rounded bg-cream-deep" /></div>
             </div>
           ))}
         </div>
       ) : rows.length === 0 ? (
         <EmptyState
           icon={Wrench}
           title="Tidak ada layanan yang cocok"
           description="Coba kata kunci atau kategori lain."
           action={<button type="button" onClick={resetFilters} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-ink/80">Reset</button>}
         />
       ) : null}

       {!isLoading && !isError && rows.length > 0 && (
        <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((s, i) => {
          const Icon = SERVICE_ICONS[s.icon] ?? Wrench;
          const isLast = i === rows.length - 1;
          // Ganjil → kartu terakhir melebar penuh baris pada konteks 2 & 4 kolom
          const stretch = odd && isLast ? "sm:col-span-2 xl:col-span-4" : "";
          const featured = s.isFeatured ? "sm:col-span-2 xl:col-span-2" : "";
          return (
            <Link key={s.id} to={`/layanan/${s.slug}`}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg ${featured} ${stretch} ${s.isFeatured ? "sm:grid sm:grid-cols-2" : ""}`}>
              {s.isFeatured && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">Paling Dicari</span>
              )}
              <div className="relative overflow-hidden bg-cream-deep">
                <AspectImage src={img(s.image || s.heroImage)} alt={s.title} ratio="4/3" className="w-full transition duration-500 group-hover:scale-105" />
                {/* Ikon bundar menimpa batas gambar */}
                <span className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-soft-lg ring-4 ring-white">
                  <Icon size={22} />
                </span>
              </div>
              <div className="flex flex-1 flex-col break-words p-5 pt-9">
                <h2 className="line-clamp-2 font-jakarta text-lg font-extrabold text-ink">{s.title}</h2>
                <p className="mt-1.5 line-clamp-3 break-words text-sm leading-relaxed text-ink-soft">{s.shortDesc}</p>
                {(s.scopes?.length ?? 0) > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {s.scopes.slice(0, 3).map((sc) => (
                      <li key={sc.id} className="flex items-start gap-2 break-words text-xs font-medium text-ink-soft">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {sc.title}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Isi sisa ruang agar kartu seragam */}

                <div className="mt-auto flex items-center justify-between pt-4">
                  {s.startingPrice ? (
                    <p className="text-xs text-ink-light">Mulai dari <span className="font-jakarta font-bold text-ink">{rupiah(s.startingPrice)}</span></p>
                  ) : <span />}
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand transition group-hover:gap-2.5">
                    Lihat detail <ArrowRight size={15} />
                  </span>
                </div>
              </div>
               {/* Overlay tepi saat hover */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand/0 transition group-hover:ring-brand/30" />
            </Link>
          );
        })}
       </div>
       )}
    </div>
  );
}
