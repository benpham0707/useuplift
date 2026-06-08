// Workstream L — `EssayProfile` and friends.
//
// This is the top-level contract every UI workstream in Waves β and γ
// consumes. Shapes are derived from:
//   - docs/ANNOTATION_V2_BUILD_PLAN.md (Profile shape section)
//   - docs/ux_phases/phase_5_first_reveal.md §2.3 (OverviewCard),
//     §6 (copy deck)
//   - docs/ux_phases/phase_8_reading_insight.md §6.1 (L5 schema),
//     §2.9 (cross-reference pills)
//   - docs/ux_phases/phase_9_rewrite_suggestion.md §6.1 (rewrite block)
//   - docs/ux_phases/phase_10_navigation.md §6.1 (queue/centrality)
//
// These types are intentionally stand-alone — they are NOT extended from
// or imported into `src/services/essayIntelligence/`. The demo is fully
// mocked (see `ANNOTATION_V2_BUILD_PLAN.md` §Scope) and the Round-1
// integration renames, not re-wires.
//
// Everything the UI treats as static-during-a-session is marked
// `readonly`. Interactive state (viewedAt, filters, etc.) lives in
// `./navigation.ts` and is intentionally mutable.

import type { Tier } from './tier';

// ---------------------------------------------------------------------------
// Paragraph — structural frame for sentences.
// ---------------------------------------------------------------------------

/**
 * Paragraph role. Phase 5 §6 copy deck entries 20–23 enumerate the
 * visible labels ("HOOK", "BUILDUP", "FULCRUM", "RESOLUTION"); §6 #24
 * specifies that a missing role is silent, never rendered as "UNKNOWN".
 * `'CLOSING'` was added during spec walkthrough to handle the final
 * paragraph of essays that don't converge into a classic RESOLUTION.
 */
export type ParagraphRole =
  | 'HOOK'
  | 'BUILDUP'
  | 'FULCRUM'
  | 'RESOLUTION'
  | 'CLOSING';

export interface Paragraph {
  /** Zero-based paragraph index. `p{N+1}` in student-facing strings. */
  readonly index: number;

  /** Full paragraph text; authoritative source of sentence offsets. */
  readonly text: string;

  /** Narrative role — shown in left gutter per Phase 5 §2.8. */
  readonly role: ParagraphRole;

  /**
   * Paragraph-level contribution to the essay's arc, 0.0–1.0.
   * Used by List View (Phase 11) to weight rows within a paragraph
   * and by Navigation (Phase 10) centrality scoring.
   */
  readonly structuralWeight: number;

  /**
   * Tier tint applied to the paragraph background.
   * Phase 4 §2.2 pre-blooms this at L3.5; Phase 5 §2.1 step 1 deepens
   * saturation from 40% → 55% at reveal start.
   */
  readonly paragraphTintTier: Tier;
}

// ---------------------------------------------------------------------------
// Understanding (L3) — descriptive, pre-judgment observations.
// ---------------------------------------------------------------------------

/**
 * L3 sentence-level understanding. This is what the walk captures —
 * "what is this sentence doing" without any "how well is it doing it"
 * verdict. L3.5 (analysis pass) reads this and produces `effectiveness`,
 * `strengths[]`, `weaknesses[]` on `SentenceProfile` below.
 *
 * Arrays are intentionally small (2–4 items realistic). Empty arrays
 * are allowed but signal that the walk found nothing noteworthy at that
 * lens — usually a sign the sentence is purely connective.
 */
export interface Understanding {
  /** What the sentence *does* at the surface level (observed action). */
  readonly observedFunctions: readonly string[];

  /** Why the writer likely chose this sentence, inferred from context. */
  readonly inferredIntents: readonly string[];

  /** How this sentence contributes to the essay's arc (L2.5 hook-in). */
  readonly narrativeContributions: readonly string[];

  /** Craft-level details — diction, rhythm, image, syntax. */
  readonly craftDetails: readonly string[];

