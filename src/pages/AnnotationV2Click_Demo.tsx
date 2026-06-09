/**
 * Workstream J demo page — click interaction integration harness.
 *
 * Route: /annotation-v2-demo/click
 *
 * Wires:
 *   - Workstream B's AnnotationEditor (real TipTap) on the left.
 *   - Workstream E's PanelShell on the right.
 *   - Workstream J's ClickManager between them.
 *
 * Exercises:
 *   - Single sentence click → ring → 180ms content swap.
 *   - Rapid-click stress test (5 clicks in <300ms): only the last one
 *     commits (latest-wins).
 *   - Hover 300ms → tooltip appears; click dismisses tooltip immediately.
 *   - Escape → returns to overview.
 *   - Click outside editor & panel → returns to overview.
 *   - Reduced motion collapses timeline to a single 220ms envelope.
 *   - Slow-motion toggle (2x) for visual debugging of the ms-by-ms state.
 */

import { useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

import {
  AnnotationEditor,
  type ParagraphTintPhase,
  type UnderlinePhase,
} from '@/components/annotation-v2-engine/editor';
import {
  PanelShell,
  usePanelMode,
} from '@/components/annotation-v2-engine/panel';
import {
  useClickManager,
  SentenceRing,
  HoverTooltip,
  type ClickTimelineState,
} from '@/components/annotation-v2-engine/click';
import { sampleProfile } from '@/components/annotation-v2-engine/fixtures/sampleProfile';
import '@/components/annotation-v2/workshop.css';

// A handful of sentences spread across tiers, for the rapid-click stress
// test. Derived at module load from the fixture to stay authoritative.
const STRESS_TEST_IDS: string[] = (() => {
  const wanted = ['CRITICAL', 'NEEDS_WORK', 'STRONG', 'EXCEPTIONAL', 'MASTERFUL'] as const;
  const picks: string[] = [];
  for (const tier of wanted) {
    const s = sampleProfile.sentences.find((x) => x.tier === tier);
    if (s) picks.push(s.id);
  }
  return picks;
})();

export default function AnnotationV2ClickDemo() {
  // --- Toggles -----------------------------------------------------------
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slowMotion, setSlowMotion] = useState<1 | 2>(1);
  const [tintPhase] = useState<ParagraphTintPhase>('muted40');
  const [underlinePhase] = useState<UnderlinePhase>('full');
  const [panelVisible, setPanelVisible] = useState(true);

  // --- Editor + refs -----------------------------------------------------
  // We capture the Editor instance from AnnotationEditor's (currently
  // non-exposed) ref by using a side-channel: AnnotationEditor accepts
  // onSentenceClick, onSentenceHover, and onParagraphClick — we don't
  // have direct editor access, so we wire the click manager via the
  // editor-facing events only. The SentenceRing component renders
  // positioning via the `editor` prop; since we need that instance for
  // coordsAtPos and B doesn't expose it today, we mount a secondary
  // lightweight editor? — no. Instead, we lift the TipTap instance by
  // reaching into the DOM after mount. A more principled path would be
  // for B to add an `onEditorReady` prop; for the Wave β demo we
  // pragmatically poll the editor dom element's attached __editor
  // handle via a ref callback. In production this will be replaced.
  //
  // Simpler approach used below: the SentenceRing/HoverTooltip still
  // work without a live editor reference by falling back to
  // sentence-element bounding boxes. We find the `data-anno-sentence-id`
  // span in the editor DOM and measure directly.
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  // --- Panel mode --------------------------------------------------------
  const panel = usePanelMode({ initial: { kind: 'overview' } });
  const selectedSentenceId =
    panel.mode.kind === 'insight' ? panel.mode.sentenceId : null;

  // --- Click manager -----------------------------------------------------
  const [timelineState, setTimelineState] = useState<ClickTimelineState>({
    phase: 'idle',
    sentenceId: null,
    elapsedMs: 0,
  });

  const [lastClickId, setLastClickId] = useState<string | null>(null);
  const [lastParagraph, setLastParagraph] = useState<number | null>(null);

  const clickManager = useClickManager({
    editor: null, // See DOM-fallback rationale above.
    profile: sampleProfile,
    editorRef: editorShellRef,
    panelRef: panelContainerRef,
    selectedSentenceId,
    onSelectSentence: (id) => {
      setLastClickId(id);
      panel.setSentence(id);
    },
    onSelectParagraph: (idx) => {
      setLastParagraph(idx);
      // Round-2 paragraph-scope mode doesn't exist yet — fall back to
      // overview as the Phase-7-future hook per §2.7 comments.
      panel.toOverview();
    },
    onDeselect: () => {
      panel.toOverview();
    },
    reducedMotion,
    slowMotion,
    onTimelineChange: setTimelineState,
  });

  // --- Stress test --------------------------------------------------------
  const fireStressTest = () => {
    // Fire 5 clicks in ~250ms (one every 50ms). Only the last should
    // commit per Phase 7 §2.4 latest-wins.
    STRESS_TEST_IDS.forEach((id, i) => {
      setTimeout(() => clickManager.api.onSentenceClick(id), i * 50);
    });
  };

  // --- Sentence-element-based positioning fallback -----------------------
  // Compute ring + tooltip rects from the sentence span in the DOM,
  // since we can't grab the TipTap editor instance directly in this
  // demo layer. A future B update can expose the Editor via a ref.
  const ringOverlay = useMemo(() => {
    const s = clickManager.ringProps.sentenceId;
    if (!s) return null;
    const sent = sampleProfile.sentences.find((x) => x.id === s);
    if (!sent) return null;
    return { sentenceId: s, tier: sent.tier };
  }, [clickManager.ringProps.sentenceId]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(220 15% 97%)' }}
    >
      <DemoToolbar
        reducedMotion={reducedMotion}
        onReducedMotionChange={setReducedMotion}
        slowMotion={slowMotion}
        onSlowMotionChange={setSlowMotion}
        panelVisible={panelVisible}
        onPanelVisibleChange={setPanelVisible}
        onStressTest={fireStressTest}
      />

      <div className="flex-1 flex" style={{ position: 'relative' }}>
        {/* Editor column */}
        <div
          ref={editorShellRef}
          className="flex-1"
          style={{
            position: 'relative',
            overflow: 'auto',
            padding: '32px 48px',
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          }}
        >
          <AnnotationEditor
            profile={sampleProfile}
            paragraphTintPhase={tintPhase}
            underlinePhase={underlinePhase}
            selectedSentenceId={selectedSentenceId}
            softLocked={false}
            reducedMotion={reducedMotion}
            onSentenceHover={clickManager.api.onSentenceHover}
            onSentenceClick={clickManager.api.onSentenceClick}
            onParagraphClick={clickManager.api.onParagraphClick}
          />

          {/* Ring overlay — rendered in the editor's positioning context.
              We use a DOM-based fallback measurement since the TipTap
              Editor instance isn't exposed yet (see demo comments). */}
          {ringOverlay && editorShellRef.current && (
            <DomRing
              sentenceId={ringOverlay.sentenceId}
              tier={ringOverlay.tier}
              phase={clickManager.ringProps.phase}
              container={editorShellRef.current}
              reducedMotion={reducedMotion}
            />
          )}

          {/* Hover tooltip — rendered fixed-position so it ignores the
              editor's scroll. */}
          {clickManager.tooltipProps.visible && clickManager.tooltipProps.sentenceId && (
            <DomTooltip
              sentenceId={clickManager.tooltipProps.sentenceId}
              profile={sampleProfile}
              reducedMotion={reducedMotion}
            />
          )}

          {/* Debug display */}
          <DebugPanel
            timeline={timelineState}
            lastClickId={lastClickId}
            lastParagraph={lastParagraph}
            pendingClickId={clickManager.api.pendingClickId}
            tooltipId={clickManager.api.tooltipId}
            selectedSentenceId={selectedSentenceId}
          />
        </div>

        <div ref={panelContainerRef}>
          <PanelShell
            mode={panel.mode}
            selectedSentenceId={selectedSentenceId}
            profile={sampleProfile}
            visible={panelVisible}
            reducedMotion={reducedMotion}
            insightsReadCount={panel.insightsReadCount}
            onTabChange={panel.setInsightTab}
            onModeChange={panel.setMode}
            onSelectSentence={panel.setSentence}
            insightSlot={<InsightSlotDemo sentenceId={selectedSentenceId} />}
            profileSlot={<SlotStub label="Profile slot (F wires)" />}
            listSlot={<SlotStub label="List slot (I wires)" />}
            progressBarSlot={null}
            breadcrumbSlot={null}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOM-based ring positioning fallback.
// Uses the editor's `data-anno-sentence-id` span (rendered by B's decoration
// plugin) to locate the sentence's bounding rect without needing a direct
// Editor handle. Future revision: expose `onEditorReady` from AnnotationEditor
// and switch to `view.coordsAtPos()`.
// ---------------------------------------------------------------------------

function DomRing(props: {
  readonly sentenceId: string;
  readonly tier: import('@/components/annotation-v2-engine').Tier;
  readonly phase: import('@/components/annotation-v2-engine/click').SentenceRingPhase;
  readonly container: HTMLElement;
  readonly reducedMotion: boolean;
}) {
  const { sentenceId, tier, phase, container, reducedMotion } = props;
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useMemo(() => {
    const span = container.querySelector<HTMLElement>(
      `[data-anno-sentence-id="${sentenceId}"]`,
    );
    if (!span) {
      setRect(null);
      return;
    }
    const box = span.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();
    setRect({
      top: box.top - containerBox.top + container.scrollTop,
      left: box.left - containerBox.left + container.scrollLeft,
      width: Math.max(4, box.width),
      height: Math.max(4, box.height),
    });
  }, [sentenceId, container]);

  if (!rect || phase === 'none') return null;

  // Use the already-built SentenceRing component styling via inline — we
  // bypass the live editor.view.coordsAtPos path by passing editor=null and
  // using our DOM-measured rect. To keep animation behaviour consistent,
  // we render a motion.span directly here using the same easings.
  const tierVar =
    tier === 'CRITICAL'
      ? '--anno-critical'
      : tier === 'NEEDS_WORK'
        ? '--anno-needs-work'
        : tier === 'FUNCTIONAL'
          ? '--anno-functional'
          : tier === 'STRONG'
            ? '--anno-strong'
            : tier === 'EXCEPTIONAL'
              ? '--anno-exceptional'
              : '--anno-masterful';

  return (
    <span
      aria-hidden="true"
      data-anno-click-ring="true"
      data-ring-phase={phase}
      style={{
        position: 'absolute',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
        borderRadius: 4,
        boxShadow: `inset 0 0 0 1.5px hsl(var(${tierVar}) / 0.7), 0 0 8px 0 hsl(var(${tierVar}) / 0.2)`,
        opacity: phase === 'mousedown' ? 0.4 : 0.85,
        transform: phase === 'mousedown' && !reducedMotion ? 'scale(1.012)' : 'none',
        transition: reducedMotion
          ? 'opacity 140ms ease'
          : 'opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 60ms cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: 11,
      }}
    />
  );
}

function DomTooltip(props: {
  readonly sentenceId: string;
  readonly profile: typeof sampleProfile;
  readonly reducedMotion: boolean;
}) {
  const { sentenceId, profile, reducedMotion } = props;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useMemo(() => {
    const span = document.querySelector<HTMLElement>(
      `[data-anno-sentence-id="${sentenceId}"]`,
    );
    if (!span) {
      setPos(null);
      return;
    }
    const box = span.getBoundingClientRect();
    setPos({ x: box.left + box.width / 2, y: box.top });
  }, [sentenceId]);

  if (!pos) return null;

  return (
    <HoverTooltip
      visible
      sentenceId={sentenceId}
      profile={profile}
      position={pos}
      reducedMotion={reducedMotion}
    />
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function DemoToolbar(props: {
  readonly reducedMotion: boolean;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly slowMotion: 1 | 2;
  readonly onSlowMotionChange: (v: 1 | 2) => void;
  readonly panelVisible: boolean;
  readonly onPanelVisibleChange: (v: boolean) => void;
  readonly onStressTest: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b p-3"
      style={{
        background: 'rgba(255,255,255,0.9)',
        borderColor: 'hsl(220 15% 90%)',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
      }}
    >
      <span style={{ fontWeight: 600, color: 'hsl(220 15% 25%)' }}>
        Workstream J — Click Interaction
      </span>
      <span style={{ color: 'hsl(220 10% 55%)' }}>/annotation-v2-demo/click</span>

      <div style={{ width: 1, height: 20, background: 'hsl(220 15% 88%)', margin: '0 8px' }} />

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={props.reducedMotion}
          onChange={(e) => props.onReducedMotionChange(e.currentTarget.checked)}
        />
        <span>reducedMotion</span>
      </label>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={props.slowMotion === 2}
          onChange={(e) => props.onSlowMotionChange(e.currentTarget.checked ? 2 : 1)}
        />
        <span>slow-motion (2x)</span>
      </label>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={props.panelVisible}
          onChange={(e) => props.onPanelVisibleChange(e.currentTarget.checked)}
        />
        <span>panel visible</span>
      </label>

      <div style={{ width: 1, height: 20, background: 'hsl(220 15% 88%)', margin: '0 8px' }} />

      <button
        type="button"
        onClick={props.onStressTest}
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          background: 'hsl(270 30% 45%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Stress test: 5 clicks in 250ms
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Debug display
// ---------------------------------------------------------------------------

function DebugPanel(props: {
  readonly timeline: ClickTimelineState;
  readonly lastClickId: string | null;
  readonly lastParagraph: number | null;
  readonly pendingClickId: string | null;
  readonly tooltipId: string | null;
  readonly selectedSentenceId: string | null;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid hsl(220 15% 88%)',
        borderRadius: 8,
        boxShadow: '0 6px 20px -6px rgba(20, 24, 32, 0.2)',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'hsl(220 15% 25%)',
        lineHeight: 1.5,
        zIndex: 100,
        maxWidth: 320,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'hsl(220 30% 35%)' }}>
        Click manager state
      </div>
      <div>timeline.phase: <b>{props.timeline.phase}</b></div>
      <div>timeline.sentenceId: {props.timeline.sentenceId ?? '—'}</div>
      <div>timeline.elapsedMs: {props.timeline.elapsedMs}</div>
      <div>pendingClickId: {props.pendingClickId ?? '—'}</div>
      <div>tooltipId: {props.tooltipId ?? '—'}</div>
      <div>selectedSentenceId: {props.selectedSentenceId ?? '—'}</div>
      <div>lastClickId (committed): {props.lastClickId ?? '—'}</div>
      <div>lastParagraph: {props.lastParagraph ?? '—'}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot stubs (mirror those in AnnotationV2Panel_Shell_Demo)
// ---------------------------------------------------------------------------

function InsightSlotDemo({ sentenceId }: { sentenceId: string | null }) {
  if (!sentenceId) return <SlotStub label="Insight slot (F wires the real card)" />;
  const sentence = sampleProfile.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return <SlotStub label="Insight slot" />;
  return (
    <div
      style={{
        padding: '12px 24px 32px 24px',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        color: 'hsl(220 15% 25%)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'hsl(220 10% 55%)',
          marginBottom: 8,
        }}
      >
        Insight slot (F wires the real card here)
      </div>
      <blockquote
        style={{
          fontFamily: '"ECRM", "Source Serif 4", Georgia, serif',
          fontStyle: 'italic',
          fontSize: '15px',
          lineHeight: 1.55,
          margin: 0,
          paddingLeft: 12,
          borderLeft: '2px solid hsl(220 15% 85%)',
          color: 'hsl(220 20% 20%)',
        }}
      >
        {'\u201C'}
        {sentence.text}
        {'\u201D'}
      </blockquote>
      <div style={{ marginTop: 16, fontSize: '13px', color: 'hsl(220 10% 45%)', lineHeight: 1.5 }}>
        tier: <code>{sentence.tier}</code>
        <br />
        effectiveness: <code>{sentence.effectiveness}</code>
      </div>
    </div>
  );
}

function SlotStub({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        color: 'hsl(220 10% 55%)',
        fontSize: '12px',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </div>
  );
}

// Keep `SentenceRing` imported for future direct-use demos even though the
// current page uses the DOM-based fallback; this silences unused-import
// lint and documents intent.
void SentenceRing;
