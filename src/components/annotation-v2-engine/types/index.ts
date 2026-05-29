// Workstream L — public surface.
//
// Consumers import from `@/components/annotation-v2/types`. They
// should never reach past this barrel into `./profile`, `./navigation`,
// etc. — keeping the barrel the single surface makes the Workstream A
// re-export of `Tier` from `../tokens.ts` a one-file change.

export type { Tier } from './tier';
export { TIER_CSS_VAR } from './tier';

export type {
  // Core profile
  EssayProfile,
  Paragraph,
  ParagraphRole,
  SentenceProfile,
  Understanding,

  // Annotations (L5) + cross-refs + rewrites
  Annotation,
  AnnotationType,
  AnnotationPriority,
  CrossRef,
  RewriteSuggestion,

  // Holistic + North Star + phase
  HolisticSynthesis,
  NorthStar,
  ImprovementPhase,

  // Overview (Phase 5 §2.3)
  OverviewData,
  SentencePullQuote,
} from './profile';

export type {
  // Smart order / nav
  SmartOrderedSentenceId,
  SmartOrderedQueueEntry,

  // Jump-back stack
  NavStack,
  NavStackEntry,

  // Viewed state + re-analysis badges
  ViewedState,
  ViewedRecord,
  CloseReason,
  NewnessBadge,

  // Filters + list config + histogram
  FilterState,
  ListGrouping,
  ListSorting,
  ListConfig,
  TierHistogramBucket,

  // SSE layer events
  LayerName,
  LayerEvent,

  // Mock loading stream
  MockLoadingStreamOptions,
  MockLoadingStream,
} from './navigation';

export { NAV_STACK_MAX_DEPTH, FILTER_STATE_ALL_OFF } from './navigation';

// Fixtures are re-exported from the same barrel so demo code can do
// `import { sampleProfile, createMockLoadingStream } from '.../types'`
// per the task spec. The implementations live under `../fixtures/`.
export { sampleProfile, sampleEssayText } from '../fixtures/sampleProfile';
export { createMockLoadingStream, MOCK_TIMELINES } from '../fixtures/loadingScript';
