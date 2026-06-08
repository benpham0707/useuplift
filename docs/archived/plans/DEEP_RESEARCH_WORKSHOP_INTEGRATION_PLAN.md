# Deep Research Workshop Integration Plan

> **Purpose**: Integrate the extensive deep research database into the Workshop Chat system to provide research-backed, contextual coaching guidance.
>
> **Created**: January 2025

---

## Executive Summary

The Uplift system has an extensive deep research database with **6 integrated research batches** containing **100+ expert sources**. Currently, this knowledge is used for **citations** but is not fully leveraged for **active coaching guidance** in the Workshop Chat system.

This plan outlines how to integrate these research-backed techniques into the workshop system to:
1. Provide **contextual technique selection** based on issue type
2. Embed **research-backed principles** into coaching prompts
3. Enable **intelligent source referencing** when teaching techniques
4. Enhance **coaching quality** with proven writing strategies

---

## Current State

### Available Research Resources

| Resource | Location | Content |
|----------|----------|---------|
| **6 Core Writing Principles** | `writingPrinciples.ts` | Specificity, Voice, Action, Tension, Insight, Structure |
| **14 Essay Type Frameworks** | `writingPrinciples.ts` | Type-specific reader questions, success principles, pitfalls |
| **7 Performative Indicators** | `writingPrinciples.ts` | Red flags for fake/performative writing |
| **Show Don't Tell Sources** | `showDontTellSources.ts` | 19+ sources on narrative showing techniques |
| **Emotional Intelligence Sources** | `emotionalIntelligenceSources.ts` | 35+ sources on vulnerability, authenticity |
| **Intellectual Depth Sources** | `intellectualDepthSources.ts` | Stanford IV, MIT, Harvard frameworks |
| **Prose Quality Sources** | `proseQualitySources.ts` | Sentence craft, rhythm, voice development |
| **Essay Openings Sources** | `essayOpeningsSources.ts` | Hook techniques, first impression science (8-second rule) |
| **Essay Endings Sources** | `essayEndingsSources.ts` | Peak-end rule, closure techniques, circular return |

### Current Workshop System

The `workshopChatMode.ts` has:
- `getFixApproachForIssueType()` - Maps issues to coaching approaches (6 categories)
- System prompt templates for technique teaching
- Suggestion mode for Stage 2 implementation
- Welcome message generation with adaptive content

**Gap**: The coaching approaches use hard-coded principles without drawing from the rich research database.

---

## Integration Architecture

### Phase 1: Enhanced Issue-to-Technique Mapping

**Goal**: Connect each issue type to relevant research sources and principles.

```typescript
// NEW: IssueTypeResearchMapping interface
interface IssueTypeResearchMapping {
  issueType: string;

  // From writingPrinciples.ts
  relevantCorePrinciples: string[];  // e.g., ['specificity_creates_trust', 'voice_reveals_character']

  // From source batches
  primarySourceBatch: string;  // e.g., 'opening_lines', 'emotional_intelligence'
  relevantSourceIds: string[];  // Specific sources to reference

  // Teaching approach
  teachingApproach: {
    description: string;
    keyPrinciples: string[];  // Research-backed
    socraticPrompts: string[];  // From research
    techniqueExamples: string[];  // From source examples
  };

  // Anti-patterns from research
  redFlags: string[];  // From PERFORMATIVE_INDICATORS
}
```

### Phase 2: Research-Backed Technique Selector

**Goal**: Create a service that retrieves relevant techniques and sources based on issue type.

```typescript
// NEW: ResearchBackedTechniqueSelector class
class ResearchBackedTechniqueSelector {
  /**
   * Get techniques and sources for a specific issue type
   */
  getTechniquesForIssue(issueType: string, essayType?: SupplementalType): {
    corePrinciples: WritingPrinciple[];
    typeSpecificGuidance: TypeSpecificPrinciple;
    relevantSources: EnhancedLabeledSource[];
    performativeWarnings: PerformativeIndicator[];
    teachingApproach: TeachingApproach;
  };

  /**
   * Get opening-specific techniques
   */
  getOpeningTechniques(): {
    scienceOfFirstImpressions: EnhancedLabeledSource[];
    techniquesThatWork: EnhancedLabeledSource[];
    techniquesThatFail: EnhancedLabeledSource[];
    aoInsights: EnhancedLabeledSource[];
  };

  /**
   * Get ending-specific techniques
   */
  getEndingTechniques(): {
    peakEndRule: EnhancedLabeledSource[];
    circularReturn: EnhancedLabeledSource[];
    forwardMomentum: EnhancedLabeledSource[];
    whatToAvoid: EnhancedLabeledSource[];
  };

  /**
   * Get intellectual depth techniques (for Why Major, technical essays)
   */
  getIntellectualDepthTechniques(): {
    institutionalFrameworks: EnhancedLabeledSource[];  // Stanford IV, MIT, Harvard
    complexityNuance: EnhancedLabeledSource[];
    criticalThinking: EnhancedLabeledSource[];
    systemsAwareness: EnhancedLabeledSource[];
  };
}
```

