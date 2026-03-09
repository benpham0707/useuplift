/**
 * Impressiveness Analyzer — Core Engine
 *
 * Deterministic analysis of activity impressiveness in context.
 * Takes extracted evidence + field + major → ImpressionAnalysisResult.
 *
 * Cost: $0.00 (pure TypeScript logic, no LLM calls)
 * Latency: <1ms per activity
 *
 * Workflow:
 * 1. Match activity to an impressiveness domain (via category/keywords)
 * 2. Walk the domain's 5-level ladder to find the best-matching level
 * 3. Detect technical depth markers in the description
 * 4. Look up major alignment (if intendedMajor provided)
 * 5. Compute tier boost suggestion (-1 to +1)
 * 6. Find relevant exemplars for teaching
 */

import type { ExtractedEvidence, TierClassification, InternalTier } from '../types';
import type {
  ImpressionLevel,
  ImpressionEntry,
  ImpressivenessDomain,
  TechnicalDepthMarker,
  DetectedMarker,
  ImpressionAnalysisResult,
  MajorAlignmentResult,
  ExemplarDescription,
} from './types';
import { alignmentToLegacyRelevance } from './types';

// Direct imports — no circular dependency (these modules don't import from analyzer)
import { getAlignmentForMajor as _getAlignmentForMajor } from './majorAlignmentMatrix';
import { getBestExemplarForTeaching as _getBestExemplar, getExemplarsForDomain as _getExemplarsForDomain } from './exemplarLibrary';

// Import domain data directly to avoid circular dependency with index.ts
import { STEM_RESEARCH_IMPRESSIVENESS } from './domains/stemResearch';
import { STEM_COMPETITIONS_IMPRESSIVENESS } from './domains/stemCompetitions';
import { CODING_ENGINEERING_IMPRESSIVENESS } from './domains/codingEngineering';
import { DEBATE_SPEECH_IMPRESSIVENESS } from './domains/debateSpeech';
import { PERFORMING_ARTS_IMPRESSIVENESS } from './domains/performingArts';
import { ATHLETICS_IMPRESSIVENESS } from './domains/athletics';
import { COMMUNITY_SERVICE_IMPRESSIVENESS } from './domains/communityService';
import { ENTREPRENEURSHIP_IMPRESSIVENESS } from './domains/entrepreneurship';
import { WORK_EMPLOYMENT_IMPRESSIVENESS } from './domains/workEmployment';
import { LEADERSHIP_GOVERNMENT_IMPRESSIVENESS } from './domains/leadershipGovernment';
import { MEDICAL_HEALTH_IMPRESSIVENESS } from './domains/medicalHealth';
import { ARTS_CREATIVE_IMPRESSIVENESS } from './domains/artsCreative';

/** Local domain registry — mirrors index.ts but avoids circular import */
const DOMAIN_REGISTRY: Map<string, ImpressivenessDomain> = new Map([
  ['stem_research', STEM_RESEARCH_IMPRESSIVENESS],
  ['stem_competition', STEM_COMPETITIONS_IMPRESSIVENESS],
  ['coding_engineering', CODING_ENGINEERING_IMPRESSIVENESS],
  ['debate_speech', DEBATE_SPEECH_IMPRESSIVENESS],
  ['performing_arts', PERFORMING_ARTS_IMPRESSIVENESS],
  ['athletics', ATHLETICS_IMPRESSIVENESS],
  ['community_service', COMMUNITY_SERVICE_IMPRESSIVENESS],
  ['entrepreneurship', ENTREPRENEURSHIP_IMPRESSIVENESS],
  ['work_employment', WORK_EMPLOYMENT_IMPRESSIVENESS],
  ['leadership_government', LEADERSHIP_GOVERNMENT_IMPRESSIVENESS],
  ['medical_health', MEDICAL_HEALTH_IMPRESSIVENESS],
  ['arts_creative', ARTS_CREATIVE_IMPRESSIVENESS],
]);

