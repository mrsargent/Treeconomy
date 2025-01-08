/*
  Warnings:

  - A unique constraint covering the columns `[pkh]` on the table `GoogleUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pkh` to the `GoogleUser` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `GoogleUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `GoogleUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `privateKey` on table `GoogleUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `GoogleUser` ADD COLUMN `pkh` VARCHAR(191) NOT NULL,
    MODIFY `email` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL,
    MODIFY `privateKey` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `GoogleUser_pkh_key` ON `GoogleUser`(`pkh`);
