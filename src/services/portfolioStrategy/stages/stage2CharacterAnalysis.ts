/**
 * Stage 2: Character & Narrative Deep Analysis
 *
 * Workshop-level depth for comprehensive character evaluation:
 * - 7 character dimensions with Harvard 1-6 scoring
 * - Narrative coherence (the "two-sentence pitch" test)
 * - Authentic voice detection
 * - Red flag identification
 * - Strength amplification opportunities
 *
 * This is the "brain" of the PASS system - where we synthesize
 * all the data into a coherent understanding of WHO this student is.
 *
 * Uses Sonnet for nuanced character assessment that goes beyond
 * surface-level analysis.
 */

import { callClaude } from '../../../lib/llm/claude';
import { DIMENSION_RUBRICS, DIMENSION_WEIGHTS } from '../rubrics/characterDimensionRubrics';
import { CALIBRATION_PROFILES } from '../rubrics/harvardScaleCalibration';

// ============================================================================
// CHARACTER DIMENSION FRAMEWORKS
// ============================================================================

/**
 * The 7 character dimensions that elite colleges assess.
 * Each maps to specific evidence types and evaluation criteria.
 */
export const CHARACTER_DIMENSIONS = {
  intellectual_vitality: {
    name: 'Intellectual Vitality',
    harvardName: 'Academic/Intellectual',
    whatItMeasures: 'Genuine intellectual curiosity that extends beyond grades and requirements',
    keyQuestions: [
      'Does this student love learning for its own sake?',
      'Do they pursue intellectual interests outside class requirements?',
      'Can they engage with ideas at a sophisticated level?',
      'Do they ask interesting questions?',
    ],
    evidenceTypes: {
      strong: [
        'Self-directed research or intellectual projects',
        'Deep engagement with specific intellectual area',
        'Reading/learning well beyond curriculum',
        'Intellectual pursuits that connect across disciplines',
        'Questions and ideas that show original thinking',
      ],
      moderate: [
        'Challenging course selection',
        'Academic competition participation',
        'Intellectual discussions/clubs',
        'Interest in specific academic areas',
      ],
      weak: [
        'Only pursues required work',
        'No evidence of intellectual curiosity beyond grades',
        'Activities chosen for resume, not interest',
        'Generic "love of learning" without evidence',
      ],
    },
    redFlags: [
      'No intellectual pursuits outside class',
      'All activities are resume-builders with no depth',
      'Cannot articulate why they find anything interesting',
      'Course selection avoids challenge',
    ],
  },

  leadership_quality: {
    name: 'Leadership Quality',
    harvardName: 'Extracurricular/Leadership',
    whatItMeasures: 'Ability to influence, inspire, and make things happen—not just hold titles',
    keyQuestions: [
      'Do they make things happen or just hold positions?',
      'Have they actually led change or improvement?',
      'Do others follow their lead?',
      'Can they articulate a vision and execute it?',
    ],
    evidenceTypes: {
      strong: [
        'Founded organization that grew and persisted',
        'Led transformative change in existing organization',
        'Measurable impact on people/outcomes',
        'Others clearly influenced by their leadership',
        'Vision + execution demonstrated',
      ],
      moderate: [
        'Leadership positions with some initiative',
        'Team captain with team improvement',
        'Project leadership with completion',
        'Mentorship of others',
      ],
      weak: [
        'Titles without evidence of impact',
        'Elected positions without initiatives',
        'Leadership by seniority, not merit',
        'No evidence of influencing others',
      ],
    },
    redFlags: [
      'Multiple "president" titles with no accomplishments',
      'Leadership positions that seem arranged, not earned',
      'No one follows their lead',
      'Cannot describe what they actually DID as a leader',
    ],
  },

  community_impact: {
    name: 'Community Impact',
    harvardName: 'Personal Qualities (Contribution)',
    whatItMeasures: 'Genuine contribution to communities—not voluntourism or resume padding',
    keyQuestions: [
      'Did they actually help people or just show up?',
      'Is the impact measurable and meaningful?',
      'Was this sustained commitment or one-off?',
      'Did they solve real problems?',
    ],
    evidenceTypes: {
      strong: [
        'Created sustainable solution to real problem',
        'Measurable impact on specific community',
        'Deep, sustained engagement (years, not weeks)',
        'Changed systems or policies',
        'Others continued their work',
      ],
      moderate: [
        'Consistent volunteering with growing responsibility',
        'Specific people helped with clear outcomes',
        'Organized events/programs that benefited others',
        'Raised meaningful funds for real causes',
      ],
      weak: [
        'Generic volunteering for hours',
        'Voluntourism trips',
        'Service that primarily benefits resume',
        'No evidence of actual impact',
      ],
    },
    redFlags: [
      'Mission trips presented as major service',
      'Hours-focused rather than impact-focused',
      'Service in areas disconnected from stated interests',
      'Cannot name specific people helped or outcomes achieved',
    ],
  },

  personal_growth: {
    name: 'Personal Growth & Resilience',
    harvardName: 'Personal Qualities (Character)',
    whatItMeasures: 'Self-awareness, response to adversity, and capacity for growth',
    keyQuestions: [
      'How have they responded to failure or challenge?',
      'Do they show genuine self-awareness?',
      'Have they grown meaningfully over time?',
      'Can they articulate what they\'ve learned?',
    ],
    evidenceTypes: {
      strong: [
        'Clear adversity overcome with specific growth',
        'Changed perspective or behavior based on experience',
        'Vulnerability and honesty about struggles',
        'Meaningful failure followed by genuine learning',
        'Self-awareness that demonstrates maturity',
      ],
      moderate: [
        'Some evidence of growth over time',
        'Handled challenges reasonably well',
        'Can articulate lessons learned',
        'Shows developing self-awareness',
      ],
      weak: [
        'No evidence of adversity or growth',
        'Generic "challenges" without specifics',
        'Blames others for setbacks',
        'Lacks self-awareness',
      ],
    },
    redFlags: [
      'Manufactured adversity stories',
      'Takes no responsibility for failures',
      'Every story ends with success, no vulnerability',
      'Cannot articulate any personal growth',
    ],
  },

  resilience_grit: {
    name: 'Resilience & Grit',
    harvardName: 'Personal Qualities (Perseverance)',
    whatItMeasures: 'Sustained effort toward long-term goals despite obstacles',
    keyQuestions: [
      'Do they persist when things get hard?',
      'Have they worked toward something for years?',
      'How do they handle setbacks?',
      'Is there evidence of long-term commitment?',
    ],
    evidenceTypes: {
      strong: [
        'Multi-year pursuit of difficult goal',
        'Overcame significant obstacles to achieve',
        'Continued after failure or rejection',
        'Deep expertise developed through sustained effort',
        'Evidence of sacrifice for important goals',
      ],
      moderate: [
        'Consistent multi-year activities',
        'Some evidence of persistence through difficulty',
        'Completed challenging long-term projects',
        'Balanced multiple demanding commitments',
      ],
      weak: [
        'Short-term involvement in many things',
        'Quits when things get hard',
        'No evidence of sustained effort',
        'Difficulty with demanding commitments',
      ],
    },
    redFlags: [
      'Pattern of starting and stopping activities',
      'Dropping activities when they get competitive',
      'No multi-year commitments',
      'Always choosing the easier path',
    ],
  },

  creativity_innovation: {
    name: 'Creativity & Innovation',
    harvardName: 'Personal Qualities (Originality)',
    whatItMeasures: 'Original thinking, creative problem-solving, and willingness to innovate',
    keyQuestions: [
      'Do they think differently than others?',
      'Have they created something new?',
      'Do they solve problems in original ways?',
      'Is there evidence of creative risk-taking?',
    ],
    evidenceTypes: {
      strong: [
        'Created something genuinely original',
        'Solved problem in novel way',
        'Artistic work that shows unique voice',
        'Innovative approach recognized by others',
        'Connected disparate ideas in new ways',
      ],
      moderate: [
        'Creative pursuits with some originality',
        'Problem-solving that shows flexibility',
        'Artistic/creative activities with growth',
        'Brings new ideas to existing organizations',
      ],
      weak: [
        'Follows established patterns',
        'No evidence of original thinking',
        'Creative activities are derivative',
        'Solves problems by following rules',
      ],
    },
    redFlags: [
      'Claims creativity without evidence',
      'Creative work that seems copied or generic',
      'No examples of original thinking',
      'Risk-averse in all pursuits',
    ],
  },

  authenticity_voice: {
    name: 'Authenticity & Voice',
    harvardName: 'Personal Qualities (Genuineness)',
    whatItMeasures: 'Genuine self-expression, coherent identity, and authentic motivation',
    keyQuestions: [
      'Does this feel like a real person or a packaged applicant?',
      'Are their motivations genuine or performative?',
      'Do their activities/interests cohere into a real identity?',
      'Would you want to have dinner with this person?',
    ],
    evidenceTypes: {
      strong: [
        'Activities clearly driven by genuine passion',
        'Coherent narrative across all materials',
        'Unique perspective or voice evident',
        'Motivations that ring true',
        'Specificity that could only come from real experience',
      ],
      moderate: [
        'Some evidence of genuine interest',
        'Mostly coherent narrative',
        'Personality comes through in some areas',
        'Mix of genuine and strategic activities',
      ],
      weak: [
        'Everything feels calculated for admissions',
        'Generic motivations and interests',
        'No coherent identity emerges',
        'Could be any applicant',
      ],
    },
    redFlags: [
      'Activities that seem chosen purely for admissions',
      'Essays that read like they were written for admissions officers',
      'Interests that don\'t connect or cohere',
      'Motivations that sound like they came from a guidebook',
    ],
  },
};

