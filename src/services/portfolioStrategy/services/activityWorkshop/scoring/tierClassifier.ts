/**
 * Tier Classifier — Deterministic Activity Tier Classification
 *
 * Phase 2 of the decomposed scoring architecture.
 * Maps extracted evidence to a 6-tier internal classification using explicit,
 * testable rules. No LLM involved.
 *
 * The tier determines the non-overlapping score range for Phase 3.
 * A Tier 4 activity scores 4.0-5.4, never 5.5+. This is the structural
 * guarantee that makes miscalibration impossible.
 *
 * Classification is based on:
 * 1. Evidence signals (scope, recognitions, role, impact, commitment)
 * 2. Benchmark matching from comparisonBenchmarksLibrary
 * 3. Explicit rules per tier with clear thresholds
 *
 * Cost: $0.00 (pure TypeScript logic)
 * Latency: <1ms
 */

import {
  ExtractedEvidence,
  TierClassification,
  TierSignal,
  InternalTier,
  TIER_SCORE_RANGES,
  TIER_COMPONENT_CONSTRAINTS,
  TIER_ASSESSMENT_SCORES,
  INTERNAL_TO_EXTERNAL_TIER,
  INTERNAL_TIER_NAMES,
} from './types';
import { BENCHMARKS_BY_CATEGORY, type BenchmarkEntry } from './comparisonBenchmarksLibrary';
import { findRecognitionsInText } from './knowledge/recognitionIndex';

// ============================================================================
// TIER CLASSIFICATION RULES
// ============================================================================

/**
 * Evaluate all Tier 1 (Pinnacle) signals.
 *
 * TIER 1 — PINNACLE: International/National Elite (<0.1%)
 * Requires AT LEAST 1 high-confidence verifiable international/national recognition
 * OR AT LEAST 2 of the defined signals.
 */
function evaluateTier1Signals(evidence: ExtractedEvidence): TierSignal[] {
  const signals: TierSignal[] = [];

  // [T1-A] Recognition at international/national level, highly selective (<0.5% acceptance)
  const hasEliteRecognition = evidence.recognitions.some(
    r => (r.level === 'international' || r.level === 'national') &&
         r.isVerifiable &&
         r.selectivityContext != null
  );
  signals.push({
    rule: 'T1_A_ELITE_RECOGNITION',
    matched: hasEliteRecognition,
    evidence: hasEliteRecognition
      ? `Verifiable ${evidence.recognitions.find(r => (r.level === 'international' || r.level === 'national') && r.isVerifiable)?.name} with selectivity context`
      : 'No verifiable international/national recognition with selectivity context',
    weight: 1.0,
  });

  // [T1-B] Impact with verifiable national/international scope (1000+ people, media coverage)
  const hasNationalImpact = (
    (evidence.scope.level === 'national' || evidence.scope.level === 'international') &&
    evidence.scope.confidence >= 0.7 &&
    evidence.impact.hasQuantifiedOutcomes &&
    (evidence.impact.estimatedPeopleReached ?? 0) >= 1000
  );
  signals.push({
    rule: 'T1_B_NATIONAL_IMPACT',
    matched: hasNationalImpact,
    evidence: hasNationalImpact
      ? `${evidence.scope.level} scope with ${evidence.impact.estimatedPeopleReached}+ people reached`
      : `Scope: ${evidence.scope.level} (confidence: ${evidence.scope.confidence}), people: ${evidence.impact.estimatedPeopleReached ?? 'unknown'}`,
    weight: 0.9,
  });

  // [T1-C] Professional-level accomplishment (published in top venue, patent, recruited)
  // Uses curated multi-word patterns to avoid false positives from substring matching.
  // "Professional Development Workshop" won't match — "professional orchestra" will.
  const hasProfessionalLevel = evidence.recognitions.some(
    r => r.isVerifiable && matchesProfessionalPattern(r.name)
  ) || (
    evidence.role.type === 'founder' &&
    (evidence.impact.estimatedPeopleReached ?? 0) >= 500 &&
    evidence.impact.hasQuantifiedOutcomes
  );
  signals.push({
    rule: 'T1_C_PROFESSIONAL_LEVEL',
    matched: hasProfessionalLevel,
    evidence: hasProfessionalLevel
      ? 'Professional-level accomplishment detected'
      : 'No professional-level indicators',
    weight: 0.8,
  });

  // [T1-D] Matches known Tier 1 benchmark from benchmarks library
  const benchmarkMatch = matchesBenchmarkTier(evidence, 1);
  signals.push({
    rule: 'T1_D_BENCHMARK_MATCH',
    matched: benchmarkMatch.matched,
    evidence: benchmarkMatch.matched
      ? `Matches benchmark: ${benchmarkMatch.benchmarkName}`
      : 'No Tier 1 benchmark match',
    weight: 0.9,
  });

  // [T1-E] KB recognition index match — O(1) lookup for known Tier 1 awards
  const kbRecognitions = findKBRecognitionsFromEvidence(evidence);
  const hasTier1KBMatch = kbRecognitions.some(r => r.entry.tier === 1 && r.confidence !== 'low');
  const tier1KBMatch = kbRecognitions.find(r => r.entry.tier === 1 && r.confidence !== 'low');
  signals.push({
    rule: 'T1_E_KB_RECOGNITION',
    matched: hasTier1KBMatch,
    evidence: hasTier1KBMatch
      ? `KB recognition: ${tier1KBMatch!.entry.name} (${tier1KBMatch!.confidence} confidence, ${tier1KBMatch!.entry.scope} scope)`
      : 'No Tier 1 KB recognition match',
    weight: 1.0,
  });

  return signals;
}

