import {
  ProfileStoryData,
  CompetitiveStandingData,
  AttributionData,
  NextStepsData,
  ProgressTrackingData,
} from './types/portfolioTypes';

// Hard-coded mock data for portfolio insights dashboard display
export const MOCK_PROFILE_STORY: ProfileStoryData = {
  score: 82,
  tierName: 'Diamond Achiever',
  summarySentences: [
    "You've built something remarkable across multiple domains.",
    'Your leadership shines through authentic community impact, supported by strong academics.',
    "You're competitive for selective universities and have a clear path to elite tier.",
  ],
  fullNarrative: {
    strengths: [
      {
        title: 'Leadership Impact',
        score: 9.5,
        percentile: 'Top 5%',
        evidence: [
          'Founded coding club with 120 active members',
          'Captain of 3 varsity teams with regional championships',
          'Led community outreach initiative serving 500+ families',
        ],
        icon: 'leadership',
        impactStatement:
          'Colleges see authentic leadership with measurable impact and sustained commitment.',
      },
      {
        title: 'Service & Community',
        score: 9.2,
        percentile: 'Top 8%',
        evidence: [
          '450+ volunteer hours over 3 years',
          'Founded local tutoring program',
          'Organized 3 major fundraising events',
        ],
        icon: 'service',
        impactStatement:
          'Your service demonstrates genuine care and initiative beyond checking boxes.',
      },
      {
        title: 'Academic Excellence',
        score: 8.5,
        percentile: 'Top 15%',
        evidence: [
          'GPA: 3.95 weighted',
          'SAT: 1520 (770M, 750V)',
          '6 AP courses with 5s in Calc BC, CS, Physics',
        ],
        icon: 'academic',
        impactStatement:
          'Strong academics provide the foundation for your compelling profile.',
      },
    ],
    opportunities: [
      {
        title: 'Academic Differentiation',
        currentScore: 7.8,
        targetScore: 8.5,
        whyItMatters:
          'Elite schools want to see intellectual curiosity beyond standard coursework.',
        specificAction:
          'Start a research project in your intended major or enter an academic competition like USACO, Science Olympiad, or Math competitions.',
        estimatedImpact: '+0.4 to +0.7 points',
      },
      {
        title: 'National Recognition',
        currentScore: 7.2,
        targetScore: 8.0,
        whyItMatters:
          'Awards at state/national level signal exceptional achievement to admissions officers.',
        specificAction:
          'Apply for Coca-Cola Scholar, pursue National Merit recognition, or compete in national-level competitions.',
        estimatedImpact: '+0.5 to +0.8 points',
      },
    ],
    schoolFit: {
      elite: {
        schools: ['MIT', 'Stanford', 'Caltech', 'Princeton'],
        status: 'Reach - Close Gap',
        gap: -0.7,
      },
      target: {
        schools: ['UC Berkeley', 'UCLA', 'Georgia Tech', 'Michigan'],
        status: 'Competitive',
        gap: 0.2,
      },
      safety: {
        schools: ['Top 30 Universities', 'Honors Programs'],
        status: 'Excellent Position',
        gap: 1.0,
      },
    },
  },
};

