# Deep Research Source Integration Guide

> **Purpose**: Step-by-step guide for integrating new Perplexity deep research batches into the Uplift citation system.
>
> **Last Updated**: January 2025

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEEP RESEARCH INTEGRATION FLOW                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Perplexity Research                                                │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────┐                                          │
│  │  Source File         │  intellectualDepthSources.ts             │
│  │  (EnhancedLabeledSource[])                                      │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                          │
│  │  sourceRegistry.ts   │  Central aggregation & validation        │
│  │  ALL_DEEP_RESEARCH_SOURCES                                      │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                          │
│  │  labeledSources.ts   │  LABELED_SOURCES = CORE + DEEP_RESEARCH │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                          │
│  │  SourceIndexer       │  O(1) lookup indices                     │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐                                          │
│  │  CitationAttacher    │  Attaches citations to feedback          │
│  │  SmartSourceSelector │                                          │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│        USER SEES CITATION                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start: Adding a New Research Batch

### Step 1: Run Perplexity Research

Use the appropriate prompt from `docs/archived/deep-research/PERPLEXITY_PROMPTS_PRIORITY_2.md`. Save the results.

### Step 2: Create Source File

```bash
# Copy the template
cp src/services/commonAppWorkshop/data/_sourceFileTemplate.ts \
   src/services/commonAppWorkshop/data/[batchName]Sources.ts
```

Example: `intellectualDepthSources.ts`

### Step 3: Extract Sources

For each expert quote/finding in the research:

1. Create an `EnhancedLabeledSource` object
2. Assign a unique `source_id` with batch prefix (e.g., `id_stanford_dean`)
3. Fill in all required fields (see template)
4. Map issue relevance scores

### Step 4: Register the Batch

In `sourceRegistry.ts`:

```typescript
// 1. Add import
import { ALL_INTELLECTUAL_DEPTH_SOURCES } from './intellectualDepthSources';

// 2. Add to ALL_ENHANCED_DEEP_RESEARCH_SOURCES array
export const ALL_ENHANCED_DEEP_RESEARCH_SOURCES: EnhancedLabeledSource[] = [
  ...ALL_SHOW_DONT_TELL_SOURCES,
  ...ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  ...ALL_INTELLECTUAL_DEPTH_SOURCES,  // NEW
];

// 3. Add case in getSourcesByBatch()
case 'intellectual_depth':
  return ALL_INTELLECTUAL_DEPTH_SOURCES;

// 4. Update RESEARCH_BATCHES metadata
{
  id: 'intellectual_depth',
  name: 'Intellectual Depth & Nuance',
  status: 'integrated',  // Change from 'pending'
  dateIntegrated: '2025-01-XX',
  sourceCount: ALL_INTELLECTUAL_DEPTH_SOURCES.length,
}
```

### Step 5: Validate

```bash
# Type check
npx tsc --noEmit

# Run validation test
npx tsx tests/test-source-integration-validation.ts
```

### Step 6: Update Documentation

Update `DEEP_RESEARCH_INTEGRATION_MASTER_PLAN.md` with:
- New batch status
- Source categories added
- Key insights extracted

---

## Source File Structure

### Required Exports

```typescript
// Individual category arrays
export const CATEGORY_1_SOURCES: EnhancedLabeledSource[] = [...];
export const CATEGORY_2_SOURCES: EnhancedLabeledSource[] = [...];

// Combined array (REQUIRED - used by registry)
export const ALL_[BATCH_NAME]_SOURCES: EnhancedLabeledSource[] = [
  ...CATEGORY_1_SOURCES,
  ...CATEGORY_2_SOURCES,
];

// Helper functions (optional but recommended)
export function get[BatchName]Sources(): EnhancedLabeledSource[];
export function get[BatchName]Stats(): { total: number; byCategory: Record<string, number> };
```

### Source ID Conventions

Use a consistent prefix for each batch:

| Batch | Prefix | Example |
|-------|--------|---------|
| Show Don't Tell | `sdt_` | `sdt_ao_mit_peterson` |
| Emotional Intelligence | `ei_` | `ei_dartmouth_ao_tmi` |
| Intellectual Depth | `id_` | `id_uchicago_dean_2024` |
| Prose Quality | `pq_` | `pq_craft_rhythm` |
| Opening Lines | `ol_` | `ol_hook_techniques` |
| Endings | `end_` | `end_closure_patterns` |
| Structure | `str_` | `str_pacing_research` |
| Specificity | `sp_` | `sp_concrete_details` |

### Issue Relevance Mapping

Map each source to relevant issue types:

```typescript
issue_relevance: {
  // Score: 0-100 (how relevant is this source?)
  // Aspect: What role does this source play?
  //   - 'problem': Explains why the issue matters
  //   - 'solution': How to fix the issue
  //   - 'principle': Underlying concept
  //   - 'example': What success looks like
  //   - 'warning': What to avoid

  telling_not_showing: {
    score: 95,
    aspect: 'solution',
    keywords_matched: ['sensory', 'concrete', 'specific']
  },
  cliche_language: {
    score: 80,
    aspect: 'warning',
    keywords_matched: ['overused', 'generic']
  },
}
```

