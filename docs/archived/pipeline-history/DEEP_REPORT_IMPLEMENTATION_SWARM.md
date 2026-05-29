# Deep Academic Report — Implementation Swarm Prompt

> **Mode:** SEQUENTIAL (each teammate depends on the previous)
> **Total Teammates:** 4
> **Estimated Total Time:** ~3-4 hours
> **Plan Reference:** `docs/DEEP_REPORT_REFACTOR_PLAN.md`

---

## GLOBAL CONTEXT (all teammates read this)

### What We're Building

The Deep Academic Report is a 4-section + Bottom Line teaching-quality analysis of a student's academic profile. It currently lives in a single 1001-line monolith (`deepAcademicReportService.ts`) that has 32 confirmed issues from a 4-person audit. We are refactoring it into a 12-file modular architecture that fixes every issue while improving output quality, runtime reliability, and maintainability.

### The 32 Issues (grouped)

**Bugs (fix or break things):**
- B1: `overallGPA` always falls back to 3.5 (never calculates from actual data)
- B2: `yearlyGPAs` references wrong field name → trajectory detection is dead code
- B3: Bottom Line copies verbatim text from Section 1 and Section 2
- B5: AP courses the student took but aren't in `relevantAPCourses` are invisible to Section 4
- B6: `Promise.all` means one failed section kills the entire report
- B7: Singleton `_accumulatedCost` has race condition if two reports run concurrently
- B8: `trajectoryAssessment.actionItems` exists but is never passed to roadmap prompt
- B9: NACAC stats for GPA (77%) and College Prep (69%) are swapped — should be 74% and 77%

**Prompt Quality (LLM output issues):**
- A1: AP exam pass rate compared to class GPA (meaningless comparison, prompt warns against it but LLM still does it)
- A2: Third challenge is Social Studies for a CS applicant (waste of a challenge slot)
- A3: Section 1 weakness previews are 3 sentences each (should be 1+1)
- A4: Overall difficulty impact (0.55) confused with Chemistry-specific drop (0.70)
- A5: Metrics like "65% strength signal" dropped without explanation
- A6: "Your CS GPA would place you at Harvard" — misleading single-subject tier claim
- A7: Same stat (e.g., "62% pass rate") cited in 3 different places

**Calibration (data accuracy):**
- C1: Tier benchmarks too low by 0.10-0.20 GPA points (CDS data proves it)
- C2: schoolFit strings don't match corrected tiers
- C3: Percentile claims have gaps (20-25% is neither B+ nor B) and C+ through F have no percentiles at all
- C4: Competitive tier has no named school examples

**Architecture (structural improvements):**
- D1: 70% of assembled research data never reaches LLM prompts (llmFormattedContext, majorExpectations, admittedProfile all unused)
- D2: No major-adjusted tier disclaimer for CS/Engineering/Business/Nursing
- D3: Bottom Line is extraction (verbatim copy), should be synthesis
- D4: No post-processing validation catches AP/GPA conflation, stat duplication, etc.
- D5: Template fallback uses old tier values
- H1: ProfileInsight has 4 fields but only `observation` is passed to LLM (drops interpretation, strategicImplication, evidence)
- H4: AP courses student took but not in `relevantAPCourses` missing from Section 4

**Repetition (cross-section overlap):**
- R1: Bottom Line strength = verbatim Section 1 strength (68 words)
- R2: Bottom Line risk = verbatim Section 2 challenge tier impact (70 words)
- R3: Tier positioning repeated 5+ times across sections
- R4: Chemistry GPA drop cited 3+ times with inconsistent values
- R5: "62% pass rate" cited 3 times in one report

### Key Architecture Decisions (already finalized)

1. **Modular 12-file structure** — each generator gets its own file with a focused prompt and section-specific data
2. **Per-section data routing** via `EnrichedReportContext` — identity gets genuineInterestMarkers, challenges gets commonMistakes, roadmap gets expectedCourses
3. **Bottom Line = Haiku synthesis** — a dedicated Haiku call reads completed sections and writes 5 concise bullets (NOT extraction from sections)
4. **Promise.allSettled** — partial failure handling so one failed section doesn't kill the report
5. **Request-scoped cost tracking** — local variables per `generateReport()` call, not singleton instance vars
6. **Post-processing validation** — catches AP/GPA conflation, stat duplication, numerical mismatches after LLM output
7. **Tier recalibration** — Ivy 3.90+, Highly Selective 3.80+, Selective 3.60+, Competitive 3.20+ (CDS-verified)
8. **Percentile recalibration** — full contiguous 0-100% scale: A family (1-10%), B family (10-30%), C family (30-80%), D family (80-98%), F (bottom 2%)

### File Map

```
src/services/portfolioStrategy/services/academicWorkshop/capability/
├── deepAcademicReportService.ts          ← CURRENT monolith (1001 lines) — will be replaced
├── deepAcademicReportTypes.ts            ← CURRENT types (473 lines) — will be updated in Phase 1
├── index.ts                              ← CURRENT barrel exports — will be updated
├── nuancedCapabilityAnalyzer.ts          ← UPSTREAM: quantitative analysis (READ ONLY)
├── conversational/
│   ├── insightDrivenAdvisor.ts           ← UPSTREAM: profile insights (Phase 1 fix at line 447)
│   ├── unifiedResearchAssemblyService.ts ← UPSTREAM: research assembly (Phase 1 fix at line 553)
│   ├── academicPlanningAdvisor.ts        ← UPSTREAM: planning advice (READ ONLY)
│   ├── majorResolutionService.ts         ← UPSTREAM: major resolution (READ ONLY)
│   └── ...other files (READ ONLY)
│
├── deepAcademicReport/                   ← NEW directory (Phases 2-4)
│   ├── index.ts
│   ├── orchestrator.ts
│   ├── types.ts
│   ├── context/
│   │   ├── contextAssembly.ts
│   │   └── tierCalibration.ts
│   ├── generators/
│   │   ├── identityGenerator.ts
│   │   ├── challengesGenerator.ts
│   │   ├── roadmapGenerator.ts
│   │   ├── researchGenerator.ts
│   │   └── bottomLineGenerator.ts
│   ├── validation/
│   │   └── postProcessing.ts
│   └── fallback/
│       └── templateFallback.ts
```

### Critical Types to Know

