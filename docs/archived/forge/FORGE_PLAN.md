# Implementation Blueprint: ChatHeader Redesign

The ChatHeader component currently displays Luna's avatar, name, an essay type label, and icon-only action buttons -- but lacks session status, coaching mode indication, and labeled controls. This blueprint redesigns the header to surface all 7 required elements in a single-row layout that fits within the 448px (`max-w-md`) panel constraint without increasing vertical height. The approach absorbs session status and coaching mode into the existing subtitle line, replaces icon-only buttons with compact labeled buttons, and types all props as optional to maintain backward compatibility with both existing consumers.

---

## Items

---

### 1. Props Interface: Zero-prop signature -> Fully typed optional props
**Before**: `export function ChatHeader()` -- no props, hardcoded `essayType = 'Common App'`
**After**: `export function ChatHeader(props: ChatHeaderProps)` -- all 7 elements configurable via optional typed props

**Implementation**:
```typescript
// At top of ChatHeader.tsx, after imports:
import type { EssayType } from '@/services/essayIntelligence/profileTypes';
import type { CoachingMode } from '@/services/essayIntelligence/profileTypes';

/** Display labels for essay types */
const ESSAY_TYPE_LABELS: Record<EssayType, string> = {
  common_app: 'Common App',
  supplement: 'Supplement',
  piq: 'PIQ',
};

/** Display config for coaching modes */
const COACHING_MODE_CONFIG: Record<CoachingMode, { label: string; color: string }> = {
  first_encounter: { label: 'essay coach', color: 'text-slate-400' },
  revision_response: { label: 'Reviewing Edit', color: 'text-emerald-500' },
  iteration_deep: { label: 'Deep Iteration', color: 'text-amber-500' },
  architecture: { label: 'Restructuring', color: 'text-blue-500' },
  polish: { label: 'Final Polish', color: 'text-violet-500' },
};

export interface ChatHeaderProps {
  /** Which essay type is active. Default: 'common_app' */
  essayType?: EssayType;
  /** Live coaching session vs viewing archived session. Default: 'live' */
  sessionStatus?: 'live' | 'archived';
  /** Current coaching mode from the pipeline. Default: undefined (shows 'essay coach') */
  coachingMode?: CoachingMode;
  /** Callback when user clicks the essay switcher */
  onEssaySwitch?: () => void;
  /** Callback when user clicks History button */
  onHistoryClick?: () => void;
  /** Callback when user clicks Settings button */
  onSettingsClick?: () => void;
}
```

**Integration points**:
- `ChatPanel.tsx` line 105: continues to work as `<ChatHeader />` (all defaults)
- `ChatWidget.tsx` line 31: continues to work as `<ChatHeader />` (all defaults)
- Future callers can pass: `<ChatHeader essayType="supplement" coachingMode="iteration_deep" sessionStatus="live" />`

**Source**: direct (refined) -- Agent A's all-optional approach, but with `CoachingMode` from profileTypes.ts

---

### 2. Subtitle Line: Static "essay coach" -> Dynamic status + coaching mode
**Before**: Hardcoded `<span>essay coach</span>` at 8.5px uppercase
**After**: Dynamic text driven by `sessionStatus` and `coachingMode`, with AnimatePresence for smooth transitions

**Implementation**:

The subtitle derivation function:
```typescript
function getSubtitleConfig(
  sessionStatus: 'live' | 'archived',
  coachingMode?: CoachingMode
): { text: string; colorClass: string; showDot: boolean; dotColor?: string } {
  if (sessionStatus === 'archived') {
    return { text: 'Archived Session', colorClass: 'text-slate-400', showDot: false };
  }
  // Live session
  if (!coachingMode || coachingMode === 'first_encounter') {
    return { text: 'essay coach', colorClass: 'text-slate-400', showDot: true, dotColor: 'hsl(162,72%,46%)' };
  }
  const config = COACHING_MODE_CONFIG[coachingMode];
  return { text: config.label, colorClass: config.color, showDot: true, dotColor: 'hsl(162,72%,46%)' };
}
```

The subtitle JSX (replaces the current static `<span>essay coach</span>`):
```tsx
{/* Subtitle: dynamic status + coaching mode */}
<AnimatePresence mode="wait">
  <motion.span
    key={subtitle.text}
    initial={{ opacity: 0, y: 2 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -2 }}
    transition={{ duration: 0.15 }}
    className={cn(
      'flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.12em] leading-none',
      subtitle.colorClass
    )}
  >
    {subtitle.showDot && (
      <span
        className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0"
        style={{ background: subtitle.dotColor }}
      />
    )}
    {subtitle.text}
  </motion.span>
</AnimatePresence>
```

**Before JSX**:
```tsx
<span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-400 leading-none">
  essay coach
</span>
```

**After JSX**: The AnimatePresence block above.

**Integration points**: None -- internal to ChatHeader. The CoachAvatar's online status dot (lines 170-184) remains unchanged for avatar-level status. The subtitle dot is a SEPARATE, smaller indicator in the text line.

**Source**: rethink -- Agent B's subtitle absorption, refined with `first_encounter` preserving "essay coach" for identity

---

### 3. Essay Switcher: Untyped string -> Typed EssayType with lucide icon
**Before**: `function EssaySwitcher({ type }: { type: string })` with custom 10x10 SVG document glyph
**After**: `function EssaySwitcher({ type, onClick }: { type: EssayType; onClick?: () => void })` with lucide FileText icon

**Implementation**:

Replace the custom SVG document glyph (lines 228-249) with:
```tsx
import { History, Settings, FileText, ChevronDown, Archive } from 'lucide-react';

// Inside EssaySwitcher, replace the SVG glyph div with:
<div
  className="flex items-center justify-center flex-shrink-0 rounded-md"
  style={{
    width: 20,
    height: 20,
    background: 'linear-gradient(135deg, hsl(260,70%,60%) 0%, hsl(280,70%,58%) 100%)',
    boxShadow: '0 1px 2px hsla(260,60%,40%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.2)',
  }}
>
  <FileText size={10} strokeWidth={1.5} className="text-white" />
</div>
```

Replace the label text (line 254) with:
```tsx
<span className="text-[12px] font-bold leading-none text-slate-800 tracking-tight whitespace-nowrap truncate">
  {ESSAY_TYPE_LABELS[type]}
</span>
```

Replace the custom chevron SVG (lines 259-274) with:
```tsx
<ChevronDown size={10} className="flex-shrink-0 ml-auto text-slate-500 group-hover:text-slate-700 transition-colors" />
```

Update the function signature:
```tsx
function EssaySwitcher({ type, onClick }: { type: EssayType; onClick?: () => void }) {
```

Add `onClick` to the button's click handler. Keep the existing hover styles (onMouseEnter/onMouseLeave) -- they work correctly with plain CSS.

**Integration points**: Called from the main ChatHeader render with `<EssaySwitcher type={essayType} onClick={onEssaySwitch} />`.

**Source**: hybrid -- Agent B's lucide icons + Agent A's typed props, keeping the existing crafted visual styling

---

### 4. Action Buttons: Icon-only 28px -> Labeled compact buttons
**Before**: 4 icon-only `ActionButton` components (New, History, More, Close) at 28x28px with custom SVGs
**After**: 2 labeled buttons (History, Settings) using lucide-react icons. Close button removed — panel visibility controlled by parent layout (slide/dock from left edge).

**Implementation**:

New `HeaderAction` component (replaces `ActionButton` for labeled buttons):
```tsx
function HeaderAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 px-2 h-[26px] rounded-md text-[11px] font-medium text-slate-500 transition-colors duration-150 hover:text-slate-700 hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-1"
    >
      <Icon size={13} strokeWidth={1.8} className="flex-shrink-0" />
      <span className="leading-none">{label}</span>
    </button>
  );
}
```

Width budget for each HeaderAction:
- `px-2` (8px each side) + icon(13px) + gap(4px) + text = History(~60px), Settings(~65px)
- Total action cluster: ~125px + gap = ~129px

**Buttons removed**: "Start new conversation" (PlusIcon), "More options" (MenuIcon), and "Close panel" (CloseIcon) are all removed. New conversation belongs in the History drawer; overflow menu had no defined options; Close is handled by the parent layout (panel slides/docks from the left edge).

**Integration points**: Action cluster in the main render:
```tsx
<div className="flex items-center gap-1 flex-shrink-0 ml-auto">
  <HeaderAction icon={History} label="History" onClick={onHistoryClick} />
  <HeaderAction icon={Settings} label="Settings" onClick={onSettingsClick} />
</div>
```

**Source**: rethink (refined) -- Agent B's labeled buttons, Close removed per user direction (parent layout controls panel visibility)

---

### 5. Main Layout Assembly: Current single-row -> Refined single-row with all 7 elements
**Before**: Avatar + Name + Divider + EssaySwitcher + ActionCluster (icon-only)
**After**: Avatar + Name(+dynamic subtitle) + Divider + EssaySwitcher + ActionCluster (labeled)

**Implementation** -- the complete content row JSX:
```tsx
export function ChatHeader({
  essayType = 'common_app',
  sessionStatus = 'live',
  coachingMode,
  onEssaySwitch,
  onHistoryClick,
  onSettingsClick,
}: ChatHeaderProps = {}) {
  const subtitle = getSubtitleConfig(sessionStatus, coachingMode);

  return (
    <header className="relative z-20 flex-shrink-0 overflow-hidden">
      {/* Frosted glass base -- UNCHANGED */}
      <div aria-hidden className="absolute inset-0 bg-white/60 backdrop-blur-xl" />

      {/* Aurora drift -- UNCHANGED */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 pointer-events-none"
        style={{
          width: '160%', left: '-30%',
          background: 'linear-gradient(90deg, transparent 0%, hsla(260,75%,75%,0.07) 40%, hsla(200,75%,75%,0.05) 60%, transparent 100%)',
        }}
        animate={{ x: ['-8%', '8%', '-8%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom separator -- UNCHANGED */}
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 0%, hsla(250,45%,55%,0.2) 22%, hsla(250,45%,55%,0.3) 50%, hsla(250,45%,55%,0.2) 78%, transparent 100%)',
      }} />

      {/* Content row */}
      <div className="relative flex items-center gap-2 px-3 py-2.5">
        {/* 1. Luna avatar (hologram orb + online indicator) */}
        <CoachAvatar />

        {/* 2. Luna name + 4. Session status + 5. Coaching mode (in subtitle) */}
        <div className="flex flex-col justify-center gap-[2px] flex-shrink-0">
          <span className="text-[13px] font-bold text-slate-800 leading-none tracking-tight">
            Luna
          </span>
          {/* Dynamic subtitle: status + mode */}
          <AnimatePresence mode="wait">
            <motion.span
              key={subtitle.text}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.12em] leading-none',
                subtitle.colorClass
              )}
            >
              {subtitle.showDot && (
                <span
                  className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{ background: subtitle.dotColor }}
                />
              )}
              {subtitle.text}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <VerticalDivider />

        {/* 3. Essay context switcher */}
        <EssaySwitcher type={essayType} onClick={onEssaySwitch} />

        {/* 6. History button (labeled) + 7. Settings button (labeled) */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <HeaderAction icon={History} label="History" onClick={onHistoryClick} />
          <HeaderAction icon={Settings} label="Settings" onClick={onSettingsClick} />
        </div>
      </div>
    </header>
  );
}
```

