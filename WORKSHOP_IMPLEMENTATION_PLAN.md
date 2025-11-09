# Extracurricular Narrative Workshop — Strategic Implementation Plan
**Version:** 1.0
**Date:** 2025-11-09
**Status:** Phase 0 — Gap Analysis & Build Strategy

---

## Executive Summary

This document provides a **detailed gap analysis** of the current workshop foundation and a **strategic implementation roadmap** to build a world-class pedagogical experience. The plan leverages your **19-iteration narrative generator's proven patterns** while filling critical missing pieces with depth and rigor.

**Current State:**
- ✅ Strong foundation: TeachingIssueCard, ReflectionPanel, Score displays
- ✅ Sophisticated backend: 19-iteration generator, 11-dimension grader, elite pattern detection
- ⚠️ **Major gaps**: Teaching content, micro-prompts, delta visualization, adaptive questions, generator UI integration

**Goal State:**
- 🎯 Complete teaching library (50+ example pairs based on generator's 6 archetypes)
- 🎯 Micro-prompt system with instant feedback
- 🎯 Delta visualization showing before/after improvements
- 🎯 Generator UI integration (angle selection → draft generation → refinement)
- 🎯 Adaptive reflection questions that feed the generator
- 🎯 Progress tracking across all rubric dimensions

---

## Part 1: Comprehensive Gap Analysis

### 1.1 What EXISTS (Partial/Incomplete)

**✅ Components Built (but need enhancement):**

```typescript
// EXISTING BUT INCOMPLETE
ExtracurricularWorkshopUnified.tsx
├── TeachingIssueCard.tsx ⚠️ Learn tab exists, Practice tab stub
├── ReflectionPromptsPanel.tsx ⚠️ Basic validation only, no semantic analysis
├── OverallScoreCard.tsx ✅ Works well, shows NQI
├── DraftEditor.tsx ⚠️ Basic editor, missing inline hints
├── VersionHistory.tsx ⚠️ Exists but minimal UI
└── RightSidePersonalizationChat.tsx ❌ Complete stub - needs full build

// BACKEND SERVICES
✅ essayGenerator.ts - FULLY FUNCTIONAL (19 iterations, proven)
✅ narrativeAngleGenerator.ts - 6 archetypes, quality validation
✅ angleQualityValidator.ts - Grounding/bridge/auth scoring
✅ rubricScorer.ts - 12-dimension scoring
✅ authenticityDetector.ts - Voice analysis
✅ elitePatternDetector.ts - 7 pattern detection
✅ literarySophisticationDetector.ts - Literary analysis
```

**❌ What's MISSING (Critical Gaps):**

1. **Teaching Content Library** (0% complete)
   - No human-written weak→strong example pairs
   - No teaching unit content mapping to issue types
   - No integration with generator's 6 archetypes
   - No literary technique examples

2. **Micro-Prompt System** (0% built)
   - No micro-prompt UI component
   - No fragment-level grading
   - No instant feedback loop
   - No "Apply to full draft" functionality

3. **Delta Visualization** (0% built)
   - No before/after comparison view
   - No score delta graphics
   - No improvement commentary
   - No diff highlighting

4. **Generator UI Integration** (10% built - only backend exists)
   - No narrative angle selection UI
   - No draft generation flow in workshop
   - No multi-candidate comparison
   - No provenance display (what reflection drove this?)

5. **Adaptive Question Engine** (20% built - static questions exist)
   - Questions not adaptive to detected issues
   - No semantic validation of answers
   - No feedback loop to generator constraints
   - No "shallow answer" detection

6. **Progress Tracking Enhancements** (30% built)
   - Basic score display exists
   - Missing dimension-level delta tracking
   - Missing visual progress bars
   - Missing iteration count display

---

## Part 2: Strategic Teaching Content Framework

### 2.1 Leveraging the 19-Iteration Generator's DNA

Your generator has **6 proven success archetypes** from Harvard/Stanford/MIT admits. We'll build teaching units around these:

#### **Archetype 1: The Awakening (7/10 originality)**
**Pattern:** External catalyst → Personal realization → Trajectory change

**Teaching Unit Design:**
```typescript
{
  issueType: "generic_language",
  archetype: "awakening",

  explanation: "Admissions readers want to see what SPARKED your involvement, not just duties. Show the specific moment or person that ignited your interest.",

  whyItMatters: "Generic phrases like 'I've always been interested' miss the most compelling part: the awakening moment. Readers remember stories about transformation.",

  generatorTechnique: "Uses 'external catalyst' requirement from generator",

  examplePairs: [
    {
      weak: "Volunteered at hospital and learned about healthcare",
      weakScore: { specificity: 3, impact: 2, reflection: 2 },

      strong: "Watching Dr. Chen explain a gangrene surgery to a terrified patient—her calm precision, the way she turned medical jargon into reassurance—sparked my realization: medicine isn't just science, it's translation of fear into hope.",
      strongScore: { specificity: 8, impact: 7, reflection: 8 },

      techniqueUsed: "In Medias Res opening + Vulnerability + External catalyst (Dr. Chen)",
      deltaExplanation: "+5 specificity (named person, specific surgery), +5 impact (emotional transformation visible), +6 reflection (insight about medicine)"
    },
    {
      weak: "Joined robotics team and discovered passion for engineering",
      weakScore: { specificity: 2, impact: 1, reflection: 2 },

      strong: "I didn't care about robotics until I saw Maya, our captain, debug a vision system at 2 AM, muttering 'The machine sees what we miss.' That phrase—the idea that code could reveal my own blindness—hooked me.",
      strongScore: { specificity: 7, impact: 6, reflection: 9 },

      techniqueUsed: "Dialogue + Specific time/person + Philosophical bridge (technical → human)",
      deltaExplanation: "+5 specificity (Maya, 2 AM, vision system), +5 impact (specific moment), +7 reflection (philosophical insight)"
    }
  ],

  fixStrategies: [
    {
      name: "Add External Catalyst",
      description: "Who or what specific moment sparked your involvement? Name the person, describe the scene.",
      microPrompt: "Complete this: 'I didn't care about [activity] until I saw/heard [specific person/moment]...'",
      generatorConnection: "Maps to generator's 'EXTERNAL catalyst' requirement"
    },
    {
      name: "Show Before → After States",
      description: "Contrast your thinking/feeling BEFORE the catalyst vs. AFTER",
      microPrompt: "What did you believe before this moment? What changed after?",
      generatorConnection: "Maps to generator's 'Vulnerability: Show BEFORE state (fear/doubt) → AFTER state'"
    },
    {
      name: "Quote the Moment",
      description: "What specific words did someone say that stuck with you?",
      microPrompt: "Write one sentence of dialogue from that pivotal moment",
      generatorConnection: "Maps to generator's 'DIALOGUE: Include 1-2 quoted conversations'"
    }
  ],

  adaptiveQuestions: [
    "Who specifically was doing something that made you think 'I want to learn that'? Describe the moment in 2-3 sentences.",
    "What were you doing or thinking RIGHT before this awakening moment? (The contrast matters)",
    "If you could point to one sentence someone said or one action you witnessed, what was it?"
  ]
}
```

#### **Archetype 2: Technical → Human Bridge (7/10 originality, BEST FOR STEM)**
**Pattern:** Technical work reveals human insight

**Teaching Unit Design:**
```typescript
{
  issueType: "missing_reflection",
  archetype: "technical_human_bridge",

  explanation: "Strong STEM essays don't just showcase technical skills—they reveal how technical thinking shaped your understanding of people, communication, or yourself.",

  whyItMatters: "Your generator's Session 18 research found this pattern scores highest for authenticity AND originality. It's the sweet spot.",

  generatorTechnique: "Uses 'Bridge TECHNICAL + HUMAN domains' pattern with grounded verbs",

  examplePairs: [
    {
      weak: "Through robotics, I learned teamwork and communication skills",
      weakScore: { specificity: 2, impact: 1, reflection: 3 },

      strong: "Debugging our robot's vision system taught me I'd been debugging humans wrong. When code fails, I trace back to root cause. When teammates clash, I started asking: what's the underlying conflict, not just the surface argument?",
      strongScore: { specificity: 7, impact: 7, reflection: 9 },

      techniqueUsed: "Technical-human bridge + Concrete technical term (vision system, root cause) + Universal insight",
      deltaExplanation: "+5 specificity (specific system, specific method), +6 impact (changed behavior), +6 reflection (applied learning beyond activity)"
    },
    {
      weak: "Lab research taught me patience and attention to detail",
      weakScore: { specificity: 2, impact: 2, reflection: 4 },

      strong: "Flow cytometry taught me that precision and patience aren't virtues—they're survival. One miscalibrated laser, one rushed pipette, and three months of stem cell data evaporates. That standard now governs how I approach friendships: small calibrations, consistent presence.",
      strongScore: { specificity: 8, impact: 6, reflection: 9 },

      techniqueUsed: "Concrete technical process + Vulnerability (fear of failure) + Universal application to relationships",
      deltaExplanation: "+6 specificity (flow cytometry, laser, pipette), +4 impact (stakes clear), +5 reflection (explicit bridge to life outside lab)"
    }
  ],

  fixStrategies: [
    {
      name: "Name the Technical Process",
      description: "Use specific technical vocabulary: debug, calibrate, compile, refactor, measure. NOT vague terms like 'work on' or 'help with'",
      microPrompt: "What's the most specific technical verb or process you used? (e.g., 'debugging vision algorithms', 'pipetting stem cells')",
      generatorConnection: "Maps to generator's GROUNDED_KEYWORDS: actions (build, debug, code, create, fix, design)"
    },
    {
      name: "Bridge to Human Domain",
      description: "Complete this pattern: '[Technical process] taught me [human insight]'",
      microPrompt: "How did this technical skill change how you think about people, relationships, or yourself?",
      generatorConnection: "Maps to generator's EFFECTIVE_BRIDGES patterns (debug→social, system→people, build→relationship)"
    },
    {
      name: "Show Stakes",
      description: "What happens if the technical work fails? Then connect that fear to a broader insight.",
      microPrompt: "Complete: 'One mistake (describe it) and [consequence]. That fear now governs how I...'",
      generatorConnection: "Maps to generator's 'Vulnerability: Physical markers + admits limits'"
    }
  ],

  adaptiveQuestions: [
    "What's the most specific technical thing you did? Use the precise vocabulary (don't dumb it down).",
    "When did this technical work FAIL or almost fail? What did that failure teach you?",
    "How has this technical thinking changed how you act outside this activity? Give one concrete example."
  ]
}
```

#### **Archetype 3: Failure → Growth (7/10 originality, SAFEST)**
**Pattern:** Dramatic failure → External support → Overcoming deeper fear

**Teaching Unit Design:**
```typescript
{
  issueType: "missing_vulnerability",
  archetype: "failure_growth",

  explanation: "The generator's research shows failure narratives work ONLY when you show the emotional stakes and external support. It's not about conquering the task—it's about conquering self-doubt.",

  whyItMatters: "This is the SAFEST archetype (most accessible to students) while still hitting 7/10 originality. Perfect for risk-averse profiles.",

  generatorTechnique: "Uses 'Vulnerability' + 'Human Element' + 'Community Transformation' requirements",

  examplePairs: [
    {
      weak: "After failing the regional competition, our team worked harder and succeeded",
      weakScore: { specificity: 3, impact: 2, reflection: 2 },

      strong: "Three days before regionals, our robot missed every target. 'We're going to fail,' Sarah whispered. I didn't sleep that night—not debugging code, but battling the voice saying I wasn't good enough. Our mentor, Ms. Lee, found me at 6 AM. 'You think failure is missing targets? Failure is not asking for help.' She taught us root cause analysis, but more: she taught me self-doubt has a root cause too.",
      strongScore: { specificity: 9, impact: 8, reflection: 9 },

      techniqueUsed: "In Medias Res + Dialogue + Named emotions + External support (Ms. Lee) + Universal insight",
      deltaExplanation: "+6 specificity (three days, Sarah, Ms. Lee, 6 AM), +6 impact (emotional arc clear), +7 reflection (from task to self-doubt)"
    }
  ],

  fixStrategies: [
    {
      name: "Name the Emotion",
      description: "Use SPECIFIC emotion words: terrified, dumbstruck, out of place, ashamed. NOT 'nervous' or 'worried'.",
      microPrompt: "What EXACT emotion did you feel when things failed? Pick the most precise word.",
      generatorConnection: "Maps to generator's 'Named emotions: afraid, terrified, dumbstruck, out of place, no clue'"
    },
    {
      name: "Add External Support",
      description: "Who helped you? Quote what they said. Show how they reframed the failure.",
      microPrompt: "Who said something that shifted your perspective? What exactly did they say?",
      generatorConnection: "Maps to generator's 'External catalyst' requirement"
    },
    {
      name: "Reframe from Task to Self",
      description: "The real obstacle wasn't the task—it was your fear of inadequacy, perfectionism, etc.",
      microPrompt: "Complete: 'I thought the problem was [task], but really it was [fear about yourself]'",
      generatorConnection: "Maps to generator's 'Universal Insight: Connect specific to universal'"
    }
  ],

  adaptiveQuestions: [
    "Describe the moment you realized it was failing. What physical sensation did you have? (hands shaking, stomach dropping, etc.)",
    "Who helped you see the failure differently? Quote one thing they said.",
    "What deeper fear about yourself did this failure expose? (not 'I failed at X' but 'I feared I was...')"
  ]
}
```

### 2.2 Complete Teaching Content Library Structure

**50 Human-Written Example Pairs** organized by:

1. **Issue Type** (8 types × 6 examples each = 48, +2 extras)
   - generic_language (8 examples)
   - missing_quantification (6 examples)
   - weak_verbs (6 examples)
   - passive_voice (6 examples)
   - missing_reflection (8 examples)
   - list_structure (6 examples)
   - cliches (6 examples)
   - telling_not_showing (6 examples)

2. **Archetype Coverage** (Each example tagged with archetype)
   - Awakening: 10 examples
   - Technical-Human Bridge: 12 examples (STEM-heavy)
   - Failure→Growth: 10 examples
   - Visceral Truth: 6 examples
   - Systems Thinker: 6 examples
   - Vulnerability as Strength: 6 examples

3. **Activity Diversity**
   - STEM/Research: 15 examples
   - Community Service: 12 examples
   - Arts/Creative: 8 examples
   - Athletics: 5 examples
   - Work/Leadership: 6 examples
   - Advocacy: 4 examples

4. **Cultural Diversity**
   - International contexts: 8 examples
   - Low-resource settings: 6 examples
   - Urban/Rural mix: balanced
   - First-gen college: 4 examples

**Each Example Includes:**
```typescript
interface TeachingExample {
  // Content
  weak: string;
  strong: string;

  // Scores
  weakScores: RubricScores;    // Before scores
  strongScores: RubricScores;  // After scores
  deltaScores: RubricScores;   // Calculated delta

  // Teaching metadata
  issueType: IssueType;
  archetype: Archetype;
  activityType: string;
  techniqueUsed: string[];     // Which generator techniques
  deltaExplanation: string;    // Why the scores improved

  // Generator integration
  generatorRequirements: string[];  // Which requirements from buildGenerationPrompt
  literaryTechniques: string[];     // Which LITERARY_TECHNIQUES used
  elitePatterns: string[];          // Which elite patterns present

  // Cultural context
  culturalContext?: string;
  resourceLevel?: 'high' | 'medium' | 'low';

  // Quality validation
  provenance: 'human_reviewed' | 'synthetic_pending';
  reviewedBy?: string[];
  approvalDate?: Date;
}
```

---

## Part 3: Missing Component Designs (With Depth)

### 3.1 Micro-Prompt System (CRITICAL GAP)

**What It Is:**
A focused writing task tied to ONE specific issue, with instant fragment-level feedback.

**Why It Matters:**
The generator's 19 iterations show incremental improvement works. Micro-prompts let students practice ONE skill at a time before applying to full draft.

**Component Architecture:**
```typescript
// NEW COMPONENT: MicroPromptCard.tsx
interface MicroPromptCardProps {
  issueType: IssueType;
  flaggedSpan: EvidenceSpan;      // The original problematic text
  promptText: string;              // The micro-prompt question
  fixStrategy: FixStrategy;        // Which strategy this supports
  onSubmit: (rewrite: string) => void;
}

// UI Structure
<MicroPromptCard>
  <FlaggedTextDisplay>
    Original: "<span class='flagged'>{flaggedSpan.text}</span>"
    Reason: {flaggedSpan.reason}
  </FlaggedTextDisplay>

  <PromptText>
    {promptText}
    Example: {fixStrategy.example}
  </PromptText>

  <RewriteInput
    placeholder="Rewrite this phrase here..."
    onBlur={validateRewrite}
  />

  <SubmitButton onClick={handleSubmit}>
    Regrade & Get Feedback
  </SubmitButton>

  {feedback && (
    <FeedbackPanel>
      <ScoreDelta delta={feedback.delta} />
      <Commentary text={feedback.commentary} />
      {feedback.improved && (
        <ApplyButton onClick={applyToFullDraft}>
          Apply to Full Draft
        </ApplyButton>
      )}
    </FeedbackPanel>
  )}
</MicroPromptCard>
```

**Backend Logic:**
```typescript
// NEW SERVICE: microPromptService.ts
async function evaluateMicroPrompt(
  original: string,
  rewrite: string,
  context: string  // 50 chars before/after for context
): Promise<MicroPromptFeedback> {
  // 1. Extract context window
  const contextBefore = context.substring(0, 50);
  const contextAfter = context.substring(context.length - 50);

  // 2. Evaluate original fragment in context
  const originalEval = await evaluateEntry({
    entryText: contextBefore + original + contextAfter
  });

  // 3. Evaluate rewritten fragment in context
  const rewriteEval = await evaluateEntry({
    entryText: contextBefore + rewrite + contextAfter
  });

  // 4. Calculate dimension-level deltas
  const dimensionDeltas = {
    specificity: rewriteEval.dimensionScores.specificity - originalEval.dimensionScores.specificity,
    impact: rewriteEval.dimensionScores.impact - originalEval.dimensionScores.impact,
    reflection: rewriteEval.dimensionScores.reflection - originalEval.dimensionScores.reflection,
    authenticity: rewriteEval.dimensionScores.authenticity - originalEval.dimensionScores.authenticity
  };

  // 5. Generate tailored commentary
  const commentary = generateMicroFeedback(dimensionDeltas, rewrite);

  return {
    improved: rewriteEval.nqi > originalEval.nqi,
    delta: rewriteEval.nqi - originalEval.nqi,
    dimensionDeltas,
    commentary,
    suggestedRevision: dimensionDeltas.specificity < 0 ? suggestImprovement(rewrite) : undefined
  };
}

function generateMicroFeedback(deltas: DimensionDeltas, rewrite: string): string {
  if (deltas.specificity >= 2) {
    return `Great! Adding specific details boosted your specificity by +${deltas.specificity}. ${
      deltas.reflection < 1 ? "Now try connecting this detail to a deeper insight." : ""
    }`;
  }

  if (deltas.specificity < 0) {
    return `This version is actually vaguer. Try adding: a number, a person's name, or a specific time/place.`;
  }

  if (deltas.specificity === 0 || deltas.specificity === 1) {
    return `Slight improvement (+${deltas.specificity}). To boost further, add ONE more concrete detail.`;
  }

  // ... more conditional feedback
}
```

**User Flow:**
1. User clicks on Issue Card → Teaching Unit expands
2. Teaching Unit shows Micro-Prompt section
3. User sees flagged span: "helped at shelter" highlighted
4. Micro-prompt asks: "Rewrite 'helped' to show ONE specific action you took"
5. User types: "coordinated weekend meal drives for 40+ families"
6. Clicks "Regrade"
7. System shows: "+4 specificity! You added concrete numbers and action. Now try: What challenge did you face during these drives?"
8. User clicks "Apply to Full Draft" → Replaces original span
9. Issue Card updates (may disappear if resolved)

---

### 3.2 Delta Visualization Component (CRITICAL GAP)

**What It Is:**
Side-by-side before/after comparison with visual diff and score tracking.

**Why It Matters:**
Students need to SEE what changed and WHY their score improved. The generator's iteration logic proves this—showing delta motivates continued improvement.

**Component Architecture:**
```typescript
// NEW COMPONENT: DeltaVisualization.tsx
interface DeltaVisualizationProps {
  previousVersion: DraftVersion;
  currentVersion: DraftVersion;
  regradeResult: RegradeResult;
}

