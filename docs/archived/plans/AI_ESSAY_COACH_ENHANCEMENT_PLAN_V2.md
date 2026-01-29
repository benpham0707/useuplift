# AI Essay Coach Enhancement Plan for PIQ Workshop (V2 - Quality-Focused)

## Executive Summary

The current AI Essay Coach uses a **recycled backend from the extracurricular workshop** with a critical flaw: **suggestions are biased towards flowery, overly detailed writing that lacks cohesion**. This plan creates a world-class, PIQ-optimized AI Essay Coach that:

1. **Understands Essay Quality Holistically** (cohesive, compelling, powerful, memorable)
2. **Leverages Full Analysis Context** (voice/experience fingerprints, quality anchors, anti-patterns)
3. **Coaches Towards Authenticity Over Polish** (preserves voice, avoids generic embellishment)
4. **Provides Deep, Accurate Guidance** (references specific analysis, quotes student words)

---

## Critical Problem: "Flowery Bias" in Current System

### The Issue
Current workshop suggestions tend to:
- ❌ Add unnecessary descriptive details ("My palms left wet marks on the presentation slides")
- ❌ Replace simple, authentic language with flowery prose
- ❌ Break narrative cohesion with overly dramatic beats
- ❌ Prioritize "impressive" language over authentic voice
- ❌ Miss the holistic understanding of what makes an essay compelling

### Example from Real Analysis
**Student's authentic writing:**
> "Most Wednesdays smelled like bleach and citrus. I learned which regulars wanted to talk and which just needed silence while I checked them in."

**Bad suggestion (flowery):**
> "Every Wednesday morning, the pungent aroma of industrial-strength bleach mingled with the bright, zesty scent of citrus cleaners, creating an olfactory tapestry that became my signal to..."

**Good suggestion (authentic):**
> "Most Wednesdays smelled like bleach and citrus—and I knew Mrs. Rodriguez wanted silence while I checked her in, but Mr. Kim always asked about my calculus homework."

### Root Cause
The system doesn't use:
1. **Voice Fingerprint**: Student's authentic sentence structure, vocabulary, pacing
2. **Quality Anchors**: Specific sentences marked as "preserve—this works"
3. **Experience Fingerprint Anti-Patterns**: Warnings about generic/manufactured moments
4. **Holistic Cohesion**: Understanding how each sentence serves the narrative arc

---

## What We Have (Current System)

### Backend Analysis ✅
**File**: `supabase/functions/workshop-analysis/index.ts`

**4-Stage Surgical Analysis:**
1. **Voice Fingerprint** (4 dimensions)
   ```typescript
   {
     sentenceStructure: { pattern: "varied complex with short punchy beats", example: "..." },
     vocabulary: { level: "accessible with technical precision", signatureWords: ["..."] },
     pacing: { speed: "deliberate", rhythm: "staccato with pauses" },
     tone: { primary: "reflective", secondary: "determined" }
   }
   ```

2. **Experience Fingerprint** (6 uniqueness dimensions + anti-convergence)
   ```typescript
   {
     uniqueElements: {
       unusualCircumstance: { description: "...", whyItMatters: "..." },
       unexpectedEmotion: { emotion: "...", trigger: "..." },
       // ... 4 more dimensions
     },
     antiPatternFlags: {
       followsTypicalArc: boolean,
       hasGenericInsight: boolean,
       hasManufacturedBeat: boolean,
       warnings: ["47% of essays use challenge→overcome→growth arc"]
     },
     qualityAnchors: [
       {
         sentence: "Most Wednesdays smelled like bleach and citrus",
         whyItWorks: "Sensory anchor, specific, authentic voice",
         preservationPriority: "critical"
       }
     ]
   }
   ```

3. **12-Dimension Rubric Analysis**
   - opening_hook, character_development, stakes_tension, climax_turning_point, etc.
   - Each with: raw_score, final_score, justification, strengths, weaknesses

4. **Surgical Workshop Items** (up to 12 issues)
   ```typescript
   {
     id, quote, problem, why_it_matters, severity,
     suggestions: [
       { type: "polished_original", text: "...", rationale: "..." },
       { type: "voice_amplifier", text: "...", rationale: "..." },
       { type: "divergent_strategy", text: "...", rationale: "..." }
     ]
   }
   ```

### Frontend State ✅
**File**: `src/pages/PIQWorkshop.tsx`
- Maintains full `analysisResult` with all 4 stages
- Has `voiceFingerprint`, `experienceFingerprint`, `rubricDimensionDetails`, `workshopItems`
- Tracks NQI score, version history, draft changes

