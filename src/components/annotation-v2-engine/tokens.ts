/**
 * Annotation V2 — Design Tokens
 * Workstream A (Wave α). Source of truth for every named color, easing, duration,
 * typography rule, glass morphism value, and z-layer used across the inline
 * annotation editor.
 *
 * Authority: these tokens implement the decisions in:
 *   - docs/ANNOTATION_V2_BUILD_PLAN.md (Shared Contracts section)
 *   - docs/INLINE_ANNOTATION_UX_PLAN.md (§1 Color, §14 Animation, §16 A11y)
 *   - docs/ux_phases/phase_4_loading_state.md (captions, ribbon, vapor scan)
 *   - docs/ux_phases/phase_5_first_reveal.md (bloom choreography, easings)
 *   - docs/ux_phases/phase_8_reading_insight.md (insight card typography)
 *   - docs/ux_phases/phase_10_navigation.md (3px tier-gradient progress bar)
 *
 * Every export below carries a JSDoc comment citing the phase spec §section
 * that mandates it. Do not change a value without updating the corresponding
 * spec first — build-plan rule.
 *
 * Tier CSS variables are defined in ./workshop.css on `:root`. This module
 * only *references* them by name; it does not emit color values. This keeps
 * the opacity-variant pattern (`hsl(var(--anno-strong) / 0.6)`) available
 * everywhere in the codebase.
 */

// ---------------------------------------------------------------------------
// Tier primitives
// ---------------------------------------------------------------------------

/**
 * Six-tier severity spectrum mapped to L3.5 effectiveness scores.
 * UX_PLAN §1 "Color System Architecture" / BUILD_PLAN "Tier tokens".
 */
export type Tier =
  | 'CRITICAL'
  | 'NEEDS_WORK'
  | 'FUNCTIONAL'
  | 'STRONG'
  | 'EXCEPTIONAL'
  | 'MASTERFUL';

/**
 * Underline style per tier.
 * UX_PLAN §1 Visual Treatment + Phase 5 §2.4 Color Density Management.
 *   - CRITICAL: wavy (draws attention)
 *   - NEEDS_WORK / STRONG / EXCEPTIONAL: solid
 *   - FUNCTIONAL: none (visual silence is the default state of prose)
 *   - MASTERFUL: shimmer (gradient overlay animation)
 */
export type UnderlineStyle = 'wavy' | 'solid' | 'none' | 'shimmer';

/**
 * Tier → CSS custom property name lookup.
 * Callers read the variable via `hsl(var(--anno-<tier>))` to enable
 * opacity variants (`hsl(var(--anno-strong) / 0.6)`).
 * UX_PLAN §1 CSS Custom Properties / BUILD_PLAN Shared Contracts.
 */
export const TIER_CSS_VAR: Record<Tier, string> = {
  CRITICAL: '--anno-critical',
  NEEDS_WORK: '--anno-needs-work',
  FUNCTIONAL: '--anno-functional',
  STRONG: '--anno-strong',
  EXCEPTIONAL: '--anno-exceptional',
  MASTERFUL: '--anno-masterful',
} as const;

/**
 * Descriptive metadata per tier. Rendered wherever tier names / ranges /
 * underline style need to be surfaced (InsightCard meta line, TierKeyPopover,
 * filter chips, accessibility labels).
 * UX_PLAN §1 Color Mental Model + Phase 5 §2.4 Density Rules.
 */
export const TIER_META: Record<
  Tier,
  {
    /** Display label as shown inline (UX_PLAN §1 table). */
    label: string;
    /** Numeric range as shown in TierKeyPopover + overview stats. */
    rangeLabel: string;
    /** Underline decoration style. Phase 5 §2.4 visibility table. */
    underlineStyle: UnderlineStyle;
    /** One-line description for tooltips + accessibility. UX_PLAN §16. */
    description: string;
  }
> = {
  CRITICAL: {
    label: 'CRITICAL',
    rangeLabel: 'under 40',
    underlineStyle: 'wavy',
    description: 'This needs fixing — a clarity, logic, or structure issue.',
  },
  NEEDS_WORK: {
    label: 'NEEDS WORK',
    rangeLabel: '40–54',
    underlineStyle: 'solid',
    description: 'This could be better — a non-critical improvement opportunity.',
  },
  FUNCTIONAL: {
    label: 'FUNCTIONAL',
    rangeLabel: '55–75',
    underlineStyle: 'none',
    description: 'This works — functional and acceptable for submission.',
  },
  STRONG: {
    label: 'STRONG',
    rangeLabel: '76–85',
    underlineStyle: 'solid',
    description: 'This is strong — genuinely effective writing.',
  },
  EXCEPTIONAL: {
    label: 'EXCEPTIONAL',
    rangeLabel: '86–95',
    underlineStyle: 'solid',
    description: 'This is distinctive — an exceptional, memorable moment.',
  },
  MASTERFUL: {
    label: 'MASTERFUL',
    rangeLabel: '96–100',
    underlineStyle: 'shimmer',
    description: 'This is peak — the system considers it masterful.',
  },
};

