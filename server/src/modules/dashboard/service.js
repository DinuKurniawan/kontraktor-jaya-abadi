// Service dashboard — agregasi statistik untuk halaman admin
import prisma from "../../config/prisma.js";

// GET data dashboard: total per status, pesan, artikel, proyek per kategori, 5 pesan terbaru
export async function getDashboardData() {
  const [projectByStatus, unreadMessages, publishedPosts, categoryCounts, latestMessages] = await Promise.all([
    // Jumlah proyek per status
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.message.count({ where: { isRead: false } }),
    prisma.post.count({ where: { isPublished: true } }),
    // Proyek per kategori (PROJECT saja) — ambil semua lalu hitung di sisi Node (skala kecil)
    prisma.category.findMany({
      where: { type: "PROJECT" },
      select: { id: true, name: true, _count: { select: { projects: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, subject: true, isRead: true, createdAt: true },
    }),
  ]);

  // Normalisasi status agar ketiganya selalu ada walau 0
  const statusCount = { PLANNING: 0, ONGOING: 0, COMPLETED: 0 };
  for (const row of projectByStatus) statusCount[row.status] = row._count._all;

  const totalProjects = statusCount.PLANNING + statusCount.ONGOING + statusCount.COMPLETED;

  return {
    projects: {
      total: totalProjects,
      byStatus: statusCount,
      byCategory: categoryCounts.map((c) => ({ id: c.id, name: c.name, count: c._count.projects })),
    },
    messages: { unread: unreadMessages },
    posts: { published: publishedPosts },
    latestMessages,
  };
}
