/**
 * Coaching Module: Main entry point for generating workshop guidance
 *
 * Outputs structured data that maps directly to the UI:
 * - Overall score and issues count
 * - Category-organized issues with fixes
 * - Actionable, digestible feedback
 */

import { ExperienceEntry, AnalysisReport } from '../../types/experience';
import { AuthenticityAnalysis } from '../features/authenticityDetector';
import { ExtractedFeatures } from '../../types/experience';
import { detectAllIssues, CategoryIssues } from './issueDetector';

// ============================================================================
// MAIN COACHING OUTPUT
// ============================================================================

export interface CoachingOutput {
  // Top section (UI header)
  overall: {
    narrative_quality_index: number;  // e.g., 2.0/10 or 78/100
    score_tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
    total_issues: number;
    issues_resolved: number;  // Tracks user progress
    quick_summary: string;     // One-line diagnosis
  };

  // Main content (expandable categories)
  categories: CategoryIssues[];

  // Optional: Top 3 priorities
  top_priorities: {
    category: string;
    issue_title: string;
    impact: string;  // Why this matters most
  }[];
}

/**
 * Generate complete coaching output for the UI
 */
export function generateCoaching(
  entry: ExperienceEntry,
  report: AnalysisReport,
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures
): CoachingOutput {
  // Detect all issues across categories
  const categoryIssues = detectAllIssues(entry, report.categories, authenticity, features);

  // Calculate total issues
  const totalIssues = categoryIssues.reduce((sum, cat) => sum + cat.issues_count, 0);

  // Determine score tier
  const nqi = report.narrative_quality_index;
  const scoreTier = getScoreTier(nqi);

  // Generate quick summary
  const quickSummary = generateQuickSummary(nqi, scoreTier, totalIssues);

  // Identify top 3 priorities
  const topPriorities = identifyTopPriorities(categoryIssues);

  return {
    overall: {
      narrative_quality_index: nqi,
      score_tier: scoreTier,
      total_issues: totalIssues,
      issues_resolved: 0,  // Frontend will track this
      quick_summary: quickSummary,
    },
    categories: categoryIssues,
    top_priorities: topPriorities,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getScoreTier(nqi: number): 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak' {
  if (nqi >= 80) return 'excellent';
  if (nqi >= 70) return 'strong';
  if (nqi >= 60) return 'good';
  if (nqi >= 45) return 'needs_work';
  return 'weak';
}

function generateQuickSummary(
  nqi: number,
  tier: string,
  totalIssues: number
): string {
  if (tier === 'excellent') {
    return `Strong narrative! Address ${totalIssues} minor issues to polish to 90+.`;
  }
  if (tier === 'strong') {
    return `Solid foundation. Fix ${totalIssues} issues to reach excellent tier (80+).`;
  }
  if (tier === 'good') {
    return `Decent narrative but needs work. Focus on ${totalIssues} key issues.`;
  }
  if (tier === 'needs_work') {
    return `Major improvements needed. Start with the ${Math.min(3, totalIssues)} critical issues.`;
  }
  return `Significant rewrite recommended. Focus on authenticity and specificity first.`;
}

function identifyTopPriorities(categoryIssues: CategoryIssues[]): Array<{
  category: string;
  issue_title: string;
  impact: string;
}> {
  const allIssues: Array<{
    category: string;
    issue_title: string;
    impact: string;
    severity: 'critical' | 'important' | 'helpful';
  }> = [];

  for (const category of categoryIssues) {
    for (const issue of category.detected_issues) {
      allIssues.push({
        category: category.category_name,
        issue_title: issue.title,
        impact: issue.why_matters,
        severity: issue.severity,
      });
    }
  }

  // Sort by severity (critical first) and take top 3
  allIssues.sort((a, b) => {
    const severityOrder = { critical: 3, important: 2, helpful: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  return allIssues.slice(0, 3).map(({ category, issue_title, impact }) => ({
    category,
    issue_title,
    impact,
  }));
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { DetectedIssue, SuggestedFix, CategoryIssues } from './issueDetector';
