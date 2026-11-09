// PostCardV2 — kartu artikel grid dengan ringkasan, penulis, tag, dan metadata.
import { CalendarDays, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const imageUrl = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);

function HighlightedTitle({ title, query }) {
  const keyword = String(query ?? "").trim();
  if (!keyword) return title;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(title).split(new RegExp(`(${escaped})`, "ig"));
  return parts.map((part, index) => part.toLowerCase() === keyword.toLowerCase()
    ? <mark key={`${part}-${index}`} className="rounded bg-brand-soft px-0.5 text-brand">{part}</mark>
    : part);
}

function initials(name = "Jaya Abadi") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JA";
}

export default function PostCardV2({ post, highlightQuery = "" }) {
  const authorName = post.author?.name || "Jaya Abadi";
  const authorPhoto = imageUrl(post.author?.photo);
  const tags = (post.tags ?? []).slice(0, 3);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg">
      <Link to={`/artikel/${post.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand">
        <div className="h-[250px] w-full overflow-hidden bg-cream-deep">
          {post.coverImage && (
            <img src={imageUrl(post.coverImage)} alt={post.title} width={800} height={450} loading="lazy" decoding="async" sizes="(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {post.category?.name && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{post.category.name}</span>}
        <Link to={`/artikel/${post.slug}`} className="mt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <h3 className="line-clamp-2 min-h-[3.5rem] font-jakarta text-lg font-extrabold leading-snug text-ink transition-colors group-hover:text-brand">
            <HighlightedTitle title={post.title} query={highlightQuery} />
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-ink-soft">{post.excerpt || "Baca wawasan terbaru dari Jaya Abadi."}</p>

        <div className="mt-4 flex items-center gap-2.5 border-t border-ink/10 pt-4">
          {authorPhoto ? (
            <img src={authorPhoto} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-extrabold text-brand">{initials(authorName)}</span>
          )}
          <span className="min-w-0 truncate text-xs font-semibold text-ink">{authorName}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-ink-light"><CalendarDays size={13} /> {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-light">
          <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {post.readTime ? `${post.readTime} mnt baca` : "Artikel"}</span>
          {tags.length > 0 && (
            <div className="flex min-w-0 gap-1.5 overflow-hidden">
              {tags.map((tag) => <span key={tag.id ?? tag.slug} className="max-w-[7rem] truncate rounded-full bg-cream-deep px-2 py-1 font-semibold text-ink-soft">#{tag.name}</span>)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
