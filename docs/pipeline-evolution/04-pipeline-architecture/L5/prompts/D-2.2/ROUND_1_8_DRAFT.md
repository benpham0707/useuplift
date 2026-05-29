# D-2.2 — L3 Walk Specifics-Need Emission Prompt — Round 1.8 Draft

**Status:** Round 1.8 — supersedes ROUND_1_7_DRAFT.md after three deep audits + Tue's calibration on Q1/Q2/Q3 (2026-05-01).
**Framework:** PHASE_2_PROMPT_BENCHMARK.md (round 1.6 framework, ratified 2026-05-01)

---

## §0 — What changed from round 1.7 to round 1.8

Three audits surfaced 1 CRITICAL + 5 HIGH + 6 MED + 6 LOW findings on round 1.7. Tue's calibration on the three structural questions resolved the architecture; this round closes everything mechanically.

**Tue's three structural calls:**
1. **User-facing primary** (not system-side primary). Single-tier emission shape. Every emission must justify itself by user benefit.
2. **Don't repeat lessons once user demonstrates understanding.** Unresolved-gap-tied tracker — when user iterates and resolves the original gaps, the cap relaxes for new instances of the same concept.
3. **Hard cap 3 per essay, complexity-driven per-concept caps** (simple=1, medium=2, complex=3 unresolved instances). Plus a user-accessible concept library so the system doesn't have to re-teach inline; the user can look up definitions + examples on demand.

**Audit findings closed by Tue's structural calls:**
- Corpus CRITICAL Q7 (system-side primary not load-bearing) → Tue chose user-facing primary; CLOSED.
- Corpus HIGH Q8 + Conformance MED Q11 (cross-pass over-suppression on iteration) → unresolved-gap-tied tracker; CLOSED.
- Conformance MED Q5 (Mode B "same pattern" violates Test 5 disposition portability) → Mode A/B/C deleted entirely; every emission fires in full coaching mode; CLOSED.
- Conformance MED Q8/Q11 (Mode C `timesTaught >= 3` rigid numeric mandate) → replaced with complexity-based caps tied to unresolved instances; CLOSED.

**Audit findings closed mechanically in this round:**
| Finding | Severity | Closure |
|---|---|---|
| Corpus HIGH Q2: per-paragraph LLM cannot enforce global cap | HIGH | §11 adds post-walk consolidation step (deterministic priority+complexity ranking; trims to top 3) |
| Corpus HIGH Q3: concept tag fragmentation | HIGH | Prose-form `conceptTag` (no snake_case) + reuse policy in §8 + concept gloss in context block |
| Corpus MED Q1: §2.4 self-sufficiency gameable | MED | Constructive-proof rider added: "if the only specific text-grounded coaching is 'ask the writer for the specific thing,' coaching has BECOME the question — re-coach harder" |
| Corpus MED Q6: `expectedDiscovery` theatrical without banned-phrasings | MED | Banned-phrasings list added; Test 8 swap test added to round-0 gate |
| Corpus LOW Q4: Mode B "same pattern" too implicit | LOW | Mode B deleted; Q5 closes via deletion |
| Corpus LOW Q5: Test 7 tiebreaker | LOW | Tiebreaker added: "shape vs detail" — only "different in shape, not better in detail" qualifies as coaching-unlock |
| Conformance MED Q3: snake_case tags leak implementation naming | MED | Prose-form examples replace snake_case throughout |
| Conformance MED Q10: self-sufficiency tested only locally | MED | §2.4 anchored to walk producing corresponding text-grounded coaching artifact (`growthEdge`/`improvementCandidate`) |
| Conformance LOW Q1: `expectedDiscovery` + `conceptTag` not swap-tested | LOW | New Test 8 covers both |
| Conformance LOW Q4: "Most essays land at 3" creates implicit target | LOW | Replaced with distribution language |
| Conformance LOW Q12: "3-5" reads as range | LOW | Reframed as "0-3 emissions per essay (ceiling 3)" |
| Translation HIGH Q7/Q8: cap enforcement locus ambiguous | HIGH | §11 names post-walk consolidation step explicitly |
| Translation HIGH Q6: cross-pass tracker semantics ambiguous | HIGH | §8 names unresolved-gap-tied semantics explicitly |
| Translation LOW Q5: walkContext object vs positional params | LOW | Single `walkContext` object — chosen |
| Translation LOW Q9: Mode-C enforcement hybrid | LOW | Replaced by structural cap; both prompt instruction + post-walk safety filter retained |

