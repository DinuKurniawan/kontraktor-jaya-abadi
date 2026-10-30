// Judul section + link "lihat semua" — hanya muncul bila `to` diberikan
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHeading({ title, action, to, actionLabel = "Lihat semua" }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 sm:mb-10">
      <h2 className="font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h2>
      {(to || action) && (
        <Link
          to={to || "#"}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-cream"
        >
          {actionLabel} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
