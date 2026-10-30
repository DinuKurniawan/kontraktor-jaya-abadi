// Kartu artikel — kategori, judul, tanggal, waktu baca
export default function ArticleCard({ title, category, date, readTime, image, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-cream-deep">
        {image && (
          <img src={image} alt={title} width={800} height={500} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        {category && <span className="text-xs font-semibold uppercase tracking-wide text-brand">{category}</span>}
        <h3 className="mt-1.5 font-jakarta text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
          {title}
        </h3>
        <p className="mt-auto pt-3 text-xs text-ink-light">
          {[date, readTime ? `${readTime} mnt baca` : null].filter(Boolean).join("  ·  ")}
        </p>
      </div>
    </button>
  );
}
