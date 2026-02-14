# Prompt 4: Insights Tab — Teaching, Scoring & Guidance

> Attach [00-context.md](./00-context.md) with this prompt. Optionally attach the Machine Learning Research section from `ACTIVITY_WORKSHOP_E2E_SAMPLE_OUTPUT.txt` for real data examples.

**Prev**: [03 — Edit Tab](./03-edit-tab.md) | **Next**: [05 — AI Coach](./05-ai-coach.md)

---

Build the "Insights" tab in the left pane of the split-pane layout from [Prompt 02](./02-split-pane-layout.md). This is the richest section — everything our AI analyzed about the currently selected activity, organized into scrollable sections.

## What the Student Sees

For the currently selected activity, these sections appear in order:

### 1. Celebration (always first)
> Data source: `stage2.teachingDelivered[].teaching.celebration` — [see type in context](./00-context.md#stage-2--teaching)

The AI always leads with what's working. Warm, encouraging tone with green styling.

Fields: `celebration.headline` (the main quote) + `celebration.strengths` (bullet points)

> 🎉 "Your phrase 'Built data pipeline processing 50,000 patient records' is exactly what MIT wants to see — not 'helped with research' but 'BUILT infrastructure at scale.'"
> - Technical specificity (NLP, data pipeline) proves real CS work
> - Scale (50,000 records) gives admissions concrete sense of complexity
> - Socially relevant application (rural healthcare) — powerful for first-gen narrative

### 2. Tier Assessment
> Data source: `stage2.teachingDelivered[].teaching.tierExplanation` — [see type in context](./00-context.md#stage-2--teaching)

Fields: `assignedTier`, `explanation`, `whatMakesThisTier`, `whatWouldChangeIt`

> **TIER 2** — Distinguished (State/Regional Recognition)
>
> Why: Co-authored paper + technical depth + social relevance
>
> What makes this tier: Technical complexity, external validation, social relevance
>
> How to reach Tier 1: Publication acceptance, first-author status, national recognition (ISEF, Regeneron STS)

Tier badge colors: T1 gold, T2 blue, T3 green, T4 gray.

### 3. Strengths (expandable cards, green accent)
> Data source: `stage2.teachingDelivered[].teaching.strengthTeaching[]` — [see type in context](./00-context.md#stage-2--teaching)

Each entry has: `strength` (title), `whyItMatters.text` (paragraph), `howToLeverage` (actionable advice)

Expandable cards — click to show "why it matters" and "how to leverage":

- ▶ Builder Identity with Technical Depth
- ▶ Socially Relevant Technical Application
- ▶ External Validation Through Co-Authorship

### 4. Improvements (expandable cards, amber accent, sorted by priority)
> Data source: `stage2.teachingDelivered[].teaching.improvementTeaching[]` — [see type in context](./00-context.md#stage-2--teaching)

Each entry has: `issue` (title), `priority` (high/medium/low), `whyItMatters.text`, `howToFix`, `exampleBefore`, `exampleAfter`

The before/after is the most impactful visual — show it prominently, side by side or as a diff.

- **[HIGH]** Missing Context: Which university? Which professor?
  - Before: "Worked with professor on NLP project..."
  - After: "Worked with Dr. [Name], UC [City] CS Dept, on NLP project..."
- **[HIGH]** Hidden Impact: What did the research FIND?
  - Before: "Built data pipeline processing 50,000 patient records."
  - After: "Built data pipeline processing 50,000 patient records; identified 3x disparity in specialist access."

### 5. Scoring Breakdown (when available)
> Data source: `scoring.activityScores[]` (the entry matching current activityId) — [see type in context](./00-context.md#scoring-optional--may-be-undefined)

**Important**: `scoring` may be `undefined` if the scoring pipeline failed. If not available, show a simple "Scoring not available" message — don't break anything.

When available, show clean horizontal bars with percentage labels:

> Combined: 7.2/10 (Activity: 7.8 × 70% + Description: 5.8 × 30%)
>
> **Activity Score: 7.8/10**
> - Tier Assessment: 8/10 (30% weight)
> - Recognition: 7/10 (25%)
> - Commitment: 8/10 (17.5%)
> - Community: 7/10 (15%)
> - Leadership: 8/10 (12.5%)
>
> **Description Score: 5.8/10**
> - Specificity: 6/10 (25%)
> - Impact Clarity: 5/10 (25%)
> - Authenticity/Voice: 7/10 (20%)
> - Action Language: 5/10 (15%)
> - Quantification: 5/10 (15%)

Also show `summary.oneLiner`, `summary.topStrength`, `summary.topImprovement` from the scoring data.

### 6. Narrative Guidance
> Data source: `stage2.teachingDelivered[].teaching.narrativeGuidance` — [see type in context](./00-context.md#stage-2--teaching)

Fields: `howToTalkAboutThis.text`, `uniqueAngle`, `connectionToStory`, `interviewTips[]`

> **How to talk about this:** "Frame it as the moment you realized CS is infrastructure for equity, not just algorithms."
>
> **Your unique angle:** "You chose a socially relevant application that connects to your lived experience, AND built production-level infrastructure, AND achieved external validation."
>
> **Interview tips:**
> 1. Use the 30-second formula: Problem → Solution → Finding → Impact
> 2. Be ready to explain your specific contribution

### Quick Encouragement Activities
> Data source: `stage2.quickEncouragements[]` — [see type in context](./00-context.md#stage-2--teaching)

If the activity is already strong (`teachingDepth === 'quick'` — check via `stage1.teachingCandidates.quickEncouragementIds`), show just the celebration card and a quick tip instead of the full teaching layout.

Fields: `celebration` (string), `strengthReason`, `quickTip`

> 🌟 CS Club Founder — "Your phrase 'Started the first CS club at my school' immediately signals you're a builder who identifies gaps and fills them."
>
> Quick tip: Add one concrete outcome (e.g., '40 students participated')

## Style
- Celebration: warm green accents
- Strengths: green left border, expandable
- Improvements: amber left border, priority badges (high=red, medium=amber, low=blue), expandable
- Before/After: the most prominent visual element in improvements — side by side or diff style
- All sections collapsible to manage density
