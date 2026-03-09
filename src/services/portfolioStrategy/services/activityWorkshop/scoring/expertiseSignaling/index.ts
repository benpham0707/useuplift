/**
 * Expertise Signaling Library — Public API
 *
 * Static, pre-built knowledge base for field-specific expertise patterns.
 * Provides deterministic matching of activity descriptions against expertise
 * signals, name-drop traps, and proof-of-work patterns across 14 domains.
 *
 * Cost: $0.00 (pure data + TypeScript logic, no LLM calls)
 * Latency: <1ms per activity lookup, <5ms for batch matching
 *
 * Integration points:
 * 1. Feature Extractor — enriches extraction with expertise context
 * 2. Description Rule Scorer — adjusts authenticity/differentiation scores
 * 3. Nuance Calibration — provides field-specific calibration data
 * 4. Expert System Prompts — injects field-specific teaching guidance
 * 5. Teaching Layer — references expertise patterns in transformations
 */

// Re-export types
export type {
  ExpertiseDomain,
  ExpertiseSignal,
  NameDropTrap,
  ProofOfWorkPattern,
  DescriptionTransform,
  VerbTier,
  RoleExpertise,
  AOExpectations,
  JargonException,
  ExpertiseMatchResult,
  ExpertiseTeachingContext,
  ImpressionAnalysisResult,
  MajorAlignmentEntry,
  TechnicalDepthMarker,
  DomainMajorAlignment,
  Exemplar,
} from './types';

// Re-export matching functions
export {
  matchExpertiseSignals,
  buildExpertiseTeachingContext,
  batchMatchExpertiseSignals,
} from './signalMatcher';

// Re-export impressiveness analyzer
export { analyzeImpressiveness } from './impressivenessAnalyzer';

// Re-export major alignment matrix
export { getMajorAlignment, getMajorRelevanceCategory, MAJOR_ALIGNMENT_MATRIX } from './majorAlignmentMatrix';

// Re-export exemplar library
export { getExemplarsForDomain, getClosestExemplar, formatExemplarForPrompt, EXEMPLAR_LIBRARY } from './exemplarLibrary';

// Import domain definitions
import { STEM_RESEARCH_DOMAIN } from './domains/stemResearch';
import { STEM_COMPETITIONS_DOMAIN } from './domains/stemCompetitions';
import { CODING_ENGINEERING_DOMAIN } from './domains/codingEngineering';
import { DEBATE_SPEECH_DOMAIN } from './domains/debateSpeech';
import { PERFORMING_ARTS_DOMAIN } from './domains/performingArts';
import { ATHLETICS_DOMAIN } from './domains/athletics';
import { COMMUNITY_SERVICE_DOMAIN } from './domains/communityService';
import { ENTREPRENEURSHIP_DOMAIN } from './domains/entrepreneurship';
import { WORK_EMPLOYMENT_DOMAIN } from './domains/workEmployment';
import { LEADERSHIP_GOVERNMENT_DOMAIN } from './domains/leadershipGovernment';
import { ACADEMIC_DOMAIN } from './domains/academic';
import { FAMILY_RESPONSIBILITY_DOMAIN } from './domains/familyResponsibility';
import { MEDICAL_HEALTH_DOMAIN } from './domains/medicalHealth';
import { ARTS_CREATIVE_DOMAIN } from './domains/artsCreative';
import { WRITING_JOURNALISM_DOMAIN } from './domains/writingJournalism';
import { VISUAL_ARTS_DOMAIN } from './domains/visualArts';

import type { ExpertiseDomain } from './types';

// ============================================================================
// DOMAIN REGISTRY
// ============================================================================

/**
 * All expertise domains indexed by their domain ID.
 *
 * Primary entries match `detectedActivityType` from featureTypes.ts (10 types).
 * Sub-domain entries provide more specific expertise for fields that share
 * a detected type but have distinct expertise patterns (e.g., debate vs
 * general leadership, performing arts vs general arts, entrepreneurship
 * vs coding/engineering).
 */
