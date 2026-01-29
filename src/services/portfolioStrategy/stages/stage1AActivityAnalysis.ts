/**
 * PASS Stage 1A: Activity Portfolio Deep Analysis
 *
 * WORKSHOP-LEVEL DEPTH: This stage provides standalone value as a complete
 * extracurricular assessment that could be delivered to a student independently.
 *
 * PURPOSE:
 * - Classify each activity using Sara Harberson's 4-tier system
 * - Detect spike areas and depth vs. breadth profile
 * - Identify hidden gems and undervalued achievements
 * - Provide activity-specific upgrade strategies
 * - Assess Common App presentation optimization
 *
 * WHAT MAKES THIS WORKSHOP-WORTHY:
 * - Each activity gets individual analysis, not batch classification
 * - Tier justifications are specific and evidence-based
 * - Upgrade paths are actionable and realistic
 * - Detection of "hidden gems" (work, family, constraints)
 * - Common App optimization for 10-activity limit
 *
 * MODEL: Sonnet (quality matters for nuanced activity evaluation)
 * COST: ~$0.06-0.08 per analysis
 */

import { callClaude } from '../../../lib/llm/claude';
import { ComprehensiveStudentInput, ActivityCategory } from '../types';
import { Stage0Output } from './stage0ProfileClassification';

// ============================================================================
// SARA HARBERSON 4-TIER SYSTEM (Research-Backed)
// ============================================================================

export const ACTIVITY_TIER_DEFINITIONS = {
  tier1: {
    level: 1,
    name: 'Exceptional (National/International)',
    description: 'Rare achievement level - top 1% of students nationally',
    admissionImpact: 'Can be decisive factor at any school',
    requirements: [
      'National or international recognition/awards',
      'Highly selective programs (< 5% acceptance)',
      'Impact affecting 1000+ people',
      'Published, patented, or externally validated work',
      'Professional-level achievement (recruited athlete, published author)',
    ],
    examples: [
      'Intel/Regeneron Science Talent Search semifinalist or finalist',
      'USAMO/USABO/USAPhO qualifier',
      'International olympiad participation',
      'TEDx main stage speaker (not school/student events)',
      'Founded nonprofit with 501(c)(3) and measurable scale',
      'Published research in peer-reviewed journal',
      'D1 recruited athlete or Olympic-level competition',
      'Professional credits in performing arts',
      'Patent filed or granted',
      'Revenue-generating business ($10k+)',
    ],
    notTier1: [
      'Pay-to-play programs claiming selectivity',
      'Self-published work without external validation',
      'Awards without competitive selection process',
      'Student-organized TEDx events',
      'Online certifications or courses',
    ],
  },
  tier2: {
    level: 2,
    name: 'Outstanding (State/Regional)',
    description: 'Significant achievement - top 5-10% of applicant pools',
    admissionImpact: 'Strong positive factor, especially with multiple Tier 2s',
    requirements: [
      'State or regional recognition/awards',
      'Significant leadership with measurable impact',
      'Impact affecting 100+ people',
      'Multi-year commitment with progression',
      'External validation at state/regional level',
    ],
    examples: [
      'State debate/speech champion',
      'All-state musician (competitive audition)',
      'AIME qualifier (math)',
      'State science fair top 3',
      'Student body president at large school with initiatives',
      'Eagle Scout/Gold Award',
      'Varsity captain with all-state/all-conference honors',
      'Founded club that grew to 50+ members',
      'Led service initiative with 100+ participants',
      '500+ hours sustained service with leadership',
    ],
    notTier2: [
      'State honors without competitive selection',
      'Leadership positions held for less than one year',
      'Positions without tangible accomplishments',
      'Awards given to all participants',
    ],
  },
  tier3: {
    level: 3,
    name: 'Solid (School/Local)',
    description: 'Good involvement - expected for competitive applicants',
    admissionImpact: 'Shows commitment; helps but doesn\'t differentiate',
    requirements: [
      'School or local recognition',
      'Consistent participation (2+ years)',
      'Some leadership or specialized role',
      'Demonstrable contribution to team/organization',
    ],
    examples: [
      'Varsity athlete (not recruited, no all-state)',
      'Club officer with some initiatives',
      'Consistent volunteer (100+ hours, same organization)',
      'Part-time job with increasing responsibility',
      'School newspaper section editor',
      'Orchestra/band member (non-principal)',
      'School competition participant (not state level)',
    ],
    notTier3: [
      'Participation without leadership or specialized role',
      'Short-term involvement (< 1 year)',
      'Activities clearly done only for college apps',
    ],
  },
  tier4: {
    level: 4,
    name: 'Standard (Participation)',
    description: 'Basic participation without distinction',
    admissionImpact: 'Fills activity list but doesn\'t add competitive value',
    requirements: [
      'Participation in organized activity',
      'No significant leadership or achievement',
      'Short-term or casual involvement',
    ],
    examples: [
      'Club member without leadership',
      'One-time volunteer events',
      'Recreational sports',
      'Casual hobbies',
      'JV athlete without distinction',
    ],
  },
};

