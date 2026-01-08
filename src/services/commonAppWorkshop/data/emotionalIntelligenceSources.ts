/**
 * Emotional Intelligence & Vulnerability Deep Research Sources
 *
 * EXTRACTED FROM: Perplexity Deep Research on "Emotional Intelligence and Authentic Vulnerability" (January 2025)
 *
 * KEY CATEGORIES:
 * 1. Emotional Maturity Definitions (AO perspectives)
 * 2. Authentic vs Performed Vulnerability
 * 3. Trauma Dumping vs Appropriate Struggle
 * 4. Empathy Demonstration
 * 5. Self-Awareness Indicators
 * 6. Emotional Complexity
 * 7. Neuroscience of Emotional Writing
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// SECTION 1: EMOTIONAL MATURITY DEFINITIONS
// ============================================================================

export const EMOTIONAL_MATURITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_ivyboost_navigation',
    type: 'expert_guidance',
    title: 'Navigating Messy Emotions',
    author: 'IvyBoost',
    author_title: 'Admissions Coaching Expert',
    publication: 'Writing Emotional Intelligence for Application Essays',
    date: '2024-01',
    quote: "True emotional intelligence is about navigating messy emotions, not getting rid of them entirely. The most compelling essays acknowledge ongoing struggles while showing developed coping mechanisms.",
    relevance_to_claim: 'Maturity means managing emotions, not eliminating them',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['navigating', 'messy emotions', 'ongoing struggles'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['compelling essays', 'coping mechanisms'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['acknowledge', 'show'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_sparkadmissions_voice',
    type: 'expert_guidance',
    title: 'Honest Voice Stands Out',
    author: 'SparkAdmissions',
    author_title: 'College Admissions Expert',
    publication: 'What Do Colleges Look For in Essays',
    date: '2024-01',
    quote: "An honest, emotionally intelligent voice stands out, especially at selective colleges, where many other applicants may present similar credentials. Colleges want to see your capacity for growth.",
    relevance_to_claim: 'Emotional intelligence differentiates at elite schools',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['honest voice', 'stands out'] },
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['selective colleges', 'similar credentials'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['capacity for growth'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'justifying_severity', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_essay_formula', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_emory_community',
    type: 'admissions_quote',
    title: 'Community Impact Evaluation',
    author: 'Emory Admissions Blog',
    author_title: 'Emory University Admissions',
    publication: 'Strong Personal Statements',
    date: '2021-09',
    quote: "Will the student be involved? Will they support their community members? Will the student challenge community norms for the betterment of everyone?",
    relevance_to_claim: 'AOs evaluate predicted community contribution',
    weight_in_calculation: 93,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 100, aspect: 'principle', keywords_matched: ['community', 'betterment', 'involved'] },
      cliche_topic_framing: { score: 90, aspect: 'solution', keywords_matched: ['support', 'challenge norms'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['will the student'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['collaboration', 'intellectual_community'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_value_signaling', 'cliche_topic_framing', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 2: AUTHENTIC VS PERFORMED VULNERABILITY
// ============================================================================

export const VULNERABILITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_dartmouth_ao_tmi',
    type: 'admissions_quote',
    title: 'Personal vs TMI',
    author: 'Former Dartmouth Admissions Officer',
    author_title: 'Top Tier Admissions',
    publication: 'College Essays I Read Were Terrible',
    date: '2024-01',
    quote: "Confusing 'Personal' with 'TMI' is the #1 mistake. Oversharing is not the same as being reflective. Admissions officers don't need the play-by-play of your first kiss, breakup, or emotional spiral unless it's directly tied to your growth or academic trajectory.",
    relevance_to_claim: 'Vulnerability must serve growth narrative, not just shock',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'dartmouth',
      applicable_colleges: ['dartmouth'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['TMI', 'oversharing', 'play-by-play'] },
      cliche_narrative_arc: { score: 90, aspect: 'warning', keywords_matched: ['growth', 'trajectory'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['reflective'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_ivycoach_earned',
    type: 'expert_guidance',
    title: 'Earned vs Cheap Vulnerability',
    author: 'Ivy Coach',
    author_title: 'Elite Admissions Expert',
    publication: 'Vulnerable Confessions in College Essays',
    date: '2024-01',
    quote: "While it's ok to be vulnerable in college admissions essays, it's not ok to be gross, and it's not ok to devote the most valuable real estate you have in your application to something as silly as farting.",
    relevance_to_claim: 'Vulnerability must serve purpose and maintain dignity',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'warning', keywords_matched: ['valuable real estate', 'silly'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['vulnerable', 'ok to be'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['what_to_avoid', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_collegematchpoint_flat',
    type: 'expert_guidance',
    title: 'Polished But Emotionally Flat',
    author: 'College Match Point',
    author_title: 'Admissions Expert',
    publication: 'AI Detection Era',
    date: '2024-01',
    quote: "'Perfectly Polished but Emotionally Flat' is a major red flag. If your essay reads like a well-edited blog post but lacks heart, it might not land.",
    relevance_to_claim: 'Technical quality without emotional depth fails',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'warning', keywords_matched: ['well-edited', 'lacks heart'] },
      cliche_language: { score: 90, aspect: 'warning', keywords_matched: ['polished', 'flat'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['blog post'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },
];

// ============================================================================
// SECTION 3: TRAUMA DUMPING VS APPROPRIATE STRUGGLE
// ============================================================================

export const TRAUMA_STRUGGLE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_collegewise_resolution',
    type: 'expert_guidance',
    title: 'Resolution Not Problem',
    author: 'Collegewise',
    author_title: 'College Counseling Experts',
    publication: 'Is Personal Struggle Appropriate Essay Topic',
    date: '2024-01',
    quote: "Essays about personal struggles should focus on resolution, not just the problem. Emphasize growth, impact, and reflection. The therapeutic value of writing differs fundamentally from the evaluative purpose of admissions essays.",
    relevance_to_claim: 'Struggle essays must show resolution and growth',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'solution', keywords_matched: ['resolution', 'growth', 'impact'] },
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['personal struggles', 'reflection'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['emphasize', 'focus on'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['narrative_structure', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['challenge_setback', 'personal_statement', 'personal_growth'],
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_topic_framing', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_wordvice_sympathy',
    type: 'expert_guidance',
    title: 'Sympathy Approach Fails',
    author: 'Wordvice',
    author_title: 'Essay Writing Expert',
    publication: 'Admissions Essay Mistakes to Avoid',
    date: '2024-01',
    quote: "These types of essays are usually a long list of all the terrible things that have happened to you with the hope that the admissions committee will take pity. Newsflash: the 'sympathy approach' likely is not going to work. Even if something harmed you, reframe to show how you shifted priorities and succeeded.",
    relevance_to_claim: 'Victim narratives without agency fail',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['terrible things', 'sympathy', 'pity'] },
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['reframe', 'shifted', 'succeeded'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['list of', 'will not work'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['narrative_structure', 'fresh_perspective'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['challenge_setback', 'personal_statement', 'background_identity'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_readiness_concern',
    type: 'research_study',
    title: 'Readiness Concerns from Unprocessed Trauma',
    author: 'Mad in America / Admissions Research',
    author_title: 'Admissions Research',
    publication: 'Red Flags for Applicants',
    date: '2019-05',
    finding: "Admissions officers worry when essays show 'unresolved' struggles. Some institutions place red flags on applications discussing psychological challenges, particularly when presented without evidence of successful management. Can raise concern and lead AOs to question readiness for college.",
    relevance_to_claim: 'Unprocessed trauma raises readiness concerns',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['unresolved', 'red flags', 'readiness'] },
      cliche_narrative_arc: { score: 90, aspect: 'warning', keywords_matched: ['successful management'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_problem'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['challenge_setback', 'personal_statement'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'warning',
  },
];

// ============================================================================
// SECTION 4: EMPATHY & SELF-CONGRATULATION
// ============================================================================

export const EMPATHY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_service_cliche',
    type: 'admissions_quote',
    title: 'Shopworn Service Narratives',
    author: 'Writing Center of Princeton',
    author_title: 'Essay Expert',
    publication: 'Four Worst Essay Mistakes',
    date: '2024-01',
    quote: "'The week I worked in an orphanage/urban center' ranks among 'the two most shopworn essay topics.' Essays about service must focus less on what you did and more on what happened next—the learning, the complications, the ongoing questions.",
    relevance_to_claim: 'Generic service essays are among worst clichés',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['shopworn', 'orphanage', 'urban center'] },
      cliche_essay_formula: { score: 95, aspect: 'warning', keywords_matched: ['worst essay topics'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['what happened next', 'learning'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['impact_on_others', 'vulnerability'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['community_contribution', 'meaningful_activity', 'personal_statement'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_essay_formula', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_they_helped_me',
    type: 'admissions_quote',
    title: 'They Helped Me Cliché',
    author: 'Reddit AskReddit (AO compilation)',
    author_title: 'Admissions Officer Perspectives',
    publication: 'AO Pet Peeves',
    date: '2016-01',
    quote: "'I went there to help them but they ended up helping me!' is a major pet peeve for admissions officers. It reduces complex human interactions to transactional self-improvement and positions the writer as condescending savior.",
    relevance_to_claim: 'Service trip epiphanies are overdone and problematic',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'warning', keywords_matched: ['helped me', 'transactional'] },
      cliche_topic_framing: { score: 95, aspect: 'warning', keywords_matched: ['pet peeve', 'savior'] },
      cliche_narrative_arc: { score: 90, aspect: 'warning', keywords_matched: ['complex human interactions'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['impact_on_others', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['community_contribution', 'meaningful_activity'],
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_topic_framing', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_collaborative_exchange',
    type: 'expert_guidance',
    title: 'Collaborative Exchange',
    author: 'Distinctive College Consulting',
    author_title: 'Admissions Expert',
    publication: 'Why Writing About Privilege Backfires',
    date: '2024-01',
    quote: "Strong impact essays depict the exchange as a collaborative and mutually enriching one rather than positioning the writer as savior. Focus on small-scale impact with depth rather than claiming to have changed everything.",
    relevance_to_claim: 'Mutuality and depth beat grand claims',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['collaborative', 'mutually enriching'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['small-scale', 'depth'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['not savior'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['authenticity', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['community_contribution', 'meaningful_activity', 'extracurricular_impact'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_inspirational', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 5: SELF-AWARENESS & PRIVILEGE
// ============================================================================

export const SELF_AWARENESS_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_privilege_backfire',
    type: 'expert_guidance',
    title: 'Privilege Essays Backfire',
    author: 'Distinctive College Consulting',
    author_title: 'Admissions Expert',
    publication: 'Why Writing About Privilege Backfires',
    date: '2024-01',
    quote: "If all your essay does is highlight your own realization that you are wealthy, white, or experience other forms of privilege, you will have told them nothing new. They already know your demographics. Focus on what you DID with awareness, not the awareness itself.",
    relevance_to_claim: 'Action over recognition for privilege acknowledgment',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['privilege', 'told them nothing new'] },
      cliche_inspirational: { score: 90, aspect: 'warning', keywords_matched: ['realization'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['what you DID', 'action'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['background_identity', 'diversity_perspective', 'personal_statement'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_inspirational', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_harvard_self_awareness',
    type: 'expert_guidance',
    title: 'Strengths AND Weaknesses',
    author: 'BeatTheGMAT / Harvard Perspective',
    author_title: 'Admissions Research',
    publication: 'How to Demonstrate Self-Awareness',
    date: '2009-12',
    quote: "Self-aware applicants demonstrate knowledge of both your strengths AND weaknesses. The willingness to acknowledge limitations signals maturity and growth potential. Don't just describe an event without explaining what you learned or how it changed you.",
    relevance_to_claim: 'Self-awareness requires acknowledging both strengths and weaknesses',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['strengths AND weaknesses'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['learned', 'changed you'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['maturity', 'growth potential'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'intellectual_vitality'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'telling_not_showing', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 6: EMOTIONAL COMPLEXITY & ENDINGS
// ============================================================================

export const EMOTIONAL_COMPLEXITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_false_closure',
    type: 'expert_guidance',
    title: 'Avoid False Closure',
    author: 'EssayHub / CollegeVine',
    author_title: 'Essay Writing Expert',
    publication: 'How to End a College Essay',
    date: '2024-01',
    quote: "Leave the ending a little open to show you're still learning and figuring things out. Phrases like 'I learned that,' 'That was when I realized,' 'The most important lesson' often feel reductive. This kind of ending works when you want to highlight self-awareness—you're showing that you're not pretending to have it all figured out.",
    relevance_to_claim: 'Open endings show maturity; false closure signals immaturity',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'warning', keywords_matched: ['I learned that', 'most important lesson'] },
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['open', 'still learning'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['figuring things out'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_essay_formula', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_ongoing_struggle',
    type: 'expert_guidance',
    title: 'Ongoing Struggles Show Maturity',
    author: 'IvyBoost',
    author_title: 'Admissions Expert',
    publication: 'Writing Emotional Intelligence',
    date: '2024-01',
    quote: "Maybe you still freeze up sometimes, but you're able to let it go now instead of beating yourself up over it. If you were truly able to eradicate your shyness and become a consistently incredible speaker, that's great—but usually, things are not quite so simple.",
    relevance_to_claim: 'Acknowledging ongoing challenges is more authentic than claiming complete transformation',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['still', 'not quite so simple'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['freeze up', 'let it go'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['usually', 'things'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 7: NEUROSCIENCE OF EMOTIONAL WRITING
// ============================================================================

export const NEUROSCIENCE_EMOTION_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_neuro_oxytocin',
    type: 'research_study',
    title: 'Oxytocin and Story Engagement',
    author: 'Paul Zak',
    author_title: 'Neuroeconomist, Claremont Graduate University',
    publication: 'PMC / Neuroscience Research',
    date: '2015-01',
    finding: "Emotionally engaging stories could boost oxytocin levels by up to 47%. When the story elicited an increase in both ACTH and oxytocin, donations were 261 percent higher. By measuring how your peripheral nervous system responds to a story, we can almost perfectly predict what you'll do before you do it with 82% accuracy.",
    relevance_to_claim: 'Emotional stories create measurable physiological engagement',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['emotionally engaging', 'oxytocin'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['story', 'peripheral nervous system'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['vulnerability', 'specificity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ei_neuro_mirror',
    type: 'research_study',
    title: 'Mirror Neurons and Story Absorption',
    author: 'DIY Genius / Neuroscience Compilation',
    author_title: 'Neuroscience of Storytelling',
    publication: 'Mirror Neuron Research',
    date: '2023-01',
    finding: "Mirror neurons are triggered inside our brains when we watch the actions of others, creating 'emotional contagion' where your brain will respond like you're being chased by a tiger, too. This mechanism enables 'transportation' (losing ourselves in the story) and 'identification' (taking on character perspective).",
    relevance_to_claim: 'Readers neurologically experience what writers describe',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['mirror neurons', 'emotional contagion'] },
      cliche_metaphor: { score: 90, aspect: 'solution', keywords_matched: ['transportation', 'identification'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'vulnerability'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ei_narrative_brain',
    type: 'research_study',
    title: 'Default Mode Network and Story Processing',
    author: 'PNAS',
    author_title: 'National Academy of Sciences',
    publication: 'Narratives and the Brain',
    date: '2021-01',
    finding: "Narratives activate the default mode network, including the medial prefrontal cortex, posterior cingulate cortex, and temporal lobes—regions involved in mental simulation and theory of mind. This explains why story-based essays create stronger empathetic responses than abstract descriptions.",
    relevance_to_claim: 'Stories engage brain regions for empathy and perspective-taking',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['narratives', 'mental simulation'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['empathetic responses', 'theory of mind'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure', 'vulnerability'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },
];

// ============================================================================
// SECTION 8: ADDITIONAL SOURCES FROM DEEP RESEARCH (January 2025)
// Source: Perplexity Deep Research - Complete Extraction
// ============================================================================

export const ADDITIONAL_EI_SOURCES: EnhancedLabeledSource[] = [
  // --- EMOTIONAL MATURITY ADDITIONAL ---
  {
    source_id: 'ei_harvard_managing_director',
    type: 'admissions_quote',
    title: 'Life Experiences Shape Perspective',
    author: 'Harvard Managing Director of Admissions',
    author_title: 'Former Managing Director, Harvard Admissions',
    publication: 'Harvard Admissions Guidance',
    date: '2024-01',
    quote: "Candidates should share how their life experiences have shaped their outlook and perspective about the world. The emphasis is on how experience creates new understanding, not merely on the experience itself.",
    relevance_to_claim: 'Essays should show perspective transformation, not just experience',
    weight_in_calculation: 94,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'principle', keywords_matched: ['shaped outlook', 'perspective', 'understanding'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['how experience creates', 'new understanding'] },
      cliche_topic_framing: { score: 85, aspect: 'principle', keywords_matched: ['life experiences', 'shaped'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'proving_weight', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'telling_not_showing', 'cliche_topic_framing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_sparkadmissions_reflection',
    type: 'expert_guidance',
    title: 'Power of Self-Reflection',
    author: 'SparkAdmissions',
    author_title: 'College Admissions Expert',
    publication: 'What Do Colleges Look For in Essays',
    date: '2024-01',
    quote: "A powerful essay shows self-reflection, maturity, and awareness. Colleges want to see your capacity for growth. Essays that showcase this kind of personal development demonstrate that you'll be an engaged, thoughtful member of your campus community.",
    relevance_to_claim: 'Growth capacity predicts campus contribution',
    weight_in_calculation: 90,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['self-reflection', 'maturity', 'growth'] },
      cliche_narrative_arc: { score: 85, aspect: 'principle', keywords_matched: ['personal development', 'capacity for growth'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['engaged', 'thoughtful'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'impact_on_others'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- VULNERABILITY ADDITIONAL ---
  {
    source_id: 'ei_linkedin_controlled_risk',
    type: 'expert_guidance',
    title: 'Controlled Risk-Taking in Vulnerability',
    author: 'Tasneem Damji',
    author_title: 'LinkedIn Vulnerability Expert',
    publication: 'Power of Vulnerability in College Essays',
    date: '2024-01',
    quote: "Genuine vulnerability involves disclosures that feel personally risky while maintaining appropriate boundaries. Truly vulnerable essays show their vulnerability, that tell the story of something they've struggled with in the past and how they have grown from it.",
    relevance_to_claim: 'Vulnerability must be bounded risk-taking, not oversharing',
    weight_in_calculation: 85,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 90, aspect: 'solution', keywords_matched: ['boundaries', 'controlled', 'grown from it'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['struggled', 'grown'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_performative_detection',
    type: 'expert_guidance',
    title: 'Detecting Performative Vulnerability',
    author: 'InMySacredSpace',
    author_title: 'Authenticity Research',
    publication: 'Performative Vulnerability',
    date: '2024-01',
    quote: "A key indicator of performative vulnerability is when sharing serves to 'demonstrate emotional superiority or evolved-ness' rather than genuine connection. Using vulnerability specifically as a means of making yourself appear more authentic so that you can boost your public perception negates the authenticity.",
    relevance_to_claim: 'Detection mechanism for fake vulnerability',
    weight_in_calculation: 88,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 100, aspect: 'warning', keywords_matched: ['emotional superiority', 'evolved-ness', 'public perception'] },
      cliche_topic_framing: { score: 90, aspect: 'warning', keywords_matched: ['performative', 'negates authenticity'] },
      cliche_ai_convergence: { score: 85, aspect: 'warning', keywords_matched: ['appear more authentic'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'cliche_avoidance'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_value_signaling', 'cliche_topic_framing', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_neuro_congruence',
    type: 'research_study',
    title: 'Emotional Congruence Detection',
    author: 'PMC Emotional Processing Research',
    author_title: 'Neuroscience Research',
    publication: 'Emotional Processing in Reading',
    date: '2014-01',
    finding: "Readers automatically infer emotional states and detect mismatches between implied and stated emotions, experiencing cognitive dissonance when these conflict. When emotional words matched the emotional state implied by the narrative, readers processed them considerably more rapidly than mismatched emotion words.",
    relevance_to_claim: 'Scientific basis for why readers detect inauthenticity',
    weight_in_calculation: 90,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'principle', keywords_matched: ['mismatches', 'cognitive dissonance', 'detect'] },
      telling_not_showing: { score: 90, aspect: 'principle', keywords_matched: ['infer emotional states', 'implied'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ei_earned_vulnerability_test',
    type: 'expert_guidance',
    title: 'Four-Part Earned Vulnerability Test',
    author: 'Writers Digest / Cult of Pedagogy',
    author_title: 'Narrative Craft Experts',
    publication: 'How to Create a Narrative Arc',
    date: '2023-01',
    quote: "Earned vulnerability requires: (1) Narrative building - context that makes the vulnerable moment comprehensible and necessary, (2) Proportional disclosure - vulnerability matches the essay's scope, (3) Developmental connection - vulnerability relates to demonstrating growth relevant to college readiness, (4) Purposeful integration - the vulnerable moment serves the essay's larger argument rather than existing for shock value.",
    relevance_to_claim: 'Four-part test for whether vulnerability is earned',
    weight_in_calculation: 92,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'solution', keywords_matched: ['narrative building', 'proportional', 'purposeful'] },
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['comprehensible', 'developmental connection', 'growth'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['larger argument', 'not shock value'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['narrative_structure', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation', 'elite_example'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // --- EMPATHY ADDITIONAL ---
  {
    source_id: 'ei_nih_empathy_markers',
    type: 'research_study',
    title: 'Four Markers of Demonstrated Empathy',
    author: 'NIH / Empathy Research',
    author_title: 'National Institutes of Health',
    publication: 'Understanding Others: The Importance of Perspective-Taking',
    date: '2021-01',
    finding: "Empathy manifests through: (1) Perspective-taking language - 'I tried to imagine her perspective', (2) Comparative reflection - explicitly comparing one's assumptions with others', (3) Emotional attunement descriptions - capturing nuanced awareness of others' emotional states, (4) Systemic understanding - recognizing patterns beyond individual interactions.",
    relevance_to_claim: 'Four markers of demonstrated empathy in writing',
    weight_in_calculation: 90,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 95, aspect: 'solution', keywords_matched: ['perspective-taking', 'emotional attunement', 'systemic'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['demonstrate', 'comparative reflection'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['nuanced awareness'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['vulnerability', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['community_contribution', 'meaningful_activity', 'personal_statement', 'diversity_perspective'],
        colleges: 'all',
        issue_types: ['cliche_value_signaling', 'telling_not_showing', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_cea_impact_depth',
    type: 'expert_guidance',
    title: 'Depth Over Scale',
    author: 'College Essay Advisors',
    author_title: 'Elite Admissions Consulting',
    publication: 'The Impact Essay',
    date: '2024-01',
    quote: "Impact essays that demonstrate empathy show awareness of 'systemic inequities' while maintaining focus on collaborative rather than savior-oriented responses. Focus on 'small-scale' impact with genuine depth rather than claims of massive change. Evidence should be specific and behavioral.",
    relevance_to_claim: 'Systems awareness + depth beats scale claims',
    weight_in_calculation: 88,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['small-scale', 'depth', 'collaborative'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['not savior-oriented', 'specific'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['systemic inequities', 'behavioral'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['community_contribution', 'meaningful_activity', 'extracurricular_impact'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_inspirational', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_arberson_privileged_topics',
    type: 'admissions_quote',
    title: 'Privileged Topics Require Extra Care',
    author: 'Sarah Arberson',
    author_title: 'Former Admissions Officer',
    publication: 'Privilege: A New Bias in College Admissions',
    date: '2024-01',
    quote: "Family trips, expensive hobbies, attending a private/boarding school, and community service are difficult topics to pull off in an essay and can very easily come across as self serving at elite colleges.",
    relevance_to_claim: 'Privileged topics require extra care to avoid self-serving appearance',
    weight_in_calculation: 90,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'warning', keywords_matched: ['family trips', 'expensive hobbies', 'self serving'] },
      cliche_value_signaling: { score: 95, aspect: 'warning', keywords_matched: ['community service', 'difficult to pull off'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['elite colleges'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['authenticity', 'vulnerability'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_value_signaling', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'warning',
  },

  // --- EMOTIONAL COMPLEXITY ADDITIONAL ---
  {
    source_id: 'ei_uwa_complex_emotions',
    type: 'research_study',
    title: 'Definition of Emotional Complexity',
    author: 'UWA Emotional Psychology',
    author_title: 'University of Western Australia',
    publication: 'Emotional Psychology Research',
    date: '2023-01',
    finding: "Complex emotions include love, embarrassment, envy, gratitude, guilt, pride, and worry - often occurring together. Complex emotions are defined as 'any emotion that is an aggregate of two or more others'. Showing multiple, sometimes contradictory emotions demonstrates sophistication.",
    relevance_to_claim: 'Definition of emotional complexity for rubric',
    weight_in_calculation: 85,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['contradictory emotions', 'aggregate', 'sophistication'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['complex emotions', 'together'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_rephrasely_vocabulary',
    type: 'expert_guidance',
    title: 'Nuanced Emotional Vocabulary',
    author: 'Rephrasely',
    author_title: 'Writing Enhancement Expert',
    publication: 'Creating Emotional Resonance in Writing',
    date: '2024-01',
    quote: "Moving beyond basic emotions (happy, sad, angry, afraid) to more specific states. Writers should ask: 'What specific shade of emotion was this? Not just sad but melancholic, wistful, regretful?' Effective use of tension not only keeps readers on their toes but also elicits emotions such as anger, fear, or excitement.",
    relevance_to_claim: 'Nuanced emotional vocabulary as quality marker',
    weight_in_calculation: 82,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'solution', keywords_matched: ['specific shade', 'melancholic', 'wistful', 'regretful'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['beyond basic emotions'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_collegevine_epiphany_warning',
    type: 'expert_guidance',
    title: 'Epiphany Pitfall Warning',
    author: 'CollegeVine',
    author_title: 'College Admissions Platform',
    publication: 'How to End Your College Essay',
    date: '2024-01',
    quote: "A personal essay in which you are a bit of a blockhead for six pages, only to realize in the last paragraph, 'Hey, I'm a blockhead!' will have your reader asking why you didn't realize this on Page 1.",
    relevance_to_claim: 'Warning against sudden realization endings',
    weight_in_calculation: 88,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'warning', keywords_matched: ['sudden realization', 'last paragraph', 'blockhead'] },
      cliche_inspirational: { score: 90, aspect: 'warning', keywords_matched: ['realize'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['six pages', 'last paragraph'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['authenticity', 'vulnerability'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ei_quad_four_endings',
    type: 'expert_guidance',
    title: 'Four Effective Ending Strategies',
    author: 'Quad Education Group',
    author_title: 'College Counseling Expert',
    publication: 'How to End a College Essay',
    date: '2024-01',
    quote: "Effective endings: (1) Open endings - show you're still learning, (2) Full circle - return to opening with transformed understanding, (3) Action-oriented - end with forward movement, (4) Perspective shift - show changed perspective or future goals. The key is that uncertainty must feel intentional, not like you ran out of things to say.",
    relevance_to_claim: 'Four effective ending strategies',
    weight_in_calculation: 88,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['open endings', 'full circle', 'action-oriented'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['still learning', 'forward movement'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['transformed understanding', 'perspective shift'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_inspirational', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_movingwriters_ambiguity',
    type: 'expert_guidance',
    title: 'Productive Uncertainty',
    author: 'Moving Writers',
    author_title: 'Writing Education Expert',
    publication: 'The Value of Ambiguity',
    date: '2022-06',
    quote: "Sometimes, there isn't one right answer. Expressing uncertainty can signal sophisticated thinking. The ability to exist 'in uncertainties, mysteries, and doubts' marks intellectual maturity. Position uncertainty as driver of continued growth rather than paralysis.",
    relevance_to_claim: 'Uncertainty as maturity marker',
    weight_in_calculation: 85,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['uncertainty', 'sophisticated thinking', 'intellectual maturity'] },
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['no right answer', 'continued growth'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['mysteries', 'doubts'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['intellectual_vitality', 'authenticity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_essay_formula', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- ADDITIONAL NEUROSCIENCE ---
  {
    source_id: 'ei_zak_prediction_accuracy',
    type: 'research_study',
    title: 'Story Response Predicts Behavior',
    author: 'Paul Zak',
    author_title: 'Neuroeconomist, Claremont Graduate University',
    publication: 'PMC Neuroscience of Storytelling',
    date: '2015-01',
    finding: "By measuring how your peripheral nervous system responds to a story, we can almost perfectly predict what you'll do before you do it with 82% accuracy. When the story elicited an increase in both ACTH and oxytocin, donations were 261 percent higher.",
    relevance_to_claim: 'Stories don\'t just engage - they predict behavior',
    weight_in_calculation: 90,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['predict', 'oxytocin', 'story'] },
      cliche_essay_formula: { score: 85, aspect: 'principle', keywords_matched: ['82% accuracy', '261 percent higher'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ei_cortisol_attention',
    type: 'research_study',
    title: 'Cortisol and Conflict Attention',
    author: 'Ingenuius Prep Neuroscience',
    author_title: 'Neuroscience Research',
    publication: 'Why Stories Stick',
    date: '2024-01',
    finding: "Cortisol, released during moments of conflict or suspense, heightens attention and focus. Emotional content commands scarce neural resources - if a story does not sustain attention, the brain will look for something else more interesting.",
    relevance_to_claim: 'Why conflict/tension is neurologically necessary',
    weight_in_calculation: 85,
    last_verified: '2025-01-05',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'principle', keywords_matched: ['conflict', 'suspense', 'attention'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['emotional content', 'scarce neural resources'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  // ============================================================================
  // SUPPLEMENTAL EI SOURCES (January 2025 - Additional Deep Research)
  // Source: Perplexity Deep Research on "Emotional Intelligence and Authentic Vulnerability"
  // ============================================================================

  // --- IMMATURE VS MATURE REFLECTION ---
  {
    source_id: 'ei_passive_victim_flag',
    type: 'expert_guidance',
    title: 'Passive Victim Red Flag',
    author: 'Admissions Research Synthesis',
    author_title: 'Admissions Expert Compilation',
    publication: 'Mature vs Immature Reflection',
    date: '2025-01',
    quote: "Immature navel-gazing presents self as passive victim rather than active agent, and focuses on the scale of suffering rather than the nature of response. The critical distinction lies in outward orientation versus self-absorption.",
    relevance_to_claim: 'Victim framing signals immaturity',
    weight_in_calculation: 92,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'problem', keywords_matched: ['passive victim', 'scale of suffering'] },
      cliche_inspirational: { score: 95, aspect: 'problem', keywords_matched: ['navel-gazing', 'self-absorption'] },
      telling_not_showing: { score: 85, aspect: 'problem', keywords_matched: ['active agent', 'nature of response'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_outward_orientation',
    type: 'expert_guidance',
    title: 'Outward Orientation Test',
    author: 'Research Synthesis',
    author_title: 'Admissions Research',
    publication: 'Reflection Quality Framework',
    date: '2025-01',
    quote: "Mature reflection connects personal experience to broader lessons applicable beyond the self and demonstrates awareness of impact on others and community context. It shows evolution in thinking rather than static self-description.",
    relevance_to_claim: 'Mature essays look outward, not just inward',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['broader lessons', 'evolution in thinking'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['impact on others', 'community context'] },
      cliche_value_signaling: { score: 85, aspect: 'principle', keywords_matched: ['applicable beyond the self'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'impact_on_others'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- AUTHENTICITY DETECTION ---
  {
    source_id: 'ei_timing_inconsistency',
    type: 'expert_guidance',
    title: 'Emotional Timing Red Flag',
    author: 'Expert Analysis',
    author_title: 'Authenticity Research',
    publication: 'Detecting Manufactured Emotion',
    date: '2025-01',
    quote: "Emotions that appear or resolve too quickly relative to the described situation signal manufacture. Natural emotional arcs follow comprehensible patterns; artificial ones feel abrupt or mechanistic.",
    relevance_to_claim: 'Timing reveals manufactured vs genuine emotion',
    weight_in_calculation: 88,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'problem', keywords_matched: ['resolve too quickly', 'abrupt', 'mechanistic'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['signal manufacture', 'artificial'] },
      cliche_ai_convergence: { score: 90, aspect: 'problem', keywords_matched: ['comprehensible patterns'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'narrative_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_essay_formula', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_strategic_deployment',
    type: 'expert_guidance',
    title: 'Checkbox Vulnerability Detection',
    author: 'Authenticity Analysis',
    author_title: 'Expert Guidance',
    publication: 'Strategic vs Organic Vulnerability',
    date: '2025-01',
    quote: "When vulnerability appears calculated to check boxes rather than emerging organically from the narrative, authenticity is negated. Using 'vulnerability specifically as a means of making yourself appear more authentic so that you can boost your public perception' defeats the purpose.",
    relevance_to_claim: 'Strategic vulnerability reads as inauthentic',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 100, aspect: 'problem', keywords_matched: ['check boxes', 'calculated'] },
      cliche_value_signaling: { score: 95, aspect: 'problem', keywords_matched: ['appear more authentic', 'boost perception'] },
      cliche_ai_convergence: { score: 85, aspect: 'problem', keywords_matched: ['defeats the purpose'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_value_signaling', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- TRAUMA PROCESSING TEST ---
  {
    source_id: 'ei_processed_vs_raw',
    type: 'expert_guidance',
    title: 'Processed vs Raw Trauma Test',
    author: 'GrowthThruChange',
    author_title: 'Emotional Processing Expert',
    publication: 'Trauma Dumping vs Vulnerability',
    date: '2025-01',
    quote: "Appropriate struggle sharing is Processed and Reflected (the experience has been sufficiently integrated that the writer can discuss it with perspective), Boundaried (the writer maintains appropriate emotional containment), and Forward-Looking (connects past struggle to present strength and future readiness).",
    relevance_to_claim: 'Three-part test for appropriate vulnerability',
    weight_in_calculation: 91,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['processed', 'boundaried', 'forward-looking'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['integrated', 'perspective'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['present strength', 'future readiness'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_narrative_arc', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- EMPATHY DEMONSTRATION ---
  {
    source_id: 'ei_perspective_taking_language',
    type: 'research_study',
    title: 'Perspective-Taking Language',
    author: 'NIH Research',
    author_title: 'National Institutes of Health',
    publication: 'Empathy in Narrative Writing',
    date: '2024-01',
    quote: "Techniques like 'I tried to imagine her perspective' or 'I tried to look at their perspective in addition to my own' signal active perspective-taking. Narrative writing training increases empathy specifically through 'identification with a character and the reflection on their possible emotions'.",
    relevance_to_claim: 'Specific language signals genuine empathy',
    weight_in_calculation: 89,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['imagine her perspective', 'identification'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['reflection on emotions', 'active perspective-taking'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['in addition to my own'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['vulnerability', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle', 'providing_examples', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_value_signaling', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_systemic_vs_individual',
    type: 'expert_guidance',
    title: 'Systemic Awareness in Empathy',
    author: 'Impact Essay Research',
    author_title: 'College Essay Advisors',
    publication: 'The Impact Essay',
    date: '2025-01',
    quote: "Impact essays that demonstrate empathy show awareness of 'systemic inequities' while maintaining focus on collaborative rather than savior-oriented responses. Moving beyond individual interactions to recognizing patterns of need or structural challenges.",
    relevance_to_claim: 'Systems thinking shows advanced empathy',
    weight_in_calculation: 87,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 100, aspect: 'solution', keywords_matched: ['systemic inequities', 'collaborative'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['not savior-oriented', 'structural challenges'] },
      cliche_topic_framing: { score: 85, aspect: 'solution', keywords_matched: ['patterns of need'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'principle_explanation'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_value_signaling', 'cliche_inspirational', 'cliche_topic_framing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // --- SELF-AWARENESS LANGUAGE ---
  {
    source_id: 'ei_limitation_structure',
    type: 'expert_guidance',
    title: 'Limitation Acknowledgment Structure',
    author: 'Admissions Guidance',
    author_title: 'Self-Awareness Expert',
    publication: 'Showing Limitations Maturely',
    date: '2025-01',
    quote: "Acknowledge Without Dwelling: Successful essays mention limitations in context of growth: 'I struggled with time management but learned to prioritize my tasks' shows maturity. The structure moves quickly from acknowledgment to adaptation.",
    relevance_to_claim: 'Specific structure for discussing limitations',
    weight_in_calculation: 88,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['in context of growth', 'acknowledgment to adaptation'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['shows maturity', 'learned to'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['struggled with', 'but learned'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle', 'providing_examples', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_actions_speak',
    type: 'expert_guidance',
    title: 'Actions Over Claims',
    author: 'Expert Guidance',
    author_title: 'Confidence-Humility Balance',
    publication: 'Confident Without Arrogant',
    date: '2025-01',
    quote: "Rather than saying 'I am the smartest student,' describe 'a project you worked hard on or a challenge you overcame. Let your actions do the talking.' Use phrases like 'I contributed to my team's success' rather than claiming sole credit.",
    relevance_to_claim: 'Show confidence through specific actions',
    weight_in_calculation: 89,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['actions do the talking', 'describe a project'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['rather than claiming', 'I contributed'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['challenge you overcame'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'providing_examples', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_value_signaling', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // --- ENDINGS WITHOUT FALSE CLOSURE ---
  {
    source_id: 'ei_open_ending_example',
    type: 'expert_guidance',
    title: 'Open Ending Example',
    author: 'Essay Ending Research',
    author_title: 'Narrative Structure Expert',
    publication: 'How to End Essays',
    date: '2025-01',
    quote: "The envelope sat unopened on the table. My hands hovered above it for a moment before pulling back. I wasn't ready. Not yet. But I would be. — This ending shows ongoing process while maintaining forward momentum without false closure.",
    relevance_to_claim: 'Concrete example of effective open ending',
    weight_in_calculation: 86,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'solution', keywords_matched: ['ongoing process', 'forward momentum'] },
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['without false closure', 'not yet but'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['I would be'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['authenticity', 'vulnerability'],
      teaching_moment_types: ['elite_example', 'before_after'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['providing_examples', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_essay_formula', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export const ALL_EMOTIONAL_INTELLIGENCE_SOURCES: EnhancedLabeledSource[] = [
  ...EMOTIONAL_MATURITY_SOURCES,
  ...VULNERABILITY_SOURCES,
  ...TRAUMA_STRUGGLE_SOURCES,
  ...EMPATHY_SOURCES,
  ...SELF_AWARENESS_SOURCES,
  ...EMOTIONAL_COMPLEXITY_SOURCES,
  ...NEUROSCIENCE_EMOTION_SOURCES,
  ...ADDITIONAL_EI_SOURCES,  // NEW: Additional sources from deep research
];

/**
 * Get all Emotional Intelligence sources
 */
export function getEmotionalIntelligenceSources(): EnhancedLabeledSource[] {
  return ALL_EMOTIONAL_INTELLIGENCE_SOURCES;
}

/**
 * Get source count by category
 */
export function getEmotionalIntelligenceStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {
    emotional_maturity: EMOTIONAL_MATURITY_SOURCES.length,
    vulnerability: VULNERABILITY_SOURCES.length,
    trauma_struggle: TRAUMA_STRUGGLE_SOURCES.length,
    empathy: EMPATHY_SOURCES.length,
    self_awareness: SELF_AWARENESS_SOURCES.length,
    emotional_complexity: EMOTIONAL_COMPLEXITY_SOURCES.length,
    neuroscience: NEUROSCIENCE_EMOTION_SOURCES.length,
    additional_deep_research: ADDITIONAL_EI_SOURCES.length,  // NEW
  };

  return {
    total: ALL_EMOTIONAL_INTELLIGENCE_SOURCES.length,
    byCategory,
  };
}