// UI Structure
<DeltaVisualization>
  <Header>
    <NQIComparison>
      <PreviousScore>{previousVersion.nqi}</PreviousScore>
      <Arrow>→</Arrow>
      <CurrentScore className={delta > 0 ? 'improved' : 'regressed'}>
        {currentVersion.nqi}
      </CurrentScore>
      <DeltaBadge delta={delta}>
        {delta > 0 ? '+' : ''}{delta}
      </DeltaBadge>
    </NQIComparison>
  </Header>

  <SideBySideEditor>
    <Column>
      <Label>Previous Version</Label>
      <DiffView text={previousVersion.text} mode="deleted" />
      <OldScores scores={previousVersion.scores} />
    </Column>

    <Column>
      <Label>Current Version</Label>
      <DiffView text={currentVersion.text} mode="added" />
      <NewScores scores={currentVersion.scores} deltas={dimensionDeltas} />
    </Column>
  </SideBySideEditor>

  <DimensionDeltaChart>
    {Object.entries(dimensionDeltas).map(([dim, delta]) => (
      <DimensionBar
        key={dim}
        dimension={dim}
        previousScore={previousVersion.scores[dim]}
        currentScore={currentVersion.scores[dim]}
        delta={delta}
      />
    ))}
  </DimensionDeltaChart>

  <CommentarySection>
    <Improvements>
      <Title>✓ What Improved</Title>
      <ul>
        {regradeResult.improvements.map(imp => (
          <li>
            <strong>{imp.dimension}:</strong> {imp.explanation}
            <Quote>{imp.evidenceQuote}</Quote>
          </li>
        ))}
      </ul>
    </Improvements>

    <StillNeeds>
      <Title>⚠ Still Needs Work</Title>
      <ul>
        {regradeResult.stillNeedsWork.map(issue => (
          <li>
            <strong>{issue.type}:</strong> {issue.suggestion}
            <ActionButton onClick={() => showTeachingUnit(issue.type)}>
              Learn How to Fix
            </ActionButton>
          </li>
        ))}
      </ul>
    </StillNeeds>
  </CommentarySection>

  <ActionButtons>
    <Button variant="primary" onClick={acceptVersion}>
      Accept This Version
    </Button>
    <Button variant="secondary" onClick={continueEditing}>
      Keep Editing
    </Button>
    <Button variant="ghost" onClick={revertToPrevious}>
      Revert to Previous
    </Button>
  </ActionButtons>
