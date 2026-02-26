# PLAN: Decomposed Scoring Architecture — Structural Reliability for Activity Scoring

> **Status:** Step 1 COMPLETE ✓ (275/275 tests) — Ready for Step 2
> **Author:** Claude (Technical Lead) + Tue (Product Direction)
> **Created:** 2026-02-25
> **Updated:** 2026-02-26 — Expanded from 4-tier to 6-tier internal classification per Tue's feedback
> **Scope:** Replace the single-pass LLM scoring in `activityScoringService.ts` with a 4-phase decomposed architecture using a 6-tier internal classification system that makes miscalibration structurally impossible.
>
> **Decisions confirmed:**
> - Contextual factors (first-gen, low-income, rural) do NOT change tier — teaching layer acknowledges context, scoring layer doesn't
> - No UI messaging needed for score changes
> - Full build: all 6 steps, each one thorough and perfect
> - 6 internal tiers with 4 external tiers for backward compatibility (50-60 files use 4-tier system; migrate separately)

---

## Problem Statement

The activity scoring system produces unreliable, inflated scores because it asks one LLM call to simultaneously classify, assess tier, score 5 components, compare to benchmarks, and explain all decisions. This entangled judgment creates correlated errors:

1. **Description-to-Tier Anchoring** — A vivid description inflates the tier before evidence is evaluated
2. **Tier-to-Component Coherence Pressure** — Once a tier is assigned, all component scores drift toward it
3. **Batch Cross-Talk** — Activities scored together contaminate each other's calibration
4. **Score Clustering** — LLMs resist extreme scores, compressing everything to 5-7 despite prompt instructions

**Consequence:** A grocery store job (7.6) scores higher than ML research (7.3) for a CS applicant. Students receive wrong priority signals. The entire downstream system (teaching selection, portfolio assessment, competitive positioning) is built on unreliable foundations.

**Why band-aids fail:** Post-hoc validation (catch errors after scoring) can't fix systematic 1-2 point inflation across all activities. Ground truth test suites detect but don't prevent the problem. School-aware positioning changes presentation, not computation.

---

## Architecture: Decomposed Scoring

### Core Principle

**Separate fact extraction from judgment. Make judgment deterministic where possible. Constrain LLM scoring where deterministic rules can't reach.**

```
CURRENT (Entangled — One LLM Call Does Everything):
┌─────────────────────────────────────────────────────────┐
│  LLM Call (Sonnet):                                     │
│  classify + tier + score 5 components + compare + explain│
│  → All decisions contaminate each other                 │
└─────────────────────────────────────────────────────────┘

PROPOSED (Decomposed — Each Phase Does One Thing):
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│ Phase 1      │→ │ Phase 2      │→ │ Phase 3          │→ │ Phase 4      │
│ Extract      │  │ Classify     │  │ Score Components │  │ Calibrate    │
│ Evidence     │  │ Tier         │  │ (Constrained)    │  │ Portfolio    │
│ (Haiku)      │  │ (Code)       │  │ (Sonnet)         │  │ (Code)       │
│ FACTS only   │  │ RULES only   │  │ WITHIN tier band │  │ RELATIVE adj │
└──────────────┘  └──────────────┘  └──────────────────┘  └──────────────┘
```

### Why This Works

| Problem | Current Approach | New Approach |
|---------|-----------------|--------------|
| Tier inflation | LLM decides tier and scores together | Tier locked by rules BEFORE scoring begins |
| Component drift | All scores anchor to tier impression | Components constrained to tier-appropriate ranges |
| Batch contamination | One call scores all activities | Evidence extraction per-activity (no cross-talk on facts), scoring sees locked tiers |
| Score clustering | Prompt says "spread" but LLM ignores | Deterministic calibration FORCES spread |
| Grocery > Research | No relative calibration | Cross-activity rules enforce relative ordering |

---

## Phase-by-Phase Design

### Phase 1: Structured Evidence Extraction

**Purpose:** Extract objective facts from activity descriptions. No judgments, no scores — just structured information retrieval.

**Model:** Haiku (fact extraction is reliable at Haiku quality; Sonnet is unnecessary)
**Cost:** ~$0.005 for 10 activities (batched)
**Latency:** ~1-2 seconds

**Why Haiku is sufficient:** Extracting "does this description mention a national award?" is a factual question. The LLM isn't making subjective assessments. Haiku is highly reliable at information extraction and structured output generation.

#### New File: `scoring/evidenceExtractor.ts`

**Input:** `ActivityScoringInput` (same as current — title, description, role, hours, grades, etc.)

**Output:** `ExtractedEvidence` (new type)

