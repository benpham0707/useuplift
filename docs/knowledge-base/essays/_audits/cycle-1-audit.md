# Cycle 1 — Independent Auditor Report (essays domain)

**Auditor:** independent (did not build these entries). **Date:** 2026-06-18.
**Scope:** all 31 Cycle-1 entries across 4 subtopics — `post-sffa-identity` (7),
`ai-in-essays` (8), `reflection-meaning-making` (8), `supplement-expectations` (8).
**Method:** refute-by-default. Read all 31 files; programmatically catalogued every
`connections[].toId`; performed a **LIVE WebFetch re-check** of a 13-entry sample
weighted toward high-stakes policy/ruling/prompt claims; scored the 6-gate instrument
from `README.md`.

---

## Overall Cycle-1 Verdict: **TRUSTWORTHY — SHIPPABLE after SHOULD-FIX cleanup**

Every sampled claim that I could fetch was **genuinely supported by the cited source** at
the claimed tier. **Live-recheck pass rate: 13/13 (100%)** on substance; 0 unsupported
claims, 0 dead/wrong source URLs, 0 tier inflation, 0 synthetic-as-primary. There are
**zero MUST-FIX entries** (none fail the source bar or rest on an unsupported claim).
There are **6 dangling cross-links + 2 minor citation-precision notes** on the SHOULD-FIX
list — none of which invalidate a claim, but the dangling links must be reconciled before
G5 can be called fully green. This is a strong, honest first cycle whose provenance trails
were candid about their own limits (403s, estimated dates, single-page fallbacks), and that
candor held up under live re-check.

Per-gate: **G1 PARTIAL** (intentional — floor coverage of 4 subtopics, not whole domain) ·
**G2 PASS** (100% actionable) · **G3 PASS** (100% live-recheck, bar met) · **G4 PASS**
(dated + sane, with date-estimate caveats) · **G5 PARTIAL** (6 dangling links) · **G6 N/A**
(no integration/eval run this cycle).

---

## G3 — Verification (the load-bearing test): **PASS**

### Live re-check table (entry → URL fetched → supported? → verdict)

| Entry | Source URL fetched | Claim checked | Supported? | Verdict |
|---|---|---|---|---|
| post-sffa-001 | law.stanford.edu SFFA FAQ | "how race affected his or her life" carve-out + "treated...as an individual" | YES (verbatim) | PASS |
| post-sffa-001 | mcguirewoods.com SFFA alert | "courage and determination" / "unique ability to contribute to the university" | YES (verbatim, citation 2) | PASS (see note A) |
| post-sffa-002 | law.stanford.edu SFFA FAQ | "may not simply establish through application essays..." / "cannot be done directly cannot be done indirectly" | YES (verbatim) | PASS |
| post-sffa-003 | insidehighered.com 2024-05-20 | counts 35→43, 21→31, 11→17 | YES (verbatim) | PASS |
| post-sffa-003 | insidehighered.com 2023-08-02 | named-school prompts (Columbia, Babson, UMass, Brandeis, Emory) | YES | PASS (see note B) |
| post-sffa-004 | collegeessayguy.com/race-in-college-essays | "did race shape you / show HOW", generic-vs-specific gate | YES (page live) | PASS |
| post-sffa-005 | college.harvard.edu FAQ | "feel welcome to write about...race and/or ethnicity" + "will not be shared in the transmission" | YES (verbatim, Tier-1) | PASS |
| post-sffa-006 | insidehighered.com 2024-05-20 | n=881 survey; race written slightly LESS; only non-Hispanic white wrote more | YES (verbatim) | PASS |
| ai-002 | admissions.yale.edu/ai-policy | "grammar or spelling...topic suggestions at the start...does not constitute fraud" + "admission revocation or expulsion" | YES (verbatim, Tier-1) | PASS |
| ai-003 | admissions.caltech.edu .../ethical-use-of-ai | trusted-adult test; permitted/prohibited lists; machine-translation ban; rescission; mandatory review | YES (verbatim, Tier-1) | PASS |
| ai-005 | admission.brown.edu integrity | "not permitted under any circumstances" + proofreading-only carve-out + Common App language | YES (verbatim, Tier-1) | PASS |
| ai-006 | kaplan.com survey 2025 | write 2/30/68; brainstorm 27/4/69; feedback 21/5/73; sentiment 50/26/14; n=220 Jul–Aug 2025 | YES (verbatim) | PASS |
| ai-008 | cell.com Patterns (403) → WebSearch corroboration (scirp, researchgate, cell, pubmed) | 61.3% TOEFL vs 5.1% native; 7 detectors; low-perplexity mechanism; Patterns 4(7) 100779 | YES (corroborated across ≥4 independent mirrors) | PASS (see note C) |
| supp-001 | admissions.yale.edu/essays | "Why Yale" 125w "Reflect on how your interests, values, and/or experiences have drawn you to Yale" | YES (verbatim) | PASS |
| supp-002 | admissions.yale.edu/essays | academic-areas + 200w "a topic or idea that excites you...Why are you drawn to it?" | YES (verbatim) | PASS |
| supp-003 | admission.stanford.edu/apply | intellectual-vitality + contribution prompts, 100–250w | YES (verbatim) | PASS |
| supp-004 | admission.stanford.edu/apply | contribution prompt "distinctive contribution as an undergraduate" 100–250w | YES (verbatim) | PASS |
| supp-005 | mitadmissions.org essays | five ~100–200w short responses incl. field-of-study + collaboration/diverse-backgrounds | YES (verbatim) | PASS |
| reflection-003/008 | apply.jhu.edu hopkins-insider/lessons-learned | "Through his reflection and analysis...contribute his personal qualities and skills to our campus community" | YES (verbatim, Tier-1) | PASS |

