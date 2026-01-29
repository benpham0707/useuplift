# Academic History Analysis System Architecture

## Overview

The Academic History Analysis System is a comprehensive, research-backed framework for evaluating student academic profiles in the context of elite college admissions. It combines deterministic heuristic analysis with LLM-based teaching feedback to provide reliable, accurate assessments.

**Key Design Principles:**
1. Research-grounded: All evaluations tied to Section 6 research modules
2. Trajectory-aware: Year weighting and pattern detection
3. Teaching-focused: Explains WHY, not just WHAT
4. Fail-safe: Heuristic fallbacks when LLM unavailable

---

## System Components

### 1. TrajectoryAnalyzer (`trajectoryAnalyzer.ts`)

The core trajectory analysis engine with year-weighted GPA and GPA-Rigor interaction detection.

#### Year Weights
Based on research showing junior year as most important:
```
Freshman:  15%  (adjustment period)
Sophomore: 22%  (foundation building)
Junior:    35%  (MOST CRITICAL)
Senior:    28%  (follow-through, rescission risk)
```

#### Trajectory Types (10)
| Type | Score Adjustment | Description |
|------|------------------|-------------|
| `strong_ascending` | +0.10 | Each year better than last |
| `moderate_ascending` | +0.05 | General improvement |
| `high_plateau` | +0.00 | Consistently high (3.8+) |
| `v_shape_recovery` | +0.05 | Dip then recovery (resilience) |
| `mid_plateau` | -0.02 | Consistently moderate |
| `erratic` | -0.08 | No clear pattern |
| `inverted_v` | -0.10 | Peak then decline |
| `junior_dip` | -0.10 | Dip in most important year |
| `senior_decline` | -0.15 | Senioritis (22% rescission rate) |
| `descending` | -0.20 | Getting worse over time |

#### Rigor Trajectory Types (5)
| Type | Description |
|------|-------------|
| `increasing` | Taking more challenging courses over time |
| `maintaining_high` | Consistently maximum rigor |
| `maintaining_moderate` | Stable moderate rigor |
| `retreating` | Reducing rigor over time (peaked early) |
| `senior_retreat` | Rigor drop specifically in senior year |

#### GPA-Rigor Interaction Matrix (9 patterns)
```
           │  Rigor ↑    │  Rigor →   │  Rigor ↓
───────────┼─────────────┼────────────┼───────────────
  GPA ↑    │   IDEAL     │ good_mastery│ SUSPECT_PROTECTION
  GPA →    │ good_growth │  neutral   │ concern_stagnant
  GPA ↓    │ acceptable_ │ concern_   │ CRITICAL_DECLINE
           │   courage   │  struggle  │
```

**Key Interactions:**
- `ideal`: Best pattern - GPA and rigor both improving
- `acceptable_courage`: GPA dip while increasing rigor is POSITIVE
- `suspect_protection`: GPA up + rigor down = gaming (RED FLAG)
- `critical_decline`: Both declining = disengagement (MAJOR FLAG)

#### Critical Transitions
1. **Sophomore → Junior**: Most heavily weighted transition (35% weight)
2. **Junior → Senior**: Red flag if decline (rescission risk)

---

### 2. AcademicRedFlagDetector (`academicRedFlagDetector.ts`)

4-tier severity detection system integrated with TrajectoryAnalyzer.

#### Severity Tiers

**Tier 1: Disqualifying**
- `academic_dishonesty` - Documented cheating/plagiarism
- `transcript_falsification` - Misrepresented credentials

**Tier 2: Serious**
- `senior_year_decline` - GPA drop 0.3+ from junior to senior
- `rigor_avoidance_high_gpa` - 4.0 GPA with <3 APs when 10+ available
- `major_course_mismatch` - STEM major without Calc/Physics
- `course_withdrawal_pattern` - 2+ W grades
- `gpa_protection_strategy` - GPA↑ while rigor↓
- `junior_year_critical_decline` - Decline in most important year
- `rigor_retreat_pattern` - Consistent rigor reduction
- `critical_decline_pattern` - GPA↓ + Rigor↓

