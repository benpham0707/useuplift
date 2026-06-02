# Phase 19: Teaching Layer API - Pass Knowledge, Not Fixes

## Vision Statement

**We teach writing craft, not prescribe edits.**

Instead of telling students "do this because severity: medium," we show them:
1. **We deeply understand their essay** (storytelling that proves we "get it")
2. **The writing principle at play** (the transferable craft knowledge)
3. **How to apply this strategy** (so they can use it in other PIQs/essays)
4. **Tone-matched guidance** (surgical tweak vs fundamental rethinking)

The user should feel: *"Wow, this system truly understands what I'm trying to do and is teaching me to be a better writer."*

---

## Current System (What We're Changing)

### Phase 17: Workshop Analysis - BEFORE
```typescript
// workshop-analysis/index.ts - Stage 4 prompt

system: `Generate surgical fixes...

OUTPUT FORMAT:
{
  "workshopItems": [
    {
      "quote": "exact text from essay",
      "problem": "brief problem description",        // ❌ REMOVE THIS
      "why_it_matters": "impact explanation",        // ❌ REMOVE THIS
      "severity": "critical" | "high" | "medium",
      "suggestions": [
        {
          "text": "revised text (300-500 chars)",
          "rationale": "why this works",             // ✅ KEEP - Already good
          "fingerprint_connection": "..."            // ✅ KEEP
        }
      ]
    }
  ]
}
```

### Phase 17: Workshop Analysis - AFTER
```typescript
// Simplified workshop-analysis prompt - FOCUS ON SUGGESTIONS ONLY

system: `Generate surgical fixes for this essay.

For each issue, provide:
- quote: exact text from essay
- severity: critical | high | medium | low
- rubric_category: which dimension this affects
- suggestions: 3 options (polished_original, voice_amplifier, divergent_strategy)
  - Each suggestion needs: text (300-500 chars), rationale, fingerprint_connection

DO NOT include "problem" or "why_it_matters" fields - these will be generated separately
with deeper context.

Focus your energy on creating excellent suggestions that sound like THIS student wrote them.`
```

**Rationale**: Don't waste tokens/focus on shallow problem descriptions. Let the teaching layer handle that with full context.

---

## Phase 19: Teaching Layer API

### New Edge Function: `supabase/functions/teaching-layer/index.ts`

**Purpose**: Generate deep, storytold guidance that teaches writing craft and shows we understand their essay.

### Input Schema
```typescript
interface TeachingLayerRequest {
  workshopItems: WorkshopItem[];        // From Phase 17 (without problem/why_it_matters)
  essayText: string;
  promptText: string;
  promptTitle: string;
  voiceFingerprint: VoiceFingerprint;
  experienceFingerprint: ExperienceFingerprint;
  rubricDimensionDetails: RubricDimension[];
  currentNQI: number;
}
```

### Output Schema
```typescript
interface TeachingLayerResponse {
  success: boolean;
  enhancedItems: EnhancedWorkshopItem[];
}

interface EnhancedWorkshopItem {
  id: string;  // Match to original workshop item

  // THE TEACHING GUIDANCE (What Phase 19 adds)
  teaching: {
    // 1. THE PROBLEM - Deep understanding that shows we "get it" + WHY IT MATTERS
    problem: {
      description: string;              // 200-350 chars
                                        // What's happening + why it's not working
                                        // Example: "You open with Foucault's theory before revealing
                                        // your debate club experience. This establishes intellectual
                                        // credibility immediately, but in a 350-word PIQ where
                                        // admissions officers scan the first 40 words to decide
                                        // 'invest or skim,' you're asking them to engage with
                                        // abstract philosophy before they care about you as a person."

      whyItMatters: string;             // 150-250 chars
                                        // Strategic consequence + admissions impact
                                        // Example: "The theory lands at word 1, the human moment
                                        // at word 23. By then, readers in 'scanning mode' have
                                        // already decided this is 'smart but disconnected.' You
                                        // have ~40 words to make them invest - this structure
                                        // wastes the most valuable real estate in your essay."
    };

    // 2. The writing principle (transferable craft knowledge)
    craftPrinciple: string;             // 150-300 chars
                                        // Example: "In narrative writing, readers need an
                                        // emotional anchor before they'll engage with abstract
                                        // ideas. It's the 'care first, learn second' principle -
                                        // make them care about YOU, then they'll care about
                                        // your ideas."

    // 3. How to apply this strategy (teach them to fish)
    applicationStrategy: string;        // 150-300 chars
                                        // Example: "Look for places where you front-load
                                        // 'impressive' before 'human.' Flip them. Start with
                                        // a specific moment (you, alone, nervous) then layer
                                        // in the intellectual context. This works across all
                                        // PIQs where you're balancing credibility + connection."

    // 4. Magnitude context (surgical vs foundational)
    changeMagnitude: 'surgical' | 'moderate' | 'structural';
    magnitudeGuidance: string;          // 100-150 chars
                                        // Example: "This is a surgical edit - moving 2 sentences.
                                        // The bones of your essay are strong, this just shifts
                                        // the entry point."
  };