```typescript
/**
 * Structured evidence extracted from activity description and metadata.
 * Contains ONLY facts — no judgments, no scores, no tiers.
 */
export interface ExtractedEvidence {
  /** What scope does this activity operate at? */
  scope: {
    level: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international';
    confidence: number;  // 0-1, how clearly stated
    evidence: string;    // The text that supports this classification
  };

  /** All recognitions/awards mentioned or implied */
  recognitions: Array<{
    name: string;
    level: 'school' | 'local' | 'regional' | 'state' | 'national' | 'international';
    isVerifiable: boolean;  // Is this a known, real award/competition?
    selectivityContext?: string; // "top 500 of 300K" if extractable
  }>;

  /** Role and leadership signals */
  role: {
    title: string;
    type: 'founder' | 'president_captain' | 'executive' | 'team_lead' | 'contributor' | 'participant' | 'member';
    isLeadershipApplicable: boolean;  // false for solo research, individual competitions, etc.
    evidence: string;
  };

  /** Quantified impact */
  impact: {
    hasQuantifiedOutcomes: boolean;
    metrics: Array<{
      value: string;
      unit: string;
      context: string;
      isVerifiable: boolean;
    }>;
    estimatedPeopleReached: number | null;
    tangibleOutcomes: string[];
  };

  /** Commitment signals */
  commitment: {
    yearsActive: number;
    hoursPerWeek: number;
    weeksPerYear: number;
    showsProgression: boolean;
    progressionArc: string | null;  // "member → captain → mentor" if detectable
    sustainedThroughJunior: boolean;
  };

  /** Character and community signals */
  character: {
    primaryTrait: 'service' | 'innovation' | 'resilience' | 'curiosity' | 'empathy' | 'discipline' | 'creativity' | 'integrity';
    communityBenefit: 'significant' | 'moderate' | 'minimal' | 'self-focused';
    authenticitySignals: string[];   // Specific details that suggest genuine engagement
    paddingSignals: string[];        // Red flags suggesting resume inflation
  };

  /** Category match from benchmarks library */
  categoryMatch: {
    category: string;                // Key from BENCHMARKS_BY_CATEGORY
    confidence: 'high' | 'medium' | 'low';
  };

  /** Raw extraction confidence — how much useful signal was in the description */
  overallSignalStrength: 'strong' | 'moderate' | 'weak';
}
```

**Prompt Design (~400 tokens system prompt):**

The prompt is SHORT and focused because fact extraction is a simple task:

```
Extract structured facts from this activity. Do NOT assess quality, assign tiers,
or make value judgments. Only extract what is directly stated or clearly implied.

Rules:
- If a claim seems inflated beyond what the evidence supports, mark isVerifiable: false
- If scope/level is ambiguous, choose the LOWER level and note low confidence
- If no progression arc is described, set progressionArc to null
- Extract ALL recognitions mentioned, even minor ones
- For estimatedPeopleReached, only set if a concrete number is stated or clearly implied
- For commitment fields, use the provided metadata (hours, weeks, grades) as primary source

[Activity data]

Output ONLY the JSON structure specified. No commentary.
```

**Batching:** All activities in one call. Evidence for each activity is independent — no cross-talk by design. The LLM extracts facts for activity 1, then activity 2, etc. There's no judgment that could leak between them.

**Caching:** Evidence is cached per-activity (same SHA-256 hash strategy as current scores). Evidence changes only when the activity input changes. More stable than score caching because facts don't vary between runs.

---

### Phase 2: Deterministic Tier Classification (6-Tier Internal System)

**Purpose:** Map extracted evidence to a tier using explicit, testable rules. No LLM involved.

**Model:** None (pure TypeScript logic)
**Cost:** $0.00
**Latency:** <1ms

#### Why 6 Tiers Instead of 4

The Sara Harberson 4-tier framework was designed as a qualitative admissions heuristic, not a scoring engine. When used as a constraint mechanism, 4 tiers create bands too wide to be meaningful:

| 4-Tier System | Band Width | What's Lumped Together |
|---------------|-----------|----------------------|
| Tier 1: 7.5-10.0 | **2.5 pts** | IMO team member (6/country) + published in undergrad journal |
| Tier 2: 5.0-8.0 | **3.0 pts** | State debate champion + "founded club with 50 members" |
| Tier 3: 2.5-5.5 | **3.0 pts** | Club president with 3yr commitment + NHS member (just GPA) |
| Tier 4: 1.0-3.5 | **2.5 pts** | One-season JV player + science club passive member |

A 3-point band means the system can't reliably distinguish activities that are fundamentally different in quality. The constraint is barely constraining.

The 6-tier system cuts max band width from **3.0 to 1.9** (37% tighter):

| Internal Tier | Name | Score Range | Band | Real-World Analog | Percentile |
|---------------|------|-------------|------|-------------------|------------|
| 1 | Pinnacle | 9.0–10.0 | 1.0 | IMO/IOI team, ISEF Grand Award, D1 blue-chip recruit, NYT-featured founder | Top 0.1% |
| 2 | National | 7.0–8.9 | 1.9 | USAMO qualifier, Regeneron finalist, published peer-reviewed, RSI, All-American | Top 1-2% |
| 3 | State/Regional | 5.5–6.9 | 1.4 | State champion, founded org 100+, All-State selection, multi-year exec with state recognition | Top 5-10% |
| 4 | School Leader | 4.0–5.4 | 1.4 | Club president with initiatives, team captain with progression, meaningful community project | Top 15-25% |
| 5 | Active Participant | 2.5–3.9 | 1.4 | Regular member 2+ years, school award, NHS member, part-time job | Top 30-50% |
| 6 | Developing | 1.0–2.4 | 1.4 | Passive membership, one-time events, resume padding, no commitment arc | Bottom 50% |

**Validated against benchmarks library (200+ entries):**
- USAMO [9,10] → Tier 1 (9.0-10.0) ✓
- AIME top score [7,8] → Tier 2 (7.0-8.9) ✓
- State debate champion [7,8] → Tier 2/3 boundary ✓
- AMC Honor Roll [5,6] → Tier 3 (5.5-6.9) ✓
- Club president [5,6] → Tier 3/4 boundary ✓
- NHS member [3,4] → Tier 5 (2.5-3.9) ✓
- Science club passive [1,3] → Tier 5/6 ✓

#### External Backward Compatibility: 6 Internal → 4 External

The codebase has **50-60 files** that reference `tier: 1|2|3|4`. Changing all of them would balloon this PR's scope and risk. Instead:

**Internal classification** uses 6 tiers for score constraints.
**External output** maps to 4 tiers for the existing `TierAssessmentComponent.tier` field:

```
Internal Tier 1 (Pinnacle)       → External tier: 1
Internal Tier 2 (National)       → External tier: 1
Internal Tier 3 (State/Regional) → External tier: 2
Internal Tier 4 (School Leader)  → External tier: 3
Internal Tier 5 (Participant)    → External tier: 3
Internal Tier 6 (Developing)     → External tier: 4
```

The **score** is the real differentiator. A USAMO qualifier (internal T1, score 9.5) and Regeneron finalist (internal T2, score 8.2) both output external tier 1 — but their scores correctly reflect the 1.3-point quality gap.

**Future PR:** Migrate the rest of the codebase to expose 6 tiers externally.

#### New File: `scoring/tierClassifier.ts`

**Input:** `ExtractedEvidence` + activity category from benchmarks library

**Output:** `TierClassification`

```typescript
/** Internal 6-tier classification (more granular than external 4-tier) */
export type InternalTier = 1 | 2 | 3 | 4 | 5 | 6;

/** External 4-tier for backward compatibility with 50+ files */
export type ExternalTier = 1 | 2 | 3 | 4;

export interface TierClassification {
  /** Internal 6-tier classification (used for score constraints) */
  internalTier: InternalTier;

  /** External 4-tier mapping (for ActivityScore.breakdown.tierAssessment.tier) */
  externalTier: ExternalTier;

  /** How confident we are in this classification */
  confidence: 'high' | 'medium' | 'low';

  /** Which rules triggered this tier */
  signals: TierSignal[];

  /** Valid TOTAL score range — Phase 3 output MUST fall within this band */
  scoreRange: { min: number; max: number };

  /** Per-component score constraints for Phase 3 */
  componentConstraints: {
    recognition: { min: number; max: number };
    leadership: { min: number; max: number };
    community: { min: number; max: number };
    commitment: { min: number; max: number };
  };

  /** The tierAssessment.score (0-10) derived deterministically from tier + signal strength */
  tierScore: number;

  /** Human-readable explanation of why this tier was assigned */
  reasoning: string;
}

export interface TierSignal {
  rule: string;          // e.g., "T1_NATIONAL_RECOGNITION"
  matched: boolean;
  evidence: string;      // What specific evidence triggered/failed this rule
  weight: number;        // 0-1, how strong this signal is
}
```

**Classification Rules (6 Tiers):**

```
TIER 1 — PINNACLE: International/National Elite (<0.1%)
Requires AT LEAST 1 high-confidence verifiable international/national recognition
  OR AT LEAST 2 of these signals:
  [T1-A] Recognition at international/national level, highly selective (<0.5% acceptance)
  [T1-B] Impact with verifiable national/international scope (1000+ people, media coverage)
  [T1-C] Professional-level accomplishment (paid, published in top venue, recruited)
  [T1-D] Matches known Tier 1 benchmark from benchmarks library

TIER 2 — NATIONAL: National-Level Distinction (Top 1-2%)
Requires AT LEAST 2 of these signals:
  [T2-A] National recognition (verifiable, top 2%)
  [T2-B] State-level recognition + additional national-adjacent signals
  [T2-C] Impact reaching 500+ people with verifiable quantified outcomes
  [T2-D] Multi-year executive role + state/national scope
  [T2-E] Matches known Tier 2 benchmark (USAMO, USACO Gold, RSI, peer-reviewed pub)

TIER 3 — STATE/REGIONAL: State/Regional Impact (Top 5-10%)
Requires AT LEAST 2 of these signals:
  [T3-A] State or regional recognition (verifiable awards/selection)
  [T3-B] Founder/executive role with 100+ people served
  [T3-C] State/regional scope with medium+ confidence
  [T3-D] Multi-year commitment (2+) with executive role + clear outcomes
  [T3-E] Matches known state/regional benchmark

TIER 4 — SCHOOL LEADER: Strong School-Level (Top 15-25%)
Requires AT LEAST 2 of these signals:
  [T4-A] Executive/leadership role (president, captain, team_lead)
  [T4-B] Multi-year commitment (2+ years) with progression
  [T4-C] School-level recognition or awards
  [T4-D] Quantified impact (specific numbers, verifiable outcomes)
  [T4-E] Genuine community benefit beyond self

TIER 5 — ACTIVE PARTICIPANT: Committed Participation (Top 30-50%)
Requires AT LEAST 1 of these signals:
  [T5-A] 1+ year regular participation
  [T5-B] Any formal role beyond passive member
  [T5-C] Shows some commitment arc or contribution
  [T5-D] School-level involvement with attendance/hours

TIER 6 — DEVELOPING: Minimal Engagement (Bottom 50%)
Default when no higher tier is met.
Characteristics: passive membership, one-time events, no progression, no impact.
```

**Score Range Constraints (Non-Overlapping):**

```
Tier 1: 9.0 — 10.0   (1.0 band — pinnacle is narrow by definition)
Tier 2: 7.0 — 8.9    (1.9 band — national distinction)
Tier 3: 5.5 — 6.9    (1.4 band — state/regional impact)
Tier 4: 4.0 — 5.4    (1.4 band — school standout)
Tier 5: 2.5 — 3.9    (1.4 band — active participant)
Tier 6: 1.0 — 2.4    (1.4 band — developing)
```

No overlap between tiers. Clean breaks. A Tier 4 activity scores 4.0-5.4, never 5.5+. This is THE structural guarantee that makes miscalibration impossible.

**Per-Component Constraints:**

