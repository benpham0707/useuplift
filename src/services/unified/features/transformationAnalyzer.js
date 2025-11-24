/**
 * TRANSFORMATIVE IMPACT ANALYZER
 *
 * Dimension 6: Transformative Impact (10% weight)
 *
 * Detects genuine growth and change over time vs generic "learning experiences":
 * - Before/after belief shifts (specific thought changes)
 * - Concrete behavioral changes (what you do differently now)
 * - Impact on relationships or worldview
 * - Avoiding "I learned that..." statements
 * - Growth arc (earned through struggle, not instant epiphany)
 *
 * Works alongside vulnerabilityAnalyzer (transformation_credibility) to form
 * complete Transformation dimension score.
 */
/**
 * Analyze transformative impact in an essay
 */
export function analyzeTransformation(essayText) {
    // Detect belief shifts
    const beliefShifts = detectBeliefShifts(essayText);
    // Detect behavioral changes
    const behaviorChanges = detectBehavioralChanges(essayText);
    // Detect growth arc
    const growthArc = detectGrowthArc(essayText);
    // Detect impact areas
    const impact = detectImpact(essayText);
    // Detect "I learned" statements (red flags)
    const genericLearning = detectGenericLearning(essayText);
    // Detect before/after comparisons
    const beforeAfter = detectBeforeAfterComparison(essayText);
    // Calculate transformation score (0-10)
    let score = 5.0; // Start at baseline
    // Belief shifts (+3 max)
    if (beliefShifts.count >= 2 && beliefShifts.specificity === 'concrete')
        score += 3.0;
    else if (beliefShifts.count >= 1 && beliefShifts.specificity === 'concrete')
        score += 2.0;
    else if (beliefShifts.count >= 1)
        score += 1.0;
    // Behavioral changes (+2 max)
    if (behaviorChanges.count >= 2)
        score += 2.0;
    else if (behaviorChanges.count >= 1)
        score += 1.0;
    // Growth arc (+2 max)
    if (growthArc.type === 'earned_through_struggle')
        score += 2.0;
    else if (growthArc.type === 'gradual_realization')
        score += 1.5;
    else if (growthArc.type === 'instant_epiphany')
        score += 0.5;
    // Impact (+1 max)
    const impactCount = [impact.relationships, impact.worldview, impact.identity].filter(Boolean).length;
    if (impactCount >= 2)
        score += 1.0;
    else if (impactCount >= 1)
        score += 0.5;
    // Before/after (+1 max)
    if (beforeAfter.specificity === 'concrete_with_evidence')
        score += 1.0;
    else if (beforeAfter.specificity === 'stated_but_vague')
        score += 0.5;
    // Penalties for generic learning (-3 max)
    if (genericLearning.count >= 5)
        score -= 3.0;
    else if (genericLearning.count >= 3)
        score -= 2.0;
    else if (genericLearning.count >= 1)
        score -= 1.0;
    // Cap at 0-10
    score = Math.max(0, Math.min(10, score));
    // Determine transformation quality
    let quality;
    if (score >= 9)
        quality = 'world_class';
    else if (score >= 7)
        quality = 'strong';
    else if (score >= 5)
        quality = 'adequate';
    else if (score >= 3)
        quality = 'stated';
    else
        quality = 'absent';
    // Generate guidance
    const strengths = [];
    const weaknesses = [];
    const quickWins = [];
    if (beliefShifts.count >= 2 && beliefShifts.specificity === 'concrete') {
        strengths.push('Specific belief shifts with concrete before/after thinking');
    }
    else if (beliefShifts.count === 0) {
        weaknesses.push('No clear belief shifts - how did your thinking change?');
        quickWins.push('Add one specific belief shift: "I used to think X, but now I believe Y because..."');
    }
    if (behaviorChanges.count >= 2) {
        strengths.push('Clear behavioral changes showing lasting impact');
    }
    else if (behaviorChanges.count === 0) {
        weaknesses.push('No concrete behavioral changes shown');
        quickWins.push('Show what you do differently now: "Now I..." vs "I used to..."');
    }
    if (growthArc.type === 'earned_through_struggle') {
        strengths.push('Authentic growth arc - transformation earned through struggle');
    }
    else if (growthArc.type === 'instant_epiphany') {
        weaknesses.push('Transformation feels too instant - show the messy middle');
        quickWins.push('Add struggle/resistance before breakthrough: "At first I resisted... but gradually..."');
    }
    if (genericLearning.count >= 3) {
        weaknesses.push(`Too many generic "I learned" statements (${genericLearning.count} found)`);
        quickWins.push(`Replace "I learned that..." with specific belief/behavior shifts`);
    }
    return {
        transformation_score: parseFloat(score.toFixed(2)),
        transformation_quality: quality,
        has_belief_shifts: beliefShifts.count > 0,
        belief_shift_count: beliefShifts.count,
        belief_examples: beliefShifts.examples,
        belief_specificity: beliefShifts.specificity,
        has_behavioral_changes: behaviorChanges.count > 0,
        behavior_change_count: behaviorChanges.count,
        behavior_examples: behaviorChanges.examples,
        actions_different_now: behaviorChanges.specificActions,
        growth_arc_present: growthArc.present,
        growth_type: growthArc.type,
        arc_examples: growthArc.examples,
        impact_on_relationships: impact.relationships,
        impact_on_worldview: impact.worldview,
        impact_on_identity: impact.identity,
        impact_examples: impact.examples,
        has_i_learned_statements: genericLearning.count > 0,
        generic_learning_count: genericLearning.count,
        generic_examples: genericLearning.examples,
        before_after_comparison: beforeAfter.present,
        comparison_specificity: beforeAfter.specificity,
        strengths,
        weaknesses,
        quick_wins: quickWins
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function detectBeliefShifts(text) {
    const patterns = [
        /(?:I\s+used\s+to\s+(?:think|believe|assume|view)).*?(?:but\s+now|now\s+I|today\s+I)/gi,
        /(?:Once\s+I\s+(?:thought|believed)).*?(?:but|however|yet)/gi,
        /(?:I\s+realized|I\s+discovered|I\s+understood)\s+that\s+(?!I\s+(?:should|need|must))/gi,
        /(?:My\s+(?:perspective|view|understanding|thinking))\s+(?:changed|shifted|evolved|transformed)/gi,
        /(?:went\s+from\s+believing).*?(?:to\s+understanding|to\s+seeing)/gi
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
    // Determine specificity
    let specificity;
    if (count === 0)
        specificity = 'absent';
    else if (examples.some(ex => /\b(?:because|when|after|through)\b/i.test(ex))) {
        specificity = 'concrete'; // Has reasoning/context
    }
    else {
        specificity = 'vague';
    }
    return { count, examples: [...new Set(examples)], specificity };
}
function detectBehavioralChanges(text) {
    const patterns = [
        /(?:Now\s+I)\s+(?:always|regularly|consistently|make\s+sure\s+to|prioritize)/gi,
        /(?:I\s+(?:started|began))\s+(?:doing|practicing|implementing)/gi,
        /(?:Instead\s+of).*?(?:I\s+now|now\s+I)/gi,
        /(?:I\s+no\s+longer).*?(?:instead|but|now)/gi,
        /(?:This\s+(?:led\s+me\s+to|inspired\s+me\s+to|motivated\s+me\s+to))/gi
    ];
    const examples = [];
    const specificActions = [];
    let count = 0;
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            count += matches.length;
            examples.push(...matches.slice(0, 2));
        }
    }
    // Extract specific actions (verbs)
    const actionPattern = /(?:Now\s+I|I\s+now)\s+(\w+(?:\s+\w+){0,3})/gi;
    const actionMatches = text.match(actionPattern);
    if (actionMatches) {
        specificActions.push(...actionMatches.slice(0, 3));
    }
    return { count, examples: [...new Set(examples)], specificActions };
}
function detectGrowthArc(text) {
    // Struggle markers (earned transformation)
    const struggleMarkers = /(?:at\s+first\s+I\s+resisted|initially\s+I\s+struggled|I\s+was\s+hesitant|I\s+doubted|took\s+(?:weeks|months)|gradually|slowly|over\s+time)/gi;
    const struggleMatches = text.match(struggleMarkers);
    // Gradual markers
    const gradualMarkers = /(?:eventually|ultimately|finally|came\s+to\s+understand|grew\s+to|learned\s+over\s+time)/gi;
    const gradualMatches = text.match(gradualMarkers);
    // Instant markers (red flag)
    const instantMarkers = /(?:suddenly\s+I\s+realized|in\s+that\s+moment|instantly\s+(?:understood|knew)|right\s+then)/gi;
    const instantMatches = text.match(instantMarkers);
    // Generic learning (red flag)
    const genericMarkers = /(?:I\s+learned\s+that|this\s+taught\s+me|from\s+this\s+I\s+learned)/gi;
    const genericMatches = text.match(genericMarkers);
    const examples = [];
    let type;
    if (struggleMatches && struggleMatches.length >= 2) {
        type = 'earned_through_struggle';
        examples.push(...struggleMatches.slice(0, 2));
    }
    else if (gradualMatches) {
        type = 'gradual_realization';
        examples.push(...gradualMatches.slice(0, 2));
    }
    else if (instantMatches) {
        type = 'instant_epiphany';
        examples.push(...instantMatches.slice(0, 2));
    }
    else if (genericMatches) {
        type = 'stated_only';
        examples.push(...genericMatches.slice(0, 2));
    }
    else {
        type = 'none';
    }
    return {
        present: type !== 'none',
        type,
        examples
    };
}
function detectImpact(text) {
    const relationshipMarkers = /(?:my\s+(?:relationship|connection)\s+with|how\s+I\s+(?:interact|relate|connect)\s+with|changed\s+how\s+I\s+see\s+(?:others|people))/gi;
    const worldviewMarkers = /(?:how\s+I\s+see\s+the\s+world|my\s+(?:perspective|view)\s+on|changed\s+my\s+understanding\s+of)/gi;
    const identityMarkers = /(?:who\s+I\s+am|the\s+person\s+I|my\s+(?:identity|sense\s+of\s+self)|defines\s+me)/gi;
    const examples = [];
    const relationshipMatches = text.match(relationshipMarkers);
    const worldviewMatches = text.match(worldviewMarkers);
    const identityMatches = text.match(identityMarkers);
    if (relationshipMatches)
        examples.push(...relationshipMatches.slice(0, 1));
    if (worldviewMatches)
        examples.push(...worldviewMatches.slice(0, 1));
    if (identityMatches)
        examples.push(...identityMatches.slice(0, 1));
    return {
        relationships: !!relationshipMatches,
        worldview: !!worldviewMatches,
        identity: !!identityMatches,
        examples
    };
}
function detectGenericLearning(text) {
    const patterns = [
        /\bI\s+learned\s+(?:that|the\s+(?:importance|value|power)\s+of)/gi,
        /\bThis\s+(?:taught|showed|helped)\s+me\s+(?:that|the|to)/gi,
        /\bI\s+(?:discovered|found\s+out|came\s+to\s+understand)\s+that/gi,
        /\b(?:taught|showed|helped)\s+me\s+the\s+(?:importance|value|power)\s+of/gi
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
    return { count, examples: [...new Set(examples)] };
}
function detectBeforeAfterComparison(text) {
    const concretePatterns = [
        /(?:used\s+to).*?(?:but\s+now|now\s+I).*?(?:because|after|when|through)/gi,
        /(?:before).*?(?:after).*?(?:\d+|specific|particular|exact)/gi,
        /(?:went\s+from).*?(?:to).*?(?:\d+|percent|times|hours)/gi
    ];
    const vaguePatterns = [
        /(?:used\s+to).*?(?:but\s+now|now\s+I)/gi,
        /(?:before).*?(?:after)/gi,
        /(?:then).*?(?:now)/gi
    ];
    let concreteCount = 0;
    let vagueCount = 0;
    for (const pattern of concretePatterns) {
        const matches = text.match(pattern);
        if (matches)
            concreteCount += matches.length;
    }
    for (const pattern of vaguePatterns) {
        const matches = text.match(pattern);
        if (matches)
            vagueCount += matches.length;
    }
    if (concreteCount > 0) {
        return { present: true, specificity: 'concrete_with_evidence' };
    }
    else if (vagueCount > 0) {
        return { present: true, specificity: 'stated_but_vague' };
    }
    else {
        return { present: false, specificity: 'absent' };
    }
}
//# sourceMappingURL=transformationAnalyzer.js.map