/**
 * Surgical Workshop Orchestrator
 *
 * The "Brain" of the Accordion UI.
 * Coordinates the end-to-end flow from raw essay -> specific workshop items.
 *
 * Pipeline:
 * 1. Holistic Analysis (Theme/Intent)
 * 2. Voice Fingerprint (Identity)
 * 3. Rubric Scoring (13-Dimension Evaluation)
 * 4. Locator Bridge (Mapping Scores -> Text Locations)
 * 5. Surgical Editor (Generating Micro-Edits)
 */

import { NarrativeEssayInput, WorkshopItem, NarrativeWorkshopAnalysis } from './types';
import { analyzeHolisticUnderstanding } from './stage1_holisticUnderstanding';
import { analyzeVoiceFingerprint } from './analyzers/voiceFingerprintAnalyzer';
import { analyzeExperienceFingerprint, ExperienceFingerprint } from './analyzers/experienceFingerprintAnalyzer';
import { getRubricScores } from './analyzers/rubricAnalysisService';
import { scoreWithRubric, RubricScoringResult } from '@/core/essay/analysis/features/rubricScorer';
import { findAllLocators, DetectedLocator } from './analyzers/locatorAnalyzers';
import { generateSurgicalFixes } from './surgicalEditor_v2';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export interface SurgicalWorkshopResult {
  analysisId: string;
  overallScore: number; // NQI
  voiceFingerprint: any;
  experienceFingerprint?: ExperienceFingerprint; // Phase 17: Unique experience elements
  workshopItems: WorkshopItem[];
  rubricResult: RubricScoringResult;
  performanceMetrics: {
    totalMs: number;
    stages: Record<string, number>;
  };
}

export async function runSurgicalWorkshop(
  input: NarrativeEssayInput
): Promise<SurgicalWorkshopResult> {
  console.log('\n🚀 STARTING SURGICAL WORKSHOP ORCHESTRATION');
  const startTotal = Date.now();
  const stages: Record<string, number> = {};

  try {
    // 1. Holistic Analysis (Parallel with Voice)
    console.log('Step 1: Holistic Understanding & Voice Fingerprint...');
    const t1 = Date.now();
    const [holistic, voice] = await Promise.all([
      analyzeHolisticUnderstanding(input),
      analyzeVoiceFingerprint(input.essayText)
    ]);
    stages.holistic_voice = Date.now() - t1;

    // 1.5. Experience Fingerprint (Phase 17 - Anti-Convergence)
    console.log('Step 1.5: Experience Fingerprint (extracting unique elements)...');
    const t15 = Date.now();
    const experienceFingerprint = await analyzeExperienceFingerprint(
      input.essayText,
      voice,
      holistic
    );
    stages.experience_fingerprint = Date.now() - t15;

    // Log anti-pattern warnings if detected
    if (experienceFingerprint.antiPatternFlags) {
      const flags = experienceFingerprint.antiPatternFlags;
      const warnings: string[] = [];
      if (flags.followsTypicalArc) warnings.push('typical-arc');
      if (flags.hasGenericInsight) warnings.push('generic-insight');
      if (flags.hasManufacturedBeat) warnings.push('manufactured-beat');
      if (flags.hasCrowdPleaser) warnings.push('crowd-pleaser');

      if (warnings.length > 0) {
        console.log(`   ⚠️ Convergence risks: ${warnings.join(', ')}`);
      }
    }

    // 2. Rubric Scoring (The Heavy Lifting)
    console.log('Step 2: Rubric Scoring (13 Dimensions)...');
    const t2 = Date.now();
    const rawScores = await getRubricScores(input, holistic);
    
    // Deterministic Scorer (Apply Interaction Rules)
    const rubricResult = scoreWithRubric(rawScores, input.essayText);
    stages.rubric_scoring = Date.now() - t2;
    console.log(`   EQI Score: ${rubricResult.essay_quality_index}/100`);

    // 3. Locator Bridge (Map Scores to Text)
    console.log('Step 3: Locating Issues...');
    const t3 = Date.now();
    const allLocators = findAllLocators(input.essayText, rubricResult);
    stages.locators = Date.now() - t3;
    console.log(`   Found ${allLocators.length} potential issues.`);

    // 4. Prioritization & Filtering
    // We want the top 5 most critical issues to avoid overwhelming the user.
    const prioritizedLocators = prioritizeLocators(allLocators);
    console.log(`   Prioritized top ${prioritizedLocators.length} issues for surgical editing.`);

    // 5. Surgical Editor (Generate Fixes with Experience Fingerprint)
    console.log('Step 4: Generating Surgical Fixes (with anti-convergence)...');
    const t4 = Date.now();
    const itemPromises = prioritizedLocators.map(locator =>
      generateSurgicalFixes(
        locator,
        voice,
        input.essayText,
        holistic,
        rubricResult.essay_quality_index,
        undefined, // preComputedDiagnosis
        experienceFingerprint // Phase 17: Pass experience fingerprint
      )
    );
    const workshopItems = await Promise.all(itemPromises);
    stages.surgical_editor = Date.now() - t4;

    const totalMs = Date.now() - startTotal;
    console.log(`✅ WORKSHOP COMPLETE in ${totalMs}ms\n`);

    return {
      analysisId: uuidv4(),
      overallScore: rubricResult.essay_quality_index,
      voiceFingerprint: voice,
      experienceFingerprint, // Phase 17: Include in result
      workshopItems,
      rubricResult,
      performanceMetrics: {
        totalMs,
        stages
      }
    };

  } catch (error) {
    console.error('❌ SURGICAL WORKSHOP FAILED:', error);
    throw error;
  }
}

// ============================================================================
// PRIORITIZATION LOGIC
// ============================================================================

function prioritizeLocators(locators: DetectedLocator[]): DetectedLocator[] {
  // 1. Sort by Severity (Critical > Warning > Optimization)
  const severityScore = { critical: 3, warning: 2, optimization: 1 };
  
  const sorted = [...locators].sort((a, b) => {
    const scoreA = severityScore[a.severity];
    const scoreB = severityScore[b.severity];
    return scoreB - scoreA; // Descending
  });

  // 2. Deduplicate overlapping ranges
  // If two issues cover the same text, keep the higher severity one.
  const unique: DetectedLocator[] = [];
  
  for (const loc of sorted) {
    const isOverlap = unique.some(existing => 
      // Check if start index is within 10 chars of existing
      Math.abs(existing.startIndex - loc.startIndex) < 10
    );
    
    if (!isOverlap) {
      unique.push(loc);
    }
  }

  // 3. Return Top 5
  return unique.slice(0, 5);
}

