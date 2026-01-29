/**
 * Award & Recognition Evaluator
 *
 * Comprehensive evaluation of student honors and awards for college admissions.
 * Analyzes recognition levels, selectivity, and strategic positioning for
 * Common App optimization.
 *
 * QUALITY PRINCIPLES:
 * - Accurate classification based on known award database
 * - Context-aware selectivity scoring
 * - Strategic Common App optimization
 * - Competitive context analysis for T20 admissions
 *
 * NOTE: Known award profiles can be expanded through deep research.
 * The current database covers major awards; unknown awards are evaluated
 * heuristically based on provided metadata.
 */

import {
  AwardInputData,
  AwardsInputData,
  AwardAssessment,
  AwardEvaluation,
  AwardDistributionAnalysis,
  AwardHighlightsAnalysis,
  CommonAppHonorsOptimization,
  AwardCompetitiveContext,
  AwardGapAnalysis,
  AwardRecognitionLevel,
  AwardSelectivity,
  AwardCategory,
  CommonAppHonorLevel,
  KnownAwardProfile,
} from '../types/awards';
import {
  calculateWeightedScore,
  calculateTier,
  generateInputHash,
  calculateConfidence,
  WeightedScoreComponent,
} from '../utils/scoring';
import { awardEvaluationCache, generateHashedCacheKey } from '../utils/caching';
import { validateAwards, ValidationResult } from '../utils/validation';

// ============================================================================
// KNOWN AWARD DATABASE
// ============================================================================

/**
 * Database of known awards with pre-classified recognition and selectivity.
 * This can be expanded through deep research to include more awards.
 */
