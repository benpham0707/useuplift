/**
 * Stage 4: Strategic Guidance Deep Analysis
 *
 * Workshop-level depth for comprehensive strategic recommendations:
 * - Timeline-based action planning by grade level
 * - Activity optimization (start, stop, deepen)
 * - Essay strategy with topic-to-school mapping
 * - Summer program recommendations
 * - Interview preparation frameworks
 * - Recommendation letter strategy
 *
 * This is where all analysis becomes ACTIONABLE—specific, prioritized
 * steps the student should take.
 *
 * Uses Sonnet for creative synthesis that connects insights to actions.
 */

import { callClaude } from '../../../lib/llm/claude';

// ============================================================================
// STRATEGIC PLANNING FRAMEWORKS
// ============================================================================

/**
 * Grade-level strategic priorities
 */
export const GRADE_LEVEL_PRIORITIES = {
  freshman: {
    grade: 9,
    overallFocus: 'Foundation building and exploration',
    priorities: [
      'Explore broadly to find genuine interests',
      'Establish strong academic habits and rigor',
      'Begin 1-2 activities with commitment potential',
      'Build relationships with teachers who could become mentors',
    ],
    whatMatters: [
      'Grades establish trajectory—aim for strong start',
      'Exploration is expected and encouraged',
      'Depth will come later; breadth is fine now',
      'Building curiosity and habits > resume building',
    ],
    commonMistakes: [
      'Trying to do too many activities',
      'Choosing activities "for college" instead of interest',
      'Coasting because "freshman year doesn\'t matter"',
      'Not taking challenging courses available',
    ],
    actionableItems: [
      'Meet with counselor to understand course progression',
      'Try 3-5 activities to find genuine interests',
      'Identify potential mentor teachers',
      'Start reading/learning beyond curriculum in areas of interest',
    ],
  },

  sophomore: {
    grade: 10,
    overallFocus: 'Deepening commitment and emerging leadership',
    priorities: [
      'Narrow activities to 3-4 with increasing commitment',
      'Begin pursuing leadership opportunities',
      'Maintain or improve academic trajectory',
      'Start building expertise in spike area',
      'Consider summer opportunities that build skills',
    ],
    whatMatters: [
      'Demonstrated growth in key activities',
      'Continued academic rigor',
      'Emerging specialization is positive',
      'First leadership roles appropriate',
    ],
    commonMistakes: [
      'Still spreading too thin',
      'Not increasing depth in key areas',
      'Academic slide (sophomore slump)',
      'Missing summer skill-building opportunities',
    ],
    actionableItems: [
      'Evaluate activities—which align with genuine interests?',
      'Pursue first leadership role or project',
      'Plan meaningful summer activity',
      'Begin standardized test preparation if appropriate',
      'Consider starting research or significant project',
    ],
  },

  junior: {
    grade: 11,
    overallFocus: 'Maximum impact and achievement building',
    priorities: [
      'Achieve peak performance in spike activities',
      'Maintain or improve grades in most rigorous curriculum',
      'Complete standardized testing',
      'Create distinguishing achievements',
      'Research colleges and begin list building',
      'Build relationships with recommendation writers',
    ],
    whatMatters: [
      'This is THE year for achievement—AOs focus heavily on junior year',
      'Leadership impact should be measurable',
      'Academic rigor at maximum appropriate level',
      'Standardized tests should be substantially complete',
      'Clear narrative should be emerging',
    ],
    commonMistakes: [
      'Spreading thin with new activities (too late)',
      'Burnout from overcommitment',
      'Not planning summer strategically',
      'Delaying standardized testing',
      'Not building recommendation relationships',
    ],
    actionableItems: [
      'Maximize achievement in top 2-3 activities',
      'Plan transformative summer experience',
      'Complete SAT/ACT by spring or early summer',
      'Meet with potential recommendation writers',
      'Begin college research and visits',
      'Start brainstorming personal statement topics',
    ],
  },

  senior_fall: {
    grade: 12,
    overallFocus: 'Application execution and continued excellence',
    priorities: [
      'Execute application strategy effectively',
      'Maintain academic performance',
      'Continue activity involvement (don\'t drop everything)',
      'Complete strong essays',
      'Secure excellent recommendations',
    ],
    whatMatters: [
      'First quarter grades still matter significantly',
      'Continued activity involvement shows commitment',
      'Essay quality is differentiating factor',
      'Recommendation letters can make or break borderline cases',
    ],
    commonMistakes: [
      'Senioritis before applications submitted',
      'Abandoning activities immediately',
      'Rushing essays',
      'Not following up with recommenders',
      'Applying to wrong number/balance of schools',
    ],
    actionableItems: [
      'Finalize school list with balance',
      'Execute ED/EA strategy',
      'Complete Common App and supplements ahead of deadlines',
      'Maintain grades—first quarter matters',
      'Continue meaningful activities',
      'Thank recommenders and provide updates',
    ],
  },

  senior_spring: {
    grade: 12,
    overallFocus: 'Decision making and transition',
    priorities: [
      'Make informed final decision',
      'Maintain grades (offers can be rescinded)',
      'Prepare for college transition',
    ],
    whatMatters: [
      'Significant grade drops can result in rescinded offers',
      'Waitlist strategy if applicable',
      'Financial aid comparison',
    ],
    actionableItems: [
      'Visit top choice schools if possible',
      'Compare financial aid packages',
      'Make final decision by May 1',
      'Prepare for college (orientation, housing, etc.)',
    ],
  },
};

