# Uplift Portfolio MCP Server

Model Context Protocol server providing complete student portfolio intelligence for essay analysis, claim validation, and strategic guidance.

## Overview

This MCP server gives LLM-based essay analyzers complete context about a student's:
- **Profile & Demographics** - Background, first-gen status, goals
- **Academic Journey** - GPA, test scores, course rigor, AP/IB exams
- **Activities & Leadership** - Extracurriculars, work, volunteer, projects
- **Context & Circumstances** - Family responsibilities, challenges, financial need
- **Essay Portfolio** - All essays with analysis reports and dimension scores

With this context, essay analysis becomes **10x more powerful**:
- Validate claims against actual student data ("I'm president of 3 clubs" → check activity list)
- Detect repetition across personal statement, PIQs, and supplements
- Suggest PIQ prompts that align with student's real experiences
- Recommend better stories from activity list
- Analyze portfolio balance across chosen PIQs
- Check narrative consistency (fact checking across essays)

## Architecture

Built with:
- **MCP SDK** (@modelcontextprotocol/sdk) - Stdio transport
- **Supabase** - PostgreSQL database with 8 core tables
- **Zod** - Runtime validation for all inputs/outputs
- **TypeScript** - Full type safety
- **Natural** - NLP for text similarity (TF-IDF)

## Installation

```bash
cd mcp-uplift-portfolio
npm install
npm run build
```

## Configuration

Create a `.env` file in `mcp-uplift-portfolio/`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Available Tools (12)

### 1. get_student_profile
Get complete student context including demographics, goals, academic info, activities, and family context.

**Input:**
```typescript
{
  user_id: string  // UUID of the user
}
```

**Output:**
```typescript
{
  profile: Profile,
  personal_info: PersonalInformation,
  academic: AcademicJourney,
  goals: GoalsAspirations,
  family: FamilyResponsibilities,
  personal_growth: PersonalGrowth,
  completion_score: number,  // 0-1
  has_leadership_roles: boolean,
  is_first_gen: boolean,
  has_challenging_circumstances: boolean
}
```

**Use Case:** Essential first call before any essay analysis to understand student background.

---

### 2. get_extracurriculars
Get all extracurricular activities, work experience, volunteer service, and leadership roles.

**Input:**
```typescript
{
  user_id: string,
  include_leadership_only?: boolean  // Filter for leadership only
}
```

**Output:**
```typescript
{
  extracurriculars: Activity[],
  work_experiences: WorkExperience[],
  volunteer_service: VolunteerService[],
  personal_projects: PersonalProject[],
  leadership_roles: LeadershipRole[],
  total_count: number
}
```

**Use Case:** Validate activity claims in essays, suggest alternative stories.

---

### 3. get_academic_context
Get academic information including GPA, test scores, course rigor, AP/IB exams.

**Input:**
```typescript
{
  user_id: string
}
```

**Output:**
```typescript
{
  gpa: number,
  gpa_scale: number,
  class_rank: number,
  class_size: number,
  course_rigor: 'high' | 'medium' | 'low',
  ap_ib_courses: Course[],
  ap_exams: APExam[],
  ib_exams: IBExam[],
  test_scores: {
    sat?: { total: number, math: number, ebrw: number },
    act?: { composite: number }
  }
}
```

**Use Case:** Validate academic claims, understand intellectual context.

---

### 4. get_context_circumstances
Get student context including family responsibilities, challenging circumstances, first-gen status, financial need.

**Input:**
```typescript
{
  user_id: string
}
```

