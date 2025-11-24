/**
 * ANALYZER WRAPPER
 *
 * Clean re-exports of all analyzers used by the PIQ orchestrator.
 * We use dynamic imports to avoid duplicate export errors from existing files.
 */

export type { HookAnalysisResult } from '../../../../src/services/unified/features/openingHookAnalyzer_v5_hybrid.js';
export type { VulnerabilityAnalysis } from '../../../../src/services/unified/features/vulnerabilityAnalyzer_v3.js';
export type { SpecificityAnalysis } from '../../../../src/services/unified/features/specificityAnalyzer.js';
export type { TransformationAnalysis } from '../../../../src/services/unified/features/transformationAnalyzer.js';

// Phase 3 analyzer types
export type { RoleOwnershipAnalysis } from '../../../../src/services/unified/features/roleOwnershipAnalyzer.js';
export type { ContextCircumstancesAnalysis } from '../../../../src/services/unified/features/contextCircumstancesAnalyzer.js';
export type { VoiceStyleAnalysis } from '../../../../src/services/unified/features/voiceStyleAnalyzer.js';
export type { InitiativeLeadershipAnalysis } from '../../../../src/services/unified/features/initiativeLeadershipAnalyzer.js';
export type { FitTrajectoryAnalysis } from '../../../../src/services/unified/features/fitTrajectoryAnalyzer.js';

// Dynamic imports to avoid esbuild duplicate export errors
export async function analyzeOpeningHookV5(...args: any[]) {
  const { analyzeOpeningHookV5 } = await import('../../../../src/services/unified/features/openingHookAnalyzer_v5_hybrid.js');
  return analyzeOpeningHookV5(...args);
}

export async function analyzeVulnerability(...args: any[]) {
  const { analyzeVulnerability } = await import('../../../../src/services/unified/features/vulnerabilityAnalyzer_v3.js');
  return analyzeVulnerability(...args);
}

export async function analyzeStakesTension(...args: any[]) {
  const { analyzeStakesTension } = await import('../../../../src/services/narrativeWorkshop/stage2_deepDive/stakesTensionAnalyzer.js');
  return analyzeStakesTension(...args);
}

export async function analyzeClimaxTurningPoint(...args: any[]) {
  const { analyzeClimaxTurningPoint } = await import('../../../../src/services/narrativeWorkshop/stage2_deepDive/climaxTurningPointAnalyzer.js');
  return analyzeClimaxTurningPoint(...args);
}

export async function analyzeQuotableReflection(...args: any[]) {
  const { analyzeQuotableReflection } = await import('../../../../src/services/unified/features/quotableReflectionAnalyzer.js');
  return analyzeQuotableReflection(...args);
}

export async function analyzeConclusionReflection(...args: any[]) {
  const { analyzeConclusionReflection } = await import('../../../../src/services/narrativeWorkshop/stage2_deepDive/conclusionReflectionAnalyzer.js');
  return analyzeConclusionReflection(...args);
}

export async function analyzeCharacterDevelopment(...args: any[]) {
  const { analyzeCharacterDevelopment } = await import('../../../../src/services/narrativeWorkshop/stage2_deepDive/characterDevelopmentAnalyzer.js');
  return analyzeCharacterDevelopment(...args);
}

export async function analyzeIntellectualDepth(...args: any[]) {
  const { analyzeIntellectualDepth } = await import('../../../../src/services/unified/features/intellectualDepthAnalyzer.js');
  return analyzeIntellectualDepth(...args);
}

export async function analyzeVividness(...args: any[]) {
  const { analyzeVividness } = await import('../../../../src/services/unified/features/vividnessAnalyzer.js');
  return analyzeVividness(...args);
}

export async function analyzeSpecificity(...args: any[]) {
  const { analyzeSpecificity } = await import('../../../../src/services/unified/features/specificityAnalyzer.js');
  return analyzeSpecificity(...args);
}

export async function analyzeTransformation(...args: any[]) {
  const { analyzeTransformation } = await import('../../../../src/services/unified/features/transformationAnalyzer.js');
  return analyzeTransformation(...args);
}

// Phase 3 analyzers
export async function analyzeRoleOwnership(...args: any[]) {
  const { analyzeRoleOwnership } = await import('../../../../src/services/unified/features/roleOwnershipAnalyzer.js');
  return analyzeRoleOwnership(...args);
}

export async function analyzeContextCircumstances(...args: any[]) {
  const { analyzeContextCircumstances } = await import('../../../../src/services/unified/features/contextCircumstancesAnalyzer.js');
  return analyzeContextCircumstances(...args);
}

export async function analyzeVoiceStyle(...args: any[]) {
  const { analyzeVoiceStyle } = await import('../../../../src/services/unified/features/voiceStyleAnalyzer.js');
  return analyzeVoiceStyle(...args);
}

export async function analyzeInitiativeLeadership(...args: any[]) {
  const { analyzeInitiativeLeadership } = await import('../../../../src/services/unified/features/initiativeLeadershipAnalyzer.js');
  return analyzeInitiativeLeadership(...args);
}

export async function analyzeFitTrajectory(...args: any[]) {
  const { analyzeFitTrajectory } = await import('../../../../src/services/unified/features/fitTrajectoryAnalyzer.js');
  return analyzeFitTrajectory(...args);
}
