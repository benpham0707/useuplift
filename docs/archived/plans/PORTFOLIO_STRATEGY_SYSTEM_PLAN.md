# Portfolio & Application Strategy System (PASS)
## Comprehensive Backend Architecture Plan

**Created:** January 15, 2026
**Author:** Claude (Technical Lead) + Tue Pham (Product Vision)
**Status:** APPROVED - Beginning Implementation

---

## Core Philosophy

> **"Depth first. Quality above all. Each step feeds the fuel of the next."**

We are building a system that surpasses professional college counselors through:
- **Computational depth** - Analysis that would take a human counselor hours, done in seconds
- **Comprehensive context** - Every data point considered, nothing overlooked
- **Personalized attention** - Each student gets focused, tailored guidance
- **Evidence-backed insights** - Every recommendation grounded in real admissions data

**Key Principles:**
1. **Always prioritize depth** over breadth - a robust foundation enables everything
2. **Build iteratively** - each component strengthens the next
3. **Quality is non-negotiable** - we match or exceed professional counselor standards
4. **Chat interface comes later** - core analysis and strategy engines first

---

## Executive Summary

We are building a comprehensive **Portfolio & Application Strategy System (PASS)** - a multi-component backend system that provides students with deep, personalized college admissions guidance beyond essays. This system will analyze their entire application portfolio (academics, activities, awards, goals, circumstances) and provide:

1. **Where they stand** - Accurate assessment of portfolio strength relative to target schools
2. **What they should do** - Actionable guidance to strengthen their application
3. **Strategic positioning** - How to present themselves optimally for their goals
4. **School fit analysis** - Which schools match their profile and aspirations

This rivals the depth and interconnectedness of our PIQ and Common App Workshop systems.

---

## Table of Contents

