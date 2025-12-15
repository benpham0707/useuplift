# Citation Integration Status & Next Steps

**Date**: 2025-12-08
**Goal**: Integrate inline citations with hover tooltips into Stage 1-3 teaching outputs

---

## Current State Summary

### ✅ What's Already Built

1. **Citation Infrastructure (100% Complete)**
   - ✅ Holistic 3-type system: `problem`, `strength`, `teaching`
   - ✅ Citation processor (`citationProcessor.ts`) - 700 lines
   - ✅ Citation formatter (`citationFormatter.ts`) - 500 lines
   - ✅ Citation types (`citationTypes.ts`) - 500 lines
   - ✅ 25/25 tests passing
   - ✅ UI-ready tooltip format

2. **Stage 0-3 Services (Fully Implemented)**
   - ✅ Stage 0: Multi-stage voice excavation (~1,000 lines)
   - ✅ Stage 1: Consolidated foundation teaching (~610 lines)
   - ✅ Stage 2: Batch service exists (~545 lines)
   - ✅ Stage 3: Consolidated service exists (~625 lines)

3. **College Research Database**
   - ✅ 30+ college overlays (Stanford, MIT, Harvard, etc.)
   - ✅ Full research with Dean quotes, rubrics, red/green flags
   - ✅ Citation mapping service (Haiku pre-analysis)

### ⚠️ What's Missing

**The Gap**: Services receive citation mapping but don't **generate inline citations** in their output.

Current flow:
```
Haiku Citation Service → Citation Mapping → Stage 1-3 Services
                                                     ↓
                                          Teaching output WITHOUT
                                          inline citation markers
```

Needed flow:
```
Haiku Citation Service → Citation Mapping → Stage 1-3 Services
                                                     ↓
                                          Teaching output WITH
                                          [inline markers]{{cite_N}}
                                                     ↓
                                          Citation Processor
                                                     ↓
                                          UI-Ready Tooltips
```

---

## Key Files Overview

### Citation System Files (Ready to Use)

| File | Purpose | Status |
|------|---------|--------|
| `citationTypes.ts` | Type definitions for 3 citation types | ✅ Complete |
| `citationProcessor.ts` | Parse `[text]{{cite_N}}` markers | ✅ Complete |
| `citationFormatter.ts` | Format for UI tooltips | ✅ Complete |
| `test-citation-holistic-3type.ts` | 25 tests | ✅ All passing |

### Teaching Service Files (Need Citation Integration)

| File | Purpose | Status |
|------|---------|--------|
| `stage1ConsolidatedService.ts` | Foundation teaching | ⚠️ No inline citations |
| `stage2BatchService.ts` | Development teaching | ⚠️ No inline citations |
| `stage3ConsolidatedService.ts` | Refinement teaching | ⚠️ No inline citations |

---

## Stage 1 Consolidated: Current Structure

### Input
```typescript
{
  essayDraft: string,
  essayPrompt: string,
  collegeResearch: CollegeResearch,  // Full research with quotes
  voiceContext: {
    register: string,
    sparkScore: number,
    voiceQualities: string[],
    authenticPhrases: string[]
  }
}
```

### Internal Flow
```
1. Haiku pre-analysis
   ├─ Initial analysis
   ├─ Citation mapping (identifies relevant quotes/flags)
   └─ Voice fingerprint

2. Sonnet consolidated teaching
   ├─ Part 1: Conceptual foundation (values, rubric, prompt)
   └─ Part 2: Dimensional assessment with critical issues
```

### Current Output
```typescript
{
  conceptual_foundation: {
    college_values_teaching: [...],   // ❌ No citations
    rubric_education: [...],           // ❌ No citations
    prompt_deep_dive: {...}            // ❌ No citations
  },
  dimensional_assessment: [{
    dimension: string,
    strength: "STRONG|ADEQUATE|WEAK",
    evidence: {
      strengths: [...],                 // ❌ No citations
      weaknesses: [...]                 // ❌ No citations
    },
    priority_issues: [{
      diagnosis: string,                // ❌ No citations
      prescription: string,             // ❌ No citations
      missing_elements: {...}
    }]
  }],
  top_3_critical_issues: [...],        // ❌ No citations
  stage2_handoff: {...}
}
```

### Needed Output
```typescript
{
  conceptual_foundation: {
    college_values_teaching: [{
      how_this_applies: "[Self-directed exploration]{{cite_1}} is Stanford's #1 value",
      citations: {
        "cite_1": {
          type: "teaching",
          source: { name: "Dean Shaw", ... },
          evidence: { quote: "...", ... }
        }
      }
    }],
    // ... similar for other fields
  },
  dimensional_assessment: [{
    evidence: {
      strengths: [
        "[Independent project shows curiosity]{{cite_2}}",
        ...
      ],
      citations: { "cite_2": {...} }
    }
  }],
  // UI-ready formatted version
  conceptual_foundation_ui: UIReadyText,
  dimensional_assessment_ui: UIReadyText[]
}
```

