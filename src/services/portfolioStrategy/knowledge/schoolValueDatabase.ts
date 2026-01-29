/**
 * School-Specific Value Matrices Database
 *
 * Comprehensive data on what each elite school specifically values,
 * admission statistics, demonstrated interest impact, and strategic
 * guidance for school-specific optimization.
 *
 * Based on:
 * - Common Data Set reports
 * - Admissions officer interviews and published statements
 * - Historical admission pattern analysis
 * - Research from former AOs (including Sara Harberson, Jeff Selingo)
 */

// ============================================================================
// ELITE SCHOOL VALUE MATRICES
// ============================================================================

export interface SchoolValueMatrix {
  name: string;
  type: 'ivy' | 'elite_private' | 'tech' | 'lac' | 'elite_public';

  // What this school distinctively values (beyond universal factors)
  distinctiveValues: {
    primary: string[];     // Most important differentiators
    secondary: string[];   // Also important but not as distinctive
    signals: string[];     // Specific things they look for
  };

  // Academic preferences
  academicPreferences: {
    testOptional: boolean;
    testImportance: 'high' | 'medium' | 'low';
    courseRigorWeight: 'high' | 'medium' | 'low';
    preferredSubjects?: string[];
    researchEmphasis: 'high' | 'medium' | 'low';
  };

  // Character dimension weights (relative to baseline)
  characterWeights: {
    intellectual_vitality: number;   // 0.8-1.2 relative to baseline
    leadership_quality: number;
    community_impact: number;
    personal_growth: number;
    resilience_grit: number;
    creativity_innovation: number;
    authenticity_voice: number;
  };

  // Activity preferences
  activityPreferences: {
    spikePreference: 'strong' | 'moderate' | 'balanced';
    preferredDomains: string[];
    valuesDomains: string[];   // Also valued but not distinctive
    lessValuedDomains: string[];
  };

  // Essay preferences
  essayPreferences: {
    tonePreference: string;
    topicsToHighlight: string[];
    topicsToAvoid: string[];
    distinctiveQuirks?: string[];
  };

  // Fit indicators
  fitIndicators: {
    strongFitSignals: string[];
    weakFitSignals: string[];
    redFlags: string[];
  };

  // Admission statistics
  stats: {
    acceptanceRate: number;
    edBoost: number;          // Multiplier for ED acceptance
    legacyBoost: number;      // Multiplier for legacy
    athleteSpots: number;     // Approximate % of class
    yield: number;            // % who enroll when accepted
  };
}