  /** Notable authorial choices (a verb tense shift, an unexpected image). */
  readonly significantChoices: readonly string[];
}

// ---------------------------------------------------------------------------
// Cross-reference — the bridge between annotations across paragraphs.
// ---------------------------------------------------------------------------

/**
 * Phase 8 §2.9 — "cross-reference pills" that jump between sentences.
 * Label is the short glyph students see in the panel ("¶4 · s2",
 * "¶3 · closer"). Direction tells the renderer which way the arrow
 * glyph tilts in the pill (Phase 8 copy keeps it subtle).
 */
export interface CrossRef {
  readonly id: string;

  /** ID of the sentence this ref points AT. */
  readonly targetSentenceId: string;

  /** Student-facing short label, e.g. "¶1 · s1" or "¶5 · closer". */
  readonly label: string;

  /**
   * `'back'` = the target is earlier in the essay; `'forward'` = later.
   * Useful for visual treatment (Phase 10 §2.9 jump-back breadcrumb).
   */
  readonly direction: 'back' | 'forward';

  /** Short preview for hover tooltip; ≤140 chars per Phase 8 §6.1. */
  readonly preview: string;
}

// ---------------------------------------------------------------------------
// Rewrite suggestion — Phase 9.
// ---------------------------------------------------------------------------

/**
 * Phase 9 §2.1 / §6.1 — one example rewrite per annotation.
 * Phase 9 §2.5 caps variants at 2 for craft, up to 3 for polish; we cap
 * here at 2 (variantCount === 1 | 2) because the demo doesn't need the
 * rarely-used 3 variant path.
 */
export interface RewriteSuggestion {
  readonly id: string;

  /** The alternate prose, 1–3 sentences, plain text. */
  readonly text: string;

  /** Phase 9 §2.7 — how closely the rewrite mirrors student voice. */
  readonly registerMatch: 'high' | 'medium' | 'low';

  /**
   * Phase 9 §2.7 — the single craft dimension the rewrite is meant to
   * demonstrate (e.g. "specificity", "rhythm", "embodiment"). This is
   * what the rewrite diverges on — hence "divergence".
   */
  readonly divergenceDimension: string;

  /** Phase 9 §2.5 — how many alternate variants exist. */
  readonly variantCount: 1 | 2;

  /** Second variant text when variantCount === 2. */
  readonly secondVariantText?: string;

  /**
   * Phase 9 §4.3 — tier-specific framing copy.
   *   CRITICAL / NEEDS_WORK → "one way a writer might handle this"
   *   STRONG (rare)         → "a slightly tighter version"
   */
  readonly sectionHeader: 'one_way_a_writer_might_handle_this' | 'a_slightly_tighter_version';
}

// ---------------------------------------------------------------------------
// Annotation (L5) — teaching feedback on a single sentence.
// ---------------------------------------------------------------------------

/**
 * Phase 8 §2.2 — four semantic categories of insight.
 * UI renders these as a single subtle text label in the meta line;
 * they do NOT get colored badges (Phase 8 §2.2 rationale).
 */
export type AnnotationType = 'growth' | 'strength' | 'structural' | 'teaching';

/**
 * Phase 8 §2.8 — 0 = highest priority; we keep a bounded enum because
 * L5 is pre-sorted server-side (§6.1.8) and UI trusts the ordering.
 */
export type AnnotationPriority = 0 | 1 | 2 | 3 | 4 | 5;

export interface Annotation {
  readonly id: string;

  /** `p{N}s{M}` — must match a `SentenceProfile.id`. */
  readonly sentenceId: string;

  readonly type: AnnotationType;

  /** Higher priority number = LOWER impact per Phase 8 §2.8 ordering. */
  readonly priority: AnnotationPriority;

  /**
   * Phase 8 §2.3 — 2–4 sentences, must quote the student's text.
   * Rendered as prose; no markdown, no bullets.
   */
  readonly critique: string;

