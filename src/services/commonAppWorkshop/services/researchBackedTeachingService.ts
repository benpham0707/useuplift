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
  | 'incremental_revelation';

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
      sensory_details: 'Add specific sensory details (what you saw, heard, smelled, felt) to ground abstract claims in concrete reality.',
      scene_construction: 'Build a moment with setting, action, and dialogue rather than summarizing what happened.',
      moment_freezing: 'Pause on a single significant moment and expand it with detail.',
      dialogue_inclusion: 'Include actual words people said to make scenes come alive.',
      voice_preservation: 'Keep your natural speaking voice; avoid vocabulary you wouldn\'t use in conversation.',
      specificity_injection: 'Replace general statements with specific, concrete details.',
      vocabulary_authenticity: 'Use words a 17-year-old would actually use, not thesaurus upgrades.',
      complexity_preservation: 'Maintain the messy, incomplete nature of real growth.',
      ongoing_struggle: 'Show that challenges are still present, not fully overcome.',
      qualified_growth: 'Use qualifiers like "mostly," "sometimes," "I think" to show authentic uncertainty.',
      clarity_over_complexity: 'Simple, precise language demonstrates mastery better than ornate prose.',
      thinking_process: 'Show HOW you think, not just WHAT you concluded.',
      genuine_questions: 'Include questions you\'re still wrestling with.',
      structural_connection: 'Connect your personal experience to broader systems and patterns.',
      pattern_recognition: 'Notice and articulate larger forces at play.',
      context_expansion: 'Place your story within historical, social, or economic context.',
      agency_demonstration: 'Show what you DID, not just what happened TO you.',
      response_focus: 'Emphasize your response to circumstances, not the circumstances themselves.',
      action_over_suffering: 'Let actions reveal resilience rather than claiming it.',
      organic_revelation: 'Let vulnerability emerge naturally from the story.',
      earned_vulnerability: 'Build context that makes vulnerable moments feel necessary.',
      unannounced_honesty: 'Be honest without announcing that you\'re being honest.',
      open_ending: 'End with questions or ongoing complexity rather than neat conclusions.',
      question_preservation: 'Keep some questions unanswered to show intellectual maturity.',
      complexity_acceptance: 'Show comfort with ambiguity and uncertainty.',
      // New techniques for cliche_language and false_epiphany
      image_renovation: 'Take a dead metaphor and make it specific to YOUR experience.',
      incremental_revelation: 'Show understanding building over time rather than arriving suddenly.',
    };
    return descriptions[category] || `Apply ${this.formatTechniqueName(category)} technique.`;
  }

  private getTechniqueSteps(category: string): string[] {
    const steps: Record<string, string[]> = {
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
      voice_preservation: [
        'Read your essay out loud',
        'Circle any word you wouldn\'t say to a friend',
        'Replace elevated vocabulary with natural alternatives',
        'Keep sentences varying in length like natural speech',
      ],
      qualified_growth: [
        'Find claims of complete transformation',
        'Add qualifiers: "mostly," "I think," "sometimes"',
        'Include a recent moment of backsliding or struggle',
        'End with what you\'re still working on',
      ],
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
      sensory_details: [
        'Adding generic sensory clichés ("my heart raced")',
        'Over-doing it with too many details',
        'Choosing details that don\'t support the moment\'s meaning',
      ],
      voice_preservation: [
        'Over-correcting into too casual/slangy',
        'Losing all sentence variety',
        'Removing all sophistication instead of just fake sophistication',
      ],
      qualified_growth: [
        'Undermining yourself too much',
        'Adding qualifiers to everything (over-hedging)',
        'Making it sound like you haven\'t grown at all',
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