/**
 * Activity optimization framework
 */
export const ACTIVITY_OPTIMIZATION_FRAMEWORK = {
  evaluationCriteria: {
    genuineInterest: 'Does the student actually care about this?',
    growthPotential: 'Can they achieve more here?',
    narrativeContribution: 'Does this support their story?',
    differentiationValue: 'Does this set them apart?',
    timeInvestment: 'Is the time commitment worthwhile?',
  },

  optimizationActions: {
    deepen: {
      description: 'Increase commitment, seek leadership, achieve more',
      when: [
        'Genuine interest and passion',
        'Clear growth opportunities available',
        'Contributes to spike or narrative',
        'Potential for distinguishing achievement',
      ],
      how: [
        'Seek leadership positions or projects',
        'Increase hours strategically',
        'Pursue competitions or recognition',
        'Create new initiatives within the activity',
      ],
    },
    maintain: {
      description: 'Continue current level of involvement',
      when: [
        'Activity adds value but is not primary focus',
        'Dropping would look bad or lose community',
        'Balance activity for mental health/fun',
        'Already at appropriate level',
      ],
      how: [
        'Keep consistent involvement',
        'Don\'t overinvest relative to return',
        'Enjoy the activity without pressure',
      ],
    },
    reduce: {
      description: 'Decrease time while maintaining involvement',
      when: [
        'Time better spent elsewhere',
        'Activity doesn\'t fit narrative',
        'Diminishing returns on investment',
        'Need to free up capacity',
      ],
      how: [
        'Step back from leadership if appropriate',
        'Reduce hours while staying involved',
        'Transition to advisory/mentor role',
      ],
    },
    stop: {
      description: 'End involvement in this activity',
      when: [
        'No genuine interest',
        'Doesn\'t contribute to narrative',
        'Better opportunities available',
        'Negative impact on grades or wellbeing',
      ],
      how: [
        'Finish current commitment gracefully',
        'Don\'t feel obligated to continue',
        'Focus energy on higher-value activities',
      ],
      caveat: 'Be thoughtful—AOs notice students who quit activities junior/senior year',
    },
    start: {
      description: 'Begin new activity or initiative',
      when: [
        'Clear gap in profile',
        'Genuine new interest discovered',
        'Opportunity for significant impact quickly',
        'Addresses weakness in narrative',
      ],
      caution: [
        'Starting new activities junior/senior year raises questions',
        'Must be genuine interest, not resume filler',
        'Better to start something new than join something old',
      ],
    },
  },
};

/**
 * Essay strategy framework
 */
