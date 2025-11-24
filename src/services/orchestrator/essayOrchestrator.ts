import { PIQPromptType } from '../piq/types';
import { StudentProfile, EssayAnalysisResult } from './types';

// Universal Analyzers
import { analyzeVoiceStyle } from '../unified/features/voiceStyleAnalyzer_llm';
import { analyzeCraft } from '../unified/features/craftAnalyzer_llm';
import { analyzeSpecificity } from '../unified/features/specificityAnalyzer_llm';
import { analyzeNarrativeArc } from '../unified/features/narrativeArcAnalyzer_llm';
import { analyzeThematicCoherence } from '../unified/features/thematicCoherenceAnalyzer_llm';
import { analyzeOpeningHookV5 } from '../unified/features/openingHookAnalyzer_v5_hybrid';
import { analyzeVulnerability } from '../unified/features/vulnerabilityAnalyzer_llm';

// Dimension-Specific Analyzers
import { analyzeInitiativeLeadership } from '../unified/features/initiativeLeadershipAnalyzer_llm';
import { analyzeRoleClarity } from '../unified/features/roleClarityAnalyzer_llm';
import { analyzeCommunityImpact } from '../unified/features/communityImpactAnalyzer_llm';
import { analyzeIntellectualVitality } from '../unified/features/intellectualVitalityAnalyzer_llm';
import { analyzeIdentity } from '../unified/features/identityAnalyzer_llm';
import { analyzePersonalGrowth } from '../unified/features/personalGrowthAnalyzer_llm';
import { analyzeContextCircumstances } from '../unified/features/contextCircumstancesAnalyzer_llm';
import { analyzeFitTrajectory } from '../unified/features/fitTrajectoryAnalyzer_llm';

import { HolisticAnalyzer } from './holisticAnalyzer';

export class EssayOrchestrator {
  /**
   * Main entry point for essay analysis.
   * Routes the essay to the appropriate analyzers based on prompt type.
   */
  static async analyzeEssay(
    text: string, 
    promptType: PIQPromptType, 
    profile?: StudentProfile
  ): Promise<EssayAnalysisResult> {
    console.log(`[EssayOrchestrator] Starting analysis for ${promptType}...`);
    const startTime = Date.now();

    // 1. Define Universal Analyzers (Run for ALL essays)
    const safeRun = async (name: string, promise: Promise<any>) => {
      try {
        return await promise;
      } catch (e) {
        console.error(`[EssayOrchestrator] Analyzer '${name}' failed:`, e);
        return { error: 'Analysis failed', details: String(e) };
      }
    };

    const universalPromises = {
      voice: safeRun('Voice', analyzeVoiceStyle(text)),
      craft: safeRun('Craft', analyzeCraft(text)),
      specificity: safeRun('Specificity', analyzeSpecificity(text)),
      narrative_arc: safeRun('Narrative Arc', analyzeNarrativeArc(text)),
      thematic_coherence: safeRun('Thematic Coherence', analyzeThematicCoherence(text)),
      opening_hook: safeRun('Opening Hook', analyzeOpeningHookV5(text, { essayType: this.mapPromptTypeToHookType(promptType) })),
      vulnerability: safeRun('Vulnerability', analyzeVulnerability(text))
    };

    // 2. Define Dimension-Specific Analyzers based on Routing Logic
    const { primary, secondary } = this.getRouteForPrompt(text, promptType);

    // Wrap primary and secondary in safeRun
    const safePrimary: Record<string, Promise<any>> = {};
    for (const [key, promise] of Object.entries(primary)) {
      safePrimary[key] = safeRun(key, promise);
    }

    const safeSecondary: Record<string, Promise<any>> = {};
    for (const [key, promise] of Object.entries(secondary)) {
      safeSecondary[key] = safeRun(key, promise);
    }

    // 3. Execute all analysis in parallel
    // We separate them to construct the result object cleanly
    
    // Await Universal
    const [
      voiceResult, 
      craftResult, 
      specificityResult, 
      narrativeArcResult, 
      thematicResult,
      hookResult,
      vulnerabilityResult
    ] = await Promise.all([
      universalPromises.voice,
      universalPromises.craft,
      universalPromises.specificity,
      universalPromises.narrative_arc,
      universalPromises.thematic_coherence,
      universalPromises.opening_hook,
      universalPromises.vulnerability
    ]);

    // Await Primary & Secondary
    const primaryKeys = Object.keys(safePrimary);
    const primaryValues = await Promise.all(Object.values(safePrimary));
    const primaryResults: Record<string, any> = {};
    primaryKeys.forEach((key, index) => {
      primaryResults[key] = primaryValues[index];
    });

    const secondaryKeys = Object.keys(safeSecondary);
    const secondaryValues = await Promise.all(Object.values(safeSecondary));
    const secondaryResults: Record<string, any> = {};
    secondaryKeys.forEach((key, index) => {
      secondaryResults[key] = secondaryValues[index];
    });

    // 4. Construct Preliminary Report
    const result: EssayAnalysisResult = {
      metadata: {
        promptType,
        timestamp: new Date().toISOString(),
        wordCount: text.split(/\s+/).length
      },
      voice: voiceResult,
      craft: craftResult,
      specificity: specificityResult,
      narrative_arc: narrativeArcResult,
      thematic_coherence: thematicResult,
      opening_hook: hookResult,
      vulnerability: vulnerabilityResult,
      primary_dimensions: primaryResults,
      secondary_dimensions: secondaryResults
    };

    // 5. Holistic Analysis (Meta-Layer)
    // Runs AFTER the base analyzers to use their insights + profile data
    if (profile) {
      console.log('[EssayOrchestrator] Running Holistic Analyzer...');
      const holisticResult = await safeRun('Holistic Context', HolisticAnalyzer.analyze(text, profile, result));
      
      if (holisticResult && !holisticResult.error) {
        result.holistic_context = holisticResult;
      }
    }

    console.log(`[EssayOrchestrator] Analysis complete in ${Date.now() - startTime}ms`);
    return result;
  }

