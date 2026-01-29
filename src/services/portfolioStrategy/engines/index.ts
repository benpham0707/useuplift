/**
 * Portfolio Strategy Engines
 *
 * Central export for all PASS system analysis engines.
 * Each engine handles a specific aspect of the portfolio analysis pipeline.
 */

// ============================================================================
// COMPONENT EVALUATORS
// ============================================================================

// Academic Evaluation Engine
export {
  AcademicEvaluator,
  academicEvaluator,
} from './academicEvaluator';

// Activity Portfolio Analyzer
export {
  ActivityAnalyzer,
  activityAnalyzer,
} from './activityAnalyzer';

// Award & Recognition Evaluator
export {
  AwardEvaluator,
  awardEvaluator,
} from './awardEvaluator';

// ============================================================================
// SYNTHESIS & STRATEGY ENGINES
// ============================================================================

// Holistic Profile Synthesizer
export {
  HolisticSynthesizer,
  holisticSynthesizer,
} from './holisticSynthesizer';

// School Fit & Strategy Engine
export {
  SchoolFitEngine,
  schoolFitEngine,
} from './schoolFitEngine';

// Guidance & Action Engine
export {
  GuidanceEngine,
  guidanceEngine,
} from './guidanceEngine';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

// Portfolio Strategy Orchestrator (main entry point)
export {
  PortfolioStrategyOrchestrator,
  portfolioOrchestrator,
} from './portfolioOrchestrator';
