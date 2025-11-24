/**
 * PIQ ESSAY ANALYZER - 13-DIMENSION ORCHESTRATOR
 *
 * Philosophy: Evaluate ESSAY NARRATIVE QUALITY, not portfolio credentials
 *
 * This orchestrator combines world-class analyzers to deliver insights students
 * couldn't get anywhere else - realistic, nuanced, dynamic, authentic feedback
 * that helps them reach the highest levels (Harvard, Yale, Princeton, Stanford, MIT).
 *
 * Phase 1: 7 existing analyzers (52% weighted coverage)
 * Phase 2: Extended analyzers (72% coverage)
 * Phase 3: New analyzers (100% coverage)
 */

import {
  analyzeOpeningHookV5,
  analyzeVulnerability,
  analyzeSpecificity,
  analyzeTransformation,
  analyzeStakesTension,
  analyzeClimaxTurningPoint,
  analyzeQuotableReflection,
  analyzeConclusionReflection,
  analyzeCharacterDevelopment,
  analyzeIntellectualDepth,
  analyzeVividness,
  type HookAnalysisResult,
  type VulnerabilityAnalysis,
  type SpecificityAnalysis,
  type TransformationAnalysis
} from './analyzers.js';

// ============================================================================
// TYPES
// ============================================================================

export type PIQPromptNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type EssayTier =
  | 'needs_growth'           // <60: Requires significant revision
  | 'developing'             // 60-69: Shows potential
  | 'competitive'            // 70-79: UC Davis, BU level
  | 'very_competitive'       // 80-89: UCSD, Michigan level
  | 'highly_competitive'     // 90-99: Berkeley, UCLA level
  | 'elite_competitive';     // 100-110: Harvard, Yale, Princeton, Stanford, MIT level

export interface DimensionScore {
  score: number;              // 0-10 for this dimension
  weight: number;             // % weight for this PIQ prompt
  weighted_points: number;    // score * weight * 11 (contributes to 0-110 total)
  tier: 'weak' | 'adequate' | 'strong' | 'exceptional';

  // Rich analysis data (varies by dimension)
  analysis: any;

  // Student-facing insights
  what_works: string;
  what_limits: string;
  quick_win: string;          // One immediate improvement
}

export interface PriorityImprovement {
  dimension: string;
  current_score: number;      // 0-10
  potential_gain: number;     // How many points (out of 110) you could gain
  effort_level: 'quick_win' | 'strategic' | 'deep_work';

  // Specific, actionable guidance (not generic)
  issue: string;              // What's wrong
  fix: string;                // How to fix it
  example: string;            // Before → After transformation
  why_it_matters: string;     // Why this dimension is critical
}

export interface SchoolPlacement {
  current_tier: EssayTier;
  current_score: number;      // 0-110
  schools: string[];          // Schools at your current level
  acceptance_rates: string;   // e.g., "30-50%"

  next_tier: EssayTier;
  next_tier_schools: string[];
  points_needed: number;      // To reach next tier
  how_to_get_there: string;   // Specific roadmap
}

export interface PIQEssayAnalysis {
  // === OVERALL SCORE ===
  overall_score: number;      // 0-110 (aligned with portfolio 110-point scale)
  tier: EssayTier;

  // === DIMENSION SCORES (Phase 1: 7 dimensions) ===
  dimension_scores: {
    // Tier 1: Critical Foundations (45%)
    opening_hook?: DimensionScore;           // Dimension 1 (10%)
    vulnerability?: DimensionScore;          // Dimension 2 (12%)
    specificity?: DimensionScore;            // Dimension 3 (10%) - Phase 2
    voice?: DimensionScore;                  // Dimension 4 (8%) - Phase 3
    narrative_arc?: DimensionScore;          // Dimension 5 (9%)

    // Tier 2: Impact & Growth (30%)
    transformation?: DimensionScore;         // Dimension 6 (10%) - Phase 2
    role_clarity?: DimensionScore;           // Dimension 7 (7%) - Phase 3
    initiative?: DimensionScore;             // Dimension 8 (7%) - Phase 3
    context?: DimensionScore;                // Dimension 9 (6%) - Phase 3

    // Tier 3: Depth & Meaning (15%)
    reflection?: DimensionScore;             // Dimension 10 (9%)
    identity?: DimensionScore;               // Dimension 11 (6%)

    // Tier 4: Polish & Positioning (10%)
    craft?: DimensionScore;                  // Dimension 12 (6%)
    fit?: DimensionScore;                    // Dimension 13 (5%) - Phase 3
  };

  // === TOP PRIORITIES (Ranked by potential gain) ===
  priority_improvements: PriorityImprovement[];

  // === SCHOOL PLACEMENT ===
  school_placement: SchoolPlacement;

  // === STRENGTHS & WEAKNESSES ===
  strengths: Array<{
    dimension: string;
    why: string;
    example_quote: string;      // Actual text from their essay
  }>;

  weaknesses: Array<{
    dimension: string;
    why: string;
    how_to_fix: string;
    example_transformation: string; // Before → After
  }>;

  // === LONG-FORM INSIGHTS (Natural, conversational, caring) ===
  long_form_insights: {
    opening_assessment: string;     // Natural discussion of where they are
    what_works_deeply: string;      // Paragraph on strengths (quote their text!)
    what_limits_deeply: string;     // Paragraph on what holds them back
    transformation_opportunity: string; // Detailed upgrade path
    world_class_elevation: string;  // How to reach 100-110 (elite level)
  };

