/**
 * FindingStore — Pure data management for the Finding lifecycle.
 *
 * No LLM calls. No analytical judgment. Just CRUD operations with
 * referential integrity validation.
 *
 * The LLM decides maturity, coaching value, and relationships.
 * The store validates that references point to real findings and
 * logs warnings on suspicious transitions (backward maturity jumps).
 *
 * Append-only: findings are never deleted. Superseded findings remain
 * in the store with `maturity === 'superseded'`. Querying active findings
 * means filtering to `maturity !== 'superseded'`.
 *
 * Design: LLM-first (Rule 1), never discard paid output (Rule 2),
 * system infrastructure for bookkeeping (Rule 6).
 */

import type {
  Finding,
  FindingMaturity,
  FindingCoachingValue,
  FindingLineageEntry,
} from '../profileTypes';

/** Maturity ordering for transition validation (superseded is special) */
const MATURITY_ORDER: Record<FindingMaturity, number> = {
  hypothesis: 0,
  developing: 1,
  confirmed: 2,
  deepened: 3,
  superseded: -1,
};

/** Coaching value ordering for sorting (lower = more important) */
const COACHING_VALUE_ORDER: Record<FindingCoachingValue, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  contextual: 3,
  diagnostic: 4,
};

export { COACHING_VALUE_ORDER };

export class FindingStore {
  private findings: Map<string, Finding> = new Map();
  private nextId: number = 1;

  /** Generate a unique finding ID */
  generateId(): string {
    return `F${this.nextId++}`;
  }

  /** Get the current ID counter (for serialization) */
  getNextIdCounter(): number {
    return this.nextId;
  }

  /** Get total count including superseded */
  get size(): number {
    return this.findings.size;
  }

  /**
   * Add a new finding. Validates referential integrity of buildsOn/relatedTo.
   * Throws on references to non-existent findings.
   * Warns (does not throw) when building on superseded findings.
   */
  add(finding: Finding): void {
    if (this.findings.has(finding.id)) {
      throw new Error(`Finding ${finding.id} already exists in the store`);
    }

    // Validate: all buildsOn IDs must exist
    for (const parentId of finding.buildsOn) {
      const parent = this.findings.get(parentId);
      if (!parent) {
        throw new Error(
          `Finding ${finding.id} buildsOn non-existent ${parentId}`
        );
      }
      // Warning (not error) if building on superseded finding -- LLM might have good reason
      if (parent.maturity === 'superseded') {
        console.warn(
          `[FindingStore] Finding ${finding.id} buildsOn superseded ${parentId} -- verify intent`
        );
      }
    }

    // Validate: all relatedTo IDs must exist
    for (const relId of finding.relatedTo) {
      if (!this.findings.has(relId)) {
        throw new Error(
          `Finding ${finding.id} relatedTo non-existent ${relId}`
        );
      }
    }

    this.findings.set(finding.id, finding);
  }

  /** Get a finding by ID, or undefined if not found */
  get(id: string): Finding | undefined {
    return this.findings.get(id);
  }

  /** Check if a finding exists */
  has(id: string): boolean {
    return this.findings.has(id);
  }

  /**
   * Update maturity. Validates no unexplained backward jumps.
   * Handles supersession: when a finding supersedes another, the target
   * is also marked as superseded with lineage preserved.
   *
   * @param id - Finding to update
   * @param newMaturity - New maturity level
   * @param reasoning - LLM's explanation for the transition
   * @param trigger - What caused the change (e.g., 'walk_P3', 'deep_dive_voice')
   * @param supersedes - Optional: ID of finding this one supersedes
   */
  updateMaturity(
    id: string,
    newMaturity: FindingMaturity,
    reasoning: string,
    trigger: string,
    supersedes?: string,
  ): void {
    const finding = this.findings.get(id);
    if (!finding) {
      throw new Error(`Finding ${id} not found`);
    }

    // Backward jump validation (system guardrail, not analytical judgment)
    // superseded can go to any state (it's a special case -- e.g., un-supersede)
    // any state can go to superseded (that's the normal retirement path)
    if (
      newMaturity !== 'superseded' &&
      finding.maturity !== 'superseded' &&
      MATURITY_ORDER[newMaturity] < MATURITY_ORDER[finding.maturity]
    ) {
      console.warn(
        `[FindingStore] Maturity backward jump: ${finding.id} ${finding.maturity} -> ${newMaturity}. ` +
        `Reasoning: ${reasoning}`
      );
    }

    const lineageEntry: FindingLineageEntry = {
      timestamp: new Date().toISOString(),
      previousMaturity: finding.maturity,
      newMaturity,
      trigger,
      reasoning,
      supersedes,
    };

    finding.lineage.push(lineageEntry);
    finding.maturity = newMaturity;
    finding.maturityReasoning = reasoning;
    finding.lastUpdated = new Date().toISOString();

    // Handle supersession pointer on the target
    if (supersedes) {
      const supersededFinding = this.findings.get(supersedes);
      if (!supersededFinding) {
        console.warn(
          `[FindingStore] Supersession target ${supersedes} not found -- skipping pointer update`
        );
        return;
      }

      const prevMaturity = supersededFinding.maturity;
      supersededFinding.supersededBy = id;
      supersededFinding.supersessionReason = reasoning;

      // Only add lineage + update maturity if it wasn't already superseded
      if (prevMaturity !== 'superseded') {
        supersededFinding.maturity = 'superseded';
        supersededFinding.lastUpdated = new Date().toISOString();
        supersededFinding.lineage.push({
          timestamp: new Date().toISOString(),
          previousMaturity: prevMaturity,
          newMaturity: 'superseded',
          trigger,
          reasoning: `Superseded by ${id}: ${reasoning}`,
        });
      }
    }
  }

