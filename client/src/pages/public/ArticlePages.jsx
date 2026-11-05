// Artikel — daftar (besar + grid, filter kategori, search, paginasi)
// dan detail (meta, konten, bagikan, terkait)
// Data kategori & tag diambil dari admin (endpoint publik)
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, Eye } from "lucide-react";
import api from "../../lib/axios.js";
import Container from "../../components/public/Container.jsx";
import PageBanner from "../../components/public/PageBanner.jsx";
import BlogBanner from "../../components/public/blog/BlogBanner.jsx";
import BlogFilterBar from "../../components/public/blog/BlogFilterBar.jsx";
import FeaturedPostsHero from "../../components/public/blog/FeaturedPostsHero.jsx";
import BlogSidebar from "../../components/public/blog/BlogSidebar.jsx";
import EmptyState from "../../components/public/blog/EmptyState.jsx";
import PostCardV2 from "../../components/public/blog/PostCardV2.jsx";
import AuthorBox from "../../components/public/blog/AuthorBox.jsx";
import ArticleNewsletter from "../../components/public/blog/ArticleNewsletter.jsx";
import { ArticleNavigation, ArticleToc, prepareArticleContent, ReadingProgress, RelatedCarousel, ShareButtons } from "../../components/public/blog/ArticleDetailParts.jsx";
import PillButton from "../../components/public/PillButton.jsx";
import Pagination from "../../components/public/Pagination.jsx";
import Seo from "../../components/public/Seo.jsx";
import Reveal from "../../components/public/Reveal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { toast } from "../../components/ui/Toast.jsx";

const SERVER = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
const img = (p) => (!p ? "" : p.startsWith("http") ? p : `${SERVER}${p}`);
const fmt = (d) => d && new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const initials = (name = "Jaya Abadi") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JA";

