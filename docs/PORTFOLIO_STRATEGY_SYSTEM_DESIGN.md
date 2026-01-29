# Holistic Portfolio Analysis & Strategy System (HPASS)

## Comprehensive System Design Document

**Version:** 1.0
**Date:** January 2026
**Status:** Design Complete - Ready for Implementation

---

## Executive Summary

This document defines a multi-layered, research-powered portfolio analysis system that:

1. **Deeply analyzes** every component of a student's college application
2. **Dynamically loads** relevant research context for each analysis stage
3. **Scores** each section using research-backed rubrics
4. **Synthesizes** a holistic view with school-specific positioning
5. **Generates** actionable recommendations and narrative coaching

**Core Insight:** 85% of applicants to elite universities are academically qualified. The differentiator is the combination of authentic activities, character qualities, coherent narrative, and institutional fit.

---

## System Architecture

### High-Level Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOLISTIC PORTFOLIO ANALYSIS SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Student Profile                                                      │
│  ├── Demographics & Context                                                  │
│  ├── Academic Record                                                         │
│  ├── Activities List                                                         │
│  ├── Essays & Personal Statement                                             │
│  ├── Recommendation Context                                                  │
│  └── Target Schools                                                          │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    ANALYSIS STAGE PIPELINE                             │  │
│  │                                                                        │  │
│  │   Stage 0        Stage 1        Stage 2         Stage 3               │  │
│  │   Data Intake ─► Academic ────► Activities ───► Character ──┐         │  │
│  │                                                              │         │  │
│  │                                                              ▼         │  │
│  │   Stage 8        Stage 7        Stage 6         Stage 5     Stage 4   │  │
│  │   Recommend. ◄── School Fit ◄── Synthesis ◄─── Context ◄── RedFlags  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    RESEARCH CONTEXT ENGINE                             │  │
│  │                                                                        │  │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │  │
│  │   │  Section 1  │    │  Section 3  │    │  Section 4  │              │  │
│  │   │ Activities  │    │  Character  │    │  Red Flags  │              │  │
│  │   │ (7 modules) │    │ (7 modules) │    │ (5 modules) │              │  │
│  │   └─────────────┘    └─────────────┘    └─────────────┘              │  │
│  │                                                                        │  │
│  │   ┌─────────────┐    ┌─────────────────────────────────┐              │  │
│  │   │  Section 5  │    │  Extracurricular Databases (9)  │              │  │
│  │   │  Holistic   │    │  ROBOTICS, DEBATE, MODEL_UN,    │              │  │
│  │   │ (5 modules) │    │  STEM_RESEARCH, THEATER, etc.   │              │  │
│  │   └─────────────┘    └─────────────────────────────────┘              │  │
│  │                                                                        │  │
│  │   Dynamic Loading: Only relevant modules loaded per stage             │  │
│  │   Token Efficiency: 3-8K per module vs 100K+ if all loaded            │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    SCORING ENGINE                                      │  │
│  │                                                                        │  │
│  │   Academic (15%) + Activities (25%) + Character (30%) +               │  │
│  │   Narrative (20%) + Fit (10%) + Context Adj. - Red Flag Deductions    │  │
│  │                                                                        │  │
│  │   = UNIVERSAL HOLISTIC SCORE (1.0 - 6.0)                              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│  OUTPUT:                                                                     │
│  ├── Comprehensive Analysis Report                                          │
│  ├── Section-by-Section Scores with Evidence                                │
│  ├── Universal Holistic Score                                               │
│  ├── School-Specific Fit Analyses                                           │
│  ├── Two-Sentence Advocacy Pitch                                            │
│  ├── Strategic Recommendations                                              │
│  └── Narrative Coaching Guide                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage Definitions

### Stage 0: Data Intake & Preprocessing

**Purpose:** Parse and structure student profile data

**Input:** Raw student data
**Output:** Structured StudentProfile object

**Operations:**
- Parse activities into Activity objects
- Extract essay themes and keywords
- Identify demographic context markers
- Detect activity types for database matching

**Research Context Required:** None (pure data processing)

---

### Stage 1: Academic Analysis

