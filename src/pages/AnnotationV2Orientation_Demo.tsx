/**
 * Workstream K demo page — Phase 6 First-Time Orientation harness.
 *
 * Route: /annotation-v2-demo/orientation
 *
 * Exercises every surface of the orientation layer in isolation:
 *   - The 5-hint registry, triggered individually via mock signals.
 *   - The 12s inactivity chip pulse (simulate-click / simulate-idle
 *     toggle fakes the user-interaction gate).
 *   - The keyboard-shortcut footer one-shot (after first panel close).
 *   - The reduced-motion variant of every animation.
 *   - The screen-reader orientation path (announcement log shown
 *     visibly for dev; real SR users hear the aria-live region).
 *   - localStorage one-shot behaviour (reset button clears).
 *
 * Deliberately simplified from the integrated harness: we stub the
 * editor column with a single "simulate-click" button and stub the
 * toolbar/filter/list icons with small anchor divs. The goal is to
 * verify the K-layer behaviour, not re-test E/F/I.
 *
 * Authority: docs/ux_phases/phase_6_orientation.md (all 10 decisions).
 */

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import {
  AmbientHint,
  HINT_ORDER,
  HINT_REGISTRY,
  KEYBOARD_FOOTER_STORAGE_KEY,
  KeyboardShortcutFooter,
  readHintSeen,
  useOrientation,
  useScreenReaderOrientation,
  type HintAnchor,
  type HintId,
} from '@/components/annotation-v2-engine/orientation';
import { StartHereChip } from '@/components/annotation-v2-engine/bloom';
import type { PanelMode } from '@/components/annotation-v2-engine/panel';
import { TYPOGRAPHY, Z_LAYER } from '@/components/annotation-v2-engine';
import '@/components/annotation-v2/workshop.css';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnnotationV2OrientationDemo(): JSX.Element {
  // Demo toggles — simulate every upstream signal the orchestrator needs.
  const [bloomInteractive, setBloomInteractive] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userClicked, setUserClicked] = useState(false);
  const [panelOpenedOnce, setPanelOpenedOnce] = useState(false);
  const [insightsReadCount, setInsightsReadCount] = useState(0);
  const [filterIconHovered, setFilterIconHovered] = useState(false);
  const [listToggleHovered, setListToggleHovered] = useState(false);
  const [coachingBarPresent, setCoachingBarPresent] = useState(false);
  const [firstCloseTs, setFirstCloseTs] = useState<number | null>(null);
  const [panelModeKind, setPanelModeKind] =
    useState<'overview' | 'insight'>('overview');
  const [lastInteractionTs, setLastInteractionTs] = useState<number>(0);

  // For forcing h4 within demo timing we let users lower the threshold.
  const [h4Threshold, setH4Threshold] = useState(5 * 60 * 1000);

  const panelMode: PanelMode = useMemo<PanelMode>(
    () =>
      panelModeKind === 'insight'
        ? { kind: 'insight', sentenceId: 'p1s1', tab: 'insights' }
        : { kind: 'overview' },
    [panelModeKind],
  );

  const orient = useOrientation({
    bloomInteractive,
    insightsReadCount,
    panelMode,
    panelOpenedOnce,
    firstInsightCloseTimestamp: firstCloseTs,
    listToggleHovered,
    filterIconHovered,
    userClicked,
    reducedMotion,
    coachingBarPresent,
    lastInteractionTs,
    h4ThresholdMs: h4Threshold,
  });

  const sr = useScreenReaderOrientation({
    bloomInteractive,
    autoSelectedSentenceId: bloomInteractive ? 'p1s1' : null,
    hintShown: orient.activeHint,
    reducedMotion,
    annotationCount: 12,
    paragraphOfSentence: () => 1,
  });

  // Anchors — one DOM ref per hint target.
  const panelAnchorRef = useRef<HTMLDivElement | null>(null);
  const toolbarFilterAnchorRef = useRef<HTMLButtonElement | null>(null);
  const panelTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const coachingBarAnchorRef = useRef<HTMLDivElement | null>(null);
  const toolbarListAnchorRef = useRef<HTMLButtonElement | null>(null);

  const anchorRefForHint = useCallback(
    (anchor: HintAnchor) => {
      switch (anchor) {
        case 'panel':
          return panelAnchorRef;
        case 'toolbar-filter':
          return toolbarFilterAnchorRef;
        case 'panel-tabs':
          return panelTabsAnchorRef;
        case 'coaching-bar':
          return coachingBarAnchorRef;
        case 'toolbar-list':
          return toolbarListAnchorRef;
      }
    },
    [],
  );

  const simulateClick = useCallback(() => {
    setUserClicked(true);
    setLastInteractionTs(Date.now());
    setPanelOpenedOnce(true);
    setPanelModeKind('insight');
  }, []);

  const simulateIdleReset = useCallback(() => {
    setUserClicked(false);
    setLastInteractionTs(Date.now());
  }, []);

  const simulateFirstClose = useCallback(() => {
    setFirstCloseTs(Date.now());
    setPanelModeKind('overview');
  }, []);

  const incrementInsightsRead = useCallback(() => {
    setInsightsReadCount((c) => c + 1);
  }, []);

  const resetAll = useCallback(() => {
    orient.resetAllHintsForDemo();
    setUserClicked(false);
    setPanelOpenedOnce(false);
    setInsightsReadCount(0);
    setFilterIconHovered(false);
    setListToggleHovered(false);
    setFirstCloseTs(null);
    setPanelModeKind('overview');
    setLastInteractionTs(0);
  }, [orient]);

  // Storage diagnostics — recompute on every render so the "seen?"
  // indicators stay current with demo interactions.
  const storageState = useMemo(() => {
    const rows = HINT_ORDER.map((id) => ({
      id,
      key: HINT_REGISTRY[id].localStorageKey,
      seen: readHintSeen(HINT_REGISTRY[id].localStorageKey),
    }));
    return {
      hints: rows,
      keyboardFooterSeen: readHintSeen(KEYBOARD_FOOTER_STORAGE_KEY),
    };
  }, [orient.activeHint, orient.keyboardShortcutFooterVisible, reducedMotion]);

  const activeHintAnchor = orient.activeHint
    ? anchorRefForHint(orient.activeHint.anchor)
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(220 15% 97%)',
        fontFamily: TYPOGRAPHY.families.sans,
      }}
    >
      {/* Aria-live region — host renders the SR announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          border: 0,
        }}
      >
        {sr.announcements.length > 0
          ? sr.announcements[sr.announcements.length - 1]
          : ''}
      </div>

      <Toolbar
        bloomInteractive={bloomInteractive}
        reducedMotion={reducedMotion}
        coachingBarPresent={coachingBarPresent}
        h4Threshold={h4Threshold}
        onBloomInteractiveChange={setBloomInteractive}
        onReducedMotionChange={setReducedMotion}
        onCoachingBarChange={setCoachingBarPresent}
        onH4ThresholdChange={setH4Threshold}
        onResetAll={resetAll}
        filterAnchorRef={toolbarFilterAnchorRef}
        listAnchorRef={toolbarListAnchorRef}
        onFilterHoverChange={setFilterIconHovered}
        onListHoverChange={setListToggleHovered}
      />

      <div
        style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'stretch' }}
      >
        {/* Editor stub column */}
        <div
          style={{
            flex: 1,
            padding: 16,
            background: 'white',
            borderRadius: 8,
            border: '1px solid hsl(220 15% 92%)',
            minHeight: 420,
          }}
        >
          <Label>Editor (stub)</Label>
          <p style={{ marginTop: 8, color: 'hsl(220 15% 35%)' }}>
            This is a pretend essay. Workstream K doesn&rsquo;t render
            the real editor — we just expose a button that simulates a
            sentence click so the orientation triggers can be walked
            through step by step.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PrimaryButton onClick={simulateClick}>
              Simulate sentence click
            </PrimaryButton>
            <SecondaryButton onClick={incrementInsightsRead}>
              Increment insights read ({insightsReadCount})
            </SecondaryButton>
            <SecondaryButton onClick={simulateIdleReset}>
              Simulate idle reset (re-arm 12s)
            </SecondaryButton>
            <SecondaryButton onClick={simulateFirstClose}>
              Simulate first panel close
            </SecondaryButton>
            <SecondaryButton
              onClick={() =>
                setPanelModeKind((m) => (m === 'insight' ? 'overview' : 'insight'))
              }
            >
              Toggle panel mode ({panelMode.kind})
            </SecondaryButton>
          </div>

          {/* Start here chip — positioned in-flow for demo. */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <StartHereChip
              visible={bloomInteractive}
              targetSentenceId="p1s1"
              onClick={simulateClick}
              reducedMotion={reducedMotion}
              showInactivityPulse={orient.startHereChipInactivityPulse}
            />
            <span style={{ color: 'hsl(220 10% 50%)', fontSize: 12 }}>
              {orient.startHereChipInactivityPulse
                ? 'Pulse firing…'
                : userClicked
                  ? 'User has clicked (timer disabled)'
                  : `Idle clock armed (12s after ${lastInteractionTs ? 'last reset' : 'bloom'})`}
            </span>
          </div>
        </div>

        {/* Panel stub column */}
        <div
          ref={panelAnchorRef}
          style={{
            width: 360,
            padding: 16,
            background: 'rgba(248, 249, 251, 0.92)',
            backdropFilter: 'blur(18px) saturate(1.4)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 1px 4px rgba(15,20,40,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Label>Panel (stub)</Label>

          {/* Panel tabs anchor */}
          <div
            ref={panelTabsAnchorRef}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid hsl(220 15% 90%)',
              marginTop: 8,
            }}
          >
            <TabLabel active={panelMode.kind === 'insight'}>Insights</TabLabel>
            <TabLabel active={false} dim>Profile</TabLabel>
          </div>

          <div style={{ flex: 1, padding: '12px 0', color: 'hsl(220 15% 35%)' }}>
            {panelMode.kind === 'insight' ? (
              <>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'hsl(220 10% 55%)', textTransform: 'uppercase' }}>
                  CRITIQUE
                </div>
                <p style={{ margin: '6px 0 0 0', lineHeight: 1.5 }}>
                  Stubbed insight content — the real card is Workstream F.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, lineHeight: 1.5, color: 'hsl(220 10% 50%)' }}>
                Overview mode. Click a sentence to open an insight.
              </p>
            )}
          </div>

          {/* Keyboard shortcut footer */}
          <KeyboardShortcutFooter
            visible={orient.keyboardShortcutFooterVisible}
            onDismiss={orient.dismissKeyboardShortcutFooter}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* Coaching bar stub — only rendered when coachingBarPresent */}
      {coachingBarPresent ? (
        <div
          ref={coachingBarAnchorRef}
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid hsl(220 15% 90%)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            color: 'hsl(220 10% 50%)',
            fontSize: 12,
            zIndex: Z_LAYER.panel,
          }}
        >
          Coaching bar (stub)
        </div>
      ) : null}

      {/* Active hint renderer */}
      {orient.activeHint && activeHintAnchor ? (
        <AmbientHint
          hint={orient.activeHint}
          anchorRef={activeHintAnchor}
          visible={true}
          onDismiss={() => orient.dismissHint(orient.activeHint!.id)}
          onActionTaken={() =>
            orient.consumeHintThroughAction(orient.activeHint!.id)
          }
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/* Diagnostics panel — dev-only, remove for production. */}
      <Diagnostics
        activeHint={orient.activeHint?.id ?? null}
        storage={storageState}
        announcements={sr.announcements}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  readonly bloomInteractive: boolean;
  readonly reducedMotion: boolean;
  readonly coachingBarPresent: boolean;
  readonly h4Threshold: number;
  readonly onBloomInteractiveChange: (v: boolean) => void;
  readonly onReducedMotionChange: (v: boolean) => void;
  readonly onCoachingBarChange: (v: boolean) => void;
  readonly onH4ThresholdChange: (v: number) => void;
  readonly onResetAll: () => void;
  readonly filterAnchorRef: React.RefObject<HTMLButtonElement>;
  readonly listAnchorRef: React.RefObject<HTMLButtonElement>;
  readonly onFilterHoverChange: (v: boolean) => void;
  readonly onListHoverChange: (v: boolean) => void;
}

