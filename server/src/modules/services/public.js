// Endpoint publik services (tanpa login)
import prisma from "../../config/prisma.js";

// List: jumlah proyek terbit, harga mulai, scope ringkas (maks 4)
export async function listPublishedServices({ category, search } = {}) {
  const where = { isPublished: true };
  if (category) where.category = { slug: category, isPublished: true };
  if (search?.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { shortDesc: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  const rows = await prisma.service.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, title: true, slug: true, shortDesc: true, description: true,
      icon: true, image: true, heroImage: true, startingPrice: true, isFeatured: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { projects: { where: { isPublished: true } } } },
      scopes: { orderBy: { sortOrder: "asc" }, take: 4, select: { id: true, title: true, icon: true } },
    },
  });
  return rows.map(({ _count, scopes, ...s }) => ({ ...s, projectCount: _count.projects, scopes }));
}

// Detail lengkap: scopes, packages, faqs, processSteps, projects (maks 6),
// testimonials terkait + layanan sebelum/berikutnya (untuk navigasi)
export async function getPublishedService(slug) {
  const service = await prisma.service.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true, title: true, slug: true, shortDesc: true, description: true,
      icon: true, image: true, heroImage: true, longDescription: true,
      startingPrice: true, brochureUrl: true, metaTitle: true, metaDescription: true, isFeatured: true,
      sortOrder: true, createdAt: true,
      scopes: { orderBy: { sortOrder: "asc" } },
      packages: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } },
      faqs: { where: { isPublished: true }, orderBy: { sortOrder: "asc" }, take: 10 },
      processSteps: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } },
      projects: {
        where: { isPublished: true },
        orderBy: { year: "desc" },
        take: 6,
        select: { id: true, title: true, slug: true, summary: true, coverImage: true, location: true, year: true },
      },
      testimonials: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, position: true, company: true, content: true, rating: true, avatar: true },
      },
    },
  });
  if (!service) return null;

  // ponytail: prev/next via 2x findFirst, bukan findMany semua layanan.
  const navWhere = { isPublished: true, slug: { not: slug } };
  const [prev, next] = await Promise.all([
    prisma.service.findFirst({
      where: {
        ...navWhere,
        OR: [
          { sortOrder: { lt: service.sortOrder } },
          { sortOrder: service.sortOrder, createdAt: { lt: service.createdAt } },
        ],
      },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      select: { title: true, slug: true },
    }),
    prisma.service.findFirst({
      where: {
        ...navWhere,
        OR: [
          { sortOrder: { gt: service.sortOrder } },
          { sortOrder: service.sortOrder, createdAt: { gt: service.createdAt } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { title: true, slug: true },
    }),
  ]);

  // ponytail: strip internal nav fields from response
  const { sortOrder: _so, createdAt: _ca, ...detail } = service;
  return { ...detail, prev: prev ?? null, next: next ?? null };
}