---

## §1 — What the L3 walk's specifics-need emission is for

The walk reads the essay sentence by sentence. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page — a moment, a person, a sensory anchor, a stake — that, if specified, would unlock the finding the walk just made.

**Primary purpose: produce questions worth the writer's time.** Every emission is built to surface to the user. If an emission would not be worth surfacing, it should not fire — even if it would benefit the system internally. The system's transparency, finding-maturity tracking, and coaching-readiness benefits are SIDE EFFECTS of producing user-facing emissions, not separate goals.

**Self-sufficiency principle.** Most users will not answer questions until they trust Uplift. The system's coaching MUST work at high quality WITHOUT answers — the emission's job is to UPGRADE coaching when answered, not to ENABLE coaching. An emission whose downstream coaching cannot function without the answer is an anti-pattern.

Most paragraphs produce zero emissions. Across the corpus, essays distribute 0-3 emissions; emit only what passes §2 + §10 selection regardless of where this essay lands.

## §2 — When to emit (six-condition gate)

Emit a `specificsNeedEmission` candidate when ALL of these are true. **At every Yes/No fork below, uncertainty counts as No.** Final selection happens in §10's post-walk consolidation.

**§2.0 — The move on this anchor is reaching but not landing.**
If the writer's craft is working as written, say nothing. Worked example: Sarika's *"Sometimes, I even ran over my friends' toes"* lands as written — the walk recognizes the corpus-level mechanism (reveal-through-consequence, meek framing, inferential geometry) and produces ZERO emission. Silence.

**§2.1 — The finding is real.**
Text-evidenced, not a guess.

**§2.2 — The finding's depth depends on something not on the page.**
Re-reading won't close the gap; later paragraphs won't close it; only the writer can.

**§2.3 — You have an angle for the question.**
Not "tell me more" but a specific direction.

**§2.4 — The answer would UPGRADE coaching, not ENABLE it (self-sufficiency principle).**

**Self-sufficiency test (with constructive proof):**

You must already have produced (or be producing in this same walk output) a corresponding text-grounded coaching artifact for this gap — a `growthEdge`, an `improvementCandidate`, or a finding-with-claim — that does NOT depend on the writer's answer.

If no such artifact exists, the walk has under-coached. **Re-coach harder before considering emission.** The walk's coaching is the floor; the emission is the upgrade lever.

**Constructive-proof rider:** If the only specific text-grounded coaching you can write is *"ask the writer for the specific thing"* — your coaching has BECOME the question. That's the enable case, not the upgrade case. Re-coach.

**Banned trivial phrasings in `expectedInsight`:**
- *"Matures the finding from hypothesis to confirmed."*
- *"Makes the coaching more concrete."*
- *"Reduces fabrication risk."*
- *"Improves the system's understanding."*
- *"Helps L5 generate better feedback."*

These are categories. Name the SPECIFIC content per round 1.6's content-specificity rule.

**§2.5 — Surface-vs-deep test (Test 7 in §12).**

The emission must dig at a discovery OR a coaching-unlock:
- **(a) Discovery:** answering would surface a pattern, inversion, hidden choice, or unowned emotion the writer hasn't seen in their own essay.
- **(b) Coaching-unlock:** answering would let the system coach in a fundamentally different SHAPE, not just better in detail. *"Different shape"* = the coaching's mode changes (e.g., now we can model consequence-style reveal on the writer's actual material). *"Better in detail"* = the coaching gets richer but is fundamentally the same. Only *different shape* qualifies.

**Banned trivial phrasings in `expectedDiscovery`:**
- *"the writer would discover what they were feeling"*
- *"the writer would discover their actual emotion"*
- *"the writer would discover a specific detail"*
- *"the writer would discover more about themselves"*

Name the SPECIFIC discovery: WHICH pattern, WHICH inversion, WHICH unowned emotion. *"the writer would discover that 'freeing' was the easy word covering longing or envy"* / *"the writer would discover that grandma appears twice with the same word and the repetition is protective."*

If any of §2.0-§2.5 is false → no emission candidate. Stay silent.

## §3 — Shape of an emission (mapping to extended `SpecificsNeedEmission`)

