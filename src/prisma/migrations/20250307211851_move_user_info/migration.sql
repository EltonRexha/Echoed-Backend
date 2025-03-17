/*
  Warnings:

  - You are about to drop the column `userId` on the `userInformation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reset_password_tokens" DROP CONSTRAINT "reset_password_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "userInformation" DROP CONSTRAINT "userInformation_userId_fkey";

-- DropIndex
DROP INDEX "userInformation_userId_key";

-- AlterTable
ALTER TABLE "userInformation" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "userInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_password_tokens" ADD CONSTRAINT "reset_password_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
