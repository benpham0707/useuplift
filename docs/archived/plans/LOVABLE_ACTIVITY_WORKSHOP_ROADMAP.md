# Lovable Frontend Roadmap: Activity Workshop

> **Purpose**: Build the full Activity Workshop frontend — a multi-section results page that displays AI-powered analysis, teaching, scoring, and strategic guidance for a student's extracurricular activities.
>
> **Data source**: The backend returns `ActivityWorkshopPipelineResult` — a single JSON object containing all 4 pipeline stages plus scoring and narrative. See the **Data Model Reference** section at the end.
>
> **Design philosophy**: Celebration-first, teaching-focused, actionable. Every section should feel like a world-class college counselor sitting with the student.

---

## Build Order (10 Sections)

Build these in order. Each section is a self-contained component that receives a slice of the pipeline result.

| # | Section | Data Source | Priority |
|---|---------|------------|----------|
| 1 | Story Overview Card | `stage0: StoryContext` | Must-have |
| 2 | Activity Cards Grid | `stage1: AnalysisContext` | Must-have |
| 3 | Per-Activity Teaching Panels | `stage2: TeachingContext` | Must-have |
| 4 | Description Editor with Highlights | `stage2` teaching + `DescriptionReference` | Must-have |
| 5 | Scoring Dashboard | `scoring: { portfolioRubric, activityScores }` | Must-have |
| 6 | Portfolio Synthesis | `stage3: SynthesisContext` | Must-have |
| 7 | Portfolio Narrative | `finalNarrative: PortfolioNarrative` | Must-have |
| 8 | Action Plan Timeline | `stage3.actionPlan` | Should-have |
| 9 | Quick Encouragements | `stage2.quickEncouragements` | Should-have |
| 10 | Cost & Meta Footer | `totalCost`, stage metadata | Nice-to-have |

---

## Section 1: Story Overview Card

**What it shows**: The student's narrative identity — who they ARE before what they DO.

**Prompt for Lovable**:
```
Build a "Story Overview" card component that displays a student's narrative identity.

Props (from StoryContext.narrativeIdentity + spikeHypothesis + contextualFactors):
- archetype: string (e.g., "innovator", "builder", "advocate")
- archetypeConfidence: number (0-100)
- storyEssence: string (1-2 sentences)
- primaryTheme: string
- secondaryThemes: string[]
- spikeArea: string (e.g., "Computer Science & Educational Leadership")
- spikeMaturity: "mature" | "developing" | "emerging" | "absent"
- contextualFactors: {
    hasWorkFamilyObligations: boolean, workFamilyContext?: string,
    hasResourceConstraints: boolean, constraintsContext?: string,
    hasGeographicLimitations: boolean, geographicContext?: string,
    firstGenIndicators: boolean
  }
- narrativeThreads: Array<{ thread: string, activityIds: string[], strength: "strong" | "emerging" | "weak", evidence: string }>

Layout:
- Top: Large archetype badge/icon + confidence percentage
- Center: Story essence as a prominent quote/callout
- Below: Primary theme as a heading, secondary themes as tags/chips
- Spike section: Spike area with maturity indicator (color-coded dot or progress bar)
- Context badges: Show relevant constraint indicators (first-gen, work obligations, rural, etc.) as small pills — these matter for admissions context
- Bottom: Narrative threads as expandable cards showing which activities connect to each thread

Style: Warm, celebratory. Use a subtle gradient or accent color based on archetype.
```

**Key data paths**:
```
stage0.narrativeIdentity.archetype
stage0.narrativeIdentity.storyEssence
stage0.narrativeIdentity.primaryTheme
stage0.narrativeIdentity.secondaryThemes
stage0.spikeHypothesis.spikeArea
stage0.spikeHypothesis.maturity
stage0.contextualFactors.*
stage0.narrativeThreads[]
```

---

## Section 2: Activity Cards Grid

**What it shows**: All activities at a glance — tier, category, key stats, and story role.

