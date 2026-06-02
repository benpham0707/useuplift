# College Overlay Integration Plan

**Task**: Complete the integration of college-specific overlay services into TypeSpecificSuggestionService to create the final layer that tailors feedback with deep institutional knowledge.

**Status**: Ready for Implementation
**Complexity**: Medium (Services built, need integration)
**Risk Level**: Low (Additive changes, existing flow preserved)

---

## Context & Background

### What We Have

**4 New Overlay Services (Built & Ready)**:
1. `RedFlagMatcher` - Pattern-matches college-specific red flags with Dean quote teaching
2. `GreenFlagAmplifier` - Detects college-valued strengths with preservation directives
3. `PromptRubricInjector` - Extracts rubric band guidance for targeted score improvement
4. `SocraticQuestionMatcher` - Matches issues to teaching-focused questions

**13 College Overlays (50,000+ lines of research)**:
- Stanford, MIT, Harvard, UPenn, Northwestern, Brown, Cornell, Caltech, Dartmouth, USC, UChicago, CMU, NYU
- Each with: Red flags, green flags, rubric bands, Socratic questions, elite examples, key quotes

**Existing Integration Points**:
- `TypeSpecificSuggestionService` already calls `CollegeOverlayService` (line 903-912)
- Already has `SemanticClicheAnalyzer` integration (line 1138-1175)
- Prompt is ~2000 lines with multiple injection points

### What We Need

**Complete the final integration layer** so that suggestion generation:
1. ✅ Uses type-specific rubrics (already working)
2. ✅ Uses college personality & values (already working)
3. ✅ Uses semantic cliché analysis (already working)
4. ⚠️ **MISSING**: Pattern-matched red/green flags with teaching
5. ⚠️ **MISSING**: Rubric band upgrade guidance
6. ⚠️ **MISSING**: Issue-triggered Socratic questions

---

## Problem Analysis

### Current Flow (Line Numbers in `typeSpecificSuggestionService.ts`)

```
generateSuggestions() {
  1. Calculate word count status (lines 1130-1135)
  2. Run semantic cliché analysis (lines 1138-1142) ← WORKS
  3. Build prompt with:
     - Type constraints (lines 1148-1172)
     - College context via CollegeOverlayService (line 1173) ← WORKS
     - Cliché analysis formatted (line 1174) ← WORKS
     - Voice fingerprint (line 1175)
     - Essay text (line 1176)
     - Issues formatted (line 1177)
  4. Make API call (lines 1180-1185)
  5. Validate suggestions (lines 1197-1225)
}
```

### The Gap

**New services are built but not called**. We need to:
1. Import the new services
2. Call them with appropriate inputs
3. Inject formatted outputs at strategic prompt locations
4. Ensure outputs are concise to avoid prompt bloat

### Why This Matters

The current system provides:
- ✅ Generic college context (personality, values)
- ✅ Semantic cliché detection (topic-level, arc-level)

The missing layer provides:
- ❌ **Pattern-matched red flags** → "You wrote X, Stanford explicitly rejects this because Dean Shaw says Y"
- ❌ **Pattern-matched green flags** → "You wrote X, preserve this! Stanford values this because Y"
- ❌ **Rubric band guidance** → "You're at 65 (average band). To reach 75 (good band), address Z"
- ❌ **Socratic teaching** → "Instead of giving polished text, ask student: What limitation did you find?"

This is the difference between **generic college advice** and **institutional knowledge operationalized**.

---

## Proposed Solution

### High-Level Integration Strategy

```typescript
// BEFORE prompt construction:
1. Detect red flags (if college provided)
2. Detect green flags (if college provided)
3. Get rubric guidance (if promptId + score available)
4. Match Socratic questions (if issues detected)

// DURING prompt construction:
5. Inject red flag warnings (high priority - after college context)
6. Inject green flag preservation directives (after red flags)
7. Inject rubric upgrade targets (after type requirements)
8. Inject Socratic questions (in teaching guidance section)

// AFTER generation:
9. Validate suggestions don't violate red flags or remove green flags
```

### Detailed Implementation Plan

#### Phase 1: Import & Setup (5 minutes)

**File**: `src/services/commonAppWorkshop/services/typeSpecificSuggestionService.ts`

**Changes**:
```typescript
// Add imports at top of file (after line 65)
import { redFlagMatcher, type RedFlagMatcherOutput } from './redFlagMatcher';
import { greenFlagAmplifier, type GreenFlagAmplifierOutput } from './greenFlagAmplifier';
import { promptRubricInjector, type RubricBandGuidance } from './promptRubricInjector';
import { socraticQuestionMatcher, type SocraticMatcherOutput } from './socraticQuestionMatcher';
```

**Test**: TypeScript compiles without errors

---

