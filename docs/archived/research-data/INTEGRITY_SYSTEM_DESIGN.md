# Integrity System Design Document

## Purpose
This document provides the research foundation, verified data, and implementation design for improving the accuracy, credibility, and reliability of Uplift's college advising system.

**Key Principle:** Distinguish between what we KNOW (verified data) vs. what we ESTIMATE (informed judgment), and communicate uncertainty honestly.

---

## Part 1: Verified Data Sources - What We Actually Know

### 1.1 Gold Standard: Harvard Admissions Lawsuit Discovery (2019)

The Harvard lawsuit (SFFA v. Harvard) produced the only publicly available actual admissions data from an elite institution. This data is from classes 2014-2019.

**Source:** [NBER Working Paper - Legacy and Athlete Preferences at Harvard](https://www.nber.org/system/files/working_papers/w26316/w26316.pdf)

| Factor | Admission Rate | vs. Baseline (4.89%) | Multiplier |
|--------|---------------|---------------------|------------|
| Non-ALDC White | 4.89% | Baseline | 1.0x |
| Legacy (primary) | 33.6% | +28.7pp | **6.9x** |
| Recruited Athlete | 86.0% | +81.1pp | **17.6x** |
| Dean's List (Donors) | ~40% | +35pp | **~8x** |
| ALDC Combined | 43% of white admits are ALDC | - | - |

**Key Finding:** "Roughly 75% of ALDC admitted students would have been rejected if their legacy status, athletic ability, or presence on the dean's list were not considered."

**CRITICAL:** These are the ONLY verified admission rate differentials we have. All other multipliers are estimates.

### 1.2 Common Data Set Section C7 - Official School Priorities

CDS Section C7 asks schools to rate factors as: Very Important, Important, Considered, Not Considered

**Harvard CDS 2023-24:**
- Rigor of secondary school record: Very Important
- Academic GPA: Very Important
- Application Essay: Very Important
- Recommendation(s): Very Important
- Interview: Considered
- Extracurricular activities: Important
- Talent/ability: Important
- Character/personal qualities: Very Important
- First generation: Considered
- Alumni/ae relation: Considered
- Geographical residence: Considered
- State residency: Not Considered
- Racial/ethnic status: Not Considered (post-SFFA)
- Religious affiliation: Not Considered
- Volunteer work: Considered
- Work experience: Considered
- Level of applicant interest: Not Considered

**MIT CDS 2024-25:**
- **Character/Personal Qualities: Very Important** (ONLY factor rated this way)
- Academic GPA: Important
- Rigor of curriculum: Important
- Standardized test scores: Important
- Application essay: Important
- Recommendation(s): Important
- Interview: Important
- Extracurricular activities: Important
- Talent/ability: Important
- Volunteer work: Considered
- Work experience: Considered
- First generation: Considered
- Level of applicant interest: Not Considered

**Key Insight:** Schools DO differentiate. MIT's unique emphasis on "personal character" as the ONLY "very important" factor is official data we can rely on.

### 1.3 NACAC Survey Data (2023-24)

**Source:** [NACAC State of College Admission](https://www.nacacnet.org/state-of-college-admission-report/)

Percentage of colleges rating factor as "Considerable Importance":
| Factor | % Considerable |
|--------|---------------|
| Grades in College Prep Courses | 76.8% |
| Total HS GPA | 74.1% |
| Strength/Rigor of Curriculum | 63.8% |
| Test Scores | **5%** (down from ~50% pre-COVID) |

**Key Insight:** Test scores have dramatically decreased in importance at most colleges.

### 1.4 QuestBridge Statistics (2024)

**Source:** [QuestBridge Press Release December 2024](https://www.questbridge.org/about/news/press-release-december-2-2024)

| Metric | Value |
|--------|-------|
| Total Applicants | 25,500 |
| Finalists Selected | 7,288 (29%) |
| Match Recipients | 2,627 (36% of finalists) |
| Average UW GPA | 3.94 |
| Top 10% of Class | 92% |
| Income < $65K | 91% |
| Free/Reduced Lunch | 89% |

**Key Insight:** High-achieving, low-income students CAN succeed at elite colleges. QuestBridge provides a verified pathway.

### 1.5 Early Decision vs Regular Decision Rates

**Source:** [Spark Admissions ED/EA Analysis](https://www.sparkadmissions.com/blog/early-decision-and-early-action-acceptance-rates/)

Average ED advantage at highly selective schools: **1.6x or 60% increase**

Example: 4% RD chance → ~6.4% ED chance

Schools with largest ED boost (Class of 2028):
| School | ED Rate | RD Rate | Boost |
|--------|---------|---------|-------|
| Duke | ~17% | ~4% | 4.3x |
| Northwestern | ~20% | ~5% | 4.0x |
| Brown | ~14% | ~4% | 3.5x |
| Columbia | ~11% | ~3% | 3.7x |
| Cornell | ~18% | ~7% | 2.6x |

---

## Part 2: Additive Context Adjustment System

### 2.1 Why Additive, Not Multiplicative

**Current Problem (Multiplicative):**
```
Base: 5% admission rate
First-gen: 1.6x × Low-income: 1.8x × Rural: 1.3x = 3.74x
Result: 18.7% predicted rate at Harvard - UNREALISTIC
```

**Proposed Solution (Additive on Harvard Scale):**
```
Base Harvard Score: 3.5
First-gen adjustment: -0.4
Low-income adjustment: -0.4
Rural adjustment: -0.3
Combined adjustment: -1.1 (capped at -1.5)
Adjusted Score: 2.4 (Very Strong range)
```

### 2.2 The Harvard 1-6 Scale (Foundation)

| Score | Label | Description | Probability Range (T10) |
|-------|-------|-------------|------------------------|
| 1 | Exceptional | National/International distinction | 60-90% |
| 2 | Very Strong | State/Regional distinction | 30-60% |
| 3 | Generally Positive | Strong but not distinguished | 15-30% |
| 4 | Bland/Average | Meets expectations | 5-15% |
| 5 | Questionable | Below average | 2-5% |
| 6 | Concerning | Red flags | <2% |

**Note:** Lower is better on this scale.

### 2.3 Context Adjustment Values

#### TIER 1: VERIFIED (From Harvard Lawsuit)

These are the ONLY adjustments with verified data:

| Factor | Adjustment | Confidence | Source |
|--------|------------|------------|--------|
| Recruited Athlete (Tier 1) | -2.5 | HIGH | Harvard lawsuit: 86% rate |
| Recruited Athlete (Tier 2) | -2.0 | HIGH | Harvard lawsuit data |
| Recruited Athlete (Tier 3) | -1.5 | HIGH | Harvard lawsuit data |
| Legacy (Primary - parent) | -1.5 | HIGH | Harvard lawsuit: 34% rate |
| Legacy (Secondary) | -0.5 | MEDIUM | Derived from primary |
| Development Case (Major) | -1.5 | HIGH | Harvard lawsuit data |

#### TIER 2: ESTIMATED (Practitioner Consensus)

**MUST BE CLEARLY MARKED AS ESTIMATES:**

| Factor | Adjustment Range | Confidence | Rationale |
|--------|-----------------|------------|-----------|
| First-Generation | -0.3 to -0.5 | MEDIUM | Schools prioritize; no hard data |
| Low-Income (Pell eligible) | -0.3 to -0.5 | MEDIUM | Schools seek socioeconomic diversity |
| Rural/Underrepresented State | -0.2 to -0.4 | MEDIUM | Geographic diversity valued |
| ED Application | -0.3 to -0.5 | MEDIUM | ~1.6x boost converts to ~0.4 |
| Under-resourced School | -0.2 to -0.4 | MEDIUM | Context consideration |
| Significant Family Challenges | -0.2 to -0.4 | LOW | Highly case-dependent |

#### TIER 3: PENALTIES (Higher Expectations)

| Factor | Adjustment | Confidence | Rationale |
|--------|------------|------------|-----------|
| Feeder/Elite Prep School | +0.2 to +0.3 | MEDIUM | Higher expectations |
| High-Income + Full Resources | +0.1 to +0.2 | LOW | Should maximize opportunities |

### 2.4 Caps and Bounds

```typescript
const ADJUSTMENT_CAPS = {
  // Maximum beneficial adjustment (excluding hooks)
  maxBenefit: -1.5,

  // Maximum penalty adjustment
  maxPenalty: +0.5,

  // Hooks (athlete, legacy, development) bypass the cap
  // but are treated as separate analysis track
  hooksBypassCap: true,

  // Never adjust below 1.0 or above 6.0
  scoreFloor: 1.0,
  scoreCeiling: 6.0,
};
```

### 2.5 Implementation Pattern

```typescript
interface ContextAdjustment {
  factor: string;
  adjustment: number;  // Negative = beneficial (lower score)
  confidence: 'high' | 'medium' | 'low';
  source: SourceTier;
  reasoning: string;
}

interface SourceTier {
  tier: 1 | 2 | 3 | 4;
  citation: string;
  verificationLevel: 'verified' | 'published' | 'consensus' | 'estimate';
}

function applyContextAdjustments(
  baseScore: number,
  adjustments: ContextAdjustment[],
  hasHook: boolean = false
): AdjustedScoreResult {
  // Separate hooks from other adjustments
  const hooks = adjustments.filter(a => isHook(a.factor));
  const nonHooks = adjustments.filter(a => !isHook(a.factor));

  // Sum non-hook adjustments with cap
  let nonHookAdjustment = nonHooks.reduce((sum, a) => sum + a.adjustment, 0);
  nonHookAdjustment = Math.max(
    ADJUSTMENT_CAPS.maxBenefit,
    Math.min(ADJUSTMENT_CAPS.maxPenalty, nonHookAdjustment)
  );

  // Hooks are applied separately (no cap)
  const hookAdjustment = hooks.reduce((sum, a) => sum + a.adjustment, 0);

  // Calculate final score
  let adjustedScore = baseScore + nonHookAdjustment;

  // If has hook, apply separately
  if (hooks.length > 0) {
    adjustedScore += hookAdjustment;
  }

  // Clamp to valid range
  adjustedScore = Math.max(
    ADJUSTMENT_CAPS.scoreFloor,
    Math.min(ADJUSTMENT_CAPS.scoreCeiling, adjustedScore)
  );

  return {
    baseScore,
    adjustedScore,
    totalAdjustment: adjustedScore - baseScore,
    adjustments,
    hooks,
    explanation: generateExplanation(adjustments, hooks),
  };
}
```

---

## Part 3: Source Authority Hierarchy

### 3.1 Tiered Source Classification

```typescript
enum SourceTier {
  TIER_1_GOLD = 1,     // Official institutional data
  TIER_2_SILVER = 2,   // Published research, surveys
  TIER_3_BRONZE = 3,   // Practitioner consensus
  TIER_4_ESTIMATE = 4, // Our derivations
}

interface VerifiedDataPoint<T> {
  value: T;
  source: {
    tier: SourceTier;
    name: string;
    document: string;
    url?: string;
    accessDate: string;
    notes?: string;
  };
  confidence: number;  // 0-100
  staleness: 'current' | 'needs_review' | 'expired';
  expirationDate?: string;
}
```

### 3.2 Source Examples by Tier

**TIER 1 (Gold) - Official Institutional Data:**
- Common Data Set publications
- Harvard lawsuit discovery documents
- College Board official statistics (AP scores, SAT distributions)
- NACAC official surveys
- QuestBridge official press releases

**TIER 2 (Silver) - Published Research:**
- Peer-reviewed academic papers
- NBER working papers
- Institutional research office reports
- Official admissions officer blog posts (MIT Admissions, etc.)

**TIER 3 (Bronze) - Practitioner Consensus:**
- Multiple reputable counselors agreeing
- Published admissions counseling books (Selingo, etc.)
- Consistent patterns across multiple sources

**TIER 4 (Estimate) - Our Derivations:**
- Calculations derived from other data
- Interpolations and extrapolations
- Single-source insights
- **MUST BE CLEARLY MARKED AS ESTIMATES**

### 3.3 Staleness Tracking

```typescript
interface DataFreshness {
  effectiveDate: string;      // When this data was published
  accessDate: string;         // When we accessed it
  expectedRefresh: string;    // When new data expected (e.g., "annually")
  expirationDate: string;     // When we should distrust this data
  staleness: 'current' | 'needs_review' | 'expired';
}

function checkDataFreshness(data: VerifiedDataPoint<any>): DataFreshness {
  const now = new Date();
  const expiration = new Date(data.source.expirationDate || '');

  if (expiration < now) {
    return { ...data, staleness: 'expired' };
  }

  const threeMonthsFromExpiration = new Date(expiration);
  threeMonthsFromExpiration.setMonth(threeMonthsFromExpiration.getMonth() - 3);

  if (now > threeMonthsFromExpiration) {
    return { ...data, staleness: 'needs_review' };
  }

  return { ...data, staleness: 'current' };
}
```

---

## Part 4: School Preference Framework

### 4.1 Principle: Informed Subjectivity with Transparency

School-specific preferences (e.g., "Stanford values intellectual vitality") ARE subjective but can be well-informed. The key is **transparency about sources and confidence**.

### 4.2 School Value Structure

```typescript
interface SchoolValues {
  name: string;

  // TIER 1: From CDS Section C7 (Official)
  officialPriorities: {
    veryImportant: string[];
    important: string[];
    considered: string[];
    notConsidered: string[];
    source: 'CDS 2024-25';
  };

  // TIER 2: Distinctive Values (from published statements)
  distinctiveValues: Array<{
    value: string;
    source: string;
    quote?: string;
    confidence: 'high' | 'medium' | 'low';
  }>;

  // TIER 3: Fit Indicators (practitioner consensus)
  fitIndicators: {
    strongFit: string[];
    weakFit: string[];
    redFlags: string[];
    source: 'Practitioner consensus';
    confidence: 'medium';
  };

  // TIER 4: Essay/Application Preferences (derived)
  applicationPreferences: {
    essayTone: string;
    topicsToHighlight: string[];
    topicsToAvoid: string[];
    source: 'Derived from AO statements and successful applications';
    confidence: 'low';
  };
}
```

### 4.3 Categorical vs. Numeric Preferences

**DON'T DO THIS:**
```typescript
// False precision
characterWeights: {
  intellectual_vitality: 1.23,
  leadership_quality: 0.87,
  community_impact: 1.05,
}
```

**DO THIS INSTEAD:**
```typescript
interface DimensionEmphasis {
  dimension: string;
  emphasis: 'distinctive_priority' | 'valued' | 'standard' | 'less_emphasis';
  source: string;
  confidence: 'high' | 'medium' | 'low';
  evidence?: string;
}

// Example for Stanford
const stanfordEmphasis: DimensionEmphasis[] = [
  {
    dimension: 'intellectual_vitality',
    emphasis: 'distinctive_priority',
    source: 'Stanford admissions website + Rick Shaw interviews',
    confidence: 'high',
    evidence: 'Stanford explicitly states "intellectual vitality" as primary criterion',
  },
  {
    dimension: 'creativity_innovation',
    emphasis: 'distinctive_priority',
    source: 'Multiple AO statements about "builders and creators"',
    confidence: 'medium',
  },
  {
    dimension: 'traditional_leadership',
    emphasis: 'standard',
    source: 'Practitioner consensus',
    confidence: 'medium',
  },
];
```

### 4.4 Applying Preferences in Fit Calculation

```typescript
function calculateDimensionFitContribution(
  studentScore: number,
  school: SchoolValues,
  dimension: string
): number {
  const emphasis = school.distinctiveValues.find(v => v.value === dimension);

  let multiplier = 1.0;  // Standard weight

  switch (emphasis?.emphasis) {
    case 'distinctive_priority':
      multiplier = 1.5;  // 50% more weight
      break;
    case 'valued':
      multiplier = 1.2;  // 20% more weight
      break;
    case 'standard':
      multiplier = 1.0;
      break;
    case 'less_emphasis':
      multiplier = 0.7;  // 30% less weight
      break;
  }

  return studentScore * multiplier;
}
```

---

## Part 5: Probability Communication

### 5.1 Ranges, Not Point Estimates

**DON'T DO THIS:**
```
"You have a 15.3% chance at Harvard"
```

**DO THIS INSTEAD:**
```
"Competitive range (10-20%) at Harvard based on profile strength"
```

### 5.2 Probability Bands

```typescript
interface ProbabilityEstimate {
  school: string;

  // Range estimate
  lowEstimate: number;
  centralEstimate: number;
  highEstimate: number;

  // Confidence in this range
  confidence: number;  // 0-100

  // What the range depends on
  keyUncertainties: string[];

  // Category for simple display
  category: 'reach' | 'target' | 'likely' | 'safety';

  // Human-readable explanation
  narrative: string;
}

function generateProbabilityEstimate(
  harvardScore: number,
  schoolTier: string,
  context: StudentContext
): ProbabilityEstimate {
  // Get base probabilities from calibration profiles
  const baseProb = getBaseProbability(harvardScore, schoolTier);

  // Calculate uncertainty range based on data quality
  const uncertainty = calculateUncertainty(context);

  return {
    lowEstimate: Math.max(0.01, baseProb * (1 - uncertainty)),
    centralEstimate: baseProb,
    highEstimate: Math.min(0.99, baseProb * (1 + uncertainty)),
    confidence: context.dataCompleteness * 100,
    keyUncertainties: identifyKeyUncertainties(context),
    category: categorizeChances(baseProb),
    narrative: generateNarrative(baseProb, uncertainty, schoolTier),
  };
}
```

### 5.3 Uncertainty Communication

```typescript
function generateNarrative(
  probability: number,
  uncertainty: number,
  schoolTier: string
): string {
  if (probability >= 0.6) {
    return `Strong candidate - likely to gain admission with solid execution`;
  }
  if (probability >= 0.3) {
    return `Competitive applicant - reasonable chance with strong essays/recommendations`;
  }
  if (probability >= 0.1) {
    return `In competitive range - admission possible but not guaranteed`;
  }
  if (probability >= 0.05) {
    return `Reach school - would need exceptional essays and some luck`;
  }
  return `High reach - admission would be an exceptional outcome`;
}
```

---

## Part 6: Implementation Checklist

### 6.1 Files to Modify

| File | Changes Needed |
|------|----------------|
| `contextAdjustmentDatabase.ts` | Convert multipliers to additive adjustments; add source citations; remove/deprecate race-based boosts |
| `scoring.ts` | Add Harvard-scale-specific adjustment function |
| `harvardScaleCalibration.ts` | Add source documentation for probability estimates |
| `schoolValueDatabase.ts` | Replace numeric weights with categorical emphasis; add source citations |
| `stage5Verification.ts` | Add heuristic checks for LLM output validation |
| `academicStandards.ts` | Fix source citations (replace Perplexity with primary sources) |

### 6.2 New Types/Interfaces to Add

```typescript
// Add to types/scoring.ts

export interface VerifiedDataPoint<T> {
  value: T;
  source: DataSource;
  confidence: number;
  staleness: 'current' | 'needs_review' | 'expired';
}

export interface DataSource {
  tier: 1 | 2 | 3 | 4;
  name: string;
  document: string;
  url?: string;
  accessDate: string;
  expirationDate?: string;
  notes?: string;
}

export interface HarvardScaleAdjustment {
  factor: string;
  adjustment: number;  // Negative = beneficial
  confidence: 'high' | 'medium' | 'low';
  source: DataSource;
  isHook: boolean;
}

export interface AdjustedScoreResult {
  baseScore: number;
  adjustedScore: number;
  totalAdjustment: number;
  adjustments: HarvardScaleAdjustment[];
  hooks: HarvardScaleAdjustment[];
  explanation: string;
  confidenceLevel: number;
}
```

### 6.3 Specific Code Changes

#### Change 1: Context Adjustment Database

**Current (WRONG):**
```typescript
admission_boost: 1.8,  // Multiplicative
```

**New (CORRECT):**
```typescript
harvardScaleAdjustment: {
  value: -0.4,  // Additive, negative = beneficial
  source: {
    tier: 4,
    name: 'Practitioner Estimate',
    document: 'Internal derivation',
    notes: 'No verified data available; estimate based on practitioner consensus',
  },
  confidence: 'medium',
},
```

#### Change 2: Remove Race-Based Factors

Add deprecation notice:
```typescript
/**
 * @deprecated Post-SFFA (June 2023), colleges cannot use race as a factor.
 * This data is preserved for historical reference only.
 * DO NOT use these values in current calculations.
 */
export const DEPRECATED_UNDERREPRESENTED_MINORITY_IMPACT = {
  // ... existing data ...
  _warning: 'NOT FOR USE - See SFFA v. Harvard ruling',
};
```

#### Change 3: School Preference Weights

**Current (WRONG):**
```typescript
characterWeights: {
  intellectual_vitality: 1.3,
  leadership_quality: 0.9,
}
```

**New (CORRECT):**
```typescript
dimensionEmphasis: [
  {
    dimension: 'intellectual_vitality',
    emphasis: 'distinctive_priority',
    source: { tier: 2, name: 'Stanford Admissions', document: 'Official website' },
    confidence: 'high',
  },
  {
    dimension: 'leadership_quality',
    emphasis: 'standard',
    source: { tier: 3, name: 'Practitioner consensus', document: 'N/A' },
    confidence: 'medium',
  },
],
```

### 6.4 Validation Tests to Add

```typescript
describe('Context Adjustment Integrity', () => {
  test('Combined adjustments never exceed cap', () => {
    const maxAdjustments = [
      { factor: 'first_gen', adjustment: -0.5 },
      { factor: 'low_income', adjustment: -0.5 },
      { factor: 'rural', adjustment: -0.4 },
      { factor: 'ed_application', adjustment: -0.5 },
    ];

    const result = applyContextAdjustments(3.5, maxAdjustments);

    // Should be capped at -1.5, not -1.9
    expect(result.totalAdjustment).toBeGreaterThanOrEqual(-1.5);
  });

  test('Hooks bypass regular cap', () => {
    const withHook = [
      { factor: 'first_gen', adjustment: -0.5, isHook: false },
      { factor: 'legacy_primary', adjustment: -1.5, isHook: true },
    ];

    const result = applyContextAdjustments(3.5, withHook);

    // Hooks should bypass cap
    expect(result.adjustedScore).toBeLessThanOrEqual(1.5);  // 3.5 - 0.5 - 1.5 = 1.5
  });

  test('All data points have source citations', () => {
    // Iterate through all context factors
    Object.values(CONTEXT_FACTORS).forEach(factor => {
      expect(factor.source).toBeDefined();
      expect(factor.source.tier).toBeGreaterThanOrEqual(1);
      expect(factor.source.tier).toBeLessThanOrEqual(4);
    });
  });

  test('Probability estimates include uncertainty ranges', () => {
    const estimate = generateProbabilityEstimate(3.0, 't10', mockContext);

    expect(estimate.lowEstimate).toBeLessThan(estimate.centralEstimate);
    expect(estimate.highEstimate).toBeGreaterThan(estimate.centralEstimate);
    expect(estimate.keyUncertainties.length).toBeGreaterThan(0);
  });
});
```

---

## Part 7: Key Research Sources Reference

### Primary Sources (Tier 1)

1. **Harvard Admissions Lawsuit**
   - [NBER Working Paper: Legacy and Athlete Preferences at Harvard](https://www.nber.org/system/files/working_papers/w26316/w26316.pdf)
   - [NBC News Summary](https://www.nbcnews.com/news/us-news/study-harvard-finds-43-percent-white-students-are-legacy-athletes-n1060361)

2. **Common Data Set**
   - [Harvard CDS](https://oira.harvard.edu/common-data-set/)
   - [MIT CDS](https://ir.mit.edu/projects/2024-25-common-data-set/)
   - [Stanford CDS](https://irds.stanford.edu/data-findings/cds)

3. **NACAC Data**
   - [State of College Admission Report](https://www.nacacnet.org/state-of-college-admission-report/)
   - [Factors in College Admission](https://www.nacacnet.org/factors-in-college-admission/)

4. **QuestBridge**
   - [2024 Press Release](https://www.questbridge.org/about/news/press-release-december-2-2024)

### Secondary Sources (Tier 2)

1. **Early Decision Analysis**
   - [Spark Admissions ED/EA Rates](https://www.sparkadmissions.com/blog/early-decision-and-early-action-acceptance-rates/)
   - [College Transitions ED Analysis](https://www.collegetransitions.com/dataverse/early-vs-regular-decision-admission-rates/)

2. **First-Generation Research**
   - [NCES First-Generation Students Report](https://nces.ed.gov/pubs2018/2018421.pdf)
   - [Brookings First-Gen Analysis](https://www.brookings.edu/articles/first-generation-college-students-face-unique-challenges/)

3. **Pell Grant / Socioeconomic Data**
   - [Georgetown CEW Pell Report](https://cew.georgetown.edu/cew-reports/pell20/)
   - [US News Economic Diversity Rankings](https://www.usnews.com/best-colleges/rankings/national-universities/economic-diversity)

---

## Summary

This document provides:

1. **Verified data** from the only available actual admissions data (Harvard lawsuit)
2. **A framework** for additive (not multiplicative) context adjustments
3. **Source hierarchy** that clearly distinguishes verified vs. estimated data
4. **School preference framework** that handles subjectivity with transparency
5. **Probability communication** that conveys uncertainty honestly
6. **Implementation checklist** with specific code changes

The goal is not to eliminate subjectivity (impossible in admissions advising) but to be **transparent** about what we know vs. what we estimate, and to communicate **uncertainty** appropriately.

**Key Takeaway:** When in doubt, be honest about uncertainty. Students deserve accurate guidance, not false confidence.
