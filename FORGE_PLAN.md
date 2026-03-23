# Implementation Blueprint: Uplift Inline Annotation & Workshop UX

The annotation workshop currently renders `AnnotatedAnalysisResult` — a flat scoring artifact with severity-colored highlights, a big EQI number, and 13 dimension bars. After this is built, the same page renders the full `EssayProfile` intelligence: who this writer is, what makes their essay distinctive, how their paragraphs connect architecturally, what phase of improvement they are in, and a prioritized roadmap to get better. The student edits inline without losing context, asks the coach about specific annotations, and navigates their essay's architecture through a zoom paradigm instead of clicking between tabs.

---

## Items

### 1. Profile Data Bridge: Backend Mapper + Frontend Types

**Before** (current): `AnnotatedAnalysisResult` has `eqi`, `dimensionScores`, `summary`, `roadmap`, `annotations`. No information from `EssayProfile` reaches the frontend. The annotation pipeline and Essay Intelligence pipeline are disconnected at the UI layer.

**After** (target): `AnnotatedAnalysisResult` gains an optional `profileView?: EssayProfileView` field populated when Essay Intelligence has run. `EssayProfileView` is a ~2KB JSON projection of `EssayProfile` containing everything the frontend needs — portrait, structure, phase, roadmap, connections — without importing the 3600-line type system.

**Implementation**:

#### New Type: `EssayProfileView` (add to `src/components/annotation/types.ts`)

```typescript
/**
 * Frontend projection of EssayProfile (~2KB JSON).
 * Computed server-side by pure field extraction — no LLM calls.
 * When present, unlocks portrait, phase-awareness, structural roles,
 * connections, roadmap, and coaching context.
 */
export interface EssayProfileView {
  // -- HEADLINE --
  headline: {
    centralTension: string;         // essayUnderstanding.centralTension
    phase: ImprovementPhaseLevel;   // profileIndex.improvementPhase.level
    coachingLens: string;           // derived from improvementPhase.focusAreas
    eqi: number;                    // from scoring
    impressionLabel: string;        // from scoring
  };

  // -- PORTRAIT (essay-level understanding) --
  portrait: {
    essayUnderstandingProse: string; // essayUnderstanding.prose
    voiceSignature: string;          // voiceIdentity.signature
    writerPortrait: string;          // characterRevelation.writerPortrait
    centralThesis: string;           // thematicArchitecture.centralThesis
    narrativeStrategy: string;       // narrativeStrategy.primaryStrategy
    arcType: string;                 // narrativeStrategy.arcType
    emotionalArc: string;            // emotionalTopography.arcTrajectory
    growthArc: string;               // characterRevelation.growthArc
    valuesRevealed: string[];        // characterRevelation.valuesRevealed (first 5)
    intellectualFingerprint: string; // characterRevelation.intellectualFingerprint
    memorability: string;            // admissionsPositioning.memorability
    tellability: string;             // admissionsPositioning.tellabilitySummary
    distinctivenessFactors: string[]; // admissionsPositioning.distinctivenessFactors
    redFlags: string[];              // admissionsPositioning.redFlags
    aoTakeaway: string;              // admissionsPositioning.aoTakeaway
    archetypeContext: {              // admissionsPositioning.archetypeContext
      archetype: string;
      poolDensity: string;
      differentiator: string | null;
    } | null;
    thematicThreads: Array<{        // thematicArchitecture.threads
      thread: string;
      strength: string;             // ThreadStrength
    }>;
    throughLineSummary: string | null; // profileIndex.northStarSummary.throughLineSummary
  };

  // -- STRUCTURE (paragraph-level roles + connections) --
  structure: {
    paragraphs: Array<{
      index: number;
      role: string;                 // from structuralRolesMap
      weight: 'load_bearing' | 'supporting' | 'transitional' | 'decorative';
      verdict: string | null;       // from paragraphProfile.analysis
      tags: string[];               // from paragraphProfile.tags
      annotationIds: string[];      // IDs of annotations touching this paragraph
      improvementPriority: number;  // from profileIndex.paragraphDigest
      connectionCount: number;      // computed from connections
    }>;
    connections: Array<{
      id: string;
      from: { paragraph: number; label: string };
      to: { paragraph: number; label: string };
      description: string;
      strengthCategory: 'foundational' | 'significant' | 'supporting' | 'incidental';
    }>;
    structuralIslands: number[];
  };

  // -- PHASE --
  phase: {
    level: ImprovementPhaseLevel;
    reasoning: string;
    focusAreas: string[];
    deferredAreas: string[];
    coachingLens: string;           // derived from focusAreas
  };

  // -- ROADMAP (from CoachingMap when available) --
  roadmap: {
    transformativeInsight: string | null;
    priorities: Array<{
      description: string;
      target: { paragraphs: number[]; description: string };
      expectedImpact: 'transformative' | 'significant' | 'incremental';
      annotationIds: string[];
    }>;
    protectedStrengths: Array<{
      description: string;
      locations: Array<{ paragraph: number }>;
    }>;
  } | null;
}

type ImprovementPhaseLevel = 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction';
```

