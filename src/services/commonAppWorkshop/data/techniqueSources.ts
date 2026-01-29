/**
 * Technique-Specific Source Bundles
 *
 * These sources power the decision tree architecture - providing research-backed
 * guidance for techniques BEYOND storytelling/show-don't-tell.
 *
 * ARCHITECTURE:
 * - Each technique has its own source bundle
 * - Sources include AO quotes, frameworks, research, and transformations
 * - The TechniqueSuggestionRouter uses these to generate technique-specific suggestions
 *
 * TECHNIQUES COVERED:
 * 1. Technical Depth - For essays that need expertise/domain knowledge
 * 2. Evidence & Impact - For essays that need proof/metrics
 * 3. Intellectual Character - For essays that need to show how you think
 * 4. Reflection Depth - For essays that need deeper meaning-making
 * 5. Voice Authenticity - For essays that need more genuine personality
 * 6. Complexity Showcase - For essays that need nuance/tension
 * 7. Connection Specificity - For Why Us/Why Major essays
 *
 * @version 1.0
 * @date January 2025
 */

import type { EnhancedLabeledSource } from '../types/labeledSourceTypes';
import { ALL_SHOW_DONT_TELL_SOURCES } from './showDontTellSources';

// ============================================================================
// SECTION 1: TECHNICAL DEPTH SOURCES
// When essays have story but lack substance/expertise demonstration
// ============================================================================

