/**
 * StylometricAnalyzer — Unified Entry Point
 *
 * Orchestrates all stylometric analysis techniques into a single
 * coherent interface. This is the primary class consumers should use.
 *
 * All methods are pure computation — zero LLM calls, zero external
 * dependencies, zero network requests. Target: < 20ms per analysis.
 *
 * Usage:
 *   const analyzer = new StylometricAnalyzer();
 *
 *   // Full analysis of a single text
 *   const result = analyzer.analyze(essayText);
 *
 *   // Compare two texts for consistency
 *   const consistency = analyzer.compareTexts(essay1, essay2);
 *
 *   // Track voice evolution across revisions
 *   const evolution = analyzer.trackEvolution(originalText, revisedText);
 *
 *   // Portfolio-level consistency check
 *   const portfolio = analyzer.checkPortfolio([essay1, essay2, essay3]);
 *
 *   // Map to rubric dimensions
 *   const rubricScores = analyzer.mapToRubric(result);
 */

import type {
  StylometricAnalysis,
  VoiceFingerprint,
  AIDetectionResult,
  RegisterAnalysis,
  RhythmAnalysis,
  IdiolectProfile,
  VoiceConsistencyScore,
  VoiceEvolutionResult,
  RubricMapping,
} from './types';
import { buildFingerprint } from './fingerprintBuilder';
import { detectAIWriting } from './aiDetector';
import { compareFingerprints, comparePortfolio, trackVoiceEvolution } from './voiceComparator';
import { analyzeRegister } from './registerAnalyzer';
import { analyzeRhythm } from './rhythmAnalyzer';
import { detectIdiolect } from './idiolectDetector';
import { clamp } from './textUtils';

// ============================================================================
// MAIN CLASS
// ============================================================================

export class StylometricAnalyzer {

  // ==========================================================================
  // FULL ANALYSIS (single text)
  // ==========================================================================

