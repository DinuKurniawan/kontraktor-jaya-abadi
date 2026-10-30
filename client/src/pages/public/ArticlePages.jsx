// Artikel — daftar (besar + grid, filter kategori, search, paginasi)
// dan detail (meta, konten, bagikan, terkait)
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Link2, Search } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import PillButton from "../../components/public/PillButton.jsx";
import ArticleCard from "../../components/public/ArticleCard.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import Seo from "../../components/public/Seo.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const fmt = (d) => d && new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("kategori") ?? "";
  const [page, setPage] = useState(1);

  const setParam = (key) => (value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-posts", { page, search, category }],
    queryFn: async () => (await api.get("/public/posts", { params: { page, limit: 7, search: search || undefined, category: category || undefined } })).data,
  });

  const { data: cats } = useQuery({
    queryKey: ["public-categories-post"],
    queryFn: async () => (await api.get("/public/categories", { params: { type: "POST", limit: 20 } })).data.data,
  });

  const rows = data?.data ?? [];
  const [first, ...rest] = rows;

  return (
    <>
      <Seo path="/artikel" title="Artikel" description="Tips, panduan, dan kabar terbaru seputar konstruksi." />
      <PageBanner
        title={<>Artikel & <span className="text-brand">Wawasan</span></>}
        crumbs={[{ label: "Artikel" }]}
        description="Tips, panduan, dan kabar terbaru seputar konstruksi."
      />
      <Container className="py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setParam("q")(e.target.value)}
              placeholder="Cari artikel…"
              aria-label="Cari artikel"
              className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand"
            />
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori artikel">
            <button
              type="button"
              onClick={() => setParam("kategori")("")}
              aria-pressed={category === ""}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${category === "" ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}
            >
              Semua
            </button>
            {(cats ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setParam("kategori")(c.slug)}
                aria-pressed={category === c.slug}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${category === c.slug ? "bg-ink text-cream" : "bg-white text-ink-soft hover:text-brand"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-cream-deep" />
            <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream-deep" />)}</div>
          </div>
        ) : isError ? (
          <p className="mt-10 text-center text-sm text-danger">Gagal memuat artikel. Coba muat ulang halaman.</p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-light">Tidak ada artikel yang cocok.</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* Artikel pertama besar */}
            <Link to={`/artikel/${first.slug}`} className="block rounded-2xl bg-white p-3 shadow-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <ArticleCard
                title={first.title}
                category={first.category?.name}
                date={fmt(first.publishedAt)}
                readTime={first.readTime}
                image={img(first.coverImage)}
              />
              <p className="mt-2 line-clamp-2 pl-1 text-sm text-ink-soft">{first.excerpt}</p>
            </Link>
            {/* Sisanya grid kecil */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {rest.map((p) => (
                <Link key={p.id} to={`/artikel/${p.slug}`} className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  <ArticleCard title={p.title} category={p.category?.name} date={fmt(p.publishedAt)} readTime={p.readTime} image={img(p.coverImage)} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {data && data.meta.totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </div>
        )}
      </Container>
    </>
  );
}

// ===== Detail =====
export function ArticleDetailPage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ["public-post", slug],
    queryFn: async () => (await api.get(`/public/posts/${slug}`)).data.data,
    retry: false,
  });

  if (isError) {
    const is404 = error?.response?.status === 404;
    return (
      <>
        <PageBanner title="Artikel tidak ditemukan" crumbs={[{ label: "Artikel", to: "/artikel" }, { label: "404" }]} />
        <Container className="py-16 text-center">
          <p className="text-ink-soft">{is404 ? "Artikel yang Anda cari tidak ada atau belum terbit." : "Gagal memuat. Coba muat ulang halaman."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <PillButton variant="outline" to="/artikel">Semua Artikel</PillButton>
            <PillButton variant="primary" to="/">Beranda</PillButton>
          </div>
        </Container>
      </>
    );
  }

  if (isLoading || !post) {
    return (
      <>
        <PageBanner title="…" crumbs={[{ label: "Artikel", to: "/artikel" }]} />
        <Container className="py-14">
          <div className="mx-auto aspect-[16/9] max-w-3xl animate-pulse rounded-2xl bg-cream-deep" />
          <div className="mx-auto mt-6 max-w-3xl space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-cream-deep" />)}
          </div>
        </Container>
      </>
    );
  }

  const url = window.location.href;
  const shareText = encodeURIComponent(post.title);
  const shareWa = `https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`;
  const shareFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tautan disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  return (
    <>
      <Seo
        path={`/artikel/${slug}`}
        title={post.title}
        description={post.excerpt}
        type="article"
        image={img(post.coverImage) || undefined}
      />
      <Container className="max-w-3xl pt-12">
        {post.category?.name && (
          <Link to={`/artikel?kategori=${post.category.slug}`} className="text-xs font-bold uppercase tracking-wide text-brand hover:underline">
            {post.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-ink-light">
          {fmt(post.publishedAt)}  ·  {post.readTime} mnt baca  ·  Oleh {post.author?.name ?? "Jaya Abadi"}
        </p>

        {/* Tombol bagikan */}
        <div className="mt-5 flex items-center gap-2">
          <a href={shareWa} target="_blank" rel="noreferrer" aria-label="Bagikan ke WhatsApp" className="rounded-full bg-[#25D366]/12 px-4 py-2 text-xs font-semibold text-[#128C4A] transition hover:bg-[#25D366]/25">
            WhatsApp
          </a>
          <a href={shareFb} target="_blank" rel="noreferrer" aria-label="Bagikan ke Facebook" className="rounded-full bg-[#1877F2]/12 px-4 py-2 text-xs font-semibold text-[#1877F2] transition hover:bg-[#1877F2]/25">
            Facebook
          </a>
          <button type="button" onClick={copyLink} aria-label="Salin tautan artikel" className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink hover:text-cream">
            {copied ? <Check size={13} /> : <Link2 size={13} />} {copied ? "Tersalin" : "Salin Link"}
          </button>
        </div>

        <img src={img(post.coverImage)} alt={post.title} className="mt-7 aspect-[16/9] w-full rounded-2xl object-cover shadow-soft-lg" />
      </Container>

      {/* Konten — HTML dari editor admin, dirender dengan tipografi nyaman */}
      <Container className="max-w-3xl py-10">
        <article className="prose-jaya" dangerouslySetInnerHTML={{ __html: post.content }} />
      </Container>

      {/* Terkait */}
      {(post.related ?? []).length > 0 && (
        <section className="bg-cream-deep py-14">
          <Container>
            <h2 className="mb-7 font-jakarta text-2xl font-extrabold text-ink">Artikel <span className="text-brand">Terkait</span></h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {post.related.map((p) => (
                <Link key={p.id} to={`/artikel/${p.slug}`} className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                  <ArticleCard title={p.title} category={p.category?.name} date={fmt(p.publishedAt)} readTime={p.readTime} image={img(p.coverImage)} />
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
