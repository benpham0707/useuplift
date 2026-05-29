# Citation System Optimization Plan

> **Purpose**: This document provides full context for optimizing the Uplift citation system. The goal is maximum efficiency, dynamic source matching, and college-specific prioritization while linking as many highly relevant sources as possible.

---

## Current System Overview

### Architecture Summary

The citation system consists of these interconnected components:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CITATION SYSTEM FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Essay Input                                                             │
│      │                                                                   │
│      ▼                                                                   │
│  ┌──────────────────┐     ┌─────────────────────┐                       │
│  │ SemanticCliche   │────▶│ ClicheIssue         │                       │
│  │ Analyzer         │     │ Integration         │                       │
│  └──────────────────┘     └─────────────────────┘                       │
│                                   │                                      │
│                                   ▼                                      │
│                           ┌─────────────────────┐                       │
│                           │ DeepPrescription    │                       │
│                           │ Generator           │                       │
│                           └─────────────────────┘                       │
│                                   │                                      │
│      ┌────────────────────────────┼────────────────────────────┐        │
│      │                            │                            │        │
│      ▼                            ▼                            ▼        │
│  ┌──────────────┐    ┌─────────────────────┐    ┌──────────────────┐   │
│  │ Citation     │    │ Provenance          │    │ Universal        │   │
│  │ Trigger      │    │ Citation            │    │ Citation         │   │
│  │ Detector     │    │ Selector            │    │ Engine           │   │
│  └──────────────┘    └─────────────────────┘    └──────────────────┘   │
│      │                            │                            │        │
│      └────────────────────────────┼────────────────────────────┘        │
│                                   ▼                                      │
│                           ┌─────────────────────┐                       │
│                           │ ProvenanceSource[]  │                       │
│                           │ (15 dean quotes +   │                       │
│                           │  Stanford provenance)│                       │
│                           └─────────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose | Location |
|------|---------|----------|
| `deepPrescriptionGenerator.ts` | Generates prescriptions with citations | `src/services/commonAppWorkshop/services/` |
| `clicheIssueIntegration.ts` | Bridges cliché analysis to issues | `src/services/commonAppWorkshop/services/` |
| `universalCitationEngine.ts` | Applies citations to any content | `src/services/commonAppWorkshop/services/` |
| `provenanceCitationSelector.ts` | Selects best citations for issues | `src/services/commonAppWorkshop/services/` |
| `citationTriggerDetector.ts` | Detects when citations are needed | `src/services/commonAppWorkshop/services/` |
| `stanfordProvenance.ts` | Stanford-specific value provenance | `src/services/commonAppWorkshop/data/provenanceData/` |
| `provenanceTypes.ts` | Type definitions for provenance | `src/services/commonAppWorkshop/types/` |

---

## Current Source Database

### ENHANCED_ADMISSIONS_SOURCES (15 sources)

Located in `deepPrescriptionGenerator.ts`:

| Source ID | Author | Institution | Topics |
|-----------|--------|-------------|--------|
| `muth_specificity_2022` | Parke Muth | UVA | Specificity, details |
| `guttentag_details_2023` | Christoph Guttentag | Duke | Authenticity, details |
| `shaw_authenticity_2023` | Richard Shaw | Stanford | Authentic voice |
| `fitzsimmons_reflection_2021` | William Fitzsimmons | Harvard | Reflection, self-awareness |
| `schiffman_invisible_phrases_2022` | Jeff Schiffman | Tulane | Cliché avoidance |
| `briggs_fresh_observations_2023` | Thyra Briggs | Harvey Mudd | Fresh language |
| `muth_show_dont_tell_2022` | Parke Muth | UVA | Showing vs telling |
| `flagel_trust_reader_2023` | Andrew Flagel | GMU | Trust the reader |
| `shaw_iv_priority_2023` | Richard Shaw | Stanford | Intellectual vitality |
| `guttentag_spark_2023` | Christoph Guttentag | Duke | Intellectual spark |
| `fitzsimmons_risk_2021` | William Fitzsimmons | Harvard | Taking risks |
| `briggs_vulnerability_2023` | Thyra Briggs | Harvey Mudd | Vulnerability |
| `fitzsimmons_effect_on_others_2023` | William Fitzsimmons | Harvard | Impact on others |
| `schmill_collaboration_2023` | Stu Schmill | MIT | Collaboration |
| `nondorf_intellectual_peer_2023` | James Nondorf | UChicago | Intellectual community |

### Current Matching Approach