// ---------------------------------------------------------------------------
// Easing curves
// ---------------------------------------------------------------------------

/**
 * Named easing curves used across the editor.
 * Every choreographed animation MUST use one of these — no ad-hoc cubic-beziers.
 *
 * Values are `[x1, y1, x2, y2]` tuples — motion/react consumes this form
 * directly on `ease` props, and the helper `easingCss(curve)` below turns
 * them into CSS `cubic-bezier(...)` strings for raw CSS transitions.
 */
export const EASING = {
  /**
   * ease-out-quart. Soft settle, no overshoot.
   * Phase 5 §2.1 — sentence underline bloom (stroke-dashoffset).
   */
  underlineBloom: [0.22, 1, 0.36, 1] as const,

  /**
   * ease-out-expo. Continues the Phase 4 scan-bar visual language.
   * Phase 5 §2.1 — right panel slide-in (250ms).
   */
  panelSlide: [0.16, 1, 0.3, 1] as const,

  /**
   * Material standard curve. Used for crossfades between panel contents and
   * caption swaps.
   * Phase 4 §3 caption swap + Phase 7 content crossfade.
   */
  contentCrossfade: [0.4, 0, 0.2, 1] as const,

  /**
   * Symmetric ease-in-out. For the auto-select luminous ring pulse and
   * tier-shift desaturation midpoint.
   * Phase 5 §2.1 auto-select pulse + §2.10 diff cross-dissolve.
   */
  pulse: [0.65, 0, 0.35, 1] as const,

  /**
   * Same curve as `pulse` — separate name preserves semantic intent at call
   * sites (the single-shot opacity 0 → 0.35 → 0 ring on the auto-selected
   * strongest sentence).
   * Phase 5 §2.1 t=2200ms auto-selection settle.
   */
  autoSelectPulse: [0.65, 0, 0.35, 1] as const,
} as const;

export type EasingName = keyof typeof EASING;

/**
 * Convert an EASING tuple to a CSS `cubic-bezier(...)` string for raw CSS
 * transitions. Use this in `transition:` inline styles; motion/react's
 * `ease` prop takes the tuple directly.
 */
export function easingCss(curve: readonly [number, number, number, number]): string {
  return `cubic-bezier(${curve[0]}, ${curve[1]}, ${curve[2]}, ${curve[3]})`;
}

// ---------------------------------------------------------------------------
// Durations (milliseconds)
// ---------------------------------------------------------------------------

/**
 * Every named animation duration, in milliseconds. Motion primitives
 * (`motion/react`) consume these directly; CSS consumers should read the
 * corresponding CSS variable in `workshop.css` if defined there.
 */
