-- CreateTable
CREATE TABLE "_preferred" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_preferred_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PostTagsToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostTagsToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_preferred_B_index" ON "_preferred"("B");

-- CreateIndex
CREATE INDEX "_PostTagsToUser_B_index" ON "_PostTagsToUser"("B");

-- AddForeignKey
ALTER TABLE "_preferred" ADD CONSTRAINT "_preferred_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_preferred" ADD CONSTRAINT "_preferred_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTagsToUser" ADD CONSTRAINT "_PostTagsToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTagsToUser" ADD CONSTRAINT "_PostTagsToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
