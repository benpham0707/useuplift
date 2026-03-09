/**
 * Narrative LLM Response Types
 *
 * Rich structured types for the Haiku→Sonnet 2-stage narrative scoring pipeline.
 * Includes in-memory cache for annotation pipeline consumption.
 */

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface NarrativeStructureLLMResponse {
  score: number;
  confidence: number;
  paragraphInsights: Array<{
    index: number;
    verdict: string;
    strengthOrOpportunity: 'strength' | 'opportunity';
  }>;
  /** Transition quality between each pair of consecutive paragraphs (may be absent in legacy/fallback responses) */
  transitionAnalysis?: Array<{
    from: number;
    to: number;
    quality: 'seamless' | 'effective' | 'adequate' | 'abrupt' | 'missing';
    how: string;
    verdict: string;
  }>;
  /** Core theme, recurring motifs, and thematic coherence assessment */
  thematicThroughLine?: {
    coreTheme: string;
    recurringMotifs: Array<{
      motif: string;
      instances: Array<{ paragraphIndex: number; manifestation: string }>;
    }>;
    thematicCoherence: string;
  };
  /** Pacing strategy and key moments where pacing serves or hinders the essay */
  pacingInsights?: {
    overall: string;
    keyMoments: Array<{
      paragraphIndex: number;
      pacingChoice: string;
      effectiveness: 'serves the essay' | 'needs adjustment';
    }>;
  };
  /** Structural pattern identification and originality assessment */
  structuralOriginality?: {
    pattern: string;
    freshness: 'original' | 'intentional_convention' | 'predictable' | 'template';
    verdict: string;
  };
  strongestMoment: { paragraphIndex: number; quote: string; why: string };
  biggestOpportunity: {
    paragraphIndex: number;
    quote: string;
    why: string;
    teachingQuestion: string;
  };
  whatEssayConveys: string;
  reasoning: string;
  evidence: string[];
}

export interface NarrativeDynamicsLLMResponse {
  score: number;
  confidence: number;
  paragraphInsights: Array<{
    index: number;
    verdict: string;
    emotionalAuthenticity: 'high' | 'moderate' | 'low';
    tensionContribution: string;
  }>;
  emotionalArc: {
    summary: string;
    turningPoint: { paragraphIndex: number; what: string };
    isTransformationEarned: boolean;
    transformationSpecificity: string;
  };
  strongestMoment: { paragraphIndex: number; quote: string; why: string };
  biggestOpportunity: {
    paragraphIndex: number;
    quote: string;
    why: string;
    teachingQuestion: string;
  };
  whatEssayConveysAboutWriter: string;
  readerTakeaway: string;
  reasoning: string;
  evidence: string[];
}

// ============================================================================
// CACHE (in-memory, hash-keyed, for annotation pipeline consumption)
// ============================================================================

/** Max entries per cache. Oldest entries evicted first (LRU by insertion order). */
const CACHE_MAX_ENTRIES = 10;

const structureCache = new Map<string, NarrativeStructureLLMResponse>();
const dynamicsCache = new Map<string, NarrativeDynamicsLLMResponse>();

/** Evict oldest entries if cache exceeds max size. */
function evictIfNeeded<T>(cache: Map<string, T>): void {
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
}

export function cacheStructureInsights(hash: string, data: NarrativeStructureLLMResponse): void {
  // Re-insert to move to end (most recent) if key already exists
  structureCache.delete(hash);
  structureCache.set(hash, data);
  evictIfNeeded(structureCache);
}

export function cacheDynamicsInsights(hash: string, data: NarrativeDynamicsLLMResponse): void {
  dynamicsCache.delete(hash);
  dynamicsCache.set(hash, data);
  evictIfNeeded(dynamicsCache);
}

export function getStructureInsights(hash: string): NarrativeStructureLLMResponse | null {
  return structureCache.get(hash) ?? null;
}

export function getDynamicsInsights(hash: string): NarrativeDynamicsLLMResponse | null {
  return dynamicsCache.get(hash) ?? null;
}

/**
 * Simple string hash for cache keys.
 * Not cryptographic — just for deduplication within a session.
 */
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return hash.toString(36);
}
