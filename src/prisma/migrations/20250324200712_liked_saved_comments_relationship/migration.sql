-- DropForeignKey
ALTER TABLE "postComments" DROP CONSTRAINT "postComments_postCommentsId_fkey";

-- CreateTable
CREATE TABLE "_likedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_likedBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_savedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_savedBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_likedBy_B_index" ON "_likedBy"("B");

-- CreateIndex
CREATE INDEX "_savedBy_B_index" ON "_savedBy"("B");

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_postCommentsId_fkey" FOREIGN KEY ("postCommentsId") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedBy" ADD CONSTRAINT "_likedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_likedBy" ADD CONSTRAINT "_likedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_savedBy" ADD CONSTRAINT "_savedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_savedBy" ADD CONSTRAINT "_savedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
