/*
  Warnings:

  - You are about to drop the `githubUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `googleUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "githubUser" DROP CONSTRAINT "githubUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "googleUser" DROP CONSTRAINT "googleUser_userId_fkey";

-- DropTable
DROP TABLE "githubUser";

-- DropTable
DROP TABLE "googleUser";

-- CreateTable
CREATE TABLE "google_users" (
    "id" TEXT NOT NULL,
    "googleUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profileUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "google_users_pkey" PRIMARY KEY ("googleUserId","id")
);

-- CreateTable
CREATE TABLE "github_users" (
    "id" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profileUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "github_users_pkey" PRIMARY KEY ("githubUserId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_users_email_key" ON "google_users"("email");

-- CreateIndex
CREATE INDEX "google_users_email_idx" ON "google_users"("email");

-- AddForeignKey
ALTER TABLE "google_users" ADD CONSTRAINT "google_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_users" ADD CONSTRAINT "github_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