```typescript
// NuancedCapabilityAnalysis — the quantitative backbone
interface NuancedCapabilityAnalysis {
  subjectPatterns: Record<string, SubjectPattern>;  // key academic data per subject
  performanceEnvelope: PerformanceEnvelope;          // floor/ceiling/comfort GPA
  challengeResponse: ChallengeResponseAnalysis;      // how they handle difficulty
  progressionTrajectory: ProgressionTrajectory;      // trend over time
  performanceFingerprint: PerformanceFingerprint;    // percentile, consistency, sweet spot
  synthesis: CapabilitySynthesis;                     // strengths, challenges, summary
}

// SubjectPattern — per-subject deep analysis
interface SubjectPattern {
  performanceHistory: {
    avgGPA: number;
    courses: Array<{ name: string; level: string; grade: number; year: string }>;
    trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  };
  relativeStrength: number;  // -1 to 1, how this subject compares to their average
  // ...more fields
}

// ProfileInsight — 4 fields, currently only observation is used (H1 fix)
interface ProfileInsight {
  observation: string;        // what we noticed
  interpretation: string;     // what it means strategically
  strategicImplication: string; // what to do about it
  evidence: string[];         // supporting data points
}

// CoursePerformance — uses name/level/grade/year (NOT courseName/gradeValue)
interface CoursePerformance {
  name: string;
  level: string;
  grade: number;
  year: string;
}
```

### Quality Standards

- **TypeScript strict mode** — zero `any` types, `npx tsc --noEmit` must pass after every phase
- **No silent failures** — every error path must log and either recover or throw
- **No fabricated data** — all statistics must come from verified sources already in the codebase
- **Test after each phase** — the existing test at `tests/test-deep-academic-report.ts` must still work
- **Same public API** — `generateDeepAcademicReport(input)` signature is unchanged; consumers see no difference
- **Read before writing** — always read the current file content before modifying. Understand the existing patterns.

---

## TEAMMATE 1: Foundation — Bug Fixes & Calibration

**Phase:** 1 of 4
**Estimated Time:** 30-45 minutes
**Dependencies:** None (runs first)
**Goal:** Fix all silent bugs and recalibrate constants. No architecture changes. The monolith still works as before, just with correct data.

### Your Tasks

#### Task 1.1: Fix the `overallGPA` Bug (B1)

**File:** `src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/unifiedResearchAssemblyService.ts`
**Line:** ~553

**Current (broken):**
```typescript
const overallGPA = context.quantitativeAnalysis.overallGPA || 3.5;
```

**Problem:** `NuancedCapabilityAnalysis` has no `overallGPA` property. This ALWAYS falls back to 3.5.

**Fix:** Calculate from `subjectPatterns` the same way `deepAcademicReportService.ts` does at line 113-118:
```typescript
const patterns = Object.values(context.quantitativeAnalysis.subjectPatterns);
const overallGPA = patterns.length > 0
  ? patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0) / patterns.length
  : 3.5;
```

**Verify:** Search for any other references to `.overallGPA` on `NuancedCapabilityAnalysis` in the codebase and fix them too.

#### Task 1.2: Fix the `yearlyGPAs` Dead Code (B2)

**File:** `src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/insightDrivenAdvisor.ts`
**Line:** ~447

**Current (broken):**
```typescript
const yearlyGPAs = quant.progressionTrajectory.historical.yearlyGPAs;
```

**Problem:** The actual field is `gpaByYear: { year: string; gpa: number; rigorLevel: number }[]`. The `yearlyGPAs` property doesn't exist, so this is always `undefined`, and lines 449-470 (declining/improving trajectory detection) never fire.

**Fix:**
```typescript
const yearlyGPAs = quant.progressionTrajectory.historical.gpaByYear.map(y => y.gpa);
```

**Verify:** Read lines 449-470 to confirm the downstream code works with a `number[]` array.

#### Task 1.3: Fix NACAC Stats Swap (B9)

**File:** `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportService.ts`
**Lines:** 825-830

**Current (swapped):**
```typescript
{ factor: 'Academic GPA', importance: 'Very Important (77% of colleges)', citation: 'NACAC 2023' },
{ factor: 'Grades in college prep courses', importance: 'Very Important (69% of colleges)', citation: 'NACAC 2023' },
```

**Correct values (from NACAC 2023):**
- Academic GPA: 74% (was showing 77%)
- Grades in college prep courses: 77% (was showing 69%)

**Fix:** Swap the percentages AND reorder by importance:
```typescript
{ factor: 'Grades in college prep courses', importance: 'Very Important (77% of colleges)', citation: 'NACAC 2023' },
{ factor: 'Academic GPA', importance: 'Very Important (74% of colleges)', citation: 'NACAC 2023' },
{ factor: 'Rigor of secondary school record', importance: 'Very Important (64% of colleges)', citation: 'NACAC 2023' },
{ factor: 'Standardized test scores', importance: 'Moderately Important (varies by school)', citation: 'NACAC 2023' },
```

#### Task 1.4: Recalibrate Tier Benchmarks (C1 + C4)

**File:** `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportService.ts`
**Lines:** 141-155

Replace the `COLLEGE_TIER_BENCHMARKS` constant and `getTierForGPA()` function with CDS-verified values:

```typescript
const COLLEGE_TIER_BENCHMARKS: TierInfo[] = [
  { name: 'Ivy/Elite (Top 10)', examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale', 'Columbia'], gpaRange: '3.90-4.0', median: 3.96 },
  { name: 'Highly Selective (Top 10-25)', examples: ['Northwestern', 'UCLA', 'UC Berkeley', 'Carnegie Mellon', 'Georgetown', 'Georgia Tech'], gpaRange: '3.80-3.89', median: 3.88 },
  { name: 'Selective (Top 25-60)', examples: ['Boston University', 'UT Austin', 'Purdue', 'Ohio State', 'UMass Amherst', 'UW-Madison'], gpaRange: '3.60-3.79', median: 3.72 },
  { name: 'Competitive (Top 60-150)', examples: ['Arizona State', 'Iowa State', 'University of Oregon', 'Temple University'], gpaRange: '3.20-3.59', median: 3.40 },
  { name: 'Accessible', examples: ['Community colleges', 'Open admission institutions'], gpaRange: '2.00-3.19', median: 2.80 },
];

function getTierForGPA(gpa: number): TierInfo {
  if (gpa >= 3.90) return COLLEGE_TIER_BENCHMARKS[0];
  if (gpa >= 3.80) return COLLEGE_TIER_BENCHMARKS[1];
  if (gpa >= 3.60) return COLLEGE_TIER_BENCHMARKS[2];
  if (gpa >= 3.20) return COLLEGE_TIER_BENCHMARKS[3];
  return COLLEGE_TIER_BENCHMARKS[4];
}
```

