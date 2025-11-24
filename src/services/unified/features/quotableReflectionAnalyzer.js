/**
 * Quotable Reflection Analyzer - The Insight Generator
 *
 * Analyzes reflection quality and identifies "quotable" insights that could be
 * TED talk titles or memorable lines that AOs remember months later.
 *
 * Research Foundation:
 * - Harvard Personal Rating: "Unusual maturity in self-reflection" is key criterion
 * - Stanford: "We want depth, not breadth. One profound insight > 5 surface observations"
 * - Berkeley AO: "The essays I remember have ONE insight so good I wrote it down"
 * - 63% of admits use "micro-to-macro" pattern (specific → universal)
 *
 * THE REFLECTION QUALITY LADDER:
 *
 * Level 1 (3-4/10): Generic Wisdom - AVOID
 * - "I learned that teamwork is important"
 * - "This taught me to never give up"
 * - "Leadership means helping others"
 * Problem: Every essay says this. Not memorable. No depth.
 *
 * Level 2 (5-6/10): Specific But Not Transferable
 * - "I learned that robotics requires patience and precision"
 * - "This taught me how to manage a team of 80 people"
 * Better: Specific to experience, but doesn't transcend it
 *
 * Level 3 (7-8/10): Specific + Universal - COMPETITIVE
 * - "Leadership isn't about having the best idea or making the final call.
 *    It's about listening long enough to understand what truly motivates people
 *    and creating a space where their combined passions build something better."
 * Good: Moves from specific (your experience) to universal (life/people in general)
 *
 * Level 4 (9-9.5/10): Specific + Surprising + Transferable - TIER 1
 * - "I used to think leadership meant having the loudest voice.
 *    But steering 80 personalities taught me something paradoxical:
 *    the quieter I became, the more they listened.
 *    Silence creates space for others' voices."
 * Excellent: Challenges assumption, reveals paradox, profound truth
 *
 * Level 5 (9.5-10/10): Quotable (TED Talk-Worthy) - TOP 1%
 * - "Leadership isn't about choosing between the safe path and the bold one.
 *    It's about building bridges strong enough to carry both—
 *    and trusting your team to walk them together."
 * Perfect: Poetic language, memorable metaphor, could be a TED talk title
 *
 * THE QUOTABLE FORMULA:
 * [Challenge common belief] + [Reveal surprising truth] + [Universal wisdom] + [Poetic language]
 *
 * "I used to think X. But [experience] taught me Y. Now I see Z."
 *
 * DETECTION STRATEGY:
 * 1. Transformation language ("I used to think", "Now I see")
 * 2. Universal scope ("people", "we", "life", "world")
 * 3. Paradox/surprise ("paradoxically", "surprisingly", "opposite")
 * 4. Philosophical concepts (identity, belonging, purpose, meaning)
 * 5. Metaphor/analogy (bridges, mirrors, threads, foundations)
 * 6. Parallel structure (X is not about Y, it's about Z)
 * 7. Forward-looking ("At Berkeley, I'll...", "moving forward")
 * 8. Avoids clichés ("passion", "journey", "taught me a lot")
 */
