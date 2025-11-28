/**
 * PIQ Chat Context Builder
 *
 * Builds comprehensive, PIQ-specific context for AI essay coaching that includes:
 * - Voice Fingerprint (preserve authentic writing style)
 * - Experience Fingerprint (maintain uniqueness, avoid generic patterns)
 * - Quality Anchors (sentences to preserve—don't change)
 * - 12-Dimension Rubric Analysis
 * - Surgical Workshop Items
 * - PIQ-specific metadata (prompt text, word limit 350, UC criteria)
 *
 * **CRITICAL**: This context prevents "flowery" suggestions by explicitly
 * including voice patterns and quality anchors that must be preserved.
 */

import { AnalysisResult, VoiceFingerprintData, ExperienceFingerprintData, DimensionScoreDetail } from '@/components/portfolio/extracurricular/workshop/backendTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Comprehensive context about student's PIQ essay workshop session
 */
export interface PIQChatContext {
  // PIQ Essay Metadata
  piqEssay: {
    promptId: string;
    promptNumber: number;
    promptTitle: string;
    promptText: string;
    category: string; // 'leadership', 'talent', 'creative', etc.
    wordLimit: 350;
    currentWordCount: number;
  };

  // Current Draft State
  currentState: {
    draft: string;
    wordCount: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  };

  // Comprehensive Analysis
  analysis: {
    nqi: number;
    initialNqi: number;
    delta: number;
    tier: 'excellent' | 'strong' | 'competitive' | 'developing';

    // 12-Dimension Rubric (from rubricDimensionDetails)
    dimensions: Array<{
      name: string;
      score: number;
      maxScore: 10;
      percentage: number;
      status: 'excellent' | 'good' | 'needs_work' | 'critical';
      justification: string;
      strengths: string[];
      weaknesses: string[];
    }>;

    // Workshop Items (surgical fixes)
    workshopItems: Array<{
      id: string;
      quote: string;
      problem: string;
      whyItMatters: string;
      severity: 'critical' | 'warning' | 'optimization';
      rubricCategory: string;
      suggestions: Array<{
        type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
        text: string;
        rationale: string;
      }>;
    }>;
  };

  // Voice Fingerprint (CRITICAL - prevents flowery suggestions)
  voiceFingerprint: {
    sentenceStructure: {
      pattern: string;
      example: string;
    };
    vocabulary: {
      level: string;
      signatureWords: string[];
    };
    pacing: {
      speed: string;
      rhythm: string;
    };
    tone: {
      primary: string;
      secondary: string;
    };
  } | null;

  // Experience Fingerprint (CRITICAL - prevents generic patterns)
  experienceFingerprint: {
    uniqueElements: {
      unusualCircumstance?: { description: string; whyItMatters: string; specificDetail: string };
      unexpectedEmotion?: { emotion: string; trigger: string; counterExpectation: string };
      contraryInsight?: { insight: string; againstWhat: string; whyAuthentic: string };
      specificSensoryAnchor?: { sensory: string; context: string; emotionalWeight: string };
      uniqueRelationship?: { person: string; dynamic: string; unexpectedAspect: string };
      culturalSpecificity?: { element: string; connection: string; universalBridge: string };
    };
    antiPatternFlags: {
      followsTypicalArc: boolean;
      hasGenericInsight: boolean;
      hasManufacturedBeat: boolean;
      hasCrowdPleaser: boolean;
      warnings: string[];
    };
    divergenceRequirements: {
      mustInclude: string[];
      mustAvoid: string[];
      uniqueAngle: string;
      authenticTension: string;
    };
    qualityAnchors: Array<{
      sentence: string;
      whyItWorks: string;
      preservationPriority: 'critical' | 'high' | 'medium';
    }>;
    confidenceScore: number;
  } | null;

  // Version History
  history: {
    totalVersions: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    nqiDelta: number;
    timeline: Array<{
      timestamp: number;
      nqi: number;
      note?: string;
    }>;
  };
}

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Build comprehensive PIQ chat context
 */
