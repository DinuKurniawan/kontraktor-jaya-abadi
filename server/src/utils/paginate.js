// Helper paginasi + pencarian untuk query string ?page=&limit=&search=
// Menghasilkan skip serta filter `where` Prisma untuk pencarian.
export function paginate(query = {}, { defaultLimit = 10, maxLimit = 50, searchFields = [] } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => ({
      [field]: { contains: query.search, mode: "insensitive" },
    }));
  }

  return { page, limit, skip, where };
}

// Meta paginasi untuk diisi ke field `meta` pada respons
export function paginationMeta(total, page, limit) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}
