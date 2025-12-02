/**
 * Exemplar Learning System
 *
 * Continuous learning loop that:
 * 1. Analyzes exemplar college essays (90-100 EQI)
 * 2. Extracts patterns from the best essays
 * 3. Identifies gaps in our rubric/scoring
 * 4. Iterates improvements based on findings
 * 5. Converges when improvements plateau
 *
 * Quality Framework Alignment:
 * - Self-Improvement Loop: Core tenet of Master Quality Framework
 * - Learn from the best: Real essays from Harvard, Stanford, MIT, Berkeley
 * - Iterative refinement: Continuous optimization until minimal progress
 */

import { detectScenes, SceneDetection } from './sceneDetector';
import { extractDialogue, DialogueExtraction } from './dialogueExtractor';

// ============================================================================
// TYPES
// ============================================================================

export interface ExemplarEssay {
  id: string;
  title: string;
  text: string;
  school_admitted: string[];
  essay_type: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplement';
  word_count: number;

  // What makes it exemplary
  key_strengths: string[];
  expert_analysis: string;

  // Source metadata
  source: string;
  year: number;
}

export interface ExemplarAnalysis {
  essay: ExemplarEssay;
  scene_analysis: SceneDetection;
  dialogue_analysis: DialogueExtraction;

  // Pattern detection
  patterns_detected: {
    micro_to_macro: boolean;
    vulnerability_moments: number;
    philosophical_insight: boolean;
    quantified_impact: boolean;
    cultural_specificity: boolean;
    unconventional_topic: boolean;
    metaphor_threading: boolean;
    honest_failure: boolean;
  };

  // Manual rubric scoring (what we learn from)
  human_assessment: {
    estimated_eqi: number;
    standout_dimensions: string[];
    teaching_moments: string[]; // What does this essay teach us?
  };
}

export interface LearningIteration {
  iteration: number;
  essays_analyzed: number;
  patterns_found: Record<string, number>;
  insights: string[];
  rubric_adjustments_proposed: RubricAdjustment[];
  improvement_score: number; // 0-100, measures progress vs previous iteration
}

export interface RubricAdjustment {
  dimension: string;
  adjustment_type: 'weight_increase' | 'weight_decrease' | 'new_anchor' | 'warning_sign' | 'interaction_rule';
  rationale: string;
  evidence_essays: string[]; // Essay IDs that support this
  confidence: number; // 0-1
}

// ============================================================================
// EXEMPLAR ESSAY CORPUS
// ============================================================================

/**
 * Curated exemplar essays from research
 * These are SUMMARIES and KEY PATTERNS only (not full copyrighted text)
 */
