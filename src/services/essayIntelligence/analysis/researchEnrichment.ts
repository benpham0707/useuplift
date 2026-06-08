/**
 * researchEnrichment.ts — Late-bound enrichment of ImprovementManifest
 * with research-backed content from TEACHING_KNOWLEDGE_BASE.
 *
 * Called ONCE per coaching session (not per turn) after the student sends
 * their first message. Pure synchronous lookups into a singleton — zero
 * LLM calls, <15ms total for a 10-item manifest.
 *
 * Design decisions (see docs/specs/FORGE_PLAN_SCOPE3.md for full rationale):
 *   - Late-bound at coaching time, not at analysis time (collegeId isn't on PipelineInput)
 *   - Mutates the manifest in place (matches existing conversatorEnrichments.push
 *     pattern at coachingService.ts:1243)
 *   - Idempotent via manifest._enriched flag
 *   - Fail-open per-item (a miss leaves the field as-is — no fake fallback)
 *   - Fail-fast systemic (if a manifest with >3 items hits ZERO lookups,
 *     PipelineError.enrichmentSystemicMiss fires — indicates corrupted
 *     mapping tables or broken service import)
 *   - Structurally compatible: `in` + optional reads so a Scope 2 type rename
 *     doesn't break this module
 *
 * Scale verified by grep against the source files:
 *   - TEACHING_KNOWLEDGE_BASE: 26 issue-type bundles, 75 transformation pairs
 *   - researchBackedTeachingService: static singleton exported at line 2131
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
import { PipelineError } from '../errors';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE_TO_ISSUE_TYPE — technique vocabulary → TEACHING_KNOWLEDGE_BASE bundle
//
// Left side: the full 20-technique set emitted by Scope 2's
//   `TECHNIQUE_VOCABULARY_LIST` (analysis/techniqueVocabulary.ts). Strict
//   superset of the original 14 routes from the deleted
//   `matchClaimToTechnique()` function at analysisOrchestrator.ts:1639-1664.
// Right side: `IssueType` keys confirmed to exist in `TEACHING_KNOWLEDGE_BASE`
//   (verified by grepping bundle keys at researchBackedTeachingService.ts:149-955).
//   Only 26 of 32 IssueType union members have bundles; every mapping below
//   targets a bundled key.
//
// Maintenance note: if a new technique is added to TECHNIQUE_VOCABULARY_LIST
// or coachingService.TECHNIQUE_ROUTES, add the corresponding IssueType here.
// The enrichment is fail-open per-item, so a missing entry simply leaves
// the item's demonstration null — not an error. A null sentinel on the
// right side is an intentional "no bundle" marker, distinct from a
// "forgot to map" bug.
// ═══════════════════════════════════════════════════════════════════════════

const ROUTE_TO_ISSUE_TYPE: Record<string, IssueType | null> = {
  // Original 14 routes from the deleted matchClaimToTechnique() function
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

  // Scope 2 additions — 6 new LLM-emitted techniques
  // (mapping rationales documented in docs/specs/FORGE_PLAN_ARTIFACTS.md)
  'COLLABORATIVE SPECIFICITY':            'missing_evidence_of_impact',
  'FUNCTIONAL DETAIL':                    'telling_not_showing',
  'ANTI-LESSON':                          'shallow_reflection',
  'SUSTAINED VULNERABILITY':              'telling_not_showing',
  'NARRATIVE ARC':                        'weak_structure',
  // INCREMENTAL REVELATION: intentional null — no TEACHING_KNOWLEDGE_BASE
  // bundle for this technique. The sync test (tests/test-scope2-phase4-runtime.ts
  // Suite 8) knows this is deliberate, not a forgotten mapping.
  'INCREMENTAL REVELATION':               null,
};

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVATION_KEYWORD_TO_ISSUE — fallback keyword router
//
// Used when `item.technique` is null (L4 priorities never carry a technique —
// see analysisOrchestrator.ts:1452) or the technique string isn't in
// ROUTE_TO_ISSUE_TYPE. Scans `observation + action` lowercased.
//
// Ordered MOST-SPECIFIC FIRST so the first match wins. A later shorter
// keyword would otherwise shadow a more targeted earlier match (e.g.,
// "cliche" would shadow "cliche_ai_convergence").
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// College ID normalization
//
// `researchBackedTeachingService.getCollegeInsight()` uses CAPITALIZED keys
// ('Stanford', 'MIT', 'Harvard') at researchBackedTeachingService.ts:2063-2077,
// but `collegeOverlay.ts` uses lowercase IDs ('stanford', 'mit', 'harvard').
// Try multiple case variants so the lookup finds a match regardless of
// inbound casing.
// ═══════════════════════════════════════════════════════════════════════════

function normalizeCollegeIdsForLookup(collegeId: string): string[] {
  const lower = collegeId.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const upper = lower.toUpperCase(); // MIT, NYU, UCLA, USC, CMU
  // Dedupe preserving order: lower → capitalized → upper
  return Array.from(new Set([lower, capitalized, upper]));
}

// ═══════════════════════════════════════════════════════════════════════════
// resolveIssueType
//
// Primary: named-technique direct mapping via ROUTE_TO_ISSUE_TYPE.
// Fallback: keyword scan over observation + action.
// Returns null when no confident mapping — triggers graceful skip.
//
// Uses defensive property reads so a Scope 2 shape drift (e.g., the type
// is renamed from ImprovementEntry to ImprovementCandidate) doesn't break
// this function — the required fields (technique, observation, action) are
// read via optional access rather than strict destructuring.
// ═══════════════════════════════════════════════════════════════════════════

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
    if (bridge.keywords.some((kw) => searchText.includes(kw))) {
      return bridge.issueType;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// enrichWithResearchDatabase — the single exported function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enrich an ImprovementManifest in place with research-backed content.
 *
 * Idempotent via `manifest._enriched`: repeat calls short-circuit.
 * Fail-open per-item: each service call is wrapped in try/catch; a miss
 * leaves the field as-is (NEVER writes fake fallback content).
 * Fail-fast systemic: if a manifest with >3 items scores ZERO lookup hits,
 * throws `PipelineError.enrichmentSystemicMiss` — indicates corrupted
 * mapping tables or broken service import, NOT a legitimate miss.
 * Synchronous: all lookups hit in-memory Maps / static objects via the
 * `researchBackedTeachingService` singleton. <15ms for 10 items.
 *
 * @param manifest - The ImprovementManifest to enrich (mutated in place).
 * @param collegeId - Optional college ID for supplement-specific tailoring.
 *                    Absent for common_app essays with no target college.
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
  const missedObservations: string[] = [];

  for (const item of manifest.items) {
    let issueType: IssueType | null;
    try {
      issueType = resolveIssueType(item);
    } catch (err) {
      // Per Operating Doctrine rule 5: surface the bug, don't swallow.
      // A thrown resolveIssueType is unexpected — it means a structural
      // bug in the matching logic, not a missing bundle. Log loudly
      // so Phase 8 and production observability catch it, then continue
      // so the outer loop can still enrich other items.
      console.warn(
        `[researchEnrichment] resolveIssueType threw for item ${item.id}:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }

    if (!issueType) {
      // Legitimate per-item miss — graceful skip. Record the observation
      // so systemic-miss detection has data to diagnose.
      missedObservations.push(item.observation);
      continue;
    }

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
        console.warn(
          `[researchEnrichment] getTransformations failed for ${issueType}:`,
          err instanceof Error ? err.message : err,
        );
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
          // Preserve the Evidence: prefix if present — it carries
          // student-specific context from the analysis layer
          const evidencePrefix = item.stakes?.startsWith('Evidence:')
            ? `${item.stakes}\n`
            : '';
          item.stakes = evidencePrefix + whyMatters.explanation;
          stakesUpgraded++;

          // Carry source citation into researchBacking if populated above
          if (item.researchBacking && whyMatters.source?.source_id) {
            item.researchBacking.citationId = whyMatters.source.source_id;
          }
        }
      } catch (err) {
        console.warn(
          `[researchEnrichment] getWhyThisMatters failed for ${issueType}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // ── College note: only when collegeId is present ──
    if (collegeId && item.collegeNote == null) {
      // Try multiple case variants because of the Stanford/stanford
      // mismatch between getCollegeInsight (capitalized) and
      // collegeOverlay (lowercase)
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
          console.warn(
            `[researchEnrichment] getCollegeSpecificGuidance failed for ${cid}/${issueType}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
  }

  // ── Systemic failure escalation (fail-fast doctrine) ──
  // Distinguishes "this essay has no matched issue types" (legitimate —
  // loop silently misses every item per Operating Doctrine rule 4's
  // "missing-data ≠ failure" principle) from "research database broken"
  // (must fail loudly). The threshold: >3 items AND zero enrichment hits
  // across BOTH demonstration fills AND stakes upgrades means the
  // ROUTE_TO_ISSUE_TYPE table, OBSERVATION_KEYWORD_TO_ISSUE table, or
  // the `researchBackedTeachingService` itself is corrupted.
  if (
    demonstrationsFilled === 0 &&
    stakesUpgraded === 0 &&
    manifest.items.length > 3
  ) {
    throw PipelineError.enrichmentSystemicMiss(
      manifest.items.length,
      missedObservations,
    );
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

// ═══════════════════════════════════════════════════════════════════════════
// __testing — exports for unit tests
//
// Mapping tables are module-private by default, but the test suite needs
// to inspect them for drift detection against TECHNIQUE_VOCABULARY_LIST.
// Exported under a __testing namespace to signal non-production use.
// ═══════════════════════════════════════════════════════════════════════════

export const __testing = {
  ROUTE_TO_ISSUE_TYPE,
  OBSERVATION_KEYWORD_TO_ISSUE,
  normalizeCollegeIdsForLookup,
  resolveIssueType,
};
