# Audit: UPLIFT_SCALE_DATABASE & COLLEGE_TIER_BENCHMARKS

> **Analyst:** Rubric & Tier Analyst
> **Date:** 2026-02-10
> **Scope:** Task #1 — Accuracy audit of tier benchmarks, Uplift Scale, and major-adjusted positioning

---

## Executive Summary

**The COLLEGE_TIER_BENCHMARKS GPA ranges are significantly miscalibrated.** Every school in our "Highly Selective" tier actually has admit GPAs in our "Ivy/Elite" range, and every school in our "Selective" tier actually has admit GPAs in our "Highly Selective" range. The net effect: we're telling students they're more competitive than they actually are.

Additionally, the system lacks major-adjusted tiers, which is a critical gap for students like Sarah Chen (CS major) where CS-specific admit thresholds are much higher than general admits.

---

## Issue 1: COLLEGE_TIER_BENCHMARKS GPA Ranges Are Too Low [CRITICAL]

### Current Ranges
```
Ivy/Elite (Top 5-10):       3.85-4.0  → Harvard, Stanford, MIT, Princeton, Yale
Highly Selective (Top 10-30): 3.70-3.89 → Northwestern, UCLA, Georgetown, CMU, UC Berkeley
Selective (Top 30-80):       3.40-3.69 → Boston U, Ohio State, UT Austin, Purdue, UMass
Competitive:                 3.00-3.39 → Most state universities
Accessible:                  2.00-2.99 → Community colleges
```

### Actual CDS/Institutional Data (2024-2025)

#### "Highly Selective" Schools — Our Range: 3.70-3.89

| School | Actual Avg GPA | UW or W? | Our Tier | Should Be |
|--------|---------------|----------|----------|-----------|
| Northwestern | ~4.10 | Weighted | Highly Selective | Ivy/Elite |
| UCLA | 3.95-4.00 (mid 50%) | **Unweighted** | Highly Selective | Ivy/Elite |
| Georgetown | ~4.09 est, 85% top 10% | Weighted | Highly Selective | Ivy/Elite |
| Carnegie Mellon | 3.91, 47% had 4.0 | Weighted | Highly Selective | Ivy/Elite |
| UC Berkeley | 3.92 | **Unweighted** | Highly Selective | Ivy/Elite |

**Conclusion:** All five "Highly Selective" examples have average GPAs ≥ 3.91. By our own scale, these are **Ivy/Elite** schools. The unweighted UCLA (3.95-4.00) and UC Berkeley (3.92) data is especially damning — even without weighting, these schools exceed our Ivy/Elite threshold.

#### "Selective" Schools — Our Range: 3.40-3.69

| School | Actual Avg GPA | UW or W? | Our Tier | Should Be |
|--------|---------------|----------|----------|-----------|
| Boston University | 3.90, 41% had 4.0 | 4.0 scale | Selective | Highly Selective+ |
| Ohio State | ~3.81 (est) | Estimated | Selective | Highly Selective |
| UT Austin | ~3.80-3.83 | Estimated | Selective | Highly Selective |
| Purdue | 3.76, mid-50% 3.62-4.0 | 4.0 scale | Selective | Highly Selective |
| UMass Amherst | ~3.90 | 4.0 scale | Selective | Highly Selective |

**Conclusion:** All five "Selective" examples have average GPAs ≥ 3.76. None would accept a 3.40 GPA student as "competitive." Even Purdue's 25th percentile (~3.62) is near the top of our Selective range.

### What This Means for Sarah Chen (3.66 GPA)

Under our current system, Sarah is told she's "Selective tier (Boston University, Ohio State, UT Austin)" — implying she's a competitive match for these schools. In reality:
- At BU (avg 3.90): She's significantly below average, likely below the 10th percentile of admits
- At Ohio State (avg 3.81): She's below average, roughly 20th-25th percentile
- At Purdue (avg 3.76): She's below average, roughly 25th percentile
- She IS competitive at these schools, but as a **reach**, not a **match**

### Root Cause