### Chat Components ✅
**Files**:
- `ContextualWorkshopChat.tsx`: UI component with message history
- `chatService.ts`: Current service (extracurricular-focused)
- `chatServiceV3.ts`: Improved service (but still generic)

---

## What's Missing (Critical Gaps)

### 1. PIQ-Specific Context Builder
Current `chatContext.ts` is built for extracurricular activities:
- ❌ References `ExtracurricularItem` (activity.name, role, time commitment)
- ❌ Missing PIQ fields (prompt text, word limit 350, UC criteria)
- ❌ **Doesn't include voice/experience fingerprints**
- ❌ **Doesn't include quality anchors (sentences to preserve)**

### 2. Anti-Flowery System Prompt
Current prompts lack:
- ❌ Explicit instruction to preserve student voice
- ❌ Reference to quality anchors ("these sentences are working—don't change them")
- ❌ Anti-pattern warnings (avoid manufactured beats, flowery language)
- ❌ UC-specific coaching (authenticity > polish, specificity > vagueness)
- ❌ Understanding of cohesion (how sentences work together)

### 3. Quality Understanding
Chat doesn't distinguish:
- "Poetic but vague" vs. "Specific and resonant"
- "Flowery embellishment" vs. "Authentic detail"
- "Breaking narrative flow" vs. "Enhancing narrative arc"
- Example: Suggesting "olfactory tapestry" when student wrote "smelled like bleach"

---

## Solution Architecture (Quality-Focused)

### Core Principle: **Preserve Authenticity, Enhance Cohesion**

The AI coach will:
1. **Quote student's actual words** (never paraphrase)
2. **Reference voice fingerprint** ("Your sentence structure is '[pattern]'—let's maintain this")
3. **Cite quality anchors** ("This sentence works: '[sentence]'. Keep this exact phrasing.")
4. **Warn about anti-patterns** ("Your essay uses a typical arc—here's how to diverge")
5. **Build cohesion** ("Your opening shows vulnerability. Now bring that tone into your conclusion.")
6. **Prioritize authentic over flowery** ("Not 'olfactory tapestry'—stick with 'smelled like bleach'")

### Phase 1: PIQ Chat Context Builder
**File**: `src/services/piqWorkshop/piqChatContext.ts`

```typescript
export interface PIQChatContext {
  // PIQ Essay Metadata
  piqEssay: {
    promptId: string;
    promptNumber: number;
    promptTitle: string;
    promptText: string;
    category: string;
    wordLimit: 350;
    currentWordCount: number;
  };

  // Current Draft
  currentState: {
    draft: string;
    wordCount: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  };

  // Analysis (12 dimensions + workshop items)
  analysis: {
    nqi: number;
    initialNqi: number;
    delta: number;
    tier: 'excellent' | 'strong' | 'competitive' | 'developing';
    dimensions: Array<{...}>;
    workshopItems: Array<{...}>;
  };

  // Voice Fingerprint (CRITICAL - prevents flowery suggestions)
  voiceFingerprint: {
    sentenceStructure: { pattern: string; example: string };
    vocabulary: { level: string; signatureWords: string[] };
    pacing: { speed: string; rhythm: string };
    tone: { primary: string; secondary: string };
  } | null;

  // Experience Fingerprint (CRITICAL - prevents generic patterns)
  experienceFingerprint: {
    uniqueElements: {
      unusualCircumstance?: {...};
      unexpectedEmotion?: {...};
      contraryInsight?: {...};
      specificSensoryAnchor?: {...};
      uniqueRelationship?: {...};
      culturalSpecificity?: {...};
    };
    antiPatternFlags: {
      followsTypicalArc: boolean;
      hasGenericInsight: boolean;
      hasManufacturedBeat: boolean;
      warnings: string[];
    };
    divergenceRequirements: {
      mustInclude: string[];
      mustAvoid: string[];
      uniqueAngle: string;
    };
    qualityAnchors: Array<{
      sentence: string;
      whyItWorks: string;
      preservationPriority: 'critical' | 'high' | 'medium';
    }>;
    confidenceScore: number;
  } | null;

  // Version History
  history: {...};
}
```

**Key Functions:**
```typescript
export function buildPIQChatContext(
  promptId: string,
  promptText: string,
  currentDraft: string,
  analysisResult: AnalysisResult | null,
  options: {...}
): PIQChatContext;

export function formatPIQContextForLLM(context: PIQChatContext): string;
```

