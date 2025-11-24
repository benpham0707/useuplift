/**
 * HOLISTIC APPLICATION ANALYZER
 *
 * The "Meta-Brain" of the Admissions System.
 *
 * Goal: Simulate an elite admissions officer who doesn't just read the essay in a vacuum,
 * but reads it alongside the student's entire file (grades, activities, demographics).
 *
 * Now enhanced to drive the "Profile Insights" UI with rich, candidate-based generation.
 */
import { StudentProfile, EssayAnalysisResult, HolisticAnalysis } from './types';
export declare class HolisticAnalyzer {
    static analyze(essayText: string, profile: StudentProfile, essayAnalysis: EssayAnalysisResult): Promise<HolisticAnalysis>;
}
//# sourceMappingURL=holisticAnalyzer.d.ts.map