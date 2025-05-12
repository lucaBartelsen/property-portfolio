-- DropForeignKey
ALTER TABLE `Portfolio` DROP FOREIGN KEY `Portfolio_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `Property` DROP FOREIGN KEY `Property_portfolioId_fkey`;

-- DropForeignKey
ALTER TABLE `TaxInfo` DROP FOREIGN KEY `TaxInfo_customerId_fkey`;

-- DropIndex
DROP INDEX `Portfolio_customerId_fkey` ON `Portfolio`;

-- DropIndex
DROP INDEX `Property_portfolioId_fkey` ON `Property`;

-- AddForeignKey
ALTER TABLE `Portfolio` ADD CONSTRAINT `Portfolio_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `Portfolio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaxInfo` ADD CONSTRAINT `TaxInfo_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
