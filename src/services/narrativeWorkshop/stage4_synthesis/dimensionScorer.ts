// @ts-nocheck
/**
 * Stage 4.1: Dimension Scorer
 *
 * Calculates the 12 dimension scores by aggregating insights from Stages 1-3.
 * Each dimension has specific logic combining multiple analysis inputs.
 *
 * 12 Dimensions (from rubric):
 * 1. Opening Power & Scene Entry
 * 2. Narrative Arc & Structure
 * 3. Character Interiority & Vulnerability
 * 4. Show Don't Tell & Concrete Detail
 * 5. Reflection & Meaning-Making
 * 6. Dialogue & Action Balance
 * 7. Originality, Specificity & Voice
 * 8. Structure & Pacing
 * 9. Sentence Craft & Style
 * 10. Context & Constraints (fit with type)
 * 11. School Fit & Alignment (if applicable)
 * 12. Ethical Maturity & Humility
 *
 * Essay-type-specific weights applied after base scoring.
 */

import {
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis
} from '../types';
import { getEssayTypeProfile } from '../essayTypeCalibration';

export interface DimensionScores {
  openingPower: number;                  // 0-10
  narrativeArc: number;
  characterInteriority: number;
  showDontTell: number;
  reflectionMeaningMaking: number;
  dialogueAction: number;
  originalityVoice: number;
  structurePacing: number;
  sentenceCraft: number;
  contextConstraints: number;
  schoolFit: number;
  ethicalHumility: number;
}

/**
 * Calculate all 12 dimension scores
 */
export function calculateDimensionScores(
  stage1: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis,
  essayType: string
): DimensionScores {

  // Base scores (0-10 raw)
  const baseScores: DimensionScores = {
    openingPower: calculateOpeningPower(stage2.opening, stage1),
    narrativeArc: calculateNarrativeArc(stage1, stage2),
    characterInteriority: calculateCharacterInteriority(stage2.characterDevelopment, stage2.climaxTurningPoint),
    showDontTell: calculateShowDontTell(stage2.bodyDevelopment, stage2.opening),
    reflectionMeaningMaking: calculateReflectionMeaningMaking(stage2.conclusionReflection, stage1),
    dialogueAction: calculateDialogueAction(stage2.characterDevelopment, stage2.bodyDevelopment),
    originalityVoice: calculateOriginalityVoice(stage3.styleAnalysis, stage2.characterDevelopment, stage1),
    structurePacing: calculateStructurePacing(stage1, stage2.bodyDevelopment),
    sentenceCraft: calculateSentenceCraft(stage3.grammarAnalysis, stage3.styleAnalysis),
    contextConstraints: calculateContextConstraints(stage1, stage2, essayType),
    schoolFit: calculateSchoolFit(stage1, stage2),
    ethicalHumility: calculateEthicalHumility(stage2.climaxTurningPoint, stage2.conclusionReflection, stage1)
  };

  // Apply essay-type-specific weights
  const typeProfile = getEssayTypeProfile(essayType as any);
  const weightedScores = applyEssayTypeWeights(baseScores, typeProfile.dimensionWeightAdjustments);

  return weightedScores;
}

// ============================================================================
// DIMENSION 1: OPENING POWER & SCENE ENTRY
// ============================================================================