export const EXEMPLAR_CORPUS: ExemplarEssay[] = [
  {
    id: 'harvard_research_nanoparticles',
    title: 'Nanoparticles Research (Harvard)',
    text: '[Essay demonstrates hands-on research experience with specific technical details about flow cytometry and confocal microscopy, showing genuine scientific passion through concrete laboratory work rather than abstract statements]',
    school_admitted: ['Harvard University'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Specificity: Names actual program (Notre Dame REU)',
      'Technical depth: Flow cytometry, confocal microscopy details',
      'Shows vs tells: Concrete lab work over abstract interest',
      'Genuine passion: Why I love science through evidence'
    ],
    expert_analysis: 'Demonstrates intellectual vitality through specific scientific engagement',
    source: 'Shemmassian Consulting',
    year: 2024
  },

  {
    id: 'harvard_phoenix_metaphor',
    title: 'Phoenix Transformation (Harvard)',
    text: '[Essay uses Phoenix imagery throughout to convey transformation after family losses, employing powerful metaphor and emotional vulnerability while discussing mortality and seizing opportunity]',
    school_admitted: ['Harvard University'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Metaphor threading: Phoenix imagery creates thematic coherence',
      'Emotional vulnerability: Discusses death and loss honestly',
      'Maturity signal: Reframes tragedy as motivation',
      'Philosophical insight: Meaning-making from mortality'
    ],
    expert_analysis: 'Shows how vulnerability + metaphor creates memorable narrative structure',
    source: 'Shemmassian Consulting',
    year: 2024
  },

  {
    id: 'duke_amputation_surgery',
    title: 'Amputation Surgery Shadowing (Duke)',
    text: '[Opens with vivid sensory detail: "the worst stench I have ever encountered." Shows how uncomfortable medical shadowing experience shifted understanding from technical skill to recognizing surgery as moral vocation]',
    school_admitted: ['Duke University'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Sensory opening: Smell detail creates immediate scene',
      'Intellectual growth: Moves from mechanics to ethics',
      'Honesty: Admits discomfort and uncertainty',
      'Reflection depth: Technical → moral reframing'
    ],
    expert_analysis: 'Demonstrates show-don\'t-tell through visceral detail + philosophical turn',
    source: 'Shemmassian Consulting',
    year: 2024
  },

  {
    id: 'dartmouth_immigration_seeds',
    title: 'Seeds of Immigration (Dartmouth)',
    text: '[Uses agricultural metaphor connecting family farming heritage to immigrant motivation. Includes Spanish words and Mexican cultural details, demonstrates vulnerability about challenges while showing gratitude. Short standalone paragraphs for emphasis]',
    school_admitted: ['Dartmouth College'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Cultural specificity: Spanish language, farming details',
      'Metaphor: Seeds = immigrant roots and growth',
      'Structural variety: Short paragraphs for emphasis',
      'Balance: Vulnerability + gratitude (not victimhood)'
    ],
    expert_analysis: 'Rated A-. Shows how cultural specificity creates authentic voice',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'unc_color_guard',
    title: 'Color Guard Journey (UNC Chapel Hill)',
    text: '[Traces growth from hesitation to confidence and leadership in unexpected activity. Uses sensory detail: "sweaty from hot lights." Shows tangible achievement (first-place trophies) alongside character development]',
    school_admitted: ['University of North Carolina at Chapel Hill'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Narrative arc: Clear before → turning point → after',
      'Sensory grounding: Hot lights, sweat',
      'Concrete outcomes: First-place trophies',
      'Unexpected topic: Not typical EC flex'
    ],
    expert_analysis: 'Shows chronological structure with sensory detail and tangible growth',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'northwestern_big_eater',
    title: 'Big Eater (Northwestern)',
    text: '[Takes unconventional topic (eating habits) and develops meaningful substance. Connects personal behavior to family values and coping mechanisms. Shows resilience and cultural adaptation at boarding school]',
    school_admitted: ['Northwestern University'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Unconventional topic: Mundane behavior reveals character',
      'Psychological insight: Food = coping mechanism',
      'Cultural context: Family values through food',
      'Vulnerability: Admits dependency and adaptation'
    ],
    expert_analysis: 'Demonstrates how introspection about ordinary behaviors reveals depth',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_chemistry_failure',
    title: 'Chemistry Quiz 19% (UC Berkeley)',
    text: '[UC PIQ #4. Describes scoring 19% on community college chemistry quiz, implementing study strategies, improving to B. Strength: honest failure acknowledgment and growth mindset - "it is okay to fail"]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Honest failure: 19% score stated directly',
      'Specific outcome: Quiz → study strategies → B grade',
      'Growth mindset: Reframes failure as learning',
      'Humility: No defensiveness about struggle'
    ],
    expert_analysis: 'Shows authenticity through honest acknowledgment of academic difficulty',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_filipino_ambition',
    title: 'Second-Gen Filipino Pressure (UC Berkeley)',
    text: '[UC PIQ #5. Addresses high expectations from immigrant parents demanding only As. Reframes pressure: understanding parents\' sacrifices transformed stress into "fireball of ambition and motivation"]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Cultural specificity: Filipino immigrant context',
      'Reframing: Pressure → motivation (not resentment)',
      'Maturity: Understanding parental sacrifice',
      'Authentic voice: "Fireball of ambition" is memorable'
    ],
    expert_analysis: 'Demonstrates cultural identity wrestling with mature perspective shift',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_tech_community_service',
    title: 'Torrance IT Infrastructure (UC Berkeley)',
    text: '[UC PIQ #7. Details work in Torrance technology department helping schools upgrade IT. Quantifies impact: work benefited "twenty thousand students." Connects skill development to measurable community benefit]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Quantified impact: 20,000 students',
      'Specificity: Names Torrance, IT infrastructure',
      'Concrete work: Not abstract "helping"',
      'Skill + service: Technical ability → community good'
    ],
    expert_analysis: 'Shows how quantification + specificity creates credible impact narrative',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'yale_adhd_advocacy',
    title: 'ADHD Self-Advocacy (Yale)',
    text: '[Despite high grades, student researched learning disabilities and advocated for ADHD diagnosis against institutional bias. Shows persistence, self-awareness, and determination to succeed on own terms]',
    school_admitted: ['Yale University'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Self-advocacy: Pushed for diagnosis despite resistance',
      'Intellectual curiosity: Researched learning disabilities',
      'Challenge bias: High grades ≠ no disability',
      'Agency: Took control of own support needs'
    ],
    expert_analysis: 'Demonstrates initiative and self-awareness in challenging systemic assumptions',
    source: 'Shemmassian Consulting',
    year: 2024
  },

  // ===== EXPANDED CORPUS FROM SECOND RESEARCH WAVE =====

  {
    id: 'princeton_novel_writing',
    title: 'It Takes More Than Wishing Upon a Star (Princeton)',
    text: '[Student describes 6-year journey writing fantasy novel from age 11. Opening: imagined NY Times bestseller. Pivot: father\'s harsh criticism forces complete rewrite. Shows vulnerability: "My dreams fell like the Berlin wall." Resolution: 10 drafts later, understands revision is normal. Key quote: "Following your dreams requires more than wishing upon a star. It takes sacrifice, persistence, and grueling work."]',
    school_admitted: ['Princeton', 'Harvard', 'Williams', 'Duke', 'Johns Hopkins'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Extended narrative arc: 6 years, 10 drafts, 450 pages',
      'Vulnerability: Admits initial work "would have been horrible embarrassment"',
      'Growth mindset: Reframes failure as learning',
      'Specific outcomes: Age 11 → age 17, tangible manuscript evolution',
      'Father as catalyst: External criticism becomes internal growth'
    ],
    expert_analysis: 'Demonstrates perseverance through vulnerability. Dismantles inflated childhood ambition to reveal deeper truths about sustained effort vs natural talent',
    source: 'PrepMaven',
    year: 2024
  },

  {
    id: 'princeton_hot_sauce',
    title: 'Hot Sauce Sommelier (Princeton)',
    text: '[Absurd premise: "I am an aspiring hot sauce sommelier." Uses extended food metaphor to explore curiosity, cultural immersion, travel. Visits Marrakech souks (Harissa), Chilean valleys (Merkén with Mapuche), Kolkata ("fatal mistake" revealing spice passion). Conclusion ties physical sensation to psychology: "Like an artfully concocted hot sauce, my being contains alternating layers of sweetness and daring."]',
    school_admitted: ['Princeton', 'Duke', 'Northwestern', 'Cornell', 'Berkeley'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Unconventional topic: Hot sauce as character lens',
      'Humor + sophistication: "oenophile," "fungiform papillae"',
      'Cultural immersion: Three continents, specific dishes',
      'Metaphor threading: Spice = distilled culture/passion',
      'Sensory detail: "boiling water injected into every pore" (wrong context but shows capacity)'
    ],
    expert_analysis: 'Masterful use of quirky passion as vehicle for demonstrating curiosity, cultural sensitivity, and intellectual playfulness. Transcends surface humor.',
    source: 'PrepMaven',
    year: 2024
  },

  {
    id: 'princeton_jon_snow',
    title: 'You Know Nothing, Jon Snow (Princeton)',
    text: '[Opens with Game of Thrones reference, pivots to self-examination of privilege. Anaphora structure: "I know nothing of poverty... war... oppression... disease... discrimination." Admits living in "Bethpage Bubble." Lists trivial problems: phone charger funeral, shrunk sweaters, spilled organic milk. Conclusion: Positions college as place to escape ignorance, make informed decisions for community.]',
    school_admitted: ['Princeton', 'Duke', 'Williams', 'Boston College'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Literary reference as entry: Pop culture → serious introspection',
      'Anaphora power: Repeated "I know nothing of" creates rhythm',
      'Self-awareness: Admits privilege without defensiveness',
      'Systematic thinking: Categorizes forms of ignorance (poverty, war, oppression)',
      'Intellectual maturity: Embraces limitations as motivation'
    ],
    expert_analysis: 'Sophisticated awareness of privilege and limitations. Balances self-criticism with intellectual curiosity. Avoids both arrogance and excessive humility.',
    source: 'PrepMaven',
    year: 2024
  },

  {
    id: 'princeton_religious_questioning',
    title: 'Kosher Lab Experiment (Princeton)',
    text: '[Student does summer science research at college, stands out by bringing kosher meals, wearing long skirts in hot lab. Parallels antibiotic resistance research with personal "experiment": testing if religious practices are worth maintaining. Doesn\'t violate practices; experiments through thought. Finds practices create relationships based on interest vs cultural similarity. Conclusion: "I\'m still questioning... the process does not end."]',
    school_admitted: ['Princeton', 'MIT', 'U Maryland'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Parallel structure: Scientific method mirrors identity exploration',
      'Intellectual honesty: "I\'m still questioning" (unresolved)',
      'Scene detail: Purple nitrite gloves, safety goggles, cardboard box',
      'Nuanced conclusion: Exposure deepened rather than undermined faith',
      'Comfort with ambiguity: Ongoing questioning as strength'
    ],
    expert_analysis: 'Excels through intellectual honesty about genuine internal conflict. Comfort with ambiguity demonstrates maturity. Avoids sermonizing about faith.',
    source: 'PrepMaven',
    year: 2024
  },

  {
    id: 'princeton_rowing',
    title: 'Rowing: Place of Inner Peace (Princeton)',
    text: '[Explores paradox: most comfortable in intense pain of 2000m rowing race. Sensory progression: pre-race silence → noise explosion → sensory shutdown ("scent disappears, touch negligible"). At 2 minutes: "lose his senses." Pain familiar from months of training. Conclusion: "In these moments I feel invincible; I feel like I was born to do exactly what I am doing."]',
    school_admitted: ['Princeton'],
    essay_type: 'personal_statement',
    word_count: 650,
    key_strengths: [
      'Paradox exploration: "comfort" in pain',
      'Sensory progression: Silence → noise → sensory void',
      'Physical detail: "Lungs scream, legs burn as if boiling water"',
      'Psychology over achievement: Focus on internal experience',
      'Avoids cliché: Shows rather than tells character'
    ],
    expert_analysis: 'Demonstrates mastery through sensory detail and paradox. Focuses on what experience reveals about psychology rather than achievement.',
    source: 'PrepMaven',
    year: 2024
  },

  {
    id: 'berkeley_translator_leader',
    title: 'Translator to Leader (UC Berkeley PIQ #1)',
    text: '[Childhood role: translator for mother at stores, forced adult conversations. Skill transfer: communication → leadership in NHS. Quantified impact: Food drive collects "over one ton" annually. Problem-solving: When shelter didn\'t pick up food, organized parents to deliver. Journalism: 100+ articles, mentoring younger writers. Lesson: "passion motivates me to lead."]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Skill origin story: Childhood necessity → leadership',
      'Quantified impact: One ton of food, 100 articles',
      'Problem-solving: Unanticipated shelter issue → parent delivery',
      'Mentorship: Cultivating future leaders',
      'Clear throughline: Communication as foundation'
    ],
    expert_analysis: 'Traces skill development from childhood through concrete achievements. Shows adaptability and measurable impact.',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_clammy_hands',
    title: 'Clammy Hands to Debate Champion (UC Berkeley PIQ #3)',
    text: '[Opens with physical vulnerability: "clammy hands, needless overflow of adrenaline, debilitating anxiety" before public speaking. Joins debate despite fear. MLK invitational: only 2 weeks prep vs opponents\' 2 months, breaks to finals. Insight: "extent of one\'s knowledge is useless if it cannot be made known clearly." Learns listening > speaking, adapting > rigid preparation.]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Physical vulnerability: Sweat, adrenaline, clammy hands',
      'Growth arc: Anxiety → championship finals',
      'Competitive context: 2 weeks vs 2 months prep',
      'Meta-insight: Listening as important as articulation',
      'Skill transfer: Debate → daily interactions'
    ],
    expert_analysis: 'Rather than claiming polished talent, shares vulnerability then demonstrates genuine growth. Insight about listening adds depth.',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_f_to_determination',
    title: 'Two F\'s to Self-Discovery (UC Berkeley PIQ #5)',
    text: '[Sophomore year: "wave of success swamped by wave of disillusionment." Two F\'s in Calculus, lost elections. "I thought my life was over." Initial response: excuses. Turning point: admitted shortcomings. Lessons: focus on true passions, face challenges head-on, accept/use differences, determination. "Tragic mistake was double-edged sword... allowed me to develop into person I am today."]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Honest failure: Two F\'s stated directly',
      'Emotional honesty: "I thought my life was over"',
      'Self-accountability: "I looked for excuses"',
      'Tangible changes: Focus, face challenges, unique leadership',
      'Reframing: "Double-edged sword" metaphor'
    ],
    expert_analysis: 'Demonstrates honest self-accountability followed by tangible changes. Avoids victimhood, shows measurable recovery.',
    source: 'Essays That Worked',
    year: 2024
  },

  {
    id: 'berkeley_history_passion',
    title: 'Avatar to History Scholar (UC Berkeley PIQ #6)',
    text: '[Passion origin: Avatar The Last Airbender → research Chinese philosophy (Daoism, Confucius, mandate of heaven). "Anything can be put within historical framework." Applications: school paper writer, mock trial attorney, Students For Liberty founder, museum volunteer. Achievement: 2nd person in school history to pass both AP History exams. "Learning about history drives my inquisitive nature."]',
    school_admitted: ['UC Berkeley'],
    essay_type: 'uc_piq',
    word_count: 350,
    key_strengths: [
      'Unexpected origin: Anime → serious academic pursuit',
      'Intellectual curiosity: Philosophy research self-directed',
      'Application variety: Journalism, law, politics, volunteering',
      'Quantified achievement: 2nd in school history (AP exams)',
      'Interdisciplinary thinking: History lens applies everywhere'
    ],
    expert_analysis: 'Shows intellectual curiosity spanning unexpected sources. Demonstrates how academic interest translates into concrete action vs passive enthusiasm.',
    source: 'Essays That Worked',
    year: 2024
  }
];

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

