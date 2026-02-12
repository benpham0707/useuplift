# Deep Academic Report — Comprehensive Quality Audit & Prioritized Action Plan

> **Date:** 2026-02-10
> **Scope:** 4-teammate parallel audit of rubric accuracy, output quality, data pipeline, and reliability
> **Status:** AUDIT COMPLETE — awaiting approval before implementation

---

## EXECUTIVE SUMMARY

The audit found **32 distinct issues** across 4 domains. The most impactful findings:

1. **COLLEGE_TIER_BENCHMARKS are significantly miscalibrated** — every named school has admits 0.15-0.25 GPA points higher than our cutoffs suggest. We're telling students they're more competitive than they are.
2. **~70% of assembled research data never reaches the LLM** — rich course profiles, major expectations, admitted student profiles, and formatted context are all assembled but dropped before the prompts.
3. **AP exam stats are still being conflated with class GPAs** despite explicit prompt instructions — the exact same bad pattern ("62% score 3+ on the exam, yet you earned 3.30 in the class") appears twice in the output.
4. **Severe cross-section repetition** — the biggest strength and biggest risk appear verbatim in both Bottom Line and their source sections. Tier positioning is repeated 5+ times.
5. **Two silent bugs** — `overallGPA` always falls back to 3.5 in the research assembly, and trajectory insights are dead code due to a wrong property name.
6. **Promise.all means one LLM failure kills all 3 sections** — no partial success path exists.

---

## PRIORITIZED ACTION PLAN

### (A) Quick Wins — Prompt Tweaks Only (No code changes, immediate quality improvement)

#### A1. Strengthen AP Stat / GPA Conflation Guard [CRITICAL]
**File:** `deepAcademicReportService.ts:511-513`
**What:** Replace the current "DATA ACCURACY" section in the Challenges prompt with a stronger version that includes a concrete bad example matching what the LLM is actually generating, labels it "MEANINGLESS," and adds a rule against citing the same stat in multiple challenges.
**Why:** The current instruction failed — LLM treated it as advisory. The exact prohibited pattern appears twice in output.
**Effort:** 5 min prompt edit.

#### A2. Add Major-Relevance Filter for Challenges [HIGH]
**File:** `deepAcademicReportService.ts:525`
**What:** After "Focus on 2-3 DISTINCT challenges," add: "PRIORITIZE challenges that matter most for the student's intended major. For a CS applicant, focus on STEM readiness, CS depth, and math performance — not Social Studies. Only include non-major challenges if they indicate a truly concerning systemic pattern."
**Why:** Challenge 3 (Social Studies for CS applicant) wastes a valuable slot. A "lack of post-AP CS progression" challenge would be far more impactful.
**Effort:** 5 min prompt edit.

#### A3. Enforce Weakness Brevity in Section 1 [MEDIUM]
**File:** `deepAcademicReportService.ts:376-382`
**What:** Add "MAX 25 WORDS" to the gap field and "MAX 20 WORDS. Do NOT mention specific schools or courses — Section 2 covers those details" to the consequence field.
**Why:** Weakness previews currently overlap ~40% with Section 2 challenges, breaking scope ownership.
**Effort:** 5 min prompt edit.

#### A4. Clarify Difficulty Impact vs. Subject-Specific Drops [MEDIUM]
**File:** `deepAcademicReportService.ts:455`
**What:** Annotate the DIFFICULTY IMPACT line: "(this is the AVERAGE across all subjects — calculate subject-specific drops from actual grades above, e.g., Chem Honors 3.70 → AP Chem 3.00 = 0.70, NOT 0.55)"
**Why:** LLM confuses the 0.55 average impact with the 0.70 Chemistry-specific drop.
**Effort:** 2 min prompt edit.

#### A5. Require Metric Explanations [MEDIUM]
**File:** `deepAcademicReportService.ts:347-352`
**What:** Add rule: "When using metrics like 'consistency score,' 'strength signal,' or 'percentile,' ALWAYS explain what the number measures and provide a benchmark."
**Why:** "65% strength signal" and "73% consistency" are dropped as raw numbers without context.
**Effort:** 2 min prompt edit.

#### A6. Tone Down Speculative Tier Claims [MEDIUM]
**File:** `deepAcademicReportService.ts:347-352`
**What:** Add rule: "strengthTier and weaknessTier are ILLUSTRATIVE — frame as 'if your entire transcript matched your CS performance' not 'your CS GPA places you at Harvard.'"
**Why:** "Would place you in Harvard/Stanford/MIT range" from a single AP course is misleading.
**Effort:** 2 min prompt edit.

