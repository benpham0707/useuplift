import { RubricDimension, WritingIssue } from './types';

export function getStatusFromScore(score: number): RubricDimension['status'] {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'needs_work';
  return 'critical';
}

export function calculateDimensionScore(issues: WritingIssue[]): number {
  const notFixedCount = issues.filter(i => i.status === 'not_fixed').length;
  const totalIssues = issues.length;

  if (totalIssues === 0) return 10;

  const fixedRatio = (totalIssues - notFixedCount) / totalIssues;
  return Math.round(fixedRatio * 10 * 10) / 10;
}

export function calculateOverallScore(dimensions: RubricDimension[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  dimensions.forEach(dim => {
    weightedSum += dim.score * dim.weight;
    totalWeight += dim.weight;
  });

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

export function generateDimensionOverview(
  dimensionId: string,
  score: number,
  issueCount: number
): string {
  const overviews: Record<string, Record<string, string>> = {
    commitment: {
      excellent: "Excellent! Your draft clearly establishes time commitment with specific hours/week and duration.",
      good: "Good foundation. You mention the activity, but could strengthen by adding more specific time metrics.",
      needs_work: "Your draft mentions the activity but doesn't establish how much time you invested. Officers need hours/week or total commitment to gauge depth.",
      critical: "Critical: No time commitment details provided. Without duration or intensity metrics, officers can't assess the depth of your involvement."
    },
    leadership: {
      excellent: "Perfect! Your leadership role and specific responsibilities are explicitly stated with strong action verbs.",
      good: "Good leadership indication. Your role is present but could be more explicit about what you actually led or organized.",
      needs_work: "Your draft hints at participation but doesn't clearly establish your leadership role. Officers need to see specific actions you led.",
      critical: "Critical: No clear leadership or role clarity. Officers can't tell what you actually did or led in this activity."
    },
    impact: {
      excellent: "Excellent impact demonstration! Your outcomes are quantified with specific numbers showing reach and results.",
      good: "Good impact indication. You show some outcomes, but could strengthen with more specific metrics and numbers.",
      needs_work: "Your draft mentions activities but doesn't quantify impact. Officers need numbers (people reached, % growth, measurable outcomes).",
      critical: "Critical: No quantified impact. Officers can't gauge the scale or effectiveness of your work without concrete metrics."
    },
    specificity: {
      excellent: "Outstanding specificity! Your draft uses concrete details, technical language, and avoids vague claims.",
      good: "Good use of specifics. You include some details, but could eliminate remaining buzzwords and add more concrete actions.",
      needs_work: "Your draft relies on adjectives and vague language instead of specific actions. Replace evaluative words with concrete details.",
      critical: "Critical: Heavy use of buzzwords without supporting detail. Admissions officers prefer concrete actions over evaluative language."
    },
    reflection: {
      excellent: "Excellent metacognition! Your reflection demonstrates personal growth and learning from the experience.",
      good: "Good reflection present. You show some learning, but could deepen the insight about what you discovered.",
      needs_work: "Your draft describes what you did and the results, but doesn't include reflection about what you learned or how you grew.",
      critical: "Critical: No reflection or personal growth. You're missing an opportunity to demonstrate maturity and self-awareness."
    }
  };

  const statusKey = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'needs_work' : 'critical';
  return overviews[dimensionId]?.[statusKey] || `${issueCount} issue${issueCount !== 1 ? 's' : ''} detected in this dimension.`;
}