</DeltaVisualization>
```

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NQI: 58 → 72 (+14) ✓                                                       │
├──────────────────────────────────┬──────────────────────────────────────────┤
│ PREVIOUS VERSION                 │ CURRENT VERSION                          │
│                                  │                                          │
│ Volunteered at local shelter     │ Coordinated 12 weekend meal drives       │
│ helping with various tasks       │ serving 400+ families; built inventory   │
│                                  │ system cutting waste 30%                 │
│                                  │                                          │
│ Specificity:     4/10            │ Specificity:     7/10 (+3) ✓             │
│ Impact:          3/10            │ Impact:          7/10 (+4) ✓             │
│ Reflection:      2/10            │ Reflection:      5/10 (+3) ⚠             │
└──────────────────────────────────┴──────────────────────────────────────────┘

Dimension Changes:
Specificity  [████░░░░░░] 4 → [███████░░░] 7  (+3)
Impact       [███░░░░░░░] 3 → [███████░░░] 7  (+4)
Reflection   [██░░░░░░░░] 2 → [█████░░░░░] 5  (+3)
Authenticity [█████░░░░░] 5 → [██████░░░░] 6  (+1)

✓ What Improved:
• Specificity: Added concrete metrics (12 drives, 400+ families, 30% waste reduction)
  Quote: "Coordinated 12 weekend meal drives serving 400+ families"
• Impact: Clear community benefit with measurable outcomes
  Quote: "cutting waste 30%"

⚠ Still Needs Work:
• Missing Reflection: Show how this experience shaped your thinking or values
  Suggestion: Add 1 sentence connecting this work to a broader insight
  [Learn How to Fix]

[Accept This Version]  [Keep Editing]  [Revert to Previous]
```