```
Tier 1 (9.0-10.0):
  recognition  8-10    (international/national evidence required)
  leadership   7-10
  community    6-10
  commitment   7-10

Tier 2 (7.0-8.9):
  recognition  6-9
  leadership   5-9
  community    4-9
  commitment   5-9

Tier 3 (5.5-6.9):
  recognition  3-7
  leadership   3-7
  community    3-8     (character can partially transcend tier)
  commitment   3-8     (sustained effort rewards persistence)

Tier 4 (4.0-5.4):
  recognition  2-5
  leadership   2-5
  community    2-6
  commitment   2-7     (long commitment gets credit even at school level)

Tier 5 (2.5-3.9):
  recognition  1-3
  leadership   1-3
  community    1-5     (even basic activities can show character)
  commitment   1-5

Tier 6 (1.0-2.4):
  recognition  1-2
  leadership   1-2
  community    1-3
  commitment   1-3
```

Community and Commitment have wider ranges because they partially transcend tier — a Tier 4 activity done for 4 years with genuine community benefit deserves credit for those dimensions. Recognition is tightly constrained because it IS the tier definition.

**Tier-to-Score Mapping for tierAssessment.score:**

The `tierAssessment.score` (0-10) is computed deterministically from the internal tier + the strength of matching signals:

```
Tier 1: score 9.5 (2 signals) → 10.0 (3+ signals)
Tier 2: score 7.5 (2 signals) → 8.5 (3+ signals)
Tier 3: score 6.0 (2 signals) → 6.5 (3+ signals)
Tier 4: score 4.5 (2 signals) → 5.0 (3+ signals)
Tier 5: score 3.0 (1 signal)  → 3.5 (2+ signals)
Tier 6: score 1.5 (default)   → 2.0 (has 1 signal)
```

**Benchmark Integration:**

The `matchesBenchmarkTier()` function checks extracted evidence against `comparisonBenchmarksLibrary.ts`. The existing 4-tier benchmarks map to internal 6 tiers:
- Benchmark tier 1 → internal tier 1 or 2 (based on selectivity context)
- Benchmark tier 2 → internal tier 3
- Benchmark tier 3 → internal tier 4 or 5
- Benchmark tier 4 → internal tier 5 or 6

**Edge Cases:**

*Borderline Activities:* When signals span two adjacent tiers (e.g., 1 Tier 3 signal + 2 Tier 4 signals), assign the LOWER tier with `confidence: 'medium'`. The scoring in Phase 3 can push toward the top of that tier's range.

*Contextual Factors (First-Gen, Low-Income, Rural):* Context does NOT change the tier. Founding a school club is Tier 4 (School Leader) regardless of background. Context IS preserved in evidence and passed to Phase 3 for insightful rationales and to the teaching layer for appropriate advice. **The tier measures achievement. The teaching layer honors circumstances.**

*Low Signal Strength:* If `overallSignalStrength === 'weak'` (very sparse description), the classifier relies more heavily on metadata (hours, grades, years) and assigns with `confidence: 'low'`. Phase 3 gets slightly wider component ranges for low-confidence classifications.

---

### Phase 3: Tier-Constrained Component Scoring

**Purpose:** Score the 5 activity components with nuanced LLM judgment, CONSTRAINED by the tier from Phase 2.

**Model:** Sonnet (quality matters for nuanced component assessment and educational rationales)
**Cost:** ~$0.015 for 10 activities (shorter prompt — no tier rubric needed)
**Latency:** ~3-5 seconds (batch)

#### Modified File: `scoring/activityScoringService.ts`

**What changes:**
1. The service receives `ExtractedEvidence` + `TierClassification` alongside activity data
2. The system prompt is ~40% shorter (entire tier assessment rubric removed — tier is decided)
3. The user prompt includes the locked tier, extracted evidence summary, and valid score ranges
4. Post-processing clamps any out-of-range scores to the tier's constraints
5. The `tierAssessment` component is populated deterministically from Phase 2 (not scored by LLM)
6. `ActivityScore` output type is **UNCHANGED** — all consumers see the same interface

**New System Prompt (shorter, more focused):**

The prompt drops the tier classification section (~40% of current prompt) and adds constraint awareness:

```
You are an expert college admissions officer scoring activity components.

The activity's tier has ALREADY been classified based on structured evidence.
Your task is ONLY to score the individual components within the specified ranges.
Do NOT reassess the tier. Do NOT suggest a different tier.

Score how strong this activity is WITHIN its tier:
- Top of range = exceptional example of this tier level
- Bottom of range = barely qualifies for this tier level

Your rationales must be SPECIFIC, INSIGHTFUL, and EDUCATIONAL.
[Same rationale quality instructions as current]

COMPONENTS TO SCORE:
1. Recognition Level (weight: 25%)
   [Same rubric as current]

2. Leadership & Impact (weight: 12.5% when applicable)
   [Same conditional rubric as current]

3. Community & Character (weight: 15%)
   [Same rubric as current]

4. Commitment & Progression (weight: 17.5%)
   [Same rubric as current]

OUTPUT FORMAT: [Same JSON structure minus the tierAssessment — that's pre-filled]
```

**New User Prompt (includes constraints):**

```
Activity: {title}
Position: {role}
Description: "{description}"
[other metadata]

CLASSIFICATION (LOCKED — do not reassess):
  Tier: {tier} — {tierName}
  Reason: {tierClassification.reasoning}
  Key Evidence: {scope.level} scope, {recognitions.length} recognitions, {role.type} role

VALID SCORE RANGES FOR TIER {tier}:
  Recognition: {min}-{max}
  Leadership: {min}-{max} (or N/A if not applicable)
  Community & Character: {min}-{max}
  Commitment & Progression: {min}-{max}

[Relevant benchmarks for this category from library]

Score each component within these ranges. Provide insightful rationales.
```

**Post-Processing (deterministic clamping):**

After the LLM returns scores:

1. Clamp each component score to its tier-appropriate range
2. Set `tierAssessment.score` from Phase 2's `tierScore` (not from LLM)
3. Set `tierAssessment.tier` from Phase 2's `tier`
4. Recalculate `weightedScore` for each component from clamped values
5. Recalculate `total` from all weighted scores
6. Clamp `total` to tier's `scoreRange.min`—`scoreRange.max`
7. Populate `comparisonBenchmarks` from the benchmarks library (deterministic, not LLM)

The `normalizeScoreData()` method is refactored to include clamping logic. If the LLM respects the constraints (which it should with explicit ranges in the prompt), clamping is a no-op safety net. If it drifts, clamping silently corrects.

---

### Phase 4: Cross-Activity Portfolio Calibration

**Purpose:** Enforce relative ordering, spread, and consistency across the entire portfolio. No LLM.

**Model:** None (pure TypeScript logic)
**Cost:** $0.00
**Latency:** <1ms

#### New File: `scoring/portfolioCalibrator.ts`

**Input:** All `ActivityScore[]` + `ExtractedEvidence[]` + student context (intended major, etc.)

**Output:** Calibrated `ActivityScore[]` (same type — adjusted scores where rules require)

**Calibration Rules:**

**Rule 1: RELATIVE ORDERING ENFORCEMENT**

Activities with higher-tier evidence MUST score higher. Within the same tier, activities with stronger signals score higher.

```
This catches: "Grocery store (7.6) scored higher than ML Research (7.3) for CS major"

Algorithm:
1. Sort activities by tier (ascending), then by signal count within tier
2. Walk the sorted list. If activity[i].total > activity[i+1].total but
   activity[i+1] has a better tier, adjust:
   - Push activity[i].total DOWN within its tier range
   - Push activity[i+1].total UP within its tier range
   - Maintain minimum gap of 0.3 between adjacent tiers

Special case for major relevance:
  When intended major is specified, activities directly relevant to that major
  get priority in relative ordering within the same tier.
  For CS major: research > work experience within Tier 2
```

**Rule 2: MINIMUM SPREAD ENFORCEMENT**

If all activity scores are within ±1.0 of each other, force spread to at least ±2.0 while preserving relative ordering.

```
Algorithm:
1. Compute range = max(scores) - min(scores)
2. If range < 2.0 AND activities.length >= 3:
   - Find the median score
   - Scale scores outward from median
   - Activities above median push toward their tier max
   - Activities below median push toward their tier min
   - Clamp all to tier ranges
   - Preserve relative ordering
```

**Rule 3: EVIDENCE CONSISTENCY ENFORCEMENT**

Hard invariants that must hold regardless of LLM output:

```
- 3+ years commitment → commitment score >= 5
- Founder role → leadership score >= 5 (when applicable)
- Recognition = 'none' → recognition score <= 3
- Recognition = 'national'/'international' → recognition score >= 7
- communityBenefit = 'self-focused' → community score <= 4
- communityBenefit = 'significant' → community score >= 5
- authenticitySignal = 'resume_padding' → community score <= 3
- showsProgression = true AND years >= 3 → commitment score >= 6
```

These are HARD rules that override LLM output. They ensure internal consistency between the extracted evidence and the component scores.

**Rule 4: MAJOR-RELEVANCE ANNOTATION**

Annotate each activity with a relevance signal for portfolio scoring (downstream):

```
For each activity:
  majorRelevance: 'core' | 'supporting' | 'unrelated'
  relevanceRationale: string

This does NOT change individual scores. It provides metadata that
portfolioScoringService can use for spike detection and major alignment scoring.
```

---

## Integration Design

### File Changes Summary

| File | Action | Risk | Lines Changed (est.) |
|------|--------|------|---------------------|
| `scoring/evidenceExtractor.ts` | **NEW** | Low | ~300 |
| `scoring/tierClassifier.ts` | **NEW** | Low | ~350 |
| `scoring/portfolioCalibrator.ts` | **NEW** | Low | ~250 |
| `scoring/types.ts` | **ADD** types | Low | ~80 |
| `scoring/activityScoringService.ts` | **MODIFY** prompt + add clamping | Medium | ~200 |
| `scoring/scoringOrchestrator.ts` | **MODIFY** wire phases | Medium | ~100 |
| `scoring/comparisonBenchmarksLibrary.ts` | **EXPORT** category data | Low | ~10 |
| `scoring/scoringCacheService.ts` | **ADD** evidence caching | Low | ~40 |
| `scoring/descriptionScoringService.ts` | **NO CHANGE** | — | 0 |
| `scoring/portfolioScoringService.ts` | **NO CHANGE** | — | 0 |
| `scoring/activityTeachingLayerService.ts` | **NO CHANGE** | — | 0 |
| `scoring/teachingLayerTypes.ts` | **NO CHANGE** | — | 0 |
| `stage1ContextAwareAnalysisService.ts` | **NO CHANGE** | — | 0 |
| `stage2ConditionalTeachingService.ts` | **NO CHANGE** | — | 0 |

### Type Contract Guarantee

**All existing types are preserved exactly.** The new architecture produces the same `ActivityScore`, `ActivityScoreBreakdown`, `TierAssessmentComponent`, `RecognitionComponent`, `LeadershipComponent`, `CommunityCharacterComponent`, `CommitmentComponent`, `ComparisonBenchmarks`, and `ActivityScoreRubric` interfaces.

New types (`ExtractedEvidence`, `TierClassification`, `TierSignal`) are internal to the scoring layer. No downstream consumer needs to know about them. They are exported only for testing.

### Orchestrator Flow Change

