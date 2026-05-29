/**
 * InsightCard — Workstream F core. Phase 8 §2 the teaching card.
 *
 * This is the product. Phase 8 §2.1: the card has an invariant shape,
 * the shape is a contract, the contract is the teaching. No tier- or
 * phase-conditional reordering. Every annotation — CRITICAL, FUNCTIONAL,
 * MASTERFUL — renders the same five sections in the same order:
 *
 *   1. Meta line        ¶N · sentence M · TIER
 *      + InsightTypeBadge  (neutral pill, no tier color — §2.2)
 *   2. Critique         2–4 sentences serif prose (§2.3)
 *   3. Why it matters   single sentence (§2.4)
 *   4. What's working   1–3 strength lines, always present (§2.5)
 *   5. Rewrite          optional, phase-gated; RewriteCard owns it (§2.1)
 *
 * Cross-references from `annotation.crossRefs[]` render inline as
 * <CrossRefPill> where the critique OR why-body contains a `{¶N}` or
 * `{¶Ns M}` inline token; references without an inline token fall
 * through to a "Related:" row at the bottom of the card (§2.9 rejected
 * "cross-reference section at the bottom" for references that DID
 * motivate a specific sentence; our fallback only fires when the L5
 * output didn't bake the token in. This is a tolerance for mocked
 * fixtures, not a spec deviation — the real pipeline should always
 * embed the token in prose).
 *
 * Multiple annotations per sentence — Phase 8 §2.8:
 *   - Highest-priority (lowest `priority` number) opens in full.
 *   - A disclosure row `N more on this sentence ›` appears below with
 *     tier-dot previews.
 *   - On click, the other annotations expand in a ranked list, each as
 *     a collapsible row; only one is ever fully expanded at a time.
 *
 * Dwell tracking — Phase 10 §6.2 / Phase 8 §2.10:
 *   - useInsightDwell starts a 1200ms timer on sentence change and
 *     fires `onMarkRead(sentenceId)` once per distinct sentence.
 *
 * Typography & color — Phase 8 §3.1:
 *   - Every size/weight/tracking comes from `TYPOGRAPHY` in tokens.ts.
 *   - Tier word color goes through `hsl(var(--anno-<tier>))` via
 *     TIER_CSS_VAR so the theme-time palette stays the source of
 *     truth.
 *   - No horizontal rules, no background fills, no colored left-
 *     borders between sections — Phase 8 §2.6 "the shape teaches
 *     itself through rhythm".
 */

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
  DURATION,
  EASING,
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '../tokens';
import type {
  Annotation,
  CrossRef,
  SentenceProfile,
} from '../types/profile';
import { CrossRefPill } from './CrossRefPill';
import { InsightTypeBadge } from './InsightTypeBadge';
import { RewriteCard } from './RewriteCard';
import { useInsightDwell } from './useInsightDwell';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InsightCardProps {
  readonly annotation: Annotation;
  readonly sentence: SentenceProfile;
  readonly paragraphIndex: number; // 0-based; display as +1
  /**
   * All annotations on the essay — we filter for same-sentence peers
   * here. Phase 8 §2.8 routes secondary annotations through the same
   * InsightCard to preserve the one-card-shape rule.
   */
  readonly allAnnotations: readonly Annotation[];
  /**
   * Resolver used by CrossRefPill to paint the tier dot/ring from the
   * TARGET sentence's tier. Passing a function keeps this component
   * decoupled from the full `EssayProfile` — callers typically bind
   * `id => profile.sentences.find(s => s.id === id)?.tier`.
   */
  readonly resolveTargetTier: (targetSentenceId: string) => Tier;
  /** Jump-to-sentence handler — wires into the navStack push. */
  readonly onCrossRef?: (targetSentenceId: string) => void;
  /** Dwell callback; fired once per distinct sentenceId. */
  readonly onMarkRead?: (sentenceId: string) => void;
  readonly reducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Inline-token parser — splits critique / why-body prose at `{¶N}` or
// `{¶Ns M}` placeholders so we can inject CrossRefPills in line with
// serif prose (Phase 8 §2.9 — "cross-references within critique or
// why-it-matters prose render as inline pill-style jump links").
// ---------------------------------------------------------------------------

type TokenChunk =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'pill'; readonly token: string };

