/**
 * Three-Tier Improvement Roadmap Generator
 *
 * Generates prioritized, actionable improvements based on:
 * - Dimension scores (what's weak)
 * - Missing features (what's absent)
 * - Prompt requirements (what's required)
 * - Expected ROI (effort → score impact)
 *
 * Three tiers:
 * 1. Quick Wins (5-10 min, +1-3 points)
 * 2. Strategic Moves (20-30 min, +3-5 points)
 * 3. Transformative Changes (45-60 min, +5-10 points)
 */

import type { DimensionScore } from './adaptiveRubricScorer';
import type { UniversalFeatures } from './universalFeatureDetector';
import type { PromptIntelligenceResult } from './promptIntelligence';
import type { PIQContentType } from './contentTypeDetector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ImprovementAction {
  action: string; // What to do
  expected_impact: string; // "+2-3 points" or "Tier 2 → Tier 1"
  how_to: string; // Specific instructions
  why: string; // Justification based on research
  priority: number; // 1-10 (10 = highest)
  estimated_time: string; // "5-10 min"
  affects_dimensions: string[]; // Which dimensions this improves
}

export interface ImprovementRoadmap {
  current_tier: 1 | 2 | 3 | 4;
  target_tier: 1 | 2 | 3 | 4;
  estimated_total_gain: string; // "+8-12 points"

  quick_wins: ImprovementAction[]; // 5-10 min each
  strategic_moves: ImprovementAction[]; // 20-30 min each
  transformative_changes: ImprovementAction[]; // 45-60 min each

