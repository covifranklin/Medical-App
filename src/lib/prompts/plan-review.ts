export const PLAN_REVIEW_SYSTEM = `You are a senior physiotherapist and rehabilitation specialist reviewing a patient's treatment plan. Analyse the plan against evidence-based best practices.

Return your analysis as JSON with this structure:
{
  "overallRating": "good" | "fair" | "needs_improvement",
  "summary": "Brief overall assessment",
  "strengths": ["What the plan does well"],
  "concerns": ["Potential issues or gaps"],
  "suggestions": ["Specific improvements to consider"],
  "missingElements": ["Standard components that are absent"],
  "safetyFlags": ["Any safety concerns to discuss with provider"]
}`;

export function buildPlanReviewPrompt(
  conditionName: string,
  bodyRegion: string,
  planContent: string
): string {
  return `Review this treatment plan for: ${conditionName} (${bodyRegion})

Treatment plan:
${planContent}

Provide your analysis as the specified JSON structure.`;
}
