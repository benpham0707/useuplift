# Revised Improvement 2: Anti-Clustering Scoring Validation

> **REVISED PROMPT — replaces IMPROVEMENT_2_SCORING_VALIDATION.md**
> Paste this entire document into a new Claude Code session. It is self-contained.
> All rigidity issues from the original spec have been fixed per LLM-first design principles.

---

## 0. Context from Cluster A Implementation

Cluster A (#1 Finding Lifecycle, #3 Bidirectional Connections) is COMPLETE. Key things that affect this implementation:

### Finding Store API (available for use)

The `FindingStore` class (`src/services/essayIntelligence/findings/findingStore.ts`) manages findings with append-only semantics. The scoring prompt can reference findings when explaining WHY a sentence is effective or weak.

**Key queries for L3.5 scoring context**:
- `store.getByScope(paragraphIndex)` — findings scoped to the paragraph being scored
- `store.getActiveSortedByCoachingValue()` — all findings ordered by importance
- `store.getByDimension('voice')` — findings touching a specific dimension

**Context builder for scoring prompts**:
- `buildAnnotationFindingContext(store, paragraphIndex)` — compact finding context per paragraph (ID, maturity, coaching value, claim preview). Inject this into the scoring prompt so the LLM can reference findings when reasoning about scores.

**Finding maturity affects scoring confidence** (line 571 of this doc references this correctly): A finding at 'hypothesis' maturity means the system is less certain about the pattern. The scoring prompt should note this — "Finding F3 [hypothesis] suggests voice bifurcation but isn't confirmed. Score with moderate confidence on voice dimensions."

### Connection Graph API (available for anchor selection)

The `ConnectionGraph` (`src/services/essayIntelligence/connections/connectionGraph.ts`) provides structural analysis for anchor paragraph selection:
- `graph.getHubs()` — paragraphs ranked by connection density (strong connections first). **Use this for anchor selection**: the highest-hub paragraph is likely the most architecturally significant.
- `graph.findStructuralIslands(totalParagraphs)` — paragraphs with no strong connections. Islands are likely less effective at connecting to the essay's architecture — useful context for scoring.
- `graph.toAdjacencyContext()` — compact graph representation for LLM context.

**Anchor paragraph selection improvement**: Instead of relying solely on L3.75 structural analysis to identify the "fulcrum paragraph," combine it with `getHubs()[0].paragraph` — the paragraph with the most strong connections IS the essay's structural center. If L3.75's fulcrum matches the top hub, high confidence in anchor selection. If they disagree, worth investigating both.

### Connection-Aware Scoring

When scoring a paragraph, include its connection context:
- `buildParagraphConnectionContext(graph, paragraphIndex)` shows connections involving this paragraph.
- A paragraph that's a hub (many strong connections) deserves careful scoring — its score ripples downstream.
- A paragraph that's an island (no strong connections) might score lower on structural effectiveness regardless of sentence-level craft.

### Type References (verified)

The Finding type is at `profileTypes.ts` lines 1950-2018. Key fields for scoring:
- `finding.maturity` — 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded'
- `finding.coachingValue` — 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic'
- `finding.dimensions` — which dimensions this finding touches (voice, craft, theme, etc.)
- `finding.claim` — the insight itself
- `finding.evidence` — text evidence with locations

### Watch-outs

1. **Strength-only-upgrade**: Connections only get stronger, never weaker within a single analysis pass. So a 'tentative' connection from the scout might become 'foundational' by L3, but never the reverse. Scoring should treat current strength as a floor, not a ceiling.

2. **Superseded findings**: `getByScope()` only returns active (non-superseded) findings. You won't accidentally see obsolete findings. But the superseded finding list IS available via `buildFindingContext(store, { includeSuperseded: true })` — useful for avoiding re-deriving wrong readings.

3. **Asymmetric connections are NOT contradictions**: A connection from P1→P3 with `directionality: 'asymmetric'` means P1 serves P3 more than P3 serves P1. This is normal (setup→payoff is inherently asymmetric). Don't score asymmetric connections as weaknesses.

---

## 1. Context

### What Exists Today

The Essay Intelligence system has an 8-layer pipeline. Layer 3.5 (`analysisPass.ts`) is the FIRST layer that JUDGES — all prior layers (L1 through L3.75) are purely descriptive. L3.5 makes parallel Sonnet calls per paragraph, producing per-sentence effectiveness scores (0-100), strengths, weaknesses, and a paragraph-level effectiveness score.

The current implementation already has anti-clustering measures in the prompt:
- Calibration examples (score 38, 52, 72, 88) with reasoning
- A "rank before scoring" cognitive forcing function
- Anti-clustering rules (20-point minimum spread, avoid 15-point band clustering)
- Post-hoc clustering detection that logs warnings when stdev < 5 and range < 15

**The problem**: Despite these prompt-level measures, scores still cluster around safe middle values (6-7 out of 10 or equivalently 60-75 out of 100). The anti-clustering rules in the prompt are necessary but insufficient. Three root causes:

1. **No comparative anchoring across paragraphs.** Each paragraph is scored in isolation. The LLM scoring P3 doesn't know it gave P1 a 72 — so it has no basis for differentiation across the essay. The rank-then-score function works within a paragraph (differentiating sentences) but not across paragraphs.

2. **Calibration examples are generic.** The four examples (38/52/72/88) are static and essay-agnostic. They give the LLM an idea of what a 38 looks like in general, but not what a 38 looks like in the context of THIS essay's specific voice and architecture.

3. **No confidence signaling on scores.** A score of 72 might mean "I'm fairly sure this is functional-plus" or "I have no idea, defaulting to safe middle." Without confidence, the system can't distinguish genuine convergence (everything really IS similar quality) from scoring laziness.

### Rigidity Issues Fixed From Original Spec

The original IMPROVEMENT_2 spec contained these rigidity violations:

- **RED: `computeThesisScore/VoiceScore/EarningScore` heuristic formulas** — The original spec proposed formula-based scoring functions that would REPLACE L3.5's judgment with arithmetic. These are completely eliminated. The LLM scores with calibration context; the system never second-guesses with formulas.

- **RED: Rank-then-score forced reordering** — The original spec proposed ranking sentences and then reordering scores to match the ranking. This is post-hoc manipulation. Instead, ranking is a COGNITIVE FORCING FUNCTION — the LLM ranks to inform its own thinking, but the ranking doesn't algorithmically constrain the scores. The LLM may legitimately rank A above B but score them identically if both are equally effective.

- **ORANGE: Confidence-weighted [U] labels** — The original spec computed confidence from label frequencies. The revised design has the LLM assign confidence directly with prose reasoning. The system doesn't compute confidence.

- **GREEN: Calibration anchors in prompts** — Kept and enhanced. Essay-specific calibration is the core of this improvement.

### Where This Improvement Fits

```
L3 Walk → L3.75 Holistic Synthesis → L3.5 Analysis Pass (THIS IMPROVEMENT) → L4 Crystallizer → L5 Feedback
```

L3.5 is the gateway to ALL evaluative output. If scores cluster here, everything downstream is degraded:
- L4 Crystallizer's score matrix amplifies undifferentiated scores into 5 dimensions
- L5 feedback can't prioritize (if everything scores 68-74, what needs work first?)
- Improvement phase detection (Foundation vs. Architecture vs. Craft) relies on score distributions
- The coaching conversation can't point to specific weaknesses with conviction

### Key Files

- `src/services/essayIntelligence/analysis/analysisPass.ts` — L3.5 implementation (prompt, validation, phase computation)
- `src/services/essayIntelligence/analysis/crystallizer.ts` — L4, consumes L3.5 scores
- `src/services/essayIntelligence/profileTypes.ts` — Type definitions
- `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` — Focused re-analysis (uses same scoring)

---

## 2. Design Principles Applied

### Rule 1: The LLM Owns All Judgment — The System Tracks and Organizes

The LLM produces calibrated scores directly. The system NEVER computes, adjusts, reweights, or overrides scores with heuristic formulas. No `computeThesisScore()`, no `computeVoiceScore()`, no rank-then-reorder post-processing. If scores cluster, the fix is in the PROMPT — better calibration anchors, better comparative context, better cognitive forcing functions — not in a formula that second-guesses the LLM.

The system's role: provide the LLM with the context it needs to calibrate well (essay-specific anchors, cross-paragraph awareness), track score distributions for diagnostic purposes, and surface confidence metadata.

**Litmus test applied:** For every function in this design, ask: "Is this tracking what the LLM produces, or pre-determining what the LLM can produce?"
- `selectAnchorParagraph()` → SYSTEM routing decision (which paragraph to score first). Does NOT pre-determine scores. PASS.
- `buildAnchorContext()` → Assembles LLM output for other LLM calls. Tracks. PASS.
- `distributionDiagnostics` → Records what the LLM produced. Tracks. PASS.
- Any function that adjusts, clamps (except 0-100 range), reweights, or overrides scores → FAIL. None exist in this design.

### Rule 2: Never Discard Paid LLM Output

If the LLM produces 8 strengths for a sentence, keep all 8. If it scores every sentence at 70, don't "fix" the distribution — log it as a diagnostic signal and investigate the prompt. The only valid response to unexpected distributions is investigation, not deletion.

### Rule 3: No Closed Taxonomies

Confidence is LLM-assessed in prose with a functional routing tag, not a formula. The LLM describes WHY it's confident or uncertain; the system extracts a routing-grade signal. The three levels (high/moderate/low) are ROUTING tags for downstream consumers, not a taxonomy of confidence types.

### Rule 5: Soft Guidance Over Hard Blocklists

Anti-clustering measures influence via prompt design, not post-hoc enforcement. No "reject and re-roll if stdev < threshold." If scores cluster, that's information — maybe the essay really is uniformly mediocre. The system logs clustering diagnostics but never acts on them.

### Rule 6: System Infrastructure for Operational Concerns

Score clamping (0-100 range), distribution logging, cost tracking, referential integrity — these are system concerns. The system tracks distributions and surfaces diagnostics; it never overwrites scores.

---

## 3. Core Architecture

### What the LLM Produces vs. What the System Manages

**LLM produces (all judgment lives here):**
- Per-sentence effectiveness scores with reasoning (unchanged)
- Per-sentence confidence assessment: prose explaining certainty level + routing tag
- Comparative ranking justification that explicitly references cross-paragraph context
- Essay-specific calibration reflection (before scoring, reflect on what constitutes high/low craft in THIS essay)
- Paragraph effectiveness with explicit comparison to other paragraphs

**System manages (all infrastructure lives here):**
- Assembling cross-paragraph context for the prompt (scores from already-analyzed paragraphs)
- Distribution diagnostics (logging, not enforcement)
- Confidence metadata storage alongside scores
- Anchor paragraph selection (operational routing, not analytical judgment)
- Score clamping to valid range (0-100)
- Cost tracking per call

### Architecture Change: Anchor-Then-Parallel Scoring

Currently all paragraphs are scored in parallel (up to CONCURRENCY_LIMIT=2). This prevents cross-paragraph calibration because P3's scorer doesn't know P1's scores.

**New approach: Anchor-then-parallel.**

1. **Anchor pass (sequential, 1 paragraph):** Score the essay's most architecturally significant paragraph first (determined by L3.75 structural analysis — typically the fulcrum or load-bearing paragraph). This establishes the scoring baseline for this specific essay.

2. **Parallel pass (concurrent):** Score remaining paragraphs with the anchor paragraph's scores + reasoning included in context. Each parallel call sees the anchor scores, giving a calibration reference point.

This adds latency for 1 paragraph call but provides cross-paragraph calibration context to all subsequent calls. Net cost increase is near zero (the anchor paragraph was going to be scored anyway).

**Why anchor-then-parallel works better than alternatives:**

- **Full parallel** (current): Each paragraph in a vacuum. No cross-paragraph calibration basis. Scores cluster because the LLM has no essay-specific baseline.

- **Two-pass scoring** (considered, rejected): Score everything once, then re-score with distribution awareness. Doubles cost for marginal benefit. The anchor approach achieves ~80% of the calibration benefit at <5% additional cost.

- **Fully sequential** (considered, rejected): Score P0, then P1 with P0's scores, then P2 with P0+P1... Maximizes calibration but adds N-1 sequential calls of latency. For a 7-paragraph essay, that's 6 sequential calls (~30-50 seconds). The latency cost is too high.

- **Anchor-then-parallel** (chosen): 1 sequential call + parallel. ~8-12 seconds latency for a 7-paragraph essay. Best cost/quality/latency tradeoff.

### Type Changes

```typescript
// NEW: Confidence metadata on sentence analysis
// Added to profileTypes.ts
interface SentenceAnalysisConfidence {
  /** LLM's prose explanation of confidence in this score */
  reasoning: string;
  /** Routing-grade confidence tag — LLM assigns this */
  level: 'high' | 'moderate' | 'low';
  /**
   * What would change this score? Cognitive forcing function against overconfidence.
   * For "low" confidence: what information is missing?
   * For "high" confidence: null.
   * For "moderate": what reading emphasis would shift the score?
   */
  sensitivityNote: string | null;
}

// EXTENDED: AnalysisPassOutput sentenceAnalyses gains confidence field
// The existing sentenceAnalyses type in AnalysisPassOutput gets a new optional field:
//   confidence?: SentenceAnalysisConfidence;
// Optional for backward compatibility — old data without confidence still works.

// EXTENDED: AnalysisPassOutput gains essay-specific calibration
// Add these fields to the existing AnalysisPassOutput interface:
//   calibrationReflection?: string;
//   comparativeNotes?: string | null;

// EXTENDED: L35AnalysisResult gains distribution diagnostics
// Add this to the existing L35AnalysisResult interface:
//   distributionDiagnostics?: {
//     sentenceScoreStdev: number;
//     sentenceScoreRange: number;
//     paragraphScoreStdev: number;
//     paragraphScoreRange: number;
//     lowConfidenceCount: number;
//     anchorParagraphIndex: number;
//   };
```

### Prompt Architecture Changes

The L3.5 prompt gains three new sections. The existing prompt structure (system prompt → profile context → paragraph-specific prompt) is preserved. Changes are ADDITIVE — nothing is removed from the existing prompt.

**1. Essay-Specific Calibration Reflection (before scoring)**

Added to the system prompt. Before scoring any sentences, the LLM must produce a calibration reflection that addresses:
- What does HIGH CRAFT look like in THIS essay? (Not generic — specific to this voice, this architecture)
- What does LOW CRAFT look like in THIS essay? (The specific failure modes this writer exhibits)
- What is the expected score RANGE for this paragraph given its architectural role?

This forces the LLM to contextualize before defaulting to safe middle scores. The cognitive forcing mechanism: the LLM must THINK about the essay's specific quality landscape before it can produce scores. Without this reflection, the LLM's default is to apply a generic scale where everything lands in the 60-75 safe zone.

**2. Anchor Context (cross-paragraph calibration)**

For all non-anchor paragraphs, Block 3 includes the anchor paragraph's scores and reasoning. The LLM is instructed: "The anchor paragraph (P[N]) scored [X]. Your scores for this paragraph should be calibrated relative to the anchor — if this paragraph is weaker than P[N], its score should be measurably lower. If stronger, measurably higher."

The anchor context is not prescriptive ("your scores must be lower") but calibrative ("if this paragraph is weaker, your scores should be lower"). The LLM decides whether it's weaker.

**3. Confidence Assessment**

For each sentence, after scoring, the LLM produces a confidence assessment:
- "High confidence" = strong evidence supports this exact score; moving it +/- 5 points would be wrong
- "Moderate confidence" = this score is reasonable but +/- 8 points is defensible
- "Low confidence" = this score is uncertain; specific factors (ambiguous intent, unusual craft choice, conflicting signals) make calibration difficult

---

## 4. Deeper Design

### Edge Case: What If All Dimensions Score Similarly?

Genuine uniformity is possible. A consistently mediocre essay might legitimately have all paragraphs in the 55-65 range. The system must distinguish:

- **Genuine uniformity**: Scores cluster because the essay is uniformly mediocre. Confidence is HIGH on the clustered scores. The calibration reflection explains: "This essay maintains a consistent level of functional prose without standout moments or catastrophic failures." This is valid information. The system logs it as genuine uniformity and proceeds.

- **Scoring laziness**: Scores cluster because the LLM defaulted to safe middle. Confidence is MODERATE or LOW. The calibration reflection is generic rather than essay-specific ("this essay has some strong and weak moments"). This is the clustering we're trying to prevent.

The distinction is made by the LLM through confidence and calibration quality, NOT by the system through formulas. The system's distribution diagnostics log both cases identically; the confidence metadata tells downstream consumers how to interpret the distribution.

### Edge Case: Anchor Paragraph Selection

The anchor paragraph should be the essay's most architecturally significant paragraph because:
1. It likely has the widest quality range (architecturally important paragraphs tend to have both strong craft moments and structural failures)
2. Its scores are most meaningful for cross-paragraph comparison (a fulcrum paragraph's quality sets the standard)

**Selection algorithm** (SYSTEM routing, not LLM judgment):
```
1. If L3.75 produced NarrativeStrategy.turningPoint → use that paragraph
2. Else if any paragraph has ParagraphUnderstanding.role containing "fulcrum" or "pivot" → use it
3. Else if L3.75 produced structural roles → use the paragraph with highest structural weight
4. Else → use the paragraph with the most sentences (more data = better calibration)
5. Ultimate fallback → paragraph index 1 (first body paragraph)
```

If the anchor selection has ambiguous input (e.g., L3.75 failed), the fallback is fine — any paragraph's scores provide SOME cross-paragraph calibration, which is better than none.

### Edge Case: Anchor Score Is Itself Unreliable

If the anchor paragraph's scores all come back with "low" confidence, the cross-paragraph calibration is weakened. The system should:
1. Log a warning: "Anchor paragraph P{N} scored with predominantly low confidence — cross-paragraph calibration may be weakened"
2. Still proceed — low-confidence anchor scores are better than no anchor at all
3. NOT re-roll or select a different anchor — that would be the system second-guessing the LLM

### Edge Case: Single-Paragraph Essays (PIQ Supplements)

Some supplements are only 1-2 paragraphs. The anchor-then-parallel approach degenerates:
- 1 paragraph: anchor IS the only paragraph. No cross-paragraph context. This is fine — the essay-specific calibration reflection still forces differentiation WITHIN the paragraph.
- 2 paragraphs: anchor + 1 parallel call. Minimal benefit from anchoring but no cost either.

### Interaction: Anti-Clustering x Contradiction Mining (#4)

Contradiction mining (Improvement #4) can detect when L3.5 scores contradict L3.75 understanding. Example: L3.75 says "P3 is the essay's fulcrum and strongest moment" but L3.5 scores P3 at 58. This is either:
- A genuine contradiction (the fulcrum is structurally important but poorly executed — common!)
- A scoring calibration failure

With confidence metadata, the distinction is clear:
- High-confidence 58 on a "strongest moment" → genuine contradiction. The fulcrum's structural importance exceeds its execution quality. This is valuable coaching material.
- Low-confidence 58 on a "strongest moment" → possible scoring uncertainty. The miner should flag this but note the lower confidence.

### Interaction: Anti-Clustering x Continuous Phase Detection (#9)

Phase detection currently uses score distributions (avgParagraph, problemRatio, strengthRatio) to determine improvement phase. Better-calibrated scores produce better phase detection.

With continuous per-dimension phases (#9), the interaction deepens:
- Sentence-level score variance within a paragraph informs per-dimension phase: high variance (85/40) suggests split-phase (some dimensions at Craft, others at Foundation)
- Uniform scores with high confidence suggest uniform phase
- Uniform scores with low confidence suggest phase assessment should carry lower certainty

### Quality Ceiling: What Would Make This Exceptional

**Adaptive essay-specific calibration examples.** Beyond the calibration reflection (which identifies the essay's ceiling and floor), the anchor pass can produce ESSAY-SPECIFIC calibration examples that replace or supplement the generic examples:

Instead of:
```
SCORE 38: "From the moment my fingers first danced across the piano keys..."
```

The anchor pass produces:
```
ESSAY-SPECIFIC FLOOR (from anchor scoring):
SCORE {anchor_lowest}: "{actual sentence from this essay}" — {reasoning}

ESSAY-SPECIFIC CEILING (from anchor scoring):
SCORE {anchor_highest}: "{actual sentence from this essay}" — {reasoning}
```

These essay-specific examples are forwarded to all subsequent parallel calls. They're dramatically more useful than generic examples because they show the LLM exactly what THIS essay's quality range looks like.

This is achievable with no additional LLM calls — the anchor pass already identifies strongest/weakest sentences. The system just formats them as calibration examples for subsequent calls.

### Downstream Signal Value of Confidence Metadata

Confidence metadata serves different downstream consumers:

**L5 Feedback (annotations):**
- High score + high confidence → celebrate as strength
- Low score + high confidence → prioritize as clear problem
- Any score + low confidence → frame as exploration ("This moment is ambiguous...")
- The ambiguity framing is the most valuable coaching tool

**L6 Coaching (conversation):**
- Low-confidence scores are conversation starters
- "I noticed your P2S3 could be read two ways — as rhythmic disruption or structural accident. What were you going for?"

**L4 Crystallizer (score matrix):**
- The Crystallizer transfers L3.5 effectiveness scores. With confidence metadata, it can note uncertainty in its own multi-dimensional scoring.

**Phase detection (improvement phase):**
- If >40% of scores are low-confidence, the phase assignment carries reduced certainty

---

## 5. Prompt Engineering

### Essay-Specific Calibration Section (added to system prompt)

```
## ESSAY-SPECIFIC CALIBRATION (Complete this BEFORE scoring any sentences)

Before you score a single sentence, reflect on what scoring means for THIS specific essay:

1. HIGHEST CRAFT IN THIS ESSAY: Identify the single moment (in any paragraph, using the full
   understanding context) where this writer's craft is strongest. What makes it strong? What
   score does it deserve? This is your local ceiling.

2. LOWEST CRAFT IN THIS ESSAY: Identify the single moment where craft is weakest. What makes
   it weak? What score does it deserve? This is your local floor.

3. THE GAP: The difference between your ceiling and floor scores is the MINIMUM differentiation
   range. If your ceiling is 84 and your floor is 42, you should be prepared to use that
   42-point span (though not every paragraph will contain both extremes).

4. THIS PARAGRAPH'S POSITION: Given the essay's architecture, where does this paragraph sit
   relative to the ceiling and floor? A load-bearing paragraph that falls short of its
   architectural promise should score lower than a transitional paragraph that does its small
   job well — structural importance amplifies both success and failure.

Output your calibration reflection as a "calibrationReflection" field BEFORE the sentence analyses.
The calibration reflection should be 2-4 sentences, essay-specific (not generic), and reference
actual text from the essay.

BAD calibration (generic, could apply to any essay):
"This essay has some strong and some weak moments. I will use the full scoring range."

GOOD calibration (essay-specific, cites text):
"This essay's craft ceiling is P4S2's 'I couldn't pick up my violin without my stomach clenching'
— embodied, precise, earned through the preceding 'three weeks' of silence. Score: ~86. The floor
is P0S1's 'From the moment my fingers first danced across the piano keys, I was captivated by the
power to create worlds through sound' — stock essay-opening language with zero sensory specificity
that any applicant could write without having played a note. Score: ~36. This paragraph (P2) is
the music-to-coding bridge — architecturally load-bearing but historically where this writer
retreats from embodied experience to philosophical assertion. Expect wide variation: concrete
bridge moments should score 70+ while abstract claims should score below 55."
```

### Anchor-Specific Prompt (Block 3 for the anchor paragraph)

```
ANALYZE PARAGRAPH {anchorIndex} (of {total} total, zero-indexed)
THIS IS THE ANCHOR PARAGRAPH — your scores will calibrate all subsequent paragraph analyses.

TEXT:
  [S0] "{sentence 0 text}"
  [S1] "{sentence 1 text}"
  ...

This paragraph has {N} sentences. You MUST produce analysis for each sentence index 0 through {N-1}.

UNDERSTANDING SUMMARY (already established — evaluate against this, don't redescribe):
  Role: {understanding.role}
  Function: {understanding.function}
  Narrative contribution: {understanding.narrativeContribution}

{stale area hints if any}

WHY THIS IS THE ANCHOR:
This paragraph was selected as the calibration anchor because {reason}. Your scores here establish
the baseline that all subsequent paragraph analyses will calibrate against.

ANCHOR-SPECIFIC INSTRUCTIONS:
1. Be ESPECIALLY precise in your calibration reflection. Your ceiling and floor identification
   will be forwarded to all subsequent paragraph analyses as calibration reference points.
2. After scoring, the system will extract your STRONGEST and WEAKEST sentence scores to serve
   as essay-specific calibration examples for subsequent paragraphs.
3. Your scores should use the FULL range justified by the text. If your strongest sentence
   is 82 and your weakest is 78, you are not reading this paragraph critically enough.

STANDARD INSTRUCTIONS:
1. First, rank all {N} sentences from strongest to weakest. The ranking informs your thinking —
   it does NOT force the scores. Two sentences may rank adjacently but score identically if
   they are genuinely equal in effectiveness.
2. Then evaluate each sentence — reasoning BEFORE score. Let the reasoning determine the score.
3. Ensure genuine differentiation. If all your scores fall within a 15-point band, reconsider
   whether you are applying the calibration reflection's ceiling and floor honestly.
4. Every strength and weakness must cite specific text from the sentence.
5. Produce the JSON output matching the schema in the system prompt.
6. Clichéd language, template phrasing, and unearned claims belong at 35-50 — not in the
   "functional" 55-75 band. Reserve 70+ for sentences that earn it through specificity,
   distinctive voice, or structural mastery.
```

### Anchor Context Section (appended to Block 3 for non-anchor paragraphs)

```
## CROSS-PARAGRAPH CALIBRATION ANCHOR

Paragraph P{anchorIndex} has already been scored as the calibration reference.

ANCHOR CALIBRATION REFLECTION:
"{anchor's calibrationReflection}"

ANCHOR SCORES (P{anchorIndex}):
{for each sentence in anchor paragraph:}
  S{i}: effectiveness={score} — "{brief effectivenessReasoning}"
  Confidence: {confidence.level}
Paragraph effectiveness: {paragraphScore}

ESSAY-SPECIFIC EXAMPLES (from anchor scoring):
  STRONGEST in anchor: P{anchorIndex}S{bestIdx} scored {bestScore}
    "{sentence text}" — {reasoning excerpt}
  WEAKEST in anchor: P{anchorIndex}S{worstIdx} scored {worstScore}
    "{sentence text}" — {reasoning excerpt}

YOUR CALIBRATION TASK:
- Compare this paragraph's quality to the anchor (P{anchorIndex}, effectiveness {paragraphScore}).
- If this paragraph is overall WEAKER than P{anchorIndex}, your paragraph effectiveness should be
  lower than {paragraphScore}.
- If overall STRONGER, higher.
- For individual sentences: use the anchor's strongest ({bestScore}) and weakest ({worstScore})
  as reference points. A sentence here that matches the anchor's strongest in craft quality
  should score comparably. A sentence weaker than the anchor's weakest should score BELOW {worstScore}.
- Include a "comparativeNotes" field explaining how this paragraph compares to the anchor.

IMPORTANT: These are calibration REFERENCES, not constraints. If you determine this paragraph
is genuinely comparable to the anchor, that's a valid assessment — just explain why in your
comparative notes.
```

### Confidence Assessment Section (added to system prompt output format)

```
## CONFIDENCE ASSESSMENT (required for each sentence)

After scoring each sentence, assess your confidence in that specific score:

"confidence": {
  "reasoning": "string — WHY you are this confident. Reference specific textual evidence or
                 ambiguity. NOT 'I am fairly confident' but cite the specific text feature
                 that makes you certain or uncertain.
                 Example: 'The embodied detail in S2 clearly earns 80+ — the physical specificity
                 of 'stomach clenching' and temporal precision of 'three weeks' are unambiguous
                 craft markers. High confidence.'
                 Example: 'S4 could be intentional rhythmic disruption (matching P1's fragmented
                 pace) or accidental run-on. The interpretation changes the score by ~15 points.'",
  "level": "high" | "moderate" | "low",
  "sensitivityNote": "string | null — What would change this score? Required for 'low' and
                      'moderate' confidence. Null for 'high' confidence.
                      Example: 'If the writer intended the fragment as rhythmic disruption
                      (possible given P1's similarly fragmented pace), this moves from 58 to 73.
                      Without knowing intent, I score conservatively.'"
}

CALIBRATION FOR CONFIDENCE LEVELS:
- "high": You would defend this score +/- 5 points. The textual evidence is unambiguous.
          A specific image that clearly works. A cliché that clearly doesn't. A structural
          move that obviously serves or fails its purpose.
- "moderate": This score is reasonable. +/- 8-10 points is defensible with different reading
              emphasis. The sentence has craft features that work AND features that don't,
              and reasonable readers could weight them differently.
- "low": Genuine ambiguity. You could see this scoring 15+ points different with additional
         context or with knowledge of the writer's intent. The ambiguity itself is diagnostic.

IMPORTANT: "low" confidence is NOT a failure. It is diagnostic information. An ambiguous sentence
that could be intentional craft or accidental error SHOULD have low confidence — that ambiguity
IS the teaching moment. The coaching system uses low-confidence scores to open conversations
with the student about their intent.
```

### Updated Output Format (complete JSON schema)

```json
{
  "calibrationReflection": "string — essay-specific, not generic. References actual text.
    Must identify ceiling moment + score, floor moment + score, this paragraph's expected range.",

  "sentenceRanking": ["S2 strongest because its embodied detail earns conviction",
    "S1 functional — does its job without distinction",
    "S0 weakest — stock opening that any applicant could write"],

  "sentenceAnalyses": [
    {
      "sentenceIndex": 0,
      "effectivenessReasoning": "string — references [U] labels AND anchor comparison if available.
        Reasoning determines the score, not the reverse.",
      "effectiveness": 42,
      "strengths": [
        { "observation": "specific text-grounded strength", "evidence": "quoted text", "confidence": 0.9 }
      ],
      "weaknesses": [
        { "observation": "specific text-grounded weakness", "evidence": "quoted text", "confidence": 0.85 }
      ],
      "isStrength": false,
      "isProblem": true,
      "priorityForImprovement": 4,
      "confidence": {
        "reasoning": "Stock essay-opening phrasing is unambiguously weak — 'fingers danced'
          and 'captivated by the power' are catalogue language found in thousands of essays.
          No textual ambiguity.",
        "level": "high",
        "sensitivityNote": null
      }
    },
    {
      "sentenceIndex": 1,
      "effectivenessReasoning": "...",
      "effectiveness": 67,
      "strengths": [...],
      "weaknesses": [...],
      "isStrength": false,
      "isProblem": false,
      "priorityForImprovement": 2,
      "confidence": {
        "reasoning": "The musical knowledge here is genuine ('minor adjustments transformed
          mood') but the language defaults to telling rather than showing. The score reflects
          real content expressed generically.",
        "level": "moderate",
        "sensitivityNote": "If the writer added specific chord names or a specific musical
          moment, this would jump to 75+. The content is there; the specificity isn't."
      }
    }
  ],

  "paragraphEffectiveness": 55,
  "paragraphVerdict": "string — one sentence capturing how well this paragraph fulfills its role",

  "comparativeNotes": "string | null — how this paragraph compares to the anchor.
    Null for the anchor paragraph itself.
    Example: 'P0 scores 8 points below anchor P4 (55 vs 63) because P0's architectural role
    (framing the constraint-creativity thesis) is undermined by its reliance on assertion
    rather than demonstration. P4 at least shows one concrete moment; P0 shows none.'",

  "holisticAnalysisEvolution": {
    "strengthSignatures": [{ "quality": "...", "evidence": "...", "paragraphs": [0] }],
    "growthEdges": [{ "quality": "...", "description": "...", "paragraphs": [0] }],
    "aoTakeaway": "string"
  }
}
```

### Token Budget Estimate

The prompt additions add approximately:
- Calibration reflection section in system prompt: ~300 tokens (one-time, cached)
- Confidence assessment section in system prompt: ~250 tokens (one-time, cached)
- Anchor context in Block 3 (non-anchor paragraphs only): ~200-400 tokens per call
- Confidence output per sentence: ~50-100 tokens per sentence
- Calibration reflection output: ~80-120 tokens per paragraph
- Comparative notes output: ~50-80 tokens per non-anchor paragraph

For a typical 7-paragraph essay with ~30 sentences:
- Additional input tokens: ~300 (system) + 5*300 (anchor context) = ~1800 tokens
- Additional output tokens: 30*75 (confidence) + 7*100 (calibration) + 6*65 (comparative) = ~3640 tokens
- At Sonnet pricing: ~$0.005 (input) + ~$0.055 (output) = ~$0.06 additional per essay

Total additional cost: ~$0.06 per essay analysis. Latency: +3-8 seconds for anchor sequential call.

---

## 6. Integration Points

### With Improvement #1 (Reading Strategy)
Reading Strategy tells L3.5 what to pay attention to when scoring. "This essay rewards attention to vocabulary domain shifts" → the calibration reflection should reference this: "Given that this essay's meaning-making is in vocabulary shifts, I'm weighting word-level precision higher for moments where domains collide."

### With Improvement #3 (Maturity-Gated Scoring)
If a finding informing the scoring is at "hypothesis" maturity, the sentence analysis should note lower confidence on dimensions that depend on that finding. The confidence metadata makes this explicit.

### With Improvement #4 (Contradiction Mining)
Score-understanding divergences are a prime contradiction type. Confidence metadata helps distinguish genuine contradictions (high-confidence low score on a "strongest moment") from scoring uncertainty (low-confidence low score). The miner uses confidence to calibrate its own assessments.

### With Improvement #5 (Dynamic Annotation Targeting)
Confidence enables three-way annotation routing:
- High score + high confidence → celebrate
- Low score + high confidence → prioritize for teaching
- Any score + low confidence → explore with student

### With Improvement #9 (Continuous Phase Detection)
Better-calibrated scores produce more accurate per-dimension phase assessments. Confidence metadata enables phase confidence: if many scores are low-confidence, the phase assessment itself should carry lower certainty.

### With L4 Crystallizer
The Crystallizer transfers L3.5 effectiveness scores directly to its score matrix. Better-calibrated L3.5 scores → more meaningful multi-dimensional scores. The Crystallizer should also note low-confidence effectiveness scores in its own assessments.

---

## 7. Implementation Sequence

### Step 1: Type Definitions (30 min)
**File:** `src/services/essayIntelligence/profileTypes.ts`

1. Add `SentenceAnalysisConfidence` interface (as defined in Section 3)
2. Extend the sentence analysis type in `AnalysisPassOutput.sentenceAnalyses[]` to include optional `confidence?: SentenceAnalysisConfidence`
3. Add optional `calibrationReflection?: string` to `AnalysisPassOutput`
4. Add optional `comparativeNotes?: string | null` to `AnalysisPassOutput`
5. Add optional `distributionDiagnostics?` to `L35AnalysisResult` in `analysisPass.ts`
6. All new fields are OPTIONAL — backward compatible with existing data
7. Run `npx tsc --noEmit` — should compile cleanly since all additions are optional

### Step 2: Anchor Selection Logic (45 min)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. Add `selectAnchorParagraph(profile: Readonly<EssayProfile>): number` function
   - Primary: `profile.narrativeStrategy?.turningPoint?.paragraph`
   - Fallback: paragraph whose understanding.role contains "fulcrum" or "pivot"
   - Fallback: paragraph with highest structural weight from L3.75
   - Fallback: paragraph with most sentences
   - Ultimate fallback: index 1
   - Log which selection method was used

2. This is a SYSTEM routing decision — add comment: `// System routing (Rule 6): selects which paragraph to score first. Does NOT influence scoring judgment.`

### Step 3: Prompt Updates (2-3 hours)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. Update `buildSystemPrompt()`:
   - Add Essay-Specific Calibration section (from Section 5)
   - Add Confidence Assessment section (from Section 5)
   - Update output format schema to include `calibrationReflection`, `confidence`, `comparativeNotes`
   - Keep ALL existing content (calibration examples, anti-clustering rules, ranking instructions)
   - The new sections are ADDITIVE

2. Update `buildParagraphPrompt()`:
   - Accept new parameter: `anchorContext?: { isAnchor: boolean; context?: string }`
   - When `isAnchor: true`: add anchor-specific instructions (from Section 5)
   - When `context` is provided: append anchor context section
   - When neither: standard prompt (unchanged)

3. Add new function `buildAnchorContext(anchorResult: AnalysisPassOutput): string`
   - Extracts anchor's calibration reflection
   - Extracts strongest and weakest sentence scores with reasoning
   - Formats as the Anchor Context Section (from Section 5)
   - Returns formatted string to be appended to Block 3

### Step 4: Analysis Orchestration Changes (2 hours)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. Update `analyzeAllParagraphs()`:
   ```
   a. Select anchor paragraph
   b. Log: "[AnalysisPass] Anchor paragraph selected: P{index} ({reason})"
   c. Score anchor paragraph FIRST (sequential call)
   d. If anchor fails → fall back to standard parallel (log warning, no anchor context)
   e. Build anchor context from anchor result
   f. Score remaining paragraphs in parallel with anchor context
   g. Merge anchor result with parallel results
   h. Sort by paragraph index
   i. Compute distribution diagnostics
   j. Compute improvement phase (unchanged — future improvement #9 replaces this)
   ```

2. Update `analyzeSingleParagraph()`:
   - Accept optional `anchorContext?: { isAnchor: boolean; context?: string }`
   - Pass to `buildParagraphPrompt()`

### Step 5: Response Validation Updates (1-2 hours)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. Update `validateAndTransform()`:
   - Extract `confidence` from each raw sentence analysis
   - Default: `{ reasoning: 'Confidence not assessed', level: 'moderate', sensitivityNote: null }`
   - Validate `level` is one of 'high' | 'moderate' | 'low' (default to 'moderate')
   - Extract `calibrationReflection` from raw output (default to '')
   - Extract `comparativeNotes` from raw output (default to null)
   - No changes to score clamping or other validation

2. Add distribution diagnostics computation:
   ```typescript
   function computeDistributionDiagnostics(
     results: AnalysisPassOutput[],
     anchorParagraphIndex: number,
   ): L35AnalysisResult['distributionDiagnostics'] {
     // Compute stdev, range for sentences and paragraphs
     // Count low-confidence sentences
     // This is OPERATIONAL BOOKKEEPING (Rule 6), not analytical judgment
   }
   ```

3. Enhance existing clustering warning to include confidence context:
   ```
   if (stdev < 5 && range < 15) {
     const highConfidenceRatio = highConfidenceCount / totalSentences;
     if (highConfidenceRatio > 0.7) {
       log("CLUSTERING DETECTED but {ratio}% high-confidence — may be genuine uniformity");
     } else {
       log("CLUSTERING DETECTED with low confidence — likely scoring laziness");
     }
   }
   ```

### Step 6: Focused Analyzer Integration (1 hour)
**File:** `src/services/essayIntelligence/analysis/focusedAnalyzer.ts`

1. Currently imports and uses `computeImprovementPhase` — no change needed there
2. When focused analyzer re-analyzes a paragraph, it should use the PRIOR comprehensive analysis's anchor scores as calibration context
3. Add: retrieve the last comprehensive analysis's anchor paragraph and its scores from the profile or from stored analysis results
4. Build anchor context from prior scores and pass to the focused paragraph analysis call
5. This ensures re-analyzed paragraphs stay calibrated against the same baseline

### Step 7: Phase Computation Compatibility (15 min)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. `computeImprovementPhase()` continues to work unchanged
2. No formula changes — better-calibrated scores produce better phase output naturally
3. Add one diagnostic log: if >30% of sentence scores have `confidence.level === 'low'`, log that phase assignment has reduced reliability
4. Full phase computation overhaul is deferred to Improvement #9

### Step 8: Testing (2-3 hours)

Create test file: `tests/essay-intelligence/test-l35-anti-clustering.ts`

1. **Anchor selection test**: construct profiles with various structural configurations, verify correct anchor paragraph is selected

2. **Scoring differentiation test**: run full pipeline against the piano test essay
   - Compare score distributions before and after changes
   - Expected: wider score range, fewer scores in 65-75 band
   - Assert: calibration reflections reference specific text from THIS essay
   - Assert: confidence levels vary (not all "moderate")
   - Assert: anchor paragraph scores have wider range than pre-improvement

3. **Anchor context effect test**: score the same paragraph with and without anchor context
   - Expected: measurably different scores (anchor context changes calibration)
   - The difference confirms the anchor is providing useful calibration

4. **Uniform essay test**: construct or use a genuinely mediocre essay
   - Expected: scores cluster but confidence is high
   - Expected: calibration reflection explains the uniformity essay-specifically
   - This validates that the system doesn't FORCE differentiation on genuinely uniform text

5. **Cost and latency test**: measure wall-clock time and API cost
   - Expected: +3-8 seconds latency (one sequential call)
   - Expected: ~$0.03-0.06 additional cost

6. **Backward compatibility test**: verify existing code that reads `AnalysisPassOutput` works without changes (new fields are optional)

### Step 9: Type Check and Cleanup (30 min)

1. `npx tsc --noEmit` — fix any remaining type errors
2. Verify all consumers of `AnalysisPassOutput` handle new optional fields gracefully
3. Verify the focused analyzer correctly retrieves and uses prior anchor context
4. Remove any debugging artifacts
5. Ensure no functions compute, adjust, reweight, or override LLM scores — final litmus test

### Step 10: Calibration Reflection Quality Audit (1 hour)

After the pipeline is working, run 3-5 essays through and manually inspect the calibration reflections:

1. **Essay-specificity check**: Does each calibration reflection reference actual text from THIS essay? Or does it fall back to generic language ("this essay has some strong and weak moments")?
   - If generic: the calibration section in the system prompt needs stronger examples and more explicit "BAD vs GOOD" framing
   - If essay-specific but shallow: the prompt may need to demand more precise text citations

2. **Ceiling-floor range check**: What is the typical gap between the identified ceiling score and floor score?
   - If gap < 15 points consistently: the calibration is not producing useful differentiation
   - If gap > 40 points consistently: good — the LLM is finding genuine quality range
   - If gap varies by essay: ideal — different essays have different quality ranges

3. **Anchor effect verification**: Compare score distributions from the anchor paragraph vs. parallel paragraphs.
   - The anchor paragraph's scores should show wider range (it's scored without calibration context, using only the essay-specific reflection)
   - Parallel paragraphs should show differentiation RELATIVE TO the anchor (scores should reference the anchor's quality level)
   - If parallel paragraphs cluster despite anchor context: the anchor context section may need revision

4. **Confidence distribution check**: What percentage of scores are high/moderate/low confidence?
   - If >80% are "moderate": the confidence assessment may be defaulting to safe middle (the same problem we're solving for scores)
   - If confidence shows genuine variation (some high, some moderate, a few low): the assessment is working
   - If >30% are "low": either the essay is genuinely ambiguous or the prompt's confidence calibration needs adjustment

### Edge Case: Multi-Version Essays

When analyzing a re-submitted essay (the student revised and re-uploaded), the prior analysis's anchor scores can serve as historical calibration:

- The new anchor is selected fresh (the essay's architecture may have changed)
- But the prior analysis's score distribution is available as historical context
- This enables the system to detect calibration DRIFT: "Last analysis, your ceiling was 84 and floor was 42. This analysis, ceiling is 78 and floor is 61. The range compressed — either the essay genuinely became more uniform, or your calibration shifted."
- Drift detection is LOGGED (system diagnostic, Rule 6), not enforced. The LLM's current assessment stands.

### Edge Case: Extremely Short Paragraphs

Some essays have paragraphs with only 1-2 sentences. For these:
- Anchor context still applies but the calibration reflection should note: "This paragraph has only 1 sentence — the per-sentence score IS the paragraph score. Calibrate against the anchor's per-sentence range, not its paragraph average."
- Confidence on single-sentence paragraphs may be inherently lower (less text to form judgment from)
- The system should not treat single-sentence paragraphs differently in routing — the prompt handles it through calibration reflection

### Edge Case: Poems and Non-Standard Formats

Some essays use poetic structure, single-sentence paragraphs throughout, or other non-standard formats:
- The anchor selection algorithm may struggle (no clear "fulcrum paragraph" in a poem)
- The fallback to "paragraph with most sentences" handles this gracefully
- The calibration reflection should address the format: "This essay uses poetic structure — sentence-level craft assessment should weight rhythm and imagery higher than argumentative clarity"
- This is handled naturally by the essay-specific calibration, not by special-case code

### Dependency Notes
- This improvement has NO dependencies on other improvements — implement independently
- Improvements #4 and #9 are ENHANCED by this improvement's output (confidence metadata, better-calibrated scores) but don't require it
- The focused analyzer update (Step 6) should be done after the comprehensive pass changes are validated
- The existing `computeImprovementPhase()` is NOT modified here — Improvement #9 handles that

### Cost Impact Summary
- Anchor sequential call: +$0.02-0.04 (was parallel, now sequential — same cost, different timing)
- Anchor context tokens: +$0.003-0.007 per essay (200-400 tokens * 5-6 paragraphs)
- Confidence output tokens: +$0.022-0.045 per essay (50-100 tokens * 30 sentences)
- Calibration reflection output: +$0.007-0.012 per essay (80-120 tokens * 7 paragraphs)
- **Total additional cost: ~$0.03-0.06 per essay analysis**
- **Latency impact: +3-8 seconds** (one sequential anchor call before parallel)
