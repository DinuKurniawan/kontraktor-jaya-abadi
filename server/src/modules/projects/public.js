// Endpoint publik projects (tanpa login) — hanya isPublished
import prisma from "../../config/prisma.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const SELECT = {
  id: true, title: true, slug: true, summary: true, location: true, year: true,
  status: true, coverImage: true, isFeatured: true, value: true, serviceId: true,
  category: { select: { id: true, name: true, slug: true } },
};

// GET /api/public/projects?page=&limit=&search=&category=<slug>&status=<PLANNING|ONGOING|COMPLETED>&featured=true
export async function listPublishedProjects(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title", "summary", "location"], defaultLimit: 8 });
  where.isPublished = true;
  if (query.featured === "true") where.isFeatured = true;
  if (query.status) where.status = query.status;
  if (query.category) where.category = { slug: query.category };
  if (query.service) where.service = { slug: query.service };
  if (query.exclude) where.slug = { not: query.exclude };

  const [rows, total] = await prisma.$transaction([
    prisma.project.findMany({ where, select: SELECT, orderBy: [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }], skip, take: limit }),
    prisma.project.count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// GET /api/public/projects/:slug
export async function getPublishedProject(slug) {
  const project = await prisma.project.findFirst({
    where: { slug, isPublished: true },
    select: {
      ...SELECT,
      description: true,
      clientName: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, caption: true } },
      categoryId: true,
    },
  });
  if (!project) return null;

  // Proyek serupa: kategori sama, selain proyek ini, maks 3
  const related = await prisma.project.findMany({
    where: { isPublished: true, id: { not: project.id }, ...(project.categoryId ? { categoryId: project.categoryId } : {}) },
    select: SELECT,
    take: 3,
    orderBy: [{ isFeatured: "desc" }, { year: "desc" }],
  });
  const { categoryId, ...rest } = project;
  return { ...rest, related };
}