### Phase 3: Enhanced System Prompts

**Goal**: Embed research-backed guidance directly into workshop system prompts.

```typescript
// Enhanced getFixApproachForIssueType() with research integration
private getFixApproachForIssueType(
  problemSummary: string,
  essayType?: SupplementalType
): FixApproach {

  const techniqueSelector = new ResearchBackedTechniqueSelector();
  const issueType = this.detectIssueType(problemSummary);

  // Get research-backed guidance
  const { corePrinciples, relevantSources, typeSpecificGuidance } =
    techniqueSelector.getTechniquesForIssue(issueType, essayType);

  // Build approach with research backing
  return {
    description: this.buildDescription(issueType, corePrinciples),
    step2: this.buildStep2(issueType, relevantSources),
    principles: corePrinciples.flatMap(p => p.valid_approaches.slice(0, 2)),
    startingQuestion: this.buildSocraticPrompt(issueType, relevantSources),

    // NEW: Research backing
    researchContext: {
      sourceToQuote: relevantSources[0],  // Best matching source
      readerEffect: corePrinciples[0]?.reader_effect,
      misconceptions: corePrinciples[0]?.misconceptions,
    },
  };
}
```

---

## Issue Type to Research Mapping

### 1. WEAK OPENING / HOOK Issues

**Primary Sources**: `essayOpeningsSources.ts`

| Technique | Source ID | Key Insight |
|-----------|-----------|-------------|
| In Medias Res | `opening_technique_in_medias_res` | Drop into action, bypass exposition |
| Sensory Immersion | `opening_technique_sensory_immersion` | 60% of elite essays use sensory openings |
| 8-Second Rule | `opening_science_attention_span` | First 17 words determine engagement |
| Thin-Slicing | `opening_science_thin_slicing` | Judgments form in 2-10 seconds |

**Principles to Embed**:
- Lead with tension, conflict, or surprise
- Drop readers into a moment, not an explanation
- First sentence determines if AO reads carefully or skims

**Research Quote to Include**:
> "At highly selective schools, 90 seconds or less may be devoted to the first-round reading, with the first few sentences being 'immensely telling' about whether an applicant's voice resonates." - The Ivy Institute

### 2. WEAK CLOSING / ENDING Issues

**Primary Sources**: `essayEndingsSources.ts`

| Technique | Source ID | Key Insight |
|-----------|-----------|-------------|
| Peak-End Rule | `ending_science_peak_end_rule` | People judge by emotional peak + ending |
| Circular Return | `ending_technique_circular_return` | Echo opening, show transformation |
| AO Reading Patterns | `ending_science_ao_reading_patterns` | AOs skim first/last paragraphs first |
| Understatement | `ending_technique_understatement` | Less is more in conclusions |

**Principles to Embed**:
- End with resonance, not summary
- Show transformation through echoed elements
- Leave space for reader interpretation

**Research Quote to Include**:
> "Many readers skim the first and last paragraphs and will only revisit the body if those sections grab their attention." - Rick Clark, Georgia Tech

### 3. GENERIC INSIGHT Issues

**Primary Sources**: `intellectualDepthSources.ts`

| Technique | Source ID | Key Insight |
|-----------|-----------|-------------|
| Comfort with Ambiguity | `id_paradox_framework` | Don't force resolution |
| Premature Resolution | `id_premature_resolution` | Leave ongoing questions |
| Interesting vs Impressive | `id_duke_dean_interesting` | Be interesting, not impressive |

**Principles to Embed**:
- Insights must be earned through specific experience
- Embrace complexity, avoid forced conclusions
- Show the thinking process, not just the conclusion

**Research Quote to Include**:
> "Rather than concluding with simplistic lessons, strong essays leave space for ongoing questions. Essays should show 'you've wrestled with hard questions' without needing to 'have all the answers'." - Stanford Admissions Officer

### 4. TECHNICAL DEPTH / WHY MAJOR Issues

**Primary Sources**: `intellectualDepthSources.ts`

| Technique | Source ID | Key Insight |
|-----------|-----------|-------------|
| Stanford IV | `id_stanford_iv_separate` | 69% of perfect SAT scores rejected |
| MIT Exploration | `id_mit_dean_schmill` | Passion for unknown > credentials |
| IQ vs Vitality | `id_iq_vs_vitality` | Intelligence ≠ intellectual vitality |

