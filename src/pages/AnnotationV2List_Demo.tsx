/**
 * Workstream I demo — `/annotation-v2-demo/list`.
 *
 * Exercises ListView inside PanelShell, with a placeholder editor
 * column and the Minimap stripe at the editor's right edge.
 *
 * Demonstrates:
 *   - Filter chip toggling (AND composition)
 *   - Sort switch (priority ↔ document order)
 *   - Grouping switch (paragraph ↔ tier ↔ type)
 *   - Reduced-motion collapse
 *   - List-row hover brightening the matching minimap block
 *   - Click logs the target sentence (no actual insight-mode push)
 */

import { useMemo, useState } from 'react';

import {
  PanelShell,
  usePanelMode,
  type PanelMode,
} from '@/components/annotation-v2-engine/panel';
import {
  ListView,
  ListToolbarToggle,
  Minimap,
} from '@/components/annotation-v2-engine/list';
import type {
  FilterState,
  ListGrouping,
  ListSorting,
  ViewedState,
} from '@/components/annotation-v2-engine/types/navigation';
import { sampleProfile } from '@/components/annotation-v2-engine/fixtures/sampleProfile';
import '@/components/annotation-v2/workshop.css';

const EMPTY_FILTER: FilterState = {
  critical: false,
  unreviewed: false,
  strengths: false,
};

export default function AnnotationV2ListDemo() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [sort, setSort] = useState<ListSorting>('priority');
  const [grouping, setGrouping] = useState<ListGrouping>('paragraph');
  const [hoverSentenceId, setHoverSentenceId] = useState<string | null>(null);
  const [clickLog, setClickLog] = useState<string[]>([]);

  // Empty viewed state so every row reads as unreviewed.
  const viewed = useMemo<ViewedState>(() => new Map(), []);

  const panel = usePanelMode({
    initial: {
      kind: 'list',
      filter: EMPTY_FILTER,
      sort: 'priority',
    },
  });

  // Keep panel mode in sync with the filter/sort the ListView drives.
  // (In production, the host holds a single source of truth; here the
  // demo lets both panel+local state exist so we can show the toggle
  // flipping between overview and list.)
  const setPanelMode = (next: PanelMode) => panel.setMode(next);

  const handleFilterChange = (next: FilterState) => {
    setFilter(next);
    if (panel.mode.kind === 'list') {
      setPanelMode({ kind: 'list', filter: next, sort });
    }
  };
  const handleSortChange = (next: ListSorting) => {
    setSort(next);
    if (panel.mode.kind === 'list') {
      setPanelMode({ kind: 'list', filter, sort: next });
    }
  };

  const handleSelect = (sentenceId: string) => {
    setClickLog((prev) =>
      [`would jump to ${sentenceId}`, ...prev].slice(0, 6),
    );
  };

  const handleToggleList = () => {
    if (panel.mode.kind === 'list') {
      setPanelMode({ kind: 'overview' });
    } else {
      setPanelMode({ kind: 'list', filter, sort });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(220 15% 97%)' }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: 'hsl(220 15% 90%)',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
        }}
      >
        <span style={{ color: 'hsl(220 10% 40%)' }}>Panel mode:</span>
        <ListToolbarToggle
          active={panel.mode.kind === 'list'}
          onToggle={handleToggleList}
        />
        <span style={{ color: 'hsl(220 20% 30%)', fontWeight: 500 }}>
          {panel.mode.kind}
        </span>

        <div
          style={{
            width: 1,
            height: 20,
            background: 'hsl(220 15% 88%)',
            margin: '0 6px',
          }}
        />

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.currentTarget.checked)}
          />
          <span>reducedMotion</span>
        </label>

        {clickLog.length > 0 ? (
          <div
            style={{
              marginLeft: 'auto',
              color: 'hsl(220 10% 45%)',
              fontSize: '11px',
            }}
          >
            <strong style={{ color: 'hsl(220 15% 30%)' }}>clicks:</strong>{' '}
            {clickLog.slice(0, 3).join(' · ')}
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main split                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex">
        {/* Editor placeholder with minimap stripe */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            padding: '24px 40px',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
            color: 'hsl(220 15% 30%)',
            overflowY: 'auto',
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
              Editor column
            </div>
            {sampleProfile.paragraphs.map((p) => (
              <p
                key={p.index}
                style={{
                  lineHeight: 1.65,
                  margin: '0 0 18px 0',
                  fontFamily: '"ECRM", "Source Serif 4", Georgia, serif',
                  fontSize: '15px',
                }}
              >
                {p.text}
              </p>
            ))}
          </div>
          {/* Minimap only while list mode is active */}
          {panel.mode.kind === 'list' ? (
            <Minimap
              profile={sampleProfile}
              onSentenceClick={handleSelect}
              hoveredSentenceId={hoverSentenceId}
            />
          ) : null}
        </div>

        {/* Panel */}
        <PanelShell
          mode={panel.mode}
          selectedSentenceId={null}
          profile={sampleProfile}
          visible={true}
          reducedMotion={reducedMotion}
          insightsReadCount={0}
          onModeChange={panel.setMode}
          onSelectSentence={handleSelect}
          listSlot={
            <ListView
              profile={sampleProfile}
              filter={filter}
              sort={sort}
              grouping={grouping}
              viewed={viewed}
              reducedMotion={reducedMotion}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onGroupingChange={setGrouping}
              onSelectSentence={handleSelect}
              onHoverSentence={setHoverSentenceId}
            />
          }
        />
      </div>
    </div>
  );
}
