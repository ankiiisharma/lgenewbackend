/*
  Warnings:

  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(100)`.
  - You are about to alter the column `title` on the `blog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `game` on the `blog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `comments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - Added the required column `userId` to the `blog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "game" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "blog_userId_idx" ON "blog"("userId");

-- CreateIndex
CREATE INDEX "blog_postedAt_idx" ON "blog"("postedAt");

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
