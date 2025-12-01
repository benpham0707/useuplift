// @ts-nocheck - Service file with type mismatches
/**
 * Workshop Analysis Service
 *
 * Bridges the ExtracurricularWorkshop frontend with the backend analysis engine.
 * Transforms ExtracurricularItem → ExperienceEntry → AnalysisResult
 */

import type { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { ExperienceEntry } from '@/core/types/experience';
import { analyzeExtracurricularEntry as analyzeViaApi } from '@/services/extracurricularAnalysis';
import { analyzeElitePatterns } from '@/core/analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '@/core/analysis/features/literarySophisticationDetector';

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Transform ExtracurricularItem to ExperienceEntry for backend analysis
 */
function transformToExperienceEntry(
  description: string,
  activity: ExtracurricularItem
): Partial<ExperienceEntry> & {
  id: string;
  title: string;
  category: string;
  description_original: string;
} {
  // Map category names to backend format
  const categoryMap: Record<string, string> = {
    'Athletics': 'athletics',
    'Arts & Music': 'arts',
    'STEM': 'academic',
    'Community Service': 'service',
    'Leadership': 'leadership',
    'Work': 'work',
    'Family': 'service',
    'Research': 'research',
    'Other': 'academic',
  };

  return {
    id: activity.id,
    title: activity.name,
    category: (categoryMap[activity.category] || 'academic') as any,
    description_original: description,
    role: activity.role || 'Participant',
    organization: activity.organization || activity.name,
    hours_per_week: activity.hoursPerWeek || 5,
    weeks_per_year: 52,
    tags: [],
  };
}

function calculateYears(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 1;

  try {
    const start = new Date(startDate);
    const end = endDate.toLowerCase() === 'present' ? new Date() : new Date(endDate);
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0.5, Math.round(years * 2) / 2); // Round to nearest 0.5
  } catch {
    return 1;
  }
}

