/*
  Warnings:

  - Made the column `summary` on table `blog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "blog" ALTER COLUMN "summary" SET NOT NULL;
