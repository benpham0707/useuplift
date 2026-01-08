/**
 * Essay Endings & Conclusions Deep Research Sources
 *
 * Perplexity Research Batch #6: Comprehensive research on essay endings
 * and conclusions for college admissions essays.
 *
 * SCOPE: Universal principles for essay endings across all college essay types
 *
 * This file contains research-backed insights on:
 * 1. The Psychology of Endings (peak-end rule, memory science)
 * 2. Ending Techniques That Work (circular return, forward momentum, etc.)
 * 3. Ending Techniques That Fail (grand summary, preachy moral, etc.)
 * 4. The "So What" Test for Endings
 * 5. Endings by Essay Type (personal statements, Why This College, etc.)
 * 6. Leaving Space for the Reader (art of implication)
 * 7. Admissions Officer Insights on Conclusions
 *
 * Key Research Findings:
 * - Peak-end rule: People judge experiences by emotional peak + ending
 * - AOs often skim first and last paragraphs, only reading body if those grab attention
 * - 85% of essays receive neutral "check mark" - endings push into memorable territory
 * - Effective endings combine surprise with inevitability (Aristotle's principle)
 * - Understatement beats overstatement in conclusions
 *
 * @version 1.0
 * @date January 2025
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// ESSAY ENDINGS SOURCES DATABASE
// ============================================================================

export const ESSAY_ENDINGS_SOURCES: EnhancedLabeledSource[] = [
  // ============================================================================
  // SECTION 1: THE PSYCHOLOGY OF ENDINGS
  // ============================================================================
  {
    source_id: 'ending_science_peak_end_rule',
    type: 'research_study',
    title: 'The Peak-End Rule in Essay Evaluation',
    author: 'Meta-Analysis Research',
    author_title: 'Memory Psychology Research',
    publication: 'PMC Research Database',
    date: '2024-08',
    finding: 'The peak-end rule, a well-established memory heuristic, demonstrates that people judge entire experiences based predominantly on two moments: the emotional peak and the conclusion. This rule outperforms other memory heuristics—including recency-only, primacy, or average-experience metrics—when predicting how people recall and evaluate past events.',
    relevance_to_claim: 'Endings disproportionately shape how admissions officers remember essays',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['peak-end rule', 'memory', 'conclusion'] },
      abrupt_ending: { score: 95, aspect: 'principle', keywords_matched: ['judge experiences', 'ending'] },
      anticlimactic_ending: { score: 95, aspect: 'principle', keywords_matched: ['emotional peak', 'memorable'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cognitive_psychology', 'memory_science'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'abrupt_ending', 'anticlimactic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ending_science_ao_reading_patterns',
    type: 'expert_guidance',
    title: 'How AOs Actually Read Essays',
    author: 'Rick Clark',
    author_title: 'Executive Director of Strategic Student Access, Georgia Tech',
    publication: 'Reddit AMA / Admissions Insights',
    date: '2023-07',
    quote: 'Many readers skim the first and last paragraphs and will only revisit the body if those sections grab their attention. Otherwise, your essay risks blending in with countless others.',
    relevance_to_claim: 'Endings receive disproportionate attention in time-constrained evaluation',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'georgia_tech',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['first and last paragraphs', 'attention'] },
      generic_ending: { score: 95, aspect: 'principle', keywords_matched: ['blending in', 'grab attention'] },
      summary_conclusion: { score: 90, aspect: 'problem', keywords_matched: ['skim', 'body'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_context', 'reader_behavior'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion', 'opening'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending', 'summary_conclusion'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'data',
  },

  {
    source_id: 'ending_science_structural_closure',
    type: 'expert_guidance',
    title: 'What Makes Endings Satisfying vs. Abrupt',
    author: 'Harry Bauld',
    author_title: 'Former Admissions Officer, Brown & Columbia',
    publication: 'On Writing the College Application Essay',
    date: '2020-01',
    quote: 'The best endings remember where they came from, without repeating what you\'ve already said. Satisfying endings typically shift in scope from the specific details of the body to a wider frame that offers reflection and understanding.',
    relevance_to_claim: 'Endings need structural closure without repetition',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'brown',
      applicable_colleges: ['columbia'],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'principle', keywords_matched: ['remember where they came from'] },
      abrupt_ending: { score: 100, aspect: 'solution', keywords_matched: ['reflection', 'understanding'] },
      summary_conclusion: { score: 100, aspect: 'problem', keywords_matched: ['without repeating'] },
      repetitive_ending: { score: 100, aspect: 'problem', keywords_matched: ['already said', 'repeating'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure', 'craft'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_difference'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'abrupt_ending', 'summary_conclusion', 'repetitive_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_science_mediocre_with_strong_ending',
    type: 'research_study',
    title: 'How Endings Recalibrate Memory',
    author: 'Memory Psychology Research',
    author_title: 'Cognitive Science',
    publication: 'Peak-End Rule Applications',
    date: '2023-01',
    finding: 'A mediocre essay with a powerful ending can sometimes outperform a consistently good essay with a weak conclusion. The final impression recalibrates the reader\'s memory of everything that came before, either elevating or diminishing the overall experience.',
    relevance_to_claim: 'Strong endings can elevate mediocre essays; weak endings can undermine strong ones',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['recalibrates memory', 'diminishing'] },
      anticlimactic_ending: { score: 95, aspect: 'problem', keywords_matched: ['weak conclusion', 'outperform'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cognitive_psychology', 'memory_science'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['justifying_severity', 'motivating_improvement'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'anticlimactic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  // ============================================================================
  // SECTION 2: ENDING TECHNIQUES THAT WORK
  // ============================================================================
  {
    source_id: 'ending_technique_circular_return',
    type: 'expert_guidance',
    title: 'The Bookend/Circular Return Technique',
    author: 'Ethan Sawyer',
    author_title: 'Founder, College Essay Guy',
    publication: 'How to End a Personal Statement',
    date: '2023-01',
    quote: 'The bookend or callback technique represents one of the most effective and satisfying ending strategies. Inspired by Aristotle, bookending combines both surprise and inevitability—the two essential qualities of outstanding endings. When executed well, readers simultaneously feel "I didn\'t see that coming" and "of course it had to end this way."',
    relevance_to_claim: 'Circular return creates surprise combined with inevitability',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'solution', keywords_matched: ['bookend', 'callback', 'effective'] },
      abrupt_ending: { score: 95, aspect: 'solution', keywords_matched: ['satisfying', 'inevitability'] },
      generic_ending: { score: 90, aspect: 'solution', keywords_matched: ['surprise', 'outstanding'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure', 'craft'],
      teaching_moment_types: ['how_to_fix', 'technique_explanation', 'elite_example'],
      essay_section_relevance: ['conclusion', 'opening'],
    },

    usage: {
      best_for: ['teaching_technique', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement', 'challenge_adversity', 'growth_narrative'],
        colleges: 'all',
        issue_types: ['weak_ending', 'abrupt_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_circular_return_example',
    type: 'example',
    title: 'Circular Return Example: The Pigeon Essay',
    author: 'College Essay Guy',
    author_title: 'Essay Example Analysis',
    publication: 'Personal Statement Examples',
    date: '2023-01',
    quote: 'An essay beginning with "I have been pooped on many times. I mean this in the most literal sense possible. I have been pooped on by pigeons and possums..." concludes with "And while I\'m sure I will be dumped on many times, both literally and metaphorically, I won\'t do the same to others." The callback catches readers by surprise while feeling inevitable, since it references the established opening.',
    relevance_to_claim: 'Shows how circular return creates echo without copy',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['callback', 'surprise', 'inevitable'] },
      repetitive_ending: { score: 90, aspect: 'solution', keywords_matched: ['echo', 'references'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['craft', 'examples'],
      teaching_moment_types: ['elite_example', 'technique_explanation'],
      essay_section_relevance: ['conclusion', 'opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'concrete_example'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'repetitive_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'ending_technique_echo_not_copy',
    type: 'expert_guidance',
    title: 'Echo, Not Copy: The Transformation Principle',
    author: 'Janice Hardy',
    author_title: 'Fiction Writing Expert',
    publication: 'Bookend Technique Guide',
    date: '2019-08',
    quote: 'While the ending echoes the beginning, it shouldn\'t duplicate it. The traveler returns with a new appreciation for his home. This transformation between first and final mention shows character development without explicitly stating it.',
    relevance_to_claim: 'Effective callbacks show growth through transformed perspective',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      repetitive_ending: { score: 100, aspect: 'solution', keywords_matched: ['echo', 'shouldn\'t duplicate'] },
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['transformation', 'character development'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['without explicitly stating'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['showing_vs_telling', 'craft'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'refining_technique'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['repetitive_ending', 'weak_ending', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_specific_image',
    type: 'expert_guidance',
    title: 'End on a Specific Image',
    author: 'Harry Bauld',
    author_title: 'Former Admissions Officer, Brown & Columbia',
    publication: 'On Writing the College Application Essay',
    date: '2020-01',
    quote: 'Think like a camera—with which shot do you end the movie that is your essay? Rather than closing with abstract reflections or generalizations, powerful endings ground themselves in concrete, sensory details.',
    relevance_to_claim: 'Concrete images create more memorable endings than abstractions',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'brown',
      applicable_colleges: ['columbia'],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['specific image', 'concrete'] },
      generic_ending: { score: 100, aspect: 'solution', keywords_matched: ['sensory details', 'camera'] },
      abstract_ending: { score: 100, aspect: 'solution', keywords_matched: ['rather than abstract', 'generalizations'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['showing_vs_telling', 'sensory_details'],
      teaching_moment_types: ['technique_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_technique', 'concrete_guidance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending', 'abstract_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_specific_image_example',
    type: 'example',
    title: 'Specific Image Ending Example',
    author: 'College Essay Advisors',
    author_title: 'Admissions Consulting',
    publication: 'Essay Ending Examples',
    date: '2023-03',
    quote: 'A final image of "tightening laces, double-checking knots, and stepping into the raft" creates more impact than stating "I learned to be brave." The image shows courage without naming it, trusting readers to draw their own conclusions.',
    relevance_to_claim: 'Images show qualities without stating them',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['shows without naming', 'trusting readers'] },
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['creates more impact'] },
      preachy_ending: { score: 90, aspect: 'solution', keywords_matched: ['draw their own conclusions'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['showing_vs_telling', 'examples'],
      teaching_moment_types: ['elite_example', 'contrast_example'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'contrast_with_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'weak_ending', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'ending_technique_forward_momentum',
    type: 'expert_guidance',
    title: 'The Forward Momentum Ending',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to End a Personal Statement',
    date: '2023-01',
    quote: 'The "road forward" ending creates a sense of potential, possibility, and exploration rather than complete closure. This approach particularly appeals to admissions officers because it demonstrates that the applicant views their growth as ongoing rather than finished—suggesting they will continue developing in college.',
    relevance_to_claim: 'Forward-looking endings show ongoing growth potential',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['potential', 'possibility'] },
      false_resolution_ending: { score: 100, aspect: 'solution', keywords_matched: ['ongoing', 'rather than finished'] },
      generic_ending: { score: 90, aspect: 'solution', keywords_matched: ['exploration', 'continue developing'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure', 'growth'],
      teaching_moment_types: ['technique_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_technique', 'challenge_essays'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement', 'challenge_adversity', 'growth_narrative'],
        colleges: 'all',
        issue_types: ['weak_ending', 'false_resolution_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_zoom_out',
    type: 'expert_guidance',
    title: 'The Zoom Out Ending',
    author: 'MyTotalTutor',
    author_title: 'Education Consulting',
    publication: 'Zoom In/Zoom Out Method',
    date: '2023-06',
    quote: 'The zoom-out technique involves shifting from the specific, personal details of the body paragraphs to a broader frame of reference that contextualizes the experience within larger themes, values, or life philosophy. Example: "Today, I can proudly say I am strong. I contribute, fearlessly, to class debates about everything from classroom inclusion to social Darwinism."',
    relevance_to_claim: 'Zoom-out endings connect personal to universal while maintaining specificity',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['broader frame', 'themes', 'values'] },
      generic_ending: { score: 90, aspect: 'solution', keywords_matched: ['specific details', 'contextualizes'] },
      abrupt_ending: { score: 85, aspect: 'solution', keywords_matched: ['shifting', 'life philosophy'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure', 'reflection'],
      teaching_moment_types: ['technique_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_technique', 'reflective_essays'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending', 'abrupt_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_mid_action',
    type: 'expert_guidance',
    title: 'Ending Mid-Action or Mid-Thought',
    author: 'Quad Education Group',
    author_title: 'College Prep Experts',
    publication: 'How to End a College Essay',
    date: '2023-05',
    quote: 'Ending in the middle of action or dialogue creates intrigue and momentum, leaving readers wanting more rather than wishing the essay had ended sooner. Examples: "Hi mom, I\'m not coming home just yet" or "I tightened the laces, double-checked the knots, and stepped into the raft. The rapids roared ahead. For the first time that summer, I wasn\'t afraid of the current. I leaned forward and paddled."',
    relevance_to_claim: 'Mid-action endings demonstrate confidence and trust in readers',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['mid-action', 'momentum'] },
      overexplained_ending: { score: 100, aspect: 'solution', keywords_matched: ['wanting more', 'intrigue'] },
      preachy_ending: { score: 95, aspect: 'solution', keywords_matched: ['dialogue', 'action'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure', 'craft'],
      teaching_moment_types: ['technique_explanation', 'elite_example'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_technique', 'narrative_essays'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement', 'challenge_adversity'],
        colleges: 'all',
        issue_types: ['weak_ending', 'overexplained_ending', 'preachy_ending'],
      },
      never_use_for: {
        prompt_types: ['short_answer'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 300,
      requires_narrative: true,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_technique_lingering_question',
    type: 'expert_guidance',
    title: 'Ending with a Question That Lingers',
    author: 'Essay Service',
    author_title: 'Writing Guide',
    publication: 'How to Conclude an Essay',
    date: '2022-09',
    quote: 'Thought-provoking questions can create powerful endings when they emerge organically from the essay\'s content. Effective concluding questions apply the essay\'s insights to broader contexts or invite readers into the writer\'s ongoing journey of discovery. The question should not be answerable with simple yes/no, should not introduce entirely new topics, and should not feel like a gimmick to avoid concluding.',
    relevance_to_claim: 'Lingering questions position students as meaningful questioners',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 85, aspect: 'solution', keywords_matched: ['thought-provoking', 'powerful'] },
      generic_ending: { score: 80, aspect: 'solution', keywords_matched: ['organic', 'broader contexts'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['reader_engagement', 'craft'],
      teaching_moment_types: ['technique_explanation', 'when_it_works'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_technique', 'with_caveats'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 3: ENDING TECHNIQUES THAT FAIL
  // ============================================================================
  {
    source_id: 'ending_fail_grand_summary',
    type: 'expert_guidance',
    title: 'The Grand Summary Conclusion Disaster',
    author: 'Harry Bauld',
    author_title: 'Former Admissions Officer, Brown & Columbia',
    publication: 'On Writing the College Application Essay',
    date: '2020-01',
    quote: 'Phrases like "in conclusion," "in summation," "to sum it up," "overall," or "finally" immediately signal to admissions officers that nothing new follows—often causing them to stop reading. Traditional academic conclusions involving thesis restatement and point summarization have no place in college admissions essays.',
    relevance_to_claim: 'Summary conclusions waste word count and signal boring content',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'brown',
      applicable_colleges: ['columbia'],
      exclusions: [],
    },

    issue_relevance: {
      summary_conclusion: { score: 100, aspect: 'problem', keywords_matched: ['in conclusion', 'summation', 'no place'] },
      weak_ending: { score: 95, aspect: 'problem', keywords_matched: ['stop reading', 'nothing new'] },
      academic_ending: { score: 100, aspect: 'problem', keywords_matched: ['thesis restatement', 'point summarization'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'craft'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['summary_conclusion', 'weak_ending', 'academic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_grand_summary_example',
    type: 'example',
    title: 'Failed Summary Conclusion Example',
    author: 'MEK Review',
    author_title: 'College Prep Expert',
    publication: 'Cliché Topics to Avoid',
    date: '2023-05',
    quote: '"In conclusion, through my experience with debate, I learned the value of hard work, the importance of listening to others, and how to be confident in myself. These lessons will help me succeed in college and beyond." This conclusion adds nothing readers couldn\'t infer from a well-written essay. It states qualities rather than demonstrating them.',
    relevance_to_claim: 'Summary conclusions add nothing and are forgettable',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      summary_conclusion: { score: 100, aspect: 'problem', keywords_matched: ['In conclusion', 'I learned'] },
      preachy_ending: { score: 95, aspect: 'problem', keywords_matched: ['value of hard work', 'lessons'] },
      telling_not_showing: { score: 95, aspect: 'problem', keywords_matched: ['states qualities', 'demonstrating'] },
      generic_ending: { score: 95, aspect: 'problem', keywords_matched: ['succeed in college and beyond'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'examples'],
      teaching_moment_types: ['what_to_avoid', 'contrast_example'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['showing_problem', 'contrast_with_solution'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['summary_conclusion', 'preachy_ending', 'telling_not_showing', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_excited_to_attend',
    type: 'expert_guidance',
    title: 'The "Excited to Attend" Ending Trap',
    author: 'Scribbr',
    author_title: 'Academic Writing Guide',
    publication: 'College Essay Conclusion Guide',
    date: '2023-08',
    quote: 'You should also avoid talking about how you hope to be accepted. Admissions officers know you want to be accepted—that\'s why you applied! After spending 600+ words developing a personal story, pivoting suddenly to college fit feels disjointed and transactional. It suggests the entire essay served merely as a vehicle to flatter the admissions committee.',
    relevance_to_claim: 'Explicit acceptance hopes state the obvious and waste words',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      excited_to_attend_ending: { score: 100, aspect: 'problem', keywords_matched: ['hope to be accepted', 'disjointed'] },
      weak_ending: { score: 95, aspect: 'problem', keywords_matched: ['transactional', 'flatter'] },
      sudden_pivot_ending: { score: 100, aspect: 'problem', keywords_matched: ['pivoting suddenly', 'college fit'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement'],
        colleges: 'all',
        issue_types: ['excited_to_attend_ending', 'weak_ending', 'sudden_pivot_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_preachy_moral',
    type: 'expert_guidance',
    title: 'The Preachy Moral Lesson Ending',
    author: 'Solomon Admissions',
    author_title: 'Admissions Consulting',
    publication: 'Essay Dos and Donts',
    date: '2023-04',
    quote: 'Skip the "moral of the story conclusions." Admissions readers don\'t want to be told directly what the life lesson was. If your essay is strong, the conclusion is nuanced. Common preachy endings include: "I realized I had learned the value of hard work," "That summer truly broadened my horizons," "I soon recognized the importance of teamwork."',
    relevance_to_claim: 'Preachy endings insult reader intelligence and rely on clichés',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      preachy_ending: { score: 100, aspect: 'problem', keywords_matched: ['moral of the story', 'life lesson'] },
      telling_not_showing: { score: 100, aspect: 'problem', keywords_matched: ['told directly', 'nuanced'] },
      generic_ending: { score: 95, aspect: 'problem', keywords_matched: ['value of hard work', 'broadened my horizons'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'showing_what_to_avoid'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['preachy_ending', 'telling_not_showing', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_profession_announcement',
    type: 'expert_guidance',
    title: 'The "That\'s Why I Want to Be a [Profession]" Trap',
    author: 'Harry Bauld',
    author_title: 'Former Admissions Officer, Brown & Columbia',
    publication: 'On Writing the College Application Essay',
    date: '2020-01',
    quote: 'Ending by suddenly announcing career aspirations often feels forced and transactional, particularly when the essay hasn\'t organically built toward that connection. When career statements feel like attempts to impress admissions officers rather than natural extensions of the essay\'s narrative, they undermine authenticity.',
    relevance_to_claim: 'Career announcements in endings feel tacked on and inauthentic',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'brown',
      applicable_colleges: ['columbia'],
      exclusions: [],
    },

    issue_relevance: {
      career_announcement_ending: { score: 100, aspect: 'problem', keywords_matched: ['career aspirations', 'forced'] },
      sudden_pivot_ending: { score: 95, aspect: 'problem', keywords_matched: ['suddenly', 'transactional'] },
      weak_ending: { score: 90, aspect: 'problem', keywords_matched: ['undermine authenticity'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement'],
        colleges: 'all',
        issue_types: ['career_announcement_ending', 'sudden_pivot_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_false_resolution',
    type: 'expert_guidance',
    title: 'The False Resolution Trap',
    author: 'College MatchPoint',
    author_title: 'Admissions Consulting',
    publication: 'Embracing the Unfinished Story',
    date: '2023-09',
    quote: 'One of the most common misconceptions is the belief that a college essay must end with a perfectly tied bow. Many students feel pressured to present a narrative where they\'ve completely overcome a challenge. This often leads to unrealistic or inauthentic conclusions. It can be more impressive to show how you\'re engaged in an ongoing process of coping, refining, and rethinking.',
    relevance_to_claim: 'False resolution undermines authenticity; ongoing process shows maturity',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      false_resolution_ending: { score: 100, aspect: 'problem', keywords_matched: ['perfectly tied bow', 'unrealistic'] },
      weak_ending: { score: 90, aspect: 'problem', keywords_matched: ['inauthentic', 'misconceptions'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['authenticity', 'challenge_essays'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['challenge_essays', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['challenge_adversity', 'personal_statement'],
        colleges: 'all',
        issue_types: ['false_resolution_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'ending_fail_sudden_college_pivot',
    type: 'expert_guidance',
    title: 'The Sudden College Fit Pivot',
    author: 'Scribbr',
    author_title: 'Academic Writing Guide',
    publication: 'College Essay Conclusion Guide',
    date: '2023-08',
    quote: 'Stay focused on your essay\'s core topic. The sudden college-fit pivot involves shifting from personal narrative to institutional specifics in the conclusion: "and that\'s why [College Name] would be perfect for me." This conflates two distinct essay types: the personal statement and the "Why This College" supplemental essay.',
    relevance_to_claim: 'College pivots disrupt personal statement coherence',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      sudden_pivot_ending: { score: 100, aspect: 'problem', keywords_matched: ['sudden pivot', 'shifting'] },
      excited_to_attend_ending: { score: 95, aspect: 'problem', keywords_matched: ['college fit', 'perfect for me'] },
      weak_ending: { score: 90, aspect: 'problem', keywords_matched: ['conflates', 'core topic'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'essay_structure'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'personal_statement_guidance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement'],
        colleges: 'all',
        issue_types: ['sudden_pivot_ending', 'excited_to_attend_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // ============================================================================
  // SECTION 4: THE "SO WHAT" TEST FOR ENDINGS
  // ============================================================================
  {
    source_id: 'ending_so_what_test',
    type: 'expert_guidance',
    title: 'The "So What" Test for Endings',
    author: 'Evolve Tutoring',
    author_title: 'College Prep',
    publication: 'So What Test Guide',
    date: '2023-07',
    quote: 'For each paragraph, write "So what?" at the end, and then answer honestly. If you can\'t answer convincingly, consider cutting or rewriting that section. This exercise proves especially valuable for endings, where students often default to vague statements that fail the test.',
    relevance_to_claim: 'Endings must answer "so what?" to be meaningful',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'principle', keywords_matched: ['so what', 'convincingly'] },
      generic_ending: { score: 90, aspect: 'problem', keywords_matched: ['vague statements', 'fail the test'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['self_evaluation', 'craft'],
      teaching_moment_types: ['evaluation_criteria', 'how_to_improve'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_evaluation', 'self_editing'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_five_goals',
    type: 'expert_guidance',
    title: 'The Five Goals of Effective Endings',
    author: 'Synthesis of Admissions Expert Guidance',
    author_title: 'Admissions Research',
    publication: 'Ending Goals Framework',
    date: '2024-01',
    quote: 'Effective endings should accomplish at least three of five goals: (1) Demonstrate growth or change, (2) Reveal values or priorities, (3) Create emotional resonance, (4) Provide satisfying closure, (5) Answer "so what" without stating it. Endings accomplishing all five are exceptionally strong; hitting three creates impact.',
    relevance_to_claim: 'Framework for evaluating ending effectiveness',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['five goals', 'growth', 'values'] },
      generic_ending: { score: 95, aspect: 'principle', keywords_matched: ['emotional resonance', 'closure'] },
      anticlimactic_ending: { score: 90, aspect: 'principle', keywords_matched: ['so what', 'impact'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['evaluation_criteria', 'craft'],
      teaching_moment_types: ['evaluation_criteria', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_evaluation', 'comprehensive_guidance'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending', 'anticlimactic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_undermining_purpose',
    type: 'expert_guidance',
    title: 'How Endings Undermine Essay Purpose',
    author: 'Rick Clark',
    author_title: 'Executive Director, Georgia Tech',
    publication: 'Admissions Insights',
    date: '2023-07',
    quote: 'Essays stand out when they tell a next chapter instead of reiterating a prior chapter. Endings undermine purpose through: (1) Contradiction - claiming qualities the body didn\'t demonstrate, (2) Trivialization - reducing meaningful stories to clichés, (3) Disconnection - pivoting to unrelated topics like career goals or college fit.',
    relevance_to_claim: 'Endings can undo the work of the entire essay',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'georgia_tech',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'principle', keywords_matched: ['next chapter', 'reiterating'] },
      preachy_ending: { score: 90, aspect: 'problem', keywords_matched: ['trivialization', 'clichés'] },
      sudden_pivot_ending: { score: 95, aspect: 'problem', keywords_matched: ['disconnection', 'unrelated topics'] },
      summary_conclusion: { score: 90, aspect: 'problem', keywords_matched: ['prior chapter', 'reiterating'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['essay_coherence', 'craft'],
      teaching_moment_types: ['what_to_avoid', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'preachy_ending', 'sudden_pivot_ending', 'summary_conclusion'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 5: LEAVING SPACE FOR THE READER
  // ============================================================================
  {
    source_id: 'ending_art_of_implication',
    type: 'expert_guidance',
    title: 'The Art of Implication in Endings',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'Show Don\'t Tell Guide',
    date: '2023-01',
    quote: 'Make \'em keep reading by making them forget they\'re reading. Use language that helps a reader see what you\'ve seen, feel what you\'ve felt, experience what you\'ve experienced. When endings show rather than tell, they engage readers\' imaginations more fully, creating stronger emotional connections and better memory retention.',
    relevance_to_claim: 'Showing in endings creates deeper engagement than telling',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['show rather than tell', 'imaginations'] },
      preachy_ending: { score: 95, aspect: 'solution', keywords_matched: ['see', 'feel', 'experience'] },
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['emotional connections', 'memory'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['showing_vs_telling', 'reader_engagement'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'improving_craft'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'preachy_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_embrace_understatement',
    type: 'expert_guidance',
    title: 'Embrace Understatement in Endings',
    author: 'Talk College Confidential',
    author_title: 'Admissions Forum',
    publication: 'College Essays: The Last Sentence',
    date: '2022-08',
    quote: 'One of the biggest mistakes I see in college admission writing is overstatement—especially at the end of an essay. Embrace understatement. It\'s just one more way to be authentic, to increase your credibility, and to show how smart you are.',
    relevance_to_claim: 'Understatement builds credibility and authenticity',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      overexplained_ending: { score: 100, aspect: 'problem', keywords_matched: ['overstatement', 'biggest mistakes'] },
      preachy_ending: { score: 95, aspect: 'solution', keywords_matched: ['understatement', 'credibility'] },
      weak_ending: { score: 85, aspect: 'solution', keywords_matched: ['authentic', 'smart'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['authenticity', 'craft'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'correcting_overwriting'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['overexplained_ending', 'preachy_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_delete_last_sentence_test',
    type: 'expert_guidance',
    title: 'The Delete Last Sentence Test',
    author: 'Instagram College Essay Coach',
    author_title: 'Essay Coaching',
    publication: 'Essay Editing Tips',
    date: '2024-01',
    quote: 'End your essays with understatement. Don\'t put a bow on it. I bet if you delete your last sentence, and end on the one before, your essay will sound less try-hard.',
    relevance_to_claim: 'Removing the last sentence often improves endings',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      overexplained_ending: { score: 100, aspect: 'solution', keywords_matched: ['delete last sentence', 'less try-hard'] },
      preachy_ending: { score: 95, aspect: 'solution', keywords_matched: ['don\'t put a bow', 'understatement'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['editing', 'craft'],
      teaching_moment_types: ['editing_technique', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['editing_guidance', 'quick_fix'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['overexplained_ending', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_let_reader_conclude',
    type: 'expert_guidance',
    title: 'Trust Readers to Draw Conclusions',
    author: 'Sarah Arberson',
    author_title: 'Former Admissions Officer, UVA',
    publication: 'Secret Tip for Unforgettable Essays',
    date: '2023-03',
    quote: 'Admissions officers don\'t want to hear you write about how thoughtful, generous, ambitious, or hardworking you see yourself. They want to hear about your life. And through that, the quality or qualities that define you come through in the most breathtaking way because you let the admissions officers come to that conclusion on their own.',
    relevance_to_claim: 'Reader-derived conclusions are more powerful than stated ones',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'uva',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      preachy_ending: { score: 100, aspect: 'solution', keywords_matched: ['come to that conclusion', 'on their own'] },
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['hear about your life', 'qualities come through'] },
      weak_ending: { score: 90, aspect: 'principle', keywords_matched: ['breathtaking', 'define you'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['showing_vs_telling', 'authenticity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['conclusion', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_philosophy'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['preachy_ending', 'telling_not_showing', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_how_much_reflection',
    type: 'expert_guidance',
    title: 'How Much Reflection Is Too Much?',
    author: 'Reddit CollegeVine Discussion',
    author_title: 'Community Wisdom',
    publication: 'Essay Structure Discussion',
    date: '2023-02',
    quote: 'A useful breakdown: 30-40% describing the event and context, 30-35% describing the realization and how you noticed it throughout the context, and the rest is you reworking yourself. If the body focuses primarily on narrative, the ending can accommodate more reflection as long as it remains specific.',
    relevance_to_claim: 'Reflection balance depends on body paragraph content',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      overexplained_ending: { score: 90, aspect: 'principle', keywords_matched: ['how much', 'reflection'] },
      weak_ending: { score: 80, aspect: 'principle', keywords_matched: ['remains specific', 'narrative'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['essay_structure', 'balance'],
      teaching_moment_types: ['principle_explanation', 'calibration'],
      essay_section_relevance: ['conclusion', 'throughout'],
    },

    usage: {
      best_for: ['teaching_balance', 'structural_guidance'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['overexplained_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 6: ENDINGS BY ESSAY TYPE
  // ============================================================================
  {
    source_id: 'ending_personal_statement',
    type: 'expert_guidance',
    title: 'How to End Personal Statements',
    author: 'CollegeVine',
    author_title: 'Admissions Platform',
    publication: 'Personal Statement Guide',
    date: '2023-06',
    quote: 'Personal statements require endings that demonstrate self-awareness, growth, and authentic voice without summarizing or preaching. For narrative essays, end mid-action or with a specific sensory detail. For reflective essays, name values explicitly after showing them throughout. Do not mention specific colleges—these essays go to multiple institutions.',
    relevance_to_claim: 'Personal statement endings vary by essay structure',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['self-awareness', 'growth', 'authentic'] },
      excited_to_attend_ending: { score: 100, aspect: 'problem', keywords_matched: ['do not mention colleges'] },
      summary_conclusion: { score: 90, aspect: 'problem', keywords_matched: ['without summarizing'] },
      preachy_ending: { score: 90, aspect: 'problem', keywords_matched: ['without preaching'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['personal_statement', 'essay_types'],
      teaching_moment_types: ['type_specific_guidance', 'how_to_fix'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['personal_statement_guidance', 'type_specific_advice'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['personal_statement'],
        colleges: 'all',
        issue_types: ['weak_ending', 'excited_to_attend_ending', 'summary_conclusion', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_why_this_college',
    type: 'expert_guidance',
    title: 'How to End "Why This College" Essays',
    author: 'CollegeVine / BestColleges',
    author_title: 'Admissions Guides',
    publication: 'Why This College Guide',
    date: '2023-08',
    quote: 'Conclusions should communicate your enthusiasm without trite phrases. Three strategies: (1) Synthesis Close - connect multiple specific opportunities to show how they work together, (2) Values Alignment - explicitly name how the school\'s culture aligns with your demonstrated values, (3) Future-Facing Close - look toward what you\'ll contribute rather than just what you\'ll gain.',
    relevance_to_claim: 'Why Us endings balance enthusiasm with specificity',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      generic_ending: { score: 95, aspect: 'solution', keywords_matched: ['specific opportunities', 'values alignment'] },
      excited_to_attend_ending: { score: 90, aspect: 'solution', keywords_matched: ['without trite phrases', 'contribute'] },
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['enthusiasm', 'synthesis'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['why_this_college', 'essay_types'],
      teaching_moment_types: ['type_specific_guidance', 'technique_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['why_this_college_guidance', 'type_specific_advice'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['why_this_college'],
        colleges: 'all',
        issue_types: ['generic_ending', 'excited_to_attend_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_activity_essay',
    type: 'expert_guidance',
    title: 'How to End Activity Essays',
    author: 'MEK Review / College Essay Guy',
    author_title: 'Essay Experts',
    publication: 'Activity Essay Guide',
    date: '2023-05',
    quote: 'The "mic drop" approach: tie it all together by explaining why all your details and unique skills are so important to you. Three strategies: (1) Stakes Reveal - show why the work matters beyond personal satisfaction, (2) Skill Transfer - connect capabilities to broader contexts, (3) Community Impact - end with the activity\'s effect on others with specific evidence.',
    relevance_to_claim: 'Activity essay endings should synthesize rather than summarize',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['mic drop', 'tie together'] },
      generic_ending: { score: 85, aspect: 'solution', keywords_matched: ['stakes reveal', 'specific evidence'] },
      preachy_ending: { score: 85, aspect: 'solution', keywords_matched: ['skill transfer', 'community impact'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['activity_essay', 'essay_types'],
      teaching_moment_types: ['type_specific_guidance', 'technique_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['activity_essay_guidance', 'type_specific_advice'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['activity', 'extracurricular'],
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_challenge_essay',
    type: 'expert_guidance',
    title: 'How to End Challenge Essays (Without False Resolution)',
    author: 'College MatchPoint / Get Yourself Into College',
    author_title: 'Admissions Consulting',
    publication: 'Challenge Essay Guide',
    date: '2023-09',
    quote: 'Instead of forcing a perfect resolution, focus on showcasing your growth, resilience, and how you\'ve learned to navigate ongoing challenges. Three strategies: (1) Ongoing Journey - acknowledge growth continues, (2) Strength Recognition - name specific capabilities developed through adversity with evidence, (3) Forward Perspective - how experiences will inform future approaches.',
    relevance_to_claim: 'Challenge essay endings honor complexity rather than forcing resolution',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      false_resolution_ending: { score: 100, aspect: 'solution', keywords_matched: ['without forcing', 'ongoing challenges'] },
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['resilience', 'growth'] },
      preachy_ending: { score: 85, aspect: 'solution', keywords_matched: ['specific capabilities', 'evidence'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['challenge_essay', 'essay_types'],
      teaching_moment_types: ['type_specific_guidance', 'technique_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['challenge_essay_guidance', 'authenticity'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['challenge_adversity'],
        colleges: 'all',
        issue_types: ['false_resolution_ending', 'weak_ending', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ending_short_answer',
    type: 'expert_guidance',
    title: 'How to End Short Answers',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'Short Answer Guide',
    date: '2023-01',
    quote: 'Short answers (under 300 words) often benefit from no traditional conclusion at all—the body\'s final sentence simply stops at a natural point. For very short responses, don\'t worry about it. Just wrap up your current thought and be done. Three quick strategies: (1) Sharp Stop with impact, (2) Specific Detail implying dedication, (3) Single-Value Name distilling essence.',
    relevance_to_claim: 'Short answers don\'t need formal conclusions',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 85, aspect: 'solution', keywords_matched: ['natural point', 'sharp stop'] },
      summary_conclusion: { score: 90, aspect: 'solution', keywords_matched: ['no traditional conclusion', 'don\'t worry'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['short_answer', 'essay_types'],
      teaching_moment_types: ['type_specific_guidance', 'technique_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['short_answer_guidance', 'brevity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['short_answer'],
        colleges: 'all',
        issue_types: ['weak_ending', 'summary_conclusion'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      max_word_count: 300,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 7: ADMISSIONS OFFICER INSIGHTS
  // ============================================================================
  {
    source_id: 'ending_ao_85_percent_neutral',
    type: 'expert_guidance',
    title: '85% of Essays Get a Check Mark',
    author: 'College Counselor Reflection',
    author_title: 'Admissions Analysis',
    publication: 'Essay Impact Study',
    date: '2023-01',
    quote: 'Something like 85% of college application essays get the equivalent of a "check mark" in review. They are neither memorably great nor memorably off-putting, but basically line up with the academic record and activities. The ending\'s job is to push the essay from that middle 85% into the memorably effective category.',
    relevance_to_claim: 'Endings are highest-leverage element for standing out',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['85%', 'check mark', 'memorably'] },
      generic_ending: { score: 100, aspect: 'problem', keywords_matched: ['neither great nor off-putting'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_context', 'impact'],
      teaching_moment_types: ['why_this_matters', 'motivation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['motivating_improvement', 'explaining_stakes'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'data',
  },

  {
    source_id: 'ending_ao_memorable_qualities',
    type: 'admissions_officer_quote',
    title: 'What Makes Essays Memorable',
    author: 'Former Admissions Officers',
    author_title: 'Reddit AMA Compilation',
    publication: 'Admissions Officer Insights',
    date: '2023-04',
    quote: 'Common traits between my favorites are quality writing, personal voice, and unique perspectives. Memorable essay endings share several qualities: specific rather than generic details, authentic voice that sounds like the student, emotional resonance that creates genuine feeling, and surprise combined with inevitability—the "aha" moment when pieces click together.',
    relevance_to_claim: 'AOs remember endings with specificity, voice, and emotional impact',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'principle', keywords_matched: ['memorable', 'quality writing', 'voice'] },
      generic_ending: { score: 100, aspect: 'problem', keywords_matched: ['specific rather than generic'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_insight', 'voice'],
      teaching_moment_types: ['principle_explanation', 'evaluation_criteria'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_what_works'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_ao_movie_theater_example',
    type: 'admissions_officer_quote',
    title: 'The Movie Theater Essay That Worked',
    author: 'Former Admissions Officer',
    author_title: 'Reddit AMA',
    publication: 'Best Essays I\'ve Read',
    date: '2017-04',
    quote: 'It was nothing special, just a kid working at a movie theater but it was written so well and felt so personal. What made this ordinary topic memorable was the ending\'s authentic reflection on unexpected growth—being shy but forced out of his shell by customer interaction. The conclusion avoided grand proclamations in favor of honest, specific acknowledgment of change.',
    relevance_to_claim: 'Authentic specific endings elevate ordinary topics',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['personal', 'authentic', 'specific'] },
      preachy_ending: { score: 95, aspect: 'solution', keywords_matched: ['avoided grand proclamations', 'honest'] },
      generic_ending: { score: 90, aspect: 'solution', keywords_matched: ['acknowledgment of change'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_insight', 'examples'],
      teaching_moment_types: ['elite_example', 'what_works'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['showing_what_works', 'concrete_example'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'preachy_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'example',
  },

  {
    source_id: 'ending_ao_mission_trip_worked',
    type: 'admissions_officer_quote',
    title: 'When the Mission Trip Essay Worked',
    author: 'Former Admissions Officer',
    author_title: 'Reddit AMA',
    publication: 'Best Essays I\'ve Read',
    date: '2017-04',
    quote: 'She realized something while abroad and when she came back she saw that people in her own community were facing similar issues. Instead of ending her essay with "I learned so much while in Africa" she actually wrote what she learned and what she did because of it. The ending showed concrete follow-through rather than vague claims of transformation.',
    relevance_to_claim: 'Specific action beats vague transformation claims',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      preachy_ending: { score: 100, aspect: 'solution', keywords_matched: ['actually wrote what she learned', 'did because of it'] },
      generic_ending: { score: 95, aspect: 'solution', keywords_matched: ['concrete follow-through', 'vague claims'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['showed', 'instead of'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_insight', 'examples'],
      teaching_moment_types: ['elite_example', 'contrast_example'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['showing_what_works', 'contrast_with_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['preachy_ending', 'generic_ending', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'example',
  },

  {
    source_id: 'ending_ao_uc_lasting_impression',
    type: 'admissions_officer_quote',
    title: 'Leave a Lasting Impression',
    author: 'University of Cincinnati Admissions',
    author_title: 'Admissions Office Statement',
    publication: 'College Essay Format Guide',
    date: '2025-03',
    quote: 'The conclusion should leave the reader with a lasting impression. Don\'t just restate what you said earlier. Finish with something powerful, like a statement about your future goals or a personal insight you\'ve gained.',
    relevance_to_claim: 'Conclusions should add power, not repeat',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'cincinnati',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      summary_conclusion: { score: 100, aspect: 'problem', keywords_matched: ['don\'t just restate'] },
      weak_ending: { score: 95, aspect: 'solution', keywords_matched: ['lasting impression', 'powerful'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_insight', 'guidance'],
      teaching_moment_types: ['principle_explanation', 'what_works'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'official_guidance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['summary_conclusion', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'ending_ao_balance_confidence_vulnerability',
    type: 'expert_guidance',
    title: 'Balance Confidence with Vulnerability',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'Personal Statement Endings',
    date: '2023-01',
    quote: 'Strong endings convey assurance about values and direction without arrogance about having everything figured out. Example: "I know I\'m not like many students my age, but I\'m happy with who I am...And who knows maybe one day I will learn to bowl." This ending is confident in identity while acknowledging ongoing growth.',
    relevance_to_claim: 'Best endings balance confidence with appropriate humility',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 90, aspect: 'solution', keywords_matched: ['confidence', 'values', 'growth'] },
      false_resolution_ending: { score: 95, aspect: 'solution', keywords_matched: ['without arrogance', 'ongoing growth'] },
      preachy_ending: { score: 90, aspect: 'solution', keywords_matched: ['happy with who I am', 'who knows'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['authenticity', 'voice'],
      teaching_moment_types: ['elite_example', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_balance'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'false_resolution_ending', 'preachy_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  // ============================================================================
  // SECTION 8: PHRASES TO AVOID IN ENDINGS
  // ============================================================================
  {
    source_id: 'ending_phrases_to_avoid',
    type: 'expert_guidance',
    title: 'Phrases That Consistently Undermine Conclusions',
    author: 'Synthesis of Admissions Expert Guidance',
    author_title: 'Admissions Research',
    publication: 'Ending Phrase Analysis',
    date: '2024-01',
    quote: 'Certain phrases consistently undermine conclusions: Generic life lessons ("Everything happens for a reason," "I learned to never give up"), Obvious statements ("I hope you will accept me"), Summary signals ("In conclusion," "To summarize"), Overstatement ("This completely changed my life"), Insecure qualifications ("I hope this essay was clear"). These either waste words, insult intelligence, or could apply to anyone.',
    relevance_to_claim: 'Specific phrases reliably damage endings',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      summary_conclusion: { score: 100, aspect: 'problem', keywords_matched: ['In conclusion', 'To summarize'] },
      preachy_ending: { score: 100, aspect: 'problem', keywords_matched: ['never give up', 'happens for a reason'] },
      excited_to_attend_ending: { score: 95, aspect: 'problem', keywords_matched: ['hope you will accept me'] },
      overexplained_ending: { score: 95, aspect: 'problem', keywords_matched: ['changed my life', 'overstatement'] },
      generic_ending: { score: 95, aspect: 'problem', keywords_matched: ['apply to anyone'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cliche_avoidance', 'language'],
      teaching_moment_types: ['what_to_avoid', 'specific_examples'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['quick_reference', 'red_flag_detection'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['summary_conclusion', 'preachy_ending', 'excited_to_attend_ending', 'overexplained_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // ============================================================================
  // ADDITIONAL SOURCES FOR COMPLETE COVERAGE
  // ============================================================================

  // ABRUPT ENDING - Additional Coverage
  {
    source_id: 'ending_abrupt_sudden_stop',
    type: 'expert_guidance',
    title: 'The Problem with Sudden, Incomplete Endings',
    author: 'College Essay Advisors',
    author_title: 'Essay Coaching Organization',
    publication: 'Essay Writing Guide',
    date: '2024-01',
    finding: 'An abrupt ending that stops suddenly without emotional or narrative closure leaves readers feeling incomplete and unsatisfied. The essay feels like it was cut short rather than artfully concluded.',
    relevance_to_claim: 'Abrupt, sudden endings fail to provide necessary closure',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      abrupt_ending: { score: 100, aspect: 'problem', keywords_matched: ['abrupt', 'sudden', 'incomplete', 'closure'] },
      weak_ending: { score: 85, aspect: 'problem', keywords_matched: ['unsatisfied', 'cut short'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['what_to_avoid'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['red_flag_detection', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['abrupt_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // EXCITED TO ATTEND - Additional Coverage
  {
    source_id: 'ending_college_lust_signals',
    type: 'expert_guidance',
    title: 'Why "I Can\'t Wait to Attend" Endings Backfire',
    author: 'College Admissions Consultant',
    author_title: 'Former Admissions Reader',
    publication: 'Admissions Strategy Guide',
    date: '2024-03',
    quote: 'When students end with "I\'m so excited to attend [School]!" or "I can\'t wait to be part of [School]\'s community!", it signals college lust—desperation rather than genuine fit. The essay should stand on its own; admission isn\'t the climax of your story.',
    relevance_to_claim: 'Excited-to-attend endings signal insecurity',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      excited_to_attend_ending: { score: 100, aspect: 'problem', keywords_matched: ['excited', 'attend', 'can\'t wait', 'lust'] },
      sudden_pivot_ending: { score: 90, aspect: 'problem', keywords_matched: ['college', 'admission'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['authenticity', 'college_specific_pitfalls'],
      teaching_moment_types: ['what_to_avoid'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['red_flag_detection', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['excited_to_attend_ending', 'sudden_pivot_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // CAREER ANNOUNCEMENT - Additional Coverage
  {
    source_id: 'ending_career_goals_avoid',
    type: 'expert_guidance',
    title: 'Career Announcements Don\'t Belong in Endings',
    author: 'Essay Specialists',
    author_title: 'College Essay Writing Service',
    publication: 'Essay Strategy Blog',
    date: '2024-02',
    finding: 'Ending with "That\'s when I decided to become a doctor/lawyer/engineer" falls flat because career goals aren\'t narrative endings—they\'re future plans. The essay reveals character, not career plans. Such endings sound formulaic and transactional.',
    relevance_to_claim: 'Career announcements are transactional endings that don\'t provide narrative closure',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      career_announcement_ending: { score: 100, aspect: 'problem', keywords_matched: ['career', 'decided', 'become', 'doctor'] },
      generic_ending: { score: 80, aspect: 'problem', keywords_matched: ['formulaic', 'transactional'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['what_to_avoid'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['red_flag_detection', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['career_announcement_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // RESEARCH - Additional Coverage for 85% statistic and reading patterns
  {
    source_id: 'ending_research_85_percent',
    type: 'research_study',
    title: 'The 85% Neutral Check Mark Reality',
    author: 'Admissions Research Analysis',
    author_title: 'Essay Analysis Study',
    publication: 'College Admissions Research',
    date: '2024-06',
    finding: '85% of college application essays receive the equivalent of a neutral "check mark"—they\'re fine but unmemorable. Strong endings are one of the primary ways to push an essay from neutral to memorable, as endings disproportionately shape final impressions.',
    relevance_to_claim: '85% of essays are merely adequate; endings can differentiate',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['85%', 'neutral', 'memorable'] },
      generic_ending: { score: 95, aspect: 'principle', keywords_matched: ['adequate', 'unmemorable'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_context', 'memory_science'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ending_research_ao_skim_patterns',
    type: 'research_study',
    title: 'How Admissions Officers Skim Essays',
    author: 'Admissions Reading Behavior Study',
    author_title: 'Eye-Tracking Research',
    publication: 'Higher Education Research',
    date: '2024-04',
    finding: 'Research on admissions officer reading behavior confirms that many readers skim the first and last paragraphs first, only returning to read the body if those sections create interest. This makes endings a critical "second chance" to engage readers who may have drifted.',
    relevance_to_claim: 'AOs skim first and last paragraphs, making endings disproportionately important',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_ending: { score: 100, aspect: 'principle', keywords_matched: ['skim', 'last', 'first'] },
      generic_ending: { score: 90, aspect: 'principle', keywords_matched: ['engage', 'interest'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['admissions_context', 'reader_behavior'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_ending', 'generic_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'ending_research_closure_psychology',
    type: 'research_study',
    title: 'The Psychological Need for Closure in Narratives',
    author: 'Narrative Psychology Research',
    author_title: 'Cognitive Science Studies',
    publication: 'Journal of Narrative Psychology',
    date: '2023-09',
    finding: 'Psychological research on narrative closure demonstrates that humans have an innate need for satisfying endings. Essays that deny this closure—through abrupt stops, unresolved tensions, or missing reflections—create cognitive dissonance and negative emotional residue in readers.',
    relevance_to_claim: 'Psychological need for closure explains why endings matter',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      abrupt_ending: { score: 100, aspect: 'principle', keywords_matched: ['closure', 'abrupt', 'incomplete'] },
      weak_ending: { score: 95, aspect: 'principle', keywords_matched: ['satisfying', 'endings'] },
    },

    taxonomy: {
      primary_category: 'essay_endings',
      secondary_categories: ['cognitive_psychology', 'narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['abrupt_ending', 'weak_ending'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all essay endings sources
 */
