/**
 * Router Types — Declared Context System
 *
 * Types for the adaptive context assembly system that works alongside
 * the existing 16-rule routing. Analysis steps declare what they need
 * (via DeclaredContextRequest), and the router assembles it.
 *
 * Design principles (LLM-First Rules):
 * - Rule 1: LLM owns judgment; system tracks and organizes
 * - Rule 2: Never discard paid output (summarize before dropping)
 * - Rule 3: No closed taxonomies (free-form section specs via 'custom:...')
 * - Rule 5: Soft guidance via ReadingStrategy, not hard section blocklists
 * - Rule 6: System infrastructure for resource limits and bookkeeping
 */

// ============================================================================
// DECLARED CONTEXT REQUEST
// ============================================================================

/**
 * Analysis steps declare what context they need. The router assembles it
 * within operational constraints (budget, token limits).
 *
 * Used by: deep dives, growth cycle iterations, re-reads, and any future
 * consumer that knows what context it needs.
 */
export interface DeclaredContextRequest {
  /** Human-readable description of what this context is for */
  purpose: string;

  /** Required sections — always included regardless of budget */
  required: ContextSectionSpec[];

  /** Desired sections — included if budget allows, in priority order */
  desired: ContextSectionSpec[];

  /** Token budget for the entire assembled context */
  tokenBudget: number;

  /** Reading Strategy — influences ordering and emphasis */
  readingStrategy?: import('../profileTypes').ReadingStrategy;

  /** If provided, the router should optimize ordering for this focus */
  analysisFocus?: string;
}

/**
 * Specification for a single context section to include.
 *
 * Supports:
 * - Named sections: 'profileIndex', 'voiceIdentity', 'voiceMap',
 *   'emotionalTopography', 'momentEarnednessMap', 'thematicArchitecture',
 *   'narrativeStrategy', 'characterRevelation', 'craftAssessment',
 *   'admissionsPositioning', 'entanglements', 'northStar', 'connections',
 *   'findingSummary'
 * - Paragraph-scoped: 'paragraph:3' (full P3), 'paragraph:3:understanding',
 *   'paragraph:3:analysis'
 * - Sentence-scoped: 'sentence:3:2' (P3S2 full)
 * - Connection-scoped: 'connections:paragraph:3' (connections involving P3)
 * - All paragraphs: 'paragraphs:all' (full), 'paragraphs:all:digests' (digests only)
 * - Essay text: 'essayText', 'essayText:paragraph:3'
 * - Free-form: 'custom:...' (router resolves by best-effort matching)
 */
export interface ContextSectionSpec {
  /** What to include — see above for supported patterns */
  section: string;

  /** How to present this section */
  presentation: 'full' | 'summary' | 'digest';

  /** Priority override (default: determined by position in required/desired) */
  priority?: 'always' | 'connection_driven' | 'proximity' | 'nice_to_have';
}

// ============================================================================
// CONTEXT RELEVANCE TRACKING
// ============================================================================

/**
 * A single context assembly event logged for diagnostics.
 */
export interface ContextRelevanceEntry {
  /** Which routing rule or declared request produced this context */
  source: string;
  /** Which sections were included */
  sectionsProvided: string[];
  /** Estimated tokens of assembled context */
  totalTokens: number;
  /** Timestamp */
  timestamp: string;
  /** Which sections the LLM actually referenced in its output (post-hoc analysis) */
  sectionsReferenced?: string[];
  /** Which sections the LLM mentioned needing but not having */
  sectionsMissing?: string[];
}

/**
 * Tracker interface for context relevance diagnostics.
 * System bookkeeping (Rule 6) — never drives routing decisions.
 */
export interface ContextRelevanceTracker {
  /** Log a context assembly event */
  recordAssembly(entry: ContextRelevanceEntry): void;
  /** Log which sections the LLM actually used (called after LLM response is parsed) */
  recordUsage(source: string, referenced: string[], missing: string[]): void;
  /** Get usage statistics for diagnostic purposes */
  getStats(): ContextDiagnosticStats;
}

/**
 * Diagnostic statistics about context usage patterns.
 * Used by developers to improve routing rules — not by the system at runtime.
 */
export interface ContextDiagnosticStats {
  /** Sections most frequently referenced by LLM output */
  mostReferenced: Array<{ section: string; refCount: number }>;
  /** Sections provided many times but rarely referenced (low utility) */
  leastReferenced: Array<{ section: string; refCount: number }>;
  /** Sections the LLM indicated were missing */
  mostMissing: Array<{ section: string; missCount: number }>;
  /** Total number of context assembly events tracked */
  totalAssemblies: number;
}

// ============================================================================
// IN-MEMORY RELEVANCE TRACKER
// ============================================================================

/**
 * Simple in-memory implementation of ContextRelevanceTracker.
 * Sufficient for diagnostic purposes — data is per-session, not persisted.
 */
export class InMemoryRelevanceTracker implements ContextRelevanceTracker {
  private entries: ContextRelevanceEntry[] = [];
  private referenceCounts: Map<string, number> = new Map();
  private missingCounts: Map<string, number> = new Map();
  private providedCounts: Map<string, number> = new Map();

  recordAssembly(entry: ContextRelevanceEntry): void {
    this.entries.push(entry);
    for (const section of entry.sectionsProvided) {
      this.providedCounts.set(section, (this.providedCounts.get(section) ?? 0) + 1);
    }
  }

  recordUsage(source: string, referenced: string[], missing: string[]): void {
    // Update the most recent entry for this source with reference data
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].source === source) {
        this.entries[i].sectionsReferenced = referenced;
        this.entries[i].sectionsMissing = missing;
        break;
      }
    }

    for (const section of referenced) {
      this.referenceCounts.set(section, (this.referenceCounts.get(section) ?? 0) + 1);
    }
    for (const section of missing) {
      this.missingCounts.set(section, (this.missingCounts.get(section) ?? 0) + 1);
    }
  }

  getStats(): ContextDiagnosticStats {
    // Most referenced: sorted descending by reference count
    const sortedRefs = [...this.referenceCounts.entries()]
      .map(([section, refCount]) => ({ section, refCount }))
      .sort((a, b) => b.refCount - a.refCount);

    // Least referenced: sections provided multiple times but rarely referenced
    const leastRefs = [...this.providedCounts.entries()]
      .map(([section, providedCount]) => ({
        section,
        refCount: this.referenceCounts.get(section) ?? 0,
        providedCount,
      }))
      .filter(e => e.providedCount >= 2) // Only meaningful with multiple samples
      .sort((a, b) => {
        // Sort by reference rate (ascending — least referenced first)
        const rateA = a.refCount / a.providedCount;
        const rateB = b.refCount / b.providedCount;
        return rateA - rateB;
      })
      .map(e => ({ section: e.section, refCount: e.refCount }));

    // Most missing: sorted descending by miss count
    const sortedMissing = [...this.missingCounts.entries()]
      .map(([section, missCount]) => ({ section, missCount }))
      .sort((a, b) => b.missCount - a.missCount);

    return {
      mostReferenced: sortedRefs.slice(0, 10),
      leastReferenced: leastRefs.slice(0, 10),
      mostMissing: sortedMissing.slice(0, 10),
      totalAssemblies: this.entries.length,
    };
  }
}
