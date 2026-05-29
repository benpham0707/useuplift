# Pre-Phase-2 Remediation Handoff Prompt

> **For Tue.** Paste the section below `---` into a fresh Claude Code session.
> Or paste it into an existing chat as a new directive — both work; the prompt
> is self-contained.

---

## You are doing the pre-Phase-2 LLM-first remediation pass for the Uplift essay-intelligence build

A deep audit just landed (commit `3103dd5` on branch `feat/integrated-pipeline-build`,
HEAD context in this repo: `/Users/tuepham/uplift-final-final-18698-62030`).
The audit found that Phase 1 is structurally close to LLM-first compliant
but contains a load-bearing cluster of hard-coded behavior violations
that will silently shape Phase 2 prompt judgment if not closed first.
Tue's directive (2026-04-30) is to address all of them so we have a
proper foundation and stop deferring.

You are not building Phase 2. You are **closing the violations the
audit surfaced** so Phase 2 can begin against clean ground. Your work
is targeted, surgical, and reviewed at every step. By the end, every
edit must demonstrably honor Tue's three corrections (finding-vs-emission
anchoring, connection-as-aspiration, trained-dispositions-over-must-rules)
+ the six LLM-first design rules.

## §0 — Operating discipline (non-negotiable)

This work requires the same rigor as the Phase 1 build, with one
additional constraint: **every single change touches production
prompt or production code paths that affect real student-facing
output.** A hard-coded behavior left in place produces formulaic
output. A hard-coded behavior removed badly produces broken output.
Both failure modes are unacceptable. The remediation must be both
thorough AND correct.

**Standing rules — applied to every change:**

1. **Read before writing.** Re-read the audit doc + the file +
   surrounding files + tests + relevant memory files BEFORE you edit.
   Verify file:line citations against current state — they may have
   drifted since the audit was written.

2. **Investigate, don't guess.** Per
   `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_planning_preferences.md`
   and CLAUDE.md §1a: every edit is grounded in an understood code
   path, not a guess about what the audit recommended. If the audit
   says "drop the regex check" but you don't yet understand what
   downstream consumers depend on the current behavior, investigate
   first. No edit lands until you can answer: "what production output
   changes when this lands?"

3. **Per-edit review cycle.** After each edit, run the four-step gate
   BEFORE moving to the next edit:
   (a) `npx tsc --noEmit` — typecheck must stay clean
   (b) `npx vitest run` — full suite must stay passing (no test
       deletions or skips to make a failing test pass)
   (c) Re-read the changed file in the editor cold — does the diff
       achieve what the audit asked, without scope creep, without
       silent fallbacks, without new closed taxonomies?
   (d) Self-audit prompt: "If a future contributor read this change
       and asked 'why?', would the inline comment + commit body
       answer them precisely?"

4. **Three-agent ratification audit before each commit.** Spawn (1) an
   independent contract auditor to verify the spec-vs-code match, (2)
   a code-reviewer for code quality + diagnostic-message quality, (3)
   a harmony pulse-check for cross-cutting consequences. Findings
   close inline before commit. Same pattern as D-1.12 / D-1.13 / D-1.14
   / D-1.15.x / D-1.16. The audit overhead is the discipline that
   prevents hard-coded behavior from re-entering through a poorly-
   thought remediation.

5. **One commit per finding.** Each of the 5 CRITICAL + 4 HIGH +
   relevant MED items lands as its own focused commit. Commit body
   cites the finding ID (C-1, C-3, H-1, MED-1) + the LLM-first rule
   it closes + the trained-disposition replacement. No batching of
   unrelated edits.

6. **No silent fallbacks introduced as remediations.** The audit's
   #2 finding category (post-LLM enforcement gates that paper over
   LLM silence) cannot be closed by introducing NEW silent fallbacks.
   Acceptable remediations: drop the entry, surface as typed null,
   throw with structured context. Unacceptable: substitute a different
   centrist default value.

7. **Don't expand scope.** The audit enumerated 5 CRITICAL + 4 HIGH +
   8 MED + 7 LOW. You close CRITICAL + HIGH inline. The MEDs you can
   address opportunistically alongside (clean-as-you-go) but don't
   spawn separate sub-deliverables for them — flag any MED you choose
   to defer and document the rationale. The LOWs are accepted as-is
   per the audit verdict; do NOT touch them in this pass.