// ============================================================================
// SPIKE DETECTION FRAMEWORK
// ============================================================================

export const SPIKE_CRITERIA = {
  strong: {
    name: 'Strong Spike',
    description: 'Clear area of exceptional depth that defines the student',
    requirements: [
      'Multiple Tier 1 activities in same area, OR',
      'One Tier 1 + multiple Tier 2 in same area',
      'Activities build on each other (progression visible)',
      'Narrative coherence - activities tell a story',
    ],
    admissionImpact: 'Significantly increases chances at selective schools',
  },
  moderate: {
    name: 'Moderate Spike',
    description: 'Developing area of depth with potential',
    requirements: [
      'Multiple Tier 2 activities in same area, OR',
      'One Tier 2 + several Tier 3 in same area',
      'Clear passion visible but not exceptional achievement',
    ],
    admissionImpact: 'Positive factor; shows direction',
  },
  weak: {
    name: 'Weak Spike',
    description: 'Some concentration but lacking distinction',
    requirements: [
      'Tier 3 activities in same area',
      'Interest visible but not remarkable achievement',
    ],
    admissionImpact: 'Better than no focus; room to develop',
  },
  none: {
    name: 'No Spike',
    description: 'Scattered activities without thematic connection',
    requirements: [
      'Activities spread across unrelated areas',
      'No clear passion or direction visible',
      'Breadth without depth',
    ],
    admissionImpact: 'Harder to position for selective schools',
  },
};

// ============================================================================
// HIDDEN GEM DETECTION
// ============================================================================

export const HIDDEN_GEM_CATEGORIES = {
  work_experience: {
    name: 'Work Experience (Often Undervalued)',
    whyValued: 'Sarah Harberson: "Admissions officers appreciate students who have initiative and responsibility to work. The more hours, the better."',
    examples: [
      'Retail/food service with responsibility',
      'Farm work or manual labor',
      'Family business contribution',
      'Self-employment/entrepreneurship',
    ],
    upgradeStrategy: 'Document responsibilities, hours, skills gained. Frame as choice showing maturity.',
  },
  family_responsibilities: {
    name: 'Family Responsibilities (Highly Valued)',
    whyValued: '315 College Admission Deans: "We view substantial family contributions as very important, will only positively impact review."',
    examples: [
      'Caring for siblings regularly',
      'Translating for parents (immigrant families)',
      'Managing household responsibilities',
      'Supporting family business',
      'Caring for ill family member',
    ],
    upgradeStrategy: 'Quantify hours and describe impact. Ensure counselor letter mentions this.',
  },
  constrained_excellence: {
    name: 'Maximizing Limited Opportunities',
    whyValued: 'Rice University: "Students compared with other students from similar high schools, NOT against students from affluent schools."',
    examples: [
      'Taking only AP at school with one AP',
      'Creating opportunity where none existed',
      'Rural student with limited access',
      'First-gen navigating without guidance',
    ],
    upgradeStrategy: 'Context is everything. Ensure circumstances are understood.',
  },
  outsized_local_impact: {
    name: 'Outsized Local Impact',
    whyValued: 'AOs understand this and often value OUTSIZED LOCAL IMPACT similarly to national achievement.',
    examples: [
      'Created sustainable program serving community',
      'Solved genuine local problem',
      'Impact that continues without the student',
      'Changed policy or practice in organization',
    ],
    upgradeStrategy: 'Quantify beneficiaries and sustainability. Get testimonials if possible.',
  },
};

