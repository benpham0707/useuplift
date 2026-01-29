/**
 * Activity Optimization Types
 *
 * Comprehensive type definitions for optimizing activity descriptions,
 * developing spikes, and strategically positioning extracurricular involvement.
 *
 * The Common App activities section is 10 activities × 150 characters each.
 * Every character must count. This system provides guidance for:
 * - Optimizing 150-character descriptions for maximum impact
 * - Developing activities from Tier 4 to Tier 1
 * - Building coherent spikes that tell a compelling story
 * - Strategic positioning for different school types
 *
 * Key Insight: The difference between a Tier 4 and Tier 1 activity
 * isn't what you do, it's the depth of impact and recognition achieved.
 */

import { HarvardScore, HarvardScoreDecimal, ActivityTierScore } from './scoring';
import { GradeLevel, YearPhase } from './timeline';
import { ActivityTier, ActivityCategory, LeadershipType, RecognitionLevel } from './activities';

/**
 * Common App Activity Categories
 * These match the exact dropdown options in the Common App activities section.
 * Different from our internal ActivityCategory which groups activities by type.
 */
export type CommonAppActivityCategory =
  | 'academic'               // Academic
  | 'art'                    // Art
  | 'athletics'              // Athletics: Club
  | 'career_oriented'        // Career Oriented
  | 'community_service'      // Community Service (Volunteer)
  | 'computer_technology'    // Computer/Technology
  | 'cultural'               // Cultural
  | 'dance'                  // Dance
  | 'debate_speech'          // Debate/Speech
  | 'environmental'          // Environmental
  | 'family_responsibilities' // Family Responsibilities
  | 'foreign_exchange'       // Foreign Exchange
  | 'foreign_language'       // Foreign Language
  | 'journalism_publication' // Journalism/Publication
  | 'lgbtq'                  // LGBTQ
  | 'music_instrumental'     // Music: Instrumental
  | 'music_vocal'            // Music: Vocal
  | 'other_club'             // Other Club/Activity
  | 'religious'              // Religious
  | 'research'               // Research
  | 'robotics'               // Robotics
  | 'school_spirit'          // School Spirit
  | 'science_math'           // Science/Math
  | 'social_justice'         // Social Justice
  | 'student_government'     // Student Govt./Politics
  | 'theater'                // Theater/Drama
  | 'work_paid';             // Work (Paid)

// ============================================================================
// ACTIVITY DESCRIPTION OPTIMIZATION
// ============================================================================

/**
 * Activity description analysis
 */
export interface ActivityDescriptionAnalysis {
  activityId: string;
  currentDescription: string;
  characterCount: number;
  maxCharacters: number;

  // Quality assessment
  qualityScore: HarvardScoreDecimal;

  // Content analysis
  contentAnalysis: {
    // What's included
    hasAction: boolean;           // Active verbs showing what you did
    hasScope: boolean;            // Scale/numbers of impact
    hasResults: boolean;          // Outcomes achieved
    hasLeadership: boolean;       // Leadership role clear
    hasUniqueness: boolean;       // What makes this special
    hasTimeframe: boolean;        // Duration/commitment clear

    // Quality of each element
    actionStrength: HarvardScoreDecimal;
    scopeStrength: HarvardScoreDecimal;
    resultsStrength: HarvardScoreDecimal;
    leadershipStrength: HarvardScoreDecimal;
    uniquenessStrength: HarvardScoreDecimal;
  };

  // Problems detected
  problemsDetected: {
    problem: DescriptionProblem;
    detected: boolean;
    evidence?: string;
    howToFix: string;
  }[];

  // Optimization suggestions
  optimizations: DescriptionOptimization[];

  // Rewritten options
  rewrittenOptions: {
    version: string;
    description: string;
    characterCount: number;
    improvements: string[];
    style: 'impact_focused' | 'leadership_focused' | 'scope_focused' | 'uniqueness_focused';
  }[];
}

/**
 * Common problems in activity descriptions
 */
export type DescriptionProblem =
  | 'too_vague'               // "Helped with events"
  | 'no_impact'               // No results shown
  | 'passive_voice'           // "Was responsible for"
  | 'redundant_title'         // Repeats position title
  | 'wasted_characters'       // "I was a..." or filler words
  | 'no_numbers'              // Missing quantification
  | 'cliche_language'         // "Made a difference"
  | 'unclear_role'            // What did YOU do?
  | 'missing_context'         // Organization unclear
  | 'underselling'            // Better than it sounds
  | 'overselling'             // Claims seem exaggerated
  | 'generic'                 // Could be anyone
  | 'too_technical'           // Jargon without impact
  | 'wrong_emphasis';         // Leading with wrong element

/**
 * Specific optimization for description
 */
export interface DescriptionOptimization {
  category: 'add' | 'remove' | 'replace' | 'reorder';
  currentText?: string;
  suggestedText?: string;
  rationale: string;
  characterImpact: number; // Positive = adds, negative = saves
  priority: number;
}

/**
 * 150-character description formula
 */
export interface DescriptionFormula {
  structure: 'action_impact' | 'role_scope_result' | 'leadership_achievement' | 'unique_contribution';

  components: {
    component: 'action_verb' | 'scope' | 'result' | 'leadership' | 'uniqueness' | 'context';
    characterBudget: number;
    required: boolean;
    bestPractice: string;
    examples: string[];
  }[];

  // Example full descriptions
  exemplars: {
    tier: ActivityTierScore;
    category: CommonAppActivityCategory;
    description: string;
    whyItWorks: string;
  }[];
}

/**
 * Description formulas by activity type
 */
