# Context: Activity Workshop for Uplift

> Attach this file with every prompt. It gives Lovable everything it needs to build against our actual data and components.

---

## Prompt Navigation

- [01 — Portfolio Overview Display](./01-overview-display.md)
- [02 — Activity Carousel + Split-Pane Layout](./02-split-pane-layout.md)
- [03 — Edit Tab (Description Editor)](./03-edit-tab.md)
- [04 — Insights Tab (Teaching + Scoring)](./04-insights-tab.md)
- [05 — AI Coach Chat](./05-ai-coach.md)
- [06 — Loading, Mobile & Polish](./06-polish-states.md)

---

## What is Uplift?

Uplift is an AI-powered college application platform. Students get expert-level feedback on their applications — essays, extracurriculars, academics — using AI that thinks like a top admissions counselor.

## What is the Activity Workshop?

Students enter their extracurricular activities and our AI pipeline produces a complete portfolio analysis. The pipeline takes ~5-10 minutes and produces deeply personalized feedback across 4 stages + narrative + scoring.

**There is no HTTP endpoint yet.** Build the frontend with mock data matching the types below. We'll wire up the API later.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS, Recharts, lucide-react icons
- **Backend**: Express.js (port 8789), TypeScript
- **State**: React Query for server state, local state for UI
- **Routing**: React Router (`/activity-workshop/:sessionId`)
- **Auth**: Clerk
- **AI**: Anthropic Claude (pipeline takes ~5-10 minutes)

---

## Design Language

- **Blue/indigo primary** palette for Activity Workshop (distinct from purple PIQ and cyan Portfolio)
- **Green** = strengths, celebrations, positive feedback
- **Amber** = improvements, constructive feedback
- **Red** = high priority issues only
- **Tier badges**: Gold (T1), Blue (T2), Green (T3), Gray (T4)
- Dark mode supported via Tailwind `dark:` variants
- Cards: `shadow-sm hover:shadow-md transition-all`
- Score glow effects based on value (same pattern as PortfolioScanner)
- Smooth transitions (200ms)

---

## Existing Components to Reuse

### Workshop Layout (replicate for Activity Workshop)

**`src/pages/PIQWorkshop.tsx`** — Full page to replicate:
- Sticky `PIQCarouselNav` at top cycling through items
- Two-column grid below: left pane (editor + rubric) scrollable, right pane (sticky AI coach chat)
- Uses `ContextualWorkshopChat` with `mode="piq"`
- State: current item ID, draft text, analysis result, save status, version history
- Full database persistence and autosave

**`src/components/portfolio/piq/workshop/PIQCarouselNav.tsx`** — Carousel nav to adapt:
```typescript
interface PIQCarouselNavProps {
  currentPromptId: string;
  onPromptChange?: (promptId: string) => void;
  useRoutes?: boolean;
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
  onPrefetch?: (promptId: string) => void;
}
```
Prev/next buttons, dropdown selector, dot indicators. Adapt for activities instead of PIQ prompts.

### AI Coach Chat (reuse directly)

**`src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`**:
```typescript
interface ContextualWorkshopChatProps {
  mode?: 'extracurricular' | 'piq';
  activity: ExtracurricularItem;
  currentDraft: string;
  analysisResult: AnalysisResult | null;
  teachingCoaching: TeachingCoachingOutput | null;
  currentScore: number;
  initialScore: number;
  hasUnsavedChanges: boolean;
  needsReanalysis: boolean;
  externalMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onTriggerReanalysis?: () => void;
  userId?: string | null;
  getToken?: (options: { template: string }) => Promise<string | null>;
}
```
Set `mode="extracurricular"`. Pass activity data, analysis, teaching, scores. Handles chat UI, credit checking, conversation starters, auto-scrolling.

### Overview Display (adapt for portfolio overview)

**`src/pages/PortfolioScanner.tsx`** — Hero section to adapt:
- 5 clickable metric tiles in responsive grid (2 cols mobile, 5 cols desktop)
- `GradientText` components for animated gradient metric labels
- Score-based glow effects (colors shift based on value)
- Collapsible insights panel that opens on metric click
- Gradient background container

### Score & Loading Components