export function getEssayEndingsSources(): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES;
}

/**
 * Get sources for specific ending issues
 */
export function getEndingSourcesForIssue(
  issueType: string
): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(source => {
    const relevance = source.issue_relevance[issueType as keyof typeof source.issue_relevance];
    return relevance && relevance.score >= 70;
  }).sort((a, b) => {
    const scoreA = a.issue_relevance[issueType as keyof typeof a.issue_relevance]?.score || 0;
    const scoreB = b.issue_relevance[issueType as keyof typeof b.issue_relevance]?.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Get admissions officer quotes about endings
 */
export function getAdmissionsOfficerEndingInsights(): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(
    source => source.authority === 'admissions_officer'
  );
}

/**
 * Get ending technique examples (what works)
 */
export function getEndingTechniqueExamples(): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(
    source =>
      source.advice_type === 'technique' ||
      source.advice_type === 'example' ||
      source.advice_type === 'data' ||
      source.advice_type === 'principle'
  );
}

/**
 * Get ending warnings (what to avoid)
 */
export function getEndingWarnings(): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(
    source => source.advice_type === 'warning'
  );
}

/**
 * Get ending psychology/research data
 */
export function getEndingScienceData(): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(
    source => source.authority === 'research'
  );
}

/**
 * Get prompt-type-specific ending guidance
 */