Grade inflation has pushed national GPA averages steadily upward. The average US high school GPA is now 3.0 (up from 2.68 in 1990). The competitive threshold for selective colleges has risen accordingly. Our ranges appear calibrated to ~2015-era data.

### The Weighted vs. Unweighted Complication

Our system calculates GPA on a 4.0 unweighted scale (from `subjectPatterns` averages). Many schools report **weighted** GPAs that can exceed 4.0. However:
- UCLA and UC Berkeley explicitly report **unweighted** GPAs of 3.92-4.00
- Even discounting weighted-only reports, the unweighted data shows our ranges are too low by ~0.15-0.25 points

---

## Issue 2: School Misclassification [HIGH]

### Georgia Tech: Referenced But Missing

Georgia Tech appears in the **generated report output** ("UCLA, Georgia Tech — where admitted CS students typically show 3.7+ across all STEM") but is NOT listed in any tier in `COLLEGE_TIER_BENCHMARKS`. Its actual data:
- Average GPA: 4.14 (weighted)
- 92.5% of admits had 4.0+
- Only 1.07% had below 3.49

Georgia Tech should be in Ivy/Elite or the top of Highly Selective.

### UCLA Is Not Peer to Georgetown

Our system groups UCLA with Georgetown in the same tier. But UCLA's unweighted middle 50% (3.95-4.00) is closer to Harvard's profile than to Georgetown's. UCLA's 8.9% acceptance rate is also lower than Georgetown's 12.9%.

### UT Austin CS vs. UT Austin General

We list UT Austin in "Selective" but UT Austin's CS program admits students through a far more competitive process. External transfer CS acceptance: 6 out of 1,037 (0.6%). Lumping UT Austin CS in with UT Austin broadly is misleading.

---

## Issue 3: No Major-Adjusted Tiers [HIGH]

### The Problem

Our `getTierForGPA()` function maps a single GPA number to a single tier. But admission selectivity varies enormously by major:

| School | Overall Acceptance | CS Acceptance | CS GPA Range |
|--------|-------------------|---------------|-------------|
| Carnegie Mellon | 11.6% | <5% | 3.8+ UW |
| Georgia Tech | ~16% | More selective | 3.85+ |
| Purdue | ~53% | ~10-35% | 3.80-4.0 |
| UT Austin | ~29% | Much lower (holistic) | ~3.85+ |

### Impact on Sarah Chen's Report

Sarah is a CS major with a 3.66 overall GPA. The report currently says she's in "Selective" tier and frames her as competitive at "Boston U, Ohio State, UT Austin." But for **CS specifically**:
- Purdue CS expects 3.80-4.0 → She's below their floor
- CMU CS accepts <5% with 3.8+ → Unrealistic
- Georgia Tech CS → Highly competitive, she'd be a stretch
- UT Austin CS → Very competitive, she'd be a stretch

Her CS-specific tier is actually "Competitive" rather than "Selective" — a full tier lower than the report suggests.

### What We'd Need for Major-Adjusted Tiers

1. **Data source**: CS-specific (or engineering-specific) GPA ranges for 15-20 schools across our tiers. This data is hard to find officially — schools rarely publish major-specific GPA distributions. We'd need to compile it from:
   - Departmental admissions pages
   - Common Data Set Section C (which has overall data, not by major)
   - Third-party compilations (CollegeVine, PrepScholar)

2. **Implementation**: A lookup table mapping `(major, tier)` → `adjustedGPARange` for the most competitive majors (CS, Engineering, Business, Nursing). Other majors use the default tier.

3. **Complexity**: This significantly increases the data maintenance burden but dramatically improves accuracy for the 40%+ of students targeting competitive majors.

---

## Issue 4: Uplift Scale Percentile Claims [MEDIUM]

### Current Claims

| Grade | Claimed Percentile | schoolFit |
|-------|-------------------|-----------|
| A+ | Top 1-2% nationally | Ivy League, Stanford, MIT, Caltech, top-5 programs |
| A | Top 5% | Top-20 universities, selective LACs, flagship honors |
| A- | Top 10% | Top-30 universities, strong match for top-50 |
| B+ | Top 15-20% | Competitive at top-50, strong match for top-80 |
| B | Top 25-30% | Large state universities, mid-tier private |
| B- | Top 35-40% | State universities, regional private |

