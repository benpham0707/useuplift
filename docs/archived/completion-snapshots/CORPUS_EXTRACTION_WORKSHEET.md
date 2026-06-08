# Wave-3a Corpus Extraction Worksheet

**Purpose**: Manual curation step before any TypeScript. Every move, archetype, absence, bias guard, and corpus limit destined for `src/services/essayIntelligence/corpus/` is staged here first, with full source citation. Only after this worksheet is complete does TypeScript writing begin.

**Source-of-truth**: `tests/calibration/top-tier-reference/reviews/*-review-v2.md` (10 attested) + 4 Hopkins reviews pending parallel chat.

**Methodology constraint** (METHODOLOGY.md v2.1):
- Move count is NOT a quality signal. The reviews' actual count drives ours.
- Transferability is the load-bearing test (universal / broad / narrow / specific).
- Every entry cites `{essayId, paragraph, line-range or excerpt}`.

**Hopkins gap acknowledgment**: 4 reviews missing as of session start. Hopkins archetype slots reserved with `provenance: 'pending-hopkins-reviews'` and will be hydrated when parallel chat output lands at `reviews/01-emily-*-v2.md` … `reviews/04-ellie-*-v2.md`.

---

## §1 — Voice Register Inventory (closed union)

Per user spec: `'plain' | 'literary-reflective' | 'maximalist' | 'comedic' | 'domain-insider' | 'intellectual-playful' | 'lyric'`

Corpus voice mapping (preliminary, refined as reviews are read):

| Essay | Author | Primary Voice Register | Secondary | Source signal |
|---|---|---|---|---|
| 05 | Sarika | _(TBD after read)_ | | |
| 06 | Francisco | _(TBD)_ | | |
| 07 | Billy | _(TBD)_ | | |
| 08 | Daniella | _(TBD)_ | | |
| 09 | Orlee | _(TBD)_ | | |
| 10 | Marcus | _(TBD)_ | | |
| 11 | Michelle | _(TBD)_ | | |
| 12 | Michael | plain (per provenance: "plain-voice sacrifice essay") | | provenance.md row 12 |
| 13 | Lauren | maximalist domain-insider (per provenance: "domain-insider maximalist voice") | | provenance.md row 13 |
| 14 | Clara | _(TBD)_ | | |
| 01-04 | Hopkins | _(pending reviews)_ | | |

---

## §2 — Archetype Inventory (14 total: 10 attested + 4 reserved)

| ID | Exemplar | Status |
|---|---|---|
| `splash-of-color-small-risk-growth` | 01-emily | RESERVED (pending Hopkins review 01) |
| `building-a-universe-interdisciplinary-obsession` | 02-shotaro | RESERVED (pending Hopkins review 02) |
| `korean-sticky-notes-cultural-reclamation` | 03-nancy | RESERVED (pending Hopkins review 03) |
| `ordering-the-disorderly-intellectual-metaphor` | 04-ellie | RESERVED (pending Hopkins review 04) |
| `interior-transformation-metaphor-possession` | 05-sarika | TBD after read |
| `peak-scene-community-integration` | 06-francisco | TBD after read |
| `strategic-balance-plain-prose` | 07-billy | TBD after read |
| `mundane-topic-multi-lens` | 08-daniella | TBD after read |
| `bait-and-switch-foil-refutation` | 09-orlee | TBD after read |
| `child-memory-extended-metaphor-prophecy` | 10-marcus | TBD after read |
| `metaphor-literalization-scientific` | 11-michelle | TBD after read |
| `plain-voice-sacrifice-ritual` | 12-michael | TBD after read |
| `obsession-intellectual-autobiography-maximalist` | 13-lauren | TBD after read |
| `compressed-heritage` | 14-clara | TBD after read |

---

## §3 — Craft Moves (cumulative, fills as reviews are read)

Schema per row:
- **id** (kebab-case, stable)
- **displayName**
- **mechanism** (1-3 sentences, NO platitudes)
- **detectionSignal** (what pipeline looks for)
- **sourceEssays** (essayId + paragraph + 1-3 sentence excerpt)
- **transferability** (universal / broad / narrow / specific)
- **dimensions** (voice / structure / specificity / emotion / argument / opening / closing / metaphor)
- **compatibleRegisters** (subset of VoiceRegister union)

### Moves harvested from Essay 05 (Sarika, "I, Too, Can Dance")

_(Filled during chunked read of 05-sarika-i-too-can-dance-review-v2.md)_

### Moves harvested from Essay 06 (Francisco)
### Moves harvested from Essay 07 (Billy)
### Moves harvested from Essay 08 (Daniella)
### Moves harvested from Essay 09 (Orlee)
### Moves harvested from Essay 10 (Marcus)
### Moves harvested from Essay 11 (Michelle)
### Moves harvested from Essay 12 (Michael)
### Moves harvested from Essay 13 (Lauren)
### Moves harvested from Essay 14 (Clara)

### Cross-essay moves (consolidated after all reads)

After all 10 reviews are read, moves that recur across multiple essays (e.g., `specific-unpronounceable-word` in Sarika + Michelle) are consolidated into a single entry with multiple `sourceEssays`.

