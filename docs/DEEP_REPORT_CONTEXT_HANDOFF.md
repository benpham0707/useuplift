# Deep Academic Report — Full Context Handoff

> **Purpose:** Everything a new Claude Code session needs to continue development on the Deep Academic Report with full depth and rigor. Read this before making any changes.

---

## 1. WHAT THIS SYSTEM IS

The Deep Academic Report is a **teaching-depth academic profile** that tells high school students what admissions officers see in their transcript — and what to do about it. It's part of the Uplift college application platform.

**Philosophy:** The report TEACHES, not restates. Every sentence must contain data, a concrete insight, or an actionable recommendation. No fluff, no rhetorical questions, no "you probably think..." framing.

**Cost:** ~$0.12-0.15 per report (3 Sonnet calls in parallel + 1 Haiku call)
**Speed:** ~15-30 seconds
**Models:** `claude-sonnet-4-5-20250929` for sections 1-3, `claude-haiku-4-5-20251001` for bottom line synthesis

---

## 2. REPORT STRUCTURE (4 sections + Bottom Line)

```
+-----------------------------------------------------+
|  THE BOTTOM LINE (5 bullets, Haiku synthesis)         |
|  - Uplift Rating (B+, A-, etc.)                      |
|  - Tier positioning + school names                   |
|  - Biggest strength + what it signals                |
|  - Biggest risk + tier cost                          |
|  - #1 action item                                    |
+-----------------------------------------------------+
|  SECTION 1: Academic Identity (Sonnet LLM)            |
|  - 1-2 paragraph narrative (who you are + trajectory)|
|  - 2-3 Notable Strengths (non-obvious signals)       |
|  - 1-2 Notable Weaknesses (brief previews)           |
|  - College Tier Position (with school names)          |
|  - Uplift Rating (A+ through F, holistic)            |
+-----------------------------------------------------+
|  SECTION 2: Challenges & Admissions Reality (Sonnet)  |
|  - What AOs See First (30-second impression)         |
|  - 2-3 Challenges (issue + AO impact + tier impact)  |
|  - Unintended Narrative (accidental story)            |
|  - Narrative Control Strategy (how to fix it)        |
+-----------------------------------------------------+
|  SECTION 3: Strategic Roadmap (Sonnet LLM)            |
|  - 3 Priorities (critical/high/moderate)             |
|  - Course Strategy (recommended + avoid)             |
|  - Major Alignment (0-100 score)                     |
|  - Trajectory Optimization (biggest GPA lever)       |
+-----------------------------------------------------+
|  SECTION 4: Research Context (template, no LLM)       |
|  - AP Statistics (with student's grade + context)    |
|  - College Tier Expectations                         |
|  - Major Requirements (from resolution service)      |
|  - NACAC Admissions Factors                          |
+-----------------------------------------------------+
```

---

## 3. KEY FILES — Modular Architecture

The report was refactored from a 1001-line monolith into a 12-file modular structure:

**Path prefix:** `src/services/portfolioStrategy/services/academicWorkshop/capability/`

```
deepAcademicReport/
├── index.ts                          # Barrel exports (entry point)
├── orchestrator.ts                   # Main pipeline: context → parallel LLM → validate → synthesize
├── types.ts                          # EnrichedReportContext + re-exports from parent types
├── context/
│   ├── contextAssembly.ts            # assembleEnrichedContext() — 3 upstream calls → section-specific packages
│   └── tierCalibration.ts            # GPA-to-tier mapping, COLLEGE_TIER_BENCHMARKS, calculateOverallGPA
├── generators/
│   ├── identityGenerator.ts          # Section 1: Academic Identity (Sonnet)
│   ├── challengesGenerator.ts        # Section 2: Challenges & Admissions Reality (Sonnet)
│   ├── roadmapGenerator.ts           # Section 3: Strategic Roadmap (Sonnet)
│   ├── researchGenerator.ts          # Section 4: Research Context (template, $0)
│   └── bottomLineGenerator.ts        # Bottom Line: Haiku synthesis (NEW)
├── validation/
│   └── postProcessing.ts             # AP/GPA conflation + stat dedup detection
└── fallback/
    └── templateFallback.ts           # Deterministic fallback when LLM fails
```

