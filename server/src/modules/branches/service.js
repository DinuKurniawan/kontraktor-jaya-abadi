// Cabang — data kantor publik.
import prisma from "../../config/prisma.js";

export async function listPublicBranches() {
  return prisma.branch.findMany({
    where: { isPublished: true },
    select: {
      id: true, name: true, address: true, phone: true, email: true, photo: true,
      latitude: true, longitude: true, isMain: true, openingHours: true,
    },
    orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}
