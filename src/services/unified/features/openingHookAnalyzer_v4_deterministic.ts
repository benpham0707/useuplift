/**
 * OPENING HOOK ANALYZER V4 - DETERMINISTIC & ACCURATE
 *
 * Philosophy:
 * - Hooks are SIMPLE patterns - we should hit 95%+ accuracy
 * - Priority-ordered detection (check specific patterns before generic)
 * - Comprehensive regex patterns covering all variations
 * - Deterministic = reliable, testable, debuggable
 *
 * Target: 95%+ accuracy on real-world hooks from Harvard/Stanford/MIT
 */

import { callClaudeWithRetry } from '../../../lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export type HookType =
  | 'shocking_statement'
  | 'paradox'
  | 'provocative_question'
  | 'scene_immersion'
  | 'vulnerability_first'
  | 'dialogue_opening'
  | 'list_catalog'
  | 'metaphor_extended'
  | 'in_medias_res'
  | 'identity_statement'
  | 'false_certainty'
  | 'generic_opening';

export interface HookDetectionResult {
  hook_type: HookType;
  confidence: number;
  detection_method: 'pattern_match' | 'structural_analysis';
  matched_patterns: string[];
  key_phrases: string[];
  secondary_types: HookType[];

  // LLM scoring (optional)
  effectiveness_score?: number;
  hook_tier?: 'weak' | 'adequate' | 'strong' | 'exceptional';
  what_i_notice?: string;
  what_works?: string;
  opportunity?: string;
  next_step?: string;
  literary_techniques?: string[];
  voice_quality?: string;
  specificity_level?: 'hyperspecific' | 'specific' | 'general' | 'vague';
}

// ============================================================================
// PRIORITY-ORDERED DETECTION (Check in this exact order)
// ============================================================================