---

## What Needs To Happen

### Phase 1: Update Stage 1 Prompt (2 hours)

**File**: `stage1ConsolidatedService.ts`

**Changes Needed**:

1. **Add citation instructions to prompt** (line ~180-481):
```typescript
const STAGE1_CONSOLIDATED_PROMPT = `...existing prompt...

═══════════════════════════════════════════════════════════
CITATION REQUIREMENTS - READ CAREFULLY
═══════════════════════════════════════════════════════════

You MUST cite ALL claims using inline citation markers.

**Syntax**: [cited text]{{cite_N}}

**Example**:
"Stanford values [self-directed exploration]{{cite_1}} above all else."

**Citation Types**:
1. **teaching** (purple box): Dean quotes, rubric criteria, value definitions
2. **problem** (red highlight): Red flags, missing elements, weaknesses
3. **strength** (green underline): Green flags, core values demonstrated

**What MUST Be Cited**:
- ✅ Every core value mention → teaching citation
- ✅ Every Dean/AO quote → teaching citation with source
- ✅ Every red flag → problem citation with severity
- ✅ Every green flag → strength citation
- ✅ Every rubric criterion → teaching citation with score band
- ✅ Every "what's working" → strength citation
- ✅ Every "what's missing" → problem citation

**Output Format**:
Each field with text must have two versions:
1. Text with citation markers: "Stanford values [IV]{{cite_1}}"
2. Citations object: { "cite_1": { type: "teaching", ... } }

**Example Output Structure**:
{
  "conceptual_foundation": {
    "college_values_teaching": [{
      "how_this_applies_text": "[Self-directed exploration]{{cite_1}} means...",
      "citations": {
        "cite_1": {
          "type": "teaching",
          "source": {
            "name": "Stanford Core Values",
            "title": "Intellectual Vitality"
          },
          "evidence": {
            "value_id": "intellectual_vitality",
            "value_name": "Self-Directed Exploration",
            "value_weight": 40,
            "definition": "Pursuing learning for its own sake",
            "how_demonstrated": "Independent projects beyond requirements"
          },
          "why_relevant": "Core value being taught",
          "research_id": "stanford_core_value_iv"
        }
      }
    }]
  },
  "dimensional_assessment": [{
    "evidence": {
      "strengths_text": [
        "[Independent web scraper project]{{cite_2}} shows curiosity"
      ],
      "weaknesses_text": [
        "[No self-directed exploration evident]{{cite_3}}"
      ],
      "citations": {
        "cite_2": { type: "strength", ... },
        "cite_3": { type: "problem", ... }
      }
    }
  }],
  // Continue pattern for all text fields...
}
```

2. **Update output type definitions** (line ~54-174):
```typescript
export interface CollegeValuesTeaching {
  core_value: any;
  how_this_applies_text: string;          // NEW: With citations
  how_this_applies_plain: string;         // NEW: Plain text
  citations: Record<string, Citation>;    // NEW: Citation objects
  example_from_dean_text: string;         // NEW: With citations
  student_reflection_prompt: string;
}

export interface DimensionalAssessment {
  dimension: string;
  strength: 'STRONG' | 'ADEQUATE' | 'WEAK';
  current_score: number;
  target_score: number;
  gap: number;

  evidence: {
    strengths_text: string[];             // NEW: With citations
    strengths_plain: string[];            // NEW: Plain text
    weaknesses_text: string[];            // NEW: With citations
    weaknesses_plain: string[];           // NEW: Plain text
    citations: Record<string, Citation>;  // NEW: Citation objects
  };

  priority_issues: CriticalIssue[];
}

export interface CriticalIssue {
  issue_number: number;
  quote: string;
  location: string;
  problem_text: string;                   // NEW: With citations
  problem_plain: string;                  // NEW: Plain text
  diagnosis_text: string;                 // NEW: With citations
  diagnosis_plain: string;                // NEW: Plain text
  prescription_text: string;              // NEW: With citations
  prescription_plain: string;             // NEW: Plain text
  citations: Record<string, Citation>;    // NEW: Citation objects

  missing_elements: {
    sensory_details?: string[];
    concrete_objects?: string[];
    micro_moment?: string;
    emotional_truth?: string;
  };

  relevant_concept: string;
  socratic_questions: string[];
  college_value_impacted: string;
}
```

3. **Add citation validation after Sonnet response** (line ~553-594):
```typescript
const response = await this.client.messages.create({...});
const content = response.content[0];
const parsed = parseClaudeJSON(content.text, 'Stage1ConsolidatedOutput');