#### Extend `AnnotatedAnalysisResult` (`src/pipeline/types.ts`)

Add optional field to existing interface:
```typescript
profileView?: import('../components/annotation/types').EssayProfileView;
```

#### Backend Mapper: `src/pipeline/profileMapper.ts` (NEW, ~60 lines)

Pure function `mapProfileToView(profile: EssayProfile, annotations: EssayAnnotation[]): EssayProfileView`. Called at the end of the annotation pipeline when `EssayProfile` is available. Field extraction only — no LLM calls, no computation beyond counting connections per paragraph and building `annotationIds` per paragraph from `annotation.span.paragraphIndex`.

**Files to create/modify**:
- CREATE: `src/pipeline/profileMapper.ts` (~60 lines)
- MODIFY: `src/components/annotation/types.ts` — add `EssayProfileView`, `ImprovementPhaseLevel`, `AnnotationCoachingContext`
- MODIFY: `src/pipeline/types.ts` — add `profileView?` field to `AnnotatedAnalysisResult`
- MODIFY: annotation pipeline orchestrator — call `mapProfileToView` when profile exists

**Source**: hybrid — Rethink's layered data shape (headline/portrait/structure/phase/roadmap) with Direct's attachment strategy (optional field on existing type, not parallel data source)

---

### 2. Portrait-First Dashboard: `EssayPortrait.tsx` + Score Toggle

**Before** (current): Right panel default is `ScoreDashboardCompact` — big EQI number, 3 bullet strengths, 3 bullet improvements, 13 dimension bars sorted by score. No voice, character, narrative, or admissions intelligence.

**After** (target): When `profileView` exists, right panel default is `EssayPortrait` — central tension headline, voice signature, writer portrait, narrative strategy, emotional arc, and (collapsible) deeper intelligence with admissions positioning, archetype, values, thematic threads. EQI is a small badge. Scores accessible via "View Scores" toggle. `essayUnderstanding.prose` as the portrait header. When `profileView` absent, falls back to existing `ScoreDashboardCompact`.

**Implementation**:

NEW component: `src/components/annotation/EssayPortrait.tsx` (~200 lines)

Props: `{ profileView: EssayProfileView; onNavigateParagraph?: (index: number) => void; onShowRoadmap?: () => void }`

Layout (top to bottom):
1. **Central Tension** — highlighted card with purple border, `Compass` icon
2. **Phase + EQI badges** — small badges inline (`Badge variant="outline"` for phase, `variant="secondary"` for EQI), with "Near phase shift" badge when applicable
3. **Essay Understanding Prose** — `Collapsible defaultOpen`, "What I See In Your Essay" header, `essayUnderstandingProse` text
4. **Core sections** via `PortraitSection` helper:
   - Voice (Mic icon, `portrait.voiceSignature`)
   - Writer (User icon, `portrait.writerPortrait`)
   - Strategy (BookOpen icon, `portrait.narrativeStrategy` + Arc badge)
   - Emotional Arc (Heart icon, `portrait.emotionalArc`)
