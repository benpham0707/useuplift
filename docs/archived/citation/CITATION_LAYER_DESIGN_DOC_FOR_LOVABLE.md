# 🎨 Citation & Evidence Layer - Design Document for Lovable

**Feature**: Research-backed citation system for Common App Workshop
**Prerequisites**: Common App Workshop frontend (Parts 1-5) must be complete
**Implementation**: Add as overlay layer on top of existing workshop
**Estimated Effort**: 2-3 days implementation, ongoing research gathering

---

## 📋 Overview

### What This Feature Adds

This citation system transforms the Common App Workshop from generic feedback to **research-backed, college-specific guidance**. Every piece of advice—problems identified, strengths highlighted, techniques taught—is cited to real research sources.

**User Experience**:
- Student sees red highlight on problem text → Hovers → Tooltip shows "Stanford Red Flag: Classroom-Bounded Learning" with research citation
- Student sees green underline on strength → Hovers → Tooltip shows "Stanford Core Value: Intellectual Vitality (40% weight)" with evidence
- Student reads teaching rationale → Purple indicators cite elite essay examples and dean quotes

**Value Proposition**:
- **Trust**: "Stanford values this" backed by dean quotes and admission website research
- **Specificity**: Not generic advice—specific to Stanford's published values
- **Transparency**: Students see WHY advice matters, not just WHAT to change
- **Education**: Learn college-specific patterns through cited examples

---

## 🏗️ Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: Citation UI (THIS FEATURE)                    │
│  - CitedText component                                   │
│  - Hover tooltips with research                          │
│  - Visual indicators (red/green/purple)                  │
└─────────────────────────────────────────────────────────┘
                          ↓ Consumes
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: Workshop UI (PREREQUISITE - Must exist)       │
│  - CommonAppWorkshop page                                │
│  - EditorView, RubricDimensionCard                       │
│  - Teaching guidance display                             │
└─────────────────────────────────────────────────────────┘
                          ↓ Displays
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Backend Analysis (EXISTS - No changes needed)  │
│  - Phase 17: Generate suggestions                        │
│  - Phase 18: Validate quality                            │
│  - Phase 19: Teaching guidance                           │
└─────────────────────────────────────────────────────────┘
                          ↓ Enhanced by
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: Citation Backend (EXISTS - Ready to use)       │
│  - citationTypes.ts (3 types)                            │
│  - citationProcessor.ts (parse/validate)                 │
│  - citationFormatter.ts (UI-ready output)                │
└─────────────────────────────────────────────────────────┘
                          ↓ Uses
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: Research Database (NEEDS CONTENT)              │
│  - Stanford: Red flags, core values, dean quotes         │
│  - Harvard: Research, patterns, examples                 │
│  - MIT: Technical criteria, innovation focus             │
└─────────────────────────────────────────────────────────┘
```

### Key Principle: Non-Invasive Overlay

**This feature is an OVERLAY, not a replacement**. The existing workshop works perfectly without citations. Citations enhance it.

**If citations fail**:
- Workshop still works
- Suggestions still display
- Teaching still available
- Just no research tooltips

---

## 🎨 Visual Design System

### The 3 Holistic Citation Types

#### Type 1: Problem Citations (Red Highlight)
**Where**: Original essay text that has issues
**Visual**: Light red background (#FEE2E2)
**Hover**: Tooltip explaining what's wrong + research

**Example**:
```
Original: "I learned Python in [my computer science class]{{prob_1}}."
                                  └─────────────────┘
                                  Red highlight
```

**Tooltip Content**:
```
╔═══════════════════════════════════════════════╗
║ ⚠️ Classroom-Bounded Learning                 ║
║ Stanford Issue (Major Severity)               ║
║───────────────────────────────────────────────║
║ Why this matters:                             ║
║ Stanford values self-directed exploration     ║
║ beyond classroom requirements. Your essay     ║
║ shows learning only within structured classes.║
║                                               ║
║ Research Source:                              ║
║ Stanford Admission's "What We Look For"       ║
║ - Intellectual Vitality section               ║
║                                               ║
║ Score Impact: Caps Intellectual Vitality at 69║
╚═══════════════════════════════════════════════╝
```

---

#### Type 2: Strength Citations (Green Underline)
**Where**: Revised essay text that demonstrates strengths
**Visual**: Green underline (#10B981), NO background
**Hover**: Tooltip explaining what's working + college value

**Example**:
```
Revised: "I built [a web scraper analyzing Reddit discussions]{{strength_1}}."
                   └────────────────────────────────────┘
                   Green underline (no background)