  /**
   * Update a finding's coaching value.
   * LLM-assigned; the store just records it.
   */
  updateCoachingValue(id: string, value: FindingCoachingValue): void {
    const finding = this.findings.get(id);
    if (!finding) {
      throw new Error(`Finding ${id} not found`);
    }
    finding.coachingValue = value;
    finding.lastUpdated = new Date().toISOString();
  }

  /**
   * Update a finding's deepening potential.
   * Set to null when fully explored.
   */
  updateDeepeningPotential(id: string, potential: string | null): void {
    const finding = this.findings.get(id);
    if (!finding) {
      throw new Error(`Finding ${id} not found`);
    }
    finding.deepeningPotential = potential;
    finding.lastUpdated = new Date().toISOString();
  }

  /** Get all active (non-superseded) findings */
  getActive(): Finding[] {
    return Array.from(this.findings.values())
      .filter(f => f.maturity !== 'superseded');
  }

  /** Get all superseded findings */
  getSuperseded(): Finding[] {
    return Array.from(this.findings.values())
      .filter(f => f.maturity === 'superseded');
  }

  /** Get findings by scope (for a specific paragraph) */
  getByScope(paragraph: number): Finding[] {
    return this.getActive().filter(f =>
      f.scope.paragraph === paragraph ||
      (f.scope.paragraphs && f.scope.paragraphs.includes(paragraph))
    );
  }

  /** Get findings by coaching value */
  getByCoachingValue(value: FindingCoachingValue): Finding[] {
    return this.getActive().filter(f => f.coachingValue === value);
  }

  /** Get findings by dimension */
  getByDimension(dimension: string): Finding[] {
    return this.getActive().filter(f =>
      f.dimensions.includes(dimension as Finding['dimensions'][number])
    );
  }

  /** Get findings by source */
  getBySource(source: Finding['source']): Finding[] {
    return this.getActive().filter(f => f.source === source);
  }

  /** Get findings sorted by coaching value (most important first) */
  getActiveSortedByCoachingValue(): Finding[] {
    return this.getActive().sort(
      (a, b) => COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
    );
  }

  /**
   * Get the full supersession chain for a finding.
   * Follows supersededBy pointers forward from the given finding.
   */
  getSupersessionChain(id: string): Finding[] {
    const chain: Finding[] = [];
    let current = this.findings.get(id);
    while (current) {
      chain.push(current);
      current = current.supersededBy
        ? this.findings.get(current.supersededBy)
        : undefined;
    }
    return chain;
  }