5. **Deeper Intelligence** — `Collapsible` (default closed):
   - AO Memorability (GraduationCap icon)
   - Distinctiveness (Sparkles icon)
   - Tellability (Lightbulb icon)
   - Archetype context (conditional, amber card with pool density)
   - Values chips (Badge array)
   - Thematic threads with strength dots (emerald for dominant, blue for supporting)
   - Through-line (conditional)
   - Admissions red flags (conditional, red text)
6. **View Improvement Guide** button — calls `onShowRoadmap`
7. **View Scores** toggle — shows/hides `ScoreDashboardCompact` inline

`PortraitSection` helper: `{ icon, label, content }` renders icon + uppercase label + content text.

MODIFY `AnnotationContextPanel.tsx`:
- In `view.type === 'dashboard'` branch:
  - If `result?.profileView` exists: render `<EssayPortrait>`
  - Else: render existing `<ScoreDashboardCompact>`
- Also handles new `view.type === 'portrait'` as alias for dashboard with profile

**Files to create/modify**:
- CREATE: `src/components/annotation/EssayPortrait.tsx` (~200 lines)
- MODIFY: `src/components/annotation/AnnotationContextPanel.tsx` — conditional portrait/score rendering in dashboard branch

**Source**: rethink — portrait-first is better UX. Direct's `essayUnderstanding.prose` banner adopted as portrait header. Score toggle keeps scores accessible without tabs.

---

### 3. Zoom Navigation: Expanding ContextPanelView to 8 States

**Before** (current): `ContextPanelView` is a 3-state discriminated union: `dashboard | annotation | deep-dive`. Flat navigation.

**After** (target): `ContextPanelView` expands to 8 states. Breadcrumb navigation in panel header. Back button navigates up the zoom hierarchy (coaching->annotation, paragraph->portrait, etc.).

**Implementation**:

MODIFY `ContextPanelView` in `types.ts`:
```typescript
export type ContextPanelView =
  | { type: 'dashboard' }
  | { type: 'portrait' }
  | { type: 'paragraph'; paragraphIndex: number }
  | { type: 'annotation'; annotationId: string }
  | { type: 'deep-dive'; annotationId: string; result?: DeepDiveResult }
  | { type: 'roadmap' }
  | { type: 'connections' }
  | { type: 'coaching'; annotationContext?: AnnotationCoachingContext };
```

MODIFY `useAnnotationState.ts` — add navigation actions:
```typescript
const zoomToParagraph = useCallback((index: number) => {
  setContextPanelView({ type: 'paragraph', paragraphIndex: index });
}, []);

const zoomToPortrait = useCallback(() => {
  setSelectedAnnotationId(null);
  setContextPanelView({ type: 'portrait' });
}, []);

const showRoadmap = useCallback(() => {
  setContextPanelView({ type: 'roadmap' });
}, []);

const showConnections = useCallback(() => {
  setContextPanelView({ type: 'connections' });
}, []);

const openCoaching = useCallback((ctx?: AnnotationCoachingContext) => {
  setContextPanelView({ type: 'coaching', annotationContext: ctx });
}, []);
```

Back navigation hierarchy:
- `coaching` -> previous view (annotation if from annotation, dashboard otherwise)
- `deep-dive` -> `annotation`
- `annotation` -> `paragraph` (if paragraph context known) or `dashboard`
- `paragraph` -> `dashboard`/`portrait`
- `roadmap` -> `dashboard`/`portrait`
- `connections` -> `dashboard`/`portrait`

NEW component: `src/components/annotation/ZoomBreadcrumb.tsx` (~30 lines)
```typescript
// Maps view type to label, shows in panel header
const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Score Overview',
  portrait: 'Essay Portrait',
  paragraph: 'Paragraph Detail',
  annotation: 'Annotation Detail',
  'deep-dive': 'Deep Dive',
  roadmap: 'Improvement Guide',
  connections: 'Architecture Map',
  coaching: 'Coach',
};
```

