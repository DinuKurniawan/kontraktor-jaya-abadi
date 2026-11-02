// Cabang — data kantor publik.
import prisma from "../../config/prisma.js";

export async function listPublicBranches() {
  return prisma.branch.findMany({
    where: { isPublished: true },
    orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}