```typescript
// CURRENT scoringOrchestrator.ts flow:
// 1. Description batch (Sonnet)  ─┐ PARALLEL
// 2. Activity batch (Sonnet)     ─┘
// 3. Portfolio scoring (Sonnet)
// 4. Teaching layer (Sonnet, optional)

// NEW scoringOrchestrator.ts flow:
// 1.  Description batch (Sonnet)       ─┐ PARALLEL
// 2a. Evidence extraction (Haiku)       ─┘ PARALLEL with descriptions
// 2b. Tier classification (Code)           SEQUENTIAL after 2a (~0ms)
// 2c. Constrained scoring (Sonnet)         SEQUENTIAL after 2b
// 2d. Portfolio calibration (Code)         SEQUENTIAL after 2c (~0ms)
// 3.  Portfolio scoring (Sonnet)
// 4.  Teaching layer (Sonnet, optional)
```

**Latency impact:** Evidence extraction (Haiku, ~1-2s) runs in PARALLEL with description scoring (Sonnet, ~3-5s). Since Haiku finishes first, phases 2b-2d add ~0ms to total latency. The constrained Sonnet scoring call (Phase 2c) replaces the current Sonnet scoring call at similar latency. **Net latency change: ~0 seconds.**

### Caching Strategy

**Evidence caching (new):**
- Key: SHA-256 of `ActivityScoringInput` (same hash as current)
- Value: `ExtractedEvidence`
- More stable than score caching — evidence changes only when input changes
- If evidence is cached, Phase 1 is skipped for that activity

**Tier classification caching:**
- Not needed — deterministic function of evidence. If evidence is cached, tier is computed instantly.

**Score caching (adapted):**
- Key: SHA-256 of `ActivityScoringInput` (same as current)
- Value: `ActivityScore` (after Phase 3 + Phase 4)
- If evidence unchanged AND no new/removed activities (no calibration change), cached score is valid
- If a NEW activity is added to the portfolio, ALL scores get Phase 4 re-calibration even if individually cached (portfolio composition changed)

**Cache invalidation on architecture version:**
- Add `scoringArchitectureVersion` field to cache entries
- Increment when deploying this change → all existing caches invalidated on first use

---

## Cost Analysis

| Phase | Model | Cost (10 activities, first run) | Cost (1 changed, 9 cached) |
|-------|-------|---------------------------------|---------------------------|
| Evidence Extraction | Haiku | ~$0.005 | ~$0.0005 |
| Tier Classification | Code | $0.000 | $0.000 |
| Constrained Scoring | Sonnet | ~$0.015 | ~$0.003 |
| Portfolio Calibration | Code | $0.000 | $0.000 |
| **Activity scoring total** | | **~$0.020** | **~$0.0035** |
| Description scoring (unchanged) | Sonnet | ~$0.020 | ~$0.002 |
| Portfolio scoring (unchanged) | Sonnet | ~$0.030 | ~$0.030 |
| **Pipeline total** | | **~$0.070** | **~$0.036** |

**Current pipeline cost:** ~$0.070 first run, ~$0.035 with caching
**New pipeline cost:** ~$0.070 first run, ~$0.036 with caching

**Net cost impact: ~$0.00 (cost neutral)**

The Haiku evidence extraction call adds ~$0.005, but the Sonnet scoring prompt is ~40% shorter (no tier rubric, no tier calibration examples, no score spread instructions). The shorter prompt saves ~$0.005 on Sonnet tokens. Net zero.

---

## Testing Strategy

### Tier 1: Unit Tests (deterministic, no API calls, $0.00)

#### `tests/test-tier-classification.ts` — ~150 cases

Built directly from the benchmarks library. Every benchmark entry becomes a test case:

```typescript
// Auto-generated from BENCHMARKS_BY_CATEGORY
// For each category (13) × each tier (4) × each benchmark (3-5) = ~150+ cases

// Example test cases:
{ id: 'usamo-qualifier',      expectedTier: 1, category: 'stem_competition',
  evidence: { scope: 'national', recognitions: [{ name: 'USAMO', level: 'national', isVerifiable: true }] } },

{ id: 'school-cs-club-founder', expectedTier: 3, category: 'technology',
  evidence: { scope: 'school', role: { type: 'founder' }, commitment: { yearsActive: 2 } } },

{ id: 'grocery-cashier',       expectedTier: 3, category: 'work_family',
  evidence: { scope: 'local', role: { type: 'team_lead' }, commitment: { yearsActive: 1, showsProgression: true } } },

{ id: 'ml-research-coauthor',  expectedTier: 2, category: 'stem_research',
  evidence: { scope: 'regional', recognitions: [{ name: 'co-authored paper', level: 'regional' }], role: { type: 'contributor' } } },
```

**Assertion:** Every benchmark must classify to its documented tier. 150/150 or investigation needed.

#### `tests/test-score-constraints.ts` — ~50 cases

```
- Tier 3 activity total cannot exceed 5.5
- Tier 1 activity total cannot go below 7.5
- Recognition='none' forces recognition score <= 3
- 3+ years commitment forces commitment score >= 5
- Founder forces leadership score >= 5 (when applicable)
- All components stay within per-tier per-component ranges
- Weighted total equals sum of weighted components
```

#### `tests/test-portfolio-calibration.ts` — ~30 cases

```
- Research activity scores higher than grocery for CS major
- Minimum spread >= 2.0 when all scores cluster
- Relative ordering preserved after calibration
- Calibration doesn't push any score outside its tier range
- Adding/removing an activity triggers re-calibration
- Major relevance annotation is correct for known major/activity pairs
```

### Tier 2: Integration Tests (API calls, ~$0.10 total)

#### `tests/test-evidence-extraction.ts` — ~20 activities

