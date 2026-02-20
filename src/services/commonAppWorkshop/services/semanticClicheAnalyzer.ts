// @ts-nocheck
/**
 * Semantic Cliché Analyzer
 *
 * **AI-Powered Deep Cliché Detection**
 *
 * This service goes beyond pattern matching to detect:
 * 1. Topic-level clichés (is the FRAMING cliché, not just the topic?)
 * 2. Narrative arc clichés (predictable redemption arcs, hero journeys)
 * 3. Language-level clichés (AI convergence + essay platitudes)
 * 4. Tell-don't-show violations (claiming emotions instead of showing)
 * 5. Unique angle assessment (has the student made it fresh?)
 *
 * Cost: ~$0.003-0.005 per analysis (Sonnet, ~1000 tokens output)
 *
 * **Key Insight**: A topic like "immigration" isn't inherently cliché.
 * It's the FRAMING that makes it cliché or fresh.
 * "I moved to America and struggled" = cliché
 * "The sound of American rain is wrong" = fresh angle
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import { withRetry } from '../utils/apiRetry';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Topic-level cliché assessment
 */
export interface TopicClicheAssessment {
  // Detected topic (if any common topic)
  topic: string | null;  // e.g., "immigration", "sports_injury", "grandparent_death"

  // Is the FRAMING cliché, not just the topic?
  is_cliche_framing: boolean;

  // How is the topic being approached?
  framing_assessment: 'generic' | 'predictable' | 'developing' | 'fresh' | 'subversive';

  // What unique angle has the student found (if any)?
  unique_angle_detected: string | null;

  // What would make this fresh?
  freshness_opportunity: string;
}

/**
 * Narrative arc cliché assessment
 */
export interface NarrativeArcClicheAssessment {
  // The arc detected (e.g., "hardship → growth → success")
  detected_arc: string;

  // Common arc type
  arc_type:
    | 'redemption'          // Bad thing → learned → better person
    | 'discovery'           // Didn't know → learned → now know
    | 'overcoming'          // Challenge → persevered → succeeded
    | 'realization'         // Ignorant → experienced → enlightened
    | 'passion_origin'      // Since childhood → pursued → now expert
    | 'unique'              // Doesn't fit common patterns
    | 'unclear'             // Can't identify clear arc
    ;

  // How predictable is this arc (1 = very predictable, 10 = unpredictable)?
  predictability_score: number;

  // What makes it predictable or not
  arc_critique: string;

  // How to subvert the expected arc
  suggested_subversion: string;
}

/**
 * Language-level cliché detection
 */
export interface LanguageCliche {
  // The cliché phrase found
  phrase: string;

  // What type of cliché
  type:
    | 'ai_convergence'          // "tapestry", "journey", "invaluable"
    | 'essay_cliche'            // "taught me that", "realized that", "sparked my passion"
    | 'inspirational_platitude' // "hard work pays off", "never give up"
    | 'college_specific'        // "intellectual vitality", "dream school"
    | 'vague_claim'             // "I'm passionate about", "I love learning"
    ;

  // Why it's a cliché
  why_cliche: string;

  // Better alternative
  alternative_approach: string;
}

/**
 * Tell-don't-show violation
 */
export interface TellingNotShowing {
  // The phrase where they're telling instead of showing
  phrase: string;

  // What they're claiming/telling
  what_theyre_telling: string;

  // The quality or emotion they're claiming
  claimed_quality: string;  // e.g., "perseverance", "growth", "passion"

  // How they could show this instead
  how_to_show_instead: string;

  // Example of showing
  showing_example: string;
}

/**
 * Complete semantic cliché analysis
 */
export interface SemanticClicheAnalysis {
  // Topic-level
  topic_assessment: TopicClicheAssessment;

  // Arc-level
  narrative_arc: NarrativeArcClicheAssessment;

  // Language-level clichés found
  language_cliches: LanguageCliche[];

  // Telling instead of showing
  telling_not_showing: TellingNotShowing[];

  // Overall assessment
  overall_cliche_risk: 'low' | 'medium' | 'high' | 'critical';

  // Risk score (0-100, higher = more cliché risk)
  cliche_risk_score: number;

  // What IS working (important to preserve)
  strongest_unique_element: string | null;
  elements_to_preserve: string[];

  // Priority for coaching
  coaching_priority: {
    issue: string;
    why_priority: string;
    coaching_approach: string;
  };

  // Brief summary for prompt injection
  summary_for_prompt: string;
}

/**
 * Options for the analyzer
 */
export interface ClicheAnalyzerOptions {
  // Include college-specific cliché detection
  college_id?: string;

  // Essay type for context
  essay_type?: SupplementalType;

  // Skip AI call and only use patterns (for testing/cost saving)
  pattern_only?: boolean;
}

// ============================================================================
// COMMON ESSAY CLICHÉS (Reference for AI, not for pattern matching)
// ============================================================================

