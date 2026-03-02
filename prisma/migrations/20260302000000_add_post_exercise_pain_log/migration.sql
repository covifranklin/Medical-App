-- Add isPostExercise flag to PainLog for before/after exercise tracking
ALTER TABLE "PainLog" ADD COLUMN "isPostExercise" BOOLEAN NOT NULL DEFAULT false;

-- Drop old unique constraint and create new one that includes isPostExercise
ALTER TABLE "PainLog" DROP CONSTRAINT "PainLog_userId_ailmentId_date_key";
ALTER TABLE "PainLog" ADD CONSTRAINT "PainLog_userId_ailmentId_date_isPostExercise_key" UNIQUE ("userId", "ailmentId", "date", "isPostExercise");
