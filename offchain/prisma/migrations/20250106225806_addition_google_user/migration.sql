-- CreateTable
CREATE TABLE `GoogleUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `privateKey` VARCHAR(191) NULL,

    UNIQUE INDEX `GoogleUser_email_key`(`email`),
    UNIQUE INDEX `GoogleUser_address_key`(`address`),
    UNIQUE INDEX `GoogleUser_privateKey_key`(`privateKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
