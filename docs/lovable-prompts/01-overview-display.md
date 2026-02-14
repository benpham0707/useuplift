# Prompt 1: Extracurricular Portfolio Overview Display

> Attach [00-context.md](./00-context.md) with this prompt.

**Prev**: — | **Next**: [02 — Split-Pane Layout](./02-split-pane-layout.md)

---

Build the top section of the Activity Workshop page — a comprehensive overview of the student's entire extracurricular portfolio. This is everything holistic — the portfolio-wide picture before they dive into individual activities below.

The per-activity details (teaching, improvements, scoring breakdowns) live on the individual activity pages in [Prompt 04](./04-insights-tab.md). Everything else — the big picture — lives here.

## Inspiration

Take direct inspiration from our existing Portfolio Scanner hero section (`src/pages/PortfolioScanner.tsx`). It has clickable metric tiles with glow effects, a collapsible insights panel, and gradient backgrounds. Adapt and evolve that pattern — but this section has much more content, so use collapsible sections, progressive disclosure, or a card-based layout to manage density.

---

## Sections to Display

### 1. Top-Line Assessment
> Data source: `stage3.finalAssessment` + `stage1.tierDistribution` + `finalNarrative.coherence` — [see type in context](./00-context.md#stage-3--synthesis)

The headline numbers that tell the student where they stand:

- **Harvard Scale**: 3 out of 6 — "Competitive" (confidence: 78%)
- **Overall Strength**: "competitive"
- **Coherence Score**: 78/100 — how well all activities tell one unified story
- **Tier Distribution**: T1=0, T2=2, T3=2, T4=1 (visualized as small bar or dot chart)

Display as premium metric tiles — clickable, with glow effects and visual weight. Think dashboard KPIs.

### 2. Student Identity & Story
> Data source: `stage0.narrativeIdentity` + `stage0.spikeHypothesis` — [see type in context](./00-context.md#stage-0--story-detection)

- **Archetype**: "Innovator" (confidence: 78%) — badge or tag
- **Story Essence**: "A first-gen student who creates infrastructure and teaches others, driven by genuine intellectual curiosity in CS and deep responsibility to their community and family."
- **Primary Theme**: "Building systems and solving problems to create opportunity — whether through technology, education, or family responsibility"
- **Secondary Themes**: Bridging access gaps, Taking initiative in resource-constrained environments, Balancing ambition with family obligation
- **Spike**: Computer Science & Educational Leadership (maturity: "mature")

The story essence and spike should be visually prominent — this is the emotional centerpiece.

### 3. Contextual Factors
> Data source: `stage0.contextualFactors` — [see type in context](./00-context.md#stage-0--story-detection)

The AI identifies the student's circumstances that color how admissions officers read their activities:

- **Work/Family**: "Works 20 hrs/week at grocery store to support family (3,120 hours over 3 years). Contributes 15 hrs/week to family farm during growing season (1,200 hours). These are not enrichment activities — they are survival/responsibility."
- **Resource Constraints**: "First-generation, low-income student. School had NO STEM clubs before this student founded one. Research collaboration is remote."
- **Geographic**: "Rural context evident from farm work and research focus on rural healthcare access. Limited access to traditional STEM opportunities."
- **First-Generation**: Yes

Show as context badges or a collapsible panel — critical framing for everything else.

### 4. Narrative Threads
> Data source: `stage0.narrativeThreads` — [see type in context](./00-context.md#stage-0--story-detection)

Thematic threads that weave through multiple activities:

- **Building Educational Infrastructure** [strong]: CS Club, Tutoring
  - "Founded the school's first CS club from scratch, taught 25 students, organized a 60-person hackathon. Independently tutors 8 middle schoolers. Shows pattern of identifying gaps and creating systems to fill them."
- **Technical Problem-Solving & Research** [strong]: Research, CS Club
  - "Co-authored ML research paper on healthcare access, built data pipeline for 50K records. Demonstrates progression from learning to teaching to research-level work."
- **Family & Community Responsibility** [strong]: Grocery, Farm
  - "4,320 total hours across work and farm over 3 years. Promoted to shift lead. These aren't side activities — they're central to student's life."
- **Rural/Access-Focused Lens** [emerging]: Research, Farm, Tutoring
  - "Research on rural healthcare access. Farm work grounds student in agricultural community. Tutoring serves underserved middle schoolers."

Each thread shows which activities belong to it and strength (strong/emerging/weak).

### 5. Activity Story Roles
> Data source: `stage0.activityStoryRoles` — [see type in context](./00-context.md#stage-0--story-detection)

How each activity functions in the student's overall narrative:

- **CS Club Founder**: core_identity (centrality: 95) — "This is THE defining activity. Founding the school's first CS club demonstrates initiative, leadership, and passion."
- **ML Research**: passion_pursuit (centrality: 88) — "Co-authoring an ML research paper shows intellectual depth beyond typical high school CS."
- **Grocery Store**: obligation (centrality: 92) — "3,120 hours — the largest time commitment. Family financial support, not enrichment."
- **Family Farm**: obligation (centrality: 85) — "1,200 hours of family contribution. Grounds student in agricultural/rural community."
- **Tutoring**: impact_vehicle (centrality: 75) — "Demonstrates commitment to education access and teaching."

Show as a visual map or card layout — each activity tagged with its role and centrality score.

### 6. Story Pitch & Narrative
> Data source: `finalNarrative.story` — [see type in context](./00-context.md#final-narrative)

The AI's compelling summary of who this student is:

> **Story Pitch**: "This student taught themselves machine learning while stocking shelves at night, then used NLP to analyze healthcare gaps in their own rural community — turning a 20-hour work week and family farm obligations into the foundation for research that matters. They didn't just learn CS despite their circumstances; they learned CS *because* of them."

This should be the most visually prominent text on the entire page. Quotable, inspiring, centerstage.

Also display:
- **Unique Angle**: What makes this student different from others
- **Emergent Traits**: Character traits that emerge from the portfolio as a whole

### 7. Narrative Threads with Synergy
> Data source: `finalNarrative.threads` — [see type in context](./00-context.md#final-narrative)

How groups of activities strengthen each other (different from section 4 — these include synergy explanations):

- **Technology as Community Infrastructure**: CS Club + Research + Tutoring
  - "Together, these show a consistent pattern: identify gap → build solution → share knowledge. The research validates the CS Club work, while tutoring shows commitment to lifting others."
- **Responsibility-Driven Excellence**: Grocery + Farm + Research
  - "The work experience makes the research MORE impressive (they did it with 1/3 the free time of peers). Admissions sees resilience + capability."
- **First-Generation STEM Pipeline Builder**: CS Club + Tutoring + Research
  - "Each activity reinforces their identity as a STEM access advocate."

### 8. Activity Elevations
> Data source: `finalNarrative.elevations` — [see type in context](./00-context.md#final-narrative)

How one activity makes another MORE impressive — this is unique and powerful:

- **Grocery → Research** [transformative]: "The 3,120 hours of paid work transforms the research from 'impressive' to 'extraordinary.' Most research students have summers free; this student built a data pipeline while working retail shifts."
- **Research → CS Club** [strong]: "The ML research validates that the CS Club curriculum wasn't basic — this student was teaching Python while personally working on NLP and data pipelines."
- **Farm → Research** [strong]: "The farm work shows early systems thinking and data management that directly connects to building data pipelines."
- **CS Club → Tutoring** [moderate]: "The CS Club proves the tutoring isn't just homework help — this student knows how to design curriculum."
- **Farm → CS Club** [strong]: "The farm and grocery work make the CS Club MORE impressive — carved out time for intellectual community-building despite massive family obligations."

Show as connections — arrows, a relationship diagram, or connecting cards. Strength label (transformative/strong/moderate/subtle) indicates how powerful the elevation is.

### 9. Recommended Common App Order
> Data source: `stage3.orderedActivities` — [see type in context](./00-context.md#stage-3--synthesis)

The AI's recommended order for listing activities on the Common App:

1. **ML Research** — "Your strongest differentiator — Tier 2, demonstrates intellectual maturity, directly aligns with MIT/GT expectations."
2. **CS Club Founder** — "Initiative and educational leadership, addresses real gap"
3. **Family Farm** — "Most compelling first-gen/context story"
4. **Grocery Store** — "Work ethic, earned promotion"
5. **Tutoring** — "Reinforces teaching theme, but weakest link"

Each with a brief reason explaining the ranking.

### 10. Portfolio-Level Teaching
> Data source: `stage2.portfolioTeaching` — [see type in context](./00-context.md#stage-2--teaching)

Strategic advice about the portfolio as a whole:

- **Current State**: "Potential spike exists but is not clearly presented"
- **Recommendation**: "Focus on strengthening connections between activities so admissions readers see a clear narrative thread"
- **Two-Sentence Pitch**: The AI's suggested elevator pitch for the portfolio
- **Coherence Score**: 60/100 (initial) with specific improvement suggestions:
  - "Family Farm Work feels disconnected from your narrative. Show how this experience shaped your CS perspective."
  - "Grocery Store feels disconnected. Show how this shaped your skills."
- **Strategic Direction**: "CS Club Founder shows the most promise as spike. Deepening impact there could develop it into a genuine differentiator."

### 11. Action Plan
> Data source: `stage3.actionPlan` — [see type in context](./00-context.md#stage-3--synthesis)

What the student should do next, organized by timeline:

**Do Now:**
- Quantify ML research impact — get exact numbers from professor → "This is your Tier 1 potential — specificity transforms it from 'worked on a project' to 'contributed to peer-reviewed research.'"
- Document CS Club growth trajectory — how many students per semester? → "Turns 'started a club' into 'built a sustainable STEM pathway.'"
- Gather farm metrics — acreage, equipment value, efficiency improvements → "This is your most distinctive first-gen story — specificity makes it memorable."

**Next Few Months:**
- Follow up on paper submission timeline — "Published research is a game-changer for MIT/GT" (deadline: before applications open)
- Identify 1-2 CS Club students who had breakthroughs — "Specific examples of student success are far more compelling than general claims" (deadline: before interviews)
- Evaluate if tutoring hours are best use of time vs. deepening spike activities (deadline: next 4 weeks)

**Long-Term:**
- Develop capstone narrative connecting all five activities around core theme → "Coherence is your biggest weakness (60/100). A unified narrative transforms scattered activities into a compelling portrait."
- Frame first-gen + constrained context as STRENGTH, not apology → "MIT and GT explicitly value diversity and first-gen students."
- Explore REU programs at target schools that build on NLP/healthcare work → "Demonstrated interest + research continuity = much stronger application."

Each action item includes its impact explanation.

---

## How It Should Feel

Like a world-class counselor just gave you a comprehensive portfolio review. The metrics should feel premium and polished. The story pitch should be emotionally resonant. The elevations and threads should give "aha" moments — "I never thought about how my grocery job makes my research more impressive." The action plan should feel actionable and motivating, not overwhelming.

## Layout

- **Top row**: Metric tiles (Harvard Scale, Coherence, Spike, Tier Distribution) — clickable with expandable details
- **Story section**: Archetype badge + story essence + story pitch prominently displayed
- **Context badges**: First-gen, work hours, rural — inline near the story
- **Threads & Elevations**: Cards, visual map, or interactive diagram
- **Activity Roles**: Visual showing each activity's role in the story
- **Recommended Order**: Numbered list with ranking reasons
- **Portfolio Teaching & Action Plan**: Collapsible sections at the bottom
- **Mobile**: Stack vertically, metric tiles in 2 columns