Run evidence extraction against known activities and verify:
- All fields populated with correct types
- Scope correctly identified for unambiguous cases
- Known awards (USAMO, ISEF, Regeneron) marked as verifiable
- Role type matches expected classification
- Commitment fields match input metadata

#### `tests/test-constrained-scoring.ts` — ~10 activities

Run Phase 3 (constrained scoring) with known tiers and verify:
- All scores fall within specified ranges
- Rationales reference the tier context
- LLM respects the "do not reassess tier" instruction
- Post-processing clamping fires on <5% of components (meaning LLM mostly complies)

### Tier 3: End-to-End Calibration Tests (API calls, ~$0.20 total)

#### `tests/test-scoring-calibration-e2e.ts` — ~5 full portfolios

The ORIGINAL problem cases as regression tests:

```typescript
const CALIBRATION_PORTFOLIOS = [
  {
    name: 'CS Applicant — Research vs Retail',
    intendedMajor: 'Computer Science',
    activities: [
      { title: 'ML Research Assistant', ... },      // Expected: Tier 2, score ~5.5-7.5
      { title: 'Grocery Store Cashier', ... },       // Expected: Tier 3, score ~3.0-5.0
    ],
    assertions: [
      'ML Research MUST score higher than Grocery',
      'Score gap MUST be >= 1.5 points',
    ],
  },
  {
    name: 'STEM Standout — National vs School',
    activities: [
      { title: 'USAMO Qualifier', ... },             // Expected: Tier 1, score >= 9.0
      { title: 'CS Club President', ... },           // Expected: Tier 3, score ~4.0-5.5
    ],
    assertions: [
      'USAMO MUST be Tier 1',
      'CS Club MUST be Tier 3 (not Tier 2)',
      'Score gap MUST be >= 4.0 points',
    ],
  },
  {
    name: 'Clustered Portfolio — Force Spread',
    activities: [
      /* 5 school-level activities with similar descriptions */
    ],
    assertions: [
      'Score spread >= 2.0 points across the 5 activities',
      'All activities classified as Tier 3 or Tier 4',
      'No score above 5.5',
    ],
  },
  {
    name: 'Context Awareness — First-Gen Founder',
    activities: [
      { title: 'Founded School CS Club', context: 'first-gen, no STEM clubs at school', ... },
    ],
    assertions: [
      'Tier MUST be 3 (school-level founding, no regional+ recognition)',
      'Tier is NOT inflated to 2 despite first-gen context',
      'Rationale acknowledges first-gen context as meaningful',
    ],
  },
  {
    name: 'Mixed Portfolio — Full Range',
    intendedMajor: 'Biology',
    activities: [
      { title: 'Published Research (Nature Methods)', ... },  // Tier 1
      { title: 'Hospital Volunteer (200+ hours)', ... },       // Tier 2
      { title: 'Biology Club President', ... },                // Tier 3
      { title: 'Soccer Team Member', ... },                    // Tier 4
    ],
    assertions: [
      'Scores span at least 6 points (e.g., 3.0 to 9.0)',
      'Strict descending order: Research > Hospital > Bio Club > Soccer',
      'Research scores >= 8.0',
      'Soccer scores <= 3.5',
    ],
  },
];
```

---

## Implementation Order

### Step 1: Types + Tier Classifier (pure code, no API dependency)

**Files:** `scoring/types.ts` (add new types), `scoring/tierClassifier.ts`, `tests/test-tier-classification.ts`

**What to build:**
- `ExtractedEvidence` and `TierClassification` types in types.ts
- `classifyTier()` function with all tier rules
- `matchesBenchmarkTier()` helper that uses comparisonBenchmarksLibrary
- Tier score mapping logic
- Component constraint tables
- ~150 unit tests from benchmarks library

**Verification:** `npx tsx tests/test-tier-classification.ts` — must pass 150/150
**Dependencies:** None (pure code)
**Risk:** Low

### Step 2: Evidence Extractor (Haiku API calls)

**Files:** `scoring/evidenceExtractor.ts`, `tests/test-evidence-extraction.ts`

**What to build:**
- `extractEvidence()` for single activity
- `extractEvidenceBatch()` for batched extraction
- Haiku prompt (short, focused on fact extraction)
- Response parsing with same `tryParseClaudeJSON` pattern
- ~20 integration test cases

**Verification:** `npx tsx tests/test-evidence-extraction.ts` — verify evidence quality
**Dependencies:** Step 1 (uses ExtractedEvidence type)
**Risk:** Low-Medium (Haiku extraction needs prompt tuning)

### Step 3: Portfolio Calibrator (pure code)

**Files:** `scoring/portfolioCalibrator.ts`, `tests/test-portfolio-calibration.ts`

**What to build:**
- `calibratePortfolio()` main function
- `enforceRelativeOrdering()` with major-relevance awareness
- `enforceMinimumSpread()` with tier-range clamping
- `enforceEvidenceConsistency()` hard invariant checks
- `annotateMajorRelevance()` for downstream consumption
- ~30 unit tests

**Verification:** `npx tsx tests/test-portfolio-calibration.ts` — must pass all cases
**Dependencies:** Step 1 (uses types)
**Risk:** Low

### Step 4: Modify Activity Scoring Service (Sonnet prompt change)

**Files:** `scoring/activityScoringService.ts`, `tests/test-constrained-scoring.ts`

**What to build:**
- New system prompt (shorter, drops tier rubric)
- New user prompt builder (includes tier + constraints)
- Post-processing clamping in `normalizeScoreData()`
- Tier assessment populated from Phase 2 (not LLM)
- ~10 integration test cases

**Verification:** `npx tsx tests/test-constrained-scoring.ts` — verify scores within ranges
**Dependencies:** Steps 1-2 (uses evidence + tier classification)
**Risk:** Medium (prompt change affects LLM output quality)

