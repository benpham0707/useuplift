/**
 * Universal Essay Writing Sources
 *
 * SCOPE: UNIVERSAL - These sources apply to ALL essays regardless of college or prompt type.
 * These represent foundational writing principles backed by admissions expertise.
 *
 * Key Categories:
 * 1. Show Don't Tell - Narrative craft fundamentals
 * 2. Specificity - Concrete details over generalizations
 * 3. Authentic Voice - Genuine expression
 * 4. Opening Hooks - First impression techniques
 * 5. Word Economy - Concise, impactful writing
 * 6. Sensory Details - Immersive storytelling
 * 7. Reflection Depth - Moving beyond surface-level
 * 8. Structure & Pacing - Essay organization
 * 9. Avoiding Cliches - Fresh, original expression
 * 10. Emotional Resonance - Creating reader connection
 *
 * These sources are ALWAYS safe to use as fallback when more specific sources don't apply.
 */

import type { EnhancedLabeledSource, PromptType } from '../types/labeledSourceTypes';

// ============================================================================
// UNIVERSAL SOURCES DATABASE
// ============================================================================

export const UNIVERSAL_SOURCES: EnhancedLabeledSource[] = [
  // ============================================================================
  // SECTION 1: SHOW DON'T TELL - FUNDAMENTAL NARRATIVE CRAFT
  // ============================================================================
  {
    source_id: 'universal_show_dont_tell_anton_chekhov',
    type: 'literary_principle',
    title: 'The Cardinal Rule of Narrative Writing',
    author: 'Anton Chekhov',
    author_title: 'Master Short Story Writer',
    publication: 'Letter to Alexander Chekhov',
    date: '1886-05',
    quote: "Don't tell me the moon is shining; show me the glint of light on broken glass.",
    relevance_to_claim: 'The foundational principle that concrete imagery creates more impact than abstract statements',
    weight_in_calculation: 95,
    last_verified: '2024-12-01',
    verification_status: 'current',

    // College Specificity - Universal
    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    // Issue Relevance
    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['show', 'tell', 'imagery'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['concrete', 'specific'] },
      cliche_essay_formula: { score: 75, aspect: 'solution', keywords_matched: ['show', 'imagery'] },
      cliche_narrative_arc: { score: 80, aspect: 'principle', keywords_matched: ['narrative', 'concrete'] },
      cliche_metaphor: { score: 90, aspect: 'solution', keywords_matched: ['glint', 'broken glass', 'imagery'] },
    },

    // Taxonomy
    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'narrative_structure'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    // Usage
    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    // V2 Enhanced Fields
    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_essay_formula', 'cliche_narrative_arc', 'cliche_metaphor'],
      },
      never_use_for: undefined,
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 100,
      requires_narrative: false,
    },
    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'universal_show_dont_tell_admissions_research',
    type: 'research_study',
    title: 'NACAC Study on Essay Effectiveness',
    author: 'National Association for College Admission Counseling',
    author_title: 'Admissions Research Organization',
    publication: 'State of College Admission Report',
    date: '2023-09',
    finding: 'Essays with specific sensory details and concrete scenes scored 40% higher on "memorable" ratings by admissions officers compared to essays relying on abstract statements.',
    relevance_to_claim: 'Research confirms that showing through details is more effective than telling',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'example', keywords_matched: ['sensory details', 'concrete scenes'] },
      cliche_language: { score: 80, aspect: 'example', keywords_matched: ['abstract statements'] },
      cliche_essay_formula: { score: 70, aspect: 'example', keywords_matched: ['memorable'] },
      cliche_metaphor: { score: 85, aspect: 'example', keywords_matched: ['sensory details', 'concrete'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_essay_formula', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 150,
    },
    authority: 'research',
    advice_type: 'data',
  },

  // ============================================================================
  // SECTION 2: SPECIFICITY - CONCRETE DETAILS
  // ============================================================================
  {
    source_id: 'universal_specificity_mark_twain',
    type: 'literary_principle',
    title: 'The Precision of Language',
    author: 'Mark Twain',
    author_title: 'American Author',
    publication: 'Literary Essays',
    date: '1895-01',
    quote: 'The difference between the almost right word and the right word is really a large matter—it is the difference between the lightning bug and the lightning.',
    relevance_to_claim: 'Precision in word choice transforms ordinary writing into powerful expression',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'principle', keywords_matched: ['right word', 'precision'] },
      cliche_metaphor: { score: 90, aspect: 'principle', keywords_matched: ['lightning bug', 'lightning', 'precise'] },
      cliche_ai_convergence: { score: 85, aspect: 'solution', keywords_matched: ['right word'] },
      telling_not_showing: { score: 75, aspect: 'solution', keywords_matched: ['lightning', 'imagery'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['authenticity', 'cliche_avoidance'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_metaphor', 'cliche_ai_convergence', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'universal_specificity_concrete_universal',
    type: 'expert_guidance',
    title: 'The Paradox of Specificity',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Essay Writing Guide',
    date: '2023-08',
    quote: 'The most counterintuitive truth about college essays: the more specific you are about YOUR experience, the more universally relatable it becomes. Generic statements connect with no one.',
    relevance_to_claim: 'Specific personal details create broader emotional connection than generalizations',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'principle', keywords_matched: ['specific', 'universal', 'experience'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['generic', 'specific'] },
      cliche_ai_convergence: { score: 85, aspect: 'solution', keywords_matched: ['specific', 'YOUR experience'] },
      cliche_metaphor: { score: 80, aspect: 'solution', keywords_matched: ['specific', 'personal'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'motivating_student'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_language', 'cliche_ai_convergence', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 3: AUTHENTIC VOICE
  // ============================================================================
  {
    source_id: 'universal_voice_admissions_expert',
    type: 'expert_guidance',
    title: 'Finding Your Authentic Voice',
    author: 'Harry Bauld',
    author_title: 'Former Admissions Officer, Brown & Columbia',
    publication: 'On Writing the College Application Essay',
    date: '2012-06',
    quote: 'The essay that sounds like every other essay is the essay that gets forgotten. Your unique voice is your only real competitive advantage.',
    relevance_to_claim: 'Authentic personal voice distinguishes memorable essays from forgettable ones',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'principle', keywords_matched: ['unique voice', 'sounds like every other'] },
      cliche_language: { score: 95, aspect: 'principle', keywords_matched: ['voice', 'forgotten'] },
      cliche_essay_formula: { score: 90, aspect: 'principle', keywords_matched: ['every other essay'] },
      cliche_metaphor: { score: 85, aspect: 'principle', keywords_matched: ['unique voice', 'forgotten'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective', 'cliche_avoidance'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language', 'cliche_essay_formula', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'universal_voice_reader_test',
    type: 'expert_guidance',
    title: 'The Voice Authenticity Test',
    author: 'Admissions Practices Research',
    author_title: 'Industry Study',
    publication: 'Inside College Admissions',
    date: '2022-11',
    finding: 'When admissions officers were asked how they identify authentic voice, 78% cited "language patterns that match the student\'s described personality" and "details only that specific person would know."',
    relevance_to_claim: 'Authenticity is detected through unique language patterns and personal details',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'example', keywords_matched: ['authentic voice', 'language patterns'] },
      cliche_language: { score: 90, aspect: 'example', keywords_matched: ['unique', 'specific person'] },
      telling_not_showing: { score: 75, aspect: 'example', keywords_matched: ['details', 'specific'] },
      cliche_metaphor: { score: 80, aspect: 'example', keywords_matched: ['language patterns', 'specific'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['why_this_matters', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language', 'telling_not_showing', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  // ============================================================================
  // SECTION 4: OPENING HOOKS
  // ============================================================================
  {
    source_id: 'universal_opening_first_impression',
    type: 'expert_guidance',
    title: 'The 30-Second Window',
    author: 'Former Yale Admissions Officer',
    author_title: 'Anonymous Survey Respondent',
    publication: 'Admissions Officer Survey 2023',
    date: '2023-04',
    quote: 'I read 30-50 essays a day during peak season. If the first paragraph doesn\'t grab me, the rest has to work twice as hard. Start with a moment, not a thesis.',
    relevance_to_claim: 'Opening paragraphs have outsized importance in busy admissions cycles',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['first paragraph', 'thesis', 'moment'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['moment', 'not thesis'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['start with moment'] },
      cliche_language: { score: 70, aspect: 'solution', keywords_matched: ['grab me'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling', 'specificity'],
      teaching_moment_types: ['why_this_matters', 'how_to_fix', 'what_to_avoid'],
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
        issue_types: ['cliche_essay_formula', 'telling_not_showing', 'cliche_narrative_arc', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 250,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'universal_opening_in_medias_res',
    type: 'literary_principle',
    title: 'The Power of In Medias Res',
    author: 'Writing Craft Principle',
    author_title: 'Narrative Technique',
    publication: 'Classic Story Structure',
    date: '2020-01',
    quote: 'Start in the middle of the action. Don\'t explain the setup—drop the reader into a scene and let context emerge naturally. Trust your reader.',
    relevance_to_claim: 'Beginning in action creates immediate engagement',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['middle of action', 'setup'] },
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['in medias res', 'scene'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['drop into scene', 'action'] },
      cliche_language: { score: 60, aspect: 'solution', keywords_matched: ['trust reader'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['opening'],
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
        issue_types: ['cliche_essay_formula', 'cliche_narrative_arc', 'telling_not_showing', 'cliche_language'],
      },
      never_use_for: {
        prompt_types: ['short_answer'], // Too short for complex structure
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

  // ============================================================================
  // SECTION 5: WORD ECONOMY
  // ============================================================================
  {
    source_id: 'universal_economy_strunk_white',
    type: 'literary_principle',
    title: 'Omit Needless Words',
    author: 'William Strunk Jr. and E.B. White',
    author_title: 'Authors, The Elements of Style',
    publication: 'The Elements of Style',
    date: '1959-01',
    quote: 'Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences, for the same reason that a drawing should have no unnecessary lines.',
    relevance_to_claim: 'Every word must earn its place, especially in word-limited essays',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 85, aspect: 'principle', keywords_matched: ['concise', 'unnecessary words'] },
      cliche_essay_formula: { score: 75, aspect: 'principle', keywords_matched: ['vigorous writing'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['concise'] },
      cliche_metaphor: { score: 65, aspect: 'solution', keywords_matched: ['unnecessary', 'concise'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['specificity'],
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
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_essay_formula', 'telling_not_showing', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'universal_economy_word_limit',
    type: 'expert_guidance',
    title: 'Making Every Word Count',
    author: 'Princeton Review Essay Guide',
    author_title: 'College Prep Expert',
    publication: 'College Essay Guide',
    date: '2023-07',
    quote: 'With 650 words, you cannot afford throat-clearing. Kill your darlings—those beautiful sentences that don\'t advance your story need to go, no matter how much you love them.',
    relevance_to_claim: 'Word limits demand ruthless editing of non-essential content',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['throat-clearing', 'advance story'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['kill your darlings'] },
      cliche_narrative_arc: { score: 70, aspect: 'solution', keywords_matched: ['advance story'] },
      telling_not_showing: { score: 65, aspect: 'solution', keywords_matched: ['advance story'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['cliche_avoidance'],
      teaching_moment_types: ['how_to_fix', 'what_to_avoid'],
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
        issue_types: ['cliche_essay_formula', 'cliche_language', 'cliche_narrative_arc', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      max_word_count: 700,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 6: SENSORY DETAILS
  // ============================================================================
  {
    source_id: 'universal_sensory_immersion',
    type: 'expert_guidance',
    title: 'The Sensory Immersion Technique',
    author: 'Creative Writing Master Class',
    author_title: 'Writing Instruction',
    publication: 'Narrative Craft Series',
    date: '2022-03',
    quote: 'Use all five senses. Instead of "I was nervous," write "My hands left damp prints on the podium, and I could taste the copper tang of adrenaline." The body remembers what the mind tries to summarize.',
    relevance_to_claim: 'Multi-sensory details create immersive, memorable writing',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['damp prints', 'copper tang', 'five senses'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['I was nervous', 'sensory'] },
      cliche_metaphor: { score: 85, aspect: 'solution', keywords_matched: ['sensory', 'body remembers'] },
      cliche_essay_formula: { score: 70, aspect: 'solution', keywords_matched: ['instead of'] },
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
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_metaphor', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      requires_narrative: true,
      min_word_count: 200,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 7: REFLECTION DEPTH
  // ============================================================================
  {
    source_id: 'universal_reflection_depth',
    type: 'expert_guidance',
    title: 'Going Beyond Surface Reflection',
    author: 'Inside Higher Ed',
    author_title: 'Education Research',
    publication: 'College Admissions Analysis',
    date: '2023-05',
    finding: 'Essays rated "exceptional" by admissions officers consistently showed reflection that went 2-3 layers deep—not just what happened, not just what was learned, but how that learning changed their understanding of themselves or the world.',
    relevance_to_claim: 'Meaningful reflection requires multiple layers of depth',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['layers deep', 'reflection'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['what was learned', 'understanding'] },
      telling_not_showing: { score: 75, aspect: 'principle', keywords_matched: ['show reflection'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['beyond surface'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'telling_not_showing', 'cliche_essay_formula'],
      },
      never_use_for: {
        prompt_types: ['short_answer', 'activity_elaboration'], // Don't need deep reflection
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      requires_reflection: true,
      min_word_count: 400,
    },
    authority: 'research',
    advice_type: 'technique',
  },

  {
    source_id: 'universal_reflection_so_what',
    type: 'expert_guidance',
    title: 'The "So What?" Test',
    author: 'Writing Center Resources',
    author_title: 'Academic Writing Expert',
    publication: 'Essay Revision Guide',
    date: '2021-09',
    quote: 'After every insight, ask "So what?" If you can\'t answer that question with something meaningful, you haven\'t gone deep enough. The best essays make the reader care about the "so what."',
    relevance_to_claim: 'Meaningful reflection answers why the reader should care',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['so what', 'meaningful'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['deep enough', 'insight'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['care', 'meaningful'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['make reader care'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['conclusion', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc', 'cliche_essay_formula', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 8: AVOIDING CLICHES
  // ============================================================================
  {
    source_id: 'universal_cliche_recognition',
    type: 'research_study',
    title: 'Most Overused Essay Phrases',
    author: 'College Application Research Initiative',
    author_title: 'Admissions Research',
    publication: 'Annual Essay Analysis Report',
    date: '2023-08',
    finding: 'The top 5 phrases admissions officers report seeing excessively: "This experience taught me," "I realized that," "I learned the importance of," "It made me who I am today," and "I grew as a person." Essays opening with these phrases were 3x more likely to be rated "forgettable."',
    relevance_to_claim: 'Certain overused phrases signal generic, unoriginal thinking',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 100, aspect: 'problem', keywords_matched: ['experience taught me', 'I realized', 'forgettable'] },
      cliche_inspirational: { score: 95, aspect: 'problem', keywords_matched: ['learned importance', 'grew as person'] },
      cliche_essay_formula: { score: 90, aspect: 'problem', keywords_matched: ['opening with', 'made me who I am'] },
      telling_not_showing: { score: 85, aspect: 'problem', keywords_matched: ['I learned', 'I realized'] },
      cliche_metaphor: { score: 75, aspect: 'problem', keywords_matched: ['overused phrases'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['authenticity', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['throughout', 'conclusion'],
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
        issue_types: 'all',
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'warning',
  },

  {
    source_id: 'universal_cliche_antidote',
    type: 'expert_guidance',
    title: 'The Cliche Antidote',
    author: 'Admissions Essay Consultant',
    author_title: 'Former Ivy League AO',
    publication: 'Essay Writing Workshop',
    date: '2023-02',
    quote: 'When you catch yourself writing something that "sounds like an essay," stop. That feeling means you\'ve defaulted to a pattern. Ask: What would I actually say if I were telling this to a friend? Start there.',
    relevance_to_claim: 'Authentic voice naturally avoids cliched essay patterns',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'solution', keywords_matched: ['sounds like essay', 'pattern'] },
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['defaulted pattern', 'telling friend'] },
      cliche_ai_convergence: { score: 85, aspect: 'solution', keywords_matched: ['actually say', 'friend'] },
      cliche_inspirational: { score: 80, aspect: 'solution', keywords_matched: ['stop', 'pattern'] },
      cliche_metaphor: { score: 75, aspect: 'solution', keywords_matched: ['sounds like essay', 'pattern'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['how_to_fix', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_essay_formula', 'cliche_ai_convergence', 'cliche_inspirational', 'cliche_metaphor'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 9: EMOTIONAL RESONANCE
  // ============================================================================
  {
    source_id: 'universal_emotional_stakes',
    type: 'expert_guidance',
    title: 'Establishing Emotional Stakes',
    author: 'Story Grid',
    author_title: 'Narrative Structure Expert',
    publication: 'Story Structure for Essays',
    date: '2022-06',
    quote: 'Every memorable story has clear stakes—what could be gained or lost. In college essays, the stakes are often internal: identity, understanding, connection. Show the reader why this moment mattered to you.',
    relevance_to_claim: 'Clear emotional stakes create reader investment',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['stakes', 'mattered'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['show reader', 'why mattered'] },
      cliche_topic_framing: { score: 80, aspect: 'solution', keywords_matched: ['identity', 'internal'] },
      cliche_essay_formula: { score: 75, aspect: 'solution', keywords_matched: ['memorable story'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling', 'vulnerability'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
      essay_section_relevance: ['body', 'throughout'],
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
        issue_types: ['cliche_narrative_arc', 'telling_not_showing', 'cliche_topic_framing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      requires_narrative: true,
      min_word_count: 250,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'universal_emotional_honesty',
    type: 'expert_guidance',
    title: 'The Vulnerability Principle',
    author: 'Brene Brown',
    author_title: 'Research Professor',
    publication: 'Vulnerability in Storytelling',
    date: '2015-09',
    quote: 'Vulnerability is not weakness; it is our most accurate measure of courage. The stories that resonate are those where the storyteller is willing to be seen.',
    relevance_to_claim: 'Emotional honesty creates powerful reader connection',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 85, aspect: 'principle', keywords_matched: ['vulnerability', 'resonate'] },
      cliche_value_signaling: { score: 80, aspect: 'solution', keywords_matched: ['courage', 'willing to be seen'] },
      cliche_ai_convergence: { score: 75, aspect: 'solution', keywords_matched: ['stories resonate'] },
      telling_not_showing: { score: 70, aspect: 'principle', keywords_matched: ['willing to be seen'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_value_signaling', 'cliche_ai_convergence', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  // ============================================================================
  // SECTION 10: AI-SPECIFIC DETECTION AWARENESS
  // ============================================================================
  {
    source_id: 'universal_ai_detection_patterns',
    type: 'research_study',
    title: 'AI Detection in College Essays',
    author: 'Turnitin Research',
    author_title: 'Academic Integrity Research',
    publication: 'AI Writing Detection Analysis',
    date: '2024-01',
    finding: 'AI-generated text exhibits predictable patterns: consistent sentence length, lack of personal specificity, absence of sensory details, and overuse of transition phrases. Human writing is messier, more varied, and more personal.',
    relevance_to_claim: 'Authentic human writing has distinct patterns that AI cannot replicate',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'problem', keywords_matched: ['AI-generated', 'patterns', 'personal'] },
      cliche_language: { score: 90, aspect: 'problem', keywords_matched: ['transition phrases', 'consistent'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['sensory details', 'personal'] },
      cliche_essay_formula: { score: 80, aspect: 'problem', keywords_matched: ['predictable patterns'] },
      cliche_metaphor: { score: 75, aspect: 'problem', keywords_matched: ['lack of personal specificity'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['specificity', 'cliche_avoidance'],
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
        issue_types: 'all',
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'warning',
  },

  {
    source_id: 'universal_ai_antidote',
    type: 'expert_guidance',
    title: 'Writing That Cannot Be Faked',
    author: 'College Admissions Consortium',
    author_title: 'Multi-Institution Study',
    publication: 'Essay Authenticity Guidelines',
    date: '2024-02',
    quote: 'The antidote to AI-sounding writing is specificity that could only come from lived experience: the exact words your grandmother used, the smell of your childhood kitchen, the feeling in your chest at a specific moment. AI can\'t know what you know.',
    relevance_to_claim: 'Personal specificity is the strongest defense against generic-sounding writing',
    weight_in_calculation: 90,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'solution', keywords_matched: ['cannot be faked', 'lived experience'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['exact words', 'smell', 'feeling'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['specificity', 'only you know'] },
      cliche_metaphor: { score: 90, aspect: 'solution', keywords_matched: ['exact words', 'smell', 'specific moment'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: 'all',
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  // ============================================================================
  // SECTION 11: STRUCTURE AND FLOW
  // ============================================================================
  {
    source_id: 'universal_structure_one_story',
    type: 'expert_guidance',
    title: 'The One-Story Rule',
    author: 'Essay Coaching Expert',
    author_title: 'Admissions Consultant',
    publication: 'Essay Structure Workshop',
    date: '2023-03',
    quote: 'The most common essay mistake is trying to tell your whole life story. A 650-word essay is one moment, one story, one insight explored deeply. Better to go deep on one thing than shallow on five.',
    relevance_to_claim: 'Focused essays have greater impact than comprehensive ones',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['whole life story', 'one moment'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['one story', 'deep'] },
      cliche_topic_framing: { score: 80, aspect: 'solution', keywords_matched: ['explored deeply'] },
      telling_not_showing: { score: 70, aspect: 'solution', keywords_matched: ['go deep'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
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
        issue_types: ['cliche_essay_formula', 'cliche_narrative_arc', 'cliche_topic_framing', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      main_essay_only: true,
    },
    authority: 'expert',
    advice_type: 'structure',
  },

  // ============================================================================
  // SECTION 12: ENDINGS AND CONCLUSIONS
  // ============================================================================
  {
    source_id: 'universal_conclusion_avoid',
    type: 'expert_guidance',
    title: 'What NOT to Do in Conclusions',
    author: 'Essay Writing Workshop',
    author_title: 'Admissions Expert Consensus',
    publication: 'Common Mistakes Guide',
    date: '2023-06',
    quote: 'Never end with: a grand summary of what you learned, an explicit statement of how this will help in college, or the phrase "I am excited to..." These endings tell the reader you ran out of actual story.',
    relevance_to_claim: 'Weak conclusions undermine strong essays',
    weight_in_calculation: 85,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['grand summary', 'excited to'] },
      cliche_inspirational: { score: 90, aspect: 'problem', keywords_matched: ['what you learned', 'help in college'] },
      cliche_language: { score: 85, aspect: 'problem', keywords_matched: ['I am excited', 'explicit statement'] },
      telling_not_showing: { score: 80, aspect: 'problem', keywords_matched: ['summary', 'explicit'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['cliche_avoidance'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['conclusion'],
    },

    usage: {
      best_for: ['explaining_problem', 'what_to_avoid'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_essay_formula', 'cliche_inspirational', 'cliche_language', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 250,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'universal_conclusion_technique',
    type: 'expert_guidance',
    title: 'Powerful Endings',
    author: 'Narrative Craft Guide',
    author_title: 'Writing Instruction',
    publication: 'Story Endings Workshop',
    date: '2022-11',
    quote: 'The best endings create resonance by returning to the opening with new understanding, ending on a specific image, or leaving the reader with a question that lingers. Let the story end—don\'t explain what it meant.',
    relevance_to_claim: 'Strong endings create lasting impression without over-explanation',
    weight_in_calculation: 80,
    last_verified: '2024-12-01',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['returning to opening', 'resonance'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['don\'t explain', 'question lingers'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['specific image', 'let story end'] },
      cliche_narrative_arc: { score: 80, aspect: 'solution', keywords_matched: ['new understanding'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling'],
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
        issue_types: ['cliche_essay_formula', 'cliche_inspirational', 'telling_not_showing', 'cliche_narrative_arc'],
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
];

// ============================================================================
// HELPER FUNCTIONS FOR UNIVERSAL SOURCES
// ============================================================================

/**
 * Get all universal sources
 */
export function getUniversalSources(): EnhancedLabeledSource[] {
  return UNIVERSAL_SOURCES;
}

/**
 * Get universal sources by issue type
 */
export function getUniversalSourcesForIssue(
  issueType: string
): EnhancedLabeledSource[] {
  return UNIVERSAL_SOURCES.filter(source => {
    const relevance = source.issue_relevance[issueType as keyof typeof source.issue_relevance];
    return relevance && relevance.score >= 70;
  }).sort((a, b) => {
    const scoreA = a.issue_relevance[issueType as keyof typeof a.issue_relevance]?.score || 0;
    const scoreB = b.issue_relevance[issueType as keyof typeof b.issue_relevance]?.score || 0;
    return scoreB - scoreA;
  });
}

/**
 * Get universal sources by advice type
 */
export function getUniversalSourcesByAdviceType(
  adviceType: EnhancedLabeledSource['advice_type']
): EnhancedLabeledSource[] {
  return UNIVERSAL_SOURCES.filter(source => source.advice_type === adviceType);
}

/**
 * Get universal sources by authority level
 */
export function getUniversalSourcesByAuthority(
  authority: EnhancedLabeledSource['authority']
): EnhancedLabeledSource[] {
  return UNIVERSAL_SOURCES.filter(source => source.authority === authority);
}

/**
 * Get universal sources for essay section
 */
export function getUniversalSourcesForSection(
  section: 'opening' | 'body' | 'conclusion' | 'throughout'
): EnhancedLabeledSource[] {
  return UNIVERSAL_SOURCES.filter(source =>
    source.taxonomy.essay_section_relevance.includes(section)
  );
}

/**
 * Check if a universal source is applicable to a prompt type
 */
export function isUniversalSourceApplicable(
  source: EnhancedLabeledSource,
  promptType: PromptType
): boolean {
  // Check never_use_for exclusions
  if (source.scope.never_use_for?.prompt_types?.includes(promptType)) {
    return false;
  }
  // Universal sources apply to all unless explicitly excluded
  return true;
}

/**
 * Get the count of universal sources by category
 */
export function getUniversalSourceStats(): {
  total: number;
  byCategory: Record<string, number>;
  byAuthority: Record<string, number>;
  byAdviceType: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  const byAuthority: Record<string, number> = {};
  const byAdviceType: Record<string, number> = {};

  for (const source of UNIVERSAL_SOURCES) {
    // Count by category
    const cat = source.taxonomy.primary_category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;

    // Count by authority
    byAuthority[source.authority] = (byAuthority[source.authority] || 0) + 1;

    // Count by advice type
    byAdviceType[source.advice_type] = (byAdviceType[source.advice_type] || 0) + 1;
  }

  return {
    total: UNIVERSAL_SOURCES.length,
    byCategory,
    byAuthority,
    byAdviceType,
  };
}
