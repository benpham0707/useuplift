# PASS System Build Guide

## Portfolio & Application Strategy System - Comprehensive Development Context

**Last Updated:** January 16, 2026
**Status:** Phase 1 Research In Progress
**Primary Goal:** Build a system that surpasses professional college counselors through computational depth

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Research Phase Status](#3-research-phase-status)
4. [Component Specifications](#4-component-specifications)
5. [Data Flow & Integration Points](#5-data-flow--integration-points)
6. [Type System Reference](#6-type-system-reference)
7. [Implementation Order & Dependencies](#7-implementation-order--dependencies)
8. [Quality Standards](#8-quality-standards)
9. [Current Progress & Next Steps](#9-current-progress--next-steps)

---

## 1. Executive Summary

### What We're Building

PASS (Portfolio & Application Strategy System) is a comprehensive backend system that analyzes a student's entire college application portfolio and provides:

1. **Where they stand** - Accurate assessment of portfolio strength relative to target schools
2. **What they should do** - Actionable guidance to strengthen their application
3. **Strategic positioning** - How to present themselves optimally for their goals
4. **School fit analysis** - Which schools match their profile and aspirations

### Core Philosophy

> **"Depth first. Quality above all. Each step feeds the fuel of the next."**

- **Universal principles over per-school customization** - The 80% that's common across elite schools
- **Computational depth** - Analysis that would take a human counselor hours, done in seconds
- **Evidence-backed** - Every recommendation grounded in real admissions data and officer statements
- **Chat interface comes later** - Core analysis engines first

### What Already Exists (Don't Rebuild)

- **Essay Analysis System** - 11-dimension rubric for PIQ and Common App essays (separate system)
- **Portfolio Scanner** - Data collection at useuplift.io/portfolio-scanner (frontend exists)
- **14 College Research Overlays** - In commonAppWorkshop service (can be referenced)

### What We're Building New

- Academic Evaluation Engine
- Activity Portfolio Analyzer (with spike detection)
- Award & Recognition Evaluator
- Holistic Profile Synthesizer
- School Fit & Strategy Engine
- Guidance & Action Engine
- Portfolio Strategy Orchestrator

---

## 2. System Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT INPUT                                 │
│  (from Portfolio Scanner: academics, activities, awards, goals)      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PORTFOLIO STRATEGY ORCHESTRATOR                   │
│         (Coordinates all engines, manages caching, API layer)        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │   ACADEMIC   │ │   ACTIVITY   │ │    AWARD     │
         │  EVALUATION  │ │  PORTFOLIO   │ │  EVALUATION  │
         │    ENGINE    │ │   ANALYZER   │ │    ENGINE    │
         └──────────────┘ └──────────────┘ └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
         ┌─────────────────────────────────────────────────┐
         │           HOLISTIC PROFILE SYNTHESIZER          │
         │    (Combines all evaluations into unified       │
         │     profile with archetype & brand)             │
         └─────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         ┌──────────────────────┐     ┌──────────────────────┐
         │   SCHOOL FIT &       │     │   GUIDANCE &         │
         │   STRATEGY ENGINE    │     │   ACTION ENGINE      │
         └──────────────────────┘     └──────────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PORTFOLIO STRATEGY ANALYSIS                        │
│              (Complete output sent to frontend/API)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/services/portfolioStrategy/
├── index.ts                      # Main exports
├── orchestrator.ts               # Portfolio Strategy Orchestrator
├── types/                        # Type definitions (COMPLETE)
│   ├── index.ts                  # Central exports
│   ├── academic.ts               # Academic evaluation types
│   ├── activities.ts             # Activity analysis types
│   ├── awards.ts                 # Award evaluation types
│   ├── synthesis.ts              # Holistic synthesis types
│   ├── schoolFit.ts              # School fit types
│   └── guidance.ts               # Guidance & action types
├── data/                         # Static data & standards
│   ├── academicStandards.ts      # ✅ COMPLETE - GPA, rigor, testing standards
│   ├── activityEvaluationStandards.ts    # (pending research)
│   ├── activityTierClassifications.ts    # (pending research)
│   ├── awardRecognitionHierarchy.ts      # (pending research)
│   ├── characterTraitIndicators.ts       # (pending research)
│   ├── applicationRedFlags.ts            # (pending research)
│   └── schoolCategoryData.ts             # (pending research)
├── engines/                      # Evaluation engines
│   ├── academicEvaluator.ts      # (to build)
│   ├── activityAnalyzer.ts       # (to build)
│   ├── awardEvaluator.ts         # (to build)
│   ├── holisticSynthesizer.ts    # (to build)
│   ├── schoolFitEngine.ts        # (to build)
│   └── guidanceEngine.ts         # (to build)
└── utils/                        # Shared utilities
    ├── scoring.ts                # Scoring algorithms
    ├── caching.ts                # Analysis caching
    └── validation.ts             # Input validation
```

---

## 3. Research Phase Status

### Phase 1: Admissions Perspective (What Colleges Want)

**Goal:** Understand how elite admissions officers evaluate applications

| Prompt | Focus | Status | Data File |
|--------|-------|--------|-----------|
| A1 | Academic Standards (GPA, rigor, testing, trends) | ✅ COMPLETE | `academicStandards.ts` |
| A2 | Portfolio Evaluation (activities, recommendations, character, red flags, holistic process) | 🔄 READY TO RUN | `activityEvaluationStandards.ts`, `characterTraitIndicators.ts`, `applicationRedFlags.ts` |

**Key Findings from A1 (Academic Standards):**
- GPA: 3.75+ is effective floor (93.69% of Harvard admits), 4.0 is norm (74%)
- Rigor: 8-12 APs expected at well-resourced schools, "most rigorous available" is universal
- Testing: 1500+ SAT / 33+ ACT for T20 consideration
- Two-stage model: Academic threshold eliminates 75-90%, then holistic differentiation
- Test-optional: Submit if at/above 50th percentile, consider withholding below 25th

### Phase 2: Student Action Guide (What Students Should Do)

**Goal:** Actionable guidance for strengthening portfolios

| Prompt | Focus | Status |
|--------|-------|--------|
| B1 | Activity Development Strategies by Interest Area | NOT STARTED |
| B2 | Award/Competition Pathways by Field | NOT STARTED |
| B3 | Leadership Development & Impact Creation | NOT STARTED |
| B4 | Summer Program & Research Opportunities | NOT STARTED |

### Phase 3: Classification Standards (Tier Rubrics)

**Goal:** Defensible tier systems for evaluation engines

| Prompt | Focus | Status |
|--------|-------|--------|
| C1 | Activity Tier Classification Rubric (Tier 1-4) | NOT STARTED |
| C2 | Award Recognition Hierarchy | NOT STARTED |
| C3 | Leadership & Impact Scoring | NOT STARTED |

### Phase 4: School-Specific Data (Minimal Tailoring)

**Goal:** Only the differences that actually matter

| Prompt | Focus | Status |
|--------|-------|--------|
| D1 | Testing Policies by School (required/optional/blind) | NOT STARTED |
| D2 | Demonstrated Interest Policies | NOT STARTED |
| D3 | Institutional Values Keywords | NOT STARTED |

### Research File Locations

```
docs/research/
├── RESEARCH_MASTER_PLAN.md           # Tracks all research status
├── REVISED_RESEARCH_STRATEGY.md      # Overall approach (universal + selective)
├── prompts/
│   └── PROMPT_A2_PORTFOLIO_EVALUATION.md   # Ready to run
├── outputs/
│   └── PROMPT_A1_ACADEMIC_STANDARDS.md     # Complete
└── (future outputs go here)
```

---

## 4. Component Specifications

### 4.1 Academic Evaluation Engine

**Purpose:** Evaluate student's academic profile against elite school standards

**Inputs:**
```typescript
interface AcademicInputData {
  gpa: GPAData;                    // Unweighted, weighted, scale
  classRank?: ClassRankData;       // Rank, class size, reporting method
  testScores?: StandardizedTestScores;  // SAT, ACT, AP exams
  courses: CourseEntry[];          // All courses with grades
  schoolContext: SchoolContext;    // School profile, resources, offerings
}
```

**Outputs:**
```typescript
interface AcademicEvaluation {
  overallScore: number;            // 0-100
  overallTier: AcademicTier;       // exceptional/strong/competitive/developing/needs_work
  gpaStrength: GPAStrengthAssessment;
  courseRigor: CourseRigorAssessment;
  testingStrength: TestingStrengthAssessment;
  gradeTrend: GradeTrendAnalysis;
  classRankAnalysis?: ClassRankAnalysis;
  schoolFitAssessments: SchoolAcademicFit[];  // Per target school
  improvements: string[];
  keyStrengths: string[];
  keyConcerns: string[];
}
```

**Data Dependencies:**
- `academicStandards.ts` ✅ (complete)
- School-specific benchmarks (Phase 4 research)

**Key Logic:**
1. Evaluate GPA against universal thresholds (3.75+ floor, 3.95+ exceptional)
2. Assess course rigor relative to school offerings (most rigorous available?)
3. Evaluate test scores against target school ranges
4. Analyze grade trends (consistent excellence > upward trend)
5. Provide context-adjusted assessment (school resources, opportunities)

---

### 4.2 Activity Portfolio Analyzer

**Purpose:** Analyze extracurricular activities with tier classification and spike detection

**Inputs:**
```typescript
interface ActivitiesInputData {
  activities: ActivityInputData[];  // All 10 Common App activities
  additionalActivities?: ActivityInputData[];  // Beyond the 10
  intendedMajor?: string;
  careerInterests?: string[];
}
```

**Outputs:**
```typescript
interface ActivityPortfolioAnalysis {
  overallScore: number;            // 0-100
  overallTier: ActivityTier;       // 1-4 (1 is best)
  activityAssessments: ActivityTierAssessment[];  // Per activity
  spikeAnalysis: SpikeAnalysis;    // Has spike? What area? How strong?
  thematicCoherence: ThematicCoherenceAnalysis;
  commitmentAnalysis: CommitmentAnalysis;
  leadershipAnalysis: LeadershipAnalysis;
  upgradeRecommendations: ActivityUpgradeRecommendation[];
  newActivitySuggestions: NewActivitySuggestion[];
  commonAppOptimization: { ordering: string[]; descriptionImprovements: string[] };
}
```

**Data Dependencies:**
- `activityEvaluationStandards.ts` (from Prompt A2)
- `activityTierClassifications.ts` (from Prompt C1)

**Key Logic:**
1. Classify each activity into Tier 1-4 based on:
   - Recognition level (national/state/regional/school/participation)
   - Time commitment (hours/week, years)
   - Leadership/role
   - Impact/achievement
2. Detect "spike" - area of exceptional depth
3. Analyze thematic coherence (do activities tell a story?)
4. Evaluate depth vs. breadth balance
5. Generate upgrade recommendations per activity

**Activity Tier Definitions:**
- **Tier 1 (Rare/Exceptional):** National/international recognition, top 1% achievement
- **Tier 2 (Distinguished):** State/regional recognition, significant leadership with impact
- **Tier 3 (Solid):** School-level leadership, consistent multi-year commitment
- **Tier 4 (Participation):** Membership without distinction

---

### 4.3 Award & Recognition Evaluator

**Purpose:** Evaluate awards/honors and optimize Common App honors section

**Inputs:**
```typescript
interface AwardsInputData {
  awards: AwardInputData[];        // All awards/honors
  intendedMajor?: string;
}
```

**Outputs:**
```typescript
interface AwardEvaluation {
  overallScore: number;
  overallTier: AwardTier;
  awardAssessments: AwardAssessment[];    // Per award with tier
  distributionAnalysis: AwardDistributionAnalysis;
  highlightsAnalysis: AwardHighlightsAnalysis;
  commonAppOptimization: CommonAppHonorsOptimization;  // Top 5 selection
  competitiveContext: AwardCompetitiveContext;
  gapAnalysis: AwardGapAnalysis;          // What's missing?
}
```

**Data Dependencies:**
- `awardRecognitionHierarchy.ts` (from Prompt C2)

**Key Logic:**
1. Classify each award by recognition level and selectivity
2. Identify awards that truly impress vs. "filler"
3. Optimize Common App 5 honors selection
4. Flag potentially problematic awards (pay-to-play, vanity)
5. Suggest awards to pursue based on profile

---

### 4.4 Holistic Profile Synthesizer

**Purpose:** Combine all evaluations into unified profile with archetype and brand

**Inputs:**
- AcademicEvaluation (from Academic Engine)
- ActivityPortfolioAnalysis (from Activity Analyzer)
- AwardEvaluation (from Award Evaluator)
- PersonalContext (demographics, circumstances, adversity)
- GoalsAspirations (intended major, career interests, school preferences)
- EssayQualitySummary (optional, from existing essay system)

**Outputs:**
```typescript
interface HolisticProfileSynthesis {
  profileStrength: {
    overallScore: number;          // 0-100
    tier: ProfileTier;             // exceptional/highly_competitive/competitive/developing/building
    tierJustification: string;
    narrative: string;             // 2-3 paragraph summary
  };
  componentWeights: { academic, activities, awards, essays, context };
  uniqueValue: UniqueValueProposition;
  applicationBrand: ApplicationBrand;  // Archetype + narrative
  coherenceAnalysis: CoherenceAnalysis;
  strengthsAndConcerns: { major, minor for each };
  competitivePositioning: { strongestAreas, weakestAreas, differentiators };
  strategyInsights: { playToStrengths, addressWeaknesses, narrativeFocus };
}
```

**Key Logic:**
1. Weight components based on student profile (spike student vs. well-rounded)
2. Detect application archetype:
   - The Innovator, The Researcher, The Leader, The Artist
   - The Athlete, The Advocate, The Polymath, The Specialist
   - The Builder, The Connector, The Overcomer, The Mentor
3. Identify unique value proposition (what makes them different?)
4. Analyze cross-component coherence (does everything tell one story?)
5. Generate application "brand" narrative

---

### 4.5 School Fit & Strategy Engine

**Purpose:** Match student profile to schools and provide application strategy

**Inputs:**
- HolisticProfileSynthesis
- Target school list (or generate suggestions)
- Application preferences (ED/EA strategy, geographic)

**Outputs:**
```typescript
interface SchoolFitOutput {
  schoolList: CategorizedSchoolList;  // Reach/Target/Likely
  detailedAssessments: Record<string, SchoolFitAnalysis>;
  strategy: ApplicationStrategyRecommendations;
  suggestions: SchoolSuggestions;     // Underrated, strategic adds
  listAssessment: { strength, gaps, recommendations };
  bestMatches: { schoolId, fitScore, whyBestMatch }[];
}
```

**Data Dependencies:**
- `schoolCategoryData.ts` (from Phase 4 research)
- School-specific benchmarks, policies, values

**Key Logic:**
1. Calculate fit score per school across dimensions:
   - Academic fit (GPA/test percentile placement)
   - Activity fit (valued activities, spike alignment)
   - Values fit (institutional priorities match)
   - Culture fit (size, location, vibe)
   - Program fit (major strength, opportunities)
2. Categorize schools: Reach (<20% probability), Target (20-50%), Likely (>50%)
3. Generate ED/EA strategy recommendations
4. Identify demonstrated interest priorities
5. Suggest schools they haven't considered

---

### 4.6 Guidance & Action Engine

**Purpose:** Generate prioritized action items and track progress

**Inputs:**
- All previous evaluations
- Current date and timeline to applications
- User preferences (pace, available hours)

**Outputs:**
```typescript
interface GuidanceReport {
  executiveSummary: { readiness, keyStrengths, criticalActions, summary };
  priorityActions: { immediate, shortTerm, mediumTerm, ongoing };
  categoryGuidance: { academic, activities, awards, essays, schools };
  milestones: Milestone[];
  progress: ProgressSummary;
  applicationCalendar: { month, focus, deadlines, actions }[];
  riskAssessment: { risks, overallRiskLevel };
  allActions: ActionItem[];
}
```

**Key Logic:**
1. Generate action items from all evaluation gaps/recommendations
2. Prioritize by impact and urgency
3. Create timeline based on application deadlines
4. Track progress against milestones
5. Identify risks and mitigation strategies

---

### 4.7 Portfolio Strategy Orchestrator

**Purpose:** Coordinate all engines, manage caching, provide API

**Responsibilities:**
1. Validate and normalize input data
2. Check cache for existing analysis
3. Call engines in correct order (respecting dependencies)
4. Aggregate results into final PortfolioStrategyAnalysis
5. Handle errors gracefully with partial results
6. Track costs and usage

**API Endpoints:**
```
POST /api/portfolio-strategy/analyze     # Full analysis
GET  /api/portfolio-strategy/:userId     # Get cached analysis
POST /api/portfolio-strategy/refresh     # Force refresh
GET  /api/portfolio-strategy/school-fit/:schoolId  # Single school fit
POST /api/portfolio-strategy/actions/:actionId/complete  # Mark action done
```

---

## 5. Data Flow & Integration Points

### Input Data Sources

**From Portfolio Scanner (frontend form):**
- Academic data (GPA, courses, test scores)
- Activities (all 10 Common App slots + additional)
- Awards/honors
- Personal context (demographics, circumstances)
- Goals (intended major, career interests, target schools)

**From Existing Systems:**
- Essay quality summary (from PIQ/Common App workshop analysis)
- User profile (from Clerk/Supabase)

### Output Consumers

**Frontend Dashboard:**
- Profile strength visualization
- School fit recommendations
- Action item checklist
- Progress tracking

**Future Chat Interface:**
- Context for conversational guidance
- Specific questions about profile
- Strategy discussions

### Database Schema (New Tables Needed)

```sql
-- Portfolio strategy analysis results
CREATE TABLE portfolio_strategy_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id),
  analysis JSONB NOT NULL,              -- Full PortfolioStrategyAnalysis
  input_data_hash TEXT NOT NULL,        -- For cache invalidation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT TRUE
);

-- Action item tracking
CREATE TABLE portfolio_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id),
  action_id TEXT NOT NULL,              -- From guidance engine
  status TEXT NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- School list tracking
CREATE TABLE user_school_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id),
  school_id TEXT NOT NULL,
  category TEXT NOT NULL,               -- reach/target/likely
  application_status TEXT DEFAULT 'researching',
  decision_type TEXT,                   -- ED/EA/RD
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Type System Reference

### Complete Type Files (Already Built)

All types are in `src/services/portfolioStrategy/types/`:

| File | Key Types | Purpose |
|------|-----------|---------|
| `academic.ts` | AcademicTier, GPAData, AcademicEvaluation | Academic assessment |
| `activities.ts` | ActivityTier, SpikeAnalysis, ActivityPortfolioAnalysis | Activity evaluation |
| `awards.ts` | AwardTier, AwardAssessment, CommonAppHonorsOptimization | Award evaluation |
| `synthesis.ts` | ProfileTier, ApplicationArchetype, HolisticProfileSynthesis | Profile synthesis |
| `schoolFit.ts` | SchoolCategory, SchoolFitAnalysis, ProbabilityFactors | School matching |
| `guidance.ts` | ActionItem, GuidanceReport, ProgressSummary | Action guidance |
| `index.ts` | StudentProfileInput, PortfolioStrategyAnalysis | Cross-cutting types |

### Key Enums and Types

```typescript
// Profile strength tiers
type ProfileTier = 'exceptional' | 'highly_competitive' | 'competitive' | 'developing' | 'building';

// Activity tiers (1 is best)
type ActivityTier = 1 | 2 | 3 | 4;

// Application archetypes
type ApplicationArchetype =
  | 'the_innovator' | 'the_researcher' | 'the_leader' | 'the_artist'
  | 'the_athlete' | 'the_advocate' | 'the_polymath' | 'the_specialist'
  | 'the_builder' | 'the_connector' | 'the_overcomer' | 'the_mentor'
  | 'undefined';

// School categories
type SchoolCategory = 'reach' | 'target' | 'likely';

// Action priority
type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
```

---

## 7. Implementation Order & Dependencies

### Dependency Graph

```
Research Phase 1 (A1, A2)
         │
         ▼
Research Phase 2 & 3 (B1-B4, C1-C3)
         │
         ▼
┌────────┴────────┐
▼                 ▼
Academic        Activity        Award
Evaluator       Analyzer        Evaluator
    │               │               │
    └───────────────┼───────────────┘
                    ▼
           Holistic Synthesizer
                    │
         ┌─────────┴─────────┐
         ▼                   ▼
    School Fit          Guidance
      Engine             Engine
         │                   │
         └─────────┬─────────┘
                   ▼
            Orchestrator
                   │
                   ▼
            API Endpoints
```

### Build Order

**Phase 1: Foundation (Current)**
1. ✅ Type system (complete)
2. ✅ Academic standards data (complete)
3. 🔄 Portfolio evaluation research (Prompt A2 ready)
4. ⏳ Activity/award tier research (Prompts C1, C2)

**Phase 2: Core Engines**
5. Academic Evaluation Engine
6. Activity Portfolio Analyzer
7. Award & Recognition Evaluator

**Phase 3: Synthesis & Strategy**
8. Holistic Profile Synthesizer
9. School Fit & Strategy Engine
10. Guidance & Action Engine

**Phase 4: Integration**
11. Portfolio Strategy Orchestrator
12. API endpoints
13. Database schema & migrations

**Phase 5: Testing & Calibration**
14. Unit tests for each engine
15. Integration tests
16. Calibration against known profiles
17. Edge case handling

---

## 8. Quality Standards

### From CLAUDE.md (Project Standards)

- **Type Safety:** Full TypeScript with strict mode, no `any` types
- **Error Handling:** Every function that can fail must handle failures gracefully
- **Edge Cases:** Consider null, undefined, empty arrays, network failures
- **Testing:** Write tests alongside implementation
- **No Over-Engineering:** Only build what's needed, avoid premature abstraction

### PASS-Specific Standards

- **Research-Backed:** Every evaluation criterion must trace to research source
- **Defensible Tiers:** Tier assignments must have clear, documented rationale
- **Contextual Fairness:** Always consider student circumstances (school resources, access)
- **Actionable Output:** Every assessment must include what to do about it
- **Transparent Scoring:** Students should understand why they got their scores

### Code Patterns

```typescript
// Services export both class and singleton
export class AcademicEvaluator {
  async evaluate(input: AcademicInputData): Promise<AcademicEvaluation> { ... }
}
export const academicEvaluator = new AcademicEvaluator();

// Consistent error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('[AcademicEvaluator] Evaluation failed:', error);
  return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
}
```

---

## 9. Current Progress & Next Steps

### Completed ✅

1. **Type system** - All types defined in `src/services/portfolioStrategy/types/`
2. **Research strategy** - Universal principles + selective tailoring approach
3. **Research organization** - Master plan, prompt templates, output storage
4. **Academic standards data** - `academicStandards.ts` with GPA, rigor, testing thresholds
5. **Prompt A1** - Academic standards research complete and integrated

### In Progress 🔄

6. **Prompt A2** - Portfolio evaluation research (activities, recommendations, character, red flags, holistic process)
   - Prompt is ready at `docs/research/prompts/PROMPT_A2_PORTFOLIO_EVALUATION.md`
   - Run in Perplexity, save output, integrate to data files

### Next Steps ⏳

7. **After A2 Integration:**
   - Create `activityEvaluationStandards.ts`
   - Create `characterTraitIndicators.ts`
   - Create `applicationRedFlags.ts`

8. **Phase 2 Research (Student Actions):**
   - What should students DO to strengthen portfolios
   - Activity development strategies by interest area
   - Award/competition pathways

9. **Phase 3 Research (Tier Classifications):**
   - Activity tier rubric (Tier 1-4 criteria)
   - Award recognition hierarchy
   - Create `activityTierClassifications.ts`
   - Create `awardRecognitionHierarchy.ts`

10. **Build Evaluation Engines:**
    - Start with Academic Evaluator (simplest, data ready)
    - Then Activity Analyzer (most complex, needs spike detection)
    - Then Award Evaluator

---

## Appendix: Key Research Sources

### Completed Research (A1 - Academic Standards)

**Sources cited:**
- Harvard CDS 2023-24 (74% of admits have 4.0 GPA)
- Yale Admissions Dean Mark VanDeusen (consistency quotes)
- Stanford internal rating system (from Reddit analysis)
- Duke published admissions criteria
- MIT Admissions blogs (Chris Peterson)
- Jeff Selingo "Who Gets In and Why"
- Former Dartmouth AD Michele Hernández "A Is for Admission"
- Ivy Coach, Spark Admissions, CollegeVine analysis

**Key thresholds established:**
- GPA floor: 3.75 unweighted
- GPA exceptional: 3.95+
- AP courses: 8-12 at well-resourced schools
- SAT competitive: 1500+
- ACT competitive: 33+

### Pending Research (A2 - Portfolio Evaluation)

**Expected sources:**
- Admissions officer interviews and quotes
- Harvard admissions lawsuit revelations
- Common Data Set Section C7 (importance ratings)
- Published "what we look for" pages
- Admissions office blogs and podcasts
- College counselor professional guidance

---

## How to Use This Document

### Starting a New Chat for PASS Development

1. Share this document as context
2. Specify which component you're working on
3. Reference the relevant types from Section 6
4. Follow the implementation order from Section 7
5. Adhere to quality standards from Section 8

### Example Chat Starter

> "I'm continuing development on the PASS system. I've read the Build Guide. I'm working on [Component X]. The relevant types are in `src/services/portfolioStrategy/types/[file].ts`. The data dependencies are [X, Y, Z]. Here's what I need to build..."

### Keeping This Document Updated

After completing any major milestone:
1. Update Section 9 (Current Progress)
2. Add any new data files to Section 2 (File Structure)
3. Document key findings in Section 3 (Research Status)
4. Note any architecture changes in Section 4 (Component Specs)
