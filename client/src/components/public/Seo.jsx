// SEO per halaman — title, description, canonical, Open Graph (react-helmet-async)
import { Helmet } from "react-helmet-async";

const SITE = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
const SITE_NAME = "Jaya Abadi — Kontraktor";
const DEFAULT_DESC = "Jasa konstruksi, renovasi, dan desain bangunan — rapi, tepat waktu, RAB transparan.";
const DEFAULT_IMAGE = `${SITE}/og-default.png`;

export default function Seo({ title, description, path = "/", image, type = "website", noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESC;
  const canonical = `${SITE}${path === "/" ? "" : path}`;
  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <html lang="id" />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
