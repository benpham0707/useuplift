# Extracurricular Narrative Workshop — UX Design & Implementation Specification
**Version:** 2.0
**Date:** 2025-11-09
**Status:** Phase 0 — Ready for Human Review

---

## Executive Summary

This document defines a **pedagogically-driven, iterative workshop experience** that transforms weak extracurricular narratives into admissions-ready entries. The system teaches students **why** their writing falls short, guides them through reflection and exploration, and helps them produce authentic improvements with measurable rubric gains.

**Core Philosophy:**
- **Teach, don't just fix**: Every suggestion includes context, examples, and the admissions rationale
- **Multiple pathways**: Offer 2-3 distinct fix strategies per issue so students choose what fits their voice
- **Reflection-first**: Guide students to discover deeper meaning before rewriting
- **Test-driven reliability**: Every component validated against golden examples and human evaluation

---

## 1. System Architecture & Integration

### 1.1 Discovered Services (from codebase exploration)

**✅ Narrative Grader (Existing)**
- **Location**: `/src/core/analysis/engine.ts` + feature detectors
- **Key Components**:
  - `rubricScorer.ts` - 12-dimension scoring with interaction rules
  - `authenticityDetector.ts` - Voice genuineness (0-10)
  - `elitePatternDetector.ts` - 7 advanced patterns from elite admits
  - `literarySophisticationDetector.ts` - Metaphor, structure, sensory depth
  - `categoryScorer.ts` - Parallel batch scoring of 11 categories
- **Output**: `AnalysisReport` with NQI (0-100), dimension scores, flags, improvement levers
- **Current Usage**: Powers existing workshop analysis API

**✅ Essay Generator (Existing)**
- **Location**: `/src/core/generation/essayGenerator.ts`
- **Key Components**:
  - `essayGenerator.ts` - Iterative generation with 7 literary techniques
  - `narrativeAngleGenerator.ts` - Creates 10+ unique angles from 6 archetypes
  - `angleQualityValidator.ts` - Multi-stage validation (grounding, bridge, authenticity)
- **Output**: Generated narratives with target scores (Tier 1: 85+, Tier 2: 75+, Tier 3: 65+)
- **Current Usage**: Powers angle generation and essay rewriting

**✅ Workshop UI (Existing)**
- **Location**: `/src/components/portfolio/extracurricular/workshop/`
- **Components**: IssueCard, RubricDimensionCard, DraftEditor, VersionHistory, OverallScoreCard
- **API Layer**: `workshopApi.ts` - Typed interface to all backend services

### 1.2 New Components to Build

```typescript
// Teaching Engine - Core pedagogical orchestration
/src/core/workshop/teachingEngine.ts
  - IssueTeachingUnit: For each detected issue, provides explanation + examples + fix strategies
  - AdaptiveQuestionEngine: Generates 3 context-aware guided questions per issue
  - ExampleCorpus: Human-written weak→strong example pairs (seed set)
  - FixStrategyGenerator: Creates 2-3 diverse fix approaches per issue type

// Workshop Orchestrator - Main workflow coordination
/src/core/workshop/workshopOrchestrator.ts
  - Entry intake & context enrichment
  - Multi-step flow: Diagnose → Teach → Reflect → Rewrite → Regrade → Iterate
  - Version management & history tracking
  - Progress tracking across rubric axes

// Regrade & Delta Visualizer
/src/core/workshop/regradeEngine.ts
  - Re-evaluate revised drafts
  - Calculate score deltas across all dimensions
  - Identify what improved vs. still needs work
  - Generate explicit commentary on changes

// Micro-prompt Handler
/src/core/workshop/microPromptHandler.ts
  - Accept focused writing tasks (1-2 sentence rewrites)
  - Provide immediate inline feedback
  - Mini-regrade on fragment level
  - Contextual hints tied to rubric axes

// Integration Adapters (thin wrappers)
/src/core/workshop/adapters/
  - graderAdapter.ts: Uniform interface to analysis engine
  - generatorAdapter.ts: Uniform interface to essay generator
  - contextAdapter.ts: Pull user profile data (role, time commitment, related essays)
```

---

## 2. User Experience Flow (Single Entry)

### 2.1 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. INPUT & CONTEXT                                                      │
│    • User selects/pastes extracurricular entry                          │
│    • System enriches with profile data (role, hours/week, related essays)│
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. DIAGNOSIS                                                            │
│    • Call Narrative Grader via adapter                                  │
│    • Receive prioritized issues (max 3) + evidence spans                │
│    • Show confidence scores + initial NQI                               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. TEACHING UNITS (per issue)                                           │
│    For each detected issue, present:                                    │
│    ┌──────────────────────────────────────────────────────────────────┐│
│    │ A. Why This Matters (1-2 sentences)                              ││
│    │    "Admissions readers need specificity to visualize your impact"││
│    ├──────────────────────────────────────────────────────────────────┤│
│    │ B. What Triggered This (annotated span)                          ││
│    │    Highlight: "led the team" → vague, passive                   ││
│    ├──────────────────────────────────────────────────────────────────┤│
│    │ C. Before → After Example (concise human-written pair)           ││
│    │    Weak:  "Volunteered at local shelter"                        ││
│    │    Strong: "Coordinated 12 weekend meal drives serving 400+     ││
│    │             families; built inventory system cutting waste 30%" ││
│    ├──────────────────────────────────────────────────────────────────┤│
│    │ D. Fix Strategies (2-3 diverse approaches)                       ││
│    │    1. Metric-anchored: Add numbers (hours, people, outcomes)     ││
│    │    2. Anecdote: One micro-story showing a challenge overcome     ││
│    │    3. Structural: Reorder to lead with impact, not duty         ││
│    ├──────────────────────────────────────────────────────────────────┤│
│    │ E. Micro-Prompt (single focused task)                            ││
│    │    "Rewrite 'led the team' to show ONE specific action you took"││
│    │    [Input box] → Submit → Immediate mini-regrade + feedback      ││
│    └──────────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. REFLECTION & EXPLORATION                                             │
│    Present 3 adaptive guided questions (open-ended):                    │
│    • "Who specifically benefited from this action and how?"            │
│    • "What was the hardest part and what did you do when Plan A failed?"│
│    • "What concrete outcome can you point to that shows change?"        │
│    Capture responses → Feed into rewrite context                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. REWRITE ASSIST                                                       │
│    • User writes in main editor                                         │
│    • Inline hints tied to rubric axes (do not auto-rewrite)            │
│    • [Optional] Call Essay Generator for 2-3 draft proposals            │
│      constrained by user's reflection answers                           │
│    • Show provenance: "Generated based on your answer about impact"    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. REGRADE & COMPARE                                                    │
│    • Re-run Narrative Grader on new draft                               │
│    • Delta visualization: NQI 58→72 (+14)                              │
│    • Dimension-level changes:                                           │
│      Specificity: 4→7 (+3) ✓ | Reflection: 5→6 (+1) ⚠ needs more      │
│    • Explicit commentary: "Great improvement in specificity. Consider   │
│      adding one line connecting this experience to your current values."│
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. ITERATE or ACCEPT                                                    │
│    • If user satisfied or quality thresholds met → Save & Export        │
│    • Else → Return to Teaching Units with updated focus                 │
│    • Maintain version history; show learning summary after each round   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Issue Prioritization Logic

Use existing grader's improvement levers but enhance with pedagogical priorities:

1. **Tier 1 (Always surface)**:
   - Generic language (e.g., "helped out", "made a difference")
   - Missing quantification (no metrics, scale, frequency)
   - Passive voice hiding ownership (e.g., "was involved in")

2. **Tier 2 (Surface if NQI < 70)**:
   - Weak verbs (e.g., "participated", "assisted")
   - Missing reflection/growth
   - List-like structure (duties vs. impact)

3. **Tier 3 (Surface if NQI < 50)**:
   - Clichés (e.g., "life-changing", "passion")
   - Telling not showing (e.g., "I'm dedicated")
   - Resume-speak (e.g., "responsibilities included")

