-- AlterTable
ALTER TABLE "github_users" ADD COLUMN     "OAuth" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "google_users" ADD COLUMN     "OAuth" BOOLEAN NOT NULL DEFAULT true;
