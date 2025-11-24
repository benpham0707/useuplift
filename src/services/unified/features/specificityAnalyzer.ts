/**
 * SPECIFICITY & EVIDENCE ANALYZER
 *
 * Dimension 3: Specificity & Evidence (10% weight)
 *
 * Detects concrete details, numbers, and evidence that build credibility:
 * - Quantified metrics (hours, people, percentages, dollars)
 * - Proper nouns (names, places, organizations, titles)
 * - Time specificity (dates, durations, timelines)
 * - Before/after comparisons with numbers
 * - Concrete vs vague language
 *
 * Works alongside vividnessAnalyzer (sensory details) to form complete
 * Specificity dimension score.
 */

export interface SpecificityAnalysis {
  // Overall assessment
  specificity_score: number; // 0-10
  evidence_strength: 'concrete' | 'mixed' | 'vague' | 'abstract';

  // Quantified metrics
  numbers_count: number;
  numbers_examples: string[];
  has_percentages: boolean;
  has_time_duration: boolean;
  has_money_amounts: boolean;
  has_people_counts: boolean;

  // Proper nouns
  proper_nouns_count: number;
  person_names: string[];
  place_names: string[];
  organization_names: string[];
  specific_titles: string[];

  // Time specificity
  has_specific_dates: boolean;
  has_time_markers: boolean;
  time_examples: string[];

  // Before/after comparisons
  has_before_after: boolean;
  comparison_examples: string[];

  // Concrete vs abstract
  concrete_details_count: number;
  vague_phrases_count: number;
  vague_examples: string[];

  // Guidance
  strengths: string[];
  weaknesses: string[];
  quick_wins: string[];
}

/**
 * Analyze specificity and evidence in an essay
 */
export function analyzeSpecificity(essayText: string): SpecificityAnalysis {

  // Numbers and metrics
  const numberMatches = detectNumbers(essayText);
  const percentages = /\d+%|\d+ percent/gi.exec(essayText);
  const timeDuration = /\d+\s*(hour|minute|week|month|year|day)s?/gi.exec(essayText);
  const moneyAmounts = /\$\d+|(\d+)\s*dollar/gi.exec(essayText);
  const peopleCounts = /(\d+)\s*(people|students|members|participants)/gi.exec(essayText);

  // Proper nouns (capitalized words that aren't sentence starts)
  const properNouns = detectProperNouns(essayText);

  // Time markers
  const specificDates = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(,\s*\d{4})?|\d{1,2}\/\d{1,2}(\/\d{2,4})?/gi.exec(essayText);
  const timeMarkers = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|morning|afternoon|evening|night|9\s*PM|10\s*AM)\b/gi.exec(essayText);

  // Before/after language
  const beforeAfter = detectBeforeAfter(essayText);

  // Vague phrases
  const vaguePhrases = detectVaguePhrases(essayText);

  // Calculate concrete details (numbers + proper nouns)
  const concreteCount = numberMatches.length + properNouns.all.length;

  // Calculate specificity score (0-10)
  let score = 5.0; // Start at baseline

  // Numbers and metrics (+3 max)
  if (numberMatches.length >= 5) score += 1.5;
  else if (numberMatches.length >= 3) score += 1.0;
  else if (numberMatches.length >= 1) score += 0.5;

  if (percentages) score += 0.5;
  if (timeDuration) score += 0.5;
  if (moneyAmounts || peopleCounts) score += 0.5;

  // Proper nouns (+2 max)
  if (properNouns.all.length >= 5) score += 1.0;
  else if (properNouns.all.length >= 3) score += 0.6;
  else if (properNouns.all.length >= 1) score += 0.3;

  if (properNouns.people.length > 0) score += 0.5;
  if (properNouns.places.length > 0) score += 0.3;
  if (properNouns.organizations.length > 0) score += 0.2;

  // Time specificity (+1 max)
  if (specificDates) score += 0.5;
  if (timeMarkers) score += 0.5;

  // Before/after (+1 max)
  if (beforeAfter.count >= 2) score += 1.0;
  else if (beforeAfter.count >= 1) score += 0.5;

  // Penalties for vagueness (-2 max)
  if (vaguePhrases.length >= 5) score -= 1.5;
  else if (vaguePhrases.length >= 3) score -= 1.0;
  else if (vaguePhrases.length >= 1) score -= 0.5;

  // Cap at 0-10
  score = Math.max(0, Math.min(10, score));

  // Determine evidence strength
  let evidenceStrength: 'concrete' | 'mixed' | 'vague' | 'abstract';
  if (score >= 8) evidenceStrength = 'concrete';
  else if (score >= 6) evidenceStrength = 'mixed';
  else if (score >= 4) evidenceStrength = 'vague';
  else evidenceStrength = 'abstract';

  // Generate guidance
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const quickWins: string[] = [];

  if (numberMatches.length >= 3) {
    strengths.push(`Strong use of numbers (${numberMatches.length} quantified details)`);
  } else if (numberMatches.length === 0) {
    weaknesses.push('No numbers or metrics to prove impact');
    quickWins.push('Add 2-3 specific numbers: hours spent, people impacted, or % improvement');
  }

  if (properNouns.all.length >= 3) {
    strengths.push(`Good specificity with ${properNouns.all.length} proper nouns`);
  } else {
    weaknesses.push('Lacks specific names, places, or organizations');
    quickWins.push('Name specific people, places, or programs instead of "my mentor" or "the club"');
  }

  if (vaguePhrases.length >= 3) {
    weaknesses.push(`Too many vague phrases (${vaguePhrases.length} found)`);
    quickWins.push(`Replace vague language: instead of "${vaguePhrases[0]}", give exact details`);
  }

  if (!beforeAfter.count) {
    quickWins.push('Add a before/after comparison with specific numbers to show change');
  }

  return {
    specificity_score: parseFloat(score.toFixed(2)),
    evidence_strength: evidenceStrength,

    numbers_count: numberMatches.length,
    numbers_examples: numberMatches.slice(0, 5),
    has_percentages: !!percentages,
    has_time_duration: !!timeDuration,
    has_money_amounts: !!moneyAmounts,
    has_people_counts: !!peopleCounts,

    proper_nouns_count: properNouns.all.length,
    person_names: properNouns.people,
    place_names: properNouns.places,
    organization_names: properNouns.organizations,
    specific_titles: properNouns.titles,

    has_specific_dates: !!specificDates,
    has_time_markers: !!timeMarkers,
    time_examples: [
      specificDates?.[0],
      timeMarkers?.[0]
    ].filter(Boolean) as string[],

    has_before_after: beforeAfter.count > 0,
    comparison_examples: beforeAfter.examples,

    concrete_details_count: concreteCount,
    vague_phrases_count: vaguePhrases.length,
    vague_examples: vaguePhrases.slice(0, 3),

    strengths,
    weaknesses,
    quick_wins: quickWins
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectNumbers(text: string): string[] {
  const patterns = [
    /\b\d+\s*(hour|minute|week|month|year|day)s?\b/gi,
    /\b\d+\s*(people|students|members|participants|volunteers)\b/gi,
    /\b\d+%|\b\d+\s*percent\b/gi,
    /\$\d+[\d,]*|\b\d+\s*dollars?\b/gi,
    /\b\d+\s*(points|grades|scores)\b/gi,
    /\b(first|second|third|1st|2nd|3rd)\s*(place|position|rank)\b/gi,
    /\b\d+[\d,]*\s*(times|sessions|meetings|events)\b/gi
  ];

  const matches: string[] = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) matches.push(...found);
  }

  return [...new Set(matches)]; // Unique matches
}

