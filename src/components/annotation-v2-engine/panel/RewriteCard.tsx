/**
 * RewriteCard — Workstream G (Wave β Round 3). Phase 9 the whole file.
 *
 * This is the most ethically loaded surface in the product. Every
 * decision here is in service of one sentence: "a rewrite suggestion
 * is a worked example of a move, not a sentence the student is meant
 * to use" (Phase 9 §2.1).
 *
 * What the card does, in order:
 *   1. Renders NOTHING when `rewrite` is undefined (§2.6 tier gate).
 *   2. Collapsed-by-default disclosure row (§2.2) — typographically
 *      SECONDARY to the critique above it.
 *   3. On toggle: expands the rewrite surface with:
 *        - top disclaimer (§2.1)
 *        - example prose inside a pull-quote container (§2.2)
 *        - metadata row: register-match · trades-on dimension (§2.7)
 *        - bottom disclaimer (§4.3 tier-aware)
 *        - action row with Copy-for-reference + Show-as-diff (§2.3/§2.8)
 *        - optional "Another way" secondary disclosure for variantCount=2
 *   4. Copy button uses useClipboardCopy — 4s desktop / 6s mobile.
 *      On commit, the anti-paste toast fires.
 *   5. Show-as-diff renders an inline word-level diff against the
 *      student's original sentence (if provided). Off by default.
 *
 * What the card REFUSES (Phase 9 §7):
 *   - No Apply button.
 *   - No Insert button.
 *   - No one-click copy.
 *   - No auto-focus, no auto-expand, no auto-anything.
 *   - No tier-colored container (category error per §2.2).
 *   - No "AI-assist" labels on student sentences (§2.9).
 *
 * Mobile (§2.10 / §5.4):
 *   - Detected via `window.matchMedia('(max-width: 640px)')`.
 *   - Always collapsed on initial render (we override desktop default).
 *   - Copy delay 6s instead of 4s.
 *   - `Show as diff` removed entirely.
 *   - Disclosure label shortened to "See example".
 *
 * Reduced motion:
 *   - Height animation replaced with instant toggle.
 *   - Progress ring ticks at 500ms intervals instead of rAF.
 *   - Toast fades without slide.
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { DURATION, EASING, TYPOGRAPHY, easingCss } from '../tokens';
import type { RewriteSuggestion } from '../types/profile';
import { CopyDelayToast } from './CopyDelayToast';
import {
  REWRITE_COPY_BUTTON,
  REWRITE_COPY_BUTTON_ARIA,
  REWRITE_DIFF_LABELS,
  REWRITE_DIFF_TOGGLE,
  REWRITE_DISCLAIMERS,
  REWRITE_DIVERGENCE_LABEL,
  REWRITE_HEADERS,
  REWRITE_REGISTER_MATCH,
  REWRITE_TOGGLE,
  REWRITE_TOP_DISCLAIMER,
  REWRITE_VARIANT_HIDE_LABEL,
  REWRITE_VARIANT_LABEL,
} from './rewriteCopy';
import { useClipboardCopy, type CopyStatus } from './useClipboardCopy';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RewriteCardProps {
  /**
   * The rewrite suggestion for this annotation. May be undefined for
   * EXCEPTIONAL / MASTERFUL / FUNCTIONAL tiers (Phase 9 §2.6). When
   * undefined the card renders nothing.
   */
  readonly rewrite?: RewriteSuggestion;
  readonly reducedMotion?: boolean;
  /**
   * Optional — the student's original sentence. When present the
   * `Show as diff` affordance is enabled on desktop. Without this the
   * diff toggle is hidden (we can't diff against nothing).
   */
  readonly originalText?: string;
  /**
   * Telemetry hooks (Phase 9 §6.4 SuggestionInteraction). All optional
   * — this component doesn't care who consumes them. The demo logs
   * them; production wires them to `/api/suggestion-interactions`.
   */
  readonly onExpand?: (open: boolean) => void;
  readonly onCopyStart?: () => void;
  readonly onCopyCommit?: (text: string) => void;
  readonly onCopyCancel?: () => void;
  /**
   * Override mobile detection. When unset we use matchMedia. Demos
   * pass explicit values to simulate a viewport.
   */
  readonly forceMobile?: boolean;
}

