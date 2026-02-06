# Academic History Section: Integrity & Accuracy Design Document

## Purpose

This document provides a focused, implementation-ready analysis of the integrity and accuracy issues specifically in the **academic history** section of the portfolio analysis system. This is the design doc for the building chat to reference when implementing fixes.

The academic history system lives in:
```
src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/
├── academicResearchFoundation.ts    -- Verified stats (single source of truth)
├── academicCourseKnowledgeBase.ts   -- AP course profiles & difficulty data
├── collegeExpectationsDatabase.ts   -- College tier profiles & major expectations
├── academicPlanningAdvisor.ts       -- Core planning engine & capability estimation
├── insightDrivenAdvisor.ts          -- Profile insight extraction & strategic questions
├── capabilityConversationEngine.ts  -- Multi-turn conversation orchestrator
├── researchBackedGuidanceLayer.ts   -- Calibrated assessment using research DBs
├── unifiedResearchAssemblyService.ts -- Assembles all research for LLM context
└── types.ts                         -- Type definitions
```

---

## Part 1: Data Accuracy Audit Results

### 1.1 AP Statistics (academicCourseKnowledgeBase.ts) — EXCELLENT

**Verification method:** Compared all 21 AP courses against official College Board 2024 Score Distributions.

**Result: 19/21 courses match perfectly. 2 have trivial 0.01 rounding differences.**

| Course | Issue | Codebase | Official CB | Fix |
|--------|-------|----------|-------------|-----|
| AP Physics C: Mech | averageScore | 3.49 | 3.50 | Change line ~388 |
| AP US History | averageScore | 3.22 | 3.23 | Change line ~716 |

**Root cause:** Average scores were calculated from rounded percentage distributions rather than taken from CB's official reported mean (which uses raw data).

**Priority: P2 (trivial).** These 0.01 differences have zero impact on advising quality. Fix when convenient.

### 1.2 College Tier Classifications (collegeExpectationsDatabase.ts) — NEEDS UPDATES

**Verification method:** Compared against most recent acceptance rates (Class of 2029 where available).

**Schools misclassified:**

| School | Current Tier | Should Be | Acceptance Rate | Action |
|--------|-------------|-----------|-----------------|--------|
| Vanderbilt | highly_selective | ivy_elite | 4.7% | Move to ivy_elite examples |
| Northwestern | highly_selective | Borderline | 6.3-7.5% | Keep but note borderline |
| Boston University | selective | highly_selective | 11-13% | Move to highly_selective |
| Tulane | selective | highly_selective | 14.7% | Move to highly_selective |
| Ohio State | selective | competitive | ~53-60% | Move to competitive |
| UMass Amherst | selective | competitive | ~60% | Move to competitive |
| Penn State | selective | competitive | ~60% | Move to competitive |

**Priority: P1.** When we tell a student "schools in your range expect X APs," we need the tier to be correct. A student targeting BU (11% acceptance) getting advice calibrated for 20-50% schools will be significantly underprepared.

### 1.3 GPA Medians by Tier (collegeExpectationsDatabase.ts) — SLIGHTLY LOW

| Tier | Codebase Median | Research Suggests | Delta |
|------|----------------|-------------------|-------|
| ivy_elite | 3.95 | 3.95-3.98 | Accurate |
| highly_selective | 3.85 | 3.88-3.92 | ~0.05 low |
| selective | 3.65 | 3.72-3.80 | ~0.10 low |

**Priority: P1.** The selective tier median being 0.10 low means we may tell students they're "on track" when they're actually below median. Adjust to 3.75.

### 1.4 AP Course Count Expectations — REASONABLE BUT UNVERIFIABLE

Colleges don't publish average AP counts of admitted students. Our ranges (ivy_elite: 8-15, typical 10) align with counselor consensus but should be explicitly labeled as estimates, not facts.

**The `academicResearchFoundation.ts` already handles this correctly** in its `UNVERIFIABLE_CLAIMS` section. Ensure the advisor code doesn't present these as verified facts.

**Priority: P2.** The data is reasonable; the risk is presentation, not content.

