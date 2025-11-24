# UPLIFT PORTFOLIO MCP SERVER
## Complete Student Context & Essay Intelligence System

**Status**: Ready to Build
**Purpose**: Provide PIQ analyzer (and all Uplift services) with deep, contextual awareness of student's complete portfolio
**Integration**: Supabase database + All essay types + Portfolio analytics

---

## ARCHITECTURE OVERVIEW

### What This MCP Server Provides

**1. Complete Student Profile**
- Demographics, background, context
- Goals, aspirations, intended major
- Financial constraints, special circumstances
- Family responsibilities, challenging circumstances

**2. Academic & Extracurricular Data**
- GPA, test scores, course rigor
- All extracurricular activities with leadership roles
- Work experience, volunteer service
- Personal projects, honors, recognition

**3. All Essay Content + Analysis**
- Personal statement (Common App)
- UC PIQs (all 8, student chooses 4)
- Supplemental essays (Why Us, etc.)
- Previous analysis scores + dimension breakdowns
- Revision history

**4. Portfolio Intelligence**
- Cross-essay repetition detection
- Dimension coverage analysis (which strengths are shown where)
- Narrative consistency validation
- Strategic gaps identification

**5. Context-Aware Validation**
- Check if PIQ claims match activity list
- Validate leadership assertions against roles
- Detect inconsistencies across essays
- Suggest better stories from their experiences

---

## DATABASE SCHEMA MAPPING

### Core Tables (Profile & Context)

**`profiles`** - Central hub
```typescript
{
  id: uuid,
  user_id: uuid,
  user_context: 'high_school_student' | 'transfer' | 'gap_year',
  status: 'initial' | 'onboarding' | 'active',
  goals: {
    primaryGoal: 'top_tier' | 'state_flagship' | 'exploring_options',
    desiredOutcomes: string[],
    timelineUrgency: 'early_decision' | 'regular' | 'flexible'
  },
  constraints: {
    needsFinancialAid: boolean,
    geographicPreferences: string[]
  },
  demographics: jsonb,
  extracted_skills: jsonb,
  hidden_strengths: string[],
  narrative_summary: text,
  completion_score: number (0-1)
}
```

**`personal_information`**
```typescript
{
  first_name, last_name, preferred_name,
  date_of_birth, pronouns, gender_identity,
  permanent_address, place_of_birth,
  hispanic_latino, race_ethnicity,
  citizenship_status, primary_language,
  years_in_us, first_gen,
  living_situation, household_income,
  parent_guardians: jsonb,
  siblings: jsonb
}
```

**`family_responsibilities`**
```typescript
{
  responsibilities: ['childcare', 'eldercare', 'household_chores', ...],
  circumstances: ['single_parent', 'low_income', 'disability', ...],
  hours_per_week: number (0-168),
  challenging_circumstances: boolean,
  other_circumstances: text
}
```

### Academic Data

**`academic_journey`**
```typescript
{
  current_school: jsonb,
  current_grade: '9th' | '10th' | '11th' | '12th',
  expected_grad_date: date,
  gpa: number,
  gpa_scale: '4.0' | '5.0' | '100',
  class_rank: string,
  class_size: number,
  course_history: jsonb[],           // All courses with grades
  college_courses: jsonb[],          // Dual enrollment
  standardized_tests: {
    sat: { total, reading, math, essay },
    act: { composite, english, math, reading, science },
    ...
  },
  ap_exams: jsonb[],
  ib_exams: jsonb[],
  took_math_early: boolean,
  took_language_early: boolean,
  homeschooled: boolean,
  studied_abroad: boolean
}
```

### Activities & Experience

**`experiences_activities`**
```typescript
{
  extracurriculars: Array<{
    name: string,
    role: string,
    leadership_role: boolean,
    hours_per_week: number,
    weeks_per_year: number,
    grade_levels: string[],
    description: string,
    impact: string
  }>,
  work_experiences: Array<{...}>,
  volunteer_service: Array<{...}>,
  personal_projects: Array<{...}>,
  academic_honors: Array<{...}>,
  formal_recognition: Array<{...}>,
  leadership_roles: Array<{...}>
}
```