---

### 3.3 Generator UI Integration (CRITICAL GAP)

**What's Missing:**
The powerful 19-iteration generator exists as backend-only. Students can't:
- See narrative angle options
- Generate multiple draft candidates
- Compare generator outputs
- Understand which reflection drove which generation

**Component Architecture:**

```typescript
// NEW COMPONENT: GeneratorWorkflow.tsx
interface GeneratorWorkflowProps {
  session: WorkshopSession;
  onDraftGenerated: (draft: GeneratedCandidate) => void;
}

// Step 1: Angle Selection UI
<AngleSelectionModal>
  <Header>
    Choose Your Narrative Angle
    <Subtitle>
      These angles were generated based on your reflection answers.
      Pick the one that feels most authentic to you.
    </Subtitle>
  </Header>

  <AngleGrid>
    {angles.map(angle => (
      <AngleCard
        key={angle.title}
        angle={angle}
        validation={validationScores[angle.title]}
      >
        <AngleTitle>{angle.title}</AngleTitle>
        <OriginScale>
          Originality: [████████░░] {angle.originality}/10
          Risk: {angle.riskLevel}
        </OriginScale>

        <Hook>{angle.hook}</Hook>
        <Throughline>{angle.throughline}</Throughline>

        <QualityScores>
          Grounding: {validation.groundingScore}/100
          Authenticity: {validation.authenticityPotential}/100
          {validation.recommendation === 'excellent' && <Badge>✨ Highly Recommended</Badge>}
          {validation.recommendation === 'avoid' && <Badge variant="warning">⚠️ Risky</Badge>}
        </QualityScores>

        {validation.warnings.length > 0 && (
          <Warnings>
            {validation.warnings.map(w => <li>{w}</li>)}
          </Warnings>
        )}

        <SelectButton onClick={() => selectAngle(angle)}>
          Use This Angle
        </SelectButton>
      </AngleCard>
    ))}
  </AngleGrid>
</AngleSelectionModal>

// Step 2: Draft Generation Progress
<GenerationProgress>
  <ProgressSteps>
    <Step status="complete">✓ Reflection Answers Collected</Step>
    <Step status="complete">✓ Narrative Angle Selected</Step>
    <Step status="inProgress">⏳ Generating Drafts...</Step>
    <Step status="pending">Review & Select</Step>
  </ProgressSteps>

  <StatusMessage>
    Generating 3 draft candidates using the "{selectedAngle.title}" angle...
    This may take 30-45 seconds.
  </StatusMessage>

  <ProgressBar animated value={generationProgress} />
</GenerationProgress>

// Step 3: Multi-Candidate Comparison
<DraftCandidatesView>
  <Header>
    Review Generated Drafts
    <Subtitle>
      Each draft uses your reflection answers. Pick one to start from,
      or continue writing manually.
    </Subtitle>
  </Header>

  <CandidateGrid>
    {candidates.map((candidate, idx) => (
      <CandidateCard key={idx}>
        <CardHeader>
          <Label>Draft {idx + 1}</Label>
          <PredictedScore>
            Predicted NQI: {candidate.predictedNQI}/100
          </PredictedScore>
        </CardHeader>

        <DraftText>{candidate.text}</DraftText>

        <Strengths>
          <Title>Key Strengths:</Title>
          <ul>
            {candidate.keyStrengths.map(s => <li>{s}</li>)}
          </ul>
        </Strengths>

        <Provenance>
          <Icon>🔗</Icon>
          Based on your answer about: "{candidate.provenance}"
        </Provenance>

        {candidate.flagForHumanReview && (
          <Warning>
            ⚠️ This draft may include details not in your original entry.
            Review carefully before using.
          </Warning>
        )}

        <TechniqueUsed>
          Literary Technique: {candidate.techniqueUsed}
        </TechniqueUsed>

        <Actions>
          <Button onClick={() => selectDraft(candidate)}>
            Use This Draft
          </Button>
          <Button variant="ghost" onClick={() => previewDraft(candidate)}>
            Preview Full Analysis
          </Button>
        </Actions>
      </CandidateCard>
    ))}
  </CandidateGrid>

  <Footer>
    <Button variant="secondary" onClick={generateMore}>
      Generate More Options
    </Button>
    <Button variant="ghost" onClick={skipGenerator}>
      Skip - I'll Write Manually
    </Button>
  </Footer>
</DraftCandidatesView>
```

