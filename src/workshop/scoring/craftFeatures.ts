/**
 * Craft Features — Extended Deterministic Text Analysis
 *
 * 25 craft-level feature extraction functions that go beyond basic counts
 * into sentence rhythm, verb strength, prose quality, and structural patterns.
 * All analysis is deterministic (~100ms for 650 words).
 *
 * Used by: annotation pipeline (enriched features), dimension scorers, craft feedback
 */

// ============================================================================
// WORD LISTS
// ============================================================================

export const STRONG_VERBS = new Set([
  // Movement & force
  'sprinted', 'lunged', 'plunged', 'hurtled', 'careened', 'bolted', 'darted',
  'staggered', 'stumbled', 'surged', 'vaulted', 'barreled', 'charged', 'dashed',
  'scrambled', 'tumbled', 'wrestled', 'grappled', 'seized', 'snatched',
  // Creation & destruction
  'shattered', 'crumbled', 'demolished', 'obliterated', 'forged', 'sculpted',
  'carved', 'crafted', 'welded', 'constructed', 'dismantled', 'fractured',
  'splintered', 'dissolved', 'eroded', 'ravaged', 'devoured', 'consumed',
  // Speech & sound
  'whispered', 'bellowed', 'stammered', 'murmured', 'hissed', 'snarled',
  'croaked', 'rasped', 'thundered', 'proclaimed', 'declared', 'confessed',
  'pleaded', 'demanded', 'insisted', 'shrieked', 'gasped', 'muttered',
  // Emotion & mind
  'ached', 'yearned', 'craved', 'loathed', 'despised', 'cherished',
  'savored', 'relished', 'dreaded', 'envied', 'mourned', 'agonized',
  'obsessed', 'fixated', 'brooded', 'seethed', 'fumed', 'bristled',
  // Vision & perception
  'glimpsed', 'peered', 'scrutinized', 'surveyed', 'witnessed', 'spotted',
  'squinted', 'glared', 'gazed', 'scanned', 'inspected', 'detected',
  // Transformation
  'ignited', 'erupted', 'blazed', 'smoldered', 'flickered', 'kindled',
  'awakened', 'unleashed', 'unraveled', 'transformed', 'metamorphosed',
  'crystallized', 'solidified', 'evaporated', 'condensed', 'coalesced',
  // Impact & contact
  'slammed', 'crashed', 'collided', 'smashed', 'hammered', 'pounded',
  'struck', 'jabbed', 'pierced', 'punctured', 'gouged', 'lacerated',
  // Control & manipulation
  'wielded', 'brandished', 'maneuvered', 'navigated', 'orchestrated',
  'commandeered', 'marshaled', 'wrangled', 'corralled', 'harnessed',
  // Stealth & subtlety
  'crept', 'slithered', 'prowled', 'lurked', 'skulked', 'tiptoed',
  'slipped', 'slinked', 'infiltrated', 'seeped', 'permeated', 'infused',
  // Growth & decline
  'flourished', 'blossomed', 'withered', 'wilted', 'decayed', 'festered',
  'thrived', 'languished', 'deteriorated', 'atrophied', 'swelled', 'ballooned',
]);

export const WEAK_VERBS = new Set([
  'was', 'were', 'is', 'are', 'am', 'been', 'being',
  'had', 'has', 'have', 'having',
  'got', 'get', 'gets', 'getting',
  'went', 'go', 'goes', 'going',
  'said', 'says', 'say',
  'made', 'make', 'makes',
  'did', 'do', 'does',
  'came', 'come', 'comes',
  'took', 'take', 'takes',
  'put', 'puts',
]);

export const FILLER_PHRASES = [
  'in order to',
  'the fact that',
  'it is important to note',
  'it is important to note that',
  'at this point in time',
  'due to the fact that',
  'in the process of',
  'on a daily basis',
  'for all intents and purposes',
  'needless to say',
  'it goes without saying',
  'as a matter of fact',
  'at the end of the day',
  'by and large',
  'first and foremost',
  'last but not least',
  'in my opinion',
  'i believe that',
  'i think that',
  'it should be noted that',
  'it is worth mentioning',
  'in terms of',
  'with regard to',
  'with respect to',
  'in light of the fact that',
  'for the purpose of',
  'in the event that',
  'on the basis of',
  'in a manner of speaking',
  'as far as i am concerned',
  'to be perfectly honest',
  'in the final analysis',
  'when all is said and done',
  'at the present time',
  'in the near future',
  'in the not too distant future',
  'each and every',
  'one and the same',
  'point in time',
  'whether or not',
] as const;

