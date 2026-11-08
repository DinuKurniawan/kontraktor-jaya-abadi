// Bagian reusable detail artikel: progress, TOC, share, navigasi, dan carousel terkait.
import { Check, ChevronLeft, ChevronRight, Link2, List, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PostCardV2 from "./PostCardV2.jsx";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  return <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} className="fixed inset-x-0 top-0 z-[60] h-1 bg-brand/15" aria-label={`Progres membaca ${Math.round(progress)} persen`}><div className="h-full bg-brand transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>;
}

export function prepareArticleContent(content) {
  if (typeof DOMParser === "undefined") return { html: content || "", headings: [] };
  const parsed = new DOMParser().parseFromString(content || "", "text/html");
  const used = new Set();
  const headings = [...parsed.body.querySelectorAll("h2, h3")].map((heading, index) => {
    const text = heading.textContent?.trim() || `Bagian ${index + 1}`;
    const base = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || `bagian-${index + 1}`;
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    heading.id = id;
    return { id, text, level: heading.tagName.toLowerCase() };
  });
  return { html: parsed.body.innerHTML, headings };
}

export function ArticleToc({ headings = [] }) {
  const [open, setOpen] = useState(false);
  if (!headings.length) return null;
  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft lg:hidden">
        <span className="inline-flex items-center gap-2"><List size={16} className="text-brand" /> Daftar isi</span><ChevronRight size={16} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <nav className={`${open ? "block" : "hidden"} mt-3 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft lg:mt-0 lg:block`} aria-label="Daftar isi artikel">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand">Daftar isi</p>
        <ol className="space-y-1.5 border-l border-ink/10">
          {headings.map((heading, index) => (
            <li key={heading.id} className={heading.level === "h3" ? "pl-5" : "pl-3"}>
              <button type="button" onClick={() => goTo(heading.id)} className="block w-full rounded-r-lg py-1 text-left text-xs leading-relaxed text-ink-soft transition hover:bg-brand-soft hover:text-brand">{index + 1}. {heading.text}</button>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

export function ShareButtons({ url, title, copied, onCopy }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <div role="group" className="flex flex-wrap items-center gap-2" aria-label="Bagikan artikel">
      <span className="mr-1 text-xs font-bold text-ink-light">Bagikan:</span>
      <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/12 px-3.5 py-2 text-xs font-bold text-[#128C4A] transition hover:bg-[#25D366]/25"><MessageCircle size={14} /> WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#1877F2]/12 px-3.5 py-2 text-xs font-bold text-[#1877F2] transition hover:bg-[#1877F2]/25">Facebook</a>
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" className="rounded-full bg-ink/5 px-3.5 py-2 text-xs font-bold text-ink transition hover:bg-ink hover:text-cream">X</a>
      <button type="button" onClick={onCopy} className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep px-3.5 py-2 text-xs font-bold text-ink transition hover:bg-ink hover:text-cream">{copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? "Tersalin" : "Salin tautan"}</button>
    </div>
  );
}

export function ArticleNavigation({ previous, next }) {
  if (!previous && !next) return null;
  return (
    <nav className="mt-10 grid gap-3 border-y border-ink/10 py-5 sm:grid-cols-2" aria-label="Navigasi artikel">
      {previous ? <Link to={`/artikel/${previous.slug}`} className="group rounded-xl p-3 transition hover:bg-cream-deep"><span className="inline-flex items-center gap-1 text-xs font-bold text-ink-light"><ChevronLeft size={14} /> Artikel sebelumnya</span><span className="mt-1 block line-clamp-2 text-sm font-bold text-ink group-hover:text-brand">{previous.title}</span></Link> : <span />}
      {next && <Link to={`/artikel/${next.slug}`} className="group rounded-xl p-3 text-left sm:text-right"><span className="inline-flex items-center gap-1 text-xs font-bold text-ink-light">Artikel berikutnya <ChevronRight size={14} /></span><span className="mt-1 block line-clamp-2 text-sm font-bold text-ink group-hover:text-brand">{next.title}</span></Link>}
    </nav>
  );
}

export function RelatedCarousel({ posts = [] }) {
  const scroller = useRef(null);
  if (!posts.length) return null;
  const move = (direction) => scroller.current?.scrollBy({ left: direction * (scroller.current.clientWidth * 0.82), behavior: "smooth" });
  return (
    <section className="bg-cream-deep py-14" aria-labelledby="artikel-terkait">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Rekomendasi</p><h2 id="artikel-terkait" className="mt-2 font-jakarta text-2xl font-extrabold text-ink">Artikel <span className="text-brand">Terkait</span></h2></div>
          {posts.length > 1 && <div className="flex gap-2"><button type="button" onClick={() => move(-1)} aria-label="Artikel terkait sebelumnya" className="rounded-full border border-ink/10 bg-white p-2 text-ink-soft transition hover:border-brand hover:text-brand"><ChevronLeft size={17} /></button><button type="button" onClick={() => move(1)} aria-label="Artikel terkait berikutnya" className="rounded-full border border-ink/10 bg-white p-2 text-ink-soft transition hover:border-brand hover:text-brand"><ChevronRight size={17} /></button></div>}
        </div>
        <div ref={scroller} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {posts.map((post) => <div key={post.id} className="w-[85%] shrink-0 snap-start sm:w-[48%] lg:w-[31.5%]"><PostCardV2 post={post} /></div>)}
        </div>
      </div>
    </section>
  );
}