export const ELITE_SCHOOL_VALUE_MATRICES: Record<string, SchoolValueMatrix> = {
  harvard: {
    name: 'Harvard University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Leadership with impact - not just titles',
        'Future change-makers and influencers',
        'Intellectual curiosity across disciplines',
        'Community builders and connectors',
      ],
      secondary: [
        'Global perspective and cultural awareness',
        'Service orientation with genuine impact',
        'Achievement excellence in chosen domains',
      ],
      signals: [
        '"Could be a senator, CEO, or Nobel laureate" potential',
        'Evidence of making things happen, not just participating',
        'Genuine intellectual engagement beyond academics',
        'Letters that describe exceptional human qualities',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.1,
      leadership_quality: 1.2,
      community_impact: 1.1,
      personal_growth: 1.0,
      resilience_grit: 0.9,
      creativity_innovation: 1.0,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['leadership', 'public_service', 'debate_speech', 'entrepreneurship'],
      valuesDomains: ['research', 'arts', 'athletics', 'community_service'],
      lessValuedDomains: [],  // Harvard values broad excellence
    },

    essayPreferences: {
      tonePreference: 'Mature, reflective, showing breadth of thinking',
      topicsToHighlight: [
        'Leadership and impact on others',
        'Intellectual journey and curiosity',
        'Community building and connection',
        'How you\'ve made something better',
      ],
      topicsToAvoid: [
        'Pure achievement lists',
        'Single-minded focus without broader interests',
        'Privileged experiences without self-awareness',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Elected leadership positions with real impact',
        'Started something that others now lead',
        'Intellectual interests across multiple domains',
        'Service that created lasting change',
        'Strong recommenders who know them well',
      ],
      weakFitSignals: [
        'Pure academic focus without extracurricular engagement',
        'Activities without leadership or impact',
        'Single narrow interest without broader curiosity',
      ],
      redFlags: [
        'Titles without substance',
        'Packaged/consultant feel to application',
        'No evidence of genuine intellectual curiosity',
      ],
    },

    stats: {
      acceptanceRate: 0.034,
      edBoost: 1.0,  // No ED
      legacyBoost: 3.0,
      athleteSpots: 20,
      yield: 0.84,
    },
  },

  stanford: {
    name: 'Stanford University',
    type: 'elite_private',

    distinctiveValues: {
      primary: [
        'Intellectual vitality - learning for its own sake',
        'Entrepreneurial mindset - builders and creators',
        'Innovation and willingness to try new things',
        'Joy and engagement - "fun to be around"',
      ],
      secondary: [
        'Risk-taking and resilience',
        'Cross-disciplinary thinking',
        'Positive energy and collaboration',
      ],
      signals: [
        '"Would I want this person in my seminar?"',
        'Evidence of creating, building, starting things',
        'Unusual combinations of interests',
        'Genuine enthusiasm that comes through in writing',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'high',
      preferredSubjects: ['CS', 'engineering', 'sciences', 'interdisciplinary'],
    },

    characterWeights: {
      intellectual_vitality: 1.3,
      leadership_quality: 0.9,
      community_impact: 0.9,
      personal_growth: 1.0,
      resilience_grit: 1.0,
      creativity_innovation: 1.3,
      authenticity_voice: 1.2,
    },

    activityPreferences: {
      spikePreference: 'strong',
      preferredDomains: ['entrepreneurship', 'research', 'cs_tech', 'innovation'],
      valuesDomains: ['athletics', 'arts', 'leadership'],
      lessValuedDomains: ['traditional_service'],
    },

    essayPreferences: {
      tonePreference: 'Quirky, intellectual, enthusiastic, genuine',
      topicsToHighlight: [
        'Intellectual curiosity and what excites you',
        'Things you\'ve built or created',
        'Unusual interests or perspectives',
        'Moments of learning and growth',
      ],
      topicsToAvoid: [
        'Generic leadership narratives',
        'Tragedy essays without growth',
        'Resume recitation',
      ],
      distinctiveQuirks: [
        'Values the "quirky" short answer questions',
        'Looks for genuine personality',
        'Rewards risk-taking in essays',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Built something from scratch',
        'Research experience with genuine engagement',
        'Unusual combination of interests',
        'Evidence of intellectual exploration beyond requirements',
        'Positive, engaged personality in essays',
      ],
      weakFitSignals: [
        'Traditional leadership without innovation',
        'Following expected paths',
        'Single-track focus without breadth',
      ],
      redFlags: [
        'Appears to be going through motions',
        'Generic essays that could be for any school',
        'No evidence of curiosity or creation',
      ],
    },

    stats: {
      acceptanceRate: 0.036,
      edBoost: 1.0,  // REA
      legacyBoost: 2.5,
      athleteSpots: 18,
      yield: 0.82,
    },
  },

  mit: {
    name: 'Massachusetts Institute of Technology',
    type: 'tech',

    distinctiveValues: {
      primary: [
        'Genuine passion for math/science/engineering',
        'Hands-on building and making',
        'Collaborative spirit - "work together"',
        'Playful intellect - "serious about not being serious"',
      ],
      secondary: [
        'Initiative and self-direction',
        'Impact through technology',
        'Resilience through failure',
      ],
      signals: [
        '"Would they stay up all night building something just because?"',
        'Evidence of tinkering, making, creating',
        'Genuine excitement about technical topics',
        'Ability to explain complex things simply',
      ],
    },

    academicPreferences: {
      testOptional: false,  // MIT requires tests
      testImportance: 'high',
      courseRigorWeight: 'high',
      preferredSubjects: ['math', 'physics', 'CS', 'engineering'],
      researchEmphasis: 'high',
    },

    characterWeights: {
      intellectual_vitality: 1.4,
      leadership_quality: 0.8,
      community_impact: 0.9,
      personal_growth: 0.9,
      resilience_grit: 1.1,
      creativity_innovation: 1.3,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'strong',
      preferredDomains: ['cs_tech', 'research', 'robotics', 'math_olympiad', 'science_olympiad', 'engineering'],
      valuesDomains: ['entrepreneurship', 'music', 'athletics'],
      lessValuedDomains: ['traditional_leadership', 'debate'],
    },

    essayPreferences: {
      tonePreference: 'Nerdy, enthusiastic, specific about technical interests',
      topicsToHighlight: [
        'Specific technical projects and what you learned',
        'Problem-solving approaches',
        'Collaboration experiences',
        'Failures and what you learned from them',
      ],
      topicsToAvoid: [
        'Generic achievements without technical depth',
        'Leadership without making/building',
        'Treating MIT as "prestigious" rather than "right fit"',
      ],
      distinctiveQuirks: [
        'Loves detailed descriptions of projects',
        'Values humor and personality',
        'Wants to see failure and iteration',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Strong math/science competition results (USAMO, USACO, Science Olympiad nationals)',
        'Original technical projects',
        'Research with genuine contribution',
        'Evidence of tinkering/making from young age',
        'Can explain technical topics with enthusiasm',
      ],
      weakFitSignals: [
        'Traditional leadership focus',
        'Humanities-heavy profile',
        'Achievement without technical depth',
      ],
      redFlags: [
        'No evidence of technical passion',
        'Math/science as means to an end rather than genuine interest',
        'Competitive without collaborative spirit',
      ],
    },

    stats: {
      acceptanceRate: 0.038,
      edBoost: 1.0,  // EA
      legacyBoost: 2.0,
      athleteSpots: 15,
      yield: 0.76,
    },
  },

  caltech: {
    name: 'California Institute of Technology',
    type: 'tech',

    distinctiveValues: {
      primary: [
        'Pure intellectual passion for science/math',
        'Research orientation and discovery mindset',
        'Collaborative culture - Honor Code community',
        'Comfort with extreme rigor',
      ],
      secondary: [
        'Quirky personality welcome',
        'Depth over breadth',
        'Independent thinking',
      ],
      signals: [
        '"Would they be excited to do research?"',
        'Evidence of deep STEM engagement',
        'Comfort with being intensely focused',
        'No pretense - genuine about interests',
      ],
    },

    academicPreferences: {
      testOptional: false,
      testImportance: 'high',
      courseRigorWeight: 'high',
      preferredSubjects: ['math', 'physics', 'chemistry', 'biology', 'CS'],
      researchEmphasis: 'very_high' as any,
    },

    characterWeights: {
      intellectual_vitality: 1.5,
      leadership_quality: 0.6,
      community_impact: 0.7,
      personal_growth: 0.8,
      resilience_grit: 1.2,
      creativity_innovation: 1.2,
      authenticity_voice: 1.0,
    },

    activityPreferences: {
      spikePreference: 'strong',
      preferredDomains: ['research', 'math_olympiad', 'science_olympiad', 'physics_olympiad'],
      valuesDomains: ['robotics', 'cs_tech'],
      lessValuedDomains: ['leadership', 'debate', 'traditional_service'],
    },

    essayPreferences: {
      tonePreference: 'Deeply nerdy, passionate about research, honest',
      topicsToHighlight: [
        'Research experiences in detail',
        'Specific scientific questions that fascinate you',
        'How you approach difficult problems',
        'Collaboration with scientists/researchers',
      ],
      topicsToAvoid: [
        'Leadership achievements',
        'Breadth of activities',
        'Treating Caltech as "backup MIT"',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Significant research experience',
        'Math/science olympiad success (national level)',
        'Published or presented research',
        'Deep knowledge in specific scientific area',
        'Genuine excitement about learning science',
      ],
      weakFitSignals: [
        'Broad activity profile',
        'Leadership focus',
        'Wanting "balance" in college experience',
      ],
      redFlags: [
        'No research experience',
        'STEM as career path rather than passion',
        'Looking for typical college experience',
      ],
    },

    stats: {
      acceptanceRate: 0.028,
      edBoost: 1.0,  // EA
      legacyBoost: 1.5,
      athleteSpots: 5,
      yield: 0.50,
    },
  },

  princeton: {
    name: 'Princeton University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Academic excellence with undergraduate focus',
        'Service orientation ("In the nation\'s service")',
        'Campus community engagement',
        'Independent work and thesis tradition',
      ],
      secondary: [
        'Athletic tradition (more than other Ivies)',
        'Eating clubs - social community',
        'Tradition and campus culture fit',
      ],
      signals: [
        '"Would they thrive in Princeton\'s close-knit community?"',
        'Evidence of service beyond self-interest',
        'Intellectual independence',
        'Interest in campus life and community',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'high',
    },

    characterWeights: {
      intellectual_vitality: 1.2,
      leadership_quality: 1.0,
      community_impact: 1.2,
      personal_growth: 1.0,
      resilience_grit: 1.0,
      creativity_innovation: 1.0,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['research', 'public_service', 'athletics', 'writing'],
      valuesDomains: ['leadership', 'arts', 'debate'],
      lessValuedDomains: ['pure_entrepreneurship'],
    },

    essayPreferences: {
      tonePreference: 'Thoughtful, service-oriented, community-minded',
      topicsToHighlight: [
        'Service experiences with genuine impact',
        'Community involvement',
        'Intellectual independence',
        'Why Princeton specifically (campus culture)',
      ],
      topicsToAvoid: [
        'Pure self-advancement narratives',
        'Generic prestige-seeking',
        'Urban-focused without appreciation for campus life',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Sustained service commitment',
        'Interest in undergraduate research/thesis',
        'Campus community involvement',
        'Athletic excellence (more valued than other Ivies)',
        'Interest in specific Princeton programs',
      ],
      weakFitSignals: [
        'Urban-focused priorities',
        'Graduate school as primary goal',
        'Purely career-focused',
      ],
      redFlags: [
        'No community engagement',
        'Disinterest in campus life',
        'Service as resume building only',
      ],
    },

    stats: {
      acceptanceRate: 0.041,
      edBoost: 1.0,  // SCEA
      legacyBoost: 3.5,
      athleteSpots: 20,
      yield: 0.68,
    },
  },

  yale: {
    name: 'Yale University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Passion for learning across disciplines',
        'Artistic and creative excellence',
        'Residential college community',
        'Balanced excellence (academic + extracurricular)',
      ],
      secondary: [
        'Drama, music, and arts tradition',
        'Political engagement',
        'Global citizenship',
      ],
      signals: [
        '"Would they enliven a residential college?"',
        'Genuine love of learning beyond major',
        'Creative or artistic engagement',
        'Interest in Yale\'s specific traditions',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.1,
      leadership_quality: 1.0,
      community_impact: 1.0,
      personal_growth: 1.1,
      resilience_grit: 0.9,
      creativity_innovation: 1.2,
      authenticity_voice: 1.2,
    },

    activityPreferences: {
      spikePreference: 'balanced',
      preferredDomains: ['arts', 'drama', 'music', 'writing', 'debate_speech', 'political'],
      valuesDomains: ['research', 'leadership', 'athletics'],
      lessValuedDomains: [],
    },

    essayPreferences: {
      tonePreference: 'Intellectually curious, creative, warm',
      topicsToHighlight: [
        'Intellectual curiosity across fields',
        'Creative pursuits and artistic expression',
        'Community building',
        'Specific Yale programs and traditions',
      ],
      topicsToAvoid: [
        'Pure career focus',
        'Single-track specialization',
        'Generic application',
      ],
      distinctiveQuirks: [
        'Values the "Why Yale" supplements highly',
        'Looks for genuine fit with residential college system',
        'Appreciates artistic/creative excellence',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Artistic or creative excellence',
        'Intellectual breadth with depth',
        'Interest in Yale\'s specific programs',
        'Community engagement',
        'Drama/music/writing achievements',
      ],
      weakFitSignals: [
        'Purely STEM focus without humanities interest',
        'Career-first mentality',
        'Disinterest in arts/culture',
      ],
      redFlags: [
        'Generic essays that could be for any school',
        'No evidence of broader intellectual interests',
        'Disinterest in residential community',
      ],
    },

    stats: {
      acceptanceRate: 0.045,
      edBoost: 1.0,  // SCEA
      legacyBoost: 3.0,
      athleteSpots: 18,
      yield: 0.71,
    },
  },

  columbia: {
    name: 'Columbia University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Core Curriculum commitment',
        'New York City as extended campus',
        'Global/urban perspective',
        'Intellectual rigor in humanities and sciences',
      ],
      secondary: [
        'Diversity and urban energy',
        'Pre-professional opportunities',
        'Research access',
      ],
      signals: [
        '"Would they engage with the Core Curriculum?"',
        'Appreciation for NYC opportunities',
        'Intellectual seriousness',
        'Interest in diverse perspectives',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'high',
    },

    characterWeights: {
      intellectual_vitality: 1.2,
      leadership_quality: 1.0,
      community_impact: 0.9,
      personal_growth: 1.0,
      resilience_grit: 1.0,
      creativity_innovation: 1.1,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['research', 'writing', 'journalism', 'political', 'arts'],
      valuesDomains: ['leadership', 'entrepreneurship', 'debate'],
      lessValuedDomains: ['suburban_activities'],
    },

    essayPreferences: {
      tonePreference: 'Intellectually serious, engaged with ideas',
      topicsToHighlight: [
        'Engagement with Core Curriculum concepts',
        'NYC as learning environment',
        'Research and academic interests',
        'Global/urban perspective',
      ],
      topicsToAvoid: [
        'Focus on campus isolation',
        'Generic "prestige" motivation',
        'No mention of Core',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Genuine interest in Core Curriculum',
        'Appreciation for NYC opportunities',
        'Research experience',
        'Intellectual breadth',
        'Writing/journalism excellence',
      ],
      weakFitSignals: [
        'Preference for traditional campus experience',
        'No interest in humanities/Core',
        'Suburban preferences',
      ],
      redFlags: [
        'No knowledge of Core Curriculum',
        'NYC as distraction rather than asset',
        'Generic application',
      ],
    },

    stats: {
      acceptanceRate: 0.039,
      edBoost: 2.5,
      legacyBoost: 2.5,
      athleteSpots: 15,
      yield: 0.63,
    },
  },

  duke: {
    name: 'Duke University',
    type: 'elite_private',

    distinctiveValues: {
      primary: [
        'Basketball and athletic culture',
        'Southern hospitality and community',
        'Undergraduate research opportunities',
        'Balance of academics and social life',
      ],
      secondary: [
        'Service learning and DukeEngage',
        'Pre-professional preparation',
        'Campus community spirit',
      ],
      signals: [
        '"Would they engage with Duke\'s community spirit?"',
        'Interest in research opportunities',
        'Appreciation for athletic culture',
        'Service orientation',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'high',
    },

    characterWeights: {
      intellectual_vitality: 1.0,
      leadership_quality: 1.1,
      community_impact: 1.1,
      personal_growth: 1.0,
      resilience_grit: 1.0,
      creativity_innovation: 1.0,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'balanced',
      preferredDomains: ['athletics', 'research', 'service', 'leadership'],
      valuesDomains: ['entrepreneurship', 'arts', 'pre_med'],
      lessValuedDomains: [],
    },

    essayPreferences: {
      tonePreference: 'Warm, community-oriented, intellectually curious',
      topicsToHighlight: [
        'Service and community impact',
        'Research interests',
        'Why Duke specifically',
        'Athletic engagement (even as fan)',
      ],
      topicsToAvoid: [
        'Purely academic focus',
        'No social engagement',
        'Generic application',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Service commitment',
        'Interest in undergraduate research',
        'Athletic participation or enthusiasm',
        'Community engagement',
        'Interest in specific Duke programs',
      ],
      weakFitSignals: [
        'Pure academic focus',
        'Urban preferences',
        'Disinterest in sports/community',
      ],
      redFlags: [
        'No community engagement',
        'Generic application without Duke-specific elements',
        'Dismissive of athletic culture',
      ],
    },

    stats: {
      acceptanceRate: 0.060,
      edBoost: 2.8,
      legacyBoost: 3.0,
      athleteSpots: 17,
      yield: 0.55,
    },
  },

  penn: {
    name: 'University of Pennsylvania',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Practical idealism - theory applied to practice',
        'Interdisciplinary opportunities (4 schools)',
        'Pre-professional excellence (especially Wharton)',
        'Philadelphia engagement',
      ],
      secondary: [
        'Research opportunities',
        'Social life and community',
        'Career preparation',
      ],
      signals: [
        '"Do they want to apply what they learn?"',
        'Interest in specific school/program',
        'Practical orientation with intellectual depth',
        'Interdisciplinary interests',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.0,
      leadership_quality: 1.1,
      community_impact: 1.0,
      personal_growth: 1.0,
      resilience_grit: 1.0,
      creativity_innovation: 1.1,
      authenticity_voice: 1.0,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['entrepreneurship', 'leadership', 'business', 'research', 'pre_med'],
      valuesDomains: ['athletics', 'service', 'arts'],
      lessValuedDomains: [],
    },

    essayPreferences: {
      tonePreference: 'Practical, ambitious, specific about Penn programs',
      topicsToHighlight: [
        'Specific Penn school/program interest',
        'How you\'ll use resources',
        'Interdisciplinary interests',
        'Real-world application of learning',
      ],
      topicsToAvoid: [
        'Pure theory without application',
        'Generic Ivy ambitions',
        'No specific Penn knowledge',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Clear school-specific interest (Wharton, Engineering, Nursing, Arts & Sciences)',
        'Entrepreneurial experience',
        'Interdisciplinary projects',
        'Leadership with practical impact',
        'Specific knowledge of Penn programs',
      ],
      weakFitSignals: [
        'Pure academic focus',
        'No career clarity',
        'General "Ivy" ambition',
      ],
      redFlags: [
        'No knowledge of specific Penn schools',
        'Generic application',
        'Misunderstanding of Wharton (business vs. finance)',
      ],
    },

    stats: {
      acceptanceRate: 0.059,
      edBoost: 2.3,
      legacyBoost: 2.5,
      athleteSpots: 16,
      yield: 0.66,
    },
  },

  northwestern: {
    name: 'Northwestern University',
    type: 'elite_private',

    distinctiveValues: {
      primary: [
        'Quarter system and academic intensity',
        'Combined arts/sciences/professional',
        'Chicago opportunities',
        'Journalism and media excellence',
      ],
      secondary: [
        'Athletics (Big Ten)',
        'Campus community on Lake Michigan',
        'Pre-professional preparation',
      ],
      signals: [
        '"Would they thrive in fast-paced quarter system?"',
        'Interest in specific Northwestern programs',
        'Media/journalism/communication interest',
        'Chicago appreciation',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.0,
      leadership_quality: 1.0,
      community_impact: 1.0,
      personal_growth: 1.0,
      resilience_grit: 1.1,
      creativity_innovation: 1.1,
      authenticity_voice: 1.0,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['journalism', 'media', 'drama', 'music', 'research'],
      valuesDomains: ['athletics', 'leadership', 'entrepreneurship'],
      lessValuedDomains: [],
    },

    essayPreferences: {
      tonePreference: 'Engaged, specific about Northwestern, intellectually curious',
      topicsToHighlight: [
        'Specific Northwestern programs',
        'Media/journalism/communication interests',
        'How you\'d use Chicago',
        'Quarter system fit',
      ],
      topicsToAvoid: [
        'Generic Midwest stereotype dismissal',
        'No Northwestern-specific content',
        'Pure career focus',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Interest in Medill/journalism',
        'Drama/music excellence',
        'Specific program knowledge',
        'Chicago appreciation',
        'Fast-paced academic fit',
      ],
      weakFitSignals: [
        'No Northwestern-specific interests',
        'Preference for semester pace',
        'No media/arts interest',
      ],
      redFlags: [
        'Generic application',
        'No knowledge of Northwestern programs',
        'Treating as backup to Ivies',
      ],
    },

    stats: {
      acceptanceRate: 0.070,
      edBoost: 2.5,
      legacyBoost: 2.0,
      athleteSpots: 14,
      yield: 0.52,
    },
  },

  brown: {
    name: 'Brown University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Open Curriculum - intellectual freedom',
        'No required courses, self-directed learning',
        'Collaborative (not competitive) culture',
        'Social consciousness and activism',
      ],
      secondary: [
        'Interdisciplinary thinking',
        'Providence community',
        'Arts and creative excellence',
      ],
      signals: [
        '"Would they thrive without requirements?"',
        'Self-directed learning evidence',
        'Collaborative spirit',
        'Social consciousness',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'low',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.2,
      leadership_quality: 0.9,
      community_impact: 1.1,
      personal_growth: 1.1,
      resilience_grit: 0.9,
      creativity_innovation: 1.2,
      authenticity_voice: 1.3,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['arts', 'social_justice', 'research', 'creative_writing'],
      valuesDomains: ['leadership', 'service'],
      lessValuedDomains: ['traditional_competitive', 'pure_business'],
    },

    essayPreferences: {
      tonePreference: 'Authentic, curious, passionate, collaborative',
      topicsToHighlight: [
        'Self-directed learning',
        'Open Curriculum fit',
        'Social consciousness',
        'Interdisciplinary interests',
      ],
      topicsToAvoid: [
        'Competitive achievements only',
        'Career focus without passion',
        'No mention of Open Curriculum',
      ],
      distinctiveQuirks: [
        'VERY strong on authenticity',
        'Rewards unconventional paths',
        'Values social consciousness',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Self-directed learning examples',
        'Genuine interest in Open Curriculum',
        'Social consciousness/activism',
        'Collaborative projects',
        'Artistic/creative excellence',
      ],
      weakFitSignals: [
        'Need for structure',
        'Pure achievement focus',
        'Competitive rather than collaborative',
      ],
      redFlags: [
        'No understanding of Open Curriculum',
        'Generic application',
        'Competitive/cutthroat mentality',
      ],
    },

    stats: {
      acceptanceRate: 0.051,
      edBoost: 2.8,
      legacyBoost: 2.5,
      athleteSpots: 14,
      yield: 0.68,
    },
  },

  dartmouth: {
    name: 'Dartmouth College',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'D-Plan and flexibility',
        'Outdoors and rural setting',
        'Undergraduate focus',
        'Strong community and tradition',
      ],
      secondary: [
        'Greek life culture',
        'Close faculty relationships',
        'Athletic participation',
      ],
      signals: [
        '"Would they embrace Hanover?"',
        'Comfort with rural setting',
        'Interest in D-Plan',
        'Community engagement',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'medium',
    },

    characterWeights: {
      intellectual_vitality: 1.0,
      leadership_quality: 1.1,
      community_impact: 1.1,
      personal_growth: 1.1,
      resilience_grit: 1.1,
      creativity_innovation: 0.9,
      authenticity_voice: 1.1,
    },

    activityPreferences: {
      spikePreference: 'balanced',
      preferredDomains: ['athletics', 'outdoors', 'leadership', 'service'],
      valuesDomains: ['research', 'arts'],
      lessValuedDomains: ['urban_activities'],
    },

    essayPreferences: {
      tonePreference: 'Warm, community-oriented, engaged',
      topicsToHighlight: [
        'D-Plan interest',
        'Outdoor/nature appreciation',
        'Community involvement',
        'Why Dartmouth specifically',
      ],
      topicsToAvoid: [
        'Urban preferences',
        'Social isolation',
        'Generic Ivy ambition',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Outdoor/nature experience',
        'Community leadership',
        'Interest in D-Plan',
        'Athletic participation',
        'Comfort with close-knit community',
      ],
      weakFitSignals: [
        'Urban preferences',
        'Avoidance of community',
        'No outdoor interest',
      ],
      redFlags: [
        'Dismissive of rural setting',
        'No community engagement',
        'Generic application',
      ],
    },

    stats: {
      acceptanceRate: 0.061,
      edBoost: 2.5,
      legacyBoost: 3.0,
      athleteSpots: 22,
      yield: 0.63,
    },
  },

  cornell: {
    name: 'Cornell University',
    type: 'ivy',

    distinctiveValues: {
      primary: [
        'Seven distinct colleges with unique admissions',
        '"Any person, any study" founding principle',
        'Practical application with Ivy rigor',
        'Natural beauty and campus',
      ],
      secondary: [
        'Research opportunities',
        'Pre-professional programs (Hotel, ILR, etc.)',
        'Land-grant mission',
      ],
      signals: [
        '"Do they understand Cornell\'s unique structure?"',
        'Specific college interest',
        'Appreciation for practical + academic',
        'Campus fit (Ithaca)',
      ],
    },

    academicPreferences: {
      testOptional: true,
      testImportance: 'medium',
      courseRigorWeight: 'high',
      researchEmphasis: 'high',
    },

    characterWeights: {
      intellectual_vitality: 1.0,
      leadership_quality: 1.0,
      community_impact: 1.0,
      personal_growth: 1.0,
      resilience_grit: 1.1,
      creativity_innovation: 1.0,
      authenticity_voice: 1.0,
    },

    activityPreferences: {
      spikePreference: 'moderate',
      preferredDomains: ['research', 'pre_professional', 'athletics', 'leadership'],
      valuesDomains: ['service', 'arts', 'entrepreneurship'],
      lessValuedDomains: [],
    },

    essayPreferences: {
      tonePreference: 'Specific about college choice, practical and intellectual',
      topicsToHighlight: [
        'Why specific Cornell college',
        'How you\'ll use Cornell\'s unique resources',
        'Appreciation for Cornell\'s mission',
        'Specific programs or faculty',
      ],
      topicsToAvoid: [
        'Generic Ivy desire',
        'Confusion about colleges',
        'No Cornell-specific content',
      ],
    },

    fitIndicators: {
      strongFitSignals: [
        'Clear specific college choice',
        'Understanding of that college\'s focus',
        'Relevant preparation for chosen field',
        'Appreciation for Ithaca setting',
        'Research or practical experience',
      ],
      weakFitSignals: [
        'No specific college rationale',
        'Urban preference',
        'Generic Ivy motivation',
      ],
      redFlags: [
        'Applying to wrong college for interests',
        'No understanding of college structure',
        'Generic application',
      ],
    },

    stats: {
      acceptanceRate: 0.089,
      edBoost: 2.2,
      legacyBoost: 2.0,
      athleteSpots: 15,
      yield: 0.62,
    },
  },
};

