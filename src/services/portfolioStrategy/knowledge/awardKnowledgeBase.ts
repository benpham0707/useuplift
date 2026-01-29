/**
 * Award Knowledge Base Service
 *
 * Provides selective retrieval from Section 2 research modules for award analysis.
 * Follows the PIQ workshop pattern of registry-based, pre-indexed knowledge.
 *
 * Research modules:
 * - 2.1: Tier Classification System
 * - 2.2: STEM Awards
 * - 2.3: Arts & Humanities Awards
 * - 2.4: Academic Recognition
 * - 2.5: Leadership & Service Awards
 * - 2.6: Athletic Awards
 * - 2.7: Authenticity Detection
 *
 * @module awardKnowledgeBase
 */

import { AwardCategory } from '../types/awards';
import {
  AwardTier,
  ResearchCitation,
  ResearchBackedInsight,
  EnhancedKnownAwardProfile,
} from '../types/awardsEnhanced';

// ============================================================================
// RESEARCH MODULE REGISTRY
// ============================================================================

/**
 * Research module metadata
 */
interface ResearchModule {
  id: string;
  path: string;
  title: string;
  focus: string;
  categories: AwardCategory[];
  keyTopics: string[];
  estimatedTokens: number;
}

/**
 * Registry of all Section 2 research modules
 */
const RESEARCH_MODULES: ResearchModule[] = [
  {
    id: '2.1',
    path: 'docs/research/section2-awards/2.1_TIER_CLASSIFICATION_SYSTEM.md',
    title: 'Tier Classification System',
    focus: 'Core tier framework, selectivity thresholds, Common App strategy',
    categories: [], // Applies to all
    keyTopics: ['tier_classification', 'selectivity', 'common_app', 'context_modifiers'],
    estimatedTokens: 8000,
  },
  {
    id: '2.2',
    path: 'docs/research/section2-awards/2.2_STEM_AWARDS.md',
    title: 'STEM Awards',
    focus: 'Olympiads, science fairs, research competitions',
    categories: ['academic_olympiad', 'science_fair', 'research_recognition', 'stem_competition', 'summer_program_selection'],
    keyTopics: ['olympiad', 'usamo', 'usaco', 'isef', 'regeneron', 'rsi', 'research'],
    estimatedTokens: 10000,
  },
  {
    id: '2.3',
    path: 'docs/research/section2-awards/2.3_ARTS_HUMANITIES_AWARDS.md',
    title: 'Arts & Humanities Awards',
    focus: 'Scholastic, YoungArts, debate, MUN, writing competitions',
    categories: ['arts_competition', 'debate_speech', 'journalism_writing'],
    keyTopics: ['scholastic', 'youngarts', 'toc', 'debate', 'model_un', 'writing', 'music', 'theater'],
    estimatedTokens: 8000,
  },
  {
    id: '2.4',
    path: 'docs/research/section2-awards/2.4_ACADEMIC_RECOGNITION.md',
    title: 'Academic Recognition',
    focus: 'National Merit, AP Scholar, honor societies',
    categories: ['standardized_test', 'academic_honor', 'scholarship'],
    keyTopics: ['national_merit', 'ap_scholar', 'presidential_scholar', 'nhs', 'honor_society'],
    estimatedTokens: 6000,
  },
  {
    id: '2.5',
    path: 'docs/research/section2-awards/2.5_LEADERSHIP_SERVICE_AWARDS.md',
    title: 'Leadership & Service Awards',
    focus: 'Congressional Award, Eagle Scout, business competitions',
    categories: ['leadership', 'community_service', 'entrepreneurship'],
    keyTopics: ['congressional_award', 'eagle_scout', 'gold_award', 'deca', 'fbla', 'prudential'],
    estimatedTokens: 7000,
  },
  {
    id: '2.6',
    path: 'docs/research/section2-awards/2.6_ATHLETIC_AWARDS.md',
    title: 'Athletic Awards',
    focus: 'All-State, All-American, recruiting implications',
    categories: ['athletic'],
    keyTopics: ['all_state', 'all_american', 'recruited_athlete', 'aldc', 'athletic_recognition'],
    estimatedTokens: 6000,
  },
  {
    id: '2.7',
    path: 'docs/research/section2-awards/2.7_AUTHENTICITY_DETECTION.md',
    title: 'Authenticity Detection',
    focus: 'Paper awards, pay-to-play, verification framework',
    categories: [], // Applies to all
    keyTopics: ['authenticity', 'paper_award', 'pay_to_play', 'red_flag', 'verification', 'nshss'],
    estimatedTokens: 7000,
  },
];

// ============================================================================
// ENHANCED AWARD DATABASE
// ============================================================================

/**
 * Comprehensive award database with research-backed data
 * Organized by tier for efficient retrieval
 */
