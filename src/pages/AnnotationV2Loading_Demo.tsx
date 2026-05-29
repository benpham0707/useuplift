/**
 * Workstream C demo page — Phase 4 loading state harness.
 *
 * Route: /annotation-v2-demo/loading
 *
 * Exercises every branch of the loading orchestrator in isolation:
 *   - full-pipeline (~18s, all 7 layers + paragraph_tints_ready + reveal_ready)
 *   - fast-path (~2.5s, 600ms floor verified by the hook)
 *   - slow-path simulation (hard ceiling disabled, start + pause scrolling
 *     wall-clock past 18s to see the reassurance caption)
 *   - reduced-motion (suppresses drift + caption Y-translate)
 *
 * The demo also emits a live state-log showing `paragraphTintsReady`
 * and `revealReady` flips, so β-D bloom consumer integration can be
 * verified without a backend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CancelButton,
  LayerRibbon,
  VaporScan,
  useLoadingState,
  type LoadingStatus,
  type UseLoadingState,
  SLOW_PATH_THRESHOLDS,
} from '@/components/annotation-v2/loading';
import { TYPOGRAPHY } from '@/components/annotation-v2';
import '@/components/annotation-v2/workshop.css';

// ---------------------------------------------------------------------------
// Fake essay placeholder — dummy text block to show the vapor scan on top of.
// ---------------------------------------------------------------------------

const PLACEHOLDER_PARAGRAPHS = [
  "The diamond wasn\u2019t just a diamond. For my grandmother, it was a ledger. She counted its worth in meals skipped and winters endured. It sat in a velvet-lined box in the drawer by her bed, and when I was small I thought it was a toy.",
  "The summer I turned seventeen I asked her about it for the first time. She laughed and said something I didn\u2019t understand, then reached into the drawer and pressed the box into my palm. It was heavier than I expected \u2014 not the stone but the history.",
  "I learned later that she had carried it across two countries in the lining of a coat. That she had refused to sell it in years when selling it would have meant eating. That it wasn\u2019t sentiment that kept her hand closed around the box; it was a kind of accounting only she could read.",
  "Now the box sits on my desk. Most days I don\u2019t open it. I don\u2019t need to \u2014 I can feel the weight of it without lifting the lid, the way you can feel a bruise before you press it.",
  "I think sometimes about what I have that isn\u2019t in a velvet box. The hours I spent in her kitchen, the rhythm of her English cutting against her accent, the specific quiet of her house on winter afternoons. None of those would carry across a border. But neither would they need to.",
];

// ---------------------------------------------------------------------------
// Demo controls
// ---------------------------------------------------------------------------

type DemoMode = 'full' | 'fast' | 'slow';

interface DemoControlsProps {
  readonly mode: DemoMode;
  readonly setMode: (mode: DemoMode) => void;
  readonly reducedMotionSimulation: boolean;
  readonly setReducedMotionSimulation: (v: boolean) => void;
  readonly state: UseLoadingState;
  readonly onStart: () => void;
}

function DemoControls({
  mode,
  setMode,
  reducedMotionSimulation,
  setReducedMotionSimulation,
  state,
  onStart,
}: DemoControlsProps): JSX.Element {
  return (
    <div className="demo-controls" role="toolbar" aria-label="Loading demo controls">
      <fieldset>
        <legend>Mode</legend>
        {(['full', 'fast', 'slow'] as const).map((m) => (
          <button
            key={m}
            data-active={mode === m}
            onClick={() => setMode(m)}
            disabled={state.status === 'active' || state.status === 'settling'}
            type="button"
          >
            {m === 'full' ? 'Full pipeline (~18s)' : m === 'fast' ? 'Fast path (~2.5s)' : 'Slow path (no ceiling)'}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>Reduced motion sim</legend>
        <button
          data-active={reducedMotionSimulation}
          onClick={() => setReducedMotionSimulation(!reducedMotionSimulation)}
          type="button"
        >
          {reducedMotionSimulation ? 'on (emulate @media)' : 'off'}
        </button>
        <small style={{ marginLeft: '8px', color: '#6b7280', fontSize: '11px' }}>
          For actual reduced motion, toggle your OS setting.
        </small>
      </fieldset>

      <fieldset>
        <legend>Controls</legend>
        <button
          onClick={onStart}
          disabled={state.status === 'active' || state.status === 'settling'}
          type="button"
        >
          Start analysis
        </button>
        <CancelButton
          onCancel={state.cancel}
          disabled={
            state.elapsedMs < 600 &&
            (state.status === 'active' || state.status === 'settling')
          }
          promoted={state.elapsedMs >= SLOW_PATH_THRESHOLDS.hardAcknowledgeMs}
        />
      </fieldset>

      <fieldset>
        <legend>Elapsed</legend>
        <code>{(state.elapsedMs / 1000).toFixed(1)}s</code>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny state log — verifies cross-lap signals for Wave β-D.
// ---------------------------------------------------------------------------

interface StateEvent {
  readonly t: number;
  readonly kind:
    | 'status'
    | 'activeLayer'
    | 'paragraphTintsReady'
    | 'revealReady';
  readonly payload: string;
}

function useStateLog(state: UseLoadingState): readonly StateEvent[] {
  const [log, setLog] = useState<StateEvent[]>([]);
  const prevRef = useRef<{
    status: LoadingStatus;
    activeLayer: string | null;
    paragraphTintsReady: boolean;
    revealReady: boolean;
  }>({
    status: 'idle',
    activeLayer: null,
    paragraphTintsReady: false,
    revealReady: false,
  });

  useEffect(() => {
    const prev = prevRef.current;
    const newEvents: StateEvent[] = [];
    const now = state.elapsedMs;

    if (state.status !== prev.status) {
      newEvents.push({ t: now, kind: 'status', payload: state.status });
    }
    if (state.activeLayer !== prev.activeLayer) {
      newEvents.push({
        t: now,
        kind: 'activeLayer',
        payload: state.activeLayer ?? '(none)',
      });
    }
    if (state.paragraphTintsReady && !prev.paragraphTintsReady) {
      newEvents.push({ t: now, kind: 'paragraphTintsReady', payload: 'fired' });
    }
    if (state.revealReady && !prev.revealReady) {
      newEvents.push({ t: now, kind: 'revealReady', payload: 'fired' });
    }

    if (newEvents.length > 0) {
      // Also log to console for Wave β-D integration debugging.
      for (const ev of newEvents) {
        // eslint-disable-next-line no-console
        console.log(`[loading-demo] t=${(ev.t / 1000).toFixed(2)}s  ${ev.kind} → ${ev.payload}`);
      }
      setLog((current) => [...current, ...newEvents]);
    }

    prevRef.current = {
      status: state.status,
      activeLayer: state.activeLayer,
      paragraphTintsReady: state.paragraphTintsReady,
      revealReady: state.revealReady,
    };
  }, [
    state.status,
    state.activeLayer,
    state.paragraphTintsReady,
    state.revealReady,
    state.elapsedMs,
  ]);

  return log;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnnotationV2Loading_Demo(): JSX.Element {
  const [mode, setMode] = useState<DemoMode>('full');
  const [reducedMotionSimulation, setReducedMotionSimulation] = useState(false);
  // Remount the hook on mode change so state is clean.
  const [runKey, setRunKey] = useState(0);

  return (
    <div
      className="loading-demo-page"
      data-reduced-motion={reducedMotionSimulation ? 'true' : 'false'}
    >
      <style>{DEMO_STYLESHEET}</style>

      <h1 style={{ textAlign: 'center', margin: '0 0 24px', fontSize: '20px', fontWeight: 600 }}>
        Annotation V2 — Phase 4 Loading Demo
      </h1>

      <LoadingRunner
        key={`${mode}-${runKey}`}
        mode={mode}
        onRestart={() => setRunKey((k) => k + 1)}
        setMode={setMode}
        reducedMotionSimulation={reducedMotionSimulation}
        setReducedMotionSimulation={setReducedMotionSimulation}
      />
    </div>
  );
}

interface LoadingRunnerProps {
  readonly mode: DemoMode;
  readonly onRestart: () => void;
  readonly setMode: (mode: DemoMode) => void;
  readonly reducedMotionSimulation: boolean;
  readonly setReducedMotionSimulation: (v: boolean) => void;
}

function LoadingRunner({
  mode,
  onRestart,
  setMode,
  reducedMotionSimulation,
  setReducedMotionSimulation,
}: LoadingRunnerProps): JSX.Element {
  const state = useLoadingState({
    fastPath: mode === 'fast',
    // For the slow-path demo, disable the hard ceiling so we can let
    // elapsed push past 25s without auto-cancelling.
    hardCeilingMs: mode === 'slow' ? null : SLOW_PATH_THRESHOLDS.autoCancelMs,
  });

  const log = useStateLog(state);

  const handleStart = useCallback(() => {
    onRestart();
    // The next render builds a fresh hook (via key change). We fire
    // `start` on the new hook via a microtask.
    requestAnimationFrame(() => {
      state.start();
    });
  }, [onRestart, state]);

  // Keyboard: Escape cancels (Phase 4 §2.9).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (state.status === 'active' || state.status === 'settling')) {
        state.cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const scanPhase =
    state.status === 'active'
      ? 'active'
      : state.status === 'settling'
        ? 'settling'
        : 'done';
  const scanMounted = state.status === 'active' || state.status === 'settling';

  return (
    <>
      <DemoControls
        mode={mode}
        setMode={setMode}
        reducedMotionSimulation={reducedMotionSimulation}
        setReducedMotionSimulation={setReducedMotionSimulation}
        state={state}
        onStart={handleStart}
      />

      {/* Toolbar — ribbon + cancel */}
      <div className="demo-toolbar">
        <LayerRibbon
          activeLayer={state.activeLayer}
          completedLayers={state.completedLayers}
          caption={state.caption}
          cancelled={state.status === 'cancelled'}
        />
      </div>

      {/* Fake editor — vapor scan rides on top */}
      <div className="fake-editor" aria-label="Essay editor placeholder">
        {scanMounted && <VaporScan phase={scanPhase} />}
        <div className="fake-editor-content">
          {PLACEHOLDER_PARAGRAPHS.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>

      {/* Cross-lap signal inspector */}
      <div className="signal-panel">
        <h2>Cross-lap signals (Wave β-D / Phase 5)</h2>
        <div className="signal-row">
          <span className="signal-label">paragraphTintsReady</span>
          <span className={`signal-value ${state.paragraphTintsReady ? 'on' : 'off'}`}>
            {state.paragraphTintsReady ? 'READY' : 'pending'}
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-label">revealReady</span>
          <span className={`signal-value ${state.revealReady ? 'on' : 'off'}`}>
            {state.revealReady ? 'READY' : 'pending'}
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-label">isSlowPath</span>
          <span className={`signal-value ${state.isSlowPath ? 'on' : 'off'}`}>
            {state.isSlowPath ? 'slow' : 'normal'}
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-label">status</span>
          <span className="signal-value on">{state.status}</span>
        </div>
        <h3>Event log</h3>
        <pre className="event-log">
          {log.length === 0
            ? '(no events yet — click Start analysis)'
            : log.map((e, i) => `[${(e.t / 1000).toFixed(2)}s] ${e.kind} → ${e.payload}`).join('\n')}
        </pre>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Demo-scoped stylesheet
// ---------------------------------------------------------------------------

const DEMO_STYLESHEET = `
.loading-demo-page {
  min-height: 100vh;
  padding: 48px 16px;
  background: #f8f9fb;
  color: #1a1d21;
  font-family: ${TYPOGRAPHY.families.sans};
}
.demo-controls {
  max-width: 920px;
  margin: 0 auto 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.demo-controls fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.demo-controls legend {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
  padding: 0 4px;
}
.demo-controls button {
  padding: 4px 10px;
  margin: 2px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.demo-controls button[data-active='true'] {
  background: #111827;
  color: white;
  border-color: #111827;
}
.demo-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.demo-controls code {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: #111827;
}
.demo-toolbar {
  max-width: 920px;
  margin: 0 auto 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  justify-content: center;
}
.fake-editor {
  position: relative;
  max-width: 920px;
  margin: 0 auto 24px;
  min-height: 520px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 40px 56px;
  overflow: hidden;
}
.fake-editor-content {
  position: relative;
  z-index: 1;
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, serif;
  font-size: 17px;
  line-height: 1.6;
  color: #1a1d21;
}
.fake-editor-content p {
  margin: 0 0 1.2em 0;
}
.signal-panel {
  max-width: 920px;
  margin: 0 auto;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.signal-panel h2 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}
.signal-panel h3 {
  font-size: 12px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.signal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.signal-label {
  font-size: 13px;
  font-family: ui-monospace, monospace;
  color: #374151;
}
.signal-value {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
}
.signal-value.on {
  background: hsl(145 55% 45% / 0.15);
  color: hsl(145 55% 30%);
}
.signal-value.off {
  background: hsl(220 10% 90%);
  color: hsl(220 10% 40%);
}
.event-log {
  margin: 0;
  padding: 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
}

/* Reduced-motion simulation — mirrors @media (prefers-reduced-motion) for
   users who want to preview the behavior without toggling OS settings.
   Does NOT affect motion/react's useReducedMotion hook — that one reads
   the OS media query directly. Our components handle OS-level correctly;
   this toggle only affects CSS animations. */
[data-reduced-motion='true'] .fake-editor *,
[data-reduced-motion='true'] .demo-toolbar * {
  animation-duration: 0.01ms !important;
  transition-duration: 220ms !important;
}
`;
