# FORGE_DEBATES: Direct Path vs Rethink Path — UI/UX Synthesis Decisions

**Date**: 2026-03-22
**Scope**: 8 UI gaps in Annotation Workshop — inline editing, profile intelligence, progressive disclosure, connection visualization, phase-awareness, coaching integration, profile showcase, roadmap rendering

---

## Overall Architecture Decision

**Direct Path** proposes: Extend `AnnotatedAnalysisResult` with optional `profileSummary?: EssayProfileSummary` (~20 flat fields). Keep `useAnnotationState` and `ContextPanelView` as-is, adding new view types incrementally. Each gap is a separate patch. 4-tab dashboard.

**Rethink Path** proposes: Introduce `ProfileView` as new primary data source replacing `AnnotatedAnalysisResult`. Create `useProfileView` replacing `useAnnotationState`. Replace `ContextPanelView`'s 3-state machine with 8-level `ZoomLevel` union. Single `ProfileContextPanel` replaces `AnnotationContextPanel` when profile available.

**Decision: Hybrid** — Use Rethink's data shape concept (`ProfileView`-like projection) BUT deliver it as `EssayProfileView` attached to `AnnotatedAnalysisResult.profileView?`, not as a parallel data source. Evolve `useAnnotationState` with profile-aware extensions instead of creating a parallel hook. Expand `ContextPanelView` from 3 to 8+ states (Rethink's zoom vocabulary) within the existing discriminated union pattern.

**Rationale**: Rethink is architecturally cleaner but creates a two-system migration path (ProfileView || AnnotatedAnalysisResult) with dual state hooks that's fragile. Direct's incremental approach avoids this but produces scattered tab/view additions. The hybrid evolves one system: existing types expand, existing hook grows, existing panel handles more states.

---

## GAP-1: Edit Mode — contentEditable Inline Editing

| | Direct Path | Rethink Path |
|---|---|---|
| Core approach | `contentEditable` on `<p>` in `AnnotatedEssayReader` | `contentEditable` via separate `EditableParagraph` component |
| Stale marking | `markStaleAnnotations()` standalone function | Same logic, `editedParagraphs` Set tracking added |
| Edit state | Implicit, embedded in handlers | Explicit `editedParagraphs: Set<number>` in page state |
| Component separation | Inline in AnnotatedEssayReader | Extracted EditableParagraph.tsx (~60 lines) |

**Verification**: Both correctly identify the textarea branch at `AnnotatedWorkshopPage.tsx:166-189` and the `opacity-50 pointer-events-none` wrapper at line 196. `EssayAnnotation.stale` field exists (`pipeline/types.ts:85`). `highlightBuilder.ts:49` handles stale filtering. Direct incorrectly claims `ParagraphInfo.staleCount` exists (it does not).

**Decision: Rethink** — `EditableParagraph` as separate component is cleaner. Explicit `editedParagraphs` tracking is more debuggable. Correction needed: `handleParagraphEdit` must use same paragraph-splitting logic as `buildParagraphInfo` (double newline `\n\n`).

---

## GAP-2: Profile Intelligence — Dashboard Transformation

| | Direct Path | Rethink Path |
|---|---|---|
| Data shape | Flat `EssayProfileSummary` (~20 string fields) | Rich `ProfileView` with 5 layers (headline/portrait/structure/annotations/roadmap/phase) |
| Dashboard approach | 4-tab `DashboardTabs` (Score, Portrait, Architecture, Admissions) | Replace `ScoreDashboardCompact` entirely with `EssayPortrait`, move EQI to toolbar badge |
| Score visibility | Primary tab, big number stays | Demoted to badge, scores in collapsible |
| Existing component | Keep `ScoreDashboardCompact` as Score tab | Replace it entirely |

**Verification**: All referenced profile fields exist: `voiceIdentity.signature`, `essayUnderstanding.centralTension`, `characterRevelation.writerPortrait`, `narrativeStrategy.primaryStrategy`, `admissionsPositioning.*`, `emotionalTopography.arcTrajectory`. `ScoreDashboardCompact.tsx` is 116 lines. `AnnotationContextPanel.tsx:144` renders it.

