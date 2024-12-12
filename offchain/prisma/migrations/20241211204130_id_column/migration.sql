/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `treeNumId` on the `User` table. All the data in the column will be lost.
  - Added the required column `id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `treeNumId`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `treeNumber` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);
