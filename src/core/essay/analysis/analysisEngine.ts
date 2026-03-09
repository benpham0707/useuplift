// @ts-nocheck - Legacy analysis file with type mismatches
/**
 * Analysis Engine — Core Orchestrator
 *
 * Aggregates all feature detectors and produces comprehensive AnalysisReport.
 *
 * ARCHITECTURE:
 * This is the OBJECTIVE, DETERMINISTIC analysis layer (temp 0.2-0.3).
 * Separated from Story Coach Engine (creative, temp 0.6-0.8).
 *
 * FEATURE DETECTORS:
 * 1. Scene Detector — Temporal/spatial anchors, sensory details, action verbs
 * 2. Dialogue Extractor — Quoted speech, narrative function analysis
 * 3. Interiority Detector — Emotions, vulnerability, inner debate, introspection
 * 4. Elite Pattern Detector — Micro→macro, quantification, narrative arcs, philosophical depth
 * 5. Rubric Scorer — 12-dimension scoring with interaction rules
 *
 * OUTPUT:
 * Complete AnalysisReport (JSON) with:
 * - EQI score (0-100)
 * - Dimension scores with evidence
 * - Feature detection results
 * - Elite pattern profile
 * - Flags and improvement levers
 * - Prioritized ΔEQI recommendations
 */

import { detectScenes, SceneDetection } from './features/sceneDetector';
import { extractDialogue, DialogueExtraction } from './features/dialogueExtractor';
import { detectInteriority, InteriorityDetection } from './features/interiorityDetector';
import { detectElitePatterns, ElitePatternProfile } from './features/elitePatternDetector';
import {
  scoreWithRubric,
  createEvidence,
  DimensionEvidence,
  RubricScoringResult
} from './features/rubricScorer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnalysisEngineInput {
  /** Essay text to analyze */
  essay_text: string;

  /** Essay ID (for reference) */
  essay_id?: string;

  /** Essay type (personal_statement, uc_piq, why_us, etc.) */
  essay_type?: string;

  /** Maximum words (for word count check) */
  max_words?: number;
}

export interface AnalysisReport {
  /** Essay ID */
  essay_id: string | null;

  /** Rubric version used */
  rubric_version: string;

  /** Essay Quality Index (0-100) */
  essay_quality_index: number;

  /** Dimension scores with evidence */
  dimension_scores: RubricScoringResult['dimension_scores'];

  /** Impression label */
  impression_label: RubricScoringResult['impression_label'];

  /** Flags detected */
  flags: string[];

  /** Prioritized improvement levers */
  prioritized_levers: string[];

  /** Overall assessment */
  assessment: string;

  /** Feature detection results */
  feature_detections: {
    scenes: SceneDetection;
    dialogue: DialogueExtraction;
    interiority: InteriorityDetection;
    elite_patterns: ElitePatternProfile;
  };

  /** Word count analysis */
  word_count_analysis: {
    total_words: number;
    max_words: number | null;
    within_limit: boolean;
    utilization_percent: number | null;
  };

  /** Timestamp */
  analyzed_at: string;
}

// ============================================================================
// DIMENSION SCORING LOGIC
// ============================================================================

/**
 * Score Dimension 1: Opening Power & Scene Entry
 */
