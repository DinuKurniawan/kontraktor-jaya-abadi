/*
 * Pagination — reusable (galeri, proyek, artikel). Props: page, totalPages,
 * onChange(next). Ellipsis: selalu halaman pertama/terakhir + 1 kiri-kanan
 * halaman aktif. Mobile: ringkas dengan "x / y". Keyboard native <button>.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onChange, label = "Paginasi" }) {
  if (totalPages <= 1) return null;
  const go = (p) => p >= 1 && p <= totalPages && p !== page && onChange(p);

  // Daftar nomor + elipsis: selalu 1 & totalPages, plus 1 kiri-kanan halaman aktif
  const pages = [];
  const want = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...want].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push({ key: `e${p}`, value: "…" });
    pages.push({ key: p, value: p });
    prev = p;
  }

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-1.5">
      {/* Desktop lengkap */}
      <div className="hidden items-center gap-1.5 sm:flex">
        <PageBtn page={page - 1} disabled={page === 1} onChange={go} ariaLabel="Halaman sebelumnya"><ChevronLeft size={16} /></PageBtn>
        {pages.map((p) =>
          typeof p.value === "number" ? (
            <button key={p.value} type="button" onClick={() => go(p.value)}
              aria-current={p.value === page ? "page" : undefined} aria-label={`Halaman ${p.value}`}
              className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${p.value === page ? "bg-brand text-white" : "bg-cream-deep text-ink-soft hover:text-brand"}`}>
              {p.value}
            </button>
          ) : (
            <span key={p.value} aria-hidden className="px-1 text-ink-light">…</span>
          ),
        )}
        <PageBtn page={page + 1} disabled={page === totalPages} onChange={go} ariaLabel="Halaman berikutnya"><ChevronRight size={16} /></PageBtn>
      </div>

      {/* Mobile ringkas */}
      <div className="flex w-full items-center justify-center gap-3 sm:hidden">
        <PageBtn page={page - 1} disabled={page === 1} onChange={go} ariaLabel="Halaman sebelumnya">
          <ChevronLeft size={16} /> <span className="text-sm font-semibold">Sebelumnya</span>
        </PageBtn>
        <span className="text-sm font-semibold text-ink" aria-live="polite">{page} / {totalPages}</span>
        <PageBtn page={page + 1} disabled={page === totalPages} onChange={go} ariaLabel="Halaman berikutnya">
          <span className="text-sm font-semibold">Berikutnya</span> <ChevronRight size={16} />
        </PageBtn>
      </div>
    </nav>
  );
}

function PageBtn({ page, disabled, onChange, ariaLabel, children }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(page)} aria-label={ariaLabel}
      className="flex h-9 items-center gap-1 rounded-lg bg-cream-deep px-2 text-ink-soft transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}