### Analysis

**Percentile claims are roughly defensible** as holistic assessments (not pure GPA percentiles) given the national average GPA is 3.0 (50th percentile) and a 4.0 is ~98th percentile. The Uplift Scale explicitly factors in rigor, major alignment, trends, and difficulty sensitivity — so a B+ student with high rigor could be top 15-20% holistically even if their raw GPA doesn't place them there.

**However, the granularity is questionable:**
- Can we really distinguish "top 15-20%" (B+) from "top 25-30%" (B)? That's a 10-percentage-point gap driven by subjective holistic assessment.
- The difference between B+ and B is described as: "Good rigor with some grade variation" vs. "Adequate rigor with average performance." This is vague enough that two different LLM calls might classify the same student differently.

**schoolFit claims need recalibration:**
- B+ says "Competitive at top-50 universities" — But top-50 schools (like BU, ranked ~42) have average GPAs of 3.9. A B+ student (even holistically) would need extraordinary extracurriculars.
- A- says "Competitive at top-30" — Top-30 schools have 3.85+ average GPAs. An A- student might be competitive but not a strong match.
- The word "competitive" is doing a lot of heavy lifting. If it means "you have a nonzero chance," it's technically true. If it means "you'd be a typical admit," it's misleading.

### Differentiation Between Adjacent Grades

The descriptors ARE meaningfully different in content:
- B+ emphasizes "strengths visible but so are gaps" — an uneven profile
- B emphasizes "developing but not yet distinctive" — a flat/unremarkable profile
- B- emphasizes "imbalance between challenge and performance" — a mismatch profile

These distinctions are useful for advising, even if the percentile precision is illusory. **Recommendation: Keep the qualitative descriptors, soften the percentile claims to ranges (e.g., "roughly top 15-25%"), and recalibrate schoolFit to match corrected tiers.**

---

## Issue 5: NACAC Statistics Accuracy [LOW]

### Current vs. Verified

| Factor | Our Value | NACAC 2023 Actual | Verdict |
|--------|-----------|-------------------|---------|
| Rigor importance | 64% | 63.8% | Close enough |
| Academic GPA | 77% | 74.1% (total HS grades) | Off by ~3 points |
| Grades in college prep | 69% | 76.8% | **Off by ~8 points** |
| Test scores | "Moderately Important" | Varies | OK |

The "Grades in college prep courses" figure (69% vs actual 76.8%) is notably wrong. It appears our 77% and 69% may have been swapped — 77% is closer to the college prep figure (76.8%), and 74.1% is the total grades figure. This suggests a label swap during data entry.

---

## Proposed Fixes

### Fix 1: Recalibrate COLLEGE_TIER_BENCHMARKS [CRITICAL]

**Philosophy change:** Our GPA ranges should represent the zone where a student would be **realistically competitive** (roughly 25th-75th percentile of admits), not where they'd be average.

```typescript
const COLLEGE_TIER_BENCHMARKS: TierInfo[] = [
  {
    name: 'Ivy/Elite (Top 10)',
    examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale', 'Columbia'],
    gpaRange: '3.90-4.0',
    median: 3.96,
  },
  {
    name: 'Highly Selective (Top 10-25)',
    examples: ['Northwestern', 'UCLA', 'UC Berkeley', 'Carnegie Mellon', 'Georgetown', 'Georgia Tech'],
    gpaRange: '3.80-3.94',
    median: 3.88,
  },
  {
    name: 'Selective (Top 25-60)',
    examples: ['Boston University', 'UT Austin', 'Purdue', 'Ohio State', 'UMass Amherst', 'UW-Madison'],
    gpaRange: '3.60-3.79',
    median: 3.72,
  },
  {
    name: 'Competitive (Top 60-150)',
    examples: ['Arizona State', 'Iowa State', 'University of Oregon', 'Temple University'],
    gpaRange: '3.20-3.59',
    median: 3.40,
  },
  {
    name: 'Accessible',
    examples: ['Community colleges', 'Open admission institutions'],
    gpaRange: '2.00-3.19',
    median: 2.80,
  },
];
```