**`src/components/portfolio/piq/workshop/RandomizingScore.tsx`**:
```typescript
interface RandomizingScoreProps {
  score: number;
  isAnalyzing: boolean;
  className?: string;
}
```
Slot-machine animated score while loading, settles on final score when done.

**`src/components/portfolio/ScoreIndicator.tsx`** — Simple score display
**`src/components/portfolio/DimensionInsightCard.tsx`** — Score + strengths/growth areas
**`src/components/portfolio/InsightCard.tsx`** — Rich insight card (8 types, priority-based)
**`src/components/portfolio/ImpactMetricCard.tsx`** — Metric with sparkline and trend

### Teaching Components

**`src/components/portfolio/extracurricular/workshop/TeachingUnitCard.tsx`** — Expandable teaching card
**`src/components/portfolio/extracurricular/workshop/components/TeachingIssueCard.tsx`** — Tab-based teaching
**`src/components/portfolio/extracurricular/workshop/components/ExampleCard.tsx`** — Before/after examples

### UI Primitives (shadcn/ui — all available)

Card, Button (variants: default, outline, secondary, ghost, link, hero, premium), Badge, Tabs/TabsList/TabsTrigger/TabsContent, Progress, Popover, Tooltip, Textarea, Input, Label, GradientText (animated gradient text)

**Icons** (lucide-react): BookOpen, Lightbulb, Sparkles, CheckCircle2, AlertCircle, AlertTriangle, ChevronDown/Up/Left/Right, TrendingUp, Target, Award, Eye, MessageSquare, Copy, Star, PartyPopper, Clock, Rocket, Brain

---

## Pipeline Input

```typescript
interface ActivityWorkshopSessionInput {
  activities: Array<{
    id: string;
    title: string;
    organization?: string;
    role?: string;
    description: string;
    category: 'work' | 'volunteer' | 'school_activity' | 'project';
    hoursPerWeek: number;
    weeksPerYear: number;
    yearsInvolved?: number;
    gradeLevels?: number[];
    isPaid?: boolean;
  }>;
  studentContext?: {
    intendedMajor?: string;
    targetSchools?: string[];
    gradeLevel?: number;
    firstGen?: boolean;
    lowIncome?: boolean;
    rural?: boolean;
    hasWorkObligations?: boolean;
    workHoursPerWeek?: number;
  };
}
```

---

## Pipeline Output Reference

The pipeline returns `ActivityWorkshopPipelineResult`. Below is every section of the output, organized by which prompt uses it.

