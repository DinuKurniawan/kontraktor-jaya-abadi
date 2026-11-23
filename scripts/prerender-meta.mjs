// Tulis ulang <head> tiap route publik di dist/ agar crawler & AI agent yang
// tidak menjalankan JS tetap mendapat title, description, canonical, OG, dan
// robots. Body tetap SPA shell; tidak butuh browser saat build.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(repoRoot, "client/dist");
const SITE = (process.env.VITE_SITE_URL || "https://jaya.codeunchs.my.id").replace(/\/$/, "");
const SITE_NAME = "Jaya Abadi — Kontraktor";
const DEFAULT_IMAGE = `${SITE}/hero-default.webp`;

const routes = [
  {
    path: "/",
    file: "index.html",
    title: "Kontraktor Bangunan & Renovasi",
    description: "Jasa konstruksi rumah, gedung & renovasi - RAB transparan, tepat waktu, garansi pekerjaan.",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Jaya Abadi", url: SITE, logo: `${SITE}/favicon.svg` },
        { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "Jaya Abadi", inLanguage: "id-ID" },
      ],
    },
  },
  {
    path: "/tentang",
    title: "Tentang Kami",
    description: "Profil, visi misi, sejarah, tim, legalitas, dan galeri Jaya Abadi - kontraktor terpercaya sejak 2006.",
  },
  {
    path: "/layanan",
    title: "Layanan",
    description: "Solusi konstruksi lengkap - dari desain hingga serah terima kunci.",
  },
  {
    path: "/proyek",
    title: "Portofolio Proyek Konstruksi & Renovasi",
    description: "Daftar portofolio proyek konstruksi rumah tinggal, gedung komersial, dan renovasi bangunan terpercaya oleh Jaya Abadi.",
  },
  {
    path: "/artikel",
    title: "Artikel & Wawasan Konstruksi",
    description: "Tips membangun rumah, panduan membaca RAB, regulasi PBG/SLF, dan wawasan konstruksi dari tim Jaya Abadi.",
  },
  {
    path: "/kontak",
    title: "Kontak Jaya Abadi",
    description: "Hubungi Jaya Abadi untuk konsultasi konstruksi, renovasi, interior, dan pengawasan proyek di Jabodetabek.",
  },
  {
    path: "/404",
    title: "Halaman tidak ditemukan",
    description: "Halaman yang Anda cari tidak tersedia.",
    noindex: true,
  },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const base = await readFile(resolve(dist, "index.html"), "utf8");
const baseHead = base.slice(0, base.indexOf("</head>"));

for (const route of routes) {
  const fullTitle = `${route.title} — ${SITE_NAME}`;
  const canonical = `${SITE}${route.path === "/" ? "/" : route.path}`;
  const tags = [
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta name="robots" content="${route.noindex ? "noindex, nofollow" : "index, follow"}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(DEFAULT_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${esc(DEFAULT_IMAGE)}" />`,
  ];
  if (route.jsonLd) tags.push(`<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`);

  const head = `${baseHead.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)}\n    ${tags.join("\n    ")}\n  </head>`;
  const html = `${head}${base.slice(base.indexOf("</head>") + "</head>".length)}`;

  const target = route.path === "/" ? resolve(dist, "index.html") : resolve(dist, route.path.slice(1), "index.html");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
  console.log(`prerender-meta ${route.path}`);
}
