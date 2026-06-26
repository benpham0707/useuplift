# Uplift Admissions Knowledge Base (KB)

> The verified, applicable, dated, cross-linked knowledge that powers Uplift's vertical
> expertise. Built and maintained by the **Knowledge-Scaling Loop**
> ([`KNOWLEDGE_SCALING_LOOP.md`](./KNOWLEDGE_SCALING_LOOP.md)
> — win condition, architecture, honesty contract). This README is the operating manual:
> where entries live, the entry format, the source bar, and the audit instrument.

## What counts as knowledge here

Every entry is **applicable, sourced, dated, and connected** — a bare fact is noise. An entry
earns its place only if it carries a way to *act* on it (decision rule / how-to / before→after /
calibrated heuristic / diagnostic signal) AND meets the source bar AND is dated AND is linked to
related entries. Expert *disagreement* is preserved (`CONTESTED`), never flattened.

## Storage layout

```
docs/knowledge-base/
  README.md                 ← this file (operating manual + audit rubric)
  <domain>/
    _MAP.md                 ← taxonomy, current-state gap map, prioritized work-list, cycle log
    entries/
      <domain>-<subtopic>-<nnn>.json   ← one KnowledgeEntry per file (schema below)
    _index.json             ← generated roll-up: id → {domain, subtopic, status, lastVerified}
    _audits/
      cycle-<n>-audit.md    ← independent-auditor report per cycle (gate scores + spot-check)
```

One entry per file = git-auditable diffs, clean provenance, easy supersession. The `_index.json`
is regenerated each cycle for fast lookup + the freshness sweep.

## Entry schema (the canonical form — code mirrors `KNOWLEDGE_SCALING_LOOP.md §2`)

```jsonc
{
  "id": "essays-post-sffa-identity-001",
  "domain": "essays",
  "subtopic": "post-sffa-identity",
  "claim": "Concise verified assertion.",
  "application": [
    { "kind": "decision-rule|how-to|before-after|calibrated-heuristic|diagnostic-signal",
      "content": "The concrete, actionable form of the move.",
      "dimensionTags": ["reflection_meaning_making"],   // 11 distinct MIXED tags (NOT strictly the 12-dim rubric): a union of rubric-dimension names + craft-axis names (authentic_voice, character_interiority_vulnerability, context_constraints_disclosure, emotional_resonance, imagery_figurative_language, intellectual_vitality_curiosity, originality_specificity_voice, reflection_meaning_making, school_program_fit, specificity, voice). loadKbEntries() must type this as string[], not RubricDimensionName[]. The compile step normalizes all 11 via DIM_MAP + SUBTOPIC_MAP (see INTEGRATION_BLUEPRINT Item 9).

      // — GENERATIVE LAYER (G2-upgraded): enough specificity that the SYSTEM can
      //   generate guidance + a concrete improvement + a worked example from this entry alone.
      //   A move without this layer is a principle the LLM must re-derive — not usable craft. —
      "workedExample": {
        "before": "Actual weak essay PROSE (the failure instance, as real sentences).",
        "after": "Actual revised PROSE applying the move (real sentences, not a description of what to do).",
        "exemplarProvenance": "sourced|illustrative-synthetic",  // 'sourced'=quoted from the named source; 'illustrative-synthetic'=composed to faithfully instantiate the VERIFIED principle. NEVER presented to a student as a real admit essay. Mirrors the detectFabricatedReferences/synthetic-tag discipline.
        "sourceRef": "which source the principle (and, if sourced, the prose) comes from"
      },
      "mechanics": "Sentence-/structure-level levers that make the AFTER work and let the system TRANSFER the move to a new essay — e.g. 'pairs a concrete sensory anchor with a non-generic value-word and names the prior deficit.' Not the principle; the executable craft.",
      "transfer": ["The same move applied to a DIFFERENT topic, ≥1 short prose instance, so generalization is learnable (not topic-bound)."],
      "failureModes": ["What a botched application looks like, so the system can DIAGNOSE and avoid it (e.g. 'swaps one platitude for a fancier platitude; value-word still generic')."]
    }
  ],
  "sources": [
    { "citation": "Source title / author", "url": "https://…",
      "tier": 1, "authorRole": "U.S. Supreme Court | Harvard Admissions | NACAC | IECA counselor",
      "publishedDate": "2023-06-29", "accessedDate": "2026-06-18" }
  ],
  "status": "VERIFIED|CONTESTED|PROVISIONAL",
  "contested": { "positions": ["…","…"], "whoHoldsWhat": ["X holds A","Y holds B"] },  // only if CONTESTED
  "effectiveDate": "2023-06-29",        // when this became true (policy era)
  "lastVerified": "2026-06-18",
  "freshnessClass": "volatile|semi-stable|stable",   // sets the re-verify window
  "supersedes": ["essays-…-old"],       // ids this replaces; old kept as historical, never surfaced as current
  "connections": [
    { "toId": "testing-policy-…", "relation": "cross-domain-implies", "note": "why they link" }
  ],
  "provenanceTrail": "How it was sourced + who verified it + cross-checks run (audit trail)."
}
```

## Source-authority bar (a claim is `VERIFIED` only if it clears this)

- **Tier 1 — primary/official (×1 suffices):** the institution itself, government (Dept. of Ed,
  FAFSA), courts (SFFA ruling), testing bodies (College Board, ACT), NACAC, Common Data Set.
