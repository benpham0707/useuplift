/**
 * Shadow Mode — Computational Analysis Shadow Runner
 *
 * Phase 1: Runs computational analyzers alongside existing LLM pipeline,
 * logging results for comparison without affecting any outputs.
 */

export {
  ComputationalShadowRunner,
  computationalShadowRunner,
  runShadowAnalysis,
  type ShadowRunInput,
  type ShadowRunLog,
  type ShadowWorkshopType,
  type DimensionComparison,
} from './computationalShadowRunner';
