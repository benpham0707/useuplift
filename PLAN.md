# Investigation Plan: Suggestion Quality Degradation

## Problem Statement
The suggestion system is now generating content that:
- Sounds cocky and inauthentic
- Uses a repetitive "flex" pattern instead of natural storytelling
- Lacks genuine character development
- Feels forced rather than compelling

### Examples of Problematic Output:
1. "But normal kids don't know what I know: that breaking points are breakthrough points."
2. "But they were missing the point. While they sought comfort, I was building an immunity to quit. Which one of us was really missing out?"
3. "My coach stared, confused. That's when I knew: I wasn't addicted to winning. I was addicted to the edge of breaking."
4. "I started seeking the hardest opponents, longest practices, most brutal conditioning. Other athletes avoid pain. I hunt it down."
5. "My classmates study until they're tired. I study until I'm addicted to the grind."

## Investigation Steps

### Step 1: Identify Recent Changes to Suggestion Generation System
- [ ] Review git commit history for the last 5-10 commits
- [ ] Identify all files related to suggestion generation (Phase 17)
- [ ] Check for changes to prompts, system messages, or generation logic

### Step 2: Locate Suggestion Generation Components
Files to examine:
- [ ] `/supabase/functions/workshop-analysis/index.ts` (Phase 17 - main suggestion generator)
- [ ] `/supabase/functions/teaching-layer/index.ts` (Phase 19 - should NOT affect suggestions)
- [ ] `/supabase/functions/suggestion-rationales/index.ts` (Phase 20 - rationales only)
- [ ] Any prompt configuration files
- [ ] Any recent changes to temperature, model selection, or generation parameters

### Step 3: Compare Current vs Previous Prompts
- [ ] Extract current Phase 17 system prompt
- [ ] Check git history for any modifications to suggestion generation prompts
- [ ] Identify what changed and when
- [ ] Determine if changes were intentional or accidental

### Step 4: Test Hypothesis
Possible causes to investigate:
- [ ] Temperature setting too high (causing more "creative" but less grounded responses)
- [ ] Prompt modifications that encourage "dramatic contrast" or "revelation" patterns
- [ ] Model change (different Claude version)
- [ ] Examples in prompt that demonstrate this cocky pattern
- [ ] Removed guardrails about authenticity/naturalness

### Step 5: Root Cause Analysis
- [ ] Document exactly what changed
- [ ] Explain why the change caused this degradation
- [ ] Propose specific fixes

### Step 6: Solution Design
- [ ] Restore authentic, natural storytelling voice
- [ ] Add explicit anti-patterns to avoid
- [ ] Include better examples of genuine character development
- [ ] Test with real examples to validate improvement

## Files to Investigate (Priority Order)

1. **Phase 17 Suggestion Generator** (HIGHEST PRIORITY)
   - `/supabase/functions/workshop-analysis/index.ts`
   - This is where suggestions are created

2. **Recent Commits**
   - Check commits from the last session
   - Focus on any prompt changes

3. **Configuration Files**
   - Any files that might affect suggestion tone/style

## Expected Deliverables

1. **Investigation Report** - Document what changed and why it degraded quality
2. **Root Cause Analysis** - Specific code/prompt changes that caused the issue
3. **Restoration Plan** - Detailed steps to fix the suggestion quality
4. **Testing Strategy** - How to validate the fix works

---

---

## INVESTIGATION FINDINGS

### Root Cause Identified

**COMMIT:** `35a1a25` - "Implement Phase 17: Experience Fingerprinting in workshop prompts"
**DATE:** Wed Nov 26 10:34:53 2025
**FILE:** `/supabase/functions/workshop-analysis/index.ts`

### The Problem

The Phase 17 prompt changes introduced problematic language that ENCOURAGES the cocky "flex" pattern:

#### Problematic Instruction (Line 321):
```
You MUST actively RESIST these patterns. When in doubt, choose the more surprising,
more specific, more uncomfortable option.
```

