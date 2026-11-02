-- Contact branches and richer public consultation messages.
CREATE TYPE "budget_range" AS ENUM ('KURANG_100JT', '100_500JT', '500JT_1M', '1M_5M', 'LEBIH_5M', 'BELUM_TAHU');
CREATE TYPE "preferred_contact" AS ENUM ('WHATSAPP', 'TELEPON', 'EMAIL');
CREATE TYPE "preferred_time" AS ENUM ('PAGI', 'SIANG', 'SORE', 'BEBAS');
CREATE TYPE "message_status" AS ENUM ('BARU', 'DIPROSES', 'SELESAI', 'SPAM');

ALTER TABLE "messages"
  ADD COLUMN "serviceId" TEXT,
  ADD COLUMN "budgetRange" "budget_range",
  ADD COLUMN "projectLocation" TEXT,
  ADD COLUMN "projectArea" INTEGER,
  ADD COLUMN "preferredContact" "preferred_contact" NOT NULL DEFAULT 'WHATSAPP',
  ADD COLUMN "preferredTime" "preferred_time" NOT NULL DEFAULT 'BEBAS',
  ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "status" "message_status" NOT NULL DEFAULT 'BARU',
  ADD COLUMN "adminNote" TEXT,
  ADD COLUMN "ticketCode" TEXT,
  ADD COLUMN "source" TEXT;

WITH numbered_messages AS (
  SELECT "id", "createdAt", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS row_number
  FROM "messages"
  WHERE "ticketCode" IS NULL
)
UPDATE "messages" AS messages
SET "ticketCode" = 'JA-' || TO_CHAR(numbered_messages."createdAt", 'YYYYMMDD') || '-' || LPAD(TO_HEX(numbered_messages.row_number::INTEGER), 4, '0')
FROM numbered_messages
WHERE messages."id" = numbered_messages."id";

ALTER TABLE "messages" ALTER COLUMN "ticketCode" SET NOT NULL;
CREATE UNIQUE INDEX "messages_ticketCode_key" ON "messages"("ticketCode");
CREATE INDEX "messages_status_createdAt_idx" ON "messages"("status", "createdAt");
CREATE INDEX "messages_serviceId_idx" ON "messages"("serviceId");

ALTER TABLE "messages" ADD CONSTRAINT "messages_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "branches" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "mapEmbedUrl" TEXT NOT NULL,
  "openingHours" JSONB NOT NULL,
  "photo" TEXT,
  "isMain" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "branches_isPublished_isMain_sortOrder_idx" ON "branches"("isPublished", "isMain", "sortOrder");
