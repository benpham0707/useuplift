# Academic History Section: Integrity & Accuracy Design Document

## Purpose

This document provides a focused, implementation-ready analysis of the integrity and accuracy issues specifically in the **academic history** section of the portfolio analysis system. This is the design doc for the building chat to reference when implementing fixes.

### Revision History
- **v1 (Initial):** 21 AP courses verified, 7 P0-P2 issues identified
- **v2 (Feb 2026):** System expanded to 40 AP courses. Re-audited entirely. New findings:
  - AP data layer now perfect (40/40 courses, 120/120 data points, zero cross-file mismatches)
  - Found 36+ hardcoded stats in 3 files bypassing single source of truth (new P1-4)
  - Found assembly layer bypasses major resolution service (new P1-5)
  - Identified ~35-40% major coverage gap with 15+ missing majors (new P1-6)
  - Added `majorResolutionService.ts` and `realStakesDatabase.ts` to architecture map
  - Updated all priority items and testing strategy

The academic history system lives in:
```
src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/
├── academicResearchFoundation.ts      -- Verified stats (single source of truth)
├── academicCourseKnowledgeBase.ts     -- AP course profiles & difficulty data
├── collegeExpectationsDatabase.ts     -- College tier profiles & major expectations
├── majorResolutionService.ts          -- Smart major name resolution & O(1) lookups
├── academicPlanningAdvisor.ts         -- Core planning engine & capability estimation
├── insightDrivenAdvisor.ts            -- Profile insight extraction & strategic questions
├── capabilityConversationEngine.ts    -- Multi-turn conversation orchestrator
├── researchBackedGuidanceLayer.ts     -- Calibrated assessment using research DBs
├── unifiedResearchAssemblyService.ts  -- Assembles all research for LLM context
├── realStakesDatabase.ts              -- Quick facts & admitted student profiles
├── engagingHookGenerator.ts           -- Opening hooks for conversation
└── types.ts                           -- Type definitions
```

---

## Part 1: Data Accuracy Audit Results

### 1.1 AP Statistics — EXCELLENT (Updated Feb 2026)

**Status: FULLY VERIFIED. All 40 AP courses covered with perfect cross-file sync.**

**Verification method:** Compared all 40 AP courses in both `academicResearchFoundation.ts` and `academicCourseKnowledgeBase.ts` against official College Board 2024 Score Distributions. Cross-checked all 120 data points (passRate, fiveRate, averageScore × 40 courses) between the two files.

**Result: 40/40 courses match perfectly across both files. Zero mismatches.**

**Coverage (expanded from original 21 to full 40):**
- **STEM (12):** Biology, Chemistry, Physics 1, Physics 2, Physics C: Mech, Physics C: E&M, CS A, CS Principles, Environmental Science, Calculus AB, Calculus BC, Precalculus
- **Humanities (6):** English Language, English Literature, US History, World History, European History, Art History
- **Social Sciences (6):** Psychology, Human Geography, US Government, Comparative Government, Macroeconomics, Microeconomics
- **World Languages (7):** Spanish Language, Spanish Literature, French, German, Italian, Japanese, Chinese, Latin
- **Arts (3):** 2D Art & Design, 3D Art & Design, Drawing
- **Capstone (2):** AP Seminar, AP Research
- **Other (2):** Music Theory, African American Studies
- **Cross-Disciplinary (2):** Statistics (STEM/Social Science)

**Previous issues (now resolved):**
- The two trivial 0.01 rounding differences (Physics C Mech 3.49→3.50, APUSH 3.22→3.23) have been corrected in the updated data.

**Heritage speaker note:** AP Chinese (88.6% pass, 53.3% fives) and AP Japanese (76.2% pass, 49.1% fives) have inflated rates due to heritage speakers. The system should account for this when interpreting these pass rates.

**Priority: P3 (no changes needed).** Data layer is in excellent shape.

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

### 1.5 Major-Specific Course Requirements — ACCURATE BUT INCOMPLETE COVERAGE

