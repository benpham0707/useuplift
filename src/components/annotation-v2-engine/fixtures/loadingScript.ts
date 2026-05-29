// Workstream L — scripted mock of the Phase 4 SSE layer stream.
//
// Timings match `docs/ux_phases/phase_4_loading_state.md`:
//   §2.1 layer captions and §7 emotional journey map → fire rate.
//   §2.5 fast-path → minimum 600ms floor, ~2.5s total for focused
//                    re-analysis demos.
//   §2.2         → `paragraph_tints_ready` at L3.5 completion.
//   §2.8         → `reveal_ready` at L5 completion; Phase 5 hand-off.
//
// The real backend will emit the same event shapes over an EventSource
// (Phase 4 §6). This mock mimics that contract so the hooks in
// Workstream C (`useLoadingState`) can be built against a stable API
// and later re-wired with zero type churn.
//
// Subscription model: a single-subscriber dispatcher. Multi-subscribe
// is explicitly out of scope — the real SSE stream is fan-in via a
// React context, not a shared observable.

import type {
  LayerEvent,
  LayerName,
  MockLoadingStream,
  MockLoadingStreamOptions,
} from '../types/navigation';

// ---------------------------------------------------------------------------
// Timelines.
// ---------------------------------------------------------------------------

interface ScriptEntry {
  readonly t: number; // ms offset from stream start
  readonly build: (t: number) => LayerEvent;
}

/**
 * Full-pipeline timeline — matches task spec:
 *   L1     @     0ms
 *   L2     @  1500ms
 *   L2.5   @  3500ms
 *   L3     @  5000ms
 *   L3.75  @  9000ms ("Hearing your voice…")
 *   L3.5   @ 12500ms → fires paragraph_tints_ready
 *   L5     @ 16000ms → fires reveal_ready
 *   total  ~18000ms
 *
 * Each layer fires a `layer_start` at its anchor time and a
 * `layer_complete` at the next layer's start (or at the trailing edge
 * of the pipeline for L5). Heartbeats are inserted every 3000ms per
 * Phase 4 §6 guarantees.
 */
const FULL_TIMELINE: readonly ScriptEntry[] = buildTimeline([
  { t: 0, layer: 'L1' },
  { t: 1500, layer: 'L2' },
  { t: 3500, layer: 'L2.5' },
  { t: 5000, layer: 'L3' },
  { t: 9000, layer: 'L3.75' },
  { t: 12500, layer: 'L3.5', onComplete: 'paragraph_tints_ready' },
  { t: 16000, layer: 'L5', onComplete: 'reveal_ready', completeAt: 18000 },
]);

/**
 * Fast-path timeline — Phase 4 §2.5 focused re-analysis.
 * Collapses to ~2500ms total, with the 600ms motion-legibility floor
 * on the final dwell. Many layers are skipped (Phase 4 §2.5 says the
 * caption reads "Updating affected paragraphs…" instead of cycling
 * per-layer) — we still emit the events so the ribbon renderer can
 * fill its dots, but the caption stays as a single string (caption
 * copy is renderer-owned).
 *
 * Schedule:
 *   L3       @   0ms
 *   L3.5     @ 1200ms → paragraph_tints_ready
 *   L5       @ 1900ms → reveal_ready at 2500ms
 */
const FAST_TIMELINE: readonly ScriptEntry[] = buildTimeline([
  { t: 0, layer: 'L3' },
  { t: 1200, layer: 'L3.5', onComplete: 'paragraph_tints_ready' },
  { t: 1900, layer: 'L5', onComplete: 'reveal_ready', completeAt: 2500 },
]);

// ---------------------------------------------------------------------------
// Timeline builder.
// ---------------------------------------------------------------------------

interface LayerSpec {
  readonly t: number;
  readonly layer: LayerName;
  /** Optional side-event fired at completion. */
  readonly onComplete?: 'paragraph_tints_ready' | 'reveal_ready';
  /**
   * If omitted, the completion time is the next spec's `t` (i.e. layers
   * complete when the next one starts). For the last layer, `completeAt`
   * MUST be specified.
   */
  readonly completeAt?: number;
}

