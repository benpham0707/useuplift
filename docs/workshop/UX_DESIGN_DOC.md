# Extracurricular Narrative Workshop — UX Design Document

**Version**: 1.0
**Date**: 2025-11-11
**Status**: Phase 0 — Design & Review
**Purpose**: Define the complete user experience for teaching students to improve extracurricular narratives through structured, pedagogical, iterative workshopping.

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [User Journey Overview](#2-user-journey-overview)
3. [Information Architecture](#3-information-architecture)
4. [Teaching Unit Design](#4-teaching-unit-design)
5. [Reflection & Exploration Flow](#5-reflection--exploration-flow)
6. [Rewrite Assist & Generation](#6-rewrite-assist--generation)
7. [Delta Visualization & Progress](#7-delta-visualization--progress)
8. [Iteration Loop & Version History](#8-iteration-loop--version-history)
9. [UI Components Specification](#9-ui-components-specification)
10. [Interaction Patterns](#10-interaction-patterns)
11. [Content Guidelines](#11-content-guidelines)
12. [Accessibility & Responsiveness](#12-accessibility--responsiveness)
13. [Error States & Edge Cases](#13-error-states--edge-cases)
14. [Success Metrics & Analytics](#14-success-metrics--analytics)

---

## 1. Vision & Philosophy

### Core Principle
**"Students should leave having learned WHY their entry was weak and HOW to fix it — not just receive a polished rewrite."**

### Design Values
1. **Pedagogical First**: Every interaction teaches a transferable skill
2. **Scaffolded Discovery**: Guide users through exploration, not prescription
3. **Authentic Voice Preservation**: Never sacrifice student voice for polish
4. **Measurable Progress**: Clear before/after with rubric delta
5. **Encouragement Over Criticism**: Mentor-like tone, focus on growth

### Anti-Patterns to Avoid
- ❌ Black-box rewrites without explanation
- ❌ Overwhelming users with all 11 dimensions at once
- ❌ Generic advice ("add more detail")
- ❌ Judgmental or discouraging language
- ❌ Forcing users into a single "correct" answer

---

## 2. User Journey Overview

### Entry Point
User arrives with an extracurricular entry they've written (50-700 characters). They want to:
- Understand why it's not working
- Learn how to make it admissions-ready
- Iterate until it's strong

### High-Level Flow
```
1. DIAGNOSE    → System analyzes entry, identifies 3-5 prioritized issues
2. TEACH       → For each issue: explain + show example + offer fixes
3. EXPLORE     → Answer guided questions to surface deeper content
4. REWRITE     → User writes; system provides hints; generator offers drafts
5. REGRADE     → Re-analyze; show delta; celebrate wins; identify gaps
6. ITERATE     → Repeat 2-5 until quality threshold met or user satisfied
7. FINALIZE    → Export improved entry; save learning summary
```

### User States
- **Curious**: "Why isn't this working?" (Diagnosis)
- **Learning**: "Oh, I see what's missing!" (Teaching)
- **Discovering**: "Wait, I forgot to mention..." (Exploration)
- **Creating**: "Let me try rewriting this part..." (Rewriting)
- **Validated**: "It went from 52 → 78!" (Progress)

---

## 3. Information Architecture

### Screen Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Score Progress Bar + Iteration Count                       │
│ [████████████░░░░░░░░] 52 → 78 NQI  •  Iteration 2 of 5           │
├─────────────────────┬───────────────────────────────────────────────┤
│  LEFT SIDEBAR       │  MAIN EDITOR PANEL                            │
│  (25% width)        │  (75% width)                                  │
│                     │                                               │
│  🎯 Top Priorities  │  ┌─────────────────────────────────────────┐ │
│  (Collapsible)      │  │ DRAFT EDITOR                            │ │
│                     │  │                                         │ │
│  📋 Issue Cards     │  │ [User's text with inline highlights]   │ │
│  • Voice            │  │                                         │ │
│  • Specificity      │  │ Hover for tooltips explaining flags    │ │
│  • Reflection       │  └─────────────────────────────────────────┘ │
│  (Expandable)       │                                               │
│                     │  💡 TEACHING UNIT (if issue selected)        │
│  📊 Rubric Axes     │  ├─ Problem Explanation                      │
│  [Progress bars]    │  ├─ Before/After Example                     │
│                     │  ├─ Fix Strategies (2-3 options)             │
│                     │  └─ Reflection Prompts (3 questions)         │
│                     │                                               │
│  🔄 Version History │  🤖 REWRITE ASSIST (expandable)              │
│  [Timeline]         │  ├─ Inline Hints                             │
│                     │  ├─ Generator Drafts (2-3 candidates)        │
│                     │  └─ Side-by-side Comparison                  │
└─────────────────────┴───────────────────────────────────────────────┘
```

### Mobile Layout
- **Stacked vertical layout**
- Issue cards → Editor → Teaching Unit → Rewrite Assist
- Swipe between issues
- Collapsible sections to reduce scroll

---

## 4. Teaching Unit Design

### Purpose
For each detected issue, provide:
1. Clear explanation of WHY it's a problem
2. Concrete example showing weak → strong
3. Multiple fix strategies (not just one "right" way)
4. Reflection prompts to surface missing content

### Component Structure

#### 4.1 Issue Card (Collapsed State)
```
┌───────────────────────────────────────────────┐
│ 🔴 Missing Concrete Numbers           [EXPAND]│
│ Critical • Specificity & Evidence             │
│ "Several" and "many" leave readers guessing   │
└───────────────────────────────────────────────┘
```

**Visual Indicators**:
- 🔴 Critical (red dot)
- 🟠 Important (orange dot)
- 🟡 Helpful (yellow dot)

**Collapsible by default** — user clicks to expand

---

#### 4.2 Teaching Unit (Expanded State)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 Missing Concrete Numbers                           [COLLAPSE]│
│ Critical • Specificity & Evidence                               │
├─────────────────────────────────────────────────────────────────┤
│ 📌 FROM YOUR DRAFT:                                             │
│ "I volunteered frequently at the food bank."                    │
│                                                                 │
│ ❓ THE PROBLEM:                                                 │
│ Vague words like "frequently" leave readers guessing about     │
│ your actual commitment. Without numbers, admissions can't      │
│ gauge whether this was a casual hobby or serious dedication.   │
│                                                                 │
│ 💡 WHY IT MATTERS:                                              │
│ Specific numbers build credibility and help admissions         │
│ officers understand the scale of your work. "156 hours over    │
│ 11 months" is far more impressive than "volunteered regularly."│
│                                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 📚 LEARN FROM THIS EXAMPLE:                                     │
│                                                                 │
│ ❌ WEAK: "I tutored students regularly."                       │
│ ✅ STRONG: "Every Tuesday and Thursday, 6-8pm, for 18 months, │
│    I tutored 12 students preparing for SATs."                  │
│                                                                 │
│ ➜ What changed?                                                 │
│   • Added specific days and times                              │
│   • Added duration (18 months)                                 │
│   • Added count (12 students)                                  │
│   • Added context (SAT prep)                                   │
│                                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🛠️ FIX STRATEGIES (choose one that fits your voice):          │
│                                                                 │
│ 1️⃣ ADD TIME COMMITMENT                                         │
│    Replace "frequently" with: "X hours per week for Y months" │
│    or total hours.                                             │
│    → Why this works: Time commitment signals dedication and    │
│       helps readers understand scope.                          │
│       [Apply This Fix]                                         │
│                                                                 │
│ 2️⃣ QUANTIFY PEOPLE IMPACTED                                    │
│    Add: "how many people? how many students? audience size?"   │
│    → Why this works: Scale of impact matters for assessing    │
│       significance.                                            │
│       [Explore This Fix]                                       │
│                                                                 │
│ 3️⃣ INCLUDE MEASURABLE OUTCOMES                                 │
│    Add: "money raised, projects completed, problems solved"    │
│    → Why this works: Tangible results prove your work had     │
│       real effects.                                            │
│       [Explore This Fix]                                       │
│                                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🤔 DIG DEEPER (answer these to strengthen your draft):         │
│                                                                 │
│ Q1: How many hours per week? How many weeks/months total?      │
│     [Short answer field]                                       │
│                                                                 │
│ Q2: How many people did you impact? Be specific.               │
│     [Short answer field]                                       │
│                                                                 │
│ Q3: What's one measurable outcome you can point to?            │
│     [Short answer field]                                       │
│                                                                 │
│ [Submit Answers] → Use these to improve your draft             │
└─────────────────────────────────────────────────────────────────┘
```

### Design Notes
- **Clear hierarchy**: Problem → Example → Fixes → Prompts
- **Scannable**: Use icons, bold headers, and visual separators
- **Actionable**: Every section has a clear next step
- **Encouraging tone**: "You've got this!" not "You failed"

---

## 5. Reflection & Exploration Flow

### Purpose
Many students have richer experiences than they initially describe. Reflection prompts help them:
- Surface forgotten details
- Articulate implicit learning
- Connect activity to broader insights

### Adaptive Prompt Generation

**Rule**: Questions adapt to the specific issue and activity type.

#### Example Prompt Sets

**For "Missing Concrete Numbers" Issue**:
1. "How many hours per week? How many weeks/months total?"
2. "How many people did you impact? Be specific."
3. "What's one measurable outcome you can point to?"

**For "Generic Reflection" Issue**:
1. "What did you believe about [topic] before starting? What do you believe now?"
2. "What's one thing you do differently now because of this experience?"
3. "What surprised you? What didn't go as expected?"

**For "No Stakes or Challenge" Issue**:
1. "What went wrong or was harder than expected?"
2. "When did you question if you could do this?"
3. "What was at risk if you failed?"

**For "Unclear Personal Role" Issue**:
1. "What would NOT have happened without you specifically?"
2. "What's one decision YOU made (not the team)?"
3. "Who did you directly influence or teach?"

### UI Flow

1. **User clicks "Explore This Fix"**
2. **Modal/Expandable panel appears** with 3 prompts
3. **User types short answers** (1-3 sentences each)
4. **Submit button** → Answers stored in context
5. **System highlights** where to insert these details in draft
6. **Optional**: Generator uses answers to propose rewrite

---

## 6. Rewrite Assist & Generation

### Two Modes

#### Mode 1: Inline Hints (Non-Invasive)
- As user types in editor, system analyzes in real-time (debounced)
- Shows subtle indicators next to sentences:
  - ✅ Green checkmark: "This sentence is strong!"
  - 🟡 Yellow suggestion: "Consider adding a metric here"
  - 🔴 Red flag: "This sounds generic — be specific"

**Interaction**: Hover over indicator → Tooltip with rationale

#### Mode 2: Generator Drafts (Assistive)
- User clicks "Generate Rewrite Suggestions"
- System calls `generatorAdapter.generateRewriteCandidates()`
- Produces 2-3 distinct candidates constrained by user's reflections

**Output**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI REWRITE SUGGESTIONS                                       │
│ We generated 3 versions based on your reflections. Pick one or │
│ use them as inspiration to write your own!                      │
├─────────────────────────────────────────────────────────────────┤
│ CANDIDATE 1: Concise Operator Style                            │
│ [Draft text here]                                               │
│                                                                 │
│ Why this works:                                                 │
│ • Added 3 specific metrics (hours, students, approval rating)  │
│ • Concise, action-oriented voice                               │
│ • Shows progression (first → last)                             │
│                                                                 │
│ Estimated score: 52 → 72 (+20)                                 │
│ [Use This] [Edit & Use] [Dismiss]                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ CANDIDATE 2: Warm Reflective Style                             │
│ [Draft text here]                                               │
│                                                                 │
│ Why this works:                                                 │
│ • Adds vulnerability ("I didn't expect...")                    │
│ • Deeper reflection on learning                                │
│ • Warm, conversational tone                                    │
│                                                                 │
│ Estimated score: 52 → 76 (+24)                                 │
│ [Use This] [Edit & Use] [Dismiss]                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ CANDIDATE 3: Action Arc Style                                  │
│ [Draft text here]                                               │
│                                                                 │
│ Why this works:                                                 │
│ • Clear narrative arc (problem → action → outcome)             │
│ • Stakes and tension                                           │
│ • Active verbs throughout                                      │
│                                                                 │
│ Estimated score: 52 → 74 (+22)                                 │
│ [Use This] [Edit & Use] [Dismiss]                              │
└─────────────────────────────────────────────────────────────────┘
```

### Guardrails
- **Flag synthetic additions**: If generator adds names/numbers/events not in original, mark with `⚠️ Verify This`
- **User approval required**: Always show candidates; never auto-replace
- **Preserve voice**: Candidates should feel like "polished version of me" not "robot wrote this"

---

## 7. Delta Visualization & Progress

### Purpose
Show measurable improvement to validate effort and motivate iteration.

### Progress Bar (Header)
```
┌───────────────────────────────────────────────────────────────────┐
│ [████████████░░░░░░░░░░] 52 → 78 NQI  •  Iteration 2 of 5       │
│ Strong Distinct Voice ✨ (was Generic Unclear)                   │
└───────────────────────────────────────────────────────────────────┘
```

**Visual Cues**:
- Progress bar fills as NQI increases
- Color transitions: Red (0-59) → Yellow (60-79) → Green (80-100)
- Label updates: "Generic Unclear" → "Solid Needs Polish" → "Strong Distinct Voice"

### Dimension Delta Cards
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 RUBRIC PROGRESS                                              │
├─────────────────────────────────────────────────────────────────┤
│ Voice Integrity          [████░░] 4 → 7  (+3) ✅                │
│ Specificity & Evidence   [██████] 3 → 6  (+3) ✅                │
│ Reflection & Meaning     [███░░░] 5 → 5  (±0) ⏸️                │
│ Narrative Arc & Stakes   [████░░] 4 → 4  (±0) ⏸️                │
│ ...                                                             │
│                                                                 │
│ [Expand All Dimensions]                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- ✅ Green checkmark: Improved
- ⏸️ Gray pause: No change
- ⬇️ Red arrow: Decreased (rare, but possible if user removed important content)

### Before/After Comparison Modal
Triggered when user clicks "Compare Versions"

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 BEFORE & AFTER COMPARISON                           [CLOSE] │
├──────────────────────────┬──────────────────────────────────────┤
│ ORIGINAL (NQI: 52)      │ IMPROVED (NQI: 78)                   │
│                          │                                      │
│ I volunteered frequently │ Every Tuesday, 6-9pm, for 18 months,│
│ at the food bank.        │ I organized food distribution for    │
│                          │ 200+ families at the local food bank.│
│ ❌ No metrics            │ ✅ Added time commitment             │
│ ❌ Passive role          │ ✅ Added impact (200+ families)      │
│                          │ ✅ Changed to active verb (organized)│
│                          │                                      │
│ [Show Full Original]     │ [Show Full Improved]                 │
└──────────────────────────┴──────────────────────────────────────┘
```

---

## 8. Iteration Loop & Version History

### Version History Sidebar
```
┌─────────────────────────┐
│ 🔄 VERSION HISTORY      │
├─────────────────────────┤
│ ● Current (unsaved)     │
│   NQI: 78               │
│                         │
│ ○ Version 2             │
│   NQI: 67 • 2:15pm      │
│   Fixed: Metrics        │
│   [Restore]             │
│                         │
│ ○ Version 1             │
│   NQI: 52 • 1:45pm      │
│   Original draft        │
│   [Restore]             │
└─────────────────────────┘
```

**Features**:
- Auto-save after each iteration
- One-click restore to previous version
- Shows NQI and key changes per version
- Max 10 versions (oldest auto-deleted)

### Iteration Workflow
1. **Analyze** → System grades draft, detects issues
2. **User fixes** 1-2 issues (via teaching units + reflection)
3. **Re-analyze** → System re-grades, shows delta
4. **Celebrate wins**: "Voice improved by +3! 🎉"
5. **Surface remaining gaps**: "Still missing: concrete reflection"
6. **User decides**: Continue iterating or finalize

**Exit Criteria**:
- User clicks "I'm Done" (manual exit)
- NQI reaches 80+ (suggest finalizing)
- Max 5 iterations reached (offer expert review option)

---

## 9. UI Components Specification

### 9.1 Issue Card Component
```tsx
<IssueCard
  id="specificity-no-numbers"
  severity="critical"
  category="Specificity & Evidence"
  title="Missing Concrete Numbers"
  excerpt="I volunteered frequently..."
  onExpand={() => loadTeachingUnit(id)}
  status="not_fixed" | "in_progress" | "fixed"
/>
```

**States**:
- `not_fixed`: Default collapsed state
- `in_progress`: User clicked "Apply Fix", editor highlights relevant section
- `fixed`: System detects issue resolved, card turns green with checkmark

---

### 9.2 Teaching Unit Component
```tsx
<TeachingUnit
  issue={detectedIssue}
  weakExample={weakExample}
  strongExample={strongExample}
  fixStrategies={[
    { text: "Add time commitment", rationale: "...", applyType: "add" },
    { text: "Quantify impact", rationale: "...", applyType: "elicit" },
  ]}
  reflectionPrompts={[
    { question: "How many hours per week?", purpose: "Surface time commitment" },
  ]}
  onApplyFix={(strategy) => highlightEditorSection(strategy)}
  onSubmitReflections={(answers) => storeContext(answers)}
/>
```

---

### 9.3 Editor Component
```tsx
<WorkshopEditor
  initialText={entry.description_original}
  highlights={[
    { start: 15, end: 35, color: "red", tooltip: "No metrics - be specific" },
    { start: 120, end: 145, color: "yellow", tooltip: "Add vulnerability here" },
  ]}
  onTextChange={(newText) => debouncedAnalyze(newText)}
  inlineHints={true}
  showLineNumbers={false}
/>
```

**Features**:
- Syntax-highlighting style for issue spans
- Hover tooltips explaining flags
- Character count (live updates)
- Undo/redo stack
- Copy/paste preserves formatting

---

### 9.4 Rewrite Candidate Component
```tsx
<RewriteCandidate
  text={candidate.text}
  rationale={candidate.rationale}
  styleLabel="Concise Operator"
  estimatedScoreGain={20}
  literaryTechniques={["Active verbs", "Specific metrics"]}
  onUse={() => replaceEditorText(candidate.text)}
  onEditAndUse={() => insertCandidateInEditMode(candidate.text)}
  onDismiss={() => removeCandidate(candidate.id)}
/>
```

---

### 9.5 Delta Visualization Component
```tsx
<DeltaVisualization
  dimensions={[
    { name: "Voice Integrity", before: 4, after: 7, delta: +3 },
    { name: "Specificity", before: 3, after: 6, delta: +3 },
  ]}
  overallBefore={52}
  overallAfter={78}
  celebrateWins={true} // Show confetti animation if delta > 15
/>
```

---

## 10. Interaction Patterns

### 10.1 First-Time User Flow
1. **Onboarding Modal** (dismissible):
   - "Welcome to the Workshop! We'll help you strengthen your extracurricular narrative."
   - "Here's how it works: [3-step visual]"
   - [Skip Tutorial] [Get Started]

2. **Guided Tour** (optional):
   - Highlight key UI areas with tooltips
   - "This is your draft editor..."
   - "Issues appear here, prioritized by impact..."
   - "Your progress is tracked here..."

### 10.2 Issue Resolution Flow
1. **Click issue card** → Expands teaching unit
2. **Read explanation + example** → Understand the problem
3. **Choose fix strategy** → Click "Apply This Fix" or "Explore This Fix"
4. **If "Apply"**: Editor scrolls to relevant section, highlights it
5. **If "Explore"**: Reflection prompts appear
6. **User edits draft** → System auto-saves
7. **Click "Re-analyze"** → System re-grades, updates card to "fixed" if resolved

### 10.3 Generator Interaction Flow
1. **User clicks "Generate Suggestions"**
2. **Loading state** (3-5s): "Generating 3 rewrite options based on your content..."
3. **Candidates appear** in expandable panel
4. **User reviews** each candidate
5. **User chooses**:
   - "Use This" → Replaces editor content (with confirmation)
   - "Edit & Use" → Inserts into editor in edit mode (user can tweak)
   - "Dismiss" → Hides candidate

### 10.4 Iteration Completion Flow
1. **User reaches NQI 80+** → Banner appears: "🎉 Strong narrative! You can finalize now or keep polishing."
2. **User clicks "Finalize"** → Confirmation modal with summary:
   - "You improved your NQI from 52 → 82!"
   - "Key improvements: Added metrics, deepened reflection, clarified role"
   - [Export to Profile] [Keep Editing]

---

## 11. Content Guidelines

### Tone & Voice
- **Encouraging**: "You're on the right track!"
- **Mentor-like**: "Here's what I notice..."
- **Specific**: "Add how many hours per week" not "add more detail"
- **Celebratory**: "Voice improved by +3! 🎉" when progress made

### Writing Dos & Don'ts

✅ **DO**:
- Use active voice ("Add metrics" not "Metrics should be added")
- Provide concrete examples ("Every Tuesday, 6-9pm" not "regularly")
- Explain WHY ("This builds credibility" not just "This is better")
- Offer multiple paths ("Choose the fix that fits your voice")

❌ **DON'T**:
- Use jargon ("literary sophistication score" → "strong writing")
- Judge harshly ("This is terrible" → "This needs strengthening")
- Prescribe one solution ("You must..." → "Consider...")
- Overwhelm with theory (keep explanations under 3 sentences)

### Example Language Bank

**For Problem Explanations**:
- "This sounds generic because..."
- "Readers can't tell what YOU did specifically when..."
- "Without [X], admissions officers have to guess..."

**For Fix Rationales**:
- "Why this works: [specific benefit]"
- "This strategy helps because..."
- "Adding [X] makes your story more [credible/specific/memorable]"

**For Encouragement**:
- "You've got rich material here — let's bring it out!"
- "This is a strong start. Here's how to level it up:"
- "Great progress! You improved [dimension] by [N] points."

---

## 12. Accessibility & Responsiveness

### Accessibility (WCAG 2.1 AA Compliance)

#### Keyboard Navigation
- All interactive elements accessible via Tab
- Escape key closes modals
- Enter key submits forms
- Arrow keys navigate issue cards

#### Screen Readers
- Semantic HTML (`<article>`, `<section>`, `<nav>`)
- `aria-label` on all icons
- `aria-live` for dynamic score updates
- `role="status"` for progress indicators

#### Visual
- High contrast mode support
- Text size adjustable (supports browser zoom)
- No color-only indicators (always pair with icon/label)
- Focus indicators visible (2px solid border)

#### Cognitive
- Simple language (Grade 9 reading level)
- Avoid jargon
- One primary action per section
- Progress indicators to reduce anxiety

### Responsive Design

#### Desktop (1024px+)
- Side-by-side layout (issue cards + editor)
- Full teaching units visible

#### Tablet (768px - 1023px)
- Stacked layout (issue cards above editor)
- Teaching units in modal overlays

#### Mobile (< 768px)
- Single-column vertical flow
- Swipeable issue cards
- Bottom sheet for teaching units
- Collapsible reflection prompts

---

## 13. Error States & Edge Cases

### 13.1 Analysis Fails
**Scenario**: API call to analyzer times out or returns error

**UI Response**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Analysis Temporarily Unavailable                             │
│                                                                 │
│ We couldn't analyze your draft right now. This might be due to:│
│ • Server maintenance                                            │
│ • Temporary connectivity issue                                 │
│                                                                 │
│ Your draft is saved. Try again in a moment.                     │
│                                                                 │
│ [Retry Now] [Save & Exit]                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### 13.2 Generator Produces Low-Quality Output
**Scenario**: Generator candidates all score below original NQI

**UI Response**:
- Don't show candidates (no point)
- Show message: "Generator couldn't produce improvements. Try manually applying the fix strategies above."
- Log to backend for review

---

### 13.3 No Issues Detected
**Scenario**: Entry already scores 90+ NQI

**UI Response**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Excellent Narrative! (NQI: 92/100)                           │
│                                                                 │
│ Your entry is already strong. We found no critical issues.     │
│                                                                 │
│ Optional polish suggestions:                                    │
│ • [Minor suggestion 1]                                          │
│ • [Minor suggestion 2]                                          │
│                                                                 │
│ [Finalize & Export] [Keep Polishing]                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 13.4 User's Draft is Too Short
**Scenario**: Entry < 50 characters

**UI Response**:
- Block analysis
- Show message: "Your draft is too short to analyze meaningfully. Write at least 50 characters (about 1-2 sentences) first."

---

### 13.5 User's Draft is Too Long
**Scenario**: Entry > 700 characters

**UI Response**:
- Allow analysis but warn
- Show character count: "712 / 700 characters (12 over limit)"
- Highlight excess text in red
- Suggest: "Common App extracurricular descriptions have a 150-character limit. Consider focusing on the most impactful elements."

---

### 13.6 Version Restore Conflict
**Scenario**: User restores old version while having unsaved changes

**UI Response**:
- Show confirmation modal:
  - "You have unsaved changes. Restoring Version 1 will discard them."
  - [Cancel] [Discard & Restore]

---

## 14. Success Metrics & Analytics

### User Engagement Metrics
- **Workshop Completion Rate**: % users who complete ≥1 iteration
- **Average Iterations per Session**: Target 2-3 (sweet spot)
- **Issue Resolution Rate**: % of flagged issues user addresses
- **Reflection Prompt Completion**: % users who answer ≥2/3 prompts
- **Generator Acceptance Rate**: % users who keep ≥1 generator candidate

### Quality Metrics
- **Average NQI Gain per Session**: Target +15-20 points
- **Post-Workshop NQI Distribution**: % reaching 70+, 80+
- **Authenticity Preservation**: Authenticity score shouldn't drop >1 point
- **Dimension Balance**: Ensure no dimension neglected (variance check)

### Pedagogical Metrics
- **Learning Summary Completion**: % users who read/export learning summary
- **Teaching Example Engagement**: Click-through rate on examples
- **Fix Strategy Diversity**: Do users explore multiple strategies or always pick #1?

### Technical Metrics
- **Latency**: Analysis < 5s, Generator < 8s
- **Error Rate**: < 1% failures (graceful degradation)
- **Feedback Loop Time**: Time from user edit → re-analysis → visible delta

### Feedback Collection
- **Post-Workshop Survey** (optional, dismissible):
  1. "Did this workshop help you improve your narrative?" (Yes/No)
  2. "What was most helpful?" (Multiple choice: Examples / Reflection prompts / Generator / Explanations)
  3. "What was unclear or frustrating?" (Open text, optional)

---

## 15. Implementation Phases

### Phase 1: Core Workshop Flow (Week 1)
- ✅ Issue detection integration (use existing `issueDetector.ts`)
- ✅ Teaching Unit component (problem + example + fixes)
- ✅ Editor with inline highlights
- ✅ Basic delta visualization (NQI before/after)
- ✅ Version history (manual save points)

**Deliverable**: Users can see issues, read teaching units, edit draft, see score change

---

### Phase 2: Reflection & Generation (Week 2)
- ✅ Reflection prompt system (adaptive questions)
- ✅ Generator integration (2-3 candidates)
- ✅ Side-by-side comparison view
- ✅ Fix strategy interaction ("Apply" vs "Explore" flows)

**Deliverable**: Users can answer prompts, generate rewrites, compare versions

---

### Phase 3: Polish & Scale (Week 3)
- ✅ Teaching example corpus (20-30 human-written pairs)
- ✅ Onboarding flow + tutorial
- ✅ Mobile responsive layout
- ✅ Accessibility audit (WCAG AA)
- ✅ Error handling + edge cases
- ✅ Analytics instrumentation

**Deliverable**: Production-ready workshop with full UX

---

## Appendix A: Teaching Example Seed Set

### Example 1: Adding Metrics

**Issue**: Missing Concrete Numbers
**Weak**: "I volunteered frequently at the food bank."
**Strong**: "Every Tuesday, 6-9pm, for 18 months, I organized food distribution for 200+ families at the local food bank."

**What Changed**:
- Added specific days and times
- Added duration (18 months)
- Added impact (200+ families)
- Changed to active verb (organized)

---

### Example 2: Removing Essay-Speak

**Issue**: Essay-Speak Detected
**Weak**: "Through this experience, I learned the value of teamwork and perseverance."
**Strong**: "When Sarah caught my coding mistake hours before the client demo, I realized great teams make everyone better."

**What Changed**:
- Removed "through this experience" (essay-speak)
- Removed generic lesson ("teamwork")
- Added specific moment (Sarah, coding mistake, client demo)
- Showed insight through story, not statement

---

### Example 3: Adding Reflection

**Issue**: Generic Reflection
**Weak**: "I learned leadership through organizing events."
**Strong**: "I used to think leadership meant having all the answers. After three event flops, I learned it's about asking the right questions and empowering others to solve problems."

**What Changed**:
- Removed generic "learned leadership"
- Added belief shift (before vs after thinking)
- Showed vulnerability (three flops)
- Connected to behavioral change (asking vs answering)

---

### Example 4: Clarifying Role

**Issue**: Unclear Personal Role
**Weak**: "We organized a fundraiser that raised $5,000."
**Strong**: "When our venue cancelled three days before the fundraiser, I cold-called 12 businesses and secured a new space. We raised $5,020."

**What Changed**:
- Clarified what "I" did vs "we" did
- Added stakes (venue cancelled, 3 days before)
- Added specific action (cold-called 12 businesses)
- Kept team outcome but showed individual contribution

---

### Example 5: Adding Stakes

**Issue**: Missing Stakes or Challenge
**Weak**: "I tutored math students and they improved."
**Strong**: "My first tutoring session bombed — the student left after 20 minutes, frustrated. I spent that weekend learning how to explain calculus without jargon. By session six, she aced her midterm."

**What Changed**:
- Added initial failure (student left, frustrated)
- Showed obstacle (didn't know how to teach without jargon)
- Showed turning point (spent weekend learning)
- Showed outcome with metric (aced midterm)

---

## Appendix B: Reflection Prompt Templates

### Category: Specificity & Evidence

**Prompt Set A**: Eliciting Metrics
1. "How many hours per week? How many weeks or months total?"
2. "How many people did you directly interact with or impact?"
3. "What's one measurable outcome you can point to? (money raised, problems solved, projects completed)"

**Prompt Set B**: Eliciting Growth
1. "What could you do at the END that you couldn't do at the START?"
2. "How did your approach change from your first attempt to your last?"
3. "What metric improved over time? (speed, quality, confidence, results)"

---

### Category: Reflection & Meaning

**Prompt Set A**: Belief Shifts
1. "What did you believe about [topic] before starting? What do you believe now?"
2. "What assumption did you have that turned out wrong?"
3. "What surprised you about this experience?"

**Prompt Set B**: Transferable Learning
1. "What's one thing you do differently now (outside this activity) because of what you learned?"
2. "If you had to teach one skill from this experience, what would you teach and why?"
3. "How does this experience inform how you'll approach challenges in college?"

---

### Category: Narrative Arc & Stakes

**Prompt Set A**: Eliciting Stakes
1. "What went wrong or was harder than expected?"
2. "When did you question whether you could succeed?"
3. "What was at risk if you failed?"

**Prompt Set B**: Eliciting Turning Points
1. "When did things shift? What triggered the breakthrough?"
2. "What advice, failure, or observation changed your approach?"
3. "Describe one moment when you felt 'aha, now I get it.'"

---

### Category: Initiative & Leadership

**Prompt Set A**: Clarifying Ownership
1. "What would NOT have happened without you specifically?"
2. "What's one decision YOU made (not your teacher, parent, or team)?"
3. "Who did you directly influence, teach, or inspire? Give one specific name."

**Prompt Set B**: Showing Agency
1. "When did you create something new (not just maintain something existing)?"
2. "What problem did you see that others ignored, and what did you do about it?"
3. "When did you take initiative without being asked?"

---

## Appendix C: UI Copy Examples

### Button Labels
- **Primary Actions**: "Apply This Fix" | "Generate Suggestions" | "Re-analyze Draft" | "Finalize & Export"
- **Secondary Actions**: "Explore This Fix" | "Edit & Use" | "Compare Versions" | "Restore Version"
- **Dismissive Actions**: "Skip Tutorial" | "Maybe Later" | "Cancel" | "Dismiss"

### Progress Indicators
- **Loading States**: "Analyzing your draft..." | "Generating 3 rewrite options..." | "Re-calculating scores..."
- **Success States**: "Analysis complete!" | "Issues detected: 4 critical, 2 important" | "Draft saved!"
- **Error States**: "Analysis failed. Retrying..." | "Generator unavailable. Try manual fixes."

### Celebration Messages
- NQI +5-10: "Nice! +[N] points."
- NQI +11-20: "Great progress! +[N] points. 🎉"
- NQI +21+: "Wow! You jumped +[N] points! 🚀"
- Issue resolved: "✅ [Issue] fixed! [Dimension] improved by +[N]."

---

**End of UX Design Document**

**Status**: ✅ Phase 0 Complete — Ready for Human Review
**Next Step**: Review with stakeholder, approve, proceed to Phase 1 implementation
**Questions?**: See [found_services.md](./found_services.md) for technical integration details
