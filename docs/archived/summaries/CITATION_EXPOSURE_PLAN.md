# Citation Exposure System - Implementation Plan

## Executive Summary

We're building a system to expose evidence citations in workshop teaching output for UI hover effects. When users hover over highlighted text in suggestions/rationale/teaching, they'll see the exact source evidence that supports that claim.

## Current State Analysis

### Existing Infrastructure ✅

1. **CitationService** ([citationService.ts](src/services/commonAppWorkshop/services/citationService.ts))
   - Already has Haiku-based citation mapping
   - Maps college research → essay parts
   - Tracks quotes, red flags, green flags, values
   - Creates `CitationMapping` objects

2. **Evidence Tracking in Suggestions** ✅
   - `Suggestion` interface has `evidence_used: { quote, source }`
   - Already captures which evidence was used for each suggestion
   - Line 106-109 in [batchGenerationService.ts](src/services/commonAppWorkshop/services/batchGenerationService.ts)

3. **Comprehensive College Research** ✅
   - `CollegeResearch` type with all quotes, flags, values
   - Full source metadata (name, title, publication, date)
   - Defined in [collegeResearch.ts](src/services/commonAppWorkshop/types/collegeResearch.ts)

### What's Missing 🔴

1. **Citation Anchors in Text**: No way to know WHICH words in the suggestion text correspond to WHICH evidence
2. **Granular Source Mapping**: `evidence_used` is suggestion-level, not span-level
3. **UI-Ready Citation Format**: No structured format for hover tooltips
4. **Multiple Citations per Suggestion**: Currently only tracks 1 evidence per suggestion

## Design: Citation Anchor System

### Core Concept: Inline Citation Markers

Instead of storing citations separately, we'll embed citation markers DIRECTLY in the text using a format that's:
- Easy for Claude to generate
- Easy for UI to parse
- Human-readable if citations fail to render

**Format**: `[cited text]{{citation_id}}`

Example:
```
"Stanford values intellectual vitality[self-directed exploration]{{cite_1}},
not just classroom achievement[pursuing ideas beyond requirements]{{cite_2}}."
```

### Citation Database Structure

```typescript
interface CitationDatabase {
  citations: Record<string, Citation>;
  // citation_id → full citation details
}

interface Citation {
  id: string;                    // cite_1, cite_2, etc.
  type: 'quote' | 'red_flag' | 'green_flag' | 'value' | 'example';

  // Source information
  source: {
    name: string;                // "Dean Richard Shaw"
    title: string;               // "Dean of Admission"
    publication?: string;        // "Stanford Magazine"
    date?: string;               // "2023-09"
  };

  // The evidence itself
  evidence: {
    quote?: string;              // For quotes
    flag_name?: string;          // For red/green flags
    value_name?: string;         // For values
    context: string;             // What was being discussed
  };

  // Teaching context
  why_relevant: string;          // Why this supports the claim

  // Link back to research
  research_id: string;           // e.g., "stanford_shaw_quote_3"
}
```

### Enhanced Suggestion Format

```typescript
interface EnhancedSuggestion extends Suggestion {
  // Original fields...
  text: string;
  rationale: string;

  // NEW: Text with embedded citation markers
  text_with_citations: string;
  rationale_with_citations: string;

  // NEW: Citation database for this suggestion
  citations: CitationDatabase;

  // DEPRECATED: evidence_used (replaced by citations)
  // evidence_used: { quote, source };
}
```

## Implementation Strategy

### Phase 1: Prompt Engineering for Citation Generation

**Goal**: Get Claude to output citation markers inline

**Approach**: Update batch generation prompts to:

1. **Instruction Block**:
```
When writing suggestions and rationale, cite your sources INLINE using this format:

[text being cited]{{cite_N}}

Example:
"Stanford looks for [self-directed intellectual exploration]{{cite_1}},
not just [classroom success]{{cite_2}}."

You must:
- Cite EVERY claim about what colleges want
- Cite EVERY red/green flag detection
- Cite EVERY teaching principle
- Use sequential IDs: cite_1, cite_2, cite_3, etc.
```

2. **Citation Database Section**:
```json
{
  "suggestions": {
    "polished_original": {
      "text_with_citations": "...",
      "rationale_with_citations": "...",
      "citations": {
        "cite_1": {
          "type": "quote",
          "source": {
            "name": "Dean Richard Shaw",
            "title": "Dean of Admission and Financial Aid"
          },
          "evidence": {
            "quote": "We're looking for students who pursue learning...",
            "context": "Discussing Stanford's admissions philosophy"
          },
          "why_relevant": "Establishes what Stanford means by intellectual vitality",
          "research_id": "stanford_shaw_iv_quote"
        }
      }
    }
  }
}
```

### Phase 2: Type System Updates

**Files to modify**:

1. **[batchGenerationService.ts](src/services/commonAppWorkshop/services/batchGenerationService.ts)**:
   - Add `Citation` interface
   - Add `CitationDatabase` interface
   - Extend `Suggestion` → `SuggestionWithCitations`
   - Update `BatchGenerationOutput` type

2. **[stage2BatchService.ts](src/services/commonAppWorkshop/services/stage2BatchService.ts)**:
   - Update service to expect citations in Claude response
   - Add citation validation
   - Ensure citations are passed through to output

3. **New file: [citationTypes.ts](src/services/commonAppWorkshop/types/citationTypes.ts)**:
   - Centralize all citation-related types
   - Export for use across services

### Phase 3: Citation Parser & Validator

**New service**: `citationProcessor.ts`

```typescript
class CitationProcessor {
  /**
   * Parse text with citation markers into structured format
   */
  parseTextWithCitations(text: string, citations: CitationDatabase): ParsedText {
    // Returns array of text spans + citation IDs
  }

  /**
   * Validate that all citation IDs in text exist in database
   */
  validateCitations(text: string, citations: CitationDatabase): ValidationResult {
    // Check for missing citations, unused citations
  }

  /**
   * Extract citation IDs from text
   */
  extractCitationIds(text: string): string[] {
    // Returns ["cite_1", "cite_2", ...]
  }

  /**
   * Enrich citation with full research data
   */
  enrichCitation(
    citation: Citation,
    research: CollegeResearch
  ): EnrichedCitation {
    // Adds full quote text, evidence details from research DB
  }
}
```

### Phase 4: UI Integration Types

**For frontend consumption**:

```typescript
interface UIReadyCitation {
  // Tooltip content
  tooltip: {
    title: string;              // "Dean Richard Shaw"
    subtitle: string;           // "Dean of Admission, Stanford"
    quote: string;              // The actual quote
    context: string;            // When/why this was said
    relevance: string;          // Why it supports this claim
  };

  // Visual styling hints
  styling: {
    type: 'quote' | 'red_flag' | 'green_flag' | 'value';
    severity?: 'critical' | 'major' | 'minor';  // For flags
    color_hint: string;         // e.g., 'blue', 'red', 'green'
  };

  // Accessibility
  aria_label: string;
}

interface UIReadyText {
  spans: Array<{
    text: string;
    citation_id?: string;       // If this span is cited
    citation?: UIReadyCitation; // Full citation for tooltip
  }>;
}
```

### Phase 5: Testing Strategy

**Test file**: `tests/test-citation-exposure.ts`

1. **Citation Generation Test**:
   - Run batch generation on sample essay
   - Verify citations are embedded in text
   - Verify citation database is complete
   - Check all citation IDs are resolved

2. **Citation Validation Test**:
   - Test with missing citations
   - Test with unused citations
   - Test with malformed citation markers

3. **Citation Enrichment Test**:
   - Start with minimal citation
   - Enrich from research database
   - Verify all fields are populated

4. **UI Format Conversion Test**:
   - Convert citations to UI-ready format
   - Verify tooltip content is complete
   - Check accessibility labels

## Example Flow

### Input: Student Essay Issue
```
Issue: "I learned about Python in my computer science class"
Problem: Classroom-focused (red flag for Stanford)
```

### Output: Suggestion with Citations

**Text**:
```
"I discovered Python through CS50, then spent weekends building
[a web scraper that analyzed Reddit discussions]{{cite_1}} to understand
how people talk about mental health online."
```

**Rationale with Citations**:
```
This revision transforms classroom learning into [self-directed exploration]{{cite_2}}
by showing you [pursued the idea beyond requirements]{{cite_3}}. Stanford
specifically looks for students who [take ideas from class and run with them
independently]{{cite_4}}, not just [excel in structured coursework]{{cite_5}}.
```

**Citations**:
```json
{
  "cite_1": {
    "type": "example",
    "source": { "name": "Elite Example STAN_IV_007" },
    "evidence": {
      "context": "Example shows specific technical project",
      "quote": "Built web scraper as personal project"
    },
    "why_relevant": "Demonstrates technical depth + independence"
  },
  "cite_2": {
    "type": "value",
    "source": {
      "name": "Stanford Core Value",
      "title": "Intellectual Vitality"
    },
    "evidence": {
      "value_name": "Self-Directed Exploration",
      "context": "Top-weighted value (40%) at Stanford"
    },
    "why_relevant": "Primary value being demonstrated"
  },
  "cite_3": {
    "type": "quote",
    "source": {
      "name": "Dean Richard Shaw",
      "title": "Dean of Admission and Financial Aid",
      "publication": "Stanford Magazine",
      "date": "2023"
    },
    "evidence": {
      "quote": "We want students who can't help but pursue their curiosity,
               who go beyond what's required because they're genuinely
               excited about learning.",
      "context": "Explaining Stanford's intellectual vitality standard"
    },
    "why_relevant": "Direct evidence of what Stanford values",
    "research_id": "stanford_shaw_quote_iv_3"
  },
  "cite_4": {
    "type": "green_flag",
    "source": {
      "name": "Stanford Green Flag Detection",
      "title": "Self-Directed Project Extension"
    },
    "evidence": {
      "flag_name": "INDEPENDENT_PROJECT_EXTENSION",
      "context": "Taking classroom learning into personal projects"
    },
    "why_relevant": "This pattern is specifically recognized as strength"
  },
  "cite_5": {
    "type": "red_flag",
    "source": {
      "name": "Stanford Red Flag Detection",
      "title": "Classroom-Bounded Learning"
    },
    "evidence": {
      "flag_name": "CLASS_BASED_ONLY",
      "context": "Severity: Major - Learning never leaves classroom"
    },
    "why_relevant": "Shows what the original draft was missing"
  }
}
```