**Purpose:** Evaluate academic credentials against threshold standards

**Input:** StudentProfile
**Output:** AcademicAssessment

**Research Context:**
- Section 4.1 (Academic Red Flags)
- Section 5.2 (Rating Systems - threshold understanding)

**Scoring Dimensions:**
- GPA (Context-Adjusted): 35%
- Course Rigor: 35%
- Trajectory: 15%
- Test Scores: 15%

**Output Structure:**
```typescript
interface AcademicAssessment {
  score: number; // 1-6
  gpaScore: number;
  rigorScore: number;
  trajectoryScore: number;
  testScore: number;
  tier: "Exceptional" | "Strong" | "Competitive" | "Developing" | "Concerning";
  redFlags: RedFlag[];
  summary: string;
}
```

---

### Stage 2: Activity Portfolio Analysis

**Purpose:** Deep analysis of each activity and portfolio as whole

**Input:** StudentProfile, AcademicAssessment
**Output:** PortfolioAssessment

**Research Context:**
- Section 1.1 (Quantity Standards)
- Section 1.2 (Time Commitment Credibility)
- Section 1.3 (Depth vs Breadth)
- Section 1.4 (Spike Concept)
- Section 1.5 (Impact Assessment)
- Section 1.7 (Activity Categories)
- Relevant Extracurricular Database(s)

**Dynamic Database Selection:**
```
Activity contains "robot", "FRC", "VEX" → ROBOTICS.md
Activity contains "debate", "speech" → DEBATE_SPEECH.md
Activity contains "model UN", "MUN" → MODEL_UN.md
Activity contains "research", "ISEF" → STEM_RESEARCH.md
Activity contains "theater", "drama" → THEATER_DRAMA.md
Activity contains "writing", "Scholastic" → CREATIVE_WRITING.md
Activity contains "business", "DECA" → ENTREPRENEURSHIP.md
Activity contains "hackathon", "USACO" → HACKATHONS_CS.md
Activity contains "volunteer", "service" → COMMUNITY_SERVICE.md
```

**Scoring Dimensions:**
- Best Activity Tier: 25%
- Spike Strength: 25%
- Thematic Coherence: 20%
- Progression/Growth: 15%
- Quantity Optimization: 15%

**Output Structure:**
```typescript
interface PortfolioAssessment {
  score: number; // 1-6
  activities: ActivityAssessment[];
  spikeAnalysis: SpikeAnalysis;
  thematicCoherence: ThematicAnalysis;
  quantityAssessment: QuantityAnalysis;
  progressionScore: number;
  redFlags: RedFlag[];
  summary: string;
  narrativeElements: string[]; // Key themes for synthesis
}

interface ActivityAssessment {
  name: string;
  type: string;
  tier: 1 | 2 | 3 | 4;
  durationYears: number;
  hoursPerWeek: number;
  credibilityScore: number;
  leadershipScore: number;
  achievementScore: number;
  impactScore: number;
  overallScore: number;
  thematicTags: string[];
  redFlags: RedFlag[];
}

interface SpikeAnalysis {
  detected: boolean;
  primaryArea: string | null;
  supportingActivities: string[];
  strength: number; // 1-6
  evidence: string[];
}
```

---

### Stage 3: Character Assessment

**Purpose:** Evaluate personal character across 7 dimensions

**Input:** StudentProfile, PortfolioAssessment
**Output:** CharacterAssessment

**Research Context:**
- Section 3.1 (Intellectual Curiosity) - if academic/research focus
- Section 3.2 (Resilience) - if adversity narrative
- Section 3.3 (Integrity) - ALWAYS LOADED
- Section 3.4 (Community Contribution) - if service focus
- Section 3.5 (Leadership) - if leadership positions
- Section 3.6 (Self-Awareness) - if reflection/growth narrative
- Section 3.7 (Fit) - ALWAYS LOADED