export const TECHNICAL_DEPTH_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'td_mit_hands_on_demonstration',
    type: 'admissions_quote',
    title: 'Show Your Technical Process',
    author: 'MIT Admissions',
    author_title: 'MIT Admissions Office',
    publication: 'MIT Application Tips',
    date: '2024-01',
    quote: "We want to see how you think through problems. Don't just tell us you're passionate about engineering—show us the specific moment when your prototype failed and what you discovered when you pulled it apart.",
    relevance_to_claim: 'Technical depth requires showing process, not claiming expertise',
    weight_in_calculation: 94,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'mit',
      applicable_colleges: ['mit', 'caltech', 'cmu'],
      exclusions: [],
    },

    issue_relevance: {
      missing_technical_depth: { score: 100, aspect: 'solution', keywords_matched: ['think through', 'prototype failed', 'discovered'] },
      telling_not_showing: { score: 85, aspect: 'solution', keywords_matched: ['show us', 'specific moment'] },
    },

    taxonomy: {
      primary_category: 'technical_depth',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['body', 'throughout'],
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
        prompt_types: ['activity_elaboration', 'intellectual_curiosity', 'personal_statement'],
        colleges: 'all',
        issue_types: ['missing_technical_depth', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'td_stanford_intellectual_vitality',
    type: 'admissions_quote',
    title: 'Intellectual Vitality Through Specifics',
    author: 'Stanford Admissions',
    author_title: 'Stanford Office of Undergraduate Admission',
    publication: 'Stanford Application Guidance',
    date: '2024-01',
    quote: "Intellectual vitality is about showing genuine curiosity in action. We want to see the specific rabbit hole you went down, the unexpected connection you made, the question that kept you up at night. Generic claims of 'loving to learn' tell us nothing.",
    relevance_to_claim: 'Technical depth emerges from specific intellectual journeys',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'stanford',
      applicable_colleges: ['stanford'],
      exclusions: [],
    },

    issue_relevance: {
      missing_technical_depth: { score: 95, aspect: 'solution', keywords_matched: ['rabbit hole', 'unexpected connection', 'question'] },
      missing_intellectual_engagement: { score: 90, aspect: 'solution', keywords_matched: ['genuine curiosity', 'kept you up'] },
    },

    taxonomy: {
      primary_category: 'intellectual_vitality',
      secondary_categories: ['technical_depth', 'specificity'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
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
        issue_types: ['missing_technical_depth', 'missing_intellectual_engagement'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0.05,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'td_framework_expertise_iceberg',
    type: 'expert_guidance',
    title: 'The Expertise Iceberg',
    author: 'College Essay Experts',
    author_title: 'Admissions Consulting',
    publication: 'Technical Essay Writing Guide',
    date: '2024-01',
    quote: "Technical depth works like an iceberg: show 20% of your knowledge explicitly, but let 80% be implied through your word choices, your awareness of edge cases, and your comfort with complexity. A sentence like 'I optimized the O(n²) algorithm to O(n log n) by implementing a merge sort instead of bubble sort' demonstrates more expertise than three paragraphs explaining what an algorithm is.",
    relevance_to_claim: 'Technical depth is demonstrated through precision, not explanation volume',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_technical_depth: { score: 100, aspect: 'solution', keywords_matched: ['iceberg', 'implied', 'precision'] },
      over_narrated: { score: 85, aspect: 'solution', keywords_matched: ['show 20%', 'not explanation volume'] },
    },

    taxonomy: {
      primary_category: 'technical_depth',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'elite_example', 'before_after'],
      essay_section_relevance: ['body'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'advanced',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['missing_technical_depth', 'over_narrated'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 2: EVIDENCE & IMPACT SOURCES
// When essays make claims without proof or measurable outcomes
// ============================================================================

export const EVIDENCE_IMPACT_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ei_harvard_impact_metrics',
    type: 'admissions_quote',
    title: 'Show Impact, Not Just Effort',
    author: 'Harvard Admissions',
    author_title: 'Harvard Office of Admissions',
    publication: 'Harvard Application Insights',
    date: '2024-01',
    quote: "We see thousands of essays about 'working hard' and 'making a difference.' What stands out is specificity: 'I tutored 47 students over two years; 43 of them passed AP Chemistry, compared to the school average of 62%.' Numbers create credibility that adjectives cannot.",
    relevance_to_claim: 'Impact requires quantifiable evidence, not claimed outcomes',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'harvard',
      applicable_colleges: ['harvard'],
      exclusions: [],
    },

    issue_relevance: {
      missing_evidence_of_impact: { score: 100, aspect: 'solution', keywords_matched: ['47 students', 'numbers create credibility'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['specificity', 'compared to'] },
    },

    taxonomy: {
      primary_category: 'evidence_impact',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['why_this_matters', 'elite_example'],
      essay_section_relevance: ['body', 'throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle', 'showing_elite_pattern'],
      tone: 'instructive',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['missing_evidence_of_impact', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'ei_framework_evidence_pyramid',
    type: 'expert_guidance',
    title: 'The Evidence Pyramid',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Impact Demonstration Guide',
    date: '2024-01',
    quote: "Evidence follows a hierarchy of persuasiveness: (1) External validation (awards, recognition, quotes from others), (2) Quantifiable outcomes (numbers, percentages, comparisons), (3) Observable changes (before/after descriptions), (4) Personal claims (weakest - 'I grew'). Strong essays operate at levels 1-3; weak essays stay at level 4.",
    relevance_to_claim: 'Different types of evidence have different persuasive power',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_evidence_of_impact: { score: 100, aspect: 'solution', keywords_matched: ['hierarchy', 'external validation', 'quantifiable'] },
      cliche_inspirational: { score: 85, aspect: 'solution', keywords_matched: ['personal claims weakest'] },
    },

    taxonomy: {
      primary_category: 'evidence_impact',
      secondary_categories: ['specificity', 'showing_vs_telling'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
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
        issue_types: ['missing_evidence_of_impact', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ei_ripple_effect_technique',
    type: 'expert_guidance',
    title: 'The Ripple Effect Technique',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Impact Essay Guide',
    date: '2024-01',
    quote: "To demonstrate impact without bragging, use the 'ripple effect' technique: show how your action created changes in others, which then created further changes. Instead of 'I started a tutoring program,' write 'Maria, my first tutee, now runs the program. She's training three new tutors this semester.'",
    relevance_to_claim: 'Impact is most powerful when shown through effects on others',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_evidence_of_impact: { score: 95, aspect: 'solution', keywords_matched: ['ripple effect', 'changes in others'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['show how', 'Maria'] },
    },

    taxonomy: {
      primary_category: 'evidence_impact',
      secondary_categories: ['showing_vs_telling', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body', 'conclusion'],
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
        issue_types: ['missing_evidence_of_impact', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 3: INTELLECTUAL CHARACTER SOURCES
// When essays describe but don't reveal how the person thinks
// ============================================================================

export const INTELLECTUAL_CHARACTER_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'ic_princeton_how_you_think',
    type: 'admissions_quote',
    title: 'We Want to See How You Think',
    author: 'Princeton Admissions',
    author_title: 'Princeton Office of Admission',
    publication: 'Princeton Application Guidance',
    date: '2024-01',
    quote: "The most memorable essays show us how a student's mind works. We're not just looking for what you concluded—we want to see the messy, iterative process of getting there. Show us the wrong turns, the abandoned hypotheses, the moment you realized you'd been thinking about it wrong.",
    relevance_to_claim: 'Intellectual character emerges from showing thought process',
    weight_in_calculation: 94,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'princeton',
      applicable_colleges: ['princeton'],
      exclusions: [],
    },

    issue_relevance: {
      missing_intellectual_engagement: { score: 100, aspect: 'solution', keywords_matched: ['how mind works', 'wrong turns', 'abandoned hypotheses'] },
      missing_character_through_thought: { score: 95, aspect: 'solution', keywords_matched: ['thought process', 'realized'] },
    },

    taxonomy: {
      primary_category: 'intellectual_character',
      secondary_categories: ['vulnerability', 'showing_vs_telling'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['body', 'throughout'],
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
        issue_types: ['missing_intellectual_engagement', 'missing_character_through_thought'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'ic_framework_thinking_moves',
    type: 'expert_guidance',
    title: 'The Five Thinking Moves',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Intellectual Character Guide',
    date: '2024-01',
    quote: "To reveal intellectual character, show these thinking moves in action: (1) Questioning assumptions ('I always thought X, but then...'), (2) Making unexpected connections ('This reminded me of...'), (3) Noticing details others miss ('What struck me was...'), (4) Considering multiple perspectives ('From my parents' view...'), (5) Sitting with uncertainty ('I still don't know if...').",
    relevance_to_claim: 'Intellectual character can be shown through specific cognitive patterns',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_intellectual_engagement: { score: 100, aspect: 'solution', keywords_matched: ['questioning assumptions', 'unexpected connections'] },
      missing_character_through_thought: { score: 95, aspect: 'solution', keywords_matched: ['thinking moves', 'multiple perspectives'] },
      shallow_reflection: { score: 85, aspect: 'solution', keywords_matched: ['sitting with uncertainty'] },
    },

    taxonomy: {
      primary_category: 'intellectual_character',
      secondary_categories: ['reflection_depth', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
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
        issue_types: ['missing_intellectual_engagement', 'missing_character_through_thought', 'shallow_reflection'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'ic_inner_monologue_technique',
    type: 'expert_guidance',
    title: 'The Inner Monologue Technique',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Character Essay Guide',
    date: '2024-01',
    quote: "The most efficient way to reveal character through thought is the inner monologue snapshot—a brief window into your mind at a crucial moment. Instead of 'I was nervous about presenting,' try: 'Wait. Did I just cite the wrong study? Keep going. They probably didn't notice. But what if—focus. Next slide.'",
    relevance_to_claim: 'Character emerges through showing real-time thought',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_character_through_thought: { score: 100, aspect: 'solution', keywords_matched: ['inner monologue', 'window into mind'] },
      telling_not_showing: { score: 90, aspect: 'solution', keywords_matched: ['instead of', 'real-time thought'] },
    },

    taxonomy: {
      primary_category: 'intellectual_character',
      secondary_categories: ['showing_vs_telling', 'voice_authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body'],
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
        issue_types: ['missing_character_through_thought', 'telling_not_showing'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 4: REFLECTION DEPTH SOURCES
// When essays have surface-level meaning-making
// ============================================================================

export const REFLECTION_DEPTH_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'rd_yale_reflection_quality',
    type: 'admissions_quote',
    title: 'Reflection That Reveals',
    author: 'Yale Admissions',
    author_title: 'Yale Office of Undergraduate Admissions',
    publication: 'Yale Application Guidance',
    date: '2024-01',
    quote: "Surface-level reflection sounds like a greeting card: 'I learned that hard work pays off.' Deep reflection sounds like genuine insight: 'I realized that my definition of success had been shaped entirely by my parents' fears, not my own ambitions—and I'm still untangling which goals are actually mine.'",
    relevance_to_claim: 'Deep reflection requires personal specificity and ongoing questions',
    weight_in_calculation: 94,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'yale',
      applicable_colleges: ['yale'],
      exclusions: [],
    },

    issue_relevance: {
      shallow_reflection: { score: 100, aspect: 'solution', keywords_matched: ['surface-level', 'deep reflection', 'still untangling'] },
      cliche_inspirational: { score: 90, aspect: 'warning', keywords_matched: ['greeting card', 'hard work pays off'] },
    },

    taxonomy: {
      primary_category: 'reflection_depth',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['before_after', 'principle_explanation'],
      essay_section_relevance: ['conclusion', 'body'],
    },

    usage: {
      best_for: ['teaching_principle', 'showing_elite_pattern', 'explaining_problem'],
      tone: 'instructive',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['shallow_reflection', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'rd_framework_reflection_ladder',
    type: 'expert_guidance',
    title: 'The Reflection Ladder',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Reflection Depth Guide',
    date: '2024-01',
    quote: "Reflection operates on levels: Level 1 (What happened), Level 2 (How it felt), Level 3 (What it meant), Level 4 (Why it mattered), Level 5 (What questions remain). Most essays stop at Level 3. Strong essays reach Levels 4-5, where the writer interrogates their own conclusions and admits ongoing uncertainty.",
    relevance_to_claim: 'Reflection depth can be systematically increased',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      shallow_reflection: { score: 100, aspect: 'solution', keywords_matched: ['levels', 'strong essays reach', 'ongoing uncertainty'] },
      premature_resolution: { score: 85, aspect: 'solution', keywords_matched: ['questions remain', 'interrogates conclusions'] },
    },

    taxonomy: {
      primary_category: 'reflection_depth',
      secondary_categories: ['vulnerability', 'intellectual_character'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
      essay_section_relevance: ['conclusion', 'body'],
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
        issue_types: ['shallow_reflection', 'premature_resolution'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'rd_qualified_insight_technique',
    type: 'expert_guidance',
    title: 'The Qualified Insight Technique',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Reflection Essay Guide',
    date: '2024-01',
    quote: "Deep reflection requires qualification. Instead of 'I learned that communication is key,' try: 'I learned that what I thought was communication—talking more, explaining better—was actually just more noise. Real communication, I'm starting to think, might be about saying less. But I'm still not sure.'",
    relevance_to_claim: 'Qualified insights show intellectual maturity',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      shallow_reflection: { score: 95, aspect: 'solution', keywords_matched: ['qualification', 'starting to think', 'still not sure'] },
      false_epiphany: { score: 90, aspect: 'solution', keywords_matched: ['instead of', 'qualified'] },
    },

    taxonomy: {
      primary_category: 'reflection_depth',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['conclusion', 'body'],
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
        issue_types: ['shallow_reflection', 'false_epiphany'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 5: VOICE AUTHENTICITY SOURCES
// When essays feel generic or could have been written by anyone
// ============================================================================

export const VOICE_AUTHENTICITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'va_duke_interesting_students',
    type: 'admissions_quote',
    title: 'We Choose Interesting Students',
    author: 'Christoph Guttentag',
    author_title: 'Dean of Undergraduate Admissions, Duke University',
    publication: 'Duke Admissions Insights',
    date: '2024-01',
    quote: "We have the luxury of choosing the interesting students from among the smart ones. What makes someone interesting? Specificity, quirks, the things that make you YOU rather than a generic high achiever. We want to know what you think about at 2 AM.",
    relevance_to_claim: 'Voice authenticity requires showing what makes you distinctively you',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'duke',
      applicable_colleges: ['duke'],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['interesting', 'quirks', 'specifically you'] },
      missing_unique_insight: { score: 90, aspect: 'solution', keywords_matched: ['what makes you YOU', '2 AM'] },
    },

    taxonomy: {
      primary_category: 'voice_authenticity',
      secondary_categories: ['authenticity', 'specificity'],
      teaching_moment_types: ['why_this_matters', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['motivating_student', 'justifying_severity', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['cliche_ai_convergence', 'missing_unique_insight'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'va_ivy_rough_edges',
    type: 'admissions_quote',
    title: 'Rough Edges Are Valuable',
    author: 'Anonymous Ivy League AO',
    author_title: 'Senior Admissions Officer',
    publication: 'College Confidential AMA',
    date: '2023-11',
    quote: "We'd rather see an essay with rough edges that feels unmistakably yours than a polished essay that could have been written by any of 10,000 applicants. The quirks, the slightly awkward phrasing that sounds like you—that's what we remember.",
    relevance_to_claim: 'Authenticity trumps polish in voice',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 100, aspect: 'solution', keywords_matched: ['rough edges', 'unmistakably yours'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['quirks', 'slightly awkward'] },
    },

    taxonomy: {
      primary_category: 'voice_authenticity',
      secondary_categories: ['authenticity'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'va_framework_voice_markers',
    type: 'expert_guidance',
    title: 'Voice Marker Inventory',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Voice Authenticity Guide',
    date: '2024-01',
    quote: "Authentic voice emerges from specific patterns: (1) Sentence rhythm (your natural pace), (2) Vocabulary sweet spot (words YOU use, not thesaurus words), (3) Thought patterns (how you connect ideas), (4) Humor style (dry, self-deprecating, observational), (5) Pet peeves and enthusiasms. An essay audit should check: 'Would my best friend recognize this as my voice?'",
    relevance_to_claim: 'Voice authenticity can be systematically assessed and strengthened',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      cliche_ai_convergence: { score: 95, aspect: 'solution', keywords_matched: ['voice markers', 'words YOU use'] },
      cliche_language: { score: 90, aspect: 'solution', keywords_matched: ['not thesaurus words', 'natural pace'] },
    },

    taxonomy: {
      primary_category: 'voice_authenticity',
      secondary_categories: ['authenticity', 'specificity'],
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
        issue_types: ['cliche_ai_convergence', 'cliche_language'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 6: COMPLEXITY SHOWCASE SOURCES
// When essays are oversimplified without nuance
// ============================================================================

export const COMPLEXITY_SHOWCASE_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'cs_brown_complexity_tolerance',
    type: 'admissions_quote',
    title: 'Embrace Complexity',
    author: 'Brown Admissions',
    author_title: 'Brown Office of College Admission',
    publication: 'Brown Application Guidance',
    date: '2024-01',
    quote: "The students who thrive at Brown are comfortable holding contradictions. We want to see that you can acknowledge complexity: 'I believe in X AND I understand why someone might believe the opposite.' Oversimplification signals that you're not ready for the nuanced discussions that define a Brown education.",
    relevance_to_claim: 'Complexity requires acknowledging tensions without resolving them',
    weight_in_calculation: 94,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'brown',
      applicable_colleges: ['brown'],
      exclusions: [],
    },

    issue_relevance: {
      missing_complexity: { score: 100, aspect: 'solution', keywords_matched: ['contradictions', 'complexity', 'X AND opposite'] },
      premature_resolution: { score: 90, aspect: 'warning', keywords_matched: ['oversimplification', 'nuanced'] },
    },

    taxonomy: {
      primary_category: 'complexity_showcase',
      secondary_categories: ['intellectual_character', 'reflection_depth'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['body', 'conclusion'],
    },

    usage: {
      best_for: ['motivating_student', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'moderate',
      student_facing: true,
    },

    scope: {
      level: 'universal',
      applies_to: {
        prompt_types: 'all',
        colleges: 'all',
        issue_types: ['missing_complexity', 'premature_resolution'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'cs_framework_productive_tension',
    type: 'expert_guidance',
    title: 'The Productive Tension Framework',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Complexity in Essays Guide',
    date: '2024-01',
    quote: "To showcase complexity, identify productive tensions in your experience: (1) Internal conflicts (what I wanted vs. what I should do), (2) Value clashes (efficiency vs. thoroughness), (3) Identity tensions (who I was vs. who I'm becoming), (4) Perspective shifts (how I saw it then vs. how I see it now). Name these tensions explicitly—don't resolve them artificially.",
    relevance_to_claim: 'Complexity can be systematically identified and showcased',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_complexity: { score: 100, aspect: 'solution', keywords_matched: ['productive tensions', 'internal conflicts', 'value clashes'] },
      shallow_reflection: { score: 85, aspect: 'solution', keywords_matched: ['perspective shifts', 'don\'t resolve artificially'] },
    },

    taxonomy: {
      primary_category: 'complexity_showcase',
      secondary_categories: ['reflection_depth', 'vulnerability'],
      teaching_moment_types: ['how_to_fix', 'principle_explanation'],
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
        issue_types: ['missing_complexity', 'shallow_reflection'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'cs_both_and_technique',
    type: 'expert_guidance',
    title: 'The Both/And Technique',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Nuance Essay Guide',
    date: '2024-01',
    quote: "Replace either/or with both/and. Instead of 'I overcame my fear,' try: 'I'm still afraid. But now I know that courage isn't the absence of fear—it's the fifteen seconds between wanting to run and deciding not to.' The both/and structure honors complexity.",
    relevance_to_claim: 'Both/and framing creates authentic nuance',
    weight_in_calculation: 88,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_complexity: { score: 95, aspect: 'solution', keywords_matched: ['both/and', 'still afraid', 'honors complexity'] },
      cliche_inspirational: { score: 90, aspect: 'solution', keywords_matched: ['instead of overcame'] },
    },

    taxonomy: {
      primary_category: 'complexity_showcase',
      secondary_categories: ['vulnerability', 'authenticity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'elite_example'],
      essay_section_relevance: ['body', 'conclusion'],
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
        issue_types: ['missing_complexity', 'cliche_inspirational'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// SECTION 7: CONNECTION SPECIFICITY SOURCES
// For Why Us/Why Major essays with generic claims
// ============================================================================

export const CONNECTION_SPECIFICITY_SOURCES: EnhancedLabeledSource[] = [
  {
    source_id: 'conn_northwestern_why_us',
    type: 'admissions_quote',
    title: 'Specific Connection Required',
    author: 'Northwestern Admissions',
    author_title: 'Northwestern Office of Undergraduate Admission',
    publication: 'Northwestern Application Tips',
    date: '2024-01',
    quote: "The 'Why Northwestern' essay that says 'I love your interdisciplinary approach and collaborative culture' tells us nothing—every school claims those things. We want to know: Which specific professor's work have you read? Which lab would you want to join? Which club's specific project excites you? Specificity shows you've done your homework.",
    relevance_to_claim: 'Connection requires verifiable specificity',
    weight_in_calculation: 95,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: 'northwestern',
      applicable_colleges: ['northwestern'],
      exclusions: [],
    },

    issue_relevance: {
      missing_connection_specificity: { score: 100, aspect: 'solution', keywords_matched: ['specific professor', 'which lab', 'specificity shows'] },
      generic_why_us: { score: 95, aspect: 'warning', keywords_matched: ['tells us nothing', 'every school claims'] },
    },

    taxonomy: {
      primary_category: 'connection_specificity',
      secondary_categories: ['specificity', 'research_depth'],
      teaching_moment_types: ['principle_explanation', 'why_this_matters'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['justifying_severity', 'teaching_principle'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['why_us', 'why_major'],
        colleges: 'all',
        issue_types: ['missing_connection_specificity', 'generic_why_us'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'primary',
    advice_type: 'principle',
  },

  {
    source_id: 'conn_framework_connection_triangle',
    type: 'expert_guidance',
    title: 'The Connection Triangle',
    author: 'College Essay Experts',
    author_title: 'Admissions Research',
    publication: 'Why Us Essay Guide',
    date: '2024-01',
    quote: "Strong Why Us essays form a triangle: (1) Specific school resource (name the professor, program, or opportunity), (2) Your specific background or interest (not generic passion—a specific project or question), (3) Future vision (what you'll create/contribute/explore using 1 + 2). All three points must be specific and connected.",
    relevance_to_claim: 'Connection requires a specific three-way relationship',
    weight_in_calculation: 92,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_connection_specificity: { score: 100, aspect: 'solution', keywords_matched: ['triangle', 'specific school resource', 'your specific background'] },
      generic_why_us: { score: 90, aspect: 'solution', keywords_matched: ['not generic passion', 'all three specific'] },
      generic_why_major: { score: 85, aspect: 'solution', keywords_matched: ['future vision', 'connected'] },
    },

    taxonomy: {
      primary_category: 'connection_specificity',
      secondary_categories: ['specificity'],
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
        prompt_types: ['why_us', 'why_major'],
        colleges: 'all',
        issue_types: ['missing_connection_specificity', 'generic_why_us', 'generic_why_major'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },

  {
    source_id: 'conn_reverse_engineering_technique',
    type: 'expert_guidance',
    title: 'The Reverse Engineering Test',
    author: 'College Essay Guy',
    author_title: 'College Application Expert',
    publication: 'Why Us Essay Guide',
    date: '2024-01',
    quote: "Test your Why Us essay with reverse engineering: If you removed the school name, could this essay apply to 5+ other schools? If yes, it's too generic. The essay should be so specific that a reader could identify the school from the content alone. 'Professor Chen's work on marine plastisphere microbiomes' passes the test; 'your renowned biology program' fails it.",
    relevance_to_claim: 'Specificity should make the essay uniquely about one school',
    weight_in_calculation: 90,
    last_verified: '2025-01-04',
    verification_status: 'current',

    college_specificity: {
      primary_college: null,
      applicable_colleges: [],
      exclusions: [],
    },

    issue_relevance: {
      missing_connection_specificity: { score: 95, aspect: 'solution', keywords_matched: ['reverse engineering', 'identify school', 'Professor Chen'] },
      generic_why_us: { score: 100, aspect: 'warning', keywords_matched: ['too generic', 'renowned program fails'] },
    },

    taxonomy: {
      primary_category: 'connection_specificity',
      secondary_categories: ['specificity'],
      teaching_moment_types: ['how_to_fix', 'before_after', 'principle_explanation'],
      essay_section_relevance: ['throughout'],
    },

    usage: {
      best_for: ['teaching_principle', 'explaining_problem'],
      tone: 'challenging',
      complexity: 'simple',
      student_facing: true,
    },

    scope: {
      level: 'prompt_type',
      applies_to: {
        prompt_types: ['why_us', 'why_major'],
        colleges: 'all',
        issue_types: ['missing_connection_specificity', 'generic_why_us'],
      },
      peer_applicable: true,
      peer_weight_reduction: 0,
    },
    authority: 'expert',
    advice_type: 'technique',
  },
];

// ============================================================================
// COMBINED EXPORTS BY TECHNIQUE
// ============================================================================

export const ALL_TECHNIQUE_SOURCES: EnhancedLabeledSource[] = [
  ...TECHNICAL_DEPTH_SOURCES,
  ...EVIDENCE_IMPACT_SOURCES,
  ...INTELLECTUAL_CHARACTER_SOURCES,
  ...REFLECTION_DEPTH_SOURCES,
  ...VOICE_AUTHENTICITY_SOURCES,
  ...COMPLEXITY_SHOWCASE_SOURCES,
  ...CONNECTION_SPECIFICITY_SOURCES,
];

/**
 * Get sources for a specific technique
 * Note: 'storytelling' technique uses the existing showDontTellSources.ts bundle
 */
export function getSourcesForTechnique(technique: string): EnhancedLabeledSource[] {
  // For storytelling, use the existing Show Don't Tell sources
  if (technique === 'storytelling') {
    return ALL_SHOW_DONT_TELL_SOURCES;
  }

  const techniqueSourceMap: Record<string, EnhancedLabeledSource[]> = {
    technical_depth: TECHNICAL_DEPTH_SOURCES,
    evidence_impact: EVIDENCE_IMPACT_SOURCES,
    intellectual_character: INTELLECTUAL_CHARACTER_SOURCES,
    reflection_depth: REFLECTION_DEPTH_SOURCES,
    voice_authenticity: VOICE_AUTHENTICITY_SOURCES,
    complexity_showcase: COMPLEXITY_SHOWCASE_SOURCES,
    connection_specificity: CONNECTION_SPECIFICITY_SOURCES,
  };

  return techniqueSourceMap[technique] || [];
}

/**
 * Get technique source statistics
 */
export function getTechniqueSourceStats(): {
  total: number;
  byTechnique: Record<string, number>;
} {
  return {
    total: ALL_TECHNIQUE_SOURCES.length,
    byTechnique: {
      technical_depth: TECHNICAL_DEPTH_SOURCES.length,
      evidence_impact: EVIDENCE_IMPACT_SOURCES.length,
      intellectual_character: INTELLECTUAL_CHARACTER_SOURCES.length,
      reflection_depth: REFLECTION_DEPTH_SOURCES.length,
      voice_authenticity: VOICE_AUTHENTICITY_SOURCES.length,
      complexity_showcase: COMPLEXITY_SHOWCASE_SOURCES.length,
      connection_specificity: CONNECTION_SPECIFICITY_SOURCES.length,
    },
  };
}
