-- Extend author profile fields used by public article details
ALTER TABLE "users" ADD COLUMN "position" TEXT;
ALTER TABLE "users" ADD COLUMN "photo" TEXT;

-- Extend posts with featured, popularity, and SEO metadata
ALTER TABLE "posts" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "posts" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "posts" ADD COLUMN "metaDescription" TEXT;

-- Article tags
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_tags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("postId", "tagId")
);

CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE INDEX "post_tags_tagId_idx" ON "post_tags"("tagId");
CREATE INDEX "posts_isPublished_isFeatured_idx" ON "posts"("isPublished", "isFeatured");
CREATE INDEX "posts_viewCount_idx" ON "posts"("viewCount");

ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