```

**Tooltip Content**:
```
╔═══════════════════════════════════════════════╗
║ ✅ Intellectual Vitality: Self-Directed        ║
║ Stanford Core Value (40% weight)              ║
║───────────────────────────────────────────────║
║ What you demonstrated:                        ║
║ Independent project extending classroom       ║
║ learning into real-world application          ║
║                                               ║
║ Why Stanford values this:                     ║
║ "We seek students who pursue learning for     ║
║ its own sake, beyond requirements"            ║
║ - Stanford Admission Website, 2024            ║
║                                               ║
║ This is Stanford's TOP-WEIGHTED value (40%)   ║
║ Score Impact: Supports 85+ scoring            ║
╚═══════════════════════════════════════════════╝
```

---

#### Type 3: Teaching Citations (Purple Box Only)
**Where**: Rationale/teaching text explaining techniques
**Visual**: NO inline styling (clean text), purple indicator in sidebar
**Hover**: Tooltip with elite examples + dean quotes

**Example**:
```
Rationale: "This revision [transforms classroom learning]{{teach_1}}
into self-directed exploration. [Notice how]{{teach_2}} the technical
skill (Python) becomes a tool for social research."
```

**Tooltip Content (Elite Technique)**:
```
╔═══════════════════════════════════════════════╗
║ 🌟 Elite Technique from 92-Score Essay        ║
║ Example: STAN_IV_007                          ║
║───────────────────────────────────────────────║
║ Elite Essay Quote:                            ║
║ "After learning NLP in CS224N, I built a     ║
║ sentiment analyzer examining 50,000 Reddit    ║
║ posts on mental health stigma..."             ║
║                                               ║
║ Why this scored 92:                           ║
║ Transforms classroom skill (NLP) into         ║
║ independent research with social purpose      ║
║                                               ║
║ Technique to apply:                           ║
║ 1. Start with classroom skill                 ║
║ 2. Identify real-world problem                ║
║ 3. Apply skill independently                  ║
║ 4. Show impact/insights                       ║
╚═══════════════════════════════════════════════╝
```

**Tooltip Content (Dean Quote)**:
```
╔═══════════════════════════════════════════════╗
║ 🎓 Dean Richard Shaw, Stanford Admission       ║
║ Stanford Magazine Interview, 2023             ║
║───────────────────────────────────────────────║
║ "We're not looking for students who just      ║
║ check boxes or complete assignments. We want  ║
║ students who take what they learn and run     ║
║ with it—who ask 'what if' and pursue answers  ║
║ on their own initiative."                     ║
║                                               ║
║ Context: Discussing intellectual vitality     ║
║ in admission decisions                        ║
╚═══════════════════════════════════════════════╝
```

---

## 📁 Files to Create

### 1. Frontend Components (Priority 1)

#### File 1: `src/components/portfolio/commonApp/workshop/citations/CitedText.tsx`

**Purpose**: Main component that renders text with citations

**Props**:
```typescript
interface CitedTextProps {
  uiText: UIReadyText; // Formatted from citationFormatter
  className?: string;
}
```

**Renders**:
- Plain text for non-cited portions
- CitedSpan for cited portions
- Handles empty/null gracefully

**Size**: ~150 lines

---

#### File 2: Same file - `CitedSpan` component

**Purpose**: Individual cited text span with hover tooltip

**Features**:
- Apply inline styling (red highlight OR green underline OR none)
- Show tooltip on hover
- Accessible (keyboard navigation, aria-labels)
- Click to highlight/focus

**Size**: ~80 lines

---

#### File 3: Same file - `CitationTooltip` component

**Purpose**: Tooltip content display

**Sections**:
1. Header: Icon + Title
2. Subtitle: College name, severity, weight
3. Content: Main explanation
4. Context: What triggered / what demonstrates
5. Relevance: Why this matters
6. Footer: Score impact, research source

**Size**: ~100 lines

**Total file size**: ~330 lines for all 3 components

---

#### File 4: `src/components/portfolio/commonApp/workshop/citations/CitationBox.tsx` (Optional)

**Purpose**: Sidebar showing all citations in current essay

**Features**:
- List all citations with colored bars
- Click to jump to citation in text
- Filter by type (problem/strength/teaching)
- Collapse/expand by college value

**Size**: ~200 lines

**Priority**: Low (nice-to-have, not required for v1)

---

### 2. CSS Styling (Priority 1)

#### File: `src/index.css` (add to existing file)

**Required Styles**:
```css
/* ====================================================================
   CITATION SYSTEM STYLES
   ==================================================================== */

