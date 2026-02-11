# Audit: Context & Data Quality — Deep Academic Report Pipeline

> **Auditor:** Context & Data Quality Auditor
> **Date:** 2026-02-10
> **Scope:** Upstream data pipeline feeding into `deepAcademicReportService.ts`
> **Test Profile:** Sarah Chen, 11th Grade, CS major, well-resourced suburban

---

## EXECUTIVE SUMMARY

The Deep Academic Report assembles context from 3 upstream services but **uses only a fraction of the available data**. The `assembledResearch` object contains 10 top-level fields; the report uses **3 of them**. The `profileInsights` array loses 3 of 4 fields per insight when passed to LLM prompts. A confirmed bug in `unifiedResearchAssemblyService.ts` always falls back to GPA=3.5 instead of calculating from subject patterns. A dead-code bug in `extractProfileInsights()` prevents trajectory insights from ever being generated.

**Overall Data Quality Rating: C+ (Below Potential)**
- Rich data exists upstream but is severely under-utilized
- 2 confirmed bugs silently degrade quality
- The LLM receives far less context than was assembled for it

---

## ISSUES FOUND

### CRITICAL — C1: `llmFormattedContext` is assembled but NEVER used by the report

**File:** `deepAcademicReportService.ts` (assembleContext, all LLM prompts)
**Severity:** Critical

The `assembleResearchForStudent()` call produces `assembledResearch.llmFormattedContext` — a richly formatted ~4000-character document specifically designed for LLM consumption. It contains:
- Calibrated academic assessment (Harvard-Scale rating, rigor maximization %)
- Course requirements for the major (essential, strongly expected, recommended)
- **Deep course profiles** (challenge factors, success strategies, common fears with reality checks, readiness indicators, pairing guidance)
- Verified statistics with citations
- Course load guidance by grade
- College tier expectations
- Context-specific recommendations
- Quick reference facts

**The report service never reads this field.** All 3 LLM prompts (identity, challenges, roadmap) construct their own ad-hoc context strings from `quantitativeAnalysis` directly, missing the deep course knowledge, fear/reality checks, readiness indicators, and more.

**Impact:** The LLM generates course recommendations without knowing course difficulty profiles, challenge factors, prerequisites, or readiness indicators. For example, the roadmap recommends "AP Physics C: E&M" without the LLM knowing the readiness indicators or that students who struggled in Mechanics typically find E&M harder.

---

### CRITICAL — C2: `majorExpectations` field entirely ignored

**File:** `deepAcademicReportService.ts` (all prompts)
**Severity:** Critical

`assembledResearch.majorExpectations` contains field-specific benchmarks from `fieldSpecificExpectations.ts`:
- **tierBenchmarks:** expected activities, bonus activities, warning signals
- **impactBenchmarks:** exceptional/strong/baseline metrics with thresholds
- **genuineInterestMarkers:** early signals, development patterns, mature indicators
- **commonMistakes:** mistake + whyItHurts + howToFix
- **descriptionExpectations:** key terms, action verbs, quantification examples, avoid terms

For CS, this includes CS_EXPECTATIONS with specific benchmarks like expected coding projects, hackathon participation patterns, and common mistakes like "claiming CS without any projects."

**The report ignores ALL of this.** The roadmap's "Major Alignment: 65/100" score comes from the planning advisor's `COURSE_RIGOR_BENCHMARKS` (a much simpler lookup), not from the richer `majorExpectations` data.

---

### CRITICAL — C3: `admittedProfile` not used in report prompts

**File:** `deepAcademicReportService.ts`
**Severity:** Critical

`assembledResearch.admittedProfile` (type `AdmittedStudentProfile`) contains:
- **expectedCourses** with expectation levels (essential/strongly_expected/recommended/helpful) and reasoning
- **keyStrengthAreas** for the major
- **keyInsight** (e.g., CS: "Formal CS coursework validates self-taught skills")
- **verifiedFacts** (citable claims)

This data IS used in `llmFormattedContext` (Section 2: "COURSE REQUIREMENTS FOR CS APPLICANTS"), but since `llmFormattedContext` is never passed to the report's LLM prompts, this data is also lost.

The report's Section 4 (Research Context template) uses `resolveStudentInterest()` directly for `majorRequirements`, which returns `mergedRequirements` (minimum/competitive/exceptional) — a different and less detailed data structure than `admittedProfile`.

---

### HIGH — H1: ProfileInsight fields truncated to `observation` only

**File:** `deepAcademicReportService.ts:449`
**Severity:** High

```typescript
// In the identity prompt:
KEY INSIGHTS FROM ANALYSIS:
${ctx.profileInsights.map(i => `- ${i.observation}`).join('\n')}
```

