# Activity Scoring System — Human User Experience Flow

This document maps the complete end-to-end experience a real user has when interacting with the Activity Scoring system. It covers every screen, interaction, data flow, and feedback loop — designed so we can identify UX gaps and improvement opportunities.

---

## Table of Contents

1. [User Journey Overview](#user-journey-overview)
2. [Phase 1: Activity Input](#phase-1-activity-input)
3. [Phase 2: Initial Scoring (First Run)](#phase-2-initial-scoring-first-run)
4. [Phase 3: Score Display & Comprehension](#phase-3-score-display--comprehension)
5. [Phase 4: Teaching Layer & Guidance](#phase-4-teaching-layer--guidance)
6. [Phase 5: Iterative Editing (Cache-Powered)](#phase-5-iterative-editing-cache-powered)
7. [Phase 6: Portfolio-Level Strategy](#phase-6-portfolio-level-strategy)
8. [Complete Data Flow Diagram](#complete-data-flow-diagram)
9. [UX Gap Analysis](#ux-gap-analysis)
10. [Cost Transparency for Users](#cost-transparency-for-users)

---

## User Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ACTIVITY SCORING USER JOURNEY                    │
│                                                                      │
│  INPUT ──→ SCORE ──→ UNDERSTAND ──→ LEARN ──→ EDIT ──→ RE-SCORE    │
│    │          │          │             │         │          │         │
│    │     (3 API calls)   │        (Teaching)    │    (Smart Cache)   │
│    │     ~$0.05          │        +1 API call   │    Smaller batches │
│    │     ~3 seconds      │        ~$0.06        │    Only changed    │
│    │                     │        ~3 seconds    │    activities      │
│    │                     │                      │                    │
│    └─────────────────────┴──────────────────────┴────────────────────┘
```

**Key Insight**: The user's experience is an *iterative refinement loop*, not a one-shot analysis. They enter activities, see scores, learn what to fix, edit descriptions, and instantly see how changes affect their scores. Caching makes this loop feel instant.

---

## Phase 1: Activity Input

### What the User Does

The user enters their extracurricular activities. Each activity captures:

| Field | Example | Required |
|-------|---------|----------|
| **Title** | "USA Math Olympiad" | Yes |
| **Category** | Academic, Athletics, Arts, Service, Work, etc. | Yes |
| **Role/Position** | "Team Captain" or "Member" | Yes |
| **Description** | 150-character description | Yes |
| **Organization** | "School Math Team" | Optional |
| **Grade Levels** | [9, 10, 11, 12] | Yes |
| **Hours/Week** | 15 | Yes |
| **Weeks/Year** | 40 | Yes |
| **Achievements** | List of honors/awards | Optional |

### What the User Sees

A form or card-based interface where they can:
- Add up to 10 activities (Common App limit)
- Reorder activities by importance
- See character count (150 max) on descriptions
- See a "Score My Portfolio" button

### UX Considerations

- **Character counter** on description field (150-char limit mirrors Common App)
- **Category dropdown** matches Common App categories
- **Achievement tags** for quick entry of honors
- **Auto-save** as they type (prevents data loss)
- **Activity order** matters — helps users prioritize

---

## Phase 2: Initial Scoring (First Run)

### What Happens Behind the Scenes

When the user clicks "Score My Portfolio", the orchestrator runs a 3-4 step pipeline:

```
User clicks "Score"
        │
        ▼
┌──────────────────────────────┐
│  API Call 1: Description     │   Haiku model
│  Batch Scoring               │   All descriptions in ONE call
│  ~1.5 seconds                │
│  Scores: 5 components × 2pts│   Specificity, Impact Clarity,
│  each = 10pt scale           │   Action Language, Quantification,
│                              │   Authenticity & Voice
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  API Call 2: Activity        │   Haiku model
│  Batch Scoring               │   All activities in ONE call
│  ~2 seconds                  │
│  Scores: 5 components        │   Tier Assessment (30%),
│  weighted to 10pt scale      │   Recognition (25%),
│                              │   Leadership (12.5%),
│                              │   Community & Character (15%),
│                              │   Commitment (17.5%)
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  API Call 3: Portfolio        │   Haiku model
│  Holistic Analysis           │   ONE call for entire portfolio
│  ~1.5 seconds                │
│  Scores: Tier Distribution,  │   Overall Score (1-10),
│  Spike, Coherence,           │   Harvard Scale (1-6),
│  Major Alignment,            │   Narrative Assessment,
│  Presentation Quality        │   Competitive Context
└──────────┬───────────────────┘
           │
           ▼ (Optional — if teaching requested)
┌──────────────────────────────┐
│  API Call 4: Teaching Layer   │   Sonnet model (higher quality)
│  Deep Guidance               │   ONE call
│  ~3 seconds                  │
│  Output: Rewrites,           │   Transformations for weakest
│  Principles, Strategy,       │   activities, craft lessons,
│  Citations                   │   spike reinforcement
└──────────────────────────────┘
```

**Total First Run**: ~5 seconds (scoring only) or ~8 seconds (with teaching)
**Cost**: ~$0.05-0.08 (scoring) or ~$0.10-0.14 (with teaching)

### What the User Sees During Loading

```
[✓] Analyzing your descriptions...          (1.5s)
[✓] Evaluating your activities...           (2s)
[✓] Assessing your portfolio holistically...  (1.5s)
[○] Generating improvement guidance...       (3s) ← teaching layer
```

Progressive loading indicators give the user visibility into each stage.

---

## Phase 3: Score Display & Comprehension

### The Score Card (What the User Sees First)

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  YOUR PORTFOLIO SCORE                                │
│                                                      │
│  ┌───────────┐   ┌──────────────────────────────┐   │
│  │   7.9/10  │   │  Harvard Rating: 2            │   │
│  │  Overall  │   │  (Outstanding — Top 5%)       │   │
│  └───────────┘   └──────────────────────────────┘   │
│                                                      │
│  "Your extracurriculars tell a cohesive story of    │
│   a systems builder who achieves at the highest     │
│   level and creates infrastructure to help others." │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  YOUR ACTIVITIES (sorted by combined score)          │
│                                                      │
│  9.4 ████████████████████  USA Math Olympiad         │
│  8.2 ████████████████░░░░  Debate Team Captain       │
│  7.8 ███████████████░░░░░  ML Research               │
│  6.4 ████████████░░░░░░░░  Environmental Club VP     │
│  3.5 ██████░░░░░░░░░░░░░░  National Honor Society    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Score Breakdown (Drill-Down View)

When the user clicks on an activity, they see the full breakdown:

**Layer 1 — Combined Score Overview**
```
USA Math Olympiad: 9.4/10
├── Activity Score: 9.6/10 (weight: 70%)
├── Description Score: 9.0/10 (weight: 30%)
└── Formula: (9.6 × 0.7) + (9.0 × 0.3) = 9.42 → 9.4
```

**Layer 2 — Activity Score Breakdown (Solo Activity — Leadership N/A)**
```
Activity Score: 9.5/10                           [Solo Weights Applied]
├── Tier Assessment:        10/10 × 34.3% = 3.43 │ Tier 1: National
├── Recognition Level:      10/10 × 28.6% = 2.86 │ National
├── Leadership & Impact:    N/A   ×  0%   = —     │ Individual competition
├── Community & Character:   8/10 × 17.1% = 1.37 │ Discipline & mastery
└── Commitment:             10/10 × 20%   = 2.00 │ 4-year mastery arc
                                            ────
                                            9.66
```

Note: USAMO is an individual academic competition. Leadership N/A — individual competition. The 12.5% leadership weight redistributes proportionally to other components (Tier 34.3%, Recognition 28.6%, Community 17.1%, Commitment 20%).

**Layer 3 — Description Score Breakdown**
```
Description Score: 9.0/10
├── Specificity:          1.8/2  │ Names USAMO, 500 qualifier cutoff
├── Impact Clarity:       1.8/2  │ Achievement level clear
├── Action Language:      2.0/2  │ "Qualified," "mastered," "solved"
├── Quantification:       1.6/2  │ Strong numbers, could add more
└── Authenticity & Voice: 1.8/2  │ Genuine competitor voice
                          ────
                          9.0
```

### Key UX Question: How Deep Should We Go By Default?

| Depth Level | What's Shown | When to Show |
|-------------|-------------|--------------|
| **Summary** | Combined score + one-liner + top bar chart | Default view |
| **Breakdown** | Activity/Description split + component scores | Click to expand |
| **Deep Dive** | Full rationales, benchmarks, improvement paths | Click "Learn More" |

**Recommendation**: Default to Summary. Let curiosity pull them deeper. Most users want the number first, the "why" second.

---

## Phase 4: Teaching Layer & Guidance

### What the User Sees

The teaching layer appears as a separate section after the scores. It's organized by **ROI (return on time invested)**, not by weakness severity:

```
┌─────────────────────────────────────────────────────┐
│  STRATEGIC IMPROVEMENT GUIDE                         │
│                                                      │
│  Philosophy: Deepen your spike, showcase everything. │
│  Every activity deserves its best presentation.     │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  🎯 DEEPEN YOUR SPIKE                          │  │
│  │  Submit ML Research to Regeneron STS            │  │
│  │  Impact: Research 7.8 → 9.0+ │ Portfolio → 8.5 │  │
│  │                                                │  │
│  │  You already have the research. This builds on │  │
│  │  existing strength—not starting from scratch.  │  │
│  │  Even semifinalist status creates a second     │  │
│  │  Tier 1 activity and puts you in Harvard       │  │
│  │  Rating 1 territory.                           │  │
│  │                                  [Learn More]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  ✏️ AMPLIFY: Research Description Rewrite       │  │
│  │  Impact: +0.8 score │ Effort: 15 minutes       │  │
│  │                                                │  │
│  │  BEFORE:                                       │  │
│  │  "Conducted independent research on machine    │  │
│  │   learning applications in astronomy..."       │  │
│  │                                                │  │
│  │  AFTER:                                        │  │
│  │  "Built neural network that improved asteroid  │  │
│  │   detection 23%—identifying 12 previously      │  │
│  │   missed objects in archival data."            │  │
│  │                                    [Apply →]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  ✏️ AMPLIFY: Environmental Club Rewrite         │  │
│  │  Impact: +1.1 score │ Effort: 15 minutes       │  │
│  │  Connect to your spike with "Designed waste    │  │
│  │  tracking system..." framing                   │  │
│  │                                    [Apply →]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  ✏️ ELEVATE: NHS Description Rewrite            │  │
│  │  Current: 3.5/10 — Most room for improvement   │  │
│  │                                                │  │
│  │  Every slot is valuable real estate.           │  │
│  │  Craft the strongest possible description:     │  │
│  │  "Created structured competition math prep     │  │
│  │   curriculum — trained 6 peers to deliver it"  │  │
│  │                                    [Apply →]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Key philosophical shift**: The system helps students showcase EVERY activity in its best possible light. The approach adapts by score level:
- **Strong activities (8+)**: Deepen — how to push to the next level
- **Mid-tier activities (5-7)**: Amplify — quick description rewrites to connect to spike
- **Weaker activities (<4)**: Elevate — craft the most compelling description possible for what the activity is

### Teaching Content Structure Per Transformation

Each transformation card contains:

1. **The Problem** — What's wrong with the current description and why it hurts
2. **The Principle** — The named writing/admissions principle being applied
3. **Before/After** — Side-by-side with character counts
4. **Changes Applied** — Table showing each element that changed and why
5. **Alternative Angle** — Different version if the student's circumstances differ
6. **Research Backing** — Quotes from admissions officers/research
7. **Expected Score Impact** — Projected improvement with rationale

### The "Apply" Button

When the user clicks "Apply" on a suggested rewrite:
1. The description field updates with the suggested text
2. The system marks this activity as "changed" for re-scoring
3. A subtle indicator shows "Score will update on next analysis"

### Craft Teaching Section

Below the transformations, general craft lessons appear:

```
┌─────────────────────────────────────────────────────┐
│  CRAFT LESSONS                                       │
│                                                      │
│  Based on patterns across your portfolio:            │
│                                                      │
│  📝 Active Voice Command                             │
│     Your best activities use active verbs (built,    │
│     created). Your weakest use passive (participated,│
│     attended). Here's how to fix each one...         │
│                                                      │
│  📊 The Quantification Hierarchy                     │
│     Not all numbers are equal:                       │
│     Outcomes > Scale > Time                          │
│     "3 students qualified for AMC" > "15 students    │
│     weekly" > "twice per month"                      │
│                                                      │
│  💡 The "So What" Sentence                           │
│     Every description needs one sentence that        │
│     answers: "Why should I care?"                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Phase 5: Iterative Editing (Cache-Powered)

This is where the system's architecture delivers its core UX value. The user edits descriptions and re-scores — and the caching system makes this feel near-instant.

### The Edit-Score Loop

```
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│  User    │───→│  Edit one    │───→│  Click "Re-Score" │
│  reads   │    │  description │    │                   │
│  scores  │    │              │    │  (Cache detects   │
│          │    │              │    │   9/10 unchanged) │
└──────────┘    └──────────────┘    └────────┬──────────┘
                                             │
     ┌───────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  WHAT HAPPENS ON RE-SCORE (1 activity changed)              │
│                                                              │
│  API Call 1: Description Batch                               │
│  ├── 9 activities: CACHE HIT (instant, no tokens)           │
│  └── 1 activity: SCORED FRESH (small batch = fast + cheap)  │
│                                                              │
│  API Call 2: Activity Batch                                  │
│  ├── 9 activities: CACHE HIT (instant, no tokens)           │
│  └── 1 activity: SCORED FRESH (small batch = fast + cheap)  │
│                                                              │
│  API Call 3: Portfolio Analysis — ALWAYS FRESH               │
│  (Uses 9 cached + 1 fresh scores as input)                  │
│  (Holistic quality preserved because it sees full picture)   │
│                                                              │
│  API Call 4: Teaching — ALWAYS FRESH (if requested)          │
│  (Regenerates guidance based on updated portfolio)           │
│                                                              │
│  RESULT:                                                     │
│  - Batch sizes: 1 instead of 10 = fewer tokens             │
│  - Total time: ~3 seconds instead of ~5                      │
│  - Total cost: ~$0.03 instead of ~$0.05                     │
│  - Quality: IDENTICAL (individual scores deterministic,      │
│    portfolio analysis always fresh)                          │
└─────────────────────────────────────────────────────────────┘
```

### What the User Sees During Re-Score

```
[✓] Checking for changes...                     (instant)
[✓] 9 activities unchanged (using cached scores)  (instant)
[✓] Re-scoring "ML Research" description...      (0.5s)
[✓] Re-scoring "ML Research" activity...         (0.8s)
[✓] Updating portfolio assessment...             (1.5s)
[✓] Refreshing improvement guidance...           (3s)

Cache savings: 9 activities served from cache
Estimated savings: $0.04 | ~2 seconds faster
```

### Score Change Visualization

After re-scoring, the user sees what changed:

```
┌─────────────────────────────────────────────────────┐
│  SCORE UPDATE                                        │
│                                                      │
│  ML Research:  7.8 → 8.6 (+0.8)  ↑ IMPROVED        │
│  ├── Description: 7.0 → 8.5 (+1.5)                 │
│  └── Activity: 8.2 → 8.2 (unchanged)               │
│                                                      │
│  Portfolio:    7.9 → 8.1 (+0.2)  ↑ IMPROVED        │
│  Harvard:      2 → 2 (unchanged)                    │
│                                                      │
│  Other Activities: Unchanged (cached)                │
│                                                      │
│  9 of 10 activities served from cache               │
│  Saved: ~$0.04 | ~2 seconds                         │
└─────────────────────────────────────────────────────┘
```

### Session Continuity

The caching system uses session IDs to track the user's editing session:

```typescript
// First scoring — creates a session
const result1 = await scoringOrchestrator.scorePortfolio({
  activities: [...],
  studentContext: { intendedMajor: "Computer Science" },
});
const sessionId = result1.cacheInfo?.sessionId;

// User edits one description...

// Second scoring — reuses session for caching
const result2 = await scoringOrchestrator.scorePortfolio({
  activities: [...], // one changed
  cacheOptions: { sessionId },
});

// result2.cacheInfo shows:
// - 9 descriptions cached, 1 fresh
// - 9 activities cached, 1 fresh
// - Portfolio: always fresh
// - Teaching: always fresh
```

**Session Expiry**: Sessions last 1 hour of inactivity. If the user comes back after a break, a new session starts and all activities are scored fresh.

---

## Phase 6: Portfolio-Level Strategy

### Portfolio Assessment Display

```
┌─────────────────────────────────────────────────────┐
│  PORTFOLIO DEEP DIVE                                 │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │  Component           │ Score │ Rating           ││
│  │──────────────────────┼───────┼─────────────────-││
│  │  Tier Distribution   │  8/10 │ Tier 1 anchor    ││
│  │  Spike Detection     │  9/10 │ Clear STEM spike ││
│  │  Coherence           │  7/10 │ 2 outliers       ││
│  │  Major Alignment     │  9/10 │ CS/Math match    ││
│  │  Presentation Quality│  7/10 │ Inconsistent     ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  YOUR NARRATIVE                                      │
│  Archetype: Systems Builder                          │
│  Story: "Mathematician who builds learning           │
│          ecosystems for others."                     │
│                                                      │
│  Two-Sentence Pitch:                                 │
│  "A USAMO qualifier who doesn't just compete—he     │
│  builds. His open-source training platform serves    │
│  5,000 students; his debate program converts         │
│  novices to varsity competitors."                    │
│                                                      │
│  COMPETITIVE CONTEXT                                 │
│  ✓ Nationally distinctive anchor (USAMO)             │
│  ✓ Clear spike with depth                           │
│  ✓ Impact beyond self                               │
│  △ Research needs national validation                │
│  △ 2 activities disconnected from narrative          │
│  ✗ Limited collaborative/team experience             │
│                                                      │
│  PATHWAY TO HARVARD RATING 1                         │
│  You're one significant step away:                   │
│  → Submit ML research to Regeneron STS               │
│  → Or: get platform adopted by institution           │
│  → Or: peer-reviewed publication                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Spike Reinforcement Display

```
┌─────────────────────────────────────────────────────┐
│  YOUR SPIKE: STEM Systems Builder                    │
│  Strength: Strong (9/10)                             │
│                                                      │
│  Current Narrative:                                  │
│  "I'm excellent at math and have created some        │
│   helpful resources."                                │
│                                                      │
│  Strengthened Narrative:                             │
│  "I build learning infrastructure. Whether           │
│   competition math platforms, debate training         │
│   programs, or sustainability tracking—I create      │
│   structures that help others succeed."              │
│                                                      │
│  Per-Activity Connection:                            │
│  ✓ USAMO → Core anchor (keep as-is)                 │
│  ✓ Debate → "Built training pipeline"               │
│  ~ Research → Reframe: "Built classifier tool"       │
│  ✗ Environmental → Connect: "Designed tracking"      │
│  ✗ NHS → Connect: "Created curriculum"               │
│                                                      │
│  Key phrases to use everywhere:                      │
│  • "Built/Created/Designed [system/tool/program]"   │
│  • "Now used by [number] [people/groups]"           │
│  • "[Outcome] that continues after I leave"         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Complete Data Flow Diagram

```
USER INPUT                ORCHESTRATOR              API CALLS           OUTPUT
─────────                 ────────────              ─────────           ──────

10 Activities ──→ ┌─────────────────────┐
                  │  Cache Check         │
                  │  (per activity)      │
                  │                      │
                  │  9 cached + 1 new    │
                  └──────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  (cached scores
     │ Desc Batch │  │ Act Batch  │   skip API)
     │ (1 item)   │  │ (1 item)   │
     │ Haiku      │  │ Haiku      │
     └─────┬──────┘  └─────┬──────┘
           │               │
           └───────┬───────┘
                   ▼
         ┌─────────────────┐
         │ Portfolio Score  │  ← Uses ALL scores
         │ (always fresh)  │    (9 cached + 1 fresh)
         │ Haiku           │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Teaching Layer   │  ← Uses portfolio rubric
         │ (always fresh)  │    + all activities
         │ Sonnet (quality)│
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────────────────────────────────┐
         │  ScoringOrchestratorResult                   │
         │  ├── rubric: PortfolioScoreRubric           │
         │  │   ├── overallScore (1-10)                │
         │  │   ├── harvardScale (1-6)                 │
         │  │   ├── breakdown (5 components)           │
         │  │   ├── narrative                          │
         │  │   ├── competitiveContext                 │
         │  │   ├── activityScores[] (per activity)    │
         │  │   ├── keyStrengths[]                     │
         │  │   ├── keyGaps[]                          │
         │  │   └── prioritizedRecommendations[]       │
         │  ├── teaching?: TeachingLayerOutput         │
         │  │   ├── activityTransformations[]          │
         │  │   ├── strategicPriorities[]              │
         │  │   ├── spikeReinforcement                 │
         │  │   ├── craftTeaching[]                    │
         │  │   └── rewriteQuickReference[]            │
         │  ├── cacheInfo: CacheUsageInfo              │
         │  │   ├── activityCacheStatus[] (per act.)   │
         │  │   ├── summary (cached/fresh counts)      │
         │  │   └── savings (cost, time, calls)        │
         │  ├── changeDetection                        │
         │  │   ├── newActivities[]                    │
         │  │   ├── removedActivities[]                │
         │  │   ├── changedDescriptions[]              │
         │  │   └── unchanged[]                        │
         │  └── timing (ms per step)                   │
         └─────────────────────────────────────────────┘
```

---

## UX Gap Analysis

### Identified Gaps & Improvement Opportunities

#### Gap 1: No Live Preview During Editing
**Current**: User edits description → clicks "Re-Score" → waits for results.
**Improvement**: Show a lightweight, client-side estimate of description score as they type. Use the 5 description components (specificity, impact clarity, action language, quantification, authenticity) to give heuristic feedback without an API call.

```
As you type: "Built neural network that..."
├── Specificity: ██████████ Strong (specific tool named)
├── Action Language: ██████████ Strong (active verb "Built")
├── Quantification: ░░░░░░░░░░ Weak (no numbers yet)
├── Impact Clarity: ░░░░░░░░░░ Incomplete (no outcome)
└── Voice: ████████░░ Good
```

**Benefit**: Instant feedback encourages better descriptions before they even score.

#### Gap 2: No Progress Tracking Across Sessions
**Current**: Each session starts fresh. User can't see how their portfolio has improved over time.
**Improvement**: Store scoring history per user. Show a timeline:

```
Session 1 (Jan 15): Portfolio 6.8 → Session 2 (Jan 16): 7.4 → Session 3 (Jan 18): 7.9
```

**Benefit**: Motivates continued improvement. Shows ROI of the system.

#### Gap 3: No A/B Comparison for Descriptions
**Current**: User sees before/after in teaching layer but can't easily compare options.
**Improvement**: Side-by-side comparison mode where user can toggle between their version, our suggested version, and alternative versions — each showing projected scores.

```
┌────────────────────────┐  ┌────────────────────────┐
│ YOUR VERSION           │  │ SUGGESTED VERSION       │
│ Score: 7.0             │  │ Score: 8.5 (projected)  │
│                        │  │                         │
│ "Conducted independent │  │ "Built neural network   │
│  research on ML..."    │  │  that improved asteroid  │
│                        │  │  detection 23%..."      │
│ 147/150 chars          │  │ 147/150 chars           │
└────────────────────────┘  └────────────────────────┘
                [Use This ←]  [→ Use This]
```

#### Gap 4: No "What If" Scenarios
**Current**: Teaching suggests improvements but doesn't preview portfolio impact.
**Improvement**: Show ROI-aware projections that distinguish between description rewrites (quick) and spike deepening (high-effort, high-reward):

```
PROJECTION — Quick Wins (description rewrites only, ~30 min total):
├── Research: 7.8 → 8.6  (rewrite)
├── Environmental: 6.4 → 7.5  (rewrite + spike connection)
├── Portfolio: 7.9 → 8.2
└── Harvard Rating: 2 → 2

PROJECTION — If Regeneron STS semifinalist:
├── Research: 7.8 → 9.2  (national validation)
├── Portfolio: 7.9 → 8.6
└── Harvard Rating: 2 → 1

QUICK WIN:
NHS at 3.5 → 5.8 projected (description rewrite, ~15 min)
Every slot deserves its best presentation.
```

**Benefit**: Motivates action by showing ROI. Makes clear which improvements are 15-minute wins vs. long-term investments. Shows every activity can be elevated.

#### Gap 5: No Peer Benchmarking
**Current**: Harvard 1-6 and comparison benchmarks exist but are static text.
**Improvement**: Visual positioning against aggregate data:

```
WHERE YOU STAND (CS applicants to Top 20 schools):

Score Distribution:
1-3 ████░░░░░░ 12%
4-5 ██████████ 35%
6-7 ████████░░ 28%
8-9 █████░░░░░ 20%  ← YOU ARE HERE (7.9)
10  ██░░░░░░░░  5%
```

#### Gap 6: Teaching Layer Is Optional But Should Be Default
**Current**: Teaching is an optional flag (`includeTeaching: true`).
**Improvement**: Always include teaching for first-time scoring. The rewrites and strategic guidance are the highest-value output — without them, users just see numbers without knowing how to improve. Make teaching opt-out on re-scores (when user just wants to see updated numbers). The teaching layer's showcase-everything philosophy (deepen spike → amplify mid-tier → elevate weaker activities) is what makes the system genuinely useful rather than just a score generator.

#### Gap 7: No Export/Share Functionality
**Current**: Results exist only in the UI.
**Improvement**: Export options:
- PDF report for sharing with counselor
- Copy description to clipboard (for pasting into Common App)
- Share link for college counselor review

#### Gap 8: Cache Savings Are Invisible to Users
**Current**: Cache info is returned in the API response but may not be displayed.
**Improvement**: Subtle indicator showing the system is working efficiently:

```
⚡ Smart scoring: 9 activities from cache, 1 re-analyzed
   Saved ~$0.04 and ~2 seconds
```

**Benefit**: Builds trust that the system is intelligent, not just running the same analysis over and over.

#### Gap 9: No Guided Onboarding
**Current**: User enters activities and scores them. No guidance on what makes a good starting point.
**Improvement**: Before scoring, offer a quick-start guide:
- "Tip: Start with your strongest activity. Lead with your spike."
- "Tip: Use all 150 characters. Every character is a chance to impress."
- "Tip: Start descriptions with action verbs: Built, Created, Founded, Launched"

#### Gap 10: No Activity Ordering Optimization
**Current**: User manually orders activities.
**Improvement**: After scoring, suggest optimal ordering with strategic notes:

```
SUGGESTED ORDER (by combined score):
1. USA Math Olympiad (9.4) — Your anchor activity (spike)
2. Debate Team Captain (8.2) — Supports your builder narrative
3. ML Research (7.8) — Deepest spike extension opportunity
4. Environmental Club VP (6.4) — Connects to spike with rewrite
5. National Honor Society (3.5) — ✏️ Needs description rewrite
   (connect to your spike with a compelling description)
```

---

## Cost Transparency for Users

### What Users Should Know

| Scenario | API Calls | Cost | Time |
|----------|-----------|------|------|
| First scoring (10 activities, no teaching) | 3 | ~$0.05 | ~5s |
| First scoring (10 activities, with teaching) | 4 | ~$0.14 | ~8s |
| Re-score after editing 1 activity | 3-4 | ~$0.03 | ~3s |
| Re-score after editing 3 activities | 3-4 | ~$0.04 | ~4s |
| Re-score with no changes (sanity check) | 1-2 | ~$0.02 | ~2s |
| Force fresh (ignore cache) | 3-4 | ~$0.05-0.14 | ~5-8s |

### Cache Efficiency Over a Typical Session

```
Scoring Request 1:  10 fresh    0 cached   Cost: $0.14  (first run + teaching)
Scoring Request 2:   1 fresh    9 cached   Cost: $0.05  (edited 1 description)
Scoring Request 3:   1 fresh    9 cached   Cost: $0.05  (edited another)
Scoring Request 4:   2 fresh    8 cached   Cost: $0.06  (edited 2 activities)
Scoring Request 5:   0 fresh   10 cached   Cost: $0.03  (no changes, portfolio only)
                                           ─────
                     Total session cost:    $0.33
                     Without caching:       $0.70
                     Savings:               53%
```

---

## Summary: The Ideal User Flow

```
1. ENTER     → User inputs 5-10 activities
                (150-char descriptions, hours, grades, achievements)

2. SCORE     → One click scores entire portfolio
                (3 API calls, ~5 seconds, ~$0.05)
                User sees: Overall 7.9/10, Harvard Rating 2

3. UNDERSTAND → User drills into individual scores
                 Sees which activities are strong vs weak
                 Understands WHY through component breakdowns

4. LEARN     → Teaching layer shows HOW to improve (ROI-first)
                Deepen spike: push strongest activities higher
                Amplify: quick rewrites for mid-tier activities
                Elevate: craft compelling descriptions for all activities
                Research-backed principles throughout

5. APPLY     → User clicks "Apply" on a suggested rewrite
                Description field updates
                System marks activity as "changed"

6. RE-SCORE  → User clicks "Re-Score"
                9 cached, 1 fresh
                Sees: "ML Research: 7.8 → 8.6 (+0.8)"
                Feels: "That was fast, and it actually worked"

7. REPEAT    → User applies more suggestions
                Each edit-score cycle feels instant
                Scores climb incrementally

8. CELEBRATE → Portfolio Score: 7.9 → 8.4
                All descriptions polished
                Clear spike narrative
                Ready for Common App
```

**The core insight**: The system's value isn't just in the scores — it's in the *strategic guidance* that tells students where to invest their time for maximum impact. The iterative improvement loop turns good descriptions into compelling ones. The real value is teaching students to deepen their strengths while showcasing every activity in its best possible light. Every Common App slot is valuable real estate — and every activity deserves a polished, compelling description. Caching makes the edit-score loop feel effortless.

---

*Generated for Uplift Activity Scoring System v2.0*
*Architecture: 3-4 batch API calls | Haiku for scoring, Sonnet for teaching*
*Caching: Session-based, SHA-256 content-addressable, quality-preserving*
