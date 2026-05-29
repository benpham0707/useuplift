# PLAN: Deep Academic Report — Modular Refactor & Quality Overhaul

> **Date:** 2026-02-10
> **Status:** AWAITING APPROVAL
> **Scope:** Refactor `deepAcademicReportService.ts` (1001-line monolith) into a modular architecture that fixes all 32 audit findings while improving output quality, reliability, and maintainability.
> **Cost Impact:** +$0.02/report (from ~$0.11 to ~$0.13) for dramatically better output.
> **Runtime Impact:** +5-8s (one additional Haiku call for Bottom Line synthesis). Net: ~55s → ~62s.

---

## ANSWERS TO THE 6 OPEN QUESTIONS

### Q1: Tier Recalibration — How Aggressive?
**Decision: Go with the audit's moderate proposal, with exact school examples from CDS data.**

| Tier | Old Threshold | New Threshold | School Examples (CDS-verified) |
|------|--------------|---------------|-------------------------------|
| Ivy/Elite (Top 10) | 3.85 | **3.90** | Harvard, Stanford, MIT, Princeton, Yale, Columbia |
| Highly Selective (Top 10-25) | 3.70 | **3.80** | Northwestern, UCLA, UC Berkeley, Carnegie Mellon, Georgetown, Georgia Tech |
| Selective (Top 25-60) | 3.40 | **3.60** | Boston University, UT Austin, Purdue, Ohio State, UMass Amherst, UW-Madison |
| Competitive (Top 60-150) | 3.00 | **3.20** | Arizona State, Iowa State, University of Oregon, Temple University |
| Accessible | 2.00 | 2.00 (unchanged) | Community colleges, open admission |

**Why not higher?** Raising Ivy to 3.95+ would make the Ivy tier essentially "4.0 only," which doesn't reflect the full reality of holistic admissions. The moderate proposal is well-supported by CDS data and keeps Sarah Chen (3.66) correctly in Selective.

**Key data points supporting these thresholds:**
- UCLA UW GPA: 3.95-4.00 mid-50% → justifies 3.90 Ivy floor
- BU average: 3.90, Purdue 25th pct: ~3.62 → justifies 3.60 Selective floor
- Georgia Tech: 4.14 weighted, 92.5% had 4.0+ → added to Highly Selective

### Q2: Cost vs Quality (llmFormattedContext Routing)
**Decision: Cherry-pick 3 highest-value fields (+~$0.01/report, not $0.03).**
- `admittedProfile.expectedCourses` → Roadmap generator (course expectations with reasoning)
- `majorExpectations.commonMistakes` → Challenges generator (validated pitfalls to reference)
- `majorExpectations.genuineInterestMarkers` → Identity generator (what authentic interest looks like)

**Why not full blob?** Routing all 4000 chars to all 3 prompts adds tokens without proportional value. Cherry-picking sends the RIGHT data to the RIGHT section — each generator gets only what it needs.

### Q3: Major-Adjusted Tiers
**Decision: Add disclaimer now, defer full D2 implementation.**
When `intendedMajor` resolves to CS/Engineering/Business/Nursing, append to tier position:
> "Note: [Major] programs at selective schools are typically more competitive than general admits. Your tier positioning for [Major]-specific programs may be 0.5-1 tier higher than shown."

This takes 5 minutes, is honest, and doesn't require the full `MAJOR_TIER_ADJUSTMENTS` data infrastructure. Build D2 as a separate future task when we have CS-specific GPA data for 15+ schools.

### Q4: Bottom Line — Truncation vs LLM Summary
**Decision: Dedicated Haiku synthesis call (new approach, better than both options).**
A short Haiku call (~$0.01, ~5s) reads the completed sections and writes purpose-specific concise bullets. This:
- Eliminates verbatim repetition permanently (the root cause)
- Produces the right *length* and *framing* for an executive summary
- Is cheaper than adding fields to the existing Sonnet calls
- Lets the LLM synthesize across sections (not just extract from one)

### Q5: Post-Processing Validation
**Decision: Yes, build it.**
~60 lines of validation catches what prompts can't prevent:
1. AP exam rate / class GPA in same sentence → flag for removal
2. Same stat cited in multiple challenges → flag duplicate
3. Subject-specific GPA drop mismatched with stated value → correct
Worth the complexity. Prompts are advisory; validation is enforcement.

