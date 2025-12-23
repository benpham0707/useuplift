# Common App Workshop System - Complete Context Document

**Created**: December 18, 2025
**Updated**: December 19, 2025
**Purpose**: Enable continuation of development in future sessions
**Status**: 91.7% Scoring Accuracy | Pipeline Ready for Full Testing | IssueContext Bug Fixed

---

## Executive Summary

The Common App Workshop is an AI-powered system that analyzes and improves college application supplemental essays. It uses a 4-stage pipeline combining semantic understanding with pattern detection to:

1. **Score essays accurately** (91.7% accuracy vs human judgment)
2. **Detect specific issues** (20 patterns covering critical problems)
3. **Generate surgical suggestions** (2 per issue: Polished + Voice Amplifier)
4. **Verify excellence requirements** (type-specific and college-specific)

The system is designed to transform weak essays (10-30 score) into excellent ones (85+) through targeted, teaching-focused feedback.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EvolvedWorkshopOrchestrator                              │
│                     (src/services/commonAppWorkshop/services/)               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 0: Voice Excavation (FREE - Heuristic)                               │
│  ├── Extract voice fingerprint                                               │
│  ├── Identify authentic phrases                                              │
│  └── Analyze vocabulary level, emotional range, sentence rhythm             │
│                                                                              │
│  STAGE 1: Holistic Scoring (~$0.05 - Sonnet)                                │
│  ├── UnifiedScoringService (PRIMARY - 91.7% accuracy)                       │
│  │   ├── SemanticScoringService                                              │
│  │   │   ├── 6 Core Writing Principles                                       │
│  │   │   ├── 7 Performative Indicators                                       │
│  │   │   └── Dynamic Word Count Assessment                                   │
│  │   └── Pattern Detection (FREE - Local regex)                              │
│  │       └── 20 Issue Patterns (7 critical, 7 major, 6 minor)               │
│  └── IntegratedTypeRubric (type weights + college overlay)                  │
│                                                                              │
│  STAGE 2: Surgical Suggestions (~$0.06-0.08 - Sonnet Batch)                 │
│  ├── TypeSpecificSuggestionService                                          │
│  │   ├── 2 suggestions per issue (Polished + Voice Amplifier)               │
│  │   ├── Banned terms enforcement                                            │
│  │   └── College value integration                                           │
│  └── Voice fingerprint preservation                                          │
│                                                                              │
│  STAGE 3: Excellence Check (~$0.01 - Haiku)                                 │
│  ├── Type-specific excellence requirements                                   │
│  ├── Citation recommendations                                                │
│  └── Final polish priorities                                                 │
│                                                                              │
│  TOTAL COST: ~$0.12-0.16 per essay                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Status

### What's Working ✅

| Component | Accuracy | Notes |
|-----------|----------|-------|
| **UnifiedScoringService** | 91.7% | Quality-first using Sonnet |
| **SemanticScoringService** | ~92% | 6 principles, 7 performative indicators |
| **Pattern Detection** | 13/13 tests | Fixed inverted logic for NO_NUMBERS, NO_DIALOGUE |
| **EvolvedWorkshopOrchestrator** | Fixed | Stage 2 score projection bug resolved |
| **TypeSpecificSuggestionService** | Implemented | 14 type-specific constraint configs |
| **CollegeTypeIntegrationService** | Implemented | Stanford complete, extensible |

### What's Broken ❌