**Width budget verification** (424px usable after px-3 padding = 24px):
- CoachAvatar: 34px
- gap: 8px
- Name block: ~46px (Luna text + subtitle)
- gap: 8px
- VerticalDivider: 1px + mx margins ~9px total
- gap: 8px
- EssaySwitcher: flex-1 (gets remaining ~182px)
- gap: 8px
- HeaderAction History: ~60px
- HeaderAction Settings: ~65px
- gap between actions: 4px
- **Total fixed**: ~242px. **EssaySwitcher gets**: ~182px (generous room for "Common App" + icon + chevron)

**Estimated header height**: ~54px (unchanged from current: py-2.5 = 20px padding + 34px avatar height = 54px)

**Source**: hybrid -- Agent B's single-row structure with Agent A's divider retention

---

### 6. Deleted Code Cleanup
**Before**: 4 custom SVG icon components (PlusIcon, HistoryIcon, MenuIcon, CloseIcon) + ActionButton component
**After**: 2 custom components removed (PlusIcon, MenuIcon), HistoryIcon removed (replaced by lucide History), ActionButton replaced by HeaderAction. CloseIcon kept inside CloseButton. Close SVG is retained as inline because it matches the crafted style precisely.

**Files deleted/modified**:
- `PlusIcon` function: DELETE (lines 338-349)
- `HistoryIcon` function: DELETE (lines 351-376)
- `MenuIcon` function: DELETE (lines 378-386)
- `CloseIcon` function: DELETE (lines 388-399)
- `ActionButton` function: DELETE (lines 283-332) -- replaced by `HeaderAction`

**Source**: refined -- natural cleanup from replacing custom SVGs with lucide icons

---

## Execution Order

1. **Add imports and types** (Item 1): Add `EssayType`, `CoachingMode` imports, lookup maps, `ChatHeaderProps` interface, `getSubtitleConfig` function. Zero visual change at this step.

2. **Replace EssaySwitcher internals** (Item 3): Swap custom SVG for lucide FileText, add typed props. Test: essay label still shows "Common App".

3. **Add HeaderAction and CloseButton** (Item 4): Create new button components. Test: verify focus ring and hover states.

4. **Rewrite main render** (Item 5): Replace the content row JSX with the new layout including dynamic subtitle and labeled actions. Test: header renders at ~54px height, all 7 elements visible.

5. **Delete dead code** (Item 6): Remove PlusIcon, HistoryIcon, MenuIcon, CloseIcon, ActionButton. Test: `npx tsc --noEmit` passes.

6. **Verify consumers** (Item 1 integration): Confirm `ChatPanel.tsx` and `ChatWidget.tsx` still compile and render correctly with zero-prop `<ChatHeader />`.

---

## Existing Infrastructure Leveraged