/**
 * Narrative coherence framework - the "two-sentence pitch" test
 * Can you summarize this student compellingly in two sentences?
 */
export const NARRATIVE_COHERENCE_FRAMEWORK = {
  whatItMeasures: 'Whether the student\'s profile tells a coherent, compelling story',

  twoSentenceTest: {
    description: 'Can an admissions officer summarize this student compellingly to the committee?',
    strongExample: '"This is the kid who founded a coding education nonprofit after teaching herself to code in a rural town with no CS classes, and now her curriculum is used in 5 schools. She represents exactly the kind of resourceful, community-minded technologist we want."',
    weakExample: '"This student has a 3.9 GPA, plays tennis, volunteers, and is in student council." (Could describe thousands of applicants)',
  },

  coherenceElements: {
    clear_spike: 'One or two areas where the student is exceptionally developed',
    logical_connections: 'Activities and interests that build on each other',
    authentic_motivation: 'Clear "why" behind their choices',
    unique_angle: 'Something that differentiates them from similar applicants',
    growth_arc: 'Evidence of development and increasing depth over time',
    future_trajectory: 'Clear sense of where they\'re headed and why',
  },

  coherenceLevels: {
    exceptional: {
      score: '1-2',
      description: 'Immediately memorable, compelling narrative that practically sells itself',
      indicators: [
        'Crystal clear spike with national/international recognition',
        'Every activity reinforces central narrative',
        'Obvious "only they could have done this"',
        'Two-sentence pitch writes itself',
      ],
    },
    strong: {
      score: '2-3',
      description: 'Clear narrative with some distinctive elements',
      indicators: [
        'Identifiable primary interest area',
        'Most activities connect logically',
        'Some differentiation from similar applicants',
        'Two-sentence pitch is possible but less striking',
      ],
    },
    developing: {
      score: '3-4',
      description: 'Emerging narrative but not yet cohesive',
      indicators: [
        'Multiple interests without clear priority',
        'Some activities seem disconnected',
        'Potential for narrative but needs focus',
        'Two-sentence pitch requires effort',
      ],
    },
    weak: {
      score: '4-5',
      description: 'Generic profile without distinctive narrative',
      indicators: [
        'Scattered activities with no clear theme',
        'Could describe many similar applicants',
        'No obvious "why this student"',
        'Two-sentence pitch is just a list',
      ],
    },
    concerning: {
      score: '5-6',
      description: 'Incoherent or concerning profile',
      indicators: [
        'Activities contradict stated interests',
        'Red flags overshadow any positive narrative',
        'No compelling story possible',
        'Profile raises more questions than it answers',
      ],
    },
  },
};

