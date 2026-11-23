// sitemap.xml, robots.txt & rss.xml digenerate dari data publik (proyek, artikel, layanan)
import prisma from "../config/prisma.js";

const SITE = process.env.SITE_URL || "https://jaya.codeunchs.my.id";
const STATIC_PAGES = ["", "/tentang", "/layanan", "/proyek", "/artikel", "/kontak"];
const CACHE_TTL = 24 * 60 * 60 * 1000;
let lastSitemap = null;

const escapeXml = (s) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

const sitemapXml = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod.toISOString()}</lastmod></url>`).join("\n")}
</urlset>`;

// GET /sitemap.xml — halaman statis + URL dinamis terbit.
// Bila DB gagal, sajikan cache terakhir atau halaman statis agar crawler tetap
// punya jalur discovery dan robots.txt tidak menunjuk ke 500.
export async function sitemap(_req, res) {
  res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  try {
    const [projects, posts, services] = await Promise.all([
      prisma.project.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
      prisma.post.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
      prisma.service.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);

    const urls = [
      ...STATIC_PAGES.map((p) => ({ loc: `${SITE}${p}`, lastmod: new Date() })),
      ...projects.map((r) => ({ loc: `${SITE}/proyek/${r.slug}`, lastmod: r.updatedAt })),
      ...posts.map((r) => ({ loc: `${SITE}/artikel/${r.slug}`, lastmod: r.updatedAt })),
      ...services.map((r) => ({ loc: `${SITE}/layanan/${r.slug}`, lastmod: r.updatedAt })),
    ];

    const xml = sitemapXml(urls);
    lastSitemap = { xml, at: Date.now() };
    return res.type("application/xml").send(xml);
  } catch (err) {
    console.error("[seo] sitemap gagal, pakai fallback", { code: err?.code, message: err?.message });
    const xml = lastSitemap && Date.now() - lastSitemap.at < CACHE_TTL
      ? lastSitemap.xml
      : sitemapXml(STATIC_PAGES.map((p) => ({ loc: `${SITE}${p}`, lastmod: new Date() })));
    return res.type("application/xml").send(xml);
  }
}

// GET /rss.xml — Feed RSS 2.0 artikel terbit untuk pembaca feed dan agentic crawlers.
// Bila DB gagal, kirim channel valid (kosong / cache terakhir) alih-alih 500.
export async function rss(_req, res) {
  res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  let posts = [];
  try {
    posts = await prisma.post.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
  } catch (err) {
    console.error("[seo] rss gagal, kirim feed kosong", { code: err?.code, message: err?.message });
  }

  const items = posts.map((post) => {
    const link = `${SITE}/artikel/${post.slug}`;
    const pubDate = (post.publishedAt || new Date()).toUTCString();
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ""}
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jaya Abadi — Artikel &amp; Wawasan Konstruksi</title>
    <link>${SITE}/artikel</link>
    <description>Tips, panduan RAB, regulasi bangunan, dan wawasan konstruksi dari Jaya Abadi.</description>
    <language>id-ID</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
  res.type("application/xml").send(xml);
}

// GET /robots.txt — izinkan semua, kecuali admin & API internal; izinkan API publik & ard
export async function robots(_req, res) {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nAllow: /api/public/\nAllow: /.well-known/\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE}/sitemap.xml\n`
  );
}