**Smart Loading Logic:**
```typescript
function selectCharacterModules(profile: StudentProfile): string[] {
  const modules = ['3.3', '3.7']; // Always load

  if (hasResearchActivities(profile)) modules.push('3.1');
  if (hasAdversityEssay(profile)) modules.push('3.2');
  if (hasServiceActivities(profile)) modules.push('3.4');
  if (hasLeadershipRoles(profile)) modules.push('3.5');
  if (hasReflectiveEssay(profile)) modules.push('3.6');

  return modules;
}
```

**Scoring Dimensions (7 Dimensions):**
- Intellectual Curiosity: 20%
- Integrity/Authenticity: 20%
- Leadership: 15%
- Self-Awareness: 15%
- Community Contribution: 10%
- Resilience: 10%
- Fit: 10%

**Output Structure:**
```typescript
interface CharacterAssessment {
  overallScore: number; // 1-6
  dimensions: {
    intellectualCuriosity: DimensionScore;
    resilience: DimensionScore;
    integrity: DimensionScore;
    communityContribution: DimensionScore;
    leadership: DimensionScore;
    selfAwareness: DimensionScore;
    fit: DimensionScore;
  };
  strongestDimensions: string[];
  developingDimensions: string[];
  authenticityScore: number;
  summary: string;
  evidenceMap: Map<string, string[]>;
}

interface DimensionScore {
  score: number; // 1-6
  evidence: string[];
  strengths: string[];
  gaps: string[];
}
```

---

### Stage 4: Red Flag Detection

**Purpose:** Comprehensive scan for authenticity and integrity issues

**Input:** StudentProfile, AcademicAssessment, PortfolioAssessment, CharacterAssessment
**Output:** RedFlagReport

**Research Context:**
- Section 4.1 (Academic Red Flags)
- Section 4.2 (Activity Red Flags)
- Section 4.3 (Character/Integrity Red Flags)
- Section 4.4 (Inconsistency Red Flags)
- Section 4.5 (Application Process Red Flags)

**Detection Categories:**

| Category | Severity | Deduction |
|----------|----------|-----------|
| Tier 1: Disqualifying | Academic dishonesty, fraud, fabrication | -2.0 |
| Tier 2: Severe | Major inconsistencies, paper orgs, voice inconsistency | -1.0 |
| Tier 3: Moderate | Senior padding, typical activities, generic essays | -0.5 |
| Tier 4: Minor | Small discrepancies, overpolished, passive language | -0.25 |

**Output Structure:**
```typescript
interface RedFlagReport {
  overallRisk: "Critical" | "High" | "Moderate" | "Low" | "Minimal";
  totalDeduction: number;
  flags: {
    tier1: RedFlag[]; // Disqualifying
    tier2: RedFlag[]; // Severe
    tier3: RedFlag[]; // Moderate
    tier4: RedFlag[]; // Minor
  };
  consistencyAnalysis: ConsistencyReport;
  mitigationSuggestions: string[];
}

interface RedFlag {
  type: string;
  severity: 1 | 2 | 3 | 4;
  description: string;
  evidence: string;
  impact: string;
  mitigation: string | null;
}
```

---

### Stage 5: Context Calibration

**Purpose:** Adjust all assessments based on opportunity context

**Input:** StudentProfile, All Previous Assessments
**Output:** ContextCalibration

**Research Context:**
- Section 1.6 (Context & Circumstances)
- Section 3.2 (Resilience - privilege calibration)
- Section 5.4 (Institutional Priorities - ALDC context)

**Context Factors:**

| Factor | Max Boost | Criteria |
|--------|-----------|----------|
| First-Generation | +0.25 | First in family to attend college |
| Low-Income | +0.25 | Qualifies for fee waiver |
| Under-Resourced School | +0.25 | Title I, limited AP offerings |
| Family Responsibilities | +0.25 | Significant care duties, work 20+ hrs |
| Geographic Limitation | +0.25 | Rural, limited extracurricular access |
| **Maximum Total** | **+0.50** | Combined context adjustment |

