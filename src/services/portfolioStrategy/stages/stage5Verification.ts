/**
 * Stage 5: Verification & Consistency Layer
 *
 * Ensures all recommendations are:
 * - Internally consistent (no contradictions)
 * - Realistic (not recommending impossible workloads)
 * - Calibrated (scores align with evidence)
 * - Complete (no critical gaps)
 *
 * Uses Sonnet for nuanced verification that catches subtle issues.
 */

import { callClaude } from '../../../lib/llm/claude';

// ============================================================================
// VERIFICATION FRAMEWORKS
// ============================================================================

/**
 * Consistency check categories
 */
export const CONSISTENCY_CHECKS = {
  narrative_consistency: {
    name: 'Narrative Consistency',
    description: 'Do all recommendations support the same student narrative?',
    checkPoints: [
      'Activity recommendations align with stated spike',
      'Essay topics reinforce rather than contradict narrative',
      'School recommendations fit the student archetype',
      'Summer recommendations build toward stated goals',
    ],
  },

  timeline_feasibility: {
    name: 'Timeline Feasibility',
    description: 'Are recommended actions achievable in the timeframe?',
    checkPoints: [
      'Total recommended hours per week are realistic (<25 for most students)',
      'Deadlines are achievable given current date',
      'Progression of activities is logical',
      'No conflicting deadline recommendations',
    ],
    limits: {
      maxWeeklyActivityHours: 25,
      maxWeeklyCombinedHours: 40, // Including academics
      minSleepHoursAssumed: 7,
      realisticDailySchoolHours: 7,
    },
  },

  score_calibration: {
    name: 'Score Calibration',
    description: 'Do assigned scores align with evidence provided?',
    checkPoints: [
      'Harvard scores consistent across stages',
      'Character dimension scores match evidence',
      'Activity tiers consistent with achievements listed',
      'School fit scores reasonable given profile',
    ],
    calibrationRules: [
      'Score of 2 or better requires exceptional evidence',
      'Score of 4 or worse should note specific concerns',
      'Scores should not cluster unrealistically (all 3s)',
      'Academic and activity scores should be logically related',
    ],
  },

  recommendation_conflicts: {
    name: 'Recommendation Conflicts',
    description: 'Are there contradictory recommendations?',
    checkPoints: [
      'Not recommending increasing AND decreasing same activity',
      'Not recommending conflicting essay topics',
      'Not recommending both ED and multiple EAs if restricted',
      'School list balance makes sense for admit probabilities',
    ],
  },

  completeness: {
    name: 'Completeness',
    description: 'Are all critical areas addressed?',
    checkPoints: [
      'Testing strategy addressed if tests not complete',
      'Recommendation letter strategy included',
      'Financial considerations addressed if relevant',
      'Timeline includes all major milestones',
    ],
  },

  red_flag_addressing: {
    name: 'Red Flag Resolution',
    description: 'Are identified red flags addressed in recommendations?',
    checkPoints: [
      'Every high-severity red flag has mitigation strategy',
      'Recommendations don\'t introduce new red flags',
      'Authenticity concerns addressed in essay strategy',
      'Gaps in profile addressed with specific actions',
    ],
  },
};

/**
 * Realism checks
 */
export const REALISM_CHECKS = {
  workload: {
    name: 'Workload Realism',
    maxes: {
      weeklyActivityHours: 25,
      weeklyStudyHours: 15,
      weeklyWorkHours: 15,
      weeklyTotalExtraCurricular: 30,
    },
    flags: [
      'Recommending more than 3 major time commitments',
      'Suggesting founding organization while maintaining heavy load',
      'Adding activities without suggesting what to drop',
    ],
  },

  achievement: {
    name: 'Achievement Realism',
    flags: [
      'Suggesting tier jump of more than 1 in single year',
      'Recommending national awards without clear path',
      'Assuming acceptance to highly selective programs',
    ],
  },

  timeline: {
    name: 'Timeline Realism',
    flags: [
      'Major initiatives starting less than 6 months before apps',
      'Assuming significant achievement in new activity',
      'Compressed timelines for research output',
    ],
  },

  financial: {
    name: 'Financial Realism',
    flags: [
      'Recommending expensive programs without financial context',
      'Assuming travel for competitions without discussion',
      'Multiple costly summer programs',
    ],
  },
};

/**
 * Score validation rules
 */
