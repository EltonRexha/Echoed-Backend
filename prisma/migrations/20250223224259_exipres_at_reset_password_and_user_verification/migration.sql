/*
  Warnings:

  - Added the required column `expiresAt` to the `reset_password_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `user_verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reset_password_tokens" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_verification_tokens" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