**Prompt for Lovable**:
```
Build an "Activity Cards Grid" that shows all analyzed activities as cards in a responsive grid.

Props (from AnalysisContext.activities + StoryContext.activityStoryRoles):
Each card needs:
- activityId: string
- title: string (from input)
- tier: 1 | 2 | 3 | 4 (Sara Harberson framework — 1 is best)
- tierReasoning: string
- detectedCategory: string (e.g., "research", "stem_leadership", "work_paid_employment")
- storyRole: "core_identity" | "passion_pursuit" | "impact_vehicle" | "obligation" | "skill_building" | "exploration" | "filler"
- centralityScore: number (0-100)
- totalHours: number
- teachingDepth: "deep" | "medium" | "quick" (from teachingCandidates)
- greenFlags: string[]
- redFlags: string[]
- issues: string[]

Layout:
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Each card shows: Title, tier badge (color-coded: T1=gold, T2=blue, T3=green, T4=gray), category tag, story role pill, total hours, centrality score bar
- Green flags as small green dots/icons, red flags as small amber dots
- Teaching depth indicator: "deep" shows a book icon, "medium" shows a lightbulb, "quick" shows a star
- Cards are clickable — clicking scrolls to that activity's teaching panel (Section 3)
- Cards should be ordered by the Stage 3 recommended order (orderedActivities)

Style: Clean, scannable. Tier badges should be immediately visible. Use visual hierarchy so the eye goes: title → tier → story role → hours.
```

**Key data paths**:
```
stage1.activities[activityId].classification.tier
stage1.activities[activityId].classification.detectedCategory
stage1.activities[activityId].timeInvestment.totalHours
stage0.activityStoryRoles[].storyRole
stage0.activityStoryRoles[].centralityScore
stage1.teachingCandidates.deepTeachingIds / mediumTeachingIds / quickEncouragementIds
stage3.orderedActivities[].rank (for ordering)
```

---

## Section 3: Per-Activity Teaching Panels

**What it shows**: The core teaching output — celebration, tier explanation, strengths, improvements, recommended description, and narrative guidance for each activity.

**Prompt for Lovable**:
```
Build expandable "Activity Teaching Panel" components — one per taught activity. This is the most important section. Each panel has 6 sub-sections displayed in tabs or an accordion.

Props (from TeachingContext.teachingDelivered[].teaching: ActivityTeaching):
- activityId: string
- teachingDepth: "deep" | "medium"
- celebration: { headline: string, strengths: string[], references?: DescriptionReference[] }
- tierExplanation: { assignedTier: 1-4, explanation, whatMakesThisTier, whatWouldChangeIt, benchmarksUsed[] }
- strengthTeaching: Array<{ strength: string, whyItMatters: { text, citations[] }, howToLeverage: string, references?: DescriptionReference[] }>
- improvementTeaching: Array<{ issue: string, priority: "high"|"medium"|"low", whyItMatters: { text, citations[] }, howToFix: string, exampleBefore: string, exampleAfter: string, references?: DescriptionReference[] }>
- descriptionOptimization: { originalDescription: string, optimizedDescription: string, characterCount: number, changesExplained: Array<{ change, reason }> }
- narrativeGuidance: { howToTalkAboutThis: { text }, uniqueAngle: string, connectionToStory: string, interviewTips: string[] }

Layout (6 tabs or accordion sections per activity):

TAB 1 — "Celebration" (default open, always show first):
- Headline as a large, warm callout with a celebration icon
- Strength bullets below
- If references exist, highlight the quoted text inline with colored underlines

TAB 2 — "Tier Assessment":
- Large tier badge (1-4) with color
- Explanation paragraph
- "What makes this tier" section
- "How to improve tier" section
- Collapsible benchmarks table

TAB 3 — "Strengths" (green accent):
- Each strength as an expandable card
- Title visible, "Why it matters" and "How to leverage" expand on click
- References shown as highlighted quotes from student's description

TAB 4 — "Improvements" (amber accent):
- Each improvement as an expandable card with priority badge (high=red, medium=amber, low=blue)
- Before/After comparison shown side-by-side or as a diff view
- "Why it matters" expands on click
- References shown as highlighted quotes

TAB 5 — "Recommended Description":
- Side-by-side: original vs recommended
- Character count for both (show Common App 150-char limit)
- Each change explained below as bullet points
- Copy button for the recommended description

TAB 6 — "Narrative Guidance":
- "How to talk about this" as a primary section
- "Unique angle" highlighted
- "Story connection" paragraph
- Interview tips as a numbered list

Style: Celebration tab should feel warm and encouraging. Improvements should feel constructive, not critical. Use green for strengths, amber for improvements. Before/after descriptions should visually show the transformation.
```