function extractAchievements(activity: ExtracurricularItem): string[] {
  const achievements: string[] = [];

  // From impact metrics
  if (activity.scores?.impact?.metrics) {
    achievements.push(...activity.scores.impact.metrics.map(m => `${m.label}: ${m.value}`));
  }

  // From recognition
  if (activity.scores?.recognition?.achievements) {
    achievements.push(...activity.scores.recognition.achievements);
  }

  return achievements;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze extracurricular description using the full backend system
 */
export async function analyzeExtracurricularEntry(
  description: string,
  activity: ExtracurricularItem,
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
  } = {}
): Promise<AnalysisResult> {

  try {
    // Fast fail if backend is not reachable to avoid long UI hangs
    // Try multiple health check paths with increased timeout
    let healthCheckPassed = false;
    const healthPaths = ['/api/v1/health', '/api/health'];

    for (const path of healthPaths) {
      try {
        const healthRes = await fetch(path, { signal: AbortSignal.timeout(10000) });
        if (healthRes.ok) {
          healthCheckPassed = true;
          break;
        }
      } catch (err) {
      }
    }

    if (!healthCheckPassed) {
      throw new Error(
        'Analysis server not reachable. Start it with "npm run server" or use "npm run dev:full".'
      );
    }

    // Transform to backend format
    const entry = transformToExperienceEntry(description, activity);

    // Run core analysis via API (browser-safe)
    const result = await analyzeViaApi(entry as any, {
      depth: options.depth || 'standard',
      skip_coaching: options.skip_coaching || false,
    });

  // Run elite pattern detection
  const elitePatterns = analyzeElitePatterns(description);

  // Run literary sophistication detection
  const literarySophistication = analyzeLiterarySophistication(description);

  // Debug: Check what we got from backend

  // Transform to frontend AnalysisResult format
  const analysisResult: AnalysisResult = {
    analysis: {
      id: result.report.id,
      entry_id: entry.id,
      rubric_version: result.report.rubric_version,
      created_at: result.report.created_at,

      // Map category scores to frontend format
      categories: result.report.categories.map(cat => ({
        category: mapCategoryNameToKey(cat.name),
        score: cat.score_0_to_10,
        maxScore: 10,
        comments: [cat.evaluator_notes],
        evidence: cat.evidence_snippets,
        suggestions: extractSuggestions(cat.evaluator_notes),
      })),

      weights: result.report.weights as Record<string, number>,
      narrative_quality_index: result.report.narrative_quality_index,
      reader_impression_label: result.report.reader_impression_label,
      flags: result.report.flags,
      suggested_fixes_ranked: result.report.suggested_fixes_ranked,
      analysis_depth: result.report.analysis_depth,
    },

    authenticity: {
      authenticity_score: result.authenticity.authenticity_score,
      voice_type: result.authenticity.voice_type as any,
      red_flags: result.authenticity.red_flags || [],
      green_flags: result.authenticity.green_flags || [],
      manufactured_signals: (result as any).authenticity?.manufactured_signals || [],
      authenticity_markers: (result as any).authenticity?.authenticity_markers || [],
      assessment: (result as any).authenticity?.assessment || '',
    },

    elite_patterns: {
      overallScore: elitePatterns.overallScore,
      tier: elitePatterns.tier,

      vulnerability: {
        score: elitePatterns.vulnerability.score,
        hasPhysicalSymptoms: elitePatterns.vulnerability.markers.some(m => m.includes('physical')),
        hasNamedEmotions: elitePatterns.vulnerability.markers.some(m => m.includes('emotion')),
        hasBeforeAfter: elitePatterns.vulnerability.markers.length > 0,
        examples: elitePatterns.vulnerability.examples,
      },

      dialogue: {
        score: elitePatterns.dialogue.hasDialogue ? 8 : 0,
        hasDialogue: elitePatterns.dialogue.hasDialogue,
        isConversational: elitePatterns.dialogue.hasDialogue,
        revealsCharacter: elitePatterns.dialogue.hasConfrontation,
        examples: elitePatterns.dialogue.quotes,
      },

      communityTransformation: {
        score: elitePatterns.communityTransformation.hasContrast ? 8 : 4,
        hasContrast: elitePatterns.communityTransformation.hasContrast,
        hasBefore: elitePatterns.communityTransformation.hasBeforeState,
        hasAfter: elitePatterns.communityTransformation.hasAfterState,
      },

      quantifiedImpact: {
        score: elitePatterns.quantifiedImpact.hasMetrics ? 8 : 0,
        hasMetrics: elitePatterns.quantifiedImpact.hasMetrics,
        metrics: elitePatterns.quantifiedImpact.metrics.map(m => m.value),
        plausibilityScore: elitePatterns.quantifiedImpact.scaleAppropriate ? 8 : 5,
      },

      microToMacro: {
        score: elitePatterns.microToMacro.score,
        hasUniversalInsight: elitePatterns.microToMacro.hasPhilosophicalInsight,
        transcendsActivity: elitePatterns.microToMacro.hasPhilosophicalInsight,
      },

      strengths: elitePatterns.strengths,
      gaps: elitePatterns.gaps,
    },

    literary_sophistication: {
      overallScore: literarySophistication.overallScore,

      extendedMetaphor: {
        score: literarySophistication.extendedMetaphor.score,
        hasMetaphor: literarySophistication.extendedMetaphor.hasMetaphor,
        isExtended: literarySophistication.extendedMetaphor.sustained,
        examples: literarySophistication.extendedMetaphor.centralImage ? [literarySophistication.extendedMetaphor.centralImage] : [],
      },

      structuralInnovation: {
        score: literarySophistication.structuralInnovation.score,
        structure: literarySophistication.structuralInnovation.innovations.join(', ') || 'standard',
        isInnovative: literarySophistication.structuralInnovation.innovations.length > 0,
      },

      sentenceRhythm: {
        score: literarySophistication.rhythmicProse.score,
        hasVariation: literarySophistication.rhythmicProse.hasVariety,
        examples: literarySophistication.rhythmicProse.hasParallelism ? ['Contains parallelism'] : [],
      },

      sensoryImmersion: {
        score: literarySophistication.sensoryImmersion.score,
        hasSensoryDetails: literarySophistication.sensoryImmersion.diverseSenses,
        examples: Object.entries(literarySophistication.sensoryImmersion.senses)
          .filter(([_, count]) => count > 0)
          .map(([sense, count]) => `${sense}: ${count}`),
      },

      activeVoice: {
        score: literarySophistication.authenticVoice.score,
        percentage: literarySophistication.authenticVoice.conversationalMarkers.length * 10,
        passiveExamples: [],
      },
    },

    coaching: result.coaching ? {
      prioritized_issues: (result.coaching.categories || []).flatMap(cat =>
        (cat.detected_issues || []).map(issue => ({
          issue_id: issue.id,
          category: mapCategoryNameToKey(cat.category_key || issue.category),
          severity: issue.severity as 'critical' | 'major' | 'minor',
          title: issue.title,
          problem: issue.problem,
          impact: issue.why_matters || issue.impact || '',
          suggestions: (issue.suggested_fixes || []).map(fix => fix.fix_text || fix),
        }))
      ),

      quick_wins: (result.coaching.top_priorities || []).slice(0, 3).map((priority, idx) => ({
        issue_id: `quick-win-${idx}`,
        estimated_minutes: 10,
        potential_gain: priority.impact || '+2-3 NQI',
      })),

      strategic_guidance: {
        focus_areas: (result.coaching.top_priorities || []).map(p => mapCategoryNameToKey(p.category)),
        estimated_time_minutes: result.coaching.overall?.total_issues ? result.coaching.overall.total_issues * 15 : 45,
        potential_nqi_gain: 10,
      },
    } : undefined,
  };

    // DEBUG: Log the exact NQI we're returning

    return analysisResult;
  } catch (error) {

    // DO NOT FALLBACK TO MOCK - throw the error so we can see what's wrong
    throw new Error(`Backend analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map display names to category keys
 */
function mapCategoryNameToKey(name: string): any {
  // Normalize common formatting variants (strip trailing parentheticals and trim)
  const base = name.replace(/\s*\([^)]*\)\s*$/,'').trim();
  const mapping: Record<string, string> = {
    'Voice Integrity': 'voice_integrity',
    'Specificity & Evidence': 'specificity_evidence',
    'Transformative Impact': 'transformative_impact',
    'Role Clarity & Ownership': 'role_clarity_ownership',
    'Narrative Arc & Stakes': 'narrative_arc_stakes',
    'Initiative & Leadership': 'initiative_leadership',
    'Community & Collaboration': 'community_collaboration',
    'Reflection & Meaning': 'reflection_meaning',
    'Craft & Language Quality': 'craft_language_quality',
    'Fit & Trajectory': 'fit_trajectory',
    'Time in Investment & Consistency': 'time_investment_consistency',
    // Common alt labels from model variants
    'Transformative Impact: Self & Others': 'transformative_impact',
  };

  // Direct match on normalized base label
  if (mapping[base]) {
    return mapping[base];
  }

  // Fallback: normalize to snake_case key
  const snakeBase = base
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s*&\s*/g, '_')
    .replace(/\s+/g, '_');
  if ((mapping as any)[snakeBase]) {
    return (mapping as any)[snakeBase];
  }

  return snakeBase;
}

/**
 * Extract actionable suggestions from evaluator notes
 */
function extractSuggestions(notes: string): string[] {
  const suggestions: string[] = [];

  // Split by sentences
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Look for imperative/suggestive language
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (
      trimmed.match(/^(add|include|show|demonstrate|specify|clarify|improve|strengthen|deepen)/i) ||
      trimmed.includes('should') ||
      trimmed.includes('could') ||
      trimmed.includes('consider')
    ) {
      suggestions.push(trimmed);
    }
  }

  // If no suggestions found, create generic one
  if (suggestions.length === 0) {
    suggestions.push('Review this category and consider how you can strengthen it');
  }

  return suggestions.slice(0, 3); // Max 3 suggestions per category
}
