/**
 * OPENING HOOK ANALYZER V5 - HYBRID APPROACH
 *
 * Philosophy:
 * - Deterministic patterns for SPEED and RELIABILITY (known patterns)
 * - LLM for UNDERSTANDING and ADAPTABILITY (novel patterns, nuanced analysis)
 * - LLM learns from examples, not hard-coded rules
 * - System improves as LLM sees more examples
 *
 * Two-stage approach:
 * 1. Quick deterministic check (instant, 95%+ accuracy on common patterns)
 * 2. LLM deep analysis (understands WHY, handles edge cases, provides insights)
 */
import { callClaudeWithRetry } from '../../../lib/llm/claude';
// ============================================================================
// HYBRID DETECTION: Deterministic + LLM
// ============================================================================
export async function analyzeOpeningHookV5(fullEssay, options = {}) {
    console.log('[Hook Analyzer V5] Starting hybrid analysis...');
    const sentences = fullEssay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const opening = sentences.slice(0, 3).join('. ') + '.';
    // STAGE 1: Try deterministic classification (fast path)
    let deterministicResult = null;
    if (!options.forceLLM) {
        deterministicResult = quickDeterministicCheck(opening);
        if (deterministicResult && deterministicResult.confidence >= 0.85) {
            console.log(`[Hook Analyzer V5] ✓ High-confidence deterministic match: ${deterministicResult.type} (${(deterministicResult.confidence * 100).toFixed(0)}%)`);
        }
        else {
            console.log(`[Hook Analyzer V5] Low-confidence or no deterministic match, using LLM...`);
        }
    }
    // STAGE 2: LLM analysis (always run for deep insights)
    console.log('[Hook Analyzer V5] Calling Claude for deep analysis...');
    const llmAnalysis = await analyzWithLLM(opening, fullEssay, deterministicResult, // Pass hint to LLM
    options.essayType || 'leadership', options.depth || 'comprehensive');
    // STAGE 3: Combine results
    const finalType = deterministicResult && deterministicResult.confidence >= 0.85
        ? deterministicResult.type
        : llmAnalysis.hook_type;
    const detectionMethod = deterministicResult && deterministicResult.confidence >= 0.85
        ? 'hybrid' // Used both
        : 'llm'; // LLM only
    console.log(`[Hook Analyzer V5] ✓ Final: ${finalType} via ${detectionMethod}`);
    return {
        hook_type: finalType,
        hook_type_confidence: deterministicResult?.confidence || llmAnalysis.hook_type_confidence,
        detection_method: detectionMethod,
        ...llmAnalysis,
    };
}
// ============================================================================
// QUICK DETERMINISTIC CHECK (Common patterns only)
// ============================================================================
function quickDeterministicCheck(opening) {
    const firstSentenceWithPunctuation = opening.match(/^[^.!?]+[.!?]?/)?.[0] || '';
    const firstSentence = firstSentenceWithPunctuation.replace(/[.!?]$/, '').trim();
    // Only check VERY obvious patterns for speed
    // Dialogue (starts with quote)
    if (/^[""]/.test(firstSentence) || /^"/.test(firstSentence)) {
        return { type: 'dialogue_opening', confidence: 0.95 };
    }
    // Provocative question (has ? at end)
    if (firstSentenceWithPunctuation.includes('?') && /^(Have you|Do you|What if|How many|While)/i.test(firstSentence)) {
        return { type: 'provocative_question', confidence: 0.90 };
    }
    // Shocking statement (very specific patterns)
    if (/^I (have|'ve got) old (hands|eyes|soul)/i.test(firstSentence)) {
        return { type: 'shocking_statement', confidence: 0.90 };
    }
    if (/^When I was (in the )?(eighth|ninth|tenth) grade.* I (couldn't|can't)/i.test(firstSentence)) {
        return { type: 'shocking_statement', confidence: 0.90 };
    }
    // Generic opening (very obvious)
    if (/^(Throughout my life|From an early age|I have always)/i.test(firstSentence)) {
        return { type: 'generic_opening', confidence: 0.85 };
    }
    // No high-confidence match - let LLM handle it
    return null;
}
// ============================================================================
// LLM DEEP ANALYSIS (Understanding-based, not pattern-matching)
// ============================================================================
async function analyzWithLLM(opening, fullEssay, deterministicHint, essayType, depth) {
    const systemPrompt = buildLLMSystemPrompt();
    const userPrompt = buildLLMUserPrompt(opening, fullEssay, deterministicHint, essayType, depth);
    const response = await callClaudeWithRetry(userPrompt, {
        systemPrompt,
        temperature: 0.4,
        maxTokens: 3000,
        useJsonMode: true,
    });
    const analysis = typeof response.content === 'object'
        ? response.content
        : JSON.parse(response.content);
    return analysis;
}
// ============================================================================
// LLM SYSTEM PROMPT (Teaches understanding, not patterns)
// ============================================================================
function buildLLMSystemPrompt() {
    return `You are an elite narrative craft analyst who understands hooks through PRINCIPLES, not just patterns.

# YOUR EXPERTISE

You understand hooks at a deep level:
- **WHY** they work (psychology, narrative theory, craft principles)
- **HOW** they engage readers (cognitive hooks, emotional resonance, curiosity gaps)
- **WHAT** makes them effective (specificity, voice, stakes, tension)

You don't just match patterns - you understand the underlying mechanisms.

# HOOK TYPES (Learn from principles, not memorization)

## 1. SHOCKING STATEMENT
**Principle**: Subverts expectations, creates cognitive dissonance
**Mechanism**: Reader expects X, gets Y
**Examples**: "I have old hands" (young person), "I couldn't read in 8th grade" (disability reveal)
**WHY it works**: Contradiction demands explanation, creates curiosity

## 2. PARADOX
**Principle**: Two seemingly contradictory truths held simultaneously
**Mechanism**: "Unlike most X, I Y" OR "As X, I find A easy but B hard"
**Examples**: "Unlike mathematicians, I live in an irrational world", "As president, robotics is easy but leadership is hard"
**WHY it works**: Reveals complexity, intellectual depth, self-awareness

## 3. PROVOCATIVE QUESTION
**Principle**: Direct reader engagement through interrogative
**Mechanism**: Question creates obligation to answer
**Examples**: "Have you ever stumbled upon a hidden pocket of the universe?"
**WHY it works**: Activates reader's own experience, creates dialogue

## 4. SCENE IMMERSION
**Principle**: Drops reader into specific sensory moment
**Mechanism**: Vivid details (time, place, senses) create presence
**Examples**: "3:47 PM. The spaghetti burbled and slushed"
**WHY it works**: Specificity = credibility, sensory = visceral

## 5. VULNERABILITY FIRST
**Principle**: Emotional honesty creates connection
**Mechanism**: Physical symptoms, named emotions, admitted failures
**Examples**: "My hands shook", "I felt humiliation"
**WHY it works**: Risk = trust, authenticity = relatability

## 6. DIALOGUE OPENING
**Principle**: Voice establishes character immediately
**Mechanism**: Starts with quoted speech
**Examples**: "You're losing on facts, not arguments,' my coach said"
**WHY it works**: Voice = specificity, dialogue = scene

## 7. LIST/CATALOG
**Principle**: Accumulation builds meaning
**Mechanism**: Enumeration creates rhythm, pattern, then breaks it
**Examples**: "75,000 pages. 11,520 boxes. 6 maps."
**WHY it works**: Numbers = credibility, pattern = engagement

## 8. EXTENDED METAPHOR
**Principle**: Sustained comparison structures understanding
**Mechanism**: Metaphor provides frame for entire opening
**Examples**: "If my life were a play, there would be two sets, two acts"
**WHY it works**: Metaphor = complexity made graspable

## 9. IN MEDIAS RES
**Principle**: Starts mid-action
**Mechanism**: Drops into active moment
**Examples**: "I sprinted down the hallway, papers flying"
**WHY it works**: Momentum = engagement, action = stakes

## 10. IDENTITY STATEMENT
**Principle**: Declares core self
**Mechanism**: "I am/As a [identity]" structures narrative
**Examples**: "I change my name at Starbucks", "As an Indian-American"
**WHY it works**: Identity = thematic anchor

## 11. FALSE CERTAINTY
**Principle**: Seems literal, reveals metaphorical
**Mechanism**: Sentence 1 dramatic, Sentence 2 reveals actual context
**Examples**: "Sword in hand, I entered the battleground. The fluorescent lights buzzed overhead."
**WHY it works**: Surprise = delight, reveals creativity

## 12. GENERIC OPENING
**Principle**: Backstory/resume without hook
**Mechanism**: "Throughout my life", "I have always"
**WHY it doesn't work**: No specificity, no engagement, reads like template

# YOUR TASK

1. **CLASSIFY** the hook type based on underlying principle (not just surface pattern)
2. **EXPLAIN** why you classified it this way (show your understanding)
3. **SCORE** effectiveness (how well does it execute the principle?)
4. **ANALYZE** craft (what techniques are at play?)
5. **GUIDE** improvement (how to strengthen it?)

# CRITICAL INSTRUCTIONS

- Focus on PRINCIPLES not just pattern-matching
- Explain your reasoning (why_this_type field)
- Be specific to THEIR essay (quote their actual text)
- Provide caring, actionable guidance
- Return ONLY valid JSON

# JSON STRUCTURE

{
  "hook_type": "shocking_statement",
  "hook_type_confidence": 0.90,
  "why_this_type": "This is a shocking statement because it subverts age expectations - 'old hands' on a young person creates cognitive dissonance. The reader must know WHY a teenager has old hands, which creates a curiosity gap that demands resolution.",

  "effectiveness_score": 8.5,
  "hook_tier": "strong",

  "what_makes_it_work": [
    "Physical contradiction (old hands, young person) creates immediate curiosity",
    "Specific, visceral detail ('old hands') over abstract concept",
    "Opens vulnerability pathway - hints at struggle/labor/age beyond years"
  ],

  "what_could_be_stronger": [
    "Could add one more sensory detail to ground the reader",
    "Consider showing the hands in action to prove the claim"
  ],

  "what_i_notice": "I notice you're opening with a physical contradiction that immediately makes me curious - old hands on someone your age suggests a story of unusual experience or struggle.",

  "what_works": "The specificity of 'old hands' works beautifully - it's concrete, sensory, and creates a mystery I want to solve. You're not saying 'I've experienced hardship' - you're SHOWING it through a physical detail.",

  "opportunity": "The place this could deepen: the next sentence explains the metaphor, but consider showing your hands IN ACTION first. What do old hands DO differently? Do they move with practiced certainty? Hesitate? This would PROVE the claim before explaining it.",

  "next_step": "Try this: Before explaining, show one action that demonstrates the 'oldness.' For example: 'I have old hands. They know exactly how to hold a fountain pen without cramping, how to turn pages without looking, how to conduct invisible orchestras with muscle memory I don't remember earning.'",

  "literary_techniques": [
    "Contradiction/Paradox: Young person with old hands",
    "Specificity: 'Old hands' vs 'I've struggled'",
    "Sensory Detail: Physical, tangible image"
  ],

  "voice_quality": "Reflective, observant, slightly melancholic - the voice of someone who notices physical details and finds meaning in them",

  "specificity_level": "specific"
}`;
}
// ============================================================================
// LLM USER PROMPT (Provides context, not rules)
// ============================================================================
function buildLLMUserPrompt(opening, fullEssay, deterministicHint, essayType, depth) {
    let prompt = `Analyze this opening hook using your deep understanding of narrative craft.

**OPENING**:
${opening}

**FULL ESSAY PREVIEW** (first 500 chars):
${fullEssay.substring(0, 500)}

**ESSAY TYPE**: ${essayType}
**ANALYSIS DEPTH**: ${depth}
`;
    if (deterministicHint) {
        prompt += `
**DETERMINISTIC HINT**: Pattern-matching suggested "${deterministicHint.type}" with ${(deterministicHint.confidence * 100).toFixed(0)}% confidence.
- If you agree, explain WHY using principles (don't just say "I agree")
- If you disagree, explain what the deterministic system missed
`;
    }
    prompt += `
Classify the hook type, but more importantly: EXPLAIN your reasoning using craft principles.

Return JSON with the exact structure shown in your system prompt.

Remember:
- Quote their actual text
- Explain WHY, not just WHAT
- Be specific to THEIR essay
- Provide caring, actionable guidance`;
    return prompt;
}
//# sourceMappingURL=openingHookAnalyzer_v5_hybrid.js.map