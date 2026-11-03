// Seed tes kecil dan deterministik — terpisah dari seed pengembangan.
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import prisma from "../../src/config/prisma.js";

const TEST_PASSWORD = process.env.TEST_PASSWORD;
if (!TEST_PASSWORD) throw new Error("TEST_PASSWORD tidak diatur di server/.env.test");

export async function seedTestData() {
  const password = await bcrypt.hash(TEST_PASSWORD, 10);
  const users = {};
  for (const role of ["SUPER_ADMIN", "ADMIN", "EDITOR"]) {
    const key = role.toLowerCase();
    users[key] = await prisma.user.upsert({
      where: { email: `test.${key}@jayaabadi.test` },
      update: { name: `[TEST] ${role}`, password, role, isActive: true, position: `[TEST] ${role}` },
      create: {
        name: `[TEST] ${role}`,
        email: `test.${key}@jayaabadi.test`,
        password,
        role,
        isActive: true,
        position: `[TEST] ${role}`,
      },
    });
  }

  const projectCategory = await prisma.category.upsert({
    where: { slug: "test-category-project" },
    update: { name: "[TEST] Kategori Proyek", type: "PROJECT" },
    create: { name: "[TEST] Kategori Proyek", slug: "test-category-project", type: "PROJECT" },
  });
  const postCategory = await prisma.category.upsert({
    where: { slug: "test-category-post" },
    update: { name: "[TEST] Kategori Artikel", type: "POST" },
    create: { name: "[TEST] Kategori Artikel", slug: "test-category-post", type: "POST" },
  });
  const service = await prisma.service.upsert({
    where: { slug: "test-service-konstruksi" },
    update: {
      title: "[TEST] Konstruksi Bangunan",
      shortDesc: "[TEST] Layanan konstruksi untuk pengujian.",
      description: "[TEST] Deskripsi layanan konstruksi untuk pengujian API.",
      icon: "building-2",
      isPublished: true,
    },
    create: {
      title: "[TEST] Konstruksi Bangunan",
      slug: "test-service-konstruksi",
      shortDesc: "[TEST] Layanan konstruksi untuk pengujian.",
      description: "[TEST] Deskripsi layanan konstruksi untuk pengujian API.",
      icon: "building-2",
      isPublished: true,
    },
  });
  const project = await prisma.project.upsert({
    where: { slug: "test-project" },
    update: {
      title: "[TEST] Proyek Uji",
      summary: "[TEST] Ringkasan proyek uji.",
      description: "[TEST] Deskripsi proyek uji untuk pemeriksaan integrasi.",
      location: "[TEST] Jakarta",
      clientName: "[TEST] Klien Uji",
      year: 2026,
      status: "PLANNING",
      coverImage: "/uploads/test-project.webp",
      categoryId: projectCategory.id,
      serviceId: service.id,
    },
    create: {
      title: "[TEST] Proyek Uji",
      slug: "test-project",
      summary: "[TEST] Ringkasan proyek uji.",
      description: "[TEST] Deskripsi proyek uji untuk pemeriksaan integrasi.",
      location: "[TEST] Jakarta",
      clientName: "[TEST] Klien Uji",
      year: 2026,
      status: "PLANNING",
      coverImage: "/uploads/test-project.webp",
      categoryId: projectCategory.id,
      serviceId: service.id,
    },
  });
  const post = await prisma.post.upsert({
    where: { slug: "test-post" },
    update: {
      title: "[TEST] Artikel Uji",
      excerpt: "[TEST] Ringkasan artikel uji.",
      content: "[TEST] Isi artikel uji untuk pengujian.",
      coverImage: "/uploads/test-post.webp",
      authorId: users.super_admin.id,
      categoryId: postCategory.id,
    },
    create: {
      title: "[TEST] Artikel Uji",
      slug: "test-post",
      excerpt: "[TEST] Ringkasan artikel uji.",
      content: "[TEST] Isi artikel uji untuk pengujian.",
      coverImage: "/uploads/test-post.webp",
      authorId: users.super_admin.id,
      categoryId: postCategory.id,
    },
  });
  const tag = await prisma.tag.upsert({
    where: { slug: "test-tag" },
    update: { name: "[TEST] Tag Uji" },
    create: { name: "[TEST] Tag Uji", slug: "test-tag" },
  });
  await prisma.postTag.upsert({
    where: { postId_tagId: { postId: post.id, tagId: tag.id } },
    update: {},
    create: { postId: post.id, tagId: tag.id },
  });
  await prisma.message.upsert({
    where: { ticketCode: "JA-TEST-0001" },
    update: {
      name: "[TEST] Pengirim Uji",
      email: "test.sender@jayaabadi.test",
      phone: "080000000001",
      subject: "[TEST] Pesan Uji",
      body: "[TEST] Isi pesan uji.",
      serviceId: service.id,
      status: "BARU",
    },
    create: {
      name: "[TEST] Pengirim Uji",
      email: "test.sender@jayaabadi.test",
      phone: "080000000001",
      subject: "[TEST] Pesan Uji",
      body: "[TEST] Isi pesan uji.",
      serviceId: service.id,
      preferredContact: "WHATSAPP",
      preferredTime: "BEBAS",
      attachments: [],
      status: "BARU",
      ticketCode: "JA-TEST-0001",
      source: "test",
    },
  });

  return { users, projectCategory, postCategory, service, project, post, tag };
}

const currentFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (currentFile === fileURLToPath(import.meta.url)) {
  seedTestData().then(() => console.log("✅ Seed tes selesai")).finally(() => prisma.$disconnect());
}