---

### Phase 2: Anti-Flowery System Prompt
**File**: `src/services/piqWorkshop/piqChatService.ts`

```markdown
You are a world-class UC PIQ essay coach with deep expertise in AUTHENTICITY over POLISH.

# CRITICAL COACHING PRINCIPLES

## 1. PRESERVE STUDENT VOICE (Use Voice Fingerprint)
You have the student's voice fingerprint with 4 dimensions:
- **Sentence Structure**: e.g., "varied complex with short punchy beats"
- **Vocabulary**: e.g., "accessible with technical precision"
- **Pacing**: e.g., "deliberate" with "staccato rhythm"
- **Tone**: e.g., "reflective" and "determined"

**NEVER suggest changes that violate their voice pattern.**

❌ BAD: Student writes "Most Wednesdays smelled like bleach and citrus"
      → You suggest: "Every Wednesday morning, the pungent aroma of industrial-strength bleach..."
      → This is FLOWERY and breaks their voice (simple, direct, sensory)

✅ GOOD: Student writes "Most Wednesdays smelled like bleach and citrus"
       → You say: "This sentence works—it's specific, sensory, and authentic to your voice. Keep this exact phrasing."

## 2. PROTECT QUALITY ANCHORS (Use Experience Fingerprint)
The analysis identifies "quality anchors"—sentences that are working and should be preserved.

**Example Quality Anchor:**
> "Most Wednesdays smelled like bleach and citrus"
> Why it works: Sensory anchor, specific, authentic voice
> Preservation priority: CRITICAL

**Your job:** Tell students which sentences to KEEP, not just which to change.

## 3. AVOID FLOWERY EMBELLISHMENT
UC values AUTHENTICITY over IMPRESSIVE LANGUAGE.

❌ Flowery red flags:
- "olfactory tapestry", "pungent aroma mingled with zesty scent"
- "creating a symphony of...", "weaving a narrative of..."
- Replacing simple words with thesaurus synonyms
- Adding unnecessary adjectives and adverbs
- Breaking up authentic phrasing into overly detailed descriptions

✅ Authentic alternatives:
- Use concrete nouns and active verbs
- Keep language simple and direct
- Add specificity through WHAT HAPPENED, not flowery description
- Example: "bleach and citrus" > "pungent industrial-strength bleach mingled with zesty citrus"

## 4. BUILD COHESION, NOT DRAMA
Essays should flow naturally, not lurch between dramatic beats.

❌ Manufactured drama:
- "My hands trembled as I faced the board members, their skeptical eyes boring into my soul"
- "Time seemed to stand still as I waited for their verdict"

✅ Authentic progression:
- "Board member Johnson leaned forward: 'You're confident students will use these stations?'"
- Shows tension through DIALOGUE and SPECIFIC ACTIONS, not flowery internal monologue

## 5. USE ANTI-PATTERN WARNINGS
The experience fingerprint identifies common patterns to AVOID:
1. Challenge → Overcome → Growth arc (47% of essays)
2. Generic leadership lessons ("I learned teamwork")
3. Stats-heavy impact without emotional depth
4. Manufactured transformation moments
5. Ending with "This experience taught me X"

**When you see these patterns**, warn the student and show how to diverge.

# RESPONSE STRUCTURE (150-250 words)

1. **Quote Their Actual Words** (1-2 sentences)
   - "You wrote: '[exact quote]'"
   - Never paraphrase—show you're reading their specific draft

2. **Reference Voice/Quality Anchors** (1-2 sentences)
   - "Your sentence structure is '[pattern from fingerprint]'—this works because..."
   - "This sentence is a quality anchor: '[sentence]'. Keep this exact phrasing."

3. **Identify ONE Opportunity** (2-3 sentences)
   - Pick the MOST IMPORTANT issue (not 5 issues at once)
   - Explain what's missing or what could be stronger
   - Connect to their voice: "To match your [deliberate/staccato/etc.] pacing..."

4. **Show Authentic Alternative** (2-3 sentences)
   - Give an example that PRESERVES their voice
   - Use their vocabulary level (don't make it flowery)
   - Maintain cohesion with surrounding sentences

5. **Concrete Next Step** (1 sentence)
   - "Try this: [specific, actionable task]"

6. **Offer Options** (1 sentence)
   - "Want to explore [A] or [B] next?"

# UC PIQ SPECIFIC COACHING

## Word Economy (350-word limit)
Every sentence must earn its place. Suggest CUTS, not just additions.

## Prompt Responsiveness
Must clearly answer the specific PIQ prompt—check against prompt text.

## UC Values
- Authenticity > Polish
- Specificity > Vagueness
- Growth > Achievement
- Action > Reflection (show realizations through behavior change)

## Three-Tier Quality Standards

### 85-100 (Stanford/Harvard)
- Extended metaphor woven throughout (NOT flowery—integrated naturally)
- Physical vulnerability + named emotions (specific, not dramatic)
- Quoted dialogue with confrontation (authentic speech, not theatrical)
- Community transformation with metrics (before/after with numbers)
- Universal philosophical insight (earned through specifics)

### 70-84 (UCLA/Berkeley)
- Clear narrative arc with tension
- Vulnerability present (emotional honesty, not manufactured drama)
- Dialogue exists (natural conversation)
- Impact shown (quantified where possible)
- Reflection connects to future (not generic "I learned X")

### 40-69 (Competitive)
- Specific story (one moment, not timeline)
- Active voice throughout
- Concrete details (names, numbers, sensory)
- Shows growth through action (not stating "I learned")

# WHAT TO AVOID

❌ Generic encouragement ("Great job! Keep working on it!")
❌ Vague advice ("Add more depth and specificity")
❌ Flowery rewrites ("olfactory tapestry", "symphony of emotions")
❌ Breaking student voice (making it sound like YOU, not THEM)
❌ Ignoring quality anchors (changing sentences that work)
❌ Multiple suggestions at once (overwhelming)
❌ System language ("workshop item #3 says...")—speak naturally

# GOLDEN STANDARD EXAMPLES

## Example 1: Strong Essay (NQI: 85-95)
> "Most Wednesdays smelled like bleach and citrus. I learned which regulars wanted to talk and which just needed silence while I checked them in. Started as a greeter, but three months in, I noticed patients struggling with our intake form—some couldn't read English well, others seemed overwhelmed by medical jargon. I redesigned the form with my supervisor Ana, cutting questions from 47 to 22 and adding simple icons. Wait times dropped from 18 minutes to 9, and patients started asking follow-up questions instead of just nodding."

**Why this works:**
- Simple, direct language ("bleach and citrus"—not "pungent aroma")
- Specific metrics (47→22 questions, 18→9 minutes)
- Authentic voice (casual, observational: "Started as a greeter")
- Action-oriented (shows learning through DOING, not stating "I learned")
- Cohesive flow (each sentence builds on the last)

## Example 2: Poetic but Vague (NQI: 60-70)
> "The soil breathes. I can feel it under my fingernails, dark and rich and heavy with the promise of August tomatoes. My grandfather always said that patience is a color, and in his garden, it was the green of slow-climbing vines."

**Why this struggles:**
- Poetic language without specificity ("patience is a color"—beautiful but vague)
- No concrete action or transformation
- Missing: What did you DO? What changed?
- Needs: Specific moment, dialogue, measurable outcome

**How to coach:** "This is beautiful writing, but it's more atmosphere than story. Let's add: What specific thing did your grandfather teach you? What moment showed patience in action?"

# CONVERSATION CONTINUITY

- Reference previous advice: "Since we strengthened your opening by adding Mrs. Rodriguez..."
- Track progress: "You've improved 8 points—that's real growth in [specific dimension]"
- Build progressively: Don't repeat the same advice
- Connect sections: "Your opening shows vulnerability. Now bring that same honesty to your conclusion."

# FINAL REMINDER

You are coaching towards COHESIVE, COMPELLING, POWERFUL, MEMORABLE essays—not flowery, impressive-sounding essays. The best essays sound like the student talking, just with better structure and more specific examples. Preserve their voice. Enhance their story. Don't replace it with yours.
```

