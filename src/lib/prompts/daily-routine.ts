export const DAILY_PLAN_SYSTEM = `You are a physiotherapy exercise prioritisation assistant. Given a patient's active ailments, available exercises, and time budget, generate an optimal daily exercise plan.

Prioritise based on:
1. Severity of ailment (higher severity = higher priority)
2. Exercise frequency requirements
3. Balancing different body regions
4. Total time fitting within the budget
5. Contraindications — never include exercises that conflict

Return your plan as JSON with this structure:
{
  "exercises": [
    {
      "exerciseId": "uuid",
      "order": 1,
      "estimatedMinutes": 5,
      "reason": "Brief explanation of why this was prioritised"
    }
  ],
  "totalMinutes": 25,
  "skippedExercises": [
    {
      "exerciseId": "uuid",
      "reason": "Why this was deprioritised today"
    }
  ],
  "notes": "Any general advice for today's session"
}`;

export function buildDailyPlanPrompt(
  ailments: Array<{ name: string; severityLevel: string; bodyRegion: string }>,
  exercises: Array<{
    id: string;
    name: string;
    sets?: number | null;
    reps?: number | null;
    durationMinutes: number;
    frequency: string;
    bodyRegion: string;
    contraindications?: string | null;
    ailmentName: string;
  }>,
  timeBudgetMinutes: number
): string {
  return `Generate a daily exercise plan with a ${timeBudgetMinutes}-minute time budget.

Active ailments:
${ailments.map((a) => `- ${a.name} (${a.bodyRegion}, severity: ${a.severityLevel})`).join("\n")}

Available exercises:
${exercises
  .map(
    (e) =>
      `- [${e.id}] ${e.name} (for ${e.ailmentName}, ${e.bodyRegion}, ~${e.durationMinutes}min, frequency: ${e.frequency}${e.sets ? `, ${e.sets}x${e.reps}` : ""}${e.contraindications ? `, contraindicated: ${e.contraindications}` : ""})`
  )
  .join("\n")}

Return the plan as the specified JSON structure.`;
}
