import { ChevronLeft, ChevronRight } from "lucide-react";

// Daftar nomor halaman dengan elipsis: 1 … 4 5 6 … 20
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

const btnBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Paginasi">
      <button type="button" className={`${btnBase} text-text-muted hover:bg-surface`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Sebelumnya">
        <ChevronLeft size={16} />
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${btnBase} ${p === page ? "bg-primary text-white shadow-soft" : "text-text hover:bg-surface"}`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className={`${btnBase} text-text-muted hover:bg-surface`} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Berikutnya">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
