/*
  Warnings:

  - You are about to alter the column `totalPrice` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `discountAmount` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `status` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(11))` to `VarChar(191)`.
  - You are about to alter the column `subtotal` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `tax` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `shipping` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `discount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `total` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `status` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `VarChar(191)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `method` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `VarChar(191)`.
  - You are about to drop the column `productId` on the `reviews` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `VarChar(191)`.
  - You are about to drop the column `guideId` on the `tours` table. All the data in the column will be lost.
  - You are about to alter the column `shortDescription` on the `tours` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.
  - You are about to alter the column `price` on the `tours` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `discountPrice` on the `tours` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `status` on the `tours` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(12))` to `VarChar(191)`.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(191)`.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guide_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itineraries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promo_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendor_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wishlist_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `categories` DROP FOREIGN KEY `categories_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `device_registrations` DROP FOREIGN KEY `device_registrations_userId_fkey`;

-- DropForeignKey
ALTER TABLE `guide_profiles` DROP FOREIGN KEY `guide_profiles_userId_fkey`;

-- DropForeignKey
ALTER TABLE `itineraries` DROP FOREIGN KEY `itineraries_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notification_preferences` DROP FOREIGN KEY `notification_preferences_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_productId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_productId_fkey`;

-- DropForeignKey
ALTER TABLE `tours` DROP FOREIGN KEY `tours_guideId_fkey`;

-- DropForeignKey
ALTER TABLE `vendor_profiles` DROP FOREIGN KEY `vendor_profiles_userId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlist_items` DROP FOREIGN KEY `wishlist_items_productId_fkey`;

-- DropForeignKey
ALTER TABLE `wishlist_items` DROP FOREIGN KEY `wishlist_items_userId_fkey`;

-- AlterTable
ALTER TABLE `bookings` MODIFY `totalPrice` DECIMAL(65, 30) NOT NULL,
    MODIFY `discountAmount` DECIMAL(65, 30) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `notes` VARCHAR(191) NULL,
    MODIFY `specialRequests` VARCHAR(191) NULL,
    MODIFY `participants` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `chat_messages` MODIFY `message` VARCHAR(191) NOT NULL,
    MODIFY `response` VARCHAR(191) NULL,
    MODIFY `metadata` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `subtotal` DECIMAL(65, 30) NOT NULL,
    MODIFY `tax` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `shipping` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `total` DECIMAL(65, 30) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `notes` VARCHAR(191) NULL,
    MODIFY `shippingAddress` VARCHAR(191) NOT NULL,
    MODIFY `billingAddress` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payments` MODIFY `amount` DECIMAL(65, 30) NOT NULL,
    MODIFY `method` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `gatewayResponse` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reviews` DROP COLUMN `productId`,
    MODIFY `comment` VARCHAR(191) NOT NULL,
    MODIFY `images` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `tours` DROP COLUMN `guideId`,
    MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `shortDescription` VARCHAR(191) NULL,
    MODIFY `images` VARCHAR(191) NULL,
    MODIFY `price` DECIMAL(65, 30) NOT NULL,
    MODIFY `discountPrice` DECIMAL(65, 30) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    MODIFY `startLocation` VARCHAR(191) NULL,
    MODIFY `locations` VARCHAR(191) NULL,
    MODIFY `included` VARCHAR(191) NULL,
    MODIFY `excluded` VARCHAR(191) NULL,
    MODIFY `itinerary` VARCHAR(191) NULL,
    MODIFY `tags` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    MODIFY `bio` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `categories`;

-- DropTable
DROP TABLE `cultural_content`;

-- DropTable
DROP TABLE `device_registrations`;

-- DropTable
DROP TABLE `guide_profiles`;

-- DropTable
DROP TABLE `itineraries`;

-- DropTable
DROP TABLE `notification_preferences`;

-- DropTable
DROP TABLE `notification_templates`;

-- DropTable
DROP TABLE `notifications`;

-- DropTable
DROP TABLE `order_items`;

-- DropTable
DROP TABLE `products`;

-- DropTable
DROP TABLE `promo_codes`;

-- DropTable
DROP TABLE `vendor_profiles`;

-- DropTable
DROP TABLE `wishlist_items`;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `password_reset_tokens_token_key`(`token`),
    INDEX `password_reset_tokens_token_idx`(`token`),
    INDEX `password_reset_tokens_userId_idx`(`userId`),
    INDEX `password_reset_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `email_verification_tokens_token_key`(`token`),
    INDEX `email_verification_tokens_token_idx`(`token`),
    INDEX `email_verification_tokens_userId_idx`(`userId`),
    INDEX `email_verification_tokens_email_idx`(`email`),
    INDEX `email_verification_tokens_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `email_verification_tokens_userId_email_key`(`userId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
