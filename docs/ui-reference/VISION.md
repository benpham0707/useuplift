# Activity Workshop UI/UX Vision

> **This is the north-star document for all Activity Workshop frontend work.**
> Every design decision, component, and interaction should trace back to something in this file.
> Written collaboratively between Tue and Claude, Feb 2026.

---

## The One-Sentence Vision

A high schooler opens the Activity Workshop, immediately sees what an amazing portfolio analysis
looks like, gets excited, fills in their own activities, and within minutes has a personalized
roadmap that makes them feel understood — not judged — by something smarter than any tool
they've used before.

---

## Target User

**High school juniors and seniors (16-18 years old)** applying to college.

### What We Know About Them

- **Short attention span for tools.** If they don't understand the value in ~2 minutes, they
  bounce. They are not proactive — we must lead them to the value, not leave it to their agency.
- **Visually literate.** They live on Spotify, Discord, TikTok, Instagram. They unconsciously
  judge quality by visual polish. A plain/dull interface signals "this is homework."
- **Anxiety-driven.** College apps are stressful. The tool should feel empowering, not like
  another evaluation that might tell them they're not good enough.
- **Copy-paste pragmatic.** They want actionable output they can directly use in their Common App.
  Insights are nice, but "give me the better description I can paste" is what they really want.
- **Mobile-sometimes.** They'll likely start on desktop (filling out activities) but may check
  results on their phone. Both must work.

---

## Overall Feel & Energy Level

### Aesthetic: Spotify/Discord Energy

Not plain like Type.ai. Not cartoonish like Duolingo. Think:

- **Bold color usage** — vibrant accents on a clean background. Color has meaning and draws
  attention to what matters.
- **Cards with personality** — subtle depth, hover responses, visual weight that makes data
  feel tangible.
- **Progress feels rewarding** — visual feedback when they add activities, when scores calculate,
  when they complete actions. Small dopamine hits throughout.
- **Information density done right** — lots of data on screen but organized so it feels
  approachable, not overwhelming. Like a well-designed Spotify artist page that shows albums,
  top tracks, related artists, and bio without feeling cluttered.

### What It's NOT

- Not a spreadsheet with colors on it
- Not a generic dashboard template
- Not a gamified app with badges and streaks (no fake engagement)
- Not minimalist to the point of being cold
- Not so busy that it's distracting from the actual content

### Reference Apps

| App | What to Borrow |
|-----|---------------|
| **Spotify** | Bold color on dark/light backgrounds, clear hierarchy, card-based content |
| **Discord** | Personality without childishness, sidebar + main content pattern |
| **Linear** | Information density, clean typography, keyboard-first feel |
| **Notion** | Warm feel, readable at every size, content-first |
| **Arc Browser** | Tasteful color accents, smooth transitions |

---

## Page Architecture

### The Unlock Pattern (Key UX Innovation)

The Activity Workshop page uses a **"show the product, gate behind input"** model:

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTIVITY WORKSHOP                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EXAMPLE PORTFOLIO (muted/desaturated)               │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │  Score Dashboard: 82/100                      │    │    │
│  │  │  "Strong — Competitive for top UCs,           │    │    │
│  │  │   reach for Ivy League CS programs"           │    │    │
│  │  └──────────────────────────────────────────────┘    │    │
│  │  ┌──────────┬──────────┬──────────┬──────────┐      │    │
│  │  │ Overview │ Story    │ Edge     │ Actions  │      │    │
│  │  └──────────┴──────────┴──────────┴──────────┘      │    │
│  │  [Full example results — readable but desaturated]   │    │
│  │  [All sections browsable but not interactive]        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  YOUR ACTIVITIES (full color, vibrant, interactive)  │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │  ✨ Add your activities to get YOUR score     │    │    │
│  │  │  [Activity Input Form — Mirror Common App]    │    │    │
│  │  │  [+ Add Activity]                             │    │    │
│  │  └──────────────────────────────────────────────┘    │    │
│  │                        [Analyze My Portfolio →]       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**