### Q6: Third Challenge Slot
**Decision: Let the LLM decide with major-relevance filter prompt.**
Add: "PRIORITIZE challenges relevant to the intended major. For a CS applicant, a 'lack of CS progression beyond AP CS A' is far more impactful than 'Social Studies consistency.'"
If the LLM still picks a low-relevance challenge, the post-processor flags it but doesn't override — the LLM may have a valid reason.

---

## PERCENTILE CALIBRATION: UPLIFT_SCALE_DATABASE (C3 Fix)

### Problem with Current Percentiles

The current UPLIFT_SCALE_DATABASE has gaps and missing ranges:
- A+ through B- have percentiles, but with **gaps between grades** (20-25% is neither B+ nor B)
- C+ through F have **no percentile claims at all** — students can't be placed
- The C3 fix originally proposed ("roughly top 15-25%") created **overlapping ranges** and a B family spanning 25 full percentage points with vague "roughly" qualifiers

### Solution: Contiguous, Non-overlapping Full-Spectrum Scale

Every grade gets a precise percentile band covering 0-100%. Bands are wider in the middle (where most students cluster) and narrower at extremes — matching the normal distribution of academic performance among college-bound students (~3.7M/year).

| Grade | Label | Percentile Range | Band Width | School Competitiveness |
|-------|-------|-----------------|------------|----------------------|
| **A+** | Exceptional Scholar | Top 1-3% | 3 pts | Ivy League, Stanford, MIT, Caltech — top 5-10 programs |
| **A** | Outstanding | Top 3-6% | 3 pts | Top 10-20 universities, highly selective LACs, flagship honors |
| **A-** | Excellent | Top 6-10% | 4 pts | Competitive at top 20-30, strong match for top 40 |
| **B+** | Very Good | Top 10-17% | 7 pts | Competitive at top 30-50 (NYU, Tulane, Wisconsin, UCSB) |
| **B** | Solid | Top 17-24% | 7 pts | Competitive at top 50-80, large flagships, mid-tier private |
| **B-** | Developing | Top 24-30% | 6 pts | Top 80-120 schools, state universities, regional private |
| **C+** | Below Potential | Top 30-45% | 15 pts | Less selective state/private universities |
| **C** | Needs Improvement | Top 45-62% | 17 pts | Open-admission and less selective institutions |
| **C-** | At Risk | Top 62-80% | 18 pts | CC→transfer pathway recommended |
| **D+** | Struggling | Top 80-88% | 8 pts | Community college strongest path |
| **D** | Critical | Top 88-94% | 6 pts | CC with intentional transfer planning |
| **D-** | Emergency | Top 94-98% | 4 pts | Stabilization first, college second |
| **F** | Requires Intervention | Bottom 2% | 2 pts | Support systems before college planning |

**Total: 100%** — every student fits exactly one grade. No gaps, no overlaps.

### Data-Grounded Rationale

The percentile-to-school mapping is grounded in freshman enrollment capacity:
- **Top 5-10 schools** (~23K seats/year) → filled by top ~1-3% of 3.7M graduates
- **Top 10-25 schools** (~60K seats) → filled by top ~3-6%
- **Top 25-50 schools** (~120K seats) → filled by top ~6-10%
- **Top 50-100 schools** (~250K seats, many large flagships) → filled by top ~10-24%
- **Top 100-200 schools** (large state universities) → filled by top ~24-45%
- **Less selective / open-admission** → top 45%+

The letter grades are then aligned to match student intuition: A+ = Ivy, A = elite, A- = excellent, B+ = very good (strong recognizable schools), B = solid, B- = work to do.

### Distribution by Family

| Grade Family | Range | Total Width | Avg per Sub-grade | Why |
|-------------|-------|-------------|-------------------|-----|
| A (A+/A/A-) | Top 1-10% | 10 pts | ~3.3 pts | Elite tier — small differences in profile = big differences in school access |
| B (B+/B/B-) | Top 10-30% | 20 pts | ~6.7 pts | Above-average students — tight enough for meaningful school differentiation |
| C (C+/C/C-) | Top 30-80% | 50 pts | ~16.7 pts | Large segment with significant room for improvement |
| D (D+/D/D-) | Top 80-98% | 18 pts | ~6 pts | Few college applicants at this level |
| F | Bottom 2% | 2 pts | 2 pts | Crisis level, needs intervention not placement |

