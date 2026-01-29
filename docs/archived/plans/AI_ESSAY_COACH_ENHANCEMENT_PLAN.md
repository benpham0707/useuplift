# AI Essay Coach Enhancement Plan for PIQ Workshop

## Executive Summary

The current AI Essay Coach implementation for the PIQ Workshop uses a **recycled backend from the extracurricular workshop** that lacks PIQ-specific context. This plan outlines how to create a **world-class, PIQ-optimized AI Essay Coach** that leverages:

1. **Full PIQ Workshop Analysis Context** (12-dimension rubric, workshop items, voice fingerprint, experience fingerprint)
2. **PIQ-Specific Coaching Knowledge** (UC PIQ prompt requirements, word limits, UC admissions criteria)
3. **Deep Conversational Intelligence** (multi-turn dialogue, progressive coaching, contextual awareness)

---

## Current State Analysis

### What We Have ✅
- **Comprehensive backend analysis**: `workshop-analysis` edge function with 4-stage surgical analysis
  - Stage 1: Voice Fingerprint (4 dimensions: sentence structure, vocabulary, pacing, tone)
  - Stage 2: Experience Fingerprint (6 uniqueness dimensions + anti-convergence detection)
  - Stage 3: 12-Dimension Rubric Analysis (opening_hook, character_development, stakes_tension, etc.)
  - Stage 4: Surgical Workshop Items (up to 12 issues with 3 suggestion types each)
- **Rich frontend state**: PIQWorkshop.tsx maintains full analysisResult with:
  - `voiceFingerprint`, `experienceFingerprint`
  - `rubricDimensionDetails` (12 dimensions with scores and evidence)
  - `workshopItems` (surgical fixes with quotes, problems, suggestions)
  - `analysis.narrative_quality_index` (NQI score)
- **Chat UI component**: `ContextualWorkshopChat.tsx` with message history, recommendations, conversation starters
- **Chat service**: `chatService.ts` and `chatServiceV3.ts` with system prompts and context formatting

### What's Missing ❌
1. **PIQ-Specific Context Builder**: Current `chatContext.ts` is built for extracurricular activities, not PIQ essays
   - References `ExtracurricularItem` (activity.name, role, category, time commitment)
   - Missing PIQ-specific fields: prompt text, prompt number, word limit (350), UC criteria
   - Doesn't include voice/experience fingerprints in context
   - Doesn't leverage 12-dimension workshop items properly

2. **PIQ-Optimized System Prompt**: Current prompts reference "activity narratives" not "UC PIQ responses"
   - Missing UC-specific coaching (authenticity, specificity, transformation requirements)
   - Doesn't reference PIQ constraints (350 words, 8 prompts, choose 4)
   - Lacks PIQ-specific elite standards (what makes a Stanford-worthy PIQ response)

3. **Context Integration**: Frontend passes `analysisResult` but chat doesn't fully utilize:
   - Voice fingerprint not included in coaching (e.g., "Your sentence structure is 'varied complex with short punchy beats' - let's maintain this in your revision")
   - Experience fingerprint anti-patterns not mentioned (e.g., "Your essay follows a typical 'challenge-overcome-growth' arc which 47% of applicants use")
   - Workshop items not deeply integrated into conversation flow

---

## Proposed Solution Architecture

### Phase 1: Create PIQ-Specific Context Builder
**File**: `src/services/piqWorkshop/piqChatContext.ts`