---

## §4 — Deliberate Absences

What top-tier essays systematically DON'T do. From Part V/VI of each review and explicit "deliberate absence" callouts.

### Pre-known absences (from provenance + task spec)
- Sarika never states "disability" as essay thesis (the wheelchair is revealed through running over toes, not declared)
- Michael never uses metaphor (plain-voice sacrifice essay is unadorned — the absence is load-bearing)
- Clara compresses grandfather's 13-year imprisonment into one sentence (proportionality choice — refuses the trauma-mining default)

_(Additional absences harvested per review)_

---

## §5 — Anti-Archetypes (failure patterns the corpus avoided)

From task spec: sports-injury-comeback, dead-grandparent-wisdom, mission-trip-epiphany, academic-award-proving-myself, diversity-statement-as-essay, disability-overcoming-narrative, immigrant-parents-sacrifice-generic.

Each cross-references which corpus archetype the student should reach for instead.

| Anti-archetype ID | Default failure | Corpus alternative archetype | Transplant path |
|---|---|---|---|
| `sports-injury-comeback` | | | |
| `dead-grandparent-wisdom` | | | |
| `mission-trip-epiphany` | | | |
| `academic-award-proving-myself` | | | |
| `diversity-statement-as-essay` | | | |
| `disability-overcoming-narrative` | | `interior-transformation-metaphor-possession` (Sarika) | Disability surfaces through CONSEQUENCE not declaration; identity reclaimed via possession of an alternative tool |
| `immigrant-parents-sacrifice-generic` | | `plain-voice-sacrifice-ritual` (Michael) or `compressed-heritage` (Clara) | Specificity through ritual time-stamps OR through proportional compression of the largest event |
| `mental-health-overcoming` | | | |
| `community-service-savior` | | | |
| `random-quirky-passion` | | | |

---

## §6 — Reader Bias Guards (per-review aggregation)

| Bias ID | Description | Source review | Corrective instruction | Applies-to layers |
|---|---|---|---|---|
| | | | | |

_(Filled from each review's reader-bias self-check section per METHODOLOGY.md)_

---

## §7 — Corpus Limits (per-move/per-archetype "cannot teach when")

| Target | Type | Cannot teach when | Reason | Source |
|---|---|---|---|---|
| | | | | |

_(Filled from each review's "What This Essay Cannot Be Used To Teach" section)_

---

## §8 — Contextual Validity Patterns (clichés earned in context)

From task spec — known examples:
- "Patchwork quilt of America" — earned only when essay is about fiber arts (Clara crochet)
- "Shrouded in mystery" — earned only when callback converts it
- "Broken her back" — earned only when physical labor context is real

Min 20 entries needed. Harvested from review observations on language that would be cliché elsewhere but works here.

---

## §9 — School Fit Vectors

Direct corpus evidence: Harvard (10 essays), Hopkins (4 essays — pending reviews).

Inferred (from cross-school analysis in Part V of each review): Stanford, Yale, Princeton, MIT, Caltech, UChicago, Brown, Columbia, Penn, Cornell, Dartmouth, Duke, Northwestern.

Each inferred school's `corpusEvidence` field will read: `"inferred from cross-school-fit analysis in [essay] reviews ([list]); not directly attested by admit data."`

---

## §10 — Move Dependencies (DAG)

Built after move catalog stabilizes. Must be acyclic. Verified by integrity test.

---

## §11 — Voice × Archetype Compatibility Matrix (THE SAFETY RAIL)

7 voices × 14 archetypes = 98 cells minimum.

Each cell: `'native' | 'reachable' | 'risky' | 'forbidden'` + rationale citing corpus evidence.

`forbidden` = "coaching must NEVER suggest this archetype to a student with this voice." Applied with extreme caution and full citation.

|  | splash-of-color | building-universe | korean-sticky | ordering-disorderly | interior-transform | peak-scene-community | strategic-balance | mundane-multi-lens | bait-and-switch | child-memory-prophecy | metaphor-literalization | plain-voice-sacrifice | obsession-intellectual | compressed-heritage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| plain | | | | | | | | | | | | NATIVE (Michael) | | |
| literary-reflective | | | | | | | | | | | | | | |
| maximalist | | | | | | | | | | | | | NATIVE (Lauren) | |
| comedic | | | | | | | | | | | | | | |
| domain-insider | | | | | | | | | | | | | NATIVE (Lauren) | |
| intellectual-playful | | | | | | | | | | | | | | |
| lyric | | | | | | | | | | | | | | |

Filled cell-by-cell after all moves and archetypes are mapped. NO empty cells in final TS file.

---

## Status / Next steps

- [x] Worksheet skeleton created
- [x] Provenance + methodology absorbed
- [x] Sarika essay text read
- [ ] Sarika v2 review read (chunked, in progress)
- [ ] Reviews 06-14 read
- [ ] Move catalog finalized
- [ ] Archetype recipes finalized
- [ ] Voice × archetype matrix filled (no gaps)
- [ ] All §3-§11 sections fully populated before TS writing begins

---