export const EXPERTISE_DOMAINS: Map<string, ExpertiseDomain> = new Map([
  // Primary domains (match detectedActivityType from feature extractor)
  ['stem_research', STEM_RESEARCH_DOMAIN],
  ['stem_competition', STEM_COMPETITIONS_DOMAIN],
  ['coding_engineering', CODING_ENGINEERING_DOMAIN],
  ['leadership_government', LEADERSHIP_GOVERNMENT_DOMAIN],
  ['community_service', COMMUNITY_SERVICE_DOMAIN],
  ['work_employment', WORK_EMPLOYMENT_DOMAIN],
  ['family_responsibility', FAMILY_RESPONSIBILITY_DOMAIN],
  ['arts_creative', ARTS_CREATIVE_DOMAIN],
  ['medical_health', MEDICAL_HEALTH_DOMAIN],
  ['athletics', ATHLETICS_DOMAIN],
  ['academic', ACADEMIC_DOMAIN],

  // New dedicated domains (C3: writing_journalism and visual_arts get their own expertise)
  ['writing_journalism', WRITING_JOURNALISM_DOMAIN],
  ['visual_arts', VISUAL_ARTS_DOMAIN],

  // Sub-domains (more specific expertise for shared activity types)
  ['debate_speech', DEBATE_SPEECH_DOMAIN],
  ['performing_arts', PERFORMING_ARTS_DOMAIN],
  ['entrepreneurship', ENTREPRENEURSHIP_DOMAIN],
  ['stem_competitions', STEM_COMPETITIONS_DOMAIN],
]);

/**
 * Additional mappings for alternative domain names used in the codebase.
 * Maps variant names to the canonical domain ID.
 */