```typescript
// Current keyword-based matching in getBestSourceForIssue()
const categoryKeywords: Record<string, string[]> = {
  cliche_topic_framing: ['invisible', 'fresh', 'specific', 'details'],
  cliche_narrative_arc: ['trust', 'concrete', 'show', 'fiction'],
  cliche_language: ['invisible', 'fresh', 'same', 'language'],
  cliche_ai_convergence: ['voice', 'authentic', 'genuine', 'hear'],
  // ... etc
};
```

**Problem**: This is a simple keyword search—not sophisticated enough for nuanced matching.

---

## Optimization Requirements

### 1. Pre-Labeling System (Source Taxonomy)

**Goal**: Pre-tag every source with structured metadata so matching is instant and precise.

```typescript
interface LabeledSource extends ProvenanceSource {
  // COLLEGE SPECIFICITY
  college_specificity: {
    primary_college: string | null;      // e.g., 'stanford', null for general
    applicable_colleges: string[];        // e.g., ['stanford', 'harvard', 'mit']
    exclusions: string[];                 // Colleges this should NOT be used for
  };

  // ISSUE TYPE MAPPING (pre-computed relevance)
  issue_relevance: {
    [issueType: string]: {
      score: number;                      // 0-100 pre-computed relevance
      aspect: 'problem' | 'solution' | 'principle' | 'example';
      keywords_matched: string[];
    };
  };

  // CONTENT TAXONOMY
  taxonomy: {
    primary_category: SourceCategory;     // e.g., 'authenticity', 'specificity'
    secondary_categories: SourceCategory[];
    teaching_moment_types: TeachingMomentType[];
    essay_section_relevance: EssaySectionType[];
  };

  // USAGE CONTEXT
  usage: {
    best_for: UsageContext[];             // e.g., ['explaining_problem', 'teaching_principle']
    tone: 'supportive' | 'challenging' | 'instructive' | 'inspiring';
    complexity: 'simple' | 'moderate' | 'advanced';
    student_facing: boolean;              // Safe to show directly to students?
  };
}

type SourceCategory =
  | 'authenticity'
  | 'specificity'
  | 'cliche_avoidance'
  | 'showing_vs_telling'
  | 'intellectual_vitality'
  | 'vulnerability'
  | 'impact_on_others'
  | 'collaboration'
  | 'intellectual_community'
  | 'fresh_perspective'
  | 'narrative_structure';

type TeachingMomentType =
  | 'why_this_matters'
  | 'how_to_fix'
  | 'what_to_avoid'
  | 'elite_example'
  | 'principle_explanation'
  | 'before_after';

type EssaySectionType =
  | 'opening'
  | 'body'
  | 'conclusion'
  | 'throughout';

type UsageContext =
  | 'explaining_problem'
  | 'justifying_severity'
  | 'teaching_principle'
  | 'proving_weight'
  | 'showing_elite_pattern'
  | 'motivating_student';
```

### 2. College-Specific vs General Source Logic

**Goal**: Prioritize college-specific sources while ensuring general wisdom is still available.

```typescript
interface SourceSelectionStrategy {
  // Priority order for source selection
  priority: [
    'college_primary',      // Dean from this exact college
    'college_applicable',   // Source marked as applicable to this college
    'peer_institution',     // Similar institution type
    'general_high_auth',    // General source with high authority
    'general_any'           // Any relevant general source
  ];

  // Minimum sources to return per category
  minimums: {
    college_specific: 1;    // Always try to include at least 1
    general: 1;             // Always include general wisdom too
  };

  // Maximum total sources
  max_total: 5;

  // College relationship mapping
  college_relationships: {
    stanford: {
      peer_institutions: ['mit', 'harvard', 'caltech'];
      similar_values: ['intellectual_vitality', 'innovation'];
    };
    harvard: {
      peer_institutions: ['yale', 'princeton', 'stanford'];
      similar_values: ['impact_on_others', 'leadership'];
    };
    mit: {
      peer_institutions: ['caltech', 'stanford', 'cmu'];
      similar_values: ['collaboration', 'problem_solving'];
    };
    uchicago: {
      peer_institutions: ['columbia', 'yale', 'northwestern'];
      similar_values: ['intellectual_community', 'inquiry'];
    };
  };
}
```

### 3. Dynamic Pattern Detection

**Goal**: Move beyond keyword matching to semantic understanding of when sources apply.

