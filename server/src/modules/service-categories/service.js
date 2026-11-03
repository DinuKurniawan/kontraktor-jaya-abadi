// Logika bisnis kategori layanan.
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { slugifyUnique } from "../../utils/slugify.js";

export async function listServiceCategories({ search } = {}) {
  const where = search?.trim()
    ? { name: { contains: search.trim(), mode: "insensitive" } }
    : {};
  return prisma.serviceCategory.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { services: true } } },
  }).then((rows) => rows.map(({ _count, ...row }) => ({ ...row, serviceCount: _count.services })));
}

export async function getServiceCategory(id) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  });
  if (!category) throw new ApiError(404, "Kategori layanan tidak ditemukan");
  const { _count, ...row } = category;
  return { ...row, serviceCount: _count.services };
}

export async function createServiceCategory({ name, sortOrder, isPublished }) {
  const slug = await slugifyUnique({ model: "serviceCategory", text: name });
  if (sortOrder === undefined) {
    const last = await prisma.serviceCategory.aggregate({ _max: { sortOrder: true } });
    sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  return prisma.serviceCategory.create({
    data: { name, slug, sortOrder, isPublished: isPublished ?? true },
  });
}

export async function updateServiceCategory(id, payload) {
  await getServiceCategory(id);
  const data = { ...payload };
  if (payload.name) data.slug = await slugifyUnique({ model: "serviceCategory", text: payload.name, excludeId: id });
  return prisma.serviceCategory.update({ where: { id }, data });
}

export async function deleteServiceCategory(id) {
  const category = await getServiceCategory(id);
  await prisma.serviceCategory.delete({ where: { id } });
  return {
    message: "Kategori layanan berhasil dihapus",
    affectedServices: category.serviceCount,
  };
}

export async function reorderServiceCategories(ids) {
  await prisma.$transaction(ids.map((id, index) => prisma.serviceCategory.update({ where: { id }, data: { sortOrder: index } })));
  return { message: "Urutan kategori layanan diperbarui" };
}

export async function listPublicServiceCategories() {
  const [categories, totalServiceCount] = await prisma.$transaction([
    prisma.serviceCategory.findMany({
      where: { isPublished: true, services: { some: { isPublished: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        _count: { select: { services: { where: { isPublished: true } } } },
      },
    }),
    prisma.service.count({ where: { isPublished: true } }),
  ]);
  return {
    totalServiceCount,
    categories: categories.map(({ _count, ...category }) => ({ ...category, serviceCount: _count.services })),
  };
}
