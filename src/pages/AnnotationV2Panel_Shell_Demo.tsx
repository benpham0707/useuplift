/**
 * Workstream E demo page — panel-shell-only verification harness.
 *
 * Route: /annotation-v2-demo/panel
 *
 * Exercises the three modes (overview / insight / list), the Phase-4
 * hidden state (`visible=false`), reduced-motion collapse, and the
 * Phase-6 Profile-tab gate (insights-read-count 0 / 1 / 2+).
 *
 * No TipTap, no bloom, no list/nav/click wiring — those are owned by
 * Workstreams B/D/I/H/J respectively. This page renders a dummy
 * editor column on the left so the 60/40 split reads correctly, and
 * drives the PanelShell via the usePanelMode hook.
 */

import { useMemo, useState } from 'react';

import {
  PanelShell,
  usePanelMode,
  type InsightTabId,
  type PanelMode,
} from '@/components/annotation-v2-engine/panel';
import { sampleProfile } from '@/components/annotation-v2-engine/fixtures/sampleProfile';
import '@/components/annotation-v2/workshop.css';

// Strongest sentence in the fixture (p3s5, MASTERFUL) and a CRITICAL
// target (p1s1) — both real IDs per fixture comment header.
const STRONG_SENTENCE_ID = 'p3s5';
const CRITICAL_SENTENCE_ID = 'p1s1';
const SAGE_SENTENCE_ID = 'p2s1'; // FUNCTIONAL in the fixture.

type ReadCountPreset = 0 | 1 | 2;

