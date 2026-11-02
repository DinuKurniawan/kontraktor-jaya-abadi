-- Enforce at most one published-independent main branch at database level.
CREATE UNIQUE INDEX "branches_one_main_idx" ON "branches"("isMain") WHERE "isMain" = true;