### Exact Text Changes for UPLIFT_SCALE_DATABASE

Each grade descriptor's `description` field gets its percentile updated. Grades that currently lack percentiles (C+ through F) get them added:

```typescript
// A+
description: 'Top 1-3% academic profile nationally. Maximum rigor with near-perfect performance...'
// A
description: 'Top 3-6% academic profile. High rigor with consistent A-range performance...'
// A-
description: 'Top 6-10% academic profile. Meaningful rigor with mostly strong grades...'
// B+
description: 'Top 10-17% academic profile. Good rigor with some grade variation...'
// B
description: 'Top 17-24% academic profile. Adequate rigor with average performance...'
// B-
description: 'Top 24-30% academic profile. Either rigor is present but grades suffer...'
// C+
description: 'Top 30-45% academic profile. The transcript signals underperformance...'
// C
description: 'Top 45-62% academic profile. Multiple areas need attention...'
// C-
description: 'Top 62-80% academic profile. Significant academic challenges...'
// D+
description: 'Top 80-88% academic profile. Serious academic concerns...'
// D
description: 'Top 88-94% academic profile. The academic record currently presents...'
// D-
description: 'Top 94-98% academic profile. Academic performance is at crisis level...'
// F
description: 'Bottom 2% academic profile. Academic profile is in freefall...'
```

### Why the B Family at 10-30% Works

The B family spans 20 points total with nearly even sub-grades (7/7/6):

1. **B+ (10-17%)** = 7 pts — "Good rigor with some grade variation. Strengths visible but so are gaps." Competitive at top 30-50 schools (NYU, Tulane, Wisconsin, UC Santa Barbara).
2. **B (17-24%)** = 7 pts — "Adequate rigor, average performance at that level. Story developing." Competitive at top 50-80 schools, large flagships, mid-tier privates.
3. **B- (24-30%)** = 6 pts — "Rigor/grade imbalance exists." Top 80-120 schools, state universities — needs improvement for more selective options.

Each sub-grade maps to a ~20-30 rank window of schools, giving students clear, differentiated guidance. A B+ student (top 13%) targeting NYU gets very different advice than a B- student (top 27%) targeting Penn State.

The A family (10 pts, top 1-10%) is compressed because at the elite level, small profile differences have outsized consequences — the gap between "Ivy-competitive" and "top-30-competitive" is only ~7% of students but spans ~20 school ranks. The C family (50 pts, top 30-80%) is the widest because this large segment benefits more from qualitative growth advice than precise percentile placement.

---

## ARCHITECTURAL REDESIGN

### Current: Monolith (1 file, 1001 lines)
```
deepAcademicReportService.ts
├── Constants, helpers, tier logic (lines 1-191)
├── Class with instance-level cost tracking (lines 196-208)
├── generateReport() orchestrator (lines 214-284)
├── assembleContext() (lines 290-334)
├── generateAcademicIdentity() — HUGE prompt (lines 340-470)
├── generateChallengesAndReality() — HUGE prompt (lines 476-615)
├── generateStrategicRoadmap() — HUGE prompt (lines 621-748)
├── generateResearchContext() — template (lines 754-838)
├── buildBottomLine() — extraction (lines 844-864)
└── generateTemplateFallback() — fallback (lines 870-987)
```

**Problems:**
- Prompts competing for context space (each gets the same data dump)
- Data routing not section-specific (70% of research data wasted)
- Bottom Line extraction causes verbatim repetition
- One failure kills all sections (Promise.all)
- Tier calibration mixed with generation logic
- Cost tracking has race condition on singleton

