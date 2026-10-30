/*
 * ServiceGrid — kartu layanan bergambar (4:3) + ikon bundar menimpa gambar,
 * 3 poin ruang lingkup teratas, label "Mulai dari", tautan "Lihat detail".
 * Featured → span 2 kolom + lencana "Paling Dicari". Kolom: 1 mobile / 2 tablet
 * & md / 4 desktop lebar; jumlah ganjil → kartu terakhir melebar penuh.
 * Pencarian + filter cepat (Semua/Bangun/Renovasi/Desain/Pengawas) tanpa reload.
 * Seluruh kartu = satu tautan; tinggi seragam (h-full flex).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Wrench } from "lucide-react";
import Container from "../Container.jsx";
import { SERVICE_ICONS } from "../../../lib/service-icons.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const FILTERS = [
  ["", "Semua"],
  ["konstruksi", "Bangun"],
  ["renovasi", "Renovasi"],
  ["interior", "Desain"],
  ["pengawasan", "Pengawasan"],
];
const MATCH_KEY = { konstruksi: "konstruksi", renovasi: "renovasi", interior: "desain|interior", pengawasan: "pengawas" };

export default function ServiceGrid({ services, isLoading, isError }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    let list = services ?? [];
    if (filter) {
      const re = new RegExp(MATCH_KEY[filter], "i");
      list = list.filter((s) => re.test(`${s.slug} ${s.title}`));
    }
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter((s) => `${s.title} ${s.shortDesc}`.toLowerCase().includes(term));
    }
    return list;
  }, [services, q, filter]);

  // Skeleton / error / kosong — diminta oleh revisi kartu layanan
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} aria-hidden className="overflow-hidden rounded-2xl bg-white shadow-soft">
            <div className="aspect-[4/3] animate-pulse bg-cream-deep" />
            <div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-cream-deep" /><div className="h-3 w-full animate-pulse rounded bg-cream-deep" /><div className="h-3 w-4/5 animate-pulse rounded bg-cream-deep" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) return <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft">Gagal memuat layanan — muat ulang halaman.</p>;
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 py-14 text-center">
        <Wrench size={28} className="mx-auto text-ink/30" />
        <p className="mt-3 font-jakarta font-bold text-ink">Layanan tidak ditemukan</p>
        <p className="mt-1 text-sm text-ink-light">Coba kata kunci lain atau pilih filter "Semua".</p>
      </div>
    );
  }

  const odd = rows.length % 2 === 1;

  return (
    <div>
      {/* Pencarian + filter cepat */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-light" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari layanan…"
            aria-label="Cari layanan"
            className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter layanan">
          {FILTERS.map(([v, label]) => (
            <button key={v || "all"} type="button" role="tab" aria-selected={filter === v}
              onClick={() => setFilter(v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === v ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid kartu */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((s, i) => {
          const Icon = SERVICE_ICONS[s.icon] ?? Wrench;
          const isLast = i === rows.length - 1;
          // Ganjil → kartu terakhir melebar penuh baris pada konteks 2 & 4 kolom
          const stretch = odd && isLast ? "sm:col-span-2 xl:col-span-4" : "";
          const featured = s.isFeatured ? "sm:col-span-2 xl:col-span-2" : "";
          return (
            <Link key={s.id} to={`/layanan/${s.slug}`}
              className={`group relative block h-full overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg ${featured} ${stretch}`}>
              {s.isFeatured && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">Paling Dicari</span>
              )}
              <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
                {s.heroImage || s.image ? (
                  <img src={img(s.heroImage || s.image)} alt={s.title} width={640} height={480} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-cream-deep to-ink/10" />
                )}
                {/* Ikon bundar menimpa batas gambar */}
                <span className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-soft-lg ring-4 ring-white">
                  <Icon size={22} />
                </span>
              </div>
              <div className="flex h-[calc(100%-0px)] flex-col p-5 pt-9">
                <h2 className="font-jakarta text-lg font-extrabold text-ink">{s.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{s.shortDesc}</p>
                {(s.scopes?.length ?? 0) > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {s.scopes.slice(0, 3).map((sc) => (
                      <li key={sc.id} className="flex items-start gap-2 text-xs font-medium text-ink-soft">
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
    </div>
  );
}
