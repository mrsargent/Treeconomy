/*
  Warnings:

  - A unique constraint covering the columns `[seedNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saplingNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[treeNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seedNftName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `species` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `saplingNftName` VARCHAR(191) NULL,
    ADD COLUMN `seedNftName` VARCHAR(191) NOT NULL,
    ADD COLUMN `species` VARCHAR(191) NOT NULL,
    ADD COLUMN `treeNftName` VARCHAR(191) NULL,
    ADD COLUMN `treeNumber` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_seedNftName_key` ON `User`(`seedNftName`);

-- CreateIndex
CREATE UNIQUE INDEX `User_saplingNftName_key` ON `User`(`saplingNftName`);

-- CreateIndex
CREATE UNIQUE INDEX `User_treeNftName_key` ON `User`(`treeNftName`);