#### A7. Deduplicate Stats Across Challenges [LOW]
**File:** `deepAcademicReportService.ts:525`
**What:** Add: "Each statistic may be cited in AT MOST ONE challenge. Do not reuse data points."
**Why:** "62% of AP Statistics test-takers" appears in 3 different places.
**Effort:** 1 min prompt edit.

**Total A-tier effort: ~20 minutes for 7 prompt improvements.**

---

### (B) Code Improvements — Better Reliability & Accuracy

#### B1. Fix `overallGPA` Bug in Research Assembly [CRITICAL — 1-line fix]
**File:** `unifiedResearchAssemblyService.ts:553`
**What:** Replace `context.quantitativeAnalysis.overallGPA || 3.5` with proper calculation from `subjectPatterns` (same pattern used in `deepAcademicReportService.ts:113-118`).
**Why:** `NuancedCapabilityAnalysis` has no `overallGPA` property — always falls back to 3.5. Silently miscategorizes college tier expectations for GPA>3.5 students.
**Impact:** Any student with GPA above 3.5 gets wrong college expectations in their research context.

#### B2. Fix `yearlyGPAs` Dead Code Bug [CRITICAL — 1-line fix]
**File:** `insightDrivenAdvisor.ts:447`
**What:** Replace `quant.progressionTrajectory.historical.yearlyGPAs` with `quant.progressionTrajectory.historical.gpaByYear.map(y => y.gpa)`.
**Why:** Wrong property name means trajectory insights (Insight 2 block) NEVER generates — all declining/improving trajectory detection is dead.

#### B3. Truncate Bottom Line Bullets [HIGH]
**File:** `deepAcademicReportService.ts:844-863`
**What:** Add a `truncateToSentence(text, maxChars)` helper. Apply 150-char limit to positioning, biggestStrength, and biggestRisk in `buildBottomLine()`.
**Why:** Positioning and strength bullets are ~350 chars (68 words) each. They pull verbatim text from Section 1/2, creating painful repetition when reading top-to-bottom. Executive summary bullets should be ~30 words max.

#### B4. Route Full ProfileInsight Fields to LLM [HIGH]
**File:** `deepAcademicReportService.ts:449`
**What:** Replace `ctx.profileInsights.map(i => i.observation)` with full fields: observation + interpretation + strategicImplication + evidence.
**Why:** Currently drops 3 of 4 fields per insight. The `interpretation` and `strategicImplication` contain the rich analysis; `observation` alone is a bare data point. ~300 token increase per prompt.

