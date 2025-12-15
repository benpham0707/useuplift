# Stage 0: Multi-Stage Voice Excavation Architecture

## The Problem with One-Shot Generation

Our current approach tries to do too much in a single prompt:
- Analyze for spark gaps
- Detect register
- Generate a complete draft with voice, flow, structure, AND candidate appeal

**Result**: Essays that are strong in some areas but weak in others:
- CMU essay lost its flow and got worse
- Grandfather essay is sophisticated but doesn't center the writer as a candidate
- Vocabulary often overwrought ("institutional knowledge", "computational research environment")
- No natural transitions between scenes

---

## The Solution: Layered Generation with Quality Checkpoints

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STAGE 0: VOICE EXCAVATION                     │
│                     (Multi-Stage with Caching)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0A: SPARK GAP ANALYSIS (Current - Keep)                │   │
│  │ • Detect essay mode vs authentic voice                       │   │
│  │ • Identify emotional register                                │   │
│  │ • Find buried spark moments                                  │   │
│  │ • Generate excavation questions                              │   │
│  │ Cost: ~$0.03 | Cached: Register profiles, question banks     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0B: CORE STORY & CANDIDATE IDENTIFICATION              │   │
│  │ • What is THE story here? (one sentence)                     │   │
│  │ • What makes THIS WRITER a compelling candidate?             │   │
│  │ • What qualities/traits should the essay showcase?           │   │
│  │ • What's the emotional arc? (beginning → end state)          │   │
│  │ Cost: ~$0.02 | Cached: College values context                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0C: SCENE CONSTRUCTION                                 │   │
│  │ • Build 2-3 key scenes/moments                               │   │
│  │ • Each scene centers the WRITER (not others)                 │   │
│  │ • Create natural transitions between scenes                  │   │
│  │ • Ensure narrative momentum                                  │   │
│  │ Cost: ~$0.03 | Cached: Buried spark, interview responses     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0D: VOICE INTEGRATION                                  │   │
│  │ • Layer in 2-4 strategic spark moments                       │   │
│  │ • Apply register-appropriate voice markers                   │   │
│  │ • Balance vocabulary (smart but readable)                    │   │
│  │ • Preserve flow and transitions                              │   │
│  │ Cost: ~$0.03 | Cached: Scene structure from 0C               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0E: QUALITY VERIFICATION (Haiku - Fast & Cheap)        │   │
│  │ • Does it center the writer as a candidate?                  │   │
│  │ • Is there narrative flow?                                   │   │
│  │ • Is vocabulary appropriate (not overwrought)?               │   │
│  │ • Would an AO want to admit this person?                     │   │
│  │ • Flag issues for revision if needed                         │   │
│  │ Cost: ~$0.005 | Haiku model for speed                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STAGE 0F: TARGETED REVISION (If Needed)                      │   │
│  │ • Only runs if 0E flags issues                               │   │
│  │ • Fixes specific problems identified                         │   │
│  │ • Preserves what's working                                   │   │
│  │ Cost: ~$0.02 (only if needed)                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ TOTAL COST: ~$0.11-0.13 (vs ~$0.05 current)                         │
│ QUALITY: Significantly higher with each aspect getting attention     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### What Gets Cached (Session-Level)

1. **Register Profiles** - Static, cache indefinitely
2. **Question Banks** - Static, cache indefinitely
3. **College Values Context** - Per-session, cache for duration
4. **Spark Gap Analysis** - Per-essay, reuse across stages 0B-0E
5. **Core Story Identification** - Per-essay, reuse in 0C-0E
6. **Scene Structure** - Per-essay, reuse in 0D-0E

### Cache Implementation

```typescript
interface Stage0Cache {
  // Static (cache indefinitely)
  registerProfiles: Record<EmotionalRegister, RegisterVoiceProfile>;
  questionBanks: Record<EmotionalRegister, string[]>;

  // Session-level
  collegeContext: {
    collegeId: string;
    values: CollegeCoreValue[];
    promptRubric: CollegeEssayRubric;
    cachedAt: Date;
  };

  // Essay-level (cleared between essays)
  currentEssay: {
    sparkGapAnalysis: SparkGapAnalysis;
    coreStory: CoreStoryIdentification;
    sceneStructure: SceneConstruction;
    voiceIntegratedDraft: string;
  };
}
```