**Integration with Teaching Flow:**

```typescript
// Enhanced Workshop Orchestrator
async function runGeneratorWorkflow(session: WorkshopSession) {
  // 1. Ensure reflection completed
  if (session.reflectionAnswers.size < 3) {
    return { error: 'Please complete reflection questions first' };
  }

  // 2. Build GenerationProfile from session
  const profile = buildProfileFromSession(session);

  // 3. Generate narrative angles (10 options)
  const angles = await generateNarrativeAngles({
    profile,
    numAngles: 10,
    prioritize: 'originality'
  });

  // 4. Validate all angles
  const validated = validateAndRankAngles(angles, profile);

  // 5. Filter to top 5 "excellent" or "good" angles
  const topAngles = validated
    .filter(v => v.recommendation === 'excellent' || v.recommendation === 'good')
    .slice(0, 5);

  // 6. Show AngleSelectionModal to user
  const selectedAngle = await promptUserToSelectAngle(topAngles);

  // 7. Generate 3 draft candidates with selected angle
  profile.narrativeAngle = selectedAngle;

  const candidates = await Promise.all([
    generateEssay({ ...profile, literaryTechniques: ['inMediasRes', 'dualScene'] }),
    generateEssay({ ...profile, literaryTechniques: ['extendedMetaphor', 'dialogue'] }),
    generateEssay({ ...profile, literaryTechniques: ['perspectiveShift'] })
  ]);

  // 8. Show DraftCandidatesView to user
  return { candidates, selectedAngle };
}
```

---

### 3.4 Adaptive Question Engine (MAJOR ENHANCEMENT)