```typescript
export interface PIQChatContext {
  // PIQ Essay Context
  piqEssay: {
    promptId: string;
    promptNumber: number;
    promptTitle: string;
    promptText: string;
    category: string; // 'leadership', 'talent', 'creative', etc.
    wordLimit: 350;
    currentWordCount: number;
    selectedOfEight: number; // which 4 of 8 prompts they're using
  };

  // Current Draft State
  currentState: {
    draft: string;
    wordCount: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  };

  // Comprehensive Analysis
  analysis: {
    nqi: number;
    initialNqi: number;
    delta: number;
    tier: 'excellent' | 'strong' | 'competitive' | 'developing';

    // 12-Dimension Rubric (from rubricDimensionDetails)
    dimensions: Array<{
      name: string;
      score: number;
      maxScore: 10;
      percentage: number;
      status: 'excellent' | 'good' | 'needs_work' | 'critical';
      justification: string;
      strengths: string[];
      weaknesses: string[];
    }>;

    // Workshop Items (surgical fixes)
    workshopItems: Array<{
      id: string;
      quote: string;
      problem: string;
      whyItMatters: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      rubricCategory: string;
      suggestions: Array<{
        type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
        text: string;
        rationale: string;
      }>;
    }>;
  };

  // Voice Fingerprint
  voiceFingerprint: {
    sentenceStructure: {
      pattern: string;
      example: string;
    };
    vocabulary: {
      level: string;
      signatureWords: string[];
    };
    pacing: {
      speed: string;
      rhythm: string;
    };
    tone: {
      primary: string;
      secondary: string;
    };
  } | null;

  // Experience Fingerprint (Anti-Convergence)
  experienceFingerprint: {
    uniqueElements: {
      unusualCircumstance?: { description: string; whyItMatters: string };
      unexpectedEmotion?: { emotion: string; trigger: string };
      contraryInsight?: { insight: string; againstWhat: string };
      specificSensoryAnchor?: { sensory: string; emotionalWeight: string };
      uniqueRelationship?: { person: string; unexpectedAspect: string };
      culturalSpecificity?: { element: string; universalBridge: string };
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
  history: {
    totalVersions: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    nqiDelta: number;
    timeline: Array<{
      timestamp: number;
      nqi: number;
      note?: string;
    }>;
  };

  // User Authentication State
  user: {
    isAuthenticated: boolean;
    userId?: string;
  };
}
```

**Key Functions**:
```typescript
export function buildPIQChatContext(
  promptId: string,
  promptText: string,
  currentDraft: string,
  analysisResult: AnalysisResult | null,
  options: {
    currentScore: number;
    initialScore: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
  }
): PIQChatContext;

export function formatPIQContextForLLM(context: PIQChatContext): string;
```

---

### Phase 2: Create PIQ-Optimized Chat Service
**File**: `src/services/piqWorkshop/piqChatService.ts`

**System Prompt** (comprehensive, PIQ-specific):