export const MOCK_COMPETITIVE_STANDING: CompetitiveStandingData = {
  yourScore: 8.2,
  spectrum: {
    min: 7.0,
    max: 9.0,
    safetyThreshold: 7.5,
    targetThreshold: 8.0,
    reachThreshold: 8.5,
  },
  tiers: {
    elite: {
      name: 'Elite Tier (Reach)',
      schools: ['MIT', 'Stanford', 'Caltech', 'Princeton', 'Harvard'],
      averageAdmitScore: 8.9,
      yourScore: 8.2,
      gap: -0.7,
      status: 'needs-work',
      metricBreakdown: {
        academic: { yours: 8.5, needed: 9.2, action: 'Add research or major competition' },
        leadership: { yours: 9.5, needed: 9.0, action: 'Already strong!' },
        extracurricular: { yours: 8.0, needed: 8.8, action: 'Seek national recognition' },
      },
      specificActions: [
        {
          action: 'Start research project with publication potential',
          impact: '+0.4 points',
          priority: 'high',
        },
        {
          action: 'Enter national academic competition (USACO, Science Olympiad)',
          impact: '+0.3 points',
          priority: 'high',
        },
        {
          action: 'Apply for prestigious national scholarships/programs',
          impact: '+0.2 points',
          priority: 'medium',
        },
      ],
      admissionProbability: { min: 15, max: 25 },
    },
    target: {
      name: 'Target Tier',
      schools: ['UC Berkeley', 'UCLA', 'Georgia Tech', 'Michigan', 'Carnegie Mellon'],
      averageAdmitScore: 8.0,
      yourScore: 8.2,
      gap: 0.2,
      status: 'competitive',
      metricBreakdown: {
        academic: { yours: 8.5, needed: 8.0, action: 'Ahead of average' },
        leadership: { yours: 9.5, needed: 8.5, action: 'Standout strength' },
        extracurricular: { yours: 8.0, needed: 7.8, action: 'Competitive' },
      },
      specificActions: [
        {
          action: 'Craft compelling narrative essays highlighting your unique story',
          impact: '+0.3 points in holistic review',
          priority: 'high',
        },
        {
          action: 'Secure strong LORs from teachers who know your impact',
          impact: 'Critical for admission',
          priority: 'high',
        },
      ],
      admissionProbability: { min: 40, max: 60 },
    },
    safety: {
      name: 'Safety Tier',
      schools: ['Top 30 Universities', 'Honors Programs', 'Merit Scholarships'],
      averageAdmitScore: 7.2,
      yourScore: 8.2,
      gap: 1.0,
      status: 'ahead',
      metricBreakdown: {
        academic: { yours: 8.5, needed: 7.0, action: 'Well above average' },
        leadership: { yours: 9.5, needed: 7.5, action: 'Exceptional' },
        extracurricular: { yours: 8.0, needed: 7.0, action: 'Strong' },
      },
      specificActions: [
        {
          action: 'Apply early to maximize merit scholarship opportunities',
          impact: 'Full-ride potential',
          priority: 'high',
        },
        {
          action: 'Target honors colleges for enhanced experience',
          impact: 'Elite opportunities at safety schools',
          priority: 'medium',
        },
      ],
      admissionProbability: { min: 80, max: 95 },
    },
  },
};