**Current State:** Static questions in ReflectionPromptsPanel
**Goal State:** Dynamic questions that adapt to detected issues and validate semantic depth

**Enhancement Design:**

```typescript
// ENHANCED SERVICE: adaptiveQuestionEngine.ts
interface AdaptiveQuestionEngine {
  selectQuestions(
    issues: Issue[],
    currentDraft: string,
    previousAnswers: Map<string, string>
  ): Question[];

  validateAnswer(
    question: Question,
    answer: string
  ): AnswerValidation;

  generateFollowUp(
    question: Question,
    shallowAnswer: string
  ): FollowUpPrompt;
}

// Question selection logic
function selectAdaptiveQuestions(
  issues: Issue[],
  currentDraft: string,
  previousAnswers: Map<string, string>
): Question[] {
  const questions: Question[] = [];

  // Map each issue type to best questions
  const issueQuestionMap: Record<IssueType, QuestionTemplate[]> = {
    generic_language: [
      {
        id: 'specific_action',
        text: "What is ONE specific action you took that someone else in your role might NOT have done?",
        validationCriteria: {
          minLength: 50,
          requiresVerb: true,
          requiresSpecificDetail: true  // Name, number, or time
        },
        archetypeAlignment: ['awakening', 'technical_human_bridge']
      },
      {
        id: 'visualizable_detail',
        text: "If you had to describe this work to someone who's never heard of your organization, what concrete details would help them visualize it?",
        validationCriteria: {
          minLength: 60,
          requiresSensoryDetail: true
        }
      }
    ],

    missing_reflection: [
      {
        id: 'thinking_change',
        text: "How did this experience change the way you think or behave today? Give one concrete example.",
        validationCriteria: {
          minLength: 70,
          requiresBeforeAfter: true,
          requiresConcreteExample: true
        },
        archetypeAlignment: ['failure_growth', 'awakening']
      },
      {
        id: 'universal_insight',
        text: "What did this teach you about people, communication, or systems in general (not just this activity)?",
        validationCriteria: {
          minLength: 50,
          requiresAbstraction: true,
          avoidsCliche: true  // Flag "learned teamwork", "importance of leadership"
        },
        archetypeAlignment: ['systems_thinker', 'technical_human_bridge']
      }
    ],

    missing_quantification: [
      {
        id: 'concrete_outcome',
        text: "What tangible outcome (numbers, schedule, product, event) can you point to that shows change?",
        validationCriteria: {
          minLength: 40,
          requiresNumber: true,
          requiresNoun: true  // Must name a thing that was created/changed
        }
      }
    ],

    missing_vulnerability: [
      {
        id: 'hardest_moment',
        text: "What was the hardest part of this work, and what did you do when your first approach failed?",
        validationCriteria: {
          minLength: 60,
          requiresEmotion: true,
          requiresAdaptation: true
        },
        archetypeAlignment: ['failure_growth', 'visceral_truth']
      }
    ]

    // ... more mappings
  };

  // Select top 3 questions based on issues
  for (const issue of issues.slice(0, 3)) {
    const templates = issueQuestionMap[issue.type] || [];

    // Filter out questions already answered
    const unanswered = templates.filter(t => !previousAnswers.has(t.id));

    if (unanswered.length > 0) {
      // Pick best question for this issue
      const question = unanswered[0];
      questions.push(question);
    }
  }

  return questions.slice(0, 3);
}

// Semantic answer validation
function validateAnswer(question: Question, answer: string): AnswerValidation {
  const validation: AnswerValidation = {
    isValid: true,
    feedback: [],
    depth: 'sufficient',
    followUpNeeded: false
  };

  // Length check
  if (answer.length < question.validationCriteria.minLength) {
    validation.isValid = false;
    validation.feedback.push(`Please provide more detail (at least ${question.validationCriteria.minLength} characters)`);
    validation.depth = 'shallow';
  }

  // Specific detail check
  if (question.validationCriteria.requiresSpecificDetail) {
    const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(answer);  // Name pattern
    const hasNumber = /\d+/.test(answer);
    const hasTime = /\b(monday|tuesday|AM|PM|january|summer|week|month)\b/i.test(answer);

    if (!hasName && !hasNumber && !hasTime) {
      validation.isValid = false;
      validation.feedback.push('Add a specific detail: a name, number, or time/date');
      validation.depth = 'shallow';
    }
  }

  // Emotion check
  if (question.validationCriteria.requiresEmotion) {
    const emotionWords = ['afraid', 'terrified', 'excited', 'ashamed', 'dumbstruck', 'confused', 'frustrated'];
    const hasEmotion = emotionWords.some(ew => answer.toLowerCase().includes(ew));

    if (!hasEmotion) {
      validation.followUpNeeded = true;
      validation.feedback.push('Consider adding how you FELT in that moment (afraid, excited, confused, etc.)');
    }
  }

  // Cliché detection
  if (question.validationCriteria.avoidsCliche) {
    const cliches = [
      'learned teamwork', 'importance of leadership', 'passion for',
      'made me realize', 'opened my eyes', 'life-changing'
    ];

    const hasCliche = cliches.some(c => answer.toLowerCase().includes(c));
    if (hasCliche) {
      validation.followUpNeeded = true;
      validation.feedback.push('Try to be more specific than "learned teamwork" or "importance of leadership"');
    }
  }

  // Before/after check
  if (question.validationCriteria.requiresBeforeAfter) {
    const hasBeforeSignal = /before|used to|didn't|never|always thought/i.test(answer);
    const hasAfterSignal = /now|today|currently|since then|learned to/i.test(answer);

    if (!hasBeforeSignal || !hasAfterSignal) {
      validation.followUpNeeded = true;
      validation.feedback.push('Show the contrast: What did you think/do BEFORE vs. NOW?');
    }
  }

  return validation;
}

// Follow-up prompt generation
function generateFollowUp(question: Question, shallowAnswer: string): FollowUpPrompt {
  // Analyze what's missing from the shallow answer
  const missing = identifyMissingElements(shallowAnswer, question.validationCriteria);

  return {
    text: `Your answer is a good start. To deepen it, try adding: ${missing.join(', ')}`,
    examples: getExamplesForMissing(missing),
    optional: true  // User can skip if they want
  };
}
```