export const DURATION = {
  /** Phase 5 §2.1 + Phase 7 click→panel. Right panel slide-in. */
  panelSlide: 250,

  /**
   * Phase 7 §crossfade contract + Phase 4 §2.8. Panel body content swap
   * when user selects a different sentence or tab.
   */
  contentCrossfade: 180,

  /**
   * Phase 7 §2 click ring fade-in. The first thing that appears on click,
   * before the content crossfade begins.
   */
  ringFadeIn: 120,

  /**
   * Phase 7 §2 mousedown → mouseup affordance pulse. Extremely short by
   * design — a tactile acknowledgement, not an animation.
   */
  mousedownPulse: 60,

  /**
   * Phase 5 §2.1 step 6 + §4 motion table. Per-sentence stroke-dashoffset
   * draw-in. 160ms per sentence, stagger is declared separately (35ms).
   */
  underlineBloom: 160,

  /**
   * Phase 5 §3 — approximate total duration of the strengths wave for an
   * average-length essay (9 STRONG+ sentences × 35ms + 160ms final bloom).
   * Consumers use this for choreography budgets, not per-sentence timing.
   */
  strengthsWaveTotal: 900,

  /**
   * Phase 5 §3 — approximate total duration of the critical/needs-work
   * wave. Same shape as strengthsWaveTotal.
   */
  criticalWaveTotal: 900,

  /**
   * Phase 5 §2.1 step 7 — single-shot luminous ring on the auto-selected
   * sentence. Opacity 0 → 0.35 → 0 in 400ms, no repeat.
   */
  autoSelectPulse: 400,

  /**
   * UX_PLAN §14 hover contract + Phase 7 §2. Delay before the sentence
   * hover tooltip fades in. Short enough to feel responsive, long enough
   * to avoid accidental drive-by activations.
   */
  hoverTooltipDelay: 300,

  /**
   * Phase 7 §2 rapid-click coalescing window. If the user clicks multiple
   * sentences within 40ms, only the latest selection commits — avoids
   * flashing intermediate panel states.
   */
  rapidClickCoalesce: 40,

  // --- Secondary durations referenced by choreography but not primary
  // API surface. Kept here so consumers don't re-derive from specs. ---

  /** Phase 5 §4 — paragraph-tint saturation deepen from 40% to 55%. */
  paragraphTintDeepen: 600,

  /** Phase 5 §4 — gutter role label per-label fade-in. */
  gutterLabelFade: 180,

  /** Phase 5 §4 — stagger between gutter labels (top→bottom). */
  gutterLabelStagger: 40,

  /** Phase 5 §4 — header narrative glow fade-in. */
  headerNarrativeFade: 240,

  /** Phase 5 §4 — per-sentence stagger in the bloom waves. */
  sentenceBloomStagger: 35,

  /** Phase 5 §3 — panel auto-scroll to selected insight after auto-select. */
  panelAutoScroll: 300,

  /** Phase 5 §2.6 — "Start here" chip appearance, after auto-select settles. */
  startHereChipFade: 200,

  /** Phase 4 §3 — vapor scan fade-in on Analyze click. */
  vaporScanFadeIn: 240,

  /** Phase 4 §3 — vapor scan fade-out at L5 complete. */
  vaporScanFadeOut: 320,

  /** Phase 4 §3 — caption-out + caption-in on layer transition. */
  captionSwapOut: 120,
  captionSwapIn: 180,

  /** Phase 10 §progress bar — progress bar fill advance (lags panel). */
  progressBarAdvance: 280,

  /**
   * UX_PLAN §16 + Phase 5 §2.1. Reduced-motion fallback: collapse every
   * bloom/pulse to a single crossfade at this duration.
   */
  reducedMotionCrossfade: 220,
} as const;

export type DurationName = keyof typeof DURATION;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * Typography spec for the insight panel and associated surfaces.
 * Phase 8 §2.6 + §3.1 token table. Serif (ECRM / Source Serif 4 fallback)
 * for prose; ui-sans (Inter / system-ui) for labels and meta.
 *
 * The panel is a reading environment, not a UI environment — sizes are
 * calibrated to slow the eye enough to absorb critique prose without
 * tipping into document-reading register.
 */