function calculateOpeningPower(
  opening: any,
  holistic: HolisticUnderstanding
): number {
  let score = 5; // Start neutral

  // Hook strength (30% of score)
  if (opening.hookStrength >= 9) score += 1.5;
  else if (opening.hookStrength >= 7) score += 1;
  else if (opening.hookStrength >= 5) score += 0.5;
  else if (opening.hookStrength < 3) score -= 1.5;

  // Hook type quality (20% of score)
  if (opening.hookType === 'scene' || opening.hookType === 'provocative_claim') score += 1;
  else if (opening.hookType === 'dialogue') score += 0.7;
  else if (opening.hookType === 'generic') score -= 2;

  // Scene vividness (20% of score)
  if (opening.hasOpeningScene) {
    if (opening.sceneVividness >= 8) score += 1;
    else if (opening.sceneVividness >= 6) score += 0.5;
    else score += 0.2;
  } else {
    score -= 0.5; // Penalty for no scene
  }

  // Sensory details presence (15% of score)
  const sensoryCount = opening.sensoryDetails?.length || 0;
  if (sensoryCount >= 3) score += 0.75;
  else if (sensoryCount >= 1) score += 0.4;
  else score -= 0.3;

  // Reader engagement prediction (15% of score)
  if (opening.readerEngagement >= 8) score += 0.75;
  else if (opening.readerEngagement >= 6) score += 0.4;
  else if (opening.readerEngagement < 4) score -= 0.75;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 2: NARRATIVE ARC & STRUCTURE
// ============================================================================

function calculateNarrativeArc(
  holistic: HolisticUnderstanding,
  stage2: DeepDiveAnalyses
): number {
  let score = 5;

  // Overall coherence (25%)
  if (holistic.overallCoherence >= 9) score += 1.25;
  else if (holistic.overallCoherence >= 7) score += 0.75;
  else if (holistic.overallCoherence < 5) score -= 1.25;

  // Structure type quality (20%)
  const goodStructures = ['moment-focused', 'thematic', 'circular'];
  if (goodStructures.includes(holistic.essayStructure)) score += 1;
  else if (holistic.essayStructure === 'chronological') score += 0.5;
  else if (holistic.essayStructure === 'unclear') score -= 1;

  // Turning point presence (25%)
  if (stage2.climaxTurningPoint.hasTurningPoint) {
    if (stage2.climaxTurningPoint.turningPointDepth >= 8) score += 1.25;
    else if (stage2.climaxTurningPoint.turningPointDepth >= 6) score += 0.75;
    else score += 0.4;
  } else {
    score -= 1; // Major penalty
  }

  // Narrative progression (20%)
  if (stage2.bodyDevelopment.narrativeProgression >= 8) score += 1;
  else if (stage2.bodyDevelopment.narrativeProgression >= 6) score += 0.5;
  else if (stage2.bodyDevelopment.narrativeProgression < 4) score -= 1;

  // Resolution quality (10%)
  if (stage2.stakesTension.resolutionPresent && stage2.stakesTension.resolutionSatisfying) {
    score += 0.5;
  }

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 3: CHARACTER INTERIORITY & VULNERABILITY
// ============================================================================

function calculateCharacterInteriority(
  character: any,
  climax: any
): number {
  let score = 5;

  // Interiority depth (30%)
  if (character.interiorityPresent) {
    if (character.interiorityDepth >= 8) score += 1.5;
    else if (character.interiorityDepth >= 6) score += 0.9;
    else score += 0.4;
  } else {
    score -= 1.5; // Critical penalty
  }

  // Vulnerability moments (40% - CRITICAL)
  const vulnCount = climax.vulnerabilityMoments?.length || 0;
  if (vulnCount >= 2) {
    // Check depth of vulnerability
    const avgDepth = climax.vulnerabilityMoments.reduce((sum: number, v: any) => sum + v.depth, 0) / vulnCount;
    if (avgDepth >= 8) score += 2;
    else if (avgDepth >= 6) score += 1.5;
    else score += 1;
  } else if (vulnCount === 1) {
    score += 0.5;
  } else {
    score -= 2; // Major penalty (85% of elite essays have 2+)
  }

  // Protagonist clarity (15%)
  if (character.protagonistClarity >= 8) score += 0.75;
  else if (character.protagonistClarity >= 6) score += 0.4;
  else if (character.protagonistClarity < 4) score -= 0.75;

  // Emotion description quality (15%)
  if (character.emotionDescriptionType === 'physical_sensory') score += 0.75;
  else if (character.emotionDescriptionType === 'behavioral') score += 0.5;
  else if (character.emotionDescriptionType === 'mixed') score += 0.3;
  else if (character.emotionDescriptionType === 'abstract_labels') score -= 0.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 4: SHOW DON'T TELL & CONCRETE DETAIL
// ============================================================================

function calculateShowDontTell(
  body: any,
  opening: any
): number {
  let score = 5;

  // Show vs tell balance (40%)
  if (body.showVsTell.showing >= 8 && body.showVsTell.telling <= 3) {
    score += 2; // Elite ratio
  } else if (body.showVsTell.showing >= 6 && body.showVsTell.telling <= 5) {
    score += 1.2;
  } else if (body.showVsTell.showing < 4) {
    score -= 2; // Too much telling
  }

  // Specificity level (30%)
  if (body.specificityLevel >= 8) score += 1.5;
  else if (body.specificityLevel >= 6) score += 0.9;
  else if (body.specificityLevel < 4) score -= 1.5;

  // Quantification presence (20%)
  if (body.quantificationPresence >= 7) score += 1;
  else if (body.quantificationPresence >= 5) score += 0.5;
  else if (body.quantificationPresence < 3) score -= 1;

  // Concrete examples vs vague statements (10%)
  const concreteCount = body.concreteExamples?.length || 0;
  const vagueCount = body.vagueStatements?.length || 0;
  if (concreteCount > vagueCount * 2) score += 0.5;
  else if (vagueCount > concreteCount) score -= 0.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 5: REFLECTION & MEANING-MAKING
// ============================================================================

function calculateReflectionMeaningMaking(
  conclusion: any,
  holistic: HolisticUnderstanding
): number {
  let score = 5;

  // Reflection depth (30%)
  if (conclusion.reflectionPresent) {
    if (conclusion.reflectionDepth >= 9) score += 1.5;
    else if (conclusion.reflectionDepth >= 7) score += 1;
    else if (conclusion.reflectionDepth >= 5) score += 0.5;
    else score += 0.2;
  } else {
    score -= 1.5;
  }

  // Reflection type quality (25%)
  if (conclusion.reflectionType === 'profound') score += 1.25;
  else if (conclusion.reflectionType === 'deep') score += 0.9;
  else if (conclusion.reflectionType === 'moderate') score += 0.4;
  else if (conclusion.reflectionType === 'surface') score -= 0.75;

  // Micro→macro structure (25% - 70% of elite essays have this)
  if (conclusion.microToMacro.present) {
    if (conclusion.microToMacro.connectionQuality >= 8) score += 1.25;
    else if (conclusion.microToMacro.connectionQuality >= 6) score += 0.9;
    else score += 0.5;
  } else {
    score -= 0.5; // Miss elite pattern
  }

  // Philosophical depth (15%)
  if (conclusion.philosophicalDepth >= 8) score += 0.75;
  else if (conclusion.philosophicalDepth >= 6) score += 0.4;
  else if (conclusion.philosophicalDepth < 4) score -= 0.5;

  // Cliché penalty (5%)
  const clicheCount = conclusion.clichesDetected?.length || 0;
  if (clicheCount >= 2) score -= 1;
  else if (clicheCount === 1) score -= 0.5;
  else score += 0.25; // Bonus for avoiding clichés

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 6: DIALOGUE & ACTION BALANCE
// ============================================================================

function calculateDialogueAction(
  character: any,
  body: any
): number {
  let score = 5;

  // Agency level (50% - action/decision-making)
  if (character.agencyLevel >= 8) score += 2.5;
  else if (character.agencyLevel >= 6) score += 1.5;
  else if (character.agencyLevel >= 4) score += 0.5;
  else score -= 1.5; // Passive protagonist is weak

  // Dialogue quality (30% - if present)
  if (character.dialoguePresent) {
    if (character.dialogueQuality >= 8) score += 1.5;
    else if (character.dialogueQuality >= 6) score += 0.9;
    else if (character.dialogueQuality < 4) score -= 0.6; // Bad dialogue worse than none

    // Dialogue amount check (elite essays use ≤5%)
    if (character.dialoguePercentage > 10) score -= 0.5;
  } else {
    score += 0.3; // Slight bonus - dialogue not required
  }

  // Growth demonstration (20%)
  if (character.growthDemonstrated === 'shown_through_action') score += 1;
  else if (character.growthDemonstrated === 'shown_through_perspective') score += 0.7;
  else if (character.growthDemonstrated === 'claimed_not_shown') score -= 0.7;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 7: ORIGINALITY, SPECIFICITY & VOICE
// ============================================================================

function calculateOriginalityVoice(
  style: any,
  character: any,
  holistic: HolisticUnderstanding
): number {
  let score = 5;

  // Voice distinctiveness (30%)
  if (style.voiceDistinctiveness === 'highly_distinctive') score += 1.5;
  else if (style.voiceDistinctiveness === 'clear_personality') score += 1;
  else if (style.voiceDistinctiveness === 'generic') score -= 1.5;
  else if (style.voiceDistinctiveness === 'trying_too_hard') score -= 1;

  // Originality score (25%)
  if (style.originalityScore >= 8) score += 1.25;
  else if (style.originalityScore >= 6) score += 0.75;
  else if (style.originalityScore < 4) score -= 1;

  // Voice authenticity (20%)
  if (character.voiceAuthenticity >= 8) score += 1;
  else if (character.voiceAuthenticity >= 6) score += 0.6;
  else if (character.voiceAuthenticity < 4) score -= 1;

  // Memorable phrases (15%)
  const memorableCount = style.memorablePhrases?.length || 0;
  if (memorableCount >= 3) score += 0.75;
  else if (memorableCount >= 1) score += 0.4;

  // Voice consistency (10%)
  if (style.voiceConsistency >= 8) score += 0.5;
  else if (style.voiceConsistency < 5) score -= 0.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 8: STRUCTURE & PACING
// ============================================================================

function calculateStructurePacing(
  holistic: HolisticUnderstanding,
  body: any
): number {
  let score = 5;

  // Transition quality (30%)
  if (holistic.transitionQuality >= 8) score += 1.5;
  else if (holistic.transitionQuality >= 6) score += 0.9;
  else if (holistic.transitionQuality < 4) score -= 1.5;

  // Pacing rating (40%)
  if (body.pacingRating >= 8) score += 2;
  else if (body.pacingRating >= 6) score += 1.2;
  else if (body.pacingRating < 4) score -= 2;

  // Rushed/belabored sections (20%)
  const rushedCount = body.rushedSections?.length || 0;
  const belaboredCount = body.belaboredSections?.length || 0;
  const pacingIssues = rushedCount + belaboredCount;

  if (pacingIssues === 0) score += 1;
  else if (pacingIssues === 1) score += 0.3;
  else if (pacingIssues >= 3) score -= 1;

  // Section count appropriateness (10%)
  const sections = holistic.numberOfDistinctSections;
  if (sections >= 3 && sections <= 6) score += 0.5;
  else if (sections < 2 || sections > 8) score -= 0.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 9: SENTENCE CRAFT & STYLE
// ============================================================================

function calculateSentenceCraft(
  grammar: any,
  style: any
): number {
  let score = 5;

  // Sentence variety (25%)
  if (grammar.sentenceMetrics.varietyScore >= 8) score += 1.25;
  else if (grammar.sentenceMetrics.varietyScore >= 6) score += 0.75;
  else if (grammar.sentenceMetrics.varietyScore < 4) score -= 1.25;

  // Rhythm quality (20%)
  if (style.rhythmQuality >= 8) score += 1;
  else if (style.rhythmQuality >= 6) score += 0.6;
  else if (style.rhythmQuality < 4) score -= 1;

  // Grammar overall score (20%)
  if (grammar.overallGrammarScore >= 8) score += 1;
  else if (grammar.overallGrammarScore >= 6) score += 0.6;
  else if (grammar.overallGrammarScore < 5) score -= 1;

  // Lexical diversity (15%)
  if (grammar.wordChoice.lexicalDiversity >= 0.60) score += 0.75;
  else if (grammar.wordChoice.lexicalDiversity >= 0.55) score += 0.4;
  else if (grammar.wordChoice.lexicalDiversity < 0.50) score -= 0.75;

  // Passive voice check (10%)
  if (grammar.verbAnalysis.passivePercentage < 10) score += 0.5;
  else if (grammar.verbAnalysis.passivePercentage > 20) score -= 0.5;

  // Imagery strength (10%)
  if (style.imageryStrength >= 7) score += 0.5;
  else if (style.imageryStrength < 4) score -= 0.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 10: CONTEXT & CONSTRAINTS
// ============================================================================

function calculateContextConstraints(
  holistic: HolisticUnderstanding,
  stage2: DeepDiveAnalyses,
  essayType: string
): number {
  let score = 7; // Start higher - most essays meet basic requirements

  // Quantification (important for establishing credibility)
  if (stage2.bodyDevelopment.quantificationPresence >= 7) score += 1.5;
  else if (stage2.bodyDevelopment.quantificationPresence >= 5) score += 0.8;
  else if (stage2.bodyDevelopment.quantificationPresence < 3) score -= 1.5;

  // Context clarity
  if (stage2.opening.contextClarity >= 8) score += 1;
  else if (stage2.opening.contextClarity < 5) score -= 1;

  // Stakes establishment (what's at risk?)
  if (stage2.stakesTension.stakesEstablished) {
    if (stage2.stakesTension.stakesHeight >= 7) score += 0.5;
  } else {
    score -= 1;
  }

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 11: SCHOOL FIT & ALIGNMENT
// ============================================================================

function calculateSchoolFit(
  holistic: HolisticUnderstanding,
  stage2: DeepDiveAnalyses
): number {
  // This is harder to calculate without specific school context
  // Use intellectual depth and authenticity as proxies
  let score = 6; // Neutral

  // Intellectual maturity (proxy for fit with selective schools)
  if (stage2.conclusionReflection.intellectualMaturity >= 8) score += 2;
  else if (stage2.conclusionReflection.intellectualMaturity >= 6) score += 1;
  else if (stage2.conclusionReflection.intellectualMaturity < 4) score -= 1;

  // Authenticity signals
  const authCount = holistic.authenticitySignals.length;
  if (authCount >= 3) score += 1;
  else if (authCount < 1) score -= 1;

  // Red flags
  const redFlagCount = holistic.redFlags.length;
  if (redFlagCount === 0) score += 1;
  else if (redFlagCount >= 2) score -= 1.5;

  return clamp(score, 0, 10);
}

// ============================================================================
// DIMENSION 12: ETHICAL MATURITY & HUMILITY
// ============================================================================

function calculateEthicalHumility(
  climax: any,
  conclusion: any,
  holistic: HolisticUnderstanding
): number {
  let score = 6; // Start slightly above neutral

  // Vulnerability = humility (acknowledging limitations)
  const vulnCount = climax.vulnerabilityMoments?.length || 0;
  if (vulnCount >= 2) score += 2;
  else if (vulnCount === 1) score += 1;
  else score -= 1; // Lack of vulnerability = lack of humility

  // Nuanced thinking (seeing complexity)
  const nuanceCount = conclusion.nuancedThinking?.length || 0;
  if (nuanceCount >= 2) score += 1;
  else if (nuanceCount >= 1) score += 0.5;

  // Conflict complexity (internal = self-awareness)
  if (climax.conflictType === 'both') score += 0.5;
  else if (climax.conflictType === 'internal') score += 0.3;

  // Check for arrogance markers (red flag check)
  const redFlags = holistic.redFlags.filter(f =>
    f.toLowerCase().includes('arrogance') ||
    f.toLowerCase().includes('superiority') ||
    f.toLowerCase().includes('dismissive')
  );
  if (redFlags.length > 0) score -= 2;

  return clamp(score, 0, 10);
}

// ============================================================================
// ESSAY TYPE WEIGHT ADJUSTMENTS
// ============================================================================

function applyEssayTypeWeights(
  baseScores: DimensionScores,
  adjustments: Record<string, number>
): DimensionScores {
  // Map dimension names to adjustment keys
  const dimensionMap: Record<keyof DimensionScores, string> = {
    openingPower: 'opening_power_scene_entry',
    narrativeArc: 'narrative_arc_structure',
    characterInteriority: 'character_interiority_vulnerability',
    showDontTell: 'show_dont_tell_concrete',
    reflectionMeaningMaking: 'reflection_meaning_making',
    dialogueAction: 'dialogue_action_balance',
    originalityVoice: 'originality_specificity_voice',
    structurePacing: 'structure_pacing',
    sentenceCraft: 'sentence_craft_style',
    contextConstraints: 'context_constraints_disclosure',
    schoolFit: 'school_fit_why_major',
    ethicalHumility: 'ethical_maturity_humility'
  };

  const weighted: DimensionScores = { ...baseScores };

  for (const [dimension, adjKey] of Object.entries(dimensionMap)) {
    const adjustment = adjustments[adjKey] || 1.0;
    const key = dimension as keyof DimensionScores;

    // Apply multiplier and reclamp
    weighted[key] = clamp(baseScores[key] * adjustment, 0, 10);
  }

  return weighted;
}

// ============================================================================
// UTILITIES
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}