```jsonc
{
  "sourceLayer": "l3_walk",                    // fixed for this prompt

  "emittingTrigger": string,                   // the finding's CLAIM TEXT — one short sentence naming what the finding noticed.

  "anchorParagraph": number,
  "anchorSentence": number | undefined,

  "question": string,                          // the actual question — short, specific, plain language.

  "dimensions": string[],                      // pass through from finding's `dimensions`. Empty array → do not emit.

  "expectedInsight": string,                   // ONE SENTENCE: how the answer UPGRADES coaching. Banned trivial phrasings in §2.4.

  "expectedDiscovery": string | null,          // ONE SENTENCE: what the writer would DISCOVER about their own essay. null only if value is purely (b) coaching-unlock with no discovery component. Banned trivial phrasings in §2.5.

  "conceptTag": string,                        // (RENAMED + REFRAMED round 1.8) short PROSE phrase naming the writing principle this emission teaches. NOT snake_case — implementation naming leaks audit register. Examples: "specific over general", "discovery over delivery", "concrete moment over summary", "honest word over easy word", "show through consequence", "register calibration", "repetition as signal". Free-form (Rule 3 compliant).
                                               //
                                               // REUSE POLICY: before minting a new tag, scan `conceptLibrary[]` already present in the profile. Reuse an existing tag if the underlying mechanism is identical — not just thematically similar. Two tags differ only if a writer who internalized concept A would not yet have internalized concept B.

  "conceptComplexity": "simple" | "medium" | "complex",  // (NEW round 1.8) drives per-concept emission cap (§10):
                                                          //   simple   → max 1 unresolved instance per essay (e.g., "be specific")
                                                          //   medium   → max 2 unresolved instances per essay
                                                          //   complex  → max 3 unresolved instances per essay (e.g., "discovery over delivery + meek framing + inferential geometry combined")
                                                          // Independent of the per-essay total cap (§10's hard 3 ceiling).

  "conceptDefinition": string,                 // (NEW round 1.8) ONE-SENTENCE universal definition of the concept, written generically (NOT this student's essay). Stored in the concept library; user can reference on demand. Example: "Specific over general means choosing the precise concrete detail (a chair, an hour, a smell) over the abstract category (a place, sometime, a feeling) because precision earns trust where abstraction loses it."

  "conceptExample": string,                    // (NEW round 1.8) ONE corpus-quality EXAMPLE demonstrating the concept, generic — NOT this student's essay. Stored in the concept library. Example: "From a college essay: 'Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey.' — pairs a concrete time-marker with an unexpectedly specific decision."

  "priority": "critical" | "high" | "medium" | "low",  // structural two-question test:
                                                       //   Q1: Without the answer, does the finding's claim collapse? YES → critical
                                                       //   Q2: Without the answer, can downstream coaching still be specific?
                                                       //       NO → high
                                                       //       YES → medium
                                                       //   "low" reserved for emissions where the walk is uncertain whether to emit at all (per §2 silence default, prefer not emitting).

  "whyAsked": string,                          // recognition-pattern: WHY the gap is writer-only. Internal — not student-facing. Allowed jargon.

  "expectedAnswerShape": "scalar" | "short_phrase" | "specific_memory" | "list" | "narrative",

  "consumers": string[],                       // for L3 walk, almost always ["l3", "l5"]. Add "finding_maturity" when answer would mature finding's claim.

  "populates": string[],                       // free-form tags.

  "framingSeed": string                        // delivery-pattern seed. MUST embed student's actual line as a quote. Length matches gap and angle. More than three sentences is almost always padding.
}
```

## §4 — Recognition vs delivery split

- **`whyAsked` / `expectedDiscovery` / `expectedInsight` / `conceptTag` / `conceptDefinition` / `conceptExample`** — recognition. Internal, allowed jargon (where applicable), not surfaced verbatim to student.
- **`framingSeed`** — delivery. Student-facing, plain language, MUST embed student's line.

## §5 — Plain-language calibration on `framingSeed`

Every emission fires in full coaching mode. No tiered framing modes (round 1.7's Mode A/B/C deleted — the don't-overwhelm logic is now structural via §8 + §10, not prompt-level).

**Pattern:** quote the student's line, name the gap using framing rooted in this essay's specifics, seed candidate answer-shapes when the gap is moment-shaped, and where possible name the writing principle the move embodies INSIDE the seed itself — that turns the question into teaching.

