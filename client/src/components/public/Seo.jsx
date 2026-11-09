// SEO per halaman — title, description, canonical, Open Graph (react-helmet-async)
import { Helmet } from "react-helmet-async";

const SITE = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const SITE_NAME = "Jaya Abadi — Kontraktor";
const DEFAULT_DESC = "Jasa konstruksi, renovasi, dan desain bangunan — rapi, tepat waktu, RAB transparan.";
const DEFAULT_IMAGE = `${SITE}/hero-default.webp`;

export default function Seo({ title, description, path = "/", image, type = "website", noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESC;
  const canonical = new URL(path, `${SITE}/`).href;
  const articleMeta = type === "article" ? { "article:published_time": jsonLd?.datePublished, "article:modified_time": jsonLd?.dateModified, "article:author": jsonLd?.author?.name, "article:section": jsonLd?.articleSection, "article:tag": jsonLd?.keywords } : null;
  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <html lang="id" />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      {articleMeta && Object.entries(articleMeta).map(([property, content]) => content ? <meta key={property} property={property} content={String(content)} /> : null)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