### 1.5 Major-Specific Course Requirements — ACCURATE

All three major categories verified:
- **CS:** AP Calc BC + AP CS A + AP Physics — Correct
- **Pre-Med:** AP Bio + AP Chem + AP Calc + AP Physics — Correct
- **Engineering:** AP Calc BC + AP Physics C + AP Chem — Correct

The `collegeExpectationsDatabase.ts` major expectations are well-sourced and align with published guidance from admissions offices and counseling organizations.

**Priority: P3 (no changes needed).**

---

## Part 2: Logic & Algorithm Integrity Audit

### 2.1 Capability Estimation (academicPlanningAdvisor.ts:237-356) — NEEDS REFINEMENT

The `estimateCapability()` function estimates "true capability" on a 1-10 scale from grades + qualitative data. This is the **most important algorithm** in the academic history system because it drives all course recommendations.

**Current logic:**
```
baseCapability = avgGPA / 4.0 * 10   (0-10 scale)
+ 1.5 if low effort (<40%) + high grades (≥3.5)
- 0.5 if high effort (>80%) + lower grades (<3.3)
+ 0.5 if high interest (>70%)
+ 1.0 if poor teacher quality
+ 0.5 per severe external circumstance
+ 0.5 if improving trajectory
+ 0.5 if strong grades in regular courses without AP exposure
```

**Issues identified:**

**Issue 1: GPA-to-capability mapping is linear but should be non-linear.**
- A 3.0 GPA maps to 7.5 capability (can handle AP according to the >= 7 threshold)
- A 2.8 GPA maps to 7.0 (still "can handle AP")
- This means a student with a B- average is tagged as AP-ready, which is too aggressive.

**Recommended fix:** Use non-linear mapping that's stricter at the AP boundary:
```
baseCapability for AP readiness should require at least 3.3+ GPA (8.25 on scale)
Shift AP threshold from 7.0 to 7.5, or adjust the GPA-to-capability curve
```

**Issue 2: Adjustment factors can compound unrealistically.**
- Low effort (+1.5) + poor teacher (+1.0) + external circumstances (+0.5) + trajectory (+0.5) = +3.5
- A student with 2.4 GPA (base 6.0) could reach 9.5 with all positive qualitative factors
- That's "exceptional AP candidate" territory from a C+ GPA student — unrealistic.

**Recommended fix:** Cap total qualitative adjustment at +2.0 (instead of unbounded). This still allows meaningful adjustment but prevents a C+ student from being coded as exceptional.

**Issue 3: Effort level is self-reported with no calibration.**
- Students notoriously misjudge their own effort
- A student saying "I barely tried" (effort 20%) with a 3.5 GPA triggers +1.5 boost
- But "barely trying" might mean "didn't do extra credit" vs. "didn't study at all"

**Recommended fix:** Don't use raw effort numbers. Instead, use effort + grade combination as the signal:
- Low-effort claim + high grades + hard course = strong capability signal
- Low-effort claim + high grades + easy course = weaker signal (the course may just be easy)

**Issue 4: The `canHandleAP` boolean is too simplistic.**
- Currently: `canHandleAP = baseCapability >= 7`
- Doesn't account for: which AP (Physics 1 at 47% pass vs. Psychology at 62%), current course level, or subject-specific aptitude.

**Recommended fix:** Use course-specific difficulty tiers from `academicCourseKnowledgeBase.ts`:
```typescript
// Instead of flat threshold:
canHandleAP = baseCapability >= getAPReadinessThreshold(specificAP)
// Where Physics 1 requires 8.5, Psychology requires 6.5, etc.
```

**Priority: P0.** This algorithm directly determines every course recommendation we give. Getting it wrong means recommending AP Physics to a student who'll get a D, or holding back a student who could thrive.

### 2.2 Workload Advisor (academicPlanningAdvisor.ts:464-578) — MINOR ISSUES

**Current logic for recommended rigorous courses:**
```
Grade 9:  standard=2, max=3
Grade 10: standard=3, max=5
Grade 11: standard=4, max=6
Grade 12: standard=4, max=5
```