**Key data paths**:
```
stage2.teachingDelivered[].teaching.celebration
stage2.teachingDelivered[].teaching.tierExplanation
stage2.teachingDelivered[].teaching.strengthTeaching[]
stage2.teachingDelivered[].teaching.improvementTeaching[]
stage2.teachingDelivered[].teaching.descriptionOptimization
stage2.teachingDelivered[].teaching.narrativeGuidance
```

---

## Section 4: Description Editor with Highlights

**What it shows**: The student's activity description with highlighted text references — strengths in green, issues in amber, context in blue. This is interactive.

**Prompt for Lovable**:
```
Build a "Description Highlight Editor" component that shows the student's activity description with inline text highlights based on AI analysis.

Props:
- description: string (the student's original activity description)
- references: DescriptionReference[] where each has:
  - quotedText: string (exact substring from description — use description.indexOf(quotedText) to locate)
  - type: "strength" | "issue" | "context"
  - label: string (tooltip text, e.g., "quantifiable impact", "vague language")
- optimizedDescription: string (the recommended version)

Behavior:
1. Parse the description string and find each reference's quotedText position using indexOf()
2. Wrap matched substrings in colored spans:
   - "strength" = green highlight background
   - "issue" = amber/yellow highlight background
   - "context" = blue highlight background
3. On hover over a highlight, show a tooltip with the reference label
4. On click on a highlight, scroll to the corresponding teaching point (strength or improvement) in Section 3
5. Below the highlighted description, show the recommended description with a "Copy" button
6. Character count display: "X/150 characters" with color (green if under, red if over)

Edge cases:
- If references array is empty/undefined, just show the plain description
- If quotedText is not found in description (indexOf returns -1), skip that reference
- Handle overlapping references by prioritizing the first match

Style: The description should look like a text editor or document with colored markup. Think Google Docs suggestions or Grammarly-style highlighting.
```

**Key data paths**:
```
// References come from multiple places in each activity's teaching:
stage2.teachingDelivered[].teaching.celebration.references[]
stage2.teachingDelivered[].teaching.strengthTeaching[].references[]
stage2.teachingDelivered[].teaching.improvementTeaching[].references[]
// Original description from input, optimized from:
stage2.teachingDelivered[].teaching.descriptionOptimization.originalDescription
stage2.teachingDelivered[].teaching.descriptionOptimization.optimizedDescription
```

---

## Section 5: Scoring Dashboard

**What it shows**: Quantitative scores for each activity and the portfolio overall.

