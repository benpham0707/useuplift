/**
 * Essay Openings and First Impressions Research Sources
 *
 * SOURCE: Comprehensive Perplexity Deep Research (127+ sources analyzed)
 * SCOPE: Universal principles for essay openings across all college essay types
 *
 * This file contains research-backed insights on:
 * 1. The Science of First Impressions (time constraints, cognitive psychology)
 * 2. Opening Techniques That Work (in medias res, sensory immersion, dialogue, etc.)
 * 3. Opening Techniques That Fail (dictionary definitions, childhood clichés, etc.)
 * 4. Hook vs. Gimmick Distinction (authenticity tests)
 * 5. Essay Type-Specific Opening Strategies
 * 6. First Sentence Analysis (anatomy of excellence vs. weakness)
 * 7. Direct Admissions Officer Insights
 *
 * Key Research Findings:
 * - AOs spend 8-15 minutes max on complete applications
 * - Initial essay reads can be 90 seconds or less at highly selective schools
 * - First impression forms in first 10 words (8 seconds = ~17 words)
 * - Thin-slicing research shows judgments form in 2-10 seconds with remarkable accuracy
 * - 60% of elite essays use sensory/visceral openings
 * - 0% of elite essays use generic openings ("ever since I was young")
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// ESSAY OPENINGS SOURCES DATABASE
// ============================================================================

export const ESSAY_OPENINGS_SOURCES: EnhancedLabeledSource[] = [
  // ============================================================================
  // SECTION 1: THE SCIENCE OF FIRST IMPRESSIONS
  // ============================================================================
  {
    source_id: 'opening_science_eight_minute_rule',
    type: 'research_study',
    title: 'The 8-Minute Rule in College Admissions',
    author: 'Ivy Coach',
    author_title: 'Admissions Analysis Organization',
    publication: 'Admissions Research',
    date: '2023-01',
    finding: 'Admissions officers can determine an applicant\'s admissibility after approximately 8 minutes of evaluating the entire application. This compressed timeline means the first few sentences must work exceptionally hard.',
    relevance_to_claim: 'Time constraints make opening sentences disproportionately important',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'principle', keywords_matched: ['8 minutes', 'first sentences', 'time'] },
      generic_opening: { score: 95, aspect: 'principle', keywords_matched: ['work hard', 'compressed'] },
      cliche_essay_formula: { score: 85, aspect: 'principle', keywords_matched: ['first sentences'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['admissions_context', 'time_constraints'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'opening_science_upenn_four_minutes',
    type: 'research_study',
    title: 'Penn\'s 4-Minute Initial Review',
    author: 'Cosmic College Consulting',
    author_title: 'Admissions Research',
    publication: 'Application Review Time Study',
    date: '2023-05',
    finding: 'Top-tier institutions like the University of Pennsylvania complete initial reviews in just 4 minutes using a two-reader system where officers simultaneously review different application components.',
    relevance_to_claim: 'Elite institutions use extremely compressed review times',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'upenn',
      applicable_colleges: ['harvard', 'stanford', 'yale', 'princeton', 'columbia', 'brown', 'dartmouth', 'cornell'],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'principle', keywords_matched: ['4 minutes', 'initial review'] },
      generic_opening: { score: 90, aspect: 'principle', keywords_matched: ['two-reader system'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['admissions_context'],
      teaching_moment_types: ['why_this_matters'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['justifying_severity', 'showing_stakes'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['upenn', 'ivy_league'],
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'opening_science_ninety_seconds',
    type: 'expert_guidance',
    title: 'The 90-Second First Round',
    author: 'The Ivy Institute',
    author_title: 'Admissions Consulting',
    publication: 'Application Review Analysis',
    date: '2023-03',
    quote: 'At highly selective schools, 90 seconds or less may be devoted to the first-round reading, with the first few sentences being "immensely telling" about whether an applicant\'s voice resonates with the institution\'s ethos.',
    relevance_to_claim: 'First sentences determine first-round engagement',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'principle', keywords_matched: ['90 seconds', 'first sentences', 'immensely telling'] },
      generic_opening: { score: 95, aspect: 'principle', keywords_matched: ['voice resonates', 'institution ethos'] },
      cliche_essay_formula: { score: 90, aspect: 'principle', keywords_matched: ['first sentences'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['admissions_context', 'voice_authenticity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'data',
  },

  {
    source_id: 'opening_science_thin_slicing',
    type: 'research_study',
    title: 'Thin-Slicing Psychology: The Science of First Impressions',
    author: 'Nalini Ambady',
    author_title: 'Psychology Professor, Tufts University',
    publication: 'Journal of Personality and Social Psychology',
    date: '1992-01',
    finding: 'People form remarkably accurate first impressions within mere seconds. Observers rating teachers after viewing 2-second, 5-second, and 10-second video clips produced evaluations virtually identical to those who had substantial interactions. The accuracy did not significantly differ based on clip length.',
    relevance_to_claim: 'First impressions form almost instantaneously and are remarkably accurate',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'principle', keywords_matched: ['first impressions', 'mere seconds', 'accuracy'] },
      generic_opening: { score: 90, aspect: 'principle', keywords_matched: ['thin slices', 'virtually identical'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cognitive_psychology', 'reader_engagement'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_principle', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_science_attention_span',
    type: 'research_study',
    title: 'The 8-Second Attention Window',
    author: 'College Rover',
    author_title: 'Admissions Research',
    publication: 'Essay Tips Analysis',
    date: '2023-06',
    finding: 'The average human attention span is approximately 8 seconds, which translates to roughly 17 words at normal reading pace. This is why the first sentence carries disproportionate weight: it represents the moment when the reader decides whether to engage deeply or skim superficially.',
    relevance_to_claim: 'First 17 words determine reader engagement level',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'principle', keywords_matched: ['8 seconds', '17 words', 'first sentence'] },
      generic_opening: { score: 95, aspect: 'principle', keywords_matched: ['engage deeply', 'skim'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cognitive_psychology', 'reader_engagement'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_importance'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'opening_science_neural_impression_formation',
    type: 'research_study',
    title: 'Neural Mechanisms of Impression Formation',
    author: 'NIH/PMC Research',
    author_title: 'Neuroscience Study',
    publication: 'PMC Neuroscience Journal',
    date: '2012-01',
    finding: 'Functional MRI research reveals that intentional impression formation engages the dorsomedial prefrontal cortex (dmPFC) more intensely. Diagnostic information—details that readily lend themselves to forming trait impressions—engages the dmPFC more than neutral information.',
    relevance_to_claim: 'Openings should provide diagnostic information about character for neural engagement',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 85, aspect: 'principle', keywords_matched: ['diagnostic information', 'trait impressions'] },
      generic_opening: { score: 90, aspect: 'principle', keywords_matched: ['neutral information', 'engagement'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['diagnostic', 'trait'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cognitive_psychology', 'character_revelation'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_technique'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: false,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 2: OPENING TECHNIQUES THAT WORK
  // ============================================================================
  {
    source_id: 'opening_technique_in_medias_res',
    type: 'literary_principle',
    title: 'In Medias Res: The Power of Starting Mid-Action',
    author: 'Dabble Writer',
    author_title: 'Narrative Craft Guide',
    publication: 'Literary Techniques',
    date: '2023-01',
    quote: 'In medias res drops readers directly into a moment of action, conflict, or significance, bypassing lengthy exposition. It works best for essays centered on defining events, stories with inherent dramatic tension, and narratives where the journey to understanding is as important as the outcome.',
    relevance_to_claim: 'Starting mid-action creates immediate engagement and narrative urgency',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'solution', keywords_matched: ['in medias res', 'action', 'engagement'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['bypassing exposition', 'mid-action'] },
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['conflict', 'significance'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['journey', 'narrative'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['narrative_structure', 'reader_engagement'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'technique_explanation'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
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
    authority: 'principle',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_in_medias_res_example',
    type: 'expert_guidance',
    title: 'In Medias Res Example Analysis',
    author: 'Empowerly',
    author_title: 'Admissions Consulting',
    publication: 'College Essay Introduction Guide',
    date: '2023-07',
    quote: '"The flames were already licking up the side of the hill below our house when I realized the evacuation notice blaring on the TV was meant for us." This works because it immediately establishes physical danger, creates emotional urgency, and places the reader directly in a moment of realization.',
    relevance_to_claim: 'In medias res works through specificity, urgency, and direct immersion',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['flames', 'evacuation', 'realization'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['physical danger', 'emotional urgency'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['licking', 'blaring', 'immersion'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'sensory_details'],
      teaching_moment_types: ['elite_example', 'before_after'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_technique'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'opening_technique_hemingway_full',
    type: 'expert_guidance',
    title: 'The Full Hemingway: Complete Sensory Scene',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: 'The Full Hemingway presents a complete scene with vivid sensory details that drop the reader into a specific moment. This approach works best for longer essays (650 words) where there\'s room to develop the scene fully.',
    relevance_to_claim: 'Sensory immersion creates immediate reader presence',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'solution', keywords_matched: ['sensory details', 'specific moment'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['vivid', 'scene', 'drop reader'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['sensory', 'showing'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'sensory_details'],
      teaching_moment_types: ['technique_explanation', 'how_to_fix'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_technique', 'explaining_approach'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement', 'challenge_adversity', 'growth_narrative'],
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      never_use_for: {
        prompt_types: ['short_answer', 'activity_elaboration'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 400,
      requires_narrative: true,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_hemingway_mini',
    type: 'expert_guidance',
    title: 'The Mini Hemingway: Focused Sensory Opening',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: 'The Mini Hemingway begins with one or two specific details or a specific image, then provides additional specifics within the first 3-4 sentences. Example: "I refused to throw dirt on her." This single sentence immediately creates questions while hinting at emotional resistance.',
    relevance_to_claim: 'Even brief sensory openings create powerful engagement',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'solution', keywords_matched: ['specific details', 'creates questions'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['specific image', 'emotional'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['refused', 'dirt', 'showing'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'specificity'],
      teaching_moment_types: ['technique_explanation', 'elite_example'],
      essay_section_relevance: ['opening'],
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
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_dialogue',
    type: 'expert_guidance',
    title: 'Starting with Dialogue',
    author: 'CollegeVine',
    author_title: 'Admissions Platform',
    publication: 'Guidelines for Readable College Essays',
    date: '2023-08',
    quote: 'Dialogue works when the specific words spoken are more revealing than summarizing what was said. Example: "\'1…2…3…4 pirouettes! New record!\' My friends cheered as I landed my turns." The counting mimics the rhythm of the activity, and dialogue creates immediate presence.',
    relevance_to_claim: 'Authentic dialogue creates presence and reveals character',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['dialogue', 'immediate presence'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['specific words', 'revealing'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['dialogue', 'showing'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'voice_authenticity'],
      teaching_moment_types: ['technique_explanation', 'elite_example'],
      essay_section_relevance: ['opening'],
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
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_dialogue_vs_quotation',
    type: 'expert_guidance',
    title: 'Dialogue vs. Famous Quotations',
    author: 'MEK Review',
    author_title: 'College Prep Expert',
    publication: 'Cliché Topics to Avoid',
    date: '2023-05',
    quote: 'A crucial distinction exists between dialogue (capturing what someone in your life said) and quotations (citing famous figures). While dialogue from personal experience enhances authenticity, opening with famous quotations typically fails because it displaces your voice with someone else\'s.',
    relevance_to_claim: 'Personal dialogue works; famous quotations fail',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 90, aspect: 'principle', keywords_matched: ['dialogue', 'quotations'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['famous quotations', 'displaces voice'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['famous figures', 'fails'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'cliche_avoidance'],
      teaching_moment_types: ['what_to_avoid', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_technique_sensory_immersion',
    type: 'expert_guidance',
    title: 'The Five Senses Approach',
    author: 'Demme Learning',
    author_title: 'Educational Writing Guide',
    publication: 'Sensory Details in Writing',
    date: '2023-03',
    quote: 'Effective openings engage multiple senses to create immersive experiences that feel tangible rather than abstract. Instead of "I enjoy gardening," write: "The smell of freshly turned soil, the vibrant colors of blooming flowers, and the feeling of dirt under my fingernails—these sensations ground me in ways that nothing else can."',
    relevance_to_claim: 'Multi-sensory details create visceral reader engagement',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['sensory', 'immersive', 'tangible'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['smell', 'colors', 'feeling'] },
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['instead of', 'sensory details'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'sensory_details'],
      teaching_moment_types: ['before_after', 'how_to_fix'],
      essay_section_relevance: ['opening', 'body'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_technique'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_bold_statement',
    type: 'expert_guidance',
    title: 'Bold Statement Openings',
    author: 'Empowerly',
    author_title: 'College Application Expert',
    publication: 'Upgrade College Essay Introduction',
    date: '2023-07',
    quote: '"I failed my first behind-the-wheel driver\'s test—on purpose." This works because it\'s simultaneously surprising (most people don\'t fail tests intentionally) and specific (not "I failed a test" but "behind-the-wheel driver\'s test"). Bold statements must be true, relevant, specific, and genuinely surprising.',
    relevance_to_claim: 'Surprising statements create immediate curiosity when grounded in authenticity',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['surprising', 'bold statement'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['specific', 'on purpose'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['surprising', 'genuinely'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['elite_example', 'technique_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_technique'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'opening_technique_philosophical_question',
    type: 'expert_guidance',
    title: 'When Philosophical Questions Work',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: '"Which person is more important: the one who presses the button or the one who risks being destroyed?" This question raises a complex, interesting philosophical issue while hinting at the essay\'s exploration. Questions work when they have clear relevance, create genuine curiosity, and avoid being answerable with simple yes/no.',
    relevance_to_claim: 'Philosophical questions work when they create genuine intrigue',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 80, aspect: 'solution', keywords_matched: ['philosophical', 'complex', 'curiosity'] },
      rhetorical_question_flat: { score: 95, aspect: 'solution', keywords_matched: ['when questions work', 'clear relevance'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['intellectual_depth', 'reader_engagement'],
      teaching_moment_types: ['technique_explanation', 'elite_example'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_nuance', 'showing_when_works'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['personal_statement', 'intellectual_curiosity'],
        colleges: 'all',
        issue_types: ['weak_opening', 'rhetorical_question_flat'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 3: OPENING TECHNIQUES THAT FAIL
  // ============================================================================
  {
    source_id: 'opening_fail_thesis_statement',
    type: 'expert_guidance',
    title: 'Why Thesis Statement Openings Fail',
    author: 'Koppelman Group',
    author_title: 'Admissions Consulting',
    publication: '10 Bad Opening Lines',
    date: '2020-12',
    quote: 'Beginning with "There have been many experiences throughout my life that prove that I am a tolerant person who is good at communicating" immediately signals an academic paper, not a personal narrative. It tells rather than shows, lacks emotional engagement, sounds boastful, and is inappropriate for the register expected.',
    relevance_to_claim: 'Thesis statements belong in academic essays, not personal statements',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      thesis_statement_opening: { score: 100, aspect: 'problem', keywords_matched: ['thesis statement', 'academic paper', 'proves that'] },
      weak_opening: { score: 100, aspect: 'problem', keywords_matched: ['thesis statement', 'academic paper'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['many experiences', 'throughout my life'] },
      telling_not_showing: { score: 100, aspect: 'problem', keywords_matched: ['tells rather than shows'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['boastful', 'formal'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['thesis_statement_opening', 'weak_opening', 'generic_opening', 'telling_not_showing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_dictionary_definition',
    type: 'expert_guidance',
    title: 'The Dictionary Definition Disaster',
    author: 'Reddit ApplyingToCollege Community',
    author_title: 'Community Wisdom',
    publication: 'Top 30 Essay Mistakes',
    date: '2018-06',
    quote: 'An alarmingly high number of applicants open with dictionary definitions. This starts the essay with a sigh from your AO. It\'s pedantic and worthless—it says nothing about you as an individual. It\'s classified as a "timeworn opener" that has lost its luster because it\'s so impersonal.',
    relevance_to_claim: 'Dictionary definitions are universally panned as weak openings',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      dictionary_definition_opening: { score: 100, aspect: 'problem', keywords_matched: ['dictionary definition', 'pedantic', 'impersonal'] },
      weak_opening: { score: 100, aspect: 'problem', keywords_matched: ['timeworn', 'sigh'] },
      generic_opening: { score: 100, aspect: 'problem', keywords_matched: ['nothing about you', 'worthless'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['alarmingly high number'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['dictionary_definition_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_since_child',
    type: 'expert_guidance',
    title: 'The "Since I Was a Child" Cliché',
    author: 'College Confidential',
    author_title: 'Admissions Forum',
    publication: 'Essay Opening Analysis',
    date: '2023-01',
    quote: 'Variations of "since I was a child," "from an early age," "ever since I was young," and "throughout my life" represent THE MOST COMMON opening pattern. It fails because: (1) It sounds like everyone else, (2) AOs want CURRENT interests, not memories from age 10, (3) Childhood memories are vague and general, (4) It lacks specificity from recent experience.',
    relevance_to_claim: 'Childhood openings are the most common cliché and signal lack of originality',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      childhood_opening_cliche: { score: 100, aspect: 'problem', keywords_matched: ['since I was a child', 'throughout my life'] },
      weak_opening: { score: 100, aspect: 'problem', keywords_matched: ['most common', 'lacks specificity'] },
      generic_opening: { score: 100, aspect: 'problem', keywords_matched: ['sounds like everyone', 'vague'] },
      cliche_essay_formula: { score: 100, aspect: 'problem', keywords_matched: ['common pattern'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'specificity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['childhood_opening_cliche', 'weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_childhood_strong_guidance',
    type: 'expert_guidance',
    title: 'Why Childhood Memories Don\'t Work',
    author: 'College Confidential Expert',
    author_title: 'Admissions Consultant',
    publication: 'Essay Opening Guidance',
    date: '2023-03',
    quote: 'Whatever you do, do not open your essay with a childhood memory. Admissions officers request letters of recommendation from 11th and 12th grade teachers specifically because they want to hear about CURRENT intellectual interests and experiences, not who you were at age 10. You can research and provide specific details about recent experiences; childhood memories rely on potentially unreliable recollection.',
    relevance_to_claim: 'AOs explicitly want current experiences, not childhood memories',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      childhood_opening_cliche: { score: 100, aspect: 'problem', keywords_matched: ['childhood memory', 'do not open'] },
      weak_opening: { score: 95, aspect: 'problem', keywords_matched: ['unreliable recollection'] },
      generic_opening: { score: 90, aspect: 'problem', keywords_matched: ['current interests'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'admissions_context'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['childhood_opening_cliche', 'weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_famous_quote',
    type: 'expert_guidance',
    title: 'Why Famous Quotations Fail',
    author: 'MEK Review',
    author_title: 'College Prep Expert',
    publication: 'Cliché Topics to Avoid',
    date: '2023-05',
    quote: 'Opening with "Barack Obama once said..." or "Mahatma Gandhi said..." fundamentally undermines the purpose of the personal essay. It\'s not your voice—admissions officers want to hear from you, not Albert Einstein. It\'s overused, clichéd, displaces your personal voice, and is rarely as good as student-generated openings.',
    relevance_to_claim: 'Famous quotations displace the student\'s authentic voice',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      famous_quote_opening: { score: 100, aspect: 'problem', keywords_matched: ['famous quotation', 'not your voice'] },
      weak_opening: { score: 95, aspect: 'problem', keywords_matched: ['undermines purpose', 'overused'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['clichéd', 'displaces voice'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['Barack Obama', 'Gandhi'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['famous_quote_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_famous_quote_data',
    type: 'research_study',
    title: 'Quote Opening Statistics',
    author: 'Fiske Guide Analysis',
    author_title: 'Essay Research',
    publication: 'Real College Essays That Work',
    date: '2022-01',
    finding: 'In analysis of 109 sample essays that worked, only 5 (4.6%) started with a quote from a famous person. However, approximately one-third started with dialogue—quotes from people in their lives or their own words. This crucial distinction shows: dialogue from your experience works; famous quotations don\'t.',
    relevance_to_claim: 'Data shows famous quotes rarely appear in successful essays',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      famous_quote_opening: { score: 100, aspect: 'data', keywords_matched: ['5 out of 109', '4.6%'] },
      weak_opening: { score: 90, aspect: 'data', keywords_matched: ['dialogue works', 'quotations don\'t'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['research_data', 'cliche_avoidance'],
      teaching_moment_types: ['data_support', 'why_this_matters'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['proving_point', 'justifying_advice'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['famous_quote_opening', 'weak_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'opening_fail_rhetorical_question',
    type: 'expert_guidance',
    title: 'When Rhetorical Questions Fail',
    author: 'Writing Mindset',
    author_title: 'Writing Instructor',
    publication: 'Narrative Hooks Guide',
    date: '2022-08',
    quote: 'Questions fail when they: create bias in expository writing (allows room for doubt), are too open to interpretation (confuses rather than engages), sound generic ("Have you ever wondered why..."), or can be answered with "no." Generic example that fails: "Have you ever been completely lost before?"',
    relevance_to_claim: 'Generic rhetorical questions create disengagement, not curiosity',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      rhetorical_question_flat: { score: 100, aspect: 'problem', keywords_matched: ['questions fail', 'generic', 'answered with no'] },
      weak_opening: { score: 90, aspect: 'problem', keywords_matched: ['disengagement', 'confuses'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['have you ever', 'generic'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['rhetorical_question_flat', 'weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_generic_context',
    type: 'expert_guidance',
    title: 'Generic Context-Setting Failure',
    author: 'CollegeVine',
    author_title: 'Admissions Platform',
    publication: 'Essays That Need Improvement',
    date: '2023-04',
    quote: 'Opening with elaborate scene-setting that has no connection to the essay\'s subject fails: "It was a raw day of what seemed as autumn but suggested winter..." then discussing marketing. This demonstrates "thesaurus abuse," distracts from the story, wastes precious opening space, and creates wrong expectations.',
    relevance_to_claim: 'Disconnected scene-setting wastes critical opening space',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'problem', keywords_matched: ['no connection', 'wastes space'] },
      generic_opening: { score: 90, aspect: 'problem', keywords_matched: ['elaborate scene-setting', 'thesaurus abuse'] },
      cliche_essay_formula: { score: 85, aspect: 'problem', keywords_matched: ['wrong expectations'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'relevance'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_fail_melodrama',
    type: 'expert_guidance',
    title: 'The Melodrama Problem',
    author: 'CollegeVine',
    author_title: 'Admissions Platform',
    publication: 'Avoiding Clichés',
    date: '2023-06',
    quote: '"Little did I know, my life was about to change forever" is: generic (could open any essay), melodramatic ("forever" is almost certainly exaggeration), tells future rather than showing present (creates distance), lacks specificity, and promises more than it can deliver.',
    relevance_to_claim: 'Melodramatic openings create distance and make unsustainable promises',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      melodramatic_opening: { score: 100, aspect: 'problem', keywords_matched: ['little did I know', 'melodramatic', 'change forever', 'exaggeration'] },
      weak_opening: { score: 95, aspect: 'problem', keywords_matched: ['little did I know', 'melodramatic'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['could open any essay', 'lacks specificity'] },
      cliche_essay_formula: { score: 90, aspect: 'problem', keywords_matched: ['change forever', 'exaggeration'] },
      telling_not_showing: { score: 85, aspect: 'problem', keywords_matched: ['tells future', 'creates distance'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['melodramatic_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  // ============================================================================
  // SECTION 4: HOOK VS. GIMMICK
  // ============================================================================
  {
    source_id: 'opening_hook_vs_gimmick_distinction',
    type: 'expert_guidance',
    title: 'Hook vs. Gimmick: The Critical Distinction',
    author: 'Write Ivy',
    author_title: 'Graduate Admissions Expert',
    publication: 'SOP Introductions Guide',
    date: '2022-10',
    quote: 'A hook creates genuine interest through authenticity, specificity, and connection to your story. A gimmick draws attention to itself as a technique while failing to advance understanding of who you are. Key differences: hooks naturally emerge from your story; gimmicks are artificially imposed. Hooks feel genuine; gimmicks feel like trying too hard.',
    relevance_to_claim: 'Authentic hooks serve the story; gimmicks serve attention-seeking',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      dictionary_definition_opening: { score: 90, aspect: 'principle', keywords_matched: ['gimmick', 'artificially imposed'] },
      weak_opening: { score: 90, aspect: 'principle', keywords_matched: ['hook', 'gimmick', 'distinction'] },
      generic_opening: { score: 85, aspect: 'principle', keywords_matched: ['authenticity', 'genuine'] },
      cliche_essay_formula: { score: 95, aspect: 'principle', keywords_matched: ['artificially imposed', 'trying too hard'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'cliche_avoidance'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['dictionary_definition_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_grace_kim_authenticity_test',
    type: 'admissions_officer_quote',
    title: 'The Grace Kim Authenticity Test',
    author: 'Grace Kim',
    author_title: 'Former Stanford Admissions Officer',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'We want it to be so personal to the student that you couldn\'t put anyone else\'s name on that essay and have it still be true about that other student.',
    relevance_to_claim: 'The ultimate test: could this opening apply to someone else?',
    weight_in_calculation: 100,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      dictionary_definition_opening: { score: 95, aspect: 'principle', keywords_matched: ['impersonal', 'could be anyone'] },
      weak_opening: { score: 100, aspect: 'principle', keywords_matched: ['personal', 'couldn\'t put anyone else'] },
      generic_opening: { score: 100, aspect: 'principle', keywords_matched: ['specific to student', 'still be true'] },
      cliche_essay_formula: { score: 95, aspect: 'principle', keywords_matched: ['so personal'] },
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['couldn\'t put anyone else\'s name'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['principle_explanation', 'evaluation_criteria'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'evaluation_standard'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['dictionary_definition_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_gimmick_loses_charm',
    type: 'expert_guidance',
    title: 'Gimmicks Lose Charm on Re-reading',
    author: 'College Confidential',
    author_title: 'Admissions Forum',
    publication: 'Gimmick Essays Discussion',
    date: '2019-03',
    quote: 'College admissions officer testimonials reveal that "gimmicky essays lose their charm by the second reading." If the gimmick is the only thing holding your essay together, it will feel hollow and manipulative. Essays structured as poems, instruction manuals, or technical documentation fail unless genuinely earned.',
    relevance_to_claim: 'Gimmicks fail the re-read test that good writing passes',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      melodramatic_opening: { score: 85, aspect: 'problem', keywords_matched: ['gimmicky', 'hollow', 'manipulative'] },
      weak_opening: { score: 85, aspect: 'problem', keywords_matched: ['gimmicky', 'hollow'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['lose charm', 'manipulative'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['cliche_avoidance', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_fails'],
      essay_section_relevance: ['opening', 'throughout'],
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
        issue_types: ['melodramatic_opening', 'weak_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'warning',
  },

  {
    source_id: 'opening_quirky_authentic_works',
    type: 'expert_guidance',
    title: 'Quirky Works If Authentic',
    author: 'College Confidential',
    author_title: 'Admissions Forum',
    publication: 'Gimmick Essays Discussion',
    date: '2019-03',
    quote: 'Admissions officers acknowledge that "quirky works if it\'s authentic." One legendary essay opened with just two words: "Brevity. It\'s concise." This worked because it was authentically reflective of the student\'s communication style, demonstrated intelligence and wit without being showy, and the entire essay was indeed brief and concise.',
    relevance_to_claim: 'Unusual approaches work when they genuinely reflect who you are',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 80, aspect: 'solution', keywords_matched: ['quirky', 'authentic', 'works'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['genuine', 'reflective'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'originality'],
      teaching_moment_types: ['when_it_works', 'principle_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_nuance', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'community',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_coffee_shop_test',
    type: 'expert_guidance',
    title: 'The Coffee Shop Friend Standard',
    author: 'College Confidential',
    author_title: 'Essay Authenticity Guide',
    publication: 'Authentic Voice Article',
    date: '2023-02',
    quote: 'Test against the "coffee shop friend" standard: Would you actually say this opening to a friend over coffee? If not, it\'s probably too formal or contrived. Write how you speak (with appropriate register). Use contractions, idioms, and first-person statements. Feel free to be creative without being artificial.',
    relevance_to_claim: 'Authentic voice sounds like natural speech, not formal performance',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      thesis_statement_opening: { score: 90, aspect: 'solution', keywords_matched: ['too formal', 'contrived', 'speak naturally'] },
      weak_opening: { score: 85, aspect: 'solution', keywords_matched: ['coffee shop', 'friend', 'natural'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['contrived', 'authentic voice'] },
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['speak', 'contractions', 'natural'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'voice'],
      teaching_moment_types: ['how_to_fix', 'evaluation_criteria'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'evaluation_standard'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['thesis_statement_opening', 'weak_opening', 'generic_opening', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 5: ADMISSIONS OFFICER DIRECT INSIGHTS
  // ============================================================================
  {
    source_id: 'opening_ao_yale_favorite_part',
    type: 'admissions_officer_quote',
    title: 'Yale AO: Personal Statement is Favorite Part',
    author: 'Marcia Landesman',
    author_title: 'Associate Director of Undergraduate Admissions, Yale University',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'Most admissions officers will tell you that the personal statement is their absolute favorite part of the application. It\'s really a chance for us to get to know who you are, and it\'s really your major opportunity to speak up for yourself...your chance to say, "Hello, this is me, and here\'s what matters to me."',
    relevance_to_claim: 'AOs want to be engaged by your essay—they\'re not adversarial readers',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'yale',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 85, aspect: 'context', keywords_matched: ['favorite part', 'chance'] },
      generic_opening: { score: 90, aspect: 'context', keywords_matched: ['get to know who you are', 'what matters'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['admissions_context', 'authenticity'],
      teaching_moment_types: ['why_this_matters', 'encouragement'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'providing_context'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'encouragement',
  },

  {
    source_id: 'opening_ao_uc_voice_thesaurus',
    type: 'admissions_officer_quote',
    title: 'UC AO: Natural Voice, Avoid Thesaurus',
    author: 'Azure Brown',
    author_title: 'Former UC Senior Admissions Evaluator',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'More than anything, I want to encourage students to write from the heart. Use the words that come naturally to you—avoid the thesaurus. Some of the worst college essays I\'ve read were actually written quite well in terms of grammar, sentence structure, and organization, but the student\'s unique voice had been lost through editing feedback from a well-intentioned adult.',
    relevance_to_claim: 'Over-editing destroys the authentic voice that makes essays memorable',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: ['uc_berkeley', 'ucla', 'uc_san_diego', 'uc_davis'],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 90, aspect: 'solution', keywords_matched: ['write from heart', 'natural'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['voice lost', 'over-editing'] },
      cliche_ai_convergence: { score: 100, aspect: 'solution', keywords_matched: ['unique voice', 'naturally'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'voice'],
      teaching_moment_types: ['principle_explanation', 'what_to_avoid'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'warning_against_overpolishing'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_michigan_storytellers',
    type: 'admissions_officer_quote',
    title: 'Michigan AO: Storytellers Are Always Good',
    author: 'Kim Bryant',
    author_title: 'Assistant Director of Admissions, University of Michigan',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'I like reading a personal story that is tied to real life. I like it when I can hear a student\'s voice. Storytellers are always good.',
    relevance_to_claim: 'Storytelling trumps impressive vocabulary or philosophical depth',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'michigan',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 90, aspect: 'solution', keywords_matched: ['personal story', 'voice'] },
      generic_opening: { score: 85, aspect: 'solution', keywords_matched: ['real life', 'storytellers'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['story', 'hear voice'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['narrative_structure', 'voice'],
      teaching_moment_types: ['principle_explanation', 'what_works'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'encouraging_storytelling'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_nyu_how_why',
    type: 'admissions_officer_quote',
    title: 'NYU AO: The How and Why Over the What',
    author: 'Shawn Abbott',
    author_title: 'Assistant Vice President and Dean of Admissions, NYU',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'Who are you? It\'s about being reflective about your life, about your experiences. I always tell students it\'s not the "what" you\'re doing, but the "how and why" you are doing them because I can clearly see "what" you\'re doing, but "how and why," I can\'t see that. When I put down your application, I want to feel like I just stepped out of your life.',
    relevance_to_claim: 'Don\'t describe WHAT you did—show HOW you experienced it and WHY it mattered',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'nyu',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 90, aspect: 'solution', keywords_matched: ['how and why', 'reflective'] },
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['not the what', 'stepped out of your life'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['who are you', 'experiences'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'reflection_depth'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_approach'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'telling_not_showing', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_upenn_authentic_imperfect',
    type: 'admissions_officer_quote',
    title: 'UPenn: Looking for Authentic and Imperfect',
    author: 'Amy Gutmann',
    author_title: 'President, University of Pennsylvania',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'Our admissions officers are looking for something that is authentic and imperfect, and somebody who is thinking differently.',
    relevance_to_claim: 'Imperfection signals authenticity—polished perfection reads as manufactured',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'upenn',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 85, aspect: 'principle', keywords_matched: ['authentic', 'imperfect'] },
      generic_opening: { score: 90, aspect: 'principle', keywords_matched: ['thinking differently'] },
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['imperfect', 'authentic'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'originality'],
      teaching_moment_types: ['principle_explanation', 'encouragement'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['encouraging_authenticity', 'reducing_perfectionism'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_nyu_personality',
    type: 'admissions_officer_quote',
    title: 'NYU AO: Learn How a Student Thinks',
    author: 'Christina DeCesare',
    author_title: 'Former NYU Associate Director of Admissions',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'I\'ve always enjoyed essays that enable me to learn about the applicant\'s personality. Whether that\'s an essay about a love (or hatred) of cheese, a desire to learn multiple languages, or to study environmental engineering—I like learning how a student thinks.',
    relevance_to_claim: 'Topic matters less than HOW YOU THINK about it',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'nyu',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 85, aspect: 'context', keywords_matched: ['personality', 'how student thinks'] },
      generic_opening: { score: 90, aspect: 'context', keywords_matched: ['love of cheese', 'topic flexibility'] },
      cliche_topic_framing: { score: 95, aspect: 'solution', keywords_matched: ['topic matters less', 'how you think'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'intellectual_depth'],
      teaching_moment_types: ['encouragement', 'principle_explanation'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['encouraging_authenticity', 'topic_selection'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_topic_framing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'encouragement',
  },

  {
    source_id: 'opening_ao_uva_personality_shine',
    type: 'admissions_officer_quote',
    title: 'UVA AO: Personality Gets to Shine',
    author: 'Jeannine Lalonde',
    author_title: 'Associate Dean of Admissions, University of Virginia',
    publication: 'IVYD Admissions Quotes',
    date: '2023-01',
    quote: 'This is the one spot on your application where your personality gets to shine, so don\'t treat this like a formal school assignment.',
    relevance_to_claim: 'The essay is for personality, not academic formality',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'uva',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      thesis_statement_opening: { score: 95, aspect: 'principle', keywords_matched: ['formal school assignment', 'not formal'] },
      weak_opening: { score: 90, aspect: 'principle', keywords_matched: ['personality shine', 'not formal'] },
      generic_opening: { score: 85, aspect: 'principle', keywords_matched: ['one spot', 'personality'] },
      cliche_essay_formula: { score: 90, aspect: 'problem', keywords_matched: ['formal school assignment'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'voice'],
      teaching_moment_types: ['principle_explanation', 'encouragement'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['encouraging_personality', 'warning_against_formality'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['thesis_statement_opening', 'weak_opening', 'generic_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_pomona_genuine_credibility',
    type: 'admissions_officer_quote',
    title: 'Pomona AO: Credibility and Genuineness',
    author: 'Bruce Poch',
    author_title: 'Former VP and Dean of Admission, Pomona College',
    publication: 'Campbell Hall Admissions Wisdom',
    date: '2022-01',
    quote: 'I worry that we as admissions officers may have unintentionally transmitted incorrect messages about what we hope to see. Students become supplicants, not applicants, doing the right things for the wrong reasons... How do we sort out the genuine student from the image essentially manufactured for admissions purposes? We look for credibility and, ultimately, genuineness.',
    relevance_to_claim: 'AOs are specifically trained to detect manufactured vs. genuine voice',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'pomona',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 85, aspect: 'principle', keywords_matched: ['credibility', 'genuineness'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['manufactured', 'supplicants'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['right things wrong reasons'] },
      cliche_ai_convergence: { score: 100, aspect: 'principle', keywords_matched: ['genuine vs manufactured'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['authenticity', 'admissions_context'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['opening', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_evaluation'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'cliche_essay_formula', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'principle',
  },

  {
    source_id: 'opening_ao_duke_intelligent_mistakes',
    type: 'admissions_officer_quote',
    title: 'Duke: Students Who Make Intelligent Mistakes',
    author: 'Duke University Admissions',
    author_title: 'Admissions Office Statement',
    publication: 'Campbell Hall Admissions Wisdom',
    date: '2022-01',
    quote: 'We like students who make intelligent and interesting mistakes, students who understand that only in risking failure do we become stronger, better, and smarter.',
    relevance_to_claim: 'Openings about failure or mistakes can be powerful if reflective',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'duke',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 80, aspect: 'solution', keywords_matched: ['mistakes', 'failure'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['risking failure', 'stronger'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['vulnerability', 'growth'],
      teaching_moment_types: ['encouragement', 'topic_suggestion'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['encouraging_vulnerability', 'topic_selection'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: ['challenge_adversity', 'failure_lesson'],
        colleges: 'all',
        issue_types: ['weak_opening', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'admissions_officer',
    advice_type: 'encouragement',
  },

  // ============================================================================
  // SECTION 6: ESSAY TYPE-SPECIFIC OPENING TECHNIQUES
  // ============================================================================
  {
    source_id: 'opening_type_personal_statement_structure',
    type: 'expert_guidance',
    title: 'Personal Statement Opening Structure',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: 'With 650 words maximum, the opening paragraph typically comprises 75-100 words (approximately 11-15% of total length). You have 3-5 sentences to establish voice, create interest, and set direction. Personal statements most effectively use narrative structure with the opening establishing a specific moment or question.',
    relevance_to_claim: 'Personal statements require efficient, voice-forward openings',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'technique', keywords_matched: ['75-100 words', 'establish voice'] },
      generic_opening: { score: 90, aspect: 'technique', keywords_matched: ['specific moment', 'create interest'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['narrative_structure', 'word_economy'],
      teaching_moment_types: ['technique_explanation', 'structure_guidance'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_structure', 'explaining_approach'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['personal_statement'],
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 400,
      requires_narrative: true,
    },
    authority: 'expert',
    advice_type: 'structure',
  },

  {
    source_id: 'opening_type_why_college_fast',
    type: 'expert_guidance',
    title: 'Why This College: Get to Specifics Fast',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'Why This College Essay Guide',
    date: '2023-08',
    quote: 'For "Why This College" essays, jump immediately into specific reasons this school fits your goals. Skip lengthy anecdotes or buildup. Sentence 1: Specific program, professor, or opportunity that drew you. Sentences 2-3: Why this specifically aligns with your experience/goals.',
    relevance_to_claim: '"Why This College" essays require immediate specificity, not narrative buildup',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 90, aspect: 'technique', keywords_matched: ['specific', 'immediately'] },
      generic_opening: { score: 95, aspect: 'problem', keywords_matched: ['skip lengthy anecdotes'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['specificity', 'college_fit'],
      teaching_moment_types: ['technique_explanation', 'structure_guidance'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_structure', 'explaining_approach'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['why_this_college'],
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'structure',
  },

  {
    source_id: 'opening_type_activity_150_words',
    type: 'expert_guidance',
    title: 'Activity Essay: Zero Room for Waste',
    author: 'Elite Prep',
    author_title: 'College Prep Expert',
    publication: '150-Word Extracurricular Essay Guide',
    date: '2023-05',
    quote: 'With only 150 words, you have approximately 3-4 sentences for an opening. There is zero room for waste. The activity essay is more "tell" than "show," prioritizing content and information over stylistic flourishes. Effective techniques: (1) Three words separated by periods for emphasis, (2) Start with problem to be solved, (3) Technical jargon that demonstrates expertise, (4) Deconstruct a misconception.',
    relevance_to_claim: 'Short essays require immediate substance over style',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'technique', keywords_matched: ['zero room waste', '150 words'] },
      generic_opening: { score: 90, aspect: 'technique', keywords_matched: ['content over style'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['word_economy', 'short_answer'],
      teaching_moment_types: ['technique_explanation', 'structure_guidance'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['teaching_structure', 'explaining_approach'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['activity_elaboration', 'short_answer'],
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      max_word_count: 200,
    },
    authority: 'expert',
    advice_type: 'structure',
  },

  {
    source_id: 'opening_type_challenge_in_medias_res',
    type: 'expert_guidance',
    title: 'Challenge Essays: Start in the Difficult Moment',
    author: 'CollegeVine',
    author_title: 'Admissions Platform',
    publication: 'Overcoming Challenges Essay Examples',
    date: '2023-07',
    quote: '"Tears streamed down my face and my mind was paralyzed with fear. Sirens blared, but the silent panic in my own head was deafening." Challenge essays work exceptionally well when opened in medias res—in the middle of the difficult moment. This creates immediate emotional stakes, shares internal state for empathy, and creates narrative momentum.',
    relevance_to_claim: 'Challenge essays benefit from opening at the crisis point',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['tears', 'fear', 'in medias res'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['emotional stakes', 'internal state'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['paralyzed', 'deafening', 'showing'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['vulnerability', 'sensory_details'],
      teaching_moment_types: ['elite_example', 'technique_explanation'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_technique'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'prompt_specific',
      applies_to: {
        prompt_types: ['challenge_adversity', 'failure_lesson'],
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      requires_narrative: true,
      min_word_count: 300,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 7: FIRST SENTENCE ANALYSIS
  // ============================================================================
  {
    source_id: 'opening_first_sentence_sensory_example',
    type: 'expert_guidance',
    title: 'Excellent First Sentence: Sensory Opening',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: '"I held my breath as my steady hands gently nestled the crumbly roots of the lettuce plant into the soil trench that I shoveled moments before." This works because: sensory immersion ("crumbly roots," "soil trench"), action verbs ("nestled," "shoveled"), suggests values without stating them, creates questions, and temporal specificity ("moments before").',
    relevance_to_claim: 'Excellent first sentences layer multiple techniques simultaneously',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'solution', keywords_matched: ['sensory immersion', 'action verbs'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['specific', 'creates questions'] },
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['suggests values without stating'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['showing_vs_telling', 'sensory_details'],
      teaching_moment_types: ['elite_example', 'analysis'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_analysis'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'opening_first_sentence_refusal_example',
    type: 'expert_guidance',
    title: 'Excellent First Sentence: The Refusal',
    author: 'College Essay Guy',
    author_title: 'Essay Coaching Expert',
    publication: 'How to Start Your College Essay',
    date: '2023-09',
    quote: '"I refused to throw dirt on her." This works because: immediate emotional weight ("refused" signals resistance/grief), mystery (Who is "her"? Why dirt?), followed by clarification that deepens rather than resolves ("I refuse to let go of my grandmother"), vulnerability (reveals emotional state directly), active resistance (not passive sadness but agency).',
    relevance_to_claim: 'Brief, mysterious openings can be powerfully engaging',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 100, aspect: 'solution', keywords_matched: ['emotional weight', 'mystery'] },
      generic_opening: { score: 95, aspect: 'solution', keywords_matched: ['vulnerability', 'active'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['vulnerability', 'mystery'],
      teaching_moment_types: ['elite_example', 'analysis'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_analysis'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'opening_first_sentence_stranger_example',
    type: 'expert_guidance',
    title: 'Excellent First Sentence: The Stranger',
    author: 'PrepMaven',
    author_title: 'College Prep Expert',
    publication: 'College Essay Intro Examples',
    date: '2023-06',
    quote: '"To him, I was a stranger. He could not recall that I had fervently cared for him every day for the past five weeks." This works because: poignant juxtaposition (stranger vs. fervently cared), suggests larger context without explaining (memory loss), quantification (every day, five weeks), word choice ("fervently" conveys intensity beyond duty).',
    relevance_to_claim: 'Juxtaposition creates immediate emotional resonance',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 95, aspect: 'solution', keywords_matched: ['juxtaposition', 'emotional'] },
      generic_opening: { score: 90, aspect: 'solution', keywords_matched: ['specific', 'five weeks'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['fervently', 'showing'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['contrast', 'specificity'],
      teaching_moment_types: ['elite_example', 'analysis'],
      essay_section_relevance: ['opening'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_analysis'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'generic_opening', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },

  {
    source_id: 'opening_reader_writer_contract',
    type: 'literary_principle',
    title: 'The Reader-Writer Contract',
    author: 'Katherine Cowley',
    author_title: 'Writing Instructor',
    publication: 'Reader-Writer Contract Guide',
    date: '2020-01',
    quote: 'The opening establishes a reader-writer contract. The reader promises to suspend disbelief and invest attention. The writer promises to deliver engaging content and fulfill commitments implied by the opening. "To create a satisfying resolution, the resolution must fulfill the promises set up at the beginning."',
    relevance_to_claim: 'Openings make implicit promises the essay must keep',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      weak_opening: { score: 80, aspect: 'principle', keywords_matched: ['contract', 'promises'] },
      cliche_essay_formula: { score: 85, aspect: 'principle', keywords_matched: ['fulfill commitments'] },
    },

    taxonomy: {
      primary_category: 'opening_hooks',
      secondary_categories: ['narrative_structure', 'reader_engagement'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['opening', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_structure'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['weak_opening', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'principle',
    advice_type: 'principle',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all essay openings sources
 */