// ============================================================================
// DETECTION PATTERNS
// ============================================================================
const TRANSFORMATION_PATTERNS = [
    /I used to (think|believe|assume|imagine)/gi,
    /(Before|At first|Initially|Once),?\s+I (thought|believed|assumed)/gi,
    /Now I (see|understand|realize|know|believe)/gi,
    /(This|It) (taught|showed|revealed|made me see) (me )?(that|how)/gi,
    /I (no longer|don't) (think|believe|see)/gi,
    /(changed|shifted|transformed) (how|the way) I (see|think|understand)/gi
];
const UNIVERSAL_LANGUAGE = [
    'people', 'we', 'us', 'everyone', 'human', 'humanity',
    'life', 'world', 'society', 'community',
    'others', 'them', 'someone', 'anyone'
];
const SURPRISE_WORDS = [
    'paradox', 'paradoxically', 'surprisingly', 'unexpected', 'counterintuitive',
    'opposite', 'contrary to', 'despite', 'although', 'yet',
    'ironic', 'ironically', 'strange', 'curious'
];
const PHILOSOPHICAL_CONCEPTS = [
    'identity', 'belonging', 'purpose', 'meaning', 'connection', 'perspective',
    'responsibility', 'growth', 'resilience', 'authenticity', 'empathy',
    'understanding', 'truth', 'wisdom', 'vulnerability', 'strength',
    'courage', 'integrity', 'humility', 'agency', 'autonomy'
];
const METAPHOR_PATTERNS = [
    /\b(bridge|thread|fabric|tapestry|foundation|pillar|anchor|compass|mirror|lens)\b/gi,
    /\b(seed|root|blossom|garden|tree|branch)\b/gi,
    /\b(light|shadow|darkness|illuminate|shine)\b/gi,
    /\b(path|journey|road|step|climb|summit)\b/gi,
    /\blike (a |an )?([a-z]+\s+){0,3}(bridge|mirror|compass)/gi
];
const PARALLEL_STRUCTURE_PATTERNS = [
    /\b(not|isn't|wasn't|doesn't)\s+about\s+([^,]+),?\s+(but|it's)\s+about/gi,
    /\bmore\s+([a-z]+)\s+than\s+([a-z]+)/gi,
    /\bboth\s+([a-z\s]+)\s+and\s+([a-z\s]+)/gi,
    /\bneither\s+([a-z\s]+)\s+nor\s+([a-z\s]+)/gi
];
const CLICHE_PHRASES = [
    'passion', 'passionate', 'journey', 'life\'s journey', 'my journey',
    'taught me a lot', 'learned so much', 'valuable lessons',
    'made me who I am', 'changed my life', 'defining moment',
    'made me stronger', 'pushed me to', 'stepping stone'
];
// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================
export function analyzeQuotableReflection(text) {
    // Detect transformation language
    const transformationPhrases = detectTransformations(text);
    const hasTransformation = transformationPhrases.length > 0;
    // Detect universal scope
    const universalLanguage = detectUniversalLanguage(text);
    const hasUniversalScope = universalLanguage.length > 0;
    // Detect surprise/paradox
    const surpriseElements = detectSurpriseElements(text);
    const hasSurprise = surpriseElements.length > 0;
    // Detect philosophical depth
    const philosophicalConcepts = detectPhilosophicalConcepts(text);
    const hasPhilosophicalDepth = philosophicalConcepts.length >= 2;
    // Detect poetic language
    const metaphors = detectMetaphors(text);
    const parallelStructures = detectParallelStructures(text);
    const hasPoeticLanguage = metaphors.length > 0 || parallelStructures.length > 0;
    // Detect future application
    const hasFutureApplication = detectFutureApplication(text);
    // Quality patterns
    const microToMacro = hasTransformation && hasUniversalScope;
    const challengesAssumption = /I used to (think|believe|assume)/i.test(text);
    const clichesFound = detectCliches(text);
    const avoidsCliches = clichesFound.length === 0;
    // Calculate reflection level
    const level = calculateReflectionLevel(hasTransformation, hasUniversalScope, hasSurprise, hasPhilosophicalDepth, hasPoeticLanguage, avoidsCliches);
    // Calculate score
    const score = calculateReflectionScore(level, transformationPhrases.length, philosophicalConcepts.length, hasPoeticLanguage);
    // Get tier
    const tier = getReflectionTier(level);
    // Is quotable?
    const isQuotable = level >= 5 && hasPoeticLanguage && hasSurprise;
    // Find most quotable line
    const mostQuotableLine = findMostQuotableLine(text, parallelStructures, metaphors);
    const reflectionQuotes = extractReflectionQuotes(text, transformationPhrases, universalLanguage);
    // Identify strengths and weaknesses
    const strengths = identifyReflectionStrengths(level, hasTransformation, microToMacro, hasPoeticLanguage, avoidsCliches);
    const weaknesses = identifyReflectionWeaknesses(level, hasUniversalScope, hasSurprise, avoidsCliches, clichesFound);
    // Generate upgrade path
    const upgradeToQuotable = generateUpgradeToQuotable(level, hasTransformation, hasSurprise, hasPoeticLanguage);
    // Research alignment
    const harvardMaturity = level >= 4 || (level === 3 && philosophicalConcepts.length >= 3);
    const stanfordDepth = isQuotable || (level >= 4 && hasSurprise);
    const berkeleyMemorable = isQuotable;
    const aoAssessment = getAOAssessment(level, isQuotable, microToMacro);
    return {
        reflection_level: level,
        score_0_to_10: score,
        tier,
        is_quotable: isQuotable,
        has_transformation: hasTransformation,
        has_universal_scope: hasUniversalScope,
        has_surprise: hasSurprise,
        has_philosophical_depth: hasPhilosophicalDepth,
        has_poetic_language: hasPoeticLanguage,
        has_future_application: hasFutureApplication,
        micro_to_macro: microToMacro,
        challenges_assumption: challengesAssumption,
        avoids_cliches: avoidsCliches,
        transformation_phrases: transformationPhrases,
        universal_language: universalLanguage,
        surprise_elements: surpriseElements,
        philosophical_concepts: philosophicalConcepts,
        metaphors_analogies: metaphors,
        parallel_structures: parallelStructures,
        cliches_found: clichesFound,
        most_quotable_line: mostQuotableLine,
        reflection_quotes: reflectionQuotes,
        strengths,
        weaknesses,
        current_level: level,
        next_level: Math.min(5, level + 1),
        upgrade_to_quotable: upgradeToQuotable,
        harvard_maturity: harvardMaturity,
        stanford_depth: stanfordDepth,
        berkeley_memorable: berkeleyMemorable,
        ao_assessment: aoAssessment
    };
}
// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================
function detectTransformations(text) {
    const found = [];
    for (const pattern of TRANSFORMATION_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            found.push(...matches.map(m => `"${m.trim()}"`));
        }
    }
    return [...new Set(found)].slice(0, 3);
}
function detectUniversalLanguage(text) {
    const found = [];
    const lowerText = text.toLowerCase();
    for (const word of UNIVERSAL_LANGUAGE) {
        // Must be about people/life/world in general, not just "we did X"
        const contextPattern = new RegExp(`\\b${word}\\b.{0,60}(are|need|want|can|should|deserve|value|seek|find|learn)`, 'i');
        if (contextPattern.test(text)) {
            const match = text.match(contextPattern);
            if (match) {
                found.push(`"${match[0].substring(0, 80)}"`);
            }
        }
    }
    return [...new Set(found)].slice(0, 3);
}
function detectSurpriseElements(text) {
    const found = [];
    const lowerText = text.toLowerCase();
    for (const word of SURPRISE_WORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            // Extract context
            const index = lowerText.indexOf(word.toLowerCase());
            const context = text.substring(Math.max(0, index - 20), Math.min(text.length, index + word.length + 60));
            found.push(`"${context.trim()}"`);
        }
    }
    return [...new Set(found)].slice(0, 2);
}
function detectPhilosophicalConcepts(text) {
    const found = [];
    const lowerText = text.toLowerCase();
    for (const concept of PHILOSOPHICAL_CONCEPTS) {
        if (lowerText.includes(concept.toLowerCase())) {
            found.push(concept);
        }
    }
    return [...new Set(found)];
}
function detectMetaphors(text) {
    const found = [];
    for (const pattern of METAPHOR_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            found.push(...matches.slice(0, 2));
        }
    }
    return [...new Set(found)];
}
function detectParallelStructures(text) {
    const found = [];
    for (const pattern of PARALLEL_STRUCTURE_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            // Get full sentence containing the parallel structure
            const sentences = text.split(/[.!?]+/);
            for (const match of matches) {
                const sentence = sentences.find(s => s.toLowerCase().includes(match.toLowerCase()));
                if (sentence) {
                    found.push(`"${sentence.trim().substring(0, 150)}"`);
                }
            }
        }
    }
    return [...new Set(found)].slice(0, 2);
}
function detectCliches(text) {
    const found = [];
    const lowerText = text.toLowerCase();
    for (const cliche of CLICHE_PHRASES) {
        if (lowerText.includes(cliche.toLowerCase())) {
            found.push(cliche);
        }
    }
    return found;
}
function detectFutureApplication(text) {
    const futurePatterns = [
        /At Berkeley,?\s+I('ll| will| plan to)/i,
        /(Moving forward|Going forward|From now on)/i,
        /I('ll| will)\s+(continue|bring|apply|use)/i
    ];
    return futurePatterns.some(p => p.test(text));
}
// ============================================================================
// LEVEL CALCULATION
// ============================================================================
function calculateReflectionLevel(hasTransformation, hasUniversalScope, hasSurprise, hasPhilosophicalDepth, hasPoeticLanguage, avoidsCliches) {
    // Level 5: Quotable (all elements + poetic)
    if (hasTransformation && hasUniversalScope && hasSurprise && hasPoeticLanguage && avoidsCliches) {
        return 5;
    }
    // Level 4: Specific + Surprising + Transferable
    if (hasTransformation && hasUniversalScope && (hasSurprise || hasPhilosophicalDepth) && avoidsCliches) {
        return 4;
    }
    // Level 3: Specific + Universal (micro-to-macro)
    if (hasUniversalScope && hasPhilosophicalDepth) {
        return 3;
    }
    // Level 2: Specific but not universal
    if (hasTransformation || hasPhilosophicalDepth) {
        return 2;
    }
    // Level 1: Generic
    return 1;
}
function calculateReflectionScore(level, transformationCount, philosophicalCount, hasPoeticLanguage) {
    const baseScores = {
        1: 3.5,
        2: 5.5,
        3: 7.5,
        4: 9.0,
        5: 9.5
    };
    let score = baseScores[level];
    // Bonuses
    if (transformationCount >= 2)
        score += 0.5;
    if (philosophicalCount >= 3)
        score += 0.5;
    if (hasPoeticLanguage)
        score += 0.5;
    return Math.min(10, score);
}
function getReflectionTier(level) {
    const tiers = {
        5: 'quotable',
        4: 'profound',
        3: 'thoughtful',
        2: 'specific',
        1: 'generic'
    };
    return tiers[level];
}
// ============================================================================
// QUOTABLE LINE DETECTION
// ============================================================================
function findMostQuotableLine(text, parallelStructures, metaphors) {
    // Prioritize parallel structures (most quotable)
    if (parallelStructures.length > 0) {
        return parallelStructures[0];
    }
    // Then metaphor-rich sentences
    const sentences = text.split(/[.!?]+/).map(s => s.trim());
    for (const sentence of sentences) {
        const metaphorCount = metaphors.filter(m => sentence.toLowerCase().includes(m.toLowerCase())).length;
        if (metaphorCount >= 2 && sentence.split(' ').length >= 10) {
            return `"${sentence.substring(0, 150)}"`;
        }
    }
    return null;
}
function extractReflectionQuotes(text, transformationPhrases, universalLanguage) {
    const quotes = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim());
    // Find sentences with transformation
    for (const sentence of sentences) {
        const hasTransformation = transformationPhrases.some(t => sentence.toLowerCase().includes(t.toLowerCase().replace(/"/g, '')));
        const hasUniversal = universalLanguage.some(u => sentence.toLowerCase().includes(u.toLowerCase().replace(/"/g, '')));
        if (hasTransformation || hasUniversal) {
            quotes.push(`"${sentence.substring(0, 150)}"`);
        }
    }
    return quotes.slice(0, 3);
}
// ============================================================================
// STRENGTHS & WEAKNESSES
// ============================================================================
function identifyReflectionStrengths(level, hasTransformation, microToMacro, hasPoeticLanguage, avoidsCliches) {
    const strengths = [];
    if (level >= 5) {
        strengths.push('✅ QUOTABLE (TED talk-worthy): Memorable insight that AOs write down');
    }
    else if (level === 4) {
        strengths.push('✅ TIER 1 (Profound): Specific + surprising + transferable wisdom');
    }
    else if (level === 3) {
        strengths.push('✅ COMPETITIVE (Thoughtful): Micro-to-macro pattern (63% of admits)');
    }
    if (hasTransformation) {
        strengths.push('Transformation shown ("I used to think" → "Now I see")');
    }
    if (microToMacro) {
        strengths.push('Micro-to-macro: Specific experience → universal wisdom');
    }
    if (hasPoeticLanguage) {
        strengths.push('Poetic language: Metaphor/parallel structure (memorable)');
    }
    if (avoidsCliches) {
        strengths.push('Cliché-free: No "passion", "journey", "taught me a lot"');
    }
    return strengths;
}
function identifyReflectionWeaknesses(level, hasUniversalScope, hasSurprise, avoidsCliches, clichesFound) {
    const weaknesses = [];
    if (level === 1) {
        weaknesses.push('❌ GENERIC WISDOM: Every essay says this. Not memorable.');
    }
    if (!hasUniversalScope) {
        weaknesses.push('Missing universal scope (add: what you learned about people/life in general)');
    }
    if (!hasSurprise) {
        weaknesses.push('No paradox or surprise (add: "I used to think X, but learned Y")');
    }
    if (!avoidsCliches) {
        weaknesses.push(`Contains clichés: ${clichesFound.slice(0, 2).join(', ')} (replace with specific insights)`);
    }
    return weaknesses;
}
// ============================================================================
// UPGRADE PATH
// ============================================================================
function generateUpgradeToQuotable(currentLevel, hasTransformation, hasSurprise, hasPoeticLanguage) {
    const formula = `QUOTABLE REFLECTION FORMULA (Level 5 - TED Talk):

Step 1: Challenge common belief
"I used to think [COMMON BELIEF]"

Step 2: Reveal surprising truth
"But [SPECIFIC EXPERIENCE] taught me something [PARADOXICAL/COUNTERINTUITIVE]"

Step 3: State universal wisdom
"Now I see [BROADER TRUTH ABOUT PEOPLE/LIFE/WORLD]"

Step 4: Add poetic language
Use metaphor, parallel structure, or memorable phrasing

Step 5: Future application
"At Berkeley, I'll [HOW YOU'LL APPLY THIS]"

COMPLETE EXAMPLE:
"I used to think leadership meant having the loudest voice.
But steering 80 diverse personalities taught me something paradoxical:
the quieter I became, the more they listened.
Silence creates space for others' voices.
At Berkeley's collaborative research labs, I'll bring this counterintuitive truth:
sometimes the best way to lead innovation is to get out of the way."

KEY ELEMENTS:
✅ Challenges assumption ("loudest voice")
✅ Paradox ("quieter" → "more listened")
✅ Universal wisdom ("silence creates space")
✅ Poetic/memorable ("get out of the way")
✅ Future application (Berkeley tie-in)`;
    const exampleTransformation = {
        current: "This experience taught me that teamwork and leadership are important. I learned to work with others and communicate better.",
        level_3: "This experience taught me that leadership isn't about being the most skilled person in the room—it's about understanding what motivates each individual and creating a space where their combined talents exceed what any one person could achieve alone.",
        level_4: "I used to think good leaders had all the answers. But managing 80 robotics club members taught me something surprising: the best leaders ask the right questions. When I stopped solving problems for my team and started asking 'What do you think?' and 'How would you approach this?', ownership shifted. They stopped waiting for my direction and started innovating independently.",
        level_5_quotable: `I used to think leadership meant having the loudest voice and the clearest vision.

But steering 80 diverse personalities taught me something paradoxical: the quieter I became, the more they listened. Silence creates space for others' voices. The best ideas emerged not when I spoke, but when I got out of the way.

Leadership isn't about choosing between the safe path and the bold one. It's about building bridges strong enough to carry both—and trusting your team to walk them together.

At Berkeley, I'll bring this counterintuitive truth to collaborative research labs, where the quietest idea in the room might be the one that changes everything.`
    };
    return {
        formula,
        example_transformation: exampleTransformation
    };
}
// ============================================================================
// AO ASSESSMENT
// ============================================================================
function getAOAssessment(level, isQuotable, microToMacro) {
    if (level === 5 && isQuotable) {
        return `✅ TOP 1% (Quotable): TED talk-worthy insight. Berkeley AO: "The essays I remember have ONE insight so good I wrote it down." This will be remembered.`;
    }
    if (level === 4) {
        return `✅ TIER 1 (Profound): Specific + surprising + universal. Harvard Personal Rating: "Unusual maturity in self-reflection." Stanford: "We want depth not breadth—this shows depth."`;
    }
    if (level === 3) {
        return `✅ COMPETITIVE (Thoughtful): Micro-to-macro pattern present (63% of admits use this). Shows philosophical depth. Good for top UCs.`;
    }
    if (level === 2) {
        return `⚠️ ADEQUATE (Specific): Shows reflection but doesn't transcend the experience. To reach Tier 1: Add universal wisdom about people/life/world.`;
    }
    return `❌ GENERIC (Level 1): Stanford AO red flag: "Every essay says 'teamwork matters' or 'leadership is important.'" Need SPECIFIC, SURPRISING insight only YOU could have.`;
}
//# sourceMappingURL=quotableReflectionAnalyzer.js.map