```typescript
interface PatternMatcher {
  // Pattern types to detect in feedback/issues
  patterns: {
    // Structural patterns
    weight_claim: RegExp[];           // "Stanford weighs X at Y%"
    severity_statement: RegExp[];     // "This is critical because..."
    elite_pattern_reference: RegExp[]; // "87% of successful essays..."
    teaching_moment: RegExp[];        // "The principle here is..."

    // Semantic patterns (require NLP/embedding)
    concepts: {
      authenticity: string[];         // Concept keywords
      specificity: string[];
      showing_vs_telling: string[];
      // etc.
    };
  };

  // Match patterns to sources
  matchPatternToSources(
    text: string,
    pattern_type: string,
    college_id: string
  ): ScoredSource[];
}
```

### 4. Multi-Source Linking Strategy

**Goal**: Link as many highly relevant sources as possible (not just one).

```typescript
interface MultiSourceStrategy {
  // For each piece of feedback, provide:
  sources_per_feedback: {
    primary: ProvenanceSource;        // Most relevant source
    supporting: ProvenanceSource[];   // 1-3 additional sources
    college_specific: ProvenanceSource | null;
    general_principle: ProvenanceSource | null;
  };

  // Relevance thresholds
  thresholds: {
    primary_min_score: 80;            // Must be highly relevant
    supporting_min_score: 60;         // Good relevance
    include_if_college_match: true;   // Always include if college matches
  };

  // Diversity requirements
  diversity: {
    max_same_author: 2;               // Don't over-rely on one person
    prefer_different_institutions: true;
    mix_theoretical_and_practical: true;
  };
}
```

---

## Implementation Plan

### Phase 1: Pre-Label All Sources

1. **Audit existing sources** in `ENHANCED_ADMISSIONS_SOURCES`
2. **Create `LabeledSource` interface** with full taxonomy
3. **Convert all 15 sources** to labeled format
4. **Add source validation** to ensure all labels are complete

### Phase 2: Build Efficient Lookup System

1. **Create pre-computed index** structures:
   ```typescript
   // Index by college
   sourcesByCollege: Map<string, LabeledSource[]>

   // Index by issue type
   sourcesByIssueType: Map<string, LabeledSource[]>

   // Index by category
   sourcesByCategory: Map<SourceCategory, LabeledSource[]>

   // Index by teaching moment type
   sourcesByTeachingMoment: Map<TeachingMomentType, LabeledSource[]>
   ```

2. **Build at startup** (not runtime)
3. **Cache in memory** for instant access

### Phase 3: Implement Smart Selection

1. **Create `SmartSourceSelector` class**:
   ```typescript
   class SmartSourceSelector {
     // Get best sources for an issue + college
     selectForIssue(issue: CriticalIssue, collegeId: string): SourceBundle;

     // Get sources for a specific teaching moment
     selectForTeaching(moment: TeachingMomentType, collegeId: string): SourceBundle;

     // Get sources for weight proof
     selectForWeightProof(valueId: string, collegeId: string): SourceBundle;
   }

   interface SourceBundle {
     primary: LabeledSource;
     supporting: LabeledSource[];
     formatted: {
       inline: string;           // For embedding in text
       tooltip: string;          // For hover display
       full: string;             // For expanded view
     };
   }
   ```

2. **Implement college-specific prioritization**
3. **Ensure diversity in source selection**

### Phase 4: Integration & Testing

1. **Update `deepPrescriptionGenerator.ts`** to use new system
2. **Update `clicheIssueIntegration.ts`** to pass college context
3. **Update `universalCitationEngine.ts`** to use pre-labeled sources
4. **Create comprehensive tests**

---

## Specific Tasks

### Task 1: Source Labeling

For each source in `ENHANCED_ADMISSIONS_SOURCES`, add:

```typescript
{
  source_id: 'shaw_authenticity_2023',
  // ... existing fields ...

  // NEW: Add these fields
  college_specificity: {
    primary_college: 'stanford',
    applicable_colleges: ['stanford'],
    exclusions: [],
  },
  issue_relevance: {
    'cliche_ai_convergence': { score: 95, aspect: 'principle', keywords_matched: ['voice', 'authentic'] },
    'cliche_language': { score: 80, aspect: 'principle', keywords_matched: ['voice'] },
    'cliche_topic_framing': { score: 70, aspect: 'principle', keywords_matched: ['authentic'] },
  },
  taxonomy: {
    primary_category: 'authenticity',
    secondary_categories: ['fresh_perspective'],
    teaching_moment_types: ['why_this_matters', 'principle_explanation'],
    essay_section_relevance: ['throughout'],
  },
  usage: {
    best_for: ['explaining_problem', 'teaching_principle'],
    tone: 'supportive',
    complexity: 'moderate',
    student_facing: true,
  },
}
```

### Task 2: Build Index System

Create `src/services/commonAppWorkshop/services/sourceIndexer.ts`:

```typescript
class SourceIndexer {
  private byCollege: Map<string, LabeledSource[]>;
  private byIssueType: Map<string, LabeledSource[]>;
  private byCategory: Map<SourceCategory, LabeledSource[]>;

  constructor(sources: LabeledSource[]) {
    this.buildIndices(sources);
  }

  private buildIndices(sources: LabeledSource[]): void {
    // Build all indices once at construction
  }

  getForCollege(collegeId: string): LabeledSource[] { }
  getForIssueType(issueType: string): LabeledSource[] { }
  getForCategory(category: SourceCategory): LabeledSource[] { }
}
```

### Task 3: Smart Selector Implementation

Create `src/services/commonAppWorkshop/services/smartSourceSelector.ts`:

```typescript
class SmartSourceSelector {
  private indexer: SourceIndexer;

  selectForIssue(
    issue: CriticalIssue,
    collegeId: string,
    options?: SelectionOptions
  ): SourceBundle {
    // 1. Get college-specific sources first
    // 2. Get issue-type matched sources
    // 3. Score and rank all candidates
    // 4. Apply diversity requirements
    // 5. Format and return bundle
  }
}
```

### Task 4: Update Existing Integration

Modify `deepPrescriptionGenerator.ts`:

```typescript
// Replace getBestSourceForIssue() with:
export function getSourcesForIssue(
  issueType: string,
  collegeId: string
): SourceBundle {
  const selector = new SmartSourceSelector();
  return selector.selectForIssue(
    { symptom_type: issueType } as CriticalIssue,
    collegeId
  );
}
```

---

## Quality Checks

### 1. College-Specific Source Validation

```typescript
function validateCollegeSpecificity(): ValidationResult {
  // Ensure Stanford sources only appear for Stanford
  // Ensure Harvard sources only appear for Harvard
  // etc.
}
```

### 2. Source Coverage Check

```typescript
function checkSourceCoverage(): CoverageReport {
  // Every issue type has at least 2 relevant sources
  // Every college has at least 1 primary source
  // No issue type has 0 sources
}
```

### 3. Relevance Score Validation

```typescript
function validateRelevanceScores(): ValidationResult {
  // No source has all 0 scores
  // Primary college sources have highest scores for their college
  // Scores are distributed (not all 50s)
}
```

---

## Expected Outcomes

### Before Optimization

- Simple keyword matching
- Single source returned
- No college prioritization
- Runtime computation

### After Optimization

- Pre-labeled taxonomy matching
- Multiple relevant sources returned
- College-specific prioritization
- Pre-computed indices
- Rich source bundles with formatted output

### Metrics to Track

| Metric | Before | Target |
|--------|--------|--------|
| Sources per issue | 1 | 3-5 |
| College-specific source rate | ~30% | 80%+ |
| Source lookup time | ~10ms | <1ms |
| Source diversity (unique authors) | 1 | 2-3 |
| Student-facing formatting | Basic | Rich |

---

## Files to Modify

1. **`deepPrescriptionGenerator.ts`** - Add labeled sources, update selection
2. **NEW: `sourceIndexer.ts`** - Pre-computed source indices
3. **NEW: `smartSourceSelector.ts`** - Intelligent source selection
4. **NEW: `labeledSourceTypes.ts`** - Type definitions for labels
5. **`clicheIssueIntegration.ts`** - Pass college context throughout
6. **`universalCitationEngine.ts`** - Use new selector

---

## Test Files to Create

1. `test-source-labeling-validation.ts` - Validate all sources are properly labeled
2. `test-college-specific-selection.ts` - Verify college prioritization
3. `test-multi-source-diversity.ts` - Ensure diverse sources returned
4. `test-source-coverage.ts` - Every issue type has sources
5. `test-selection-performance.ts` - Benchmark lookup speed

---

## Summary for Next Chat

**Your Task**: Optimize the citation system for maximum efficiency and relevance.

**Key Goals**:
1. Pre-label all sources with structured taxonomy
2. Build pre-computed indices for instant lookup
3. Implement college-specific prioritization
4. Return multiple relevant sources (not just one)
5. Ensure diversity in source selection
6. Validate college-specific sources stay college-specific

**Starting Points**:
- Read `src/services/commonAppWorkshop/services/deepPrescriptionGenerator.ts`
- Read `src/services/commonAppWorkshop/services/provenanceCitationSelector.ts`
- Read `src/services/commonAppWorkshop/types/provenanceTypes.ts`

**Quality Standard**: Every student should feel like our system has deeply researched their specific college and provides credible, authoritative sources for every piece of advice.
