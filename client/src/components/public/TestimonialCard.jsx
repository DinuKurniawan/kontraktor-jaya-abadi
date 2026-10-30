// Kartu testimoni — latar putih rounded-2xl, bintang, kutipan, identitas
import { Star } from "lucide-react";

export default function TestimonialCard({ name, role, company, content, rating = 5, avatar }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(28,25,23,0.07)]">
      <div className="flex gap-0.5" aria-label={`Rating ${rating} dari 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={14} className={n <= rating ? "fill-brand text-brand" : "fill-cream-deep text-cream-deep"} />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">“{content}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-jakarta text-sm font-bold text-brand-dark">
            {name?.[0]}
          </span>
        )}
        <div>
          <p className="font-jakarta text-sm font-bold text-ink">{name}</p>
          <p className="text-xs text-ink-light">{[role, company].filter(Boolean).join(", ")}</p>
        </div>
      </figcaption>
    </figure>
  );
}