### Token Savings from Caching

| Stage | Without Caching | With Caching | Savings |
|-------|-----------------|--------------|---------|
| 0A | 2,000 tokens | 2,000 tokens | 0% |
| 0B | 1,500 tokens | 800 tokens | 47% |
| 0C | 2,000 tokens | 1,200 tokens | 40% |
| 0D | 2,500 tokens | 1,500 tokens | 40% |
| 0E | 500 tokens | 300 tokens | 40% |
| **Total** | **8,500 tokens** | **5,800 tokens** | **32%** |

---

## Stage-by-Stage Prompts

### Stage 0B: Core Story & Candidate Identification

**Purpose**: Before writing anything, understand WHAT story we're telling and WHY this writer should be admitted.

```
You are identifying the CORE STORY and CANDIDATE APPEAL for a college essay.

ESSAY CONTEXT:
- Original Draft: {draft}
- Buried Spark: {buriedSpark}
- Interview Responses: {interviewResponses}
- Target College: {collegeId}
- Essay Prompt: {prompt}

---

## YOUR TASK

Answer these questions to identify the essay's foundation:

### 1. THE ONE-SENTENCE STORY
What is THE story here? Not a summary, but the emotional core.
- Bad: "I learned about business through various experiences"
- Good: "A middle schooler's obsession with Shark Tank became a real business empire"
- Good: "Learning to exist in the space my grandfather's absence created"

### 2. CANDIDATE APPEAL
What makes THIS WRITER someone an admissions officer would want?
Consider:
- What unique qualities does this person have?
- What would they bring to campus?
- Why would a roommate be glad to live with them?
- What's the "I must have this student" factor?

### 3. QUALITIES TO SHOWCASE
List 3-4 specific traits the essay should demonstrate:
- NOT generic ("hardworking", "passionate", "leader")
- YES specific ("obsessive curiosity that annoys roommates", "ability to find humor in grief", "entrepreneurial energy that can't be contained")

### 4. EMOTIONAL ARC
Where does the reader start, and where do they end?
- Beginning state: What does the reader feel/think at the opening?
- End state: What do they feel/think at the close?
- The arc should change something for the reader

### 5. CENTERING THE WRITER
How do we keep the WRITER as the focus, not:
- The activity/subject matter
- Other people (mentors, family)
- The college
- Abstract lessons

---

## OUTPUT FORMAT

```json
{
  "oneSentenceStory": "<the emotional core in one sentence>",
  "candidateAppeal": {
    "uniqueValue": "<what makes them special>",
    "campusContribution": "<what they'd bring>",
    "mustHaveFactor": "<the 'I want this student' quality>"
  },
  "qualitiesToShowcase": [
    "<specific trait 1>",
    "<specific trait 2>",
    "<specific trait 3>"
  ],
  "emotionalArc": {
    "readerStartsFeeling": "<opening emotional state>",
    "readerEndsFeeling": "<closing emotional state>",
    "whatChanges": "<the transformation>"
  },
  "centeringStrategies": [
    "<how to keep writer as focus>"
  ]
}
```
```

### Stage 0C: Scene Construction

**Purpose**: Build the actual scenes/moments with natural flow BEFORE adding voice.

