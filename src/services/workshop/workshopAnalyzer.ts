/**
 * Workshop Analyzer Adapter
 *
 * Wraps the existing analysis engine and transforms output into a
 * workshop-friendly format optimized for teaching and iteration.
 *
 * Key Responsibilities:
 * - Call existing analyzeEntry() from core/analysis/engine.ts
 * - Prioritize issues (max 3-5 per iteration to avoid overwhelm)
 * - Attach teaching examples from corpus
 * - Generate reflection prompts via LLM
 * - Structure data for UI components
 * - Track iteration history and progress
 */

import { analyzeEntry } from '@/core/analysis/engine';
import { ExperienceEntry } from '@/core/types/experience';
import { DetectedIssue, CategoryIssues } from '@/core/analysis/coaching/issueDetector';
import { getBestExampleForIssue, TeachingExample } from './teachingExamples';
import {
  generateReflectionPromptsWithCache,
  ReflectionPromptSet,
} from './reflectionPrompts';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkshopIssue extends DetectedIssue {
  teachingExample: TeachingExample | null;   // Best-matched example from corpus
  reflectionPrompts?: ReflectionPromptSet;   // LLM-generated adaptive questions
  priority: number;                          // 1-5, lower = more important
}

export interface DimensionScore {
  id: string;
  name: string;
  score: number;                             // 0-10
  maxScore: number;                          // Always 10
  status: 'critical' | 'needs_work' | 'good' | 'excellent';
  weight: number;                            // Contribution to NQI
  issueCount: number;                        // How many issues in this dimension
}

export interface WorkshopAnalysisResult {
  // Overall scoring
  overallScore: number;                      // NQI 0-100
  scoreTier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
  readerImpression: string;                  // Human-readable label

  // Issues (prioritized and enriched)
  topIssues: WorkshopIssue[];                // Max 3-5 issues to focus on
  allIssues: WorkshopIssue[];                // Full list for reference

  // Dimensions (all 11 rubric axes)
  dimensions: DimensionScore[];

  // Quick summary for UI header
  quickSummary: string;                      // One-line diagnosis

  // Metadata
  analysisId: string;
  timestamp: string;
  performance: {
    analysisMs: number;
    teachingExamplesMs: number;
    reflectionPromptsMs: number;
    totalMs: number;
  };
}

export interface WorkshopAnalysisOptions {
  depth?: 'quick' | 'standard' | 'comprehensive';
  maxIssues?: number;                        // Max issues to return (default: 5)
  generateReflectionPrompts?: boolean;       // Generate LLM prompts? (default: true)
  reflectionTone?: 'mentor' | 'coach' | 'curious_friend'; // Tone for prompts
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze an extracurricular entry for workshop use
 *
 * Returns enriched analysis with teaching examples and reflection prompts
 */
export async function analyzeForWorkshop(
  entry: ExperienceEntry,
  options: WorkshopAnalysisOptions = {}
): Promise<WorkshopAnalysisResult> {
  const startTime = Date.now();

  const {
    depth = 'standard',
    maxIssues = 5,
    generateReflectionPrompts: shouldGeneratePrompts = true,
    reflectionTone = 'mentor',
  } = options;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`WORKSHOP ANALYSIS: ${entry.title}`);
  console.log(`Depth: ${depth}, Max Issues: ${maxIssues}`);
  console.log(`${'='.repeat(80)}\n`);

  // ============================================================================
  // STEP 1: Run core analysis engine
  // ============================================================================

  console.log('Step 1: Running core analysis engine...');
  const analysisStart = Date.now();

  const analysis = await analyzeEntry(entry, {
    depth,
    skip_coaching: false, // We need coaching for issues
  });

  const analysisMs = Date.now() - analysisStart;
  console.log(`✓ Analysis complete (${analysisMs}ms)`);
  console.log(`  NQI: ${analysis.report.narrative_quality_index}/100`);
  console.log(`  Issues detected: ${analysis.coaching?.overall.total_issues || 0}\n`);

  // ============================================================================
  // STEP 2: Prioritize and enrich issues
  // ============================================================================

  console.log('Step 2: Prioritizing and enriching issues...');
  const enrichStart = Date.now();

  const allIssues = await enrichIssuesWithTeaching(
    analysis.coaching?.categories || [],
    entry
  );

  // Prioritize issues (critical first, then important, then helpful)
  const prioritizedIssues = prioritizeIssues(allIssues, maxIssues);

  const enrichMs = Date.now() - enrichStart;
  console.log(`✓ Issues enriched (${enrichMs}ms)`);
  console.log(`  Top issues: ${prioritizedIssues.length}`);
  console.log(`  All issues: ${allIssues.length}\n`);

  // ============================================================================
  // STEP 3: Generate reflection prompts (LLM)
  // ============================================================================

  let promptsMs = 0;
  if (shouldGeneratePrompts && prioritizedIssues.length > 0) {
    console.log('Step 3: Generating reflection prompts (LLM)...');
    const promptsStart = Date.now();

    await generatePromptsForIssues(prioritizedIssues, entry, reflectionTone);

    promptsMs = Date.now() - promptsStart;
    console.log(`✓ Prompts generated (${promptsMs}ms)\n`);
  } else {
    console.log('Step 3: Skipping reflection prompts (disabled or no issues)\n');
  }