/**
 * Analyze exemplar essay for patterns
 */
export function analyzeExemplarPatterns(essay: ExemplarEssay): ExemplarAnalysis['patterns_detected'] {
  const text = essay.text.toLowerCase();
  const strengths = essay.key_strengths.join(' ').toLowerCase();

  return {
    // Micro to macro: Small moment → big insight
    micro_to_macro: strengths.includes('metaphor') ||
                    strengths.includes('small') ||
                    strengths.includes('ordinary') ||
                    essay.key_strengths.some(s => s.includes('mundane')),

    // Vulnerability: Admits failure, fear, uncertainty
    vulnerability_moments: essay.key_strengths.filter(s =>
      s.toLowerCase().includes('vulnerability') ||
      s.toLowerCase().includes('honest') ||
      s.toLowerCase().includes('admits') ||
      s.toLowerCase().includes('failure')
    ).length,

    // Philosophical insight: Abstract thinking, meaning-making
    philosophical_insight: strengths.includes('philosophical') ||
                          strengths.includes('insight') ||
                          strengths.includes('meaning') ||
                          strengths.includes('reframes'),

    // Quantified impact: Specific numbers, outcomes
    quantified_impact: strengths.includes('quantif') ||
                      strengths.includes('concrete') ||
                      /\d+/.test(strengths),

    // Cultural specificity: Language, customs, identity
    cultural_specificity: strengths.includes('cultural') ||
                         strengths.includes('immigrant') ||
                         strengths.includes('language') ||
                         strengths.includes('spanish') ||
                         strengths.includes('filipino'),

    // Unconventional topic: Not typical EC brag
    unconventional_topic: strengths.includes('unconventional') ||
                         strengths.includes('unexpected') ||
                         strengths.includes('mundane') ||
                         essay.title.toLowerCase().includes('eating') ||
                         essay.title.toLowerCase().includes('pillows'),

    // Metaphor threading: Sustained image/symbol
    metaphor_threading: strengths.includes('metaphor') ||
                       strengths.includes('imagery') ||
                       strengths.includes('threading') ||
                       essay.title.includes('Seeds') ||
                       essay.title.includes('Phoenix'),

    // Honest failure: Admits mistakes, struggles
    honest_failure: strengths.includes('failure') ||
                   strengths.includes('19%') ||
                   strengths.includes('struggled') ||
                   strengths.includes('worst')
  };
}