1. **On first load**: The page shows a pre-built example of an excellent portfolio analysis.
   All result sections (score dashboard, tabs, insights) are visible and browsable — but
   rendered in **muted/desaturated colors** (grayscale at ~60% opacity). The student can scroll
   through and see exactly what they'll get.

2. **The only full-color, interactive element** is the activity input form at the bottom. It
   has vibrant brand colors, a glowing/accented border, and a clear CTA: "Add your activities
   to get YOUR score."

3. **The contrast** between the muted example and the vibrant input form creates a natural
   visual funnel. The eye is drawn to the interactive element. The muted results create desire
   ("I want MINE to look like that").

4. **Once they submit**: The muted example transitions out and their real results animate in,
   fully saturated and alive. This is the "unlock" moment — the page comes to life with their
   personal data.

### After Unlock: Results Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SCORE DASHBOARD (pinned at top)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Overall: 78/100                                      │   │
│  │  "Competitive — Strong match for UC system,           │   │
│  │   developing for Highly Selective CS programs"         │   │
│  │                                                        │   │
│  │  [Strength: 8.2] [Spike: 6.8] [Story: 7.4]           │   │
│  │  [Major Fit: 8.0] [Description: 7.1]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Overview │ Story    │ Edge     │ Actions  │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                             │
│  [Tab content scrolls below]                                │
│                                                             │
│  ┌──────┐  Chat panel (collapsible) ──────────────────┐    │
│  │ 💬   │  "Ask me about your scores or how to        │    │
│  │      │   improve any activity..."                   │    │
│  └──────┘──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Score dashboard** stays pinned/visible while scrolling through tabs. Clicking a dimension
score opens a detail panel explaining the rationale.

**4 Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | Portfolio-level insights: tier distribution, narrative threads, strengths summary |
| **Your Story** | The narrative the portfolio tells admissions officers. What themes emerge, what's the throughline |
| **Your Edge** | Spike detection, what makes this student unique, competitive advantages |
| **Action Plan** | Prioritized before/after improvements with edit-in-place + fabrication guardrails |

---

## Score System

### Overall Score: X/100 + College Tier Context

The headline score is out of 100 (familiar to students, like a grade). Alongside it, a
**college tier label calibrated to the student's intended major**.

**Example displays:**
- `82/100 — Strong for UC system Business programs, competitive for Highly Selective`
- `91/100 — Elite — Ivy-competitive for CS applicants`
- `65/100 — Developing — solid for Selective schools, room to grow for top UCs`

**Tier calibration** uses the student's intended major (asked during first input) and maps
against our existing 6-tier system:
1. Ivy/Elite (Stanford, MIT, Ivies)
2. Highly Selective (top 20 nationals, top UCs)
3. Very Selective (strong state flagships, mid-UCs)
4. Selective (good state schools)
5. Competitive (most 4-year institutions)
6. Accessible (open/near-open enrollment)

### Dimension Scores: 5 dimensions, each X/10

| Dimension | What It Measures |
|-----------|-----------------|
| Activity Strength | Quality distribution across Tier 1-4 activities |
| Spike Depth | Focused area of exceptional depth |
| Story Coherence | Do activities tell a unified story? |
| Major Fit | Alignment with intended major |
| Description Quality | How well descriptions are written |

These are shown as interactive tiles. Clicking one opens a detail panel with the full rationale
and related recommendations.

### Score Color Mapping

| Range | Color | Label |
|-------|-------|-------|
| 90-100 | Green | Elite |
| 80-89 | Teal/Cyan | Strong |
| 70-79 | Blue | Competitive |
| 60-69 | Amber | Developing |
| 0-59 | Orange/Red | Needs Work |

---

## Activity Input Form

### Fields (Mirrors Common App)

