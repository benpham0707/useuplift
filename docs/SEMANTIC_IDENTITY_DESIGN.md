# Semantic Identity Architecture — Design Document

> **Track B Design** — produced from deep codebase analysis of the Essay Intelligence System.
> Ready for implementation by a swarm team without ambiguity.

---

## Executive Summary

The Essay Intelligence System currently identifies every essay element by its physical position: `{ paragraph: 3, sentence: 1 }`. This creates a cascading failure mode: insert one paragraph above P3, and every observation, staleness marker, connection, and analysis reference that pointed to P3 now points to the wrong content.

This document specifies a **stable entity identity system** where each paragraph and sentence receives a permanent ID at first observation, and all references across the profile use that ID instead of positional indices. Positional indices become a **derived, cached field** — computed from the entity's position in the ordered array, never used as a primary key.

---

## Table of Contents

1. [LocationRef v2 — New Type Definitions](#1-locationref-v2)
2. [StalenessTarget v2 — Entity-Based Staleness](#2-stalenesstarget-v2)
3. [EditDiff v2 — Semantic Diff Schema](#3-editdiff-v2)
4. [Identity Assignment Protocol](#4-identity-assignment-protocol)
5. [Re-identification Protocol — Structural Edits](#5-re-identification-protocol)
6. [Migration Strategy](#6-migration-strategy)
7. [Open Questions](#7-open-questions)

---

## 1. LocationRef v2

### The Problem with the Current System

There is no explicit `LocationRef` type today — the system uses raw positional fields scattered across every type:

| Current Pattern | Where Used |
|---|---|
| `{ paragraph: number; sentence?: number }` | PendingChange.location, VersionRecord.changes[].location, ReanalysisBrief.netChanges[].location |
| `index: number` on ParagraphProfile | ParagraphProfile.index |
| `index: number` on SentenceProfile | SentenceProfile.index |
| `from: [number, number]`, `to: [number, number]` | Connection, ProfileConnections.imageRecurrences, narrativeArcMap, connectionGraph |
| `{ type: 'paragraph'; index: number }` | StalenessTarget |
| `{ type: 'sentence'; paragraph: number; sentence: number }` | StalenessTarget |
| `paragraphIndex` / `sentenceIndex` | EditDiff.paragraphChanges, FocusedAnalysisResult |
| `location: [number, number \| null]` | ProfileIndex.activeConcerns |
| `paragraphs: number[]` | StructuralRole, ProfileConnections.redundancies |

Every one of these breaks on insert/delete/reorder.

### The New Design: Three-Layer Identity

Each essay element (paragraph or sentence) carries three layers of identity:

```typescript
// ============================================================================
// CORE IDENTITY TYPES
// ============================================================================

/**
 * Stable entity ID — assigned ONCE at first observation, NEVER changes.
 * This is the PRIMARY KEY for all cross-references in the profile.
 *
 * Format: 'p_{nanoid8}' for paragraphs, 's_{nanoid8}' for sentences.
 * Examples: 'p_x7k2m9aB', 's_q3p8f2nR'
 *
 * Why nanoid over UUID?
 * - 8 chars = 2.8 trillion combinations (collision-free at essay scale)
 * - URL-safe alphabet (A-Za-z0-9_-)
 * - Human-readable in logs and prompts
 * - ~4x shorter than UUID (saves tokens in LLM context)
 */
type EntityId = string;  // branded: `p_${string}` | `s_${string}`

/**
 * Semantic address — human-readable descriptor that CAN evolve.
 * Used for routing, display, and prompts. NOT used for identity.
 *
 * Updated when L2 re-runs (paragraph role changes) or L3 re-runs
 * (sentence function changes). The entityId stays the same.
 */
interface ParagraphSemanticAddress {
  /** L2-assigned structural role: 'hook', 'context', 'evidence', 'fulcrum', etc. */
  structuralRole: string;
  /** Ordinal within role (0-indexed). Handles multiple 'evidence' paragraphs. */
  roleOrdinal: number;
  /**
   * Content fingerprint — hash of 3-5 most distinctive words.
   * NOT a full text hash (too brittle). Extracted from: first noun phrase,
   * key image/metaphor, or distinctive proper noun.
   * Used for re-identification when roles are ambiguous.
   */
  contentFingerprint: string;
  /** The NorthStar structural significance, if assigned */
  structuralSignificance?: 'load_bearing' | 'supporting' | 'transitional';
}

interface SentenceSemanticAddress {
  /** Parent paragraph's entity ID */
  parentEntityId: EntityId;
  /** Primary narrative function in this paragraph: 'thesis_anchor', 'scene_setter', etc. */
  narrativeFunction: string;
  /** Observation label if assigned by L3: 'U1', 'U2', etc. */
  observationLabel?: string;
  /** Content fingerprint (key phrase hash) */
  contentFingerprint: string;
}

/**
 * The unified location reference — replaces all raw positional patterns.
 *
 * Design principle: entityId is IDENTITY (stable, for storage/reference).
 * semanticAddress is DESCRIPTION (evolving, for routing/display).
 * positionalIndex is CACHE (derived, for backward compat and array access).
 */
interface EntityRef {
  /** Stable ID — the ONLY field used for cross-references */
  entityId: EntityId;
  /** Current positional index — DERIVED, recomputed after every structural change */
  index: number;
}
```

### Updated ParagraphProfile

```typescript
interface ParagraphProfile {
  /** Stable entity ID — assigned at first observation, never changes */
  entityId: EntityId;  // NEW — primary key

  /** Positional index — DERIVED from position in paragraphs[] array */
  index: number;  // KEPT for backward compat, but no longer authoritative

  /** Semantic address — evolves with L2 re-runs */
  semanticAddress: ParagraphSemanticAddress;  // NEW

  /** The paragraph text (populated at load time) */
  text: string;
  tags: string[];
  understanding: ParagraphUnderstanding | null;
  analysis: ParagraphAnalysis | null;
  sentences: SentenceProfile[];
  walkSkipped?: WalkSkippedMarker;
}
```

### Updated SentenceProfile

```typescript
interface SentenceProfile {
  /** Stable entity ID — assigned at first observation, never changes */
  entityId: EntityId;  // NEW — primary key

  /** Positional index within paragraph — DERIVED */
  index: number;  // KEPT for backward compat

  /** Semantic address — evolves with L3 re-runs */
  semanticAddress: SentenceSemanticAddress;  // NEW

  text: string;
  understanding: SentenceUnderstanding | null;
  analysis: SentenceAnalysis | null;
}
```

### Updated Connection

```typescript
interface Connection {
  id: string;  // unchanged — already stable

  /** Source entity — identified by entityId, position cached */
  from: EntityRef;  // WAS: [number, number]

  /** Target entity — identified by entityId, position cached */
  to: EntityRef;  // WAS: [number, number]

  type: string;
  description: string;
  confidence: number;
  discoveredByLayer: string;
}
```

**Why EntityRef instead of just EntityId for connections?**
Because consumer code frequently needs the positional index for array access (e.g., `profile.paragraphs[conn.from.index]`). By caching the index in EntityRef, we avoid a lookup on every access while still having the stable ID as the authority.

### Rationale: Why Not Just UUIDs?

Pure UUIDs would work for identity but fail at:
- **Human readability**: `p_x7k2m9aB` is scannable; `550e8400-e29b-41d4-a716-446655440000` is not
- **LLM context efficiency**: 8 chars vs 36 chars, multiplied across dozens of references per prompt
- **Debugging**: When a staleness tracker says "paragraph p_x7k2m9aB is stale", a human can cross-reference. With UUIDs, you need a lookup table.

### Rationale: Why Not Content Hash as Primary Key?

Content hashes (SHA-256 of text) seem attractive but fail at the core use case:
- Student rephrases a sentence → hash changes → identity lost
- Two paragraphs with similar content → hash collision risk
- Empty paragraphs → identical hashes

Content fingerprint is useful as a **re-identification signal** (see Section 5), not as identity.

---

## 2. StalenessTarget v2

### Current (Positional)

```typescript
// profileTypes.ts:1722-1728 — current
type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; index: number }                           // ← POSITIONAL
  | { type: 'sentence'; paragraph: number; sentence: number }      // ← POSITIONAL
  | { type: 'connections'; connectionIds: string[] }
  | { type: 'north_star' }
  | { type: 'entanglements' };
```

### New (Entity-Based)

```typescript
type StalenessTarget =
  | { type: 'holistic'; section: HolisticSectionType }
  | { type: 'paragraph'; entityId: EntityId }                         // ← ENTITY
  | { type: 'sentence'; entityId: EntityId }                          // ← ENTITY
  | { type: 'connections'; connectionIds: string[] }                  // unchanged
  | { type: 'north_star' }                                            // unchanged
  | { type: 'entanglements' }                                         // unchanged
  | { type: 'observation'; observationLabel: string };                 // NEW — track by [U4]
```

### Why Add an Observation Target?

Today, staleness is tracked at paragraph/sentence granularity. But the focused analyzer already works at the observation level (confirming/invalidating [U1], [U2], etc.). Adding `observation` as a first-class staleness target lets us express: "Observation [U4] is stale because the sentence it lives on changed" — which is more precise than "paragraph 3 is stale."

### Graceful Degradation: Before L2 Runs

**Problem**: When an essay is first submitted, L2 hasn't run yet. There are no structural roles, no semantic addresses — just raw text split into paragraphs. How does staleness work?

**Solution**: Entity IDs are assigned in L1 (the first layer to touch the essay). They're positionally assigned at first (p_x7k2 IS paragraph 0 at that moment), but the ID itself is stable. The semantic address gets a **placeholder role**:

```typescript
// Before L2:
{
  entityId: 'p_x7k2m9aB',
  semanticAddress: {
    structuralRole: 'unassigned',  // placeholder
    roleOrdinal: 0,
    contentFingerprint: 'abc123',
  }
}

// After L2:
{
  entityId: 'p_x7k2m9aB',          // SAME — never changes
  semanticAddress: {
    structuralRole: 'fulcrum',       // now assigned
    roleOrdinal: 0,
    contentFingerprint: 'abc123',    // may update if content changed
  }
}
```

Staleness tracking uses `entityId` exclusively — it doesn't care whether the semantic address is populated yet.

### VersionTracker Impact

The `effectKey()` function in versionTracker.ts currently produces keys like `paragraph:3`, `sentence:3:1`. In v2:

```typescript
function effectKey(effect: StalenessEffect): string {
  const t = effect.target;
  switch (t.type) {
    case 'holistic':
      return `holistic:${t.section}`;
    case 'paragraph':
      return `paragraph:${t.entityId}`;           // was: t.index
    case 'sentence':
      return `sentence:${t.entityId}`;             // was: t.paragraph:t.sentence
    case 'connections':
      return `connections:${t.connectionIds.sort().join(',')}`;
    case 'north_star':
      return 'north_star';
    case 'entanglements':
      return 'entanglements';
    case 'observation':
      return `observation:${t.observationLabel}`;  // new
  }
}
```

These keys are now **inherently stable** — no index arithmetic needed on structural changes.

---

## 3. EditDiff v2

### Current (Positional)

```typescript
// profileTypes.ts:1111-1140 — current
interface EditDiff {
  structural: {
    paragraphsAdded: number[];      // ← positional indices
    paragraphsRemoved: number[];    // ← positional indices
    paragraphsReordered: boolean;
    paragraphDelta: number;
  };
  paragraphChanges: Array<{
    paragraphIndex: number;          // ← positional
    changeType: 'modified' | 'added' | 'removed';
    sentenceChanges: Array<{
      sentenceIndex: number;         // ← positional
      changeType: 'modified' | 'added' | 'removed' | 'unchanged';
      oldText?: string;
      newText?: string;
      wordDiff?: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }>;
    }>;
  }>;
  stats: { totalSentencesChanged: number; totalWordsChanged: number; changeRatio: number };
}
```

### New (Entity-Addressed)

```typescript
interface EditDiff {
  /** Essay-level structural changes */
  structural: {
    /** Entity IDs of newly added paragraphs (no prior identity) */
    paragraphsAdded: EntityId[];
    /** Entity IDs of removed paragraphs (identity orphaned) */
    paragraphsRemoved: EntityId[];
    /** Whether paragraph ORDER changed (same entities, different sequence) */
    paragraphsReordered: boolean;
    /** Net change in paragraph count */
    paragraphDelta: number;
  };

  /** Per-paragraph changes — keyed by entity, not position */
  paragraphChanges: Array<{
    /** Entity ID of the paragraph (stable across edits) */
    entityId: EntityId;
    /** Current positional index AFTER the edit (derived) */
    newIndex: number;
    /** Previous positional index BEFORE the edit (for migration/logging) */
    previousIndex?: number;
    /** What happened to this paragraph */
    changeType: 'modified' | 'added' | 'removed' | 'moved';

    sentenceChanges: Array<{
      /** Entity ID of the sentence */
      entityId: EntityId;
      /** Current positional index within paragraph AFTER edit */
      newIndex: number;
      /** Previous positional index (for migration) */
      previousIndex?: number;
      changeType: 'modified' | 'added' | 'removed' | 'moved' | 'unchanged';
      oldText?: string;
      newText?: string;
      wordDiff?: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }>;
    }>;
  }>;

  /** Re-identification results — how old entities map to new text */
  reidentification: {
    /** Confirmed matches: old entity → same entity in new text */
    confirmed: Array<{
      entityId: EntityId;
      previousIndex: number;
      newIndex: number;
      confidence: number;  // 0-1, how certain the match is
      matchMethod: 'exact_content' | 'fingerprint' | 'role_topology' | 'llm_assisted';
    }>;
    /** Orphaned: entities from old text with no match in new text */
    orphaned: EntityId[];
    /** Novel: entities in new text with no match in old text */
    novel: EntityId[];
  };

  stats: {
    totalSentencesChanged: number;
    totalWordsChanged: number;
    changeRatio: number;
  };
}
```

### What the Diff Expresses Now

**Before** (positional):
> "Paragraph 3, sentence 0 changed. Paragraphs 4-6 shifted to 5-7."

**After** (semantic):
> "Paragraph p_x7k2 (fulcrum) sentence s_m3p9 (thesis anchor, [U4]) changed:
> old text replaced with new text making a different claim.
> A new paragraph p_r8t5 was inserted before it (no prior identity).
> All existing entities retained their identity — only positional indices updated."

The focused analysis pipeline can now ask: "What happened to the entity that hosts observation [U4]?" instead of "What happened to paragraph 3, sentence 0?" — which might be a completely different sentence after an insertion.

### ReanalysisBrief Impact

```typescript
interface ReanalysisBrief {
  netChanges: Array<{
    /** Entity-addressed location */
    entityId: EntityId;
    /** Positional hint for backward compat */
    location: { paragraph: number; sentence?: number };
    oldText: string;
    newText: string;
    significance: string;
    changeType: string;
    appearsToHaveReverted?: boolean;
  }>;

  structural: {
    /** Entity IDs of changed paragraphs */
    paragraphsChanged: EntityId[];
    /** Positional indices for backward compat */
    paragraphIndicesChanged: number[];
    hasReordering: boolean;
    hasInsertions: boolean;
    hasDeletions: boolean;
    changeScope: 'sentence' | 'paragraph' | 'multi_paragraph' | 'essay_level';
  };

  // ... rest unchanged
}
```

---

## 4. Identity Assignment Protocol

### Who Assigns What, When

| Layer | What Gets Assigned | Mechanism |
|---|---|---|
| **L1 (Deterministic)** | `entityId` for every paragraph and sentence | Generated via `nanoid(8)` at first observation. Paragraph IDs prefixed `p_`, sentence IDs prefixed `s_`. |
| **L2 (Structural Cartographer)** | `semanticAddress.structuralRole` for paragraphs | L2 already assigns `paragraphRoles[].role`. Map this to the paragraph's `semanticAddress`. |
| **L3 (Understanding Walk)** | `semanticAddress.observationLabel` for sentences, `semanticAddress.narrativeFunction` for sentences | L3 already produces observation labels [U1], [U2]. Map these to the sentence's semantic address. |
| **L3.75 (Holistic Synthesis)** | No new identity assignment | Consumes entity IDs, doesn't create them. |
| **L3.5 (Analysis Pass)** | No new identity assignment | Consumes entity IDs, doesn't create them. |
| **Edit Service** | `entityId` for newly inserted paragraphs/sentences | When an edit adds new content, the re-identification service assigns fresh entity IDs. |

### The EntityId Generation Protocol

```typescript
import { nanoid } from 'nanoid';

function generateParagraphId(): EntityId {
  return `p_${nanoid(8)}`;
}

function generateSentenceId(): EntityId {
  return `s_${nanoid(8)}`;
}
```

Entity IDs are:
- **Generated once** at first observation (L1 for initial analysis, Edit Service for new content)
- **Never regenerated** — even if the paragraph is completely rewritten, the entity keeps its ID (staleness marks it for re-analysis, but identity persists)
- **Orphaned** only when the paragraph/sentence is deleted entirely
- **Never reused** — a deleted entity's ID is retired permanently

### Content Fingerprint Generation

The content fingerprint is a lightweight signal for re-identification, not a primary key.

```typescript
/**
 * Generate a content fingerprint from a text segment.
 *
 * Strategy: extract the 3-5 most distinctive tokens (proper nouns,
 * unusual words, numbers) and hash them. This is robust to:
 * - Rephrasing (distinctive words usually survive)
 * - Minor additions/deletions (fingerprint uses a subset of tokens)
 *
 * NOT robust to complete rewrites — that's intentional. A complete
 * rewrite IS a new entity semantically.
 */
function generateContentFingerprint(text: string): string {
  // 1. Tokenize and lowercase
  const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  // 2. Remove common stop words
  const STOP_WORDS = new Set(['the', 'and', 'was', 'were', 'that', 'this',
    'with', 'for', 'from', 'but', 'not', 'are', 'has', 'had', 'have',
    'its', 'his', 'her', 'their', 'our', 'which', 'when', 'where',
    'who', 'what', 'how', 'why', 'been', 'being', 'would', 'could',
    'should', 'into', 'about', 'than', 'then', 'them', 'they',
    'she', 'him', 'each', 'all', 'will', 'more', 'some', 'very']);
  const distinctive = tokens.filter(t => !STOP_WORDS.has(t));

  // 3. Sort by rarity (longer words tend to be more distinctive)
  //    and take top 5
  const sorted = distinctive.sort((a, b) => b.length - a.length).slice(0, 5);

  // 4. Hash the sorted distinctive tokens
  const fingerprint = sorted.join('|');
  return hashToHex(fingerprint, 8);  // 8-char hex hash
}

function hashToHex(s: string, length: number): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(length, '0').slice(0, length);
}
```

---

## 5. Re-identification Protocol

This is the most novel and critical component. When the student edits the essay, the system must determine: "Is this paragraph in the new text the SAME ENTITY as paragraph p_x7k2 in the old text, or is it genuinely new?"

### The Three-Tier Matching Algorithm

Re-identification runs as **Step 0.5** — after the mechanical diff (Step 0, no LLM) but before the triviality filter (Step 1, Haiku). It is pure TypeScript, no LLM calls.

```
Input:  oldParagraphs: ParagraphProfile[]  (with entityIds + semanticAddresses)
        newParagraphTexts: string[]        (raw text, no identity yet)

Output: MatchResult[] — one per new paragraph, either matched or novel
```

#### Tier 1: Exact Content Match (O(n) — instant)

```
For each new paragraph:
  Hash the full text
  If any old paragraph has the same hash → CONFIRMED match (confidence: 1.0)
  Mark both as consumed (1:1 matching, no duplicates)
```

This handles: unchanged paragraphs, reordered paragraphs.

#### Tier 2: Content Fingerprint Match (O(n²) — still instant for essay-length texts)

```
For each unmatched new paragraph:
  Generate its content fingerprint
  For each unconsumed old paragraph:
    Compute fingerprint overlap (Jaccard on distinctive tokens)
    If overlap > 0.6 → candidate match

  Among candidates, pick the one with highest overlap
  If best overlap > 0.6 → CONFIRMED match (confidence: overlap score)
```

This handles: rephrased paragraphs (same key ideas, different words), minor additions/deletions within a paragraph.

#### Tier 3: Role + Topology Match (O(n² × connections) — still fast for essays)

```
For each still-unmatched new paragraph:
  Run a lightweight role classifier (string matching on first/last sentence patterns):
    - Starts with concrete scene → likely 'hook'
    - Contains "but", "however", "yet" centrally → likely 'pivot'/'fulcrum'
    - Final paragraph with reflection language → likely 'resolution'

  For each unconsumed old paragraph:
    If role match AND positional distance < 2 → candidate match
    Bonus: if the old paragraph's connections point to entities already
           matched in the new text, topology confirms the match

  If best candidate found → TENTATIVE match (confidence: 0.4-0.7)
```

This handles: heavily rewritten paragraphs that keep the same structural role.

#### Unmatched Entities

After all three tiers:
- **Unmatched new paragraphs** → assign fresh entityIds (genuinely new content)
- **Unconsumed old paragraphs** → orphaned (deleted content)
  - All references to orphaned entities are flagged for cleanup
  - Connections involving orphaned entities are marked `broken`
  - Staleness entries for orphaned entities are removed

### Sentence-Level Re-identification

Within a matched paragraph, the same 3-tier algorithm runs at sentence level:

1. Exact match (same text hash)
2. Fingerprint match (key phrase overlap)
3. Function match (observation labels, narrative function)

Sentence matching is simpler because the search space is tiny (5-10 sentences per paragraph).

### Why Not Use an LLM for Re-identification?

Cost and latency. Re-identification runs on every keystroke (debounced). Even Haiku at $0.001 per call would add up quickly during active editing sessions. The three-tier mechanical algorithm handles 95%+ of cases correctly. The remaining edge cases (complete structural overhaul) should trigger comprehensive re-analysis anyway, which rebuilds identity from scratch.

### The Index Recomputation Step

After re-identification, positional indices are recomputed:

```typescript
function recomputePositionalIndices(
  paragraphs: ParagraphProfile[],
  matchResults: MatchResult[],
  newTexts: string[]
): void {
  // paragraphs array is rebuilt in new-text order
  // Each paragraph gets its index set to its position in the array
  for (let i = 0; i < paragraphs.length; i++) {
    const oldIndex = paragraphs[i].index;
    paragraphs[i].index = i;

    // Recompute sentence indices within each paragraph
    for (let j = 0; j < paragraphs[i].sentences.length; j++) {
      paragraphs[i].sentences[j].index = j;
    }
  }
}
```

This replaces the current `index_remap` with `paragraphMap: Map<number, number>`. Instead of mapping old indices to new indices (which is fragile — what if two paragraphs swap?), we simply recompute all indices from the stable entity array.

---

## 6. Migration Strategy

### Guiding Principle: Dual-Address Coexistence

The migration MUST NOT break existing code. The strategy is:

1. **Add entity identity fields** alongside existing positional fields
2. **New code** reads/writes entity identity
3. **Old code** continues reading positional fields (which are kept in sync)
4. **Gradually migrate** old code to use entity identity
5. **Eventually deprecate** positional-as-identity (keep positional-as-cache)

### Phase 1: Add Entity IDs (Non-Breaking)

**Files changed:** `profileTypes.ts` only.

Add `entityId` and `semanticAddress` as **optional** fields on all relevant types:

```typescript
interface ParagraphProfile {
  entityId?: EntityId;                          // NEW — optional during migration
  semanticAddress?: ParagraphSemanticAddress;    // NEW — optional during migration
  index: number;                                 // KEPT — still works for old code
  // ... everything else unchanged
}

interface SentenceProfile {
  entityId?: EntityId;                           // NEW
  semanticAddress?: SentenceSemanticAddress;      // NEW
  index: number;                                  // KEPT
  // ... everything else unchanged
}

interface Connection {
  id: string;
  from: [number, number];                         // KEPT — old format
  fromEntity?: EntityRef;                         // NEW — entity format
  to: [number, number];                           // KEPT — old format
  toEntity?: EntityRef;                           // NEW — entity format
  // ... everything else unchanged
}
```

**Why optional?** Because existing profiles in the database don't have entity IDs yet. Making them required would break deserialization. We'll backfill them lazily (see Phase 2).

**Impact:** Zero. No existing code breaks. No behavior changes.

### Phase 2: Assignment + Backfill

**Files changed:** `analysisOrchestrator.ts` (pipeline entry), `essayProfileManager.ts` (coordinator).

1. **New profiles**: L1 assigns entityIds to all paragraphs and sentences at creation time.
2. **Existing profiles**: When a profile is loaded and `entityId` is missing, generate and persist one.
   This is a one-time backfill — once assigned, the ID is permanent.

```typescript
// In the coordinator's loadProfile or initialize:
function backfillEntityIds(profile: EssayProfile): void {
  for (const para of profile.paragraphs) {
    if (!para.entityId) {
      para.entityId = generateParagraphId();
      para.semanticAddress = {
        structuralRole: 'unassigned',
        roleOrdinal: para.index,
        contentFingerprint: generateContentFingerprint(para.text),
      };
    }
    for (const sent of para.sentences) {
      if (!sent.entityId) {
        sent.entityId = generateSentenceId();
        sent.semanticAddress = {
          parentEntityId: para.entityId,
          narrativeFunction: 'unassigned',
          contentFingerprint: generateContentFingerprint(sent.text),
        };
      }
    }
  }
}
```

3. **Connection backfill**: For each Connection where `fromEntity`/`toEntity` are missing,
   look up the entity at the positional coordinates and populate the entity refs.

```typescript
function backfillConnectionEntities(profile: EssayProfile): void {
  for (const conn of profile.connections.all) {
    if (!conn.fromEntity) {
      const para = profile.paragraphs[conn.from[0]];
      const sent = para?.sentences[conn.from[1]];
      if (para && sent) {
        conn.fromEntity = { entityId: sent.entityId!, index: conn.from[1] };
      }
    }
    // Same for toEntity
  }
}
```

**Impact:** Minimal. All existing code still reads positional fields. Entity fields are populated but unused by old code.

### Phase 3: New Consumers Use Entity Identity

**Files changed:** `versionTracker.ts`, `editUnderstandingService.ts`, `focusedAnalyzer.ts`, `reanalysisOrchestrator.ts`.

Migrate the edit pipeline first (highest value — this is where positional identity breaks most often):

1. **editUnderstandingService.computeEditDiff()** → runs re-identification as Step 0.5, produces EditDiff v2 with entity-addressed changes.
2. **versionTracker.effectKey()** → uses entityId instead of positional indices.
3. **focusedAnalyzer** → references sentences by entityId, not `updatedParagraphIndex`.

During this phase, both old and new fields are populated. New code reads entity fields; old code reads positional fields.

### Phase 4: Migrate Connection Consumers

**Files changed:** `profileRouter.ts` (13 routing rules), `essayProfileManager.ts` (mutation dispatch).

The profile router's `findConnectedParagraphs()` and `findConnectedSentences()` switch from:
```typescript
if (entry.from[0] === paragraphIndex)
```
to:
```typescript
if (entry.fromEntity?.entityId === paragraphEntityId)
```

With a fallback to positional matching for connections that haven't been backfilled yet.

### Phase 5: Deprecate Positional-as-Identity

**Files changed:** `profileTypes.ts` — mark positional fields with `@deprecated` JSDoc.

```typescript
interface ParagraphProfile {
  entityId: EntityId;                          // now required
  semanticAddress: ParagraphSemanticAddress;   // now required
  /** @deprecated Use entityId for identity. This field is derived and cached. */
  index: number;
  // ...
}
```

The `index` field is NEVER removed — it's useful for array access and display. But it's no longer the source of truth for anything.

### Phase 6: Remove Connection Positional Tuples

```typescript
interface Connection {
  id: string;
  /** @deprecated Use fromEntity.entityId */
  from?: [number, number];
  fromEntity: EntityRef;       // now required
  /** @deprecated Use toEntity.entityId */
  to?: [number, number];
  toEntity: EntityRef;         // now required
  // ...
}
```

### Summary of Migration Phases

| Phase | Scope | Breaking? | Files | Risk |
|---|---|---|---|---|
| 1 | Add optional fields to types | No | profileTypes.ts | None |
| 2 | Assign + backfill IDs | No | orchestrator, coordinator | Low — additive only |
| 3 | Edit pipeline uses entity IDs | No | versionTracker, editService, focusedAnalyzer, reanalysisOrch | Medium — dual-path logic |
| 4 | Router uses entity IDs | No | profileRouter, coordinator | Medium — 13 routing rules |
| 5 | Deprecate positional-as-identity | No | profileTypes.ts (docs only) | None |
| 6 | Remove positional tuples from Connection | Yes (old Connection format) | profileTypes.ts, all Connection consumers | Low — by this point all consumers migrated |

---

## 7. Open Questions

### Q7a: Observation Label as Paragraph Identity

Current state: Observation labels ([U1], [U2]) exist only for sentence-level observations. Should paragraphs also get labels?

**Recommendation**: Yes, but use the structural role directly rather than a new label scheme. The NorthStar's `StructuralRole` already provides this: `[P-hook]`, `[P-fulcrum]`, `[P-resolution]`. These are more semantically meaningful than arbitrary `[P1]`, `[P2]` labels.

For prompts and coaching, paragraphs would be referenced as:
- `[P-hook] (p_x7k2)` — human-readable role + stable ID
- `[P-evidence:0] (p_m3p8)` — role + ordinal for disambiguation

### Q7b: What If Two Paragraphs Have the Same Role?

Common case: two "evidence" paragraphs, two "context" paragraphs.

**Solution**: The `roleOrdinal` field handles this. "evidence:0" and "evidence:1" are distinct. Ordinals are assigned based on the paragraph's position in the essay — the first evidence paragraph is ordinal 0, the second is ordinal 1.

If the paragraphs are reordered, ordinals update but entity IDs don't. So "evidence:0" might become "evidence:1" (new ordinal), but `p_x7k2` is still `p_x7k2`.

### Q7c: Content Fingerprint Collision

What if two paragraphs have the same content fingerprint?

**Impact**: Tier 2 re-identification might match the wrong entity. Mitigated by:
- Fingerprint overlap must be >0.6 (not exact match)
- Ties broken by positional proximity (prefer the closer match)
- Tier 3 (role + topology) provides a second signal
- Wrong matches are self-correcting: the stale understanding will be overwritten on the next analysis pass

### Q7d: Performance of Re-identification on Large Edits

For a student who pastes an entirely new essay (common when switching drafts):

- Tier 1: O(n) hash comparisons — instant for 5-10 paragraphs
- Tier 2: O(n²) fingerprint comparisons — instant for 5-10 × 5-10 = 25-100 comparisons
- Tier 3: O(n² × k) where k = connection count — still instant for essay scale

Total: < 1ms. Not a performance concern.

For massive edits (>70% change), the system should detect this and skip re-identification entirely → assign all-new entity IDs → trigger comprehensive re-analysis. This is the existing behavior (>70% paragraph change ratio triggers full reanalysis).

### Q7e: Persistence Format

Entity IDs need to survive database round-trips. Since the profile is stored as JSONB in Supabase:

- `entityId` is a string field → serializes naturally
- `semanticAddress` is a nested object → serializes naturally
- `EntityRef` in connections → serializes naturally
- **No schema migration needed** — JSONB is schema-flexible

The only consideration is ensuring backfill runs on load for profiles created before entity identity existed.

### Q7f: Connection Graph in ProfileIndex

The `ProfileIndex.connectionGraph` currently uses positional tuples:
```typescript
connectionGraph: Array<{ from: [number, number]; to: [number, number]; type: string }>;
```

This should migrate to:
```typescript
connectionGraph: Array<{
  from: EntityRef;
  to: EntityRef;
  type: string;
  // Keep positional tuples for backward compat during migration
  fromPosition?: [number, number];
  toPosition?: [number, number];
}>;
```

But since `ProfileIndex` is recomputed on every mutation (via `recomputeIndex()`), this migration is low-risk — just update the `recomputeIndex()` function.

### Q7g: LLM Prompt Impact

LLM prompts currently reference paragraphs by index: "Paragraph 3's opening sentence..."

With entity identity, prompts would reference: "The fulcrum paragraph (p_x7k2)..."

**Decision**: Use semantic address in prompts (human-readable), entity ID in structured output (machine-readable). The prompt builder should translate entity IDs to semantic descriptions for LLM consumption, and parse LLM output back to entity IDs.

Example prompt snippet:
```
The FULCRUM paragraph (the one beginning "Standing in the pawnshop..."):
  Sentence 1 [U4] (thesis anchor): "The diamond wasn't just a stone..."
  Sentence 2 [U5]: "It was everything my grandmother..."
```

The LLM never sees `p_x7k2m9aB` — it sees the semantic description. The system maps between the two.

### Q7h: Backward Compatibility of editUnderstandingService.computeEditDiff()

The current `computeEditDiff()` (editUnderstandingService.ts:234) is a pure function that takes `(oldText: string, newText: string) → EditDiff`. It has no access to the profile or entity IDs.

**Solution**: Change the signature to accept the current profile:

```typescript
function computeEditDiff(
  oldText: string,
  newText: string,
  currentProfile?: EssayProfile  // optional — if provided, enables entity-addressed diff
): EditDiff {
  // Step 0: Mechanical diff (existing code, unchanged)
  // Step 0.5: Re-identification (NEW — only if currentProfile provided)
  // Return: EditDiff v2 with entity addresses populated
}
```

When `currentProfile` is not provided (backward compat), the function produces a positional-only diff as today.

### Q7i: What Happens to the `index_remap` LightTouchUpdate?

The current `index_remap` type on `LightTouchUpdate` with `paragraphMap: Map<number, number>` is effectively **replaced** by the re-identification protocol.

Instead of:
> "Old paragraph 3 is now at position 5" (fragile arithmetic)

The system says:
> "Entity p_x7k2 was at position 3, is now at position 5" (identity preserved, position recomputed)

The `index_remap` update type can be deprecated in favor of a new `entity_reindex` type:

```typescript
interface LightTouchUpdate {
  type: 'text_reference' | 'structural_bookkeeping' | 'entity_reindex'
       | 'staleness_application' | 'inferred_intent';

  /** For entity_reindex: recompute all positional indices from entity array order */
  entityReindex?: {
    /** Entities that were orphaned (deleted from essay) */
    orphanedEntities: EntityId[];
    /** Entities that are novel (new content, fresh IDs assigned) */
    novelEntities: EntityId[];
    /** Entities whose positional index changed */
    repositionedEntities: Array<{ entityId: EntityId; oldIndex: number; newIndex: number }>;
  };
}
```

This is both more informative and more robust than the current `paragraphMap` approach.

### Q7j: Interaction with ProfileConnections.imageRecurrences and narrativeArcMap

These currently use positional tuples:
```typescript
imageRecurrences: Array<{ image: string; locations: Array<[number, number]> }>;
narrativeArcMap: Array<{ role: string; location: [number, number] }>;
```

These should migrate to entity references:
```typescript
imageRecurrences: Array<{ image: string; locations: Array<EntityRef> }>;
narrativeArcMap: Array<{ role: string; entity: EntityRef }>;
```

This is a Phase 4 change (same wave as Connection migration).

---

## Appendix A: Affected Files Inventory

| File | Phase | Changes |
|---|---|---|
| `profileTypes.ts` | 1 | Add EntityId, EntityRef, SemanticAddress types. Add optional fields to ParagraphProfile, SentenceProfile, Connection, StalenessTarget, EditDiff, LightTouchUpdate, ReanalysisBrief, ProfileIndex. |
| `analysisOrchestrator.ts` | 2 | Assign entityIds in L1 step. |
| `essayProfileManager.ts` | 2, 4 | Backfill entityIds on profile load. Update `applyLightTouchUpdate` index_remap → entity_reindex. Update staleness dispatch. |
| `editUnderstandingService.ts` | 3 | Add re-identification as Step 0.5. Update computeEditDiff signature. Produce entity-addressed EditDiff. |
| `versionTracker.ts` | 3 | Update effectKey() and locationKey() to use entityIds. Update PendingChange.location. |
| `focusedAnalyzer.ts` | 3 | Reference sentences by entityId instead of paragraph+sentence index. |
| `reanalysisOrchestrator.ts` | 3 | Pass profile to computeEditDiff for entity resolution. |
| `profileRouter.ts` | 4 | Update all 13 routing rules to use entityId lookups (with positional fallback). Update findConnectedParagraphs, findConnectedSentences. |
| `sequentialDeepWalk.ts` | 4 | L3 writes observation labels to sentence semanticAddress. |
| `holisticSynthesis.ts` | 4 | Reference paragraphs by entityId in holistic sections. |
| `analysisPass.ts` | 4 | Reference paragraphs by entityId in analysis output. |
| `crystallizer.ts` | 4 | Reference entities in NorthStar structural roles. |
| `deepAnnotationService.ts` | 4 | Reference entities in feedback annotations. |
| `coaching/coachingService.ts` | 4 | Reference entities in coaching responses. |

---

## Appendix B: Entity Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTITY LIFECYCLE                              │
│                                                                 │
│  1. BIRTH                                                       │
│     ┌──────────────┐                                            │
│     │ First Analysis│─── entityId = p_x7k2 (permanent)          │
│     │ (L1 runs)     │─── semanticAddress = { role: 'unassigned'}│
│     │               │─── index = 2                              │
│     └───────┬───────┘                                           │
│             │                                                   │
│  2. ENRICHMENT                                                  │
│     ┌───────▼───────┐                                           │
│     │ L2 Runs       │─── semanticAddress.role = 'fulcrum'       │
│     │ (role assigned)│─── entityId unchanged                    │
│     └───────┬───────┘                                           │
│             │                                                   │
│     ┌───────▼───────┐                                           │
│     │ L3 Runs       │─── sentences get observation labels       │
│     │ (deep walk)   │─── entityIds unchanged                    │
│     └───────┬───────┘                                           │
│             │                                                   │
│  3. EDIT CYCLE                                                  │
│     ┌───────▼───────┐                                           │
│     │ Student edits │─── re-identification matches entity       │
│     │ the paragraph │─── entityId = SAME p_x7k2                │
│     │               │─── index might change (if insert above)  │
│     │               │─── semanticAddress.fingerprint updates    │
│     │               │─── understanding marked stale             │
│     └───────┬───────┘                                           │
│             │                                                   │
│  4. RE-ANALYSIS                                                 │
│     ┌───────▼───────┐                                           │
│     │ Focused/Full  │─── understanding refreshed                │
│     │ re-analysis   │─── entityId = SAME p_x7k2                │
│     │               │─── semanticAddress.role might change      │
│     └───────┬───────┘                                           │
│             │                                                   │
│  5. DEATH (deletion)                                            │
│     ┌───────▼───────┐                                           │
│     │ Student deletes│─── entity orphaned                       │
│     │ the paragraph  │─── connections marked 'broken'           │
│     │                │─── staleness entries cleaned up           │
│     │                │─── entityId retired (never reused)        │
│     └────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix C: Quick Reference — Before/After

| Concept | Before (Positional) | After (Entity) |
|---|---|---|
| "Which paragraph?" | `index: 3` | `entityId: 'p_x7k2'` |
| "Which sentence?" | `paragraph: 3, sentence: 1` | `entityId: 's_m3p9'` |
| "What connects?" | `from: [2, 0], to: [4, 1]` | `fromEntity: { entityId: 's_a1b2' }, toEntity: { entityId: 's_c3d4' }` |
| "What's stale?" | `paragraph:3` | `paragraph:p_x7k2` |
| "What changed?" | `paragraphIndex: 3` | `entityId: 'p_x7k2', newIndex: 4, previousIndex: 3` |
| "Insert above?" | Everything shifts, all refs wrong | Entities stable, only indices recomputed |
| "Delete P2?" | P3→P2, P4→P3, refs cascade | p_x7k2 orphaned, other entities untouched |
| "Reorder?" | Map<old, new> arithmetic | Entities unchanged, indices recomputed |
