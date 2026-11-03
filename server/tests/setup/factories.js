// Factory Prisma untuk data uji; setiap teks yang dibuat diberi prefix [TEST].
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import prisma from "../../src/config/prisma.js";

faker.seed(20261103);
let sequence = 0;
const next = (label) => `${label}-${String(++sequence).padStart(4, "0")}`;
const text = (value) => `[TEST] ${value}`;

export async function createUser(overrides = {}) {
  const token = next("user");
  const password = overrides.password ?? process.env.TEST_PASSWORD ?? "TestPassword!123";
  const { password: _password, ...rest } = overrides;
  return prisma.user.create({
    data: {
      name: text(overrides.name ?? faker.person.fullName()),
      email: overrides.email ?? `${token}@jayaabadi.test`,
      password: await bcrypt.hash(password, 10),
      role: overrides.role ?? "EDITOR",
      isActive: overrides.isActive ?? true,
      position: overrides.position ?? text("Penguji"),
      ...rest,
    },
  });
}

export function createRoleUsers() {
  return Promise.all(["SUPER_ADMIN", "ADMIN", "EDITOR"].map((role) => createUser({ role })));
}

export async function createCategory(overrides = {}) {
  const token = next("category");
  return prisma.category.create({
    data: {
      name: text(overrides.name ?? faker.commerce.department()),
      slug: overrides.slug ?? token,
      type: overrides.type ?? "PROJECT",
      ...overrides,
    },
  });
}

export async function createService(overrides = {}) {
  const token = next("service");
  return prisma.service.create({
    data: {
      title: text(overrides.title ?? faker.commerce.productName()),
      slug: overrides.slug ?? token,
      shortDesc: text(overrides.shortDesc ?? "Layanan uji untuk kebutuhan testing."),
      description: text(overrides.description ?? "Deskripsi layanan uji untuk kebutuhan testing API."),
      icon: overrides.icon ?? "building-2",
      isPublished: overrides.isPublished ?? true,
      ...overrides,
    },
  });
}

export async function createProject(overrides = {}) {
  const token = next("project");
  return prisma.project.create({
    data: {
      title: text(overrides.title ?? faker.commerce.productName()),
      slug: overrides.slug ?? token,
      summary: text(overrides.summary ?? "Ringkasan proyek untuk testing."),
      description: text(overrides.description ?? "Deskripsi proyek untuk kebutuhan testing API."),
      location: text(overrides.location ?? faker.location.city()),
      clientName: text(overrides.clientName ?? "Klien Uji"),
      year: overrides.year ?? 2026,
      status: overrides.status ?? "PLANNING",
      coverImage: overrides.coverImage ?? "/uploads/test-project.webp",
      categoryId: overrides.categoryId,
      serviceId: overrides.serviceId,
      ...overrides,
    },
  });
}

export async function createProjectImage(overrides = {}) {
  return prisma.projectImage.create({
    data: {
      projectId: overrides.projectId,
      url: overrides.url ?? "/uploads/test-project-image.webp",
      caption: text(overrides.caption ?? "Gambar proyek uji"),
      sortOrder: overrides.sortOrder ?? 0,
      ...overrides,
    },
  });
}

export async function createPost(overrides = {}) {
  const token = next("post");
  return prisma.post.create({
    data: {
      title: text(overrides.title ?? faker.lorem.sentence()),
      slug: overrides.slug ?? token,
      excerpt: text(overrides.excerpt ?? "Ringkasan artikel untuk testing."),
      content: text(overrides.content ?? "Isi artikel untuk kebutuhan testing API."),
      coverImage: overrides.coverImage ?? "/uploads/test-post.webp",
      authorId: overrides.authorId,
      categoryId: overrides.categoryId,
      isPublished: overrides.isPublished ?? false,
      ...overrides,
    },
  });
}

export async function createTag(overrides = {}) {
  const token = next("tag");
  return prisma.tag.create({ data: { name: text(overrides.name ?? "Tag Uji"), slug: overrides.slug ?? token, ...overrides } });
}

export async function createServiceScope(overrides = {}) {
  return prisma.serviceScope.create({
    data: {
      serviceId: overrides.serviceId,
      title: text(overrides.title ?? "Lingkup pekerjaan uji"),
      description: text(overrides.description ?? "Deskripsi lingkup pekerjaan uji."),
      sortOrder: overrides.sortOrder ?? 0,
      ...overrides,
    },
  });
}

export async function createServicePackage(overrides = {}) {
  return prisma.servicePackage.create({
    data: {
      serviceId: overrides.serviceId,
      name: text(overrides.name ?? "Paket Uji"),
      description: text(overrides.description ?? "Deskripsi paket uji."),
      priceFrom: overrides.priceFrom ?? 1000000,
      features: overrides.features ?? [text("Fitur uji")],
      ...overrides,
    },
  });
}

