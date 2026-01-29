# 📚 Citation System - Holistic Redesign

## 🎨 New Design Philosophy

**Problem**: 5 citation types (quote, red_flag, green_flag, value, example) = too many colors = visual chaos

**Solution**: 3 holistic categories aligned with user mental model:

1. **🚨 Problems** (Red highlight) - What's wrong
2. **✅ Strengths** (Green underline) - What's working + core values
3. **💡 Teaching** (Purple) - How to improve via elite techniques

---

## 🎯 Simplified Citation Types

### 1️⃣ Problem Citation (Red Highlight)

**What it shows**: Red flags, issues, what needs fixing

**Visual treatment**:
- **Red background highlight** (#FEE2E2 light red)
- Text remains black for readability
- Red flag indicator in box

**Tooltip**:
```
╔═══════════════════════════════════════╗
║ 🚨 Classroom-Bounded Learning         ║
║ Stanford Red Flag                     ║
║───────────────────────────────────────║
║ Learning activities never extend      ║
║ beyond classroom environment          ║
║                                       ║
║ Why this matters:                     ║
║ Stanford specifically looks for       ║
║ self-directed exploration             ║
║                                       ║
║ Score Impact: Caps at 69              ║
╚═══════════════════════════════════════╝
```

**Use cases**:
- Red flags detected
- Structural issues
- Missing elements

---

### 2️⃣ Strength Citation (Green Underline)

**What it shows**: Green flags + core college values demonstrated

**Visual treatment**:
- **Green underline** (#10B981 solid, 2px)
- No background color (keeps page clean)
- Green checkmark in box

**Tooltip**:
```
╔═══════════════════════════════════════╗
║ ✅ Intellectual Vitality               ║
║ Stanford Core Value (40% weight)      ║
║───────────────────────────────────────║
║ You demonstrated:                     ║
║ Self-directed project extension       ║
║                                       ║
║ What's working:                       ║
║ Taking classroom concept and building ║
║ independent project shows Stanford's  ║
║ top-weighted value                    ║
║                                       ║
║ Score Impact: Supports 85+ scoring    ║
╚═══════════════════════════════════════╝
```

**Use cases**:
- Green flags (strengths recognized)
- Core college values demonstrated
- What the student did well

**Key insight**: Values and strengths go together because both answer "What's working?"

---

### 3️⃣ Teaching Citation (Purple - No Inline Styling)

**What it shows**: Elite techniques, Dean quotes, how to improve

**Visual treatment**:
- **No inline highlighting** (keeps text clean)
- **Purple indicator in citation box only**
- Used in rationale/teaching sections, not in the essay text itself

**Tooltip**:
```
╔═══════════════════════════════════════╗
║ 💡 Elite Technique                    ║
║ From STAN_IV_007 (Score: 92)          ║
║───────────────────────────────────────║
║ "Built web scraper analyzing Reddit   ║
║  mental health discussions"           ║
║                                       ║
║ Technique to apply:                   ║
║ Transform classroom skill into        ║
║ independent project with real purpose ║
║                                       ║
║ Dean Shaw on this:                    ║
║ "We want students who pursue          ║
║  curiosity beyond requirements"       ║
╚═══════════════════════════════════════╝
```

**Use cases**:
- Elite essay examples
- Dean/AO quotes explaining "why"
- Teaching principles
- Specific techniques to learn

**Key insight**: Teaching citations appear in **rationale/explanation text**, not in the student's essay

---

## 🎨 Visual Hierarchy

### In Essay Text
```
"I learned about Python in my computer science class and found it interesting."
         ↑                    ↑                                    ↑
    [no marking]      [RED HIGHLIGHT]                     [no marking]
                    (classroom-bounded)
```

### In Revised Essay
```
"I discovered Python through CS50, then built a web scraper analyzing Reddit discussions."
                                           ↑
                                   [GREEN UNDERLINE]
                              (self-directed project)
```

### In Teaching Rationale
```
"This revision transforms classroom learning into self-directed exploration [💡].
 Stanford specifically values students who pursue ideas independently [💡].
 The web scraper technique comes from elite example STAN_IV_007 [💡]."
                                                                   ↑
                                                       (purple indicator - no inline style)
```

---

## 🏗️ Simplified Type Structure

```typescript
// 3 types instead of 5
export type CitationType = 'problem' | 'strength' | 'teaching';

export interface ProblemCitation {
  type: 'problem';

  // What's wrong
  problem_name: string;           // "Classroom-Bounded Learning"
  severity: 'critical' | 'major' | 'minor';

  // Evidence
  what_triggered_it: string;      // Quote from essay showing problem
  why_matters: string;            // Why Stanford cares

  // Impact
  score_impact: string;           // "Caps at 69"

  // Source
  red_flag_id?: string;           // Link to research DB
}

export interface StrengthCitation {
  type: 'strength';

  // What's working
  strength_name: string;          // "Self-Directed Project Extension"

  // Is this a value or a green flag?
  strength_type: 'core_value' | 'pattern';

  // Evidence
  what_demonstrates_it: string;   // What student did
  why_valued: string;             // Why college values this

  // College value context (if applicable)
  value_weight?: number;          // 40 for IV at Stanford
  value_definition?: string;

  // Impact
  score_impact: string;           // "Supports 85+ scoring"

  // Source
  value_id?: string;              // stanford_intellectual_vitality
  green_flag_id?: string;         // INDEPENDENT_PROJECT_EXTENSION
}

export interface TeachingCitation {
  type: 'teaching';

  // What we're teaching
  teaching_type: 'elite_technique' | 'dean_quote' | 'principle';

  // Elite technique
  example_id?: string;            // STAN_IV_007
  example_score?: number;         // 92
  technique: string;              // "Transform skill into project"
  example_quote?: string;         // Quote from elite essay

  // Dean quote
  dean_name?: string;             // "Dean Richard Shaw"
  dean_title?: string;            // "Dean of Admission"
  dean_quote?: string;            // Full quote
  dean_context?: string;          // When/why said

  // Why relevant
  why_relevant: string;           // How this helps student

  // Source
  research_id: string;
}
```

---

## 🎯 Usage in Different Contexts

### Context 1: Highlighting Problems in Original Draft

```typescript
// Original draft analysis
"I learned about Python in [my computer science class]{{prob_1}}"
                                     ↑
                              RED HIGHLIGHT

citations: {
  "prob_1": {
    type: "problem",
    problem_name: "Classroom-Bounded Learning",
    severity: "major",
    what_triggered_it: "All learning happens in class, no independent extension",
    why_matters: "Stanford values self-directed exploration beyond requirements",
    score_impact: "Caps Intellectual Vitality at 69"
  }
}
```

### Context 2: Highlighting Strengths in Revision

```typescript
// Revised essay with strengths
"I built [a web scraper analyzing Reddit discussions]{{strength_1}}"
               ↑
        GREEN UNDERLINE

citations: {
  "strength_1": {
    type: "strength",
    strength_name: "Intellectual Vitality: Self-Directed Project",
    strength_type: "core_value",  // This is a core value!
    what_demonstrates_it: "Independent technical project with research purpose",
    why_valued: "Stanford's top-weighted value (40%) - pursuing ideas independently",
    value_weight: 40,
    score_impact: "Supports 85+ scoring",
    value_id: "stanford_intellectual_vitality"
  }
}
```

### Context 3: Teaching in Rationale (No Inline Style)

```typescript
// Teaching rationale
"This technique [transforms classroom skill into independent project]{{teach_1}}"
                        ↑
                 NO INLINE STYLE
                 (purple in citation box only)

citations: {
  "teach_1": {
    type: "teaching",
    teaching_type: "elite_technique",
    example_id: "STAN_IV_007",
    example_score: 92,
    technique: "Transform classroom skill into independent project with real purpose",
    example_quote: "Built web scraper analyzing 50,000 Reddit posts...",
    dean_quote: "We want students who pursue curiosity beyond requirements",
    dean_name: "Dean Richard Shaw",
    why_relevant: "Shows how to turn class learning into self-directed work"
  }
}
```

---

## 🎨 Color Palette (Simplified)

| Type | Inline Style | Color | Usage |
|------|-------------|-------|-------|
| **Problem** | Red highlight | `#FEE2E2` bg | In original draft, showing issues |
| **Strength** | Green underline | `#10B981` 2px solid | In revision, showing what works |
| **Teaching** | None | Purple indicator in box only | In rationale, explaining techniques |

---

## 💡 Benefits of New Design

### Visual Clarity
- **Only 2 inline styles**: Red highlight (bad) + Green underline (good)
- Clean, uncluttered reading experience
- Immediate visual feedback: red = fix this, green = keep this

### Mental Model Alignment
- **Problem/Strength duality**: Clear opposition
- **Values + Strengths unified**: Both answer "what's working?"
- **Teaching separate**: Appears in explanation, not essay text

### Reduced Cognitive Load
- 3 categories instead of 5
- Color only where it adds value (in essay text)
- Teaching citations don't clutter the essay

### Better UX Flow
1. See **red highlights** in original → understand problems
2. See **green underlines** in revision → understand strengths
3. See **purple indicators** in rationale → learn techniques

---

## 📊 Migration from Old Design

| Old Type | New Type | Reasoning |
|----------|----------|-----------|
| `quote` | `teaching` | Dean quotes teach principles |
| `red_flag` | `problem` | Clear 1:1 mapping |
| `green_flag` | `strength` | Merged with values |
| `value` | `strength` | Values = strengths demonstrated |
| `example` | `teaching` | Examples teach techniques |

---

## 🚀 Implementation Changes Needed

1. **Update citationTypes.ts**: Replace 5 types with 3
2. **Update citationFormatter.ts**: New styling logic
3. **Update tests**: Adapt to new structure
4. **Update documentation**: Reflect holistic approach

**Benefit**: Cleaner code, simpler logic, better UX!

---

## ✅ User Experience Goals

**Before (5 types)**:
- 🎓 Blue quote
- 🚨 Red flag
- 🌟 Green flag
- 💎 Purple value
- 🌟 Amber example

**Too many colors = cognitive overload!**

**After (3 types)**:
- 🚨 Red highlight (problems)
- ✅ Green underline (strengths + values)
- 💡 Purple box only (teaching)

**Clean, focused, intuitive!**
