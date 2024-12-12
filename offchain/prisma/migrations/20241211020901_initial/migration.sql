-- CreateTable
CREATE TABLE `User` (
    `tree_num_id` INTEGER NOT NULL AUTO_INCREMENT,
    `species` VARCHAR(191) NOT NULL,
    `seed_nft_name` VARCHAR(191) NOT NULL,
    `sapling_nft_name` VARCHAR(191) NULL,
    `tree_nft_name` VARCHAR(191) NULL,

    UNIQUE INDEX `User_seed_nft_name_key`(`seed_nft_name`),
    UNIQUE INDEX `User_sapling_nft_name_key`(`sapling_nft_name`),
    UNIQUE INDEX `User_tree_nft_name_key`(`tree_nft_name`),
    PRIMARY KEY (`tree_num_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
