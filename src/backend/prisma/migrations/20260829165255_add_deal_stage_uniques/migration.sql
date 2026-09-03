/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `DealStage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order]` on the table `DealStage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DealStage_name_key" ON "DealStage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DealStage_order_key" ON "DealStage"("order");