### Proposed: Modular Architecture (12 files, ~2200 lines total)
```
deepAcademicReport/
├── index.ts                          # Barrel exports
├── orchestrator.ts                   # Coordination + Promise.allSettled + partial failure
├── types.ts                          # All types (moved from parent, enhanced)
│
├── context/
│   ├── contextAssembly.ts            # Rich data assembly — fixes ALL pipeline leaks
│   └── tierCalibration.ts            # Corrected benchmarks + GPA→tier + major disclaimer
│
├── generators/
│   ├── identityGenerator.ts          # Section 1: focused prompt + genuine interest markers
│   ├── challengesGenerator.ts        # Section 2: focused prompt + common mistakes + major filter
│   ├── roadmapGenerator.ts           # Section 3: focused prompt + course expectations
│   ├── researchGenerator.ts          # Section 4: template with full transcript coverage
│   └── bottomLineGenerator.ts        # Bottom Line: Haiku synthesis from completed sections
│
├── validation/
│   └── postProcessing.ts             # AP/GPA conflation, stat dedup, numerical consistency
│
└── fallback/
    └── templateFallback.ts           # Improved template fallback
```

### Data Flow
```
Input (DeepAcademicReportInput)
    │
    ▼
contextAssembly.ts ─── assembles EVERYTHING ───────────────────────┐
    │                                                               │
    ├── extractProfileInsights() → FULL fields (obs + interp + strategy + evidence)
    ├── assembleResearchForStudent() → cherry-picked llmFormattedContext fields
    ├── generateAcademicPlanningAdvice() → with trajectoryActionItems
    ├── calculateOverallGPA() → CORRECT calculation (B1 fix)
    └── tierCalibration.calculateTierPosition() → CORRECTED benchmarks (C1 fix)
    │
    ▼
orchestrator.ts ─── Promise.allSettled ────────────────────────────┐
    │                                                               │
    ├── identityGenerator ← profileInsights.full + genuineInterestMarkers
    │                       + corrected tier + uplift scale
    │                       SCOPE: identity, strengths, weaknesses (brief), tier, rating
    │
    ├── challengesGenerator ← commonMistakes + major-relevance filter
    │                         + corrected tier + verified stats (unique per challenge)
    │                         SCOPE: challenges only, AO impact, tier impact
    │
    ├── roadmapGenerator ← expectedCourses + trajectoryActionItems + workload
    │                      SCOPE: priorities, course strategy, major alignment
    │
    └── researchGenerator ← ALL student AP courses + major requirements (template)
    │
    ▼
postProcessing.ts ─── validates LLM output ────────────────────────┐
    │                                                               │
    ├── Flag AP exam rate / class GPA conflation
    ├── Flag duplicate stats across challenges
    ├── Correct mismatched GPA drop values
    └── Flag low-relevance challenges for major
    │
    ▼
bottomLineGenerator.ts ─── Haiku synthesis ────────────────────────┐
    │                                                               │
    └── Reads completed + validated sections → writes 5 concise bullets
        (NOT extracted — purpose-written for executive summary)
    │
    ▼
DeepAcademicReport (output)
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation — Bug Fixes & Calibration (~30 min)
**Goal:** Fix all silent bugs and recalibrate benchmarks. No architecture changes yet.

| # | Item | File | What |
|---|------|------|------|
| 1 | B1 | `unifiedResearchAssemblyService.ts:553` | Fix `overallGPA` → calculate from `subjectPatterns` |
| 2 | B2 | `insightDrivenAdvisor.ts:447` | Fix `yearlyGPAs` → `gpaByYear.map(y => y.gpa)` |
| 3 | B9 | `deepAcademicReportService.ts:825-830` | Swap NACAC GPA (74%) and College Prep (77%) values |
| 4 | C1 | `deepAcademicReportService.ts:141-155` | Recalibrate all tier benchmarks (new ranges + school examples) |
| 5 | C3 | `deepAcademicReportTypes.ts:211-290` | Recalibrate ALL 13 grade percentiles to contiguous, non-overlapping bands covering full 0-100% spectrum (see Percentile Calibration section below) |
| 6 | C4 | `deepAcademicReportService.ts:145` | Add named schools to Competitive tier |

**Verify:** `npx tsc --noEmit` passes.

### Phase 2: Extract Modules — Context & Calibration (~1 hour)
**Goal:** Extract reusable modules from the monolith without changing behavior.

| # | What | New File |
|---|------|----------|
| 1 | Create `deepAcademicReport/` directory structure | — |
| 2 | Extract tier logic: benchmarks, `getTierForGPA()`, `calculateTierPosition()`, `formatSubject()`, `calculateOverallGPA()` | `context/tierCalibration.ts` |
| 3 | Extract & enhance context assembly with ALL fixes: full ProfileInsight fields (H1), cherry-picked research fields, AP course coverage (H4/B5), trajectoryActionItems (M2) | `context/contextAssembly.ts` |
| 4 | Move types with enhanced `AssembledReportContext` that includes per-section data packages | `types.ts` |
| 5 | Barrel exports | `index.ts` |

**Key change:** Instead of one flat `AssembledReportContext`, produce typed per-section data packages:
```typescript
interface EnrichedReportContext {
  // Shared
  quantitativeAnalysis: NuancedCapabilityAnalysis;
  overallGPA: number; // CORRECT calculation
  tierPosition: CollegeTierPosition; // CORRECTED calibration
  input: DeepAcademicReportInput;

