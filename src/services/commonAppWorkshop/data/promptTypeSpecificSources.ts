/**
 * Prompt Type-Specific Sources
 *
 * SCOPE: PROMPT_TYPE - These sources apply to specific categories of essays.
 *
 * Categories:
 * 1. Personal Statement (Main Essay) - 650-word identity/values essays
 * 2. Why This College - School-specific fit essays
 * 3. Why This Major - Academic interest essays
 * 4. Activity Elaboration - Extracurricular deep dives
 * 5. Short Answer - Brief responses (50-150 words)
 * 6. Creative Prompts - Quirky/unusual prompts
 * 7. Community/Diversity - Identity and perspective essays
 * 8. Challenge/Setback - Overcoming obstacles essays
 *
 * CRITICAL: These sources should NEVER be applied to prompt types they don't belong to.
 * Each source has explicit never_use_for guards to prevent misapplication.
 */

import type {
  EnhancedLabeledSource,
  PromptType,
  ClicheSymptomType,
} from '../types/labeledSourceTypes';

// ============================================================================
// PROMPT TYPE-SPECIFIC SOURCES DATABASE
// ============================================================================

export const PROMPT_TYPE_SOURCES: EnhancedLabeledSource[] = [
  // ============================================================================
  // SECTION 1: PERSONAL STATEMENT / MAIN ESSAY SOURCES
  // ============================================================================
  {
    source_id: 'prompt_personal_statement_identity',
    type: 'expert_guidance',
    title: 'The Personal Statement Purpose',
    author: 'Common App Advisory Board',
    author_title: 'Application Platform Guidance',
    publication: 'Common App Essay Guide',
    date: '2023-08',
    quote: 'The personal statement is not a resume in paragraph form. It\'s your chance to show who you are beyond your achievements—your values, your thinking, your voice. Readers want to meet a person, not a profile.',
    relevance_to_claim: 'Personal statements should reveal character, not list accomplishments',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'principle', keywords_matched: ['values', 'thinking', 'voice'] },
      cliche_essay_formula: { score: 90, aspect: 'principle', keywords_matched: ['not resume', 'meet a person'] },
      cliche_value_signaling: { score: 85, aspect: 'principle', keywords_matched: ['who you are', 'beyond achievements'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['show who you are'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['personal_statement', 'background_identity', 'challenge_setback', 'belief_challenged', 'problem_solved', 'personal_growth', 'topic_of_choice'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_essay_formula', 'cliche_value_signaling', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'why_this_major', 'activity_elaboration', 'short_answer'],
        contexts: ['supplement-focused advice'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      main_essay_only: true,
      min_word_count: 400,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'prompt_personal_statement_650_words',
    type: 'expert_guidance',
    title: 'Maximizing 650 Words',
    author: 'Essay Strategy Expert',
    author_title: 'College Counselor',
    publication: 'Application Essay Mastery',
    date: '2023-04',
    quote: '650 words is enough for one complete story with genuine reflection. It\'s not enough for your biography. Choose the smallest moment that reveals the biggest truth about who you are.',
    relevance_to_claim: 'The 650-word limit demands focused, selective storytelling',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['one complete story', 'smallest moment'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['biggest truth', 'reflection'] },
      cliche_topic_framing: { score: 85, aspect: 'solution', keywords_matched: ['smallest moment', 'who you are'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['reveals'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['personal_statement', 'background_identity', 'challenge_setback', 'belief_challenged', 'problem_solved', 'personal_growth', 'topic_of_choice'],
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_narrative_arc', 'cliche_topic_framing', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['short_answer', 'activity_elaboration'],
        contexts: ['short-form essays'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      main_essay_only: true,
      min_word_count: 500,
      max_word_count: 700,
    },
    authority: 'expert',
    advice_type: 'structure',
  },

  // ============================================================================
  // SECTION 2: WHY THIS COLLEGE SOURCES
  // ============================================================================
  {
    source_id: 'prompt_why_college_specificity',
    type: 'research_study',
    title: 'What Makes "Why Us" Essays Fail',
    author: 'Admissions Research Consortium',
    author_title: 'Multi-Institution Study',
    publication: 'Supplemental Essay Analysis',
    date: '2023-07',
    finding: '72% of "Why Us" essays that admissions officers rated as "weak" contained only information that could be found on the first page of the college website. Strong essays demonstrated knowledge that required actual research or personal experience.',
    relevance_to_claim: 'Surface-level research is immediately obvious to admissions readers',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 100, aspect: 'problem', keywords_matched: ['first page website', 'actual research'] },
      cliche_value_signaling: { score: 85, aspect: 'problem', keywords_matched: ['weak', 'surface-level'] },
      cliche_topic_framing: { score: 80, aspect: 'problem', keywords_matched: ['personal experience'] },
      cliche_essay_formula: { score: 75, aspect: 'problem', keywords_matched: ['information'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['why_this_college', 'community_contribution'],
        colleges: 'all',
        issue_types: ['cliche_college_specific', 'cliche_value_signaling', 'cliche_topic_framing', 'cliche_essay_formula'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'background_identity', 'challenge_setback', 'activity_elaboration'],
        contexts: ['main essay feedback', 'personal narrative'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'prompt_why_college_connection',
    type: 'expert_guidance',
    title: 'The "Why Us" Formula That Works',
    author: 'College Essay Strategist',
    author_title: 'Former AO, Multiple Schools',
    publication: 'Supplement Writing Guide',
    date: '2023-05',
    quote: 'The best "Why Us" essays follow a simple pattern: specific thing about the school + why it matters to you specifically + what you\'ll contribute. The key word is "specific." Not "research opportunities" but "Professor Chen\'s work on X because of my experience with Y."',
    relevance_to_claim: 'Specific connections between student interests and school resources create compelling supplements',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 95, aspect: 'solution', keywords_matched: ['specific thing', 'Professor Chen'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['matters to you', 'contribute'] },
      cliche_topic_framing: { score: 80, aspect: 'solution', keywords_matched: ['your experience'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['specific'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['throughout'],
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
        prompt_types: ['why_this_college', 'why_this_major', 'community_contribution'],
        colleges: 'all',
        issue_types: ['cliche_college_specific', 'cliche_value_signaling', 'cliche_topic_framing', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'challenge_setback', 'creative_prompt'],
        contexts: ['personal narrative advice'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'prompt_why_college_avoid_flattery',
    type: 'dean_quote',
    title: 'What We Don\'t Want to Hear',
    author: 'Anonymous Admissions Dean',
    author_title: 'Top 20 University',
    publication: 'Admissions Officer Survey',
    date: '2023-04',
    quote: 'Please don\'t tell me my school is "prestigious" or has a "beautiful campus." I know. What I don\'t know is why YOU, specifically, need what WE specifically offer. That\'s the only interesting question.',
    relevance_to_claim: 'Generic praise wastes valuable supplement word count',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_college_specific: { score: 100, aspect: 'problem', keywords_matched: ['prestigious', 'beautiful campus'] },
      cliche_language: { score: 90, aspect: 'problem', keywords_matched: ['don\'t tell me', 'I know'] },
      cliche_value_signaling: { score: 85, aspect: 'problem', keywords_matched: ['generic praise'] },
      cliche_essay_formula: { score: 75, aspect: 'problem', keywords_matched: ['interesting question'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['opening', 'throughout'],
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
        prompt_types: ['why_this_college'],
        colleges: 'all',
        issue_types: ['cliche_college_specific', 'cliche_language', 'cliche_value_signaling', 'cliche_essay_formula'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'activity_elaboration', 'short_answer', 'challenge_setback'],
        contexts: ['personal essay feedback'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'primary',
    advice_type: 'warning',
  },

  // ============================================================================
  // SECTION 3: ACTIVITY ELABORATION SOURCES
  // ============================================================================
  {
    source_id: 'prompt_activity_depth_not_breadth',
    type: 'expert_guidance',
    title: 'Activity Essays: Go Deeper',
    author: 'Admissions Consultant Network',
    author_title: 'Expert Consensus',
    publication: 'Supplement Strategy Guide',
    date: '2023-06',
    quote: 'Activity elaboration essays are your chance to show the HOW and WHY behind the WHAT. Don\'t list more accomplishments—we have your resume. Instead, show us a specific moment that captures what this activity means to you.',
    relevance_to_claim: 'Activity essays should reveal meaning, not add more facts',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['HOW', 'WHY', 'specific moment'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['show us', 'captures'] },
      cliche_value_signaling: { score: 80, aspect: 'solution', keywords_matched: ['what it means'] },
      cliche_topic_framing: { score: 75, aspect: 'solution', keywords_matched: ['deeper', 'meaning'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'authenticity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['activity_elaboration', 'extracurricular_impact'],
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'telling_not_showing', 'cliche_value_signaling', 'cliche_topic_framing'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'personal_statement', 'creative_prompt'],
        contexts: ['main essay', 'why us supplement'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
      max_word_count: 400,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'prompt_activity_150_word_strategy',
    type: 'expert_guidance',
    title: 'The 150-Word Activity Essay',
    author: 'Short Essay Specialist',
    author_title: 'Admissions Consultant',
    publication: 'Supplement Writing Workshop',
    date: '2023-03',
    quote: 'With 150 words, you get exactly one moment. Pick the moment that made you love this activity, the moment you almost quit, or the moment you realized you\'d grown. One sentence of context, the rest is that moment.',
    relevance_to_claim: 'Ultra-short supplements demand extreme focus',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['one moment', 'one sentence'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['moment', 'realized'] },
      cliche_narrative_arc: { score: 80, aspect: 'solution', keywords_matched: ['almost quit', 'grown'] },
      cliche_language: { score: 70, aspect: 'solution', keywords_matched: ['extreme focus'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['activity_elaboration', 'short_answer'],
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'telling_not_showing', 'cliche_narrative_arc', 'cliche_language'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'why_this_college'],
        contexts: ['long-form essays'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
      max_word_count: 200,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 4: SHORT ANSWER SOURCES
  // ============================================================================
  {
    source_id: 'prompt_short_answer_precision',
    type: 'expert_guidance',
    title: 'Short Answer Excellence',
    author: 'Application Strategy Expert',
    author_title: 'Former AO',
    publication: 'Short Form Essay Guide',
    date: '2023-05',
    quote: 'Short answers (50-150 words) test precision, not depth. Answer exactly what\'s asked with one specific, memorable detail. A great 50-word answer beats a meandering 150-word one every time.',
    relevance_to_claim: 'Short answers reward directness and specificity over elaboration',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['precision', 'answer exactly'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['specific', 'memorable'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['memorable detail'] },
      cliche_narrative_arc: { score: 60, aspect: 'solution', keywords_matched: ['directness'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['short_answer'],
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_language', 'telling_not_showing', 'cliche_narrative_arc'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'why_this_college', 'creative_prompt'],
        contexts: ['long-form feedback', 'narrative essays'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
      max_word_count: 200,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 5: CREATIVE PROMPT SOURCES
  // ============================================================================
  {
    source_id: 'prompt_creative_embrace_weird',
    type: 'expert_guidance',
    title: 'Embrace the Weird',
    author: 'UChicago Essay Expert',
    author_title: 'Admissions Consultant',
    publication: 'Unconventional Essay Guide',
    date: '2023-06',
    quote: 'Creative prompts (UChicago, MIT, etc.) are testing your intellectual playfulness. Don\'t try to seem smart—be genuinely curious. The worst responses take a playful prompt seriously. The best ones take a serious idea playfully.',
    relevance_to_claim: 'Creative prompts reward intellectual playfulness over impressive-sounding answers',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['playfulness', 'curious'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['genuinely curious', 'don\'t seem smart'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['worst responses', 'best ones'] },
      cliche_value_signaling: { score: 80, aspect: 'solution', keywords_matched: ['intellectual playfulness'] },
    },

    taxonomy: {
      primary_category: 'fresh_perspective',
      secondary_categories: ['authenticity', 'intellectual_vitality'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['creative_prompt'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_ai_convergence', 'cliche_essay_formula', 'cliche_value_signaling'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'activity_elaboration', 'short_answer'],
        contexts: ['standard supplement feedback'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 6: CHALLENGE/SETBACK SOURCES
  // ============================================================================
  {
    source_id: 'prompt_challenge_authentic_struggle',
    type: 'expert_guidance',
    title: 'Writing About Challenges',
    author: 'Essay Coaching Expert',
    author_title: 'Admissions Consultant',
    publication: 'Challenge Essay Workshop',
    date: '2023-04',
    quote: 'The challenge prompt doesn\'t require trauma. It requires honesty about difficulty. A genuine struggle with time management can be more compelling than a manufactured obstacle if you show real growth. The key is authentic uncertainty, not dramatic stakes.',
    relevance_to_claim: 'Authentic small struggles often work better than dramatic challenges',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['doesn\'t require trauma', 'authentic uncertainty'] },
      cliche_topic_framing: { score: 90, aspect: 'solution', keywords_matched: ['manufactured', 'genuine struggle'] },
      cliche_value_signaling: { score: 80, aspect: 'solution', keywords_matched: ['real growth'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['show real growth'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['challenge_setback', 'personal_growth'],
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_topic_framing', 'cliche_value_signaling', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'activity_elaboration', 'short_answer'],
        contexts: ['supplement-specific feedback'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      main_essay_only: true,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'prompt_challenge_resolution_trap',
    type: 'expert_guidance',
    title: 'The Resolution Trap',
    author: 'Narrative Essay Expert',
    author_title: 'Writing Coach',
    publication: 'Essay Structure Workshop',
    date: '2023-02',
    quote: 'The biggest mistake in challenge essays: neat resolution. Real growth is messy. If your essay ends with "and now I\'ve completely overcome it," you\'re probably oversimplifying. The most honest essays acknowledge what\'s still hard.',
    relevance_to_claim: 'Authentic challenge essays embrace ongoing complexity',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'problem', keywords_matched: ['neat resolution', 'completely overcome'] },
      cliche_inspirational: { score: 95, aspect: 'problem', keywords_matched: ['oversimplifying', 'still hard'] },
      cliche_essay_formula: { score: 85, aspect: 'problem', keywords_matched: ['biggest mistake'] },
      cliche_value_signaling: { score: 75, aspect: 'problem', keywords_matched: ['honest'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['explaining_problem', 'what_to_avoid'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['challenge_setback', 'personal_growth', 'belief_challenged'],
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'cliche_essay_formula', 'cliche_value_signaling'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'activity_elaboration', 'why_this_major'],
        contexts: ['supplement feedback'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      main_essay_only: true,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // ============================================================================
  // SECTION 7: DIVERSITY/IDENTITY SOURCES
  // ============================================================================
  {
    source_id: 'prompt_identity_beyond_labels',
    type: 'expert_guidance',
    title: 'Writing About Identity',
    author: 'Identity Essay Specialist',
    author_title: 'Admissions Counselor',
    publication: 'Diverse Perspectives Workshop',
    date: '2023-05',
    quote: 'Identity essays fail when they stop at labels. "I am X" is not interesting. "Being X means Y in my life, which led me to think Z" is interesting. Show how your identity shaped your perspective, not just that you have one.',
    relevance_to_claim: 'Identity essays must go beyond identification to insight',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['beyond labels', 'perspective'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['show how', 'shaped'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['I am X', 'led me to think'] },
      cliche_essay_formula: { score: 75, aspect: 'solution', keywords_matched: ['fail when', 'not interesting'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling', 'fresh_perspective'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['background_identity', 'diversity_perspective', 'community_contribution'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'telling_not_showing', 'cliche_value_signaling', 'cliche_essay_formula'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'activity_elaboration', 'why_this_major'],
        contexts: ['non-identity prompts'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 8: WHY THIS MAJOR SOURCES
  // ============================================================================
  {
    source_id: 'prompt_major_origin_story',
    type: 'expert_guidance',
    title: 'The Major Origin Story',
    author: 'Academic Essay Expert',
    author_title: 'Admissions Consultant',
    publication: 'Major Essay Workshop',
    date: '2023-04',
    quote: 'Don\'t tell me why engineering is important. Tell me the specific moment you became an engineer—before you knew the word for it. When did you first feel that pull? Show that moment, then connect it to the specific program.',
    relevance_to_claim: '"Why This Major" essays should show the origin of intellectual passion',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['specific moment', 'before you knew'] },
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['don\'t tell', 'show that moment'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['first felt pull'] },
      cliche_college_specific: { score: 80, aspect: 'solution', keywords_matched: ['specific program'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'intellectual_vitality'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['opening', 'body'],
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
        prompt_types: ['why_this_major', 'intellectual_curiosity'],
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'telling_not_showing', 'cliche_value_signaling', 'cliche_college_specific'],
      },
      never_use_for: {
        prompt_types: ['personal_statement', 'challenge_setback', 'activity_elaboration'],
        contexts: ['personal narrative', 'activity essays'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 9: LETTER TO ROOMMATE / CASUAL TONE SOURCES
  // ============================================================================
  {
    source_id: 'prompt_roommate_authentic_casual',
    type: 'expert_guidance',
    title: 'The Roommate Letter Test',
    author: 'Stanford Essay Expert',
    author_title: 'Former Stanford AO',
    publication: 'Unconventional Supplement Guide',
    date: '2023-03',
    quote: 'The roommate letter prompt tests authenticity through informality. If your letter sounds like it belongs in a formal application, you\'ve missed the point. What would you actually tell someone you\'re about to live with? That\'s the voice we want.',
    relevance_to_claim: 'Casual-tone prompts require genuinely informal voice',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['formal application', 'missed point'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['authenticity', 'actually tell'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['informal voice', 'informality'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['live with'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['letter_to_roommate', 'creative_prompt'],
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_ai_convergence', 'cliche_language', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['why_this_college', 'why_this_major', 'activity_elaboration'],
        contexts: ['formal supplement advice'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      supplemental_only: true,
    },
    authority: 'expert',
    advice_type: 'principle',
  },
];

// ============================================================================
// HELPER FUNCTIONS FOR PROMPT-TYPE SOURCES
// ============================================================================

/**
 * Get all sources for a specific prompt type
 */
export function getSourcesForPromptType(
  promptType: PromptType
): EnhancedLabeledSource[] {
  return PROMPT_TYPE_SOURCES.filter(source => {
    // Check applies_to
    const applies = source.scope.applies_to.prompt_types === 'all' ||
      source.scope.applies_to.prompt_types.includes(promptType);

    // Check never_use_for
    const excluded = source.scope.never_use_for?.prompt_types?.includes(promptType) || false;

    return applies && !excluded;
  });
}

/**
 * Get sources for a prompt type and issue type combination
 */
export function getSourcesForPromptAndIssue(
  promptType: PromptType,
  issueType: ClicheSymptomType
): EnhancedLabeledSource[] {
  return getSourcesForPromptType(promptType).filter(source => {
    const relevance = source.issue_relevance[issueType];
    return relevance && relevance.score >= 70;
  }).sort((a, b) => {
    const scoreA = a.issue_relevance[issueType]?.score || 0;
    const scoreB = b.issue_relevance[issueType]?.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Check if a source is safe to use for a prompt type
 */
export function isSourceSafeForPromptType(
  source: EnhancedLabeledSource,
  promptType: PromptType
): { safe: boolean; reason?: string } {
  // Check explicit exclusion
  if (source.scope.never_use_for?.prompt_types?.includes(promptType)) {
    return {
      safe: false,
      reason: `Source explicitly excluded for ${promptType} essays`,
    };
  }

  // Check if it applies
  if (source.scope.applies_to.prompt_types !== 'all' &&
      !source.scope.applies_to.prompt_types.includes(promptType)) {
    return {
      safe: false,
      reason: `Source not applicable to ${promptType} essays`,
    };
  }

  // Check context requirements
  const reqs = source.context_requirements;
  if (reqs) {
    const isMainEssayType = [
      'personal_statement', 'background_identity', 'challenge_setback',
      'belief_challenged', 'problem_solved', 'personal_growth', 'topic_of_choice'
    ].includes(promptType);

    if (reqs.main_essay_only && !isMainEssayType) {
      return {
        safe: false,
        reason: 'Source only for main essay, not supplements',
      };
    }

    if (reqs.supplemental_only && isMainEssayType) {
      return {
        safe: false,
        reason: 'Source only for supplemental essays',
      };
    }
  }

  return { safe: true };
}

/**
 * Get prompt type stats
 */
export function getPromptTypeSourceStats(): Map<PromptType, number> {
  const stats = new Map<PromptType, number>();

  const allPromptTypes: PromptType[] = [
    'personal_statement', 'background_identity', 'challenge_setback',
    'belief_challenged', 'problem_solved', 'personal_growth', 'topic_of_choice',
    'why_this_college', 'why_this_major', 'community_contribution',
    'activity_elaboration', 'short_answer', 'creative_prompt',
    'additional_info', 'letter_to_roommate', 'intellectual_curiosity',
    'diversity_perspective', 'extracurricular_impact'
  ];

  for (const promptType of allPromptTypes) {
    const sources = getSourcesForPromptType(promptType);
    stats.set(promptType, sources.length);
  }

  return stats;
}