const CLICHE_REFERENCE = {
  // Common topics that need fresh framing
  common_topics: [
    'immigration/cultural adjustment',
    'sports injury/setback',
    'death of grandparent/family member',
    'mission/service trip',
    'winning/losing big game',
    'overcoming academic struggle',
    'finding identity/self-discovery',
    'divorce/family challenge',
    'leadership in club/organization',
  ],

  // Common predictable arcs
  predictable_arcs: [
    'Hardship → Perseverance → Success (redemption arc)',
    'Ignorance → Experience → Enlightenment (service trip arc)',
    'Failure → Learning → Growth (sports injury arc)',
    'Challenge → Adaptation → Belonging (immigration arc)',
    'Since childhood → Pursuit → Expertise (passion origin arc)',
    'Problem → Action → Impact (leadership arc)',
  ],

  // AI convergence phrases to detect
  ai_convergence_phrases: [
    'tapestry', 'journey', 'myriad', 'invaluable', 'transformative',
    'resonate', 'navigate', 'sparked', 'ignited', 'profound',
    'multifaceted', 'intertwined', 'testament to', 'harbored',
    'fostered', 'cultivated', 'instilled', 'honed',
  ],

  // Essay cliché phrases
  essay_cliche_phrases: [
    'little did I know',
    'this experience taught me',
    'I am forever changed',
    'it opened my eyes',
    'I realized that',
    'sparked my passion',
    'transformative experience',
    'profound impact',
    'I learned the importance of',
    'ever since I was a child',
    'for as long as I can remember',
    'I discovered my true passion',
    'it was a turning point',
    'I found my voice',
    'I discovered who I really am',
    // Added from deep research
    'at the end of the day',
    'dare to fail gloriously',
    'think outside the box',
    'passion is my driving force',
    'I grew as a person',
    'it made me who I am today',
    'I gained a new perspective',
    'this opened my eyes to',
  ],

  // Telling-not-showing patterns (EXPANDED from deep research)
  // Source: Perplexity Research on "Show Don't Tell"
  telling_patterns: [
    // Original patterns
    'I learned that...',
    'This taught me...',
    'I realized...',
    'I grew as a person',
    'I became more [adjective]',
    'I am passionate about...',
    'I have always loved...',
    'This experience was important because...',
    'I felt [emotion]',
    'It made me feel [emotion]',

    // GROWTH CLAIMS (from research)
    'taught me resilience',
    'faced challenges',
    'persevered',
    'hard work pays off',
    'overcome obstacles',
    'became more independent',
    'grow up fast',
    'adult responsibilities',
    'developed discipline',
    'healthy habits',
    'self-improvement',

    // PASSION CLAIMS (from research)
    'deeply passionate',
    'immerse myself',
    'infinitely rich possibilities',
    'hope to learn',
    'academic journeys',
    'passionate about',
    'enjoy tinkering',

    // CHARACTER CLAIMS (from research)
    'harness',
    'salient people skills',
    'connect deeply',
    'curious person',
    'loves to learn',
    'detail-oriented',
    'dedicated to',
    'strong communicator',
    'team player',
    'good leader',
    'hard-working',
    'determined',
    'creative',

    // EMOTION LABELS (from research - these should be SHOWN, not stated)
    'I was nervous',
    'I struggled',
    'I was scared',
    'I was excited',
    'I felt happy',
    'I was sad',
    'I was angry',

    // IMPACT CLAIMS (from research)
    'changed my perspective',
    'made me want to pursue',
  ],

  // NEW: Opening clichés (high priority - first impressions)
  opening_cliches: [
    'Ever since I was young',
    'From a young age',
    'I have always',
    'Growing up',
    'Throughout my life',
    'When I was a child',
    'As far back as I can remember',
  ],

  // NEW: Conclusion clichés
  conclusion_cliches: [
    'In conclusion',
    'I am excited to',
    'This is why I want to',
    'All in all',
    'Looking forward',
    'I can\'t wait to',
  ],

  // ============================================================================
  // EMOTIONAL INTELLIGENCE PATTERNS (from EI deep research)
  // Source: Perplexity Research on "Emotional Intelligence & Vulnerability"
  // ============================================================================

  // Performed vulnerability red flags (generic, not genuine)
  performed_vulnerability: [
    'shedding a single tear',
    'heart pounding',
    'butterflies in my stomach',
    'time stood still',
    'my heart sank',
    'tears streaming down my face',
    'my heart skipped a beat',
    'felt like an eternity',
    'words cannot describe',
    'beyond words',
  ],

  // Trauma dumping indicators (unprocessed, raises readiness concerns)
  trauma_dumping_indicators: [
    'I still struggle with',
    'I\'m still healing from',
    'I\'ll never get over',
    'The pain is still fresh',
    'haunts me to this day',
    'I can\'t forget',
    'still have nightmares about',
    'the trauma of',
  ],

  // Self-congratulatory patterns (savior complex)
  self_congratulatory: [
    'I single-handedly',
    'I was the first to',
    'Without me, they would have',
    'I saved',
    'I changed their lives',
    'They were so grateful',
    'because of my efforts',
    'I was able to transform',
    'I brought hope to',
    'I made a real difference',
  ],

  // Service trip / empathy clichés
  service_cliches: [
    'I went there to help them but they ended up helping me',
    'opened my eyes to poverty',
    'made me grateful for what I have',
    'those less fortunate',
    'gave back to the community',
    'truly humbling experience',
    'put my problems in perspective',
    'realize how privileged I am',
    'changed my worldview',
  ],

  // False closure patterns (endings that feel reductive)
  false_closure: [
    'I learned that',
    'That was when I realized',
    'The most important lesson',
    'I now know that',
    'This experience taught me that',
    'From this, I understood',
    'I came to realize',
    'This taught me the value of',
    'Most importantly, I learned',
  ],

  // ============================================================================
  // ADDITIONAL PATTERNS FROM JANUARY 2025 DEEP RESEARCH
  // Source: Perplexity Research on Emotional Intelligence & Vulnerability
  // ============================================================================

  // Privilege acknowledgment clichés (opening pattern)
  privilege_cliches: [
    'I understand that I have never been discriminated',
    'I recognize my privilege',
    'I know I have had advantages',
    'growing up in a wealthy family',
    'attending a private school',
    'coming from a position of privilege',
    'I have been fortunate enough',
    'I never had to worry about',
    'my comfortable upbringing',
    'my privileged background',
  ],

  // Manufactured epiphany phrases
  manufactured_epiphany: [
    'in that moment, I realized',
    'suddenly, it clicked',
    'that\'s when it hit me',
    'everything changed in an instant',
    'I had an epiphany',
    'the light bulb went off',
    'I finally understood',
    'it dawned on me',
    'suddenly everything made sense',
    'in a flash of clarity',
  ],

  // Oversimplified growth claims
  oversimplified_growth: [
    'I became a completely different person',
    'I was transformed overnight',
    'I never looked back',
    'from that day forward',
    'I left that version of myself behind',
    'I was reborn',
    'a new me emerged',
    'I am forever changed',
    'completely transformed my life',
    'the old me died',
  ],

  // Emotional flatness indicators (basic emotion labels)
  emotional_flatness: [
    'I was happy about this',
    'it was difficult but',
    'I felt good about',
    'it was hard',
    'it was easy',
    'I was excited',
    'I was nervous',
    'I was proud',
    'I was disappointed',
    'I was upset',
    'it was challenging',
    'I was frustrated',
  ],

  // Savior complex phrases (expanded)
  savior_complex: [
    'I taught them',
    'I showed them how',
    'without my help',
    'because of what I did',
    'I changed their lives',
    'they looked up to me',
    'I was their role model',
    'I made a difference in their lives',
    'I gave them hope',
    'they needed someone like me',
    'I was able to help them see',
    'I opened their eyes to',
    'I inspired them to',
  ],

  // Confidence without evidence (telling traits)
  confidence_without_evidence: [
    'I am a natural leader',
    'I have always been curious',
    'I am known for',
    'people often say I am',
    'I consider myself',
    'one of my greatest strengths is',
    'I pride myself on',
    'I have strong',
    'I am extremely',
    'I\'m the kind of person who',
    'my friends describe me as',
    'everyone says I\'m',
  ],

  // ============================================================================
  // PROSE QUALITY PATTERNS (from Prose Quality & Voice deep research)
  // Source: Perplexity Research on "Prose Quality & Voice at the Sentence Level"
  // ============================================================================

  // Essay-speak formality (sounds like a school essay, not a human)
  essay_speak_formality: [
    'in today\'s society',
    'throughout history',
    'it is important to note that',
    'one must consider',
    'it can be argued that',
    'studies have shown',
    'research indicates',
    'it is widely known',
    'this demonstrates that',
    'the significance of this',
    'furthermore',
    'moreover',
    'nevertheless',
    'in conclusion',
    'to summarize',
    'as evidenced by',
    'it is evident that',
    'henceforth',
    'aforementioned',
    'subsequently',
  ],

  // Thesaurus syndrome (words a 17-year-old wouldn't naturally use)
  thesaurus_syndrome: [
    'insouciantly',
    'perspicacious',
    'pulchritudinous',
    'magnanimous',
    'effervescent',
    'quintessential',
    'unprecedented',
    'dichotomy',
    'paradigm',
    'juxtaposition',
    'plethora',
    'myriad',
    'ameliorate',
    'exemplify',
    'elucidate',
    'promulgate',
    'conundrum',
    'infinitesimally',
    'sanguine',
    'sagacious',
  ],

  // Weak verb patterns (passive, being verbs instead of action)
  weak_verb_patterns: [
    'there was',
    'there were',
    'there is',
    'there are',
    'it was',
    'it is',
    'I was feeling',
    'I was thinking',
    'I was trying',
    'I started to',
    'I began to',
    'I was able to',
    'seemed to be',
    'appeared to be',
    'was being',
    'were being',
    'had been',
    'has been',
    'would be',
    'could be',
  ],

  // Melodramatic phrases (over-the-top emotional claims)
  melodramatic_phrases: [
    'forever changed my life',
    'will never forget',
    'changed everything',
    'the most important moment',
    'the best day of my life',
    'the worst day of my life',
    'my whole world',
    'completely transformed',
    'life-altering',
    'earth-shattering',
    'mind-blowing',
    'once in a lifetime',
    'most incredible experience',
    'nothing could prepare me',
    'beyond my wildest dreams',
    'words cannot express',
    'unlike anything I\'ve ever',
    'changed me forever',
    'I was devastated',
    'my heart was shattered',
  ],

  // Generic imagery (so common it creates no visual)
  generic_imagery: [
    'sea of faces',
    'rays of sunlight',
    'butterflies in my stomach',
    'light at the end of the tunnel',
    'weight off my shoulders',
    'heart racing',
    'tears streaming',
    'time stood still',
    'felt like an eternity',
    'wave of emotions',
    'flood of memories',
    'eyes lighting up',
    'jaw dropped',
    'heart sank',
    'stomach dropped',
    'mind racing',
    'blood ran cold',
    'shivers down my spine',
    'breath taken away',
    'world came crashing down',
  ],

  // Over-polished markers (signals adult editing or AI generation)
  over_polished_markers: [
    'tapestry of experiences',
    'mosaic of cultures',
    'symphony of voices',
    'kaleidoscope of emotions',
    'beacon of hope',
    'pillar of strength',
    'catalyst for change',
    'harbinger of',
    'testament to',
    'embodiment of',
    'microcosm of',
    'epitome of',
    'paragon of',
    'manifestation of',
    'culmination of',
    'crystallized into',
    'coalesced into',
    'transcended',
    'illuminated',
    'galvanized',
  ],

  // ============================================================================
  // EMOTIONAL INTELLIGENCE PATTERNS (from EI Supplemental Deep Research)
  // Source: Perplexity Research on "Emotional Intelligence and Authentic Vulnerability"
  // ============================================================================

  // Passive victim framing (signals immaturity)
  passive_victim_markers: [
    'I suffered through',
    'my pain was',
    'nobody understood',
    'everything was against me',
    'I was the victim',
    'it was so hard for me',
    'my struggle was',
    'nobody cared',
    'I had no choice',
    'fate dealt me',
    'life threw at me',
    'I was powerless',
    'there was nothing I could do',
    'I was dealt a bad hand',
    'the world was against me',
  ],

  // False epiphany markers (too-quick resolution)
  false_epiphany_markers: [
    'that\'s when I realized',
    'it hit me that',
    'in that moment, I understood',
    'suddenly everything made sense',
    'I finally saw',
    'it all became clear',
    'that\'s when it clicked',
    'I had an epiphany',
    'enlightenment struck',
    'the truth dawned on me',
    'my eyes were opened',
    'the veil lifted',
    'I was awakened to',
    'clarity washed over me',
  ],

  // Strategic vulnerability markers (checkbox authenticity)
  strategic_vulnerability_markers: [
    'I\'m not afraid to admit',
    'I\'ll be honest',
    'to be vulnerable for a moment',
    'I\'m going to share something personal',
    'being completely transparent',
    'in the spirit of authenticity',
    'I want to be real with you',
    'opening up about',
    'letting my guard down',
    'showing my true self',
    'baring my soul',
  ],

  // Melodramatic self-positioning
  melodramatic_self_positioning: [
    'against all odds',
    'despite everything',
    'through blood, sweat, and tears',
    'through thick and thin',
    'overcome insurmountable obstacles',
    'defied expectations',
    'proved everyone wrong',
    'rose from the ashes',
    'emerged victorious',
    'conquered my demons',
    'fought tooth and nail',
    'beat the odds',
    'triumphed over adversity',
  ],

  // Self-aggrandizing claims (confidence without humility)
  self_aggrandizing_claims: [
    'I am the best',
    'I am the smartest',
    'I single-handedly',
    'I alone',
    'without me, they couldn\'t',
    'I was the only one who',
    'nobody else could',
    'I outperformed everyone',
    'I was indispensable',
    'they depended on me completely',
    'I saved the day',
    'the success was all due to me',
  ],

  // ============================================================================
  // INTELLECTUAL DEPTH PATTERNS (from Intellectual Depth deep research)
  // Source: Perplexity Research on "Intellectual Depth and Nuanced Thinking in Elite Essays"
  // ============================================================================

  // Performative intelligence markers (thesaurus problem / trying to sound smart)
  performative_intelligence: [
    'I possess an insatiable',
    'insatiable hunger for knowledge',
    'insatiable epistemological',
    'paramount importance',
    'multifaceted approach',
    'myriad of possibilities',
    'perpetually striving',
    'incessantly pursuing',
    'profoundly impacted',
    'fundamentally shaped',
    'endeavor to',
    'strive to achieve',
    'I have always been fascinated by',
    'sparked my passion for',
    'ignited my interest in',
    'my intellectual journey',
    'academic odyssey',
    'scholarly pursuits',
    'erudite perspective',
    'sagacious approach',
    'profound realization',
    'intellectual awakening',
    'cognitive revelation',
    'epistemological journey',
  ],

  // False intellectual claims (claiming intellect instead of showing it)
  false_intellectual_claims: [
    'I am deeply passionate about',
    'I have always known that',
    'I discovered my calling',
    'my purpose became clear',
    'I realized my destiny',
    'I am inherently curious',
    'I am naturally inquisitive',
    'my analytical mind',
    'my intellectual curiosity',
    'I think deeply about',
    'I ponder the complexities',
    'I question everything',
    'I am a deep thinker',
    'I love to learn',
    'I am intellectually driven',
    'knowledge is my passion',
  ],

  // Premature resolution markers (neat conclusions that feel reductive)
  premature_resolution: [
    'through this experience I learned that',
    'this taught me the importance of',
    'I now understand that',
    'looking back, I realize',
    'this experience showed me',
    'the lesson was clear',
    'I came to understand',
    'what I learned was',
    'the takeaway is',
    'the moral of the story',
    'in the end, I knew',
    'this confirmed that',
    'I discovered the truth',
    'I found the answer',
    'everything fell into place',
    'it all made sense',
    'I finally got it',
  ],

  // Missing systems awareness (individual-level only framing)
  individual_level_framing: [
    'I worked hard and succeeded',
    'my hard work paid off',
    'I achieved through determination',
    'I overcame through perseverance',
    'success came from my efforts',
    'I earned my place',
    'I pulled myself up',
    'through my own merit',
    'I made it happen',
    'all my hard work',
    'my dedication led to',
    'I deserved this because',
    'pure hard work',
    'nothing but hard work',
  ],

  // Name-dropping without engagement (formulaic depth)
  name_dropping_without_engagement: [
    'I read [author] and was inspired',
    'influenced by [thinker]',
    'as [famous person] once said',
    'like [person], I believe',
    'inspired by the words of',
    'my favorite quote is',
    'I live by the motto',
    'I adopted the philosophy of',
    'I was moved by',
    'this book changed my life',
    'reading [book] transformed me',
    'I discovered [philosopher] and everything changed',
  ],

  // Impressive-not-interesting markers (polished performance over authenticity)
  impressive_not_interesting: [
    'I have achieved',
    'my accomplishments include',
    'I was recognized for',
    'I received the award for',
    'I was selected to',
    'I was chosen because',
    'my resume includes',
    'I have been honored',
    'I am proud to say',
    'I have had the privilege',
    'I was fortunate to be selected',
    'I had the opportunity to',
    'I was able to demonstrate',
    'I proved my abilities',
    'I distinguished myself',
    'I excelled at',
  ],

  // Questions-with-obvious-answers (pseudo-intellectual framing)
  rhetorical_pseudo_intellectual: [
    'what does it mean to be',
    'what is the nature of',
    'how can we truly',
    'can one ever really',
    'is it possible that',
    'one might ask',
    'one must wonder',
    'the question remains',
    'society often fails to ask',
    'we rarely consider',
    'few people realize',
    'most people don\'t understand',
    'contrary to popular belief',
    'against conventional wisdom',
  ],
};

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

