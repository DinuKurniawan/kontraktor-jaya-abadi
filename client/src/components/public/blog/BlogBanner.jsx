// BlogBanner — judul, ringkasan jumlah artikel, dan pencarian dengan saran.
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Container from "../Container.jsx";
import Breadcrumb from "../Breadcrumb.jsx";

export default function BlogBanner({ total, value = "", onChange, suggestions = [] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const uniqueSuggestions = useMemo(() => [...new Set(suggestions.filter(Boolean))].slice(0, 8), [suggestions]);
  const visibleSuggestions = uniqueSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(draft.trim().toLowerCase()));

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChange?.(draft), 400);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <section className="bg-cream-deep pb-12 pt-14 sm:pb-16 sm:pt-16">
      <Container>
        <Breadcrumb items={[{ label: "Artikel" }]} />
        <div className="mt-5 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Jaya Abadi Journal</p>
          <h1 className="mt-3 font-jakarta text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Artikel & <span className="text-brand">Wawasan</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Tips, panduan, dan kabar terbaru seputar konstruksi, renovasi, interior, serta cara membangun ruang yang lebih baik.
          </p>
          <p className="mt-3 text-sm font-semibold text-ink-light">
            {typeof total === "number" ? `${total.toLocaleString("id-ID")} artikel tersedia` : "Memuat artikel…"}
          </p>
        </div>

        <form
          className="relative mt-8 max-w-3xl"
          onSubmit={(event) => { event.preventDefault(); setOpen(false); onChange?.(draft); }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative">
            <Search size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              type="search"
              value={draft}
              onChange={(event) => { setDraft(event.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
              placeholder="Cari topik konstruksi, renovasi, atau interior…"
              aria-label="Cari artikel dan wawasan"
              className="w-full rounded-2xl border border-ink/10 bg-white py-4 pl-14 pr-5 text-base text-ink shadow-soft-lg outline-none transition placeholder:text-ink-light focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {open && visibleSuggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-ink/10 bg-white p-2 shadow-soft-lg" role="listbox" aria-label="Saran pencarian">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-light">Saran pencarian</p>
              {visibleSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  onClick={() => { setDraft(suggestion); onChange?.(suggestion); setOpen(false); }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-cream-deep hover:text-brand"
                >
                  <Search size={14} className="mr-2 inline-block text-ink-light" />{suggestion}
                </button>
              ))}
            </div>
          )}
        </form>
      </Container>
    </section>
  );
}
