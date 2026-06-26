# Knowledge-Scaling Loop — Win Condition & Architecture

> **Goal.** Build and continuously refine a college-admissions knowledge base whose
> breadth, depth, applicability, currency, and *dot-connecting* exceed what any single
> $500/hr counselor can deliver in a short engagement — by aggregating and **reconciling**
> the knowledge of *many* top experts, 100%-verified, spanning 2020–2026 with recency
> priority. The loop runs to a falsifiable, independently-audited win condition, then a
> scheduled refresh keeps it current ("nonstop" = converge, then stay-current forever).

> **Honesty contract (non-negotiable, carried from the prior 3-round loop).** No claim
> without a dated, tiered source. No synthetic/LLM-synthesis presented as primary (the
> exact trap caught last loop: "Perplexity Deep Research" stats stated as fact). Expert
> *disagreement* is preserved as first-class knowledge, never flattened into false
> consensus. "Experts disagree" / "unknown" are valid, valuable entries. Knowledge that
> isn't *applicable* (carries a how-to / decision rule / before→after) does not count
> toward the win condition — facts the system can't act on are noise.

---

## 1. The win condition (6 gates, independently audited)

The loop is **DONE** only when an **independent auditor agent** (one that did NOT build the
KB) certifies all 6 gates green on a **held-out audit**, for **2 consecutive cycles**, AND
the completeness critic returns "dry" (< 3% net-new material per cycle) for 2 consecutive
cycles. Each gate is measured, not asserted.

| Gate | Threshold (measured on a held-out sample) |
|------|-------------------------------------------|
| **G1 Coverage** | Every domain × subtopic in the taxonomy (§3) has ≥ floor verified entries; no domain below floor; completeness critic finds < 3% net-new/cycle. |
| **G2 Applicability** | ≥ 95% of entries pass the *actionable* test (a concrete decision rule / how-to / before→after / calibrated heuristic — not a bare fact), judged by an independent applicability auditor. |
| **G3 Verification** | 100% of entries are `VERIFIED` or explicitly `CONTESTED`-with-sources; 0% unsourced; 0% synthetic-as-primary. A random re-check sample passes ≥ 99% against live sources. |
| **G4 Recency / freshness** | 100% of time-sensitive entries carry `effectiveDate` + `lastVerified` within the freshness window for their domain; ≥ 60% of weight on 2023–2026; every known major change (§3.1) is represented and current. |
| **G5 Connectedness (the edge)** | Avg ≥ N cross-domain links/entry; the system answers a held-out set of "connect-the-dots" probes (cross-domain inferences a time-pressed human would miss) at ≥ 90%. |
| **G6 Integration / non-regression + advisory-lift** | The knowledge is retrievable, lands at the right altitude, and **passes the editorial eval's HARD gate** (no regression, no regurgitation, no template collapse, no fabrication, not commoditized — `EDITORIAL_EVAL_GATE_SPEC.md`) **AND shows a non-negative advisory-lift trend** vs baseline. NOTE (2026-06-20, FOUNDATION_AUDIT C-1): G6 was redefined here. The original "**measurably lifts** output" was **unsatisfiable** — the eval gate has no editorial-correctness ground truth (the gold rates finished essays, not revision advice), so "measurable lift" cannot be auto-certified. True editorial-lift becomes gateable ONLY when a revision-pair ground-truth corpus exists (the S-4 strategic track). Until then G6 = hygiene-gate-pass + advisory-trend, NOT proven lift. |

G6 ties this loop to the prior one: **the knowledge base is only "good enough" when it passes the
editorial eval's HARD (hygiene/regression/originality) gate and does not degrade output** — full
"provably lifts to $500/hr" is deferred to the revision-pair ground-truth track, not claimable here.

---

## 2. Knowledge entry schema (applicable + verifiable + dated + connected)