**Output Structure:**
```typescript
interface ContextCalibration {
  contextProfile: ContextProfile;
  totalAdjustment: number; // -0.5 to +0.5
  adjustmentFactors: AdjustmentFactor[];
  calibratedScores: {
    academic: number;
    activities: number;
    character: number;
  };
  contextNarrative: string; // For synthesis stage
}

interface ContextProfile {
  socioeconomic: "Highly Resourced" | "Resourced" | "Middle" | "Under-Resourced" | "Significantly Disadvantaged";
  geographic: "Urban Elite" | "Urban" | "Suburban" | "Rural" | "Remote";
  schoolResources: "Elite Prep" | "Well-Resourced" | "Average" | "Limited" | "Significantly Limited";
  familyCircumstances: "Supportive" | "Neutral" | "Challenging" | "Significant Challenges";
  opportunities: "Abundant" | "Available" | "Limited" | "Scarce";
}
```

---

### Stage 6: Holistic Synthesis

**Purpose:** Synthesize all assessments into unified profile with narrative

**Input:** All Previous Stage Outputs
**Output:** HolisticProfile

**Research Context:**
- Section 5.1 (Reading Process)
- Section 5.2 (Rating Systems)
- Section 5.3 (Committee Decision Making)
- Section 5.5 (Advocacy & It Factor)

**Key Synthesis Tasks:**
1. Calculate Universal Holistic Score
2. Generate Two-Sentence Advocacy Pitch
3. Create Committee Summary Paragraph
4. Identify Primary Hook/Angle
5. Assess Narrative Coherence

**Output Structure:**
```typescript
interface HolisticProfile {
  // Universal Score
  universalScore: number; // 1.0 - 6.0
  scoreBreakdown: {
    academic: { score: number; weight: 0.15; contribution: number };
    activities: { score: number; weight: 0.25; contribution: number };
    character: { score: number; weight: 0.30; contribution: number };
    narrative: { score: number; weight: 0.20; contribution: number };
    fit: { score: number; weight: 0.10; contribution: number };
    contextAdjustment: number;
    redFlagDeduction: number;
  };

  // Interpretation
  tier: "Exceptional" | "Excellent" | "Very Strong" | "Strong" | "Competitive" | "Developing" | "Building" | "Concerning";
  admitProbabilityRange: string; // e.g., "50-70%"

  // Narrative Package
  narrative: {
    twoSentencePitch: string;
    advocacyParagraph: string;
    whyAdmitAnswer: string;
    coreIdentity: string;
    primaryHook: string;
    differentiators: string[];
    narrativeStrength: "Compelling" | "Strong" | "Adequate" | "Weak" | "Disconnected";
    narrativeGaps: string[];
  };

  // Summary Components
  summaries: {
    academic: string;
    activities: string;
    character: string;
    context: string;
    redFlags: string;
  };

  // Strengths & Weaknesses
  keyStrengths: string[];
  keyWeaknesses: string[];
  uniqueValue: string;
}
```

---

### Stage 7: School-Specific Fit Analysis

**Purpose:** Evaluate fit for each target school

**Input:** HolisticProfile, Target Schools
**Output:** SchoolFitReport[]

**Research Context:**
- Section 5.4 (Institutional Priorities)
- Section 3.7 (Fit & Campus Contribution)
- Section 1.4 (Spike Concept - institutional variations)

**School-Specific Weight Adjustments:**

| School Type | Academic | Activities | Character | Narrative | Fit |
|-------------|----------|------------|-----------|-----------|-----|
| MIT/Caltech | 20% | 30% | 25% | 15% | 10% |
| Stanford | 15% | 20% | 35% | 20% | 10% |
| Harvard | 15% | 25% | 30% | 20% | 10% |
| Yale | 15% | 20% | 30% | 25% | 10% |
| Princeton | 15% | 20% | 30% | 20% | 15% |
| Small LACs | 10% | 20% | 30% | 25% | 15% |

**Output Structure:**
```typescript
interface SchoolFitReport {
  school: string;
  schoolSpecificScore: number;

  fitAssessment: {
    missionAlignment: { score: number; evidence: string[]; gaps: string[] };
    priorityMatch: { priorities: string[]; matches: string[]; score: number };
    contributionPotential: { contributions: string[]; score: number };
  };

  positioning: {
    primaryAngle: string;
    differentiators: string[];
    whyThisSchool: string[];
    whyThisStudent: string[];
    hookToLeverage: string;
    concernsToAddress: string[];
  };

  prediction: {
    probability: "High" | "Moderate" | "Low" | "Reach";
    strengthFactors: string[];
    riskFactors: string[];
  };

  essayRecommendations: {
    whySchoolTopics: string[];
    supplementalAngles: string[];
    avoidTopics: string[];
  };
}
```