MODIFY `AnnotationContextPanel.tsx`:
- Replace 3-branch switch with 8-branch switch
- Add `ZoomBreadcrumb` to panel header
- Import new view components (EssayPortrait, ParagraphDetail, RoadmapView, InlineCoachingPanel)

**Files to create/modify**:
- CREATE: `src/components/annotation/ZoomBreadcrumb.tsx` (~30 lines)
- MODIFY: `src/components/annotation/types.ts` — expand `ContextPanelView`
- MODIFY: `src/components/annotation/hooks/useAnnotationState.ts` — add zoom/navigation actions
- MODIFY: `src/components/annotation/AnnotationContextPanel.tsx` — 8-branch switch + breadcrumb

**Source**: rethink — zoom paradigm naturally extends the existing discriminated union pattern

---

### 4. Phase-Awareness: Toolbar Badge + Annotation Dimming + Filter Toggle

**Before** (current): All annotations display at equal visual weight regardless of improvement phase.

**After** (target): Phase badge in toolbar, deferred annotations at 30% opacity with dashed underline, phase focus toggle in filter bar.

**Implementation**:

MODIFY `WorkshopToolbar.tsx`:
- Add optional `phase?: { level: string; coachingLens: string }` prop
- Render `Badge variant="outline"` after word count with `Tooltip` showing coaching lens
- Color by level: foundation=amber, architecture=blue, craft=purple, polish=emerald, distinction=pink

MODIFY `AnnotationHighlight.tsx`:
- Add optional `isDeferred?: boolean` prop
- When `isDeferred`: className adds `opacity-30 underline decoration-dashed decoration-muted-foreground/40 decoration-1`
- Suppress ring and hover effects when deferred

MODIFY `AnnotationFilterBar.tsx`:
- Add optional `phase?: { level: string; focusAreas: string[] }`, `phaseFilter: boolean`, `onTogglePhaseFilter: () => void` props
- Render phase focus toggle button before severity toggles: pill with `Focus` icon, phase level name, capitalized
- Visual divider between phase toggle and severity toggles

Phase classification (in `useAnnotationState` or utility):
```typescript
const PHASE_DIMENSION_MAP: Record<string, string[]> = {
  foundation: ['central_argument', 'narrative_clarity', 'authenticity', 'structural_coherence'],
  architecture: ['narrative_arc', 'thematic_depth', 'character_development', 'structural_coherence'],
  craft: ['voice_distinctiveness', 'sentence_craft', 'word_economy', 'imagery_sensory'],
  polish: ['opening_hook', 'closing_impact', 'word_economy', 'sentence_craft'],
  distinction: ['voice_distinctiveness', 'authenticity', 'thematic_depth'],
};

function isAnnotationDeferred(annotation: EssayAnnotation, currentPhase: string): boolean {
  const PHASE_ORDER = ['foundation', 'architecture', 'craft', 'polish', 'distinction'];
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  for (let i = currentIdx + 1; i < PHASE_ORDER.length; i++) {
    if ((PHASE_DIMENSION_MAP[PHASE_ORDER[i]] ?? []).includes(annotation.dimensionId)) return true;
  }
  return false;
}
```

MODIFY `AnnotatedEssayReader.tsx`:
- Accept optional `phaseLevel?: string` prop
- When present, compute `isDeferred` per annotation and pass to `AnnotationHighlight`

**Files to create/modify**:
- MODIFY: `src/components/annotation/WorkshopToolbar.tsx` — phase badge (~20 lines added)
- MODIFY: `src/components/annotation/AnnotationHighlight.tsx` — `isDeferred` styling (~5 lines)
- MODIFY: `src/components/annotation/AnnotationFilterBar.tsx` — phase toggle (~25 lines)
- MODIFY: `src/components/annotation/AnnotatedEssayReader.tsx` — phase passthrough (~10 lines)
- MODIFY: `src/components/annotation/hooks/useAnnotationState.ts` — phase filter state + classification (~30 lines)

