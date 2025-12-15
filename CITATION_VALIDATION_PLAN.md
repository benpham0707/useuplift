# Citation System Validation & Optimization Plan

**Goal**: Ensure our citation system is robust, accurate, and nuanced
**Approach**: Test with optimized Haiku prompts to validate at scale

---

## 🎯 What We Need to Validate

### 1. **Trigger Detection Accuracy**
- Does it catch ALL claims that need citations?
- Does it avoid false positives (citing things that don't need it)?
- Does it handle edge cases (multiple weights in one sentence, etc.)?

### 2. **Citation Selection Quality**
- Does it pick the BEST citation for each context?
- Is the relevance scoring accurate?
- Does it handle ties/close scores intelligently?

### 3. **Nuance & Context Awareness**
- Does it adapt to different essay types (IV vs. Why Us vs. Community)?
- Does it differentiate severity (critical vs. minor)?
- Does it match student's specific issue (not generic)?

### 4. **Student-Friendliness**
- Are explanations truly understandable to high schoolers?
- Is the language free of jargon?
- Are the 3 levels appropriately detailed?

### 5. **Robustness**
- Does it handle missing data gracefully?
- Does it work for multiple colleges (not just Stanford)?
- Does it scale (1 essay vs. 50 essays)?

---

## 🧪 Testing Strategy: Optimized Haiku Prompts

### Why Haiku?
- **Cost-effective**: Test thousands of scenarios cheaply
- **Fast**: Validate entire system in minutes, not hours
- **Focused**: Each prompt tests ONE specific aspect
- **Scalable**: Can run comprehensive test suites

### Test Categories

```
┌─────────────────────────────────────────────────────────────┐
│ TEST SUITE 1: Trigger Detection (20 tests)                 │
│ - Single weight claims                                     │
│ - Multiple weights in one sentence                         │
│ - Severity language variations                             │
│ - Elite patterns (various formats)                         │
│ - Authority quotes (dean, admission staff, etc.)           │
│ - Edge cases (no citation needed)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TEST SUITE 2: Citation Selection (30 tests)                │
│ - Best citation for each issue type                        │
│ - Relevance scoring accuracy                               │
│ - Authority hierarchy (dean > CDS > analysis)              │
│ - Recency prioritization                                   │
│ - Issue-specific keyword matching                          │
│ - Tie-breaking logic                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TEST SUITE 3: Nuance & Context (25 tests)                  │
│ - Different essay types (IV, Why Us, Community)            │
│ - Different severity levels (critical, major, minor)       │
│ - Different colleges (Stanford, Harvard, MIT)              │
│ - Multiple issues in one essay                             │
│ - Comparison scenarios (Stanford vs MIT)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TEST SUITE 4: Student-Friendliness (15 tests)              │
│ - Reading level analysis (should be ~10th grade)           │
│ - Jargon detection (should have none)                      │
│ - Explanation clarity (can student understand?)            │
│ - Level appropriateness (simple vs medium vs detailed)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TEST SUITE 5: Robustness (20 tests)                        │
│ - Missing citations (graceful degradation)                 │
│ - Unknown colleges (fallback behavior)                     │
│ - Malformed input (error handling)                         │
│ - Performance (1 vs 50 essays)                             │
│ - Race conditions (concurrent requests)                    │
└─────────────────────────────────────────────────────────────┘
```

Total: **110 validation tests**

---

## 🚀 Optimization Opportunities

### 1. **Smarter Trigger Detection**

**Current**: Pattern matching (regex)
**Potential Issue**: Might miss variations

**Haiku Validation**:
```typescript
// Test: Does it catch all these variations?
const variations = [
  "Stanford weighs IV at 40%",
  "IV is weighted 40% at Stanford",
  "40% of Stanford's criteria is IV",
  "Stanford values IV (40%)",
  "IV accounts for 40 percent"
];

// Haiku validates: "Which of these need citations?"
```

**Optimization**: Add more pattern variations, semantic matching

---

### 2. **Context-Aware Scoring**

**Current**: Fixed weights (issue match 40%, authority 30%, etc.)
**Potential Issue**: Weights should vary by context

**Haiku Validation**:
```typescript
// Test: Should authority matter more for weight claims?
const weightClaimContext = {
  issue: 'weight_claim',
  // Should prioritize: authority (50%) > issue match (30%)
};

const problemExplanationContext = {
  issue: 'CLASS_BASED_ONLY',
  // Should prioritize: issue match (50%) > authority (30%)
};

// Haiku validates: "Rank these citations for each context"
```

**Optimization**: Dynamic scoring weights based on trigger type

---

### 3. **Nuanced Issue Matching**

**Current**: Keyword matching (CLASS_BASED_ONLY → "self-directed", "beyond classroom")
**Potential Issue**: Might miss semantically similar phrases

**Haiku Validation**:
```typescript
// Test: Should these match CLASS_BASED_ONLY?
const phrases = [
  "learning for its own sake",          // YES (exact match)
  "independent intellectual pursuit",   // YES (semantic match)
  "curiosity-driven exploration",       // YES (semantic match)
  "assigned homework",                  // NO (not self-directed)
  "class project"                       // NO (classroom-based)
];

// Haiku validates: "Which phrases indicate self-directed learning?"
```

**Optimization**: Semantic similarity (not just keywords)

---

### 4. **Credibility Differentiation**

**Current**: All "very_high" sources treated equally
**Potential Issue**: Some dean quotes are more direct than others

**Haiku Validation**:
```typescript
// Test: Rank these by credibility
const sources = [
  {
    quote: "Intellectual vitality is our TOP PRIORITY",
    // Direct ranking → very_high (95%)
  },
  {
    quote: "We value intellectual vitality",
    // Generic statement → high (80%)
  },
  {
    finding: "IV mentioned 127 times (3x more)",
    // Quantitative → very_high (90%)
  }
];

// Haiku validates: "Rank these sources by credibility for a weight claim"
```

**Optimization**: Sub-levels within credibility tiers

---

### 5. **Explanation Quality**

**Current**: Template-based explanations
**Potential Issue**: Might be too generic or too complex

**Haiku Validation**:
```typescript
// Test: Which explanation is better for a 10th grader?
const explanations = [
  {
    version: "A",
    text: "Stanford's dean explicitly stated that intellectual vitality constitutes their primary evaluative criterion"
    // Too formal, uses jargon
  },
  {
    version: "B",
    text: "Stanford's dean said IV is their top priority"
    // Clear, simple, direct
  },
  {
    version: "C",
    text: "The dean likes smart kids"
    // Too casual, loses precision
  }
];

// Haiku validates: "Which is most appropriate for a high school student?"
```

**Optimization**: Natural language generation for explanations

---

## 🔬 Validation Test Structure

### Test Template

```typescript
interface CitationValidationTest {
  // Test metadata
  test_id: string;
  suite: 'trigger' | 'selection' | 'nuance' | 'student_friendly' | 'robustness';
  description: string;

  // Input
  input: {
    feedback: {
      problem: string;
      why_matters: string;
      how_to_fix: string;
    };
    context: {
      college_id: string;
      issue_type: string;
      severity: string;
    };
  };

  // Expected output
  expected: {
    triggers_detected: number;
    trigger_types: string[];
    citations_attached: number;
    top_citation_type?: string; // dean_quote, cds, etc.
    relevance_score_min?: number;
  };

  // Validation with Haiku
  haiku_validation: {
    prompt: string;
    expected_answer: string;
  };
}
```

---

## 📝 Example Validation Tests

### Test 1: Multiple Weights in One Sentence

```typescript
{
  test_id: 'trigger_001',
  suite: 'trigger',
  description: 'Detect multiple weight claims in single sentence',

  input: {
    feedback: {
      problem: "",
      why_matters: "Stanford weighs IV at 40% and Character at 25%, making them the top two priorities.",
      how_to_fix: ""
    },
    context: {
      college_id: 'stanford',
      issue_type: 'GENERIC',
      severity: 'major'
    }
  },

  expected: {
    triggers_detected: 2,
    trigger_types: ['weight_claim', 'weight_claim'],
    citations_attached: 2
  },

  haiku_validation: {
    prompt: `Analyze this feedback text:
"Stanford weighs IV at 40% and Character at 25%, making them the top two priorities."

How many weight claims need citations?
List each claim that needs a citation.`,

    expected_answer: `2 weight claims need citations:
1. "40%" (IV weight)
2. "25%" (Character weight)`
  }
}
```

---

### Test 2: Citation Selection for Specific Issue

```typescript
{
  test_id: 'selection_001',
  suite: 'selection',
  description: 'Select best citation for CLASS_BASED_ONLY issue',

  input: {
    feedback: {
      problem: "Your essay only discusses classroom learning.",
      why_matters: "Stanford wants to see self-directed exploration.",
      how_to_fix: "Add an example of independent learning."
    },
    context: {
      college_id: 'stanford',
      issue_type: 'CLASS_BASED_ONLY',
      severity: 'critical'
    }
  },

  expected: {
    triggers_detected: 1,
    trigger_types: ['problem_explanation'],
    citations_attached: 1,
    top_citation_type: 'dean_quote',
    relevance_score_min: 85
  },

  haiku_validation: {
    prompt: `You have these 3 citations about Stanford's values:

Citation A (Dean Quote):
"Intellectual vitality is our top priority. We want students who pursue learning for its own sake, who are genuinely curious..."
Source: Dean Shaw, 2023
Type: dean_quote

Citation B (CDS):
"Character/Personal Qualities: Very Important"
Source: Stanford Common Data Set 2023
Type: official_data

Citation C (Analysis):
"87% of successful Stanford IV essays include self-directed learning examples (94 essays analyzed)"
Source: Internal research, 2024
Type: internal_analysis

Context: Student's essay only discusses classroom learning (CLASS_BASED_ONLY issue). We need to cite why "self-directed exploration" matters.

Which citation is BEST for this context? Rank them 1-3 and explain why.`,

    expected_answer: `Best citation: Citation A (Dean Quote)

Ranking:
1. Citation A (Dean Quote) - Score: 90/100
   - Directly addresses self-directed learning ("pursue learning for its own sake")
   - Highest authority (dean)
   - Explicitly states what Stanford wants

2. Citation C (Analysis) - Score: 75/100
   - Very relevant (directly about self-directed learning)
   - Lower authority (our research vs. dean)
   - Has quantitative data (87%)

3. Citation B (CDS) - Score: 55/100
   - Related but not specific to self-directed learning
   - High authority (official)
   - Too generic for this specific issue

For CLASS_BASED_ONLY, Citation A is best because it directly explains WHY self-directed learning matters (dean's explicit statement).`
  }
}
```

---

### Test 3: Nuance - Different Essay Types

```typescript
{
  test_id: 'nuance_001',
  suite: 'nuance',
  description: 'Different citations for IV essay vs. Why Us essay',

  haiku_validation: {
    prompt: `Same student issue (lacks specificity) but different essay types:

Scenario A: Intellectual Vitality essay
Issue: Generic statements like "I love learning"
Best citation type: ?

Scenario B: Why Us essay
Issue: Generic statements like "Stanford is a great school"
Best citation type: ?

For each scenario, should we cite:
- Dean quote about intellectual curiosity (for IV)?
- Mission statement about Stanford's unique offerings (for Why Us)?
- Same citation for both?

Which approach is most appropriate and why?`,

    expected_answer: `Different citations for different contexts:

Scenario A (IV Essay):
Best citation: Dean quote about intellectual curiosity
Why: IV essay specifically tests for self-directed learning. Dean Shaw's quote about "learning for its own sake" directly addresses what this essay should demonstrate.

Scenario B (Why Us Essay):
Best citation: Mission statement / admission website about Stanford's unique programs
Why: Why Us essay tests for research and fit. Citations should show what makes Stanford unique (specific programs, culture, opportunities).

Same issue (lacks specificity) but different root causes:
- IV essay: Not showing genuine curiosity → cite IV expectations
- Why Us essay: Not showing research → cite Stanford's unique offerings

Context-aware citation selection is critical for nuance.`
  }
}
```

---

### Test 4: Student-Friendliness

```typescript
{
  test_id: 'student_friendly_001',
  suite: 'student_friendly',
  description: 'Validate explanation is appropriate for 10th graders',

  haiku_validation: {
    prompt: `Evaluate this explanation for a 10th grade student:

"Stanford's methodological framework prioritizes intellectual vitality as their paramount evaluative criterion, as evidenced by Dean Shaw's explicit articulation of this hierarchical preference structure."

Issues:
1. Reading level (estimate grade level)
2. Jargon count
3. Clarity (1-10)
4. Appropriateness for high school student (1-10)

Then rewrite to be appropriate for a 10th grader.`,

    expected_answer: `Evaluation:
1. Reading level: College/Graduate (14th+ grade)
2. Jargon count: 6 terms (methodological framework, paramount, evaluative criterion, explicit articulation, hierarchical preference structure)
3. Clarity: 3/10 (very unclear)
4. Appropriateness: 2/10 (inappropriate - too academic)

Rewritten for 10th grader:
"Stanford's dean said intellectual vitality is their top priority when reviewing applications."

Why this is better:
- Reading level: 8th-9th grade
- No jargon
- Clarity: 9/10
- Direct and simple
- Preserves key information (who said it, what they prioritize)`
  }
}
```

---

## 🎯 Validation Workflow

```
1. CREATE TEST SUITE (110 tests)
   ├─ Trigger detection (20)
   ├─ Citation selection (30)
   ├─ Nuance & context (25)
   ├─ Student-friendliness (15)
   └─ Robustness (20)