export const DESCRIPTION_FORMULAS: Record<CommonAppActivityCategory, DescriptionFormula> = {
  // Academic
  academic: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Strong action verb', examples: ['Researched', 'Analyzed', 'Published'] },
      { component: 'scope', characterBudget: 30, required: true, bestPractice: 'What you worked on', examples: ['quantum computing algorithms', 'economic policy'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Outcome with numbers', examples: ['published in Nature', 'presented at MIT'] },
      { component: 'uniqueness', characterBudget: 50, required: false, bestPractice: 'What makes it special', examples: ['youngest researcher', 'novel approach'] },
    ],
    exemplars: [
      { tier: 1, category: 'academic', description: 'Led 8-month research on ML protein folding; co-authored paper in Cell (IF 66.8); presented findings at NIH symposium to 200 researchers', whyItWorks: 'Specific, high-impact publication, quantified audience' },
      { tier: 2, category: 'academic', description: 'Developed novel algorithm for satellite image analysis; won state Science Fair; work adopted by local conservation org for tracking deforestation', whyItWorks: 'Technical + impact + real-world application' },
    ],
  },

  art: {
    structure: 'unique_contribution',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Creative action', examples: ['Created', 'Composed', 'Choreographed'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'What you made', examples: ['15-piece portfolio', 'original symphony'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Recognition/venue', examples: ['exhibited at MoMA', 'performed at Carnegie Hall'] },
      { component: 'uniqueness', characterBudget: 45, required: false, bestPractice: 'Artistic vision', examples: ['exploring immigration through surrealism'] },
    ],
    exemplars: [
      { tier: 1, category: 'art', description: 'Composed & conducted original orchestral piece for 60-member symphony; premiered at Lincoln Center; selected for YoungArts National finalist', whyItWorks: 'Scale + prestige venue + national recognition' },
    ],
  },

  athletics: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Role on team', examples: ['Captain', 'Starting midfielder'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Stats, records, wins', examples: ['State champions', 'All-Conference', '15 goals'] },
      { component: 'scope', characterBudget: 35, required: true, bestPractice: 'Level of competition', examples: ['D1 recruited', 'ranked #3 in state'] },
      { component: 'action_verb', characterBudget: 30, required: false, bestPractice: 'What you contributed', examples: ['Led team to', 'Broke school record'] },
    ],
    exemplars: [
      { tier: 1, category: 'athletics', description: 'Varsity Captain; All-American honoree; led team to state championship (first in 25 years); recruited by 12 D1 programs including Stanford', whyItWorks: 'Leadership + national recognition + historic achievement + recruitment interest' },
    ],
  },

  career_oriented: {
    structure: 'role_scope_result',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Professional action', examples: ['Managed', 'Developed', 'Launched'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Scale of work', examples: ['$50K budget', 'team of 5', '200 clients'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Business outcome', examples: ['increased revenue 40%', 'secured 3 clients'] },
      { component: 'context', characterBudget: 40, required: false, bestPractice: 'Where/for whom', examples: ['at Goldman Sachs', 'for Fortune 500'] },
    ],
    exemplars: [
      { tier: 1, category: 'career_oriented', description: 'Founded ed-tech startup; developed app used by 50K students in 12 countries; raised $200K seed funding; featured in TechCrunch', whyItWorks: 'Scale + global impact + funding = real business' },
    ],
  },

  community_service: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Service action', examples: ['Founded', 'Organized', 'Led'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scale of service', examples: ['600 volunteers', '$25K raised', '2000 meals'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Community impact', examples: ['reduced food insecurity 30%', 'housed 50 families'] },
      { component: 'uniqueness', characterBudget: 35, required: false, bestPractice: 'Innovation', examples: ['first program of its kind', 'expanded to 5 states'] },
    ],
    exemplars: [
      { tier: 1, category: 'community_service', description: 'Founded refugee tutoring nonprofit; trained 80 volunteers; served 300 students across 15 schools; improved math scores avg 1.5 grade levels', whyItWorks: 'Founded (not joined) + scaled + measurable impact' },
    ],
  },

  computer_technology: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Technical action', examples: ['Built', 'Developed', 'Engineered'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'What you built', examples: ['ML model for cancer detection', 'app with 10K users'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Technical/business outcome', examples: ['98% accuracy', 'acquired by company'] },
      { component: 'uniqueness', characterBudget: 35, required: false, bestPractice: 'Innovation', examples: ['novel algorithm', 'open-sourced'] },
    ],
    exemplars: [
      { tier: 1, category: 'computer_technology', description: 'Developed open-source library for NLP; 5K GitHub stars; adopted by Google Research; contributed to TensorFlow; ISEF Grand Award winner', whyItWorks: 'Real users + major company adoption + competition win' },
    ],
  },

  cultural: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Your role', examples: ['President', 'Founder', 'Lead organizer'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Cultural action', examples: ['Organized', 'Produced', 'Celebrated'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Scale and reach', examples: ['500 attendees', '12 cultural groups', 'city-wide'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Impact', examples: ['raised cultural awareness', 'established annual tradition'] },
    ],
    exemplars: [
      { tier: 2, category: 'cultural', description: 'President, Asian Student Union; organized Lunar New Year festival (800 attendees); established cultural exchange with 5 schools; featured in local news', whyItWorks: 'Leadership + scale + sustainability + media coverage' },
    ],
  },

  dance: {
    structure: 'unique_contribution',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Dance action', examples: ['Choreographed', 'Performed', 'Founded'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Style and scale', examples: ['15-person company', 'original contemporary piece'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Performance/recognition', examples: ['YAGP semifinalist', 'performed at Kennedy Center'] },
      { component: 'uniqueness', characterBudget: 40, required: false, bestPractice: 'Artistic vision', examples: ['fusing hip-hop with classical'] },
    ],
    exemplars: [
      { tier: 1, category: 'dance', description: 'Principal dancer, American Ballet Theatre Summer Program; choreographed piece performed at Joyce Theater; YAGP NY Finals Top 12', whyItWorks: 'Elite program + NYC venue + national competition placement' },
    ],
  },

  debate_speech: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 20, required: false, bestPractice: 'Team role', examples: ['Captain', 'Founder'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Tournament results', examples: ['TOC qualifier', 'State champion', 'Top 10 nationally'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Level and format', examples: ['Policy debate', 'Lincoln-Douglas'] },
      { component: 'action_verb', characterBudget: 30, required: false, bestPractice: 'Leadership action', examples: ['Coached', 'Mentored'] },
    ],
    exemplars: [
      { tier: 1, category: 'debate_speech', description: 'TOC Champion, Lincoln-Douglas; #1 national ranking (NSDA); coached 8 novices (3 qualified to state); interned at Debate Institute', whyItWorks: 'Ultimate achievement + ranking + giving back' },
    ],
  },

  environmental: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Environmental action', examples: ['Founded', 'Led', 'Implemented'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scale', examples: ['city-wide', '50 volunteers', '10 schools'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Environmental impact', examples: ['diverted 5 tons from landfill', 'planted 1000 trees'] },
      { component: 'uniqueness', characterBudget: 35, required: false, bestPractice: 'Innovation', examples: ['first zero-waste program', 'policy change'] },
    ],
    exemplars: [
      { tier: 1, category: 'environmental', description: 'Founded Youth Climate Coalition; lobbied state legislature (bill passed); organized 2000-person march; testified before EPA; featured in NYT', whyItWorks: 'Founded + policy impact + scale + media' },
    ],
  },

  family_responsibilities: {
    structure: 'role_scope_result',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Care action', examples: ['Cared for', 'Managed', 'Supported'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Responsibilities', examples: ['younger siblings', 'household finances', 'family business'] },
      { component: 'result', characterBudget: 45, required: true, bestPractice: 'Outcome', examples: ['maintained 4.0 GPA', 'contributed $500/month'] },
      { component: 'context', characterBudget: 35, required: false, bestPractice: 'Circumstances', examples: ['while parent deployed', 'during medical crisis'] },
    ],
    exemplars: [
      { tier: 2, category: 'family_responsibilities', description: 'Primary caregiver for grandmother with Alzheimer\'s (20 hrs/wk); managed medications, appointments; maintained honor roll while working part-time', whyItWorks: 'Specific, quantified, shows maturity and resilience' },
    ],
  },

  foreign_exchange: {
    structure: 'unique_contribution',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Exchange action', examples: ['Lived', 'Studied', 'Immersed'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Duration and place', examples: ['year in Japan', '6 months in France'] },
      { component: 'result', characterBudget: 45, required: true, bestPractice: 'Achievement/growth', examples: ['fluent in Mandarin', 'published bilingual poetry'] },
      { component: 'uniqueness', characterBudget: 40, required: false, bestPractice: 'Unique experience', examples: ['only American in village', 'cultural bridge'] },
    ],
    exemplars: [
      { tier: 2, category: 'foreign_exchange', description: 'CBYX Scholar (1 of 250 nationally); lived with host family in rural Germany; achieved C1 German fluency; founded cultural exchange blog (5K readers)', whyItWorks: 'Selective program + immersion + language achievement + initiative' },
    ],
  },

  foreign_language: {
    structure: 'action_impact',
    components: [
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Language and level', examples: ['Mandarin (HSK 6)', 'Arabic (fluent)'] },
      { component: 'action_verb', characterBudget: 30, required: true, bestPractice: 'How used', examples: ['Translated', 'Taught', 'Interpreted'] },
      { component: 'result', characterBudget: 45, required: true, bestPractice: 'Impact', examples: ['for refugees', 'published translation'] },
      { component: 'uniqueness', characterBudget: 35, required: false, bestPractice: 'Achievement', examples: ['National Spanish Exam Gold', 'heritage speaker'] },
    ],
    exemplars: [
      { tier: 2, category: 'foreign_language', description: 'Trilingual (English, Spanish, Portuguese); volunteer court interpreter for immigration cases (100+ hours); National Spanish Exam Gold medalist', whyItWorks: 'Three languages + real-world application + recognition' },
    ],
  },

  journalism_publication: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Editorial role', examples: ['Editor-in-Chief', 'Lead reporter'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Journalism action', examples: ['Investigated', 'Published', 'Founded'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Publication/impact', examples: ['exposed policy violation', 'won NSPA award'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Reach/scale', examples: ['2000 readers', 'statewide'] },
    ],
    exemplars: [
      { tier: 1, category: 'journalism_publication', description: 'Editor-in-Chief, school paper (NSPA Pacemaker finalist); investigative piece on grade inflation led to policy change; byline in Washington Post', whyItWorks: 'Leadership + national recognition + real impact + major publication' },
    ],
  },

  lgbtq: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Your role', examples: ['Founder', 'President'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Advocacy action', examples: ['Founded', 'Advocated', 'Organized'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scale', examples: ['city-wide', '500 students', 'state legislation'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Impact', examples: ['policy change', 'safe space created'] },
    ],
    exemplars: [
      { tier: 2, category: 'lgbtq', description: 'Founded first GSA at school; grew to 45 members; trained 100 teachers on inclusivity; successfully advocated for gender-neutral bathrooms', whyItWorks: 'Founded + growth + tangible policy change' },
    ],
  },

  music_instrumental: {
    structure: 'leadership_achievement',
    components: [
      { component: 'scope', characterBudget: 35, required: true, bestPractice: 'Instrument/ensemble', examples: ['Principal cellist', 'Jazz piano'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Achievement', examples: ['All-State', 'concerto competition winner'] },
      { component: 'action_verb', characterBudget: 30, required: false, bestPractice: 'Musical action', examples: ['Performed at', 'Commissioned'] },
      { component: 'uniqueness', characterBudget: 25, required: false, bestPractice: 'Special', examples: ['original compositions'] },
    ],
    exemplars: [
      { tier: 1, category: 'music_instrumental', description: 'Principal violin, All-Eastern Orchestra; YoungArts Winner; premiered original composition at Carnegie Hall; accepted to Juilliard Pre-College', whyItWorks: 'Elite ensemble + national award + premiere venue + elite program' },
    ],
  },

  music_vocal: {
    structure: 'leadership_achievement',
    components: [
      { component: 'scope', characterBudget: 35, required: true, bestPractice: 'Voice/ensemble', examples: ['Soprano', 'A cappella founder'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Achievement', examples: ['ICCA finalist', 'All-State'] },
      { component: 'action_verb', characterBudget: 30, required: false, bestPractice: 'Vocal action', examples: ['Soloed at', 'Arranged'] },
      { component: 'uniqueness', characterBudget: 25, required: false, bestPractice: 'Special', examples: ['arranged 20 songs'] },
    ],
    exemplars: [
      { tier: 2, category: 'music_vocal', description: 'Founded a cappella group; arranged 15 songs; ICHSA semifinalist; led group from 8 to 16 members; performed at state governor\'s inauguration', whyItWorks: 'Founded + creative contribution + competition success + prestige venue' },
    ],
  },

  other_club: {
    structure: 'role_scope_result',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Role', examples: ['President', 'Founder'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Action', examples: ['Led', 'Organized', 'Grew'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Scale', examples: ['50 members', 'weekly events'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Achievement', examples: ['expanded to 3 schools'] },
    ],
    exemplars: [
      { tier: 3, category: 'other_club', description: 'President, Philosophy Club; grew membership from 5 to 30; organized ethics bowl (won regionals); hosted speaker series with 3 professors', whyItWorks: 'Growth metrics + competition success + external engagement' },
    ],
  },

  religious: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 30, required: false, bestPractice: 'Religious role', examples: ['Youth group leader', 'Cantor'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Service action', examples: ['Led', 'Organized', 'Served'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scope of service', examples: ['200-member congregation', 'weekly services'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Impact', examples: ['grew youth group 40%', 'led 5 service trips'] },
    ],
    exemplars: [
      { tier: 2, category: 'religious', description: 'Teen Board President, synagogue; led 80-member youth group; organized interfaith dialogue series (5 faiths); planned service trip serving 200 families', whyItWorks: 'Leadership + scale + interfaith initiative + direct service' },
    ],
  },

  research: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Research action', examples: ['Researched', 'Discovered', 'Published'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Research topic', examples: ['CRISPR gene editing', 'novel cancer biomarker'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Output', examples: ['published in Nature', 'presented at conference'] },
      { component: 'context', characterBudget: 35, required: false, bestPractice: 'Where', examples: ['MIT lab', 'independent'] },
    ],
    exemplars: [
      { tier: 1, category: 'research', description: 'Discovered novel antibiotic compound; first-author paper in ACS Infectious Diseases (IF 5.8); patent pending; Regeneron STS Scholar ($25K)', whyItWorks: 'Discovery + first-author + patent + top competition' },
    ],
  },

  robotics: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Team role', examples: ['Captain', 'Lead programmer'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Competition results', examples: ['World Championship', 'Dean\'s List'] },
      { component: 'action_verb', characterBudget: 30, required: true, bestPractice: 'Technical action', examples: ['Designed', 'Programmed', 'Led'] },
      { component: 'scope', characterBudget: 35, required: true, bestPractice: 'Technical scope', examples: ['autonomous navigation', '6-axis arm'] },
    ],
    exemplars: [
      { tier: 1, category: 'robotics', description: 'FRC Team Captain; led 40-member team to World Championship (top 10); Dean\'s List Finalist; designed autonomous system with 95% accuracy', whyItWorks: 'Leadership + worlds placement + individual recognition + technical specifics' },
    ],
  },

  school_spirit: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 30, required: false, bestPractice: 'Role', examples: ['Student Body President'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Leadership action', examples: ['United', 'Revitalized', 'Led'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scale', examples: ['1500 students', 'school-wide'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Impact', examples: ['increased attendance 40%', 'policy change'] },
    ],
    exemplars: [
      { tier: 2, category: 'school_spirit', description: 'Student Body President; unified 1800-student body; increased event attendance 50%; successfully advocated for open campus lunch policy', whyItWorks: 'Top leadership + scale + metrics + tangible change' },
    ],
  },

  science_math: {
    structure: 'leadership_achievement',
    components: [
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Competition results', examples: ['USAMO qualifier', 'Science Olympiad nationals'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Subject/level', examples: ['physics', 'national level'] },
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Team role', examples: ['Team captain', 'Tutored'] },
      { component: 'action_verb', characterBudget: 25, required: false, bestPractice: 'Action', examples: ['Led team to'] },
    ],
    exemplars: [
      { tier: 1, category: 'science_math', description: 'USAMO Qualifier (#150 nationally); IMO Training Camp invitee; Math Olympiad team captain (1st at states); tutored 15 students (avg +200 SAT pts)', whyItWorks: 'Elite qualification + national ranking + leadership + giving back' },
    ],
  },

  social_justice: {
    structure: 'action_impact',
    components: [
      { component: 'action_verb', characterBudget: 15, required: true, bestPractice: 'Advocacy action', examples: ['Founded', 'Organized', 'Lobbied'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Cause and scale', examples: ['criminal justice reform', '500 activists'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Policy/impact', examples: ['bill passed', 'curriculum changed'] },
      { component: 'uniqueness', characterBudget: 30, required: false, bestPractice: 'Your role', examples: ['testified before legislature'] },
    ],
    exemplars: [
      { tier: 1, category: 'social_justice', description: 'Co-founded youth voting coalition; registered 3000 voters; organized march (5000 attendees); testimony influenced state voting access bill', whyItWorks: 'Founded + massive scale + legislative impact' },
    ],
  },

  student_government: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 30, required: true, bestPractice: 'Position', examples: ['Class President', 'Senator'] },
      { component: 'action_verb', characterBudget: 25, required: true, bestPractice: 'Governance action', examples: ['Passed', 'Implemented', 'Advocated'] },
      { component: 'result', characterBudget: 55, required: true, bestPractice: 'Achievement', examples: ['$10K budget increase', 'new mental health resources'] },
      { component: 'scope', characterBudget: 40, required: true, bestPractice: 'Scale', examples: ['representing 2000 students'] },
    ],
    exemplars: [
      { tier: 2, category: 'student_government', description: 'Student Body VP; led budget committee ($50K); implemented mental health initiative (counselor hours +30%); created student feedback system', whyItWorks: 'Executive role + budget responsibility + tangible impact' },
    ],
  },

  theater: {
    structure: 'leadership_achievement',
    components: [
      { component: 'leadership', characterBudget: 25, required: false, bestPractice: 'Role', examples: ['Lead', 'Director', 'Stage manager'] },
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Theater action', examples: ['Starred in', 'Directed', 'Produced'] },
      { component: 'result', characterBudget: 60, required: true, bestPractice: 'Achievement', examples: ['state festival selection', 'thespian honor society'] },
      { component: 'scope', characterBudget: 45, required: true, bestPractice: 'Scale', examples: ['5 productions', '800 audience'] },
    ],
    exemplars: [
      { tier: 1, category: 'theater', description: 'Lead in 8 productions; state Thespian Conference Outstanding Actor; self-produced original play (sold-out 3 shows); accepted to summer at Tisch', whyItWorks: 'Volume + individual recognition + initiative + elite program' },
    ],
  },

  work_paid: {
    structure: 'role_scope_result',
    components: [
      { component: 'action_verb', characterBudget: 20, required: true, bestPractice: 'Work action', examples: ['Managed', 'Led', 'Created'] },
      { component: 'scope', characterBudget: 50, required: true, bestPractice: 'Responsibilities', examples: ['team of 5', 'inventory system', '$10K/day sales'] },
      { component: 'result', characterBudget: 50, required: true, bestPractice: 'Achievement', examples: ['promoted twice', 'increased efficiency 25%'] },
      { component: 'context', characterBudget: 30, required: false, bestPractice: 'Hours/duration', examples: ['25 hrs/wk', 'while in school'] },
    ],
    exemplars: [
      { tier: 2, category: 'work_paid', description: 'Shift Manager, Starbucks (20 hrs/wk); promoted from barista in 6 months; trained 12 new employees; increased store rating from 3.8 to 4.5 stars', whyItWorks: 'Promotion + training others + measurable business impact' },
    ],
  },
};