  /**
   * Perform complete stylometric analysis on a text.
   *
   * This is the primary entry point for analyzing a single document.
   * Returns fingerprint, AI detection, register, rhythm, and idiolect.
   *
   * Performance: < 20ms for a 650-word essay.
   *
   * @param text - Raw text to analyze
   * @returns Complete StylometricAnalysis
   */
  analyze(text: string): StylometricAnalysis {
    const startTime = performance.now();

    // Build the voice fingerprint (foundation for everything else)
    const fingerprint = buildFingerprint(text);

    // Run all analyses
    const aiDetection = detectAIWriting(text, fingerprint);
    const registerAnalysis = analyzeRegister(text);
    const rhythmAnalysis = analyzeRhythm(text);
    const idiolect = detectIdiolect(text);

    const computeTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      fingerprint,
      aiDetection,
      registerAnalysis,
      rhythmAnalysis,
      idiolect,
      computeTimeMs,
    };
  }

  // ==========================================================================
  // FINGERPRINT ONLY
  // ==========================================================================

  /**
   * Build only the voice fingerprint (fastest operation).
   * Use this when you only need the persistable fingerprint, not full analysis.
   *
   * Performance: < 5ms.
   */
  buildFingerprint(text: string): VoiceFingerprint {
    return buildFingerprint(text);
  }

  // ==========================================================================
  // AI DETECTION ONLY
  // ==========================================================================

  /**
   * Run only AI detection.
   * Use this for quick pre-screening before LLM-based analysis.
   *
   * Performance: < 5ms.
   */
  detectAI(text: string): AIDetectionResult {
    return detectAIWriting(text);
  }

  // ==========================================================================
  // TEXT COMPARISON
  // ==========================================================================

  /**
   * Compare two texts for voice consistency.
   * Uses Burrows' Delta and per-dimension analysis.
   *
   * @param text1 - First text (e.g., reference sample)
   * @param text2 - Second text (e.g., new essay to check)
   * @returns Consistency score with breakdown
   */
  compareTexts(text1: string, text2: string): VoiceConsistencyScore {
    const fp1 = buildFingerprint(text1);
    const fp2 = buildFingerprint(text2);
    return compareFingerprints(fp1, fp2);
  }

  /**
   * Compare two pre-computed fingerprints.
   * Use this when fingerprints are already stored (e.g., from Supabase).
   */
  compareFingerprints(fp1: VoiceFingerprint, fp2: VoiceFingerprint): VoiceConsistencyScore {
    return compareFingerprints(fp1, fp2);
  }

  // ==========================================================================
  // PORTFOLIO CONSISTENCY
  // ==========================================================================

  /**
   * Check voice consistency across a portfolio of essays.
   * Returns pairwise comparison matrix, overall consistency, and outlier indices.
   *
   * @param texts - Array of essay texts
   * @returns Portfolio consistency analysis
   */
  checkPortfolio(texts: string[]): {
    pairwise: { i: number; j: number; score: VoiceConsistencyScore }[];
    overallConsistency: number;
    outlierIndices: number[];
    fingerprints: VoiceFingerprint[];
  } {
    const fingerprints = texts.map(t => buildFingerprint(t));
    const result = comparePortfolio(fingerprints);
    return { ...result, fingerprints };
  }

  /**
   * Check portfolio using pre-computed fingerprints.
   */
  checkPortfolioFromFingerprints(fingerprints: VoiceFingerprint[]): {
    pairwise: { i: number; j: number; score: VoiceConsistencyScore }[];
    overallConsistency: number;
    outlierIndices: number[];
  } {
    return comparePortfolio(fingerprints);
  }

  // ==========================================================================
  // VOICE EVOLUTION
  // ==========================================================================

  /**
   * Track how voice changes between two revisions of the same text.
   *
   * @param originalText - The original version
   * @param revisedText - The revised version
   * @returns Evolution analysis with drift, direction, and warnings
   */
  trackEvolution(originalText: string, revisedText: string): VoiceEvolutionResult {
    const before = buildFingerprint(originalText);
    const after = buildFingerprint(revisedText);
    return trackVoiceEvolution(before, after);
  }

  /**
   * Track evolution using pre-computed fingerprints.
   */
  trackEvolutionFromFingerprints(
    before: VoiceFingerprint,
    after: VoiceFingerprint
  ): VoiceEvolutionResult {
    return trackVoiceEvolution(before, after);
  }

  // ==========================================================================
  // REGISTER ANALYSIS
  // ==========================================================================

  /**
   * Analyze register and formality of a text.
   */
  analyzeRegister(text: string): RegisterAnalysis {
    return analyzeRegister(text);
  }

  // ==========================================================================
  // RHYTHM ANALYSIS
  // ==========================================================================

  /**
   * Analyze rhythmic patterns in a text.
   */
  analyzeRhythm(text: string): RhythmAnalysis {
    return analyzeRhythm(text);
  }

  // ==========================================================================
  // IDIOLECT DETECTION
  // ==========================================================================

  /**
   * Detect distinctive personal language patterns.
   */
  detectIdiolect(text: string): IdiolectProfile {
    return detectIdiolect(text);
  }

  // ==========================================================================
  // RUBRIC MAPPING
  // ==========================================================================

  /**
   * Map stylometric analysis results to Uplift's rubric dimensions.
   *
   * Maps to four dimensions:
   * - voice_integrity: authenticity, personal voice strength
   * - vulnerability_risk: emotional exposure, authentic struggle
   * - craft_language_quality: writing sophistication, rhythm, word choice
   * - audience_awareness: register appropriateness, formality matching
   *
   * Each dimension returns a score (0-10) and contributing signals.
   *
   * @param analysis - Complete stylometric analysis
   * @returns Rubric dimension scores with explanations
   */
  mapToRubric(analysis: StylometricAnalysis): RubricMapping {
    return {
      voice_integrity: mapVoiceIntegrity(analysis),
      vulnerability_risk: mapVulnerabilityRisk(analysis),
      craft_language_quality: mapCraftLanguageQuality(analysis),
      audience_awareness: mapAudienceAwareness(analysis),
    };
  }
}

// ============================================================================
// RUBRIC MAPPING IMPLEMENTATIONS
// ============================================================================

/**
 * voice_integrity: How authentic and distinctive is the writing voice?
 *
 * Signals:
 * - Idiolect distinctiveness (unique voice patterns)
 * - AI detection probability (low AI = high authenticity)
 * - Contraction preference (natural usage for personal essays)
 * - Sentence variety (not monotonous)
 * - Function word naturalness
 */