**Anti-pattern: template with quote slot.**
The framing language around the quote MUST come from THIS essay's specifics — the texture of the relationship, the architecture of the scene, the register the essay reaches for. Quote-slot tailoring is not §2.1 tailoring.

**Anti-pattern: jargon leak.**
*"Your finding F12 has deepeningPotential."* (engineering)
*"Subject-deferral grammar in P1S2 invites recovery of authentic interior."* (analytical jargon)

**Anti-pattern: validation padding.**
*"Your description of the dance is beautiful and full of vivid imagery..."* (validation opener — round 1.6 §5.7)

**Corpus-bar examples:**

1. *(Dance-watching, "freeing" inversion)*
*"You wrote that watching her dance was 'freeing' — what did being the kid who couldn't move that way actually feel like? Not the sad version, the actual one. Was it longing, or anger, or something quieter that 'freeing' is the inverse of? The honest word under that one is what makes the rest land."*

2. *(Friendship, abstract relational gap)*
*"You said your friends 'didn't get it.' What did one specific moment look like — was it a face one of them made, a sentence that landed wrong, a conversation that ended too fast? One real moment we can hear and see lands harder than the summary, and it lets us figure out the not-getting-it the way you lived it."*

3. *(Grandmother, function-not-person)*
*"You wrote that your grandmother was 'kind.' Kind is the word everyone uses for their grandmother. What did she do that no one else's would? One specific thing — a phrase she said, a small ritual, the way she fixed something — and we'd see her instead of hearing about her."*

The seed teaches the writing principle INSIDE the question. Every emission fires this way.

## §6 — Issue-and-approach calibration

If removing the seed's first sentence loses nothing important, the first sentence is filler. Quote-then-gap-then-angle, no padding.

## §7 — Anti-repetition discipline

**§7.1 — Cross-paragraph anti-repetition (architecturally enforced).**
The walk receives `priorEmissions[]` in the per-paragraph user prompt. Drop emissions that:
- Quote the same student line + target the same gap as a prior emission.
- Use the same angle phrasing → revise to be specific to this paragraph's material, OR drop.
- Surface the same gap from a different finding → drop. Earlier emission already covers it.

**§7.2 — Single-line gap bundling.**
When a single line carries multiple distinct gaps, prefer ONE emission whose angle bundles them — UNLESS the gaps need fundamentally different answer-shapes.

**§7.3 — Concept library handles cross-essay-run repetition.**
The library (§8) tracks concepts taught + their resolved/unresolved status. Per-concept caps (simple=1, medium=2, complex=3 unresolved instances) enforce don't-overwhelm at the structural level. The prompt does NOT need Mode A/B/C selection — the library + caps are the mechanism.

**§7.4 — Aggregator dedup is the safety net.**
D-2.7 catches identical/near-identical emissions via Jaccard threshold 0.5. The walk should not lean on this — repetitive emissions should not be emitted.

## §8 — Concept library + unresolved-gap-tied tracker (NEW round 1.8)

**Purpose.** User-accessible library of concepts taught + system-side tracker of which instances are unresolved. Replaces round 1.7's Mode A/B/C tracker. Tied to user demonstration of understanding (concept caps relax when user resolves prior instances).

**Profile state:**
```typescript
interface ConceptLibraryEntry {
  tag: string;                                         // prose form, e.g., "specific over general"
  complexity: 'simple' | 'medium' | 'complex';
  definition: string;                                  // universal one-sentence
  example: string;                                     // generic corpus-quality
  instances: Array<{
    paragraph: number;
    sentence?: number;
    iteration: number;                                 // which walk pass produced this instance
    gapResolved: boolean;                              // updated by gap-resolution detector at re-walk
    resolvedAtIteration?: number;
  }>;
}

// On EssayProfile root, sibling of questionQueue
conceptLibrary: ConceptLibraryEntry[];
```

**Library is append-only across walk passes.** Once a concept is taught, its entry persists. Across iterations, instances accumulate. The library is **user-accessible on demand** (via dig flow UI — user can look up concept definition + example anytime).

**Gap-resolution detection (re-walk time).**
When a re-walk runs on the user's iterated draft, the walk receives the prior `conceptLibrary[]` state. For each prior unresolved instance:
- Re-read the same anchor (paragraph + sentence) in the iterated draft.
- Does the same gap still exist? If yes → `gapResolved: false` (still unresolved). If no → mark `gapResolved: true`, set `resolvedAtIteration: currentIteration`.
- Detection is the walk's judgment — the prompt instructs: "for each prior instance, judge whether the gap the prior emission flagged has been closed in the current draft."