export const TYPOGRAPHY = {
  families: {
    /** Phase 8 §2.6 — prose serif. ECRM first, Source Serif 4 fallback. */
    serif: '"ECRM", "Source Serif 4", Georgia, serif',
    /** Phase 8 §2.6 — labels + meta. System ui-sans. */
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  /** Phase 8 §3.1 — exact per-role sizes. All px for consistency. */
  size: {
    /** Phase 8 §3.1 — meta line (¶4 · sentence 2 · EXCEPTIONAL). */
    meta: '12px',
    /** Phase 8 §3.1 — tier word inline (TierWord component). */
    tierWord: '12px',
    /** Phase 8 §3.1 — critique prose body. Load-bearing reading size. */
    critique: '15px',
    /** Phase 8 §3.1 — inline quote inside critique (same as critique). */
    inlineQuote: '15px',
    /** Phase 8 §3.1 — WHY IT MATTERS / WHAT'S WORKING / ONE POSSIBLE MOVE. */
    sectionLabel: '11px',
    /** Phase 8 §3.1 — why-it-matters body (single sentence). */
    whyBody: '15px',
    /** Phase 8 §3.1 — individual strength bullet line. Slightly smaller. */
    strengthLine: '14px',
    /** Phase 8 §3.1 — rewrite body prose. Matches critique size. */
    rewriteBody: '15px',
    /** Phase 8 §3.1 — cross-ref pill inline within prose. */
    pillInline: '12px',
    /** Phase 8 §3.1 — panel header (non-progress elements). */
    panelHeader: '13px',
    /** Phase 8 §3.1 — nav-stack breadcrumb. */
    breadcrumb: '12px',
    /** Phase 4 §2.1 — loading-state caption under ribbon. */
    loadingCaption: '13px',
    /** Phase 5 §2.1 — header narrative glow above editor. */
    headerNarrative: '16px',
    /** Phase 5 §2.3 — overview card supertitle. */
    overviewSupertitle: '12px',
    /** Phase 5 §2.3 — overview card field labels. */
    overviewLabel: '13px',
    /** Phase 5 §2.3 — overview card pull-quote (serif italic). */
    overviewPullQuote: '15px',
  },
  /** Phase 8 §3.1 — line-heights. 1.55 on serif, 1.4 on sans. */
  lineHeight: {
    /** Phase 8 §3.1 — prose (critique, why body, rewrite body). */
    serifProse: 1.55,
    /** Phase 8 §3.1 — strength line (slightly tighter). */
    serifStrength: 1.5,
    /** Phase 8 §3.1 — all ui-sans labels + meta. */
    sans: 1.4,
    /** Phase 8 §3.1 — tier word + pill (very tight for inline fit). */
    sansTight: 1.3,
  },
  /** Phase 8 §3.1 — font-weights. */
  weight: {
    /** Prose. Serif 400. */
    regular: 400,
    /** Meta, panel header, breadcrumb, pill. */
    medium: 500,
    /** TierWord, section labels. */
    semibold: 600,
  },
  /** Phase 8 §3.1 — letter-spacing / tracking. */
  tracking: {
    /** Prose — no tracking adjustment. */
    prose: '0em',
    /** Meta line. */
    meta: '0.02em',
    /** Tier word inline. */
    tierWord: '0.04em',
    /** Section labels (uppercase). */
    sectionLabel: '0.08em',
    /** Pill inline. */
    pill: '0.01em',
  },
  /**
   * Phase 8 §3.1 — hard max line length for prose containers.
   * 68ch prevents line lengths from drifting past the 75ch readability cliff
   * at wider viewports / user font-size overrides.
   */
  maxProseCh: 68,
  /** Phase 8 §2.6 — horizontal padding inside the panel (content inset). */
  panelPaddingX: '24px',
  /** Phase 8 §3.1 — top padding inside the panel. */
  panelPaddingTop: '20px',
  /** Phase 8 §3.1 — bottom padding (extra for scroll comfort). */
  panelPaddingBottom: '32px',
} as const;

// ---------------------------------------------------------------------------
// Glass morphism
// ---------------------------------------------------------------------------

/**
 * Glass morphism surface tokens.
 * UX_PLAN §14 Design Language — inherited from VaporChatMessage aesthetic.
 * Phase 8 §3.1 pins the exact panel glass values.
 */
export const GLASS = {
  /**
   * Phase 8 §3.1 — right detail panel (the primary glass surface).
   *   background: `oklch(0.97 0.01 240 / 0.92)` translated to an rgba
   *     fallback that preserves the near-white tint + 92% opacity.
   *   backdropFilter: `blur(18px) saturate(1.4)`
   */
  panel: {
    background: 'rgba(248, 249, 251, 0.92)',
    border: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(18px) saturate(1.4)',
  },
  /**
   * UX_PLAN §14 — toolbar uses a lighter blur than the panel (blur-md),
   * slightly higher opacity so it reads as structural chrome.
   */
  toolbar: {
    background: 'rgba(250, 251, 253, 0.85)',
    border: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(12px) saturate(1.2)',
  },
  /**
   * UX_PLAN §14 — hover tooltip. Smaller, tighter glass with soft shadow
   * layered on top (shadow is applied by the component, not the token).
   */
  tooltip: {
    background: 'rgba(255, 255, 255, 0.90)',
    border: 'rgba(255, 255, 255, 0.50)',
    backdropFilter: 'blur(10px) saturate(1.3)',
  },
  /**
   * Phase 4 §2.7(b) failure modal / Phase 7 soft-modal pattern.
   * Heavier blur to fully separate from the editor behind it.
   */
  modal: {
    background: 'rgba(255, 255, 255, 0.80)',
    border: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(24px) saturate(1.5)',
  },
} as const;

// ---------------------------------------------------------------------------
// Z-layers
// ---------------------------------------------------------------------------

/**
 * Stacking layer tokens. Every fixed / absolute surface reads its z-index
 * from here. Increments of 10 leave room for in-between layers without
 * token churn.
 * Phase 7 §2 + UX_PLAN §7 layout architecture.
 */
export const Z_LAYER = {
  /** Base editor surface. Paragraph tints, sentence underlines, gutter. */
  editor: 10,
  /** Right detail panel (glass). Sits above the editor. */
  panel: 20,
  /** Phase 7 hover tooltip — above editor, below hints/toasts. */
  tooltip: 30,
  /** Phase 6 orientation chips and keyboard hints. */
  hint: 40,
  /** Phase 4 interception toast / Phase 5 "Analysis canceled" toast. */
  toast: 50,
  /** Phase 4 failure / rate-limit / cancel-confirm modals. Topmost UI chrome. */
  modal: 60,
} as const;

export type ZLayerName = keyof typeof Z_LAYER;