**Prompt for Lovable**:
```
Build a "Scoring Dashboard" with two parts: per-activity scores and portfolio overview.

PART A — Per-Activity Score Cards:
Props (from scoring.activityScores[]: ActivityScoreRubric):
- activityTitle: string
- combinedScore: number (1-10) with formula "(activity × 0.7) + (description × 0.3)"
- activityScore: {
    total: number (1-10),
    breakdown: {
      tierAssessment: { score, weight: 0.30, tier: 1-4 },
      recognitionLevel: { score, weight: 0.25, level: string },
      commitmentProgression: { score, weight: 0.175, years: number },
      communityCharacter: { score, weight: 0.15 },
      leadershipImpact: { score, weight: 0.125 }
    }
  }
- descriptionScore: {
    total: number (1-10),
    breakdown: {
      specificity: { score, maxScore: 10 },      // weight: 25% — Role Ownership
      impactClarity: { score, maxScore: 10 },     // weight: 25% — Evidence of Impact
      authenticityVoice: { score, maxScore: 10 },  // weight: 20% — Differentiation Signal
      actionLanguage: { score, maxScore: 10 },     // weight: 15% — Action Precision
      quantification: { score, maxScore: 10 }      // weight: 15% — Strategic Quantification
    }
  }

Layout per activity:
- Combined score as a large number with color (8-10 green, 6-7.9 blue, 4-5.9 amber, <4 red)
- Two sub-sections: "Activity Score" and "Description Score"
- Each sub-section shows component scores as horizontal bar charts or radial charts
- Component bars labeled with weight percentage
- Hover on component shows rationale text

PART B — Portfolio Overview:
Props (from scoring.portfolioRubric: PortfolioScoreRubric):
- overallScore: number (1-10)
- harvardScale: { rating: 1-6, description: string }
- breakdown: { tierDistribution, spikeDetection, coherence, majorAlignment, presentationQuality } (each 1-10)
- keyStrengths: string[]
- keyGaps: string[]
- prioritizedRecommendations: Array<{ priority: 1-3, recommendation, impact, effort }>

Layout:
- Harvard Scale as a prominent badge: "Harvard Scale: X/6" with description
- Overall score as a large radial/gauge chart
- 5 breakdown components as a radar/spider chart or bar chart
- Strengths as green bullets, gaps as amber bullets
- Recommendations as a prioritized list with effort indicators

Note: Scoring data is optional — if scoring.activityScores is undefined or empty, show a "Scoring not available" placeholder. This happens when the batch scoring API call fails (intermittent).
```

**Key data paths**:
```
scoring.activityScores[].combinedScore.total
scoring.activityScores[].activityScore.total
scoring.activityScores[].activityScore.breakdown.*
scoring.activityScores[].descriptionScore.total
scoring.activityScores[].descriptionScore.breakdown.*
scoring.portfolioRubric.overallScore.total
scoring.portfolioRubric.harvardScale
scoring.portfolioRubric.breakdown.*
scoring.portfolioRubric.keyStrengths
scoring.portfolioRubric.keyGaps
scoring.portfolioRubric.prioritizedRecommendations[]
```

---

## Section 6: Portfolio Synthesis

**What it shows**: Final assessment, recommended activity order, and overall strategic positioning.

**Prompt for Lovable**:
```
Build a "Portfolio Synthesis" section showing the final strategic assessment.

Props (from SynthesisContext):
- harvardScale: 1-6 (1=exceptional, 6=weak)
- overallStrength: "exceptional" | "strong" | "competitive" | "developing" | "needs_work"
- confidence: number (0-100%)
- orderedActivities: Array<{ rank, activityId, reason, finalDescription, characterCount }>
- schoolFitSummary?: Array<{ school, fitLevel, keyStrengths[], keyConcerns[] }>

Layout:
- Top banner: Harvard Scale rating as a large badge + overall strength label + confidence bar
- "Recommended Activity Order" section:
  - Numbered list of activities in recommended Common App order
  - Each shows: rank number, activity title, one-sentence reason why this order
  - Drag handle icon (visual only for now — future: drag to reorder)
- School Fit section (if target schools provided):
  - Cards for each target school showing fit level, strengths, concerns
  - Color-coded: excellent=green, good=blue, moderate=amber, challenging=red

Style: This should feel like the "executive summary" — clean, authoritative, actionable.
```

**Key data paths**:
```
stage3.finalAssessment.harvardScale
stage3.finalAssessment.overallStrength
stage3.finalAssessment.confidence
stage3.orderedActivities[]
stage3.schoolFitSummary[]
```

---

## Section 7: Portfolio Narrative

**What it shows**: The story of how activities work TOGETHER — narrative threads, activity elevations, and the portfolio's unique story.