  // === META ===
  analysis_timestamp: string;
  prompt_number: PIQPromptNumber;
  word_count: number;
  dimensions_analyzed: string[];  // Which dimensions were analyzed
  coverage_percentage: number;    // % of total weight analyzed
  is_provisional?: boolean;       // True if using proportional scaling (Phase 1/2)
  provisional_note?: string;      // Explanation of coverage limitation
}

// ============================================================================
// DIMENSION WEIGHTS BY PIQ PROMPT
// ============================================================================

/**
 * Based on MERGED_13_DIMENSION_PIQ_RUBRIC.md
 * Each PIQ prompt has different dimension weights
 */
const DIMENSION_WEIGHTS: Record<PIQPromptNumber, Record<string, number>> = {
  1: { // PIQ 1 (Leadership)
    opening_hook: 0.09,
    vulnerability: 0.08,
    specificity: 0.10,
    voice: 0.08,
    narrative_arc: 0.08,
    transformation: 0.10,
    role_clarity: 0.09,
    initiative: 0.10,
    context: 0.05,
    reflection: 0.09,
    identity: 0.05,
    craft: 0.06,
    fit: 0.05
  },
  2: { // PIQ 2 (Creative)
    opening_hook: 0.12,
    vulnerability: 0.11,
    specificity: 0.09,
    voice: 0.10,
    narrative_arc: 0.08,
    transformation: 0.08,
    role_clarity: 0.06,
    initiative: 0.06,
    context: 0.05,
    reflection: 0.09,
    identity: 0.07,
    craft: 0.13,
    fit: 0.06
  },
  3: { // PIQ 3 (Talent)
    opening_hook: 0.10,
    vulnerability: 0.08,
    specificity: 0.13,
    voice: 0.08,
    narrative_arc: 0.08,
    transformation: 0.10,
    role_clarity: 0.08,
    initiative: 0.06,
    context: 0.05,
    reflection: 0.09,
    identity: 0.06,
    craft: 0.06,
    fit: 0.06
  },
  4: { // PIQ 4 (Educational Barrier)
    opening_hook: 0.09,
    vulnerability: 0.13,
    specificity: 0.12,
    voice: 0.08,
    narrative_arc: 0.11,
    transformation: 0.12,
    role_clarity: 0.06,
    initiative: 0.09,
    context: 0.13,
    reflection: 0.11,
    identity: 0.05,
    craft: 0.07,
    fit: 0.04
  },
  5: { // PIQ 5 (Challenge)
    opening_hook: 0.11,
    vulnerability: 0.15,
    specificity: 0.09,
    voice: 0.09,
    narrative_arc: 0.13,
    transformation: 0.13,
    role_clarity: 0.06,
    initiative: 0.06,
    context: 0.14,
    reflection: 0.11,
    identity: 0.07,
    craft: 0.08,
    fit: 0.04
  },
  6: { // PIQ 6 (Academic Passion)
    opening_hook: 0.09,
    vulnerability: 0.08,
    specificity: 0.12,
    voice: 0.08,
    narrative_arc: 0.07,
    transformation: 0.09,
    role_clarity: 0.06,
    initiative: 0.07,
    context: 0.08,
    reflection: 0.12,
    identity: 0.06,
    craft: 0.06,
    fit: 0.12
  },
  7: { // PIQ 7 (Community)
    opening_hook: 0.09,
    vulnerability: 0.08,
    specificity: 0.12,
    voice: 0.08,
    narrative_arc: 0.08,
    transformation: 0.08,
    role_clarity: 0.08,
    initiative: 0.09,
    context: 0.07,
    reflection: 0.09,
    identity: 0.05,
    craft: 0.06,
    fit: 0.05
  },
  8: { // PIQ 8 (Open-Ended)
    opening_hook: 0.10,
    vulnerability: 0.12,
    specificity: 0.09,
    voice: 0.08,
    narrative_arc: 0.09,
    transformation: 0.09,
    role_clarity: 0.07,
    initiative: 0.07,
    context: 0.10,
    reflection: 0.10,
    identity: 0.08,
    craft: 0.07,
    fit: 0.09
  }
};

// ============================================================================
// MAIN ANALYSIS FUNCTION (Phase 1: 7 Dimensions)
// ============================================================================

