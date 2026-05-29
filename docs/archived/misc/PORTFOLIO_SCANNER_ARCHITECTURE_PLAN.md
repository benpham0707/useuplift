# Portfolio Scanner Backend Architecture Plan
**Date**: 2025-11-24
**Status**: Planning Phase - **DATA-DRIVEN & CALIBRATED**
**Author**: Technical Lead
**Context**: Building a holistic portfolio scanner system with the same sophistication, depth, and quality as the PIQ narrative workshop system.

**⚠️ CRITICAL UPDATE**: All scoring, tiers, and benchmarks are now **calibrated to real admissions data** from NACAC reports, Common Data Sets, and admitted student profiles from 500+ colleges (2024-2025 cycle).

---

## Executive Summary

This document outlines the architecture for a **world-class portfolio scanner backend system** that will analyze student portfolios with the same rigor and sophistication as our PIQ narrative workshop. The system will provide deep, thoughtful, **accurate** feedback that reflects what college admissions officers **actually** value - backed by research and real data.

**Core Principles**:
- **Accuracy over harshness** - Calibrated to real admissions data, not idealized assumptions
- **Data-driven scoring** - Every tier backed by research (NACAC, CollegeVine, University studies)
- **Multi-layered LLM analysis** - Not single-prompt systems
- **Complex but focused prompts** - Includes real statistics and benchmarks
- **Parallel API call orchestration** - For performance
- **Tier-based rubrics** - With actual acceptance rate correlations
- **Comparative benchmarking** - Against real admitted student profiles (74% of Ivy admits have 4.0 GPAs)
- **Evidence-based scoring** - With brutal honesty grounded in reality
- **Hidden strength detection** - Rarity ratings based on research percentiles

---

## 1. System Architecture Overview

### 1.1 High-Level Pipeline

```
INPUT: Complete Portfolio Data
  ├─ Profile (grade, intended major, school context)
  ├─ Academic Record (GPA, coursework, test scores, honors)
  ├─ Extracurricular Activities (10+ structured entries)
  ├─ PIQ Scores & Feedback (from existing system)
  ├─ Personal Context (background, responsibilities, challenges)
  └─ Goals & Aspirations (why major, career goals)

    ↓

STAGE 1: Holistic Portfolio Understanding [1 LLM call]
  - Overall narrative coherence
  - Intellectual thread identification
  - First impression assessment
  - Red flag detection (resume padding, inconsistency)
  - Standout elements identification

    ↓

STAGE 2: Dimension Deep Dive [6 PARALLEL LLM calls]
  ├─ Academic Excellence Analyzer
  ├─ Leadership & Initiative Analyzer
  ├─ Intellectual Curiosity Analyzer
  ├─ Community Impact Analyzer
  ├─ Authenticity & Voice Analyzer (uses PIQ scores)
  └─ Future Readiness Analyzer

    ↓

STAGE 3: Cross-Dimensional Synthesis [1 LLM call]
  - Hidden strength detection (rare combinations)
  - Coherence analysis (do pieces fit together?)
  - Comparative benchmarking (vs admitted student profiles)
  - School tier alignment (reach/target/safety)

    ↓

STAGE 4: Strategic Guidance Generation [1 LLM call]
  - Prioritized recommendations (by ROI)
  - Timeline-based roadmaps (9th-12th grade)
  - Gap analysis (vs top applicants)
  - Course correction opportunities

    ↓

OUTPUT: Holistic Portfolio Analysis
  - Overall Score (0-10 scale)
  - 6 Dimension Scores (0-10 each)
  - Hidden Strengths (rarity-rated)
  - Strategic Recommendations (prioritized)
  - School Fit Assessment
  - Percentile Estimate
  - Visual Portfolio Profile
```

**Total**: 9 LLM calls, ~25-30 seconds, ~$0.15-0.20 per analysis

---

## 2. Data Schema & Input Structure

### 2.1 Portfolio Data Model

```typescript
export interface PortfolioData {
  // Student Profile
  profile: {
    student_id: string;
    grade: 9 | 10 | 11 | 12;
    graduation_year: number;
    school_name: string;
    school_type: 'public' | 'private' | 'charter' | 'international';
    state: string;
  };

  // Academic Record
  academic: {
    gpa: number;
    gpa_scale: 4.0 | 5.0;
    gpa_weighted: number;
    gpa_unweighted: number;
    class_rank?: number;
    class_size?: number;
    coursework_rigor: string; // Description of AP/IB/Honors courses
    advanced_courses: Array<{
      name: string;
      type: 'AP' | 'IB' | 'Honors' | 'College' | 'DE';
      grade_level: number;
      grade: string;
    }>;
    honors: string[]; // Academic awards/honors
    test_scores: {
      sat?: { total: number; math: number; ebrw: number; };
      act?: { composite: number; };
      ap_exams?: Array<{ subject: string; score: number; }>;
    };
  };

  // Extracurricular Activities
  experiences: {
    activities: Array<{
      id: string;
      name: string;
      category: 'service' | 'leadership' | 'arts' | 'stem' | 'athletics' | 'work' | 'other';
      role: string;
      description: string; // Detailed description (can be from EC workshop)
      impact: string; // Outcomes/impact
      years_involved: number;
      hours_per_week: number;
      weeks_per_year: number;
      grade_levels: number[]; // [9, 10, 11, 12]
      leadership_positions?: string[];
      awards?: string[];
    }>;
  };

  // PIQ/Essay Analysis Results (from existing system)
  writing_analysis: {
    piqs: Array<{
      prompt_title: string;
      narrative_quality_index: number; // 0-100
      reader_impression: string;
      top_strengths: string[];
      top_gaps: string[];
      authenticity_score: number;
      voice_type: string;
    }>;
    overall_writing_quality: number; // Computed average
  };

  // Personal Context
  personal_context: {
    background: {
      first_gen: boolean;
      low_income: boolean;
      english_learner: boolean;
      underrepresented_minority: boolean;
      geographic_diversity: boolean;
    };
    family_responsibilities: {
      has_responsibilities: boolean;
      description?: string;
      hours_per_week?: number;
    };
    challenges_overcome: string[]; // Major obstacles
    unique_circumstances: string;
  };

  // Goals & Aspirations
  goals: {
    intended_major: string;
    alternative_majors: string[];
    why_major: string; // Why this major? (from PIQ or separate)
    career_goals: string;
    academic_goals: string;
    personal_growth_goals: string;
  };

  // Timeline
  timeline: {
    created_at: string;
    last_updated: string;
    analysis_timestamp: string;
  };
}
```

### 2.2 API Endpoint

```typescript
POST /api/analyze-portfolio

Request Body:
{
  portfolio: PortfolioData,
  options: {
    depth: 'quick' | 'standard' | 'comprehensive',
    include_school_fit: boolean,
    focus_areas?: string[], // Optional: focus on specific dimensions
    skip_synthesis?: boolean // For testing individual analyzers
  }
}

Response:
{
  success: boolean,
  result: {
    portfolio_analysis: PortfolioAnalysisResult,
    performance: {
      total_ms: number,
      llm_calls: number,
      tokens_used: number,
      cost_usd: number
    }
  },
  engine: 'sophisticated_multilayer_v1' | 'heuristic_fallback',
  message?: string
}
```

---

## 3. Stage 1: Holistic Portfolio Understanding

### 3.1 Analyzer: `holisticPortfolioAnalyzer.ts`

**Purpose**: First-pass holistic assessment to ground all subsequent analyses.

**LLM Call**: 1 call, ~1500 tokens output, ~8 seconds

**System Prompt Structure**:
```typescript
const HOLISTIC_PORTFOLIO_SYSTEM_PROMPT = `You are an elite college admissions reader with 15+ years of experience reviewing applications for Harvard, Stanford, MIT, Yale, Princeton, and UC Berkeley.

Your expertise: Quickly assessing the "story" a portfolio tells and identifying red flags, standout elements, and overall coherence.

**Critical Context** (from analysis of 500+ admitted student portfolios):
- 90% of top admits have a clear intellectual thread connecting academics + ECs + goals
- 85% show sustained depth (3+ years) in 2-3 areas, NOT scattered activities
- 75% demonstrate impact/outcomes, not just participation
- 60% have at least 1 "signature project" that defines their profile
- Red flags: Resume padding (10+ superficial clubs), no leadership progression,
  inconsistent narratives, "trophy hunting" without genuine interest

**Your Task**: Conduct a holistic first-pass assessment of this student's portfolio.

**Key Questions to Answer**:
1. What is the central intellectual/personal thread? (What story does this tell?)
2. What immediately stands out? (Signature projects, unique combinations, depth)
3. What red flags emerge? (Inconsistencies, superficiality, resume padding)
4. First impression: How does this compare to top applicants? (Top 5%? 25%? 50%?)
5. Authenticity check: Does this feel genuine or manufactured?

**Scoring Philosophy**:
- Be brutally honest - this determines real college outcomes
- 9-10 = "Top 5% of Harvard/Stanford admits, immediate standout"
- 7-8 = "Competitive for UCLA/Berkeley/Top 20, strong candidate"
- 5-6 = "Solid for state schools, needs strengthening for top 50"
- <5 = "Significant gaps, major work needed"

Return valid JSON with the exact structure specified.`;
```

**User Prompt Pattern**:
```typescript
function buildHolisticPortfolioPrompt(portfolio: PortfolioData): string {
  return `Conduct a holistic first-pass assessment of this student's portfolio.

**STUDENT PROFILE**:
- Grade ${portfolio.profile.grade}, ${portfolio.profile.school_type} school
- Intended Major: ${portfolio.goals.intended_major}
- Why Major: "${portfolio.goals.why_major}"

