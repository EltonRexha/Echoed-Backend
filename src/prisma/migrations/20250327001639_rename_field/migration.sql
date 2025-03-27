/*
  Warnings:

  - You are about to drop the column `postCommentsId` on the `postComments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "postComments" DROP CONSTRAINT "postComments_postCommentsId_fkey";

-- AlterTable
ALTER TABLE "postComments" DROP COLUMN "postCommentsId",
ADD COLUMN     "parentCommentId" TEXT;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