**Source**: hybrid — server-side tagging concept from Rethink for future, client-side fallback from Direct for now. Binary toggle from Rethink. 30% opacity + dashed underline from Rethink. Tooltip with reasoning from Direct.

---

### 5. Structural Roles + Paragraph Detail

**Before** (current): Paragraphs have gutter dot + text with highlights. No structural context. Student does not know paragraph roles.

**After** (target): When profile present: role label above each paragraph, left border colored by weight, island indicator in gutter. Clicking role label zooms right panel to paragraph detail showing role, verdict, connections, annotations.

**Implementation**:

MODIFY `ParagraphWithGutter.tsx`:
- Add optional props:
  - `structuralInfo?: { role: string; weight: string; connectionCount: number }`
  - `isIsland?: boolean`
  - `onRoleClick?: (paragraphIndex: number) => void`
  - `edited?: boolean`
- Role label: clickable `<button>` above paragraph text, `text-[10px] uppercase tracking-wider text-muted-foreground/70 hover:text-foreground/80`
- Weight: left border on paragraph container div:
  - `load_bearing`: `border-l-2 border-red-400 dark:border-red-500`
  - `supporting`: `border-l-2 border-amber-400 dark:border-amber-500`
  - `transitional`: `border-l border-blue-300 dark:border-blue-600`
  - `decorative`: no border
- Island: amber dash `w-2 h-0.5 bg-amber-400/60 rounded-full` below gutter dot with "Disconnected paragraph" tooltip
- Edited: blue dot `w-1.5 h-1.5 rounded-full bg-blue-400` below gutter dot

NEW `ParagraphDetail.tsx` (~100 lines):
- Props: `{ paragraph: StructureParagraph; connections: Connection[]; annotations: ResolvedAnnotation[]; onSelectAnnotation: (id: string) => void; onNavigateParagraph: (index: number) => void }`
- Sections:
  1. Header: "Paragraph N" + weight badge + role description
  2. Verdict (italic, from analysis)
  3. Connections (Link2 icon, from/to labels with arrows, description, strength badge)
  4. Annotations list (clickable cards with severity icon + insight preview)

MODIFY `AnnotatedEssayReader.tsx`:
- Add `forwardRef` with `useImperativeHandle`:
  ```typescript
  useImperativeHandle(ref, () => ({
    scrollToParagraph(index: number) {
      const el = paragraphRefs.current.get(index);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));
  ```
- Build paragraph ref map via callback refs on wrapper divs
- Accept optional `structuralInfo`, `structuralIslands`, `onRoleClick` props and pass through to `ParagraphWithGutter`

**Files to create/modify**:
- CREATE: `src/components/annotation/ParagraphDetail.tsx` (~100 lines)
- MODIFY: `src/components/annotation/ParagraphWithGutter.tsx` — structural props + rendering (~40 lines added)
- MODIFY: `src/components/annotation/AnnotatedEssayReader.tsx` — structural passthrough + forwardRef + scrollTo (~30 lines added)
- MODIFY: `src/components/annotation/AnnotationContextPanel.tsx` — add `paragraph` view branch

**Source**: rethink — border weight + role label is cleaner than SVG arcs. Paragraph zoom detail provides connection context without graph visualization complexity.

---

### 6. Roadmap View: Prioritized Improvement Guide

**Before** (current): `ImprovementRoadmap` exists in `AnnotatedAnalysisResult.roadmap` with `quickWins[]`, `deepWork[]`, `polish[]` but is never rendered. No prioritized guidance.

**After** (target): "Improvement Guide" view accessible from portrait and toolbar. Rich mode (with `CoachingMap` via profileView): transformative insight + priorities + protected strengths. Basic mode (annotation pipeline only): Quick Wins / Deep Work / Polish with EQI impact per step. Both modes link to paragraphs and annotations.

**Implementation**:

NEW `RoadmapView.tsx` (~150 lines):
```typescript
interface RoadmapViewProps {
  profileViewRoadmap?: EssayProfileView['roadmap'];
  legacyRoadmap?: ImprovementRoadmap;
  onAnnotationClick: (id: string) => void;
  onParagraphClick: (index: number) => void;
}
```

