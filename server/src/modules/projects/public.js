// Endpoint publik projects (tanpa login) — hanya isPublished
import prisma from "../../config/prisma.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const SELECT = {
  id: true, title: true, slug: true, summary: true, location: true, year: true,
  status: true, coverImage: true, isFeatured: true, value: true, serviceId: true,
  area: true, durationMonths: true, floors: true, architect: true, viewCount: true,
  latitude: true, longitude: true, tags: true,
  category: { select: { id: true, name: true, slug: true } },
  service: { select: { id: true, title: true, slug: true } },
};

const ORDER = {
  terlama: [{ year: "asc" }, { createdAt: "asc" }],
  "judul-az": [{ title: "asc" }],
  terpopuler: [{ viewCount: "desc" }, { isFeatured: "desc" }, { year: "desc" }],
};
const defaultOrder = [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }];

// Facet seluruh proyek terbit — sama tiap request selama admin tidak mengubah data.
// ponytail: cache memori 60s; admin edit muncul paling lambat 1 menit.
const FACET_TTL_MS = 60_000;
let facetCache = { at: 0, facets: null };

async function loadFacets() {
  if (facetCache.facets && Date.now() - facetCache.at < FACET_TTL_MS) return facetCache.facets;

  const [byCategory, byStatus, years] = await Promise.all([
    prisma.project.groupBy({
      by: ["categoryId"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.project.findMany({
      where: { isPublished: true },
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
  ]);

  // Nama kategori untuk facet
  const catIds = byCategory.map((c) => c.categoryId).filter(Boolean);
  const cats = catIds.length ? await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true, slug: true } }) : [];
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

  const facets = {
    categories: [
      ...byCategory.map((c) => ({ ...(catMap[c.categoryId] ?? { id: c.categoryId, name: "Lainnya", slug: null }), count: c._count._all })),
    ].sort((a, b) => b.count - a.count),
    statuses: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    years: years.map((y) => y.year),
  };
  facetCache = { at: Date.now(), facets };
  return facets;
}

// GET /api/public/projects?page=&limit=12&search=&category=<slug>&status=&service=<slug>
//   &year=2024&sort=terbaru|terlama|judul-az|terpopuler&featured=true&exclude=<slug>
export async function listPublishedProjects(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title", "summary", "location"], defaultLimit: 12 });
  where.isPublished = true;
  if (query.featured === "true") where.isFeatured = true;
  if (query.status) where.status = query.status;
  if (query.category) where.category = { slug: query.category };
  if (query.service) where.service = { slug: query.service };
  if (query.year) where.year = Number(query.year);
  if (query.exclude) where.slug = { not: query.exclude };

  const orderBy = ORDER[query.sort] ?? defaultOrder;

  // Optimasi featured strip: tidak butuh kalkulasi facets 5-tabel.
  if (query.featured === "true") {
    const [rows, total] = await Promise.all([
      prisma.project.findMany({ where, select: SELECT, orderBy, skip, take: limit }),
      prisma.project.count({ where }),
    ]);
    return {
      data: rows,
      meta: paginationMeta(total, page, limit),
      facets: { categories: [], statuses: [], years: [] },
    };
  }

  const [[rows, total], facets] = await Promise.all([
    Promise.all([
      prisma.project.findMany({ where, select: SELECT, orderBy, skip, take: limit }),
      prisma.project.count({ where }),
    ]),
    loadFacets(),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit), facets };
}

// GET /api/public/projects/stats — ringkasan statistik
// ponytail: 5 query jadi 2 — satu count+aggregate gabungan, satu distinct location.
export async function getPublicProjectStats() {
  const [agg, locations] = await Promise.all([
    prisma.project.aggregate({
      where: { isPublished: true },
      _count: { _all: true },
      _sum: { area: true },
    }),
    prisma.project.findMany({ where: { isPublished: true }, distinct: ["location"], select: { location: true } }),
  ]);
  // Status counts tetap murah pakai facet cache yang sudah ada.
  const facets = await loadFacets();
  const statusMap = Object.fromEntries(facets.statuses.map((s) => [s.status, s.count]));
  return {
    total: agg._count._all,
    completed: statusMap.COMPLETED ?? 0,
    ongoing: statusMap.ONGOING ?? 0,
    totalArea: agg._sum.area ?? 0,
    cities: locations.map((l) => l.location).filter(Boolean).length,
  };
}

// GET /api/public/projects/map — titik koordinat untuk peta (menerima filter yang sama)
export async function getPublicProjectMap(query = {}) {
  const where = { isPublished: true, latitude: { not: null }, longitude: { not: null } };
  if (query.status) where.status = query.status;
  if (query.category) where.category = { slug: query.category };
  if (query.service) where.service = { slug: query.service };
  if (query.year) where.year = Number(query.year);
  if (query.search) {
    where.OR = ["title", "summary", "location"].map((field) => ({
      [field]: { contains: query.search, mode: "insensitive" },
    }));
  }

  const rows = await prisma.project.findMany({
    where,
    select: {
      id: true, title: true, slug: true, location: true, latitude: true, longitude: true,
      coverImage: true, status: true, year: true, area: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { year: "desc" },
    // ponytail: hard cap marker peta; naikkan atau pakai clustering kalau pin mulai padat.
    take: 500,
  });
  return rows;
}

// GET /api/public/projects/:slug — detail + galeri + serupa + prev/next (+ viewCount)
export async function getPublishedProject(slug) {
  const project = await prisma.project.findFirst({
    where: { slug, isPublished: true },
    select: {
      ...SELECT,
      description: true, clientName: true,
      startDate: true, endDate: true, videoUrl: true,
      challenge: true, solution: true, result: true, highlights: true,
      metaTitle: true, metaDescription: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, caption: true } },
      categoryId: true,
      // dipakai untuk urutan prev/next (year + createdAt)
      createdAt: true,
    },
  });
  if (!project) return null;

  // viewCount bertambah (fire-and-forget, bukan bagian respons kritis)
  prisma.project.update({ where: { id: project.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Ambil tetangga langsung; jangan memuat seluruh daftar proyek.
  // ponytail: prev/next diparalelkan bersama related agar satu round-trip.
  const [related, prev, next] = await Promise.all([
    prisma.project.findMany({
      where: {
        isPublished: true,
        id: { not: project.id },
        ...(relatedMatch.length ? { OR: relatedMatch } : {}),
      },
      select: SELECT,
      take: 3,
      orderBy: defaultOrder,
    }),
    prisma.project.findFirst({
      where: { isPublished: true, OR: [{ year: { gt: project.year } }, { year: project.year, createdAt: { gt: project.createdAt } }] },
      orderBy: defaultOrder,
      select: { id: true, slug: true, title: true },
    }),
    prisma.project.findFirst({
      where: { isPublished: true, OR: [{ year: { lt: project.year } }, { year: project.year, createdAt: { lt: project.createdAt } }] },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      select: { id: true, slug: true, title: true },
    }),
  ]);

  const { categoryId, ...rest } = project;
  return {
    ...rest,
    related,
    prev: prev?.slug ? prev : null,
    next: next?.slug ? next : null,
  };
}