```markdown
You are a world-class UC PIQ essay coach with deep expertise in:
1. UC admissions criteria (authenticity, impact, growth, specificity)
2. PIQ-specific constraints (350 words, choose 4 of 8 prompts)
3. Voice preservation (maintaining student's authentic writing style)
4. Anti-convergence coaching (helping students avoid generic patterns)

# YOUR COACHING CONTEXT

You have access to unprecedented depth of analysis:
- **12-Dimension Rubric**: Detailed scores across opening_hook, character_development,
  stakes_tension, climax_turning_point, conclusion_reflection, narrative_voice,
  structural_clarity, sensory_details, insight_depth, emotional_resonance,
  uniqueness_differentiation, prompt_responsiveness
- **Voice Fingerprint**: Analysis of student's unique writing voice (sentence structure,
  vocabulary, pacing, tone) with specific examples from their draft
- **Experience Fingerprint**: Detection of unique vs. convergent story elements,
  anti-patterns to avoid, quality anchors to preserve
- **Surgical Workshop Items**: Up to 12 specific issues with exact quotes, problems,
  rationale, and 3 types of surgical fixes (polished_original, voice_amplifier,
  divergent_strategy)

# COACHING PHILOSOPHY

**Deep Understanding Through Specificity**:
- Always quote their actual words: "You wrote: '[exact quote]'"
- Reference their voice fingerprint: "Your sentence structure is '[pattern]' - let's maintain this"
- Cite workshop items: "Workshop item #3 identifies this as '[problem]' because '[why_it_matters]'"
- Use dimension scores contextually: "Your opening_hook scored 6.5/10 because [specific reason]"

**PIQ-Specific Coaching**:
- **Word Economy**: 350 words is precious - every sentence must earn its place
- **Prompt Responsiveness**: Must clearly answer the specific PIQ prompt
- **UC Values**: Authenticity > polish, specificity > vagueness, growth > achievement
- **Anti-Convergence**: Help students avoid the 5 most common PIQ patterns:
  1. Challenge → Overcome → Growth arc (47% of essays)
  2. Generic leadership lessons ("I learned teamwork")
  3. Stats-heavy impact without emotional depth
  4. Manufactured transformation moments
  5. Ending with "This experience taught me X"

**CRITICAL: Anti-Flowery Bias - Creating COHESIVE, COMPELLING, POWERFUL, MEMORABLE Essays**:

**THE PROBLEM**: Workshop suggestions often push toward flowery, overly detailed writing. This is WRONG for PIQ essays.

**THE SOLUTION**: Every piece of coaching must serve one of these four qualities:

1. **COHESIVE** (Every sentence connects to the core thread)
   - ❌ BAD COACHING: "Add more background about your childhood"
   - ✅ GOOD COACHING: "Your first two paragraphs are about coding. Paragraph 3 jumps to volunteering. Pick ONE thread."
   - **Test**: Can you remove this sentence without the essay falling apart? If yes, remove it.

2. **COMPELLING** (Reader can't look away - tension, stakes, questions)
   - ❌ BAD COACHING: "Describe the setting in more detail"
   - ✅ GOOD COACHING: "You wrote 'I was nervous.' What did you risk losing? That's your stakes."
   - **Test**: Does this make the reader ask "What happens next?" If not, it's filler.

3. **POWERFUL** (Emotional punch through specificity, not decoration)
   - ❌ BAD COACHING: "Add rich, vivid sensory details that paint a picture"
   - ✅ GOOD COACHING: "You wrote 'I felt sad.' What did that sadness LOOK like? Did your hands shake? Did you stare at the floor?"
   - **Test**: Does this make me FEEL something or just SEE something? Seeing isn't enough.

4. **MEMORABLE** (One image/moment reader can't forget - not everything)
   - ❌ BAD COACHING: "Elaborate on each step of your process"
   - ✅ GOOD COACHING: "What's the ONE moment that changed everything? Make that sharper. Cut the rest."
   - **Test**: If the reader remembers ONE thing from this essay, what should it be? Amplify that. Minimize everything else.

**ANTI-FLOWERY EXAMPLES**:

Bad Coaching: "Expand this moment with descriptive language to help the reader visualize the scene more clearly."
Why It's Bad: Pushes toward decoration, not depth. Creates bloat.

Good Coaching: "You wrote: 'The lab was quiet.' What were you afraid of in that silence? Name it."
Why It's Good: Pushes toward emotional truth, not decoration. Creates power.

Bad Coaching: "Add more detail about your relationship with your mentor to develop this character."
Why It's Bad: "More detail" is vague. Creates generic character development.

Good Coaching: "You called her 'my mentor.' What did she do that NO OTHER mentor would do? Show me that one thing."
Why It's Good: Specific, unique, memorable. Anti-convergent.

Bad Coaching: "Elaborate on your feelings in this scene to deepen the emotional resonance."
Why It's Bad: "Elaborate" and "deepen" are flowery non-instructions.

Good Coaching: "You wrote 'I was disappointed.' That's a summary. What did disappointment make you DO? Did you slam the door? Stare at your phone for an hour? Show me the action."
Why It's Good: Show don't tell. Concrete, not abstract.

**HOLISTIC ESSAY UNDERSTANDING - Reading Between the Lines**:

The coach must understand what the student is ACTUALLY trying to say, not just what they wrote:
- **Student writes**: "This experience taught me the value of perseverance."
- **What they probably mean**: "I kept going even when I wanted to quit, and that changed how I see myself."
- **Good Coaching**: "I can tell this changed you. But 'taught me perseverance' is what 10,000 other essays say. What did you learn about YOURSELF that you didn't know before? Name it specifically."

- **Student writes**: "The vibrant colors of the sunset reflected my inner turmoil."
- **What they probably mean**: "I was confused and watching the sunset helped me think."
- **Good Coaching**: "Cut the metaphor. You're trying to say you were confused - say it directly. What were you actually confused about?"

**DEEP CONTEXT INTEGRATION - Using the Analysis, Not Ignoring It**:

The coach must ACTIVELY USE the voice/experience fingerprints and workshop items:
- If voice fingerprint shows "short punchy sentences": "Your voice is naturally concise. This paragraph has three 40-word sentences. Break them up - you're fighting your own voice."
- If experience fingerprint flags "typical challenge-overcome arc": "Your essay follows the most common PIQ pattern (challenge→overcome→growth). The analysis flagged this. Let's find your unique angle: what DIDN'T work? What are you still figuring out?"
- If workshop item says "Vague insight: 'This taught me teamwork'": "The analysis identified your conclusion as generic. You wrote 'learned teamwork' - but what specifically about teamwork? Leading people who don't want to be led? Letting go of control? Name it."

**THREE-Tier Coaching Based on NQI**:
- **85-100 (Stanford/Harvard tier)**: Voice preservation, nuance refinement, strategic cuts
- **70-84 (UCLA/Berkeley tier)**: Deepen vulnerability, add sensory details, strengthen insight
- **40-69 (Competitive tier)**: Add specificity, show don't tell, structure narrative arc
- **0-39 (Developing tier)**: Start with story, not summary; one moment, not timeline

**Response Structure** (150-250 words):
1. **Acknowledge & Quote** (1-2 sentences): "Looking at your [prompt category] PIQ (currently [NQI]/100)... You wrote: '[quote]'"
2. **Identify Opportunity** (2-3 sentences): "This is [what it is now]. The opportunity is [what it could be]."
3. **Show What Strong Looks Like** (2-3 sentences): "Here's what this could become: [example using their context]"
4. **Give Actionable Guidance** (1-2 sentences): "Try this: [specific, concrete next step]"
5. **Offer Options** (1 sentence): "Want to explore [A] or [B] next?"

# WHAT TO AVOID
❌ Generic encouragement without substance
❌ Vague advice ("add more depth")
❌ System language (don't say "workshop item" - say "I noticed this issue")
❌ Multiple suggestions at once (pick ONE focus)
❌ Rewriting their essay for them
❌ Off-topic tangents about college admissions strategy

# CONVERSATION CONTINUITY
- Track what advice was already given (check conversation history)
- Build progressively: "Since we strengthened your opening with Mrs. Chen, now let's..."
- Reference their progress: "You've improved [X] points - that shows [specific skill]"
- Connect sections: "Your opening shows vulnerability. Now bring that into the climax..."

You are their expert guide helping them write an authentic, differentiated PIQ that
showcases who they are and why they belong at UC schools.
```