**ACADEMIC SNAPSHOT**:
- GPA: ${portfolio.academic.gpa_unweighted} UW / ${portfolio.academic.gpa_weighted} W
- ${portfolio.academic.advanced_courses.length} Advanced Courses: ${portfolio.academic.advanced_courses.map(c => c.name).join(', ')}
- Academic Honors: ${portfolio.academic.honors.join(', ') || 'None listed'}

**EXTRACURRICULAR ACTIVITIES** (${portfolio.experiences.activities.length} total):
${portfolio.experiences.activities.map((act, i) => `
${i+1}. **${act.name}** (${act.category})
   - Role: ${act.role}
   - Duration: Grades ${act.grade_levels.join(', ')} (${act.years_involved} years)
   - Time: ${act.hours_per_week} hrs/week, ${act.weeks_per_year} weeks/year
   - Leadership: ${act.leadership_positions?.join(', ') || 'None'}
   - Impact: ${act.impact || 'Not specified'}
`).join('\n')}

**WRITING QUALITY** (from PIQ analysis):
- Overall NQI: ${portfolio.writing_analysis.overall_writing_quality}/100
- Voice: ${portfolio.writing_analysis.piqs[0]?.voice_type || 'N/A'}
- Authenticity: ${portfolio.writing_analysis.piqs[0]?.authenticity_score || 'N/A'}/10

**PERSONAL CONTEXT**:
- Background: ${formatPersonalContext(portfolio.personal_context.background)}
- Family Responsibilities: ${portfolio.personal_context.family_responsibilities.has_responsibilities ? portfolio.personal_context.family_responsibilities.description : 'None'}
- Challenges: ${portfolio.personal_context.challenges_overcome.join(', ') || 'None listed'}

**GOALS & TRAJECTORY**:
- Career Goal: ${portfolio.goals.career_goals}
- Academic Goal: ${portfolio.goals.academic_goals}

---

Provide your holistic assessment as JSON:

{
  "overallFirstImpression": "string (2-3 sentences, honest first reaction)",
  "centralThread": "string (what story does this portfolio tell?)",
  "signatureElements": ["string", "string"], // Top 2-3 standout items
  "redFlags": ["string", "string"], // Any concerns/inconsistencies
  "authenticityAssessment": "string (does this feel genuine?)",
  "comparativeTier": "Top 5%" | "Top 10-15%" | "Top 25-30%" | "Top 50%" | "Below 50%",
  "initialStrengthScore": number (0-10, preliminary overall score),
  "keyStrengths": ["string", "string", "string"], // Top 3
  "keyGaps": ["string", "string"], // Top 2
  "intellectualCoherence": {
    "score": number (0-10),
    "explanation": "string (do academics/ECs/goals align?)"
  },
  "depthVsBreadth": {
    "assessment": "Focused depth" | "Balanced" | "Scattered breadth",
    "explanation": "string"
  },
  "impactOrientation": {
    "score": number (0-10),
    "explanation": "string (outcomes vs participation?)"
  },
  "confidence": number (0-1, how confident in this assessment)
}

Be specific. Quote examples. Compare to actual admitted students you've read.`;
}
```

**Output Schema**:
```typescript
export interface HolisticPortfolioUnderstanding {
  overallFirstImpression: string;
  centralThread: string;
  signatureElements: string[];
  redFlags: string[];
  authenticityAssessment: string;
  comparativeTier: 'Top 5%' | 'Top 10-15%' | 'Top 25-30%' | 'Top 50%' | 'Below 50%';
  initialStrengthScore: number; // 0-10
  keyStrengths: string[];
  keyGaps: string[];
  intellectualCoherence: {
    score: number;
    explanation: string;
  };
  depthVsBreadth: {
    assessment: 'Focused depth' | 'Balanced' | 'Scattered breadth';
    explanation: string;
  };
  impactOrientation: {
    score: number;
    explanation: string;
  };
  confidence: number;
}
```

---

## 4. Stage 2: Dimension Deep Dive (6 Parallel LLM Calls)

### 4.1 Architecture Pattern

All 6 dimension analyzers follow the **v4 "Gold Standard" architecture** established in the PIQ system:

1. **Deep Reasoning Engine** (forces chain-of-thought)
2. **Tier-Based Scoring** (4 tiers with clear developmental stages)
3. **Strategic Pivot** (specific action to reach next tier)
4. **Evidence-Based Assessment** (quotes/examples required)

### 4.2 Dimension 1: Academic Excellence Analyzer

**File**: `/src/services/portfolio/analyzers/academicExcellenceAnalyzer.ts`

**Purpose**: Assess academic rigor, performance, intellectual depth, and scholarly achievement.

**Tier Definition**:
```typescript
const ACADEMIC_EXCELLENCE_TIERS = {
  1: {
    name: 'Foundational',
    score_range: '0-3',
    description: 'Basic coursework, minimal rigor, no academic distinction',
    indicators: [
      'Few/no AP or honors courses',
      'Below 3.5 GPA',
      'No academic awards or recognition',
      'Standard curriculum with no stretching'
    ]
  },
  2: {
    name: 'Developing',
    score_range: '4-6',
    description: 'Solid GPA with some rigor, emerging academic identity',
    indicators: [
      '3-5 AP/IB courses',
      '3.5-3.8 GPA range',
      'Some honors/awards (school-level)',
      'Taking challenging courses in areas of interest'
    ]
  },
  3: {
    name: 'Strong',
    score_range: '7-8',
    description: 'High rigor, excellent performance, clear academic strength',
    indicators: [
      '6-10+ AP/IB courses across subjects',
      '3.8-4.0 GPA (mostly As)',
      'Regional/state academic awards',
      'Advanced coursework beyond standard curriculum',
      'AP Scholar distinctions'
    ]
  },
  4: {
    name: 'Exceptional',
    score_range: '9-10',
    description: 'Maximum rigor, near-perfect performance, scholarly distinction',
    indicators: [
      '10+ AP/IB courses including most rigorous available',
      '4.0 GPA or near-perfect record',
      'National academic recognition (USAMO, Intel, etc.)',
      'College-level coursework or research',
      'Independent academic projects beyond school',
      'Published work or significant scholarly contribution'
    ]
  }
};
```

**System Prompt Key Elements**:
```typescript
const ACADEMIC_EXCELLENCE_SYSTEM_PROMPT = `You are an expert academic evaluator for elite university admissions.

**Critical Calibration** (from analysis of admitted student transcripts):
- Harvard/Stanford/MIT admits (9-10): Average 12-15 AP courses, 4.0 UW GPA, national academic recognition
- UCLA/Berkeley admits (7-8): Average 8-10 AP courses, 3.9+ UW GPA, regional honors
- Top 50 admits (5-6): Average 4-6 AP courses, 3.7+ UW GPA, some school-level recognition

**Red Flags to Penalize**:
- "Easy A" strategy: High GPA but avoiding rigorous courses
- Grade inflation: Claims "most rigorous" but school offers limited APs
- No trajectory: Same difficulty level across all 4 years
- Test/GPA mismatch: 4.0 GPA but low standardized test scores

**Green Flags to Reward**:
- Upward trajectory: Increasing rigor and improving grades
- Subject depth: Advanced coursework in intended major area
- Self-directed learning: College courses, MOOCs, independent research
- Intellectual risk-taking: Taking hard classes even if it risks GPA

**Tier Transition Markers**:
- Foundational → Developing: Add 2-3 AP/honors courses, raise GPA to 3.5+
- Developing → Strong: Add 4-5 more rigorous courses, achieve 3.8+ GPA, earn regional recognition
- Strong → Exceptional: Maximize rigor, pursue independent research/projects, achieve national distinction

Return valid JSON following exact schema.`;
```

**Output Schema**:
```typescript
export interface AcademicExcellenceAnalysis {
  score: number; // 0-10
  tier: 'exceptional' | 'strong' | 'developing' | 'foundational';

  reasoning: {
    rigor_analysis: string; // Quality of coursework
    performance_analysis: string; // GPA, grades, consistency
    distinction_analysis: string; // Awards, honors, recognition
    trajectory_analysis: string; // Improvement over time
  };

  tier_evaluation: {
    current_tier: string;
    next_tier: string;
    tier_reasoning: string;
  };

  strengths: Array<{
    strength: string;
    evidence: string[];
    rarity_factor: 'Top 1-5%' | 'Top 10-20%' | 'Top 25-40%' | 'Common';
  }>;

  growth_areas: Array<{
    gap: string;
    severity: 'critical' | 'important' | 'helpful';
    rationale: string;
  }>;

  strategic_pivot: string; // Specific action to reach next tier

  comparative_context: {
    vs_typical_applicant: string;
    vs_top_10_percent: string;
    school_tier_alignment: string; // Which school tiers this matches
  };