| Component/Module | Location | Usage |
|---|---|---|
| `EssayType` type | `src/services/essayIntelligence/profileTypes.ts:66` | Props typing |
| `CoachingMode` type | `src/services/essayIntelligence/profileTypes.ts:99` | Props typing + subtitle derivation |
| `motion`, `AnimatePresence` | `motion/react` (installed, used in 10+ components) | Subtitle transitions |
| `History`, `Settings`, `FileText`, `ChevronDown` icons | `lucide-react` (installed, used in 25+ components) | Action buttons + essay switcher |
| `cn()` utility | `@/lib/utils` | Conditional class merging for subtitle |
| `CoachAvatar` | Same file (lines 98-187) | UNCHANGED -- hologram orb with online dot |
| `VerticalDivider` | Same file (lines 401-412) | UNCHANGED -- gradient divider |
| shadcn Badge | `src/components/ui/badge.tsx` | NOT used (see Rejected Approaches) |
| shadcn Button | `src/components/ui/button.tsx` | NOT used (ClickSpark wrapping is unwanted) |
| shadcn Tooltip | `src/components/ui/tooltip.tsx` | NOT used (labeled buttons don't need tooltips) |
| shadcn Popover | `src/components/ui/popover.tsx` | NOT used yet (premature without essay list data) |

---

## Open Questions

1. **"New conversation" button**: Removed from header. Should live in the History drawer/panel as a top action.

2. **Essay switcher dropdown**: When should the Popover with essay selection be implemented? The current design preserves the button shape but clicking it only fires `onEssaySwitch`. The actual dropdown needs an essay list from session state.

3. **Archived session visual**: Should archived sessions have additional visual treatment beyond the subtitle text? Options: dimmed header opacity, different aurora color, or an Archive icon prefix in the subtitle.

---

## Rejected Approaches

1. **Two-row layout** (Agent A): +40px vertical cost for a chat panel is too expensive. Single row fits all 7 elements.

2. **Icon-only action buttons with tooltips** (Agent A): Does not meet the "labeled" requirement. Tooltips are invisible on mobile and require hover delay.

3. **shadcn Button for header actions**: The ClickSpark wrapper adds purple spark effects on every click -- inappropriate for utility buttons like History and Settings.

4. **Popover on EssaySwitcher now**: No essay list data exists. The switching feature needs session state infrastructure first.

5. **Required props on ChatHeaderProps**: Would break both existing consumers (`ChatPanel.tsx`, `ChatWidget.tsx`) that call `<ChatHeader />` with zero props.

6. **Separate SessionBadge and CoachingModeBadge components** (Agent A): Two badges consume 112-132px (25-30% of row). The subtitle line absorbs both for 0px additional cost.

7. **Removing the vertical divider** (Agent B): 9px cost is trivial; the visual separation between identity and navigation is valuable.

8. **shadcn Badge for session status**: Display-only badges add CVA variant overhead for what is a simple colored text span. The dynamic subtitle is lighter and more flexible.

---
---

# Implementation Blueprint: Progress Pulse + Cloud Avatar

The ChatHeader currently uses a purple holographic orb as Luna's avatar and displays no essay progress information. This blueprint adds two capabilities: (1) a **Progress Pulse** that shows explicit, visible essay progress -- score, college tier, and momentum -- and (2) a **Cloud Avatar** replacing the orb with an expressive, phase-aware cloud character. Both fit within the existing 448px `max-w-md` panel and the ~54px header height.

---

## Part 1: Reality Verification

### Finding TYPES-1: ImprovementPhaseLevel EXISTS
**Severity**: verified
**Detail**: `ImprovementPhaseLevel` at `profileTypes.ts:87` = `'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction'`. Both designs reference this correctly.

### Finding TYPES-2: EffectivenessBand EXISTS + maps to college tiers
**Severity**: verified
**Detail**: `effectivenessBands.ts` exports `EffectivenessBand` with 6 bands: masterful(96-100), exceptional(86-95), strong(76-85), functional(55-75), developing(40-54), problematic(0-39). The `toEffectivenessBand()` function converts a 0-100 score. Agent A's `BAND_TO_TIER` mapping is a NEW invention -- it does NOT exist in the codebase. However, the Deep Academic Report module (`tierCalibration.ts`) maps GPA to college tiers using the SAME 6-tier hierarchy (Ivy/Elite, Highly Selective, Very Selective, Selective, Competitive, Accessible). Reusing these tier names for essay effectiveness is conceptually sound but it is a NOVEL mapping -- no existing code connects essay effectiveness bands to college admission tiers.

### Finding TYPES-3: ParagraphScoreMatrix EXISTS
**Severity**: verified
**Detail**: `ParagraphScoreMatrix` at `profileTypes.ts:1822` contains `paragraphs: ParagraphScoreEntry[]` where each entry has `scores.effectiveness` (0-100). An "average effectiveness" must be COMPUTED by averaging `paragraphs[i].scores.effectiveness` across all paragraphs. No pre-computed `avgEffectiveness` field exists on the profile.

### Finding TYPES-4: Edit Statistics EXIST in VersionTracker
**Severity**: verified
**Detail**: `StalenessAccumulator` in `versionTracker.ts:70-78` tracks `transformativeCount`, `significantCount`, `moderateCount`, `totalEdits`. These are also serialized in `ProfileIndex.accumulatedStaleness` (`profileTypes.ts:1400-1408`). Agent A's `editStats` prop is valid IF derived from the version tracker's accumulator.

### Finding TYPES-5: ImprovementPhase has rich data
**Severity**: verified
**Detail**: `ImprovementPhase` (`profileTypes.ts:1428-1477`) contains `level`, `reasoning`, `focusAreas`, `deferredAreas`, `readinessAssessment`, `dimensionPhases[]`, `coachingLens`, `transition`, `nearBoundary`. This is MUCH richer than either design assumed. The `transition` field tracks phase shifts. The `readinessAssessment` is LLM prose describing how close the essay is to the next level.

### Finding AVATAR-1: CoachAvatar is 85 lines of JSX
**Severity**: verified
**Detail**: CoachAvatar (`ChatHeader.tsx:98-187`) = 90 lines. Contains outer pulse halo, HUD conic ring, core orb, highlight spark, and online status dot. All framer-motion animated. Agent A's claim of "fewer than 85 lines" for the SVG cloud and Agent B's CSS cloud approach are both plausible replacements.

### Finding AVATAR-2: No face/eyes at 34px is a risk
**Severity**: concern
**Detail**: At 34x34px, both designs push the limits of recognizable detail. Agent A's dot-eyes (2px circles) may read as noise. Agent B's faceless physics-only approach may read as a generic blob. Neither has been visually tested. At 34px, SIMPLICITY is key -- fewer elements, higher contrast.

### Finding POPOVER-1: shadcn Popover EXISTS and works
**Severity**: verified
**Detail**: `src/components/ui/popover.tsx` wraps `@radix-ui/react-popover` with Portal rendering. It is usable for Agent A's expanded progress view. The Popover renders via Portal (no layout impact on header), has enter/exit animations, and accepts `sideOffset` for positioning.

### Finding LAYOUT-1: Width budget is TIGHT
**Severity**: concern
**Detail**: With the Items 1-6 header redesign, the layout is: Avatar(34) + gap(8) + Name(46) + gap(8) + Divider(9) + gap(8) + EssaySwitcher(flex-1, ~182px) + gap(8) + History(60) + Settings(65) + gap(4) = ~424px usable. Adding a 68px Progress Pill (Agent A) would steal from EssaySwitcher, reducing it to ~114px. "Common App" + icon + chevron = ~95px minimum. Tight but viable. An INLINE approach (Agent B) avoids this entirely.

### Finding DATA-FLOW-1: No essay profile data currently flows to ChatHeader
**Severity**: critical
**Detail**: ChatHeader receives ZERO props today. The essay profile data (ImprovementPhase, ParagraphScoreMatrix, edit stats) lives in backend services. To show progress, we need: (1) backend endpoint or WebSocket to surface vitals, (2) parent component (ChatPanel/ChatWidget) to hold state, (3) new props on ChatHeader. This is infrastructure work that BOTH designs require equally.

---

## Part 2: Forced-Choice Synthesis

### Decision 1: Score Display -- HYBRID (Agent A pill + Agent B ambient color)

**Winner**: Agent A's explicit progress, refined.

The user said: "intuitive like from 72 -> 78", "suggested score improvement", "where their college is at right now." This is an unambiguous request for EXPLICIT, VISIBLE numbers. Agent B's ambient-only approach (color shifts, energy, wisps) fails this requirement -- students will not decode that "slightly more saturated lavender" means "your score improved 6 points."

**Design**: A compact progress element between the divider and essay switcher. NOT a separate 68px pill (too wide) -- instead, a compact **score badge** (~48px) that shows the current average effectiveness as a number with a small delta arrow when the score has changed.

Display: `78` with a small up-arrow and `+6` in green, or just `72` with no arrow on first analysis. The number IS the effectiveness band midpoint, not the raw 0-100 (to avoid false precision per `effectivenessBands.ts` design philosophy). Show the BAND LABEL on hover/tap.

Pre-analysis state: Pulsing `--` placeholder.

**Additionally**: The cloud avatar's color shifts with phase (Agent B's ambient approach) as a SECONDARY signal. The number is primary; the cloud vibe is reinforcement.