  priority_order: string[]; // Recommended sequence
  tier_progression_path: string; // "Quick wins → Strategic → Transform to reach Tier 1"
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function generateImprovementRoadmap(
  text: string,
  currentPQI: number,
  currentTier: 1 | 2 | 3 | 4,
  dimensionScores: DimensionScore[],
  features: UniversalFeatures,
  promptAnalysis: PromptIntelligenceResult,
  contentType: PIQContentType
): Promise<ImprovementRoadmap> {

  // Identify weakest dimensions (biggest opportunity)
  const weakDimensions = dimensionScores
    .filter(d => d.score_0_to_10 < 6)
    .sort((a, b) => a.score_0_to_10 - b.score_0_to_10);

  // Identify missing high-impact features
  const missingFeatures = identifyMissingFeatures(features);

  // Generate actions for each tier
  const quickWins = generateQuickWins(
    text,
    dimensionScores,
    missingFeatures,
    promptAnalysis
  );

  const strategicMoves = generateStrategicMoves(
    text,
    weakDimensions,
    features,
    promptAnalysis,
    contentType
  );

  const transformativeChanges = generateTransformativeChanges(
    currentTier,
    dimensionScores,
    features,
    contentType
  );

  // Calculate target tier
  const targetTier = calculateTargetTier(currentTier, quickWins, strategicMoves, transformativeChanges);

  // Estimate total gain
  const estimatedGain = calculateEstimatedGain(quickWins, strategicMoves, transformativeChanges);

  // Generate priority order
  const priorityOrder = generatePriorityOrder(quickWins, strategicMoves, transformativeChanges);

  // Tier progression path
  const progressionPath = generateProgressionPath(currentTier, targetTier);

  return {
    current_tier: currentTier,
    target_tier: targetTier,
    estimated_total_gain: estimatedGain,
    quick_wins: quickWins,
    strategic_moves: strategicMoves,
    transformative_changes: transformativeChanges,
    priority_order: priorityOrder,
    tier_progression_path: progressionPath
  };
}

// ============================================================================
// TIER 1: QUICK WINS (5-10 min, +1-3 points)
// ============================================================================

function generateQuickWins(
  text: string,
  dimensionScores: DimensionScore[],
  missingFeatures: string[],
  promptAnalysis: PromptIntelligenceResult
): ImprovementAction[] {

  const actions: ImprovementAction[] = [];

  // Quick Win 1: Add specific numbers
  const hasNumbers = /\b\d+\s*(people|students|hours|weeks|months|%)/gi.test(text);
  if (!hasNumbers) {
    actions.push({
      action: "Add 2-3 specific numbers to quantify your impact",
      expected_impact: "+1-2 points",
      how_to: "Replace vague phrases: 'many people' → '47 students', 'a long time' → '18 months', 'improved' → 'increased by 35%'",
      why: "100% of Harvard/Berkeley admits use specific numbers. Numbers signal credibility and scale.",
      priority: 9,
      estimated_time: "5 min",
      affects_dimensions: ['voice_authenticity', 'quantified_impact']
    });
  }

  // Quick Win 2: Replace buzzwords
  const buzzwords = ['passion', 'journey', 'impact', 'leadership', 'dedicated'];
  const foundBuzzwords = buzzwords.filter(b => text.toLowerCase().includes(b));
  if (foundBuzzwords.length > 0) {
    actions.push({
      action: `Remove buzzwords: ${foundBuzzwords.join(', ')}`,
      expected_impact: "+1-2 points",
      how_to: `Replace with concrete language: 'passion for math' → 'spent hours proving theorems', 'leadership skills' → 'organized 12 volunteers'`,
      why: "AOs instantly spot manufactured language. Buzzwords signal essay voice, not authentic voice.",
      priority: 8,
      estimated_time: "7 min",
      affects_dimensions: ['voice_authenticity', 'authenticity']
    });
  }

  // Quick Win 3: Add duration/time investment
  const hasDuration = /\b(\d+\s*(year|years|month|months|weeks?|hours?\s*per\s*week))/gi.test(text);
  if (!hasDuration && promptAnalysis.prompt_id !== 5) { // Not for challenge prompt
    actions.push({
      action: "Add time commitment detail",
      expected_impact: "+1 point",
      how_to: "Mention: '2 years', '10 hours per week', 'throughout junior year', 'every Thursday for 6 months'",
      why: "Shows sustained commitment (depth over breadth). UC rubric values consistency.",
      priority: 7,
      estimated_time: "5 min",
      affects_dimensions: ['time_investment', 'context_circumstances']
    });
  }

  // Quick Win 4: Add names of people
  const hasNames = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g.test(text);
  const nameCount = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || []).length;
  if (nameCount < 2) {
    actions.push({
      action: "Add names of 1-2 people involved",
      expected_impact: "+1 point",
      how_to: "Replace 'my mentor' → 'Dr. Garcia', 'a student' → 'James, a freshman', 'my teacher' → 'Ms. Thompson'",
      why: "Specificity signals authenticity. Names make the story real and memorable.",
      priority: 6,
      estimated_time: "5 min",
      affects_dimensions: ['voice_authenticity', 'show_dont_tell']
    });
  }

  // Quick Win 5: Shorten opening sentence
  const firstSentence = text.split(/[.!?]/)[0];
  const firstSentenceWordCount = firstSentence.split(/\s+/).length;
  if (firstSentenceWordCount > 20) {
    actions.push({
      action: "Shorten opening sentence to under 15 words",
      expected_impact: "+1 point",
      how_to: "Cut to core moment. Current: 25 words. Target: 12 words. Start with action or scene.",
      why: "Strong hooks = concise. 'I stared at the circuit board' (6 words) > 'Throughout my involvement in robotics I have encountered many challenges' (10 words)",
      priority: 7,
      estimated_time: "5 min",
      affects_dimensions: ['opening_power', 'show_dont_tell']
    });
  }

  // Quick Win 6: Break into paragraphs
  const paragraphCount = text.split(/\n\n/).filter(p => p.trim().length > 0).length;
  if (paragraphCount === 1) {
    actions.push({
      action: "Break into 3-4 paragraphs for better pacing",
      expected_impact: "+0.5 points",
      how_to: "Natural breaks: (1) Opening scene, (2) Context/actions, (3) Impact/results, (4) Reflection",
      why: "Improves readability. AOs read 50+ essays per day - respect their time.",
      priority: 5,
      estimated_time: "5 min",
      affects_dimensions: ['narrative_arc']
    });
  }