**Data source verification:** UCLA UW 3.95-4.00, UC Berkeley UW 3.92, BU avg 3.90, Purdue 25th pct ~3.62, Georgia Tech 4.14 weighted (92.5% had 4.0+). All from CDS 2024-2025 data cited in `docs/AUDIT_RUBRIC_TIER_FINDINGS.md`.

#### Task 1.5: Recalibrate UPLIFT_SCALE_DATABASE Percentiles (C3)

**File:** `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReportTypes.ts`
**Lines:** 211-290

Update ALL 13 grade descriptors with contiguous, non-overlapping percentile bands. The full 0-100% scale (no gaps, no overlaps):

| Grade | Percentile | schoolFit |
|-------|-----------|-----------|
| A+ | Top 1-3% | Ivy League, Stanford, MIT, Caltech — top 5-10 programs |
| A | Top 3-6% | Top 10-20 universities, highly selective LACs, flagship honors |
| A- | Top 6-10% | Competitive at top 20-30, strong match for top 40 |
| B+ | Top 10-17% | Competitive at top 30-50 (NYU, Tulane, Wisconsin, UCSB) |
| B | Top 17-24% | Competitive at top 50-80, large flagships, mid-tier private |
| B- | Top 24-30% | Top 80-120 schools, state universities, regional private |
| C+ | Top 30-45% | Less selective state/private universities |
| C | Top 45-62% | Open-admission and less selective institutions |
| C- | Top 62-80% | CC transfer pathway recommended |
| D+ | Top 80-88% | Community college strongest path |
| D | Top 88-94% | CC with intentional transfer planning |
| D- | Top 94-98% | Stabilization first, college second |
| F | Bottom 2% | Support systems before college planning |

**For each grade descriptor:**
1. Update the `description` field to start with the new percentile (e.g., "Top 1-3% academic profile nationally. ...")
2. Update the `schoolFit` field to match the school competitiveness column above
3. Keep the rest of the descriptive text — just update the percentile prefix and school claims

**IMPORTANT:** Grades C+ through F currently have NO percentile in their description. You must ADD the percentile prefix to each. For example, C+ currently says "The transcript signals underperformance..." — change to "Top 30-45% academic profile. The transcript signals underperformance..."

**Rationale for the scale:** The percentile-to-school mapping is grounded in freshman enrollment capacity. Top 5-10 schools have ~23K seats/year → top 1-3% of 3.7M graduates. Top 30-50 schools have ~120K seats → top 6-17%. See `docs/DEEP_REPORT_REFACTOR_PLAN.md` Percentile Calibration section for full data.

#### Task 1.6: Verify

Run `npx tsc --noEmit` and confirm zero errors. If any type errors appear, fix them — they indicate the bug fixes touched something that needs updating downstream.

### Deliverables

- [ ] B1 fixed (overallGPA calculates correctly)
- [ ] B2 fixed (yearlyGPAs → gpaByYear)
- [ ] B9 fixed (NACAC stats corrected and reordered)
- [ ] C1 fixed (tier benchmarks recalibrated with CDS-verified data)
- [ ] C3 fixed (all 13 grade percentiles + schoolFit strings updated)
- [ ] C4 fixed (Competitive tier has Arizona State, Iowa State, Oregon, Temple)
- [ ] `npx tsc --noEmit` passes with zero errors

---

## TEAMMATE 2: Extract Modules — Context Assembly & Tier Calibration

**Phase:** 2 of 4
**Estimated Time:** 1-1.5 hours
**Dependencies:** Teammate 1 must be complete
**Goal:** Extract reusable modules from the monolith WITHOUT changing behavior. After this phase, the old monolith delegates to the new modules, and the report output is identical.

### Your Tasks

#### Task 2.1: Create Directory Structure

Create the `deepAcademicReport/` directory tree:
```
src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/
├── index.ts
├── types.ts
├── context/
│   ├── contextAssembly.ts
│   └── tierCalibration.ts
├── generators/        (empty for now — Teammate 3 fills these)
├── validation/        (empty for now)
└── fallback/          (empty for now)
```

#### Task 2.2: Extract Tier Calibration (`context/tierCalibration.ts`)

Move FROM `deepAcademicReportService.ts`:
- `TierInfo` interface (line 134)
- `COLLEGE_TIER_BENCHMARKS` constant (lines 141-147, already recalibrated by Teammate 1)
- `getTierForGPA()` function (lines 149-155)
- `calculateTierPosition()` function (lines 157-190)
- `calculateOverallGPA()` helper (lines 113-118)
- `formatSubject()` helper (lines 124-128)

**Add new:** Major disclaimer function:
```typescript
export function getMajorDisclaimer(intendedMajor: string | undefined): string | undefined {
  if (!intendedMajor) return undefined;
  const resolved = resolveStudentInterest(intendedMajor);
  if (!resolved) return undefined;
  const majorName = resolved.matched.major;
  const competitiveMajors = ['Computer Science', 'Engineering', 'Business / Economics', 'Nursing'];
  // Also check parent: if majorName is a child of Engineering, include it
  const isCompetitive = competitiveMajors.some(cm =>
    majorName === cm || resolved.matched.specializationOf === cm
  );
  if (!isCompetitive) return undefined;
  return `Note: ${majorName} programs at selective schools are typically more competitive than general admits. Your tier positioning for ${majorName}-specific programs may be 0.5-1 tier higher than shown.`;
}
```

Export everything. Import `resolveStudentInterest` from the major resolution service.

#### Task 2.3: Extract & Enhance Context Assembly (`context/contextAssembly.ts`)

This is the most important file in Phase 2. It replaces the current `assembleContext()` method (lines 290-334) with a richer version that fixes ALL data pipeline leaks.

**What to assemble:**

