/**
 * Crystallizer — Layer 4: Essay DNA + Paragraph Score Matrix
 *
 * Distills the accumulated Layer 3 understanding into two compact artifacts:
 *   1. ParagraphScoreMatrix — deterministic extraction from ParagraphDeepAnalysis
 *   2. EssayDNA — single Sonnet call to crystallize identity, voice, and positioning
 *
 * These artifacts are the "compressed intelligence" consumed by Layer 5 (annotations),
 * Layer 6 (coaching), and all downstream UI/reporting.
 */

import { callClaudeWithRetry, calculateCost } from '../../../lib/llm/claude';
import { contextBuilder } from '../contextBuilder';
import type {
  EssayUnderstanding,
  RunningUnderstanding,
  ParagraphDeepAnalysis,
  StructuralCartography,
  EssayDNA,
  ParagraphScoreMatrix,
  ParagraphVerdict,
  ImpactLevel,
  WeaknessSeverity,
  ReadinessLevel,
  ImpressionLabel,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

/** Weights for composite paragraph score */
const DIMENSION_WEIGHTS = {
  structure: 0.20,
  rhetoric: 0.20,
  emotion: 0.25,
  craft: 0.20,
  voice: 0.15,
} as const;

/** Verdict thresholds (inclusive lower bounds) */
const VERDICT_THRESHOLDS: Array<{ min: number; verdict: ParagraphVerdict }> = [
  { min: 85, verdict: 'anchor' },
  { min: 70, verdict: 'strong' },
  { min: 50, verdict: 'developing' },
  { min: 30, verdict: 'weak' },
  { min: 0, verdict: 'restructure' },
];

/** EQI to impression label mapping */
const IMPRESSION_THRESHOLDS: Array<{ min: number; label: ImpressionLabel }> = [
  { min: 85, label: 'arresting_deeply_human' },
  { min: 70, label: 'compelling_clear_voice' },
  { min: 55, label: 'competent_needs_texture' },
  { min: 40, label: 'readable_but_generic' },
  { min: 0, label: 'template_like_rebuild' },
];

/** EQI to readiness level mapping */
const READINESS_THRESHOLDS: Array<{ min: number; level: ReadinessLevel }> = [
  { min: 90, level: 'polished' },
  { min: 75, level: 'near_final' },
  { min: 60, level: 'solid_draft' },
  { min: 40, level: 'developing' },
  { min: 0, level: 'needs_major_revision' },
];

/** Severity ranking for sorting improvement priorities */
const SEVERITY_RANK: Record<WeaknessSeverity, number> = {
  critical: 3,
  significant: 2,
  minor: 1,
};

// ============================================================================
// CRYSTALLIZER
// ============================================================================

class Crystallizer {
  /**
   * Crystallize accumulated understanding into EssayDNA + ParagraphScoreMatrix.
   *
   * Step 1: Build ParagraphScoreMatrix deterministically from Layer 3 data.
   * Step 2: Call Sonnet once to produce EssayDNA from the compressed context.
   * Step 3: Compute overallEQI, impressionLabel, readinessLevel.
   */
  async crystallize(
    understanding: EssayUnderstanding,
    finalRunningUnderstanding: RunningUnderstanding,
    allParagraphAnalyses: ParagraphDeepAnalysis[],
    structuralMap: StructuralCartography,
  ): Promise<{
    essayDNA: EssayDNA;
    paragraphScoreMatrix: ParagraphScoreMatrix;
    cost: number;
    timingMs: number;
    tokenUsage: { inputTokens: number; outputTokens: number };
  }> {
    const startTime = Date.now();

    // ── Step 1: Deterministic paragraph score matrix ──
    const paragraphScoreMatrix = this.buildParagraphScoreMatrix(
      allParagraphAnalyses,
      finalRunningUnderstanding,
    );

    // ── Step 2: LLM crystallization → EssayDNA ──
    const crystallizationContext = contextBuilder.buildCrystallizationContext(
      understanding,
      finalRunningUnderstanding,
      allParagraphAnalyses,
    );

    const systemPrompt = `You are crystallizing a deep essay analysis into a compressed DNA profile.

Your job: distill the multi-paragraph analysis below into a concise, high-signal EssayDNA object.
This DNA will be used by coaching systems and annotation generators — it must be accurate and actionable.

Rules:
- thesis, emotionalCore, studentIntent: each 1-2 sentences max
- committeePitch: what an admissions officer would remember, 1 sentence
- memorabilityFactor: what makes this essay stick, or why it doesn't
- voiceSignature: describe the writer's voice in a single phrase
- authenticPhrases: quote 2-4 specific phrases that feel genuinely "theirs"
- voiceRisks: moments where voice drifts or feels borrowed
- topStrengths: 2-4, each with specific paragraph evidence
- topImprovements: 2-4, each with currentState/targetState/suggestedPath
- applicationFit: how this essay positions the student, 1-2 sentences
- uniqueReveals: what we learn about this person that we couldn't learn from their transcript
- redundancyRisks: themes/points that overlap with common application elements

Respond with a single JSON object matching the EssayDNA schema. No markdown, no explanation.`;

    const userPrompt = `${crystallizationContext}

Paragraph Score Summary:
${paragraphScoreMatrix.paragraphs.map(p =>
  `  P${p.index}: composite=${p.compositeScore}, verdict=${p.verdict}, structure=${p.scores.structure}, rhetoric=${p.scores.rhetoric}, emotion=${p.scores.emotion}, craft=${p.scores.craft}, voice=${p.scores.voice}`,
).join('\n')}

Structural Map:
  Arc: ${structuralMap.arcType} (confidence ${structuralMap.arcConfidence})
  Central Theme: ${structuralMap.centralTheme}
  Theme Progression: ${structuralMap.themeProgression}
  Flat Spots: ${structuralMap.flatSpots.length > 0 ? structuralMap.flatSpots.join(', ') : 'none'}`;

    const response = await callClaudeWithRetry<EssayDNA>({
      model: SONNET_MODEL,
      systemPrompt,
      userPrompt,
      maxTokens: 2000,
      temperature: 0.2,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    const cost = calculateCost(response.usage, SONNET_MODEL);

    // ── Step 3: Compute overallEQI and map to labels ──
    const overallEQI = this.computeOverallEQI(paragraphScoreMatrix);
    const impressionLabel = this.mapToImpressionLabel(overallEQI);
    const readinessLevel = this.mapToReadinessLevel(overallEQI);

    const essayDNA: EssayDNA = {
      ...response.content,
      overallEQI,
      impressionLabel,
      readinessLevel,
    };

    return {
      essayDNA,
      paragraphScoreMatrix,
      cost,
      timingMs: Date.now() - startTime,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  // ==========================================================================
  // DETERMINISTIC: PARAGRAPH SCORE MATRIX
  // ==========================================================================

  private buildParagraphScoreMatrix(
    analyses: ParagraphDeepAnalysis[],
    runningUnderstanding: RunningUnderstanding,
  ): ParagraphScoreMatrix {
    // ── Per-paragraph scores ──
    const paragraphs = analyses.map(analysis => {
      const scores = {
        structure: analysis.structural.roleEffectiveness,
        rhetoric: analysis.rhetoric.persuasiveness,
        emotion: analysis.emotional.emotionalDepth,
        craft: analysis.craft.imageQuality,
        voice: analysis.emotional.voiceAuthenticity,
      };

      const compositeScore = this.computeCompositeScore(scores);
      const verdict = this.mapToVerdict(compositeScore);

      return {
        index: analysis.paragraphIndex,
        scores,
        compositeScore,
        verdict,
      };
    });

    // ── Strength clusters from RunningUnderstanding ──
    const strengthClusters = this.buildStrengthClusters(runningUnderstanding);

    // ── Weakness clusters from RunningUnderstanding ──
    const weaknessClusters = this.buildWeaknessClusters(runningUnderstanding);

    // ── Improvement priorities ranked by severity × impact ──
    const improvementPriorities = this.buildImprovementPriorities(
      runningUnderstanding,
      paragraphs,
    );

    return {
      paragraphs,
      strengthClusters,
      weaknessClusters,
      improvementPriorities,
    };
  }

  private computeCompositeScore(scores: Record<string, number>): number {
    let weighted = 0;
    for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
      weighted += (scores[key] ?? 0) * weight;
    }
    return Math.round(weighted * 100) / 100;
  }

  private mapToVerdict(score: number): ParagraphVerdict {
    for (const { min, verdict } of VERDICT_THRESHOLDS) {
      if (score >= min) return verdict;
    }
    return 'restructure';
  }

  private buildStrengthClusters(
    ru: RunningUnderstanding,
  ): ParagraphScoreMatrix['strengthClusters'] {
    // Group strengths by quality
    const qualityMap = new Map<string, { paragraphs: Set<number>; evidence: string[] }>();

    for (const s of ru.strengthsFound) {
      const existing = qualityMap.get(s.quality);
      if (existing) {
        existing.paragraphs.add(s.paragraph);
        existing.evidence.push(s.evidence);
      } else {
        qualityMap.set(s.quality, {
          paragraphs: new Set([s.paragraph]),
          evidence: [s.evidence],
        });
      }
    }

    return Array.from(qualityMap.entries()).map(([quality, data]) => ({
      quality,
      paragraphs: Array.from(data.paragraphs).sort((a, b) => a - b),
      description: data.evidence.join('; '),
    }));
  }

  private buildWeaknessClusters(
    ru: RunningUnderstanding,
  ): ParagraphScoreMatrix['weaknessClusters'] {
    // Group weaknesses by quality
    const qualityMap = new Map<string, { paragraphs: Set<number>; descriptions: string[] }>();

    for (const w of ru.weaknessesFound) {
      const existing = qualityMap.get(w.quality);
      if (existing) {
        existing.paragraphs.add(w.paragraph);
        existing.descriptions.push(w.description);
      } else {
        qualityMap.set(w.quality, {
          paragraphs: new Set([w.paragraph]),
          descriptions: [w.description],
        });
      }
    }

    return Array.from(qualityMap.entries()).map(([quality, data]) => ({
      quality,
      paragraphs: Array.from(data.paragraphs).sort((a, b) => a - b),
      description: data.descriptions.join('; '),
    }));
  }

  private buildImprovementPriorities(
    ru: RunningUnderstanding,
    paragraphs: Array<{ index: number; compositeScore: number; verdict: ParagraphVerdict }>,
  ): ParagraphScoreMatrix['improvementPriorities'] {
    // Start from weaknesses, rank by severity then by paragraph weakness
    const priorities = ru.weaknessesFound.map(w => {
      const paragraphData = paragraphs.find(p => p.index === w.paragraph);
      const severityScore = SEVERITY_RANK[w.severity] ?? 0;
      // Lower paragraph score = higher priority for improvement
      const paragraphPenalty = paragraphData
        ? (100 - paragraphData.compositeScore) / 100
        : 0.5;
      const priorityScore = severityScore + paragraphPenalty;

      return {
        target: `Paragraph ${w.paragraph}`,
        issue: `${w.quality}: ${w.description}`,
        severity: w.severity,
        priorityScore,
        expectedImpact: this.mapSeverityToImpact(w.severity),
        suggestedApproach: this.suggestApproach(w.quality, w.description),
      };
    });

    // Sort by priority score descending
    priorities.sort((a, b) => b.priorityScore - a.priorityScore);

    // Deduplicate similar issues and assign ranks
    const seen = new Set<string>();
    const ranked: ParagraphScoreMatrix['improvementPriorities'] = [];
    let rank = 1;

    for (const p of priorities) {
      const key = `${p.target}:${p.issue.substring(0, 50)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      ranked.push({
        rank: rank++,
        target: p.target,
        issue: p.issue,
        expectedImpact: p.expectedImpact,
        suggestedApproach: p.suggestedApproach,
      });
    }

    return ranked;
  }

  private mapSeverityToImpact(severity: WeaknessSeverity): ImpactLevel {
    switch (severity) {
      case 'critical': return 'transformative';
      case 'significant': return 'significant';
      case 'minor': return 'moderate';
    }
  }

  private suggestApproach(quality: string, description: string): string {
    // Generate a brief suggested approach based on the weakness type
    const lowerQuality = quality.toLowerCase();
    if (lowerQuality.includes('voice') || lowerQuality.includes('authentic')) {
      return 'Ground this moment in specific sensory details or personal language that feels distinctly yours.';
    }
    if (lowerQuality.includes('structure') || lowerQuality.includes('transition')) {
      return 'Strengthen the bridge between ideas — what connects the previous thought to this one?';
    }
    if (lowerQuality.includes('emotion') || lowerQuality.includes('depth')) {
      return 'Move from telling to showing — replace explanations with scenes the reader can see.';
    }
    if (lowerQuality.includes('rhetoric') || lowerQuality.includes('evidence')) {
      return 'Add a concrete example or specific detail that demonstrates rather than asserts.';
    }
    if (lowerQuality.includes('craft') || lowerQuality.includes('language')) {
      return 'Vary sentence rhythm and replace generic phrasing with precise, image-rich language.';
    }
    if (lowerQuality.includes('redundan')) {
      return 'Consolidate overlapping points — say it once with full force rather than twice weakly.';
    }
    // Generic fallback
    return `Address the ${quality.toLowerCase()} issue: ${description.substring(0, 80)}.`;
  }

  // ==========================================================================
  // EQI COMPUTATION + LABEL MAPPING
  // ==========================================================================

  private computeOverallEQI(matrix: ParagraphScoreMatrix): number {
    if (matrix.paragraphs.length === 0) return 0;

    // Weighted average of paragraph composite scores
    // Give slightly more weight to opening and closing paragraphs
    const total = matrix.paragraphs.length;
    let weightedSum = 0;
    let weightSum = 0;

    for (const p of matrix.paragraphs) {
      let weight = 1.0;
      // Opening paragraph gets 1.2x weight
      if (p.index === 0) weight = 1.2;
      // Closing paragraph gets 1.1x weight
      if (p.index === total - 1 && total > 1) weight = 1.1;

      weightedSum += p.compositeScore * weight;
      weightSum += weight;
    }

    return Math.round((weightedSum / weightSum) * 100) / 100;
  }

  private mapToImpressionLabel(eqi: number): ImpressionLabel {
    for (const { min, label } of IMPRESSION_THRESHOLDS) {
      if (eqi >= min) return label;
    }
    return 'template_like_rebuild';
  }

  private mapToReadinessLevel(eqi: number): ReadinessLevel {
    for (const { min, level } of READINESS_THRESHOLDS) {
      if (eqi >= min) return level;
    }
    return 'needs_major_revision';
  }
}

/** Singleton crystallizer */
export const crystallizer = new Crystallizer();
export { Crystallizer };