// ============================================================================
// STAGE 1A PROMPT BUILDER
// ============================================================================

export function buildStage1APrompt(
  input: ComprehensiveStudentInput,
  stage0Context: Stage0Output
): string {
  const activities = input.activities?.activities || [];

  const activityDetails = activities.map((a, i) => `
ACTIVITY ${i + 1}: ${a.name}
- Category: ${a.category || 'Not specified'}
- Years Involved: ${a.yearsInvolved || 'Unknown'}
- Hours/Week: ${a.hoursPerWeek || 'Unknown'}
- Weeks/Year: ${a.weeksPerYear || 'Unknown'}
- Description: ${a.description || 'None provided'}
- Leadership Positions: ${a.leadershipPositions?.map(p => `${p.title} (Years: ${p.years?.join(', ')})`).join('; ') || 'None'}
- Achievements: ${a.achievements?.map(ach => ach.description).join('; ') || 'None listed'}
- Recognition Level: ${a.recognitionLevel || 'Not specified'}
`).join('\n');

  return `You are a senior admissions consultant with 20+ years of experience evaluating extracurricular activities at elite institutions. You've served on admissions committees at Harvard, Stanford, and Yale.

Your task is to provide a COMPREHENSIVE ACTIVITY PORTFOLIO ANALYSIS that would be valuable as a standalone consultation. This is workshop-level depth, not a quick classification.

<prior_context>
From Stage 0 Profile Classification:
- Archetype: ${stage0Context.archetypeAnalysis.primaryArchetype}
- Two-Sentence Pitch: ${stage0Context.narrativeThreads.twoSentencePitch}
- Context Factors: ${stage0Context.contextCalibration.factors.filter(f => f.present).map(f => f.factor).join(', ') || 'None identified'}
- Preliminary Activity Tier: ${stage0Context.preliminaryTiers.activities.tier}
</prior_context>

<student_activities>
Total Activities: ${activities.length}
Grade Level: ${input.gradeLevel}
Intended Major: ${input.intendedMajors?.join(', ') || 'Undecided'}

${activityDetails}
</student_activities>

<tier_reference>
SARA HARBERSON 4-TIER SYSTEM:

TIER 1 (Exceptional): National/international recognition, < 5% selectivity
- Examples: Intel/Regeneron finalist, USAMO, international olympiad, D1 recruited athlete, published research

TIER 2 (Outstanding): State/regional recognition with leadership
- Examples: State champion, AIME qualifier, all-state musician, Student Body President with initiatives, Eagle Scout

TIER 3 (Solid): School/local recognition with commitment
- Examples: Varsity athlete, club officer, consistent volunteer (100+ hrs), part-time job with responsibility

TIER 4 (Standard): Participation without distinction
- Examples: Club member, one-time events, recreational activities
</tier_reference>

<hidden_gem_detection>
IMPORTANT: Look for undervalued achievements that students often undersell:
1. WORK EXPERIENCE - Often as valuable as traditional activities
2. FAMILY RESPONSIBILITIES - Caring for siblings, translating, household management
3. CONSTRAINED EXCELLENCE - Maximizing limited opportunities
4. OUTSIZED LOCAL IMPACT - Significant impact in smaller community
</hidden_gem_detection>

<your_task>
Provide a WORKSHOP-LEVEL activity analysis covering:

1. **INDIVIDUAL ACTIVITY CLASSIFICATION**
   For EACH activity:
   - Tier assignment (1-4) with specific justification
   - What makes this tier (evidence from description)
   - What would upgrade it to the next tier
   - Any concerns or red flags
   - Optimal positioning for Common App

2. **SPIKE ANALYSIS**
   - Does this student have a spike? (strong/moderate/weak/none)
   - What areas show concentration?
   - How do activities build on each other?
   - Is the spike authentic or manufactured?

3. **HIDDEN GEM DETECTION**
   - Any work/family responsibilities being undersold?
   - Achievements that deserve more recognition?
   - Context factors affecting evaluation?
   - Outsized impact relative to resources?

4. **PORTFOLIO ASSESSMENT**
   - Overall tier distribution (how many at each level)
   - Depth vs. breadth profile
   - Thematic coherence (do activities tell a story?)
   - Common App optimization (best 10 activities)

5. **UPGRADE STRATEGIES**
   - Which activities have most upgrade potential?
   - Specific, actionable steps to strengthen portfolio
   - Timeline considerations (what's possible by deadline)
   - What new activities might fill gaps?

6. **COMPETITIVE POSITIONING**
   - How does this portfolio compare to competitive applicants?
   - Strengths to emphasize in applications
   - Weaknesses to address or mitigate
   - School fit based on activity profile
</your_task>

Respond with detailed JSON analysis:
{
  "activityClassifications": [
    {
      "activityName": "name",
      "activityIndex": 0,
      "tier": 1-4,
      "tierJustification": "specific evidence-based reasoning",
      "standoutFactors": ["what's impressive"],
      "concerns": ["any red flags"],
      "upgradeToNextTier": {
        "possible": true/false,
        "requirements": ["what would be needed"],
        "timeline": "feasibility assessment"
      },
      "commonAppOptimization": {
        "include": true/false,
        "positionRanking": 1-10,
        "descriptionSuggestions": ["how to present effectively"]
      }
    }
  ],

  "spikeAnalysis": {
    "spikeStrength": "strong|moderate|weak|none",
    "spikeAreas": ["area1", "area2"],
    "spikeEvidence": ["how activities demonstrate spike"],
    "spikeAuthenticity": {
      "score": 0-100,
      "assessment": "genuine vs manufactured",
      "evidence": ["what suggests authenticity or lack thereof"]
    },
    "activitiesThatBuildSpike": ["activity names that reinforce each other"],
    "gapsInSpike": ["what's missing to strengthen the spike"]
  },

  "hiddenGemDetection": {
    "undersoldAchievements": [
      {
        "activity": "name",
        "whyUndersold": "explanation",
        "trueValue": "what colleges would actually see",
        "elevationStrategy": "how to better present this"
      }
    ],
    "workFamilyResponsibilities": {
      "identified": true/false,
      "details": "description",
      "value": "why this matters",
      "presentationStrategy": "how to include in application"
    },
    "constrainedExcellence": {
      "present": true/false,
      "context": "description of constraints",
      "maximization": "how well opportunities were used",
      "contextCommunication": "how to ensure this is understood"
    }
  },

  "portfolioAssessment": {
    "tierDistribution": {
      "tier1": 0,
      "tier2": 0,
      "tier3": 0,
      "tier4": 0
    },
    "overallPortfolioTier": 1-4,
    "depthVsBreadth": "depth_focused|balanced|breadth_focused",
    "thematicCoherence": {
      "score": 0-100,
      "primaryTheme": "main thread",
      "supportingThemes": ["secondary threads"],
      "incoherentElements": ["activities that don't fit"]
    },
    "commonAppOptimization": {
      "top10Recommended": ["activity names in order"],
      "activitiesToExclude": ["names and why"],
      "positioningNotes": "how to order and present"
    }
  },

  "upgradeStrategies": {
    "highPotentialUpgrades": [
      {
        "activity": "name",
        "currentTier": 1-4,
        "targetTier": 1-4,
        "specificActions": ["actionable steps"],
        "timeline": "realistic timing",
        "likelihood": "high|medium|low"
      }
    ],
    "newActivitySuggestions": [
      {
        "suggestion": "activity description",
        "rationale": "why this fills a gap",
        "fitWithProfile": "how it connects to existing story",
        "feasibility": "high|medium|low"
      }
    ],
    "gapsFilled": ["what gaps would be addressed"]
  },

  "competitivePositioning": {
    "comparisonToPool": "how this compares to typical applicants",
    "strengthsToEmphasize": ["what to highlight"],
    "weaknessesToMitigate": ["what to address"],
    "schoolFitAssessment": {
      "activityHeavySchools": ["schools that value activities highly"],
      "spikeSchools": ["schools that value depth over breadth"],
      "wellRoundedSchools": ["schools that value breadth"]
    },
    "probabilityAssessment": {
      "t10Activities": "probability % based on activities alone",
      "t20Activities": "probability % based on activities alone",
      "t50Activities": "probability % based on activities alone"
    }
  },

  "workshopSummary": {
    "keyInsights": ["3-5 most important takeaways"],
    "immediateActions": ["what to do in next 30 days"],
    "mediumTermActions": ["what to do in next 3-6 months"],
    "questionsForStudent": ["probing questions to explore further"]
  }
}

BE RIGOROUS. Apply the tier system consistently. Don't inflate classifications. Be specific about evidence and reasoning.`;
}