// ============================================================================
// SPIKE DEVELOPMENT
// ============================================================================

/**
 * Spike identification and development
 */
export interface SpikeAnalysis {
  // Current state
  hasSpikePresent: boolean;
  currentSpikeStrength: SpikeStrength;
  spikeArea?: string;
  spikeActivities?: string[];

  // Spike assessment
  assessment: {
    depth: HarvardScoreDecimal;        // How deep is the expertise?
    recognition: HarvardScoreDecimal;   // External validation level
    consistency: HarvardScoreDecimal;   // All activities align?
    trajectory: HarvardScoreDecimal;    // Clear upward progression?
    uniqueness: HarvardScoreDecimal;    // Standing out in this area?
    overallStrength: HarvardScoreDecimal;
  };

  // What the spike conveys
  spikeNarrative: {
    whatItShows: string[];
    whatItMissing: string[];
    howAdmissionsWillSeeIt: string;
  };

  // Development path
  developmentPath: SpikeDevelopmentPath;
}

/**
 * Spike strength levels
 */
export type SpikeStrength =
  | 'national_elite'      // National/international recognition
  | 'regional_strong'     // State/regional level
  | 'local_notable'       // School/community recognition
  | 'emerging'            // Clear focus, building depth
  | 'potential'           // Interest but no spike yet
  | 'none';               // No clear focus area

