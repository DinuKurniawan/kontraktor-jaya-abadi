-- Pencarian artikel memakai ILIKE '%kata%' pada title/excerpt/content.
-- Trigram GIN membuat pola LIKE/ILIKE bisa memakai index, bukan full scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "posts_content_trgm_idx" ON "posts" USING GIN ("content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "posts_title_trgm_idx" ON "posts" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "posts_excerpt_trgm_idx" ON "posts" USING GIN ("excerpt" gin_trgm_ops);