### Scope Configuration

```typescript
scope: {
  // Level determines where source can be used
  level: 'universal',  // Safe for ALL essays
  // OR
  level: 'prompt_type',  // Only for certain essay types
  // OR
  level: 'college_specific',  // Only for certain colleges

  applies_to: {
    prompt_types: 'all',  // or ['personal_statement', 'why_this_college']
    colleges: 'all',  // or ['stanford', 'mit']
    issue_types: ['telling_not_showing', 'cliche_language'],
  },

  // Optional: Explicit exclusions
  never_use_for: {
    prompt_types: ['short_answer'],  // Don't use for 50-word answers
  },

  peer_applicable: true,  // Can Stanford advice be used for MIT?
  peer_weight_reduction: 0.1,  // 10% weight reduction for peer use
}
```

---

## Validation Checklist

Before considering a batch integrated:

- [ ] All sources have unique `source_id` with batch prefix
- [ ] All sources have either `quote` or `finding`
- [ ] All sources have `issue_relevance` with at least one issue type
- [ ] All sources have complete `taxonomy` (primary_category, etc.)
- [ ] All sources have complete `usage` (best_for, tone, etc.)
- [ ] All sources have complete `scope` configuration
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Validation test passes: `npx tsx tests/test-source-integration-validation.ts`
- [ ] No duplicate source IDs across all batches
- [ ] Registry metadata updated with accurate source count
- [ ] Documentation updated in DEEP_RESEARCH_INTEGRATION_MASTER_PLAN.md

---

## Cliché Pattern Integration

If the research includes new cliché patterns to detect:

### Step 1: Add Patterns to semanticClicheAnalyzer.ts

```typescript
// In CLICHE_REFERENCE object, add new category
new_pattern_category: [
  'pattern 1',
  'pattern 2',
  // ...
],
```

### Step 2: Update Detection Logic

In `patternBasedAnalysis()`:

```typescript
// Check new patterns
for (const pattern of CLICHE_REFERENCE.new_pattern_category) {
  if (lowerText.includes(pattern)) {
    symptoms.push({
      symptom_type: 'relevant_issue_type',
      detected_phrase: pattern,
      severity: 'warning',
      explanation: 'Why this pattern is problematic',
    });
  }
}
```

---

## Testing Your Integration

### Unit Test

```typescript
// Test individual batch
import { ALL_[BATCH_NAME]_SOURCES, get[BatchName]Stats } from './[batchName]Sources';

describe('[BatchName] Sources', () => {
  it('has expected number of sources', () => {
    expect(ALL_[BATCH_NAME]_SOURCES.length).toBeGreaterThan(10);
  });

  it('all sources have valid structure', () => {
    for (const source of ALL_[BATCH_NAME]_SOURCES) {
      expect(source.source_id).toBeTruthy();
      expect(source.quote || source.finding).toBeTruthy();
      expect(source.taxonomy.primary_category).toBeTruthy();
    }
  });
});
```

### Integration Test

```bash
# Full validation suite
npx tsx tests/test-source-integration-validation.ts
```

---

## Troubleshooting

### "Duplicate source_id" Error

Check that your batch prefix is unique and not already used by another batch.

### "Missing issue_relevance" Error

Every source must map to at least one issue type in the `issue_relevance` field.

### Sources Not Appearing in Citations

1. Check that the source is in `ALL_[BATCH_NAME]_SOURCES`
2. Check that the batch is imported in `sourceRegistry.ts`
3. Check that `issue_relevance` includes the issue type being diagnosed
4. Run `resetSourceIndexer()` to rebuild indices

### Type Errors

The `EnhancedLabeledSource` type has many required fields. Use the template as a starting point and ensure all fields are populated.

---

## Best Practices

1. **Batch Size**: Aim for 15-25 sources per batch for manageable review
2. **Quality > Quantity**: One high-authority dean quote beats five blog posts
3. **Issue Coverage**: Ensure new sources cover issues not already well-covered
4. **Authority Balance**: Mix primary (dean quotes) with expert/research sources
5. **Scope Accuracy**: Be conservative with scope - universal sources are safest

---

## Current Status

| Batch | Status | Sources | Cliché Patterns |
|-------|--------|---------|-----------------|
| Show Don't Tell | ✅ Integrated | 19 | 65+ |
| Emotional Intelligence | ✅ Integrated | 35 | 67 |
| Intellectual Depth | ⏳ Pending | - | - |
| Prose Quality | ⏳ Pending | - | - |
| Opening Lines | ⏳ Pending | - | - |
| Endings | ⏳ Pending | - | - |
| Structure & Pacing | ⏳ Pending | - | - |
| Art of Specificity | ⏳ Pending | - | - |

**Total Integrated**: 54 deep research sources + 15 core = 69 sources

---

*This guide should be updated as the integration process evolves.*
