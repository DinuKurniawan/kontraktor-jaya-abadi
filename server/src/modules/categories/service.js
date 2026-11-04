// Logika bisnis categories
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { slugifyUnique } from "../../utils/slugify.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

// Daftar kategori (admin): paginasi + search nama + filter type
export async function listCategories(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name"] });
  // where.OR (hasil search) digabung dengan filter tambahan
  if (query.type) where.type = query.type;

  const [rows, total] = await prisma.$transaction([
    prisma.category.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.category.count({ where }),
  ]);

  return { data: rows, meta: paginationMeta(total, page, limit) };
}

// Daftar kategori (publik): tanpa paginasi, filter type opsional → filter diterapkan
// Untuk type POST, sertakan jumlah artikel terbit; untuk PROJECT, jumlah proyek.
export async function listPublicCategories(type) {
  const where = {};
  if (type) where.type = type;

  const include = { _count: { select: { projects: true } } };

  // Jika type POST atau tanpa filter, hitung juga jumlah artikel terbit
  if (!type || type === "POST") {
    include._count.select.posts = {
      where: { isPublished: true, publishedAt: { lte: new Date() } },
    };
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include,
  });

  return categories.map((category) => ({
    ...category,
    // Gunakan posts count jika tersedia, fallback ke 0
    _count: {
      ...category._count,
      posts: category._count?.posts ?? 0,
    },
  }));
}

// Detail kategori
export async function getCategory(id) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "Kategori tidak ditemukan");
  return category;
}

// Buat kategori — slug otomatis & unik dari nama
export async function createCategory({ name, type }) {
  const slug = await slugifyUnique({ model: "category", text: name });
  return prisma.category.create({ data: { name, type, slug } });
}

// Update kategori — nama baru memicu slug baru (tetap unik, abaikan diri sendiri)
export async function updateCategory(id, { name, type }) {
  await getCategory(id); // 404 jika tidak ada

  const data = {};
  if (type) data.type = type;
  if (name) {
    data.name = name;
    data.slug = await slugifyUnique({ model: "category", text: name, excludeId: id });
  }

  return prisma.category.update({ where: { id }, data });
}

// Hapus kategori — tolak jika masih dipakai proyek/artikel
export async function deleteCategory(id) {
  await getCategory(id);

  const [projects, posts] = await Promise.all([
    prisma.project.count({ where: { categoryId: id } }),
    prisma.post.count({ where: { categoryId: id } }),
  ]);
  const used = projects + posts;
  if (used > 0) {
    throw new ApiError(400, `Kategori masih dipakai oleh ${projects} proyek dan ${posts} artikel`);
  }

  await prisma.category.delete({ where: { id } });
  return { message: "Kategori berhasil dihapus" };
}