function buildTimeline(specs: readonly LayerSpec[]): readonly ScriptEntry[] {
  const out: ScriptEntry[] = [];
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!;
    const completeAt =
      spec.completeAt ?? specs[i + 1]?.t ?? spec.t; // last without completeAt is a spec error; caller must set

    // layer_start at spec.t
    out.push({
      t: spec.t,
      build: (t) => ({ type: 'layer_start', layer: spec.layer, t }),
    });

    // layer_complete at completeAt
    out.push({
      t: completeAt,
      build: (t) => ({ type: 'layer_complete', layer: spec.layer, t }),
    });

    if (spec.onComplete === 'paragraph_tints_ready') {
      out.push({
        t: completeAt,
        build: (t) => ({ type: 'paragraph_tints_ready', t }),
      });
    } else if (spec.onComplete === 'reveal_ready') {
      out.push({
        t: completeAt,
        build: (t) => ({ type: 'reveal_ready', t }),
      });
    }
  }

  // Heartbeats every 3000ms, up through the last event.
  const lastT = Math.max(...out.map((e) => e.t));
  for (let t = 3000; t <= lastT; t += 3000) {
    out.push({ t, build: (nt) => ({ type: 'heartbeat', t: nt }) });
  }

  // Stable sort by t (preserving insertion order for identical t).
  // We build a stable sort via map-with-index → sort → unmap.
  const indexed = out.map((entry, idx) => ({ entry, idx }));
  indexed.sort((a, b) => a.entry.t - b.entry.t || a.idx - b.idx);
  return indexed.map((x) => x.entry);
}

// ---------------------------------------------------------------------------
// Stream factory.
// ---------------------------------------------------------------------------

/**
 * Create a scripted `LayerEvent` stream that mirrors the contract of
 * the real Phase 4 SSE endpoint.
 *
 * Usage:
 * ```ts
 * const stream = createMockLoadingStream();
 * const unsubscribe = stream.events$((event) => {
 *   // dispatch into useLoadingState reducer
 * });
 * // ...later, to abort:
 * stream.cancel();
 * ```
 *
 * Subscribing AFTER events have already fired will miss them — the
 * stream is hot, matching real SSE semantics. Workstream C's hook is
 * expected to subscribe immediately on mount.
 */
export function createMockLoadingStream(
  opts: MockLoadingStreamOptions = {},
): MockLoadingStream {
  const timeline = opts.fastPath ? FAST_TIMELINE : FULL_TIMELINE;

  let listener: ((event: LayerEvent) => void) | null = null;
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const started = Date.now();

  const schedule = () => {
    for (const entry of timeline) {
      const timer = setTimeout(() => {
        if (cancelled || !listener) return;
        const elapsed = Date.now() - started;
        listener(entry.build(elapsed));
      }, entry.t);
      timers.push(timer);
    }
  };

  return {
    events$: (l) => {
      if (listener) {
        // Single-subscriber contract — second subscribe replaces first.
        listener = l;
      } else {
        listener = l;
        schedule();
      }
      return () => {
        if (listener === l) {
          listener = null;
        }
      };
    },
    cancel: () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
      timers.length = 0;
      listener = null;
    },
  };
}

/**
 * Expose the raw timeline arrays as a read-only export for tests or
 * the Phase 4 Storybook story that wants to render the sequence
 * without firing timers.
 */
export const MOCK_TIMELINES: {
  readonly full: readonly Readonly<{ t: number; event: LayerEvent }>[];
  readonly fast: readonly Readonly<{ t: number; event: LayerEvent }>[];
} = {
  full: FULL_TIMELINE.map((e) => ({ t: e.t, event: e.build(e.t) })),
  fast: FAST_TIMELINE.map((e) => ({ t: e.t, event: e.build(e.t) })),
};
