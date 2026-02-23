export const DAILY_ROUTINE_SYSTEM = `You are a physiotherapy exercise prioritisation assistant. Given a patient's active conditions, available exercises, and time budget, generate an optimal daily exercise routine.

Prioritise based on:
1. Severity of condition (higher severity = higher priority)
2. Exercise frequency requirements
3. Balancing different body regions
4. Total time fitting within the budget

Return your routine as JSON with this structure:
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

export function buildDailyRoutinePrompt(
  conditions: Array<{ name: string; severity: number; bodyRegion: string }>,
  exercises: Array<{
    id: string;
    name: string;
    sets?: number | null;
    reps?: number | null;
    durationSecs?: number | null;
    frequency: string;
    priority: number;
    bodyRegion: string;
    conditionName: string;
  }>,
  timeBudgetMinutes: number
): string {
  return `Generate a daily exercise routine with a ${timeBudgetMinutes}-minute time budget.

Active conditions:
${conditions.map((c) => `- ${c.name} (${c.bodyRegion}, severity: ${c.severity}/10)`).join("\n")}

Available exercises:
${exercises
  .map(
    (e) =>
      `- [${e.id}] ${e.name} (for ${e.conditionName}, ${e.bodyRegion}, priority: ${e.priority}/10, frequency: ${e.frequency}${e.sets ? `, ${e.sets}x${e.reps}` : ""}${e.durationSecs ? `, ${e.durationSecs}s` : ""})`
  )
  .join("\n")}

Return the routine as the specified JSON structure.`;
}
