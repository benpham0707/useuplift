/**
 * Workstream B demo page — standalone verification of the editor foundation.
 *
 * Route: /annotation-v2-demo/foundation
 *
 * Hardcoded 3-paragraph / 8-sentence / 4-tier fixture. Buttons toggle:
 *   - paragraphTintPhase (hidden / muted40 / deep55)
 *   - underlinePhase (hidden / strengthsWave / criticalWave / full)
 *   - softLocked
 *   - reducedMotion
 *
 * No panel, no overview, no click integration. Sentence click + paragraph
 * click just log to console. This is a visual harness for humans to sanity-
 * check tiers, bloom phases, gutter alignment, and soft-lock treatment before
 * Wave β builds on top.
 */

import { useMemo, useState } from 'react';
import {
  AnnotationEditor,
  type EssayProfile,
  type ParagraphTintPhase,
  type UnderlinePhase,
} from '@/components/annotation-v2/editor';

// ---------------------------------------------------------------------------
// Hardcoded fixture
// ---------------------------------------------------------------------------

// Paragraph text is kept inline so offsets are easy to audit at a glance.
const P0 = 'The diamond wasn\'t just a diamond. For my grandmother, it was a ledger. She counted its worth in meals skipped and winters endured.';
const P1 = 'In that moment, I realized I had been reading value the way she read prices. The stone caught the fluorescent light and fractured it into something closer to testimony than beauty.';
const P2 = 'So I learned to listen for the ledger under every object she handed me. A teacup. A faded coat. A diamond. Each one, a record of what she had refused to lose.';

function sentenceRange(paragraph: string, sentenceText: string): { startOffset: number; endOffset: number } {
  const startOffset = paragraph.indexOf(sentenceText);
  if (startOffset < 0) throw new Error(`Sentence not found in paragraph: ${sentenceText.slice(0, 40)}`);
  return { startOffset, endOffset: startOffset + sentenceText.length };
}

