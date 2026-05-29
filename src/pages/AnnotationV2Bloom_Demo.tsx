/**
 * Workstream D demo page — Phase 5 "The Bloom" choreography.
 *
 * Route: /annotation-v2-demo/bloom
 *
 * First end-to-end Wave-β integration — wires Workstream C (loading) →
 * Workstream D (bloom orchestrator) → Workstream B (TipTap editor) +
 * Workstream E (panel shell) together. The only still-stubbed surface
 * is the panel's insight content (Workstream F hasn't landed).
 *
 * What you can do here:
 *   - Start analysis — kicks `useLoadingState` through the 7 layer
 *     events; at `paragraph_tints_ready` the editor flips to muted
 *     tints (Phase 4 pre-bloom), at `reveal_ready` the bloom choreography
 *     runs its landmark schedule.
 *   - Toggle reducedMotion — exercises the 220ms crossfade collapse.
 *   - Toggle fastPath — focused re-analysis (shorter loading timeline).
 *   - Timeline inspector — shows current bloom state + elapsed ms.
 *   - Click a sentence — swaps the panel to insight mode manually.
 *   - "Start here" chip — fires at bloom-end; clicking routes to the
 *     top-priority CRITICAL sentence.
 *
 * Authority references (Phase 5 §§2.1–2.10, §3, §4; Phase 4 §2.8;
 * Phase 6 §2.1). All references inline on the relevant wiring.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AnnotationEditor,
  type ParagraphTintPhase as EditorParagraphTintPhase,
} from '@/components/annotation-v2/editor';
import type { UnderlinePhase } from '@/components/annotation-v2/editor';
import {
  PanelShell,
  usePanelMode,
  type InsightTabId,
} from '@/components/annotation-v2/panel';
import {
  useLoadingState,
  VaporScan,
  LayerRibbon,
} from '@/components/annotation-v2/loading';
import {
  HeaderNarrative,
  StartHereChip,
  useBloomChoreography,
  BLOOM_TIMELINE,
} from '@/components/annotation-v2/bloom';
import { sampleProfile } from '@/components/annotation-v2/fixtures/sampleProfile';
import { TYPOGRAPHY } from '@/components/annotation-v2';
import '@/components/annotation-v2/workshop.css';

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export default function AnnotationV2BloomDemo(): JSX.Element {
  const [reducedMotionSim, setReducedMotionSim] = useState(false);
  const [fastPath, setFastPath] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(220 15% 97%)',
        fontFamily: TYPOGRAPHY.families.sans,
        color: 'hsl(220 15% 20%)',
      }}
      data-reduced-motion={reducedMotionSim ? 'true' : 'false'}
    >
      <style>{DEMO_STYLESHEET}</style>
      <BloomRunner
        key={`${fastPath ? 'fast' : 'full'}-${reducedMotionSim}-${runKey}`}
        fastPath={fastPath}
        reducedMotion={reducedMotionSim}
        onRestart={() => setRunKey((k) => k + 1)}
        onFastPathChange={setFastPath}
        onReducedMotionChange={setReducedMotionSim}
      />
    </div>
  );
}

interface BloomRunnerProps {
  readonly fastPath: boolean;
  readonly reducedMotion: boolean;
  readonly onRestart: () => void;
  readonly onFastPathChange: (v: boolean) => void;
  readonly onReducedMotionChange: (v: boolean) => void;
}

function BloomRunner({
  fastPath,
  reducedMotion,
  onRestart,
  onFastPathChange,
  onReducedMotionChange,
}: BloomRunnerProps): JSX.Element {
  // Phase 4 loading orchestrator — emits paragraphTintsReady + revealReady.
  const loading = useLoadingState({ fastPath });

  // Phase 5 bloom choreography — consumes those signals, emits the
  // editor/panel phase transitions.
  const bloom = useBloomChoreography({
    paragraphTintsReady: loading.paragraphTintsReady,
    revealReady: loading.revealReady,
    profile: sampleProfile,
    reducedMotion,
  });

  // Panel mode — starts at overview. When bloom auto-selects at t=2200,
  // we flip to insight mode for that sentence. User clicks thereafter
  // route through the same setMode.
  const panel = usePanelMode({ initial: { kind: 'overview' } });

  // Wire bloom's auto-selection into the panel mode. This is the
  // "autoSelectedSentenceId flows into the panel" seam.
  const lastAutoSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    const next = bloom.autoSelectedSentenceId;
    if (!next) return;
    if (next === lastAutoSelectedRef.current) return;
    lastAutoSelectedRef.current = next;
    panel.setSentence(next, 'insights');
  }, [bloom.autoSelectedSentenceId, panel]);

  // Editor selected-sentence ID. When the panel is in insight mode, the
  // editor ring tracks the panel's sentenceId (this is the Phase 7
  // reciprocity: editor click → panel updates, bloom auto-select →
  // editor ring appears).
  const selectedSentenceId = useMemo<string | null>(() => {
    if (panel.mode.kind === 'insight') return panel.mode.sentenceId;
    return null;
  }, [panel.mode]);

  // Phase 5 §2.6 — "Start here" chip click.
  const handleStartHereClick = useCallback(
    (sentenceId: string) => {
      panel.setSentence(sentenceId, 'insights');
    },
    [panel],
  );

  // Phase 5 header narrative dismisses on first user interaction.
  const [narrativeDismissed, setNarrativeDismissed] = useState(false);
  const handleSentenceClick = useCallback(
    (id: string) => {
      if (!bloom.interactive) return; // Editor is not yet interactive.
      setNarrativeDismissed(true);
      panel.setSentence(id, 'insights');
    },
    [bloom.interactive, panel],
  );

  // Reset narrative-dismissed when a new reveal begins.
  useEffect(() => {
    if (!loading.revealReady) setNarrativeDismissed(false);
  }, [loading.revealReady]);

  // Phase 4 §2.1 — keep the editor soft-locked during analysis.
  const softLocked = !bloom.interactive && loading.status !== 'idle';

  // Live region — bloom publishes `ariaAnnouncement`; we mirror it.
  const liveAnnouncement = bloom.ariaAnnouncement;

  // Derived VaporScan phase.
  const scanMounted =
    loading.status === 'active' || loading.status === 'settling';
  const scanPhase =
    loading.status === 'active'
      ? 'active'
      : loading.status === 'settling'
        ? 'settling'
        : 'done';

  // Bloom elapsed ms — measured against the revealReady moment. Shown
  // in the timeline inspector.
  const [bloomElapsed, setBloomElapsed] = useState(0);
  useEffect(() => {
    if (!loading.revealReady) {
      setBloomElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const id = setInterval(() => {
      setBloomElapsed(Date.now() - startedAt);
      if (Date.now() - startedAt > BLOOM_TIMELINE.interactive + 500) {
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [loading.revealReady]);

  const handleStart = useCallback(() => {
    onRestart();
    // Fresh hook on remount via key; fire start on next frame.
    requestAnimationFrame(() => {
      loading.start();
    });
  }, [loading, onRestart]);

  const handleCancel = useCallback(() => {
    loading.cancel();
  }, [loading]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bloom-demo-shell">
      <DemoToolbar
        fastPath={fastPath}
        reducedMotion={reducedMotion}
        onFastPathChange={onFastPathChange}
        onReducedMotionChange={onReducedMotionChange}
        onStart={handleStart}
        onCancel={handleCancel}
        loadingStatus={loading.status}
        elapsedMs={loading.elapsedMs}
      />

      <div className="bloom-demo-mainrow">
        {/* Left column — editor + vapor scan + header narrative */}
        <div className="bloom-demo-editorcol">
          <div className="bloom-demo-ribbon">
            <LayerRibbon
              activeLayer={loading.activeLayer}
              completedLayers={loading.completedLayers}
              caption={loading.caption}
              cancelled={loading.status === 'cancelled'}
            />
          </div>

          {/* Phase 5 §2.1 step 5 — header narrative in the toolbar
              region, above the editor. Fades in at t=900ms. */}
          <div
            className="bloom-demo-narrative-row"
            // Live region sits adjacent — announcements are polite
            // and queued by the consumer (here, the demo page).
          >
            <HeaderNarrative
              visible={bloom.headerNarrativeVisible && !narrativeDismissed}
              profile={sampleProfile}
              reducedMotion={reducedMotion}
              onDismiss={() => setNarrativeDismissed(true)}
            />
          </div>

          <div className="bloom-demo-editorwrap">
            {scanMounted ? (
              <div className="bloom-demo-vaporscan-layer">
                <VaporScan phase={scanPhase} />
              </div>
            ) : null}

            <AnnotationEditor
              profile={sampleProfile}
              paragraphTintPhase={
                bloom.paragraphTintPhase as EditorParagraphTintPhase
              }
              underlinePhase={bloom.underlinePhase as UnderlinePhase}
              selectedSentenceId={selectedSentenceId}
              softLocked={softLocked}
              onSentenceClick={handleSentenceClick}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Live region — Phase 5 §2.10 / Phase 6 §9 announcements. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
            }}
          >
            {liveAnnouncement}
          </div>
        </div>

        {/* Right column — panel + start-here chip */}
        <div className="bloom-demo-panelcol">
          <PanelShell
            mode={panel.mode}
            selectedSentenceId={selectedSentenceId}
            profile={sampleProfile}
            visible={bloom.panelVisible}
            reducedMotion={reducedMotion}
            insightsReadCount={panel.insightsReadCount}
            onTabChange={(tab: InsightTabId) => panel.setInsightTab(tab)}
            onModeChange={panel.setMode}
            onSelectSentence={(sentenceId) =>
              panel.setSentence(sentenceId)
            }
            insightSlot={
              <InsightStubSlot sentenceId={selectedSentenceId} />
            }
            profileSlot={<StubPanel label="Profile slot (F wires)" />}
            listSlot={<StubPanel label="List slot (I wires)" />}
            breadcrumbSlot={null}
            progressBarSlot={null}
          />
          {/* Phase 5 §2.6 — Start here chip docked at bottom-right of
              the panel. The panelcol is position:relative so this
              absolute-positioned chip anchors to it. */}
          <StartHereChip
            visible={bloom.startHereChipVisible}
            targetSentenceId={bloom.topCriticalSentenceId}
            onClick={handleStartHereClick}
            reducedMotion={reducedMotion}
            showInactivityPulse={false}
            promoted={bloom.startHereChipPromoted}
            style={{ position: 'absolute', right: 20, bottom: 20 }}
          />
        </div>
      </div>

      {/* Timeline inspector — dev affordance. Remove at integration. */}
      <TimelineInspector
        bloomElapsed={bloomElapsed}
        revealReady={loading.revealReady}
        paragraphTintsReady={loading.paragraphTintsReady}
        bloomState={bloom}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface DemoToolbarProps {
  readonly fastPath: boolean;
  readonly reducedMotion: boolean;
  readonly loadingStatus: string;
  readonly elapsedMs: number;
  readonly onFastPathChange: (v: boolean) => void;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly onStart: () => void;
  readonly onCancel: () => void;
}

