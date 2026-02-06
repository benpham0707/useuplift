# Integrity & Accuracy Implementation Plan

## Academic Advising System - Research-Backed Redesign

**Purpose**: This document consolidates research findings and provides a complete implementation blueprint for fixing integrity and accuracy issues in Uplift's academic advising systems.

**Status**: Ready for implementation
**Created**: 2026-02-04

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Findings: Official Sources](#2-research-findings-official-sources)
3. [Verification Level System Design](#3-verification-level-system-design)
4. [Additive Context Model Design](#4-additive-context-model-design)
5. [Activity Tier Framework with Citations](#5-activity-tier-framework-with-citations)
6. [School-Specific Values with Sources](#6-school-specific-values-with-sources)
7. [Implementation Checklist](#7-implementation-checklist)

---

## 1. Executive Summary

### Critical Issues Identified

The current system contains several integrity problems that undermine credibility:

| Issue | Severity | Location |
|-------|----------|----------|
| Fabricated percentage boosts (80% for low-income) | **HIGH** | contextAdjustmentDatabase.ts |
| Multiplicative boost calculation (1.8 × 1.6 = 2.88x) | **HIGH** | contextAdjustmentDatabase.ts |
| "Harvard Scale" implying official Harvard methodology | **MEDIUM** | academicDatabase.ts |
| Post-SFFA race-based factors still present | **HIGH** | contextAdjustmentDatabase.ts |
| Course "requirements" contradicting own disclaimers | **MEDIUM** | academicDatabase.ts |
| Unverified school character weights | **MEDIUM** | schoolValueDatabase.ts |

### Solution Principles

1. **No fabricated percentages** - Remove all made-up admission boost claims
2. **Additive, not multiplicative** - Context adjustments add points, don't multiply
3. **Transparent verification levels** - Every claim tagged with its source type
4. **Honest about subjectivity** - Editorial judgments labeled as such
5. **Post-SFFA compliant** - Remove race-based factors entirely

---

## 2. Research Findings: Official Sources

### 2.1 College Admissions Statistics

#### Harvard (Class of 2028)
- **Source**: [Harvard College Admissions](https://college.harvard.edu/)
- Overall acceptance rate: 3.6%
- Pell Grant eligible: 20.7%
- First-generation: 20.5%
- Verification: `official`

#### NACAC State of College Admission 2024
- **Source**: [NACAC Reports](https://www.nacacnet.org/)
- Grades in college prep courses: 76.8% rate as "considerable importance"
- Strength of curriculum: 63.8% rate as "considerable importance"
- Test scores: Only 5% rate as "considerable importance"
- Verification: `official`

#### Holistic Review Prevalence
- **Source**: Various industry reports
- 92% of schools use holistic review (2023)
- Verification: `industry`

### 2.2 Course Rigor Importance

**Key Finding**: Course rigor is the #3 most important factor in admissions (NACAC).

| Factor | NACAC Importance Ranking |
|--------|-------------------------|
| Grades in college prep | #1 (76.8% considerable) |
| Overall GPA | #2 |
| Strength of curriculum | #3 (63.8% considerable) |
| Test scores | Declining (only 5% considerable) |

**Source**: [NACAC State of College Admission](https://www.nacacnet.org/)
**Verification**: `official`

### 2.3 AP Course Value

- **Source**: [College Board AP Program Results](https://reports.collegeboard.org/ap-program-results/class-of-2024)
- 85% of selective colleges report AP experience "favorably impacts" admission
- 35.7% of 2024 US public high school graduates took at least 1 AP exam
- AP provides "national benchmark" indifferent to school-specific grading
- **Verification**: `official`

### 2.4 Extracurricular Depth vs. Breadth

**Key Finding**: For elite colleges, DEPTH beats BREADTH.

- Average elite college admits: 3-4 activities (not 10+)
- Time investment: 4-10 hours per week on key pursuits
- "Well-lopsided" > "Well-rounded" for selective institutions
- **Source**: [CollegeVine Research](https://blog.collegevine.com/)
- **Verification**: `industry`

### 2.5 Early Decision Research

- **Source**: Various academic research
- ED acceptance rates: 2-3x higher than RD at many schools
- **Confound**: Includes recruited athletes, legacy, development cases
- True "boost" for unhooked applicants: Smaller and harder to quantify
- **Verification**: `published` (with caveats)

### 2.6 Legacy Impact Research

- **Source**: Princeton research (2009 data)
- Legacy acceptance: 41.7% vs Non-legacy: 9.2% (historical)
- Odds ratio: ~3.13x (but varies significantly by institution)
- Post-2020 trend: Many schools de-emphasizing or eliminating legacy
- **Verification**: `published` (historical, may be outdated)

---

## 3. Verification Level System Design

### 3.1 Type Definition

```typescript
/**
 * Verification levels indicate the source reliability of any claim
 * in our advising system. Every numeric value MUST have one.
 */
type VerificationLevel =
  | 'official'    // Direct from institution (Harvard.edu, CollegeBoard, MAA, etc.)
  | 'published'   // Peer-reviewed research, academic studies
  | 'industry'    // Expert consensus (NACAC, IvyCoach, PrepScholar)
  | 'editorial'   // Our informed judgment - transparent about subjectivity
  | 'deprecated'; // Data marked for removal/replacement

interface VerifiedClaim<T> {
  value: T;
  verificationLevel: VerificationLevel;
  source?: {
    name: string;
    url?: string;
    year?: number;
    accessDate?: string;  // When we last verified this
  };
  rationale?: string;     // Why we chose this value (for editorial)
  expirationWarning?: string; // When this might become stale
}
```

### 3.2 Application Examples

```typescript
// GOOD: Official data with citation
const usamoQualifiers: VerifiedClaim<number> = {
  value: 250,
  verificationLevel: 'official',
  source: {
    name: 'Mathematical Association of America',
    url: 'https://maa.org/maa-invitational-competitions/',
    year: 2024,
    accessDate: '2026-02-04'
  }
};

// GOOD: Editorial judgment with rationale
const intellectualVitalityWeight: VerifiedClaim<number> = {
  value: 1.2, // Relative weight, not a "boost"
  verificationLevel: 'editorial',
  rationale: 'Stanford explicitly emphasizes intellectual vitality as a core value. Weight reflects this stated priority relative to other factors.',
  source: {
    name: 'Stanford Admissions - What We Look For',
    url: 'https://admission.stanford.edu/apply/overview/index.html',
    year: 2024
  }
};

// BAD (CURRENT): Fabricated percentage
const lowIncomeBoost = {
  admission_boost: 1.8, // WHERE DOES THIS COME FROM?
  // No source, no rationale, implies 80% higher admission rate
};
```

### 3.3 Migration Strategy

Every existing numeric claim must be:
1. Tagged with a verification level
2. Given a source citation (if official/published/industry)
3. Given a rationale (if editorial)
4. Removed if deprecated/indefensible

---

## 4. Additive Context Model Design

### 4.1 The Problem with Multiplicative Boosts

**Current (WRONG) approach:**
```typescript
// contextAdjustmentDatabase.ts (current)
low_income: { admission_boost: 1.8 }  // 80% boost - FABRICATED
first_gen: { admission_boost: 1.6 }   // 60% boost - FABRICATED

// Applied multiplicatively:
// base_score × 1.8 × 1.6 = base_score × 2.88
// This implies a 188% higher chance - ABSURD
```

**Problems:**
1. The percentages are fabricated (no source exists)
2. Multiplicative combination creates runaway effects
3. Implies we know admission probabilities (we don't)
4. Post-SFFA: Race-based factors are legally problematic

### 4.2 The New Additive Context Points System

**Principle**: Context factors ADD points to a score, with a cap.

```typescript
interface ContextFactor {
  id: string;
  name: string;
  contextPoints: number;        // Additive points (0-10 scale)
  verificationLevel: 'editorial'; // These are always editorial
  rationale: string;            // Explain the reasoning
  applicability: string;        // When this applies
}

interface ContextPointsConfig {
  maxTotalBonus: number;        // Cap on total context points (e.g., 15)
  factors: ContextFactor[];
}
```

### 4.3 Proposed Context Factors

```typescript
const contextFactors: ContextFactor[] = [
  {
    id: 'first_generation',
    name: 'First-Generation College Student',
    contextPoints: 5,
    verificationLevel: 'editorial',
    rationale: `
      Research shows first-gen students face unique challenges in college navigation.
      Harvard's class is 20.5% first-gen (official), indicating institutional priority.
      NACAC reports colleges increasingly focus on first-gen status for diversity.
      Points reflect increased consideration, not a known probability boost.
    `,
    applicability: 'Neither parent completed a 4-year degree'
  },
  {
    id: 'low_income',
    name: 'Low-Income Background',
    contextPoints: 5,
    verificationLevel: 'editorial',
    rationale: `
      Pell Grant eligibility is tracked by elite schools (Harvard: 20.7% Pell).
      Colleges evaluate achievements "in context" of available opportunities.
      College Board Landscape tool provides disadvantage indicators.
      Points reflect context consideration, not admission probability.
    `,
    applicability: 'Pell Grant eligible or family income below median'
  },
  {
    id: 'rural_underserved',
    name: 'Rural/Underserved Area',
    contextPoints: 3,
    verificationLevel: 'editorial',
    rationale: `
      Colleges seek geographic diversity and recognize resource limitations.
      Rural students have fewer AP courses, extracurricular options.
      Context points reflect evaluation "in light of opportunities available."
    `,
    applicability: 'Rural classification or underserved geographic area'
  },
  {
    id: 'limited_school_resources',
    name: 'Under-Resourced High School',
    contextPoints: 3,
    verificationLevel: 'editorial',
    rationale: `
      Colleges evaluate rigor relative to what was available.
      Taking 3 APs at a school offering 4 is different from 3 at a school offering 20.
      Reflects "achievements in context" evaluation approach.
    `,
    applicability: 'High school offers fewer than 10 AP courses'
  }
];

const contextConfig: ContextPointsConfig = {
  maxTotalBonus: 15, // Regardless of how many factors apply
  factors: contextFactors
};
```

### 4.4 Application Logic

```typescript
function applyContextAdjustment(
  baseScore: number,           // 0-100 scale
  studentContext: StudentContext
): { adjustedScore: number; breakdown: ContextBreakdown } {

  let totalBonus = 0;
  const appliedFactors: AppliedFactor[] = [];

  for (const factor of contextConfig.factors) {
    if (studentMeetsCriteria(studentContext, factor.id)) {
      appliedFactors.push({
        factor: factor.name,
        points: factor.contextPoints,
        rationale: factor.rationale
      });
      totalBonus += factor.contextPoints;
    }
  }

  // Apply cap
  const cappedBonus = Math.min(totalBonus, contextConfig.maxTotalBonus);

  return {
    adjustedScore: Math.min(100, baseScore + cappedBonus),
    breakdown: {
      baseScore,
      contextBonus: cappedBonus,
      appliedFactors,
      note: cappedBonus < totalBonus
        ? `Bonus capped at ${contextConfig.maxTotalBonus} points`
        : undefined
    }
  };
}
```

### 4.5 What to Remove

**DELETE these fabricated claims:**
- `admission_boost: 1.8` (low-income)
- `admission_boost: 1.6` (first-gen)
- Any race-based adjustment factors
- Any claim of specific percentage increases in admission probability

---

## 5. Activity Tier Framework with Citations

### 5.1 Tier Definitions with Verifiable Selectivity

#### Tier 1: Exceptional (National/International Recognition)

| Achievement | Annual Selectivity | Source | Verification |
|-------------|-------------------|--------|--------------|
| IMO Team Member | 6 students | MAA | `official` |
| USAMO Qualifier | ~250 students | MAA | `official` |
| Regeneron STS Finalist | 40 from 2,500 (1.6%) | Society for Science | `official` |
| ISEF Grand Award Winner | ~600 from 1,800 | Society for Science | `official` |
| Presidential Scholar | ~160 students | US Dept of Education | `official` |
| National YoungArts Winner | ~170 from 12,000 | YoungArts Foundation | `official` |

**Tier 1 Criteria**: Top ~0.1% nationally in competitive field

#### Tier 2: Distinguished (State/Regional Excellence)

| Achievement | Annual Selectivity | Source | Verification |
|-------------|-------------------|--------|--------------|
| AIME Qualifier | 6,000-7,000 (top 2.5-5%) | MAA | `official` |
| National Merit Semifinalist | ~16,000 (top 1%) | NMSC | `official` |
| Regeneron STS Scholar (Semifinalist) | 300 from 2,500 (12%) | Society for Science | `official` |
| ISEF Finalist | 1,800 from 7M+ feeders | Society for Science | `official` |
| All-State Recognition | Varies by state | State organizations | `official` |
| Published Research | Varies | Journal-specific | `published` |

**Tier 2 Criteria**: Top ~1-5% in competitive field

#### Tier 3: Accomplished (Demonstrated Impact)

| Achievement | Criteria | Verification |
|-------------|----------|--------------|
| Club/Organization President | Leadership + measurable outcomes | `editorial` |
| Varsity Team Captain | Leadership + team achievements | `editorial` |
| Research with Presentation | Conference/symposium presentation | `editorial` |
| Founded Organization | Demonstrated traction and impact | `editorial` |
| Significant Employment | 10+ hrs/week with responsibility growth | `editorial` |

**Tier 3 Criteria**: Demonstrated leadership, initiative, measurable impact

#### Tier 4: Participant (Meaningful Engagement)

| Achievement | Criteria | Verification |
|-------------|----------|--------------|
| Club Member | Consistent multi-year involvement | `editorial` |
| JV/Recreational Athletics | Commitment and growth | `editorial` |
| Community Service | 50+ hours with genuine engagement | `editorial` |
| Part-time Employment | Work experience with responsibility | `editorial` |

**Tier 4 Criteria**: Active participation, personal growth, commitment

### 5.2 Score Ranges by Tier

```typescript
interface TierScoring {
  tier: 1 | 2 | 3 | 4;
  scoreRange: { min: number; max: number };
  verificationLevel: 'editorial';
  rationale: string;
}

const tierScoring: TierScoring[] = [
  {
    tier: 1,
    scoreRange: { min: 90, max: 100 },
    verificationLevel: 'editorial',
    rationale: 'Tier 1 represents nationally competitive achievements that distinguish applicants at the most selective institutions.'
  },
  {
    tier: 2,
    scoreRange: { min: 75, max: 89 },
    verificationLevel: 'editorial',
    rationale: 'Tier 2 represents state/regional excellence that demonstrates high achievement above typical applicant pools.'
  },
  {
    tier: 3,
    scoreRange: { min: 55, max: 74 },
    verificationLevel: 'editorial',
    rationale: 'Tier 3 represents meaningful leadership and impact that shows initiative and follow-through.'
  },
  {
    tier: 4,
    scoreRange: { min: 30, max: 54 },
    verificationLevel: 'editorial',
    rationale: 'Tier 4 represents consistent engagement that demonstrates interests and commitment.'
  }
];
```

---

## 6. School-Specific Values with Sources

### 6.1 Harvard

**Official Source**: [Harvard Intellectual Vitality Initiative](https://intellectualvitality.college.harvard.edu/)

**Stated Values**:
- "Spirit of open and rigorous inquiry"
- "Humility, respect, and genuine curiosity toward each other"
- "Charitable exchange of ideas"
- "Partners in the pursuit of knowledge and understanding"

**Key Admissions Factors** (from Harvard statements):
- Academic excellence in context
- Intellectual curiosity beyond classroom
- Community contribution and leadership
- Personal qualities and character

```typescript
const harvardValues: SchoolValues = {
  school: 'Harvard',
  verificationLevel: 'official',
  source: {
    name: 'Harvard College Intellectual Vitality',
    url: 'https://intellectualvitality.college.harvard.edu/',
    year: 2024
  },
  valuePriorities: [
    { value: 'intellectual_curiosity', emphasis: 'very_high', source: 'official' },
    { value: 'academic_excellence', emphasis: 'very_high', source: 'official' },
    { value: 'community_contribution', emphasis: 'high', source: 'official' },
    { value: 'personal_character', emphasis: 'high', source: 'official' }
  ],
  // NOTE: Numeric weights below are EDITORIAL interpretations
  editorialWeights: {
    intellectual_vitality: 1.2,
    academic_rigor: 1.2,
    community_impact: 1.1,
    leadership: 1.1,
    verificationLevel: 'editorial',
    rationale: 'Weights reflect stated priorities from official sources'
  }
};
```

### 6.2 Stanford

**Official Source**: [Stanford Holistic Admission](https://admission.stanford.edu/apply/overview/index.html)

**Stated Values**:
- Academic excellence
- Intellectual vitality: "genuine interest in expanding intellectual horizons"
- Personal context: achievements evaluated relative to opportunities
- Unique combination of qualities, perspectives, experiences

**Key Quote**: "Intellectual vitality is your commitment, dedication, and genuine interest in expanding your intellectual horizons... evidence of a truly thinking mind."

```typescript
const stanfordValues: SchoolValues = {
  school: 'Stanford',
  verificationLevel: 'official',
  source: {
    name: 'Stanford Admissions - Holistic Admission',
    url: 'https://admission.stanford.edu/apply/overview/index.html',
    year: 2024
  },
  valuePriorities: [
    { value: 'intellectual_vitality', emphasis: 'very_high', source: 'official' },
    { value: 'academic_achievement', emphasis: 'very_high', source: 'official' },
    { value: 'personal_context', emphasis: 'high', source: 'official' },
    { value: 'unique_perspectives', emphasis: 'high', source: 'official' }
  ],
  editorialWeights: {
    intellectual_vitality: 1.3,
    academic_rigor: 1.2,
    innovation: 1.1,
    context_awareness: 1.1,
    verificationLevel: 'editorial',
    rationale: 'Stanford explicitly emphasizes intellectual vitality as core differentiator'
  }
};
```

### 6.3 MIT

**Official Source**: [MIT Admissions - What We Look For](https://mitadmissions.org/apply/process/what-we-look-for/)

**Stated Values**:
- Academics: preparation for rigorous coursework
- Curiosity and creativity: "you shouldn't just enjoy thinking, you should enjoy doing"
- Collaboration: working on teams, improving communities
- Character: resilience, learning from setbacks
- "Maker" mindset: hands-on projects, building things

**Key Quote**: "We are looking for students with problem-solving, collaboration, and a desire to make a difference."

```typescript
const mitValues: SchoolValues = {
  school: 'MIT',
  verificationLevel: 'official',
  source: {
    name: 'MIT Admissions - What We Look For',
    url: 'https://mitadmissions.org/apply/process/what-we-look-for/',
    year: 2024
  },
  valuePriorities: [
    { value: 'academic_preparation', emphasis: 'very_high', source: 'official' },
    { value: 'hands_on_making', emphasis: 'very_high', source: 'official' },
    { value: 'collaboration', emphasis: 'high', source: 'official' },
    { value: 'curiosity_creativity', emphasis: 'high', source: 'official' },
    { value: 'character_resilience', emphasis: 'high', source: 'official' }
  ],
  editorialWeights: {
    maker_projects: 1.3,
    stem_depth: 1.2,
    collaboration: 1.2,
    problem_solving: 1.2,
    verificationLevel: 'editorial',
    rationale: 'MIT uniquely emphasizes maker portfolio and hands-on building'
  }
};
```

---

## 7. Implementation Checklist

### Phase 1: Core Type System

- [ ] Create `types/verification.ts` with VerificationLevel types
- [ ] Create `types/contextAdjustment.ts` with additive model types
- [ ] Update all existing interfaces to include verification metadata

### Phase 2: Context Adjustment System

- [ ] **DELETE** multiplicative boost factors from `contextAdjustmentDatabase.ts`
- [ ] **DELETE** race-based adjustment factors (post-SFFA compliance)
- [ ] Implement new `ContextPointsConfig` with capped additive system
- [ ] Add comprehensive rationale for each context factor
- [ ] Unit test: Verify cap is enforced (max 15 points regardless of factors)

### Phase 3: Activity Tier System

- [ ] Update `comparisonBenchmarksLibrary.ts` with official citations
- [ ] Add VerificationLevel to each benchmark
- [ ] Include source URLs and access dates
- [ ] Document which criteria are `official` vs `editorial`

### Phase 4: Academic Rating System

- [ ] **RENAME** "Harvard Scale" to "Uplift Academic Rating"
- [ ] Add verification level (`editorial`) to all rating criteria
- [ ] Add rationale explaining the scale's purpose and limitations
- [ ] Remove or soften "course requirements" language to "commonly expected"

### Phase 5: School Value Database

- [ ] Update `schoolValueDatabase.ts` with official source citations
- [ ] Separate `official` value statements from `editorial` numeric weights
- [ ] Add source URLs to each school's entry
- [ ] Document that weights are interpretations, not official values

### Phase 6: Knowledge Bases

- [ ] Audit `majorActivityAlignment.ts` for unsourced claims
- [ ] Add verification levels to alignment scores
- [ ] Document rationale for major-activity correlations

### Phase 7: Testing & Validation

- [ ] Create validation tests that check all claims have verification levels
- [ ] Create integration tests for additive context model
- [ ] Verify no multiplicative boosts remain in system
- [ ] Check for any remaining race-based factors

### Phase 8: Documentation

- [ ] Update inline comments to reflect new verification system
- [ ] Create user-facing documentation explaining our methodology
- [ ] Add "Data Sources" section to any reports we generate

---

## Appendix A: Official Source URLs

### Admissions Information
- Harvard: https://college.harvard.edu/admissions
- Stanford: https://admission.stanford.edu/
- MIT: https://mitadmissions.org/
- Common Data Set: https://commondataset.org/

### Competition Statistics
- MAA (USAMO/AMC): https://maa.org/maa-invitational-competitions/
- Society for Science (ISEF/STS): https://www.societyforscience.org/
- NMSC (National Merit): https://www.nationalmerit.org/

### Research Organizations
- NACAC: https://www.nacacnet.org/
- College Board: https://www.collegeboard.org/
- Brookings: https://www.brookings.edu/

---

## Appendix B: Removed/Deprecated Claims

The following claims from the current codebase should be REMOVED:

```typescript
// FROM contextAdjustmentDatabase.ts - DELETE THESE
low_income: { admission_boost: 1.8 }      // No source, fabricated
first_gen: { admission_boost: 1.6 }       // No source, fabricated
rural: { admission_boost: 1.3 }           // No source, fabricated

// Any race-based factors - DELETE ALL (post-SFFA)
asian_american: { ... }
african_american: { ... }
hispanic_latino: { ... }
// etc.

// FROM academicDatabase.ts - RENAME
harvard_equivalent: 6  // Rename to uplift_academic_rating
```

---

## Appendix C: Research Sources Summary

| Source | Type | What It Provides | URL |
|--------|------|------------------|-----|
| NACAC | Official | Admissions factor importance rankings | nacacnet.org |
| College Board | Official | AP statistics, test data | collegeboard.org |
| Harvard Admissions | Official | Class composition, values | college.harvard.edu |
| Stanford Admissions | Official | Holistic review criteria | admission.stanford.edu |
| MIT Admissions | Official | What they look for | mitadmissions.org |
| MAA | Official | Math competition statistics | maa.org |
| Society for Science | Official | ISEF/STS statistics | societyforscience.org |
| NMSC | Official | National Merit data | nationalmerit.org |
| Brookings | Published | Socioeconomic research | brookings.edu |
| CollegeVine | Industry | Activity tier frameworks | collegevine.com |

---

*Document prepared for implementation in portfolio analysis system rebuild.*
*All editorial judgments are transparent and labeled as such.*
*Official sources are cited with URLs for verification.*
