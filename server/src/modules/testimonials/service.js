// Logika bisnis testimonials
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error.js";
import { paginate, paginationMeta } from "../../utils/paginate.js";

export async function listTestimonials(query) {
  const { page, limit, skip, where } = paginate(query, { searchFields: ["name", "company"] });
  const [rows, total] = await prisma.$transaction([
    prisma.testimonial.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.testimonial.count({ where }),
  ]);
  return { data: rows, meta: paginationMeta(total, page, limit) };
}

export async function getTestimonial(id) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) throw new ApiError(404, "Testimoni tidak ditemukan");
  return testimonial;
}

export async function createTestimonial(payload) {
  return prisma.testimonial.create({ data: payload });
}

export async function updateTestimonial(id, payload) {
  await getTestimonial(id);
  return prisma.testimonial.update({ where: { id }, data: payload });
}

export async function deleteTestimonial(id) {
  await getTestimonial(id);
  await prisma.testimonial.delete({ where: { id } });
  return { message: "Testimoni berhasil dihapus" };
}

// Toggle publish
export async function togglePublish(id) {
  const t = await getTestimonial(id);
  return prisma.testimonial.update({ where: { id }, data: { isPublished: !t.isPublished } });
}