```
You are constructing the SCENES for a college essay.

FOUNDATION FROM STAGE 0B:
{coreStoryIdentification}

AVAILABLE MATERIAL:
- Buried Spark: {buriedSpark}
- Interview Responses: {interviewResponses}
- Register: {register}

WORD LIMIT: {wordLimit}

---

## YOUR TASK

Build 2-3 KEY SCENES that tell the story identified in Stage 0B.

### SCENE REQUIREMENTS

Each scene must:
1. **CENTER THE WRITER** - The writer is the main character, not a bystander
2. **SHOW, DON'T TELL** - Specific actions, dialogue, sensory details
3. **MOVE THE ARC FORWARD** - Each scene advances the emotional journey
4. **CONNECT NATURALLY** - Transitions feel organic, not forced

### TRANSITION PRINCIPLES

BAD transitions (choppy, no flow):
- "Then came my Economics class in 9th grade where I learned..."
- "My next step started when..."
- "In addition to this experience..."

GOOD transitions (natural momentum):
- Echo a word or idea from the previous scene
- Time jump with a grounding detail
- Contrast that creates meaning
- Question that the next scene answers

### WORD ECONOMY

With {wordLimit} words, you have roughly:
- Opening hook: 30-50 words
- Scene 1: 60-80 words
- Transition: 15-25 words
- Scene 2: 60-80 words
- Transition: 15-25 words
- Scene 3 (if needed): 40-60 words
- Closing: 30-50 words

Every word must earn its place. No filler.

---

## OUTPUT FORMAT

```json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "purpose": "<what this scene accomplishes for the arc>",
      "writerFocus": "<how the writer is centered here>",
      "content": "<the scene content - specific, grounded, showing not telling>",
      "wordCount": <number>
    },
    {
      "sceneNumber": 2,
      "purpose": "<what this scene accomplishes>",
      "transitionFrom1": "<how we move from scene 1 naturally>",
      "writerFocus": "<how the writer is centered>",
      "content": "<the scene content>",
      "wordCount": <number>
    }
  ],
  "openingHook": {
    "content": "<the opening 1-2 sentences>",
    "whyItWorks": "<why this draws the reader in>"
  },
  "closing": {
    "content": "<the closing 1-2 sentences>",
    "arcCompletion": "<how this completes the emotional arc>"
  },
  "flowCheck": {
    "overallNarrative": "<does this read as one cohesive story?>",
    "transitionQuality": "<are transitions natural or forced?>",
    "momentumMaintained": "<does reader want to keep reading?>"
  }
}
```
```

### Stage 0D: Voice Integration

**Purpose**: Layer authentic voice onto the solid scene structure.

```
You are integrating AUTHENTIC VOICE into a structured essay draft.

SCENE STRUCTURE FROM STAGE 0C:
{sceneConstruction}

VOICE CONTEXT:
- Register: {register}
- Buried Spark Phrases: {buriedSpark}
- Interview Voice Samples: {interviewResponses}

---

## YOUR TASK

Take the scene structure and integrate voice WITHOUT breaking flow.

### THE VOICE INTEGRATION PRINCIPLE

Voice is NOT:
- Rewriting the whole essay casually
- Adding filler words
- Making it "conversational"
- Overwhelming vocabulary

Voice IS:
- 2-4 strategic moments of authentic personality
- Natural word choices that fit the writer
- Rhythm that feels like ONE person
- Spark moments that surprise without jarring

### VOCABULARY BALANCE

AVOID overwrought academic language:
- ❌ "institutional knowledge", "computational research environment"
- ❌ "fundamentally shifted my perspective on how businesses drive societal transformation"
- ❌ "sophisticated insights into purchasing psychology and consumer behavior analysis"

USE smart but readable language:
- ✅ Clear, confident sentences
- ✅ Occasional precise word that shows intelligence
- ✅ Vocabulary a smart 17-year-old would actually use
- ✅ Complex ideas expressed simply

### SPARK PLACEMENT

Add spark at these strategic points:
1. **Opening hook** - One unexpected detail or phrasing
2. **A moment of genuine specificity** - Detail so particular it must be real
3. **A flash of personality** - Where the writer's voice briefly shines
4. **Closing** - Something that lingers, not a neat bow

### PRESERVE THE FLOW

As you add voice:
- Keep transitions intact
- Don't interrupt narrative momentum
- Make spark moments feel earned, not forced
- Ensure the essay still reads as one cohesive piece

---

## OUTPUT FORMAT

DRAFT:
<the complete essay with voice integrated - readable, flowing, with strategic spark>

---

ANNOTATIONS:
```json
{
  "sparkMoments": [
    {
      "text": "<the spark phrase>",
      "location": "<where in draft>",
      "type": "<hook|specificity|personality|closing>",
      "source": "<interview|buried_spark|generated>",
      "flowPreserved": "<yes/no - does it fit naturally?>"
    }
  ],
  "vocabularyChoices": [
    {
      "phrase": "<smart but readable choice>",
      "avoided": "<overwrought alternative we didn't use>",
      "why": "<why this works better>"
    }
  ],
  "flowCheck": {
    "transitionsIntact": "<yes/no>",
    "readsAsOneVoice": "<yes/no>",
    "momentumMaintained": "<yes/no>"
  },
  "wordCount": <number>
}
```
```

