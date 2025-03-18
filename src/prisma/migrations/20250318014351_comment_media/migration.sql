/*
  Warnings:

  - You are about to drop the column `mediaId` on the `postComments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "postComments" DROP CONSTRAINT "postComments_mediaId_fkey";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "commentMediaId" TEXT;

-- AlterTable
ALTER TABLE "postComments" DROP COLUMN "mediaId";

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_commentMediaId_fkey" FOREIGN KEY ("commentMediaId") REFERENCES "postComments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