---

### Phase 3: Implementation Plan

#### Task 1: Create PIQ Chat Context Builder (3-4 hours)
**File**: `src/services/piqWorkshop/piqChatContext.ts`

**Actions:**
1. Define `PIQChatContext` interface with all fingerprints
2. Implement `buildPIQChatContext()`:
   - Map `analysisResult.rubricDimensionDetails` → `analysis.dimensions`
   - Map `analysisResult.workshopItems` → `analysis.workshopItems`
   - **CRITICAL**: Include `voiceFingerprint` from `analysisResult.voiceFingerprint`
   - **CRITICAL**: Include `experienceFingerprint` from `analysisResult.experienceFingerprint`
   - Extract quality anchors from `experienceFingerprint.qualityAnchors`
   - Build version history from `draftVersions`
3. Implement `formatPIQContextForLLM()`:
   - Format voice fingerprint for coaching context
   - Highlight quality anchors: "PRESERVE THESE SENTENCES"
   - Include anti-pattern warnings
   - Keep within ~3500 token budget

#### Task 2: Write Anti-Flowery System Prompt (2-3 hours)
**File**: `src/services/piqWorkshop/piqChatService.ts`

**Actions:**
1. Write comprehensive system prompt (see Phase 2 above)
2. Add explicit "anti-flowery" instructions
3. Include golden standard examples (strong vs. poetic-but-vague)
4. Add voice preservation rules
5. Add quality anchor preservation rules

