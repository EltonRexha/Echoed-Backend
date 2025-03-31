-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('moderator', 'admin', 'user');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "Role" "Roles"[] DEFAULT ARRAY['user']::"Roles"[];
