// Endpoint publik testimonials & team (tanpa login)
import prisma from "../../config/prisma.js";

export async function listPublishedTestimonials(limit = 10, serviceId) {
  const where = { isPublished: true };
  if (serviceId) where.serviceId = serviceId;
  return prisma.testimonial.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(Number(limit) || 10, 50),
    select: { id: true, name: true, position: true, company: true, content: true, rating: true, avatar: true, serviceId: true },
  });
}

// GET /api/public/faqs?serviceId= — FAQ terbit, filter layanan opsional
export async function listPublishedFaqs(serviceId) {
  const where = { isPublished: true };
  if (serviceId) where.serviceId = serviceId;
  return prisma.faq.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 20,
    select: { id: true, question: true, answer: true, serviceId: true },
  });
}

export async function listPublishedTeam() {
  return prisma.teamMember.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, position: true, photo: true, bio: true },
  });
}
