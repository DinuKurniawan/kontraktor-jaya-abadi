// FeaturedPostsHero — slider tiga artikel unggulan, berganti otomatis tiap 7 detik.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (path) => (!path ? "" : path.startsWith("http") ? path : `${SERVER}${path}`);
const fmt = (date) => date && new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function FeaturedPostsHero() {
  const [active, setActive] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["public-posts-featured"],
    queryFn: async () => (await api.get("/public/posts/featured", { params: { limit: 3 } })).data.data,
    staleTime: 60 * 1000,
  });
  const posts = (data ?? []).slice(0, 3);

  useEffect(() => {
    if (posts.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % posts.length), 7000);
    return () => window.clearInterval(timer);
  }, [posts.length]);

  useEffect(() => {
    if (active >= posts.length && posts.length > 0) setActive(0);
  }, [active, posts.length]);

  if (isLoading) {
    return <Container className="py-10 sm:py-14"><div className="aspect-[16/8] animate-pulse rounded-3xl bg-cream-deep" /></Container>;
  }
  if (!posts.length) return null;

  const post = posts[active];
  const move = (direction) => setActive((index) => (index + direction + posts.length) % posts.length);

  return (
    <section className="py-10 sm:py-14" aria-labelledby="artikel-unggulan">
      <Container>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Pilihan editor</p>
            <h2 id="artikel-unggulan" className="mt-2 font-jakarta text-2xl font-extrabold text-ink sm:text-3xl">Artikel <span className="text-brand">Unggulan</span></h2>
          </div>
          {posts.length > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => move(-1)} aria-label="Artikel unggulan sebelumnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft shadow-soft transition hover:border-brand hover:text-brand"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => move(1)} aria-label="Artikel unggulan berikutnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft shadow-soft transition hover:border-brand hover:text-brand"><ChevronRight size={18} /></button>
            </div>
          )}
        </div>

        <article className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-ink shadow-soft-lg sm:aspect-[16/7.5]" aria-live="polite">
          {post.coverImage && <img src={img(post.coverImage)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
            <div className="max-w-3xl">
              {post.category?.name && <span className="inline-flex rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{post.category.name}</span>}
              <h3 className="mt-3 font-jakarta text-2xl font-extrabold leading-tight sm:text-4xl">{post.title}</h3>
              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><UserRound size={14} /> {post.author?.name ?? "Jaya Abadi"}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {fmt(post.publishedAt)}</span>
                {post.readTime && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {post.readTime} mnt baca</span>}
              </div>
              <Link to={`/artikel/${post.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-brand hover:text-white">
                Baca selengkapnya <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </article>

        {posts.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2" aria-label="Indikator artikel unggulan">
            {posts.map((item, index) => (
              <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Tampilkan artikel unggulan ${index + 1}`} aria-current={index === active ? "true" : undefined} className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-brand" : "w-2 bg-ink/20 hover:bg-brand/60"}`} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