#### B5. Fix AP Course Coverage Gap in Section 4 [HIGH]
**File:** `deepAcademicReportService.ts:768` + `unifiedResearchAssemblyService.ts:400`
**What:** In `generateResearchContext()`, supplement `research.relevantAPCourses` with any AP courses from the student's transcript that aren't already in the list. Currently shows 6 courses (3 the student didn't take) but misses AP Chemistry (3.00 — their worst grade), AP English Language, and AP US History.
**Why:** The Research Context section omits the student's worst AP performance, which is exactly the data that should ground the challenge analysis.

#### B6. Switch Promise.all to Promise.allSettled [HIGH]
**File:** `deepAcademicReportService.ts:237-263`
**What:** Use `Promise.allSettled()` and handle partial success — if 2 of 3 LLM calls succeed, use those + template fallback for the failed section only.
**Why:** Currently one LLM failure kills all 3 sections and falls back to a thin template report, wasting the successful calls.

#### B7. Fix Race Condition in Singleton [MEDIUM]
**File:** `deepAcademicReportService.ts:197-208`
**What:** Make `_accumulatedCost` and `_accumulatedTokens` request-scoped (passed as params or stored in a per-call context object) rather than instance variables that get reset at the start of `generateReport()`.
**Why:** Two simultaneous report generations would corrupt each other's cost/token tracking.

#### B8. Add `trajectoryAssessment.actionItems` to Roadmap Prompt [MEDIUM]
**File:** `deepAcademicReportService.ts:700-703`
**What:** Add `TRAJECTORY ACTION ITEMS: ${planning.trajectoryAssessment?.actionItems?.join('\n')}` to the roadmap prompt.
**Why:** Template fallback uses these but the LLM prompt doesn't — data loss.

#### B9. Correct NACAC Statistics Order/Values [LOW]
**File:** `deepAcademicReportService.ts:825-830`
**What:** Swap the GPA (77%) and College Prep Grades (69%) values — they appear to be reversed. Correct order: College Prep 77%, GPA 74%, Rigor 64%.
**Why:** Minor factual error in reference data.

**Total B-tier effort: ~2-3 hours for 9 code improvements.**

---

### (C) Data & Rubric Improvements — Require Research Validation

#### C1. Recalibrate COLLEGE_TIER_BENCHMARKS [CRITICAL]
**File:** `deepAcademicReportService.ts:141-155`
**What:** Raise all GPA thresholds based on CDS data:
- Ivy/Elite: 3.85→3.90 (Harvard 73% have 4.0, UCLA UW 3.95-4.00)
- Highly Selective: 3.70→3.80 (BU avg 3.90, Purdue avg 3.76)
- Selective: 3.40→3.60 (Purdue 25th percentile ~3.62)
- Competitive: 3.00→3.20
- Add Georgia Tech to Highly Selective, add UW-Madison to Selective
- Update school examples to match corrected tiers

**Research needed:** Verify the 25th-75th percentile ranges for all named schools using latest CDS data. Rubric analyst provided data for 13 schools.

**Impact on Sarah Chen:** Stays in Selective (3.60-3.79) but now the schools listed (BU, UT Austin, Purdue) more accurately reflect where a 3.66 GPA is actually competitive.

#### C2. Recalibrate Uplift Scale `schoolFit` Strings [HIGH]
**File:** `deepAcademicReportTypes.ts:211-290`
**What:** Update schoolFit text to match corrected tiers. E.g., B+ changes from "Competitive at top-50 universities" to "Competitive at selective state flagships (Purdue, Ohio State, UT Austin). Top-30 schools are realistic reaches with strong supplementary profile."
**Depends on:** C1 (corrected tiers must be finalized first).

#### C3. Soften Uplift Scale Percentile Claims [MEDIUM]
**File:** `deepAcademicReportTypes.ts:211-290`
**What:** Change "Top 15-20%" to "roughly top 15-25%" etc. The 5-percentage-point granularity implies a precision the holistic assessment can't support.

#### C4. Add Competitive Tier School Examples [LOW]
**File:** `deepAcademicReportService.ts:145`
**What:** Replace "Most state universities, Regional private colleges" with named examples (Arizona State, Iowa State, University of Oregon, Temple). Consistent with other tiers.
**Research needed:** Verify GPA data for these schools.

---

### (D) Architecture Improvements — Future Sessions

#### D1. Route `llmFormattedContext` to LLM Prompts [HIGH — ~$0.03/report cost increase]
**What:** The `assembledResearch.llmFormattedContext` is a rich ~4000-char document with deep course profiles, readiness indicators, fear/reality checks, challenge factors, and admitted student profiles. It's assembled but NEVER passed to the report's LLM prompts. Routing it would give the LLM dramatically better course knowledge.
**Trade-off:** ~27% cost increase ($0.11 → $0.14 per report). Could be selective (route only to Roadmap prompt) to reduce impact.
**Alternative:** Cherry-pick the most impactful fields (admittedProfile.expectedCourses, majorExpectations.commonMistakes, genuineInterestMarkers) instead of the full blob.

#### D2. Add Major-Adjusted Tier Overlays [HIGH — significant feature]
**What:** CS admissions at Georgia Tech, CMU, Purdue have much higher GPA thresholds than general admits. Add a `MAJOR_TIER_ADJUSTMENTS` lookup table that shifts tier thresholds up for competitive majors (CS +0.10, Engineering +0.08, Business +0.05, Nursing +0.05).
**Data needed:** CS-specific GPA ranges for 15-20 schools. Hard to find officially — would compile from departmental pages and third-party sources.
**Impact:** Would correctly tell Sarah Chen she's in Competitive (not Selective) tier for CS specifically.

#### D3. Add Bottom Line Summary Fields to LLM Schema [MEDIUM]
**What:** Instead of extracting Bottom Line bullets from Section content (which causes verbatim repetition), add dedicated one-sentence `bottomLineSummary` fields to each LLM section's JSON output. The LLM writes purpose-specific concise text for the Bottom Line.
**Why:** Better than truncation heuristics — the LLM writes at the right length for the context.

#### D4. Add Post-Processing Validation [MEDIUM]
**What:** After LLM generation, run validation checks:
- Detect AP exam stat / class GPA conflation (sentences with both "test-takers" and GPA numbers)
- Check that each challenge is distinct (no >50% word overlap)
- Verify numerical claims match the provided data
**Why:** Prompt engineering alone can't prevent all LLM misbehavior. A validation layer catches errors the prompt missed.

#### D5. Improve Template Fallback Quality [LOW]
**What:** The template fallback doesn't reference school names, doesn't produce a narrative, and has thin challenges. Improve using the same `COLLEGE_TIER_BENCHMARKS` data and `calculateTierPosition()` function already available.

#### D6. Variable Temperature Per Section [LOW]
**What:** Identity at 0.2 (consistency), Roadmap at 0.4 (creativity), Challenges at 0.3 (balanced). Currently all at 0.3.
**Trade-off:** Higher temperature slightly increases malformed JSON risk. Marginal quality impact vs. complexity.

#### D7. Expand `DeepAcademicReportInput` to Accept Course Names [LOW]
**What:** Currently `schoolContext.apCoursesAvailable` is a count (number), not a list. The planning advisor needs course names to check availability. Expanding the input type would enable better course availability checking.

---

## IMPLEMENTATION ORDER (recommended)

### Phase 1: Bug Fixes + Quick Wins (30 min)
1. B1 — Fix `overallGPA` bug (1-line fix)
2. B2 — Fix `yearlyGPAs` dead code (1-line fix)
3. A1-A7 — All prompt improvements (20 min total)
4. B9 — Correct NACAC stats (2 min)

### Phase 2: Output Quality (1 hour)
5. B3 — Truncate Bottom Line bullets
6. B4 — Route full ProfileInsight fields
7. B5 — Fix AP course coverage in Section 4
8. B8 — Add trajectory actionItems to prompt

### Phase 3: Reliability (30 min)
9. B6 — Switch to Promise.allSettled
10. B7 — Fix race condition in singleton

### Phase 4: Rubric Recalibration (1 hour, needs review)
11. C1 — Recalibrate tier benchmarks (after data verification)
12. C2 — Update schoolFit strings
13. C3 — Soften percentile claims
14. C4 — Add Competitive tier examples

### Phase 5: Architecture (future sessions)
15. D1-D7 as separate tasks

---

## OPEN QUESTIONS FOR TUE

1. **Tier recalibration aggressiveness:** The rubric analyst proposes raising Ivy/Elite from 3.85 to 3.90, Highly Selective from 3.70 to 3.80, Selective from 3.40 to 3.60. This is well-supported by CDS data. Should we go even higher (Ivy 3.95+, Highly Selective 3.85+), or is this conservative approach right?

2. **Cost vs quality on D1 (llmFormattedContext):** Routing the full research context to prompts adds ~$0.03/report (27% increase) for significantly richer output. Route all 3 prompts, just Roadmap, or cherry-pick fields?

3. **Major-adjusted tiers (D2):** This would correctly tell CS applicants they face higher thresholds. Implement now (significant effort) or add a disclaimer for now and build the feature later?

4. **Bottom Line approach (D3 vs B3):** Quick fix: truncate bullets to 150 chars. Better fix: add LLM summary fields. Do the quick fix now and the better fix later?

5. **Post-processing validation (D4):** Worth building? It catches LLM errors the prompt can't prevent, but adds ~50 lines of validation code and slight complexity.

6. **Third challenge slot:** When Social Studies is dropped for CS applicants, should we hardcode "lack of CS progression beyond AP CS A" as a suggested challenge, or let the LLM decide?

---

## SOURCE AUDIT DOCUMENTS

- `docs/AUDIT_RUBRIC_TIER_FINDINGS.md` — Rubric & Tier Analyst (CDS research, GPA verification, major-adjusted tiers)
- `docs/OUTPUT_QUALITY_AUDIT.md` — Output Quality Reviewer (16 issues, 8 prompt fixes, Bottom Line rewrites)
- `docs/AUDIT_CONTEXT_DATA_QUALITY.md` — Context & Data Quality Auditor (pipeline completeness, 2 bugs, data loss analysis)
- Reliability findings delivered via team message (Promise.allSettled, JSON parsing, race conditions, token budgets)