**Output:**
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
  household_income: string | null,
  english_proficiency_needed: boolean,
  years_in_us: number | null,
  other_context: string
}
```

**Use Case:** Critical for evaluating "Context & Circumstances" dimension in PIQ essays.

---

### 5. get_all_essays
Get all essays for a student including personal statement, PIQs, and supplements.

**Input:**
```typescript
{
  user_id: string,
  include_analysis?: boolean  // Include analysis reports
}
```

**Output:**
```typescript
{
  essays: Essay[],
  total_count: number
}
```

**Use Case:** Portfolio-level analysis, repetition detection.

**Note:** Requires essay system integration (currently placeholder).

---

### 6. check_repetition
Check if current essay repeats content from other essays (personal statement, other PIQs, supplements).

**Input:**
```typescript
{
  current_essay_text: string,
  user_id: string
}
```

**Output:**
```typescript
{
  has_repetition: boolean,
  repetition_details: Array<{
    other_essay_id: string,
    other_essay_type: string,
    similarity_score: number,  // 0-1
    severity: 'critical' | 'major' | 'minor' | 'none',
    overlapping_content: string[]
  }>,
  suggestions: string[]
}
```

**Use Case:** Prevent students from telling the same story twice.

**Note:** Requires essay system integration (currently placeholder).

---

### 7. get_portfolio_analytics
Get comprehensive portfolio analytics including dimension coverage across all essays.

**Input:**
```typescript
{
  user_id: string
}
```

**Output:**
```typescript
{
  dimension_coverage: Record<string, {
    essays_showing_it: string[],
    average_score: number,
    strength_level: 'strong' | 'moderate' | 'weak' | 'absent'
  }>,
  essay_count: number,
  portfolio_coherence_score: number,  // 0-100
  gaps: string[],  // Missing dimensions
  strengths: string[]  // Well-covered dimensions
}
```

**Use Case:** Strategic portfolio review, identify gaps in dimension coverage.

---

### 8. validate_claim
Validate if an essay claim is backed by student data.

**Input:**
```typescript
{
  claim: string,  // e.g., "I am president of 3 clubs"
  claim_type: 'leadership' | 'activity' | 'achievement' | 'academic',
  user_id: string
}
```

**Output:**
```typescript
{
  is_valid: boolean,
  evidence_found: string[],
  confidence: number,  // 0-1
  suggestion: string
}
```

**Use Case:** Real-time claim validation during essay writing.

**Examples:**
- **Leadership:** "I founded my school's debate team" → checks leadership_roles
- **Activity:** "Through robotics club, I built..." → checks extracurriculars
- **Academic:** "With a 4.0 GPA..." → checks academic_journey
- **Achievement:** "I won state science fair" → checks academic_honors

---

### 9. suggest_piq_prompts
Recommend which UC PIQ prompts (1-8) align best with student's actual experiences.

**Input:**
```typescript
{
  user_id: string,
  already_written?: number[]  // PIQs already written (1-8)
}
```

**Output:**
```typescript
{
  recommendations: Array<{
    prompt_number: number,  // 1-8
    prompt_text: string,
    fit_score: number,  // 0-100
    rationale: string,
    story_suggestions: string[],
    dimension_alignment: string[]
  }>,
  avoid: Array<{
    prompt_number: number,
    reason: string
  }>
}
```

**Use Case:** Strategic PIQ selection based on real portfolio data.

**Logic:**
- PIQ 1 (Leadership) → recommend if `has_leadership_roles`
- PIQ 4 (Educational Barrier) → highly recommend if `first_gen` or `challenging_circumstances`
- PIQ 5 (Challenge) → recommend if `challenging_circumstances`
- PIQ 6 (Academic Passion) → recommend if `intended_major` specified
- PIQ 7 (Community) → recommend if volunteer/service experience

---

### 10. analyze_portfolio_balance
Evaluate if a set of chosen PIQ essays creates a well-rounded application.

**Input:**
```typescript
{
  user_id: string,
  piq_numbers: number[]  // Chosen PIQs (1-8), typically 4 PIQs
}
```

**Output:**
```typescript
{
  is_well_rounded: boolean,
  dimension_coverage: Record<string, number>,  // Times each dimension is emphasized
  gaps: string[],  // Missing critical dimensions
  overlaps: string[],  // Over-emphasized dimensions
  suggestions: string[],
  balance_score: number  // 0-100
}
```

**Use Case:** Portfolio optimization - ensure 4 chosen PIQs show diverse strengths.

**Algorithm:**
- Maps each PIQ to its emphasized dimensions
- Checks if critical dimensions (vulnerability, impact, reflection) are covered
- Flags over-emphasis (same dimension in 3+ PIQs)
- Suggests PIQ swaps for better balance

---

### 11. get_better_stories
Suggest alternative stories from student's activity list that might be stronger fits for a specific PIQ prompt.

**Input:**
```typescript
{
  current_essay_text: string,
  piq_prompt_number: number,  // 1-8
  user_id: string
}
```

**Output:**
```typescript
{
  alternative_stories: Array<{
    activity_name: string,
    activity_type: string,
    why_better: string,
    dimension_strengths: string[],
    estimated_score_improvement: number  // 0-15 points
  }>,
  current_story_issues: string[]
}
```

**Use Case:** When student picks a weak story for a PIQ prompt.

**Scoring Logic:**
- PIQ 1 (Leadership) → +30 points for leadership roles
- PIQ 3 (Talent) → +2 points per hour/week invested
- PIQ 7 (Community) → +30 points for volunteer/service
- Impact description length → +10 points

---

### 12. check_narrative_consistency
Check for contradictions across all essays using fact graph analysis.

**Input:**
```typescript
{
  user_id: string
}
```

**Output:**
```typescript
{
  is_consistent: boolean,
  conflicts: Array<{
    node_id: string,
    conflict_type: 'date_mismatch' | 'name_variant' | 'role_contradiction' | 'number_discrepancy',
    description: string,
    affected_essays: string[]
  }>,
  suggestions: string[]
}
```

**Use Case:** Detect contradictions before submission.

**Detection:**
- **Name inconsistencies:** "Model UN" vs "MUN" vs "Model United Nations"
- **Date conflicts:** "sophomore year" in one essay, "junior year" in another
- **Role contradictions:** "team member" vs "team captain" for same activity
- **Number discrepancies:** "30 hours/week" vs "15 hours/week" for same activity

**Note:** Requires essay system integration (currently placeholder).

---

## Integration with PIQ Analyzer

### Usage Example

```typescript
import { createMCPClient } from '@modelcontextprotocol/sdk/client';

const mcp = createMCPClient({
  name: 'uplift-portfolio',
  command: 'node',
  args: ['dist/index.js']
});