**Tier 3: Moderate**
- `gpa_test_mismatch` - 4.0 GPA with <1350 SAT
- `ap_score_grade_mismatch` - A in course, 1-2 on exam
- `single_year_dip` - One year dip with recovery
- `missing_core_rigor` - No honors/AP in core area
- `de_without_ap_available` - CC courses over available APs
- `senior_rigor_retreat` - Rigor drop in senior year specifically

**Tier 4: Minor**
- `single_outlier_grade` - One C in otherwise strong transcript
- `unusual_course_sequence` - Courses out of order
- `light_senior_schedule` - Fewer courses senior year
- `inconsistent_performance` - Erratic grades
- `no_testing_data` - No SAT/ACT/AP scores

#### Risk Level Calculation
```
Tier 1 detected → critical
Tier 2 ≥ 2      → high
Tier 2 = 1      → moderate
Tier 3 ≥ 2      → moderate
Tier 3 = 1      → low
Tier 4 only     → low
None            → none
```

---

### 3. AcademicHistoryAnalyzer (`academicHistoryAnalyzer.ts`)

Main orchestrator with multi-stage LLM pipeline.

#### Stage 1: Quick Diagnosis (Haiku)
- Identifies school tier
- Detects GPA context
- Classifies rigor pattern
- Identifies trajectory pattern
- Flags red flags
- Notes special contexts (DE, international, homeschool)

#### Stage 2: Deep Analysis (Sonnet)
- Comprehensive evaluation with research context
- Harvard 1-6 score generation
- Teaching insights for each dimension
- Citations for all claims
- Strategic recommendations

#### Research Context Injection
The system dynamically includes relevant research sections:
- Always: 6.1 Course Hierarchy, 6.5 School Context, 6.6 GPA/Trajectory
- Conditional: 6.2 AP Tiers, 6.3 DE Evaluation, 6.7 International, 6.8 Homeschool, 6.9 Red Flags

---

### 4. AcademicTeachingService (`academicTeachingService.ts`)

Research-backed explanations for detected issues.

#### Teaching Moments
For each detected issue, provides:
- `explanation`: Why this matters
- `context`: Research backing
- `mitigation`: What student can do
- `citations`: Source references

---

## Harvard 1-6 Score Calibration

The system uses the Harvard Academic Rating scale integrated with trajectory analysis:

| Score | Name | Requirements |
|-------|------|--------------|
| 1 | Summa | strong_ascending OR high_plateau + ideal GPA-Rigor + no declines + intellectual depth |
| 2 | Magna | Ascending trend + acceptable_courage OK + minor imperfections OK |
| 3 | Cum Laude | mid_plateau or v_shape + addressable concerns + GPA protection caps here |
| 4 | Adequate | senior_decline limits here + rigor_retreat without explanation |
| 5 | Marginal | critical_decline pattern |
| 6 | Below | Significant academic concerns |

**Key Principle:** Same GPA, different scores based on HOW achieved:
- 3.8 with ascending trajectory + increasing rigor → Score 2
- 3.8 with GPA protection strategy (rigor retreat) → Score 3-4

---

## Data Flow

```
Input: AcademicHistoryInput
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
 TrajectoryAnalyzer                    AcademicRedFlagDetector
         │                                      │
         │ TrajectoryAnalysis                   │ RedFlagReport
         │ - yearData                           │ - flags_detected
         │ - gpa (weighted, adjusted)           │ - overall_risk_level
         │ - rigor trajectory                   │ - recommendations
         │ - gpa_rigor_interaction              │
         │ - transitions                        │
         │ - strengths/concerns                 │
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              AcademicHistoryAnalyzer
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
  Stage 1: Haiku              Stage 2: Sonnet
  Quick Diagnosis             Deep Analysis
         │                             │
         │ QuickDiagnosis              │ AcademicHistoryAnalysis
         │ - school_tier               │ - harvard_score (1-6)
         │ - gpa_context               │ - gpa_analysis
         │ - rigor_pattern             │ - rigor_analysis
         │ - trajectory_pattern        │ - trajectory_analysis
         │ - red_flags                 │ - competitive_positioning
         │ - special_contexts          │ - recommendations
         │                             │ - citations
         └──────────────┬──────────────┘
                        │
                        ▼
                   Final Output
            AcademicHistoryAnalysis
```

---

## Test Coverage

### Calibration Profiles (13 total)