**Prompt for Lovable**:
```
Build a "Portfolio Narrative" section that shows how the student's activities tell a unified story.

Props (from PortfolioNarrative — accessed via finalNarrative):
- story: { pitch: string, uniqueAngle: string, whyItMatters: string, emergentTraits: string[] }
- threads: Array<{ name: string, activityIds: string[], manifestation: string, synergy: string }>
- elevations: Array<{ elevatedActivityId, elevatingActivityId, mechanism, strength: "transformative"|"strong"|"moderate"|"subtle" }>
- coherence: { score: number (0-100), assessment: string, unifyingElement: string }
- spike: { primarySpike: { area, activities[], depth, distinctiveness }, supportingElements[], complementaryBreadth[] }

Layout:
- Story Pitch: Large quote/callout block — the 2-3 sentence compelling pitch
- Coherence Score: Visual meter/gauge (0-100) with assessment label
- Spike Display: Primary spike area with supporting activities shown as connected nodes
- Narrative Threads: Cards for each thread showing:
  - Thread name as heading
  - Connected activity tags
  - Synergy explanation
- Activity Elevations: Visual showing how activities elevate each other
  - Each elevation as a pair of connected cards with an arrow
  - Strength indicated by arrow thickness or color
  - Mechanism text on hover/click
  - "transformative" elevations should stand out visually

Style: This section should feel like insight — showing the student connections they might not have seen. Use visual connections (lines, arrows, groupings) to show relationships.
```

**Key data paths**:
```
finalNarrative.story.pitch
finalNarrative.story.uniqueAngle
finalNarrative.coherence.score
finalNarrative.coherence.assessment
finalNarrative.threads[]
finalNarrative.elevations[]
finalNarrative.spike.primarySpike
```

---

## Section 8: Action Plan Timeline

**What it shows**: Prioritized next steps organized by timeframe.

**Prompt for Lovable**:
```
Build an "Action Plan" timeline component with three time horizons.

Props (from SynthesisContext.actionPlan):
- immediate: Array<{ action: string, activityId?: string, impact: string }>
- shortTerm: Array<{ action: string, activityId?: string, impact: string, deadline?: string }>
- longTerm: Array<{ action: string, activityId?: string, impact: string }>

Layout:
- Three columns or vertical sections: "Do Now", "Next 1-3 Months", "Long-Term"
- Each action item as a card/row with:
  - Action text (bold)
  - Impact explanation (lighter text below)
  - Activity tag if linked to a specific activity
  - Deadline if provided (short-term only)
  - Checkbox (visual only — future: track completion)
- Color gradient: immediate=warm/urgent, short-term=neutral, long-term=cool/aspirational

Style: Should feel like a practical to-do list, not overwhelming. Scannable and actionable.
```

**Key data paths**:
```
stage3.actionPlan.immediate[]
stage3.actionPlan.shortTerm[]
stage3.actionPlan.longTerm[]
```

---

## Section 9: Quick Encouragements

**What it shows**: Warm celebrations for activities that are already strong and don't need deep teaching.

**Prompt for Lovable**:
```
Build a "Quick Encouragements" component for activities that are already strong.

Props (from TeachingContext.quickEncouragements):
- Array of:
  - activityId: string
  - celebration: string (warm acknowledgment)
  - strengthReason: string (why it's already strong)
  - quickTip?: string (optional small suggestion)

Layout:
- Compact cards with a celebration/star icon
- Activity title + celebration text
- "Why it's strong" as expandable detail
- Quick tip (if present) shown as a small callout

Style: Warm, brief, celebratory. These should feel like a "nice job!" moment.
```

**Key data paths**:
```
stage2.quickEncouragements[]
```

---

## Section 10: Cost & Meta Footer

**What it shows**: Pipeline cost and processing metadata (for transparency).

**Prompt for Lovable**:
```
Build a small footer component showing pipeline metadata.

Props:
- totalCost: number (e.g., 0.93)
- version: string (e.g., "4.3.0")
- duration: number (seconds)
- pipelineCost: { stage0, stage1, stage2, stage3, total } (from SynthesisContext)

Layout:
- Single row or collapsible footer
- "Powered by Uplift v4.3 | Analysis cost: $0.93 | Duration: 9.3 min"
- Expandable: per-stage cost breakdown

Style: Minimal, informational. Should not distract from the content.
```