```typescript
import type { EnrichedReportContext } from '../types';

export function assembleEnrichedContext(input: DeepAcademicReportInput): EnrichedReportContext {
  // 1. Same 3 upstream calls as current code
  const profileInsights = extractProfileInsights(studentProfile);
  const assembledResearch = assembleResearchForStudent(studentContext);
  const planningAdvice = generateAcademicPlanningAdvice(planningInput);

  // 2. Correct GPA calculation (B1 fix already applied to upstream, but also calculate here)
  const overallGPA = calculateOverallGPA(input.quantitativeAnalysis);

  // 3. Corrected tier position
  const tierPosition = calculateTierPosition(input.quantitativeAnalysis);

  // 4. Major disclaimer (Q3 decision)
  const majorDisclaimer = getMajorDisclaimer(input.intendedMajor);

  // 5. Cherry-picked research fields (Q2 decision — route RIGHT data to RIGHT section)
  const genuineInterestMarkers = assembledResearch.majorExpectations?.genuineInterestMarkers || [];
  const commonMistakes = assembledResearch.majorExpectations?.commonMistakes || [];
  const expectedCourses = assembledResearch.admittedProfile?.expectedCourses || [];

  // 6. Full ProfileInsight fields (H1 fix — don't truncate to observation-only)
  // profileInsights already has all 4 fields; just pass them through

  // 7. ALL student AP courses for Section 4 (B5 fix)
  const allStudentAPCourses = extractAllAPCourses(input.quantitativeAnalysis);

  // 8. trajectoryActionItems (B8 fix)
  const trajectoryActionItems = planningAdvice.trajectoryAssessment?.actionItems || [];

  return {
    quantitativeAnalysis: input.quantitativeAnalysis,
    overallGPA,
    tierPosition,
    majorDisclaimer,
    input,

    forIdentity: {
      profileInsightsFull: profileInsights,  // ALL 4 fields
      genuineInterestMarkers,
      synthesis: input.quantitativeAnalysis.synthesis,
    },
    forChallenges: {
      commonMistakes,
      challengeSubjects: extractChallengeSubjects(input.quantitativeAnalysis),
      verifiedStats: assembledResearch.verifiedStatistics,
      courseRecommendations: planningAdvice.courseRecommendations || [],
    },
    forRoadmap: {
      expectedCourses,
      trajectoryActionItems,
      planningAdvice,
    },
    forResearch: {
      allStudentAPCourses,
      majorRequirements: resolveMajorRequirements(input.intendedMajor),
      relevantAPCourses: assembledResearch.relevantAPCourses,
    },

    // Keep full objects for template fallback compatibility
    assembledResearch,
    planningAdvice,
    profileInsights,
  };
}
```

**Helper functions to include:**
- `extractAllAPCourses()` — iterate ALL `subjectPatterns` courses where `level` includes 'ap' or 'AP'
- `extractChallengeSubjects()` — filter subjects with `relativeStrength < -0.05`, sort, take top 3
- `resolveMajorRequirements()` — call `resolveStudentInterest()` and return mergedRequirements

**IMPORTANT:** Read the current `assembleContext()` at lines 290-334 carefully. Replicate ALL the input construction logic (StudentProfile, StudentContext, AcademicPlanningInput) — don't miss any fields. The `apCoursesAvailable` and `honorsCoursesAvailable` fields in AcademicPlanningInput are currently set to `[]` — keep that for now.

#### Task 2.4: Define Enhanced Types (`types.ts`)

Create `deepAcademicReport/types.ts` with:
1. Re-export all types from `../deepAcademicReportTypes` (the existing types file)
2. Add the `EnrichedReportContext` interface that `contextAssembly.ts` returns
3. Add any helper types needed for per-section data packages (`CommonMistake`, `ExpectedCourse`, etc.)

**Read the upstream types carefully.** The `assembledResearch.majorExpectations` has a specific shape from `fieldSpecificExpectations.ts`. The `commonMistakes` field is `Array<{ mistake: string; whyItHurts: string; howToFix: string }>`. The `genuineInterestMarkers` has `earlySignals`, `developmentPatterns`, `matureIndicators`. Map these correctly.

#### Task 2.5: Wire It Up Temporarily

Update the OLD `deepAcademicReportService.ts` to import and use the new modules:
- Import `calculateOverallGPA`, `calculateTierPosition`, `formatSubject` from `./deepAcademicReport/context/tierCalibration`
- Import `COLLEGE_TIER_BENCHMARKS`, `getTierForGPA` from same
- Remove the duplicated code from the monolith (but keep the class and methods — Teammate 3 will replace them)

**DO NOT change the behavior yet.** The monolith should produce identical output. The new modules are just extracted helpers.

#### Task 2.6: Create Barrel Exports (`index.ts`)

```typescript
export { assembleEnrichedContext } from './context/contextAssembly';
export { calculateTierPosition, calculateOverallGPA, getTierForGPA, COLLEGE_TIER_BENCHMARKS, getMajorDisclaimer } from './context/tierCalibration';
export type { EnrichedReportContext } from './types';
export * from './types';
```

#### Task 2.7: Verify

- `npx tsc --noEmit` passes
- The existing test (`tests/test-deep-academic-report.ts`) still runs and produces output (don't need to verify output quality — just that it doesn't crash)

### Deliverables

- [ ] `deepAcademicReport/` directory with context/, generators/, validation/, fallback/ subdirs
- [ ] `context/tierCalibration.ts` — all tier logic extracted + major disclaimer
- [ ] `context/contextAssembly.ts` — enhanced context with per-section data routing (H1, B5, B8, D1, D2 fixes)
- [ ] `types.ts` — EnrichedReportContext + re-exports
- [ ] `index.ts` — barrel exports
- [ ] Monolith updated to import from new modules (no behavior change)
- [ ] `npx tsc --noEmit` passes

---

## TEAMMATE 3: Generators, Orchestrator, Validation & Fallback

**Phase:** 3 of 4
**Estimated Time:** 2-2.5 hours
**Dependencies:** Teammate 2 must be complete
**Goal:** Build all 5 generators, the orchestrator, post-processing validator, and improved fallback. This is the largest phase — it replaces the monolith's LLM logic entirely.

### Your Tasks

#### Task 3.1: Identity Generator (`generators/identityGenerator.ts`)

Port the prompt from `deepAcademicReportService.ts` lines 340-470 into a standalone function:

```typescript
export async function generateAcademicIdentity(
  ctx: EnrichedReportContext,
  trackUsage: (usage: any) => void
): Promise<AcademicIdentitySection> { ... }
```

**Prompt improvements to apply (read `docs/OUTPUT_QUALITY_AUDIT.md` for full context):**