  /**
   * Phase 8 §2.4 — exactly one sentence (validated server-side).
   * Ties the critique to the North Star or to structural significance.
   */
  readonly whyItMatters: string;

  /**
   * Phase 8 §2.5 — **non-empty**, always. 1–2 specific observations.
   * CRITICAL-tier sentences still get strengths; that's the rule.
   * If L5 can't find a specific strength, the annotation is promoted
   * to `type: 'structural'` at paragraph scope (which we don't model
   * in this demo — the fixture respects the invariant).
   */
  readonly strengths: readonly string[];

  /**
   * Phase 9 §2.6 — tier rule:
   *   CRITICAL / NEEDS_WORK → almost always present
   *   STRONG                → rare (section header shifts)
   *   EXCEPTIONAL / MASTERFUL → omit (there's nothing to rewrite)
   */
  readonly rewrite?: RewriteSuggestion;

  /** Phase 8 §2.9 — 0–3 cross-refs; rendered as click-commit pills. */
  readonly crossRefs: readonly CrossRef[];
}

// ---------------------------------------------------------------------------
// Sentence profile — the atomic unit of the editor surface.
// ---------------------------------------------------------------------------

export interface SentenceProfile {
  /** `p{paragraphIndex}s{indexWithinParagraph}` — deterministic. */
  readonly id: string;

  readonly paragraphIndex: number;
  readonly indexWithinParagraph: number;

  /** Exact substring of the essay; renderer trusts this for offsets. */
  readonly text: string;

  /**
   * Character offsets **within the containing paragraph**, not the
   * whole essay. Downstream TipTap decorations translate these into
   * ProseMirror positions at decoration-plugin init time.
   */
  readonly startOffset: number;
  readonly endOffset: number;

  /** L3.5 classification — drives underline + panel tier word. */
  readonly tier: Tier;

  /** L3.5 effectiveness, 0–100. Used for auto-selection (Phase 5 §2.6). */
  readonly effectiveness: number;

  /** L3 descriptive understanding — pre-judgment. */
  readonly understanding: Understanding;

  /** L3.5 — 0–3 specific things that work in this sentence. */
  readonly strengths: readonly string[];

  /** L3.5 — 0–3 specific weaknesses. Empty on FUNCTIONAL/STRONG+. */
  readonly weaknesses: readonly string[];

  /** IDs into `EssayProfile.annotations`; may be empty for FUNCTIONAL. */
  readonly annotationIds: readonly string[];

  /**
   * Sentence IDs that reference THIS sentence via a cross-ref.
   * Phase 10 §7 centrality weight — higher inbound count = higher
   * priority in smart-ordered nav.
   */
  readonly inboundRefs: readonly string[];
}

// ---------------------------------------------------------------------------
// Holistic synthesis (L3.75) — essay-level voice + theme snapshot.
// ---------------------------------------------------------------------------

/**
 * The seven holistic lenses specified in docs/specs/PLAN.md §Essay Intelligence V2
 * (L3.75). Each lens is a short prose paragraph rendered in the Profile
 * tab (Phase 8 §Profile card — implementation lives in ProfileCard.tsx
 * under Workstream F).
 *
 * `strongestDimension` and `weakestDimension` are string labels, not
 * enum values — they are LLM-authored phrases that become the right-
 * panel header narrative (Phase 5 §6 templates #8–11 substitute them).
 */
export interface HolisticSynthesis {
  readonly voiceIdentity: string;
  readonly emotionalTopography: string;
  readonly thematicArchitecture: string;
  readonly narrativeStrategy: string;
  readonly characterRevelation: string;
  readonly craftAssessment: string;
  readonly admissionsPositioning: string;

  /** e.g. "voice" — used by header-narrative template resolver. */
  readonly strongestDimension: string;
  /** e.g. "opening specificity" — used to fill the "now let's…" clause. */
  readonly weakestDimension: string;
}

