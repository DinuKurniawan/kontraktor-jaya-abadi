// Breadcrumb — Beranda / Proyek / {current}
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="font-jakarta text-xs">
      <ol className="flex flex-wrap items-center gap-1 text-ink-light">
        <li>
          <Link to="/" className="transition hover:text-brand">Beranda</Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-ink-light/60" />
            {i === items.length - 1 || !item.to ? (
              <span aria-current="page" className="font-semibold text-ink">{item.label}</span>
            ) : (
              <Link to={item.to} className="transition hover:text-brand">{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