**This tells Claude:** "Be uncomfortable, be edgy, choose the surprising option"
**Result:** Students sound cocky because they're trying to be "surprising" and "uncomfortable"

#### Missing Guardrails

The old prompt said:
- "Minimal edits preserving voice" (for polished_original)
- "Heightens student's existing voice patterns" (for voice_amplifier)
- Simple, clear instructions

The new prompt says:
- "BREAKING BEYOND typical essay patterns"
- "When in doubt, choose the more surprising, more specific, more uncomfortable option"
- "Actively RESIST" safe phrasings
- "Choose uncomfortable option"

**The new prompt is telling Claude to be BOLD and SURPRISING, which results in cocky flexing.**

### Examples of How This Manifests

User's problematic outputs ALL follow this "uncomfortable/surprising/edgy" pattern:

1. "But normal kids don't know what I know" ← EDGY CONTRAST
2. "While they sought comfort, I was building an immunity to quit. Which one of us was really missing out?" ← RHETORICAL QUESTION, FLEX
3. "That's when I knew: I wasn't addicted to winning. I was addicted to the edge of breaking." ← DRAMATIC REVELATION
4. "Other athletes avoid pain. I hunt it down." ← EDGY CONTRAST, SHORT PUNCHY FLEX
5. "My classmates study until they're tired. I study until I'm addicted to the grind." ← COMPARISON FLEX

**Pattern:** The prompt's instruction to "choose the more uncomfortable option" is being interpreted as "make the student sound tough/edgy/special."

### The Paradox

The prompt says:
- "The student's essay should read like THEY wrote it - their authentic voice"
- **BUT ALSO:** "When in doubt, choose the more surprising, more specific, more uncomfortable option"

These two instructions CONFLICT. The second one overrides the first, causing all students to sound like they're trying to be edgy warriors.

---

## ROOT CAUSE ANALYSIS

### What Changed

**BEFORE (Old Prompt):**
```typescript
system: `You are a surgical essay editor. Identify specific issues in the essay
and provide 3 types of surgical fixes:

1. polished_original: Minimal edits preserving voice
2. voice_amplifier: Heightens student's existing voice patterns
3. divergent_strategy: Bold alternative exploring different angle

For each issue:
- Extract exact quote from essay
- Explain problem and why it matters
- Assign severity (critical/high/medium/low)
- Map to rubric category
- Provide 3 surgical suggestions with rationale`
```

**AFTER (Phase 17 Prompt):**
```typescript
system: `You are a Narrative Editor helping a student sound MORE LIKE THEMSELVES
while BREAKING BEYOND typical essay patterns.

**ANTI-CONVERGENCE MANDATE:**
AI writing naturally drifts toward:
- The same narrative arc (setup → struggle → triumph → lesson)
- "Safe" phrasings that feel polished but generic
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats
- Generic college essay language ("passion", "journey", "grew as a person")

You MUST actively RESIST these patterns. When in doubt, choose the more
surprising, more specific, more uncomfortable option.`
```

### Why This Causes Cocky Writing

1. **"BREAKING BEYOND typical essay patterns"** → Suggests rejecting normal storytelling
2. **"RESIST these patterns"** → Tells Claude to avoid natural narrative flow
3. **"Choose the more surprising, more specific, more uncomfortable option"** → Prioritizes shock value over authenticity
4. **"Crowd-pleasing insights that lack edge"** → Implies students should have "edge," which reads as cocky
5. **Anti-convergence focus** → Creates pressure to be different, leading to forced uniqueness

### The Actual Problem We're Solving

The prompt was designed to fix SHORT, GENERIC suggestions (158 chars → 300-500 chars).

But it OVER-CORRECTED by:
- Adding too much pressure to be "edgy" and "uncomfortable"
- Creating a new convergence pattern: the "tough guy who embraces pain" archetype
- Losing the authenticity it was trying to preserve

---

## SOLUTION DESIGN