Each `ProfileInsight` has 4 fields:
- `observation` — what we noticed (USED)
- `interpretation` — what it means strategically (DROPPED)
- `strategicImplication` — what to do about it (DROPPED)
- `evidence` — specific data points (DROPPED)

The interpretation contains rich context like "Admissions officers see this pattern constantly: student claims hot major, transcript tells different story" and the strategicImplication contains specific course recommendations with verified data.

**For Sarah Chen's mock data** (no effortLevels), the insights generated are only from the Insight 4 block (subject-specific anomalies), producing ~3 strength insights (CS, Math, English). These have detailed interpretation and strategicImplication fields that are entirely lost.

**Impact:** The identity LLM only sees bullet points like "Computer Science: 3.90 GPA, 40% above your average—your strongest academic area" without the deeper analysis of what it signals for admissions and what to do.

---

### HIGH — H2: `overallGPA` bug in `getCollegeExpectationsForStudent()`

**File:** `unifiedResearchAssemblyService.ts:553`
**Severity:** High (latent bug, partially masked)

```typescript
const overallGPA = context.quantitativeAnalysis.overallGPA || 3.5;
```

`NuancedCapabilityAnalysis` has NO `overallGPA` property (confirmed by type definition at `nuancedCapabilityAnalyzer.ts:33-51`). This always evaluates to `undefined || 3.5 = 3.5`.

**Impact for Sarah Chen:** GPA=3.66 → fallback GPA=3.5. Both land in `selective` tier, so the output is accidentally correct. But for a student with GPA=3.75 (should be `highly_selective`), the bug would misclassify them as `selective`.

This affects `assembledResearch.collegeExpectations`, which IS used by the report's Challenges LLM prompt.

---

### HIGH — H3: `yearlyGPAs` dead-code bug in `extractProfileInsights()`

**File:** `insightDrivenAdvisor.ts:447`
**Severity:** High

```typescript
const yearlyGPAs = quant.progressionTrajectory.historical.yearlyGPAs;
```

The actual field is `gpaByYear: { year: string; gpa: number; rigorLevel: number }[]`. There is no `yearlyGPAs` property on the type. This means:
- **Insight 2 (Trajectory Patterns)** is DEAD CODE — never generates insights
- Declining trajectory detection never fires
- Improving trajectory detection never fires

For Sarah Chen this is moot (stable trajectory), but for students with improving or declining trends, this is a significant loss — the trajectory insights contain detailed AO interpretation, narrative strategy advice, and evidence.

---

### HIGH — H4: AP course coverage gap in Research Context (Section 4)

**File:** `deepAcademicReportService.ts:768`, `unifiedResearchAssemblyService.ts:391-443`
**Severity:** High

**Sarah took 7 AP courses** but Section 4 shows statistics for only 6, and **3 of those 6 are NOT courses she took**:

| In Section 4 | Student Took? | Why Included/Excluded |
|---|---|---|
| AP Calculus AB | NO | CS-relevant (essential), but she took BC not AB |
| AP Calculus BC | YES (3.70) | CS-relevant (essential) |
| AP Computer Science A | YES (4.00) | CS-relevant (essential) |
| AP Physics C: Mechanics | YES (3.30) | CS-relevant (strongly_recommended) |
| AP Statistics | YES (3.30) | CS-relevant (helpful) |
| AP English Literature | NO | Added from strong-subject heuristic (English +15%) |
| **AP English Language** | **YES (3.70)** | **MISSING — not in CS majorRelevance** |
| **AP Chemistry** | **YES (3.00)** | **MISSING — has CS:helpful but cut by `.slice(0, 5)`** |
| **AP US History** | **YES (3.30)** | **MISSING — not in CS majorRelevance** |

**Root cause:** `getRelevantAPCourses()` takes `majorCourses.slice(0, 5)` from the major-relevance lookup, which cuts off AP Chemistry (7th in the sorted list after 3 essential + 1 strongly_recommended + 2 helpful). Then the strong-subject heuristic adds AP English Literature (not Language). AP English Language and AP US History have no CS relevance tag at all.

**Impact:** The Research Context section is described as providing "AP Statistics with student performance context" but omits courses the student actually struggled in (AP Chem: 3.00, their worst grade). This is exactly the data that should ground the LLM's challenge analysis.

---

### MEDIUM — M1: Planning advice `probingQuestions` not forwarded

**File:** `deepAcademicReportService.ts` (all prompts)
**Severity:** Medium

`planningAdvice.probingQuestions` contains targeted questions like:
- "Tell me more about your experience in [Subject]. How much effort did it take?"
- "Your grades in [Subject] dropped over time. What happened?"
- "How do you typically feel about your current workload?"

