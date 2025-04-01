/*
  Warnings:

  - You are about to drop the `_PostTagsToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostTagsToUser" DROP CONSTRAINT "_PostTagsToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostTagsToUser" DROP CONSTRAINT "_PostTagsToUser_B_fkey";

-- DropTable
DROP TABLE "_PostTagsToUser";

-- CreateTable
CREATE TABLE "user_preferred_tags" (
    "userId" TEXT NOT NULL,
    "postTagsId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "user_preferred_tags_pkey" PRIMARY KEY ("userId","postTagsId")
);

-- AddForeignKey
ALTER TABLE "user_preferred_tags" ADD CONSTRAINT "user_preferred_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_tags" ADD CONSTRAINT "user_preferred_tags_postTagsId_fkey" FOREIGN KEY ("postTagsId") REFERENCES "post_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
