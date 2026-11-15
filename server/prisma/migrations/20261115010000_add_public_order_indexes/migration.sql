-- Index untuk urutan & navigasi publik (prev/next) tanpa sort di memori.

-- CreateIndex: urutan default daftar proyek publik
CREATE INDEX IF NOT EXISTS "projects_isPublished_isFeatured_year_createdAt_idx"
  ON "projects"("isPublished", "isFeatured", "year", "createdAt");

-- CreateIndex: navigasi prev/next proyek (filter tahun + createdAt)
CREATE INDEX IF NOT EXISTS "projects_isPublished_year_createdAt_idx"
  ON "projects"("isPublished", "year", "createdAt");

-- CreateIndex: navigasi prev/next layanan
CREATE INDEX IF NOT EXISTS "services_isPublished_sortOrder_createdAt_idx"
  ON "services"("isPublished", "sortOrder", "createdAt");