// ============================================================================
// STAGE 1A OUTPUT TYPE
// ============================================================================

export interface Stage1AOutput {
  activityClassifications: Array<{
    activityName: string;
    activityIndex: number;
    tier: 1 | 2 | 3 | 4;
    tierJustification: string;
    standoutFactors: string[];
    concerns: string[];
    upgradeToNextTier: {
      possible: boolean;
      requirements: string[];
      timeline: string;
    };
    commonAppOptimization: {
      include: boolean;
      positionRanking: number;
      descriptionSuggestions: string[];
    };
  }>;

  spikeAnalysis: {
    spikeStrength: 'strong' | 'moderate' | 'weak' | 'none';
    spikeAreas: string[];
    spikeEvidence: string[];
    spikeAuthenticity: {
      score: number;
      assessment: string;
      evidence: string[];
    };
    activitiesThatBuildSpike: string[];
    gapsInSpike: string[];
  };

  hiddenGemDetection: {
    undersoldAchievements: Array<{
      activity: string;
      whyUndersold: string;
      trueValue: string;
      elevationStrategy: string;
    }>;
    workFamilyResponsibilities: {
      identified: boolean;
      details?: string;
      value?: string;
      presentationStrategy?: string;
    };
    constrainedExcellence: {
      present: boolean;
      context?: string;
      maximization?: string;
      contextCommunication?: string;
    };
  };

