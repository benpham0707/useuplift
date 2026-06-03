# Implementation Blueprint: Scope 3 — Research Database Integration

After this ships, every improvement the pipeline emits is late-bound at coaching session init with a research-backed before/after demonstration (up to 75 verified pairs from `researchBackedTeachingService.ts` → `TEACHING_KNOWLEDGE_BASE`, structured as 26 issue types each with nested `transformations[]` arrays — NOT the 14-entry flat `transformationExamples.ts` file), a research-backed stakes explanation, a source citation, and — when `collegeId` is present — a college-specific tailoring note and an anonymized elite-essay pattern for 10 of 13 supported colleges. Zero new LLM calls, <15ms total enrichment latency per session, idempotent via a single flag, fail-open on every lookup.

---

## Core Types and Contracts

### Contract with Scope 2

Scope 3 is designed against the **existing** `ImprovementEntry` / `ImprovementManifest` shape in `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2380-2428` (verified by grep). This shape already covers what Scope 3 needs to enrich:

```typescript
// profileTypes.ts:2380 (current, unchanged by Scope 3)
export interface ImprovementEntry {
  id: string;
  paragraph: number;
  observation: string;
  action: string;
  stakes: string;                       // Scope 3 upgrades when empty/thin
  technique: string | null;             // Scope 3 reads for issue-type routing
  demonstration: string | null;         // Scope 3 fills when null
  wordEconomyCut: string | null;
  source: 'l4_priority' | 'l35_finding' | 'l375_growth_edge' | 'l3_observation' | 'l5_annotation' | 'red_flag' | 'ao_first_read';
  sourceRef: string | null;             // Scope 3 reads-only (already used by Scope 2 for finding IDs)
  priority: number;
  impact: 'transformative' | 'significant' | 'incremental';
  conversatorEnrichments: string[];
}
```

**Divergence contract**: If Scope 2 renames `ImprovementEntry` to `ImprovementCandidate`, or restructures the source enum, Scope 3's enrichment function MUST be robust to either shape via a minimal type guard (see "Robustness to Scope 2 drift" below). Scope 3 never requires a field Scope 2 doesn't provide — it only writes additive fields.

**What Scope 3 requires from Scope 2's entry shape**:
- Readable: `technique` (string | null), `observation` (string), `action` (string), `stakes` (string), `sourceRef` (string | null), `demonstration` (string | null)
- Writable: `demonstration`, `stakes`, plus the three new optional fields below

**What Scope 3 does NOT require**: Any specific field on `PipelineInput`. `collegeId` never enters the analysis pipeline — it is bound at coaching time.

### New type additions (additive only)

Two additions to `ImprovementEntry` and one to `ImprovementManifest` in `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts`. All three fields are optional so pre-existing code paths that construct `ImprovementEntry` / `ImprovementManifest` literals (currently 6 call sites in `analysisOrchestrator.ts:1446-1605`) compile without edits.

```typescript
// Added to ImprovementEntry after line 2406 (conversatorEnrichments)

  /**
   * Scope 3: Research-backed principle + mechanism, populated by
   * enrichWithResearchDatabase() at coaching session init from
   * TEACHING_KNOWLEDGE_BASE in researchBackedTeachingService.
   * Absent/null when no IssueType mapping was resolved.
   */
  researchBacking?: {
    /** Core principle behind the transformation (e.g., "Start at the point of highest tension") */
    principle: string;
    /** Mechanism explanation of why the "after" version works */
    whyItWorks: string;
    /** IssueType string used for the lookup (provenance trail) */
    sourceRef: string;
    /** Optional source_id from SourceCitation when getWhyThisMatters returned one */
    citationId?: string;
  } | null;

  /**
   * Scope 3: College-specific tailoring note for supplement essays.
   * Populated only when collegeId is present AND
   * researchBackedTeachingService.getCollegeSpecificGuidance() has an insight
   * OR the college has a populated eliteExamples entry.
   * Null is the correct "not applicable" value — not a failure.
   */
  collegeNote?: string | null;
```

```typescript
// Added to ImprovementManifest after line 2427 (wordLimit)

  /**
   * Scope 3: Idempotency flag. Set by enrichWithResearchDatabase() the first
   * time it runs on this manifest. Subsequent coaching turns short-circuit
   * the enrichment when this is true. Not persisted across sessions —
   * the manifest is rebuilt every re-analysis pass.
   */
  _enriched?: boolean;
```

### Robustness to Scope 2 drift

The enrichment function uses property reads with `in` checks so that if Scope 2's type ends up named `ImprovementCandidate`, the enrichment still works if the shape is structurally compatible. See `researchEnrichment.ts` — `resolveIssueType` and the main loop never cast or assume required fields.

---

## Items

### 1. Research Database Bridge: three disconnected namespaces → one enrichment function

**Before**: `researchBackedTeachingService` with 26 issue-type bundles and 75 verified before/after transformations exists in `commonAppWorkshop/` and is imported by zero files in `src/services/essayIntelligence/`. The Essay Intelligence coach maintains a parallel teaching layer (`teachingContentRouter.ts`, `techniqueLibrary.ts`) that reaches 14 transformation examples from the separate `transformationExamples.ts` file but never touches the 75 nested transformation pairs in `TEACHING_KNOWLEDGE_BASE`. Every `ImprovementEntry` exits `buildImprovementManifest()` with `demonstration: null` and `stakes: ''` (or a short `Evidence: "..."` prefix). The student never sees a research-backed demonstration tied to their improvement.

**After**: A single new file, `src/services/essayIntelligence/analysis/researchEnrichment.ts`, exports `enrichWithResearchDatabase(manifest, collegeId?)`. Called once at coaching session init (late-bound because that is where `collegeId` arrives — `collegeId` is NOT on `PipelineInput`). It:

1. Maps each item's `technique` → `IssueType` via the `ROUTE_TO_ISSUE_TYPE` table (20 entries covering all 20 techniques in Scope 2's `TECHNIQUE_VOCABULARY_LIST`). Expanded from the original 14-entry `matchClaimToTechnique()` subset to cover Scope 2's 6 additional LLM-emitted techniques (`COLLABORATIVE SPECIFICITY`, `FUNCTIONAL DETAIL`, `ANTI-LESSON`, `SUSTAINED VULNERABILITY`, `NARRATIVE ARC`, `INCREMENTAL REVELATION`). Mapping decisions for the 6 additions live in `FORGE_PLAN_ARTIFACTS.md` section "6 Missing Technique Mappings".
2. Falls back to `OBSERVATION_KEYWORD_TO_ISSUE` (23 entries) scanning `observation + action` when `technique` is null or unmapped.
3. Calls `researchBackedTeachingService.getTransformations(issueType)` — populates `item.demonstration` (formatted string) and `item.researchBacking` (structured principle/whyItWorks/sourceRef).
4. Calls `researchBackedTeachingService.getWhyThisMatters(issueType)` — upgrades `item.stakes` when empty, thin, or starts with `Evidence:`.
5. If `collegeId` is present, calls `researchBackedTeachingService.getCollegeSpecificGuidance(issueType, collegeId)` — writes `item.collegeNote` when an insight exists. Handles the case-sensitivity bug in `getCollegeInsight()` (Stanford/MIT/Harvard vs stanford/mit/harvard).
6. Sets `manifest._enriched = true` on completion. Subsequent turns short-circuit.

**Implementation**: Complete TypeScript for the new file (copy-pasteable to `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/researchEnrichment.ts`):

