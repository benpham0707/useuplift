# Activity Scoring System - Frontend Implementation Notes

This document tracks UI/UX implementation requirements for the Activity Scoring System. These are features that need frontend visualization beyond text display.

---

## 1. Comparative Context Visualization

### API Returns
```typescript
{
  percentile: 92,                    // 0-100 percentile rank
  category: "elite_with_potential",  // Enum for display tier
  categoryLabel: "Elite with Room to Grow",
  nearestThreshold: {
    above: { percentile: 98, requirement: "2+ national-level distinctions" },
    current: { percentile: 92, description: "1 national + strong support" }
  }
}
```

### Frontend Should Display
- **Visual Percentile Indicator:** Progress bar, gauge, or tier chart showing where they stand
- **Category Badge:** Color-coded indicator (e.g., green for 90th+, yellow for 70-90, etc.)
- **Distance to Next Tier:** Visual showing how close they are to the next threshold

### Example Visual Concepts
```
┌─────────────────────────────────────────┐
│  Your Standing: 92nd Percentile         │
│  ████████████████████░░░ │ Top 10%      │
│                                         │
│  Category: Elite with Room to Grow      │
│  ↑ 6 percentile points to Top 2%        │
└─────────────────────────────────────────┘
```

---

## 2. Score Display Components

### Individual Activity Score Card
API returns scores for each activity. Frontend needs visual cards showing:
- Combined score (large, prominent)
- Activity vs Description score breakdown
- Component breakdown with weighted contributions
- Tier classification badge

### Example Layout
```
┌─────────────────────────────────────────┐
│  USA Math Olympiad           9.5/10     │
│  ─────────────────────────────────────  │
│  Activity: 9.8  │  Description: 9.0     │
│                                         │
│  [Tier 1] National Distinction          │
│                                         │
│  ▸ Tier Assessment    10/10 ×30%   = 3.0   │
│  ▸ Recognition        10/10 ×25%   = 2.5   │
│  ▸ Leadership          9/10 ×12.5% = 1.125 │
│  ▸ Community          10/10 ×15%   = 1.5   │
│  ▸ Commitment         10/10 ×17.5% = 1.75  │
└─────────────────────────────────────────┘
```

### Portfolio Score Overview
- Overall score prominently displayed
- Harvard Rating with explanation
- Quick stats (avg activity score, avg description score)
- Ranked list of activities by score

---

## 3. Harvard Rating Display

### API Returns
```typescript
{
  rating: 2,
  label: "Outstanding",
  percentile: "Top 5%",
  indicators: [
    { met: true, label: "National-level distinction" },
    { met: true, label: "Clear depth and focus" },
    { met: true, label: "Impact beyond self" },
    { met: true, label: "Leadership in context" }
  ]
}
```

### Frontend Should Display
- Large rating number with label
- Checklist of what qualifies them for this rating
- What would elevate to next rating (if applicable)

---

## 4. Pathway to Improvement Visualization

### API Returns
```typescript
{
  currentChecklist: [
    { status: "complete", item: "National-level distinction" },
    { status: "complete", item: "Coherent narrative" },
    { status: "complete", item: "Impact beyond self" }
  ],
  improvementChecklist: [
    { status: "incomplete", item: "Second national credential", actionable: true },
    { status: "incomplete", item: "Scaled platform impact", actionable: true },
    { status: "incomplete", item: "Published validation", actionable: false }
  ],
  mostActionablePath: {
    action: "Submit ML research to Regeneron STS",
    deadline: "November",
    impact: "Could shift rating from 2 to 1"
  }
}
```

### Frontend Should Display
- Interactive checklist with completed/incomplete states
- Highlight most actionable item
- Timeline visualization if deadlines are relevant

---

## 5. Narrative & Description Quality Per-Activity

### API Returns
```typescript
{
  narrativeDescriptionQuality: {
    score: 7.5,
    perActivityAssessment: [
      {
        activityId: "usamo",
        storyArcStatus: "complete",    // complete | basic | missing | none
        descriptionStatus: "strong",   // strong | adequate | weak | template
        issues: [],
        improvements: [],
        overallStatus: "ready"         // ready | needs_revision | major_revision
      },
      {
        activityId: "research",
        storyArcStatus: "missing",
        descriptionStatus: "adequate",
        issues: ["Tells WHAT not WHY", "No discovery/finding mentioned"],
        improvements: [
          {
            priority: "high",
            category: "narrative",
            suggestion: "Add a finding: 'Improved detection accuracy by 23%'"
          }
        ],
        overallStatus: "needs_revision"
      },
      {
        activityId: "nhs",
        storyArcStatus: "none",
        descriptionStatus: "template",
        issues: ["No arc", "Passive voice", "Generic language"],
        improvements: [
          {
            priority: "high",
            category: "activity",
            suggestion: "Create structured STEM peer tutoring program"
          },
          {
            priority: "medium",
            category: "description",
            suggestion: "Rewrite with specific tutee outcomes"
          }
        ],
        overallStatus: "major_revision"
      }
    ],
    commonPatterns: [
      "Gap between best and worst descriptions is glaring",
      "Strong activities use 'so what' framing; weak ones don't",
      "Voice shifts from authentic to templated"
    ]
  }
}
```

