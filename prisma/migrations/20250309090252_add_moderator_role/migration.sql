-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT false;