**Max 3 issues per iteration** to avoid overwhelming the student.

---

## 3. Teaching Content Framework

### 3.1 Issue Types & Teaching Units

For each issue type, define:
- Short explanation (why it matters for admissions)
- Common triggers (patterns that flag this issue)
- 2-3 human-written weak→strong example pairs
- 2-3 diverse fix strategies
- 1 micro-prompt template

**Example: Generic Language**

```typescript
{
  issueType: "generic_language",

  explanation: "Admissions readers evaluate hundreds of entries. Generic phrases like 'made a difference' or 'helped people' don't create mental images or demonstrate your specific impact. Specificity helps readers visualize your work and remember you.",

  triggers: [
    "made a difference", "helped out", "contributed to",
    "worked with", "was involved", "gained experience"
  ],

  examplePairs: [
    {
      weak: "Volunteered at local animal shelter helping with various tasks",
      strong: "Redesigned the shelter's intake form, cutting processing time from 45 to 12 minutes and enabling staff to onboard 3x more animals per weekend",
      wordCount: { weak: 10, strong: 28 }
    },
    {
      weak: "Led environmental club initiatives and organized events",
      strong: "Launched campus-wide composting program: pitched to administration with waste audit data, trained 40 volunteers, diverted 2 tons from landfills in first semester",
      wordCount: { weak: 8, strong: 26 }
    },
    {
      weak: "Tutored underprivileged students in math after school",
      strong: "Designed visual algebra curriculum for 8 ESL students at community center; 6 moved from D/F to B+ within one semester using my diagrammatic method",
      wordCount: { weak: 8, strong: 28 }
    }
  ],

  fixStrategies: [
    {
      name: "Metric-anchored fix",
      description: "Add concrete numbers: How many? How often? What scale?",
      example: "'Tutored students' → 'Tutored 8 students, 2 hours/week for 6 months'"
    },
    {
      name: "Anecdote fix",
      description: "Show one specific moment that illustrates your approach or impact",
      example: "'Helped students improve' → 'One student told me my visual method finally made quadratics 'click' after 2 years of confusion'"
    },
    {
      name: "Outcome fix",
      description: "Lead with the concrete result, then explain the action",
      example: "'Organized fundraiser' → 'Raised $8,000 for refugee families by converting our school's talent show into a ticketed benefit concert'"
    }
  ],

  microPrompt: "Rewrite your current sentence to include ONE specific metric or outcome. What number, frequency, or measurable result can you add?"
}
```

### 3.2 Example Corpus Requirements

**Seed Set (Human-Written)**:
- **Quantity**: 50 example pairs minimum (10 per top issue type)
- **Length**: Weak 8-18 words; Strong 12-40 words
- **Quality Criteria**:
  - Natural, student-authentic voice
  - Diverse activities (STEM, arts, community service, athletics, leadership)
  - Culturally diverse contexts (urban/rural, international, low-resource settings)
  - Clear before→after improvement in target dimension

**Example Pair Template**:
```typescript
interface ExamplePair {
  weak: string;                    // 8-18 words
  strong: string;                  // 12-40 words
  issueType: IssueType;            // Which teaching unit this supports
  improvementFocus: string[];      // e.g., ["specificity", "impact"]
  scoreDeltas: {                   // Expected rubric improvements
    specificity?: number;
    impact?: number;
    reflection?: number;
    authenticity?: number;
  };
  provenance: "human" | "synthetic"; // Always prefer human
  reviewStatus?: "approved" | "pending" | "rejected";
  context?: string;                // Optional: activity type, role, cultural context
}
```

### 3.3 Adaptive Guided Questions

**Question Bank** (15 total, algorithmically select 3 per issue):

**For Generic Language / Missing Specificity**:
1. "What is ONE specific action you took that someone else in your role might NOT have done?"
2. "If you had to describe this work to someone who's never heard of your organization, what concrete details would help them visualize it?"
3. "What tangible outcome (numbers, schedule, product, event) can you point to that shows change?"

**For Missing Impact**:
4. "Who specifically benefited from this action and how did their experience change?"
5. "What would have happened (or not happened) if you hadn't done this work?"
6. "Can you name one person who was affected and describe one moment when you saw the impact?"

**For Missing Reflection/Growth**:
7. "What was the hardest part of this work, and what did you do when the easiest approach failed?"
8. "How did this experience change the way you think or behave today? Give one concrete example."
9. "If you had to teach one skill you learned here to a friend, what would you teach and why does it matter?"

**For Weak Verbs / Passive Voice**:
10. "Replace 'I helped with' or 'I was involved in': What is the most active, specific verb for YOUR role?"
11. "What decision did you make or action did you take that required your judgment or initiative?"

**For List-like / Duties-focused**:
12. "Of all your responsibilities, which ONE made the biggest difference, and why?"
13. "What's one moment when you had to go beyond your assigned duties to solve an unexpected problem?"

**For Clichés / Telling Not Showing**:
14. "Instead of saying 'I'm passionate about X', describe one moment when you lost track of time or forgot to eat because you were so absorbed in X."
15. "Replace 'This was life-changing': What is one specific way you think or act differently now compared to before this experience?"

**Selection Algorithm**:
```typescript
function selectAdaptiveQuestions(
  issueTypes: IssueType[],
  currentDraft: string,
  userProfile: UserContext
): Question[] {
  // 1. Pick 1 question per detected issue (up to 3 issues)
  // 2. Avoid redundancy: if multiple issues map to same question, pick next best
  // 3. Prioritize questions the user hasn't answered before in this session
  // 4. Return exactly 3 questions, even if fewer issues detected
}
```

---

## 4. UI/UX Specification