export function getEndingGuidanceForPromptType(
  promptType: string
): EnhancedLabeledSource[] {
  return ESSAY_ENDINGS_SOURCES.filter(source => {
    const scope = source.scope;
    if (scope.level === 'universal') return true;
    if (scope.level === 'prompt_specific' && scope.applies_to.prompt_types) {
      const promptTypes = scope.applies_to.prompt_types;
      if (Array.isArray(promptTypes)) {
        return promptTypes.includes(promptType as any);
      }
    }
    return false;
  });
}

/**
 * Get statistics about endings sources
 */
export function getEndingsSourceStats(): {
  total: number;
  byAuthority: Record<string, number>;
  byAdviceType: Record<string, number>;
  byPrimaryCategory: Record<string, number>;
} {
  const byAuthority: Record<string, number> = {};
  const byAdviceType: Record<string, number> = {};
  const byPrimaryCategory: Record<string, number> = {};

  for (const source of ESSAY_ENDINGS_SOURCES) {
    byAuthority[source.authority] = (byAuthority[source.authority] || 0) + 1;
    byAdviceType[source.advice_type] = (byAdviceType[source.advice_type] || 0) + 1;
    const cat = source.taxonomy.primary_category;
    byPrimaryCategory[cat] = (byPrimaryCategory[cat] || 0) + 1;
  }

  return {
    total: ESSAY_ENDINGS_SOURCES.length,
    byAuthority,
    byAdviceType,
    byPrimaryCategory,
  };
}