function Toolbar(props: ToolbarProps): JSX.Element {
  const {
    bloomInteractive,
    reducedMotion,
    coachingBarPresent,
    h4Threshold,
    onBloomInteractiveChange,
    onReducedMotionChange,
    onCoachingBarChange,
    onH4ThresholdChange,
    onResetAll,
    filterAnchorRef,
    listAnchorRef,
    onFilterHoverChange,
    onListHoverChange,
  } = props;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid hsl(220 15% 90%)',
        fontSize: 13,
      }}
    >
      <strong style={{ marginRight: 8 }}>K · Orientation demo</strong>

      <Toggle
        checked={bloomInteractive}
        onChange={onBloomInteractiveChange}
        label="bloomInteractive"
      />
      <Toggle
        checked={reducedMotion}
        onChange={onReducedMotionChange}
        label="reducedMotion"
      />
      <Toggle
        checked={coachingBarPresent}
        onChange={onCoachingBarChange}
        label="coachingBarPresent (h4)"
      />

      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        h4 threshold (ms):
        <input
          type="number"
          value={h4Threshold}
          onChange={(e) => onH4ThresholdChange(Number(e.target.value) || 0)}
          style={{
            width: 100,
            padding: 2,
            border: '1px solid hsl(220 15% 90%)',
            borderRadius: 4,
            fontFamily: 'inherit',
          }}
        />
      </label>

      <span style={{ flex: 1 }} />

      {/* Filter icon anchor — hovering queues h2. */}
      <button
        ref={filterAnchorRef}
        type="button"
        onMouseEnter={() => onFilterHoverChange(true)}
        onMouseLeave={() => onFilterHoverChange(false)}
        onFocus={() => onFilterHoverChange(true)}
        onBlur={() => onFilterHoverChange(false)}
        style={toolbarIconStyle}
      >
        Filters
      </button>

      {/* List toggle anchor — hovering queues h5. */}
      <button
        ref={listAnchorRef}
        type="button"
        onMouseEnter={() => onListHoverChange(true)}
        onMouseLeave={() => onListHoverChange(false)}
        onFocus={() => onListHoverChange(true)}
        onBlur={() => onListHoverChange(false)}
        style={toolbarIconStyle}
      >
        List view
      </button>

      <button
        type="button"
        onClick={onResetAll}
        style={{
          ...toolbarIconStyle,
          background: 'hsl(220 15% 95%)',
          color: 'hsl(220 15% 25%)',
        }}
      >
        Reset hints
      </button>
    </div>
  );
}

