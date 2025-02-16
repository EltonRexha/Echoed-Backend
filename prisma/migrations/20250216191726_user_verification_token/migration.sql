/*
  Warnings:

  - Added the required column `token` to the `user_verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_verification_tokens" ADD COLUMN     "token" TEXT NOT NULL;