export const SENSORY_WORDS_BY_TYPE = {
  sight: new Set([
    'bright', 'dim', 'glowing', 'shadowed', 'vivid', 'pale', 'crimson', 'golden',
    'flickering', 'gleaming', 'shimmering', 'blinding', 'dark', 'light', 'luminous',
    'opaque', 'translucent', 'glistening', 'sparkling', 'dull', 'radiant', 'hazy',
    'murky', 'iridescent', 'tarnished', 'polished', 'matte', 'glossy', 'faded',
    'scarlet', 'azure', 'ivory', 'obsidian', 'amber', 'silver', 'bronze', 'copper',
    'emerald', 'ruby', 'sapphire', 'turquoise', 'indigo', 'maroon', 'charcoal',
    'silhouette', 'shadow', 'reflection', 'glare', 'glint', 'flash', 'beam',
    'streak', 'blur', 'outline', 'pattern', 'mosaic', 'kaleidoscope',
  ]),
  sound: new Set([
    'whisper', 'roar', 'hum', 'buzz', 'crack', 'echo', 'silence', 'murmur',
    'thunder', 'ring', 'clatter', 'screech', 'sigh', 'rustle', 'click',
    'bang', 'pop', 'snap', 'creak', 'groan', 'rumble', 'thud', 'splash',
    'whoosh', 'hiss', 'whir', 'drone', 'chime', 'toll', 'clang', 'rattle',
    'patter', 'drumming', 'tapping', 'crunching', 'sizzle', 'gurgle', 'babble',
    'shriek', 'wail', 'howl', 'moan', 'whimper', 'gasp', 'stammer', 'stutter',
    'melody', 'harmony', 'discord', 'cacophony',
  ]),
  touch: new Set([
    'rough', 'smooth', 'cold', 'warm', 'sharp', 'soft', 'wet', 'dry',
    'sticky', 'slippery', 'burning', 'freezing', 'prickly', 'velvet', 'gritty',
    'coarse', 'silky', 'fuzzy', 'bristly', 'spongy', 'rubbery', 'leathery',
    'feathery', 'tender', 'numb', 'tingling', 'throbbing', 'stinging', 'aching',
    'scorching', 'icy', 'damp', 'clammy', 'crisp', 'jagged', 'blunt',
    'abrasive', 'grainy', 'chalky', 'waxy',
  ]),
  taste: new Set([
    'sweet', 'bitter', 'sour', 'salty', 'savory', 'tangy', 'bland', 'spicy',
    'pungent', 'tart', 'acidic', 'sugary', 'zesty', 'rich', 'mild',
    'peppery', 'minty', 'buttery', 'nutty', 'fruity',
  ]),
  smell: new Set([
    'fragrant', 'stench', 'aroma', 'musty', 'fresh', 'rotten', 'smoky',
    'acrid', 'floral', 'earthy', 'metallic', 'pungent', 'musky', 'perfumed',
    'sulfurous', 'piney', 'briny', 'dank', 'moldy', 'antiseptic',
  ]),
} as const;

export const ABSTRACT_WORDS = new Set([
  'truth', 'importance', 'significance', 'value', 'meaning', 'concept',
  'perspective', 'identity', 'justice', 'freedom', 'equality', 'democracy',
  'knowledge', 'wisdom', 'understanding', 'awareness', 'consciousness',
  'beauty', 'love', 'happiness', 'success', 'failure', 'hope', 'faith',
  'courage', 'integrity', 'honor', 'dignity', 'respect', 'compassion',
  'empathy', 'resilience', 'determination', 'ambition', 'passion',
  'creativity', 'innovation', 'progress', 'growth', 'development',
  'responsibility', 'duty', 'obligation', 'commitment', 'dedication',
  'leadership', 'teamwork', 'collaboration', 'diversity', 'inclusion',
  'culture', 'tradition', 'heritage', 'legacy', 'purpose', 'destiny',
  'possibility', 'potential', 'opportunity', 'challenge', 'adversity',
  'transformation', 'evolution', 'revolution', 'philosophy', 'ideology',
  'morality', 'ethics', 'virtue', 'principle', 'belief', 'opinion',
  'perception', 'reality', 'existence', 'humanity', 'society', 'community',
  'civilization', 'achievement', 'excellence', 'perfection', 'harmony',
  'balance', 'peace', 'conflict', 'tension', 'struggle', 'sacrifice',
  'gratitude', 'humility', 'patience', 'tolerance', 'acceptance',
  'forgiveness', 'redemption', 'salvation', 'inspiration', 'motivation',
  'influence', 'impact', 'significance', 'relevance', 'authenticity',
  'vulnerability', 'maturity', 'independence', 'autonomy', 'agency',
]);

export const CONCRETE_WORDS = new Set([
  // Objects
  'table', 'chair', 'door', 'window', 'wall', 'floor', 'ceiling', 'roof',
  'desk', 'bed', 'lamp', 'mirror', 'clock', 'phone', 'keyboard', 'screen',
  'book', 'pen', 'paper', 'cup', 'plate', 'bottle', 'bag', 'box',
  // Nature
  'rain', 'snow', 'sun', 'moon', 'star', 'cloud', 'wind', 'storm',
  'tree', 'leaf', 'flower', 'grass', 'stone', 'rock', 'river', 'ocean',
  'mountain', 'hill', 'valley', 'field', 'forest', 'desert', 'sand', 'mud',
  // Materials
  'brick', 'cotton', 'silk', 'wool', 'leather', 'wood', 'metal', 'glass',
  'plastic', 'rubber', 'concrete', 'steel', 'iron', 'copper', 'silver', 'gold',
  // Food & drink
  'bread', 'rice', 'salt', 'sugar', 'coffee', 'tea', 'milk', 'water',
  'apple', 'orange', 'lemon', 'cinnamon', 'pepper', 'honey', 'butter', 'cheese',
  // Body
  'hand', 'finger', 'eye', 'ear', 'mouth', 'nose', 'hair', 'skin',
  'shoulder', 'chest', 'knee', 'foot', 'palm', 'wrist', 'elbow', 'spine',
  // Sounds & sensations
  'whisper', 'echo', 'shadow', 'flame', 'smoke', 'dust', 'frost', 'dew',
  // Places
  'kitchen', 'classroom', 'hallway', 'sidewalk', 'porch', 'garage', 'garden',
  'hospital', 'church', 'library', 'restaurant', 'airport', 'station', 'bridge',
  // Clothing
  'shirt', 'jacket', 'shoe', 'hat', 'scarf', 'glove', 'belt', 'button',
]);