export const ESSAY_STRATEGY_FRAMEWORK = {
  commonAppEssayPrinciples: {
    purpose: 'Reveal who you are as a person—not what you\'ve done',
    keyQuestions: [
      'What can the reader learn about you that\'s not elsewhere in the app?',
      'Does this show genuine self-reflection?',
      'Is your authentic voice coming through?',
      'Would this essay make an AO want to meet you?',
    ],
    topicGuidance: {
      strong: [
        'Specific moments that reveal character',
        'Genuine struggles with authentic growth',
        'Unusual perspectives or experiences',
        'Passions explored with depth and specificity',
        'Small moments with big meaning',
      ],
      risky: [
        'Sports victories/injuries (overdone unless unique angle)',
        'Mission trips and voluntourism',
        'Winning awards or competitions',
        'Generic immigrant/diversity stories without specificity',
        'COVID essays (unless truly distinctive impact)',
      ],
      avoid: [
        'Listing accomplishments',
        'Trying to seem impressive',
        'Generic lessons from common experiences',
        'Writing what you think AOs want to hear',
        'Topics that could apply to anyone',
      ],
    },
  },

  supplementStrategyByType: {
    whySchool: {
      description: 'Why are you applying to THIS school?',
      mustInclude: [
        'Specific programs, courses, or professors',
        'Specific campus features or opportunities',
        'How you\'ll contribute to their community',
        'Connection to your goals and interests',
      ],
      mustAvoid: [
        'Generic praise (prestige, rankings, beautiful campus)',
        'Information from the brochure without personalization',
        'Focus on location/city benefits only',
        'Anything that could apply to multiple schools',
      ],
    },
    activityElaboration: {
      description: 'Tell us more about an activity',
      mustInclude: [
        'What you actually DID (specific actions)',
        'Why it mattered to you (genuine motivation)',
        'What you learned or how you grew',
        'Impact on others or the activity itself',
      ],
      mustAvoid: [
        'Repeating your activities list description',
        'Generic leadership lessons',
        'Focus on titles over actions',
      ],
    },
    communityEssay: {
      description: 'Describe a community you belong to',
      mustInclude: [
        'Specific community with genuine connection',
        'Your role and contribution',
        'What the community means to you',
        'How it shaped your identity',
      ],
      mustAvoid: [
        'Listing multiple communities superficially',
        'Generic descriptions of common communities',
        'Focus on what community gave you without reciprocity',
      ],
    },
    diversityEssay: {
      description: 'How will you contribute to diversity?',
      mustInclude: [
        'Authentic aspects of your identity/experience',
        'Specific perspectives you bring',
        'How you engage with difference',
        'Concrete ways you\'ll contribute',
      ],
      mustAvoid: [
        'Manufacturing diversity where it doesn\'t exist',
        'Focusing only on surface demographics',
        'Speaking for entire groups',
      ],
    },
    challengeEssay: {
      description: 'Describe a challenge you faced',
      mustInclude: [
        'Specific challenge with genuine difficulty',
        'Your authentic response and process',
        'Genuine growth or learning',
        'Vulnerability and honesty',
      ],
      mustAvoid: [
        'Manufactured challenges',
        'Challenges that make you look bad without redemption',
        'Challenges where you were the hero from the start',
      ],
    },
  },

  essaySchoolMatching: {
    description: 'Match essay topics to school values',
    principle: 'The same student might emphasize different aspects for different schools',
    examples: [
      'MIT: Emphasize building, making, technical depth',
      'Yale: Emphasize arts, community, interdisciplinary interests',
      'Stanford: Emphasize intellectual vitality, entrepreneurship',
      'Harvard: Emphasize leadership, service, future impact',
    ],
  },
};

/**
 * Summer program recommendations framework
 */