### Goals & Aspirations

**`goals_aspirations`**
```typescript
{
  intended_major: string,
  career_interests: string[],
  highest_degree: 'bachelors' | 'masters' | 'phd' | 'md' | 'jd',
  college_environment: ['urban', 'rural', 'small', 'large', ...],
  applying_to_uc: 'yes' | 'no' | 'maybe',
  using_common_app: 'yes' | 'no' | 'maybe',
  start_date: 'fall_2025' | 'spring_2026' | ...,
  geographic_preferences: string[],
  need_based_aid: 'yes' | 'no' | 'unsure',
  merit_scholarships: 'yes' | 'no' | 'unsure'
}
```

### Personal Growth & Experiences

**`personal_growth`**
```typescript
{
  meaningful_experiences: {
    challenges_overcome: string,
    proudest_moments: string,
    formative_relationships: string,
    identity_development: string,
    values_beliefs: string
  },
  additional_context: {
    unique_circumstances: string,
    additional_info: string
  }
}
```

### Essay System

**`essays`** (from essay system types)
```typescript
{
  id: uuid,
  user_id: uuid,
  profile_id: uuid,
  essay_type: 'personal_statement' | 'uc_piq' | 'why_us' | 'challenge_adversity' | ...,
  prompt_text: string,
  max_words: number,
  target_school: string?,
  draft_original: string,
  draft_current: string?,
  version: number,
  context_constraints: string?,
  intended_major: string?,
  submitted_at: timestamp?,
  locked: boolean
}
```

**`analysis_reports`**
```typescript
{
  id: uuid,
  essay_id: uuid,
  essay_quality_index: number (0-100),
  impression_label: 'arresting_deeply_human' | 'compelling_clear_voice' | ...,
  dimension_scores: Array<{
    name: RubricDimensionName,
    score_0_to_10: number,
    evidence_quotes: string[],
    evaluator_notes: string
  }>,
  weights: Record<string, number>,
  flags: string[],
  prioritized_levers: string[],
  elite_pattern_profile: ElitePatternProfile?
}
```

**`portfolio_analytics`**
```typescript
{
  profile_id: uuid,
  overall: number,                    // Overall portfolio score
  dimensions: jsonb,                  // Dimension scores across all essays
  detailed: jsonb                     // Detailed analytics
}
```

---

## MCP SERVER TOOLS

### Profile & Context Tools

#### 1. `get_student_profile`
**Purpose**: Get complete student context for analysis
**Input**: `{ user_id: string }`
**Output**:
```typescript
{
  profile: Profile,
  personal_info: PersonalInformation,
  academic: AcademicJourney,
  goals: GoalsAspirations,
  family: FamilyResponsibilities,
  personal_growth: PersonalGrowth
}
```

#### 2. `get_extracurriculars`
**Purpose**: Get all activities for claim validation
**Input**: `{ user_id: string, include_leadership_only?: boolean }`
**Output**:
```typescript
{
  extracurriculars: Activity[],
  work_experiences: WorkExperience[],
  volunteer_service: Volunteer[],
  personal_projects: Project[],
  leadership_roles: LeadershipRole[]
}
```

#### 3. `get_academic_context`
**Purpose**: Validate academic claims in essays
**Input**: `{ user_id: string }`
**Output**:
```typescript
{
  gpa: number,
  class_rank: string,
  course_rigor: 'high' | 'medium' | 'low',
  ap_ib_courses: Course[],
  honors_awards: Honor[],
  test_scores: TestScores
}
```

#### 4. `get_context_circumstances`
**Purpose**: Understand student's challenges for Context dimension
**Input**: `{ user_id: string }`
**Output**:
```typescript
{
  family_responsibilities: {
    types: string[],
    hours_per_week: number,
    circumstances: string[]
  },
  challenging_circumstances: boolean,
  first_generation: boolean,
  financial_need: boolean,
  other_context: string
}
```

