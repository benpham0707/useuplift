# Citation System - Current State & Technical Context

> **For**: Next chat session optimizing the citation system
> **Created**: December 2024
> **Status**: Working system, needs efficiency optimization

---

## Quick Start

To understand the current system, read these files in order:

1. `src/services/commonAppWorkshop/types/provenanceTypes.ts` - Core type definitions
2. `src/services/commonAppWorkshop/services/deepPrescriptionGenerator.ts` - Source database & selection
3. `src/services/commonAppWorkshop/services/provenanceCitationSelector.ts` - Current selector
4. `src/services/commonAppWorkshop/services/universalCitationEngine.ts` - Citation application

---

## Current Source Database

### Location
`src/services/commonAppWorkshop/services/deepPrescriptionGenerator.ts`

### Current Structure (ProvenanceSource)

```typescript
export const ENHANCED_ADMISSIONS_SOURCES: ProvenanceSource[] = [
  {
    source_id: 'shaw_authenticity_2023',
    type: 'dean_quote',
    title: 'What Stanford Really Wants in Applicants',
    author: 'Richard Shaw',
    author_title: 'Dean of Admission and Financial Aid',
    publication: 'Stanford Magazine',
    date: '2023-05',
    quote: "The essays that stand out are never the ones trying to be impressive...",
    relevance_to_claim: 'Stanford values authentic voice over impressive-sounding language',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',
  },
  // ... 14 more sources
];
```

### All 15 Current Sources

| ID | Author | College | Quote Focus |
|----|--------|---------|-------------|
| `muth_specificity_2022` | Parke Muth | UVA | "The more specific you can be, the more universal..." |
| `guttentag_details_2023` | Christoph Guttentag | Duke | "I can tell when a student really lived something..." |
| `shaw_authenticity_2023` | Richard Shaw | Stanford | "The essays that stand out are never the ones trying..." |
| `fitzsimmons_reflection_2021` | William Fitzsimmons | Harvard | "We're not looking for perfection. We're looking for genuine reflection..." |
| `schiffman_invisible_phrases_2022` | Jeff Schiffman | Tulane | "After reading thousands of essays, certain phrases become invisible..." |
| `briggs_fresh_observations_2023` | Thyra Briggs | Harvey Mudd | "When everyone uses the same language, everyone sounds the same..." |
| `muth_show_dont_tell_2022` | Parke Muth | UVA | "Don't tell me you learned resilience. Show me the moment..." |
| `flagel_trust_reader_2023` | Andrew Flagel | GMU | "The best essays are like good fiction—they trust the reader..." |
| `shaw_iv_priority_2023` | Richard Shaw | Stanford | "Intellectual vitality is our top priority..." |
| `guttentag_spark_2023` | Christoph Guttentag | Duke | "We look for the spark—that moment when someone's eyes light up..." |
| `fitzsimmons_risk_2021` | William Fitzsimmons | Harvard | "The essays that move us are ones where students take real risks..." |
| `briggs_vulnerability_2023` | Thyra Briggs | Harvey Mudd | "Vulnerability doesn't mean trauma. It means being honest..." |
| `fitzsimmons_effect_on_others_2023` | William Fitzsimmons | Harvard | "We want to see your effect on others..." |
| `schmill_collaboration_2023` | Stu Schmill | MIT | "Mens et manus—mind and hand..." |
| `nondorf_intellectual_peer_2023` | James Nondorf | UChicago | "We're building an intellectual community..." |

---

## Current Selection Logic

### getBestSourceForIssue()

Location: `deepPrescriptionGenerator.ts` (lines ~954-1002)

```typescript
export function getBestSourceForIssue(
  issueType: string,
  collegeId?: string
): ProvenanceSource | null {
  // Category mapping for issue types
  const categoryKeywords: Record<string, string[]> = {
    cliche_topic_framing: ['invisible', 'fresh', 'specific', 'details'],
    cliche_narrative_arc: ['trust', 'concrete', 'show', 'fiction'],
    cliche_language: ['invisible', 'fresh', 'same', 'language'],
    cliche_ai_convergence: ['voice', 'authentic', 'genuine', 'hear'],
    cliche_college_specific: ['vitality', 'curious', 'priority', 'spark'],
    cliche_essay_formula: ['invisible', 'show', 'teaching'],
    telling_not_showing: ['show', 'feel', 'concrete', 'trust'],
    cliche_value_signaling: ['effect', 'impact', 'better', 'people'],
  };

  const keywords = categoryKeywords[issueType] || ['specific', 'authentic'];

  // Score sources by relevance
  const scoredSources = ENHANCED_ADMISSIONS_SOURCES.map(source => {
    let score = 0;
    const textToSearch = `${source.quote || ''} ${source.relevance_to_claim || ''}`.toLowerCase();

    // Keyword matching
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword.toLowerCase())) {
        score += 25;
      }
    }

    // College-specific boost
    if (collegeId) {
      if (collegeId === 'stanford' && source.author === 'Richard Shaw') score += 30;
      if (collegeId === 'harvard' && source.author === 'William Fitzsimmons') score += 30;
      if (collegeId === 'mit' && source.author === 'Stu Schmill') score += 30;
      if (collegeId === 'uchicago' && source.author === 'James Nondorf') score += 30;
      if (collegeId === 'duke' && source.author === 'Christoph Guttentag') score += 30;
    }

    // Authority boost
    score += source.weight_in_calculation * 0.3;

    return { source, score };
  });

  // Sort by score and return best match
  scoredSources.sort((a, b) => b.score - a.score);

  return scoredSources.length > 0 ? scoredSources[0].source : null;
}
```

