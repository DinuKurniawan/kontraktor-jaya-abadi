/*
 * ProjectListItem — baris proyek untuk mode "Daftar" di /proyek.
 * Foto kecil di kiri (4:3), isi di kanan: badge kategori & status, judul,
 * deskripsi singkat, meta (lokasi · tahun · luas · layanan), tombol "Lihat detail".
 */
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { STATUS_LABEL } from "../../../pages/public/project-labels.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const num = (v) => Number(v).toLocaleString("id-ID");

const STATUS_BADGE = {
  COMPLETED: "border-emerald-600/20 bg-emerald-50 text-emerald-700",
  ONGOING: "border-brand/25 bg-orange-50 text-brand",
  PLANNING: "border-ink/15 bg-ink/[0.06] text-ink-soft",
};

export default function ProjectListItem({ project }) {
  const { title, slug, summary, location, year, area, status, coverImage, category, service } = project;

  return (
    <Link
      to={`/proyek/${slug}`}
      className="group flex gap-3 rounded-2xl border border-ink/10 bg-white p-3 transition hover:border-brand/40 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:gap-5 sm:p-4"
      aria-label={`Lihat detail ${title}`}
    >
      {/* Foto kecil di kiri */}
      <div className="relative w-28 shrink-0 self-start overflow-hidden rounded-xl bg-cream-deep sm:w-44 lg:w-56">
        <div className="aspect-[4/3]">
          {coverImage ? (
            <img
              src={img(coverImage)}
              alt={title}
              width={640}
              height={480}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-ink-light">Tanpa foto</div>
          )}
        </div>
      </div>

      {/* Isi */}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {category?.name && (
            <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[10px] font-semibold text-ink-soft">{category.name}</span>
          )}
          {status && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[status] ?? STATUS_BADGE.PLANNING}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-jakarta text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand sm:text-lg">
          {title}
        </h3>

        {summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-light">{summary}</p>
        )}

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-light sm:text-xs">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="shrink-0 text-brand" /> <span className="line-clamp-1">{location}</span>
            </span>
          )}
          {year && (
            <>
              <span aria-hidden className="text-ink/25">•</span>
              <span>{year}</span>
            </>
          )}
          {area ? (
            <>
              <span aria-hidden className="text-ink/25">•</span>
              <span>{num(area)} m²</span>
            </>
          ) : null}
          {service?.title ? (
            <>
              <span aria-hidden className="text-ink/25">•</span>
              <span className="line-clamp-1">{service.title}</span>
            </>
          ) : null}
        </p>

        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-bold text-cream transition-colors group-hover:bg-brand sm:mt-3 sm:text-xs">
          Lihat detail <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
