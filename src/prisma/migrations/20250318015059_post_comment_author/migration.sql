/*
  Warnings:

  - Added the required column `authorId` to the `postComments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "postComments" ADD COLUMN     "authorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
