-- CreateEnum: PriorityLevel
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum: GoalTimeframe
CREATE TYPE "GoalTimeframe" AS ENUM ('ACUTE_RELIEF', 'THIS_WEEK', 'THIS_MONTH', 'MAINTENANCE');

-- CreateTable: UserPreferences
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyTimeBudgetMinutes" INTEGER NOT NULL DEFAULT 30,
    "weeklyFocusAreas" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Ailment — add priorityLevel and goalTimeframe
ALTER TABLE "Ailment" ADD COLUMN "priorityLevel" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Ailment" ADD COLUMN "goalTimeframe" "GoalTimeframe" NOT NULL DEFAULT 'THIS_MONTH';