function buildAnalysisPrompt(
  text: string,
  options: ClicheAnalyzerOptions
): string {
  const collegeContext = options.college_id
    ? `\nCOLLEGE CONTEXT: This essay is for ${options.college_id.toUpperCase()}. Watch for college-specific clichés like using their own terminology back at them.`
    : '';

  const essayTypeContext = options.essay_type
    ? `\nESSAY TYPE: ${options.essay_type} - Consider type-specific cliché patterns.`
    : '';

  return `You are an expert college admissions essay analyst specializing in detecting clichés.

Your job is to analyze essay text for clichés at multiple levels:
1. TOPIC-LEVEL: Is the essay topic common? More importantly, is the FRAMING of that topic cliché?
2. NARRATIVE ARC: Does the essay follow a predictable arc that admissions officers have seen 1000+ times?
3. LANGUAGE-LEVEL: Are there specific phrases that are AI-generated, essay clichés, or vague claims?
4. TELLING vs SHOWING: Are they claiming qualities/emotions instead of demonstrating them?

CRITICAL DISTINCTION:
A topic is NOT inherently cliché. The FRAMING makes it cliché or fresh.
- "I immigrated and struggled to fit in" = CLICHÉ FRAMING
- "The sound of American rain is wrong - it's missing the metallic ping on corrugated roofs" = FRESH FRAMING
- "My grandmother died and I learned to appreciate life" = CLICHÉ FRAMING
- "Her medicine cabinet still smells like camphor. I can't throw anything away." = FRESH FRAMING

COMMON TOPICS (need fresh framing):
${CLICHE_REFERENCE.common_topics.join(', ')}

PREDICTABLE ARCS TO DETECT:
${CLICHE_REFERENCE.predictable_arcs.join('\n')}

AI CONVERGENCE WORDS (essays with these often feel AI-generated):
${CLICHE_REFERENCE.ai_convergence_phrases.join(', ')}

Additional AI convergence indicators:
- Phrases like "tapestry of experiences", "myriad of challenges", "multifaceted identity"
- Overuse of words like "invaluable", "transformative", "fostered", "cultivated"
- Flowery language without specific content (e.g., "navigated", "resonate", "intertwined")
- Count EACH instance of these words, not just unique words

ESSAY CLICHÉ PHRASES:
${CLICHE_REFERENCE.essay_cliche_phrases.join(', ')}

OPENING CLICHÉS (especially important - first impressions matter):
${CLICHE_REFERENCE.opening_cliches.join(', ')}

CONCLUSION CLICHÉS (weak endings undermine strong essays):
${CLICHE_REFERENCE.conclusion_cliches.join(', ')}

TELLING-NOT-SHOWING PATTERNS (detect ALL of these):
${CLICHE_REFERENCE.telling_patterns.join(', ')}

EXPANDED TELLING PATTERNS TO CATCH:
- "I learned/realized/discovered that..." (claiming insight)
- "This taught me/showed me..." (claiming lesson)
- "I grew as a person" / "I became more [adjective]" (claiming growth)
- "I am passionate about X" / "I love X" (claiming passion without showing)
- "This experience was important/meaningful/valuable" (claiming significance)
- "It made me [emotion]" / "I felt [emotion]" (telling emotion instead of evoking it)
- "I have a strong X" / "I developed X" (claiming qualities)
- "hard work pays off" / "never give up" (inspirational platitudes)
- EACH of these is a separate telling violation - list them ALL

IMPORTANT FOR TELLING DETECTION:
- Genuine reflection/questioning is OK: "I'm not sure what I'm looking for" or "the discordance feels important" are moments of AUTHENTIC uncertainty, not telling. These show the narrator thinking in real-time.
- TELLING = claiming an abstract quality without evidence (e.g., "I am resilient")
- NOT TELLING = expressing present-moment experience or uncertainty (e.g., "I'm not sure why this matters to me")
- Do NOT flag genuine philosophical observations or uncertainty as telling
${collegeContext}${essayTypeContext}

═══════════════════════════════════════════════════════════════════════════════
TEXT TO ANALYZE:
═══════════════════════════════════════════════════════════════════════════════
${text}
═══════════════════════════════════════════════════════════════════════════════

Analyze this text and return JSON with the following structure. Be thorough but concise.
Focus on what will help improve the essay most.

IMPORTANT:
- Be HONEST about cliché risk even if the writing is competent
- Identify what IS working (unique elements to preserve)
- Provide ACTIONABLE coaching advice
- The strongest unique element is the most valuable thing to identify

Return this exact JSON structure:
{
  "topic_assessment": {
    "topic": "string or null - detected common topic",
    "is_cliche_framing": boolean,
    "framing_assessment": "generic" | "predictable" | "developing" | "fresh" | "subversive",
    "unique_angle_detected": "string or null",
    "freshness_opportunity": "string - what would make this fresh"
  },
  "narrative_arc": {
    "detected_arc": "string describing the arc",
    "arc_type": "redemption" | "discovery" | "overcoming" | "realization" | "passion_origin" | "unique" | "unclear",
    "predictability_score": 1-10,
    "arc_critique": "string",
    "suggested_subversion": "string"
  },
  "language_cliches": [
    {
      "phrase": "exact phrase from text",
      "type": "ai_convergence" | "essay_cliche" | "inspirational_platitude" | "college_specific" | "vague_claim",
      "why_cliche": "brief explanation",
      "alternative_approach": "what to do instead"
    }
  ],
  "telling_not_showing": [
    {
      "phrase": "exact phrase",
      "what_theyre_telling": "brief description",
      "claimed_quality": "the quality being claimed",
      "how_to_show_instead": "guidance",
      "showing_example": "example of showing"
    }
  ],
  "overall_cliche_risk": "low" | "medium" | "high" | "critical",
  "cliche_risk_score": 0-100,
  "strongest_unique_element": "string or null",
  "elements_to_preserve": ["strings"],
  "coaching_priority": {
    "issue": "string",
    "why_priority": "string",
    "coaching_approach": "string"
  },
  "summary_for_prompt": "1-2 sentence summary for injection into other prompts"
}`;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class SemanticClicheAnalyzer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic();
  }

  /**
   * Analyze text for clichés at all levels
   *
   * Cost: ~$0.003-0.005 per analysis
   */
  async analyze(
    text: string,
    options: ClicheAnalyzerOptions = {}
  ): Promise<SemanticClicheAnalysis> {
    // If pattern-only mode, return pattern-based analysis
    if (options.pattern_only) {
      return this.patternBasedAnalysis(text, options);
    }

    const prompt = buildAnalysisPrompt(text, options);

    try {
      // Use retry logic for API resilience
      const response = await withRetry(
        () =>
          this.anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        {
          operationName: 'SemanticClicheAnalyzer.analyze',
          maxRetries: 2, // 3 total attempts
          initialDelayMs: 1000,
        }
      );

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Parse JSON from response with robust extraction
      const parsed = this.extractJSON(content.text);
      if (!parsed) {
        console.error('[SemanticClicheAnalyzer] Failed to parse JSON from response');
        return this.patternBasedAnalysis(text, options);
      }

      return this.normalizeResponse(parsed);
    } catch (error) {
      console.error('[SemanticClicheAnalyzer] Analysis failed after retries:', error);
      // Fall back to pattern-based analysis
      return this.patternBasedAnalysis(text, options);
    }
  }

  /**
   * Pattern-based analysis (fallback, no API cost)
   */
  private patternBasedAnalysis(
    text: string,
    options: ClicheAnalyzerOptions
  ): SemanticClicheAnalysis {
    const language_cliches: LanguageCliche[] = [];
    const telling_not_showing: TellingNotShowing[] = [];

    // Check for AI convergence words
    for (const phrase of CLICHE_REFERENCE.ai_convergence_phrases) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      if (regex.test(text)) {
        language_cliches.push({
          phrase,
          type: 'ai_convergence',
          why_cliche: 'Commonly used by AI, creates generic voice',
          alternative_approach: 'Use specific, concrete language instead',
        });
      }
    }

    // Check for essay cliché phrases
    for (const phrase of CLICHE_REFERENCE.essay_cliche_phrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Overused essay phrase that admissions officers have seen thousands of times',
          alternative_approach: 'Show instead of tell, or find a fresher way to express this',
        });
      }
    }

    // Check for opening clichés (especially impactful - first impressions)
    const first100Words = text.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
    for (const phrase of CLICHE_REFERENCE.opening_cliches) {
      if (first100Words.includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Opening cliché - 30-50% of essays start this way. First impressions matter most.',
          alternative_approach: 'Start in medias res (middle of action) or with a specific sensory moment',
        });
      }
    }

    // Check for conclusion clichés
    const last100Words = text.split(/\s+/).slice(-100).join(' ').toLowerCase();
    for (const phrase of CLICHE_REFERENCE.conclusion_cliches) {
      if (last100Words.includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Weak ending phrase - tells reader you ran out of story. Endings disproportionately affect memory.',
          alternative_approach: 'End on a specific image or return to opening with new understanding',
        });
      }
    }

    // Check for telling patterns
    for (const pattern of CLICHE_REFERENCE.telling_patterns) {
      const clean = pattern.replace('...', '').toLowerCase();
      if (text.toLowerCase().includes(clean)) {
        telling_not_showing.push({
          phrase: pattern,
          what_theyre_telling: 'Stating a conclusion or emotion directly',
          claimed_quality: 'growth/learning/emotion',
          how_to_show_instead: 'Describe the moment or action that demonstrates this',
          showing_example: 'Instead of "I learned patience", show a moment of waiting/persistence',
        });
      }
    }

    // =========================================================================
    // EMOTIONAL INTELLIGENCE PATTERNS (from EI research)
    // =========================================================================

    // Check for performed vulnerability (generic emotional clichés)
    for (const phrase of CLICHE_REFERENCE.performed_vulnerability) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Generic emotional cliché that signals performed rather than genuine vulnerability. Admissions officers detect inauthenticity.',
          alternative_approach: 'Show the specific, unique physical or sensory experience of YOUR emotion in THAT moment',
        });
      }
    }

    // Check for trauma dumping indicators (raises readiness concerns)
    for (const phrase of CLICHE_REFERENCE.trauma_dumping_indicators) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Suggests unprocessed trauma. AOs worry about college readiness. Focus on resolution and growth, not raw pain.',
          alternative_approach: 'Reframe to show how you shifted priorities and found strength. Demonstrate you\'ve processed and grown.',
        });
      }
    }

    // Check for self-congratulatory patterns (savior complex)
    for (const phrase of CLICHE_REFERENCE.self_congratulatory) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Self-congratulatory "savior" framing. AOs find this off-putting. Reduces complex interactions to self-improvement transactions.',
          alternative_approach: 'Focus on collaboration and mutual learning. What did YOU learn? Acknowledge others\' agency.',
        });
      }
    }

    // Check for service trip clichés
    for (const phrase of CLICHE_REFERENCE.service_cliches) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Service trip cliché - among the "two most shopworn essay topics." Positions you as condescending savior.',
          alternative_approach: 'Focus on specific learning moments, complications, and ongoing questions. Show mutuality, not saviorism.',
        });
      }
    }

    // Check for false closure in endings
    for (const phrase of CLICHE_REFERENCE.false_closure) {
      if (last100Words.includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'False closure - feels reductive after complex experience. Shows you\'re pretending to have it all figured out.',
          alternative_approach: 'Leave ending open. Show you\'re still learning. Return to opening image with new understanding.',
        });
      }
    }

    // =========================================================================
    // ADDITIONAL PATTERNS (from January 2025 Deep Research)
    // =========================================================================

    // Check for privilege acknowledgment clichés
    for (const phrase of CLICHE_REFERENCE.privilege_cliches) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Privilege acknowledgment opening - AOs already know your background from the application. This makes privilege the essay\'s focus rather than your growth.',
          alternative_approach: 'Acknowledge privilege naturally when relevant to the story rather than as preamble. Focus on personal meaning, not comparison.',
        });
      }
    }

    // Check for manufactured epiphany patterns
    for (const phrase of CLICHE_REFERENCE.manufactured_epiphany) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Manufactured epiphany - if your realization happens in the last paragraph, readers ask why you didn\'t realize this on page 1.',
          alternative_approach: 'Show gradual understanding throughout. Let insight emerge through action and reflection, not sudden revelation.',
        });
      }
    }

    // Check for oversimplified growth claims
    for (const phrase of CLICHE_REFERENCE.oversimplified_growth) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Oversimplified growth - real change is gradual and incomplete. Claims of total transformation feel inauthentic.',
          alternative_approach: 'Show ongoing process. Acknowledge what you\'re still working on. Demonstrate growth as trajectory, not binary switch.',
        });
      }
    }

    // Check for emotional flatness indicators
    for (const phrase of CLICHE_REFERENCE.emotional_flatness) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Emotional flatness - basic emotion labels don\'t evoke feeling. Readers detect and disengage from flat emotional statements.',
          alternative_approach: 'Use specific shades of emotion: not just "sad" but "melancholic, wistful, regretful." Show the physical experience of the emotion.',
        });
      }
    }

    // Check for savior complex patterns (expanded)
    for (const phrase of CLICHE_REFERENCE.savior_complex) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Savior complex - reduces complex interactions to self-improvement transactions. AOs find this off-putting.',
          alternative_approach: 'Focus on collaboration and mutual learning. What did YOU learn? Acknowledge others\' agency and expertise.',
        });
      }
    }

    // Check for confidence without evidence
    for (const phrase of CLICHE_REFERENCE.confidence_without_evidence) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Claiming a character trait without evidence',
          claimed_quality: 'leadership/curiosity/strength',
          how_to_show_instead: 'Show the trait through specific action. Don\'t claim you\'re curious - describe staying up late researching something.',
          showing_example: 'Instead of "I am a natural leader", show: "When the project stalled, I proposed we break into pairs and tackle different sections."',
        });
      }
    }

    // =========================================================================
    // PROSE QUALITY PATTERNS (from Prose Quality & Voice deep research)
    // =========================================================================

    // Check for essay-speak formality (sounds like school essay, not human)
    for (const phrase of CLICHE_REFERENCE.essay_speak_formality) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Essay-speak formality - sounds like a school essay, not a 17-year-old having a conversation. AOs want to hear your natural voice.',
          alternative_approach: 'Write like you\'re telling a friend. Read aloud - if it sounds stiff, it is. Cut formal transitions.',
        });
      }
    }

    // Check for thesaurus syndrome (vocabulary a teen wouldn't naturally use)
    for (const phrase of CLICHE_REFERENCE.thesaurus_syndrome) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      if (regex.test(text)) {
        language_cliches.push({
          phrase,
          type: 'ai_convergence',
          why_cliche: 'Thesaurus syndrome - words a 17-year-old wouldn\'t naturally use. Signals adult editing or AI assistance. AOs spot this immediately.',
          alternative_approach: 'Use your natural vocabulary. If you wouldn\'t say it in conversation, don\'t write it. Simpler is stronger.',
        });
      }
    }

    // Check for weak verb patterns (passive, being verbs)
    for (const phrase of CLICHE_REFERENCE.weak_verb_patterns) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Using weak/passive construction instead of action',
          claimed_quality: 'narrative engagement',
          how_to_show_instead: 'Replace "was/were" with action verbs. Instead of "There was a boy", write "A boy stood".',
          showing_example: 'Before: "I was feeling nervous." After: "My palms slicked with sweat."',
        });
      }
    }

    // Check for melodramatic phrases (over-the-top claims)
    for (const phrase of CLICHE_REFERENCE.melodramatic_phrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Melodramatic - claims significance rather than showing it. If everything is "life-changing", nothing is. Let moments speak for themselves.',
          alternative_approach: 'Delete the claim entirely. Show the moment with specific detail and trust readers to understand its importance.',
        });
      }
    }

    // Check for generic imagery (so common it creates no visual)
    for (const phrase of CLICHE_REFERENCE.generic_imagery) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Generic imagery - used so often it creates no visual. "Heart racing" doesn\'t make readers feel anything anymore.',
          alternative_approach: 'Find YOUR unique physical sensation. Not "butterflies" but maybe "my stomach did a little flip like on a roller coaster\'s first drop."',
        });
      }
    }

    // Check for over-polished markers (signals adult/AI editing)
    for (const phrase of CLICHE_REFERENCE.over_polished_markers) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'ai_convergence',
          why_cliche: 'Over-polished marker - signals adult editing or AI generation. These extended metaphors feel crafted, not authentic. AOs can tell.',
          alternative_approach: 'Trust simpler language. "A mix of influences" beats "tapestry of experiences." Your unpolished voice is more memorable.',
        });
      }
    }

    // =========================================================================
    // EMOTIONAL INTELLIGENCE PATTERNS (from Supplemental Deep Research)
    // =========================================================================

    // Check for passive victim framing (signals immaturity)
    for (const phrase of CLICHE_REFERENCE.passive_victim_markers) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Passive victim framing - presenting self as acted upon, not as agent',
          claimed_quality: 'struggle/resilience',
          how_to_show_instead: 'Show your RESPONSE and ACTIONS, not the scale of suffering. Focus on "what I did" not "what happened to me."',
          showing_example: 'Before: "I suffered through my parents\' divorce." After: "I learned to pack my homework in two sets, one for each house."',
        });
      }
    }

    // Check for false epiphany markers (too-quick resolution)
    for (const phrase of CLICHE_REFERENCE.false_epiphany_markers) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'False epiphany - emotions resolving too quickly feels manufactured. Real insights develop gradually, not in a sudden "aha" moment.',
          alternative_approach: 'Show the slow evolution of understanding. Don\'t announce your realization - let readers discover it WITH you through specific moments.',
        });
      }
    }

    // Check for strategic vulnerability markers (checkbox authenticity)
    for (const phrase of CLICHE_REFERENCE.strategic_vulnerability_markers) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Strategic vulnerability - announcing authenticity negates it. If you have to tell readers you\'re being vulnerable, it feels calculated.',
          alternative_approach: 'Just BE vulnerable without announcing it. Show the uncomfortable detail directly. Trust readers to recognize authenticity.',
        });
      }
    }

    // Check for melodramatic self-positioning
    for (const phrase of CLICHE_REFERENCE.melodramatic_self_positioning) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'inspirational',
          why_cliche: 'Melodramatic self-positioning - these phrases make your story sound like a movie trailer, not a genuine reflection.',
          alternative_approach: 'Let the specific details carry the weight. If your actions were impressive, showing them is enough - no need to announce triumph.',
        });
      }
    }

    // Check for self-aggrandizing claims (confidence without humility)
    for (const phrase of CLICHE_REFERENCE.self_aggrandizing_claims) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Self-aggrandizing claim - asserting superiority rather than demonstrating contribution',
          claimed_quality: 'competence/achievement',
          how_to_show_instead: 'Let your actions speak. Describe what you DID and the specific outcome. Use "I contributed" not "I alone achieved."',
          showing_example: 'Before: "I single-handedly saved the project." After: "I proposed we break into pairs and tackle different sections - by Friday, we had a working prototype."',
        });
      }
    }

    // ============================================================================
    // INTELLECTUAL DEPTH PATTERN DETECTION
    // ============================================================================

    // Performative intelligence detection (thesaurus problem)
    for (const phrase of CLICHE_REFERENCE.performative_intelligence) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'ai_convergence',
          why_cliche: 'Performative intelligence - using elevated vocabulary unnaturally. Stanford\'s former Dean: "A person of average IQ may have enormous intellectual vitality, while a person with a stratospheric IQ may have scant intellectual vitality." Simple, precise language signals deeper understanding than ornate prose.',
          replacement_suggestion: 'Show your thinking through specific examples, not vocabulary. Replace "insatiable epistemological hunger" with actual curiosity: describe what you actually read or researched and what specific questions it raised.',
        });
      }
    }

    // False intellectual claims detection
    for (const phrase of CLICHE_REFERENCE.false_intellectual_claims) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Claiming intellectual qualities without demonstrating them',
          claimed_quality: 'intellectual curiosity/passion',
          how_to_show_instead: 'Duke\'s Dean Guttentag: "We choose interesting students from among the smart ones." Show what questions obsess you, what rabbit holes you\'ve gone down, what contradictions you\'re still wrestling with.',
          showing_example: 'Before: "I am deeply passionate about physics." After: "I spent three hours trying to figure out why my simulation showed particles moving backward in time - and realized I\'d accidentally discovered why antimatter matters."',
        });
      }
    }

    // Premature resolution detection
    for (const phrase of CLICHE_REFERENCE.premature_resolution) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Premature resolution - forcing a neat conclusion undermines intellectual depth. Stanford AOs say essays should show "you\'ve wrestled with hard questions" without needing to "have all the answers." Leave space for ongoing questions.',
          replacement_suggestion: 'End with complexity, not closure. What questions remain? What are you still uncertain about? Intellectual maturity shows comfort with ambiguity, not forced resolution.',
        });
      }
    }

    // Individual-level framing detection (missing systems awareness)
    for (const phrase of CLICHE_REFERENCE.individual_level_framing) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        telling_not_showing.push({
          phrase,
          what_theyre_telling: 'Individual-level narrative missing systems awareness',
          claimed_quality: 'achievement/success',
          how_to_show_instead: 'Strong essays demonstrate systems awareness: connect your personal experience to broader structural forces. What larger patterns were you operating within? What systems enabled or constrained your choices?',
          showing_example: 'Before: "I worked hard and succeeded." After: "I noticed my school\'s STEM resources were unevenly distributed, so I created a peer-tutoring network that addressed the structural gap while learning about educational equity."',
        });
      }
    }

    // Impressive-not-interesting markers
    for (const phrase of CLICHE_REFERENCE.impressive_not_interesting) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: '"Impressive" essays list achievements with sophisticated vocabulary and risk sounding like "a carefully constructed persona." Elite AOs want "interesting" - distinctive perspective, unexpected connections, intellectual initiative beyond classroom.',
          replacement_suggestion: 'Instead of listing what you achieved, show HOW you think. What unexpected connections have you made? What assumptions have you challenged? What failures of understanding have you had?',
        });
      }
    }

    // Rhetorical pseudo-intellectual questions
    for (const phrase of CLICHE_REFERENCE.rhetorical_pseudo_intellectual) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        language_cliches.push({
          phrase,
          type: 'essay_cliche',
          why_cliche: 'Rhetorical pseudo-intellectual framing - asking big questions without engaging them substantively. These openings signal performance over genuine inquiry. Real intellectual depth shows wrestling with ideas, not just posing questions.',
          replacement_suggestion: 'Don\'t ask the question - show yourself genuinely grappling with it through a specific experience. Move from abstract to concrete.',
        });
      }
    }

    // Calculate risk score
    const cliche_count = language_cliches.length + telling_not_showing.length;
    const cliche_risk_score = Math.min(100, cliche_count * 15);

    const overall_cliche_risk: 'low' | 'medium' | 'high' | 'critical' =
      cliche_risk_score >= 70 ? 'critical' :
      cliche_risk_score >= 50 ? 'high' :
      cliche_risk_score >= 25 ? 'medium' : 'low';

    return {
      topic_assessment: {
        topic: null,
        is_cliche_framing: false,
        framing_assessment: 'developing',
        unique_angle_detected: null,
        freshness_opportunity: 'Use AI analysis for detailed assessment',
      },
      narrative_arc: {
        detected_arc: 'Unable to assess without AI',
        arc_type: 'unclear',
        predictability_score: 5,
        arc_critique: 'Pattern-based analysis cannot assess narrative arc',
        suggested_subversion: 'Consider starting at a different point in the story',
      },
      language_cliches,
      telling_not_showing,
      overall_cliche_risk,
      cliche_risk_score,
      strongest_unique_element: null,
      elements_to_preserve: [],
      coaching_priority: {
        issue: language_cliches.length > 0 ? 'Language clichés detected' : 'No major issues detected',
        why_priority: 'Pattern-based detection found these issues',
        coaching_approach: 'Focus on specific, concrete details',
      },
      summary_for_prompt: `Pattern analysis found ${language_cliches.length} language clichés and ${telling_not_showing.length} telling-not-showing issues.`,
    };
  }

  /**
   * Extract JSON from AI response with robust error handling
   */
  private extractJSON(text: string): any | null {
    // First, try direct JSON parse (if response is just JSON)
    try {
      return JSON.parse(text);
    } catch {
      // Not pure JSON, try to extract it
    }

    // Try to find JSON block with regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    let jsonStr = jsonMatch[0];

    // Try parsing the extracted JSON
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to fix common JSON issues
    }

    // Fix: Remove trailing commas before closing brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // Fix: Handle unescaped quotes in strings (simple approach)
    // This is risky but catches common issues
    try {
      return JSON.parse(jsonStr);
    } catch {
      // One more try: try to extract just the JSON structure
    }

    // Last resort: try to extract individual fields
    // This handles cases where the AI added extra content
    try {
      // Find the last complete closing brace
      let depth = 0;
      let lastValidEnd = -1;
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') depth++;
        if (jsonStr[i] === '}') {
          depth--;
          if (depth === 0) {
            lastValidEnd = i;
            break;
          }
        }
      }
      if (lastValidEnd > 0) {
        const truncated = jsonStr.substring(0, lastValidEnd + 1);
        return JSON.parse(truncated);
      }
    } catch {
      // Give up
    }

    return null;
  }

  /**
   * Normalize AI response to ensure type safety
   */
  private normalizeResponse(parsed: any): SemanticClicheAnalysis {
    return {
      topic_assessment: {
        topic: parsed.topic_assessment?.topic || null,
        is_cliche_framing: parsed.topic_assessment?.is_cliche_framing ?? false,
        framing_assessment: parsed.topic_assessment?.framing_assessment || 'developing',
        unique_angle_detected: parsed.topic_assessment?.unique_angle_detected || null,
        freshness_opportunity: parsed.topic_assessment?.freshness_opportunity || 'Not analyzed',
      },
      narrative_arc: {
        detected_arc: parsed.narrative_arc?.detected_arc || 'Not detected',
        arc_type: parsed.narrative_arc?.arc_type || 'unclear',
        predictability_score: parsed.narrative_arc?.predictability_score ?? 5,
        arc_critique: parsed.narrative_arc?.arc_critique || 'Not analyzed',
        suggested_subversion: parsed.narrative_arc?.suggested_subversion || 'Not analyzed',
      },
      language_cliches: (parsed.language_cliches || []).map((c: any) => ({
        phrase: c.phrase || '',
        type: c.type || 'essay_cliche',
        why_cliche: c.why_cliche || '',
        alternative_approach: c.alternative_approach || '',
      })),
      telling_not_showing: (parsed.telling_not_showing || []).map((t: any) => ({
        phrase: t.phrase || '',
        what_theyre_telling: t.what_theyre_telling || '',
        claimed_quality: t.claimed_quality || '',
        how_to_show_instead: t.how_to_show_instead || '',
        showing_example: t.showing_example || '',
      })),
      overall_cliche_risk: parsed.overall_cliche_risk || 'medium',
      cliche_risk_score: parsed.cliche_risk_score ?? 50,
      strongest_unique_element: parsed.strongest_unique_element || null,
      elements_to_preserve: parsed.elements_to_preserve || [],
      coaching_priority: {
        issue: parsed.coaching_priority?.issue || 'Not analyzed',
        why_priority: parsed.coaching_priority?.why_priority || '',
        coaching_approach: parsed.coaching_priority?.coaching_approach || '',
      },
      summary_for_prompt: parsed.summary_for_prompt || 'Cliché analysis complete.',
    };
  }

  /**
   * Quick check for critical clichés (pattern-based, no API cost)
   * Use this before deciding whether to run full analysis
   */
  quickClicheCheck(text: string): {
    has_critical_cliches: boolean;
    ai_convergence_count: number;
    essay_cliche_count: number;
    recommend_full_analysis: boolean;
  } {
    let ai_convergence_count = 0;
    let essay_cliche_count = 0;

    for (const phrase of CLICHE_REFERENCE.ai_convergence_phrases) {
      if (new RegExp(`\\b${phrase}\\b`, 'gi').test(text)) {
        ai_convergence_count++;
      }
    }

    for (const phrase of CLICHE_REFERENCE.essay_cliche_phrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        essay_cliche_count++;
      }
    }

    const has_critical_cliches = ai_convergence_count >= 2 || essay_cliche_count >= 2;

    return {
      has_critical_cliches,
      ai_convergence_count,
      essay_cliche_count,
      recommend_full_analysis: has_critical_cliches || text.length > 500,
    };
  }

  /**
   * Format analysis for prompt injection
   */
  formatForPromptInjection(analysis: SemanticClicheAnalysis): string {
    const sections: string[] = [];

    // Header
    sections.push('═══════════════════════════════════════════════════════════════════════════════');
    sections.push('CLICHÉ ANALYSIS (Critical - Read Carefully)');
    sections.push('═══════════════════════════════════════════════════════════════════════════════');

    // Overall risk
    sections.push(`\nOVERALL CLICHÉ RISK: ${analysis.overall_cliche_risk.toUpperCase()} (${analysis.cliche_risk_score}/100)`);

    // Topic assessment
    if (analysis.topic_assessment.topic) {
      sections.push(`\nTOPIC: ${analysis.topic_assessment.topic}`);
      sections.push(`Framing: ${analysis.topic_assessment.framing_assessment}`);
      if (analysis.topic_assessment.unique_angle_detected) {
        sections.push(`✓ Unique angle found: ${analysis.topic_assessment.unique_angle_detected}`);
      } else {
        sections.push(`✗ No unique angle detected`);
        sections.push(`  Opportunity: ${analysis.topic_assessment.freshness_opportunity}`);
      }
    }

    // Narrative arc
    if (analysis.narrative_arc.predictability_score >= 6) {
      sections.push(`\nNARRATIVE ARC WARNING:`);
      sections.push(`  Arc: ${analysis.narrative_arc.detected_arc}`);
      sections.push(`  Predictability: ${analysis.narrative_arc.predictability_score}/10`);
      sections.push(`  Consider: ${analysis.narrative_arc.suggested_subversion}`);
    }

    // Language clichés
    if (analysis.language_cliches.length > 0) {
      sections.push(`\nLANGUAGE CLICHÉS (${analysis.language_cliches.length} found):`);
      for (const c of analysis.language_cliches.slice(0, 5)) {
        sections.push(`  ✗ "${c.phrase}" [${c.type}]`);
        sections.push(`    → ${c.alternative_approach}`);
      }
    }

    // Telling not showing
    if (analysis.telling_not_showing.length > 0) {
      sections.push(`\nTELLING-NOT-SHOWING (${analysis.telling_not_showing.length} found):`);
      for (const t of analysis.telling_not_showing.slice(0, 3)) {
        sections.push(`  ✗ "${t.phrase}"`);
        sections.push(`    Claiming: ${t.claimed_quality}`);
        sections.push(`    Show it: ${t.how_to_show_instead}`);
      }
    }

    // Unique elements to preserve
    if (analysis.strongest_unique_element) {
      sections.push(`\n✓ PRESERVE THIS: "${analysis.strongest_unique_element}"`);
    }
    if (analysis.elements_to_preserve.length > 0) {
      sections.push(`\nElements working well:`);
      for (const e of analysis.elements_to_preserve) {
        sections.push(`  ✓ ${e}`);
      }
    }

    // Coaching priority
    sections.push(`\nCOACHING PRIORITY:`);
    sections.push(`  ${analysis.coaching_priority.issue}`);
    sections.push(`  Approach: ${analysis.coaching_priority.coaching_approach}`);

    sections.push('═══════════════════════════════════════════════════════════════════════════════');

    return sections.join('\n');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const semanticClicheAnalyzer = new SemanticClicheAnalyzer();