#### Phase 2: Call Services in generateSuggestions() (10 minutes)

**Location**: Inside `generateSuggestions()`, after cliché analysis (after line 1142)

**Add**:
```typescript
// ───────────────────────────────────────────────────────────────────────
// STEP: College Overlay Layer (Red/Green Flags, Rubric, Socratic)
// ───────────────────────────────────────────────────────────────────────
let redFlagOutput: RedFlagMatcherOutput | null = null;
let greenFlagOutput: GreenFlagAmplifierOutput | null = null;
let rubricGuidance: RubricBandGuidance | null = null;
let socraticOutput: SocraticMatcherOutput | null = null;

if (college) {
  const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase();

  // Detect red flags (critical issues that cap scores)
  redFlagOutput = redFlagMatcher.matchFlags({
    essayText: essayDraft,
    collegeId: collegeId,
    promptId: undefined, // Could pass if available
  });

  // Detect green flags (strengths to preserve)
  greenFlagOutput = greenFlagAmplifier.matchFlags({
    essayText: essayDraft,
    collegeId: collegeId,
    promptId: undefined,
  });

  // Get rubric band guidance (if we have dimension scores, estimate overall)
  // For now, we'll estimate based on detected issues
  const estimatedScore = this.estimateScoreFromIssues(issues);
  rubricGuidance = promptRubricInjector.getRubricGuidance({
    collegeId: collegeId,
    promptId: promptId || 'default', // Would need to thread this through
    estimatedScore: estimatedScore,
  });

  // Match Socratic questions for detected issues
  const detectedIssueIds = issues.map(i => i.diagnosis.symptom_type);
  socraticOutput = socraticQuestionMatcher.matchQuestions({
    collegeId: collegeId,
    promptId: undefined,
    detectedIssues: detectedIssueIds,
    weakDimensions: issues.flatMap(i => i.diagnosis.affected_dimensions).slice(0, 3),
  });
}
```

**Helper Method** (add to class):
```typescript
/**
 * Estimate overall score from detected issues
 *
 * This is a rough heuristic until we have actual dimension scores.
 * Each issue reduces the base score based on severity.
 */
private estimateScoreFromIssues(issues: IssueContext[]): number {
  const baseScore = 75; // Assume average starting point

  // Each issue reduces score based on impact
  const penalty = issues.reduce((sum, issue) => {
    return sum + Math.abs(issue.diagnosis.score_impact);
  }, 0);

  const estimatedScore = Math.max(30, baseScore - penalty);
  return Math.round(estimatedScore);
}
```

**Test**: Services are called, outputs are captured

---

#### Phase 3: Inject Outputs into Prompt (15 minutes)

**Strategy**: Inject at specific points in the prompt template

**Injection Points**:

1. **Red Flags** → After `{collegeContext}` (line ~1173)
   - High priority, must address immediately
   - Format: `{redFlagSection}`

2. **Green Flags** → After red flags
   - Preservation directives
   - Format: `{greenFlagSection}`

3. **Rubric Guidance** → After `{excellenceRequirements}` (line ~1167)
   - Score-specific upgrade targets
   - Format: `{rubricGuidanceSection}`

4. **Socratic Questions** → In "OUTPUT REQUIREMENTS" teaching section (line ~640)
   - Teaching guidance for suggestion generation
   - Format: `{socraticQuestionsSection}`

**Implementation**:

```typescript
// Build the formatted sections
const redFlagSection = redFlagOutput && redFlagOutput.matches.length > 0
  ? redFlagOutput.formattedForPrompt
  : '';

const greenFlagSection = greenFlagOutput && greenFlagOutput.matches.length > 0
  ? greenFlagOutput.formattedForPrompt
  : '';

const rubricGuidanceSection = rubricGuidance
  ? rubricGuidance.formattedForPrompt
  : '';

const socraticSection = socraticOutput && socraticOutput.totalQuestions > 0
  ? socraticOutput.formattedForPrompt
  : '';

// Inject into prompt (update the .replace() chain)
const prompt = TYPE_SPECIFIC_SUGGESTION_PROMPT
  .replace('{bannedTerms}', BANNED_TERMS.join(', '))
  .replace('{essayType}', essayType)
  // ... existing replacements ...
  .replace('{collegeContext}', formatCollegeContext(college, essayType))
  .replace('{redFlagSection}', redFlagSection)        // NEW
  .replace('{greenFlagSection}', greenFlagSection)    // NEW
  .replace('{rubricGuidanceSection}', rubricGuidanceSection) // NEW
  .replace('{clicheAnalysis}', clicheAnalysisFormatted)
  .replace('{voiceFingerprint}', formatVoiceFingerprint(voice))
  .replace('{essayDraft}', essayDraft)
  .replace('{issuesFormatted}', formatIssues(issues))
  .replace('{socraticSection}', socraticSection);     // NEW
```

