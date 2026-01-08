# Show Don't Tell: System-Wide Enhancement Plan

> **Document Purpose**: This plan outlines how deep research on "Show Don't Tell" can enhance the ENTIRE Uplift system beyond just citations—including scoring, cliché detection, suggestion generation, and teaching methodology.

---

## Executive Summary

The Perplexity deep research on "Show Don't Tell" reveals not just citation material, but **foundational frameworks** that can transform how we:
1. **Detect** problems (65+ telling phrases identified)
2. **Score** essays (sensory density, specificity spectrum metrics)
3. **Generate** suggestions (five core craft moves, transformation techniques)
4. **Teach** students (minimum viable scene, iceberg theory)

This document maps research insights to specific system components.

---

## Part 1: Citation System Integration

### New EnhancedLabeledSource Entries to Create

From the research, we extract **18 new high-value citeable sources**:

#### A. Admissions Officer Direct Quotes (Highest Authority)

| Source ID | Author | Key Quote | Best Use |
|-----------|--------|-----------|----------|
| `ao_yale_landesman` | Marcia Landesman, Yale | "The personal statement is their absolute favorite part... your chance to say, 'Hello, this is me'" | Authentic voice teaching |
| `ao_michigan_bryant` | Kim Bryant, Michigan | "I like reading a personal story tied to real life... Storytellers are always good" | Narrative value |
| `ao_uva_lenox` | Macy Lenox, UVA | "Write from the heart. Some of the worst essays were well-written but voice was lost through editing" | Over-editing warning |
| `ao_unc_davis` | Michael Davis, UNC | "The essay is a unique opportunity to share your story... what is meaningful to you" | Authenticity principle |
| `ao_mit_peterson` | Chris Peterson, MIT | "Which essay will readers remember? Mr. Vu with his bill... you can't afford vague terms" | Specificity teaching |

#### B. Expert Framework Sources

| Source ID | Author | Framework | Application |
|-----------|--------|-----------|-------------|
| `ceg_five_craft_moves` | College Essay Guy | Five Craft Moves (Sensory, Names, Verbs, Stats, Emotional) | Transformation technique |
| `ceg_specifics_spectrum` | College Essay Guy | Good → Better → Best (HD Quality) progression | Revision guidance |
| `storm_scene_vs_summary` | Storm Writing School | Scene = unit of conflict lived through; Summary = compressed | Definition clarity |
| `hemingway_iceberg` | Hemingway | "Seven-eighths underwater for every part that shows" | Advanced technique |

#### C. Neuroscience-Backed Insights

| Source ID | Finding | Application |
|-----------|---------|-------------|
| `neuro_mirror_neurons` | Mirror neurons fire when reading action descriptions | Why showing works |
| `neuro_empathy_regions` | Anterior insula + ACC activate for sensory emotional descriptions | Sensory detail importance |
| `neuro_memory_encoding` | Sensory-rich narratives engage amygdala → enhanced memory | Why AOs remember |

#### D. Research Findings

| Source ID | Statistic | Application |
|-----------|-----------|-------------|
| `research_burnout_43` | 43% AOs report team exhaustion during peak cycles | Context for brevity |
| `research_cliche_30_50` | 30-50% essays use same cliché phrases | Problem severity |
| `research_forgettable_3x` | Essays opening with telling phrases 3x more likely "forgettable" | Opening importance |

---

## Part 2: Cliché Detection Enhancement

### New Telling Phrases to Add (65+ Identified)

The research identifies specific phrases categorized by failure type:

#### Category 1: Abstract Value Claims (ADD TO CLICHÉ PATTERNS)
```typescript
const ABSTRACT_VALUE_CLAIMS = [
  "I'm passionate about",
  "I love [activity]",
  "My passion is",
  "I'm committed to",
  "I'm deeply dedicated to",
  "I have a deep interest in",
  "I'm fascinated by",
];
```

#### Category 2: Growth Statement Clichés (ADD TO CLICHÉ PATTERNS)
```typescript
const GROWTH_STATEMENT_CLICHES = [
  "This experience changed me",
  "I learned resilience",
  "I grew as a person",
  "It taught me the importance of",
  "I gained a new perspective on",
  "This opened my eyes to",
  "I realized that",
  "I learned that",
  "I discovered",
  "This experience made me who I am today",
];
```

#### Category 3: Emotion Labels (ADD TO TELLING PATTERNS)
```typescript
const EMOTION_LABEL_PATTERNS = [
  "I was nervous",
  "I felt excited",
  "I was scared",
  "I was happy",
  "I was sad",
  "I was angry",
  "It made me feel",
  "I experienced [emotion]",
];
```