**Decision: Hybrid** — Portrait-first default (Rethink's insight that understanding > scores) but keep scores accessible without tabs. EQI as header badge + expandable score section at bottom of portrait. Richer data shape from Rethink (structured layers) instead of Direct's flat 20-field projection. But only the fields we render — no 3600-line import.

---

## GAP-3: Progressive Disclosure

| | Direct Path | Rethink Path |
|---|---|---|
| Model | 3 layers (surface highlight, detail card + paragraph context, sentence explorer) | Zoom level navigation (portrait -> paragraph -> annotation -> deep-dive) |
| Paragraph detail | Collapsible section inside `AnnotationDetailCard` | Separate `ParagraphDetail` view at paragraph zoom level |
| Sentence data | `SentenceExplorer.tsx` with mapped sentence intelligence | Deferred to paragraph detail + deep dive |
| "Go Deeper" behavior | Check sentence intelligence first, API fallback | Zoom to deep-dive level |

**Verification**: `ParagraphProfile.sentences: SentenceProfile[]` exists. `ParagraphProfile.understanding`/`.analysis` exist. Direct's `SentenceIntelligence.significance` enum does not match actual SentenceProfile structure.

**Decision: Rethink** — Zoom navigation is more intuitive than collapsible sections inside an already-dense detail card. Paragraph-as-zoom-level gives room for role/verdict/connections/annotations. Include paragraph role/verdict as small context banner on annotation detail view (from Direct). Sentence-level explorer is Phase 2 — too much data for initial launch.

---

## GAP-4: Connection/Architecture Visualization

| | Direct Path | Rethink Path |
|---|---|---|
| Essay reader changes | SVG arc overlay on left margin, expand gutter to w-12, role labels in gutter | Left border color for weight, role label above paragraph text, no SVG arcs |
| Connection rendering | Curved SVG paths between paragraph Y positions | Connections in paragraph detail zoom + connections list view |
| Structural islands | Subtle dash indicator in gutter | Dash indicator in gutter (same) |
| Complexity | High (SVG positioning, ResizeObserver, scroll tracking) | Low (CSS border + text labels) |

**Verification**: `EssayNorthStar.structuralRolesMap: StructuralRole[]` exists with `paragraphs`, `role`, `significance`, `weight`. `ProfileConnections.structuralIslands: number[]` exists. `StructuralWeight` has 4 values. `ParagraphWithGutter.tsx` gutter is `w-4`. SVG inside ScrollArea would require scroll-position-aware Y calculation.

**Decision: Rethink with refinement** — Border weight + role labels is far less complex than SVG arcs for comparable information density. Connection arcs look impressive but add ~150 lines of complex DOM measurement code for marginal benefit. Connections shown in paragraph zoom detail + optional "Architecture Map" list view. Add connection count to gutter dot tooltip.

---

## GAP-5: Phase-Awareness

| | Direct Path | Rethink Path |
|---|---|---|
| Phase classification | Client-side `classifyAnnotationPhaseRelevance()` with static `PHASE_DIMENSION_MAP` | Server-side `inCurrentPhase`/`isDeferred` booleans on each annotation in `ProfileView` |
| Toolbar | Phase badge with tooltip showing reasoning + focus areas | Phase badge with coaching lens tooltip |
| Highlight dimming | `phaseRelevance` prop on `AnnotationHighlight`, 40% opacity for deferred | `isDeferred` prop, 30% opacity + dashed underline |
| Filter bar | Three-way filter: Focus/All/Deferred | Binary toggle: Phase Focus on/off |

**Verification**: `ImprovementPhase` type confirmed with `level`, `reasoning`, `focusAreas`, `deferredAreas`. `ImprovementPhaseLevel` = 5 values. `ProfileIndex.improvementPhase` exists.

**Decision: Hybrid** — Server-side tagging (Rethink) when profile available, client-side classification (Direct) as fallback. Binary toggle (Rethink) is simpler UX than three-way (Direct). Rethink's 30% opacity + dashed underline gives stronger visual distinction. Direct's tooltip with reasoning + focusAreas is more informative — adopt it.

---

## GAP-6: Coaching Integration

| | Direct Path | Rethink Path |
|---|---|---|
| Entry point | "Ask Coach" button on `AnnotationDetailCard` | Zoom to coaching level (navigated from anywhere) |
| Context passing | Explicit `AnnotationCoachingContext` type | Implicit through `ProfileView` + selected annotation |
| Chat component | `InlineCoachingPanel.tsx` (~150 lines) with pre-seed effect | `InlineCoachingView.tsx` (~120 lines) with context banner |
| API endpoint | `POST /api/v1/annotate/coach` | `POST /api/v1/coaching/message` |

**Verification**: `ContextualWorkshopChat` exists but lives in extracurricular workshop — completely separate. `CoachingService` exists at `src/services/essayIntelligence/coaching/coachingService.ts`. Neither proposed endpoint exists yet. Both require backend route.

**Decision: Hybrid** — Direct's "Ask Coach" button on annotation cards (concrete discoverable entry point) + Rethink's coaching-as-panel-view navigation. Direct's `AnnotationCoachingContext` type for explicit context. Direct's pre-seed `useEffect` for UX. Both chat UIs are equivalent; use Direct's slightly more complete version.

---

## GAP-7: Profile Showcase

| | Direct Path | Rethink Path |
|---|---|---|
| Showcase content | `essayUnderstanding.prose` collapsible banner above tabs + Portrait tab | `EssayPortrait` IS the showcase, no separate banner |
| Navigation | Tabs require discovery | Portrait is default view |
| Bidirectional linking | Not mentioned | Portrait -> scroll to paragraph, paragraph role -> zoom to portrait section |

**Verification**: `EssayUnderstanding.prose: string` confirmed. `useImperativeHandle` for `scrollToParagraph` is standard React.

**Decision: Rethink** — Portrait-as-default-view is the showcase. `essayUnderstanding.prose` as the portrait header (not a separate banner). Bidirectional paragraph linking from Rethink is the key differentiator.

---

## GAP-8: Roadmap Visualization

| | Direct Path | Rethink Path |
|---|---|---|
| Data source | `ImprovementRoadmap` from `AnnotatedAnalysisResult.roadmap` | `ProfileView.roadmap` synthesized from `CoachingMap` when available |
| Layout | Three category sections: Quick Wins, Deep Work, Polish | Transformative insight header + ordered priorities + protected strengths |
| Per-step info | +N EQI impact, description, dimension badge, annotation link | Impact badge (transformative/significant/incremental), paragraph links |
| Entry point | "View Roadmap" button in Score tab | Zoom to roadmap from toolbar/portrait |

**Verification**: `ImprovementRoadmap` confirmed with `quickWins[]`, `deepWork[]`, `polish[]`. `ImprovementStep` confirmed with `estimatedEqiImpact`, `annotationId`, `dimensionId`. `CoachingMap` confirmed with `transformativeInsight`, `priorities`, `protectedStrengths`. Both data sources exist.

**Decision: Hybrid** — Rethink's structure (transformative insight + priorities + protected strengths from `CoachingMap`) is architecturally superior. But fallback to Direct's `ImprovementRoadmap` category rendering when profile absent. Both annotation links (Direct) and paragraph links (Rethink) should be present.

---

## Cross-Cutting Insights

1. **Data flow**: Both agree `EssayProfile` must reach frontend. Hybrid: attach `EssayProfileView` to existing `AnnotatedAnalysisResult`, not as parallel source.

2. **Panel navigation**: Rethink's zoom metaphor > Direct's tabs for progressive disclosure. Adopt zoom as expansion of `ContextPanelView`.

3. **Backend**: ~50 lines of pure field extraction mapping. No new LLM calls. One new backend route for coaching.

4. **Graceful degradation**: All features optional when profile absent. Current UI IS the fallback. Mandatory for shipping.

5. **Estimated scope**: ~1400 lines new frontend code across ~8 new files and ~8 modified files. ~80 lines backend (mapper + coaching route). No new npm dependencies.