```typescript
interface KnowledgeEntry {
  id: string;
  domain: AdmissionsDomain;          // §3 taxonomy
  subtopic: string;
  claim: string;                      // the verified assertion
  // — APPLICABILITY (G2): the entry is useless without at least one of these —
  application: {
    kind: 'decision-rule' | 'how-to' | 'before-after' | 'calibrated-heuristic' | 'diagnostic-signal';
    content: string;                  // e.g. "If test-optional + STEM intent at a test-preferred school, submit a ≥75th-%ile score because…"
    dimensionTags: string[]; // MIXED vocabulary, NOT strictly RubricDimensionName (corrected 2026-06-21, FOUNDATION_AUDIT F-5): real entries also use craft-axis tags (authentic_voice, emotional_resonance, imagery_figurative_language, voice, specificity). Normalized to MoveDimension at compile via DIM_MAP + SUBTOPIC_MAP.
  }[];
  // — VERIFICATION (G3) —
  sources: Array<{
    citation: string; url?: string;
    tier: 1 | 2 | 3;                  // §3 authority tiers
    authorRole?: string;              // "Harvard AO", "NACAC", "IECA counselor", "dean"
    publishedDate: string;            // ISO
    accessedDate: string;
  }>;
  status: 'VERIFIED' | 'CONTESTED' | 'PROVISIONAL';
  contested?: { positions: string[]; whoHoldsWhat: string[] }; // expert disagreement preserved
  // — RECENCY (G4) —
  effectiveDate: string;              // when this became true (policy era)
  lastVerified: string;
  freshnessClass: 'volatile' | 'semi-stable' | 'stable'; // sets re-verify window
  supersedes?: string[];              // ids of entries this replaces (e.g. pre-SFFA → post-SFFA)
  // — CONNECTEDNESS (G5) —
  connections: Array<{ toId: string; relation: 'reinforces'|'tensions-with'|'depends-on'|'cross-domain-implies'; note: string }>;
  provenanceTrail: string;            // how it was sourced + verified (audit)
}
```

Two design choices that make this exceed a human counselor:
- **`contested`** captures where *experts disagree* — the system can present the spectrum
  and the conditions under which each view applies, which a single counselor (who has one
  view) cannot.