const DOMAIN_ALIASES: Record<string, string> = {
  'research': 'stem_research',
  'competition': 'stem_competition',
  'coding': 'coding_engineering',
  'engineering': 'coding_engineering',
  'robotics': 'coding_engineering',
  'debate': 'debate_speech',
  'speech': 'debate_speech',
  'model_un': 'debate_speech',
  'mock_trial': 'debate_speech',
  'music': 'arts_creative',
  'theater': 'arts_creative',
  'dance': 'arts_creative',
  'film': 'arts_creative',
  'art': 'arts_creative',
  'sports': 'athletics',
  'volunteer': 'community_service',
  'tutoring': 'community_service',
  'community_service_tutoring': 'community_service',
  'nonprofit': 'community_service',
  'work': 'work_employment',
  'employment': 'work_employment',
  'internship': 'work_employment',
  'job': 'work_employment',
  'work_family_responsibility': 'work_employment',
  'startup': 'entrepreneurship',
  'business': 'entrepreneurship',
  'government': 'leadership_government',
  'student_government': 'leadership_government',
  'family': 'family_responsibility',
  'caretaking': 'family_responsibility',
  'honor_society': 'academic',
  'club': 'academic',
  'other': 'academic', // Fallback to academic for unclassified

  // Medical/health aliases
  'medical': 'medical_health',
  'health': 'medical_health',
  'hospital': 'medical_health',
  'clinical': 'medical_health',
  'nursing': 'medical_health',
  'emt': 'medical_health',
  'pre_med': 'medical_health',
  'shadowing': 'medical_health',
  'public_health': 'medical_health',

  // Arts/creative aliases (visual arts, writing — NOT performing arts)
  'visual_art': 'arts_creative',
  'creative_writing': 'arts_creative',
  'photography': 'arts_creative',
  'painting': 'arts_creative',
  'sculpture': 'arts_creative',
  'literary_magazine': 'arts_creative',
  'graphic_design': 'arts_creative',
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get the expertise domain for a given activity type.
 * Handles canonical IDs, aliases, and fuzzy matching.
 *
 * @param activityType - The detected activity type from feature extraction
 * @returns The matching ExpertiseDomain or undefined
 */
export function getExpertiseDomain(activityType: string): ExpertiseDomain | undefined {
  // Direct lookup
  const direct = EXPERTISE_DOMAINS.get(activityType);
  if (direct) return direct;

  // Alias lookup
  const alias = DOMAIN_ALIASES[activityType];
  if (alias) return EXPERTISE_DOMAINS.get(alias);

  // Fuzzy match: check if any domain's keywords match
  const typeLower = activityType.toLowerCase();
  for (const [, domain] of EXPERTISE_DOMAINS) {
    if (domain.domainId.includes(typeLower) || typeLower.includes(domain.domainId)) {
      return domain;
    }
  }

  return undefined;
}

/**
 * Get the expertise domain, resolving through the debate/speech sub-domains.
 * Debate and speech have their own domain file but map to leadership_government
 * as the activity type. This function provides more specific matching.
 *
 * @param activityType - The detected activity type
 * @param keywords - Additional keywords for sub-domain resolution
 * @returns The best-matching ExpertiseDomain
 */
export function getExpertiseDomainWithSubResolution(
  activityType: string,
  keywords: string[] = [],
): ExpertiseDomain | undefined {
  // Check if keywords suggest debate/speech (which has its own domain file)
  const debateKeywords = ['debate', 'speech', 'forensics', 'model un', 'mock trial', 'mun', 'congressional'];
  const performingArtsKeywords = ['music', 'theater', 'dance', 'film', 'orchestra', 'band', 'choir', 'drama', 'acting'];
  const entrepreneurshipKeywords = ['startup', 'business', 'revenue', 'customers', 'founded company', 'e-commerce', 'freelance'];
  const medicalHealthKeywords = ['hospital', 'clinical', 'medical', 'emt', 'nursing', 'patient', 'shadowing', 'pre-med', 'premed', 'health clinic', 'public health', 'epidem'];
  const artsCreativeKeywords = ['painting', 'sculpture', 'photography', 'creative writing', 'literary magazine', 'visual art', 'graphic design', 'portfolio', 'illustration', 'ceramics', 'scholastic art'];

  const keywordsLower = keywords.map(k => k.toLowerCase());
  const allKeywords = [...keywordsLower, activityType.toLowerCase()];

  // Check sub-domain keywords — use specialized domains when available
  if (allKeywords.some(k => debateKeywords.some(dk => k.includes(dk)))) {
    return EXPERTISE_DOMAINS.get('debate_speech') ?? EXPERTISE_DOMAINS.get('leadership_government');
  }

  if (allKeywords.some(k => performingArtsKeywords.some(pk => k.includes(pk)))) {
    return EXPERTISE_DOMAINS.get('performing_arts') ?? EXPERTISE_DOMAINS.get('arts_creative');
  }

  if (allKeywords.some(k => medicalHealthKeywords.some(mk => k.includes(mk)))) {
    return EXPERTISE_DOMAINS.get('medical_health');
  }

  if (allKeywords.some(k => artsCreativeKeywords.some(ak => k.includes(ak)))) {
    return EXPERTISE_DOMAINS.get('arts_creative');
  }

  if (allKeywords.some(k => entrepreneurshipKeywords.some(ek => k.includes(ek)))) {
    return EXPERTISE_DOMAINS.get('entrepreneurship') ?? EXPERTISE_DOMAINS.get('coding_engineering');
  }

  return getExpertiseDomain(activityType);
}

/**
 * Get all available expertise domains.
 * Useful for building UI selectors or documentation.
 */
export function getAllDomains(): ExpertiseDomain[] {
  return Array.from(EXPERTISE_DOMAINS.values());
}

/**
 * Get domain labels for display.
 */
export function getDomainLabels(): Array<{ id: string; label: string }> {
  return Array.from(EXPERTISE_DOMAINS.entries()).map(([id, domain]) => ({
    id,
    label: domain.label,
  }));
}

// ============================================================================
// AGGREGATE STATISTICS
// ============================================================================

/**
 * Get aggregate statistics about the expertise signaling library.
 * Useful for logging and diagnostics.
 */
export function getLibraryStats(): {
  totalDomains: number;
  totalSignals: number;
  totalTraps: number;
  totalProofs: number;
  totalTransforms: number;
  totalRoles: number;
  totalExceptions: number;
  perDomain: Array<{
    domainId: string;
    label: string;
    signals: number;
    traps: number;
    proofs: number;
    transforms: number;
  }>;
} {
  let totalSignals = 0;
  let totalTraps = 0;
  let totalProofs = 0;
  let totalTransforms = 0;
  let totalRoles = 0;
  let totalExceptions = 0;
  const perDomain: Array<{
    domainId: string;
    label: string;
    signals: number;
    traps: number;
    proofs: number;
    transforms: number;
  }> = [];

  // M6: Deduplicate by domainId — EXPERTISE_DOMAINS can have multiple keys pointing to the same domain
  const seen = new Set<string>();
  for (const [, domain] of EXPERTISE_DOMAINS) {
    if (seen.has(domain.domainId)) continue;
    seen.add(domain.domainId);

    const signals = domain.realExpertiseSignals.length;
    const traps = domain.nameDropTraps.length;
    const proofs = domain.proofOfWorkPatterns.length;
    const transforms = domain.descriptionTransforms.length;

    totalSignals += signals;
    totalTraps += traps;
    totalProofs += proofs;
    totalTransforms += transforms;
    totalRoles += domain.roleExpertise.length;
    totalExceptions += domain.jargonExceptions.length;

    perDomain.push({
      domainId: domain.domainId,
      label: domain.label,
      signals,
      traps,
      proofs,
      transforms,
    });
  }

  return {
    totalDomains: seen.size,
    totalSignals,
    totalTraps,
    totalProofs,
    totalTransforms,
    totalRoles,
    totalExceptions,
    perDomain,
  };
}

// ============================================================================
// CROSS-DOMAIN UTILITIES
// ============================================================================

/**
 * Get the top name-drop traps across ALL domains (most common patterns).
 * Useful for global teaching prompts.
 */
export function getTopNameDropTraps(limit = 10): Array<{
  domainId: string;
  domainLabel: string;
  trap: import('./types').NameDropTrap;
}> {
  const allTraps: Array<{
    domainId: string;
    domainLabel: string;
    trap: import('./types').NameDropTrap;
  }> = [];

  for (const [, domain] of EXPERTISE_DOMAINS) {
    for (const trap of domain.nameDropTraps) {
      allTraps.push({
        domainId: domain.domainId,
        domainLabel: domain.label,
        trap,
      });
    }
  }

  // Sort by prevalence (very_common first, then common)
  allTraps.sort((a, b) => {
    const order = { very_common: 0, common: 1, occasional: 2 };
    return order[a.trap.prevalence] - order[b.trap.prevalence];
  });

  return allTraps.slice(0, limit);
}

/**
 * Get power verbs across all domains (union of all power-tier verbs).
 * Useful for verb scoring in the description rule scorer.
 */
export function getAllPowerVerbs(): Set<string> {
  const verbs = new Set<string>();

  for (const [, domain] of EXPERTISE_DOMAINS) {
    const powerTier = domain.verbHierarchy.find(vh => vh.tier === 'power');
    if (powerTier) {
      for (const verb of powerTier.verbs) {
        verbs.add(verb.toLowerCase());
      }
    }
  }

  return verbs;
}

/**
 * Get weak verbs across all domains (union of all weak-tier verbs).
 * Useful for verb scoring in the description rule scorer.
 */
export function getAllWeakVerbs(): Set<string> {
  const verbs = new Set<string>();

  for (const [, domain] of EXPERTISE_DOMAINS) {
    const weakTier = domain.verbHierarchy.find(vh => vh.tier === 'weak');
    if (weakTier) {
      for (const verb of weakTier.verbs) {
        verbs.add(verb.toLowerCase());
      }
    }
  }

  return verbs;
}