export const MOCK_ATTRIBUTION: AttributionData = {
  contributions: [
    {
      id: '1',
      category: 'Leadership',
      title: 'Leadership Impact',
      points: 18,
      percentile: 'Top 5%',
      icon: 'leadership',
      breakdown: [
        { source: 'Founded coding club (120 members)', pointValue: 8 },
        { source: 'Captain of 3 varsity teams', pointValue: 6 },
        { source: 'Community outreach leadership', pointValue: 4 },
      ],
      evidence: [
        'Grew club from 12 to 120 members in 2 years',
        'Led teams to 3 regional championships',
        'Organized events serving 500+ families',
      ],
      peerComparison: 'Most students have 1-2 leadership positions; you have 5+ with measurable growth.',
      admissionsContext: 'Admissions officers look for authentic leadership with tangible impact - you demonstrate both depth and breadth.',
    },
    {
      id: '2',
      category: 'Service',
      title: 'Community Service',
      points: 14,
      percentile: 'Top 8%',
      icon: 'service',
      breakdown: [
        { source: '450+ volunteer hours', pointValue: 6 },
        { source: 'Founded tutoring program', pointValue: 5 },
        { source: 'Fundraising initiatives', pointValue: 3 },
      ],
      evidence: [
        'Sustained 3-year commitment to local nonprofit',
        'Tutored 40+ students in underserved community',
        'Raised $15,000 for community programs',
      ],
      peerComparison: 'Average applicant has 50-100 service hours; you have 4.5x that with leadership roles.',
      admissionsContext: 'Elite schools value quality over quantity - your sustained commitment and initiative set you apart.',
    },
    {
      id: '3',
      category: 'Awards',
      title: 'Award Recognition',
      points: 12,
      percentile: 'Top 12%',
      icon: 'awards',
      breakdown: [
        { source: 'State-level science fair winner', pointValue: 5 },
        { source: 'AP Scholar with Distinction', pointValue: 4 },
        { source: 'Regional athletic championships', pointValue: 3 },
      ],
      evidence: [
        '1st place at state science fair',
        '5s on 6 AP exams',
        '3 regional championship titles',
      ],
      peerComparison: 'Most competitive applicants have 5-8 significant awards; you have 12 spanning multiple domains.',
      admissionsContext: 'Demonstrates excellence across academics, research, and athletics - rare combination.',
    },
    {
      id: '4',
      category: 'Academic',
      title: 'Academic Excellence',
      points: 11,
      icon: 'academic',
      breakdown: [
        { source: 'GPA 3.95 (weighted 4.3)', pointValue: 5 },
        { source: 'SAT 1520', pointValue: 4 },
        { source: 'Advanced coursework (6 APs)', pointValue: 2 },
      ],
      evidence: [
        'Top 5% of graduating class',
        '770 Math, 750 Verbal on SAT',
        'All 5s on AP Calc BC, Physics, CS',
      ],
      peerComparison: 'At elite schools, median SAT is 1480-1550; you are in the competitive range.',
      admissionsContext: 'Strong academics provide credibility for your spike in leadership and service.',
    },
    {
      id: '5',
      category: 'Extracurricular',
      title: 'Extracurricular Depth',
      points: 10,
      icon: 'extracurricular',
      breakdown: [
        { source: '3 varsity sports', pointValue: 4 },
        { source: 'Coding club founder & president', pointValue: 4 },
        { source: 'Science Olympiad captain', pointValue: 2 },
      ],
      evidence: [
        'Varsity soccer, basketball, track (3 years each)',
        'Coding club: won regional hackathon',
        'Science Olympiad: placed 2nd at state',
      ],
      peerComparison: 'You balance athletics with academic pursuits - demonstrates time management and versatility.',
      admissionsContext: 'Shows you can handle rigorous demands while excelling in multiple areas.',
    },
  ],
};

export const MOCK_NEXT_STEPS: NextStepsData = {
  actions: [
    {
      id: '1',
      title: 'Start Research Project',
      category: 'Academic Differentiation',
      effort: 'high',
      quickImpact: '+0.5 pts',
      whyItMatters:
        'Elite schools want to see genuine intellectual curiosity beyond coursework. Research demonstrates initiative, critical thinking, and passion for your field.',
      specificSteps: [
        { step: 'Identify your research interest area (CS, engineering, science)', completed: false },
        { step: 'Reach out to 3-5 local professors or research institutions', completed: false },
        { step: 'Propose a specific project with clear methodology', completed: false },
        { step: 'Commit 5-10 hours/week for 3-6 months', completed: false },
        { step: 'Submit findings to science fairs or journals', completed: false },
      ],
      timeline: '3-6 months',
      expectedImpact: {
        points: { min: 0.4, max: 0.7 },
        description: 'Major boost to academic differentiation and intellectual vitality',
      },
      difficulty: {
        level: 'Challenging but achievable',
        timeCommitment: '5-10 hours/week for 3-6 months',
      },
    },
    {
      id: '2',
      title: 'Enter National Competition',
      category: 'Recognition & Awards',
      effort: 'medium',
      quickImpact: '+0.4 pts',
      whyItMatters:
        'National-level recognition signals exceptional ability to admissions officers. Even placing in top 50-100 nationally is meaningful.',
      specificSteps: [
        { step: 'Choose competition aligned with your strengths (USACO, Science Olympiad, Math)', completed: false },
        { step: 'Review past problems and study strategies', completed: false },
        { step: 'Practice 2-3 hours/week leading up to competition', completed: false },
        { step: 'Register before deadlines (usually Sept-Jan)', completed: false },
        { step: 'Compete and document results', completed: false },
      ],
      timeline: '2-4 months',
      expectedImpact: {
        points: { min: 0.3, max: 0.5 },
        description: 'Elevates profile with objective third-party validation',
      },
      difficulty: {
        level: 'Moderate - requires focused preparation',
        timeCommitment: '2-3 hours/week for 2-4 months',
      },
    },
    {
      id: '3',
      title: 'Apply for National Programs',
      category: 'Recognition',
      effort: 'low',
      quickImpact: '+0.3 pts',
      whyItMatters:
        'Programs like Coca-Cola Scholars, Davidson Fellows, or National Merit provide prestigious recognition that stands out.',
      specificSteps: [
        { step: 'Research 5-7 programs you qualify for', completed: false },
        { step: 'Prepare strong essays highlighting your unique story', completed: false },
        { step: 'Secure recommendation letters', completed: false },
        { step: 'Submit applications by deadlines (Oct-Feb)', completed: false },
      ],
      timeline: '1-2 months',
      expectedImpact: {
        points: { min: 0.2, max: 0.4 },
        description: 'National recognition elevates your profile significantly',
      },
      difficulty: {
        level: 'Straightforward with good essays',
        timeCommitment: 'Front-loaded: 10-15 hours total',
      },
    },
    {
      id: '4',
      title: 'Enhance Essay Narrative',
      category: 'Application Strategy',
      effort: 'medium',
      quickImpact: '+0.3 pts',
      whyItMatters:
        'Your story connects the dots - a compelling narrative can be the difference between admit and waitlist.',
      specificSteps: [
        { step: 'Identify your unique "spike" or theme', completed: false },
        { step: 'Draft Common App essay (4-6 revisions)', completed: false },
        { step: 'Craft supplemental essays that complement main narrative', completed: false },
        { step: 'Get feedback from teachers, counselors, mentors', completed: false },
        { step: 'Polish and proofread thoroughly', completed: false },
      ],
      timeline: '6-8 weeks',
      expectedImpact: {
        points: { min: 0.2, max: 0.5 },
        description: 'Holistic review boost - makes your entire application more memorable',
      },
      difficulty: {
        level: 'Moderate - requires introspection',
        timeCommitment: '15-20 hours total over 6-8 weeks',
      },
    },
  ],
};