### Essay & Portfolio Tools

#### 5. `get_all_essays`
**Purpose**: Get all essay content for repetition detection
**Input**: `{ user_id: string, include_analysis?: boolean }`
**Output**:
```typescript
{
  personal_statement: Essay & Analysis?,
  uc_piqs: Array<{
    prompt_number: number,
    prompt_text: string,
    essay: Essay,
    analysis: AnalysisReport?
  }>,
  supplementals: Array<Essay & Analysis?>,
  revision_history: RevisionHistory[]
}
```

#### 6. `check_repetition`
**Purpose**: Detect if current essay repeats content from other essays
**Input**: `{ current_essay_text: string, user_id: string }`
**Output**:
```typescript
{
  has_repetition: boolean,
  repetition_details: Array<{
    other_essay_type: string,
    similarity_score: number (0-1),
    overlapping_content: string[],
    severity: 'critical' | 'major' | 'minor'
  }>,
  suggestions: string[]
}
```

#### 7. `get_portfolio_analytics`
**Purpose**: Get dimension coverage across all essays
**Input**: `{ user_id: string }`
**Output**:
```typescript
{
  dimension_coverage: Record<PIQRubricDimension, {
    essays_showing_it: string[],
    average_score: number,
    strength_level: 'strong' | 'moderate' | 'weak' | 'absent'
  }>,
  strategic_gaps: string[],          // Which dimensions need coverage
  over_emphasized: string[],         // Which dimensions are repeated too much
  balance_score: number (0-100)
}
```

#### 8. `validate_claim`
**Purpose**: Check if essay claim is backed by student data
**Input**: `{ claim: string, claim_type: 'leadership' | 'activity' | 'achievement' | 'academic', user_id: string }`
**Output**:
```typescript
{
  is_valid: boolean,
  evidence_found: string[],          // Matching activities/achievements
  confidence: number (0-1),
  suggestion: string
}
```

#### 9. `suggest_piq_prompts`
**Purpose**: Recommend which PIQ prompts align with student's story
**Input**: `{ user_id: string, already_written?: number[] }`
**Output**:
```typescript
{
  recommendations: Array<{
    prompt_number: number,
    prompt_text: string,
    fit_score: number (0-100),
    rationale: string,
    story_suggestions: string[],     // Which activities/experiences to feature
    dimension_alignment: PIQRubricDimension[]
  }>,
  avoid: Array<{
    prompt_number: number,
    reason: string
  }>
}
```

#### 10. `analyze_portfolio_balance`
**Purpose**: See if 4 chosen PIQs show well-rounded applicant
**Input**: `{ user_id: string, piq_numbers: number[] }`
**Output**:
```typescript
{
  balance_score: number (0-100),
  dimensions_covered: PIQRubricDimension[],
  dimensions_missing: PIQRubricDimension[],
  prompt_synergy: 'excellent' | 'good' | 'needs_work',
  strategic_advice: string[],
  alternative_combinations: Array<{
    piq_numbers: number[],
    balance_score: number,
    rationale: string
  }>
}
```

#### 11. `get_better_stories`
**Purpose**: Suggest alternative stories from student's experiences
**Input**: `{ current_essay_text: string, piq_prompt_number: number, user_id: string }`
**Output**:
```typescript
{
  alternative_stories: Array<{
    activity_name: string,
    activity_type: string,
    why_better: string,
    dimension_strengths: PIQRubricDimension[],
    estimated_score_improvement: number
  }>,
  current_story_issues: string[]
}
```

#### 12. `check_narrative_consistency`
**Purpose**: Ensure no contradictions across essays
**Input**: `{ user_id: string }`
**Output**:
```typescript
{
  is_consistent: boolean,
  conflicts: Array<{
    conflict_type: 'date_mismatch' | 'role_contradiction' | 'achievement_inconsistency',
    essays_involved: string[],
    description: string,
    severity: 'critical' | 'major' | 'minor'
  }>,
  fact_graph: FactGraph
}
```