// ---------------------------------------------------------------------------
// Mobile detection — identical heuristic to useClipboardCopy, but
// exposed here so the initial-open decision runs synchronously.
// ---------------------------------------------------------------------------

function detectMobileSync(forceMobile: boolean | undefined): boolean {
  if (typeof forceMobile === 'boolean') return forceMobile;
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(max-width: 640px)').matches;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Word-level diff (naive LCS over whitespace tokens).
//
// Phase 9 §2.8 + §3.4 — we render an inline unified diff. Production
// uses the server-computed Myers diff spans on `L5Rewrite.diff`. In
// the demo / mock path we compute client-side using a naive LCS on
// whitespace tokens; the fidelity is sufficient for "visual diff"
// without adding an NPM dep. Spans of size ≤2 are merged with the
// surrounding context per §3.4's min-span-2 heuristic.
// ---------------------------------------------------------------------------

type DiffSpanKind = 'unchanged' | 'added' | 'removed';
interface DiffSpan {
  readonly kind: DiffSpanKind;
  readonly text: string;
}

function tokenize(s: string): string[] {
  // Preserve leading whitespace on each token so rejoining is lossless.
  // Split on word boundaries while keeping separators.
  return s.match(/\S+\s*|\s+/g) ?? [];
}

function wordLcs(a: readonly string[], b: readonly string[]): DiffSpan[] {
  const m = a.length;
  const n = b.length;
  // Dynamic programming table of LCS lengths.
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = (dp[i - 1]![j - 1] ?? 0) + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j] ?? 0, dp[i]![j - 1] ?? 0);
      }
    }
  }
  // Backtrace.
  const out: DiffSpan[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push({ kind: 'unchanged', text: a[i - 1]! });
      i -= 1;
      j -= 1;
    } else if ((dp[i - 1]![j] ?? 0) >= (dp[i]![j - 1] ?? 0)) {
      out.push({ kind: 'removed', text: a[i - 1]! });
      i -= 1;
    } else {
      out.push({ kind: 'added', text: b[j - 1]! });
      j -= 1;
    }
  }
  while (i > 0) {
    out.push({ kind: 'removed', text: a[i - 1]! });
    i -= 1;
  }
  while (j > 0) {
    out.push({ kind: 'added', text: b[j - 1]! });
    j -= 1;
  }
  out.reverse();
  // Merge adjacent spans of same kind so the render is clean.
  const merged: DiffSpan[] = [];
  for (const span of out) {
    const last = merged[merged.length - 1];
    if (last && last.kind === span.kind) {
      merged[merged.length - 1] = { kind: last.kind, text: last.text + span.text };
    } else {
      merged.push(span);
    }
  }
  return merged;
}

function computeDiff(original: string, rewrite: string): DiffSpan[] {
  const a = tokenize(original);
  const b = tokenize(rewrite);
  return wordLcs(a, b);
}

// ---------------------------------------------------------------------------
// Rewrite surface (expanded content) — extracted so the same shape can
// be reused for the "Another way" secondary variant.
// ---------------------------------------------------------------------------

interface RewriteSurfaceProps {
  readonly text: string;
  readonly showDiff: boolean;
  readonly originalText?: string;
  readonly registerMatch: RewriteSuggestion['registerMatch'];
  readonly divergenceDimension: string;
  readonly sectionHeader: RewriteSuggestion['sectionHeader'];
  readonly reducedMotion: boolean;
  readonly isMobile: boolean;
  readonly copyStatus: CopyStatus;
  readonly copyProgress: number;
  readonly copyDelayMs: number;
  readonly onCopyStart: () => void;
  readonly onCopyCancel: () => void;
  readonly onDiffToggle?: () => void;
  readonly isPrimary: boolean;
}