**Issue: Grade 9 standard of 2 APs is aggressive.**
Most schools offer 0-1 APs to freshmen. The `APPROPRIATE_LOADS` in `academicCourseKnowledgeBase.ts` says the typical for a competitive magnet is 1 AP and well-resourced is 1 AP — but the workload advisor suggests 2 as standard.

**Also:** The school context adjustment of +1 for elite_prep/competitive_magnet means a Grade 9 student at a magnet school gets recommended 3 rigorous courses. That's the *maximum* according to the knowledge base, not the standard.

**Recommended fix:** Align the `gradeExpectations` in `generateWorkloadAdvice()` with the verified `APPROPRIATE_LOADS` data:
```
Grade 9:  standard=1, max=2  (not 2/3)
Grade 10: standard=2, max=4  (not 3/5)
Grade 11: standard=4, max=6  (fine)
Grade 12: standard=4, max=5  (fine)
```

**Priority: P1.** Over-recommending courses to freshmen sets them up for burnout.

### 2.3 Trajectory Assessment (academicPlanningAdvisor.ts:968-1010) — ADEQUATE

Maps trends to GRADE_TRAJECTORY_ANALYSIS patterns from `academicDatabase.ts`. The logic is straightforward and the AO interpretations are reasonable.

**One issue:** The mapping treats both 'accelerating' and 'improving' as 'ascending', losing the distinction. An accelerating trend (grades getting better *faster*) is a much stronger signal than steady improvement. The system should distinguish these.

**Priority: P2.** The current behavior is acceptable but loses useful nuance.

### 2.4 Major Alignment Assessment (academicPlanningAdvisor.ts:587-722) — SCORING IS FRAGILE

**Current alignment score calculation:**
```
Start at 100
-15 per missing required course
-5 per missing strong signal course
-20 per active red flag
```

**Issue: The scoring is too sensitive to how courses are categorized.**
- If a major has 5 "required" courses, missing 2 drops to 70 (still "on track" messaging)
- But if a major has 3 "required" courses and 4 "strong signals", missing 2 required drops to 70 and missing 2 signals drops to 60 (different messaging)
- The thresholds (80 = aligned, 50 = partially, below = misaligned) don't account for this variability.

**Also:** The `missingCourses` matching uses partial string match which can produce false negatives:
- "AP Calculus (AB or BC)" won't match "AP Calculus BC" because the full requirement string contains parentheses and slashes
- The `.replace('(not just ab)', '')` on line 649 only handles one specific case

**Recommended fix:** Normalize course name matching with a proper course name resolver that handles: "Calc BC" = "AP Calculus BC" = "Calculus BC", etc. Use the `getAPCourse()` flexible matching from `academicCourseKnowledgeBase.ts`.

**Priority: P1.** A student taking AP Calc BC who gets flagged as "missing Calculus (AB or BC)" receives confusing, incorrect advice.

### 2.5 Research-Backed Guidance Layer — BROKEN CONTEXT BONUS

From the explore agent findings:

**researchBackedGuidanceLayer.ts line ~350:**
```typescript
if ('context_bonus' in schoolContext) {
  calibratedRating -= (schoolContext as { context_bonus: number }).context_bonus;
}
```

This condition always evaluates to false because `schoolContext` objects never have a `context_bonus` property. The entire school context adjustment for GPA interpretation is inert.

**Impact:** When we tell a student "your GPA is strong for your school context," the school context isn't actually being factored in.

**Priority: P0.** This breaks the core promise of context-aware GPA interpretation.

### 2.6 Insight-Driven Advisor — HARDCODED AP RECOMMENDATIONS

`insightDrivenAdvisor.ts` has a `getSpecificAPRecommendation()` function with hardcoded AP course statistics inline, duplicating data from `academicCourseKnowledgeBase.ts`.

**Risk:** When statistics are updated in the knowledge base, the inline values in the advisor become stale. This already happened with the previous AP Chemistry correction.

**Recommended fix:** Replace inline statistics with imports from `AP_COURSES` in `academicCourseKnowledgeBase.ts`.