/**
 * Evaluate all Tier 2 (National) signals.
 *
 * TIER 2 — NATIONAL: National-Level Distinction (Top 1-2%)
 * Requires AT LEAST 2 of the defined signals.
 */
function evaluateTier2Signals(evidence: ExtractedEvidence): TierSignal[] {
  const signals: TierSignal[] = [];

  // [T2-A] National recognition (verifiable, top 2%)
  const hasNationalRecognition = evidence.recognitions.some(
    r => (r.level === 'national' || r.level === 'international') && r.isVerifiable
  );
  signals.push({
    rule: 'T2_A_NATIONAL_RECOGNITION',
    matched: hasNationalRecognition,
    evidence: hasNationalRecognition
      ? `Verifiable national recognition: ${evidence.recognitions.find(r => (r.level === 'national' || r.level === 'international') && r.isVerifiable)?.name}`
      : 'No verifiable national-level recognition',
    weight: 0.9,
  });

  // [T2-B] State-level recognition + additional national-adjacent signals
  const hasStateRecognition = evidence.recognitions.some(
    r => r.level === 'state' && r.isVerifiable
  );
  const hasAdditionalSignals = (
    evidence.commitment.yearsActive >= 2 ||
    evidence.impact.hasQuantifiedOutcomes ||
    ['founder', 'president_captain', 'executive'].includes(evidence.role.type)
  );
  const hasStatePlus = hasStateRecognition && hasAdditionalSignals;
  signals.push({
    rule: 'T2_B_STATE_PLUS',
    matched: hasStatePlus,
    evidence: hasStatePlus
      ? `State recognition (${evidence.recognitions.find(r => r.level === 'state' && r.isVerifiable)?.name}) plus additional signals`
      : hasStateRecognition ? 'State recognition without additional strengthening signals' : 'No state-level recognition',
    weight: 0.8,
  });

  // [T2-C] Impact reaching 500+ people with verifiable quantified outcomes
  const hasSignificantImpact = (
    evidence.impact.hasQuantifiedOutcomes &&
    (evidence.impact.estimatedPeopleReached ?? 0) >= 500 &&
    evidence.impact.metrics.some(m => m.isVerifiable)
  );
  signals.push({
    rule: 'T2_C_SIGNIFICANT_IMPACT',
    matched: hasSignificantImpact,
    evidence: hasSignificantImpact
      ? `Verifiable impact reaching ${evidence.impact.estimatedPeopleReached}+ people`
      : `People reached: ${evidence.impact.estimatedPeopleReached ?? 'unknown'}, quantified: ${evidence.impact.hasQuantifiedOutcomes}`,
    weight: 0.7,
  });

  // [T2-D] Multi-year executive role + state/national scope
  const hasExecutiveScope = (
    ['founder', 'president_captain', 'executive'].includes(evidence.role.type) &&
    evidence.commitment.yearsActive >= 2 &&
    ['state', 'national', 'international'].includes(evidence.scope.level)
  );
  signals.push({
    rule: 'T2_D_EXECUTIVE_SCOPE',
    matched: hasExecutiveScope,
    evidence: hasExecutiveScope
      ? `${evidence.role.type} for ${evidence.commitment.yearsActive} years at ${evidence.scope.level} scope`
      : `Role: ${evidence.role.type}, years: ${evidence.commitment.yearsActive}, scope: ${evidence.scope.level}`,
    weight: 0.8,
  });

  // [T2-E] Matches known Tier 2 benchmark
  const benchmarkMatch = matchesBenchmarkTier(evidence, 2);
  signals.push({
    rule: 'T2_E_BENCHMARK_MATCH',
    matched: benchmarkMatch.matched,
    evidence: benchmarkMatch.matched
      ? `Matches benchmark: ${benchmarkMatch.benchmarkName}`
      : 'No Tier 2 benchmark match',
    weight: 0.8,
  });

  // [T2-F2] KB recognition index match — O(1) lookup for known Tier 2 awards
  const kbRecognitions = findKBRecognitionsFromEvidence(evidence);
  const hasTier2KBMatch = kbRecognitions.some(r => r.entry.tier <= 2 && r.confidence !== 'low');
  const tier2KBMatch = kbRecognitions.find(r => r.entry.tier <= 2 && r.confidence !== 'low');
  signals.push({
    rule: 'T2_F2_KB_RECOGNITION',
    matched: hasTier2KBMatch,
    evidence: hasTier2KBMatch
      ? `KB recognition: ${tier2KBMatch!.entry.name} (tier ${tier2KBMatch!.entry.tier}, ${tier2KBMatch!.confidence} confidence)`
      : 'No Tier 1-2 KB recognition match',
    weight: 0.9,
  });

  // [T2-F] Published research: national recognition + verifiable quantified outcomes
  // Research activities have contributors (not executives), so T2-D won't fire.
  // This signal recognizes that published research with measurable outcomes is T2-worthy
  // even when the student's role is "contributor" or "research assistant."
  const hasPublishedResearch = (
    hasNationalRecognition &&
    evidence.impact.hasQuantifiedOutcomes &&
    evidence.impact.tangibleOutcomes.length > 0 &&
    evidence.commitment.yearsActive >= 1 &&
    (evidence.categoryMatch.category === 'stem_research' ||
     evidence.categoryMatch.category === 'medical_health' ||
     evidence.overallSignalStrength === 'strong')
  );
  signals.push({
    rule: 'T2_F_PUBLISHED_RESEARCH',
    matched: hasPublishedResearch,
    evidence: hasPublishedResearch
      ? `Published research with national recognition and quantified outcomes (${evidence.impact.tangibleOutcomes.length} outcomes)`
      : `Recognition: ${hasNationalRecognition}, quantified: ${evidence.impact.hasQuantifiedOutcomes}, outcomes: ${evidence.impact.tangibleOutcomes.length}`,
    weight: 0.85,
  });

  return signals;
}