| Other Key Files | Purpose |
|----------------|---------|
| `deepAcademicReportTypes.ts` | All type definitions: `DeepAcademicReport`, `BottomLineSummary`, section types, `UPLIFT_SCALE_DATABASE` |
| `deepAcademicReportService.ts` | **DEPRECATED** — old monolith kept for reference only |
| `tests/academic/test-deep-academic-report.ts` | E2E test with mock Sarah Chen (CS, 11th grade) |
| `tests/harness/generate-deep-report-output.ts` | Generates markdown report to stdout |

---

## 4. ARCHITECTURE: HOW THE REPORT IS BUILT

### Step 1: Assemble Enriched Context (~5ms, no LLM)

`assembleEnrichedContext(input)` makes 3 upstream calls and routes data into section-specific packages:

```
NuancedCapabilityAnalysis (input)
    ├── extractProfileInsights()         → ProfileInsight[] (observation + interpretation + implication)
    ├── assembleResearchForStudent()     → AssembledResearch (AP stats, expectations, major info)
    └── generateAcademicPlanningAdvice() → AcademicPlanningAdvice (course recs, workload, alignment)

Then routes into:
    ├── forIdentity: { profileInsightsFull, genuineInterestMarkers, synthesis }
    ├── forChallenges: { commonMistakes, verifiedStats, courseRecommendations }
    ├── forRoadmap: { expectedCourses, trajectoryActionItems, planningAdvice }
    └── forResearch: { allStudentAPCourses, majorRequirements, relevantAPCourses }
```

### Step 2: Generate Research Context (template, $0)

`generateResearchContext(ctx)` — pure data, no LLM. AP stats with student grades, tier expectations, NACAC factors.

### Step 3: Parallel LLM Generation (Promise.allSettled)

```typescript
const [identity, challenges, roadmap] = await Promise.allSettled([
    generateAcademicIdentity(ctx, trackUsage),       // Sonnet
    generateChallengesAndReality(ctx, trackUsage),   // Sonnet
    generateStrategicRoadmap(ctx, trackUsage),        // Sonnet
]);
// Partial failure: any section that fails → template fallback for that section only
```

### Step 4: Post-Processing Validation

`validateReportOutput(identity, challenges)`:
- **AP/GPA conflation detection** — strips sentences comparing exam pass rates with class GPAs
- **Stat duplication detection** — flags same percentage appearing in multiple challenges

### Step 5: Bottom Line Synthesis (Haiku)

`generateBottomLine(identity, challenges, roadmap)` — Haiku call that synthesizes independent bullets across sections. Falls back to deterministic extraction if Haiku fails. Each bullet MAX 30 words.

### Step 6: Assemble Final Report

Request-scoped metadata: timing, cost, token usage, section sources (llm/template), fallback flag.

---

## 5. UPSTREAM SERVICES

| Service | Function | Returns |
|---------|----------|---------|
| `nuancedCapabilityAnalyzer` | Input data | `NuancedCapabilityAnalysis`: subject patterns, fingerprint, challenge response, trajectory, envelope, synthesis |
| `insightDrivenAdvisor` | `extractProfileInsights(profile)` | `ProfileInsight[]`: observation + interpretation + strategic implication + evidence |
| `unifiedResearchAssemblyService` | `assembleResearchForStudent(ctx)` | `AssembledResearch`: verified stats, AP courses, college expectations, major expectations |
| `academicPlanningAdvisor` | `generateAcademicPlanningAdvice(input)` | `AcademicPlanningAdvice`: course recs, workload, major alignment, red flags, opportunities |
| `majorResolutionService` | `resolveStudentInterest(interest)` | `ResolvedMajor`: matched major with merged requirements (parent+child for specializations) |

---

## 6. COLLEGE TIER BENCHMARKS (CDS 2024-2025 calibrated)

```
Ivy/Elite (Top 10):         GPA 3.90-4.0  median 3.96  → Harvard, Stanford, MIT, Princeton, Yale, Columbia
Highly Selective (Top 10-25): GPA 3.80-3.89 median 3.88  → Northwestern, UCLA, UC Berkeley, Carnegie Mellon, Georgetown, Georgia Tech
Selective (Top 25-60):       GPA 3.60-3.79 median 3.72  → Boston U, UT Austin, Purdue, Ohio State, UMass Amherst, UW-Madison
Competitive (Top 60-150):    GPA 3.20-3.59 median 3.40  → Arizona State, Iowa State, U of Oregon, Temple
Accessible:                  GPA 2.00-3.19 median 2.80  → Community colleges, open admission
```