### 4.1 Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│  EXTRACURRICULAR NARRATIVE WORKSHOP                    [Save] [Export]     │
├─────────────────────┬──────────────────────────────────────────────────────┤
│ LEFT RAIL (30%)     │ MAIN EDITOR AREA (70%)                               │
│                     │                                                      │
│ ┌─────────────────┐ │ ┌──────────────────────────────────────────────────┐│
│ │ PROGRESS TRACKER││ │ │ CURRENT DRAFT                                    ││
│ │                 ││ │ │ ┌──────────────────────────────────────────────┐││
│ │ NQI: 58 → 72    ││ │ │ │ As founder of Code for Change, I designed    │││
│ │ ████████░░ +14  ││ │ │ │ and taught [a Python curriculum]¹ to 15      │││
│ │                 ││ │ │ │ underserved middle schoolers at Lincoln       │││
│ │ Specificity     ││ │ │ │ Community Center...                          │││
│ │ ████████░░ 4→7  ││ │ │ └──────────────────────────────────────────────┘││
│ │                 ││ │ │                                                  ││
│ │ Impact          ││ │ │ ¹ Tooltip: "Good! Specific curriculum. Consider ││
│ │ ██████░░░░ 5→6  ││ │ │    adding what made YOUR approach unique."       ││
│ │                 ││ │ └──────────────────────────────────────────────────┘│
│ │ Reflection      ││ │                                                      │
│ │ ████░░░░░░ 3→4  ││ │ ┌──────────────────────────────────────────────────┐│
│ │ ⚠ Needs work    ││ │ │ INLINE SUGGESTIONS                               ││
│ │                 ││ │ │ • Add outcome metric: How many students improved?││
│ │ [Version Hist.] ││ │ │ • Consider: What happened after the program?     ││
│ └─────────────────┘ │ └──────────────────────────────────────────────────┘│
│                     │                                                      │
│ ┌─────────────────┐ │ ┌──────────────────────────────────────────────────┐│
│ │ ⚠ ISSUE CARDS   ││ │ │ TEACHING UNIT: Generic Language                  ││
│ │                 ││ │ │ [Expanded]                                       ││
│ │ ⚠ Generic       ││ │ │                                                  ││
│ │   Language      ││ │ │ Why it matters: Admissions readers need...      ││
│ │   [Expanded]    ││ │ │                                                  ││
│ │                 ││ │ │ ┌──────────────────────────────────────────────┐││
│ │ ⚠ Missing       ││ │ │ │ BEFORE vs AFTER                              │││
│ │   Quantification││ │ │ │ Weak:  "Volunteered at shelter helping..."   │││
│ │   [Collapsed]   ││ │ │ │ Strong: "Redesigned intake form, cutting..." │││
│ │                 ││ │ │ └──────────────────────────────────────────────┘││
│ │ ⚠ Weak Verbs    ││ │ │                                                  ││
│ │   [Collapsed]   ││ │ │ Fix Strategies: [Metric] [Anecdote] [Outcome]   ││
│ │                 ││ │ │                                                  ││
│ └─────────────────┘ │ │ Micro-prompt: "Rewrite 'helped' to show ONE..."  ││
│                     │ │ [Input box]                    [Submit & Regrade] ││
│ [Start Reflection]  │ └──────────────────────────────────────────────────┘│
│ [Generate Drafts]   │                                                      │
└─────────────────────┴──────────────────────────────────────────────────────┘
```

### 4.2 Component Specifications

**4.2.1 Progress Tracker**
- Visual bars for 4 core axes: Specificity, Impact, Reflection, Authenticity
- Before → After scores with delta highlighting (green if +2 or more, yellow if +1, gray if no change)
- NQI headline score with change indicator
- Click to expand detailed dimension scores (all 12 rubric dimensions)

**4.2.2 Issue Cards (Left Rail)**
- Max 3 cards visible at once
- Each card shows:
  - Issue type icon + label
  - Confidence score (e.g., "High confidence")
  - Snippet of flagged text (first 8 words + ellipsis)
  - Click to expand Teaching Unit in main area
- Collapsed state: Just icon, label, snippet (3 lines)
- Expanded state: Pushes Teaching Unit content to main area

**4.2.3 Main Editor**
- Rich text editor with inline annotations
- Flagged spans get colored underlines (orange for Tier 1 issues, yellow for Tier 2)
- Hover over flagged text shows tooltip with 1-line rationale
- Inline suggestions panel (right sidebar within editor) shows:
  - Top 2-3 actionable suggestions
  - Tied to cursor position when possible
  - Updates as user types

**4.2.4 Teaching Unit Panel (Main Area)**
- Appears when Issue Card is expanded
- Sections (collapsible accordion style):
  - **Why It Matters** (always visible)
  - **Your Current Text** (annotated span)
  - **Before & After Examples** (carousel if multiple examples)
  - **Fix Strategies** (3 tabs: Metric | Anecdote | Outcome)
  - **Micro-Prompt** (input box + submit button)
- After micro-prompt submission:
  - Show mini-regrade: "Specificity improved +1! Try adding one more concrete detail."
  - Offer "Apply to full draft" button to insert the improved fragment

**4.2.5 Reflection Module**
- Triggered by "Start Reflection" button (after initial diagnosis)
- Full-screen modal overlay (to focus attention)
- Shows 3 guided questions, one at a time
- Free-text input (3-5 sentence target length hint)
- Progress indicator: "Question 1 of 3"
- At completion: "Great! Your reflections will help guide your rewrite. Ready to draft?" → Returns to main editor with reflection answers available in sidebar

**4.2.6 Generate Drafts Panel**
- Button: "Generate Draft Ideas" (only appears after reflection completed)
- Calls Essay Generator with constraints:
  - User's reflection answers as grounding context
  - Target word count (infer from original entry)
  - Prohibit new facts not mentioned by user
- Shows 2-3 generated options side-by-side
- Each option labeled with:
  - Predicted NQI score
  - Key strengths (e.g., "Strong metaphor", "Clear impact")
  - Provenance: "Generated based on your answer about [topic]"
- User can:
  - Select one to replace current draft
  - Cherry-pick phrases (click to highlight, then "Insert at cursor")
  - Dismiss all and continue manual editing

**4.2.7 Regrade & Compare View**
- Triggered by "Regrade" button (or auto-triggered after significant edits)
- Side-by-side comparison:
  - Left: Previous version with old scores
  - Right: Current version with new scores
- Diff highlighting:
  - Green: Additions
  - Red (strikethrough): Deletions
  - Yellow: Modified spans
- Commentary panel below:
  - "✓ What Improved": Bulleted list of positive changes with evidence quotes
  - "⚠ Still Needs Work": Bulleted list of remaining issues with suggestions
- Buttons: [Accept This Version] [Keep Editing] [Revert to Previous]

**4.2.8 Version History Panel**
- Accessible from left rail button
- List of all saved drafts (timestamp + short label)
- Each entry shows:
  - NQI score
  - Key change description (auto-generated)
  - "Restore" button
- Click any version to preview in read-only overlay
- Limit: 10 versions per session (auto-prune oldest)

### 4.3 Interaction Flows

**Flow A: Fix a Specific Issue (Micro-prompt)**
1. User clicks Issue Card → Teaching Unit expands
2. User reads example, picks a fix strategy
3. User types response in micro-prompt box
4. Clicks "Submit & Regrade"
5. System runs mini-grader on fragment + surrounding context
6. Shows immediate feedback: "Specificity +2! Now has concrete action."
7. User clicks "Apply to full draft" → Fragment inserted at original location
8. Issue Card updates (may disappear if resolved)

**Flow B: Deep Reflection → Rewrite**
1. User clicks "Start Reflection"
2. Answers 3 guided questions (one at a time)
3. System stores answers + updates context
4. User returns to editor, begins rewriting with reflection in mind
5. Inline hints now reference reflection answers: "You mentioned [X] in your reflection—consider weaving that in here."
6. User clicks "Regrade" when done
7. System shows delta visualization + commentary

**Flow C: Generate & Evaluate Drafts**
1. User completes reflection
2. Clicks "Generate Draft Ideas"
3. System calls generator with constraints (reflection + prohibit new facts)
4. 2-3 drafts appear in side-by-side cards
5. User previews each, sees predicted scores
6. User selects one → Replaces current draft
7. System auto-triggers regrade
8. User can now edit the generated draft or iterate further

**Flow D: Iterative Improvement Loop**
1. Initial diagnosis → 3 issues flagged
2. User addresses Issue 1 via micro-prompt
3. Issue 1 resolved, Issue Card disappears
4. User addresses Issue 2 via reflection + manual rewrite
5. Regrade shows Issue 2 improved but Issue 3 still present + NEW Issue 4 detected
6. User continues until satisfied or NQI threshold met (e.g., 75+)
7. User clicks "Save & Export" → Final version saved to profile

---

## 5. Integration Adapter Specifications

### 5.1 Grader Adapter

**Purpose**: Uniform interface to existing analysis engine

```typescript
// /src/core/workshop/adapters/graderAdapter.ts

import { analyzeEntry } from "@/core/analysis/engine";
import type { AnalysisReport } from "@/core/analysis/types";
import type { ExperienceEntry } from "@/core/types/experience";

export interface GraderInput {
  entryText: string;
  context?: {
    role?: string;
    timeCommitment?: string;
    relatedEssays?: string[];
  };
}

export interface GraderOutput {
  nqi: number;                        // 0-100 Narrative Quality Index
  dimensionScores: {                  // 12 rubric dimensions
    specificity: number;
    impact: number;
    reflection: number;
    authenticity: number;
    vulnerability: number;
    growth: number;
    structure: number;
    voice: number;
    opening: number;
    conclusion: number;
    coherence: number;
    sophistication: number;
  };
  issues: Issue[];                    // Prioritized list (max 3)
  flags: string[];                    // e.g., "ai_sounding", "missing_vulnerability"
  improvementLevers: ImprovementLever[];
  evidence: EvidenceSpan[];           // Spans that triggered flags
}

export interface Issue {
  type: IssueType;
  severity: "high" | "medium" | "low";
  confidence: number;                 // 0-1
  flaggedSpans: EvidenceSpan[];
  shortDescription: string;
}

export type IssueType =
  | "generic_language"
  | "missing_quantification"
  | "weak_verbs"
  | "passive_voice"
  | "missing_reflection"
  | "list_structure"
  | "cliches"
  | "telling_not_showing";

