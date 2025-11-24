/**
 * ROLE CLARITY & OWNERSHIP ANALYZER
 *
 * Dimension 7A: Role Clarity & Ownership (7% weight)
 *
 * Detects individual agency vs team credit ambiguity:
 * - "I" vs "we" statement ratio (80%+ I statements = world-class)
 * - Specific role descriptions vs title-only mentions
 * - Differentiation of personal contribution from team's work
 * - Ownership of failures ("I messed up", not "we struggled")
 * - Vague language penalties ("helped with", "was part of")
 * - Strong action verbs showing individual agency
 *
 * Scoring Philosophy:
 * - High "I" ratio + specific role + failure ownership = 9-10
 * - Vague "helped with" language + "we" dominance = 0-3
 */
/**
 * Analyze role clarity and individual ownership in an essay
 */
export function analyzeRoleOwnership(essayText) {
    // Detect I vs We statements
    const iVsWe = detectIVsWeRatio(essayText);
    // Detect role description specificity
    const roleDesc = detectRoleDescription(essayText);
    // Detect differentiation from team
    const differentiation = detectDifferentiation(essayText);
    // Detect failure ownership
    const failureOwnership = detectFailureOwnership(essayText);
    // Detect vague language
    const vagueLanguage = detectVagueLanguage(essayText);
    // Count strong agency verbs
    const agencyVerbs = countAgencyVerbs(essayText);
    // Calculate role score (0-10)
    let score = 3.0; // Start at baseline (lower baseline = higher differentiation)
    // I vs We ratio (+3.5 max - increased from +2.5 to reward strong agency)
    if (iVsWe.ratio >= 0.80)
        score += 3.5; // 100% I statements = world-class agency
    else if (iVsWe.ratio >= 0.70)
        score += 2.5;
    else if (iVsWe.ratio >= 0.60)
        score += 1.5;
    else if (iVsWe.ratio < 0.50)
        score -= 1.5;
    // Role description (+1.5 max, -2.0 if absent)
    if (roleDesc.clarity === 'specific')
        score += 1.5;
    else if (roleDesc.clarity === 'mentioned')
        score += 0.5;
    else if (roleDesc.clarity === 'absent')
        score -= 2.0;
    // Differentiation from team (+1.0 max)
    if (differentiation.count >= 2)
        score += 1.0;
    else if (differentiation.count >= 1)
        score += 0.5;
    // Failure ownership (+1.5 if present, -1.0 if absent)
    if (failureOwnership.count >= 1)
        score += 1.5;
    else
        score -= 1.0;
    // Vague language penalty (-2.0 max)
    if (vagueLanguage.count >= 5)
        score -= 2.0;
    else if (vagueLanguage.count >= 3)
        score -= 1.5;
    else if (vagueLanguage.count >= 1)
        score -= 0.5;
    // Agency verbs (+0.5 bonus)
    if (agencyVerbs.count >= 5)
        score += 0.5;
    // Cap at 0-10
    score = Math.max(0, Math.min(10, score));
    // Determine role quality
    let quality;
    if (score >= 9)
        quality = 'crystal_clear_agency';
    else if (score >= 7)
        quality = 'strong_clarity';
    else if (score >= 5)
        quality = 'mixed_clarity';
    else if (score >= 3)
        quality = 'ambiguous';
    else
        quality = 'no_individual_agency';
    // Generate guidance
    const strengths = [];
    const weaknesses = [];
    const quickWins = [];
    if (iVsWe.ratio >= 0.80) {
        strengths.push(`Strong "I" focus (${Math.round(iVsWe.ratio * 100)}% individual statements)`);
    }
    else if (iVsWe.ratio < 0.60) {
        weaknesses.push(`Too much "we" language (${Math.round((1 - iVsWe.ratio) * 100)}% team statements)`);
        quickWins.push('Replace "we" with "I" where YOU specifically acted');
    }
    if (roleDesc.clarity === 'specific') {
        strengths.push('Specific role description showing clear responsibilities');
    }
    else if (roleDesc.clarity === 'absent') {
        weaknesses.push('Role never clarified beyond title (if mentioned)');
        quickWins.push('Add: "My role was to [specific responsibility]"');
    }
    if (differentiation.count >= 2) {
        strengths.push('Clear differentiation between your work and team\'s work');
    }
    else if (differentiation.count === 0) {
        weaknesses.push('Cannot tell what YOU did vs what the team did');
        quickWins.push('Add: "While the team [X], I specifically [Y]"');
    }
    if (failureOwnership.count >= 1) {
        strengths.push('Owns personal failures/mistakes explicitly');
    }
    else {
        weaknesses.push('No ownership of failures or mistakes shown');
        quickWins.push('Add one moment: "I messed up when..." or "I should have..."');
    }
    if (vagueLanguage.count >= 3) {
        weaknesses.push(`Vague language weakens agency (${vagueLanguage.count} instances of "helped with"/"was part of")`);
        quickWins.push('Replace "helped with" → "I [specific action verb]"');
    }
    return {
        role_score: parseFloat(score.toFixed(2)),
        role_quality: quality,
        i_statement_count: iVsWe.iCount,
        we_statement_count: iVsWe.weCount,
        agency_ratio: parseFloat(iVsWe.ratio.toFixed(2)),
        i_examples: iVsWe.iExamples,
        we_examples: iVsWe.weExamples,
        has_role_description: roleDesc.present,
        role_clarity: roleDesc.clarity,
        role_examples: roleDesc.examples,
        differentiates_from_team: differentiation.present,
        differentiation_count: differentiation.count,
        differentiation_examples: differentiation.examples,
        owns_failures: failureOwnership.present,
        failure_ownership_count: failureOwnership.count,
        failure_examples: failureOwnership.examples,
        vague_phrase_count: vagueLanguage.count,
        vague_examples: vagueLanguage.examples,
        agency_verb_count: agencyVerbs.count,
        strong_verbs: agencyVerbs.examples,
        strengths,
        weaknesses,
        quick_wins: quickWins
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function detectIVsWeRatio(text) {
    // Detect "I" statements with action verbs
    const iPatterns = [
        /\bI\s+(led|created|organized|designed|built|wrote|taught|solved|decided|managed|developed|implemented|launched|coordinated|founded|started)/gi,
        /\bI\s+(made|took|gave|ran|planned|executed|directed|supervised|recruited|trained)/gi,
        /\bI\s+(analyzed|researched|studied|investigated|discovered|identified|evaluated)/gi
    ];
    const iExamples = [];
    let iCount = 0;
    for (const pattern of iPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            iCount += matches.length;
            iExamples.push(...matches.slice(0, 3));
        }
    }
    // Detect "we" statements
    const wePatterns = [
        /\b[Ww]e\s+(did|made|created|organized|developed|built|launched|ran)/gi,
        /\b[Ww]e\s+(worked|collaborated|contributed|helped|assisted)/gi
    ];
    const weExamples = [];
    let weCount = 0;
    for (const pattern of wePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            weCount += matches.length;
            weExamples.push(...matches.slice(0, 3));
        }
    }
    const total = iCount + weCount;
    const ratio = total > 0 ? iCount / total : 0.5; // Default to neutral if no statements
    return {
        iCount,
        weCount,
        ratio,
        iExamples: [...new Set(iExamples)],
        weExamples: [...new Set(weExamples)]
    };
}
function detectRoleDescription(text) {
    const examples = [];
    // Specific role descriptions
    const specificPatterns = [
        /I\s+was\s+responsible\s+for\s+\w+(?:\s+\w+){1,5}/gi,
        /My\s+role\s+(?:included|involved|was\s+to)\s+\w+(?:\s+\w+){1,5}/gi,
        /As\s+\w+,\s+I\s+(?:managed|coordinated|led|oversaw)\s+\w+/gi
    ];
    let specificCount = 0;
    for (const pattern of specificPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            specificCount += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    if (specificCount >= 1) {
        return { present: true, clarity: 'specific', examples };
    }
    // General role mentions
    const mentionedPatterns = [
        /My\s+role/gi,
        /I\s+was\s+responsible/gi,
        /As\s+(?:the\s+)?(?:president|captain|leader|coordinator|manager|director)/gi
    ];
    let mentionedCount = 0;
    for (const pattern of mentionedPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            mentionedCount += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    // Implicit roles (narrative descriptions - flexible, dynamic detection)
    const implicitRolePatterns = [
        /\b(?:the\s+)?(?:family|household)\s+translator\b/gi,
        /\bthe\s+(?:go-between|bridge|link|connector)\b/gi,
        /\bthe\s+one\s+who\s+(?:figured\s+things\s+out|handled|managed|took\s+care\s+of|dealt\s+with)/gi,
        /\bI\s+was\s+the\s+(?:one|person)\s+(?:who|that)\s+\w+/gi,
        /\bI\s+became\s+(?:the\s+)?(?:\w+\s+)?(?:translator|mediator|organizer|coordinator|liaison)\b/gi,
        /\bI\s+took\s+on\s+the\s+role\s+of/gi,
        /\bI\s+found\s+myself\s+(?:becoming|serving\s+as|acting\s+as)\s+(?:the\s+)?\w+/gi
    ];
    for (const pattern of implicitRolePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            mentionedCount += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    if (mentionedCount >= 1) {
        return { present: true, clarity: 'mentioned', examples };
    }
    // Title only (no role description)
    const titleOnlyPattern = /(?:president|captain|leader|founder|coordinator|director|manager)\b/gi;
    const titleMatches = text.match(titleOnlyPattern);
    if (titleMatches && titleMatches.length >= 1) {
        return { present: false, clarity: 'title_only', examples: titleMatches.slice(0, 2) };
    }
    return { present: false, clarity: 'absent', examples: [] };
}
function detectDifferentiation(text) {
    const patterns = [
        /While\s+(?:the\s+team|we|others)\s+\w+(?:\s+\w+){0,5},\s+I\s+\w+/gi,
        /I\s+specifically\s+\w+(?:\s+\w+){0,5}/gi,
        /My\s+contribution\s+was\s+\w+(?:\s+\w+){0,5}/gi,
        /Unlike\s+(?:the\s+team|others),\s+I\s+\w+/gi,
        /I\s+focused\s+on\s+\w+\s+while\s+\w+/gi
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
function detectFailureOwnership(text) {
    const patterns = [
        /I\s+(?:forgot|failed|messed\s+up|made\s+a\s+mistake|overlooked|missed|screwed\s+up)/gi,
        /My\s+(?:fault|mistake|oversight|error)/gi,
        /I\s+should\s+have\s+\w+(?:\s+\w+){0,5}/gi,
        /I\s+(?:didn't|couldn't|wasn't\s+able\s+to)\s+\w+\s+(?:and\s+that|which)\s+(?:was|caused)/gi
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
function detectVagueLanguage(text) {
    const patterns = [
        /helped\s+(?:with|organize|create|develop|plan|coordinate)/gi,
        /was\s+(?:part\s+of|involved\s+in|a\s+member\s+of)/gi,
        /assisted\s+(?:with|in)/gi,
        /contributed\s+to\s+(?!(?:by|through))/gi, // "contributed to" without specifics
        /participated\s+in/gi,
        /took\s+part\s+in/gi
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
function countAgencyVerbs(text) {
    const agencyVerbPattern = /\bI\s+(led|created|organized|designed|built|taught|developed|implemented|launched|coordinated|managed|solved|founded|started|initiated|established|directed|executed|produced|engineered|constructed)/gi;
    const matches = text.match(agencyVerbPattern);
    const count = matches ? matches.length : 0;
    const examples = matches ? [...new Set(matches.slice(0, 5))] : [];
    return { count, examples };
}
//# sourceMappingURL=roleOwnershipAnalyzer.js.map