### UPLIFT_SCALE_DATABASE (13 grades, contiguous percentile bands)

```
A+ (Top 1-3%)   → Ivy League, Stanford, MIT, top 5-10 programs
A  (Top 3-6%)   → Top 10-20, highly selective LACs, flagship honors
A- (Top 6-10%)  → Top 20-30, strong match top 40, selective state
B+ (Top 10-17%) → Top 30-50 (NYU, Tulane, Wisconsin, UCSB), strong match top 80
B  (Top 17-24%) → Top 50-80, large state flagships, mid-tier privates
B- (Top 24-30%) → Top 80-120, state universities, regional privates
C+ (Top 30-45%) → Less selective state/private universities
C  (Top 45-62%) → Open-admission and less selective
C- (Top 62-80%) → Community college transfer pathway
D+ (Top 80-88%) → Community college primary path
D  (Top 88-94%) → Community college with transfer planning
D- (Top 94-98%) → Stabilization focus, then college
F  (Bottom 2%)  → Immediate intervention needed
```

---

## 7. CRITICAL PATTERNS & RULES

### GPA Calculation
`NuancedCapabilityAnalysis` has NO `overallGPA` property. Must calculate:
```typescript
const patterns = Object.values(analysis.subjectPatterns);
const overallGPA = patterns.length > 0
  ? patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0) / patterns.length
  : 3.5;
```

### Section Scope Ownership (prevents repetition)
- **Section 1 OWNS:** Identity, tier positioning, trajectory meaning, Uplift rating, brief weakness previews
- **Section 2 OWNS:** Detailed challenge breakdowns, AO interpretation, tier impact per challenge, unintended narrative
- **Section 3 OWNS:** Course recommendations, priorities, major alignment, trajectory optimization
- **Section 4 OWNS:** Verified data (no interpretation)
- Each prompt explicitly declares what it owns and must NOT duplicate.

### AP Pass Rate != Class Grade
AP pass rates measure AP EXAM performance (scores 3+). They are NOT class grades. The Challenges prompt includes explicit anti-conflation rules with examples of what NOT to do. Post-processing validation catches violations.

### Hallucination Prevention
Every LLM prompt includes:
1. **Complete course list** with grades — "do NOT claim they are missing any of these"
2. **Grounding instruction** — "Only reference courses the student has ACTUALLY taken"
3. **Verified statistics** — "Only cite statistics from the VERIFIED STATISTICS section provided"

### Course Recommendation Quality
- Courses must represent PROGRESSION, not regression (no CSP after CS A)
- Expected outcomes reference student's specific past performance
- Workload consistency between priorities and course count
- Challenges and Roadmap must not contradict each other

---

## 8. KEY IMPROVEMENTS (Audit Fixes Implemented)

### Bug Fixes
- **B1:** `overallGPA` always fell back to 3.5 — now calculated from subjectPatterns
- **B2:** `yearlyGPAs` dead code — now correctly reads `gpaByYear`
- **B5:** Research section now includes ALL student AP courses, not just relevant subset
- **B6:** `Promise.all` → `Promise.allSettled` — partial failure resilience
- **B7:** Singleton cost tracking → request-scoped closure
- **B8:** Trajectory action items now fed to roadmap generator
- **B9:** NACAC stats corrected (77% college prep, 74% GPA, 64% rigor)

### Calibration Fixes
- **C1+C4:** Tier thresholds recalibrated with CDS 2024-2025 data
- **C2:** schoolFit strings match percentile bands
- **C3:** UPLIFT_SCALE_DATABASE percentile bands now contiguous 0-100%

### Prompt & Quality Fixes
- **A1:** AP/GPA conflation guard + post-processing validator
- **A2:** Major-relevance filter for challenge prioritization
- **A3:** Weakness brevity constraints (MAX 25/20 words)
- **A5:** Metric explanations required (no raw numbers without context)
- **A6:** Speculative claims disclaimer
- **A7:** Stat deduplication rule