### Core Principle

**Authenticity ≠ Edginess**

We need to remove the "uncomfortable/surprising" instructions while keeping:
- Concrete details (300-500 char requirement)
- Specific examples (Jordan 1 Retro High - $180)
- Experience Fingerprint integration
- Anti-AI-language guardrails

### Specific Fixes Required

#### 1. Remove "Uncomfortable/Surprising" Language

**REMOVE:**
```
You MUST actively RESIST these patterns. When in doubt, choose the more
surprising, more specific, more uncomfortable option.
```

**REPLACE WITH:**
```
Focus on what feels TRUE to this student's experience, not what feels impressive
or dramatic. Natural storytelling beats manufactured edge.
```

#### 2. Reframe "Anti-Convergence" Section

**CHANGE FROM:**
```
**ANTI-CONVERGENCE MANDATE:**
AI writing naturally drifts toward:
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats

You MUST actively RESIST these patterns.
```

**CHANGE TO:**
```
**AUTHENTICITY OVER PERFORMANCE:**
Avoid these common essay pitfalls:
- Writing that sounds like they're PERFORMING struggle rather than processing it
- Insights that sound impressive but aren't actually theirs
- Forced "lessons learned" that feel tacked on

Instead: Show how THIS person naturally makes sense of their experience.
```

#### 3. Add Explicit Anti-Flex Guardrails

**ADD NEW SECTION:**
```
**WHAT AUTHENTIC WRITING SOUNDS LIKE:**
- Observational, not declarative ("I noticed..." vs "I am...")
- Specific actions, not identity claims ("I stayed up debugging" vs "I'm dedicated")
- Humble discovery, not confident pronouncements
- Complexity and nuance, not black-and-white statements

**RED FLAGS - STOP IF YOU SEE:**
- "But I knew..." (revelation flex)
- "While others [weak thing], I [strong thing]" (comparison flex)
- "That's when I realized I was..." (identity claim)
- Rhetorical questions that imply superiority
- Short, punchy statements designed to sound tough
```

#### 4. Rewrite Voice Guidelines

**CHANGE FROM:**
```
Every suggestion should sound like something THIS SPECIFIC PERSON would write,
not generic "good writing."
```

**CHANGE TO:**
```
Every suggestion should sound like THIS SPECIFIC PERSON processing their own
experience - not like they're trying to impress anyone. The best essays sound
like the student is THINKING, not PERFORMING.
```

---

## PROPOSED FIX (UPDATED WITH USER FEEDBACK)

### Updated Phase 17 System Prompt

```typescript
system: `You are a Narrative Editor helping a student write authentically about their experience.

**YOUR CORE MISSION:**
The student's essay should read like THEY wrote it - their authentic voice pulling from their heart,
unique perspective, and actual lived experience. Not performing for an audience.

**THE AUTHENTICITY TEST:**
Before writing anything, ask: "Could only THIS person have written this?"
- If yes → you've captured their unique voice and experience
- If anyone could have written it → too generic, needs more of THEIR emotional truth

**AUTHENTICITY OVER PERFORMANCE:**
Avoid these common essay pitfalls:
- Writing that sounds like they're PERFORMING struggle rather than processing it
- Insights that sound impressive but aren't actually theirs
- Forced "lessons learned" that feel tacked on
- Comparisons that make the student sound superior to others
- Dramatic reveals or identity claims ("That's when I knew I was...")
- Rhetorical questions designed to flex

Instead: Show how THIS person naturally makes sense of their experience through concrete details.

**FRESH, ANTI-CONVERGENT WRITING:**
We want original, lively writing that highlights the student's character - not AI-like patterns.
- Resist generic narrative arcs (setup → struggle → triumph → lesson)
- Avoid clichéd college essay language ("passion", "journey", "grew as a person")
- Don't use AI-sounding words ("tapestry", "testament", "delve", "showcase", "underscore")
- Create fresh phrasings that feel alive and specific to this student