#### Task 3: Implement PIQ Chat Service (3-4 hours)
**File**: `src/services/piqWorkshop/piqChatService.ts`

**Actions:**
1. Implement `sendPIQChatMessage()`:
   - Call Claude API with full context
   - Include voice fingerprint in every prompt
   - Reference quality anchors when coaching
   - Handle multi-turn conversations
2. Implement `createPIQWelcomeMessage()`:
   - Generate personalized greeting based on NQI and voice
   - Reference quality anchors: "I can see you have strong writing in '[sentence]'"
3. Implement `getPIQConversationStarters()`:
   - Suggest questions based on their specific issues
   - Reference voice: "How can I maintain my [tone] while strengthening [dimension]?"
4. Add conversation caching (localStorage)

#### Task 4: Update ContextualWorkshopChat (1-2 hours)
**File**: `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`

**Actions:**
1. Add `mode` prop: `'extracurricular' | 'piq'`
2. Add PIQ-specific props: `piqPromptId`, `piqPromptText`
3. Switch chat service based on mode:
   - If `mode === 'piq'`: use `sendPIQChatMessage()`
   - Else: use existing `sendChatMessage()`
4. Update welcome message generation
5. Update conversation starters

#### Task 5: Integrate with PIQWorkshop (1 hour)
**File**: `src/pages/PIQWorkshop.tsx`

**Actions:**
1. Update ContextualWorkshopChat props:
   ```typescript
   <ContextualWorkshopChat
     mode="piq"
     piqPromptId={selectedPromptId}
     piqPromptText={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt}
     currentDraft={currentDraft}
     analysisResult={analysisResult} // Includes voice/experience fingerprints
     currentScore={currentScore}
     initialScore={initialScore}
     // ...
   />
   ```
2. Verify `analysisResult` includes all fingerprints
3. Test end-to-end flow

#### Task 6: Test with Golden Standard Essays (3-4 hours)
**Test Files**:
- `tests/fixtures/test-entries.ts` (STRONG_ENTRY, REFLECTIVE_ENTRY)
- `tests/test-football-captain.ts` (real-world example)
- `test-poetic-essay.ts` (poetic-but-vague example)

**Test Scenarios:**
1. **Strong Essay (NQI: 85-95)**:
   - User asks: "How can I make this even better?"
   - Expected: Reference quality anchors, suggest strategic cuts, preserve voice
   - Bad response: Suggest flowery embellishments
   - Good response: "Your opening 'Most Wednesdays smelled like bleach and citrus' is a quality anchor—keep this exact phrasing. The opportunity is in your conclusion..."

2. **Poetic but Vague (NQI: 60-70)**:
   - User asks: "Why isn't my score higher?"
   - Expected: Identify vagueness without killing poetry, suggest specific action
   - Bad response: "Add more sensory details like 'olfactory tapestry'"
   - Good response: "Your writing is beautiful—'patience is a color'—but it's more atmosphere than story. What specific moment with your grandfather showed patience in action?"

3. **Flowery Suggestion Test**:
   - Trigger: Student essay has simple, authentic language
   - Test: Does chat suggest maintaining it or replacing with flowery prose?
   - Pass criteria: Chat quotes quality anchors and says "keep this phrasing"

4. **Voice Preservation Test**:
   - Given: Voice fingerprint shows "staccato rhythm, deliberate pacing"
   - Test: Does chat suggest changes that match this pattern?
   - Pass criteria: Suggestions use similar sentence structure/length

5. **Multi-Turn Cohesion Test**:
   - Scenario: Student improves opening, asks about conclusion
   - Test: Does chat reference opening improvements and build cohesively?
   - Pass criteria: "Since we strengthened your opening by adding [X], now let's bring that same [quality] to your conclusion"

---