export const SUMMER_STRATEGY_FRAMEWORK = {
  programTiers: {
    tier1_gameChangers: {
      description: 'Highly selective programs that significantly boost applications',
      examples: [
        'RSI (Research Science Institute)',
        'TASP (Telluride Association Summer Program)',
        'MITES/MOSTEC (MIT)',
        'SSP (Summer Science Program)',
        'Clark Scholars',
        'Governor\'s Schools (varies by state)',
      ],
      characteristics: [
        'Highly selective (often <10% admit rate)',
        'Free or low cost',
        'Significant academic experience',
        'Known to admissions officers',
      ],
      applicationTiming: 'January-March for following summer',
    },
    tier2_valuable: {
      description: 'Good programs that add value but aren\'t game-changers',
      examples: [
        'Summer programs at target universities',
        'Research internships (arranged independently)',
        'Selective academic camps in specific fields',
        'Meaningful internships with real work',
      ],
      characteristics: [
        'Moderately selective',
        'Provide genuine learning or experience',
        'Can lead to continued work or recommendations',
      ],
      caution: 'Pay-to-play programs at elite universities carry less weight',
    },
    tier3_useful: {
      description: 'Programs with some value but not distinguishing',
      examples: [
        'Local university programs',
        'Community-based programs',
        'Skill-building workshops',
        'Volunteer opportunities',
      ],
      characteristics: [
        'Accessible',
        'Provide experience or skills',
        'Won\'t hurt but won\'t distinguish',
      ],
    },
  },

  alternativesToPrograms: {
    independentResearch: {
      description: 'Self-directed research with mentor',
      advantages: [
        'Demonstrates initiative',
        'Can be highly distinctive',
        'Potentially leads to publication or presentation',
      ],
      howToArrange: [
        'Email professors at local universities',
        'Reach out to professionals in field of interest',
        'Use school connections',
      ],
    },
    meaningfulWork: {
      description: 'Jobs that provide genuine experience and responsibility',
      advantages: [
        'Shows maturity and responsibility',
        'Real-world skills',
        'Can be distinctive if connected to interests',
      ],
      examples: [
        'Work related to intended field',
        'Entrepreneurial ventures',
        'Jobs with increasing responsibility',
      ],
    },
    independentProjects: {
      description: 'Self-directed projects with tangible output',
      advantages: [
        'Complete control over direction',
        'Demonstrates initiative and follow-through',
        'Can be highly distinctive',
      ],
      examples: [
        'Building an app or product',
        'Writing a book or significant content',
        'Creating an organization or initiative',
        'Artistic portfolio development',
      ],
    },
    familyResponsibilities: {
      description: 'Taking care of family needs',
      note: 'This is NOT less valuable than programs—admissions officers understand',
      howToFrame: [
        'Be honest about responsibilities',
        'Describe what you learned',
        'Show how you made the most of available time',
      ],
    },
  },
};

/**
 * Interview preparation framework
 */
export const INTERVIEW_PREP_FRAMEWORK = {
  interviewTypes: {
    evaluative: {
      schools: ['MIT', 'Georgetown', 'Some liberal arts colleges'],
      description: 'Interview is part of evaluation',
      preparation: 'More formal, prepare for substantive questions',
    },
    informational: {
      schools: ['Most schools with alumni interviews'],
      description: 'Primarily for student to learn about school',
      preparation: 'Still matters but less high-stakes',
    },
    required: {
      schools: ['Georgetown', 'Some art schools'],
      description: 'Must complete interview to be considered',
      preparation: 'Take very seriously',
    },
  },

  universalPreparation: {
    mustKnow: [
      'Why this school specifically (with details)',
      'Your activities and what you learned',
      'Academic interests and why',
      'Future goals (even if tentative)',
      'Questions to ask the interviewer',
    ],
    commonQuestions: [
      'Tell me about yourself',
      'Why [school name]?',
      'What do you do outside of school?',
      'What would you contribute to our community?',
      'What are you reading/watching/thinking about?',
      'Where do you see yourself in 10 years?',
      'What\'s a challenge you\'ve faced?',
      'Questions for me?',
    ],
    practiceApproach: [
      'Practice with parent, teacher, or counselor',
      'Record yourself answering questions',
      'Prepare 2-3 stories that show different qualities',
      'Have 5+ genuine questions prepared',
    ],
  },

  doAndDont: {
    do: [
      'Be yourself—authenticity matters',
      'Show genuine enthusiasm',
      'Ask thoughtful questions',
      'Send thank-you note within 24 hours',
      'Dress appropriately (business casual usually)',
      'Arrive early or log on early',
    ],
    dont: [
      'Recite accomplishments like a list',
      'Be arrogant or name-drop',
      'Badmouth other schools',
      'Ask questions easily found on website',
      'Be late or unprepared',
      'Forget interviewer\'s name',
    ],
  },
};

/**
 * Recommendation strategy framework
 */