export interface EvidenceSpan {
  text: string;
  startIdx: number;
  endIdx: number;
  reason: string;
}

export interface ImprovementLever {
  dimension: string;
  currentScore: number;
  potentialGain: number;
  suggestion: string;
}

export async function evaluateEntry(input: GraderInput): Promise<GraderOutput> {
  // 1. Transform input to match existing analyzeEntry schema
  const experienceEntry: ExperienceEntry = {
    description: input.entryText,
    // ... map context fields
  };

  // 2. Call existing grader
  const analysisReport: AnalysisReport = await analyzeEntry(experienceEntry);

  // 3. Transform output to workshop schema
  const issues = extractPrioritizedIssues(analysisReport);
  const dimensionScores = mapRubricScores(analysisReport.rubricScores);
  const nqi = analysisReport.nqi || computeNQI(dimensionScores);

  return {
    nqi,
    dimensionScores,
    issues,
    flags: analysisReport.flags || [],
    improvementLevers: analysisReport.improvementLevers || [],
    evidence: extractEvidenceSpans(analysisReport),
  };
}

function extractPrioritizedIssues(report: AnalysisReport): Issue[] {
  // Map existing flags and scores to Issue types
  // Prioritize by severity and pedagogical importance
  // Return max 3 issues
}

function extractEvidenceSpans(report: AnalysisReport): EvidenceSpan[] {
  // Parse evidence quotes from rubric feedback
  // Match spans to original text
  // Return with start/end indices for highlighting
}

// ... helper functions
```

**Testing**:
- Unit tests with mocked analysis engine responses
- Golden tests: 10 seed entries with expected issue extraction
- Edge cases: very short entries (<10 words), very long entries (>500 words), non-English text

### 5.2 Generator Adapter

**Purpose**: Uniform interface to existing essay generator

```typescript
// /src/core/workshop/adapters/generatorAdapter.ts

import { generateEssay } from "@/core/generation/essayGenerator";
import type { EssayGenerationResult } from "@/core/generation/types";

export interface GeneratorInput {
  originalText: string;
  reflectionAnswers: string[];        // User's responses to guided questions
  constraints: {
    targetWordCount?: number;
    prohibitNewFacts: boolean;        // CRITICAL: Only use user-provided info
    focusDimensions: string[];        // e.g., ["specificity", "reflection"]
    preserveVoice: boolean;
  };
  targetTier: 1 | 2 | 3;              // 1 = 85+, 2 = 75+, 3 = 65+
}

export interface GeneratorOutput {
  candidates: GeneratedCandidate[];
  metadata: {
    model: string;
    generationTime: number;
    seedUsed: string;
  };
}

export interface GeneratedCandidate {
  text: string;
  predictedNQI: number;
  keyStrengths: string[];             // e.g., ["Strong metaphor", "Clear outcome"]
  provenance: string;                 // Which reflection answer this builds on
  flagForHumanReview: boolean;        // True if new facts introduced
  techniqueUsed?: string;             // e.g., "Extended Metaphor", "In Medias Res"
}

export async function generateRewriteCandidates(
  input: GeneratorInput
): Promise<GeneratorOutput> {
  // 1. Build enriched context from reflection answers
  const context = synthesizeContext(input.reflectionAnswers);

  // 2. Call existing generator with constraints
  const results: EssayGenerationResult[] = await Promise.all([
    generateEssay({
      content: input.originalText,
      context,
      targetScore: getTierThreshold(input.targetTier),
      constraints: {
        maxWordCount: input.targetWordCount,
        preserveFactualContent: input.constraints.prohibitNewFacts,
      },
    }),
    // Generate 2-3 variants with different techniques
  ]);

  // 3. Post-process and validate
  const candidates = results.map((result, idx) => {
    const factCheckResult = validateFactualGrounding(
      result.text,
      input.originalText,
      input.reflectionAnswers
    );

    return {
      text: result.text,
      predictedNQI: result.predictedScore || 0,
      keyStrengths: extractStrengths(result),
      provenance: identifyProvenance(result, input.reflectionAnswers, idx),
      flagForHumanReview: factCheckResult.hasNewFacts,
      techniqueUsed: result.technique,
    };
  });

  return {
    candidates: candidates.slice(0, 3), // Max 3
    metadata: {
      model: "claude-3-5-sonnet",
      generationTime: Date.now(),
      seedUsed: "user_reflection",
    },
  };
}

function validateFactualGrounding(
  generatedText: string,
  originalText: string,
  reflectionAnswers: string[]
): { hasNewFacts: boolean; newFactExamples: string[] } {
  // CRITICAL: Check for numbers, names, places, claims not in original or reflections
  // Use lightweight NER or keyword extraction
  // Return true if suspicious new content detected
}

function identifyProvenance(
  result: EssayGenerationResult,
  reflectionAnswers: string[],
  idx: number
): string {
  // Match generated content to specific reflection answer
  // E.g., "Based on your answer about the inventory system"
}

// ... helper functions
```

**Testing**:
- Unit tests with mocked generator responses
- Fact-check validation tests: Ensure no hallucinated details
- Quality tests: Generated candidates meet minimum NQI thresholds
- Diversity tests: 3 candidates should have distinct approaches/techniques

### 5.3 Context Adapter

**Purpose**: Pull user profile data to enrich entry context

```typescript
// /src/core/workshop/adapters/contextAdapter.ts

export interface UserContext {
  userId: string;
  role?: string;                      // e.g., "Founder", "Captain", "Tutor"
  timeCommitment?: string;            // e.g., "10 hrs/week", "Summer 2023"
  relatedEssays?: string[];           // Other essays that mention this activity
  activityType?: string;              // e.g., "Community Service", "Research"
  profileStrength?: "spike" | "balanced";
}

export async function fetchUserContext(
  userId: string,
  activityId: string
): Promise<UserContext> {
  // Query user profile service
  // Return relevant context for this specific activity
  // Gracefully handle missing data
}
```

---

## 6. Workshop Orchestrator

**Purpose**: Coordinate the full multi-step workflow

```typescript
// /src/core/workshop/workshopOrchestrator.ts

import { evaluateEntry, GraderOutput } from "./adapters/graderAdapter";
import { generateRewriteCandidates } from "./adapters/generatorAdapter";
import { fetchUserContext } from "./adapters/contextAdapter";
import { TeachingEngine } from "./teachingEngine";
import { VersionManager } from "./versionManager";

export interface WorkshopSession {
  sessionId: string;
  userId: string;
  entryId: string;
  currentDraft: string;
  versionHistory: DraftVersion[];
  issues: Issue[];
  reflectionAnswers: Map<string, string>;
  progressMetrics: ProgressMetrics;
  state: SessionState;
}

export type SessionState =
  | "intake"
  | "diagnosis"
  | "teaching"
  | "reflection"
  | "rewrite"
  | "regrade"
  | "complete";

export interface DraftVersion {
  versionId: string;
  text: string;
  timestamp: Date;
  nqi: number;
  changeDescription: string;
}

export interface ProgressMetrics {
  initialNQI: number;
  currentNQI: number;
  iterationCount: number;
  dimensionDeltas: Record<string, number>;
  resolvedIssues: string[];
  remainingIssues: string[];
}

export class WorkshopOrchestrator {
  private teachingEngine: TeachingEngine;
  private versionManager: VersionManager;

  constructor() {
    this.teachingEngine = new TeachingEngine();
    this.versionManager = new VersionManager();
  }