**Principles to Embed**:
- Show existing engagement, not just future interest
- Demonstrate intellectual curiosity through specifics
- Name specific concepts, projects, or questions

**Research Quote to Include**:
> "Stanford uniquely employs a dedicated 'Intellectual Vitality (IV)' rating independent of academic metrics. This criterion is used specifically to 'weed out countless 4.0 students who lack a true love of learning'." - Stanford Admissions

### 5. PASSIVE AGENCY / STORYTELLING Issues

**Primary Sources**: `showDontTellSources.ts`, `emotionalIntelligenceSources.ts`

| Principle | Source | Key Insight |
|-----------|--------|-------------|
| Specificity Creates Trust | Core Principles | Vague language triggers skepticism |
| Show Action Not Reflection | Core Principles | Colleges want students who DO things |
| Earned Vulnerability | EI Sources | Vulnerability without performance |

**Principles to Embed**:
- A specific moment instead of a general claim
- Visible action, not just internal feeling
- A choice that reveals character

### 6. IMPACT / CONTRIBUTION Issues

**Primary Sources**: `emotionalIntelligenceSources.ts`

**Principles to Embed**:
- Specific numbers or outcomes over vague claims
- Show what changed because of your actions
- Impact on real people or real systems

---

## Implementation Plan

### Step 1: Create Technique Selector Service

**File**: `src/services/commonAppWorkshop/services/researchTechniqueSelector.ts`

```typescript
/**
 * Research-Backed Technique Selector
 *
 * Connects issue types to relevant research sources and principles
 * for enhanced workshop coaching.
 */

import {
  CORE_WRITING_PRINCIPLES,
  TYPE_SPECIFIC_PRINCIPLES,
  PERFORMATIVE_INDICATORS,
  getCorePrinciple,
  getTypePrinciples,
} from '../rubrics/writingPrinciples';

import {
  ESSAY_OPENINGS_SOURCES,
  ESSAY_ENDINGS_SOURCES,
  ALL_INTELLECTUAL_DEPTH_SOURCES,
  ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  ALL_SHOW_DONT_TELL_SOURCES,
  ALL_PROSE_QUALITY_SOURCES,
} from '../data/sourceRegistry';

export class ResearchTechniqueSelector {
  // Implementation...
}
```

### Step 2: Enhance getFixApproachForIssueType()

Modify `workshopChatMode.ts` to:
1. Import the technique selector
2. Use research-backed principles in each approach
3. Include relevant source quotes in teaching

### Step 3: Update System Prompts

Enhance system prompts to include:
1. Research-backed "why this matters" sections
2. Expert quotes from relevant sources
3. Common misconceptions from research
4. Type-specific guidance for essay types

### Step 4: Add Research Context to Welcome Messages

Update welcome messages to include:
1. Relevant research insight (not too long)
2. Why this technique works (from sources)
3. Common pitfalls (from performative indicators)

---

## Mapping: Issue Types to Research Sources

| Issue Category | Primary Sources | Core Principles | Key Techniques |
|----------------|-----------------|-----------------|----------------|
| **Weak Hook** | `essayOpeningsSources` | Tension, Specificity | In medias res, sensory immersion |
| **Weak Closing** | `essayEndingsSources` | Structure, Insight | Circular return, forward momentum |
| **Generic Insight** | `intellectualDepthSources` | Insight, Voice | Comfort with ambiguity |
| **Technical Depth** | `intellectualDepthSources` | Specificity, Insight | Show existing engagement |
| **Passive Agency** | `showDontTellSources` | Action, Specificity | Scene construction, agency |
| **Impact Claims** | `emotionalIntelligenceSources` | Specificity | Evidence-based impact |
| **Telling Not Showing** | `showDontTellSources` | Specificity, Action | Sensory details, moments |
| **Cliche Language** | `proseQualitySources` | Voice, Specificity | Personal word choices |
| **Performative Writing** | `PERFORMATIVE_INDICATORS` | Voice, Authenticity | All red flags |

---

## Success Metrics

1. **Coaching Quality**: Workshop responses reference specific research when teaching techniques
2. **Contextual Relevance**: Techniques provided match the specific issue type
3. **Research Utilization**: All 6 research batches actively used in coaching
4. **Student Outcomes**: Improved essay revisions based on research-backed guidance

---

## Next Steps

1. [ ] Create `researchTechniqueSelector.ts` service
2. [ ] Update `getFixApproachForIssueType()` with research integration
3. [ ] Enhance system prompts with research context
4. [ ] Update welcome message generation
5. [ ] Create tests to validate technique selection
6. [ ] Test with diverse scenarios to ensure proper mapping

---

*This plan should be updated as implementation progresses.*