**Key Functions**:
```typescript
export async function sendPIQChatMessage(
  userMessage: string,
  context: PIQChatContext,
  conversationHistory: ChatMessage[]
): Promise<{
  message: ChatMessage;
  recommendations?: ChatRecommendation[];
}>;

export function createPIQWelcomeMessage(context: PIQChatContext): ChatMessage;

export function getPIQConversationStarters(context: PIQChatContext): string[];
```

---

### Phase 3: Update ContextualWorkshopChat Component
**File**: `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`

**Changes**:
1. Accept new prop type for PIQ mode:
```typescript
interface ContextualWorkshopChatProps {
  mode: 'extracurricular' | 'piq';

  // PIQ-specific props
  piqPromptId?: string;
  piqPromptText?: string;

  // Existing props
  activity: ExtracurricularItem;
  currentDraft: string;
  analysisResult: AnalysisResult | null;
  // ...
}
```

2. Switch chat service based on mode:
```typescript
import { sendChatMessage } from '@/services/workshop/chatService';
import { sendPIQChatMessage } from '@/services/piqWorkshop/piqChatService';
import { buildPIQChatContext } from '@/services/piqWorkshop/piqChatContext';

const handleSendMessage = async () => {
  if (mode === 'piq' && piqPromptId && piqPromptText) {
    const context = buildPIQChatContext(
      piqPromptId,
      piqPromptText,
      currentDraft,
      analysisResult,
      { currentScore, initialScore, hasUnsavedChanges, needsReanalysis }
    );

    const response = await sendPIQChatMessage(
      userInput.trim(),
      context,
      chatMessages
    );
    // ... handle response
  } else {
    // Existing extracurricular chat logic
  }
};
```

---

### Phase 4: Update PIQWorkshop Page Integration
**File**: `src/pages/PIQWorkshop.tsx`

**Changes** (lines 1583-1596):
```typescript
<ContextualWorkshopChat
  mode="piq"
  piqPromptId={selectedPromptId}
  piqPromptText={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt}
  activity={MOCK_PIQ as any} // Keep for compatibility
  currentDraft={currentDraft}
  analysisResult={analysisResult}
  teachingCoaching={null} // PIQ doesn't use teaching coaching format
  currentScore={currentScore}
  initialScore={initialScore}
  hasUnsavedChanges={hasUnsavedChanges}
  needsReanalysis={needsReanalysis}
  reflectionPromptsMap={new Map()}
  reflectionAnswers={{}}
  onTriggerReanalysis={handleRequestReanalysis}
/>
```

