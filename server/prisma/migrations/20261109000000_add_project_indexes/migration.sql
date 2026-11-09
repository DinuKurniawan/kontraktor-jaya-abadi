-- CreateIndex
CREATE INDEX "projects_isPublished_idx" ON "projects"("isPublished");

-- CreateIndex
CREATE INDEX "projects_serviceId_idx" ON "projects"("serviceId");

-- CreateIndex
CREATE INDEX "projects_year_idx" ON "projects"("year");