```typescript
/**
 * researchEnrichment.ts — Late-bound enrichment of ImprovementManifest
 * with research-backed content from TEACHING_KNOWLEDGE_BASE.
 *
 * Called ONCE per coaching session (not per turn) after the student sends their
 * first message. Pure synchronous lookups into a singleton — zero LLM calls,
 * <15ms total for a 10-item manifest.
 *
 * Design decisions (see docs/archived/forge/FORGE_DEBATES_SCOPE3.md for full rationale):
 *  - Late-bound at coaching time, not at analysis time (collegeId isn't on PipelineInput)
 *  - Mutates the manifest in place (matches existing conversatorEnrichments.push pattern
 *    at coachingService.ts:1233)
 *  - Idempotent via manifest._enriched flag
 *  - Fail-open: every lookup is wrapped; a miss leaves the field as-is (no fake fallback)
 *  - Structurally-compatible: uses `in` checks so a Scope 2 type rename doesn't break anything
 *
 * Cost / scale verified by grep against the source files:
 *   - TEACHING_KNOWLEDGE_BASE: 26 issue-type bundles, 75 transformation pairs
 *     (24 bundles × 3 transformations + 1 × 2 + 1 × 1 = 75)
 *   - researchBackedTeachingService: static singleton, exported at line 2131
 *   - IssueType union: 32 strings, 26 with teaching bundles
 *
 * @see src/services/commonAppWorkshop/services/researchBackedTeachingService.ts
 * @see src/services/essayIntelligence/profileTypes.ts
 */

import {
  researchBackedTeachingService,
  type IssueType,
} from '../../commonAppWorkshop/services/researchBackedTeachingService';
import type { ImprovementManifest, ImprovementEntry } from '../profileTypes';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE_TO_ISSUE_TYPE
//
// Left side: the full 20 techniques emitted by Scope 2's TECHNIQUE_VOCABULARY_LIST
//   (analysis/techniqueVocabulary.ts). This is a SUPERSET of the original 14 routes
//   that matchClaimToTechnique() produced at analysisOrchestrator.ts:1639-1664
//   (deleted by Scope 2 Item 8).
// Right side: IssueType keys that exist in TEACHING_KNOWLEDGE_BASE.
//   (Verified: only 26 of the 32 IssueType union members have teaching bundles.
//    Mappings below target keys confirmed present in the knowledge base.)
//
// Maintenance note: if a new technique is added to TECHNIQUE_VOCABULARY_LIST
// (analysis/techniqueVocabulary.ts) or coachingService.TECHNIQUE_ROUTES, add
// the corresponding IssueType here. The enrichment is fail-open, so a missing
// entry simply leaves the item's demonstration null — not an error. The Scope
// 2 technique vocabulary sync test (tests/test-technique-vocab-sync.ts) should
// also assert that every vocabulary entry has an entry here (or an intentional
// null sentinel for techniques with no TEACHING_KNOWLEDGE_BASE bundle).
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_TO_ISSUE_TYPE: Record<string, IssueType | null> = {
  // Original 14 routes from the deleted matchClaimToTechnique() function:
  'SUMMARY-TO-SCENE':                     'weak_structure',
  'COLD OPEN / SENSORY TIMESTAMP':        'weak_opening',
  'SOMATIC VULNERABILITY':                'telling_not_showing',
  'NAMED CHARACTER':                      'telling_not_showing',
  'EVIDENCE ANCHORING':                   'missing_evidence_of_impact',
  'RITUAL DETAIL / BOOKEND INVERSION':    'weak_ending',
  'VOICE COMPARISON':                     'cliche_ai_convergence',
  'SHOW THROUGH SPECIFIC ACTION':         'telling_not_showing',
  'VOICE AUTHENTICITY':                   'performative_intelligence',
  'DEFINITIONAL PIVOT':                   'cliche_language',
  'STAKES ESTABLISHMENT':                 'passive_victim_framing',
  'SCENE EXPANSION':                      'weak_structure',
  'BRIDGE SENTENCE':                      'weak_transitions',
  'ENACTED PARALLEL':                     'missing_connection_specificity',
  // Scope 2 additions — 6 new LLM-emitted techniques.
  // Mapping decisions (see FORGE_PLAN_ARTIFACTS.md section "6 Missing Technique Mappings"):
  'COLLABORATIVE SPECIFICITY':            'missing_evidence_of_impact',
  'FUNCTIONAL DETAIL':                    'telling_not_showing',
  'ANTI-LESSON':                          'shallow_reflection',
  'SUSTAINED VULNERABILITY':              'telling_not_showing',
  'NARRATIVE ARC':                        'weak_structure',
  // INCREMENTAL REVELATION has no TEACHING_KNOWLEDGE_BASE bundle entry —
  // null is an intentional sentinel so the sync test knows this mapping is
  // deliberately absent, not forgotten. Enrichment fails open for this one.
  'INCREMENTAL REVELATION':               null,
};

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATION_KEYWORD_TO_ISSUE
//
// Fallback used when item.technique is null (L4 priorities never route through
// matchClaimToTechnique — see analysisOrchestrator.ts:1452) or when a technique
// name isn't in ROUTE_TO_ISSUE_TYPE. Scans `observation + action` lowercased.
//
// Ordered MOST-SPECIFIC first so the first match wins (a later shorter keyword
// would otherwise shadow a more-targeted earlier match).
// ─────────────────────────────────────────────────────────────────────────────

const OBSERVATION_KEYWORD_TO_ISSUE: Array<{ keywords: string[]; issueType: IssueType }> = [
  // Structure / narrative shape
  { keywords: ['summary mode', '30,000 feet', 'narrates from distance', 'chronological'], issueType: 'weak_structure' },
  { keywords: ['opening', 'hook', 'first sentence', 'first line', 'put-down risk'],       issueType: 'weak_opening' },
  { keywords: ['conclusion', 'ending', 'closing', 'resolution'],                          issueType: 'weak_ending' },
  { keywords: ['transition', 'disconnected', 'abrupt shift', 'bridge'],                   issueType: 'weak_transitions' },

  // Telling vs showing / voice
  { keywords: ["show don't tell", 'telling not showing', 'abstract claim', 'telling'],    issueType: 'telling_not_showing' },
  { keywords: ['ai convergence', 'sounds like everyone', 'ai-generated', 'formulaic'],    issueType: 'cliche_ai_convergence' },
  { keywords: ['cliché', 'cliche', 'overused', 'template phrase'],                        issueType: 'cliche_language' },
  { keywords: ['inspirational', 'completely changed my life', 'transformed me'],          issueType: 'cliche_inspirational' },

  // Epiphany / vulnerability / victim framing
  { keywords: ['epiphany', 'sudden realization', 'in that moment i knew'],                issueType: 'false_epiphany' },
  { keywords: ['performative vulnerability', 'calculated vulnerability', 'strategic'],    issueType: 'strategic_vulnerability' },
  { keywords: ['passive', 'victim', 'happened to me', 'suffered through'],                issueType: 'passive_victim_framing' },
  { keywords: ['premature resolution', 'too neat', 'wrapped up', 'tidy'],                 issueType: 'premature_resolution' },

  // Intellectual / craft depth
  { keywords: ['performative intelligence', 'thesaurus', 'big words', 'vocabulary'],      issueType: 'performative_intelligence' },
  { keywords: ['missing technical depth', 'methodology', 'jargon without', 'expertise'],  issueType: 'missing_technical_depth' },
  { keywords: ['generic insight', 'anyone could have', 'generic takeaway'],               issueType: 'missing_unique_insight' },
  { keywords: ['no metrics', 'claims without proof', 'evidence of impact'],               issueType: 'missing_evidence_of_impact' },
  { keywords: ['intellectual', 'curiosity', 'thinking process', 'how you think'],         issueType: 'missing_intellectual_engagement' },
  { keywords: ['over-narrated', 'too much story', 'narrative heavy'],                     issueType: 'over_narrated' },
  { keywords: ['no thinking', 'actions but no thought', 'missing internal'],              issueType: 'missing_character_through_thought' },
  { keywords: ['shallow reflection', 'surface-level', 'learned that i'],                  issueType: 'shallow_reflection' },
  { keywords: ['oversimplified', 'no nuance', 'no complexity'],                           issueType: 'missing_complexity' },
  { keywords: ['missing systems', 'systems awareness', 'structural constraint'],          issueType: 'missing_systems_awareness' },
  { keywords: ['why us', 'swap test', 'generic fit', 'connection specificity'],           issueType: 'missing_connection_specificity' },
];

// ─────────────────────────────────────────────────────────────────────────────
// College ID normalization
//
// The researchBackedTeachingService.getCollegeInsight() internal map is keyed
// on CAPITALIZED names ('Stanford', 'MIT', 'Harvard') — verified at
// researchBackedTeachingService.ts:2063-2077 — while collegeOverlay.ts uses
// lowercase IDs ('stanford', 'mit', 'harvard'). Normalize inbound collegeId
// to try both forms.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeCollegeIdsForLookup(collegeId: string): string[] {
  const lower = collegeId.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const upper = lower.toUpperCase(); // MIT, NYU, UCLA, USC, CMU
  // De-duplicated preserving insertion order (lower → capitalized → upper)
  return Array.from(new Set([lower, capitalized, upper]));
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveIssueType
//
// Returns null when no confident mapping — triggers graceful skip for the item.
// Structurally-compatible read of `technique`, `observation`, `action` so that
// a Scope 2 shape drift (e.g., renaming the type) does not break this function.
// ─────────────────────────────────────────────────────────────────────────────

function resolveIssueType(item: ImprovementEntry): IssueType | null {
  // Primary: named-technique direct mapping
  const technique = (item as { technique?: string | null }).technique ?? null;
  if (technique) {
    const mapped = ROUTE_TO_ISSUE_TYPE[technique];
    if (mapped) return mapped;
  }

  // Fallback: keyword scan over observation + action
  const observation = (item as { observation?: string }).observation ?? '';
  const action = (item as { action?: string }).action ?? '';
  const searchText = `${observation} ${action}`.toLowerCase();

  for (const bridge of OBSERVATION_KEYWORD_TO_ISSUE) {
    if (bridge.keywords.some(kw => searchText.includes(kw))) {
      return bridge.issueType;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// enrichWithResearchDatabase — the single exported function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enrich an ImprovementManifest in place with research-backed content.
 *
 * Idempotent: checks manifest._enriched and returns early on repeat calls.
 * Fail-open: wraps each service call in try/catch; any lookup failure leaves
 * the item as it was (NEVER writes fake fallback content).
 * Synchronous: all lookups hit in-memory Maps / static objects via the
 * researchBackedTeachingService singleton. Total cost <15ms for 10 items.
 *
 * @param manifest - The ImprovementManifest to enrich (mutated in place).
 * @param collegeId - Optional lowercase college ID for supplement-specific
 *                    tailoring. Absent for common_app essays with no target.
 * @returns The same manifest reference (mutated), for chaining convenience.
 */
export function enrichWithResearchDatabase(
  manifest: ImprovementManifest,
  collegeId?: string,
): ImprovementManifest {
  // ── Idempotency ──
  if (manifest._enriched) return manifest;
  if (!manifest.items || manifest.items.length === 0) {
    manifest._enriched = true;
    return manifest;
  }

  let demonstrationsFilled = 0;
  let stakesUpgraded = 0;
  let collegeNotesAttached = 0;

  for (const item of manifest.items) {
    let issueType: IssueType | null;
    try {
      issueType = resolveIssueType(item);
    } catch (err) {
      // X28 fix from R2 audit: silent catch violates Operating Doctrine rule 5.
      // A thrown resolveIssueType is unexpected — it means a structural bug
      // in the matching logic, not a missing bundle. Log and continue so
      // the outer loop can still enrich other items.
      console.warn(
        `[researchEnrichment] resolveIssueType threw for item ${item.id}:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
    if (!issueType) continue;

    // ── Demonstration: fill previously-null field ──
    if (!item.demonstration) {
      try {
        const transformations = researchBackedTeachingService.getTransformations(issueType);
        if (transformations && transformations.length > 0) {
          const t = transformations[0];
          item.demonstration =
            `BEFORE: "${t.before}"\n` +
            `AFTER: "${t.after}"\n` +
            `PRINCIPLE: ${t.principle_applied}`;

          // Attach structured version for downstream coaching consumers
          item.researchBacking = {
            principle: t.principle_applied,
            whyItWorks: t.why_it_works,
            sourceRef: issueType,
          };
          demonstrationsFilled++;
        }
      } catch (err) {
        console.warn(`[researchEnrichment] getTransformations failed for ${issueType}:`, err);
      }
    }

    // ── Stakes: upgrade empty or thin (Evidence:) stakes with research ──
    const isThinStakes =
      !item.stakes ||
      item.stakes.trim() === '' ||
      item.stakes.startsWith('Evidence:');

    if (isThinStakes) {
      try {
        const whyMatters = researchBackedTeachingService.getWhyThisMatters(issueType);
        if (whyMatters?.explanation) {
          // Preserve the Evidence: prefix if present — it carries student-specific context
          const evidencePrefix = item.stakes?.startsWith('Evidence:')
            ? `${item.stakes}\n`
            : '';
          item.stakes = evidencePrefix + whyMatters.explanation;
          stakesUpgraded++;

          // Carry source citation into researchBacking if we populated it above
          if (item.researchBacking && whyMatters.source?.source_id) {
            item.researchBacking.citationId = whyMatters.source.source_id;
          }
        }
      } catch (err) {
        console.warn(`[researchEnrichment] getWhyThisMatters failed for ${issueType}:`, err);
      }
    }

    // ── College note: only when collegeId is present ──
    if (collegeId && item.collegeNote == null) {
      // Try multiple case variants because of the Stanford/stanford mismatch
      // between getCollegeInsight() (capitalized) and collegeOverlay (lowercase).
      const variants = normalizeCollegeIdsForLookup(collegeId);
      for (const cid of variants) {
        try {
          const guidance = researchBackedTeachingService.getCollegeSpecificGuidance(
            issueType,
            cid,
          );
          if (guidance?.insight) {
            item.collegeNote = guidance.insight;
            collegeNotesAttached++;
            break;
          }
        } catch (err) {
          console.warn(`[researchEnrichment] getCollegeSpecificGuidance failed for ${cid}/${issueType}:`, err);
        }
      }
    }
  }

  // ── Systemic failure escalation (X26 fix from R2/R4 audit) ──
  // Distinguishes "this essay has no matched issue types" (legitimate, loop
  // silently misses every item) from "research database broken" (must fail loudly).
  // The fail-open pattern is correct for INDIVIDUAL misses (CLAUDE.md rule 4: "missing-data is not failure");
  // but total systemic failure on a manifest with >3 items means the
  // ROUTE_TO_ISSUE_TYPE table, OBSERVATION_KEYWORD_TO_ISSUE table, or the
  // researchBackedTeachingService itself is corrupted. Surface it as PipelineError.
  if (
    demonstrationsFilled === 0 &&
    stakesUpgraded === 0 &&
    manifest.items.length > 3
  ) {
    throw new PipelineError({
      layer: 'ResearchEnrichment',
      reason: 'all lookups missed — likely research database corrupted, mapping tables empty, or researchBackedTeachingService not imported correctly',
      diagnosticContext: {
        manifestItemCount: manifest.items.length,
        itemsWithTechnique: manifest.items.filter((i) => i.technique).length,
        routeTableSize: Object.keys(ROUTE_TO_ISSUE_TYPE).length,
        keywordTableSize: OBSERVATION_KEYWORD_TO_ISSUE.length,
      },
    });
  }

  manifest._enriched = true;

  console.log(
    `[researchEnrichment] Enrichment complete — ` +
    `items=${manifest.items.length}, ` +
    `demonstrations=${demonstrationsFilled}, ` +
    `stakes_upgraded=${stakesUpgraded}, ` +
    `college_notes=${collegeNotesAttached}` +
    (collegeId ? ` (college=${collegeId})` : ''),
  );

  return manifest;
}
```

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/analysis/researchEnrichment.ts` — **NEW FILE** (~275 lines including mapping tables and comments)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2406` — add `researchBacking?` and `collegeNote?` optional fields to `ImprovementEntry`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2427` — add `_enriched?: boolean` to `ImprovementManifest`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:849` — insert 9-line enrichment block at the top of `processCoachingTurn()` (see Item 2)

**Cost**: 0 LLM calls. Verified latency: ≤10 `resolveIssueType()` calls (~0.1ms each), ≤10 `getTransformations()` calls (~0.3ms each — static Map access), ≤10 `getWhyThisMatters()` calls (~0.5ms each — Map access + indexer filter), ≤10 `getCollegeSpecificGuidance()` calls (~0.5ms each — indexer filter + hardcoded map lookup × 3 case variants). **Total: <15ms per session for a 10-item manifest.**

**Source**: **refined** — direct path's architecture (single enrichment file, late-bound, idempotency flag) with two corrections lifted from the rethink path: (a) stricter fail-open with per-call try/catch, (b) evidence-prefix preservation when upgrading thin stakes. Additionally corrects four mistakes present in both source blueprints: (i) the actual transformation count is 75 (not 60, not 79) — verified by main-thread count of `TEACHING_KNOWLEDGE_BASE` nested arrays: 24 bundles × 3 + 1 × 2 + 1 × 1 = 75, (ii) `getCollegeInsight()` uses capitalized keys not lowercase, (iii) `CollegeRedFlag.teaching.exampleTransformation` does NOT exist (the field is `exampleFix: string`), (iv) 10 of 13 colleges actually have populated `eliteExamples` (Harvard, MIT, and Stanford are empty).

---

### 2. Coaching Session Hook: one-time enrichment at the first turn

**Before**: `processCoachingTurn()` runs at every turn. `profile.improvementManifest` is read inside `buildImprovementQueueSection()` (line 4117) and `conversatorEnrichments.push()` (line 1233), but no call site ever populates `demonstration`, `researchBacking`, or `collegeNote`. The static mapping tables and the `researchBackedTeachingService` are never imported by any file in `src/services/essayIntelligence/`.

**After**: A 9-line block inserts immediately after the existing initialization (after line 848's `if (!memory.events) { memory.events = []; }`) and before `const phase = profile.index.improvementPhase;` (line 849). It conditionally dynamic-imports `researchEnrichment` so the coldpath on sessions without a manifest pays zero cost, runs the enrichment, sets the flag, and logs a single summary line. Subsequent turns short-circuit inside `enrichWithResearchDatabase()` via the `_enriched` check.

**Implementation**:

```typescript
// coachingService.ts, insert after line 848 (the `memory.events = []` line)
// and before line 849 (`const phase = profile.index.improvementPhase;`):

    // ── Scope 3: Research Database Enrichment (one-time per session) ──
    // Fills demonstration, researchBacking, stakes (when thin), and collegeNote
    // fields that buildImprovementManifest() leaves empty. Zero LLM calls.
    // Idempotent via manifest._enriched; subsequent turns are instant no-ops.
    if (profile.improvementManifest && !profile.improvementManifest._enriched) {
      try {
        const { enrichWithResearchDatabase } = await import('../analysis/researchEnrichment');
        enrichWithResearchDatabase(profile.improvementManifest, collegeId);
      } catch (err) {
        console.warn('[CoachingService] Research enrichment failed (non-fatal):', err);
      }
    }