---

### Stage 8: Strategic Recommendations

**Purpose:** Generate actionable improvement plan

**Input:** HolisticProfile, SchoolFitReports
**Output:** StrategicPlan

**Research Context:**
- Section 5.5 (Advocacy)
- Relevant improvement-focused sections based on gaps

**Output Structure:**
```typescript
interface StrategicPlan {
  overallAssessment: string;

  immediateActions: Action[]; // 1-3 months
  mediumTermDevelopment: Action[]; // 3-6 months
  longTermPositioning: Action[]; // 6-12 months

  gapAnalysis: {
    academicGaps: Gap[];
    activityGaps: Gap[];
    characterGaps: Gap[];
    narrativeGaps: Gap[];
  };

  narrativeCoaching: {
    coreStoryArc: string;
    keyThemes: string[];
    evidenceToHighlight: string[];
    connectionsToMake: string[];
    pitfallsToAvoid: string[];
    voiceGuidance: string;
    schoolAdaptations: Map<string, string>;
  };

  redFlagMitigation: Mitigation[];

  applicationStrategy: {
    schoolList: SchoolRecommendation[];
    timeline: Timeline;
    essayStrategy: EssayStrategy;
  };
}

interface Action {
  priority: "Critical" | "High" | "Medium" | "Low";
  category: "Academic" | "Activity" | "Character" | "Narrative" | "Application";
  action: string;
  rationale: string;
  timeline: string;
  expectedImpact: string;
}
```

---

## Scoring Rubrics

### Academic Scoring Rubric (15% of Universal Score)

#### GPA Assessment (35% of Academic)

| Score | Unweighted GPA | Class Rank | Interpretation |
|-------|----------------|------------|----------------|
| 1 | 4.0 | Top 1% | Perfect/near-perfect |
| 2 | 3.95-3.99 | Top 2-3% | Exceptional with rare imperfections |
| 3 | 3.85-3.94 | Top 5-10% | Consistent high achievement |
| 4 | 3.75-3.84 | Top 10-20% | Solid but not distinguishing |
| 5 | 3.50-3.74 | Top 20-40% | Below typical admitted range |
| 6 | <3.50 | Below 40% | Significant concerns |

#### Course Rigor (35% of Academic)

| Score | AP/IB Load | Evidence |
|-------|------------|----------|
| 1 | Maximum available + beyond | Self-studied APs, college courses, research |
| 2 | Maximum available | Every challenging option taken |
| 3 | High (6-8 APs) | Very rigorous in most areas |
| 4 | Moderate (4-6 APs) | Rigorous in some areas |
| 5 | Limited (2-4 APs) | Avoided significant challenge |
| 6 | Minimal (<2 APs) | Clear rigor avoidance |

#### Trajectory (15% of Academic)

| Score | Pattern |
|-------|---------|
| 1 | Strong start + continued excellence OR significant upward |
| 2 | Consistently strong |
| 3 | Generally strong with minor variations |
| 4 | Inconsistent or slight decline |
| 5 | Downward trend |
| 6 | Significant decline or erratic |

#### Test Scores (15% of Academic)

| Score | SAT | ACT |
|-------|-----|-----|
| 1 | 1550+ | 35+ |
| 2 | 1500-1549 | 34 |
| 3 | 1450-1499 | 32-33 |
| 4 | 1400-1449 | 30-31 |
| 5 | 1350-1399 | 28-29 |
| 6 | <1350 | <28 |

---

### Activity Portfolio Rubric (25% of Universal Score)

#### Individual Activity Tier Classification

| Tier | Achievement Level | Selectivity | Examples |
|------|------------------|-------------|----------|
| 1 | National/International Elite | Top 0.1-1% | National champion, Olympiad qualifier, professional level |
| 2 | State/Regional Excellence | Top 1-5% | State champion, regional winner, significant leadership |
| 3 | Local/School Distinction | Top 5-20% | School leader, local recognition |
| 4 | Participation/Membership | No distinction | Club member, participant |

