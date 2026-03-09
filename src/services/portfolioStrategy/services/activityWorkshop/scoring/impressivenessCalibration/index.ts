/**
 * Impressiveness Calibration Database — Public API
 *
 * Static, pre-built knowledge base for field-specific impressiveness analysis.
 * Provides deterministic assessment of WHAT makes achievements impressive in context,
 * HOW they align with intended majors, and pre-built exemplar descriptions for teaching.
 *
 * Cost: $0.00 (pure data + TypeScript logic, no LLM calls)
 * Latency: <1ms per activity lookup, <5ms for batch analysis
 *
 * Complements:
 * - achievementIntelligence.ts — WHAT activities exist at each tier (benchmark entries)
 * - expertiseSignaling/ — writing quality patterns (real expertise vs name-dropping)
 * - tierClassifier.ts — deterministic tier from evidence
 *
 * This module answers: WHAT makes this achievement truly impressive, and WHY?
 *
 * Integration points:
 * 1. Scoring Orchestrator — Phase 2c (after tier classification, before rule scoring)
 * 2. Nuance Calibration — Enriched context for Sonnet fine-tuning
 * 3. Portfolio Calibrator — Replaces primitive MAJOR_RELEVANCE_MAP
 * 4. Teaching Layer — Pre-built exemplar injection
 */

// Re-export all types
export type {
  ImpressionLevel,
  ImpressionEntry,
  TechnicalDepthMarker,
  ImpressivenessDomain,
  AlignmentStrength,
  MajorAlignmentEntry,
  MajorCategory,
  ExemplarDescription,
  ExemplarDimension,
  ImpressionAnalysisResult,
  DetectedMarker,
  MajorAlignmentResult,
} from './types';

export {
  IMPRESSION_LEVEL_TO_TIER,
  alignmentToRelevance,
  alignmentToLegacyRelevance,
} from './types';

// Re-export analysis functions
export {
  analyzeImpressiveness,
  analyzeImpressivenessBatch,
} from './impressivenessAnalyzer';

// Re-export alignment functions
export {
  resolveMajor,
  getAlignment,
  getAlignmentForMajor,
  MAJOR_CATEGORIES,
} from './majorAlignmentMatrix';

// Re-export exemplar functions
export {
  getExemplarsForDomain,
  getBestExemplarForTeaching,
} from './exemplarLibrary';

// Import domain definitions
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

import type { ImpressivenessDomain } from './types';

// ============================================================================
// DOMAIN REGISTRY
// ============================================================================

/**
 * All impressiveness domains indexed by their domain ID.
 * 12 domains covering all major activity categories.
 */
export const IMPRESSIVENESS_DOMAINS: Map<string, ImpressivenessDomain> = new Map([
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
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get the impressiveness domain for a given domain ID.
 */
export function getImpressivenessDomain(domainId: string): ImpressivenessDomain | undefined {
  return IMPRESSIVENESS_DOMAINS.get(domainId);
}

/**
 * Get all available impressiveness domains.
 */
export function getAllImpressivenessDomains(): ImpressivenessDomain[] {
  return Array.from(IMPRESSIVENESS_DOMAINS.values());
}

/**
 * Get domain labels for display.
 */
export function getImpressivenessDomainLabels(): Array<{ id: string; label: string }> {
  return Array.from(IMPRESSIVENESS_DOMAINS.entries()).map(([id, domain]) => ({
    id,
    label: domain.label,
  }));
}

// ============================================================================
// AGGREGATE STATISTICS
// ============================================================================

/**
 * Get aggregate statistics about the impressiveness calibration database.
 * Useful for logging and diagnostics.
 */
export function getCalibrationStats(): {
  totalDomains: number;
  totalLadderEntries: number;
  totalMarkers: number;
  perDomain: Array<{
    domainId: string;
    label: string;
    ladderLevels: number;
    markers: number;
  }>;
} {
  let totalLadderEntries = 0;
  let totalMarkers = 0;
  const perDomain: Array<{
    domainId: string;
    label: string;
    ladderLevels: number;
    markers: number;
  }> = [];

  for (const [, domain] of IMPRESSIVENESS_DOMAINS) {
    totalLadderEntries += domain.ladder.length;
    totalMarkers += domain.technicalDepthMarkers.length;

    perDomain.push({
      domainId: domain.domainId,
      label: domain.label,
      ladderLevels: domain.ladder.length,
      markers: domain.technicalDepthMarkers.length,
    });
  }

  return {
    totalDomains: IMPRESSIVENESS_DOMAINS.size,
    totalLadderEntries,
    totalMarkers,
    perDomain,
  };
}
