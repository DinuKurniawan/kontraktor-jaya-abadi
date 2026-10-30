// sitemap.xml & robots.txt digenerate dari data publik (proyek, artikel, layanan)
import prisma from "../config/prisma.js";

const SITE = process.env.SITE_URL || "http://localhost:5173";

const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

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

// GET /robots.txt — izinkan semua, kecuali admin & API; tunjuk sitemap
export async function robots(_req, res) {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE}/sitemap.xml\n`
  );
}
