# Testing Patterns

**Analysis Date:** 2026-02-23

## Test Framework

**Runner:**
- No formal test runner (Jest/Vitest not detected in package.json)
- Tests executed directly with `tsx` (TypeScript execution engine)
- Manual test orchestration (no `npm test` script)

**Assertion Library:**
- Custom assertion functions (no external library like Chai/Jest)
- Pattern: `assert(condition, message)` function implemented per-test

**Run Commands:**
```bash
ANTHROPIC_API_KEY="..." npx tsx tests/test-{name}.ts          # Run single test
npx tsc --noEmit                                               # Type check only
```

**Note:** This codebase uses LIVE API testing with real Claude API calls rather than traditional unit tests with mocks. Tests are integration/E2E focused.

## Test File Organization

**Location:**
- Tests in dedicated `/tests` directory (32+ test files)
- Fixtures in `/tests/fixtures/` subdirectory

**Naming:**
- Pattern: `test-{feature}-{description}.ts`
- Examples:
  - `test-major-resolution-comprehensive.ts`
  - `test-academic-advisor-live-e2e.ts`
  - `test-portfolio-narrative-e2e.ts`
  - `test-universal-quality-check.ts`

**Structure:**
```
tests/
├── test-{feature}-e2e.ts           # End-to-end tests
├── test-{feature}-unit.ts          # Unit tests
├── test-{feature}-comprehensive.ts # Full coverage tests
├── fixtures/
│   └── test-entries.ts             # Shared test data
└── utils/
    └── costTracker.ts              # Test utilities
```

## Test Structure

**Suite Organization:**
```typescript
// Section-based organization with console output
console.log('=================================================================');
console.log('  TEST NAME');
console.log('=================================================================');

function section(title: string): void {
  console.log(`\n--- ${title} ---`);
}

section('Test 1: Coverage Statistics');
// Test code...

section('Test 2: Parent-Child Hierarchy');
// Test code...
```

**Patterns:**
- Global counters for test results (`totalTests`, `passed`, `failed`)
- Custom `assert()` function increments counters
- Exit with `process.exit(1)` on failure
- Summary output at end

**Example from `test-major-resolution-comprehensive.ts`:**
```typescript
let totalTests = 0;
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`  FAIL: ${message}`);
  }
}

// Tests...

console.log(`  RESULTS: ${passed}/${totalTests} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
```

## Mocking

**Framework:** None - tests use REAL API calls

**Approach:**
- No mocking of Claude API - actual calls made
- Cost tracking implemented to monitor API spend
- Environment variable gates: `ANTHROPIC_API_KEY` required

**API Cost Tracking:**
```typescript
interface CostTracker {
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

const costTracker: CostTracker = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
};

function estimateCost(): string {
  // Sonnet pricing: $3/1M input, $15/1M output
  // Haiku pricing: $0.25/1M input, $1.25/1M output
  const cost = /* calculation */;
  return `$${cost.toFixed(4)}`;
}
```

**Retry Logic:**
- Tests implement retry for flaky API calls
- Exponential backoff pattern

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        error.message.includes('500') ||
        error.message.includes('overloaded');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.log(`   ⚠️  Attempt ${attempt} failed. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