### Stage 0E: Quality Verification (Haiku - Fast & Cheap)

**Purpose**: Quick check for critical issues before handoff.

```
You are doing a QUICK QUALITY CHECK on a college essay draft.

DRAFT:
{voiceIntegratedDraft}

CORE STORY (what it should accomplish):
{coreStory}

---

## CHECK THESE FIVE THINGS

Rate each 1-5 and note any issues:

### 1. CANDIDATE CENTERING
Is the WRITER clearly the focus and a compelling candidate?
- Do we understand who they are?
- Would an AO want to admit them?
- Is it about THEM, not just their experiences?

### 2. NARRATIVE FLOW
Does the essay flow naturally?
- Smooth transitions between scenes?
- Momentum maintained throughout?
- Reads as one cohesive piece?

### 3. VOCABULARY APPROPRIATENESS
Is the language smart but readable?
- Not overwrought or exhausting?
- Fits a 17-year-old voice?
- Complex ideas expressed clearly?

### 4. SPARK QUALITY
Are the authentic moments effective?
- Feel natural, not forced?
- Enhance rather than disrupt?
- 2-4 moments, not overwhelming?

### 5. OVERALL READABILITY
Would you want to keep reading?
- Engaging opening?
- Satisfying (not clichéd) close?
- Enjoyable to read?

---

## OUTPUT FORMAT

```json
{
  "scores": {
    "candidateCentering": <1-5>,
    "narrativeFlow": <1-5>,
    "vocabularyAppropriateness": <1-5>,
    "sparkQuality": <1-5>,
    "overallReadability": <1-5>
  },
  "overallScore": <average>,
  "passesQuality": <true if all scores >= 4>,
  "issues": [
    {
      "category": "<which of the 5>",
      "problem": "<specific issue>",
      "location": "<where in draft>",
      "suggestedFix": "<how to address>"
    }
  ],
  "revision needed": <true/false>
}
```
```

---

## When to Skip Stages

### Fast Path (Already Has Spark)

If Stage 0A detects:
- Spark Score > 60
- Register Fit > 7
- Strong buried spark

Then skip directly to:
- Stage 0E (Quality Verification)
- Stage 0F if needed (Light Polish)

### Minimal Intervention Path

If original essay has:
- Good structure and flow
- Some authentic moments
- Just needs enhancement

Then:
- Stage 0A: Analysis
- Stage 0D: Voice Integration only (preserve existing structure)
- Stage 0E: Verification

---

## Success Metrics

### Quality Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Candidate Centering | 5/5 | 4/5 |
| Narrative Flow | 5/5 | 4/5 |
| Vocabulary | 5/5 | 4/5 |
| Spark Quality | 5/5 | 4/5 |
| Readability | 5/5 | 4/5 |

### Cost Targets

| Path | Target Cost |
|------|-------------|
| Full Multi-Stage | $0.11-0.13 |
| Fast Path | $0.04-0.06 |
| Minimal Intervention | $0.06-0.08 |

### Comparison: Before vs After

| Metric | One-Shot (Current) | Multi-Stage (New) |
|--------|-------------------|-------------------|
| Cost | $0.05 | $0.11 |
| Candidate Focus | Variable | Consistent |
| Flow Quality | Poor | Strong |
| Vocabulary Control | Poor | Good |
| Spark Integration | Forced | Natural |
| Overall Quality | Inconsistent | Reliable |

---

## Implementation Priority

1. **Stage 0B** (Core Story) - Critical for candidate focus
2. **Stage 0C** (Scenes) - Critical for flow
3. **Stage 0E** (Verification) - Catches issues before handoff
4. **Stage 0D** (Voice) - Refinement of existing work
5. **Stage 0F** (Revision) - Only if needed