const ENHANCED_AWARD_DATABASE: EnhancedKnownAwardProfile[] = [
  // ============== TIER 1: EXCEPTIONAL (<2% OR <500 recipients) ==============

  // International Olympiad Medals
  {
    id: 'imo_gold',
    name: 'International Mathematical Olympiad Gold Medal',
    aliases: ['IMO Gold', 'IMO First Place'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '<0.01% of global math students, ~45 recipients annually',
    selectivityData: {
      acceptanceRate: 0.0075,
      annualApplicants: 600000,
      annualRecipients: 45,
      selectionProcess: 'Multi-stage national selection → 6-person team → IMO competition',
      verificationUrl: 'https://www.imo-official.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highest recognition at the premier international mathematics competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'One of the most prestigious academic achievements. Virtually guarantees strong consideration at any school.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Gold Medal, International Mathematical Olympiad (top 45 worldwide)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.3, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Academic Olympiads', relevance: 'primary' },
    ],
  },
  {
    id: 'regeneron_sts_finalist',
    name: 'Regeneron Science Talent Search Finalist',
    aliases: ['STS Finalist', 'Science Talent Search Finalist', 'Regeneron Finalist'],
    category: 'research_recognition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '1.6% selection rate, 40 finalists from 2,500 applicants',
    selectivityData: {
      acceptanceRate: 1.6,
      annualApplicants: 2500,
      annualRecipients: 40,
      selectionProcess: 'Original research submission → scholar selection → finalist selection',
      verificationUrl: 'https://www.societyforscience.org/regeneron-sts/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top 40 finalists in the nation\'s most prestigious pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite research credential. Strong indicator of future research success. Highly valued at research universities.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Finalist, Regeneron Science Talent Search (top 40 of 2,500)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Research Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'usamo_qualifier',
    name: 'USA Mathematical Olympiad Qualifier',
    aliases: ['USAMO Qualifier', 'Made USAMO'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '<0.01% of AMC participants, ~260 qualifiers annually',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 300000,
      annualRecipients: 260,
      selectionProcess: 'AMC 10/12 → AIME → USAMO qualification',
      verificationUrl: 'https://www.maa.org/math-competitions',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Qualified for the USA Mathematical Olympiad, the top math competition in the US',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite mathematical ability. One of the strongest STEM credentials possible.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Qualifier, USA Mathematical Olympiad (top 260 nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.3, harvard: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Math Olympiad Pathway', relevance: 'primary' },
    ],
  },
  {
    id: 'isef_grand',
    name: 'ISEF Grand Award',
    aliases: ['Intel ISEF Grand', 'Regeneron ISEF Grand Award'],
    category: 'science_fair',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '<0.01% of initial participants, ~100 grand awards from 7M students',
    selectivityData: {
      acceptanceRate: 0.001,
      annualApplicants: 7000000,
      annualRecipients: 100,
      selectionProcess: 'Local → Regional → State → ISEF Finals → Grand Award judging',
      verificationUrl: 'https://www.societyforscience.org/isef/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top prize at the world\'s largest pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional research achievement. Strong predictor of future scientific success.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Grand Award, Regeneron ISEF (top 100 of 7 million students)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Fair Hierarchy', relevance: 'primary' },
    ],
  },
  {
    id: 'presidential_scholar',
    name: 'U.S. Presidential Scholar',
    aliases: ['Presidential Scholar', 'US Presidential Scholar'],
    category: 'academic_honor',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '<0.01% of graduates, 161 recipients annually',
    selectivityData: {
      acceptanceRate: 0.005,
      annualApplicants: 3700000,
      annualRecipients: 161,
      selectionProcess: 'Nomination by state → Commission review → White House recognition',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'One of the highest honors for graduating high school seniors in the US',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional recognition combining academic excellence with leadership.',
    relevantMajors: ['all'],
    suggestedDescription: 'U.S. Presidential Scholar (161 selected nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.4, yale: 1.4, stanford: 1.3, mit: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.4.3', module: '2.4_ACADEMIC_RECOGNITION', section: 'Presidential Scholars', relevance: 'primary' },
    ],
  },
  {
    id: 'davidson_fellow',
    name: 'Davidson Fellow',
    aliases: ['Davidson Fellowship'],
    category: 'research_recognition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~20 recipients annually, 2-4% acceptance rate',
    selectivityData: {
      acceptanceRate: 3,
      annualApplicants: 700,
      annualRecipients: 20,
      selectionProcess: 'Project submission → Expert panel review → Fellowship selection',
      verificationUrl: 'https://www.davidsongifted.org/gifted-programs/fellows-scholarship/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Prestigious scholarship recognizing extraordinary accomplishments in STEM, Literature, Music, Philosophy, or Outside the Box',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Validates exceptional independent work and intellectual depth.',
    relevantMajors: ['sciences', 'engineering', 'humanities', 'arts'],
    suggestedDescription: 'Davidson Fellow ($50,000 scholarship for exceptional work)',
    suggestedLevel: 'national',
    schoolSpecificValue: { stanford: 1.4, mit: 1.4, harvard: 1.3, caltech: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.3', module: '2.2_STEM_AWARDS', section: 'Research Programs', relevance: 'primary' },
    ],
  },
  {
    id: 'scholastic_gold_medal',
    name: 'Scholastic Art & Writing Awards National Gold Medal',
    aliases: ['Scholastic Gold Medal', 'National Gold Medal Scholastic'],
    category: 'arts_competition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '0.2% of submissions, ~700 recipients from 340,000 entries',
    selectivityData: {
      acceptanceRate: 0.2,
      annualApplicants: 340000,
      annualRecipients: 700,
      selectionProcess: 'Regional judging → Gold Key → National adjudication',
      verificationUrl: 'https://www.artandwriting.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highest national recognition in the nation\'s longest-running arts competition for teens',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional creative talent. Particularly valued at schools with strong arts programs.',
    relevantMajors: ['creative_writing', 'visual_arts', 'design', 'journalism'],
    suggestedDescription: 'National Gold Medal, Scholastic Art & Writing Awards (top 0.2%)',
    suggestedLevel: 'national',
    schoolSpecificValue: { yale: 1.5, brown: 1.4, stanford: 1.3, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.3.1', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Scholastic Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'youngarts_winner',
    name: 'YoungArts Winner with Distinction',
    aliases: ['YoungArts Winner', 'National YoungArts Winner'],
    category: 'arts_competition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~1% of applicants, ~170 Winners with Distinction annually',
    selectivityData: {
      acceptanceRate: 2,
      annualApplicants: 8000,
      annualRecipients: 170,
      selectionProcess: 'Portfolio/audition submission → Panel review → YoungArts Week invitation',
      verificationUrl: 'https://youngarts.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Sole nominating agency for U.S. Presidential Scholars in the Arts',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Premier arts recognition. Particularly valued at schools with strong arts programs and conservatories.',
    relevantMajors: ['visual_arts', 'music', 'dance', 'theater', 'film', 'creative_writing'],
    suggestedDescription: 'Winner with Distinction, National YoungArts (top 170 artists nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { yale: 1.5, brown: 1.4, nyu: 1.5, stanford: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.3.2', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'YoungArts', relevance: 'primary' },
    ],
  },
  {
    id: 'toc_champion',
    name: 'Tournament of Champions Winner',
    aliases: ['TOC Champion', 'TOC Winner', 'Debate TOC Champion'],
    category: 'debate_speech',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '1 winner per event annually from ~500 qualifiers',
    selectivityData: {
      acceptanceRate: 0.2,
      annualApplicants: 500,
      annualRecipients: 1,
      selectionProcess: 'Bid accumulation → TOC qualification → Elimination rounds → Finals',
      verificationUrl: 'https://ci.uky.edu/UKDebate/tournament-champions',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Champion at the pinnacle of national circuit debate',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite communication and critical thinking skills. Particularly valued at schools with strong debate traditions.',
    relevantMajors: ['pre_law', 'political_science', 'philosophy', 'communications'],
    suggestedDescription: 'National Champion, Tournament of Champions ([Event])',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.5, yale: 1.5, stanford: 1.4, princeton: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.3.4', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Debate & Speech', relevance: 'primary' },
    ],
  },
  {
    id: 'usaco_platinum',
    name: 'USACO Platinum Division',
    aliases: ['USACO Platinum', 'USA Computing Olympiad Platinum'],
    category: 'stem_competition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: 'Top ~200-300 competitors nationally out of thousands',
    selectivityData: {
      acceptanceRate: 1,
      annualApplicants: 20000,
      annualRecipients: 250,
      selectionProcess: 'Bronze → Silver → Gold → Platinum promotion through contests',
      verificationUrl: 'http://usaco.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highest division in the USA Computing Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite algorithmic and programming ability. Highly valued at tech-focused schools.',
    relevantMajors: ['computer_science', 'software_engineering', 'mathematics'],
    suggestedDescription: 'Platinum Division, USA Computing Olympiad (top 1%)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, stanford: 1.4, caltech: 1.4, cmu: 1.5 },
    researchCitations: [
      { sourceId: 'sec2.2.4', module: '2.2_STEM_AWARDS', section: 'Computing Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'coca_cola_scholar',
    name: 'Coca-Cola Scholar',
    aliases: ['Coca-Cola Scholarship', 'Coca-Cola Scholars Foundation'],
    category: 'scholarship',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '150 scholars from 100,000+ applicants (<0.2%)',
    selectivityData: {
      acceptanceRate: 0.15,
      annualApplicants: 100000,
      annualRecipients: 150,
      selectionProcess: 'Application → Semifinalist → Regional interviews → Scholar selection',
      verificationUrl: 'https://www.coca-colascholarsfoundation.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'One of the most prestigious merit scholarships in the nation',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite recognition combining academics, leadership, and service.',
    relevantMajors: ['all'],
    suggestedDescription: 'Coca-Cola Scholar ($20,000 scholarship, 150 of 100,000+)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.4, stanford: 1.4, yale: 1.4, princeton: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.4.3', module: '2.4_ACADEMIC_RECOGNITION', section: 'Merit Scholarships', relevance: 'primary' },
    ],
  },
  {
    id: 'usapho_camp',
    name: 'US Physics Olympiad Camp',
    aliases: ['USPhO Camp', 'Physics Olympiad Camp', 'US Physics Team Selection'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~20 students selected for training camp',
    selectivityData: {
      acceptanceRate: 0.1,
      annualApplicants: 20000,
      annualRecipients: 20,
      selectionProcess: 'F=ma exam → USAPhO exam → Camp invitation',
      verificationUrl: 'https://www.aapt.org/Programs/PhysicsOlympiad/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top 20 physics students in the nation selected for IPhO training',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite physics ability. One of the strongest STEM credentials.',
    relevantMajors: ['physics', 'engineering', 'mathematics'],
    suggestedDescription: 'US Physics Olympiad Camp Invitee (top 20 nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Science Olympiad Pathway', relevance: 'primary' },
    ],
  },
  {
    id: 'usaco_finalist',
    name: 'USACO Finalist',
    aliases: ['USACO Camp', 'USA Computing Olympiad Finalist', 'USACO Camp Invitee'],
    category: 'stem_competition',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~26 finalists selected for IOI training camp',
    selectivityData: {
      acceptanceRate: 0.1,
      annualApplicants: 20000,
      annualRecipients: 26,
      selectionProcess: 'Bronze → Silver → Gold → Platinum → Camp invitation',
      verificationUrl: 'http://usaco.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top ~26 computing students selected for IOI training camp',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite programming and algorithmic ability. Highly valued at top CS programs.',
    relevantMajors: ['computer_science', 'software_engineering'],
    suggestedDescription: 'USACO Finalist/Camp Invitee (top 26 nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, stanford: 1.5, cmu: 1.5, caltech: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.2.4', module: '2.2_STEM_AWARDS', section: 'Computing Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'rsi_selection',
    name: 'Research Science Institute Selection',
    aliases: ['RSI Selection', 'RSI Acceptance', 'RSI Admit'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '80 students from 4,000+ applicants (~2%)',
    selectivityData: {
      acceptanceRate: 2,
      annualApplicants: 4000,
      annualRecipients: 80,
      selectionProcess: 'Application with research proposal → Selection committee review',
      verificationUrl: 'https://www.cee.org/programs/rsi',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Most selective summer research program in the country',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Indicates exceptional research potential. Very strong STEM credential.',
    relevantMajors: ['sciences', 'engineering', 'mathematics'],
    suggestedDescription: 'Selected, Research Science Institute at MIT (2% acceptance)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.5, caltech: 1.4, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.3', module: '2.2_STEM_AWARDS', section: 'Elite Research Programs', relevance: 'primary' },
    ],
  },
  {
    id: 'tasp_selection',
    name: 'Telluride Association Summer Program Selection',
    aliases: ['TASP', 'TASP Selection', 'Telluride Summer Program'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~64 students from 3,000+ applicants (~2%)',
    selectivityData: {
      acceptanceRate: 2,
      annualApplicants: 3000,
      annualRecipients: 64,
      selectionProcess: 'Application with writing samples → Interview → Selection',
      verificationUrl: 'https://www.tellurideassociation.org/our-programs/high-school-students/tasp/',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Most selective humanities summer program in the country',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Exceptional intellectual curiosity and humanities ability.',
    relevantMajors: ['humanities', 'social_sciences', 'philosophy', 'political_science'],
    suggestedDescription: 'Selected, Telluride Association Summer Program (2% acceptance)',
    suggestedLevel: 'national',
    schoolSpecificValue: { yale: 1.5, harvard: 1.4, stanford: 1.4, princeton: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.3.7', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Elite Humanities Programs', relevance: 'primary' },
    ],
  },
  {
    id: 'siemens_regional_finalist',
    name: 'Siemens Competition Regional Finalist',
    aliases: ['Siemens Regional Finalist', 'Siemens Competition Finalist'],
    category: 'science_fair',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~100 regional finalists from thousands of submissions',
    selectivityData: {
      acceptanceRate: 1,
      annualApplicants: 5000,
      annualRecipients: 100,
      selectionProcess: 'Research submission → Expert review → Regional finalist selection',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Regional finalist in the Siemens Competition for Math, Science & Technology',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Strong research credential demonstrating scientific excellence.',
    relevantMajors: ['sciences', 'engineering', 'mathematics'],
    suggestedDescription: 'Regional Finalist, Siemens Competition (top 100)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.4, caltech: 1.4, stanford: 1.3, harvard: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Research Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'gates_scholarship',
    name: 'Gates Scholarship',
    aliases: ['Gates Scholar', 'Bill and Melinda Gates Scholarship'],
    category: 'scholarship',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '300 scholars from 50,000+ applicants (<1%)',
    selectivityData: {
      acceptanceRate: 0.6,
      annualApplicants: 50000,
      annualRecipients: 300,
      selectionProcess: 'Application → Semifinalist → Finalist → Scholar selection',
      verificationUrl: 'https://www.thegatesscholarship.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highly competitive full-ride scholarship for exceptional Pell-eligible students',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Elite recognition combining academics, leadership, and overcoming adversity.',
    relevantMajors: ['all'],
    suggestedDescription: 'Gates Scholar (full-ride scholarship, 300 of 50,000+)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.4, stanford: 1.4, yale: 1.4, princeton: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.4.3', module: '2.4_ACADEMIC_RECOGNITION', section: 'Merit Scholarships', relevance: 'primary' },
    ],
  },
  {
    id: 'jack_kent_cooke',
    name: 'Jack Kent Cooke Young Scholar',
    aliases: ['JKC Young Scholar', 'Jack Kent Cooke Foundation Scholar'],
    category: 'scholarship',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~65 scholars from thousands of applicants',
    selectivityData: {
      acceptanceRate: 1,
      annualApplicants: 5000,
      annualRecipients: 65,
      selectionProcess: 'Application → Interview → Scholar selection',
      verificationUrl: 'https://www.jkcf.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highly selective scholarship for exceptional 7th graders from low-income families',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Early identification of exceptional talent with sustained support.',
    relevantMajors: ['all'],
    suggestedDescription: 'Jack Kent Cooke Young Scholar (~65 selected nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.4, stanford: 1.4, yale: 1.4, princeton: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.4.3', module: '2.4_ACADEMIC_RECOGNITION', section: 'Merit Scholarships', relevance: 'primary' },
    ],
  },
  {
    id: 'ipho_gold',
    name: 'International Physics Olympiad Gold Medal',
    aliases: ['IPhO Gold', 'Physics Olympiad Gold'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~50 gold medals globally',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 500000,
      annualRecipients: 50,
      selectionProcess: 'National selection → IPhO competition',
      verificationUrl: 'https://ipho-unofficial.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Gold medal at the International Physics Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Among the most prestigious physics achievements globally.',
    relevantMajors: ['physics', 'engineering', 'mathematics'],
    suggestedDescription: 'Gold Medal, International Physics Olympiad (top 50 worldwide)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Academic Olympiads', relevance: 'primary' },
    ],
  },
  {
    id: 'icho_gold',
    name: 'International Chemistry Olympiad Gold Medal',
    aliases: ['IChO Gold', 'Chemistry Olympiad Gold'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~35 gold medals globally',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 400000,
      annualRecipients: 35,
      selectionProcess: 'National selection → IChO competition',
      verificationUrl: 'https://icho.sk/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Gold medal at the International Chemistry Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Among the most prestigious chemistry achievements globally.',
    relevantMajors: ['chemistry', 'biochemistry', 'chemical_engineering'],
    suggestedDescription: 'Gold Medal, International Chemistry Olympiad (top 35 worldwide)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Academic Olympiads', relevance: 'primary' },
    ],
  },
  {
    id: 'ibo_gold',
    name: 'International Biology Olympiad Gold Medal',
    aliases: ['IBO Gold', 'Biology Olympiad Gold'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~30 gold medals globally',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 300000,
      annualRecipients: 30,
      selectionProcess: 'National selection → IBO competition',
      verificationUrl: 'https://www.ibo-info.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Gold medal at the International Biology Olympiad',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Among the most prestigious biology achievements globally.',
    relevantMajors: ['biology', 'biochemistry', 'pre_med'],
    suggestedDescription: 'Gold Medal, International Biology Olympiad (top 30 worldwide)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, caltech: 1.5, stanford: 1.4, harvard: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Academic Olympiads', relevance: 'primary' },
    ],
  },
  {
    id: 'ioi_gold',
    name: 'International Olympiad in Informatics Gold Medal',
    aliases: ['IOI Gold', 'Informatics Olympiad Gold'],
    category: 'academic_olympiad',
    recognitionLevel: 'international',
    selectivity: 'highly_selective',
    tier: 1,
    tierJustification: '~30 gold medals globally',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 300000,
      annualRecipients: 30,
      selectionProcess: 'National selection → IOI competition',
      verificationUrl: 'https://ioi-official.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Gold medal at the International Olympiad in Informatics',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Among the most prestigious computing achievements globally.',
    relevantMajors: ['computer_science', 'software_engineering'],
    suggestedDescription: 'Gold Medal, International Olympiad in Informatics (top 30 worldwide)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.5, stanford: 1.5, cmu: 1.5, caltech: 1.4 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Academic Olympiads', relevance: 'primary' },
    ],
  },

  // ============== TIER 2: OUTSTANDING (1-5% OR 500-5,000 recipients) ==============

  {
    id: 'regeneron_sts_scholar',
    name: 'Regeneron Science Talent Search Scholar',
    aliases: ['STS Scholar', 'Regeneron Scholar'],
    category: 'research_recognition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '12% selection rate, 300 scholars from 2,500 applicants',
    selectivityData: {
      acceptanceRate: 12,
      annualApplicants: 2500,
      annualRecipients: 300,
      selectionProcess: 'Original research submission → Scholar selection',
      verificationUrl: 'https://www.societyforscience.org/regeneron-sts/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top 300 research projects in the nation\'s premier science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Strong research credential. Indicates serious research engagement.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Scholar, Regeneron Science Talent Search (top 300 nationally)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.3, caltech: 1.3, stanford: 1.2, harvard: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Research Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'isef_finalist',
    name: 'ISEF Finalist',
    aliases: ['Regeneron ISEF Finalist', 'Intel ISEF Finalist'],
    category: 'science_fair',
    recognitionLevel: 'international',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~1,800 finalists from 7M initial participants',
    selectivityData: {
      acceptanceRate: 0.03,
      annualApplicants: 7000000,
      annualRecipients: 1800,
      selectionProcess: 'Local → Regional → State → ISEF Finals qualification',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Competed at the world\'s largest pre-college science competition',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Demonstrates strong research ability and commitment to scientific inquiry.',
    relevantMajors: ['sciences', 'engineering', 'research'],
    suggestedDescription: 'Finalist, Regeneron ISEF (top 1,800 of 7 million)',
    suggestedLevel: 'international',
    schoolSpecificValue: { mit: 1.3, caltech: 1.3, stanford: 1.2, harvard: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Fair Hierarchy', relevance: 'primary' },
    ],
  },
  {
    id: 'aime_qualifier',
    name: 'AIME Qualifier',
    aliases: ['American Invitational Mathematics Examination Qualifier', 'Made AIME'],
    category: 'academic_olympiad',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~5% of AMC participants, 6,000-7,000 qualifiers',
    selectivityData: {
      acceptanceRate: 5,
      annualApplicants: 130000,
      annualRecipients: 6500,
      selectionProcess: 'AMC 10/12 score threshold → AIME qualification',
      verificationUrl: 'https://www.maa.org/math-competitions',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Qualified for the second level of the AMC math competition series',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong math ability. Good baseline for STEM-focused applications.',
    relevantMajors: ['mathematics', 'physics', 'computer_science', 'engineering'],
    suggestedDescription: 'Qualifier, American Invitational Mathematics Examination (top 5%)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.2, caltech: 1.2, stanford: 1.1, harvard: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Math Olympiad Pathway', relevance: 'primary' },
    ],
  },
  {
    id: 'national_merit_semifinalist',
    name: 'National Merit Semifinalist',
    aliases: ['NMS Semifinalist', 'National Merit Semi'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~1% of test-takers, ~16,000 semifinalists annually',
    selectivityData: {
      acceptanceRate: 1,
      annualApplicants: 1600000,
      annualRecipients: 16000,
      selectionProcess: 'PSAT score → State-based cutoff threshold',
      verificationUrl: 'https://www.nationalmerit.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top 1% of PSAT test-takers nationally by state',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Confirms strong standardized test ability. Expected among competitive T20 applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Merit Semifinalist (top 1% of PSAT scores)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.0, stanford: 1.0, mit: 1.0, yale: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.4.1', module: '2.4_ACADEMIC_RECOGNITION', section: 'National Merit Program', relevance: 'primary' },
    ],
  },
  {
    id: 'rsi_attendee',
    name: 'Research Science Institute Attendee',
    aliases: ['RSI', 'RSI Participant', 'MIT RSI'],
    category: 'summer_program_selection',
    recognitionLevel: 'national',
    selectivity: 'highly_selective',
    tier: 2,
    tierJustification: '~2-3% acceptance rate, 80 participants from 3,000+ applicants',
    selectivityData: {
      acceptanceRate: 2.5,
      annualApplicants: 3500,
      annualRecipients: 80,
      selectionProcess: 'Application with research proposal → Selection committee review',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Highly selective summer research program at MIT',
    admissionsImpact: 'major',
    howAdmissionsViewIt: 'Indicates exceptional research potential. Strong signal for STEM admissions.',
    relevantMajors: ['sciences', 'engineering', 'mathematics'],
    suggestedDescription: 'Participant, Research Science Institute at MIT (2.5% acceptance)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.4, caltech: 1.3, stanford: 1.3, harvard: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.2.3', module: '2.2_STEM_AWARDS', section: 'Elite Research Programs', relevance: 'primary' },
    ],
  },
  {
    id: 'eagle_scout',
    name: 'Eagle Scout',
    aliases: ['Boy Scout Eagle', 'BSA Eagle Scout'],
    category: 'leadership',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~4-6% of Boy Scouts, ~61,000 annually',
    selectivityData: {
      acceptanceRate: 6,
      annualApplicants: 1000000,
      annualRecipients: 61000,
      selectionProcess: 'Rank advancement → Service project → Board of review',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Highest rank attainable in Boy Scouts of America',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Demonstrates sustained commitment, leadership, and service orientation.',
    relevantMajors: ['all'],
    suggestedDescription: 'Eagle Scout, Boy Scouts of America (top 6% of scouts)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.1, yale: 1.1, stanford: 1.0, princeton: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.5.2', module: '2.5_LEADERSHIP_SERVICE_AWARDS', section: 'Scouting Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'gold_award',
    name: 'Girl Scout Gold Award',
    aliases: ['Gold Award', 'Girl Scout Gold'],
    category: 'leadership',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~5-6% of eligible Girl Scouts',
    selectivityData: {
      acceptanceRate: 5.5,
      annualApplicants: 100000,
      annualRecipients: 5500,
      selectionProcess: 'Project proposal → Implementation → Council review',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Highest award in Girl Scouts, equivalent to Eagle Scout',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Demonstrates sustained commitment, leadership, and community impact.',
    relevantMajors: ['all'],
    suggestedDescription: 'Gold Award, Girl Scouts of the USA (top 5% of scouts)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.1, yale: 1.1, stanford: 1.0, princeton: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.5.2', module: '2.5_LEADERSHIP_SERVICE_AWARDS', section: 'Scouting Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'toc_qualifier',
    name: 'Tournament of Champions Qualifier',
    aliases: ['TOC Qualifier', 'TOC Qual', 'Debate TOC Qualifier'],
    category: 'debate_speech',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~500 qualifiers nationally through competitive bid system',
    selectivityData: {
      acceptanceRate: 2,
      annualApplicants: 25000,
      annualRecipients: 500,
      selectionProcess: 'Accumulate 2+ bids at qualifying tournaments',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Qualified for the pinnacle of national circuit debate',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong debate credential demonstrating competitive excellence.',
    relevantMajors: ['pre_law', 'political_science', 'philosophy', 'communications'],
    suggestedDescription: 'Qualifier, Tournament of Champions ([Event])',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.2, yale: 1.2, stanford: 1.1, princeton: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.3.4', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Debate & Speech', relevance: 'primary' },
    ],
  },
  {
    id: 'usaco_gold',
    name: 'USACO Gold Division',
    aliases: ['USACO Gold', 'USA Computing Olympiad Gold'],
    category: 'stem_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: 'Top ~5% of USACO participants, ~1,500 annually',
    selectivityData: {
      acceptanceRate: 5,
      annualApplicants: 20000,
      annualRecipients: 1500,
      selectionProcess: 'Bronze → Silver → Gold promotion through contests',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Second-highest division in the USA Computing Olympiad',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong programming and algorithmic ability. Solid STEM credential.',
    relevantMajors: ['computer_science', 'software_engineering', 'mathematics'],
    suggestedDescription: 'Gold Division, USA Computing Olympiad (top 5%)',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.2, stanford: 1.2, caltech: 1.2, cmu: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.2.4', module: '2.2_STEM_AWARDS', section: 'Computing Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'all_state_athletic',
    name: 'All-State Athletic Selection',
    aliases: ['All-State', 'All State Team'],
    category: 'athletic',
    recognitionLevel: 'state',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~1-2% of high school athletes in the sport',
    selectivityData: {
      acceptanceRate: 1.5,
      annualApplicants: 100000,
      annualRecipients: 1500,
      selectionProcess: 'Coaches/media selection based on performance',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Selected as one of the top athletes in the state for a sport',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong athletic achievement. Context depends on sport and state competitiveness.',
    relevantMajors: ['all'],
    suggestedDescription: 'All-State Selection, [Sport] (top 1-2% in state)',
    suggestedLevel: 'state_regional',
    schoolSpecificValue: { harvard: 1.1, stanford: 1.1, duke: 1.2, notre_dame: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.6.1', module: '2.6_ATHLETIC_AWARDS', section: 'Recognition Hierarchy', relevance: 'primary' },
    ],
  },
  {
    id: 'scholastic_national_silver',
    name: 'Scholastic Art & Writing Awards National Silver Medal',
    aliases: ['Scholastic Silver Medal', 'National Silver Medal'],
    category: 'arts_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~1% of submissions, ~2,500 recipients from 340,000 entries',
    selectivityData: {
      acceptanceRate: 0.7,
      annualApplicants: 340000,
      annualRecipients: 2500,
      selectionProcess: 'Regional judging → Gold Key → National adjudication',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Second-highest national recognition in the Scholastic Art & Writing Awards',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong creative talent. Good credential for arts-focused applications.',
    relevantMajors: ['creative_writing', 'visual_arts', 'design', 'journalism'],
    suggestedDescription: 'National Silver Medal, Scholastic Art & Writing Awards',
    suggestedLevel: 'national',
    schoolSpecificValue: { yale: 1.3, brown: 1.2, stanford: 1.1, harvard: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.3.1', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Scholastic Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'questbridge_finalist',
    name: 'QuestBridge National College Match Finalist',
    aliases: ['QuestBridge Finalist', 'QuestBridge Match Finalist'],
    category: 'scholarship',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~6,000 finalists from 18,000+ applicants',
    selectivityData: {
      acceptanceRate: 33,
      annualApplicants: 18000,
      annualRecipients: 6000,
      selectionProcess: 'Application → Finalist selection → College matching',
      verificationUrl: 'https://www.questbridge.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Finalist in program connecting high-achieving low-income students with top colleges',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong credential for high-achieving students from low-income backgrounds.',
    relevantMajors: ['all'],
    suggestedDescription: 'QuestBridge National College Match Finalist',
    suggestedLevel: 'national',
    schoolSpecificValue: { stanford: 1.3, yale: 1.3, princeton: 1.3, mit: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.4.3', module: '2.4_ACADEMIC_RECOGNITION', section: 'Merit Scholarships', relevance: 'primary' },
    ],
  },
  {
    id: 'science_olympiad_national',
    name: 'Science Olympiad National Medalist',
    aliases: ['Science Olympiad Nationals Medal', 'Science Olympiad National'],
    category: 'academic_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: 'Top 3 in event from 120 teams nationally',
    selectivityData: {
      acceptanceRate: 2.5,
      annualApplicants: 5000,
      annualRecipients: 120,
      selectionProcess: 'Invitational → Regional → State → Nationals → Event medals',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Medal winner at Science Olympiad National Tournament',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Demonstrates STEM excellence through team competition.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: 'National Medalist, Science Olympiad ([Event])',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.2, caltech: 1.2, stanford: 1.1, harvard: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.2.5', module: '2.2_STEM_AWARDS', section: 'Science Olympiad', relevance: 'primary' },
    ],
  },
  {
    id: 'deca_icdc',
    name: 'DECA ICDC Top Placer',
    aliases: ['DECA Internationals', 'DECA ICDC Winner', 'DECA International'],
    category: 'entrepreneurship',
    recognitionLevel: 'international',
    selectivity: 'selective',
    tier: 2,
    tierJustification: 'Top placer from thousands of competitors internationally',
    selectivityData: {
      acceptanceRate: 3,
      annualApplicants: 20000,
      annualRecipients: 600,
      selectionProcess: 'District → State → ICDC qualification → Competition rounds',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top placement at DECA International Career Development Conference',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong business/marketing competition achievement.',
    relevantMajors: ['business', 'marketing', 'entrepreneurship', 'economics'],
    suggestedDescription: 'Top 10, DECA International Career Development Conference',
    suggestedLevel: 'international',
    schoolSpecificValue: { wharton: 1.3, stanford: 1.1, harvard: 1.1, mit: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.5.3', module: '2.5_LEADERSHIP_SERVICE_AWARDS', section: 'Business Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'mathcounts_national',
    name: 'MATHCOUNTS National Competition Top Placer',
    aliases: ['MATHCOUNTS Nationals', 'MATHCOUNTS National Top 12'],
    category: 'academic_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: 'Top 12 from 100,000+ participants',
    selectivityData: {
      acceptanceRate: 0.01,
      annualApplicants: 100000,
      annualRecipients: 12,
      selectionProcess: 'School → Chapter → State → National competition',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top placement at MATHCOUNTS National Competition',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Exceptional early math ability (middle school competition).',
    relevantMajors: ['mathematics', 'computer_science', 'engineering'],
    suggestedDescription: 'Top 12, MATHCOUNTS National Competition',
    suggestedLevel: 'national',
    schoolSpecificValue: { mit: 1.3, caltech: 1.3, stanford: 1.2, harvard: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.2.1', module: '2.2_STEM_AWARDS', section: 'Math Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'national_merit_finalist',
    name: 'National Merit Finalist',
    aliases: ['NMS Finalist', 'National Merit Scholarship Finalist'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~15,000 finalists from 1.6M test-takers (~1%)',
    selectivityData: {
      acceptanceRate: 1,
      annualApplicants: 1600000,
      annualRecipients: 15000,
      selectionProcess: 'PSAT score → Semifinalist → Application → Finalist',
      verificationUrl: 'https://www.nationalmerit.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top 1% of PSAT test-takers who completed finalist application',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Confirms strong standardized test ability. Expected among competitive T20 applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Merit Finalist (top 1%)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.0, stanford: 1.0, mit: 1.0, yale: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.4.1', module: '2.4_ACADEMIC_RECOGNITION', section: 'National Merit Program', relevance: 'primary' },
    ],
  },
  {
    id: 'youngarts_winner_merit',
    name: 'YoungArts Winner (Merit/Honorable Mention)',
    aliases: ['YoungArts Merit', 'YoungArts Honorable Mention'],
    category: 'arts_competition',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~700 winners total from 10,000+ applicants',
    selectivityData: {
      acceptanceRate: 7,
      annualApplicants: 10000,
      annualRecipients: 700,
      selectionProcess: 'Portfolio/audition submission → Panel review',
      verificationUrl: 'https://youngarts.org/',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'National recognition in the YoungArts program',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Strong arts credential. Valued at schools with strong arts programs.',
    relevantMajors: ['visual_arts', 'music', 'dance', 'theater', 'film', 'creative_writing'],
    suggestedDescription: 'Winner, National YoungArts (Merit/Honorable Mention)',
    suggestedLevel: 'national',
    schoolSpecificValue: { yale: 1.3, brown: 1.2, nyu: 1.3, stanford: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.3.2', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'YoungArts', relevance: 'primary' },
    ],
  },
  {
    id: 'congressional_gold',
    name: 'Congressional Award Gold Medal',
    aliases: ['Congressional Gold', 'Congressional Award Gold'],
    category: 'leadership',
    recognitionLevel: 'national',
    selectivity: 'selective',
    tier: 2,
    tierJustification: '~1,500-2,000 recipients annually (most demanding level)',
    selectivityData: {
      acceptanceRate: 3,
      annualApplicants: 50000,
      annualRecipients: 1800,
      selectionProcess: 'Complete all requirements: Voluntary Public Service, Personal Development, Physical Fitness, Expedition',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Highest honor bestowed by Congress on youth for civic engagement',
    admissionsImpact: 'moderate',
    howAdmissionsViewIt: 'Demonstrates sustained commitment across multiple dimensions.',
    relevantMajors: ['all'],
    suggestedDescription: 'Gold Medal, Congressional Award (400+ hours service)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.2, yale: 1.2, stanford: 1.1, georgetown: 1.3 },
    researchCitations: [
      { sourceId: 'sec2.5.1', module: '2.5_LEADERSHIP_SERVICE_AWARDS', section: 'Congressional Award', relevance: 'primary' },
    ],
  },

  // ============== TIER 3: STRONG (5-15% selection rate) ==============

  {
    id: 'scholastic_gold_key',
    name: 'Scholastic Art & Writing Awards Gold Key',
    aliases: ['Gold Key', 'Scholastic Gold Key', 'Regional Gold Key'],
    category: 'arts_competition',
    recognitionLevel: 'regional',
    selectivity: 'competitive',
    tier: 3,
    tierJustification: '~7% of submissions at regional level, ~23,000 Gold Keys',
    selectivityData: {
      acceptanceRate: 7,
      annualApplicants: 340000,
      annualRecipients: 23000,
      selectionProcess: 'Regional jury evaluation of submitted work',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top regional recognition in the Scholastic Art & Writing Awards',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Good creative achievement. Solid arts credential but common among strong applicants.',
    relevantMajors: ['creative_writing', 'visual_arts', 'design', 'journalism'],
    suggestedDescription: 'Gold Key, Scholastic Art & Writing Awards ([Category])',
    suggestedLevel: 'state_regional',
    schoolSpecificValue: { yale: 1.1, brown: 1.1, stanford: 1.0, harvard: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.3.1', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Scholastic Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'ap_scholar_distinction',
    name: 'AP Scholar with Distinction',
    aliases: ['AP Scholar w/ Distinction', 'APSWD'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'competitive',
    tier: 3,
    tierJustification: '~4-10% of AP test takers, demonstrates consistent excellence',
    selectivityData: {
      acceptanceRate: 7,
      annualApplicants: 2800000,
      annualRecipients: 200000,
      selectionProcess: 'Average score ≥3.5 on all APs + ≥3 on 5+ exams',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Highest tier of AP Scholar recognition based on exam performance',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Confirms academic rigor. Expected among competitive T20 applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'AP Scholar with Distinction (avg 3.5+ on 5+ AP exams)',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.0, stanford: 1.0, mit: 1.0, yale: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.4.2', module: '2.4_ACADEMIC_RECOGNITION', section: 'AP Scholar Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'state_science_fair_top3',
    name: 'State Science Fair Top 3',
    aliases: ['State Fair Winner', 'State Science Fair Champion'],
    category: 'science_fair',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    tier: 3,
    tierJustification: '~5% of state participants, strong regional achievement',
    selectivityData: {
      acceptanceRate: 5,
      annualApplicants: 1000,
      annualRecipients: 50,
      selectionProcess: 'Regional fair → State competition → Category judging',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Top placement at state-level science fair competition',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Good research foundation. Supports STEM narrative but not distinctive alone.',
    relevantMajors: ['sciences', 'engineering'],
    suggestedDescription: '[Placement], [State] Science Fair ([Category])',
    suggestedLevel: 'state_regional',
    schoolSpecificValue: { mit: 1.0, caltech: 1.0, stanford: 1.0, harvard: 1.0 },
    researchCitations: [
      { sourceId: 'sec2.2.2', module: '2.2_STEM_AWARDS', section: 'Science Fair Hierarchy', relevance: 'supporting' },
    ],
  },
  {
    id: 'all_state_music',
    name: 'All-State Music Ensemble',
    aliases: ['All-State Orchestra', 'All-State Band', 'All-State Choir'],
    category: 'arts_competition',
    recognitionLevel: 'state',
    selectivity: 'competitive',
    tier: 3,
    tierJustification: '~1-5% of auditioning students, varies by state',
    selectivityData: {
      acceptanceRate: 3,
      annualApplicants: 10000,
      annualRecipients: 300,
      selectionProcess: 'Audition → All-Region → All-State selection',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Selected for state-level honor ensemble in music',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Strong musical achievement. Supports arts narrative.',
    relevantMajors: ['music', 'music_education', 'performing_arts'],
    suggestedDescription: 'All-State [Ensemble] (audition-based selection)',
    suggestedLevel: 'state_regional',
    schoolSpecificValue: { yale: 1.1, brown: 1.1, oberlin: 1.3, northwestern: 1.2 },
    researchCitations: [
      { sourceId: 'sec2.3.3', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'Music Competitions', relevance: 'primary' },
    ],
  },
  {
    id: 'national_history_day_qualifier',
    name: 'National History Day Qualifier',
    aliases: ['NHD Nationals', 'National History Day Finals'],
    category: 'academic_competition',
    recognitionLevel: 'national',
    selectivity: 'competitive',
    tier: 3,
    tierJustification: '~1-2% of initial participants qualify for nationals',
    selectivityData: {
      acceptanceRate: 2,
      annualApplicants: 600000,
      annualRecipients: 12000,
      selectionProcess: 'School → District → State → National qualification',
    },
    authenticity: {
      verificationDifficulty: 'moderate',
      publicResults: true,
      organizationReputation: 'excellent',
    },
    description: 'Qualified for national competition in historical research',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Demonstrates research and presentation skills in humanities.',
    relevantMajors: ['history', 'political_science', 'humanities'],
    suggestedDescription: 'National Qualifier, National History Day ([Category])',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 1.1, yale: 1.1, princeton: 1.1, georgetown: 1.1 },
    researchCitations: [
      { sourceId: 'sec2.3.8', module: '2.3_ARTS_HUMANITIES_AWARDS', section: 'National History Day', relevance: 'primary' },
    ],
  },

  // ============== TIER 4: BASELINE (15%+ or merit threshold) ==============

  {
    id: 'nhs_member',
    name: 'National Honor Society Member',
    aliases: ['NHS', 'National Honor Society'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'merit_based',
    tier: 4,
    tierJustification: 'Merit threshold (GPA + service), 60-80% of T20 applicants have',
    selectivityData: {
      acceptanceRate: 30,
      annualApplicants: 3000000,
      annualRecipients: 1000000,
      selectionProcess: 'GPA threshold + teacher recommendations + service hours',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'School-based honor society for academic achievement and service',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Expected baseline. Absence notable; presence not distinctive.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Honor Society (Chapter Officer optional)',
    suggestedLevel: 'school',
    schoolSpecificValue: { harvard: 0.9, stanford: 0.9, mit: 0.9, yale: 0.9 },
    researchCitations: [
      { sourceId: 'sec2.4.4', module: '2.4_ACADEMIC_RECOGNITION', section: 'Honor Societies', relevance: 'primary' },
    ],
  },
  {
    id: 'ap_scholar',
    name: 'AP Scholar',
    aliases: ['AP Scholar Award'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'merit_based',
    tier: 4,
    tierJustification: '~28% of AP test takers qualify',
    selectivityData: {
      acceptanceRate: 28,
      annualApplicants: 2800000,
      annualRecipients: 780000,
      selectionProcess: 'Score ≥3 on 3+ AP exams',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Basic AP Scholar recognition for passing multiple AP exams',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Baseline credential. Expected among competitive applicants.',
    relevantMajors: ['all'],
    suggestedDescription: 'AP Scholar',
    suggestedLevel: 'school',
    schoolSpecificValue: { harvard: 0.9, stanford: 0.9, mit: 0.9, yale: 0.9 },
    researchCitations: [
      { sourceId: 'sec2.4.2', module: '2.4_ACADEMIC_RECOGNITION', section: 'AP Scholar Awards', relevance: 'primary' },
    ],
  },
  {
    id: 'national_merit_commended',
    name: 'National Merit Commended Student',
    aliases: ['Commended Scholar', 'National Merit Commended'],
    category: 'standardized_test',
    recognitionLevel: 'national',
    selectivity: 'competitive',
    tier: 4,
    tierJustification: 'Top 3% of PSAT takers (~50,000 annually)',
    selectivityData: {
      acceptanceRate: 3,
      annualApplicants: 1600000,
      annualRecipients: 50000,
      selectionProcess: 'PSAT score above national threshold',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'Recognition for top 3% of PSAT scores nationally',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Confirms testing ability but below Semifinalist threshold.',
    relevantMajors: ['all'],
    suggestedDescription: 'National Merit Commended Student',
    suggestedLevel: 'national',
    schoolSpecificValue: { harvard: 0.9, stanford: 0.9, mit: 0.9, yale: 0.9 },
    researchCitations: [
      { sourceId: 'sec2.4.1', module: '2.4_ACADEMIC_RECOGNITION', section: 'National Merit Program', relevance: 'primary' },
    ],
  },
  {
    id: 'honor_roll',
    name: 'Honor Roll',
    aliases: ["Principal's Honor Roll", "Dean's List", 'High Honor Roll'],
    category: 'academic_honor',
    recognitionLevel: 'school',
    selectivity: 'merit_based',
    tier: 4,
    tierJustification: 'GPA threshold typically captures 20-40% of students',
    selectivityData: {
      acceptanceRate: 30,
      annualApplicants: 10000,
      annualRecipients: 3000,
      selectionProcess: 'GPA threshold (typically 3.5+)',
    },
    authenticity: {
      verificationDifficulty: 'easy',
      publicResults: false,
      organizationReputation: 'excellent',
    },
    description: 'School-based recognition for academic achievement',
    admissionsImpact: 'minor',
    howAdmissionsViewIt: 'Expected baseline. Transcript shows grades directly.',
    relevantMajors: ['all'],
    suggestedDescription: 'Honor Roll (4 years) or similar',
    suggestedLevel: 'school',
    schoolSpecificValue: { harvard: 0.8, stanford: 0.8, mit: 0.8, yale: 0.8 },
    researchCitations: [
      { sourceId: 'sec2.4.5', module: '2.4_ACADEMIC_RECOGNITION', section: 'School-Based Honors', relevance: 'supporting' },
    ],
  },
];

// ============================================================================
// KNOWLEDGE BASE SERVICE CLASS
// ============================================================================

/**
 * Award Knowledge Base Service
 *
 * Provides selective retrieval of research-backed award knowledge.
 */
export class AwardKnowledgeBaseService {
  private awardDatabase: Map<string, EnhancedKnownAwardProfile>;
  private awardsByTier: Map<number, EnhancedKnownAwardProfile[]>;
  private awardsByCategory: Map<AwardCategory, EnhancedKnownAwardProfile[]>;
  private moduleRegistry: Map<string, ResearchModule>;

  constructor() {
    this.awardDatabase = new Map();
    this.awardsByTier = new Map([
      [1, []],
      [2, []],
      [3, []],
      [4, []],
    ]);
    this.awardsByCategory = new Map();
    this.moduleRegistry = new Map();

    this.initializeDatabase();
    this.initializeModuleRegistry();
  }

  /**
   * Initialize the award database with indexed lookups
   */
  private initializeDatabase(): void {
    for (const award of ENHANCED_AWARD_DATABASE) {
      // Primary ID lookup
      this.awardDatabase.set(award.id, award);

      // Name lookup (critical for matching)
      this.awardDatabase.set(award.name.toLowerCase(), award);

      // Alias lookups
      for (const alias of award.aliases) {
        this.awardDatabase.set(alias.toLowerCase(), award);
      }

      // Tier index
      const tierAwards = this.awardsByTier.get(award.tier) || [];
      tierAwards.push(award);
      this.awardsByTier.set(award.tier, tierAwards);

      // Category index
      const categoryAwards = this.awardsByCategory.get(award.category) || [];
      categoryAwards.push(award);
      this.awardsByCategory.set(award.category, categoryAwards);
    }
  }

  /**
   * Initialize the research module registry
   */
  private initializeModuleRegistry(): void {
    for (const module of RESEARCH_MODULES) {
      this.moduleRegistry.set(module.id, module);
    }
  }

  // ============================================================================
  // AWARD LOOKUP METHODS
  // ============================================================================

  /**
   * Look up an award by name or ID with fuzzy matching
   */
  lookupAward(nameOrId: string): EnhancedKnownAwardProfile | null {
    const normalized = nameOrId.toLowerCase().trim();

    // Direct lookup
    if (this.awardDatabase.has(normalized)) {
      return this.awardDatabase.get(normalized) || null;
    }

    // Fuzzy matching
    let bestMatch: EnhancedKnownAwardProfile | null = null;
    let bestScore = 0;

    for (const award of ENHANCED_AWARD_DATABASE) {
      const score = this.calculateMatchScore(normalized, award);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = award;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between input and award
   */
  private calculateMatchScore(input: string, award: EnhancedKnownAwardProfile): number {
    const inputLower = input.toLowerCase();
    const nameLower = award.name.toLowerCase();

    // Exact match
    if (inputLower === nameLower) return 1.0;

    // Check aliases
    for (const alias of award.aliases) {
      const aliasLower = alias.toLowerCase();
      if (inputLower === aliasLower) return 0.95;
      // For partial matches, require minimum length to avoid false positives
      // (e.g., "RSI" matching "varsity" due to substring)
      if (aliasLower.length >= 5) {
        if (aliasLower.includes(inputLower) || inputLower.includes(aliasLower)) {
          return 0.8;
        }
      }
    }

    // Partial match on name
    if (nameLower.includes(inputLower) || inputLower.includes(nameLower)) {
      return 0.7;
    }

    // Word overlap - require meaningful overlap
    // Filter out common stop words and short words that cause false matches
    const stopWords = new Set([
      'the', 'a', 'an', 'of', 'in', 'at', 'for', 'to', 'and', 'or', 'with', 'top',
      'award', 'awards', 'medal', 'winner', 'national', 'state', 'regional', 'school',
      'local', 'district', 'gold', 'silver', 'bronze', 'first', 'second', 'third',
      // Common domain terms that are too generic
      'science', 'fair', 'olympiad', 'competition', 'exam', 'test', 'challenge',
    ]);
    const filterWords = (words: Set<string>) =>
      new Set([...words].filter((w) => w.length >= 3 && !stopWords.has(w)));

    const inputWords = filterWords(new Set(inputLower.split(/\s+/)));
    const nameWords = filterWords(new Set(nameLower.split(/\s+/)));
    const overlap = [...inputWords].filter((w) => nameWords.has(w)).length;

    // Require at least 2 meaningful word overlaps AND 50%+ word match
    // to avoid false matches on generic terms
    const overlapRatio = overlap / Math.min(inputWords.size, nameWords.size);
    if (overlap >= 2 && overlapRatio >= 0.5) {
      return 0.5 + (overlap / Math.max(inputWords.size, nameWords.size)) * 0.3;
    }

    return 0;
  }

  /**
   * Get all awards by tier
   */
  getAwardsByTier(tier: AwardTier): EnhancedKnownAwardProfile[] {
    return this.awardsByTier.get(tier) || [];
  }

  /**
   * Get all awards by category
   */
  getAwardsByCategory(category: AwardCategory): EnhancedKnownAwardProfile[] {
    return this.awardsByCategory.get(category) || [];
  }

  /**
   * Get tier 1 awards (for comparison/context)
   */
  getTier1Benchmarks(): EnhancedKnownAwardProfile[] {
    return this.getAwardsByTier(1);
  }

  // ============================================================================
  // RESEARCH MODULE METHODS
  // ============================================================================

  /**
   * Get relevant research modules for a category
   */
  getRelevantModules(category: AwardCategory): ResearchModule[] {
    const modules: ResearchModule[] = [];

    // Always include tier classification and authenticity
    const coreModule = this.moduleRegistry.get('2.1');
    const authModule = this.moduleRegistry.get('2.7');
    if (coreModule) modules.push(coreModule);
    if (authModule) modules.push(authModule);

    // Add category-specific module
    for (const module of RESEARCH_MODULES) {
      if (module.categories.length === 0) continue; // Skip universal modules (already added)
      if (module.categories.includes(category)) {
        modules.push(module);
      }
    }

    return modules;
  }

  /**
   * Get research module by ID
   */
  getModule(moduleId: string): ResearchModule | null {
    return this.moduleRegistry.get(moduleId) || null;
  }

  /**
   * Search research modules by keyword
   */
  searchModules(keyword: string): ResearchModule[] {
    const keywordLower = keyword.toLowerCase();
    return RESEARCH_MODULES.filter(
      (module) =>
        module.keyTopics.some((topic) => topic.includes(keywordLower)) ||
        module.title.toLowerCase().includes(keywordLower) ||
        module.focus.toLowerCase().includes(keywordLower)
    );
  }

  // ============================================================================
  // CITATION GENERATION
  // ============================================================================

  /**
   * Generate citation for an insight
   */
  generateCitation(moduleId: string, section: string, quote?: string): ResearchCitation {
    return {
      sourceId: `sec${moduleId}`,
      module: this.moduleRegistry.get(moduleId)?.path.split('/').pop() || moduleId,
      section,
      quote,
      relevance: 'primary',
    };
  }

  /**
   * Get all citations for an award
   */
  getAwardCitations(awardId: string): ResearchCitation[] {
    const award = this.awardDatabase.get(awardId);
    return award?.researchCitations || [];
  }

  // ============================================================================
  // CONTEXT AND INSIGHTS
  // ============================================================================

  /**
   * Get research-backed insight for a topic
   */
  getInsight(topic: string): ResearchBackedInsight | null {
    const insights = this.getInsightsForTopic(topic);
    return insights.length > 0 ? insights[0] : null;
  }

  /**
   * Get multiple insights for a topic
   */
  private getInsightsForTopic(topic: string): ResearchBackedInsight[] {
    const topicLower = topic.toLowerCase();
    const insights: ResearchBackedInsight[] = [];

    // Topic-specific insights based on research
    if (topicLower.includes('national merit')) {
      insights.push({
        insight:
          'National Merit Semifinalist status appears on 60-80% of T20 applications, making it expected rather than distinctive.',
        confidence: 'high',
        citations: [this.generateCitation('2.4', 'National Merit Program')],
        applicability: ['tier_assessment', 'competitive_context'],
      });
    }

    if (topicLower.includes('olympiad') || topicLower.includes('usamo')) {
      insights.push({
        insight:
          'USAMO qualification (<0.01% selection) places among the strongest possible STEM credentials, comparable to Regeneron STS Finalist.',
        confidence: 'high',
        citations: [this.generateCitation('2.2', 'Academic Olympiads')],
        applicability: ['tier_assessment', 'stem_evaluation'],
      });
    }

    if (topicLower.includes('paper award') || topicLower.includes('pay to play')) {
      insights.push({
        insight:
          'Organizations like NSHSS and Who\'s Who directories are "pay-to-play" with no selective process. Including these can signal poor judgment to admissions officers.',
        confidence: 'high',
        citations: [this.generateCitation('2.7', 'Pay-to-Play Detection')],
        applicability: ['authenticity_check', 'red_flag_detection'],
      });
    }

    if (topicLower.includes('context') || topicLower.includes('geographic')) {
      insights.push({
        insight:
          'All-State recognition from California, Texas, or New York carries more weight than the same recognition from less competitive states.',
        confidence: 'high',
        citations: [this.generateCitation('2.1', 'Context Modifiers')],
        applicability: ['context_calibration', 'tier_adjustment'],
      });
    }

    return insights;
  }

  // ============================================================================
  // STATISTICS AND METADATA
  // ============================================================================

  /**
   * Get database statistics
   */
  getStatistics(): {
    totalAwards: number;
    byTier: Record<number, number>;
    byCategory: Record<string, number>;
    modulesAvailable: number;
  } {
    const byCategory: Record<string, number> = {};
    for (const [category, awards] of this.awardsByCategory) {
      byCategory[category] = awards.length;
    }

    return {
      totalAwards: ENHANCED_AWARD_DATABASE.length,
      byTier: {
        1: this.awardsByTier.get(1)?.length || 0,
        2: this.awardsByTier.get(2)?.length || 0,
        3: this.awardsByTier.get(3)?.length || 0,
        4: this.awardsByTier.get(4)?.length || 0,
      },
      byCategory,
      modulesAvailable: RESEARCH_MODULES.length,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const awardKnowledgeBase = new AwardKnowledgeBaseService();