const TOKEN_RE = /\{(¶\d+(?:\s*·\s*s\d+|\s*s\d+)?)\}/g;

function tokenize(text: string): TokenChunk[] {
  const chunks: TokenChunk[] = [];
  let cursor = 0;
  // Defensive: reset lastIndex so re-entry is deterministic.
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > cursor) {
      chunks.push({ kind: 'text', text: text.slice(cursor, match.index) });
    }
    chunks.push({ kind: 'pill', token: match[1]! });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    chunks.push({ kind: 'text', text: text.slice(cursor) });
  }
  return chunks;
}

/**
 * Try to match a token like `¶3` or `¶3 · s4` to one of the cross-refs
 * on this annotation. Normalization strips whitespace + middle-dot so
 * authored variance ("¶3s4", "¶3 · s4", "¶3 s4") all resolve the same.
 */
function normaliseTokenLike(s: string): string {
  return s.replace(/[\s·]+/g, '').toLowerCase();
}

function matchCrossRef(
  token: string,
  crossRefs: readonly CrossRef[],
): CrossRef | null {
  const needle = normaliseTokenLike(token);
  return (
    crossRefs.find((xr) => normaliseTokenLike(xr.label) === needle) ?? null
  );
}

// ---------------------------------------------------------------------------
// Prose renderer — splices pills into serif text.
// ---------------------------------------------------------------------------

interface ProseWithPillsProps {
  readonly text: string;
  readonly crossRefs: readonly CrossRef[];
  readonly resolveTargetTier: InsightCardProps['resolveTargetTier'];
  readonly onCrossRef?: (targetSentenceId: string) => void;
  readonly reducedMotion: boolean;
  readonly style: React.CSSProperties;
}