  // Metadata for UI
  teachingDepth: 'foundational' | 'craft' | 'polish';
  estimatedImpact: {
    nqiGain: number;
    dimensionsAffected: string[];
  };
}
```

---

## System Prompt Design

```typescript
const TEACHING_LAYER_SYSTEM_PROMPT = `You are a master writing coach who teaches through deep understanding and transferable principles.

Your students have already received specific revision suggestions. Your job is NOT to repeat those suggestions, but to help them understand:

1. WHAT'S HAPPENING IN THEIR ESSAY (prove you deeply understand)
2. THE WRITING PRINCIPLE AT PLAY (teach the craft, not just the fix)
3. HOW TO APPLY THIS STRATEGY (empower them to use it elsewhere)
4. THE MAGNITUDE OF CHANGE (surgical tweak vs fundamental rethinking)

**YOUR TEACHING PHILOSOPHY:**

"Pass knowledge, not fixes."

Don't say: "This lacks specificity. Add concrete details."
Instead say: "You're writing in summary mode ('I learned leadership') when the reader's brain is wired for scene mode ('I stood in front of 40 blank faces'). Summary tells conclusions. Scenes show evidence. In a 350-word PIQ, every sentence either builds evidence or wastes space."

Don't say: "Severity: high. This hurts your score."
Instead say: "This is a structural issue - the essay's backbone. If we fix surface-level word choice but leave this foundation shaky, we're polishing a wobbly table. Start here, and the smaller fixes will amplify."

**STORYTELLING REQUIREMENT:**

Your "situationUnderstanding" field must prove you deeply understand their specific essay. Reference:
- Their specific topic/experience
- The exact strategic choice they made (and why it's not working)
- Their voice patterns (from voice fingerprint)
- Their unique experience elements (from experience fingerprint)

Example (GOOD):
"You open with Foucault's theory of power structures before revealing your experience founding a debate club. This creates intellectual credibility but delays emotional connection until word 87 - in a 350-word essay where readers decide to invest or scan within the first 40 words."

Example (BAD):
"Your opening is too abstract and doesn't engage the reader immediately."

**CRAFT PRINCIPLE REQUIREMENT:**

Teach the underlying writing principle, not just the fix. Make it transferable to other essays.

Example (GOOD):
"In narrative writing, readers need an emotional anchor before they'll engage with abstract ideas. It's the 'care first, learn second' principle - make them care about YOU, then they'll care about your ideas. This applies to all 4 PIQs, personal statements, even supplemental essays."

Example (BAD):
"You should start with a personal anecdote instead of theory."

**APPLICATION STRATEGY REQUIREMENT:**

Show them how to identify similar issues in other writing.

Example (GOOD):
"Look for places where you front-load 'impressive' before 'human.' Circle every sentence that starts with credentials, achievements, or abstract concepts. Ask: 'Does the reader care about me yet?' If no, flip it. Start with a specific moment (you, alone, nervous) then layer in the intellectual context."

Example (BAD):
"Apply this same principle to your other essays."

**MAGNITUDE GUIDANCE:**

Match your tone to the change magnitude:
- Surgical (moving 2 sentences, swapping order): "Quick structural fix"
- Moderate (rewriting a paragraph): "Meaningful revision"
- Structural (rethinking the essay's core approach): "Foundational change"

Be honest. If it's a quick fix, say so. If it's a deep rethink, prepare them for that.

**CONTEXT YOU HAVE:**

You receive:
- The essay text
- Voice fingerprint (their unique voice patterns)
- Experience fingerprint (irreplaceable story elements)
- Rubric scores (which dimensions are weak/strong)
- Workshop suggestions (the specific fixes already provided)

Use ALL of this context to prove you understand their essay deeply.

**OUTPUT FORMAT:**

Return ONLY valid JSON:
{
  "enhancedItems": [
    {
      "id": "workshop_item_id",
      "teaching": {
        "problem": {
          "description": "200-350 chars proving deep understanding + what's not working",
          "whyItMatters": "150-250 chars strategic consequence + admissions impact"
        },
        "craftPrinciple": "150-300 chars teaching transferable writing principle",
        "applicationStrategy": "150-300 chars showing how to apply this elsewhere",
        "changeMagnitude": "surgical" | "moderate" | "structural",
        "magnitudeGuidance": "100-150 chars setting expectations"
      },
      "teachingDepth": "foundational" | "craft" | "polish",
      "estimatedImpact": {
        "nqiGain": number,
        "dimensionsAffected": ["dimension1", "dimension2"]
      }
    }
  ]
}

**CRITICAL RULES:**

1. NEVER repeat the suggestion text (they already have that)
2. NEVER say generic advice ("add details", "be specific")
3. ALWAYS reference their specific essay content
4. ALWAYS teach the principle, not just the fix
5. ALWAYS match tone to magnitude (don't overhype small fixes)
6. Character limits are MINIMUMS - aim for the high end for depth

Your goal: The student should feel "This system truly understands what I'm trying to do and is teaching me to be a better writer."`;
```

---

## User Message Template

```typescript
const buildTeachingLayerUserMessage = (request: TeachingLayerRequest): string => {
  return `Provide teaching guidance for these workshop suggestions.

**ESSAY CONTEXT:**
Prompt: ${request.promptTitle}
Current NQI: ${request.currentNQI}/100

**ESSAY TEXT:**
${request.essayText}

**VOICE FINGERPRINT:**
${JSON.stringify(request.voiceFingerprint, null, 2)}

**EXPERIENCE FINGERPRINT:**
${JSON.stringify(request.experienceFingerprint, null, 2)}

**RUBRIC ANALYSIS:**
${JSON.stringify(request.rubricDimensionDetails, null, 2)}

**WORKSHOP SUGGESTIONS (Already provided to student):**
${JSON.stringify(request.workshopItems, null, 2)}

---

For each workshop item, generate teaching guidance that:

1. **The Problem** (200-350 chars description + 150-250 chars why it matters)
   - Description: Prove you deeply understand what's happening in their essay + why it's not working
   - Reference specific content, voice patterns, strategic choices
   - Show you "get" what they're trying to do
   - Why It Matters: Strategic consequence + admissions impact
   - Be specific about word counts, reader psychology, opportunity cost

2. **Craft Principle** (150-300 chars)
   - Teach the underlying writing principle
   - Make it transferable to other essays
   - Explain WHY this matters for narrative writing

3. **Application Strategy** (150-300 chars)
   - Show them how to identify this pattern elsewhere
   - Give them a process/lens to apply
   - Empower them to fix similar issues in other PIQs

4. **Magnitude Guidance** (100-150 chars)
   - Be honest about the change magnitude
   - Set appropriate expectations (surgical vs structural)
   - Match tone to scope (don't overhype small fixes)

Remember: You're teaching writing craft, not prescribing edits. Pass knowledge, not fixes.`;
};
```

---

## Frontend Integration

### Updated Analysis Flow

```typescript
// piqWorkshopAnalysisService.ts