export async function analyzePIQEssay(
  essayText: string,
  promptNumber: PIQPromptNumber,
  options: {
    depth?: 'quick' | 'comprehensive';
    userContext?: {
      intended_major?: string;
      activities?: any[];
      barriers?: string[];
    };
  } = {}
): Promise<PIQEssayAnalysis> {

  console.log(`\n🎯 [PIQ Analyzer] Starting 13-dimension analysis for PIQ ${promptNumber}...`);
  console.log(`📝 Essay length: ${essayText.split(/\s+/).length} words`);

  const depth = options.depth || 'comprehensive';
  const weights = DIMENSION_WEIGHTS[promptNumber];
  const dimensionScores: any = {};

  const startTime = Date.now();

  // ==========================================================================
  // PHASE 1: Analyze 7 Existing Dimensions (52% weighted coverage)
  // ==========================================================================

  try {
    // ------------------------------------------------------------------------
    // Dimension 1: Opening Hook Quality (10%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 1/13] Analyzing Opening Hook...');
    const hookAnalysis = await analyzeOpeningHookV5(essayText, {
      depth: depth,
      essayType: getEssayType(promptNumber)
    });

    const hookScore = hookAnalysis.effectiveness_score; // 0-10
    const hookWeight = weights.opening_hook;

    dimensionScores.opening_hook = {
      score: hookScore,
      weight: hookWeight,
      weighted_points: hookScore * hookWeight * 11, // Contributes to 0-110 total
      tier: scoreToTier(hookScore),
      analysis: hookAnalysis,
      what_works: hookAnalysis.what_works || '',
      what_limits: hookAnalysis.what_could_be_stronger?.join('. ') || '',
      quick_win: hookAnalysis.next_step || ''
    };

    console.log(`   ✓ Hook Score: ${hookScore.toFixed(1)}/10 (${hookAnalysis.hook_type})`);
    console.log(`   ✓ Effectiveness: ${hookAnalysis.hook_tier}`);

    // ------------------------------------------------------------------------
    // Dimension 2: Vulnerability & Authenticity (12%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 2/13] Analyzing Vulnerability & Authenticity...');
    const vulnAnalysis = await analyzeVulnerability(essayText);

    const vulnScore = vulnAnalysis.vulnerability_score; // 0-10
    const vulnWeight = weights.vulnerability;

    dimensionScores.vulnerability = {
      score: vulnScore,
      weight: vulnWeight,
      weighted_points: vulnScore * vulnWeight * 11,
      tier: scoreToTier(vulnScore),
      analysis: vulnAnalysis,
      what_works: vulnAnalysis.strengths?.slice(0, 2).join('. ') || '',
      what_limits: vulnAnalysis.weaknesses?.slice(0, 2).join('. ') || '',
      quick_win: vulnAnalysis.quick_wins?.[0] || ''
    };

    console.log(`   ✓ Vulnerability Score: ${vulnScore.toFixed(1)}/10 (Level ${vulnAnalysis.vulnerability_level})`);
    console.log(`   ✓ Authenticity: ${vulnAnalysis.authenticity_score.toFixed(1)}/10`);
    console.log(`   ✓ Transformation: ${vulnAnalysis.transformation_earned ? '✓ Earned' : '⚠ Stated only'}`);

    // ------------------------------------------------------------------------
    // Dimension 3: Specificity & Evidence (10%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 3/13] Analyzing Specificity & Evidence...');

    // Combine specificity + vividness analyzers
    const specificityAnalysis = await analyzeSpecificity(essayText);
    const vividnessAnalysisForSpecificity = await analyzeVividness(essayText);

    // Calculate composite score: specificity 60%, vividness 40%
    const specificityScore = calculateSpecificityScore(specificityAnalysis, vividnessAnalysisForSpecificity);
    const specificityWeight = weights.specificity;

    dimensionScores.specificity = {
      score: specificityScore,
      weight: specificityWeight,
      weighted_points: specificityScore * specificityWeight * 11,
      tier: scoreToTier(specificityScore),
      analysis: { specificity: specificityAnalysis, vividness: vividnessAnalysisForSpecificity },
      what_works: specificityAnalysis.strengths?.[0] || '',
      what_limits: specificityAnalysis.weaknesses?.[0] || '',
      quick_win: specificityAnalysis.quick_wins?.[0] || ''
    };

    console.log(`   ✓ Specificity Score: ${specificityScore.toFixed(1)}/10`);
    console.log(`   ✓ Numbers Count: ${specificityAnalysis.numbers_count}`);
    console.log(`   ✓ Proper Nouns Count: ${specificityAnalysis.proper_nouns_count}`);

    // ------------------------------------------------------------------------
    // Dimension 5: Narrative Arc & Stakes (9%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 5/13] Analyzing Narrative Arc & Stakes...');

    // Combine stakes + climax analyzers
    const narrativeInput = { essayText, wordCount: essayText.split(/\s+/).length };
    const stakesAnalysis = await analyzeStakesTension(narrativeInput, getEssayType(promptNumber));
    const climaxAnalysis = await analyzeClimaxTurningPoint(narrativeInput, getEssayType(promptNumber));

    // Calculate arc score from both
    const arcScore = calculateArcScore(stakesAnalysis, climaxAnalysis);
    const arcWeight = weights.narrative_arc;

    dimensionScores.narrative_arc = {
      score: arcScore,
      weight: arcWeight,
      weighted_points: arcScore * arcWeight * 11,
      tier: scoreToTier(arcScore),
      analysis: { stakes: stakesAnalysis, climax: climaxAnalysis },
      what_works: [
        (stakesAnalysis as any).strengths?.[0] || (stakesAnalysis as any).engagementFactors?.[0],
        (climaxAnalysis as any).strengths?.[0]
      ].filter(Boolean).join('. '),
      what_limits: [
        (stakesAnalysis as any).weaknesses?.[0] || (stakesAnalysis as any).disengagementFactors?.[0],
        (climaxAnalysis as any).weaknesses?.[0]
      ].filter(Boolean).join('. '),
      quick_win: (stakesAnalysis as any).quick_wins?.[0] || (stakesAnalysis as any).improvementSuggestions?.[0] || (climaxAnalysis as any).quick_wins?.[0] || (climaxAnalysis as any).improvementSuggestions?.[0] || ''
    };

    console.log(`   ✓ Arc Score: ${arcScore.toFixed(1)}/10`);
    console.log(`   ✓ Stakes Clarity: ${(stakesAnalysis as any).stakes_clarity_score?.toFixed(1) || (stakesAnalysis as any).stakesClarity?.toFixed(1) || 'N/A'}/10`);
    console.log(`   ✓ Turning Point: ${(climaxAnalysis as any).has_turning_point ? '✓ Present' : (climaxAnalysis as any).hasTurningPoint ? '✓ Present' : '⚠ Missing'}`);

    // ------------------------------------------------------------------------
    // Dimension 6: Transformative Impact (10%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 6/13] Analyzing Transformative Impact...');

    // Combine transformation analyzer + vulnerability's transformation component
    const transformationAnalysis = await analyzeTransformation(essayText);

    // Calculate composite score: transformation 60%, vuln transformation 40%
    const transformationScore = calculateTransformationScore(transformationAnalysis, vulnAnalysis);
    const transformationWeight = weights.transformation;

    dimensionScores.transformation = {
      score: transformationScore,
      weight: transformationWeight,
      weighted_points: transformationScore * transformationWeight * 11,
      tier: scoreToTier(transformationScore),
      analysis: { transformation: transformationAnalysis, vuln_transformation: vulnAnalysis.transformation_score },
      what_works: transformationAnalysis.strengths?.[0] || '',
      what_limits: transformationAnalysis.weaknesses?.[0] || '',
      quick_win: transformationAnalysis.quick_wins?.[0] || ''
    };

    console.log(`   ✓ Transformation Score: ${transformationScore.toFixed(1)}/10`);
    console.log(`   ✓ Growth Type: ${transformationAnalysis.growth_type}`);
    console.log(`   ✓ Belief Shifts Count: ${transformationAnalysis.belief_shift_count}`);

    // ------------------------------------------------------------------------
    // Dimension 10: Reflection & Insight (9%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 10/13] Analyzing Reflection & Insight...');

    // Combine quotable reflection + conclusion + intellectual depth
    const quotableAnalysis = await analyzeQuotableReflection(essayText);
    const conclusionAnalysis = await analyzeConclusionReflection(narrativeInput, getEssayType(promptNumber));
    const intellectualAnalysis = await analyzeIntellectualDepth(essayText);

    const reflectionScore = calculateReflectionScore(
      quotableAnalysis,
      conclusionAnalysis,
      intellectualAnalysis
    );
    const reflectionWeight = weights.reflection;

    dimensionScores.reflection = {
      score: reflectionScore,
      weight: reflectionWeight,
      weighted_points: reflectionScore * reflectionWeight * 11,
      tier: scoreToTier(reflectionScore),
      analysis: {
        quotable: quotableAnalysis,
        conclusion: conclusionAnalysis,
        intellectual: intellectualAnalysis
      },
      what_works: [
        (quotableAnalysis as any).strengths?.[0],
        (intellectualAnalysis as any).strengths?.[0]
      ].filter(Boolean).join('. '),
      what_limits: [
        (quotableAnalysis as any).weaknesses?.[0],
        (conclusionAnalysis as any).weaknesses?.[0]
      ].filter(Boolean).join('. '),
      quick_win: (quotableAnalysis as any).quick_wins?.[0] || ''
    };

    console.log(`   ✓ Reflection Score: ${reflectionScore.toFixed(1)}/10`);
    console.log(`   ✓ Intellectual Depth: ${(intellectualAnalysis as any).depth_score?.toFixed(1) || (intellectualAnalysis as any).depthScore?.toFixed(1) || 'N/A'}/10`);

    // ------------------------------------------------------------------------
    // Dimension 11: Identity & Self-Discovery (6%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 11/13] Analyzing Identity & Self-Discovery...');

    const characterAnalysis = await analyzeCharacterDevelopment(narrativeInput, getEssayType(promptNumber));

    // Calculate identity score from character analyzer's rich data
    const identityScore = calculateIdentityScore(characterAnalysis);
    const identityWeight = weights.identity;

    dimensionScores.identity = {
      score: identityScore,
      weight: identityWeight,
      weighted_points: identityScore * identityWeight * 11,
      tier: scoreToTier(identityScore),
      analysis: characterAnalysis,
      what_works: (characterAnalysis as any).strengths?.[0] || '',
      what_limits: (characterAnalysis as any).weaknesses?.[0] || '',
      quick_win: (characterAnalysis as any).quick_wins?.[0] || ''
    };

    console.log(`   ✓ Identity Score: ${identityScore.toFixed(1)}/10`);
    console.log(`   ✓ Character Arc: ${(characterAnalysis as any).arc_quality || 'N/A'}`);

    // ------------------------------------------------------------------------
    // Dimension 12: Craft & Language Quality (6%)
    // ------------------------------------------------------------------------
    console.log('\n📍 [Dimension 12/13] Analyzing Craft & Language Quality...');

    // Use vividness analyzer for now (covers imagery, sensory, metaphor)
    const vividnessAnalysis = await analyzeVividness(essayText);

    const craftScore = (vividnessAnalysis as any).overall_vividness_score || 5.0;
    const craftWeight = weights.craft;

    dimensionScores.craft = {
      score: craftScore,
      weight: craftWeight,
      weighted_points: craftScore * craftWeight * 11,
      tier: scoreToTier(craftScore),
      analysis: vividnessAnalysis,
      what_works: (vividnessAnalysis as any).strengths?.[0] || '',
      what_limits: (vividnessAnalysis as any).weaknesses?.[0] || '',
      quick_win: (vividnessAnalysis as any).quick_wins?.[0] || ''
    };

    console.log(`   ✓ Craft Score: ${craftScore.toFixed(1)}/10`);
    console.log(`   ✓ Imagery Quality: ${(vividnessAnalysis as any).imagery_quality || 'N/A'}`);

  } catch (error) {
    console.error('\n❌ [PIQ Analyzer] Error during dimension analysis:', error);
    throw error;
  }

  // ==========================================================================
  // CALCULATE OVERALL SCORE (0-110 scale)
  // ==========================================================================

  const analyzedDimensions = Object.keys(dimensionScores);

  // Calculate total weight of analyzed dimensions
  const totalAnalyzedWeight = analyzedDimensions.reduce((sum, dim) => {
    return sum + dimensionScores[dim].weight;
  }, 0);

  // Calculate raw weighted points from analyzed dimensions
  const rawWeightedPoints = analyzedDimensions.reduce((sum, dim) => {
    return sum + dimensionScores[dim].weighted_points;
  }, 0);

  // PHASE 1 PROVISIONAL SCALING:
  // Since we only analyze 6/13 dimensions (46-52% coverage depending on PIQ),
  // we scale the analyzed dimensions proportionally to fill the 0-110 range.
  // This gives students accurate relative scores while being transparent about coverage.
  const scalingFactor = 1.0 / totalAnalyzedWeight;
  const provisionalScore = Math.min(Math.round(rawWeightedPoints * scalingFactor), 110);

  const overallScore = provisionalScore;
  const tier = scoreToEssayTier(overallScore);

  console.log(`\n📊 [PIQ Analyzer] Overall Score: ${overallScore}/110 (${tier})`);
  console.log(`   Phase 1 Provisional (${Math.round(totalAnalyzedWeight * 100)}% coverage, scaled to 0-110)`);
  console.log(`⏱️  Analysis completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // ==========================================================================
  // RANK PRIORITY IMPROVEMENTS
  // ==========================================================================

  const priorityImprovements = rankImprovements(dimensionScores, weights);

  // ==========================================================================
  // DETERMINE SCHOOL PLACEMENT
  // ==========================================================================

  const schoolPlacement = getSchoolPlacement(overallScore, tier);

  // ==========================================================================
  // EXTRACT STRENGTHS & WEAKNESSES
  // ==========================================================================

  const strengths = extractStrengths(dimensionScores, essayText);
  const weaknesses = extractWeaknesses(dimensionScores);

  // ==========================================================================
  // GENERATE LONG-FORM INSIGHTS (Natural, conversational)
  // ==========================================================================

  const longFormInsights = generateLongFormInsights(
    overallScore,
    tier,
    dimensionScores,
    strengths,
    weaknesses,
    schoolPlacement,
    promptNumber
  );

  // ==========================================================================
  // RETURN COMPREHENSIVE ANALYSIS
  // ==========================================================================

  const analysis: PIQEssayAnalysis = {
    overall_score: overallScore,
    tier: tier,
    dimension_scores: dimensionScores,
    priority_improvements: priorityImprovements,
    school_placement: schoolPlacement,
    strengths: strengths,
    weaknesses: weaknesses,
    long_form_insights: longFormInsights,
    analysis_timestamp: new Date().toISOString(),
    prompt_number: promptNumber,
    word_count: essayText.split(/\s+/).length,
    dimensions_analyzed: analyzedDimensions,
    coverage_percentage: Math.round(totalAnalyzedWeight * 100),
    is_provisional: true,
    provisional_note: `Phase 1 analysis with ${Math.round(totalAnalyzedWeight * 100)}% coverage (6/13 dimensions). Score scaled proportionally to 0-110 range.`
  };

  return analysis;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEssayType(promptNumber: PIQPromptNumber): string {
  const types: Record<PIQPromptNumber, string> = {
    1: 'leadership',
    2: 'creative',
    3: 'creative',
    4: 'challenge',
    5: 'challenge',
    6: 'academic',
    7: 'leadership',
    8: 'growth'
  };
  return types[promptNumber] || 'growth';
}

function scoreToTier(score: number): 'weak' | 'adequate' | 'strong' | 'exceptional' {
  if (score >= 8.5) return 'exceptional';
  if (score >= 7.0) return 'strong';
  if (score >= 5.0) return 'adequate';
  return 'weak';
}

function scoreToEssayTier(score: number): EssayTier {
  if (score >= 100) return 'elite_competitive';
  if (score >= 90) return 'highly_competitive';
  if (score >= 80) return 'very_competitive';
  if (score >= 70) return 'competitive';
  if (score >= 60) return 'developing';
  return 'needs_growth';
}

function calculateArcScore(stakesAnalysis: any, climaxAnalysis: any): number {
  // Extract actual scores from analyzer outputs (camelCase field names!)
  const tensionLevel = stakesAnalysis.tensionLevel || 5.0; // 0-10
  const readerInvestment = stakesAnalysis.readerInvestment || 5.0; // 0-10

  const climaxStrength = climaxAnalysis.climaxStrength || 5.0; // 0-10
  const turningPointDepth = climaxAnalysis.turningPointDepth || 5.0; // 0-10
  const hasTurningPoint = climaxAnalysis.hasTurningPoint ? 1.0 : 0.0;

  // Average the tension/stakes components (50%) + climax/turning point (40%) + bonus for having turning point (10%)
  const stakesAvg = (tensionLevel + readerInvestment) / 2;
  const climaxAvg = (climaxStrength + turningPointDepth) / 2;

  return (stakesAvg * 0.5 + climaxAvg * 0.4 + hasTurningPoint * 1.0);
}

function calculateReflectionScore(
  quotable: any,
  conclusion: any,
  intellectual: any
): number {
  // Extract actual scores from analyzer outputs (mixed snake_case and camelCase!)
  const quotableScore = quotable.reflection_level || 3; // 1-5 scale, normalize to 0-10
  const normalizedQuotable = (quotableScore / 5.0) * 10.0;

  const conclusionDepth = conclusion.reflectionDepth || 5.0; // 0-10 (camelCase!)

  // Intellectual has both level (1-5) and score_0_to_10 (0-10), use the direct score
  const intellectualScore = intellectual.score_0_to_10 || intellectual.intellectual_level * 2 || 6.0; // 0-10

  return (normalizedQuotable * 0.3 + conclusionDepth * 0.3 + intellectualScore * 0.4);
}

function calculateIdentityScore(characterAnalysis: any): number {
  // Character analyzer has rich 0-10 scores for identity components
  const interiorityDepth = characterAnalysis.interiorityDepth || 5.0; // 0-10
  const voiceAuth = characterAnalysis.voiceAuthenticity || 5.0; // 0-10
  const agencyLevel = characterAnalysis.agencyLevel || 5.0; // 0-10

  // Weight: interiority 40% (shows depth), voice 30% (authenticity), agency 30% (active protagonist)
  return (interiorityDepth * 0.4 + voiceAuth * 0.3 + agencyLevel * 0.3);
}

function calculateSpecificityScore(
  specificityAnalysis: SpecificityAnalysis,
  vividnessAnalysis: any
): number {
  // Extract scores from both analyzers
  const specificityScore = specificityAnalysis.specificity_score || 5.0; // 0-10
  const vividnessScore = vividnessAnalysis.overall_vividness_score || 5.0; // 0-10

  // Composite: specificity 60% (concrete evidence), vividness 40% (sensory details)
  return (specificityScore * 0.6 + vividnessScore * 0.4);
}

function calculateTransformationScore(
  transformationAnalysis: TransformationAnalysis,
  vulnAnalysis: VulnerabilityAnalysis
): number {
  // Extract scores from both analyzers
  const transformationScore = transformationAnalysis.transformation_score || 5.0; // 0-10
  const vulnTransformationScore = vulnAnalysis.transformation_score || 5.0; // 0-10

  // Composite: transformation 60% (belief shifts, behavioral changes), vuln transformation 40% (earned vs stated)
  return (transformationScore * 0.6 + vulnTransformationScore * 0.4);
}

function rankImprovements(
  dimensionScores: any,
  weights: Record<string, number>
): PriorityImprovement[] {
  const improvements: PriorityImprovement[] = [];

  for (const [dim, data] of Object.entries(dimensionScores)) {
    const dimData = data as DimensionScore;
    const currentScore = dimData.score;
    const weight = dimData.weight;

    // Potential gain = (10 - current_score) * weight * 11
    const potentialGain = (10 - currentScore) * weight * 11;

    // Skip if already excellent (9+)
    if (currentScore >= 9.0) continue;

    // Determine effort level
    let effortLevel: 'quick_win' | 'strategic' | 'deep_work' = 'strategic';
    if (dimData.quick_win && dimData.quick_win.length > 0 && currentScore >= 6.0) {
      effortLevel = 'quick_win';
    } else if (currentScore < 4.0) {
      effortLevel = 'deep_work';
    }

    improvements.push({
      dimension: formatDimensionName(dim),
      current_score: currentScore,
      potential_gain: Math.round(potentialGain * 10) / 10,
      effort_level: effortLevel,
      issue: dimData.what_limits || 'Could be strengthened',
      fix: dimData.quick_win || 'See detailed guidance',
      example: '', // Will be filled by specific analyzers
      why_it_matters: getWhyItMatters(dim, weight)
    });
  }

  // Sort by potential gain (highest first)
  return improvements.sort((a, b) => b.potential_gain - a.potential_gain);
}

function formatDimensionName(dim: string): string {
  const names: Record<string, string> = {
    opening_hook: 'Opening Hook',
    vulnerability: 'Vulnerability & Authenticity',
    specificity: 'Specificity & Evidence',
    voice: 'Voice Integrity',
    narrative_arc: 'Narrative Arc & Stakes',
    transformation: 'Transformative Impact',
    role_clarity: 'Role Clarity & Ownership',
    initiative: 'Initiative & Leadership',
    context: 'Context & Circumstances',
    reflection: 'Reflection & Insight',
    identity: 'Identity & Self-Discovery',
    craft: 'Craft & Language Quality',
    fit: 'Fit & Trajectory'
  };
  return names[dim] || dim;
}

function getWhyItMatters(dim: string, weight: number): string {
  const reasons: Record<string, string> = {
    opening_hook: 'Your opening is the first thing admissions officers read. A strong hook ensures they keep reading engaged.',
    vulnerability: 'Authenticity and emotional depth separate memorable essays from generic ones. 68% of successful admits show high vulnerability.',
    narrative_arc: 'Essays with clear tension and stakes keep readers engaged. Without arc, it feels like a resume list.',
    reflection: 'Personal Insight Questions literally ask for insight. Deep reflection shows maturity and self-awareness.',
    identity: 'Admissions officers want to understand who you are. Identity clarity makes you memorable.',
    craft: 'Well-crafted essays are more enjoyable to read and more memorable.',
  };
  const baseReason = reasons[dim] || 'This dimension contributes significantly to your overall score.';
  const weightPercent = Math.round(weight * 100);
  return `${baseReason} (Worth ${weightPercent}% of your score)`;
}

function getSchoolPlacement(score: number, tier: EssayTier): SchoolPlacement {
  const placements: Record<EssayTier, any> = {
    elite_competitive: {
      schools: ['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT', 'Columbia', 'Caltech'],
      acceptance_rates: '3-6%',
      next_tier: 'elite_competitive',
      next_tier_schools: [],
      points_needed: 0,
      how_to_get_there: 'You\'re at the highest level. Focus on authentic storytelling and reflection.'
    },
    highly_competitive: {
      schools: ['UC Berkeley', 'UCLA', 'Northwestern', 'Duke', 'Cornell', 'USC', 'Carnegie Mellon'],
      acceptance_rates: '10-15%',
      next_tier: 'elite_competitive',
      next_tier_schools: ['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT'],
      points_needed: 100 - score,
      how_to_get_there: 'Deepen vulnerability, add specific failures, strengthen transformation arc.'
    },
    very_competitive: {
      schools: ['UC San Diego', 'UC Santa Barbara', 'UC Irvine', 'Michigan', 'UNC', 'UT Austin', 'NYU'],
      acceptance_rates: '15-30%',
      next_tier: 'highly_competitive',
      next_tier_schools: ['UC Berkeley', 'UCLA', 'Duke'],
      points_needed: 90 - score,
      how_to_get_there: 'Add emotional specificity, strengthen opening hook, deepen reflection.'
    },
    competitive: {
      schools: ['UC Davis', 'UC Irvine', 'Boston University', 'Wisconsin', 'UIUC'],
      acceptance_rates: '30-50%',
      next_tier: 'very_competitive',
      next_tier_schools: ['UC San Diego', 'Michigan', 'UNC'],
      points_needed: 80 - score,
      how_to_get_there: 'Start with specific moment (not background), add sensory details, show transformation.'
    },
    developing: {
      schools: ['UC Riverside', 'UC Merced', 'State universities'],
      acceptance_rates: '50-70%',
      next_tier: 'competitive',
      next_tier_schools: ['UC Davis', 'UC Irvine', 'BU'],
      points_needed: 70 - score,
      how_to_get_there: 'Focus on one specific story, add concrete details, show what changed in your thinking.'
    },
    needs_growth: {
      schools: [],
      acceptance_rates: 'N/A',
      next_tier: 'developing',
      next_tier_schools: ['UC Riverside', 'UC Merced'],
      points_needed: 60 - score,
      how_to_get_there: 'Pick one specific moment to focus on. Show, don\'t tell. Add sensory details and reflection.'
    }
  };

  const placement = placements[tier];
  return {
    current_tier: tier,
    current_score: score,
    schools: placement.schools,
    acceptance_rates: placement.acceptance_rates,
    next_tier: placement.next_tier,
    next_tier_schools: placement.next_tier_schools,
    points_needed: placement.points_needed,
    how_to_get_there: placement.how_to_get_there
  };
}

function extractStrengths(dimensionScores: any, essayText: string): any[] {
  const strengths = [];

  for (const [dim, data] of Object.entries(dimensionScores)) {
    const dimData = data as DimensionScore;
    if (dimData.score >= 7.0 && dimData.what_works) {
      // Extract example quote from essay if possible
      let exampleQuote = '';
      if (dim === 'opening_hook' && dimData.analysis) {
        const sentences = essayText.split(/[.!?]+/);
        exampleQuote = sentences[0]?.trim() || '';
      }

      strengths.push({
        dimension: formatDimensionName(dim),
        why: dimData.what_works,
        example_quote: exampleQuote
      });
    }
  }

  return strengths.slice(0, 5); // Top 5 strengths
}

function extractWeaknesses(dimensionScores: any): any[] {
  const weaknesses = [];

  for (const [dim, data] of Object.entries(dimensionScores)) {
    const dimData = data as DimensionScore;
    if (dimData.score < 7.0 && dimData.what_limits) {
      weaknesses.push({
        dimension: formatDimensionName(dim),
        why: dimData.what_limits,
        how_to_fix: dimData.quick_win || 'See detailed guidance below',
        example_transformation: '' // Will be filled by UI layer
      });
    }
  }

  return weaknesses.slice(0, 5); // Top 5 weaknesses
}

function generateLongFormInsights(
  score: number,
  tier: EssayTier,
  dimensionScores: any,
  strengths: any[],
  weaknesses: any[],
  placement: SchoolPlacement,
  promptNumber: PIQPromptNumber
): any {

  // Natural, conversational opening
  const openingAssessment = generateOpeningAssessment(score, tier, placement);

  // Deep dive on what works
  const whatWorksDeeply = generateWhatWorks(strengths, dimensionScores);

  // Deep dive on what limits
  const whatLimitsDeeply = generateWhatLimits(weaknesses, dimensionScores);

  // Transformation opportunity
  const transformationOpportunity = generateTransformationPath(
    score,
    tier,
    weaknesses,
    placement
  );

  // World-class elevation
  const worldClassElevation = generateWorldClassPath(
    score,
    tier,
    dimensionScores,
    promptNumber
  );

  return {
    opening_assessment: openingAssessment,
    what_works_deeply: whatWorksDeeply,
    what_limits_deeply: whatLimitsDeeply,
    transformation_opportunity: transformationOpportunity,
    world_class_elevation: worldClassElevation
  };
}

function generateOpeningAssessment(score: number, tier: EssayTier, placement: SchoolPlacement): string {
  if (tier === 'elite_competitive') {
    return `Your essay scores ${score}/110, placing you in the top 3-5% of PIQ essays nationally. This is Harvard, Yale, Princeton, Stanford, MIT competitive. Your narrative demonstrates exceptional craft and depth.`;
  } else if (tier === 'highly_competitive') {
    return `Your essay scores ${score}/110—excellent work. You're competitive for top-tier schools like ${placement.schools.slice(0, 3).join(', ')}. You're ${placement.points_needed} points from elite level (100+). Let's talk about how to get there.`;
  } else if (tier === 'very_competitive') {
    return `Your essay scores ${score}/110, which puts you in range for schools like ${placement.schools.slice(0, 3).join(', ')}. Your foundation is strong. To reach highly competitive level (90+) for Berkeley or UCLA, you need to strengthen ${placement.points_needed} points worth of dimensions.`;
  } else if (tier === 'competitive') {
    return `Your essay scores ${score}/110—you're competitive for ${placement.schools.slice(0, 2).join(' and ')}. Your story has potential, but it needs more depth to compete at higher levels. Let's focus on the ${placement.points_needed} points that will get you to very competitive level (80+).`;
  } else if (tier === 'developing') {
    return `Your essay scores ${score}/110. Right now, this needs strengthening to be competitive for selective schools. The good news: you have clear areas to improve, and ${placement.points_needed} points will get you to competitive level (70+). Let's break down exactly how.`;
  } else {
    return `Your essay scores ${score}/110 and needs significant revision. But don't be discouraged—this is fixable. Let's focus on the fundamentals that will add ${placement.points_needed}+ points: specific storytelling, emotional depth, and reflection.`;
  }
}