export const WEAK_ADVERBS = new Set([
  'very', 'really', 'quite', 'somewhat', 'rather', 'pretty', 'basically',
  'actually', 'literally', 'totally', 'completely', 'absolutely', 'definitely',
  'certainly', 'obviously', 'clearly', 'simply', 'just', 'honestly',
  'truly', 'extremely', 'incredibly', 'amazingly', 'remarkably', 'particularly',
  'especially', 'essentially', 'fundamentally', 'generally', 'typically',
  'usually', 'normally', 'probably', 'possibly', 'perhaps', 'maybe',
  'slightly', 'hardly', 'barely', 'merely', 'almost', 'nearly',
  'seemingly', 'apparently', 'supposedly', 'allegedly', 'presumably',
  'practically', 'virtually', 'effectively', 'arguably', 'admittedly',
]);

export const TRANSITION_WORDS = {
  additive: new Set([
    'moreover', 'furthermore', 'additionally', 'also', 'besides', 'likewise',
    'similarly', 'indeed', 'in addition', 'in fact', 'coupled with',
    'not only', 'equally important', 'what is more',
  ]),
  adversative: new Set([
    'however', 'nevertheless', 'nonetheless', 'conversely', 'on the other hand',
    'in contrast', 'on the contrary', 'yet', 'still', 'although',
    'despite', 'regardless', 'notwithstanding', 'even so',
  ]),
  causal: new Set([
    'therefore', 'consequently', 'thus', 'hence', 'accordingly',
    'as a result', 'because', 'since', 'so', 'for this reason',
    'due to', 'owing to', 'that is why', 'it follows that',
  ]),
  sequential: new Set([
    'first', 'second', 'third', 'next', 'then', 'finally', 'lastly',
    'subsequently', 'meanwhile', 'afterward', 'previously', 'simultaneously',
    'before', 'after', 'initially', 'ultimately',
  ]),
} as const;

export const TEMPORAL_MARKERS = new Set([
  'then', 'after', 'before', 'meanwhile', 'suddenly', 'finally',
  'eventually', 'later', 'earlier', 'soon', 'immediately', 'gradually',
  'once', 'already', 'recently', 'now', 'today', 'yesterday',
  'tomorrow', 'always', 'never', 'whenever', 'during', 'while',
  'since', 'until', 'afterward', 'previously', 'simultaneously',
  'momentarily',
]);

export const METAPHOR_SIGNALS = new Set([
  'like', 'as if', 'as though', 'resembled', 'felt like', 'seemed like',
  'reminded me of', 'was a', 'were a', 'became a', 'turned into',
  'mirrored', 'echoed', 'reflected', 'embodied', 'symbolized',
  'represented', 'personified', 'evoked', 'conjured',
]);

// ============================================================================
// CRAFT FEATURES INTERFACE
// ============================================================================

export interface CraftFeatures {
  // Sentence-level
  sentenceRhythm: { lengths: number[]; variance: number; pattern: 'monotonous' | 'some_variety' | 'deliberate' | 'masterful' };
  sentenceOpeningVariety: number;  // 0-100, unique first-words / total sentences

  // Opening/Closing
  openingType: 'sensory_scene' | 'in_medias_res' | 'dialogue' | 'provocative' | 'question' | 'context' | 'quote_definition';
  closingType: 'circular' | 'forward_looking' | 'resonant_image' | 'question' | 'recontextualization' | 'summary';

  // Prose quality
  concreteAbstractRatio: number;          // 0-1
  verbStrength: { strong: number; weak: number; ratio: number };
  adverbDensity: number;                  // per 100 words
  toBeVerbFrequency: number;              // per 100 words

  // Structure
  transitionQuality: number;              // 0-100
  paragraphPacingVariance: number;        // coefficient of variation of paragraph lengths

  // Voice & Style
  voiceConsistency: number;               // 0-100
  dialogueQuality: { present: boolean; naturalness: number; integration: number };

  // Content signals
  emotionalArcTracker: number[];          // emotional intensity per paragraph
  abstractionGradient: number[];          // concrete-to-abstract per paragraph
  specificityScore: number;               // named entities + numbers per 100 words
  pronounRatio: { firstPerson: number; secondPerson: number; thirdPerson: number };

  // Economy
  redundancyScore: number;               // 0-100, lower is better
  fillerPhraseCount: number;

  // Thematic
  metaphorDensity: number;               // per paragraph average
  repetitionPattern: { intentional: number; accidental: number };
  temporalFlowScore: number;             // time marker consistency
}

// ============================================================================
// INTERNAL HELPERS: TEXT SPLITTING
// ============================================================================

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?]+)\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ============================================================================
// FEATURE EXTRACTION HELPERS (one per craft feature)
// ============================================================================

