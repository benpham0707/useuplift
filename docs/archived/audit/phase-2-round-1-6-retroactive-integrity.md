# Phase 2 Round 1.6 Retroactive Integrity Audit

**Date:** 2026-05-01
**Branch:** `feat/integrated-pipeline-build`
**HEAD at audit start:** `c865c15` (benchmark ratification)
**HEAD at closure:** `bfaca16` + this doc

## Why this audit exists

The Phase 2 prompt benchmark went through three substantive iterations (round 1 → 1.5 → 1.6) with Tue's input at each step. Tue ratified round 1.6 on 2026-05-01.

Three Phase 2 infrastructure deliverables landed during the iteration cycle without explicitly measuring against the ratified round 1.6 framework:

- **D-2.1** — QueueManager dig-flow extension (commit `c3214c5`)
- **D-2.10** — Queue persistence concurrency test (commit `f1c98a6`)
- **D-2.7** — specificsNeedAggregator + SpecificsNeedEmission type (commit `39f64ed`)

These deliverables ran their own per-edit + three-agent ratification audits at the time, but those audits used Phase 1's discipline rather than the round 1.6 framework. Tue's directive 2026-05-01: *"Let's make sure everything is properly integrated and working together because we build a lot without the foundation of 1.6."*

This doc records the retroactive integrity audit pass. Three parallel agent audits walked each deliverable against round 1.6's five principles, five-test round-0 quality gate, 13-item forbid-list, and the corpus-as-RAG / recognition-vs-delivery architectural sections. Findings closed inline per the fix-now-always discipline.

## Audit scope per round 1.6 section

Round 1.6's framework was designed primarily for the prompt deliverables (D-2.2 through D-2.6) but its principles apply across infrastructure where applicable. This audit explicitly scoped which sections apply to infrastructure code and which are prompt-only:

| Round 1.6 section | Applies to infrastructure? | Notes |
|---|---|---|
| §2.1 Tailored, not generic | Indirect | Applies to closure comments, JSDoc, error messages — they should be tailored to the specific class / pattern, not generic |
| §2.2 Flexible, not formulaic | Indirect | Closed-bookkeeping enums (status, source-layer, priority) are acceptable per Rule 6; closed taxonomies on LLM perception are banned |
| §2.3 Best-of-its-kind, not best-by-rubric | Indirect | API decisions oriented to what the specific class needs, not generic state-machine ceremony |
| §2.4 Issue and approach, not validation | Yes | Error messages should lead with the issue and the operator-approach, not validation framing |
| §2.5 Plain language for the student, precise language only for techniques | Yes (operator-facing) | Operator error text uses appropriate precision without needless analytical jargon |
| §3 Round-0 quality gate (five tests) | Tests 4 (plain-language) + 5 (disposition) apply to comments / error text |
| §4 Corpus as smart RAG source | Indirect | Infrastructure should not bake closed move-taxonomy assumptions that would block the RAG architecture |
| §5 One-shot tendencies to NOT carry over | Yes (most items) | Closed-taxonomy / regex / character-count / numeric-mandate / centrist-default bans apply across the board |
| §6 Generalization as flexible disposition | Indirect | Patterns named in infrastructure should generalize, not be implementation-locked |
| §7 Recognition pattern vs delivery pattern | Mostly N/A for infrastructure (no student-facing output) | Type design preserves the split between recognition data (whyAsked) and delivery seed (framingSeed) |
| §8 Per-layer extension templates | N/A (prompt-only) | Infrastructure sets the API surface the prompts use |
| §10 Forbid-list (13 items) | Yes (most items) | Each item walked against each deliverable |

## Per-deliverable findings

### D-2.1 — QueueManager dig-flow extension

**Verdict:** conforms. Two MEDs closed inline. Two LOWs noted.

| Finding | Severity | Disposition |
|---|---|---|
| F1: §10 items 4, 5, 6, 8, 10, 11, 12, 13 forbid-list clean | OK | Verified |
| F2: §2.1 + §3 test 5 — closure-section comment tailored to class state machine, disposition portable | OK | Verified |
| F3: §2.2 — closed bookkeeping vs Phase-3 lockout — re-ask after decline locked out cleanly via explicit-method requirement | OK | Verified |
| F4: §2.4 / §3 test 3 — closure-section header had ~60 lines for 4 methods with divergence statement duplicated across two paragraphs + spec-deviation re-statement when commit body + L5_IMPLEMENTATION_PLAN.md already carry it | MED | **Closed in commit `bfaca16`** — trimmed to one statement per concern |
| F5: §2.5 / §3 test 4 — dig-missing throw used "invariant-violating" jargon | MED | **Closed in commit `bfaca16`** — replaced with "inconsistent state — likely from direct mutation or persistence corruption" |
| F6: §5.7 validation-padding absent in code, present in commit message conformance recital | LOW | Forward-looking note — D-2.7 / D-2.8 / D-2.11 commit bodies should lead with WHY/divergence, not conformance recital |
| F7: §4 corpus-as-RAG future-compat verified — D-2.1 makes zero closed-taxonomy assumption that would block RAG | OK | Verified |

### D-2.10 — Queue persistence concurrency test

**Verdict:** conforms. Two LOWs (one closed inline, one noted as optional).