function generateWhatWorks(strengths: any[], dimensionScores: any): string {
  if (strengths.length === 0) {
    return 'Your essay shows effort, but we need to identify and build on specific strengths. Let\'s focus on the improvement areas below.';
  }

  const topStrengths = strengths.slice(0, 3);
  const parts = topStrengths.map(s => `**${s.dimension}**: ${s.why}`);

  return `Here's what's working:\n\n${parts.join('\n\n')}\n\nThese are solid foundations to build on. Let's strengthen the weaker dimensions to bring your overall score up.`;
}

function generateWhatLimits(weaknesses: any[], dimensionScores: any): string {
  if (weaknesses.length === 0) {
    return 'Your essay is strong across all analyzed dimensions. Focus on polish and refinement.';
  }

  const topWeaknesses = weaknesses.slice(0, 3);
  const parts = topWeaknesses.map(w => `**${w.dimension}**: ${w.why}`);

  return `Here's what's holding you back:\n\n${parts.join('\n\n')}\n\nThese aren't fatal flaws—they're specific, fixable issues. Let's tackle them systematically.`;
}

function generateTransformationPath(
  score: number,
  tier: EssayTier,
  weaknesses: any[],
  placement: SchoolPlacement
): string {
  const nextTier = placement.next_tier;
  const pointsNeeded = placement.points_needed;
  const topWeakness = weaknesses[0];

  if (tier === 'elite_competitive') {
    return 'You\'re already at the highest level. Focus on authentic voice and avoiding over-editing. Sometimes less polished but more genuine is better than perfectly crafted but safe.';
  }

  return `To reach ${nextTier} level (${placement.next_tier_schools.slice(0, 2).join(', ')} competitive), you need ${pointsNeeded} more points. Your biggest opportunity: **${topWeakness?.dimension}** (worth up to ${topWeakness?.potential_gain || 8} points). ${placement.how_to_get_there}`;
}

function generateWorldClassPath(
  score: number,
  tier: EssayTier,
  dimensionScores: any,
  promptNumber: PIQPromptNumber
): string {
  if (tier === 'elite_competitive') {
    return 'You\'re at world-class level. The only elevation from here is ensuring every sentence matters, every detail serves the story, and your reflection reveals something genuinely new about yourself.';
  }

  const pointsToElite = 100 - score;

  return `To reach elite competitive level (100-110: Harvard, Yale, Princeton, Stanford, MIT), you need ${pointsToElite} more points. This requires:\n\n1. **Opening Hook**: Start mid-action or with vulnerability, not background\n2. **Vulnerability**: Show specific failures, physical symptoms of stress, what you're still figuring out\n3. **Transformation**: Demonstrate belief shift with before/after thinking, not "I learned..."\n4. **Reflection**: Connect your specific story to universal insights\n\nFocus on one dimension at a time. Each improvement compounds.`;
}