  /**
   * Initialize a new workshop session
   */
  async startSession(
    userId: string,
    entryText: string,
    entryId?: string
  ): Promise<WorkshopSession> {
    const sessionId = generateSessionId();

    // 1. Fetch user context
    const userContext = entryId
      ? await fetchUserContext(userId, entryId)
      : undefined;

    // 2. Initial diagnosis
    const graderOutput = await evaluateEntry({
      entryText,
      context: userContext,
    });

    // 3. Initialize session
    const session: WorkshopSession = {
      sessionId,
      userId,
      entryId: entryId || `new_${sessionId}`,
      currentDraft: entryText,
      versionHistory: [
        {
          versionId: "v0",
          text: entryText,
          timestamp: new Date(),
          nqi: graderOutput.nqi,
          changeDescription: "Original entry",
        },
      ],
      issues: graderOutput.issues,
      reflectionAnswers: new Map(),
      progressMetrics: {
        initialNQI: graderOutput.nqi,
        currentNQI: graderOutput.nqi,
        iterationCount: 0,
        dimensionDeltas: {},
        resolvedIssues: [],
        remainingIssues: graderOutput.issues.map((i) => i.type),
      },
      state: "diagnosis",
    };

    return session;
  }

  /**
   * Get teaching content for current issues
   */
  async getTeachingUnits(session: WorkshopSession): Promise<TeachingUnit[]> {
    return this.teachingEngine.generateTeachingUnits(session.issues);
  }

  /**
   * Generate adaptive guided questions based on issues
   */
  async getGuidedQuestions(session: WorkshopSession): Promise<Question[]> {
    return this.teachingEngine.selectAdaptiveQuestions(
      session.issues,
      session.currentDraft,
      session.reflectionAnswers
    );
  }

  /**
   * Handle micro-prompt submission (fragment rewrite)
   */
  async handleMicroPrompt(
    session: WorkshopSession,
    issueType: IssueType,
    userRewrite: string,
    originalSpan: EvidenceSpan
  ): Promise<MicroPromptFeedback> {
    // 1. Extract context around the span
    const contextWindow = extractContext(
      session.currentDraft,
      originalSpan,
      50 // chars before/after
    );

    // 2. Evaluate just this fragment
    const fragmentEval = await evaluateEntry({
      entryText: contextWindow.before + userRewrite + contextWindow.after,
    });

    // 3. Compare to original fragment score
    const originalFragmentEval = await evaluateEntry({
      entryText: contextWindow.before + originalSpan.text + contextWindow.after,
    });

    const delta = fragmentEval.nqi - originalFragmentEval.nqi;

    return {
      improved: delta > 0,
      delta,
      feedback: generateMicroFeedback(delta, issueType, userRewrite),
      suggestedRevision: delta < 0 ? suggestImprovement(userRewrite, issueType) : undefined,
    };
  }

  /**
   * Generate rewrite candidates using essay generator
   */
  async generateDrafts(session: WorkshopSession): Promise<GeneratedCandidate[]> {
    const reflectionAnswers = Array.from(session.reflectionAnswers.values());

    const generatorOutput = await generateRewriteCandidates({
      originalText: session.currentDraft,
      reflectionAnswers,
      constraints: {
        targetWordCount: session.currentDraft.split(/\s+/).length,
        prohibitNewFacts: true, // CRITICAL
        focusDimensions: session.issues.map((i) => mapIssueToDimension(i.type)),
        preserveVoice: true,
      },
      targetTier: determineTargetTier(session.progressMetrics.initialNQI),
    });

    return generatorOutput.candidates;
  }

  /**
   * Regrade current draft and compute deltas
   */
  async regradeAndCompare(session: WorkshopSession): Promise<RegradeResult> {
    // 1. Get latest version from history
    const previousVersion = session.versionHistory[session.versionHistory.length - 1];

    // 2. Evaluate current draft
    const currentEval = await evaluateEntry({
      entryText: session.currentDraft,
    });

    // 3. Compute deltas
    const dimensionDeltas: Record<string, number> = {};
    for (const [dim, score] of Object.entries(currentEval.dimensionScores)) {
      const prevScore = await getPreviousDimensionScore(previousVersion.text, dim);
      dimensionDeltas[dim] = score - prevScore;
    }

    // 4. Identify what improved and what still needs work
    const improvements = Object.entries(dimensionDeltas)
      .filter(([_, delta]) => delta >= 2)
      .map(([dim, delta]) => ({ dimension: dim, delta }));

    const stillNeeds = currentEval.issues.filter(
      (issue) => !session.progressMetrics.resolvedIssues.includes(issue.type)
    );

    return {
      currentNQI: currentEval.nqi,
      previousNQI: previousVersion.nqi,
      delta: currentEval.nqi - previousVersion.nqi,
      dimensionDeltas,
      improvements,
      stillNeedsWork: stillNeeds,
      commentary: generateRegradeCommentary(improvements, stillNeeds),
    };
  }

  /**
   * Save a new version to history
   */
  async saveVersion(
    session: WorkshopSession,
    newDraft: string,
    changeDescription: string
  ): Promise<void> {
    const newEval = await evaluateEntry({ entryText: newDraft });

    const newVersion: DraftVersion = {
      versionId: `v${session.versionHistory.length}`,
      text: newDraft,
      timestamp: new Date(),
      nqi: newEval.nqi,
      changeDescription,
    };

    session.versionHistory.push(newVersion);
    session.currentDraft = newDraft;
    session.progressMetrics.currentNQI = newEval.nqi;
    session.progressMetrics.iterationCount += 1;

    // Update issues
    session.issues = newEval.issues;
    updateResolvedIssues(session);
  }

  /**
   * Check if session meets completion criteria
   */
  shouldComplete(session: WorkshopSession): boolean {
    const nqiThreshold = 75; // Configurable
    const maxIterations = 5;

    return (
      session.progressMetrics.currentNQI >= nqiThreshold ||
      session.progressMetrics.iterationCount >= maxIterations ||
      session.issues.length === 0
    );
  }

  /**
   * Generate learning summary for the session
   */
  generateLearningSummary(session: WorkshopSession): string {
    const improvements = Object.entries(session.progressMetrics.dimensionDeltas)
      .filter(([_, delta]) => delta >= 2)
      .map(([dim, delta]) => `${dim} (+${delta})`)
      .join(", ");

    const resolvedCount = session.progressMetrics.resolvedIssues.length;
    const iterations = session.progressMetrics.iterationCount;

    return `In ${iterations} iterations, you improved your NQI from ${session.progressMetrics.initialNQI} to ${session.progressMetrics.currentNQI} (+${session.progressMetrics.currentNQI - session.progressMetrics.initialNQI}). Key improvements: ${improvements}. You resolved ${resolvedCount} issues and learned to ${getKeyTakeaway(session)}.`;
  }
}

// ... helper functions and types
```

---

## 7. Testing Strategy

### 7.1 Test Suite Structure

```
tests/
├── unit/
│   ├── adapters/
│   │   ├── graderAdapter.test.ts
│   │   ├── generatorAdapter.test.ts
│   │   └── contextAdapter.test.ts
│   ├── teachingEngine.test.ts
│   ├── workshopOrchestrator.test.ts
│   ├── microPromptHandler.test.ts
│   └── versionManager.test.ts
├── integration/
│   ├── fullWorkshopFlow.test.ts
│   ├── iterativeImprovement.test.ts
│   └── generatorIntegration.test.ts
├── golden/
│   ├── goldeneExamples.json           # 50 seed entries with expected outputs
│   ├── issueDetection.test.ts        # Validate issue extraction
│   └── scoringConsistency.test.ts    # Validate NQI calculation
├── behavioral/
│   ├── fixStrategies.test.ts         # Validate 2-3 strategies per issue
│   ├── reflectionQuestions.test.ts   # Validate adaptive question selection
│   └── deltaVisualization.test.ts    # Validate regrade improvements
├── humanEval/
│   ├── nightly/
│   │   └── sampleOutputs.ts          # Generate N=30 for human review
│   └── reviewPipeline.ts             # Collect labels, compute agreement
└── fixtures/
    ├── mockGraderResponses.json
    ├── mockGeneratorResponses.json
    └── seedEntries.json               # Strong/weak/short/international
```

### 7.2 Unit Tests

**Coverage Target**: ≥90% for logic layers

**Key Test Cases**:

```typescript
// tests/unit/adapters/graderAdapter.test.ts