export const SCORE_VALIDATION = {
  harvardScale: {
    1: {
      required: [
        'National or international recognition',
        'Exceptional achievement in multiple areas',
        'Clear evidence of being top 1%',
      ],
      examples: 'Intel finalist, USAMO qualifier, published author',
    },
    2: {
      required: [
        'State-level or strong regional recognition',
        'Clear spike with depth',
        'Evidence of being top 5%',
      ],
      examples: 'State competition winner, significant research, founded successful org',
    },
    3: {
      required: [
        'School-level or local recognition',
        'Solid leadership and achievement',
        'Above average in applicant pool',
      ],
      examples: 'Club president with achievements, varsity captain, consistent volunteer',
    },
    4: {
      required: [
        'Participation without significant distinction',
        'Meeting expectations but not exceeding',
        'Average in competitive pool',
      ],
      examples: 'Club member, JV athlete, occasional volunteer',
    },
    5: {
      required: [
        'Minimal involvement',
        'Below competitive pool average',
      ],
      examples: 'Few activities, limited engagement',
    },
    6: {
      required: [
        'Concerning patterns',
        'Red flags present',
        'Below average with concerns',
      ],
      examples: 'Academic issues, character concerns, no engagement',
    },
  },
};

// ============================================================================
// STAGE 5 SERVICE
// ============================================================================

export interface Stage5Input {
  // All outputs from previous stages
  stage0Output: {
    archetype: string;
    hiddenStrengths: string[];
    redFlags: string[];
  };

  stage1AOutput: {
    activities: Array<{
      name: string;
      tier: number;
    }>;
    spikeStrength: string;
    portfolioAssessment: string;
  };

  stage1BOutput: {
    harvardScore: number;
    rigorScore: number;
    trajectoryPattern: string;
  };

  stage2Output: {
    characterDimensions: Record<string, { score: number }>;
    compositeScore: number;
    narrativeCoherence: string;
    redFlags: string[];
  };

  stage3Output: {
    schoolAnalyses: Array<{
      school: string;
      fitScore: number;
      listCategory: string;
    }>;
    recommendedList: {
      reaches: string[];
      targets: string[];
      likelies: string[];
      safeties: string[];
    };
  };

  stage4Output: {
    activityOptimization: {
      deepen: string[];
      maintain: string[];
      reduce: string[];
      stop: string[];
      start: string[];
    };
    essayTopics: string[];
    summerRecommendations: string[];
    actionPriorities: string[];
  };

  // Student context
  studentContext: {
    gradeLevel: number;
    currentMonth: number;
    currentActivitiesCount: number;
    weeklyActivityHours: number;
    financialConstraints: boolean;
  };
}

export interface Stage5Output {
  verificationStatus: 'passed' | 'passed_with_warnings' | 'needs_revision';

  consistencyAnalysis: {
    overallConsistency: 'excellent' | 'good' | 'acceptable' | 'concerning';
    narrativeConsistency: {
      status: 'consistent' | 'minor_issues' | 'inconsistent';
      issues: string[];
      resolutions: string[];
    };
    scoreCalibration: {
      status: 'well_calibrated' | 'minor_adjustments' | 'needs_recalibration';
      discrepancies: Array<{
        area: string;
        issue: string;
        suggestedAdjustment: string;
      }>;
    };
    recommendationConflicts: {
      status: 'no_conflicts' | 'minor_conflicts' | 'major_conflicts';
      conflicts: Array<{
        conflict: string;
        resolution: string;
      }>;
    };
  };

  realismAssessment: {
    overallRealism: 'realistic' | 'ambitious' | 'unrealistic';
    workloadAssessment: {
      currentEstimatedHours: number;
      recommendedChanges: number;
      netHours: number;
      isFeasible: boolean;
      concerns: string[];
    };
    timelineAssessment: {
      isFeasible: boolean;
      criticalPathItems: string[];
      concerns: string[];
    };
    achievementAssessment: {
      isRealistic: boolean;
      concerns: string[];
    };
  };

  completenessCheck: {
    allAreasAddressed: boolean;
    missingElements: string[];
    suggestedAdditions: string[];
  };

  redFlagResolution: {
    allRedFlagsAddressed: boolean;
    unaddressedFlags: Array<{
      flag: string;
      severity: string;
      suggestedMitigation: string;
    }>;
    newConcerns: string[];
  };

  finalCalibration: {
    adjustedHarvardScore?: number;
    calibrationNotes: string;
    confidenceLevel: number;
    comparisonToPool: string;
  };

  qualityMetrics: {
    analysisDepth: number; // 1-10
    evidenceQuality: number; // 1-10
    actionability: number; // 1-10
    overallQuality: number; // 1-10
  };

