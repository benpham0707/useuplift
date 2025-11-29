// @ts-nocheck - Service file with type mismatches
/**
 * Chat Context Aggregator
 *
 * Builds comprehensive context for the AI chat assistant by aggregating:
 * - Student's portfolio/activity data
 * - Current workshop state (draft, scores, analysis)
 * - Version history and improvement trends
 * - Teaching issues and examples
 * - Reflection prompt progress
 * - Generation insights
 *
 * This context enables the chat to provide deeply personalized,
 * context-aware coaching that leverages our entire analysis and
 * generation system.
 */

import { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';
import { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { TeachingCoachingOutput, TeachingIssue } from '@/components/portfolio/extracurricular/workshop/teachingTypes';
import { ReflectionPromptSet } from './reflectionPrompts';
import { EssayVersion, getVersionHistorySummary, getVersions } from '@/components/portfolio/extracurricular/workshop/versioningSystem';
import { RewriteCandidate } from './workshopGenerator';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Comprehensive context about student's workshop session
 */
export interface WorkshopChatContext {
  // Student Activity Context
  activity: {
    name: string;
    role: string;
    category: string;
    timeCommitment: {
      hoursPerWeek: number;
      weeksPerYear: number;
      totalHours: number;
    };
    duration: string;
    organization: string;

    // Pre-existing portfolio analysis
    portfolioScores?: {
      portfolioContribution?: number;
      commitment?: number;
      impact?: number;
    };

    // Strategic context
    recommendedUse?: 'centerpiece' | 'supporting' | 'breadth' | 'optional';
    whyItMatters?: string;

    // Pre-existing strengths/improvements identified
    descriptionAnalysis?: {
      strengths: string[];
      improvements: string[];
    };
  };

  // Current Workshop State
  currentState: {
    draft: string;
    wordCount: number;
    charCount: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  };

  // Analysis Results
  analysis: {
    nqi: number;
    initialNqi: number;
    delta: number;
    tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
    label: string; // reader_impression_label

    // Rubric breakdown (11 dimensions)
    categories: Array<{
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
      status: 'excellent' | 'good' | 'needs_work' | 'critical';
      comments: string[];
      suggestions: string[];
    }>;

    // Weak categories (< 70%)
    weakCategories: Array<{
      name: string;
      score: number;
      gap: number; // Points below 7/10
    }>;

    // Authenticity
    authenticity: {
      score: number;
      voiceType: string;
      redFlags: string[];
      greenFlags: string[];
    };

    // Elite patterns
    elitePatterns?: {
      overallScore: number;
      tier: 1 | 2 | 3;
      strengths: string[];
      gaps: string[];
    };
  };

  // Teaching Issues
  teaching: {
    topIssues: Array<{
      id: string;
      title: string;
      category: string;
      severity: 'critical' | 'important' | 'helpful';
      fromDraft: string;
      problem: string;
      whyMatters: string;
      impactOnScore: string;
      suggestions: string[];
      hasExample: boolean;
      hasReflectionPrompts: boolean;
    }>;

    quickWins: Array<{
      title: string;
      effort: string;
      impact: string;
    }>;

    strategicGuidance: {
      strengths: string[];
      criticalGaps: string[];
      recommendedOrder: string[];
    };
  };

  // Version History
  history: {
    totalVersions: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
    nqiDelta: number;
    percentChange: number;

    // Timeline of versions
    timeline: Array<{
      version: number;
      timestamp: number;
      nqi: number;
      note?: string;
    }>;

    // Best version ever achieved
    bestVersion?: {
      nqi: number;
      timestamp: number;
    };
  };

  // Reflection Progress
  reflection: {
    activeReflections: Array<{
      issueId: string;
      issueTitle: string;
      prompts: Array<{
        id: string;
        question: string;
        answer?: string;
        isAnswered: boolean;
      }>;
    }>;

    completedCount: number;
    totalCount: number;
    completionPercentage: number;
  };

  // Generation Insights (if available)
  generation?: {
    candidates: Array<{
      style: string;
      estimatedScoreGain: number;
      keyImprovements: string[];
    }>;
    bestCandidate?: {
      style: string;
      estimatedNqi: number;
    };
  };
}

/**
 * Lightweight context for quick questions (no full analysis)
 */
export interface QuickChatContext {
  activityName: string;
  activityCategory: string;
  currentDraft: string;
  currentScore?: number;
}

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Build comprehensive workshop chat context
 */
export function buildWorkshopChatContext(
  activity: ExtracurricularItem,
  currentDraft: string,
  analysisResult: AnalysisResult | null,
  teachingCoaching: TeachingCoachingOutput | null,
  options: {
    currentScore: number;
    initialScore: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
    reflectionPromptsMap?: Map<string, ReflectionPromptSet>;
    reflectionAnswers?: Record<string, Record<string, string>>;
    generationCandidates?: RewriteCandidate[];
  }
): WorkshopChatContext {
  // Build activity context
  const activityContext = buildActivityContext(activity);

  // Build current state
  const currentState = {
    draft: currentDraft,
    wordCount: currentDraft.split(/\s+/).filter(Boolean).length,
    charCount: currentDraft.length,
    hasUnsavedChanges: options.hasUnsavedChanges,
    needsReanalysis: options.needsReanalysis,
  };

  // Build analysis context
  const analysisContext = buildAnalysisContext(
    analysisResult,
    options.currentScore,
    options.initialScore
  );

  // Build teaching context
  const teachingContext = buildTeachingContext(teachingCoaching);

  // Build history context
  const historyContext = buildHistoryContext(activity);

  // Build reflection context
  const reflectionContext = buildReflectionContext(
    options.reflectionPromptsMap,
    options.reflectionAnswers,
    teachingCoaching
  );

  // Build generation context (if available)
  const generationContext = options.generationCandidates
    ? buildGenerationContext(options.generationCandidates)
    : undefined;

  return {
    activity: activityContext,
    currentState,
    analysis: analysisContext,
    teaching: teachingContext,
    history: historyContext,
    reflection: reflectionContext,
    generation: generationContext,
  };
}

/**
 * Build activity context from ExtracurricularItem
 */
function buildActivityContext(activity: ExtracurricularItem) {
  const totalHours = (activity.hoursPerWeek || 0) * (activity.weeksPerYear || 0);

  return {
    name: activity.name,
    role: activity.role,
    category: activity.category,
    timeCommitment: {
      hoursPerWeek: activity.hoursPerWeek || 0,
      weeksPerYear: activity.weeksPerYear || 0,
      totalHours,
    },
    duration: activity.dateRange
      ? `${activity.dateRange.start} to ${activity.dateRange.end}`
      : 'Not specified',
    organization: activity.organization || 'N/A',

    // Portfolio scores (if available)
    portfolioScores: activity.scores
      ? {
          portfolioContribution: activity.scores.portfolioContribution?.overall,
          commitment: activity.scores.commitment?.overall,
          impact: activity.scores.impact?.overall,
        }
      : undefined,

    // Strategic context
    recommendedUse: activity.recommendedUse,
    whyItMatters: activity.applicationGuidance?.whyItMatters,

    // Pre-existing analysis
    descriptionAnalysis: activity.applicationGuidance?.descriptionAnalysis,
  };
}

/**
 * Build analysis context from AnalysisResult
 */
function buildAnalysisContext(
  analysisResult: AnalysisResult | null,
  currentScore: number,
  initialScore: number
) {
  if (!analysisResult) {
    return {
      nqi: currentScore,
      initialNqi: initialScore,
      delta: currentScore - initialScore,
      tier: getScoreTier(currentScore),
      label: 'Not analyzed yet',
      categories: [],
      weakCategories: [],
      authenticity: {
        score: 0,
        voiceType: 'unknown',
        redFlags: [],
        greenFlags: [],
      },
    };
  }

  // Use rubricDimensionDetails from backend (not analysis.categories)
  const categories = (analysisResult.rubricDimensionDetails || []).map(dim => {
    const percentage = (dim.final_score / 10) * 100;
    return {
      name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: dim.final_score,
      maxScore: 10,
      percentage,
      status: getStatusForPercentage(percentage),
      comments: dim.evidence?.weaknesses || [],
      suggestions: dim.evidence?.strengths || [],
    };
  });

  // Identify weak categories (< 70%)
  const weakCategories = categories
    .filter(cat => cat.percentage < 70)
    .map(cat => ({
      name: cat.name,
      score: cat.score,
      gap: 7 - cat.score, // Gap to reach 7/10
    }))
    .sort((a, b) => b.gap - a.gap); // Worst first

  return {
    nqi: currentScore,
    initialNqi: initialScore,
    delta: currentScore - initialScore,
    tier: getScoreTier(currentScore),
    label: analysisResult.analysis?.reader_impression_label || 'In Progress',
    categories,
    weakCategories,
    authenticity: {
      score: analysisResult.authenticity?.authenticity_score || 0,
      voiceType: analysisResult.authenticity?.voice_type || 'unknown',
      redFlags: analysisResult.authenticity?.red_flags || [],
      greenFlags: analysisResult.authenticity?.green_flags || [],
    },
    elitePatterns: analysisResult.elite_patterns
      ? {
          overallScore: analysisResult.elite_patterns.overallScore,
          tier: analysisResult.elite_patterns.tier,
          strengths: analysisResult.elite_patterns.strengths,
          gaps: analysisResult.elite_patterns.gaps,
        }
      : undefined,
  };
}

/**
 * Build teaching context from TeachingCoachingOutput
 */
function buildTeachingContext(teachingCoaching: TeachingCoachingOutput | null) {
  if (!teachingCoaching) {
    return {
      topIssues: [],
      quickWins: [],
      strategicGuidance: {
        strengths: [],
        criticalGaps: [],
        recommendedOrder: [],
      },
    };
  }

  const topIssues = teachingCoaching.teaching_issues.map(issue => ({
    id: issue.id,
    title: issue.problem?.title || 'Issue',
    category: issue.category,
    severity: issue.severity,
    fromDraft: issue.problem?.from_draft || ''',
    problem: issue.problem?.description || 'Issue detected',
    whyMatters: issue.principle?.why_officers_care || 'Improve essay',
    impactOnScore: issue.problem?.impact_on_score || 'medium',
    suggestions: issue.examples?.map(ex => ex.explanation),
    hasExample: (issue.examples?.length || 0) > 0,
    hasReflectionPrompts: (issue.reflection_prompts?.length || 0) > 0,
  }));

  const quickWins = teachingCoaching.quick_wins.map(win => ({
    title: win.title,
    effort: win.estimated_effort,
    impact: win.potential_impact,
  }));

  return {
    topIssues,
    quickWins,
    strategicGuidance: {
      strengths: teachingCoaching.strategy.strengths_to_maintain,
      criticalGaps: teachingCoaching.strategy.critical_gaps,
      recommendedOrder: teachingCoaching.strategy.learning_path,
    },
  };
}

/**
 * Build history context from version tracking
 */
function buildHistoryContext(activity: ExtracurricularItem) {
  const versions = getVersions(activity.id);
  const summary = getVersionHistorySummary(activity);

  if (versions.length === 0) {
    return {
      totalVersions: 0,
      improvementTrend: 'stable' as const,
      nqiDelta: 0,
      percentChange: 0,
      timeline: [],
    };
  }

  // Find best version
  const bestVersion = versions.reduce((best, v) =>
    v.analysis.nqi > best.analysis.nqi ? v : best
  );

  // Build timeline
  const timeline = versions.map((v, idx) => ({
    version: idx + 1,
    timestamp: v.timestamp,
    nqi: v.analysis.nqi,
    note: v.note,
  }));

  return {
    totalVersions: summary.totalVersions,
    improvementTrend: summary.improvement.direction,
    nqiDelta: summary.improvement.nqiDelta,
    percentChange: summary.improvement.percentChange,
    timeline,
    bestVersion: {
      nqi: bestVersion.analysis.nqi,
      timestamp: bestVersion.timestamp,
    },
  };
}

/**
 * Build reflection context
 */
function buildReflectionContext(
  reflectionPromptsMap?: Map<string, ReflectionPromptSet>,
  reflectionAnswers?: Record<string, Record<string, string>>,
  teachingCoaching?: TeachingCoachingOutput | null
) {
  if (!reflectionPromptsMap || !teachingCoaching) {
    return {
      activeReflections: [],
      completedCount: 0,
      totalCount: 0,
      completionPercentage: 0,
    };
  }

  const activeReflections: Array<{
    issueId: string;
    issueTitle: string;
    prompts: Array<{
      id: string;
      question: string;
      answer?: string;
      isAnswered: boolean;
    }>;
  }> = [];

  let completedCount = 0;
  let totalCount = 0;

  // Build reflections for each issue
  for (const issue of teachingCoaching.teaching_issues) {
    const promptSet = reflectionPromptsMap.get(issue.id);
    if (!promptSet) continue;

    const prompts = promptSet.prompts.map(prompt => {
      const answer = reflectionAnswers?.[issue.id]?.[prompt.id];
      const isAnswered = !!answer && answer.length > 0;

      if (isAnswered) completedCount++;
      totalCount++;

      return {
        id: prompt.id,
        question: prompt.question,
        answer,
        isAnswered,
      };
    });

    activeReflections.push({
      issueId: issue.id,
      issueTitle: issue.problem.title,
      prompts,
    });
  }

  return {
    activeReflections,
    completedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
  };
}

/**
 * Build generation context from rewrite candidates
 */
function buildGenerationContext(candidates: RewriteCandidate[]) {
  const bestCandidate = candidates[0]; // Already sorted by score gain

  return {
    candidates: candidates.map(c => ({
      style: c.styleLabel,
      estimatedScoreGain: c.estimatedScoreGain,
      keyImprovements: c.improvementsApplied,
    })),
    bestCandidate: bestCandidate
      ? {
          style: bestCandidate.styleLabel,
          estimatedNqi: 0, // Will be filled in by caller if available
        }
      : undefined,
  };
}

// ============================================================================
// CONTEXT FORMATTING FOR LLM
// ============================================================================

/**
 * Format context into a concise text block for LLM system prompt
 */
export function formatContextForLLM(context: WorkshopChatContext): string {
  const sections: string[] = [];

  // Activity Context
  sections.push(`**Student's Activity**: ${context.activity.name}`);
  sections.push(`**Role**: ${context.activity.role}`);
  sections.push(`**Category**: ${context.activity.category}`);
  sections.push(`**Time Commitment**: ${context.activity.timeCommitment.hoursPerWeek} hrs/week, ${context.activity.timeCommitment.weeksPerYear} weeks/year (${context.activity.timeCommitment.totalHours} total hours)`);

  if (context.activity.recommendedUse) {
    sections.push(`**Strategic Use**: ${context.activity.recommendedUse}`);
  }

  if (context.activity.whyItMatters) {
    sections.push(`**Why This Matters for Admissions**: ${context.activity.whyItMatters}`);
  }

  // Current Score
  sections.push(`\n**Current NQI Score**: ${context.analysis.nqi}/100 (${context.analysis.tier})`);
  sections.push(`**Improvement**: ${context.analysis.delta > 0 ? '+' : ''}${context.analysis.delta} points from initial score of ${context.analysis.initialNqi}`);
  sections.push(`**Reader Impression**: ${context.analysis.label}`);

  // Weak Categories
  if (context.analysis.weakCategories.length > 0) {
    sections.push(`\n**Weak Categories** (< 70%):`);
    context.analysis.weakCategories.forEach(cat => {
      sections.push(`- ${cat.name}: ${cat.score}/10 (${cat.gap.toFixed(1)} points below target)`);
    });
  }

  // Top Issues
  if (context.teaching.topIssues.length > 0) {
    sections.push(`\n**Top ${Math.min(3, context.teaching.topIssues.length)} Issues to Address**:`);
    context.teaching.topIssues.slice(0, 3).forEach((issue, idx) => {
      sections.push(`${idx + 1}. **${issue.title}** (${issue.severity})`);
      sections.push(`   - Impact: ${issue.impactOnScore}`);
      sections.push(`   - From draft: "${issue.fromDraft.substring(0, 80)}${issue.fromDraft.length > 80 ? '...' : ''}"`);
    });
  }

  // Quick Wins
  if (context.teaching.quickWins.length > 0) {
    sections.push(`\n**Quick Wins** (high impact, low effort):`);
    context.teaching.quickWins.forEach(win => {
      sections.push(`- ${win.title} (${win.effort} effort, ${win.impact} impact)`);
    });
  }

  // Strategic Guidance
  if (context.teaching.strategicGuidance.strengths.length > 0) {
    sections.push(`\n**Strengths to Maintain**:`);
    context.teaching.strategicGuidance.strengths.forEach(s => sections.push(`- ${s}`));
  }

  if (context.teaching.strategicGuidance.criticalGaps.length > 0) {
    sections.push(`\n**Critical Gaps to Address**:`);
    context.teaching.strategicGuidance.criticalGaps.forEach(g => sections.push(`- ${g}`));
  }

  // Version History
  if (context.history.totalVersions > 0) {
    sections.push(`\n**Version History**:`);
    sections.push(`- Total versions: ${context.history.totalVersions}`);
    sections.push(`- Trend: ${context.history.improvementTrend} (${context.history.nqiDelta > 0 ? '+' : ''}${context.history.nqiDelta} points, ${context.history.percentChange.toFixed(1)}%)`);

    if (context.history.bestVersion) {
      sections.push(`- Best score achieved: ${context.history.bestVersion.nqi}/100`);
    }
  }

  // Reflection Progress
  if (context.reflection.totalCount > 0) {
    sections.push(`\n**Reflection Progress**:`);
    sections.push(`- ${context.reflection.completedCount}/${context.reflection.totalCount} prompts answered (${context.reflection.completionPercentage.toFixed(0)}%)`);
  }

  // Current Draft
  sections.push(`\n**Current Draft** (${context.currentState.wordCount} words):`);
  sections.push(`"${context.currentState.draft}"`);

  // Authenticity
  if (context.analysis.authenticity.score > 0) {
    sections.push(`\n**Authenticity Analysis**:`);
    sections.push(`- Voice Type: ${context.analysis.authenticity.voiceType}`);
    sections.push(`- Authenticity Score: ${context.analysis.authenticity.score}/10`);

    if (context.analysis.authenticity.redFlags.length > 0) {
      sections.push(`- Red Flags: ${context.analysis.authenticity.redFlags.join(', ')}`);
    }

    if (context.analysis.authenticity.greenFlags.length > 0) {
      sections.push(`- Green Flags: ${context.analysis.authenticity.greenFlags.join(', ')}`);
    }
  }

  return sections.join('\n');
}

/**
 * Build quick context summary (for simple questions)
 */
export function buildQuickContext(
  activity: ExtracurricularItem,
  currentDraft: string,
  currentScore?: number
): QuickChatContext {
  return {
    activityName: activity.name,
    activityCategory: activity.category,
    currentDraft,
    currentScore,
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

function getStatusForPercentage(
  percentage: number
): 'excellent' | 'good' | 'needs_work' | 'critical' {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'needs_work';
  return 'critical';
}