// ============================================================================
// DOMAIN RESOLUTION
// ============================================================================

/** Word-boundary match to avoid substring false positives (e.g., "mun" matching "community") */
function wordMatch(text: string, keyword: string): boolean {
  if (keyword.includes(' ')) {
    // Multi-word keywords use simple includes (already safe)
    return text.includes(keyword);
  }
  return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

/**
 * Domain aliases for resolving activity categories to domain IDs.
 * Maps detected category strings to impressiveness domain IDs.
 */
const DOMAIN_ALIASES: Record<string, string> = {
  // Direct matches
  'stem_research': 'stem_research',
  'stem_competition': 'stem_competition',
  'coding_engineering': 'coding_engineering',
  'debate_speech': 'debate_speech',
  'performing_arts': 'performing_arts',
  'athletics': 'athletics',
  'community_service': 'community_service',
  'entrepreneurship': 'entrepreneurship',
  'work_employment': 'work_employment',
  'leadership_government': 'leadership_government',
  'medical_health': 'medical_health',
  'arts_creative': 'arts_creative',

  // Aliases from achievementIntelligence.ts categories
  'research': 'stem_research',
  'competition': 'stem_competition',
  'coding': 'coding_engineering',
  'engineering': 'coding_engineering',
  'robotics': 'coding_engineering',
  'debate': 'debate_speech',
  'speech': 'debate_speech',
  'model_un': 'debate_speech',
  'mock_trial': 'debate_speech',
  'music': 'performing_arts',
  'theater': 'performing_arts',
  'dance': 'performing_arts',
  'film': 'performing_arts',
  'sports': 'athletics',
  'volunteer': 'community_service',
  'tutoring': 'community_service',
  'nonprofit': 'community_service',
  'work': 'work_employment',
  'employment': 'work_employment',
  'internship': 'work_employment',
  'startup': 'entrepreneurship',
  'business': 'entrepreneurship',
  'government': 'leadership_government',
  'student_government': 'leadership_government',
  'art': 'arts_creative',
  'visual_arts': 'arts_creative',
  'writing': 'arts_creative',
  'creative_writing': 'arts_creative',
  'medical': 'medical_health',
  'health': 'medical_health',
  'clinical': 'medical_health',
  'pre-med': 'medical_health',
  'premed': 'medical_health',
  'hospital': 'medical_health',
};

/**
 * Resolve an activity to its impressiveness domain.
 * Uses category match, title keywords, and type hints.
 */
function resolveDomain(
  evidence: ExtractedEvidence,
  activityMeta: { title: string; type?: string; description?: string; role?: string },
): ImpressivenessDomain | null {
  const registry = DOMAIN_REGISTRY;

  // 1. Direct category match from evidence
  const categoryKey = evidence.categoryMatch.category;
  const directAlias = DOMAIN_ALIASES[categoryKey];
  if (directAlias && registry.has(directAlias)) {
    return registry.get(directAlias)!;
  }

  // 2. Try activity type
  if (activityMeta.type) {
    const typeAlias = DOMAIN_ALIASES[activityMeta.type.toLowerCase()];
    if (typeAlias && registry.has(typeAlias)) {
      return registry.get(typeAlias)!;
    }
  }

  // 3. Keyword matching against title + description
  const searchText = [
    activityMeta.title,
    activityMeta.role ?? '',
    activityMeta.description ?? '',
  ].join(' ').toLowerCase();

  // Check for medical/health keywords first (specific before general)
  const medicalKeywords = ['hospital', 'clinical', 'patient', 'medical', 'health', 'emt', 'pre-med', 'premed', 'shadowing', 'nursing'];
  if (medicalKeywords.some(k => wordMatch(searchText, k))) {
    return registry.get('medical_health') ?? null;
  }

  // Keyword-based domain detection
  const keywordMap: Array<[string, string[]]> = [
    ['stem_research', ['research', 'lab', 'publication', 'paper', 'journal', 'thesis', 'experiment']],
    ['stem_competition', ['olympiad', 'amc', 'aime', 'usamo', 'usaco', 'usabo', 'usapho', 'science olympiad', 'mathcounts']],
    ['coding_engineering', ['app', 'software', 'website', 'code', 'programming', 'hackathon', 'robotics', 'github']],
    ['debate_speech', ['debate', 'speech', 'forensics', 'model un', 'mock trial']],
    ['performing_arts', ['orchestra', 'band', 'choir', 'theater', 'dance', 'music', 'performance', 'recital']],
    ['athletics', ['varsity', 'jv', 'team captain', 'sport', 'track', 'swim', 'basketball', 'football', 'soccer', 'tennis', 'recruit']],
    ['community_service', ['volunteer', 'community', 'service', 'nonprofit', 'charity', 'tutor']],
    ['entrepreneurship', ['startup', 'business', 'revenue', 'customers', 'founded company', 'e-commerce']],
    ['work_employment', ['job', 'employed', 'paid', 'work', 'shift', 'manager']],
    ['leadership_government', ['student government', 'student council', 'class president', 'student body', 'leadership', 'club president', 'officer']],
    ['arts_creative', ['art', 'gallery', 'portfolio', 'painting', 'sculpture', 'creative writing', 'literary magazine', 'scholastic']],
  ];

  for (const [domainId, keywords] of keywordMap) {
    if (keywords.some(k => wordMatch(searchText, k))) {
      return registry.get(domainId) ?? null;
    }
  }

  return null;
}

// ============================================================================
// LEVEL DETERMINATION
// ============================================================================

/**
 * Map from internal tier to the most likely impression level.
 */
const TIER_TO_LEVEL: Record<InternalTier, ImpressionLevel> = {
  1: 'extraordinary',
  2: 'exceptional',
  3: 'impressive',
  4: 'notable',
  5: 'baseline',
  6: 'baseline',
};

/**
 * Determine the impressiveness level for an activity.
 * Uses tier classification as primary signal, with markers for refinement.
 */
function determineLevel(
  tier: TierClassification,
  detectedMarkers: DetectedMarker[],
  domain: ImpressivenessDomain,
): { level: ImpressionLevel; entry: ImpressionEntry } {
  // Start with tier-based level
  let level = TIER_TO_LEVEL[tier.internalTier] ?? 'baseline';

  // Refine based on detected technical depth markers
  // If we detect markers that indicate a higher level, consider bumping up
  const markerLevels = detectedMarkers
    .filter(m => m.matchStrength >= 0.5)
    .map(m => m.marker.indicatesLevel);

  if (markerLevels.length > 0) {
    // Count how many markers suggest each level
    const levelCounts: Partial<Record<ImpressionLevel, number>> = {};
    for (const ml of markerLevels) {
      levelCounts[ml] = (levelCounts[ml] ?? 0) + 1;
    }

    // If multiple markers suggest a higher level than tier-based, consider it
    const levelOrder: ImpressionLevel[] = ['baseline', 'notable', 'impressive', 'exceptional', 'extraordinary'];
    const currentIndex = levelOrder.indexOf(level);

    for (const [candidateLevel, count] of Object.entries(levelCounts) as Array<[ImpressionLevel, number]>) {
      const candidateIndex = levelOrder.indexOf(candidateLevel);
      // Only bump UP by at most 1 level, and only if 2+ markers agree
      if (candidateIndex === currentIndex + 1 && count >= 2) {
        level = candidateLevel;
        break;
      }
    }
  }

  // Find the matching ladder entry
  const entry = domain.ladder.find(e => e.level === level)
    ?? domain.ladder[0]; // Fallback to first entry (should never happen)

  return { level, entry };
}

// ============================================================================
// MARKER DETECTION
// ============================================================================

/**
 * Detect technical depth markers in the activity description.
 */
function detectMarkers(
  description: string,
  domain: ImpressivenessDomain,
): DetectedMarker[] {
  const descLower = description.toLowerCase();
  const detected: DetectedMarker[] = [];

  for (const marker of domain.technicalDepthMarkers) {
    const matchedKeywords: string[] = [];

    for (const keyword of marker.detectionKeywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // Compute match strength based on keyword coverage
      const coverage = matchedKeywords.length / marker.detectionKeywords.length;
      const confidenceBoost = marker.detectionConfidence === 'high' ? 0.3
        : marker.detectionConfidence === 'medium' ? 0.15
        : 0;
      const matchStrength = Math.min(1, coverage + confidenceBoost);

      detected.push({
        marker,
        matchedKeywords,
        matchStrength,
      });
    }
  }

  // Sort by match strength descending
  detected.sort((a, b) => b.matchStrength - a.matchStrength);

  return detected;
}

// ============================================================================
// TIER BOOST CALCULATION
// ============================================================================

/**
 * Calculate a tier boost suggestion based on impressiveness context.
 * Range: -1 to +1 (suggestion only — downstream code decides whether to apply).
 *
 * Positive boost: markers suggest activity is more impressive than tier indicates
 * Negative boost: markers suggest activity is less impressive (e.g., name-dropping)
 */
function calculateTierBoost(
  tier: TierClassification,
  level: ImpressionLevel,
  detectedMarkers: DetectedMarker[],
  majorAlignment: MajorAlignmentResult | null,
): number {
  let boost = 0;

  // Marker-based boost: strong markers at a higher level than current tier
  const levelOrder: ImpressionLevel[] = ['baseline', 'notable', 'impressive', 'exceptional', 'extraordinary'];
  const tierLevel = TIER_TO_LEVEL[tier.internalTier];
  const tierLevelIndex = levelOrder.indexOf(tierLevel);
  const actualLevelIndex = levelOrder.indexOf(level);

  if (actualLevelIndex > tierLevelIndex) {
    boost += 0.3; // Markers suggest higher than tier
  } else if (actualLevelIndex < tierLevelIndex) {
    boost -= 0.3; // Markers suggest lower than tier
  }

  // Strong technical depth markers add a small boost
  const strongMarkers = detectedMarkers.filter(m => m.matchStrength >= 0.7);
  if (strongMarkers.length >= 3) {
    boost += 0.2;
  } else if (strongMarkers.length >= 1) {
    boost += 0.1;
  }

  // Major alignment boost
  if (majorAlignment) {
    if (majorAlignment.alignment === 'critical') {
      boost += 0.3;
    } else if (majorAlignment.alignment === 'strong') {
      boost += 0.15;
    }
    // No boost for moderate/complementary/unrelated
  }

  // Clamp to [-1, 1]
  return Math.max(-1, Math.min(1, Math.round(boost * 10) / 10));
}

// ============================================================================
// TIER-LEVEL EXPLANATION DATA (for legacy field generation)
// ============================================================================

interface TierLevelContext {
  percentileRange: string;
  levelTemplate: string;
  schoolContext: string;
}

const TIER_LEVEL_DATA: Record<InternalTier, TierLevelContext> = {
  1: {
    percentileRange: 'top 1-2%',
    levelTemplate: 'among the most distinguished activities nationally — only {percentile} of applicants at highly selective schools present achievements at this level',
    schoolContext: 'This is a standout activity even at the most selective schools (Harvard, MIT, Stanford)',
  },
  2: {
    percentileRange: 'top 5-10%',
    levelTemplate: 'nationally recognized achievement — approximately {percentile} of applicants at selective schools present activities at this level',
    schoolContext: 'This would be a strong spike activity at any selective school',
  },
  3: {
    percentileRange: 'top 15-25%',
    levelTemplate: 'state/regional distinction — {percentile} of applicants at selective schools have activities at this level',
    schoolContext: 'Strong at most selective schools; expected at the most competitive',
  },
  4: {
    percentileRange: 'top 30-50%',
    levelTemplate: 'meaningful school-level impact — {percentile} of applicants at selective schools have activities at this level',
    schoolContext: 'Solid supporting activity; would need depth/progression to stand out',
  },
  5: {
    percentileRange: 'top 50-70%',
    levelTemplate: 'consistent participation — {percentile} of applicants show this level of involvement',
    schoolContext: 'Common at all school types; value comes from sustained commitment',
  },
  6: {
    percentileRange: 'bottom 30%',
    levelTemplate: 'developing involvement — {percentile} characterization; minimal demonstrated impact',
    schoolContext: 'Unlikely to contribute positively to applications at selective schools',
  },
};

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze the impressiveness of an activity in context.
 *
 * Deterministic, <1ms, $0 LLM cost.
 *
 * Signature matches the orchestrator call site (5 params):
 * analyzeImpressiveness(evidence, tier, expertiseResult, intendedMajor, description)
 *
 * @param evidence - Extracted evidence from feature extraction
 * @param tier - Tier classification from tier classifier
 * @param expertiseResult - Optional expertise signal result (used for domain hint)
 * @param intendedMajor - Optional intended major for alignment analysis
 * @param description - Raw activity description text
 * @returns ImpressionAnalysisResult with both new rich fields and legacy compat fields
 */
export function analyzeImpressiveness(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  expertiseResult: { domainId?: string } | undefined,
  intendedMajor: string | undefined,
  description: string,
): ImpressionAnalysisResult {
  // Reconstruct activityMeta from evidence + description for internal use
  const activityMeta = {
    title: evidence.role?.title ?? '',
    type: evidence.categoryMatch?.category,
    description,
    role: evidence.role?.title,
  };

  // If expertiseResult has a domainId, try it as a DOMAIN_ALIASES hint
  if (expertiseResult?.domainId) {
    const hintAlias = DOMAIN_ALIASES[expertiseResult.domainId];
    if (hintAlias && !evidence.categoryMatch?.category) {
      activityMeta.type = expertiseResult.domainId;
    }
  }

  // Step 1: Resolve domain
  const domain = resolveDomain(evidence, activityMeta);

  // Get tier level data for legacy fields
  const tierData = TIER_LEVEL_DATA[tier.internalTier] ?? TIER_LEVEL_DATA[5];

  if (!domain) {
    // No matching domain — return minimal result
    const baseLevel = TIER_TO_LEVEL[tier.internalTier] ?? 'baseline';
    return {
      level: baseLevel,
      impressionContext: {
        level: baseLevel,
        description: 'Activity does not match a known impressiveness domain',
        whyImpressive: 'Unable to assess field-specific impressiveness without domain match',
        prevalence: 'Unknown',
        applicantPercentile: 'Unknown',
        verificationMarkers: [],
        differentiatorFromBelow: 'N/A',
        differentiatorFromAbove: 'N/A',
        tierRange: [tier.internalTier],
      },
      detectedMarkers: [],
      majorAlignment: null,
      tierBoost: 0,
      exemplars: [],
      confidence: 'low',
      // Legacy fields
      percentileRange: tierData.percentileRange,
      levelExplanation: `This activity is ${tierData.percentileRange} — ${tierData.levelTemplate.replace('{percentile}', tierData.percentileRange)}.`,
      promptSummary: `Tier ${tier.internalTier} (${tierData.percentileRange} among selective school applicants).`,
      technicalDepthMarkers: [],
    };
  }

  // Step 2: Detect technical depth markers
  const detectedMarkers = detectMarkers(description, domain);

  // Step 3: Determine impressiveness level
  const { level, entry } = determineLevel(tier, detectedMarkers, domain);

  // Step 4: Major alignment (if intendedMajor provided)
  let majorAlignment: MajorAlignmentResult | null = null;
  if (intendedMajor) {
    try {
      const alignmentEntry = _getAlignmentForMajor(domain.domainId, intendedMajor);
      if (alignmentEntry) {
        majorAlignment = {
          alignment: alignmentEntry.alignment,
          relevance: mapAlignmentToRelevance(alignmentEntry.alignment),
          rationale: alignmentEntry.rationale,
          boostFactor: alignmentEntry.boostFactor,
          resolvedMajor: alignmentEntry.majorCategory,
          strongSubActivities: alignmentEntry.strongSubActivities,
        };
      }
    } catch {
      // Major alignment lookup failed — non-fatal
    }
  }

  // Step 5: Calculate tier boost
  const tierBoost = calculateTierBoost(tier, level, detectedMarkers, majorAlignment);

  // Step 6: Find relevant exemplars
  let exemplars: ExemplarDescription[] = [];
  try {
    exemplars = _getExemplarsForDomain(domain.domainId, level).slice(0, 3);
  } catch {
    // Exemplar lookup failed — non-fatal
  }

  // Step 7: Determine confidence
  const confidence: 'high' | 'medium' | 'low' =
    evidence.categoryMatch.confidence === 'high' && detectedMarkers.length >= 2 ? 'high' :
    evidence.categoryMatch.confidence !== 'low' || detectedMarkers.length >= 1 ? 'medium' :
    'low';

  // Step 8: Build legacy compat fields
  const flatMarkers = detectedMarkers.map(m => ({
    marker: m.marker.term,
    significance: m.marker.meaning,
    rarity: m.marker.hsContext,
  }));

  const promptParts: string[] = [
    `Tier ${tier.internalTier} (${tierData.percentileRange} among selective school applicants)`,
  ];
  if (intendedMajor && majorAlignment && majorAlignment.relevance !== 'unrelated') {
    promptParts.push(
      `${capitalize(majorAlignment.relevance ?? majorAlignment.alignment)} for ${intendedMajor} — boost ${majorAlignment.boostFactor.toFixed(1)} (${majorAlignment.rationale})`
    );
  }
  const rareMarkers = flatMarkers.filter(m => m.rarity.includes('rare') || m.rarity.includes('Rare'));
  if (rareMarkers.length > 0) {
    promptParts.push(`Depth markers: ${rareMarkers.map(m => `${m.marker} (${m.significance})`).join('; ')}`);
  }

  return {
    level,
    impressionContext: entry,
    detectedMarkers,
    majorAlignment,
    tierBoost,
    exemplars,
    confidence,
    // Legacy fields
    percentileRange: tierData.percentileRange,
    levelExplanation: `This activity is ${tierData.percentileRange} — ${tierData.levelTemplate.replace('{percentile}', tierData.percentileRange)}.`,
    promptSummary: promptParts.join('. ') + '.',
    technicalDepthMarkers: flatMarkers,
  };
}

/**
 * Map AlignmentStrength to the relevance string expected by legacy consumers.
 */
function mapAlignmentToRelevance(
  alignment: import('./types').AlignmentStrength
): 'critical' | 'core' | 'supporting' | 'complementary' | 'unrelated' {
  switch (alignment) {
    case 'critical': return 'critical';
    case 'strong': return 'core';
    case 'moderate': return 'supporting';
    case 'complementary': return 'complementary';
    case 'unrelated': return 'unrelated';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Batch analyze impressiveness for multiple activities.
 * All deterministic, <5ms for 10 activities.
 */
export function analyzeImpressivenessBatch(
  activities: Array<{
    evidence: ExtractedEvidence;
    tier: TierClassification;
    expertiseResult?: { domainId?: string };
    description: string;
  }>,
  intendedMajor?: string,
): ImpressionAnalysisResult[] {
  return activities.map(a =>
    analyzeImpressiveness(a.evidence, a.tier, a.expertiseResult, intendedMajor, a.description)
  );
}
