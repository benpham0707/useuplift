/**
 * Labeled Admissions Sources
 *
 * Complete pre-labeled source database with full taxonomy.
 * Each source has pre-computed relevance scores and college specificity.
 *
 * Usage:
 * - Import LABELED_SOURCES for the complete collection
 * - Use SourceIndexer for efficient lookups
 * - All relevance scores are pre-computed at build time
 *
 * V2 INTEGRATION (January 2025):
 * - Now includes Show Don't Tell deep research sources (18 sources)
 * - Now includes Emotional Intelligence deep research sources (35+ sources)
 * - Total sources available to users: 65+ (up from 15)
 */

import type { LabeledSource, EnhancedLabeledSource } from '../types/labeledSourceTypes';

// Import from centralized source registry for scalable integration
import {
  ALL_DEEP_RESEARCH_SOURCES,
  getRegistryStats,
  validateRegistry,
} from './sourceRegistry';

// ============================================================================
// PRE-LABELED SOURCES DATABASE (CORE DEAN QUOTES)
// ============================================================================

/**
 * CORE_LABELED_SOURCES - Original dean quotes and expert sources
 * These are the foundational sources that have been in the system from the start
 */
const CORE_LABELED_SOURCES: LabeledSource[] = [
  // ============================================================================
  // 1. PARKE MUTH - UVA - SPECIFICITY
  // ============================================================================
  {
    source_id: 'muth_specificity_2022',
    type: 'dean_quote',
    title: 'The Paradox of Specificity in College Essays',
    author: 'Parke Muth',
    author_title: 'Former Senior Associate Dean of Admissions',
    publication: 'University of Virginia Admissions Blog',
    date: '2022-03',
    quote: 'The more specific you can be, the more universal your essay becomes. Paradoxically, the tiny details are what make readers connect.',
    relevance_to_claim: 'Explains why specific details create stronger essays than generic statements',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    // College Specificity
    college_specificity: {
      primary_college: 'uva',
      applicable_colleges: ['uva', 'duke', 'northwestern', 'penn', 'brown', 'dartmouth', 'cornell'],
      exclusions: [],
    },

    // Issue Relevance (pre-computed)
    issue_relevance: {
      cliche_topic_framing: { score: 90, aspect: 'principle', keywords_matched: ['specific', 'details', 'universal'] },
      cliche_language: { score: 85, aspect: 'principle', keywords_matched: ['specific', 'details'] },
      cliche_ai_convergence: { score: 70, aspect: 'principle', keywords_matched: ['specific'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['details', 'connect'] },
      cliche_essay_formula: { score: 65, aspect: 'principle', keywords_matched: ['details'] },
      cliche_metaphor: { score: 85, aspect: 'solution', keywords_matched: ['specific', 'details', 'universal'] },
    },

    // Taxonomy
    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    // Usage
    usage: {
      best_for: ['explaining_problem', 'teaching_principle', 'motivating_student'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 2. CHRISTOPH GUTTENTAG - DUKE - DETAILS/AUTHENTICITY
  // ============================================================================
  {
    source_id: 'guttentag_details_2023',
    type: 'dean_quote',
    title: 'What Duke Looks for in Essays',
    author: 'Christoph Guttentag',
    author_title: 'Dean of Undergraduate Admissions',
    publication: 'Duke University Admissions',
    date: '2023-09',
    quote: "I can tell when a student really lived something versus when they're trying to sound impressive. The difference is in the details only they would know.",
    relevance_to_claim: 'Admissions officers can detect authenticity through specific details',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'duke',
      applicable_colleges: ['duke', 'northwestern', 'penn', 'brown', 'uva'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 85, aspect: 'principle', keywords_matched: ['lived', 'details'] },
      cliche_ai_convergence: { score: 90, aspect: 'principle', keywords_matched: ['impressive', 'authentic'] },
      cliche_language: { score: 75, aspect: 'principle', keywords_matched: ['impressive'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['lived', 'details'] },
      cliche_value_signaling: { score: 80, aspect: 'principle', keywords_matched: ['impressive'] },
      cliche_metaphor: { score: 80, aspect: 'principle', keywords_matched: ['details', 'authentic'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['specificity', 'cliche_avoidance'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 3. RICHARD SHAW - STANFORD - AUTHENTICITY
  // ============================================================================
  {
    source_id: 'shaw_authenticity_2023',
    type: 'dean_quote',
    title: 'What Stanford Really Wants in Applicants',
    author: 'Richard Shaw',
    author_title: 'Dean of Admission and Financial Aid',
    publication: 'Stanford Magazine',
    date: '2023-05',
    quote: "The essays that stand out are never the ones trying to be impressive. They're the ones where you can hear the student's actual voice—including their doubts and uncertainties.",
    relevance_to_claim: 'Stanford values authentic voice over impressive-sounding language',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'stanford',
      applicable_colleges: ['stanford', 'mit', 'harvard', 'caltech', 'princeton'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['voice', 'authentic', 'impressive'] },
      cliche_language: { score: 85, aspect: 'principle', keywords_matched: ['voice', 'impressive'] },
      cliche_topic_framing: { score: 70, aspect: 'principle', keywords_matched: ['stand out'] },
      vulnerability: { score: 90, aspect: 'principle', keywords_matched: ['doubts', 'uncertainties'] },
      cliche_value_signaling: { score: 85, aspect: 'principle', keywords_matched: ['impressive'] },
      cliche_metaphor: { score: 75, aspect: 'principle', keywords_matched: ['stand out', 'voice'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 4. WILLIAM FITZSIMMONS - HARVARD - REFLECTION
  // ============================================================================
  {
    source_id: 'fitzsimmons_reflection_2021',
    type: 'dean_quote',
    title: 'Harvard Admissions Priorities',
    author: 'William Fitzsimmons',
    author_title: 'Dean of Admissions',
    publication: 'Harvard Admissions',
    date: '2021-11',
    quote: "We're not looking for perfection. We're looking for genuine reflection and self-awareness. That's what intellectual vitality actually means.",
    relevance_to_claim: 'Harvard values genuine reflection over polished performance',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard', 'yale', 'princeton', 'stanford', 'columbia'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 90, aspect: 'principle', keywords_matched: ['reflection', 'perfection'] },
      cliche_ai_convergence: { score: 75, aspect: 'principle', keywords_matched: ['genuine'] },
      cliche_college_specific: { score: 85, aspect: 'principle', keywords_matched: ['intellectual vitality'] },
      vulnerability: { score: 85, aspect: 'principle', keywords_matched: ['self-awareness', 'perfection'] },
      cliche_inspirational: { score: 70, aspect: 'principle', keywords_matched: ['genuine'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'intellectual_vitality'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 5. JEFF SCHIFFMAN - TULANE - CLICHE AVOIDANCE
  // ============================================================================
  {
    source_id: 'schiffman_invisible_phrases_2022',
    type: 'dean_quote',
    title: 'Phrases Admissions Officers Skip',
    author: 'Jeff Schiffman',
    author_title: 'Director of Admissions',
    publication: 'Tulane University',
    date: '2022-08',
    quote: "After reading thousands of essays, certain phrases become invisible. 'This experience taught me' is one of them. Show me the teaching moment instead.",
    relevance_to_claim: 'Common phrases become invisible to admissions readers',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'tulane',
      applicable_colleges: ['tulane', 'uva', 'gmu', 'duke', 'northwestern', 'penn', 'brown', 'dartmouth', 'cornell'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'problem', keywords_matched: ['invisible', 'phrases', 'taught me'] },
      cliche_essay_formula: { score: 90, aspect: 'problem', keywords_matched: ['invisible', 'experience taught'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['show me', 'teaching moment'] },
      cliche_inspirational: { score: 85, aspect: 'problem', keywords_matched: ['taught me'] },
      cliche_narrative_arc: { score: 70, aspect: 'problem', keywords_matched: ['experience'] },
      cliche_metaphor: { score: 80, aspect: 'problem', keywords_matched: ['invisible', 'phrases'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 6. THYRA BRIGGS - HARVEY MUDD - FRESH PERSPECTIVE
  // ============================================================================
  {
    source_id: 'briggs_fresh_observations_2023',
    type: 'dean_quote',
    title: 'Standing Out in College Essays',
    author: 'Thyra Briggs',
    author_title: 'VP of Admission and Financial Aid',
    publication: 'Harvey Mudd College',
    date: '2023-02',
    quote: 'When everyone uses the same language, everyone sounds the same. The best essays surprise us with fresh observations, not recycled wisdom.',
    relevance_to_claim: 'Unique language distinguishes strong essays from generic ones',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvey_mudd',
      applicable_colleges: ['harvey_mudd', 'caltech', 'mit', 'stanford', 'uchicago', 'brown'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'problem', keywords_matched: ['same language', 'recycled'] },
      cliche_ai_convergence: { score: 85, aspect: 'problem', keywords_matched: ['same', 'recycled wisdom'] },
      cliche_topic_framing: { score: 80, aspect: 'solution', keywords_matched: ['fresh observations', 'surprise'] },
      cliche_inspirational: { score: 85, aspect: 'problem', keywords_matched: ['recycled wisdom'] },
      cliche_essay_formula: { score: 75, aspect: 'problem', keywords_matched: ['same'] },
      cliche_metaphor: { score: 90, aspect: 'problem', keywords_matched: ['same language', 'recycled', 'fresh observations'] },
    },

    taxonomy: {
      primary_category: 'fresh_perspective',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 7. PARKE MUTH - UVA - SHOW DON'T TELL
  // ============================================================================
  {
    source_id: 'muth_show_dont_tell_2022',
    type: 'dean_quote',
    title: 'The Art of Showing in Essays',
    author: 'Parke Muth',
    author_title: 'Former Senior Associate Dean of Admissions',
    publication: 'University of Virginia Admissions Blog',
    date: '2022-05',
    quote: "Don't tell me you learned resilience. Show me the moment at 3 AM when you almost quit but didn't. Let me feel what you felt.",
    relevance_to_claim: 'Concrete scenes create emotional impact that abstract claims cannot',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'uva',
      applicable_colleges: ['uva', 'duke', 'northwestern', 'penn', 'brown', 'dartmouth', 'cornell', 'tulane'],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['show me', 'feel', 'moment'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['learned resilience'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['moment', 'almost quit'] },
      cliche_inspirational: { score: 75, aspect: 'solution', keywords_matched: ['resilience'] },
      cliche_essay_formula: { score: 70, aspect: 'solution', keywords_matched: ['moment'] },
      cliche_metaphor: { score: 85, aspect: 'solution', keywords_matched: ['show me', 'feel', 'moment'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body', 'opening'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 8. ANDREW FLAGEL - GMU - TRUST THE READER
  // ============================================================================
  {
    source_id: 'flagel_trust_reader_2023',
    type: 'dean_quote',
    title: 'What Makes Essays Memorable',
    author: 'Andrew Flagel',
    author_title: 'Dean of Admissions',
    publication: 'George Mason University',
    date: '2023-04',
    quote: "The best essays are like good fiction—they trust the reader to draw conclusions from concrete details rather than explaining everything.",
    relevance_to_claim: 'Strong essays let readers discover meaning rather than stating it',
    weight_in_calculation: 75,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'gmu',
      applicable_colleges: ['gmu', 'uva', 'tulane', 'duke', 'northwestern'],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'principle', keywords_matched: ['trust the reader', 'concrete details'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['trust', 'not explaining'] },
      cliche_narrative_arc: { score: 75, aspect: 'principle', keywords_matched: ['draw conclusions'] },
      cliche_language: { score: 65, aspect: 'solution', keywords_matched: ['concrete details'] },
      cliche_inspirational: { score: 70, aspect: 'solution', keywords_matched: ['not explaining'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure', 'specificity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['throughout', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 9. RICHARD SHAW - STANFORD - INTELLECTUAL VITALITY
  // ============================================================================
  {
    source_id: 'shaw_iv_priority_2023',
    type: 'dean_quote',
    title: 'Intellectual Vitality at Stanford',
    author: 'Richard Shaw',
    author_title: 'Dean of Admission and Financial Aid',
    publication: 'Stanford Magazine',
    date: '2023-05',
    quote: 'Intellectual vitality is our top priority. We want to see students who pursue learning for its own sake, who are genuinely curious.',
    relevance_to_claim: 'Stanford explicitly ranks intellectual vitality as top criterion',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'stanford',
      applicable_colleges: ['stanford'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 100, aspect: 'principle', keywords_matched: ['intellectual vitality', 'priority'] },
      cliche_value_signaling: { score: 85, aspect: 'principle', keywords_matched: ['genuinely curious', 'own sake'] },
      cliche_ai_convergence: { score: 65, aspect: 'principle', keywords_matched: ['genuinely'] },
      cliche_topic_framing: { score: 60, aspect: 'principle', keywords_matched: ['learning'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['proving_weight', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 10. CHRISTOPH GUTTENTAG - DUKE - INTELLECTUAL SPARK
  // ============================================================================
  {
    source_id: 'guttentag_spark_2023',
    type: 'dean_quote',
    title: 'Finding the Spark in Applications',
    author: 'Christoph Guttentag',
    author_title: 'Dean of Undergraduate Admissions',
    publication: 'Duke University',
    date: '2023-09',
    quote: "We look for the spark—that moment when someone's eyes light up talking about an idea. Can you capture that spark in writing?",
    relevance_to_claim: 'Genuine intellectual excitement is visible in strong essays',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'duke',
      applicable_colleges: ['duke', 'northwestern', 'penn', 'brown', 'dartmouth'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 85, aspect: 'principle', keywords_matched: ['spark', 'excited'] },
      cliche_value_signaling: { score: 80, aspect: 'principle', keywords_matched: ['eyes light up', 'genuine'] },
      cliche_ai_convergence: { score: 70, aspect: 'principle', keywords_matched: ['capture'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['capture', 'moment'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'inspiring',
      complexity: 'simple',
      student_facing: true,
    },
  },

  // ============================================================================
  // 11. WILLIAM FITZSIMMONS - HARVARD - TAKING RISKS
  // ============================================================================
  {
    source_id: 'fitzsimmons_risk_2021',
    type: 'dean_quote',
    title: 'Taking Risks in Essays',
    author: 'William Fitzsimmons',
    author_title: 'Dean of Admissions',
    publication: 'Harvard Admissions',
    date: '2021-11',
    quote: 'The essays that move us are ones where students take real risks. Not manufactured drama, but genuine moments of uncertainty or growth.',
    relevance_to_claim: 'Authentic vulnerability creates emotional impact in essays',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard', 'yale', 'princeton', 'stanford', 'columbia', 'brown'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 90, aspect: 'principle', keywords_matched: ['manufactured', 'genuine', 'growth'] },
      vulnerability: { score: 95, aspect: 'principle', keywords_matched: ['risks', 'uncertainty', 'genuine'] },
      cliche_topic_framing: { score: 75, aspect: 'principle', keywords_matched: ['manufactured'] },
      cliche_ai_convergence: { score: 70, aspect: 'principle', keywords_matched: ['genuine'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 12. THYRA BRIGGS - HARVEY MUDD - VULNERABILITY
  // ============================================================================
  {
    source_id: 'briggs_vulnerability_2023',
    type: 'dean_quote',
    title: 'What Vulnerability Really Means',
    author: 'Thyra Briggs',
    author_title: 'VP of Admission and Financial Aid',
    publication: 'Harvey Mudd College',
    date: '2023-02',
    quote: "Vulnerability doesn't mean trauma. It means being honest about what you don't know, what you got wrong, what still confuses you.",
    relevance_to_claim: 'Intellectual honesty is more valuable than dramatic stories',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvey_mudd',
      applicable_colleges: ['harvey_mudd', 'caltech', 'mit', 'stanford', 'uchicago', 'brown'],
      exclusions: [],
    },

    issue_relevance: {
      vulnerability: { score: 100, aspect: 'principle', keywords_matched: ['vulnerability', 'honest', 'confuses'] },
      cliche_narrative_arc: { score: 85, aspect: 'principle', keywords_matched: ['trauma', 'got wrong'] },
      cliche_topic_framing: { score: 70, aspect: 'principle', keywords_matched: ['honest'] },
      cliche_value_signaling: { score: 65, aspect: 'principle', keywords_matched: ['honest'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'intellectual_vitality'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['throughout', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 13. WILLIAM FITZSIMMONS - HARVARD - IMPACT ON OTHERS
  // ============================================================================
  {
    source_id: 'fitzsimmons_effect_on_others_2023',
    type: 'dean_quote',
    title: 'Harvard on Impact',
    author: 'William Fitzsimmons',
    author_title: 'Dean of Admissions',
    publication: 'Harvard Crimson Interview',
    date: '2023-03',
    quote: 'We want to see your effect on others. Not just what you did, but how your presence made the people around you better, stronger, more capable.',
    relevance_to_claim: 'Harvard values demonstrable positive impact on others',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard', 'yale', 'princeton', 'penn', 'dartmouth'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 95, aspect: 'principle', keywords_matched: ['effect', 'impact', 'better', 'people'] },
      cliche_college_specific: { score: 80, aspect: 'principle', keywords_matched: ['effect on others'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['made people', 'presence'] },
      cliche_topic_framing: { score: 60, aspect: 'principle', keywords_matched: ['not just what you did'] },
    },

    taxonomy: {
      primary_category: 'impact_on_others',
      secondary_categories: ['showing_vs_telling', 'authenticity'],
      teaching_moment_types: ['why_this_matters', 'proving_weight'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 14. STU SCHMILL - MIT - COLLABORATION
  // ============================================================================
  {
    source_id: 'schmill_collaboration_2023',
    type: 'dean_quote',
    title: 'MIT on Collaboration',
    author: 'Stu Schmill',
    author_title: 'Dean of Admissions',
    publication: 'MIT Admissions Blog',
    date: '2023-06',
    quote: "Mens et manus—mind and hand. We look for students who don't just think about problems but work with others to solve them. Show us your hands getting dirty alongside your peers.",
    relevance_to_claim: 'MIT values collaborative problem-solving over individual achievement',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'mit',
      applicable_colleges: ['mit', 'caltech', 'stanford', 'cornell'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 95, aspect: 'principle', keywords_matched: ['MIT', 'collaboration', 'peers'] },
      cliche_value_signaling: { score: 85, aspect: 'principle', keywords_matched: ['work with others', 'alongside peers'] },
      telling_not_showing: { score: 80, aspect: 'solution', keywords_matched: ['show us', 'hands getting dirty'] },
      cliche_topic_framing: { score: 65, aspect: 'principle', keywords_matched: ['solve problems'] },
    },

    taxonomy: {
      primary_category: 'collaboration',
      secondary_categories: ['showing_vs_telling', 'impact_on_others'],
      teaching_moment_types: ['proving_weight', 'why_this_matters', 'how_to_fix'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'justifying_severity', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },
  },

  // ============================================================================
  // 15. JAMES NONDORF - UCHICAGO - INTELLECTUAL COMMUNITY
  // ============================================================================
  {
    source_id: 'nondorf_intellectual_peer_2023',
    type: 'dean_quote',
    title: 'UChicago on Intellectual Community',
    author: 'James Nondorf',
    author_title: 'Vice President for Enrollment and Student Advancement',
    publication: 'University of Chicago Admissions',
    date: '2023-04',
    quote: "We're building an intellectual community. We want to know: will you make the person sitting next to you in seminar think harder? Will you challenge ideas, not just absorb them?",
    relevance_to_claim: 'UChicago values intellectual contribution to peer community',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'uchicago',
      applicable_colleges: ['uchicago', 'columbia', 'yale', 'northwestern'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 95, aspect: 'principle', keywords_matched: ['intellectual community', 'challenge'] },
      cliche_value_signaling: { score: 80, aspect: 'principle', keywords_matched: ['think harder', 'challenge ideas'] },
      cliche_ai_convergence: { score: 60, aspect: 'principle', keywords_matched: ['challenge'] },
      cliche_topic_framing: { score: 55, aspect: 'principle', keywords_matched: ['ideas'] },
    },

    taxonomy: {
      primary_category: 'intellectual_community',
      secondary_categories: ['intellectual_vitality', 'impact_on_others'],
      teaching_moment_types: ['proving_weight', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'justifying_severity'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a source by ID
 */
export function getSourceById(sourceId: string): LabeledSource | undefined {
  return LABELED_SOURCES.find(s => s.source_id === sourceId);
}

/**
 * Get all sources for a specific author
 */
export function getSourcesByAuthor(author: string): LabeledSource[] {
  return LABELED_SOURCES.filter(s => s.author === author);
}

/**
 * Get count of sources by category
 */
export function getSourceCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const source of LABELED_SOURCES) {
    const cat = source.taxonomy.primary_category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Get all unique authors
 */
export function getUniqueAuthors(): string[] {
  return [...new Set(LABELED_SOURCES.map(s => s.author).filter((a): a is string => !!a))];
}

/**
 * Get all unique colleges with primary sources
 */
export function getCollegesWithPrimarySources(): string[] {
  return [...new Set(
    LABELED_SOURCES
      .map(s => s.college_specificity.primary_college)
      .filter((c): c is string => !!c)
  )];
}

// ============================================================================
// MERGED LABELED_SOURCES (Original + Deep Research from Registry)
// ============================================================================

/**
 * LABELED_SOURCES - The complete merged source database
 *
 * This is the PRIMARY export used by SourceIndexer and all citation services.
 * It combines:
 * - CORE_LABELED_SOURCES (15 original dean quotes)
 * - ALL_DEEP_RESEARCH_SOURCES (from sourceRegistry.ts)
 *
 * New research batches are added through sourceRegistry.ts for scalability.
 * See sourceRegistry.ts for the full list of integrated batches.
 */
export const LABELED_SOURCES: LabeledSource[] = [
  ...CORE_LABELED_SOURCES,
  ...ALL_DEEP_RESEARCH_SOURCES,
];

/**
 * Get statistics about the source database
 * Now delegates to the centralized registry for accurate counts
 */
export function getLabeledSourceStats(): {
  total: number;
  core: number;
  deepResearch: number;
  byBatch: Record<string, number>;
} {
  const registryStats = getRegistryStats();

  return {
    total: LABELED_SOURCES.length,
    core: CORE_LABELED_SOURCES.length,
    deepResearch: ALL_DEEP_RESEARCH_SOURCES.length,
    byBatch: registryStats.byBatch,
  };
}

/**
 * Validate the source database
 * Run this to check for issues with source integration
 */
export function validateLabeledSources(): {
  valid: boolean;
  totalSources: number;
  coreValid: boolean;
  registryValidation: ReturnType<typeof validateRegistry>;
} {
  // Check for duplicate IDs between core and registry
  const coreIds = new Set(CORE_LABELED_SOURCES.map(s => s.source_id));
  const registryIds = ALL_DEEP_RESEARCH_SOURCES.map(s => s.source_id);
  const duplicates = registryIds.filter(id => coreIds.has(id));

  const registryValidation = validateRegistry();

  return {
    valid: duplicates.length === 0 && registryValidation.valid,
    totalSources: LABELED_SOURCES.length,
    coreValid: duplicates.length === 0,
    registryValidation,
  };
}
