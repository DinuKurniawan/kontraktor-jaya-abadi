// Kartu artikel — kategori, judul, tanggal, waktu baca
import ImageWithFallback from "../ui/ImageWithFallback.jsx";
function HighlightedTitle({ title, query }) {
  const keyword = String(query ?? "").trim();
  if (!keyword) return title;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(title).split(new RegExp(`(${escaped})`, "ig"));
  return parts.map((part, index) => part.toLowerCase() === keyword.toLowerCase()
    ? <mark key={`${part}-${index}`} className="rounded bg-brand-soft px-0.5 text-brand">{part}</mark>
    : part);
}

export default function ArticleCard({ title, category, date, readTime, image, onClick, highlightQuery = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-auto w-full flex-col items-start text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-cream-deep">
        {image && (
          <ImageWithFallback src={image} alt={title} width={800} height={500} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        {category && <span className="text-xs font-semibold uppercase tracking-wide text-brand">{category}</span>}
        <h3 className="mt-1.5 font-jakarta text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
          <HighlightedTitle title={title} query={highlightQuery} />
        </h3>
        <p className="mt-2 text-xs text-ink-light">
          {[date, readTime ? `${readTime} mnt baca` : null].filter(Boolean).join("  ·  ")}
        </p>
      </div>
    </button>
  );
}