function scoreOpeningPower(
  essayText: string,
  sceneDetection: SceneDetection
): { score: number; evidence: DimensionEvidence } {
  const firstParagraph = essayText.split('\n\n')[0] || '';
  const firstSentences = firstParagraph.split(/[.!?]/).slice(0, 2).join('. ');

  let score = 0;
  const quotes: string[] = [];
  let justification = '';

  // Check for scene in opening
  const hasOpeningScene = sceneDetection.scenes.some(s => s.paragraph_index === 0);

  // Check for provocative hook
  const unconventionalMarkers = [
    'worst', 'best', 'never', 'always', 'strangest', 'most',
    'hot sauce', 'you know nothing', 'jon snow', 'costco', 'ikea'
  ];
  const hasUnconventionalHook = unconventionalMarkers.some(
    marker => firstSentences.toLowerCase().includes(marker)
  );

  // Check for generic opening
  const genericMarkers = [
    'ever since i was', 'since i was young', 'i have always',
    'throughout my life', 'growing up', 'from a young age',
    'the dictionary defines', 'according to'
  ];
  const hasGenericOpening = genericMarkers.some(
    marker => firstSentences.toLowerCase().includes(marker)
  );

  if (hasGenericOpening) {
    score = 0;
    quotes.push(firstSentences.substring(0, 100));
    justification = 'Generic opening ("Since I was young..." type). No scene or provocative claim.';
  } else if (hasOpeningScene && hasUnconventionalHook) {
    score = 10;
    quotes.push(firstSentences);
    justification = 'Strong opening: drops into scene with unconventional/provocative hook.';
  } else if (hasOpeningScene) {
    score = 8;
    quotes.push(firstSentences);
    justification = 'Opens with scene (temporal/spatial anchor + sensory detail).';
  } else if (hasUnconventionalHook) {
    score = 7;
    quotes.push(firstSentences);
    justification = 'Provocative hook present but no full scene.';
  } else if (firstSentences.length > 20 && !hasGenericOpening) {
    score = 5;
    quotes.push(firstSentences.substring(0, 100));
    justification = 'Clear context provided but abstract (lacks sensory detail).';
  } else {
    score = 3;
    quotes.push(firstSentences.substring(0, 100));
    justification = 'Weak opening with minimal engagement.';
  }

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 2: Narrative Arc, Stakes & Turn
 */
function scoreNarrativeArc(
  essayText: string,
  elitePatterns: ElitePatternProfile
): { score: number; evidence: DimensionEvidence } {
  let score = 5; // Base
  const quotes: string[] = [];
  let justification = '';

  const arcType = elitePatterns.narrative_arc.arc_type;
  const showsPersistence = elitePatterns.narrative_arc.shows_persistence;
  const hasTurn = elitePatterns.counter_narrative.has_counter_narrative;

  // Check for tension markers
  const tensionMarkers = [
    'but', 'however', 'despite', 'although', 'failed', 'struggled',
    'challenged', 'questioned', 'uncertain', 'dilemma', 'choice'
  ];
  const tensionCount = tensionMarkers.filter(
    marker => essayText.toLowerCase().includes(marker)
  ).length;

  if (arcType === 'extended_journey' && showsPersistence && hasTurn) {
    score = 10;
    justification = 'Extended narrative arc with persistence and clear turn/realization.';
  } else if (arcType === 'lifelong_pursuit' && hasTurn) {
    score = 9;
    justification = 'Lifelong pursuit with meaningful turn.';
  } else if ((arcType === 'short_journey' || arcType === 'extended_journey') && tensionCount >= 3) {
    score = 8;
    justification = 'Clear journey with multiple tension points.';
  } else if (hasTurn && tensionCount >= 2) {
    score = 7;
    justification = 'Has turn and some tension.';
  } else if (tensionCount >= 2) {
    score = 6;
    justification = 'Some tension/stakes implied.';
  } else if (tensionCount > 0) {
    score = 5;
    justification = 'Minimal tension or stakes.';
  } else {
    score = 2;
    justification = 'No clear conflict or narrative arc.';
  }

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 3: Character Interiority & Vulnerability
 */
function scoreInteriority(
  interiorityDetection: InteriorityDetection
): { score: number; evidence: DimensionEvidence } {
  let score = interiorityDetection.overall_interiority_score;
  const quotes: string[] = [];

  // Extract quotes from vulnerability moments
  interiorityDetection.vulnerability_moments.forEach(v => {
    quotes.push(v.statement.substring(0, 100));
  });

  let justification = `${interiorityDetection.vulnerability_count} vulnerability moment(s). `;

  if (interiorityDetection.meets_elite_threshold) {
    justification += 'Meets elite threshold (2+ vulnerability moments + deep introspection).';
  } else if (interiorityDetection.vulnerability_count >= 2) {
    justification += 'Multiple vulnerability moments but lacks depth.';
  } else if (interiorityDetection.vulnerability_count === 1) {
    justification += 'Single vulnerability moment (need 2+ for 10/10).';
  } else {
    justification += 'No clear vulnerability moments.';
  }

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 4: Reflection & Meaning-Making
 */
function scoreReflection(
  interiorityDetection: InteriorityDetection,
  elitePatterns: ElitePatternProfile
): { score: number; evidence: DimensionEvidence } {
  let score = 5; // Base
  const quotes: string[] = [];

  const hasDeepIntrospection = interiorityDetection.introspection_segments.some(
    s => s.depth === 'deep' || s.depth === 'profound'
  );

  const hasMicroMacro = elitePatterns.micro_macro.has_structure && elitePatterns.micro_macro.is_connected;
  const philDepth = elitePatterns.philosophical_depth.depth_level;

  if (hasDeepIntrospection && hasMicroMacro && philDepth === 'profound') {
    score = 10;
  } else if (hasDeepIntrospection && hasMicroMacro) {
    score = 9;
  } else if (hasDeepIntrospection || (hasMicroMacro && philDepth === 'deep')) {
    score = 8;
  } else if (hasMicroMacro || philDepth === 'deep') {
    score = 7;
  } else if (philDepth === 'moderate') {
    score = 6;
  } else if (interiorityDetection.introspection_segments.length > 0) {
    score = 5;
  } else {
    score = 3;
  }

  const justification = `Introspection: ${interiorityDetection.introspection_segments.length} segment(s). Micro→macro: ${hasMicroMacro ? 'Yes' : 'No'}. Phil depth: ${philDepth}.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 5: Show Don't Tell (Craft)
 */
function scoreShowDontTell(
  sceneDetection: SceneDetection,
  dialogueExtraction: DialogueExtraction
): { score: number; evidence: DimensionEvidence } {
  let score = 0;
  const quotes: string[] = [];

  const sceneScore = sceneDetection.overall_scene_score;
  const dialogueScore = dialogueExtraction.overall_dialogue_score;

  // Average scene and dialogue scores
  score = (sceneScore * 0.7 + dialogueScore * 0.3);

  // Extract quotes from top scenes
  sceneDetection.scenes.slice(0, 2).forEach(scene => {
    if (scene.example_sensory) {
      quotes.push(scene.example_sensory.substring(0, 80));
    }
  });

  const justification = `${sceneDetection.scene_count} scene(s), ${dialogueExtraction.dialogue_count} dialogue instance(s). Scene score: ${sceneScore}/10, Dialogue: ${dialogueScore}/10.`;

  return {
    score: Math.round(score),
    evidence: createEvidence(quotes, justification, [Math.round(score)])
  };
}

/**
 * Score Dimension 6: Dialogue & Action Texture
 */
function scoreDialogueAction(
  dialogueExtraction: DialogueExtraction,
  sceneDetection: SceneDetection
): { score: number; evidence: DimensionEvidence } {
  const score = dialogueExtraction.overall_dialogue_score;
  const quotes: string[] = [];

  // Extract quotes from high-quality dialogue
  dialogueExtraction.dialogues
    .filter(d => d.quality_score >= 7)
    .slice(0, 2)
    .forEach(d => {
      quotes.push(`"${d.quote}"`);
    });

  const justification = `${dialogueExtraction.dialogue_count} dialogue(s). Functions: ${dialogueExtraction.dialogues.map(d => d.narrative_function).join(', ')}.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 7: Originality, Specificity & Voice
 */
function scoreOriginality(
  essayText: string,
  elitePatterns: ElitePatternProfile,
  interiorityDetection: InteriorityDetection
): { score: number; evidence: DimensionEvidence } {
  let score = 5; // Base
  const quotes: string[] = [];

  const isUnconventional = elitePatterns.unconventional_topic.is_unconventional;
  const wellExecuted = elitePatterns.unconventional_topic.well_executed;
  const hasSpecificEmotions = interiorityDetection.emotions.filter(
    e => e.specificity !== 'generic'
  ).length;
  const quantificationRatio = elitePatterns.quantification.specificity_ratio;

  if (isUnconventional && wellExecuted && hasSpecificEmotions >= 3 && quantificationRatio >= 0.4) {
    score = 10;
  } else if (isUnconventional && wellExecuted) {
    score = 9;
  } else if (hasSpecificEmotions >= 3 && quantificationRatio >= 0.4) {
    score = 8;
  } else if (hasSpecificEmotions >= 2 || quantificationRatio >= 0.3) {
    score = 7;
  } else if (hasSpecificEmotions >= 1 || quantificationRatio >= 0.2) {
    score = 6;
  } else {
    score = 4;
  }

  const justification = `Topic: ${elitePatterns.unconventional_topic.topic_category}. Specific emotions: ${hasSpecificEmotions}. Quantification: ${Math.round(quantificationRatio * 100)}%.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 8: Structure, Pacing & Coherence
 */
function scoreStructure(
  essayText: string,
  elitePatterns: ElitePatternProfile
): { score: number; evidence: DimensionEvidence } {
  let score = 6; // Base assumption (readable)
  const quotes: string[] = [];

  const paragraphCount = essayText.split('\n\n').length;
  const hasMicroMacro = elitePatterns.micro_macro.has_structure && elitePatterns.micro_macro.is_connected;

  // Check for transition markers
  const transitionMarkers = [
    'but', 'however', 'yet', 'then', 'later', 'now', 'finally',
    'looking back', 'in retrospect', 'ultimately'
  ];
  const transitionCount = transitionMarkers.filter(
    marker => essayText.toLowerCase().includes(marker)
  ).length;

  if (hasMicroMacro && paragraphCount >= 4 && paragraphCount <= 8 && transitionCount >= 3) {
    score = 10;
  } else if (hasMicroMacro && transitionCount >= 2) {
    score = 8;
  } else if (paragraphCount >= 3 && paragraphCount <= 10) {
    score = 7;
  } else if (paragraphCount >= 2) {
    score = 6;
  } else {
    score = 4; // Single paragraph essay
  }

  const justification = `${paragraphCount} paragraph(s). Micro→macro: ${hasMicroMacro ? 'Yes' : 'No'}. Transitions: ${transitionCount}.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 9: Sentence-Level Craft
 */
function scoreSentenceCraft(
  essayText: string
): { score: number; evidence: DimensionEvidence } {
  let score = 6; // Base (assume competent)
  const quotes: string[] = [];

  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;

  // Check for sentence variety (short and long)
  const shortSentences = sentences.filter(s => s.split(/\s+/).length <= 8).length;
  const longSentences = sentences.filter(s => s.split(/\s+/).length >= 20).length;
  const hasVariety = shortSentences > 0 && longSentences > 0;

  // Check for passive voice (rough heuristic)
  const passiveCount = (essayText.match(/\b(was|were|been|being) \w+ed\b/gi) || []).length;
  const passiveRatio = passiveCount / sentences.length;

  if (hasVariety && passiveRatio < 0.15 && avgLength >= 12 && avgLength <= 20) {
    score = 9;
  } else if (hasVariety && passiveRatio < 0.25) {
    score = 8;
  } else if (hasVariety || passiveRatio < 0.3) {
    score = 7;
  } else if (passiveRatio > 0.4) {
    score = 4;
  }

  const justification = `Avg sentence length: ${Math.round(avgLength)} words. Variety: ${hasVariety ? 'Yes' : 'No'}. Passive: ${Math.round(passiveRatio * 100)}%.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 10: Context & Constraints Disclosure
 */
function scoreContextConstraints(
  essayText: string,
  elitePatterns: ElitePatternProfile
): { score: number; evidence: DimensionEvidence } {
  let score = 5; // Base
  const quotes: string[] = [];

  const quantifiedCount = elitePatterns.quantification.quantified_count;
  const specificityRatio = elitePatterns.quantification.specificity_ratio;

  // Check for constraint markers
  const constraintMarkers = [
    'limited', 'lacked', 'couldn\'t afford', 'no access', 'first-generation',
    'translator', 'caregiver', 'work', 'job', 'hours', 'immigrant'
  ];
  const hasConstraints = constraintMarkers.some(
    marker => essayText.toLowerCase().includes(marker)
  );

  if (hasConstraints && quantifiedCount >= 3 && specificityRatio >= 0.5) {
    score = 10;
  } else if (hasConstraints && quantifiedCount >= 2) {
    score = 8;
  } else if (hasConstraints || quantifiedCount >= 2) {
    score = 6;
  } else if (quantifiedCount >= 1) {
    score = 5;
  } else {
    score = 3;
  }

  const justification = `Constraints: ${hasConstraints ? 'Yes' : 'No'}. Quantified: ${quantifiedCount} (${Math.round(specificityRatio * 100)}% specific).`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 11: School/Program Fit
 */
function scoreSchoolFit(
  essayText: string,
  essayType?: string
): { score: number; evidence: DimensionEvidence } {
  // Only applicable to "Why us" essays
  if (essayType !== 'why_us' && essayType !== 'supplemental') {
    return {
      score: 0,
      evidence: createEvidence([], 'Not applicable (not a Why Us essay)', [0])
    };
  }

  let score = 5; // Base
  const quotes: string[] = [];

  // Check for specific resources
  const specificMarkers = [
    'professor', 'course', 'lab', 'center', 'program', 'research',
    'studio', 'method', 'approach', 'philosophy'
  ];
  const specificCount = specificMarkers.filter(
    marker => essayText.toLowerCase().includes(marker)
  ).length;

  // Check for generic praise
  const genericMarkers = [
    'prestigious', 'world-class', 'renowned', 'excellent', 'top-ranked'
  ];
  const hasGeneric = genericMarkers.some(
    marker => essayText.toLowerCase().includes(marker)
  );

  if (specificCount >= 4 && !hasGeneric) {
    score = 10;
  } else if (specificCount >= 3) {
    score = 8;
  } else if (specificCount >= 2) {
    score = 6;
  } else if (specificCount >= 1) {
    score = 4;
  } else {
    score = 2;
  }

  const justification = `Specific resources: ${specificCount}. Generic praise: ${hasGeneric ? 'Yes' : 'No'}.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

/**
 * Score Dimension 12: Ethical Awareness & Humility
 */
function scoreEthicalAwareness(
  essayText: string,
  interiorityDetection: InteriorityDetection
): { score: number; evidence: DimensionEvidence } {
  let score = 5; // Base
  const quotes: string[] = [];

  const limitAdmissions = interiorityDetection.limit_admissions.length;
  const vulnerabilityMoments = interiorityDetection.vulnerability_count;

  // Check for humility markers
  const humilityMarkers = [
    'still learning', 'don\'t know', 'not sure', 'uncertain',
    'mistake', 'wrong', 'failed', 'taught me', 'helped me see'
  ];
  const humilityCount = humilityMarkers.filter(
    marker => essayText.toLowerCase().includes(marker)
  ).length;

  if (limitAdmissions >= 2 && vulnerabilityMoments >= 2 && humilityCount >= 3) {
    score = 10;
  } else if (limitAdmissions >= 1 && vulnerabilityMoments >= 2) {
    score = 8;
  } else if (vulnerabilityMoments >= 1 && humilityCount >= 2) {
    score = 7;
  } else if (humilityCount >= 2) {
    score = 6;
  } else if (humilityCount >= 1) {
    score = 5;
  } else {
    score = 3;
  }

  const justification = `Limit admissions: ${limitAdmissions}. Vulnerability: ${vulnerabilityMoments}. Humility markers: ${humilityCount}.`;

  return {
    score,
    evidence: createEvidence(quotes, justification, [score])
  };
}

// ============================================================================
// MAIN ANALYSIS ENGINE
// ============================================================================

/**
 * Analyze essay and generate comprehensive AnalysisReport
 *
 * This is the main entry point for the Analysis Engine.
 *
 * @param input - Essay text and metadata
 * @returns Complete analysis report with EQI, dimension scores, flags, levers
 */
export async function analyzeEssay(input: AnalysisEngineInput): Promise<AnalysisReport> {
  const { essay_text, essay_id = null, essay_type, max_words } = input;

  // =========================================================================
  // STEP 1: Run all feature detectors
  // =========================================================================

  const scenes = detectScenes(essay_text);
  const dialogue = extractDialogue(essay_text);
  const interiority = detectInteriority(essay_text);

  // Elite patterns need vulnerability data from interiority
  const elite_patterns = detectElitePatterns(
    essay_text,
    interiority.vulnerability_moments.map(v => ({
      sentence_index: v.sentence_index,
      quality_score: v.quality_score
    }))
  );

  // =========================================================================
  // STEP 2: Score all 12 dimensions
  // =========================================================================

  const dimensionRawScores = [
    { dimension_name: 'opening_power_scene_entry', ...scoreOpeningPower(essay_text, scenes) },
    { dimension_name: 'narrative_arc_stakes_turn', ...scoreNarrativeArc(essay_text, elite_patterns) },
    { dimension_name: 'character_interiority_vulnerability', ...scoreInteriority(interiority) },
    { dimension_name: 'reflection_meaning_making', ...scoreReflection(interiority, elite_patterns) },
    { dimension_name: 'show_dont_tell_craft', ...scoreShowDontTell(scenes, dialogue) },
    { dimension_name: 'intellectual_vitality_curiosity', ...scoreDialogueAction(dialogue, scenes) },
    { dimension_name: 'originality_specificity_voice', ...scoreOriginality(essay_text, elite_patterns, interiority) },
    { dimension_name: 'structure_pacing_coherence', ...scoreStructure(essay_text, elite_patterns) },
    { dimension_name: 'word_economy_craft', ...scoreSentenceCraft(essay_text) },
    { dimension_name: 'context_constraints_disclosure', ...scoreContextConstraints(essay_text, elite_patterns) },
    { dimension_name: 'school_program_fit', ...scoreSchoolFit(essay_text, essay_type) },
    { dimension_name: 'ethical_awareness_humility', ...scoreEthicalAwareness(essay_text, interiority) }
  ];

  // =========================================================================
  // STEP 3: Apply rubric scorer (interaction rules, EQI, flags)
  // =========================================================================

  const scoringResult = scoreWithRubric(dimensionRawScores, essay_text);

  // =========================================================================
  // STEP 4: Word count analysis
  // =========================================================================

  const total_words = essay_text.split(/\s+/).filter(w => w.length > 0).length;
  const within_limit = max_words ? total_words <= max_words : true;
  const utilization_percent = max_words ? Math.round((total_words / max_words) * 100) : null;

  // =========================================================================
  // STEP 5: Build final report
  // =========================================================================

  return {
    essay_id,
    rubric_version: scoringResult.rubric_version,
    essay_quality_index: scoringResult.essay_quality_index,
    dimension_scores: scoringResult.dimension_scores,
    impression_label: scoringResult.impression_label,
    flags: scoringResult.flags,
    prioritized_levers: scoringResult.prioritized_levers,
    assessment: scoringResult.assessment,
    feature_detections: {
      scenes,
      dialogue,
      interiority,
      elite_patterns
    },
    word_count_analysis: {
      total_words,
      max_words: max_words || null,
      within_limit,
      utilization_percent
    },
    analyzed_at: new Date().toISOString()
  };
}

/**
 * Get analysis summary for quick inspection
 */
export function getAnalysisSummary(report: AnalysisReport): string {
  const lines: string[] = [];

  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(`  ESSAY ANALYSIS REPORT ${report.essay_id ? `— ${report.essay_id}` : ''}`);
  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(``);

  lines.push(`📊 EQI: ${report.essay_quality_index}/100`);
  lines.push(`📈 Impression: ${report.impression_label}`);
  lines.push(`📝 Words: ${report.word_count_analysis.total_words}${report.word_count_analysis.max_words ? `/${report.word_count_analysis.max_words}` : ''} ${report.word_count_analysis.within_limit ? '✅' : '⚠️'}`);
  lines.push(``);

  lines.push(`─────────────────────────────────────────────────────────────────`);
  lines.push(`  DIMENSION SCORES`);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  report.dimension_scores.forEach(dim => {
    const emoji = dim.final_score >= 8 ? '✅' : dim.final_score >= 6 ? '⚠️' : '❌';
    const modified = dim.modified_by_rules ? ` [${dim.raw_score}→${dim.final_score}]` : '';
    lines.push(`${emoji} ${dim.dimension_name}: ${dim.final_score}/10${modified}`);
  });

  if (report.flags.length > 0) {
    lines.push(``);
    lines.push(`─────────────────────────────────────────────────────────────────`);
    lines.push(`  FLAGS (${report.flags.length})`);
    lines.push(`─────────────────────────────────────────────────────────────────`);
    report.flags.forEach(flag => {
      lines.push(`🚩 ${flag}`);
    });
  }

  lines.push(``);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  lines.push(`  TOP IMPROVEMENT LEVERS`);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  report.prioritized_levers.slice(0, 3).forEach((lever, i) => {
    lines.push(`${i + 1}. ${lever}`);
  });

  lines.push(``);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  lines.push(`  FEATURE DETECTIONS`);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  lines.push(`Scenes: ${report.feature_detections.scenes.scene_count} (score: ${report.feature_detections.scenes.overall_scene_score}/10)`);
  lines.push(`Dialogue: ${report.feature_detections.dialogue.dialogue_count} (score: ${report.feature_detections.dialogue.overall_dialogue_score}/10)`);
  lines.push(`Vulnerability: ${report.feature_detections.interiority.vulnerability_count} moments ${report.feature_detections.interiority.meets_elite_threshold ? '✅' : '⚠️'}`);
  lines.push(`Elite Score: ${report.feature_detections.elite_patterns.overall_elite_score}/100`);

  lines.push(``);
  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(`  ASSESSMENT`);
  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(report.assessment);
  lines.push(``);

  return lines.join('\n');
}