### Problems with Current Approach

1. **Single source returned** - Only returns 1 source, not multiple
2. **Runtime keyword matching** - Computed on every call
3. **Simple keyword search** - No semantic understanding
4. **Limited college mapping** - Only 5 colleges have author mappings
5. **No diversity guarantee** - Could return same author repeatedly
6. **No pre-computation** - All scoring done at runtime

---

## Existing CitationSelector (Alternative System)

Location: `src/services/commonAppWorkshop/services/provenanceCitationSelector.ts`

This is an older system that uses Stanford provenance data:

```typescript
export class CitationSelector {
  private citationCache: Map<string, ProvenanceSource[]> = new Map();

  constructor() {
    this.loadStanfordCitations();
  }

  selectCitationsForIssue(context: CitationContext): SelectedCitation[] {
    const allCitations = this.getAllCitations(context.college_id);

    const scored = allCitations.map(citation => ({
      citation,
      relevance_score: this.scoreRelevance(citation, context),
      use_for: this.determineUse(citation, context),
    }));

    const topCount = context.severity === 'critical' ? 5 : 3;
    const topCitations = scored
      .filter(item => item.relevance_score > 30)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, topCount);

    return topCitations.map((item, index) =>
      this.formatCitation(item, index + 1, context)
    );
  }

  private scoreRelevance(citation: ProvenanceSource, context: CitationContext): number {
    let score = 0;
    // Factor 1: Issue match (40 points)
    score += this.scoreIssueMatch(citation, context.issue_detected) * 0.4;
    // Factor 2: Source authority (30 points)
    score += this.scoreAuthority(citation.type) * 0.3;
    // Factor 3: Recency (20 points)
    score += this.scoreRecency(citation.date || '2020-01-01') * 0.2;
    // Factor 4: Specificity (10 points)
    score += this.scoreSpecificity(citation) * 0.1;
    return Math.round(score);
  }
}
```

**Note**: This system and `getBestSourceForIssue()` are not yet unified. They should be merged.

---

## Universal Citation Engine

Location: `src/services/commonAppWorkshop/services/universalCitationEngine.ts`

This applies citations to any text content:

```typescript
export class UniversalCitationEngine {
  private detector: CitationTriggerDetector;
  private selector: CitationSelector;

  cite(input: CitableContent): CitedContent {
    // 1. Normalize content
    const normalized = this.normalizeContent(input.content);
    // 2. Detect triggers
    const triggers = this.detectAllTriggers(normalized, input.context);
    // 3. Select citations for each trigger
    const citationMap = this.selectCitationsForTriggers(triggers, input.context);
    // 4. Apply config
    const filteredCitations = this.applyCitationConfig(citationMap, config);
    // 5. Insert citations
    const citedContent = this.insertCitations(normalized, filteredCitations, contentType);
    return { content, citations, metadata };
  }
}
```

---

## Type Definitions

### ProvenanceSource (Current)

Location: `src/services/commonAppWorkshop/types/provenanceTypes.ts`

```typescript
export interface ProvenanceSource {
  source_id: string;
  type: SourceType;
  title: string;
  author?: string;
  author_title?: string;
  publication?: string;
  date?: string;
  url?: string;
  quote?: string;
  finding?: string;
  relevance_to_claim: string;
  weight_in_calculation: number;
  last_verified: string;
  verification_status: 'current' | 'outdated' | 'needs_review';
  archived_url?: string;
}

export type SourceType =
  | 'dean_quote'
  | 'cds'
  | 'admission_website'
  | 'essay_prompt'
  | 'mission_statement'
  | 'interview'
  | 'internal_analysis';
```