#### Spike Strength (25% of Portfolio)

| Score | Description |
|-------|-------------|
| 1 | Clear Tier 1 spike with supporting ecosystem |
| 2 | Strong Tier 2 spike with depth |
| 3 | Emerging spike with potential |
| 4 | General theme but no spike |
| 5 | Multiple competing interests |
| 6 | Scattered with no coherence |

#### Thematic Coherence (20% of Portfolio)

| Score | Description |
|-------|-------------|
| 1 | All activities tell unified story; clear "why" |
| 2 | Most activities connected; narrative visible |
| 3 | Some thematic connection |
| 4 | Weak connections |
| 5 | Activities seem random |
| 6 | Contradictory combination |

#### Progression (15% of Portfolio)

| Score | Description |
|-------|-------------|
| 1 | Participant → founder/leader; increasing impact |
| 2 | Clear advancement in roles |
| 3 | Some advancement |
| 4 | Static |
| 5 | Started strong, tapered |
| 6 | Erratic |

#### Quantity Optimization (15% of Portfolio)

| Score | Total | Sustained (2+ yrs) |
|-------|-------|-------------------|
| 1 | 4-5 | All 4-5 |
| 2 | 5-6 | 4-5 |
| 3 | 6-7 | 3-4 |
| 4 | 7-8 | 2-3 |
| 5 | 8-10 | 1-2 |
| 6 | >10 or <3 | 0-1 |

---

### Character Assessment Rubric (30% of Universal Score)

#### 3.1 Intellectual Curiosity (20% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | "Oozes" curiosity | 4-5 domains; created knowledge; drives all activities |
| 2 | Very Strong | 3-4 domains; significant self-study; independent projects |
| 3 | Strong | 2-3 domains; some independent exploration |
| 4 | Adequate | 1-2 domains; follows curriculum; limited pursuit |
| 5 | Limited | Minimal evidence; grade-focused |
| 6 | None | No evidence; transactional education approach |

**Five Evidentiary Domains:**
1. Coursework Extension
2. Independent Projects
3. Academic Discourse
4. Cross-Disciplinary Connections
5. Meta-Learning

#### 3.2 Resilience & Grit (10% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Significant adversity overcome; genuine challenge; resourcefulness; permanent growth |
| 2 | Very Strong | Meaningful challenge; strong coping; clear learning |
| 3 | Strong | Real difficulty; reasonable response; some growth |
| 4 | Adequate | Minor challenges; standard response |
| 5 | Limited | Privileged circumstances; growth claims without evidence |
| 6 | Concerning | Manufactured hardship; victim narrative without growth |

#### 3.3 Integrity & Authenticity (20% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Perfect consistency; authentic voice unmistakable |
| 2 | Very Strong | High consistency; genuine voice |
| 3 | Strong | Generally consistent; authentic overall |
| 4 | Adequate | Some inconsistencies; voice generic |
| 5 | Concerning | Multiple inconsistencies; manufactured feel |
| 6 | Red Flag | Clear authenticity problems; AI/consultant feel |

**Four-Dimension Consistency Check:**
1. Activity-Essay Alignment
2. Essay-Recommendation Alignment
3. Grades-Interest Alignment
4. Voice Consistency

#### 3.4 Community Contribution (10% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Multi-year single cause; impact metrics; "doing with" |
| 2 | Very Strong | Sustained (2+ years); measurable outcomes |
| 3 | Strong | Regular service (1-2 years); some impact |
| 4 | Adequate | Sporadic; participation without leadership |
| 5 | Limited | Minimal service; resume-building feel |
| 6 | Red Flag | International trip primary; "savior" mentality |

#### 3.5 Leadership (15% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Transformational - created lasting change; "what happened because you were there" clear |
| 2 | Very Strong | Significant impact; managed people/resources |
| 3 | Strong | Meaningful responsibilities; some initiative |
| 4 | Adequate | Held position; basic duties |
| 5 | Limited | Title without substance |
| 6 | None | No evidence OR contradicted by recommendations |