const toolbarIconStyle: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid hsl(220 15% 90%)',
  background: 'white',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
};

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

interface DiagnosticsProps {
  readonly activeHint: HintId | null;
  readonly storage: {
    readonly hints: readonly { readonly id: HintId; readonly key: string; readonly seen: boolean }[];
    readonly keyboardFooterSeen: boolean;
  };
  readonly announcements: readonly string[];
}

function Diagnostics(props: DiagnosticsProps): JSX.Element {
  const { activeHint, storage, announcements } = props;
  return (
    <div
      style={{
        margin: '8px 16px 80px 16px',
        padding: 12,
        background: 'white',
        border: '1px solid hsl(220 15% 92%)',
        borderRadius: 8,
        fontSize: 12,
        color: 'hsl(220 15% 35%)',
      }}
    >
      <Label>Diagnostics (dev only)</Label>
      <div style={{ marginTop: 8 }}>
        <strong>Active hint:</strong> {activeHint ?? '(none)'}
      </div>
      <div style={{ marginTop: 6 }}>
        <strong>localStorage state:</strong>
        <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
          {storage.hints.map((h) => (
            <li key={h.id}>
              {h.id}: <code>{h.seen ? 'seen' : 'unseen'}</code>
            </li>
          ))}
          <li>
            keyboardFooter: <code>{storage.keyboardFooterSeen ? 'seen' : 'unseen'}</code>
          </li>
        </ul>
      </div>
      <div style={{ marginTop: 6 }}>
        <strong>SR announcement log:</strong>
        <ol style={{ margin: '4px 0 0 18px', padding: 0, maxHeight: 120, overflow: 'auto' }}>
          {announcements.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Toggle(props: {
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
  readonly label: string;
}): JSX.Element {
  return (
    <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

function PrimaryButton(props: {
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: 0,
        background: 'hsl(220 90% 55%)',
        color: 'white',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
    >
      {props.children}
    </button>
  );
}

function SecondaryButton(props: {
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid hsl(220 15% 90%)',
        background: 'white',
        color: 'hsl(220 15% 25%)',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
    >
      {props.children}
    </button>
  );
}

function Label(props: { readonly children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'hsl(220 10% 55%)',
      }}
    >
      {props.children}
    </div>
  );
}

function TabLabel(props: {
  readonly active: boolean;
  readonly dim?: boolean;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: props.active ? 600 : 500,
        color: props.dim ? 'hsl(220 10% 55%)' : 'hsl(220 15% 25%)',
        opacity: props.dim ? 0.45 : 1,
        paddingBottom: 6,
        borderBottom: props.active
          ? '2px solid hsl(220 90% 55%)'
          : '2px solid transparent',
      }}
    >
      {props.children}
    </div>
  );
}