| Field | Type | Required |
|-------|------|----------|
| Activity Type | Dropdown (Academic, Art, Athletics, Community Service, etc.) | Yes |
| Position/Role | Text input | Yes |
| Organization Name | Text input | Yes |
| Description | Textarea (150 char limit, matching Common App) | Yes |
| Hours per Week | Number input | No |
| Weeks per Year | Number input | No |
| Grade Levels | Multi-select (9, 10, 11, 12) | No |

### Input UX Details

- **Minimum to analyze: 1 activity.** Low barrier to entry. Portfolio-level insights (story
  coherence, spike detection) improve as more activities are added. We surface this:
  "You've added 2 activities. Add more for deeper portfolio insights."
- **Maximum: 10 activities** (matches Common App).
- **Auto-save**: Progress saves automatically (requires Clerk auth). Student can close the
  tab and return later with everything intact.
- **Progressive encouragement**: After adding 1-3, show a message like "Great start! Students
  who add 5+ activities get much richer insights."

### Chat Available During Input

A **collapsible right panel** (toggled by button) provides AI chat assistance while filling
in activities. The student can ask:
- "How should I describe my robotics club?"
- "Is tutoring considered community service or academic?"
- "What should I emphasize about my part-time job?"

The chat is contextual — it knows what activities the student has entered and can reference
them. This is the existing Activity Chat system.

---

## Individual Activity Results

### Ranked by Strength

Activities are displayed as a list, ranked #1 to #N by overall strength score.

Each activity card shows:
- **Rank number** (visual hierarchy: #1 gets hero treatment)
- **Activity name + role**
- **Tier badge** (Tier 1: Exceptional, Tier 2: Strong, etc.)
- **Score** (individual activity score)
- **One-line key insight** ("Your leadership role here is your strongest signal")
- **Expand arrow** → opens full analysis

### Expanded Activity View

When clicked/expanded, shows:
- Full scoring breakdown
- Detailed analysis text
- Description quality assessment
- **Before/after description** (with fabrication guardrails — see below)
- Related recommendations from the Action Plan

---

## Action Plan Tab

### Before/After with Fabrication Guardrails

Each activity gets a prioritized recommendation showing:
1. **Priority tag**: High / Medium / Low
2. **Current description** (what the student wrote)
3. **Improved description** (AI-generated suggestion)

### The Fabrication Edit Pattern

**Critical UX pattern for integrity:**

When the AI doesn't have real details from chat (student hasn't discussed this activity
with the AI advisor), the improved description will contain **fabricated example details**
as inspirational placeholders.

**How it works in the UI:**

```
┌─────────────────────────────────────────────────────┐
│  YOUR DESCRIPTION                                    │
│  "Member of robotics club. Built robots."            │
│                                                      │
│  SUGGESTED IMPROVEMENT                      [Accept] │
│  "As robotics team lead, I ██████████████████████    │
│   ██████████████████████ which increased our team's  │
│   competition score by ████████. I also ████████████ │
│   ████████████████████████ training 12 new members." │
│                                                      │
│  ⚠️ Highlighted sections contain example details.    │
│  Edit them with YOUR real experiences before          │
│  accepting.                                          │
│                                                      │
│  [Accept] ← disabled until all highlights edited     │
└─────────────────────────────────────────────────────┘
```

- **Fabricated sections** are highlighted (distinct background color, or inline highlight)
- Student MUST click into and edit each highlighted section
- The highlight clears once they've modified the text
- **"Accept" button stays disabled** until all fabricated sections are edited
- If the student HAS chatted about this activity and provided real details, no highlights
  appear and they can accept directly

This ensures students never accidentally submit AI-fabricated content in their college
applications.

---

## Sharing & Export

### PDF Export
- Polished PDF of the full portfolio analysis
- Student can share with parents, counselors, or keep for reference
- Should look professionally designed, not a raw data dump

### Share Link
- Generate a unique read-only URL
- Anyone with the link can view the results (no auth required to view)
- "Show your counselor what the AI found"

---

## Key User Flows

### Flow 1: First-Time Student (Full Journey)