/**
 * Spike development path
 */
export interface SpikeDevelopmentPath {
  currentTier: SpikeStrength;
  targetTier: SpikeStrength;
  timelineToTarget: string;
  feasibility: 'highly_feasible' | 'feasible' | 'challenging' | 'difficult';

  // Milestones to hit
  milestones: {
    milestone: string;
    targetDate: string;
    currentStatus: 'not_started' | 'in_progress' | 'completed';
    importance: 'critical' | 'important' | 'helpful';
    howToAchieve: string[];
  }[];

  // Specific actions
  nextActions: {
    action: string;
    timeline: string;
    effort: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }[];

  // Opportunities to pursue
  opportunities: {
    opportunity: string;
    deadline?: string;
    competitiveness: 'very_competitive' | 'competitive' | 'accessible';
    fitForProfile: HarvardScoreDecimal;
    howToApply: string;
  }[];

  // Risks and mitigation
  risks: {
    risk: string;
    likelihood: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];
}

/**
 * Spike development by area
 */
export type SpikeArea =
  | 'stem_research'
  | 'stem_competition'
  | 'entrepreneurship'
  | 'social_impact'
  | 'arts_performance'
  | 'arts_visual'
  | 'writing_journalism'
  | 'debate_speech'
  | 'athletics'
  | 'leadership'
  | 'technology'
  | 'music'
  | 'international'
  | 'policy_politics';

