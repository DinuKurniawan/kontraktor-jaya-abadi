/*
 * FeaturedProjectsStrip — carousel proyek unggulan.
 * Satu proyek per slide; tetap memakai scroll-snap agar gestur sentuh berjalan.
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
          <div className="mt-8 grid minmax-0 animate-pulse overflow-hidden rounded-[2rem] bg-ink md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="aspect-[4/3] bg-cream-deep md:aspect-auto md:min-h-[30rem]" />
            <div className="min-h-72 bg-ink/90" />
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
          <h2 id="proyek-unggulan" className="font-jakarta text-3xl font-extrabold text-ink sm:text-4xl">Proyek unggulan</h2>
          {rows.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-ink-light" aria-live="polite">{index + 1} / {rows.length}</span>
              <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Proyek sebelumnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => goTo(index + 1)} disabled={index >= rows.length - 1} aria-label="Proyek berikutnya" className="rounded-full border border-ink/10 bg-white p-2.5 text-ink-soft transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div ref={trackRef} onScroll={onScroll} role="region" aria-roledescription="carousel" aria-label="Proyek unggulan" className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rows.map((project, projectIndex) => (
            <article key={project.id} aria-roledescription="slide" aria-label={`${projectIndex + 1} dari ${rows.length}: ${project.title}`} className="grid min-w-full snap-start overflow-hidden rounded-[2rem] bg-ink shadow-soft-lg md:min-h-[30rem] md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="relative min-w-0 overflow-hidden bg-cream-deep">
                <img src={img(project.coverImage)} {...imageProps(project.coverImage, { width: 960, height: 720, priority: projectIndex === 0 })} alt={project.title} className="h-full min-h-72 w-full object-cover object-center md:absolute md:inset-0" style={project.coverImagePosition ? { objectPosition: project.coverImagePosition } : undefined} />
                {project.category?.name && <span className="absolute left-5 top-5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink">{project.category.name}</span>}
              </div>

              <div className="flex min-w-0 flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div>
                  <p className="text-sm font-semibold text-brand-light">Pilihan Jaya Abadi</p>
                  <h3 className="mt-4 overflow-wrap-break-word font-jakarta text-3xl font-extrabold leading-[1.08] text-cream sm:text-4xl">{project.title}</h3>
                  {project.summary && <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">{project.summary}</p>}
                </div>
                <div className="mt-8">
                  <ProjectMeta project={project} />
                  <Link to={`/proyek/${project.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                    Lihat detail proyek <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
