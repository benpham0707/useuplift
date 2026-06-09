/**
 * Workstream F demo page — Insight card (Phase 8) verification harness.
 *
 * Route: /annotation-v2-demo/insight
 *
 * Exercises:
 *   - The six-section invariant shape across all six tiers.
 *   - Multi-annotation disclosure (p2s4 carries two annotations in the
 *     fixture).
 *   - Cross-reference pills → navStack push → breadcrumb render in
 *     PanelShell's breadcrumbSlot → pop-on-click.
 *   - SAGE empty state for FUNCTIONAL sentences.
 *   - ProfileCard in the Profile tab.
 *   - Dwell timer (1200ms) driving insightsReadCount.
 *   - reducedMotion toggle.
 *
 * Does NOT wire TipTap, bloom, or Workstream H's progress bar — those
 * are other workstreams' surfaces. A dummy editor column stands in for
 * the left 60%.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  Breadcrumb,
  InsightCard,
  PanelShell,
  ProfileCard,
  SageEmptyState,
  useNavStack,
  usePanelMode,
  type InsightTabId,
  type NavStackEntry,
} from '@/components/annotation-v2-engine/panel';
import { sampleProfile } from '@/components/annotation-v2-engine/fixtures/sampleProfile';
import type { Tier } from '@/components/annotation-v2-engine/tokens';
import '@/components/annotation-v2/workshop.css';

// ---------------------------------------------------------------------------
// Sentence cycling presets — one per tier for the demo toolbar.
// ---------------------------------------------------------------------------

interface SentencePreset {
  readonly id: string;
  readonly label: string;
  readonly tier: Tier;
}

const PRESETS: readonly SentencePreset[] = [
  { id: 'p1s1', label: 'p1s1 CRITICAL', tier: 'CRITICAL' },
  { id: 'p2s9', label: 'p2s9 NEEDS_WORK', tier: 'NEEDS_WORK' },
  { id: 'p1s3', label: 'p1s3 FUNCTIONAL (sage)', tier: 'FUNCTIONAL' },
  { id: 'p1s2', label: 'p1s2 STRONG', tier: 'STRONG' },
  { id: 'p3s4', label: 'p3s4 EXCEPTIONAL', tier: 'EXCEPTIONAL' },
  { id: 'p3s5', label: 'p3s5 MASTERFUL', tier: 'MASTERFUL' },
  { id: 'p2s4', label: 'p2s4 CRITICAL (2 annotations)', tier: 'CRITICAL' },
];

export default function AnnotationV2InsightDemo() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const navStack = useNavStack();
  const panel = usePanelMode({
    initial: {
      kind: 'insight',
      sentenceId: 'p1s1',
      tab: 'insights',
    },
  });

  // Tier resolver used by CrossRefPill / Breadcrumb.
  const resolveTargetTier = useCallback(
    (sentenceId: string): Tier => {
      const s = sampleProfile.sentences.find((x) => x.id === sentenceId);
      return s?.tier ?? 'FUNCTIONAL';
    },
    [],
  );

  // Push the initial entry into the stack the first time we enter
  // insight mode. useNavStack doesn't seed itself — it's the host's
  // job to tell the stack where the student started.
  const currentInsightSentenceId =
    panel.mode.kind === 'insight' ? panel.mode.sentenceId : null;

  // Seed the stack once.
  useMemo(() => {
    if (currentInsightSentenceId && navStack.stack.length === 0) {
      navStack.push({
        sentenceId: currentInsightSentenceId,
        timestamp: Date.now(),
        reason: 'initial',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jump from a cross-ref pill inside the card.
  const handleCrossRef = useCallback(
    (targetSentenceId: string) => {
      navStack.push({
        sentenceId: targetSentenceId,
        timestamp: Date.now(),
        reason: 'crossref',
      });
      panel.setSentence(targetSentenceId, 'insights');
    },
    [navStack, panel],
  );

  // Click the breadcrumb to pop back.
  const handleBack = useCallback(
    (entry: NavStackEntry) => {
      // Pop everything above the target entry.
      // Our stack bounds at 3; a single pop suffices since breadcrumb
      // only surfaces ancestors (max 2). If the clicked entry is not
      // the most recent ancestor, pop twice.
      const idx = navStack.stack.findIndex(
        (e) =>
          e.sentenceId === entry.sentenceId && e.timestamp === entry.timestamp,
      );
      if (idx < 0) return;
      const popCount = navStack.stack.length - 1 - idx;
      for (let i = 0; i < popCount; i += 1) navStack.pop();
      panel.setSentence(entry.sentenceId, 'insights');
    },
    [navStack, panel],
  );

  // Switching to a brand-new preset clears the stack and re-seeds.
  const handlePresetClick = useCallback(
    (id: string) => {
      navStack.clear();
      navStack.push({ sentenceId: id, timestamp: Date.now(), reason: 'initial' });
      panel.setSentence(id, 'insights');
    },
    [navStack, panel],
  );

  // Resolve the current sentence + annotation for the slots.
  const currentSentence = useMemo(() => {
    if (!currentInsightSentenceId) return null;
    return (
      sampleProfile.sentences.find((s) => s.id === currentInsightSentenceId) ??
      null
    );
  }, [currentInsightSentenceId]);

  const currentPeers = useMemo(() => {
    if (!currentSentence) return [];
    return sampleProfile.annotations
      .filter((a) => a.sentenceId === currentSentence.id)
      .slice()
      .sort((a, b) => a.priority - b.priority);
  }, [currentSentence]);

  const primaryAnnotation = currentPeers[0] ?? null;

  // Slot renderers.
  const insightSlot = (() => {
    if (!currentSentence) return null;
    // Phase 7 §2.5 — FUNCTIONAL and no annotation => sage empty state.
    if (currentSentence.tier === 'FUNCTIONAL' && !primaryAnnotation) {
      return (
        <SageEmptyState
          onViewProfile={() => panel.setInsightTab('profile')}
        />
      );
    }
    // No annotation but not FUNCTIONAL — also fall back to sage state.
    if (!primaryAnnotation) {
      return (
        <SageEmptyState
          onViewProfile={() => panel.setInsightTab('profile')}
        />
      );
    }
    return (
      <InsightCard
        annotation={primaryAnnotation}
        sentence={currentSentence}
        paragraphIndex={currentSentence.paragraphIndex}
        allAnnotations={sampleProfile.annotations}
        resolveTargetTier={resolveTargetTier}
        onCrossRef={handleCrossRef}
        onMarkRead={(id) => panel.markInsightRead(id)}
        reducedMotion={reducedMotion}
      />
    );
  })();

  const profileSlot = currentSentence ? (
    <ProfileCard
      sentence={currentSentence}
      paragraphIndex={currentSentence.paragraphIndex}
      reducedMotion={reducedMotion}
    />
  ) : null;

  const breadcrumbSlot =
    navStack.stack.length > 1 ? (
      <Breadcrumb
        stack={navStack.stack}
        profile={sampleProfile}
        onBack={handleBack}
        reducedMotion={reducedMotion}
      />
    ) : null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(220 15% 97%)' }}
    >
      <DemoToolbar
        presets={PRESETS}
        activeId={currentInsightSentenceId}
        onPreset={handlePresetClick}
        reducedMotion={reducedMotion}
        onReducedMotionChange={setReducedMotion}
        readCount={panel.insightsReadCount}
        navStackDepth={navStack.stack.length}
      />
      <div className="flex-1 flex">
        <EditorColumnStub
          currentSentenceId={currentInsightSentenceId}
          readCount={panel.insightsReadCount}
          navStackDepth={navStack.stack.length}
        />

        <PanelShell
          mode={panel.mode}
          selectedSentenceId={currentInsightSentenceId}
          profile={sampleProfile}
          visible={true}
          reducedMotion={reducedMotion}
          insightsReadCount={panel.insightsReadCount}
          onTabChange={(tab: InsightTabId) => panel.setInsightTab(tab)}
          onModeChange={panel.setMode}
          onSelectSentence={(id) => panel.setSentence(id)}
          insightSlot={insightSlot}
          profileSlot={profileSlot}
          breadcrumbSlot={breadcrumbSlot}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface DemoToolbarProps {
  readonly presets: readonly SentencePreset[];
  readonly activeId: string | null;
  readonly onPreset: (id: string) => void;
  readonly reducedMotion: boolean;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly readCount: number;
  readonly navStackDepth: number;
}

function DemoToolbar({
  presets,
  activeId,
  onPreset,
  reducedMotion,
  onReducedMotionChange,
  readCount,
  navStackDepth,
}: DemoToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b p-3"
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderColor: 'hsl(220 15% 90%)',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        fontSize: '12px',
      }}
    >
      <span style={{ color: 'hsl(220 10% 40%)', marginRight: 6 }}>
        Sentence:
      </span>
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPreset(p.id)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: `1px solid ${
              activeId === p.id ? 'hsl(220 30% 40%)' : 'hsl(220 15% 85%)'
            }`,
            background: activeId === p.id ? 'hsl(220 30% 40%)' : 'white',
            color: activeId === p.id ? 'white' : 'hsl(220 15% 25%)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {p.label}
        </button>
      ))}
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
      <span style={{ color: 'hsl(220 10% 40%)' }}>
        insightsReadCount: <code>{readCount}</code>
      </span>
      <span style={{ color: 'hsl(220 10% 40%)' }}>
        navStack depth: <code>{navStackDepth}</code>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fake editor column — stands in for Workstream B's TipTap editor.
// ---------------------------------------------------------------------------

function EditorColumnStub({
  currentSentenceId,
  readCount,
  navStackDepth,
}: {
  readonly currentSentenceId: string | null;
  readonly readCount: number;
  readonly navStackDepth: number;
}) {
  const sentence = currentSentenceId
    ? sampleProfile.sentences.find((s) => s.id === currentSentenceId)
    : null;

  return (
    <div
      className="flex-1 p-8"
      style={{
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        color: 'hsl(220 15% 35%)',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'hsl(220 10% 55%)',
            marginBottom: 8,
          }}
        >
          Editor column (stub)
        </div>
        <p style={{ lineHeight: 1.6, margin: '0 0 16px 0' }}>
          Workstream F demo. The right panel renders the invariant
          insight-card shape and the Profile tab's understanding
          renderer. Clicking a cross-reference pill inside an insight
          pushes to the nav stack; the breadcrumb appears in the panel
          header and clicking a crumb pops back.
        </p>
        {sentence ? (
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
        ) : null}
        <div
          style={{
            marginTop: 16,
            fontSize: '12px',
            color: 'hsl(220 10% 45%)',
            lineHeight: 1.5,
          }}
        >
          <div>
            selected: <code>{currentSentenceId ?? '(none)'}</code>
          </div>
          <div>
            insightsReadCount: <code>{readCount}</code>
          </div>
          <div>
            navStack depth: <code>{navStackDepth}</code>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
            Dwell threshold is 1200ms; stay on a sentence for 1.2s to
            see the count increment. Profile tab becomes available when
            the count reaches 2.
          </div>
        </div>
      </div>
    </div>
  );
}