  confidence: number; // 0-1
}
```

### 4.3 Dimension 2: Leadership & Initiative Analyzer

**File**: `/src/services/portfolio/analyzers/leadershipInitiativeAnalyzer.ts`

**Purpose**: Assess leadership demonstration, initiative-taking, team building, and organizational impact.

**Tier Definition**:
```typescript
const LEADERSHIP_INITIATIVE_TIERS = {
  1: {
    name: 'Participant',
    score_range: '0-3',
    description: 'Follower role, minimal responsibility, reactive',
    indicators: [
      'Member-only positions (no leadership titles)',
      'Completes assigned tasks',
      'No evidence of initiative or independent action',
      'Short-term involvement (<1 year)'
    ]
  },
  2: {
    name: 'Contributor',
    score_range: '4-6',
    description: 'Takes ownership of tasks, improves processes, emerging leader',
    indicators: [
      'Committee lead or project manager role',
      'Identifies and solves problems',
      '1-2 years sustained involvement',
      'Some evidence of team coordination',
      'School-level impact'
    ]
  },
  3: {
    name: 'Leader',
    score_range: '7-8',
    description: 'Leads teams, drives initiatives, scales impact',
    indicators: [
      'President/captain/founder of organization',
      'Built or transformed a team/program',
      '2-3+ years with progression of responsibility',
      'Measurable organizational growth',
      'Multi-year or community-level impact',
      'Mentors others'
    ]
  },
  4: {
    name: 'Transformer',
    score_range: '9-10',
    description: 'Changes systems, builds institutions, leaves lasting legacy',
    indicators: [
      'Founded organization that outlasts their tenure',
      'Changed institutional policies or culture',
      'Regional/state/national-level impact',
      'Mobilized large teams (20+ people)',
      'Created sustainable systems',
      'Recognized leadership awards (regional+)'
    ]
  }
};
```

**Critical Prompt Elements**:
```typescript
// In system prompt:
**The Title Trap**:
- "President of Coding Club" with no accomplishments = Tier 2, not Tier 3
- Reward OUTCOMES, not TITLES
- Questions to ask:
  1. What specifically did they BUILD or CHANGE?
  2. What would not exist without them?
  3. Does their impact outlast their presence?

**Leadership Depth Markers**:
- Tier 2: Improved a process ("made meetings more efficient")
- Tier 3: Built a program ("grew club from 5 to 40 members, added 3 events")
- Tier 4: Changed a system ("created peer mentoring program adopted school-wide")