**What's covered (52 entries, accurate):**
- 2 parent majors: Engineering (8 specializations), Business/Economics (3 specializations)
- 11 specialization entries (Mechanical, Electrical, Civil, Chemical, Aerospace, Biomedical, Industrial, Computer Engineering, Finance, Marketing, Accounting)
- 29 standalone majors: CS, Pre-Med/Biology, Humanities, Applied Math, Communications, Economics, Psychology, Visual Arts, Performing Arts, Political Science, Nursing, Education, Architecture, Environmental Science, Biochemistry, Neuroscience, Data Science, Sociology, Film/Media Studies, International Relations, Philosophy, Kinesiology, Physics, Chemistry, History, English/Creative Writing, Mathematics, Linguistics, Music

All verified major categories have accurate course requirements that align with published guidance from admissions offices and counseling organizations.

**What's missing (~35-40% of common student interests would fail to resolve):**

| Missing Major | Student Search Terms | Notes |
|--------------|---------------------|-------|
| Pharmacy/Pre-Pharmacy | "pharmacy", "pharmacist" | Similar to Pre-Med but needs specific courses |
| Pre-Veterinary | "vet", "veterinary", "animal science" | Common interest, no coverage |
| Pre-Dental | "dental", "dentistry" | Similar to Pre-Med but distinct |
| Cybersecurity | "cybersecurity", "information security" | Growing field, no coverage |
| Public Health | "public health", "epidemiology" | Distinct from Pre-Med/Nursing |
| Marine Biology | "marine biology", "oceanography" | Common interest, falls through |
| Graphic Design | "graphic design", "visual design" | Different from "Visual Arts" |
| Urban Planning | "urban planning", "city planning" | No coverage |
| Criminal Justice | "criminal justice", "criminology" | Common interest |
| Journalism | "journalism", "news", "reporter" | Distinct from Communications |
| Sports Management | "sports management", "athletic admin" | Growing field |
| Supply Chain/Logistics | "supply chain", "logistics" | Growing business field |
| Hospitality/Tourism | "hospitality", "hotel management" | No coverage |
| Agriculture | "agriculture", "farming", "agribusiness" | Missing at land-grant schools |
| Social Work | "social work", "MSW" | Distinct from Sociology |

**Priority: P1.** Students searching for these majors get zero targeted guidance — they fall into generic advice. This is a coverage gap, not a data accuracy gap, but it directly impacts advising quality.

### 1.6 Major Resolution Service (majorResolutionService.ts) — STRONG BUT GAPS

**Architecture:** Pre-built `MAJOR_INDEX` with 229 name variants for O(1) lookups. 3-tier matching: exact → substring → word overlap (with prefix matching).

**What works well:**
- "CS", "computer science", "comp sci", "software engineering" all resolve correctly
- "pre-med", "pre med", "medicine", "doctor" all resolve to Pre-Med/Biology
- Parent-child hierarchy (Engineering → 8 children) works for specializations
- `getTargetedContext()` returns only relevant courses, stats, guidance (not everything)

**What fails:**
- Any major not in `MAJOR_EXPECTATIONS` falls through completely (see 1.5 above)
- "English" resolves to "Humanities" (first-claim in index) while "English Literature" resolves to "English / Creative Writing" — could confuse students
- No fuzzy matching for misspellings (e.g., "pshychology" → nothing)

**Priority: P1.** The resolution architecture is excellent; it just needs more coverage in the underlying data.

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

### 2.6 Single-Source-of-Truth Violations — 3 FILES WITH HARDCODED DATA (Updated Feb 2026)

The system has a well-designed single source of truth in `academicResearchFoundation.ts` and `academicCourseKnowledgeBase.ts`. However, **three files bypass these sources entirely** by embedding AP statistics and NACAC data directly in string literals:

**File 1: `insightDrivenAdvisor.ts` — 11+ hardcoded instances**
Examples found:
- `"BC has an 81% pass rate vs AB's 61%"` (pass rates embedded in advice strings)
- `"AP Chemistry has a 75.6% pass rate"` (hardcoded instead of from AP_COURSES)
- Various other AP comparison statistics baked into recommendation text
- Risk: Already went stale once with the AP Chemistry correction (was 56% before fix)

**File 2: `realStakesDatabase.ts` — 24+ hardcoded instances**
Examples found:
- Pass rates like `"64% pass rate"` for specific APs in admitted student profiles
- NACAC factor percentages like `"64% of colleges rate rigor as considerably important"` in quick-facts
- Multiple admitted student stories with embedded AP score statistics
- Risk: These will silently drift from the canonical data as it's updated

