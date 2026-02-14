// @ts-nocheck
/**
 * Research-Backed Teaching Service
 *
 * THE MISSING BRIDGE: This service transforms pattern detection into knowledge-based teaching
 * by leveraging our 124+ deep research sources to provide:
 *
 * 1. WHY - Research-backed explanations of why something matters
 * 2. HOW - Technique bundles with concrete approaches from experts
 * 3. EVIDENCE - Admissions officer quotes and research findings
 * 4. EXAMPLES - Before/after transformations grounded in principles
 *
 * This service is the consumer of our source infrastructure (SourceIndexer, EnhancedSourceRouter)
 * and makes the knowledge ACTIONABLE in feedback generation.
 *
 * @version 1.0
 * @date January 2025
 */

import { getSourceIndexer } from './sourceIndexer';
import { LABELED_SOURCES, getSourceById, getLabeledSourceStats } from '../data/labeledSources';
import type { LabeledSource, EnhancedLabeledSource } from '../types/labeledSourceTypes';
import { ALL_ENHANCED_DEEP_RESEARCH_SOURCES, getSourcesByBatch } from '../data/sourceRegistry';
import {
  getDeepFeedbackJustification,
  getEssayEditingImportance,
  getQuickStats,
} from '../data/counselingIndustryInsights';

// ============================================================================
// TYPES
// ============================================================================

export type IssueType =
  | 'telling_not_showing'
  | 'cliche_language'
  | 'cliche_inspirational'
  | 'cliche_ai_convergence'
  | 'cliche_narrative_arc'
  | 'cliche_value_signaling'
  | 'cliche_topic_framing'
  | 'cliche_essay_formula'
  | 'performative_intelligence'
  | 'premature_resolution'
  | 'missing_systems_awareness'
  | 'passive_victim_framing'
  | 'strategic_vulnerability'
  | 'false_epiphany'
  // Additional types for technique description lookup
  | 'image_renovation'
  | 'incremental_revelation'
  // NEW: Opening & Ending guidance
  | 'weak_opening'
  | 'weak_ending'
  // NEW: Supplemental essay types
  | 'generic_why_us'
  | 'generic_why_major'
  | 'activity_listing'
  // NEW: Structure & Organization
  | 'weak_structure'
  | 'weak_transitions'
  // NEW: Non-narrative gaps (for nuanced guidance beyond storytelling)
  | 'missing_technical_depth'        // Has story but no substance/expertise
  | 'missing_unique_insight'         // Generic takeaways anyone could have
  | 'missing_evidence_of_impact'     // Claims without proof/metrics
  | 'missing_intellectual_engagement' // Describes but doesn't analyze
  | 'over_narrated'                  // Story where evidence would be stronger
  | 'missing_character_through_thought' // Actions but no revealed thinking
  | 'shallow_reflection'             // Surface-level meaning-making
  | 'missing_complexity'             // Oversimplified, no nuance
  | 'missing_connection_specificity'; // Generic school/major fit claims

export type TeachingMomentType =
  | 'why_this_matters'
  | 'how_to_fix'
  | 'principle_explanation'
  | 'what_to_avoid'
  | 'before_after'
  | 'elite_example';

export interface ResearchBackedTeaching {
  issue_type: IssueType;

  // WHY this matters - research-backed explanation
  why_section: {
    summary: string;
    research_insight: string;
    sources: SourceCitation[];
    admissions_perspective?: string;
    psychology_insight?: string;
  };

  // HOW to fix it - technique bundle
  techniques: TechniqueBundle[];

  // EVIDENCE - supporting sources
  evidence: {
    primary_sources: SourceCitation[];
    supporting_quotes: string[];
    institution_specific?: Record<string, SourceCitation[]>;
  };

  // EXAMPLES - before/after transformations
  transformations: TransformationExample[];
}

export interface SourceCitation {
  source_id: string;
  quote: string;
  author: string;
  context: string;
  authority: 'primary' | 'expert' | 'research';
  teaching_moment_type: TeachingMomentType;
}

export interface TechniqueBundle {
  name: string;
  description: string;
  steps: string[];
  source_backing: SourceCitation;
  difficulty: 'simple' | 'moderate' | 'advanced';
  common_mistakes: string[];
}

export interface TransformationExample {
  before: string;
  after: string;
  principle_applied: string;
  why_it_works: string;
  source_reference?: string;
}

// ============================================================================
// TEACHING KNOWLEDGE BASE
// Consolidates research into actionable teaching bundles
// ============================================================================

/**
 * Maps issue types to their teaching knowledge bundles
 * This is where research becomes functional expertise
 */