**Cap-by-complexity (per concept):**
- Simple → max 1 *unresolved* instance per essay
- Medium → max 2 *unresolved* instances per essay
- Complex → max 3 *unresolved* instances per essay

When user resolves prior instances (gap detection marks them resolved), the cap-relevant count drops, and new instances of the same concept can fire. **Demonstrated understanding releases the cap.**

**Walk reads `conceptLibrary[]` in user prompt context block.** For each existing entry: tag (prose), complexity, count of unresolved instances, glosses of those instances. The walk uses this to:
1. Decide whether to mint a new concept tag or reuse an existing one (reuse policy from §3).
2. Check whether emitting on this concept would exceed the per-concept complexity cap.

## §9 — Schema placement and storage

`specificsNeedEmissions` is a top-level sibling of `paragraphUnderstanding` in the walk output:

```jsonc
{
  "paragraphUnderstanding": { ... },
  "sentenceUnderstandings": [ ... ],
  "holisticEvolution": { ... },
  "priorSentenceUpdates": [ ... ],
  "newConnections": [ ... ],
  "newFindings": [ ... ],
  "findingEvolutions": [ ... ],
  "specificsNeedEmissions": [ /* per §3 */ ]
}
```

**Storage write-back:**
1. Parse `specificsNeedEmissions` from walk output's top level.
2. Copy onto `paragraph.understanding.specificsNeedEmissions` (D-2.7 type location).
3. For each emission, append to `profile.conceptLibrary[]` instances (or update existing entry's instances if `conceptTag` already in library).
4. Post-walk consolidation step (§10) trims emissions to per-essay 3 max + per-concept complexity caps.

## §10 — Volume: 0-3 emissions per essay (ceiling 3), complexity-driven per-concept caps

**Hard ceiling: 3 emissions per essay total.** Distribution: most essays land at 0-3 depending on what gaps exist; emit only what passes §2 + §10 regardless of where this essay lands.

**Per-concept complexity caps (counted as UNRESOLVED instances across the essay's history):**
- Simple concept → max 1 unresolved instance (cap fires on 1st)
- Medium concept → max 2 unresolved instances (cap fires on 3rd)
- Complex concept → max 3 unresolved instances (cap fires on 4th)

**Hard ceiling AND per-concept caps both apply.** If an essay has 3 simple-concept gaps, the system emits 1 (per-concept cap fires) — NOT 3 of the same simple concept. If an essay has 1 complex-concept gap, the system emits 1 (under the complex cap of 3, under the per-essay cap of 3).

**Selection (post-walk consolidation):**
1. Each paragraph's walk produces emission candidates.
2. After all paragraphs walk, the consolidation step:
   - Groups candidates by `conceptTag`
   - For each concept group, applies the complexity cap (e.g., complex → keep top 3 unresolved candidates; simple → keep top 1)
   - Across all surviving candidates, ranks by `priority` (critical > high > medium > low) then by emission order (earlier paragraph first)
   - Trims to 3 total
3. Surviving emissions land on `paragraph.understanding.specificsNeedEmissions` arrays; dropped candidates are not emitted (but their `conceptTag` may have been written to library if logic order matters — see §11.7).

**0 real gaps → 0 emit.** The cap is a CEILING, not a target.

**Surface-level emissions banned** (§2.5 + Test 7 close this).

## §11 — Translation work order (architectural commitments)

1. **Type extension #1.** `SpecificsNeedEmission` (`profileTypes.ts:5912-5959`) gets:
   - `expectedDiscovery: string | null`
   - `conceptTag: string` (required, non-empty prose)
   - `conceptComplexity: 'simple' | 'medium' | 'complex'`
   - `conceptDefinition: string` (required, non-empty)
   - `conceptExample: string` (required, non-empty)
   The new fields are required (except `expectedDiscovery` which is `string | null`).

2. **Type extension #2.** Define `ConceptLibraryEntry` interface (per §8). Add `conceptLibrary: ConceptLibraryEntry[]` to `EssayProfile` root (`profileTypes.ts:2353`), sibling of `questionQueue`.

3. **Type extension #3.** `UnderstandingWalkOutput` (per round 1.6 §11.1) gets `specificsNeedEmissions?: SpecificsNeedEmission[]` top-level optional.

4. **Migration.** `EssayProfileCoordinator.fromCheckpoint`: default `conceptLibrary: []` for legacy profiles. Mirrors `improvementCandidateSnapshot` migration pattern.

5. **Aggregator validator extension** (`specificsNeedAggregator.ts:295-438`):
   - `expectedDiscovery`: accept `string | null`; if string, non-empty after trim.
   - `conceptTag`: required non-empty string.
   - `conceptComplexity`: required, one of three enum values.
   - `conceptDefinition`: required non-empty string.
   - `conceptExample`: required non-empty string.

6. **Walk OUTPUT_SCHEMA literal** (`sequentialDeepWalk.ts:328-423`): insert 8th top-level field block per §3.

7. **Walk SYSTEM_PROMPT_TEMPLATE prose**: insert §1-§10 between IMPROVEMENT_CANDIDATE_EMISSION example and CRITICAL_REMINDERS.

8. **`buildUserPrompt` extension**: add `walkContext: { priorEmissions: SpecificsNeedEmission[]; conceptLibrary: ConceptLibraryEntry[] }` parameter. Inject context blocks:
   - `=== PRIOR EMISSIONS IN THIS WALK ===` listing each prior emission's `framingSeed`, `anchorParagraph`, `conceptTag`, `whyAsked`.
   - `=== CONCEPT LIBRARY (concepts taught in this essay) ===` listing each library entry: `conceptTag` (prose), `complexity`, count of unresolved instances, instance glosses (paragraph + iteration + resolved status).

9. **Gap-resolution detection.** New helper in walk: for each `conceptLibrary[].instances[]` with `!gapResolved`, the walk judges whether the prior gap still exists in the current draft. Updates `gapResolved` and `resolvedAtIteration` accordingly. Wire-up before the per-paragraph loop so the walk sees the resolved/unresolved state in its context.

10. **`parseSpecificsNeedEmissions`** helper in `parseWalkOutput`: STRICT-PASSTHROUGH, no defensive coercion. Validates new required fields per §11.5.

11. **`applyWalkOutputToProfile` write-back** (`sequentialDeepWalk.ts:1728`):
    - After `para.understanding = output.paragraphUnderstanding`, write `para.understanding.specificsNeedEmissions = output.specificsNeedEmissions` (if present).
    - For each emission, find or create entry in `profile.conceptLibrary[]` by `conceptTag`. Append new instance to `instances[]` with current `iteration`, `gapResolved: false`.

12. **NEW: post-walk consolidation step.** In `sequentialDeepWalk.ts` after per-paragraph loop completes, before return:
    - Collect all emissions across paragraphs.
    - Group by `conceptTag`. For each group, apply complexity cap: keep top N (N = 1/2/3 by complexity) ranked by `priority` then emission order.
    - Across all surviving candidates, rank by `priority` then emission order; trim to 3 total.
    - Write trimmed result back to per-paragraph `paragraph.understanding.specificsNeedEmissions`.
    - Concept library entries for trimmed emissions are also rolled back (instance not appended).

13. **Test fixture migration.** Four fixture builders need updates (D-2.7 unit, D-2.8 unit, D-2.11 property, D-2.12 integration). Add `expectedDiscovery: null`, `conceptTag: 'specific over general'`, `conceptComplexity: 'simple'`, `conceptDefinition: '...'`, `conceptExample: '...'` defaults. ~60 lines mechanical migration.

14. **New tests:**
    - Walk → aggregator round-trip with new fields
    - Cross-pass concept library persistence + gap-resolution detection
    - Volume cap enforcement: 8 candidates → trimmed to ≤ 3 by post-walk consolidation
    - Per-concept complexity cap: 4 simple-concept candidates → 1 emit; 4 complex-concept candidates → 3 emit
    - Concept tag reuse policy: walk encounters existing tag in library, reuses rather than mints new

15. **Calibration deferred** to 14-essay corpus runs.

## §12 — Round-0 quality gate (eight tests, fires before any other quality check)

**Test 1 — Tailored swap.** Could each emission appear word-for-word on a different student's essay? PASS only if `emittingTrigger` and `framingSeed` are essay-specific.

**Test 2 — Purpose swap.** Could each emission appear on an essay reaching for a different purpose? PASS only if rooted in this essay's architecture.

**Test 3 — Issue-and-approach.** Would removing `framingSeed`'s first sentence lose anything? If no, the first sentence is filler.

**Test 4 — Plain-language.** Would a high-school student understand `framingSeed` without looking up vocabulary? PASS only if yes.

**Test 5 — Disposition.** Does the angle generalize as a portable disposition? PASS only if yes.

**Test 6 — `expectedInsight` swap.** Could it appear word-for-word on a different essay's emission? If yes, drop.

**Test 7 — Worth the writer's time.** Would answering surface a discovery (Test 7a) OR unlock a coaching move different in SHAPE (Test 7b)? Tiebreaker on Test 7b: only "different in shape, not better in detail" qualifies.

**Test 8 — `expectedDiscovery` + `conceptTag` swap (NEW round 1.8).** Could either appear word-for-word on a different essay's emission? If yes, the emission is theatrical — drop.

## §13 — RATIONALE.md anchors (for ratification)

- §2.4 + §3 Test 3 — silence is signal (D-2.7 audit forward-looking action item)
- §2.5 + §3 Test 4 — `framingSeed` plain-language discipline (D-2.7 audit forward-looking action item)
- §7 recognition vs delivery — operator-facing fields vs `framingSeed` structurally split
- **Tue calibration #1** — user-facing primary purpose; system-side benefits are side effects
- **Tue calibration #2** — unresolved-gap-tied tracker; cap relaxes when user demonstrates understanding via iteration
- **Tue calibration #3** — hard cap 3 per essay + complexity-driven per-concept caps + user-accessible concept library
- §5.4 mega-shape defense — adding 8th top-level walk field is recognition-of-gaps within L3's existing scope; new sub-fields (`expectedDiscovery`, `conceptTag`, `conceptComplexity`, `conceptDefinition`, `conceptExample`) extend the emission record cleanly.
- Architectural commitment §11 — `buildUserPrompt` extension threads prior emissions + concept library; gap-resolution detection runs before per-paragraph loop; post-walk consolidation step enforces caps deterministically.

---

## Round-0 self-check after round 1.8 revision

- **Test 1 Tailored:** PASS
- **Test 2 Purpose swap:** PASS
- **Test 3 Issue-and-approach:** PASS
- **Test 4 Plain-language:** PASS
- **Test 5 Disposition:** PASS (every emission fires in full coaching mode; no Mode B "same pattern" pointer leak)
- **Test 6 `expectedInsight` swap:** PASS (banned-phrasings + content-specificity)
- **Test 7 Worth the writer's time:** PASS (§2.5 surface-vs-deep + shape-vs-detail tiebreaker)
- **Test 8 `expectedDiscovery` + `conceptTag` swap:** PASS (banned-phrasings on `expectedDiscovery` + reuse policy on `conceptTag`)

**Forbid-list 13/13 clean:**
- Item 4 closed-taxonomies-on-perception: `conceptTag` free-form prose; `conceptComplexity` is bookkeeping (drives cap, not perception).
- Item 6 char/sentence min/max: round 1.7's "Never four" → "more than three is almost always padding" (round 1.6 closure retained).
- Item 8 numeric mandate: per-concept caps tied to *unresolved* instances (relax on user demonstration) — not rigid counter; user behavior controls cap relaxation.
- Item 13 generalization shortcuts: §10 "0-3 emissions per essay (ceiling 3)" — distribution language, not target.

**Both round 1.5 open items closed structurally** (priority via two-question test; anti-repetition via §11.8 architectural commitment).

**All round 1.6 + 1.7 closures retained.**

**All Tue calibrations applied** (user-facing primary, demonstration-of-understanding tracker, hard-3-cap with complexity caps, user-accessible library).

**All audit findings closed inline** (1 CRITICAL via Tue Q1; 5 HIGH via §10 consolidation + §8 library + Q2/Q3 prose tags + reuse policy + complexity caps; 6 MED via §2.4 constructive proof + banned-phrasings + Mode A/B/C deletion + corresponding-coaching-artifact anchor; 6 LOW via Test 8 + distribution language + ceiling-not-range + tiebreakers).

---

## Net verdict on round 1.8

All audit findings closed. All Tue calibrations applied. Schema is a clean extension; cross-pass tracker semantics are explicit (unresolved-gap-tied); cap enforcement locus is named (post-walk consolidation step); concept library is user-accessible by design.

**Ready for ratification.** If ratified → translation per §11 → calibration runs against the 14-essay corpus.