export const MOCK_PROGRESS_TRACKING: ProgressTrackingData = {
  currentTier: 'Diamond Achiever',
  nextTier: 'Elite Platinum',
  progress: 75,
  pointsNeeded: 3.2,
  milestones: [
    {
      id: '1',
      title: 'Complete 6 AP courses with 5s',
      status: 'completed',
      points: 2.5,
      action: 'Achieved! Strong academic foundation established.',
      resources: [],
    },
    {
      id: '2',
      title: 'Reach 400+ service hours',
      status: 'completed',
      points: 1.8,
      action: 'Exceeded with 450+ hours and leadership roles.',
      resources: [],
    },
    {
      id: '3',
      title: 'Start research project or major competition',
      status: 'in-progress',
      points: 3.5,
      deadline: 'Next 3 months',
      action: 'Identify research opportunity or register for USACO/Science Olympiad.',
      resources: [
        'Contact local university labs',
        'Review past competition problems',
        'Consult with science teacher',
      ],
    },
    {
      id: '4',
      title: 'Achieve national-level recognition',
      status: 'in-progress',
      points: 2.8,
      deadline: 'Next 4-6 months',
      action: 'Apply for Coca-Cola Scholar, pursue National Merit, or compete nationally.',
      resources: [
        'Coca-Cola Scholars application guide',
        'National Merit qualification requirements',
        'Competition registration deadlines',
      ],
    },
    {
      id: '5',
      title: 'Craft compelling personal statement',
      status: 'future',
      points: 1.5,
      deadline: 'Summer before senior year',
      action: 'Develop your unique narrative that ties together your leadership and impact.',
      resources: [
        'Common App essay prompts',
        'Sample essays from admitted students',
        'Schedule sessions with counselor',
      ],
    },
    {
      id: '6',
      title: 'Secure strong letters of recommendation',
      status: 'future',
      points: 1.2,
      deadline: 'Early senior year',
      action: 'Build relationships with 2-3 teachers who know your work deeply.',
      resources: [
        'Ask teachers who taught you in 11th grade',
        'Provide "brag sheet" with accomplishments',
        'Request before summer of senior year',
      ],
    },
  ],
};
