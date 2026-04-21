# Review Methodology — v2 Standard

**Locked-in as of**: Sarika's "I, Too, Can Dance" review (corpus entry #05).
**Refined as of**: Francisco's review (entry #06) — user calibration 2026-04-19 shifted emphasis from evaluation to replication.
**Applies to**: every essay review from #07 onward, with retroactive awareness that Francisco's review over-weighted weakness-analysis.
**Purpose**: Understand how these essays work deeply enough to help students replicate the craft on their own topics, prompts, and styles.

## The six-part review structure

Every review produces a file at `reviews/NN-school-year-slug-review-v2.md` with these six parts.

### Part I — Sentence-by-sentence close reading

- Every paragraph in the essay gets covered. No paragraph skipped.
- Every sentence gets *some* attention. No sentence skipped.
- Sentences doing the heaviest craft lifting get 800-1,500 words of analysis each.
- Supporting sentences get proportional shorter treatment (100-400 words).
- Each sentence's analysis specifies: the craft move(s) operating, the mechanism that produces the effect, the specific words/syntax/rhythm doing the work, and cross-sentence connections where relevant.
- Each major craft move gets a **named strategy** in bold, with a rule that could eventually be encoded as detection logic.

### Part II — Consolidated craft moves

Every named move from Part I gets consolidated into a formal taxonomy entry. Each entry specifies:

1. **Name** — short label
2. **Detection** — what the pipeline looks for to recognize this move
3. **Function** — what it does to the reader
4. **How-to** — how a writer produces it
5. **Failure mode** — how it fails when attempted badly

These entries are the system's raw material. Future Wave-2+ ports will draw from them.

### Part III — Pattern maps

Identify clusters of moves that work together across multiple sentences to produce larger structural architectures. Name each cluster. Describe which moves participate and how they reinforce each other. These are the patterns the pipeline could eventually detect by pattern-of-patterns, not single-move recognition.

### Part IV — Universal applications

Distilled guidance a human writing coach could give a student, derived from the essay. Each application:

- Starts with a specific imperative ("Plant your thesis early as a triplet.")
- Explains the mechanism
- Gives a failure mode
- Where possible, includes a practice exercise

### Part V — School-fit analysis

- What the AO or consultant commentary signals about the admitting school's selection philosophy
- How this essay fits the school's broader curation pattern (if multiple essays from the same school exist in the corpus)
- How the essay would fare at other top schools (Stanford / Harvard / MIT / Princeton / Yale / UChicago / Penn / Duke / Northwestern / Caltech / Johns Hopkins / Brown / Columbia / Cornell / Dartmouth), with specific rationale per school

### Part VI — What this essay teaches our system

Specific Wave-2+ port candidates extracted from the analysis:

- New detection categories for existing layers (L1 / L3 / L3.5 / L3.75 / L4 / L5 / L6)
- New anchor examples for scoring prompts
- New coaching patterns for student feedback
- New block-versioned prompt candidates

These candidates feed the Verdict §7 Wave-2 backlog.

## Depth calibration

- **Mix of A and B** (per user calibration 2026-04-19): every sentence gets attention, but not every sentence gets the same depth. Heavy-lifting sentences get full treatment; supporting sentences get concise-but-specific treatment.
- **Sentence-level granularity is the minimum**. Paragraph-level only is insufficient.
- **Every claim about what a sentence does is supported by specific words, punctuation, rhythm, or syntactic choice**. "Distinctive voice" is not analysis. "The verb X performs Y because Z" is analysis.
- **Every craft move gets a named strategy**. Not "good opening" — "deferred-subject syntax — the technique and its function."
- **Connections across sentences are traced explicitly**.
- **Each move's description is rigorous enough that the pipeline could eventually detect and recommend it**. Specific, testable, generalizable.

## Transferability as the load-bearing test (added v2.1, 2026-04-19)

**Every major craft move must pass the replication bar.** The question is not "is this sentence good?" The question is: can a writer with a different life, writing on a different topic, learn to do this specific thing on their own material?

If a move is named but its replication mechanism isn't clear, the analysis hasn't gone deep enough yet. Go deeper.

**Cross-topic transplantation section required for non-obvious moves.** When a craft move might appear locked to the specific essay's topic, the review must include a short section showing:

- How the move would work if the writer were describing immigration/identity instead
- How the move would work if the writer were describing a science-research obsession instead
- How the move would work if the writer were describing grief or loss instead
- How the move would work if the writer were describing a mundane daily activity instead

Not every move needs all four transplantations. A move like "peripheral-vision framing" is obviously universal. But a move like "dance-verbs-possess-writing-tools" might look topic-locked; showing it transplanted to "chess-verbs-possess-negotiation" and "farming-verbs-possess-research" proves generalization and gives the pipeline concrete analogues to learn from.

## Weakness analysis — reduced scope (refined v2.1)

Prior v2 reviews identified weaknesses substantively. The new calibration: **identify weaknesses only when they teach something the strengths don't**.

Specifically:
- **Name a weakness** when it reveals a trap other students commonly fall into, and the essay's survival despite the weakness teaches something about what the AO was willing to forgive.
- **Do NOT name a weakness** when it's merely "this sentence isn't as strong as that sentence." Default assumption: these are top-school admits; the essay is working; the prose serves the essay even when not every sentence is polished.
- **Weakness sections in reviews should be ~10-15% of the review's content**, not 30%.

## Move count targets

- **Move count is no longer a quality signal.** Sarika's 38 moves and Francisco's 17 moves weren't a quality comparison — Sarika's essay simply had more distinct craft operating at high density.
- **Depth of understanding per move is the actual quality signal.** A review covering 8 moves at full mechanism-depth-plus-transplantation is more useful than a review covering 30 moves shallowly.
- **No target count**. The count follows the essay's actual craft content.

## Three sequential passes per essay

**Pass 1**: First read, following the essay's own logic. Surface the obvious moves, catch the primary architecture.

**Pass 2**: Second read, looking for what Pass 1 missed. Often the most structurally-important moves are found here — things the essay is doing that don't announce themselves on first read.

**Pass 3**: Third read, stress-testing. Where does the essay fail? Where is my praise overstated? Where could the published commentary have gone deeper? This pass ensures the analysis isn't over-enthusiastic.

Consolidate after Pass 3. Verdict after consolidation, not before.

## Reader-bias self-check per essay

Every review names the specific reader-bias most likely to have skewed the analysis ("over-rewarding literary prose," "under-rewarding unconventional structure," "over-crediting schools I've heard of more") and describes how the analysis was adjusted to correct for it. This is required, not optional.

## File locations

- Essay text (cleaned, verbatim): `essays/NN-school-year-slug.txt`
- Structured metadata: `ratings/close-reading-rationale.json` (array entry)
- Human-readable review: `reviews/NN-school-year-slug-review-v2.md` (this is the primary artifact)
- Raw paste originals (before cleaning): `raw-pastes/Student-Name` (for audit trail)

## Target length

~20,000-30,000 words per review at v2 depth. Ten essays at this standard produces ~200,000-300,000 words of craft-taxonomy material — equivalent to a serious book-length editorial treatment.

## Why this standard

Writing is nuanced. The essay-intelligence pipeline we're building needs to recognize and recommend craft at a level of specificity that coder-flavored structured analysis can't reach. These reviews are the raw material for the pipeline's future capability — the more rigorously we extract knowledge from exceptional essays now, the more our system can eventually teach students to produce exceptional essays.