```

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:849` — insert the 9-line block (`processCoachingTurn()` already receives `collegeId?: string` at parameter position 14 — verified at line 835)
- No changes to `processCoachingTurn()`'s signature, no changes to call sites, no new parameters threaded

**Cost**: 0 LLM calls. First turn: one dynamic import (cached by ESM after first load, ~2ms warm) + one call into `enrichWithResearchDatabase()` (<15ms). Every subsequent turn: one pointer check on `_enriched` (<0.001ms — returns early inside the enrichment function).

**Source**: **direct** — the late-binding-at-coaching architecture is correct for this system because `collegeId` is not available at analysis time. The rethink path's alternative of "populate stakes at manifest build time" was partially absorbed in Item 1 (stakes upgrades happen in the enrichment pass), but the manifest build in `analysisOrchestrator.ts:1426` is not where the enrichment runs — it would complicate the analysis pipeline unnecessarily and still not solve the `collegeId` problem.

---

### 3. Rendering the Enrichment: extend buildImprovementQueueSection for collegeNote

**Before**: `buildImprovementQueueSection()` at `coachingService.ts:4113-4173` already renders `demonstration` (line 4143-4145) and `wordEconomyCut` (line 4146-4148). It does NOT render the new `researchBacking` or `collegeNote` fields, so even after enrichment the coaching LLM prompt wouldn't see them.