// ============================================================================
// SCHOOL VALUE WEIGHTS FOR DIFFERENT SCHOOL TYPES
// ============================================================================

export const SCHOOL_VALUE_WEIGHTS = {
  ivy: {
    academic_excellence: 0.25,
    character_dimensions: 0.25,
    extracurricular_achievement: 0.20,
    school_specific_fit: 0.15,
    recommendations: 0.10,
    essays: 0.05,
  },
  tech: {
    academic_excellence: 0.35,
    character_dimensions: 0.15,
    extracurricular_achievement: 0.25,
    school_specific_fit: 0.15,
    recommendations: 0.05,
    essays: 0.05,
  },
  elite_private: {
    academic_excellence: 0.25,
    character_dimensions: 0.25,
    extracurricular_achievement: 0.20,
    school_specific_fit: 0.15,
    recommendations: 0.10,
    essays: 0.05,
  },
  lac: {
    academic_excellence: 0.20,
    character_dimensions: 0.30,
    extracurricular_achievement: 0.15,
    school_specific_fit: 0.20,
    recommendations: 0.10,
    essays: 0.05,
  },
  elite_public: {
    academic_excellence: 0.40,
    character_dimensions: 0.15,
    extracurricular_achievement: 0.20,
    school_specific_fit: 0.10,
    recommendations: 0.10,
    essays: 0.05,
  },
};