1. **A3 — Weakness brevity:** Change the notableWeaknesses JSON schema to enforce word limits:
   ```
   "gap": "MAX 25 WORDS. The gap stated as a fact. Do NOT mention specific schools or courses — Section 2 covers those."
   "consequence": "MAX 20 WORDS. The cost, briefly. Do NOT mention specific schools or courses."
   ```

2. **A4 — Difficulty clarity:** Update the DIFFICULTY IMPACT line to distinguish average from subject-specific:
   ```
   DIFFICULTY IMPACT: Typical ${impact} GPA drop when increasing level (this is the AVERAGE across all subjects — calculate subject-specific drops from actual grades above, e.g., Chem Honors 3.70 → AP Chem 3.00 = 0.70 drop, NOT ${impact}.)
   ```

3. **A5 — Metric explanations:** Add to CRITICAL RULES:
   ```
   4. When using metrics like "consistency score," "strength signal," or "percentile," ALWAYS explain what the number measures and provide a benchmark. Example: "Your 73% consistency score (above the 60% threshold for 'predictable performer') means..." Do NOT drop raw numbers without context.
   ```

4. **A6 — Speculative claims:** Add to CRITICAL RULES:
   ```
   5. The "strengthTier" and "weaknessTier" are ILLUSTRATIVE comparisons to show the spread in your profile — NOT predictions. Frame them as "if your entire transcript matched your CS performance" rather than "your CS GPA places you at Harvard."
   ```

5. **H1 fix — Full ProfileInsights:** Replace the current truncated version:
   ```
   // BEFORE: ctx.profileInsights.map(i => `- ${i.observation}`).join('\n')
   // AFTER:
   KEY INSIGHTS FROM ANALYSIS:
   ${ctx.forIdentity.profileInsightsFull.map(i =>
     `- ${i.observation}\n  Interpretation: ${i.interpretation}\n  Implication: ${i.strategicImplication}`
   ).join('\n')}
   ```

6. **D1 fix — Genuine interest markers:** Add new section to user prompt:
   ```
   GENUINE INTEREST MARKERS FOR ${ctx.input.intendedMajor || 'their field'}:
   ${ctx.forIdentity.genuineInterestMarkers.length > 0
     ? ctx.forIdentity.genuineInterestMarkers.map(m => `- ${m}`).join('\n')
     : 'No major-specific markers available.'}
   ```

7. **D2 fix — Major disclaimer:** If `ctx.majorDisclaimer` exists, append it to the tier position data sent to the LLM.

**Keep everything else from the existing prompt.** The system prompt structure, JSON output format, course list, synthesis data, uplift scale reference — all stay. You're enhancing, not rewriting from scratch.

#### Task 3.2: Challenges Generator (`generators/challengesGenerator.ts`)

Port from lines 476-615.

```typescript
export async function generateChallengesAndReality(
  ctx: EnrichedReportContext,
  trackUsage: (usage: any) => void
): Promise<ChallengesAndRealitySection> { ... }
```

**Prompt improvements:**

1. **A1 — AP/GPA conflation guard (complete rewrite of DATA ACCURACY section):**
   ```
   DATA ACCURACY — HARD RULES (violations make the report factually incorrect):
   - AP pass rates measure AP EXAM performance (scores 1-5, where 3+ = passing). Class GPA is on a 4.0 scale. These are COMPLETELY UNRELATED metrics.
   - NEVER write a sentence that puts an AP exam pass rate and a student's class GPA in the same paragraph or logical chain. Example of what NOT to do: "62% of AP Statistics test-takers score 3+ on the exam, yet you earned a 3.30 in the class." This sentence is MEANINGLESS — a 3.30 class GPA and a score of 3+ on the AP exam are not comparable.
   - When citing AP statistics, ONLY use them to characterize course difficulty (e.g., "AP Physics C has a 76% exam pass rate, indicating it's accessible for prepared students") — NOT to evaluate a student's class grade.
   - Only cite statistics from the VERIFIED STATISTICS section provided. Do not invent or extrapolate.
   ```

2. **A2 — Major-relevance filter:** Replace the "Focus on 2-3 DISTINCT challenges" instruction:
   ```
   Focus on 2-3 DISTINCT challenges. PRIORITIZE challenges that matter most for the student's intended major. For a CS applicant, focus on STEM readiness, CS progression depth, and math/science foundation — not Social Studies. Only include non-major-relevant challenges if they represent a truly alarming pattern (e.g., failing grades across areas). Each challenge must cover a genuinely different concern.
   ```

3. **A7 — Stat dedup:** Add to CRITICAL RULES:
   ```
   7. Each statistic from VERIFIED STATISTICS may be cited in AT MOST ONE challenge. Do not reuse the same data point across challenges.
   ```

4. **D1 fix — Common mistakes:** Add new section to user prompt:
   ```
   COMMON MISTAKES FOR ${ctx.input.intendedMajor || 'applicants'} (from admissions research):
   ${ctx.forChallenges.commonMistakes.length > 0
     ? ctx.forChallenges.commonMistakes.map(m =>
         `- MISTAKE: ${m.mistake}\n  WHY IT HURTS: ${m.whyItHurts}\n  HOW TO FIX: ${m.howToFix}`
       ).join('\n')
     : 'No major-specific common mistakes available.'}
   ```

5. **D2 fix — Major disclaimer in tier impact:** If `ctx.majorDisclaimer` exists, add it to the student's tier context so the LLM can reference it in tier impact analysis.

#### Task 3.3: Roadmap Generator (`generators/roadmapGenerator.ts`)

Port from lines 621-748.

```typescript
export async function generateStrategicRoadmap(
  ctx: EnrichedReportContext,
  trackUsage: (usage: any) => void
): Promise<StrategicRoadmapSection> { ... }
```

**Prompt improvements:**

1. **B8 fix — trajectoryActionItems:** Add to user prompt:
   ```
   TRAJECTORY ACTION ITEMS (from analysis):
   ${ctx.forRoadmap.trajectoryActionItems.length > 0
     ? ctx.forRoadmap.trajectoryActionItems.map(a => `- ${a}`).join('\n')
     : 'None identified.'}
   ```

