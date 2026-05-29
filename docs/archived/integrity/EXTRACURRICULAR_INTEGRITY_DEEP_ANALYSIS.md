# Extracurricular System Integrity: Deep Analysis

## How the Integrity Issues Specifically Affect Activity Evaluation

**Purpose**: Maps exactly where integrity problems manifest in the activity workshop pipeline and what needs to change.

---

## 1. The Activity Workshop Pipeline (Where Issues Live)

The activity system has a **5-stage pipeline**. Here's where integrity issues occur at each stage:

### Stage 0: Story Detection (Haiku) - LOW RISK
- Classifies student archetypes (innovator, leader, scholar, etc.)
- Detects first-gen/low-income/work obligations from input
- **Issue**: No integrity problems here — it's just classification

### Stage 1: Context-Aware Analysis (Sonnet) - MEDIUM RISK
- Tiers each activity using Sara Harberson 4-tier framework
- Runs portfolio-level spike/coherence analysis
- **Where issues appear**:
  - `firstGen` and `lowIncome` flags are passed to the LLM prompt (line 195, 282-283 of `stage1ContextAwareAnalysisService.ts`)
  - The LLM is told these facts but NOT given fabricated multipliers — the LLM interprets context qualitatively
  - **Verdict**: Stage 1 is actually okay because it lets Sonnet interpret context naturally

### Stage 2: Conditional Teaching (Sonnet) - MEDIUM RISK
- Generates improvement advice with benchmarks
- Pulls from `knowledgeAssemblyService.ts` and `activityTeachingKnowledgeBase.ts`
- **Where issues appear**:
  - Teaching references tier benchmarks from `comparisonBenchmarksLibrary.ts`
  - Some benchmark claims have inaccurate selectivity numbers
  - Teaching may reference "admission impact" levels from `extracurricularDatabase.ts`

### Stage 3: Portfolio Synthesis (Haiku) - LOW RISK
- Final Harvard 1-6 scale assessment
- **Issue**: Uses "Harvard Scale" naming (should be "Uplift Rating")

### Holistic Synthesizer (Portfolio Level) - HIGH RISK
- `holisticSynthesizer.ts` applies `contextBoost` additively (already capped at 15!)
- `schoolFitEngine.ts` applies `contextBoost` to admission probability estimates
- **Where issues appear**:
  - `schoolFitEngine.ts:867-878`: Context boost adds to admission rate estimate
  - `PROBABILITY_CONFIG.contextAdjustments.firstGen` — the actual numeric value matters

### Extracurricular Database - HIGH RISK
- `extracurricularDatabase.ts` contains fabricated admission acceptance rates
- This is the CORE problem for the activity system

---

## 2. The Three Specific Files That Matter Most

### File 1: `knowledge/extracurricularDatabase.ts` — THE BIGGEST PROBLEM

This file contains **fabricated admission acceptance rate claims** presented as data:

```typescript
// Lines 386-403: Regeneron STS
first_place: { acceptance_rate: 0.95 }   // Claims 95% acceptance — WHERE FROM?
top_10: { acceptance_rate: 0.89 }        // Claims 89% acceptance — WHERE FROM?
finalist: { acceptance_rate: 0.85 }      // Claims 85% acceptance — WHERE FROM?

// Lines 120-138: Math Olympiad
mop: { mit_acceptance_estimate: 0.70 }   // Claims 70% MIT acceptance — WHERE FROM?
imo.gold: { acceptance: 0.90 }           // Claims 90% acceptance — WHERE FROM?
imo.silver: { acceptance: 0.80 }         // Claims 80% acceptance — WHERE FROM?

// Lines 654-662: Athletics
recruited_acceptance_rate: 0.86           // Claims 86% "Harvard data" — UNVERIFIED
multiplier: 17                            // Claims 17x boost — FABRICATED

// Lines 906-920: Admission impact tiers
near_guarantee: { multiplier: 18, acceptance_range: [0.80, 0.95] }  // FABRICATED
exceptional: { multiplier: ??? }
```

**Why this is harmful**: When our teaching service says "USAMO qualifiers have a ~50% acceptance rate at MIT," we're stating a fabricated number as fact. A student or parent could repeat this to a counselor and be immediately discredited, which undermines trust in all our advice.

**What we actually know**:
- We know USAMO is extremely selective (~250 qualifiers)
- We know MIT values math competition achievement highly
- We do NOT know specific acceptance rates for USAMO qualifiers at MIT
- Any such number would change yearly and is never published by MIT

### File 2: `scoring/comparisonBenchmarksLibrary.ts` — MOSTLY GOOD

This file is actually **well-constructed**. Let me be specific:

**What's good** (and should be preserved):
- 11 activity categories with 4 tiers each
- Benchmark entries have `activity`, `scoreRange`, and `context`
- Context strings provide educational value ("Top ~500 out of 300,000+ AMC participants")
- Score ranges (1-10) map cleanly to tiers
- Keywords-based matching is pragmatic