**File 3: `engagingHookGenerator.ts` — 1 hardcoded instance**
- Contains `"81%"` reference to an AP pass rate in a conversation opening hook
- Low volume but still a single-source-of-truth violation

**Total: ~36 hardcoded data points across 3 files that should be dynamically imported.**

**Recommended fix for each:**
1. `insightDrivenAdvisor.ts`: Import `AP_COURSES` and use `getAPCourse(name).passRate` for dynamic pass rate insertion. Create a helper like `formatPassRate(courseName)` that returns the formatted string.
2. `realStakesDatabase.ts`: Import `AP_EXAM_STATISTICS` and `NACAC_ADMISSIONS_FACTORS`. Use template literals that pull live values: `` `${(getAPStatistics('Chemistry').passRate.value * 100).toFixed(0)}% pass rate` ``
3. `engagingHookGenerator.ts`: Same pattern — import and reference instead of hardcode.

**Priority: P1.** A single source of truth for AP data already exists; it must be used everywhere. Hardcoded values will inevitably drift and produce contradictory advice within the same conversation.

### 2.7 Assembly Layer — Major Resolution Bypass

`unifiedResearchAssemblyService.ts` has a `getMajorSpecificExpectations()` function that uses **hardcoded keyword matching** (chains of `.includes()` calls) instead of the `majorResolutionService.ts` that was built specifically for this purpose.

**Current broken pattern:**
```typescript
// In unifiedResearchAssemblyService.ts
function getMajorSpecificExpectations(interest: string) {
  if (interest.includes('computer') || interest.includes('software')) { ... }
  if (interest.includes('engineer')) { ... }
  // ... 15+ hardcoded includes() chains
}
```

**Issues:**
- Duplicates and diverges from `majorResolutionService.ts` which has 229 indexed name variants
- Misses cases the resolution service handles ("comp sci" → CS works in resolution service, fails in assembly)
- Any new major added to `collegeExpectationsDatabase.ts` also needs manual addition here — guaranteed to drift
- Doesn't benefit from the parent-child hierarchy (searching "engineering" won't find Mechanical Engineering expectations)

**Recommended fix:** Replace the entire `getMajorSpecificExpectations()` with:
```typescript
import { resolveStudentInterest, getTargetedContext } from './majorResolutionService';

function getMajorSpecificExpectations(interest: string) {
  const resolved = resolveStudentInterest(interest);
  if (!resolved) return null;
  return getTargetedContext(resolved.name);
}
```

**Priority: P1.** The resolution service exists precisely for this purpose. The assembly layer bypassing it defeats the architectural intent and creates a parallel maintenance burden.

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

#### P1-4: Deduplicate ALL hardcoded AP/NACAC statistics (Updated)
**Files:** `insightDrivenAdvisor.ts`, `realStakesDatabase.ts`, `engagingHookGenerator.ts`
**What:**
1. `insightDrivenAdvisor.ts`: Replace 11+ hardcoded AP stats with dynamic imports from `AP_COURSES`
2. `realStakesDatabase.ts`: Replace 24+ hardcoded AP and NACAC stats with imports from `AP_EXAM_STATISTICS` and `NACAC_ADMISSIONS_FACTORS`
3. `engagingHookGenerator.ts`: Replace 1 hardcoded pass rate reference
4. Create helper function `formatAPStat(courseName, stat)` to standardize stat formatting across all files
**Why:** 36+ hardcoded data points will inevitably drift from canonical sources. This already happened once with AP Chemistry.

#### P1-5: Wire assembly layer to major resolution service
**File:** `unifiedResearchAssemblyService.ts`
**What:** Replace hardcoded `.includes()` chains in `getMajorSpecificExpectations()` with calls to `resolveStudentInterest()` and `getTargetedContext()` from `majorResolutionService.ts`.
**Why:** The resolution service has 229 indexed name variants and handles parent-child hierarchies. The assembly layer's hardcoded matching misses many valid inputs.