describe("GraderAdapter", () => {
  describe("evaluateEntry", () => {
    it("should extract issues from analysis report", async () => {
      const input = { entryText: "Helped at local shelter" };
      const output = await evaluateEntry(input);

      expect(output.issues).toHaveLength(3);
      expect(output.issues[0].type).toBe("generic_language");
      expect(output.issues[0].confidence).toBeGreaterThan(0.7);
    });

    it("should prioritize issues by pedagogical importance", async () => {
      const input = { entryText: "I was involved in volunteering" };
      const output = await evaluateEntry(input);

      // Generic language should come before weak verbs
      expect(output.issues[0].type).toBe("generic_language");
      expect(output.issues[1].type).toBe("passive_voice");
    });

    it("should extract evidence spans with correct indices", async () => {
      const input = { entryText: "I helped coordinate various events for the club" };
      const output = await evaluateEntry(input);

      const span = output.evidence.find((e) => e.text === "helped");
      expect(span).toBeDefined();
      expect(span.startIdx).toBe(2);
      expect(span.endIdx).toBe(8);
    });

    it("should handle very short entries gracefully", async () => {
      const input = { entryText: "Tutored kids" };
      const output = await evaluateEntry(input);

      expect(output.nqi).toBeLessThan(40);
      expect(output.issues).toContainEqual(
        expect.objectContaining({ type: "missing_quantification" })
      );
    });
  });
});
```

```typescript
// tests/unit/workshopOrchestrator.test.ts

describe("WorkshopOrchestrator", () => {
  let orchestrator: WorkshopOrchestrator;

  beforeEach(() => {
    orchestrator = new WorkshopOrchestrator();
  });

  describe("startSession", () => {
    it("should initialize session with diagnosis", async () => {
      const session = await orchestrator.startSession(
        "user123",
        "Volunteered at shelter helping animals"
      );

      expect(session.state).toBe("diagnosis");
      expect(session.issues.length).toBeGreaterThan(0);
      expect(session.progressMetrics.initialNQI).toBeDefined();
    });
  });

  describe("handleMicroPrompt", () => {
    it("should provide positive feedback for improved rewrite", async () => {
      const session = await orchestrator.startSession(
        "user123",
        "Helped at shelter"
      );

      const feedback = await orchestrator.handleMicroPrompt(
        session,
        "generic_language",
        "Coordinated intake for 40+ animals per weekend",
        { text: "Helped", startIdx: 0, endIdx: 6, reason: "generic" }
      );

      expect(feedback.improved).toBe(true);
      expect(feedback.delta).toBeGreaterThan(0);
      expect(feedback.feedback).toContain("Specificity");
    });
  });

  describe("shouldComplete", () => {
    it("should complete when NQI threshold met", () => {
      const session = createMockSession({ currentNQI: 80 });
      expect(orchestrator.shouldComplete(session)).toBe(true);
    });

    it("should complete when max iterations reached", () => {
      const session = createMockSession({ iterationCount: 5 });
      expect(orchestrator.shouldComplete(session)).toBe(true);
    });

    it("should not complete if issues remain and NQI below threshold", () => {
      const session = createMockSession({
        currentNQI: 60,
        iterationCount: 2,
        issuesRemaining: 2,
      });
      expect(orchestrator.shouldComplete(session)).toBe(false);
    });
  });
});
```

### 7.3 Integration Tests

**Goal**: Validate end-to-end flows with real (or stubbed) grader/generator services

```typescript
// tests/integration/fullWorkshopFlow.test.ts

describe("Full Workshop Flow", () => {
  it("should complete a full session from intake to completion", async () => {
    const orchestrator = new WorkshopOrchestrator();

    // 1. Start session
    const session = await orchestrator.startSession(
      "user123",
      "Tutored students in math"
    );
    expect(session.issues.length).toBeGreaterThan(0);

    // 2. Get teaching units
    const teachingUnits = await orchestrator.getTeachingUnits(session);
    expect(teachingUnits.length).toBe(session.issues.length);

    // 3. Answer guided questions
    session.reflectionAnswers.set("q1", "I tutored 8 ESL students using visual diagrams");
    session.reflectionAnswers.set("q2", "One student improved from D to B+ in one semester");
    session.reflectionAnswers.set("q3", "I learned to adapt teaching to language barriers");

    // 4. Generate drafts
    const candidates = await orchestrator.generateDrafts(session);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].predictedNQI).toBeGreaterThan(session.progressMetrics.initialNQI);

    // 5. Select and save a candidate
    await orchestrator.saveVersion(session, candidates[0].text, "Applied generated draft");

    // 6. Regrade and check improvement
    const regradeResult = await orchestrator.regradeAndCompare(session);
    expect(regradeResult.delta).toBeGreaterThan(10);

    // 7. Check if complete
    expect(orchestrator.shouldComplete(session)).toBe(true);
  });
});
```

### 7.4 Golden Tests

**Goal**: Canonical examples that must pass consistently

```typescript
// tests/golden/issueDetection.test.ts

const GOLDEN_EXAMPLES = [
  {
    entry: "Volunteered at local animal shelter",
    expectedIssues: ["generic_language", "missing_quantification"],
    minNQI: 20,
    maxNQI: 35,
  },
  {
    entry: "Founded Code for Change: taught 15 underserved students Python, built inventory system cutting food waste 30%, secured $5K grant",
    expectedIssues: [], // Should detect minimal issues
    minNQI: 75,
    maxNQI: 90,
  },
  // ... 48 more examples
];

describe("Golden Issue Detection", () => {
  GOLDEN_EXAMPLES.forEach((example) => {
    it(`should detect ${example.expectedIssues.join(", ")} in: "${example.entry}"`, async () => {
      const output = await evaluateEntry({ entryText: example.entry });

      expect(output.nqi).toBeGreaterThanOrEqual(example.minNQI);
      expect(output.nqi).toBeLessThanOrEqual(example.maxNQI);

      const detectedTypes = output.issues.map((i) => i.type);
      example.expectedIssues.forEach((expected) => {
        expect(detectedTypes).toContain(expected);
      });
    });
  });
});
```

### 7.5 Human Evaluation Pipeline

**Nightly Run**:
1. Generate N=30 random rewrites from test seed set
2. Export to CSV with columns: `original | generated | nqi_delta | human_rating`
3. Human reviewers rate each: `accept | modify | reject`
4. Compute inter-rater agreement (Cohen's κ)
5. Track acceptance rate over time
6. Flag low-agreement examples for review

**Target Metrics**:
- Acceptance rate: ≥80%
- Inter-rater agreement: κ ≥ 0.6

```typescript
// tests/humanEval/nightly/sampleOutputs.ts

