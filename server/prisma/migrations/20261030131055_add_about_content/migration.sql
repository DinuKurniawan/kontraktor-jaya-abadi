-- CreateEnum
CREATE TYPE "TeamDepartment" AS ENUM ('MANAJEMEN', 'TEKNIK', 'ARSITEK_INTERIOR', 'PENGAWAS', 'ADMINISTRASI');

-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('KEGIATAN', 'PROYEK', 'KANTOR', 'PENGHARGAAN');

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "department" "TeamDepartment" NOT NULL DEFAULT 'MANAJEMEN',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "linkedin" TEXT;

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_values" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "core_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "category" "GalleryCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestones_sortOrder_idx" ON "milestones"("sortOrder");

-- CreateIndex
CREATE INDEX "core_values_sortOrder_idx" ON "core_values"("sortOrder");

-- CreateIndex
CREATE INDEX "gallery_items_sortOrder_idx" ON "gallery_items"("sortOrder");
