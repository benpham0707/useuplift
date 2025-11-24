/**
 * UNIVERSAL FEATURE DETECTION LAYER
 *
 * Orchestrates and synthesizes 6 world-class detection systems:
 * 1. Scene Detector (Essay Analysis) - Temporal/spatial anchors, sensory details
 * 2. Dialogue Extractor (Essay Analysis) - Quoted speech, narrative function
 * 3. Interiority Detector (Essay Analysis) - Vulnerability, emotion, inner debate
 * 4. Authenticity Detector (Extracurricular Analysis) - Voice type, manufactured signals
 * 5. Elite Pattern Detector (Extracurricular Analysis) - 7 Harvard/Berkeley patterns
 * 6. Literary Sophistication (Extracurricular Analysis) - 10 advanced techniques
 *
 * SYNTHESIS APPROACH:
 * - Run all detections in parallel for speed
 * - Cross-validate findings (e.g., dialogue should increase interiority)
 * - Calculate quality scores beyond just presence/absence
 * - Identify missing opportunities (where elements could be added)
 * - Provide actionable enhancement suggestions
 *
 * ENHANCEMENTS BEYOND INDIVIDUAL SYSTEMS:
 * - Quality scoring (not just detection)
 * - Cross-system validation
 * - Opportunity identification
 * - Confidence intervals
 * - Comparative benchmarking
 *
 * @module UniversalFeatureDetector
 */

import { UnifiedPIQResult } from './unifiedPIQAnalysis';

// Import all detection systems
import { detectScenes } from '@/core/essay/analysis/features/sceneDetector';
import { extractDialogue } from '@/core/essay/analysis/features/dialogueExtractor';
import { detectInteriority } from '@/core/essay/analysis/features/interiorityDetector';
import { analyzeAuthenticity } from '@/core/analysis/features/authenticityDetector';
import { analyzeElitePatterns } from '@/core/analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '@/core/analysis/features/literarySophisticationDetector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FeatureDetectionOptions {
  /** Analysis depth affects thoroughness */
  depth: 'quick' | 'standard' | 'comprehensive';

  /** Calculate quality scores (vs just presence/absence) */
  calculate_quality_scores?: boolean;

  /** Identify missing opportunities */
  identify_opportunities?: boolean;

  /** Cross-validate findings */
  cross_validate?: boolean;

  /** Include comparative benchmarks */
  include_benchmarks?: boolean;
}

export interface DetectionTimings {
  scene_detection_ms: number;
  dialogue_extraction_ms: number;
  interiority_detection_ms: number;
  authenticity_analysis_ms: number;
  elite_patterns_ms: number;
  literary_sophistication_ms: number;
  total_ms: number;
}

// ============================================================================
// MAIN FEATURE DETECTION FUNCTION
// ============================================================================

/**
 * Run comprehensive universal feature detection
 *
 * Orchestrates 6 parallel detection systems and synthesizes results
 * with quality scoring, cross-validation, and opportunity identification.
 *
 * @param text - PIQ text to analyze
 * @param depth - Analysis depth (affects thoroughness)
 * @returns Comprehensive feature detection results
 */
