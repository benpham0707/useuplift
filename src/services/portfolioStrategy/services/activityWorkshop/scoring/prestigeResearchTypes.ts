/**
 * Prestige Research Types
 *
 * Type definitions for the JIT prestige research service that uses Sonnet
 * to assess unknown entities (programs, competitions, organizations) and
 * caches results permanently in Supabase.
 */

/** Result of researching a single entity's prestige/selectivity */
export interface PrestigeResearchResult {
  entityName: string;
  entityType: 'program' | 'competition' | 'organization' | 'institution' | 'award' | 'unknown';
  selectivityTier: 1 | 2 | 3 | 4;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  scope: 'international' | 'national' | 'state' | 'regional' | 'local' | 'school';
  acceptanceRate: string | null;
  notableFactors: string[];
  isVerifiable: boolean;
  researchedAt: string;
  modelVersion: string;
}

/** Input for researching a single entity */
export interface PrestigeResearchRequest {
  entityName: string;
  context: string;
  category: string;
}

/** Shape of the Supabase cache row */
export interface CachedPrestigeEntry {
  id: string;
  entity_name_normalized: string;
  research_result: PrestigeResearchResult;
  created_at: string;
  model_version: string;
}

/** Configuration for the prestige research service */
export interface PrestigeResearchConfig {
  /** Max entities to research per activity */
  maxEntitiesPerActivity: number;
  /** Sonnet model ID */
  modelId: string;
  /** Whether to skip research for weak signal activities */
  skipWeakSignals: boolean;
  /** Whether to use Supabase caching */
  enableCache: boolean;
}