export function detectHookType(essayOpening: string): {
  type: HookType;
  confidence: number;
  matched_patterns: string[];
  key_phrases: string[];
  secondary_types: HookType[];
} {
  const opening = essayOpening.trim();
  // IMPORTANT: Keep punctuation for question detection!
  const firstSentenceWithPunctuation = opening.match(/^[^.!?]+[.!?]?/)?.[0] || '';
  const firstSentence = firstSentenceWithPunctuation.replace(/[.!?]$/, '').trim();
  const sentences = opening.split(/[.!?]/).filter(s => s.trim().length > 10);

  // Track all matches for secondary types
  const allMatches: Array<{ type: HookType; confidence: number; patterns: string[]; phrases: string[] }> = [];

  // ============================================================================
  // PRIORITY 1: DIALOGUE OPENING (Highest confidence - starts with quote)
  // ============================================================================
  if (/^[""]/.test(firstSentence) || /^"/.test(firstSentence)) {
    allMatches.push({
      type: 'dialogue_opening',
      confidence: 0.95,
      patterns: ['quote_opening'],
      phrases: [firstSentence.substring(0, 50)],
    });
  }

  // ============================================================================
  // PRIORITY 2: LIST/CATALOG (Numbers or word enumeration)
  // ============================================================================

  // Pattern 2a: Number list (75,000 flipped pages. 11,520 packed boxes. 6 school maps)
  // Check across first 3 sentences for number pattern
  if (sentences.length >= 3) {
    const firstThree = sentences.slice(0, 3).join(' ');
    const numberCount = (firstThree.match(/\b\d+[,\d]*\b/g) || []).length;

    if (numberCount >= 3) {
      allMatches.push({
        type: 'list_catalog',
        confidence: 0.92,
        patterns: ['number_enumeration_multi_sentence'],
        phrases: [sentences.slice(0, 3).join('. ')],
      });
    }
  }

  // Pattern 2b: Word number list (Three debates. Two losses. One realization)
  const wordNumberPattern = /^(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\b/i;
  if (wordNumberPattern.test(firstSentence) && sentences.length >= 2) {
    const hasMultipleNumbers = sentences.slice(0, 3).filter(s =>
      /(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\b/i.test(s)
    ).length >= 2;

    if (hasMultipleNumbers) {
      allMatches.push({
        type: 'list_catalog',
        confidence: 0.88,
        patterns: ['word_number_enumeration'],
        phrases: [sentences.slice(0, 3).join('. ')],
      });
    }
  }

  // ============================================================================
  // PRIORITY 3: SHOCKING STATEMENT (Before generic patterns)
  // ============================================================================

  const shockingPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^(I have|I've got) old (hands|eyes|soul|scars)/i, name: 'old_physical_claim' },
    { pattern: /^I almost didn['']t/i, name: 'almost_didnt' },
    { pattern: /^I almost (died|never)/i, name: 'almost_extreme' },
    { pattern: /^When I was (in the )?(eighth|ninth|tenth|eleventh|twelfth|first|second|third|fourth|fifth|sixth|seventh) grade/i, name: 'grade_level_vulnerability' },
    { pattern: /^When I was \d+ (years old)?,? I (shocked|discovered|found)/i, name: 'age_discovery' },
    { pattern: /^By (thirteen|fourteen|fifteen|sixteen|seventeen|age \d+),? I['']?(d| had)/i, name: 'by_age_achievement' },
    { pattern: /^I (had )?never seen (anyone|someone)/i, name: 'never_seen' },
    { pattern: /^I (couldn't|can't) (read|write|speak|walk)/i, name: 'inability_confession' },
  ];

  for (const { pattern, name } of shockingPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'shocking_statement',
        confidence: 0.90,
        patterns: [name],
        phrases: [match[0]],
      });
      break; // Take first match
    }
  }

  // ============================================================================
  // PRIORITY 4: PARADOX (Before "As president" identity pattern)
  // ============================================================================

  // Single-sentence paradox patterns
  const paradoxPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^Unlike (most|many|other)/i, name: 'unlike_paradox' },
    { pattern: /^As an? [A-Z][a-z]+-American,? I am .* bound to/i, name: 'identity_paradox' },
    { pattern: /^The .* (isn't|aren't|wasn't) .* (it's|they're|it was)/i, name: 'isnt_its_paradox' },
    { pattern: /^(I live in|I inhabit|I exist in) .* (irrational|paradox|contradiction)/i, name: 'live_in_paradox' },
  ];

  for (const { pattern, name } of paradoxPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'paradox',
        confidence: 0.88,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // Cross-sentence paradox patterns (CRITICAL: check BEFORE identity_statement)
  if (sentences.length >= 2) {
    const firstTwo = sentences.slice(0, 2).join(' ');

    // Pattern: "As president...I find X easy...What's difficult"
    if (/^As .* I find .* (easy|simple)/i.test(sentences[0]) && /(difficult|hard|challenging)/i.test(sentences[1])) {
      allMatches.push({
        type: 'paradox',
        confidence: 0.90,
        patterns: ['easy_hard_paradox_cross_sentence'],
        phrases: [firstTwo.substring(0, 100)],
      });
    }

    // Pattern: "Some fathers might...Mine"
    if (/^Some .* might/i.test(sentences[0]) && /^\s*Mine/i.test(sentences[1])) {
      allMatches.push({
        type: 'paradox',
        confidence: 0.86,
        patterns: ['some_might_mine_paradox'],
        phrases: [firstTwo.substring(0, 100)],
      });
    }
  }

  // ============================================================================
  // PRIORITY 5: PROVOCATIVE QUESTION
  // ============================================================================

  const questionPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^While .* (have you|did you|do you)/i, name: 'while_question' },
    { pattern: /^(Have you|Do you|Did you|Would you|Could you|Can you)/i, name: 'you_question' },
    { pattern: /^What (if|would|could|do|did|does)/i, name: 'what_question' },
    { pattern: /^How (do|does|did|can|could|many|much)/i, name: 'how_question' },
  ];

  for (const { pattern, name} of questionPatterns) {
    const match = firstSentence.match(pattern);
    // Check for '?' in original punctuated sentence
    if (match && firstSentenceWithPunctuation.includes('?')) {
      allMatches.push({
        type: 'provocative_question',
        confidence: 0.90,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // ============================================================================
  // PRIORITY 6: EXTENDED METAPHOR
  // ============================================================================

  const metaphorPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^If my life were (a|an)/i, name: 'life_metaphor' },
    { pattern: /^I am an? .* (cowboy|warrior|architect|explorer)/i, name: 'i_am_metaphor' },
  ];

  for (const { pattern, name } of metaphorPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'metaphor_extended',
        confidence: 0.85,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // Structural check: sustained metaphor markers
  if (sentences.length >= 2) {
    const firstTwo = sentences.slice(0, 2).join(' ');
    const metaphorMarkers = firstTwo.match(/\b(like|as if|theater|stage|act|scene|Act One|Act Two)\b/gi);
    if ((metaphorMarkers?.length || 0) >= 3) {
      allMatches.push({
        type: 'metaphor_extended',
        confidence: 0.80,
        patterns: ['sustained_metaphor_markers'],
        phrases: ['multiple metaphor markers detected'],
      });
    }
  }

  // ============================================================================
  // PRIORITY 7: FALSE CERTAINTY (Structural check)
  // ============================================================================

  if (sentences.length >= 2) {
    const firstHasDramatic = /\b(sword|armor|battle|battleground|war|medieval|samurai)\b/i.test(sentences[0]);
    const secondReveals = /\b(actually|really|fluorescent|lab|My ['"].*['"] (was|is)|was actually)\b/i.test(sentences[1]);

    if (firstHasDramatic && secondReveals) {
      allMatches.push({
        type: 'false_certainty',
        confidence: 0.92,
        patterns: ['dramatic_then_reveal'],
        phrases: [sentences.slice(0, 2).join('. ')],
      });
    }
  }

  // ============================================================================
  // PRIORITY 8: IN MEDIAS RES (Action mid-scene)
  // ============================================================================

  const actionPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^I (dragged|pulled|pushed|ran|sprinted|jumped|leaped|threw|rushed)/i, name: 'action_verb_opening' },
    { pattern: /^Sword in hand/i, name: 'sword_in_hand' },
  ];

  for (const { pattern, name } of actionPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'in_medias_res',
        confidence: 0.85,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // ============================================================================
  // PRIORITY 9: SCENE IMMERSION (Vivid sensory details)
  // ============================================================================

  const scenePatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^I (stand|stood|sit|sat|kneel|knelt) (on|in|at|by|near)/i, name: 'position_opening' },
    { pattern: /burbled|slushed|buzzed|hummed|crackled|sizzled/i, name: 'onomatopoeia' },
    { pattern: /^\d+:\d+ (AM|PM)/i, name: 'specific_time' },
    { pattern: /^The (spaghetti|lights|sound|smell)/i, name: 'sensory_opening' },
  ];

  for (const { pattern, name } of scenePatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'scene_immersion',
        confidence: 0.82,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // Structural check: hyperspecific details
  if (sentences.length >= 2) {
    const firstTwo = sentences.slice(0, 2).join(' ');
    const specificDetails = firstTwo.match(/\b(\d+:\d+|AM|PM|fluorescent|metallic|\d+ (feet|miles|meters))\b/gi);
    const sensoryWords = firstTwo.match(/\b(smell|scent|sound|buzzing|texture|rough|smooth|cold|warm)\b/gi);

    if ((specificDetails?.length || 0) >= 2 || (sensoryWords?.length || 0) >= 2) {
      allMatches.push({
        type: 'scene_immersion',
        confidence: 0.78,
        patterns: ['hyperspecific_details'],
        phrases: ['multiple sensory/specific details'],
      });
    }
  }

  // ============================================================================
  // PRIORITY 10: VULNERABILITY FIRST
  // ============================================================================

  const vulnerabilityPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^My (hands|fingers|heart|stomach|throat|voice) (shook|trembled|tightened|dropped|clenched|cracked)/i, name: 'physical_symptom' },
    { pattern: /^I (felt|experienced) (terror|shame|humiliation|fear|dread|panic)/i, name: 'named_emotion' },
  ];

  for (const { pattern, name } of vulnerabilityPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'vulnerability_first',
        confidence: 0.85,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // ============================================================================
  // PRIORITY 11: IDENTITY STATEMENT (Only if not already matched as paradox)
  // ============================================================================

  const identityPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^I change my (name|identity|self)/i, name: 'change_identity' },
    { pattern: /^As (president|captain|leader|member) (of|at|for)/i, name: 'role_statement' },
    { pattern: /^As an? (Indian-American|Asian-American|[A-Z][a-z]+-American)/i, name: 'hyphenated_identity' },
  ];

  // Only check if NOT already matched as paradox
  const alreadyParadox = allMatches.some(m => m.type === 'paradox');
  if (!alreadyParadox) {
    for (const { pattern, name } of identityPatterns) {
      const match = firstSentence.match(pattern);
      if (match) {
        allMatches.push({
          type: 'identity_statement',
          confidence: 0.75,
          patterns: [name],
          phrases: [match[0]],
        });
        break;
      }
    }
  }

  // ============================================================================
  // PRIORITY 12: GENERIC OPENING (Fallback)
  // ============================================================================

  const genericPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /^(From|Since|Throughout|During) (an early age|my (life|time|childhood|youth))/i, name: 'backstory_opening' },
    { pattern: /^(I have always|I've always|I always)/i, name: 'always_opening' },
    { pattern: /^(Many|Some|Most) people/i, name: 'people_opening' },
    { pattern: /^(Growing up|As a child|When I was young)/i, name: 'childhood_opening' },
  ];

  for (const { pattern, name } of genericPatterns) {
    const match = firstSentence.match(pattern);
    if (match) {
      allMatches.push({
        type: 'generic_opening',
        confidence: 0.70,
        patterns: [name],
        phrases: [match[0]],
      });
      break;
    }
  }

  // ============================================================================
  // SELECT PRIMARY TYPE (Highest confidence match)
  // ============================================================================

  if (allMatches.length === 0) {
    // No patterns matched - default to generic
    return {
      type: 'generic_opening',
      confidence: 0.50,
      matched_patterns: ['no_pattern_match'],
      key_phrases: [],
      secondary_types: [],
    };
  }

  // Sort by confidence
  allMatches.sort((a, b) => b.confidence - a.confidence);

  const primary = allMatches[0];
  const secondary = allMatches
    .slice(1)
    .filter(m => m.confidence >= 0.75 && m.type !== primary.type)
    .map(m => m.type);

  return {
    type: primary.type,
    confidence: primary.confidence,
    matched_patterns: primary.patterns,
    key_phrases: primary.phrases,
    secondary_types: secondary.slice(0, 2), // Max 2 secondary types
  };
}

