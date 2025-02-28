/*
  Warnings:

  - You are about to drop the `gmailUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "gmailUser" DROP CONSTRAINT "gmailUser_userId_fkey";

-- DropTable
DROP TABLE "gmailUser";

-- CreateTable
CREATE TABLE "googleUser" (
    "id" TEXT NOT NULL,
    "googleUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "googleUser_pkey" PRIMARY KEY ("googleUserId","id")
);

-- CreateTable
CREATE TABLE "githubUser" (
    "id" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "githubUser_pkey" PRIMARY KEY ("githubUserId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "googleUser_email_key" ON "googleUser"("email");

-- CreateIndex
CREATE INDEX "googleUser_email_idx" ON "googleUser"("email");

-- AddForeignKey
ALTER TABLE "googleUser" ADD CONSTRAINT "googleUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "githubUser" ADD CONSTRAINT "githubUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
