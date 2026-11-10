/*
 * FeaturedPostsStrip — carousel artikel unggulan horizontal.
 * Satu artikel per slide; gestur sentuh native (scroll-snap) + panah + titik.
 * Kartu aktif terangkat, kartu tetangga mengintip dari bawah/samping.
 */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { imageProps } from "../../../lib/image.js";

const fmt = (date) =>
  date && new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function FeaturedPostsStrip() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-posts-featured"],
    queryFn: async () => (await api.get("/public/posts/featured", { params: { limit: 8 } })).data.data,
    staleTime: 5 * 60_000,
  });
  const posts = data ?? [];

  const goTo = (nextIndex) => {
    const track = trackRef.current;
    if (!track || !track.children.length) return;
    const target = Math.max(0, Math.min(posts.length - 1, nextIndex));
    const firstOffset = track.children[0].offsetLeft;
    const card = track.children[target];
    if (card) track.scrollTo({ left: card.offsetLeft - firstOffset, behavior: "smooth" });
    setIndex(target);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.children.length) return;
    const firstOffset = track.children[0].offsetLeft;
    const closest = [...track.children].reduce((best, card, cardIndex) => (
      Math.abs(card.offsetLeft - firstOffset - track.scrollLeft) < best.distance
        ? { index: cardIndex, distance: Math.abs(card.offsetLeft - firstOffset - track.scrollLeft) }
        : best
    ), { index: 0, distance: Infinity });
    setIndex(closest.index);
  };

  if (isLoading) {
    return (
      <section className="bg-cream py-14 sm:py-16" aria-labelledby="artikel-unggulan-loading" aria-busy="true">
        <Container>
          <h2 id="artikel-unggulan-loading" className="font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Artikel unggulan</h2>
          <div className="mt-8 flex gap-6 overflow-hidden pb-10 pt-4">
            <div className="grid w-full min-w-full shrink-0 animate-pulse overflow-hidden rounded-[2rem] bg-ink md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="aspect-[16/10] bg-cream-deep md:aspect-auto md:min-h-[30rem]" />
              <div className="min-h-72 bg-ink/90" />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (isError || posts.length === 0) return null;

  return (
    <section className="bg-cream py-14 sm:py-16" aria-labelledby="artikel-unggulan">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">Pilihan editor</p>
            <h2 id="artikel-unggulan" className="mt-1 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Artikel unggulan</h2>
          </div>
          {posts.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-ink-light" aria-live="polite">{index + 1} / {posts.length}</span>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Artikel sebelumnya"
                className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition-[border-color,color] duration-200 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index >= posts.length - 1}
                aria-label="Artikel berikutnya"
                className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition-[border-color,color] duration-200 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={trackRef}
          onScroll={onScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Artikel unggulan"
          className="mt-8 flex snap-x snap-mandatory items-end gap-6 overflow-x-auto pb-10 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post, postIndex) => {
            const isActive = index === postIndex;
            return (
              <article
                key={post.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${postIndex + 1} dari ${posts.length}: ${post.title}`}
                onClick={() => !isActive && goTo(postIndex)}
                className={`w-full min-w-full shrink-0 snap-center transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${
                  isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-50 sm:translate-y-12"
                }`}
              >
                <div
                  className={`grid h-full overflow-hidden rounded-[2rem] bg-ink shadow-soft-lg md:min-h-[30rem] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] transition-[box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isActive ? "shadow-2xl ring-1 ring-white/10" : "cursor-pointer"
                  }`}
                >
                <div className="relative min-w-0 overflow-hidden bg-cream-deep">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      {...imageProps(post.coverImage, { width: 960, height: 720, priority: postIndex === 0 })}
                      alt={post.title}
                      className={`h-full min-h-72 w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none md:absolute md:inset-0 ${
                        isActive ? "scale-100" : "scale-105"
                      }`}
                    />
                  ) : (
                    <div className="flex h-full min-h-72 items-center justify-center text-sm text-ink-light">Belum ada gambar</div>
                  )}
                  {post.category?.name && (
                    <span className="absolute left-5 top-5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
                      {post.category.name}
                    </span>
                  )}
                </div>

                <div
                  className={`flex min-w-0 flex-col justify-between p-6 transition-[transform,opacity] duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none sm:p-8 lg:p-9 ${
                    isActive ? "translate-x-0 translate-y-0 opacity-100" : "translate-y-4 opacity-75"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-brand-light">Pilihan editor</p>
                    <h3 className="mt-3 overflow-wrap-break-word font-jakarta text-2xl font-extrabold leading-snug text-cream sm:text-3xl">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-cream/75">{post.excerpt}</p>
                    )}
                  </div>

                  <div
                    className={`mt-6 transition-[transform,opacity] duration-500 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-60"
                    }`}
                  >
                    <dl className="grid minmax-0 grid-cols-1 gap-3 border-y border-cream/15 py-4 sm:grid-cols-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-cream/80">
                        <UserRound size={16} className="shrink-0 text-brand-light" aria-hidden />
                        <dd className="truncate">{post.author?.name ?? "Jaya Abadi"}</dd>
                      </div>
                      <div className="flex min-w-0 items-center gap-2 text-sm text-cream/80">
                        <CalendarDays size={16} className="shrink-0 text-brand-light" aria-hidden />
                        <dd className="truncate">{fmt(post.publishedAt)}</dd>
                      </div>
                      {post.readTime && (
                        <div className="flex min-w-0 items-center gap-2 text-sm text-cream/80">
                          <Clock3 size={16} className="shrink-0 text-brand-light" aria-hidden />
                          <dd className="truncate">{post.readTime} menit baca</dd>
                        </div>
                      )}
                    </dl>
                    <Link
                      to={`/artikel/${post.slug}`}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-brand-dark hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink active:translate-x-0"
                    >
                      Baca selengkapnya <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                </div>
                </div>
              </article>
            );
          })}
        </div>

        {posts.length > 1 && (
          <div className="mt-2 flex justify-center gap-2" role="tablist" aria-label="Pilih artikel unggulan">
            {posts.map((post, i) => (
              <button
                key={post.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Buka artikel unggulan ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 w-8 rounded-full transition-[transform,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  i === index ? "scale-x-100 bg-brand" : "scale-x-[0.25] bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