Key changes:
- **Ivy/Elite floor raised** from 3.85 → 3.90 (reflects reality that even 25th percentile Ivy admits are 3.85+)
- **Highly Selective floor raised** from 3.70 → 3.80 (UCLA UW 25th percentile is ~3.90+, so 3.80 is conservative)
- **Selective floor raised** from 3.40 → 3.60 (Purdue 25th percentile is ~3.62, BU is ~3.75)
- **Competitive floor raised** from 3.00 → 3.20
- **Added Georgia Tech** to Highly Selective examples
- **Added UW-Madison** to Selective examples
- **Moved school examples** to correct tiers

Updated `getTierForGPA()`:
```typescript
function getTierForGPA(gpa: number): TierInfo {
  if (gpa >= 3.90) return COLLEGE_TIER_BENCHMARKS[0];
  if (gpa >= 3.80) return COLLEGE_TIER_BENCHMARKS[1];
  if (gpa >= 3.60) return COLLEGE_TIER_BENCHMARKS[2];
  if (gpa >= 3.20) return COLLEGE_TIER_BENCHMARKS[3];
  return COLLEGE_TIER_BENCHMARKS[4];
}
```

**Impact on Sarah Chen (3.66 GPA):** She moves from "Selective" to... still "Selective" (3.60-3.79 range). But the school examples are now more accurate — BU, Ohio State, Purdue are schools where a 3.66 puts her in the competitive-but-below-average range.

### Fix 2: Add Major-Adjusted Tier Overlays [HIGH — Deferred]

Rather than a full major-tier matrix (high maintenance burden), add a simple adjustment for the most competitive majors:

```typescript
interface MajorTierAdjustment {
  majorCategory: string;
  gpaBoost: number;  // How much higher the effective GPA threshold is for this major
  affectedTiers: string[];  // Which tiers are affected
  note: string;
}

const MAJOR_TIER_ADJUSTMENTS: MajorTierAdjustment[] = [
  {
    majorCategory: 'Computer Science',
    gpaBoost: 0.10,
    affectedTiers: ['Highly Selective', 'Selective'],
    note: 'CS programs at selective schools often have 5-15% acceptance rates vs. 20-50% overall',
  },
  {
    majorCategory: 'Engineering',
    gpaBoost: 0.08,
    affectedTiers: ['Highly Selective', 'Selective'],
    note: 'Engineering schools within universities are typically more selective than general admits',
  },
  {
    majorCategory: 'Business',
    gpaBoost: 0.05,
    affectedTiers: ['Highly Selective', 'Selective'],
    note: 'Business programs (McCombs, Ross, Wharton) more selective than host institution',
  },
  {
    majorCategory: 'Nursing',
    gpaBoost: 0.05,
    affectedTiers: ['Selective'],
    note: 'Direct-entry nursing programs are typically more selective',
  },
];
```

Usage: When a student's major matches, shift tier thresholds UP by the boost amount. For Sarah (CS major), the Selective threshold becomes 3.60 + 0.10 = 3.70, pushing her into Competitive for CS-specific programs.

**This is a significant feature addition and should be a separate task.** For now, the report should at minimum include a disclaimer when the student's major is highly competitive.

### Fix 3: Recalibrate Uplift Scale schoolFit [MEDIUM]

Update the schoolFit strings in `UPLIFT_SCALE_DATABASE` to match corrected tiers:

```typescript
// B+ schoolFit — BEFORE:
'Competitive at top-50 universities, strong match for top-80 schools.'
// B+ schoolFit — AFTER:
'Competitive at selective state flagships (Purdue, Ohio State, UT Austin). Top-30 schools are realistic reaches with strong supplementary profile.'

// A- schoolFit — BEFORE:
'Competitive at top-30 universities, strong match for top-50 schools, and excellent position at selective state universities.'
// A- schoolFit — AFTER:
'Competitive at highly selective schools (Northwestern, UCLA, UC Berkeley). Strong match for selective state flagships and top-50 schools.'

// B schoolFit — BEFORE:
'Good fit for large state universities and mid-tier private colleges. Top-50 schools are realistic reaches with strong supplementary profile.'
// B schoolFit — AFTER:
'Competitive at mid-range state universities and regional private colleges. Selective state flagships (UT Austin, Purdue) are realistic reaches with strong extracurriculars.'
```