/**
 * Red flag detection framework
 */
export const RED_FLAG_PATTERNS = {
  authenticity_concerns: {
    name: 'Authenticity Red Flags',
    patterns: [
      'Activities that started in junior/senior year "for college"',
      'Leadership positions without evidence of actual leading',
      'Service that benefits resume more than community',
      'Interests that don\'t cohere into genuine identity',
      'Essays that sound like they were written by consultants',
    ],
    severity: 'moderate_to_high',
    howAOsDetect: 'Pattern recognition from thousands of applications',
  },

  fabrication_indicators: {
    name: 'Potential Fabrication Flags',
    patterns: [
      'Claims that can\'t be verified and seem implausible',
      'Vague descriptions of supposedly significant achievements',
      'Numbers that seem exaggerated (e.g., "helped 10,000 people")',
      'Research claims without verifiable output',
      'Awards that don\'t appear in databases',
    ],
    severity: 'high',
    howAOsDetect: 'Verification attempts, comparison to similar applicants',
  },

  character_concerns: {
    name: 'Character Red Flags',
    patterns: [
      'No evidence of helping others or contributing to community',
      'All activities are individual achievements, no collaboration',
      'Pattern of quitting when things get hard',
      'Blaming others in essays or descriptions',
      'Arrogance without self-awareness',
    ],
    severity: 'moderate_to_high',
    howAOsDetect: 'Reading between the lines, teacher recommendations',
  },

  strategic_overpackaging: {
    name: 'Over-Packaged Application',
    patterns: [
      'Every activity has a founding role or leadership title',
      'Perfect narrative that feels manufactured',
      'Activities that exist only on paper',
      'Too many "nonprofits" or "organizations"',
      'Resume that reads like a consultant\'s template',
    ],
    severity: 'moderate',
    howAOsDetect: 'Pattern recognition, gut feeling of inauthenticity',
  },

  academic_concerns: {
    name: 'Academic Red Flags',
    patterns: [
      'Declining grades without explanation',
      'Course selection that avoids challenge',
      'Large gap between grades and test scores',
      'No intellectual pursuits outside required work',
      'Academic interests that don\'t match stated goals',
    ],
    severity: 'moderate',
    howAOsDetect: 'Transcript analysis, school profile comparison',
  },
};

