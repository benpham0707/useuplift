# Comprehensive Integrity & Accuracy Audit

## Extracurricular Activity System — Data + Architecture

**Purpose**: Complete audit of both the DATA (what we claim) and the ARCHITECTURE (how claims reach users). This document covers every layer where unreliable information could enter the pipeline and reach a student.

---

## Table of Contents

1. [Audit Scope & Methodology](#1-audit-scope--methodology)
2. [Layer 1: Data Integrity — What We Claim](#2-layer-1-data-integrity)
3. [Layer 2: Knowledge Assembly — How Claims Get Packaged](#3-layer-2-knowledge-assembly)
4. [Layer 3: Prompt Construction — What We Tell the LLM](#4-layer-3-prompt-construction)
5. [Layer 4: LLM Generation — What the LLM Produces](#5-layer-4-llm-generation)
6. [Layer 5: Output Validation — What We Check](#6-layer-5-output-validation)
7. [Layer 6: Scoring Calibration — Consistency & Drift](#7-layer-6-scoring-calibration)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)
9. [Complete Issue Registry](#9-complete-issue-registry)
10. [Implementation Priorities](#10-implementation-priorities)

---

## 1. Audit Scope & Methodology

### Files Audited

| Category | Files | Lines Reviewed |
|----------|-------|---------------|
| Knowledge Bases | extracurricularDatabase.ts, extracurricularDatabaseExtended.ts, contextAdjustmentDatabase.ts, academicDatabase.ts, schoolValueDatabase.ts, majorActivityAlignment.ts, impactMetricsFramework.ts, spikeDetectionSystem.ts | ~8,000 |
| Scoring Pipeline | activityScoringService.ts, descriptionScoringService.ts, scoringOrchestrator.ts, comparisonBenchmarksLibrary.ts, types.ts | ~3,500 |
| Teaching Pipeline | stage1ContextAwareAnalysisService.ts, stage2ConditionalTeachingService.ts, activityTeachingService.ts, knowledgeAssemblyService.ts | ~5,000 |
| Expert Knowledge | expertCounselorKnowledgeBase.ts, expertSystemPrompts.ts, activityCitationService.ts | ~4,000 |
| Synthesis | stage3PortfolioSynthesisService.ts, holisticSynthesizer.ts, schoolFitEngine.ts | ~2,000 |

### Audit Criteria

Each finding is classified by:
- **Risk Level**: CRITICAL / HIGH / MEDIUM / LOW
- **Category**: Data Accuracy / Architecture / Output Validation / User Safety
- **User Impact**: What could a student experience as a result?

---

## 2. Layer 1: Data Integrity

### What we claim vs. what's actually true

### 2A. FABRICATED ADMISSION ACCEPTANCE RATES [CRITICAL]

**File**: `knowledge/extracurricularDatabase.ts`

The database contains specific admission acceptance rate claims presented as data, with NO cited sources:

| Claim | Line | What It Says | Evidence? |
|-------|------|-------------|-----------|
| STS 1st place acceptance | 388 | `acceptance_rate: 0.95` (95%) | NONE — fabricated |
| STS top 10 acceptance | 395 | `acceptance_rate: 0.89` (89%) | NONE — fabricated |
| STS finalist acceptance | 402 | `acceptance_rate: 0.85` (85%) | NONE — fabricated |
| MOP MIT acceptance | 121 | `mit_acceptance_estimate: 0.70` (70%) | NONE — fabricated |
| IMO gold acceptance | 134 | `acceptance: 0.90` (90%) | NONE — fabricated |
| IMO silver acceptance | 135 | `acceptance: 0.80` (80%) | NONE — fabricated |
| Recruited athlete acceptance | 657 | `recruited_acceptance_rate: 0.86` | Claims "Harvard data" — unverified |
| ISEF best-of-category | 427 | `acceptance_rate: 0.85` | NONE — fabricated |
| RSI acceptance rate | 468 | `acceptance_rate: 0.03` | Plausible but unverified |

**Admission Impact Multipliers** (lines 906-937):
```
near_guarantee:  multiplier: 18  (claims 18x baseline)
exceptional:     multiplier: 12  (claims 12x baseline)
very_strong:     multiplier: 6   (claims 6x baseline)
strong:          multiplier: 3   (claims 3x baseline)
significant:     multiplier: 2   (claims 2x baseline)
notable:         multiplier: 1.5 (claims 1.5x baseline)
```

**User Impact**: When our teaching output says "USAMO qualifiers have approximately a 50% acceptance rate at MIT," a student or parent may repeat this to their school counselor and be immediately discredited. This undermines trust in ALL our advice.

### 2B. INACCURATE SELECTIVITY NUMBERS [HIGH]

**File**: `scoring/comparisonBenchmarksLibrary.ts`

| Current Claim | Actual Data | Source |
|---------------|-------------|--------|
| USAMO: "Top ~500 out of 300,000+" (line 52) | ~250 qualifiers from ~100,000 AMC takers | MAA official |
| STS: "40 finalists from ~1,900 applicants" (line 54) | 40 from ~2,500 entrants | Society for Science |
| RSI: "80 selected from 3,000+ globally; 2.7% acceptance" (line 86) | ~80 from ~3,500 applicants | RSI/MIT |
| ISEF: "~1,800 finalists from 80+ countries" (line 55) | 1,800 from 7M+ feeder participants | Society for Science |
| All-National: "~600 selected from 1M+" (line 143) | Verify — number may be accurate | NAfME |

**File**: `knowledgeAssemblyService.ts`
| Current Claim | Status |
|---------------|--------|
| "USAMO qualifier (~270 students nationally)" (line 245) | Close — actual ~250, needs verification |
| "Intel/Regeneron STS Finalist (40 from 2,000 applicants)" (line 246) | WRONG — 2,500 entrants, not 2,000 |
| "National Youth Orchestra member (<1% acceptance)" (line 249) | UNVERIFIED |
| "Founded nonprofit serving 15,000+ students annually" as Tier 1 threshold (line 248) | EDITORIAL — presented as Sara Harberson criteria |

### 2C. FABRICATED CONTEXT ADJUSTMENT MULTIPLIERS [CRITICAL]

**File**: `knowledge/contextAdjustmentDatabase.ts`

| Factor | Claimed Boost | Evidence? |
|--------|--------------|-----------|
| Low-income | `admission_boost: 1.8` (80% boost) | NONE — fabricated |
| First-gen | `admission_boost: 1.6` (60% boost) | NONE — fabricated |
| Rural | `admission_boost: 1.3` (30% boost) | NONE — fabricated |
| Race-based factors | Various multipliers | Post-SFFA: legally problematic |

**Compounding issue**: Applied multiplicatively → 1.8 × 1.6 = 2.88x (absurd)

**NOTE**: The activity workshop pipeline does NOT directly import these multipliers. It passes context flags (`firstGen: true`) to the LLM for qualitative interpretation. However, the `holisticSynthesizer.ts` and `schoolFitEngine.ts` DO use numeric context boosts at the portfolio level.

### 2D. UNVERIFIED "EXPERT" CLAIMS [HIGH]

**File**: `expertCounselorKnowledgeBase.ts`

| Claim | Line | Status |
|-------|------|--------|
| "AOs allocate 8-12 minutes per first read" | 36-42 | No source — could be 4 min or 15 min |
| "72% of admitted held leadership; 23% with measurable impact" | 825 | Claims "MIT admissions data" — no year, no link |
| "MIT research shows specific descriptions 2.4x more memorable" | expertSystemPrompts.ts:158 | No source — likely fabricated |
| Quotes from "Former Yale AO", "Former MIT Senior Interviewer" | Multiple | No names, no dates, not verifiable |
| Sara Harberson tier system attribution | 14 | No link to her published work |

---

## 3. Layer 2: Knowledge Assembly

### How claims get packaged before reaching the LLM

**File**: `knowledgeAssemblyService.ts`

### 3A. CITATION SERVICE HARDCODES INSTEAD OF LOOKING UP [MEDIUM]

The `activityCitationService.ts` claims to cite from `extracurricularDatabase` but actually hardcodes statistics inline:

```typescript
// Line 119: Claims to cite database but hardcodes the number
evidence: {
  statistic: 'USAMO qualifiers: ~270 students nationally from ~7,000 AIME takers',
  benchmark: 'Top 0.01% of high school math students',
},
source: {
  database: 'extracurricularDatabase', // Claims to reference this
  // But never actually looks up the database value
}
```

**Risk**: If we fix the database, the citation service still outputs the old number. No single source of truth.

### 3B. NO DATA FRESHNESS TRACKING [MEDIUM]

- All statistics are hardcoded with no `lastUpdated` dates
- Competition participation numbers change yearly
- A student in 2027 could be evaluated against 2024 statistics
- No mechanism to flag or update stale data

### 3C. KNOWLEDGE IS INJECTED WITHOUT VERIFICATION METADATA [HIGH]

When knowledge gets formatted for the LLM prompt (lines 1181-1316), everything looks the same:
- A College Board official statistic
- An editorial opinion about what MIT values
- A fabricated acceptance rate
- A quote from an unnamed "Former AO"

The LLM has no way to distinguish reliable from unreliable input, so it treats all knowledge with equal confidence.

---

## 4. Layer 3: Prompt Construction

### What we tell the LLM to do and be

### 4A. EXPERT IMPERSONATION [CRITICAL]

**File**: `expertSystemPrompts.ts:34`

```
"You are a world-class college admissions expert with 20 years of
experience reading applications at the most selective schools...
You have personally reviewed 50,000+ applications and have sat on
admissions committees at Harvard, MIT, and Stanford."
```

And line 137:
```
"You don't guess what admissions officers think — you KNOW.
You've sat in those rooms. You've heard the discussions."
```

**Issue**: This is factually false. Claude is an AI, not a human expert. This framing:
1. Makes Claude generate advice with unearned confidence
2. Users who learn it's AI may lose trust in all advice
3. There's no disclosure anywhere that advice is AI-generated

### 4B. INSTRUCTIONS TO CITE UNVERIFIED RESEARCH [HIGH]

**File**: `expertSystemPrompts.ts:158`

```
"GOOD education: MIT research shows that specific descriptions
are rated 2.4x more memorable by admissions readers."
```

And:
```
"ALWAYS cite research or insider knowledge. Don't say 'this is
important.' Say 'MIT AOs specifically look for this because...'"
```

**Issue**: The system tells Claude to cite research that may not exist, teaching it to present editorial opinions as research-backed claims.

### 4C. SCHOOL-SPECIFIC CLAIMS WITHOUT EVIDENCE [HIGH]

**File**: `expertCounselorKnowledgeBase.ts:269-421`

The system tells Claude as definitive fact:
- "MIT values: technical depth and genuine building"
- "Harvard values: leadership that creates tangible community impact"
- "Stanford values: intellectual vitality and genuine passion"

These are reasonable inferences from official statements but are presented as insider knowledge ("What Different Schools *Actually* Value"), not as editorial interpretation.

### 4D. FALSE PRECISION IN CONSTRAINT ADJUSTMENTS [MEDIUM]

**File**: `expertCounselorKnowledgeBase.ts:142-256`

```typescript
Level 2: tierAdjustment: 0.5
Level 3: tierAdjustment: 1
Level 4: tierAdjustment: 1.5
```

These numeric tier adjustments are entirely invented. Telling the LLM "a Tier 3 under Level 3 constraints equals Tier 2" presents editorial judgment as calibrated measurement.

---

## 5. Layer 4: LLM Generation

### What the LLM can do wrong, even with good inputs

### 5A. HALLUCINATION BEYOND INJECTED KNOWLEDGE [HIGH]

The LLM receives knowledge via prompt injection but nothing prevents it from:
- Inventing statistics not in the knowledge base
- Fabricating quotes or attributing claims to unnamed sources
- Extrapolating from injected patterns to create new "rules"
- Misremembering injected numbers (e.g., "270 qualifiers" → "300 qualifiers")

**No detection mechanism exists for any of these.**

### 5B. AUTHORITY ESCALATION [MEDIUM]

Because the system prompt says "you KNOW" and "you've sat in those rooms," Claude generates advice with absolute certainty:
- "This IS what makes an AO stop scrolling"
- "This IS what separates Tier 2 from Tier 1"
- No hedging, no "in our assessment," no uncertainty markers

Students receive this as expert certainty, not AI-generated guidance.

### 5C. SCORING TEMPERATURE ALLOWS DRIFT [MEDIUM]

**File**: `activityScoringService.ts:398`

Temperature: 0.3 (not 0.0 deterministic)

**Impact**: Same activity scored twice can produce different results:
- Run 1: 6.5/10 → "Above Average" (Tier 3)
- Run 2: 7.2/10 → "Very Good" (Tier 2)

This crosses tier boundaries and changes the entire teaching narrative.

---

## 6. Layer 5: Output Validation

### What we check (and don't check) after LLM generates advice

### 6A. FORMAT VALIDATION EXISTS, ACCURACY VALIDATION DOES NOT [CRITICAL]

**What IS validated** (stage2ConditionalTeachingService.ts:1746-1797):
- JSON structure is valid
- Required fields are present
- Sara Harberson framework is mentioned
- Celebration section exists
- Citation count meets minimum

**What is NOT validated**:
- Whether any specific claim is accurate
- Whether statistics match the knowledge base
- Whether school-specific claims are true
- Whether admission outcome predictions are present
- Whether harmful advice is generated (e.g., "quit this activity")

### 6B. NO CONTRADICTION DETECTION [HIGH]

If Claude generates "USAMO has 500 qualifiers" when the knowledge base says 270, nothing catches this. If Claude says "Stanford doesn't value leadership" when the knowledge base says otherwise, nothing catches this.

### 6C. JSON PARSING FAILURES CRASH THE PIPELINE [MEDIUM]

**File**: `activityScoringService.ts:493-502`

```typescript
private parseScoreResponse(content: string): ActivityScore | null {
  try {
    // ... parse JSON
  } catch (error) {
    return null;  // Entire pipeline fails
  }
}
```

No retry logic. No heuristic fallback. No partial recovery. A single malformed JSON response kills the entire scoring pipeline for that student.

---

## 7. Layer 6: Scoring Calibration

### Consistency, drift, and bias in the scoring system

### 7A. WEIGHT JUSTIFICATION [LOW]

The 5-component weights (Tier 30%, Recognition 25%, Leadership 12.5%, Community 15%, Commitment 17.5%) are reasonable but:
- No documented justification for why 30% and not 35%
- No empirical validation against admissions outcomes
- Editorial choices labeled as calibrated measurement

### 7B. LEADERSHIP REDISTRIBUTION BIAS [MEDIUM]

When leadership doesn't apply (solo activities), weights redistribute proportionally:
- Tier: 30% → 34.3%, Recognition: 25% → 28.6%

This means for solo research: tier gets MORE weight, which could systematically overscore individual competition achievements relative to leadership-based activities.

### 7C. RECOGNITION-INFLATION BIAS [MEDIUM]

Recognition (25% weight) is heavily driven by external credentials. Activities with genuine impact but no formal awards are systematically underscored:
- Tutoring 50 students with measurable improvement but no award → Recognition: 1-2
- Same tutoring + wins "Tutor of the Month" → Recognition: 4-5
- 3-point score gap for same actual impact

### 7D. MISSING BENCHMARK CATEGORIES [MEDIUM]

The comparison benchmarks library covers 11 categories but is missing:
- Esports/competitive gaming
- Religious activities
- Solo creative work (non-competition art)
- Advocacy/activism that doesn't fit "social impact"
- Career-focused activities (medical shadowing, legal internships)

Activities in uncovered categories get matched to the nearest keyword with `confidence: 'low'` and may receive inconsistent scoring.

### 7E. COMBINED SCORE CEILING EFFECT [LOW]

Combined score formula: `activity × 0.7 + description × 0.3`

A Tier 4 activity (score: 4) with perfect description (10) = 2.8 + 3.0 = **5.8**
A Tier 2 activity (score: 7) with mediocre description (5) = 4.9 + 1.5 = **6.4**

This incentivizes description crafting over activity quality at the margins. A well-described weak activity can outscore a poorly-described strong one.

### 7F. BATCH vs. SINGLE SCORING CONTEXT BIAS [MEDIUM]

Batch scoring provides all activities at once, which introduces comparative anchoring:
- The LLM may score Activity C lower because Activity B is in the same batch and stronger
- Same activity can score ±0.5 depending on batch composition
- No instruction to "rate each activity independently" in the batch prompt

### 7G. MODEL VERSION DIVERGENCE [MEDIUM]

Different scoring services use different model versions:
- Activity scoring: `claude-sonnet-4-20250514`
- Description scoring: `claude-sonnet-4-5-20250929`
- Portfolio scoring: `claude-sonnet-4-20250514`

Model updates could cause systematic score drift, and no version metadata is attached to scores.

---

## 8. Cross-Cutting Concerns

### 8A. NO ADMISSION OUTCOME GUARDRAILS [HIGH]

The system regularly produces language that implies admission predictions:
- "That's what makes an AO lean forward"
- "That's what makes an AO stop scrolling"
- "The room nods"
- Harvard 1-6 scale assessment

Nowhere does the system add disclaimers like: "This assessment is for activity improvement purposes, not an admission prediction. Admission outcomes depend on many factors."

### 8B. NO DISCLOSURE THAT ADVICE IS AI-GENERATED [HIGH]

Users receive advice framed as if from an expert who "reviewed 50,000+ applications." No disclosure that:
- This is AI-generated guidance
- Claims are editorial interpretations, not verified facts
- Admission outcomes are inherently unpredictable

### 8C. CONSTRAINT DETECTION IS FRAGILE [MEDIUM]

**File**: `expertCounselorKnowledgeBase.ts:1269-1304`

Constraint detection uses string matching:
```typescript
if (notes.includes('caretaker') || notes.includes('caregiver'))
```

If a student says "I help take care of my grandmother" but doesn't use the word "caretaker," the constraint adjustment doesn't trigger. Underrepresented students could miss context adjustments they deserve.

### 8D. "HARVARD SCALE" NAMING [MEDIUM]

The portfolio synthesis uses "Harvard 1-6 scale" naming, implying this is Harvard's actual rating system. It's our editorial scale, and calling it "Harvard" creates false authority.

---

## 9. Complete Issue Registry

### CRITICAL (Must fix before serving real users)

| # | Issue | Location | Category |
|---|-------|----------|----------|
| C1 | Fabricated acceptance rates (95%, 89%, 85%, 70%, 90%, 80%, 86%) | extracurricularDatabase.ts:388-402, 121, 134-135, 657 | Data Accuracy |
| C2 | Fabricated admission multipliers (18x, 12x, 6x, 3x, 2x, 1.5x) | extracurricularDatabase.ts:912-937 | Data Accuracy |
| C3 | Expert impersonation ("20 years, 50K apps, Harvard/MIT/Stanford committees") | expertSystemPrompts.ts:34, 137 | User Safety |
| C4 | No output accuracy validation (only format checked) | stage2ConditionalTeachingService.ts:1746-1797 | Architecture |
| C5 | Fabricated context multipliers (1.8x, 1.6x, 1.3x) applied multiplicatively | contextAdjustmentDatabase.ts | Data Accuracy |

### HIGH (Should fix in next development cycle)

| # | Issue | Location | Category |
|---|-------|----------|----------|
| H1 | Unverified "research" cited in prompts ("MIT 2.4x", "72% leadership") | expertSystemPrompts.ts:158, expertCounselorKnowledgeBase.ts:825 | Data Accuracy |
| H2 | No contradiction detection between knowledge base and LLM output | Pipeline-wide | Architecture |
| H3 | No admission outcome guardrails or disclaimers | expertSystemPrompts.ts, stage3 | User Safety |
| H4 | Unverified AO quotes ("Former Yale AO", "Former MIT Interviewer") | expertCounselorKnowledgeBase.ts | Data Accuracy |
| H5 | Inaccurate selectivity numbers in benchmarks | comparisonBenchmarksLibrary.ts:52-54, knowledgeAssemblyService.ts:245-246 | Data Accuracy |
| H6 | School-specific claims presented as insider knowledge | expertCounselorKnowledgeBase.ts:269-421 | Data Accuracy |
| H7 | Citation service hardcodes instead of looking up database | activityCitationService.ts:119 | Architecture |
| H8 | Knowledge injected without verification level metadata | knowledgeAssemblyService.ts:1181-1316 | Architecture |
| H9 | LLM hallucination beyond injected knowledge (no detection) | Pipeline-wide | Architecture |
| H10 | No disclosure that advice is AI-generated | Pipeline-wide | User Safety |

### MEDIUM (Improve for production quality)

| # | Issue | Location | Category |
|---|-------|----------|----------|
| M1 | Temperature 0.3 allows ±0.3 score drift (crosses tier boundaries) | activityScoringService.ts:398 | Scoring |
| M2 | JSON parsing failure crashes entire pipeline (no retry/fallback) | activityScoringService.ts:493-502 | Architecture |
| M3 | Missing benchmark categories (esports, religious, solo creative) | comparisonBenchmarksLibrary.ts | Scoring |
| M4 | Recognition-inflation bias (awards > impact) | Scoring rubric | Scoring |
| M5 | Batch vs. single scoring context bias | activityScoringService.ts:357 | Scoring |
| M6 | Model version divergence across scoring services | Multiple files | Scoring |
| M7 | "Harvard Scale" naming implies official Harvard methodology | stage3, synthesis | User Safety |
| M8 | Constraint detection uses fragile string matching | expertCounselorKnowledgeBase.ts:1269-1304 | Architecture |
| M9 | No data freshness tracking (statistics may be stale) | All knowledge bases | Data Accuracy |
| M10 | False precision in constraint tier adjustments (0.5, 1, 1.5) | expertCounselorKnowledgeBase.ts:142-256 | Data Accuracy |
| M11 | Sara Harberson attribution without source link | expertCounselorKnowledgeBase.ts:14 | Data Accuracy |
| M12 | Leadership weight redistribution lacks justification | activityScoringService.ts:105-111 | Scoring |

### LOW (Nice-to-have improvements)

| # | Issue | Location | Category |
|---|-------|----------|----------|
| L1 | Combined score ceiling effect (description > activity at margins) | Scoring formula | Scoring |
| L2 | Weight percentages lack empirical justification | activityScoringService.ts:96-101 | Scoring |
| L3 | Binary leadership applicability (could be gradient) | types.ts | Scoring |

---

## 10. Implementation Priorities

### Phase 1: Data Accuracy (Immediate)

**Goal**: Remove fabricated claims, fix inaccurate numbers

1. **Remove all fabricated acceptance rates** from `extracurricularDatabase.ts`
   - Replace `acceptance_rate: 0.95` with qualitative signal: `admissionSignal: 'exceptional'`
   - Replace multipliers (18x, 12x, etc.) with descriptive tiers
   - Delete race-based context adjustments

2. **Fix selectivity numbers** in `comparisonBenchmarksLibrary.ts`
   - USAMO: ~250 from ~100K (not "~500 from 300K+")
   - STS: 40 from ~2,500 (not "1,900")
   - Add source citations to each benchmark entry

3. **Remove unverified research claims** from prompts
   - Delete "MIT research shows 2.4x more memorable"
   - Delete or source "72% held leadership"
   - Replace with honest framing: "Admissions best practices suggest..."

4. **Rename "Harvard Scale"** to "Uplift Portfolio Rating"

### Phase 2: Architecture Hardening (Next Sprint)

**Goal**: Prevent unreliable information from reaching users

5. **Add verification levels** to all knowledge base entries
   ```typescript
   type VerificationLevel = 'official' | 'published' | 'industry' | 'editorial';
   ```

6. **Replace expert impersonation** with honest framing
   - "You are an AI assistant trained on college admissions research and best practices"
   - NOT "You have 20 years of experience at Harvard/MIT/Stanford"

7. **Add output validation layer**
   - Check LLM output claims against knowledge base
   - Flag statistics that don't match injected data
   - Detect admission outcome predictions and add disclaimers

8. **Add JSON parsing retry/fallback**
   - Retry with temperature 0.0 on parse failure
   - Heuristic fallback if retry fails
   - Never crash the entire pipeline on malformed JSON

9. **Make citation service look up databases** instead of hardcoding
   - Single source of truth for all numbers
   - If database updates, citations update automatically

### Phase 3: Scoring Reliability (Following Sprint)

**Goal**: Consistent, calibrated, fair scores

10. **Synchronize model versions** across all scoring services

11. **Add score stability check**
    - Flag if rescore differs by >0.2 from cached score
    - Add version metadata to all scores

12. **Add missing benchmark categories**
    - Esports, religious activities, solo creative work, career exploration

13. **Add comparative anchoring control** to batch prompts
    - "Rate each activity independently; do not adjust based on other activities"

14. **Improve constraint detection**
    - Use semantic matching instead of exact string matching
    - Broader coverage of constraint language

### Phase 4: User Safety (Ongoing)

**Goal**: Honest, helpful, non-harmful advice

15. **Add disclaimer system** to all user-facing output
    - "This guidance is AI-generated, not from human admissions experts"
    - "Activity assessments are for improvement purposes, not admission predictions"

16. **Add harmful advice detection**
    - Scan for: "quit this activity", "guaranteed admission", "will get you in"
    - Replace with hedged language

17. **Document all knowledge sources** with verification status
    - Every benchmark, every claim, every "what schools value" assertion
    - Annual verification schedule

---

## Appendix: What's Working Well

Before fixing what's broken, acknowledge what's already good:

1. **Multi-stage pipeline architecture** — Separating story detection, analysis, teaching, and synthesis is sound
2. **Context as qualitative LLM input** — The activity pipeline correctly passes `firstGen: true` as a flag, not a multiplier
3. **Sara Harberson 4-tier framework** — Well-established in admissions consulting (needs source citation)
4. **5-component scoring rubric** — Thoughtfully designed with reasonable weights
5. **Teaching tone** — Celebration-first, encouraging, specific before/after examples
6. **Comparison benchmarks library** — 11 categories, 4 tiers each, educational context strings
7. **Knowledge assembly pattern** — Pre-computing knowledge before LLM prompting is the right architecture
8. **Fallback mechanisms** — Teaching has fallbacks when LLM fails
9. **Defensive JSON normalization** — Clamping, default values, score recalculation

The system's architecture is fundamentally sound. The issues are in the DATA it operates on and the GAPS in validation between layers. Fix the data and add validation, and this becomes a genuinely reliable system.

---

*Audit completed 2026-02-06. All findings reference specific files and line numbers.*
*This document is designed as a complete reference for implementation in the building chat.*