  /**
   * Maps PIQ Prompt Types to the "Essay Type" expected by the Hook Analyzer
   */
  private static mapPromptTypeToHookType(promptType: PIQPromptType): any {
    const map: Record<string, string> = {
      'piq1_leadership': 'leadership',
      'piq2_creative': 'creative',
      'piq3_talent': 'creative', // Talent is similar to creative
      'piq4_educational': 'challenge', // Opportunity/Barrier usually involves challenge
      'piq5_challenge': 'challenge',
      'piq6_academic': 'academic',
      'piq7_community': 'leadership', // Community often overlaps with leadership
      'piq8_open_ended': 'creative' // Default to creative for open ended
    };
    return map[promptType] || 'leadership';
  }

  /**
   * Returns the specific analyzers to run based on the routing table
   */
  private static getRouteForPrompt(text: string, promptType: PIQPromptType) {
    const primary: Record<string, Promise<any>> = {};
    const secondary: Record<string, Promise<any>> = {};

    switch (promptType) {
      case 'piq1_leadership':
        primary['initiative_leadership'] = analyzeInitiativeLeadership(text);
        primary['role_clarity'] = analyzeRoleClarity(text);
        secondary['community_impact'] = analyzeCommunityImpact(text);
        break;

      case 'piq2_creative':
        primary['intellectual_vitality'] = analyzeIntellectualVitality(text);
        primary['identity'] = analyzeIdentity(text);
        // Specificity is already in Universal
        break;

      case 'piq3_talent':
        primary['identity'] = analyzeIdentity(text);
        primary['personal_growth'] = analyzePersonalGrowth(text);
        secondary['intellectual_vitality'] = analyzeIntellectualVitality(text);
        break;

      case 'piq4_educational':
        primary['context_circumstances'] = analyzeContextCircumstances(text);
        primary['personal_growth'] = analyzePersonalGrowth(text);
        // Specificity is already in Universal
        break;

      case 'piq5_challenge':
        primary['personal_growth'] = analyzePersonalGrowth(text);
        primary['context_circumstances'] = analyzeContextCircumstances(text);
        // Narrative Arc is already in Universal
        break;

      case 'piq6_academic':
        primary['fit_trajectory'] = analyzeFitTrajectory(text); // Note: Missing intendedMajor currently
        primary['intellectual_vitality'] = analyzeIntellectualVitality(text);
        secondary['initiative_leadership'] = analyzeInitiativeLeadership(text);
        break;

      case 'piq7_community':
        primary['community_impact'] = analyzeCommunityImpact(text);
        primary['role_clarity'] = analyzeRoleClarity(text);
        secondary['identity'] = analyzeIdentity(text);
        break;

      case 'piq8_open_ended':
        primary['identity'] = analyzeIdentity(text);
        // Thematic Coherence is already in Universal
        // Specificity is already in Universal
        break;
        
      default:
        // Default fallback if prompt type is unknown
        console.warn(`[EssayOrchestrator] Unknown prompt type: ${promptType}. Running only Universal analyzers.`);
    }

    return { primary, secondary };
  }
}