function mkProfile(): EssayProfile {
  // 8 sentences across 4 tiers. Distribution picked to exercise the two-wave
  // bloom: 3 strengths (STRONG/EXCEPTIONAL/MASTERFUL) + 2 issues (CRITICAL/
  // NEEDS_WORK) + 3 functional (invisible by default).
  const s = [
    // P0 — 3 sentences
    { id: 'p0s0', paraIdx: 0, withinIdx: 0, text: 'The diamond wasn\'t just a diamond.', tier: 'STRONG' as const },
    { id: 'p0s1', paraIdx: 0, withinIdx: 1, text: 'For my grandmother, it was a ledger.', tier: 'EXCEPTIONAL' as const },
    { id: 'p0s2', paraIdx: 0, withinIdx: 2, text: 'She counted its worth in meals skipped and winters endured.', tier: 'FUNCTIONAL' as const },
    // P1 — 2 sentences
    { id: 'p1s0', paraIdx: 1, withinIdx: 0, text: 'In that moment, I realized I had been reading value the way she read prices.', tier: 'NEEDS_WORK' as const },
    { id: 'p1s1', paraIdx: 1, withinIdx: 1, text: 'The stone caught the fluorescent light and fractured it into something closer to testimony than beauty.', tier: 'MASTERFUL' as const },
    // P2 — 4 sentences (including the short fragments)
    { id: 'p2s0', paraIdx: 2, withinIdx: 0, text: 'So I learned to listen for the ledger under every object she handed me.', tier: 'CRITICAL' as const },
    { id: 'p2s1', paraIdx: 2, withinIdx: 1, text: 'A teacup.', tier: 'FUNCTIONAL' as const },
    { id: 'p2s2', paraIdx: 2, withinIdx: 2, text: 'A faded coat.', tier: 'FUNCTIONAL' as const },
  ];

  const paragraphsText = [P0, P1, P2];

  return {
    essayId: 'demo-foundation',
    paragraphs: [
      { index: 0, text: P0, paragraphTintTier: 'STRONG', role: 'HOOK' },
      { index: 1, text: P1, paragraphTintTier: 'EXCEPTIONAL', role: 'FULCRUM' },
      { index: 2, text: P2, paragraphTintTier: 'NEEDS_WORK', role: 'RESOLUTION' },
    ],
    sentences: s.map((raw) => {
      const { startOffset, endOffset } = sentenceRange(paragraphsText[raw.paraIdx], raw.text);
      return {
        id: raw.id,
        paragraphIndex: raw.paraIdx,
        indexWithinParagraph: raw.withinIdx,
        text: raw.text,
        startOffset,
        endOffset,
        tier: raw.tier,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Demo-scoped CSS
// ---------------------------------------------------------------------------
//
// Workstream A owns workshop.css. For the foundation demo to look like
// something while A is in-flight, we ship a minimal self-contained stylesheet
// with placeholder tier colors. At integration time, drop `DEMO_STYLESHEET`
// and rely on workshop.css — the class names match.

const DEMO_STYLESHEET = `
:root {
  --anno-critical: 0 72% 52%;
  --anno-needs-work: 34 94% 56%;
  --anno-functional: 100 20% 58%;
  --anno-strong: 142 55% 42%;
  --anno-exceptional: 178 62% 38%;
  --anno-masterful: 270 70% 55%;
}
.anno-demo-page {
  min-height: 100vh;
  padding: 48px 16px;
  background: #f8f9fb;
  color: #1a1d21;
  font-family: ui-sans-serif, -apple-system, system-ui, sans-serif;
}
.anno-demo-controls {
  max-width: 900px;
  margin: 0 auto 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.anno-demo-controls fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 0;
}
.anno-demo-controls legend {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
  padding: 0 4px;
}
.anno-demo-controls button {
  padding: 4px 10px;
  margin: 2px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}
.anno-demo-controls button[data-active='true'] {
  background: #111827;
  color: white;
  border-color: #111827;
}
.anno-editor-shell {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 40px 48px 40px 24px;
}
.anno-editor-shell.editor-soft-locked {
  cursor: not-allowed;
}
.anno-editor-shell.editor-soft-locked .anno-editor-content {
  opacity: 0.7;
  pointer-events: none;
}
.editor-gutter {
  position: relative;
  height: 100%;
}
.editor-gutter-row {
  position: absolute;
  left: 0;
  right: 8px;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--gutter-stagger-delay, 0ms);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-top: 0.4em;
}
.editor-gutter-row--visible {
  opacity: 1;
  transform: translateY(0);
}
.editor-gutter-dot {
  width: 10px; height: 10px;
  border: 0;
  border-radius: 50%;
  background: hsl(var(--anno-functional));
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-top: 4px;
}
.editor-gutter-dot--critical { background: hsl(var(--anno-critical)); }
.editor-gutter-dot--needs-work { background: hsl(var(--anno-needs-work)); }
.editor-gutter-dot--functional { background: hsl(var(--anno-functional)); }
.editor-gutter-dot--strong { background: hsl(var(--anno-strong)); }
.editor-gutter-dot--exceptional { background: hsl(var(--anno-exceptional)); }
.editor-gutter-dot--masterful { background: hsl(var(--anno-masterful)); }
.editor-gutter-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: hsl(var(--anno-functional));
  opacity: 0.55;
}
[data-reduced-motion='true'] .editor-gutter-row {
  transition-duration: 220ms;
  transition-delay: 0ms !important;
}
.anno-editor-surface {
  min-height: 200px;
}
.anno-editor-content {
  outline: none;
  font-size: 18px;
  line-height: 1.6;
  color: #1a1d21;
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, serif;
}
.anno-editor-content p {
  margin: 0 0 1em 0;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
/* Underline styles — animated via background-size draw-in */
.anno-underline {
  background-image: linear-gradient(
    to right,
    hsl(var(--anno-functional)) 0,
    hsl(var(--anno-functional)) 100%
  );
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 0% 2px;
  padding-bottom: 2px;
  transition: background-size 160ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--bloom-order, 0) * 35ms);
}
[data-reduced-motion='true'] .anno-underline {
  transition: background-size 220ms linear;
  transition-delay: 0ms !important;
}
/* Full-width once rendered — CSS :not(.hidden) default */
.anno-editor-content .anno-underline {
  background-size: 100% 2px;
}
.anno-underline-critical {
  background-image: linear-gradient(to right, hsl(var(--anno-critical)) 0, hsl(var(--anno-critical)) 100%);
}
.anno-underline-needs-work {
  background-image: linear-gradient(to right, hsl(var(--anno-needs-work)) 0, hsl(var(--anno-needs-work)) 100%);
}
.anno-underline-strong {
  background-image: linear-gradient(to right, hsl(var(--anno-strong)) 0, hsl(var(--anno-strong)) 100%);
  background-size: 0% 1.5px;
}
.anno-editor-content .anno-underline-strong { background-size: 100% 1.5px; }
.anno-underline-exceptional {
  background-image: linear-gradient(to right, hsl(var(--anno-exceptional)) 0, hsl(var(--anno-exceptional)) 100%);
}
.anno-underline-masterful {
  background-image: linear-gradient(to right, hsl(var(--anno-masterful)) 0, hsl(var(--anno-masterful)) 100%);
}
.anno-underline-wavy {
  /* Wavy variant — real workshop.css replaces with an SVG data URI. */
  background-image: linear-gradient(
    45deg,
    transparent 33%,
    hsl(var(--anno-critical)) 33%,
    hsl(var(--anno-critical)) 66%,
    transparent 66%
  ) !important;
  background-size: 6px 3px !important;
  background-repeat: repeat-x !important;
}
.anno-underline-shimmer {
  position: relative;
  animation: anno-shimmer 2s linear infinite;
}
[data-reduced-motion='true'] .anno-underline-shimmer { animation: none; }
@keyframes anno-shimmer {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.25); }
}
.anno-sentence-selected {
  box-shadow: inset 0 0 0 1.5px hsl(var(--anno-exceptional) / 0.7),
              0 0 8px 0 hsl(var(--anno-exceptional) / 0.2);
  border-radius: 3px;
}
.anno-editor-live-region {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnnotationV2Editor_Foundation_Demo() {
  const profile = useMemo(() => mkProfile(), []);
  const [tintPhase, setTintPhase] = useState<ParagraphTintPhase>('hidden');
  const [underlinePhase, setUnderlinePhase] = useState<UnderlinePhase>('hidden');
  const [softLocked, setSoftLocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tintPhases: ParagraphTintPhase[] = ['hidden', 'muted40', 'deep55'];
  const underlinePhases: UnderlinePhase[] = ['hidden', 'strengthsWave', 'criticalWave', 'full'];

  return (
    <div className="anno-demo-page">
      <style>{DEMO_STYLESHEET}</style>

      <div className="anno-demo-controls" role="toolbar" aria-label="Editor foundation demo controls">
        <fieldset>
          <legend>Paragraph tint</legend>
          {tintPhases.map((p) => (
            <button
              key={p}
              data-active={tintPhase === p}
              onClick={() => setTintPhase(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend>Underline phase</legend>
          {underlinePhases.map((p) => (
            <button
              key={p}
              data-active={underlinePhase === p}
              onClick={() => setUnderlinePhase(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend>Soft lock</legend>
          <button
            data-active={softLocked}
            onClick={() => setSoftLocked((x) => !x)}
            type="button"
          >
            {softLocked ? 'locked' : 'unlocked'}
          </button>
        </fieldset>

        <fieldset>
          <legend>Reduced motion</legend>
          <button
            data-active={reducedMotion}
            onClick={() => setReducedMotion((x) => !x)}
            type="button"
          >
            {reducedMotion ? 'on' : 'off'}
          </button>
        </fieldset>

        <fieldset>
          <legend>Selection</legend>
          <button
            data-active={selectedId === null}
            onClick={() => setSelectedId(null)}
            type="button"
          >
            clear
          </button>
          {profile.sentences.slice(0, 4).map((s) => (
            <button
              key={s.id}
              data-active={selectedId === s.id}
              onClick={() => setSelectedId(s.id)}
              type="button"
            >
              {s.id}
            </button>
          ))}
        </fieldset>
      </div>

      <AnnotationEditor
        profile={profile}
        paragraphTintPhase={tintPhase}
        underlinePhase={underlinePhase}
        selectedSentenceId={selectedId}
        softLocked={softLocked}
        reducedMotion={reducedMotion}
        onSentenceHover={(id) => {
          // eslint-disable-next-line no-console
          console.log('[demo] hover', id);
        }}
        onSentenceClick={(id) => {
          // eslint-disable-next-line no-console
          console.log('[demo] click sentence', id);
          setSelectedId(id);
        }}
        onParagraphClick={(i) => {
          // eslint-disable-next-line no-console
          console.log('[demo] click paragraph', i);
        }}
      />
    </div>
  );
}