export function buildPIQChatContext(
  promptId: string,
  promptText: string,
  promptTitle: string,
  currentDraft: string,
  analysisResult: AnalysisResult | null,
  options: {
    currentScore: number;
    initialScore: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
    versionHistory?: Array<{ timestamp: number; nqi: number; note?: string }>;
  }
): PIQChatContext {
  // Build PIQ essay metadata
  const promptNumber = parseInt(promptId.replace('piq', '')) || 1;
  const category = inferPromptCategory(promptNumber);

  const piqEssay = {
    promptId,
    promptNumber,
    promptTitle,
    promptText,
    category,
    wordLimit: 350,
    currentWordCount: currentDraft.split(/\s+/).filter(Boolean).length,
  };

  // Build current state
  const currentState = {
    draft: currentDraft,
    wordCount: currentDraft.split(/\s+/).filter(Boolean).length,
    hasUnsavedChanges: options.hasUnsavedChanges,
    needsReanalysis: options.needsReanalysis,
  };

  // Build analysis context
  const analysisContext = buildAnalysisContext(analysisResult, options.currentScore, options.initialScore);

  // Build voice fingerprint (from analysisResult)
  const voiceFingerprint = analysisResult?.voiceFingerprint
    ? {
        sentenceStructure: {
          pattern: analysisResult.voiceFingerprint.sentenceStructure?.pattern || 'Not analyzed',
          example: analysisResult.voiceFingerprint.sentenceStructure?.example || '',
        },
        vocabulary: {
          level: analysisResult.voiceFingerprint.vocabulary?.level || 'Not analyzed',
          signatureWords: analysisResult.voiceFingerprint.vocabulary?.signatureWords || [],
        },
        pacing: {
          speed: analysisResult.voiceFingerprint.pacing?.speed || 'Not analyzed',
          rhythm: analysisResult.voiceFingerprint.pacing?.rhythm || 'Not analyzed',
        },
        tone: {
          primary: analysisResult.voiceFingerprint.tone?.primary || 'Not analyzed',
          secondary: analysisResult.voiceFingerprint.tone?.secondary || '',
        },
      }
    : null;

  // Build experience fingerprint (from analysisResult)
  // Cast to any to handle varying property structures from backend
  const expFp = analysisResult?.experienceFingerprint as any;
  const experienceFingerprint = expFp
    ? {
        uniqueElements: expFp.uniqueElements || expFp.unique_elements || {},
        antiPatternFlags: expFp.antiPatternFlags || expFp.anti_pattern_flags || {
          followsTypicalArc: false,
          hasGenericInsight: false,
          hasManufacturedBeat: false,
          hasCrowdPleaser: false,
          warnings: [],
        },
        divergenceRequirements: expFp.divergenceRequirements || expFp.divergence_requirements || {
          mustInclude: [],
          mustAvoid: [],
          uniqueAngle: '',
          authenticTension: '',
        },
        qualityAnchors: expFp.qualityAnchors || expFp.quality_anchors || [],
        confidenceScore: expFp.confidenceScore || expFp.confidence_score || 0,
      }
    : null;

  // Build history context
  const historyContext = buildHistoryContext(options.versionHistory, options.currentScore, options.initialScore);

  // Cast to satisfy strict type requirements while preserving runtime flexibility
  return {
    piqEssay: piqEssay as PIQChatContext['piqEssay'],
    currentState,
    analysis: analysisContext as PIQChatContext['analysis'],
    voiceFingerprint,
    experienceFingerprint,
    history: historyContext,
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
      dimensions: [],
      workshopItems: [],
    };
  }

  // Map rubricDimensionDetails to dimensions array
  const dimensions = (analysisResult.rubricDimensionDetails || []).map(dim => {
    const percentage = (dim.final_score / 10) * 100;
    return {
      name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: dim.final_score,
      maxScore: 10,
      percentage,
      status: getStatusForPercentage(percentage),
      justification: dim.evidence?.justification || '',
      strengths: dim.evidence?.strengths || [],
      weaknesses: dim.evidence?.weaknesses || [],
    };
  });

  // Map workshopItems
  const workshopItems = (analysisResult.workshopItems || []).map(item => ({
    id: item.id,
    quote: item.quote,
    problem: item.problem,
    whyItMatters: item.why_it_matters,
    severity: item.severity,
    rubricCategory: item.rubric_category,
    suggestions: item.suggestions.map(s => ({
      type: s.type,
      text: s.text,
      rationale: s.rationale,
    })),
  }));

  return {
    nqi: currentScore,
    initialNqi: initialScore,
    delta: currentScore - initialScore,
    tier: getScoreTier(currentScore),
    dimensions,
    workshopItems,
  };
}

