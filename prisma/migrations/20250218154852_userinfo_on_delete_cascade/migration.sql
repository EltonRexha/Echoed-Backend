-- DropForeignKey
ALTER TABLE "userInformation" DROP CONSTRAINT "userInformation_usersId_fkey";

-- AddForeignKey
ALTER TABLE "userInformation" ADD CONSTRAINT "userInformation_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