export default function AnnotationV2PanelShellDemo() {
  const [visible, setVisible] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [readPreset, setReadPreset] = useState<ReadCountPreset>(0);

  const panel = usePanelMode({
    initial: { kind: 'overview' },
  });

  // Demo-only: derive insightsReadCount from preset so the Profile
  // gate can be toggled without actually clicking through content.
  // In production this lives inside usePanelMode via markInsightRead.
  const effectiveReadCount =
    readPreset >= 2 ? 2 : readPreset === 1 ? 1 : panel.insightsReadCount;

  // Helper to push a specific mode from the toolbar buttons.
  const setMode = (next: PanelMode) => panel.setMode(next);

  const selectedSentenceId = useMemo<string | null>(() => {
    if (panel.mode.kind === 'insight') return panel.mode.sentenceId;
    return null;
  }, [panel.mode]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(220 15% 97%)' }}
    >
      <DemoToolbar
        visible={visible}
        reducedMotion={reducedMotion}
        readPreset={readPreset}
        mode={panel.mode}
        onVisibleChange={setVisible}
        onReducedMotionChange={setReducedMotion}
        onReadPresetChange={setReadPreset}
        onOverview={() => setMode({ kind: 'overview' })}
        onInsightStrong={() =>
          setMode({
            kind: 'insight',
            sentenceId: STRONG_SENTENCE_ID,
            tab: 'insights',
          })
        }
        onInsightCritical={() =>
          setMode({
            kind: 'insight',
            sentenceId: CRITICAL_SENTENCE_ID,
            tab: 'insights',
          })
        }
        onInsightSage={() =>
          setMode({
            kind: 'insight',
            sentenceId: SAGE_SENTENCE_ID,
            tab: 'insights',
          })
        }
        onList={() =>
          setMode({
            kind: 'list',
            filter: { critical: false, unreviewed: false, strengths: false },
            sort: 'priority',
          })
        }
      />

      <div className="flex-1 flex">
        {/* Dummy editor column (Workstream B renders the real TipTap
            editor here in the integrated demo). */}
        <div
          className="flex-1 p-8"
          style={{
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              color: 'hsl(220 15% 35%)',
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
              Editor column
            </div>
            <p style={{ lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Workstream E shell demo. The panel to the right should
              render three modes with 180ms crossfades between them,
              slide out when <code>visible</code> is off, and collapse
              animations under reduced motion.
            </p>
            <p
              style={{
                lineHeight: 1.6,
                margin: 0,
                fontSize: '13px',
                color: 'hsl(220 10% 50%)',
              }}
            >
              Selected sentence:{' '}
              <code>{selectedSentenceId ?? '(none)'}</code>
              <br />
              Transition key: <code>{panel.transitionKey}</code>
              <br />
              insightsReadCount (demo preset): <code>{effectiveReadCount}</code>
            </p>
          </div>
        </div>

        <PanelShell
          mode={panel.mode}
          selectedSentenceId={selectedSentenceId}
          profile={sampleProfile}
          visible={visible}
          reducedMotion={reducedMotion}
          insightsReadCount={effectiveReadCount}
          onTabChange={(tab: InsightTabId) => panel.setInsightTab(tab)}
          onModeChange={panel.setMode}
          onSelectSentence={(sentenceId) => panel.setSentence(sentenceId)}
          // Stubs for downstream — F's InsightCard and Profile content,
          // I's list body, H's progress bar. Strings make "slot rendered"
          // visible in the demo without importing anything from those
          // unwritten workstreams.
          insightSlot={
            <InsightSlotDemo sentenceId={selectedSentenceId ?? ''} />
          }
          profileSlot={<SlotDemoPanel label="Profile slot (F wires)" />}
          listSlot={<SlotDemoPanel label="List slot (I wires)" />}
          progressBarSlot={<ProgressBarSlotDemo />}
          breadcrumbSlot={null}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo toolbar
// ---------------------------------------------------------------------------

interface DemoToolbarProps {
  readonly visible: boolean;
  readonly reducedMotion: boolean;
  readonly readPreset: ReadCountPreset;
  readonly mode: PanelMode;
  readonly onVisibleChange: (v: boolean) => void;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly onReadPresetChange: (v: ReadCountPreset) => void;
  readonly onOverview: () => void;
  readonly onInsightStrong: () => void;
  readonly onInsightCritical: () => void;
  readonly onInsightSage: () => void;
  readonly onList: () => void;
}

function DemoToolbar(props: DemoToolbarProps) {
  const {
    visible,
    reducedMotion,
    readPreset,
    mode,
    onVisibleChange,
    onReducedMotionChange,
    onReadPresetChange,
    onOverview,
    onInsightStrong,
    onInsightCritical,
    onInsightSage,
    onList,
  } = props;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b p-3"
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderColor: 'hsl(220 15% 90%)',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
      }}
    >
      <span style={{ color: 'hsl(220 10% 40%)', marginRight: 8 }}>Mode:</span>
      <ToolbarButton active={mode.kind === 'overview'} onClick={onOverview}>
        overview
      </ToolbarButton>
      <ToolbarButton
        active={
          mode.kind === 'insight' && mode.sentenceId === STRONG_SENTENCE_ID
        }
        onClick={onInsightStrong}
      >
        insight (strong)
      </ToolbarButton>
      <ToolbarButton
        active={
          mode.kind === 'insight' && mode.sentenceId === CRITICAL_SENTENCE_ID
        }
        onClick={onInsightCritical}
      >
        insight (critical)
      </ToolbarButton>
      <ToolbarButton
        active={
          mode.kind === 'insight' && mode.sentenceId === SAGE_SENTENCE_ID
        }
        onClick={onInsightSage}
      >
        insight (sage)
      </ToolbarButton>
      <ToolbarButton active={mode.kind === 'list'} onClick={onList}>
        list
      </ToolbarButton>

      <div
        style={{
          width: 1,
          height: 20,
          background: 'hsl(220 15% 88%)',
          margin: '0 8px',
        }}
      />

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => onVisibleChange(e.currentTarget.checked)}
        />
        <span>visible (Phase 4 sim: off)</span>
      </label>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => onReducedMotionChange(e.currentTarget.checked)}
        />
        <span>reducedMotion</span>
      </label>

      <div
        style={{
          width: 1,
          height: 20,
          background: 'hsl(220 15% 88%)',
          margin: '0 8px',
        }}
      />

      <span style={{ color: 'hsl(220 10% 40%)' }}>insights read:</span>
      {[0, 1, 2].map((n) => (
        <ToolbarButton
          key={n}
          active={readPreset === n}
          onClick={() => onReadPresetChange(n as ReadCountPreset)}
        >
          {n === 2 ? '2+' : String(n)}
        </ToolbarButton>
      ))}
    </div>
  );
}

function ToolbarButton(props: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${props.active ? 'hsl(220 30% 40%)' : 'hsl(220 15% 85%)'}`,
        background: props.active ? 'hsl(220 30% 40%)' : 'white',
        color: props.active ? 'white' : 'hsl(220 15% 25%)',
        fontSize: '12px',
        cursor: 'pointer',
      }}
    >
      {props.children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Slot demo content (stands in for F / I / H renderers).
// ---------------------------------------------------------------------------

function InsightSlotDemo({ sentenceId }: { sentenceId: string }) {
  const sentence = sampleProfile.sentences.find((s) => s.id === sentenceId);
  if (!sentence) {
    return <SlotDemoPanel label="Insight slot (F wires)" />;
  }
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
      <div
        style={{
          marginTop: 16,
          fontSize: '13px',
          color: 'hsl(220 10% 45%)',
          lineHeight: 1.5,
        }}
      >
        effectiveness: <code>{sentence.effectiveness}</code>
        <br />
        annotations: <code>{sentence.annotationIds.length}</code>
        <br />
        tier: <code>{sentence.tier}</code>
      </div>
    </div>
  );
}

function SlotDemoPanel({ label }: { label: string }) {
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

function ProgressBarSlotDemo() {
  // Simulated 3px tier-gradient strip. Workstream H owns the real
  // progress logic.
  return (
    <div
      aria-hidden="true"
      style={{
        height: 3,
        background:
          'linear-gradient(90deg, hsl(0 70% 55% / 0.6) 0%, hsl(30 85% 58% / 0.6) 25%, hsl(150 20% 60% / 0.6) 50%, hsl(145 55% 45% / 0.6) 75%, hsl(175 65% 42% / 0.6) 100%)',
        opacity: 0.45,
      }}
    />
  );
}