// ===== Halaman Daftar Artikel (/artikel) =====
export function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("kategori") ?? "";
  const tag = params.get("tag") ?? "";
  const sortValue = params.get("urutan") ?? "terbaru";
  const sort = ["terbaru", "terpopuler", "terlama"].includes(sortValue) ? sortValue : "terbaru";
  const page = Math.max(1, Number.parseInt(params.get("halaman"), 10) || 1);

  const setParam = (key) => (value) => {
    const next = new URLSearchParams(window.location.search);
    value ? next.set(key, value) : next.delete(key);
    next.delete("halaman");
    setParams(next, { replace: true });
  };

  const setPage = (value) => {
    const next = new URLSearchParams(window.location.search);
    if (value > 1) next.set("halaman", String(value));
    else next.delete("halaman");
    setParams(next, { replace: true });
  };

  const resetFilters = () => {
    setParams({}, { replace: true });
  };

  // Query utama: daftar artikel (data dari admin, filter hanya yang terbit)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-posts", { page, search, category, tag, sort }],
    queryFn: async () => (await api.get("/public/posts", { params: { page, limit: 9, search: search || undefined, category: category || undefined, tag: tag || undefined, sort } })).data,
  });

  // Kategori artikel diambil dari admin (hanya type POST)
  const { data: cats } = useQuery({
    queryKey: ["public-categories-post"],
    queryFn: async () => (await api.get("/public/categories", { params: { type: "POST" } })).data.data,
  });

  // Tag artikel diambil dari admin (hanya yang dipakai artikel terbit)
  const { data: tags } = useQuery({
    queryKey: ["public-tags"],
    queryFn: async () => (await api.get("/public/tags")).data.data,
  });

  // Facet kategori global (untuk sidebar & empty state)
  const { data: globalFacetCategories = [] } = useQuery({
    queryKey: ["public-post-category-facets"],
    queryFn: async () => (await api.get("/public/posts", { params: { page: 1, limit: 1 } })).data.facets?.categories ?? [],
    staleTime: 60 * 1000,
  });

  // Saran pencarian diambil dari data yang ada: judul artikel terpopuler
  const { data: popularPosts = [] } = useQuery({
    queryKey: ["public-posts-suggestions"],
    queryFn: async () => (await api.get("/public/posts/popular", { params: { limit: 8 } })).data.data,
    staleTime: 60 * 1000,
  });

  const rows = data?.data ?? [];
  const facetCategories = data?.facets?.categories ?? [];
  const facetBySlug = Object.fromEntries(facetCategories.map((item) => [item.slug, item]));

  // Gabungkan kategori dari admin + facet (dari data artikel), hindari duplikat
  const categories = useMemo(() => [
    ...(cats ?? []).map((item) => ({ ...item, count: facetBySlug[item.slug]?.count ?? item._count?.posts ?? 0 })),
    ...facetCategories.filter((item) => !(cats ?? []).some((categoryItem) => categoryItem.slug === item.slug)),
  ], [cats, facetCategories, facetBySlug]);

  const globalFacetBySlug = Object.fromEntries(globalFacetCategories.map((item) => [item.slug, item]));
  const popularCategories = useMemo(() => [
    ...(cats ?? []).map((item) => ({ ...item, count: globalFacetBySlug[item.slug]?.count ?? item._count?.posts ?? 0 })),
    ...globalFacetCategories.filter((item) => !(cats ?? []).some((categoryItem) => categoryItem.slug === item.slug)),
  ], [cats, globalFacetCategories, globalFacetBySlug]);

  // Saran pencarian: kategori, tag, dan judul artikel yang benar-benar ada
  const suggestions = useMemo(() => [
    ...(cats ?? []).map((item) => item.name),
    ...(tags ?? []).map((item) => item.name),
    ...popularPosts.map((post) => post.title),
  ], [cats, tags, popularPosts]);

  return (
    <>
      <Seo path="/artikel" title="Artikel" description="Tips, panduan, dan kabar terbaru seputar konstruksi." />
      <Reveal><BlogBanner
        total={data?.meta?.total}
        value={search}
        onChange={setParam("q")}
        suggestions={suggestions}
      /></Reveal>
      {page === 1 && !search && !category && !tag && sort === "terbaru" && <Reveal><FeaturedPostsHero /></Reveal>}
      <Container className="py-14">
        <Reveal>
          <BlogFilterBar
            categories={categories}
            tags={tags ?? []}
            search={search}
            activeSearch={search}
            category={category}
            tag={tag}
            sort={sort}
            total={data?.meta?.total ?? 0}
            onSearchChange={setParam("q")}
            onCategoryChange={setParam("kategori")}
            onTagChange={setParam("tag")}
            onSortChange={setParam("urutan")}
            onReset={resetFilters}
          />
        </Reveal>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Reveal as="main" className="min-w-0">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl bg-white p-3 shadow-soft"><Skeleton className="h-[250px] w-full bg-cream-deep" rounded="rounded-xl" /><div className="mt-4 space-y-3"><Skeleton className="h-3 w-1/3 bg-cream-deep" /><Skeleton className="h-5 w-full bg-cream-deep" /><Skeleton className="h-4 w-4/5 bg-cream-deep" /></div></div>)}
              </div>
            ) : isError ? (
              <p className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-10 text-center text-sm text-danger">Gagal memuat artikel. Coba muat ulang halaman.</p>
            ) : rows.length === 0 ? (
              <EmptyState categories={popularCategories} onCategoryChange={setParam("kategori")} onReset={resetFilters} />
            ) : (
              <div className="grid items-stretch gap-6 sm:grid-cols-2">
                {rows.map((post) => <PostCardV2 key={post.id} post={post} highlightQuery={search} />)}
              </div>
            )}

            {data && Number(data.meta?.total ?? 0) > 9 && data.meta.totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} label="Paginasi artikel" />
              </div>
            )}
          </Reveal>
          <Reveal as="div" delay={120}><BlogSidebar categories={popularCategories} tags={tags ?? []} activeTag={tag} onTagChange={setParam("tag")} /></Reveal>
        </div>
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

  const preparedContent = useMemo(() => prepareArticleContent(post?.content), [post?.content]);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const authorName = post?.author?.name ?? "Jaya Abadi";

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
      <ReadingProgress />
      <Seo
        path={`/artikel/${slug}`}
        title={post.title}
        description={post.excerpt}
        type="article"
        image={img(post.coverImage) || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage ? [img(post.coverImage)] : undefined,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: { "@type": "Person", name: authorName },
          publisher: { "@type": "Organization", name: "Jaya Abadi" },
          keywords: (post.tags ?? []).map((tag) => tag.name).join(", "),
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }}
      />
      <Container className="max-w-6xl pt-12">
        <header className="max-w-4xl">
          {post.category?.name && <Link to={`/artikel?kategori=${post.category.slug}`} className="text-xs font-bold uppercase tracking-[0.16em] text-brand hover:underline">{post.category.name}</Link>}
          <h1 className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-ink sm:text-5xl">{post.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-4">
            <div className="flex items-center gap-2.5">
              {post.author?.photo ? <img src={img(post.author.photo)} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{initials(authorName)}</span>}
              <div><p className="text-sm font-bold text-ink">{authorName}</p><p className="text-xs text-ink-light">{post.author?.position || "Jaya Abadi"}</p></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-light">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Terbit {fmt(post.publishedAt)}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Diperbarui {fmt(post.updatedAt || post.publishedAt)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {post.readTime || 1} mnt baca</span>
              <span className="inline-flex items-center gap-1.5"><Eye size={14} /> {post.viewCount ?? 0} dilihat</span>
            </div>
          </div>
        </header>

        <div className="mt-8 overflow-hidden rounded-3xl bg-cream-deep shadow-soft-lg">
          {post.coverImage && <img src={img(post.coverImage)} alt={post.title} className="aspect-[16/7] w-full object-cover" />}
        </div>
        <div className="mt-6"><ShareButtons url={url} title={post.title} copied={copied} onCopy={copyLink} /></div>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <main className="min-w-0">
            <article className="prose-jaya text-[1rem] sm:text-[1.05rem]" dangerouslySetInnerHTML={{ __html: preparedContent.html }} />
            {(post.tags ?? []).length > 0 && <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5" aria-label="Tag artikel"><span className="mr-1 text-xs font-bold text-ink-light">Tag:</span>{post.tags.map((tag) => <Link key={tag.id ?? tag.slug} to={`/artikel?tag=${tag.slug}`} className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-brand-soft hover:text-brand">#{tag.name}</Link>)}</div>}
            <AuthorBox author={post.author} />
            <ArticleNavigation previous={post.previous} next={post.next} />
            <ArticleNewsletter />
          </main>
          <ArticleToc headings={preparedContent.headings} />
        </div>
      </Container>

      <div className="mt-14"><RelatedCarousel posts={post.related ?? []} /></div>
    </>
  );
}