export const RECOMMENDATION_STRATEGY_FRAMEWORK = {
  whoToAsk: {
    teachers: {
      ideal: [
        'Teacher who knows you well academically AND personally',
        'Teacher in a core subject relevant to your intended major',
        'Teacher who saw you grow or overcome challenge',
        'Teacher who can speak to intellectual curiosity',
      ],
      avoid: [
        'Teacher who only knows your grade',
        'Teacher from freshman year (too long ago)',
        'Teacher everyone asks (may be overwhelmed)',
        'Teacher you didn\'t have strong relationship with',
      ],
    },
    counselor: {
      ideal: [
        'Counselor who knows you personally',
        'Has specific stories and details about you',
        'Understands your context and growth',
      ],
      ifTheyDontKnowYou: [
        'Meet with them multiple times before senior year',
        'Provide detailed questionnaire/brag sheet',
        'Share specific stories and context',
      ],
    },
    additional: {
      when: [
        'Coach who saw exceptional dedication',
        'Employer who can speak to professional qualities',
        'Mentor from significant activity',
        'Only if school allows and it adds new information',
      ],
      avoid: [
        'Family friends who haven\'t worked with you',
        'Famous people you don\'t know well',
        'Recommendations that repeat teacher letters',
      ],
    },
  },

  howToAsk: {
    timing: 'End of junior year or early senior year',
    approach: [
      'Ask in person when possible',
      'Ask if they can write a STRONG letter (give them an out)',
      'Provide everything they need well in advance',
    ],
    materials: [
      'Resume or activity list',
      'Personal statement draft or topics',
      'Specific stories or examples they might include',
      'Why you\'re applying to specific schools',
      'Deadlines clearly listed',
    ],
  },

  howToMaximizeImpact: [
    'Choose recommenders who can tell DIFFERENT stories about you',
    'Brief them on what you hope they\'ll emphasize',
    'Remind them of specific moments they might include',
    'Thank them sincerely and update them on results',
  ],
};

// ============================================================================
// STAGE 4 SERVICE
// ============================================================================

export interface Stage4Input {
  // From previous stages
  studentProfile: {
    archetype: string;
    gradeLevel: string;
    harvardScore: number;
    characterDimensions: Record<string, number>;
    twoSentencePitch: string;
    topStrengths: string[];
    developmentAreas: string[];
    spikeAreas: string[];
    redFlags: string[];
  };

  activities: Array<{
    name: string;
    tier: 1 | 2 | 3 | 4;
    category: string;
    yearsInvolved: number;
    currentRole: string;
    achievements: string[];
    genuineInterest: 'high' | 'moderate' | 'low';
    growthPotential: 'high' | 'moderate' | 'low';
  }>;

  academicProfile: {
    gpa: number;
    courseRigor: string;
    trajectory: string;
    testScores?: {
      sat?: number;
      act?: number;
    };
    academicSpikes: string[];
  };

  schoolList: Array<{
    school: string;
    tier: string;
    fitScore: number;
    listCategory: 'reach' | 'target' | 'likely' | 'safety';
  }>;

  preferences: {
    intendedMajor?: string;
    careerInterests?: string[];
    summerConstraints?: string[];
    financialConstraints?: string[];
  };

  timeline: {
    currentGrade: 9 | 10 | 11 | 12;
    currentMonth: number;
    applicationYear: number;
  };
}

export interface Stage4Output {
  executiveSummary: {
    currentPosition: string;
    criticalPriorities: string[];
    timelineUrgency: 'relaxed' | 'moderate' | 'urgent' | 'critical';
    overallStrategy: string;
  };

  timelineBasedActionPlan: {
    immediate: {
      timeframe: string;
      priorities: Array<{
        action: string;
        rationale: string;
        deadline?: string;
        resources?: string[];
      }>;
    };
    shortTerm: {
      timeframe: string;
      priorities: Array<{
        action: string;
        rationale: string;
        deadline?: string;
        resources?: string[];
      }>;
    };
    mediumTerm: {
      timeframe: string;
      priorities: Array<{
        action: string;
        rationale: string;
        deadline?: string;
        resources?: string[];
      }>;
    };
    longTerm?: {
      timeframe: string;
      priorities: Array<{
        action: string;
        rationale: string;
      }>;
    };
  };

  activityOptimization: {
    deepen: Array<{
      activity: string;
      currentTier: number;
      targetTier: number;
      strategy: string;
      expectedOutcome: string;
    }>;
    maintain: Array<{
      activity: string;
      rationale: string;
    }>;
    reduce: Array<{
      activity: string;
      rationale: string;
      howToTransition: string;
    }>;
    stop: Array<{
      activity: string;
      rationale: string;
      timing: string;
    }>;
    consider_starting: Array<{
      activity: string;
      rationale: string;
      howToStart: string;
      expectedTimeline: string;
    }>;
    portfolioAfterOptimization: string;
  };

