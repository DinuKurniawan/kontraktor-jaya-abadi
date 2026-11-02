/*
 * ProjectCardV2 — kartu proyek untuk grid /proyek.
 * Foto 4:3 dengan badge kategori (kiri atas) dan status berwarna (kanan atas:
 * Selesai hijau, Berjalan oranye, Perencanaan abu). Hover: foto zoom + overlay
 * "Lihat detail". Di bawah foto: judul (maks 2 baris), lokasi, dan meta kecil
 * (tahun · luas m² · layanan).
 */
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { STATUS_LABEL } from "../../../pages/public/project-labels.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const num = (v) => Number(v).toLocaleString("id-ID");

const STATUS_BADGE = {
  COMPLETED: "border-emerald-600/20 bg-emerald-50 text-emerald-700",
  ONGOING: "border-brand/25 bg-orange-50 text-brand",
  PLANNING: "border-ink/15 bg-ink/[0.06] text-ink-soft",
};

export default function ProjectCardV2({ project }) {
  const { title, slug, location, year, area, status, coverImage, category, service } = project;

  return (
    <Link
      to={`/proyek/${slug}`}
      className="group flex h-full flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      aria-label={`Lihat detail ${title}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-deep">
        {coverImage ? (
          <img
            src={img(coverImage)}
            alt={title}
            width={800}
            height={600}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-jakarta text-sm text-ink-light">Belum ada foto</div>
        )}

        {/* Badge kategori & status */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {category?.name ? (
            <span className="rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur">
              {category.name}
            </span>
          ) : <span />}
          {status && (
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${STATUS_BADGE[status] ?? STATUS_BADGE.PLANNING}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          )}
        </div>

        {/* Overlay hover / fokus keyboard */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/75 via-ink/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-bold text-ink shadow-soft">
            Lihat detail <ArrowUpRight size={14} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <h3 className="line-clamp-2 min-h-[3.1rem] font-jakarta text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand sm:text-lg">
          {title}
        </h3>

        {location && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-ink-soft">
            <MapPin size={12} className="shrink-0 text-brand" /> <span className="line-clamp-1">{location}</span>
          </p>
        )}

        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1.5 text-[11px] text-ink-light sm:text-xs">
          {year && <span>{year}</span>}
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
      </div>
    </Link>
  );
}