/**
 * Evaluate all Tier 3 (State/Regional) signals.
 *
 * TIER 3 — STATE/REGIONAL: State/Regional Impact (Top 5-10%)
 * Requires AT LEAST 2 of the defined signals.
 */
function evaluateTier3Signals(evidence: ExtractedEvidence): TierSignal[] {
  const signals: TierSignal[] = [];

  // [T3-A] State or regional recognition (verifiable awards/selection)
  // National/international also qualifies — they subsume state/regional
  const hasStateOrRegional = evidence.recognitions.some(
    r => ['state', 'regional', 'national', 'international'].includes(r.level) && r.isVerifiable
  );
  signals.push({
    rule: 'T3_A_STATE_REGIONAL_RECOGNITION',
    matched: hasStateOrRegional,
    evidence: hasStateOrRegional
      ? `Verifiable ${evidence.recognitions.find(r => (r.level === 'state' || r.level === 'regional') && r.isVerifiable)?.level} recognition`
      : 'No verifiable state/regional recognition',
    weight: 0.8,
  });

  // [T3-B] Founder/executive role with 100+ people served
  const hasFounderScale = (
    ['founder', 'president_captain', 'executive'].includes(evidence.role.type) &&
    (evidence.impact.estimatedPeopleReached ?? 0) >= 100
  );
  signals.push({
    rule: 'T3_B_FOUNDER_SCALE',
    matched: hasFounderScale,
    evidence: hasFounderScale
      ? `${evidence.role.type} serving ${evidence.impact.estimatedPeopleReached}+ people`
      : `Role: ${evidence.role.type}, people: ${evidence.impact.estimatedPeopleReached ?? 'unknown'}`,
    weight: 0.7,
  });

  // [T3-C] State/regional scope with medium+ confidence
  const hasStateScope = (
    ['state', 'regional'].includes(evidence.scope.level) &&
    evidence.scope.confidence >= 0.5
  );
  signals.push({
    rule: 'T3_C_STATE_SCOPE',
    matched: hasStateScope,
    evidence: hasStateScope
      ? `${evidence.scope.level} scope (confidence: ${evidence.scope.confidence})`
      : `Scope: ${evidence.scope.level} (confidence: ${evidence.scope.confidence})`,
    weight: 0.6,
  });

  // [T3-D] Multi-year commitment (2+) with executive role + clear outcomes
  const hasExecCommitment = (
    evidence.commitment.yearsActive >= 2 &&
    ['founder', 'president_captain', 'executive', 'team_lead'].includes(evidence.role.type) &&
    evidence.impact.tangibleOutcomes.length > 0
  );
  signals.push({
    rule: 'T3_D_EXEC_COMMITMENT',
    matched: hasExecCommitment,
    evidence: hasExecCommitment
      ? `${evidence.role.type} for ${evidence.commitment.yearsActive} years with ${evidence.impact.tangibleOutcomes.length} outcomes`
      : `Role: ${evidence.role.type}, years: ${evidence.commitment.yearsActive}, outcomes: ${evidence.impact.tangibleOutcomes.length}`,
    weight: 0.7,
  });

  // [T3-E] Matches known state/regional benchmark
  const benchmarkMatch = matchesBenchmarkTier(evidence, 3);
  signals.push({
    rule: 'T3_E_BENCHMARK_MATCH',
    matched: benchmarkMatch.matched,
    evidence: benchmarkMatch.matched
      ? `Matches benchmark: ${benchmarkMatch.benchmarkName}`
      : 'No Tier 3 benchmark match',
    weight: 0.7,
  });

  return signals;
}

