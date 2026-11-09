// Endpoint publik posts (tanpa login) — hanya artikel terbit & publishedAt <= sekarang
import prisma from "../../config/prisma.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";
import { sanitizeHtml } from "../../utils/sanitize-html.js";

const publishedWhere = () => ({ isPublished: true, publishedAt: { lte: new Date() } });

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  readTime: true,
  isFeatured: true,
  viewCount: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: { name: true, position: true, photo: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

const DETAIL_SELECT = {
  ...POST_SELECT,
  content: true,
  metaTitle: true,
  metaDescription: true,
  categoryId: true,
};

const ORDER = {
  terbaru: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  terpopuler: [{ viewCount: "desc" }, { publishedAt: "desc" }],
  terlama: [{ publishedAt: "asc" }, { createdAt: "asc" }],
};

function normalizePost(post) {
  if (!post) return post;
  const { tags, ...rest } = post;
  return { ...rest, tags: (tags ?? []).map(({ tag }) => tag) };
}

function searchWhere(search) {
  const value = String(search ?? "").trim().slice(0, 120);
  if (!value) return {};
  return {
    OR: ["title", "excerpt", "content"].map((field) => ({
      [field]: { contains: value, mode: "insensitive" },
    })),
  };
}

function tagWhere(tag) {
  return tag ? { tags: { some: { tag: { slug: tag } } } } : {};
}

function publicLimit(value, fallback = 6) {
  return Math.min(50, Math.max(1, Number.parseInt(value, 10) || fallback));
}

// GET /api/public/posts?page=&limit=9&search=&category=<slug>&tag=<slug>&sort=terbaru|terpopuler|terlama
export async function listPublishedPosts(query = {}) {
  const { page, limit, skip, where } = paginate(query, {
    searchFields: [],
    defaultLimit: 9,
  });
  const search = String(query.search ?? "").trim().slice(0, 120);
  const category = String(query.category ?? "").trim().slice(0, 120);
  const tag = String(query.tag ?? "").trim().slice(0, 120);
  Object.assign(where, publishedWhere(), searchWhere(search), tagWhere(tag));
  if (category) where.category = { slug: category };

  // Facet kategori mengikuti pencarian/tag aktif, tetapi tidak dikunci oleh kategori
  // agar pilihan kategori lain tetap dapat ditampilkan di filter publik.
  const facetWhere = { ...publishedWhere(), ...searchWhere(search), ...tagWhere(tag) };
  const [rows, total, categoryGroups] = await prisma.$transaction([
    prisma.post.findMany({ where, select: POST_SELECT, orderBy: ORDER[query.sort] ?? ORDER.terbaru, skip, take: limit }),
    prisma.post.count({ where }),
    prisma.post.groupBy({ by: ["categoryId"], where: facetWhere, _count: { _all: true } }),
  ]);

  const categoryIds = categoryGroups.map((item) => item.categoryId).filter(Boolean);
  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category]));

  return {
    data: rows.map(normalizePost),
    meta: paginationMeta(total, page, limit),
    facets: {
      categories: categoryGroups
        .map((item) => ({
          ...(categoryMap[item.categoryId] ?? { id: item.categoryId, name: "Lainnya", slug: null }),
          count: item._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

// GET /api/public/posts/featured — artikel unggulan terbaru
export async function listFeaturedPosts(query = {}) {
  const rows = await prisma.post.findMany({
    where: { ...publishedWhere(), isFeatured: true },
    select: POST_SELECT,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: publicLimit(query.limit, 3),
  });
  return rows.map(normalizePost);
}

// GET /api/public/posts/popular — artikel dengan viewCount tertinggi
export async function listPopularPosts(query = {}) {
  const rows = await prisma.post.findMany({
    where: publishedWhere(),
    select: POST_SELECT,
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: publicLimit(query.limit),
  });
  return rows.map(normalizePost);
}

// GET /api/public/tags — tag yang dipakai artikel terbit
export async function listPublicTags() {
  const tags = await prisma.tag.findMany({
    where: { posts: { some: { post: publishedWhere() } } },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { posts: { where: { post: publishedWhere() } } } },
    },
    orderBy: { name: "asc" },
  });
  return tags.map(({ _count, ...tag }) => ({ ...tag, count: _count.posts }));
}

// GET /api/public/posts/:slug — detail + penulis + tag + terkait + sebelumnya/berikutnya
export async function getPublishedPost(slug) {
  const post = await prisma.post.findFirst({
    where: { slug, ...publishedWhere() },
    select: DETAIL_SELECT,
  });
  if (!post) return null;

  await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
  post.viewCount += 1;

  const relatedMatches = [
    ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
    ...post.tags.map(({ tag }) => ({ tags: { some: { tagId: tag.id } } })),
  ];
  const relatedWhere = {
    ...publishedWhere(),
    id: { not: post.id },
    // Tanpa kategori maupun tag, jangan mengembalikan artikel yang tidak terkait.
    OR: relatedMatches.length ? relatedMatches : [{ id: "__no_related_post__" }],
  };

  const [relatedRows, siblings] = await prisma.$transaction([
    prisma.post.findMany({
      where: relatedWhere,
      select: POST_SELECT,
      take: 3,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.post.findMany({
      where: publishedWhere(),
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, slug: true, title: true, coverImage: true, publishedAt: true },
    }),
  ]);

  const index = siblings.findIndex((item) => item.id === post.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  const { categoryId, ...detail } = post;

  return {
    ...normalizePost(detail),
    content: sanitizeHtml(detail.content),
    related: relatedRows.map(normalizePost),
    previous,
    next,
  };
}