- **Tier 2 — named expert / validated (×2 independent + agreeing):** on-record AOs/deans,
  IECA/HECA counselors, established journalism (Inside Higher Ed, Chronicle, NYT/WSJ ed-desks),
  institutional/peer-reviewed research, named-practitioner books.
- **Tier 3 — context only (NEVER sole source):** forums, blogs, aggregators, anonymized anecdote.
  May *generate* a hypothesis; may never *verify* one. Tier-3-only items are `PROVISIONAL` and are
  not surfaced to students.

**Anti-fabrication:** no synthetic/LLM-synthesis as primary (the caught trap: "Perplexity Deep
Research" stats stated as fact). Conflicting sources → `CONTESTED` with positions preserved.
Recency conflicts → resolve toward most-recent/most-authoritative; old entry `supersedes`-linked,
kept as historical context, never surfaced as current.

## The audit instrument (independent auditor scores the 6 gates each cycle)

> **Canonical win condition lives in [`KNOWLEDGE_SCALING_LOOP.md §1`](./KNOWLEDGE_SCALING_LOOP.md)** —
> the G1–G6 gate definitions (including the 2026-06-20 G2/G6 reconciliations), the
> "all 6 green ×2 cycles + critic dry ×2 = WIN" rule, and the honesty contract. Maintain the gate
> definitions THERE, not here — this README does not restate them, to avoid two drifting copies.
> What's README-specific (the operating manual's own knobs) stays below.

Freshness windows: `volatile` (policy/data, e.g. test rules) = re-verify monthly; `semi-stable`
(school expectations, norms) = quarterly; `stable` (durable craft principles) = biannual.

## Process & quality standards (RAISED each cycle — never settle; target = $500/hr / admit-essay craft AT ALL TIMES)

These ratchet up every cycle. An entry that passed an earlier, lower bar is re-audited against the current bar.

1. **The bar is AT-BAR, not better-than-baseline.** An entry only counts when an entry-grounded
   generation reaches the craft level of the real admit essays (`tests/calibration/top-tier-reference/`)
   on the Harvard-craft benchmark — judged span-by-span against named moves the reviews identify.
   "Near-bar" / "beats the baseline" is no longer sufficient (cycle-1d). Re-run the benchmark each cycle.
2. **Anti-template at the DEEP-STRUCTURE level.** Surface variety (lexical/phrase) is necessary but not
   sufficient — cycle-1d found a surviving *cognitive choreography* (anti-obvious opener → observation →
   metacognitive pivot → second-domain transfer). Entries must force variance in the **insight register**
   (relational / moral / sensory / deliberately-unresolved — not always a portable thinking-habit) and
   make the domain-transfer **optional**. The MOVE transfers; the choreography must not.
3. **Restraint/deletion is a cross-cutting requirement.** The consistent gap to admit-level is
   over-explanation. Every craft entry's generation must be tested for "could the last explanatory
   sentence be cut and the meaning survive (or improve)?" If yes, cut it. Knowing when to STOP is craft.
4. **Expert-not-surface.** An entry that teaches what a base model already volunteers from a prompt
   ("add a detail," "be concise," "use a metaphor") FAILS — it must teach the non-obvious expert layer
   (which detail and why; the specific restraint move; the double-connoting vehicle). Tag `surfaceVsExpert`.
5. **Select the best sources as we explore.** Tier every source (§ Source-authority bar). The
   admit-essay reviews are the empirical gold for *craft*; prefer named-practitioner craft authority over
   generic blogs; drop a source the moment a better-sourced one supersedes it (record in the cycle log).
6. **Improve the process itself each cycle.** Every audit names ≥1 concrete upgrade to the method
   (a control added, a confound removed, a gate tightened) — logged in the cycle's `_audits/` report.
7. **Close-register variance gate (added cycle-2).** Anti-template at the deepest level: classify each
   generated FINAL sentence on (a) syntactic form (flat-declarative / question / dialogue / image-fragment
   / stated-claim / lyric) × (b) landing target (object / micro-gesture / relational / bare-fact /
   unresolved / stated-direction). **No more than 2 of N generations may share the same (form × target)
   cell.** Calibrate variety to the ADMIT CORPUS, which is *more* varied at the close than pure
   minimalism — do not over-rotate into one restrained shape (cycle-2 failure: 3 of 4 = flat-declarative
   × object). "Restraint" ≠ "always end on a quiet object."
8. **Count-diagnostics verified against RAW corpus, not the review (added cycle-2).** Any entry whose
   diagnostic is a literal count ("name it once," "≤0.5 ratio") must cite the count from a re-run against
   the raw essay TEXT in the provenanceTrail. Refute-by-default includes refuting the gold review itself
   (cycle-2: a review asserted "wheelchair appears once" while quoting its second occurrence).

## Cycle protocol (per `KNOWLEDGE_SCALING_LOOP.md §4`)

`MAP → GATHER → VERIFY (adversarial, refute-by-default) → APPLY → CONNECT → CRITIQUE → INTEGRATE
→ independent AUDIT → checkpoint`. Each cycle commits its entries + the `_audits/cycle-<n>-audit.md`
report (gate scores, what changed, spot-check results, cost, next work-list). A subtopic that
hits all 6 gates ships into the system while others keep looping — value lands continuously.
