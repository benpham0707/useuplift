import { PIQPromptType } from '../piq/types';
import { StudentProfile, EssayAnalysisResult } from './types';
export declare class EssayOrchestrator {
    /**
     * Main entry point for essay analysis.
     * Routes the essay to the appropriate analyzers based on prompt type.
     */
    static analyzeEssay(text: string, promptType: PIQPromptType, profile?: StudentProfile): Promise<EssayAnalysisResult>;
    /**
     * Maps PIQ Prompt Types to the "Essay Type" expected by the Hook Analyzer
     */
    private static mapPromptTypeToHookType;
    /**
     * Returns the specific analyzers to run based on the routing table
     */
    private static getRouteForPrompt;
}
//# sourceMappingURL=essayOrchestrator.d.ts.map