# Prompt 3: Left Pane — Edit Tab (Description Editor with Highlights)

> Attach `00-context.md` with this prompt.

---

Build out the "Edit" tab in the left pane. This is where students fill out their extracurricular details and edit their description with real-time AI highlighting.

## What It Shows

When a student selects an activity and is on the Edit tab, they see:

1. **Activity details** (title, role, organization, hours, years) — editable fields
2. **Description editor** with inline text highlighting from our AI analysis
3. **Recommended description** with copy button and change explanations
4. **Character counter** (Common App limit: 150 characters)

## Text Highlighting — The Key Feature

Our AI returns "references" — exact substrings from the student's description with labels. The editor highlights these inline:
- **Green highlights**: Strengths (things working well)
- **Amber highlights**: Issues (things to improve)
- **Blue highlights**: Context (informational)

Hovering a highlight shows a tooltip with the label.

**Real example from our E2E output (Machine Learning Research):**

```
Description: "Worked with professor on NLP project analyzing rural healthcare
access patterns. Built data pipeline processing 50,000 patient records.
Co-authored paper submitted to undergraduate journal."

Highlights:
  GREEN: "Built data pipeline processing 50,000 patient records" → "builder identity + scale"
  GREEN: "NLP project" → "technical specificity"
  GREEN: "Co-authored paper submitted to undergraduate journal" → "external validation"
  GREEN: "rural healthcare access patterns" → "socially relevant"
  AMBER: "Worked with professor" → "vague institutional affiliation"
  AMBER: "undergraduate journal" → "unnamed publication"

Recommended: "Co-authored NLP research paper (submitted to [Journal]) on rural
healthcare access. Designed data pipeline (50K records); findings presented
to County Health."  (158 chars — 8 over limit, shown in amber)

Changes explained:
  - Led with 'Co-authored research paper' instead of 'Worked with professor': Leads with strongest credential
  - Changed 'Built' to 'Designed': Signals intellectual ownership
  - Added journal name placeholder: Provides institutional specificity
  - Compressed '50,000 patient records' to '50K records': Saves characters while preserving scale
```

## How Highlighting Works

Use `description.indexOf(quotedText)` to find each reference's position. Wrap matches in colored spans. If indexOf returns -1, skip it. References come from three places in the teaching data:
- `celebration.references[]`
- `strengthTeaching[].references[]`
- `improvementTeaching[].references[]`

Merge all references for the current activity into one array for highlighting.

## Layout

- Activity metadata fields at top (compact form)
- Large description textarea with colored highlights overlaid
- Character count below: "189/150" in red if over, "142/150" in green if under
- "Recommended" card below with green border, copy button, and collapsible change explanations
- The recommended version also shows its character count

Think Grammarly-style highlighting — the description looks like a document with colored markup showing what's strong and what needs work.