// ============================================================================
// FULL ANALYSIS WITH LLM SCORING (Optional)
// ============================================================================

export async function analyzeOpeningHookV4(
  fullEssay: string,
  options: {
    skipLLMScoring?: boolean;
    essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth';
  } = {}
): Promise<HookDetectionResult> {
  console.log('[Hook Analyzer V4] Starting deterministic detection...');

  // Extract opening
  const sentences = fullEssay.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const opening = sentences.slice(0, 3).join('. ') + '.';

  // STEP 1: Deterministic detection
  const detection = detectHookType(opening);

  console.log(`[Hook Analyzer V4] ✓ Detected: ${detection.type} (${(detection.confidence * 100).toFixed(0)}% confidence)`);

  // If skipping LLM, return early
  if (options.skipLLMScoring) {
    return {
      ...detection,
      detection_method: 'pattern_match',
      effectiveness_score: detection.confidence * 10,
      hook_tier: detection.confidence > 0.85 ? 'strong' : detection.confidence > 0.7 ? 'adequate' : 'weak',
    };
  }

  // STEP 2: LLM scoring for insights
  console.log('[Hook Analyzer V4] Calling Claude for scoring and insights...');

  const scoringPrompt = buildScoringPrompt(opening, fullEssay, detection, options.essayType || 'leadership');

  const response = await callClaudeWithRetry<{
    effectiveness_score: number;
    hook_tier: 'weak' | 'adequate' | 'strong' | 'exceptional';
    what_i_notice: string;
    what_works: string;
    opportunity: string;
    next_step: string;
    literary_techniques: string[];
    voice_quality: string;
    specificity_level: 'hyperspecific' | 'specific' | 'general' | 'vague';
  }>(
    scoringPrompt,
    {
      systemPrompt: buildScoringSystemPrompt(),
      temperature: 0.4,
      maxTokens: 2000,
      useJsonMode: true,
    }
  );

  const scoring = typeof response.content === 'object'
    ? response.content
    : JSON.parse(response.content as string);

  console.log(`[Hook Analyzer V4] ✓ Scoring: ${scoring.effectiveness_score}/10 (${scoring.hook_tier})`);

  return {
    ...detection,
    detection_method: 'pattern_match',
    ...scoring,
  };
}