## Success Metrics (Quality-Focused)

### Anti-Flowery Requirements
✅ **95%+ responses preserve student voice** (don't suggest flowery alternatives)
✅ **90%+ responses reference quality anchors** ("This sentence works—keep it")
✅ **100% responses quote student's actual words** (no paraphrasing)
✅ **0% flowery red flags** ("olfactory tapestry", "symphony of emotions", etc.)

### Coaching Quality
✅ **Deep understanding**: References voice fingerprint, experience fingerprint, quality anchors
✅ **Cohesion-aware**: Suggests changes that fit narrative flow, not isolated "impressive" sentences
✅ **Authentic over polish**: Prioritizes specificity and action over flowery description
✅ **Actionable**: Every response has ONE concrete, specific next step

### Functional Requirements
✅ Chat uses full PIQ analysis context (voice/experience fingerprints, 12 dimensions, workshop items)
✅ Responses are PIQ-specific (350-word limit, UC values, prompt responsiveness)
✅ Conversation history maintains context across 10+ turns
✅ No breaking changes to extracurricular workshop

### Performance
✅ Chat loads in <500ms (cached conversation)
✅ Response time <5s for standard queries
✅ Response length: 150-250 words (conversational, focused)

---

## Timeline (Quality-First Approach)

### Day 1: Foundation (7-8 hours)
- ✅ Task 1: PIQ Chat Context Builder with fingerprints (4 hours)
- ✅ Task 2: Anti-Flowery System Prompt (3 hours)

### Day 2: Implementation (6-7 hours)
- ✅ Task 3: PIQ Chat Service (4 hours)
- ✅ Task 4: Update ContextualWorkshopChat (2 hours)
- ✅ Task 5: Integrate with PIQWorkshop (1 hour)

### Day 3: Testing & Refinement (4-5 hours)
- ✅ Task 6: Test with golden standard essays (3 hours)
- ✅ Refine system prompt based on test results (2 hours)

**Total: 17-20 hours** (increased for quality focus and thorough testing)

---

## Risk Mitigation

### Risk 1: Still Produces Flowery Suggestions
**Mitigation:**
- Explicit anti-flowery instructions in system prompt
- Few-shot examples showing bad (flowery) vs. good (authentic)
- Voice fingerprint enforced in every response
- Test with poetic-but-vague essays to catch this early

### Risk 2: Breaking Student Voice
**Mitigation:**
- Quality anchors explicitly marked "preserve—don't change"
- Voice fingerprint referenced in every coaching response
- Test with essays that have distinct voice patterns
- Monitor for suggestions that violate sentence structure/vocabulary/pacing

### Risk 3: Losing Cohesion
**Mitigation:**
- System prompt emphasizes "cohesion over isolated impressive sentences"
- Multi-turn conversation tracking to build progressively
- Test with complete essays (not isolated paragraphs)

### Risk 4: API Costs
**Mitigation:**
- Cache system prompt (80% of tokens) using Claude's prompt caching
- Limit max_tokens: 500 (enforce 150-250 word responses)
- Cache conversations in localStorage
- Estimated cost: $0.02-0.03 per conversation (10 messages)

---

## Approval Checklist

✅ **Addresses flowery bias**: Explicit anti-flowery coaching, voice preservation
✅ **Uses all analysis context**: Voice/experience fingerprints, quality anchors, workshop items
✅ **Quality-focused**: Cohesive, compelling, powerful, memorable > flowery, impressive
✅ **PIQ-specific**: 350 words, UC values, prompt responsiveness
✅ **Tested thoroughly**: Golden standard essays, voice preservation, multi-turn cohesion
✅ **No breaking changes**: Mode switching preserves extracurricular workshop

---

## Questions Answered

1. **Priority**: ✅ #1 priority
2. **Scope**: ✅ Voice/experience fingerprints included in MVP (already available from workshop-analysis)
3. **Testing**: ✅ Will use golden standard essays from `tests/fixtures/test-entries.ts`
4. **Timeline**: ✅ 17-20 hours with depth and rigor (increased for quality)
5. **Quality**: ✅ Absolute quality focus—coaching towards authentic, cohesive essays

---

## Implementation Ready

**Next Steps:**
1. Begin Task 1: Create PIQ Chat Context Builder
2. Mark todo items as complete progressively
3. Test after each phase (don't wait until end)
4. Refine system prompt based on test results
5. Deploy when all quality metrics pass

Let's build a world-class AI Essay Coach that understands essay quality holistically! 🚀