2. **D1 fix — Expected courses from admittedProfile:** Add to user prompt:
   ```
   EXPECTED COURSES FOR ${ctx.input.intendedMajor || 'college-bound students'}:
   ${ctx.forRoadmap.expectedCourses.length > 0
     ? ctx.forRoadmap.expectedCourses.map(c =>
         `- ${c.course} [${c.expectationLevel}]: ${c.reasoning}`
       ).join('\n')
     : 'No major-specific course expectations available.'}
   ```

3. **Progression awareness:** Add to COURSE RECOMMENDATION QUALITY:
   ```
   - Check the student's EXISTING courses before recommending. If they earned 4.0 in AP Computer Science A, do NOT recommend AP Computer Science Principles (a step backward). Recommend forward progression: dual enrollment CS, independent research, or competition-level work.
   ```

#### Task 3.4: Research Generator (`generators/researchGenerator.ts`)

Port from lines 754-838. This is a TEMPLATE (no LLM), so it's straightforward.

**B5 fix:** The current code only includes courses from `assembledResearch.relevantAPCourses`. Add ALL AP courses the student actually took:

```typescript
// Get courses from relevantAPCourses (existing behavior)
const apStatistics = ctx.forResearch.relevantAPCourses.map(c => { ... });

// B5 fix: Also include any AP courses the student took that aren't in relevantAPCourses
const coveredCourses = new Set(apStatistics.map(s => s.course.toLowerCase()));
for (const apCourse of ctx.forResearch.allStudentAPCourses) {
  if (!coveredCourses.has(apCourse.name.toLowerCase())) {
    apStatistics.push({
      course: apCourse.name,
      passRate: 'N/A',
      fiveRate: 'N/A',
      citation: 'Student transcript',
      studentGrade: apCourse.grade.toFixed(2),
      studentContext: `You took this course and earned ${apCourse.grade.toFixed(2)}.`,
    });
  }
}
```

**B9 fix:** The corrected NACAC stats are already in the monolith from Teammate 1. Copy them as-is.

#### Task 3.5: Bottom Line Generator (`generators/bottomLineGenerator.ts`) — NEW

This is a **new** file. It replaces the current `buildBottomLine()` extraction (lines 844-864) with a dedicated Haiku synthesis call.

```typescript
import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import type { BottomLineSummary, AcademicIdentitySection, ChallengesAndRealitySection, StrategicRoadmapSection } from '../types';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function generateBottomLine(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  roadmap: StrategicRoadmapSection,
  trackUsage: (usage: any) => void
): Promise<BottomLineSummary> {
  const systemPrompt = `You are writing an executive summary for a student's academic report. Write 5 concise bullets that a student can read INDEPENDENTLY of the full report. Each bullet must be self-contained.

RULES:
1. SYNTHESIZE across sections — do NOT copy phrases or sentences from the input.
2. Each bullet: MAX 30 words. Be punchy and specific.
3. The "rating" bullet states the grade and one sentence of what it means.
4. The "positioning" bullet names the tier and 2-3 example schools, plus what it takes to move up.
5. The "biggestStrength" bullet names the strength and what it signals in 1 sentence.
6. The "biggestRisk" bullet names the risk and its consequence in 1 sentence.
7. The "topAction" bullet names the #1 action and why it's #1.

Output valid JSON:
{
  "rating": "Uplift Rating: [grade] — [label]. [one sentence]",
  "positioning": "[tier] ([2-3 schools]). [what it takes to reach next tier — max 15 words].",
  "biggestStrength": "[subject]: [what it signals — max 20 words].",
  "biggestRisk": "[risk name]: [consequence — max 20 words].",
  "topAction": "#1: [action] — [why — max 15 words]."
}`;

  const userPrompt = `Synthesize this academic report into 5 executive summary bullets:

UPLIFT RATING: ${identity.upliftRating.grade} — ${identity.upliftRating.explanation}

TIER: ${identity.tierPosition.currentTier}
TIER EXAMPLES: ${identity.tierPosition.tierExamples.join(', ')}
TIER GAP: ${identity.tierPosition.tierGap}

TOP STRENGTH: ${identity.notableStrengths[0]?.subject || 'None'} — ${identity.notableStrengths[0]?.insight || 'N/A'}

TOP CHALLENGE: ${challenges.challenges[0]?.title || 'None'} — ${challenges.challenges[0]?.tierImpact || 'N/A'}

TOP PRIORITY: ${roadmap.priorities[0]?.title || 'None'} — ${roadmap.priorities[0]?.description || 'N/A'}`;

  const response = await callClaude<string>({
    model: HAIKU_MODEL,
    systemPrompt,
    userPrompt,
    maxTokens: 512,
    temperature: 0.2,
  });

  trackUsage(response.usage);
  return parseClaudeJSON<BottomLineSummary>(response.content, 'bottomLine');
}
```

**Key design decisions:**
- Haiku model (~$0.001, ~3-5s) — fast and cheap
- Receives SUMMARIZED section data, not raw data — prevents verbatim copying
- MAX 30 words per bullet enforced in prompt
- Temperature 0.2 for consistency
- Runs AFTER sections complete (sequential, not parallel)

#### Task 3.6: Post-Processing Validator (`validation/postProcessing.ts`) — NEW

```typescript
export interface ValidationResult {
  issues: ValidationIssue[];
  cleaned: {
    challenges: ChallengesAndRealitySection;
    identity: AcademicIdentitySection;
  };
}

export interface ValidationIssue {
  type: 'ap_gpa_conflation' | 'stat_duplication' | 'gpa_mismatch' | 'low_relevance_challenge';
  severity: 'error' | 'warning';
  section: string;
  description: string;
  action: 'stripped' | 'flagged';
}

export function validateReportOutput(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  intendedMajor?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const cleanedChallenges = structuredClone(challenges);
  const cleanedIdentity = structuredClone(identity);

  // 1. AP exam rate / class GPA conflation detection
  // Look for sentences containing BOTH "test-takers" or "score 3+" AND a GPA-like number (x.xx)
  for (const challenge of cleanedChallenges.challenges) {
    for (const field of ['issue', 'aoImpact', 'tierImpact'] as const) {
      const text = challenge[field];
      if (hasAPGPAConflation(text)) {
        issues.push({
          type: 'ap_gpa_conflation',
          severity: 'error',
          section: `challenges.${challenge.title}.${field}`,
          description: `Detected AP exam rate mixed with class GPA: "${text.slice(0, 80)}..."`,
          action: 'stripped',
        });
        // Strip the conflated sentence
        challenge[field] = stripConflatedSentences(text);
      }
    }
  }

  // 2. Stat duplication across challenges
  const statCitations = new Map<string, string>(); // stat value → first challenge title
  for (const challenge of cleanedChallenges.challenges) {
    for (const citation of challenge.researchBacking) {
      if (statCitations.has(citation.value)) {
        issues.push({
          type: 'stat_duplication',
          severity: 'warning',
          section: `challenges.${challenge.title}`,
          description: `Stat "${citation.value}" also used in "${statCitations.get(citation.value)}"`,
          action: 'flagged',
        });
      } else {
        statCitations.set(citation.value, challenge.title);
      }
    }
  }

  // 3. Low-relevance challenge detection (if major is known)
  // ... flag challenges that don't mention major-relevant subjects

  return { issues, cleaned: { challenges: cleanedChallenges, identity: cleanedIdentity } };
}
```