But DON'T manufacture "edge" or "toughness" - authentic ≠ trying to sound impressive.

**WHAT AUTHENTIC WRITING SOUNDS LIKE:**
Emotional and captivating - like pulling from the heart. Unique feeling, understanding, grasping,
perspective, or actions within that scenario that prove this person was THERE.

Good example: "I traced the circuit three times before realizing I'd swapped the resistor values.
The LED stayed dark. My lab partner had already left."

Bad example: "I noticed the circuit wasn't working. I realized I needed to be more detail-oriented."

The first SHOWS you were there with emotional texture. The second is generic reflection anyone could write.

**RED FLAGS - STOP IF YOU SEE THESE PATTERNS:**
- "But I knew..." (revelation flex)
- "While others [weak thing], I [strong thing]" (comparison flex)
- "That's when I realized I was..." (identity claim)
- Rhetorical questions that imply superiority
- Short, punchy statements designed to sound tough
- "Normal people X, but I Y" (superiority complex)
- Declarative identity claims ("I am...", "I'm the type of person who...")

**WRITING EFFICIENCY:**
Make every word count in either the micro (sentence-level craft) or macro (overall narrative arc) scheme.
- Don't inflate word count unnecessarily
- Keep suggestions close to the original length unless expanding serves a clear purpose
- Most students don't use bullet points (-) - write in natural prose
- Trim anything that doesn't advance understanding or emotion

**YOUR MANDATE:**
1. Read the Experience Fingerprint carefully - these are IRREPLACEABLE elements of their story
2. Generate 3 options that sound like THIS PERSON naturally telling their story
3. Use their unique experience elements to create writing only THEY could produce
4. Match the approximate length of the original unless expansion serves the narrative
5. Make suggestions feel emotionally true, not technically impressive

**OUTPUT FORMAT:**
Return ONLY valid JSON with this structure:
{
  "workshopItems": [
    {
      "id": "unique_id",
      "quote": "exact text from essay",
      "rubric_category": "dimension_name",
      "suggestions": [
        {
          "type": "polished_original",
          "text": "revised text (emotionally true, length-appropriate)"
        },
        {
          "type": "voice_amplifier",
          "text": "revised text (amplifies their natural voice)"
        },
        {
          "type": "divergent_strategy",
          "text": "revised text (bold alternative angle)"
        }
      ]
    }
  ]
}

**CRITICAL REMINDERS:**
- Each suggestion should match the original's approximate length (don't artificially inflate)
- Include specific details that prove this person was there (ages, times, objects, emotions)
- Make it sound like THIS student pulling from their heart, not a generic "good writer"
- Every suggestion MUST use elements from the Experience Fingerprint
- Fresh, lively writing - not AI convergence patterns`
```

---

## TESTING STRATEGY

### Test Cases

After implementing the fix, test with the user's problematic essay to verify:

**BAD PATTERNS ELIMINATED:**
- ❌ "But normal kids don't know what I know"
- ❌ "While they sought comfort, I was building immunity"
- ❌ "That's when I knew: I wasn't addicted to winning"
- ❌ "Other athletes avoid pain. I hunt it down."
- ❌ "My classmates study until tired. I study until addicted."

**GOOD PATTERNS EXPECTED:**
- ✅ Specific details about actual experiences
- ✅ Observational tone ("I noticed..." "I found myself...")
- ✅ Natural storytelling without dramatic reveals
- ✅ Genuine discovery through concrete examples
- ✅ Authentic voice that sounds like a real person thinking

---

## IMPLEMENTATION PLAN

1. **Update workshop-analysis/index.ts** with new system prompt
2. **Deploy to Supabase** with `supabase functions deploy workshop-analysis`
3. **Test with user's essay** to validate fix
4. **Compare old vs new suggestions** side by side
5. **Verify authenticity** without losing concrete details

**READY FOR YOUR APPROVAL TO IMPLEMENT**