These questions are designed to identify information gaps. While the report doesn't ask questions, these could be presented as "Questions for Further Exploration" or used by the LLM to temper its confidence when making recommendations without complete information.

---

### MEDIUM — M2: `trajectoryAssessment.actionItems` not in LLM prompts

**File:** `deepAcademicReportService.ts:700-703`
**Severity:** Medium

The roadmap prompt passes `planning.trajectoryAssessment.pattern`, `.aoInterpretation`, and `.recommendation` — but NOT `.actionItems`. These are specific actions like:
- "Maintain the upward trajectory"
- "Consider stepping up rigor if capable"
- "This narrative will help your application"

The template fallback correctly uses these (`planning.trajectoryAssessment?.actionItems`), but the LLM prompt does not.

---

### MEDIUM — M3: `apScorePerceptions` and `relevantFacts` unused

**File:** `deepAcademicReportService.ts`
**Severity:** Medium

Two fields from `assembledResearch` are never referenced:
- **`apScorePerceptions`** — Rich context about what AP scores 1-5 mean for admissions (e.g., "A 4 in a hard AP (BC, Physics C) is viewed better than a 5 in an easier one"). Would be valuable in the Challenges section.
- **`relevantFacts`** — Quick facts tagged to the student's situation (rigor importance, trajectory significance). Would add grounding to LLM prompts.

---

### MEDIUM — M4: `dataQuality` confidence indicators unused

**File:** `deepAcademicReportService.ts`
**Severity:** Medium

`assembledResearch.dataQuality` contains:
- `hasVerifiedStatistics: boolean`
- `hasMajorSpecificGuidance: boolean`
- `hasSchoolSpecificStrategy: boolean`
- `hasContextAdjustment: boolean`
- `overallConfidence: number`

These could be used to (a) temper LLM confidence when data is thin, (b) display confidence indicators to the user, or (c) decide which sections to expand/contract.

---

### MEDIUM — M5: Empty school context in planning advisor call

**File:** `deepAcademicReportService.ts:318-323`
**Severity:** Medium

```typescript
schoolContext: {
    type: input.schoolContext.type,
    apCoursesAvailable: [],        // ALWAYS EMPTY
    honorsCoursesAvailable: [],    // ALWAYS EMPTY
    dualEnrollmentAvailable: false, // ALWAYS FALSE
},
```

The planning advisor uses these to check course availability (`isCourseAvailable()`) and suggest alternatives. With empty arrays, it can never determine whether recommended courses are actually available at the student's school. The `DeepAcademicReportInput` type only has `apCoursesAvailable?: number` (a count), not a list of course names.

---

### LOW — L1: `researchBackedGuidance.contextAwareRecommendations` not in report

**File:** `deepAcademicReportService.ts`
**Severity:** Low

The `assembledResearch.researchBackedGuidance.contextAwareRecommendations` array contains recommendations adjusted for the student's specific circumstances (school type, demographics, etc.). These are used in `llmFormattedContext` Section 7 but not directly accessible to the report since `llmFormattedContext` is ignored.

---

### LOW — L2: `researchBackedGuidance.schoolStrategies` not in report

**File:** `deepAcademicReportService.ts`
**Severity:** Low

School-specific strategies (rigor expectations, how AOs contextualize grades from this school type) are assembled but not forwarded.

---

## PROPOSED FIXES

### Fix for C1+C2+C3 (Highest Impact — route `llmFormattedContext` to LLM prompts)

**Approach:** Add `assembledResearch.llmFormattedContext` as a new section in each LLM prompt. This single change would bring in deep course profiles, major expectations, admitted student profiles, readiness indicators, course load guidance, and context-aware recommendations.

```typescript
// In each LLM prompt's userPrompt, add:
COMPREHENSIVE RESEARCH CONTEXT (verified data, citations included):
${ctx.assembledResearch.llmFormattedContext}
```

**Trade-off:** This adds ~3000-4000 tokens to each prompt (~$0.009-0.012 per prompt × 3 = ~$0.03 increase). Given the report already costs ~$0.11, this is a ~27% cost increase for significantly richer output.

**Alternative (lower cost):** Route selected fields only:
- Add `admittedProfile.expectedCourses` to the Roadmap prompt (course expectations with reasoning)
- Add `majorExpectations.commonMistakes` to the Challenges prompt (validated pitfalls)
- Add `majorExpectations.genuineInterestMarkers` to the Identity prompt (what authentic interest looks like)

### Fix for H1 (Route full ProfileInsight fields)

```typescript
// Replace:
${ctx.profileInsights.map(i => `- ${i.observation}`).join('\n')}

// With:
${ctx.profileInsights.map(i => `- OBSERVATION: ${i.observation}
  INTERPRETATION: ${i.interpretation}
  STRATEGIC IMPLICATION: ${i.strategicImplication}
  EVIDENCE: ${i.evidence.join('; ')}`).join('\n\n')}
```