function ProseWithPills({
  text,
  crossRefs,
  resolveTargetTier,
  onCrossRef,
  reducedMotion,
  style,
}: ProseWithPillsProps): JSX.Element {
  const chunks = useMemo(() => tokenize(text), [text]);

  return (
    <p style={style}>
      {chunks.map((chunk, i) => {
        if (chunk.kind === 'text') {
          return <span key={i}>{chunk.text}</span>;
        }
        const xr = matchCrossRef(chunk.token, crossRefs);
        if (!xr) {
          // Unmatched token — fall back to bare glyph (never render the
          // raw curly braces to the student).
          return <span key={i}>{chunk.token}</span>;
        }
        return (
          <CrossRefPill
            key={i}
            crossRef={xr}
            targetTier={resolveTargetTier(xr.targetSentenceId)}
            onClick={(targetId) => onCrossRef?.(targetId)}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </p>
  );
}

/**
 * Pre-scan critique + why-body text for `{¶N}` tokens and compute
 * which crossRef ids will be consumed inline. The rendered prose
 * re-tokenises the same strings, but keeping this as a pure pre-scan
 * keeps the "Related:" fallback calculation free of render-time
 * mutation and safe for React StrictMode double-invocation.
 */
function computeInlineCrossRefIds(
  crossRefs: readonly CrossRef[],
  ...texts: readonly string[]
): ReadonlySet<string> {
  const used = new Set<string>();
  for (const text of texts) {
    for (const chunk of tokenize(text)) {
      if (chunk.kind !== 'pill') continue;
      const xr = matchCrossRef(chunk.token, crossRefs);
      if (xr) used.add(xr.id);
    }
  }
  return used;
}

// ---------------------------------------------------------------------------
// Section label — `WHY IT MATTERS` / `WHAT'S WORKING` / `RELATED`
// Phase 8 §3.1 — 11px sans semibold uppercase, tracked.
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { readonly children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.sectionLabel,
        fontWeight: TYPOGRAPHY.weight.semibold,
        lineHeight: TYPOGRAPHY.lineHeight.sansTight,
        letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
        textTransform: 'uppercase',
        color: 'hsl(220 20% 40%)',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta line — ¶N · sentence M · TIER with optional InsightTypeBadge.
// Phase 8 §3.1 + §2.2.
// ---------------------------------------------------------------------------

interface MetaLineProps {
  readonly paragraphNumber: number;
  readonly sentenceNumber: number;
  readonly tier: Tier;
  readonly type: Annotation['type'];
}

function MetaLine({ paragraphNumber, sentenceNumber, tier, type }: MetaLineProps) {
  const tierCssVar = TIER_CSS_VAR[tier];
  const tierLabel = TIER_META[tier].label;
  const tierColor =
    tier === 'FUNCTIONAL'
      ? `hsl(var(${tierCssVar}) / 0.70)` // §3.1 sage dimmed
      : `hsl(var(${tierCssVar}))`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.meta,
        fontWeight: TYPOGRAPHY.weight.medium,
        lineHeight: TYPOGRAPHY.lineHeight.sansTight,
        letterSpacing: TYPOGRAPHY.tracking.meta,
        color: 'hsl(220 15% 45%)',
      }}
    >
      <span
        // The meta line itself — ¶N · sentence M · TIER
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span>{`\u00B6${paragraphNumber}`}</span>
        <span style={{ opacity: 0.5 }}>{'\u00B7'}</span>
        <span>{`sentence ${sentenceNumber}`}</span>
        <span style={{ opacity: 0.5 }}>{'\u00B7'}</span>
        <span
          style={{
            color: tierColor,
            fontWeight: TYPOGRAPHY.weight.semibold,
            letterSpacing: TYPOGRAPHY.tracking.tierWord,
            textTransform: 'uppercase',
          }}
        >
          {tierLabel}
        </span>
      </span>
      {/* Phase 8 §2.2 — hide the badge when type is `growth` (default
          category). Surfacing `Growth` in the meta line would add
          visual weight for zero teaching value. */}
      {type !== 'growth' ? <InsightTypeBadge type={type} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollapsedStackRow — meta-line-only preview for secondary annotations
// Phase 8 §2.8 stack view.
// ---------------------------------------------------------------------------

interface CollapsedStackRowProps {
  readonly annotation: Annotation;
  readonly sentence: SentenceProfile;
  readonly onExpand: () => void;
  readonly isPrimary: boolean;
}

function CollapsedStackRow({
  annotation,
  sentence,
  onExpand,
  isPrimary,
}: CollapsedStackRowProps) {
  const tierCssVar = TIER_CSS_VAR[sentence.tier];
  const tierColor =
    sentence.tier === 'FUNCTIONAL'
      ? `hsl(var(${tierCssVar}) / 0.70)`
      : `hsl(var(${tierCssVar}))`;
  // Phase 8 §2.8 "meta line only (tier word + first 8 words of
  // critique + tier dot)" for collapsed rows.
  const previewWords = annotation.critique.split(/\s+/).slice(0, 8).join(' ');
  const tierLabel = TIER_META[sentence.tier].label;
  return (
    <button
      type="button"
      onClick={onExpand}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid hsl(220 15% 90%)',
        background: isPrimary ? 'hsl(220 15% 97% / 0.7)' : 'white',
        cursor: 'pointer',
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.meta,
        color: 'hsl(220 15% 35%)',
        lineHeight: TYPOGRAPHY.lineHeight.sans,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: tierColor,
          flex: '0 0 auto',
        }}
      />
      <span
        style={{
          fontWeight: TYPOGRAPHY.weight.semibold,
          letterSpacing: TYPOGRAPHY.tracking.tierWord,
          color: tierColor,
          textTransform: 'uppercase',
        }}
      >
        {tierLabel}
      </span>
      <span
        style={{
          opacity: 0.85,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        {previewWords}
        {annotation.critique.split(/\s+/).length > 8 ? '…' : ''}
      </span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>
        {'\u203A'}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// DisclosureRow — "N more on this sentence ›" with tier-dot preview
// Phase 8 §2.8.
// ---------------------------------------------------------------------------

interface DisclosureRowProps {
  readonly peers: readonly Annotation[];
  readonly tierBySentenceId: (id: string) => Tier;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

function DisclosureRow({
  peers,
  tierBySentenceId,
  expanded,
  onToggle,
}: DisclosureRowProps) {
  const count = peers.length;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid hsl(220 15% 90%)',
        background: 'hsl(220 15% 98% / 0.6)',
        cursor: 'pointer',
        fontFamily: TYPOGRAPHY.families.sans,
        fontSize: TYPOGRAPHY.size.meta,
        color: 'hsl(220 15% 40%)',
        textAlign: 'left',
        lineHeight: TYPOGRAPHY.lineHeight.sans,
      }}
    >
      <span>
        {count} more on this sentence
      </span>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          gap: 4,
          alignItems: 'center',
          marginLeft: 'auto',
        }}
      >
        {peers.map((peer) => {
          const tierVar = TIER_CSS_VAR[tierBySentenceId(peer.sentenceId)];
          return (
            <span
              key={peer.id}
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: `hsl(var(${tierVar}))`,
              }}
            />
          );
        })}
      </span>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          opacity: 0.55,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 140ms ease-out',
        }}
      >
        {'\u203A'}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Single-annotation body — the invariant six-section shape.
// Extracted so the disclosure stack can reuse it for whichever peer is
// currently "fully expanded".
// ---------------------------------------------------------------------------

interface AnnotationBodyProps {
  readonly annotation: Annotation;
  readonly sentence: SentenceProfile;
  readonly paragraphNumber: number;
  readonly sentenceNumber: number;
  readonly resolveTargetTier: InsightCardProps['resolveTargetTier'];
  readonly onCrossRef?: (targetSentenceId: string) => void;
  readonly reducedMotion: boolean;
}

function AnnotationBody({
  annotation,
  sentence,
  paragraphNumber,
  sentenceNumber,
  resolveTargetTier,
  onCrossRef,
  reducedMotion,
}: AnnotationBodyProps): JSX.Element {
  // Pre-scan critique + why-body to figure out which cross-refs will
  // render inline. The "Related:" fallback surfaces only the leftover.
  // Pre-scan keeps the render pure — no mid-render mutation.
  const usedCrossRefIds = useMemo(
    () =>
      computeInlineCrossRefIds(
        annotation.crossRefs,
        annotation.critique,
        annotation.whyItMatters,
      ),
    [annotation.crossRefs, annotation.critique, annotation.whyItMatters],
  );

  // Phase 8 §2.6 — prose container enforces the 68ch cap.
  const proseMaxStyle: React.CSSProperties = {
    maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
  };

  // Phase 8 §3.1 — critique body.
  const critiqueStyle: React.CSSProperties = {
    ...proseMaxStyle,
    margin: 0,
    fontFamily: TYPOGRAPHY.families.serif,
    fontSize: TYPOGRAPHY.size.critique,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.serifProse,
    letterSpacing: TYPOGRAPHY.tracking.prose,
    color: 'oklch(0.22 0.02 240)',
  };

  // Phase 8 §3.1 — why-body (same size/weight, slightly muted color per
  // the §2.4 visual rhythm; §3.1's color table keeps prose dark but the
  // spec body text notes "slightly muted color, italic serif" to signal
  // subordination. We render italic + the §3.1 `color.meta` tone as
  // the muted variant.)
  const whyBodyStyle: React.CSSProperties = {
    ...proseMaxStyle,
    margin: 0,
    fontFamily: TYPOGRAPHY.families.serif,
    fontSize: TYPOGRAPHY.size.whyBody,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.serifProse,
    letterSpacing: TYPOGRAPHY.tracking.prose,
    color: 'oklch(0.30 0.02 240)',
    fontStyle: 'italic',
  };

  // Phase 8 §3.1 — strength line: 14px serif, 1.5 line-height.
  const strengthLineStyle: React.CSSProperties = {
    ...proseMaxStyle,
    margin: 0,
    fontFamily: TYPOGRAPHY.families.serif,
    fontSize: TYPOGRAPHY.size.strengthLine,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.serifStrength,
    letterSpacing: TYPOGRAPHY.tracking.prose,
    color: 'oklch(0.22 0.02 240)',
    paddingLeft: 14,
    position: 'relative',
  };

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              duration: DURATION.contentCrossfade / 1000,
              ease: EASING.contentCrossfade,
            }
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        // §2.6 spacing table — rhythm via whitespace, no rules.
        // metaToCritique 16px.
        gap: 0,
      }}
    >
      {/* 1. Meta line + type badge (§2.1 + §2.2). */}
      <MetaLine
        paragraphNumber={paragraphNumber}
        sentenceNumber={sentenceNumber}
        tier={sentence.tier}
        type={annotation.type}
      />

      {/* 2. Critique (§2.3). */}
      <div style={{ marginTop: 16 }}>
        <ProseWithPills
          text={annotation.critique}
          crossRefs={annotation.crossRefs}
          resolveTargetTier={resolveTargetTier}
          onCrossRef={onCrossRef}
          reducedMotion={reducedMotion}
          style={critiqueStyle}
        />
      </div>

      {/* 3. Why it matters (§2.4). */}
      <div style={{ marginTop: 20 }}>
        <SectionLabel>Why it matters</SectionLabel>
        <ProseWithPills
          text={annotation.whyItMatters}
          crossRefs={annotation.crossRefs}
          resolveTargetTier={resolveTargetTier}
          onCrossRef={onCrossRef}
          reducedMotion={reducedMotion}
          style={whyBodyStyle}
        />
      </div>

      {/* 4. Strengths (§2.5) — always present. */}
      {annotation.strengths.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <SectionLabel>What's working</SectionLabel>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {annotation.strengths.map((line, i) => (
              <li key={i} style={strengthLineStyle}>
                {/* Phase 8 §2.5 — no actual bullet char; a subtle dot at
                    the line's leading edge signals the list-item. */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.55em',
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: 'hsl(220 15% 55%)',
                  }}
                />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 5. Rewrite (§2.1 optional; RewriteCard stub is Workstream G's. */}
      <div style={{ marginTop: annotation.rewrite ? 24 : 0 }}>
        <RewriteCard rewrite={annotation.rewrite} />
      </div>

      {/* Cross-ref fallback — any crossRefs not embedded via {¶N} token
          surface here as a "Related:" row. Phase 8 §2.9 calls the
          bottom-of-card "See also" list a REJECTED alternative, but the
          rejection is specifically for cases where the L5 output already
          references the target in prose; our fallback only triggers
          when the authored prose didn't embed the token. In the current
          fixture, every cross-ref surfaces here because the critique
          text doesn't contain `{¶N}` placeholders — so the demo shows
          the fallback prominently. The real pipeline should bake tokens
          into critique/why-body prose and let the inline path fire. */}
      {(() => {
        const leftover = annotation.crossRefs.filter(
          (xr) => !usedCrossRefIds.has(xr.id),
        );
        if (leftover.length === 0) return null;
        return (
          <div style={{ marginTop: 24 }}>
            <SectionLabel>Related</SectionLabel>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
              }}
            >
              {leftover.map((xr) => (
                <CrossRefPill
                  key={xr.id}
                  crossRef={xr}
                  targetTier={resolveTargetTier(xr.targetSentenceId)}
                  onClick={(id) => onCrossRef?.(id)}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// InsightCard — orchestrates primary + secondary annotations.
// ---------------------------------------------------------------------------

export function InsightCard({
  annotation,
  sentence,
  paragraphIndex,
  allAnnotations,
  resolveTargetTier,
  onCrossRef,
  onMarkRead,
  reducedMotion,
}: InsightCardProps): JSX.Element {
  // Phase 8 §2.8 — rank same-sentence annotations by priority (0 first).
  // We include the caller-provided `annotation` in the set so the caller
  // can hand us any one of the peers and we still render the proper
  // primary-first order; the currently-focused annotation below tracks
  // which peer is "fully expanded".
  const peers = useMemo(() => {
    return allAnnotations
      .filter((a) => a.sentenceId === sentence.id)
      .slice()
      .sort((a, b) => a.priority - b.priority);
  }, [allAnnotations, sentence.id]);

  const primary = peers[0] ?? annotation;
  const secondaries = peers.slice(1);

  const [stackExpanded, setStackExpanded] = useState(false);
  const [focusedId, setFocusedId] = useState<string>(primary.id);
  const focusedAnnotation =
    peers.find((a) => a.id === focusedId) ?? primary;

  // Phase 8 §2.10 dwell tracker — marks viewed after 1200ms.
  useInsightDwell({
    sentenceId: sentence.id,
    thresholdMs: 1200,
    onThreshold: (id) => onMarkRead?.(id),
  });

  const paragraphNumber = paragraphIndex + 1;
  const sentenceNumber = sentence.indexWithinParagraph + 1;

  const tierBySentenceIdDefault = (id: string): Tier => {
    // Only used for peer tier-dot previews (they share `sentence.id`),
    // so always return the current sentence's tier.
    if (id === sentence.id) return sentence.tier;
    return resolveTargetTier(id);
  };

  return (
    <section
      aria-label={`Insight for paragraph ${paragraphNumber}, sentence ${sentenceNumber}`}
      style={{
        paddingTop: TYPOGRAPHY.panelPaddingTop,
        paddingLeft: TYPOGRAPHY.panelPaddingX,
        paddingRight: TYPOGRAPHY.panelPaddingX,
        paddingBottom: TYPOGRAPHY.panelPaddingBottom,
        color: 'oklch(0.22 0.02 240)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={focusedAnnotation.id}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: reducedMotion
              ? 0
              : DURATION.contentCrossfade / 1000,
            ease: EASING.contentCrossfade,
          }}
        >
          <AnnotationBody
            annotation={focusedAnnotation}
            sentence={sentence}
            paragraphNumber={paragraphNumber}
            sentenceNumber={sentenceNumber}
            resolveTargetTier={resolveTargetTier}
            onCrossRef={onCrossRef}
            reducedMotion={reducedMotion}
          />
        </motion.div>
      </AnimatePresence>

      {/* Phase 8 §2.8 — disclosure row when there are peers. */}
      {secondaries.length > 0 ? (
        <div style={{ marginTop: 28 }}>
          <DisclosureRow
            peers={secondaries}
            tierBySentenceId={tierBySentenceIdDefault}
            expanded={stackExpanded}
            onToggle={() => setStackExpanded((v) => !v)}
          />

          <AnimatePresence initial={false}>
            {stackExpanded ? (
              <motion.div
                key="stack"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={
                  reducedMotion
                    ? { opacity: 0, height: 0 }
                    : { opacity: 0, height: 0 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.22,
                  ease: EASING.underlineBloom,
                }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {/* Phase 8 §2.8 — each peer gets a collapsed row the
                      student can click to promote into the fully-
                      expanded body. Only one at a time is expanded. */}
                  {peers.map((peer) => (
                    <CollapsedStackRow
                      key={peer.id}
                      annotation={peer}
                      sentence={sentence}
                      isPrimary={peer.id === focusedAnnotation.id}
                      onExpand={() => setFocusedId(peer.id)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </section>
  );
}