| Finding | Severity | Disposition |
|---|---|---|
| F1: §2.1 — every test name pins one specific contract (zero generic "works correctly" patterns) | OK | Verified |
| F2: §2.4 / §5.7 — zero implementation-praise; test comments name contracts | OK | Verified |
| F3: §2.5 / round-0 test 4 — comments explain WHY in plain words (lines 154-164 explain shallow-spread contract without "shallow-reference-aliasing semantics" jargon) | OK | Verified |
| F4: §2.3 — §1 cross-essay isolation tests pin actual production behavior, not idealized abstraction (verified via shallow spread at `questionQueueManager.ts:28`) | OK | Verified |
| F5: §2 round-trip uses realistic JSON.stringify semantics matching Postgres JSONB | OK | Verified |
| F6: §10 item 13 — three slightly-redundant tests in §4 + §6 could consolidate (15 tests instead of 18 with no contract loss) | LOW | Optional polish; not closing — auditor said "not blocking D-2.11/D-2.8/D-2.12" |
| F7: §3 round-0 disposition test — §5.1 test name used production-internal vocabulary (`iterationsSurvived ≥ 3 → high`) | LOW | **Closed in this audit-closure commit** — renamed to "every question that crosses the auto-promotion threshold is promoted in a single curation pass (no skips, no drift)" — framework-agnostic |

### D-2.7 — specificsNeedAggregator + SpecificsNeedEmission type

**Central question of the audit:** Does the type design force D-2.2 through D-2.6 prompts to violate round 1.6 when they emit?

**Auditor's verdict:** *"No CRITICAL or HIGH findings. The type design does NOT force D-2.2-D-2.6 to violate round 1.6."*

| Finding | Severity | Disposition |
|---|---|---|
| F1: §2.1 tailored — content-bearing fields all open string; type leaves swap-test surface on prompt's shoulders | OK | Verified |
| F2: §2.2 flexible — `dimensions: string[]` open routing tags (round-1 audit HIGH-2 closure removed `as HolisticDimension[]` cast); type doesn't force fixed-dimension lens | OK | Verified |
| F3: §2.3 / §10 item 4 — closed enums (sourceLayer, expectedAnswerShape, consumers, priority) are bookkeeping not perception | OK | Verified |
| F4: §2.4 issue-and-approach — `emittingTrigger` required-field nudges toward emission-at-every-trigger and provides no structural pushback against silence-on-working-moves discipline | MED | Type cannot enforce gate (correctly — that's prompt territory). **Forward-looking action item:** D-2.2 through D-2.6 RATIONALE.md MUST explicitly cite §2.4 + §3 Test 3 (silence is the audit signal; emit only on gap-and-approach) |
| F5: §2.5 / §7 / §10 item 12 — recognition vs delivery split structurally honored; type doesn't mix `whyAsked` (recognition) with `framingSeed` (delivery) | LOW | Type does not enforce jargon ban on `framingSeed`; correctly left to round-0 gate at prompt review |
| F6: §4 corpus-as-RAG — nothing in D-2.7 assumes a closed move taxonomy; `populates` field documented as "free-form, not enforced" | OK | Verified |
| F7: §3 Test 5 disposition — type permits portable-disposition framing; nothing constrains emissions to per-essay specifics | OK | Verified |
| F8: §10 items 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13 forbid-list clean | OK | Verified |

## Forward-looking action items (for D-2.2 through D-2.6)

Two items surfaced by the D-2.7 audit that prompt deliverables must honor when they're drafted. These are not closures on D-2.7 itself; they're constraints on the prompts:

1. **D-2.2 through D-2.6 RATIONALE.md MUST explicitly cite §2.4 + §3 Test 3** — silence is the audit signal; emissions earn their spot via gap-and-approach. The `emittingTrigger` required-field on the emission type does not enforce this; the prompt must.
2. **D-2.2 through D-2.6 RATIONALE.md MUST explicitly cite §2.5 + §3 Test 4** — `framingSeed` stays in plain language; analytical jargon (subject-deferral, possession-grammar, etc.) belongs in the LLM's internal recognition, not in the seed the Conversator polishes for the student.

These get added to the per-prompt revision protocol's "Per-round artifacts" section (§9.2 of the benchmark) when each prompt deliverable lands.

## Net verdict

**The foundation under D-2.1, D-2.10, D-2.7 is genuinely round-1.6-clean.** Two MEDs closed inline on D-2.1 (`bfaca16`); one LOW closed inline on D-2.10 (this commit); two forward-looking action items recorded for D-2.2 through D-2.6 RATIONALE.md authoring. No CRITICAL or HIGH findings across any of the three deliverables.

The integrity gap Tue identified ("we build a lot without the foundation of 1.6") was a discipline-marker gap, not a code gap. The deliverables themselves were sound; the framework against which they were measured had been ratified but not formally marked. This audit closes the gap by:
- Marking the benchmark explicitly ratified (commit `c865c15`)
- Walking each deliverable against the ratified round 1.6 framework (this doc)
- Closing the inline-fixable findings (commits `bfaca16` + the D-2.10 polish in this commit)
- Recording forward-looking action items so D-2.2 through D-2.6 authors don't miss the §2.4 / §2.5 disciplines the type cannot enforce structurally

**D-2.11 / D-2.8 / D-2.12 are unblocked.** Proceeding under the ratified round 1.6 discipline.

---

> End of retroactive integrity audit. Ratified by Tue 2026-05-01.
