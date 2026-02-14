// HARD-CODED MOCK DATA: Sample ActivityWorkshopPipelineResult representing a first-gen student's
// portfolio analysis. Replace with real API data when the pipeline endpoint is wired up.

export interface ActivityWorkshopPipelineResult {
  sessionId: string;
  version: string;
  totalCost: number;
  stage0: {
    narrativeIdentity: {
      archetype: string;
      archetypeConfidence: number;
      storyEssence: string;
      primaryTheme: string;
      secondaryThemes: string[];
    };
    spikeHypothesis: {
      spikeArea?: string;
      maturity: "mature" | "developing" | "emerging" | "absent";
    };
    contextualFactors: {
      hasWorkFamilyObligations: boolean;
      workFamilyContext?: string;
      hasResourceConstraints: boolean;
      firstGenIndicators: boolean;
    };
    narrativeThreads: Array<{
      thread: string;
      activityIds: string[];
      strength: "strong" | "emerging" | "weak";
      evidence: string;
    }>;
    activityStoryRoles: Array<{
      activityId: string;
      storyRole: string;
      centralityScore: number;
      roleExplanation: string;
    }>;
  };
  stage1: {
    activities: Record<string, {
      activityId: string;
      classification: { tier: 1 | 2 | 3 | 4; detectedCategory: string };
      timeInvestment: { totalHours: number };
      redFlags: Array<{ flag: string; severity: string }>;
      greenFlags: Array<{ flag: string }>;
      descriptionQuality: { issues: string[] };
    }>;
    tierDistribution: { tier1: number; tier2: number; tier3: number; tier4: number };
    teachingCandidates: {
      deepTeachingIds: string[];
      mediumTeachingIds: string[];
      quickEncouragementIds: string[];
    };
    coherenceAnalysis: { score: number; primaryTheme: string };
  };
  stage3: {
    finalAssessment: {
      harvardScale: 1 | 2 | 3 | 4 | 5 | 6;
      overallStrength: string;
      confidence: number;
    };
    orderedActivities: Array<{ rank: number; activityId: string; reason: string }>;
    actionPlan: {
      immediate: Array<{ action: string; impact: string }>;
      shortTerm: Array<{ action: string; impact: string; deadline?: string }>;
      longTerm: Array<{ action: string; impact: string }>;
    };
  };
  finalNarrative?: {
    story: { pitch: string; uniqueAngle: string; emergentTraits: string[] };
    threads: Array<{ name: string; activityIds: string[]; synergy: string }>;
    elevations: Array<{
      elevatingActivityId: string;
      elevatedActivityId: string;
      mechanism: string;
      strength: "transformative" | "strong" | "moderate" | "subtle";
    }>;
    coherence: { score: number; assessment: string };
    spike: { primarySpike: { area: string; activities: string[] } };
  };
  scoring?: {
    activityScores: Array<{
      activityId: string;
      activityTitle: string;
      combinedScore: { total: number };
      activityScore: {
        total: number;
        breakdown: {
          tierAssessment: { score: number; weight: number };
          recognitionLevel: { score: number; weight: number };
          commitmentProgression: { score: number; weight: number };
          communityCharacter: { score: number; weight: number };
          leadershipImpact: { score: number; weight: number };
        };
      };
      descriptionScore: {
        total: number;
        breakdown: {
          specificity: { score: number };
          impactClarity: { score: number };
          authenticityVoice: { score: number };
          actionLanguage: { score: number };
          quantification: { score: number };
        };
      };
    }>;
    portfolioRubric: {
      overallScore: { total: number };
      harvardScale: { rating: number; description: string };
    };
  };
}

// Activity title lookup for display purposes
export const activityTitles: Record<string, string> = {
  'research': 'ML Healthcare Research',
  'cs-club': 'CS Club Founder & President',
  'farm': 'Family Farm Operations',
  'grocery': 'Grocery Store Shift Lead',
  'tutoring': 'STEM Tutoring Program',
};

