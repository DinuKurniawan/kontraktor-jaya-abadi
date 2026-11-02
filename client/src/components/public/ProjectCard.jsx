// Kartu proyek — foto rounded-2xl dengan overlay lokasi, judul di bawah
import { MapPin } from "lucide-react";

export default function ProjectCard({ title, location, image, category, year, badge, onClick, clampTitle = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-deep">
        {image ? (
          <img src={image} alt={title} width={800} height={600} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center font-jakarta text-sm text-ink-light">Belum ada foto</div>
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-soft">{badge}</span>
        )}
        {(category || location) && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            {category && (
              <span className="rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold text-ink">{category}</span>
            )}
            {(location || year) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/70 px-3 py-1 text-[11px] font-medium text-cream backdrop-blur">
                <MapPin size={11} /> {[location, year].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        )}
      </div>
      <h3 className={`mt-4 font-jakarta text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand ${clampTitle ? "line-clamp-2 min-h-[3.1rem]" : ""}`}>
        {title}
      </h3>
    </button>
  );
}
