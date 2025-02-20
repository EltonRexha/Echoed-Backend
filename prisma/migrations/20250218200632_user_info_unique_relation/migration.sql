/*
  Warnings:

  - The primary key for the `userInformation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `usersId` on the `userInformation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userInfoId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `userInformation` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userInfoId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "userInformation" DROP CONSTRAINT "userInformation_usersId_fkey";

-- AlterTable
ALTER TABLE "userInformation" DROP CONSTRAINT "userInformation_pkey",
DROP COLUMN "usersId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "userInformation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userInfoId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_userInfoId_key" ON "users"("userInfoId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userInfoId_fkey" FOREIGN KEY ("userInfoId") REFERENCES "userInformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