export const MOCK_DATA: ActivityWorkshopPipelineResult = {
  sessionId: 'mock-session-001',
  version: '4.3.0',
  totalCost: 0,

  stage0: {
    narrativeIdentity: {
      archetype: 'innovator',
      archetypeConfidence: 78,
      storyEssence: 'A first-gen student who creates infrastructure and teaches others, driven by genuine intellectual curiosity in CS and deep responsibility to their community and family.',
      primaryTheme: 'Technology as Community Infrastructure',
      secondaryThemes: ['Responsibility-Driven Excellence', 'First-Generation STEM Pipeline Builder'],
    },
    spikeHypothesis: {
      spikeArea: 'Computer Science & Educational Leadership',
      maturity: 'emerging',
    },
    contextualFactors: {
      hasWorkFamilyObligations: true,
      workFamilyContext: 'Works 20 hours/week at grocery store, helps manage family farm',
      hasResourceConstraints: true,
      firstGenIndicators: true,
    },
    narrativeThreads: [
      {
        thread: 'Technology as Community Infrastructure',
        activityIds: ['cs-club', 'research', 'tutoring'],
        strength: 'strong',
        evidence: 'Founded CS club, conducts ML research on rural healthcare, tutors STEM students',
      },
      {
        thread: 'Responsibility-Driven Excellence',
        activityIds: ['grocery', 'farm', 'research'],
        strength: 'emerging',
        evidence: 'Balances paid work, farm duties, and academic research simultaneously',
      },
      {
        thread: 'First-Generation STEM Pipeline Builder',
        activityIds: ['cs-club', 'tutoring', 'research'],
        strength: 'emerging',
        evidence: 'Creating pathways for other first-gen students through teaching and mentorship',
      },
    ],
    activityStoryRoles: [
      { activityId: 'research', storyRole: 'core_identity', centralityScore: 92, roleExplanation: 'Strongest differentiator — original ML research on rural healthcare' },
      { activityId: 'cs-club', storyRole: 'passion_pursuit', centralityScore: 85, roleExplanation: 'Shows initiative and educational leadership' },
      { activityId: 'farm', storyRole: 'obligation', centralityScore: 70, roleExplanation: 'Most compelling first-gen context story' },
      { activityId: 'grocery', storyRole: 'obligation', centralityScore: 65, roleExplanation: 'Work ethic, earned promotion to shift lead' },
      { activityId: 'tutoring', storyRole: 'impact_vehicle', centralityScore: 75, roleExplanation: 'Reinforces teaching theme and community impact' },
    ],
  },

  stage1: {
    activities: {
      'research': {
        activityId: 'research',
        classification: { tier: 2, detectedCategory: 'Research & Academic' },
        timeInvestment: { totalHours: 520 },
        redFlags: [],
        greenFlags: [{ flag: 'Original research with real-world application' }, { flag: 'Paper submission to peer-reviewed venue' }],
        descriptionQuality: { issues: ['Could quantify ML model accuracy'] },
      },
      'cs-club': {
        activityId: 'cs-club',
        classification: { tier: 2, detectedCategory: 'Leadership & Clubs' },
        timeInvestment: { totalHours: 480 },
        redFlags: [],
        greenFlags: [{ flag: 'Founded organization' }, { flag: 'Grew membership significantly' }],
        descriptionQuality: { issues: ['Add specific curriculum details'] },
      },
      'farm': {
        activityId: 'farm',
        classification: { tier: 3, detectedCategory: 'Family Responsibility' },
        timeInvestment: { totalHours: 1560 },
        redFlags: [],
        greenFlags: [{ flag: 'Demonstrates character and responsibility' }],
        descriptionQuality: { issues: [] },
      },
      'grocery': {
        activityId: 'grocery',
        classification: { tier: 4, detectedCategory: 'Work Experience' },
        timeInvestment: { totalHours: 3120 },
        redFlags: [],
        greenFlags: [{ flag: 'Earned promotion to shift lead' }],
        descriptionQuality: { issues: ['Describe management responsibilities'] },
      },
      'tutoring': {
        activityId: 'tutoring',
        classification: { tier: 3, detectedCategory: 'Community Service & Teaching' },
        timeInvestment: { totalHours: 360 },
        redFlags: [],
        greenFlags: [{ flag: 'Direct student impact' }],
        descriptionQuality: { issues: ['Track student outcomes'] },
      },
    },
    tierDistribution: { tier1: 0, tier2: 2, tier3: 2, tier4: 1 },
    teachingCandidates: {
      deepTeachingIds: ['research', 'cs-club'],
      mediumTeachingIds: ['farm', 'grocery'],
      quickEncouragementIds: ['tutoring'],
    },
    coherenceAnalysis: { score: 78, primaryTheme: 'Technology as Community Infrastructure' },
  },

  stage3: {
    finalAssessment: {
      harvardScale: 3,
      overallStrength: 'competitive',
      confidence: 78,
    },
    orderedActivities: [
      { rank: 1, activityId: 'research', reason: 'Strongest differentiator — original ML research, Tier 2' },
      { rank: 2, activityId: 'cs-club', reason: 'Shows initiative and educational leadership' },
      { rank: 3, activityId: 'farm', reason: 'Most compelling first-gen story' },
      { rank: 4, activityId: 'grocery', reason: 'Work ethic, earned promotion' },
      { rank: 5, activityId: 'tutoring', reason: 'Reinforces teaching theme' },
    ],
    actionPlan: {
      immediate: [
        { action: 'Quantify ML research impact — model accuracy, dataset size, patient outcomes affected', impact: 'Elevates research from "impressive" to "measurable"' },
        { action: 'Document CS Club growth metrics — members, events, curriculum modules created', impact: 'Strengthens leadership narrative with concrete numbers' },
      ],
      shortTerm: [
        { action: 'Follow up on research paper submission status', impact: 'Publication would push toward Tier 1', deadline: '3 months' },
        { action: 'Identify and document 3 specific student success stories from tutoring', impact: 'Transforms tutoring from generic to compelling' },
      ],
      longTerm: [
        { action: 'Develop capstone narrative connecting CS research to rural healthcare mission', impact: 'Creates unforgettable application story' },
        { action: 'Explore REU programs to deepen research credentials', impact: 'Could elevate to Harvard Scale 2' },
      ],
    },
  },

  finalNarrative: {
    story: {
      pitch: 'This student taught themselves machine learning while stocking shelves at night, then used NLP to analyze healthcare gaps in their own rural community — turning a 20-hour work week and family farm obligations into the foundation for research that matters.',
      uniqueAngle: 'The intersection of paid labor, family obligation, and cutting-edge CS research creates a profile that is impossible to replicate',
      emergentTraits: ['resourcefulness', 'intellectual curiosity', 'community responsibility'],
    },
    threads: [
      { name: 'Technology as Community Infrastructure', activityIds: ['cs-club', 'research', 'tutoring'], synergy: 'Each activity builds on the others — research produces knowledge, CS club distributes it, tutoring applies it directly' },
      { name: 'Responsibility-Driven Excellence', activityIds: ['grocery', 'farm', 'research'], synergy: 'Work obligations don\'t compete with academics — they fuel the motivation and provide real-world context' },
      { name: 'First-Generation STEM Pipeline', activityIds: ['cs-club', 'tutoring', 'research'], synergy: 'Creating the support system this student never had, for others like them' },
    ],
    elevations: [
      { elevatingActivityId: 'grocery', elevatedActivityId: 'research', mechanism: '3,120 hours of paid work transforms the research from "impressive" to "extraordinary" — this student earned every hour of research time', strength: 'transformative' },
      { elevatingActivityId: 'farm', elevatedActivityId: 'research', mechanism: 'Rural farm context gives the healthcare research personal stakes and authentic motivation', strength: 'strong' },
    ],
    coherence: { score: 78, assessment: 'Strong coherence — activities tell a unified story of a resourceful first-gen student building technology infrastructure for their community' },
    spike: { primarySpike: { area: 'Computer Science & Educational Leadership', activities: ['research', 'cs-club', 'tutoring'] } },
  },

  scoring: {
    activityScores: [
      {
        activityId: 'research', activityTitle: 'ML Healthcare Research',
        combinedScore: { total: 8.1 },
        activityScore: { total: 8.5, breakdown: { tierAssessment: { score: 8, weight: 0.30 }, recognitionLevel: { score: 7.5, weight: 0.25 }, commitmentProgression: { score: 9, weight: 0.175 }, communityCharacter: { score: 9, weight: 0.15 }, leadershipImpact: { score: 8, weight: 0.125 } } },
        descriptionScore: { total: 6.2, breakdown: { specificity: { score: 6 }, impactClarity: { score: 5 }, authenticityVoice: { score: 7 }, actionLanguage: { score: 7 }, quantification: { score: 4 } } },
      },
      {
        activityId: 'cs-club', activityTitle: 'CS Club Founder & President',
        combinedScore: { total: 7.8 },
        activityScore: { total: 8.2, breakdown: { tierAssessment: { score: 8, weight: 0.30 }, recognitionLevel: { score: 7, weight: 0.25 }, commitmentProgression: { score: 8.5, weight: 0.175 }, communityCharacter: { score: 8.5, weight: 0.15 }, leadershipImpact: { score: 9, weight: 0.125 } } },
        descriptionScore: { total: 5.8, breakdown: { specificity: { score: 5 }, impactClarity: { score: 6 }, authenticityVoice: { score: 7 }, actionLanguage: { score: 6 }, quantification: { score: 5 } } },
      },
      {
        activityId: 'farm', activityTitle: 'Family Farm Operations',
        combinedScore: { total: 6.9 },
        activityScore: { total: 7.0, breakdown: { tierAssessment: { score: 5, weight: 0.30 }, recognitionLevel: { score: 5, weight: 0.25 }, commitmentProgression: { score: 9, weight: 0.175 }, communityCharacter: { score: 9, weight: 0.15 }, leadershipImpact: { score: 7, weight: 0.125 } } },
        descriptionScore: { total: 5.5, breakdown: { specificity: { score: 5 }, impactClarity: { score: 5 }, authenticityVoice: { score: 8 }, actionLanguage: { score: 5 }, quantification: { score: 4 } } },
      },
      {
        activityId: 'grocery', activityTitle: 'Grocery Store Shift Lead',
        combinedScore: { total: 6.2 },
        activityScore: { total: 6.5, breakdown: { tierAssessment: { score: 4, weight: 0.30 }, recognitionLevel: { score: 5, weight: 0.25 }, commitmentProgression: { score: 8, weight: 0.175 }, communityCharacter: { score: 7, weight: 0.15 }, leadershipImpact: { score: 7, weight: 0.125 } } },
        descriptionScore: { total: 5.2, breakdown: { specificity: { score: 5 }, impactClarity: { score: 4 }, authenticityVoice: { score: 6 }, actionLanguage: { score: 6 }, quantification: { score: 4 } } },
      },
      {
        activityId: 'tutoring', activityTitle: 'STEM Tutoring Program',
        combinedScore: { total: 7.0 },
        activityScore: { total: 6.8, breakdown: { tierAssessment: { score: 5, weight: 0.30 }, recognitionLevel: { score: 6, weight: 0.25 }, commitmentProgression: { score: 7, weight: 0.175 }, communityCharacter: { score: 9, weight: 0.15 }, leadershipImpact: { score: 8, weight: 0.125 } } },
        descriptionScore: { total: 6.3, breakdown: { specificity: { score: 6 }, impactClarity: { score: 6 }, authenticityVoice: { score: 7 }, actionLanguage: { score: 7 }, quantification: { score: 5 } } },
      },
    ],
    portfolioRubric: {
      overallScore: { total: 7.2 },
      harvardScale: { rating: 3, description: 'Competitive' },
    },
  },
};