  essayStrategy: {
    personalStatementApproach: {
      recommendedTopics: Array<{
        topic: string;
        whyItWorks: string;
        angle: string;
        cautions: string[];
      }>;
      topicsToAvoid: Array<{
        topic: string;
        whyToAvoid: string;
      }>;
      voiceGuidance: string;
    };
    supplementStrategy: {
      bySchool: Record<string, {
        focusAreas: string[];
        uniqueAngles: string[];
        connectionsToMake: string[];
      }>;
      universalThemes: string[];
    };
    writingTimeline: {
      personalStatement: string;
      supplements: string;
      revisionSchedule: string;
    };
  };

  summerStrategy: {
    recommendation: string;
    tier1Options: Array<{
      program: string;
      deadline: string;
      fit: string;
      applicationTips: string;
    }>;
    tier2Options: Array<{
      program: string;
      fit: string;
    }>;
    alternativeStrategies: Array<{
      approach: string;
      howToExecute: string;
      expectedOutcome: string;
    }>;
    ifNoPrograms: string;
  };

  interviewPreparation: {
    anticipatedQuestions: Array<{
      question: string;
      whyTheyAsk: string;
      approachGuidance: string;
    }>;
    storiesToPrepare: Array<{
      theme: string;
      story: string;
      whatItShows: string;
    }>;
    schoolSpecificPrep: Record<string, string[]>;
    practiceRecommendations: string[];
  };

  recommendationStrategy: {
    teacherRecommendations: Array<{
      subject: string;
      whyThisTeacher: string;
      whatToAskThemToEmphasize: string;
      materialsToProvide: string[];
    }>;
    counselorStrategy: string;
    additionalRecommendations?: Array<{
      source: string;
      rationale: string;
      whatTheyCanAdd: string;
    }>;
    timeline: string;
  };

  riskMitigation: {
    identifiedRisks: Array<{
      risk: string;
      severity: 'high' | 'moderate' | 'low';
      mitigationStrategy: string;
    }>;
    contingencyPlans: Array<{
      scenario: string;
      response: string;
    }>;
  };

  metadata: {
    analysisDepth: 'comprehensive';
    confidenceLevel: number;
    dataQuality: string;
    limitations: string[];
  };
}

/**
 * Stage 4: Deep Strategic Guidance
 *
 * Uses Sonnet for creative synthesis that transforms analysis into
 * specific, actionable, prioritized recommendations.
 */
