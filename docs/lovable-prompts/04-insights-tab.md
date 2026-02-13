# Prompt 4: Left Pane — Insights Tab (Teaching + Scoring + Guidance)

> Attach `00-context.md` + the Machine Learning Research teaching section from `ACTIVITY_WORKSHOP_E2E_SAMPLE_OUTPUT.txt` with this prompt.

---

Build out the "Insights" tab in the left pane. This is the richest section — everything our AI analyzed about the currently selected activity, organized into scrollable sections.

## What It Shows

For the currently selected activity, display these sections in order:

### 1. Celebration (always first)
The system always leads with what's working. Real example:

```
🎉 "Your phrase 'Built data pipeline processing 50,000 patient records'
is exactly what MIT wants to see — not 'helped with research' but
'BUILT infrastructure at scale.'"

+ Technical specificity (NLP, data pipeline) proves real CS work
+ Scale (50,000 records) gives admissions concrete sense of complexity
+ Socially relevant application (rural healthcare) — powerful for first-gen narrative
+ Tangible deliverable (co-authored paper) provides external validation
```

Green/warm styling. This should feel encouraging.

### 2. Tier Assessment
```
TIER 2 — Distinguished (State/Regional Recognition)

Why: Co-authored paper + technical depth + social relevance

What makes this tier:
- Technical complexity (data pipeline for 50K records)
- External validation (co-authorship)
- Social relevance

How to reach Tier 1:
- Publication acceptance (submitted → published)
- First-author status
- National recognition (ISEF, Regeneron STS)
```

Tier badges: T1 gold, T2 blue, T3 green, T4 gray.

### 3. Strengths (expandable cards, green accent)
Each strength expands to show "why it matters" and "how to leverage."

```
▶ Builder Identity with Technical Depth
  Why: MIT looks for students who BUILD things, not just study them. "Built data pipeline"
  signals maker identity — problem → solution → implementation.
  Leverage: Thread this builder identity through your entire application...

▶ Socially Relevant Technical Application
  Why: Connecting NLP to rural healthcare is authentic to your lived experience...
  Leverage: Use as narrative bridge between 'technical excellence' and 'community responsibility'...

▶ External Validation Through Co-Authorship
  Why: Co-authorship is RARE for high school students...
  Leverage: Lead with it in your activity description...
```

### 4. Improvements (expandable cards, amber accent, sorted by priority)
Each improvement shows priority badge, explanation, and before/after example.

```
▶ [HIGH] Missing Context: Which university? Which professor? Which journal?
  Why: Vagueness triggers red flags for admissions officers...
  Fix: Add institution name, professor name, journal name
  Before: "Worked with professor on NLP project analyzing rural healthcare access patterns."
  After:  "Worked with Dr. [Name], UC [City] CS Dept, on NLP project analyzing rural
           healthcare access patterns in [State/Region]."

▶ [HIGH] Hidden Impact: What did the research FIND?
  Before: "Built data pipeline processing 50,000 patient records."
  After:  "Built data pipeline processing 50,000 patient records; identified 3x disparity
           in specialist access for rural patients."
```

Before/after is the most impactful visual — show these prominently, side by side or as a diff.

### 5. Scoring Breakdown (if available — optional data)
When scores exist:
```
Combined: 7.2/10 (Activity: 7.8 × 0.7 + Description: 5.8 × 0.3)

Activity Score: 7.8/10
  Tier Assessment    8/10  (30%)
  Recognition        7/10  (25%)
  Commitment         8/10  (17.5%)
  Community          7/10  (15%)
  Leadership         8/10  (12.5%)

Description Score: 5.8/10
  Role Ownership     6/10  (25%)
  Evidence of Impact 5/10  (25%)
  Differentiation    7/10  (20%)
  Action Precision   5/10  (15%)
  Quantification     5/10  (15%)
```

If scoring is undefined, show "Scoring not available for this session" — don't break.

### 6. Narrative Guidance
```
How to talk about this:
"Frame it as the moment you realized CS is infrastructure for equity, not just
algorithms. Lead with: 'I co-authored a research paper analyzing healthcare
access in rural communities using NLP...'"

Your unique angle:
"You chose a socially relevant application that connects to your lived experience,
AND built production-level infrastructure, AND achieved external validation under
Level 3 constraints."

Interview tips:
1. Use the 30-second formula: Problem → Solution → Finding → Impact
2. Be ready to explain your specific contribution (pipeline design)
3. Avoid generic answers — connect to real-world impact
4. If paper still pending, address proactively as learning opportunity
```

### For Quick Encouragement Activities
If the selected activity is a "quick" teaching candidate (already strong), show just the celebration and a quick tip instead of the full teaching. Real example:

```
🌟 Computer Science Club Founder

"Your phrase 'Started the first CS club at my school since we had no STEM clubs'
immediately signals to AOs that you're a builder who identifies gaps and fills them."

Why it's strong: This perfectly anchors your innovator archetype and first-gen story.

Quick tip: Add one concrete outcome from the hackathon (e.g., '40 students participated')
to show the ripple effect.
```

## Style
- Celebration: warm green accents, celebration icon
- Strengths: green left border, expandable
- Improvements: amber left border, priority badges (high=red, medium=amber, low=blue), expandable
- Before/After: visual diff, most prominent element in improvements
- Scoring: clean horizontal bars with percentage labels
- All sections collapsible to manage density