1. [Research Synthesis](#1-research-synthesis)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Component Breakdown](#3-component-breakdown)
4. [Data Flow & Integration](#4-data-flow--integration)
5. [Implementation Phases](#5-implementation-phases)
6. [Database Schema Extensions](#6-database-schema-extensions)
7. [API Endpoints](#7-api-endpoints)
8. [Deep Research Requirements](#8-deep-research-requirements)
9. [Testing Strategy](#9-testing-strategy)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Research Synthesis

### 1.1 What We Know About Elite Admissions

Based on comprehensive research from [Stanford](https://admission.stanford.edu/apply/overview/index.html), [Harvard](https://pathivy.com/blog/harvard-acceptance-rate-2025), [MIT](https://blog.collegevine.com/what-does-it-really-take-to-get-into-stanford), and industry sources:

#### Academic Foundation (Necessary but Not Sufficient)
- **GPA**: Near-perfect weighted GPAs expected (3.9-4.0 unweighted typical for T20)
- **Course Rigor**: Maximum available challenge (AP/IB/Honors/DE)
- **Test Scores**: 1500+ SAT, 34+ ACT for competitive profiles (when required)
- **Trend**: Improving trajectory valued over consistent mediocrity

#### The "Spike" vs "Well-Rounded" Reality
- **Stanford/MIT**: Favor deep "spikes" - exceptional achievement in one area ([source](https://blog.prepscholar.com/how-to-get-into-stanford-by-an-acceptee))
- **Harvard**: Favor "multi-dimensional leaders" - excellence across domains ([source](https://www.crimsoneducation.org/us/blog/harvard-vs-stanford))
- **Key Insight**: "Colleges want a well-rounded class, not necessarily well-rounded individuals" ([source](https://veritasessays.org/college-admissions-blog/posts/college-admissions-well-rounded-v-spike))

#### Extracurricular Activity Tiers ([CollegeVine](https://blog.collegevine.com/breaking-down-the-4-tiers-of-extracurricular-activities))

| Tier | Description | Impact |
|------|-------------|--------|
| **Tier 1** | National/international recognition, founding successful organizations, significant research | Exceptional |
| **Tier 2** | State/regional leadership, published work, major awards | High |
| **Tier 3** | School leadership, consistent commitment, local impact | Moderate |
| **Tier 4** | General participation, basic membership | Supplementary |

#### Award/Honor Hierarchy ([Admissionado](https://admissionado.com/blog/college/academic-honors/))

| Level | Examples | Signal Strength |
|-------|----------|-----------------|
| **National/International** | Regeneron STS, USAMO, IMO medals | Exceptional |
| **Regional/State** | All-State, State Science Fair | Strong |
| **School-Wide** | Valedictorian, departmental awards | Good |
| **Class/Local** | Honor roll, local competitions | Baseline |

#### Demonstrated Interest ([InGenius Prep](https://ingeniusprep.com/blog/demonstrated-interest-2025/))
- **Ivies/Stanford/MIT**: Do NOT track
- **Many privates** (Tulane, BU, Lehigh, etc.): HEAVILY track
- **Method**: CRM systems (like Slate) track emails opened, events attended, campus visits

#### Letters of Recommendation ([PrepScholar](https://blog.prepscholar.com/how-college-admissions-officers-read-recommendation-letters))
- **Teacher letters**: Academic performance, intellectual curiosity, classroom engagement
- **Counselor letters**: Character, community role, extracurricular focus, context

### 1.2 Existing Uplift Assets to Leverage

| Asset | Location | Reuse Potential |
|-------|----------|-----------------|
| Student profile data | `profiles`, `personal_information` | **Full** - Already collected |
| Academic data | `academic_journey` | **Full** - GPA, courses, tests |
| Activities data | `experiences_activities` | **Full** - Work, volunteer, ECs |
| College research (14 schools) | `src/services/commonAppWorkshop/data/` | **Partial** - Essay-focused, need expansion |
| 11-dimension rubric | `src/core/rubrics/v1.0.0.ts` | **Adapt** - Need portfolio version |
| UC calibration | `src/services/portfolio/constants/ucCalibration.ts` | **Expand** - Need more schools |
| College overlay types | `src/services/commonAppWorkshop/types/collegeResearch.ts` | **Extend** - Add admission stats |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PORTFOLIO & APPLICATION STRATEGY SYSTEM                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   DATA LAYER     │    │  ANALYSIS LAYER  │    │  STRATEGY LAYER  │       │
│  │                  │    │                  │    │                  │       │
│  │ • Profile Data   │───▶│ • Academic Eval  │───▶│ • School Fit     │       │
│  │ • Academic Data  │    │ • Activity Eval  │    │ • Positioning    │       │
│  │ • Activity Data  │    │ • Award Eval     │    │ • Recommendations│       │
│  │ • Goals Data     │    │ • Holistic Eval  │    │ • Gap Analysis   │       │
│  │ • Context Data   │    │ • Spike Detection│    │ • Timeline       │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│           │                       │                       │                  │
│           └───────────────────────┴───────────────────────┘                  │
│                                   │                                          │
│                    ┌──────────────▼──────────────┐                          │
│                    │     ORCHESTRATION LAYER     │                          │
│                    │                             │                          │
│                    │  • Context Assembly         │                          │
│                    │  • Analysis Coordination    │                          │
│                    │  • Cache Management         │                          │
│                    │  • Cost Tracking            │                          │
│                    └──────────────┬──────────────┘                          │
│                                   │                                          │
│           ┌───────────────────────┼───────────────────────┐                 │
│           ▼                       ▼                       ▼                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   CHAT SYSTEM    │  │  INSIGHT ENGINE  │  │  GUIDANCE ENGINE │          │
│  │                  │  │                  │  │                  │          │
│  │ • Q&A Interface  │  │ • Dashboard Data │  │ • Action Items   │          │
│  │ • Deep Dives     │  │ • Visualizations │  │ • Priorities     │          │
│  │ • Follow-ups     │  │ • Comparisons    │  │ • Deadlines      │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                            RESEARCH DATABASE                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ • College Admission Profiles (50+ schools with stats & priorities)   │   │
│  │ • Activity Tier Classification Rules                                 │   │
│  │ • Award Recognition Hierarchies                                      │   │
│  │ • Major-Specific Requirements                                        │   │
│  │ • Demonstrated Interest Tracking by School                           │   │
│  │ • Historical Acceptance Data & Trends                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Academic Evaluation Engine

**Purpose**: Assess academic profile strength in context of target schools

**Inputs**:
- GPA (weighted/unweighted)
- Course rigor (AP/IB/Honors/DE counts and grades)
- Test scores (SAT/ACT + subject tests)
- Class rank (exact, decile, quartile)
- Grade trend (improving/declining/stable)
- School context (public/private, competitiveness)

**Outputs**:
```typescript
interface AcademicEvaluation {
  // Overall strength
  overallTier: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
  overallScore: number; // 0-100

  // Component scores
  components: {
    gpaStrength: { score: number; context: string; benchmark: string };
    rigorIndex: { score: number; courseLoad: string; maxAvailable: string };
    testingStrength: { score: number; context: string; superscoreAdvice?: string };
    trendAnalysis: { direction: 'up' | 'stable' | 'down'; implications: string };
    classRank: { percentile: number; context: string };
  };

  // School-specific assessments
  schoolFit: Record<string, {
    meetsBenchmark: boolean;
    percentile: 'above_75th' | '50th_to_75th' | '25th_to_50th' | 'below_25th';
    competitiveness: string;
    recommendation: string;
  }>;

  // Actionable insights
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}
```

**Key Logic**:
1. Context-aware GPA evaluation (school difficulty, course availability)
2. Rigor maximization assessment (did they take hardest available?)
3. Test score strategy (superscoring, retake recommendations)
4. School-by-school benchmark comparison

### 3.2 Activity Portfolio Analyzer

**Purpose**: Evaluate extracurricular profile depth, breadth, and strategic positioning

**Inputs**:
- All activities from `experiences_activities`
- Time commitments (hours/week, weeks/year, years)
- Leadership positions held
- Achievements within activities
- Impact/outcomes described

**Outputs**:
```typescript
interface ActivityPortfolioAnalysis {
  // Tier distribution
  tierBreakdown: {
    tier1: ActivityTierAssessment[];
    tier2: ActivityTierAssessment[];
    tier3: ActivityTierAssessment[];
    tier4: ActivityTierAssessment[];
  };

  // Strategic analysis
  spikeAnalysis: {
    hasSpike: boolean;
    spikeArea?: string;
    spikeStrength: 'national' | 'regional' | 'local' | 'emerging' | 'none';
    spikeActivities: string[];
    spikeNarrative: string;
  };

  // Thematic coherence
  themes: {
    primary: { theme: string; activities: string[]; strength: number };
    secondary?: { theme: string; activities: string[]; strength: number };
    coherenceScore: number; // How well activities tell a story
  };

  // Time investment analysis
  commitmentAnalysis: {
    totalWeeklyHours: number;
    sustainedCommitments: number; // 2+ years
    progressionShown: number; // Activities with growth
    depthVsBreadth: 'depth_focused' | 'balanced' | 'spread_thin';
  };

  // Leadership assessment
  leadershipProfile: {
    formalPositions: number;
    initiativeShown: number; // Founded, started, created
    impactDemonstrated: number;
    leadershipNarrative: string;
  };

  // Strategic recommendations
  strengths: string[];
  gaps: string[];
  upgrades: ActivityUpgradeRecommendation[];
  newActivitySuggestions: string[];
}

interface ActivityTierAssessment {
  activityId: string;
  activityName: string;
  assignedTier: 1 | 2 | 3 | 4;
  tierJustification: string;
  upgradePathway?: string; // How to move to higher tier
  commonAppPositioning: string; // How to describe for maximum impact
}

interface ActivityUpgradeRecommendation {
  activityId: string;
  currentTier: number;
  potentialTier: number;
  upgradeSteps: string[];
  feasibility: 'high' | 'medium' | 'low';
}
```

**Key Logic**:
1. **Tier classification** using rubric-based assessment:
   - National recognition → Tier 1
   - Regional/state leadership → Tier 2
   - School-level impact → Tier 3
   - Participation only → Tier 4

2. **Spike detection** algorithm:
   - Cluster activities by theme
   - Identify theme with highest total tier score
   - Assess external validation (awards, recognition)
   - Generate spike narrative

3. **Coherence scoring**:
   - Theme extraction from activity descriptions
   - Cross-activity connection strength
   - Narrative thread identification

### 3.3 Award & Recognition Evaluator

**Purpose**: Assess honors and awards in admissions context

**Inputs**:
- Academic honors from `experiences_activities.academic_honors`
- Formal recognition from `experiences_activities.formal_recognition`
- Competition results
- Publications/research

**Outputs**:
```typescript
interface AwardEvaluation {
  // Recognition level distribution
  distribution: {
    nationalInternational: AwardAssessment[];
    stateRegional: AwardAssessment[];
    schoolWide: AwardAssessment[];
    local: AwardAssessment[];
  };

  // Highlight assessment
  highlights: {
    mostImpressive: AwardAssessment;
    mostRelevantToGoals: AwardAssessment;
    bestStory: AwardAssessment;
  };

  // Common App optimization
  commonAppTop5: {
    awards: AwardAssessment[];
    reasoning: string;
    alternativeConfigurations: AwardAssessment[][];
  };

  // Comparative context
  competitiveContext: {
    strengthVsPool: 'exceptional' | 'strong' | 'average' | 'below_average';
    comparisonNarrative: string;
  };

  // Gap analysis
  missingCategories: string[];
  opportunitiesToPursue: string[];
}

interface AwardAssessment {
  awardId: string;
  awardName: string;
  recognitionLevel: 'national' | 'state' | 'school' | 'local';
  selectivity: 'highly_selective' | 'selective' | 'merit_based' | 'participation';
  relevanceToMajor: 'high' | 'medium' | 'low';
  narrativeValue: string; // How this contributes to application story
  description: string; // Optimized 100-char Common App description
}
```

### 3.4 Holistic Profile Synthesizer

**Purpose**: Combine all evaluations into unified assessment

**Inputs**:
- Academic evaluation
- Activity analysis
- Award evaluation
- Personal context (first-gen, low-income, circumstances)
- Goals and aspirations
- Essay quality (from existing analysis)

**Outputs**:
```typescript
interface HolisticProfileSynthesis {
  // Overall profile strength
  profileStrength: {
    overall: number; // 0-100
    tier: 'exceptional' | 'highly_competitive' | 'competitive' | 'developing';
    narrative: string; // One-paragraph summary
  };

  // Component weights for this student
  componentWeights: {
    academic: { weight: number; strength: number };
    activities: { weight: number; strength: number };
    awards: { weight: number; strength: number };
    essays: { weight: number; strength: number };
    context: { weight: number; boost: number }; // Adversity/context boost
  };

  // Unique value proposition
  uniqueValue: {
    primaryDifferentiator: string;
    supportingElements: string[];
    competitorAdvantages: string[];
    vulnerabilities: string[];
  };

  // Application "brand"
  applicationBrand: {
    archetype: string; // e.g., "The Innovator", "The Community Builder"
    coreNarrative: string;
    keyThemes: string[];
    proofPoints: string[];
  };

  // Cross-component coherence
  coherenceAnalysis: {
    score: number;
    alignments: string[]; // Where components reinforce each other
    disconnects: string[]; // Where components seem unrelated
    recommendations: string[];
  };
}
```

### 3.5 School Fit & Strategy Engine

**Purpose**: Match student profile to colleges and provide strategic guidance

**Inputs**:
- Holistic profile synthesis
- Student's college preferences (from `goals_aspirations`)
- Geographic preferences
- Financial considerations
- Major/career interests

**Outputs**:
```typescript
interface SchoolFitAnalysis {
  // Categorized school list
  schoolList: {
    reach: SchoolFitAssessment[];      // <15% chance
    target: SchoolFitAssessment[];     // 15-70% chance
    likely: SchoolFitAssessment[];     // >70% chance
  };

  // Specific school analyses
  detailedAssessments: Record<string, SchoolFitAssessment>;

  // Strategic recommendations
  strategy: {
    recommendedListSize: number;
    earlyDecisionRecommendation?: {
      school: string;
      reasoning: string;
      riskAssessment: string;
    };
    demonstratedInterestPriorities: string[];
    supplementalEssayPriorities: string[];
  };

  // Alternative suggestions
  suggestions: {
    underrated: SchoolFitAssessment[]; // Schools they might not know
    strategicAdds: SchoolFitAssessment[]; // Would strengthen list
    reconsider: string[]; // Schools that don't fit well
  };
}

interface SchoolFitAssessment {
  schoolId: string;
  schoolName: string;

  // Fit metrics
  admissionProbability: number; // 0-100
  category: 'reach' | 'target' | 'likely';

  // Detailed fit analysis
  fitAnalysis: {
    academicFit: { score: number; context: string };
    activityFit: { score: number; context: string };
    valueFit: { score: number; context: string }; // Student values vs college values
    cultureFit: { score: number; context: string };
    programFit: { score: number; context: string }; // Major/program strength
    financialFit: { score: number; context: string };
  };

  // College-specific insights
  collegeInsights: {
    whatTheyValue: string[];
    whatYouOffer: string[];
    potentialConcerns: string[];
    differentiationStrategy: string;
  };

  // Demonstrated interest guidance
  demonstratedInterest: {
    tracksInterest: boolean;
    importance: 'critical' | 'important' | 'helpful' | 'not_tracked';
    recommendedActions: string[];
  };

  // Essay strategy
  supplementalStrategy: {
    numberOfEssays: number;
    keyPrompts: string[];
    narrativeAlignment: string;
    uniqueAngle: string;
  };
}
```

### 3.6 Guidance & Action Engine

**Purpose**: Generate prioritized, actionable recommendations

**Outputs**:
```typescript
interface GuidanceReport {
  // Priority actions (most impactful)
  priorityActions: {
    immediate: ActionItem[]; // Do now
    shortTerm: ActionItem[]; // Next 1-3 months
    ongoing: ActionItem[]; // Continuous
  };

  // Category-specific guidance
  categoryGuidance: {
    academic: {
      currentStrength: string;
      improvements: ActionItem[];
      testStrategy?: ActionItem[];
    };
    activities: {
      currentStrength: string;
      deepen: ActionItem[]; // Deepen existing
      add: ActionItem[]; // Add new
      position: ActionItem[]; // Better describe/position
    };
    awards: {
      currentStrength: string;
      pursue: ActionItem[]; // Awards to go for
      highlight: ActionItem[]; // How to present
    };
    essays: {
      readiness: string;
      preparation: ActionItem[];
    };
    schools: {
      listStrength: string;
      modifications: ActionItem[];
    };
  };

  // Progress tracking
  milestones: {
    milestone: string;
    targetDate: string;
    dependencies: string[];
    status: 'not_started' | 'in_progress' | 'completed';
  }[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'activity' | 'award' | 'essay' | 'school' | 'admin';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  effort: 'minimal' | 'moderate' | 'significant';
  deadline?: string;
  steps: string[];
  resources?: string[];
}
```

### 3.7 Chat/Coaching Interface

**Purpose**: Provide conversational access to insights and guidance

**Capabilities**:
1. **Profile Q&A**: "How strong is my activity list?"
2. **School Questions**: "Am I competitive for Stanford?"
3. **Strategy Advice**: "Should I apply ED somewhere?"
4. **Activity Deep Dives**: "How can I improve my research experience?"
5. **Comparison Questions**: "How do I compare to typical Harvard admits?"
6. **What-If Scenarios**: "If I get National Merit, how does that change things?"

**Architecture**:
- Reuse PIQ/Common App chat patterns
- Context window includes full profile synthesis
- Teaching-focused responses with evidence
- Follow-up question suggestions

---

## 4. Data Flow & Integration

### 4.1 Data Sources (Already Collected via Portfolio Scanner)

```
┌─────────────────────────────────────────────────────────────────┐
│            PORTFOLIO SCANNER DATA (useuplift.io/portfolio-scanner)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  personal_information          academic_journey                  │
│  ├── demographics              ├── gpa, gpa_scale, gpa_type     │
│  ├── household_income          ├── class_rank, class_size       │
│  ├── first_gen                 ├── current_school (+ type)      │
│  ├── parent_guardians          ├── course_history               │
│  └── citizenship               ├── standardized_tests           │
│                                ├── ap_exams, ib_exams           │
│  experiences_activities        └── college_courses              │
│  ├── work_experiences                                           │
│  ├── volunteer_service         goals_aspirations                │
│  ├── extracurriculars          ├── intended_major               │
│  ├── personal_projects         ├── career_interests             │
│  ├── academic_honors           ├── college_preferences          │
│  ├── formal_recognition        ├── geographic_preferences       │
│  └── leadership_roles          └── financial_aid_needs          │
│                                                                  │
│  family_responsibilities       personal_growth                   │
│  ├── responsibilities          ├── meaningful_experiences       │
│  ├── hours_per_week            └── additional_context           │
│  └── circumstances                                              │
│                                                                  │
│  support_network               essays (existing analysis)        │
│  ├── counselor                 ├── PIQ analysis results         │
│  ├── teachers                  └── Common App analysis results  │
│  └── community_organizations                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PASS ANALYSIS PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: Data Assembly                                         │
│  └── Gather all profile data into unified context               │
│                                                                  │
│  Stage 2: Component Analysis (Parallel)                         │
│  ├── Academic Evaluation Engine                                 │
│  ├── Activity Portfolio Analyzer                                │
│  └── Award & Recognition Evaluator                              │
│                                                                  │
│  Stage 3: Synthesis                                             │
│  └── Holistic Profile Synthesizer                               │
│                                                                  │
│  Stage 4: Strategy (Depends on target schools)                  │
│  ├── School Fit & Strategy Engine                               │
│  └── Guidance & Action Engine                                   │
│                                                                  │
│  Stage 5: Delivery                                              │
│  ├── Dashboard Data Generation                                  │
│  ├── Chat Context Preparation                                   │
│  └── Action Item Compilation                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Integration with Existing Systems

```typescript
// Reuse existing essay analysis
const essayQuality = await essayOrchestrator.getLatestAnalysis(userId);

// Reuse college research
const collegeResearch = collegeResearchDatabase.get(schoolId);

// Reuse profile data
const profile = await supabase.from('profiles').select('*').eq('user_id', userId);
const academic = await supabase.from('academic_journey').select('*').eq('user_id', userId);
const activities = await supabase.from('experiences_activities').select('*').eq('user_id', userId);
// ... etc
```

---

## 5. Implementation Phases

### Phase 1: Foundation & Research Database

**Goal**: Build the research foundation and type system

**Tasks**:
1. **College Research Database Expansion**
   - Extend existing 14 colleges with admission stats
   - Add 36 more colleges (reach 50 total)
   - Create college admission profile schema
   - Include: acceptance rates, GPA ranges, test score ranges, application tips

2. **Activity Tier Classification System**
   - Define tier classification rules
   - Build activity category taxonomy
   - Create tier upgrade pathways

3. **Award Recognition Hierarchy**
   - Define recognition levels
   - Build award database (major awards with selectivity data)
   - Create relevance mapping by major

4. **Type System Development**
   - Define all TypeScript interfaces (from Section 3)
   - Create database schema extensions

**Deliverables**:
- `src/services/portfolioStrategy/types/index.ts`
- `src/services/portfolioStrategy/data/collegeAdmissionsData.ts`
- `src/services/portfolioStrategy/data/activityTierRules.ts`
- `src/services/portfolioStrategy/data/awardHierarchy.ts`
- Database migration for new tables

### Phase 2: Core Evaluation Engines

**Goal**: Build the analysis components

**Tasks**:
1. **Academic Evaluation Engine**
   - GPA contextualization
   - Course rigor assessment
   - Test score analysis
   - School-specific benchmarking

2. **Activity Portfolio Analyzer**
   - Tier classification implementation
   - Spike detection algorithm
   - Theme extraction
   - Coherence scoring

3. **Award Evaluator**
   - Recognition level classification
   - Common App optimization
   - Relevance scoring

**Deliverables**:
- `src/services/portfolioStrategy/engines/academicEvaluator.ts`
- `src/services/portfolioStrategy/engines/activityAnalyzer.ts`
- `src/services/portfolioStrategy/engines/awardEvaluator.ts`

### Phase 3: Synthesis & Strategy

**Goal**: Build higher-level analysis and strategy components

**Tasks**:
1. **Holistic Profile Synthesizer**
   - Component integration
   - Weight calculation
   - Brand/archetype detection
   - Coherence analysis

2. **School Fit Engine**
   - Probability estimation model
   - Fit dimension scoring
   - Strategy generation

3. **Guidance Engine**
   - Action item generation
   - Priority scoring

**Deliverables**:
- `src/services/portfolioStrategy/engines/holisticSynthesizer.ts`
- `src/services/portfolioStrategy/engines/schoolFitEngine.ts`
- `src/services/portfolioStrategy/engines/guidanceEngine.ts`

### Phase 4: Orchestration & API

**Goal**: Wire everything together

**Tasks**:
1. **Portfolio Strategy Orchestrator**
   - Stage coordination
   - Caching strategy
   - Cost management

2. **API Endpoints**
   - Full analysis endpoint
   - School-specific endpoints
   - Chat endpoints
   - Progress tracking endpoints

3. **Database Integration**
   - Result persistence
   - History tracking
   - Cache management

**Deliverables**:
- `src/services/portfolioStrategy/orchestrator.ts`
- `src/http/portfolioStrategy.ts` (routes)
- Database migrations for results tables

### Phase 5: Chat Interface

**Goal**: Build conversational interface

**Tasks**:
1. **Chat Service**
   - Context assembly
   - Prompt engineering
   - Response generation

2. **Specialized Handlers**
   - Profile Q&A
   - School questions
   - Strategy advice
   - What-if scenarios

**Deliverables**:
- `src/services/portfolioStrategy/chat/portfolioStrategyChat.ts`
- `src/services/portfolioStrategy/chat/contextBuilder.ts`
- `src/services/portfolioStrategy/chat/handlers/`

### Phase 6: Testing & Refinement

**Goal**: Comprehensive testing and calibration

**Tasks**:
1. **Unit Tests** - Each engine
2. **Integration Tests** - Full pipeline
3. **E2E Tests** - API to results
4. **Calibration** - Adjust scoring based on test results
5. **Edge Cases** - Handle unusual profiles

---

## 6. Database Schema Extensions

### 6.1 New Tables

```sql
-- College admission data (extends existing college research)
CREATE TABLE college_admission_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id TEXT UNIQUE NOT NULL,
  college_name TEXT NOT NULL,

  -- Admission statistics
  acceptance_rate NUMERIC,
  acceptance_rate_ed NUMERIC,
  total_applicants INTEGER,
  total_enrolled INTEGER,
  yield_rate NUMERIC,

  -- Academic benchmarks
  gpa_25th NUMERIC,
  gpa_50th NUMERIC,
  gpa_75th NUMERIC,
  sat_25th INTEGER,
  sat_50th INTEGER,
  sat_75th INTEGER,
  act_25th INTEGER,
  act_50th INTEGER,
  act_75th INTEGER,

  -- Application requirements
  test_policy TEXT, -- 'required', 'optional', 'blind'
  tracks_demonstrated_interest BOOLEAN,
  demonstrated_interest_importance TEXT,
  has_interviews BOOLEAN,
  interview_importance TEXT,

  -- Essay requirements
  supplemental_count INTEGER,
  supplemental_word_counts INTEGER[],

  -- Institutional priorities
  institutional_priorities JSONB,

  -- Major competitiveness
  competitive_majors JSONB,

  -- Data source and freshness
  data_year TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio strategy analysis results
CREATE TABLE portfolio_strategy_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id),

  -- Input fingerprint (for cache invalidation)
  input_hash TEXT NOT NULL,

  -- Analysis results
  academic_evaluation JSONB NOT NULL,
  activity_analysis JSONB NOT NULL,
  award_evaluation JSONB NOT NULL,
  holistic_synthesis JSONB NOT NULL,
  school_fit_analysis JSONB NOT NULL,
  guidance_report JSONB NOT NULL,

  -- Metadata
  analysis_version TEXT NOT NULL,
  model_used TEXT,
  cost_cents INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis history (append-only for tracking changes)
CREATE TABLE portfolio_strategy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id),
  result_id UUID REFERENCES portfolio_strategy_results(id),

  -- What changed
  change_type TEXT NOT NULL, -- 'initial', 'profile_update', 'school_add', 'refresh'
  change_summary TEXT,

  -- Before/after snapshots
  prev_overall_score INTEGER,
  new_overall_score INTEGER,
  prev_tier TEXT,
  new_tier TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversation history
CREATE TABLE portfolio_strategy_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id),
  session_id TEXT NOT NULL,

  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,

  -- Context for this message
  context_snapshot JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's target school list
CREATE TABLE user_school_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id),
  college_id TEXT NOT NULL REFERENCES college_admission_profiles(college_id),

  -- User categorization (may differ from system)
  user_category TEXT, -- 'reach', 'target', 'safety'

  -- System analysis
  system_category TEXT,
  fit_score NUMERIC,
  probability_estimate NUMERIC,

  -- Application status
  application_status TEXT, -- 'considering', 'applying', 'submitted', 'accepted', 'rejected', 'waitlisted'
  decision_type TEXT, -- 'ED', 'EA', 'REA', 'RD'

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, college_id)
);
```

### 6.2 Index Additions

```sql
CREATE INDEX idx_portfolio_strategy_results_user ON portfolio_strategy_results(user_id);
CREATE INDEX idx_portfolio_strategy_results_hash ON portfolio_strategy_results(input_hash);
CREATE INDEX idx_portfolio_strategy_chat_session ON portfolio_strategy_chat(session_id);
CREATE INDEX idx_user_school_list_user ON user_school_list(user_id);
```

---

## 7. API Endpoints

### 7.1 Analysis Endpoints

```typescript
// Full portfolio analysis
POST /api/portfolio-strategy/analyze
Request: { userId: string }
Response: {
  academic: AcademicEvaluation;
  activities: ActivityPortfolioAnalysis;
  awards: AwardEvaluation;
  holistic: HolisticProfileSynthesis;
  schoolFit: SchoolFitAnalysis;
  guidance: GuidanceReport;
}

// Refresh specific component
POST /api/portfolio-strategy/refresh/:component
Request: { userId: string; component: 'academic' | 'activities' | 'awards' | 'holistic' | 'schools' | 'guidance' }

// Get cached results
GET /api/portfolio-strategy/results/:userId
Response: { ... cached results or null }
```

### 7.2 School List Endpoints

```typescript
// Get school fit for specific college
GET /api/portfolio-strategy/school-fit/:collegeId
Request: { userId: string }
Response: SchoolFitAssessment

// Manage school list
GET /api/portfolio-strategy/school-list/:userId
POST /api/portfolio-strategy/school-list
Request: { userId: string; collegeId: string; userCategory?: string }
DELETE /api/portfolio-strategy/school-list/:collegeId
```

### 7.3 Chat Endpoints

```typescript
// Send chat message
POST /api/portfolio-strategy/chat
Request: { userId: string; sessionId: string; message: string }
Response: {
  response: string;
  suggestedFollowUps: string[];
  referencedData?: any;
}

// Get chat history
GET /api/portfolio-strategy/chat/:sessionId
```

### 7.4 Guidance Endpoints

```typescript
// Get prioritized actions
GET /api/portfolio-strategy/actions/:userId
Response: GuidanceReport

// Mark action complete
POST /api/portfolio-strategy/actions/:actionId/complete
```

---

## 8. Deep Research Requirements

### 8.1 College Admission Data (Top 30 Schools - Deep Focus)

**We build DEEP profiles for 30 schools rather than shallow profiles for 50.**

**The Top 30 (in implementation order):**

1. **Harvard University**
2. **Stanford University**
3. **MIT**
4. **Yale University**
5. **Princeton University**
6. **Columbia University**
7. **University of Pennsylvania**
8. **Caltech**
9. **Duke University**
10. **Northwestern University**
11. **University of Chicago**
12. **Brown University**
13. **Dartmouth College**
14. **Cornell University**
15. **Johns Hopkins University**
16. **Rice University**
17. **Vanderbilt University**
18. **Notre Dame**
19. **Georgetown University**
20. **Carnegie Mellon University**
21. **UCLA**
22. **UC Berkeley**
23. **USC**
24. **University of Michigan**
25. **University of Virginia**
26. **NYU**
27. **WashU (St. Louis)**
28. **Emory University**
29. **Georgia Tech**
30. **Tufts University**

**Data Points Per School**:
- Acceptance rate (overall, ED/EA, RD)
- GPA ranges (25th/50th/75th)
- Test score ranges
- Yield rate
- Class size
- Test policy
- Demonstrated interest importance
- Interview policy
- Supplemental essay count
- Most/least competitive majors
- Institutional priorities
- What AOs have said

### 8.2 Activity Tier Classification Research

**Need to define clear criteria for**:
- What makes something "national level"?
- How to assess "impact" objectively?
- Leadership position vs. demonstrated leadership
- Time commitment thresholds
- Activity-specific tier criteria (STEM vs Arts vs Service vs Athletics)

### 8.3 Award Database

**Need comprehensive list of**:
- National competitions and selectivity
- State-level competitions
- Academic olympiads (USAMO, USABO, etc.)
- Science fairs (ISEF, regional)
- Arts competitions
- Athletic achievements
- Writing/journalism awards
- Community service awards
- Research opportunities (RSI, MOSTEC, etc.)

### 8.4 Major-Specific Requirements

**Need research on**:
- Which schools are strongest for which majors
- Major-specific acceptance rates
- What activities matter for different majors
- Required/recommended coursework by major

---

## 9. Testing Strategy

### 9.1 Test Categories

1. **Unit Tests** (per engine)
   - Academic evaluation edge cases
   - Activity tier classification accuracy
   - Award recognition correctness
   - Synthesis logic

2. **Integration Tests**
   - Full pipeline with mock data
   - Database persistence
   - Cache invalidation

3. **E2E Tests**
   - API request to final results
   - Chat conversations
   - School list management

4. **Calibration Tests**
   - Known profiles with expected outcomes
   - Comparison to counselor assessments
   - Edge case profiles

### 9.2 Test Fixtures

Create 10 diverse test profiles:
1. **Strong STEM spike** - Research, olympiads, weak humanities
2. **Balanced leader** - Student government, sports, academics
3. **Arts focused** - Music, theater, creative writing
4. **Community service** - Nonprofits, volunteering, local impact
5. **Athlete** - D1 recruit potential, limited ECs
6. **First-gen, low-income** - Limited opportunities, high achievement
7. **International** - Different education system, visa considerations
8. **Legacy applicant** - Family connections, expectations
9. **Rural student** - Limited access, self-directed
10. **Average achiever** - B+ student, moderate activities

---

## 10. Risk Mitigation

### 10.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| AI hallucination in assessments | Constrained outputs, heuristic fallbacks |
| Slow analysis (many API calls) | Caching, parallel processing |
| Outdated college data | Version tracking, regular updates |
| Inconsistent tier classification | Clear rubric, multiple validation |

### 10.2 Product Risks

| Risk | Mitigation |
|------|------------|
| Overconfident probability estimates | Clear disclaimers, ranges not points |
| Discouraging strong students | Context-aware messaging |
| Missing important factors | Comprehensive data collection |
| Advice seems generic | Personalized, evidence-backed guidance |

### 10.3 Data Risks

| Risk | Mitigation |
|------|------------|
| Stale college statistics | Annual refresh cycle |
| Incorrect tier classifications | Expert review, user feedback |
| Privacy concerns | Secure storage, user consent |

---

## 11. Success Metrics

### 11.1 Quality Metrics
- Activity tier classification accuracy (vs. expert assessment)
- School fit predictions (track actual outcomes)
- User satisfaction with guidance
- Chat response quality

### 11.2 Usage Metrics
- Analysis completions
- Chat engagement
- Action item completion rate
- School list modifications

---

## 12. File Structure

```
src/services/portfolioStrategy/
├── index.ts                           # Main exports
├── types/
│   ├── index.ts                       # All type definitions
│   ├── academic.ts                    # Academic evaluation types
│   ├── activities.ts                  # Activity analysis types
│   ├── awards.ts                      # Award evaluation types
│   ├── synthesis.ts                   # Holistic synthesis types
│   ├── schoolFit.ts                   # School fit types
│   └── guidance.ts                    # Guidance types
├── data/
│   ├── collegeAdmissionsData.ts       # 50 college profiles
│   ├── activityTierRules.ts           # Tier classification rules
│   ├── awardHierarchy.ts              # Award recognition levels
│   └── majorRequirements.ts           # Major-specific data
├── engines/
│   ├── academicEvaluator.ts           # Academic evaluation
│   ├── activityAnalyzer.ts            # Activity analysis
│   ├── awardEvaluator.ts              # Award evaluation
│   ├── holisticSynthesizer.ts         # Profile synthesis
│   ├── schoolFitEngine.ts             # School fit calculation
│   └── guidanceEngine.ts              # Action generation
├── chat/
│   ├── portfolioStrategyChat.ts       # Main chat service
│   ├── contextBuilder.ts              # Context assembly
│   └── handlers/
│       ├── profileQuestions.ts        # Profile Q&A handler
│       ├── schoolQuestions.ts         # School-specific handler
│       ├── strategyAdvice.ts          # Strategy handler
│       └── whatIf.ts                  # Scenario handler
├── orchestrator.ts                    # Main orchestrator
├── cache.ts                           # Caching logic
└── utils/
    ├── inputHash.ts                   # Profile hashing
    └── costTracker.ts                 # Cost tracking

src/http/
├── portfolioStrategy.ts               # API routes

tests/
├── test-portfolio-strategy-academic.ts
├── test-portfolio-strategy-activities.ts
├── test-portfolio-strategy-awards.ts
├── test-portfolio-strategy-synthesis.ts
├── test-portfolio-strategy-school-fit.ts
├── test-portfolio-strategy-guidance.ts
├── test-portfolio-strategy-chat.ts
├── test-portfolio-strategy-e2e.ts
└── fixtures/
    └── testProfiles.ts                # 10 test profiles
```

---

## 13. Research Sources

### Holistic Admissions
- [Stanford Holistic Admission](https://admission.stanford.edu/apply/overview/index.html)
- [IvyWise: What is Holistic Review](https://www.ivywise.com/blog/holistic-review/)
- [Michigan Admissions Collaboratory](https://sites.marsal.umich.edu/mac/research-initiatives/holistic-admissions-practices/)
- [Understanding Holistic Review - College Board](https://highered.collegeboard.org/media/pdf/understanding-holistic-review-he-admissions.pdf)

### Activity Tiers
- [CollegeVine: 4 Tiers of Extracurricular Activities](https://blog.collegevine.com/breaking-down-the-4-tiers-of-extracurricular-activities)
- [CollegeBase: Extracurricular Tier List](https://www.collegebase.org/ecs)
- [Inspira Advantage: Tiers Guide](https://www.inspiraadvantage.com/blog/tiers-of-extracurricular-activities)

### Awards & Recognition
- [Admissionado: Academic Honors](https://admissionado.com/blog/college/academic-honors/)
- [PrepScholar: Academic Honors Examples](https://blog.prepscholar.com/academic-honors-examples-college-application)
- [Regeneron STS Overview](https://www.lumiere-education.com/post/regeneron-science-talent-search-everything-you-need-to-know)
- [CollegeBase: Science Olympiad Medals](https://www.collegebase.org/blog/science-olympiad-national-medals-college-admissions)

### Demonstrated Interest
- [InGenius Prep: Demonstrated Interest 2025](https://ingeniusprep.com/blog/demonstrated-interest-2025/)
- [Collegewise: Truth About Demonstrated Interest](https://collegewise.com/blog/truth-about-demonstrated-interest)
- [PrepScholar: Colleges That Track Interest](https://blog.prepscholar.com/colleges-that-track-demonstrated-interest)

### School Selection Strategy
- [Appily: Safety, Match, Reach](https://www.appily.com/guidance/articles/finding-your-college/what-are-safety-reach-and-match-schools)
- [CollegeVine: School List Strategy](https://blog.collegevine.com/the-college-list-decoded-safeties-targets-and-reaches)
- [Princeton Review: Dream, Match, Safety](https://www.princetonreview.com/college-advice/dream-match-safety-schools)

### Letters of Recommendation
- [College Board: Counselor Recommendations](https://counselors.collegeboard.org/college-application/writing-recommendations-counselors)
- [PrepScholar: How AOs Read Recommendations](https://blog.prepscholar.com/how-college-admissions-officers-read-recommendation-letters)
- [IvyWise: Truth About Recommendation Letters](https://www.ivywise.com/ivywise-knowledgebase/the-truth-about-recommendation-letters/)

### Spike vs Well-Rounded
- [Veritas Essays: Spike vs Well-Rounded](https://veritasessays.org/college-admissions-blog/posts/college-admissions-well-rounded-v-spike)
- [Point Avenue: Top Colleges Don't Want Well-Rounded](https://www.pointavenue.com/news/3651)
- [PrepScholar: How to Get Into Stanford](https://blog.prepscholar.com/how-to-get-into-stanford-by-an-acceptee)

---

## 14. Questions for Tue Before Implementation

1. **Priority order for the 50 colleges?**
   - Should we start with the 14 we have essay research for?
   - Any specific schools students are asking about?

2. **Any specific features to prioritize or deprioritize?**
   - Is the chat interface critical for MVP?
   - Should we focus on analysis depth or breadth first?

3. **Timeline expectations?**
   - What's the target launch date?
   - Can we do phased rollout?

4. **Existing user feedback to incorporate?**
   - What are students most confused about?
   - What questions do they ask most often?

5. **Financial aid integration?**
   - Should school fit include financial aid probability?
   - Net price calculator integration?

6. **International student considerations?**
   - Different evaluation criteria?
   - Visa/documentation considerations?

---

*Awaiting approval to proceed with implementation.*