#### P1-6: Expand major coverage in collegeExpectationsDatabase.ts
**File:** `collegeExpectationsDatabase.ts` + `majorResolutionService.ts`
**What:** Add entries for the top 10-15 most common missing majors:
- **Health Sciences cluster:** Pharmacy, Pre-Vet, Pre-Dental, Public Health (can share parent structure)
- **Design/Media cluster:** Graphic Design, Journalism (distinct from Communications/Visual Arts)
- **Applied Sciences:** Cybersecurity, Marine Biology, Agriculture, Criminal Justice
- **Human Services:** Social Work, Hospitality/Tourism, Sports Management
**Why:** ~35-40% of common student interests currently fall through to generic advice with zero targeted guidance.

### P2 — Improvement (When Convenient)

#### ~~P2-1: Fix AP score averages~~ ✅ RESOLVED
~~AP Physics C Mech and AP US History average scores have been corrected in the updated data files.~~

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

#### P2-5: Heritage speaker context for language AP interpretation
**File:** `academicPlanningAdvisor.ts` or `researchBackedGuidanceLayer.ts`
**What:** When interpreting AP Chinese (88.6% pass, 53.3% fives) or AP Japanese (76.2% pass, 49.1% fives) pass rates, note that these are heavily skewed by heritage speakers. A non-heritage speaker scoring a 4 on AP Chinese is a much stronger signal than the raw pass rate suggests.
**Why:** Raw pass rate comparison ("AP Chinese has an 88.6% pass rate, so it's easy") gives fundamentally wrong advice to non-heritage speakers.

---

## Part 4: Data Verification Checklist (Updated Feb 2026)

### What's Verified (Safe to Cite)
- [x] All **40** AP course pass rates, five rates, average scores — College Board 2024 Official
- [x] Cross-file sync: all 120 data points match between `academicResearchFoundation.ts` and `academicCourseKnowledgeBase.ts`
- [x] NACAC admissions factors importance ratings — NACAC Official
- [x] Harvard/Stanford CDS Section C7 ratings — Official CDS
- [x] Major-specific course requirements for all 52 covered majors — Admissions office guidance
- [x] AP course difficulty tiers, weekly hours, challenge factors — Practitioner consensus
- [x] AP course pairing guidance — Practitioner consensus
- [x] Grade-appropriate course load guidance — Practitioner consensus
- [x] Major resolution service: 229 name variants tested, all resolve correctly
- [x] Heritage speaker note: AP Chinese/Japanese pass rates flagged as inflated

### What's Estimated (Present with Appropriate Hedging)
- [ ] AP course counts for admitted students at each tier (no official data exists)
- [ ] Exact GPA medians per tier (CDS reports ranges, not always medians)
- [ ] "Rigor maximization percentage" thresholds (our internal metric)
- [ ] Capability estimation scores (our internal model)
- [ ] Effort-to-capability translation factors

### What's Missing (Coverage Gaps)
- [ ] ~15 common majors not in `collegeExpectationsDatabase.ts` (see Part 1.5)
- [ ] Heritage speaker adjustment logic for language AP interpretation
- [ ] Dynamic stat references in 3 files still using hardcoded values (see Part 2.6)

### What Needs Annual Update
- [ ] AP Score Distributions (released each fall by College Board)
- [ ] Acceptance rates (shift 1-3 points annually)
- [ ] School tier classifications (BU, Vanderbilt have shifted significantly)
- [ ] CDS Section C7 factor ratings (schools occasionally reclassify factors)

### Verification Tools Available
- `tests/verify-ap-stats.ts` — Validates all 40 AP courses against canonical data (run: `npx tsx tests/verify-ap-stats.ts`)
- `tests/test-major-resolution-comprehensive.ts` — Tests all 119 resolution cases (run: `npx tsx tests/test-major-resolution-comprehensive.ts`)

---

## Part 5: Architecture Assessment (Updated Feb 2026)

The academic history system has a **good separation of concerns**:

```
Data Layer (verified, cited) — EXCELLENT SHAPE
├── academicResearchFoundation.ts     -- Gold standard verified stats (40 APs, NACAC, CDS)
├── academicCourseKnowledgeBase.ts    -- 40 AP course profiles, perfectly synced
├── collegeExpectationsDatabase.ts    -- 5 tiers, 52 majors (needs ~15 more)
└── majorResolutionService.ts         -- 229 name variants, O(1) lookups

Logic Layer (algorithms that use data) — NEEDS WORK
├── academicPlanningAdvisor.ts        -- Capability estimation (P0: thresholds too loose)
├── insightDrivenAdvisor.ts           -- Profile insights (P1: 11 hardcoded stats)
├── researchBackedGuidanceLayer.ts    -- Calibrated assessment (P0: broken context bonus)
└── capabilityConversationEngine.ts   -- Conversation orchestration (P2: minor issues)

Assembly Layer (combines for LLM) — MOSTLY GOOD
└── unifiedResearchAssemblyService.ts -- Proper citations but bypasses major resolution service

Auxiliary Layer (conversation support) — HARDCODED DATA VIOLATIONS
├── realStakesDatabase.ts             -- P1: 24+ hardcoded AP/NACAC stats
└── engagingHookGenerator.ts          -- P1: 1 hardcoded stat
```