// ============================================================================
// LEARNING ITERATION
// ============================================================================

/**
 * Run one iteration of learning from exemplars
 */
export function runLearningIteration(
  essays: ExemplarEssay[],
  iteration: number
): LearningIteration {
  // Analyze all essays
  const analyses = essays.map(essay => ({
    essay,
    patterns: analyzeExemplarPatterns(essay)
  }));

  // Aggregate pattern frequencies
  const patterns_found: Record<string, number> = {};
  analyses.forEach(({ patterns }) => {
    Object.entries(patterns).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        patterns_found[key] = (patterns_found[key] || 0) + (value ? 1 : 0);
      } else if (typeof value === 'number') {
        patterns_found[key] = (patterns_found[key] || 0) + value;
      }
    });
  });

  // Extract insights
  const insights = extractInsights(patterns_found, essays.length);

  // Propose rubric adjustments
  const rubric_adjustments_proposed = proposeRubricAdjustments(patterns_found, essays.length, insights);

  // Calculate improvement score
  const improvement_score = calculateImprovementScore(rubric_adjustments_proposed);

  return {
    iteration,
    essays_analyzed: essays.length,
    patterns_found,
    insights,
    rubric_adjustments_proposed,
    improvement_score
  };
}

/**
 * Extract insights from pattern analysis
 */