/**
 * Build history context
 */
function buildHistoryContext(
  versionHistory: Array<{ timestamp: number; nqi: number; note?: string }> | undefined,
  currentScore: number,
  initialScore: number
) {
  if (!versionHistory || versionHistory.length === 0) {
    return {
      totalVersions: 0,
      improvementTrend: 'stable' as const,
      nqiDelta: 0,
      timeline: [],
    };
  }

  const nqiDelta = currentScore - initialScore;
  const improvementTrend = nqiDelta > 5 ? ('improving' as const) : nqiDelta < -5 ? ('declining' as const) : ('stable' as const);

  return {
    totalVersions: versionHistory.length,
    improvementTrend,
    nqiDelta,
    timeline: versionHistory,
  };
}

// ============================================================================
// CONTEXT FORMATTING FOR LLM
// ============================================================================

/**
 * Format context into concise text block for LLM system prompt
 */
export function formatPIQContextForLLM(context: PIQChatContext): string {
  const sections: string[] = [];

  // PIQ Essay Metadata
  sections.push(`# PIQ ESSAY CONTEXT`);
  sections.push(`**Prompt ${context.piqEssay.promptNumber}**: ${context.piqEssay.promptTitle}`);
  sections.push(`**Full Prompt**: "${context.piqEssay.promptText}"`);
  sections.push(`**Category**: ${context.piqEssay.category}`);

  // CRITICAL: Word count with status
  const wordCount = context.currentState.wordCount;
  const wordStatus =
    wordCount > 350 ? `⚠️ OVER LIMIT by ${wordCount - 350} words` :
    wordCount >= 340 ? `⚠️ NEAR LIMIT (${350 - wordCount} words remaining)` :
    wordCount >= 300 ? `${350 - wordCount} words remaining` :
    `${350 - wordCount} words remaining (plenty of room)`;

  sections.push(`**⚠️ CRITICAL - Word Count**: ${wordCount}/350 - ${wordStatus}`);
  sections.push('');
  sections.push(`⚠️ IF YOU SUGGEST ADDING CONTENT: Calculate word cost and suggest specific cuts to make room.`);
  sections.push('');

  // Current Score & Tier
  sections.push(`# CURRENT ANALYSIS`);
  sections.push(`**NQI Score**: ${context.analysis.nqi}/100 (${context.analysis.tier})`);
  sections.push(`**Improvement**: ${context.analysis.delta > 0 ? '+' : ''}${context.analysis.delta} points from initial ${context.analysis.initialNqi}`);
  sections.push('');

  // Voice Fingerprint (CRITICAL for preventing flowery suggestions)
  if (context.voiceFingerprint) {
    sections.push(`# STUDENT'S VOICE FINGERPRINT (PRESERVE THIS)`);
    sections.push(`**Sentence Structure**: ${context.voiceFingerprint.sentenceStructure.pattern}`);
    sections.push(`  Example: "${context.voiceFingerprint.sentenceStructure.example}"`);
    sections.push(`**Vocabulary**: ${context.voiceFingerprint.vocabulary.level}`);
    if (context.voiceFingerprint.vocabulary.signatureWords.length > 0) {
      sections.push(`  Signature words: ${context.voiceFingerprint.vocabulary.signatureWords.slice(0, 5).join(', ')}`);
    }
    sections.push(`**Pacing**: ${context.voiceFingerprint.pacing.speed} with ${context.voiceFingerprint.pacing.rhythm} rhythm`);
    sections.push(`**Tone**: ${context.voiceFingerprint.tone.primary}${context.voiceFingerprint.tone.secondary ? `, ${context.voiceFingerprint.tone.secondary}` : ''}`);
    sections.push('');
    sections.push(`⚠️ CRITICAL: All coaching must PRESERVE this voice pattern. Do NOT suggest flowery embellishments that violate their authentic style.`);
    sections.push('');
  }

  // Experience Fingerprint (Quality Anchors + Anti-Patterns)
  if (context.experienceFingerprint) {
    // Quality Anchors (CRITICAL - sentences to preserve)
    if (context.experienceFingerprint.qualityAnchors.length > 0) {
      sections.push(`# QUALITY ANCHORS (DO NOT CHANGE THESE)`);
      context.experienceFingerprint.qualityAnchors.forEach(anchor => {
        sections.push(`**[${anchor.preservationPriority.toUpperCase()}]** "${anchor.sentence}"`);
        sections.push(`  → Why this works: ${anchor.whyItWorks}`);
      });
      sections.push('');
      sections.push(`⚠️ These sentences are working—tell the student to KEEP this exact phrasing.`);
      sections.push('');
    }

    // Anti-Pattern Warnings
    if (context.experienceFingerprint.antiPatternFlags.warnings.length > 0) {
      sections.push(`# ANTI-PATTERN WARNINGS`);
      context.experienceFingerprint.antiPatternFlags.warnings.forEach(warning => {
        sections.push(`⚠️ ${warning}`);
      });
      sections.push('');
    }

    // Divergence Requirements
    if (context.experienceFingerprint.divergenceRequirements.uniqueAngle) {
      sections.push(`# UNIQUENESS GUIDANCE`);
      sections.push(`**Unique Angle**: ${context.experienceFingerprint.divergenceRequirements.uniqueAngle}`);
      if (context.experienceFingerprint.divergenceRequirements.authenticTension) {
        sections.push(`**Authentic Tension**: ${context.experienceFingerprint.divergenceRequirements.authenticTension}`);
      }
      if (context.experienceFingerprint.divergenceRequirements.mustAvoid.length > 0) {
        sections.push(`**Must Avoid**: ${context.experienceFingerprint.divergenceRequirements.mustAvoid.join(', ')}`);
      }
      sections.push('');
    }
  }

  // Weak Dimensions (< 70%)
  const weakDimensions = context.analysis.dimensions.filter(d => d.percentage < 70);
  if (weakDimensions.length > 0) {
    sections.push(`# WEAK DIMENSIONS (< 70%)`);
    weakDimensions.slice(0, 3).forEach(dim => {
      sections.push(`**${dim.name}**: ${dim.score}/10 (${dim.percentage.toFixed(0)}%)`);
      sections.push(`  Justification: ${dim.justification}`);
      if (dim.weaknesses.length > 0) {
        sections.push(`  Weaknesses: ${dim.weaknesses.slice(0, 2).join('; ')}`);
      }
    });
    sections.push('');
  }

  // Top Workshop Items (surgical fixes)
  if (context.analysis.workshopItems.length > 0) {
    sections.push(`# TOP WORKSHOP ITEMS (Surgical Fixes)`);
    context.analysis.workshopItems.slice(0, 3).forEach((item, idx) => {
      sections.push(`${idx + 1}. **[${item.severity.toUpperCase()}]** ${item.rubricCategory}`);
      sections.push(`   Quote: "${item.quote.substring(0, 80)}${item.quote.length > 80 ? '...' : ''}"`);
      sections.push(`   Problem: ${item.problem}`);
      sections.push(`   Why it matters: ${item.whyItMatters}`);
    });
    sections.push('');
  }

  // Current Draft
  sections.push(`# CURRENT DRAFT (${context.currentState.wordCount} words)`);
  sections.push(`"${context.currentState.draft}"`);
  sections.push('');

  // Progress Tracking
  if (context.history.totalVersions > 0) {
    sections.push(`# VERSION HISTORY`);
    sections.push(`Total versions: ${context.history.totalVersions}`);
    sections.push(`Trend: ${context.history.improvementTrend} (${context.history.nqiDelta > 0 ? '+' : ''}${context.history.nqiDelta} points)`);
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getScoreTier(nqi: number): 'excellent' | 'strong' | 'competitive' | 'developing' {
  if (nqi >= 85) return 'excellent';
  if (nqi >= 70) return 'strong';
  if (nqi >= 55) return 'competitive';
  return 'developing';
}

function getStatusForPercentage(percentage: number): 'excellent' | 'good' | 'needs_work' | 'critical' {
  if (percentage >= 85) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'needs_work';
  return 'critical';
}

function inferPromptCategory(promptNumber: number): string {
  const categories: Record<number, string> = {
    1: 'leadership',
    2: 'creative',
    3: 'talent',
    4: 'educational_opportunity',
    5: 'challenge',
    6: 'academic_passion',
    7: 'community',
    8: 'beyond_academics',
  };
  return categories[promptNumber] || 'general';
}
