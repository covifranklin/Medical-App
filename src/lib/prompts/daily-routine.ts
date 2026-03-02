export const DAILY_PLAN_SYSTEM = `You are a physiotherapy exercise prioritisation assistant. Given a patient's active ailments, available exercises from their treatment plans, today's pain levels, and a strict time budget, generate an optimal daily exercise routine.

## Prioritisation Rules (in order)

1. **Flare-ups first**: If today's pain for an ailment is notably higher than its 7-day average, that ailment's exercises get top priority regardless of other factors.
2. **User priority**: Respect the user's per-ailment priority settings (HIGH > MEDIUM > LOW).
3. **Goal timeframe**: ACUTE_RELIEF exercises before THIS_WEEK, before THIS_MONTH, before MAINTENANCE.
4. **Weekly focus areas**: If the user has set focus areas for this week, boost exercises targeting those regions.
5. **Severity weighting**: Higher severity ailments get more time allocation.
6. **Weekly rotation**: Check what was done in the last 7 days. Avoid repeating the same heavy routine daily — rotate regions across the week so every ailment gets attention but not every day.
7. **Frequency compliance**: Respect each exercise's frequencyPerWeek. Don't schedule a 3x/week exercise 7 days in a row.
8. **Contraindications**: NEVER include an exercise if its contraindications conflict with the patient's current conditions or today's flare-ups.

## Structure Rules

- **Always include a 2-3 minute warm-up note** at the start (general mobility).
- **Always include a 2 minute cool-down note** at the end (gentle stretching).
- The warm-up and cool-down count toward the time budget.
- **Stay strictly within the time budget**. It is better to do fewer exercises well than to rush.
- Order exercises logically: warm-up → main exercises (most important first) → cool-down.

## Response Format

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "warmUp": "Brief warm-up instructions (2-3 min)",
  "exercises": [
    {
      "exerciseId": "uuid",
      "order": 1,
      "sets": 3,
      "reps": 10,
      "holdSeconds": null,
      "estimatedMinutes": 5,
      "reason": "Why this was included today",
      "targetAilment": "Name of the ailment this targets"
    }
  ],
  "coolDown": "Brief cool-down instructions (2 min)",
  "totalMinutes": 25,
  "skippedExercises": [
    {
      "exerciseId": "uuid",
      "exerciseName": "Name",
      "reason": "Why deprioritised today",
      "suggestedReturn": "Tomorrow / Wednesday / In 2 days"
    }
  ],
  "notes": "Any general advice, observations, or warnings for today"
}`;

export interface DailyPlanContext {
  dayOfWeek: string;
  timeBudgetMinutes: number;
  weeklyFocusAreas: string[];
  ailments: Array<{
    name: string;
    bodyRegion: string;
    severityLevel: string;
    priorityLevel: string;
    goalTimeframe: string;
    todayPainLevel: number | null;
    avgPainLevel7d: number | null;
  }>;
  exercises: Array<{
    id: string;
    name: string;
    description: string | null;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    durationMinutes: number;
    frequencyPerWeek: number | null;
    bodyRegion: string;
    contraindications: string | null;
    ailmentName: string;
    planFrequency: string;
  }>;
  recentHistory: Array<{
    date: string;
    exerciseNames: string[];
    bodyRegionsWorked: string[];
  }>;
  todayPainLogs: Array<{
    ailmentName: string;
    painLevel: number;
    notes: string | null;
  }>;
}

export function buildDailyPlanPrompt(ctx: DailyPlanContext): string {
  const flareUps = ctx.ailments.filter(
    (a) =>
      a.todayPainLevel !== null &&
      a.avgPainLevel7d !== null &&
      a.todayPainLevel >= a.avgPainLevel7d + 2
  );

  let prompt = `Generate a daily exercise plan for **${ctx.dayOfWeek}** with a strict **${ctx.timeBudgetMinutes}-minute** time budget (including warm-up and cool-down).

## Active Ailments
${ctx.ailments
  .map(
    (a) =>
      `- **${a.name}** (${a.bodyRegion}, severity: ${a.severityLevel}, priority: ${a.priorityLevel}, goal: ${a.goalTimeframe})${a.todayPainLevel !== null ? ` — today's pain: ${a.todayPainLevel}/10` : ""}${a.avgPainLevel7d !== null ? ` (7-day avg: ${a.avgPainLevel7d.toFixed(1)})` : ""}`
  )
  .join("\n")}`;

  if (flareUps.length > 0) {
    prompt += `

## FLARE-UP ALERT
The following ailments have pain notably above their 7-day average. Prioritise their exercises:
${flareUps.map((a) => `- **${a.name}**: today ${a.todayPainLevel}/10 vs avg ${a.avgPainLevel7d!.toFixed(1)}`).join("\n")}`;
  }

  if (ctx.weeklyFocusAreas.length > 0) {
    prompt += `

## Weekly Focus Areas
User has prioritised these regions this week: ${ctx.weeklyFocusAreas.join(", ")}`;
  }

  if (ctx.todayPainLogs.length > 0) {
    prompt += `

## Today's Pain Logs
${ctx.todayPainLogs.map((l) => `- ${l.ailmentName}: ${l.painLevel}/10${l.notes ? ` (${l.notes})` : ""}`).join("\n")}`;
  }

  prompt += `

## Available Exercises
${ctx.exercises
  .map(
    (e) =>
      `- [${e.id}] **${e.name}** (for ${e.ailmentName}, ${e.bodyRegion}, ~${e.durationMinutes}min, plan frequency: ${e.planFrequency}${e.frequencyPerWeek ? `, ${e.frequencyPerWeek}x/week` : ""}${e.sets ? `, ${e.sets}x${e.reps ?? "?"}` : ""}${e.holdSeconds ? `, hold ${e.holdSeconds}s` : ""}${e.contraindications ? `, CONTRAINDICATED: ${e.contraindications}` : ""})`
  )
  .join("\n")}`;

  if (ctx.recentHistory.length > 0) {
    prompt += `

## Last 7 Days Exercise History
${ctx.recentHistory.map((d) => `- ${d.date}: ${d.exerciseNames.join(", ")} (regions: ${d.bodyRegionsWorked.join(", ")})`).join("\n")}`;
  } else {
    prompt += `

## Last 7 Days Exercise History
No exercises recorded in the last 7 days. This is the first plan.`;
  }

  prompt += `

Generate the daily plan as the specified JSON structure. Remember: stay within ${ctx.timeBudgetMinutes} minutes strictly.`;

  return prompt;
}