const KNOWN_AWARDS: KnownAwardProfile[] = [
  // ========== INTERNATIONAL AWARDS ==========
  {
    id: 'imo_gold',
    name: 'International Mathematical Olympiad Gold Medal',
    aliases: ['IMO Gold', 'IMO First Place'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    annualRecipients: 45,
    annualApplicants: 600000,
    selectionRate: 0.000075,
    description: 'Highest recognition at the premier international mathematics competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'One of the most prestigious academic achievements a high school student can earn. Virtually guarantees admission consideration at any school.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Gold Medal, International Mathematical Olympiad (top 45 worldwide)',
    suggestedLevel: 'international',
  },
  {
    id: 'imo_silver',
    name: 'International Mathematical Olympiad Silver Medal',
    aliases: ['IMO Silver'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    annualRecipients: 90,
    description: 'Second-tier recognition at the premier international mathematics competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Extremely prestigious achievement demonstrating world-class mathematical ability.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Silver Medal, International Mathematical Olympiad',
    suggestedLevel: 'international',
  },
  {
    id: 'isef_grand',
    name: 'ISEF Grand Award',
    aliases: ['Intel ISEF Grand', 'Regeneron ISEF Grand', 'International Science and Engineering Fair Grand Award'],
    category: 'science_fair',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    annualRecipients: 60,
    annualApplicants: 1800,
    selectionRate: 0.033,
    description: 'Top prize at the world\'s largest pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Indicates exceptional research ability and scientific potential. Strong indicator of future research success.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Grand Award, Regeneron ISEF (top 3% of 1,800 finalists)',
    suggestedLevel: 'international',
  },
  {
    id: 'isef_category',
    name: 'ISEF Category Award',
    aliases: ['Intel ISEF Category', 'Regeneron ISEF Category Award'],
    category: 'science_fair',
    recognitionLevel: 'international',
    selectivity: 'selective',
    annualRecipients: 300,
    description: 'Category-level recognition at the world\'s largest pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Strong research credential, demonstrates ability to compete at highest level.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: '[Category] Award, Regeneron ISEF',
    suggestedLevel: 'international',
  },
  {
    id: 'ipho',
    name: 'International Physics Olympiad Medal',
    aliases: ['IPhO Medal', 'IPhO Gold', 'IPhO Silver', 'IPhO Bronze'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    description: 'Medal at the premier international physics competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional physics ability at international level.',
    relevantMajors: ['physics', 'engineering', 'mathematics'],
    suggestedDescription: '[Metal] Medal, International Physics Olympiad',
    suggestedLevel: 'international',
  },
  {
    id: 'icho',
    name: 'International Chemistry Olympiad Medal',
    aliases: ['IChO Medal'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    description: 'Medal at the premier international chemistry competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'World-class chemistry ability.',
    relevantMajors: ['chemistry', 'biochemistry', 'chemical_engineering'],
    suggestedDescription: '[Metal] Medal, International Chemistry Olympiad',
    suggestedLevel: 'international',
  },
  {
    id: 'ioi',
    name: 'International Olympiad in Informatics Medal',
    aliases: ['IOI Medal', 'IOI Gold', 'IOI Silver', 'IOI Bronze'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    description: 'Medal at the premier international computing competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional programming and algorithmic ability.',
    relevantMajors: ['computer_science', 'software_engineering', 'mathematics'],
    suggestedDescription: '[Metal] Medal, International Olympiad in Informatics',
    suggestedLevel: 'international',
  },
  {
    id: 'ibo',
    name: 'International Biology Olympiad Medal',
    aliases: ['IBO Medal'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    description: 'Medal at the premier international biology competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'World-class biology knowledge and research potential.',
    relevantMajors: ['biology', 'pre-med', 'biochemistry'],
    suggestedDescription: '[Metal] Medal, International Biology Olympiad',
    suggestedLevel: 'international',
  },

  // ========== NATIONAL AWARDS ==========
  {
    id: 'usamo_winner',
    name: 'USA Mathematical Olympiad Winner',
    aliases: ['USAMO Winner', 'USAMO Top 12'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    annualRecipients: 12,
    annualApplicants: 300000,
    description: 'Top scorer on the USA Mathematical Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite mathematical ability, one of the top math students in the country.',
    relevantMajors: ['mathematics', 'physics', 'computer_science'],
    suggestedDescription: 'Winner, USA Mathematical Olympiad (top 12 nationally)',
    suggestedLevel: 'national',
  },
  {
    id: 'usamo_qualifier',
    name: 'USA Mathematical Olympiad Qualifier',
    aliases: ['USAMO Qualifier', 'Made USAMO'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    annualRecipients: 250,
    description: 'Qualified to take the USA Mathematical Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Top 250 math students in the country - exceptional achievement.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Qualifier, USA Mathematical Olympiad (top 250 nationally)',
    suggestedLevel: 'national',
  },
  {
    id: 'usabo_national',
    name: 'USA Biology Olympiad National Finalist',
    aliases: ['USABO National', 'USABO Top 20'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    annualRecipients: 20,
    description: 'Top 20 finalists in the USA Biology Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite biology student, potential researcher.',
    relevantMajors: ['biology', 'pre-med', 'biochemistry', 'neuroscience'],
    suggestedDescription: 'National Finalist, USA Biology Olympiad (top 20)',
    suggestedLevel: 'national',
  },
  {
    id: 'usapho_qualifier',
    name: 'USA Physics Olympiad Qualifier',
    aliases: ['USAPhO Qualifier', 'USAPhO Semi-finalist'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 400,
    description: 'Qualified for the USA Physics Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Strong physics ability, competitive at national level.',
    relevantMajors: ['physics', 'engineering', 'mathematics'],
    suggestedDescription: 'Qualifier, USA Physics Olympiad (top 400 nationally)',
    suggestedLevel: 'national',
  },
  {
    id: 'usaco_platinum',
    name: 'USACO Platinum Division',
    aliases: ['USA Computing Olympiad Platinum'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 500,
    description: 'Highest division in USA Computing Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite programming skills, highly valued by top CS programs.',
    relevantMajors: ['computer_science', 'software_engineering'],
    suggestedDescription: 'USA Computing Olympiad, Platinum Division (top 500 nationally)',
    suggestedLevel: 'national',
  },
  {
    id: 'usaco_gold',
    name: 'USACO Gold Division',
    aliases: ['USA Computing Olympiad Gold'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 1500,
    description: 'Second-highest division in USA Computing Olympiad',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong programming ability, serious CS student.',
    relevantMajors: ['computer_science', 'software_engineering'],
    suggestedDescription: 'USA Computing Olympiad, Gold Division',
    suggestedLevel: 'national',
  },
  {
    id: 'regeneron_sts_finalist',
    name: 'Regeneron Science Talent Search Finalist',
    aliases: ['STS Finalist', 'Regeneron Finalist', 'Intel STS Finalist'],
    category: 'research_recognition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    annualRecipients: 40,
    annualApplicants: 2000,
    selectionRate: 0.02,
    description: 'Top 40 finalists in the most prestigious pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'One of the strongest research credentials a HS student can have.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Finalist, Regeneron Science Talent Search (top 40 of 2,000)',
    suggestedLevel: 'national',
  },
  {
    id: 'regeneron_sts_scholar',
    name: 'Regeneron Science Talent Search Scholar',
    aliases: ['STS Scholar', 'Regeneron Scholar'],
    category: 'research_recognition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 300,
    annualApplicants: 2000,
    selectionRate: 0.15,
    description: 'Top 300 scholars in the Regeneron Science Talent Search',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Strong research credential, indicates serious scientific work.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Scholar, Regeneron Science Talent Search (top 300 of 2,000)',
    suggestedLevel: 'national',
  },
  {
    id: 'national_merit_finalist',
    name: 'National Merit Finalist',
    aliases: ['NMF', 'National Merit Scholarship Finalist'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 15000,
    annualApplicants: 1600000,
    selectionRate: 0.0094,
    description: 'Top 1% of PSAT test takers nationally',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Confirms strong testing ability, but common among competitive applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Merit Finalist (top 1% of 1.6 million)',
    suggestedLevel: 'national',
  },
  {
    id: 'national_merit_commended',
    name: 'National Merit Commended Scholar',
    aliases: ['Commended Scholar', 'National Merit Commended'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'competitive',
    annualRecipients: 34000,
    description: 'Top 3-4% of PSAT test takers',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Shows strong testing, but very common at T20 schools.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Merit Commended Scholar (top 3%)',
    suggestedLevel: 'national',
  },
  {
    id: 'ap_scholar_distinction',
    name: 'AP Scholar with Distinction',
    aliases: ['AP Scholar Distinction'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'merit_based',
    description: 'Average score of 3.5+ on 5+ AP exams with 3+ on all',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Baseline expectation for competitive applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'AP Scholar with Distinction',
    suggestedLevel: 'national',
  },
  {
    id: 'scholastic_gold_key',
    name: 'Scholastic Art & Writing Awards Gold Key',
    aliases: ['Scholastic Gold Key', 'Gold Key Award'],
    category: 'arts_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 2500,
    description: 'National-level recognition in art or writing',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong creative achievement, especially for humanities applicants.',
    relevantMajors: ['english', 'creative_writing', 'art', 'journalism'],
    suggestedDescription: 'Gold Key, Scholastic Art & Writing Awards',
    suggestedLevel: 'national',
  },
  {
    id: 'debate_toc_qualifier',
    name: 'Tournament of Champions Qualifier',
    aliases: ['TOC Qualifier', 'TOC Bid'],
    category: 'debate_speech',
    recognitionLevel: 'national',
    selectivity: 'selective',
    description: 'Qualified for the Tournament of Champions in debate',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong debate credential, shows intellectual rigor.',
    relevantMajors: ['political_science', 'law', 'philosophy'],
    suggestedDescription: 'Tournament of Champions Qualifier, [Event]',
    suggestedLevel: 'national',
  },
  {
    id: 'model_un_best_delegate',
    name: 'Model UN Best Delegate at Major Conference',
    aliases: ['Best Delegate', 'NAIMUN Best Delegate', 'HMUN Best Delegate'],
    category: 'debate_speech',
    recognitionLevel: 'national',
    selectivity: 'selective',
    description: 'Top award at major Model UN conference',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Shows leadership and diplomatic skills.',
    relevantMajors: ['international_relations', 'political_science'],
    suggestedDescription: 'Best Delegate, [Conference Name]',
    suggestedLevel: 'national',
  },
  {
    id: 'science_bowl_nationals',
    name: 'Science Bowl National Competition',
    aliases: ['Science Bowl Nationals', 'DOE Science Bowl'],
    category: 'academic_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    description: 'Competed at National Science Bowl',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong STEM knowledge, team competition experience.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: 'National Science Bowl Competitor',
    suggestedLevel: 'national',
  },
  {
    id: 'science_olympiad_nationals',
    name: 'Science Olympiad National Medalist',
    aliases: ['SciOly Nationals', 'Science Olympiad National'],
    category: 'academic_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    description: 'Medalist at National Science Olympiad',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong science background, competitive achievement.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: '[Medal] Medal, National Science Olympiad ([Event])',
    suggestedLevel: 'national',
  },
  {
    id: 'fbla_nationals_winner',
    name: 'FBLA National Winner',
    aliases: ['Future Business Leaders of America National Winner'],
    category: 'entrepreneurship',
    recognitionLevel: 'national',
    selectivity: 'selective',
    description: 'First place at FBLA National Leadership Conference',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong business acumen and competition success.',
    relevantMajors: ['business', 'economics', 'entrepreneurship'],
    suggestedDescription: '1st Place, FBLA National Leadership Conference ([Event])',
    suggestedLevel: 'national',
  },
  {
    id: 'rsi_attendee',
    name: 'Research Science Institute Attendee',
    aliases: ['RSI', 'RSI Participant'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    annualRecipients: 80,
    annualApplicants: 4000,
    selectionRate: 0.02,
    description: 'Selected for MIT\'s Research Science Institute',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'One of the most selective summer programs. Strong admissions boost.',
    relevantMajors: ['sciences', 'engineering', 'mathematics'],
    suggestedDescription: 'Research Science Institute Scholar (2% acceptance)',
    suggestedLevel: 'national',
  },
  {
    id: 'mostec_attendee',
    name: 'MOSTEC Attendee',
    aliases: ['MOSTEC', 'MIT Online Science, Technology, and Engineering Community'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 150,
    description: 'Selected for MIT\'s MOSTEC program',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Selective program, demonstrates STEM interest.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: 'MIT MOSTEC Scholar',
    suggestedLevel: 'national',
  },
  {
    id: 'clark_scholar',
    name: 'Clark Scholar',
    aliases: ['Texas Tech Clark Scholars'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'selective',
    annualRecipients: 12,
    description: 'Selected for the Clark Scholars Program',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Highly selective research program.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: 'Clark Scholar, Texas Tech University',
    suggestedLevel: 'national',
  },

  // ========== STATE AWARDS ==========
  {
    id: 'all_state_music',
    name: 'All-State Music Selection',
    aliases: ['All-State Band', 'All-State Orchestra', 'All-State Choir'],
    category: 'arts_competition',
    recognitionLevel: 'state',
    selectivity: 'selective',
    description: 'Selected for state all-state music ensemble',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong musical achievement, dedication demonstrated.',
    relevantMajors: ['music', 'performing_arts'],
    suggestedDescription: 'All-State [Ensemble], [State]',
    suggestedLevel: 'state_regional',
  },
  {
    id: 'all_state_athletic',
    name: 'All-State Athletic Selection',
    aliases: ['All-State Football', 'All-State Basketball', 'All-State Soccer'],
    category: 'athletic',
    recognitionLevel: 'state',
    selectivity: 'selective',
    description: 'Selected as all-state athlete',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong athletic achievement.',
    relevantMajors: ['all'],
    suggestedDescription: 'All-State, [Sport] ([State])',
    suggestedLevel: 'state_regional',
  },
  {
    id: 'state_science_fair_winner',
    name: 'State Science Fair Winner',
    aliases: ['State Fair First Place', 'State Science Competition Winner'],
    category: 'science_fair',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    description: 'First place at state-level science fair',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Good research experience at state level.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: '1st Place, [State] Science & Engineering Fair',
    suggestedLevel: 'state_regional',
  },
  {
    id: 'governors_school',
    name: "Governor's School Selection",
    aliases: ["Governor's School", "Governor's Honors"],
    category: 'summer_program_selection',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    description: "Selected for state Governor's School program",
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'State-level academic recognition.',
    relevantMajors: ['all'],
    suggestedDescription: "[State] Governor's School in [Subject]",
    suggestedLevel: 'state_regional',
  },
  {
    id: 'state_debate_champion',
    name: 'State Debate Champion',
    aliases: ['State LD Champion', 'State Policy Champion', 'State PF Champion'],
    category: 'debate_speech',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    description: 'State champion in debate event',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong speaking and analytical skills.',
    relevantMajors: ['political_science', 'law', 'philosophy'],
    suggestedDescription: 'State Champion, [Event] ([State])',
    suggestedLevel: 'state_regional',
  },
  {
    id: 'science_olympiad_state',
    name: 'Science Olympiad State Medalist',
    aliases: ['SciOly State'],
    category: 'academic_competition',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    description: 'Medalist at state Science Olympiad',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Good science foundation.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: '[Medal] Medal, [State] Science Olympiad ([Event])',
    suggestedLevel: 'state_regional',
  },

  // ========== SCHOOL-LEVEL AWARDS ==========
  {
    id: 'valedictorian',
    name: 'Valedictorian',
    aliases: ['Class Valedictorian', '#1 in Class'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'highly_selective',
    description: 'Top academic rank in graduating class',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Academic excellence within school context. Impact varies by school competitiveness.',
    relevantMajors: ['all'],
    suggestedDescription: 'Valedictorian, [School Name]',
    suggestedLevel: 'school',
  },
  {
    id: 'salutatorian',
    name: 'Salutatorian',
    aliases: ['Class Salutatorian', '#2 in Class'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'highly_selective',
    description: 'Second-highest academic rank in graduating class',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong academics. Impact varies by school.',
    relevantMajors: ['all'],
    suggestedDescription: 'Salutatorian, [School Name]',
    suggestedLevel: 'school',
  },
  {
    id: 'subject_award',
    name: 'Departmental Subject Award',
    aliases: ['Math Award', 'Science Award', 'English Award'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'selective',
    description: 'Top student in subject area',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Shows strength in specific area.',
    relevantMajors: ['varies'],
    suggestedDescription: '[Subject] Department Award, [School Name]',
    suggestedLevel: 'school',
  },
  {
    id: 'honor_roll',
    name: 'Honor Roll',
    aliases: ['High Honor Roll', "Principal's List", "Dean's List"],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'merit_based',
    description: 'Academic honor roll recognition',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Baseline academic expectation, not distinctive.',
    relevantMajors: ['all'],
    suggestedDescription: 'Honor Roll (all semesters)',
    suggestedLevel: 'school',
  },
  {
    id: 'nhs',
    name: 'National Honor Society',
    aliases: ['NHS', 'National Honor Society Member'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'merit_based',
    description: 'National Honor Society membership',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Common award, expected for strong students.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Honor Society',
    suggestedLevel: 'school',
  },
  {
    id: 'team_captain',
    name: 'Team Captain',
    aliases: ['Captain', 'Varsity Captain'],
    category: 'leadership',
    recognitionLevel: 'school',
    selectivity: 'selective',
    description: 'Selected as team captain',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Leadership role, common but valued.',
    relevantMajors: ['all'],
    suggestedDescription: 'Captain, [Team/Activity]',
    suggestedLevel: 'school',
  },
  {
    id: 'mvp',
    name: 'MVP Award',
    aliases: ['Most Valuable Player', 'Player of the Year'],
    category: 'athletic',
    recognitionLevel: 'school',
    selectivity: 'selective',
    description: 'Most valuable player recognition',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Athletic achievement at school level.',
    relevantMajors: ['all'],
    suggestedDescription: 'MVP, [Sport]',
    suggestedLevel: 'school',
  },
];

// ============================================================================
// CATEGORY RELEVANCE MAPPING
// ============================================================================

const CATEGORY_RELEVANCE_MAP: Record<string, AwardCategory[]> = {
  mathematics: ['academic_olympiad', 'academic_competition', 'research_recognition'],
  physics: ['academic_olympiad', 'academic_competition', 'research_recognition', 'science_fair'],
  chemistry: ['academic_olympiad', 'research_recognition', 'science_fair'],
  biology: ['academic_olympiad', 'research_recognition', 'science_fair'],
  computer_science: ['academic_olympiad', 'stem_competition', 'research_recognition'],
  engineering: ['academic_olympiad', 'stem_competition', 'science_fair', 'research_recognition'],
  pre_med: ['academic_olympiad', 'research_recognition', 'science_fair', 'community_service'],
  english: ['arts_competition', 'journalism_writing', 'debate_speech'],
  creative_writing: ['arts_competition', 'journalism_writing'],
  political_science: ['debate_speech', 'leadership'],
  international_relations: ['debate_speech', 'leadership'],
  business: ['entrepreneurship', 'leadership'],
  economics: ['academic_competition', 'entrepreneurship'],
  music: ['arts_competition'],
  art: ['arts_competition'],
  general: ['academic_honor', 'leadership', 'community_service'],
};

// ============================================================================
// SELECTIVITY SCORING
// ============================================================================

const SELECTIVITY_SCORES: Record<AwardSelectivity, number> = {
  highly_selective: 95,
  selective: 75,
  competitive: 55,
  merit_based: 35,
  participation: 15,
};

const RECOGNITION_LEVEL_SCORES: Record<AwardRecognitionLevel, number> = {
  international: 100,
  national: 85,
  regional: 65,
  state: 55,
  district: 40,
  school: 25,
  local: 20,
};

// ============================================================================
// AWARD EVALUATOR CLASS
// ============================================================================

export class AwardEvaluator {
  private knownAwards: Map<string, KnownAwardProfile>;
  private awardAliasIndex: Map<string, string>; // alias -> award ID

  constructor() {
    // Build lookup indices
    this.knownAwards = new Map();
    this.awardAliasIndex = new Map();

    for (const award of KNOWN_AWARDS) {
      this.knownAwards.set(award.id, award);
      this.awardAliasIndex.set(award.name.toLowerCase(), award.id);
      for (const alias of award.aliases) {
        this.awardAliasIndex.set(alias.toLowerCase(), award.id);
      }
    }
  }

  /**
   * Evaluate complete awards portfolio
   */
  async evaluate(
    input: AwardsInputData,
    targetSchools?: string[]
  ): Promise<AwardEvaluation> {
    // Check cache first
    const { key, hash } = generateHashedCacheKey('awards', 'evaluation', { input, targetSchools });
    const cached = awardEvaluationCache.get(key);
    if (cached) {
      return cached as AwardEvaluation;
    }

    // Validate input
    const validation = validateAwards(input);
    if (!validation.valid) {
      console.warn('[AwardEvaluator] Validation warnings:', validation.warnings);
    }

    // Collect all awards
    const allAwards = this.collectAllAwards(input);

    // Assess each award individually
    const awardAssessments: Record<string, AwardAssessment> = {};
    for (const award of allAwards) {
      awardAssessments[award.id] = this.assessAward(award, input.intendedMajor);
    }

    // Analyze distribution
    const distribution = this.analyzeDistribution(Object.values(awardAssessments));

    // Identify highlights
    const highlights = this.identifyHighlights(Object.values(awardAssessments));

    // Optimize for Common App
    const commonAppOptimization = this.optimizeForCommonApp(Object.values(awardAssessments));

    // Analyze competitive context
    const competitiveContext = this.analyzeCompetitiveContext(
      Object.values(awardAssessments),
      targetSchools
    );

    // Gap analysis
    const gapAnalysis = this.analyzeGaps(
      Object.values(awardAssessments),
      input.intendedMajor
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(awardAssessments, distribution);

    // Generate narrative
    const awardsNarrative = this.generateNarrative(
      Object.values(awardAssessments),
      distribution,
      highlights,
      input.intendedMajor
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      Object.values(awardAssessments),
      distribution,
      gapAnalysis,
      input.intendedMajor
    );

    // Find activity connections
    const activityConnections = this.findActivityConnections(allAwards);

    // Determine overall strength
    const overallStrength = this.determineOverallStrength(overallScore, distribution);

    // Build evaluation result
    const evaluation: AwardEvaluation = {
      evaluatedAt: new Date().toISOString(),
      version: '1.0.0',
      overallScore,
      overallStrength,
      overallNarrative: this.generateOverallNarrative(overallStrength, distribution, highlights),
      distribution,
      awardAssessments,
      highlights,
      commonAppOptimization,
      competitiveContext,
      gapAnalysis,
      awardsNarrative,
      activityConnections,
      recommendations,
      inputDataHash: hash,
      confidenceScore: this.calculateConfidenceScore(allAwards, awardAssessments),
    };

    // Cache result
    awardEvaluationCache.set(key, evaluation, hash);

    return evaluation;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Collect all awards into a single list
   */
  private collectAllAwards(input: AwardsInputData): AwardInputData[] {
    return [
      ...input.academicHonors,
      ...input.formalRecognition,
      ...input.competitionResults,
      ...(input.publications || []),
    ];
  }

  /**
   * Assess individual award
   */
  private assessAward(award: AwardInputData, intendedMajor?: string): AwardAssessment {
    // Try to match against known awards
    const knownProfile = this.findKnownAward(award.name);

    // Determine selectivity
    const selectivity = knownProfile?.selectivity || this.inferSelectivity(award);
    const selectivityScore = this.calculateSelectivityScore(award, knownProfile);

    // Determine relevance to major
    const { relevance, explanation } = this.assessRelevanceToMajor(
      award,
      intendedMajor,
      knownProfile
    );

    // Assess narrative value
    const narrativeValue = this.assessNarrativeValue(award, knownProfile);

    // Optimize for Common App
    const commonAppOptimization = this.optimizeAwardForCommonApp(award, knownProfile);

    // Determine competitive context
    const competitiveContext = this.getCompetitiveContext(award, knownProfile);

    // Determine admissions impact
    const admissionsImpact = knownProfile?.admissionsImpact || this.inferAdmissionsImpact(award);

    return {
      awardId: award.id,
      awardName: award.name,
      category: award.category,
      recognitionLevel: award.recognitionLevel,
      selectivity,
      selectivityScore,
      relevanceToMajor: relevance,
      relevanceExplanation: explanation,
      narrativeValue,
      commonAppOptimization,
      competitiveContext,
      admissionsImpact,
    };
  }

  /**
   * Find known award profile by name
   */
  private findKnownAward(name: string): KnownAwardProfile | undefined {
    const normalizedName = name.toLowerCase();

    // Direct ID lookup
    if (this.knownAwards.has(normalizedName)) {
      return this.knownAwards.get(normalizedName);
    }

    // Alias lookup
    const awardId = this.awardAliasIndex.get(normalizedName);
    if (awardId) {
      return this.knownAwards.get(awardId);
    }

    // Fuzzy matching for partial matches
    for (const [alias, id] of this.awardAliasIndex) {
      if (normalizedName.includes(alias) || alias.includes(normalizedName)) {
        return this.knownAwards.get(id);
      }
    }

    return undefined;
  }

  /**
   * Infer selectivity when no known profile exists
   */
  private inferSelectivity(award: AwardInputData): AwardSelectivity {
    // Parse selectivity info if provided
    if (award.selectivityInfo) {
      const match = award.selectivityInfo.match(/(\d+)\s*(of|out of|\/)\s*(\d+)/i);
      if (match) {
        const selected = parseInt(match[1]);
        const total = parseInt(match[3]);
        const rate = selected / total;

        if (rate < 0.01) return 'highly_selective';
        if (rate < 0.05) return 'selective';
        if (rate < 0.15) return 'competitive';
        return 'merit_based';
      }
    }

    // Infer from recognition level
    switch (award.recognitionLevel) {
      case 'international':
        return 'highly_selective';
      case 'national':
        return 'selective';
      case 'regional':
      case 'state':
        return 'competitive';
      case 'district':
      case 'school':
        return 'merit_based';
      default:
        return 'participation';
    }
  }

  /**
   * Calculate selectivity score (0-100)
   */
  private calculateSelectivityScore(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): number {
    const baseScore = RECOGNITION_LEVEL_SCORES[award.recognitionLevel];
    const selectivityBonus = knownProfile
      ? SELECTIVITY_SCORES[knownProfile.selectivity]
      : SELECTIVITY_SCORES[this.inferSelectivity(award)];

    // Weight: 60% recognition level, 40% selectivity
    const score = baseScore * 0.6 + selectivityBonus * 0.4;

    // Bonus for known awards (verified prestige)
    const knownBonus = knownProfile ? 5 : 0;

    return Math.min(100, Math.round(score + knownBonus));
  }

  /**
   * Assess relevance to intended major
   */
  private assessRelevanceToMajor(
    award: AwardInputData,
    intendedMajor?: string,
    knownProfile?: KnownAwardProfile
  ): { relevance: 'high' | 'medium' | 'low' | 'not_applicable'; explanation: string } {
    if (!intendedMajor) {
      return {
        relevance: 'not_applicable',
        explanation: 'No intended major specified for relevance assessment.',
      };
    }

    const normalizedMajor = intendedMajor.toLowerCase().replace(/[^a-z]/g, '_');

    // Check known profile relevance
    if (knownProfile?.relevantMajors) {
      const isRelevant = knownProfile.relevantMajors.some(
        (m) => m === 'all' || normalizedMajor.includes(m) || m.includes(normalizedMajor)
      );
      if (isRelevant) {
        return {
          relevance: 'high',
          explanation: `Directly relevant to ${intendedMajor}: ${knownProfile.howAdmissionsViewIt}`,
        };
      }
    }

    // Check category relevance
    const relevantCategories = CATEGORY_RELEVANCE_MAP[normalizedMajor] ||
                               CATEGORY_RELEVANCE_MAP['general'];

    if (relevantCategories.includes(award.category)) {
      return {
        relevance: 'medium',
        explanation: `${award.category.replace(/_/g, ' ')} awards are generally valued for ${intendedMajor} applicants.`,
      };
    }

    // Check if academic and academic major
    if (award.isAcademic && this.isAcademicMajor(normalizedMajor)) {
      return {
        relevance: 'medium',
        explanation: 'Academic achievement demonstrates intellectual capability for rigorous programs.',
      };
    }

    return {
      relevance: 'low',
      explanation: `This award shows well-roundedness but isn't directly tied to ${intendedMajor}.`,
    };
  }

  /**
   * Check if major is academic/STEM focused
   */
  private isAcademicMajor(major: string): boolean {
    const academicMajors = [
      'mathematics', 'physics', 'chemistry', 'biology', 'computer_science',
      'engineering', 'economics', 'pre_med', 'neuroscience', 'statistics',
    ];
    return academicMajors.some((m) => major.includes(m) || m.includes(major));
  }

  /**
   * Assess narrative value of award
   */
  private assessNarrativeValue(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): AwardAssessment['narrativeValue'] {
    // Assess storytelling potential
    const storytellingPotential = this.assessStorytellingPotential(award);

    // Assess uniqueness
    const uniqueness = this.assessUniqueness(award, knownProfile);

    // Generate proof point
    const proofPoint = this.generateProofPoint(award, knownProfile);

    return {
      storytellingPotential,
      uniqueness,
      proofPoint,
    };
  }

  /**
   * Assess storytelling potential
   */
  private assessStorytellingPotential(award: AwardInputData): 'high' | 'medium' | 'low' {
    // Awards with descriptions have higher narrative potential
    if (award.description && award.description.length > 50) {
      return 'high';
    }

    // Competition results often have good stories
    if (['science_fair', 'research_recognition', 'entrepreneurship'].includes(award.category)) {
      return 'high';
    }

    // Standardized awards have low storytelling value
    if (['standardized_test', 'academic_honor'].includes(award.category)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Assess uniqueness of award
   */
  private assessUniqueness(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): 'very_unique' | 'somewhat_unique' | 'common' {
    // International awards are rare
    if (award.recognitionLevel === 'international') {
      return 'very_unique';
    }

    // Check if it's a common award
    const commonAwards = ['national_merit_finalist', 'national_merit_commended', 'ap_scholar_distinction',
                          'nhs', 'honor_roll', 'subject_award'];
    if (knownProfile && commonAwards.includes(knownProfile.id)) {
      return 'common';
    }

    // National competitive awards are somewhat unique
    if (award.recognitionLevel === 'national' &&
        ['academic_olympiad', 'research_recognition', 'science_fair'].includes(award.category)) {
      return 'very_unique';
    }

    // School-level awards are common
    if (['school', 'local', 'district'].includes(award.recognitionLevel)) {
      return 'common';
    }

    return 'somewhat_unique';
  }

  /**
   * Generate proof point for award
   */
  private generateProofPoint(award: AwardInputData, knownProfile?: KnownAwardProfile): string {
    if (knownProfile?.howAdmissionsViewIt) {
      return knownProfile.howAdmissionsViewIt;
    }

    // Generate based on category and level
    const categoryProofs: Record<AwardCategory, string> = {
      academic_olympiad: 'Exceptional subject mastery and competitive excellence',
      academic_competition: 'Deep knowledge and ability to perform under pressure',
      science_fair: 'Original research ability and scientific thinking',
      research_recognition: 'Advanced research skills beyond typical HS level',
      standardized_test: 'Strong baseline academic aptitude',
      academic_honor: 'Consistent academic performance',
      scholarship: 'External validation of merit',
      arts_competition: 'Creative excellence and artistic dedication',
      athletic: 'Discipline, teamwork, and physical excellence',
      leadership: 'Ability to inspire and guide others',
      community_service: 'Commitment to making a difference',
      entrepreneurship: 'Initiative and business acumen',
      debate_speech: 'Persuasive communication and analytical thinking',
      journalism_writing: 'Strong writing ability and journalistic instincts',
      stem_competition: 'Technical skills and problem-solving ability',
      summer_program_selection: 'Selection by competitive program validates ability',
      other: 'Distinctive achievement',
    };

    return categoryProofs[award.category] || 'Demonstrates achievement in area of focus';
  }

  /**
   * Optimize award for Common App display
   */
  private optimizeAwardForCommonApp(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): AwardAssessment['commonAppOptimization'] {
    // Determine suggested level
    const suggestedLevel = this.determineSuggestedLevel(award, knownProfile);

    // Generate optimized description (max 100 chars)
    const optimizedDescription = this.generateOptimizedDescription(award, knownProfile);

    // Determine if should include
    const shouldInclude = this.shouldIncludeInCommonApp(award);

    // Calculate priority rank (1 = highest)
    const priorityRank = this.calculatePriorityRank(award, knownProfile);

    return {
      suggestedLevel,
      optimizedDescription,
      shouldInclude,
      priorityRank,
      alternativeDescription: this.generateAlternativeDescription(award),
    };
  }

  /**
   * Determine Common App level for award
   */
  private determineSuggestedLevel(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): CommonAppHonorLevel {
    if (knownProfile?.suggestedLevel) {
      return knownProfile.suggestedLevel;
    }

    switch (award.recognitionLevel) {
      case 'international':
        return 'international';
      case 'national':
        return 'national';
      case 'regional':
      case 'state':
        return 'state_regional';
      default:
        return 'school';
    }
  }

  /**
   * Generate optimized description for Common App (max 100 chars)
   */
  private generateOptimizedDescription(
    award: AwardInputData,
    knownProfile?: KnownAwardProfile
  ): string {
    // Use known profile suggestion if available
    if (knownProfile?.suggestedDescription) {
      let desc = knownProfile.suggestedDescription;
      // Replace placeholders
      desc = desc.replace(/\[([^\]]+)\]/g, (_, placeholder) => {
        if (placeholder.toLowerCase().includes('metal') || placeholder.toLowerCase().includes('medal')) {
          return 'Gold'; // Default to gold if unspecified
        }
        return placeholder;
      });
      return this.truncateToLimit(desc, 100);
    }

    // Generate based on award data
    let desc = award.name;

    // Add context for selectivity
    if (award.selectivityInfo) {
      const match = award.selectivityInfo.match(/top\s*(\d+%?)/i) ||
                    award.selectivityInfo.match(/(\d+)\s*(of|out of)\s*(\d+)/i);
      if (match) {
        desc += ` (${match[0]})`;
      }
    }

    // Add organization if space permits
    if (award.organization && desc.length + award.organization.length + 3 <= 100) {
      desc = `${desc}, ${award.organization}`;
    }

    return this.truncateToLimit(desc, 100);
  }

  /**
   * Generate alternative description
   */
  private generateAlternativeDescription(award: AwardInputData): string {
    // Focus on impact/significance rather than just name
    const alternatives: Record<AwardCategory, string> = {
      academic_olympiad: `Competitive ${award.recognitionLevel}-level academic achievement`,
      academic_competition: `${award.recognitionLevel.charAt(0).toUpperCase() + award.recognitionLevel.slice(1)} academic competition recognition`,
      science_fair: `Independent research recognized at ${award.recognitionLevel} level`,
      research_recognition: `Research achievement with external validation`,
      standardized_test: `Top scorer recognition`,
      academic_honor: `Academic excellence award`,
      scholarship: `Merit scholarship recipient`,
      arts_competition: `Creative arts recognition`,
      athletic: `Athletic achievement`,
      leadership: `Leadership recognition`,
      community_service: `Service impact award`,
      entrepreneurship: `Business/entrepreneurship achievement`,
      debate_speech: `Competitive speaking recognition`,
      journalism_writing: `Writing excellence award`,
      stem_competition: `STEM competition achievement`,
      summer_program_selection: `Selective program admission`,
      other: `Special recognition`,
    };

    return this.truncateToLimit(alternatives[award.category] || award.name, 100);
  }

  /**
   * Truncate string to character limit
   */
  private truncateToLimit(str: string, limit: number): string {
    if (str.length <= limit) return str;
    return str.substring(0, limit - 3) + '...';
  }

  /**
   * Determine if award should be included in Common App
   */
  private shouldIncludeInCommonApp(award: AwardInputData): boolean {
    // Always include high-level awards
    if (['international', 'national'].includes(award.recognitionLevel)) {
      return true;
    }

    // Include regional/state if competitive
    if (['regional', 'state'].includes(award.recognitionLevel)) {
      return true;
    }

    // Include school-level only if very selective (valedictorian, etc.)
    if (award.recognitionLevel === 'school') {
      // These are worth including
      const worthwhileSchoolAwards = ['valedictorian', 'salutatorian'];
      const normalizedName = award.name.toLowerCase();
      return worthwhileSchoolAwards.some(a => normalizedName.includes(a));
    }

    // Exclude participation awards
    if (award.description?.toLowerCase().includes('participation')) {
      return false;
    }

    return true;
  }

  /**
   * Calculate priority rank for Common App ordering
   */
  private calculatePriorityRank(award: AwardInputData, knownProfile?: KnownAwardProfile): number {
    // Lower number = higher priority
    const levelPriority: Record<AwardRecognitionLevel, number> = {
      international: 1,
      national: 2,
      regional: 4,
      state: 3,
      district: 5,
      school: 6,
      local: 7,
    };

    let priority = levelPriority[award.recognitionLevel];

    // Adjust for selectivity
    if (knownProfile) {
      switch (knownProfile.selectivity) {
        case 'highly_selective':
          priority -= 0.5;
          break;
        case 'selective':
          priority -= 0.25;
          break;
      }
    }

    // Adjust for admissions impact
    if (knownProfile?.admissionsImpact === 'major') {
      priority -= 0.5;
    }

    return Math.max(1, Math.round(priority * 10) / 10);
  }

  /**
   * Get competitive context for award
   */
  private getCompetitiveContext(award: AwardInputData, knownProfile?: KnownAwardProfile): string {
    if (knownProfile?.howAdmissionsViewIt) {
      return knownProfile.howAdmissionsViewIt;
    }

    // Generate context based on level and category
    const contexts: Record<AwardRecognitionLevel, string> = {
      international: 'One of the most impressive achievements a high school student can earn. This level of recognition is extremely rare among college applicants.',
      national: 'Strong credential that distinguishes the applicant. Many competitive applicants have national-level recognition, but it remains impressive.',
      regional: 'Solid achievement that shows ability to compete beyond the school level. Good supporting credential.',
      state: 'Demonstrates state-level competitiveness. Common among strong applicants but still valuable.',
      district: 'Shows local achievement. Useful context but should be paired with higher-level accomplishments.',
      school: 'School recognition is expected baseline for competitive applicants. Not distinctive on its own.',
      local: 'Community involvement is good, but local awards have limited admissions impact.',
    };

    return contexts[award.recognitionLevel];
  }

  /**
   * Infer admissions impact when no known profile
   */
  private inferAdmissionsImpact(award: AwardInputData): 'major' | 'moderate' | 'minor' {
    if (['international', 'national'].includes(award.recognitionLevel)) {
      if (['academic_olympiad', 'research_recognition', 'science_fair'].includes(award.category)) {
        return 'major';
      }
      return 'moderate';
    }

    if (['regional', 'state'].includes(award.recognitionLevel)) {
      return 'moderate';
    }

    return 'minor';
  }

  /**
   * Analyze distribution of awards across levels
   */
  private analyzeDistribution(assessments: AwardAssessment[]): AwardDistributionAnalysis {
    const distribution: AwardDistributionAnalysis['distribution'] = {
      international: [],
      national: [],
      regional: [],
      state: [],
      district: [],
      school: [],
      local: [],
    };

    // Distribute awards
    for (const assessment of assessments) {
      distribution[assessment.recognitionLevel].push(assessment);
    }

    // Calculate summary
    const tier1Awards = distribution.international.length + distribution.national.length;
    const tier2Awards = distribution.regional.length + distribution.state.length;
    const tier3Awards = distribution.district.length + distribution.school.length + distribution.local.length;

    const academicCount = assessments.filter(a =>
      ['academic_olympiad', 'academic_competition', 'research_recognition',
       'science_fair', 'standardized_test', 'academic_honor'].includes(a.category)
    ).length;

    // Determine distribution strength
    const distributionStrength = this.assessDistributionStrength(tier1Awards, tier2Awards, tier3Awards);
    const distributionAssessment = this.generateDistributionAssessment(
      tier1Awards, tier2Awards, tier3Awards, assessments.length
    );

    return {
      distribution,
      summary: {
        totalAwards: assessments.length,
        tier1Awards,
        tier2Awards,
        tier3Awards,
        academicCount,
        nonAcademicCount: assessments.length - academicCount,
      },
      distributionAssessment,
      distributionStrength,
    };
  }

  /**
   * Assess distribution strength
   */
  private assessDistributionStrength(
    tier1: number,
    tier2: number,
    tier3: number
  ): AwardDistributionAnalysis['distributionStrength'] {
    // Exceptional: Multiple international/national
    if (tier1 >= 3) return 'exceptional';

    // Strong: At least one T1 and good T2 coverage
    if (tier1 >= 1 && tier2 >= 2) return 'strong';

    // Good: No T1 but strong T2, or single T1
    if (tier1 >= 1 || tier2 >= 4) return 'good';

    // Average: Mostly T2 and T3
    if (tier2 >= 2 || tier3 >= 3) return 'average';

    return 'weak';
  }

  /**
   * Generate distribution assessment text
   */
  private generateDistributionAssessment(
    tier1: number,
    tier2: number,
    tier3: number,
    total: number
  ): string {
    if (tier1 >= 3) {
      return 'Exceptional awards profile with multiple international/national recognitions. This is rare among even the most competitive applicants.';
    }

    if (tier1 >= 1 && tier2 >= 2) {
      return 'Strong awards profile with high-level recognition supported by solid state/regional achievements. Well-positioned for competitive admissions.';
    }

    if (tier1 >= 1) {
      return `Good foundation with ${tier1} national/international award(s). Consider pursuing more state/regional recognition to strengthen depth.`;
    }

    if (tier2 >= 4) {
      return 'Good breadth of state/regional achievements. A national-level award would significantly strengthen the profile.';
    }

    if (tier2 >= 2) {
      return 'Developing awards profile with some regional recognition. Focus on converting achievements to higher-level competitions.';
    }

    if (total <= 2) {
      return 'Limited awards currently. Focus on pursuing competitive opportunities that match your interests and abilities.';
    }

    return 'Awards are primarily school-level. Prioritize pursuing external competitions and recognitions to strengthen competitive standing.';
  }

  /**
   * Identify highlight awards
   */
  private identifyHighlights(assessments: AwardAssessment[]): AwardHighlightsAnalysis {
    if (assessments.length === 0) {
      const placeholder: AwardAssessment = {
        awardId: 'none',
        awardName: 'No awards provided',
        category: 'other',
        recognitionLevel: 'local',
        selectivity: 'participation',
        selectivityScore: 0,
        relevanceToMajor: 'not_applicable',
        relevanceExplanation: 'No awards to assess',
        narrativeValue: {
          storytellingPotential: 'low',
          uniqueness: 'common',
          proofPoint: 'N/A',
        },
        commonAppOptimization: {
          suggestedLevel: 'school',
          optimizedDescription: 'N/A',
          shouldInclude: false,
          priorityRank: 99,
        },
        competitiveContext: 'No awards to assess',
        admissionsImpact: 'minor',
      };

      return {
        mostImpressive: { award: placeholder, whyImpressive: 'No awards provided for assessment.' },
        mostRelevantToGoals: { award: placeholder, relevanceExplanation: 'No awards provided.' },
        bestStory: { award: placeholder, storyPotential: 'No awards provided.' },
        mostUnique: { award: placeholder, uniquenessExplanation: 'No awards provided.' },
      };
    }

    // Sort by selectivity score for most impressive
    const sortedByScore = [...assessments].sort((a, b) => b.selectivityScore - a.selectivityScore);
    const mostImpressive = sortedByScore[0];

    // Find most relevant to goals
    const relevantAwards = assessments.filter(a => a.relevanceToMajor === 'high');
    const mostRelevant = relevantAwards.length > 0
      ? relevantAwards.reduce((best, curr) =>
          curr.selectivityScore > best.selectivityScore ? curr : best)
      : sortedByScore[0];

    // Find best story potential
    const storyAwards = assessments.filter(a => a.narrativeValue.storytellingPotential === 'high');
    const bestStory = storyAwards.length > 0
      ? storyAwards.reduce((best, curr) =>
          curr.selectivityScore > best.selectivityScore ? curr : best)
      : sortedByScore[0];

    // Find most unique
    const uniqueAwards = assessments.filter(a => a.narrativeValue.uniqueness === 'very_unique');
    const mostUnique = uniqueAwards.length > 0
      ? uniqueAwards[0]
      : assessments.find(a => a.narrativeValue.uniqueness === 'somewhat_unique') || sortedByScore[0];

    return {
      mostImpressive: {
        award: mostImpressive,
        whyImpressive: `${mostImpressive.recognitionLevel} recognition with ${mostImpressive.selectivity.replace('_', ' ')} selectivity. ${mostImpressive.competitiveContext}`,
      },
      mostRelevantToGoals: {
        award: mostRelevant,
        relevanceExplanation: mostRelevant.relevanceExplanation,
      },
      bestStory: {
        award: bestStory,
        storyPotential: `This ${bestStory.category.replace(/_/g, ' ')} award has ${bestStory.narrativeValue.storytellingPotential} storytelling potential. ${bestStory.narrativeValue.proofPoint}`,
      },
      mostUnique: {
        award: mostUnique,
        uniquenessExplanation: `This award is ${mostUnique.narrativeValue.uniqueness.replace('_', ' ')}. At the ${mostUnique.recognitionLevel} level in ${mostUnique.category.replace(/_/g, ' ')}, it helps differentiate the application.`,
      },
    };
  }

  /**
   * Optimize awards selection for Common App
   */
  private optimizeForCommonApp(assessments: AwardAssessment[]): CommonAppHonorsOptimization {
    // Filter to includable awards
    const includable = assessments.filter(a => a.commonAppOptimization.shouldInclude);

    // Sort by priority rank
    const sorted = [...includable].sort(
      (a, b) => a.commonAppOptimization.priorityRank - b.commonAppOptimization.priorityRank
    );

    // Select top 5
    const top5 = sorted.slice(0, 5);

    // Calculate level distribution
    const levelDistribution: Record<CommonAppHonorLevel, number> = {
      international: 0,
      national: 0,
      state_regional: 0,
      school: 0,
    };

    for (const award of top5) {
      levelDistribution[award.commonAppOptimization.suggestedLevel]++;
    }

    // Generate alternatives
    const alternatives = this.generateAlternativeConfigurations(sorted, top5);

    // Identify exclusions
    const exclusions = assessments
      .filter(a => !a.commonAppOptimization.shouldInclude)
      .map(a => ({
        award: a,
        reason: this.getExclusionReason(a),
      }));

    return {
      recommendedTop5: {
        awards: top5,
        reasoning: this.generateTop5Reasoning(top5),
        totalImpact: this.assessTotalImpact(top5),
      },
      alternatives,
      exclusions,
      strategy: {
        balanceApproach: this.determineBalanceApproach(levelDistribution, top5),
        narrativeAlignment: this.assessNarrativeAlignment(top5),
        levelDistribution,
      },
    };
  }

  /**
   * Generate alternative Common App configurations
   */
  private generateAlternativeConfigurations(
    sorted: AwardAssessment[],
    primary: AwardAssessment[]
  ): CommonAppHonorsOptimization['alternatives'] {
    const alternatives: CommonAppHonorsOptimization['alternatives'] = [];

    // If primary is STEM-heavy, suggest balanced alternative
    const stemCategories = ['academic_olympiad', 'academic_competition', 'science_fair',
                           'research_recognition', 'stem_competition'];
    const stemCount = primary.filter(a => stemCategories.includes(a.category)).length;

    if (stemCount >= 4) {
      // Create balanced alternative
      const nonStem = sorted.filter(a => !stemCategories.includes(a.category));
      const stem = sorted.filter(a => stemCategories.includes(a.category));
      const balanced = [...stem.slice(0, 3), ...nonStem.slice(0, 2)];

      if (balanced.length >= 5) {
        alternatives.push({
          configuration: balanced.slice(0, 5),
          useCase: 'When applying to schools that value well-rounded students',
          tradeoffs: 'Sacrifices some STEM credentials for broader appeal',
        });
      }
    }

    // If we have unused high-value awards, suggest alternative
    const unused = sorted.filter(a => !primary.includes(a));
    if (unused.length > 0 && unused[0].selectivityScore >= 70) {
      const alternative = [unused[0], ...primary.slice(0, 4)];
      alternatives.push({
        configuration: alternative,
        useCase: `Consider if ${unused[0].awardName} is more relevant to specific schools`,
        tradeoffs: `Swaps out ${primary[4]?.awardName || 'lowest ranked'} for different emphasis`,
      });
    }

    return alternatives;
  }

  /**
   * Get exclusion reason for award
   */
  private getExclusionReason(award: AwardAssessment): string {
    if (award.recognitionLevel === 'local') {
      return 'Local awards have minimal admissions impact and space is limited.';
    }

    if (award.selectivity === 'participation') {
      return 'Participation awards do not demonstrate competitive achievement.';
    }

    if (award.narrativeValue.uniqueness === 'common' &&
        ['school', 'district'].includes(award.recognitionLevel)) {
      return 'Common school-level awards don\'t differentiate in competitive pools.';
    }

    return 'Lower priority than selected awards; limited Common App space (5 honors).';
  }

  /**
   * Generate reasoning for top 5 selection
   */
  private generateTop5Reasoning(top5: AwardAssessment[]): string {
    if (top5.length === 0) {
      return 'No awards meet the criteria for inclusion.';
    }

    const levels = top5.map(a => a.recognitionLevel);
    const hasInternational = levels.includes('international');
    const hasNational = levels.includes('national');

    if (hasInternational) {
      return `Leading with ${top5.filter(a => a.recognitionLevel === 'international').length} international-level award(s) - the strongest possible positioning. Supported by lower-level awards that demonstrate breadth.`;
    }

    if (hasNational) {
      return `Strong national-level recognition provides credibility. The selection balances prestige with relevance to show both achievement and coherent focus.`;
    }

    return 'Selection prioritizes highest-level achievements while maintaining thematic coherence across the awards list.';
  }

  /**
   * Assess total impact of award selection
   */
  private assessTotalImpact(awards: AwardAssessment[]): string {
    const avgScore = awards.length > 0
      ? awards.reduce((sum, a) => sum + a.selectivityScore, 0) / awards.length
      : 0;

    if (avgScore >= 85) return 'Exceptional - competitive for any school';
    if (avgScore >= 70) return 'Strong - competitive for T20 schools';
    if (avgScore >= 55) return 'Good - competitive for T50 schools';
    if (avgScore >= 40) return 'Developing - supports but doesn\'t carry application';
    return 'Limited - other application components must be very strong';
  }

  /**
   * Determine balance approach
   */
  private determineBalanceApproach(
    distribution: Record<CommonAppHonorLevel, number>,
    awards: AwardAssessment[]
  ): string {
    if (distribution.international >= 2) {
      return 'Lead with exceptional international achievements - let them speak for themselves.';
    }

    if (distribution.national >= 3) {
      return 'Showcase national depth - demonstrates consistent high-level competition success.';
    }

    if (distribution.national >= 1 && distribution.state_regional >= 2) {
      return 'Pyramid approach: national credentials at top, supported by regional validation.';
    }

    return 'Build credibility through breadth of regional/state achievements.';
  }

  /**
   * Assess narrative alignment
   */
  private assessNarrativeAlignment(awards: AwardAssessment[]): string {
    // Check category distribution
    const categories = new Set(awards.map(a => a.category));

    if (categories.size <= 2) {
      return 'Strong focus - awards tell a coherent story of deep expertise in specific area.';
    }

    if (categories.size <= 4) {
      return 'Balanced diversity - shows range while maintaining coherence.';
    }

    return 'Diverse achievements - may benefit from essay explanation of how interests connect.';
  }

  /**
   * Analyze competitive context
   */
  private analyzeCompetitiveContext(
    assessments: AwardAssessment[],
    targetSchools?: string[]
  ): AwardCompetitiveContext {
    // Calculate strength vs pool
    const avgScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.selectivityScore, 0) / assessments.length
      : 0;

    const maxScore = assessments.length > 0
      ? Math.max(...assessments.map(a => a.selectivityScore))
      : 0;

    // Determine strength position
    let strengthVsPool: AwardCompetitiveContext['strengthVsPool'];
    let percentileEstimate: number;

    if (maxScore >= 90 || avgScore >= 75) {
      strengthVsPool = 'exceptional';
      percentileEstimate = 95;
    } else if (maxScore >= 75 || avgScore >= 60) {
      strengthVsPool = 'strong';
      percentileEstimate = 80;
    } else if (maxScore >= 55 || avgScore >= 40) {
      strengthVsPool = 'average';
      percentileEstimate = 50;
    } else {
      strengthVsPool = 'below_average';
      percentileEstimate = 30;
    }

    // School-specific context
    const schoolSpecificContext: AwardCompetitiveContext['schoolSpecificContext'] = {};
    if (targetSchools) {
      for (const school of targetSchools) {
        schoolSpecificContext[school] = this.assessSchoolSpecificStrength(assessments, school);
      }
    }

    return {
      strengthVsPool,
      percentileEstimate,
      comparisonNarrative: this.generateComparisonNarrative(strengthVsPool, assessments),
      schoolSpecificContext,
      peerComparison: {
        typicalT20Applicant: 'Typical T20 admits have at least one national-level recognition, often in their area of intended study. Many have multiple state/regional awards.',
        studentComparison: this.generatePeerComparison(assessments),
      },
    };
  }

  /**
   * Assess strength for specific school
   */
  private assessSchoolSpecificStrength(
    assessments: AwardAssessment[],
    schoolId: string
  ): AwardCompetitiveContext['schoolSpecificContext'][string] {
    // This would ideally use school-specific data
    // For now, use general heuristics
    const hasNationalOrHigher = assessments.some(
      a => ['international', 'national'].includes(a.recognitionLevel)
    );
    const hasMultipleHighLevel = assessments.filter(
      a => ['international', 'national', 'regional'].includes(a.recognitionLevel)
    ).length >= 3;

    let strength: 'strong' | 'competitive' | 'average' | 'weak';
    let explanation: string;

    if (hasNationalOrHigher && hasMultipleHighLevel) {
      strength = 'strong';
      explanation = 'Multiple high-level awards position you well in the applicant pool.';
    } else if (hasNationalOrHigher || hasMultipleHighLevel) {
      strength = 'competitive';
      explanation = 'Solid awards profile that meets expectations for competitive applicants.';
    } else if (assessments.length >= 3) {
      strength = 'average';
      explanation = 'Awards section is adequate but not distinctive. Other parts of application should compensate.';
    } else {
      strength = 'weak';
      explanation = 'Limited awards may be a weakness. Focus on other application strengths.';
    }

    return {
      schoolId,
      strengthAtThisSchool: strength,
      explanation,
    };
  }

  /**
   * Generate comparison narrative
   */
  private generateComparisonNarrative(
    strength: AwardCompetitiveContext['strengthVsPool'],
    assessments: AwardAssessment[]
  ): string {
    const narratives = {
      exceptional: 'Awards profile is in the top tier of competitive applicants. This level of recognition will be a significant strength in applications.',
      strong: 'Awards demonstrate serious achievement and will strengthen applications. Profile is competitive for selective institutions.',
      average: 'Awards are consistent with many competitive applicants. Other application components will need to differentiate.',
      below_average: 'Awards section is not a strength relative to typical competitive applicants. Should focus on other areas and pursue new opportunities.',
    };

    return narratives[strength];
  }

  /**
   * Generate peer comparison
   */
  private generatePeerComparison(assessments: AwardAssessment[]): string {
    const nationalCount = assessments.filter(
      a => ['international', 'national'].includes(a.recognitionLevel)
    ).length;
    const stateCount = assessments.filter(
      a => ['regional', 'state'].includes(a.recognitionLevel)
    ).length;

    if (nationalCount >= 2) {
      return 'Profile exceeds typical T20 admits with multiple national/international recognitions.';
    }

    if (nationalCount >= 1) {
      return 'Profile is on par with typical T20 admits who have at least one national recognition.';
    }

    if (stateCount >= 3) {
      return 'Profile shows regional strength but lacks the national-level credential common among T20 admits.';
    }

    if (stateCount >= 1) {
      return 'Profile is developing. Most competitive applicants have more high-level recognition.';
    }

    return 'Profile is below typical T20 applicants in awards. Significant opportunity to strengthen.';
  }

  /**
   * Analyze gaps in awards profile
   */
  private analyzeGaps(
    assessments: AwardAssessment[],
    intendedMajor?: string
  ): AwardGapAnalysis {
    const presentCategories = new Set(assessments.map(a => a.category));
    const presentLevels = new Set(assessments.map(a => a.recognitionLevel));

    const missingCategories: AwardGapAnalysis['missingCategories'] = [];
    const opportunitiesToPursue: AwardGapAnalysis['opportunitiesToPursue'] = [];

    // Check for missing relevant categories based on major
    const relevantCategories = intendedMajor
      ? CATEGORY_RELEVANCE_MAP[intendedMajor.toLowerCase().replace(/[^a-z]/g, '_')] ||
        CATEGORY_RELEVANCE_MAP['general']
      : CATEGORY_RELEVANCE_MAP['general'];

    for (const category of relevantCategories) {
      if (!presentCategories.has(category)) {
        missingCategories.push({
          category,
          importance: this.getCategoryImportance(category, intendedMajor),
          explanation: this.getMissingCategoryExplanation(category, intendedMajor),
          suggestions: this.getSuggestionsForCategory(category),
        });
      }
    }

    // Check for level gaps
    if (!presentLevels.has('national') && !presentLevels.has('international')) {
      opportunitiesToPursue.push({
        opportunity: 'Pursue national-level competitions',
        category: relevantCategories[0] || 'academic_competition',
        timeline: 'Varies by competition deadline',
        difficulty: 'high',
        potentialImpact: 'Major positive impact - would significantly strengthen awards profile',
        howToApproach: [
          'Identify competitions in your area of strength',
          'Research qualification pathways and deadlines',
          'Consider both academic and interest-based competitions',
          'Focus on 1-2 competitions for deep preparation',
        ],
      });
    }

    // Add specific opportunities based on major
    opportunitiesToPursue.push(...this.getSpecificOpportunities(assessments, intendedMajor));

    // Generate strengthening recommendations
    const strengtheningRecommendations = this.generateStrengtheningRecommendations(
      assessments,
      missingCategories,
      intendedMajor
    );

    return {
      missingCategories,
      opportunitiesToPursue,
      strengtheningRecommendations,
    };
  }

  /**
   * Get category importance
   */
  private getCategoryImportance(
    category: AwardCategory,
    intendedMajor?: string
  ): 'critical' | 'important' | 'nice_to_have' {
    const criticalForSTEM: AwardCategory[] = ['academic_olympiad', 'research_recognition', 'science_fair'];
    const criticalForHumanities: AwardCategory[] = ['arts_competition', 'journalism_writing', 'debate_speech'];

    const major = intendedMajor?.toLowerCase() || '';
    const isSTEM = ['math', 'physics', 'computer', 'engineering', 'biology', 'chemistry'].some(
      m => major.includes(m)
    );
    const isHumanities = ['english', 'history', 'philosophy', 'art', 'music'].some(
      m => major.includes(m)
    );

    if (isSTEM && criticalForSTEM.includes(category)) return 'critical';
    if (isHumanities && criticalForHumanities.includes(category)) return 'critical';
    if (category === 'leadership' || category === 'community_service') return 'important';

    return 'nice_to_have';
  }

  /**
   * Get explanation for missing category
   */
  private getMissingCategoryExplanation(category: AwardCategory, intendedMajor?: string): string {
    const explanations: Record<AwardCategory, string> = {
      academic_olympiad: 'Academic olympiads are the gold standard for demonstrating subject mastery.',
      academic_competition: 'Academic competitions show ability to perform under pressure.',
      science_fair: 'Science fairs demonstrate independent research ability.',
      research_recognition: 'Research recognition validates advanced academic work.',
      standardized_test: 'Test-based recognition confirms academic baseline.',
      academic_honor: 'Academic honors show consistent performance.',
      scholarship: 'Scholarships provide external validation of merit.',
      arts_competition: 'Arts competitions demonstrate creative excellence.',
      athletic: 'Athletic awards show discipline and dedication.',
      leadership: 'Leadership awards validate your ability to lead.',
      community_service: 'Service recognition shows commitment to others.',
      entrepreneurship: 'Business awards demonstrate initiative.',
      debate_speech: 'Speaking awards show communication skills.',
      journalism_writing: 'Writing recognition validates communication ability.',
      stem_competition: 'STEM competitions show technical skills.',
      summer_program_selection: 'Selective programs validate your credentials.',
      other: 'Diverse recognition shows well-roundedness.',
    };

    return explanations[category] || 'This type of recognition would strengthen your profile.';
  }

  /**
   * Get suggestions for category
   */
  private getSuggestionsForCategory(category: AwardCategory): string[] {
    const suggestions: Record<AwardCategory, string[]> = {
      academic_olympiad: ['AMC/AIME for math', 'Science Olympiad', 'F=ma/USAPhO for physics', 'USABO for biology'],
      academic_competition: ['Science Bowl', 'Academic Decathlon', 'Quiz Bowl'],
      science_fair: ['ISEF pathway through regional fairs', 'Regeneron STS', 'Junior Science and Humanities Symposium'],
      research_recognition: ['Publish research', 'Present at conferences', 'Apply to Regeneron STS'],
      standardized_test: ['National Merit (PSAT)', 'AP Scholar awards'],
      academic_honor: ['Maintain high GPA', 'Excel in advanced courses'],
      scholarship: ['Apply to merit scholarships', 'Essay competitions with prizes'],
      arts_competition: ['Scholastic Art & Writing', 'Regional art shows', 'Music competitions'],
      athletic: ['Excel in your sport', 'Pursue All-State/All-Conference'],
      leadership: ['Take on leadership roles in activities', 'Start new initiatives'],
      community_service: ['Presidential Service Award', 'Track and document hours'],
      entrepreneurship: ['FBLA/DECA', 'Business plan competitions', 'Start something'],
      debate_speech: ['Tournament of Champions circuit', 'National qualifiers'],
      journalism_writing: ['Scholastic Writing Awards', 'Journalism competitions'],
      stem_competition: ['VEX/FIRST Robotics', 'Hackathons', 'Coding competitions'],
      summer_program_selection: ['Apply to RSI, MOSTEC, Clark Scholars, etc.'],
      other: ['Look for unique opportunities aligned with your interests'],
    };

    return suggestions[category] || ['Research opportunities in this area'];
  }

  /**
   * Get specific opportunities based on profile
   */
  private getSpecificOpportunities(
    assessments: AwardAssessment[],
    intendedMajor?: string
  ): AwardGapAnalysis['opportunitiesToPursue'] {
    const opportunities: AwardGapAnalysis['opportunitiesToPursue'] = [];
    const major = intendedMajor?.toLowerCase() || '';

    // Major-specific recommendations
    if (major.includes('math') || major.includes('physics') || major.includes('computer')) {
      const hasOlympiad = assessments.some(a => a.category === 'academic_olympiad');
      if (!hasOlympiad) {
        opportunities.push({
          opportunity: 'Participate in math/science olympiads',
          category: 'academic_olympiad',
          timeline: 'AMC in November, F=ma in January, USABO in February',
          difficulty: 'high',
          potentialImpact: 'Very high - olympiad qualification is highly valued for STEM applicants',
          howToApproach: [
            'Start with AMC 10/12 for mathematics',
            'Use Art of Problem Solving resources for preparation',
            'Join school math/science competition teams',
            'Practice consistently - success requires dedicated preparation',
          ],
        });
      }
    }

    if (major.includes('bio') || major.includes('pre-med') || major.includes('chemistry')) {
      const hasResearch = assessments.some(a =>
        ['research_recognition', 'science_fair'].includes(a.category)
      );
      if (!hasResearch) {
        opportunities.push({
          opportunity: 'Pursue research and science fair competitions',
          category: 'science_fair',
          timeline: 'Regional fairs typically in spring; start projects in summer/fall',
          difficulty: 'medium',
          potentialImpact: 'High - research experience is expected for science-focused applicants',
          howToApproach: [
            'Reach out to local university professors for research opportunities',
            'Develop independent project for science fair',
            'Document your work for potential ISEF/Regeneron STS submission',
            'Consider summer research programs',
          ],
        });
      }
    }

    // General recommendations
    const hasSelectiveProgram = assessments.some(a => a.category === 'summer_program_selection');
    if (!hasSelectiveProgram) {
      opportunities.push({
        opportunity: 'Apply to selective summer programs',
        category: 'summer_program_selection',
        timeline: 'Most applications due December-February',
        difficulty: 'high',
        potentialImpact: 'Moderate to high - program selection validates your abilities',
        howToApproach: [
          'Research programs aligned with your interests (RSI, MOSTEC, etc.)',
          'Apply to multiple programs to increase chances',
          'Prepare strong essays and recommendation letters',
          'Start applications early - they require significant effort',
        ],
      });
    }

    return opportunities;
  }

  /**
   * Generate strengthening recommendations
   */
  private generateStrengtheningRecommendations(
    assessments: AwardAssessment[],
    missingCategories: AwardGapAnalysis['missingCategories'],
    intendedMajor?: string
  ): string[] {
    const recommendations: string[] = [];

    // Check level distribution
    const hasNational = assessments.some(
      a => ['international', 'national'].includes(a.recognitionLevel)
    );
    if (!hasNational) {
      recommendations.push(
        'Prioritize pursuing at least one national-level recognition - this is the single most impactful improvement for your awards profile.'
      );
    }

    // Check category coverage
    const criticalMissing = missingCategories.filter(m => m.importance === 'critical');
    if (criticalMissing.length > 0) {
      recommendations.push(
        `Focus on ${criticalMissing.map(m => m.category.replace(/_/g, ' ')).join(' and ')} - these are critical for ${intendedMajor || 'your intended path'}.`
      );
    }

    // Check depth vs breadth
    const categoryCount = new Set(assessments.map(a => a.category)).size;
    if (categoryCount >= 5 && !hasNational) {
      recommendations.push(
        'Consider focusing your effort - you have breadth but may benefit from going deeper in one area to achieve higher-level recognition.'
      );
    }

    // Check relevance alignment
    const relevantAwards = assessments.filter(a => a.relevanceToMajor === 'high');
    if (relevantAwards.length === 0 && intendedMajor) {
      recommendations.push(
        `Your current awards don't strongly connect to ${intendedMajor}. Pursue awards in your intended field to strengthen the narrative.`
      );
    }

    // Generic fallback
    if (recommendations.length === 0) {
      recommendations.push(
        'Continue building on your strengths while looking for opportunities to reach higher recognition levels.'
      );
    }

    return recommendations;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    assessments: Record<string, AwardAssessment>,
    distribution: AwardDistributionAnalysis
  ): number {
    const awards = Object.values(assessments);
    if (awards.length === 0) return 0;

    // Weight by award quality
    const sortedByScore = [...awards].sort((a, b) => b.selectivityScore - a.selectivityScore);

    // Top award matters most (40%), next 2 (30%), rest (30%)
    const components: WeightedScoreComponent[] = [];

    if (sortedByScore.length >= 1) {
      components.push({ value: sortedByScore[0].selectivityScore, weight: 0.4 });
    }

    if (sortedByScore.length >= 2) {
      const top2Avg = sortedByScore.slice(1, 3).reduce((s, a) => s + a.selectivityScore, 0) /
        Math.min(2, sortedByScore.length - 1);
      components.push({ value: top2Avg, weight: 0.3 });
    }

    if (sortedByScore.length >= 3) {
      const restAvg = sortedByScore.slice(3).reduce((s, a) => s + a.selectivityScore, 0) /
        Math.max(1, sortedByScore.length - 3);
      components.push({ value: restAvg || 0, weight: 0.3 });
    }

    const { weightedScore } = calculateWeightedScore(components);

    // Bonus for distribution strength
    const distributionBonus: Record<AwardDistributionAnalysis['distributionStrength'], number> = {
      exceptional: 10,
      strong: 5,
      good: 2,
      average: 0,
      weak: -5,
    };

    return Math.min(100, Math.max(0, Math.round(weightedScore + distributionBonus[distribution.distributionStrength])));
  }

  /**
   * Determine overall strength label
   */
  private determineOverallStrength(
    score: number,
    distribution: AwardDistributionAnalysis
  ): AwardEvaluation['overallStrength'] {
    // Use both score and distribution
    if (score >= 85 && distribution.summary.tier1Awards >= 1) return 'exceptional';
    if (score >= 70 || (score >= 60 && distribution.summary.tier1Awards >= 1)) return 'strong';
    if (score >= 50 || distribution.summary.tier2Awards >= 3) return 'competitive';
    if (score >= 30 || distribution.summary.totalAwards >= 3) return 'developing';
    return 'needs_work';
  }

  /**
   * Generate overall narrative
   */
  private generateOverallNarrative(
    strength: AwardEvaluation['overallStrength'],
    distribution: AwardDistributionAnalysis,
    highlights: AwardHighlightsAnalysis
  ): string {
    const strengthNarratives = {
      exceptional: `Outstanding awards profile headlined by ${highlights.mostImpressive.award.awardName}. This level of recognition will be a significant strength in college applications.`,
      strong: `Solid awards showing genuine achievement. ${highlights.mostImpressive.award.awardName} anchors a profile that demonstrates competitive accomplishment.`,
      competitive: `Developing awards profile with room to grow. ${distribution.summary.tier2Awards} state/regional recognitions provide foundation; national-level achievement would elevate significantly.`,
      developing: `Awards are building but not yet distinctive. Focus on pursuing higher-level recognition to strengthen competitive standing.`,
      needs_work: `Limited awards currently. This should be a priority area for improvement through competitive opportunities aligned with interests.`,
    };

    return strengthNarratives[strength];
  }

  /**
   * Generate comprehensive narrative
   */
  private generateNarrative(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    highlights: AwardHighlightsAnalysis,
    intendedMajor?: string
  ): AwardEvaluation['awardsNarrative'] {
    // Headline
    const headline = this.generateHeadline(assessments, distribution, highlights);

    // Strengths
    const strengths = this.identifyStrengths(assessments, distribution, highlights);

    // Concerns
    const concerns = this.identifyConcerns(assessments, distribution, intendedMajor);

    // Unique aspects
    const uniqueAspects = this.identifyUniqueAspects(assessments);

    // Admissions story
    const admissionsStory = this.generateAdmissionsStory(
      assessments,
      highlights,
      intendedMajor
    );

    return {
      headline,
      strengths,
      concerns,
      uniqueAspects,
      admissionsStory,
    };
  }

  /**
   * Generate headline for awards
   */
  private generateHeadline(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    highlights: AwardHighlightsAnalysis
  ): string {
    if (distribution.summary.tier1Awards >= 2) {
      return `Multiple ${distribution.distribution.international.length > 0 ? 'international' : 'national'}-level recognitions establish exceptional credentials`;
    }

    if (distribution.summary.tier1Awards >= 1) {
      return `${highlights.mostImpressive.award.awardName} anchors a competitive awards profile`;
    }

    if (distribution.summary.tier2Awards >= 3) {
      return `Strong regional/state presence demonstrates competitive achievement`;
    }

    if (distribution.summary.totalAwards >= 5) {
      return `Diverse achievements show breadth; deeper recognition would strengthen profile`;
    }

    return `Building foundation of recognition with room for competitive growth`;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    highlights: AwardHighlightsAnalysis
  ): string[] {
    const strengths: string[] = [];

    if (distribution.summary.tier1Awards >= 1) {
      strengths.push(`${distribution.summary.tier1Awards} national/international level recognition(s)`);
    }

    if (highlights.mostRelevantToGoals.award.relevanceToMajor === 'high') {
      strengths.push(`Strong alignment between awards and intended field of study`);
    }

    if (highlights.mostUnique.award.narrativeValue.uniqueness === 'very_unique') {
      strengths.push(`${highlights.mostUnique.award.awardName} provides distinctive differentiation`);
    }

    // Category depth
    const categoryCounts = new Map<AwardCategory, number>();
    for (const a of assessments) {
      categoryCounts.set(a.category, (categoryCounts.get(a.category) || 0) + 1);
    }
    for (const [category, count] of categoryCounts) {
      if (count >= 3) {
        strengths.push(`Deep achievement in ${category.replace(/_/g, ' ')} (${count} awards)`);
      }
    }

    if (strengths.length === 0) {
      strengths.push('Building foundation of recognition');
    }

    return strengths;
  }

  /**
   * Identify concerns
   */
  private identifyConcerns(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    intendedMajor?: string
  ): string[] {
    const concerns: string[] = [];

    if (distribution.summary.tier1Awards === 0) {
      concerns.push('No national/international level recognition - this is common among T20 admits');
    }

    if (distribution.summary.totalAwards <= 2) {
      concerns.push('Limited total awards - applicant pool typically has 4+ recognitions');
    }

    // Check relevance
    const highRelevance = assessments.filter(a => a.relevanceToMajor === 'high');
    if (highRelevance.length === 0 && intendedMajor) {
      concerns.push(`No awards directly relevant to ${intendedMajor}`);
    }

    // Check for only common awards
    const uniqueAwards = assessments.filter(
      a => a.narrativeValue.uniqueness !== 'common'
    );
    if (uniqueAwards.length === 0 && assessments.length > 0) {
      concerns.push('All awards are common/expected - profile lacks differentiation');
    }

    return concerns;
  }

  /**
   * Identify unique aspects
   */
  private identifyUniqueAspects(assessments: AwardAssessment[]): string[] {
    const uniqueAspects: string[] = [];

    // Find truly unique awards
    const veryUnique = assessments.filter(
      a => a.narrativeValue.uniqueness === 'very_unique'
    );
    for (const award of veryUnique) {
      uniqueAspects.push(
        `${award.awardName} - ${award.narrativeValue.proofPoint}`
      );
    }

    // Find interesting category combinations
    const categories = new Set(assessments.map(a => a.category));
    if (categories.has('academic_olympiad') && categories.has('arts_competition')) {
      uniqueAspects.push('Rare combination of STEM and arts excellence');
    }

    if (categories.has('research_recognition') && categories.has('entrepreneurship')) {
      uniqueAspects.push('Bridge between research and real-world application');
    }

    return uniqueAspects;
  }

  /**
   * Generate admissions story
   */
  private generateAdmissionsStory(
    assessments: AwardAssessment[],
    highlights: AwardHighlightsAnalysis,
    intendedMajor?: string
  ): string {
    if (assessments.length === 0) {
      return 'Awards section is currently a gap. Focus on building recognition aligned with interests.';
    }

    const topAward = highlights.mostImpressive.award;
    const relevantAward = highlights.mostRelevantToGoals.award;

    if (topAward.recognitionLevel === 'international' || topAward.recognitionLevel === 'national') {
      return `Awards tell a story of exceptional achievement, anchored by ${topAward.awardName}. This validates ${intendedMajor ? `passion for ${intendedMajor}` : 'academic capability'} at the highest level.`;
    }

    if (relevantAward.relevanceToMajor === 'high') {
      return `Awards demonstrate focused pursuit of ${intendedMajor || 'chosen field'}. ${relevantAward.awardName} directly supports the application narrative.`;
    }

    return `Awards show a developing profile of achievement. For strongest impact, essays should connect awards to larger narrative of growth and interests.`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    gapAnalysis: AwardGapAnalysis,
    intendedMajor?: string
  ): AwardEvaluation['recommendations'] {
    return {
      presentation: this.getPresentationRecommendations(assessments, distribution),
      pursue: this.getPursueRecommendations(gapAnalysis, intendedMajor),
      timeline: this.getTimelineRecommendations(gapAnalysis),
      positioning: this.getPositioningRecommendations(assessments, distribution, intendedMajor),
    };
  }

  /**
   * Get presentation recommendations
   */
  private getPresentationRecommendations(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Order matters
    recommendations.push(
      'Lead with highest-level recognition in Common App honors section.'
    );

    // Description optimization
    recommendations.push(
      'Use optimized descriptions that include selectivity context (e.g., "top 300 of 2,000").'
    );

    // Level selection
    if (distribution.summary.tier2Awards >= 1) {
      recommendations.push(
        'Carefully select Common App level - regional/state can appear as "state_regional".'
      );
    }

    // Narrative connection
    recommendations.push(
      'Reference key awards in essays to provide narrative context for the achievement.'
    );

    return recommendations;
  }

  /**
   * Get pursue recommendations
   */
  private getPursueRecommendations(
    gapAnalysis: AwardGapAnalysis,
    intendedMajor?: string
  ): string[] {
    const recommendations: string[] = [];

    for (const opportunity of gapAnalysis.opportunitiesToPursue.slice(0, 3)) {
      recommendations.push(
        `${opportunity.opportunity}: ${opportunity.potentialImpact}`
      );
    }

    for (const missing of gapAnalysis.missingCategories.filter(m => m.importance === 'critical').slice(0, 2)) {
      recommendations.push(
        `Pursue ${missing.category.replace(/_/g, ' ')} recognition: ${missing.explanation}`
      );
    }

    return recommendations;
  }

  /**
   * Get timeline recommendations
   */
  private getTimelineRecommendations(gapAnalysis: AwardGapAnalysis): string[] {
    const recommendations: string[] = [];

    for (const opportunity of gapAnalysis.opportunitiesToPursue) {
      if (opportunity.timeline && !opportunity.timeline.includes('Varies')) {
        recommendations.push(
          `${opportunity.opportunity}: ${opportunity.timeline}`
        );
      }
    }

    // Add general reminders
    recommendations.push(
      'Research application deadlines for summer programs (typically Dec-Feb).'
    );
    recommendations.push(
      'Note competition dates for olympiads and other annual events.'
    );

    return recommendations;
  }

  /**
   * Get positioning recommendations
   */
  private getPositioningRecommendations(
    assessments: AwardAssessment[],
    distribution: AwardDistributionAnalysis,
    intendedMajor?: string
  ): string[] {
    const recommendations: string[] = [];

    // Based on strength level
    if (distribution.distributionStrength === 'exceptional') {
      recommendations.push(
        'Let awards speak for themselves - avoid over-explaining achievements that are self-evidently impressive.'
      );
    } else if (distribution.distributionStrength === 'strong') {
      recommendations.push(
        'Position awards as evidence of genuine passion, not just credential collection.'
      );
    } else {
      recommendations.push(
        'Use essays and activities to contextualize awards within broader narrative of growth.'
      );
    }

    // Major alignment
    if (intendedMajor) {
      const relevant = assessments.filter(a => a.relevanceToMajor === 'high');
      if (relevant.length >= 2) {
        recommendations.push(
          `Multiple awards align with ${intendedMajor} - emphasize this coherent pursuit.`
        );
      } else {
        recommendations.push(
          `Connect awards to ${intendedMajor} through essays showing how interests developed.`
        );
      }
    }

    return recommendations;
  }

  /**
   * Find connections between awards and activities
   */
  private findActivityConnections(
    awards: AwardInputData[]
  ): AwardEvaluation['activityConnections'] {
    const connections: AwardEvaluation['activityConnections'] = [];

    for (const award of awards) {
      if (award.relatedActivity) {
        connections.push({
          awardId: award.id,
          activityId: award.relatedActivity,
          connectionStrength: 'strong',
          narrativeValue: `${award.name} validates commitment to this activity.`,
        });
      }
    }

    return connections;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(
    awards: AwardInputData[],
    assessments: Record<string, AwardAssessment>
  ): number {
    const factors = {
      dataCompleteness: this.assessDataCompleteness(awards),
      knownAwardCoverage: this.assessKnownAwardCoverage(awards),
      consistentData: 0.85, // Assume reasonable consistency
    };

    return calculateConfidence(factors);
  }

  /**
   * Assess data completeness
   */
  private assessDataCompleteness(awards: AwardInputData[]): number {
    if (awards.length === 0) return 0.5; // Can't assess empty

    let score = 0;
    for (const award of awards) {
      let awardScore = 0.5; // Base for required fields
      if (award.description) awardScore += 0.2;
      if (award.selectivityInfo) awardScore += 0.2;
      if (award.organization) awardScore += 0.1;
      score += awardScore;
    }

    return score / awards.length;
  }

  /**
   * Assess known award coverage
   */
  private assessKnownAwardCoverage(awards: AwardInputData[]): number {
    if (awards.length === 0) return 0.5;

    let matchedCount = 0;
    for (const award of awards) {
      if (this.findKnownAward(award.name)) {
        matchedCount++;
      }
    }

    // Having some known awards increases confidence, but we can still evaluate unknown ones
    return 0.6 + (0.4 * (matchedCount / awards.length));
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const awardEvaluator = new AwardEvaluator();
