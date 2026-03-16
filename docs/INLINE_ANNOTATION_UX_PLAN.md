# Inline Annotation Editor — Comprehensive UX Implementation Plan

> **Status**: Design & Architecture (awaiting approval)
> **Date**: 2026-03-11
> **Scope**: Full inline editing experience with live sentence/paragraph profiles, color-coded annotations, and contextual insight panels
> **Depends on**: Essay Intelligence pipeline (L1-L5), EssayProfile type system, existing annotation components

---

## Table of Contents

1. [Vision & Core Experience](#1-vision--core-experience)
2. [Color System Architecture](#2-color-system-architecture)
3. [Editor Foundation](#3-editor-foundation)
4. [Annotation Layer Architecture](#4-annotation-layer-architecture)
5. [Interaction Model](#5-interaction-model)
6. [Detail Panel — The Core UX Innovation](#6-detail-panel--the-core-ux-innovation)
7. [Page Layout Architecture](#7-page-layout-architecture)
8. [Toolbar & Navigation](#8-toolbar--navigation)
9. [Data Flow & State Management](#9-data-flow--state-management)
10. [Paragraph-Level Experience](#10-paragraph-level-experience)
11. [Sentence-Level Experience](#11-sentence-level-experience)
12. [Connection Visualization](#12-connection-visualization)
13. [Progressive Disclosure Strategy](#13-progressive-disclosure-strategy)
14. [Animation & Visual Design](#14-animation--visual-design)
15. [Mobile & Responsive Strategy](#15-mobile--responsive-strategy)
16. [Accessibility](#16-accessibility)
17. [Performance Architecture](#17-performance-architecture)
18. [Implementation Phases](#18-implementation-phases)
19. [File Structure & Component Map](#19-file-structure--component-map)
20. [Risk Assessment](#20-risk-assessment)

---

## 1. Vision & Core Experience

### The Problem

Current essay feedback is **detached from the writing**. Students write in one place (textarea), then scroll through structured feedback cards elsewhere. This creates:

- **Context switching**: "Which sentence are they talking about?"
- **Information overload**: Wall of structured feedback that all looks the same
- **Repetitive feel**: Feedback organized by dimension, not by location — so every section repeats "in paragraph 3..."
- **No spatial memory**: Students can't glance at their essay and see where the issues are

### The Vision

**A Word-doc-like editing experience where the essay itself IS the interface.** Every sentence and paragraph is a living object that carries its own profile, analysis, and feedback. You don't go somewhere else to see feedback — you see it right where you're writing.

The experience should feel like a senior editor reviewed your essay with a multi-colored pen:

- **Red underlines** catch your eye on critical issues
- **Yellow highlights** flag things worth improving
- **Green glows** reassure you that something is working
- **Cyan/purple shimmers** celebrate writing the system thinks is exceptional

Click any sentence, and a panel opens with everything we know about it — what it's doing, how well it's working, and what to do about it. No scrolling. No searching. The intelligence is right there, attached to the exact words.

### Core Principles

1. **The essay is the interface** — Feedback lives where the writing lives
2. **Spatial encoding** — Color and visual weight encode quality at a glance
3. **Progressive depth** — Glance → hover → click → deep dive
4. **Room for improvement first** — Default view highlights what to fix; green confirmation comes after improvement
5. **No information overload** — Show the right amount at each interaction level
6. **Edit-in-place** — Students fix issues without leaving the annotated view
7. **Architecture-grounded** — Every annotation connects to the essay's structural purpose (North Star)

---

## 2. Color System Architecture

### The Six-Tier Severity Spectrum

Mapped directly to L3.5 effectiveness scores:

```
TIER 1: CRITICAL        Red (#EF4444)      Score <40     Actively harms the essay
TIER 2: NEEDS WORK      Amber (#F59E0B)    Score 40-54   Weak but functional
TIER 3: FUNCTIONAL      Sage (#84CC16)     Score 55-75   Gets the job done
TIER 4: STRONG           Green (#22C55E)    Score 76-85   Genuinely strong
TIER 5: EXCEPTIONAL     Teal (#14B8A6)     Score 86-95   Distinctive, memorable
TIER 6: MASTERFUL       Purple (#A855F7)   Score 96-100  System can't improve it
```

### How Colors Map to the User's Mental Model

| Color | Meaning to Student | When They See It |
|-------|-------------------|-----------------|
| **Red** | "This needs fixing" | Critical structural/clarity/logic issue |
| **Amber/Yellow** | "This could be better" | Non-critical improvement opportunity |
| **Sage/Light Green** | "This works" | Functional, acceptable for submission |
| **Green** | "This is strong" | Genuinely effective writing |
| **Teal/Cyan** | "This is great" | Exceptional, distinctive moment |
| **Purple** | "This is peak" | Masterful — the system's highest praise |

### Visual Treatment by Tier

Each tier gets a distinct visual treatment — NOT just color but also decoration style:

```
CRITICAL (Red):
  - Background: rgba(239, 68, 68, 0.08) — very subtle red wash
  - Left border: 3px solid red-500
  - Underline: wavy red-400 (draws attention)
  - Gutter dot: solid red circle
  - Pulse animation: subtle red pulse on first load (then settles)

NEEDS WORK (Amber):
  - Background: rgba(245, 158, 11, 0.06)
  - Left border: 2px solid amber-400
  - Underline: dashed amber-400
  - Gutter dot: amber circle

FUNCTIONAL (Sage):
  - Background: none (clean — this is "normal")
  - Left border: none
  - Underline: none
  - Gutter dot: small sage dot (visible but not distracting)

STRONG (Green):
  - Background: rgba(34, 197, 94, 0.04) — barely there green tint
  - Left border: none
  - Underline: subtle solid green-400 (thin)
  - Gutter dot: green circle

EXCEPTIONAL (Teal):
  - Background: rgba(20, 184, 166, 0.06) — soft teal wash
  - Left border: 2px solid teal-400
  - Underline: solid teal-400
  - Gutter dot: teal circle with subtle glow

MASTERFUL (Purple):
  - Background: linear-gradient(135deg, rgba(34,197,94,0.04), rgba(20,184,166,0.06), rgba(168,85,247,0.08))
  - Left border: 2px gradient green→cyan→purple
  - Underline: solid with gradient green→cyan→purple
  - Gutter dot: purple circle with shimmer animation
  - Special: subtle sparkle/shimmer CSS animation (very restrained)
```

### Color in Context: What's Highlighted vs Not

**Default view (Room for Improvement focus)**:
- Red and Amber sentences are prominently highlighted
- Sage sentences have NO visual treatment (they're fine, don't distract)
- Green/Teal/Purple sentences get SUBTLE positive indicators (thin underlines, small dots)
- This ensures the eye goes to problems first

**After improvement (Celebration mode)**:
- When a student edits a sentence and re-analysis shows improvement:
  - Brief animation: the old color fades, new color blooms
  - If Red → Green: satisfying "resolved" animation (red dissolves, green grows)
  - The green confirmation is EARNED — you only see it after you've improved something
  - Previously-green sentences that were always green get subtler treatment than newly-improved ones

### CSS Custom Properties

```css
:root {
  /* Annotation severity colors */
  --anno-critical: 0 84% 60%;        /* Red */
  --anno-critical-bg: 0 84% 60% / 0.08;
  --anno-needs-work: 38 92% 50%;     /* Amber */
  --anno-needs-work-bg: 38 92% 50% / 0.06;
  --anno-functional: 82 78% 44%;     /* Sage */
  --anno-strong: 142 71% 45%;        /* Green */
  --anno-strong-bg: 142 71% 45% / 0.04;
  --anno-exceptional: 168 76% 42%;   /* Teal */
  --anno-exceptional-bg: 168 76% 42% / 0.06;
  --anno-masterful: 271 81% 56%;     /* Purple */
  --anno-masterful-bg: 271 81% 56% / 0.08;

  /* Gradient for masterful tier */
  --anno-masterful-gradient: linear-gradient(
    135deg,
    hsl(var(--anno-strong)),
    hsl(var(--anno-exceptional)),
    hsl(var(--anno-masterful))
  );
}
```

---

## 3. Editor Foundation

### Why TipTap (ProseMirror)

We need a rich text editor that supports:
- **Decorations**: Non-destructive visual overlays (annotations don't modify content)
- **Marks**: For persistent annotations that track with text
- **Plugin system**: Custom behavior layers (annotation hover, click handlers)
- **Schema control**: Define exactly what's allowed (paragraphs + sentences, no tables/images)
- **React integration**: First-class React component model
- **Collaboration-ready**: Yjs support for future real-time editing

**TipTap** (built on ProseMirror) is the right choice because:
- Best-in-class decoration system for exactly this use case
- Battle-tested ProseMirror foundation (Google Docs, NY Times, Atlassian)
- Extensive React headless component library
- Active ecosystem with annotation-focused extensions
- Lightweight — headless approach means we control all UI

**Alternatives considered and rejected**:
- **Slate.js**: Great flexibility but weaker decoration system, less battle-tested
- **Lexical (Meta)**: Newer, less ecosystem, decoration story is immature
- **Draft.js**: Deprecated by Meta, no future
- **Plain contenteditable**: Too low-level, we'd rebuild ProseMirror poorly
- **Monaco**: Code editor, wrong paradigm entirely

### TipTap Setup

```
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
npm install @tiptap/extension-placeholder @tiptap/extension-character-count
```

### Schema Definition

The editor schema is intentionally minimal — essays are plain text with paragraph structure:

```typescript
// src/components/editor/schema.ts
import { Node } from '@tiptap/core';

// Custom paragraph node that carries essay intelligence metadata
const EssayParagraph = Node.create({
  name: 'essayParagraph',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      paragraphIndex: { default: null },
      entityId: { default: null },     // Future: semantic identity
      tier: { default: null },          // Computed from analysis
    };
  },
});
```

### Decoration Plugin Architecture

The key to the entire UX: **ProseMirror Decorations** overlay visual annotations without touching document content.

```typescript
// Conceptual architecture — decorations are computed from EssayProfile

function computeDecorations(profile: EssayProfile, doc: ProseMirrorDoc): DecorationSet {
  const decorations: Decoration[] = [];

  for (const paragraph of profile.paragraphMap) {
    for (const sentence of paragraph.sentences) {
      if (!sentence.analysis) continue;

      const tier = effectivenessToTier(sentence.analysis.effectiveness);
      const { from, to } = resolveSentencePosition(doc, paragraph.index, sentence.index);

      decorations.push(
        Decoration.inline(from, to, {
          class: `anno-tier-${tier}`,
          'data-paragraph': paragraph.index,
          'data-sentence': sentence.index,
          'data-tier': tier,
        })
      );
    }
  }

  return DecorationSet.create(doc, decorations);
}
```

### Position Resolution

Mapping EssayProfile sentence indices to ProseMirror document positions:

```typescript
// src/components/editor/positionResolver.ts

interface SentencePosition {
  paragraphIndex: number;
  sentenceIndex: number;
  from: number;       // ProseMirror position (start)
  to: number;         // ProseMirror position (end)
  text: string;       // Actual text content
}

// Build a position map from the current document state
function buildPositionMap(doc: ProseMirrorDoc): SentencePosition[] {
  // Walk document paragraphs
  // For each paragraph, split into sentences (using the same splitter as backend)
  // Record the ProseMirror positions for each sentence
  // Return the complete map
}

// On every doc change, rebuild the position map
// On profile update, recompute decorations using the position map
```

### Sentence Splitting Consistency

**Critical**: The frontend sentence splitter MUST match the backend exactly. Otherwise annotations point to wrong sentences.

```typescript
// Shared utility: src/utils/sentenceSplitter.ts
// Used by both backend (analysis pipeline) and frontend (position resolver)
// Rule: Split on .!? followed by space + capital letter, with exceptions for:
//   - Abbreviations (Mr., Dr., etc.)
//   - Decimal numbers (3.14)
//   - Ellipsis (...)
//   - Quoted sentences within a sentence
```

---

## 4. Annotation Layer Architecture

### Three Sources of Annotation Data

The UI consumes three distinct data streams from EssayProfile:

```
1. SENTENCE ANALYSIS (L3.5) — Per-sentence effectiveness + strengths/weaknesses
   → Drives: color-coding, tier assignment, gutter indicators
   → Persistent, stored in profile

2. DEEP ANNOTATIONS (L5) — Teaching feedback with causal chains
   → Drives: insight panel content, rewrite suggestions
   → Ephemeral, generated fresh each analysis pass

3. SENTENCE UNDERSTANDING (L3) — Deep profile of what each sentence IS
   → Drives: profile tab content, observed functions, craft details
   → Persistent, stored in profile
```

### Annotation Data Model (Frontend)

```typescript
// src/components/editor/types.ts

// The tier computed from L3.5 effectiveness score
type AnnotationTier = 'critical' | 'needs-work' | 'functional' | 'strong' | 'exceptional' | 'masterful';

// What the UI needs per sentence (computed from EssayProfile)
interface SentenceAnnotationData {
  // Identity
  paragraphIndex: number;
  sentenceIndex: number;
  text: string;

  // Visual (from L3.5 analysis)
  tier: AnnotationTier;
  effectiveness: number;          // 0-100
  isStrength: boolean;
  isProblem: boolean;
  priorityForImprovement: number; // 0-5

  // Insight tab content (from L5 annotations)
  annotations: L5Annotation[];    // Teaching feedback items

  // Profile tab content (from L3 understanding)
  understanding: SentenceUnderstanding | null;

  // Analysis details (from L3.5)
  analysis: SentenceAnalysis | null;

  // Connections to other parts of the essay
  connections: ConnectionRef[];
}

// What the UI needs per paragraph
interface ParagraphAnnotationData {
  paragraphIndex: number;
  text: string;

  // Aggregate tier (worst sentence tier in paragraph)
  aggregateTier: AnnotationTier;

  // Paragraph-level profile (from L3)
  understanding: ParagraphUnderstanding | null;

  // Paragraph-level analysis (from L3.5)
  analysis: ParagraphAnalysis | null;

  // North Star structural role
  structuralRole: string | null;
  northStarSignificance: string | null;

  // All sentence data within
  sentences: SentenceAnnotationData[];

  // Paragraph-level L5 annotations
  annotations: L5Annotation[];
}

// The complete annotation state for the editor
interface EditorAnnotationState {
  paragraphs: ParagraphAnnotationData[];

  // Essay-level context
  improvementPhase: ImprovementPhase;
  northStar: EssayNorthStar | null;
  voiceIdentity: VoiceIdentity | null;

  // Aggregate stats for toolbar
  totalAnnotations: number;
  criticalCount: number;
  needsWorkCount: number;
  strengthCount: number;

  // Loading/stale state
  isAnalyzing: boolean;
  staleParagraphs: number[];
}
```

### Tier Computation

```typescript
function effectivenessToTier(score: number): AnnotationTier {
  if (score < 40) return 'critical';
  if (score < 55) return 'needs-work';
  if (score < 76) return 'functional';
  if (score < 86) return 'strong';
  if (score < 96) return 'exceptional';
  return 'masterful';
}

function aggregateParagraphTier(sentences: SentenceAnnotationData[]): AnnotationTier {
  // Paragraph tier = worst sentence tier (pulls attention to problems)
  // BUT: if only 1 sentence is critical and 8 are strong, the paragraph
  // indicator should be amber (not red) — the critical sentence itself is red
  const tiers = sentences.map(s => s.tier);
  const hasCritical = tiers.includes('critical');
  const hasNeedsWork = tiers.includes('needs-work');

  if (hasCritical) return 'needs-work'; // Paragraph = amber, sentence = red
  if (hasNeedsWork) return 'needs-work';

  // If no issues, use average/median for positive tier
  const avgScore = sentences.reduce((sum, s) => sum + s.effectiveness, 0) / sentences.length;
  return effectivenessToTier(avgScore);
}
```

---

## 5. Interaction Model

### Four Levels of Progressive Interaction

```
LEVEL 0: GLANCE
  What: See colors across the entire essay at a glance
  How: Color-coded sentence backgrounds + gutter dots
  Information: "Where are the problems? Where is it strong?"
  No interaction required — visual encoding does the work

LEVEL 1: HOVER
  What: Preview tooltip on any highlighted sentence
  How: Mouse hover / long press (mobile)
  Information: One-line summary ("This opening tells but doesn't show")
  Duration: 300ms delay, disappears on mouseout

LEVEL 2: CLICK
  What: Full detail panel opens for the clicked sentence
  How: Click anywhere on a highlighted sentence
  Information: Multi-tab panel with Insights + Profile
  Behavior: Panel persists until dismissed or another sentence clicked

LEVEL 3: DEEP DIVE
  What: Expanded view with connections, earned-ness, voice map
  How: Click "See connections" or "Deep dive" within the panel
  Information: Full network view, related annotations, structural context
  Behavior: Expands within the panel or opens modal for complex visualizations
```

### Click Behavior Specification

```
USER CLICKS SENTENCE:
  1. Sentence gets a selection ring (2px solid with tier color, subtle)
  2. All OTHER sentence highlights dim slightly (opacity 0.5) — focus effect
  3. Detail panel slides in from the right (or expands if already open)
  4. Panel shows data for the clicked sentence
  5. Editor scrolls if needed to keep both sentence and panel visible

USER CLICKS ANOTHER SENTENCE:
  1. Previous sentence selection deselects (ring fades)
  2. New sentence gets selection ring
  3. Panel content transitions (crossfade, 200ms)
  4. No panel slide — it's already open

USER CLICKS NON-HIGHLIGHTED TEXT:
  1. Selection clears
  2. Panel either: (a) closes with slide-out, or (b) shows essay overview
  Option (b) is better — panel always shows SOMETHING useful

USER CLICKS OUTSIDE EDITOR:
  1. Selection and panel remain (don't dismiss on defocus)
  2. Only explicit dismiss (X button or Escape key) closes the panel

ESCAPE KEY:
  1. If deep dive expanded → collapse to normal panel
  2. If normal panel open → close panel, deselect sentence
  3. If panel closed → no action
```

### Hover Behavior Specification

```
MOUSE ENTERS HIGHLIGHTED SENTENCE:
  - After 300ms delay: show tooltip above/below sentence
  - Tooltip content:
    - Tier badge (colored dot + "Critical" / "Strong" / etc.)
    - One-line summary (from L5 annotation content, first 80 chars)
    - "Click for details" hint (first few times, then fades via localStorage)
  - Tooltip position: prefer above, flip below if near top of viewport

MOUSE LEAVES SENTENCE:
  - Tooltip fades (150ms)
  - If mouse enters tooltip itself: tooltip persists (allows copying text)

MOUSE ENTERS GUTTER DOT:
  - Show paragraph-level tooltip:
    - "Paragraph 3: Architecture · 2 issues, 4 strengths"
    - Mini sentence breakdown (colored dots inline)
```

### Keyboard Navigation

```
TAB:           Move to next annotated sentence (skip functional/clean ones)
SHIFT+TAB:     Move to previous annotated sentence
ENTER:         Open detail panel for focused sentence
ESCAPE:        Close panel / collapse deep dive
ARROW UP/DOWN: Scroll through annotations in detail panel
1 / 2:         Switch panel tabs (1=Insights, 2=Profile)
F:             Toggle filter bar
```

---

## 6. Detail Panel — The Core UX Innovation

### Panel Structure

```
┌────────────────────────────────────────┐
│ ┌──────────────────────────────────┐   │
│ │ SENTENCE HEADER                  │   │
│ │ "The diamond wasn't just..."     │   │
│ │ P3 · Sentence 2 · ●● Strong     │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌────────────┬─────────────┐           │
│ │  Insights  │   Profile   │           │
│ ├────────────┴─────────────┤           │
│ │                          │           │
│ │  [Tab content below]     │           │
│ │                          │           │
│ │                          │           │
│ │                          │           │
│ │                          │           │
│ │                          │           │
│ │                          │           │
│ └──────────────────────────┘           │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ CONNECTIONS (collapsed)    [▶]   │   │
│ │ Links to P1S3, P4S1 · 2 themes  │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### Panel Header

Always visible at the top of the panel:

```typescript
interface PanelHeader {
  // The sentence text (truncated to ~60 chars with ellipsis)
  sentencePreview: string;

  // Location: "P3 · Sentence 2"
  location: string;

  // Tier badge with color dot: "●● Strong" (76/100)
  tier: AnnotationTier;
  effectiveness: number;

  // Quick action buttons
  actions: {
    copyText: boolean;        // Copy sentence text
    jumpToNext: boolean;      // Jump to next annotation
    dismiss: boolean;         // Close panel (X)
  };
}
```

### Tab 1: Insights (Default Tab)

The "what we found and what to do" tab. This is what students see first.

**Content hierarchy:**

```
┌──────────────────────────────────────┐
│ INSIGHTS                              │
├──────────────────────────────────────┤
│                                      │
│ ┌ MAIN INSIGHT ─────────────────┐    │
│ │                               │    │
│ │ 🔸 Growth Opportunity          │    │ ← Type badge (icon + label)
│ │                               │    │
│ │ Your opening sentence tells   │    │ ← The critique/praise
│ │ the reader about the diamond's│    │   (2-4 sentences, specific,
│ │ significance but doesn't let  │    │    architecture-grounded)
│ │ them witness the moment.      │    │
│ │                               │    │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │    │
│ │                               │    │
│ │ WHY THIS MATTERS              │    │ ← Teaching rationale
│ │                               │    │   (connects to North Star)
│ │ This is your thesis anchor —  │    │
│ │ the fulcrum your entire essay │    │
│ │ pivots on. If the reader      │    │
│ │ doesn't FEEL this moment,     │    │
│ │ your arc from "commodity" to  │    │
│ │ "identity" doesn't land.      │    │
│ │                               │    │
│ └───────────────────────────────┘    │
│                                      │
│ ┌ REWRITE SUGGESTION (collapsible)─┐ │
│ │                                  │ │
│ │ "Standing in the pawnshop,       │ │ ← Concrete example
│ │ fluorescent lights glancing off  │ │   (editable — student can
│ │ the diamond's facets, I realized │ │    modify and apply)
│ │ this stone carried more than     │ │
│ │ carats."                         │ │
│ │                                  │ │
│ │ [Apply to Essay]  [Modify First] │ │ ← Action buttons
│ └──────────────────────────────────┘ │
│                                      │
│ ┌ ADDITIONAL INSIGHTS (if any) ────┐ │
│ │ ▸ Structural Note: This para...  │ │ ← Collapsed, expandable
│ │ ▸ Teaching Moment: The word...   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                      │
│ ┌ STRENGTHS (if any) ─────────────┐ │
│ │ ✓ Effective sensory detail in   │ │ ← What's working
│ │   "fluorescent lights glancing"  │ │   (always show, even on
│ │ ✓ Natural voice consistency      │ │    problem sentences —
│ │                                  │ │    what NOT to change)
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**For strength sentences** (green/teal/purple), the layout inverts:

```
┌──────────────────────────────────────┐
│ INSIGHTS                              │
├──────────────────────────────────────┤
│                                      │
│ ┌ MAIN INSIGHT ─────────────────┐    │
│ │                               │    │
│ │ ✨ Strength                    │    │
│ │                               │    │
│ │ This sentence does heavy      │    │
│ │ architectural lifting — it    │    │
│ │ grounds the abstract "value"  │    │
│ │ theme in concrete sensory     │    │
│ │ experience. The reader FEELS  │    │
│ │ the pawnshop before you ask   │    │
│ │ them to think about meaning.  │    │
│ │                               │    │
│ │ This is your strongest        │    │
│ │ earned moment in the essay.   │    │
│ │                               │    │
│ └───────────────────────────────┘    │
│                                      │
│ ┌ WHAT MAKES IT WORK ─────────────┐ │
│ │ • Sensory grounding earns the   │ │
│ │   emotional payoff in P4        │ │
│ │ • Voice shift is intentional —  │ │
│ │   concrete register matches     │ │
│ │   the pawnshop setting          │ │
│ │ • "Glancing" is a signature     │ │
│ │   word — you use light/vision   │ │
│ │   vocabulary throughout         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                      │
│ ┌ MINOR REFINEMENT (if any) ──────┐ │
│ │ The rhythm could tighten — the  │ │
│ │ clause "I realized" is slightly │ │
│ │ abstract after concrete imagery │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Tab 2: Profile

The "deep understanding" tab. Shows what the system knows about this sentence — not judgment, but observation.

```
┌──────────────────────────────────────┐
│ PROFILE                               │
├──────────────────────────────────────┤
│                                      │
│ ┌ WHAT THIS SENTENCE DOES ─────────┐ │
│ │                                  │ │
│ │ Functions:                       │ │
│ │ • Establishes concrete setting   │ │ ← observedFunctions
│ │ • Introduces the central object  │ │
│ │ • Grounds abstract themes in     │ │
│ │   sensory experience             │ │
│ │                                  │ │
│ │ Writer's Intent:                 │ │
│ │ • Anchor the reader in a         │ │ ← inferredIntents
│ │   specific moment                │ │
│ │ • Build credibility through      │ │
│ │   observed detail                │ │
│ │                                  │ │
│ │ Narrative Role:                  │ │
│ │ • Hook — draws reader into       │ │ ← narrativeContributions
│ │   the scene before the question  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌ CRAFT DETAILS ───────────────────┐ │
│ │                                  │ │
│ │ Rhythm: Long compound with       │ │ ← craft.rhythm
│ │ internal pause (comma splice)    │ │
│ │                                  │ │
│ │ Voice Alignment: ● Consistent    │ │ ← craft.voiceAlignment
│ │ Concrete register matches P1     │ │
│ │ setting-establishment role       │ │
│ │                                  │ │
│ │ Techniques:                      │ │ ← craft.techniques
│ │ • Participial phrase opening     │ │
│ │ • Sensory-to-abstract bridge     │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌ SIGNIFICANT WORDS ───────────────┐ │
│ │                                  │ │
│ │ "glancing"  Light/vision vocab   │ │ ← significantChoices
│ │             — recurs in P3, P5   │ │
│ │                                  │ │
│ │ "facets"    Double meaning:      │ │
│ │             diamond facets +     │ │
│ │             facets of identity   │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌ EFFECTIVENESS ───────────────────┐ │
│ │                                  │ │
│ │ Score: ████████████████░░░░ 82   │ │ ← Visual bar
│ │ Tier: ●● Strong                  │ │
│ │                                  │ │
│ │ This sentence ranks in the top   │ │ ← effectivenessReasoning
│ │ 25% of sentences in this essay.  │ │
│ │ It carries structural weight     │ │
│ │ as a hook and delivers sensory   │ │
│ │ grounding effectively.           │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Connections Section (Collapsed by Default)

At the bottom of both tabs, a collapsible connections section:

```
┌──────────────────────────────────────┐
│ ▸ CONNECTIONS (3)                     │
├──────────────────────────────────────┤
│ [expanded]                           │
│                                      │
│ → P3S1: "Grandmother refused..."     │
│   Type: Thematic echo (value theme)  │
│   [Jump to sentence]                 │
│                                      │
│ → P4S3: "I took the ring back"       │
│   Type: Earned by this sentence      │
│   (sensory grounding mechanism)      │
│   [Jump to sentence]                 │
│                                      │
│ → P5S2: "Value isn't what you..."    │
│   Type: Through-line conclusion      │
│   This sentence starts what P5       │
│   resolves                           │
│   [Jump to sentence]                 │
│                                      │
└──────────────────────────────────────┘
```

**Clicking "Jump to sentence"**:
1. Editor smoothly scrolls to the target sentence
2. Target sentence gets a brief highlight pulse (200ms)
3. Detail panel transitions to show the target sentence's data
4. A "← Back to P1S1" breadcrumb appears at top of panel

---

## 7. Page Layout Architecture

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                            │
│  [Phase: Architecture] [● 3 ● 5 ● 12 ● 4] [Filters ▾] [Analyze]  │
├───────────────────────────────────────┬─────────────────────────────┤
│                                       │                             │
│  ESSAY EDITOR (resizable)             │  DETAIL PANEL (resizable)   │
│  ~60% width                           │  ~40% width                 │
│                                       │                             │
│  ┌─ P1 ──────────────────────────┐    │  ┌───────────────────────┐  │
│  │● Opening paragraph with       │    │  │ SENTENCE HEADER       │  │
│  │  annotations visible inline   │    │  │ "The diamond..."      │  │
│  │  and colored backgrounds per  │    │  │ P3 · S2 · ●● Strong  │  │
│  │  sentence...                  │    │  ├───────────────────────┤  │
│  └───────────────────────────────┘    │  │ [Insights] [Profile]  │  │
│                                       │  ├───────────────────────┤  │
│  ┌─ P2 ──────────────────────────┐    │  │                       │  │
│  │  Second paragraph...          │    │  │  [Tab content]        │  │
│  │                               │    │  │                       │  │
│  └───────────────────────────────┘    │  │                       │  │
│                                       │  │                       │  │
│  ┌─ P3 ──────────────────────────┐    │  │                       │  │
│  │  The pivot paragraph with     │    │  │                       │  │
│  │  critical issue highlighted   │    │  │                       │  │
│  │  in wavy red underline...     │    │  └───────────────────────┘  │
│  └───────────────────────────────┘    │                             │
│                                       │  ┌───────────────────────┐  │
│  [more paragraphs...]                 │  │ ▸ CONNECTIONS (3)     │  │
│                                       │  └───────────────────────┘  │
│                                       │                             │
├───────────────────────────────────────┴─────────────────────────────┤
│  COACHING BAR (collapsible, 48px collapsed → 300px expanded)        │
│  "Ask about this essay..."  [Send]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Split Panel Behavior

Using `react-resizable-panels` (already in the codebase):

```typescript
// src/components/editor/EditorLayout.tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={60} minSize={40} maxSize={75}>
    <EssayEditor />
  </ResizablePanel>

  <ResizableHandle withHandle />

  <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
    <DetailPanel />
  </ResizablePanel>
</ResizablePanelGroup>
```

### Panel States

```
STATE 1: NO SELECTION (default on page load)
  Detail panel shows: Essay Overview
  - Improvement Phase + readiness bars
  - North Star through-line
  - Score distribution chart (mini histogram)
  - Annotation summary (X critical, Y needs work, Z strengths)
  - Quick links to first critical issue

STATE 2: SENTENCE SELECTED
  Detail panel shows: Sentence data (Insights / Profile tabs)
  - Full annotation content
  - Understanding/analysis data
  - Connections

STATE 3: PARAGRAPH SELECTED (click on paragraph gutter)
  Detail panel shows: Paragraph data
  - Paragraph role + structural significance
  - Aggregate analysis
  - All sentence annotations within (collapsed)
  - Paragraph-level coaching

STATE 4: DEEP DIVE (expanded from within panel)
  Detail panel shows: Full network view
  - Earned-ness map for a moment
  - Voice map visualization
  - Connection graph
```

---

## 8. Toolbar & Navigation

### Toolbar Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [←]  Essay: Personal Statement #1           [Phase: Architecture ▾] │
│                                                                      │
│  ●3 Critical  ●5 Needs Work  ●12 Functional  ●4 Strong  ●1 Masterful│
│                                                                      │
│  [Filter ▾]  [▸ Issues Only]  [Show Strengths]          [Re-analyze] │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Toolbar Components

**1. Breadcrumb & Title**
- Back arrow to workshop/dashboard
- Essay title/type
- Phase badge (colored pill: foundation=gray, architecture=blue, craft=amber, polish=green, distinction=purple)

**2. Annotation Summary Bar**
- Colored dots with counts for each tier
- Clickable — clicking "●3 Critical" filters to show only critical annotations and jumps to the first one

**3. Filter Controls**

```typescript
interface AnnotationFilters {
  // Tier visibility
  showCritical: boolean;      // default: true
  showNeedsWork: boolean;     // default: true
  showFunctional: boolean;    // default: false (clean text = no distraction)
  showStrong: boolean;        // default: true (subtle)
  showExceptional: boolean;   // default: true
  showMasterful: boolean;     // default: true

  // Quick presets
  issuesOnly: boolean;        // Shows only critical + needs-work
  strengthsOnly: boolean;     // Shows only strong + exceptional + masterful
  allAnnotations: boolean;    // Shows everything

  // Dimension filter (advanced)
  dimensions: string[];       // Filter by specific analysis dimension
}
```

**4. Re-analyze Button**
- Triggers fresh L1→L5 analysis pass
- Shows progress: "Analyzing... L3 (4/7 paragraphs)"
- Disabled while analysis is running
- After edit: button pulses gently to suggest re-analysis

### Phase Selector

The phase indicator doubles as a phase explanation when hovered/clicked:

```
┌──────────────────────────────────────┐
│ IMPROVEMENT PHASE: Architecture      │
├──────────────────────────────────────┤
│                                      │
│ Your essay's sentence-level writing  │
│ is functional, but the paragraph     │
│ structure needs work.                │
│                                      │
│ CURRENT FOCUS:                       │
│ • Paragraph transitions              │
│ • Structural weight distribution     │
│ • P3 earning mechanism gaps          │
│                                      │
│ DEFERRED (revisit later):            │
│ • Word-level precision               │
│ • Sentence rhythm variation          │
│                                      │
│ Readiness:                           │
│ Essay:     ██████████░░░░░░ 65%      │
│ Paragraph: ████████░░░░░░░░ 50%      │
│ Sentence:  ██████████████░░ 85%      │
│ Word:      ████████████████ 92%      │
│                                      │
└──────────────────────────────────────┘
```

---

## 9. Data Flow & State Management

### Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│ BACKEND                                                     │
│                                                             │
│  EssayProfile (in DB/API)                                   │
│  ├── paragraphMap[].sentences[].understanding (L3)          │
│  ├── paragraphMap[].sentences[].analysis (L3.5)             │
│  ├── holistic sections (L3.75)                              │
│  ├── northStar (L4)                                         │
│  └── [ephemeral] annotations (L5)                           │
│                                                             │
└──────────────────────┬─────────────────────────────────────┘
                       │ API Response
                       ▼
┌────────────────────────────────────────────────────────────┐
│ FRONTEND STATE                                              │
│                                                             │
│  useEssayIntelligence(essayId) — React Query hook           │
│  ├── profile: EssayProfile                                  │
│  ├── annotations: L5Annotation[] (ephemeral)                │
│  ├── isAnalyzing: boolean                                   │
│  └── staleParagraphs: number[]                              │
│                                                             │
│  useEditorAnnotations(profile, annotations) — derived state │
│  ├── Computes: EditorAnnotationState                        │
│  ├── Computes: ProseMirror DecorationSet                    │
│  └── Memoized: only recomputes when profile changes         │
│                                                             │
│  useSelectedSentence() — interaction state                  │
│  ├── selectedParagraph: number | null                       │
│  ├── selectedSentence: number | null                        │
│  ├── panelTab: 'insights' | 'profile'                      │
│  ├── panelView: 'sentence' | 'paragraph' | 'overview'      │
│  └── navigationStack: Selection[] (for back navigation)     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### React Query Integration

```typescript
// src/hooks/useEssayIntelligence.ts

function useEssayIntelligence(essayId: string) {
  // Fetch full profile
  const profile = useQuery({
    queryKey: ['essayProfile', essayId],
    queryFn: () => api.getEssayProfile(essayId),
    staleTime: 30_000, // 30s — profile doesn't change unless re-analyzed
  });

  // Fetch ephemeral annotations (separate because they're regenerated)
  const annotations = useQuery({
    queryKey: ['essayAnnotations', essayId],
    queryFn: () => api.getEssayAnnotations(essayId),
    staleTime: 0, // Always fresh
    enabled: !!profile.data,
  });

  // Mutation for triggering re-analysis
  const analyze = useMutation({
    mutationFn: (params: { mode: 'comprehensive' | 'focused'; editDiff?: string }) =>
      api.analyzeEssay(essayId, params),
    onSuccess: () => {
      queryClient.invalidateQueries(['essayProfile', essayId]);
      queryClient.invalidateQueries(['essayAnnotations', essayId]);
    },
  });

  return { profile: profile.data, annotations: annotations.data, analyze, isAnalyzing: analyze.isPending };
}
```

### Editor State Coordination

```typescript
// src/hooks/useEditorAnnotations.ts

function useEditorAnnotations(
  profile: EssayProfile | undefined,
  annotations: L5Annotation[] | undefined
): EditorAnnotationState | null {
  return useMemo(() => {
    if (!profile) return null;

    // Transform EssayProfile + L5 annotations → EditorAnnotationState
    const paragraphs = profile.paragraphMap.map((para, pIdx) => {
      const sentences = para.sentences.map((sent, sIdx) => ({
        paragraphIndex: pIdx,
        sentenceIndex: sIdx,
        text: sent.text,
        tier: effectivenessToTier(sent.analysis?.effectiveness ?? 60),
        effectiveness: sent.analysis?.effectiveness ?? 60,
        isStrength: sent.analysis?.isStrength ?? false,
        isProblem: sent.analysis?.isProblem ?? false,
        priorityForImprovement: sent.analysis?.priorityForImprovement ?? 0,
        annotations: (annotations ?? []).filter(
          a => a.location.paragraphIndex === pIdx && a.location.sentenceIndex === sIdx
        ),
        understanding: sent.understanding,
        analysis: sent.analysis,
        connections: findConnections(profile, pIdx, sIdx),
      }));

      return {
        paragraphIndex: pIdx,
        text: para.text,
        aggregateTier: aggregateParagraphTier(sentences),
        understanding: para.understanding,
        analysis: para.analysis,
        structuralRole: profile.northStar?.structuralRolesMap
          ?.find(r => r.paragraphs.includes(pIdx))?.role ?? null,
        northStarSignificance: profile.northStar?.structuralRolesMap
          ?.find(r => r.paragraphs.includes(pIdx))?.significance ?? null,
        sentences,
        annotations: (annotations ?? []).filter(
          a => a.location.paragraphIndex === pIdx && a.location.sentenceIndex == null
        ),
      };
    });

    return {
      paragraphs,
      improvementPhase: profile.index.improvementPhase,
      northStar: profile.northStar ?? null,
      voiceIdentity: profile.voiceIdentity ?? null,
      totalAnnotations: (annotations ?? []).length,
      criticalCount: paragraphs.flatMap(p => p.sentences).filter(s => s.tier === 'critical').length,
      needsWorkCount: paragraphs.flatMap(p => p.sentences).filter(s => s.tier === 'needs-work').length,
      strengthCount: paragraphs.flatMap(p => p.sentences).filter(s => s.tier === 'strong' || s.tier === 'exceptional' || s.tier === 'masterful').length,
      isAnalyzing: false,
      staleParagraphs: [],
    };
  }, [profile, annotations]);
}
```

### Edit → Re-analysis Flow

```
1. Student edits text in TipTap editor
2. On debounced change (2 seconds after last keystroke):
   a. Compute diff between current text and last-analyzed text
   b. If diff is trivial (typo fix): skip re-analysis
   c. If diff is substantive:
      - Mark affected paragraphs as "stale" (dim their annotations)
      - Show gentle "Re-analyze" button pulse
      - DO NOT auto-analyze (cost control — student decides when)
3. Student clicks "Re-analyze":
   a. System chooses mode: focused (small edit) vs comprehensive (structural)
   b. Progress indicator shows in toolbar
   c. As new annotations arrive, they bloom in (old ones fade out)
   d. Color transitions animate smoothly (red → green feels satisfying)
```

---

## 10. Paragraph-Level Experience

### Paragraph Gutter

Each paragraph has a left gutter area (outside the editor content area):

```
      GUTTER │ EDITOR CONTENT
             │
  ● ─── P1  │  Opening paragraph with the hook
  │          │  sentence that draws the reader in.
  │          │  The second sentence establishes tone.
  │          │
  ●● ── P2  │  Second paragraph develops the
  │          │  central theme through specific
  │          │  examples and sensory detail.
  │          │
  ●●● ─ P3  │  The pivot paragraph — this is where
  │   FULCRUM│  the essay turns from setup to insight.
  │          │  Critical issue in sentence 2.
             │
```

### Gutter Elements

```typescript
interface ParagraphGutter {
  // Aggregate indicator (colored dot)
  dot: {
    color: TierColor;
    size: 'sm' | 'md' | 'lg'; // Based on annotation count
  };

  // Structural role label (from North Star)
  roleLabel?: string;  // "HOOK", "FULCRUM", "RESOLUTION", etc.

  // Issue count badges
  issueCount?: number;
  strengthCount?: number;

  // Stale indicator (if paragraph edited but not re-analyzed)
  isStale?: boolean;
}
```

### Paragraph Click Behavior

Clicking the gutter dot or role label opens the paragraph-level detail panel:

```
┌──────────────────────────────────────┐
│ PARAGRAPH 3 — FULCRUM                │
│ Load-bearing · Pivot point           │
├──────────────────────────────────────┤
│                                      │
│ STRUCTURAL ROLE                      │
│ This paragraph carries the essay's   │
│ central transformation. Your through-│
│ line pivots here from "value as      │
│ commodity" to "value as identity."   │
│                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                      │
│ EFFECTIVENESS: ████████████░░░ 72    │
│                                      │
│ SENTENCE BREAKDOWN:                  │
│ S1: ●● 78  "Grandmother refused..." │
│ S2: ●  42  "She said the diamond.." │ ← Click to see sentence detail
│ S3: ●● 81  "In that moment, I..."   │
│ S4: ●●● 89 "The fluorescent..."     │
│                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                      │
│ PARAGRAPH ANNOTATIONS:               │
│ ▸ The transition INTO this para...   │
│ ▸ Earned-ness: 2 of 3 mechanisms... │
│                                      │
└──────────────────────────────────────┘
```

---

## 11. Sentence-Level Experience

### Visual States of a Sentence

```
┌─────────────────────────────────────────────────────────┐
│ NORMAL STATE (no selection, no hover)                   │
│ Color-coded background + underline per tier             │
│ ┌───────────────────────────────────────────────────┐   │
│ │ The fluorescent lights glanced off the diamond's  │   │
│ │ facets as I realized this stone carried more      │   │
│ │ than carats.                                      │   │
│ │ ═══════════════════════════  (green underline)    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ HOVER STATE (mouse over)                                │
│ Background intensifies slightly, cursor changes         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ The fluorescent lights glanced off the diamond's  │ ← │
│ │ facets as I realized this stone carried more      │   │
│ │ than carats.                                      │   │
│ │ ═══════════════════════════  (green, brighter)    │   │
│ └───────────────────────────────────────────────────┘   │
│ ┌─ Tooltip ──────────────────────────┐                  │
│ │ ●● Strong · Effective sensory hook │                  │
│ └────────────────────────────────────┘                  │
│                                                         │
│ SELECTED STATE (clicked)                                │
│ Selection ring, other sentences dimmed                  │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ┌─────────────────────────────────────────────┐   │   │
│ │ │ The fluorescent lights glanced off the       │   │   │
│ │ │ diamond's facets as I realized this stone    │   │   │
│ │ │ carried more than carats.                    │   │   │
│ │ │ ═══════════════════════════  (selection ring) │   │   │
│ │ └─────────────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ STALE STATE (edited but not re-analyzed)                │
│ Color desaturates, diagonal hatch overlay               │
│ ┌───────────────────────────────────────────────────┐   │
│ │ The fluorescent lights glanced off the diamond's  │   │
│ │ facets as I realized this stone carried more      │   │
│ │ than carats, gleaming with unexpected warmth.     │ ← │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░  (grayed, hatched)    │   │
│ │                          [Re-analyze to update]   │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Word-Level Highlights (Within Sentences)

For specific word choices flagged in `significantChoices` or L1 word flags:

```typescript
// Sub-sentence decorations for specific words
interface WordHighlight {
  word: string;
  type: 'signature' | 'cliche' | 'weak_verb' | 'sensory' | 'generic';
  significance: string;

  // Visual treatment (subtle — don't overwhelm)
  // signature: faint purple underline dot
  // cliche: faint amber underline dot
  // sensory: faint green underline dot
  // weak_verb: faint red underline dot
}
```

Word-level highlights are **off by default** — toggled via a filter in the toolbar ("Show word details"). This prevents visual overload.

---

## 12. Connection Visualization

### Connection Types (from ProfileConnections)

```
THEMATIC_ECHO:       Two sentences carry the same theme
IMAGE_RECURRENCE:    Same image/metaphor appears in multiple places
EARNED_MOMENT:       One sentence earns a later moment
STRUCTURAL_MIRROR:   Parallel structure between paragraphs
VOICE_SHIFT:         Voice changes between these points
CONTRADICTION:       These sentences contradict each other
```

### In-Editor Connection Lines

When a sentence is selected and has connections, thin lines connect to related sentences:

```
┌─────────────────────────────────────────┐
│                                         │
│  P1S1: "The diamond caught the light"   │
│        ════════════════════             │
│                    │                     │
│                    │ ← thin curved line  │
│                    │    (theme: "light") │
│                    │                     │
│  P3S2: "Fluorescent lights glanced"     │
│        ════════════════════             │
│                    │                     │
│                    │ ← earned-by line    │
│                    │    (sensory ground) │
│                    │                     │
│  P4S3: "I took the ring back"           │
│        ═══════════════════              │
│                                         │
└─────────────────────────────────────────┘
```

**Implementation**: SVG overlay layer on top of the editor, absolutely positioned. Lines use `cubic-bezier` curves to avoid crossing text. Lines fade in when sentence is selected, fade out when deselected.

### Connection Color Coding

```
Thematic echo:     Purple dashed line
Image recurrence:  Teal dashed line
Earned moment:     Green solid line (arrow direction shows earning)
Structural mirror: Blue dotted line
Voice shift:       Amber solid line
Contradiction:     Red dashed line
```

---

## 13. Progressive Disclosure Strategy

### Information Density by Improvement Phase

The UI itself adapts to the student's improvement phase:

```
FOUNDATION PHASE (essay-level focus):
  - Gutter shows paragraph roles prominently
  - Sentence-level annotations hidden by default (toggle to show)
  - Detail panel emphasizes structural feedback
  - North Star through-line is the hero element
  - Color-coding: only critical (red) and needs-work (amber) sentences colored
  - Strong/exceptional/masterful sentences shown as gray (don't distract from structural work)

ARCHITECTURE PHASE (paragraph-level focus):
  - Gutter shows paragraph roles + issue counts
  - Sentence annotations appear for sentences with priority ≥ 3
  - Detail panel shows paragraph analysis + sentence breakdown
  - Connections between paragraphs highlighted
  - Color-coding: all tiers visible, but critical/needs-work more prominent

CRAFT PHASE (sentence-level focus):
  - Full sentence-level color-coding
  - Word-level highlights available (toggle)
  - Detail panel defaults to sentence view
  - Craft details prominent in Profile tab
  - Voice map accessible from sentence view

POLISH PHASE (word-level focus):
  - Word-level highlights on by default
  - Significant word choices highlighted inline
  - Detail panel shows word-level analysis
  - Minor refinement suggestions prominent
  - Very few red/amber — mostly green with occasional word-level notes

DISTINCTION PHASE (memorability focus):
  - Masterful sentences get special treatment (shimmer)
  - Detail panel focuses on "what makes this memorable"
  - Suggestions about pushing distinctive moments further
  - Connection visualization prominent (show the network of meaning)
  - Less about fixing, more about celebrating and sharpening
```

### First-Time User Experience

For a student using the annotated editor for the first time:

```
STEP 1: Analysis runs (loading state with progress)
  - "Understanding your essay..." with layer indicators
  - Sentences appear gray during analysis
  - Colors bloom in paragraph-by-paragraph as analysis completes

STEP 2: Onboarding overlay (one-time, dismissable)
  - "Your essay has been analyzed. Here's what the colors mean."
  - Quick legend: Red = fix this, Yellow = could improve, Green = working well
  - "Click any sentence to see details →"
  - Arrow pointing to the first critical sentence

STEP 3: Auto-focus first critical issue
  - After onboarding dismissal, auto-select the highest-priority annotation
  - Detail panel opens with that annotation's insight
  - Student immediately sees value — no hunting required

STEP 4: Subsequent visits
  - No onboarding overlay
  - If re-analysis needed: gentle pulse on "Re-analyze"
  - If no changes: open to overview with progress since last visit
```

---

## 14. Animation & Visual Design

### Design Language

Consistent with the existing vapor/glass aesthetic established in `VaporChatMessage.tsx` and `MessageDisplay.tsx`:

```
GLASS MORPHISM:
  - Detail panel: frosted glass background (backdrop-blur-xl)
  - Toolbar: subtle glass with blur-md
  - Tooltips: glass cards with soft shadow

COLOR TRANSITIONS:
  - Tier changes animate over 600ms (ease-out)
  - Red → Green transition: red desaturates → neutral → green saturates
  - New annotations bloom in (scale 0.95 → 1.0, opacity 0 → 1, 300ms)

SELECTION:
  - Selection ring pulses once (200ms) then settles to static
  - Other sentences fade to 50% opacity over 200ms
  - Deselection reverses (200ms)

HOVER:
  - Tooltip appears after 300ms delay
  - Tooltip fades in (150ms) with subtle Y-translate (-4px)
  - Tooltip fades out (150ms) on mouseout

PANEL TRANSITIONS:
  - Panel slide-in: 250ms ease-out from right
  - Tab switch: crossfade 200ms
  - Content update (new sentence selected): crossfade 150ms

CONNECTION LINES:
  - Draw in with stroke-dashoffset animation (400ms)
  - Fade out with opacity (200ms)

ANALYSIS PROGRESS:
  - Paragraph colors bloom left-to-right as analysis completes
  - Each paragraph: 200ms bloom with 50ms stagger
  - Satisfying "wave" effect across the essay

IMPROVEMENT CELEBRATION:
  - When a sentence improves (e.g., red → green):
    - Brief confetti particle effect (very subtle, 3-5 particles)
    - Score counter animates up
    - Sound effect: optional, off by default
```

### Micro-Interactions

```typescript
// Key micro-interactions that make the experience feel alive

const microInteractions = {
  // Gutter dot on hover: subtle scale up
  gutterDotHover: { scale: 1.3, duration: 150 },

  // Annotation count badge: pulse when count changes
  badgeUpdate: { scale: [1, 1.15, 1], duration: 300 },

  // Tab underline: slides to active tab position
  tabSwitch: { x: 'auto', duration: 200, ease: 'easeOut' },

  // "Apply to Essay" button: satisfying click feedback
  applyRewrite: { scale: [1, 0.95, 1.02, 1], duration: 250 },

  // Connection line hover: line thickens, endpoint dots pulse
  connectionHover: { strokeWidth: [1, 2], duration: 200 },

  // Stale indicator: slow diagonal movement (subtle hatching)
  staleHatch: { backgroundPositionX: ['0%', '100%'], duration: 8000, repeat: Infinity },
};
```

---

## 15. Mobile & Responsive Strategy

### Tablet (768px–1023px)

```
┌──────────────────────────────┐
│ TOOLBAR (compact)            │
├──────────────────────────────┤
│                              │
│  ESSAY EDITOR (full width)   │
│  With annotations inline     │
│                              │
├──────────────────────────────┤
│ DETAIL PANEL (bottom sheet)  │ ← Slides up from bottom on sentence click
│ 40% height, draggable        │
│ Can be expanded to 80%       │
│ Swipe down to dismiss        │
└──────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ TOOLBAR (minimal)    │
│ [←] [●3 ●5] [☰]     │
├──────────────────────┤
│                      │
│ ESSAY EDITOR         │
│ (full width)         │
│                      │
│ Annotations shown    │
│ as colored left      │
│ borders only (no     │
│ underlines — too     │
│ small on mobile)     │
│                      │
├──────────────────────┤
│ DETAIL SHEET         │ ← Full-screen bottom sheet
│ (slides up on tap)   │    Swipe down to dismiss
│                      │    Swipe left/right between sentences
│ [Insights] [Profile] │
│                      │
│ [Full content here]  │
│                      │
│ [← Prev] [Next →]   │ ← Navigate between annotations
└──────────────────────┘
```

### Touch Interactions

```
TAP sentence:           Open detail sheet (bottom)
LONG PRESS sentence:    Show tooltip (hover equivalent)
SWIPE LEFT on sheet:    Next annotated sentence
SWIPE RIGHT on sheet:   Previous annotated sentence
SWIPE DOWN on sheet:    Dismiss sheet
PINCH essay:            Zoom (for accessibility)
```

---

## 16. Accessibility

### WCAG 2.1 AA Compliance

```
COLOR:
  - All tier colors pass 4.5:1 contrast against white background
  - Color is NEVER the only indicator — always paired with:
    - Underline style (wavy, dashed, solid, dotted)
    - Gutter dot size
    - Text label in tooltip/panel

KEYBOARD:
  - Full keyboard navigation (Tab/Shift+Tab between annotations)
  - Enter to open panel, Escape to close
  - Arrow keys to navigate within panel
  - Number keys (1/2) for tab switching

SCREEN READERS:
  - Each annotated sentence has aria-label:
    "Sentence 2, paragraph 3. Strong. Click for details."
  - Panel content is aria-live="polite" (announces on change)
  - Tier changes announced: "Sentence improved from needs-work to strong"
  - Connection lines have aria-hidden (visual-only)

FOCUS:
  - Visible focus ring on all interactive elements
  - Focus trap within detail panel when open
  - Skip-to-content link at top of page

MOTION:
  - All animations respect prefers-reduced-motion
  - Reduced motion: no bloom, no particles, instant transitions
  - Connection lines draw instantly instead of animating

HIGH CONTRAST:
  - High contrast mode: thicker underlines, bolder colors
  - Background washes become solid borders
  - Gutter dots become larger squares
```

---

## 17. Performance Architecture

### Rendering Strategy

```
VIRTUALIZATION:
  - Essays can be 650 words / 5-7 paragraphs (Common App)
  - At this size, NO virtualization needed — render all paragraphs
  - PIQ essays are 350 words — even smaller
  - If future essays exceed 2000 words: add virtualization (react-window)

DECORATION COMPUTATION:
  - DecorationSet computed once when profile loads
  - Recomputed only when:
    a. Profile changes (re-analysis result)
    b. Filter toggles change
    c. Document structure changes (paragraph added/removed)
  - NOT recomputed on every keystroke — decorations are position-stable

POSITION MAP:
  - Rebuilt on document change (debounced 500ms)
  - Uses TipTap's transaction system for incremental updates
  - Map is ~100-200 entries for typical essay — negligible cost

PANEL RENDERING:
  - Detail panel content lazy-loaded per tab
  - Profile tab data computed on first tab switch (not on panel open)
  - Connection visualization rendered only when section expanded
  - SVG connection overlay: rendered only for selected sentence

ANIMATION BUDGET:
  - Max 3 simultaneous CSS animations at any time
  - Connection lines: requestAnimationFrame for smooth drawing
  - No JavaScript-driven animations during typing (TipTap handles its own)
```

### Bundle Size Impact

```
TIPTAP CORE:          ~45KB gzipped (necessary)
TIPTAP EXTENSIONS:    ~15KB gzipped (select few)
PROSEMIRROR:          ~35KB gzipped (bundled with TipTap)
                      ─────────────
TOTAL EDITOR:         ~95KB gzipped

For comparison:
  - Current app bundle: likely 200-400KB
  - This adds ~30-40% to bundle size
  - Justified: editor IS the core experience

MITIGATION:
  - Code-split: editor loaded only on essay page (React.lazy)
  - Preload: start loading editor chunk when user navigates to workshop
  - Tree-shake: only import used TipTap extensions
```

---

## 18. Implementation Phases

### Phase 0: Foundation (Week 1)

**Goal**: TipTap editor rendering essay text with no annotations.

```
FILES TO CREATE:
  src/components/editor/
    ├── EssayEditor.tsx               (TipTap editor wrapper)
    ├── EditorLayout.tsx              (Split panel layout)
    ├── schema.ts                     (TipTap schema definition)
    ├── positionResolver.ts           (Sentence position mapping)
    └── types.ts                      (Frontend annotation types)

FILES TO MODIFY:
  package.json                        (Add TipTap dependencies)
  src/App.tsx                         (Add route for new editor page)

TASKS:
  □ Install TipTap + ProseMirror dependencies
  □ Create basic editor that loads essay text
  □ Implement sentence position resolver (shared splitter)
  □ Create split panel layout (editor left, empty panel right)
  □ Verify essay text renders correctly with paragraph structure
  □ Basic editing works (type, delete, undo/redo)

VERIFICATION:
  - Essay loads in TipTap editor ✓
  - Position resolver matches backend sentence splitting ✓
  - Split panel resizes correctly ✓
```

### Phase 1: Static Annotations (Week 2)

**Goal**: Color-coded sentence decorations from a mock/loaded EssayProfile.

```
FILES TO CREATE:
  src/components/editor/
    ├── decorationPlugin.ts           (ProseMirror decoration plugin)
    ├── annotationStyles.css          (Tier-specific CSS)
    └── ParagraphGutter.tsx           (Left gutter component)

  src/hooks/
    ├── useEssayIntelligence.ts       (React Query hook for profile)
    └── useEditorAnnotations.ts       (Profile → decoration transform)

TASKS:
  □ Implement decoration plugin (profile → DecorationSet)
  □ Create CSS for all 6 tiers (backgrounds, underlines, borders)
  □ Implement paragraph gutter with aggregate dots
  □ Wire React Query hook to load real EssayProfile
  □ Test with a pre-analyzed essay
  □ Verify all 6 tiers render correctly
  □ Verify gutter dots match paragraph analysis

VERIFICATION:
  - Sentences colored by tier ✓
  - Gutter shows paragraph indicators ✓
  - Colors match the spec (red/amber/sage/green/teal/purple) ✓
  - Masterful gradient renders correctly ✓
```

### Phase 2: Interaction & Detail Panel (Week 3-4)

**Goal**: Click a sentence, see the multi-tab detail panel with real data.

```
FILES TO CREATE:
  src/components/editor/
    ├── DetailPanel.tsx               (Main panel container)
    ├── PanelHeader.tsx               (Sentence header in panel)
    ├── InsightsTab.tsx               (Tab 1: L5 annotations)
    ├── ProfileTab.tsx                (Tab 2: L3 understanding)
    ├── ConnectionsSection.tsx        (Collapsible connections)
    ├── EssayOverview.tsx             (Default panel: no selection)
    ├── ParagraphDetail.tsx           (Paragraph-level panel)
    └── HoverTooltip.tsx             (Sentence hover tooltip)

  src/hooks/
    └── useSelectedSentence.ts        (Selection state management)

TASKS:
  □ Implement click handler on decorated sentences
  □ Build selection state (ring highlight, dimming)
  □ Create detail panel with tab switching
  □ Implement Insights tab (L5 annotation display)
  □ Implement Profile tab (L3 understanding display)
  □ Implement hover tooltip (300ms delay, preview)
  □ Implement essay overview (no-selection state)
  □ Implement paragraph detail view
  □ Keyboard navigation (Tab, Enter, Escape)
  □ Connection "Jump to sentence" navigation with back stack

VERIFICATION:
  - Click sentence → panel opens with correct data ✓
  - Tab switching works ✓
  - Hover tooltip appears after delay ✓
  - Keyboard navigation works ✓
  - Jump-to-sentence scrolls and focuses correctly ✓
```

### Phase 3: Toolbar & Filters (Week 5)

**Goal**: Functional toolbar with phase display, annotation counts, and filters.

```
FILES TO CREATE:
  src/components/editor/
    ├── EditorToolbar.tsx             (Main toolbar)
    ├── AnnotationSummary.tsx         (Colored dot counts)
    ├── FilterDropdown.tsx            (Tier filter controls)
    ├── PhaseIndicator.tsx            (Improvement phase badge)
    └── ReanalyzeButton.tsx           (Trigger re-analysis)

TASKS:
  □ Build toolbar layout with all elements
  □ Implement annotation count badges (live from state)
  □ Implement filter controls (show/hide tiers)
  □ Filters update DecorationSet in real-time
  □ Phase indicator with popover explanation
  □ Re-analyze button (triggers API call, shows progress)
  □ Stale paragraph detection after edits

VERIFICATION:
  - Toolbar shows correct counts ✓
  - Filters toggle decorations on/off ✓
  - Phase indicator shows correct phase ✓
  - Re-analyze triggers analysis and updates annotations ✓
```

### Phase 4: Edit-Triggered Re-analysis (Week 6)

**Goal**: Edit text → stale indicators → re-analyze → color transition animations.

```
FILES TO CREATE:
  src/components/editor/
    ├── StaleOverlay.tsx              (Stale paragraph visual)
    ├── AnalysisProgress.tsx          (Progress indicator)
    └── TransitionAnimations.tsx      (Color change animations)

FILES TO MODIFY:
  src/hooks/useEssayIntelligence.ts   (Add mutation for re-analysis)
  src/components/editor/decorationPlugin.ts  (Add stale state)

TASKS:
  □ Detect edits and mark paragraphs stale (debounced)
  □ Visual stale state (desaturated + hatch pattern)
  □ Re-analysis API integration (focused vs comprehensive)
  □ Progress indicator during analysis
  □ Smooth color transition when new analysis arrives
  □ "Improvement celebration" animation (red→green transition)
  □ Annotation count badges update with animation

VERIFICATION:
  - Edit → stale visual appears ✓
  - Re-analyze → progress → new annotations bloom in ✓
  - Color transitions are smooth ✓
  - Improvement feels satisfying ✓
```

### Phase 5: Connection Visualization (Week 7)

**Goal**: SVG overlay showing connection lines between related sentences.

```
FILES TO CREATE:
  src/components/editor/
    ├── ConnectionOverlay.tsx         (SVG line overlay)
    ├── connectionLayout.ts           (Line routing algorithm)
    └── ConnectionLegend.tsx          (Line type legend)

TASKS:
  □ SVG overlay positioned over editor
  □ Line routing that avoids crossing text
  □ Color-coded line types (thematic, earned, voice shift, etc.)
  □ Lines appear on sentence selection (fade in)
  □ Lines disappear on deselection (fade out)
  □ Hover connection line → tooltip with connection description
  □ Click connection endpoint → navigate to that sentence

VERIFICATION:
  - Connection lines render correctly ✓
  - Lines don't overlap text ✓
  - Lines animate smoothly ✓
  - Navigation via connection endpoints works ✓
```

### Phase 6: Polish & Mobile (Week 8)

**Goal**: Responsive design, accessibility audit, performance optimization.

```
TASKS:
  □ Tablet layout (bottom sheet detail panel)
  □ Mobile layout (full-screen bottom sheet)
  □ Touch interactions (tap, long-press, swipe)
  □ Accessibility audit (WCAG 2.1 AA)
  □ Screen reader testing
  □ prefers-reduced-motion support
  □ Performance profiling (decoration computation, re-renders)
  □ Code splitting (lazy load editor chunk)
  □ Edge case testing (empty essay, single sentence, very long paragraphs)

VERIFICATION:
  - Works on tablet ✓
  - Works on mobile ✓
  - Keyboard-only navigation complete ✓
  - Screen reader announces annotations correctly ✓
  - No performance regressions ✓
```

### Phase 7: Coaching Integration (Week 9-10)

**Goal**: Bottom coaching bar connected to L6, context-aware of selected sentence.

```
FILES TO CREATE:
  src/components/editor/
    ├── CoachingBar.tsx               (Collapsible bottom bar)
    ├── CoachingThread.tsx            (Chat thread display)
    └── ContextualPrompts.tsx         (Smart suggested questions)

TASKS:
  □ Coaching bar at bottom of editor (collapsible)
  □ When sentence selected: suggested questions about that sentence
  □ Chat messages rendered with VaporChatMessage style
  □ L6 coaching API integration
  □ Context-aware: coaching knows which sentence is selected
  □ Pattern detection surfaced in coaching
  □ Multi-turn conversation with history

VERIFICATION:
  - Coaching bar opens/closes ✓
  - Questions are context-aware to selected sentence ✓
  - Multi-turn conversation works ✓
  - Coaching quality matches L6 spec ✓
```

---

## 19. File Structure & Component Map

### Complete File Tree

```
src/components/editor/
├── core/
│   ├── EssayEditor.tsx              # TipTap editor instance + plugins
│   ├── EditorLayout.tsx             # ResizablePanel layout (editor + panel)
│   ├── schema.ts                    # TipTap schema (essay paragraphs)
│   ├── decorationPlugin.ts          # ProseMirror decoration computation
│   ├── positionResolver.ts          # Sentence position mapping
│   └── types.ts                     # Frontend annotation types
│
├── annotations/
│   ├── annotationStyles.css         # All tier CSS (6 tiers × 4 states)
│   ├── HoverTooltip.tsx             # Sentence hover preview
│   ├── StaleOverlay.tsx             # Stale paragraph indicator
│   ├── TransitionAnimations.tsx     # Tier change animations
│   └── ConnectionOverlay.tsx        # SVG connection lines
│
├── gutter/
│   ├── ParagraphGutter.tsx          # Left gutter with dots/labels
│   └── gutterStyles.css             # Gutter-specific styles
│
├── panel/
│   ├── DetailPanel.tsx              # Main panel container + routing
│   ├── PanelHeader.tsx              # Sentence/paragraph header
│   ├── InsightsTab.tsx              # L5 annotation display
│   ├── ProfileTab.tsx               # L3 understanding display
│   ├── ConnectionsSection.tsx       # Collapsible connection list
│   ├── EssayOverview.tsx            # Default view (no selection)
│   ├── ParagraphDetail.tsx          # Paragraph-level detail
│   └── RewriteSuggestion.tsx        # Editable rewrite example
│
├── toolbar/
│   ├── EditorToolbar.tsx            # Main toolbar container
│   ├── AnnotationSummary.tsx        # Tier count badges
│   ├── FilterDropdown.tsx           # Show/hide tier filters
│   ├── PhaseIndicator.tsx           # Improvement phase badge
│   ├── ReanalyzeButton.tsx          # Analysis trigger
│   └── AnalysisProgress.tsx         # Progress during analysis
│
├── coaching/
│   ├── CoachingBar.tsx              # Collapsible bottom coaching
│   ├── CoachingThread.tsx           # Chat message display
│   └── ContextualPrompts.tsx        # Smart question suggestions
│
└── mobile/
    ├── MobileDetailSheet.tsx        # Bottom sheet for mobile
    └── TouchInteractions.tsx        # Touch gesture handlers

src/hooks/
├── useEssayIntelligence.ts          # React Query: profile + annotations
├── useEditorAnnotations.ts          # Profile → EditorAnnotationState
├── useSelectedSentence.ts           # Selection state
└── useAnnotationFilters.ts          # Filter state

src/utils/
└── sentenceSplitter.ts              # Shared sentence splitter (FE + BE)

src/pages/
└── EssayWorkshop.tsx                # New page: annotated essay editor
```

### Component Dependency Graph

```
EssayWorkshop (page)
├── EditorToolbar
│   ├── PhaseIndicator
│   ├── AnnotationSummary
│   ├── FilterDropdown
│   └── ReanalyzeButton + AnalysisProgress
│
├── EditorLayout (ResizablePanel)
│   ├── EssayEditor (TipTap)
│   │   ├── decorationPlugin (ProseMirror plugin)
│   │   ├── HoverTooltip
│   │   ├── ParagraphGutter (per paragraph)
│   │   ├── StaleOverlay (per stale paragraph)
│   │   └── ConnectionOverlay (SVG layer)
│   │
│   └── DetailPanel
│       ├── PanelHeader
│       ├── InsightsTab
│       │   └── RewriteSuggestion
│       ├── ProfileTab
│       ├── ConnectionsSection
│       ├── EssayOverview (no selection)
│       └── ParagraphDetail (paragraph selection)
│
└── CoachingBar (bottom)
    ├── CoachingThread
    └── ContextualPrompts
```

---

## 20. Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Sentence splitter mismatch** (FE ≠ BE) | HIGH — annotations point to wrong text | Shared utility, extensive unit tests, CI validation |
| **TipTap decoration performance** | MEDIUM — many decorations on long essays | Benchmark early, virtualize if >200 decorations |
| **Position drift during editing** | HIGH — decorations jump to wrong place | Use TipTap's `Mapping` for position tracking through edits |
| **Mobile TipTap support** | MEDIUM — touch editing can be finicky | Test early on iOS/Android, fall back to read-only on unsupported |
| **Bundle size** | LOW — 95KB is acceptable | Code splitting + lazy loading |
| **Re-analysis latency** | MEDIUM — full analysis takes 5-15 seconds | Optimistic UI: show old annotations while analyzing, progressive update |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Information overload** | HIGH — too many colors/indicators overwhelm | Progressive disclosure by phase, filters default to issues-only |
| **Annotation fatigue** | MEDIUM — student feels essay is "all red" | Ensure ≥25% strength annotations, celebration on improvement |
| **Context panel too small** | MEDIUM — teaching content truncated | Expandable panel, full-screen mode on mobile |
| **Edit vs read conflict** | HIGH — students editing while annotations visible is confusing | Clear stale indicators, "edit mode" vs "review mode" option |
| **Color blindness** | MEDIUM — red/green indistinguishable for 8% of males | ALWAYS pair color with shape/pattern (underline style, dot size) |

### Product Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Backend not ready** | HIGH — L5 quality determines UX quality | Phase 0-1 can use mock data while Chats 1-6 improve quality |
| **Entity ID migration** | MEDIUM — positional indices break on edit | Semantic Identity system is designed, implement before Phase 4 |
| **Cost per analysis** | LOW — $0.50-1.00 per full analysis | Students typically analyze 3-5 times per essay |
| **Scope creep** | MEDIUM — "let's also add voice visualization" | Strict phase boundaries, each phase is shippable |

---

## Appendix A: Tier ↔ Analysis Mapping Reference

```
FRONTEND TIER          BACKEND ANALYSIS FIELD                 RANGE
─────────────────────────────────────────────────────────────────────
critical               sentence.analysis.effectiveness        0-39
                       sentence.analysis.isProblem = true
                       sentence.analysis.priorityForImprovement ≥ 4

needs-work             sentence.analysis.effectiveness        40-54
                       sentence.analysis.isProblem = true
                       sentence.analysis.priorityForImprovement 2-3

functional             sentence.analysis.effectiveness        55-75
                       sentence.analysis.isStrength = false
                       sentence.analysis.isProblem = false

strong                 sentence.analysis.effectiveness        76-85
                       sentence.analysis.isStrength = true

exceptional            sentence.analysis.effectiveness        86-95
                       sentence.analysis.isStrength = true

masterful              sentence.analysis.effectiveness        96-100
                       sentence.analysis.isStrength = true
```

## Appendix B: Keyboard Shortcut Reference

```
NAVIGATION
  Tab              Next annotated sentence
  Shift+Tab        Previous annotated sentence
  Enter            Open detail panel
  Escape           Close panel / collapse deep dive

PANEL
  1                Switch to Insights tab
  2                Switch to Profile tab
  ↑ / ↓            Scroll panel content
  Backspace        Back to previous sentence (navigation stack)

TOOLBAR
  F                Toggle filter bar
  Ctrl+Shift+A     Toggle all annotations
  Ctrl+Shift+R     Trigger re-analysis

EDITOR
  Standard editing shortcuts (Ctrl+Z, Ctrl+Y, etc.)
  Ctrl+S           Save essay draft
```

## Appendix C: API Endpoints Needed

```
GET  /api/essays/:id/profile          → EssayProfile
GET  /api/essays/:id/annotations      → L5Annotation[]
POST /api/essays/:id/analyze          → { mode: 'comprehensive' | 'focused', text: string }
POST /api/essays/:id/coaching         → { message: string, context: { paragraph?, sentence? } }
PUT  /api/essays/:id/text             → { text: string } (save essay)
GET  /api/essays/:id/analysis-status  → { status: 'idle' | 'analyzing', progress: string }
```

---

> **This plan is designed to be implemented incrementally. Each phase produces a shippable improvement. Phase 0-2 (editor + annotations + panel) is the MVP. Phases 3-7 add progressively richer interaction.**