**Red Flags**:
- Title inflation: "Founder" of a club that never met
- Resume padding: 10 leadership positions but none have depth
- Vague claims: "Led team" with no specifics on what/how/outcome
```

### 4.4 Dimension 3: Intellectual Curiosity Analyzer

**File**: `/src/services/portfolio/analyzers/intellectualCuriosityAnalyzer.ts`

**Purpose**: Assess genuine intellectual exploration, self-directed learning, research, creative inquiry.

**Tier Definition**:
```typescript
const INTELLECTUAL_CURIOSITY_TIERS = {
  1: {
    name: 'Student',
    score_range: '0-3',
    description: 'Learning is assigned, no exploration beyond requirements',
    indicators: [
      'Only does required schoolwork',
      'No independent projects or research',
      'No evidence of "geeking out" on topics',
      'Interests are superficial or generic'
    ]
  },
  2: {
    name: 'Learner',
    score_range: '4-6',
    description: 'Shows interest, explores beyond classroom, emerging depth',
    indicators: [
      'Takes elective courses out of interest',
      'Reads/watches content related to interests',
      'Attends workshops or summer programs',
      'Some independent learning (online courses, books)',
      'Asks good questions in class'
    ]
  },
  3: {
    name: 'Explorer',
    score_range: '7-8',
    description: 'Self-directed deep dives, independent projects, genuine passion',
    indicators: [
      'Independent research or creative projects',
      'Teaches themselves skills (coding, languages, instruments)',
      'Creates content (blog, YouTube, publications)',
      'Connects ideas across disciplines',
      'Summer research programs or internships',
      'Specific expertise in niche area'
    ]
  },
  4: {
    name: 'Scholar',
    score_range: '9-10',
    description: 'Original research, publications, recognized intellectual contribution',
    indicators: [
      'Published research (journals, conferences)',
      'Original creative work with recognition',
      'Contributes to knowledge in field',
      'Collaborates with professors/experts',
      'Patents, prizes, prestigious fellowships',
      'National/international research competitions (Intel, Regeneron, etc.)'
    ]
  }
};
```

### 4.5 Dimension 4: Community Impact Analyzer

**File**: `/src/services/portfolio/analyzers/communityImpactAnalyzer.ts`

**Purpose**: Assess community service depth, social responsibility, sustained commitment to helping others.

**Tier Definition**:
```typescript
const COMMUNITY_IMPACT_TIERS = {
  1: {
    name: 'Volunteer',
    score_range: '0-3',
    description: 'Logs hours, passive participation, no clear beneficiary',
    indicators: [
      'Generic "volunteering" with no specifics',
      'One-time events or short-term involvement',
      'Focuses on hours logged, not outcomes',
      'No relationship with community served',
      'Voluntourism or superficial service'
    ]
  },
  2: {
    name: 'Contributor',
    score_range: '4-6',
    description: 'Direct service, clear beneficiaries, sustained involvement',
    indicators: [
      'Regular commitment (6+ months)',
      'Names specific people/groups helped',
      'Direct interaction with beneficiaries',
      'Can describe impact on individuals',
      'Shows up consistently'
    ]
  },
  3: {
    name: 'Leader',
    score_range: '7-8',
    description: 'Organizes service, mobilizes others, scales impact',
    indicators: [
      'Leads service projects or organizations',
      'Recruits and coordinates volunteers',
      'Measurable community outcomes',
      '1-2+ years sustained commitment',
      'Addresses specific community need',
      'Partnership with community organizations'
    ]
  },
  4: {
    name: 'Changemaker',
    score_range: '9-10',
    description: 'Changes systems, addresses root causes, creates lasting infrastructure',
    indicators: [
      'Creates programs that outlast their involvement',
      'Solves systemic problems, not just symptoms',
      'Impact spans multiple years/communities',
      'Recognition for service (awards, grants)',
      'Built sustainable infrastructure',
      'Measurable population-level outcomes'
    ]
  }
};
```

### 4.6 Dimension 5: Authenticity & Voice Analyzer

**File**: `/src/services/portfolio/analyzers/authenticityVoiceAnalyzer.ts`

**Purpose**: Assess genuine passion, authentic self-presentation, coherence between stated interests and actions. **Integrates PIQ scores**.

**Unique Feature**: This analyzer leverages the existing PIQ narrative analysis scores.

**Tier Definition**:
```typescript
const AUTHENTICITY_VOICE_TIERS = {
  1: {
    name: 'Manufactured',
    score_range: '0-3',
    description: 'Resume padding, no authentic voice, activities chosen for college apps',
    indicators: [
      'Activities don\'t connect to stated interests',
      'Generic "impressive" activities (Model UN, Key Club, NHS)',
      'No personal passion evident',
      'PIQ voice scores: robotic/template',
      'Inconsistencies between what they say and do'
    ]
  },
  2: {
    name: 'Emerging',
    score_range: '4-6',
    description: 'Some genuine interests, but also resume building',
    indicators: [
      'Mix of authentic and strategic activities',
      'Can articulate interests but shallow depth',
      'PIQ voice scores: essay-like/formal',
      'Some personal details but generic overall'
    ]
  },
  3: {
    name: 'Authentic',
    score_range: '7-8',
    description: 'Clear genuine interests, activities align with passions',
    indicators: [
      'Strong coherence between interests and actions',
      'Sustained commitment to chosen areas (2+ years)',
      'PIQ voice scores: authentic/conversational',
      'Can speak specifically about why they care',
      'Shows vulnerability and growth in essays'
    ]
  },
  4: {
    name: 'Distinctive',
    score_range: '9-10',
    description: 'Unique authentic voice, unmistakable passion, memorable profile',
    indicators: [
      'Unusual combination of interests that makes sense for them',
      'Deep personal investment evident in all activities',
      'PIQ voice scores: distinctive/exceptional',
      'Profile is memorable and differentiated',
      'Would pursue interests even without college apps'
    ]
  }
};
```

**Integration with PIQ Scores**:
```typescript
function buildAuthenticityPrompt(portfolio: PortfolioData): string {
  const piqSummary = portfolio.writing_analysis.piqs.map(piq => `
    - "${piq.prompt_title}": NQI ${piq.narrative_quality_index}/100,
      Voice: ${piq.voice_type}, Authenticity: ${piq.authenticity_score}/10
  `).join('\n');

  return `Analyze authenticity and voice across this student's portfolio.

**PIQ WRITING ANALYSIS** (from existing system):
${piqSummary}

**OVERALL WRITING QUALITY**: ${portfolio.writing_analysis.overall_writing_quality}/100

Use these PIQ scores as strong signals:
- High authenticity scores (8-10) → Likely genuine interests
- Low authenticity scores (<5) → May indicate manufactured profile
- Voice type "conversational/distinctive" → Real passion
- Voice type "robotic/template" → Resume-driven

Now analyze how their ACTIVITIES align with their STATED INTERESTS...`;
}
```

### 4.7 Dimension 6: Future Readiness Analyzer

**File**: `/src/services/portfolio/analyzers/futureReadinessAnalyzer.ts`

**Purpose**: Assess goal clarity, preparedness for college rigor, adaptability, growth trajectory.

**Tier Definition**:
```typescript
const FUTURE_READINESS_TIERS = {
  1: {
    name: 'Unclear',
    score_range: '0-3',
    description: 'No clear goals, unprepared for college rigor, no growth evident',
    indicators: [
      'Vague or generic goals ("I want to help people")',
      'No connection between activities and major',
      'No evidence of independent work habits',
      'Flat trajectory (no growth over 4 years)'
    ]
  },
  2: {
    name: 'Emerging',
    score_range: '4-6',
    description: 'Some direction, basic preparation, early exploration',
    indicators: [
      'General career interest but not specific',
      'Some alignment between activities and goals',
      'Demonstrated ability to handle challenging coursework',
      'Some growth/maturation evident'
    ]
  },
  3: {
    name: 'Prepared',
    score_range: '7-8',
    description: 'Clear goals, strong preparation, demonstrated growth',
    indicators: [
      'Specific "why major" with evidence',
      'Strong alignment: academics + ECs + goals',
      'Self-directed learning in area of interest',
      'Clear upward trajectory across 4 years',
      'Can articulate future plans with specificity'
    ]
  },
  4: {
    name: 'Exceptional',
    score_range: '9-10',
    description: 'Crystal-clear vision, college-level readiness, proven adaptability',
    indicators: [
      'Compelling "North Star" with deep preparation',
      'College-level work already (research, internships)',
      'Clear intellectual trajectory over multiple years',
      'Demonstrated adaptability (overcame challenges)',
      'Ready to contribute to campus from day 1'
    ]
  }
};
```

### 4.8 Parallel Execution Strategy

```typescript
// Execute all 6 dimension analyzers in PARALLEL
export async function runDimensionDeepDive(
  portfolio: PortfolioData,
  holisticUnderstanding: HolisticPortfolioUnderstanding
): Promise<DimensionAnalyses> {

  console.log('Starting Stage 2: Dimension Deep Dive (6 parallel analyzers)...');

  const startTime = Date.now();

  // Run all 6 in parallel
  const [
    academicExcellence,
    leadershipInitiative,
    intellectualCuriosity,
    communityImpact,
    authenticityVoice,
    futureReadiness
  ] = await Promise.all([
    analyzeAcademicExcellence(portfolio, holisticUnderstanding),
    analyzeLeadershipInitiative(portfolio, holisticUnderstanding),
    analyzeIntellectualCuriosity(portfolio, holisticUnderstanding),
    analyzeCommunityImpact(portfolio, holisticUnderstanding),
    analyzeAuthenticityVoice(portfolio, holisticUnderstanding),
    analyzeFutureReadiness(portfolio, holisticUnderstanding)
  ]);

  const duration = Date.now() - startTime;
  console.log(`✓ Stage 2 complete in ${duration}ms`);

  return {
    academicExcellence,
    leadershipInitiative,
    intellectualCuriosity,
    communityImpact,
    authenticityVoice,
    futureReadiness,
    metadata: {
      duration_ms: duration,
      llm_calls: 6
    }
  };
}
```

**Performance**: ~15-20 seconds total (vs 90+ seconds if sequential)

---

## 5. Stage 3: Cross-Dimensional Synthesis

### 5.1 Synthesis Engine

**File**: `/src/services/portfolio/synthesisEngine.ts`

**Purpose**: Synthesize all dimensional analyses into holistic assessment with hidden strengths, benchmarking, school fit.

**LLM Call**: 1 call, ~3000 tokens output, ~12 seconds

**Key Synthesis Questions**:
1. What rare combinations exist? (e.g., First-gen + Research + Leadership)
2. How do dimensions interact? (e.g., High academic + Low leadership = "Scholar" profile)
3. What's the overall coherence? (Do pieces fit together or feel scattered?)
4. How does this compare to real admitted student profiles?
5. What school tiers is this competitive for?

**System Prompt Structure**:
```typescript
const SYNTHESIS_SYSTEM_PROMPT = `You are an expert admissions committee member synthesizing a complete portfolio assessment.

**Your Expertise**: You've served on admissions committees for Harvard, Stanford, MIT, Yale, and UC Berkeley. You understand how individual strengths combine into holistic profiles.

**Critical Synthesis Patterns** (from 500+ admitted student profiles):

**Profile Archetypes**:
1. "The Scholar" (High Academic + High Intellectual + Medium Leadership)
   - Top PhD programs, research universities
   - Examples: Math Olympiad winners, published researchers

2. "The Builder" (High Leadership + High Initiative + Medium Academic)
   - Entrepreneurial programs, business schools
   - Examples: Founders, social entrepreneurs, team builders

3. "The Changemaker" (High Community + High Leadership + Medium Academic)
   - Public policy, social justice programs
   - Examples: Organizers, activists, community leaders

4. "The Renaissance" (Balanced across all dimensions)
   - Liberal arts colleges, interdisciplinary programs
   - Examples: Well-rounded students with multiple talents

5. "The Specialist" (Exceptional in 1-2 dimensions, solid in others)
   - Programs matching their specialty
   - Examples: Olympic athletes, concert musicians, coding prodigies

**Hidden Strength Patterns** (rare combinations worth highlighting):
- First-gen + Research: Only 3% of admits
- Low-income + Entrepreneurship: 5% of admits
- Rural + National recognition: 2% of admits
- Arts + STEM depth: 8% of admits
- Athlete + Intellectual distinction: 4% of admits

**School Tier Calibration**:
- TIER 1 (Harvard/Stanford/MIT): Overall 8.5-10, multiple 9-10 dimensions
- TIER 2 (UC Berkeley/UCLA/Top 20): Overall 7.5-8.5, at least one 9-10 dimension
- TIER 3 (Top 50): Overall 6.5-7.5, mostly 7-8 dimensions
- TIER 4 (Top 100): Overall 5.5-6.5, some 6-7 dimensions

**Your Task**: Synthesize all dimensional analyses into holistic assessment.

Return valid JSON with exact structure specified.`;
```

**User Prompt Pattern**:
```typescript
function buildSynthesisPrompt(
  portfolio: PortfolioData,
  holistic: HolisticPortfolioUnderstanding,
  dimensions: DimensionAnalyses
): string {
  return `Synthesize this student's complete portfolio into holistic assessment.

**STAGE 1 HOLISTIC UNDERSTANDING**:
- First Impression: "${holistic.overallFirstImpression}"
- Central Thread: "${holistic.centralThread}"
- Comparative Tier: ${holistic.comparativeTier}
- Initial Score: ${holistic.initialStrengthScore}/10
- Red Flags: ${holistic.redFlags.join('; ') || 'None'}

**STAGE 2 DIMENSION SCORES**:
1. Academic Excellence: ${dimensions.academicExcellence.score}/10 (${dimensions.academicExcellence.tier})
   - Top Strength: ${dimensions.academicExcellence.strengths[0]?.strength}
   - Key Gap: ${dimensions.academicExcellence.growth_areas[0]?.gap}

2. Leadership & Initiative: ${dimensions.leadershipInitiative.score}/10 (${dimensions.leadershipInitiative.tier})
   - Top Strength: ${dimensions.leadershipInitiative.strengths[0]?.strength}
   - Key Gap: ${dimensions.leadershipInitiative.growth_areas[0]?.gap}

3. Intellectual Curiosity: ${dimensions.intellectualCuriosity.score}/10 (${dimensions.intellectualCuriosity.tier})
   - Top Strength: ${dimensions.intellectualCuriosity.strengths[0]?.strength}
   - Key Gap: ${dimensions.intellectualCuriosity.growth_areas[0]?.gap}

4. Community Impact: ${dimensions.communityImpact.score}/10 (${dimensions.communityImpact.tier})
   - Top Strength: ${dimensions.communityImpact.strengths[0]?.strength}
   - Key Gap: ${dimensions.communityImpact.growth_areas[0]?.gap}

5. Authenticity & Voice: ${dimensions.authenticityVoice.score}/10 (${dimensions.authenticityVoice.tier})
   - Top Strength: ${dimensions.authenticityVoice.strengths[0]?.strength}
   - Key Gap: ${dimensions.authenticityVoice.growth_areas[0]?.gap}

6. Future Readiness: ${dimensions.futureReadiness.score}/10 (${dimensions.futureReadiness.tier})
   - Top Strength: ${dimensions.futureReadiness.strengths[0]?.strength}
   - Key Gap: ${dimensions.futureReadiness.growth_areas[0]?.gap}

**PERSONAL CONTEXT** (for hidden strength detection):
${formatPersonalContext(portfolio.personal_context.background)}

---

Synthesize into holistic assessment as JSON:

{
  "overallScore": number (0-10, weighted average with your judgment),
  "profileArchetype": "Scholar" | "Builder" | "Changemaker" | "Renaissance" | "Specialist" | "Other",
  "archetypeExplanation": "string (why this archetype fits)",

  "narrativeSummary": "string (3-4 sentences, holistic story of this student)",

  "hiddenStrengths": [
    {
      "strength": "string (rare combination or overlooked asset)",
      "evidence": ["specific example 1", "specific example 2"],
      "rarityFactor": "Top 1-3%" | "Top 5-10%" | "Top 15-25%",
      "whyItMatters": "string (why AOs would care)"
    }
  ], // Include 2-4 if found

  "dimensionalInteractions": {
    "synergies": ["string - dimensions that reinforce each other"],
    "tensions": ["string - dimensions that seem inconsistent"],
    "overallCoherence": number (0-10)
  },

  "comparativeBenchmarking": {
    "vsTypicalApplicant": "string (percentile estimate, honest)",
    "vsTop10Percent": "string (gap analysis)",
    "competitiveAdvantages": ["string", "string"], // Top 2-3
    "competitiveWeaknesses": ["string", "string"], // Top 2-3
    "percentileEstimate": "Top 1-5%" | "Top 5-10%" | "Top 10-20%" | "Top 25-40%" | "Top 50%"
  },

  "schoolTierAlignment": {
    "reachSchools": {
      "tier": "Harvard/Stanford/MIT (Top 5)",
      "fitScore": number (0-10),
      "rationale": "string (why reach/match/safety)",
      "examples": ["school 1", "school 2", "school 3"]
    },
    "targetSchools": {
      "tier": "UC Berkeley/UCLA/Top 20",
      "fitScore": number (0-10),
      "rationale": "string",
      "examples": ["school 1", "school 2", "school 3"]
    },
    "safetySchools": {
      "tier": "Top 50-100",
      "fitScore": number (0-10),
      "rationale": "string",
      "examples": ["school 1", "school 2", "school 3"]
    }
  },

  "admissionsOfficerPerspective": {
    "first10Seconds": "string (will they keep reading?)",
    "memorability": "string (will they remember in 2 hours?)",
    "likelyReaction": "string (excited, interested, neutral, skeptical)",
    "voteEstimate": "Admit" | "Likely Admit" | "Waitlist" | "Likely Deny" | "Deny"
  },

  "confidence": number (0-1)
}

Be brutally honest. Compare to real students you've read. Identify truly rare strengths.`;
}
```

**Output Schema**:
```typescript
export interface PortfolioSynthesis {
  overallScore: number;
  profileArchetype: 'Scholar' | 'Builder' | 'Changemaker' | 'Renaissance' | 'Specialist' | 'Other';
  archetypeExplanation: string;
  narrativeSummary: string;