### Decision 2: College Tier -- POPOVER detail, not inline

**Winner**: Agent A's popover, refined.

The user said "where their college is at right now like around T20 colleges level." This needs text, not a border tint. But it does NOT need to be always-visible -- it is a detail you check, not a constant reference.

**Design**: Click/tap the score badge to open a Popover (using existing shadcn Popover). The popover shows:
- Current effectiveness band label + score range (e.g., "Strong (76-85)")
- College tier mapping: "Essays in this range are competitive at **Highly Selective** schools (Northwestern, UCLA, UC Berkeley)"
- Momentum: edit velocity label (stalled/steady/surging) based on edit stats
- Phase: current improvement phase with one-line description
- If `nearBoundary` on the phase: "Close to advancing to Architecture phase"

Size: 260px wide, auto-height. This is richer than Agent A's 240x180 SVG arc and more informative than Agent B's 28px expansion.

**BAND_TO_TIER mapping** (new, lives in the component file):
```typescript
const BAND_TO_TIER: Record<EffectivenessBand, { tier: string; examples: string }> = {
  masterful:   { tier: 'Ivy/Elite',          examples: 'Harvard, Stanford, MIT' },
  exceptional: { tier: 'Highly Selective',   examples: 'Northwestern, UCLA, UC Berkeley' },
  strong:      { tier: 'Very Selective',     examples: 'NYU, Boston College, UW-Madison' },
  functional:  { tier: 'Selective',          examples: 'Boston University, UT Austin, Purdue' },
  developing:  { tier: 'Competitive',        examples: 'Arizona State, Iowa State, Temple' },
  problematic: { tier: 'Needs Work',         examples: 'Focus on fundamentals first' },
};
```
This reuses the tier names from `tierCalibration.ts` (Finding TYPES-2) for consistency across the product.

### Decision 3: Cloud Shape -- CSS overlapping divs (Agent B), refined

**Winner**: Agent B's CSS approach, with adjustments.

At 34px, an SVG path cloud requires sub-pixel precision and a `filter: blur()` that may alias poorly on non-retina screens. CSS `rounded-full` divs with radial gradients are the SAME technique used for the cloud valley in `ChatPanel.tsx` (lines 127-173) -- proven pattern in this codebase. Consistency matters.

**Design**: 3 overlapping `rounded-full` divs (main lobe 18x16, left lobe 13x12, right lobe 14x11) with `blur(0.5px)` edge softening. Radial gradient fill matching the current orb's purple palette as the default, shifting hue per phase.

### Decision 4: Cloud Personality -- Minimal face (refined from Agent A)

**Winner**: Hybrid -- two dots + phase-driven color, no blush.

Agent B's faceless physics-only cloud is elegant in theory but at 34px, "personality through physics" means students see a colored blob. The chat panel already has clouds (the valley) -- another faceless cloud blends in rather than standing out as a CHARACTER.

Agent A's dot-eyes give the cloud identity. At 34px, two 2.5px dots placed at ~35% from top are legible. Happy blush (Agent A) is too much detail at this scale -- cut it. Mood states simplified to 2: default (neutral dots) and thinking (dots shift to .. squint via slight Y offset during analysis).

The phase-driven color shifts (Agent B) apply to the cloud body, not the eyes. Eyes stay dark (slate-700) for contrast.

### Decision 5: Expansion -- POPOVER (Agent A), not row expansion

**Winner**: Agent A's popover approach.

Agent B's 28px row expansion pushes all messages down on every click -- disruptive in a chat context. A Popover (Portal-rendered, no layout shift) is the standard pattern in this codebase (shadcn Popover used in multiple components). It appears ON TOP of content, shows detail, and dismisses cleanly.

### Decision 6: Subtitle -- DYNAMIC phase name (Agent B), refined

**Winner**: Agent B's approach, already adopted in Items 1-6.

The subtitle already shows coaching mode from the Item 2 implementation. For Progress Pulse, the subtitle absorbs the improvement phase when no coaching mode is active: "foundation phase" / "architecture phase" / "craft phase" / "polishing" / "distinction". When coaching mode IS active (revision_response, iteration_deep, etc.), coaching mode takes priority (it is more immediately relevant). Phase is always visible in the popover.

Priority chain: `archived > coaching_mode > improvement_phase > "essay coach"`.

---

## Items

---

### 7. Progress Score Badge: New compact element between divider and essay switcher

**Before**: Divider flows directly into EssaySwitcher
**After**: Divider -> ProgressBadge (~48px) -> EssaySwitcher (flex-1, now ~134px)

**Implementation**:

New types (add to ChatHeaderProps from Item 1):
```typescript
import type { ImprovementPhaseLevel } from '@/services/essayIntelligence/profileTypes';
import type { EffectivenessBand } from '@/services/essayIntelligence/analysis/effectivenessBands';

/** Vitals passed from parent — derived from EssayProfile + VersionTracker */
export interface EssayVitals {
  /** Average paragraph effectiveness (0-100), computed from ParagraphScoreMatrix */
  avgEffectiveness: number | null;
  /** Previous avg effectiveness (for delta display) */
  prevAvgEffectiveness: number | null;
  /** Current improvement phase level */
  phase: ImprovementPhaseLevel;
  /** Phase readiness assessment (LLM prose, from ImprovementPhase) */
  readinessAssessment: string | null;
  /** Whether phase is near a boundary */
  nearBoundary: boolean;
  /** Edit statistics from VersionTracker */
  editStats: {
    totalEdits: number;
    transformativeCount: number;
    significantCount: number;
    moderateCount: number;
  };
  /** Whether analysis has completed at least once */
  hasAnalysis: boolean;
  /** Whether analysis is currently running */
  isAnalyzing: boolean;
}

// Add to ChatHeaderProps:
export interface ChatHeaderProps {
  // ... existing props from Item 1 ...
  /** Essay progress vitals. Undefined = pre-analysis state. */
  vitals?: EssayVitals;
}
```

The ProgressBadge component:
```tsx
function ProgressBadge({ vitals, onClick }: { vitals?: EssayVitals; onClick?: () => void }) {
  if (!vitals) {
    // Pre-analysis: show nothing (avoid confusing empty state)
    return null;
  }

  if (!vitals.hasAnalysis) {
    // Analysis running but not complete
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 px-1.5 h-[24px] rounded-md text-[11px] font-semibold text-slate-400"
        style={{
          background: 'hsla(255,50%,90%,0.4)',
          border: '1px solid hsla(260,40%,70%,0.2)',
        }}
      >
        <motion.span
          className="w-[5px] h-[5px] rounded-full bg-violet-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span>--</span>
      </button>
    );
  }

  const score = vitals.avgEffectiveness ?? 0;
  const prevScore = vitals.prevAvgEffectiveness;
  const delta = prevScore !== null ? score - prevScore : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-0.5 px-1.5 h-[24px] rounded-md text-[12px] font-bold tabular-nums transition-all duration-150 hover:ring-1 hover:ring-violet-300/40"
          style={{
            background: 'linear-gradient(180deg, hsla(255,60%,92%,0.5) 0%, hsla(255,55%,95%,0.3) 100%)',
            border: '1px solid hsla(260,50%,65%,0.22)',
            color: 'hsl(260,50%,40%)',
          }}
        >
          <span>{Math.round(score)}</span>
          {delta !== null && delta !== 0 && (
            <span className={cn(
              'text-[9px] font-semibold leading-none',
              delta > 0 ? 'text-emerald-500' : 'text-rose-400'
            )}>
              {delta > 0 ? '+' : ''}{Math.round(delta)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8} className="w-[260px] p-3">
        <ProgressDetail vitals={vitals} />
      </PopoverContent>
    </Popover>
  );
}
```

Width budget impact: The badge is ~48px when showing "78 +6". EssaySwitcher shrinks from ~182px to ~134px. "Common App" label (~75px) + icon(20px) + chevron(14px) + padding(16px) = ~125px needed. 134px available -- fits with 9px margin.

**Integration points**: Rendered in the content row between VerticalDivider and EssaySwitcher.

**Source**: hybrid -- Agent A's explicit display concept, Agent B's 0-new-width philosophy trimmed to 48px compromise

---

### 8. Progress Detail Popover: Expanded view with college tier, momentum, phase

**Before**: No progress detail view
**After**: Click score badge opens popover with band, tier, momentum, phase detail

**Implementation**:

```tsx
/** Maps effectiveness bands to college admission tiers */
const BAND_TO_TIER: Record<EffectivenessBand, { tier: string; examples: string }> = {
  masterful:   { tier: 'Ivy/Elite',          examples: 'Harvard, Stanford, MIT' },
  exceptional: { tier: 'Highly Selective',   examples: 'Northwestern, UCLA, UC Berkeley' },
  strong:      { tier: 'Very Selective',     examples: 'NYU, Boston College, UW-Madison' },
  functional:  { tier: 'Selective',          examples: 'Boston University, UT Austin, Purdue' },
  developing:  { tier: 'Competitive',        examples: 'Arizona State, Iowa State, Temple' },
  problematic: { tier: 'Needs Work',         examples: 'Focus on fundamentals first' },
};

/** Compute momentum label from edit stats */
function getMomentum(editStats: EssayVitals['editStats']): {
  label: string;
  color: string;
} {
  const { totalEdits, transformativeCount, significantCount, moderateCount } = editStats;
  if (totalEdits === 0) return { label: 'Not started', color: 'text-slate-400' };
  // Weighted velocity: transformative edits carry most signal
  const velocity = (transformativeCount * 10 + significantCount * 5 + moderateCount * 2) / Math.max(totalEdits, 1);
  if (velocity >= 5) return { label: 'Surging', color: 'text-emerald-500' };
  if (velocity >= 2) return { label: 'Steady', color: 'text-amber-500' };
  return { label: 'Warming up', color: 'text-slate-400' };
}

/** Phase display labels */
const PHASE_LABELS: Record<ImprovementPhaseLevel, { label: string; description: string }> = {
  foundation:    { label: 'Foundation',    description: 'Building core narrative and meaning' },
  architecture:  { label: 'Architecture',  description: 'Strengthening structure and flow' },
  craft:         { label: 'Craft',         description: 'Refining voice, detail, and technique' },
  polish:        { label: 'Polish',        description: 'Fine-tuning word choice and rhythm' },
  distinction:   { label: 'Distinction',   description: 'Elevating to memorable and singular' },
};

function ProgressDetail({ vitals }: { vitals: EssayVitals }) {
  const score = vitals.avgEffectiveness ?? 0;
  const band = toEffectivenessBand(score);
  const tier = BAND_TO_TIER[band.band];
  const momentum = getMomentum(vitals.editStats);
  const phaseInfo = PHASE_LABELS[vitals.phase];

  return (
    <div className="space-y-3">
      {/* Band + Score */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-slate-800">{band.label}</span>
          <span className="text-[11px] text-slate-400">{band.range[0]}-{band.range[1]} band</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{band.description}</p>
      </div>

      {/* College Tier */}
      <div className="rounded-md px-2.5 py-2" style={{ background: 'hsla(255,50%,95%,0.6)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Essay competitiveness
        </p>
        <p className="text-[12px] font-bold text-slate-700">{tier.tier}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{tier.examples}</p>
      </div>

      {/* Phase + Momentum row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phase</p>
          <p className="text-[12px] font-medium text-slate-700">{phaseInfo.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Momentum</p>
          <p className={cn('text-[12px] font-medium', momentum.color)}>{momentum.label}</p>
        </div>
      </div>

      {/* Near boundary hint */}
      {vitals.nearBoundary && vitals.readinessAssessment && (
        <p className="text-[10px] text-violet-500 italic leading-relaxed">
          {vitals.readinessAssessment}
        </p>
      )}

      {/* Edit stats summary */}
      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">
          {vitals.editStats.totalEdits} edits
        </span>
        {vitals.editStats.transformativeCount > 0 && (
          <span className="text-[10px] text-emerald-500 font-medium">
            {vitals.editStats.transformativeCount} transformative
          </span>
        )}
      </div>
    </div>
  );
}
```