---

## Implementation Plan

### Task Breakdown

#### Task 1: Create PIQ Chat Context Builder (2-3 hours)
- **File**: `src/services/piqWorkshop/piqChatContext.ts`
- **Actions**:
  1. Define `PIQChatContext` interface
  2. Implement `buildPIQChatContext()` function
     - Map `analysisResult.rubricDimensionDetails` to `analysis.dimensions`
     - Map `analysisResult.workshopItems` to `analysis.workshopItems`
     - Include `voiceFingerprint` and `experienceFingerprint` from analysisResult
     - Build version history from draftVersions
  3. Implement `formatPIQContextForLLM()` function
     - Format for Claude consumption (markdown, concise, hierarchical)
     - Include all critical context within token budget (~3000 tokens)
  4. Write unit tests for context building

#### Task 2: Create PIQ Chat Service (3-4 hours)
- **File**: `src/services/piqWorkshop/piqChatService.ts`
- **Actions**:
  1. Write comprehensive PIQ-specific system prompt (see Phase 2)
  2. Implement `sendPIQChatMessage()` function
     - Call Claude API with PIQ context
     - Handle multi-turn conversations
     - Extract recommendations (expand dimension, apply suggestion, etc.)
  3. Implement helper functions:
     - `createPIQWelcomeMessage()`: Generate personalized greeting based on NQI and analysis
     - `getPIQConversationStarters()`: Suggest relevant first questions
     - `analyzePIQSpecificIssues()`: Pattern matching for common PIQ problems
  4. Add conversation caching (localStorage)
  5. Write integration tests

#### Task 3: Update ContextualWorkshopChat Component (1-2 hours)
- **File**: `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`
- **Actions**:
  1. Add `mode` prop with type guard
  2. Add PIQ-specific props (`piqPromptId`, `piqPromptText`)
  3. Switch chat service based on mode
  4. Update welcome message generation
  5. Update conversation starters
  6. Test with both modes

#### Task 4: Integrate with PIQWorkshop Page (1 hour)
- **File**: `src/pages/PIQWorkshop.tsx`
- **Actions**:
  1. Update ContextualWorkshopChat props
  2. Pass `mode="piq"` and PIQ-specific data
  3. Verify analysisResult is passed correctly
  4. Test end-to-end conversation flow

#### Task 5: Testing & Refinement (2-3 hours)
- **Actions**:
  1. Test with all 8 UC PIQ prompts
  2. Test with different NQI ranges (20, 50, 70, 85, 95)
  3. Test multi-turn conversations (10+ messages)
  4. Test recommendation triggers
  5. Test edge cases (no analysis, empty draft, etc.)
  6. Refine system prompt based on response quality
  7. Add error handling and fallbacks

---

## Testing Strategy

### Unit Tests
```typescript
// piqChatContext.test.ts
describe('buildPIQChatContext', () => {
  it('should include voice fingerprint in context');
  it('should include experience fingerprint in context');
  it('should map rubricDimensionDetails to dimensions array');
  it('should map workshopItems with all 3 suggestion types');
  it('should calculate word count correctly');
  it('should handle null analysisResult gracefully');
});
```

### Integration Tests
```typescript
// piqChatService.test.ts
describe('sendPIQChatMessage', () => {
  it('should generate contextual response for low NQI');
  it('should quote student draft in response');
  it('should reference voice fingerprint when relevant');
  it('should suggest workshop item fixes when appropriate');
  it('should maintain conversation continuity across turns');
  it('should stay within word limit (150-250 words)');
});
```

### Manual Test Scenarios
1. **New user, first analysis** (NQI: 45)
   - User asks: "Why is my score low?"
   - Expected: Quote draft, identify 1-2 critical issues, reference workshop items, give specific fix

2. **Improving user** (NQI: 65 → 73)
   - User asks: "How did I improve?"
   - Expected: Celebrate progress, reference what changed, suggest next focus area

3. **High performer** (NQI: 87)
   - User asks: "How can I make this perfect?"
   - Expected: Voice preservation advice, strategic cuts, nuance refinement

4. **Stuck user** (NQI: 52, 3 versions, no improvement)
   - User asks: "I'm stuck, what should I do?"
   - Expected: Empathetic response, identify blocking issue, suggest reflection exercise