- **`connections`** is the dot-connecting graph — the cross-domain inferences (e.g.
  "test-optional reversal × demographic cliff × this school's yield-protection → submit the
  score") that take a human hours to assemble and the system does instantly.

---

## 3. Source-authority model & the 2020–2026 landscape

**Tiers (a claim is `VERIFIED` only via Tier-1 ×1, or Tier-2 ×2 independent + agreeing):**
- **Tier 1 — primary/official:** the institution itself (admissions pages, CDS/Common Data
  Set, UC/Common App official), government (Dept. of Ed, FAFSA), court records (SFFA ruling),
  testing bodies (College Board, ACT), NACAC.
- **Tier 2 — named expert / validated:** AOs & deans (on record), IECA/HECA counselors,
  established journalism (Inside Higher Ed, Chronicle, NYT/WSJ education desks), peer-reviewed
  or institutional research, named practitioner books.
- **Tier 3 — context only (never sole source):** forums, blogs, aggregators, anonymized
  anecdote. Usable to *generate* a hypothesis, never to *verify* it.

**§3.1 Known major changes the freshness gate MUST hold current (seed list, the loop expands it):**
SFFA v. Harvard/UNC (Jun 2023, end of race-conscious admissions + the "how race affected you
through experience" essay nuance); test-optional explosion (2020) → reinstatements (MIT 2022;
Dartmouth/Yale/Brown/Harvard/Caltech/UT-Austin 2024–25 for 2025+ cycles); digital SAT (US Mar
2024); FAFSA simplification + 2024–25 rollout failures; rise of AI in admissions + essay/AI
policies (2023–2026); demographic cliff (2025+); direct-admissions growth; ED/EA & yield shifts
post-COVID; UC test-blind (since 2021). **These are exactly where stale internet advice is
dangerous — recency-priority + re-verification is mandatory here.**

**Domain taxonomy (vertical scope — whole field, feeds the whole platform):** Essays (Common
App / supplements / UC PIQ — ties to essay-intelligence), Testing strategy, Academics & rigor,
Activities & ECs, Awards/distinctions, Recommendations, Demographics & post-SFFA identity,
Financial aid & affordability, School-specific intelligence & fit, Application strategy
(ED/EA/REA, school list construction), Interview, Special cases (transfer, international,
recruited athlete, first-gen/low-income, BS/MD, arts portfolio).

---

## 4. The loop (per cycle; agents parallel within a phase)

```
A. MAP        — taxonomy/gap map: which domain×subtopics are thin, stale, or contested. Emits a work-list.
B. GATHER     — per gap: parallel multi-source sweep (deep-research engine), recency-prioritized, Tier-1/2 first.
                Multi-modal: by-institution, by-expert, by-policy-change, by-data (CDS). Each blind to the others.
C. VERIFY     — adversarial, refute-by-default: independent verifier per claim re-checks cite+date+tier,
                demands the Tier-1×1 / Tier-2×2 bar, resolves conflicts toward most-recent/most-authoritative,
                flags staleness, marks CONTESTED where experts genuinely split. No fabrication, no synthetic-as-primary.
D. APPLY      — transform VERIFIED facts → applicable entries (decision rule / how-to / before→after),
                dimension+domain tagged. A fact with no application is sent back or dropped (G2).
E. CONNECT    — mine cross-domain links + expert consensus/disagreement → build the dot-connecting graph (G5).
F. CRITIQUE   — completeness + freshness critic: what's missing, what's stale, what's thin → next cycle's work-list.
G. INTEGRATE  — sample-check: is it retrievable, at the right altitude, and does it lift the editorial eval (G6)?
→ CONVERGE?   — independent auditor scores the 6 gates on a held-out sample. All green ×2 cycles + critic dry ×2 → WIN.
                Else: F's work-list seeds the next cycle. Loop.
```

**Stay-current ("nonstop"):** after convergence, a **scheduled refresh** (per freshness class:
volatile = monthly, semi-stable = quarterly, stable = biannual) re-runs C on time-sensitive
entries and re-opens the loop whenever a source changes or a staleness window elapses. The KB
is never "done" — it's *converged-and-maintained*.

---

## 5. What "100% verified" operationally means

- **Cite-or-die:** no entry persists without ≥1 source meeting the tier bar. Unsourced → `PROVISIONAL`, never surfaced to students, queued for verification or deletion.
- **Cross-check:** Tier-2 claims need 2 independent agreeing sources; disagreement → `CONTESTED` (preserved, not averaged away).
- **Date everything:** `effectiveDate` + `lastVerified`; recency conflicts resolve toward recent (with `supersedes` linking the obsolete entry, kept as historical context, never surfaced as current).
- **Audit, don't trust:** a separate auditor agent re-checks a random sample against *live* sources each cycle (G3 spot-check ≥99%). Sub-agent "I verified it" claims are themselves verified — the lesson from this very session, where agent claims flipped twice on inspection.

---

## 6. Integration constraint (carried from the prior loop — don't repeat the mistake)

The prior 3-round critique proved **knowledge ≠ expertise** unless it's *applicable* and lands
at the *right altitude*. So this loop's output must:
- be **applicable** by construction (§2 `application`, G2);
- be **retrievable** by the dimension-targeted path already specced;
- feed the **synthesis altitude** (the executive brief + the proposed sequencing/dependency
  slot), not just per-span injection;
- be **proven by G6** (eval lift), not assumed. A KB that grows but doesn't move the eval is
  failing, by definition.

---

## 7. Honest framing (so "full confidence" is real, not theater)

- **Convergence is asymptotic.** "Full confidence" = the 6 gates green on independent audit
  for 2 cycles + critic dry — a *defined, measured* state, not a feeling. We can hit it for a
  scoped taxonomy; we cannot hit "knows everything."
- **Some knowledge is irreducibly contested or unknown** (admit/deny is partly a black box).
  The win condition counts a well-sourced "experts disagree / unknowable, here's the spectrum"
  as a *win*, not a gap — that honesty is itself the expert edge.
- **Freshness decays.** Without the scheduled refresh, a converged KB rots within a cycle
  (test policies move yearly). "Nonstop" is the maintenance loop, not a one-time build.
- **The deepest edge (G5 dot-connecting) is the hardest to verify** — a cross-domain inference
  is only as sound as both endpoints; connections inherit the weaker endpoint's status.

---

## 8. Cost & cadence (checkpointed "nonstop")

- Web sweeps + verification are the spend; Anthropic per-essay caps are unaffected.
- Run as **checkpointed-nonstop**: the loop runs to convergence but **pauses at each cycle
  boundary** with an audit report (gate scores + what changed + cost), so progress is visible
  and steerable rather than a black-box burn.
- Convergence is per-domain-shippable: a domain that hits all 6 gates ships into the system
  while others keep looping — value lands continuously, not only at the end.
```
