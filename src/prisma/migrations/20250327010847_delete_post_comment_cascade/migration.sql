-- DropForeignKey
ALTER TABLE "postComments" DROP CONSTRAINT "postComments_postsId_fkey";

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_postsId_fkey" FOREIGN KEY ("postsId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