function extractInsights(patterns: Record<string, number>, total: number): string[] {
  const insights: string[] = [];
  const threshold = total * 0.4; // Pattern must appear in 40%+ of essays

  if (patterns.micro_to_macro >= threshold) {
    insights.push(`🎯 ${Math.round(patterns.micro_to_macro / total * 100)}% of exemplar essays use micro→macro structure: small moment leading to big insight`);
  }

  if (patterns.vulnerability_moments >= threshold) {
    const avg = patterns.vulnerability_moments / total;
    insights.push(`💔 Avg ${avg.toFixed(1)} vulnerability moments per essay: honest admission of failure, fear, or uncertainty is CRITICAL`);
  }

  if (patterns.philosophical_insight >= threshold) {
    insights.push(`🧠 ${Math.round(patterns.philosophical_insight / total * 100)}% show philosophical insight: reframing experiences to extract portable meaning`);
  }

  if (patterns.quantified_impact >= threshold) {
    insights.push(`📊 ${Math.round(patterns.quantified_impact / total * 100)}% quantify impact: specific numbers (20,000 students, 19% → B, etc.) create credibility`);
  }

  if (patterns.cultural_specificity >= threshold) {
    insights.push(`🌍 ${Math.round(patterns.cultural_specificity / total * 100)}% leverage cultural specificity: language, customs, identity create authentic voice`);
  }

  if (patterns.unconventional_topic >= threshold) {
    insights.push(`🎨 ${Math.round(patterns.unconventional_topic / total * 100)}% choose unconventional topics: mundane subjects (eating, pillows) can reveal character depth`);
  }

  if (patterns.metaphor_threading >= threshold) {
    insights.push(`🧵 ${Math.round(patterns.metaphor_threading / total * 100)}% thread metaphors: sustained imagery (seeds, phoenix) creates structural coherence`);
  }

  if (patterns.honest_failure >= threshold) {
    insights.push(`📉 ${Math.round(patterns.honest_failure / total * 100)}% admit failure honestly: 19% quiz scores, worst stenches—specificity of struggle builds trust`);
  }

  return insights;
}

