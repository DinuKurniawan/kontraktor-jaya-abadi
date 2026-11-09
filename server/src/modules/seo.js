// sitemap.xml, robots.txt & rss.xml digenerate dari data publik (proyek, artikel, layanan)
import prisma from "../config/prisma.js";

const SITE = process.env.SITE_URL || "http://localhost:5173";

const escapeXml = (s) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// GET /sitemap.xml — halaman statis + URL dinamis terbit
export async function sitemap(_req, res) {
  const [projects, posts, services] = await Promise.all([
    prisma.project.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ where: { isPublished: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages = ["", "/tentang", "/layanan", "/proyek", "/artikel", "/kontak"];
  const urls = [
    ...staticPages.map((p) => ({ loc: `${SITE}${p}`, lastmod: new Date() })),
    ...projects.map((r) => ({ loc: `${SITE}/proyek/${r.slug}`, lastmod: r.updatedAt })),
    ...posts.map((r) => ({ loc: `${SITE}/artikel/${r.slug}`, lastmod: r.updatedAt })),
    ...services.map((r) => ({ loc: `${SITE}/layanan/${r.slug}`, lastmod: r.updatedAt })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod.toISOString()}</lastmod></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
}

// GET /rss.xml — Feed RSS 2.0 artikel terbit untuk pembaca feed dan agentic crawlers
export async function rss(_req, res) {
  const posts = await prisma.post.findMany({
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

// GET /robots.txt — izinkan semua, kecuali admin & API; tunjuk sitemap
export async function robots(_req, res) {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE}/sitemap.xml\n`
  );
}