**Enhanced UI Component:**

```typescript
// ENHANCED: AdaptiveReflectionPanel.tsx
<AdaptiveReflectionPanel>
  {questions.map((question, idx) => (
    <QuestionCard key={question.id}>
      <QuestionNumber>Question {idx + 1} of 3</QuestionNumber>
      <QuestionText>{question.text}</QuestionText>

      {question.archetypeAlignment && (
        <ArchetypeHint>
          💡 This question helps build the "{question.archetypeAlignment[0]}" narrative pattern
        </ArchetypeHint>
      )}

      <AnswerInput
        value={answers[question.id] || ''}
        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
        onBlur={() => validateCurrentAnswer(question.id)}
        placeholder="Write 3-5 sentences..."
        minLength={question.validationCriteria.minLength}
      />

      <CharacterCount>
        {answers[question.id]?.length || 0} / {question.validationCriteria.minLength} characters
      </CharacterCount>

      {validationResults[question.id] && (
        <ValidationFeedback validation={validationResults[question.id]}>
          {validationResults[question.id].feedback.map(f => (
            <FeedbackItem type={validationResults[question.id].isValid ? 'success' : 'warning'}>
              {f}
            </FeedbackItem>
          ))}

          {validationResults[question.id].followUpNeeded && (
            <FollowUpPrompt>
              {generateFollowUp(question, answers[question.id]).text}
              <Examples>
                {generateFollowUp(question, answers[question.id]).examples.map(ex => (
                  <Example>{ex}</Example>
                ))}
              </Examples>
            </FollowUpPrompt>
          )}
        </ValidationFeedback>
      )}

      {validationResults[question.id]?.isValid && (
        <SuccessMessage>
          ✓ Great depth! This will help generate an authentic narrative.
        </SuccessMessage>
      )}
    </QuestionCard>
  ))}

  <SubmitButton
    disabled={!allQuestionsValidated}
    onClick={handleSubmitReflections}
  >
    Continue to Draft Generation
  </SubmitButton>
</AdaptiveReflectionPanel>
```

---

## Part 4: Strategic Implementation Roadmap

### Phase 0: Foundation & Content (Weeks 1-2)

**Goal:** Create teaching content library and refine adapters

**Deliverables:**
1. ✅ Complete teaching content library (50 human-written example pairs)
   - Organized by issue type × archetype
   - Each tagged with generator requirements
   - Cultural diversity ensured
   - Review checklist applied

2. ✅ Adapter interfaces finalized
   - `graderAdapter.ts` with issue extraction logic
   - `generatorAdapter.ts` with fact-checking
   - `contextAdapter.ts` for profile enrichment

3. ✅ Example corpus data structure
   - TypeScript interfaces defined
   - JSON seed data created
   - Import/export utilities built

4. ✅ Unit tests for adapters
   - Mock grader/generator responses
   - Golden test fixtures
   - Edge case coverage

**Success Criteria:**
- 50 examples reviewed by 2+ people
- All examples score deltas validated (weak→strong improves by 10+ NQI points)
- Adapters pass unit tests with 90%+ coverage
- Example corpus loads successfully in UI

---

### Phase 1: Core Teaching Experience (Weeks 3-4)

**Goal:** Build teaching units, micro-prompts, and enhanced reflection

**Deliverables:**
1. ✅ Enhanced TeachingIssueCard
   - Learn tab populated with real content from library
   - Practice tab built with micro-prompt system
   - Example carousel functional
   - Fix strategy tabs implemented

2. ✅ MicroPromptCard component
   - Fragment regrade service
   - Instant feedback loop
   - "Apply to draft" functionality
   - Delta visualization (mini version)

3. ✅ Adaptive Reflection Panel
   - Question selection logic
   - Semantic answer validation
   - Follow-up prompt generation
   - Progress tracking

4. ✅ Integration tests
   - Full teaching unit flow (read → practice → apply)
   - Reflection → validation → generator handoff
   - Version management

**Success Criteria:**
- User can complete micro-prompt and see +2 specificity improvement
- Shallow reflection answers trigger follow-up prompts
- Teaching units display correct examples for detected issues
- 5 end-to-end flows tested successfully

---

### Phase 2: Generator Integration (Weeks 5-6)

**Goal:** Surface the powerful generator in the UI

**Deliverables:**
1. ✅ Angle Selection Modal
   - Display 5 validated angles
   - Show quality scores (grounding, authenticity, bridge)
   - Warning/strength display
   - User selection captured

2. ✅ Draft Generation Flow
   - Progress indicator during generation
   - Multi-candidate comparison view
   - Provenance display (which reflection drove this?)
   - Predicted score display

3. ✅ Generator Workflow Orchestration
   - Reflection → Angle Selection → Generation → Selection
   - State management across steps
   - Error handling (generation failures)
   - Retry logic

4. ✅ Fact-checking validation UI
   - Flag drafts with hallucinated details
   - Highlight suspicious new facts
   - User approval flow

**Success Criteria:**
- User can generate 3 draft candidates in <60 seconds
- Angles show accurate quality scores
- Flagged drafts clearly marked with warnings
- User can select a draft and continue editing
- Generated drafts score 75+ NQI consistently

---

### Phase 3: Delta Visualization & Polish (Weeks 7-8)

**Goal:** Complete the feedback loop with visual comparisons

**Deliverables:**
1. ✅ DeltaVisualization component
   - Side-by-side diff view
   - Dimension-level delta bars
   - Improvement/still-needs commentary
   - Action buttons (accept/revert/continue)

2. ✅ Enhanced Progress Tracking
   - Real-time dimension bars in left rail
   - Iteration counter
   - NQI trend graph (sparkline)
   - "Quick wins" suggestions

3. ✅ Version History enhancements
   - Thumbnail previews
   - Restore functionality
   - Auto-generated change descriptions
   - Score history chart

4. ✅ Final integration polish
   - Smooth transitions between components
   - Loading states and error boundaries
   - Mobile responsiveness
   - Accessibility (ARIA labels, keyboard nav)

**Success Criteria:**
- Delta visualization loads in <2 seconds
- Users can compare any two versions
- Progress bars update in real-time as user edits
- Mobile layout usable on phones (responsive breakpoints)
- WCAG 2.1 AA compliance

