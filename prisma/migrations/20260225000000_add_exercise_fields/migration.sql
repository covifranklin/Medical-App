-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "holdSeconds" INTEGER,
ADD COLUMN "frequencyPerWeek" INTEGER,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