/**
 * Evaluate all Tier 4 (School Leader) signals.
 *
 * TIER 4 — SCHOOL LEADER: Strong School-Level (Top 15-25%)
 * Requires AT LEAST 2 of the defined signals.
 */
function evaluateTier4Signals(evidence: ExtractedEvidence): TierSignal[] {
  const signals: TierSignal[] = [];

  // [T4-A] Executive/leadership role (president, captain, team_lead)
  const hasLeadershipRole = ['founder', 'president_captain', 'executive', 'team_lead'].includes(evidence.role.type);
  signals.push({
    rule: 'T4_A_LEADERSHIP_ROLE',
    matched: hasLeadershipRole,
    evidence: hasLeadershipRole
      ? `Leadership role: ${evidence.role.type}`
      : `Non-leadership role: ${evidence.role.type}`,
    weight: 0.7,
  });

  // [T4-B] Multi-year commitment (2+ years) with progression
  const hasMultiYearProgression = (
    evidence.commitment.yearsActive >= 2 &&
    evidence.commitment.showsProgression
  );
  signals.push({
    rule: 'T4_B_MULTIYEAR_PROGRESSION',
    matched: hasMultiYearProgression,
    evidence: hasMultiYearProgression
      ? `${evidence.commitment.yearsActive} years with progression${evidence.commitment.progressionArc ? `: ${evidence.commitment.progressionArc}` : ''}`
      : `Years: ${evidence.commitment.yearsActive}, progression: ${evidence.commitment.showsProgression}`,
    weight: 0.7,
  });

  // [T4-C] School-level recognition or awards
  // Higher levels also qualify — any recognition counts at school level
  const hasSchoolRecognition = evidence.recognitions.some(
    r => ['school', 'local', 'regional', 'state', 'national', 'international'].includes(r.level)
  );
  signals.push({
    rule: 'T4_C_SCHOOL_RECOGNITION',
    matched: hasSchoolRecognition,
    evidence: hasSchoolRecognition
      ? `School/local recognition: ${evidence.recognitions.find(r => r.level === 'school' || r.level === 'local')?.name}`
      : 'No school/local recognition',
    weight: 0.5,
  });

  // [T4-D] Quantified impact (specific numbers, verifiable outcomes)
  const hasQuantifiedImpact = (
    evidence.impact.hasQuantifiedOutcomes &&
    evidence.impact.metrics.length > 0
  );
  signals.push({
    rule: 'T4_D_QUANTIFIED_IMPACT',
    matched: hasQuantifiedImpact,
    evidence: hasQuantifiedImpact
      ? `${evidence.impact.metrics.length} quantified metrics`
      : 'No quantified impact',
    weight: 0.6,
  });

  // [T4-E] Genuine community benefit beyond self
  const hasCommunityBenefit = (
    evidence.character.communityBenefit === 'significant' ||
    evidence.character.communityBenefit === 'moderate'
  );
  signals.push({
    rule: 'T4_E_COMMUNITY_BENEFIT',
    matched: hasCommunityBenefit,
    evidence: hasCommunityBenefit
      ? `Community benefit: ${evidence.character.communityBenefit}`
      : `Community benefit: ${evidence.character.communityBenefit}`,
    weight: 0.5,
  });

  return signals;
}

/**
 * Evaluate all Tier 5 (Active Participant) signals.
 *
 * TIER 5 — ACTIVE PARTICIPANT: Committed Participation (Top 30-50%)
 * Requires AT LEAST 1 of the defined signals.
 */