// NEW: Validate citations
import { citationProcessor } from './citationProcessor';
import { formatTextWithCitations } from '../utils/citationFormatter';

// Validate each field with citations
const validationErrors = [];

// Validate college values teaching
for (const cvt of parsed.conceptual_foundation.college_values_teaching) {
  const validation = citationProcessor.validateCitations(
    cvt.how_this_applies_text,
    cvt.citations
  );
  if (!validation.valid) {
    validationErrors.push(...validation.errors);
  }
}

// Validate dimensional assessment
for (const dim of parsed.dimensional_assessment) {
  for (const strengthText of dim.evidence.strengths_text) {
    const validation = citationProcessor.validateCitations(
      strengthText,
      dim.evidence.citations
    );
    if (!validation.valid) {
      validationErrors.push(...validation.errors);
    }
  }
  // Similar for weaknesses_text
}

// If errors, log and potentially regenerate
if (validationErrors.length > 0) {
  console.warn('Citation validation errors:', validationErrors);
}

// Format for UI
const formatted = {
  conceptual_foundation_ui: {
    college_values_teaching: parsed.conceptual_foundation.college_values_teaching.map(cvt => ({
      ...cvt,
      how_this_applies_ui: formatTextWithCitations(
        cvt.how_this_applies_text,
        cvt.citations,
        collegeResearch.collegeName
      )
    }))
  },
  dimensional_assessment_ui: parsed.dimensional_assessment.map(dim => ({
    ...dim,
    evidence_ui: {
      strengths: dim.evidence.strengths_text.map(text =>
        formatTextWithCitations(text, dim.evidence.citations, collegeResearch.collegeName)
      ),
      weaknesses: dim.evidence.weaknesses_text.map(text =>
        formatTextWithCitations(text, dim.evidence.citations, collegeResearch.collegeName)
      )
    }
  }))
};

return {
  ...parsed,
  ...formatted,  // Include UI-ready versions
  cost,
  tokens_used: {...}
};
```

---

### Phase 2: Update Stage 2 & 3 (Similar Pattern)

**Files**:
- `stage2BatchService.ts`
- `stage3ConsolidatedService.ts`

**Same approach**:
1. Add citation instructions to prompts
2. Update output types to include `_text` and `citations` fields
3. Validate citations after LLM response
4. Format for UI using `formatTextWithCitations()`

---

### Phase 3: Test End-to-End (1-2 hours)

**Create test file**: `tests/test-stage1-citations-e2e.ts`

```typescript
import { Stage1ConsolidatedService } from '../src/services/commonAppWorkshop/services/stage1ConsolidatedService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';

async function testStage1Citations() {
  const service = new Stage1ConsolidatedService();

  const essayDraft = `
I have always been passionate about learning. In my computer science class,
I learned about algorithms and data structures. This experience taught me
the importance of problem-solving.
  `.trim();

  const essayPrompt = "Reflect on an idea or experience that makes you genuinely excited about learning.";

  const collegeResearch = getCollegeResearch('stanford');

  const voiceContext = {
    register: 'energetic_enthusiasm',
    sparkScore: 35,
    voiceQualities: ['formal', 'achievement-focused'],
    authenticPhrases: []
  };

  const output = await service.generateStage1Teaching(
    essayDraft,
    essayPrompt,
    collegeResearch,
    voiceContext
  );

  // Validate citations exist
  console.log('\n=== CITATION COVERAGE ===\n');

  const cvt = output.conceptual_foundation.college_values_teaching[0];
  console.log('College Values Teaching:');
  console.log('  Text:', cvt.how_this_applies_text);
  console.log('  Citations:', Object.keys(cvt.citations).length);
  console.log('  UI Ready:', cvt.how_this_applies_ui?.spans.length, 'spans');

  const dim = output.dimensional_assessment[0];
  console.log('\nDimensional Assessment:');
  console.log('  Strengths:', dim.evidence.strengths_text);
  console.log('  Weaknesses:', dim.evidence.weaknesses_text);
  console.log('  Citations:', Object.keys(dim.evidence.citations).length);

  console.log('\n=== SAMPLE TOOLTIP ===\n');
  const firstSpan = cvt.how_this_applies_ui?.spans.find(s => s.citation);
  if (firstSpan?.citation) {
    console.log('Text:', firstSpan.text);
    console.log('Type:', firstSpan.citation.styling.type);
    console.log('Tooltip:', JSON.stringify(firstSpan.citation.tooltip, null, 2));
  }

  console.log('\n=== COST ===');
  console.log(`Total: $${output.cost.toFixed(3)}`);
}

