/**
 * Competitive Intelligence Module
 *
 * Overused phrase detection and AO fatigue pattern analysis.
 * Pure deterministic — no LLM calls required.
 */

export {
  CompetitiveIntelligenceService,
  competitiveIntelligenceService,
} from './competitiveIntelligenceService';
export {
  OVERUSED_PHRASE_DATABASE,
  getPhrasesByCategory,
  getPhrasesByFrequency,
  getExtremeFatiguePhrases,
} from './overusedPhraseDatabase';
export type { OverusedPhraseEntry } from './overusedPhraseDatabase';
export type {
  CompetitiveAnalysisInput,
  CompetitiveAnalysis,
  OverusedPhraseMatch,
  PhraseCategory,
  FatiguePattern,
} from './types';