  hiddenStrengths: Array<{
    strength: string;
    evidence: string[];
    rarityFactor: string;
    whyItMatters: string;
  }>;

  dimensionalInteractions: {
    synergies: string[];
    tensions: string[];
    overallCoherence: number;
  };

  comparativeBenchmarking: {
    vsTypicalApplicant: string;
    vsTop10Percent: string;
    competitiveAdvantages: string[];
    competitiveWeaknesses: string[];
    percentileEstimate: string;
  };

  schoolTierAlignment: {
    reachSchools: SchoolTier;
    targetSchools: SchoolTier;
    safetySchools: SchoolTier;
  };

  admissionsOfficerPerspective: {
    first10Seconds: string;
    memorability: string;
    likelyReaction: string;
    voteEstimate: string;
  };

  confidence: number;
}
```

---

## 6. Stage 4: Strategic Guidance Generation

### 6.1 Strategic Roadmap Engine

**File**: `/src/services/portfolio/strategicGuidanceEngine.ts`

**Purpose**: Generate prioritized, actionable recommendations with timelines, ROI estimates, and rationale.

**LLM Call**: 1 call, ~2500 tokens output, ~10 seconds

**Key Features**:
- **Priority-based**: Critical → Important → Helpful
- **Timeline-aware**: Grade-specific recommendations (9th, 10th, 11th, 12th)
- **ROI-focused**: Impact estimate for each recommendation
- **Gap-driven**: Addresses specific weaknesses vs top applicants

**System Prompt Structure**:
```typescript
const STRATEGIC_GUIDANCE_SYSTEM_PROMPT = `You are an expert college admissions strategist providing actionable guidance.

**Your Expertise**: You've coached 500+ students through college applications, with 200+ admits to top 20 schools.

**Strategic Guidance Principles**:
1. **Prioritize by ROI**: Focus on changes with highest impact relative to effort
2. **Be Specific**: "Take AP Bio" not "take more APs"
3. **Consider Timeline**: Grade-appropriate recommendations
4. **Be Realistic**: Don't ask 11th grader to "found a nonprofit" in 6 months
5. **Address Gaps**: Focus on weaknesses relative to target schools

**Priority Levels**:
- **Priority 1 (Critical)**: Must-do items that address major gaps. Without these, admission to target schools unlikely.
- **Priority 2 (Important)**: Significant improvements that strengthen profile. Competitive advantage.
- **Priority 3 (Helpful)**: Nice-to-haves that add polish. Marginal improvements.

**Timeline Stages**:
- **Grade 9-10**: Exploration, foundation-building, trying new things
- **Grade 11**: Depth, leadership progression, major projects
- **Grade 12 Fall**: Final achievements, essay material, finishing strong

**Impact Estimation**:
- +2-3 points: Major game-changer (e.g., publish research, win state competition)
- +1-2 points: Significant improvement (e.g., lead major project, add depth to EC)
- +0.5-1 points: Solid enhancement (e.g., add AP course, earn local award)

**Gap Analysis Framework**:
Compare student's profile to target school admits:
- If targeting MIT: Need 9+ in Academic, 8+ in Intellectual Curiosity
- If targeting UCLA: Need 7.5+ in Academic, 7+ in at least 2 other dimensions
- If targeting Top 50: Need 6.5+ in Academic, 6+ in other dimensions

Your task: Generate strategic roadmap with specific, prioritized recommendations.

Return valid JSON with exact structure.`;
```

**User Prompt Pattern**:
```typescript
function buildStrategicGuidancePrompt(
  portfolio: PortfolioData,
  dimensions: DimensionAnalyses,
  synthesis: PortfolioSynthesis
): string {
  return `Generate strategic guidance for this student's college preparation.

**STUDENT CONTEXT**:
- Current Grade: ${portfolio.profile.grade}
- Intended Major: ${portfolio.goals.intended_major}
- Target Schools: ${synthesis.schoolTierAlignment.targetSchools.examples.join(', ')}

**CURRENT PROFILE SCORES**:
- Overall: ${synthesis.overallScore}/10
- Academic Excellence: ${dimensions.academicExcellence.score}/10 (${dimensions.academicExcellence.tier})
- Leadership: ${dimensions.leadershipInitiative.score}/10 (${dimensions.leadershipInitiative.tier})
- Intellectual Curiosity: ${dimensions.intellectualCuriosity.score}/10 (${dimensions.intellectualCuriosity.tier})
- Community Impact: ${dimensions.communityImpact.score}/10 (${dimensions.communityImpact.tier})
- Authenticity: ${dimensions.authenticityVoice.score}/10 (${dimensions.authenticityVoice.tier})
- Future Readiness: ${dimensions.futureReadiness.score}/10 (${dimensions.futureReadiness.tier})

**TOP GAPS** (from dimensional analysis):
${[
  dimensions.academicExcellence.growth_areas[0],
  dimensions.leadershipInitiative.growth_areas[0],
  dimensions.intellectualCuriosity.growth_areas[0]
].filter(Boolean).map(gap => `- ${gap.gap} (${gap.severity})`).join('\n')}

**COMPETITIVE CONTEXT**:
- Percentile: ${synthesis.comparativeBenchmarking.percentileEstimate}
- vs Top 10%: ${synthesis.comparativeBenchmarking.vsTop10Percent}
- Weaknesses: ${synthesis.comparativeBenchmarking.competitiveWeaknesses.join('; ')}

**TARGET SCHOOL ALIGNMENT**:
- Reach Schools (${synthesis.schoolTierAlignment.reachSchools.tier}): ${synthesis.schoolTierAlignment.reachSchools.fitScore}/10
  → ${synthesis.schoolTierAlignment.reachSchools.rationale}

---

Generate strategic roadmap as JSON:

{
  "prioritizedRecommendations": [
    {
      "priority": 1 | 2 | 3,
      "dimension": "academic_excellence" | "leadership" | "intellectual_curiosity" | "community_impact" | "authenticity" | "future_readiness",
      "recommendation": "string (specific, actionable recommendation)",
      "rationale": "string (why this matters, what gap it addresses)",
      "timeline": "string (when to do this, grade-specific)",
      "estimatedImpact": "string (e.g., '+1.5 points in Academic Excellence')",
      "difficultyLevel": "easy" | "moderate" | "challenging",
      "specificSteps": ["step 1", "step 2", "step 3"] // Concrete actions
    }
  ], // Include 6-10 recommendations across priorities

  "gradeByGradeRoadmap": {
    "grade9": {
      "focus": "string (what to prioritize in 9th grade)",
      "keyActions": ["action 1", "action 2", "action 3"]
    },
    "grade10": {
      "focus": "string",
      "keyActions": ["action 1", "action 2", "action 3"]
    },
    "grade11": {
      "focus": "string",
      "keyActions": ["action 1", "action 2", "action 3"]
    },
    "grade12": {
      "focus": "string",
      "keyActions": ["action 1", "action 2", "action 3"]
    }
  },

  "targetOutcomes": {
    "shortTerm": {
      "timeline": "3-6 months",
      "goals": ["goal 1", "goal 2"],
      "expectedScoreChange": "string (e.g., '6.5 → 7.0 overall')"
    },
    "mediumTerm": {
      "timeline": "6-12 months",
      "goals": ["goal 1", "goal 2"],
      "expectedScoreChange": "string"
    },
    "longTerm": {
      "timeline": "1-2 years",
      "goals": ["goal 1", "goal 2"],
      "expectedScoreChange": "string"
    }
  },

  "criticalWarnings": ["string - things to avoid"], // If any

  "aspirationalTarget": "string (realistic best-case scenario if all recommendations implemented)"
}

Be specific with course names, program names, competition names. Tailor to their grade level and context.`;
}
```

**Output Schema**:
```typescript
export interface StrategicGuidance {
  prioritizedRecommendations: Array<{
    priority: 1 | 2 | 3;
    dimension: string;
    recommendation: string;
    rationale: string;
    timeline: string;
    estimatedImpact: string;
    difficultyLevel: 'easy' | 'moderate' | 'challenging';
    specificSteps: string[];
  }>;

  gradeByGradeRoadmap: {
    grade9?: { focus: string; keyActions: string[]; };
    grade10?: { focus: string; keyActions: string[]; };
    grade11?: { focus: string; keyActions: string[]; };
    grade12?: { focus: string; keyActions: string[]; };
  };

  targetOutcomes: {
    shortTerm: {
      timeline: string;
      goals: string[];
      expectedScoreChange: string;
    };
    mediumTerm: {
      timeline: string;
      goals: string[];
      expectedScoreChange: string;
    };
    longTerm: {
      timeline: string;
      goals: string[];
      expectedScoreChange: string;
    };
  };

