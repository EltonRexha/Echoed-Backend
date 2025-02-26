/*
  Warnings:

  - Added the required column `mediaId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userInformation" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mediaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
