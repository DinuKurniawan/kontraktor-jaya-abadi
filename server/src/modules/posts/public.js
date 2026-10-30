// Endpoint publik posts (tanpa login) — hanya terbit & publishedAt <= sekarang
import prisma from "../../config/prisma.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const SELECT = {
  id: true, title: true, slug: true, excerpt: true, coverImage: true, readTime: true, publishedAt: true,
  author: { select: { name: true } },
  category: { select: { id: true, name: true, slug: true } },
};

// GET /api/public/posts?page=&limit=&search=&category=<slug>
export async function listPublishedPosts(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title", "excerpt"], defaultLimit: 9 });
  where.isPublished = true;
  where.publishedAt = { lte: new Date() };
  if (query.category) where.category = { slug: query.category };

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({ where, select: SELECT, orderBy: { publishedAt: "desc" }, skip, take: limit }),
    prisma.post.count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// GET /api/public/posts/:slug
export async function getPublishedPost(slug) {
  const post = await prisma.post.findFirst({
    where: { slug, isPublished: true, publishedAt: { lte: new Date() } },
    select: { ...SELECT, content: true, categoryId: true },
  });
  if (!post) return null;

  // Artikel terkait: kategori sama, maks 3
  const related = await prisma.post.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() }, id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
    select: SELECT,
    take: 3,
    orderBy: { publishedAt: "desc" },
  });
  const { categoryId, ...rest } = post;
  return { ...rest, related };
}
