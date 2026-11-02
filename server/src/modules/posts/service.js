// Logika bisnis posts
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { slugifyUnique } from "../../utils/slugify.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

const INCLUDE = {
  author: { select: { id: true, name: true, position: true, photo: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

// Estimasi waktu baca: 200 kata per menit, minimum 1
function computeReadTime(content) {
  const plain = String(content).replace(/<[^>]*>/g, " "); // buang tag HTML
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Daftar artikel (admin): search judul + filter status & kategori
export async function listPosts(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["title"] });
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status === "DRAFT") where.isPublished = false;
  if (query.status === "PUBLISHED") where.isPublished = true;

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({ where, include: INCLUDE, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.post.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getPost(id) {
  const post = await prisma.post.findUnique({ where: { id }, include: INCLUDE });
  if (!post) throw new ApiError(404, "Artikel tidak ditemukan");
  return post;
}

// Buat artikel — penulis = user login; readTime otomatis
export async function createPost({ authorId, tagIds, ...payload }) {
  const slug = await slugifyUnique({ model: "post", text: payload.title });
  const isPublished = payload.isPublished === true;
  const publishedAt = isPublished ? (payload.publishedAt ?? new Date()) : null;
  return prisma.post.create({
    data: {
      ...payload,
      slug,
      readTime: computeReadTime(payload.content),
      authorId,
      publishedAt,
      ...(tagIds ? { tags: { create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) } } : {}),
    },
    include: INCLUDE,
  });
}

export async function updatePost(id, { tagIds, ...payload }) {
  const current = await getPost(id);

  const data = { ...payload };
  if (payload.title) data.slug = await slugifyUnique({ model: "post", text: payload.title, excludeId: id });
  if (payload.content !== undefined) data.readTime = computeReadTime(payload.content);

  // Baru terbit → catat tanggal terbit pertama
  const willPublish = payload.isPublished ?? current.isPublished;
  if (payload.isPublished === false && payload.publishedAt === undefined) data.publishedAt = null;
  if (willPublish && payload.publishedAt === null) data.publishedAt = new Date();
  if (willPublish && !current.publishedAt && payload.publishedAt === undefined) data.publishedAt = new Date();

  const post = await prisma.post.update({ where: { id }, data, include: INCLUDE });
  if (tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } });
    if (tagIds.length) {
      await prisma.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: id, tagId })), skipDuplicates: true });
    }
  }
  return post;
}

// Toggle draft/terbit (dipakai switch di daftar)
export async function togglePublish(id) {
  const current = await getPost(id);
  const data = { isPublished: !current.isPublished };
  if (data.isPublished && !current.publishedAt) data.publishedAt = new Date();
  return prisma.post.update({ where: { id }, data, include: INCLUDE });
}

// Aksi massal daftar artikel: terbitkan, jadikan draft, unggulan, atau hapus.
export async function bulkAction(ids, action) {
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) throw new ApiError(400, "Pilih minimal satu artikel");

  if (action === "DELETE") {
    const result = await prisma.post.deleteMany({ where: { id: { in: uniqueIds } } });
    return { action, count: result.count };
  }

  if (action === "PUBLISH") {
    const posts = await prisma.post.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, publishedAt: true } });
    const now = new Date();
    await prisma.$transaction(posts.map((post) => prisma.post.update({
      where: { id: post.id },
      data: { isPublished: true, publishedAt: post.publishedAt ?? now },
    })));
    return { action, count: posts.length };
  }

  const dataByAction = {
    DRAFT: { isPublished: false },
    FEATURE: { isFeatured: true },
    UNFEATURE: { isFeatured: false },
  };
  const data = dataByAction[action];
  if (!data) throw new ApiError(400, "Aksi massal tidak valid");
  const result = await prisma.post.updateMany({ where: { id: { in: uniqueIds } }, data });
  return { action, count: result.count };
}

export async function deletePost(id) {
  await getPost(id);
  await prisma.post.delete({ where: { id } });
  return { message: "Artikel berhasil dihapus" };
}
