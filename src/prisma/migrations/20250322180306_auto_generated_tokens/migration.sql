/*
  Warnings:

  - You are about to drop the `user_userPreferredTag_tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_userPreferredTag_tags" DROP CONSTRAINT "user_userPreferredTag_tags_postTagsId_fkey";

-- DropForeignKey
ALTER TABLE "user_userPreferredTag_tags" DROP CONSTRAINT "user_userPreferredTag_tags_userId_fkey";

-- DropTable
DROP TABLE "user_userPreferredTag_tags";