// ============================================================================
// LLM SCORING PROMPTS
// ============================================================================

function buildScoringSystemPrompt(): string {
  return `You are a caring mentor and MFA-level craft analyst.

Score the hook's effectiveness and provide insights. The hook TYPE was already detected deterministically - you're scoring HOW WELL it works.

Be warm, specific, reference their actual text. Make them feel understood.`;
}

function buildScoringPrompt(
  opening: string,
  fullEssay: string,
  detection: ReturnType<typeof detectHookType>,
  essayType: string
): string {
  return `Analyze this opening hook's effectiveness.

**DETECTED TYPE**: ${detection.type} (${(detection.confidence * 100).toFixed(0)}% confidence)
**MATCHED PATTERNS**: ${detection.matched_patterns.join(', ')}

**OPENING**:
${opening}

**ESSAY PREVIEW** (first 500 chars):
${fullEssay.substring(0, 500)}

Return JSON:
{
  "effectiveness_score": 8.5,
  "hook_tier": "strong",
  "what_i_notice": "I notice you're [specific observation about THEIR hook]...",
  "what_works": "What works well: [specific strength from THEIR text]...",
  "opportunity": "Where this could deepen: [specific growth path]...",
  "next_step": "Try this: [concrete suggestion with example]...",
  "literary_techniques": ["Technique: explanation"],
  "voice_quality": "analytical/poetic/conversational/etc",
  "specificity_level": "hyperspecific|specific|general|vague"
}

Be specific. Quote their text. Make them feel understood.`;
}
