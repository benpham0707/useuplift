# Context File: Activity Workshop — Everything Lovable Needs to Know

> Attach this file with EVERY prompt. It gives Lovable the full technical context.

---

## What We're Building

An Activity Workshop page for a college application platform (Uplift). Students enter their extracurricular activities, and our AI pipeline analyzes them, teaches them how to improve, scores everything, and builds a portfolio narrative. The frontend displays all of this.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS, Recharts, lucide-react icons
- **Backend**: Express.js (port 8789), TypeScript
- **State**: React Query for server state, local state for UI
- **Routing**: React Router (`/activity-workshop/:sessionId`)
- **Auth**: Clerk
- **AI**: Anthropic Claude (responses take ~5-10 minutes for full pipeline)

## API Endpoint

The Activity Workshop pipeline does NOT have an HTTP endpoint yet. For now, build the frontend with mock data matching the types below. We'll wire up the endpoint later.

**Service entry point** (for reference):
```typescript
// src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts
class ActivityWorkshopService {
  async runPipeline(input: ActivityWorkshopSessionInput): Promise<ActivityWorkshopPipelineResult>
}
```

**Input shape:**
```typescript
interface ActivityWorkshopSessionInput {
  activities: Array<{
    id: string;
    title: string;
    organization?: string;
    role?: string;
    description: string;
    category: string;
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

**Output shape (ActivityWorkshopPipelineResult):**
```typescript
interface ActivityWorkshopPipelineResult {
  sessionId: string;
  version: string; // "4.3.0"
  totalCost: number;

  // Stage 0: Story Detection
  stage0: {
    narrativeIdentity: {
      archetype: string; // "innovator", "builder", "advocate", etc.
      archetypeConfidence: number; // 0-100
      storyEssence: string; // 1-2 sentences
      primaryTheme: string;
      secondaryThemes: string[];
    };
    spikeHypothesis: {
      spikeArea?: string;
      maturity: "mature" | "developing" | "emerging" | "absent";
    };
    contextualFactors: {
      hasWorkFamilyObligations: boolean;
      workFamilyContext?: string;
      hasResourceConstraints: boolean;
      firstGenIndicators: boolean;
    };
    narrativeThreads: Array<{
      thread: string;
      activityIds: string[];
      strength: "strong" | "emerging" | "weak";
      evidence: string;
    }>;
    activityStoryRoles: Array<{
      activityId: string;
      storyRole: "core_identity" | "passion_pursuit" | "impact_vehicle" | "obligation" | "skill_building";
      centralityScore: number; // 0-100
      roleExplanation: string;
    }>;
  };

