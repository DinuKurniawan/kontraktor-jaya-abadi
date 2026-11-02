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
  const [rows, total, byCategory, byStatus, years] = await prisma.$transaction([
    prisma.project.findMany({ where, select: SELECT, orderBy, skip, take: limit }),
    prisma.project.count({ where }),
    // Facets (di seluruh proyek terbit, tanpa filter kategori agar angka stabil)
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
  return { data: rows, meta: paginationMeta(total, page, limit), facets };
}

// GET /api/public/projects/stats — ringkasan statistik
export async function getPublicProjectStats() {
  const [total, completed, ongoing, areaAgg, locations] = await prisma.$transaction([
    prisma.project.count({ where: { isPublished: true } }),
    prisma.project.count({ where: { isPublished: true, status: "COMPLETED" } }),
    prisma.project.count({ where: { isPublished: true, status: "ONGOING" } }),
    prisma.project.aggregate({ where: { isPublished: true }, _sum: { area: true } }),
    prisma.project.findMany({ where: { isPublished: true }, distinct: ["location"], select: { location: true } }),
  ]);
  return {
    total,
    completed,
    ongoing,
    totalArea: areaAgg._sum.area ?? 0,
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
    },
  });
  if (!project) return null;

  // viewCount bertambah (fire-and-forget, bukan bagian respons kritis)
  prisma.project.update({ where: { id: project.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Proyek serupa: kategori atau layanan sama, selain proyek ini, maks 3
  const relatedMatch = [
    ...(project.categoryId ? [{ categoryId: project.categoryId }] : []),
    ...(project.serviceId ? [{ serviceId: project.serviceId }] : []),
  ];
  const related = await prisma.project.findMany({
    where: {
      isPublished: true,
      id: { not: project.id },
      ...(relatedMatch.length ? { OR: relatedMatch } : {}),
    },
    select: SELECT,
    take: 3,
    orderBy: defaultOrder,
  });

  // Sebelumnya/berikutnya menurut urutan tampil (featured, year desc, createdAt desc)
  const siblings = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: defaultOrder,
    select: { id: true, slug: true, title: true },
  });
  const i = siblings.findIndex((p) => p.id === project.id);
  const prev = i > 0 ? siblings[i - 1] : null;
  const next = i < siblings.length - 1 ? siblings[i + 1] : null;

  const { categoryId, ...rest } = project;
  return {
    ...rest,
    related,
    prev: prev?.slug ? prev : null,
    next: next?.slug ? next : null,
  };
}