/* Problem Citation - RED HIGHLIGHT */
.problem-highlight {
  background-color: #FEE2E2;
  border-radius: 2px;
  padding: 0 2px;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  position: relative;
}

.problem-highlight:hover {
  background-color: #FCA5A5;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.problem-highlight:focus {
  outline: 2px solid #EF4444;
  outline-offset: 2px;
}

/* Strength Citation - GREEN UNDERLINE */
.strength-underline {
  border-bottom: 2px solid #10B981;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  position: relative;
}

.strength-underline:hover {
  border-color: #059669;
  background-color: rgba(16, 185, 129, 0.05);
}

.strength-underline:focus {
  outline: 2px solid #10B981;
  outline-offset: 2px;
}

/* Teaching Citation - NO INLINE STYLE (box indicator only) */
.teaching-citation {
  /* No visual styling - citations appear in sidebar */
  cursor: default;
}

/* Citation Tooltip Container */
.citation-tooltip {
  max-width: 400px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  line-height: 1.5;
  z-index: 1000;
}

.citation-tooltip-dark {
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border));
}

/* Tooltip Header */
.citation-tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.citation-tooltip-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.citation-tooltip-title {
  font-weight: 600;
  font-size: 15px;
  margin: 0;
  line-height: 1.3;
}

.citation-tooltip-subtitle {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 12px;
  font-weight: 500;
}

/* Tooltip Content */
.citation-tooltip-content {
  margin-bottom: 12px;
  color: hsl(var(--foreground));
}

.citation-tooltip-context {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 8px;
}

.citation-tooltip-relevance {
  font-size: 12px;
  padding: 8px;
  background: hsl(var(--muted) / 0.5);
  border-radius: 4px;
  margin-bottom: 8px;
}

.citation-tooltip-relevance strong {
  display: block;
  margin-bottom: 4px;
  color: hsl(var(--foreground));
}

.citation-tooltip-footer {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  padding-top: 8px;
  border-top: 1px solid hsl(var(--border));
  margin-top: 8px;
}