**Integration points**: Rendered inside the Popover from Item 7. Uses `toEffectivenessBand` from `@/services/essayIntelligence/analysis/effectivenessBands`.

**Source**: hybrid -- Agent A's popover concept with Agent B's EssayVitals interface, college tiers from `tierCalibration.ts` naming convention

---

### 9. ~~Cloud Avatar~~ — DEFERRED (Placeholder Only)

**Status**: Avatar redesign handled separately via nano banana animated mascot workflow. Keep current CoachAvatar as-is for now. When the animated mascot asset is ready, it will replace CoachAvatar.

**Placeholder approach**: Keep `CoachAvatar` function unchanged. No deletion, no CSS cloud. The avatar slot remains 34x34px and will accept the mascot asset when ready.

**Implementation**: Keep existing `CoachAvatar` unchanged. The 34x34px container slot and online status dot pattern will be preserved for the future mascot drop-in.

**When the mascot is ready**: Replace the `CoachAvatar` function body with an `<img>` or animated component from the nano banana output. The container dimensions, status dot, and `flex-shrink-0` layout role remain the same.

**Source**: deferred — avatar handled via separate nano banana animated mascot workflow

---

### 10. Subtitle Phase Integration: Priority chain for subtitle text

**Before** (from Item 2): subtitle shows coaching mode or "essay coach"
**After**: subtitle also shows improvement phase when no coaching mode is active

**Implementation**:

Update `getSubtitleConfig` from Item 2:
```typescript
function getSubtitleConfig(
  sessionStatus: 'live' | 'archived',
  coachingMode?: CoachingMode,
  phase?: ImprovementPhaseLevel,
): { text: string; colorClass: string; showDot: boolean; dotColor?: string } {
  if (sessionStatus === 'archived') {
    return { text: 'Archived Session', colorClass: 'text-slate-400', showDot: false };
  }

  // Live session: coaching mode takes priority over phase
  if (coachingMode && coachingMode !== 'first_encounter') {
    const config = COACHING_MODE_CONFIG[coachingMode];
    return { text: config.label, colorClass: config.color, showDot: true, dotColor: 'hsl(162,72%,46%)' };
  }

  // Show improvement phase if analysis has run
  if (phase && phase !== 'foundation') {
    const phaseLabels: Record<ImprovementPhaseLevel, string> = {
      foundation: 'essay coach',
      architecture: 'architecture phase',
      craft: 'craft phase',
      polish: 'polishing',
      distinction: 'distinction',
    };
    return {
      text: phaseLabels[phase],
      colorClass: 'text-violet-400',
      showDot: true,
      dotColor: 'hsl(162,72%,46%)',
    };
  }

  // Default: essay coach
  return { text: 'essay coach', colorClass: 'text-slate-400', showDot: true, dotColor: 'hsl(162,72%,46%)' };
}
```

**Logic**: archived > active coaching mode > improvement phase > "essay coach". Foundation phase shows "essay coach" because foundation IS the default starting state -- calling it out adds no information.

**Source**: rethink (refined) -- Agent B's phase-in-subtitle approach, with priority chain from Item 2

---

### 11. Data Flow: EssayVitals derivation from EssayProfile

**Before**: No essay data flows to ChatHeader
**After**: Parent component derives EssayVitals from EssayProfile + VersionTracker and passes as optional prop

**Implementation**:

This is a FUTURE integration item (requires backend wiring). The computation logic:
```typescript
import type { EssayProfile } from '@/services/essayIntelligence/profileTypes';
import type { EssayVitals } from './ChatHeader';

/**
 * Derive display vitals from the full essay profile.
 * Called by the parent component (ChatPanel or equivalent) when profile updates.
 */
export function deriveEssayVitals(
  profile: EssayProfile | null,
  prevAvgEffectiveness: number | null,
  isAnalyzing: boolean,
): EssayVitals | undefined {
  if (!profile) return undefined;

  const scoreMatrix = profile.crystallization?.scoreMatrix;
  const phase = profile.index.improvementPhase;

  // Compute average effectiveness from paragraph scores
  let avgEffectiveness: number | null = null;
  if (scoreMatrix && scoreMatrix.paragraphs.length > 0) {
    const sum = scoreMatrix.paragraphs.reduce((acc, p) => acc + p.scores.effectiveness, 0);
    avgEffectiveness = sum / scoreMatrix.paragraphs.length;
  }

  return {
    avgEffectiveness,
    prevAvgEffectiveness,
    phase: phase.level,
    readinessAssessment: phase.readinessAssessment,
    nearBoundary: phase.nearBoundary ?? false,
    editStats: {
      totalEdits: profile.index.stalenessSnapshot
        ? (profile.index as any).accumulatedStaleness?.totalEdits ?? 0
        : 0,
      transformativeCount: (profile.index as any).accumulatedStaleness?.transformativeCount ?? 0,
      significantCount: (profile.index as any).accumulatedStaleness?.significantCount ?? 0,
      moderateCount: (profile.index as any).accumulatedStaleness?.moderateCount ?? 0,
    },
    hasAnalysis: avgEffectiveness !== null,
    isAnalyzing,
  };
}
```