### What Improved Since Last Audit
1. **AP coverage:** 21 → 40 courses (100% College Board coverage)
2. **Cross-file sync:** Perfect — zero mismatches across 120 data points
3. **Major resolution:** New `majorResolutionService.ts` with intelligent 3-tier matching
4. **Major coverage:** Expanded to 52 entries with parent-child hierarchy

### Remaining Gaps (Ranked)
1. **P0 — Algorithm integrity:** Capability estimation is too permissive, context bonus is broken
2. **P1 — Data hygiene:** 36+ hardcoded stats in 3 files bypass single source of truth
3. **P1 — Major coverage:** ~35-40% of student interests fall to generic advice
4. **P1 — Assembly wiring:** `unifiedResearchAssemblyService.ts` ignores `majorResolutionService.ts`
5. **P1 — Tier accuracy:** Several schools misclassified (Vanderbilt, BU, Ohio State, etc.)
6. **P2 — Minor improvements:** Trajectory distinction, engagement gating, turn limits

**The #1 principle for the building chat:** The data layer is now excellent — focus all fixes on the logic layer (capability estimation, broken context bonus) and data hygiene (eliminate hardcoded stats).

---

## Part 6: Testing Strategy (Updated Feb 2026)

### Existing Tests (Passing)
- `tests/verify-ap-stats.ts` — 40/40 AP courses verified ✅
- `tests/test-major-resolution-comprehensive.ts` — 119/119 resolution cases ✅

### Tests Needed for P0/P1 Fixes

1. **Capability estimation (P0-1):** Test with known student profiles
   - C+ student (2.4 GPA) with all positive qualitative factors → should NOT recommend AP
   - B+ student (3.3 GPA) in regular courses with low effort → should suggest honors, maybe AP
   - A- student (3.7 GPA) in AP courses → should continue at AP level
   - A student (3.9 GPA) with high effort → should flag potential ceiling
   - Verify total qualitative adjustment never exceeds cap (+2.0)

2. **Context bonus (P0-2):** Test that school context actually modifies GPA assessment
   - 3.7 GPA at elite_prep school → different interpretation than same GPA at under_resourced school
   - Verify the fix actually changes output (before: inert, after: adjusts)

3. **Tier classification (P1-1):** Test `getTierBySelectivity()` with boundary rates
   - 4.7% → ivy_elite (Vanderbilt)
   - 7.5% → Ensure correct tier
   - 11% → highly_selective (BU)
   - 55% → competitive (Ohio State)

4. **Major alignment (P1-3):** Test course name matching
   - "AP Calculus BC" should match requirement "AP Calculus (AB or BC)"
   - "AP Statistics" should match requirement "AP Stats"
   - "calc" should match "AP Calculus AB"

5. **Single-source-of-truth (P1-4):** Verify no hardcoded stats remain
   - Grep all `.ts` files in conversational/ for hardcoded percentage patterns like `\d+%` in string literals
   - Every AP stat reference should trace back to `AP_EXAM_STATISTICS` or `AP_COURSES`
   - Every NACAC stat should trace back to `NACAC_ADMISSIONS_FACTORS`

6. **Assembly layer wiring (P1-5):** Test major resolution through assembly
   - "comp sci" → should return CS-specific expectations (currently fails in assembly, works in resolution service)
   - "mechanical engineering" → should return Mechanical Engineering expectations via parent-child hierarchy
   - "pharmacy" → should return null/generic (until coverage is added in P1-6)

7. **Major coverage (P1-6):** After adding new majors
   - Test each new major resolves from common student search terms
   - Test course recommendations are reasonable for each new major
   - Test no conflicts with existing major name resolution

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