  // Section-specific packages
  forIdentity: {
    profileInsightsFull: ProfileInsight[];     // ALL 4 fields
    genuineInterestMarkers: string[];          // From majorExpectations
    synthesis: CapabilitySynthesis;
  };
  forChallenges: {
    commonMistakes: CommonMistake[];           // From majorExpectations
    challengeSubjects: ChallengeSubjectData[];
    verifiedStats: VerifiedStat[];
    courseRecommendations: CourseRec[];         // For roadmap connection
  };
  forRoadmap: {
    expectedCourses: ExpectedCourse[];         // From admittedProfile
    trajectoryActionItems: string[];           // From planning
    planningAdvice: AcademicPlanningAdvice;
  };
  forResearch: {
    allStudentAPCourses: APCourseWithGrade[];  // EVERY AP they took
    majorRequirements: MajorReqs | undefined;
  };
}
```

**Verify:** Import from new modules, `npx tsc --noEmit` passes, same output behavior.

### Phase 3: Refactor Generators & Orchestrator (~2 hours)
**Goal:** Each section gets its own generator with focused prompts. Orchestrator uses `Promise.allSettled`.

| # | What | New File |
|---|------|----------|
| 1 | Identity generator with: A3 (weakness brevity), A4 (difficulty clarity), A5 (metric explanations), A6 (speculative claims), genuine interest markers | `generators/identityGenerator.ts` |
| 2 | Challenges generator with: A1 (AP/GPA guard rewrite), A2 (major-relevance filter), A7 (stat dedup), common mistakes | `generators/challengesGenerator.ts` |
| 3 | Roadmap generator with: B8 (trajectoryActionItems), expected courses from admittedProfile | `generators/roadmapGenerator.ts` |
| 4 | Research generator with: B5 (full transcript AP coverage), corrected NACAC stats | `generators/researchGenerator.ts` |
| 5 | Bottom Line synthesizer — NEW Haiku call, eliminates B3/R1/R2/D3 | `generators/bottomLineGenerator.ts` |
| 6 | Orchestrator with: B6 (Promise.allSettled), B7 (request-scoped cost tracking) | `orchestrator.ts` |
| 7 | Post-processing validator: D4 (AP/GPA conflation, stat dedup, numerical consistency) | `validation/postProcessing.ts` |
| 8 | Improved template fallback with corrected tiers | `fallback/templateFallback.ts` |

**Key prompt improvements per generator:**

**Identity Generator:**
- Weakness fields: `MAX 25 WORDS` for gap, `MAX 20 WORDS` for consequence, "do NOT mention schools/courses" (A3)
- Difficulty impact annotated: "this is the AVERAGE — calculate subject-specific drops from actual grades" (A4)
- Metrics require benchmarks: "ALWAYS explain what the number measures and provide a benchmark" (A5)
- Strength/weakness tiers: "these are ILLUSTRATIVE — frame as 'if your entire transcript matched'" (A6)
- NEW: Cherry-picked `genuineInterestMarkers` from `majorExpectations`

**Challenges Generator:**
- AP/GPA guard completely rewritten with concrete bad example labeled "MEANINGLESS" (A1)
- Major-relevance filter: "PRIORITIZE challenges relevant to intended major. A 'lack of CS progression' is more impactful than 'Social Studies consistency' for a CS applicant" (A2)
- Stat dedup: "Each stat may be cited in AT MOST ONE challenge" (A7)
- NEW: Cherry-picked `commonMistakes` from `majorExpectations`
- NEW: Major-adjusted tier disclaimer when applicable

**Roadmap Generator:**
- `trajectoryAssessment.actionItems` now included (B8)
- NEW: `admittedProfile.expectedCourses` with expectation levels
- Progression-aware: "don't recommend AP CSP after 4.0 in AP CSA"

**Bottom Line Generator (NEW):**
- Haiku model (~$0.01, ~5s)
- Receives section summaries (not raw data)
- Prompt: "Write 5 bullets a student can read INDEPENDENTLY. MAX 30 words each. SYNTHESIZE, do NOT copy."
- Eliminates R1 (verbatim strength), R2 (verbatim risk), R3 (tier repeated 5x)

**Post-Processing Validator (NEW):**
- Detects AP exam rate + class GPA in same sentence → strips the conflated sentence
- Detects same stat cited across challenges → flags for the challenge with lowest relevance
- Detects GPA drop value mismatches → logs warning
- Detects challenges irrelevant to intended major → logs warning (doesn't remove)

### Phase 4: Calibration Polish & Verification (~30 min)
**Goal:** Final calibration updates and end-to-end verification.

| # | What | File |
|---|------|------|
| 1 | C2: Verify `schoolFit` strings align with new percentile bands (A+ through F). Ensure school competitiveness matches the percentile range — e.g. B+ (top 10-17%) should say "top 30-50" not "top-50". Update any schoolFit text that contradicts the new tier thresholds (3.90/3.80/3.60/3.20). See Percentile Calibration section for exact ranges. | `types.ts` |
| 2 | D5: Improve template fallback with school names and corrected tiers | `fallback/templateFallback.ts` |
| 3 | Major disclaimer in tier position for CS/Engineering/Business/Nursing | `context/tierCalibration.ts` |
| 4 | Run E2E test, verify all 32 issues addressed | `tests/test-deep-academic-report.ts` |
| 5 | Update handoff doc with new architecture | `docs/DEEP_REPORT_CONTEXT_HANDOFF.md` |

---

## ISSUE COVERAGE MATRIX

Every audit finding mapped to its fix:

| Issue | Description | Fix Phase | Fix Item |
|-------|-------------|-----------|----------|
| **A1** | Strengthen AP/GPA conflation guard | Phase 3 | challengesGenerator prompt |
| **A2** | Major-relevance filter for challenges | Phase 3 | challengesGenerator prompt |
| **A3** | Weakness brevity enforcement | Phase 3 | identityGenerator prompt |
| **A4** | Difficulty impact vs subject-specific | Phase 3 | identityGenerator prompt |
| **A5** | Require metric explanations | Phase 3 | identityGenerator prompt |
| **A6** | Tone down speculative tier claims | Phase 3 | identityGenerator prompt |
| **A7** | Deduplicate stats across challenges | Phase 3 | challengesGenerator prompt |
| **B1** | Fix overallGPA bug | Phase 1 | 1-line fix in unifiedResearchAssemblyService |
| **B2** | Fix yearlyGPAs dead code | Phase 1 | 1-line fix in insightDrivenAdvisor |
| **B3** | Bottom Line verbatim copy | Phase 3 | bottomLineGenerator replaces extraction |
| **B4** | Route full ProfileInsight fields | Phase 2 | contextAssembly |
| **B5** | AP course coverage gap | Phase 2+3 | contextAssembly + researchGenerator |
| **B6** | Promise.allSettled for partial failure | Phase 3 | orchestrator |
| **B7** | Race condition in singleton | Phase 3 | orchestrator (request-scoped tracking) |
| **B8** | trajectoryActionItems in roadmap | Phase 2+3 | contextAssembly + roadmapGenerator |
| **B9** | NACAC stats swap | Phase 1 | 2-line fix |
| **C1** | Recalibrate tier benchmarks | Phase 1 | tierCalibration constants |
| **C2** | Recalibrate schoolFit strings | Phase 4 | types.ts |
| **C3** | Recalibrate ALL 13 grade percentiles to contiguous non-overlapping bands (see Percentile Calibration section) | Phase 1 | types.ts |
| **C4** | Competitive tier school names | Phase 1 | tierCalibration constants |
| **D1** | Route llmFormattedContext (cherry-pick) | Phase 2 | contextAssembly |
| **D2** | Major-adjusted tiers (disclaimer) | Phase 4 | tierCalibration |
| **D3** | Bottom Line LLM summary | Phase 3 | bottomLineGenerator |
| **D4** | Post-processing validation | Phase 3 | postProcessing |
| **D5** | Improve template fallback | Phase 4 | templateFallback |
| **D6** | Variable temperature | — | Deferred (marginal value) |
| **D7** | Expand input type | — | Deferred (separate task) |
| **R1** | Verbatim Bottom Line/Section 1 | Phase 3 | bottomLineGenerator |
| **R2** | Verbatim Bottom Line/Section 2 | Phase 3 | bottomLineGenerator |
| **R3** | Tier repeated 5+ times | Phase 3 | scope boundaries in all generators |
| **R4** | Chemistry drop cited 3+ times | Phase 3 | A7 stat dedup + postProcessing |
| **R5** | 62% cited 3 times | Phase 3 | A7 stat dedup |
| **H1** | ProfileInsight fields truncated | Phase 2 | contextAssembly |
| **H2** | overallGPA bug | Phase 1 | = B1 |
| **H3** | yearlyGPAs dead code | Phase 1 | = B2 |
| **H4** | AP course coverage gap | Phase 2 | = B5 |

**30/32 issues fixed. 2 deferred (D6 variable temperature, D7 input type expansion).**

---

## COST & RUNTIME ANALYSIS

### Before Refactor
| Call | Model | Cost | Time |
|------|-------|------|------|
| Identity | Sonnet | ~$0.037 | ~15s |
| Challenges | Sonnet | ~$0.037 | ~15s |
| Roadmap | Sonnet | ~$0.037 | ~15s |
| **Total** | | **~$0.11** | **~55s** (parallel) |

### After Refactor
| Call | Model | Cost | Time |
|------|-------|------|------|
| Identity | Sonnet | ~$0.035 | ~14s |
| Challenges | Sonnet | ~$0.035 | ~14s |
| Roadmap | Sonnet | ~$0.035 | ~14s |
| Bottom Line | **Haiku** | ~$0.001 | ~5s |
| Post-processing | — | $0 | <1ms |
| **Total** | | **~$0.13** | **~62s** |

**Net: +$0.02/report (+18%), +7s runtime (+13%).** Focused prompts may actually reduce Sonnet output (more concise = fewer output tokens), partially offsetting the Haiku cost.

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Refactor introduces regressions | Phase 2 is extract-only (no behavior change). E2E test before/after Phase 3. |
| Cherry-picked research context isn't enough | contextAssembly logs which fields available vs routed. Expandable. |
| Bottom Line Haiku call adds latency | Runs after sections (sequential) but Haiku is fast (~5s). Unavoidable since it needs section content. |
| Post-processing removes valid content | Validation FLAGS, doesn't auto-remove. Only strips clearly wrong AP/GPA conflation. |
| Breaking imports for consumers | `index.ts` re-exports same public API. `generateDeepAcademicReport()` signature unchanged. |

---

## FILES TOUCHED (complete list)

### Phase 1 (existing files)
- `conversational/unifiedResearchAssemblyService.ts` — B1
- `conversational/insightDrivenAdvisor.ts` — B2
- `deepAcademicReportService.ts` — C1, C4, B9
- `deepAcademicReportTypes.ts` — C3

### Phases 2-4 (new files)
```
deepAcademicReport/
├── index.ts
├── orchestrator.ts
├── types.ts
├── context/
│   ├── contextAssembly.ts
│   └── tierCalibration.ts
├── generators/
│   ├── identityGenerator.ts
│   ├── challengesGenerator.ts
│   ├── roadmapGenerator.ts
│   ├── researchGenerator.ts
│   └── bottomLineGenerator.ts
├── validation/
│   └── postProcessing.ts
└── fallback/
    └── templateFallback.ts
```

### Updated references
- `capability/index.ts` — update barrel export
- `tests/test-deep-academic-report.ts` — update import
- `tests/generate-deep-report-output.ts` — update import

---

*This plan addresses 30/32 audit findings through a modular refactor that gives each component proper depth, focused data routing, and clear scope boundaries. The system is designed to work in tandem — each generator receives only the data it needs, post-processing catches what prompts can't prevent, and the Bottom Line synthesizes rather than extracts.*