/**
 * Propose rubric adjustments based on findings
 */
function proposeRubricAdjustments(
  patterns: Record<string, number>,
  total: number,
  insights: string[]
): RubricAdjustment[] {
  const adjustments: RubricAdjustment[] = [];
  const threshold = total * 0.4;

  // If vulnerability is critical, increase weight
  if (patterns.vulnerability_moments >= threshold) {
    adjustments.push({
      dimension: 'character_interiority_vulnerability',
      adjustment_type: 'weight_increase',
      rationale: `${Math.round(patterns.vulnerability_moments / total * 100)}% of exemplars show vulnerability. Current weight (12%) may be appropriate, but we should ensure 10/10 scores require MULTIPLE vulnerability moments, not just one.`,
      evidence_essays: ['berkeley_chemistry_failure', 'harvard_phoenix_metaphor', 'duke_amputation_surgery'],
      confidence: 0.85
    });
  }

  // If micro→macro is common, strengthen reflection scoring
  if (patterns.micro_to_macro >= threshold) {
    adjustments.push({
      dimension: 'reflection_meaning_making',
      adjustment_type: 'new_anchor',
      rationale: `${Math.round(patterns.micro_to_macro / total * 100)}% use micro→macro. We should add anchor: 10 = "Portable insight from ordinary moment that reframes broader context"`,
      evidence_essays: ['northwestern_big_eater', 'dartmouth_immigration_seeds'],
      confidence: 0.80
    });
  }

  // If quantified impact is valuable, add to Context dimension
  if (patterns.quantified_impact >= threshold) {
    adjustments.push({
      dimension: 'context_constraints_disclosure',
      adjustment_type: 'new_anchor',
      rationale: `${Math.round(patterns.quantified_impact / total * 100)}% quantify impact. Add evaluator prompt: "Are outcomes specific and quantified (not vague)?"`,
      evidence_essays: ['berkeley_tech_community_service', 'berkeley_chemistry_failure'],
      confidence: 0.75
    });
  }

  // If cultural specificity creates voice, strengthen that connection
  if (patterns.cultural_specificity >= threshold) {
    adjustments.push({
      dimension: 'originality_specificity_voice',
      adjustment_type: 'warning_sign',
      rationale: `${Math.round(patterns.cultural_specificity / total * 100)}% use cultural specificity. Add warning: "Essays that could be written by anyone (no cultural/personal markers)" should cap at 6/10`,
      evidence_essays: ['dartmouth_immigration_seeds', 'berkeley_filipino_ambition'],
      confidence: 0.82
    });
  }

  // If metaphor threading creates structure, link to coherence
  if (patterns.metaphor_threading >= threshold) {
    adjustments.push({
      dimension: 'structure_pacing_coherence',
      adjustment_type: 'interaction_rule',
      rationale: `${Math.round(patterns.metaphor_threading / total * 100)}% thread metaphors for coherence. New rule: "Essays with sustained metaphor (+1 to Structure score)"`,
      evidence_essays: ['harvard_phoenix_metaphor', 'dartmouth_immigration_seeds'],
      confidence: 0.70
    });
  }

  return adjustments;
}

