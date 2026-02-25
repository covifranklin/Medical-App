-- CreateTable
CREATE TABLE "PlanReview" (
    "id" TEXT NOT NULL,
    "treatmentPlanId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanReview" ADD CONSTRAINT "PlanReview_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