export async function createMessage(overrides = {}) {
  const token = next("message");
  return prisma.message.create({
    data: {
      name: text(overrides.name ?? "Pengirim Uji"),
      email: overrides.email ?? `${token}@jayaabadi.test`,
      phone: overrides.phone ?? "080000000000",
      subject: text(overrides.subject ?? "Pesan Uji"),
      body: text(overrides.body ?? "Isi pesan untuk testing."),
      preferredContact: overrides.preferredContact ?? "WHATSAPP",
      preferredTime: overrides.preferredTime ?? "BEBAS",
      attachments: overrides.attachments ?? [],
      ticketCode: overrides.ticketCode ?? `JA-TEST-${String(sequence).padStart(4, "0")}`,
      source: overrides.source ?? "test",
      ...overrides,
    },
  });
}

export async function createTestimonial(overrides = {}) {
  return prisma.testimonial.create({
    data: {
      name: text(overrides.name ?? "Klien Uji"),
      position: text(overrides.position ?? "Pemilik Proyek"),
      content: text(overrides.content ?? "Testimoni untuk testing."),
      rating: overrides.rating ?? 5,
      ...overrides,
    },
  });
}

export async function createTeamMember(overrides = {}) {
  return prisma.teamMember.create({
    data: {
      name: text(overrides.name ?? faker.person.fullName()),
      position: text(overrides.position ?? "Staf Uji"),
      department: overrides.department ?? "TEKNIK",
      ...overrides,
    },
  });
}

export async function createBranch(overrides = {}) {
  const token = next("branch");
  return prisma.branch.create({
    data: {
      name: text(overrides.name ?? `Cabang ${token}`),
      address: text(overrides.address ?? "Alamat uji"),
      city: text(overrides.city ?? "Jakarta"),
      phone: overrides.phone ?? "02100000000",
      whatsapp: overrides.whatsapp ?? "6280000000000",
      email: overrides.email ?? `${token}@jayaabadi.test`,
      latitude: overrides.latitude ?? -6.2,
      longitude: overrides.longitude ?? 106.8,
      mapEmbedUrl: overrides.mapEmbedUrl ?? "https://maps.google.com/?q=Jakarta",
      openingHours: overrides.openingHours ?? {},
      ...overrides,
    },
  });
}

export async function createFaq(overrides = {}) {
  return prisma.faq.create({
    data: {
      question: text(overrides.question ?? "Pertanyaan uji?"),
      answer: text(overrides.answer ?? "Jawaban uji."),
      serviceId: overrides.serviceId,
      ...overrides,
    },
  });
}

export async function createFeature(overrides = {}) {
  return prisma.feature.create({
    data: {
      title: text(overrides.title ?? "Keunggulan Uji"),
      description: text(overrides.description ?? "Deskripsi keunggulan uji."),
      icon: overrides.icon ?? "check",
      ...overrides,
    },
  });
}

export async function createProcessStep(overrides = {}) {
  return prisma.processStep.create({
    data: {
      title: text(overrides.title ?? "Langkah Uji"),
      description: text(overrides.description ?? "Deskripsi langkah uji."),
      icon: overrides.icon ?? "check",
      serviceId: overrides.serviceId,
      ...overrides,
    },
  });
}

export async function createBeforeAfter(overrides = {}) {
  return prisma.beforeAfter.create({
    data: {
      title: text(overrides.title ?? "Before After Uji"),
      beforeImage: overrides.beforeImage ?? "/uploads/test-before.webp",
      afterImage: overrides.afterImage ?? "/uploads/test-after.webp",
      projectId: overrides.projectId,
      ...overrides,
    },
  });
}

export async function createEstimatePrice(overrides = {}) {
  return prisma.estimatePrice.create({
    data: {
      buildingType: overrides.buildingType ?? "RUMAH",
      label: text(overrides.label ?? "Rumah Uji"),
      pricePerM2Min: overrides.pricePerM2Min ?? 1000000,
      pricePerM2Max: overrides.pricePerM2Max ?? 2000000,
      ...overrides,
    },
  });
}

export async function createSiteSetting(overrides = {}) {
  const token = next("setting");
  return prisma.siteSetting.create({ data: { key: overrides.key ?? token, value: overrides.value ?? text("Nilai uji"), ...overrides } });
}

export async function createSubscriber(overrides = {}) {
  const token = next("subscriber");
  return prisma.subscriber.create({ data: { email: overrides.email ?? `${token}@jayaabadi.test`, ...overrides } });
}

export async function createMedia(overrides = {}) {
  const token = next("media");
  return prisma.media.create({
    data: {
      url: overrides.url ?? `/uploads/${token}.webp`,
      filename: overrides.filename ?? `${token}.png`,
      mimeType: "image/webp",
      size: overrides.size ?? 1024,
      ...overrides,
    },
  });
}