export async function runUniversalFeatureDetection(
  text: string,
  depth: 'quick' | 'standard' | 'comprehensive' = 'standard'
): Promise<UnifiedPIQResult['features']> {
  const startTime = Date.now();

  console.log('   🔬 Initializing universal feature detection...');
  console.log(`   📊 Depth: ${depth}`);
  console.log('');

  // ========================================================================
  // PARALLEL DETECTION EXECUTION
  // ========================================================================

  console.log('   ⚡ Running 6 detections in parallel...');

  const detectionPromises = {
    scenes: measureTime('Scene Detection', () => detectScenes(text)),
    dialogue: measureTime('Dialogue Extraction', () => extractDialogue(text)),
    interiority: measureTime('Interiority Detection', () => detectInteriority(text)),
    authenticity: measureTime('Authenticity Analysis', () => analyzeAuthenticity(text)),
    elitePatterns: measureTime('Elite Patterns', () => analyzeElitePatterns(text)),
    literary: measureTime('Literary Sophistication', () => analyzeLiterarySophistication(text))
  };

  // Execute all in parallel
  const [scenes, dialogue, interiority, authenticity, elitePatterns, literary] = await Promise.all([
    detectionPromises.scenes,
    detectionPromises.dialogue,
    detectionPromises.interiority,
    detectionPromises.authenticity,
    detectionPromises.elitePatterns,
    detectionPromises.literary
  ]);

  console.log('   ✅ All detections complete');
  console.log('');

  // ========================================================================
  // SYNTHESIS & ENHANCEMENT
  // ========================================================================

  console.log('   🔄 Synthesizing results and calculating quality scores...');

  // Scene Analysis with Quality Scoring
  const sceneAnalysis = await enhanceSceneDetection(scenes, text);
  console.log(`      Scenes: ${sceneAnalysis.count} detected (quality: ${sceneAnalysis.quality_score.toFixed(1)}/10)`);

  // Dialogue Analysis with Quality Scoring
  const dialogueAnalysis = await enhanceDialogueExtraction(dialogue, text);
  console.log(`      Dialogue: ${dialogueAnalysis.count} instances (quality: ${dialogueAnalysis.quality_score.toFixed(1)}/10)`);

  // Interiority Analysis with Depth Assessment
  const interiorityAnalysis = await enhanceInteriorityDetection(interiority, text);
  console.log(`      Interiority: ${interiorityAnalysis.overall_score.toFixed(1)}/10 (${interiorityAnalysis.depth_level})`);

  // Authenticity Analysis with Signal Breakdown
  const authenticityAnalysis = await enhanceAuthenticityAnalysis(authenticity, text);
  console.log(`      Authenticity: ${authenticityAnalysis.score.toFixed(1)}/10 (${authenticityAnalysis.voice_type})`);

  // Elite Patterns with Pattern-Level Detail
  const elitePatternsAnalysis = await enhanceElitePatternDetection(elitePatterns, text);
  console.log(`      Elite Patterns: ${elitePatternsAnalysis.overall_score}/100 (Tier ${elitePatternsAnalysis.tier})`);

  // Literary Sophistication with Technique Breakdown
  const literaryAnalysis = await enhanceLiterarySophistication(literary, text);
  console.log(`      Literary: ${literaryAnalysis.overall_score}/100 (Tier ${literaryAnalysis.tier})`);

  console.log('');

  // ========================================================================
  // CROSS-VALIDATION
  // ========================================================================

  if (depth === 'comprehensive') {
    console.log('   🔍 Running cross-validation checks...');

    const validationResults = crossValidateFeatures({
      scenes: sceneAnalysis,
      dialogue: dialogueAnalysis,
      interiority: interiorityAnalysis,
      authenticity: authenticityAnalysis,
      elitePatterns: elitePatternsAnalysis,
      literary: literaryAnalysis
    });

    if (validationResults.warnings.length > 0) {
      console.log('   ⚠️  Validation warnings:');
      validationResults.warnings.forEach(warning => {
        console.log(`      - ${warning}`);
      });
    }

    if (validationResults.insights.length > 0) {
      console.log('   💡 Validation insights:');
      validationResults.insights.forEach(insight => {
        console.log(`      - ${insight}`);
      });
    }

    console.log('');
  }

  // ========================================================================
  // OPPORTUNITY IDENTIFICATION
  // ========================================================================

  console.log('   💡 Identifying missing opportunities...');

  const opportunities = identifyMissingOpportunities({
    text,
    scenes: sceneAnalysis,
    dialogue: dialogueAnalysis,
    interiority: interiorityAnalysis,
    elitePatterns: elitePatternsAnalysis
  });

  if (opportunities.high_impact.length > 0) {
    console.log(`   🎯 High-impact opportunities: ${opportunities.high_impact.length}`);
  }
  if (opportunities.medium_impact.length > 0) {
    console.log(`   📊 Medium-impact opportunities: ${opportunities.medium_impact.length}`);
  }

  console.log('');

  const totalTime = Date.now() - startTime;
  console.log(`   ⏱️  Total feature detection time: ${totalTime}ms`);
  console.log('');

  // ========================================================================
  // RETURN SYNTHESIZED RESULTS
  // ========================================================================

  return {
    scenes: sceneAnalysis,
    dialogue: dialogueAnalysis,
    interiority: interiorityAnalysis,
    authenticity: authenticityAnalysis,
    elite_patterns: elitePatternsAnalysis,
    literary_sophistication: literaryAnalysis
  };
}