export async function generateStrategicGuidance(
  input: Stage4Input
): Promise<Stage4Output> {
  const systemPrompt = `You are the head of college counseling at a top prep school and a former admissions officer at Harvard. You've helped thousands of students navigate the admissions process successfully.

Your task is to provide COMPREHENSIVE STRATEGIC GUIDANCE that transforms analysis into action. Every recommendation must be:
1. SPECIFIC - Not "improve activities" but "pursue X specific opportunity"
2. ACTIONABLE - Clear steps the student can take
3. PRIORITIZED - What matters most given their timeline
4. REALISTIC - Achievable given their context
5. STRATEGIC - Connected to admissions outcomes

GRADE LEVEL PRIORITIES:
${JSON.stringify(GRADE_LEVEL_PRIORITIES, null, 2)}

ACTIVITY OPTIMIZATION FRAMEWORK:
${JSON.stringify(ACTIVITY_OPTIMIZATION_FRAMEWORK, null, 2)}

ESSAY STRATEGY FRAMEWORK:
${JSON.stringify(ESSAY_STRATEGY_FRAMEWORK, null, 2)}

SUMMER STRATEGY FRAMEWORK:
${JSON.stringify(SUMMER_STRATEGY_FRAMEWORK, null, 2)}

INTERVIEW PREP FRAMEWORK:
${JSON.stringify(INTERVIEW_PREP_FRAMEWORK, null, 2)}

RECOMMENDATION STRATEGY FRAMEWORK:
${JSON.stringify(RECOMMENDATION_STRATEGY_FRAMEWORK, null, 2)}

CRITICAL PRINCIPLES:
- Be honest about weaknesses and how to address them
- Prioritize based on current timeline (junior in fall is different from junior in spring)
- Focus on actions that will actually move the needle
- Don't recommend generic "join more clubs" advice
- Connect every recommendation to the student's specific narrative and goals

OUTPUT FORMAT: Return a complete JSON object matching the Stage4Output interface. Every recommendation should be specific to this student.`;

  const userPrompt = `Generate comprehensive strategic guidance for this student:

STUDENT PROFILE:
- Archetype: ${input.studentProfile.archetype}
- Grade Level: ${input.studentProfile.gradeLevel}
- Harvard Equivalent Score: ${input.studentProfile.harvardScore}/6
- Two-Sentence Pitch: ${input.studentProfile.twoSentencePitch}
- Top Strengths: ${input.studentProfile.topStrengths.join(', ')}
- Development Areas: ${input.studentProfile.developmentAreas.join(', ')}
- Spike Areas: ${input.studentProfile.spikeAreas.join(', ')}
- Red Flags: ${input.studentProfile.redFlags.join(', ') || 'None identified'}

CHARACTER DIMENSIONS (1-6 scale):
${Object.entries(input.studentProfile.characterDimensions).map(([dim, score]) => `- ${dim}: ${score}`).join('\n')}

ACTIVITIES:
${input.activities.map(a => `- ${a.name} (Tier ${a.tier}): ${a.yearsInvolved} years, ${a.currentRole}
  Interest: ${a.genuineInterest}, Growth Potential: ${a.growthPotential}
  Achievements: ${a.achievements.join(', ') || 'None listed'}`).join('\n')}

ACADEMIC PROFILE:
- GPA: ${input.academicProfile.gpa}
- Course Rigor: ${input.academicProfile.courseRigor}
- Trajectory: ${input.academicProfile.trajectory}
- Test Scores: ${input.academicProfile.testScores ? `SAT: ${input.academicProfile.testScores.sat}, ACT: ${input.academicProfile.testScores.act}` : 'Not yet taken'}
- Academic Spikes: ${input.academicProfile.academicSpikes.join(', ') || 'None identified'}

SCHOOL LIST:
${input.schoolList.map(s => `- ${s.school} (${s.tier}): Fit Score ${s.fitScore}, Category: ${s.listCategory}`).join('\n')}

PREFERENCES:
- Intended Major: ${input.preferences.intendedMajor || 'Undeclared'}
- Career Interests: ${input.preferences.careerInterests?.join(', ') || 'Exploring'}
- Summer Constraints: ${input.preferences.summerConstraints?.join(', ') || 'None'}
- Financial Constraints: ${input.preferences.financialConstraints?.join(', ') || 'None'}

TIMELINE:
- Current Grade: ${input.timeline.currentGrade}
- Current Month: ${input.timeline.currentMonth}
- Application Year: ${input.timeline.applicationYear}

Generate comprehensive strategic guidance that:
1. Provides prioritized action items based on current timeline
2. Optimizes activity portfolio with specific recommendations
3. Develops essay strategy with topic recommendations
4. Creates summer strategy with specific program recommendations
5. Prepares for interviews with anticipated questions
6. Develops recommendation letter strategy
7. Identifies risks and mitigation strategies

Return your guidance as a JSON object matching the Stage4Output interface.`;

  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-5-20250514',
      systemPrompt,
      userPrompt,
      maxTokens: 12000,
      temperature: 0.4,
    });

    // Parse and validate response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const result: Stage4Output = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.executiveSummary || !result.timelineBasedActionPlan || !result.activityOptimization) {
      throw new Error('Missing required fields in strategic guidance output');
    }

    return result;
  } catch (error) {
    console.error('[Stage4] Strategic guidance generation failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const stage4StrategicGuidance = {
  GRADE_LEVEL_PRIORITIES,
  ACTIVITY_OPTIMIZATION_FRAMEWORK,
  ESSAY_STRATEGY_FRAMEWORK,
  SUMMER_STRATEGY_FRAMEWORK,
  INTERVIEW_PREP_FRAMEWORK,
  RECOMMENDATION_STRATEGY_FRAMEWORK,
  generateStrategicGuidance,
};