testStage1Citations();
```

---

## Expected Output Example

### Before (Current):
```json
{
  "conceptual_foundation": {
    "college_values_teaching": [{
      "how_this_applies": "Stanford values self-directed exploration above classroom learning."
    }]
  }
}
```

### After (With Citations):
```json
{
  "conceptual_foundation": {
    "college_values_teaching": [{
      "how_this_applies_text": "Stanford values [self-directed exploration]{{cite_1}} above [classroom learning]{{cite_2}}.",
      "how_this_applies_plain": "Stanford values self-directed exploration above classroom learning.",
      "citations": {
        "cite_1": {
          "type": "teaching",
          "source": {
            "name": "Stanford Core Values",
            "title": "Intellectual Vitality"
          },
          "evidence": {
            "value_id": "intellectual_vitality",
            "value_name": "Self-Directed Exploration",
            "value_weight": 40,
            "definition": "Pursuing learning for its own sake beyond requirements"
          },
          "why_relevant": "Core value being taught"
        },
        "cite_2": {
          "type": "problem",
          "source": {
            "name": "Stanford Red Flag System",
            "title": "Classroom-Bounded Learning"
          },
          "evidence": {
            "problem_id": "classroom_bounded",
            "severity": "major",
            "score_impact": "Caps IV at 69/100"
          },
          "why_relevant": "What to avoid"
        }
      },
      "how_this_applies_ui": {
        "plain_text": "Stanford values self-directed exploration above classroom learning.",
        "spans": [
          { "text": "Stanford values ", "citation": null },
          {
            "text": "self-directed exploration",
            "citation": {
              "styling": {
                "type": "teaching",
                "inline_style": "purple_box",
                "box_indicator_color": "#8B5CF6",
                "icon_hint": "💡"
              },
              "tooltip": {
                "title": "Self-Directed Exploration",
                "subtitle": "Stanford Core Value (40% weight)",
                "content": "Pursuing learning for its own sake beyond requirements",
                "relevance": "Core value being taught"
              }
            }
          },
          { "text": " above ", "citation": null },
          {
            "text": "classroom learning",
            "citation": {
              "styling": {
                "type": "problem",
                "inline_style": "red_highlight",
                "background_color": "#FEE2E2",
                "icon_hint": "🚨"
              },
              "tooltip": {
                "title": "Classroom-Bounded Learning",
                "subtitle": "Stanford Red Flag (Major)",
                "content": "What to avoid",
                "score_impact": "Caps IV at 69/100"
              }
            }
          },
          { "text": ".", "citation": null }
        ]
      }
    }]
  }
}
```

---

## Cost Impact Analysis

### Current Stage 1 Cost
- Haiku pre-analysis: ~$0.005
- Sonnet teaching: ~$0.045
- **Total: ~$0.05**

### With Citations Added
- Haiku pre-analysis: ~$0.005 (unchanged)
- Sonnet teaching with citations:
  - Base teaching: ~$0.045
  - Citation overhead (20 citations × 150 tokens × $15/MTok): ~$0.045
  - **Subtotal: ~$0.09**
- Citation processing (backend): negligible
- **Total: ~$0.095**

### Cost Increase: **+$0.045 per essay (+90%)**

**Is it worth it?**
- ✅ **Transparency**: Students see WHY we're saying things
- ✅ **Trust**: All advice grounded in research
- ✅ **Quality Control**: Forces teaching to cite sources
- ✅ **Learning**: Students understand college values through evidence

**Recommendation**: Yes, this is high-value cost increase.

---

## Implementation Priority

### Immediate (This Week)
1. ✅ Understand current architecture (DONE)
2. 🔄 Update Stage 1 Consolidated prompt with citation instructions (IN PROGRESS)
3. ⏳ Test Stage 1 with sample essay
4. ⏳ Validate citation coverage

### Short Term (Next Week)
5. ⏳ Update Stage 2 Batch Service
6. ⏳ Update Stage 3 Consolidated Service
7. ⏳ End-to-end test with full 3-stage flow

### Medium Term
8. ⏳ Frontend integration (React components for tooltips)
9. ⏳ Citation analytics (track which quotes most cited)
10. ⏳ Citation quality monitoring

---

## Success Metrics

**Coverage Targets**:
- ✅ 95%+ of core value mentions have citations
- ✅ 100% of Dean quotes have citations with source
- ✅ 100% of red flags have problem citations
- ✅ 100% of green flags have strength citations

**Quality Targets**:
- ✅ All citations validate (no broken references)
- ✅ All tooltips render correctly
- ✅ Citation density: 15-25 (S1), 20-35 (S2), 20-30 (S3)

**Cost Target**:
- ✅ <$0.15 overhead per 3-stage essay

---

## Next Step

**Start here**: Update `stage1ConsolidatedService.ts` prompt (line ~180-481) with citation instructions from Phase 1 above.

Would you like me to proceed with implementing the Stage 1 citation integration?