// 1. Get student context before analysis
const context = await mcp.call('get_student_profile', {
  user_id: 'abc123...'
});

// 2. Validate claims in essay
const claimCheck = await mcp.call('validate_claim', {
  claim: "I'm president of debate club",
  claim_type: 'leadership',
  user_id: 'abc123...'
});

if (!claimCheck.is_valid) {
  // Flag issue in analysis report
  issues.push({
    dimension: 'role_clarity_ownership',
    severity: 'critical',
    problem: claimCheck.suggestion
  });
}

// 3. Check for repetition
const repetition = await mcp.call('check_repetition', {
  current_essay_text: essayDraft,
  user_id: 'abc123...'
});

if (repetition.has_repetition) {
  issues.push({
    dimension: 'originality',
    severity: repetition.severity,
    problem: `Repeats content from ${repetition.repetition_details[0].other_essay_type}`
  });
}

// 4. Suggest better stories if current story is weak
if (overallScore < 65) {
  const alternatives = await mcp.call('get_better_stories', {
    current_essay_text: essayDraft,
    piq_prompt_number: 1,
    user_id: 'abc123...'
  });

  // Include in coaching plan
  coachingPlan.alternative_stories = alternatives.alternative_stories;
}
```

### Context-Aware Analysis Flow

```
1. Fetch student context (profile, activities, academic)
2. Analyze essay with full context
3. Validate all claims against data
4. Check repetition across portfolio
5. Evaluate dimension coverage
6. Suggest improvements grounded in actual experiences
```

## Database Schema

The MCP server integrates with 8 Supabase tables:

1. **profiles** - Core student profile with completion score
2. **personal_information** - Demographics, first-gen, background
3. **academic_journey** - GPA, test scores, course rigor
4. **experiences_activities** - Extracurriculars, work, volunteer, leadership
5. **family_responsibilities** - Context, circumstances, hours/week
6. **goals_aspirations** - Intended major, career interests
7. **personal_growth** - Meaningful experiences, additional context
8. **portfolio_analytics** - Cross-essay analysis, dimension coverage

All queries use `Promise.allSettled` for robustness - partial data is better than no data.

## Error Handling

All tools return structured errors:

```typescript
{
  error: string,
  tool: string
}
```

Common errors:
- `User {user_id} not found` - Invalid user_id
- `No activities found in profile` - Student hasn't filled out activities
- `Complete portfolio analytics requires essay submissions` - No essays yet

## Development

### Project Structure
```
mcp-uplift-portfolio/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── database/
│   │   ├── types.ts             # Zod schemas + TypeScript types
│   │   └── supabaseClient.ts    # Supabase queries
│   ├── tools/
│   │   └── index.ts             # All 12 tool implementations
│   └── utils/
│       ├── textAnalysis.ts      # TF-IDF similarity, repetition detection
│       └── claimValidator.ts    # Claim validation logic
├── dist/                        # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a New Tool

1. **Define Zod schema** in `src/tools/index.ts`:
```typescript
export const MyNewToolInputSchema = z.object({
  user_id: z.string().uuid(),
  param1: z.string()
});
```

2. **Implement tool function**:
```typescript
export async function myNewTool(input: z.infer<typeof MyNewToolInputSchema>) {
  const context = await getCompleteStudentContext(input.user_id);
  // ... implementation
  return { result: 'data' };
}
```

3. **Register in tools export**:
```typescript
export const tools = {
  // ... existing tools
  my_new_tool: myNewTool
};

export const toolSchemas = {
  // ... existing schemas
  my_new_tool: MyNewToolInputSchema
};
```

4. **Add to MCP server** in `src/index.ts`:
```typescript
// In ListToolsRequestSchema handler
{
  name: 'my_new_tool',
  description: 'What this tool does',
  inputSchema: { /* JSON schema */ }
}

// In CallToolRequestSchema handler
case 'my_new_tool': {
  const input = toolSchemas.my_new_tool.parse(args);
  const result = await tools.my_new_tool(input);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
```

### Testing

```bash
# Unit tests (coming soon)
npm test

# Manual testing with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Roadmap

### Phase 1.5 (Current) ✅
- [x] 12 core MCP tools implemented
- [x] Supabase integration with 8 tables
- [x] Claim validation system
- [x] Text similarity analysis (TF-IDF)
- [x] TypeScript compilation successful
- [x] Full type safety with Zod

### Phase 2 (Next)
- [ ] Complete essay system integration
  - [ ] Implement `get_all_essays` (query essays table)
  - [ ] Implement `check_repetition` (TF-IDF across essays)
  - [ ] Implement `check_narrative_consistency` (fact graph)
- [ ] Add caching layer for performance
- [ ] Unit tests for all 12 tools
- [ ] Integration tests with mock Supabase data

### Phase 3 (Future)
- [ ] Real-time claim validation webhook
- [ ] Advanced repetition detection (semantic similarity with embeddings)
- [ ] Portfolio coherence scoring algorithm
- [ ] Dimension coverage visualization data
- [ ] Essay version tracking and comparison

## License

Proprietary - Uplift College Consulting Platform

## Contact

For questions or support, contact the Uplift development team.