/** 1. Sentence rhythm — lengths, variance, and rhythm pattern classification */
function analyzeSentenceRhythm(sentences: string[]): CraftFeatures['sentenceRhythm'] {
  const lengths = sentences.map(s => splitWords(s).length);
  if (lengths.length === 0) {
    return { lengths: [], variance: 0, pattern: 'monotonous' };
  }

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, v) => sum + (v - mean) ** 2, 0) / lengths.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;

  // Check for deliberate short-long alternation patterns
  let deliberateAlternations = 0;
  for (let i = 1; i < lengths.length; i++) {
    const ratio = Math.max(lengths[i], lengths[i - 1]) / Math.max(Math.min(lengths[i], lengths[i - 1]), 1);
    if (ratio >= 2) deliberateAlternations++;
  }
  const alternationRate = lengths.length > 1 ? deliberateAlternations / (lengths.length - 1) : 0;

  // Check for strategic short sentences (< 6 words) placed after longer ones
  let strategicShorts = 0;
  for (let i = 1; i < lengths.length; i++) {
    if (lengths[i] <= 5 && lengths[i - 1] >= 15) strategicShorts++;
  }

  let pattern: CraftFeatures['sentenceRhythm']['pattern'];
  if (cv < 0.25) {
    pattern = 'monotonous';
  } else if (cv < 0.45) {
    pattern = 'some_variety';
  } else if (alternationRate >= 0.3 || strategicShorts >= 2) {
    pattern = 'masterful';
  } else {
    pattern = 'deliberate';
  }

  return { lengths, variance, pattern };
}

/** 2. Sentence opening variety — unique first words / total sentences (0-100) */
function analyzeSentenceOpeningVariety(sentences: string[]): number {
  if (sentences.length === 0) return 0;

  const firstWords = sentences.map(s => {
    const words = splitWords(s);
    return words[0] || '';
  }).filter(w => w.length > 0);

  if (firstWords.length === 0) return 0;

  const uniqueFirstWords = new Set(firstWords);
  return Math.round((uniqueFirstWords.size / firstWords.length) * 100);
}

/** 3. Opening type classification */
function classifyOpeningType(text: string, sentences: string[]): CraftFeatures['openingType'] {
  if (sentences.length === 0) return 'context';
  const firstSentence = sentences[0].toLowerCase();
  const firstParagraph = splitParagraphs(text)[0]?.toLowerCase() || firstSentence;

  // Dialogue: starts with quotation marks
  if (/^[""\u201C]/.test(sentences[0])) return 'dialogue';

  // Question: first sentence is a question
  if (/\?\s*$/.test(sentences[0])) return 'question';

  // Quote/definition: starts with a formal attribution or definition structure
  if (/^([""\u201C].+[""\u201D]|according to|as .+ (once )?said|webster defines|\w+ defines)/.test(firstSentence)) {
    return 'quote_definition';
  }

  // Sensory scene: temporal + sensory/location details
  const temporalAnchors = /\b(when|at|on|during|one|that)\b.*\b(morning|night|day|evening|summer|winter|year|moment|second|minute)\b/;
  const locationMarkers = /\b(in the|at the|on the|inside|outside|behind|above|below|corner|room|door|window|street|kitchen|classroom|stage|field)\b/;
  const hasSensory = splitWords(firstParagraph).some(w =>
    SENSORY_WORDS_BY_TYPE.sight.has(w) ||
    SENSORY_WORDS_BY_TYPE.sound.has(w) ||
    SENSORY_WORDS_BY_TYPE.touch.has(w)
  );
  if (temporalAnchors.test(firstParagraph) || (hasSensory && locationMarkers.test(firstParagraph))) {
    return 'sensory_scene';
  }

  // In medias res: starts with action verbs, present/past tense immediacy
  const actionOpeners = /^(i |we |she |he |they )?(ran|grabbed|slammed|pulled|pushed|jumped|threw|caught|dove|ripped|screamed|turned|opened|looked|heard|felt)/;
  if (actionOpeners.test(firstSentence)) return 'in_medias_res';

  // Provocative: bold/unexpected claim or short punchy statement
  const firstWordCount = splitWords(sentences[0]).length;
  if (firstWordCount <= 8 && !/\b(i am|my name|i was born|i have always)\b/.test(firstSentence)) {
    return 'provocative';
  }

  return 'context';
}