**Rich mode** (when `profileViewRoadmap` present):
1. **Transformative insight** — purple-bordered card with Lightbulb icon, prominent text
2. **Priorities** — ordered list, each with:
   - Index number + impact icon (Gem=transformative, Wrench=significant, Zap=incremental)
   - Description + target description
   - Paragraph buttons (P1, P2, P3 — clickable, scroll to paragraph)
   - Impact badge (color-coded: purple/amber/blue)
3. **Protected strengths** — green-bordered cards with Shield icon, description + location links

**Basic mode** (when only `legacyRoadmap` present):
1. Three `CategorySection`s (Quick Wins=green/Zap, Deep Work=amber/Hammer, Polish=blue/Sparkles)
2. Each step: `+N EQI` impact, description, dimension badge, "View annotation" link

MODIFY `AnnotationContextPanel.tsx` — add `roadmap` view branch
MODIFY `EssayPortrait.tsx` — add "View Improvement Guide" button at bottom

**Files to create/modify**:
- CREATE: `src/components/annotation/RoadmapView.tsx` (~150 lines)
- MODIFY: `src/components/annotation/AnnotationContextPanel.tsx` — roadmap branch
- MODIFY: `src/components/annotation/EssayPortrait.tsx` — roadmap button

**Source**: hybrid — Rethink's CoachingMap-based structure with Direct's ImprovementRoadmap fallback

---

### 7. Inline Editing: contentEditable Paragraphs

**Before** (current): "Edit" replaces `AnnotatedEssayReader` with `<textarea>`. Annotations vanish. Right panel fades to 50% opacity.

**After** (target): "Edit" makes paragraphs editable in-place. Annotations persist as dimmed decorations. Right panel stays interactive. Edited paragraphs get blue gutter dot. Stale annotations get dashed borders.

**Implementation**:

NEW `EditableParagraph.tsx` (~60 lines):
```typescript
interface EditableParagraphProps {
  paragraphIndex: number;
  segments: TextSegment[];
  onEdit: (paragraphIndex: number, newText: string) => void;
}
```
- `<p contentEditable suppressContentEditableWarning>`
- Annotation spans rendered as visual-only: `bg-muted/20 underline decoration-dotted decoration-muted-foreground/30 underline-offset-4`
- `onInput`: extract `ref.current.textContent`, call `onEdit`
- `onPaste`: intercept, normalize to plain text:
  ```typescript
  onPaste={(e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }}
  ```
- `outline-none focus:ring-1 focus:ring-ring/30 rounded px-1 -mx-1`

MODIFY `AnnotatedWorkshopPage.tsx`:
- Replace textarea branch (lines 166-189) with:
  ```tsx
  <AnnotatedEssayReader
    text={mode === 'edit' ? editedText : text}
    segments={segments}
    paragraphs={paragraphs}
    editable={mode === 'edit'}
    onParagraphEdit={handleParagraphEdit}
    editedParagraphs={editedParagraphs}
    // ... existing props
  />
  ```
- Remove `opacity-50 pointer-events-none` wrapper (line 196) — `<div className="h-full">`
- Add state: `const [editedParagraphs, setEditedParagraphs] = useState<Set<number>>(new Set())`
- `handleParagraphEdit(paragraphIndex, newText)`:
  1. Add to `editedParagraphs` set
  2. Rebuild full text: split current text by double newline, replace paragraph at index
  3. Mark overlapping annotations stale
  4. Set `hasChanges = true`
- `markStaleAnnotations(paragraphIndex, annotations)`:
  ```typescript
  return annotations
    .filter(a => !a.stale && a.span.paragraphIndex === paragraphIndex)
    .map(a => a.id);
  ```

MODIFY `AnnotatedEssayReader.tsx`:
- Add `editable`, `onParagraphEdit`, `editedParagraphs` props
- When `editable`: render `EditableParagraph` instead of highlight spans for each paragraph

