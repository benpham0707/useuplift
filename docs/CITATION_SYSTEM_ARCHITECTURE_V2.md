# Citation System Architecture V2

## Problem Statement

The current citation system has critical gaps that prevent reliable, accurate source attribution:

### Current Gaps Identified

1. **Missing Universal Sources** - No sources for advice that applies to ALL essays
2. **No Prompt-Type Differentiation** - Can't distinguish personal statement advice from "Why X" essay advice
3. **10 Major Colleges Missing** - Yale, Princeton, Columbia, Penn, Brown, Dartmouth, Cornell, Caltech, Northwestern, Johns Hopkins
4. **Risk of Misapplication** - Specific advice applied universally = inaccurate guidance
5. **Limited Issue Coverage** - Only 5 sources for some critical issue types
6. **No Narrative Structure Sources** - Missing essay organization guidance

---

## V2 Architecture: 4-Layer Source Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOURCE APPLICABILITY PYRAMID                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Level 4: PROMPT-SPECIFIC SOURCES                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ "For Stanford's Roommate Essay specifically..."                      │  │
│   │ Applies: ONLY to that exact prompt                                   │  │
│   │ Examples: Prompt-specific strategies, word limit tactics            │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Level 3: COLLEGE-SPECIFIC SOURCES                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ "Stanford values intellectual vitality..."                           │  │
│   │ Applies: All essays TO that college                                  │  │
│   │ Examples: Dean quotes, official admissions guidance, value weights  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Level 2: PROMPT-TYPE SOURCES                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ "Personal Statement essays should..." / "Why X essays need..."       │  │
│   │ Applies: All essays OF that type (any college)                       │  │
│   │ Examples: Type-specific techniques, structure patterns               │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Level 1: UNIVERSAL SOURCES (Foundation)                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ "All college essays should show, not tell..."                        │  │
│   │ Applies: EVERY essay regardless of college or prompt                │  │
│   │ Examples: Narrative craft, authenticity, avoiding clichés           │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## New Source Classification System

### 1. Source Applicability Scope

```typescript
type SourceScope =
  | 'universal'          // Applies to ALL essays
  | 'prompt_type'        // Applies to a category of essays (e.g., "Why X" essays)
  | 'college_specific'   // Applies to a specific college
  | 'prompt_specific';   // Applies to ONE specific prompt

interface ScopeMetadata {
  scope: SourceScope;

  // For prompt_type scope
  prompt_types?: PromptType[];  // Which essay types this applies to

  // For college_specific scope
  college_id?: CollegeId;
  applicable_peers?: CollegeId[];  // Similar colleges that can use this

  // For prompt_specific scope
  prompt_id?: string;  // Exact prompt identifier
  college_id?: CollegeId;

  // Safety: What this source should NEVER be used for
  exclusions?: {
    prompt_types?: PromptType[];
    colleges?: CollegeId[];
    issue_types?: ClicheSymptomType[];
  };
}
```

### 2. Prompt Types (14 Universal Types)

```typescript
type PromptType =
  // Common App Main Essay Types
  | 'personal_statement'      // 650 words, identity/values
  | 'background_identity'     // Background, identity, story
  | 'challenge_setback'       // Obstacle/failure/setback
  | 'belief_challenged'       // Belief questioned
  | 'problem_solved'          // Solution/accomplishment
  | 'personal_growth'         // Transition, gratitude, maturity
  | 'topic_of_choice'         // Open topic

  // Supplemental Essay Types
  | 'why_this_college'        // "Why X" essays
  | 'why_this_major'          // Major-specific
  | 'community_contribution'  // Contribution/perspective
  | 'activity_elaboration'    // Expand on activity
  | 'short_answer'            // 50-150 word responses
  | 'creative_prompt'         // Quirky/unusual prompts
  | 'additional_info'         // Optional context
  | 'letter_to_roommate'      // Roommate/personality
  | 'intellectual_curiosity'; // Academic interest
```

### 3. Source Authority Levels

```typescript
type SourceAuthority =
  | 'primary'      // Dean quote, official admissions
  | 'research'     // Published study, data analysis
  | 'expert'       // Admissions consultant, former AO
  | 'pattern'      // Internal analysis of successful essays
  | 'principle';   // Established writing/narrative principle
```

---

## Enhanced LabeledSource Type

```typescript
interface EnhancedLabeledSource extends LabeledSource {
  // NEW: Explicit scope and applicability
  scope: {
    level: SourceScope;

    // What this applies to
    applies_to: {
      prompt_types: PromptType[] | 'all';
      colleges: CollegeId[] | 'all';
      issue_types: ClicheSymptomType[] | 'all';
    };

    // What this should NEVER be used for (critical for safety)
    never_use_for: {
      prompt_types?: PromptType[];
      colleges?: CollegeId[];
      issue_types?: ClicheSymptomType[];
      contexts?: string[];  // e.g., "short_answer_length_advice"
    };

    // Peer applicability
    peer_applicable?: boolean;  // Can use for similar colleges?
    peer_weight_reduction?: number;  // How much to reduce weight for peers (0-50%)
  };

  // NEW: Context requirements
  context_requirements?: {
    min_word_count?: number;   // Only use for essays >= this length
    max_word_count?: number;   // Only use for essays <= this length
    requires_narrative?: boolean;  // Only for narrative essays
    requires_reflection?: boolean; // Only if essay has reflection component
  };

  // NEW: Advice classification
  advice_type:
    | 'technique'      // How to do something
    | 'principle'      // Why something matters
    | 'warning'        // What to avoid
    | 'example'        // What success looks like
    | 'data';          // Statistical finding
}
```