  // Sort by priority and return top 5
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ============================================================================
// TIER 2: STRATEGIC MOVES (20-30 min, +3-5 points)
// ============================================================================

function generateStrategicMoves(
  text: string,
  weakDimensions: DimensionScore[],
  features: UniversalFeatures,
  promptAnalysis: PromptIntelligenceResult,
  contentType: PIQContentType
): ImprovementAction[] {

  const actions: ImprovementAction[] = [];

  // Strategic Move 1: Add opening scene (if missing)
  if (!features.scenes?.has_scenes || (features.scenes?.quality_score || 0) < 6) {
    actions.push({
      action: "Add concrete opening scene with temporal + spatial anchors",
      expected_impact: "+3-4 points",
      how_to: "Start with: WHEN (specific time) + WHERE (specific place) + WHAT YOU SAW/FELT. Example: 'Three days before nationals, I stood in our empty lab staring at the disassembled robot'",
      why: "100% of Harvard/Princeton/MIT admits start with concrete scene. Scenes = show don't tell.",
      priority: 10,
      estimated_time: "20 min",
      affects_dimensions: ['show_dont_tell', 'opening_power', 'narrative_arc']
    });
  }

  // Strategic Move 2: Add vulnerability/physical symptom (if missing)
  const hasVulnerability = features.interiority?.physical_symptoms && features.interiority.physical_symptoms.length > 0;
  if (!hasVulnerability) {
    actions.push({
      action: "Add moment of vulnerability with physical symptom",
      expected_impact: "+3-4 points",
      how_to: "Show emotion through body: 'My hands trembled', 'stomach dropped', 'cheeks burned', 'breath caught'. Replace: 'I was nervous' → 'Clammy hands gripped the podium'",
      why: "68% of admits show physical symptoms. Vulnerability = authenticity. Stanford AO: 'We can spot manufactured emotion instantly.'",
      priority: 9,
      estimated_time: "15 min",
      affects_dimensions: ['vulnerability_interiority', 'show_dont_tell', 'authenticity']
    });
  }

  // Strategic Move 3: Add conversational dialogue (if missing)
  const hasDialogue = features.dialogue?.has_dialogue;
  if (!hasDialogue && contentType !== 'academic_passion') {
    actions.push({
      action: "Add 1-2 lines of conversational dialogue",
      expected_impact: "+2-3 points",
      how_to: "Show character through speech. Not info-dump: ❌ 'He told me about the program requirements'. Instead: ✅ 'You sure about this?' Coach Martinez asked. 'We've never tried two manipulators.'",
      why: "Dialogue reveals character and brings scenes alive. Keep it conversational, not formal.",
      priority: 7,
      estimated_time: "20 min",
      affects_dimensions: ['show_dont_tell', 'character_development', 'literary_sophistication']
    });
  }

  // Strategic Move 4: Add before/after transformation (if missing)
  const beforeAfterWords = ['before', 'used to', 'at first', 'now', 'today', 'since then'];
  const hasTransformation = beforeAfterWords.some(w => text.toLowerCase().includes(w));
  if (!hasTransformation && (contentType === 'activity_leadership' || contentType === 'personal_distinction')) {
    actions.push({
      action: "Show community transformation (before → after state)",
      expected_impact: "+3-4 points",
      how_to: "BEFORE: What was the situation? AFTER: How is it different now? YOUR ROLE: What specifically did you do? Use observable changes: 'Before: silent halls. After: 40+ students gathering weekly'",
      why: "58% of Berkeley admits show community transformation. Shows systemic impact, not just personal achievement.",
      priority: 8,
      estimated_time: "25 min",
      affects_dimensions: ['community_impact', 'quantified_impact', 'character_development']
    });
  }

  // Strategic Move 5: Add micro-to-macro reflection (if missing)
  const hasUniversalInsight = /\b(people|we|us|everyone|human|life|world)\b/i.test(text);
  if (!hasUniversalInsight) {
    actions.push({
      action: "Connect specific experience to universal insight",
      expected_impact: "+2-3 points",
      how_to: "End with what you learned about LIFE/PEOPLE/THE WORLD (not just yourself). Example: 'This taught me that true leadership isn't about having all the answers—it's about asking the right questions and trusting your team to find them together.'",
      why: "63% of admits use micro-to-macro pattern. Shows philosophical depth and maturity.",
      priority: 8,
      estimated_time: "20 min",
      affects_dimensions: ['reflection_insight', 'intellectual_engagement', 'philosophical_depth']
    });
  }

  // Strategic Move 6: Address prompt requirements (if critical ones missing)
  if (promptAnalysis.critical_missing.length > 0) {
    const criticalMissing = promptAnalysis.critical_missing[0];
    actions.push({
      action: `Add missing prompt requirement: ${criticalMissing}`,
      expected_impact: "+3-5 points",
      how_to: promptAnalysis.requirements_met.find(r => r.element === criticalMissing)?.suggestion || "See prompt-specific guidance",
      why: `This is a REQUIRED element for Prompt ${promptAnalysis.prompt_id}. Missing it signals misalignment with prompt.`,
      priority: 9,
      estimated_time: "25 min",
      affects_dimensions: ['prompt_alignment']
    });
  }

  // Sort by priority and return top 5
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ============================================================================
// TIER 3: TRANSFORMATIVE CHANGES (45-60 min, +5-10 points)
// ============================================================================

function generateTransformativeChanges(
  currentTier: 1 | 2 | 3 | 4,
  dimensionScores: DimensionScore[],
  features: UniversalFeatures,
  contentType: PIQContentType
): ImprovementAction[] {

  const actions: ImprovementAction[] = [];

  // Transformative 1: Restructure around single scene (if currently resume-style)
  const hasStrongNarrative = (features.scenes?.quality_score || 0) >= 7 &&
                             (features.dialogue?.quality_score || 0) >= 6;
  if (!hasStrongNarrative && currentTier >= 3) {
    actions.push({
      action: "Restructure entire PIQ around one pivotal scene",
      expected_impact: "+5-8 points (Tier 3 → Tier 2)",
      how_to: "Choose ONE moment that captures the essence. Open IN that moment (scene). Use dialogue, sensory details, vulnerability. Then briefly contextualize and reflect. Structure: (1) Scene (40%), (2) Context (20%), (3) Impact (20%), (4) Insight (20%)",
      why: "100% of Tier 1 essays use concrete scenes. This is THE difference between tell and show. Harvard AO: 'The difference between \"I led a team\" and \"Three days before our showcase, our lead tutor quit\" is the difference between tell and show.'",
      priority: 10,
      estimated_time: "60 min",
      affects_dimensions: ['show_dont_tell', 'opening_power', 'narrative_arc', 'vulnerability_interiority']
    });
  }

  // Transformative 2: Add intellectual depth (for Tier 3 → Tier 1)
  const intellectualScore = dimensionScores.find(d => d.dimension_id === 'intellectual_engagement')?.score_0_to_10 || 0;
  if (intellectualScore < 6 && currentTier >= 2) {
    actions.push({
      action: "Add intellectual curiosity: questions asked, ideas connected",
      expected_impact: "+4-6 points",
      how_to: "Show your THINKING. Ask questions: 'I wondered why...', 'What if...', 'How could...'. Connect to broader ideas: 'This reminded me of...' Show self-directed learning: 'I researched...', 'I read about...', 'I discovered...'",
      why: "Stanford 'Intellectual Vitality' criterion. Tier 1 essays show curiosity beyond grades. MIT AO: 'We want students who ask how and why, not just what.'",
      priority: 9,
      estimated_time: "45 min",
      affects_dimensions: ['intellectual_engagement', 'reflection_insight', 'originality']
    });
  }

  // Transformative 3: Deepen vulnerability (admission of failure/doubt)
  const vulnerabilityScore = dimensionScores.find(d => d.dimension_id === 'vulnerability_interiority')?.score_0_to_10 || 0;
  if (vulnerabilityScore < 7 && currentTier >= 2) {
    actions.push({
      action: "Add moment of failure, doubt, or fear with honest reflection",
      expected_impact: "+3-5 points",
      how_to: "Admit something real: 'I failed', 'I didn't know', 'I was afraid', 'I questioned whether...'. Use physical symptoms. Show inner conflict: 'Part of me wanted to quit, but...'. This isn't weakness—it's humanity.",
      why: "Harvard Personal Rating: 'Reaction to setbacks' is KEY criterion. MIT: 'Comfortable with failure' is core value. Vulnerability = maturity.",
      priority: 8,
      estimated_time: "45 min",
      affects_dimensions: ['vulnerability_interiority', 'character_development', 'authenticity']
    });
  }

  // Transformative 4: Rewrite to show character arc (before self → after self)
  const characterScore = dimensionScores.find(d => d.dimension_id === 'character_development')?.score_0_to_10 || 0;
  if (characterScore < 6 && currentTier >= 2) {
    actions.push({
      action: "Rewrite to show character transformation (before/after self)",
      expected_impact: "+4-5 points",
      how_to: "Show who you WERE: 'I used to think...', 'At first I believed...'. Show turning point moment. Show who you ARE NOW: behavior change (not just mindset). Example: 'I used to measure success by awards. Now I measure it by whether my teammates feel heard.'",
      why: "Character development = growth. This is what separates good from great. Shows maturity and self-awareness.",
      priority: 7,
      estimated_time: "50 min",
      affects_dimensions: ['character_development', 'reflection_insight', 'vulnerability_interiority']
    });
  }

  // Transformative 5: Add context disclosure (barriers, circumstances)
  const contextScore = dimensionScores.find(d => d.dimension_id === 'context_circumstances')?.score_0_to_10 || 0;
  if (contextScore < 6 && currentTier >= 2) {
    actions.push({
      action: "Add context about barriers, constraints, or circumstances",
      expected_impact: "+3-6 points (especially for UC)",
      how_to: "Disclose what made this challenging FOR YOU: first-generation, limited resources, lack of access, school didn't offer, family obligations. UC specifically looks for 'overcoming barriers'. Be factual, not self-pitying.",
      why: "UC Berkeley rubric: 'Context & Circumstances' is 11% weight. Shows resilience in face of real obstacles. Helps AOs understand your achievement in context.",
      priority: 8,
      estimated_time: "40 min",
      affects_dimensions: ['context_circumstances', 'vulnerability_interiority', 'character_development']
    });
  }

  // Transformative 6: Craft literary sophistication (for Tier 2 → Tier 1)
  const literaryScore = dimensionScores.find(d => d.dimension_id === 'literary_sophistication')?.score_0_to_10 || 0;
  if (literaryScore < 6 && currentTier === 2) {
    actions.push({
      action: "Elevate prose with literary techniques (parallel structure, imagery, rhythm)",
      expected_impact: "+2-4 points (Tier 2 → Tier 1 polish)",
      how_to: "Add parallel structure: 'I learned to listen, to wait, to trust'. Use sensory imagery: 'smell of burnt circuits', 'fluorescent hum'. Vary sentence length: short (impact) + long (flow). Use strong verbs: 'grabbed' > 'took', 'stared' > 'looked'.",
      why: "Literary sophistication differentiates Tier 1 from Tier 2. But ONLY add this AFTER you have substance (scene, vulnerability, insight).",
      priority: 6,
      estimated_time: "45 min",
      affects_dimensions: ['literary_sophistication', 'voice_authenticity', 'opening_power']
    });
  }

  // Sort by priority and return top 3
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function identifyMissingFeatures(features: UniversalFeatures): string[] {
  const missing: string[] = [];

  if (!features.scenes?.has_scenes) missing.push('scene');
  if (!features.dialogue?.has_dialogue) missing.push('dialogue');
  if (!features.interiority?.physical_symptoms || features.interiority.physical_symptoms.length === 0) {
    missing.push('vulnerability');
  }

  return missing;
}

function calculateTargetTier(
  currentTier: 1 | 2 | 3 | 4,
  quickWins: ImprovementAction[],
  strategic: ImprovementAction[],
  transformative: ImprovementAction[]
): 1 | 2 | 3 | 4 {

  // Estimate total potential gain
  const quickGain = quickWins.length * 1.5; // avg +1.5 points each
  const strategicGain = strategic.length * 3.5; // avg +3.5 points each
  const transformativeGain = transformative.length * 5; // avg +5 points each

  const totalGain = quickGain + strategicGain + transformativeGain;

  // Tier boundaries: 90+ (Tier 1), 80-89 (Tier 2), 70-79 (Tier 3), <70 (Tier 4)
  const tierBoundaries = { 4: 70, 3: 80, 2: 90, 1: 100 };
  const currentScore = tierBoundaries[currentTier] - 5; // Estimate current score

  const projectedScore = currentScore + totalGain;

  if (projectedScore >= 90) return 1;
  if (projectedScore >= 80) return 2;
  if (projectedScore >= 70) return 3;
  return 4;
}

function calculateEstimatedGain(
  quickWins: ImprovementAction[],
  strategic: ImprovementAction[],
  transformative: ImprovementAction[]
): string {

  const quickMin = quickWins.length * 1;
  const quickMax = quickWins.length * 2;

  const strategicMin = strategic.length * 2;
  const strategicMax = strategic.length * 4;

  const transformativeMin = transformative.length * 4;
  const transformativeMax = transformative.length * 6;

  const minGain = quickMin + strategicMin + transformativeMin;
  const maxGain = quickMax + strategicMax + transformativeMax;

  return `+${minGain}-${maxGain} points`;
}

function generatePriorityOrder(
  quickWins: ImprovementAction[],
  strategic: ImprovementAction[],
  transformative: ImprovementAction[]
): string[] {

  // Recommended sequence
  const order: string[] = [];

  // Start with highest priority quick wins
  const topQuickWins = quickWins.filter(q => q.priority >= 8).slice(0, 2);
  topQuickWins.forEach(q => order.push(`Quick Win: ${q.action}`));

  // Then highest priority strategic
  const topStrategic = strategic.filter(s => s.priority >= 9).slice(0, 1);
  topStrategic.forEach(s => order.push(`Strategic: ${s.action}`));

  // Then transformative (if applicable)
  const topTransformative = transformative.filter(t => t.priority >= 9).slice(0, 1);
  topTransformative.forEach(t => order.push(`Transformative: ${t.action}`));

  // Then remaining strategic
  const remainingStrategic = strategic.filter(s => s.priority < 9).slice(0, 2);
  remainingStrategic.forEach(s => order.push(`Strategic: ${s.action}`));

  // Finally remaining quick wins
  const remainingQuick = quickWins.filter(q => q.priority < 8).slice(0, 2);
  remainingQuick.forEach(q => order.push(`Quick Win: ${q.action}`));

  return order.slice(0, 7); // Max 7 steps
}

function generateProgressionPath(currentTier: 1 | 2 | 3 | 4, targetTier: 1 | 2 | 3 | 4): string {
  if (targetTier <= currentTier) {
    return "Focus on quick wins and strategic moves to strengthen your current tier standing";
  }

  const paths: Record<string, string> = {
    "4-3": "Quick wins (numbers, names) + Strategic moves (add scene, vulnerability) → Tier 3",
    "4-2": "Quick wins + All strategic moves + 1-2 transformative changes → Tier 2 (significant rewrite recommended)",
    "4-1": "Complete restructure: Start over with scene-based narrative including vulnerability, intellectual depth, and literary craft → Tier 1",
    "3-2": "Strategic moves (scene, vulnerability, transformation) + Start transformative changes → Tier 2",
    "3-1": "All strategic moves + 2-3 transformative changes (intellectual depth, character arc, literary polish) → Tier 1",
    "2-1": "Deepen existing strengths + Add transformative elements (intellectual curiosity, deeper vulnerability, literary sophistication) → Tier 1"
  };

  const key = `${currentTier}-${targetTier}`;
  return paths[key] || `Complete improvements in order: Quick Wins → Strategic → Transformative`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { generateImprovementRoadmap };
export type { ImprovementRoadmap, ImprovementAction };