export async function generateNightlySample(count: number = 30) {
  const seedEntries = loadSeedEntries();
  const samples = [];

  for (let i = 0; i < count; i++) {
    const entry = seedEntries[i % seedEntries.length];

    const session = await orchestrator.startSession("test_user", entry);
    session.reflectionAnswers.set("q1", "Sample reflection answer");

    const candidates = await orchestrator.generateDrafts(session);
    const selected = candidates[0];

    samples.push({
      original: entry,
      generated: selected.text,
      nqiDelta: selected.predictedNQI - session.progressMetrics.initialNQI,
      humanRating: "", // To be filled by reviewer
      timestamp: new Date().toISOString(),
    });
  }

  writeCSV("nightly_samples.csv", samples);
}
```

---

## 8. Acceptance Criteria & Checkpoints

### Phase 0 — Discovery & Planning ✅

**Deliverables**:
- [x] `found_services.md` — Codebase mapping report (COMPLETED: CODEBASE-MAPPING.md)
- [x] Adapter interface specifications (COMPLETED: Section 5)
- [x] Mock adapter unit tests (SPECIFIED: Section 7.2)

**Human Checkpoint Questions**:
1. Do the proposed adapter interfaces correctly map to existing services?
2. Are there any missing services or integration points?
3. Approve the issue type taxonomy (8 types defined)?
4. Approve the pedagogical flow (7-step workflow)?

**Decision Required**: Proceed to Phase 1?

---

### Phase 1 — Core Teaching Engine & UI Prototype

**Deliverables**:
- Teaching Engine module with example corpus (50 human-written pairs)
- Issue detection and prioritization logic
- Teaching Unit component (UI mock or functional)
- Main editor with inline highlighting (UI mock or functional)
- Adapter integration glue (graderAdapter, generatorAdapter, contextAdapter)
- Unit tests for all adapters and teaching engine (≥90% coverage)
- Integration tests with mocked services (5 golden flows)

**Demo Requirements**:
- Show 5 example flows:
  1. Strong entry (NQI 85+) → Minimal issues detected
  2. Weak entry (NQI <40) → 3 issues flagged with teaching units
  3. Generic entry (NQI 50-60) → Micro-prompt improvement flow
  4. Short entry (<15 words) → Graceful handling
  5. International/non-traditional entry → Cultural sensitivity

**Tests**:
- All unit tests passing
- 5 integration flows complete successfully
- Coverage report: ≥90% on adapters and teaching engine

**Human Checkpoint Questions**:
1. Are the teaching units clear, concise, and pedagogically effective?
2. Do the example pairs feel authentic and diverse?
3. Is the issue prioritization sensible?
4. Approve the UI layout and interaction flows?

**Decision Required**: Proceed to Phase 2?

---

### Phase 2 — Generator Integration & Iteration Loop

**Deliverables**:
- Generator adapter with fact-checking validation
- Reflection module with adaptive question selection
- Rewrite assist UI (inline hints + generate drafts)
- Regrade engine with delta visualization
- Version manager with history tracking
- Full orchestrator with iteration loop
- Golden tests (50 seed entries with expected outputs)
- Human-eval sample generation (N=30)

**Demo Requirements**:
- End-to-end session: Intake → Teach → Reflect → Generate → Regrade → Accept
- Show fact-checking: Flag generated text with hallucinated details
- Show iteration: User improves draft 3 times, issues reduce from 3→1→0
- Show delta visualization: Clear before/after comparison with commentary

**Tests**:
- All unit + integration tests passing
- 50 golden tests pass consistently
- Human-eval sample N=30 generated, reviewed by 2 human raters
- Acceptance rate: ≥80%
- Cohen's κ: ≥0.6

**Human Checkpoint Questions**:
1. Are generated drafts grounded in user input (no hallucinations)?
2. Is the iteration loop intuitive and not overwhelming?
3. Are the reflection questions effective at drawing out deeper content?
4. Approve the regrade commentary and delta visualization?
5. Approve the synthetic example labeling policy?

**Decision Required**: Proceed to Phase 3?

---

### Phase 3 — Hardening & Launch Prep

**Deliverables**:
- Full UI implementation (all components functional)
- Version history UI with restore capability
- Nightly human-eval pipeline (automated)
- CLI run loop: `./run_workshop_cycle --dry-run --max-iter 5`
- Performance optimizations (target: <5s roundtrip for regrade)
- Fuzzing tests (malformed input, emoji, non-English, extremely long)
- Regression test suite (protect against breaking changes)
- Documentation: User guide, developer guide, API reference

**Tests**:
- Full suite green (unit + integration + golden + behavioral + fuzzing)
- Performance SLA met: 95th percentile roundtrip <5s
- Human-eval pipeline runs nightly, acceptance rate tracked
- Regression tests prevent breaking changes

**Demo Requirements**:
- Production-ready UI demo with real user data
- Show version history and restore functionality
- Show learning summary at session completion
- Show metrics dashboard (NQI deltas, acceptance rates, issue resolution)

**Human Checkpoint Questions**:
1. Is the system production-ready?
2. Are all edge cases handled gracefully?
3. Is the human-eval pipeline sustainable (manageable review burden)?
4. Approve the documentation and onboarding materials?
5. Final sign-off to ship to staging?

**Decision Required**: Ship to staging?

---

## 9. Metrics & Success Signals

### 9.1 Operational Metrics

**Primary Metrics** (track per session):
- **Reflection Score Delta**: Average improvement in reflection dimension (target: +1.5)
- **NQI Delta**: Average improvement in overall NQI (target: +15)
- **Iteration Count**: Median iterations to acceptable draft (target: ≤3)
- **Completion Rate**: % of started sessions that reach "complete" state (target: ≥70%)
- **Final Adoption Rate**: % of users who keep a workshop-improved version (target: ≥60%)

**Quality Metrics**:
- **Human Acceptance Rate**: % of generated/improved entries rated "accept" by reviewers (target: ≥80%)
- **Fact-Check Flag Rate**: % of generated drafts flagged for hallucinations (target: <5%)
- **Inter-Rater Agreement**: Cohen's κ on human-eval samples (target: ≥0.6)

**Engagement Metrics**:
- **Teaching Unit Interaction**: % of sessions where user reads ≥2 teaching units
- **Reflection Completion**: % of sessions where user answers all 3 guided questions
- **Micro-Prompt Usage**: Average micro-prompts submitted per session
- **Generator Usage**: % of sessions where user requests generated drafts

### 9.2 Diagnostic Dashboards

**For Developers**:
- Issue detection accuracy (precision/recall per issue type)
- Regrade consistency (test-retest reliability)
- Performance latency (p50, p95, p99 for each service call)
- Error rates (adapter failures, generator timeouts, etc.)

**For Product/UX**:
- Drop-off points (where do users abandon the workshop?)
- Most improved dimensions (which fix strategies work best?)
- Most common unresolved issues (what's still hard to fix?)
- Time-to-completion distribution

---

## 10. Guardrails & Safety Policies

### 10.1 Content Safety

**Human Example Corpus**:
- All human-written examples reviewed by 2+ reviewers
- Label provenance: "human_reviewed" vs. "synthetic_pending_review"
- Prioritize human examples; use synthetic only to fill gaps

**Generated Content**:
- Fact-checking: Flag any generated text with new people, numbers, places, claims
- Mark flagged candidates: "Needs human approval before using"
- Provenance tracking: Every suggestion traces to a detector rule, example, or generator prompt

**User-Facing Language**:
- All teaching unit explanations, fix strategies, micro-prompts reviewed by pedagogy expert
- Tone: Mentor-like, concise, encouraging (not preachy or robotic)
- Avoid jargon; define terms inline (e.g., "Specificity (concrete details that help readers visualize)")

### 10.2 Change Management

**Core Rubric Changes**:
- STOP for human approval before changing dimension weights, scoring logic, or interaction rules
- Document rationale in `workshop_changelog.md`
- Run A/B test on validation set (N≥200) before merging

**Example Corpus Changes**:
- New examples must pass review checklist:
  - Authentic voice?
  - Culturally sensitive?
  - Clear improvement in target dimension?
  - Appropriate length?
- Batch review: Approve 10+ examples at once, not one-by-one

**Teaching Content Changes**:
- Changes to "Why It Matters" explanations require pedagogy expert review
- Changes to fix strategies require A/B test showing improved user outcomes

---

## 11. Implementation Roadmap

### Week 1: Phase 0 — Discovery & Planning
- **Day 1-2**: Finalize adapter interfaces and mock tests
- **Day 3**: Human checkpoint review
- **Day 4-5**: Incorporate feedback, revise specs

### Week 2-3: Phase 1 — Core Teaching Engine
- **Day 6-8**: Build teaching engine + example corpus (50 pairs)
- **Day 9-11**: Build adapters and integration glue
- **Day 12-14**: Build UI prototype (issue cards, main editor, teaching unit)
- **Day 15**: Write unit + integration tests
- **Day 16**: Demo 5 example flows
- **Day 17**: Human checkpoint review

### Week 4-5: Phase 2 — Generator Integration
- **Day 18-20**: Build generator adapter + fact-checking
- **Day 21-22**: Build reflection module + adaptive questions
- **Day 23-24**: Build regrade engine + delta visualization
- **Day 25-26**: Build full orchestrator + iteration loop
- **Day 27-28**: Golden tests (50 seed entries)
- **Day 29**: Generate human-eval sample (N=30)
- **Day 30**: Collect human reviews, compute metrics
- **Day 31**: Human checkpoint review

### Week 6-7: Phase 3 — Hardening & Launch
- **Day 32-35**: Full UI implementation (all components)
- **Day 36-37**: Nightly human-eval pipeline + CLI run loop
- **Day 38-39**: Performance optimization + fuzzing tests
- **Day 40-41**: Regression tests + documentation
- **Day 42**: Final demo
- **Day 43**: Human checkpoint review
- **Day 44-45**: Address feedback, final polish
- **Day 46**: Ship to staging

---

## 12. Open Questions & Decisions Needed

### 12.1 For Human Review (Phase 0)

1. **Adapter Interfaces**: Do the proposed interfaces correctly map to existing services? Any missing methods or parameters?

2. **Issue Taxonomy**: Are the 8 issue types comprehensive? Should we add/remove any?
   - Current: generic_language, missing_quantification, weak_verbs, passive_voice, missing_reflection, list_structure, cliches, telling_not_showing

3. **Teaching Unit Content**: Who will write the initial 50 human example pairs? Internal team, contractors, or crowdsourced?

4. **Human Eval Pipeline**: Who will be the human reviewers for nightly samples? What's the review SLA (24h, 48h)?

5. **Generator Constraints**: Should we prohibit ALL new facts, or allow minor elaborations if clearly marked?

6. **Version History Limit**: Is 10 versions per session sufficient, or should we increase?

7. **Completion Criteria**: Is NQI 75+ the right threshold, or should it vary by user tier (high school junior vs. senior)?

8. **Tone & Voice**: Review sample teaching unit explanations (Appendix A) — do they match the desired tone?

---

## 13. Appendices

### Appendix A: Sample Teaching Unit Content

**Issue: Generic Language**

> **Why It Matters**
> Admissions readers evaluate hundreds of entries. Generic phrases like "made a difference" or "helped people" don't create mental images or demonstrate your specific impact. Specificity helps readers visualize your work and remember you.
>
> **Your Current Text**
> "Volunteered at local shelter helping with various tasks"
> ↑ Flagged: "helping" and "various tasks" are too vague.
>
> **Before & After Example**
> **Weak**: Volunteered at local animal shelter helping with various tasks
> **Strong**: Redesigned the shelter's intake form, cutting processing time from 45 to 12 minutes and enabling staff to onboard 3x more animals per weekend
>
> **Fix Strategies**
> 1. **Metric-anchored**: Add numbers (how many, how often, what scale)
>    Example: "Tutored 8 students, 2 hours/week for 6 months"
>
> 2. **Anecdote**: Show one specific moment illustrating your approach
>    Example: "One student told me my visual method finally made quadratics 'click' after 2 years of confusion"
>
> 3. **Outcome**: Lead with the concrete result, then explain the action
>    Example: "Raised $8,000 for refugee families by converting our school's talent show into a ticketed benefit concert"
>
> **Try This**
> Rewrite your current sentence to include ONE specific metric or outcome. What number, frequency, or measurable result can you add?
> [Input box] → [Submit & Regrade]

---

### Appendix B: Sample Guided Questions (with rationale)

**Question**: "What is ONE specific action you took that someone else in your role might NOT have done?"

**Rationale**: Prompts differentiation and ownership. Moves user from generic duties to unique contributions.

**Example User Answer**: "Instead of just grading homework like other TAs, I held optional 'office hours' at the library every Friday where students could work through problems together."

**How Workshop Uses This**: The generator can now emphasize the Friday office hours as a unique initiative, not just "TA duties."

---

**Question**: "Who specifically benefited from this action and how did their experience change?"

**Rationale**: Elicits concrete impact and human connection. Moves user from abstract "helped people" to specific beneficiaries.

**Example User Answer**: "Three students who were failing told me they finally understood derivatives after my visual method. One, Maria, improved from D to A- by midterms."

**How Workshop Uses This**: The generator can weave in Maria's story as evidence of impact, adding authenticity and memorability.

---

**Question**: "What was the hardest part of this work, and what did you do when Plan A failed?"

**Rationale**: Surfaces challenge, resilience, and problem-solving. Moves user from polished results to authentic struggle.

**Example User Answer**: "The hardest part was getting students to show up. My first few sessions had zero attendance. I started offering free snacks and sending personalized texts — eventually we had 12 regulars."

**How Workshop Uses This**: The generator can build a narrative arc: initial failure → adaptation → eventual success. This adds depth and vulnerability.

---

### Appendix C: Fact-Checking Validation Logic

**Goal**: Detect when generator introduces new claims not grounded in user input.

**Approach**:
1. Extract named entities (people, places, orgs, numbers) from original entry + reflection answers
2. Extract named entities from generated text
3. Flag any entity in generated text NOT in original/reflection set
4. Review common false positives (e.g., "students" generalizing to "15 students" may be acceptable if context implies quantity)

**Example**:

```typescript
function validateFactualGrounding(
  generatedText: string,
  originalText: string,
  reflectionAnswers: string[]
): { hasNewFacts: boolean; newFactExamples: string[] } {

  const originalEntities = extractEntities([originalText, ...reflectionAnswers]);
  const generatedEntities = extractEntities([generatedText]);

  const newEntities = generatedEntities.filter(
    (e) => !originalEntities.has(e.text.toLowerCase())
  );

  // Filter out acceptable elaborations
  const suspiciousNew = newEntities.filter((e) => {
    // Allow general → specific if original implies it
    if (e.type === "CARDINAL" && originalText.includes("students")) return false;
    // Allow time expressions if original has timeframe
    if (e.type === "DATE" && originalText.match(/year|semester|month/)) return false;
    // Flag everything else
    return true;
  });

  return {
    hasNewFacts: suspiciousNew.length > 0,
    newFactExamples: suspiciousNew.map((e) => e.text),
  };
}
```

---

### Appendix D: Regrade Commentary Templates

**For Significant Improvement (delta ≥ +15)**:
> "Excellent progress! Your NQI improved from {prev} to {curr} (+{delta}). The specificity boost (e.g., '{quote}') really helps readers visualize your impact. Consider adding one line about how this experience shaped your current interests to strengthen the reflection dimension."

**For Moderate Improvement (delta +5 to +14)**:
> "Good work! Your entry improved from {prev} to {curr} (+{delta}). The added details in '{quote}' make your role clearer. To reach the next level, try showing (not telling) your personal growth — what changed in how you think or act?"

**For Minimal Improvement (delta 0 to +4)**:
> "Your changes are a step forward, but there's still room to grow. Focus on: {remainingIssue1}, {remainingIssue2}. Review the teaching unit for '{topIssue}' and try the {suggestedStrategy} strategy."

**For Regression (delta < 0)**:
> "This version scored lower ({delta}) than your previous draft. The issue: {reason}. Let's revert to version {prevVersion} and try a different approach. Would you like to explore the '{issueType}' teaching unit for guidance?"

---

## 14. Summary & Next Steps

This design document specifies a **comprehensive, pedagogically-driven workshop experience** that:

1. ✅ **Discovers and integrates** existing Narrative Grader and Essay Generator services via thin adapters
2. ✅ **Teaches, not just fixes** with issue-specific teaching units, human-written examples, and adaptive questions
3. ✅ **Offers multiple pathways** with 2-3 diverse fix strategies per issue
4. ✅ **Iterates reliably** with regrade, delta visualization, and version management
5. ✅ **Tests rigorously** with unit, integration, golden, and human-eval pipelines
6. ✅ **Checkpoints at every phase** to ensure human oversight and quality

**Immediate Next Steps** (Phase 0 Checkpoint):

1. **Human Review**: Stakeholders review this document and answer the 12 open questions (Section 12.1)
2. **Approval**: Sign off on adapter interfaces, issue taxonomy, pedagogical flow, and roadmap
3. **Resource Allocation**: Assign developers, reviewers, pedagogy experts, and timeline
4. **Kick off Phase 1**: Build core teaching engine and UI prototype

**Estimated Timeline**: 6-7 weeks from Phase 0 approval to staging launch.

**Document Status**: 🟢 **Ready for Human Checkpoint Review**

---

**End of Design Document**
