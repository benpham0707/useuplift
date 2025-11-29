/**
 * Workshop Adapter - Phase 19 Integration
 *
 * Converts WorkshopIssue[] (from backend analysis) to WritingIssue[] (for UI)
 * and groups issues by dimension for the rubric display.
 *
 * This adapter enables the full Phase 19 teaching layer to replace
 * mock issue detector output when the analysis completes.
 */

import { WorkshopIssue, DimensionScore } from '@/services/workshop/workshopAnalyzer';
import { WritingIssue, EditSuggestion, RubricDimension } from './types';

// ============================================================================
// TYPE MAPPING
// ============================================================================

/**
 * Map backend apply_type to frontend EditSuggestion type
 */
function mapApplyType(
  type: 'replace' | 'add' | 'reframe' | 'elicit' | string
): 'replace' | 'insert_before' | 'insert_after' {
  switch (type) {
    case 'add':
      return 'insert_after';
    case 'reframe':
      return 'replace';
    case 'elicit':
      return 'insert_after';
    case 'replace':
    default:
      return 'replace';
  }
}

// ============================================================================
// MAIN CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert WorkshopIssue[] (backend) → WritingIssue[] (UI)
 *
 * Preserves Phase 19 teaching guidance for display in TeachingGuidanceCard.
 */
export function convertWorkshopIssuesToWritingIssues(
  workshopIssues: WorkshopIssue[]
): WritingIssue[] {
  return workshopIssues.map((issue, index) => {
    // Convert suggested_fixes to EditSuggestion format
    const suggestions: EditSuggestion[] = (issue.suggested_fixes || []).map((fix) => ({
      text: fix.fix_text,
      rationale: fix.why_this_works,
      type: mapApplyType(fix.apply_type),
    }));

    // If no suggestions from backend, create a placeholder
    if (suggestions.length === 0) {
      suggestions.push({
        text: issue.from_draft || '',
        rationale: 'Consider revising this section based on the guidance above.',
        type: 'replace',
      });
    }

    // DEBUG: Log teaching data for this issue
    console.log(`📊 [WorkshopAdapter] Issue ${index + 1}:`, {
      id: issue.id,
      title: issue.title?.substring(0, 40),
      hasTeaching: !!issue.teaching,
      hasSuggestionRationales: !!issue.teaching?.suggestionRationales,
      rationaleCount: issue.teaching?.suggestionRationales?.length || 0,
      suggestionCount: suggestions.length,
    });

    if (issue.teaching?.suggestionRationales) {
      console.log(`   ✅ Has ${issue.teaching.suggestionRationales.length} per-suggestion rationales`);
      issue.teaching.suggestionRationales.forEach((r, i) => {
        console.log(`      [${i}] ${r.whyThisWorks.length} chars - "${r.whyThisWorks.substring(0, 60)}..."`);
      });
    } else if (issue.teaching) {
      console.log(`   ⚠️  OLD TEACHING FORMAT - no suggestionRationales array (will show generic fallback)`);
    } else {
      console.log(`   ❌ No teaching data at all`);
    }

    return {
      id: issue.id || `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dimensionId: normalizeDimensionId(issue.category),
      title: issue.title || 'Writing Issue',
      excerpt: issue.from_draft || '',
      analysis: '', // Phase 19 teaching.problem.explanation replaces this
      impact: '', // Phase 19 teaching.problem.whyItMatters replaces this
      teaching: issue.teaching, // Phase 19 teaching guidance (REQUIRED)
      suggestions,
      status: 'not_fixed' as const,
      currentSuggestionIndex: 0,
      expanded: false,
    };
  });
}

/**
 * Group WritingIssue[] by dimension and build RubricDimension[]
 *
 * @param issues - Converted writing issues
 * @param dimensionScores - Dimension scores from analysis (DimensionScore[])
 */
export function groupIssuesByDimension(
  issues: WritingIssue[],
  dimensionScores: DimensionScore[]
): RubricDimension[] {
  return dimensionScores.map((dim) => {
    // Find issues belonging to this dimension
    const dimensionIssues = issues.filter((issue) => {
      const issueCategory = normalizeDimensionId(issue.dimensionId);
      const dimId = normalizeDimensionId(dim.id);
      const dimName = normalizeDimensionId(dim.name);

      return (
        issueCategory === dimId ||
        issueCategory === dimName ||
        issueCategory.includes(dimId.split('_')[0]) ||
        dimId.includes(issueCategory.split('_')[0])
      );
    });

    return {
      id: dim.id,
      name: formatDimensionName(dim.name),
      score: dim.score,
      maxScore: dim.maxScore || 10,
      status: dim.status,
      overview: generateDimensionOverview(dim.id, dim.score, dim.status),
      weight: dim.weight || 0,
      issues: dimensionIssues,
    };
  });
}

/**
 * Build complete RubricDimension[] from Phase 19 analysis results
 *
 * This is the main function called when Phase 19 analysis completes.
 * It fully replaces the mock issue detector output.
 */
export function buildDimensionsFromAnalysis(
  workshopIssues: WorkshopIssue[],
  dimensionScores: DimensionScore[]
): RubricDimension[] {
  // Step 1: Convert all issues
  const writingIssues = convertWorkshopIssuesToWritingIssues(workshopIssues);

  // Step 2: Group by dimension
  const dimensions = groupIssuesByDimension(writingIssues, dimensionScores);

  // Step 3: Ensure all dimensions with low scores have at least one issue
  return dimensions.map((dim) => {
    if (dim.score < 6 && dim.issues.length === 0) {
      // Create a placeholder issue for dimensions that need work but have no specific issues
      const placeholderIssue: WritingIssue = {
        id: `placeholder_${dim.id}`,
        dimensionId: dim.id,
        title: `Strengthen ${dim.name}`,
        excerpt: '',
        analysis: `This dimension scored ${dim.score}/10 and could benefit from strengthening.`,
        impact: `Improving ${dim.name} will enhance your overall narrative quality.`,
        suggestions: [],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false,
      };

      return {
        ...dim,
        issues: [placeholderIssue],
      };
    }

    return dim;
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize dimension ID for matching
 * Handles variations like "narrative_arc_stakes" vs "Narrative Arc & Stakes"
 */
function normalizeDimensionId(id: string): string {
  if (!id) return '';
  return id
    .toLowerCase()
    .replace(/[&_\-\s]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Format dimension name for display
 * "narrative_arc_stakes" → "Narrative Arc & Stakes"
 */
function formatDimensionName(name: string): string {
  if (!name) return 'Unknown Dimension';

  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/ And /g, ' & ');
}

/**
 * Generate overview text for a dimension based on score
 */
function generateDimensionOverview(
  dimensionId: string,
  score: number,
  status: string
): string {
  const name = formatDimensionName(dimensionId);

  if (score >= 8) {
    return `${name} is strong in your essay. Minor polish opportunities may exist.`;
  }
  if (score >= 6.5) {
    return `${name} is good but has room for improvement to reach elite status.`;
  }
  if (score >= 4) {
    return `${name} needs strengthening. Focus on the issues below for meaningful improvement.`;
  }
  return `${name} requires significant development. This is a priority area.`;
}

/**
 * Calculate overall score from dimensions (NQI 0-100 → 0-10 scale)
 */
export function calculateOverallScoreFromDimensions(
  dimensions: RubricDimension[]
): number {
  if (dimensions.length === 0) return 0;

  const totalWeight = dimensions.reduce((sum, dim) => sum + (dim.weight || 1), 0);
  const weightedSum = dimensions.reduce(
    (sum, dim) => sum + dim.score * (dim.weight || 1),
    0
  );

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