export function getEssayOpeningsSources(): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES;
}

/**
 * Get sources for specific opening issues
 */
export function getOpeningSourcesForIssue(
  issueType: string
): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(source => {
    const relevance = source.issue_relevance[issueType as keyof typeof source.issue_relevance];
    return relevance && relevance.score >= 70;
  }).sort((a, b) => {
    const scoreA = a.issue_relevance[issueType as keyof typeof a.issue_relevance]?.score || 0;
    const scoreB = b.issue_relevance[issueType as keyof typeof b.issue_relevance]?.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Get admissions officer quotes about openings
 */
export function getAdmissionsOfficerOpeningInsights(): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(
    source => source.authority === 'admissions_officer'
  );
}

/**
 * Get opening technique examples (what works)
 * Includes technique examples, data supporting techniques, and principle explanations
 */
export function getOpeningTechniqueExamples(): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(
    source =>
      source.advice_type === 'technique' ||
      source.advice_type === 'example' ||
      source.advice_type === 'data' ||
      source.advice_type === 'principle'
  );
}

/**
 * Get opening warnings (what to avoid)
 */
export function getOpeningWarnings(): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(
    source => source.advice_type === 'warning'
  );
}

/**
 * Get opening science/research data
 */
export function getOpeningScienceData(): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(
    source => source.authority === 'research'
  );
}

/**
 * Get prompt-type-specific opening guidance
 */
export function getOpeningGuidanceForPromptType(
  promptType: string
): EnhancedLabeledSource[] {
  return ESSAY_OPENINGS_SOURCES.filter(source => {
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
 * Get statistics about openings sources
 */
export function getOpeningsSourceStats(): {
  total: number;
  byAuthority: Record<string, number>;
  byAdviceType: Record<string, number>;
  byPrimaryCategory: Record<string, number>;
} {
  const byAuthority: Record<string, number> = {};
  const byAdviceType: Record<string, number> = {};
  const byPrimaryCategory: Record<string, number> = {};

  for (const source of ESSAY_OPENINGS_SOURCES) {
    byAuthority[source.authority] = (byAuthority[source.authority] || 0) + 1;
    byAdviceType[source.advice_type] = (byAdviceType[source.advice_type] || 0) + 1;
    const cat = source.taxonomy.primary_category;
    byPrimaryCategory[cat] = (byPrimaryCategory[cat] || 0) + 1;
  }

  return {
    total: ESSAY_OPENINGS_SOURCES.length,
    byAuthority,
    byAdviceType,
    byPrimaryCategory,
  };
}