**Update Prompt Template** (`TYPE_SPECIFIC_SUGGESTION_PROMPT`):

```typescript
// After line 570 (after COLLEGE CONTEXT section):
═══════════════════════════════════════════════════════════
{redFlagSection}

{greenFlagSection}

// After line 562 (after TOP 3 DIMENSIONS):
{rubricGuidanceSection}

// After line 641 (in teaching section requirements):
{socraticSection}
```

**Test**: Prompt is built with all sections when data available

---

#### Phase 4: Post-Generation Validation (10 minutes)

**Purpose**: Ensure suggestions don't violate red flags or accidentally remove green flags

**Location**: After validation loop (after line 1225)

**Add**:
```typescript
// ───────────────────────────────────────────────────────────────────────
// OVERLAY VALIDATION: Check suggestions against red/green flags
// ───────────────────────────────────────────────────────────────────────
if (redFlagOutput || greenFlagOutput) {
  for (const issue of validatedIssues) {
    // Validate polished suggestion
    if (issue.suggestions?.polished_original) {
      const overlayValidation = this.validateAgainstOverlay(
        issue.suggestions.polished_original.text,
        redFlagOutput,
        greenFlagOutput
      );

      if (overlayValidation.warnings.length > 0) {
        issue.suggestions.polished_original.overlay_warnings = overlayValidation.warnings;
      }
    }

    // Validate voice suggestion
    if (issue.suggestions?.voice_amplifier) {
      const overlayValidation = this.validateAgainstOverlay(
        issue.suggestions.voice_amplifier.text,
        redFlagOutput,
        greenFlagOutput
      );

      if (overlayValidation.warnings.length > 0) {
        issue.suggestions.voice_amplifier.overlay_warnings = overlayValidation.warnings;
      }
    }
  }
}
```

**Helper Method** (add to class):
```typescript
/**
 * Validate suggestion text against overlay red/green flags
 */
private validateAgainstOverlay(
  suggestionText: string,
  redFlags: RedFlagMatcherOutput | null,
  greenFlags: GreenFlagAmplifierOutput | null
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check if suggestion introduces new red flags
  if (redFlags) {
    const newRedFlags = redFlagMatcher.matchFlags({
      essayText: suggestionText,
      collegeId: redFlags.matches[0]?.flagId.split('_')[0] || 'unknown',
    });

    if (newRedFlags.matches.length > 0) {
      warnings.push(
        `Suggestion may introduce red flag: ${newRedFlags.matches[0].flagName}`
      );
    }
  }

  // Check if suggestion removes green flags
  if (greenFlags && greenFlags.matches.length > 0) {
    for (const greenFlag of greenFlags.matches.slice(0, 3)) {
      const phrasePreserved = greenFlagAmplifier.isPhraseProtected(
        suggestionText,
        [greenFlag]
      );

      if (!phrasePreserved) {
        warnings.push(
          `Suggestion may remove green flag: ${greenFlag.flagName}`
        );
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
```

**Test**: Validation catches suggestions that violate overlay rules

---

#### Phase 5: Add Metadata to Output (5 minutes)

**Purpose**: Return overlay analysis results with suggestions for transparency

**Location**: In the return statement of `generateSuggestions()` (line 1233)

**Modify**:
```typescript
return {
  essay_type: essayType,
  type_name: config.name,
  college_name: college?.collegeName || null,

  issues: validatedIssues,

  overall_strategy: parsed.overall_strategy || {
    cohesive_approach: 'Address issues in priority order',
    voice_consistency: 'Maintain authentic voice throughout',
    priority_order: 'Focus on critical dimensions first',
    implementation_tips: ['Apply suggestions gradually', 'Re-read for flow', 'Preserve voice markers']
  },

  // NEW: Overlay analysis metadata
  overlay_analysis: {
    red_flags_detected: redFlagOutput?.matches.length || 0,
    green_flags_detected: greenFlagOutput?.matches.length || 0,
    rubric_band: rubricGuidance?.currentBand.name || null,
    target_band: rubricGuidance?.targetBand.name || null,
    socratic_questions_available: socraticOutput?.totalQuestions || 0,
  },

  cost,
  tokens_used: {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens
  }
};
```

**Update Type** (`TypeSpecificSuggestionOutput` interface around line 345):
```typescript
export interface TypeSpecificSuggestionOutput {
  essay_type: SupplementalType;
  type_name: string;
  college_name: string | null;

  issues: IssueSuggestion[];

  overall_strategy: {
    cohesive_approach: string;
    voice_consistency: string;
    priority_order: string;
    implementation_tips: string[];
  };

  // NEW
  overlay_analysis?: {
    red_flags_detected: number;
    green_flags_detected: number;
    rubric_band: string | null;
    target_band: string | null;
    socratic_questions_available: number;
  };

  cost: number;
  tokens_used: {
    input: number;
    output: number;
  };
}
```