**After**: Add a `collegeNote` line and a `researchBacking.principle` line to the return string. The `demonstration` string remains the primary surface (it already contains the full before/after that the LLM needs); `collegeNote` and `researchBacking.principle` add short surgical context.

**Implementation**:

```typescript
// coachingService.ts — inside buildImprovementQueueSection(), after line 4148
// (after the `cut` const declaration):

    const collegeNoteLine = current.collegeNote
      ? `\n  COLLEGE NOTE: ${current.collegeNote}`
      : '';
    const principleLine = current.researchBacking?.principle
      ? `\n  PRINCIPLE: ${current.researchBacking.principle}`
      : '';
```

Then update the return string at line 4160 to include the new segments. The existing return builds the string by concatenation; add two more concatenations after `enrichments + demo + cut`:

```typescript
    // coachingService.ts:4167 — modify the return expression:
    return `\n\n=== IMPROVEMENT QUEUE (${addressedCount}/${manifest.items.length} addressed) ===` +
      `\nWORD BUDGET: ${manifest.wordCount}/${manifest.wordLimit}` +
      `\n\nCURRENT PRIORITY [${current.impact.toUpperCase()}]:` +
      `\n  ${currentParaLabel}: ${current.observation}` +
      `\n  ACTION: ${current.action}` +
      (current.stakes ? `\n  STAKES: ${current.stakes}` : '') +
      (current.technique ? `\n  TECHNIQUE: ${current.technique}` : '') +
      enrichments + demo + cut + principleLine + collegeNoteLine +
      (nextItems ? `\n\nNEXT IN QUEUE:\n${nextItems}` : '') +
      `\n\nRULE: Help the student understand and execute the CURRENT PRIORITY.` +
      `\nIf they're stuck, DEMONSTRATE it using their details.` +
      `\nIf they share new context, enrich the improvement with their specifics.` +
      `\nWhen they've addressed it, advance to the next item.` +
      // Scope 3 + R4 audit fix: force verbatim technique emission when present
      (current.technique
        ? `\n\nVOCABULARY RULE: When offering a rewrite or teaching moment for this priority, ` +
          `name the technique in ALL-CAPS verbatim (e.g., "This is a ${current.technique} move"). ` +
          `Say it exactly once per response. This gives the student a transferable ` +
          `vocabulary handle they can carry to future essays.`
        : '');
