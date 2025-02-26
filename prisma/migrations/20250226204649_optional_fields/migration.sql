-- AlterTable
ALTER TABLE "userInformation" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mediaId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