**Files to create/modify**:
- CREATE: `src/components/annotation/EditableParagraph.tsx` (~60 lines)
- MODIFY: `src/components/annotation/AnnotatedWorkshopPage.tsx` — remove textarea, add edit handlers (~40 lines changed)
- MODIFY: `src/components/annotation/AnnotatedEssayReader.tsx` — add editable branch (~20 lines)
- MODIFY: `src/components/annotation/ParagraphWithGutter.tsx` — `edited` prop (covered in Item 5)

**Source**: rethink — separate `EditableParagraph` component. Stale marking from Direct. Paste normalization from both.

---

### 8. Coaching Integration: Inline Chat Panel

**Before** (current): `ContextualWorkshopChat` lives on a separate page with zero connection to annotations. Student cannot ask about specific annotations.

**After** (target): "Ask Coach" button on `AnnotationDetailCard`. Opens coaching panel in context panel, pre-seeded with annotation context. Coach receives annotation + phase + profile context. Short Q&A (3-5 turns), conversation in component state.

**Implementation**:

NEW type `AnnotationCoachingContext` (in `types.ts`):
```typescript
export interface AnnotationCoachingContext {
  annotationId: string;
  quotedText: string;
  insight: string;
  suggestion: string;
  dimensionId: string;
  severity: string;
  paragraphIndex: number;
}
```

NEW `InlineCoachingPanel.tsx` (~150 lines):
- State: `messages: Array<{ role: 'user'|'assistant'; content: string }>`, `input: string`, `isLoading: boolean`
- Context banner (when `annotationContext` present): quoted text in muted card
- Pre-seed: `useEffect` populates input with `"I have a question about: "${quotedText}" — The feedback says: "${insight}""` on mount
- Send: `POST /api/v1/annotate/coach` with `{ analysisId, message, annotationContext, conversationHistory: messages, essayText, phase }`
- Messages: user messages right-aligned primary color, coach messages left-aligned muted
- Loading: spinner + "Thinking..."
- Input: `<textarea rows={2}>` with Enter-to-send (Shift+Enter for newline), Send button

MODIFY `AnnotationDetailCard.tsx`:
- Add "Ask Coach" button next to "Go Deeper" (line 154-165):
  ```tsx
  <Button variant="ghost" size="sm" onClick={() => onAskCoach?.(context)} className="text-xs gap-1.5">
    <MessageSquare className="h-3 w-3" /> Ask Coach
  </Button>
  ```
- Add `onAskCoach?: (context: AnnotationCoachingContext) => void` prop

BACKEND: `POST /api/v1/annotate/coach` (~50 lines):
- Request: `{ analysisId, message, annotationContext?, conversationHistory, essayText, phase? }`
- Response: `{ response: string, costUSD: number }`
- Implementation: wrap existing `CoachingService`, inject annotation context into prompt's context section

**Files to create/modify**:
- CREATE: `src/components/annotation/InlineCoachingPanel.tsx` (~150 lines)
- MODIFY: `src/components/annotation/types.ts` — add `AnnotationCoachingContext` (already included in Item 1)
- MODIFY: `src/components/annotation/AnnotationDetailCard.tsx` — "Ask Coach" button (~10 lines)
- MODIFY: `src/components/annotation/AnnotationContextPanel.tsx` — coaching branch
- MODIFY: `src/components/annotation/hooks/useAnnotationState.ts` — `openCoaching` action (already in Item 3)
- CREATE: backend route handler for `/api/v1/annotate/coach` (~50 lines)
- MODIFY: `src/http/routes.ts` — register new route

**Source**: hybrid — Direct's "Ask Coach" button + explicit context type. Rethink's coaching-as-panel-view. Direct's pre-seed effect.

---

## Execution Order

### Phase A: Foundation (Items 1, 3) — Data + Navigation Infrastructure
**Must complete before anything else.**

1. **Item 1**: Create `EssayProfileView` type, backend `profileMapper.ts`, extend `AnnotatedAnalysisResult`
2. **Item 3**: Expand `ContextPanelView` to 8 states, add zoom actions to `useAnnotationState`, create `ZoomBreadcrumb`