**Cost:** Adds ~200-400 tokens per prompt. Very low cost for significant quality improvement.

### Fix for H2 (overallGPA bug)

```typescript
// In unifiedResearchAssemblyService.ts:553, replace:
const overallGPA = context.quantitativeAnalysis.overallGPA || 3.5;

// With:
const patterns = Object.values(context.quantitativeAnalysis.subjectPatterns);
const overallGPA = patterns.length > 0
  ? patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0) / patterns.length
  : 3.5;
```

### Fix for H3 (yearlyGPAs dead code)

```typescript
// In insightDrivenAdvisor.ts:447, replace:
const yearlyGPAs = quant.progressionTrajectory.historical.yearlyGPAs;

// With:
const yearlyGPAs = quant.progressionTrajectory.historical.gpaByYear.map(y => y.gpa);
```

### Fix for H4 (AP course coverage gap)

Two approaches:
1. **Include ALL student courses in Section 4** regardless of major relevance, then add relevance tags
2. **Increase the slice limit** from 5 to 8 in `getRelevantAPCourses()`, and add a separate pass that includes any AP course the student actually took

Recommended: Approach 2 — in `generateResearchContext()`, supplement `research.relevantAPCourses` with any AP courses from the student's transcript that aren't already in the list.

### Fix for M2 (trajectory actionItems)

Add to the roadmap prompt:
```
TRAJECTORY ACTION ITEMS:
${planning.trajectoryAssessment?.actionItems?.map(a => `- ${a}`).join('\n') || 'None'}
```

### Fix for M5 (empty school context)

Either:
- Expand `DeepAcademicReportInput` to accept a course name list, or
- Use the `apCoursesAvailable: number` count to inform the planning advisor heuristically

---

## DATA QUALITY ASSESSMENT

### What Works Well
- **Major resolution for CS:** Resolves correctly to "Computer Science" with exact match (confidence 1.0). `getTargetedContext()` returns 7+ relevant courses, relevant statistics, and CS-specific guidance.
- **Verified statistics:** AP pass rates, NACAC factors, and CDS data are all properly sourced and cited.
- **Planning advice integration:** Course recommendations, workload advice, major alignment, and red flags all flow correctly to the relevant LLM prompts.
- **Template fallback:** When LLM fails, the fallback produces a reasonable report from planning advice alone.
- **Cost tracking:** Token usage and cost are accurately tracked.

### What Needs Improvement
- **Data utilization rate:** ~30% of assembled research data reaches the LLM. The richest context (`llmFormattedContext`, `admittedProfile`, `majorExpectations`) is entirely wasted.
- **Insight depth:** Profile insights are reduced to single-line observations, losing interpretation, strategy, and evidence.
- **AP coverage:** Report shows courses relevant to major, not courses the student took — missing critical struggle-course data.
- **Two silent bugs:** `overallGPA` fallback (H2) and `yearlyGPAs` dead code (H3) degrade quality without error messages.

### Overall Rating: C+ (Below Potential)
The infrastructure is excellent — rich data is assembled from multiple sources, properly verified, and well-structured. But the "last mile" delivery to the LLM prompts is the bottleneck. Fixing the top 4 issues (C1, H1, H2, H3) would lift this to B+ quality with minimal code changes and modest cost increase.

---

## QUESTIONS FOR THE LEAD

1. **Cost vs. Quality trade-off on C1:** Should we route the full `llmFormattedContext` (~3-4K tokens) to all 3 LLM prompts, or selectively pick the most impactful fields? Full routing adds ~$0.03/report (~27% increase).

2. **Section 4 AP coverage (H4):** Should Section 4 show ALL courses the student took (complete picture) or only major-relevant ones (focused view)? Showing all courses would mean 7+ rows in the table but gives the student feedback on every AP.

3. **Bug fix priority (H2 vs H3):** The `overallGPA` bug (H2) is latent — correct for most students but wrong for GPA 3.7+. The `yearlyGPAs` bug (H3) kills trajectory insights entirely. Which should be fixed first? (Both are one-line fixes.)

4. **Profile insight depth (H1):** Adding full insight fields to the identity prompt adds ~300 tokens. Should we also add them to the Challenges and Roadmap prompts, or just Identity?

5. **School context gap (M5):** The `DeepAcademicReportInput` only has `apCoursesAvailable?: number`. Should we expand the input type to accept specific course names, or is the count sufficient for the planning advisor's heuristics?

---

*Generated by Context & Data Quality Auditor, 2026-02-10*