  /**
   * Get the reverse supersession chain — from a finding back to its origin.
   * Useful for tracing how a finding evolved from its earliest hypothesis.
   */
  getReverseSupersessionChain(id: string): Finding[] {
    const chain: Finding[] = [];
    let current = this.findings.get(id);
    if (!current) return chain;

    chain.push(current);

    // Walk backward through buildsOn to find the root
    // (supersession chain walks forward; this walks backward through buildsOn)
    const visited = new Set<string>();
    while (current && current.buildsOn.length > 0) {
      const parentId = current.buildsOn[0]; // follow primary parent
      if (visited.has(parentId)) break; // prevent cycles
      visited.add(parentId);
      const parent = this.findings.get(parentId);
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Get depth trees — findings connected by buildsOn chains.
   * Returns root findings (no parents) with their descendant chains.
   * Used for understanding how deep the system has gone on each thread.
   */
  getDepthTrees(): Array<{ root: Finding; descendants: Finding[] }> {
    const active = this.getActive();
    const roots = active.filter(f => f.buildsOn.length === 0);
    return roots.map(root => ({
      root,
      descendants: this.getDescendants(root.id),
    }));
  }

  /**
   * Get all descendants of a finding through buildsOn chains.
   * Only returns active (non-superseded) descendants.
   */
  private getDescendants(rootId: string): Finding[] {
    const children = this.getActive().filter(f => f.buildsOn.includes(rootId));
    return children.flatMap(child => [child, ...this.getDescendants(child.id)]);
  }

  /**
   * Get findings with non-null deepening potential and high coaching value.
   * These are prime candidates for deep dive dispatch.
   */
  getDeepDiveCandidates(): Finding[] {
    return this.getActive()
      .filter(f =>
        f.deepeningPotential !== null &&
        (f.coachingValue === 'critical' || f.coachingValue === 'high')
      )
      .sort(
        (a, b) => COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
      );
  }

  /**
   * Seed prior findings for comprehensive re-analysis.
   *
   * Imports findings from a previous analysis round, downgrading active
   * findings to 'developing' with a lineage entry. Superseded findings
   * are imported as-is (no maturity change). The nextId counter is set
   * to avoid collisions with both prior and any already-added findings.
   *
   * Bypasses buildsOn/relatedTo validation — prior findings were already
   * validated when originally created, and internal cross-references
   * resolve within the seeded set.
   *
   * Must be called on an EMPTY store (before the walk creates any findings).
   */
  seedForReanalysis(priorFindings: Finding[]): { seeded: number; skipped: number } {
    if (this.findings.size > 0) {
      console.warn(
        `[FindingStore] seedForReanalysis called on non-empty store (${this.findings.size} existing). ` +
        `Seeding anyway — existing findings will not be overwritten.`,
      );
    }

    const now = new Date().toISOString();
    let seeded = 0;
    let skipped = 0;
    let maxId = this.nextId - 1;

    for (const finding of priorFindings) {
      // Track highest ID for counter
      const num = parseInt(finding.id.replace('F', ''), 10);
      if (!isNaN(num) && num > maxId) maxId = num;

      // Skip if ID already exists (e.g., store was not empty)
      if (this.findings.has(finding.id)) {
        skipped++;
        continue;
      }

      if (finding.maturity === 'superseded') {
        // Import superseded findings as-is (no maturity change)
        this.findings.set(finding.id, { ...finding });
      } else {
        // Downgrade active findings to 'developing' with lineage entry
        this.findings.set(finding.id, {
          ...finding,
          maturity: 'developing',
          maturityReasoning:
            `Downgraded from '${finding.maturity}' during comprehensive re-analysis — ` +
            `needs re-evaluation against fresh understanding.`,
          lastUpdated: now,
          lineage: [
            ...finding.lineage,
            {
              timestamp: now,
              previousMaturity: finding.maturity,
              newMaturity: 'developing',
              trigger: 'comprehensive_reanalysis',
              reasoning:
                'Comprehensive re-analysis rebuilt the profile. ' +
                'Finding preserved for evolution — walk can confirm, deepen, or supersede.',
            },
          ],
        });
      }
      seeded++;
    }

    // Set nextId above all seeded IDs to avoid collisions
    this.nextId = maxId + 1;

    return { seeded, skipped };
  }

  /** Serialize all findings (including superseded) for persistence */
  serialize(): { findings: Finding[]; nextId: number } {
    return {
      findings: Array.from(this.findings.values()),
      nextId: this.nextId,
    };
  }

  /**
   * Deserialize from a previously serialized state.
   * Static factory method — creates a new FindingStore from saved data.
   */
  static deserialize(data: { findings: Finding[]; nextId: number }): FindingStore {
    const store = new FindingStore();
    store.nextId = data.nextId;
    for (const finding of data.findings) {
      // Bypass validation on deserialize — data was validated on original add
      store.findings.set(finding.id, finding);
    }
    return store;
  }

  /** Summary for LLM context (compact representation) */
  toContextSummary(): string {
    const active = this.getActive();
    if (active.length === 0) {
      return '0 active findings.';
    }

    const byCv: Record<string, number> = {};
    const byMat: Record<string, number> = {};
    for (const f of active) {
      byCv[f.coachingValue] = (byCv[f.coachingValue] || 0) + 1;
      byMat[f.maturity] = (byMat[f.maturity] || 0) + 1;
    }

    const supersededCount = this.findings.size - active.length;

    return `${active.length} active findings. ` +
      `Maturity: ${JSON.stringify(byMat)}. ` +
      `Coaching value: ${JSON.stringify(byCv)}. ` +
      `${supersededCount} superseded.`;
  }
}