// ============================================================================
// ADMISSION STATISTICS DATABASE
// ============================================================================

export const ADMISSION_STATISTICS = {
  // Overall acceptance rates by tier
  acceptance_rates: {
    ivy_plus: { range: [0.03, 0.07], typical: 0.05 },
    elite_private: { range: [0.06, 0.12], typical: 0.09 },
    elite_public: { range: [0.10, 0.25], typical: 0.15 },
    selective: { range: [0.20, 0.40], typical: 0.30 },
    competitive: { range: [0.40, 0.60], typical: 0.50 },
  },

  // ED/EA impact
  ed_impact: {
    high_ed_boost: ['Duke', 'Northwestern', 'Cornell', 'Brown', 'Penn', 'Columbia'],
    moderate_ed_boost: ['Dartmouth', 'Johns Hopkins', 'Vanderbilt'],
    no_ed: ['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT', 'Georgetown'],
  },

  // Legacy impact by school
  legacy_impact: {
    strong_legacy: ['Harvard', 'Princeton', 'Yale', 'Duke', 'Dartmouth', 'Notre Dame'],
    moderate_legacy: ['Stanford', 'Penn', 'Cornell', 'Brown', 'Columbia'],
    minimal_legacy: ['MIT', 'Caltech', 'UC schools'],
  },

  // International student rates
  international_rates: {
    high_international: ['MIT', 'Harvard', 'Stanford', 'Yale', 'Columbia'],
    typical_rate: 0.12,
    international_handicap: 1.5,  // Typically 1.5x harder for internationals
  },
};