### Step 5: Modify Scoring Orchestrator (wire everything together)

**Files:** `scoring/scoringOrchestrator.ts`, `scoring/scoringCacheService.ts`

**What to build:**
- Wire Phase 1 (evidence) in parallel with description scoring
- Wire Phase 2 (tier classification) after evidence extraction
- Pass tier + evidence to Phase 3 (modified scoring service)
- Wire Phase 4 (calibration) after scoring, before portfolio scoring
- Add evidence caching to cache service
- Add architecture version to cache entries

**Verification:** Full pipeline test with console output showing all phases
**Dependencies:** Steps 1-4 (all components)
**Risk:** Medium (integration point — must not break downstream)

### Step 6: E2E Calibration Validation

**Files:** `tests/test-scoring-calibration-e2e.ts`

**What to build:**
- 5 calibration portfolios with known-correct expectations
- Assertion framework for relative ordering, spread, and range compliance
- Cost tracking to verify budget is within tolerance

**Verification:** `npx tsx tests/test-scoring-calibration-e2e.ts` — all 5 portfolios pass
**Dependencies:** Step 5 (complete pipeline)
**Risk:** Low (testing only)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Evidence extraction misses key facts | Medium | Medium | Prompt includes explicit field checklist; low-confidence extractions trigger fallback to single-pass scoring for that activity |
| Tier rules too rigid for edge cases | Medium | Medium | `confidence: 'medium'` for borderline cases expands score ranges; rules are easily adjustable per-category |
| Constrained prompt confuses Sonnet | Low | Medium | Temperature 0.15 keeps scoring grounded; explicit ranges reduce ambiguity; fallback to unconstrained if parsing fails |
| Score ranges too narrow | Low | High | Ranges have intentional tier overlap; community + commitment have extra-wide ranges; tunable constants |
| Students see lower scores (correct but surprising) | Medium | Medium | Scores ARE more accurate. Consider UI messaging about methodology. Teaching layer emphasizes improvement path, not raw number |
| Cache invalidation on deploy | Low | Low | Version field in cache entries; auto-invalidated on architecture version change |
| Latency increase | Low | Low | Evidence extraction runs parallel with descriptions; net latency change ~0s |

**Fallback plan:** If evidence extraction fails for any activity (Haiku timeout, parsing failure), fall back to the current single-pass scoring for THAT activity only. The orchestrator degrades gracefully per-activity, not per-portfolio. This means the new architecture can never be WORSE than current — at worst, individual activities fall back to the old behavior.

---

## Success Criteria

| Criterion | Current | Target | How Measured |
|-----------|---------|--------|-------------|
| Tier 3 max score | Unbounded (seen 8.0+) | <= 5.5 | Code constraint |
| Tier 4 max score | Unbounded (seen 6.0+) | <= 3.5 | Code constraint |
| Research > Grocery (CS major) | Fails ~40% of runs | 100% of runs | E2E calibration test |
| Score spread (5+ activities) | Often < 1.5 points | >= 2.0 points | Calibration rule |
| Tier classification unit tests | N/A (no deterministic tier) | 150/150 pass | Unit test suite |
| Run-to-run variance (same input) | ~1.5-2.0 points | < 0.5 points | Repeated test runs |
| Cost per scoring run | ~$0.020 | <= $0.025 | Token tracking |
| Type contract changes | — | Zero | Compile-time verification |
| Downstream consumer changes | — | Zero | No file changes in consumers |

---

## What This Plan Does NOT Change

- **Description scoring** — Independent service, runs in parallel, untouched
- **Portfolio scoring** — Receives same `ActivityWithScores[]` type, untouched
- **Teaching layer** — Receives same `PortfolioScoreRubric`, untouched
- **Stage 0/1/2/3 pipeline** — Calls same `scoringOrchestrator.scorePortfolio()` interface
- **Frontend** — Receives same types through same API
- **Cache interface** — Same session ID strategy (evidence caching added internally)
- **Story context flow** — Story detection is separate from scoring, confirmed by code inspection
- **Weight system** — Same 30/25/12.5/15/17.5 weights with same redistribution logic

---

## Decision Points for Tue

1. **Tier score ranges** — Are the proposed ranges right? Tier 2 max at 8.0 means a strong Tier 2 tops at 8.0 while a borderline Tier 1 floors at 7.5. This creates a deliberate "prove you're Tier 1" gap. Too strict or appropriate?

2. **Contextual factors** — Confirmed: first-gen/low-income/rural context does NOT change tier. A school club founding is Tier 3 regardless. The teaching layer acknowledges context, the scoring layer doesn't. This is a firm design decision. Agree?

3. **Score presentation** — Students currently getting inflated scores (grocery at 7.6) will see lower, more accurate scores. This is correct behavior but may surprise users. Should we:
   - Add scoring methodology explanation to the UI?
   - Show tier name (e.g., "Competitive — School/Local Leadership") more prominently than raw score?
   - Add a "what this score means" tooltip/section?

4. **Implementation scope** — Options:
   - **Full build (Steps 1-6):** Complete architecture in one push. ~1,200 lines new code + ~200 lines modified.
   - **Deterministic first (Steps 1, 3, 6):** Build tier classifier + calibrator, test against current scores to validate rules, THEN add evidence extraction + prompt changes. Lower risk, two iterations.

5. **Tier overlap zones** — Tier 2 max (8.0) overlaps with Tier 1 min (7.5). Should this overlap exist? Arguments for: allows strong Tier 2 activities to be recognized. Arguments against: muddies the tier boundary. Current plan: keep overlap, it reflects reality.
