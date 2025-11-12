/**
 * Chat Context V2 - Comprehensive Context Aggregation
 *
 * Provides DEEP understanding of the student's narrative by aggregating:
 * - Full 11-dimension rubric analysis with specific evidence from their draft
 * - Teaching issues with examples of what strong looks like
 * - Generation system insights (what makes elite narratives excellent)
 * - Version history showing improvement patterns
 * - Reflection prompts and answers
 *
 * This powers insightful, specific coaching instead of generic advice.
 */

import type { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import type { TeachingCoachingOutput, TeachingIssue } from '@/components/portfolio/extracurricular/workshop/teachingTypes';
import type { ReflectionPromptSet } from '@/services/workshop/reflectionPrompts';
import { getVersionHistorySummary, type EssayVersion } from '@/components/portfolio/extracurricular/workshop/versioningSystem';

// ============================================================================
// COMPREHENSIVE CHAT CONTEXT
// ============================================================================

export interface WorkshopChatContext {
  // 1. ACTIVITY & STUDENT PROFILE
  activity: {
    name: string;
    role: string;
    category: string;
    timeCommitment: string;
    whyItMatters: string; // From applicationGuidance
    portfolioScores: {
      overall: number;
      commitment: number;
      impact: number;
    };
  };

  // 2. CURRENT STATE
  currentState: {
    draft: string;
    wordCount: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  };

  // 3. DEEP ANALYSIS (11 dimensions + patterns)
  analysis: {
    nqi: number;
    tier: 'captivating_grounded' | 'strong_distinct_voice' | 'solid_needs_polish' | 'patchy_narrative' | 'generic_unclear';

    // 11 rubric categories with evidence
    categories: Array<{
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
      comments: string[];
      evidence: string[]; // Actual quotes from their draft
      suggestions: string[];
    }>;

    // Weak categories (< 70%)
    weakCategories: Array<{
      name: string;
      score: number;
      gap: number; // Points away from 70%
    }>;

    // Elite patterns detected
    elitePatterns?: {
      vulnerability: { score: number; hasPhysical: boolean; examples: string[] };
      dialogue: { score: number; hasDialogue: boolean; examples: string[] };
      communityTransformation: { score: number; hasContrast: boolean };
      quantifiedImpact: { score: number; hasMetrics: boolean; metrics: string[] };
      universalInsight: { score: number; transcends: boolean };
    };

    // Authenticity analysis
    authenticity: {
      score: number;
      voiceType: 'conversational' | 'essay' | 'robotic' | 'natural';
      redFlags: string[]; // Manufactured phrases
      greenFlags: string[]; // Authentic markers
    };
  };

  // 4. TEACHING GUIDANCE (What to work on)
  teaching: {
    topIssues: Array<{
      id: string;
      title: string;
      severity: 'critical' | 'high' | 'medium';
      category: string;
      problem: string;
      impact: string;
      fromDraft?: string; // Excerpt from their essay
      principle?: {
        name: string;
        description: string;
        whyItMatters: string;
      };
      examples?: Array<{
        before: string;
        after: string;
        school?: string;
      }>;
    }>;

    quickWins: Array<{
      title: string;
      effort: string;
      potentialGain: string;
    }>;

    strategicGuidance: {
      strengths: string[];
      criticalGaps: string[];
      recommendedOrder: string[];
    };
  };

  // 5. PROGRESS HISTORY
  history: {
    totalVersions: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
    nqiDelta: number;
    percentChange: number;
    timeline: Array<{
      timestamp: number;
      nqi: number;
      note?: string;
    }>;
    bestVersion?: {
      nqi: number;
      date: string;
    };
  };

  // 6. REFLECTION CONTEXT (Active learning)
  reflection: {
    activeReflections: Map<string, ReflectionPromptSet>;
    reflectionAnswers: Record<string, Record<string, string>>;
    completedCount: number;
    totalIssues: number;
    completionPercentage: number;
  };
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

/**
 * Build comprehensive context for chat coaching
 */
export function buildWorkshopChatContext(
  activity: ExtracurricularItem,
  currentDraft: string,
  analysisResult: AnalysisResult | null,
  teachingCoaching: TeachingCoachingOutput | null,
  options?: {
    reflectionPromptsMap?: Map<string, ReflectionPromptSet>;
    reflectionAnswers?: Record<string, Record<string, string>>;
    hasUnsavedChanges?: boolean;
    needsReanalysis?: boolean;
  }
): WorkshopChatContext {
  // 1. Activity context
  const activityContext = {
    name: activity.name,
    role: activity.role,
    category: activity.category,
    timeCommitment: `${activity.hoursPerWeek}h/week, ${activity.weeksPerYear} weeks/year`,
    whyItMatters: activity.applicationGuidance?.whyItMatters || 'Not yet analyzed',
    portfolioScores: {
      overall: activity.scores?.portfolioContribution?.overall || 0,
      commitment: activity.scores?.commitment?.overall || 0,
      impact: activity.scores?.impact?.overall || 0,
    },
  };

  // 2. Current state
  const currentState = {
    draft: currentDraft,
    wordCount: currentDraft.split(/\s+/).filter(w => w.length > 0).length,
    hasUnsavedChanges: options?.hasUnsavedChanges || false,
    needsReanalysis: options?.needsReanalysis || false,
  };

  // 3. Deep analysis
  const nqi = analysisResult?.analysis?.narrative_quality_index || 0;
  const tier = analysisResult?.analysis?.reader_impression_label || 'generic_unclear';

  // Process 11 rubric categories
  const categories = (analysisResult?.analysis?.categories || []).map(cat => ({
    name: cat.category,
    score: cat.score,
    maxScore: cat.maxScore,
    percentage: Math.round((cat.score / cat.maxScore) * 100),
    comments: cat.comments || [],
    evidence: cat.evidence || [],
    suggestions: cat.suggestions || [],
  }));

  // Identify weak categories (< 70%)
  const weakCategories = categories
    .filter(cat => cat.percentage < 70)
    .map(cat => ({
      name: cat.name,
      score: cat.score,
      gap: Math.round((cat.maxScore * 0.7) - cat.score),
    }))
    .sort((a, b) => b.gap - a.gap);

  // Elite patterns (if available from client-side analysis)
  const elitePatterns = analysisResult?.elite_patterns ? {
    vulnerability: {
      score: analysisResult.elite_patterns.vulnerability?.score || 0,
      hasPhysical: analysisResult.elite_patterns.vulnerability?.hasPhysicalSymptoms || false,
      examples: analysisResult.elite_patterns.vulnerability?.examples || [],
    },
    dialogue: {
      score: analysisResult.elite_patterns.dialogue?.score || 0,
      hasDialogue: analysisResult.elite_patterns.dialogue?.hasDialogue || false,
      examples: analysisResult.elite_patterns.dialogue?.examples || [],
    },
    communityTransformation: {
      score: analysisResult.elite_patterns.communityTransformation?.score || 0,
      hasContrast: analysisResult.elite_patterns.communityTransformation?.hasContrast || false,
    },
    quantifiedImpact: {
      score: analysisResult.elite_patterns.quantifiedImpact?.score || 0,
      hasMetrics: analysisResult.elite_patterns.quantifiedImpact?.hasMetrics || false,
      metrics: analysisResult.elite_patterns.quantifiedImpact?.metrics || [],
    },
    universalInsight: {
      score: analysisResult.elite_patterns.microToMacro?.score || 0,
      transcends: analysisResult.elite_patterns.microToMacro?.transcendsActivity || false,
    },
  } : undefined;

  // Authenticity
  const authenticity = {
    score: analysisResult?.authenticity?.authenticity_score || 0,
    voiceType: analysisResult?.authenticity?.voice_type || 'essay',
    redFlags: analysisResult?.authenticity?.red_flags || [],
    greenFlags: analysisResult?.authenticity?.green_flags || [],
  };

  const analysis = {
    nqi,
    tier,
    categories,
    weakCategories,
    elitePatterns,
    authenticity,
  };

  // 4. Teaching guidance
  const topIssues = (teachingCoaching?.teaching_issues || []).slice(0, 5).map(issue => ({
    id: issue.id,
    title: issue.problem.title,
    severity: issue.severity,
    category: issue.category,
    problem: issue.problem.explanation,
    impact: issue.problem.impact_on_score,
    fromDraft: issue.problem.from_draft,
    principle: issue.principle ? {
      name: issue.principle.name,
      description: issue.principle.description,
      whyItMatters: issue.principle.why_officers_care,
    } : undefined,
    examples: issue.examples?.map(ex => ({
      before: ex.before.text,
      after: ex.after.text,
      school: ex.context,
    })),
  }));

  const quickWins = (teachingCoaching?.strategy?.quick_wins || []).map(qw => ({
    title: qw.title || '',
    effort: qw.estimated_effort || '',
    potentialGain: qw.potential_gain || '',
  }));

  const strategicGuidance = {
    strengths: teachingCoaching?.strategy?.strengths_to_maintain || [],
    criticalGaps: teachingCoaching?.strategy?.critical_gaps || [],
    recommendedOrder: teachingCoaching?.strategy?.recommended_order || [],
  };

  const teaching = {
    topIssues,
    quickWins,
    strategicGuidance,
  };

  // 5. Progress history
  const historySummary = getVersionHistorySummary(activity);
  const history = {
    totalVersions: historySummary.totalVersions,
    improvementTrend: historySummary.improvement.direction,
    nqiDelta: historySummary.improvement.nqiDelta,
    percentChange: historySummary.improvement.percentChange,
    timeline: historySummary.timeline,
    bestVersion: historySummary.latestVersion ? {
      nqi: historySummary.latestVersion.analysis.nqi,
      date: new Date(historySummary.latestVersion.timestamp).toLocaleDateString(),
    } : undefined,
  };

  // 6. Reflection context
  const reflectionPromptsMap = options?.reflectionPromptsMap || new Map();
  const reflectionAnswers = options?.reflectionAnswers || {};

  const completedReflections = Object.values(reflectionAnswers).filter(answers =>
    Object.keys(answers).length >= 3 // All 3 prompts answered
  ).length;

  const reflection = {
    activeReflections: reflectionPromptsMap,
    reflectionAnswers,
    completedCount: completedReflections,
    totalIssues: topIssues.length,
    completionPercentage: topIssues.length > 0
      ? Math.round((completedReflections / topIssues.length) * 100)
      : 0,
  };

  return {
    activity: activityContext,
    currentState,
    analysis,
    teaching,
    history,
    reflection,
  };
}

// ============================================================================
// CONTEXT FORMATTERS (for LLM prompts)
// ============================================================================

/**
 * Format context for LLM consumption (optimized for token usage)
 */
export function formatContextForLLM(context: WorkshopChatContext): string {
  const lines: string[] = [];

  // Activity
  lines.push(`## STUDENT ACTIVITY`);
  lines.push(`${context.activity.name} (${context.activity.role})`);
  lines.push(`Category: ${context.activity.category}`);
  lines.push(`Time Commitment: ${context.activity.timeCommitment}`);
  lines.push(`Why It Matters: ${context.activity.whyItMatters}`);
  lines.push(``);

  // Current NQI
  lines.push(`## NARRATIVE QUALITY INDEX (NQI)`);
  lines.push(`Current Score: ${context.analysis.nqi}/100 (${context.analysis.tier.replace(/_/g, ' ')})`);

  if (context.history.totalVersions > 1) {
    const delta = context.history.nqiDelta;
    lines.push(`Progress: ${delta >= 0 ? '+' : ''}${delta} points (${context.history.improvementTrend})`);
  }
  lines.push(``);

  // Weak categories
  if (context.analysis.weakCategories.length > 0) {
    lines.push(`## WEAK CATEGORIES (< 70%)`);
    context.analysis.weakCategories.slice(0, 3).forEach(cat => {
      lines.push(`- **${cat.name}**: ${cat.score}/10 (need +${cat.gap} points to reach 70%)`);
    });
    lines.push(``);
  }

  // Top issues with specific evidence
  if (context.teaching.topIssues.length > 0) {
    lines.push(`## TOP ISSUES TO ADDRESS`);
    context.teaching.topIssues.slice(0, 3).forEach((issue, i) => {
      lines.push(`${i + 1}. **${issue.title}** (${issue.severity})`);
      lines.push(`   Problem: ${issue.problem}`);
      lines.push(`   Impact: ${issue.impact}`);
      if (issue.fromDraft) {
        lines.push(`   From their draft: "${issue.fromDraft.substring(0, 100)}..."`);
      }
      lines.push(``);
    });
  }

  // Elite patterns analysis
  if (context.analysis.elitePatterns) {
    const ep = context.analysis.elitePatterns;
    lines.push(`## ELITE PATTERNS`);
    lines.push(`- Vulnerability: ${ep.vulnerability.score}/10 ${ep.vulnerability.hasPhysical ? '(has physical symptoms)' : '(needs physical symptoms)'}`);
    lines.push(`- Dialogue: ${ep.dialogue.score}/10 ${ep.dialogue.hasDialogue ? '(present)' : '(missing)'}`);
    lines.push(`- Community Impact: ${ep.communityTransformation.score}/20 ${ep.communityTransformation.hasContrast ? '(has before/after)' : '(needs before/after contrast)'}`);
    lines.push(`- Quantified Impact: ${ep.quantifiedImpact.score}/20 ${ep.quantifiedImpact.hasMetrics ? `(has metrics: ${ep.quantifiedImpact.metrics.join(', ')})` : '(missing specific numbers)'}`);
    lines.push(`- Universal Insight: ${ep.universalInsight.score}/20 ${ep.universalInsight.transcends ? '(transcends activity)' : '(too activity-specific)'}`);
    lines.push(``);
  }

  // Authenticity
  lines.push(`## AUTHENTICITY`);
  lines.push(`Voice Score: ${context.analysis.authenticity.score}/10 (${context.analysis.authenticity.voiceType})`);
  if (context.analysis.authenticity.redFlags.length > 0) {
    lines.push(`Red Flags: ${context.analysis.authenticity.redFlags.slice(0, 3).join(', ')}`);
  }
  lines.push(``);

  // Current draft (first 300 chars)
  lines.push(`## CURRENT DRAFT (${context.currentState.wordCount} words)`);
  lines.push(`"${context.currentState.draft.substring(0, 300)}..."`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * Get specific evidence from analysis for a category
 */
export function getEvidenceForCategory(
  context: WorkshopChatContext,
  categoryName: string
): { evidence: string[]; suggestions: string[] } | null {
  const category = context.analysis.categories.find(cat => cat.name === categoryName);
  if (!category) return null;

  return {
    evidence: category.evidence,
    suggestions: category.suggestions,
  };
}

/**
 * Get teaching examples for an issue
 */
export function getTeachingExamples(
  context: WorkshopChatContext,
  issueId: string
): Array<{ before: string; after: string; school?: string }> | null {
  const issue = context.teaching.topIssues.find(i => i.id === issueId);
  return issue?.examples || null;
}