  // Stage 1: Analysis
  stage1: {
    activities: Record<string, {
      activityId: string;
      classification: {
        tier: 1 | 2 | 3 | 4; // Sara Harberson framework
        detectedCategory: string;
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
    coherenceAnalysis: { score: number; primaryTheme: string };
  };

  // Stage 2: Teaching
  stage2: {
    teachingDelivered: Array<{
      activityId: string;
      teachingDepth: "deep" | "medium";
      teaching: {
        activityId: string;

        celebration?: {
          headline: string;
          strengths: string[];
          references?: Array<{
            quotedText: string; // exact substring from description
            type: "strength" | "issue" | "context";
            label: string;
          }>;
        };

        tierExplanation: {
          assignedTier: 1 | 2 | 3 | 4;
          explanation: string;
          whatMakesThisTier: string;
          whatWouldChangeIt: string;
        };

        strengthTeaching: Array<{
          strength: string;
          whyItMatters: { text: string };
          howToLeverage: string;
          references?: Array<{ quotedText: string; type: string; label: string }>;
        }>;

        improvementTeaching: Array<{
          issue: string;
          priority: "high" | "medium" | "low";
          whyItMatters: { text: string };
          howToFix: string;
          exampleBefore: string;
          exampleAfter: string;
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

    quickEncouragements: Array<{
      activityId: string;
      celebration: string;
      strengthReason: string;
      quickTip?: string;
    }>;

    portfolioTeaching: {
      narrativeTeaching: { currentState: string; recommendation: string; twoSentencePitch: string };
      coherenceTeaching: { currentScore: number; improvements: string[] };
      strategicDirection: string;
    };
  };

  // Stage 3: Synthesis
  stage3: {
    finalAssessment: {
      harvardScale: 1 | 2 | 3 | 4 | 5 | 6; // 1=exceptional, 6=weak
      overallStrength: "exceptional" | "strong" | "competitive" | "developing" | "needs_work";
      confidence: number; // 0-100
    };
    orderedActivities: Array<{
      rank: number;
      activityId: string;
      reason: string;
    }>;
    actionPlan: {
      immediate: Array<{ action: string; impact: string }>;
      shortTerm: Array<{ action: string; impact: string; deadline?: string }>;
      longTerm: Array<{ action: string; impact: string }>;
    };
  };

  // Narrative (single pass at end)
  finalNarrative?: {
    story: { pitch: string; uniqueAngle: string; emergentTraits: string[] };
    threads: Array<{ name: string; activityIds: string[]; synergy: string }>;
    elevations: Array<{
      elevatingActivityId: string;
      elevatedActivityId: string;
      mechanism: string;
      strength: "transformative" | "strong" | "moderate" | "subtle";
    }>;
    coherence: { score: number; assessment: string };
    spike: { primarySpike: { area: string; activities: string[] } };
  };

  // Scoring (OPTIONAL — may be undefined if batch scoring fails)
  scoring?: {
    activityScores: Array<{
      activityId: string;
      activityTitle: string;
      combinedScore: { total: number }; // 1-10
      activityScore: {
        total: number;
        breakdown: {
          tierAssessment: { score: number; weight: 0.30 };
          recognitionLevel: { score: number; weight: 0.25 };
          commitmentProgression: { score: number; weight: 0.175 };
          communityCharacter: { score: number; weight: 0.15 };
          leadershipImpact: { score: number; weight: 0.125 };
        };
      };
      descriptionScore: {
        total: number;
        breakdown: {
          specificity: { score: number }; // 25% weight
          impactClarity: { score: number }; // 25%
          authenticityVoice: { score: number }; // 20%
          actionLanguage: { score: number }; // 15%
          quantification: { score: number }; // 15%
        };
      };
    }>;
    portfolioRubric: {
      overallScore: { total: number };
      harvardScale: { rating: number; description: string };
    };
  };
}
```

## Existing Components to Reuse

**Workshop layout (from PIQ Workshop — replicate this pattern):**
```
src/pages/PIQWorkshop.tsx                          — Full page structure to copy
src/components/portfolio/piq/workshop/PIQCarouselNav.tsx — Carousel nav (adapt for activities)
src/components/portfolio/piq/workshop/PIQTabsNav.tsx    — Tab-style nav alternative
```

**AI Coach chat (reuse directly):**
```
src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx
  Props: mode, activity, currentDraft, analysisResult, currentScore, initialScore,
         hasUnsavedChanges, onTriggerReanalysis, externalMessages, onMessagesChange
  Supports: mode="extracurricular" | mode="piq"
```

**Score & insight display:**
```
src/components/portfolio/ScoreIndicator.tsx          — Simple score display
src/components/portfolio/DimensionInsightCard.tsx     — Dimension card with score + strengths/growth
src/components/portfolio/InsightCard.tsx              — Rich insight card (8 types, priority-based)
src/components/portfolio/ImpactMetricCard.tsx         — Metric with sparkline and trend
```

**Overview display (from Portfolio Scanner — adapt this pattern):**
```
src/pages/PortfolioScanner.tsx                       — Hero with 5 metric tiles, glow effects, insights panel
src/components/portfolio/HolisticPortfolioHero.tsx   — ProfileCard + overarching insights
src/components/portfolio/ProfileCard.tsx              — Card with tilt animation
```

**Teaching components:**
```
src/components/portfolio/extracurricular/workshop/TeachingUnitCard.tsx     — Expandable teaching card
src/components/portfolio/extracurricular/workshop/components/TeachingIssueCard.tsx — Tab-based teaching
src/components/portfolio/extracurricular/workshop/components/ExampleCard.tsx       — Before/after examples
```

**Workshop infrastructure:**
```
src/components/portfolio/extracurricular/workshop/HeroSection.tsx          — Workshop hero
src/components/portfolio/extracurricular/workshop/OverallScoreCard.tsx     — Score display
src/components/portfolio/extracurricular/workshop/WorkshopComplete.tsx     — Completion state
src/components/portfolio/piq/workshop/RandomizingScore.tsx                 — Animated score (loading)
```

**UI primitives (shadcn/ui — all available):**
```
Card, CardHeader, CardContent, CardTitle
Button (variants: default, destructive, outline, secondary, ghost, link, hero, premium)
Badge (variants: default, secondary, outline, destructive)
Tabs, TabsList, TabsTrigger, TabsContent
Progress
Popover, PopoverTrigger, PopoverContent
Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
Textarea, Input, Label
GradientText (animated gradient text, src/components/ui/GradientText.tsx)
```

**Icons (lucide-react):**
```
BookOpen, Lightbulb, Sparkles, CheckCircle2, AlertCircle, AlertTriangle,
ChevronDown, ChevronUp, ChevronLeft, ChevronRight, TrendingUp, Target,
Award, Eye, MessageSquare, Copy, Star, PartyPopper, Clock, Rocket, Brain
```

## Design Language

- **Blue/indigo primary** for Activity Workshop (different from purple PIQ and cyan Portfolio)
- **Green** = strengths, celebrations, positive
- **Amber** = improvements, warnings, constructive feedback
- **Red** = high priority issues only
- **Gold** = Tier 1, Blue = Tier 2, Green = Tier 3, Gray = Tier 4
- Dark mode supported via Tailwind `dark:` variants
- Cards: `shadow-sm hover:shadow-md transition-all`
- Score glow effects based on value (same pattern as PortfolioScanner)

## Key Domain Terms

- **Tier** (1-4): Sara Harberson admissions framework. Tier 1 = rare achievement, Tier 4 = participation
- **Harvard Scale** (1-6): Overall portfolio rating. 1 = outstanding, 6 = weak
- **Spike**: Area of exceptional depth/distinction
- **Coherence**: How well activities tell a unified story (0-100)
- **Teaching depth**: deep (full analysis), medium (shorter), quick (just a celebration)
- **References**: AI identifies exact substrings in descriptions for highlighting
- **Common App limit**: 150 characters per activity description