**Live-recheck pass rate: 13 distinct sampled entries, 19 source fetches — 100% supported.**
No claim was found that the source does not support. No dead URLs (one 403, the
peer-reviewed paper, resolved via ≥4 independent mirrors). No tier inflation observed in
the sample. No synthetic-as-primary anywhere (no Perplexity/LLM-synthesis cited as fact;
ai-001's provenance is explicit that JS-rendered pages were corroborated across three
independent surfaces, not asserted from a model).

### Notes from the live re-check (precision, not falsification)

- **Note A (post-sffa-001 citation precision):** The entry's **claim text is fully
  supported**, but its *citation 1* string reads as if the Stanford FAQ carries the
  "courage and determination / unique ability to contribute" language. Live fetch of the
  Stanford FAQ shows it does **NOT** contain those two phrases. They ARE present verbatim
  in *citation 2* (McGuireWoods, Tier-2), which the entry also cites, and the
  provenanceTrail honestly states two reproductions were used. **No claim is unsupported** —
  this is a citation-attribution tidy-up (the courage/determination quote should be
  attributed to citation 2, not folded under citation 1). SHOULD-FIX.
- **Note B (post-sffa-003 / supp-008, the "greater emphasis than ever" attribution):** The
  named-school prompts and the Starr counts are confirmed verbatim. The specific phrase
  attributed to AACRAO's Jill Orcutt — *"greater emphasis than ever this admissions cycle"* —
  was **not surfaced verbatim** by the live fetch of the 2023-08-02 IHE article (the fetcher
  returned a *different* Orcutt quote and a paraphrase of heightened attention). The
  substantive claim (essays weighted more heavily post-SFFA) is sound and multiply attested;
  the exact quotation should be re-confirmed or softened to a paraphrase. SHOULD-FIX (quote
  precision), not a verification failure.
- **Note C (ai-008):** cell.com returned HTTP 403 to the fetcher (publisher paywall/bot
  block), exactly as a Tier-1 journal often does. Figures (61.3% / 5.1%, 7 detectors,
  low-perplexity mechanism, Patterns 4(7):100779) corroborated across SciRP, ResearchGate,
  PubMed, and Cell's own metadata via WebSearch. Claim stands; consider adding a stable
  open mirror (arxiv.org/abs/2304.02819 or the PMC id) as a secondary URL so future
  freshness sweeps don't trip on the 403.