#### Category 4: Generic Descriptors (ADD TO CLICHÉ PATTERNS)
```typescript
const GENERIC_SELF_DESCRIPTORS = [
  "hard-working",
  "determined",
  "creative",
  "good leader",
  "team player",
  "strong communicator",
  "detail-oriented",
];
```

#### Category 5: Opening Clichés (HIGH PRIORITY)
```typescript
const OPENING_CLICHES = [
  "Ever since I was young",
  "Little did I know",
  "At the end of the day",
  "From a young age",
  "I have always",
  "Growing up",
  "Throughout my life",
];
```

### Implementation: Update `semanticClicheAnalyzer.ts`

Add new pattern categories:
1. `TELLING_PHRASES` - Direct telling without showing
2. `EMOTION_LABELS` - Named emotions without physical manifestation
3. `ABSTRACT_CLAIMS` - Assertions without evidence

---

## Part 3: Scoring System Enhancement

### New Metrics to Add

#### 3.1 Sensory Detail Density Score

**Research basis**: "1-2 sensory details per 100 words (optimal range)"

```typescript
interface SensoryDensityScore {
  visualDetails: number;      // Sight-based descriptions
  tactileDetails: number;     // Touch/physical sensations
  auditoryDetails: number;    // Sound descriptions
  olfactoryDetails: number;   // Smell references
  gustatoryDetails: number;   // Taste references
  totalDensity: number;       // Per 100 words
  optimalRange: boolean;      // Is 1-2 per 100 words?
}
```

**Implementation location**: Add to `narrativeWorkshop/analyzers/symptomDiagnoser.ts`

#### 3.2 Specificity Spectrum Score

**Research basis**: College Essay Guy's "Specifics Spectrum"

```typescript
interface SpecificityScore {
  level: 'general' | 'moderate' | 'hd_quality';
  score: number;  // 0-10
  markers: {
    hasProperNouns: boolean;      // Names of people, places
    hasSpecificNumbers: boolean;  // Quantities, dates, times
    hasUniqueDetails: boolean;    // "Only you would know" details
    hasVerifiableInfo: boolean;   // Can be cross-referenced
  };
}
```

**Scoring rubric**:
- **0-3 (General)**: "I'm committed to oncology"
- **4-6 (Moderate)**: "I want to specialize in pediatric oncology"
- **7-10 (HD Quality)**: "I shadow Dr. Abdullah in pediatric oncology at Grand Kenyon Hospital"

#### 3.3 Show-Tell Ratio Score

**Research basis**: "80% showing, 20% strategic telling (optimal)"

```typescript
interface ShowTellRatio {
  showingPercentage: number;
  tellingPercentage: number;
  isOptimal: boolean;  // 75-85% showing
  tellingInstances: Array<{
    text: string;
    location: number;
    isStrategic: boolean;  // Telling after showing for clarity
  }>;
}
```

#### 3.4 Concrete-to-Abstract Noun Ratio

**Research basis**: "70%+ concrete nouns vs. abstract nouns"

```typescript
interface ConcreteAbstractRatio {
  concreteNouns: string[];   // Target, Mount St. Helens, PopTarts
  abstractNouns: string[];    // passion, excellence, growth
  ratio: number;              // Target: >70% concrete
  isOptimal: boolean;
}
```

---

## Part 4: Suggestion Generation Enhancement

### 4.1 Transformation Technique Framework

The research provides specific **before/after transformation patterns**:

#### Five Craft Moves Transformation Engine

```typescript
interface TransformationSuggestion {
  original: string;
  problem: 'telling' | 'abstract' | 'emotion_label' | 'generic';
  transformationTechnique: CraftMove;
  promptSequence: string[];
  exampleTransformation: {
    before: string;
    after: string;
  };
}

type CraftMove =
  | 'sensory_details'      // Add sight, sound, touch, smell, taste
  | 'specific_names'       // Add proper nouns (people, places, things)
  | 'active_verbs'         // Replace passive/weak verbs
  | 'statistics_data'      // Add concrete numbers
  | 'emotional_language';  // Physical manifestation of emotion
```

#### Transformation Prompt Sequences (From Research)

For "I learned resilience":
1. "Can you remember one specific moment where you wanted to quit but didn't?"
2. "What did your body feel like in that moment?"
3. "What specific action did you take to push through?"
4. "What did that teach you? (Keep to 1 sentence)"

For "I'm passionate about science":
1. "What's the most specific science topic you've explored?"
2. "Name the exact articles, researchers, or concepts you've studied"
3. "Describe a moment when you lost track of time exploring this"

### 4.2 Minimum Viable Scene Generator

**For short-form essays (150-300 words)**:

```typescript
interface MinimumViableScene {
  components: {
    concreteAction: string;       // One specific thing happening
    sensoryDetail: string;        // One grounding sensory element
    specificProperNoun: string;   // Name, place, or number
    emotionalStakes: string;      // Why this matters
    implicitSignificance: string; // What reader infers (not stated)
  };
  targetWordCount: number;  // 40-80 words for core scene
}
```

