// Logika CRUD tag artikel
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";
import { slugifyUnique } from "../../utils/slugify.js";

const TAG_SELECT = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { posts: true } },
};

function present(tag) {
  const { _count, ...data } = tag;
  return { ...data, postCount: _count.posts };
}

export async function listTags(query = {}) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name", "slug"], defaultLimit: 50 });
  const [rows, total] = await prisma.$transaction([
    prisma.tag.findMany({ where, select: TAG_SELECT, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.tag.count({ where }),
  ]);
  return { data: rows.map(present), meta: paginationMeta(total, page, limit) };
}

export async function createTag({ name }) {
  const slug = await slugifyUnique({ model: "tag", text: name });
  return present(await prisma.tag.create({ data: { name: name.trim(), slug }, select: TAG_SELECT }));
}

export async function updateTag(id, { name }) {
  const current = await prisma.tag.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!current) throw new ApiError(404, "Tag tidak ditemukan");
  const data = {};
  if (name !== undefined) {
    data.name = name.trim();
    data.slug = await slugifyUnique({ model: "tag", text: name, excludeId: id });
  }
  return present(await prisma.tag.update({ where: { id }, data, select: TAG_SELECT }));
}

export async function deleteTag(id) {
  const current = await prisma.tag.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new ApiError(404, "Tag tidak ditemukan");
  await prisma.tag.delete({ where: { id } });
  return { message: "Tag berhasil dihapus" };
}
