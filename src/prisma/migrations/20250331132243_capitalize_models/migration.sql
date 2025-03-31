/*
  Warnings:

  - You are about to drop the `_PostTopostTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostTopostTags" DROP CONSTRAINT "_PostTopostTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostTopostTags" DROP CONSTRAINT "_PostTopostTags_B_fkey";

-- DropForeignKey
ALTER TABLE "_likedBy" DROP CONSTRAINT "_likedBy_A_fkey";

-- DropForeignKey
ALTER TABLE "_likedBy" DROP CONSTRAINT "_likedBy_B_fkey";

-- DropForeignKey
ALTER TABLE "_savedBy" DROP CONSTRAINT "_savedBy_A_fkey";

-- DropForeignKey
ALTER TABLE "_savedBy" DROP CONSTRAINT "_savedBy_B_fkey";

-- DropTable
DROP TABLE "_PostTopostTags";

-- CreateTable
CREATE TABLE "_PostToPostTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToPostTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PostToPostTags_B_index" ON "_PostToPostTags"("B");

-- AddForeignKey
ALTER TABLE "_PostToPostTags" ADD CONSTRAINT "_PostToPostTags_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToPostTags" ADD CONSTRAINT "_PostToPostTags_B_fkey" FOREIGN KEY ("B") REFERENCES "post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedBy" ADD CONSTRAINT "_likedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedBy" ADD CONSTRAINT "_likedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_savedBy" ADD CONSTRAINT "_savedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_savedBy" ADD CONSTRAINT "_savedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