---

## MCP SERVER RESOURCES

Resources provide **real-time access** to student data as it changes.

#### Resource 1: `student://profile/{user_id}`
**Description**: Live student profile data
**MIME Type**: `application/json`
**Contents**: Complete profile + personal info + goals

#### Resource 2: `student://activities/{user_id}`
**Description**: Live extracurriculars & experiences
**MIME Type**: `application/json`
**Contents**: All activities, leadership roles, work, volunteer

#### Resource 3: `student://essays/{user_id}`
**Description**: All essays with latest analysis
**MIME Type**: `application/json`
**Contents**: All essays + analysis reports + coaching plans

#### Resource 4: `student://analytics/{user_id}`
**Description**: Portfolio-level analytics
**MIME Type**: `application/json`
**Contents**: Dimension coverage, balance, gaps, repetition

---

## IMPLEMENTATION PLAN

### Step 1: Create MCP Server Package (30 min)
```
mcp-uplift-portfolio/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                      # MCP server entry point
│   ├── server.ts                     # Server implementation
│   ├── database/
│   │   ├── supabaseClient.ts         # Supabase connection
│   │   └── types.ts                  # Database types
│   ├── tools/
│   │   ├── profile.ts                # Profile tools (get_student_profile, etc.)
│   │   ├── activities.ts             # Activity tools (get_extracurriculars, etc.)
│   │   ├── essays.ts                 # Essay tools (get_all_essays, check_repetition, etc.)
│   │   ├── validation.ts             # Validation tools (validate_claim)
│   │   ├── strategy.ts               # Strategy tools (suggest_piq_prompts, etc.)
│   │   └── analytics.ts              # Analytics tools (get_portfolio_analytics, etc.)
│   ├── resources/
│   │   ├── profile.ts                # Profile resource
│   │   ├── activities.ts             # Activities resource
│   │   ├── essays.ts                 # Essays resource
│   │   └── analytics.ts              # Analytics resource
│   └── utils/
│       ├── repetitionDetector.ts     # Text similarity analysis
│       ├── claimValidator.ts         # Validate claims against data
│       └── strategicAnalyzer.ts      # Portfolio balance & strategy
└── .env.example
```

### Step 2: Build Supabase Integration (30 min)
- Create type-safe Supabase client
- Map all database tables to TypeScript types
- Create query helpers for complex joins

### Step 3: Implement Tools (60 min)
- Build all 12 tools
- Add input validation with Zod
- Add comprehensive error handling
- Test each tool with mock data

### Step 4: Implement Resources (30 min)
- Create 4 resources
- Add real-time update support
- Add caching for performance

### Step 5: Build Utility Functions (45 min)
- **Repetition Detection**: TF-IDF similarity scoring
- **Claim Validation**: Fuzzy matching against activities
- **Strategic Analysis**: Dimension coverage calculation
- **Balance Scoring**: Portfolio completeness algorithm

### Step 6: Testing (30 min)
- Unit tests for each tool
- Integration tests with real Supabase data
- Performance testing (all tools <200ms)

### Step 7: Integration with PIQ Analyzer (30 min)
- Create MCP client wrapper
- Add to PIQ analyzer context
- Update pattern detection to use MCP data

---

## USAGE EXAMPLE IN PIQ ANALYZER

