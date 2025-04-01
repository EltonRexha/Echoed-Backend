/*
  Warnings:

  - You are about to drop the `_preferred` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_preferred" DROP CONSTRAINT "_preferred_A_fkey";

-- DropForeignKey
ALTER TABLE "_preferred" DROP CONSTRAINT "_preferred_B_fkey";

-- DropTable
DROP TABLE "_preferred";
