/**
 * Prose Quality & Voice Deep Research Sources
 *
 * EXTRACTED FROM: Perplexity Deep Research on "Prose Quality & Voice at the Sentence Level"
 * DATE: January 2025
 * CITATIONS: 98+ authoritative sources
 *
 * KEY CATEGORIES:
 * 1. Voice & Authenticity - What makes writing sound genuinely "you"
 * 2. Sentence Craft - Length variation, rhythm, structure
 * 3. Verb Strength - Strong vs weak verb selection
 * 4. Word Choice - Precision, specificity, natural language
 * 5. Over-Editing Detection - Signs of excessive polish
 * 6. Admissions Perspectives - What AOs notice about prose
 *
 * INTEGRATION: This file follows the scalable source integration pattern.
 * See sourceRegistry.ts for registration and DEEP_RESEARCH_SOURCE_INTEGRATION_GUIDE.md for process.
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// SECTION 1: VOICE & AUTHENTICITY SOURCES
// ============================================================================

export const VOICE_AUTHENTICITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_ivy_rough_edges',
    type: 'admissions_quote',
    title: 'Authenticity Over Perfection',
    author: 'Former Ivy League Admissions Officer',
    author_title: 'Former Admissions Officer',
    publication: 'Admissionado',
    date: '2024-01',

    quote: "We'd rather see an essay with rough edges that feels authentic than one that's perfectly edited but lifeless. If it sounds like it was written by a 40-year-old, we know something's off.",

    relevance_to_claim: 'Establishes that authenticity trumps polish in admissions evaluation',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['authentic', 'lifeless', 'polished'] },
      cliche_language: { score: 85, aspect: 'principle', keywords_matched: ['rough edges', 'authentic'] },
      telling_not_showing: { score: 70, aspect: 'principle', keywords_matched: ['lifeless'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective', 'vulnerability'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'pq_brooks_voice',
    type: 'admissions_quote',
    title: 'Voice Reveals Thinking',
    author: 'Dr. Tina Brooks',
    author_title: 'Former Associate Dean of Admissions',
    publication: 'Pomona College / Top Tier Admissions',
    date: '2024-01',

    quote: "Admissions officers aren't seeking polished academic prose—they want to hear how students think. The goal is not to impress with grand tales or big words but rather to let them get to know the real you.",

    relevance_to_claim: 'Defines what admissions officers actually seek in voice',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 90, aspect: 'principle', keywords_matched: ['impress', 'grand tales', 'big words'] },
      cliche_ai_convergence: { score: 85, aspect: 'principle', keywords_matched: ['polished', 'real you'] },
      cliche_language: { score: 80, aspect: 'principle', keywords_matched: ['polished academic prose'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
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
        issue_types: ['cliche_value_signaling', 'cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'pq_pomona_voice_village',
    type: 'admissions_quote',
    title: 'Voice Reveals Community Fit',
    author: 'Tom',
    author_title: 'Admissions Representative',
    publication: 'Pomona College / College Essay Guy',
    date: '2024-01',

    quote: "Many colleges aren't collecting academic markers—they have way more than enough qualified applicants. Instead, they're building a village. Voice can help them see how you fit in the village they want to create.",

    relevance_to_claim: 'Explains the strategic function of voice in selective admissions',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 85, aspect: 'principle', keywords_matched: ['voice', 'village', 'fit'] },
      cliche_college_specific: { score: 80, aspect: 'principle', keywords_matched: ['building a village'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['intellectual_community', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'proving_weight', 'motivating_student'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_college_specific'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'pq_conversational_flow',
    type: 'expert_guidance',
    title: 'Conversational Flow in Essays',
    author: 'College Confidential',
    author_title: 'Admissions Platform',
    publication: 'College Confidential',
    date: '2024-01',

    quote: "The essay should flow like a delightful conversation, free of fluffy words and phrases that would make readers question who wrote it.",

    relevance_to_claim: 'Defines the naturalness standard for authentic voice',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['fluffy words', 'question who wrote'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['conversational', 'fluffy words'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling'],
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
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 2: SENTENCE CRAFT SOURCES
// ============================================================================

export const SENTENCE_CRAFT_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_provost_variation',
    type: 'literary_principle',
    title: 'Gary Provost on Sentence Variation',
    author: 'Gary Provost',
    author_title: 'Writing Instructor',
    publication: '100 Ways to Improve Your Writing',
    date: '1985-01',

    quote: "This sentence has five words. Here are five more words. Five-word sentences are fine. But several together become monotonous. Listen to what is happening. The writing is getting boring. Now listen. I vary the sentence length, and I create music. Music. The writing sings.",

    relevance_to_claim: 'The definitive demonstration of sentence variation power',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['monotonous', 'vary', 'music'] },
      cliche_ai_convergence: { score: 80, aspect: 'solution', keywords_matched: ['monotonous', 'boring'] },
      telling_not_showing: { score: 70, aspect: 'technique', keywords_matched: ['music', 'sings'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_ai_convergence', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'principle',
    advice_type: 'technique',
  },

  {
    source_id: 'pq_rhythm_emotion',
    type: 'expert_guidance',
    title: 'Rhythm Matches Emotion',
    author: 'September C. Fawkes',
    author_title: 'Writing Coach',
    publication: 'September C. Fawkes Blog',
    date: '2017-01',

    quote: "In life, people who are scared have different sentence structures than people who are at peace. The rhythm and beats and stresses of the sentences themselves embody the sound of fear, the sound of happiness, the sound of annoyance—leading readers to feel rather than simply read about emotions.",

    relevance_to_claim: 'Explains how sentence rhythm creates emotional authenticity',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['feel', 'rhythm', 'emotions'] },
      cliche_language: { score: 75, aspect: 'solution', keywords_matched: ['sentence structures', 'rhythm'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['vulnerability', 'authenticity'],
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
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'pq_short_sentence_impact',
    type: 'literary_principle',
    title: 'Short Sentences for Impact',
    author: 'Writing Research',
    author_title: 'Multiple Sources',
    publication: 'HIP Books / Various',
    date: '2024-01',

    quote: "A Very Short Sentence of three-to-five words can punch up a series of longer flowing sentences and make the reader sit up and take notice. The key is strategic deployment after longer setup for maximum emotional impact.",

    relevance_to_claim: 'Teaches the craft of strategic brevity for emphasis',
    weight_in_calculation: 80,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 80, aspect: 'technique', keywords_matched: ['punch', 'impact', 'notice'] },
      cliche_narrative_arc: { score: 70, aspect: 'technique', keywords_matched: ['setup', 'strategic'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'technique'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'how_to_fix'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'principle',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 3: VERB STRENGTH SOURCES
// ============================================================================

export const VERB_STRENGTH_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_elements_style',
    type: 'literary_principle',
    title: 'Elements of Style on Verbs',
    author: 'William Strunk Jr. & E.B. White',
    author_title: 'Authors',
    publication: 'The Elements of Style',
    date: '1959-01',

    quote: "Write with nouns and verbs, not with adjectives and adverbs. The adjective hasn't been built that can pull a weak or inaccurate noun out of a tight place.",

    relevance_to_claim: 'The foundational principle for strong prose',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['nouns', 'verbs', 'adjectives'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['weak', 'inaccurate'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
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
        issue_types: ['telling_not_showing', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'pq_jenkins_verbs',
    type: 'expert_guidance',
    title: 'Jerry Jenkins on Verb Power',
    author: 'Jerry Jenkins',
    author_title: 'Writing Instructor & NYT Bestselling Author',
    publication: 'Jerry Jenkins Blog',
    date: '2024-01',

    quote: "Good writing is more about well-chosen nouns and powerful verbs than it is about adjectives and adverbs. Strong verbs place us in the scene and let us experience it for ourselves, while weak verbs tell us what's going on with lots of extra words.",

    relevance_to_claim: 'Explains how verb choice affects reader immersion',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['experience', 'scene', 'strong verbs'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['weak verbs', 'extra words'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
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
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'pq_ceg_verb_transformation',
    type: 'expert_guidance',
    title: 'Verb Transformation Example',
    author: 'College Essay Guy',
    author_title: 'College Admissions Consultant',
    publication: 'College Essay Guy Blog',
    date: '2024-01',

    quote: "Before: 'I harness salient people skills to connect deeply with others.' After: 'Because I'm quite curious, I often engage with customers at my Target register who chat with me about their beloved, rambunctious grandkids.' The transformation replaces abstract claiming with concrete action.",

    relevance_to_claim: 'Demonstrates concrete verb transformation for college essays',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'example', keywords_matched: ['engage', 'chat', 'concrete action'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['harness', 'salient', 'abstract claiming'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['people skills', 'connect deeply'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'authenticity'],
      teaching_moment_types: ['before_after', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_value_signaling', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'example',
  },
];

// ============================================================================
// SECTION 4: WORD CHOICE & SPECIFICITY SOURCES
// ============================================================================

export const WORD_CHOICE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_twain_lightning',
    type: 'literary_principle',
    title: 'Mark Twain on Word Choice',
    author: 'Mark Twain',
    author_title: 'Author',
    publication: 'The Letters of Mark Twain',
    date: '1888-01',

    quote: "The difference between the almost right word and the right word is really a large matter—'tis the difference between the lightning-bug and the lightning.",

    relevance_to_claim: 'The definitive statement on word choice precision',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 90, aspect: 'principle', keywords_matched: ['right word', 'almost right'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['lightning', 'lightning-bug'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['showing_vs_telling', 'authenticity'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'inspiring',
      complexity: 'simple',
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

    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'pq_specific_nouns',
    type: 'expert_guidance',
    title: 'Specific Nouns Over Adjectives',
    author: 'Emma Walton Hamilton',
    author_title: 'Writing Instructor',
    publication: 'Emma Walton Hamilton Blog',
    date: '2024-01',

    quote: "A character who lives in a 'house' could live anywhere, but a character who lives in a 'cottage' or 'brownstone' immediately conjures a sense of place. Concrete nouns anchor readers in the physical world, helping them visualize and emotionally connect with the text.",

    relevance_to_claim: 'Demonstrates how noun specificity creates engagement',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['visualize', 'concrete', 'anchor'] },
      cliche_language: { score: 75, aspect: 'solution', keywords_matched: ['specific', 'sense of place'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['showing_vs_telling'],
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
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'pq_essay_speak_warning',
    type: 'expert_guidance',
    title: 'Essay-Speak vs Natural Language',
    author: 'Student Voice',
    author_title: 'Student',
    publication: 'Saratoga Falcon',
    date: '2024-01',

    quote: "My counselor tells me I shouldn't sound like I'm having a conversation with my friend when I'm writing. But isn't that the point? The admissions officer should read my essay and feel like they know who I am.",

    relevance_to_claim: 'Articulates the conversational authenticity standard from student perspective',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 90, aspect: 'principle', keywords_matched: ['conversation', 'know who I am'] },
      cliche_ai_convergence: { score: 85, aspect: 'principle', keywords_matched: ['feel', 'sound'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'motivating_student'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'pattern',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 5: OVER-EDITING & POLISH SOURCES
// ============================================================================

export const OVER_EDITING_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_parent_edit_warning',
    type: 'expert_guidance',
    title: 'Parent Editing Red Flag',
    author: 'Deb Levy',
    author_title: 'College Essay Coach',
    publication: 'Deb Levy Writes',
    date: '2024-01',

    quote: "The only difference between what they wrote, and what their uncle rewrote, was a matter of style and vocabulary. And that this rewrite, with words like 'insouciantly,' would raise a giant red flag to admissions that this might not be the student's own work.",

    relevance_to_claim: 'Demonstrates how vocabulary substitution reveals editing',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'warning', keywords_matched: ['red flag', 'own work', 'vocabulary'] },
      cliche_language: { score: 85, aspect: 'warning', keywords_matched: ['insouciantly', 'rewrite', 'style'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'pq_voice_squeezed_out',
    type: 'admissions_quote',
    title: 'Voice Squeezed Out by Editing',
    author: 'Admissions Officers',
    author_title: 'Multiple Sources',
    publication: 'Various Admissions Guides',
    date: '2024-01',

    quote: "Some essays are so over-edited and polished, the student's voice has been squeezed out. Admissions officers can easily spot when a student is trying to impress with language that's too formal and stodgy.",

    relevance_to_claim: 'Defines the over-editing detection pattern',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'warning', keywords_matched: ['over-edited', 'polished', 'voice squeezed'] },
      cliche_language: { score: 90, aspect: 'warning', keywords_matched: ['formal', 'stodgy'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'primary',
    advice_type: 'warning',
  },

  {
    source_id: 'pq_two_space_test',
    type: 'expert_guidance',
    title: 'Two-Space Adult Editing Signal',
    author: 'College Confidential',
    author_title: 'Admissions Platform',
    publication: 'College Confidential',
    date: '2024-01',

    quote: "Two spaces between sentences—something their parents were almost definitely taught—could be a sign that an adult might have had their hands in the essay, even though it's authentic formatting for that generation.",

    relevance_to_claim: 'Reveals subtle generational formatting signals of editing',
    weight_in_calculation: 75,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 70, aspect: 'warning', keywords_matched: ['adult', 'hands in', 'parents'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: [],
      teaching_moment_types: ['what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'warning',
  },
];

// ============================================================================
// SECTION 6: MEMORABLE ESSAY & AO PERSPECTIVE SOURCES
// ============================================================================

export const ADMISSIONS_PERSPECTIVE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'pq_zaiser_memorable',
    type: 'admissions_quote',
    title: 'Most Memorable Essay - Raw Authenticity',
    author: 'Greg Zaiser',
    author_title: 'Vice President of Admissions',
    publication: 'Elon University / College Admissions Strategies',
    date: '2024-01',

    quote: "The most memorable essay I've ever read was one written by an applicant who described her brother's special needs. Instead of taking a path I expected, she revealed that he embarrassed her and that she found herself trying to keep her friends from meeting him. It was raw, real, completely uncomfortable and incredibly authentic. Risky? Perhaps. But it stood out because she was 'real'.",

    relevance_to_claim: 'Demonstrates what makes essays unforgettable',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 95, aspect: 'example', keywords_matched: ['unexpected', 'raw', 'real'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['uncomfortable', 'authentic'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['embarrassed', 'revealed'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['elite_example', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'motivating_student', 'proving_weight'],
      tone: 'inspiring',
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

    authority: 'primary',
    advice_type: 'example',
  },

  {
    source_id: 'pq_zaiser_truck_metaphor',
    type: 'admissions_quote',
    title: 'Dented Truck Metaphor Success',
    author: 'Greg Zaiser',
    author_title: 'Vice President of Admissions',
    publication: 'Elon University / College Admissions Strategies',
    date: '2024-01',

    quote: "Another memorable essay was the student who used the dents on his truck as a metaphor for his life challenges. It personalized the experience in a way that wouldn't have otherwise worked.",

    relevance_to_claim: 'Shows how organic metaphors from real life succeed',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_metaphor: { score: 95, aspect: 'example', keywords_matched: ['truck', 'metaphor', 'personalized'] },
      telling_not_showing: { score: 85, aspect: 'example', keywords_matched: ['dents', 'life challenges'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['elite_example', 'how_to_fix'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['showing_elite_pattern', 'teaching_principle'],
      tone: 'inspiring',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_metaphor', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'primary',
    advice_type: 'example',
  },

  {
    source_id: 'pq_read_aloud_test',
    type: 'expert_guidance',
    title: 'Read Aloud Revision Technique',
    author: 'Duke University Writing Studio',
    author_title: 'Academic Writing Center',
    publication: 'Duke TWP',
    date: '2024-01',

    quote: "Reading aloud activates different parts of your brain—speech, hearing, and memory. Pay close attention to sentences or passages that make you stumble as you read. They may need to be revised because the ideas lack clarity or the prose is awkwardly phrased. If it doesn't sound like you speaking, consider a rewrite.",

    relevance_to_claim: 'The definitive revision technique for voice authenticity',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['sound like you', 'stumble'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['awkwardly phrased', 'clarity'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'technique'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'how_to_fix'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'research',
    advice_type: 'technique',
  },

  {
    source_id: 'pq_forgettable_pattern',
    type: 'expert_guidance',
    title: 'Why Essays Are Forgettable',
    author: 'Parents In Action',
    author_title: 'Admissions Resource',
    publication: 'Parents In Action',
    date: '2024-01',

    quote: "Admissions officers have to read an unbelievable number of college essays, most of which are forgettable. Many students try to sound smart rather than sounding like themselves. Others write about a subject that they don't care about, but that they think will impress admissions officers.",

    relevance_to_claim: 'Explains the root causes of forgettable essays',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 90, aspect: 'warning', keywords_matched: ['sound smart', 'impress'] },
      cliche_ai_convergence: { score: 85, aspect: 'warning', keywords_matched: ['forgettable', 'themselves'] },
      cliche_topic_framing: { score: 80, aspect: 'warning', keywords_matched: ['don\'t care about'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
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
        issue_types: ['cliche_value_signaling', 'cliche_ai_convergence', 'cliche_topic_framing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },

    authority: 'expert',
    advice_type: 'warning',
  },
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * All Prose Quality & Voice sources combined
 * This is the primary export used by sourceRegistry.ts
 */
export const ALL_PROSE_QUALITY_SOURCES: EnhancedLabeledSource[] = [
  ...VOICE_AUTHENTICITY_SOURCES,
  ...SENTENCE_CRAFT_SOURCES,
  ...VERB_STRENGTH_SOURCES,
  ...WORD_CHOICE_SOURCES,
  ...OVER_EDITING_SOURCES,
  ...ADMISSIONS_PERSPECTIVE_SOURCES,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all Prose Quality sources
 */
export function getProseQualitySources(): EnhancedLabeledSource[] {
  return ALL_PROSE_QUALITY_SOURCES;
}

/**
 * Get source statistics for this batch
 */
export function getProseQualityStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  return {
    total: ALL_PROSE_QUALITY_SOURCES.length,
    byCategory: {
      voice_authenticity: VOICE_AUTHENTICITY_SOURCES.length,
      sentence_craft: SENTENCE_CRAFT_SOURCES.length,
      verb_strength: VERB_STRENGTH_SOURCES.length,
      word_choice: WORD_CHOICE_SOURCES.length,
      over_editing: OVER_EDITING_SOURCES.length,
      admissions_perspective: ADMISSIONS_PERSPECTIVE_SOURCES.length,
    },
  };
}