function DemoToolbar(props: DemoToolbarProps): JSX.Element {
  const {
    fastPath,
    reducedMotion,
    loadingStatus,
    elapsedMs,
    onFastPathChange,
    onReducedMotionChange,
    onStart,
    onCancel,
  } = props;

  const running =
    loadingStatus === 'active' || loadingStatus === 'settling';

  return (
    <div className="bloom-demo-toolbar">
      <button
        type="button"
        onClick={onStart}
        disabled={running}
        className="bloom-demo-btn bloom-demo-btn-primary"
      >
        Start analysis
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={!running}
        className="bloom-demo-btn"
      >
        Cancel
      </button>
      <label className="bloom-demo-check">
        <input
          type="checkbox"
          checked={fastPath}
          disabled={running}
          onChange={(e) => onFastPathChange(e.currentTarget.checked)}
        />
        <span>fastPath (focused re-analysis)</span>
      </label>
      <label className="bloom-demo-check">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => onReducedMotionChange(e.currentTarget.checked)}
        />
        <span>reducedMotion</span>
      </label>
      <span className="bloom-demo-status">
        status: <code>{loadingStatus}</code> ·
        elapsed <code>{(elapsedMs / 1000).toFixed(1)}s</code>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline inspector — dev affordance
// ---------------------------------------------------------------------------

interface TimelineInspectorProps {
  readonly bloomElapsed: number;
  readonly revealReady: boolean;
  readonly paragraphTintsReady: boolean;
  readonly bloomState: ReturnType<typeof useBloomChoreography>;
}

function TimelineInspector(props: TimelineInspectorProps): JSX.Element {
  const { bloomElapsed, revealReady, paragraphTintsReady, bloomState } = props;

  // Highlight the current BLOOM_TIMELINE landmark by elapsed ms.
  const landmarks = useMemo(() => {
    return Object.entries(BLOOM_TIMELINE).map(([name, ms]) => ({
      name,
      ms,
      passed: revealReady && bloomElapsed >= ms,
    }));
  }, [bloomElapsed, revealReady]);

  return (
    <div className="bloom-demo-inspector">
      <h3>Timeline inspector (dev)</h3>
      <div className="bloom-demo-inspector-signals">
        <Signal label="paragraphTintsReady" value={paragraphTintsReady ? 'READY' : 'pending'} on={paragraphTintsReady} />
        <Signal label="revealReady" value={revealReady ? 'READY' : 'pending'} on={revealReady} />
        <Signal label="bloom elapsed" value={`${(bloomElapsed / 1000).toFixed(2)}s`} on={revealReady} />
        <Signal label="paragraphTintPhase" value={bloomState.paragraphTintPhase} on={bloomState.paragraphTintPhase !== 'hidden'} />
        <Signal label="underlinePhase" value={bloomState.underlinePhase} on={bloomState.underlinePhase !== 'hidden'} />
        <Signal label="panelVisible" value={bloomState.panelVisible ? 'true' : 'false'} on={bloomState.panelVisible} />
        <Signal label="gutterFadePhase" value={bloomState.gutterFadePhase} on={bloomState.gutterFadePhase === 'visible'} />
        <Signal label="headerNarrativeVisible" value={bloomState.headerNarrativeVisible ? 'true' : 'false'} on={bloomState.headerNarrativeVisible} />
        <Signal label="startHereChipVisible" value={bloomState.startHereChipVisible ? 'true' : 'false'} on={bloomState.startHereChipVisible} />
        <Signal label="autoSelectedSentenceId" value={bloomState.autoSelectedSentenceId ?? '(none)'} on={bloomState.autoSelectedSentenceId !== null} />
        <Signal label="interactive" value={bloomState.interactive ? 'true' : 'false'} on={bloomState.interactive} />
      </div>
      <h4>Landmarks</h4>
      <ol className="bloom-demo-inspector-landmarks">
        {landmarks.map((l) => (
          <li key={l.name} data-passed={l.passed ? 'true' : 'false'}>
            <code>{l.name}</code>
            <span>@ t={l.ms}ms</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Signal(props: {
  readonly label: string;
  readonly value: string;
  readonly on: boolean;
}): JSX.Element {
  return (
    <div className="bloom-demo-signal">
      <span className="bloom-demo-signal-label">{props.label}</span>
      <span
        className={`bloom-demo-signal-value ${props.on ? 'on' : 'off'}`}
      >
        {props.value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel slot stubs
// ---------------------------------------------------------------------------

function InsightStubSlot(props: {
  readonly sentenceId: string | null;
}): JSX.Element {
  const { sentenceId } = props;
  const sentence = sentenceId
    ? sampleProfile.sentences.find((s) => s.id === sentenceId)
    : null;

  if (!sentence) {
    return <StubPanel label="No sentence selected" />;
  }

  return (
    <div
      style={{
        padding: '16px 24px 32px 24px',
        fontFamily: TYPOGRAPHY.families.sans,
        color: 'hsl(220 15% 25%)',
      }}
    >
      <div
        style={{
          fontSize: TYPOGRAPHY.size.meta,
          textTransform: 'uppercase',
          letterSpacing: TYPOGRAPHY.tracking.meta,
          color: 'hsl(220 10% 55%)',
          marginBottom: 8,
        }}
      >
        Insight for ¶{sentence.paragraphIndex + 1}·s
        {sentence.indexWithinParagraph + 1}
      </div>
      <blockquote
        style={{
          fontFamily: TYPOGRAPHY.families.serif,
          fontStyle: 'italic',
          fontSize: TYPOGRAPHY.size.inlineQuote,
          lineHeight: TYPOGRAPHY.lineHeight.serifProse,
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
      <div
        style={{
          marginTop: 14,
          fontSize: '12px',
          color: 'hsl(220 10% 45%)',
          lineHeight: 1.4,
        }}
      >
        tier: <code>{sentence.tier}</code>
        <br />
        effectiveness: <code>{sentence.effectiveness}</code>
        <br />
        <em style={{ display: 'block', marginTop: 8, fontSize: 11 }}>
          Workstream F will render critique / why / try here.
        </em>
      </div>
    </div>
  );
}

function StubPanel(props: { readonly label: string }): JSX.Element {
  return (
    <div
      style={{
        padding: '20px 24px',
        fontFamily: TYPOGRAPHY.families.sans,
        color: 'hsl(220 10% 55%)',
        fontSize: TYPOGRAPHY.size.meta,
        letterSpacing: TYPOGRAPHY.tracking.meta,
      }}
    >
      {props.label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo stylesheet
// ---------------------------------------------------------------------------

// Note: .sr-only works if defined elsewhere; we provide a local
// fallback via inline styles on the live-region div above.
const DEMO_STYLESHEET = `
.bloom-demo-shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bloom-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1px solid hsl(220 15% 90%);
  border-radius: 8px;
}
.bloom-demo-btn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid hsl(220 15% 85%);
  background: white;
  color: hsl(220 15% 25%);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
.bloom-demo-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.bloom-demo-btn-primary {
  background: hsl(220 30% 40%);
  color: white;
  border-color: hsl(220 30% 40%);
}
.bloom-demo-check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: hsl(220 10% 30%);
}
.bloom-demo-status {
  margin-left: auto;
  font-size: 12px;
  color: hsl(220 10% 45%);
}
.bloom-demo-status code {
  font-family: ui-monospace, monospace;
  color: hsl(220 15% 25%);
}
.bloom-demo-mainrow {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 640px;
}
.bloom-demo-editorcol {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}
.bloom-demo-ribbon {
  background: white;
  border: 1px solid hsl(220 15% 90%);
  border-radius: 8px;
  padding: 10px 14px;
}
.bloom-demo-narrative-row {
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 0 14px;
}
.bloom-demo-editorwrap {
  position: relative;
  flex: 1 1 auto;
  background: white;
  border: 1px solid hsl(220 15% 90%);
  border-radius: 8px;
  padding: 24px 32px;
  overflow: hidden;
}
.bloom-demo-vaporscan-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
.bloom-demo-panelcol {
  width: 40%;
  min-width: 360px;
  max-width: 560px;
  position: relative;
  display: flex;
}
.bloom-demo-panelcol > aside {
  width: 100% !important;
  min-width: 0 !important;
  height: 100%;
}
.bloom-demo-inspector {
  background: white;
  border: 1px solid hsl(220 15% 90%);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 12px;
}
.bloom-demo-inspector h3 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(220 10% 45%);
}
.bloom-demo-inspector h4 {
  font-size: 11px;
  font-weight: 600;
  margin: 14px 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(220 10% 45%);
}
.bloom-demo-inspector-signals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 4px 12px;
}
.bloom-demo-signal {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid hsl(220 15% 96%);
}
.bloom-demo-signal-label {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: hsl(220 15% 35%);
}
.bloom-demo-signal-value {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.bloom-demo-signal-value.on {
  background: hsl(145 55% 45% / 0.15);
  color: hsl(145 55% 30%);
}
.bloom-demo-signal-value.off {
  background: hsl(220 10% 92%);
  color: hsl(220 10% 40%);
}
.bloom-demo-inspector-landmarks {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 4px 12px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.bloom-demo-inspector-landmarks li {
  display: flex;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: 4px;
  color: hsl(220 10% 55%);
}
.bloom-demo-inspector-landmarks li[data-passed='true'] {
  background: hsl(145 55% 45% / 0.08);
  color: hsl(145 55% 30%);
}
.bloom-demo-inspector-landmarks li code {
  color: inherit;
}

/* Reduced-motion emulation for demo toggle — real OS preference is
   honored by motion/react independently. */
[data-reduced-motion='true'] .bloom-demo-editorwrap *,
[data-reduced-motion='true'] .bloom-demo-panelcol * {
  animation-duration: 0.01ms !important;
}
`;