---

## Success Metrics

### Functional Requirements
✅ Chat uses full PIQ analysis context (voice/experience fingerprints, 12 dimensions, workshop items)
✅ Responses are PIQ-specific (not generic activity coaching)
✅ System quotes student draft in every substantive response
✅ Recommendations trigger correctly (expand dimension, apply suggestion)
✅ Conversation history maintains context across 10+ turns
✅ No loss of existing extracurricular workshop functionality

### Quality Requirements
✅ 95%+ responses quote student's actual words
✅ 90%+ responses reference specific analysis data (dimension scores, workshop items)
✅ 80%+ responses provide actionable, specific guidance (not vague "add more detail")
✅ Response length: 150-250 words (conversational, not essay-length)
✅ Zero hallucinations (all facts from actual analysis)

### User Experience
✅ Chat loads in <500ms (cached conversation)
✅ Response time <5s for standard queries
✅ Welcome message is personalized based on NQI and prompt
✅ Conversation starters are relevant to their specific issues
✅ User can resume conversation after page refresh

---

## Risk Mitigation

### Risk 1: Context Too Large (Token Limits)
**Mitigation**:
- Prioritize most important context: current draft > workshop items > dimensions > fingerprints
- Truncate older conversation history (keep last 6 messages)
- Use Claude's prompt caching for system prompt (~75% cost reduction)

### Risk 2: Generic Responses Despite Context
**Mitigation**:
- Add explicit instruction: "You MUST quote their actual draft text in your response"
- Few-shot examples in system prompt showing good vs. bad responses
- Temperature: 0.7 (not too creative, not too rigid)

### Risk 3: Breaking Extracurricular Workshop
**Mitigation**:
- Use mode prop to switch behavior (no changes to existing code paths)
- Comprehensive integration tests for both modes
- Gradual rollout (PIQ first, then ensure extracurricular unchanged)

### Risk 4: API Costs
**Mitigation**:
- Cache system prompt (80% of tokens)
- Limit max_tokens: 500 (enforce 150-250 word responses)
- Cache conversations in localStorage (reduce redundant messages)
- Estimated cost: $0.02-0.03 per conversation (10 messages)

---

## Timeline

### Day 1: Foundation (6-7 hours)
- ✅ Task 1: PIQ Chat Context Builder (3 hours)
- ✅ Task 2: PIQ Chat Service (4 hours)

### Day 2: Integration & Testing (4-5 hours)
- ✅ Task 3: Update ContextualWorkshopChat (2 hours)
- ✅ Task 4: Integrate with PIQWorkshop (1 hour)
- ✅ Task 5: Testing & Refinement (3 hours)

**Total: 10-12 hours**

---

## Future Enhancements (Post-MVP)

1. **Voice-Aware Coaching**: "Your vocabulary level is 'accessible with technical precision'. Let's maintain this by..."
2. **Anti-Convergence Warnings**: "Your essay follows a typical challenge→overcome→growth arc (47% of essays). Here's how to diverge..."
3. **Workshop Item Integration**: Click on suggestion in chat → auto-scroll to workshop item in rubric
4. **Reflection Prompt Generation**: AI generates custom reflection questions based on their specific issues
5. **Draft Comparison**: "In version 2, you strengthened your opening by adding [specific change]. Now let's apply that technique to your conclusion..."
6. **Multi-Essay Strategy**: "You're using PIQ #1 (leadership) and #4 (talent). Make sure your leadership essay doesn't overlap with [specific aspect]"

---

## Approval Checklist

Before beginning implementation:
- [ ] User approves overall architecture (PIQ-specific context + service)
- [ ] User approves system prompt philosophy (deep context, quote student, PIQ-specific)
- [ ] User approves task breakdown and timeline (10-12 hours)
- [ ] User approves testing strategy
- [ ] User confirms this won't break existing extracurricular workshop

---

## Questions for User

1. **Priority**: Is this the #1 priority, or are there other features needed first?
2. **Scope**: Do you want voice fingerprint and experience fingerprint coaching in MVP, or save for v2?
3. **Testing**: Do you have specific test cases/essays you want me to validate against?
4. **Timeline**: Is 10-12 hours acceptable, or do you need this faster?
5. **Quality Bar**: What's more important - speed to ship or absolute quality?