export async function analyzePIQEntryThreeStep(
  essayText: string,
  promptTitle: string,
  promptText: string,
  callbacks: ThreeStepAnalysisCallbacks = {}
): Promise<AnalysisResult> {

  // PHASE 17: Generate Workshop Suggestions (88-133s)
  callbacks.onProgress?.('Analyzing your essay and generating suggestions...');
  const phase17Data = await supabase.functions.invoke('workshop-analysis', {
    body: { essayText, promptText, promptTitle, ... }
  });

  // Workshop items now DON'T have "problem" or "why_it_matters"
  const workshopItems = phase17Data.workshopItems;

  callbacks.onPhase17Complete?.(phase17Result);

  // PHASE 18: Validate Suggestion Quality (20-50s)
  callbacks.onProgress?.('Scoring suggestion quality...');
  const phase18Data = await supabase.functions.invoke('validate-workshop', {
    body: { workshopItems, essayText, promptText }
  });

  callbacks.onPhase18Complete?.(phase18Result);

  // PHASE 19: Generate Teaching Layer (30-50s) ← NEW
  callbacks.onProgress?.('Generating teaching guidance...');
  const phase19Data = await supabase.functions.invoke('teaching-layer', {
    body: {
      workshopItems: phase18Data.workshopItems,
      essayText,
      promptText,
      promptTitle,
      voiceFingerprint: phase17Data.voiceFingerprint,
      experienceFingerprint: phase17Data.experienceFingerprint,
      rubricDimensionDetails: phase17Data.rubricDimensionDetails,
      currentNQI: phase17Data.analysis.narrative_quality_index
    }
  });

  // Merge teaching guidance into workshop items
  const enhancedWorkshopItems = mergeTeachingLayer(
    phase18Data.workshopItems,
    phase19Data.enhancedItems
  );

  callbacks.onPhase19Complete?.(enhancedResult);

  return {
    ...phase17Result,
    workshopItems: enhancedWorkshopItems
  };
}
```

### UI Component Updates

```tsx
// TeachingUnitCardIntegrated.tsx