const TEACHING_KNOWLEDGE_BASE: Record<string, {
  core_principle: string;
  why_matters_template: string;
  technique_categories: string[];
  related_source_ids: string[];
  transformations: TransformationExample[];
}> = {
  telling_not_showing: {
    core_principle: 'Readers experience emotions through concrete details, not abstract claims. When you SHOW, admissions officers feel your story; when you TELL, they only hear about it.',
    why_matters_template: 'Neuroscience research shows that concrete sensory details activate mirror neurons, creating empathy. Abstract claims ("I learned resilience") bypass this emotional circuitry entirely. MIT admissions officers report that essays with specific scenes are 3x more memorable than essays with general statements.',
    technique_categories: ['sensory_details', 'scene_construction', 'moment_freezing', 'dialogue_inclusion'],
    related_source_ids: [
      'sdt_ao_mit_peterson',
      'sdt_framework_five_craft_moves',
      'sdt_neuro_mirror_neurons',
      'sdt_sensory_activation',
      'sdt_transformation_telling_to_showing',
    ],
    transformations: [
      {
        before: 'This experience taught me resilience.',
        after: 'I still dry-heave before every speech. But now I walk to the podium anyway, feeling my heartbeat in my fingertips as I grip the lectern.',
        principle_applied: 'Show ongoing struggle through physical sensation',
        why_it_works: 'The reader FEELS the anxiety through concrete detail, rather than being told the narrator is resilient. The "still" shows ongoing struggle, which is more authentic than claiming transformation.',
      },
      {
        before: 'I became more compassionate after volunteering.',
        after: 'Mrs. Chen\'s hands shake when she pours tea. I\'ve learned to hold my cup steady underneath hers.',
        principle_applied: 'Show character through small action',
        why_it_works: 'A single specific action demonstrates compassion more powerfully than claiming the quality. The detail ("shake when she pours tea") creates intimacy.',
      },
      {
        before: 'I was nervous but determined to succeed.',
        after: 'The gym door was heavier than I remembered. I pulled twice before it opened, then pretended I meant to.',
        principle_applied: 'Replace emotional labels with observable behavior',
        why_it_works: 'The heavy door and the pretending show vulnerability and determination without naming either. The small lie ("pretended I meant to") adds authenticity.',
      },
    ],
  },

  cliche_ai_convergence: {
    core_principle: 'AI-generated language creates "convergence zones" where thousands of essays sound identical. Your authentic voice is your differentiator.',
    why_matters_template: 'Duke\'s former Dean Guttentag: "We have the luxury of choosing the interesting students from among the smart ones." When essays use AI convergence phrases, they sound like everyone else. Admissions officers read 30+ essays daily - distinctive voice is survival.',
    technique_categories: ['voice_preservation', 'specificity_injection', 'vocabulary_authenticity'],
    related_source_ids: [
      'id_duke_guttentag_interesting',
      'id_thesaurus_problem',
      'id_simple_language_mastery',
      'id_stanford_think_not_words',
      'pq_ivy_rough_edges',
    ],
    transformations: [
      {
        before: 'This transformative experience profoundly impacted my multifaceted journey.',
        after: 'I spent three weeks debugging code that turned out to have a single misplaced semicolon.',
        principle_applied: 'Replace abstract elevation with specific mundane detail',
        why_it_works: 'Ivy admissions: "We\'d rather see an essay with rough edges that feels unmistakably yours." The semicolon detail is unmistakably human.',
      },
      {
        before: 'I harbor an insatiable epistemological hunger.',
        after: 'I\'ve read the Wikipedia page for "List of unusual deaths" four times.',
        principle_applied: 'Show curiosity through specific odd behavior',
        why_it_works: 'Stanford: "Intellectual vitality means they want you to really think about things, not use big words." The Wikipedia detail shows curiosity without claiming it.',
      },
      {
        before: 'My passion for STEM has been instrumental in shaping my academic trajectory.',
        after: 'I built a CO2 detector because my chemistry teacher didn\'t believe me about the ventilation in room 204.',
        principle_applied: 'Ground abstract claims in specific rebellion',
        why_it_works: 'The specific room number and the conflict with the teacher are unmistakably yours. No AI would generate "room 204."',
      },
    ],
  },

  cliche_inspirational: {
    core_principle: 'Real growth is messy, incomplete, and ongoing. Claims of total transformation signal inauthenticity.',
    why_matters_template: 'Harvard research shows that "essays claiming complete transformation are less memorable than those showing ongoing complexity." Admissions officers are skeptical of neat endings because they know real personal change doesn\'t work that way.',
    technique_categories: ['complexity_preservation', 'ongoing_struggle', 'qualified_growth'],
    related_source_ids: [
      'ei_earned_vulnerability_test',
      'ei_dartmouth_ao_tmi',
      'id_premature_resolution',
      'id_failure_of_understanding',
      'ei_collegewise_resolution',
    ],
    transformations: [
      {
        before: 'Through this experience, I learned the importance of perseverance and became a completely different person.',
        after: 'I\'m better at this now, mostly. Last week I still almost quit during hour three of debugging. But I noticed myself reaching for my headphones instead of the door.',
        principle_applied: 'Show partial, ongoing growth with specific setback',
        why_it_works: 'The "mostly" and "almost quit" show authentic complexity. The headphones detail grounds it in specific action.',
      },
      {
        before: 'This obstacle made me stronger than ever before.',
        after: 'Some days I still wake up thinking about it. Most days I don\'t. I\'m not sure which days are the healthier ones.',
        principle_applied: 'Show unresolved processing rather than completed healing',
        why_it_works: 'The honest uncertainty ("I\'m not sure") shows mature reflection. Growth doesn\'t mean everything is fixed.',
      },
      {
        before: 'I emerged from this challenge a new person with complete clarity about my future.',
        after: 'I know more than I did. I also know how much I was wrong about. The ratio keeps changing.',
        principle_applied: 'Frame growth as ongoing recalibration, not arrival',
        why_it_works: 'The "ratio keeps changing" acknowledges that understanding evolves. This is more believable than claimed certainty.',
      },
    ],
  },

  performative_intelligence: {
    core_principle: 'Intellectual depth shows through HOW you think, not vocabulary you use. Simple language often signals deeper understanding.',
    why_matters_template: 'Stanford\'s former Dean: "A person of average IQ may have enormous intellectual vitality, while a person with a stratospheric IQ may have scant intellectual vitality." The "thesaurus problem" - using complex vocabulary unnaturally - signals insecurity, not depth.',
    technique_categories: ['clarity_over_complexity', 'thinking_process', 'genuine_questions'],
    related_source_ids: [
      'id_iq_vs_vitality',
      'id_thesaurus_problem',
      'id_stanford_iv_definition',
      'id_trigger_work_integration',
      'id_authenticity_intellect_intersection',
    ],
    transformations: [
      {
        before: 'I possess an insatiable epistemological hunger that perpetually drives my scholarly pursuits.',
        after: 'I spent an hour last night trying to figure out why airplane windows are round. Turns out square windows caused crashes in the 1950s.',
        principle_applied: 'Show genuine curiosity through specific rabbit hole',
        why_it_works: 'The specific question (round windows) and discovered answer demonstrates intellectual vitality without claiming it. The time spent shows genuine engagement.',
      },
      {
        before: 'My critical thinking skills enable me to analyze complex problems from multiple perspectives.',
        after: 'My first instinct was wrong. So was my second. The third one worked, but only because I finally asked my mom why she did it that way in the first place.',
        principle_applied: 'Show the messy process of actual thinking',
        why_it_works: 'Admitting you were wrong twice, then crediting someone else, shows more intellectual maturity than claiming critical thinking.',
      },
      {
        before: 'I excel at synthesizing disparate viewpoints into cohesive understanding.',
        after: 'The paper made sense until I explained it to my friend. Then I realized I\'d only understood the easy parts.',
        principle_applied: 'Demonstrate learning through honest failure recognition',
        why_it_works: 'The gap between reading and explaining is where real understanding lives. This shows metacognition without claiming it.',
      },
    ],
  },

  missing_systems_awareness: {
    core_principle: 'Strong essays connect personal experience to broader structural forces. "I worked hard and succeeded" misses the systems that enabled or constrained choices.',
    why_matters_template: 'Elite colleges seek students who "connect personal experience to broader patterns" - awareness that individual experiences are shaped by systems larger than oneself. Individual-level narratives without systemic context feel incomplete.',
    technique_categories: ['structural_connection', 'pattern_recognition', 'context_expansion'],
    related_source_ids: [
      'id_individual_vs_systemic',
      'id_historical_situating',
      'id_mit_purposeful_deviation',
    ],
    transformations: [
      {
        before: 'I worked hard and succeeded in starting my tutoring program.',
        after: 'I noticed my school\'s STEM resources were unevenly distributed - AP Chemistry had 30 students but one microscope. I started peer tutoring not because I wanted to help, but because I was frustrated that zip codes determined who got to see cells divide.',
        principle_applied: 'Connect personal action to structural observation',
        why_it_works: 'The zip code connection shows systems awareness. The frustration motivation is more honest than altruism claims.',
      },
      {
        before: 'I overcame many obstacles to become the first in my family to apply to college.',
        after: 'My school has 43 guidance counselors. Forty-two of them work with students who already have family college experience. The 43rd has 400 students on her list, including me.',
        principle_applied: 'Quantify the structural barriers instead of just claiming them',
        why_it_works: 'The specific numbers (43, 42, 400) make the structural inequality concrete. This is more powerful than abstract claims of obstacles.',
      },
      {
        before: 'Through hard work and determination, I earned a spot on the varsity team.',
        after: 'My club team costs $3,000 a year. The public league I used to play in shut down three years ago. I wonder sometimes about the kids who were better than me.',
        principle_applied: 'Acknowledge privilege and systemic advantages',
        why_it_works: 'The honesty about cost and the acknowledgment of others shows intellectual maturity beyond "I worked hard."',
      },
    ],
  },

  passive_victim_framing: {
    core_principle: 'Mature reflection shows agency within constraints, not passive suffering. Focus on response and action, not scale of suffering.',
    why_matters_template: 'EI research shows "immature navel-gazing presents self as passive victim rather than active agent." Admissions officers look for evidence of agency - what you DID with your circumstances, not just what happened TO you.',
    technique_categories: ['agency_demonstration', 'response_focus', 'action_over_suffering'],
    related_source_ids: [
      'ei_passive_victim_flag',
      'ei_outward_orientation',
      'ei_processed_vs_raw',
    ],
    transformations: [
      {
        before: 'Nobody understood my pain. I suffered through my parents\' divorce alone.',
        after: 'The night my parents told us, I made mac and cheese for my younger brother. He didn\'t ask why. We watched cartoons until he fell asleep. It became our Thursday thing.',
        principle_applied: 'Show agency through small protective action',
        why_it_works: 'The mac and cheese and "Thursday thing" show response to difficulty rather than claiming suffering. The brother relationship shows impact on others.',
      },
      {
        before: 'My illness robbed me of my junior year. I missed everything.',
        after: 'I learned to do physical therapy exercises while watching lecture recordings. The nurse who saw me most often became my study partner—I helped her with statistics, she helped me walk.',
        principle_applied: 'Transform circumstances into connection and action',
        why_it_works: 'The reciprocal relationship with the nurse shows how difficulty became something other than loss. Agency emerges through adaptation.',
      },
      {
        before: 'Growing up poor meant I never had the opportunities other students had.',
        after: 'Our kitchen table had a wobble. I fixed it by wedging a physics textbook under the short leg. That textbook was the only one I owned, so I learned to read it upside down.',
        principle_applied: 'Show resourcefulness within constraints, not just the constraints',
        why_it_works: 'The upside-down reading shows creative problem-solving. The wobble detail makes the circumstance specific without asking for pity.',
      },
    ],
  },

  strategic_vulnerability: {
    core_principle: 'Announcing authenticity negates it. Vulnerability should emerge organically from the narrative, not be flagged.',
    why_matters_template: 'When vulnerability "appears calculated to check boxes rather than emerging organically from the narrative," it backfires. The moment you say "I\'m going to be vulnerable," you\'ve signaled performance over authenticity.',
    technique_categories: ['organic_revelation', 'earned_vulnerability', 'unannounced_honesty'],
    related_source_ids: [
      'ei_strategic_deployment',
      'ei_timing_inconsistency',
      'ei_earned_vulnerability_test',
    ],
    transformations: [
      {
        before: 'I\'ll be honest - to be vulnerable for a moment - I struggled with anxiety.',
        after: 'My hands shook when I opened the email. They still do, sometimes, when I see that font.',
        principle_applied: 'Show the vulnerability through physical detail, don\'t announce it',
        why_it_works: 'The shaking hands and "still do" reveal vulnerability without claiming it. The font detail adds specificity that makes it real.',
      },
      {
        before: 'I want to share something deeply personal that shaped who I am.',
        after: 'I didn\'t tell anyone for three months. Then I told my dog. Then, eventually, my sister.',
        principle_applied: 'Let the reluctance itself show the weight of the experience',
        why_it_works: 'The sequence (three months, dog, sister) shows the difficulty of sharing without announcing vulnerability. The dog detail humanizes.',
      },
      {
        before: 'Being authentic, I must admit that I often feel like an imposter.',
        after: 'I still check the acceptance letter sometimes. Just to make sure it says my name.',
        principle_applied: 'Show the emotion through specific behavior, not labeled feelings',
        why_it_works: 'The letter-checking is a specific, relatable action that shows imposter feelings without the clinical label.',
      },
    ],
  },

  premature_resolution: {
    core_principle: 'Intellectual depth shows comfort with ambiguity. Forcing neat conclusions undermines the complexity of real growth.',
    why_matters_template: 'Stanford AOs: "Essays should show you\'ve wrestled with hard questions without needing to have all the answers." Premature resolution feels reductive - real intellectual maturity leaves space for ongoing questions.',
    technique_categories: ['open_ending', 'question_preservation', 'complexity_acceptance'],
    related_source_ids: [
      'id_premature_resolution',
      'id_paradox_framework',
      'ei_open_ending_example',
    ],
    transformations: [
      {
        before: 'Through this experience, I learned that hard work always pays off.',
        after: 'I\'m still not sure if persistence or luck got me here. Probably some ratio I\'ll never calculate.',
        principle_applied: 'End with honest uncertainty instead of neat lesson',
        why_it_works: 'The uncertainty ("still not sure") and humor ("ratio I\'ll never calculate") show intellectual maturity. The reader trusts this more than claimed certainty.',
      },
      {
        before: 'Now I understand that failure is always an opportunity for growth.',
        after: 'Sometimes failure is an opportunity. Sometimes it\'s just failure. I\'m getting better at telling the difference, I think.',
        principle_applied: 'Qualify universal claims with honest exceptions',
        why_it_works: 'The "I think" and "Sometimes it\'s just failure" show nuanced thinking. No one believes failure is ALWAYS an opportunity.',
      },
      {
        before: 'This taught me exactly what I want to do with my life.',
        after: 'I have a direction now, which is more than I had before. Whether it\'s the right direction is a question I expect to keep asking.',
        principle_applied: 'Frame conclusions as beginnings, not endings',
        why_it_works: 'The commitment to keep asking shows intellectual humility. "More than I had before" shows growth without overclaiming.',
      },
    ],
  },

  cliche_language: {
    core_principle: 'Clichés signal that the writer grabbed the first available phrase rather than searching for their own words. Every cliché is a missed opportunity to show your unique perspective.',
    why_matters_template: 'Duke\'s Dean Guttentag says they choose "interesting students from among the smart ones." Clichés make you forgettable - they tell admissions officers you reached for the conventional when you could have offered the distinctive. Language choices reveal thinking habits.',
    technique_categories: ['specificity_injection', 'voice_preservation', 'image_renovation'],
    related_source_ids: [
      'id_duke_guttentag_interesting',
      'pq_ivy_rough_edges',
      'id_thesaurus_problem',
      'pq_prose_clarity_signals',
    ],
    transformations: [
      {
        before: 'This was a turning point in my life.',
        after: 'That afternoon split my timeline in two: the version of me who hadn\'t seen the spreadsheet, and the one holding it now.',
        principle_applied: 'Replace abstract cliché with specific concrete moment',
        why_it_works: 'The "spreadsheet" detail grounds the turning point in something real. The two-versions framing shows the writer thinking freshly about a familiar concept.',
      },
      {
        before: 'I learned to step outside my comfort zone.',
        after: 'I learned to sit with the itchy feeling of not knowing the answer for a full class period.',
        principle_applied: 'Make the abstract cliché physically specific',
        why_it_works: 'The "itchy feeling" and "full class period" transform a dead metaphor into a lived experience the reader can feel.',
      },
      {
        before: 'I have a passion for helping others.',
        after: 'I memorized the bus schedule to the food bank before I could drive.',
        principle_applied: 'Replace claimed quality with specific evidence of that quality',
        why_it_works: 'The bus schedule detail proves dedication more powerfully than claiming passion. The "before I could drive" shows timeline without explaining it.',
      },
    ],
  },

  false_epiphany: {
    core_principle: 'Sudden realizations that solve everything are the stuff of fiction, not real life. Authentic growth is incremental, uncertain, and often backslides.',
    why_matters_template: 'Admissions officers distrust "false epiphanies" because they know real insight doesn\'t work like a light switch. When you claim a sudden complete understanding, you signal either dishonesty or lack of self-awareness - neither is attractive.',
    technique_categories: ['incremental_revelation', 'qualified_growth', 'ongoing_struggle'],
    related_source_ids: [
      'id_premature_resolution',
      'ei_earned_vulnerability_test',
      'id_failure_of_understanding',
      'ei_collegewise_resolution',
    ],
    transformations: [
      {
        before: 'In that moment, everything changed. I finally understood what really mattered.',
        after: 'I thought I understood. Six months later, I realized I\'d only understood the easy part.',
        principle_applied: 'Show that understanding unfolds over time, not in a flash',
        why_it_works: 'The "six months later" and "easy part" reveal ongoing complexity. The reader trusts this writer\'s self-awareness.',
      },
      {
        before: 'Suddenly, I knew exactly who I wanted to become.',
        after: 'I\'m starting to have a guess about who I might want to be. Ask me again in a year.',
        principle_applied: 'Replace certainty with honest uncertainty',
        why_it_works: 'The "starting to have a guess" shows intellectual humility. The "ask me again" acknowledges growth is ongoing, not complete.',
      },
      {
        before: 'It hit me like a bolt of lightning—I had found my purpose.',
        after: 'The idea kept coming back. After the third time I found myself thinking about it at 2 AM, I figured it might be worth taking seriously.',
        principle_applied: 'Show purpose emerging through repeated attention, not sudden revelation',
        why_it_works: 'The "third time" and "2 AM" show organic development. Interest builds through persistence, not epiphany.',
      },
    ],
  },

  // ==========================================================================
  // NEW: OPENING HOOKS
  // ==========================================================================
  weak_opening: {
    core_principle: 'Your opening is your audition. Admissions officers often decide within seconds whether an essay will be memorable. The first line should create intrigue, not announce intent.',
    why_matters_template: 'Psychology research on "thin-slicing" shows that first impressions form in milliseconds and color everything that follows. MEK Review notes that openings with famous quotes or dictionary definitions are among the most cliché approaches—they signal that your voice starts second to someone else\'s.',
    technique_categories: ['medias_res', 'sensory_hook', 'dialogue_opener', 'unexpected_detail'],
    related_source_ids: [
      'oh_thin_slicing',
      'oh_hook_types',
      'oh_five_second_test',
      'oh_mek_cliche_openings',
    ],
    transformations: [
      {
        before: 'As Gandhi once said, "Be the change you wish to see in the world."',
        after: 'The sign on my bedroom door says "Knock First"—but it\'s been three years since anyone in my family did.',
        principle_applied: 'Start with YOUR voice and specific detail, not someone else\'s words',
        why_it_works: 'The detail about the knock sign is specific, intriguing, and immediately raises questions. The reader wants to know why.',
      },
      {
        before: 'According to Webster\'s Dictionary, leadership is defined as...',
        after: 'My sister says I have "meeting voice"—the one that comes out when I\'m trying to get seven freshmen to agree on a pizza order.',
        principle_applied: 'Show the quality through a specific, memorable scene',
        why_it_works: 'The "meeting voice" and pizza detail are specific and humanizing. Leadership is shown, not defined.',
      },
      {
        before: 'Ever since I was young, I have been passionate about science.',
        after: 'I was eleven when I dissected my first battery to see what made it work. My mom still hasn\'t forgiven me for the scorch marks.',
        principle_applied: 'Drop readers into a specific moment that reveals the passion',
        why_it_works: 'The battery dissection shows curiosity in action. The scorch marks add humor and consequence.',
      },
    ],
  },

  // ==========================================================================
  // NEW: ESSAY ENDINGS
  // ==========================================================================
  weak_ending: {
    core_principle: 'Psychology\'s "peak-end rule" shows endings disproportionately shape memory. Your conclusion shouldn\'t summarize—it should resonate. The best endings shift scope from specific to universal, or return to your opening with new meaning.',
    why_matters_template: 'Harry Bauld, former Brown admissions officer: "The best endings remember where they came from, without repeating what you\'ve already said." Summary conclusions ("In conclusion, I learned...") are the essay equivalent of explaining a joke—they undermine what came before.',
    technique_categories: ['callback_closure', 'scope_shift', 'resonant_image', 'open_question'],
    related_source_ids: [
      'ee_peak_end_rule',
      'ee_bauld_endings',
      'ee_cincinnati_conclusion',
      'ee_mek_cliche_conclusions',
    ],
    transformations: [
      {
        before: 'In conclusion, this experience taught me the importance of perseverance and hard work.',
        after: 'Last week, my younger brother asked me to help him practice. I showed him the grip I\'d gotten wrong a hundred times—and watched him get it right on the first try.',
        principle_applied: 'End with a specific moment that echoes the journey, not a stated lesson',
        why_it_works: 'The brother scene shows the growth\'s impact. The "hundred times" vs "first try" contrast is powerful without stating the lesson.',
      },
      {
        before: 'I hope to continue developing these skills in college and beyond.',
        after: 'I still check that spreadsheet sometimes. Not because I need the data anymore—because I need to remember the version of me who didn\'t know what to do with it.',
        principle_applied: 'Return to an image from the essay with new perspective',
        why_it_works: 'The callback to "the spreadsheet" (if established earlier) creates closure. The two-versions framing shows growth without claiming it.',
      },
      {
        before: 'This is why I would be a perfect fit for your university.',
        after: 'I don\'t know exactly where this goes. I just know I\'m not done asking questions.',
        principle_applied: 'End with honest uncertainty about the future, not a sales pitch',
        why_it_works: 'The intellectual humility ("don\'t know") paired with commitment ("not done asking") shows maturity without closing the door.',
      },
    ],
  },

  // ==========================================================================
  // NEW: "WHY US" ESSAYS
  // ==========================================================================
  generic_why_us: {
    core_principle: 'The "swap test" is definitive: if you could swap in another school\'s name without changing anything, your essay fails. Genuine fit shows through specific, non-Googleable connections that reveal you\'ve done real research.',
    why_matters_template: 'Admissions officers can tell immediately when you\'ve copy-pasted generic praise. Rick Clark from Georgia Tech: "We want to see that you\'ve done your homework—not about our rankings or campus beauty, but about the specific opportunities that match your specific goals."',
    technique_categories: ['specific_program_connection', 'professor_course_fit', 'non_googleable_detail', 'authentic_why'],
    related_source_ids: [
      'wu_swap_test',
      'wu_specific_fit',
      'wu_research_depth',
      'wu_authentic_connection',
    ],
    transformations: [
      {
        before: 'I want to attend Stanford because of its prestigious reputation and beautiful campus.',
        after: 'Professor X\'s paper on computational linguistics changed how I think about my heritage language. I want to ask her whether the tonal distinctions she found in Cantonese apply to the Toisanese my grandmother speaks.',
        principle_applied: 'Connect a specific program/professor to your specific intellectual question',
        why_it_works: 'The professor reference shows research. The grandmother connection makes it personal. This essay only works for Stanford.',
      },
      {
        before: 'The diverse student body and wide range of majors make your school perfect for me.',
        after: 'I spent an hour on the course catalog finding CS 194: the project course where students build actual products for nonprofits. I\'ve already emailed my robotics club about whether they\'d be a good client.',
        principle_applied: 'Show evidence of deep research through specific courses and concrete action',
        why_it_works: 'The course number, description, and email action demonstrate genuine engagement. Generic schools don\'t have "CS 194."',
      },
      {
        before: 'I would take advantage of all the opportunities your university has to offer.',
        after: 'The Undergraduate Research Opportunities Program lists 47 biology labs. I\'ve read the abstracts from three of them—the one on circadian rhythms in fruit flies is the reason I\'m writing this essay at 2 AM.',
        principle_applied: 'Demonstrate specific research with humor and authenticity',
        why_it_works: 'The "47 labs" and "three abstracts" show real research. The 2 AM joke reveals personality while proving engagement.',
      },
    ],
  },

  // ==========================================================================
  // NEW: "WHY MAJOR" ESSAYS
  // ==========================================================================
  generic_why_major: {
    core_principle: 'Why Major essays fail when they describe the field generally instead of YOUR specific journey to it. The question isn\'t "What is economics?" but "What happened to YOU that made economics feel necessary?"',
    why_matters_template: 'Admissions officers want to see intellectual progression—not a survey of what the major covers, but the questions that led you here and the questions you still have. The best essays show your thinking evolving, not your knowledge of the Wikipedia page.',
    technique_categories: ['origin_moment', 'question_evolution', 'intellectual_progression', 'future_questions'],
    related_source_ids: [
      'wm_intellectual_progression',
      'wm_specific_interest',
      'wm_future_questions',
    ],
    transformations: [
      {
        before: 'I want to study economics because it helps explain how markets work and is useful for many careers.',
        after: 'My first question was why my grandfather\'s store failed while the CVS across the street thrived. That led to supply chains. Supply chains led to game theory. Game theory led to the problem I can\'t stop thinking about: why do people cooperate when defection pays better?',
        principle_applied: 'Show the intellectual journey through specific questions, not field descriptions',
        why_it_works: 'The grandfather\'s store is specific and personal. The question chain shows genuine intellectual progression.',
      },
      {
        before: 'Computer science is the future, and I want to be part of it.',
        after: 'I spent three weeks on a bug that turned out to be a single misplaced bracket. But those three weeks taught me I\'d rather debug for hours than do something I understand on the first try.',
        principle_applied: 'Show what you\'ve learned about yourself through doing the work',
        why_it_works: 'The bracket story demonstrates persistence through specificity. The self-knowledge revelation is authentic.',
      },
      {
        before: 'I am passionate about psychology because I want to understand human behavior.',
        after: 'I started reading psychology papers after my friend told me she was "fine" in a voice that meant she wasn\'t. I wanted words for what I was noticing. Now I want to know why those words sometimes make things worse.',
        principle_applied: 'Ground interest in specific personal stakes, not abstract curiosity',
        why_it_works: 'The "fine" moment is specific and relatable. The question about words making things worse shows nuanced thinking.',
      },
    ],
  },

  // ==========================================================================
  // NEW: EXTRACURRICULAR/ACTIVITY ESSAYS
  // ==========================================================================
  activity_listing: {
    core_principle: 'Activity essays fail when they list accomplishments without revealing what the experience taught you or how you specifically contributed. The question is not "What did you do?" but "Who did you become through doing it?"',
    why_matters_template: 'Admissions officers already have your activity list. The essay should reveal what the list cannot: the moment of doubt, the unexpected lesson, the contribution only YOU could have made. Leadership is shown through specific decisions, not titles.',
    technique_categories: ['specific_contribution', 'pivotal_moment', 'unexpected_lesson', 'growth_through_action'],
    related_source_ids: [
      'act_specific_impact',
      'act_leadership_action',
      'act_growth_moment',
    ],
    transformations: [
      {
        before: 'As president of Model UN, I led our delegation to many conferences and improved my public speaking skills.',
        after: 'My first crisis as chair was a delegate crying in the hallway because her resolution failed. I almost walked past. Then I remembered what it felt like my first year. That conversation lasted forty minutes—longer than any speech I\'ve given.',
        principle_applied: 'Show leadership through a specific human moment, not titles or accomplishments',
        why_it_works: 'The hallway scene reveals character. The "almost walked past" shows honest reflection. The 40 minutes shows real investment.',
      },
      {
        before: 'Through my volunteer work at the hospital, I developed empathy and learned about healthcare.',
        after: 'Mrs. Patterson asked me to hold her hand during her blood draw. I\'m still not sure if it was for her or for me.',
        principle_applied: 'Find the small, specific moment that reveals the real impact',
        why_it_works: 'The hand-holding is specific and vulnerable. The uncertainty ("for her or for me") shows authentic reflection.',
      },
      {
        before: 'Being captain of the swim team taught me leadership and time management.',
        after: 'The hardest practice I ever ran was the one after we lost state. I made them swim the same set as a Tuesday. Nobody asked why. They already knew.',
        principle_applied: 'Show leadership through a specific decision at a pivotal moment',
        why_it_works: 'The "same set as a Tuesday" is specific and reveals philosophy. The "nobody asked" shows earned trust.',
      },
    ],
  },

  // ==========================================================================
  // NEW: STRUCTURE & ORGANIZATION
  // ==========================================================================
  weak_structure: {
    core_principle: 'Strong essays have invisible architecture—the reader never thinks about structure because it serves the story naturally. Weak structure announces itself through chronological trudging, random tangents, or thesis-body-conclusion formula.',
    why_matters_template: 'The best essays often begin near the climax and spiral outward, or use a recurring image as an organizing principle. When structure is working, the reader feels momentum; when it\'s not, they feel lost or bored.',
    technique_categories: ['in_medias_res', 'thematic_threading', 'circular_structure', 'tension_pacing'],
    related_source_ids: [
      'str_nonlinear_narrative',
      'str_scene_summary_balance',
      'str_tension_building',
    ],
    transformations: [
      {
        before: 'When I was six, I started playing piano. By age ten, I was competing. At fourteen, I won my first major award.',
        after: 'The judge\'s pen stopped moving. I was sixteen bars from the end, and I\'d just missed the same F-sharp I\'d missed in practice for three months.',
        principle_applied: 'Start at the point of highest tension, not the chronological beginning',
        why_it_works: 'The frozen judge creates immediate tension. The reader is invested before knowing any context. The F-sharp becomes a thread.',
      },
      {
        before: '[Essay that introduces new topic every paragraph with no connection]',
        after: '[Each paragraph returns to or reframes a central image—the misplaced bracket, the kitchen table, the unread email]',
        principle_applied: 'Use a recurring concrete image to create structural cohesion',
        why_it_works: 'Thematic threading creates unity without formula. Each return to the image adds new meaning.',
      },
      {
        before: 'First, I will discuss my academic achievements. Second, I will describe my extracurricular activities. Finally, I will explain my future goals.',
        after: 'The college brochure arrived the same day we lost power. I read it by flashlight while my mom rationed the food in the fridge.',
        principle_applied: 'Replace signposted structure with scene-based narrative',
        why_it_works: 'The juxtaposition (brochure + power outage) creates natural tension. The reader follows the story, not the outline.',
      },
    ],
  },

  weak_transitions: {
    core_principle: 'Strong transitions create momentum by showing how ideas connect rather than announcing that they do. Weak transitions ("Furthermore," "In addition," "Another example") are signposts for essays without natural flow.',
    why_matters_template: 'When transitions feel forced, it usually means the ideas themselves aren\'t connected—the writer is using conjunctions to glue together unrelated thoughts. The fix isn\'t better transition words; it\'s rethinking what belongs together.',
    technique_categories: ['implicit_connection', 'echo_transition', 'contrast_pivot', 'question_bridge'],
    related_source_ids: [
      'str_invisible_transitions',
      'str_idea_connection',
    ],
    transformations: [
      {
        before: 'Furthermore, another example of my leadership was when I organized the charity event.',
        after: 'But standing alone in the empty gym at 6 AM, I realized that getting people to show up was different from getting them to care.',
        principle_applied: 'Connect ideas through continued narrative, not announcement',
        why_it_works: 'The "But" creates natural contrast. The 6 AM detail continues the story. The insight emerges from the scene.',
      },
      {
        before: 'In addition to my academic achievements, I also have many extracurricular activities.',
        after: 'The same stubbornness that kept me debugging for three hours is why I started the coding club—I needed to find the other people who thought frustration was part of the fun.',
        principle_applied: 'Show how different experiences connect through a unifying insight',
        why_it_works: 'The "same stubbornness" explicitly connects the ideas. The reader sees the through-line in your character.',
      },
      {
        before: 'Moving on to a different topic, I would also like to discuss my passion for music.',
        after: 'Piano taught me the same lesson, actually. You can\'t fake practicing—your hands remember what you did.',
        principle_applied: 'Use thematic echoes to connect different domains',
        why_it_works: 'The "same lesson, actually" creates organic connection. The hands metaphor links different activities through a unifying truth.',
      },
    ],
  },

  // ==========================================================================
  // NON-NARRATIVE GAPS - Beyond Storytelling
  // These issues require techniques OTHER than storytelling to fix
  // ==========================================================================

  missing_technical_depth: {
    core_principle: 'Strong essays about intellectual pursuits demonstrate domain knowledge and process thinking. Generic interest claims ("I love science") fail because they could be written by anyone. True engagement shows through specific methodologies, frameworks, and the messy details of doing the work.',
    why_matters_template: 'Admissions officers at top schools are experts who can distinguish genuine engagement from surface familiarity. Naming a specific methodology, describing a debugging process, or explaining why you chose one approach over another demonstrates you\'ve actually done the work—not just read about it.',
    technique_categories: ['methodology_naming', 'process_description', 'technical_vocabulary', 'problem_solving_narrative'],
    related_source_ids: [
      'wm_intellectual_progression',
      'wm_specific_interest',
      'sdt_ao_mit_peterson',
    ],
    transformations: [
      {
        before: 'I love computer science and have learned a lot about programming.',
        after: 'I implemented a recursive backtracking algorithm for my Sudoku solver, but when n exceeded 16, the call stack depth became prohibitive. Switching to an iterative approach with explicit stack management cut runtime by 80%.',
        principle_applied: 'Show technical depth through specific implementation decisions',
        why_it_works: 'The specifics (recursive backtracking, call stack depth, 80% runtime reduction) demonstrate genuine technical understanding. No one can fake these details.',
      },
      {
        before: 'My research experience taught me about biology and lab work.',
        after: 'After the third failed Western blot, I realized our antibody concentration was optimized for rat tissue, not mouse. Recalibrating took two weeks, but it also taught me why protocols need validation, not just replication.',
        principle_applied: 'Demonstrate learning through specific methodological challenges',
        why_it_works: 'The Western blot detail and the insight about validation vs. replication show genuine lab experience. The failure is more convincing than claimed success.',
      },
      {
        before: 'I am interested in economics and want to study it further.',
        after: 'Running a regression on our school\'s test score data, I noticed multicollinearity between parental education and income. This forced me to think about what we really mean when we say income "affects" outcomes—and whether correlation is doing the work we want it to.',
        principle_applied: 'Show intellectual engagement through methodological awareness',
        why_it_works: 'Understanding multicollinearity and its implications for causation shows real statistical thinking, not just tool usage.',
      },
    ],
  },

  missing_unique_insight: {
    core_principle: 'Generic insights ("I learned teamwork is important") fail because thousands of applicants claim the same lessons. Unique insights reveal thinking that only YOU could have—perspective shaped by your specific circumstances, questions, and intellectual path.',
    why_matters_template: 'The test: could another applicant with a similar experience write this same reflection? If yes, the insight isn\'t yours yet. Dig deeper for the unexpected lesson, the counterintuitive realization, or the question you\'re still wrestling with.',
    technique_categories: ['unexpected_lessons', 'counterintuitive_reflection', 'ongoing_questions', 'perspective_specificity'],
    related_source_ids: [
      'pq_ivy_rough_edges',
      'id_stanford_think_not_words',
      'id_duke_guttentag_interesting',
    ],
    transformations: [
      {
        before: 'This experience taught me the importance of hard work and perseverance.',
        after: 'I realized the hardest part wasn\'t the practice—it was admitting I\'d been practicing wrong for three years. Improvement meant unlearning, and that was humbling in ways I\'m still processing.',
        principle_applied: 'Find the unexpected or counterintuitive aspect of the obvious lesson',
        why_it_works: 'The insight about unlearning is specific and somewhat painful. The "still processing" shows authentic ongoing reflection.',
      },
      {
        before: 'I learned that leadership means putting the team first.',
        after: 'The moment I realized I was a bad leader was when someone finally agreed with me. I\'d been asking questions to hear myself talk, not to actually learn what my team thought.',
        principle_applied: 'Ground reflection in specific self-discovery, especially uncomfortable ones',
        why_it_works: 'The "someone agreed with me" insight is unexpected and shows genuine self-awareness. Most essays claim good leadership; this one interrogates it.',
      },
      {
        before: 'Volunteering taught me to appreciate what I have.',
        after: 'I expected to feel grateful. Instead, I felt complicit. The families I served weren\'t unlucky—they\'d been failed by systems I\'d never had to think about until I saw them not working.',
        principle_applied: 'Resist the expected emotional arc; show the real one',
        why_it_works: 'Moving from expected gratitude to complicity and systems awareness shows genuine transformation, not performed reflection.',
      },
    ],
  },

  missing_evidence_of_impact: {
    core_principle: 'Claims without evidence are indistinguishable from exaggeration. Quantifiable outcomes, specific results, and concrete changes transform vague assertions into credible achievements. The goal isn\'t to brag but to be specific enough to be believed.',
    why_matters_template: 'When you say "made a real difference" or "helped many students," admissions officers have no way to evaluate the claim. Numbers create credibility: "tutored 12 students weekly, 9 of whom improved at least one letter grade." Specificity is proof.',
    technique_categories: ['outcome_quantification', 'comparison_metrics', 'ripple_effects', 'meaningful_measures'],
    related_source_ids: [
      'act_specific_impact',
      'act_leadership_action',
    ],
    transformations: [
      {
        before: 'Our club made a real impact on the local community.',
        after: 'We grew from 8 members to 43, partnered with 12 local businesses, and raised $4,200 for the food bank—enough for 12,600 meals, according to their per-meal cost estimate.',
        principle_applied: 'Replace vague impact claims with quantified outcomes',
        why_it_works: 'Every number is specific and verifiable. Converting dollars to meals shows you understand what impact means.',
      },
      {
        before: 'My tutoring helped many students improve their grades.',
        after: 'I tutored 15 students weekly. Of those, 11 improved by at least one letter grade, and 3 went from failing to honor roll. One of them tutors now.',
        principle_applied: 'Quantify impact with meaningful metrics, including second-order effects',
        why_it_works: 'The progression (15 → 11 → 3 → 1) creates a narrative of impact. The last student becoming a tutor shows lasting change.',
      },
      {
        before: 'I significantly improved our team\'s performance.',
        after: 'After I restructured our practice schedule, our relay time dropped from 4:02 to 3:47—15 seconds, which was the difference between fifth place and first at regionals.',
        principle_applied: 'Connect specific improvements to meaningful outcomes',
        why_it_works: 'The times are specific, the context (fifth to first) makes them meaningful, and the action (restructured schedule) shows your contribution.',
      },
    ],
  },

  missing_intellectual_engagement: {
    core_principle: 'Essays that describe activities without showing intellectual engagement miss the point. Admissions officers want to see how you THINK, not just what you DO. Real intellectual engagement shows through questions, analysis, and ideas that continue beyond the activity itself.',
    why_matters_template: 'Stanford: "Intellectual vitality means they want you to really think about things." Essays that list experiences without showing intellectual curiosity suggest the applicant does things to check boxes, not from genuine engagement.',
    technique_categories: ['question_revelation', 'analytical_depth', 'idea_connection', 'ongoing_thinking'],
    related_source_ids: [
      'id_stanford_think_not_words',
      'wm_intellectual_progression',
      'wm_future_questions',
    ],
    transformations: [
      {
        before: 'I participated in Model UN and learned about international relations.',
        after: 'Representing North Korea in the disarmament committee, I had to argue positions I found repugnant. It forced me to understand the logic of deterrence from the inside—and I\'m still not sure I disagree as much as I want to.',
        principle_applied: 'Show intellectual engagement through genuine tension with ideas',
        why_it_works: 'The discomfort with the argument shows real thinking. The "still not sure" is more honest than claimed certainty.',
      },
      {
        before: 'I enjoyed conducting research on renewable energy.',
        after: 'My hypothesis was wrong. Solar panel degradation didn\'t follow the curve I expected. I spent two weeks trying to salvage my model before realizing the real question was why my assumptions had been wrong in the first place.',
        principle_applied: 'Demonstrate intellectual engagement through wrestling with failure',
        why_it_works: 'The pivot from saving the model to questioning assumptions shows meta-level thinking. Failure generates better essays than success.',
      },
      {
        before: 'Reading books has expanded my knowledge of many subjects.',
        after: 'I read Thinking, Fast and Slow three times. Not because I didn\'t understand it, but because I kept catching myself making the exact cognitive errors Kahneman describes, even while reading about them.',
        principle_applied: 'Show how intellectual engagement changes your own thinking',
        why_it_works: 'The three readings show genuine engagement. The self-catching detail demonstrates applying ideas to yourself.',
      },
    ],
  },

  over_narrated: {
    core_principle: 'Story-heavy essays can actually HIDE achievement when they prioritize narrative over evidence. If you spent 300 words on a vivid scene but never mentioned what you actually accomplished, you\'ve entertained without informing. Balance matters.',
    why_matters_template: 'Storytelling is powerful but not always appropriate. Why Us essays need school-specific evidence, not more narrative. Extracurricular essays need demonstrated impact, not just engaging anecdotes. The question is: does this essay type call for story, or evidence?',
    technique_categories: ['evidence_integration', 'narrative_balance', 'strategic_specificity', 'impact_grounding'],
    related_source_ids: [
      'act_specific_impact',
      'wu_college_specific',
      'wu_contribution_bidirectional',
    ],
    transformations: [
      {
        before: '[250 words of vivid scene-setting] ...and that\'s why I love robotics.',
        after: '[100 words of scene] That broken servo led to our team redesigning the entire gripper mechanism. We went from dropping 40% of objects to 3%, which got us to the state finals. [50 words of reflection]',
        principle_applied: 'After establishing narrative, pivot to evidence and outcomes',
        why_it_works: 'The scene creates engagement; the metrics create credibility. Both are necessary; neither alone is sufficient.',
      },
      {
        before: '[Long story about learning to code with no specifics about what was built]',
        after: 'I spent three weeks debugging code that turned out to have a single misplaced semicolon. But that frustration led to building a linter extension that 200 students at my school now use.',
        principle_applied: 'Connect narrative moments to concrete, quantifiable outcomes',
        why_it_works: 'The semicolon story humanizes; the 200 students grounds it in real impact.',
      },
      {
        before: '[Detailed narrative about volunteering experience with no evidence of impact]',
        after: 'Mrs. Patterson asked me to hold her hand during her blood draw. Over 200 hours, I\'ve held 30 hands, learned 50 names, and discovered that presence matters more than productivity.',
        principle_applied: 'Layer evidence naturally within narrative',
        why_it_works: 'The numbers don\'t interrupt the story; they enrich it. The insight at the end ties numbers to meaning.',
      },
    ],
  },

  missing_character_through_thought: {
    core_principle: 'Essays that describe only ACTIONS miss the opportunity to reveal CHARACTER through THINKING. What you did is on your activity list; how you THINK is what essays uniquely convey. Show the internal deliberation, not just the external achievement.',
    why_matters_template: 'Admissions officers read essays to understand who you ARE, not just what you\'ve DONE. Revealing your thought process—doubt, deliberation, questioning—shows character more than any list of accomplishments.',
    technique_categories: ['thought_revelation', 'internal_deliberation', 'decision_process', 'doubt_expression'],
    related_source_ids: [
      'pq_ivy_rough_edges',
      'id_duke_guttentag_interesting',
    ],
    transformations: [
      {
        before: 'I organized a school-wide fundraiser and raised $5,000.',
        after: 'I almost cancelled the fundraiser twice. The first time because no one signed up. The second because I realized I was doing it to put on my resume, not to help. That honesty made me start over—and eventually raise $5,000 from people who actually cared.',
        principle_applied: 'Reveal character through internal conflict and self-questioning',
        why_it_works: 'The "almost cancelled twice" and the resume-honesty show self-awareness. The final number matters more because of the doubt.',
      },
      {
        before: 'I led the debate team to the state championship.',
        after: 'I spent the night before state finals wondering if I should forfeit. Our best speaker had quit, and I didn\'t know if competing without her was brave or stupid. We won anyway, but I\'m still not sure which it was.',
        principle_applied: 'Show the internal experience behind the external achievement',
        why_it_works: 'The consideration of forfeiting reveals character. The "still not sure" is more honest than confident retrospection.',
      },
      {
        before: 'I started a tutoring program for underprivileged students.',
        after: 'I spent a month wondering if starting the tutoring program was white-savior nonsense. I decided to try anyway, but to ask the students what they actually needed instead of assuming I knew. Turns out, they mostly needed someone to sit with them while they did homework. Not teach. Just sit.',
        principle_applied: 'Reveal character through confronting uncomfortable questions about yourself',
        why_it_works: 'The self-interrogation and the willingness to be wrong show maturity. The surprising answer (just sit) shows you actually listened.',
      },
    ],
  },

  shallow_reflection: {
    core_principle: 'Surface-level reflection ("I learned the importance of...") fails because it TELLS conclusions instead of SHOWING the process of arriving at them. Deep reflection reveals the journey of understanding, including dead ends, surprises, and remaining questions.',
    why_matters_template: 'Generic lessons like "teamwork is important" or "I learned to never give up" could be written by anyone. Deep reflection asks: what specifically changed in how you see yourself or the world? What would your past self not believe?',
    technique_categories: ['process_over_conclusion', 'unexpected_insight', 'ongoing_questions', 'self_surprise'],
    related_source_ids: [
      'sdt_transformation_telling_to_showing',
      'pq_ivy_rough_edges',
    ],
    transformations: [
      {
        before: 'This experience taught me the importance of teamwork.',
        after: 'I used to think teamwork meant agreeing with people to avoid conflict. Now I understand that real teamwork means saying "I think you\'re wrong" and trusting the relationship to survive the disagreement.',
        principle_applied: 'Show the specific shift in understanding, not just the general lesson',
        why_it_works: 'The before/after framing shows evolution. The specific insight (disagreement as trust) is unique.',
      },
      {
        before: 'I learned to never give up, even when things get hard.',
        after: 'I thought persistence meant refusing to quit. Then I quit three versions of my project before finding one that worked. Turns out, "never give up" is bad advice. "Give up smartly" is better.',
        principle_applied: 'Complicate the expected lesson with specific experience',
        why_it_works: 'The reversal of the expected lesson shows real thinking. The "three versions" is specific evidence.',
      },
      {
        before: 'This experience made me more compassionate.',
        after: 'I wanted to feel compassion. What I actually felt was discomfort, then guilt about the discomfort, then frustration at myself for making someone else\'s struggle about me. Real compassion, I learned, means sitting with people without needing them to make you feel better about yourself.',
        principle_applied: 'Trace the messy actual journey, not the cleaned-up version',
        why_it_works: 'The honest sequence of emotions is more believable than claimed virtue. The final insight emerges from the struggle.',
      },
    ],
  },

  missing_complexity: {
    core_principle: 'Oversimplified essays reduce rich experiences to neat lessons. Real life is messier: good things have downsides, lessons have exceptions, and heroes have flaws. Showing complexity demonstrates maturity and authentic thinking.',
    why_matters_template: 'Essays that tie everything in a bow feel immature. Admissions officers know that real growth involves tension, contradiction, and unanswered questions. Complexity isn\'t weakness—it\'s sophistication.',
    technique_categories: ['tension_acknowledgment', 'paradox_exploration', 'unresolved_questions', 'nuanced_perspective'],
    related_source_ids: [
      'pq_ivy_rough_edges',
      'id_duke_guttentag_interesting',
    ],
    transformations: [
      {
        before: 'Winning the competition was the best moment of my life.',
        after: 'Winning felt strange. I\'d imagined this moment for years, but standing on stage, all I could think about was my teammate who\'d trained just as hard and hadn\'t placed. The trophy looks different when you remember who\'s not in the picture.',
        principle_applied: 'Complicate the expected emotional arc with honest complexity',
        why_it_works: 'The mixed feelings about winning show maturity. The teammate detail adds moral texture.',
      },
      {
        before: 'My mentor changed my life and taught me everything I know.',
        after: 'My mentor was brilliant and terrible in equal measure. She pushed me harder than anyone, but sometimes harder meant harsher. I\'m still sorting out which lessons to keep and which to unlearn.',
        principle_applied: 'Show the full complexity of influential relationships',
        why_it_works: 'Mentors aren\'t saints. The "still sorting out" shows ongoing processing.',
      },
      {
        before: 'I am passionate about environmental activism and want to save the planet.',
        after: 'I drove to the climate march. The irony wasn\'t lost on me. I\'ve spent two years trying to figure out how to care about the environment without being a hypocrite, and I\'m not sure I\'ve succeeded. But I\'ve decided that imperfect action beats paralyzed purity.',
        principle_applied: 'Acknowledge the tensions within your own position',
        why_it_works: 'The driving irony shows self-awareness. The resolution (imperfect action) is earned through honesty.',
      },
    ],
  },

  missing_connection_specificity: {
    core_principle: 'Generic school fit claims ("I love the collaborative environment") fail the swap test—you could substitute any school\'s name. Real fit is demonstrated through specific connections between YOUR interests and THEIR resources: named professors, specific courses, particular programs, unique opportunities.',
    why_matters_template: 'Why Us essays exist to show you\'ve done your homework. Mentioning "great professors" proves nothing; mentioning "Professor Chen\'s work on protein folding" proves you\'ve actually researched the school and have genuine reasons for applying.',
    technique_categories: ['professor_naming', 'course_specificity', 'program_research', 'contribution_articulation'],
    related_source_ids: [
      'wu_college_specific',
      'wu_contribution_bidirectional',
      'wu_swap_test',
    ],
    transformations: [
      {
        before: 'I want to attend Stanford because of its excellent engineering program and collaborative culture.',
        after: 'Professor Shriram\'s work on sustainable concrete alternatives directly connects to my independent research on construction waste. I want to bring my data on local demolition patterns to her lab and explore whether regional material availability affects optimal mix designs.',
        principle_applied: 'Connect YOUR specific work to THEIR specific resources',
        why_it_works: 'The professor name, specific research area, and your own data create undeniable fit. No swap test possible.',
      },
      {
        before: 'MIT\'s world-class research opportunities will help me achieve my goals.',
        after: 'The UROP program is why I\'m applying. I\'ve read three papers from the Langer Lab on drug delivery systems, and I have questions about the permeability coefficients they reported. I want to run the experiments myself.',
        principle_applied: 'Show you\'ve engaged with their actual research output',
        why_it_works: 'Naming papers, labs, and specific scientific questions proves genuine engagement.',
      },
      {
        before: 'Duke\'s interdisciplinary approach matches my diverse interests.',
        after: 'The Bass Connections project on "Water and Health" brings together policy, engineering, and public health—exactly the intersection where my question lives. I want to add a behavioral economics lens: why do communities resist water treatment solutions that would save lives?',
        principle_applied: 'Identify a specific program and articulate what you\'d contribute to it',
        why_it_works: 'The specific program + your unique question = clear value proposition both ways.',
      },
    ],
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ResearchBackedTeachingService {
  private indexer = getSourceIndexer();

  /**
   * Get comprehensive teaching bundle for an issue type
   * This is the main entry point for knowledge-based teaching
   */
  getTeachingForIssue(issueType: IssueType): ResearchBackedTeaching | null {
    const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
    if (!knowledge) {
      return null;
    }

    // Get relevant sources from indexer
    const relevantSources = this.getRelevantSources(issueType, knowledge.related_source_ids);

    // Build teaching bundle
    return {
      issue_type: issueType,

      why_section: this.buildWhySection(knowledge, relevantSources),
      techniques: this.buildTechniques(issueType, knowledge, relevantSources),
      evidence: this.buildEvidence(relevantSources),
      transformations: knowledge.transformations,
    };
  }

  /**
   * Get a quick "why this matters" explanation with source backing
   */
  getWhyThisMatters(issueType: IssueType): { explanation: string; source?: SourceCitation } | null {
    const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
    if (!knowledge) return null;

    // Find best "why_this_matters" source
    const sources = this.indexer.getForIssueType(issueType as any);
    const whySource = sources.find(s =>
      s.source.taxonomy.teaching_moment_types.includes('why_this_matters')
    );

    return {
      explanation: knowledge.why_matters_template,
      source: whySource ? this.toSourceCitation(whySource.source, 'why_this_matters') : undefined,
    };
  }

  /**
   * Get technique suggestions for fixing an issue
   */
  getTechniquesForIssue(issueType: IssueType): TechniqueBundle[] {
    const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
    if (!knowledge) return [];

    const sources = this.indexer.getForIssueType(issueType as any);
    const howToFixSources = sources.filter(s =>
      s.source.taxonomy.teaching_moment_types.includes('how_to_fix')
    );

    return knowledge.technique_categories.map((category, idx) => ({
      name: this.formatTechniqueName(category),
      description: this.getTechniqueDescription(category),
      steps: this.getTechniqueSteps(category),
      source_backing: howToFixSources[idx]
        ? this.toSourceCitation(howToFixSources[idx].source, 'how_to_fix')
        : this.getDefaultSourceCitation(issueType),
      difficulty: this.getTechniqueDifficulty(category),
      common_mistakes: this.getCommonMistakes(category),
    }));
  }

  /**
   * Get before/after transformation examples
   */
  getTransformations(issueType: IssueType): TransformationExample[] {
    const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
    return knowledge?.transformations || [];
  }

  /**
   * Get sources relevant to a specific college for an issue
   */
  getCollegeSpecificGuidance(
    issueType: IssueType,
    collegeId: string
  ): { sources: SourceCitation[]; insight?: string } {
    const collegeSources = this.indexer.getForCollege(collegeId);
    const relevant = collegeSources.filter(s =>
      s.relevance >= 70 &&
      Object.keys(s.source.issue_relevance || {}).includes(issueType)
    );

    return {
      sources: relevant.map(s => this.toSourceCitation(s.source, 'principle_explanation')),
      insight: this.getCollegeInsight(collegeId, issueType),
    };
  }

  /**
   * Get a teaching bundle optimized for a specific teaching moment
   */
  getTeachingMoment(
    issueType: IssueType,
    momentType: TeachingMomentType
  ): SourceCitation[] {
    const sources = this.indexer.getForIssueType(issueType as any);
    return sources
      .filter(s => s.source.taxonomy.teaching_moment_types.includes(momentType))
      .slice(0, 3)
      .map(s => this.toSourceCitation(s.source, momentType));
  }

  /**
   * Get a concise research-backed explanation for inline feedback
   */
  getInlineExplanation(issueType: IssueType): string {
    const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
    if (!knowledge) return '';

    // Return first sentence of core principle plus source reference
    const firstSentence = knowledge.core_principle.split('.')[0] + '.';
    const sources = this.indexer.getForIssueType(issueType as any);
    const primarySource = sources.find(s => s.source.authority === 'primary');

    if (primarySource) {
      return `${firstSentence} (${primarySource.source.author})`;
    }
    return firstSentence;
  }

  /**
   * Get all available issue types with teaching knowledge
   */
  getAvailableIssueTypes(): IssueType[] {
    return Object.keys(TEACHING_KNOWLEDGE_BASE) as IssueType[];
  }

  /**
   * Get statistics about teaching knowledge coverage
   */
  getStats(): {
    issueTypesCovered: number;
    totalTransformations: number;
    sourcesAvailable: number;
    techniqueCategories: number;
  } {
    const issueTypes = Object.keys(TEACHING_KNOWLEDGE_BASE);
    let totalTransformations = 0;
    let techniqueCategories = 0;

    for (const issueType of issueTypes) {
      const knowledge = TEACHING_KNOWLEDGE_BASE[issueType];
      totalTransformations += knowledge.transformations.length;
      techniqueCategories += knowledge.technique_categories.length;
    }

    return {
      issueTypesCovered: issueTypes.length,
      totalTransformations,
      sourcesAvailable: LABELED_SOURCES.length,
      techniqueCategories,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getRelevantSources(
    issueType: IssueType,
    relatedIds: string[]
  ): LabeledSource[] {
    const fromIds = relatedIds
      .map(id => getSourceById(id))
      .filter((s): s is LabeledSource => s !== undefined);

    const fromIndexer = this.indexer.getForIssueType(issueType as any)
      .slice(0, 5)
      .map(s => s.source);

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: LabeledSource[] = [];

    for (const source of [...fromIds, ...fromIndexer]) {
      if (!seen.has(source.source_id)) {
        seen.add(source.source_id);
        merged.push(source);
      }
    }

    return merged;
  }

  private buildWhySection(
    knowledge: typeof TEACHING_KNOWLEDGE_BASE[string],
    sources: LabeledSource[]
  ): ResearchBackedTeaching['why_section'] {
    const whySources = sources.filter(s =>
      s.taxonomy.teaching_moment_types.includes('why_this_matters')
    );

    return {
      summary: knowledge.core_principle,
      research_insight: knowledge.why_matters_template,
      sources: whySources.slice(0, 3).map(s => this.toSourceCitation(s, 'why_this_matters')),
      admissions_perspective: this.extractAdmissionsPerspective(sources),
      psychology_insight: this.extractPsychologyInsight(sources),
    };
  }

  private buildTechniques(
    issueType: IssueType,
    knowledge: typeof TEACHING_KNOWLEDGE_BASE[string],
    sources: LabeledSource[]
  ): TechniqueBundle[] {
    const howToFixSources = sources.filter(s =>
      s.taxonomy.teaching_moment_types.includes('how_to_fix')
    );

    return knowledge.technique_categories.map((category, idx) => ({
      name: this.formatTechniqueName(category),
      description: this.getTechniqueDescription(category),
      steps: this.getTechniqueSteps(category),
      source_backing: howToFixSources[idx]
        ? this.toSourceCitation(howToFixSources[idx], 'how_to_fix')
        : this.getDefaultSourceCitation(issueType),
      difficulty: this.getTechniqueDifficulty(category),
      common_mistakes: this.getCommonMistakes(category),
    }));
  }

  private buildEvidence(sources: LabeledSource[]): ResearchBackedTeaching['evidence'] {
    const primary = sources.filter(s =>
      s.type === 'admissions_quote' || (s as any).authority === 'primary'
    );
    const quotes = sources
      .filter(s => s.quote)
      .map(s => s.quote!)
      .slice(0, 5);

    return {
      primary_sources: primary.map(s => this.toSourceCitation(s, 'principle_explanation')),
      supporting_quotes: quotes,
    };
  }

  private toSourceCitation(
    source: LabeledSource,
    momentType: TeachingMomentType
  ): SourceCitation {
    return {
      source_id: source.source_id,
      quote: source.quote || source.finding || '',
      author: source.author,
      context: source.relevance_to_claim || '',
      authority: (source as any).authority || 'expert',
      teaching_moment_type: momentType,
    };
  }

  private getDefaultSourceCitation(issueType: IssueType): SourceCitation {
    return {
      source_id: 'default',
      quote: 'Based on admissions research and expert guidance.',
      author: 'Admissions Research',
      context: `Guidance for ${issueType}`,
      authority: 'expert',
      teaching_moment_type: 'how_to_fix',
    };
  }

  private extractAdmissionsPerspective(sources: LabeledSource[]): string | undefined {
    const aoSource = sources.find(s => s.type === 'admissions_quote');
    return aoSource?.quote;
  }

  private extractPsychologyInsight(sources: LabeledSource[]): string | undefined {
    const neuroSource = sources.find(s =>
      s.source_id.includes('neuro') || s.title?.toLowerCase().includes('psychology')
    );
    return neuroSource?.quote;
  }

  private formatTechniqueName(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getTechniqueDescription(category: string): string {
    const descriptions: Record<string, string> = {
      // CORE STORYTELLING
      sensory_details: 'Add specific sensory details (what you saw, heard, smelled, felt) to ground abstract claims in concrete reality.',
      scene_construction: 'Build a moment with setting, action, and dialogue rather than summarizing what happened.',
      moment_freezing: 'Pause on a single significant moment and expand it with detail.',
      dialogue_inclusion: 'Include actual words people said to make scenes come alive.',

      // VOICE & AUTHENTICITY
      voice_preservation: 'Keep your natural speaking voice; avoid vocabulary you wouldn\'t use in conversation.',
      specificity_injection: 'Replace general statements with specific, concrete details.',
      vocabulary_authenticity: 'Use words a 17-year-old would actually use, not thesaurus upgrades.',

      // GROWTH & COMPLEXITY
      complexity_preservation: 'Maintain the messy, incomplete nature of real growth.',
      ongoing_struggle: 'Show that challenges are still present, not fully overcome.',
      qualified_growth: 'Use qualifiers like "mostly," "sometimes," "I think" to show authentic uncertainty.',

      // INTELLECTUAL DEPTH
      clarity_over_complexity: 'Simple, precise language demonstrates mastery better than ornate prose.',
      thinking_process: 'Show HOW you think, not just WHAT you concluded.',
      genuine_questions: 'Include questions you\'re still wrestling with.',

      // SYSTEMS AWARENESS
      structural_connection: 'Connect your personal experience to broader systems and patterns.',
      pattern_recognition: 'Notice and articulate larger forces at play.',
      context_expansion: 'Place your story within historical, social, or economic context.',

      // AGENCY
      agency_demonstration: 'Show what you DID, not just what happened TO you.',
      response_focus: 'Emphasize your response to circumstances, not the circumstances themselves.',
      action_over_suffering: 'Let actions reveal resilience rather than claiming it.',

      // VULNERABILITY
      organic_revelation: 'Let vulnerability emerge naturally from the story.',
      earned_vulnerability: 'Build context that makes vulnerable moments feel necessary.',
      unannounced_honesty: 'Be honest without announcing that you\'re being honest.',

      // ENDINGS
      open_ending: 'End with questions or ongoing complexity rather than neat conclusions.',
      question_preservation: 'Keep some questions unanswered to show intellectual maturity.',
      complexity_acceptance: 'Show comfort with ambiguity and uncertainty.',
      callback_closure: 'Return to an image or moment from your opening with new meaning.',
      scope_shift: 'End by widening the lens from your specific story to something universal.',
      resonant_image: 'End with a concrete image that carries emotional weight.',

      // LANGUAGE RENOVATION
      image_renovation: 'Take a dead metaphor and make it specific to YOUR experience.',
      incremental_revelation: 'Show understanding building over time rather than arriving suddenly.',

      // OPENING HOOKS
      medias_res: 'Start in the middle of the action, at the point of highest tension.',
      sensory_hook: 'Open with a specific sensory detail that creates immediate intrigue.',
      dialogue_opener: 'Start with actual words someone said that raise questions.',
      unexpected_detail: 'Open with a specific, quirky detail that\'s uniquely yours.',

      // WHY US ESSAYS
      specific_program_connection: 'Connect specific courses, professors, or programs to YOUR specific questions.',
      professor_course_fit: 'Show you\'ve researched specific professors and can articulate why their work matters to you.',
      non_googleable_detail: 'Include details about the school that show deeper research than the first page of the website.',
      authentic_why: 'Explain why THIS school specifically, not just any good school.',

      // WHY MAJOR
      origin_moment: 'Identify the specific moment your interest began and what happened.',
      question_evolution: 'Show how your questions about the field have changed over time.',
      intellectual_progression: 'Demonstrate how your understanding has deepened through specific experiences.',
      future_questions: 'Identify specific questions you want to explore in the major.',

      // ACTIVITY ESSAYS
      specific_contribution: 'Show what YOU specifically did, not what the group accomplished.',
      pivotal_moment: 'Find the moment that changed how you approach the activity.',
      unexpected_lesson: 'Identify something you learned that surprised you.',
      growth_through_action: 'Demonstrate growth through specific actions, not claims.',

      // STRUCTURE
      in_medias_res: 'Start at your story\'s climax, dropping readers into the action.',
      thematic_threading: 'Use a recurring concrete image to connect different parts of your essay.',
      circular_structure: 'End by returning to where you began with new meaning.',
      tension_pacing: 'Slow down in high-tension moments, speed up elsewhere.',

      // TRANSITIONS
      implicit_connection: 'Show connections through continued narrative, not announcement.',
      echo_transition: 'Connect paragraphs by echoing images or phrases.',
      contrast_pivot: 'Use contrast to create natural turns in thinking.',
      question_bridge: 'Connect ideas by raising questions that the next section explores.',

      // QUESTION & OPEN TECHNIQUES
      open_question: 'End with a meaningful question that shows ongoing thinking.',
    };
    return descriptions[category] || `Apply ${this.formatTechniqueName(category)} technique.`;
  }

  private getTechniqueSteps(category: string): string[] {
    const steps: Record<string, string[]> = {
      // CORE STORYTELLING TECHNIQUES
      sensory_details: [
        'Identify a moment where you claim an emotion or quality',
        'Close your eyes and recall: what did you see, hear, smell, feel?',
        'Replace the claim with 2-3 specific sensory details',
        'Remove any remaining abstract labels',
      ],
      scene_construction: [
        'Pick one specific moment (not a summary of events)',
        'Set the scene: where, when, who\'s there',
        'Show action: what did you physically do?',
        'Include one line of dialogue if possible',
        'End the scene, don\'t explain its significance',
      ],
      moment_freezing: [
        'Find a moment that passes too quickly in your essay',
        'Slow it down to second-by-second experience',
        'Add what you noticed, thought, or felt in that moment',
        'Let the significance emerge through detail, not explanation',
      ],
      dialogue_inclusion: [
        'Identify a key interaction in your essay',
        'Recall the actual words that were said (approximate is fine)',
        'Keep dialogue short—one or two lines is powerful',
        'Use dialogue to reveal character, not to convey information',
      ],

      // VOICE & AUTHENTICITY TECHNIQUES
      voice_preservation: [
        'Read your essay out loud',
        'Circle any word you wouldn\'t say to a friend',
        'Replace elevated vocabulary with natural alternatives',
        'Keep sentences varying in length like natural speech',
      ],
      vocabulary_authenticity: [
        'Highlight every word over three syllables',
        'Ask: would I use this word in conversation?',
        'Replace artificial vocabulary with simpler alternatives',
        'Keep technical terms only when they\'re genuinely yours',
      ],

      // GROWTH & COMPLEXITY TECHNIQUES
      qualified_growth: [
        'Find claims of complete transformation',
        'Add qualifiers: "mostly," "I think," "sometimes"',
        'Include a recent moment of backsliding or struggle',
        'End with what you\'re still working on',
      ],
      complexity_preservation: [
        'Identify moments where you claim simple lessons',
        'Ask: what\'s the exception to this? When doesn\'t it work?',
        'Add complexity by showing ongoing struggle or nuance',
        'Resist the urge to tie everything up neatly',
      ],
      ongoing_struggle: [
        'Find your essay\'s resolution or claimed growth',
        'Add a specific recent moment when the old pattern returned',
        'Show how you caught yourself or responded differently',
        'Keep the ending open—growth is ongoing, not complete',
      ],

      // LANGUAGE RENOVATION TECHNIQUES
      image_renovation: [
        'Identify clichés and dead metaphors in your essay',
        'Ask: what was the ORIGINAL experience behind this phrase?',
        'Replace the cliché with a detail specific to YOUR moment',
        'Test: would anyone else use this exact phrase?',
      ],
      incremental_revelation: [
        'Find claims of sudden understanding ("I realized," "it hit me")',
        'Break that moment into multiple smaller realizations',
        'Add time markers between each stage of understanding',
        'Show at least one time you got it wrong before getting it right',
      ],
      specificity_injection: [
        'Circle every general noun (thing, stuff, experience)',
        'Replace each with the specific item it represents',
        'Add numbers where possible (times, dates, quantities)',
        'Include proper nouns (names, places, titles)',
      ],

      // INTELLECTUAL DEPTH TECHNIQUES
      clarity_over_complexity: [
        'Identify sentences with multiple clauses or complex vocabulary',
        'Rewrite each using the simplest words that work',
        'Read both versions aloud—which sounds more like you?',
        'Keep complexity in ideas, not in sentence structure',
      ],
      thinking_process: [
        'Find conclusions in your essay',
        'Work backwards: what was your first thought? Your second?',
        'Show the steps of your thinking, including wrong turns',
        'Let the reader follow your mind, not just your answer',
      ],
      genuine_questions: [
        'Identify claims of certainty in your essay',
        'Ask: what don\'t I know? What am I still wondering?',
        'Replace some claims with honest questions',
        'Show that your curiosity is ongoing, not resolved',
      ],

      // SYSTEMS AWARENESS TECHNIQUES
      structural_connection: [
        'Identify the systems that shaped your experience (school, family, neighborhood)',
        'Show how your individual story fits into larger patterns',
        'Connect your action to awareness of these systems',
        'Avoid making yourself the hero who solved systemic problems',
      ],
      pattern_recognition: [
        'Step back from your individual story',
        'Ask: who else experiences this? Why?',
        'Name the pattern without claiming to have solved it',
        'Show awareness without preachiness',
      ],
      context_expansion: [
        'Identify the historical/social context of your experience',
        'Add one sentence that places your story in larger patterns',
        'Show you understand your experience isn\'t isolated',
        'Balance context with personal specificity',
      ],

      // AGENCY TECHNIQUES
      agency_demonstration: [
        'Find places where things "happened to" you',
        'Reframe to show what you DID in response',
        'Focus on small actions rather than big claims',
        'Show choice even within constraints',
      ],
      response_focus: [
        'Reduce description of circumstances by half',
        'Double the description of your response',
        'Show adaptation and choice, not just survival',
        'Let actions reveal character more than suffering reveals hardship',
      ],
      action_over_suffering: [
        'Count sentences about what happened vs. what you did',
        'Aim for at least 2:1 action to circumstance',
        'Replace claims of resilience with specific adaptations',
        'Let readers infer your strength from your actions',
      ],

      // VULNERABILITY TECHNIQUES
      organic_revelation: [
        'Remove any sentence that announces vulnerability',
        'Show the experience that created the vulnerability',
        'Let physical details reveal emotional states',
        'Trust the reader to feel what you show',
      ],
      earned_vulnerability: [
        'Build context before revealing anything difficult',
        'Show why this moment matters before sharing it',
        'Connect vulnerable moments to larger themes',
        'Avoid vulnerability that feels like a checkbox',
      ],
      unannounced_honesty: [
        'Delete phrases like "to be honest," "to be vulnerable"',
        'Show honest moments through action and detail',
        'Let authenticity emerge from specificity',
        'If you have to announce it, it\'s probably not working',
      ],

      // ENDING TECHNIQUES
      open_ending: [
        'Find your essay\'s neat conclusion',
        'Ask: what am I still uncertain about?',
        'Replace claims of resolution with honest uncertainty',
        'End with a question or ongoing complexity',
      ],
      question_preservation: [
        'Identify questions your essay answers too quickly',
        'Leave at least one meaningful question unanswered',
        'Show you\'re still thinking, not finished thinking',
        'Let the reader sit with ambiguity alongside you',
      ],

      // OPENING HOOK TECHNIQUES
      medias_res: [
        'Find the most tense or pivotal moment in your story',
        'Start your essay there, not at the chronological beginning',
        'Trust readers to catch up on context',
        'Create intrigue by dropping readers into action',
      ],
      sensory_hook: [
        'Open with a specific sensory detail',
        'Make it unusual or unexpected enough to create curiosity',
        'Ground the reader in a physical moment immediately',
        'Avoid explaining the detail\'s significance upfront',
      ],
      dialogue_opener: [
        'Start with actual words someone said',
        'Choose dialogue that raises questions',
        'Keep it short—one or two lines maximum',
        'Don\'t attribute the speaker until after the line',
      ],
      unexpected_detail: [
        'Open with a specific, quirky detail about yourself',
        'Make it something only you would know or notice',
        'Create intrigue without being gimmicky',
        'Let the detail reveal something larger about who you are',
      ],

      // ENDING TECHNIQUES (EXPANDED)
      callback_closure: [
        'Return to an image, phrase, or moment from your opening',
        'Give it new meaning based on what\'s happened in the essay',
        'Don\'t explain the connection—let readers feel it',
        'Use the callback to show growth without stating it',
      ],
      scope_shift: [
        'End by widening the lens from specific to universal',
        'Connect your individual experience to something larger',
        'Avoid preachiness—suggest, don\'t lecture',
        'Let readers draw their own broader conclusions',
      ],
      resonant_image: [
        'End with a concrete image rather than abstract thought',
        'Choose an image that carries emotional weight',
        'Trust the image to do the work of meaning',
        'Avoid explaining what the image represents',
      ],

      // WHY US ESSAY TECHNIQUES
      specific_program_connection: [
        'Identify specific courses, professors, or programs that interest you',
        'Research beyond the first Google result',
        'Connect the specific opportunity to YOUR specific question',
        'Show how this fits a pattern of interests you\'ve developed',
      ],
      professor_course_fit: [
        'Find a professor whose work connects to your interests',
        'Read at least one of their papers or articles',
        'Identify a specific question you\'d want to discuss',
        'Show how your background prepares you for this conversation',
      ],
      non_googleable_detail: [
        'Include something you couldn\'t find on the first page of the website',
        'Talk to current students or alumni if possible',
        'Reference specific traditions, quirks, or culture',
        'Show you\'ve gone deeper than the brochure',
      ],
      authentic_why: [
        'Explain why THIS school, not just any good school',
        'Connect specific school features to specific goals',
        'Show what you\'d do that you couldn\'t do elsewhere',
        'Be honest about what draws you—prestige alone won\'t work',
      ],

      // WHY MAJOR TECHNIQUES
      origin_moment: [
        'Identify the specific moment your interest began',
        'Show what happened, not just when it started',
        'Make the origin personal and specific to you',
        'Connect the origin to ongoing development',
      ],
      question_evolution: [
        'Show how your questions have changed over time',
        'Map the progression from first question to current questions',
        'Include questions you\'ve answered and new ones that emerged',
        'End with what you\'re still wondering',
      ],
      intellectual_progression: [
        'Show how your understanding has deepened',
        'Include moments of confusion or being wrong',
        'Connect each stage to specific experiences',
        'Demonstrate that you\'ve actually engaged with the material',
      ],
      future_questions: [
        'Identify questions the major would help you explore',
        'Make them specific, not generic to the field',
        'Connect future questions to past exploration',
        'Show why you need this program to keep going',
      ],

      // ACTIVITY ESSAY TECHNIQUES
      specific_contribution: [
        'Identify what YOU specifically did, not the group',
        'Show a decision you made that mattered',
        'Include a moment that was uniquely yours',
        'Quantify impact where possible, but don\'t list',
      ],
      pivotal_moment: [
        'Find the moment that changed how you approach the activity',
        'Show what happened before and after',
        'Include what you were thinking or feeling',
        'Let this moment reveal larger character traits',
      ],
      unexpected_lesson: [
        'Identify something you learned that surprised you',
        'Show how the activity taught you something you didn\'t expect',
        'Avoid obvious lessons ("I learned leadership")',
        'Be specific about what the insight was',
      ],
      growth_through_action: [
        'Show how you\'ve developed through specific actions',
        'Avoid claiming growth—demonstrate it',
        'Include a specific moment that shows the change',
        'Connect early struggles to later competence',
      ],

      // STRUCTURE TECHNIQUES
      in_medias_res: [
        'Identify your story\'s climax or most tense moment',
        'Start there, dropping readers into the action',
        'Provide context gradually through the narrative',
        'Avoid explaining the backstory all at once',
      ],
      thematic_threading: [
        'Choose a concrete image or detail that recurs',
        'Return to it at key moments with new meaning',
        'Let the thread connect different parts of your essay',
        'Each return should add depth, not just repetition',
      ],
      circular_structure: [
        'End by returning to where you began',
        'Show how the meaning has changed',
        'Use the same image or moment with new eyes',
        'Let the circle demonstrate growth',
      ],
      tension_pacing: [
        'Identify moments of tension in your essay',
        'Slow down in high-tension moments, speed up elsewhere',
        'Don\'t resolve tension too quickly',
        'Let readers feel the suspense alongside you',
      ],

      // TRANSITION TECHNIQUES
      implicit_connection: [
        'Remove transitional phrases ("Furthermore," "In addition")',
        'Show connections through continued narrative',
        'Let ideas flow into each other naturally',
        'If the connection isn\'t clear, reconsider the paragraph order',
      ],
      echo_transition: [
        'End one paragraph with an image or phrase',
        'Begin the next with a variation of that element',
        'Let echoes create connection without signposts',
        'Each echo should add meaning, not just repeat',
      ],
      contrast_pivot: [
        'Use "But" or "However" only when there\'s real contrast',
        'Show the contrast through narrative, not announcement',
        'Let pivots feel like natural turns in thinking',
        'Don\'t force contrast where there isn\'t any',
      ],
      question_bridge: [
        'End a paragraph with a question (explicit or implied)',
        'Begin the next paragraph by exploring that question',
        'Let curiosity drive the essay forward',
        'Don\'t answer questions too quickly',
      ],
      complexity_acceptance: [
        'Identify places where you claim simple answers',
        'Ask: what makes this complicated? What\'s the exception?',
        'Add language that acknowledges uncertainty ("I think," "perhaps")',
        'Show that holding complexity is a strength, not a weakness',
      ],
      open_question: [
        'Find your essay\'s conclusion or final insight',
        'Ask: what am I still wondering about?',
        'Replace the conclusion with an honest question you\'re still exploring',
        'Make sure the question shows depth of thought, not avoidance',
      ],
    };
    return steps[category] || [
      `Apply ${this.formatTechniqueName(category)} to your writing`,
      'Review and revise as needed',
    ];
  }

  private getTechniqueDifficulty(category: string): 'simple' | 'moderate' | 'advanced' {
    const advanced = ['structural_connection', 'complexity_acceptance', 'earned_vulnerability'];
    const simple = ['voice_preservation', 'qualified_growth', 'agency_demonstration'];

    if (advanced.includes(category)) return 'advanced';
    if (simple.includes(category)) return 'simple';
    return 'moderate';
  }

  private getCommonMistakes(category: string): string[] {
    const mistakes: Record<string, string[]> = {
      // CORE STORYTELLING
      sensory_details: [
        'Adding generic sensory clichés ("my heart raced")',
        'Over-doing it with too many details',
        'Choosing details that don\'t support the moment\'s meaning',
      ],
      scene_construction: [
        'Writing scenes that are too long or detailed',
        'Choosing a scene that doesn\'t reveal character',
        'Explaining the scene\'s significance instead of showing it',
      ],
      moment_freezing: [
        'Slowing down unimportant moments',
        'Adding thoughts that feel invented rather than remembered',
        'Making the moment feel artificially drawn out',
      ],
      dialogue_inclusion: [
        'Including dialogue that sounds written, not spoken',
        'Using dialogue for exposition ("As you know, Mom...")',
        'Including too much dialogue and not enough context',
      ],

      // VOICE & AUTHENTICITY
      voice_preservation: [
        'Over-correcting into too casual/slangy',
        'Losing all sentence variety',
        'Removing all sophistication instead of just fake sophistication',
      ],
      vocabulary_authenticity: [
        'Going too far and sounding uneducated',
        'Removing technical vocabulary you actually use',
        'Losing precision in an attempt to sound casual',
      ],

      // GROWTH & COMPLEXITY
      qualified_growth: [
        'Undermining yourself too much',
        'Adding qualifiers to everything (over-hedging)',
        'Making it sound like you haven\'t grown at all',
      ],
      complexity_preservation: [
        'Adding complexity that feels artificial or forced',
        'Becoming so nuanced the essay loses direction',
        'Confusing complexity with ambivalence',
      ],
      ongoing_struggle: [
        'Making struggle sound like failure rather than growth',
        'Dwelling too long on setbacks',
        'Ending on a down note instead of honest complexity',
      ],

      // LANGUAGE RENOVATION
      image_renovation: [
        'Replacing clichés with different clichés',
        'Making details too quirky or trying too hard',
        'Losing clarity in pursuit of originality',
      ],
      incremental_revelation: [
        'Breaking down understanding so much it loses impact',
        'Making growth sound too slow or uncertain',
        'Losing the essay\'s sense of forward movement',
      ],
      specificity_injection: [
        'Adding specific details that don\'t matter',
        'Including so many specifics the essay becomes cluttered',
        'Sacrificing flow for detail',
      ],

      // INTELLECTUAL DEPTH
      clarity_over_complexity: [
        'Oversimplifying interesting ideas',
        'Losing nuance in pursuit of simplicity',
        'Making ideas sound shallow instead of clear',
      ],
      thinking_process: [
        'Including every thought instead of selecting carefully',
        'Making thinking sound more confused than you were',
        'Losing the conclusion in showing the process',
      ],
      genuine_questions: [
        'Asking questions that sound rhetorical or forced',
        'Including questions you clearly know the answer to',
        'Ending with questions that feel like cop-outs',
      ],

      // SYSTEMS AWARENESS
      structural_connection: [
        'Sounding preachy or politically performative',
        'Losing your individual story in systemic analysis',
        'Over-claiming awareness or understanding',
      ],
      pattern_recognition: [
        'Making observations that feel like textbook sociology',
        'Losing personal voice in favor of analysis',
        'Claiming to understand patterns you don\'t actually understand',
      ],
      context_expansion: [
        'Adding context that overwhelms the personal story',
        'Sounding like you\'re trying to seem smart',
        'Losing emotional connection in intellectual analysis',
      ],

      // AGENCY
      agency_demonstration: [
        'Making small actions sound bigger than they were',
        'Losing authenticity by over-emphasizing choice',
        'Sounding like you\'re minimizing real hardship',
      ],
      response_focus: [
        'Making it sound like hardship doesn\'t matter',
        'Over-focusing on response at expense of emotional truth',
        'Sounding robotic or too resilient to be believable',
      ],
      action_over_suffering: [
        'Seeming dismissive of genuine difficulty',
        'Making yourself sound too put-together',
        'Losing vulnerability in pursuit of agency',
      ],

      // VULNERABILITY
      organic_revelation: [
        'Being so subtle vulnerability doesn\'t come through',
        'Showing vulnerable moments without emotional context',
        'Making vulnerability feel performative anyway',
      ],
      earned_vulnerability: [
        'Over-building context until the moment loses power',
        'Connecting to themes so explicitly it feels forced',
        'Vulnerability that still feels strategic despite preparation',
      ],
      unannounced_honesty: [
        'Being so honest it makes the reader uncomfortable',
        'Sharing details that are too personal or raw',
        'Honesty that serves no narrative purpose',
      ],

      // ENDING TECHNIQUES
      open_ending: [
        'Ending so open it feels unfinished',
        'Questions that feel like you just gave up',
        'Uncertainty that seems like lack of self-awareness',
      ],
      question_preservation: [
        'Questions that feel manufactured',
        'Keeping questions open that should be answered',
        'Seeming wishy-washy instead of thoughtfully uncertain',
      ],
      callback_closure: [
        'Callbacks that feel forced or too obvious',
        'Returning to images that didn\'t register in the opening',
        'Making the connection too explicit',
      ],
      scope_shift: [
        'Getting preachy or sounding like a TED talk',
        'Universal claims that don\'t follow from the specific',
        'Losing the personal in pursuit of the profound',
      ],
      resonant_image: [
        'Choosing images that don\'t resonate',
        'Over-explaining what the image means',
        'Images that feel random rather than meaningful',
      ],

      // OPENING TECHNIQUES
      medias_res: [
        'Starting at a moment that doesn\'t hook the reader',
        'Confusing the reader with too little context',
        'Starting with action but losing the reader',
      ],
      sensory_hook: [
        'Opening details that are weird but not interesting',
        'Details that don\'t connect to the larger story',
        'Trying too hard to be attention-grabbing',
      ],
      dialogue_opener: [
        'Dialogue that doesn\'t raise interesting questions',
        'Starting with dialogue that sounds written',
        'Opening words that need too much context',
      ],
      unexpected_detail: [
        'Being unexpected for its own sake',
        'Details that are quirky but don\'t reveal character',
        'Trying too hard to be different',
      ],

      // WHY US ESSAY
      specific_program_connection: [
        'Mentioning programs without explaining your connection to them',
        'Sounding like you just read the website',
        'Connections that could apply to any interested student',
      ],
      professor_course_fit: [
        'Name-dropping professors you haven\'t actually researched',
        'Claiming interest in work you don\'t understand',
        'Being too fawning or sycophantic',
      ],
      non_googleable_detail: [
        'Details that are too obscure or insider-y',
        'Trying too hard to prove you\'ve done research',
        'Details that don\'t matter to your actual fit',
      ],
      authentic_why: [
        'Reasons that sound generic despite being specific',
        'Conflating prestige with genuine fit',
        'Being honest about the wrong things (prestige, rankings)',
      ],

      // WHY MAJOR
      origin_moment: [
        'Cliché origin stories ("I\'ve always been fascinated by...")',
        'Origins that don\'t lead anywhere',
        'Making up an origin that didn\'t really happen',
      ],
      question_evolution: [
        'Questions that sound like textbook chapter titles',
        'Evolution that seems too neat or linear',
        'Current questions that aren\'t actually interesting',
      ],
      intellectual_progression: [
        'Progression that sounds like a resume',
        'Leaving out the messy parts',
        'Making yourself sound more expert than you are',
      ],
      future_questions: [
        'Questions that are too broad or obvious',
        'Pretending to know more about the field than you do',
        'Questions that don\'t connect to your specific interests',
      ],

      // ACTIVITY ESSAY
      specific_contribution: [
        'Contributions that sound inflated',
        'Taking credit for group accomplishments',
        'Being too modest and not showing actual impact',
      ],
      pivotal_moment: [
        'Moments that don\'t feel pivotal enough',
        'Over-dramatizing ordinary moments',
        'Pivots that don\'t reveal character',
      ],
      unexpected_lesson: [
        'Lessons that aren\'t actually unexpected',
        'Trying too hard to be surprising',
        'Lessons that don\'t connect to who you are',
      ],
      growth_through_action: [
        'Claiming growth without demonstrating it',
        'Making small changes sound revolutionary',
        'Not showing enough specific action',
      ],

      // STRUCTURE
      in_medias_res: [
        'Dropping readers into a moment that doesn\'t grip them',
        'Too little context to understand what\'s happening',
        'Action that feels arbitrary rather than climactic',
      ],
      thematic_threading: [
        'Threads that feel forced or artificial',
        'Returning to images without adding new meaning',
        'Threads that distract from the main story',
      ],
      circular_structure: [
        'Returning to the beginning without showing change',
        'Making the circle feel like repetition',
        'Forcing circularity when linear would work better',
      ],
      tension_pacing: [
        'False tension that feels manufactured',
        'Pacing that confuses rather than engages',
        'Resolving tension too quickly or too slowly',
      ],

      // TRANSITIONS
      implicit_connection: [
        'Connections so implicit readers get lost',
        'Paragraph order that doesn\'t make logical sense',
        'Assuming readers see connections they don\'t',
      ],
      echo_transition: [
        'Echoes that feel repetitive rather than connective',
        'Echoes that are too subtle to notice',
        'Echoes that don\'t add meaning',
      ],
      contrast_pivot: [
        'Forcing contrast where none exists',
        'Pivots that feel like whiplash',
        'Contrast that undermines your argument',
      ],
      question_bridge: [
        'Questions that feel rhetorical or forced',
        'Not actually addressing the question you raise',
        'Questions that interrupt flow rather than create it',
      ],
      complexity_acceptance: [
        'Overthinking to the point of paralysis',
        'Using complexity as an excuse to avoid taking positions',
        'Making everything uncertain—some things can be clear',
      ],
      open_question: [
        'Questions that feel like cop-outs rather than genuine wondering',
        'Ending with questions that should have been answered',
        'Questions that are too vague or abstract',
      ],
    };
    return mistakes[category] || ['Don\'t overdo it', 'Stay authentic'];
  }

  private getCollegeInsight(collegeId: string, issueType: IssueType): string | undefined {
    const insights: Record<string, Record<string, string>> = {
      Stanford: {
        telling_not_showing: 'Stanford\'s separate IV rating means they specifically screen for genuine intellectual engagement. Showing beats telling especially here.',
        performative_intelligence: 'Stanford\'s IV rating distinguishes "truly thinking minds" from credential collectors. Simple, genuine curiosity trumps vocabulary.',
      },
      MIT: {
        telling_not_showing: 'MIT values "intellectual independence and creative risk-taking." Show specific projects and explorations, not claimed passions.',
        missing_systems_awareness: 'MIT\'s prompt about "doing something different" rewards recognizing systemic constraints.',
      },
      Harvard: {
        cliche_inspirational: 'Harvard\'s Intellectual Vitality Initiative emphasizes "engagement with competing views." Show complexity, not resolution.',
        strategic_vulnerability: 'Harvard emphasizes "humility, respect, and genuine curiosity." Let authenticity emerge organically.',
      },
    };
    return insights[collegeId]?.[issueType];
  }
}

// ============================================================================
// INDUSTRY CONTEXT HELPERS
// For enhancing "why this matters" messaging with research-backed justification
// ============================================================================

/**
 * Get research-backed justification for why deep feedback matters
 * Use this to enhance "why_matters" sections with industry context
 */
export function getIndustryContextForFeedback(): {
  justification: string;
  essayImportance: { hours: string; proportion: string; context: string };
  quickStats: {
    essayPhaseHours: string;
    helpfulnessThreshold: string;
    satisfactionDifference: string;
    outcomeMultiplier: string;
  };
} {
  return {
    justification: getDeepFeedbackJustification(),
    essayImportance: getEssayEditingImportance(),
    quickStats: getQuickStats(),
  };
}

/**
 * Enhance a "why this matters" message with industry context
 * Adds research-backed weight to the feedback
 */
export function enhanceWhyMattersWithContext(
  baseMessage: string,
  includeStats: boolean = false
): string {
  const context = getIndustryContextForFeedback();

  let enhanced = baseMessage;

  if (includeStats) {
    enhanced += `\n\n**Industry Research Context:** Essay work is the most time-consuming phase of college counseling (${context.essayImportance.hours}), and it's where students first feel genuinely helped. This is why we invest in deep, comprehensive feedback rather than surface-level suggestions.`;
  }

  return enhanced;
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const researchBackedTeachingService = new ResearchBackedTeachingService();

// Export class for testing
export { ResearchBackedTeachingService };