function RewriteSurface({
  text,
  showDiff,
  originalText,
  registerMatch,
  divergenceDimension,
  sectionHeader,
  reducedMotion,
  isMobile,
  copyStatus,
  copyProgress,
  copyDelayMs,
  onCopyStart,
  onCopyCancel,
  onDiffToggle,
  isPrimary,
}: RewriteSurfaceProps): JSX.Element {
  // Phase 9 §2.2 — pull-quote treatment. No card, no background. Just
  // a 1px left border and soft glass fill that reads as "quoted
  // material," not "UI chrome."
  const surfaceStyle: React.CSSProperties = {
    // §2.2 rejects tier-colored containers; we use neutral stone.
    borderLeft: '1px solid hsl(220 15% 85%)',
    // Soft glass fill per Phase 8 §3.1 + task-brief hsl equivalent of
    // `oklch(0.98 0.005 240 / 0.55)`.
    background: 'hsl(220 15% 98% / 0.55)',
    borderRadius: 10,
    padding: '16px 14px 14px 16px',
    boxShadow: 'inset 0 0 0 1px hsl(220 15% 92%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const exampleStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: TYPOGRAPHY.families.serif,
    // §3.2 token — desktop 14px, mobile 15px.
    fontSize: isMobile ? '15px' : '14px',
    fontStyle: 'italic',
    lineHeight: 1.55,
    letterSpacing: TYPOGRAPHY.tracking.prose,
    color: 'hsl(220 20% 28%)',
    maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
    // Phase 9 §2.2 — rewrite body slightly smaller than critique to
    // signal "reference material." Opacity 70% per §3.2 token.
    opacity: 0.92,
  };

  const diffSpans = useMemo(
    () => (showDiff && originalText ? computeDiff(originalText, text) : null),
    [showDiff, originalText, text],
  );

  const registerLabel = REWRITE_REGISTER_MATCH[registerMatch];

  // Copy button derived props.
  const isPreparing = copyStatus === 'preparing';
  const isCopied = copyStatus === 'copied';
  const isError = copyStatus === 'error';
  const copyLabel = (() => {
    if (isPreparing) return REWRITE_COPY_BUTTON.preparing;
    if (isCopied) return REWRITE_COPY_BUTTON.committed;
    if (isError) return REWRITE_COPY_BUTTON.error;
    return isMobile ? REWRITE_COPY_BUTTON.mobileIdle : REWRITE_COPY_BUTTON.idle;
  })();
  const copyAriaLabel = (() => {
    if (isPreparing) return REWRITE_COPY_BUTTON_ARIA.preparing;
    if (isCopied) return REWRITE_COPY_BUTTON_ARIA.committed;
    if (isError) return REWRITE_COPY_BUTTON_ARIA.error;
    return isMobile ? REWRITE_COPY_BUTTON_ARIA.mobileIdle : REWRITE_COPY_BUTTON_ARIA.idle;
  })();

  return (
    <div style={surfaceStyle}>
      {/* Top disclaimer — sits above the example prose as a bumper. */}
      {isPrimary ? (
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.families.serif,
            fontSize: 12,
            fontStyle: 'italic',
            lineHeight: 1.4,
            color: 'hsl(140 10% 42%)', // sage-muted
            letterSpacing: TYPOGRAPHY.tracking.prose,
          }}
        >
          {REWRITE_TOP_DISCLAIMER}
        </p>
      ) : null}

      {/* Example text — prose OR diff. */}
      {diffSpans ? (
        <div style={exampleStyle}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: TYPOGRAPHY.tracking.sectionLabel,
              textTransform: 'uppercase',
              color: 'hsl(220 15% 50%)',
              fontStyle: 'normal',
              marginBottom: 6,
              fontFamily: TYPOGRAPHY.families.sans,
            }}
          >
            {REWRITE_DIFF_LABELS.originalCaption} → {REWRITE_DIFF_LABELS.rewriteCaption}
          </div>
          <div>
            {diffSpans.map((span, i) => {
              if (span.kind === 'unchanged') {
                return <span key={i}>{span.text}</span>;
              }
              if (span.kind === 'removed') {
                return (
                  <span
                    key={i}
                    style={{
                      background: 'rgb(254 242 242)',
                      color: 'rgb(68 64 60)',
                      textDecoration: 'line-through',
                      textDecorationThickness: 1,
                      textDecorationColor: 'rgba(153, 27, 27, 0.5)',
                      padding: '0 2px',
                      borderRadius: 2,
                    }}
                  >
                    {span.text}
                  </span>
                );
              }
              return (
                <span
                  key={i}
                  style={{
                    background: 'rgb(236 253 245)',
                    color: 'rgb(28 25 23)',
                    padding: '0 2px',
                    borderRadius: 2,
                  }}
                >
                  {span.text}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <p style={exampleStyle}>{text}</p>
      )}

      {/* Metadata row — register match · trades on dimension. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'baseline',
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: 11,
          lineHeight: TYPOGRAPHY.lineHeight.sansTight,
          letterSpacing: '0.02em',
          color: 'hsl(220 15% 45%)',
        }}
      >
        <span style={{ fontWeight: 500 }}>{registerLabel}</span>
        <span style={{ opacity: 0.5 }}>{'\u00B7'}</span>
        <span style={{ opacity: 0.85 }}>
          {REWRITE_DIVERGENCE_LABEL}{' '}
          <span style={{ fontWeight: 500, color: 'hsl(220 20% 32%)' }}>
            {divergenceDimension}
          </span>
        </span>
      </div>

      {/* Bottom disclaimer — tier-aware. */}
      {isPrimary ? (
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.families.serif,
            fontSize: 12,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'hsl(220 10% 48%)',
            maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
          }}
        >
          {REWRITE_DISCLAIMERS[sectionHeader]}
        </p>
      ) : null}

      {/* Action row — Copy + (desktop only) Show-as-diff. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        <button
          type="button"
          onClick={isPreparing ? undefined : onCopyStart}
          disabled={isPreparing}
          aria-label={copyAriaLabel}
          style={{
            fontFamily: TYPOGRAPHY.families.sans,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.02em',
            padding: '7px 14px',
            borderRadius: 8,
            border: `1px solid ${
              isError ? 'hsl(0 50% 70%)' : 'hsl(220 20% 82%)'
            }`,
            background: isCopied
              ? 'hsl(150 30% 94%)'
              : isError
                ? 'hsl(0 60% 97%)'
                : 'hsl(220 15% 99%)',
            color: isError ? 'hsl(0 50% 35%)' : 'hsl(220 25% 22%)',
            cursor: isPreparing ? 'progress' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 140ms ease-out, border-color 140ms ease-out',
          }}
        >
          <span>{copyLabel}</span>
          {/* Progress ring appears ONLY during preparing. Phase 9 §2.3
              "the delay is a speedbump, not a countdown" — we keep
              the ring subtle, stroke-only, no numbers. */}
          {isPreparing ? (
            <ProgressRing
              progress={copyProgress}
              reducedMotion={reducedMotion}
            />
          ) : null}
        </button>

        {/* Cancel button surfaces only during preparing. */}
        {isPreparing ? (
          <button
            type="button"
            onClick={onCopyCancel}
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'hsl(220 20% 40%)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {REWRITE_COPY_BUTTON.cancel}
          </button>
        ) : null}

        {/* Phase 9 §2.8 — diff toggle. Desktop only. */}
        {!isMobile && originalText && onDiffToggle ? (
          <button
            type="button"
            onClick={onDiffToggle}
            aria-describedby="rewrite-diff-describe"
            style={{
              fontFamily: TYPOGRAPHY.families.sans,
              fontSize: 12,
              fontWeight: 400,
              padding: '6px 0',
              border: 'none',
              background: 'transparent',
              color: 'hsl(220 20% 42%)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: 3,
              marginLeft: 4,
            }}
          >
            {showDiff
              ? REWRITE_DIFF_TOGGLE.showAsProse
              : REWRITE_DIFF_TOGGLE.showAsDiff}
          </button>
        ) : null}

        {/* Offscreen description — §2.8 help text for screen readers. */}
        <span
          id="rewrite-diff-describe"
          style={{
            position: 'absolute',
            left: -10000,
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          {REWRITE_DIFF_TOGGLE.ariaDescribe}
        </span>
      </div>

      {/* aria-live region — announces the delay so screen readers
          explain the wait. */}
      {isPreparing ? (
        <span
          aria-live="polite"
          style={{
            position: 'absolute',
            left: -10000,
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          {`Preparing copy. Will be available in ${Math.ceil(
            (copyDelayMs * (1 - copyProgress)) / 1000,
          )} seconds.`}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressRing — minimal SVG ring tied to motion value for non-RM.
// On RM we render a static "pip" that advances in 500ms steps.
// ---------------------------------------------------------------------------

function ProgressRing({
  progress,
  reducedMotion,
}: {
  readonly progress: number;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const size = 14;
  const stroke = 1.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  // Reduced motion: render discrete tick marks instead of a smooth
  // progress stroke. Four pips at 25/50/75/100%.
  if (reducedMotion) {
    const filled = Math.floor(progress * 4);
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: 999,
              background:
                i < filled ? 'hsl(220 30% 35%)' : 'hsl(220 15% 82%)',
              transition: 'background 200ms linear',
            }}
          />
        ))}
      </span>
    );
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flex: '0 0 auto' }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(220 15% 88%)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(220 30% 40%)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 120ms linear' }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RewriteCard — the top-level component.
// ---------------------------------------------------------------------------

export function RewriteCard({
  rewrite,
  reducedMotion = false,
  originalText,
  onExpand,
  onCopyStart,
  onCopyCommit,
  onCopyCancel,
  forceMobile,
}: RewriteCardProps): JSX.Element | null {
  // Phase 9 §2.6 — absent rewrite renders nothing.
  if (!rewrite) return null;

  const isMobile = detectMobileSync(forceMobile);

  // Phase 9 §2.2 + §2.10 — collapsed by default (mobile AND desktop).
  // We ALWAYS start collapsed; there is no path to "expand by default"
  // per §2.2 rejected alternatives.
  const [expanded, setExpanded] = useState<boolean>(false);
  const [secondaryExpanded, setSecondaryExpanded] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  // If viewport changes from desktop to mobile while expanded, collapse.
  // This is the simplest handling for responsive transitions; users
  // on a phone cannot be "mid-session" on a desktop-width panel.
  const prevMobileRef = useRef<boolean>(isMobile);
  useEffect(() => {
    if (prevMobileRef.current !== isMobile) {
      prevMobileRef.current = isMobile;
      if (isMobile && expanded) {
        setExpanded(false);
      }
      // Phase 9 §5.4 — diff is removed on mobile.
      if (isMobile && showDiff) setShowDiff(false);
    }
  }, [isMobile, expanded, showDiff]);

  // Copy hook for the primary variant.
  const primaryCopy = useClipboardCopy({
    text: rewrite.text,
    onCommit: (committedText) => {
      setToastVisible(true);
      onCopyCommit?.(committedText);
    },
    onCancel: () => {
      onCopyCancel?.();
    },
    reducedMotion,
  });

  // Copy hook for the secondary variant (when variantCount === 2).
  // We instantiate unconditionally so the hook count is stable across
  // renders; if the variant doesn't exist the hook is simply unused.
  const secondaryCopy = useClipboardCopy({
    text: rewrite.secondVariantText ?? '',
    onCommit: (committedText) => {
      setToastVisible(true);
      onCopyCommit?.(committedText);
    },
    onCancel: () => {
      onCopyCancel?.();
    },
    reducedMotion,
  });

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      onExpand?.(next);
      // When collapsing, also fold any in-flight copy so the student
      // doesn't have a "copy completed" state fire against a closed
      // disclosure. Cancels are safe when status is idle.
      if (!next) {
        primaryCopy.cancelCopy();
        secondaryCopy.cancelCopy();
        setSecondaryExpanded(false);
      }
      return next;
    });
  }, [onExpand, primaryCopy, secondaryCopy]);

  const handlePrimaryCopyStart = useCallback(() => {
    onCopyStart?.();
    primaryCopy.startCopy();
  }, [onCopyStart, primaryCopy]);

  const handleSecondaryCopyStart = useCallback(() => {
    onCopyStart?.();
    secondaryCopy.startCopy();
  }, [onCopyStart, secondaryCopy]);

  const toggleLabels = isMobile ? REWRITE_TOGGLE.mobile : REWRITE_TOGGLE.desktop;
  const toggleLabel = expanded ? toggleLabels.open : toggleLabels.closed;
  const sectionHeaderText = REWRITE_HEADERS[rewrite.sectionHeader];

  return (
    <section
      // Phase 8 §2.6 — 24px margin above the rewrite surface, applied
      // at the insight card site (InsightCard already supplies
      // `marginTop: 24`). We don't add spacing here.
      aria-label="Rewrite example disclosure"
    >
      {/* Disclosure button — §2.2 collapsed state. No border, no
          background, sage-toned, underline-on-hover. */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls="rewrite-disclosure-body"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: 'hsl(140 15% 38%)', // sage-toned per task brief
          background: 'transparent',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
          e.currentTarget.style.textUnderlineOffset = '3px';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {/* Phase 9 §2.2 — descriptive section header sits inline with
            the toggle verb so the disclosure reads as a single line. */}
        <span>{toggleLabel}</span>
        {!expanded ? (
          <span style={{ opacity: 0.55 }}>{'\u00B7'}</span>
        ) : null}
        {!expanded ? (
          <span style={{ fontStyle: 'italic', color: 'hsl(220 15% 45%)' }}>
            {sectionHeaderText}
          </span>
        ) : null}
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            transition: reducedMotion
              ? 'none'
              : `transform ${DURATION.reducedMotionCrossfade}ms ${easingCss(EASING.underlineBloom)}`,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            marginLeft: 2,
            opacity: 0.7,
          }}
        >
          {'\u203A'}
        </span>
      </button>

      {/* Expanded body. Phase 9 §2.2 motion — 220ms height + opacity. */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id="rewrite-disclosure-body"
            key="body"
            initial={
              reducedMotion ? false : { height: 0, opacity: 0 }
            }
            animate={
              reducedMotion
                ? { height: 'auto', opacity: 1 }
                : { height: 'auto', opacity: 1 }
            }
            exit={
              reducedMotion
                ? { height: 0, opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: DURATION.reducedMotionCrossfade / 1000,
                    ease: EASING.underlineBloom,
                  }
            }
            style={{
              overflow: 'hidden',
              marginTop: 10,
            }}
          >
            <RewriteSurface
              text={rewrite.text}
              showDiff={showDiff}
              originalText={originalText}
              registerMatch={rewrite.registerMatch}
              divergenceDimension={rewrite.divergenceDimension}
              sectionHeader={rewrite.sectionHeader}
              reducedMotion={reducedMotion}
              isMobile={isMobile}
              copyStatus={primaryCopy.status}
              copyProgress={primaryCopy.progress}
              copyDelayMs={primaryCopy.delayMs}
              onCopyStart={handlePrimaryCopyStart}
              onCopyCancel={primaryCopy.cancelCopy}
              onDiffToggle={
                originalText
                  ? () => setShowDiff((v) => !v)
                  : undefined
              }
              isPrimary={true}
            />

            {/* Secondary variant — Phase 9 §2.5. Capped at 2. */}
            {rewrite.variantCount === 2 && rewrite.secondVariantText ? (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setSecondaryExpanded((v) => !v)}
                  aria-expanded={secondaryExpanded}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: TYPOGRAPHY.families.sans,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'hsl(140 15% 40%)',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>
                    {secondaryExpanded
                      ? REWRITE_VARIANT_HIDE_LABEL
                      : REWRITE_VARIANT_LABEL}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      opacity: 0.7,
                      transform: secondaryExpanded
                        ? 'rotate(90deg)'
                        : 'rotate(0)',
                      display: 'inline-block',
                      transition: reducedMotion
                        ? 'none'
                        : 'transform 180ms ease-out',
                    }}
                  >
                    {'\u203A'}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {secondaryExpanded ? (
                    <motion.div
                      key="secondary"
                      initial={
                        reducedMotion ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.22,
                              ease: EASING.underlineBloom,
                            }
                      }
                      style={{ overflow: 'hidden', marginTop: 10 }}
                    >
                      <RewriteSurface
                        text={rewrite.secondVariantText}
                        showDiff={false}
                        originalText={undefined}
                        registerMatch={rewrite.registerMatch}
                        divergenceDimension={rewrite.divergenceDimension}
                        sectionHeader={rewrite.sectionHeader}
                        reducedMotion={reducedMotion}
                        isMobile={isMobile}
                        copyStatus={secondaryCopy.status}
                        copyProgress={secondaryCopy.progress}
                        copyDelayMs={secondaryCopy.delayMs}
                        onCopyStart={handleSecondaryCopyStart}
                        onCopyCancel={secondaryCopy.cancelCopy}
                        isPrimary={false}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Anti-paste toast — fires on every commit. */}
      <CopyDelayToast
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        reducedMotion={reducedMotion}
      />
    </section>
  );
}