| Component | Issue | Priority |
|-----------|-------|----------|
| **TypeAwareScoringService** | 0-17% accuracy (Haiku can't parse complex JSON) | LOW - Not needed |

### What Needs Testing 🔬

| Item | Test File | Notes |
|------|-----------|-------|
| Full pipeline (Stage 0→3) | `test-workshop-pipeline.ts` | Created, needs API key to run |
| Suggestion generation | Part of pipeline test | Verify quality |
| Score improvement tracking | Part of pipeline test | Before/after comparison |

---

## Key Files Reference

### Core Services

```
src/services/commonAppWorkshop/services/
├── evolvedWorkshopOrchestrator.ts    # Main 4-stage pipeline
├── unifiedScoringService.ts          # Quality-first scorer (91.7%)
├── semanticScoringService.ts         # Principles-based scoring
├── typeAwareScoringService.ts        # BROKEN - don't use
├── typeSpecificSuggestionService.ts  # 2 suggestions per issue
└── collegeTypeIntegrationService.ts  # Type + college rubric fusion
```

### Rubrics & Patterns

```
src/services/commonAppWorkshop/rubrics/
├── universalSupplementalRubric.ts    # 12 dimensions
├── typeWeightMatrices.ts             # 14 type × 12 dimension weights
├── writingPrinciples.ts              # 6 core principles, 7 performative indicators
└── issueDetectionPatterns.ts         # 20 patterns (fixed inverted logic)
```

### College Data

```
src/services/commonAppWorkshop/data/
├── stanford.ts                       # Complete Stanford research
└── index.ts                          # getCollegeResearch(), etc.
```

### Tests

```
tests/
├── test-comprehensive-e2e.ts         # Scoring accuracy tests
├── test-workshop-pipeline.ts         # Full Stage 0→3 tests
├── test-pattern-detection.ts         # 13/13 passing, no API needed
└── test-semantic-scoring.ts          # SemanticScoringService tests
```

---

## The 14 Essay Types

Each type has specific weights, critical dimensions, and excellence requirements:

| Type | Reader Question | Critical Dimensions |
|------|-----------------|---------------------|
| `why_us` | "Why THIS specific school?" | fit_demonstration, research_depth |
| `why_major` | "Why THIS field?" | reflection_insight, personal_connection |
| `community` | "What will you contribute?" | specificity_evidence, fit_demonstration |
| `diversity` | "What unique perspective?" | personal_connection, vulnerability_balance |
| `intellectual` | "What sparks your curiosity?" | reflection_insight, specificity_evidence |
| `extracurricular` | "Why this activity matters?" | growth_transformation, personal_connection |
| `challenge` | "How did you respond?" | growth_transformation, vulnerability_balance |
| `leadership` | "How do you lead?" | specificity_evidence, reflection_insight |
| `creative` | "What does your creativity reveal?" | authenticity_voice, personal_connection |
| `values` | "What do you value?" | authenticity_voice, reflection_insight |
| `future_goals` | "What's your vision?" | strategic_coherence, personal_connection |
| `additional_info` | "What else should we know?" | strategic_coherence, authenticity_voice |
| `short_answer` | Quick insight question | specificity_evidence, authenticity_voice |
| `optional` | Context-dependent | Varies |

---

## The 20 Issue Detection Patterns

### Critical Issues (7) - Score Impact: -3 to -5

1. **SWAP_TEST_FAIL** - Generic college praise, could swap name
2. **GENERIC_ORIGIN_STORY** - "I have always been interested..."
3. **ESSAY_SPEAK_HEAVY** - "This experience taught me..."
4. **VULNERABILITY_DUMP** - All trauma, no response
5. **NO_NUMBERS** - Missing quantification (ABSENCE pattern)
6. **AI_PATTERNS** - "delve into", "it's important to note"
7. **STATED_NOT_SHOWN** - "I am passionate" without proof

### Major Issues (7) - Score Impact: -2 to -3

1. **ONE_SIDED_FIT** - Only what college offers, not what student gives
2. **VAGUE_DIVERSITY** - Generic diversity claims (NEW)
3. **CAREER_ONLY** - Career focus without intellectual curiosity
4. **VAGUE_COMMUNITY** - Vague future promises
5. **TRAUMA_WITHOUT_AGENCY** - Victim narrative
6. **GENERIC_LESSONS** - "hard work pays off"
7. **REPEATED_THEMES** - Repeats other essays

### Minor Issues (6) - Score Impact: -1 to -2

1. **WEAK_OPENING** - "As president of..."
2. **NO_DIALOGUE** - Missing quoted speech (ABSENCE pattern)
3. **WEAK_VERBS** - Overuse of "was", "got", "did"
4. **ADJECTIVE_STACKING** - "truly amazing incredible"
5. **THROAT_CLEARING** - "I would like to tell you about"
6. **WORD_COUNT_PADDING** - "in order to", "due to the fact that"

---

## The 6 Core Writing Principles

From `writingPrinciples.ts`:

1. **Specificity Creates Trust** - Concrete details over vague claims
2. **Vulnerability Reveals Character** - Honest struggle, not performed perfection
3. **Show Don't Tell** - Actions and scenes over stated conclusions
4. **Voice Authenticity** - Sounds like a real person, not a template
5. **Reader Experience** - What does the reader feel after reading?
6. **Strategic Purpose** - Every sentence serves the essay's goal

---

## The 7 Performative Indicators

Detected and penalized when essays feel like performance rather than genuine communication:

1. **Trying to Impress** - Vocabulary above natural level
2. **Saying What Admissions Wants** - Generic "diversity" and "leadership" claims
3. **Manufactured Epiphany** - Forced "aha moment"
4. **Borrowed Voice** - Sounds like essay coaching, not the student
5. **Hedging Authenticity** - "I guess I learned..." uncertainty
6. **Resume Insertion** - Forcing achievements into narrative
7. **Closure Obsession** - Neat endings that feel false

---

## Bugs Fixed in This Session

### 1. Stage 2 Projected Score Calculation (CRITICAL)

**File**: `evolvedWorkshopOrchestrator.ts`

**Before (Broken)**:
```typescript
projected_score_after_fixes: projectedImprovement  // Just the improvement (e.g., 30)
```

**After (Fixed)**:
```typescript
projected_score_after_fixes: Math.min(100, currentScore + projectedImprovement)  // Actual score (e.g., 75)
```

### 2. Inverted Pattern Detection

**File**: `issueDetectionPatterns.ts`

**Before**: NO_NUMBERS and NO_DIALOGUE detected presence, should detect absence

**After**: Added `ABSENCE_PATTERNS` array and special handling:
```typescript
const ABSENCE_PATTERNS = ['NO_NUMBERS', 'NO_DIALOGUE'];

if (pattern.id === 'NO_NUMBERS' && !hasNumbers(text)) {
  matched = true;
}
```

### 3. Missing VAGUE_DIVERSITY Pattern

**File**: `issueDetectionPatterns.ts`

**Added**: New pattern to catch generic diversity claims without specific experiences.

### 4. Empty ONE_SIDED_FIT Detection

**File**: `issueDetectionPatterns.ts`

**Added**: Detection phrases for essays that only discuss what college offers.

### 5. Stage 2 IssueContext Type Mismatch (December 19, 2025)

**File**: `evolvedWorkshopOrchestrator.ts`

**Before (Broken)**: Stage 2 was constructing simplified objects that didn't match `IssueContext` interface:
```typescript
const issueContexts: IssueContext[] = priorityIssues.map((issue) => ({
  issue_id: issue.pattern_id,
  problem_description: issue.problem_description,  // Wrong field
  affected_dimensions: issue.affected_dimensions,
  original_text: '',  // Wrong field name
  // ... missing required fields
}));
```

**After (Fixed)**: Now constructs proper `IssueContext` objects:
```typescript
const issueContexts: IssueContext[] = priorityIssues.map((issue) => ({
  issue_id: issue.pattern_id,
  quote: essayDraft.substring(0, 200),
  location: 'Throughout essay',
  diagnosis: {
    problem: issue.problem_description,
    symptom_type: issue.pattern_id,
    affected_dimensions: issue.affected_dimensions,
    score_impact: issue.score_impact
  },
  surrounding_context: essayDraft.substring(0, 500),
  relevant_college_values: college?.coreValues?.slice(0, 2).map(v => ({
    value_name: v.valueName,
    what_demonstrates_it: v.essayImplication
  })) || [],
  relevant_quotes: college?.keyQuotes?.slice(0, 2).map(q => ({
    quote: q.quote,
    source: q.source?.name || 'Unknown'
  })) || []
}));
```

---

## Remaining Work

### Must Complete Before Production

- [ ] **Run full pipeline test** (`test-workshop-pipeline.ts`) with API key
- [ ] **Verify suggestion quality** - Are generated suggestions actually good?
- [ ] **Test score improvement** - Does applying suggestions actually raise scores?
- [ ] **Add more college data** - Only Stanford is complete

### Nice to Have

- [ ] **Caching** - Avoid re-scoring unchanged essays
- [ ] **Cost tracking dashboard** - Monitor API costs
- [ ] **Reduce false positives** - Improve pattern detection precision
- [ ] **Fix TypeAwareScoringService** - Lower priority since UnifiedScoringService works

---

## Test Commands

```bash
# Pattern detection tests (no API needed, should all pass)
npx tsx tests/test-pattern-detection.ts

# Full workshop pipeline test (requires API key)
ANTHROPIC_API_KEY="sk-..." npx tsx tests/test-workshop-pipeline.ts

# Comprehensive scoring test (requires API key)
ANTHROPIC_API_KEY="sk-..." npx tsx tests/test-comprehensive-e2e.ts

# Type check
npx tsc --noEmit
```

---

## Expected Test Results

### Pattern Detection (13/13 passing)

All tests should pass without API:
- NO_NUMBERS correctly detects absence of numbers
- NO_DIALOGUE correctly detects absence of dialogue
- VAGUE_DIVERSITY catches generic diversity claims
- ONE_SIDED_FIT catches one-sided why_us essays

### Scoring (11/12 expected)

| Essay Type | Quality | Expected Score | Expected Tier |
|------------|---------|----------------|---------------|
| why_us_weak | weak | 10-25 | weak |
| why_us_needs_work | needs_work | 15-40 | needs_work |
| why_us_strong | strong | 70-84 | strong |
| why_us_excellent | excellent | 85-100 | excellent |
| challenge_weak | weak | 10-30 | weak |
| challenge_needs_work | needs_work | 40-60 | needs_work |
| challenge_strong | strong | 85-95 | strong |
| diversity_weak | weak | 10-25 | weak |
| diversity_strong | strong | 72-88 | strong |
| short_weak | weak | 10-30 | weak |
| short_excellent | excellent | 80-100 | excellent |
| why_major_strong | strong | 72-88 | strong |

---

## How to Continue Development

### Session Start Checklist

1. Read this document
2. Read `PLAN.md` for current status
3. Run `npx tsx tests/test-pattern-detection.ts` to verify patterns work
4. Check MCP memory with `mcp__memory__read_graph`

### Priority Tasks

1. **Run pipeline test with real API key** - This is the critical next step
2. **Review suggestion quality** - Are the 2 suggestions per issue actually useful?
3. **Test before/after improvement** - Apply suggestions, rescore, measure improvement
4. **Add MIT, Harvard, Brown data** - Expand college coverage

### Quality Gates

Before marking any task complete:
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Related tests pass
- [ ] No console errors or warnings
- [ ] Code is self-documenting

---

## Contact & Resources

- **Project Path**: `/Users/tuepham/uplift-final-final-18698-62030`
- **GitHub**: `benpham0707/useuplift`
- **Tech Stack**: React 18, Vite, Express.js, Supabase, Clerk, Anthropic Claude

---

## Appendix: Sample Test Essays

### Weak Essay (Expected: 10-25)

```
Stanford is one of the best universities in the world. I have always dreamed of
attending a prestigious school like Stanford. The campus is beautiful and the
professors are world-renowned. I believe Stanford will help me achieve my dreams
and become successful. The opportunities at Stanford are amazing and I know I will
thrive there. Stanford's reputation speaks for itself. I want to go to Stanford
because it will look great on my resume.
```

**Detected Issues**: SWAP_TEST_FAIL, NO_NUMBERS, GENERIC_ORIGIN_STORY, ONE_SIDED_FIT, NO_DIALOGUE

### Excellent Essay (Expected: 85+)

```
The morning after my father's stroke, I found his chess clock sitting on the kitchen
table. For three weeks, we'd played every evening—his way of rebuilding neural pathways.
That morning, for the first time, he remembered how to castle.

But I wasn't home that morning. I was at a coding competition I'd insisted on attending
despite his condition worsening. When I returned to find my mother crying in the hallway,
my first thought wasn't about my father—it was relief that I'd won third place.

That guilt reshaped how I understood success. I started spending mornings at the hospital,
reading programming articles aloud to my father even when I wasn't sure he understood.
When he finally responded to a joke about JavaScript callbacks, I realized presence
matters more than achievement.

Now I code differently. Every project includes accessibility features. I volunteer
teaching seniors to video call their grandchildren. My definition of "winning" expanded:
it includes being somewhere when you're needed, not just when you're rewarded.

My father still can't beat me at chess. But every Tuesday, we play anyway.
```

**Why it's excellent**: Specific scene, authentic vulnerability, shows behavioral change, no clichés, powerful ending

---

*Last Updated: December 18, 2025*