/**
 * Area-specific spike development guide
 */
export interface SpikeAreaGuide {
  area: SpikeArea;
  description: string;

  // What each tier looks like
  tierExamples: Record<SpikeStrength, {
    description: string;
    examples: string[];
    typicalActivities: string[];
  }>;

  // Path from tier to tier
  progressionPath: {
    from: SpikeStrength;
    to: SpikeStrength;
    typicalTime: string;
    keyMilestones: string[];
    successRate: string;
  }[];

  // Top opportunities
  keyOpportunities: {
    name: string;
    tier: SpikeStrength;
    selectivity: string;
    deadline?: string;
    description: string;
  }[];

  // Common mistakes
  commonMistakes: {
    mistake: string;
    whyItHurts: string;
    howToAvoid: string;
  }[];
}

// ============================================================================
// ACTIVITY TIER DEVELOPMENT
// ============================================================================

/**
 * Activity upgrade analysis
 */
export interface ActivityUpgradeAnalysis {
  activityId: string;
  activityName: string;
  currentTier: ActivityTierScore;
  potentialTier: ActivityTierScore;

  // Current assessment
  currentAssessment: {
    tierJustification: string;
    strengths: string[];
    weaknesses: string[];
    missedOpportunities: string[];
  };

  // Upgrade potential
  upgradePotential: {
    feasibility: 'highly_feasible' | 'feasible' | 'challenging' | 'unlikely';
    timeRequired: string;
    effortRequired: 'high' | 'medium' | 'low';
    whatWouldChangeEverything: string;
  };