**Helper functions:**
- `hasAPGPAConflation(text)` — regex: contains ("test-takers" OR "score 3+" OR "pass rate") AND a class GPA pattern (e.g., "earned a 3.30" or "you earned X.XX")
- `stripConflatedSentences(text)` — split on sentence boundaries, remove sentences matching the conflation pattern, rejoin

#### Task 3.7: Orchestrator (`orchestrator.ts`)

This replaces the `DeepAcademicReportService` class entirely.

```typescript
export async function generateDeepAcademicReport(
  input: DeepAcademicReportInput
): Promise<DeepAcademicReport> {
  const startTime = Date.now();

  // Request-scoped cost tracking (B7 fix — no singleton)
  let accumulatedCost = 0;
  let accumulatedTokens = { input: 0, output: 0 };
  const trackUsage = (usage: any) => {
    if (!usage) return;
    const inp = usage.input_tokens || 0;
    const out = usage.output_tokens || 0;
    accumulatedTokens.input += inp;
    accumulatedTokens.output += out;
    accumulatedCost += (inp / 1_000_000) * 3 + (out / 1_000_000) * 15;
  };

  // Step 1: Assemble enriched context
  const ctx = assembleEnrichedContext(input);

  // Step 2: Template section (always works)
  const researchContext = generateResearchContext(ctx);

  // Step 3: Parallel LLM sections with Promise.allSettled (B6 fix)
  const [identityResult, challengesResult, roadmapResult] = await Promise.allSettled([
    generateAcademicIdentity(ctx, trackUsage),
    generateChallengesAndReality(ctx, trackUsage),
    generateStrategicRoadmap(ctx, trackUsage),
  ]);

  // Handle partial failures
  let usedFallback = false;
  const sectionSources: Record<string, 'llm' | 'template'> = { researchContext: 'template' };
  const fallback = null; // lazy-init only if needed

  const identity = extractOrFallback(identityResult, 'academicIdentity', ...);
  const challenges = extractOrFallback(challengesResult, 'challengesAndReality', ...);
  const roadmap = extractOrFallback(roadmapResult, 'strategicRoadmap', ...);

  // Step 4: Post-processing validation (D4)
  const validation = validateReportOutput(identity, challenges, input.intendedMajor);
  if (validation.issues.length > 0) {
    console.warn(`[DeepAcademicReport] Post-processing found ${validation.issues.length} issues:`,
      validation.issues.map(i => `${i.type}: ${i.description}`).join('; '));
  }
  const cleanIdentity = validation.cleaned.identity;
  const cleanChallenges = validation.cleaned.challenges;

  // Step 5: Bottom Line synthesis (D3 — Haiku call, runs AFTER sections)
  const bottomLine = await generateBottomLine(cleanIdentity, cleanChallenges, roadmap, trackUsage);

  // Step 6: Assemble final report
  return {
    bottomLine,
    academicIdentity: cleanIdentity,
    challengesAndReality: cleanChallenges,
    strategicRoadmap: roadmap,
    researchContext,
    metadata: {
      generationTimeMs: Date.now() - startTime,
      estimatedCost: accumulatedCost,
      tokenUsage: { ...accumulatedTokens },
      sectionSources,
      usedFallback,
    },
  };
}
```

**For `extractOrFallback()`:** If a `PromiseSettledResult` is `fulfilled`, use its value. If `rejected`, log the error and generate that section from the template fallback. Set `sectionSources[section] = 'template'` and `usedFallback = true`.

#### Task 3.8: Template Fallback (`fallback/templateFallback.ts`)

Port from lines 870-987. Update to use the new tier benchmarks and correct GPA calculation. Use `calculateOverallGPA()` from tierCalibration, not a local copy.

The fallback grade logic (line 891) should use the same `UPLIFT_SCALE_DATABASE` with the updated percentiles from Teammate 1.

#### Task 3.9: Wire Everything Together

1. Update `deepAcademicReport/index.ts` to export `generateDeepAcademicReport` from `orchestrator.ts`
2. Update `capability/index.ts` (lines 336-338) to import from `'./deepAcademicReport'` instead of `'./deepAcademicReportService'`
3. Keep the old `deepAcademicReportService.ts` file for reference but it should no longer be imported by anything

#### Task 3.10: Verify

- `npx tsc --noEmit` passes
- Run `npx tsx tests/test-deep-academic-report.ts` — should produce a complete report without crashing
- Verify the output has all 5 sections (bottomLine, academicIdentity, challengesAndReality, strategicRoadmap, researchContext)
- Verify Bottom Line bullets are concise (not 60-70 word paragraphs)
- Check console for any post-processing validation warnings

### Deliverables

- [ ] `generators/identityGenerator.ts` with all prompt improvements (A3, A4, A5, A6, H1, D1, D2)
- [ ] `generators/challengesGenerator.ts` with all prompt improvements (A1, A2, A7, D1, D2)
- [ ] `generators/roadmapGenerator.ts` with all prompt improvements (B8, D1, progression awareness)
- [ ] `generators/researchGenerator.ts` with B5 fix (full AP coverage) and corrected NACAC stats
- [ ] `generators/bottomLineGenerator.ts` — NEW Haiku synthesis (eliminates R1, R2, R3, D3)
- [ ] `validation/postProcessing.ts` — NEW (catches A1 violations, stat duplication)
- [ ] `orchestrator.ts` — Promise.allSettled (B6), request-scoped tracking (B7), validation pipeline
- [ ] `fallback/templateFallback.ts` — updated with corrected tiers
- [ ] `capability/index.ts` updated to use new module
- [ ] `npx tsc --noEmit` passes
- [ ] Test runs and produces complete report