```
1. Lands on Activity Workshop page
2. Sees the muted example portfolio (scores, story, insights)
3. Scrolls through the example, gets excited about what they'll get
4. Eye drawn to the vibrant input form: "Add your activities"
5. Adds first activity (maybe asks chat for help describing it)
6. Adds 2-3 more activities
7. Sees progressive encouragement: "Add 2 more for richer insights"
8. Hits "Analyze My Portfolio"
9. Loading animation → results transition in (muted example fades, real results appear)
10. Score dashboard reveals: "78/100 — Competitive for UC system"
11. Explores tabs: Overview → Story → Edge → Action Plan
12. Opens Action Plan, sees before/after for their weakest activity
13. Edits fabricated highlights, accepts improved description
14. Opens chat: "How can I improve my spike depth score?"
15. Exports PDF to share with their counselor
```

### Flow 2: Returning Student

```
1. Lands on Activity Workshop (logged in)
2. Previous activities and results load immediately (auto-saved)
3. Can add new activities, edit existing ones
4. Re-analyze to see updated scores
5. Continue working on Action Plan items
```

### Flow 3: One-Activity Quick Test

```
1. Student is skeptical, adds just one activity
2. Gets individual activity analysis (score, tier, description feedback)
3. Portfolio-level insights are limited: "Add more for story coherence analysis"
4. Student sees value, adds more activities
```

---

## Emotional Design Moments

These are the micro-moments that make the experience feel alive:

| Moment | What Happens | Why It Matters |
|--------|-------------|---------------|
| Score reveal | Number counts up with the gauge filling | Anticipation + payoff |
| Tier label appears | Fades in after score settles | Contextualizes the number |
| Activity ranked #1 | Subtle glow or highlight on their best activity | Celebrates their strength |
| Before/after diff | Side-by-side with visual improvement indicators | "Wow, that IS better" |
| All fabrication edits done | Accept button activates with a satisfying state change | Completion reward |
| Adding 5th activity | Brief celebration: "Now we can see your full story" | Progress milestone |
| Chat gives a great insight | The relevant score tile pulses briefly | Connection between chat + data |

---

## Technical Integration Notes

### Backend Data Sources

The results UI renders data from the existing Activity Workshop pipeline:

- **Stage 0** (Story/Haiku): Story context extraction
- **Stage 1** (Analysis+Scoring/Sonnet): Individual activity analysis and scoring
- **Stage 2** (Teaching/Sonnet): Teaching feedback and description improvements
- **Stage 3** (Synthesis/Haiku): Portfolio-level narrative synthesis

### Key Type: `ActivityWorkshopResult`

The complete pipeline output. Contains:
- `scoringRubric` — overall + dimension scores, breakdowns, recommendations
- `activityAnalyses[]` — per-activity analysis, tier, description feedback
- `narrativeSynthesis` — story threads, portfolio narrative, spike detection
- `actionPlan` — prioritized recommendations with before/after descriptions

### Chat Integration

The collapsible chat panel uses the existing Activity Chat system:
- `conversationManager.ts` — manages chat state
- `conversationModeService.ts` — context-aware responses
- `questionGenerator.ts` — generates follow-up questions
- Chat profiles feed into pipeline via `profileBridge.ts` (bidirectional integration)

### Auth Requirement

Clerk authentication required for:
- Auto-save functionality
- Returning to previous results
- PDF export
- Share link generation

The example/showcase view should work without auth (they can browse the muted example).
Auth prompt appears when they try to analyze or save.

---

## What Success Looks Like

A student should be able to:
1. **Understand what this tool does** within 30 seconds of landing (the example shows them)
2. **Start inputting activities** within 2 minutes (the form is the obvious next step)
3. **See their first result** within 5 minutes (low minimum, fast pipeline)
4. **Walk away with something actionable** (improved descriptions they can paste into Common App)
5. **Feel understood**, not judged ("This gets me in a way my counselor doesn't")
6. **Want to come back** and add more activities, share with friends

---

*This document is a living reference. Update it as the product evolves and we learn from
real student usage.*