**Verification gate**: `npx tsc --noEmit` passes. Existing dashboard/annotation/deep-dive views render unchanged. New view types show placeholder text.

### Phase B: Portrait + Phase (Items 2, 4) — Core Intelligence Display
**Depends on**: Phase A (profileView type, zoom navigation)

3. **Item 2**: Create `EssayPortrait.tsx`, wire into dashboard branch
4. **Item 4**: Phase badge, annotation dimming, filter toggle

**Verification gate**: When profile present, portrait is default view. Phase toggle dims deferred annotations. Clean fallback to `ScoreDashboardCompact` when profile absent. Filter bar phase toggle works.

### Phase C: Structure + Roadmap (Items 5, 6) — Architectural Intelligence
**Depends on**: Phase B (portrait renders, phase data flows)

5. **Item 5**: Structural roles on ParagraphWithGutter, ParagraphDetail view, scroll-to-paragraph
6. **Item 6**: RoadmapView with rich/basic modes

**Verification gate**: Structural role labels appear above paragraphs. Clicking role label zooms to ParagraphDetail. Roadmap shows priorities linked to paragraphs/annotations. Bidirectional navigation works.

### Phase D: Edit + Coaching (Items 7, 8) — Interactive Intelligence
**Depends on**: Phase C (all profile data rendering works)

7. **Item 7**: EditableParagraph, remove textarea, stale marking
8. **Item 8**: InlineCoachingPanel, "Ask Coach" button, backend route

**Verification gate**: Edit mode preserves annotations as decorations. Editing marks annotations stale. Coach receives annotation context and responds. Right panel stays interactive during edit.

---

## Open Questions

1. **Profile availability timing**: When the annotation pipeline runs, does Essay Intelligence always run too? This determines whether portrait-first is the common or exceptional experience. Graceful degradation works either way.

2. **Coaching credit model**: Per-annotation coaching makes LLM calls per message. Is this covered by existing credits, or does it need separate deduction? Check `src/services/credits/`.

3. **contentEditable cross-browser**: `contentEditable` on `<p>` with nested `<span>` children — verify cursor behavior across Chrome/Safari/Firefox. May need selection range management after render.

4. **Paragraph splitting consistency**: `buildParagraphInfo` and `handleParagraphEdit` must use identical splitting logic. Verify the splitting algorithm in `highlightBuilder.ts` and match it.

5. **Re-analysis endpoint status**: `/api/v1/annotate/reanalyze` — is the backend fully wired? `ReanalysisResult` type exists. Verify route registration before implementing focused re-analysis in edit mode.

6. **ProfileView payload size**: For essays with 8+ paragraphs and many connections, verify the projected JSON stays under 5KB. Profile fields are string-heavy; may need truncation limits on `essayUnderstandingProse` (cap at 500 words?).

---

## Rejected Approaches

### Full replacement of AnnotatedAnalysisResult with ProfileView
Creates parallel data system with dual state hooks. Migration surface too large. Extending existing system is safer.

### 4-tab dashboard (Score/Portrait/Architecture/Admissions)
Fragments essay portrait into disconnected views behind clicks. Zoom paradigm is more natural for progressive disclosure.

### SVG connection arcs in essay gutter
~150 lines of DOM measurement code (ResizeObserver, scroll-aware positioning) for marginal information density gain. Border colors + role labels + connection counts in paragraph detail achieve comparable understanding.

### SentenceExplorer in initial launch
Sentence-level data is too dense (25+ sentences per essay). Better as Phase 2 after paragraph-level zoom is tested with users.

### Replacing useAnnotationState entirely
Existing hook works for non-profile case. Extending is safer than replacing.

### Coaching on separate page (status quo)
Loses annotation context. Both designs correctly identify inline-panel coaching as the solution.

### Showing all profile sections at once (no progressive disclosure)
Would require 2000+ px of scroll in a 40%-width panel. Zoom with collapsibles respects information density constraints.