  // Upgrade path
  upgradePath: {
    milestone: string;
    tierAfter: ActivityTierScore;
    howToAchieve: string[];
    timeline: string;
    dependencies: string[];
  }[];

  // Specific recommendations
  recommendations: {
    priority: number;
    recommendation: string;
    rationale: string;
    timeline: string;
    expectedImpact: string;
  }[];
}

/**
 * Activity tier benchmarks
 */
export const ACTIVITY_TIER_BENCHMARKS: Record<ActivityTierScore, {
  leadership: string;
  recognition: string;
  impact: string;
  time: string;
  examples: string[];
}> = {
  1: {
    leadership: 'Founder, national/state leader, or top position',
    recognition: 'National/international awards, major media coverage',
    impact: 'Thousands affected, systemic change, policy impact',
    time: '10+ hours/week, multi-year commitment',
    examples: [
      'Founded nonprofit serving 10,000+ people',
      'ISEF Grand Prize / IMO medalist',
      'Recruited D1 athlete at top program',
      'Published research in major journal',
      'National debate champion (TOC)',
    ],
  },
  2: {
    leadership: 'President, captain, or significant leadership role',
    recognition: 'State-level awards, regional recognition',
    impact: 'Hundreds affected, measurable community change',
    time: '5-10 hours/week, 2+ years',
    examples: [
      'State debate finalist',
      'All-State musician/athlete',
      'Founded local chapter of organization',
      'Published regional research',
      'Varsity team captain, conference honors',
    ],
  },
  3: {
    leadership: 'Club officer, team leader, or coordinator',
    recognition: 'School-level awards, local recognition',
    impact: 'School or local community impact',
    time: '3-5 hours/week, 1-2 years',
    examples: [
      'Club president',
      'JV team captain',
      'Regular volunteer coordinator',
      'School award recipient',
      'Consistent multi-year involvement',
    ],
  },
  4: {
    leadership: 'Member, participant, no leadership',
    recognition: 'Participation, no awards',
    impact: 'Personal development only',
    time: '1-3 hours/week, less than 1 year',
    examples: [
      'Club member',
      'Occasional volunteer',
      'Team participant',
      'Short-term involvement',
      'Passive participation',
    ],
  },
};

// ============================================================================
// ACTIVITY PORTFOLIO STRATEGY
// ============================================================================

/**
 * Portfolio-level activity strategy
 */
export interface ActivityPortfolioStrategy {
  // Current state
  currentState: {
    totalActivities: number;
    tierDistribution: Record<ActivityTierScore, number>;
    averageTier: number;
    hasSpike: boolean;
    coherenceScore: HarvardScoreDecimal;
    hoursTotal: number;
  };

  // Assessment
  portfolioAssessment: {
    overallStrength: HarvardScoreDecimal;
    competitiveFor: string[];  // School tiers
    strengths: string[];
    weaknesses: string[];
    mainNarrative: string;
  };

  // Optimization strategy
  optimizationStrategy: {
    focus: 'depth' | 'breadth' | 'balance';
    rationale: string;
    primaryGoal: string;
  };

  // Specific recommendations
  activityRecommendations: {
    strengthen: {
      activity: string;
      currentTier: ActivityTierScore;
      targetTier: ActivityTierScore;
      priority: number;
      rationale: string;
    }[];
    add: {
      activityType: string;
      rationale: string;
      priority: number;
      suggestions: string[];
    }[];
    deprioritize: {
      activity: string;
      rationale: string;
    }[];
  };

