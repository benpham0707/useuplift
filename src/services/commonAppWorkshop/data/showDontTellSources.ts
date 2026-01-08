/**
 * Show Don't Tell Deep Research Sources
 *
 * EXTRACTED FROM: Perplexity Deep Research on "Show Don't Tell" (January 2025)
 * These sources represent high-authority, research-backed insights
 * specifically for teaching the show-don't-tell technique.
 *
 * KEY CATEGORIES:
 * 1. Admissions Officer Direct Quotes (Highest Authority)
 * 2. Expert Frameworks (Five Craft Moves, Specifics Spectrum)
 * 3. Neuroscience-Backed Insights (Why Showing Works)
 * 4. Transformation Techniques (Before/After Patterns)
 * 5. Short-Form Essay Strategies (Minimum Viable Scene)
 * 6. Advanced Techniques (Iceberg Theory, Internal-External)
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// SECTION 1: ADMISSIONS OFFICER DIRECT QUOTES (HIGHEST AUTHORITY)
// ============================================================================

export const SHOW_DONT_TELL_AO_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_ao_yale_landesman',
    type: 'admissions_quote',
    title: 'The Personal Statement as Introduction',
    author: 'Marcia Landesman',
    author_title: 'Associate Director, Yale University Admissions',
    publication: 'What Do Universities Look For: 15 Quotes from Admissions Directors',
    date: '2024-01',
    quote: "The personal statement is their absolute favorite part. It's really a chance for us to get to know who you are... your chance to say, 'Hello, this is me, and here's what matters to me.'",
    relevance_to_claim: 'AOs prioritize authentic personal voice over polished perfection',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'yale',
      applicable_colleges: ['yale'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['this is me', 'who you are'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['get to know', 'what matters'] },
      cliche_essay_formula: { score: 90, aspect: 'solution', keywords_matched: ['favorite part', 'chance'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['authentic', 'voice'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['showing_vs_telling', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'explaining_problem', 'teaching_principle'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'telling_not_showing', 'cliche_essay_formula', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'sdt_ao_michigan_bryant',
    type: 'admissions_quote',
    title: 'Storytellers Are Always Good',
    author: 'Kim Bryant',
    author_title: 'Assistant Director, University of Michigan Admissions',
    publication: 'What Do Universities Look For: 15 Quotes from Admissions Directors',
    date: '2024-01',
    quote: "I like reading a personal story that is tied to real life. I like it when I can hear a student's voice. Storytellers are always good.",
    relevance_to_claim: 'AOs value narrative authenticity and genuine voice over abstract claims',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['personal story', 'real life', 'storytellers'] },
      cliche_ai_convergence: { score: 90, aspect: 'principle', keywords_matched: ['student\'s voice', 'hear'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['storytellers', 'personal story'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['voice', 'real life'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['authenticity', 'narrative_structure'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'teaching_principle', 'justifying_severity'],
      tone: 'supportive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_ai_convergence', 'cliche_narrative_arc', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'sdt_ao_uva_lenox',
    type: 'admissions_quote',
    title: 'Over-Editing Kills Voice',
    author: 'Macy Lenox',
    author_title: 'Associate Dean, University of Virginia Admissions',
    publication: 'What Do Universities Look For: 15 Quotes from Admissions Directors',
    date: '2024-01',
    quote: "More than anything, I want to encourage students to write from the heart. Use the words that come naturally to you—avoid the thesaurus. Some of the worst college essays I've read were actually written quite well in terms of grammar but the student's unique voice had been lost through editing.",
    relevance_to_claim: 'Over-polishing destroys authenticity; natural voice matters more than perfection',
    weight_in_calculation: 94,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'uva',
      applicable_colleges: ['uva'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'warning', keywords_matched: ['unique voice lost', 'editing', 'thesaurus'] },
      cliche_language: { score: 95, aspect: 'warning', keywords_matched: ['words naturally', 'avoid thesaurus'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['from the heart'] },
      cliche_essay_formula: { score: 85, aspect: 'warning', keywords_matched: ['worst essays', 'grammar but voice lost'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['cliche_avoidance', 'fresh_perspective'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters', 'principle_explanation'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language', 'telling_not_showing', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'warning',
  },

  {
    source_id: 'sdt_ao_mit_peterson',
    type: 'admissions_quote',
    title: 'Mr. Vu vs. Vague Terms',
    author: 'Chris Peterson',
    author_title: 'MIT Admissions Officer',
    publication: 'MIT Admissions Blog: Show Don\'t Tell',
    date: '2023-09',
    quote: "Which essay will readers remember better? An essay that speaks in general terms or Mr. Vu with his bill? You just can't afford to waste words speaking in vague terms.",
    relevance_to_claim: 'Specific named examples are infinitely more memorable than abstract claims',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'mit',
      applicable_colleges: ['mit'],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['Mr. Vu', 'vague terms', 'remember'] },
      cliche_language: { score: 95, aspect: 'solution', keywords_matched: ['general terms', 'specific'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['waste words', 'remember'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['readers remember'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['showing_vs_telling', 'cliche_avoidance'],
      teaching_moment_types: ['why_this_matters', 'before_after', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle', 'explaining_problem'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_ai_convergence', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'sdt_ao_unc_davis',
    type: 'admissions_quote',
    title: 'What Is Meaningful to You',
    author: 'Michael Davis',
    author_title: 'Associate Director, University of North Carolina Admissions',
    publication: 'What Do Universities Look For: 15 Quotes from Admissions Directors',
    date: '2024-01',
    quote: "The essay is a unique opportunity to share your story and what is meaningful or important to you. Write about a topic that helps the university understand you as a unique individual.",
    relevance_to_claim: 'Essays should reveal personal meaning, not demonstrate accomplishments',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 95, aspect: 'principle', keywords_matched: ['meaningful', 'unique individual'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['share your story', 'understand you'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['unique opportunity'] },
      cliche_ai_convergence: { score: 85, aspect: 'solution', keywords_matched: ['unique individual'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['fresh_perspective', 'vulnerability'],
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
        issue_types: ['cliche_topic_framing', 'telling_not_showing', 'cliche_essay_formula', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 2: EXPERT FRAMEWORKS
// ============================================================================

export const SHOW_DONT_TELL_FRAMEWORK_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_framework_five_craft_moves',
    type: 'expert_guidance',
    title: 'The Five Craft Moves for Showing',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Show Don\'t Tell Guide',
    date: '2024-01',
    quote: "Five essential techniques transform telling into showing: (1) Sensory details using all five senses, (2) Specific names and proper nouns, (3) Active, specific verbs, (4) Statistics and data, (5) Emotional language that evokes feeling through physical manifestation.",
    relevance_to_claim: 'Systematic framework for transforming abstract claims into concrete showing',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['sensory details', 'specific names', 'active verbs'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['specific', 'proper nouns', 'statistics'] },
      cliche_metaphor: { score: 85, aspect: 'solution', keywords_matched: ['emotional language', 'physical manifestation'] },
      cliche_essay_formula: { score: 80, aspect: 'solution', keywords_matched: ['five techniques', 'transform'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation', 'before_after'],
      essay_section_relevance: ['throughout', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'showing_elite_pattern'],
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
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'sdt_framework_specifics_spectrum',
    type: 'expert_guidance',
    title: 'The Specifics Spectrum: Good → Better → Best',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Show Don\'t Tell Guide',
    date: '2024-01',
    quote: "Move up the specifics spectrum from general to 'HD quality': 'I am committed to oncology' (weak) → 'I want to specialize in pediatric oncology' (better) → 'I shadow Dr. Abdullah in pediatric oncology at Grand Kenyon Hospital' (HD quality with verifiable specificity).",
    relevance_to_claim: 'Provides clear progression for improving specificity in essays',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['specifics spectrum', 'HD quality'] },
      cliche_language: { score: 95, aspect: 'solution', keywords_matched: ['general', 'specific', 'verifiable'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['Dr. Abdullah', 'Grand Kenyon', 'verifiable'] },
      cliche_topic_framing: { score: 85, aspect: 'solution', keywords_matched: ['pediatric oncology', 'specificity'] },
    },

    taxonomy: {
      primary_category: 'specificity',
      secondary_categories: ['showing_vs_telling', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_ai_convergence', 'cliche_topic_framing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'sdt_framework_scene_vs_summary',
    type: 'expert_guidance',
    title: 'Scene vs. Summary: The Core Distinction',
    author: 'Storm Writing School',
    author_title: 'Narrative Craft Expert',
    publication: 'Scene vs. Summary Guide',
    date: '2023-06',
    quote: "A scene is a unit of conflict lived through by character and reader—featuring dramatized action at roughly the same pace as the character experienced it, with sensory and concrete detail. Summary condenses events over time, filtering them through a narrator's voice rather than letting readers experience them directly.",
    relevance_to_claim: 'Defines the fundamental distinction between showing (scene) and telling (summary)',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['scene', 'summary', 'dramatized action'] },
      cliche_narrative_arc: { score: 90, aspect: 'principle', keywords_matched: ['conflict', 'lived through', 'experience'] },
      cliche_essay_formula: { score: 80, aspect: 'principle', keywords_matched: ['scene', 'summary', 'pace'] },
      cliche_language: { score: 75, aspect: 'solution', keywords_matched: ['sensory', 'concrete detail'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure', 'specificity'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['body', 'opening'],
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
        issue_types: ['telling_not_showing', 'cliche_narrative_arc', 'cliche_essay_formula', 'cliche_language'],
      },
      never_use_for: {
        prompt_types: ['short_answer'], // Too short for scene structure
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 200,
      requires_narrative: true,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'sdt_framework_strategic_telling',
    type: 'expert_guidance',
    title: 'Strategic Telling After Showing',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Show Don\'t Tell Guide',
    date: '2024-01',
    quote: "'Show, don't tell' is generally great advice, but in college essays, it can be nice to include small 'telling' statements after you've used rich detail to show us. The optimal balance: 80% showing, 20% strategic telling for clarity.",
    relevance_to_claim: 'Showing alone isn\'t enough; brief telling after showing ensures clarity',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['show', 'tell', 'strategic', '80% showing'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['balance', 'clarity'] },
      cliche_narrative_arc: { score: 80, aspect: 'solution', keywords_matched: ['after rich detail'] },
      cliche_language: { score: 75, aspect: 'solution', keywords_matched: ['small telling statements'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'conclusion'],
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
        issue_types: ['telling_not_showing', 'cliche_essay_formula', 'cliche_narrative_arc', 'cliche_language'],
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
];

// ============================================================================
// SECTION 3: NEUROSCIENCE-BACKED INSIGHTS
// ============================================================================

export const SHOW_DONT_TELL_NEURO_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_neuro_mirror_neurons',
    type: 'research_study',
    title: 'Mirror Neurons and Reading',
    author: 'Greater Good Science Center',
    author_title: 'UC Berkeley Research',
    publication: 'The Neural Basis of Empathy',
    date: '2022-06',
    finding: "When readers encounter descriptions of actions, mirror neurons fire—the same brain cells that activate when performing those actions themselves. Reading 'trembling hands' causes readers' motor cortex regions for hand movement to activate. This creates involuntary simulation of the experience.",
    relevance_to_claim: 'Neuroscience explains why sensory details create empathic reader response',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['mirror neurons', 'sensory', 'simulation'] },
      cliche_metaphor: { score: 90, aspect: 'solution', keywords_matched: ['trembling hands', 'motor cortex'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['activate', 'experience'] },
      cliche_essay_formula: { score: 75, aspect: 'principle', keywords_matched: ['empathic response'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'vulnerability'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle', 'proving_weight'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_metaphor', 'cliche_language', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'sdt_neuro_memory_encoding',
    type: 'research_study',
    title: 'Sensory Details and Memory Encoding',
    author: 'Demme Learning Research',
    author_title: 'Educational Research',
    publication: 'Sensory Details in Writing',
    date: '2023-03',
    finding: "Sensory-rich narratives engage the amygdala, strengthening memory formation. This explains why admissions officers remember essays with vivid details: the emotional engagement during reading literally enhances memory encoding. Essays with specific sensory details were recalled 3x more accurately after 24 hours.",
    relevance_to_claim: 'Sensory details make essays memorable through neurological mechanisms',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'principle', keywords_matched: ['sensory-rich', 'vivid details', 'remember'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['memorable', 'recall'] },
      cliche_essay_formula: { score: 85, aspect: 'principle', keywords_matched: ['memory encoding', 'emotional engagement'] },
      cliche_ai_convergence: { score: 80, aspect: 'solution', keywords_matched: ['specific sensory details'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_essay_formula', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'sdt_neuro_affective_sharing',
    type: 'research_study',
    title: 'Emotional Processing in Reading',
    author: 'Caltech Singer Lab',
    author_title: 'Neuroscience Research',
    publication: 'Neural Basis of Empathy',
    date: '2022-01',
    finding: "Sensory descriptions of emotional experiences activate the anterior insula and anterior cingulate cortex—regions involved in processing one's own emotions. Both experiencing and reading about pain activate the same affective processing regions, creating genuine emotional resonance in readers.",
    relevance_to_claim: 'Showing emotions through physical detail creates real emotional response in readers',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'principle', keywords_matched: ['sensory descriptions', 'emotional', 'processing'] },
      cliche_metaphor: { score: 90, aspect: 'solution', keywords_matched: ['physical detail', 'emotional resonance'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['experiencing', 'reading about'] },
      cliche_narrative_arc: { score: 80, aspect: 'principle', keywords_matched: ['emotional experiences'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['vulnerability', 'specificity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_metaphor', 'cliche_language', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },
];

// ============================================================================
// SECTION 4: ADMISSIONS OFFICER BURNOUT CONTEXT
// ============================================================================

export const SHOW_DONT_TELL_CONTEXT_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_context_ao_burnout',
    type: 'research_study',
    title: 'Admissions Officer Fatigue',
    author: 'The Ivy Institute',
    author_title: 'Admissions Research',
    publication: 'College Admissions Officer Burnout Report',
    date: '2023-11',
    finding: "43% of admissions professionals reported team exhaustion during peak cycles. Officers read applications for 4+ hours daily, reviewing thousands of essays annually. This creates decision fatigue, increased reliance on pattern recognition, and enhanced memory only for essays with vivid, distinctive details that create 'cognitive pop-out effects.'",
    relevance_to_claim: 'AO fatigue explains why standing out through specificity is essential, not optional',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 95, aspect: 'problem', keywords_matched: ['exhaustion', 'pattern recognition', 'distinctive'] },
      cliche_essay_formula: { score: 95, aspect: 'problem', keywords_matched: ['decision fatigue', 'pop-out effects'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['vivid details', 'distinctive'] },
      cliche_ai_convergence: { score: 85, aspect: 'problem', keywords_matched: ['pattern recognition', 'thousands'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'proving_weight', 'motivating_student'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_language', 'cliche_essay_formula', 'telling_not_showing', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'research',
    advice_type: 'data',
  },

  {
    source_id: 'sdt_context_cliche_frequency',
    type: 'research_study',
    title: 'Cliché Phrase Frequency',
    author: 'Virtual College Counselors',
    author_title: 'Admissions Research',
    publication: 'Essay Topics Admission Officers Are Tired Of',
    date: '2023-09',
    finding: "Admissions officers estimate they encounter phrases like 'This experience taught me,' 'I grew as a person,' and 'I learned the importance of' in 30-50% of all essays. Essays opening with these phrases were 3x more likely to be rated 'forgettable' by readers.",
    relevance_to_claim: 'Quantifies how common clichéd telling phrases are and their negative impact',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_language: { score: 100, aspect: 'problem', keywords_matched: ['experience taught', 'grew as person', '30-50%'] },
      cliche_inspirational: { score: 95, aspect: 'problem', keywords_matched: ['learned importance', 'forgettable'] },
      telling_not_showing: { score: 90, aspect: 'problem', keywords_matched: ['I learned', 'I grew'] },
      cliche_essay_formula: { score: 90, aspect: 'problem', keywords_matched: ['opening with', '3x more likely'] },
    },

    taxonomy: {
      primary_category: 'cliche_avoidance',
      secondary_categories: ['showing_vs_telling', 'authenticity'],
      teaching_moment_types: ['what_to_avoid', 'why_this_matters'],
      essay_section_relevance: ['opening', 'conclusion', 'throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'explaining_problem', 'proving_weight'],
      tone: 'challenging',
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
];

// ============================================================================
// SECTION 5: SHORT-FORM ESSAY STRATEGIES
// ============================================================================

export const SHOW_DONT_TELL_SHORT_FORM_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_short_minimum_viable_scene',
    type: 'expert_guidance',
    title: 'Minimum Viable Scene (40-80 words)',
    author: 'MIT Admissions/Essay Expert Synthesis',
    author_title: 'Short-Form Essay Research',
    publication: 'Short Essay Mastery Guide',
    date: '2024-01',
    quote: "The minimum viable scene in 40-80 words needs: (1) One concrete action or moment, (2) One sensory detail that grounds the reader, (3) One specific proper noun or number, (4) Clear stakes or emotion, (5) Implicit (not stated) significance. Example: 'At 2 AM, Sam shook my tent awake for our Mount St. Helens ascent. My knee throbbed with each step up the volcano's flank. Six hours later, wind burning my cheeks at the crater's edge, I understood: uncomfortable things create good outcomes.'",
    relevance_to_claim: 'Provides concrete formula for showing in extremely limited word counts',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['concrete action', 'sensory detail', 'implicit'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['specific proper noun', 'number'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['minimum viable', '40-80 words'] },
      cliche_narrative_arc: { score: 80, aspect: 'solution', keywords_matched: ['stakes', 'Mount St. Helens'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'before_after'],
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
        prompt_types: ['short_answer', 'activity_elaboration'],
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_language', 'cliche_essay_formula', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      max_word_count: 350,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'sdt_short_implication_technique',
    type: 'expert_guidance',
    title: 'Implication Through Juxtaposition',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Show Don\'t Tell Guide',
    date: '2024-01',
    quote: "Short essays demand implication through juxtaposition. Detail + Action = Character Trait: 'I checked the water levels twice daily, watched for movement through the glass, talked to the eggs.' Before/After Juxtaposition: 'In ninth grade I subsisted on PopTarts. Now: eggs over easy, Greek yogurt with honey, turkey bacon—and I've roped my brother into this routine.'",
    relevance_to_claim: 'Specific technique for showing character and growth without stating it',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['implication', 'juxtaposition', 'detail + action'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['before/after', 'growth'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['PopTarts', 'Greek yogurt', 'specific'] },
      cliche_narrative_arc: { score: 85, aspect: 'solution', keywords_matched: ['character trait'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['specificity', 'narrative_structure'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
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
        prompt_types: ['short_answer', 'activity_elaboration', 'personal_statement'],
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_inspirational', 'cliche_language', 'cliche_narrative_arc'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      max_word_count: 400,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 6: ADVANCED TECHNIQUES
// ============================================================================

export const SHOW_DONT_TELL_ADVANCED_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'sdt_advanced_iceberg_theory',
    type: 'literary_principle',
    title: 'Hemingway\'s Iceberg Theory',
    author: 'Ernest Hemingway',
    author_title: 'Nobel Prize-Winning Author',
    publication: 'Death in the Afternoon',
    date: '1932-01',
    quote: "I always try to write on the principle of the iceberg. There is seven-eighths of it underwater for every part that shows. Anything you know you can eliminate and it only strengthens your iceberg.",
    relevance_to_claim: 'Show only the tip; let readers infer the depth—especially powerful in short essays',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 95, aspect: 'principle', keywords_matched: ['iceberg', 'eliminate', 'underwater'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['eliminate', 'strengthens'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['seven-eighths', 'underwater'] },
      cliche_language: { score: 80, aspect: 'solution', keywords_matched: ['eliminate'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure'],
      teaching_moment_types: ['principle_explanation', 'elite_example'],
      essay_section_relevance: ['throughout'],
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
        issue_types: ['telling_not_showing', 'cliche_inspirational', 'cliche_essay_formula', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'principle',
    advice_type: 'principle',
  },

  {
    source_id: 'sdt_advanced_internal_external',
    type: 'expert_guidance',
    title: 'Internal-External Correspondence',
    author: 'Mara Eller',
    author_title: 'Narrative Structure Expert',
    publication: 'Internal and External Change in Writing',
    date: '2023-05',
    quote: "Every story operates on two levels: internal and external. The external is the plot. The internal is the character's emotional/psychological journey. Show internal transformation through external action: instead of 'I became more confident,' show volunteering to answer first in class when you previously waited for others.",
    relevance_to_claim: 'Specific technique for demonstrating psychological growth without stating it',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      telling_not_showing: { score: 100, aspect: 'solution', keywords_matched: ['internal-external', 'show through action'] },
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['instead of', 'I became more confident'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['transformation', 'journey'] },
      cliche_language: { score: 85, aspect: 'solution', keywords_matched: ['external action'] },
    },

    taxonomy: {
      primary_category: 'showing_vs_telling',
      secondary_categories: ['narrative_structure', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['telling_not_showing', 'cliche_inspirational', 'cliche_narrative_arc', 'cliche_language'],
      },
      never_use_for: {
        prompt_types: ['short_answer'], // Too complex for very short essays
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
    source_id: 'sdt_advanced_growth_propensity',
    type: 'expert_guidance',
    title: 'Showing Growth Propensity, Not Just Growth',
    author: 'Daniel Berkowitz',
    author_title: 'LinkedIn Career Advisor',
    publication: 'Demonstrating Growth in Essays',
    date: '2023-08',
    quote: "Colleges ask about growth not to assess if you're emotionally ready for college, but to gauge how much you'll benefit from investments they put into fostering opportunities. Instead of showing one instance of growth, show the PATTERN of seeking growth: realized disinterest → changed major → extracted meta-lesson → applied to new situations.",
    relevance_to_claim: 'Advanced technique: show learning-about-learning, not just lessons learned',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'solution', keywords_matched: ['pattern of seeking growth', 'meta-lesson'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['instead of', 'pattern'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['growth propensity', 'applied'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['gauge how much', 'investments'] },
    },

    taxonomy: {
      primary_category: 'vulnerability',
      secondary_categories: ['showing_vs_telling', 'intellectual_vitality'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation', 'elite_example'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['personal_statement', 'challenge_setback', 'personal_growth', 'belief_challenged'],
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'telling_not_showing', 'cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    context_requirements: {
      min_word_count: 400,
      requires_reflection: true,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export const ALL_SHOW_DONT_TELL_SOURCES: EnhancedLabeledSource[] = [
  ...SHOW_DONT_TELL_AO_SOURCES,
  ...SHOW_DONT_TELL_FRAMEWORK_SOURCES,
  ...SHOW_DONT_TELL_NEURO_SOURCES,
  ...SHOW_DONT_TELL_CONTEXT_SOURCES,
  ...SHOW_DONT_TELL_SHORT_FORM_SOURCES,
  ...SHOW_DONT_TELL_ADVANCED_SOURCES,
];

/**
 * Get all Show Don't Tell sources
 */
export function getShowDontTellSources(): EnhancedLabeledSource[] {
  return ALL_SHOW_DONT_TELL_SOURCES;
}

/**
 * Get source count by category
 */
export function getShowDontTellStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {
    ao_quotes: SHOW_DONT_TELL_AO_SOURCES.length,
    frameworks: SHOW_DONT_TELL_FRAMEWORK_SOURCES.length,
    neuroscience: SHOW_DONT_TELL_NEURO_SOURCES.length,
    context: SHOW_DONT_TELL_CONTEXT_SOURCES.length,
    short_form: SHOW_DONT_TELL_SHORT_FORM_SOURCES.length,
    advanced: SHOW_DONT_TELL_ADVANCED_SOURCES.length,
  };

  return {
    total: ALL_SHOW_DONT_TELL_SOURCES.length,
    byCategory,
  };
}