// ---------------------------------------------------------------------------
// North Star (L4) — essay-level through-line + structural claim.
// ---------------------------------------------------------------------------

/**
 * Phase 8 §6.1 — the single theme phrase reused inline as italic
 * pull-forward copy in the "Why it matters" body. Structural roles
 * here are the expected-role-per-paragraph list produced by L4; the
 * UI compares to each paragraph's actual role to surface "role
 * mismatch" structural insights.
 */
export interface NorthStar {
  /** One-sentence articulation of what this essay is about. */
  readonly throughLine: string;

  /** Short italic-highlight phrase, e.g. "rebuilding after loss". */
  readonly themePhrase: string;

  /** Expected role per paragraph index, parallel to `paragraphs`. */
  readonly structuralRoles: readonly ParagraphRole[];

  /** What makes this essay distinctive vs. the median applicant pool. */
  readonly distinctiveness: string;
}

// ---------------------------------------------------------------------------
// Improvement phase — the progressive-precision filter.
// ---------------------------------------------------------------------------

/**
 * Phase 5 §6 #3, Phase 8 §6.1. Drives density rules (Phase 5 §2.4),
 * rewrite visibility (Phase 9 §2.6), and feedback zoom level
 * (conversator coaching, outside Phase 11 scope).
 */
export type ImprovementPhase =
  | 'Foundation'
  | 'Architecture'
  | 'Craft'
  | 'Polish'
  | 'Distinction';

// ---------------------------------------------------------------------------
// Overview card data — Phase 5 §2.3.
// ---------------------------------------------------------------------------

/**
 * Phase 5 §2.3 — the panel's first content at reveal. Strongest moment
 * is named FIRST because the anchoring effect carries through the
 * subsequent tier-underline bloom.
 */
export interface SentencePullQuote {
  readonly sentenceId: string;
  readonly quote: string;
  readonly paragraphIndex: number;
  readonly indexWithinParagraph: number;
  readonly tier: Tier;
}

export interface OverviewData {
  /** Displayed as "Your essay has N paragraphs" — never shown raw. */
  readonly paragraphCount: number;

  /** Phase 5 §6 #2 — the "Your strongest moment" pull-quote. */
  readonly strongestMoment: SentencePullQuote;

  /**
   * Phase 5 §6 #4 — a single forward-looking direction, one sentence.
   * NOT a list. NOT "N issues". "4 things to try" is a separate
   * rendering concern (the list lives in `topThingsToTry` below).
   */
  readonly mostImportantNext: string;

  readonly improvementPhase: ImprovementPhase;

  /**
   * Phase 5 §6 #8–13 — the one-line curator's note that glows into
   * the toolbar. Template is already resolved server-side; the UI
   * just displays it.
   */
  readonly headerNarrative: string;

  /**
   * Phase 5 §2.3 — overview card's "N things to try" list.
   * Capped at 4; each entry references a sentence + short label.
   */
  readonly topThingsToTry: readonly {
    readonly sentenceId: string;
    readonly label: string;
    readonly priority: AnnotationPriority;
  }[];
}

// ---------------------------------------------------------------------------
// EssayProfile — the top-level contract.
// ---------------------------------------------------------------------------

export interface EssayProfile {
  readonly essayId: string;

  /** Full essay text. Derivable from paragraphs but cached for TipTap. */
  readonly essayText: string;

  readonly paragraphs: readonly Paragraph[];
  readonly sentences: readonly SentenceProfile[];

  readonly holisticSynthesis: HolisticSynthesis;
  readonly northStar: NorthStar;
  readonly annotations: readonly Annotation[];

  /** Drives phase-gated density (Phase 5 §5, Phase 9 §2.6). */
  readonly improvementPhase: ImprovementPhase;

  /** Panel's first-reveal content (Phase 5 §2.3). */
  readonly overview: OverviewData;
}
