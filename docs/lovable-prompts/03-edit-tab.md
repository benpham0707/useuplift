# Prompt 3: Edit Tab — Description Editor with Highlights

> Attach [00-context.md](./00-context.md) with this prompt.

**Prev**: [02 — Split-Pane Layout](./02-split-pane-layout.md) | **Next**: [04 — Insights Tab](./04-insights-tab.md)

---

Build the "Edit" tab in the left pane of the split-pane layout from [Prompt 02](./02-split-pane-layout.md). This is where students fill out their activity details and edit their description with real-time AI highlighting.

## What the Student Sees

When they select an activity and are on the Edit tab:

1. **Activity details** — editable fields for title, role, organization, hours/week, weeks/year, grade levels
2. **Description editor** — a large text area with colored inline highlights from the AI analysis
3. **Character counter** — Common App limit is 150 characters. Shows "142/150" in green when under, "189/150" in red when over
4. **Recommended description** — the AI's improved version with a copy button and explanations of what changed

## Text Highlighting — The Key Feature
> Data source: references from `stage2.teachingDelivered[].teaching.celebration.references`, `stage2.teachingDelivered[].teaching.strengthTeaching[].references`, `stage2.teachingDelivered[].teaching.improvementTeaching[].references` — [see type in context](./00-context.md#stage-2--teaching)

This is the signature feature. Think Grammarly-style — the student's description appears like a document with colored markup showing what's strong and what needs work.

Our AI returns "references" — exact substrings from the student's description with labels. Each reference has:
- `quotedText`: the exact substring to find in the description
- `type`: `"strength"` | `"issue"` | `"context"`
- `label`: tooltip text explaining why

Use `description.indexOf(quotedText)` to find each reference's position. Wrap matches in colored spans. If indexOf returns -1, skip it.

The editor highlights these inline:
- **Green highlights** = Strengths (things working well)
- **Amber highlights** = Issues (things to improve)

Hovering a highlight shows a tooltip with the label.

**Real example (Machine Learning Research):**

The description reads: *"Worked with professor on NLP project analyzing rural healthcare access patterns. Built data pipeline processing 50,000 patient records. Co-authored paper submitted to undergraduate journal."*

Highlights:
- 🟢 "Built data pipeline processing 50,000 patient records" → tooltip: "builder identity + scale"
- 🟢 "NLP project" → tooltip: "technical specificity"
- 🟢 "Co-authored paper submitted to undergraduate journal" → tooltip: "external validation"
- 🟢 "rural healthcare access patterns" → tooltip: "socially relevant"
- 🟠 "Worked with professor" → tooltip: "vague institutional affiliation"
- 🟠 "undergraduate journal" → tooltip: "unnamed publication"

Merge all references from celebration, strengths, and improvements into one array for highlighting.

## Recommended Description
> Data source: `stage2.teachingDelivered[].teaching.descriptionOptimization` — [see type in context](./00-context.md#stage-2--teaching)

Below the editor, show the AI's improved version:

> "Co-authored NLP research paper (submitted to [Journal]) on rural healthcare access. Designed data pipeline (50K records); findings presented to County Health." (158 chars — 8 over, shown in amber)

With a collapsible section explaining each change (from `changesExplained` array):
- Led with "Co-authored research paper" instead of "Worked with professor" → Leads with strongest credential
- Changed "Built" to "Designed" → Signals intellectual ownership
- Compressed "50,000 patient records" to "50K records" → Saves characters while preserving scale

## Layout

- Compact form fields at top (from the pipeline input — [see input type in context](./00-context.md#pipeline-input))
- Large description textarea with colored highlights overlaid
- Character count below the editor
- Recommended description card below with green border, copy button, and collapsible change explanations