function detectProperNouns(text: string): {
  all: string[];
  people: string[];
  places: string[];
  organizations: string[];
  titles: string[];
} {
  // Split into sentences to avoid sentence-start capitals
  const sentences = text.split(/[.!?]+/);
  const properNouns: string[] = [];
  const people: string[] = [];
  const places: string[] = [];
  const organizations: string[] = [];
  const titles: string[] = [];

  // Common title patterns
  const titlePattern = /(Professor|Dr\.|Mr\.|Mrs\.|Ms\.|Coach|President|Director|Captain)\s+[A-Z][a-z]+/g;
  const titleMatches = text.match(titlePattern);
  if (titleMatches) {
    titles.push(...titleMatches);
    properNouns.push(...titleMatches);
  }

  // Organization patterns
  const orgPattern = /\b([A-Z][a-z]+\s+(Club|Society|Association|Foundation|Organization|Team|Committee|Council))\b/g;
  const orgMatches = text.match(orgPattern);
  if (orgMatches) {
    organizations.push(...orgMatches);
    properNouns.push(...orgMatches);
  }

  // Place patterns (cities, schools, buildings)
  const placePattern = /\b([A-Z][a-z]+\s+(High School|University|College|Hospital|Library|Center|Park|City|County))\b/g;
  const placeMatches = text.match(placePattern);
  if (placeMatches) {
    places.push(...placeMatches);
    properNouns.push(...placeMatches);
  }

  // Simple capitalized words (potential names) - not at sentence start
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    for (let i = 1; i < words.length; i++) { // Skip first word (sentence start)
      const word = words[i];
      if (/^[A-Z][a-z]{2,}$/.test(word) && !isCommonWord(word)) {
        people.push(word);
        properNouns.push(word);
      }
    }
  }

  return {
    all: [...new Set(properNouns)],
    people: [...new Set(people)],
    places: [...new Set(places)],
    organizations: [...new Set(organizations)],
    titles: [...new Set(titles)]
  };
}

function detectBeforeAfter(text: string): { count: number; examples: string[] } {
  const patterns = [
    /before.*?after/gi,
    /used to.*?now/gi,
    /initially.*?(eventually|finally|ultimately)/gi,
    /at first.*?(later|then|eventually)/gi,
    /went from.*?to/gi,
    /increased from.*?to/gi,
    /improved from.*?to/gi
  ];

  const examples: string[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  return { count, examples: [...new Set(examples)] };
}

function detectVaguePhrases(text: string): string[] {
  const vaguePhrases = [
    /\b(many|several|some|a lot of|lots of|a bunch of|numerous)\b/gi,
    /\b(things|stuff|ideas|issues|problems|situations)\b/gi,
    /\b(pretty|very|really|quite|somewhat|kind of|sort of)\s+\w+/gi,
    /\b(good|bad|nice|great|amazing|awesome)\b/gi,
    /\b(helped|worked on|participated in|was involved in|contributed to)\b/gi
  ];

  const matches: string[] = [];
  for (const pattern of vaguePhrases) {
    const found = text.match(pattern);
    if (found) matches.push(...found);
  }

  return [...new Set(matches)];
}

function isCommonWord(word: string): boolean {
  const common = ['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Which',
                  'After', 'Before', 'During', 'Through', 'About', 'Above', 'Below', 'Between'];
  return common.includes(word);
}