// ============================================================================
// DEMONSTRATED INTEREST IMPACT
// ============================================================================

export const DEMONSTRATED_INTEREST_IMPACT = {
  tracks_interest: {
    high_impact: ['Duke', 'Northwestern', 'Vanderbilt', 'Tufts', 'NYU', 'Boston College', 'WashU'],
    moderate_impact: ['Cornell', 'Dartmouth', 'Georgetown'],
    no_impact: ['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT', 'Columbia', 'Penn', 'Brown', 'Caltech'],
  },

  ways_to_demonstrate: {
    high_value: [
      'Campus visit with info session',
      'Interview (if offered)',
      'Substantial "Why X" essay',
      'Direct communication with admissions',
    ],
    medium_value: [
      'Virtual info session attendance',
      'Email list signup with engagement',
      'Alumni interview preparation',
    ],
    low_value: [
      'Portal creation only',
      'Generic visit without session',
    ],
  },

  impact_quantification: {
    high_interest_school_visit: 1.3,   // 30% boost at schools that track
    interview_completed: 1.15,         // 15% boost
    strong_why_essay: 1.2,             // 20% boost
    no_demonstrated_interest: 0.8,     // 20% penalty at schools that track
  },
};

// ============================================================================
// LEGACY AND DEVELOPMENT IMPACT
// ============================================================================