### 4.3 Iceberg Theory Application

**When to apply** (from research):
- Word count extremely limited (50-150 words)
- Showing obvious emotions
- Demonstrating commonly understood values

**When NOT to apply**:
- Unusual interpretations requiring explanation
- Complex intellectual growth
- Counterintuitive lessons

---

## Part 5: Teaching Methodology Enhancement

### 5.1 Pedagogical Sequencing (4 Stages)

**Stage 1: Pre-Writing** (Already have: BEABIES)
- Feelings and Needs Exercise
- Values Exercise linking to specific moments

**Stage 2: First Draft Freedom**
- Allow telling in first drafts (cognitive ease principle)
- Encourage overwriting to select from

**Stage 3: Systematic Revision** (NEW - Add to Workshop)
1. Highlighter test: Flag all telling phrases
2. Sensory audit: Add 1+ sensory detail per paragraph
3. Proper noun check: Add specific names/places/numbers
4. Active verb substitution: Replace "is/was/has been"
5. Reader memory test: Would someone remember this 3 hours later?

**Stage 4: Compression** (For short supplements)
1. Calculate density score: 3-4 specific details per 50 words
2. Eliminate throat-clearing phrases
3. Convert sentences to phrases where possible
4. Juxtaposition check: Do placed details create implied meaning?

### 5.2 Revision Strategy Templates

Add to suggestion generation:

```typescript
const REVISION_STRATEGIES = {
  highlighter_test: {
    instruction: "Highlight all general telling phrases. Then convert each to a specific example.",
    example: "'I am a curious person' → 'I asked Professor Esbaugh what surprised him most from his fish physiology research'"
  },

  i_am_audit: {
    instruction: "Search for 'I am,' 'I was,' 'I have,' 'I learned.' These often signal telling.",
    trigger_phrases: ['I am', 'I was', 'I have', 'I learned', 'I realized']
  },

  specifics_spectrum: {
    instruction: "Push each claim up the spectrum: Vague → Moderate → HD Quality",
    example: "'I volunteer' → 'I volunteer at a hospital' → 'I shadow Dr. Abdullah in pediatric oncology'"
  },

  reader_memory_test: {
    instruction: "Would a reader remember this detail 3 hours later? If not, add specific imagery.",
    rationale: "Sensory-rich content activates more brain regions, creating multiple memory pathways"
  }
};
```

---

## Part 6: Implementation Priority

### High Priority (Implement First)
1. **Add telling phrase patterns to cliché detector** - Direct impact on diagnosis
2. **Create new AO quote sources** - High-authority citations
3. **Add specificity spectrum scoring** - Measurable improvement metric

### Medium Priority (Implement Second)
4. **Sensory density scoring** - Quantifiable showing metric
5. **Transformation prompt sequences** - Better suggestion quality
6. **Before/after examples database** - Teaching material

### Lower Priority (Implement Third)
7. **Minimum viable scene framework** - Short essay guidance
8. **Iceberg theory application rules** - Advanced technique
9. **Pedagogical sequencing updates** - Workshop flow changes

---

## Part 7: File Mapping

| Enhancement | Target File(s) |
|-------------|----------------|
| New citation sources | `data/universalSources.ts` (add section) |
| Telling phrase patterns | `services/semanticClicheAnalyzer.ts` |
| Sensory density scoring | `analyzers/symptomDiagnoser.ts` |
| Specificity spectrum | `services/typeSpecificSuggestionService.ts` |
| Transformation prompts | `services/deepPrescriptionGenerator.ts` |
| Before/after examples | NEW: `data/transformationExamples.ts` |
| Revision strategies | `services/stage1BDiagnosisService.ts` |

---

## Appendix: Key Research Quotes for Reference

### On Why Showing Works (Neuroscience)
> "Mirror neurons fire when readers encounter descriptions of actions—the same brain cells that activate when performing those actions. Reading 'trembling hands' causes readers' motor cortex regions for hand movement to activate."

### On Sensory Detail Balance
> "Each sensory detail should be one to three sentences. If sensory descriptions run several paragraphs, they need to be cut down."

### On Admissions Officer Fatigue
> "43% of admissions professionals reported team exhaustion during peak cycles. Officers read applications for 4+ hours daily, reviewing thousands of essays annually."

### On The Paradox of Specificity
> "The most counterintuitive truth: the more specific you are about YOUR experience, the more universally relatable it becomes. Generic statements connect with no one."

### On Strategic Telling
> "'Show, don't tell' is generally great advice, but in college essays, it can be nice to include small 'telling' statements after you've used rich detail to show us."