### Fix 4: Correct NACAC Statistics [LOW]

In `generateResearchContext()`, fix the swapped percentages:

```typescript
const admissionsFactors = [
  { factor: 'Grades in college prep courses', importance: 'Very Important (77% of colleges)', citation: 'NACAC 2023' },
  { factor: 'Academic GPA', importance: 'Very Important (74% of colleges)', citation: 'NACAC 2023' },
  { factor: 'Rigor of secondary school record', importance: 'Very Important (64% of colleges)', citation: 'NACAC 2023' },
  { factor: 'Standardized test scores', importance: 'Moderately Important (varies by school)', citation: 'NACAC 2023' },
];
```

Note: Reordered by importance (highest % first) and corrected percentages.

---

## Questions for the Lead

1. **How aggressively should we recalibrate?** The proposed Fix 1 is a moderate adjustment. A more aggressive option would raise thresholds further (Ivy/Elite to 3.95+, Highly Selective to 3.85+) but that would push Sarah Chen into "Competitive" tier, which might feel too harsh for a 3.66 GPA student. What's the right balance between accuracy and student experience?

2. **Should we add the weighted/unweighted distinction?** Our system uses unweighted GPA, but many schools report weighted. Should we acknowledge this in the report (e.g., "Note: These tiers are based on unweighted GPA. Many schools report weighted GPAs that can exceed 4.0, so your position may differ slightly")?

3. **Major-adjusted tiers: implement now or defer?** Fix 2 is impactful but adds complexity. Should it be part of this audit's remediation, or a separate follow-up task?

4. **Do we want to soften the Uplift Scale percentile claims?** Changing "Top 15-20%" to "roughly top 15-25%" reduces precision-illusion but might feel less authoritative. What's the preference?

5. **Should Competitive tier have real school names?** Currently it says "Most state universities, Regional private colleges." Adding specific examples (Arizona State, Iowa State, University of Oregon) would be consistent with other tiers and more useful for students. But we'd need to verify those schools' GPA data too.

---

## Data Sources

- [Harvard CDS 2023-2024](https://bpb-us-e1.wpmucdn.com/sites.harvard.edu/dist/6/210/files/2024/05/CDS_2023-2024-Final-4755619e875b1241.pdf): 73% of enrolled had 4.0, 93.73% had 3.75+
- [UCLA First-Year Profile Fall 2025](https://admission.ucla.edu/apply/first-year/first-year-profile/2025): UW middle 50% 3.95-4.00
- [UC Berkeley Student Profile](https://admissions.berkeley.edu/apply-to-berkeley/student-profile/): UW GPA 3.92
- [Georgia Tech CDS 2024-2025](https://irp.gatech.edu/files/CDS/CDS_2024-2025_FINAL_20FEB2025.pdf): Average 4.14, 92.5% had 4.0+
- [Carnegie Mellon CDS 2024-2025](https://www.cmu.edu/ira/CDS/pdf/cds_2024-25/common-data-set-2024-2025-21feb2025.pdf): Average 3.91, 47% had 4.0
- [Northwestern CDS 2024-2025](https://www.enrollment.northwestern.edu/data/2024-2025.pdf): Average ~4.10
- [Purdue Class Profile](https://admissions.purdue.edu/academics/freshmanprofile.php): Average 3.76, Engineering 3.81-4.0
- [BU Class Profile](https://www.bu.edu/admissions/why-bu/class-profile/): Average 3.90, 41% had 4.0
- [UMass Amherst Admissions Statistics](https://www.umass.edu/admissions/undergraduate-admissions/explore/admissions-statistics): Average ~3.90
- [NACAC State of College Admission 2023](https://www.nacacnet.org/state-of-college-admission-report/): Factors in admission decisions
- National high school GPA average: 3.0 (2024), up from 2.68 in 1990

---

*End of audit findings.*
