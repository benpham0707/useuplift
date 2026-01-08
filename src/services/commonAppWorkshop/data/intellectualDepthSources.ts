/**
 * Intellectual Depth & Nuanced Thinking Deep Research Sources
 *
 * EXTRACTED FROM: Perplexity Deep Research on "Intellectual Depth and Nuanced Thinking in Elite College Essays" (January 2025)
 *
 * KEY CATEGORIES:
 * 1. Institutional Frameworks (Stanford IV, MIT, Harvard definitions)
 * 2. Complexity & Nuance (Paradox, ambiguity, perspective shifting)
 * 3. Critical Thinking Markers (Self-questioning, counterarguments)
 * 4. Systems-Level Thinking (Individual vs systemic awareness)
 * 5. Interesting vs Impressive (Duke Dean framework)
 * 6. Performative Intelligence Red Flags (Thesaurus problem, formulaic depth)
 *
 * KEY INSIGHT: Intellectual vitality is the primary differentiator at elite schools.
 * Stanford's separate IV rating rejects 69% of perfect SAT scorers.
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';

// ============================================================================
// SECTION 1: INSTITUTIONAL FRAMEWORKS
// ============================================================================

export const INSTITUTIONAL_FRAMEWORK_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_stanford_iv_separate',
    type: 'admissions_quote',
    title: 'Stanford Separate IV Rating',
    author: 'Stanford Admissions',
    author_title: 'NovaScholar Analysis',
    publication: 'Insights on Intellectual Vitality',
    date: '2024-01',
    quote: "Stanford uniquely employs a dedicated 'Intellectual Vitality (IV)' rating independent of academic metrics. This criterion is used specifically to 'weed out countless 4.0 students who lack a true love of learning'. 69% of applicants with perfect SAT scores didn't get in—the differentiating factor is intellectual vitality.",
    relevance_to_claim: 'IV is a separate evaluation category that trumps academic metrics',
    weight_in_calculation: 98,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['true love of learning', 'intellectual vitality'] },
      cliche_inspirational: { score: 90, aspect: 'principle', keywords_matched: ['4.0 students', 'differentiating factor'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['ooze from file'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'justifying_severity', 'motivating_student'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['Stanford'],
        issue_types: ['cliche_ai_convergence', 'cliche_inspirational', 'telling_not_showing'],
      },
      peer_applicable: false,
      peer_weight_reduction: 30,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'id_stanford_iv_definition',
    type: 'admissions_quote',
    title: 'Stanford IV Official Definition',
    author: 'Stanford Admissions Office',
    author_title: 'Accepted.com Analysis',
    publication: 'What Does Stanford Look For',
    date: '2024-01',
    quote: "Stanford defines intellectual vitality as 'your commitment, dedication, and genuine interest in expanding your intellectual horizons'—evidence of 'a truly thinking mind'.",
    relevance_to_claim: 'Official Stanford definition of what they seek',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['genuine interest', 'expanding horizons'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['truly thinking mind'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['commitment', 'dedication'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'proving_weight'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['Stanford'],
        issue_types: ['cliche_inspirational', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 20,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'id_iq_vs_vitality',
    type: 'admissions_quote',
    title: 'IQ vs Intellectual Vitality',
    author: 'Former Stanford Dean of Admissions',
    author_title: 'Stanford GSB Analysis',
    publication: 'Understanding Intellectual Vitality',
    date: '2024-01',
    quote: "A person of average IQ may have enormous intellectual vitality, while a person with a stratospheric IQ may have scant intellectual vitality.",
    relevance_to_claim: 'Intelligence does not equal intellectual vitality',
    weight_in_calculation: 96,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'principle', keywords_matched: ['intellectual vitality', 'IQ'] },
      cliche_value_signaling: { score: 90, aspect: 'principle', keywords_matched: ['average', 'enormous'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['stratospheric', 'scant'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['why_this_matters', 'what_to_avoid'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'motivating_student', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'id_mit_dean_schmill',
    type: 'admissions_quote',
    title: 'MIT Dean on Intellectual Vitality',
    author: 'Stu Schmill',
    author_title: 'MIT Dean of Admissions',
    publication: 'Forbes & MIT Admissions',
    date: '2024-11',
    quote: "MIT seeks students who 'embody intellectual vitality and demonstrate a passion for exploring the unknown—traits that transcend test scores and titles'. MIT wants students who 'pursue the things that interest them with energy and enthusiasm'.",
    relevance_to_claim: 'MIT prioritizes exploration over credentials',
    weight_in_calculation: 97,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'MIT',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 98, aspect: 'principle', keywords_matched: ['exploring the unknown', 'transcend test scores'] },
      cliche_inspirational: { score: 90, aspect: 'principle', keywords_matched: ['energy and enthusiasm'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['pursue things that interest them'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'teaching_principle', 'motivating_student'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['MIT'],
        issue_types: ['cliche_ai_convergence', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 10,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'id_harvard_khurana_initiative',
    type: 'admissions_quote',
    title: 'Harvard Intellectual Vitality Initiative',
    author: 'Dean Rakesh Khurana',
    author_title: 'Dean of Harvard College',
    publication: 'Harvard Intellectual Vitality Initiative',
    date: '2023-01',
    quote: "Intellectual vitality is 'a spirit of open and rigorous inquiry' requiring 'humility, respect, and genuine curiosity toward each other'. It 'embraces intellectual exploration, engagement with competing views, and reconsideration of foundational assumptions about the world'.",
    relevance_to_claim: 'Harvard institutional definition emphasizes humility and competing views',
    weight_in_calculation: 96,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Harvard',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['open and rigorous inquiry'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['humility', 'respect', 'curiosity'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['competing views', 'reconsideration'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['vulnerability', 'intellectual_community'],
      teaching_moment_types: ['principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'proving_weight'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['Harvard'],
        issue_types: ['cliche_ai_convergence', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 10,
    },
    authority: 'primary',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 2: COMPLEXITY & NUANCE
// ============================================================================

export const COMPLEXITY_NUANCE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_paradox_framework',
    type: 'expert_guidance',
    title: 'Comfort with Ambiguity',
    author: 'Premier College Guide',
    author_title: 'Essay Analysis Expert',
    publication: 'What AOs Really Look For',
    date: '2024-01',
    quote: "Successful essays demonstrate comfort with ambiguity rather than forcing resolution. Essays that 'don't tell you what to feel—they allow you to feel it' create memorable impact through layered imagery.",
    relevance_to_claim: 'Ambiguity is a strength, not weakness',
    weight_in_calculation: 92,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'solution', keywords_matched: ['comfort with ambiguity', 'forcing resolution'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['layered imagery', 'allow you to feel'] },
      telling_not_showing: { score: 95, aspect: 'solution', keywords_matched: ['don\'t tell you what to feel'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['showing_vs_telling', 'fresh_perspective'],
      teaching_moment_types: ['how_to_fix', 'elite_example'],
      essay_section_relevance: ['body', 'conclusion'],
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
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_premature_resolution',
    type: 'admissions_quote',
    title: 'Avoid Premature Resolution',
    author: 'Stanford Admissions Officer',
    author_title: 'Essay Reader',
    publication: 'Accepted.com Analysis',
    date: '2024-01',
    quote: "Rather than concluding with simplistic lessons, strong essays leave space for ongoing questions. Essays should show 'you've wrestled with hard questions' without needing to 'have all the answers'.",
    relevance_to_claim: 'Don\'t force neat conclusions',
    weight_in_calculation: 94,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 100, aspect: 'solution', keywords_matched: ['simplistic lessons', 'ongoing questions'] },
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['wrestled with hard questions'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['have all the answers'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'vulnerability'],
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
        issue_types: ['cliche_narrative_arc', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'technique',
  },

  {
    source_id: 'id_perspective_shifting',
    type: 'expert_guidance',
    title: 'Multi-Dimensional Analysis',
    author: 'Cornell Knight Institute',
    author_title: 'Writing Program',
    publication: 'Developing Deeper Analysis',
    date: '2024-01',
    quote: "Perspective shifting examines issues 'as an engineer, as a person of color, as a first-generation student' to reveal multi-dimensional analysis. Use qualified claims like 'This is often true, except when...' to add depth and honesty.",
    relevance_to_claim: 'Multiple lenses demonstrate sophisticated thinking',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['perspective shifting', 'multi-dimensional'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['qualified claims', 'depth and honesty'] },
      telling_not_showing: { score: 80, aspect: 'solution', keywords_matched: ['often true, except when'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['fresh_perspective', 'specificity'],
      teaching_moment_types: ['how_to_fix'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_nonlinear_storytelling',
    type: 'expert_guidance',
    title: 'Non-Linear Structure',
    author: 'LinkedIn Essay Guide',
    author_title: 'Advanced Essay Tips',
    publication: '20 Advanced Tips for College Essays',
    date: '2024-01',
    quote: "Non-linear storytelling—starting with the ending, then looping back to explain intellectual evolution—creates more engaging narratives than chronological recounting.",
    relevance_to_claim: 'Structure can demonstrate intellectual sophistication',
    weight_in_calculation: 85,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['non-linear', 'intellectual evolution'] },
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['chronological recounting'] },
      telling_not_showing: { score: 80, aspect: 'solution', keywords_matched: ['engaging narratives'] },
    },

    taxonomy: {
      primary_category: 'narrative_structure',
      secondary_categories: ['intellectual_vitality', 'fresh_perspective'],
      teaching_moment_types: ['how_to_fix'],
      essay_section_relevance: ['introduction', 'throughout'],
    },

    usage: {
      best_for: ['teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_narrative_arc', 'cliche_essay_formula'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 3: CRITICAL THINKING MARKERS
// ============================================================================

export const CRITICAL_THINKING_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_self_questioning',
    type: 'expert_guidance',
    title: 'Explicit Doubt Signals Growth',
    author: 'EssayHell',
    author_title: 'Essay Coaching Expert',
    publication: 'Dig Deep: How to Add Depth',
    date: '2015-09',
    quote: "Explicit doubt signals intellectual growth. Phrases like 'I used to believe X, but then...' and 'It took me a while, but I now suspect that...' show genuine evolution rather than performed certainty.",
    relevance_to_claim: 'Doubt is a marker of intellectual growth',
    weight_in_calculation: 91,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['I used to believe', 'genuine evolution'] },
      cliche_narrative_arc: { score: 90, aspect: 'solution', keywords_matched: ['performed certainty'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['I now suspect'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after'],
      essay_section_relevance: ['body'],
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
        issue_types: ['cliche_inspirational', 'cliche_narrative_arc', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_counterargument_integration',
    type: 'expert_guidance',
    title: 'Fair Counterarguments',
    author: 'Cornell Knight Institute',
    author_title: 'Writing Program',
    publication: 'Developing Deeper Analysis',
    date: '2024-01',
    quote: "Critical thinking requires summarizing opposing views fairly before explaining one's position, and acknowledging limitations: 'This approach works for Y, but may not apply to Z because...'",
    relevance_to_claim: 'Intellectual honesty about limitations',
    weight_in_calculation: 89,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['opposing views fairly', 'acknowledging limitations'] },
      cliche_value_signaling: { score: 85, aspect: 'solution', keywords_matched: ['may not apply'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['critical thinking'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
      teaching_moment_types: ['how_to_fix'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_attribution_not_autonomy',
    type: 'expert_guidance',
    title: 'Attribute Influences',
    author: 'Harvard Writing Center',
    author_title: 'Writing Resource',
    publication: 'Examplit Harvard Essays',
    date: '2024-01',
    quote: "Attribute perspective shifts to specific influences (books, conversations, experiences) rather than claiming autonomous brilliance. This shows intellectual humility while demonstrating growth.",
    relevance_to_claim: 'Credit your teachers and influences',
    weight_in_calculation: 88,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['specific influences', 'intellectual humility'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['autonomous brilliance'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['books, conversations, experiences'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['vulnerability', 'impact_on_others'],
      teaching_moment_types: ['how_to_fix', 'what_to_avoid'],
      essay_section_relevance: ['body'],
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
        issue_types: ['cliche_inspirational', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_trigger_work_integration',
    type: 'expert_guidance',
    title: 'Three-Part Change Process',
    author: 'Examplit',
    author_title: 'Harvard Essay Analysis',
    publication: 'Harvard Application Essays',
    date: '2024-01',
    quote: "Show the PROCESS of change: (1) Trigger—what specific evidence challenged prior beliefs? (2) Cognitive work—how did you engage with contradictory information? (3) Integration—how does this changed perspective influence current thinking?",
    relevance_to_claim: 'Framework for showing intellectual growth',
    weight_in_calculation: 93,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'solution', keywords_matched: ['process of change', 'trigger', 'cognitive work'] },
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['challenged prior beliefs', 'integration'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['specific evidence', 'contradictory information'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['showing_vs_telling', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'before_after'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem', 'giving_before_after'],
      tone: 'instructive',
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

  {
    source_id: 'id_failure_of_understanding',
    type: 'expert_guidance',
    title: 'Epistemic vs Practical Failure',
    author: 'Harvard Essay Analysis',
    author_title: 'EssayMaster',
    publication: 'Intellectual Curiosity Essays',
    date: '2024-01',
    quote: "Admissions officers distinguish between 'failure of action' (I tried and failed) and 'failure of understanding' (I realized my mental model was wrong). The latter demonstrates greater intellectual maturity.",
    relevance_to_claim: 'Epistemic failure > practical failure',
    weight_in_calculation: 94,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'solution', keywords_matched: ['failure of understanding', 'mental model was wrong'] },
      cliche_narrative_arc: { score: 95, aspect: 'solution', keywords_matched: ['failure of action', 'intellectual maturity'] },
      telling_not_showing: { score: 85, aspect: 'principle', keywords_matched: ['I realized'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['vulnerability', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters', 'before_after'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle', 'proving_weight', 'justifying_severity'],
      tone: 'instructive',
      complexity: 'advanced',
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
    authority: 'expert',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 4: SYSTEMS-LEVEL THINKING
// ============================================================================

export const SYSTEMS_THINKING_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_individual_vs_systemic',
    type: 'expert_guidance',
    title: 'Individual vs Systemic Awareness',
    author: 'NovaScholar',
    author_title: 'Application Research',
    publication: 'Framing Your Application',
    date: '2024-01',
    quote: "Weak essays remain at the individual level: 'I worked hard and succeeded.' Strong essays demonstrate systems awareness: 'I noticed that my school's STEM resources were unevenly distributed, so I created a peer-tutoring network that addressed the structural gap while learning about educational equity.'",
    relevance_to_claim: 'Connect personal to systemic patterns',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 100, aspect: 'solution', keywords_matched: ['worked hard and succeeded', 'systems awareness'] },
      cliche_value_signaling: { score: 95, aspect: 'solution', keywords_matched: ['structural gap', 'educational equity'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['I noticed', 'I created'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['impact_on_others', 'fresh_perspective'],
      teaching_moment_types: ['before_after', 'how_to_fix'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['giving_before_after', 'teaching_principle', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_inspirational', 'cliche_value_signaling', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_historical_situating',
    type: 'expert_guidance',
    title: 'Historical and Social Context',
    author: 'Premier College Guide',
    author_title: 'Essay Analysis',
    publication: 'What AOs Really Look For',
    date: '2024-01',
    quote: "Strong essays place personal narratives within larger structural forces (economic, political, cultural), showing awareness that individual experiences are 'shaped by systems larger than oneself'.",
    relevance_to_claim: 'Context your story in larger forces',
    weight_in_calculation: 88,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['structural forces', 'systems larger than oneself'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['personal narratives', 'awareness'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['economic, political, cultural'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['fresh_perspective', 'specificity'],
      teaching_moment_types: ['how_to_fix'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_value_signaling', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'id_mit_purposeful_deviation',
    type: 'admissions_quote',
    title: 'MIT Purposeful Deviation',
    author: 'MIT Admissions',
    author_title: 'CollegeVine Analysis',
    publication: 'How to Write MIT Essays',
    date: '2024-01',
    quote: "MIT's prompt about 'doing something different than what was expected' explicitly rewards students who recognize and challenge systemic constraints. One successful applicant described rejecting a prestigious but superficial summer program to pursue independent research on a local environmental issue, showing awareness of what truly constituted valuable learning.",
    relevance_to_claim: 'Purposeful deviation from expectations shows systems thinking',
    weight_in_calculation: 93,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'MIT',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_inspirational: { score: 95, aspect: 'solution', keywords_matched: ['something different', 'challenge systemic constraints'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['prestigious but superficial', 'valuable learning'] },
      cliche_essay_formula: { score: 85, aspect: 'solution', keywords_matched: ['independent research'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['elite_example'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['giving_elite_example', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['MIT'],
        issue_types: ['cliche_inspirational', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 15,
    },
    authority: 'primary',
    advice_type: 'example',
  },
];

// ============================================================================
// SECTION 5: INTERESTING VS IMPRESSIVE
// ============================================================================

export const INTERESTING_VS_IMPRESSIVE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_duke_guttentag_interesting',
    type: 'admissions_quote',
    title: 'Duke Dean: Interesting vs Smart',
    author: 'Christoph Guttentag',
    author_title: 'Former Duke Dean of Admissions',
    publication: 'Sarah Arberson Blog',
    date: '2024-01',
    quote: "We have the luxury of choosing the interesting students from among the smart ones.",
    relevance_to_claim: 'At elite schools, interesting beats impressive',
    weight_in_calculation: 97,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Duke',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'principle', keywords_matched: ['interesting students', 'smart ones'] },
      cliche_essay_formula: { score: 95, aspect: 'principle', keywords_matched: ['choosing', 'luxury'] },
      cliche_value_signaling: { score: 90, aspect: 'principle', keywords_matched: ['interesting'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'motivating_student', 'justifying_severity'],
      tone: 'direct',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_essay_formula', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'id_impressive_vs_interesting_markers',
    type: 'expert_guidance',
    title: 'Impressive vs Interesting Markers',
    author: 'Examplit',
    author_title: 'Harvard Essay Analysis',
    publication: 'Harvard Essays Examples',
    date: '2024-01',
    quote: "'Impressive' essays list achievements with sophisticated vocabulary, demonstrate mastery of expected material, follow conventional structures, and risk sounding like 'a carefully constructed persona'. 'Interesting' essays reveal distinctive perspective, show willingness to challenge assumptions, contain unexpected connections, and demonstrate intellectual initiative beyond classroom.",
    relevance_to_claim: 'Specific markers for each category',
    weight_in_calculation: 92,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'solution', keywords_matched: ['constructed persona', 'distinctive perspective'] },
      cliche_essay_formula: { score: 95, aspect: 'solution', keywords_matched: ['conventional structures', 'unexpected connections'] },
      cliche_value_signaling: { score: 90, aspect: 'solution', keywords_matched: ['challenge assumptions', 'intellectual initiative'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['what_to_avoid', 'how_to_fix'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_essay_formula', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'id_stanford_iv_ooze',
    type: 'admissions_quote',
    title: 'IV Must Ooze from File',
    author: 'Dr. Irena Smith',
    author_title: 'Former Stanford Admissions Officer',
    publication: 'Emerging Consulting',
    date: '2024-01',
    quote: "Intellectual vitality must ooze from the file. The admissions committee specifically looks for students who 'take significant responsibility for your own learning process'.",
    relevance_to_claim: 'IV should be evident everywhere, not just one essay',
    weight_in_calculation: 94,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'principle', keywords_matched: ['intellectual vitality', 'ooze'] },
      cliche_inspirational: { score: 90, aspect: 'principle', keywords_matched: ['responsibility', 'learning process'] },
      cliche_essay_formula: { score: 85, aspect: 'principle', keywords_matched: ['from the file'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['proving_weight', 'teaching_principle'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'college_specific',
      applies_to: {
        prompt_types: 'all',
        colleges: ['Stanford'],
        issue_types: ['cliche_ai_convergence', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 10,
    },
    authority: 'primary',
    advice_type: 'principle',
  },
];

// ============================================================================
// SECTION 6: PERFORMATIVE INTELLIGENCE RED FLAGS
// ============================================================================

export const PERFORMATIVE_INTELLIGENCE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'id_thesaurus_problem',
    type: 'expert_guidance',
    title: 'The Thesaurus Problem',
    author: 'Premier College Guide',
    author_title: 'Essay Analysis',
    publication: 'What AOs Really Look For',
    date: '2024-01',
    quote: "The 'Thesaurus Problem': Using complex vocabulary unnaturally, like 'I possess an insatiable epistemological hunger' instead of 'I love learning'. Dropping philosophical terms without showing genuine engagement. Overly formal tone that obscures authentic voice.",
    relevance_to_claim: 'Complex vocabulary signals insecurity, not depth',
    weight_in_calculation: 95,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'problem', keywords_matched: ['insatiable epistemological hunger', 'philosophical terms'] },
      cliche_language: { score: 95, aspect: 'problem', keywords_matched: ['complex vocabulary unnaturally', 'overly formal'] },
      telling_not_showing: { score: 85, aspect: 'problem', keywords_matched: ['obscures authentic voice'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['intellectual_vitality', 'showing_vs_telling'],
      teaching_moment_types: ['what_to_avoid', 'before_after'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['explaining_problem', 'giving_before_after'],
      tone: 'direct',
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
    source_id: 'id_formulaic_depth',
    type: 'expert_guidance',
    title: 'Formulaic Depth Red Flags',
    author: 'Admissions Analysis',
    author_title: 'Essay Expert',
    publication: 'Elite Essay Patterns',
    date: '2024-01',
    quote: "Red flags for formulaic depth: Forced 'big idea' connections that feel superficial. Listing books without explaining their intellectual impact. Using quotes as substitutes for original thinking.",
    relevance_to_claim: 'Name-dropping isn\'t intellectual engagement',
    weight_in_calculation: 90,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'problem', keywords_matched: ['forced big idea', 'superficial'] },
      cliche_value_signaling: { score: 90, aspect: 'problem', keywords_matched: ['listing books', 'using quotes'] },
      telling_not_showing: { score: 85, aspect: 'problem', keywords_matched: ['substitutes for original thinking'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['what_to_avoid'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['explaining_problem'],
      tone: 'direct',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'cliche_value_signaling'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'warning',
  },

  {
    source_id: 'id_simple_language_mastery',
    type: 'expert_guidance',
    title: 'Clarity Demonstrates Mastery',
    author: 'AdmitStudio',
    author_title: 'MIT Essay Guide',
    publication: 'MIT Essay Guidance 2025',
    date: '2024-01',
    quote: "Clarity demonstrates mastery. 'Don't try to impress with jargon or broad statements like \"I love math\" or \"engineering solves problems.\" Instead, root your response in something real.'",
    relevance_to_claim: 'Simple language signals deeper understanding',
    weight_in_calculation: 91,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'MIT',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['clarity demonstrates mastery', 'something real'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['jargon', 'broad statements'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['root your response'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['intellectual_vitality', 'specificity'],
      teaching_moment_types: ['principle_explanation', 'how_to_fix'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'id_stanford_think_not_words',
    type: 'admissions_quote',
    title: 'Think, Don\'t Use Big Words',
    author: 'Accepted Stanford Student',
    author_title: 'Student Perspective',
    publication: 'YouTube Interview',
    date: '2024-01',
    quote: "Intellectual vitality means 'they want you to really think about things' rather than 'use big words'. Admissions officers read thousands of essays and can distinguish genuine voice from constructed persona.",
    relevance_to_claim: 'Student perspective on what IV really means',
    weight_in_calculation: 87,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['really think', 'big words'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['genuine voice', 'constructed persona'] },
      telling_not_showing: { score: 80, aspect: 'principle', keywords_matched: ['thousands of essays'] },
    },

    taxonomy: {
      primary_category: 'authenticity',
      secondary_categories: ['intellectual_vitality'],
      teaching_moment_types: ['principle_explanation'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'principle',
  },

  {
    source_id: 'id_authenticity_intellect_intersection',
    type: 'expert_guidance',
    title: 'IV is Energetic, Not Ponderous',
    author: 'Stanford GSB Guide',
    author_title: 'Accepted.com',
    publication: 'Understanding IV at Stanford GSB',
    date: '2024-01',
    quote: "Intellectual vitality is 'a thrill' that 'scintillates others'—it's energetic and engaging, not ponderous. A student passionate about Dance Dance Revolution described mastering it through 'creative, exciting, and intellectual' analysis, making a seemingly trivial activity reveal genuine curiosity.",
    relevance_to_claim: 'Even "trivial" topics can show IV if approached genuinely',
    weight_in_calculation: 89,
    last_verified: '2025-01-06',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'Stanford',
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_topic_framing: { score: 100, aspect: 'solution', keywords_matched: ['seemingly trivial activity', 'genuine curiosity'] },
      cliche_ai_convergence: { score: 90, aspect: 'solution', keywords_matched: ['energetic and engaging', 'not ponderous'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['thrill', 'scintillates'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['authenticity', 'fresh_perspective'],
      teaching_moment_types: ['elite_example'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['giving_elite_example', 'motivating_student'],
      tone: 'supportive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_topic_framing', 'cliche_ai_convergence'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'example',
  },
];

// ============================================================================
// AGGREGATED EXPORTS
// ============================================================================

export const ALL_INTELLECTUAL_DEPTH_SOURCES: EnhancedLabeledSource[] = [
  ...INSTITUTIONAL_FRAMEWORK_SOURCES,
  ...COMPLEXITY_NUANCE_SOURCES,
  ...CRITICAL_THINKING_SOURCES,
  ...SYSTEMS_THINKING_SOURCES,
  ...INTERESTING_VS_IMPRESSIVE_SOURCES,
  ...PERFORMATIVE_INTELLIGENCE_SOURCES,
];

// Export count for validation
export const INTELLECTUAL_DEPTH_SOURCE_COUNT = ALL_INTELLECTUAL_DEPTH_SOURCES.length;
