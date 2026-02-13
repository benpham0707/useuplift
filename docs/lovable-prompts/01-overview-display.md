# Prompt 1: Extracurricular Portfolio Overview Display

> Attach `00-context.md` + `ACTIVITY_WORKSHOP_E2E_SAMPLE_OUTPUT.txt` with this prompt.

---

We're building an Activity Workshop page for our college app platform Uplift. This first prompt builds the top section — a holistic overview of the student's extracurricular portfolio.

## Inspiration

Take direct inspiration from our existing `src/pages/PortfolioScanner.tsx` hero section. It has:
- 5 clickable metric tiles in a responsive grid (2 cols mobile, 5 cols desktop)
- Animated gradient background
- Score-based glow effects (colors shift based on score value)
- A collapsible insights panel that opens when you click a metric tile
- A narrative section with editable variants

We want that same structure, evolved to fit the extracurricular data our AI pipeline produces.

## What This Section Displays

This is the "portfolio at a glance" — everything the student needs to know about their extracurricular profile in one view.

**Using real data from our E2E test, here's what we'd show:**

```
Harvard Scale: 3/6 — "Competitive"
Confidence: 78%
Archetype: innovator

Story: "A first-gen student who creates infrastructure and teaches others,
driven by genuine intellectual curiosity in CS and deep responsibility
to their community and family."

Spike: Computer Science & Educational Leadership (emerging)
Coherence: 78/100 (strong)
Tier Mix: T1=0, T2=2, T3=2, T4=1
Activity Score: ~7.2/10 avg (when available)
Description Score: ~5.8/10 avg (when available)

Context: First-gen | Works 20 hrs/week | Rural

Story Pitch: "This student taught themselves machine learning while stocking
shelves at night, then used NLP to analyze healthcare gaps in their own
rural community — turning a 20-hour work week and family farm obligations
into the foundation for research that matters."

Narrative Threads:
- Technology as Community Infrastructure (cs-club, research, tutoring)
- Responsibility-Driven Excellence (grocery, farm, research)
- First-Generation STEM Pipeline Builder (cs-club, tutoring, research)

Top Elevations:
- grocery → research [transformative]: "3,120 hours of paid work transforms
  the research from 'impressive' to 'extraordinary'"
- farm → research [strong]

Recommended Activity Order:
1. research — strongest differentiator, Tier 2
2. cs-club — initiative, educational leadership
3. farm — most compelling first-gen story
4. grocery — work ethic, earned promotion
5. tutoring — reinforces teaching theme

Action Plan:
- DO NOW: Quantify ML research impact, document CS Club growth
- NEXT MONTHS: Follow up on paper submission, identify student success stories
- LONG-TERM: Develop capstone narrative, explore REU programs
```

## Goal

Build this as a self-contained section component. Use mock data matching the shape in `00-context.md` (`stage0`, `stage3.finalAssessment`, `finalNarrative`, `scoring`, `stage1.tierDistribution`). The metric tiles should be clickable with expandable detail panels. The story pitch should be visually prominent. Context badges should clearly show the student's circumstances.

This section needs to feel like a world-class counselor giving you the executive summary of your portfolio.