function mapVoiceIntegrity(analysis: StylometricAnalysis): RubricMapping['voice_integrity'] {
  const signals: string[] = [];
  let score = 5; // Start at neutral

  // Idiolect distinctiveness (+2)
  const distinctiveness = analysis.idiolect.distinctiveness;
  if (distinctiveness > 0.5) {
    score += 2;
    signals.push('Highly distinctive personal voice');
  } else if (distinctiveness > 0.3) {
    score += 1;
    signals.push('Moderately distinctive voice');
  } else {
    signals.push('Low voice distinctiveness — may sound generic');
  }

  // AI detection (inverse)
  if (analysis.aiDetection.aiProbability < 0.3) {
    score += 1.5;
    signals.push('Writing has natural human patterns');
  } else if (analysis.aiDetection.aiProbability > 0.6) {
    score -= 2;
    signals.push('Writing shows AI-like statistical patterns');
  }

  // Signature phrases
  if (analysis.idiolect.signaturePhrases.length >= 3) {
    score += 0.5;
    signals.push('Has personal signature phrases');
  }

  // Natural sentence variety
  const fp = analysis.fingerprint;
  if (fp.sentenceMetrics.stdDevLength > 5) {
    score += 0.5;
    signals.push('Good sentence length variety (natural rhythm)');
  } else if (fp.sentenceMetrics.stdDevLength < 3) {
    score -= 0.5;
    signals.push('Low sentence variety (may sound robotic)');
  }

  // Punctuation habits (having them = distinctive)
  if (analysis.idiolect.punctuationHabits.length >= 2) {
    score += 0.5;
    signals.push('Distinctive punctuation style');
  }

  return {
    score: clamp(Math.round(score * 10) / 10, 0, 10),
    signals,
  };
}

/**
 * vulnerability_risk: Does the writing show genuine emotional exposure?
 *
 * Stylometric signals (limited — this dimension is more content-based):
 * - First person pronoun density (higher in vulnerable writing)
 * - Sentence length variation (emotional writing has more variety)
 * - Fragment usage (emotional emphasis)
 * - Contraction usage (more casual = more personal)
 */
function mapVulnerabilityRisk(analysis: StylometricAnalysis): RubricMapping['vulnerability_risk'] {
  const signals: string[] = [];
  let score = 5;

  const fp = analysis.fingerprint;

  // First person density (personal essays with vulnerability are I-heavy)
  if (fp.register.firstPersonRate > 40) {
    score += 1;
    signals.push('High first-person usage (personal/vulnerable)');
  } else if (fp.register.firstPersonRate < 15) {
    score -= 1;
    signals.push('Low first-person usage (may lack personal exposure)');
  }

  // Fragment usage (emotional emphasis — "But I couldn't. Not yet.")
  const fragmentRatio = analysis.idiolect.preferredStructures.fragmentRatio;
  if (fragmentRatio > 0.1) {
    score += 0.5;
    signals.push('Uses fragments for emphasis (emotional technique)');
  }

  // Sentence variety (emotional writing is varied)
  if (fp.sentenceMetrics.stdDevLength > 7) {
    score += 0.5;
    signals.push('High sentence variety (emotionally dynamic)');
  }

  // Contractions (more casual = more personal/vulnerable)
  if (fp.contractions.contractionPreference > 0.6) {
    score += 0.5;
    signals.push('Natural contraction use (conversational, open)');
  }

  // Staccato device (emotional emphasis)
  if (analysis.rhythmAnalysis.devices.staccato.detected) {
    score += 0.5;
    signals.push('Uses staccato sentences for emotional impact');
  }

  // Note: stylometric analysis has limited vulnerability detection
  // LLM-based analysis is better for actual content-level vulnerability
  signals.push('Note: content-level vulnerability analysis requires LLM');

  return {
    score: clamp(Math.round(score * 10) / 10, 0, 10),
    signals,
  };
}

/**
 * craft_language_quality: How sophisticated is the writing craft?
 *
 * Signals:
 * - Rhythm quality score
 * - Rhetorical devices detected
 * - Vocabulary richness (TTR, polysyllabic ratio)
 * - Sentence structure variety
 * - Register consistency
 */