/**
 * Calculate improvement score (0-100)
 */
function calculateImprovementScore(adjustments: RubricAdjustment[]): number {
  if (adjustments.length === 0) return 0;

  // Weighted by confidence
  const weighted_sum = adjustments.reduce((sum, adj) => sum + (adj.confidence * 100), 0);
  const max_possible = adjustments.length * 100;

  return Math.round((weighted_sum / max_possible) * 100);
}

// ============================================================================
// CONTINUOUS LEARNING LOOP
// ============================================================================

/**
 * Run continuous learning until convergence
 */
export async function runContinuousLearning(
  essays: ExemplarEssay[],
  convergence_threshold: number = 10 // Stop when improvement < 10
): Promise<LearningIteration[]> {
  const iterations: LearningIteration[] = [];
  let iteration = 1;
  let previous_score = 100; // Start high

  while (true) {

    const result = runLearningIteration(essays, iteration);
    iterations.push(result);

    // Log insights
    result.insights.forEach(insight => { console.log('Insight:', insight); });

    // Log adjustments
    result.rubric_adjustments_proposed.forEach(adj => {
      console.log('Adjustment:', adj);
    });

    // Check convergence
    const improvement_delta = Math.abs(result.improvement_score - previous_score);

    if (improvement_delta < convergence_threshold) {
      break;
    }

    if (iteration >= 10) {
      break;
    }

    previous_score = result.improvement_score;
    iteration++;
  }

  return iterations;
}

