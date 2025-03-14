-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_mediaId_fkey";

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "mediaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