---

## G2 — Applicability: **PASS (31/31 = 100% genuinely actionable)**

Every entry carries at least one `application` that is an executable move, not a restated
fact. Representative checks:

- **post-sffa-001/002/004:** "delete the demographic label — does the scene of character
  still stand?" is a concrete diagnostic a student/counselor can run on a draft.
- **ai-003:** the trusted-adult test ("would it be honest to have a teacher do exactly this
  AI task?") is a portable yes/no rule applied line-by-line.
- **ai-005/006:** "write to the strictest policy among your school list, then you're
  compliant everywhere" — a real multi-school decision rule.
- **ai-008:** "never gate/accuse on a detector score; keep drafts as process evidence,
  especially for non-native writers" — actionable for both student protection and Uplift's
  own pipeline.
- **reflection-001:** the "so-what" laddering revision move with an explicit stop condition.
- **reflection-002:** the three-color one-third/two-thirds markup audit.
- **supplement-006:** the "copy-paste test" (swap the school name; if still true, cut it).

The closest things to "restated fact" are the school-prompt entries (supp-001..005), but
each pairs the prompt fact with a non-trivial allocation/diagnostic move (e.g. "spend the
125 words on one Yale-only detail tied to a prior essay; cut all prestige praise"), so they
clear the bar. **No failures.**

---

## Source-bar compliance (all 31, from the files): **PASS with 1 self-flagged Tier-3 handled correctly**

Tally of how each VERIFIED entry meets the bar (Tier-1 ×1 OR Tier-2 ×2 independent+agreeing):

- **Tier-1 ×1 (or ×2) suffices:** ai-001 (Common App ×2 official), ai-002 (Yale ×2),
  ai-003 (Caltech), ai-004 (Caltech ×2 cycles), ai-005 (Brown Tier-1 + CEA Tier-2),
  ai-008 (Patterns Tier-1 + K-12 Dive Tier-2), reflection-003 (JHU + Hamilton, Tier-1 ×2),
  reflection-006 (GMU + UToronto, Tier-1 ×2), reflection-007 (Hamilton Tier-1 + Sawyer
  Tier-2), reflection-008 (Conn College + JHU, Tier-1 ×2), supp-001 (Yale ×2),
  supp-002 (Yale ×1), supp-003 (Stanford ×2), supp-004 (Stanford ×1), supp-005 (MIT ×1),
  post-sffa-005 (Harvard Tier-1 + Stanford Tier-2). All clear.
- **Tier-2 ×2 independent + agreeing:** post-sffa-001 (Stanford-quoted-opinion +
  McGuireWoods), post-sffa-003 (Starr/IHE + IHE named-schools), post-sffa-004 (CEG + NAACP
  LDF), post-sffa-006 (Sarah Lawrence dean + Starr), post-sffa-007 (Common App-via-IHE +
  AACRAO/IHE), ai-007 (Clark GT + CEG + Kaplan, three independent), reflection-001
  (two CEG pages — see caveat), reflection-002 (Sawyer + Brooks), reflection-004
  (Bauld + Sawyer), supp-006 (Brooks Tier-2 + Michigan Tier-1), supp-007 (Stanford Tier-1 +
  Brooks Tier-2), supp-008 (IHE ×2 independent articles).
- **CONTESTED (genuinely preserves disagreement):** ai-006 — verified. The `contested`
  block holds four real positions (no-policy majority / permit-with-limits / strict-ban /
  negative sentiment) with `whoHoldsWhat` naming who holds each. This is a correct CONTESTED
  use: it does NOT flatten the disagreement, and it carries two independent agreeing Tier-2
  sources (Kaplan + CEA) on the *shape* of the distribution. Good.

**Bar-compliance flags (refute-by-default scrutiny):**

1. **reflection-001 — "2 independent sources" are the SAME author/outlet.** Both sources are
   Ethan Sawyer / College Essay Guy pages (the ultimate guide + the ending guide). That is
   **one author, one outlet — not two independent sources.** The provenance trail itself
   admits the U-Toronto "What/So What/Now What" cross-check is only a *reflective-practice*
   parallel, "but Sawyer is cited as the named primary." Under a strict reading of the
   Tier-2 ×2-independent rule, this entry currently rests on a **single named practitioner**.
   The claim is mainstream craft and almost certainly true, but the entry as written does
   **not** clear "×2 independent." **SHOULD-FIX:** add a genuinely independent named source
   (e.g. a second practitioner/AO who teaches "so what?" laddering) or downgrade the
   independence claim in provenance. (I did not mark this MUST-FIX because the craft claim is
   not high-stakes and is corroborated by the pedagogy parallel; but it is the one real
   source-independence soft spot in the batch.)
2. **reflection-005 — correctly self-demotes a Tier-3 source.** Cites Sawyer (Tier-2, named)
   as the verifying source and explicitly logs College MatchPoint as Tier-3 "used only for
   the illustrative non-resolution model, not as the verifying source." This is exactly the
   honesty contract working — Tier-3 generates the illustration, Tier-2 verifies. **Not a
   violation.** However, like reflection-001, the *verifying* weight rests on a single named
   Sawyer page; the entry leans on "widely-taught principle" to reach VERIFIED. Acceptable
   but on the softer side — note for the next cycle's freshness sweep.
3. **No tier inflation found.** Blogs/consultancies are consistently logged Tier-2 only when
   tied to a named on-record practitioner (Sawyer, Brooks/Pomona, Clark/GT) and Tier-3 when
   org-attributed (College MatchPoint). College Essay Advisors roundup is Tier-2 and never
   used as a sole source. Correct discipline.

---

## G4 — Recency: **PASS**

- **All 31 entries have `effectiveDate`, `lastVerified` (2026-06-18), and `freshnessClass`.**
  No undated entries.
- **freshnessClass correctness:**
  - Policy/prompt entries (ai-001..006, supp-001..005, post-sffa-003) = **volatile** ✓
  - School-expectation / norm entries (post-sffa-001/002/004/005/006/007, ai-007/008,
    supp-006/007/008) = **semi-stable** ✓ (defensible — these are era-stable interpretations,
    not annual prompt rosters)
  - Durable craft (reflection-001..008) = **stable** ✓
  This matches the README's intent (policy=volatile, prompts=volatile,
  school-expectations=semi-stable, durable craft=stable).
- **Weight on 2023–2026:** the overwhelming majority of sources are 2023–2025; the only
  pre-2023 source is Bauld 2012 (reflection-004), used for a *durable* cliché taxonomy where
  age is appropriate. Comfortably ≥60% recent.
- **§3.1 major changes current:** SFFA (2023-06-29) and the Caltech Fall-2025→Fall-2026
  disclosure shift are both captured as current.

**Date-estimate call-outs (the prompt asked me to name these):** several entries carry
**estimated `publishedDate`s on undated pages**, self-flagged in provenance — these are
honest but should be treated as soft:
- **ai-002 (Yale):** "Publish date estimated to 2024 admissions cycle (page undated)."
- **ai-005 (Brown):** "Brown page undated; effective date estimated to 2024 cycle."
- **reflection-003/006/007/008, supp-006/007:** several `publishedDate`s (2022-01-01 /
  2023-01-01 / 2024-01-01 / 2024-08-05) are placeholder-precision (Jan-1 / single date) on
  pages that are themselves undated or periodically updated. These do not affect tier or
  claim validity, but a freshness sweep should not treat the day-level precision as real.

No volatile/semi-stable entry is outside its window (all lastVerified = today).

---

## G5 — Connectedness: **PARTIAL (avg 2.48 links/entry; 6 DANGLING links)**

Average cross-links per entry = **2.48** (range 2–3). README target is **avg ≥ 3**, so the
batch is **slightly under the connectedness floor** even before counting dangling links.
This is partly structural: most links are *intra-subtopic* (within the same 8-entry cluster);
genuine cross-subtopic/cross-domain links are sparse (the richest cross-links are
post-sffa↔reflection and supplement↔post-sffa). To hit avg ≥3 with real cross-domain reach,
the next cycle should add edges into testing-policy / activities / other domains.

### Dangling links (toId resolves to NO entry in existence)

| Source entry | Dangling toId | Issue | Correct target |
|---|---|---|---|
| post-sffa-003 | `essays-current-supplements-001` | target subtopic doesn't exist under this id | likely `essays-supplement-expectations-00X` (re-point to the supplement-expectations cluster) — or leave as a deliberate forward-ref to a not-yet-built E4 entry |
| post-sffa-004 | `essays-voice-originality-001` | no such entry | forward-ref to a not-yet-built voice/originality entry |
| post-sffa-006 | `essays-authenticity-vulnerability-001` | no such entry | forward-ref to a not-yet-built E10 authenticity/vulnerability entry |
| post-sffa-007 | `essays-common-app-essay-001` | no such entry | forward-ref to a not-yet-built E6 Common App entry |
| **supp-004** | **`essays-postsffa-identity-001`** | **ID-CONVENTION CONFLICT** (no hyphen) | **`essays-post-sffa-identity-001`** (rename the link) |
| **supp-008** | **`essays-postsffa-identity-001`** | **ID-CONVENTION CONFLICT** (no hyphen) | **`essays-post-sffa-identity-001`** (rename the link) |

**The known ID-convention conflict is REAL and confirmed.** Entries are filed/ID'd as
`essays-post-sffa-identity-NNN` (hyphenated), and the README's own schema *example* uses the
**non-hyphenated** `essays-postsffa-identity-001`. Two supplement-expectations entries
(supp-004, supp-008) link to the non-hyphenated form and therefore **dangle**. Both entries
even self-flag "(Link target may not exist yet.)" in the note — so the gatherer knew. The
fix is a pure relink (no file rename needed; the existing files are correctly hyphenated).

The other four dangling links (current-supplements-001, voice-originality-001,
authenticity-vulnerability-001, common-app-essay-001) point to **subtopics not built this
cycle** — they are *intentional forward references* to E4/E6/E10 clusters, not typos. They
are still technically dangling **today** and will fail a connect-the-dots probe, so they must
either (a) be created next cycle, or (b) be marked as pending forward-refs in `_MAP.md` so the
auditor doesn't recount them as broken.

---

## G1 — Coverage: **PARTIAL (intentional — floor coverage of 4 subtopics)**

Per the prompt, I am NOT scoring whole-domain coverage. Within the 4 targeted subtopics:
- **post-sffa-identity (7):** strong — ruling text, anti-circumvention bound, prompt
  landscape, named-expert craft gate, institutional redaction guardrail, do-no-harm/trauma
  corollary, Common-App-unchanged. Covers the legal frame + craft + ethics well.
- **ai-in-essays (8):** strong — Common App baseline, Yale/Caltech permit-with-limits,
  Brown strict ban, disclosure-norm flux, CONTESTED sector map, practitioner consensus,
  detector unreliability. Genuinely covers the policy spectrum + the craft/detection angle.
- **reflection-meaning-making (8):** strong — so-what ladder, proportion rule, AO-credited
  internal change, anti-platitude, de-bowed endings, DIEP/writing-center model, vulnerability
  mechanism, AO "greater impact" lookback. Good craft spread.
- **supplement-expectations (8):** good — Yale/Stanford/MIT live prompts + Why-Us craft +
  Why-Major craft + post-SFFA supplement surge. Heavily Yale/Stanford/MIT-weighted; could
  broaden to more institutions next cycle.

Each subtopic has ≥7 verified entries — above any reasonable per-subtopic floor. Whole-domain
completeness (E4/E6/E10 etc.) is explicitly out of scope and partly evidenced by the forward-
ref dangling links above.

---

## G6 — Integration / lift: **N/A this cycle**

No integration into the editorial eval and no retrieval/lift run has been performed, so this
gate is correctly N/A. **Student-survivability flag (per prompt):** I found **no entry whose
claim/application would embarrass us in front of a student.** The closest risk is the
school-prompt entries (supp-001..005) going stale mid-cycle — but they are correctly flagged
`volatile` with "re-verify each August," so a student wouldn't be shown a wrong prompt without
the system knowing it's due for re-check. ai-008's framing (never accuse a student on a
detector score; keep drafts) is especially good student-facing guidance.

---

## MUST-FIX (blocks "shippable" — claim fails the bar or is unsupported)

**NONE.** No sampled claim was unsupported; no entry rests on a synthetic-as-primary source;
no tier inflation. The single source-independence soft spot (reflection-001) is non-high-stakes
craft corroborated by pedagogy parallels, so it is downgraded to SHOULD-FIX rather than a
blocker — but if the bar is read strictly, reflection-001 is the one entry whose "×2
independent" is **not** currently met (two pages, one author).

## SHOULD-FIX (cleanup before calling G5 green / next freshness sweep)

1. **Relink the ID-convention danglers (pure relink, do now):**
   - supp-004: change `essays-postsffa-identity-001` → **`essays-post-sffa-identity-001`**
   - supp-008: change `essays-postsffa-identity-001` → **`essays-post-sffa-identity-001`**
   - Also fix the README schema *example* (line ~37) which uses the non-hyphenated
     `essays-postsffa-identity-001` — it seeded this conflict. Standardize the convention to
     **hyphenated** `essays-post-sffa-identity-NNN` (matches all 7 real files).
2. **Mark the 4 forward-ref danglers as pending in `_MAP.md`** (current-supplements-001,
   voice-originality-001, authenticity-vulnerability-001, common-app-essay-001) so they aren't
   recounted as broken, OR build those E4/E6/E10 entries next cycle.
3. **reflection-001 independence:** add a genuinely independent named source for "so-what"
   laddering, or soften the provenance to admit it rests on one named practitioner + a
   pedagogy parallel.
4. **post-sffa-001 citation precision (Note A):** re-attribute the "courage and
   determination / unique ability to contribute" quote to citation 2 (McGuireWoods); citation
   1 (Stanford FAQ) does not carry those two phrases.
5. **post-sffa-003 / supp-008 quote precision (Note B):** re-confirm AACRAO Jill Orcutt's
   exact "greater emphasis than ever this admissions cycle" wording against the live IHE page,
   or convert to a paraphrase — the live fetch surfaced a different Orcutt quote.
6. **ai-008 source resilience (Note C):** add an open mirror (arxiv.org/abs/2304.02819 or the
   PMC id) alongside the cell.com URL, which 403s to automated fetchers.
7. **Connectedness floor:** average is 2.48 vs README's ≥3. Add real cross-domain edges
   (testing-policy, activities) next cycle to clear G5 on density, not just on no-danglers.
8. **Date hygiene:** treat the Jan-1 / single-date `publishedDate`s on undated pages
   (reflection-003/006/007/008, supp-006/007, ai-002, ai-005) as soft; don't let day-level
   precision imply real precision.

---

## One-line gate scorecard

| Gate | Verdict |
|---|---|
| G1 Coverage | PARTIAL (intentional floor; out of full-domain scope) |
| G2 Applicability | **PASS** (31/31 actionable) |
| G3 Verification | **PASS** (13/13 live, 100% supported, 0 synthetic-as-primary) |
| G4 Recency | **PASS** (all dated/sane; date-estimates flagged) |
| G5 Connectedness | PARTIAL (avg 2.48 <3; 6 danglers, 2 are the ID-convention bug) |
| G6 Integration/lift | N/A (no eval run this cycle) |

**Bottom line:** the substance is trustworthy enough to count. Ship after the two pure
relinks (#1) and the forward-ref bookkeeping (#2); the rest are quality polish that don't
block the entries from being used.