8. **Surface every product-direction question to Tue immediately.**
   Five decision points are listed in §2 below. Each one has
   alternatives. Don't pick autonomously — Tue ratifies each one
   before remediation lands. Ask in a single batched message at the
   start of work; don't fragment the surface points across many
   small messages.

9. **No API spend.** All remediation is pure-text code work + prompt
   tuning. The remediated prompts will be calibration-tested in Phase
   2's API touchpoint #2 ($0.50–$1.00 budget). This pass adds zero
   to the cumulative ledger.

10. **Scope-of-work doc at start.** Before any edit lands, produce a
    scope-of-work doc at `docs/audit/pre-phase2-remediation-plan.md`
    enumerating: each finding ID, the chosen remediation shape, the
    file:line plan, the test impact, the LLM-first rule it closes,
    and the validation method. Tue ratifies this plan before any
    code edit.

## §1 — Critical context to read FIRST (in this order)

1. `CLAUDE.md` — project standards
2. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/MEMORY.md`
3. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_llm-first-design.md`
   — **the six rules this remediation closes against**
4. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_planning_preferences.md`
5. `~/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_cost_budget.md`
6. The deep audit results — surface them by reading the most recent
   conversation in this chat (or by re-running the audit; the verdict
   block at the end of the audit summarizes the 5 CRITICAL + 4 HIGH
   + 8 MED + 7 LOW catalog). Key file:line citations:
   - `src/services/essayIntelligence/profileManager/validation/crossDomainValidation.ts:195-267` (C-1)
   - `src/services/essayIntelligence/analysis/deepAnnotationService.ts:262, 957-985, 1038-1039, 1061, 1972-1985, 2022-2056, 2073-2075` (C-2, C-3, C-4, C-5)
   - `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:303-312` (H-1)
   - `src/services/essayIntelligence/analysis/analysisPass.ts:564-567` + `crystallizer.ts:298-307, 493-502` (H-2)
   - `src/services/essayIntelligence/analysis/structuralCartographer.ts:107-108` (H-3)
   - `src/services/essayIntelligence/analysis/techniqueVocabulary.ts:29-50, 89-106` (H-4)
7. `docs/pipeline-evolution/04-pipeline-architecture/L5/PHASE_2_HANDOFF_PROMPT.md` §5 + §5a
   — Tue's $500/hr counselor benchmark + tailored-not-generic + three
   corrections that drove this audit
8. `docs/audit/phase-1-integrity-audit.md` — the 7 OPEN deferred items
   (some overlap with this remediation; aggregate cleanly)

## §2 — The five product-direction decisions that gate work

Surface to Tue at session start in a single batched message. Each
includes the alternatives the audit recommended; pick the disposition
based on Tue's response, then proceed.

### Decision 1 — C-3: L5 `crossParagraphRefs` field shape

The field is currently `crossParagraphRefs: number[]` non-optional on
every L5Annotation. The prompt's JSON example shows it populated, the
parser defaults missing values to `[]`. This is exactly the
mechanically-attach-`connectsTo` pattern Tue's Correction 2 flagged
as producing formulaic output.

Alternatives:
- **(A)** Keep array shape but rewrite the prompt JSON example to
  omit the field on all sample annotations except the cross-paragraph
  call. Prompt rewrites the field as "populate IF this annotation only
  makes sense in light of another paragraph; otherwise omit." Parser
  defaults to empty array silently.
- **(B)** Change type to `number[] | null` (non-required); let
  downstream coaching branch on null vs populated. Parser leaves null
  when LLM omits.
- **(C)** Remove the field from per-paragraph annotations entirely;
  rely on the dedicated cross-paragraph call
  (`generateCrossParagraphAnnotations` at :2253) for connection-bearing
  emissions. Per-paragraph annotations become local craft moves only.

### Decision 2 — C-4: ACTION mode + null rewriteExample

Currently any annotation with `teachingMode='action'` and
`rewriteExample === null` is silently dropped post-LLM (whack-a-mole).

Alternatives:
- **(A)** Keep the prompt training but remove the parser drop. Let
  coaching surface the inconsistency for prompt tuning.
- **(B)** Auto-downgrade `teachingMode` to `'consequence'` + warn once
  (preserves paid LLM output per Rule 2).
- **(C)** Keep the drop but make it a typed `LayerError` instead of
  `console.warn` — surfaces visibly in the iteration ledger's
  layersFailed[] field that D-1.16-prefix already added a real
  consumer for.

### Decision 3 — H-1: "EVERY PARAGRAPH MUST PRODUCE FINDINGS"

The walk prompt currently mandates findings on every paragraph by
significance band. Forces manufactured findings on transitional
paragraphs.

Alternatives:
- **(A)** Soften to "EXPECTED for paragraphs doing architectural work.
  Transitional paragraphs may have zero findings if there's nothing
  durable to claim." Keep significance-band guidance as soft
  calibration anchors.
- **(B)** Remove the quota entirely; let the LLM emit findings
  naturally per its judgment of what's claim-worthy.

### Decision 4 — H-2: 20-point sentence spread MUST

The analysis pass + crystallizer prompts currently require
strongest-vs-weakest sentences in each paragraph to differ by ≥20
points. Deterministic formula injected as prompt rule.

Alternatives:
- **(A)** Replace MUST with trained disposition: "LLMs default to
  compressed scoring. Use the full 0-100 range. If your scores are
  clustering tightly, re-read with the calibration anchors. But if a
  paragraph is genuinely uniform, that's diagnostic information, not
  a failure." Keep calibration anchors (those train the disposition).
- **(B)** Drop the spread guidance entirely; let calibration anchors
  do the teaching alone.

### Decision 5 — H-4: TECHNIQUE_VOCABULARY closed taxonomy

20-name closed enum. LLM-named techniques outside the list are
silently dropped to null (Rule 2 + Rule 3 violation).

Alternatives:
- **(A)** Add `techniqueOpen: string | null` companion field per the
  OpenEnum convention used on `KnowledgePatternMatch.open`. Coaching's
  multi-signal matcher branches on open vs enum.
- **(B)** Open the entire field to free-text + 3-4 functional routing
  tags (matches Rule 3's preferred shape).

## §3 — Work order (after Tue's decisions ratified)

1. **Pre-flight scope-of-work doc** at `docs/audit/pre-phase2-remediation-plan.md`
   — enumerate all 9 closures + remediation shape per Tue's decisions.
   Tue ratifies before any edit.

2. **C-1: delete `checkEvaluativeLanguageInUnderstanding` regex
   enforcement.** Verify no production code path consumes the warning
   it currently emits. Single-commit, three-agent audit.

3. **C-2: drop annotations with empty/missing `northStarConnection`**
   (parallel to existing line 1948 drop pattern). Update the prompt
   to make the consequence explicit: "If you cannot ground in the
   essay's architecture, do not include the annotation." Single-commit.

4. **C-3 per Tue's Decision 1.** This is the most consequential
   change. Affects type signature, prompt language, parser logic, and
   downstream coaching consumers. Read every consumer of
   `crossParagraphRefs` before editing.

5. **C-4 per Tue's Decision 2.**

6. **C-5: drop annotations missing required priority/confidence**
   (consistent with C-2 pattern).

7. **H-1 per Tue's Decision 3.** Walk prompt rewrite — measure round-1
   draft against $500/hr counselor benchmark per Phase 2 handoff §5.

8. **H-2 per Tue's Decision 4.** Three prompt sites (analysisPass +
   crystallizer × 2) — keep them in sync; one commit if symmetric.

9. **H-3: delete BANNED ROLE LABELS hardcoded list.** Existing
   GOOD/BAD pairs at structuralCartographer.ts:67-75 already do the
   teaching positively. Single-commit.

10. **H-4 per Tue's Decision 5.**

11. **MED-1 cluster (14 fallback sites)** — opportunistic clean-up.
    Each `?? 'medium'` becomes either a drop-the-entry or a typed-null.
    Single commit if the pattern is uniform; multiple if downstream
    consumers diverge.

12. **MED-3, MED-5: delete the L1 banlist + the 4 L3/L3.75/analysisPass
    forbidden-vocabulary lists.** Same pattern as H-3 — positive
    teaching is already in the prompts; banlists are belt-and-suspenders.

13. **MED-4, MED-8: soften remaining MUST rules.** Schema-compression
    caps + crystallizer "every paragraph has a structural role"
    mandate.

14. **MED-2 (HolisticDimension closed taxonomy)** — add `dimensionsOpen`
    companion. Defer if it ripples too far into FindingStore consumers.

15. **MED-6 (landing detector confidence floor)** — defer; Tue
    explicitly ratified the 0.7 threshold. Document the deliberate
    deviation from Rule 1.

16. **Final integration sweep** — full vitest suite, typecheck,
    update `docs/audit/phase-1-integrity-audit.md` to mark closures,
    update `docs/audit/pre-phase2-remediation-plan.md` with verdict.

17. **Update `PHASE_2_HANDOFF_PROMPT.md`** to remove the deferred items
    that this pass closed; keep the items that remain genuinely
    deferred (MED-2 if not addressed, MED-6 always, the 7 LOW items).

## §4 — Quality bar (per-edit and per-commit)

Each edit must demonstrably honor:

- **Correction 1**: span citation lives at finding-formation, not
  emission. If your edit moves a span requirement from emission to
  finding (or removes it from emission entirely), say so in the
  commit body.
- **Correction 2**: connection is aspiration, not gate. If your edit
  removes a forced `connectsTo`-style field or softens a "must connect"
  prompt rule, say so in the commit body. The prompt should TRAIN the
  LLM to read for connective architecture and strengthen it where it
  exists, not mechanically attach connections everywhere.
- **Correction 3**: trained dispositions over must-rules. If your
  edit replaces a `MUST` prompt rule with positive examples + the
  cognitive forcing function, say so in the commit body.
- **LLM-first Rule 1**: LLM owns judgment. No new fallback-to-centrist
  defaults. Drop or null, never substitute.
- **LLM-first Rule 2**: Never discard paid LLM output. If your edit
  removes a parser drop, say so. If your edit ADDS a drop, justify
  why discarding is better than nulling.
- **LLM-first Rule 3**: No closed taxonomies for LLM perception.
  If you keep a closed enum, add `*Open` companion or document why
  the closed shape is load-bearing for the system (routing axis,
  bookkeeping state) per Rule 6.
- **LLM-first Rule 4**: No whack-a-mole pattern matching. Quality
  fixes at the prompt layer, not detection layer.
- **LLM-first Rule 5**: Soft guidance over hard blocklists. Banlists
  → positive examples + GOOD/BAD pairs.
- **LLM-first Rule 6**: System infrastructure IS appropriate for
  resource limits + bookkeeping. Don't strip closed enums that are
  doing routing work; keep them and add `*Open` if perception is
  closed.

## §5 — Begin by

1. Read the §1 critical context files in order.
2. Surface back to Tue with:
   (a) confirmation you understood the audit's 5 CRITICAL + 4 HIGH
       + relevant MED scope
   (b) any clarifying questions on the file:line citations
   (c) the five product-direction decisions in §2 batched into a
       single message asking Tue to pick alternatives per finding
3. After Tue's decisions: write `docs/audit/pre-phase2-remediation-plan.md`
   with the chosen disposition per finding + the validation method per
   commit. Tue ratifies before any edit.
4. Then execute §3 work order one commit at a time, with the §0.3
   per-edit review cycle + §0.4 three-agent audit before each commit.

The end-state: 9+ focused commits closing the 5 CRITICAL + 4 HIGH +
relevant MEDs, each with three-agent ratification, each closing a
specific LLM-first rule with the trained-disposition replacement
documented, the audit doc updated, the Phase 2 handoff updated, the
test suite still green, the typecheck clean, the cumulative API spend
unchanged at $0.5110.

When this remediation closes, Phase 2's prompt-engineering work begins
against clean LLM-first ground — no post-LLM enforcement masking what
the LLM emitted, no closed taxonomies forcing the LLM to fit perception
into pre-shaped boxes, no `MUST` rules that should have been trained
dispositions. The $500/hr counselor benchmark in PHASE_2_HANDOFF_PROMPT.md
§5 + §5a becomes the actual quality bar instead of shadow-boxing
against hard-coded behavior the system was masking with.

Stay autonomous within each commit's audit cycle. Pause for Tue at:
(a) the §2 decision-batch at session start, (b) the §3.1 plan
ratification, (c) any unexpected drift surfaced during a fix, (d) any
edit whose downstream consumer impact you can't fully trace, (e) the
end-of-pass verdict. Anything else — execute and audit autonomously.