---

## Smart Source Routing Algorithm

```typescript
class SmartSourceRouter {

  /**
   * Select best sources for a given context
   * Respects the 4-layer hierarchy
   */
  selectSources(context: {
    promptType: PromptType;
    collegeId: CollegeId;
    promptId?: string;  // For prompt-specific
    issueType: ClicheSymptomType;
    wordLimit: number;
    hasNarrative: boolean;
  }): SourceBundle {

    // Layer 4: Prompt-specific (most specific, highest weight if available)
    const promptSpecific = this.getPromptSpecificSources(
      context.promptId, context.collegeId, context.issueType
    );

    // Layer 3: College-specific
    const collegeSpecific = this.getCollegeSpecificSources(
      context.collegeId, context.issueType
    );

    // Layer 2: Prompt-type sources
    const promptType = this.getPromptTypeSources(
      context.promptType, context.issueType
    );

    // Layer 1: Universal sources (always included as foundation)
    const universal = this.getUniversalSources(context.issueType);

    // Smart merging with weight adjustment
    return this.mergeWithHierarchy([
      { sources: promptSpecific, weight: 1.0 },    // No reduction - most specific
      { sources: collegeSpecific, weight: 0.9 },   // Slight reduction
      { sources: promptType, weight: 0.8 },        // More general
      { sources: universal, weight: 0.7 },         // Foundation, always valid
    ], context);
  }

  /**
   * Critical: Validate source is safe for context
   * Prevents misapplication of specific advice
   */
  validateSourceForContext(
    source: EnhancedLabeledSource,
    context: RoutingContext
  ): { valid: boolean; reason?: string } {

    // Check never_use_for exclusions
    if (source.scope.never_use_for) {
      if (source.scope.never_use_for.prompt_types?.includes(context.promptType)) {
        return { valid: false, reason: `Not applicable to ${context.promptType} essays` };
      }
      if (source.scope.never_use_for.colleges?.includes(context.collegeId)) {
        return { valid: false, reason: `Not applicable to ${context.collegeId}` };
      }
    }

    // Check context requirements
    if (source.context_requirements) {
      if (source.context_requirements.min_word_count &&
          context.wordLimit < source.context_requirements.min_word_count) {
        return { valid: false, reason: 'Essay too short for this advice' };
      }
      if (source.context_requirements.requires_narrative && !context.hasNarrative) {
        return { valid: false, reason: 'Advice requires narrative structure' };
      }
    }

    return { valid: true };
  }
}
```

---

## Source Categories to Create

### 1. Universal Sources (NEW - ~30 sources needed)

These apply to EVERY essay regardless of college or prompt type.

**Categories:**
- Show don't tell (narrative craft)
- Specific over generic (the paradox of specificity)
- Authentic voice (avoiding AI/template sound)
- Opening hooks (engagement techniques)
- Conclusion craft (ending without clichés)
- Transition techniques (flow and pacing)
- Word economy (every word earns its place)
- Sensory details (concrete over abstract)
- Dialogue use (conversation in essays)
- Reflection balance (showing thought process)

**Example Universal Source:**
```typescript
{
  source_id: 'universal_show_dont_tell_001',
  type: 'principle',
  scope: {
    level: 'universal',
    applies_to: { prompt_types: 'all', colleges: 'all', issue_types: 'all' },
    never_use_for: {}  // Safe for everything
  },
  quote: "The best essays trust readers to draw conclusions from concrete details rather than explaining everything.",
  author: "Andrew Flagel",
  author_title: "Dean of Admissions, George Mason University",
  // ... rest of metadata
}
```

### 2. Prompt-Type Sources (NEW - ~50 sources needed)

These apply to all essays OF A TYPE across all colleges.

**Personal Statement specific:**
- Identity revelation techniques
- Narrative arc for 650 words
- Balancing story with reflection

**Why X College specific:**
- Research demonstration techniques
- Specificity requirements
- Avoiding flattery vs. genuine fit
- Word limit strategies (150 vs 650)

**Activity Elaboration specific:**
- Beyond the resume trap
- Impact demonstration
- Leadership without the word "leader"

**Short Answer specific:**
- Economy of words
- One idea per answer
- Avoiding essay-in-miniature