{/* ENHANCED "THE PROBLEM" SECTION - Keep structure, upgrade content */}
{issue.teaching && (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        The Problem
      </p>
    </div>
    <div className="space-y-2">
      {/* Problem Description - Deep understanding */}
      <p className="text-sm text-foreground leading-relaxed">
        {issue.teaching.problem.description}
      </p>

      {/* Why It Matters - Strategic consequence */}
      <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
        <p className="text-xs font-semibold text-primary mb-1">
          💡 Why This Matters
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {issue.teaching.problem.whyItMatters}
        </p>
      </div>

      {/* Magnitude Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={issue.teaching.changeMagnitude === 'surgical' ? 'secondary' : 'default'}>
          {issue.teaching.changeMagnitude === 'surgical' ? '🔧 Surgical Edit' :
           issue.teaching.changeMagnitude === 'moderate' ? '✏️ Moderate Revision' :
           '🏗️ Structural Change'}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {issue.teaching.magnitudeGuidance}
        </p>
      </div>
    </div>
  </div>
)}

{/* NEW TEACHING SECTION - Craft Principle + Application Strategy */}
{issue.teaching && (
  <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">

    {/* Craft Principle - Teach the transferable knowledge */}
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-purple-600" />
        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
          The Writing Principle
        </p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        {issue.teaching.craftPrinciple}
      </p>
    </div>

    {/* Application Strategy - Show them how to replicate */}
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-green-600" />
        <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">
          How to Apply This Strategy
        </p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        {issue.teaching.applicationStrategy}
      </p>
    </div>

  </div>
)}

{/* KEEP EXISTING SUGGESTION CAROUSEL - That's already good */}
```

---

## Example Output

### Input (Workshop Item from Phase 17)
```json
{
  "id": "opening_hook_001",
  "quote": "Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club.",
  "severity": "high",
  "rubric_category": "narrative_arc_stakes",
  "suggestions": [
    {
      "type": "polished_original",
      "text": "I stood in front of forty blank faces, palms sweating through my note cards. 'Who wants to argue about whether our student council actually has power?' Three hands went up. By spring, we had twenty-seven members analyzing everything from dress codes to district budget priorities. Foucault would've loved it.",
      "rationale": "Opens with specific scene (you, nervous, forty faces) before introducing the intellectual framework. The theory becomes the conclusion, not the premise - showing you discovered it through experience rather than applying it from a textbook.",
      "fingerprint_connection": "Uses your understated voice pattern ('would've loved it' vs 'perfectly illustrated') and preserves your analytical lens while grounding it in moment"
    }
  ]
}
```

### Output (Phase 19 Teaching Layer)
```json
{
  "id": "opening_hook_001",
  "teaching": {
    "problem": {
      "description": "You open with Foucault's theory before revealing your debate club experience. This establishes intellectual credibility immediately, but in a 350-word PIQ where admissions officers scan the first 40 words to decide 'invest or skim,' you're asking them to engage with abstract philosophy before they care about you as a person. The theory lands at word 1, the human moment at word 23.",

      "whyItMatters": "By word 23, readers in 'scanning mode' have already decided this is 'smart but disconnected.' You have ~40 words to make them invest - this structure wastes the most valuable real estate in your essay. First impressions in PIQs determine if they read carefully or skim. Opening with theory signals 'academic exercise' instead of 'compelling human story.'"
    },

    "craftPrinciple": "Narrative writing operates on 'care first, learn second.' Readers need an emotional anchor - a specific person in a specific moment - before they'll engage with ideas. Think of it like a documentary: you don't start with the historical context, you start with a face, a moment, a question. Then you zoom out to show why it matters. This isn't dumbing down - it's strategic sequencing for how brains process story.",

    "applicationStrategy": "Look at all four of your PIQs and circle every sentence that starts with credentials, theory, or achievements ('I founded', 'I learned', 'Research shows'). Ask: 'Does the reader care about me yet?' If no, you're front-loading impressive before human. Flip it. Find the moment BEFORE the achievement - you, alone, nervous, deciding - then layer in the context. This works across personal statements, supplementals, any narrative essay.",

    "changeMagnitude": "surgical",
    "magnitudeGuidance": "This is a structural flip - moving where the theory appears - but the bones of your essay are strong. You're not rewriting, you're resequencing. 10 minutes of revision for significant engagement gain."
  },

  "teachingDepth": "craft",
  "estimatedImpact": {
    "nqiGain": 8,
    "dimensionsAffected": [
      "narrative_arc_stakes",
      "opening_power_scene_entry",
      "character_interiority_vulnerability"
    ]
  }
}
```

---

## Implementation Checklist

### Phase 1: Update Phase 17 (Workshop Analysis)
- [ ] Remove "problem" field from workshop-analysis prompt
- [ ] Remove "why_it_matters" field from workshop-analysis prompt
- [ ] Update TypeScript interfaces to reflect simplified structure
- [ ] Test Phase 17 independently - verify suggestions are still high quality
- [ ] Redeploy workshop-analysis edge function

### Phase 2: Create Phase 19 (Teaching Layer)
- [ ] Create `supabase/functions/teaching-layer/index.ts`
- [ ] Implement system prompt (teaching philosophy)
- [ ] Implement user message builder
- [ ] Add JSON parsing and error handling
- [ ] Test with 3-5 sample workshop items
- [ ] Deploy teaching-layer edge function

### Phase 3: Frontend Integration
- [ ] Update `piqWorkshopAnalysisService.ts` with three-step flow
- [ ] Add Phase 19 to callback system (onPhase19Complete)
- [ ] Implement mergeTeachingLayer() utility
- [ ] Update TypeScript types (EnhancedWorkshopItem)
- [ ] Test service layer integration

### Phase 4: UI Updates
- [ ] Update `TeachingUnitCardIntegrated.tsx`
- [ ] Remove old "The Problem" + "Why It Matters" sections
- [ ] Add new teaching guidance sections:
  - [ ] Situation Understanding
  - [ ] Craft Principle
  - [ ] Application Strategy
  - [ ] Magnitude Guidance
- [ ] Add loading states for Phase 19
- [ ] Add error handling for Phase 19 failures

### Phase 5: Testing & Iteration
- [ ] Test with 5-10 real PIQ essays
- [ ] Evaluate teaching quality (does it "pass knowledge"?)
- [ ] Verify tone matching (surgical vs structural)
- [ ] Check character counts meet minimums
- [ ] Iterate on system prompt based on quality

### Phase 6: Polish
- [ ] Add graceful degradation (if Phase 19 fails)
- [ ] Implement retry logic
- [ ] Add performance monitoring
- [ ] Update documentation

---

## Success Criteria

### Qualitative
1. **Deep Understanding**: User reads "The Problem" and thinks "Wow, it really gets my essay"
2. **Strategic Clarity**: "Why It Matters" makes the stakes/consequences clear
3. **Transferable Knowledge**: User can apply "Craft Principle" to other PIQs
4. **Empowerment**: User feels taught, not told
5. **Tone Matching**: Surgical fixes don't feel overhyped, structural changes prepare user for work

### Quantitative
1. **Character Counts**:
   - problem.description: 200-350 chars (aim for 280+)
   - problem.whyItMatters: 150-250 chars (aim for 200+)
   - craftPrinciple: 150-300 chars (aim for 250+)
   - applicationStrategy: 150-300 chars (aim for 250+)
   - magnitudeGuidance: 100-150 chars

2. **Performance**:
   - Phase 19 duration: 30-50s
   - Total three-step analysis: 138-233s (~2-4 minutes)

3. **Quality**:
   - Zero generic advice ("add details", "be specific")
   - 100% reference specific essay content
   - 100% teach principle, not just fix
   - Every "Why It Matters" includes strategic/admissions context

---

## Timeline Estimate

- **Phase 1** (Update Phase 17): 1 hour
- **Phase 2** (Create Phase 19): 2-3 hours
- **Phase 3** (Frontend Integration): 2 hours
- **Phase 4** (UI Updates): 2 hours
- **Phase 5** (Testing & Iteration): 3-4 hours
- **Phase 6** (Polish): 1 hour

**Total**: 11-13 hours of focused work

---

## Next Steps

1. **Get your approval** on this approach
2. **Generate 2-3 sample outputs** so you can see the teaching quality before we build
3. **Implement Phase 1** (simplify Phase 17)
4. **Build & test Phase 19** in isolation
5. **Integrate & deploy**

Ready to proceed?