---

## Issue Types to Support

The system needs sources for these issue types:

```typescript
type ClicheSymptomType =
  | 'cliche_metaphor'
  | 'telling_not_showing'
  | 'cliche_topic_framing'
  | 'cliche_narrative_arc'
  | 'cliche_ai_convergence'
  | 'cliche_essay_formula'
  | 'cliche_college_specific'
  | 'cliche_value_signaling'
  | 'cliche_inspirational';
```

---

## Colleges to Support

Primary colleges (need dean sources):
- Stanford
- Harvard
- MIT
- UChicago
- Duke
- Yale
- Princeton
- Columbia
- Penn
- Brown
- Dartmouth
- Cornell
- Caltech
- Northwestern
- Johns Hopkins

---

## Test Files

Existing tests you can reference:

1. `tests/test-integrated-citation-prescription.ts` - Full integration test
2. `tests/test-enhanced-prescription-integration.ts` - Prescription quality
3. `tests/test-deep-prescription-quality.ts` - Deep prescription scoring
4. `tests/test-cliche-improvements-validation.ts` - Cliché system validation

Run tests with:
```bash
set -a && source .env && set +a && npx tsx tests/test-integrated-citation-prescription.ts
```

---

## What Needs to Change

### 1. Source Database Enhancement

Current:
```typescript
{
  source_id: 'shaw_authenticity_2023',
  type: 'dean_quote',
  // ... basic fields
}
```

Needed:
```typescript
{
  source_id: 'shaw_authenticity_2023',
  type: 'dean_quote',
  // ... basic fields PLUS:
  college_specificity: {
    primary_college: 'stanford',
    applicable_colleges: ['stanford'],
    exclusions: [],
  },
  issue_relevance: {
    'cliche_ai_convergence': { score: 95, aspect: 'principle' },
    'cliche_language': { score: 80, aspect: 'principle' },
  },
  taxonomy: {
    primary_category: 'authenticity',
    secondary_categories: ['fresh_perspective'],
    teaching_moment_types: ['why_this_matters'],
  },
}
```

### 2. Selection Logic Enhancement

Current:
```typescript
// Returns single source
getBestSourceForIssue(issueType, collegeId): ProvenanceSource | null
```

Needed:
```typescript
// Returns multiple sources with college prioritization
getSourcesForIssue(issueType, collegeId): SourceBundle {
  primary: LabeledSource;           // Best match
  supporting: LabeledSource[];      // 1-3 more relevant sources
  college_specific: LabeledSource;  // Guaranteed college-specific if available
}
```

### 3. Pre-Computed Indices

Current: All scoring computed at runtime

Needed:
```typescript
class SourceIndexer {
  // Pre-computed at startup
  private byCollege: Map<string, LabeledSource[]>;
  private byIssueType: Map<string, LabeledSource[]>;
  private byCategory: Map<SourceCategory, LabeledSource[]>;

  // O(1) lookups
  getForCollege(collegeId: string): LabeledSource[];
  getForIssueType(issueType: string): LabeledSource[];
}
```

---

## Expected Output Format

After optimization, prescriptions should include:

```typescript
{
  action: "Focus on the specific moment...",
  why_this_matters: {
    explanation: "Stanford values intellectual vitality...",
    sources: [
      {
        primary: true,
        source: { /* Richard Shaw quote */ },
        relevance: "Stanford's dean directly addresses this",
      },
      {
        primary: false,
        source: { /* Parke Muth quote */ },
        relevance: "General principle of specificity",
      },
      {
        primary: false,
        source: { /* Jeff Schiffman quote */ },
        relevance: "Explains why clichés fail",
      },
    ],
  },
  // ... rest of prescription
}
```

---

## Commands for Development

```bash
# Type check
npx tsc --noEmit

# Run specific test
set -a && source .env && set +a && npx tsx tests/test-integrated-citation-prescription.ts

# Run all citation tests
set -a && source .env && set +a && npx tsx tests/test-integrated-citation-prescription.ts && npx tsx tests/test-enhanced-prescription-integration.ts
```

---

## Summary

The current system works but is not optimized:

| Aspect | Current | Target |
|--------|---------|--------|
| Sources returned | 1 | 3-5 |
| Lookup method | Runtime keyword search | Pre-computed index |
| College specificity | Author name matching | Explicit labeling |
| Source diversity | Not guaranteed | Required |
| Multi-source support | No | Yes |

The next chat should focus on:
1. Adding labels to all 15 sources
2. Building pre-computed indices
3. Implementing smart multi-source selection
4. Ensuring college-specific prioritization
5. Adding source diversity requirements