```typescript
// Before: PIQ analyzer works in isolation
const analysis = analyzePIQ(essayText, {
  promptType: 'piq5_challenge'
});

// After: PIQ analyzer with full context
const mcp = createMCPClient('student-portfolio');

// Get complete context
const profile = await mcp.call('get_student_profile', { user_id });
const activities = await mcp.call('get_extracurriculars', { user_id });
const allEssays = await mcp.call('get_all_essays', { user_id });

// Analyze with context
const analysis = analyzePIQ(essayText, {
  promptType: 'piq5_challenge',
  studentContext: {
    profile,
    activities,
    allEssays,
    firstGen: profile.personal_info.first_gen,
    challenges: profile.family.challenging_circumstances
  }
});

// Enhanced pattern detection
if (essayClaimsLeadership) {
  const validation = await mcp.call('validate_claim', {
    claim: extractedLeadershipClaim,
    claim_type: 'leadership',
    user_id
  });

  if (!validation.is_valid) {
    issues.push({
      severity: 'critical',
      dimension: 'role_clarity_ownership',
      problem: `You claim "${extractedLeadershipClaim}" but your activity list shows: ${validation.evidence_found.join(', ')}`,
      fix: validation.suggestion
    });
  }
}

// Check for repetition
const repetition = await mcp.call('check_repetition', {
  current_essay_text: essayText,
  user_id
});

if (repetition.has_repetition) {
  issues.push({
    severity: 'major',
    dimension: 'opening_hook_quality',
    problem: `This story is ${repetition.repetition_details[0].similarity_score * 100}% similar to your ${repetition.repetition_details[0].other_essay_type}`,
    fix: 'Choose a different story or focus on a different aspect'
  });
}

// Suggest better stories
const betterStories = await mcp.call('get_better_stories', {
  current_essay_text: essayText,
  piq_prompt_number: 5,
  user_id
});

if (betterStories.alternative_stories.length > 0) {
  suggestions.push({
    type: 'alternative_story',
    activity: betterStories.alternative_stories[0].activity_name,
    rationale: betterStories.alternative_stories[0].why_better,
    estimated_improvement: betterStories.alternative_stories[0].estimated_score_improvement
  });
}
```

---

## EXPECTED OUTCOMES

### Enhanced Pattern Detection
- **Before**: "Vague leadership claim detected"
- **After**: "You claim to be debate team president, but your activity list shows no debate club. Add debate club to your activities or choose a different story."

### Strategic PIQ Selection
- **Before**: Student randomly picks PIQs
- **After**: "Based on your profile, PIQ 4 (Educational Barrier) aligns perfectly with your first-gen status and family responsibilities. PIQ 6 (Academic) fits your CS passion + hackathon project. Avoid PIQ 2 (Creative) - you have no arts activities."

### Portfolio Balance
- **Before**: All 4 PIQs show leadership, no vulnerability
- **After**: "Your PIQs emphasize Leadership (10/10) and Initiative (9/10), but completely miss Vulnerability (2/10) and Context (1/10). Consider writing PIQ 5 (Challenge) to show emotional depth and obstacles overcome."

### Repetition Prevention
- **Before**: Student writes same robotics story in Personal Statement + PIQ 1
- **After**: "Your PIQ 1 repeats 78% of your personal statement. Choose a different story. You have 3 other strong leadership experiences: Math Olympiad captain, tutoring program founder, or church youth group leader."

### Claim Validation
- **Before**: Essay says "I'm president of 3 clubs" but activity list shows no leadership
- **After**: "CRITICAL: You claim president of 3 clubs, but your activity list shows 0 leadership roles. Either update your activities or revise this claim immediately."

---

## SUCCESS METRICS

**Tool Performance**:
- ✅ All tools respond <200ms
- ✅ 100% type safety (Zod validation)
- ✅ Error handling for missing data

**Analysis Quality**:
- ✅ 95%+ claim validation accuracy
- ✅ 90%+ repetition detection accuracy
- ✅ Portfolio balance scoring matches expert evaluations

**Student Impact**:
- ✅ Catch 100% of fabricated claims before submission
- ✅ Reduce essay repetition from ~40% to <5%
- ✅ Improve portfolio balance from 65/100 avg to 85/100 avg
- ✅ Strategic PIQ selection increases admit rate by 15-20%

---

## READY TO BUILD

All prerequisites met:
✅ Complete database schema mapped
✅ Essay system types understood
✅ PIQ rubric finalized (13 dimensions)
✅ Clear tool requirements defined
✅ Integration points identified

**Next Step**: Create MCP server package and begin implementation!