/** 4. Closing type classification */
function classifyClosingType(text: string, paragraphs: string[], sentences: string[]): CraftFeatures['closingType'] {
  if (sentences.length === 0) return 'summary';
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const lastSentence = sentences[sentences.length - 1].toLowerCase();
  const firstParagraph = paragraphs[0] || '';

  // Question: ends with a question
  if (/\?\s*$/.test(sentences[sentences.length - 1])) return 'question';

  // Circular: last paragraph echoes the first (shared significant words)
  const firstWords = new Set(splitWords(firstParagraph).filter(w => w.length > 4));
  const lastWords = splitWords(lastParagraph).filter(w => w.length > 4);
  const sharedWords = lastWords.filter(w => firstWords.has(w));
  if (firstWords.size > 0 && sharedWords.length >= 3) return 'circular';

  // Forward-looking: future tense or aspirational language
  const forwardSignals = /\b(will|going to|hope to|plan to|intend to|dream of|aspire|one day|someday|in the future|looking forward|next|ahead)\b/;
  if (forwardSignals.test(lastParagraph.toLowerCase())) return 'forward_looking';

  // Resonant image: sensory or concrete imagery in closing
  const lastParaWords = splitWords(lastParagraph);
  const hasSensoryClosing = lastParaWords.some(w =>
    SENSORY_WORDS_BY_TYPE.sight.has(w) ||
    SENSORY_WORDS_BY_TYPE.sound.has(w) ||
    SENSORY_WORDS_BY_TYPE.touch.has(w) ||
    CONCRETE_WORDS.has(w)
  );
  const hasAbstractClosing = lastParaWords.some(w => ABSTRACT_WORDS.has(w));
  if (hasSensoryClosing && !hasAbstractClosing) return 'resonant_image';

  // Recontextualization: reinterpreting earlier events with new understanding
  const recontextSignals = /\b(now i (see|understand|know|realize)|looking back|what i didn't (know|see|understand)|in retrospect|i (finally|now) (see|understand|know))\b/;
  if (recontextSignals.test(lastSentence)) return 'recontextualization';

  return 'summary';
}

/** 5. Concrete-to-abstract ratio (0-1, higher = more concrete) */
function analyzeConcreteAbstractRatio(words: string[]): number {
  let concreteCount = 0;
  let abstractCount = 0;
  for (const w of words) {
    if (CONCRETE_WORDS.has(w)) concreteCount++;
    if (ABSTRACT_WORDS.has(w)) abstractCount++;
  }
  const total = concreteCount + abstractCount;
  if (total === 0) return 0.5; // neutral when no signal words found
  return concreteCount / total;
}

/** 6. Verb strength analysis */
function analyzeVerbStrength(words: string[]): CraftFeatures['verbStrength'] {
  let strong = 0;
  let weak = 0;
  for (const w of words) {
    if (STRONG_VERBS.has(w)) strong++;
    if (WEAK_VERBS.has(w)) weak++;
  }
  const total = strong + weak;
  return {
    strong,
    weak,
    ratio: total > 0 ? strong / total : 0,
  };
}

/** 7. Adverb density (weak adverbs per 100 words) */
function analyzeAdverbDensity(words: string[]): number {
  if (words.length === 0) return 0;
  let count = 0;
  for (const w of words) {
    if (WEAK_ADVERBS.has(w)) count++;
  }
  return (count / words.length) * 100;
}

/** 8. To-be verb frequency (per 100 words) */
function analyzeToBeVerbFrequency(words: string[]): number {
  if (words.length === 0) return 0;
  const toBeVerbs = new Set(['am', 'is', 'are', 'was', 'were', 'been', 'being']);
  let count = 0;
  for (const w of words) {
    if (toBeVerbs.has(w)) count++;
  }
  return (count / words.length) * 100;
}

/** 9. Transition quality (0-100) — variety and placement of transitions */
function analyzeTransitionQuality(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 50; // single paragraph, neutral score

  const allTransitions = new Set([
    ...TRANSITION_WORDS.additive,
    ...TRANSITION_WORDS.adversative,
    ...TRANSITION_WORDS.causal,
    ...TRANSITION_WORDS.sequential,
  ]);

  // Check inter-paragraph transitions (first words/phrases of non-first paragraphs)
  let transitionsFound = 0;
  const typesUsed = new Set<string>();

  for (let i = 1; i < paragraphs.length; i++) {
    const lowerPara = paragraphs[i].toLowerCase();
    const firstWords = lowerPara.slice(0, 60); // check first ~60 chars

    for (const t of allTransitions) {
      if (firstWords.includes(t)) {
        transitionsFound++;
        // Track which category
        if (TRANSITION_WORDS.additive.has(t)) typesUsed.add('additive');
        if (TRANSITION_WORDS.adversative.has(t)) typesUsed.add('adversative');
        if (TRANSITION_WORDS.causal.has(t)) typesUsed.add('causal');
        if (TRANSITION_WORDS.sequential.has(t)) typesUsed.add('sequential');
        break; // count at most one per paragraph
      }
    }
  }

  const gapCount = paragraphs.length - 1;
  const coverage = transitionsFound / gapCount; // what % of paragraph gaps have transitions
  const diversity = typesUsed.size / 4; // how many of 4 types are used

  // Coverage: 0-60 points, Diversity: 0-40 points
  // But too many transitions is also bad (over-transitioning)
  const coverageScore = coverage <= 0.8
    ? coverage * 75  // up to 60 at 0.8 coverage
    : 60 - (coverage - 0.8) * 50; // penalize > 80% (feels formulaic)
  const diversityScore = diversity * 40;

  return Math.round(Math.max(0, Math.min(100, coverageScore + diversityScore)));
}

/** 10. Paragraph pacing variance — coefficient of variation of paragraph word counts */
function analyzeParagraphPacingVariance(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 0;

  const lengths = paragraphs.map(p => splitWords(p).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0;

  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / mean; // coefficient of variation
}

/** 11. Voice consistency (0-100) — consistency of formality, person, and tone */
function analyzeVoiceConsistency(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 80; // single paragraph gets a good default

  // Measure formality per paragraph via simple signals
  const formalityScores: number[] = [];
  const firstPersonRates: number[] = [];

  for (const para of paragraphs) {
    const words = splitWords(para);
    if (words.length === 0) continue;

    // Formality: avg word length as proxy
    const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
    formalityScores.push(avgLen);

    // First-person rate
    const fp = words.filter(w => ['i', 'me', 'my', 'mine', 'myself'].includes(w)).length;
    firstPersonRates.push(fp / words.length);
  }

  if (formalityScores.length <= 1) return 80;

  // Coefficient of variation for each signal
  const formalityCV = coefficientOfVariation(formalityScores);
  const fpCV = coefficientOfVariation(firstPersonRates);

  // Low variation = high consistency. CV < 0.1 = very consistent, > 0.4 = inconsistent
  const formalityScore = Math.max(0, 100 - formalityCV * 200);
  const fpScore = Math.max(0, 100 - fpCV * 150);

  return Math.round((formalityScore * 0.5 + fpScore * 0.5));
}

/** 12. Dialogue quality — presence, naturalness, integration */
function analyzeDialogueQuality(text: string): CraftFeatures['dialogueQuality'] {
  const dialogueMatches = text.match(/[""\u201C\u201D]([^""\u201C\u201D]+)[""\u201C\u201D]/g) || [];
  if (dialogueMatches.length === 0) {
    return { present: false, naturalness: 0, integration: 0 };
  }

  // Naturalness: contractions, short sentences, conversational markers
  let naturalnessSignals = 0;
  let totalDialogueWords = 0;
  for (const match of dialogueMatches) {
    const inner = match.replace(/[""\u201C\u201D]/g, '');
    const words = splitWords(inner);
    totalDialogueWords += words.length;

    // Contractions signal natural speech
    if (/\w+'\w+/.test(inner)) naturalnessSignals += 2;
    // Short dialogue (< 15 words) tends to be more natural
    if (words.length <= 15) naturalnessSignals += 1;
    // Conversational fillers
    if (/\b(well|oh|um|uh|hey|look|okay|yeah|no|yes)\b/i.test(inner)) naturalnessSignals += 1;
  }
  const naturalness = Math.min(100, Math.round((naturalnessSignals / dialogueMatches.length) * 25));

  // Integration: dialogue surrounded by action/description (not floating)
  let integratedCount = 0;
  for (const match of dialogueMatches) {
    const idx = text.indexOf(match);
    // Check if there's attribution or action near the dialogue
    const surrounding = text.slice(Math.max(0, idx - 50), Math.min(text.length, idx + match.length + 50));
    if (/\b(said|asked|whispered|replied|answered|shouted|murmured|exclaimed|muttered)\b/i.test(surrounding)) {
      integratedCount++;
    } else if (/\b(turned|looked|smiled|nodded|shook|paused|sighed|laughed|frowned)\b/i.test(surrounding)) {
      integratedCount++;
    }
  }
  const integration = Math.round((integratedCount / dialogueMatches.length) * 100);

  return { present: true, naturalness, integration };
}

/** 13. Emotional arc tracker — emotional intensity per paragraph (0-10 scale) */
function trackEmotionalArc(paragraphs: string[]): number[] {
  const emotionWords = new Set([
    'afraid', 'angry', 'anxious', 'ashamed', 'bitter', 'confused', 'desperate',
    'disappointed', 'embarrassed', 'excited', 'frustrated', 'grateful', 'guilty',
    'happy', 'heartbroken', 'helpless', 'hopeful', 'humiliated', 'jealous',
    'joyful', 'lonely', 'nervous', 'overwhelmed', 'panicked', 'peaceful',
    'proud', 'regretful', 'relieved', 'resentful', 'sad', 'scared', 'shocked',
    'terrified', 'thrilled', 'torn', 'uncertain', 'vulnerable', 'worried',
    'devastated', 'elated', 'furious', 'grief', 'horror', 'love', 'rage',
    'ached', 'yearned', 'craved', 'loathed', 'despised', 'cherished', 'dreaded',
    'sobbing', 'crying', 'tears', 'trembling', 'shaking', 'pounding', 'racing',
  ]);

  return paragraphs.map(para => {
    const words = splitWords(para);
    if (words.length === 0) return 0;
    const emotionCount = words.filter(w => emotionWords.has(w)).length;
    // Also count exclamation marks as emotional intensity
    const exclamations = (para.match(/!/g) || []).length;
    const rawIntensity = ((emotionCount + exclamations * 0.5) / words.length) * 100;
    return Math.min(10, Math.round(rawIntensity * 10) / 10);
  });
}

/** 14. Abstraction gradient — concrete-to-abstract ratio per paragraph (0=concrete, 1=abstract) */
function analyzeAbstractionGradient(paragraphs: string[]): number[] {
  return paragraphs.map(para => {
    const words = splitWords(para);
    let concreteCount = 0;
    let abstractCount = 0;
    for (const w of words) {
      if (CONCRETE_WORDS.has(w)) concreteCount++;
      if (ABSTRACT_WORDS.has(w)) abstractCount++;
    }
    const total = concreteCount + abstractCount;
    if (total === 0) return 0.5; // neutral
    return abstractCount / total; // 0 = all concrete, 1 = all abstract
  });
}

/** 15. Specificity score — named entities + numbers per 100 words */
function analyzeSpecificityScore(text: string, words: string[]): number {
  if (words.length === 0) return 0;

  // Count numbers (digits, ages, dates, quantities)
  const numberMatches = text.match(/\b\d[\d,.]*\b/g) || [];

  // Count capitalized words that aren't sentence starters (proxy for named entities)
  const sentences = splitSentences(text);
  let namedEntityCount = 0;
  for (const sentence of sentences) {
    // Skip the first word (sentence starter is always capitalized)
    const sWords = sentence.split(/\s+/).slice(1);
    for (const w of sWords) {
      if (/^[A-Z][a-z]/.test(w) && w.length > 1) namedEntityCount++;
    }
  }

  const specificItems = numberMatches.length + namedEntityCount;
  return (specificItems / words.length) * 100;
}

/** 16. Pronoun ratio — first/second/third person pronoun distribution */
function analyzePronounRatio(words: string[]): CraftFeatures['pronounRatio'] {
  if (words.length === 0) return { firstPerson: 0, secondPerson: 0, thirdPerson: 0 };

  const first = new Set(['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']);
  const second = new Set(['you', 'your', 'yours', 'yourself', 'yourselves']);
  const third = new Set(['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'it', 'its', 'itself']);

  let firstCount = 0;
  let secondCount = 0;
  let thirdCount = 0;

  for (const w of words) {
    if (first.has(w)) firstCount++;
    else if (second.has(w)) secondCount++;
    else if (third.has(w)) thirdCount++;
  }

  const total = firstCount + secondCount + thirdCount;
  if (total === 0) return { firstPerson: 0, secondPerson: 0, thirdPerson: 0 };

  return {
    firstPerson: Math.round((firstCount / total) * 100) / 100,
    secondPerson: Math.round((secondCount / total) * 100) / 100,
    thirdPerson: Math.round((thirdCount / total) * 100) / 100,
  };
}

/** 17. Redundancy score — repeated n-grams suggesting redundant content (0-100, lower is better) */
function analyzeRedundancyScore(sentences: string[]): number {
  if (sentences.length <= 2) return 0;

  // Check for repeated bigrams and trigrams across sentences
  const bigramCounts = new Map<string, number>();
  const trigramCounts = new Map<string, number>();

  for (const sentence of sentences) {
    const words = splitWords(sentence);
    const seenBigrams = new Set<string>();
    const seenTrigrams = new Set<string>();

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      // Skip very common bigrams
      if (!isCommonBigram(bigram) && !seenBigrams.has(bigram)) {
        seenBigrams.add(bigram);
        bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
      }

      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (!seenTrigrams.has(trigram)) {
          seenTrigrams.add(trigram);
          trigramCounts.set(trigram, (trigramCounts.get(trigram) || 0) + 1);
        }
      }
    }
  }

  // Count n-grams that appear in 3+ different sentences
  let redundantBigrams = 0;
  for (const count of bigramCounts.values()) {
    if (count >= 3) redundantBigrams++;
  }
  let redundantTrigrams = 0;
  for (const count of trigramCounts.values()) {
    if (count >= 2) redundantTrigrams++;
  }

  // Scale to 0-100
  const rawScore = (redundantBigrams * 3 + redundantTrigrams * 8);
  return Math.min(100, rawScore);
}

/** 18. Filler phrase count */
function countFillerPhrases(lowerText: string): number {
  let count = 0;
  for (const phrase of FILLER_PHRASES) {
    // Count all occurrences, not just presence
    let idx = 0;
    while ((idx = lowerText.indexOf(phrase, idx)) !== -1) {
      count++;
      idx += phrase.length;
    }
  }
  return count;
}

/** 19. Metaphor density — metaphor signal occurrences per paragraph (average) */
function analyzeMetaphorDensity(paragraphs: string[]): number {
  if (paragraphs.length === 0) return 0;

  let totalSignals = 0;
  for (const para of paragraphs) {
    const lowerPara = para.toLowerCase();
    for (const signal of METAPHOR_SIGNALS) {
      // Count phrase-level signals
      let idx = 0;
      while ((idx = lowerPara.indexOf(signal, idx)) !== -1) {
        totalSignals++;
        idx += signal.length;
      }
    }
  }

  return Math.round((totalSignals / paragraphs.length) * 100) / 100;
}

/** 20. Repetition pattern — intentional (anaphora, parallelism) vs accidental (same word/phrase) */
function analyzeRepetitionPattern(sentences: string[]): CraftFeatures['repetitionPattern'] {
  if (sentences.length < 3) return { intentional: 0, accidental: 0 };

  let intentional = 0;
  let accidental = 0;

  // Detect anaphora: consecutive sentences starting with the same word(s)
  for (let i = 1; i < sentences.length; i++) {
    const prevFirst = splitWords(sentences[i - 1]).slice(0, 2).join(' ');
    const currFirst = splitWords(sentences[i]).slice(0, 2).join(' ');
    if (prevFirst === currFirst && prevFirst.length > 2) {
      intentional++;
    }
  }

  // Detect parallelism: similar syntactic structures (simplified: same POS-like pattern in first 3 words)
  for (let i = 1; i < sentences.length; i++) {
    const prevWords = splitWords(sentences[i - 1]);
    const currWords = splitWords(sentences[i]);
    if (prevWords.length >= 3 && currWords.length >= 3) {
      // Check for -ing parallel starts
      if (prevWords[0].endsWith('ing') && currWords[0].endsWith('ing') && prevWords[0] !== currWords[0]) {
        intentional++;
      }
    }
  }

  // Detect accidental repetition: non-common content words appearing 4+ times
  const wordFreq = new Map<string, number>();
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'it', 'is', 'was', 'were', 'are', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'you', 'he', 'she', 'they', 'not']);

  for (const sentence of sentences) {
    const words = splitWords(sentence);
    for (const w of words) {
      if (w.length > 3 && !commonWords.has(w)) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      }
    }
  }

  for (const count of wordFreq.values()) {
    if (count >= 4) accidental++;
  }

  return { intentional, accidental };
}