  // Time allocation
  timeAllocation: {
    activity: string;
    currentHours: number;
    recommendedHours: number;
    rationale: string;
  }[];

  // Common App ordering strategy
  commonAppOrdering: {
    position: number;
    activity: string;
    rationale: string;
  }[];

  // Long-term development plan
  developmentPlan: {
    month: string;
    focus: string;
    milestones: string[];
    opportunities: string[];
  }[];
}

/**
 * Common App activities section optimization
 */
export interface CommonAppActivitiesOptimization {
  // Current section quality
  sectionScore: HarvardScoreDecimal;

  // Individual activity analyses
  activities: {
    position: number;
    name: string;
    type: string;
    tier: ActivityTierScore;
    descriptionScore: HarvardScoreDecimal;
    optimizedDescription?: string;
    recommendations: string[];
  }[];

  // Section-level optimization
  sectionOptimization: {
    ordering: {
      current: number[];
      recommended: number[];
      rationale: string;
    };
    narrative: {
      currentNarrative: string;
      suggestedNarrative: string;
      coherenceImprovement: number;
    };
    gaps: {
      gap: string;
      howToAddress: string;
    }[];
  };

  // Before/after comparison
  comparison: {
    currentScore: HarvardScoreDecimal;
    optimizedScore: HarvardScoreDecimal;
    improvement: number;
    keyChanges: string[];
  };
}

// ============================================================================
// GRADE-SPECIFIC ACTIVITY GUIDANCE
// ============================================================================

/**
 * Grade-appropriate activity guidance
 */
export interface GradeSpecificActivityGuidance {
  gradeLevel: GradeLevel;

  // What to focus on
  priorities: {
    priority: string;
    rationale: string;
    actions: string[];
  }[];

  // Appropriate activities
  appropriateActivities: {
    activity: string;
    whyNow: string;
    commitmentExpected: string;
    leadershipExpected: string;
  }[];

  // What's premature
  prematureActivities: {
    activity: string;
    whyPremature: string;
    whenAppropriate: GradeLevel | 'never';
  }[];

  // Leadership expectations
  leadershipExpectations: {
    typical: string;
    stretch: string;
    premature: string;
  };

  // Hours expectations
  hoursExpectations: {
    minimum: number;
    typical: number;
    maximum: number;
    notes: string;
  };
}

/**
 * Grade-level activity expectations
 */