  portfolioAssessment: {
    tierDistribution: {
      tier1: number;
      tier2: number;
      tier3: number;
      tier4: number;
    };
    overallPortfolioTier: 1 | 2 | 3 | 4;
    depthVsBreadth: 'depth_focused' | 'balanced' | 'breadth_focused';
    thematicCoherence: {
      score: number;
      primaryTheme: string;
      supportingThemes: string[];
      incoherentElements: string[];
    };
    commonAppOptimization: {
      top10Recommended: string[];
      activitiesToExclude: string[];
      positioningNotes: string;
    };
  };

  upgradeStrategies: {
    highPotentialUpgrades: Array<{
      activity: string;
      currentTier: number;
      targetTier: number;
      specificActions: string[];
      timeline: string;
      likelihood: 'high' | 'medium' | 'low';
    }>;
    newActivitySuggestions: Array<{
      suggestion: string;
      rationale: string;
      fitWithProfile: string;
      feasibility: 'high' | 'medium' | 'low';
    }>;
    gapsFilled: string[];
  };

  competitivePositioning: {
    comparisonToPool: string;
    strengthsToEmphasize: string[];
    weaknessesToMitigate: string[];
    schoolFitAssessment: {
      activityHeavySchools: string[];
      spikeSchools: string[];
      wellRoundedSchools: string[];
    };
    probabilityAssessment: {
      t10Activities: string;
      t20Activities: string;
      t50Activities: string;
    };
  };

  workshopSummary: {
    keyInsights: string[];
    immediateActions: string[];
    mediumTermActions: string[];
    questionsForStudent: string[];
  };
}

// ============================================================================
// STAGE 1A EXECUTION
// ============================================================================

export async function executeStage1A(
  input: ComprehensiveStudentInput,
  stage0Output: Stage0Output
): Promise<{ output: Stage1AOutput; usage: { inputTokens: number; outputTokens: number } }> {
  const prompt = buildStage1APrompt(input, stage0Output);

  const response = await callClaude(prompt, {
    model: 'claude-sonnet-4-5-20250514',
    maxTokens: 8000,
    temperature: 0.4,
    useJsonMode: true,
  });

  // Parse the response
  let output: Stage1AOutput;
  if (typeof response.content === 'string') {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      output = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse Stage 1A response');
    }
  } else {
    output = response.content as Stage1AOutput;
  }

  return {
    output,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage1AActivityAnalysis = {
  ACTIVITY_TIER_DEFINITIONS,
  SPIKE_CRITERIA,
  HIDDEN_GEM_CATEGORIES,
  buildStage1APrompt,
  executeStage1A,
};
