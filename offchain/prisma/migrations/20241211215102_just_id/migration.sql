/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `saplingNftName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `seedNftName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `treeNftName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `treeNumber` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_saplingNftName_key` ON `User`;

-- DropIndex
DROP INDEX `User_seedNftName_key` ON `User`;

-- DropIndex
DROP INDEX `User_treeNftName_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `createdAt`,
    DROP COLUMN `saplingNftName`,
    DROP COLUMN `seedNftName`,
    DROP COLUMN `species`,
    DROP COLUMN `treeNftName`,
    DROP COLUMN `treeNumber`;