**Priority: P1.** A single source of truth for AP data already exists; use it everywhere.

---

## Part 3: Implementation Plan (Prioritized)

### P0 — Critical (Must Fix)

#### P0-1: Fix capability estimation thresholds
**File:** `academicPlanningAdvisor.ts`
**What:**
1. Adjust AP readiness threshold from 7.0 to 7.5
2. Cap total qualitative adjustment at +2.0
3. Use course-specific AP readiness thresholds from knowledge base
4. Cross-reference effort claims with course difficulty

**Why:** Every course recommendation flows from this function. If it's too aggressive, students get overwhelmed. If it's too conservative, they miss opportunities.

#### P0-2: Fix broken context bonus in guidance layer
**File:** `researchBackedGuidanceLayer.ts`
**What:** Replace the dead `'context_bonus' in schoolContext` check with actual school context lookup from `GPA_CALIBRATION.school_contexts`.
**Why:** Without this, "context-aware" GPA interpretation is just GPA interpretation.

### P1 — Important (Fix Soon)

#### P1-1: Update college tier classifications
**File:** `collegeExpectationsDatabase.ts`
**What:**
1. Move Vanderbilt to ivy_elite examples
2. Move BU and Tulane to highly_selective examples
3. Move Ohio State, UMass Amherst, Penn State to competitive examples
4. Update GPA medians (highly_selective: 3.85→3.90, selective: 3.65→3.75)
5. Consider adding acceptance rate to examples for transparency

**Why:** Tier misclassification means wrong expectations for students targeting those schools.

#### P1-2: Align workload recommendations with knowledge base
**File:** `academicPlanningAdvisor.ts`
**What:** Change `gradeExpectations` for Grade 9 (standard=2→1, max=3→2) and Grade 10 (standard=3→2, max=5→4) to match `APPROPRIATE_LOADS`.
**Why:** Over-recommending rigor to 9th graders causes burnout and GPA damage.

#### P1-3: Fix major alignment course matching
**File:** `academicPlanningAdvisor.ts`
**What:** Replace string-includes matching with proper course name resolution using `getAPCourse()` from the knowledge base.
**Why:** Students taking the right courses shouldn't be flagged as missing them.

#### P1-4: Deduplicate AP statistics references
**File:** `insightDrivenAdvisor.ts`
**What:** Replace all hardcoded AP statistics with imports from `AP_COURSES` in `academicCourseKnowledgeBase.ts`.
**Why:** Single source of truth prevents stale data.

### P2 — Improvement (When Convenient)

#### P2-1: Fix AP score averages
**File:** `academicCourseKnowledgeBase.ts`
**What:** AP Physics C Mech averageScore 3.49→3.50, AP US History averageScore 3.22→3.23.
**Why:** Align with official CB reported values.

#### P2-2: Distinguish accelerating vs. improving trajectory
**File:** `academicPlanningAdvisor.ts`
**What:** Map 'accelerating' to a distinct pattern with stronger AO interpretation.
**Why:** Captures meaningful nuance in grade trajectory.

#### P2-3: Add engagement confidence gating
**File:** `capabilityConversationEngine.ts`
**What:** When `EngagementAssessment.confidence < 40%`, default to 'continue_normally' instead of acting on uncertain engagement data.
**Why:** Prevents over-reacting to unreliable engagement signals.

#### P2-4: Add conversation turn limit enforcement
**File:** `capabilityConversationEngine.ts`
**What:** Enforce the 30-turn maximum that's mentioned as a parameter but never enforced. After 25 turns, begin wrap-up.
**Why:** Prevents infinite conversations.

---

## Part 4: Data Verification Checklist

### What's Verified (Safe to Cite)
- [x] All 21 AP course pass rates, five rates, average scores — College Board 2024 Official
- [x] NACAC admissions factors importance ratings — NACAC Official
- [x] Harvard/Stanford CDS Section C7 ratings — Official CDS
- [x] Major-specific course requirements (CS, Pre-Med, Engineering, Business, Humanities)
- [x] AP course difficulty tiers, weekly hours, challenge factors — Practitioner consensus
- [x] AP course pairing guidance — Practitioner consensus
- [x] Grade-appropriate course load guidance — Practitioner consensus