#### 3.6 Self-Awareness & Maturity (15% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Before-during-after narrative; appropriate vulnerability; sophisticated reflection |
| 2 | Very Strong | Good self-knowledge; meaningful reflection |
| 3 | Strong | Reasonable self-awareness; some depth |
| 4 | Adequate | Basic self-description; surface insight |
| 5 | Limited | Poor self-awareness; defensive |
| 6 | Concerning | Arrogance; victim mentality; no growth |

#### 3.7 Fit & Campus Contribution (10% of Character)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Clear specific contribution; peer impact articulated; genuine fit |
| 2 | Very Strong | Strong fit evidence; meaningful contribution |
| 3 | Strong | Good fit indicators; general contribution |
| 4 | Adequate | Generic claims; vague contribution |
| 5 | Limited | Poor fit; unclear why this school |
| 6 | Concerning | Obvious mismatch; prestige-only motivation |

---

### Narrative Assessment Rubric (20% of Universal Score)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Compelling 2-sentence pitch; clear hook; memorable; all components unified |
| 2 | Very Strong | Strong narrative; good pitch; coherent; memorable elements |
| 3 | Strong | Narrative present; requires assembly; reasonably coherent |
| 4 | Adequate | Theme visible but weak; pitch difficult; fragmented |
| 5 | Limited | No clear narrative; disconnected; generic identity |
| 6 | None | Contradictory; confusing; impossible to advocate |

**Two-Sentence Pitch Test:**
> "You have to admit [Student] because [compelling 2-sentence pitch]"

If answer is generic ("works hard, good grades"), score is 4 or below.

**Advocacy Test:**
- 1-2: "I'm going to bat for this one"
- 3: "I think this is a strong candidate"
- 4: "This is fine but not special"
- 5-6: "DNS/LMO" (Does Not Stand out / Lacks Memorable Quality)

---

### School Fit Rubric (10% of Universal Score)

| Score | Level | Evidence |
|-------|-------|----------|
| 1 | Exceptional | Specific fit reasons; clear contribution; genuine connection |
| 2 | Very Strong | Strong fit evidence; meaningful potential |
| 3 | Strong | Good indicators; reasonable knowledge |
| 4 | Adequate | Generic claims; could be any school |
| 5 | Limited | Poor fit; unclear motivation |
| 6 | Concerning | Obvious mismatch; prestige-only |

---

## Universal Holistic Score Calculation

### Formula

```
Raw Score = (Academic × 0.15) + (Activities × 0.25) + (Character × 0.30) +
            (Narrative × 0.20) + (Fit × 0.10)

Context Adjustment = Sum of applicable adjustments (max +0.50):
  - First-generation: +0.25
  - Low-income: +0.25
  - Under-resourced school: +0.25
  - Family responsibilities: +0.25
  - Geographic limitation: +0.25

Red Flag Deduction = Sum of all flags:
  - Tier 1: -2.0 (floor at 5.0)
  - Tier 2: -1.0
  - Tier 3: -0.5
  - Tier 4: -0.25

UNIVERSAL HOLISTIC SCORE = Raw Score + Context Adjustment - Red Flag Deduction
```

### Score Interpretation

| Score | Level | Top 20 Probability |
|-------|-------|-------------------|
| 1.0-1.4 | Exceptional | 90%+ |
| 1.5-1.9 | Excellent | 70-90% |
| 2.0-2.4 | Very Strong | 50-70% |
| 2.5-2.9 | Strong | 30-50% |
| 3.0-3.4 | Competitive | 15-30% |
| 3.5-3.9 | Developing | 5-15% |
| 4.0-4.4 | Building | <5% |
| 4.5+ | Concerning | Not competitive |

---

## Research Module Mapping

### Stage → Module Dependencies

