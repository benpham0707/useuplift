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
    selectivity: {
      excellent: "Excellent! Your draft clearly establishes selectivity context with specific acceptance rates or pool sizes.",
      good: "Good foundation. You mention the recognition, but could strengthen by adding more competitive context.",
      needs_work: "Your draft mentions the recognition but doesn't establish how selective it was. Officers need acceptance rates or pool sizes to quickly calibrate rigor.",
      critical: "Critical: No selectivity context provided. Without competitive metrics, officers can't gauge the prestige of this recognition."
    },
    theme: {
      excellent: "Perfect! Your narrative theme is explicitly stated and the connection to this recognition is crystal clear.",
      good: "Good thematic connection. The link to your academic narrative is present but could be more explicit for quick scanning.",
      needs_work: "Your draft hints at your theme but doesn't explicitly name it. Officers shouldn't have to infer connections.",
      critical: "Critical: No clear thematic connection. Officers can't see how this fits your broader academic narrative."
    },
    causality: {
      excellent: "Excellent causal structure! Your actions are clearly connected to measurable outcomes with strong cause-effect language.",
      good: "Good impact demonstration. You show outcomes, but could strengthen cause-effect connections with phrases like 'which led to' or 'resulting in'.",
      needs_work: "Your draft lists actions and results separately but doesn't connect them causally. Officers need to see: 'I did X, which led to Y.'",
      critical: "Critical: No clear causality. Officers can't tell if your actions actually caused the outcomes mentioned."
    },
    evidence: {
      excellent: "Outstanding specificity! Your draft uses concrete numbers, precise language, and avoids vague claims.",
      good: "Good use of evidence. You include some metrics, but could eliminate remaining buzzwords and add more hard numbers.",
      needs_work: "Your draft relies on adjectives and vague language instead of concrete evidence. Replace evaluative words with specific metrics.",
      critical: "Critical: Heavy use of buzzwords without supporting data. Admissions officers prefer concrete metrics over evaluative language."
    },
    reflection: {
      excellent: "Excellent metacognition! Your reflection demonstrates intellectual growth and forward-looking insight.",
      good: "Good reflection present. You show some learning, but could deepen the metacognitive insight about what you discovered.",
      needs_work: "Your draft describes what you did and the results, but doesn't include reflection about what you learned or how you grew.",
      critical: "Critical: No reflection or learning narrative. You're missing an opportunity to demonstrate intellectual maturity and self-awareness."
    }
  };
  
  const statusKey = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'needs_work' : 'critical';
  return overviews[dimensionId]?.[statusKey] || `${issueCount} issue${issueCount !== 1 ? 's' : ''} detected in this dimension.`;
}
