/*
  Warnings:

  - A unique constraint covering the columns `[githubUserId]` on the table `github_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleUserId]` on the table `google_users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "github_users" DROP CONSTRAINT "github_users_userId_fkey";

-- DropForeignKey
ALTER TABLE "google_users" DROP CONSTRAINT "google_users_userId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "github_users_githubUserId_key" ON "github_users"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "google_users_googleUserId_key" ON "google_users"("googleUserId");

-- AddForeignKey
ALTER TABLE "google_users" ADD CONSTRAINT "google_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_users" ADD CONSTRAINT "github_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
