/**
 * PASS Orchestrator Module
 *
 * Exports the multi-stage portfolio analysis pipeline components.
 */

// Session Manager - export types first
export type {
  PASSSession,
  StageResult,
  LLMCallRecord,
  AccumulatedContext,
  SessionMetrics,
} from './sessionManager';

export {
  PASSSessionManager,
  passSessionManager,
} from './sessionManager';

// Context Accumulator
export type {
  StageContext,
  ContextSummary,
} from './contextAccumulator';

export {
  ContextAccumulator,
  createContextAccumulator,
  STAGE_DEPENDENCIES,
  STAGE_CONTEXT_LIMITS,
} from './contextAccumulator';

// Main Orchestrator
export { PASSOrchestrator, passOrchestrator } from './passOrchestrator';