export const LEGACY_DEVELOPMENT_IMPACT = {
  legacy_tiers: {
    primary_legacy: {
      definition: 'Parent attended same institution',
      impact: {
        ivy: { multiplier: 3.0, acceptance_rate_estimate: 0.30 },
        elite_private: { multiplier: 2.5, acceptance_rate_estimate: 0.25 },
        other: { multiplier: 2.0, acceptance_rate_estimate: 0.20 },
      },
    },
    secondary_legacy: {
      definition: 'Sibling, grandparent, aunt/uncle',
      impact: {
        ivy: { multiplier: 1.5, acceptance_rate_estimate: 0.12 },
        elite_private: { multiplier: 1.3, acceptance_rate_estimate: 0.10 },
      },
    },
  },

  development_cases: {
    major_donor: {
      threshold: 1000000,  // $1M+
      impact: 'Near guarantee if academically qualified',
    },
    significant_donor: {
      threshold: 100000,   // $100K-$1M
      impact: 'Strong boost, similar to legacy',
    },
    regular_donor: {
      threshold: 10000,    // $10K-$100K
      impact: 'Minor consideration',
    },
  },

  notes: [
    'Legacy impact decreasing at some schools',
    'Development cases tracked but rarely discussed',
    'Some schools phasing out legacy (MIT, Johns Hopkins)',
  ],
};