  suggestedRevisions: Array<{
    stage: string;
    area: string;
    issue: string;
    suggestedChange: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  finalSummary: {
    keyStrengths: string[];
    criticalActions: string[];
    biggestRisk: string;
    overallAssessment: string;
    confidenceStatement: string;
  };

  metadata: {
    verificationTimestamp: string;
    checksPerformed: number;
    issuesIdentified: number;
    issuesResolved: number;
  };
}

/**
 * Stage 5: Verification & Consistency Check
 *
 * Uses Sonnet to verify all previous stage outputs are consistent,
 * realistic, and complete.
 */
export async function verifyAnalysis(
  input: Stage5Input
): Promise<Stage5Output> {
  const systemPrompt = `You are a quality assurance expert for college admissions counseling. Your job is to review analysis outputs and ensure they are:
1. INTERNALLY CONSISTENT - No contradictions between stages or within recommendations
2. REALISTIC - Achievable given time, resources, and student capabilities
3. WELL-CALIBRATED - Scores accurately reflect evidence
4. COMPLETE - All critical areas addressed
5. RED FLAGS RESOLVED - Identified concerns have mitigation strategies

CONSISTENCY CHECKS:
${JSON.stringify(CONSISTENCY_CHECKS, null, 2)}

REALISM CHECKS:
${JSON.stringify(REALISM_CHECKS, null, 2)}

SCORE VALIDATION:
${JSON.stringify(SCORE_VALIDATION, null, 2)}

Your role is NOT to redo the analysis, but to verify its quality and identify any issues that need resolution. Be thorough but fair - minor issues should be noted but not treated as failures.

OUTPUT FORMAT: Return a complete JSON object matching the Stage5Output interface.`;

  const userPrompt = `Verify the following multi-stage analysis for consistency, realism, and completeness:

STAGE 0 (Profile Classification):
- Archetype: ${input.stage0Output.archetype}
- Hidden Strengths: ${input.stage0Output.hiddenStrengths.join(', ')}
- Red Flags: ${input.stage0Output.redFlags.join(', ') || 'None'}

STAGE 1A (Activity Analysis):
- Activities: ${input.stage1AOutput.activities.map(a => `${a.name} (Tier ${a.tier})`).join(', ')}
- Spike Strength: ${input.stage1AOutput.spikeStrength}
- Portfolio Assessment: ${input.stage1AOutput.portfolioAssessment}

STAGE 1B (Academic Analysis):
- Harvard Score: ${input.stage1BOutput.harvardScore}
- Rigor Score: ${input.stage1BOutput.rigorScore}
- Trajectory: ${input.stage1BOutput.trajectoryPattern}

STAGE 2 (Character Analysis):
- Character Dimensions: ${Object.entries(input.stage2Output.characterDimensions).map(([d, s]) => `${d}: ${s.score}`).join(', ')}
- Composite Score: ${input.stage2Output.compositeScore}
- Narrative Coherence: ${input.stage2Output.narrativeCoherence}
- Red Flags: ${input.stage2Output.redFlags.join(', ') || 'None'}

STAGE 3 (School Fit):
- Schools Analyzed: ${input.stage3Output.schoolAnalyses.map(s => `${s.school} (${s.listCategory}, fit: ${s.fitScore})`).join(', ')}
- Recommended List:
  - Reaches: ${input.stage3Output.recommendedList.reaches.join(', ')}
  - Targets: ${input.stage3Output.recommendedList.targets.join(', ')}
  - Likelies: ${input.stage3Output.recommendedList.likelies.join(', ')}
  - Safeties: ${input.stage3Output.recommendedList.safeties.join(', ')}

STAGE 4 (Strategic Guidance):
- Deepen Activities: ${input.stage4Output.activityOptimization.deepen.join(', ')}
- Maintain Activities: ${input.stage4Output.activityOptimization.maintain.join(', ')}
- Reduce Activities: ${input.stage4Output.activityOptimization.reduce.join(', ')}
- Stop Activities: ${input.stage4Output.activityOptimization.stop.join(', ')}
- Start Activities: ${input.stage4Output.activityOptimization.start.join(', ')}
- Essay Topics: ${input.stage4Output.essayTopics.join(', ')}
- Summer Recommendations: ${input.stage4Output.summerRecommendations.join(', ')}
- Action Priorities: ${input.stage4Output.actionPriorities.join(', ')}

STUDENT CONTEXT:
- Grade Level: ${input.studentContext.gradeLevel}
- Current Month: ${input.studentContext.currentMonth}
- Current Activities: ${input.studentContext.currentActivitiesCount}
- Weekly Activity Hours: ${input.studentContext.weeklyActivityHours}
- Financial Constraints: ${input.studentContext.financialConstraints ? 'Yes' : 'No'}

Verify this analysis and identify:
1. Any inconsistencies between stages
2. Unrealistic recommendations
3. Score calibration issues
4. Missing elements
5. Unaddressed red flags
6. Overall quality assessment

Return your verification as a JSON object matching the Stage5Output interface.`;

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt,
      userPrompt,
      maxTokens: 6000,
      temperature: 0.2,
      cacheSystemPrompt: true,
    });

    // Parse and validate response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const result: Stage5Output = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.verificationStatus || !result.consistencyAnalysis || !result.realismAssessment) {
      throw new Error('Missing required fields in verification output');
    }

    return result;
  } catch (error) {
    console.error('[Stage5] Verification failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage5Verification = {
  CONSISTENCY_CHECKS,
  REALISM_CHECKS,
  SCORE_VALIDATION,
  verifyAnalysis,
};