// ============================================================================
// STAGE 2 SERVICE
// ============================================================================

export interface Stage2Input {
  // From Stage 0
  archetype: {
    primary: string;
    secondary?: string;
    confidence: number;
  };
  contextFactors: string[];
  narrativeThreads: string[];

  // From Stage 1A
  activityAnalysis: {
    activities: Array<{
      name: string;
      tier: 1 | 2 | 3 | 4;
      category: string;
      description: string;
      yearsInvolved: number;
      achievements: string[];
      leadershipRoles: string[];
    }>;
    spikeDetection: {
      hasSpikeEvidence: boolean;
      spikeStrength: 'strong' | 'moderate' | 'weak' | 'none';
      spikeAreas: string[];
    };
    hiddenGems: string[];
  };

  // From Stage 1B
  academicAnalysis: {
    harvardScore: number;
    rigorScore: number;
    trajectoryPattern: string;
    academicSpikes: string[];
    intellectualCuriosityScore: number;
  };

  // Additional context
  essays?: Array<{
    prompt: string;
    content: string;
    wordCount: number;
  }>;
  personalStatement?: string;
  additionalInfo?: string;
  recommendations?: Array<{
    source: string;
    relationship: string;
    highlights?: string[];
  }>;
  interviews?: Array<{
    school: string;
    notes?: string;
  }>;
  awards?: Array<{
    name: string;
    level: 'international' | 'national' | 'state' | 'regional' | 'local' | 'school';
    category: string;
    year: number;
  }>;
  personalContext?: {
    background?: string;
    familyCircumstances?: string;
    challenges?: string[];
    workExperience?: string;
    familyResponsibilities?: string;
  };
}

