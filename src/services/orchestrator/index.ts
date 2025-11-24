import { EssayOrchestrator } from './essayOrchestrator';
import { HolisticAnalyzer } from './holisticAnalyzer';
import { StudentProfile, HolisticAnalysis, EssayAnalysisResult } from './types';
import { PIQPromptType } from '../piq/types';

export * from './types';
export { EssayOrchestrator } from './essayOrchestrator';
export { HolisticAnalyzer } from './holisticAnalyzer';

/**
 * Unified Entry Point for Full Application Analysis
 * 
 * This function orchestrates the entire pipeline:
 * 1. Analyzes the primary essay (Personal Statement)
 * 2. Runs the Holistic Analyzer (Profile + Essay)
 * 3. Returns the comprehensive "God-mode" insights
 */
export async function analyzeFullApplication(
  essayText: string,
  promptType: PIQPromptType,
  profile: StudentProfile
): Promise<{
  essayAnalysis: EssayAnalysisResult;
  holisticAnalysis: HolisticAnalysis;
}> {
  console.log('[Orchestrator] Starting Full Application Analysis...');
  
  // 1. Run Essay Analysis (includes Universal + Specialized Analyzers)
  const essayAnalysis = await EssayOrchestrator.analyzeEssay(essayText, promptType, profile);
  
  // 2. Run Holistic Analysis (Meta-Layer)
  // Note: analyzeEssay already calls HolisticAnalyzer internally if profile is provided,
  // but we might want to ensure we have the distinct object or run it explicitly if needed.
  // The current implementation of analyzeEssay attaches it to essayAnalysis.holistic_context.
  
  let holisticAnalysis = essayAnalysis.holistic_context;

  if (!holisticAnalysis) {
    console.log('[Orchestrator] Holistic context missing, running explicitly...');
    holisticAnalysis = await HolisticAnalyzer.analyze(essayText, profile, essayAnalysis);
  }

  return {
    essayAnalysis,
    holisticAnalysis
  };
}

