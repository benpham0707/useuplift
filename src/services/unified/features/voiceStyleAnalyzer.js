/**
 * VOICE & STYLE ANALYZER
 *
 * Dimension 4: Distinctive Voice & Style (8% weight)
 *
 * Detects natural, authentic voice vs generic essay-speak:
 * - Essay-speak detection ("this taught me", "through this experience")
 * - AI phrase flagging ("delve into", "furthermore", "it should be noted")
 * - Active vs passive voice ratio (80%+ active = world-class)
 * - Fancy word penalties ("plethora", "myriad", "utilize")
 * - Sentence rhythm variety (mix of 3-word + 20+ word sentences)
 * - Conversational markers ("I mean", "honestly", "yeah")
 *
 * Scoring Philosophy:
 * - Zero essay-speak + 80%+ active + natural vocab = 9-10
 * - Heavy essay-speak + AI phrases + passive voice = 0-3
 */
/**
 * Analyze voice and style in an essay
 */
export function analyzeVoiceStyle(essayText) {
    // Detect essay-speak phrases
    const essaySpeak = detectEssaySpeak(essayText);
    // Detect AI-generated phrases
    const aiPhrases = detectAIPhrases(essayText);
    // Detect active vs passive voice
    const voiceRatio = detectActivePassiveVoice(essayText);
    // Detect fancy/pretentious words
    const fancyWords = detectFancyWords(essayText);
    // Analyze sentence rhythm variety
    const rhythm = analyzeSentenceRhythm(essayText);
    // Detect conversational markers (bonus)
    const conversational = detectConversationalMarkers(essayText);
    // Calculate voice score (0-10)
    let score = 5.0; // Start at baseline
    // Essay-speak penalty (-3.0 max)
    if (essaySpeak.count >= 5)
        score -= 3.0;
    else if (essaySpeak.count >= 3)
        score -= 2.0;
    else if (essaySpeak.count >= 1)
        score -= 1.0;
    // AI phrases penalty (-2.5 max)
    if (aiPhrases.count >= 4)
        score -= 2.5;
    else if (aiPhrases.count >= 2)
        score -= 1.5;
    else if (aiPhrases.count >= 1)
        score -= 0.5;
    // Active voice ratio (+3.0 max)
    if (voiceRatio.ratio >= 0.80)
        score += 3.0;
    else if (voiceRatio.ratio >= 0.70)
        score += 2.0;
    else if (voiceRatio.ratio >= 0.60)
        score += 1.0;
    else if (voiceRatio.ratio < 0.50)
        score -= 1.5;
    // Fancy words penalty (-1.5 max)
    if (fancyWords.count >= 5)
        score -= 1.5;
    else if (fancyWords.count >= 3)
        score -= 1.0;
    else if (fancyWords.count >= 1)
        score -= 0.5;
    // Sentence rhythm variety (+1.5 max)
    if (rhythm.score >= 0.7)
        score += 1.5;
    else if (rhythm.score >= 0.5)
        score += 1.0;
    else if (rhythm.score >= 0.3)
        score += 0.5;
    // Conversational markers (bonus +1.0 max)
    if (conversational.count >= 3)
        score += 1.0;
    else if (conversational.count >= 2)
        score += 0.5;
    // Cap at 0-10
    score = Math.max(0, Math.min(10, score));
    // Determine voice quality
    let quality;
    if (score >= 9)
        quality = 'authentic_distinctive';
    else if (score >= 7)
        quality = 'strong_voice';
    else if (score >= 5)
        quality = 'mixed_voice';
    else if (score >= 3)
        quality = 'generic_essay';
    else
        quality = 'ai_generated';
    // Generate guidance
    const strengths = [];
    const weaknesses = [];
    const quickWins = [];
    if (essaySpeak.count === 0) {
        strengths.push('Zero generic essay-speak detected');
    }
    else if (essaySpeak.count >= 3) {
        weaknesses.push(`Heavy essay-speak (${essaySpeak.count} instances of "this taught me"/"through this experience")`);
        quickWins.push('Delete reflective phrases - show the lesson through your actions, don\'t announce it');
    }
    if (aiPhrases.count >= 2) {
        weaknesses.push(`AI-generated phrases detected (${aiPhrases.count} instances)`);
        quickWins.push('Remove AI markers: "delve into" → "explore", "furthermore" → "also", "utilize" → "use"');
    }
    if (voiceRatio.ratio >= 0.80) {
        strengths.push(`Strong active voice (${Math.round(voiceRatio.ratio * 100)}% active sentences)`);
    }
    else if (voiceRatio.ratio < 0.60) {
        weaknesses.push(`Too much passive voice (${Math.round((1 - voiceRatio.ratio) * 100)}% passive)`);
        quickWins.push('Flip passive → active: "was created by me" → "I created"');
    }
    if (fancyWords.count >= 3) {
        weaknesses.push(`Pretentious vocabulary (${fancyWords.count} fancy words)`);
        quickWins.push('Use simple words: "plethora" → "many", "utilize" → "use", "myriad" → "lots of"');
    }
    if (rhythm.score >= 0.7) {
        strengths.push('Excellent sentence rhythm variety (mix of short punches + longer flowing sentences)');
    }
    else if (rhythm.score < 0.3) {
        weaknesses.push('Monotonous sentence length - all medium-length sentences');
        quickWins.push('Add variety: one 3-word sentence ("I was hooked.") + one 20+ word complex thought');
    }
    if (conversational.count >= 2) {
        strengths.push('Natural conversational tone (authentic markers like "I mean", "honestly")');
    }
    return {
        voice_score: parseFloat(score.toFixed(2)),
        voice_quality: quality,
        has_essay_speak: essaySpeak.present,
        essay_speak_count: essaySpeak.count,
        essay_speak_examples: essaySpeak.examples,
        has_ai_phrases: aiPhrases.present,
        ai_phrase_count: aiPhrases.count,
        ai_phrase_examples: aiPhrases.examples,
        active_voice_count: voiceRatio.activeCount,
        passive_voice_count: voiceRatio.passiveCount,
        active_ratio: parseFloat(voiceRatio.ratio.toFixed(2)),
        active_examples: voiceRatio.activeExamples,
        passive_examples: voiceRatio.passiveExamples,
        fancy_word_count: fancyWords.count,
        fancy_word_examples: fancyWords.examples,
        has_rhythm_variety: rhythm.hasVariety,
        short_sentence_count: rhythm.shortCount,
        long_sentence_count: rhythm.longCount,
        rhythm_score: parseFloat(rhythm.score.toFixed(2)),
        conversational_count: conversational.count,
        conversational_examples: conversational.examples,
        strengths,
        weaknesses,
        quick_wins: quickWins
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function detectEssaySpeak(text) {
    const patterns = [
        /(?:This|That|The)\s+(?:experience|activity|project|journey)\s+(?:taught|showed|revealed|demonstrated)/gi,
        /Through\s+(?:this|that|my)\s+(?:experience|activity|work|journey)/gi,
        /I\s+learned\s+(?:that|the\s+importance\s+of|how\s+to)/gi,
        /In\s+conclusion/gi,
        /(?:This|It)\s+(?:has\s+)?made\s+me\s+(?:realize|understand|appreciate)/gi,
        /As\s+a\s+result\s+of\s+this/gi,
        /(?:Throughout|During)\s+(?:this|my)\s+(?:journey|experience)/gi,
        /I\s+(?:have\s+)?come\s+to\s+(?:realize|understand|appreciate|value)/gi,
        /(?:This|That)\s+is\s+why\s+I\s+(?:believe|think|value)/gi,
        /Looking\s+back\s+(?:on|at)\s+(?:this|my)/gi
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
function detectAIPhrases(text) {
    const patterns = [
        /\bdelve\s+into/gi,
        /\bfurthermore\b/gi,
        /\bmoreover\b/gi,
        /\bit\s+(?:is\s+)?(?:important|worth|should\s+be)\s+noted\s+that/gi,
        /\bnavigat(?:e|ing)\s+the\s+(?:complexities|challenges)/gi,
        /\bin\s+today's\s+(?:world|society|landscape)/gi,
        /\bmultifaceted\b/gi,
        /\bproven\s+to\s+be\s+invaluable/gi,
        /\bultimately\b(?!\s+(?:won|lost|decided|chose))/gi, // "ultimately" unless followed by concrete action
        /\bserves\s+as\s+a\s+testament\s+to/gi,
        /\bembodies\s+the\s+(?:essence|spirit)/gi,
        /\bpivotal\s+moment/gi,
        /\btransformative\s+(?:experience|journey)/gi
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
function detectActivePassiveVoice(text) {
    // Active voice: subject performs action (I/he/she/they + action verb)
    const activePatterns = [
        /\bI\s+(?:led|created|organized|designed|built|wrote|taught|solved|decided|managed|developed|implemented|launched)/gi,
        /\bI\s+(?:made|took|gave|ran|planned|executed|started|founded|coordinated|directed)/gi,
        /\b(?:He|She|They|We)\s+(?:created|built|designed|developed|implemented|launched|organized)/gi
    ];
    const activeExamples = [];
    let activeCount = 0;
    for (const pattern of activePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            activeCount += matches.length;
            activeExamples.push(...matches.slice(0, 3));
        }
    }
    // Passive voice: "was/were/been + past participle" or "got + past participle"
    const passivePatterns = [
        /\b(?:was|were|been|being)\s+(?:created|designed|built|made|developed|implemented|organized|led|managed|coordinated|taught|given|shown|told|asked)/gi,
        /\bgot\s+(?:selected|chosen|picked|asked|invited)/gi,
        /\b(?:was|were)\s+(?:responsible|tasked|assigned|chosen|selected)\s+(?:for|to|with)/gi
    ];
    const passiveExamples = [];
    let passiveCount = 0;
    for (const pattern of passivePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            passiveCount += matches.length;
            passiveExamples.push(...matches.slice(0, 3));
        }
    }
    const total = activeCount + passiveCount;
    const ratio = total > 0 ? activeCount / total : 0.5; // Default to neutral if no voice detected
    return {
        activeCount,
        passiveCount,
        ratio,
        activeExamples: [...new Set(activeExamples)],
        passiveExamples: [...new Set(passiveExamples)]
    };
}
function detectFancyWords(text) {
    const patterns = [
        /\b(?:utilize|utilization)\b/gi, // Should be "use"
        /\b(?:plethora)\b/gi, // Should be "many"
        /\b(?:myriad)\b/gi, // Should be "many" or "lots of"
        /\b(?:endeavor|endeavors)\b/gi, // Should be "try" or "project"
        /\b(?:facilitate|facilitated)\b/gi, // Should be "help" or "run"
        /\b(?:optimal|optimize)\b/gi, // Should be "best" or "improve"
        /\b(?:paradigm)\b/gi,
        /\b(?:synergy|synergistic)\b/gi,
        /\b(?:leverage|leveraged)\b/gi, // Should be "use" or "used"
        /\b(?:implement|implementation)\b/gi, // Should be "add" or "create"
        /\b(?:paramount)\b/gi, // Should be "crucial" or "important"
        /\b(?:quintessential)\b/gi,
        /\b(?:elucidate)\b/gi, // Should be "explain"
        /\b(?:ameliorate)\b/gi // Should be "improve"
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
function analyzeSentenceRhythm(text) {
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let shortCount = 0; // 3-5 words
    let longCount = 0; // 20+ words
    for (const sentence of sentences) {
        const wordCount = sentence.trim().split(/\s+/).length;
        if (wordCount >= 3 && wordCount <= 5) {
            shortCount++;
        }
        else if (wordCount >= 20) {
            longCount++;
        }
    }
    // Variety score: want at least 1 short AND 1 long
    let score = 0;
    if (shortCount >= 1)
        score += 0.5;
    if (longCount >= 1)
        score += 0.5;
    // Bonus for multiple of each
    if (shortCount >= 2 && longCount >= 2)
        score = 1.0;
    const hasVariety = shortCount >= 1 && longCount >= 1;
    return {
        hasVariety,
        shortCount,
        longCount,
        score
    };
}
function detectConversationalMarkers(text) {
    const patterns = [
        /\bI\s+mean\b/gi,
        /\bhonestly\b/gi,
        /\byeah\b/gi,
        /\bokay\b/gi,
        /\blike\s+(?!a|an|the)\b/gi, // "like" as filler, not simile
        /\bbasically\b/gi,
        /\bactually\b/gi,
        /\byou\s+know\b/gi,
        /\bto\s+be\s+honest\b/gi,
        /\blet's\s+be\s+real\b/gi,
        /\bhere's\s+the\s+thing\b/gi
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
        count,
        examples: [...new Set(examples)]
    };
}
//# sourceMappingURL=voiceStyleAnalyzer.js.map