export interface Stage2Output {
  characterDimensions: {
    intellectual_vitality: {
      score: number; // 1-6 Harvard scale
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    leadership_quality: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    community_impact: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    personal_growth: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    resilience_grit: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    creativity_innovation: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
    authenticity_voice: {
      score: number;
      evidence: string[];
      strengths: string[];
      gaps: string[];
      assessment: string;
    };
  };

  compositeCharacterScore: {
    overallScore: number; // 1-6, weighted average
    confidence: number;
    scoreDistribution: string;
    comparisonToPool: string;
  };

  narrativeAnalysis: {
    coherenceLevel: 'exceptional' | 'strong' | 'developing' | 'weak' | 'concerning';
    coherenceScore: number; // 1-6
    twoSentencePitch: string;
    centralTheme: string;
    supportingElements: string[];
    coherenceGaps: string[];
    narrativeStrengths: string[];
    recommendedNarrativeFocus: string;
  };

  authenticityAssessment: {
    overallAuthenticity: 'highly_authentic' | 'mostly_authentic' | 'mixed_signals' | 'concerning';
    authenticElements: string[];
    potentialConcerns: string[];
    howAOsWillPerceive: string;
  };

  redFlagAnalysis: {
    flagsIdentified: Array<{
      category: string;
      description: string;
      severity: 'high' | 'moderate' | 'low';
      mitigation: string;
    }>;
    overallRiskLevel: 'low' | 'moderate' | 'elevated' | 'high';
    riskSummary: string;
  };

  strengthAmplification: {
    topStrengths: Array<{
      strength: string;
      currentImpact: string;
      amplificationStrategy: string;
      expectedOutcome: string;
    }>;
    underutilizedAssets: string[];
    differentiationOpportunities: string[];
  };

  harvardEquivalentScore: {
    score: number; // 1-6 overall assessment
    confidence: number;
    calibrationNotes: string;
    comparisonProfile: string; // Which calibration profile they most resemble
    admitProbability: {
      t10: number;
      t20: number;
      t50: number;
    };
  };

  strategicInsights: {
    applicationPositioning: string;
    storyToTell: string;
    whatMakesThemMemorable: string;
    biggestVulnerability: string;
    howToAddress: string;
  };

  metadata: {
    analysisDepth: 'comprehensive';
    evidenceQuality: 'high' | 'moderate' | 'limited';
    confidenceFactors: string[];
    dataGaps: string[];
  };
}

/**
 * Stage 2: Deep Character & Narrative Analysis
 *
 * Uses Sonnet for nuanced character assessment that synthesizes
 * all available data into a comprehensive understanding of the student.
 */
export async function analyzeCharacterAndNarrative(
  input: Stage2Input
): Promise<Stage2Output> {
  const systemPrompt = `You are the most experienced reader on Harvard's admissions committee. You've read over 50,000 applications and developed an intuitive sense for what makes a student exceptional, authentic, and memorable.

Your task is to provide a comprehensive CHARACTER AND NARRATIVE ANALYSIS that goes far beyond checking boxes. You must:

1. ASSESS ALL 7 CHARACTER DIMENSIONS: Use the Harvard 1-6 scale with specific evidence. Be honest—most students are 3-4, few are 1-2, and that's okay.

2. EVALUATE NARRATIVE COHERENCE: Can you summarize this student compellingly in two sentences? Does their profile tell a story?

3. DETECT AUTHENTICITY: Does this feel like a real person with genuine passions, or a packaged applicant following a template?

4. IDENTIFY RED FLAGS: What might concern an admissions officer? Be specific and fair.

5. FIND AMPLIFICATION OPPORTUNITIES: What strengths could be highlighted more effectively?

CHARACTER DIMENSIONS FRAMEWORK:
${JSON.stringify(CHARACTER_DIMENSIONS, null, 2)}

NARRATIVE COHERENCE FRAMEWORK:
${JSON.stringify(NARRATIVE_COHERENCE_FRAMEWORK, null, 2)}

RED FLAG PATTERNS:
${JSON.stringify(RED_FLAG_PATTERNS, null, 2)}

HARVARD SCALE CALIBRATION (for reference):
- Score 1: Exceptional (top 1%) - Virtually certain admit
- Score 2: Outstanding (top 5%) - Strong candidate
- Score 3: Strong (top 15%) - Competitive
- Score 4: Good (top 30%) - Possible admit
- Score 5: Average - Below competitive threshold
- Score 6: Concerning - Red flags present

CRITICAL: Be CALIBRATED. Most good students are 3-4. A score of 2 requires exceptional evidence. A score of 1 is reserved for truly extraordinary cases with national/international distinction.

OUTPUT FORMAT: Return a complete JSON object matching the Stage2Output interface. Every assessment must be grounded in specific evidence from the input.`;

  const userPrompt = `Analyze this student's character and narrative with workshop-level depth:

STUDENT ARCHETYPE & CONTEXT:
- Primary Archetype: ${input.archetype.primary}
- Secondary Archetype: ${input.archetype.secondary || 'None'}
- Context Factors: ${input.contextFactors.join(', ')}
- Narrative Threads Identified: ${input.narrativeThreads.join(', ')}

ACTIVITY ANALYSIS SUMMARY:
- Activities: ${input.activityAnalysis.activities.length} total
${input.activityAnalysis.activities.map(a => `  - ${a.name} (Tier ${a.tier}): ${a.description}`).join('\n')}
- Spike Evidence: ${input.activityAnalysis.spikeDetection.hasSpikeEvidence ? `Yes - ${input.activityAnalysis.spikeDetection.spikeStrength} in ${input.activityAnalysis.spikeDetection.spikeAreas.join(', ')}` : 'No clear spike'}
- Hidden Gems: ${input.activityAnalysis.hiddenGems.join(', ') || 'None identified'}

ACADEMIC ANALYSIS SUMMARY:
- Harvard Academic Score: ${input.academicAnalysis.harvardScore}
- Rigor Score: ${input.academicAnalysis.rigorScore}/10
- Trajectory: ${input.academicAnalysis.trajectoryPattern}
- Academic Spikes: ${input.academicAnalysis.academicSpikes.join(', ') || 'None'}
- Intellectual Curiosity Score: ${input.academicAnalysis.intellectualCuriosityScore}/6

${input.essays && input.essays.length > 0 ? `
ESSAYS:
${input.essays.map(e => `Prompt: ${e.prompt}\nContent (${e.wordCount} words): ${e.content.substring(0, 500)}...`).join('\n\n')}
` : ''}

${input.personalStatement ? `
PERSONAL STATEMENT EXCERPT:
${input.personalStatement.substring(0, 1000)}...
` : ''}

${input.awards && input.awards.length > 0 ? `
AWARDS:
${input.awards.map(a => `- ${a.name} (${a.level}, ${a.category}, ${a.year})`).join('\n')}
` : ''}

${input.personalContext ? `
PERSONAL CONTEXT:
- Background: ${input.personalContext.background || 'Not specified'}
- Family Circumstances: ${input.personalContext.familyCircumstances || 'Not specified'}
- Challenges: ${input.personalContext.challenges?.join(', ') || 'None specified'}
- Work Experience: ${input.personalContext.workExperience || 'None specified'}
- Family Responsibilities: ${input.personalContext.familyResponsibilities || 'None specified'}
` : ''}

Provide a comprehensive character and narrative analysis that:
1. Scores all 7 character dimensions with specific evidence (be calibrated!)
2. Evaluates narrative coherence and provides a two-sentence pitch
3. Assesses authenticity honestly
4. Identifies any red flags with severity and mitigation
5. Finds strength amplification opportunities
6. Calculates Harvard equivalent score with admission probability estimates
7. Provides strategic insights for application positioning

Return your analysis as a JSON object matching the Stage2Output interface.`;

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-5-20250514',
      systemPrompt,
      userPrompt,
      maxTokens: 8000,
      temperature: 0.3,
    });

    // Parse and validate response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const result: Stage2Output = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.characterDimensions || !result.narrativeAnalysis || !result.harvardEquivalentScore) {
      throw new Error('Missing required fields in character analysis output');
    }

    return result;
  } catch (error) {
    console.error('[Stage2] Character analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage2CharacterAnalysis = {
  CHARACTER_DIMENSIONS,
  NARRATIVE_COHERENCE_FRAMEWORK,
  RED_FLAG_PATTERNS,
  analyzeCharacterAndNarrative,
};