**Test**: Output includes overlay metadata

---

## Files to Modify

### Primary File
- `src/services/commonAppWorkshop/services/typeSpecificSuggestionService.ts` (all changes)

### No Changes Needed
- ✅ `redFlagMatcher.ts` (complete)
- ✅ `greenFlagAmplifier.ts` (complete)
- ✅ `promptRubricInjector.ts` (complete)
- ✅ `socraticQuestionMatcher.ts` (complete)
- ✅ `collegeOverlayService.ts` (complete)
- ✅ All college data files (stanford.ts, mit.ts, etc.) (complete)

---

## Testing Strategy

### Integration Test
Create: `tests/test-overlay-integration-e2e.ts`

```typescript
/**
 * End-to-end test for full overlay integration
 *
 * Tests:
 * 1. Red flag detection and injection
 * 2. Green flag detection and preservation
 * 3. Rubric guidance for score improvement
 * 4. Socratic question matching
 * 5. Suggestion validation against overlays
 */

import { TypeSpecificSuggestionService } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';

// Test essay with known red flag (Stanford "intellectual vitality" term)
const testEssay = `
I have always been passionate about intellectual vitality.
At Stanford, I want to pursue my passion for learning.
The Stanford community will help me grow.
`;

const service = new TypeSpecificSuggestionService();
const stanford = getCollegeResearch('stanford');

const result = await service.generateSuggestions(
  testEssay,
  'intellectual',
  [/* mock issues */],
  { college: stanford }
);

console.log('Overlay Analysis:', result.overlay_analysis);
// Should detect:
// - Red flags: 2-3 (intellectual vitality, passion, Stanford generic)
// - Green flags: 0 (no college-valued strengths)
// - Rubric band: weak (40-50)
// - Target band: average (50-70)
```

---

## Expected Impact

### Before Integration
User receives:
- Generic suggestion: "Add more specific details about your interest"
- No context on why this matters
- No preservation of what's working

### After Integration
User receives:
- **Red Flag Warning**: "🚨 CRITICAL: 'Intellectual vitality' (detected). Stanford explicitly warns against using this phrase. Dean Shaw: 'We want to see the energy and depth of thought, not the term itself.' → Instead, SHOW your curiosity through a specific rabbit hole you explored."
- **Green Flag Preservation**: "✅ Preserve your description of the failed experiment - Stanford values 'comfortable with uncertainty.'"
- **Rubric Upgrade Target**: "Current: Average band (55). To reach Good band (75): Add self-directed exploration OUTSIDE class requirements."
- **Socratic Question**: "What limitation did you find in the research that fascinated you? (Genuine depth answers show this.)"

**Quality Improvement**: 30-40% better alignment with college-specific values
**User Learning**: Students understand WHY suggestions matter, not just WHAT to change
**Competitive Advantage**: No other platform provides this depth of institutional knowledge

---

## Risk Mitigation

### Risk 1: Prompt Bloat
**Concern**: Adding 4 new sections could make prompt too long
**Mitigation**:
- Limit each service to top 3-5 items
- Use concise formatting
- Only inject when data available (empty sections are skipped)
- Monitor token usage and adjust

### Risk 2: Service Failures
**Concern**: If overlay service fails, don't break suggestion generation
**Mitigation**:
- Wrap all service calls in try-catch
- Gracefully degrade if services fail
- Log errors for monitoring
- Existing flow continues without overlay layer

### Risk 3: False Positives
**Concern**: Red flag detector might flag legitimate content
**Mitigation**:
- Start with conservative severity thresholds
- Manual review of top red flags
- Allow user to dismiss warnings
- Tune pattern matching based on feedback

---

## Success Metrics

### Quantitative
- **Red flag detection rate**: Target 70%+ of known issues
- **Green flag preservation rate**: Target 90%+ in suggestions
- **Rubric accuracy**: Within ±10 points of manual scoring
- **Socratic question relevance**: 80%+ rated "helpful" by users
- **Token cost increase**: <15% (acceptable for quality gain)

### Qualitative
- Suggestions cite specific Dean quotes and institutional evidence
- Users report understanding WHY changes matter
- Essays better align with college-specific values
- Admissions consultants validate institutional accuracy

---

## Next Steps

1. **Get approval on this plan** ✓
2. **Implement Phase 1-5** (45 minutes estimated)
3. **Write integration test** (20 minutes)
4. **Manual validation with Stanford test case** (10 minutes)
5. **Deploy and iterate** (ongoing)

---

**Ready to proceed with implementation?**