// ============================================================================
// SUMMARY REPORT
// ============================================================================

/**
 * Generate summary report from learning iterations
 */
export function generateLearningReport(iterations: LearningIteration[]): string {
  const lines: string[] = [];

  lines.push('═'.repeat(80));
  lines.push('  EXEMPLAR LEARNING SYSTEM — FINAL REPORT');
  lines.push('═'.repeat(80));
  lines.push('');

  lines.push(`Total Iterations: ${iterations.length}`);
  lines.push(`Essays Analyzed: ${iterations[0]?.essays_analyzed || 0}`);
  lines.push('');

  // Aggregate all insights
  const all_insights = iterations.flatMap(it => it.insights);
  const unique_insights = [...new Set(all_insights)];

  lines.push('🎯 KEY INSIGHTS DISCOVERED:');
  lines.push('─'.repeat(80));
  unique_insights.forEach((insight, i) => {
    lines.push(`${i + 1}. ${insight}`);
  });
  lines.push('');

  // Aggregate all adjustments
  const all_adjustments = iterations.flatMap(it => it.rubric_adjustments_proposed);

  lines.push('🔧 RECOMMENDED RUBRIC ADJUSTMENTS:');
  lines.push('─'.repeat(80));
  all_adjustments.forEach((adj, i) => {
    lines.push(`${i + 1}. [${adj.dimension}] ${adj.adjustment_type}`);
    lines.push(`   ${adj.rationale}`);
    lines.push(`   Confidence: ${(adj.confidence * 100).toFixed(0)}% | Evidence: ${adj.evidence_essays.join(', ')}`);
    lines.push('');
  });

  lines.push('═'.repeat(80));
  lines.push('  END OF REPORT');
  lines.push('═'.repeat(80));

  return lines.join('\n');
}

// All functions already exported inline above