/** 21. Temporal flow score (0-100) — consistency and progression of time markers */
function analyzeTemporalFlowScore(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 50; // neutral for single paragraph

  const markersPerParagraph: number[] = [];
  let totalMarkers = 0;

  for (const para of paragraphs) {
    const words = splitWords(para);
    let count = 0;
    for (const w of words) {
      if (TEMPORAL_MARKERS.has(w)) count++;
    }
    markersPerParagraph.push(count);
    totalMarkers += count;
  }

  // No temporal markers at all — could be intentional (present-tense throughout)
  if (totalMarkers === 0) return 40;

  // Check for progression: temporal markers should appear somewhat consistently
  const paragraphsWithMarkers = markersPerParagraph.filter(c => c > 0).length;
  const coverage = paragraphsWithMarkers / paragraphs.length;

  // Check for sequential ordering signals
  const fullText = paragraphs.join(' ').toLowerCase();
  const sequentialPairs = [
    ['before', 'after'], ['first', 'then'], ['initially', 'eventually'],
    ['earlier', 'later'], ['once', 'now'], ['then', 'finally'],
  ];
  let sequentialCount = 0;
  for (const [early, late] of sequentialPairs) {
    const earlyIdx = fullText.indexOf(early);
    const lateIdx = fullText.indexOf(late);
    if (earlyIdx >= 0 && lateIdx > earlyIdx) sequentialCount++;
  }

  const coverageScore = coverage * 50; // 0-50 for marker coverage
  const sequentialScore = Math.min(50, sequentialCount * 15); // 0-50 for sequential ordering

  return Math.round(Math.max(0, Math.min(100, coverageScore + sequentialScore)));
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/** Coefficient of variation (std dev / mean) */
function coefficientOfVariation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

/** Check if a bigram is too common to count as redundancy */
function isCommonBigram(bigram: string): boolean {
  const common = new Set([
    'i was', 'i had', 'i am', 'i have', 'i would', 'i could', 'i did', 'i will',
    'it was', 'it is', 'it had', 'there was', 'there were', 'there is',
    'to the', 'in the', 'on the', 'at the', 'of the', 'for the', 'with the',
    'and the', 'and i', 'but i', 'that i', 'to be', 'of my', 'in my',
    'i felt', 'i knew', 'i thought', 'i realized', 'i wanted',
  ]);
  return common.has(bigram);
}

// ============================================================================
// MAIN EXTRACTOR
// ============================================================================

/**
 * Extract 25 craft-level features from essay text.
 * Deterministic, no LLM calls. Target: ~100ms for 650 words.
 */
export function extractCraftFeatures(text: string): CraftFeatures {
  if (!text || text.trim().length === 0) {
    return emptyFeatures();
  }

  const paragraphs = splitParagraphs(text);
  const sentences = splitSentences(text);
  const words = splitWords(text);
  const lowerText = text.toLowerCase();

  return {
    // Sentence-level
    sentenceRhythm: analyzeSentenceRhythm(sentences),
    sentenceOpeningVariety: analyzeSentenceOpeningVariety(sentences),

    // Opening/Closing
    openingType: classifyOpeningType(text, sentences),
    closingType: classifyClosingType(text, paragraphs, sentences),

    // Prose quality
    concreteAbstractRatio: analyzeConcreteAbstractRatio(words),
    verbStrength: analyzeVerbStrength(words),
    adverbDensity: analyzeAdverbDensity(words),
    toBeVerbFrequency: analyzeToBeVerbFrequency(words),

    // Structure
    transitionQuality: analyzeTransitionQuality(paragraphs),
    paragraphPacingVariance: analyzeParagraphPacingVariance(paragraphs),

    // Voice & Style
    voiceConsistency: analyzeVoiceConsistency(paragraphs),
    dialogueQuality: analyzeDialogueQuality(text),

    // Content signals
    emotionalArcTracker: trackEmotionalArc(paragraphs),
    abstractionGradient: analyzeAbstractionGradient(paragraphs),
    specificityScore: analyzeSpecificityScore(text, words),
    pronounRatio: analyzePronounRatio(words),

    // Economy
    redundancyScore: analyzeRedundancyScore(sentences),
    fillerPhraseCount: countFillerPhrases(lowerText),

    // Thematic
    metaphorDensity: analyzeMetaphorDensity(paragraphs),
    repetitionPattern: analyzeRepetitionPattern(sentences),
    temporalFlowScore: analyzeTemporalFlowScore(paragraphs),
  };
}

/** Return a zeroed-out CraftFeatures for empty/null input */
function emptyFeatures(): CraftFeatures {
  return {
    sentenceRhythm: { lengths: [], variance: 0, pattern: 'monotonous' },
    sentenceOpeningVariety: 0,
    openingType: 'context',
    closingType: 'summary',
    concreteAbstractRatio: 0,
    verbStrength: { strong: 0, weak: 0, ratio: 0 },
    adverbDensity: 0,
    toBeVerbFrequency: 0,
    transitionQuality: 0,
    paragraphPacingVariance: 0,
    voiceConsistency: 0,
    dialogueQuality: { present: false, naturalness: 0, integration: 0 },
    emotionalArcTracker: [],
    abstractionGradient: [],
    specificityScore: 0,
    pronounRatio: { firstPerson: 0, secondPerson: 0, thirdPerson: 0 },
    redundancyScore: 0,
    fillerPhraseCount: 0,
    metaphorDensity: 0,
    repetitionPattern: { intentional: 0, accidental: 0 },
    temporalFlowScore: 0,
  };
}
