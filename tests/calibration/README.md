# Calibration Essay Suite (Layer 0)

The measurement foundation for the Uplift annotation pipeline V2. Without calibration data, we cannot measure whether improvements actually improve anything.

## What This Is

A corpus of 10 realistic college admissions essays spanning the full quality spectrum (poor to excellent), each with expert-level per-dimension quality ratings using the V2 10-dimension scoring system. This serves as the ground truth against which all scoring pipeline changes are validated.

## Essay Inventory

| # | File | Type | Words | Tier | EQI | Notes |
|---|------|------|-------|------|-----|-------|
| 01 | `01-poor-personal-statement.txt` | Personal Statement | 340 | Poor | 21 | Sports injury cliche, zero fresh treatment |
| 02 | `02-poor-activity-description.txt` | Activity Description | 107 | Poor | 21 | Resume-speak, listing responsibilities |
| 03 | `03-below-avg-piq.txt` | UC PIQ | 289 | Below Avg | 40 | Real moments buried in predictable arc |
| 04 | `04-below-avg-why-us.txt` | Why Us | 220 | Below Avg | 37 | **TRAP**: polished prose, hollow content |
| 05 | `05-average-personal-statement.txt` | Personal Statement | 340 | Average | 61 | Competent, genuine but unsurprising |
| 06 | `06-average-community.txt` | Community | 244 | Average | 61 | Good voice, limited depth |
| 07 | `07-good-personal-statement.txt` | Personal Statement | 520 | Good | 80 | Laminated list, circular structure |
| 08 | `08-good-why-us.txt` | Why Us | 275 | Good | 74 | Deep research, professor email |
| 09 | `09-excellent-activity-description.txt` | Activity Description | 131 | Excellent | 78 (88*) | **TRAP**: functional prose, exceptional impact |
| 10 | `10-excellent-personal-statement.txt` | Personal Statement | 530 | Excellent | 92 | Gerald the frog, unforgettable |

*\* Essay 09's generic EQI is 78 because emotional and narrative dimensions are appropriately low for activity descriptions. With genre-adjusted weights, it scores 88.*

### Trap Essays

Two essays are designed to challenge naive scoring:

- **04 (Below Avg Why Us)**: Grammatically polished with organized structure (structural_coherence: 65, word_economy: 52), but hollow content (memorability: 25, agency: 35). A surface-level scorer that weights prose quality might rate it higher than it deserves. Tests whether the pipeline can distinguish polish from substance.
- **09 (Excellent Activity)**: No lyrical prose, no emotional vulnerability, no narrative craft. Generic EQI is 78, but genre-adjusted EQI is 88. A scorer focused on literary qualities might underrate it. Tests whether the pipeline accounts for essay type when interpreting scores (activity descriptions SHOULD have low emotional/narrative scores).

## The V2 10-Dimension Scoring System

| # | Dimension | Weight | What It Measures |
|---|-----------|--------|-----------------|
| 1 | Voice, Originality & Irreplaceability | 14% | Could only this student have written this? |
| 2 | Thematic Depth & Self-Awareness | 13% | Insight that reframes, not just summarizes |
| 3 | Emotional Resonance & Vulnerability | 11% | Shown emotion, not told emotion |
| 4 | Intellectual Vitality & Curiosity | 11% | Genuine curiosity demonstrated through action |
| 5 | Memorability & Committee Impact | 10% | Would an AO remember this tomorrow? |
| 6 | Narrative Craft & Scene Construction | 10% | Show-don't-tell, dialogue, sensory detail |
| 7 | Agency & Initiative | 9% | Did the student ACT or were they acted upon? |
| 8 | Structural Coherence & Flow | 8% | Architecture, transitions, pacing |
| 9 | Clarity of Purpose & Throughline | 8% | Does every paragraph serve the central argument? |
| 10 | Word Economy & Craft | 6% | Sentence-level precision, no filler |

### Changes from V1 (13 dimensions)

- **Absorbed**: `authenticity_specificity` into Voice (#1), `growth_transformation` into Thematic Depth (#2), `tonal_sophistication` into Narrative Craft (#6), `opening_hook` + `closing_impact` into Structural Coherence (#8), `argument_rhetorical` replaced by Clarity of Purpose (#9)
- **New**: Memorability & Committee Impact (#5), Agency & Initiative (#7)
- **Reweighted**: Voice up to 14% (was 10%), Word Economy down to 6% (was 7%)

## Quality Tier Definitions

| Tier | EQI Range | Characteristics |
|------|-----------|-----------------|
| **Poor** | 15-35 | Cliches, telling-not-showing, generic insights, weak structure, no memorable moments |
| **Below Average** | 35-55 | Some genuine moments buried in mediocrity, predictable arcs, surface-level reflection |
| **Average** | 55-70 | Competent but unremarkable, decent craft, forgettable in a strong pool |
| **Good** | 70-85 | Strong voice, clear structure, genuine insight, memorable moments, would be discussed |
| **Excellent** | 85-100 | Exceptional, unforgettable hook, deep self-awareness, would stand out in committee |

## Running Calibration Tests

```bash
# Run the calibration test suite against the current scoring pipeline
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/calibration/runCalibration.ts

# Compare V1 vs V2 scoring on calibration essays
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/calibration/runCalibration.ts --compare
```

The calibration runner will:
1. Load each essay and its expert ratings
2. Run the essay through the scoring pipeline
3. Compare pipeline scores to expert scores per dimension
4. Report mean absolute error (MAE) per dimension and overall
5. Flag any essay where the pipeline's EQI differs from expert EQI by more than 15 points

**Target**: Pipeline MAE < 10 points per dimension, overall EQI MAE < 8 points.

## Adding New Calibration Essays

1. Write the essay in `essays/NN-tier-type.txt` (e.g., `11-good-community.txt`)
2. Add an entry to `expert-ratings.json` following the existing schema
3. Score all 10 dimensions with rationales (be specific about evidence)
4. Set the `expectedEQI` as the weighted sum of dimension scores
5. Include `keyStrengths`, `keyWeaknesses`, and `memorabilityTest`
6. If the essay is a "trap" (misleading quality signals), document it in `trapNote`

### Scoring Guidelines for New Ratings

- Each dimension is scored 0-100
- Rationales must cite specific text evidence
- Scores must be internally consistent (a "poor" essay should not score >50 on most dimensions)
- Consider the essay type's weight profile (activity descriptions weight word economy higher, personal statements weight narrative craft higher)
- Always ask: "Would an experienced AO agree with this score?"

## EQI Calculation

```
EQI = sum(dimension_score * dimension_weight) for all 10 dimensions
```

Weights sum to 1.00. The EQI is a weighted average, not a simple mean.

## File Format

- **Essays**: Plain text files, no metadata headers
- **Ratings**: Single JSON file with all ratings, versioned by `calibrationVersion`
- **Dimension IDs**: Snake_case, matching the `dimensions` array in the JSON
