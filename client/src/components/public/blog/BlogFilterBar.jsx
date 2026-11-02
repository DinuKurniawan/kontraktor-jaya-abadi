// BlogFilterBar — filter URL, pencarian, chip aktif, dan ringkasan hasil.
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const SORT_OPTIONS = [
  ["terbaru", "Terbaru"],
  ["terpopuler", "Terpopuler"],
  ["terlama", "Terlama"],
];

export default function BlogFilterBar({
  categories = [],
  tags = [],
  search = "",
  activeSearch = "",
  category = "",
  tag = "",
  sort = "terbaru",
  total = 0,
  onSearchChange,
  onCategoryChange,
  onTagChange,
  onSortChange,
  onReset,
}) {
  const [draftSearch, setDraftSearch] = useState(search);
  const activeCategory = categories.find((item) => item.slug === category);
  const activeTag = tags.find((item) => item.slug === tag);
  const hasFilters = Boolean(activeSearch || category || tag || sort !== "terbaru");

  useEffect(() => setDraftSearch(search), [search]);
  useEffect(() => {
    if (draftSearch === search) return undefined;
    const timer = setTimeout(() => onSearchChange?.(draftSearch), 400);
    return () => clearTimeout(timer);
  }, [draftSearch, search, onSearchChange]);

  const clearSearch = () => {
    setDraftSearch("");
    onSearchChange?.("");
  };

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6" aria-label="Filter artikel">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-light">Kategori</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => onCategoryChange?.("")} aria-pressed={!category} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${!category ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:bg-brand-soft hover:text-brand"}`}>
              Semua
            </button>
            {categories.map((item) => (
              <button key={item.id ?? item.slug} type="button" onClick={() => onCategoryChange?.(item.slug)} aria-pressed={category === item.slug} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${category === item.slug ? "bg-ink text-cream" : "bg-cream-deep text-ink-soft hover:bg-brand-soft hover:text-brand"}`}>
                {item.name} <span className="ml-1 opacity-60">{item.count ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex shrink-0 items-center gap-3 text-sm font-semibold text-ink">
          <span>Urutkan</span>
          <select value={sort} onChange={(event) => onSortChange?.(event.target.value)} className="rounded-xl border border-ink/10 bg-cream/60 px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
            {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-light">Tag</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tags.map((item) => (
              <button key={item.id ?? item.slug} type="button" onClick={() => onTagChange?.(tag === item.slug ? "" : item.slug)} aria-pressed={tag === item.slug} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${tag === item.slug ? "border-brand bg-brand-soft text-brand" : "border-ink/10 text-ink-soft hover:border-brand/40 hover:text-brand"}`}>
                #{item.name} <span className="ml-1 opacity-60">{item.count ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative mt-5">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
        <input type="search" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Cari lagi di artikel…" aria-label="Cari di artikel" className="w-full rounded-xl border border-ink/10 bg-cream/50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
      </div>

      {hasFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter aktif">
          <span className="mr-1 text-xs font-bold text-ink-light">Filter aktif:</span>
          {activeCategory && <button type="button" onClick={() => onCategoryChange?.("")} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">{activeCategory.name} <X size={13} /></button>}
          {activeTag && <button type="button" onClick={() => onTagChange?.("")} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">#{activeTag.name} <X size={13} /></button>}
          {activeSearch && <button type="button" onClick={clearSearch} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"><span className="truncate">'{activeSearch}'</span> <X size={13} /></button>}
          {sort !== "terbaru" && <button type="button" onClick={() => onSortChange?.("terbaru")} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">{SORT_OPTIONS.find(([value]) => value === sort)?.[1] ?? sort} <X size={13} /></button>}
          <button type="button" onClick={onReset} className="ml-1 text-xs font-bold text-ink-soft underline decoration-ink/30 underline-offset-2 transition hover:text-brand">Reset semua</button>
        </div>
      )}

      <p className="mt-5 text-sm text-ink-soft">
        <strong className="font-extrabold text-ink">{Number(total).toLocaleString("id-ID")} artikel</strong>{activeSearch ? ` ditemukan untuk '${activeSearch}'` : " ditemukan"}
      </p>
    </section>
  );
}
