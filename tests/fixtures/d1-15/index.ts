// ============================================================================
// D-1.15 Fixture Harness — Public Re-exports
// ============================================================================
//
// Single import surface for the integration test:
//
//   import {
//     SCENARIO_1_SMALL_EDIT,
//     applyScenarioEdit,
//     buildIter1Profile,
//     expectedIter1MoveIds,
//     buildLanding,
//     buildFocusedAnalysisResult,
//   } from '../fixtures/d1-15';
//
// The `D1_15_SCENARIOS` array exports the full registry for parameterized
// tests. Per-scenario named exports support targeted assertions where the
// scenario shape needs to be referenced specifically.

export {
  D1_15_SCENARIOS,
  SCENARIO_1_SMALL_EDIT,
  SCENARIO_2_STRUCTURAL_REORDER,
  SCENARIO_3_PARAGRAPH_DELETE,
  SCENARIO_4_PARAGRAPH_INSERT,
  SCENARIO_5_MULTI_PARAGRAPH_CASCADE,
  // [Phase-1 Items 1, 2, 3 closure 2026-04-30] Three additional scenarios
  // covering deferred edit shapes from docs/audit/phase-1-integrity-audit.md §6.
  SCENARIO_6_PARAGRAPH_MERGE,
  SCENARIO_7_PARAGRAPH_SPLIT,
  SCENARIO_8_TRANSFORMATIVE_REWRITE,
  applyScenarioEdit,
  splitParagraphs,
  getEditedParagraphIndices,
  expectedEditSignificance,
} from './scenarios';
export type { Scenario, ScenarioEdit } from './scenarios';

export {
  buildL5Annotation,
  buildIter1L5Annotations,
  buildIter1L5Result,
  buildLanding,
  buildFocusedAnalysisResult,
} from './layerFixtures';

export {
  D1_15_ESSAY_ID,
  ITER1_STARTED_AT,
  ITER1_FINISHED_AT,
  buildIter1Profile,
  setupIter2,
  expectedIter1MoveIds,
} from './iter1Setup';
