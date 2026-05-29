/**
 * Workstream G demo page — Rewrite Card (Phase 9) verification harness.
 *
 * Route: /annotation-v2-demo/rewrite
 *
 * Exercises:
 *   - Collapsed-by-default disclosure; tier-aware header copy.
 *   - 4s desktop / 6s mobile copy delay with cancel, commit, and
 *     anti-paste toast.
 *   - Register-match / divergence metadata row.
 *   - `Another way` secondary disclosure for variantCount=2.
 *   - Show-as-diff toggle (desktop only), off by default per §2.8.
 *   - prefers-reduced-motion toggle (height + progress ring).
 *   - Viewport simulation (desktop | mobile) with different defaults.
 *   - Rapid-click-copy stress test (no double-commit).
 *   - Copy attempt logging + interaction panel.
 *
 * This is NOT the full PanelShell — just a minimal glass rectangle
 * with 3 insight stubs containing RewriteCards. Workstream F's full
 * insight card shape is tested in /annotation-v2-demo/insight; this
 * demo focuses on the rewrite surface in isolation.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  CopyDelayToast,
  RewriteCard,
} from '@/components/annotation-v2/panel';
import { sampleProfile } from '@/components/annotation-v2/fixtures/sampleProfile';
import type {
  Annotation,
  RewriteSuggestion,
  SentenceProfile,
} from '@/components/annotation-v2/types/profile';
import {
  TIER_CSS_VAR,
  TIER_META,
  TYPOGRAPHY,
  type Tier,
} from '@/components/annotation-v2/tokens';
import '@/components/annotation-v2/workshop.css';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Viewport = 'desktop' | 'mobile';

interface CopyLogEntry {
  readonly id: string;
  readonly kind: 'start' | 'commit' | 'cancel';
  readonly sentenceId: string;
  readonly timestamp: number;
  readonly textSnippet: string;
}

interface InsightStub {
  readonly annotation: Annotation;
  readonly sentence: SentenceProfile;
  readonly paragraphIndex: number;
}

// ---------------------------------------------------------------------------
// Pick three insight stubs from the fixture — one CRITICAL (2 variants),
// one CRITICAL (1 variant), one NEEDS_WORK. All have rewrites per the
// fixture data.
// ---------------------------------------------------------------------------

function buildInsightStubs(): readonly InsightStub[] {
  const stubs: InsightStub[] = [];
  const wanted = ['p1s1', 'p2s4', 'p2s7']; // from fixture
  for (const id of wanted) {
    const annotation = sampleProfile.annotations.find(
      (a) => a.sentenceId === id && a.rewrite,
    );
    if (!annotation) continue;
    const sentence = sampleProfile.sentences.find((s) => s.id === id);
    if (!sentence) continue;
    stubs.push({
      annotation,
      sentence,
      paragraphIndex: sentence.paragraphIndex,
    });
  }
  // Also add a synthetic STRONG stub to exercise the "A slightly
  // tighter version" header (fixture doesn't include one).
  const p1s2 = sampleProfile.sentences.find((s) => s.id === 'p1s2');
  if (p1s2) {
    const syntheticStrong: Annotation = {
      id: 'synthetic-strong-ann',
      sentenceId: p1s2.id,
      type: 'teaching',
      priority: 2,
      critique:
        'The sentence earns the hook — but the rhythm could tighten if the servo image lands before the captain\'s gaze, not after.',
      whyItMatters:
        'A small tightening at the hook carries the register for everything that follows.',
      strengths: [
        'sound-before-sight ordering is right',
        'the captain\'s gaze grounds the stakes',
      ],
      rewrite: {
        id: 'synthetic-strong-rw',
        text:
          'A servo stripped its gears mid-run — I heard it before I saw my captain\'s face tighten across the arena.',
        registerMatch: 'medium',
        divergenceDimension: 'rhythm',
        variantCount: 1,
        sectionHeader: 'a_slightly_tighter_version',
      },
      crossRefs: [],
    };
    stubs.push({
      annotation: syntheticStrong,
      sentence: p1s2,
      paragraphIndex: p1s2.paragraphIndex,
    });
  }
  return stubs;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnnotationV2RewriteDemo() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [copyLog, setCopyLog] = useState<readonly CopyLogEntry[]>([]);
  const [simToastVisible, setSimToastVisible] = useState<boolean>(false);

  const stubs = useMemo(buildInsightStubs, []);

  const logEntry = useCallback((entry: CopyLogEntry) => {
    setCopyLog((prev) => [entry, ...prev].slice(0, 40));
  }, []);

  const handleCopyStart = useCallback(
    (sentenceId: string, text: string) => {
      logEntry({
        id: `start-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'start',
        sentenceId,
        timestamp: Date.now(),
        textSnippet: text.slice(0, 48),
      });
    },
    [logEntry],
  );

  const handleCopyCommit = useCallback(
    (sentenceId: string, text: string) => {
      logEntry({
        id: `commit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'commit',
        sentenceId,
        timestamp: Date.now(),
        textSnippet: text.slice(0, 48),
      });
    },
    [logEntry],
  );

  const handleCopyCancel = useCallback(
    (sentenceId: string) => {
      logEntry({
        id: `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'cancel',
        sentenceId,
        timestamp: Date.now(),
        textSnippet: '(cancelled)',
      });
    },
    [logEntry],
  );

  const handleSimulate = useCallback(() => {
    // Simulates the full toast surface without touching the real
    // clipboard API — useful when the demo is running in an iframe
    // without clipboard permission.
    setSimToastVisible(true);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(220 15% 97%)' }}
    >
      <DemoToolbar
        reducedMotion={reducedMotion}
        onReducedMotionChange={setReducedMotion}
        viewport={viewport}
        onViewportChange={setViewport}
        onSimulate={handleSimulate}
        copyLog={copyLog}
        onClearLog={() => setCopyLog([])}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '32px 24px 64px',
        }}
      >
        <div
          style={{
            width: viewport === 'mobile' ? 380 : 560,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Minimal glass rectangle acting as a stand-in for the
              insight panel container. */}
          <div
            style={{
              background: 'rgba(248, 249, 251, 0.92)',
              backdropFilter: 'blur(18px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: 16,
              boxShadow:
                '0 12px 32px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
              padding: '20px 24px 28px',
              fontFamily: TYPOGRAPHY.families.serif,
              color: 'oklch(0.22 0.02 240)',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {stubs.map((stub) => (
              <InsightStubView
                key={stub.annotation.id}
                stub={stub}
                reducedMotion={reducedMotion}
                forceMobile={viewport === 'mobile'}
                onCopyStart={(text) =>
                  handleCopyStart(stub.sentence.id, text)
                }
                onCopyCommit={(text) =>
                  handleCopyCommit(stub.sentence.id, text)
                }
                onCopyCancel={() => handleCopyCancel(stub.sentence.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <CopyDelayToast
        visible={simToastVisible}
        onDismiss={() => setSimToastVisible(false)}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single insight stub — mini version of what InsightCard renders,
// specifically to preview what the rewrite looks like under the
// critique prose. Not the full Phase 8 shape; this demo is about the
// rewrite surface only.
// ---------------------------------------------------------------------------

interface InsightStubViewProps {
  readonly stub: InsightStub;
  readonly reducedMotion: boolean;
  readonly forceMobile: boolean;
  readonly onCopyStart: (text: string) => void;
  readonly onCopyCommit: (text: string) => void;
  readonly onCopyCancel: () => void;
}

function InsightStubView({
  stub,
  reducedMotion,
  forceMobile,
  onCopyStart,
  onCopyCommit,
  onCopyCancel,
}: InsightStubViewProps): JSX.Element {
  const { annotation, sentence, paragraphIndex } = stub;
  const tierVar = TIER_CSS_VAR[sentence.tier];
  const tierLabel = TIER_META[sentence.tier].label;
  const tierColor = `hsl(var(${tierVar}))`;

  const rewrite: RewriteSuggestion | undefined = annotation.rewrite;

  return (
    <article>
      {/* Mini meta line (stub — not full Phase 8 shape). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: TYPOGRAPHY.families.sans,
          fontSize: 12,
          letterSpacing: '0.02em',
          color: 'hsl(220 15% 45%)',
          marginBottom: 10,
        }}
      >
        <span>{`\u00B6${paragraphIndex + 1}`}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{`sentence ${sentence.indexWithinParagraph + 1}`}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span
          style={{
            color: tierColor,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Original sentence as a pull-quote for context. */}
      <blockquote
        style={{
          margin: '0 0 12px 0',
          paddingLeft: 12,
          borderLeft: '2px solid hsl(220 15% 90%)',
          fontFamily: TYPOGRAPHY.families.serif,
          fontSize: 14,
          fontStyle: 'italic',
          lineHeight: 1.5,
          color: 'hsl(220 20% 30%)',
        }}
      >
        {'\u201C'}
        {sentence.text}
        {'\u201D'}
      </blockquote>

      {/* Mini critique prose. */}
      <p
        style={{
          margin: '0 0 24px 0',
          fontFamily: TYPOGRAPHY.families.serif,
          fontSize: 15,
          lineHeight: 1.55,
          color: 'oklch(0.22 0.02 240)',
          maxWidth: `${TYPOGRAPHY.maxProseCh}ch`,
        }}
      >
        {annotation.critique}
      </p>

      {/* The card under test. */}
      <RewriteCard
        rewrite={rewrite}
        reducedMotion={reducedMotion}
        originalText={sentence.text}
        forceMobile={forceMobile}
        onExpand={() => {
          /* exposed via log if needed in future */
        }}
        onCopyStart={() => onCopyStart(rewrite?.text ?? '')}
        onCopyCommit={(text) => onCopyCommit(text)}
        onCopyCancel={onCopyCancel}
      />
    </article>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface DemoToolbarProps {
  readonly reducedMotion: boolean;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly viewport: Viewport;
  readonly onViewportChange: (v: Viewport) => void;
  readonly onSimulate: () => void;
  readonly copyLog: readonly CopyLogEntry[];
  readonly onClearLog: () => void;
}

function DemoToolbar({
  reducedMotion,
  onReducedMotionChange,
  viewport,
  onViewportChange,
  onSimulate,
  copyLog,
  onClearLog,
}: DemoToolbarProps) {
  const starts = copyLog.filter((e) => e.kind === 'start').length;
  const commits = copyLog.filter((e) => e.kind === 'commit').length;
  const cancels = copyLog.filter((e) => e.kind === 'cancel').length;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid hsl(220 15% 90%)',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        fontSize: 12,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'hsl(220 25% 20%)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: 11,
          }}
        >
          /annotation-v2-demo/rewrite
        </span>
        <Divider />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => onReducedMotionChange(e.currentTarget.checked)}
          />
          <span>reducedMotion</span>
        </label>
        <Divider />
        <span style={{ color: 'hsl(220 10% 40%)' }}>viewport:</span>
        {(['desktop', 'mobile'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewportChange(v)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${
                viewport === v ? 'hsl(220 30% 40%)' : 'hsl(220 15% 85%)'
              }`,
              background: viewport === v ? 'hsl(220 30% 40%)' : 'white',
              color: viewport === v ? 'white' : 'hsl(220 15% 25%)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {v}
          </button>
        ))}
        <Divider />
        <button
          type="button"
          onClick={onSimulate}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid hsl(220 15% 85%)',
            background: 'white',
            color: 'hsl(220 15% 25%)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Simulate toast
        </button>
        <Divider />
        <span style={{ color: 'hsl(220 10% 40%)' }}>
          starts: <code>{starts}</code>
        </span>
        <span style={{ color: 'hsl(220 10% 40%)' }}>
          commits: <code>{commits}</code>
        </span>
        <span style={{ color: 'hsl(220 10% 40%)' }}>
          cancels: <code>{cancels}</code>
        </span>
        <button
          type="button"
          onClick={onClearLog}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid hsl(220 15% 85%)',
            background: 'white',
            color: 'hsl(220 15% 25%)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Clear log
        </button>
      </div>
      {copyLog.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 90,
            overflowY: 'auto',
            background: 'hsl(220 15% 98%)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: 'hsl(220 15% 35%)',
          }}
        >
          {copyLog.slice(0, 12).map((e) => (
            <div key={e.id} style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  color:
                    e.kind === 'commit'
                      ? 'hsl(150 50% 30%)'
                      : e.kind === 'cancel'
                        ? 'hsl(30 50% 40%)'
                        : 'hsl(220 25% 35%)',
                  fontWeight: 500,
                  width: 60,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: 10,
                }}
              >
                {e.kind}
              </span>
              <span style={{ width: 60, opacity: 0.7 }}>{e.sentenceId}</span>
              <span style={{ opacity: 0.85 }}>{e.textSnippet}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Divider() {
  return (
    <span
      style={{
        width: 1,
        height: 18,
        background: 'hsl(220 15% 88%)',
        display: 'inline-block',
      }}
    />
  );
}
