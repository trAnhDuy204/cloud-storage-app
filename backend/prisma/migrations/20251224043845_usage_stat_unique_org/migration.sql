/*
  Warnings:

  - A unique constraint covering the columns `[organization_id]` on the table `UsageStat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UsageStat_organization_id_key" ON "UsageStat"("organization_id");
