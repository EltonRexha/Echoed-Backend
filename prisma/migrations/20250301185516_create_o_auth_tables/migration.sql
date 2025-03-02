/*
  Warnings:

  - You are about to drop the column `userInfoId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `gmailUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `userInformation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `userInformation` table without a default value. This is not possible if the table is not empty.
  - Made the column `dateOfBirth` on table `userInformation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `userInformation` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('local', 'github', 'google');

-- DropForeignKey
ALTER TABLE "gmailUser" DROP CONSTRAINT "gmailUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_verification_tokens" DROP CONSTRAINT "user_verification_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_userInfoId_fkey";

-- DropIndex
DROP INDEX "users_userInfoId_key";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "githubUserId" TEXT,
ADD COLUMN     "googleUserId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "revoked" SET DEFAULT false;

-- AlterTable
ALTER TABLE "userInformation" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "dateOfBirth" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "userInfoId",
ADD COLUMN     "UserType" "UserType" NOT NULL DEFAULT 'local',
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "gmailUser";

-- CreateTable
CREATE TABLE "google_users" (
    "id" TEXT NOT NULL,
    "googleUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "OAuth" BOOLEAN NOT NULL DEFAULT true,
    "UserType" "UserType" NOT NULL DEFAULT 'google',
    "profileUrl" TEXT,
    "userId" TEXT,

    CONSTRAINT "google_users_pkey" PRIMARY KEY ("googleUserId","id")
);

-- CreateTable
CREATE TABLE "github_users" (
    "id" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "OAuth" BOOLEAN NOT NULL DEFAULT true,
    "UserType" "UserType" NOT NULL DEFAULT 'github',
    "profileUrl" TEXT,
    "userId" TEXT,

    CONSTRAINT "github_users_pkey" PRIMARY KEY ("githubUserId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_users_id_key" ON "google_users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "google_users_email_key" ON "google_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "google_users_userId_key" ON "google_users"("userId");

-- CreateIndex
CREATE INDEX "google_users_email_idx" ON "google_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "github_users_id_key" ON "github_users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "github_users_userId_key" ON "github_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userInformation_userId_key" ON "userInformation"("userId");

-- AddForeignKey
ALTER TABLE "google_users" ADD CONSTRAINT "google_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_users" ADD CONSTRAINT "github_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userInformation" ADD CONSTRAINT "userInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_githubUserId_fkey" FOREIGN KEY ("githubUserId") REFERENCES "github_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_googleUserId_fkey" FOREIGN KEY ("googleUserId") REFERENCES "google_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verification_tokens" ADD CONSTRAINT "user_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