function evaluateTier5Signals(evidence: ExtractedEvidence): TierSignal[] {
  const signals: TierSignal[] = [];

  // [T5-A] 1+ year regular participation
  const hasYearParticipation = evidence.commitment.yearsActive >= 1;
  signals.push({
    rule: 'T5_A_YEAR_PARTICIPATION',
    matched: hasYearParticipation,
    evidence: hasYearParticipation
      ? `${evidence.commitment.yearsActive} year(s) of participation`
      : `Less than 1 year: ${evidence.commitment.yearsActive}`,
    weight: 0.6,
  });

  // [T5-B] Any formal role beyond passive member
  const hasFormalRole = evidence.role.type !== 'member' && evidence.role.type !== 'participant';
  signals.push({
    rule: 'T5_B_FORMAL_ROLE',
    matched: hasFormalRole,
    evidence: hasFormalRole
      ? `Formal role: ${evidence.role.type}`
      : `Passive role: ${evidence.role.type}`,
    weight: 0.5,
  });

  // [T5-C] Shows some commitment arc or contribution
  const hasCommitmentArc = (
    evidence.commitment.showsProgression ||
    evidence.impact.tangibleOutcomes.length > 0
  );
  signals.push({
    rule: 'T5_C_COMMITMENT_ARC',
    matched: hasCommitmentArc,
    evidence: hasCommitmentArc
      ? `Progression: ${evidence.commitment.showsProgression}, outcomes: ${evidence.impact.tangibleOutcomes.length}`
      : 'No progression or tangible outcomes',
    weight: 0.5,
  });

  // [T5-D] School-level involvement with attendance/hours
  const hasSchoolInvolvement = (
    evidence.commitment.hoursPerWeek > 0 &&
    evidence.commitment.weeksPerYear > 0
  );
  signals.push({
    rule: 'T5_D_SCHOOL_INVOLVEMENT',
    matched: hasSchoolInvolvement,
    evidence: hasSchoolInvolvement
      ? `${evidence.commitment.hoursPerWeek} hrs/wk × ${evidence.commitment.weeksPerYear} wks/yr`
      : 'No hours/weeks reported',
    weight: 0.4,
  });

  return signals;
}

// ============================================================================
// BENCHMARK MATCHING
// ============================================================================

/**
 * Check if extracted evidence matches a known benchmark at the specified tier.
 *
 * The existing 4-tier benchmarks map to internal 6 tiers:
 * - Benchmark tier 1 → internal tier 1 or 2 (based on selectivity context)
 * - Benchmark tier 2 → internal tier 3
 * - Benchmark tier 3 → internal tier 4 or 5
 * - Benchmark tier 4 → internal tier 5 or 6
 *
 * For classification purposes, we check if the activity's evidence matches
 * benchmark keywords in the appropriate category and tier.
 */
export function matchesBenchmarkTier(
  evidence: ExtractedEvidence,
  internalTier: InternalTier
): { matched: boolean; benchmarkName: string } {
  const category = evidence.categoryMatch.category;
  const catData = BENCHMARKS_BY_CATEGORY[category];
  if (!catData || evidence.categoryMatch.confidence === 'low') {
    return { matched: false, benchmarkName: '' };
  }

  // Map internal tier to benchmark tiers to check
  const benchmarkTiers = mapInternalTierToBenchmarkTiers(internalTier);

  for (const benchTier of benchmarkTiers) {
    const benchmarks = catData.tiers[benchTier as 1 | 2 | 3 | 4];
    if (!benchmarks) continue;

    for (const benchmark of benchmarks) {
      if (matchesSpecificBenchmark(evidence, benchmark)) {
        return { matched: true, benchmarkName: benchmark.activity };
      }
    }
  }

  return { matched: false, benchmarkName: '' };
}

/**
 * Map an internal 6-tier to the benchmark library's 4-tier structure.
 * Returns which benchmark tiers to check for a given internal tier.
 */
function mapInternalTierToBenchmarkTiers(internalTier: InternalTier): number[] {
  switch (internalTier) {
    case 1: return [1];     // Pinnacle: only check benchmark tier 1
    case 2: return [1, 2];  // National: check benchmark tiers 1-2 (top of tier 2 can be internal tier 2)
    case 3: return [2];     // State/Regional: check benchmark tier 2
    case 4: return [3];     // School Leader: check benchmark tier 3
    case 5: return [3, 4];  // Active Participant: check benchmark tiers 3-4
    case 6: return [4];     // Developing: check benchmark tier 4
    default: return [];
  }
}

/**
 * Check if evidence matches a specific benchmark entry.
 * Uses keyword matching on recognitions, role, and scope.
 */