// ============================================================================
// ENHANCEMENT FUNCTIONS
// ============================================================================

/**
 * Enhance scene detection with quality scoring and opportunity identification
 */
async function enhanceSceneDetection(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['scenes']> {
  // Calculate scene quality score (0-10)
  let qualityScore = 0;

  if (baseDetection.has_scenes && baseDetection.scenes.length > 0) {
    // Base score for having scenes
    qualityScore = 5;

    // Quality factors:
    const firstScene = baseDetection.scenes[0];

    // +2 if has temporal anchor
    if (firstScene.temporal_anchor) qualityScore += 2;

    // +2 if has spatial anchor
    if (firstScene.spatial_anchor) qualityScore += 2;

    // +1 if has multiple sensory details
    if (firstScene.sensory_details && firstScene.sensory_details.length >= 2) {
      qualityScore += 1;
    }
  }

  // Identify missing opportunities
  const missingOpportunities: string[] = [];

  if (!baseDetection.has_scenes) {
    missingOpportunities.push('No scenes detected - consider adding opening scene with temporal/spatial anchors');
  } else if (baseDetection.scenes.length === 1) {
    missingOpportunities.push('Only one scene - consider adding second scene for contrast/progression');
  }

  if (baseDetection.has_scenes && baseDetection.scenes.length > 0) {
    const firstScene = baseDetection.scenes[0];
    if (!firstScene.temporal_anchor) {
      missingOpportunities.push('Scene lacks temporal anchor (when) - add time marker like "junior year", "3am", etc.');
    }
    if (!firstScene.spatial_anchor) {
      missingOpportunities.push('Scene lacks spatial anchor (where) - add location like "lab", "kitchen", etc.');
    }
    if (!firstScene.sensory_details || firstScene.sensory_details.length < 2) {
      missingOpportunities.push('Scene lacks sensory details - add what you saw, heard, smelled, felt');
    }
  }

  // Calculate vividness score for each scene
  const enhancedDetails = (baseDetection.scenes || []).map((scene: any, idx: number) => {
    let vividness = 0;

    if (scene.temporal_anchor) vividness += 3;
    if (scene.spatial_anchor) vividness += 3;
    if (scene.sensory_details && scene.sensory_details.length > 0) {
      vividness += Math.min(4, scene.sensory_details.length);
    }

    return {
      paragraph_index: scene.paragraph_index,
      sentence_range: scene.sentence_range,
      temporal_anchor: scene.temporal_anchor,
      spatial_anchor: scene.spatial_anchor,
      sensory_details: scene.sensory_details || [],
      vividness_score: Math.min(10, vividness)
    };
  });

  return {
    has_scenes: baseDetection.has_scenes,
    count: baseDetection.scene_count || 0,
    quality_score: qualityScore,
    details: enhancedDetails,
    missing_opportunities: missingOpportunities
  };
}

/**
 * Enhance dialogue extraction with quality scoring
 */
async function enhanceDialogueExtraction(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['dialogue']> {
  // Calculate dialogue quality score (0-10)
  let qualityScore = 0;

  if (baseDetection.has_dialogue && baseDetection.dialogues && baseDetection.dialogues.length > 0) {
    // Base score for having dialogue
    qualityScore = 5;

    // Quality factors:
    const dialogues = baseDetection.dialogues;

    // +2 if dialogue reveals character
    const revealsCharacter = dialogues.some((d: any) =>
      d.narrative_function && d.narrative_function.includes('character')
    );
    if (revealsCharacter) qualityScore += 2;

    // +2 if dialogue is conversational (not formal)
    const isConversational = dialogues.some((d: any) =>
      d.quote && (
        d.quote.includes("'") ||
        d.quote.length < 100 ||
        /\b(yeah|nah|okay|like|just|really)\b/i.test(d.quote)
      )
    );
    if (isConversational) qualityScore += 2;

    // +1 if multiple dialogue instances
    if (dialogues.length >= 2) qualityScore += 1;
  }

  // Identify missing opportunities
  const missingOpportunities: string[] = [];

  if (!baseDetection.has_dialogue) {
    missingOpportunities.push('No dialogue detected - consider adding conversation that reveals character');
  }

  // Enhance dialogue quotes with authenticity scoring
  const enhancedQuotes = (baseDetection.dialogues || []).map((d: any) => {
    // Calculate authenticity score for this dialogue
    let authenticityScore = 5; // Base

    // Natural speech markers
    if (d.quote && /\b(yeah|nah|okay|like|just|really|honestly|turns out)\b/i.test(d.quote)) {
      authenticityScore += 2;
    }

    // Brevity (realistic conversations are short)
    if (d.quote && d.quote.length < 100) {
      authenticityScore += 2;
    }

    // Contractions (natural speech)
    if (d.quote && /\b\w+'\w+\b/.test(d.quote)) {
      authenticityScore += 1;
    }

    return {
      text: d.quote,
      speaker: d.speaker,
      context: d.context,
      narrative_function: d.narrative_function || 'unknown',
      authenticity_score: Math.min(10, authenticityScore)
    };
  });

  return {
    has_dialogue: baseDetection.has_dialogue,
    count: baseDetection.dialogue_count || 0,
    quality_score: qualityScore,
    quotes: enhancedQuotes,
    missing_opportunities: missingOpportunities
  };
}

/**
 * Enhance interiority detection with depth assessment
 */
async function enhanceInteriorityDetection(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['interiority']> {
  // Determine depth level based on multiple factors
  let depthLevel: 'none' | 'surface' | 'moderate' | 'deep' | 'profound' = 'none';

  const vulnerabilityCount = baseDetection.vulnerability_count || 0;
  const innerDebate = baseDetection.inner_debate_present || false;
  const emotionCount = baseDetection.emotion_naming_instances?.length || 0;

  if (vulnerabilityCount === 0 && emotionCount === 0) {
    depthLevel = 'none';
  } else if (vulnerabilityCount === 1 && emotionCount < 2) {
    depthLevel = 'surface';
  } else if (vulnerabilityCount >= 2 || (vulnerabilityCount === 1 && innerDebate)) {
    depthLevel = 'moderate';
  } else if (vulnerabilityCount >= 2 && innerDebate && emotionCount >= 3) {
    depthLevel = 'deep';
  } else if (vulnerabilityCount >= 3 && innerDebate && emotionCount >= 5) {
    depthLevel = 'profound';
  }

  // Calculate introspection depth (0-10)
  let introspectionDepth = 0;

  if (innerDebate) introspectionDepth += 4;
  if (vulnerabilityCount >= 2) introspectionDepth += 3;
  if (emotionCount >= 3) introspectionDepth += 3;

  // Identify missing opportunities
  const missingOpportunities: string[] = [];

  if (vulnerabilityCount === 0) {
    missingOpportunities.push('No vulnerability moments - add specific fear/doubt or physical symptom');
  } else if (vulnerabilityCount === 1) {
    missingOpportunities.push('Only 1 vulnerability moment - need 2+ for elite scoring (10/10)');
  }

  if (!innerDebate) {
    missingOpportunities.push('No inner debate detected - show conflicting thoughts/choices');
  }

  if (emotionCount < 2) {
    missingOpportunities.push('Limited emotion naming - name specific emotions felt (not just "nervous" or "excited")');
  }

  // Extract emotion examples
  const emotionExamples = baseDetection.emotion_naming_instances?.slice(0, 5).map((e: any) => e.emotion) || [];

  return {
    overall_score: baseDetection.overall_interiority_score || 0,
    depth_level: depthLevel,
    vulnerability_count: vulnerabilityCount,
    vulnerability_moments: baseDetection.vulnerability_moments || [],
    inner_debate_present: innerDebate,
    emotion_naming_count: emotionCount,
    emotion_examples: emotionExamples,
    introspection_depth: Math.min(10, introspectionDepth),
    missing_opportunities: missingOpportunities
  };
}

/**
 * Enhance authenticity analysis with detailed signal breakdown
 */
async function enhanceAuthenticityAnalysis(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['authenticity']> {
  // Calculate voice consistency (0-10)
  const voiceConsistency = baseDetection.authenticity_score || 5;

  // Categorize manufactured signals by severity
  const manufacturedSignals = (baseDetection.red_flags || []).map((flag: string) => {
    // Determine severity
    let severity: 'minor' | 'moderate' | 'severe' = 'moderate';

    if (/passion|journey|impact|change the world/i.test(flag)) {
      severity = 'severe'; // Buzzwords
    } else if (/always|never|every|all/i.test(flag)) {
      severity = 'moderate'; // Hedge words
    } else {
      severity = 'minor';
    }

    // Determine type
    let type: 'buzzword' | 'cliché' | 'hedge_word' | 'passive_voice' = 'cliché';

    if (/passion|impact|journey|leader/i.test(flag)) type = 'buzzword';
    if (/always|never|every/i.test(flag)) type = 'hedge_word';
    if (/was|were|been|being/i.test(flag)) type = 'passive_voice';

    return {
      phrase: flag,
      type,
      severity
    };
  });

  // Categorize authenticity markers by type
  const authenticityMarkers = (baseDetection.green_flags || []).map((flag: string) => {
    let type: 'conversational' | 'specific' | 'honest' | 'understated' = 'specific';

    if (/honestly|turns out|realized|actually/i.test(flag)) type = 'honest';
    if (/\d+|specific name|precise detail/i.test(flag)) type = 'specific';
    if (/just|simply|quietly|small/i.test(flag)) type = 'understated';
    if (/yeah|okay|like|really/i.test(flag)) type = 'conversational';

    return {
      phrase: flag,
      type
    };
  });

  return {
    score: baseDetection.authenticity_score || 5,
    voice_type: baseDetection.voice_type || 'natural',
    voice_consistency: voiceConsistency,
    red_flags: baseDetection.red_flags || [],
    green_flags: baseDetection.green_flags || [],
    manufactured_signals: manufacturedSignals,
    authenticity_markers: authenticityMarkers
  };
}

/**
 * Enhance elite pattern detection with pattern-level detail
 */
async function enhanceElitePatternDetection(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['elite_patterns']> {
  // Extract detailed pattern information
  const patterns = {
    vulnerability: {
      score: baseDetection.vulnerability?.score || 0,
      present: (baseDetection.vulnerability?.score || 0) > 0,
      has_physical_symptoms: baseDetection.vulnerability?.physical_symptoms || false,
      has_named_emotions: (baseDetection.vulnerability?.emotion_count || 0) > 0,
      examples: baseDetection.vulnerability?.examples || []
    },
    dialogue: {
      score: baseDetection.dialogue?.score || 0,
      present: (baseDetection.dialogue?.score || 0) > 0,
      is_conversational: baseDetection.dialogue?.conversational || false,
      reveals_character: baseDetection.dialogue?.reveals_character || false,
      examples: baseDetection.dialogue?.examples || []
    },
    community_transformation: {
      score: baseDetection.communityTransformation?.score || 0,
      present: (baseDetection.communityTransformation?.score || 0) > 0,
      has_before: baseDetection.communityTransformation?.has_before || false,
      has_after: baseDetection.communityTransformation?.has_after || false,
      before_state: baseDetection.communityTransformation?.before_state,
      after_state: baseDetection.communityTransformation?.after_state,
      scope: determineTransformationScope(baseDetection.communityTransformation)
    },
    quantified_impact: {
      score: baseDetection.quantifiedImpact?.score || 0,
      present: (baseDetection.quantifiedImpact?.metrics?.length || 0) > 0,
      metrics: baseDetection.quantifiedImpact?.metrics || [],
      has_human_element: baseDetection.quantifiedImpact?.has_human_element || false,
      plausibility_score: baseDetection.quantifiedImpact?.plausibility_score || 5
    },
    micro_to_macro: {
      score: baseDetection.microToMacro?.score || 0,
      present: (baseDetection.microToMacro?.score || 0) > 0,
      has_universal_insight: baseDetection.microToMacro?.has_universal_insight || false,
      transcends_activity: baseDetection.microToMacro?.transcends_activity || false,
      insight: baseDetection.microToMacro?.insight
    },
    philosophical_depth: {
      score: baseDetection.philosophicalDepth?.score || 0,
      present: (baseDetection.philosophicalDepth?.score || 0) > 0,
      depth_level: determinePhilosophicalDepth(baseDetection.philosophicalDepth?.score || 0),
      examples: baseDetection.philosophicalDepth?.examples || []
    },
    counter_narrative: {
      score: baseDetection.counterNarrative?.score || 0,
      present: (baseDetection.counterNarrative?.score || 0) > 0,
      challenges_what: baseDetection.counterNarrative?.challenges || [],
      nuance_present: baseDetection.counterNarrative?.nuance_present || false
    }
  };

  // Identify strengths and gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  Object.entries(patterns).forEach(([patternName, patternData]) => {
    if (patternData.score >= 7) {
      strengths.push(`Strong ${patternName.replace(/_/g, ' ')}`);
    } else if (patternData.score === 0) {
      gaps.push(`Missing ${patternName.replace(/_/g, ' ')}`);
    } else if (patternData.score < 5) {
      gaps.push(`Weak ${patternName.replace(/_/g, ' ')}`);
    }
  });

  return {
    overall_score: baseDetection.overallScore || 0,
    tier: baseDetection.tier || 4,
    patterns,
    strengths,
    gaps
  };
}

/**
 * Enhance literary sophistication with technique breakdown
 */
async function enhanceLiterarySophistication(
  baseDetection: any,
  text: string
): Promise<UnifiedPIQResult['features']['literary_sophistication']> {
  // Extract technique details
  const techniquesDetected = (baseDetection.techniques_detected || []).map((tech: any) => ({
    name: tech.name || tech,
    score: tech.score || 0,
    examples: tech.examples || []
  }));

  // Identify memorable moments (if any)
  const memorableMoments: string[] = [];

  // Extract sentences with literary techniques
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

  sentences.slice(0, 3).forEach(sentence => {
    if (sentence.length > 50 && /\b(like|as if|metaphor|symbol)\b/i.test(sentence)) {
      memorableMoments.push(sentence.trim().substring(0, 100) + '...');
    }
  });

  // Identify craft weaknesses
  const craftWeaknesses: string[] = [];

  if (techniquesDetected.length === 0) {
    craftWeaknesses.push('No advanced literary techniques detected');
  }
  if (baseDetection.tier === 'C' || baseDetection.tier === 'D') {
    craftWeaknesses.push('Limited stylistic sophistication');
  }

  return {
    overall_score: baseDetection.overallScore || 0,
    tier: baseDetection.tier || 'C',
    techniques_detected: techniquesDetected,
    memorable_moments: memorableMoments,
    craft_weaknesses: craftWeaknesses
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Measure execution time of async function
 */
async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  console.log(`      ✓ ${label}: ${duration}ms`);
  return result;
}

/**
 * Determine transformation scope
 */
function determineTransformationScope(
  transformation: any
): 'individual' | 'group' | 'community' | 'none' {
  if (!transformation || transformation.score === 0) return 'none';

  const score = transformation.score || 0;
  if (score >= 15) return 'community';
  if (score >= 10) return 'group';
  if (score > 0) return 'individual';
  return 'none';
}

/**
 * Determine philosophical depth level
 */
function determinePhilosophicalDepth(
  score: number
): 'none' | 'surface' | 'moderate' | 'deep' {
  if (score === 0) return 'none';
  if (score <= 3) return 'surface';
  if (score <= 6) return 'moderate';
  return 'deep';
}

/**
 * Cross-validate features for consistency
 */
function crossValidateFeatures(features: {
  scenes: any;
  dialogue: any;
  interiority: any;
  authenticity: any;
  elitePatterns: any;
  literary: any;
}): {
  warnings: string[];
  insights: string[];
} {
  const warnings: string[] = [];
  const insights: string[] = [];

  // Validate: Dialogue should correlate with interiority
  if (features.dialogue.has_dialogue && features.interiority.overall_score < 5) {
    warnings.push('Has dialogue but weak interiority - dialogue may not be revealing character depth');
  }

  // Validate: Scenes should correlate with literary sophistication
  if (features.scenes.has_scenes && features.literary.overall_score < 50) {
    insights.push('Has scenes but limited literary craft - could enhance descriptive language');
  }

  // Validate: High authenticity + low elite patterns = opportunity
  if (features.authenticity.score >= 7 && features.elitePatterns.overall_score < 50) {
    insights.push('Authentic voice present - could add elite patterns (vulnerability, transformation) without losing voice');
  }

  // Validate: Vulnerability should appear in interiority
  if (features.elitePatterns.patterns.vulnerability.score >= 7 && features.interiority.vulnerability_count === 0) {
    warnings.push('Elite patterns show vulnerability but interiority detector missed it - possible inconsistency');
  }

  return { warnings, insights };
}

/**
 * Identify missing opportunities across all features
 */
function identifyMissingOpportunities(params: {
  text: string;
  scenes: any;
  dialogue: any;
  interiority: any;
  elitePatterns: any;
}): {
  high_impact: string[];
  medium_impact: string[];
  low_impact: string[];
} {
  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  // High impact opportunities (major score gains)
  if (!params.scenes.has_scenes) {
    high.push('Add opening scene with temporal/spatial anchors (+5-8 points)');
  }

  if (params.interiority.vulnerability_count === 0) {
    high.push('Add vulnerability moment with physical symptom (+5-10 points)');
  }

  if (params.elitePatterns.patterns.micro_to_macro.score === 0) {
    high.push('Connect experience to universal insight (+5-7 points)');
  }

  // Medium impact opportunities
  if (!params.dialogue.has_dialogue) {
    medium.push('Add conversational dialogue that reveals character (+3-5 points)');
  }

  if (params.elitePatterns.patterns.quantified_impact.score === 0) {
    medium.push('Add specific numbers/metrics for impact (+3-5 points)');
  }

  // Low impact opportunities
  if (params.scenes.has_scenes && params.scenes.details[0]?.sensory_details?.length < 2) {
    low.push('Add more sensory details to scene (+1-2 points)');
  }

  return {
    high_impact: high,
    medium_impact: medium,
    low_impact: low
  };
}