/* Citation Box Sidebar (Optional) */
.citation-box {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.citation-box-item {
  padding: 12px;
  border-left: 4px solid transparent;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.citation-box-item:hover {
  background-color: hsl(var(--muted) / 0.5);
  transform: translateX(2px);
}

.citation-box-item.problem {
  border-left-color: #EF4444;
}

.citation-box-item.strength {
  border-left-color: #10B981;
}

.citation-box-item.teaching {
  border-left-color: #8B5CF6;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .citation-tooltip {
    max-width: 90vw;
    padding: 12px;
    font-size: 13px;
  }

  .problem-highlight,
  .strength-underline {
    padding: 2px 1px;
  }
}

/* Print Styles - Hide Citations */
@media print {
  .problem-highlight {
    background-color: transparent !important;
  }

  .strength-underline {
    border-bottom: none !important;
  }

  .citation-tooltip {
    display: none !important;
  }
}
```

**Size**: ~150 lines

---

### 3. Integration Points (Priority 1)

#### Integration Point 1: Workshop Item Display

**File**: Update `src/components/portfolio/extracurricular/workshop/TeachingGuidanceCard.tsx`

**Change**: Replace plain text rationale with CitedText

**Before**:
```typescript
<p className="text-sm text-muted-foreground">
  {suggestion.rationale}
</p>
```

**After**:
```typescript
import { CitedText } from '@/components/portfolio/commonApp/workshop/citations/CitedText';
import { formatTextWithCitations } from '@/services/commonAppWorkshop/utils/citationFormatter';

{suggestion.rationale_with_citations ? (
  <CitedText
    uiText={formatTextWithCitations(
      suggestion.rationale_with_citations,
      suggestion.citations || {},
      currentCollege.name
    )}
    className="text-sm text-muted-foreground"
  />
) : (
  <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
)}
```

**Effort**: 15 minutes per integration point

---

#### Integration Point 2: Problem Display

**File**: Same as above or `RubricDimensionCard.tsx`

**Change**: Add citations to problem descriptions

**Example**:
```typescript
{issue.analysis_with_citations ? (
  <CitedText
    uiText={formatTextWithCitations(
      issue.analysis_with_citations,
      issue.citations || {},
      currentCollege.name
    )}
    className="text-sm"
  />
) : (
  <p className="text-sm">{issue.analysis}</p>
)}
```

---

#### Integration Point 3: Teaching Overlay

**File**: Teaching guidance modals/popovers

**Change**: Add citations to teaching explanations

**Example**: Same pattern as above

---

### 4. Backend Updates (Priority 2)

#### Update 1: Workshop Item Types

**File**: `src/services/commonAppWorkshop/types/workshopTypes.ts`

**Add**:
```typescript
export interface WorkshopItem {
  id: string;
  quote: string;
  problem: string;
  why_it_matters: string;
  suggestions: Suggestion[];
  teaching: TeachingGuidance;
  rubric_category: string;

  // ADD: Citation support
  citations?: {
    problem_citation?: ProblemCitation;
    strength_citation?: StrengthCitation;
    teaching_citations?: TeachingCitation[];
  };
}

export interface Suggestion {
  text: string;
  rationale: string;
  type: 'polished_original' | 'voice_amplifier';
  validation?: ValidationData;

  // ADD: Citations in rationale
  rationale_with_citations?: string; // "[transforms learning]{{teach_1}}"
  citations?: CitationDatabase; // Map of cite_id → Citation object
}
```

**Effort**: 30 minutes

---

#### Update 2: Claude Prompt

**File**: Backend prompt for generating workshop items

**Add to prompt**:
```
CITATION SYSTEM INSTRUCTIONS:

When providing teaching rationale, cite evidence using this format:
"This revision [transforms classroom learning into self-directed exploration]{{teach_1}}."

Include a citation database with full research:
{
  "teach_1": {
    "id": "teach_1",
    "type": "teaching",
    "source": {
      "name": "Elite Essay Analysis",
      "title": "STAN_IV_007",
      "url": null
    },
    "evidence": {
      "teaching_type": "elite_technique",
      "technique": "Transform classroom skill into independent project",
      "example_id": "STAN_IV_007",
      "example_score": 92,
      "example_quote": "After learning NLP in CS224N, I built a sentiment analyzer...",
      "dean_quote": "We want students who take what they learn and run with it"
    },
    "why_relevant": "Shows how to demonstrate intellectual vitality",
    "research_id": "stanford_elite_examples"
  }
}

CITATION TYPES:
1. Problem citations (red highlight) - Issues in original essay
   - Use for: Red flags, missing elements, weak patterns
   - Format: "All learning in [classroom only]{{prob_1}}"

2. Strength citations (green underline) - Strengths in revision
   - Use for: Core values demonstrated, positive patterns
   - Format: "[Independent research project]{{strength_1}}"

3. Teaching citations (purple box) - Techniques and guidance
   - Use for: Elite examples, dean quotes, principles
   - Format: "This [transforms classroom learning]{{teach_1}}"

For each citation, provide:
- Exact research source (dean quote, elite essay, admission website)
- Why it matters to THIS college specifically
- Score impact if applicable
```

**Effort**: 1 hour

---

### 5. Research Database (Priority 3 - Ongoing)

#### Structure Per College

**File**: `src/data/citations/stanford.ts` (example)

```typescript
import { CitationDatabase } from '@/services/commonAppWorkshop/types';

export const stanfordCitations: CitationDatabase = {
  citations: {
    // RED FLAGS (Problems)
    'stanford_rf_class_only': {
      id: 'stanford_rf_class_only',
      type: 'problem',
      source: {
        name: 'Stanford Admission Analysis',
        title: 'Common Red Flags',
        url: 'https://admission.stanford.edu/apply/first-year/'
      },
      evidence: {
        problem_id: 'CLASS_BASED_ONLY',
        problem_name: 'Classroom-Bounded Learning',
        severity: 'major',
        what_triggered_it: 'All learning activities confined to classroom',
        why_matters: 'Stanford values self-directed intellectual exploration',
        score_impact: 'Caps Intellectual Vitality at 69',
        how_to_fix: 'Show independent projects or self-directed learning'
      },
      why_relevant: 'Shows gap between what essay shows and what Stanford values',
      research_id: 'stanford_intellectual_vitality'
    },

    // CORE VALUES (Strengths)
    'stanford_value_iv': {
      id: 'stanford_value_iv',
      type: 'strength',
      source: {
        name: 'Stanford Core Values',
        title: 'Intellectual Vitality',
        url: 'https://admission.stanford.edu/apply/selection/'
      },
      evidence: {
        strength_id: 'stanford_iv',
        strength_name: 'Intellectual Vitality',
        strength_type: 'core_value',
        what_demonstrates_it: 'Self-directed learning and exploration',
        why_valued: "Stanford's top-weighted value (40%)",
        score_impact: 'Required for 85+ scores',
        value_weight: 40,
        value_definition: 'Pursuing learning for its own sake beyond requirements'
      },
      why_relevant: 'Primary core value being demonstrated',
      research_id: 'stanford_values'
    },

    // ELITE EXAMPLES (Teaching)
    'stanford_elite_007': {
      id: 'stanford_elite_007',
      type: 'teaching',
      source: {
        name: 'Elite Essay Analysis',
        title: 'STAN_IV_007',
        url: null
      },
      evidence: {
        teaching_type: 'elite_technique',
        technique: 'Transform classroom skill into independent research',
        example_id: 'STAN_IV_007',
        example_score: 92,
        example_quote: 'After learning NLP in CS224N, I built a sentiment analyzer examining 50,000 Reddit posts on mental health stigma. The project revealed...'
      },
      why_relevant: 'Shows technique for demonstrating intellectual vitality',
      research_id: 'stanford_elite_essays'
    },

    // DEAN QUOTES (Teaching)
    'stanford_dean_shaw_iv': {
      id: 'stanford_dean_shaw_iv',
      type: 'teaching',
      source: {
        name: 'Stanford Magazine',
        title: 'Interview with Dean Richard Shaw',
        url: 'https://stanfordmag.org/contents/dean-shaw-interview-2023'
      },
      evidence: {
        teaching_type: 'dean_quote',
        technique: 'Pursue learning independently',
        dean_name: 'Dean Richard Shaw',
        dean_title: 'Dean of Undergraduate Admission',
        dean_quote: "We're not looking for students who just check boxes. We want students who take what they learn and run with it.",
        dean_context: 'Discussing intellectual vitality in admission decisions',
        dean_publication: 'Stanford Magazine, 2023'
      },
      why_relevant: 'Official statement on what Stanford values',
      research_id: 'stanford_dean_quotes'
    }
  }
};
```

**Effort per college**: 2-3 hours research + 1 hour data entry

**Priority colleges** (start with these):
1. Stanford (3-4 hours)
2. Harvard (3-4 hours)
3. MIT (3-4 hours)
4. Yale (3-4 hours)
5. Princeton (3-4 hours)

**Target**: 20-30 citations per college minimum

---

## 🔄 Implementation Workflow

### Phase 1: Frontend Components (Day 1)

**Time**: 4-6 hours

**Steps**:
1. ✅ Create `CitedText.tsx` with all 3 sub-components (2 hours)
2. ✅ Add CSS styling to `src/index.css` (30 minutes)
3. ✅ Create test fixture with sample citations (30 minutes)
4. ✅ Test in isolation with Storybook or test page (1 hour)
5. ✅ Fix bugs, polish interactions (1-2 hours)

**Deliverable**: Working citation components ready for integration

**Test Criteria**:
- [ ] Red highlights render correctly
- [ ] Green underlines render correctly
- [ ] Tooltips show on hover
- [ ] Tooltips have all sections (title, subtitle, content, footer)
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] Keyboard accessible

---

### Phase 2: Integration (Day 2)

**Time**: 3-4 hours

**Steps**:
1. ✅ Update workshop item types (30 minutes)
2. ✅ Integrate CitedText into teaching guidance (1 hour)
3. ✅ Integrate CitedText into problem display (30 minutes)
4. ✅ Add sample citations to test workshop items (30 minutes)
5. ✅ Test end-to-end in workshop UI (1 hour)
6. ✅ Polish and fix edge cases (30 minutes)

**Deliverable**: Citations displaying in workshop

**Test Criteria**:
- [ ] Citations render in workshop items
- [ ] Hovering shows research tooltips
- [ ] Workshop works without citations (graceful fallback)
- [ ] No console errors
- [ ] Performance acceptable (no lag)

---

### Phase 3: Backend Updates (Day 3)

**Time**: 4-5 hours

**Steps**:
1. ✅ Update backend types for citations (30 minutes)
2. ✅ Update Claude prompt with citation instructions (1 hour)
3. ✅ Test citation generation with real analysis (2 hours)
4. ✅ Validate citation database structure (30 minutes)
5. ✅ Deploy backend changes (30 minutes)
6. ✅ End-to-end testing (1 hour)

**Deliverable**: Backend generating citations

**Test Criteria**:
- [ ] Backend generates citation markers
- [ ] Citation database validates
- [ ] All 3 types working
- [ ] College name dynamically inserted
- [ ] Research sources accurate

---

### Phase 4: Research Database (Ongoing)

**Time**: 2-3 hours per college

**Process per college**:
1. Research admission website (30 min)
2. Find dean quotes and interviews (30 min)
3. Identify core values + weights (30 min)
4. Document red flags/patterns (30 min)
5. Find elite essay examples (30 min)
6. Structure as citation database (30 min)

**Priority order**:
1. Stanford (Week 1)
2. Harvard (Week 1)
3. MIT (Week 1)
4. Yale (Week 2)
5. Princeton (Week 2)
6. ... continue for top 20 colleges

**Deliverable**: 20-30 citations per college

---

## 📋 Pre-Implementation Checklist

### Prerequisites (Must be complete)

**Common App Workshop** (from LOVABLE_FRONTEND_IMPLEMENTATION_GUIDE.md):
- [ ] Part 1: PIQ Workshop clone exists
- [ ] Part 2: College navigation working
- [ ] Part 3: Supplemental pages independent
- [ ] Part 4: (Skip for now - this IS Part 4 expanded)
- [ ] Part 5: Layout adjustments complete

**Backend**:
- [x] Citation types exist (`citationTypes.ts`)
- [x] Citation processor exists (`citationProcessor.ts`)
- [x] Citation formatter exists (`citationFormatter.ts`)
- [x] Tests passing (25/25)

**Before starting**:
- [ ] Workshop displays teaching guidance
- [ ] Workshop displays suggestions with rationales
- [ ] Workshop has problem/issue display
- [ ] Workshop is stable (no major bugs)

---

## 🧪 Testing Strategy

### Unit Tests

**File**: `tests/citation-components.test.tsx`

**Test cases**:
```typescript
describe('CitedText', () => {
  it('renders plain text without citations', () => {...});
  it('renders cited spans with tooltips', () => {...});
  it('handles empty citations gracefully', () => {...});
  it('applies correct styling for each type', () => {...});
});

describe('CitedSpan', () => {
  it('applies red highlight for problems', () => {...});
  it('applies green underline for strengths', () => {...});
  it('applies no styling for teaching', () => {...});
  it('shows tooltip on hover', () => {...});
});

describe('CitationTooltip', () => {
  it('displays all tooltip sections', () => {...});
  it('handles missing optional fields', () => {...});
  it('formats college name correctly', () => {...});
});
```

**Effort**: 2-3 hours

---

### Integration Tests

**Test scenarios**:
1. Load workshop with citations → Citations display
2. Hover citation → Tooltip appears
3. Switch colleges → Citations update with new college name
4. Analysis without citations → Workshop still works
5. Mobile view → Tooltips position correctly

**Effort**: 2 hours

---

### Manual Testing Checklist

**Visual**:
- [ ] Red highlights visible and appropriate
- [ ] Green underlines visible and appropriate
- [ ] Tooltips readable and well-formatted
- [ ] Icons display correctly
- [ ] Colors match design system

**Interaction**:
- [ ] Hover shows tooltip
- [ ] Tooltip positions intelligently (not off-screen)
- [ ] Click focuses citation
- [ ] Keyboard navigation works
- [ ] Touch works on mobile

**Content**:
- [ ] Research sources accurate
- [ ] College names correct
- [ ] Score impacts make sense
- [ ] Teaching techniques actionable
- [ ] Dean quotes properly attributed

**Performance**:
- [ ] No lag when hovering
- [ ] Smooth tooltip animations
- [ ] Fast page load even with many citations
- [ ] Memory usage acceptable

**Edge Cases**:
- [ ] Very long citations (200+ words)
- [ ] Missing citation data (graceful fallback)
- [ ] Malformed citation markers
- [ ] Network errors loading citations
- [ ] 10+ citations in one paragraph

---

## 🚀 Launch Readiness

### Minimum Viable Product (MVP)

**Must have for launch**:
- [x] Backend citation system (COMPLETE)
- [ ] CitedText component
- [ ] CSS styling
- [ ] Integration in 2+ places (suggestions, problems)
- [ ] 3 colleges with 20+ citations each
- [ ] Tests passing
- [ ] Mobile responsive

**Nice to have** (can add later):
- [ ] CitationBox sidebar
- [ ] Citation filtering
- [ ] Citation analytics
- [ ] All 50+ colleges

---

### Beta Testing Plan

**Week 1**: Internal testing
- Team tests with Stanford citations
- Fix bugs and polish

**Week 2**: Limited beta
- 10-20 students test with Stanford/Harvard/MIT
- Gather feedback on citation usefulness
- Measure hover rates

**Week 3**: Expanded beta
- 100+ students across multiple colleges
- A/B test: citations on vs off
- Measure impact on revision quality

**Week 4**: Full launch
- All users get citations
- Monitor performance and errors
- Continue adding colleges

---

## 📊 Success Metrics

### Quantitative Metrics

**Engagement**:
- Citation hover rate (target: 30%+ of citations hovered)
- Time spent on tooltips (target: 5+ seconds average)
- Citations that led to revisions (track clicks → edits)

**Quality**:
- Essay score improvement (target: +3-5 NQI points)
- Revision quality scores
- Number of citations used per essay

**Performance**:
- Tooltip render time (target: <50ms)
- Page load time (target: <2s with citations)
- Error rate (target: <0.1%)

---

### Qualitative Metrics

**User Feedback** (survey after using citations):
- "Citations made me trust the advice more" (target: 80% agree)
- "Research sources were helpful" (target: 75% agree)
- "Learned about what [college] values" (target: 85% agree)
- "Citations weren't overwhelming" (target: 70% agree)

**Before/After Analysis**:
- Compare essays with citations vs without
- Measure specificity improvement
- Measure alignment with college values

---

## 🎨 Design Principles

### 1. Non-Invasive
Citations enhance, don't distract. Text should be readable with or without hovering.

**Good**: Subtle underline, minimal background
**Bad**: Bold borders, flashing indicators, too many colors

---

### 2. Trustworthy
Every citation must have verifiable source. No generic advice disguised as research.

**Good**: "Dean Shaw, Stanford Magazine 2023: [quote]"
**Bad**: "Experts say..." (who? where?)

---

### 3. Actionable
Citations should help students understand WHY and HOW to improve.

**Good**: "Transform classroom skill into independent project [elite example]"
**Bad**: "This is good" (not helpful)

---

### 4. College-Specific
Generic citations add no value. Must be specific to target college.

**Good**: "Stanford values intellectual vitality (40% weight)"
**Bad**: "Colleges like independent thinking" (vague)

---

### 5. Gradual Disclosure
Show essential info immediately, detailed research on hover.

**Good**: Visual indicator → hover for full research
**Bad**: All research visible always (overwhelming)

---

## 🔧 Maintenance & Updates

### Monthly Tasks

**Research Updates** (2 hours/month):
- Check for new dean interviews
- Update admission website changes
- Add new elite essay examples
- Verify links still active

**Citation Quality** (1 hour/month):
- Review lowest-rated citations
- Update based on user feedback
- Remove outdated information
- Add requested colleges

---

### Quarterly Tasks

**Major Updates** (1 day/quarter):
- Refresh all college research
- Update core value weights (if changed)
- Add 10+ new colleges
- Review citation analytics
- A/B test new citation types

---

## 📚 Documentation for Team

### For Developers

**Files to know**:
- `citationTypes.ts` - Type definitions
- `citationProcessor.ts` - Parsing logic
- `citationFormatter.ts` - UI formatting
- `CitedText.tsx` - React component

**Common tasks**:
- Add new college citations: Edit `src/data/citations/[college].ts`
- Update citation styling: Edit `src/index.css`
- Fix tooltip bug: Check `CitedSpan.tsx`
- Add citation type: Update `citationTypes.ts`

---

### For Content Team

**Research Checklist per College**:
1. [ ] Admission website → Core values, selection criteria
2. [ ] Dean interviews → Quotes about what college values
3. [ ] Admission blogs → Common mistakes, success patterns
4. [ ] Elite essays → 90+ score examples (if available)
5. [ ] Red flag patterns → From historical analysis

**Citation Template**:
```typescript
{
  id: 'unique_id',
  type: 'problem' | 'strength' | 'teaching',
  source: {
    name: 'Source name',
    title: 'Article/page title',
    url: 'Full URL or null'
  },
  evidence: {
    // Type-specific fields
  },
  why_relevant: 'Why this matters for students',
  research_id: 'Reference ID for tracking'
}
```

---

### For Product/Design

**User Feedback Questions**:
- Were citations helpful? (1-5 scale)
- Which citation was most useful? (free text)
- Were there too many/too few citations?
- Did you trust the research sources?
- Would you like more detail / less detail?

**Analytics to Monitor**:
- Hover rate by citation type
- Time spent reading tooltips
- Citations that led to edits
- Colleges with most/least engagement

---

## 🎯 Summary

### What This Feature Provides

**For Students**:
- Research-backed advice (trust)
- College-specific guidance (relevance)
- Transparency into "why" (education)
- Elite examples to learn from (aspiration)

**For Product**:
- Differentiation from generic AI tools
- Credibility through research citations
- Educational value beyond editing
- Foundation for college-specific coaching

**For Business**:
- Higher perceived value (justify pricing)
- Better outcomes (research-backed advice works)
- Competitive moat (hard to replicate research)
- Viral sharing (students share helpful tooltips)

---

### Implementation Summary

**Total Effort**: 2-3 days core implementation + ongoing research

**Phase 1** (Day 1): Frontend components - 4-6 hours
**Phase 2** (Day 2): Integration - 3-4 hours
**Phase 3** (Day 3): Backend updates - 4-5 hours
**Phase 4** (Ongoing): Research database - 2-3 hours per college

**Prerequisites**: Common App Workshop Parts 1-5 complete

**Launch Requirements**:
- CitedText component working
- 3 colleges with 20+ citations each
- Integration in workshop UI
- Tests passing
- Mobile responsive

---

## 📞 Support & Questions

**For Implementation Questions**:
- Reference: `CITATION_HOLISTIC_IMPLEMENTATION_COMPLETE.md`
- Backend code: `src/services/commonAppWorkshop/`
- Test examples: `tests/test-citation-holistic-3type.ts`

**For Design Questions**:
- Visual examples in this doc (sections above)
- Design principles (Section 11)
- User testing plan (Section 9)

**For Research Questions**:
- Citation structure examples (Section 5)
- Research gathering checklist (Section 12)
- College prioritization (Section 7, Phase 4)

---

**END OF DESIGN DOCUMENT**

This citation layer is ready to implement as soon as the Common App Workshop frontend (Parts 1-5) is complete. All backend infrastructure exists and is fully tested. The only work remaining is creating 3 React components and gathering college-specific research.
