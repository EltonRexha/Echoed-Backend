/*
  Warnings:

  - You are about to drop the column `mediaId` on the `posts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_mediaId_fkey";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "postMediaId" TEXT;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "mediaId";

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_postMediaId_fkey" FOREIGN KEY ("postMediaId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
