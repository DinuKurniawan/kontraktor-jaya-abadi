/*
 * FeaturedProjectsStrip — carousel kartu proyek unggulan horizontal.
 * Gestur sentuh native (scroll-snap) & navigasi panah/titik.
 * Kartu berikutnya mengintip dari samping dan muncul terangkat dari bawah saat digeser.
 */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";
import api from "../../../lib/axios.js";
import Container from "../Container.jsx";
import { imageProps } from "../../../lib/image.js";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const num = (v) => Number(v).toLocaleString("id-ID");

function ProjectMeta({ project }) {
  const items = [
    project.location && [MapPin, project.location],
    project.area && [Ruler, `${num(project.area)} m²`],
    project.durationMonths && [CalendarDays, `${num(project.durationMonths)} bulan`],
  ].filter(Boolean);

  if (!items.length) return null;
  return (
    <dl className="grid minmax-0 grid-cols-1 gap-3 border-y border-cream/15 py-4 sm:grid-cols-3">
      {items.map(([Icon, value]) => (
        <div key={value} className="flex min-w-0 items-center gap-2 text-sm text-cream/80">
          <Icon size={16} className="shrink-0 text-brand-light" aria-hidden />
          <dd className="truncate">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function FeaturedProjectsStrip() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-featured-projects"],
    queryFn: async () => (await api.get("/public/projects", { params: { featured: true, limit: 8 } })).data,
    staleTime: 5 * 60_000,
  });
  const rows = data?.data ?? [];

  const goTo = (nextIndex) => {
    const track = trackRef.current;
    if (!track || !track.children.length) return;
    const target = Math.max(0, Math.min(rows.length - 1, nextIndex));
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
      <section className="bg-cream py-14 sm:py-16" aria-labelledby="proyek-unggulan-loading" aria-busy="true">
        <Container>
          <h2 id="proyek-unggulan-loading" className="font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Proyek unggulan</h2>
          <div className="mt-8 flex gap-6 overflow-hidden pb-10 pt-4">
            {[0, 1].map((n) => (
              <div key={n} className="grid w-[86vw] max-w-[820px] shrink-0 animate-pulse overflow-hidden rounded-[2rem] bg-ink md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="aspect-[16/10] bg-cream-deep md:aspect-auto md:min-h-[28rem]" />
                <div className="min-h-72 bg-ink/90" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (isError || rows.length === 0) return null;

  return (
    <section className="bg-cream py-14 sm:py-16" aria-labelledby="proyek-unggulan">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">Pilihan Jaya Abadi</p>
            <h2 id="proyek-unggulan" className="mt-1 font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Proyek unggulan</h2>
          </div>
          {rows.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-ink-light" aria-live="polite">{index + 1} / {rows.length}</span>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Proyek sebelumnya"
                className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition-[border-color,color] duration-200 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index >= rows.length - 1}
                aria-label="Proyek berikutnya"
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
          aria-label="Proyek unggulan"
          className="mt-8 flex snap-x snap-mandatory items-end gap-6 overflow-x-auto pb-10 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {rows.map((project, projectIndex) => {
            const isActive = index === projectIndex;
            return (
              <article
                key={project.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${projectIndex + 1} dari ${rows.length}: ${project.title}`}
                onClick={() => !isActive && goTo(projectIndex)}
                className={`grid w-[86vw] max-w-[820px] shrink-0 snap-center md:snap-start overflow-hidden rounded-[2rem] bg-ink shadow-soft-lg md:min-h-[28rem] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] transition-[transform,opacity,box-shadow] duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
                  isActive
                    ? "translate-y-0 opacity-100 scale-100 shadow-2xl ring-1 ring-white/10"
                    : "translate-y-8 sm:translate-y-12 opacity-50 scale-[0.97] cursor-pointer"
                }`}
              >
                <div className="relative min-w-0 overflow-hidden bg-cream-deep">
                  <img
                    src={img(project.coverImage)}
                    {...imageProps(project.coverImage, { width: 960, height: 720, priority: projectIndex === 0 })}
                    alt={project.title}
                    className="h-full min-h-72 w-full object-cover object-center md:absolute md:inset-0"
                    style={project.coverImagePosition ? { objectPosition: project.coverImagePosition } : undefined}
                  />
                  {project.category?.name && (
                    <span className="absolute left-5 top-5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink">
                      {project.category.name}
                    </span>
                  )}
                </div>

                <div
                  className={`flex min-w-0 flex-col justify-between p-6 sm:p-8 lg:p-9 transition-[transform,opacity] duration-500 delay-75 motion-reduce:transform-none ${
                    isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-75"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-brand-light">Pilihan Jaya Abadi</p>
                    <h3 className="mt-3 overflow-wrap-break-word font-jakarta text-2xl font-extrabold leading-snug text-cream sm:text-3xl">
                      {project.title}
                    </h3>
                    {project.summary && (
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/75 line-clamp-3">
                        {project.summary}
                      </p>
                    )}
                  </div>
                  <div
                    className={`mt-6 transition-[transform,opacity] duration-500 delay-150 motion-reduce:transform-none ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-60"
                    }`}
                  >
                    <ProjectMeta project={project} />
                    <Link
                      to={`/proyek/${project.slug}`}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-[background-color] duration-200 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      Lihat detail proyek <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {rows.length > 1 && (
          <div className="mt-2 flex justify-center gap-2" role="tablist" aria-label="Pilih proyek unggulan">
            {rows.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Buka proyek unggulan ${i + 1}`}
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