**Example Prompt-Type Source:**
```typescript
{
  source_id: 'why_college_specificity_001',
  type: 'expert',
  scope: {
    level: 'prompt_type',
    applies_to: { prompt_types: ['why_this_college'], colleges: 'all', issue_types: ['cliche_college_specific'] },
    never_use_for: { prompt_types: ['personal_statement', 'activity_elaboration'] }
  },
  quote: "A 'Why Us' essay should mention at least 3 specific, non-obvious things about the school that you couldn't find on page 1 of their website.",
  author: "Brennan Barnard",
  author_title: "Former Director of College Counseling, The Derryfield School",
  // ... rest of metadata
}
```

### 3. College-Specific Sources (EXISTING + EXPAND)

Currently have: Stanford, Harvard, MIT, UChicago, Duke, UVA, Tulane, Harvey Mudd, GMU

**Need to add:**
- Yale (Jeremiah Quinlan quotes)
- Princeton (Karen Richardson quotes)
- Columbia (Jessica Marinaccio quotes)
- Penn (Eric Furda quotes)
- Brown (Logan Powell quotes)
- Dartmouth (Lee Coffin quotes)
- Cornell (Shawn Felton quotes)
- Caltech (Jarrid Whitney quotes)
- Northwestern (Chris Chambers quotes)
- Johns Hopkins (Ellen Kim quotes)

### 4. Prompt-Specific Sources (NEW - as needed)

These are for famous/unique prompts that need specialized guidance.

**Examples:**
- Stanford "Roommate Letter" - unique tone requirements
- UChicago extended essay - unconventional structure
- MIT "making things" - technical demonstration
- Rice "Box" essay - visual/creative elements

---

## Implementation Plan

### Phase 1: Type System Update (Now)
1. Update `labeledSourceTypes.ts` with new EnhancedLabeledSource type
2. Add SourceScope, PromptType, and scope metadata
3. Ensure backward compatibility with existing sources

### Phase 2: Universal Sources (~30 sources)
1. Create `universalSources.ts` with foundational writing principles
2. These serve as fallback when specific sources unavailable
3. All have `scope.level: 'universal'` and `applies_to: 'all'`

### Phase 3: Prompt-Type Sources (~50 sources)
1. Create `promptTypeSources.ts` organized by essay type
2. Add strict `never_use_for` to prevent misapplication
3. Cover all 16 prompt types

### Phase 4: Expand College Sources (~10 colleges)
1. Add dean quotes for missing top 20 colleges
2. Each college needs 3-5 primary sources
3. Include value weights and red/green flags

### Phase 5: Smart Router Implementation
1. Update `smartSourceSelector.ts` with 4-layer routing
2. Add validation to prevent source misapplication
3. Implement context-aware weight adjustment

### Phase 6: Integration & Testing
1. Update citation attachment to use new routing
2. Create comprehensive tests for each scenario
3. Validate no misapplication occurs

---

## Safety Mechanisms

### 1. Source Validation Gate

Every source selection passes through validation:

```typescript
function validateBeforeUse(source, context): boolean {
  // Check explicit exclusions
  if (source.scope.never_use_for.prompt_types?.includes(context.promptType)) {
    return false;
  }

  // Check scope appropriateness
  if (source.scope.level === 'prompt_specific' &&
      source.scope.prompt_id !== context.promptId) {
    return false;  // Prompt-specific can ONLY be used for that prompt
  }

  // Check context requirements
  if (source.context_requirements?.min_word_count > context.wordLimit) {
    return false;  // Don't give long-essay advice for short answers
  }

  return true;
}
```

### 2. Audit Trail

Log every source selection decision:

```typescript
interface SourceSelectionLog {
  timestamp: string;
  context: RoutingContext;
  sources_considered: string[];
  sources_selected: string[];
  sources_rejected: { source_id: string; reason: string }[];
  final_bundle: SourceBundle;
}
```

### 3. Fallback Hierarchy

If specific sources unavailable, cascade UP the hierarchy:

```
Prompt-Specific → College-Specific → Prompt-Type → Universal
```

Never go DOWN (don't apply universal advice when specific exists).

---

## Success Metrics

1. **Coverage Rate**: % of feedback claims that have sources attached
   - Target: 95% of weight claims, 90% of severity claims

2. **Accuracy Rate**: % of sources correctly matched to context
   - Target: 100% (no misapplied specific advice)

3. **Diversity Score**: Unique authors/institutions per feedback bundle
   - Target: 40-80% (some repetition of authoritative voices is OK)

4. **Response Time**: Source selection latency
   - Target: <5ms (maintain O(1) performance)

5. **User Trust Score**: Student ratings of citation helpfulness
   - Target: 4.5+ out of 5

---

## Next Steps

1. **Immediate**: Create type definitions for enhanced source system
2. **This Week**: Build universal sources library (~30 sources)
3. **Next Week**: Build prompt-type sources library (~50 sources)
4. **Following**: Expand college coverage for top 20 schools
5. **Ongoing**: Add prompt-specific sources as famous prompts identified

This architecture ensures:
- ✅ Every piece of feedback can have relevant citations
- ✅ No misapplication of specific advice to wrong contexts
- ✅ Scalable to any number of colleges/prompts
- ✅ Maintains O(1) performance with pre-indexing
- ✅ Clear audit trail for debugging