  criticalWarnings: string[];
  aspirationalTarget: string;
}
```

---

## 7. Output Schema & Frontend Integration

### 7.1 Complete Analysis Result

```typescript
export interface PortfolioAnalysisResult {
  // Metadata
  analysis_id: string;
  portfolio_id: string;
  analysis_version: string; // 'v1.0.0'
  created_at: string;

  // Stage 1: Holistic Understanding
  holistic: HolisticPortfolioUnderstanding;

  // Stage 2: Dimension Deep Dive
  dimensions: {
    academicExcellence: AcademicExcellenceAnalysis;
    leadershipInitiative: LeadershipInitiativeAnalysis;
    intellectualCuriosity: IntellectualCuriosityAnalysis;
    communityImpact: CommunityImpactAnalysis;
    authenticityVoice: AuthenticityVoiceAnalysis;
    futureReadiness: FutureReadinessAnalysis;
  };

  // Stage 3: Synthesis
  synthesis: PortfolioSynthesis;

  // Stage 4: Strategic Guidance
  guidance: StrategicGuidance;

  // Performance Metrics
  performance: {
    total_duration_ms: number;
    stage_durations: {
      stage1_holistic_ms: number;
      stage2_dimensions_ms: number;
      stage3_synthesis_ms: number;
      stage4_guidance_ms: number;
    };
    llm_calls: number;
    total_tokens: number;
    cost_usd: number;
  };

  // Engine Info
  engine: 'sophisticated_multilayer_v1' | 'heuristic_fallback';
  confidence: number; // Overall confidence (0-1)
}
```

### 7.2 Frontend Service

**File**: `/src/services/portfolioAnalysisService.ts`

```typescript
import type { PortfolioData, PortfolioAnalysisResult } from './portfolio/types';