### What's Estimated (Present with Appropriate Hedging)
- [ ] AP course counts for admitted students at each tier (no official data exists)
- [ ] Exact GPA medians per tier (CDS reports ranges, not always medians)
- [ ] "Rigor maximization percentage" thresholds (our internal metric)
- [ ] Capability estimation scores (our internal model)
- [ ] Effort-to-capability translation factors

### What Needs Annual Update
- [ ] AP Score Distributions (released each fall by College Board)
- [ ] Acceptance rates (shift 1-3 points annually)
- [ ] School tier classifications (BU, Vanderbilt have shifted significantly)
- [ ] CDS Section C7 factor ratings (schools occasionally reclassify factors)

---

## Part 5: Key Architecture Insight

The academic history system has a **good separation of concerns**:

```
Data Layer (verified, cited)
├── academicResearchFoundation.ts     -- Gold standard verified stats
├── academicCourseKnowledgeBase.ts    -- Course profiles with CB data
└── collegeExpectationsDatabase.ts    -- Tier profiles & major requirements

Logic Layer (algorithms that use data)
├── academicPlanningAdvisor.ts        -- Capability estimation & recommendations
├── insightDrivenAdvisor.ts           -- Profile insight extraction
├── researchBackedGuidanceLayer.ts    -- Calibrated assessment
└── capabilityConversationEngine.ts   -- Conversation orchestration

Assembly Layer (combines for LLM)
└── unifiedResearchAssemblyService.ts -- Formats everything for Claude
```

The data layer is in excellent shape (verified, cited, accurate). The logic layer has the most integrity issues (capability estimation thresholds, broken context bonus, course matching bugs). The assembly layer is well-designed with proper citation guidelines.

**The #1 principle for the building chat:** The data is good — focus fixes on the logic that interprets and applies it.

---

## Part 6: Testing Strategy

For each P0/P1 fix, create a test case:

1. **Capability estimation:** Test with known student profiles
   - C+ student (2.4 GPA) with all positive qualitative factors → should NOT recommend AP
   - B+ student (3.3 GPA) in regular courses with low effort → should suggest honors, maybe AP
   - A- student (3.7 GPA) in AP courses → should continue at AP level
   - A student (3.9 GPA) with high effort → should flag potential ceiling

2. **Tier classification:** Test `getTierBySelectivity()` with boundary rates
   - 4.7% → ivy_elite (Vanderbilt)
   - 7.5% → Ensure correct tier
   - 11% → highly_selective (BU)
   - 55% → competitive (Ohio State)

3. **Major alignment:** Test course name matching
   - "AP Calculus BC" should match requirement "AP Calculus (AB or BC)"
   - "AP Statistics" should match requirement "AP Stats"
   - "calc" should match "AP Calculus AB"

4. **Context GPA interpretation:** Test that school context actually modifies GPA assessment
   - 3.7 GPA at elite_prep school → different interpretation than same GPA at under_resourced school

---

## Appendix: Source Links

| Source | URL | What It Provides |
|--------|-----|------------------|
| CB AP Scores 2024 | https://apcentral.collegeboard.org/media/pdf/ap-score-distributions-by-subject-2024.pdf | Official pass/5 rates for all APs |
| NACAC Factors | https://www.nacacnet.org/factors-in-college-admission/ | What colleges value in admissions |
| Harvard CDS | https://oira.harvard.edu/common-data-set/ | Section C7 factor importance, GPA data |
| Stanford CDS | https://irds.stanford.edu/data-findings/cds | Section C7 factor importance |
| College Kickstart | https://www.collegekickstart.com/blog/item/class-of-2029-admission-results | Current acceptance rates |
| Vanderbilt Rate | vanderbilthustler.com (2025/04/11) | 4.7% Class of 2029 |
| BU Rate | bu.edu/articles/2025/class-of-2029 | Class of 2029 stats |