```

**Rationale for the verbatim vocabulary rule (X23 fix)**: R4's audit found that without an explicit instruction to emit the technique name verbatim, Sonnet paraphrases technique names (turns `SUMMARY-TO-SCENE` into "try writing in scene mode" in the coaching response). This kills F13's resolution. The coaching LLM must see an instruction AS STRONG as the rewriteExample mandate to preserve the technique label through to the student surface.

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:4149` — add `collegeNoteLine` and `principleLine` const declarations
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:4167` — append `+ principleLine + collegeNoteLine` to the return string

**Cost**: +0 to +240 tokens per turn in the coaching prompt (bounded: `principle` is typically 8-15 words from `transformation.principle_applied`; `collegeNote` is typically 20-50 words from `getCollegeInsight()`). Both fields are absent for items with no mapping, so the token add is zero in miss cases.

**Source**: **direct** — straight port of the direct path's consumption approach. The rethink path's "stash everything in the prompt, no new fields" approach is rejected for this item because `buildImprovementQueueSection()` already renders `demonstration` from the manifest — not rendering the other fields from the same manifest would be inconsistent.

---

### 4. Elite Example Pattern Injection: wire the 11 populated college files into the overlay

**Before**: `collegeOverlay.ts:101-192` builds a 300-500 token coaching context string per college with core values, red flags, green flags, a key quote, dimension weights, and Socratic questions. It does NOT read `research.eliteExamples[]`. Both source blueprints claimed all 13 college `eliteExamples` arrays were empty — **this is wrong**. Verification shows 11 of 13 colleges (Brown 5, Dartmouth 4, UChicago, Northwestern, Penn, USC, Caltech, CMU, Cornell 4, NYU, Stanford — oh wait, Stanford IS empty; Brown 5, Dartmouth 4, UChicago, Northwestern, Penn, USC, Caltech, CMU, Cornell 4, NYU) have populated elite examples with `exampleId`, `pattern`, `anonymizedDescription`, and `whatMakesItEffective[]`. Harvard, MIT, and Stanford are empty.

(Re-verification: stanford.ts line 2557 has `stanfordEliteExamples: CollegeEliteExample[] = [` with only a "Note: would be populated" comment — **Stanford is empty**. Harvard.ts:1484 `harvardEliteExamples = []` — **empty**. MIT.ts:1439 `mitEliteExamples = []` — **empty**. So the tally is: **10 populated, 3 empty**.)

**After**: Extend `getCollegeCoachingOverlay()` in `collegeOverlay.ts` to append an "ELITE TEACHING PATTERNS" section when `research.eliteExamples.length > 0`. Top 2 examples, showing the `pattern` name, `anonymizedDescription`, and the first 2 items from `whatMakesItEffective`. This surfaces already-written elite-essay teaching material that has been invisible to Essay Intelligence.

**Implementation**:

```typescript
// collegeOverlay.ts — after line 189 (the Socratic questions block closes),
// before the final `return parts.join('\n');` at line 191:

  // --- Elite example teaching patterns (top 2) ---
  // 10 of 13 college files have populated eliteExamples with anonymizedDescription
  // and whatMakesItEffective bullets. Surface these as short teaching patterns.
  if (research.eliteExamples && research.eliteExamples.length > 0) {
    const topExamples = research.eliteExamples.slice(0, 2);
    const exampleLines: string[] = [];

    for (const ex of topExamples) {
      // Prefer typed field names, fall back via the [key: string]: unknown escape hatch
      const pattern = (ex as { pattern?: string }).pattern ?? ex.exampleId;
      const description = (ex as { anonymizedDescription?: string }).anonymizedDescription;
      const strengths = (ex as { whatMakesItEffective?: string[] }).whatMakesItEffective;

      if (!description) continue;
      let line = `  [${pattern}]: ${description}`;
      if (strengths && strengths.length > 0) {
        line += `\n    Effective because: ${strengths.slice(0, 2).join('; ')}`;
      }
      exampleLines.push(line);
    }

    if (exampleLines.length > 0) {
      parts.push(
        `ELITE TEACHING PATTERNS (observed in admitted essays at this college):\n` +
        exampleLines.join('\n')
      );
    }
  }

  return parts.join('\n');
```

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/collegeOverlay.ts:189` — add the ~25-line extraction block before the `return parts.join('\n')` at line 191
- No type changes — `CollegeEliteExample.pattern`, `anonymizedDescription`, `whatMakesItEffective` are reachable via the `[key: string]: unknown` escape hatch at `collegeResearch.ts:347` even though they're not in the explicit interface. The guarded property reads prevent type errors.

**Cost**: 0 LLM calls. Adds 150-400 tokens to the coaching prompt for students applying to colleges with populated elite examples (Brown, Dartmouth, UChicago, Northwestern, Penn, USC, Caltech, CMU, Cornell, NYU). Zero tokens added for Harvard/MIT/Stanford applicants (the loop doesn't add the section when `eliteExamples` is empty). Cost at Sonnet $3/Mtok: ~$0.0012/session at the upper bound.

**Source**: **hybrid** — the rethink path correctly identified that `getCollegeCoachingOverlay()` is the right place to surface college-specific teaching content, but its assertion that red-flag `exampleTransformation` fields exist is wrong (they don't). The direct path's GAP-2 assessment that "elite examples require content work that doesn't exist yet" is ALSO wrong — 10 colleges have populated content. The correct answer is to surface the content that exists, acknowledge the content gap for the 3 that don't, and wire the field through `getCollegeCoachingOverlay()` — which already flows into the coaching prompt via `promptBlocks.ts:2067` for common_app and the existing supplement/PIQ cases.

---

### 5. Content Gap Acknowledgement: Harvard, MIT, Stanford elite examples

**Before**: Harvard, MIT, and Stanford `eliteExamples` arrays are empty placeholders. Even after Item 4 wires the pipeline, students applying to these three colleges do not see elite teaching patterns.

**After**: No engineering change. Item 4's code already handles empty arrays correctly (the `if (research.eliteExamples && research.eliteExamples.length > 0)` guard). This item is documentation, not implementation — it surfaces the gap so content authorship can be scheduled separately.

**Implementation**: Zero code changes. Add a `TODO(scope3-content)` comment in `harvard.ts:1484`, `mit.ts:1439`, and `stanford.ts:2557` pointing to this item:

```typescript
// stanford.ts:2557
export const stanfordEliteExamples: CollegeEliteExample[] = [
  // TODO(scope3-content): Populate with 3-4 elite Stanford essay patterns
  // following the shape in brown.ts:1181 (exampleId, pattern, anonymizedDescription,
  // whatMakesItEffective[], dimensionsShown[]). Item 4 of FORGE_PLAN_SCOPE3.md
  // surfaces these automatically via getCollegeCoachingOverlay() once populated.
];
```

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/data/harvard.ts:1484` — add TODO comment
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/data/mit.ts:1439` — add TODO comment
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/data/stanford.ts:2557` — add TODO comment

**Cost**: 0.

**Source**: **refined** — neither source blueprint caught the 10/13 populated reality. This item explicitly names the gap AND the wiring for when it is filled.

---

### 6. Type Extensions: ImprovementEntry and ImprovementManifest additive fields

**Before**: `profileTypes.ts:2380-2428` defines `ImprovementEntry` with no research or college fields, and `ImprovementManifest` with no idempotency flag. Any enrichment that tries to attach this data would produce TypeScript errors at the assignment sites.

**After**: Three optional field additions (all purely additive — existing call sites that build `ImprovementEntry` / `ImprovementManifest` literals compile unchanged).

**Implementation**:

```typescript
// profileTypes.ts — insert after line 2406 (conversatorEnrichments field),
// inside the ImprovementEntry interface body:

  /**
   * Scope 3: Research-backed principle + mechanism explanation, populated at
   * coaching session init by enrichWithResearchDatabase() from
   * TEACHING_KNOWLEDGE_BASE. Null when no IssueType mapping was resolved.
   * @see src/services/essayIntelligence/analysis/researchEnrichment.ts
   */
  researchBacking?: {
    /** Core principle behind the transformation (e.g., "Start at the point of highest tension") */
    principle: string;
    /** Mechanism explanation — why the "after" version works */
    whyItWorks: string;
    /** IssueType string used for the lookup (provenance trail) */
    sourceRef: string;
    /** Optional SourceCitation.source_id when getWhyThisMatters returned one */
    citationId?: string;
  } | null;

  /**
   * Scope 3: College-specific tailoring note for supplement essays.
   * Populated only when collegeId is present and the research service
   * has a college-specific insight or populated elite example for this issue.
   * Null is the correct "not applicable" value — not a failure state.
   */
  collegeNote?: string | null;
```

```typescript
// profileTypes.ts — insert after line 2427 (wordLimit field),
// inside the ImprovementManifest interface body:

  /**
   * Scope 3: Idempotency flag set by enrichWithResearchDatabase() on first run.
   * Prevents re-running enrichment on every coaching turn.
   *
   * PERSISTENCE: Must NOT be persisted across sessions. R5 audit verified that
   * without explicit exclusion in SupabaseCheckpointStore.save(), this flag
   * IS serialized via the JSONB profile_cache column — which causes enrichment
   * to permanently short-circuit when the student switches collegeId mid-thread
   * or the research DB is updated. See Integration point below for the fix.
   */
  _enriched?: boolean;
```

**Supabase persistence exclusion (added to Item 6)**:

Modify `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/persistence/supabaseCheckpointStore.ts` — `SupabaseCheckpointStore.save()`:

```typescript
// BEFORE (approximate):
const payload = { profile_cache: profile as unknown as Record<string, unknown>, ... };

// AFTER — use a JSON replacer that skips the _enriched key:
const sanitizedProfile = JSON.parse(
  JSON.stringify(profile, (key, value) => {
    if (key === '_enriched') return undefined; // Exclude from serialization
    return value;
  }),
);
const payload = { profile_cache: sanitizedProfile, ... };
```

This ensures every session starts with `manifest._enriched` unset, allowing the Scope 3 Item 2 hook to re-run enrichment on the first coaching turn with the current `collegeId`.

**Alternative** (documented but not adopted): track `_enrichedCollegeId: string | null` and re-run only when `collegeId` changes. The JSON-replacer approach above is simpler and correct for the common case; the tracking approach only matters if enrichment cost becomes measurable (currently <15ms per session — not worth the complexity).

**Integration points**:

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2406` — add two optional fields to `ImprovementEntry`
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts:2427` — add `_enriched?` to `ImprovementManifest`

**Cost**: 0 runtime. Zero type errors in existing call sites (verified mentally against `analysisOrchestrator.ts:1446-1605` — the 6 literal constructors use `conversatorEnrichments: []` as their last field and do not need updating).

**Source**: **refined** — direct path's type additions with a small correction: `researchBacking.citationId` is new to this plan (neither source blueprint had it), needed because the rethink path's "provenance is embedded in stakes text" is true but insufficient when the coaching layer wants to cite a specific source programmatically.

---

## Bridging Tables (full content)

### ROUTE_TO_ISSUE_TYPE (20 entries — all of Scope 2's TECHNIQUE_VOCABULARY_LIST)

The left side is the complete 20-technique set Scope 2 emits via `TECHNIQUE_VOCABULARY_LIST` (analysis/techniqueVocabulary.ts), which is a strict SUPERSET of the original 14 routes from the deleted `matchClaimToTechnique()` at `analysisOrchestrator.ts:1639-1664`. The right side is an `IssueType` confirmed to exist in `TEACHING_KNOWLEDGE_BASE` (verified by grepping the bundle keys at `researchBackedTeachingService.ts:149-955`). Rationales for the 6 additions are in `FORGE_PLAN_ARTIFACTS.md` section "6 Missing Technique Mappings".

| Route (from TECHNIQUE_VOCABULARY_LIST) | IssueType (in TEACHING_KNOWLEDGE_BASE) | Rationale |
|------------------------------------|----------------------------------------|-----------|
| `SUMMARY-TO-SCENE`                    | `weak_structure`                  | Essay operates at summary distance instead of scene |
| `COLD OPEN / SENSORY TIMESTAMP`       | `weak_opening`                    | Put-down risk / no hook |
| `SOMATIC VULNERABILITY`               | `telling_not_showing`             | Named emotion → replace with body |
| `NAMED CHARACTER`                     | `telling_not_showing`             | People absence → show through action |
| `EVIDENCE ANCHORING`                  | `missing_evidence_of_impact`      | Claim exceeds evidence |
| `RITUAL DETAIL / BOOKEND INVERSION`   | `weak_ending`                     | Aspirational closing vs proof image |
| `VOICE COMPARISON`                    | `cliche_ai_convergence`           | Voice shift → AI-generated register |
| `SHOW THROUGH SPECIFIC ACTION`        | `telling_not_showing`             | Direct mapping |
| `VOICE AUTHENTICITY`                  | `performative_intelligence`       | Formulaic/generic → trying-too-hard voice |
| `DEFINITIONAL PIVOT`                  | `cliche_language`                 | Cliche handling |
| `STAKES ESTABLISHMENT`                | `passive_victim_framing`          | No stakes → passive framing |
| `SCENE EXPANSION`                     | `weak_structure`                  | Compressed/rushed → structural issue |
| `BRIDGE SENTENCE`                     | `weak_transitions`                | Direct mapping |
| `ENACTED PARALLEL`                    | `missing_connection_specificity`  | Structural echo for domain crossing |
| `COLLABORATIVE SPECIFICITY` *(NEW)*   | `missing_evidence_of_impact`      | Singular-I framing → show collaborators with evidence |
| `FUNCTIONAL DETAIL` *(NEW)*           | `telling_not_showing`             | Decorative sensory → function-earning detail |
| `ANTI-LESSON` *(NEW)*                 | `shallow_reflection`              | Neat lesson → productive contradiction |
| `SUSTAINED VULNERABILITY` *(NEW)*     | `telling_not_showing`             | Vulnerability stated then retreated → stay in it |
| `NARRATIVE ARC` *(NEW)*               | `weak_structure`                  | Missing story shape → arc restoration |
| `INCREMENTAL REVELATION` *(NEW)*      | *(null — no bundle)*              | No TEACHING_KNOWLEDGE_BASE entry; falls through to keyword fallback |

### OBSERVATION_KEYWORD_TO_ISSUE (23 entries — keyword fallback)

Ordered most-specific-first. Scanned against `observation + action` lowercased when `item.technique` is null or unmapped.

| Keywords (any match wins) | IssueType |
|---|---|
| `summary mode`, `30,000 feet`, `narrates from distance`, `chronological`   | `weak_structure` |
| `opening`, `hook`, `first sentence`, `first line`, `put-down risk`         | `weak_opening` |
| `conclusion`, `ending`, `closing`, `resolution`                            | `weak_ending` |
| `transition`, `disconnected`, `abrupt shift`, `bridge`                     | `weak_transitions` |
| `show don't tell`, `telling not showing`, `abstract claim`, `telling`      | `telling_not_showing` |
| `ai convergence`, `sounds like everyone`, `ai-generated`, `formulaic`      | `cliche_ai_convergence` |
| `cliché`, `cliche`, `overused`, `template phrase`                          | `cliche_language` |
| `inspirational`, `completely changed my life`, `transformed me`            | `cliche_inspirational` |
| `epiphany`, `sudden realization`, `in that moment i knew`                  | `false_epiphany` |
| `performative vulnerability`, `calculated vulnerability`, `strategic`      | `strategic_vulnerability` |
| `passive`, `victim`, `happened to me`, `suffered through`                  | `passive_victim_framing` |
| `premature resolution`, `too neat`, `wrapped up`, `tidy`                   | `premature_resolution` |
| `performative intelligence`, `thesaurus`, `big words`, `vocabulary`        | `performative_intelligence` |
| `missing technical depth`, `methodology`, `jargon without`, `expertise`    | `missing_technical_depth` |
| `generic insight`, `anyone could have`, `generic takeaway`                 | `missing_unique_insight` |
| `no metrics`, `claims without proof`, `evidence of impact`                 | `missing_evidence_of_impact` |
| `intellectual`, `curiosity`, `thinking process`, `how you think`           | `missing_intellectual_engagement` |
| `over-narrated`, `too much story`, `narrative heavy`                       | `over_narrated` |
| `no thinking`, `actions but no thought`, `missing internal`                | `missing_character_through_thought` |
| `shallow reflection`, `surface-level`, `learned that i`                    | `shallow_reflection` |
| `oversimplified`, `no nuance`, `no complexity`                             | `missing_complexity` |
| `missing systems`, `systems awareness`, `structural constraint`            | `missing_systems_awareness` |
| `why us`, `swap test`, `generic fit`, `connection specificity`             | `missing_connection_specificity` |

**Coverage**: 23 of the 26 issue types with bundles in `TEACHING_KNOWLEDGE_BASE`. Not covered (no keyword route, by design): `generic_why_us`, `generic_why_major`, `activity_listing` — these are supplement-only issue types that are better reached via the Item 3 `collegeNote` path. The 6 IssueType union members with no bundles at all (`cliche_narrative_arc`, `cliche_value_signaling`, `cliche_topic_framing`, `cliche_essay_formula`, `image_renovation`, `incremental_revelation`) are correctly absent from both tables.

---

## Execution Order (dependency-ordered)

1. **Item 6** — Add type extensions to `profileTypes.ts`. Must come first or items 1-3 won't compile.
2. **Item 1** — Create `researchEnrichment.ts` with the bridging tables and enrichment function. Depends only on Item 6's type extensions and the already-exported `researchBackedTeachingService` singleton.
3. **Item 2** — Insert the 9-line enrichment hook in `processCoachingTurn()`. Depends on Item 1.
4. **Item 3** — Extend `buildImprovementQueueSection()` to render `collegeNote` and `principleLine`. Depends on Item 6.
5. **Item 4** — Extend `getCollegeCoachingOverlay()` to surface elite examples. Independent of Items 1-3 and 6, but depends on the existing `CollegeResearch` type.
6. **Item 5** — Add TODO comments in Harvard/MIT/Stanford data files. Purely documentation.

Items 1-3, 6 form the core enrichment chain. Items 4-5 are independent elite-example wiring that can ship in a separate commit if desired.

---

## Cost Summary

| Dimension | Before | After | Delta |
|---|---|---|---|
| LLM calls per session | N (coaching turns) | N (unchanged) | **0 new** |
| Enrichment latency (first turn) | N/A | <15ms | +15ms one-time |
| Enrichment latency (subsequent turns) | N/A | <0.001ms (early return) | negligible |
| Tokens added to prompt (per improvement queue render) | 0 | +0 to +260 | 0 for items with no mapping, up to ~260 when all 3 new fields populated |
| Disk / memory | 0 | ~10KB new TS file | trivial |
| Token cost (Sonnet $3/Mtok, upper bound) | — | ~$0.0008/session | negligible |

**Total: 0 new LLM calls, <15ms one-time compute cost per session, up to +260 tokens per improvement queue render (bounded by mapping hit rate).**

---

## Infrastructure Leveraged (existing code, zero modifications)

- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/services/researchBackedTeachingService.ts` — singleton exported at line 2131 (`researchBackedTeachingService`) and class at 2134. File has `@ts-nocheck` at line 1 — this DOES NOT bleed into the new file because `@ts-nocheck` is file-scoped.
- `researchBackedTeachingService.getTransformations(issueType)` at line 1064 — returns `TransformationExample[]` (0-3 entries per issue type, 75 total across 26 bundled issue types)
- `researchBackedTeachingService.getWhyThisMatters(issueType)` at line 1021 — returns `{ explanation, source? }`
- `researchBackedTeachingService.getCollegeSpecificGuidance(issueType, collegeId)` at line 1072 — returns `{ sources, insight? }`, uses hardcoded map at line 2063-2077 (capitalized keys)
- `IssueType` type union exported at line 34 — 32 member strings
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/data/stanford.ts`, `harvard.ts`, `brown.ts`, `dartmouth.ts`, `uchicago.ts`, `northwestern.ts`, `upenn.ts`, `usc.ts`, `caltech.ts`, `cmu.ts`, `cornell.ts`, `nyu.ts`, `mit.ts` — 13 college data files, 10 with populated `eliteExamples` (Brown: 5, Dartmouth: 4, Cornell: 4 — others verified by grep count of `exampleId:` markers)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/commonAppWorkshop/types/collegeResearch.ts:326-348` — `CollegeEliteExample` interface with `[key: string]: unknown` escape hatch at line 347 (allows reading `pattern`, `anonymizedDescription`, `whatMakesItEffective` without widening the interface)
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts:821` — `processCoachingTurn()` already receives `collegeId?: string` at parameter 14 (line 835), already mutates `profile.improvementManifest` in place (line 1233), already renders `current.demonstration` at line 4143
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/collegeOverlay.ts:101` — `getCollegeCoachingOverlay()` already lazy-loads and caches all 13 college data files via `collegeCache` Map at line 16
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/promptBlocks.ts:2067` — `essayTypeBlock()` already calls `getCollegeCoachingOverlay()` for common_app essays when `collegeId` is present (and for supplement/PIQ at lines 1979, 2020) — Item 4's elite-examples extension flows through this channel automatically

---

## Contract with Scope 2 (re-stated cleanly)

**Scope 3 requires from Scope 2**:
- `profile.improvementManifest?: ImprovementManifest` exists on `EssayProfile` (**already exists at profileTypes.ts:1780** — Scope 2 does not need to add this)
- `ImprovementManifest.items: ImprovementEntry[]` exists (**already exists at profileTypes.ts:2419**)
- Each `ImprovementEntry` has readable `technique: string | null`, `observation: string`, `action: string`, `stakes: string`, `demonstration: string | null` (**all already exist at profileTypes.ts:2380-2407**)

**Scope 3 assumes nothing else about Scope 2**. If Scope 2 renames `ImprovementEntry` to `ImprovementCandidate`, the enrichment function still works as long as the fields above exist structurally. If Scope 2 adds new fields, Scope 3 ignores them. If Scope 2 changes `technique` to a richer object type, `resolveIssueType` falls through to the keyword fallback (secondary lookup strategy — this is the explicit fail-open path sanctioned by Operating Doctrine rule 4, not a silent degradation).

**What happens if Scope 2's contract differs**:
- `technique` becomes `techniqueRoute: { name: string; directive: string }`: Update `resolveIssueType` line 152 to `const technique = (item as any).technique?.name ?? (item as any).techniqueRoute?.name ?? null;` — one line change.
- `observation` renamed to `diagnosis`: Update line 158 similarly. One-line change.
- `ImprovementManifest` replaced with `ImprovementQueue`: Rename the parameter type in `enrichWithResearchDatabase()` signature.

All three adapters are trivial to add if Scope 2's final shape differs.

**What Scope 3 never requires**:
- `collegeId` on `PipelineInput`. Late binding at coaching time removes the need.
- Any async-ification of `buildImprovementManifest()`. Enrichment runs outside the analysis pipeline.
- Any changes to how Scope 2 populates the manifest initially. Scope 3 only reads and enriches.

---

## Content Gaps (explicitly NOT fixed by this plan)

### Content Gap A: Harvard, MIT, Stanford elite examples are empty

Three of 13 college data files have empty `eliteExamples` arrays with placeholder comments. Item 4 surfaces elite teaching patterns via `getCollegeCoachingOverlay()` for the 10 populated colleges — it does NOT populate the empty arrays. Item 5 adds TODO comments pointing to where content should go.

**Why this is a content gap, not a wiring gap**: Populating `CollegeEliteExample` requires curating real admitted-student essays with proper rights, paragraph annotations, and technique tagging. The type infrastructure is complete; the missing piece is the content itself. Schedule a content-authorship sprint with the editorial team.

### Content Gap B: `getCollegeInsight` hardcoded coverage is thin

The internal map at `researchBackedTeachingService.ts:2063-2077` covers only Stanford × `{telling_not_showing, performative_intelligence}`, MIT × `{telling_not_showing, missing_systems_awareness}`, Harvard × `{cliche_inspirational, strategic_vulnerability}` — **6 insights total**. When Item 1 calls `getCollegeSpecificGuidance(issueType, collegeId)`, the `insight` field is populated only in these 6 cases. For everything else, `item.collegeNote` stays null.

**Why this is a content gap**: Adding more insights means writing more college-specific prose. The wiring works; the coverage needs expansion. A future plan item can populate the map to cover all 13 colleges × the top 10 issue types = 130 insights.

### Content Gap C: 6 IssueType union members have no TEACHING_KNOWLEDGE_BASE entry

`cliche_narrative_arc`, `cliche_value_signaling`, `cliche_topic_framing`, `cliche_essay_formula`, `image_renovation`, `incremental_revelation` are in the `IssueType` union at `researchBackedTeachingService.ts:34-71` but have no bundle in `TEACHING_KNOWLEDGE_BASE`. They can never be reached by Item 1's enrichment. `getTransformations()` returns `[]` for them, `getWhyThisMatters()` returns `null`. The graceful-skip path handles this correctly.

**Why this is a content gap**: Populating 6 more bundles requires writing research-backed before/after examples. Not blocking.

---

## Rejected Approaches

### Rejected: Thread `collegeId` through `PipelineInput` (rethink path Option A)

**Why rejected**: Would require making `buildImprovementManifest()` async (ripples through `analyzeEssay`), adding a new required field to `PipelineInput` (not all callers have a `collegeId`, e.g., comprehensive first-analysis passes for common_app essays with no target), and coupling the analysis layer to supplement-only semantics. Late binding at coaching time achieves identical outcome with zero interface changes.

### Rejected: Inject research content directly into the L5 coaching prompt as "quality anchor" without storing on the manifest (rethink path GAP-1 reframe)

**Why rejected**: The rethink path is technically correct that the LLM is better at generating essay-specific demonstrations than pasting stored ones. But `buildImprovementQueueSection()` already renders `current.demonstration` into the prompt at line 4143. Not storing the before/after on the manifest means the LLM gets NOTHING for pre-existing items that the keyword router couldn't map. Storing + rendering is additive — the LLM can still generate essay-specific demonstrations while ALSO seeing the research-backed anchor. The rethink path's objection ("mismatched demonstration") is solvable by prompt design (label it clearly as a "reference example, not a template"), not by abandoning storage.

### Rejected: Don't populate `researchBacking` as a structured field — keep provenance implicit in stakes text (rethink path GAP-7 reframe)

**Why rejected**: Partially correct but insufficient. The rethink path is right that students don't see source IDs. But other coaching layers (future UI badges, programmatic provenance audits, debugging) need a structured handle. The compromise: store `researchBacking` as a structured field (Item 6) AND surface the principle text in the coaching prompt (Item 3's `principleLine`). Best of both worlds.

### Rejected: New file at `src/services/essayIntelligence/improvements/researchEnrichment.ts`

**Why rejected**: The `improvements/` directory doesn't exist yet (verified). Creating a new subdirectory for a single file is premature. `analysis/` already holds related files (`analysisOrchestrator.ts` which builds the manifest, `reanalysisOrchestrator.ts`, `growthEngine.ts`, `crystallizer.ts`) and is the right home.

### Rejected: Use lazy dynamic import in `researchEnrichment.ts` itself for `researchBackedTeachingService`

**Why rejected**: The direct blueprint dynamically imports from within the enrichment function. This adds async complexity. The static import at the top of `researchEnrichment.ts` is fine because the new file is lazy-loaded via dynamic import at the call site in `coachingService.ts:849`. Net effect: one lazy boundary instead of two.

### Rejected: Fix `getCollegeInsight()`'s case-sensitivity bug at the source

**Why rejected**: That file has `@ts-nocheck` and is part of a separate service module. Touching it could destabilize Common App workshop consumers. Scope 3 handles the case-sensitivity issue in `normalizeCollegeIdsForLookup()` in its own file. If Common App workshop maintainers want to fix the bug upstream later, the normalization logic becomes a trivial cleanup.

### Rejected: Extend `teachingContentRouter.ts`'s `CLAIM_TO_PIQ_ISSUE` table to include `IssueType` values (rethink path proposal)

**Why rejected**: `CLAIM_TO_PIQ_ISSUE` at `teachingContentRouter.ts:118` maps to a **different namespace** (PIQ-specific issue types like `hook-weak-generic`, `vuln-manufactured-phrases`), not the `IssueType` strings in `TEACHING_KNOWLEDGE_BASE`. Mixing them would conflate two lookup systems that serve different purposes (PIQ example routing vs research database routing). Separate tables in separate files is the clean separation.

---

## Verification Plan

### Type check
```bash
cd /Users/tuepham/uplift-final-final-18698-62030
npx tsc --noEmit
```
Expected: zero new errors. Scope 3's type additions are all optional, so pre-existing `ImprovementEntry` construction sites (6 in `analysisOrchestrator.ts`) compile unchanged.

### Unit-level smoke test (piano essay)
Add `tests/test-scope3-enrichment.ts` (new file, ~120 lines) that:
1. Builds a synthetic `ImprovementManifest` with 3 items:
   - Item A: `technique: 'SUMMARY-TO-SCENE'`, `observation: 'P1 operates in summary mode'`, `demonstration: null`, `stakes: ''`
   - Item B: `technique: null`, `observation: 'AO put-down risk — no hook'`, `demonstration: null`, `stakes: ''`
   - Item C: `technique: 'UNKNOWN_ROUTE'`, `observation: 'Unrelated observation'`, `demonstration: null`, `stakes: ''`
2. Calls `enrichWithResearchDatabase(manifest)` (no collegeId).
3. Asserts:
   - Item A has `demonstration` starting with `BEFORE: "When I was six, I started playing piano`
   - Item A has `researchBacking.principle === 'Start at the point of highest tension, not the chronological beginning'`
   - Item B has `demonstration` starting with `BEFORE:` (keyword fallback hit on "put-down risk")
   - Item C has `demonstration === null` (no mapping, graceful skip)
   - `manifest._enriched === true`

### Idempotency test
1. Call `enrichWithResearchDatabase(manifest)` twice.
2. Assert the second call returns immediately (log no output) and the manifest is not mutated further. Mock the singleton to throw if called twice.

### College-aware test
1. Build a manifest with `technique: 'SOMATIC VULNERABILITY'` → `telling_not_showing`.
2. Call `enrichWithResearchDatabase(manifest, 'stanford')`.
3. Assert `item.collegeNote` contains "Stanford's separate IV rating" (from `getCollegeInsight` hardcoded map, tested against the capitalized-key normalization).
4. Repeat with `collegeId: 'STANFORD'` — assert same result.

### Miss-handling test
1. Build a manifest with `technique: 'TOTALLY_UNKNOWN'`, `observation: 'gibberish text with no matching keywords xyzzy'`, both demonstration and stakes empty.
2. Call `enrichWithResearchDatabase(manifest)`.
3. Assert item fields are unchanged (fields remain null/empty). Assert `_enriched === true`.

### End-to-end render test
1. Build a minimal `EssayProfile` with an `improvementManifest` containing 2 items.
2. Call `enrichWithResearchDatabase(profile.improvementManifest, 'stanford')`.
3. Call `buildImprovementQueueSection(profile, memory)`.
4. Assert the returned string contains `PRINCIPLE:` line and `COLLEGE NOTE:` line.

### Elite examples surfacing test
1. Call `getCollegeCoachingOverlay('brown')`.
2. Assert the return string contains `ELITE TEACHING PATTERNS`.
3. Call `getCollegeCoachingOverlay('harvard')`.
4. Assert the return string does NOT contain `ELITE TEACHING PATTERNS` (empty array path).

### Production observability
The `console.log` in `enrichWithResearchDatabase()` is the primary production signal. Format:
```
[researchEnrichment] Enrichment complete — items=10, demonstrations=7, stakes_upgraded=8, college_notes=2 (college=stanford)
```
Monitor this line in production logs. If `demonstrations/items` ratio drops below 50%, investigate the mapping tables (either a new `matchClaimToTechnique()` route was added and `ROUTE_TO_ISSUE_TYPE` needs updating, or the keyword fallback is missing a common pattern).

---

## OPEN DECISIONS

### OPEN: Should `_enriched` flag persist across sessions?

Current design: the flag is in-memory and resets when the manifest is rebuilt by a re-analysis pass. This is correct for the common case (each re-analysis rebuilds the manifest, so re-enrichment is appropriate). However, if a future caching layer serializes the entire `EssayProfile` to disk and restores it across sessions, the flag would prevent re-enrichment even when the research database has been updated. **Recommendation**: leave as-is; if serialization is added later, exclude `_enriched` from serialization via a top-level JSON filter.

### OPEN: Should `researchEnrichment.ts` export the mapping tables for testability?

Current design: `ROUTE_TO_ISSUE_TYPE` and `OBSERVATION_KEYWORD_TO_ISSUE` are module-private constants. This keeps the module surface minimal but makes the mapping tables harder to test in isolation. **Recommendation**: if the test file needs to inspect the tables directly, export them behind a `__testing` namespace. For now, the unit tests above verify behavior via inputs/outputs — no direct table inspection needed.

### OPEN: When should `researchBacking.citationId` actually be populated?

The field is typed and the enrichment function writes it when `getWhyThisMatters()` returns a `source.source_id`. The question is whether any downstream consumer reads it. Currently none do. **Recommendation**: write it anyway — it's cheap and future-proofs a "Research Backed" UI badge. If no consumer emerges within 3 months, remove the write in a cleanup pass.
