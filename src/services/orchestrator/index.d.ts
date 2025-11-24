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
export declare function analyzeFullApplication(essayText: string, promptType: PIQPromptType, profile: StudentProfile): Promise<{
    essayAnalysis: EssayAnalysisResult;
    holisticAnalysis: HolisticAnalysis;
}>;
//# sourceMappingURL=index.d.ts.map