### Data Routing Fixes
- **D1:** genuineInterestMarkers, commonMistakes, expectedCourses now reach LLM prompts
- **D2:** Major competitiveness disclaimer injected into identity + challenges
- **D3:** Bottom Line = Haiku synthesis (not verbatim extraction)
- **D4:** Post-processing validation catches AP/GPA conflation and stat duplication
- **D5:** Template fallback uses corrected tier benchmarks
- **H1:** Full ProfileInsights (observation + interpretation + implication) in identity prompt

---

## 9. MOCK TEST DATA (Sarah Chen)

```
Student: Sarah Chen, 11th Grade, Computer Science major
School: Well-resourced suburban (15 APs available)
Overall GPA: 3.66 (calculated from subject averages)

Subject Patterns:
  Computer Science: 3.90 avg, +40% relative | AP CS A: 4.00
  Math:             3.77 avg, +35% relative | AP Calc BC: 3.70, AP Stats: 3.30, Precalc Honors: 3.90
  English:          3.70 avg, +15% relative | AP English Lang: 3.70, English 10 Honors: 3.90
  Social Studies:   3.50 avg, -10% relative | AP US History: 3.30, World History Honors: 3.70
  Science:          3.43 avg, +5% relative  | AP Physics C Mech: 3.30, AP Chem: 3.00, Chem Honors: 3.70

Key Stats:
  - Consistency: 73%, Difficulty Sensitivity: moderate (-0.37 typical drop)
  - Trajectory: stable (3.60 → 3.58, rigor 1.8 → 2.6)
  - Performance Envelope: floor 3.00, ceiling 3.90, typical 3.55
  - Challenge risk: 38/100

Current Tier: Selective (Top 25-60), needs 3.80 for Highly Selective
Uplift Rating: B+ (Very Good)
```

---

## 10. TYPE GOTCHAS

1. **`NuancedCapabilityAnalysis` has no `overallGPA`** — calculate from `subjectPatterns`
2. **`CoursePerformance` uses `name`, `level`, `grade`, `year`** (not `courseName`/`gradeValue`)
3. **`parseClaudeJSON`** handles markdown code blocks, raw JSON, and has jsonrepair fallback
4. **`callClaude`** uses SimpleInput: `{ model, systemPrompt, userPrompt, maxTokens, temperature }`
5. **`genuineInterestMarkers`** is `{ earlySignals, developmentPattern, matureIndicators }` — flattened to `string[]` in context assembly
6. **`commonMistakes`** is `Array<{ mistake, whyItHurts, howToFix }>` from unifiedResearchAssemblyService
7. **`expectedCourses`** is `Array<{ course, expectationLevel, reasoning }>` from admittedProfile
8. **"English" resolves to "Humanities"** in majorResolutionService; "English Literature"/"Creative Writing" resolve to "English / Creative Writing"

---

## 11. HOW TO DEVELOP

### Run E2E test:
```bash
ANTHROPIC_API_KEY="..." npx tsx tests/academic/test-deep-academic-report.ts
```

### Generate output:
```bash
ANTHROPIC_API_KEY="..." npx tsx tests/harness/generate-deep-report-output.ts > docs/archived/completion-snapshots/DEEP_ANALYSIS_OUTPUT_E2E.md
```

### Type check:
```bash
npx tsc --noEmit
```

### Key development rules:
- TypeScript strict mode, no `any` types
- Read existing code before modifying
- Test alongside implementation
- Full error handling, no silent failures
- Sonnet for quality-critical LLM calls, Haiku for speed tasks
- Cost tracking: `$3/M input + $15/M output` for Sonnet, `$0.80/M input + $4/M output` for Haiku

---

## 12. REMAINING IMPROVEMENTS (potential future work)

1. **LLM verbosity** — Sections 1-3 sometimes exceed brevity guidelines. Could add character limits or post-processing truncation.
2. **Cross-section data overlap** — Despite scope ownership rules, some data points still appear in both Section 1 and Section 2. Could add a post-processing dedup step.
3. **Multiple majors / undecided** — Currently optimized for single intended major. Undecided students get generic framing.
4. **School-specific positioning** — Could accept target school list and provide per-school analysis.
5. **Conversational advisor integration** — Connect report findings to follow-up questions in the advisor.