### UI Rendering

When user hovers over "[self-directed exploration]{{cite_2}}":

**Tooltip displays**:
```
╔═══════════════════════════════════════╗
║ Stanford Core Value                   ║
║ Intellectual Vitality                 ║
║───────────────────────────────────────║
║ Self-Directed Exploration             ║
║                                       ║
║ Top-weighted value (40%) at Stanford  ║
║                                       ║
║ Why this matters:                     ║
║ Primary value being demonstrated in   ║
║ this suggestion.                      ║
╚═══════════════════════════════════════╝
```

When user hovers over "[a web scraper that analyzed Reddit discussions]{{cite_1}}":

**Tooltip displays**:
```
╔═══════════════════════════════════════╗
║ Elite Example: STAN_IV_007            ║
║───────────────────────────────────────║
║ "Built web scraper as personal        ║
║  project"                             ║
║                                       ║
║ Example shows specific technical      ║
║ project                               ║
║                                       ║
║ Why this works:                       ║
║ Demonstrates technical depth +        ║
║ independence                          ║
╚═══════════════════════════════════════╝
```

## Benefits

### For Students
1. **Transparency**: See exactly why advice is given
2. **Trust**: Every claim backed by source
3. **Learning**: Understand college values through sources
4. **Confidence**: Know advice comes from actual admissions officers

### For Quality
1. **Accountability**: Claude must cite sources
2. **Accuracy**: Forces teaching to stay grounded in evidence
3. **Consistency**: Citations ensure alignment with research
4. **Debugging**: Easy to trace bad advice to source

### For Development
1. **Testability**: Validate citation completeness
2. **Observability**: Track which sources are used most
3. **Iteration**: Identify gaps in research coverage
4. **Quality Metrics**: Measure citation accuracy

## Files to Create/Modify

### New Files
- [ ] `src/services/commonAppWorkshop/types/citationTypes.ts` - Core citation types
- [ ] `src/services/commonAppWorkshop/services/citationProcessor.ts` - Parser/validator
- [ ] `src/services/commonAppWorkshop/utils/citationFormatter.ts` - UI formatting
- [ ] `tests/test-citation-exposure.ts` - Citation system tests

### Modified Files
- [ ] `src/services/commonAppWorkshop/services/batchGenerationService.ts` - Add citations to Suggestion type, update prompts
- [ ] `src/services/commonAppWorkshop/services/stage2BatchService.ts` - Handle citations in output
- [ ] `src/services/commonAppWorkshop/types/index.ts` - Export citation types

## Risk Assessment

### Low Risk ✅
- Additive feature (doesn't break existing functionality)
- Falls back gracefully (text without citations still readable)
- Optional for UI (can render without hover effects)

### Medium Risk ⚠️
- **Prompt complexity**: Citations add ~300 tokens to prompt
  - Mitigation: Cache prompt with examples
- **Claude consistency**: May forget to cite some claims
  - Mitigation: Validation layer catches missing citations
- **Token cost**: Citation database adds ~200-400 output tokens
  - Mitigation: Worth it for quality/transparency (~$0.006 per essay)

### High Risk 🔴
- **UI parsing complexity**: Frontend must parse citation markers
  - Mitigation: Provide clean parsing utility
  - Mitigation: Document format thoroughly

## Success Metrics

1. **Citation Coverage**: >95% of claims have citations
2. **Citation Accuracy**: 100% of citation IDs resolve to valid sources
3. **User Engagement**: Track hover interactions on citations
4. **Quality Impact**: Does citation requirement improve teaching quality?
5. **Cost Impact**: Measure token increase vs. quality gain

## Timeline

- **Phase 1** (Prompt Engineering): 1-2 hours
- **Phase 2** (Type System): 1 hour
- **Phase 3** (Parser/Validator): 2-3 hours
- **Phase 4** (UI Integration): 1 hour
- **Phase 5** (Testing): 2 hours

**Total**: 7-9 hours of implementation

## Next Steps

1. ✅ Get user approval of this plan
2. Start Phase 1: Update batch generation prompts
3. Create citation types
4. Build parser/validator
5. Run tests
6. Document UI integration for frontend team