export const GRADE_ACTIVITY_EXPECTATIONS: Record<GradeLevel, GradeSpecificActivityGuidance> = {
  '9th': {
    gradeLevel: '9th',
    priorities: [
      { priority: 'Explore broadly', rationale: 'Find genuine interests, not check boxes', actions: ['Try 5-7 different activities', 'Attend intro meetings', 'Give things a semester'] },
      { priority: 'Build foundation', rationale: 'Skills take time to develop', actions: ['Join a team sport or art', 'Start an instrument if interested', 'Volunteer locally'] },
    ],
    appropriateActivities: [
      { activity: 'Join 5-7 activities', whyNow: 'Exploration phase', commitmentExpected: 'Low - trying things out', leadershipExpected: 'None expected' },
      { activity: 'Sports teams (JV or recreational)', whyNow: 'Build skills early', commitmentExpected: 'Moderate', leadershipExpected: 'None' },
      { activity: 'Clubs as member', whyNow: 'Learn how they work', commitmentExpected: 'Low', leadershipExpected: 'None' },
    ],
    prematureActivities: [
      { activity: 'President/leadership positions', whyPremature: 'Too early, need to earn respect', whenAppropriate: '10th' },
      { activity: 'Starting a nonprofit', whyPremature: 'Don\'t have expertise or network yet', whenAppropriate: '11th' },
      { activity: 'Selective summer programs', whyPremature: 'Build foundation first', whenAppropriate: '10th' },
    ],
    leadershipExpectations: {
      typical: 'No leadership expected',
      stretch: 'Freshman class representative',
      premature: 'Club president',
    },
    hoursExpectations: {
      minimum: 5,
      typical: 10,
      maximum: 20,
      notes: 'Focus on exploration, not hours accumulation',
    },
  },
  '10th': {
    gradeLevel: '10th',
    priorities: [
      { priority: 'Narrow and deepen', rationale: 'Move from breadth to depth', actions: ['Identify 3-4 core activities', 'Drop activities that don\'t resonate', 'Increase commitment to core activities'] },
      { priority: 'Seek first leadership', rationale: 'Begin building leadership track record', actions: ['Run for officer positions', 'Take on coordinator roles', 'Propose new initiatives'] },
      { priority: 'Start competing', rationale: 'External validation matters', actions: ['Enter competitions', 'Apply for selective programs', 'Seek recognition'] },
    ],
    appropriateActivities: [
      { activity: 'Core activities (3-4)', whyNow: 'Time to commit', commitmentExpected: 'Moderate to high', leadershipExpected: 'Junior officer, coordinator' },
      { activity: 'First competitions', whyNow: 'Build toward achievements', commitmentExpected: 'Varies', leadershipExpected: 'Team contributor' },
      { activity: 'Summer programs (state level)', whyNow: 'Foundation for bigger programs', commitmentExpected: '2-6 weeks', leadershipExpected: 'Participant' },
    ],
    prematureActivities: [
      { activity: 'National-level programs (RSI, etc)', whyPremature: 'Build toward this, very competitive', whenAppropriate: '11th' },
      { activity: 'Major leadership (president)', whyPremature: 'Usually reserved for juniors/seniors', whenAppropriate: '11th' },
    ],
    leadershipExpectations: {
      typical: 'Vice president, treasurer, committee chair',
      stretch: 'Club president (smaller club)',
      premature: 'Student body officer',
    },
    hoursExpectations: {
      minimum: 10,
      typical: 15,
      maximum: 25,
      notes: 'Quality over quantity, depth in chosen areas',
    },
  },
  '11th': {
    gradeLevel: '11th',
    priorities: [
      { priority: 'Maximize achievements', rationale: 'Peak year for accomplishments', actions: ['Win competitions', 'Achieve major leadership', 'Create tangible impact'] },
      { priority: 'Solidify spike', rationale: 'Clear expertise area', actions: ['Focus on spike activities', 'Seek highest recognition', 'Build national profile'] },
      { priority: 'Document impact', rationale: 'Need numbers for applications', actions: ['Track metrics', 'Quantify everything', 'Gather testimonials'] },
    ],
    appropriateActivities: [
      { activity: 'Core activities at highest level', whyNow: 'Last full year to achieve', commitmentExpected: 'High', leadershipExpected: 'Top positions' },
      { activity: 'National competitions', whyNow: 'Now or never', commitmentExpected: 'Significant prep', leadershipExpected: 'Individual or team leader' },
      { activity: 'Elite summer programs', whyNow: 'Summer before senior year is critical', commitmentExpected: '6-8 weeks', leadershipExpected: 'Participant' },
    ],
    prematureActivities: [
      { activity: 'Starting entirely new activities', whyPremature: 'Won\'t have time to develop', whenAppropriate: 'never' },
    ],
    leadershipExpectations: {
      typical: 'President, captain, founder',
      stretch: 'State/regional leadership',
      premature: 'None - this is the year',
    },
    hoursExpectations: {
      minimum: 15,
      typical: 20,
      maximum: 35,
      notes: 'Balance with academics, don\'t burn out',
    },
  },
  '12th': {
    gradeLevel: '12th',
    priorities: [
      { priority: 'Maintain commitments', rationale: 'Shows consistency', actions: ['Continue core activities', 'Maintain leadership', 'Don\'t drop things senior year'] },
      { priority: 'Final achievements', rationale: 'Last chances for some awards', actions: ['Complete ongoing projects', 'Submit final competition entries', 'Finish what you started'] },
      { priority: 'Document for applications', rationale: 'Need to report accurately', actions: ['Update hours', 'Finalize descriptions', 'Gather references'] },
    ],
    appropriateActivities: [
      { activity: 'Continued core activities', whyNow: 'Consistency matters', commitmentExpected: 'Maintained', leadershipExpected: 'Continued leadership' },
      { activity: 'Senior capstone projects', whyNow: 'Final demonstration of skills', commitmentExpected: 'Moderate', leadershipExpected: 'Self-directed' },
    ],
    prematureActivities: [
      { activity: 'Starting new activities', whyPremature: 'Too late to matter, looks desperate', whenAppropriate: 'never' },
      { activity: 'New leadership positions', whyPremature: 'Won\'t have time to achieve anything', whenAppropriate: 'never' },
    ],
    leadershipExpectations: {
      typical: 'Maintain senior year positions',
      stretch: 'N/A',
      premature: 'New positions',
    },
    hoursExpectations: {
      minimum: 10,
      typical: 15,
      maximum: 25,
      notes: 'Reduced due to applications, maintain what matters',
    },
  },
  'gap_year': {
    gradeLevel: 'gap_year',
    priorities: [
      { priority: 'Meaningful experience', rationale: 'Must justify the gap year', actions: ['Work/intern', 'Research', 'Travel with purpose', 'Create something'] },
      { priority: 'Growth and reflection', rationale: 'Show maturity development', actions: ['Independent projects', 'Self-directed learning', 'Challenge yourself'] },
    ],
    appropriateActivities: [
      { activity: 'Full-time work or internship', whyNow: 'Real-world experience', commitmentExpected: 'High', leadershipExpected: 'Appropriate to role' },
      { activity: 'Independent project', whyNow: 'Demonstrate initiative', commitmentExpected: 'Self-directed', leadershipExpected: 'Self-led' },
      { activity: 'Travel/service abroad', whyNow: 'Broadening experience', commitmentExpected: 'Significant time', leadershipExpected: 'Varies' },
    ],
    prematureActivities: [],
    leadershipExpectations: {
      typical: 'Appropriate to context',
      stretch: 'N/A',
      premature: 'N/A',
    },
    hoursExpectations: {
      minimum: 30,
      typical: 40,
      maximum: 60,
      notes: 'Gap year should be full-time commitment to something',
    },
  },
  'transfer': {
    gradeLevel: 'transfer',
    priorities: [
      { priority: 'College-level activities', rationale: 'Show growth in college', actions: ['Join college clubs', 'Research with professors', 'Campus leadership'] },
      { priority: 'Why transfer reasons', rationale: 'Activities should reflect transfer motivation', actions: ['Pursue opportunities not available at current school'] },
    ],
    appropriateActivities: [
      { activity: 'College organizations', whyNow: 'College-level engagement', commitmentExpected: 'Appropriate', leadershipExpected: 'Seeking leadership' },
      { activity: 'Research with faculty', whyNow: 'Academic focus', commitmentExpected: 'Significant', leadershipExpected: 'Student researcher' },
    ],
    prematureActivities: [],
    leadershipExpectations: {
      typical: 'Officer in college orgs',
      stretch: 'Founded new initiative',
      premature: 'N/A',
    },
    hoursExpectations: {
      minimum: 10,
      typical: 15,
      maximum: 25,
      notes: 'Balance with college GPA (most important)',
    },
  },
};
