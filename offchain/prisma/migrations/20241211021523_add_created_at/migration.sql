/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sapling_nft_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `seed_nft_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tree_nft_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tree_num_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seedNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saplingNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[treeNftName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seedNftName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeNumId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_sapling_nft_name_key` ON `User`;

-- DropIndex
DROP INDEX `User_seed_nft_name_key` ON `User`;

-- DropIndex
DROP INDEX `User_tree_nft_name_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `sapling_nft_name`,
    DROP COLUMN `seed_nft_name`,
    DROP COLUMN `tree_nft_name`,
    DROP COLUMN `tree_num_id`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `saplingNftName` VARCHAR(191) NULL,
    ADD COLUMN `seedNftName` VARCHAR(191) NOT NULL,
    ADD COLUMN `treeNftName` VARCHAR(191) NULL,
    ADD COLUMN `treeNumId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`treeNumId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_seedNftName_key` ON `User`(`seedNftName`);

-- CreateIndex
CREATE UNIQUE INDEX `User_saplingNftName_key` ON `User`(`saplingNftName`);

-- CreateIndex
CREATE UNIQUE INDEX `User_treeNftName_key` ON `User`(`treeNftName`);