**Note**: The `(profile.index as any).accumulatedStaleness` cast is needed because `accumulatedStaleness` is on `VersionEntry` (`profileTypes.ts:1400`), not directly on `ProfileIndex`. The integration layer will need to bridge this from the VersionTracker's current state. This is documented as a type gap to resolve during backend wiring.

**Source**: refined -- addresses Finding DATA-FLOW-1

---

## Execution Order (Items 7-11)

These items DEPEND on Items 1-6 being implemented first (they extend ChatHeaderProps and modify the content row).

1. **Add EssayVitals type + extend ChatHeaderProps** (Item 7 types): Add the interface and optional `vitals` prop. Zero visual change.

2. **Add ProgressBadge + ProgressDetail** (Items 7-8): Add the score badge and popover detail. Insert between VerticalDivider and EssaySwitcher. Visual change: score appears in header.

3. **Update subtitle priority chain** (Item 10): Modify `getSubtitleConfig` to include phase. Visual change: subtitle shows phase when no coaching mode active.

4. **Add deriveEssayVitals utility** (Item 11): Export the derivation function. No visual change -- consumed by parent components during backend integration.

5. **Avatar** (Item 9): DEFERRED. Keep existing CoachAvatar as placeholder. Mascot asset will be created via nano banana and dropped in later.

---

## Existing Infrastructure Leveraged (Items 7-11)

| Component/Module | Location | Usage |
|---|---|---|
| `ImprovementPhaseLevel` type | `profileTypes.ts:87` | Phase display, cloud color |
| `EffectivenessBand` type + `toEffectivenessBand()` | `effectivenessBands.ts` | Score-to-band conversion |
| `ParagraphScoreMatrix` type | `profileTypes.ts:1822` | Average effectiveness computation |
| `StalenessAccumulator` shape | `versionTracker.ts:70-78` | Edit statistics |
| `COLLEGE_TIER_BENCHMARKS` naming | `tierCalibration.ts:32-39` | Tier name consistency |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `components/ui/popover.tsx` | Progress detail expansion |
| `motion`, `AnimatePresence` | `motion/react` | Cloud animation, badge transitions |
| `cn()` utility | `@/lib/utils` | Conditional class composition |
| Cloud valley CSS technique | `ChatPanel.tsx:127-173` | Proven `rounded-full` + blur pattern |

---

## Open Questions (Items 7-11)

1. **Score display philosophy**: The effectiveness band system was designed to AVOID showing raw numbers ("a score of 71 vs 73 carries zero signal" -- effectivenessBands.ts comment). Showing `78` in the badge arguably contradicts this. Alternative: show the BAND LABEL ("Strong") instead of the number. Counter-argument: the user explicitly asked for "72 -> 78" style display. **Decision**: Show the number. The popover provides band context. The number is what drives emotional engagement ("I went from 72 to 78!") even if the precision is technically illusory.

2. **BAND_TO_TIER accuracy**: Mapping essay effectiveness to college admission tiers is an APPROXIMATION. A "strong" essay alone does not guarantee "Very Selective" admission. The tier mapping should include a disclaimer in the popover. Suggestion: "Based on essay quality alone" footnote.

3. **Backend data pipeline**: Items 7-11 define the frontend components. The actual data flow (WebSocket, polling, or prop drilling from route-level state) is a separate implementation concern. The `deriveEssayVitals` utility in Item 11 documents the computation, but the TRANSPORT mechanism is TBD.

4. **Cloud avatar visual testing**: The CSS cloud at 34px has not been visually tested. The dot-eyes at 2.5px may need size adjustment after rendering. Recommend: implement Item 9 first and test in the browser before proceeding to Items 7-8.

---

## Rejected Approaches (Items 7-11)

1. **Ambient-only progress** (Agent B's cloud-as-data-viz): The user explicitly requested explicit numbers, scores, and college tier labels. Ambient color shifts are invisible to most users. Ambient is a SECONDARY reinforcement, not the primary signal.

2. **68px progress pill** (Agent A): Too wide. Squeezes EssaySwitcher below comfortable minimum. The 48px score badge is a better compromise.

3. **SVG path cloud** (Agent A): No precedent in codebase. CSS `rounded-full` divs match the proven cloud valley technique in ChatPanel.tsx. More maintainable.

4. **Header row expansion on click** (Agent B): Layout shift in a chat panel is disruptive. Popover via Portal has zero layout impact.

5. **Full progress arc SVG** (Agent A): A 240x180 arc visualization is impressive but over-engineered for a popover that shows 5 data points. Simple text layout is more informative and easier to maintain.

6. **Faceless cloud** (Agent B): At 34px without a face, the cloud is indistinguishable from the decorative clouds in the chat panel's valley. Two dot-eyes are the minimum viable personality.

7. **Wisp particles** (Agent B): At 34px viewport, 1-4 floating wisps add visual noise without readable meaning. Cut for clarity.

8. **Phase abbreviations (FND/ARC/CRT)** (Agent A): Not intuitive. Students must learn a new abbreviation system. Full phase names in the subtitle and popover are clearer.