| # | Profile | Key Tests |
|---|---------|-----------|
| 1 | Elite Prep Top Student | Grade deflation context, max rigor |
| 2 | Under-Resourced Maximizer | Context bonus, initiative beyond school |
| 3 | GPA Protector | rigor_avoidance_high_gpa, major_mismatch |
| 4 | International IB | IB diploma recognition, HL weighting |
| 5 | Senior Year Decline | senior_year_decline flag |
| 6 | Homeschool Strong | External validation, university DE |
| 7 | Homeschool Weak | no_testing_data, validation requirements |
| 8 | GPA-Test Mismatch | gpa_test_mismatch, ap_score_mismatch |
| 9 | GPA Protection Strategy | gpa_protection_strategy (GPA↑ + Rigor↓) |
| 10 | Junior Year Decline | junior_year_critical_decline |
| 11 | Critical Decline | critical_decline_pattern (GPA↓ + Rigor↓) |
| 12 | Strong Ascending | No flags - ideal pattern validation |
| 13 | Rigor Retreat | rigor_retreat_pattern (peak then decline) |

**Pass Rate:** 100% (13/13 profiles)

---

## File Structure

```
src/services/portfolioStrategy/services/
├── academicHistoryAnalyzer.ts     # Main orchestrator + research KB
├── academicTeachingService.ts     # Teaching explanations
├── academicRedFlagDetector.ts     # 4-tier red flag detection
├── trajectoryAnalyzer.ts          # Year weighting + GPA-Rigor matrix
└── index.ts                       # Exports

tests/
└── test-academic-analyzer-calibration.ts  # 13 calibration profiles
```

---

## Research Integration

| Section | Module | Integration |
|---------|--------|-------------|
| 6.1 | Course Level Hierarchy | COURSE_LEVEL_HIERARCHY constant |
| 6.2 | AP Difficulty Tiers | AP_DIFFICULTY_TIERS constant |
| 6.3 | Dual Enrollment | Conditional context injection |
| 6.5 | School Context | SCHOOL_CONTEXT_TIERS (6 tiers) |
| 6.6 | Grade Interpretation | Year weighting, trajectory analysis |
| 6.7 | International Curricula | INTERNATIONAL_CURRICULA constant |
| 6.8 | Homeschool Validation | HOMESCHOOL_VALIDATION constant |
| 6.9 | Academic Red Flags | ACADEMIC_RED_FLAGS + enhanced detection |

---

## Usage Example

```typescript
import { analyzeAcademicHistory } from './services/portfolioStrategy/services';
import { detectAcademicRedFlags } from './services/portfolioStrategy/services';
import { analyzeTrajectory } from './services/portfolioStrategy/services';

// Quick trajectory analysis (no LLM)
const trajectory = analyzeTrajectory(studentInput);
console.log(`Trajectory: ${trajectory.gpa.trajectory_type}`);
console.log(`GPA-Rigor: ${trajectory.gpa_rigor_interaction}`);
console.log(`Effective GPA: ${trajectory.gpa.effective_gpa}`);

// Red flag detection (no LLM)
const redFlags = detectAcademicRedFlags(studentInput);
console.log(`Risk Level: ${redFlags.overall_risk_level}`);
console.log(`Flags: ${redFlags.flags_detected.map(f => f.flag_name).join(', ')}`);

// Full analysis (requires API key)
const analysis = await analyzeAcademicHistory(studentInput);
console.log(`Harvard Score: ${analysis.overall.harvard_score}`);
console.log(`Summary: ${analysis.overall.summary}`);
```

---

## Key Design Decisions

1. **Year Weighting**: Junior year at 35% based on research showing it's the most scrutinized year.

2. **GPA-Rigor Matrix**: 3x3 matrix captures all meaningful interaction patterns, with specific flags for gaming behaviors.

3. **Trajectory Before Raw GPA**: The system prioritizes trajectory direction over absolute GPA values in competitive evaluations.

4. **Heuristic Fallbacks**: All red flag detection and trajectory analysis works without LLM calls, ensuring reliability.

5. **Teaching Focus**: Every assessment includes WHY it matters, not just WHAT was detected.

6. **Citation Support**: All major claims tied to specific research sections for credibility.

---

*Last Updated: January 2026*
*Version: 1.0*