| Stage | Required Modules | Conditional Modules |
|-------|------------------|---------------------|
| 0 | None | None |
| 1 | 4.1, 5.2 | None |
| 2 | 1.1, 1.2, 1.3, 1.4, 1.5 | 1.6, 1.7, Extracurricular DBs |
| 3 | 3.3, 3.7 | 3.1, 3.2, 3.4, 3.5, 3.6 (based on profile) |
| 4 | 4.1, 4.2, 4.3, 4.4, 4.5 | None |
| 5 | 1.6, 3.2, 5.4 | None |
| 6 | 5.1, 5.2, 5.3, 5.5 | None |
| 7 | 5.4, 3.7, 1.4 | School-specific sections |
| 8 | 5.5 | Based on gaps identified |

---

## File Structure

```
src/services/portfolioStrategy/
├── index.ts
├── types/
│   ├── index.ts
│   ├── student.types.ts
│   ├── academic.types.ts
│   ├── activity.types.ts
│   ├── character.types.ts
│   ├── redFlag.types.ts
│   ├── holistic.types.ts
│   └── recommendation.types.ts
├── context/
│   ├── researchContextService.ts
│   ├── contextSelectionEngine.ts
│   └── moduleLoader.ts
├── stages/
│   ├── stage0DataIntake.ts
│   ├── stage1Academic.ts
│   ├── stage2Activities.ts
│   ├── stage3Character.ts
│   ├── stage4RedFlags.ts
│   ├── stage5ContextCalibration.ts
│   ├── stage6HolisticSynthesis.ts
│   ├── stage7SchoolFit.ts
│   └── stage8Recommendations.ts
├── scoring/
│   ├── scoringEngine.ts
│   ├── academicScoring.ts
│   ├── activityScoring.ts
│   ├── characterScoring.ts
│   ├── narrativeScoring.ts
│   └── holisticScoring.ts
├── narrative/
│   ├── narrativeSynthesizer.ts
│   ├── pitchGenerator.ts
│   └── advocacyBuilder.ts
├── schools/
│   ├── schoolProfilerFactory.ts
│   ├── mitProfiler.ts
│   ├── stanfordProfiler.ts
│   ├── harvardProfiler.ts
│   └── genericProfiler.ts
└── orchestrator/
    ├── portfolioOrchestrator.ts
    └── stageCoordinator.ts
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Define all TypeScript interfaces
- [ ] Build ResearchContextService
- [ ] Create ContextSelectionEngine
- [ ] Set up stage orchestration skeleton

### Phase 2: Core Stages (Week 2-4)
- [ ] Implement Stage 0-5
- [ ] Build prompt templates
- [ ] Create scoring engine
- [ ] Test with sample profiles

### Phase 3: Synthesis (Week 4-5)
- [ ] Implement Stage 6
- [ ] Build narrative generation
- [ ] Create pitch generator
- [ ] Implement advocacy builder

### Phase 4: School-Specific (Week 5-6)
- [ ] Implement Stage 7
- [ ] Build school profilers
- [ ] Create positioning strategies

### Phase 5: Recommendations (Week 6-7)
- [ ] Implement Stage 8
- [ ] Build action plan generator
- [ ] Create gap analysis

### Phase 6: Integration (Week 7-8)
- [ ] Integrate with existing services
- [ ] End-to-end testing
- [ ] Performance optimization

---

## Success Criteria

1. **Two-Sentence Pitch Test:** Every analysis must produce a compelling 2-sentence advocacy pitch
2. **Consistency Verification:** Cross-component consistency must be verified
3. **Context Calibration:** All scores adjusted for opportunity
4. **School-Specific Relevance:** Recommendations must be tailored to each target school
5. **Red Flag Detection:** Critical red flags must be caught before submission
6. **Actionable Output:** Every weakness identified must have an improvement path

---

## References

- `/docs/research/section1-activities/` - Activity Evaluation Framework (7 modules)
- `/docs/research/section3-character/` - Character Assessment Framework (7 modules)
- `/docs/research/section4-red-flags/` - Red Flag Detection Framework (5 modules)
- `/docs/research/section5/` - Holistic Review Process (5 modules)
- `/docs/research/extracurricular-databases/` - Activity-Specific Tier Systems (9 databases)
- `/docs/research/MASTER_RETRIEVAL_INDEX.md` - Module retrieval decision tree