---

## TEAMMATE 4: Polish, Verify & Document

**Phase:** 4 of 4
**Estimated Time:** 30-45 minutes
**Dependencies:** Teammate 3 must be complete
**Goal:** Final calibration, end-to-end quality verification, and handoff documentation.

### Your Tasks

#### Task 4.1: Verify schoolFit String Consistency (C2)

Read the updated `UPLIFT_SCALE_DATABASE` in `deepAcademicReportTypes.ts` (updated by Teammate 1) and verify each `schoolFit` string matches the percentile and school competitiveness from the plan:

| Grade | Percentile | Expected schoolFit Theme |
|-------|-----------|-------------------------|
| A+ | Top 1-3% | Ivy League, Stanford, MIT, Caltech — top 5-10 |
| A | Top 3-6% | Top 10-20 universities, highly selective LACs |
| A- | Top 6-10% | Competitive at top 20-30, strong match for top 40 |
| B+ | Top 10-17% | Competitive at top 30-50 (NYU, Tulane, Wisconsin, UCSB) |
| B | Top 17-24% | Competitive at top 50-80, large flagships |
| B- | Top 24-30% | Top 80-120, state universities, regional private |
| C+ | Top 30-45% | Less selective state/private |
| C-F | ... | Progressively more limited options |

If any `schoolFit` string contradicts its percentile band, fix it. For example, if B+ still says "top-50 universities" (old value), update to "Competitive at top 30-50 schools like NYU, Tulane, and Wisconsin."

#### Task 4.2: Verify Template Fallback (D5)

Read `fallback/templateFallback.ts` and verify:
1. It uses the corrected tier benchmarks (3.90/3.80/3.60/3.20)
2. School examples in fallback output match `COLLEGE_TIER_BENCHMARKS`
3. The fallback grade calculation logic is reasonable
4. It handles edge cases: no strengths, no weaknesses, no major, empty subject patterns

#### Task 4.3: Run E2E Test and Evaluate Output

Run `npx tsx tests/test-deep-academic-report.ts` (costs ~$0.13, takes ~60s).

Evaluate the output against ALL 32 issues. Check specifically:

**Must be fixed (critical):**
- [ ] Bottom Line bullets are concise (~30 words each), NOT verbatim copies of section content
- [ ] No AP exam rate compared to class GPA in any challenge
- [ ] Tier values use the new benchmarks (3.90/3.80/3.60/3.20)
- [ ] Percentile claims match the new contiguous scale

**Should be improved (high):**
- [ ] Section 1 weaknesses are 1+1 sentences, not 3-sentence mini-analyses
- [ ] Challenges are major-relevant (no Social Studies for CS applicant)
- [ ] No stat cited more than once across challenges
- [ ] Chemistry drop stated as 0.70 (not 0.55)

**Nice to have:**
- [ ] Metrics are explained with benchmarks
- [ ] Strength/weakness tiers framed as illustrative
- [ ] Major disclaimer appears in tier position for CS major

If any critical issues persist, fix the relevant generator prompt and note what you changed.

#### Task 4.4: Update Test File

Update `tests/test-deep-academic-report.ts` to:
1. Import from the new module path
2. Add a simple assertion that Bottom Line bullets are each < 200 characters
3. Add a simple assertion that the report has all 5 sections
4. Log the validation issues (if any) from post-processing

Also update `tests/generate-deep-report-output.ts` if it exists and imports from the old path.

#### Task 4.5: Write Handoff Documentation

Create `docs/DEEP_REPORT_CONTEXT_HANDOFF.md` documenting:
1. The new file structure with one-line descriptions
2. How to add a new section generator
3. How to add a new post-processing rule
4. How the data routing works (EnrichedReportContext → per-section packages)
5. How to update tier benchmarks when new CDS data is available
6. Cost and runtime characteristics

#### Task 4.6: Clean Up

1. Verify the old `deepAcademicReportService.ts` is no longer imported anywhere. If confirmed, add a comment at the top: `// DEPRECATED: replaced by deepAcademicReport/ module. This file is kept for reference only.`
2. Remove any TODO comments or debugging `console.log`s added during implementation
3. Final `npx tsc --noEmit` pass

### Deliverables

- [ ] All `schoolFit` strings verified/corrected (C2)
- [ ] Template fallback verified with correct tiers (D5)
- [ ] E2E test run with output evaluation
- [ ] Test files updated with new imports and assertions
- [ ] `docs/DEEP_REPORT_CONTEXT_HANDOFF.md` created
- [ ] Old monolith marked as deprecated
- [ ] Final `npx tsc --noEmit` passes
- [ ] Zero critical issues remaining in output

---

## EXECUTION NOTES

### Sequential Order Is Mandatory

Teammates MUST run in order: 1 → 2 → 3 → 4. Each phase builds on the previous:
- Teammate 2 needs Teammate 1's recalibrated constants
- Teammate 3 needs Teammate 2's extracted modules and types
- Teammate 4 needs Teammate 3's complete generator pipeline

### Cost Expectations

- Teammate 3 will make LLM API calls during testing. Expected cost: ~$0.13-0.15 per test run.
- Teammate 4's E2E test: ~$0.13-0.15.
- Total API cost for the implementation: ~$0.30-0.50.

### If Something Goes Wrong

- **Type errors after Phase 1:** The bug fixes may reveal downstream type issues. Fix them — they're real bugs exposed by the fix.
- **Import cycles in Phase 2:** The new modules import from upstream services. If circular imports appear, re-export through the barrel `index.ts` files.
- **LLM output doesn't match expected format in Phase 3:** The `parseClaudeJSON` utility handles robust extraction. If it fails, check that the system prompt's JSON schema matches the TypeScript type exactly.
- **Post-processing catches too many false positives:** Adjust the regex patterns in `hasAPGPAConflation()`. It should only match sentences that contain BOTH exam-rate language AND class-GPA language.

### Definition of Done

The implementation is complete when:
1. `npx tsc --noEmit` passes with zero errors
2. The E2E test produces a full report with all 5 sections
3. Bottom Line bullets are < 200 characters each (not verbatim copies)
4. No AP exam rate / class GPA conflation in output
5. All 30 of 32 issues are addressed (D6 and D7 intentionally deferred)
6. The old monolith is no longer in the import chain
7. Handoff documentation exists