---

## Data Model Quick Reference

### Top-Level: `ActivityWorkshopPipelineResult`

```typescript
{
  sessionId: string;
  version: "4.3.0";

  stage0: StoryContext;        // Section 1 (Story)
  stage1: AnalysisContext;     // Section 2 (Activity Cards)
  stage2: TeachingContext;     // Sections 3, 4, 9 (Teaching, Highlights, Encouragements)
  stage3: SynthesisContext;    // Sections 6, 8 (Synthesis, Action Plan)

  finalNarrative?: PortfolioNarrative;  // Section 7 (Narrative)

  scoring?: {                  // Section 5 (Scoring Dashboard)
    portfolioRubric: PortfolioScoreRubric;
    activityScores: ActivityScoreRubric[];
  };

  totalCost: number;           // Section 10 (Footer)
}
```

### DescriptionReference (for Section 4 highlighting)

```typescript
interface DescriptionReference {
  quotedText: string;   // Exact substring — use description.indexOf() to find position
  type: "strength" | "issue" | "context";
  label: string;        // Tooltip text
}
```

References appear in three places per activity:
- `celebration.references[]`
- `strengthTeaching[].references[]`
- `improvementTeaching[].references[]`

### Scoring Weights

**Activity Score** (70% of combined):
| Component | Weight | Scale |
|-----------|--------|-------|
| Tier Assessment | 30% | 0-10 |
| Recognition Level | 25% | 0-10 |
| Commitment & Progression | 17.5% | 0-10 |
| Community & Character | 15% | 0-10 |
| Leadership & Impact | 12.5% | 0-10 |

**Description Score** (30% of combined):
| Dimension | Weight | Scale |
|-----------|--------|-------|
| Role Ownership (specificity) | 25% | 0-10 |
| Evidence of Impact (impactClarity) | 25% | 0-10 |
| Differentiation Signal (authenticityVoice) | 20% | 0-10 |
| Action Precision (actionLanguage) | 15% | 0-10 |
| Strategic Quantification (quantification) | 15% | 0-10 |

**Combined Score** = (Activity Score x 0.7) + (Description Score x 0.3)

### Harvard Scale (1-6)

| Rating | Meaning | Example Schools |
|--------|---------|-----------------|
| 1 | Outstanding | Competitive for HYPSM |
| 2 | Excellent | Competitive for Top 20 |
| 3 | Good/Competitive | Strong for Top 50 |
| 4 | Average | Solid for selective schools |
| 5 | Below Average | Needs significant work |
| 6 | Weak | Major gaps present |

### Activity Tiers (Sara Harberson Framework)

| Tier | Meaning | Example |
|------|---------|---------|
| 1 | Rare Achievement | National/international recognition, published research |
| 2 | Distinguished | State/regional leadership, significant impact |
| 3 | Solid | School-level leadership, consistent commitment |
| 4 | Participation | General involvement, minimal distinction |

---

## Implementation Notes

1. **All new fields are optional** — the frontend must handle undefined/missing data gracefully. Scoring may not be available. References may be empty.

2. **Description highlighting uses indexOf()** — not character positions from the LLM. This is more reliable. If `indexOf(quotedText)` returns -1, skip that reference.

3. **Teaching depth varies** — not all activities get deep teaching. Check `teachingDepth` to know what sub-sections will have data. "quick" activities only have celebration + strengthReason.

4. **Activity ordering** — use `stage3.orderedActivities` for display order, not input order.

5. **Mobile-first** — Teaching panels should collapse to accordion on mobile. Scoring charts should simplify to lists.

6. **Color system**: Green = strengths/celebration, Amber = improvements/issues, Blue = context/info, Gold = Tier 1, Gray = Tier 4.

7. **The portfolio narrative (Section 7) is the emotional climax** — it should feel like the moment where all the pieces click together. Give it visual weight.