### Stage 0 — Story Detection
> Used by: [Prompt 01 — Overview](#stage-0-story-detection) (sections 2, 3, 4, 5)

```typescript
stage0: {
  narrativeIdentity: {
    archetype: 'innovator' | 'leader' | 'scholar' | 'creative' | 'advocate' | 'builder' | 'competitor' | 'explorer' | 'caretaker' | 'polymath';
    archetypeConfidence: number; // 0-100
    storyEssence: string;       // 1-2 sentence identity summary
    primaryTheme: string;
    secondaryThemes: string[];
  };

  spikeHypothesis: {
    likelySpike: boolean;
    spikeArea?: string;
    spikeActivityIds: string[];
    maturity: 'mature' | 'developing' | 'emerging' | 'absent';
    evidence: string;
  };

  contextualFactors: {
    hasWorkFamilyObligations: boolean;
    workFamilyContext?: string;          // e.g. "Works 20 hrs/week at grocery store..."
    hasResourceConstraints: boolean;
    constraintsContext?: string;          // e.g. "First-generation, low-income student..."
    hasGeographicLimitations: boolean;
    geographicContext?: string;           // e.g. "Rural context evident from farm work..."
    firstGenIndicators: boolean;
  };

  narrativeThreads: Array<{
    thread: string;                       // e.g. "Building Educational Infrastructure"
    activityIds: string[];
    strength: 'strong' | 'emerging' | 'weak';
    evidence: string;                     // paragraph explaining the thread
  }>;

  activityStoryRoles: Array<{
    activityId: string;
    storyRole: 'core_identity' | 'passion_pursuit' | 'impact_vehicle' | 'obligation' | 'skill_building' | 'exploration' | 'filler';
    centralityScore: number;              // 0-100
    roleExplanation: string;              // paragraph explaining why
  }>;
}
```

### Stage 1 — Analysis
> Used by: [Prompt 01 — Overview](#stage-1-analysis) (section 1 tier distribution), [Prompt 04 — Insights](#stage-1-analysis) (per-activity classification)

```typescript
stage1: {
  activities: Record<string, {
    activityId: string;
    classification: {
      tier: 1 | 2 | 3 | 4;
      detectedCategory: string;          // e.g. "research", "stem_leadership", "work_paid_employment"
    };
    timeInvestment: { totalHours: number };
    redFlags: Array<{ flag: string; severity: string }>;
    greenFlags: Array<{ flag: string }>;
    descriptionQuality: { issues: string[] };
  }>;

  tierDistribution: { tier1: number; tier2: number; tier3: number; tier4: number };

  teachingCandidates: {
    deepTeachingIds: string[];
    mediumTeachingIds: string[];
    quickEncouragementIds: string[];
  };

  coherenceAnalysis: {
    score: number;                        // 0-100
    primaryTheme: string;
  };
}
```

### Stage 2 — Teaching
> Used by: [Prompt 03 — Edit Tab](#stage-2-teaching) (references, recommended description), [Prompt 04 — Insights](#stage-2-teaching) (celebration, tier, strengths, improvements, narrative guidance), [Prompt 01 — Overview](#stage-2-teaching) (portfolio teaching)

```typescript
stage2: {
  // === PER-ACTIVITY TEACHING (for Insights tab + Edit tab) ===
  teachingDelivered: Array<{
    activityId: string;
    teachingDepth: 'deep' | 'medium';
    teaching: {
      activityId: string;

      celebration?: {
        headline: string;                 // The main celebration quote
        strengths: string[];              // Bullet points of what's working
        references?: Array<{
          quotedText: string;             // EXACT substring from student's description
          type: 'strength' | 'issue' | 'context';
          label: string;                  // Tooltip label e.g. "builder identity + scale"
        }>;
      };

      tierExplanation: {
        assignedTier: 1 | 2 | 3 | 4;
        explanation: string;              // Why this tier
        whatMakesThisTier: string;        // Detailed justification
        whatWouldChangeIt: string;        // How to reach higher tier
      };

      strengthTeaching: Array<{
        strength: string;                 // Strength title
        whyItMatters: { text: string };   // Paragraph explanation
        howToLeverage: string;            // Actionable advice
        references?: Array<{ quotedText: string; type: string; label: string }>;
      }>;

      improvementTeaching: Array<{
        issue: string;                    // Issue title
        priority: 'high' | 'medium' | 'low';
        whyItMatters: { text: string };   // Paragraph explanation
        howToFix: string;                 // Actionable fix
        exampleBefore: string;            // Student's current text
        exampleAfter: string;             // Improved version
        references?: Array<{ quotedText: string; type: string; label: string }>;
      }>;

      descriptionOptimization: {
        originalDescription: string;
        optimizedDescription: string;
        characterCount: number;
        changesExplained: Array<{ change: string; reason: string }>;
      };

      narrativeGuidance: {
        howToTalkAboutThis: { text: string };
        uniqueAngle: string;
        connectionToStory: string;
        interviewTips: string[];
      };
    };
  }>;

  // === QUICK ENCOURAGEMENTS (for already-strong activities) ===
  quickEncouragements: Array<{
    activityId: string;
    celebration: string;
    strengthReason: string;
    quickTip?: string;
  }>;

  // === PORTFOLIO-LEVEL TEACHING (for Overview) ===
  portfolioTeaching: {
    narrativeTeaching: {
      currentState: string;               // e.g. "Potential spike exists but not clearly presented"
      recommendation: string;
      twoSentencePitch: string;
    };
    coherenceTeaching: {
      currentScore: number;
      improvements: string[];             // e.g. "Family Farm feels disconnected from narrative..."
    };
    strategicDirection: string;           // e.g. "CS Club shows most promise as spike..."
  };
}
```

### Stage 3 — Synthesis
> Used by: [Prompt 01 — Overview](#stage-3-synthesis) (sections 1, 9, 11)

```typescript
stage3: {
  finalAssessment: {
    harvardScale: 1 | 2 | 3 | 4 | 5 | 6;    // 1=outstanding, 6=weak
    harvardScaleRationale: string;
    overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
    confidence: number;                        // 0-100
  };

  orderedActivities: Array<{
    rank: number;
    activityId: string;
    reason: string;                            // Why this rank
  }>;

  actionPlan: {
    immediate: Array<{ action: string; impact: string }>;
    shortTerm: Array<{ action: string; impact: string; deadline?: string }>;
    longTerm: Array<{ action: string; impact: string }>;
  };

  pipelineCost: {
    stage0: number;
    stage1: number;
    stage2: number;
    stage3: number;
    total: number;
  };
}
```

### Final Narrative
> Used by: [Prompt 01 — Overview](#final-narrative) (sections 6, 7, 8)

```typescript
finalNarrative?: {
  story: {
    pitch: string;                             // The compelling 2-3 sentence counselor pitch
    uniqueAngle: string;
    emergentTraits: string[];
  };

  threads: Array<{
    name: string;                              // e.g. "Technology as Community Infrastructure"
    activityIds: string[];
    synergy: string;                           // How these activities strengthen each other
  }>;

  elevations: Array<{
    elevatingActivityId: string;               // The activity doing the elevating
    elevatedActivityId: string;                // The activity being elevated
    mechanism: string;                         // How one makes the other more impressive
    strength: 'transformative' | 'strong' | 'moderate' | 'subtle';
  }>;

  coherence: {
    score: number;                             // 0-100
    assessment: string;
  };

  spike: {
    primarySpike: {
      area: string;
      activities: string[];
    };
  };
}
```

### Scoring (Optional — may be undefined)
> Used by: [Prompt 01 — Overview](#scoring) (average scores), [Prompt 04 — Insights](#scoring) (per-activity breakdown)

```typescript
scoring?: {
  portfolioRubric: {
    overallScore: { total: number; confidence: number; rationale: string };
    harvardScale: { rating: number; description: string };
    keyStrengths: string[];
    keyGaps: string[];
    metadata: {
      averageDescriptionScore: number;
      averageActivityScore: number;
    };
  };

  activityScores: Array<{
    activityId: string;
    activityTitle: string;

    combinedScore: {
      total: number;                           // 1-10 (activityScore × 0.7 + descriptionScore × 0.3)
      rationale: string;
    };

    activityScore: {
      total: number;                           // 1-10
      breakdown: {
        tierAssessment:        { score: number; weight: 0.30; tier: 1|2|3|4; rationale: string };
        recognitionLevel:      { score: number; weight: 0.25; level: string; rationale: string };
        commitmentProgression: { score: number; weight: 0.175; years: number; rationale: string };
        communityCharacter:    { score: number; weight: 0.15; rationale: string };
        leadershipImpact:      { score: number; weight: 0.125; rationale: string };
      };
    };

    descriptionScore: {
      total: number;                           // 1-10
      breakdown: {
        specificity:      { score: number; rationale: string };  // 25% weight
        impactClarity:    { score: number; rationale: string };  // 25%
        authenticityVoice: { score: number; rationale: string }; // 20%
        actionLanguage:   { score: number; rationale: string };  // 15%
        quantification:   { score: number; rationale: string };  // 15%
      };
    };

    summary: {
      oneLiner: string;
      topStrength: string;
      topImprovement: string;
    };
  }>;
}
```

---

## Key Domain Terms

| Term | Meaning |
|------|---------|
| **Tier** (1-4) | Sara Harberson admissions framework. T1 = rare/national, T4 = participation |
| **Harvard Scale** (1-6) | Overall portfolio rating. 1 = outstanding, 6 = weak |
| **Spike** | Area of exceptional depth that makes a student stand out |
| **Coherence** (0-100) | How well all activities tell one unified story |
| **Teaching depth** | deep = full analysis, medium = shorter, quick = just celebration |
| **Elevation** | How one activity makes another MORE impressive |
| **Common App limit** | 150 characters per activity description |
| **Archetype** | Student identity type: innovator, builder, advocate, etc. |
| **Narrative Thread** | A thematic connection across multiple activities |
| **Story Role** | How an activity functions in the narrative: core_identity, obligation, etc. |

---

## Real Example Data

All prompts use data from a real E2E test: a first-gen, rural student working 20 hrs/week, targeting MIT for CS, with 5 activities. See the attached `ACTIVITY_WORKSHOP_E2E_SAMPLE_OUTPUT.txt` for the full pipeline output.