  // ============================================================================
  // STEP 4: Build dimension scores
  // ============================================================================

  console.log('Step 4: Building dimension scores...');
  const dimensions = buildDimensionScores(
    analysis.report.categories,
    analysis.report.weights,
    analysis.coaching?.categories || []
  );
  console.log(`✓ ${dimensions.length} dimensions mapped\n`);

  // ============================================================================
  // STEP 5: Assemble workshop result
  // ============================================================================

  const totalMs = Date.now() - startTime;

  const result: WorkshopAnalysisResult = {
    overallScore: analysis.report.narrative_quality_index,
    scoreTier: getScoreTier(analysis.report.narrative_quality_index),
    readerImpression: analysis.report.reader_impression_label,
    topIssues: prioritizedIssues,
    allIssues,
    dimensions,
    quickSummary: generateQuickSummary(
      analysis.report.narrative_quality_index,
      getScoreTier(analysis.report.narrative_quality_index),
      prioritizedIssues.length
    ),
    analysisId: analysis.report.id || `workshop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    performance: {
      analysisMs,
      teachingExamplesMs: enrichMs,
      reflectionPromptsMs: promptsMs,
      totalMs,
    },
  };

  console.log(`${'='.repeat(80)}`);
  console.log(`WORKSHOP ANALYSIS COMPLETE`);
  console.log(`NQI: ${result.overallScore}/100 (${result.scoreTier})`);
  console.log(`Top Issues: ${result.topIssues.length}`);
  console.log(`Total Time: ${totalMs}ms`);
  console.log(`${'='.repeat(80)}\n`);

  return result;
}

// ============================================================================
// ISSUE ENRICHMENT
// ============================================================================

/**
 * Enrich detected issues with teaching examples from corpus
 */
async function enrichIssuesWithTeaching(
  categoryIssues: CategoryIssues[],
  entry: ExperienceEntry
): Promise<WorkshopIssue[]> {
  const enrichedIssues: WorkshopIssue[] = [];

  for (const category of categoryIssues) {
    for (const issue of category.detected_issues) {
      // Find best teaching example for this issue
      const teachingExample = getBestExampleForIssue(
        issue.id,
        issue.category,
        entry.category
      );

      if (teachingExample) {
        console.log(`  ✓ Found teaching example for: ${issue.title}`);
      } else {
        console.log(`  ⚠ No teaching example for: ${issue.title} (will use fix strategies only)`);
      }

      enrichedIssues.push({
        ...issue,
        teachingExample,
        priority: 0, // Will be set in prioritizeIssues()
      });
    }
  }

  return enrichedIssues;
}

/**
 * Prioritize issues by severity and impact
 * Returns top N issues to focus on (avoids overwhelming user)
 */
function prioritizeIssues(issues: WorkshopIssue[], maxIssues: number): WorkshopIssue[] {
  // Scoring system:
  // - Critical: 100 points
  // - Important: 50 points
  // - Helpful: 25 points
  // - Has teaching example: +10 points

  const scored = issues.map(issue => ({
    issue,
    score:
      (issue.severity === 'critical' ? 100 :
       issue.severity === 'important' ? 50 : 25) +
      (issue.teachingExample ? 10 : 0),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign priority (1 = highest)
  const prioritized = scored.map((item, idx) => ({
    ...item.issue,
    priority: idx + 1,
  }));

  // Return top N
  return prioritized.slice(0, maxIssues);
}

/**
 * Generate reflection prompts for all prioritized issues in parallel
 */
async function generatePromptsForIssues(
  issues: WorkshopIssue[],
  entry: ExperienceEntry,
  tone: 'mentor' | 'coach' | 'curious_friend'
): Promise<void> {
  // Generate prompts in parallel for speed
  const promptPromises = issues.map(issue =>
    generateReflectionPromptsWithCache(issue, entry, {
      tone,
      depth: issue.severity === 'critical' ? 'deep' : 'surface',
    })
  );

  const promptSets = await Promise.all(promptPromises);

  // Attach prompts to issues
  promptSets.forEach((promptSet, idx) => {
    issues[idx].reflectionPrompts = promptSet;
    console.log(`    ✓ Prompts for: ${issues[idx].title}`);
  });
}

// ============================================================================
// DIMENSION SCORING
// ============================================================================

/**
 * Build dimension scores from rubric categories
 */
function buildDimensionScores(
  categories: Array<{
    name: string;
    score_0_to_10: number;
    evidence_snippets: string[];
    evaluator_notes: string;
  }>,
  weights: Record<string, number>,
  categoryIssues: CategoryIssues[]
): DimensionScore[] {
  return categories.map(cat => {
    const status = getStatusForScore(cat.score_0_to_10);
    const weight = weights[cat.name] || 0;

    // Count issues in this category
    const matchingCategory = categoryIssues.find(
      ci => ci.category_name === cat.name || ci.category_key === cat.name
    );
    const issueCount = matchingCategory?.issues_count || 0;

    return {
      id: cat.name,
      name: cat.name,
      score: cat.score_0_to_10,
      maxScore: 10,
      status,
      weight,
      issueCount,
    };
  });
}

function getStatusForScore(score: number): 'critical' | 'needs_work' | 'good' | 'excellent' {
  if (score >= 8) return 'excellent';
  if (score >= 6.5) return 'good';
  if (score >= 4) return 'needs_work';
  return 'critical';
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

function generateQuickSummary(nqi: number, tier: string, issueCount: number): string {
  if (tier === 'excellent') {
    return `Strong narrative! ${issueCount} minor polish opportunities.`;
  }
  if (tier === 'strong') {
    return `Solid foundation. Address ${issueCount} issues to reach excellent tier (80+).`;
  }
  if (tier === 'good') {
    return `Decent narrative with room to grow. Focus on ${issueCount} key improvements.`;
  }
  if (tier === 'needs_work') {
    return `Major improvements needed. Start with the ${Math.min(3, issueCount)} critical issues.`;
  }
  return `Significant strengthening recommended. Focus on authenticity and specificity first.`;
}

// ============================================================================
// RE-ANALYSIS & DELTA CALCULATION
// ============================================================================

/**
 * Re-analyze after user edits and calculate delta (improvement)
 */
export interface WorkshopDelta {
  before: WorkshopAnalysisResult;
  after: WorkshopAnalysisResult;
  overallDelta: number;                      // NQI change
  dimensionDeltas: Array<{
    name: string;
    before: number;
    after: number;
    delta: number;
    improved: boolean;
  }>;
  issuesResolved: string[];                  // Issue IDs that are now fixed
  issuesRemaining: string[];                 // Issue IDs still present
  celebrationMessage: string;                // Encouraging feedback
}

export async function analyzeAndCompare(
  entry: ExperienceEntry,
  previousAnalysis: WorkshopAnalysisResult,
  options: WorkshopAnalysisOptions = {}
): Promise<WorkshopDelta> {
  console.log('\n🔄 RE-ANALYZING for iteration comparison...\n');

  // Run fresh analysis
  const afterAnalysis = await analyzeForWorkshop(entry, options);

  // Calculate deltas
  const overallDelta = afterAnalysis.overallScore - previousAnalysis.overallScore;

  const dimensionDeltas = afterAnalysis.dimensions.map(afterDim => {
    const beforeDim = previousAnalysis.dimensions.find(d => d.id === afterDim.id);
    const beforeScore = beforeDim?.score || 0;
    const delta = afterDim.score - beforeScore;

    return {
      name: afterDim.name,
      before: beforeScore,
      after: afterDim.score,
      delta,
      improved: delta > 0,
    };
  });

  // Identify resolved issues (present before, not present after)
  const beforeIssueIds = new Set(previousAnalysis.topIssues.map(i => i.id));
  const afterIssueIds = new Set(afterAnalysis.topIssues.map(i => i.id));

  const issuesResolved = previousAnalysis.topIssues
    .filter(issue => !afterIssueIds.has(issue.id))
    .map(issue => issue.id);

  const issuesRemaining = afterAnalysis.topIssues.map(i => i.id);

  // Generate celebration message
  const celebrationMessage = generateCelebrationMessage(
    overallDelta,
    issuesResolved.length,
    afterAnalysis.scoreTier
  );

  console.log(`\n📊 DELTA SUMMARY:`);
  console.log(`  NQI: ${previousAnalysis.overallScore} → ${afterAnalysis.overallScore} (${overallDelta > 0 ? '+' : ''}${overallDelta})`);
  console.log(`  Issues resolved: ${issuesResolved.length}`);
  console.log(`  Issues remaining: ${issuesRemaining.length}`);
  console.log(`  Message: ${celebrationMessage}\n`);

  return {
    before: previousAnalysis,
    after: afterAnalysis,
    overallDelta,
    dimensionDeltas,
    issuesResolved,
    issuesRemaining,
    celebrationMessage,
  };
}

function generateCelebrationMessage(
  delta: number,
  issuesResolved: number,
  tier: string
): string {
  if (delta >= 20) {
    return `🚀 Incredible! You jumped ${delta} points! ${issuesResolved} issues resolved.`;
  }
  if (delta >= 10) {
    return `🎉 Great progress! +${delta} points. ${issuesResolved} issues fixed.`;
  }
  if (delta >= 5) {
    return `✨ Nice work! +${delta} points. Keep going!`;
  }
  if (delta > 0) {
    return `👍 Small improvement (+${delta}). ${issuesResolved > 0 ? `Fixed ${issuesResolved} issue(s).` : 'Keep refining!'}`;
  }
  if (delta === 0) {
    return `⏸️ No score change yet. Try applying the suggested fixes.`;
  }
  return `⚠️ Score decreased by ${Math.abs(delta)}. You may have removed important details. Check what changed.`;
}
