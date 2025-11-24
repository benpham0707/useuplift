/**
 * CONTEXT & CIRCUMSTANCES ANALYZER
 *
 * Dimension 9: Context & Circumstances (6% weight)
 *
 * Detects how students navigate obstacles and demonstrate resourcefulness:
 * - Specific obstacles (financial, access, family, language, discrimination, disability)
 * - Resourcefulness patterns ("I used/built/made... instead of")
 * - Resilience markers (bouncing back after failure)
 * - Victimhood tone detection (penalty)
 * - Causal connection to choices (how circumstances shaped actions)
 *
 * Scoring Philosophy:
 * - Specific obstacles + resourcefulness + resilience = 9-10
 * - Vague "it was hard" + victimhood tone = 0-3
 */
/**
 * Analyze context and circumstances in an essay
 */
export function analyzeContextCircumstances(essayText) {
    // Detect specific obstacles
    const obstacles = detectSpecificObstacles(essayText);
    // Detect resourcefulness patterns
    const resourcefulness = detectResourcefulness(essayText);
    // Detect resilience markers
    const resilience = detectResilience(essayText);
    // Detect causal connections
    const causalConnections = detectCausalConnections(essayText);
    // Detect victimhood tone (penalty)
    const victimhood = detectVictimhoodTone(essayText);
    // Detect vague hardship language
    const vagueHardship = detectVagueHardship(essayText);
    // Calculate context score (0-10)
    let score = 5.0; // Start at baseline
    // Specific obstacles (+2.5 max)
    if (obstacles.count >= 3)
        score += 2.5;
    else if (obstacles.count >= 2)
        score += 2.0;
    else if (obstacles.count >= 1)
        score += 1.0;
    else
        score -= 1.5; // No specific obstacles mentioned
    // Resourcefulness (+2.5 max)
    if (resourcefulness.count >= 3)
        score += 2.5;
    else if (resourcefulness.count >= 2)
        score += 2.0;
    else if (resourcefulness.count >= 1)
        score += 1.0;
    // Resilience (+2.0 max)
    if (resilience.count >= 2)
        score += 2.0;
    else if (resilience.count >= 1)
        score += 1.0;
    // Causal connections (+1.0 max)
    if (causalConnections.count >= 2)
        score += 1.0;
    else if (causalConnections.count >= 1)
        score += 0.5;
    // Victimhood tone penalty (-3.0 max)
    if (victimhood.count >= 3)
        score -= 3.0;
    else if (victimhood.count >= 2)
        score -= 2.0;
    else if (victimhood.count >= 1)
        score -= 1.0;
    // Vague hardship penalty (-2.0 max)
    if (vagueHardship.count >= 3)
        score -= 2.0;
    else if (vagueHardship.count >= 2)
        score -= 1.5;
    else if (vagueHardship.count >= 1)
        score -= 0.5;
    // Cap at 0-10
    score = Math.max(0, Math.min(10, score));
    // Determine context quality
    let quality;
    if (score >= 9)
        quality = 'resourceful_resilience';
    else if (score >= 7)
        quality = 'strong_navigation';
    else if (score >= 5)
        quality = 'mixed_context';
    else if (score >= 3)
        quality = 'vague_hardship';
    else
        quality = 'victimhood_tone';
    // Generate guidance
    const strengths = [];
    const weaknesses = [];
    const quickWins = [];
    if (obstacles.count >= 2) {
        strengths.push(`Specific obstacles named (${obstacles.types.join(', ')})`);
    }
    else if (obstacles.count === 0) {
        weaknesses.push('No specific obstacles mentioned');
        quickWins.push('Name the exact obstacle: "My family couldn\'t afford..." or "My school didn\'t offer..."');
    }
    if (resourcefulness.count >= 2) {
        strengths.push('Clear resourcefulness: finding alternatives when resources were limited');
    }
    else if (resourcefulness.count === 0) {
        weaknesses.push('No resourcefulness shown (how did you solve problems with limited resources?)');
        quickWins.push('Add: "Instead of [unavailable resource], I used/built/found [creative solution]"');
    }
    if (resilience.count >= 1) {
        strengths.push('Demonstrates bouncing back from setbacks');
    }
    else {
        weaknesses.push('No resilience demonstrated (did you face any failures? How did you respond?)');
        quickWins.push('Add one moment: "After [setback], I [how you bounced back]"');
    }
    if (causalConnections.count >= 1) {
        strengths.push('Shows how circumstances shaped your choices/actions');
    }
    else {
        weaknesses.push('Unclear how circumstances influenced your decisions');
        quickWins.push('Add: "Because [obstacle], I decided to [action]" or "This led me to [choice]"');
    }
    if (victimhood.count >= 2) {
        weaknesses.push(`Victimhood tone detected (${victimhood.count} instances of blame/complaint without action)`);
        quickWins.push('Shift from "X prevented me" → "Despite X, I found a way to..."');
    }
    if (vagueHardship.count >= 2) {
        weaknesses.push(`Vague hardship language (${vagueHardship.count} instances of "it was hard" without specifics)`);
        quickWins.push('Replace "it was challenging" with specific obstacle: financial? access? family?');
    }
    return {
        context_score: parseFloat(score.toFixed(2)),
        context_quality: quality,
        has_specific_obstacles: obstacles.present,
        obstacle_types: obstacles.types,
        obstacle_count: obstacles.count,
        obstacle_examples: obstacles.examples,
        shows_resourcefulness: resourcefulness.present,
        resourcefulness_count: resourcefulness.count,
        resourcefulness_examples: resourcefulness.examples,
        shows_resilience: resilience.present,
        resilience_count: resilience.count,
        resilience_examples: resilience.examples,
        has_causal_connection: causalConnections.present,
        causal_connection_count: causalConnections.count,
        causal_examples: causalConnections.examples,
        victimhood_tone: victimhood.present,
        victimhood_count: victimhood.count,
        victimhood_examples: victimhood.examples,
        vague_hardship_count: vagueHardship.count,
        vague_hardship_examples: vagueHardship.examples,
        strengths,
        weaknesses,
        quick_wins: quickWins
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function detectSpecificObstacles(text) {
    const examples = [];
    const types = [];
    let count = 0;
    // Financial obstacles
    const financialPatterns = [
        /(?:couldn't|could\s+not|unable\s+to)\s+afford/gi,
        /\b(?:low-income|poverty|free\s+lunch|financial\s+(?:hardship|struggle|difficulty))/gi,
        /\$0\s+budget|\$\d+\s+(?:total|to\s+work\s+with)/gi,
        /(?:parents|family)\s+(?:couldn't|could\s+not)\s+pay/gi,
        // NEW: Informal economy indicators
        /\bpaid\s+in\s+cash\b/gi,
        /\bdon't\s+have\s+(?:W-2s?|pay\s+stubs?|bank\s+statements?|tax\s+returns?)/gi,
        /\bno\s+(?:W-2s?|pay\s+stubs?|bank\s+statements?|paperwork)/gi,
        /\bdon't\s+(?:do|have)\s+paperwork\b/gi,
        /\bdon't\s+trust\s+banks?\b/gi,
        /\bundocumented\s+(?:work|income|employment)/gi
    ];
    for (const pattern of financialPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('financial'))
                types.push('financial');
        }
    }
    // Access/opportunity obstacles
    const accessPatterns = [
        /(?:school|district|area)\s+(?:didn't|did\s+not)\s+(?:offer|have|provide)/gi,
        /no\s+access\s+to/gi,
        /\bfirst-generation\s+college\s+student/gi,
        /\bundocumented\s+student/gi,
        /\brural\s+(?:area|school|community)/gi
    ];
    for (const pattern of accessPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('access'))
                types.push('access');
        }
    }
    // Family obligations
    const familyPatterns = [
        /\bcaregiver\s+for\s+(?:younger|siblings|family|parents)/gi,
        /\btook\s+care\s+of\s+(?:my\s+)?(?:siblings|family|younger\s+brother|younger\s+sister)/gi,
        /\bwork(?:ed|ing)?\s+to\s+support\s+(?:my\s+)?family/gi,
        /\bparent\s+(?:worked|was\s+working)\s+(?:two|multiple)\s+jobs/gi,
        // NEW: Flexible translator patterns (allow words in between)
        /\btranslat(?:e|ed|ing)\b.{0,50}\b(?:for\s+)?(?:my\s+)?parents?\b/gi,
        /\b(?:family|the)\s+translator\b/gi,
        /\bthe\s+go-between\b/gi,
        /\bthe\s+one\s+who\s+(?:figured\s+things\s+out|handled|managed)/gi
    ];
    for (const pattern of familyPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('family'))
                types.push('family');
        }
    }
    // Language barriers
    const languagePatterns = [
        /\bEnglish\s+(?:is|was)\s+(?:not\s+)?my\s+(?:second|third)\s+language/gi,
        /\bEnglish\s+learner/gi,
        /\bdidn't\s+speak\s+English/gi,
        /\blanguage\s+barrier/gi,
        /\bmoved\s+(?:to\s+the\s+US|from\s+\w+)\s+(?:in|at\s+age)/gi
    ];
    for (const pattern of languagePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('language'))
                types.push('language');
        }
    }
    // Discrimination/bias
    const discriminationPatterns = [
        /\b(?:racism|sexism|discrimination|bias)\s+(?:I\s+faced|against\s+me)/gi,
        /\btold\s+(?:I|me)\s+(?:couldn't|wasn't\s+smart\s+enough|didn't\s+belong)/gi,
        /\bonly\s+(?:girl|person\s+of\s+color|woman|minority)\s+in/gi,
        /\bfaced\s+(?:prejudice|stereotypes)/gi
    ];
    for (const pattern of discriminationPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('discrimination'))
                types.push('discrimination');
        }
    }
    // Disability/health
    const disabilityPatterns = [
        /\b(?:disability|disabled|ADHD|dyslexia|autism|chronic\s+illness)/gi,
        /\b(?:anxiety|depression)\s+(?:made|meant|prevented)/gi,
        /\bphysical\s+limitations/gi,
        /\blearning\s+(?:disability|difference)/gi
    ];
    for (const pattern of disabilityPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
            if (!types.includes('disability'))
                types.push('disability');
        }
    }
    return {
        present: count > 0,
        count,
        types,
        examples: [...new Set(examples)]
    };
}
function detectResourcefulness(text) {
    const patterns = [
        /Instead\s+of\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:used|built|made|created|found|borrowed)/gi,
        /I\s+(?:used|built|made|created|found)\s+\w+(?:\s+\w+){1,8}\s+instead/gi,
        /(?:Without|Since\s+I\s+didn't\s+have)\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:used|made|built|created|taught\s+myself)/gi,
        /I\s+taught\s+myself\s+(?:how\s+to\s+)?\w+/gi,
        /I\s+(?:scraped\s+together|found|borrowed|repurposed)/gi,
        /I\s+figured\s+out\s+how\s+to\s+\w+(?:\s+\w+){1,5}\s+(?:without|with\s+limited)/gi,
        // NEW: Narrative problem-solving patterns
        /I\s+(?:wrote|created|built|made)\s+a\s+(?:letter|plan|system|solution|strategy)/gi,
        /I\s+(?:attached|included|added|provided)\s+(?:copies\s+of\s+)?(?:receipts?|documents?|letters?|evidence)/gi,
        /I\s+(?:help|helped)\s+(?:other\s+)?(?:students?|people|families)\s+(?:navigate|with|understand)/gi,
        /I\s+figured\s+(?:things\s+)?out/gi,
        /\bfelt\s+(?:makeshift|inadequate|uncertain).*?but.*?(?:honest|tried|did\s+it)/gi
    ];
    const examples = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    return {
        present: count > 0,
        count,
        examples: [...new Set(examples)]
    };
}
function detectResilience(text) {
    const patterns = [
        /After\s+(?:I\s+)?(?:failed|lost|was\s+rejected|didn't\s+make),\s+I\s+\w+/gi,
        /Despite\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:continued|kept|persisted|tried\s+again)/gi,
        /I\s+(?:bounced\s+back|recovered|tried\s+again|didn't\s+give\s+up)/gi,
        /(?:This|That)\s+(?:failure|setback|rejection)\s+(?:taught|showed|led)\s+me/gi,
        /I\s+(?:learned|grew)\s+from\s+(?:the|my|this)\s+(?:failure|mistake|setback)/gi,
        /Even\s+after\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:still|continued|kept)/gi,
        /Although\s+I\s+(?:failed|lost|didn't),\s+I\s+(?:decided|chose)\s+to/gi
    ];
    const examples = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    return {
        present: count > 0,
        count,
        examples: [...new Set(examples)]
    };
}
function detectCausalConnections(text) {
    const patterns = [
        /Because\s+(?:of\s+)?(?:this|my|the)\s+\w+(?:\s+\w+){1,8},\s+I\s+(?:decided|chose|had\s+to|learned)/gi,
        /This\s+(?:led|inspired|motivated|pushed)\s+me\s+to\s+\w+/gi,
        /(?:Since|As)\s+(?:my|I)\s+\w+(?:\s+\w+){1,8},\s+I\s+(?:had\s+to|needed\s+to|decided\s+to)/gi,
        /Without\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:couldn't|wouldn't\s+have|had\s+to)/gi,
        /That's\s+(?:why|how)\s+I\s+\w+/gi,
        /This\s+experience\s+(?:shaped|influenced|drove)\s+my\s+decision\s+to/gi
    ];
    const examples = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    return {
        present: count > 0,
        count,
        examples: [...new Set(examples)]
    };
}
function detectVictimhoodTone(text) {
    const patterns = [
        /\w+\s+(?:prevented|stopped|kept)\s+me\s+from(?!\s+(?:giving\s+up|quitting))/gi, // "prevented me from" (unless it's "prevented me from giving up")
        /I\s+(?:couldn't|wasn't\s+able\s+to)\s+\w+\s+because\s+\w+(?:\s+\w+){1,8}$/gi, // Ends with blame, no "so I" follow-up
        /It\s+(?:wasn't|isn't)\s+fair\s+that/gi,
        /I\s+(?:deserved|should\s+have\s+gotten)/gi,
        /(?:They|Others)\s+(?:had|got)\s+\w+,\s+(?:but|while)\s+I\s+(?:didn't|couldn't)/gi,
        /I\s+was\s+(?:denied|rejected|excluded)\s+(?:from|because)(?!\s+\w+(?:\s+\w+){1,5}\s+(?:so|which\s+led|but)\s+I)/gi // Unless followed by action
    ];
    const examples = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 3));
        }
    }
    return {
        present: count > 0,
        count,
        examples: [...new Set(examples)]
    };
}
function detectVagueHardship(text) {
    const patterns = [
        /It\s+was\s+(?:hard|difficult|challenging|tough)(?!\s+because|\s+to\s+\w+\s+because)/gi, // "it was hard" without specifics
        /I\s+faced\s+(?:challenges|obstacles|difficulties|hardships)(?!\s+(?:like|such\s+as|including))/gi, // No examples given
        /(?:My|The)\s+(?:circumstances|situation|background)\s+(?:was|were)\s+(?:difficult|challenging)/gi,
        /I\s+struggled(?!\s+with\s+(?!academics|school))/gi, // "I struggled" without naming what
        /(?:wasn't|isn't)\s+easy(?!\s+(?:because|to))/gi,
        /had\s+to\s+overcome\s+(?:many|numerous|various)\s+(?:challenges|obstacles)(?!\s+(?:like|such\s+as|including))/gi
    ];
    const examples = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 3));
        }
    }
    return {
        count,
        examples: [...new Set(examples)]
    };
}
//# sourceMappingURL=contextCircumstancesAnalyzer.js.map