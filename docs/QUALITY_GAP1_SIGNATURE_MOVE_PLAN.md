# Quality Gap 1 — Signature Move Identification (REVISED v2)

> Filed under `docs/` to avoid stomping the authoritative `PLAN.md` (Essay Intelligence System, 6157 lines).
> Scope: closes Gap 1 from the output-quality handoff (60→85 cycle). Single capability, single PR.
>
> **v2 changelog**: Reworked after deep audit found 4 high-severity issues in v1:
> A1 (placement: dedicated micro-call, not Phase B inflation), B1 (schema must support structural moves),
> B2 (paragraph indexing — match existing zero-indexed convention), C1 (structural validation criteria),
> D1 (L4 must not destroy the move it just identified). Plus 11 lower-severity refinements.
>
> **v2.1 changelog**: Token-waste pass — orchestration runs signatureMove parallel with CURATION (saves
> ~15-30s/run via `Promise.allSettled` failure isolation), L4 directive tightened to 2 sentences (rule +
> framing, dropped restated rationale), DISTINCTION + COMPOUND MOVES prompt sections compressed without
> losing teaching, schema docstring dedup. Rejected: input-context pruning (CLAUDE.md *"quality over
> cost — full prompts, no compression"*), optional `whatThisInstanceShows` (consumer-side complexity
> exceeds token savings), anti-example compression (highest-leverage teaching element — don't risk).

---

## What we're adding (one sentence)

A new **counselor-grade single-sentence claim** about the writer's ONE defining structural-rhetorical move — the move that IS their signature — emitted by a dedicated post-Phase-B Sonnet micro-call in L3.75, grounded in cited paragraph evidence (sentence quotes OR structural spans), surfaced in dump output, and read by L4 as a do-not-destroy constraint on improvement priorities.

## Why this design (lock-in for future maintainers)

The system already has 7 overlapping craft lenses (`voiceIdentity.signature`, `narrativeStrategy.primaryStrategy`, `craftAssessment.strengthSignatures[]`, `craftPatterns[]`, `imageSystem`, `sentencePatterns`, `wordPatterns`). Adding signatureMove makes 8.

**This is deliberate inversion, not accumulation.** The existing 7 are PARALLEL LENSES — each names a different angle of craft, all in list form. Their collective output is accurate but undifferentiated, which is exactly what the audit's 60→85 verdict identifies as the system's quality ceiling. signatureMove is a SYNTHESIS LENS whose job is concentrating attention, not adding angle. The cognitive stance is "step back and name the ONE thing," explicitly different from the cataloging stance of the other seven.

**Do not consolidate signatureMove with strengthSignatures.** They look similar (both name craft observations) but solve opposite problems: strengthSignatures answers "what does this writer do well?" (plural, list); signatureMove answers "WHO is this writer at the craft level?" (singular, identity). Folding them together collapses the synthesis stance back into a list, returning the system to its 60/100 ceiling.

**Do not move signatureMove into Phase B.** Phase B's job is generating the seven parallel lenses. Phase B's prompt budget already warns of truncation risk above 7000 tokens. Co-locating the synthesis stance with the cataloging stance corrupts both: the LLM either over-elaborates strengthSignatures into faux-singularity, or under-elaborates signatureMove into a generic strength. The dedicated post-Phase-B micro-call separates the two cognitive stances by separating the API calls.

**Do not drop the L4 preserve directive.** Without it, L4's general "improve the essay" mandate freely recommends improvements that erase the writer's identity move. The 2-sentence directive narrows L4's permitted action space — focus-sharpening, not scope-bloating.

**`null` is a real output, not a failure.** Some essays succeed by distributing craft rather than concentrating it. The dump's null-rendering teaches this. Removing the null path forces fabrication on essays that don't have a single defining move.

## Why this gap, why first

The audit ranked signature-move identification highest-leverage of the five output gaps. The reference reviews lead with this exact framing:

- Crochet: *"compressed-heritage-essay architecture... misdirection-via-taxidermy-inference"* (review intro paragraph)
- Three Days: *"hook through disproportion between high-stakes time-marker and trivial decision"* + *"causal-chain triplet architecture"* (Move 1, Cluster 1)

Counselors lead with this because the rest of the analysis hangs off it — once you can name the move, you can defend it, replicate it, and contrast it. Without it, the system produces accurate-but-undifferentiated lists. Adding the singular signature move is also the cheapest gap (~$0.05-$0.10 incremental per essay) and creates **positive downstream pressure**: a populated signatureMove gives L3.5 architectural context that prevents drift modes like the audit-cataloged Crochet "tonal rupture" mis-read of the patchwork-quilt closing (where the closing is actually earned-by-material because the whole essay is fiber-arts). When L3.5 can see "consistent fiber-arts metaphor threading is THIS writer's signature move," the closing gets read as consistent with craft, not as a rupture.

## Architectural placement (REVISED — A1)

### Dedicated post-Phase-B micro-call, not a Phase B field

The signatureMove is its own L3.75 sub-call, mirroring the existing META (`holisticSynthesis.ts:750`) and CURATION (`holisticSynthesis.ts:819`) micro-calls. **Orchestration**: runs AFTER Phase A + Phase B + META complete, **in parallel with CURATION** — both consume META.readingStrategy; neither consumes the other's output. Implementation: `Promise.allSettled([curationCall, signatureMoveCall])` after META resolves, so a failure in one cannot block the other. Saves ~15-30s wall-clock vs. serial-after-CURATION; zero quality risk because signatureMove doesn't read CURATION output. **Input context is the full holistic synthesis** (Phase A + Phase B + META.readingStrategy) — no pruning, per CLAUDE.md: *"Quality over cost for AI calls — full prompts, no compression. Use prompt caching for savings."*

**Why this beats embedding it in Phase B's `craftAssessment`:**

1. **Phase B is already crowded.** Its own prompt (`holisticSynthesis.ts:533`) warns: *"Total output should land at ~5000-7000 tokens — leave headroom under the 14000 cap so all 6 required sections complete... A truncated output that omits admissionsPositioning or entanglements gets rejected entirely."* Adding a 7th section worsens truncation risk.
2. **Quality of input.** A separate call sees the FINISHED voice signature (Phase A) + craft assessment + thematic architecture + narrative strategy (Phase B) as input. Embedded would be co-generating with them — strictly worse signal.
3. **Cognitive focus.** Phase B asks the LLM to do six unrelated synthesis tasks at once. Signature move requires a different cognitive stance ("step back and name the ONE thing"). Single-purpose prompt = sharper output.
4. **Pattern match.** META and CURATION already exist as separate Sonnet calls in the same file with their own `MAX_TOKENS` / `TIMEOUT_MS` constants. Adding `SIGNATURE_MOVE_MAX_TOKENS = 3000`, `SIGNATURE_MOVE_TIMEOUT_MS = 90_000` is consistent with established structure.

### Storage location

`craftAssessment.signatureMove: SignatureMove | null` — namespace the field under `craftAssessment` (where it logically belongs as a craft observation), but populate it from the dedicated call rather than from Phase B's craftAssessment generation. The mutator wires it in after the synthesis call completes.

This keeps the API surface clean (one `craftAssessment.signatureMove` field for downstream readers) without forcing the Phase B generator to produce it.

## Schema (REVISED — B1, B2, B5)

```ts
/**
 * The ONE defining structural / voice / rhetorical move that IS this writer's
 * craft fingerprint. Distinct from `strengthSignatures` (plural list of things
 * the writer does well) and `voiceIdentity.signature` (prose description of
 * voice). The signature move is a single repeatable technique cited at
 * specific paragraphs that an outside reader would recognize as "this writer."
 *
 * Null when the essay has no clear single move — that is a real signal, not a
 * failure. Do not invent a move to fill the field.
 */
export interface SignatureMove {
  /** One sentence, counselor-grade. Names the move concretely:
   *  syntactic / structural / rhetorical shape + WHERE it appears.
   *  Compound-move guidance (when X+Y counts as one move vs. two) lives
   *  in the prompt, not here.
   *
   *  Examples (drawn from $500/hr human reviews):
   *  - "Compressed-heritage opener with implied-wrong-hypothesis (taxidermy
   *    misdirection at P1) followed by accumulated-specifics (Agnes the
   *    cornflower-blue elephant at P4)."
   *  - "Hook-by-disproportion between a high-stakes time-marker and a trivial
   *    decision (P1S1), repaid by causal-chain triplets that map fear→relief
   *    element-by-element across P4." */
  oneSentenceName: string;

  /** Why this is THIS writer's move, not just a generic technique. 1-2
   *  sentences. MUST reference content-specific information from THIS essay
   *  (e.g., "650 words covering a century" for compression, "Izzy scene" for
   *  Three Days). Generic transferable claims are forbidden — they signal the
   *  LLM did not actually engage with the essay's specifics. */
  whyItIsTheirs: string;

  /** Cited evidence. Minimum 3 instances. Heterogeneous evidence types:
   *  some moves are sentence-level quotes (Agnes the elephant); some are
   *  paragraph-level structural patterns (P2 carries the entire family
   *  history in 10 sentences — the COMPRESSION is the move, no quote
   *  represents it). Schema supports both. */
  instances: SignatureMoveInstance[];

  /** What the move does for the reader's experience. 1 sentence. Pure
   *  cognitive / felt effect (committed, surprised, primed for X, structural
   *  relief, etc.). NOT "it's good" / "it works." Judgment lives in L3.5. */
  readerEffect: string;
}

export type SignatureMoveInstance =
  | {
      kind: 'sentence_quote';
      /** Reuses existing ParagraphLocation type (profileTypes.ts:594).
       *  ZERO-INDEXED to match the rest of the codebase
       *  (dump-full-profile.ts:625 applies +1 at render time). */
      location: ParagraphLocation;
      /** Verbatim excerpt from the essay, ≤40 words. Validator confirms
       *  this string is a substring of the cited paragraph text after
       *  whitespace + smart-quote + em-dash normalization. */
      quotedText: string;
      /** One sentence: how this specific instance is the move (not a generic
       *  description of the move itself). */
      whatThisInstanceShows: string;
    }
  | {
      kind: 'paragraph_compression';
      /** Zero-indexed paragraph; the compression IS this paragraph. */
      paragraph: number;
      /** One sentence describing what is compressed and into what space
       *  (e.g., "P2's ten sentences carry a century of family history,
       *  the grandfather's thirteen-year imprisonment, and three-generation
       *  craft transmission"). */
      whatThisInstanceShows: string;
    }
  | {
      kind: 'cross_paragraph_pattern';
      /** Zero-indexed paragraphs where the pattern recurs. Min 2 entries. */
      paragraphs: number[];
      /** One sentence describing the pattern that links these paragraphs
       *  (e.g., "wizard-magic vocabulary returns at P2 / P3 / P4, threading
       *  the metaphor across the essay"). */
      whatThisInstanceShows: string;
    };
```

**LLM-first compliance**:
- No enum of move types (the LLM names the move freely in `oneSentenceName`).
- The three `kind` values are FUNCTIONAL routing tags, not perception-limiters — the LLM decides which evidence type fits each instance, and the schema accepts any combination. (Per Rule 3: closed enums are appropriate for system bookkeeping / routing tags.)
- `null` is the escape hatch when no single move exists — not fabrication pressure.
- All quotes verified verbatim by referential-integrity check (not quality regex). (Per Rule 6.)

**Paragraph indexing**: zero-indexed at the data layer, matching `ParagraphLocation`, `strengthSignatures.paragraphs[]`, and every other paragraph reference in the codebase. The dump renderer applies `+1` (existing pattern: `paragraphs.map(p=>p+1).join(',')` at `dump-full-profile.ts:625`). No new inconsistency introduced.

## Files to modify (REVISED)

| File | Change | Notes |
|---|---|---|
| `src/services/essayIntelligence/profileTypes.ts` | Add `SignatureMove` + `SignatureMoveInstance` types. Add `signatureMove?: SignatureMove \| null` to `CraftAssessment` (line 1315-1355). | Optional → legacy profiles parse cleanly. |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | Add `SYSTEM_PROMPT_SIGNATURE_MOVE` constant + `SIGNATURE_MOVE_MAX_TOKENS = 3000` + `SIGNATURE_MOVE_TIMEOUT_MS = 90_000` (mirroring META / CURATION pattern). Add `synthesizeSignatureMove()` method. Wire into `synthesize()` orchestration as: `META → Promise.allSettled([curationCall, signatureMoveCall])`. Pass full synthesis context (Phase A + Phase B + META.readingStrategy). | Parallel with CURATION — saves ~15-30s; failure-isolated via allSettled. |
| `src/services/essayIntelligence/profileManager/mutators/holisticMutator.ts` | Wire `signatureMove` field through into the persisted `craftAssessment`. | Mirrors existing craftAssessment fields. |
| `src/services/essayIntelligence/profileManager/validation/intraDomainValidation.ts` | New validator: if `signatureMove != null`, every `sentence_quote` instance's `quotedText` must be a verbatim substring of the cited paragraph text (case-insensitive, whitespace-normalized, smart-quote → straight, em-dash variants normalized). Every `paragraph` / `paragraphs[]` index must be in range. On any failure: drop signatureMove to null, log diagnostic. Never fabricate. | Defense against the audit's Three Days drift pattern (P0S4-vs-P0S5 attribution). |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | L4b prompt (~line 546+, around line 943's `prioritizedImprovements` instructions): add two sentences: *"If `craftAssessment.signatureMove != null`, prioritize improvements that PRESERVE the cited instances; rank improvements that would erase them as net-negative. Where possible, frame near-the-move improvements as 'preserve X while doing Y' rather than as replacements."* | D1 fix — prevents L4 from priority-ranking improvements that delete the move L3.75 just identified. |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` (~line 841) | When the new signatureMove sub-call's cost row is recorded, mark it nested under L3.75 (or exclude from the L3.75 aggregate row). | Audit finding H-2 (aggregate L3.75 double-counts). Adding a sub-call without this fix WORSENS H-2. |
| `tests/dump-full-profile.ts` (~line 615 where `ca` is bound) | Render `signatureMove` as a callout BEFORE `strengthSignatures` in the craft section. Heading text: literal `"### Signature Move"` (no system jargon). When null, render the teaching line specified in §"Null rendering" below. | One H3, the one-sentence name, then evidence with `+1` paragraph display. |
| `tests/test-signature-move-validation.test.ts` (NEW) | Vitest unit test: substring validator drops field to null when quote is not in cited paragraph; passes when quote is verbatim; passes when only structural instances are present. NO API call. | Tests B1 + C2 defenses. |

**Files explicitly NOT touched** (avoid scope creep):
- L1, L2, L2.5, L3 — gap 1 is L3.75 only.
- L5 — gap 1 is observation; downstream coaching deferred.
- Conversator (L6) — surfacing in chat is gap-5 territory.
- DB migration — avoided by using `craftAssessment.signatureMove` (cascades staleness with `craft_assessment` HolisticSectionType, no new DB enum value needed). See §Lifecycle / staleness.

## Prompt engineering (REVISED — B3, B4, B5)

### Top-level prompt structure (drafted)

```
SYSTEM_PROMPT_SIGNATURE_MOVE = `You are an expert essay craft analyst performing
the FINAL synthesis step after the holistic walk and synthesis are complete.

Your task: name THE ONE defining structural / voice / rhetorical move that IS
this writer's craft fingerprint — the move that an outside reader would
recognize as "this writer" if they encountered it in a different essay.

You see: the complete sentence-level walk understanding, the holistic
synthesis (voice + emotion + theme + narrative + character + craft +
admissions + entanglements), and the META reading strategy. Use ALL of it.

=== CRITICAL — ONE OR NULL ===

You return EXACTLY ONE signature move, OR null. Never two. Never a list.

Return null when:
- The essay's craft is distributed across multiple strengths with no single
  defining technique
- You cannot cite at least 3 concrete instances of the same move
- The candidate "move" is generic praise dressed up as craft (see anti-example)

Returning null is a real signal, not a failure. Some essays succeed by
distributing craft rather than concentrating it.

=== DISTINCTION FROM ADJACENT FIELDS ===

You are NOT producing voiceIdentity.signature (prose voice description),
narrativeStrategy.primaryStrategy (essay genre), or strengthSignatures
(plural list of strengths). signatureMove is ONE singular technique with
cited instances. If your output overlaps with those fields, return null.

=== COMPOUND MOVES ===

A compound move counts as ONE move only when its components are causally
linked (X→Y, where Y depends on X) OR jointly produce ONE reader effect.
Two unrelated techniques joined by 'and' are TWO moves — return null and
let strengthSignatures hold them.

=== EVIDENCE TYPES ===

Three kinds of instances. Use whichever fits the evidence:

1. sentence_quote — a specific quoted line from the essay (≤40 words verbatim)
2. paragraph_compression — a paragraph whose COMPRESSION itself is the move
   (e.g., P2 of Crochet carries a century of family history in 10 sentences;
   the compression IS the move, no single quote represents it)
3. cross_paragraph_pattern — a pattern that recurs across paragraphs
   (e.g., wizard-magic vocabulary returns at P2 / P3 / P4)

Mix evidence types within one signatureMove. The move's instances should
cover at least 3 distinct paragraphs OR distinct sentence clusters.

=== FORBIDDEN VOCABULARY (in oneSentenceName) ===

These words signal praise rather than craft naming. Avoid them in
oneSentenceName: "vivid", "engaging", "authentic", "powerful", "effective",
"strong", "compelling", "beautiful", "moving".

INSTEAD use syntactic / structural / rhetorical vocabulary:
- Syntactic: anaphora, parataxis, asyndeton, chiasmus, fragment, parenthetical
- Structural: opener, callback, bookend, pivot, beat-drop, compression
- Rhetorical: misdirection, register-shift, triplet, disproportion-hook,
  inversion, ethical-inflection, double-connotation

(This is GUIDANCE — if a more precise word exists outside this list, use it.
The list illustrates the register, not a closed taxonomy.)

=== WORKED EXAMPLE 1 — CROCHET (Harvard 2028) ===

[Full JSON example here — see worked example 1 below]

=== WORKED EXAMPLE 2 — THREE DAYS (Harvard 2028) ===

[Full JSON example here — see worked example 2 below]

=== ANTI-EXAMPLE — what NOT to emit ===

[Anti-example below]

=== OUTPUT SCHEMA ===

{
  "signatureMove": <SignatureMove object> | null
}
`
```

### Worked example 1 — Crochet (revised with structural instances)

```json
{
  "signatureMove": {
    "oneSentenceName": "Compressed-heritage architecture: misdirection-then-anticlimax opener (P0) sets up a one-paragraph compression of the family's wartime history (P1), then the essay redeems density with a single accumulated-specifics image (Agnes the cornflower-blue elephant, P3).",
    "whyItIsTheirs": "Clara's essay carries a century of family history, a war, a thirteen-year imprisonment, and a three-generation craft transmission in 650 words. The compression-then-accumulated-specifics rhythm is what lets that weight fit without flattening into abstraction — and no other essay this short, by this writer, would not do this. Remove either move and the essay collapses.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton.",
        "whatThisInstanceShows": "The taxidermy-vocabulary setup that the reader's first hypothesis will be wrong about — buying forward attention through implied misreading."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 2 },
        "quotedText": "Don't get the wrong idea, now – I'm not a taxidermist or anything. I crochet.",
        "whatThisInstanceShows": "The two-beat anticlimactic reveal — denial of the implied hypothesis plus the actual subject in two words."
      },
      {
        "kind": "paragraph_compression",
        "paragraph": 1,
        "whatThisInstanceShows": "Ten sentences carry the entire wartime history: war, refugees, the grandfather's thirteen-year imprisonment, and the grandmother's expansion into matriarch. The compression IS the move."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 4 },
        "quotedText": "Agnes, a cornflower-blue elephant named after mathematician Maria Gaetana Agnesi who lives in my calculus teacher's classroom",
        "whatThisInstanceShows": "Accumulated specifics — name + color + cross-domain origin + location compounded into one sentence to redeem the essay's compressed density with one unforgettable image."
      }
    ],
    "readerEffect": "The reader is committed by P0 through their own incorrect inference, absorbs P1's century of weight without being asked to dwell on it, and is rewarded in P3 with a single image dense enough to function as the essay's memory anchor."
  }
}
```

### Worked example 2 — Three Days (revised)

```json
{
  "signatureMove": {
    "oneSentenceName": "Hook-by-disproportion between a high-stakes time-marker and a trivial decision (P0S0), set up by a causal-chain triplet pattern that maps fears (P3) to resolutions (P3) element-by-element rather than merely in parallel.",
    "whyItIsTheirs": "Francisco's essay has many uneven sentences but two structurally tight architectural moves: the disproportion hook plants compound curiosity at the open, and the fear→resolution triplet mapping is what gives the Izzy scene its felt resolution. Together they are the load-bearing skeleton the rest of the prose hangs from — without them the Izzy scene reads as raw emotion without structural shape.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey.",
        "whatThisInstanceShows": "Disproportion hook: time-marker signals high stakes; the milk decision is banal. Compound curiosity is set in one sentence."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 4 },
        "quotedText": "I was afraid; afraid my support wouldn't be good enough, afraid to show that I cared, afraid they didn't care for me.",
        "whatThisInstanceShows": "Causal-chain fear triplet — each fear logically depends on the previous (inadequate giving → fear of showing → fear of not being received)."
      },
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 3, "sentence": 8 },
        "quotedText": "I feel comfortable, I feel wanted, I feel safe.",
        "whatThisInstanceShows": "Resolution triplet that maps element-by-element to the fear triplet (adequate→included→safe) — structural relief, not just emotional relief."
      },
      {
        "kind": "cross_paragraph_pattern",
        "paragraphs": [0, 1, 4],
        "whatThisInstanceShows": "Disproportion bookends: P0 opens with milk-as-mismatched-stakes, P4 closes with 'cutting out the biggest part of my diet became the least impactful part of my summer' — the hook's disproportion IS the essay's thesis, restated as an inversion."
      }
    ],
    "readerEffect": "The reader is pulled forward at the open by mismatched scales of attention, rewarded mid-essay by structural relief (fears answered formally, not just emotionally), and given thematic closure by the disproportion-hook returning as inversion."
  }
}
```

### Anti-example (forbid)

```json
{
  "signatureMove": {
    "oneSentenceName": "The writer uses vivid imagery and personal voice throughout the essay.",
    "whyItIsTheirs": "Vivid imagery makes the essay engaging and personal voice connects with the reader.",
    "instances": [
      {
        "kind": "sentence_quote",
        "location": { "paragraph": 0, "sentence": 0 },
        "quotedText": "[long unfocused excerpt]",
        "whatThisInstanceShows": "shows imagery"
      }
    ],
    "readerEffect": "The reader is engaged."
  }
}
```

**Why this fails (state in prompt):**
- "vivid" + "engaging" + "personal voice" — all in the forbidden vocabulary
- Not a *move* (no syntactic / structural / rhetorical specificity)
- Could be said about any essay (no this-writer-specific content)
- Only 1 instance (minimum is 3)
- `whatThisInstanceShows` is generic ("shows imagery"), not move-instance-specific
- `readerEffect` is praise ("engaged"), not cognitive description

**The prompt instructs**: *if the only signature move you can name is this generic, return null.*

## Validation strategy (REVISED — C1, C3, L)

### Step 1 — Type check + unit tests (no cost)

- `npx tsc -p tsconfig.app.json --noEmit` clean.
- `npx vitest run` — 638 tests stay clean.
- New unit test (`tests/test-signature-move-validation.test.ts`):
  - Substring validator drops field to null when `quotedText` is not in cited paragraph.
  - Substring validator passes when quote is verbatim (with smart-quote / em-dash normalization).
  - Validator passes when instances are all structural (no quotes to check).
  - Validator drops field to null when paragraph index is out of range.

### Step 2 — Crochet validation via cached walk JSON (~$0.30)

The existing `tests/output/essay-level-walk-test-2026-05-03T23-37-41-918Z.json` IS Crochet's L1+L2+L2.5+walk output (~$0.26 already paid). Write a focused harness `tests/test-signature-move-crochet.ts` that:
1. Loads the cached walk JSON
2. Reconstructs the partial profile through L3 walk
3. Runs L3.75 Phase A + Phase B + META + CURATION + new SignatureMove call
4. Dumps signatureMove section

Cost: ~$0.30 (Phase A $0.05 + Phase B $0.15 + META+CURATION $0.05 + SignatureMove $0.05). Well under cap.

### Step 3 — Three Days validation (~$1.00–$1.50)

No cached walk JSON exists for Three Days. Two options:

**Option A (preferred)**: Run L1+L2+L2.5+walk for Three Days fresh, save the walk JSON to disk, then run the focused L3.75 harness on it. Total ~$1.20. Establishes a reusable Three Days walk artifact for future gap work — pays back across Gaps 2-5.

**Option B (fallback)**: Run the existing `tests/test-l375-earned-voice-audit.ts` harness adapted with a `--essay 06-...` flag.

I'll go with Option A unless the user prefers B — the reusable artifact is cheap insurance.

### Pass criteria (REVISED — structural, not keyword)

For BOTH essays, signatureMove must satisfy ALL of:

1. **Specificity check**: `oneSentenceName` contains at least one syntactic, structural, or rhetorical technique noun (opener, misdirection, triplet, anaphora, callback, register-shift, compression, parataxis, asyndeton, chiasmus, disproportion-hook, inversion, ethical-inflection, double-connotation, etc.). NOT just praise adjectives.

2. **Locational check**: `oneSentenceName` cites WHERE in the essay the move appears (paragraph reference present).

3. **Cardinality check**: `instances.length >= 3` AND collectively cover at least 2 distinct paragraphs.

4. **Grounding check**: every `sentence_quote` instance's `quotedText` is a verbatim substring of the cited paragraph (post-normalization). Every paragraph index is in range.

5. **Content-specific check**: `whyItIsTheirs` references at least one piece of CONTENT-specific information from the essay (e.g., "650 words covering a century" for Crochet, "Izzy scene" for Three Days, named character / specific event / specific structural feature). Not generic transferable claims.

6. **Effect check**: `readerEffect` describes COGNITIVE / FELT effect on the reader (committed, surprised, primed for X, structural relief, etc.). Not "it's good" / "it works."

7. **Forbidden-vocabulary check**: `oneSentenceName` contains none of: "vivid", "engaging", "authentic", "powerful", "effective", "strong", "compelling", "beautiful", "moving" (case-insensitive).

8. **No regression check**: visual diff against existing dump shows no other section degraded.

**Null is a valid pass for an essay legitimately lacking a single defining move.** For Crochet and Three Days, null would FAIL (the human reviews explicitly identify defining moves). If a future calibration essay legitimately produces null, that's correct behavior.

### Audit-dimension self-score

After both essays produce signatureMove:
- **Voice insight** (audit's weakest, 48/100): expected to rise — signatureMove directly answers "what is this writer's identity at the craft level."
- **Specificity / textual grounding** (67/100): expected to rise — every instance is verbatim-cited and paragraph-grounded.
- **Findings depth** (64): expected stable — Gap 1 doesn't add findings, but doesn't remove them.
- **Coaching utility** (52): expected stable — Gap 1 is observation only; coaching uplift waits for Gaps 3-5.
- **Architectural grasp** (76): expected stable or rising — signatureMove is architectural by definition.

If voice insight does NOT rise, prompt needs revision before Gap 2.

### What I will NOT spend money on

- Full pipeline rerun of Crochet ($1.70 when ~$0.30 with cached walk gets the same answer)
- L4 / L5 reruns — Gap 1 doesn't change L4 output materially (one prompt line addition, but L4's structure stays)
- Multiple iterations of "smoke before full"
- Validation against more than 2 essays for first iteration (per cost-budget feedback). If signatureMove "feels off" on 2 essays, expand to N=4 — but only after seeing the data.

## Cost estimate (REVISED — A1 added one micro-call; cached walk dropped Crochet)

| Step | Cost | Cap notes |
|---|---|---|
| Type check / vitest | $0 | local |
| Crochet validation via cached walk | ~$0.30 | inside $5 cap |
| Three Days validation Option A (full L1-L3.75) | ~$1.20 | inside $5 cap |
| Three Days validation Option B (reuse pattern) | ~$0.40 | inside $5 cap |
| **Total (Option A)** | **~$1.50** | well under $5 cap; under $9 ledger cap |
| **Total (Option B)** | **~$0.70** | well under $5 cap |

If anything blows past $3 mid-run I will stop and report.

Ongoing cost (per essay analysis after Gap 1 ships): ~$0.05-0.10 incremental for the SignatureMove micro-call. Negligible against typical $1.50-2.00 essay analysis cost.

## Risks (REVISED)

| Risk | Mitigation |
|---|---|
| New micro-call worsens audit H-2 (aggregate L3.75 cost double-counts) | **Plan now commits to fixing H-2 simultaneously** — mark new sub-call's cost row as nested in `analysisOrchestrator.ts:841`. |
| LLM emits praise rather than craft vocabulary | In-prompt forbidden vocabulary list + worked examples. NO post-hoc regex enforcement. If output violates, log diagnostic and accept (LLM-first compliance). Iterate prompt only after seeing real data. |
| Hallucinated `quotedText` (text not in essay or in wrong paragraph) | Substring validation scoped to cited paragraph, not whole essay (defense against the audit's Three Days drift pattern). On failure: drop field to null + diagnostic log. Never fabricate. |
| Returns null too eagerly | Worked examples + cognitive force ("would another reader recognize this writer in a different essay?") are soft guidance. Acceptance criterion is human inspection against the calibration reviews. Defer prompt tightening until null rate is measurable. |
| Phase A / B / META already use prompt cache; new call doesn't benefit from cache | Acceptable for first iteration. Add cache breakpoint optimization in a follow-up if signature-move becomes the bottleneck (it won't — the call is small). |
| L4 destroys the move L3.75 just identified | **Plan now commits to L4b prompt 1-liner** (D1 fix). |
| Walk JSON `paragraphSummaries_count: 5` for Crochet (5 paragraphs) — instances must use 0-4 | Validator catches out-of-range. |
| Smart quotes / em-dash variants in student input cause false-negative substring failures | Validator normalizes both sides of the substring check (curly→straight, em-dash variants → ASCII hyphen, Unicode whitespace → ASCII space). |
| Compound move ambiguity ("is misdirection+accumulated-specifics one move or two?") | Prompt explicitly addresses compound moves — one move when causally linked OR jointly producing one reader effect; two moves (return null) when joined only by 'and'. |

## Audit findings interaction (NEW — D4)

| Finding | Severity | Touched by Gap 1? |
|---|---|---|
| H-2 aggregate L3.75 cost double-counting | high | **YES** — Gap 1 commits to the fix because adding a sub-call would worsen the bug. ~5-line change in `analysisOrchestrator.ts:841`. |
| H-4 ParagraphUnderstanding missing `gapCandidates` field | high | No — orthogonal to signatureMove. Tracked separately. |
| M-1 walk adapter writes empty strings for `craftProfile.rhythmPattern` etc. | medium | No, but FLAG: signatureMove's input context includes craftProfile. If those fields are empty, signatureMove call sees less signal. Worth a sanity check during validation that the SignatureMove output doesn't echo "Craft: rhythm=, voice=" garbage. If it does, either (a) gate the SignatureMove prompt's render of these fields on truthiness, or (b) escalate to fixing M-1 first. |
| M-4 claude.ts userPromptBlocks override | medium | No — orthogonal. |
| Crochet "tonal rupture" mis-read of patchwork-quilt closing | content | NOT directly fixed (that's L3.5 mis-judgment), but a populated signatureMove for Crochet that names the wizard-magic threading + fiber-arts consistency creates downstream pressure on L3.5 to score the closing as earned. Positive side effect, not a guarantee. |
| Three Days P0S4 semicolon mis-attribution | content | NOT directly fixed (that's an L3 walk issue), but signatureMove's per-paragraph substring validator demonstrates the validation pattern that would catch this class of drift if applied to L3 walk output too. Future gap candidate. |
| P0/P1 indexing inconsistency | content | Defended against — schema uses zero-indexed (matching data layer); renderer applies `+1` (matching existing `dump-full-profile.ts:625` pattern). No new axis. |

## Lifecycle / staleness (NEW — A3)

`HolisticSectionType` enum (`profileTypes.ts:228-238`) matches a DB enum; adding new values requires migration. Gap 1 avoids this by **cascading staleness with `craft_assessment`**:

- `signatureMove` lives under `craftAssessment` namespace
- When `craft_assessment` is invalidated by edits / focused-mode re-analysis, signatureMove is invalidated alongside it
- This is slightly less precise than a dedicated staleness section (signatureMove might be invalidated when only `strengthSignatures` changed) but avoids DB migration and keeps Gap 1 tight

If a future gap surfaces a need for finer-grained signatureMove staleness, a dedicated `'signature_move'` HolisticSectionType + DB migration can be added then.

**Edit-trigger documentation** (for future-me): signatureMove is invalidated when:
- Any cited paragraph is edited (covered by `craft_assessment` cascade)
- Paragraphs are inserted / deleted / reordered (covered by structural-edit invalidation)
- Voice signature or narrative strategy materially changes (also cascades through holistic sections)

## Null rendering (NEW — D2)

When `signatureMove == null`, dump section renders:

```markdown
### Signature Move

*No single defining move identified for this essay.*

Your essay's craft is distributed across multiple strengths rather than
concentrated in one identity-defining technique. Both shapes can succeed —
some essays earn admission through one unforgettable move, others through
sustained competence across many craft elements. See your **Strength
Signatures** below for the full picture of your craft.
```

This is honest about what null means and prevents students from inferring "the system missed it."

## Definition of done (REVISED)

- [ ] `SignatureMove` + `SignatureMoveInstance` types added; `CraftAssessment.signatureMove?: SignatureMove | null` field added; tsc clean.
- [ ] `synthesizeSignatureMove()` micro-call added to `holisticSynthesis.ts` mirroring META / CURATION pattern with own MAX_TOKENS + TIMEOUT_MS constants.
- [ ] Synthesis orchestration calls signatureMove AFTER Phase A + Phase B + META + CURATION complete, passing full synthesis as input context.
- [ ] L3.75 cost-row aggregation in `analysisOrchestrator.ts:841` no longer double-counts the new sub-call (H-2 fix).
- [ ] L4b prompt in `crystallizer.ts` includes the do-not-destroy-the-move directive (D1 fix).
- [ ] Substring + paragraph-index validator added to `intraDomainValidation.ts`. On failure: drop to null + log diagnostic.
- [ ] `holisticMutator` wires the field through.
- [ ] Dump renderer surfaces the field (populated case) and the null-teaching block (null case).
- [ ] Vitest unit test added for substring validator (substring pass, smart-quote normalization, out-of-range rejection, structural-instance-only pass).
- [ ] vitest stays at 638+1 passing.
- [ ] Crochet dump's `signatureMove` satisfies all 8 pass criteria above.
- [ ] Three Days dump's `signatureMove` satisfies all 8 pass criteria above.
- [ ] No regression in any other dump section (visual diff vs. existing `tests/output/full-profile-dump.md` and `full-profile-06-harvard-2028-three-days-before-a-plane.md`).
- [ ] One commit, message: `feat(essay-intelligence): Gap 1 — signatureMove micro-call + L4 preserve-move directive`.

## Out of scope (deferred to later gaps)

- Gap 2 (memory anchor) — sibling field, separate prompt, separate gap.
- Gap 3 (word-choice interrogation) — lives in L3.5, not L3.75.
- Gap 4 (cliché flagging) — lives in the howler / L3.5 pass.
- Gap 5 (revision sequencing) — lives in L4 prioritizedImprovements rendering. Gap 1 only adds the do-not-destroy directive; full sequencing is its own gap.
- System-jargon cleanup pass — separate cleanup; not blocking.
- Conversator (L6) surfacing — when student asks "what's distinctive about my essay?" the conversator should return signatureMove. Future gap.
- Findings-store cross-link — signatureMove could be a high-coachingValue Finding entry. Future gap.
- DB enum migration for `'signature_move'` HolisticSectionType — only if finer-grained staleness becomes necessary.

---

**Awaiting approval before implementing.**