---

### Phase 4: Testing & Refinement (Weeks 9-10)

**Goal:** Validate with real users and iterate

**Deliverables:**
1. ✅ Human evaluation pipeline
   - Nightly sample generation (N=30)
   - Reviewer portal with rating interface
   - Inter-rater agreement tracking (Cohen's κ)
   - Acceptance rate dashboard

2. ✅ Golden test suite expansion
   - 200 validation entries (diverse profiles)
   - Regression tests for all components
   - Performance benchmarks (latency SLAs)
   - Fuzzing tests (malformed input)

3. ✅ User testing sessions
   - 10-15 students test full workshop
   - Session recordings and notes
   - Usability issues logged
   - Satisfaction survey (SUS score)

4. ✅ Iteration based on feedback
   - Fix top 5 usability issues
   - Optimize performance bottlenecks
   - Refine teaching content based on confusion points
   - Update example library with user-requested contexts

**Success Criteria:**
- Human acceptance rate ≥80%
- Inter-rater agreement κ ≥0.6
- User satisfaction (SUS) score ≥75
- 95th percentile latency <5 seconds
- Zero critical bugs in production

---

## Part 5: Metrics & Success Tracking

### 5.1 Operational Metrics

**Per Session:**
- NQI delta (initial → final): Target +15
- Reflection score delta: Target +2.0
- Iteration count: Target median ≤3
- Completion rate: Target ≥70%
- Final adoption rate: Target ≥60%

**Per Component:**
- Micro-prompt usage: Target 2.5 per session
- Teaching unit engagement: Target 80% read at least 2 units
- Generator usage: Target 50% try generated drafts
- Reflection completion: Target 85% answer all 3 questions

**Quality Metrics:**
- Human acceptance rate: Target ≥80%
- Fact-check flag rate: Target <5%
- Authenticity score (generated): Target ≥7/10
- Literary sophistication (generated): Target ≥70/100

### 5.2 Dashboard Views

**Student Dashboard:**
```
Your Progress
─────────────
NQI:          58 → 72 (+14)  [████████░░] On track!
Iterations:   2 / 5 recommended
Issues Fixed: 2 / 3

Dimension Breakdown:
Specificity   [███████░░░] 7/10 (+3)
Impact        [███████░░░] 7/10 (+4)
Reflection    [█████░░░░░] 5/10 (+3)  ⚠️ Focus here next

Next Steps:
1. Address "Missing Reflection" (view teaching unit)
2. Try micro-prompt: "What deeper fear did this expose?"
3. Consider generating a new draft with updated reflections
```

**Admin Dashboard:**
```
Workshop Performance (Last 30 Days)
───────────────────────────────────
Sessions Started:    450
Completion Rate:     72% (+5% vs. last month)
Avg NQI Delta:       +16.3
Median Iterations:   2.8

Component Engagement:
Teaching Units:      87% viewed ≥2 units
Micro-Prompts:       2.4 avg per session
Generator:           58% used generated drafts
Reflection:          81% completed all questions

Quality Metrics:
Human Accept Rate:   83% (target: 80%) ✓
Fact-Check Flags:    3.2% (target: <5%) ✓
Avg Authenticity:    7.8/10 (target: 7+) ✓

Top Issues Detected:
1. Generic Language   (62% of sessions)
2. Missing Reflection (48%)
3. Weak Verbs        (34%)
```

---

## Part 6: Phase 0 Checkpoint — Decision Points

### Critical Questions for Human Review:

1. **Teaching Content Strategy:**
   - Approve the 50-example structure (8 issue types × 6 archetypes)?
   - Should we prioritize certain archetypes (e.g., Technical-Human Bridge for STEM-heavy users)?
   - Who will write/review the initial 50 examples? Timeline?

2. **Generator Integration Philosophy:**
   - Should angle selection be mandatory or optional?
   - How many draft candidates to generate (currently: 3)?
   - Should we allow users to regenerate unlimited times or cap at 3 attempts?

3. **Micro-Prompt Scope:**
   - Start with all 8 issue types or focus on top 3 (generic_language, missing_reflection, weak_verbs)?
   - Should micro-prompts support multi-sentence rewrites or enforce single-phrase focus?

4. **Reflection Validation Rigor:**
   - How strict should semantic validation be? Block submission if shallow or just warn?
   - Should we require minimum answer length (currently: 50-70 chars per question)?

5. **Performance Trade-offs:**
   - Generator calls take 30-45s. Show loading state or generate in background?
   - Micro-prompt regrade adds 2-3s latency. Acceptable or optimize further?

6. **Content Diversity:**
   - Is the cultural/activity diversity plan sufficient (8 international, 6 low-resource, etc.)?
   - Any underrepresented contexts we should prioritize?

### Approval Needed to Proceed:

- ✅ Approve 50-example teaching library structure
- ✅ Approve adaptive question engine validation criteria
- ✅ Approve generator UI integration flow (reflection → angle → drafts)
- ✅ Approve delta visualization design
- ✅ Approve micro-prompt scope and feedback mechanism
- ✅ Approve Phase 1-4 timeline (10 weeks)

---

## Part 7: Next Immediate Steps (Post-Approval)

**Week 1 Tasks:**
1. Create teaching content authoring template (Google Doc or Notion)
2. Write first 10 human-reviewed example pairs (2 per top issue type)
3. Build example corpus TypeScript interfaces and JSON schema
4. Implement graderAdapter with issue extraction logic
5. Write unit tests for adapters (mock responses)

**Week 1 Deliverables:**
- 10 approved example pairs in JSON format
- Adapter interfaces fully typed and tested
- Issue extraction logic functional
- Unit test coverage ≥90% for adapters

**Dependencies:**
- Human reviewer availability for example approval
- Design approval for UI components (delta viz, generator modal)
- Backend API endpoints stable (no breaking changes)

---

**End of Implementation Plan**

This plan provides the **strategic depth and rigor** needed to transform the partial foundation into a world-class workshop. Every component leverages your 19-iteration generator's proven patterns while filling critical gaps systematically.

**Status:** 🟢 Ready for Phase 0 Human Checkpoint Review
