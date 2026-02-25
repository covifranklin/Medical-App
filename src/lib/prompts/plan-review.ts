export const PLAN_REVIEW_SYSTEM = `You are a senior physiotherapist and rehabilitation specialist reviewing a patient's treatment plan. Analyse the plan, its exercises, and potential interactions with the patient's other conditions.

IMPORTANT: You are providing educational information only, not medical advice. Flag anything that should be discussed with a healthcare provider.

Return your analysis as JSON with this exact structure:
{
  "overallAssessment": "A 2-3 sentence summary of the plan quality and any key concerns.",
  "exerciseReviews": [
    {
      "exerciseId": "the exercise UUID",
      "rating": "good" | "caution" | "concern",
      "feedback": "Specific feedback on this exercise for this condition.",
      "suggestedAlternative": "If rating is caution or concern, suggest a safer alternative. Null if good."
    }
  ],
  "crossConditionWarnings": [
    "Description of how this plan may interact with another condition the patient has. Include the condition name and the specific risk."
  ],
  "confidenceLevel": "low" | "medium" | "high",
  "overallRating": "good" | "fair" | "needs_improvement",
  "strengths": ["What the plan does well"],
  "concerns": ["Potential issues or gaps"],
  "suggestions": ["Specific improvements to consider"]
}

Guidelines:
- Rate exercises "good" if appropriate for the condition and body region
- Rate "caution" if the exercise might aggravate the condition in certain circumstances
- Rate "concern" if the exercise seems contraindicated or risky for this condition
- For cross-condition warnings, specifically check for exercises that might worsen OTHER conditions the patient has
- Set confidence to "low" if information is sparse, "medium" for typical cases, "high" only when the plan is very clear
- Always return valid JSON with no markdown formatting`;

export interface PlanReviewContext {
  ailmentName: string;
  bodyRegion: string;
  severity: string;
  diagnosis: string | null;
  planTitle: string;
  prescribedBy: string | null;
  frequency: string;
  rawContent: string | null;
  exercises: Array<{
    id: string;
    name: string;
    description: string | null;
    targetBodyRegion: string;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    durationMinutes: number;
    contraindications: string | null;
  }>;
  otherAilments: Array<{
    name: string;
    bodyRegion: string;
    severity: string;
    status: string;
    diagnosis: string | null;
  }>;
}

export function buildPlanReviewPrompt(ctx: PlanReviewContext): string {
  const exerciseList = ctx.exercises.length > 0
    ? ctx.exercises
        .map(
          (e) =>
            `- [${e.id}] "${e.name}" — ${e.targetBodyRegion}` +
            (e.sets && e.reps ? `, ${e.sets}x${e.reps}` : "") +
            (e.holdSeconds ? `, ${e.holdSeconds}s hold` : "") +
            `, ${e.durationMinutes} min` +
            (e.description ? `\n  Description: ${e.description}` : "") +
            (e.contraindications ? `\n  Contraindications: ${e.contraindications}` : "")
        )
        .join("\n")
    : "No exercises have been added to this plan yet.";

  const otherConditions = ctx.otherAilments.length > 0
    ? ctx.otherAilments
        .map(
          (a) =>
            `- ${a.name} (${a.bodyRegion}, severity: ${a.severity}, status: ${a.status})` +
            (a.diagnosis ? `\n  Diagnosis: ${a.diagnosis}` : "")
        )
        .join("\n")
    : "No other conditions on record.";

  return `Review this treatment plan:

CONDITION: ${ctx.ailmentName}
Body region: ${ctx.bodyRegion}
Severity: ${ctx.severity}
${ctx.diagnosis ? `Diagnosis: ${ctx.diagnosis}` : ""}

PLAN: "${ctx.planTitle}"
${ctx.prescribedBy ? `Prescribed by: ${ctx.prescribedBy}` : ""}
Frequency: ${ctx.frequency}

EXERCISES IN THIS PLAN:
${exerciseList}

${ctx.rawContent ? `RAW PLAN CONTENT (pasted by patient):\n${ctx.rawContent}\n` : ""}
PATIENT'S OTHER CONDITIONS (check for cross-condition interactions):
${otherConditions}

Provide your analysis as the specified JSON structure. Include an exerciseReview entry for each exercise ID listed above.`;
}
