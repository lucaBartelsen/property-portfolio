/*
  Warnings:

  - You are about to alter the column `taxStatus` on the `TaxInfo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `TaxInfo` MODIFY `taxStatus` ENUM('single', 'married') NOT NULL;