```

## Fixtures and Factories

**Test Data:**
- Centralized in `tests/fixtures/test-entries.ts`
- Realistic data spanning quality spectrum

```typescript
export const STRONG_ENTRY: ExperienceEntry = {
  id: uuidv4(),
  user_id: uuidv4(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  title: 'Community Health Clinic Volunteer',
  // ... full realistic entry
};

export const WEAK_ENTRY: ExperienceEntry = {
  // ... templated, vague entry
};

export const ALL_TEST_ENTRIES = [
  STRONG_ENTRY,
  WEAK_ENTRY,
  GENERIC_ENTRY,
  REFLECTIVE_ENTRY,
  INTERNATIONAL_ENTRY,
  TOO_SHORT_ENTRY,
  PASSIVE_HEAVY_ENTRY,
];
```

**Factory Functions:**
- Tests include helper functions to create test data
- Example from `test-major-resolution-comprehensive.ts`:

```typescript
function makeSubjectPattern(
  avgGPA: number,
  trend: 'improving' | 'stable' | 'declining',
  strength: number,
  courses: Array<{ name: string; grade: number; level: string }>
) {
  return {
    performanceHistory: {
      avgGPA,
      trend,
      bestGrade: Math.max(...courses.map(c => c.grade)),
      worstGrade: Math.min(...courses.map(c => c.grade)),
      courses: courses.map(c => ({
        name: c.name,
        level: c.level,
        grade: c.grade,
        year: 2024,
      })),
    },
    // ... more fields
  };
}
```

**Location:**
- Fixtures: `tests/fixtures/`
- Factory functions: inline in test files (no shared utilities)

## Coverage

**Requirements:** Not enforced (no coverage tool detected)

**View Coverage:**
- No coverage reporting setup
- Manual verification through test output

**Current State:**
- 32+ integration/E2E test files
- Focus on critical paths (analysis, advisors, workshops)
- No unit test coverage measurement

## Test Types

**Unit Tests:**
- Rare - most tests are integration/E2E
- Example: `test-knowledge-assembly-unit.ts`
- Scope: Single service/function without external dependencies

**Integration Tests:**
- Primary test type
- Scope: Full service pipelines with real API calls
- Examples:
  - `test-major-resolution-comprehensive.ts` - Resolution service + context assembly
  - `test-full-pipeline-e2e-output.ts` - Complete analysis pipeline

**E2E Tests:**
- Framework: Custom (no Playwright/Cypress)
- Scope: Multi-step user flows with API calls
- Examples:
  - `test-academic-advisor-live-e2e.ts` - Full conversation flow
  - `test-portfolio-narrative-e2e.ts` - Complete portfolio analysis
  - `test-user-experience-e2e.ts` - End-to-end user journey

**Live API Tests:**
- All tests make real Claude API calls
- Cost tracked and displayed
- Output saved to files (e.g., `docs/ACADEMIC_ADVISOR_LIVE_OUTPUT.md`)

## Common Patterns

**Async Testing:**
```typescript
async function runLiveConversation(): Promise<ConversationTurn[]> {
  const profile = createTestProfile();
  const conversation: ConversationTurn[] = [];

  try {
    const opener = await withRetry(() =>
      generateInsightDrivenOpenerAsync(profile)
    );

    conversation.push({
      turn: 1,
      speaker: 'advisor',
      message: opener.message,
    });

    // ... more turns
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }

  return conversation;
}
```

**Error Testing:**
```typescript
// Edge case testing
assert(
  resolveStudentInterest('') === undefined,
  'Empty string should return undefined'
);

assert(
  resolveStudentInterest('asdfghjkl') === undefined,
  'Gibberish should return undefined'
);

// Error context should return safe defaults
const emptyCtx = getTargetedContext('nonsense');
assert(
  emptyCtx.resolvedMajors.length === 0,
  'Nonsense should give empty resolved majors'
);
```

**Environment Setup:**
```typescript
// Load env vars at top of file
import * as dotenv from 'dotenv';
dotenv.config();

// Check for required keys
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY not set');
  process.exit(1);
}

console.log(`✅ API Key found (${process.env.ANTHROPIC_API_KEY.slice(0, 10)}...)`);
```

**Output Generation:**
- Tests generate markdown reports
- Written to `docs/` directory
- Include full conversation transcripts and analysis

```typescript
function generateMarkdownReport(conversation: ConversationTurn[]): string {
  let md = `# Test Report\n\n`;
  md += `> **Generated:** ${timestamp}\n`;
  md += `> **API Calls:** ${costTracker.calls}\n`;
  md += `> **Cost:** ${estimateCost()}\n\n`;

  for (const turn of conversation) {
    md += `### Turn ${turn.turn}\n\n${turn.message}\n\n`;
  }

  return md;
}

const report = generateMarkdownReport(conversation);
fs.writeFileSync('docs/OUTPUT.md', report);
```

**Test Data Patterns:**
- Realistic student profiles with full course histories
- Edge cases: empty, too short, passive voice, international contexts
- Distribution coverage: strong (85-95 NQI), weak (40-55), generic (60-70)

## Verification Approach

**Assertions:**
- Threshold-based: `assert(score >= 85, 'Score should be high')`
- Equality: `assert(result === expected, 'Should match')`
- Presence: `assert(data.length > 0, 'Should have data')`
- Type checks: `assert(typeof x === 'string', 'Should be string')`

**Multi-Level Validation:**
```typescript
// Test hierarchical resolution
const ee = resolveStudentInterest('Electrical Engineering');
assert(ee !== undefined, 'EE should resolve');
if (ee) {
  assert(ee.parent !== undefined, 'EE should have parent');
  assert(
    ee.parent?.major === 'Engineering',
    'EE parent should be Engineering'
  );
  assert(
    ee.mergedRequirements.competitive.length >
      ee.matched.requirements.competitive.length,
    'Merged should include parent requirements'
  );
}
```

**Output Quality Checks:**
```typescript
// Verify substantial output
assert(
  result.llmFormattedContext.length > 500,
  'Context should be substantial'
);

// Verify correctness
assert(
  result.relevantAPCourses.length > 0,
  'Should have relevant courses'
);

// Verify targeting (no dilution)
assert(
  !civilCourseNames.includes('AP Biology'),
  'Civil Engineering should NOT include Biology'
);
```

---

*Testing analysis: 2026-02-23*