### Frontend Should Display
- Status badges per activity (green/yellow/red based on overallStatus)
- Expandable per-activity detail sections
- Improvement cards that can be shown inline OR aggregated into a separate panel

---

## 6. Component Weight Visualization

For activities where Leadership doesn't apply (solo activities), show:
- Visual indication that weights have been redistributed
- Comparison of standard vs adjusted weights
- Explanation of why (solo activity detection)

---

## 7. Score Trend Visualization (Future)

If user submits multiple times:
- Show score changes over time
- Highlight improvements
- Track which recommendations were acted on

---

## Implementation Priority

1. **High:** Score display cards, overall score, percentile indicator
2. **Medium:** Harvard rating display, improvement checklist
3. **Low:** Narrative status badges, weight visualization
4. **Future:** Trend tracking

---

## 8. Inline Improvements Extraction Pattern

### Design Philosophy
Improvements are attached to their relevant sections in the API response, but frontend can extract them into a separate "Action Items" or "Suggested Improvements" panel.

### API Structure
```typescript
{
  sections: {
    activityQualityDistribution: {
      score: 8,
      summary: "...",
      competitivePercentile: 92,
      improvements: [
        {
          id: "aqd-1",
          priority: "medium",
          category: "balance",
          suggestion: "Strengthen middle-tier activities to reduce gap between USAMO and Environmental Club"
        }
      ]
    },
    candidateProfile: {
      score: 9,
      traits: [...],
      improvements: [
        {
          id: "cp-1",
          priority: "low",
          category: "trait_development",
          suggestion: "Service orientation is moderate—deepen environmental work or add service dimension to technical projects"
        }
      ]
    },
    narrativeDescriptionQuality: {
      score: 7.5,
      perActivityAssessment: [...],  // each has its own improvements array
      sectionImprovements: [
        {
          id: "ndq-1",
          priority: "high",
          category: "voice_consistency",
          suggestion: "Rewrite NHS description in your authentic voice"
        }
      ]
    },
    majorAlignment: {
      score: 9,
      alignmentPoints: [...],
      improvements: [
        {
          id: "ma-1",
          priority: "medium",
          category: "gap",
          targetGap: "team_technical_work",
          suggestion: "Add team-based technical experience or emphasize platform's open-source contributions"
        }
      ]
    }
  }
}
```

### Frontend Extraction Options

**Option A: Show Inline Only**
Display improvements within each section as they appear in the API.

**Option B: Aggregate into Separate Panel**
```typescript
function extractAllImprovements(apiResponse): Improvement[] {
  const all = [];

  // From each section
  for (const section of Object.values(apiResponse.sections)) {
    if (section.improvements) {
      all.push(...section.improvements);
    }
    // Special case: per-activity improvements
    if (section.perActivityAssessment) {
      for (const activity of section.perActivityAssessment) {
        all.push(...activity.improvements);
      }
    }
  }

  // Sort by priority
  return all.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}
```

**Option C: Hybrid**
Show high-priority improvements in a top banner, others inline.

### UI Example: Aggregated Improvements Panel
```
┌─────────────────────────────────────────────────┐
│  📋 Action Items (6)                            │
├─────────────────────────────────────────────────┤
│  🔴 HIGH PRIORITY                               │
│  ├─ NHS: Rewrite description with specific      │
│  │       tutee outcomes                         │
│  └─ Research: Add finding/discovery sentence    │
│                                                 │
│  🟡 MEDIUM PRIORITY                             │
│  ├─ Environmental: Add concrete metrics         │
│  └─ Portfolio: Add team-based technical work    │
│                                                 │
│  🟢 LOW PRIORITY                                │
│  └─ Candidate Profile: Strengthen service trait │
└─────────────────────────────────────────────────┘
```

---

## API Response Structure Notes

Ensure API returns structured data that frontend can visualize:
- Numeric scores with clear max values
- Enum-based statuses for badge displays
- Boolean flags for checklist items
- Percentile values for positioning

Frontend should NOT need to parse text to extract data—all visualizable data should be in structured fields.

---

*Last Updated: Activity Scoring System v2.0*