**What needs improvement**:
- Some selectivity numbers need verification (USAMO: "Top ~500 out of 300,000+" — actual is ~250 qualifiers)
- STS: "40 finalists from ~1,900 applicants" — actual is 2,500 entrants per Society for Science
- No verification level tagging
- No source citations attached to entries

**Specific corrections needed**:

| Current Claim | Correct Value | Source |
|---------------|---------------|--------|
| USAMO: "Top ~500 out of 300,000+" | ~250 qualifiers from 100,000+ AMC takers | MAA |
| STS: "40 finalists from ~1,900" | 40 finalists from ~2,500 entrants | Society for Science |
| RSI: "80 selected from 3,000+ applicants globally; MIT-hosted, 2.7% acceptance" | ~80 selected from ~3,500 applicants | RSI/MIT |
| ISEF: "Top project among ~1,800 finalists from 80+ countries" | ~1,800 finalists from 7M+ feeder participants | Society for Science |
| Scholastic: "~2,000 national awards from 340,000+" | Verify against Scholastic current data | Scholastic Art & Writing |

### File 3: `knowledge/contextAdjustmentDatabase.ts` — CRITICAL

**Already covered in the main implementation plan**, but for the activity system specifically:

This file's fabricated `admission_boost` values are NOT directly imported by the activity workshop services. The activity workshop uses `firstGen` and `lowIncome` as boolean flags passed to the LLM, which interprets them qualitatively.

HOWEVER, the `holisticSynthesizer.ts` and `schoolFitEngine.ts` DO consume context boost values at the portfolio level, which indirectly affects how activity portfolios are scored holistically.

---

## 3. What the Activity System Gets RIGHT

Before fixing things, let's acknowledge what's already working well:

### The 5-Component Scoring Model (activityScoringService.ts)
```
Tier Assessment:        30% weight
Recognition Level:      25% weight
Leadership & Impact:    12.5% weight (conditional)
Community & Character:  15% weight
Commitment:             17.5% weight
```
This is a **well-designed rubric**. The weights are editorial but reasonable and well-rationalized:
- Tier gets most weight (what you achieved)
- Recognition validates externally (not self-assessed)
- Leadership is conditional (correct — solo researchers don't need it)
- Commitment matters more than leadership titles (good design)

### The Teaching Pipeline
- Celebrates strengths before critiquing
- Provides before/after examples
- Offers tier upgrade pathways with concrete steps
- Uses story context from Stage 0 to personalize
- All of this is driven by LLM with pre-assembled knowledge — NOT by hard-coded multipliers

### The Comparison Benchmarks Library
- Categories are comprehensive (11 types)
- Score ranges are consistent across tiers
- Context strings are genuinely educational
- The matching function is practical

### Context-Aware Interpretation (NOT Inflation)
The activity system mostly does this correctly at the LLM layer:
- It passes `firstGen: true` to the prompt
- The LLM interprets "achieving AIME qualification while working 20hrs/week" naturally
- It does NOT multiply the activity score by 1.8x
- This is actually the right approach — context changes interpretation, not scores

---

## 4. Specific Changes Needed for the Activity System

### Priority 1: Fix Fabricated Acceptance Rates in extracurricularDatabase.ts

**Action**: Remove all `acceptance_rate`, `mit_acceptance_estimate`, and `multiplier` fields that claim specific admission probabilities.

**Replace with**:
```typescript
// BEFORE (fabricated):
mop: {
  mit_acceptance_estimate: 0.70,
  admissionImpact: 'near_guarantee',
}

// AFTER (honest):
mop: {
  admissionSignal: 'exceptional',
  verificationLevel: 'editorial',
  context: 'Top 60 math students nationally; consistently one of the strongest signals for math-focused admissions',
  whatWeKnow: 'MOP invitees are among the most recruited math students in the country',
  whatWeDontKnow: 'Specific acceptance rates are not published and vary yearly',
}
```

**Why this matters for activities**: When our teaching service references the extracurricular database to build tier explanations, it should say:
- "MOP is one of the strongest signals in math admissions" (TRUE)
- NOT "MOP gives you a 70% acceptance rate at MIT" (FABRICATED)

### Priority 2: Fix Selectivity Numbers in comparisonBenchmarksLibrary.ts

**Specific corrections**:

```typescript
// BEFORE:
{ activity: 'USAMO qualifier', context: 'Top ~500 out of 300,000+ AMC participants (0.17%)' }

// AFTER:
{ activity: 'USAMO qualifier', context: 'Top ~250 out of 100,000+ AMC participants; one of the most selective academic competitions nationally' }
// Source: MAA - approximately 250 USAMO qualifiers annually

// BEFORE:
{ activity: 'Intel/Regeneron STS finalist', context: '40 finalists from ~1,900 applicants; often called "junior Nobel Prize"' }

// AFTER:
{ activity: 'Regeneron STS finalist', context: '40 finalists from ~2,500 entrants (1.6%); oldest and most prestigious US science competition for high schoolers' }
// Source: Society for Science official data
```

### Priority 3: Add Verification Metadata to BenchmarkEntry

```typescript
// Current type:
interface BenchmarkEntry {
  activity: string;
  scoreRange: [number, number];
  context: string;
}

// Proposed type:
interface BenchmarkEntry {
  activity: string;
  scoreRange: [number, number];
  context: string;
  verificationLevel?: 'official' | 'published' | 'industry' | 'editorial';
  source?: string; // e.g., 'MAA', 'Society for Science', 'NACAC'
}
```

This is minimal additional code but ensures every benchmark knows its own reliability level.

### Priority 4: Replace Admission Impact Multipliers

In `extracurricularDatabase.ts`, the `ADMISSION_IMPACT_TIERS` section (lines 906-920) uses multipliers like:

```typescript
near_guarantee: { multiplier: 18, acceptance_range: [0.80, 0.95] }
```

**Replace with**:
```typescript
type AdmissionSignalStrength = 'exceptional' | 'very_strong' | 'strong' | 'moderate' | 'supplementary';

const ADMISSION_SIGNAL_TIERS = {
  exceptional: {
    description: 'Among the strongest signals in college admissions',
    examples: 'IMO medalist, STS finalist, D1 recruited athlete',
    whatWeKnow: 'These achievements consistently appear in admitted class profiles at all selective schools',
    verificationLevel: 'industry' as const,
  },
  very_strong: {
    description: 'Significantly strengthens application at selective schools',
    examples: 'USAMO qualifier, published research, national competition winner',
    whatWeKnow: 'NACAC data: 76.8% of schools rate talent/ability as considerable importance',
    verificationLevel: 'official' as const,
  },
  // ...
};
```

### Priority 5: Rename "Harvard Scale" References

In Stage 3 and elsewhere, rename to "Uplift Extracurricular Rating" or "Uplift Portfolio Rating":

```typescript
// BEFORE:
"Provide a final Harvard 1-6 scale assessment"

// AFTER:
"Provide a final Uplift 1-6 Portfolio Rating (1=exceptional, 6=minimal)"
// Note: This is Uplift's editorial rating scale inspired by holistic review practices
```

---

## 5. What NOT to Change

These aspects are working well and should be preserved:

1. **Sara Harberson 4-Tier Framework** — Well-established in admissions consulting, appropriate to reference
2. **5-Component Scoring Weights** — Editorial but well-reasoned
3. **Context as LLM input, not numeric multiplier** — The activity pipeline already does this correctly
4. **Teaching pipeline structure** — Celebration → Tier Explanation → Strengths → Improvements → Upgrade Path
5. **Comparison benchmarks format** — Activity + score range + educational context
6. **Story archetype detection** — Good design, no integrity issues
7. **Spike/coherence analysis** — Conceptually sound, thresholds are editorial but reasonable

---

## 6. Impact Assessment

### What Breaks if We Don't Fix This

1. **Credibility with counselors**: A school counselor who sees "USAMO gives 50% MIT acceptance" will immediately distrust ALL our advice
2. **Parental trust**: Parents making decisions based on fabricated probability estimates
3. **Legal exposure**: Claiming specific acceptance rates could be seen as misleading advertising
4. **Student harm**: Students over-relying on fabricated boost numbers instead of building genuine profiles

### What Changes for Users After the Fix

1. **Teaching quality stays the same** — The LLM generates advice; we just clean up the knowledge base it references
2. **Tier classifications stay the same** — Tiers 1-4 are sound
3. **Score ranges stay the same** — The 1-10 scoring rubric is well-designed
4. **Context interpretation improves** — Qualitative interpretation > fake multipliers
5. **Trust increases** — Every claim has a source; editorial judgments are labeled

---

## 7. Implementation Order (Activity System Specific)

```
1. extracurricularDatabase.ts - Remove fabricated acceptance rates & multipliers
   ↓ (Highest impact, most harmful claims)

2. comparisonBenchmarksLibrary.ts - Fix selectivity numbers, add verification metadata
   ↓ (Directly cited in teaching output)

3. extracurricularDatabaseExtended.ts - Audit for similar issues
   ↓ (Extended database may have same problems)

4. Rename "Harvard Scale" to "Uplift Rating" in stage3 + synthesis
   ↓ (Lower priority but important for honesty)

5. Add VerificationLevel to BenchmarkEntry type
   ↓ (Infrastructure for ongoing data quality)

6. Validate with test: grep for remaining acceptance_rate/multiplier claims
   ↓ (Ensure completeness)
```

---

*This analysis is focused specifically on the extracurricular/activity workshop system.*
*For the full system analysis including academic advising, see INTEGRITY_ACCURACY_IMPLEMENTATION_PLAN.md*