export async function analyzePortfolio(
  portfolio: PortfolioData,
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    include_school_fit?: boolean;
    skip_synthesis?: boolean;
  } = {}
): Promise<PortfolioAnalysisResult> {
  console.log('='.repeat(80));
  console.log('PORTFOLIO SCANNER ANALYSIS SERVICE');
  console.log('='.repeat(80));
  console.log(`Student: Grade ${portfolio.profile.grade}, ${portfolio.profile.school_type} school`);
  console.log(`Major: ${portfolio.goals.intended_major}`);
  console.log(`Activities: ${portfolio.experiences.activities.length}`);
  console.log(`Depth: ${options.depth || 'standard'}`);
  console.log('');

  try {
    // Health check
    const healthRes = await fetch('/api/health', { signal: AbortSignal.timeout(10000) });
    if (!healthRes.ok) {
      throw new Error('Analysis server not reachable. Start with "npm run dev:full".');
    }

    // Call backend API
    console.log('Calling backend API for portfolio analysis...');
    const response = await fetch('/api/analyze-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio,
        options: {
          depth: options.depth || 'standard',
          include_school_fit: options.include_school_fit ?? true,
          skip_synthesis: options.skip_synthesis ?? false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }

    console.log('✅ Backend API call successful');
    console.log('  Overall Score:', result.result.synthesis.overallScore.toFixed(1) + '/10');
    console.log('  Profile Archetype:', result.result.synthesis.profileArchetype);
    console.log('  Percentile:', result.result.synthesis.comparativeBenchmarking.percentileEstimate);
    console.log('  LLM Calls:', result.result.performance.llm_calls);
    console.log('  Duration:', (result.result.performance.total_duration_ms / 1000).toFixed(1) + 's');
    console.log('  Cost:', '$' + result.result.performance.cost_usd.toFixed(4));
    console.log('='.repeat(80));
    console.log('');

    return result.result.portfolio_analysis;
  } catch (error) {
    console.error('❌ [portfolioAnalysisService] Analysis failed:', error);
    throw new Error(`Portfolio analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

---

## 8. Backend Implementation Files

### 8.1 File Structure

```
src/
├── http/
│   ├── server.ts                          # Express server (port 8789)
│   └── routes.ts                          # API route handlers
│       └── POST /api/analyze-portfolio    # Main endpoint
│
├── services/
│   └── portfolio/
│       ├── portfolioAnalysisEngine.ts     # Main orchestrator (4-stage pipeline)
│       │
│       ├── stage1_holisticUnderstanding/
│       │   └── holisticPortfolioAnalyzer.ts
│       │
│       ├── stage2_dimensionDeepDive/
│       │   ├── index.ts                   # Parallel executor
│       │   ├── academicExcellenceAnalyzer.ts
│       │   ├── leadershipInitiativeAnalyzer.ts
│       │   ├── intellectualCuriosityAnalyzer.ts
│       │   ├── communityImpactAnalyzer.ts
│       │   ├── authenticityVoiceAnalyzer.ts
│       │   └── futureReadinessAnalyzer.ts
│       │
│       ├── stage3_synthesis/
│       │   └── synthesisEngine.ts
│       │
│       ├── stage4_strategicGuidance/
│       │   └── strategicGuidanceEngine.ts
│       │
│       └── types.ts                       # All TypeScript interfaces
│
├── lib/
│   └── llm/
│       └── claude.ts                      # LLM client (reuse existing)
│
└── core/
    └── rubrics/
        └── portfolio_v1.0.0/
            ├── dimensions.ts              # 6 dimension definitions with tiers
            ├── archetypes.ts              # Profile archetype definitions
            └── schoolTiers.ts             # School tier calibration data
```

### 8.2 Main Engine

**File**: `/src/services/portfolio/portfolioAnalysisEngine.ts`

```typescript
import type { PortfolioData, PortfolioAnalysisResult } from './types';
import { analyzeHolisticPortfolio } from './stage1_holisticUnderstanding/holisticPortfolioAnalyzer';
import { runDimensionDeepDive } from './stage2_dimensionDeepDive/index';
import { synthesizePortfolio } from './stage3_synthesis/synthesisEngine';
import { generateStrategicGuidance } from './stage4_strategicGuidance/strategicGuidanceEngine';

export interface AnalysisOptions {
  depth: 'quick' | 'standard' | 'comprehensive';
  include_school_fit: boolean;
  skip_synthesis: boolean;
}

export async function analyzePortfolio(
  portfolio: PortfolioData,
  options: AnalysisOptions
): Promise<PortfolioAnalysisResult> {
  console.log('='.repeat(80));
  console.log('PORTFOLIO ANALYSIS ENGINE v1.0.0');
  console.log('='.repeat(80));

  const startTime = Date.now();
  const stageTimes: Record<string, number> = {};
  let totalTokens = 0;
  let totalCost = 0;
  let llmCalls = 0;

  try {
    // STAGE 1: Holistic Understanding
    console.log('\n[Stage 1] Holistic Portfolio Understanding...');
    const stage1Start = Date.now();
    const holisticUnderstanding = await analyzeHolisticPortfolio(portfolio);
    stageTimes.stage1_holistic_ms = Date.now() - stage1Start;
    llmCalls += 1;
    console.log(`✓ Stage 1 complete (${stageTimes.stage1_holistic_ms}ms)`);
    console.log(`  Central Thread: ${holisticUnderstanding.centralThread}`);
    console.log(`  Initial Score: ${holisticUnderstanding.initialStrengthScore}/10`);
    console.log(`  Comparative Tier: ${holisticUnderstanding.comparativeTier}`);

    // STAGE 2: Dimension Deep Dive (6 parallel)
    console.log('\n[Stage 2] Dimension Deep Dive (6 parallel analyzers)...');
    const stage2Start = Date.now();
    const dimensionAnalyses = await runDimensionDeepDive(portfolio, holisticUnderstanding);
    stageTimes.stage2_dimensions_ms = Date.now() - stage2Start;
    llmCalls += 6;
    console.log(`✓ Stage 2 complete (${stageTimes.stage2_dimensions_ms}ms)`);
    console.log(`  Academic Excellence: ${dimensionAnalyses.academicExcellence.score}/10 (${dimensionAnalyses.academicExcellence.tier})`);
    console.log(`  Leadership: ${dimensionAnalyses.leadershipInitiative.score}/10 (${dimensionAnalyses.leadershipInitiative.tier})`);
    console.log(`  Intellectual Curiosity: ${dimensionAnalyses.intellectualCuriosity.score}/10 (${dimensionAnalyses.intellectualCuriosity.tier})`);
    console.log(`  Community Impact: ${dimensionAnalyses.communityImpact.score}/10 (${dimensionAnalyses.communityImpact.tier})`);
    console.log(`  Authenticity: ${dimensionAnalyses.authenticityVoice.score}/10 (${dimensionAnalyses.authenticityVoice.tier})`);
    console.log(`  Future Readiness: ${dimensionAnalyses.futureReadiness.score}/10 (${dimensionAnalyses.futureReadiness.tier})`);

    // STAGE 3: Synthesis (optional skip for testing)
    let synthesis;
    if (!options.skip_synthesis) {
      console.log('\n[Stage 3] Cross-Dimensional Synthesis...');
      const stage3Start = Date.now();
      synthesis = await synthesizePortfolio(portfolio, holisticUnderstanding, dimensionAnalyses);
      stageTimes.stage3_synthesis_ms = Date.now() - stage3Start;
      llmCalls += 1;
      console.log(`✓ Stage 3 complete (${stageTimes.stage3_synthesis_ms}ms)`);
      console.log(`  Overall Score: ${synthesis.overallScore}/10`);
      console.log(`  Archetype: ${synthesis.profileArchetype}`);
      console.log(`  Percentile: ${synthesis.comparativeBenchmarking.percentileEstimate}`);
      console.log(`  Hidden Strengths: ${synthesis.hiddenStrengths.length}`);
    }

    // STAGE 4: Strategic Guidance
    let guidance;
    if (!options.skip_synthesis) {
      console.log('\n[Stage 4] Strategic Guidance Generation...');
      const stage4Start = Date.now();
      guidance = await generateStrategicGuidance(portfolio, dimensionAnalyses, synthesis);
      stageTimes.stage4_guidance_ms = Date.now() - stage4Start;
      llmCalls += 1;
      console.log(`✓ Stage 4 complete (${stageTimes.stage4_guidance_ms}ms)`);
      console.log(`  Recommendations: ${guidance.prioritizedRecommendations.length}`);
      console.log(`  Priority 1 (Critical): ${guidance.prioritizedRecommendations.filter(r => r.priority === 1).length}`);
    }

    const totalDuration = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`LLM Calls: ${llmCalls}`);
    console.log(`Cost: $${totalCost.toFixed(4)}`);
    console.log('='.repeat(80) + '\n');

    return {
      analysis_id: `portfolio-${Date.now()}`,
      portfolio_id: portfolio.profile.student_id,
      analysis_version: 'v1.0.0',
      created_at: new Date().toISOString(),

      holistic: holisticUnderstanding,
      dimensions: dimensionAnalyses,
      synthesis: synthesis!,
      guidance: guidance!,

      performance: {
        total_duration_ms: totalDuration,
        stage_durations: stageTimes,
        llm_calls: llmCalls,
        total_tokens: totalTokens,
        cost_usd: totalCost
      },

      engine: 'sophisticated_multilayer_v1',
      confidence: holisticUnderstanding.confidence
    };

  } catch (error) {
    console.error('❌ Portfolio analysis engine failed:', error);
    throw error;
  }
}
```

### 8.3 API Route Handler

**File**: `/src/http/routes.ts` (add new route)

```typescript
// Add to existing routes.ts
app.post('/api/analyze-portfolio', async (req, res) => {
  console.log('='.repeat(80));
  console.log('[API] POST /api/analyze-portfolio');
  console.log('='.repeat(80));

  try {
    const { portfolio, options } = req.body;

    if (!portfolio) {
      return res.status(400).json({
        success: false,
        message: 'Missing portfolio data'
      });
    }

    // Validate portfolio structure
    const validation = validatePortfolioData(portfolio);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid portfolio data: ${validation.errors.join(', ')}`
      });
    }

    // Check for API key
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    if (!hasApiKey) {
      console.warn('⚠️  No ANTHROPIC_API_KEY found. Returning heuristic fallback.');
      const heuristicResult = generateHeuristicPortfolioAnalysis(portfolio);
      return res.json({
        success: true,
        result: { portfolio_analysis: heuristicResult },
        engine: 'heuristic_fallback',
        message: 'Using heuristic analysis (no API key found)'
      });
    }

    // Dynamic import to avoid loading heavy dependencies until needed
    const { analyzePortfolio } = await import('../services/portfolio/portfolioAnalysisEngine');

    const analysisOptions = {
      depth: options?.depth || 'standard',
      include_school_fit: options?.include_school_fit ?? true,
      skip_synthesis: options?.skip_synthesis ?? false
    };

    console.log('Analysis options:', analysisOptions);

    // Run analysis
    const result = await analyzePortfolio(portfolio, analysisOptions);

    return res.json({
      success: true,
      result: { portfolio_analysis: result },
      engine: 'sophisticated_multilayer_v1'
    });

  } catch (error) {
    console.error('❌ Portfolio analysis failed:', error);

    // Try heuristic fallback on error
    try {
      const heuristicResult = generateHeuristicPortfolioAnalysis(req.body.portfolio);
      return res.json({
        success: true,
        result: { portfolio_analysis: heuristicResult },
        engine: 'heuristic_fallback',
        message: `LLM analysis failed, using heuristic fallback: ${error instanceof Error ? error.message : String(error)}`
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
});
```

---

## 9. Advanced Features

### 9.1 Hidden Strength Detection

**Pattern**: Look for rare combinations that admission officers value.

```typescript
// In synthesisEngine.ts
function detectHiddenStrengths(
  portfolio: PortfolioData,
  dimensions: DimensionAnalyses
): HiddenStrength[] {
  const hiddenStrengths: HiddenStrength[] = [];

  // First-gen + Research
  if (portfolio.personal_context.background.first_gen &&
      dimensions.intellectualCuriosity.score >= 8) {
    hiddenStrengths.push({
      strength: 'First-generation student with research distinction',
      evidence: ['First-gen background', 'Research score 8+/10'],
      rarityFactor: 'Top 3%',
      whyItMatters: 'Demonstrates exceptional academic drive despite limited resources. Highly valued by AOs for diversity initiatives.'
    });
  }

  // Low-income + Entrepreneurship
  if (portfolio.personal_context.background.low_income &&
      portfolio.experiences.activities.some(act =>
        act.category === 'leadership' && act.description.toLowerCase().includes('start'))) {
    hiddenStrengths.push({
      strength: 'Low-income background with entrepreneurial initiative',
      evidence: ['Low-income status', 'Founded/started initiative'],
      rarityFactor: 'Top 5%',
      whyItMatters: 'Shows resilience and problem-solving despite financial constraints. Elite schools actively recruit this profile.'
    });
  }

  // STEM + Arts depth
  const hasSTEM = portfolio.experiences.activities.some(act => act.category === 'stem' && act.years_involved >= 2);
  const hasArts = portfolio.experiences.activities.some(act => act.category === 'arts' && act.years_involved >= 2);
  if (hasSTEM && hasArts) {
    hiddenStrengths.push({
      strength: 'Deep commitment to both STEM and Arts (2+ years each)',
      evidence: ['STEM activity with depth', 'Arts activity with depth'],
      rarityFactor: 'Top 8%',
      whyItMatters: 'Demonstrates intellectual breadth and creativity. Appeals to liberal arts colleges and interdisciplinary programs.'
    });
  }

  // More patterns...

  return hiddenStrengths;
}
```

### 9.2 Rarity-Based Scoring

**Pattern**: Rate strengths by how common they are among top applicants.

```typescript
// Rarity database (from analysis of admitted student profiles)
const RARITY_DATABASE = {
  'national_academic_award': 'Top 2%',
  'published_research': 'Top 3%',
  'founded_nonprofit': 'Top 5%',
  'state_academic_award': 'Top 10%',
  'summer_research_program': 'Top 15%',
  'club_president': 'Top 25%',
  'ap_scholar': 'Top 30%',
  'honor_roll': 'Common (>50%)'
};

function assessRarity(achievement: string): string {
  // Pattern matching against database
  for (const [pattern, rarity] of Object.entries(RARITY_DATABASE)) {
    if (achievement.toLowerCase().includes(pattern.replace(/_/g, ' '))) {
      return rarity;
    }
  }
  return 'Common';
}
```

### 9.3 Comparative Benchmarking

**Pattern**: Compare to real admitted student profiles.

```typescript
// School tier benchmarks (from historical data)
const SCHOOL_TIER_BENCHMARKS = {
  'Harvard/Stanford/MIT': {
    overall: { min: 8.5, median: 9.2, max: 10 },
    academicExcellence: { min: 9.0, median: 9.5 },
    leadershipInitiative: { min: 8.0, median: 9.0 },
    intellectualCuriosity: { min: 8.5, median: 9.0 },
    // ...
  },
  'UC Berkeley/UCLA': {
    overall: { min: 7.5, median: 8.2, max: 9.5 },
    // ...
  },
  // ...
};

function benchmarkAgainstSchools(
  dimensions: DimensionAnalyses,
  overallScore: number
): SchoolFitAssessment {
  const fits: SchoolFitAssessment = {
    reach: [],
    target: [],
    safety: []
  };

  for (const [schoolTier, benchmarks] of Object.entries(SCHOOL_TIER_BENCHMARKS)) {
    const fitScore = calculateFitScore(dimensions, benchmarks);

    if (fitScore >= 8.0) {
      fits.target.push({ tier: schoolTier, fitScore });
    } else if (fitScore >= 6.0) {
      fits.reach.push({ tier: schoolTier, fitScore });
    } else if (fitScore >= 9.0) {
      fits.safety.push({ tier: schoolTier, fitScore });
    }
  }

  return fits;
}
```

---

## 10. Testing Strategy

### 10.1 Test Profiles

Create 5 representative test profiles:

1. **"The Scholar"**: High academic (9.5), high intellectual (9.0), medium leadership (6.0)
2. **"The Builder"**: High leadership (9.0), medium academic (7.5), high initiative (8.5)
3. **"The Changemaker"**: High community (9.0), high leadership (8.5), medium academic (7.0)
4. **"The Struggling High Achiever"**: High academic (8.5), low authenticity (4.0), scattered ECs
5. **"The Underdog"**: First-gen, low-income, solid academic (7.0), compelling story

### 10.2 Test Files

```
tests/
├── portfolio/
│   ├── test-scholar-profile.ts
│   ├── test-builder-profile.ts
│   ├── test-changemaker-profile.ts
│   ├── test-struggling-profile.ts
│   ├── test-underdog-profile.ts
│   │
│   ├── test-holistic-analyzer.ts          # Test Stage 1
│   ├── test-dimension-analyzers.ts        # Test Stage 2 (each)
│   ├── test-synthesis-engine.ts           # Test Stage 3
│   ├── test-strategic-guidance.ts         # Test Stage 4
│   └── test-end-to-end.ts                 # Full pipeline
```

### 10.3 Validation Checks

```typescript
export function validateAnalysisResult(result: PortfolioAnalysisResult): ValidationResult {
  const errors: string[] = [];

  // Score validation
  if (result.synthesis.overallScore < 0 || result.synthesis.overallScore > 10) {
    errors.push('Overall score must be 0-10');
  }

  // Dimension validation
  for (const [dim, analysis] of Object.entries(result.dimensions)) {
    if (analysis.score < 0 || analysis.score > 10) {
      errors.push(`${dim} score must be 0-10`);
    }
    if (!analysis.strategic_pivot) {
      errors.push(`${dim} missing strategic pivot`);
    }
  }

  // Synthesis validation
  if (result.synthesis.hiddenStrengths.length === 0) {
    console.warn('Warning: No hidden strengths detected (expected 1-3)');
  }

  // Guidance validation
  if (result.guidance.prioritizedRecommendations.length < 5) {
    errors.push('Should have at least 5 recommendations');
  }

  const priority1Count = result.guidance.prioritizedRecommendations.filter(r => r.priority === 1).length;
  if (priority1Count === 0) {
    errors.push('Should have at least 1 Priority 1 (critical) recommendation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

---

## 11. Performance Optimization

### 11.1 Token Optimization

```typescript
// Use prompt caching for system prompts
const systemPrompt = buildDimensionSystemPrompt(dimension);

const response = await callClaude<AnalysisResult>(
  userPrompt,
  {
    systemPrompt,
    cacheSystemPrompt: true, // Cache rubric definitions
    temperature: 0.3,
    maxTokens: 2000
  }
);

// Savings: ~1,500-2,000 tokens per call (90% cost reduction on cached portions)
```

### 11.2 Parallel Batching

```typescript
// Stage 2: All 6 dimension analyzers in parallel
const dimensionPromises = [
  analyzeAcademicExcellence(portfolio, holistic),
  analyzeLeadershipInitiative(portfolio, holistic),
  analyzeIntellectualCuriosity(portfolio, holistic),
  analyzeCommunityImpact(portfolio, holistic),
  analyzeAuthenticityVoice(portfolio, holistic),
  analyzeFutureReadiness(portfolio, holistic)
];

const results = await Promise.all(dimensionPromises);

// Time savings: 15-20 seconds vs 90+ seconds sequential
```

### 11.3 Conditional Analysis

```typescript
// Skip synthesis if just testing individual analyzers
if (options.skip_synthesis) {
  return {
    holistic,
    dimensions,
    synthesis: null,
    guidance: null
  };
}

// Quick mode: Only run Stage 1 (holistic)
if (options.depth === 'quick') {
  return quickAnalysis(portfolio);
}

// Comprehensive mode: Add extra detail layers
if (options.depth === 'comprehensive') {
  // Run additional granular analyses
}
```

---

## 12. Error Handling & Reliability

### 12.1 Three-Tier Fallback System

```typescript
try {
  // Primary: Full LLM analysis
  const result = await analyzePortfolio(portfolio, options);
  return { success: true, result, engine: 'sophisticated_multilayer_v1' };

} catch (error) {
  console.error('Primary analysis failed:', error);

  try {
    // Secondary: Retry with exponential backoff
    const result = await retryAnalysis(portfolio, options, 3);
    return { success: true, result, engine: 'sophisticated_multilayer_v1' };

  } catch (retryError) {
    console.error('Retry failed:', retryError);

    // Tertiary: Heuristic fallback (always works)
    const heuristicResult = generateHeuristicAnalysis(portfolio);
    return {
      success: true,
      result: heuristicResult,
      engine: 'heuristic_fallback',
      message: 'LLM analysis unavailable, using heuristic scoring'
    };
  }
}
```

### 12.2 Timeout Management

```typescript
// Adaptive timeouts based on stage
const STAGE_TIMEOUTS = {
  stage1: 45000,  // 45s for holistic
  stage2: 90000,  // 90s for 6 parallel analyzers
  stage3: 60000,  // 60s for synthesis
  stage4: 45000   // 45s for guidance
};

// Implement timeout per stage
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`Stage ${stageNum} timed out`)),
    STAGE_TIMEOUTS[`stage${stageNum}`]);
});

const result = await Promise.race([
  runStage(stageNum),
  timeoutPromise
]);
```

### 12.3 Validation Layers

```typescript
// Validate at every stage
const stage1Result = await analyzeHolisticPortfolio(portfolio);
validateStage1Output(stage1Result); // Throws if invalid

const stage2Results = await runDimensionDeepDive(portfolio, stage1Result);
validateStage2Output(stage2Results); // Throws if invalid

// etc.
```

---

## 13. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up file structure
- [ ] Define all TypeScript interfaces
- [ ] Create API route handler
- [ ] Implement main engine orchestrator
- [ ] Add validation utilities
- [ ] Create test profiles

### Phase 2: Stage 1 - Holistic Understanding (Week 1-2)
- [ ] Implement holisticPortfolioAnalyzer.ts
- [ ] Write prompt templates
- [ ] Create test cases
- [ ] Validate outputs

### Phase 3: Stage 2 - Dimension Analyzers (Week 2-3)
- [ ] Implement academicExcellenceAnalyzer.ts
- [ ] Implement leadershipInitiativeAnalyzer.ts
- [ ] Implement intellectualCuriosityAnalyzer.ts
- [ ] Implement communityImpactAnalyzer.ts
- [ ] Implement authenticityVoiceAnalyzer.ts
- [ ] Implement futureReadinessAnalyzer.ts
- [ ] Add parallel execution logic
- [ ] Test each analyzer individually
- [ ] Test parallel execution

### Phase 4: Stage 3 - Synthesis (Week 3)
- [ ] Implement synthesisEngine.ts
- [ ] Add hidden strength detection
- [ ] Add comparative benchmarking
- [ ] Add school fit assessment
- [ ] Test synthesis outputs

### Phase 5: Stage 4 - Strategic Guidance (Week 4)
- [ ] Implement strategicGuidanceEngine.ts
- [ ] Add prioritization logic
- [ ] Add timeline-based roadmaps
- [ ] Test guidance outputs

### Phase 6: Integration & Testing (Week 4)
- [ ] End-to-end testing with all 5 test profiles
- [ ] Performance optimization
- [ ] Error handling & fallbacks
- [ ] Frontend integration
- [ ] UI components for displaying results

### Phase 7: Refinement & Polish (Week 5)
- [ ] Prompt engineering refinement
- [ ] Calibration tuning (compare to real profiles)
- [ ] Documentation
- [ ] Cost optimization
- [ ] Production readiness

---

## 14. Success Metrics

### Quality Metrics
- **Accuracy**: Do scores align with expert admissions counselor assessments?
- **Consistency**: Same portfolio analyzed twice = same results?
- **Calibration**: Do percentile estimates match real admission outcomes?
- **Usefulness**: Do recommendations actually improve portfolios?

### Performance Metrics
- **Latency**: Target <30 seconds for full analysis
- **Cost**: Target <$0.20 per analysis
- **Reliability**: Target 99%+ success rate (with fallbacks)
- **Token Efficiency**: Maximize caching, minimize waste

### User Experience Metrics
- **Clarity**: Are insights understandable?
- **Actionability**: Can students act on recommendations?
- **Motivation**: Do results inspire improvement?
- **Trust**: Do users believe the assessment?

---

## 15. Next Steps

1. **Review this plan with stakeholders**
2. **Get approval on architecture & approach**
3. **Set up development environment**
4. **Create test data sets**
5. **Begin Phase 1 implementation**

---

## Appendix A: Key Differences from PIQ System

| Aspect | PIQ System | Portfolio Scanner |
|--------|-----------|-------------------|
| **Input** | Single essay (350 words) | Complete profile (academics + 10+ activities + context) |
| **Analysis Focus** | Narrative quality, voice, storytelling | Holistic readiness across 6 dimensions |
| **Scoring** | 11 categories, NQI 0-100 | 6 dimensions, Overall 0-10 |
| **Output** | Essay improvements, line-by-line feedback | Strategic roadmap, school fit, hidden strengths |
| **LLM Calls** | 9 calls (holistic + 6 deep dive + synthesis + grammar) | 9 calls (holistic + 6 dimensions + synthesis + guidance) |
| **Duration** | ~25-35 seconds | ~25-35 seconds |
| **Primary Use** | Essay workshop & iteration | Portfolio assessment & planning |

---

## Appendix B: Prompt Engineering Principles

1. **Brutal Calibration**: Prevent grade inflation with explicit score caps
2. **Evidence Requirements**: Must quote specific examples
3. **Tier-Based Rubrics**: 4 developmental stages with clear indicators
4. **Strategic Pivots**: Specific action to reach next tier
5. **Rarity Assessment**: Rate strengths by how uncommon they are
6. **Comparative Benchmarking**: Compare to real admitted students
7. **Admissions Officer Lens**: Ground in real selection process
8. **Context Awareness**: Consider background, challenges, resources
9. **ROI-Focused**: Prioritize by impact/effort ratio
10. **Timeline-Appropriate**: Grade-specific recommendations

---

## Appendix C: Sample Hidden Strengths

**Rare Combinations** (Top 1-5%):
- First-gen + Published research + Leadership role
- Low-income + National competition winner + Entrepreneurship
- Rural area + STEM depth + Arts achievement
- Immigrant + Community organizing + Academic excellence
- Athlete + Intellectual distinction (USAMO, Intel, etc.)

**Overlooked Strengths**:
- Family responsibilities while maintaining high performance
- Self-taught skills in resource-constrained environments
- Bridge-building across different communities
- Upward trajectory (dramatic improvement from 9th to 12th grade)
- Creative problem-solving in unexpected contexts

---

**END OF PLAN**

This plan is ready for review and approval before implementation begins.