// ============================================================================
// ED/EA STRATEGY GUIDANCE
// ============================================================================

export const ED_EA_STRATEGIES = {
  ed_candidates: {
    criteria: [
      'Clear first choice school',
      'Family can afford any financial aid package',
      'Profile is competitive for the school',
      'School offers significant ED boost',
    ],
    best_schools_for_ed: [
      { school: 'Duke', ed_rate: 0.17, rd_rate: 0.04, boost: 4.3 },
      { school: 'Northwestern', ed_rate: 0.20, rd_rate: 0.05, boost: 4.0 },
      { school: 'Penn', ed_rate: 0.14, rd_rate: 0.05, boost: 2.8 },
      { school: 'Brown', ed_rate: 0.14, rd_rate: 0.04, boost: 3.5 },
      { school: 'Columbia', ed_rate: 0.11, rd_rate: 0.03, boost: 3.7 },
      { school: 'Cornell', ed_rate: 0.18, rd_rate: 0.07, boost: 2.6 },
      { school: 'Dartmouth', ed_rate: 0.18, rd_rate: 0.05, boost: 3.6 },
    ],
  },

  scea_candidates: {
    criteria: [
      'Borderline competitive for HYPS',
      'Want to maximize chances at top choice',
      'Okay with not applying EA elsewhere',
    ],
    considerations: [
      'Harvard, Yale, Princeton, Stanford offer SCEA',
      'Restricts other private school EA',
      'Can still apply to public school EAs',
    ],
  },

  ea_candidates: {
    criteria: [
      'Want decisions early',
      'Not committed to binding decision',
      'Applying to multiple schools',
    ],
    strategy: [
      'Apply EA to schools that don\'t track interest',
      'Save ED for school with biggest boost if admitted',
      'Use EA results to inform RD strategy',
    ],
  },

  rd_candidates: {
    criteria: [
      'Need to compare financial aid offers',
      'Profile improving (senior grades, awards pending)',
      'Undecided on first choice',
      'International needing full aid',
    ],
  },
};

// ============================================================================
// SCHOOL FIT ASSESSMENT CRITERIA
// ============================================================================

export const SCHOOL_FIT_ASSESSMENT_CRITERIA = {
  academic_fit: {
    weight: 0.25,
    criteria: [
      'GPA/test scores within school range',
      'Course rigor matches school expectations',
      'Academic interests align with school strengths',
      'Research interests can be pursued',
    ],
  },

  social_fit: {
    weight: 0.20,
    criteria: [
      'Campus culture matches personality',
      'Geographic setting preference alignment',
      'Social scene compatibility',
      'Diversity and community factors',
    ],
  },

  program_fit: {
    weight: 0.25,
    criteria: [
      'Specific major/program availability',
      'Program ranking and quality',
      'Unique opportunities at this school',
      'Career outcomes for intended field',
    ],
  },

  values_fit: {
    weight: 0.20,
    criteria: [
      'School mission alignment',
      'Emphasis on what student values',
      'Community/service orientation match',
      'Intellectual culture alignment',
    ],
  },

  practical_fit: {
    weight: 0.10,
    criteria: [
      'Affordability/financial aid',
      'Distance from home',
      'Size preferences',
      'Internship/job opportunities',
    ],
  },
};

// ============================================================================
// SCHOOL FIT SCORING FUNCTIONS
// ============================================================================

export interface SchoolFitInput {
  schoolName: string;
  studentProfile: {
    academicStrengths: string[];
    activityDomains: string[];
    characterStrengths: string[];
    interests: string[];
    preferences: {
      urbanVsRural: 'urban' | 'suburban' | 'rural' | 'no_preference';
      sizePreference: 'small' | 'medium' | 'large' | 'no_preference';
      climatePreference?: string;
      geographicPreference?: string;
    };
    gpa: number;
    testScores?: { sat?: number; act?: number };
  };
}

export interface SchoolFitResult {
  overallFitScore: number;  // 0-100
  fitCategory: 'excellent' | 'good' | 'moderate' | 'poor';
  strengthAreas: string[];
  gapAreas: string[];
  admissionProbability: number;  // 0-1
  strategicRecommendation: string;
  listCategory: 'reach' | 'target' | 'likely' | 'safety';
  specificInsights: string[];
}

