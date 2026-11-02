// EmptyState — keadaan kosong daftar artikel dengan saran kategori populer.
import { SearchX } from "lucide-react";

export default function EmptyState({ categories = [], onCategoryChange, onReset }) {
  const popularCategories = [...categories]
    .filter((category) => category.slug && (category.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-12 text-center sm:px-10" role="status">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"><SearchX size={22} /></span>
      <h2 className="mt-4 font-jakarta text-xl font-extrabold text-ink">Tidak ada artikel yang cocok</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">Coba gunakan kata kunci lain atau jelajahi kategori populer berikut.</p>
      {popularCategories.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Kategori populer">
          {popularCategories.map((category) => (
            <button key={category.id ?? category.slug} type="button" onClick={() => onCategoryChange?.(category.slug)} className="rounded-full bg-cream-deep px-3.5 py-2 text-xs font-bold text-ink-soft transition hover:bg-brand-soft hover:text-brand">
              {category.name} <span className="ml-1 opacity-60">{category.count}</span>
            </button>
          ))}
        </div>
      )}
      {onReset && <button type="button" onClick={onReset} className="mt-5 text-sm font-bold text-brand underline decoration-brand/30 underline-offset-4 hover:text-brand-dark">Reset filter</button>}
    </div>
  );
}