function mapCraftLanguageQuality(analysis: StylometricAnalysis): RubricMapping['craft_language_quality'] {
  const signals: string[] = [];
  let score = 5;

  // Rhythm quality (0-10 scale, major contributor)
  const rhythmScore = analysis.rhythmAnalysis.qualityScore;
  score += (rhythmScore - 5) * 0.4; // Scale contribution

  if (rhythmScore >= 7) {
    signals.push(`Strong rhythmic quality (${rhythmScore}/10)`);
  } else if (rhythmScore <= 3) {
    signals.push(`Weak rhythmic quality (${rhythmScore}/10)`);
  }

  // Rhetorical devices
  const devices = analysis.rhythmAnalysis.devices;
  const deviceCount = [
    devices.anaphora.detected,
    devices.epistrophe.detected,
    devices.parallelStructure.detected,
    devices.tricolon.detected,
    devices.staccato.detected,
  ].filter(Boolean).length;

  if (deviceCount >= 3) {
    score += 1.5;
    signals.push(`Multiple rhetorical devices detected (${deviceCount})`);
  } else if (deviceCount >= 1) {
    score += 0.5;
    signals.push(`Some rhetorical devices present (${deviceCount})`);
  } else {
    signals.push('No rhetorical devices detected');
  }

  // Vocabulary sophistication
  const fp = analysis.fingerprint;
  if (fp.vocabulary.polysyllabicRatio > 0.15) {
    score += 0.5;
    signals.push('Sophisticated vocabulary (high polysyllabic ratio)');
  }
  if (fp.vocabulary.typeTokenRatio > 0.7) {
    score += 0.5;
    signals.push('Rich vocabulary diversity');
  } else if (fp.vocabulary.typeTokenRatio < 0.45) {
    score -= 0.5;
    signals.push('Limited vocabulary diversity');
  }

  // Register consistency
  if (analysis.registerAnalysis.internalConsistency > 0.8) {
    score += 0.5;
    signals.push('Consistent tone throughout');
  } else if (analysis.registerAnalysis.internalConsistency < 0.5) {
    score -= 0.5;
    signals.push('Inconsistent tone — jarring register shifts');
  }

  // Sentence pattern (varied > monotonous)
  if (analysis.rhythmAnalysis.lengthPattern === 'varied' || analysis.rhythmAnalysis.lengthPattern === 'wave') {
    score += 0.5;
    signals.push('Effective sentence length pattern');
  } else if (analysis.rhythmAnalysis.lengthPattern === 'monotonous') {
    score -= 1;
    signals.push('Monotonous sentence pattern — all similar lengths');
  }

  return {
    score: clamp(Math.round(score * 10) / 10, 0, 10),
    signals,
  };
}

/**
 * audience_awareness: Is the register appropriate for the context?
 *
 * For college application essays, the ideal register is:
 * - Conversational to semi-formal (not academic, not too casual)
 * - Consistent throughout
 * - Personal without being sloppy
 *
 * Signals:
 * - Register classification
 * - Formality score (sweet spot: 0.35-0.55 for personal essays)
 * - Register shift count and severity
 * - Appropriate first-person usage
 */
function mapAudienceAwareness(analysis: StylometricAnalysis): RubricMapping['audience_awareness'] {
  const signals: string[] = [];
  let score = 5;

  const reg = analysis.registerAnalysis;

  // Ideal formality for college application essays: 0.35-0.55
  const formality = reg.formalityScore;
  if (formality >= 0.35 && formality <= 0.55) {
    score += 2;
    signals.push('Ideal formality level for personal essays');
  } else if (formality >= 0.25 && formality <= 0.65) {
    score += 1;
    signals.push('Acceptable formality level');
  } else if (formality > 0.7) {
    score -= 1;
    signals.push('Too formal for a personal essay — sounds like an academic paper');
  } else if (formality < 0.2) {
    score -= 1;
    signals.push('Too casual — may lack appropriate seriousness');
  }

  // Register classification
  if (reg.primaryRegister === 'conversational' || reg.primaryRegister === 'semi-formal') {
    score += 0.5;
    signals.push(`Register: ${reg.primaryRegister} (appropriate for college essays)`);
  } else if (reg.primaryRegister === 'academic') {
    score -= 0.5;
    signals.push('Academic register — sounds impersonal for a personal essay');
  } else if (reg.primaryRegister === 'casual') {
    signals.push('Casual register — acceptable for some essay types');
  } else if (reg.primaryRegister === 'literary') {
    score += 0.5;
    signals.push('Literary register — shows craft if sustained');
  }

  // Register shifts
  const jarringShifts = reg.registerShifts.filter(s => s.severity === 'jarring');
  const noticeableShifts = reg.registerShifts.filter(s => s.severity === 'noticeable');

  if (jarringShifts.length > 0) {
    score -= 1;
    signals.push(`${jarringShifts.length} jarring tone shift(s) detected`);
  }
  if (noticeableShifts.length > 1) {
    score -= 0.5;
    signals.push(`${noticeableShifts.length} noticeable tone shifts`);
  }

  // Internal consistency
  if (reg.internalConsistency > 0.85) {
    score += 0.5;
    signals.push('Highly consistent tone throughout');
  } else if (reg.internalConsistency < 0.5) {
    score -= 0.5;
    signals.push('Inconsistent tone — reader may feel confused');
  }

  return {
    score: clamp(Math.round(score * 10) / 10, 0, 10),
    signals,
  };
}

// ============================================================================
// SINGLETON
// ============================================================================

export const stylometricAnalyzer = new StylometricAnalyzer();