export function calculateSchoolFitScore(input: SchoolFitInput): SchoolFitResult {
  const school = ELITE_SCHOOL_VALUE_MATRICES[input.schoolName.toLowerCase().replace(/ /g, '_')];

  if (!school) {
    return {
      overallFitScore: 50,
      fitCategory: 'moderate',
      strengthAreas: [],
      gapAreas: ['School not in database'],
      admissionProbability: 0.1,
      strategicRecommendation: 'Research this school further',
      listCategory: 'reach',
      specificInsights: [],
    };
  }

  // Calculate various fit dimensions
  const strengthAreas: string[] = [];
  const gapAreas: string[] = [];
  let fitScore = 50;  // Start at baseline

  // Check activity domain alignment
  const studentDomains = new Set(input.studentProfile.activityDomains);
  const preferredDomains = new Set(school.activityPreferences.preferredDomains);
  const domainOverlap = Array.from(studentDomains).filter(d => preferredDomains.has(d));

  if (domainOverlap.length >= 2) {
    fitScore += 15;
    strengthAreas.push(`Strong alignment in: ${domainOverlap.join(', ')}`);
  } else if (domainOverlap.length === 0) {
    fitScore -= 10;
    gapAreas.push(`No overlap with preferred domains: ${school.activityPreferences.preferredDomains.slice(0, 3).join(', ')}`);
  }

  // Check character strength alignment
  const characterMatch = input.studentProfile.characterStrengths.filter(c =>
    school.characterWeights[c as keyof typeof school.characterWeights] >= 1.1
  );
  if (characterMatch.length >= 2) {
    fitScore += 10;
    strengthAreas.push(`Character strengths valued: ${characterMatch.join(', ')}`);
  }

  // Check preferences alignment
  if (school.type === 'ivy' || school.type === 'elite_private') {
    if (input.studentProfile.preferences.urbanVsRural === 'rural' &&
        ['dartmouth', 'cornell'].includes(input.schoolName.toLowerCase())) {
      fitScore += 5;
      strengthAreas.push('Setting preference matches');
    }
  }

  // Determine fit category
  let fitCategory: SchoolFitResult['fitCategory'];
  if (fitScore >= 75) fitCategory = 'excellent';
  else if (fitScore >= 60) fitCategory = 'good';
  else if (fitScore >= 45) fitCategory = 'moderate';
  else fitCategory = 'poor';

  // Calculate admission probability (simplified)
  let admissionProbability = school.stats.acceptanceRate;
  if (fitScore >= 75) admissionProbability *= 1.5;
  else if (fitScore < 45) admissionProbability *= 0.5;

  // Determine list category based on probability
  let listCategory: SchoolFitResult['listCategory'];
  if (admissionProbability < 0.15) listCategory = 'reach';
  else if (admissionProbability < 0.35) listCategory = 'target';
  else if (admissionProbability < 0.60) listCategory = 'likely';
  else listCategory = 'safety';

  return {
    overallFitScore: Math.min(100, Math.max(0, fitScore)),
    fitCategory,
    strengthAreas,
    gapAreas,
    admissionProbability: Math.min(1, admissionProbability),
    strategicRecommendation: fitCategory === 'excellent' ?
      `Strong candidate - consider ED if first choice` :
      fitCategory === 'good' ?
        `Good fit - strengthen ${gapAreas[0] || 'essays'}` :
        `Work on alignment with ${school.distinctiveValues.primary[0]}`,
    listCategory,
    specificInsights: school.fitIndicators.strongFitSignals.slice(0, 3),
  };
}

export function getSchoolSpecificStrategy(schoolName: string): {
  essayStrategy: string[];
  interviewStrategy: string[];
  applicationTiming: string;
  demonstratedInterest: string;
} {
  const school = ELITE_SCHOOL_VALUE_MATRICES[schoolName.toLowerCase().replace(/ /g, '_')];

  if (!school) {
    return {
      essayStrategy: ['Research specific programs', 'Show genuine fit'],
      interviewStrategy: ['Prepare standard responses'],
      applicationTiming: 'Research deadlines',
      demonstratedInterest: 'Visit campus if possible',
    };
  }

  const tracksInterest = DEMONSTRATED_INTEREST_IMPACT.tracks_interest.high_impact
    .map(s => s.toLowerCase()).includes(schoolName.toLowerCase()) ||
    DEMONSTRATED_INTEREST_IMPACT.tracks_interest.moderate_impact
      .map(s => s.toLowerCase()).includes(schoolName.toLowerCase());

  return {
    essayStrategy: [
      `Tone: ${school.essayPreferences.tonePreference}`,
      `Highlight: ${school.essayPreferences.topicsToHighlight.slice(0, 2).join('; ')}`,
      `Avoid: ${school.essayPreferences.topicsToAvoid[0]}`,
    ],
    interviewStrategy: [
      `Emphasize: ${school.distinctiveValues.primary[0]}`,
      `Demonstrate: ${school.fitIndicators.strongFitSignals[0]}`,
    ],
    applicationTiming: ED_EA_STRATEGIES.ed_candidates.best_schools_for_ed
      .find(s => s.school.toLowerCase() === schoolName.toLowerCase()) ?
      'Strong ED candidate - significant boost' : 'Consider EA or RD based on profile',
    demonstratedInterest: tracksInterest ?
      'IMPORTANT: This school tracks interest - visit, attend sessions, engage' :
      'Interest not formally tracked - focus on essays',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const schoolValueDatabase = {
  ELITE_SCHOOL_VALUE_MATRICES,
  SCHOOL_VALUE_WEIGHTS,
  ADMISSION_STATISTICS,
  DEMONSTRATED_INTEREST_IMPACT,
  LEGACY_DEVELOPMENT_IMPACT,
  ED_EA_STRATEGIES,
  SCHOOL_FIT_ASSESSMENT_CRITERIA,
  calculateSchoolFitScore,
  getSchoolSpecificStrategy,
};