2. RUN SYSTEM (get actual outputs)
   ├─ Run citation system on all test inputs
   └─ Capture: triggers detected, citations selected, text output

3. VALIDATE WITH HAIKU (verify correctness)
   ├─ Send Haiku the test scenario + actual output
   ├─ Ask: "Is this correct? What's wrong? How to improve?"
   └─ Capture Haiku's assessment

4. ANALYZE RESULTS
   ├─ Pass rate by suite
   ├─ Common failure modes
   ├─ Areas needing optimization
   └─ Generate improvement recommendations

5. OPTIMIZE SYSTEM
   ├─ Fix bugs identified
   ├─ Enhance algorithms based on findings
   ├─ Add new patterns/keywords
   └─ Improve explanations

6. RE-RUN VALIDATION
   └─ Confirm improvements (target: 95%+ pass rate)
```

---

## 🔧 Specific Optimizations to Test

### Optimization 1: Dynamic Scoring Weights

**Current**: Fixed weights
```typescript
score = issueMatch * 0.4 + authority * 0.3 + recency * 0.2 + specificity * 0.1
```

**Proposed**: Context-dependent weights
```typescript
if (trigger_type === 'weight_claim') {
  // For weight claims, prioritize authority
  score = issueMatch * 0.2 + authority * 0.5 + recency * 0.2 + specificity * 0.1
}
else if (trigger_type === 'problem_explanation') {
  // For problem explanations, prioritize issue match
  score = issueMatch * 0.5 + authority * 0.3 + recency * 0.1 + specificity * 0.1
}
```

**Haiku Test**: "For weight claims vs problem explanations, should we prioritize authority or issue match? Why?"

---

### Optimization 2: Semantic Issue Matching

**Current**: Keyword exact match
```typescript
const keywords = ['self-directed', 'beyond classroom', 'independent']
if (text.includes(keyword)) score += 20
```

**Proposed**: Semantic similarity
```typescript
// Use Haiku to check semantic similarity
const semanticMatch = await haiku.checkSimilarity(
  citationText,
  issueDescription
);
score += semanticMatch * 100; // 0-1 scale
```

**Haiku Test**: "Does 'curiosity-driven exploration' match the concept of 'self-directed learning'? Rate 0-100."

---

### Optimization 3: Credibility Sub-Levels

**Current**: 3 levels (very_high, high, medium)
```typescript
credibility = 'very_high' // 90%+
```

**Proposed**: Nuanced scoring
```typescript
credibility = {
  level: 'very_high',
  score: 94,  // More precise
  factors: {
    directness: 95,  // How direct is the quote?
    authority: 100,  // Who said it?
    recency: 90      // How recent?
  }
}
```

**Haiku Test**: "Rank these dean quotes by directness for proving a weight claim."

---

## 📊 Success Criteria

### Validation Pass Rates (Target)

| Suite | Target Pass Rate | Acceptable Minimum |
|-------|------------------|-------------------|
| Trigger Detection | 98% | 95% |
| Citation Selection | 95% | 90% |
| Nuance & Context | 90% | 85% |
| Student-Friendliness | 95% | 90% |
| Robustness | 100% | 98% |
| **Overall** | **95%** | **90%** |

### Quality Metrics

✅ **Accuracy**: Selects correct citation type 95%+ of time
✅ **Relevance**: Top citation scores 80+ for 90%+ of cases
✅ **Nuance**: Different citations for different contexts 85%+ of time
✅ **Clarity**: Explanations rated 8+/10 by Haiku for high schoolers
✅ **Robustness**: Zero crashes on edge cases

---

## 🚀 Next Steps

1. **Build test suite** (110 tests across 5 categories)
2. **Run baseline** (current system performance)
3. **Validate with Haiku** (identify gaps)
4. **Implement optimizations** (based on findings)
5. **Re-validate** (confirm improvements)
6. **Deploy** (production-ready, validated system)

**Timeline**: 2-3 hours for complete validation + optimization cycle

**Cost**: ~$2-5 (Haiku is very cheap, 110 prompts)

**Result**: Robust, accurate, nuanced citation system with 95%+ validation pass rate 🎯