/**
 * Scope-level keywords that differentiate benchmark tiers.
 * If a benchmark contains one of these, the evidence must also contain it
 * to prevent "School Math team" from matching "State Math team captain".
 */
const SCOPE_DIFFERENTIATOR_KEYWORDS = [
  'international', 'national', 'state', 'regional',
  'champion', 'finalist', 'winner', 'qualifier',
] as const;

function matchesSpecificBenchmark(evidence: ExtractedEvidence, benchmark: BenchmarkEntry): boolean {
  const benchmarkLower = benchmark.activity.toLowerCase();

  // Check if any recognition name matches the benchmark
  for (const rec of evidence.recognitions) {
    if (matchesBenchmarkText(rec.name.toLowerCase(), benchmarkLower)) {
      return true;
    }
  }

  // Check if evidence role/title matches the benchmark
  const roleLower = evidence.role.title.toLowerCase();
  if (roleLower.length > 3) {
    if (matchesBenchmarkText(roleLower, benchmarkLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if candidate text matches a benchmark activity name.
 * Requires 50%+ keyword overlap AND matching scope-differentiator keywords.
 * This prevents "School Math team" from matching "State Math team captain".
 */
function matchesBenchmarkText(candidateLower: string, benchmarkLower: string): boolean {
  const benchmarkWords = benchmarkLower.split(/\s+/).filter(w => w.length > 2);
  if (benchmarkWords.length === 0) return false;

  const matchingWords = benchmarkWords.filter(w => candidateLower.includes(w));

  // Require at least 2 matching words AND 50%+ overlap
  if (matchingWords.length < Math.max(2, Math.ceil(benchmarkWords.length * 0.5))) {
    return false;
  }

  // If benchmark contains a scope-differentiator keyword, candidate must too
  for (const keyword of SCOPE_DIFFERENTIATOR_KEYWORDS) {
    if (benchmarkLower.includes(keyword) && !candidateLower.includes(keyword)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify an activity's tier based on extracted evidence.
 *
 * Evaluates signals for each tier from top to bottom (Tier 1 first).
 * Assigns the HIGHEST tier where sufficient signals match.
 *
 * Tier 1: needs 1 elite signal OR 2+ signals
 * Tier 2: needs 2+ signals
 * Tier 3: needs 2+ signals
 * Tier 4: needs 2+ signals
 * Tier 5: needs 1+ signal
 * Tier 6: default (no signals needed)
 */
export function classifyTier(evidence: ExtractedEvidence): TierClassification {
  // Evaluate all signals for each tier
  const tier1Signals = evaluateTier1Signals(evidence);
  const tier2Signals = evaluateTier2Signals(evidence);
  const tier3Signals = evaluateTier3Signals(evidence);
  const tier4Signals = evaluateTier4Signals(evidence);
  const tier5Signals = evaluateTier5Signals(evidence);

  const tier1Matched = tier1Signals.filter(s => s.matched);
  const tier2Matched = tier2Signals.filter(s => s.matched);
  const tier3Matched = tier3Signals.filter(s => s.matched);
  const tier4Matched = tier4Signals.filter(s => s.matched);
  const tier5Matched = tier5Signals.filter(s => s.matched);

  // Determine tier from top to bottom
  let internalTier: InternalTier;
  let confidence: 'high' | 'medium' | 'low';
  let allSignals: TierSignal[];
  let reasoning: string;

  // Tier 1: 1 high-confidence elite recognition OR 2+ signals
  const hasEliteRecognition = tier1Signals[0]?.matched === true; // T1_A is the elite recognition signal
  if (hasEliteRecognition || tier1Matched.length >= 2) {
    internalTier = 1;
    allSignals = tier1Signals;
    confidence = tier1Matched.length >= 3 ? 'high' : (hasEliteRecognition ? 'high' : 'medium');
    reasoning = `Tier 1 (Pinnacle): ${tier1Matched.map(s => s.rule).join(', ')} — ${tier1Matched.length} signal(s) matched`;
  }
  // Tier 2: 2+ signals
  else if (tier2Matched.length >= 2) {
    internalTier = 2;
    allSignals = tier2Signals;
    confidence = tier2Matched.length >= 3 ? 'high' : 'medium';
    reasoning = `Tier 2 (National): ${tier2Matched.map(s => s.rule).join(', ')} — ${tier2Matched.length} signals matched`;
  }
  // Tier 3: 2+ signals
  else if (tier3Matched.length >= 2) {
    internalTier = 3;
    allSignals = tier3Signals;
    confidence = tier3Matched.length >= 3 ? 'high' : 'medium';
    reasoning = `Tier 3 (State/Regional): ${tier3Matched.map(s => s.rule).join(', ')} — ${tier3Matched.length} signals matched`;
  }
  // Tier 4: 2+ signals
  else if (tier4Matched.length >= 2) {
    internalTier = 4;
    allSignals = tier4Signals;
    confidence = tier4Matched.length >= 3 ? 'high' : 'medium';
    reasoning = `Tier 4 (School Leader): ${tier4Matched.map(s => s.rule).join(', ')} — ${tier4Matched.length} signals matched`;
  }
  // Tier 5: 1+ signal
  else if (tier5Matched.length >= 1) {
    internalTier = 5;
    allSignals = tier5Signals;
    confidence = tier5Matched.length >= 2 ? 'medium' : 'low';
    reasoning = `Tier 5 (Active Participant): ${tier5Matched.map(s => s.rule).join(', ')} — ${tier5Matched.length} signal(s) matched`;
  }
  // Tier 6: default
  else {
    internalTier = 6;
    allSignals = tier5Signals; // Show tier 5 signals to explain what DIDN'T match
    confidence = 'low';
    reasoning = 'Tier 6 (Developing): No sufficient signals for higher tiers';
  }

  // Handle borderline cases: if signals span two adjacent tiers,
  // assign the LOWER tier with medium confidence
  const borderlineResult = checkBorderline(
    internalTier, confidence,
    tier1Matched.length, tier2Matched.length, tier3Matched.length,
    tier4Matched.length, tier5Matched.length
  );
  if (borderlineResult) {
    internalTier = borderlineResult.tier;
    confidence = borderlineResult.confidence;
    reasoning += ` [Borderline: ${borderlineResult.reason}]`;
  }

  // Adjust confidence for weak signal strength
  if (evidence.overallSignalStrength === 'weak' && confidence !== 'low') {
    confidence = 'low';
    reasoning += ' [Low signal strength — sparse description]';
  }

  // Compute tier score from signal count
  const matchedCount = allSignals.filter(s => s.matched).length;
  const tierScores = TIER_ASSESSMENT_SCORES[internalTier];
  const tierScore = matchedCount >= 3 ? tierScores.strong : tierScores.base;

  // Build classification result
  const scoreRange = TIER_SCORE_RANGES[internalTier];
  const componentConstraints = TIER_COMPONENT_CONSTRAINTS[internalTier];

  // Widen component ranges slightly for low-confidence classifications
  const adjustedConstraints = confidence === 'low'
    ? widenConstraints(componentConstraints, internalTier)
    : { ...componentConstraints };

  return {
    internalTier,
    externalTier: INTERNAL_TO_EXTERNAL_TIER[internalTier],
    confidence,
    signals: allSignals,
    scoreRange: { ...scoreRange },
    componentConstraints: adjustedConstraints,
    tierScore,
    reasoning,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Curated multi-word patterns for professional-level accomplishments.
 * Each pattern is specific enough to avoid false positives:
 * - "published in" catches journals/conferences, not "student-published magazine"
 * - "co-authored paper" catches research collaboration, not vague mentions
 * - "patent filed" / "patent pending" catch real IP, not "Patent Club"
 * - "recruited to" / "recruited by" catch athlete/talent recruitment
 * - "professional orchestra" etc. catch professional-tier performing arts
 *
 * Sourced from comparisonBenchmarksLibrary Tier 1 entries.
 */
const PROFESSIONAL_LEVEL_PATTERNS = [
  'published in peer-reviewed',
  'published in journal',
  'published in conference',
  'published research',
  'co-authored paper',
  'co-authored research',
  'named co-author',
  'first author',
  'patent filed',
  'patent pending',
  'patent granted',
  'recruited to play',
  'recruited by',
  'recruited athlete',
  'd1 recruited',
  'd1 commit',
  'professional orchestra',
  'professional theater',
  'professional theatre',
  'professional ensemble',
  'peer-reviewed publication',
  'peer reviewed publication',
  'peer-reviewed journal',
  'peer reviewed journal',
] as const;

/**
 * Find KB recognition entries from extracted evidence.
 * Searches recognition names, role title, and description text against the KB recognition index.
 * Results are cached per classifyTier call to avoid redundant lookups.
 */
function findKBRecognitionsFromEvidence(evidence: ExtractedEvidence): import('./knowledge/types').RecognitionLookupResult[] {
  // Build searchable text from evidence
  const searchParts: string[] = [];
  for (const rec of evidence.recognitions) {
    searchParts.push(rec.name);
  }
  searchParts.push(evidence.role.title);
  const searchText = searchParts.join(' ');

  return findRecognitionsInText(searchText);
}

/**
 * Check if a recognition name matches a professional-level pattern.
 * Uses multi-word phrase matching to avoid false positives from single-keyword substring matching.
 */
function matchesProfessionalPattern(recognitionName: string): boolean {
  const nameLower = recognitionName.toLowerCase();
  return PROFESSIONAL_LEVEL_PATTERNS.some(pattern => nameLower.includes(pattern));
}

/**
 * Check for borderline cases where signals span two adjacent tiers.
 * If borderline, assign the LOWER tier with medium confidence.
 */
function checkBorderline(
  currentTier: InternalTier,
  currentConfidence: 'high' | 'medium' | 'low',
  t1Count: number, t2Count: number, t3Count: number,
  t4Count: number, t5Count: number
): { tier: InternalTier; confidence: 'high' | 'medium' | 'low'; reason: string } | null {
  // Only check borderline if we're already at medium or have exactly the threshold count
  if (currentConfidence === 'high') return null;

  // Tier 1 with exactly 2 signals and 1+ strong Tier 2 signals → stay Tier 1 but medium
  // (already handled above)

  // Tier 2 with exactly 2 signals and 2+ Tier 3 signals → borderline, assign Tier 2 (higher stays)
  // No adjustment needed — we already assign the highest qualifying tier

  // Tier 3 with exactly 2 signals and 2+ Tier 4 signals → could be borderline
  if (currentTier === 3 && t3Count === 2 && t4Count >= 3) {
    // Strong Tier 4 evidence but barely Tier 3 — still Tier 3 but note it
    return { tier: 3, confidence: 'medium', reason: 'Barely Tier 3 with strong Tier 4 signals' };
  }

  // Tier 4 with exactly 2 signals and 2+ Tier 5 signals → borderline
  if (currentTier === 4 && t4Count === 2 && t5Count >= 3) {
    return { tier: 4, confidence: 'medium', reason: 'Barely Tier 4 with strong Tier 5 signals' };
  }

  return null;
}

/**
 * Widen component constraints slightly for low-confidence classifications.
 * Allows Phase 3 scoring more room when the tier assignment is uncertain.
 */
function widenConstraints(
  constraints: typeof TIER_COMPONENT_CONSTRAINTS[InternalTier],
  tier: InternalTier
): TierClassification['componentConstraints'] {
  const widen = (range: { min: number; max: number }): { min: number; max: number } => ({
    min: Math.max(1, range.min - 1),
    max: Math.min(10, range.max + 1),
  });

  return {
    recognition: widen(constraints.recognition),
    leadership: widen(constraints.leadership),
    community: widen(constraints.community),
    commitment: widen(constraints.commitment),
  };
}

/**
 * Get the human-readable name for an internal tier.
 */
export function getInternalTierName(tier: InternalTier): string {
  return INTERNAL_TIER_NAMES[tier];
}

/**
 * Get the score range for an internal tier.
 */
export function getTierScoreRange(tier: InternalTier): { min: number; max: number } {
  return { ...TIER_SCORE_RANGES[tier] };
}

/**
 * Get component constraints for an internal tier.
 */
export function getTierComponentConstraints(tier: InternalTier): TierClassification['componentConstraints'] {
  return { ...TIER_COMPONENT_CONSTRAINTS[tier] };
}

/**
 * Map an internal tier to its external equivalent.
 */
export function toExternalTier(tier: InternalTier): 1 | 2 | 3 | 4 {
  return INTERNAL_TO_EXTERNAL_TIER[tier];
}

/**
 * Clamp a score to the valid range for a given tier.
 */
export function clampToTierRange(score: number, tier: InternalTier): number {
  const range = TIER_SCORE_RANGES[tier];
  return Math.max(range.min, Math.min(range.max, score));
}

/**
 * Clamp a component score to its tier-appropriate range.
 */
export function clampComponentScore(
  score: number,
  component: 'recognition' | 'leadership' | 'community' | 'commitment',
  tier: InternalTier
): number {
  const range = TIER_COMPONENT_CONSTRAINTS[tier][component];
  return Math.max(range.min, Math.min(range.max, score));
}

// Export the service as a singleton for consistency with codebase patterns
export class TierClassifierService {
  classifyTier(evidence: ExtractedEvidence): TierClassification {
    return classifyTier(evidence);
  }

  matchesBenchmarkTier(evidence: ExtractedEvidence, internalTier: InternalTier): { matched: boolean; benchmarkName: string } {
    return matchesBenchmarkTier(evidence, internalTier);
  }

  clampToTierRange(score: number, tier: InternalTier): number {
    return clampToTierRange(score, tier);
  }

  clampComponentScore(
    score: number,
    component: 'recognition' | 'leadership' | 'community' | 'commitment',
    tier: InternalTier
  ): number {
    return clampComponentScore(score, component, tier);
  }
}

export const tierClassifierService = new TierClassifierService();
