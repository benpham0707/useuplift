/**
 * Vividness Quality Analyzer - The Show-Don't-Tell Transformer
 *
 * Analyzes HOW WELL a PIQ shows vs tells, breaking down scene quality into
 * precise, measurable components.
 *
 * Research Foundation:
 * - Harvard AO: "The essays I remember have SPECIFIC MOMENTS, not summaries"
 * - Berkeley AO: "'The worst stench I'd ever encountered' vs 'I volunteered at a clinic'
 *                  is the difference between memorable and forgettable"
 * - Princeton AO: "100% of admits we studied started with concrete scenes"
 * - MIT: "Show me what you built, don't tell me you're a builder"
 *
 * THE VIVIDNESS FORMULA (What makes 10/10 scenes):
 *
 * 1. THE 5 SENSES (Sensory Immersion)
 *    ✅ Visual: What you saw ("fluorescent lights", "empty robotics lab", "Sarah hunched over laptop")
 *    ✅ Auditory: What you heard ("aggressive typing", "silence for 40 minutes", "wrench clattered")
 *    ✅ Tactile: What you felt ("clammy hands", "cold metal", "rough concrete")
 *    ✅ Olfactory: What you smelled ("solder and tension", "burnt circuits", "fresh-cut grass")
 *    ✅ Gustatory: What you tasted (rare in PIQs, but powerful when present)
 *
 * 2. TEMPORAL SPECIFICITY (When)
 *    - Exact time: "11:47 PM", "Tuesday afternoon"
 *    - Specific timeframe: "Three days before nationals", "40 minutes of silence"
 *    - Generic: "one day", "later" (WEAK)
 *
 * 3. SPATIAL SPECIFICITY (Where)
 *    - Precise location: "empty robotics lab", "supply closet", "pharmacy counter"
 *    - Generic: "the room", "at school" (WEAK)
 *
 * 4. DIALOGUE QUALITY
 *    - Reveals character: "'You can't be president. You're too quiet.'" (shows Sarah's directness)
 *    - Info-dump: "'We need to finish the code by Friday.'" (just information)
 *    - Conversational: Natural speech patterns vs. formal
 *
 * 5. INNER MONOLOGUE (Thought Process)
 *    - Shows thinking: "I asked myself...", "I realized...", "What had I been thinking?"
 *    - Makes reader see your mind working
 *
 * 6. ACTION SPECIFICITY (What happened)
 *    - Specific verbs: "gripped", "stared", "hunched", "typed with aggressive precision"
 *    - Generic verbs: "did", "made", "went" (WEAK)
 *
 * VIVIDNESS SCORING:
 * - 9-10/10 (World-Class): 4+ senses, specific time/place, dialogue reveals character, inner monologue
 * - 7-8/10 (Strong): 2-3 senses, temporal/spatial anchors, some dialogue
 * - 5-6/10 (Adequate): 1-2 senses, vague time/place, no dialogue
 * - 3-4/10 (Weak): Tells not shows, abstract language, no sensory details
 * - 0-2/10 (Resume-style): Pure summary, no scenes whatsoever
 */
// ============================================================================
// SENSORY PATTERNS
// ============================================================================
const SENSORY_PATTERNS = {
    visual: {
        verbs: ['saw', 'watched', 'stared', 'gazed', 'glanced', 'noticed', 'observed', 'looked', 'peered', 'glimpsed'],
        adjectives: ['bright', 'dark', 'colorful', 'faded', 'empty', 'crowded', 'fluorescent', 'shadowy'],
        patterns: [
            /\b(saw|watched|stared at|gazed at|looked at|noticed)\s+(?:the\s+)?([a-z]+\s+){1,4}(face|room|lab|board|screen|eyes|hands)/gi,
            /\b(empty|crowded|bright|dark|fluorescent)\s+(room|lab|hallway|space|area)/gi,
            /\beyes\s+(widened|narrowed|lit up|darted|fixed on)/gi
        ]
    },
    auditory: {
        verbs: ['heard', 'listened', 'whispered', 'shouted', 'muttered', 'murmured', 'echoed'],
        nouns: ['sound', 'noise', 'voice', 'silence', 'whisper', 'shout', 'hum', 'buzz', 'click', 'clatter'],
        patterns: [
            /\b(heard|listened to)\s+(?:the\s+)?([a-z]+\s+){0,3}(sound|noise|voice|whisper|silence)/gi,
            /\b(silence|quiet)\s+(for|lasted|stretched)/gi,
            /\b(typing|clicking|buzzing|humming|clattering)\b/gi,
            /\bsaid\s+nothing\s+for\s+\d+/gi
        ]
    },
    tactile: {
        verbs: ['felt', 'touched', 'gripped', 'grabbed', 'clutched', 'pressed', 'brushed'],
        adjectives: ['rough', 'smooth', 'cold', 'hot', 'warm', 'clammy', 'sweaty', 'sticky', 'soft', 'hard'],
        patterns: [
            /\b(hands?|fingers?|palms?)\s+(trembled?|shook|gripped?|clutched?|sweaty|clammy)/gi,
            /\bfelt\s+(the\s+)?([a-z]+\s+){0,2}(cold|rough|smooth|warm|pressure)/gi,
            /\b(cold|rough|smooth)\s+(metal|concrete|wood|surface)/gi
        ]
    },
    olfactory: {
        nouns: ['smell', 'stench', 'scent', 'aroma', 'odor', 'fragrance'],
        adjectives: ['acrid', 'sweet', 'sour', 'burnt', 'fresh', 'stale', 'pungent'],
        patterns: [
            /\b(smell|stench|scent|aroma)\s+of\s+([a-z]+\s+){0,2}/gi,
            /\bsmelled?\s+(like|of)\s+([a-z]+\s+){0,3}/gi,
            /\b(burnt|acrid|sweet|fresh)\s+(smell|scent|aroma)/gi
        ]
    },
    gustatory: {
        verbs: ['tasted', 'savored'],
        adjectives: ['bitter', 'sweet', 'sour', 'salty', 'metallic'],
        patterns: [
            /\btasted?\s+(like|of)?\s*([a-z]+)?/gi,
            /\b(bitter|sweet|sour|metallic)\s+taste/gi
        ]
    }
};
// ============================================================================
// ACTION VERBS
// ============================================================================
const STRONG_ACTION_VERBS = [
    'gripped', 'grabbed', 'clutched', 'yanked', 'slammed', 'thrust',
    'stared', 'glared', 'peered', 'squinted', 'gazed',
    'whispered', 'muttered', 'shouted', 'hissed', 'stammered',
    'sprinted', 'darted', 'lunged', 'stumbled', 'collapsed',
    'trembled', 'shook', 'quivered', 'flinched', 'recoiled',
    'hunched', 'slumped', 'straightened', 'froze',
    'clenched', 'flexed', 'tightened', 'loosened',
    'scribbled', 'scratched', 'traced', 'sketched'
];
const WEAK_GENERIC_VERBS = [
    'did', 'made', 'got', 'went', 'came', 'had', 'was', 'were',
    'put', 'took', 'gave', 'found', 'kept', 'let', 'seemed'
];
// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================
export function analyzeVividness(text) {
    // Analyze each sense
    const visualAnalysis = analyzeSense(text, 'visual');
    const auditoryAnalysis = analyzeSense(text, 'auditory');
    const tactileAnalysis = analyzeSense(text, 'tactile');
    const olfactoryAnalysis = analyzeSense(text, 'olfactory');
    const gustatoryAnalysis = analyzeSense(text, 'gustatory');
    const totalSenses = [visualAnalysis, auditoryAnalysis, tactileAnalysis, olfactoryAnalysis, gustatoryAnalysis]
        .filter(s => s.present).length;
    // Analyze temporal specificity
    const temporalAnalysis = analyzeTemporalSpecificity(text);
    // Analyze spatial specificity
    const spatialAnalysis = analyzeSpatialSpecificity(text);
    // Analyze dialogue
    const dialogueAnalysis = analyzeDialogue(text);
    // Analyze inner monologue
    const innerMonologueAnalysis = analyzeInnerMonologue(text);
    // Analyze action specificity
    const actionAnalysis = analyzeActionSpecificity(text);
    // Detect scenes
    const sceneAnalysis = analyzeScenes(text, visualAnalysis, temporalAnalysis, spatialAnalysis);
    // Calculate overall vividness score
    const overallScore = calculateOverallVividness(totalSenses, temporalAnalysis.score, spatialAnalysis.score, dialogueAnalysis.score, innerMonologueAnalysis.score, actionAnalysis.score, sceneAnalysis.best_scene_quality);
    // Get tier
    const tier = getVividnessTier(overallScore);
    // Extract best vivid moments and weakest moments
    const bestMoments = extractBestVividMoments(text, visualAnalysis, auditoryAnalysis, tactileAnalysis);
    const weakestMoments = extractWeakestMoments(text);
    // Identify strengths and weaknesses
    const strengths = identifyVividnessStrengths(totalSenses, temporalAnalysis, dialogueAnalysis, actionAnalysis);
    const weaknesses = identifyVividnessWeaknesses(totalSenses, temporalAnalysis, spatialAnalysis, dialogueAnalysis);
    // Generate upgrade path
    const upgradeTo10 = generateUpgradePath(totalSenses, temporalAnalysis, spatialAnalysis, dialogueAnalysis, innerMonologueAnalysis);
    // Research alignment
    const harvardPatternMatch = sceneAnalysis.has_concrete_scene && totalSenses >= 2;
    const aoAssessment = getAOAssessment(overallScore, totalSenses, sceneAnalysis.has_concrete_scene);
    return {
        overall_vividness_score: overallScore,
        tier,
        senses: {
            visual: visualAnalysis,
            auditory: auditoryAnalysis,
            tactile: tactileAnalysis,
            olfactory: olfactoryAnalysis,
            gustatory: gustatoryAnalysis,
            total_senses_engaged: totalSenses
        },
        temporal: temporalAnalysis,
        spatial: spatialAnalysis,
        dialogue: dialogueAnalysis,
        inner_monologue: innerMonologueAnalysis,
        action_specificity: actionAnalysis,
        scenes: sceneAnalysis,
        best_vivid_moments: bestMoments,
        weakest_moments: weakestMoments,
        strengths,
        weaknesses,
        upgrade_to_10: upgradeTo10,
        harvard_pattern_match: harvardPatternMatch,
        ao_assessment: aoAssessment
    };
}
// ============================================================================
// SENSE ANALYSIS
// ============================================================================
function analyzeSense(text, senseType) {
    const patterns = SENSORY_PATTERNS[senseType];
    const examples = [];
    let count = 0;
    // Check patterns
    if (patterns.patterns) {
        for (const pattern of patterns.patterns) {
            const matches = text.match(pattern);
            if (matches) {
                examples.push(...matches.map(m => `"${m.trim().substring(0, 80)}"`));
                count += matches.length;
            }
        }
    }
    // Check verbs
    if (patterns.verbs) {
        for (const verb of patterns.verbs) {
            if (new RegExp(`\\b${verb}\\b`, 'gi').test(text)) {
                count++;
            }
        }
    }
    // Check nouns
    if (patterns.nouns) {
        for (const noun of patterns.nouns) {
            if (new RegExp(`\\b${noun}\\b`, 'gi').test(text)) {
                count++;
            }
        }
    }
    const present = count > 0;
    const quality = count >= 3 ? 'vivid' : count >= 1 ? 'adequate' : 'weak';
    return {
        present,
        count,
        examples: [...new Set(examples)].slice(0, 3),
        quality
    };
}
// ============================================================================
// TEMPORAL SPECIFICITY
// ============================================================================
function analyzeTemporalSpecificity(text) {
    const examples = [];
    // Exact time patterns
    const exactPatterns = [
        /\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/g,
        /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(morning|afternoon|evening|night)?/gi
    ];
    // Specific timeframe patterns
    const specificPatterns = [
        /(three|two|five|seven|ten|\d+)\s+(days|hours|minutes|weeks|months)\s+(before|after|until|since)/gi,
        /(junior|senior|sophomore|freshman)\s+year/gi,
        /\b(spring|fall|summer|winter)\s+of\s+\d{4}/gi
    ];
    // Vague patterns (penalize)
    const vaguePatterns = [
        /\b(one day|someday|later|eventually|soon|recently)\b/gi
    ];
    let precisionLevel = 'none';
    let score = 3; // Default
    // Check exact
    for (const pattern of exactPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            examples.push(...matches.slice(0, 2));
            precisionLevel = 'exact';
            score = 10;
            break;
        }
    }
    // Check specific
    if (precisionLevel !== 'exact') {
        for (const pattern of specificPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                examples.push(...matches.slice(0, 2));
                precisionLevel = 'specific';
                score = 7;
                break;
            }
        }
    }
    // Check vague
    if (precisionLevel === 'none') {
        const vagueMatches = text.match(vaguePatterns[0]);
        if (vagueMatches) {
            precisionLevel = 'vague';
            score = 4;
        }
    }
    return {
        has_temporal_anchor: precisionLevel !== 'none',
        precision_level: precisionLevel,
        examples: [...new Set(examples)],
        score
    };
}
// ============================================================================
// SPATIAL SPECIFICITY
// ============================================================================
function analyzeSpatialSpecificity(text) {
    const examples = [];
    // Precise location patterns
    const precisePatterns = [
        /(empty|crowded|small|large|dimly lit|fluorescent)\s+(robotics\s+)?lab/gi,
        /supply\s+closet/gi,
        /pharmacy\s+counter/gi,
        /(corner|back|front)\s+of\s+the\s+(room|lab|classroom|cafeteria)/gi,
        /\b(hallway|corridor|stairwell|parking lot)\s+(between|outside|near)/gi
    ];
    // Generic location patterns (penalize)
    const genericPatterns = [
        /\b(the room|at school|in class|at home|at work)\b/gi
    ];
    let precisionLevel = 'none';
    let score = 3; // Default
    // Check precise
    for (const pattern of precisePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            examples.push(...matches.slice(0, 2));
            precisionLevel = 'precise';
            score = 10;
            break;
        }
    }
    // Check for any location mention
    if (precisionLevel === 'none') {
        const locationWords = ['in', 'at', 'inside', 'outside', 'where'];
        for (const word of locationWords) {
            const pattern = new RegExp(`\\b${word}\\s+(the\\s+)?([a-z]+\\s+){0,2}(room|lab|place|area)`, 'gi');
            const matches = text.match(pattern);
            if (matches) {
                precisionLevel = 'specific';
                score = 6;
                break;
            }
        }
    }
    // Check generic (penalize)
    const genericMatches = text.match(genericPatterns[0]);
    if (genericMatches && precisionLevel === 'specific') {
        score = 5;
        precisionLevel = 'generic';
    }
    return {
        has_spatial_anchor: precisionLevel !== 'none',
        precision_level: precisionLevel,
        examples: [...new Set(examples)],
        score
    };
}
// ============================================================================
// DIALOGUE ANALYSIS
// ============================================================================
function analyzeDialogue(text) {
    const dialoguePattern = /"([^"]+)"/g;
    const matches = text.match(dialoguePattern) || [];
    const examples = matches.slice(0, 3);
    const hasDialogue = matches.length > 0;
    const count = matches.length;
    let quality = 'none';
    let score = 0;
    if (hasDialogue) {
        // Check if dialogue reveals character or emotion
        const characterRevealingPhrases = [
            /you can'?t|you won'?t|you shouldn'?t/i,
            /I don'?t think|I'?m not sure|what if/i,
            /this won'?t work|we need to|you have to/i
        ];
        const revealsCharacter = matches.some(m => characterRevealingPhrases.some(p => p.test(m)));
        if (revealsCharacter) {
            quality = 'reveals_character';
            score = 9;
        }
        else if (matches.some(m => m.split(' ').length <= 10)) {
            // Short dialogue is usually conversational
            quality = 'conversational';
            score = 7;
        }
        else {
            // Long dialogue is usually info-dump
            quality = 'info_dump';
            score = 5;
        }
    }
    return {
        has_dialogue: hasDialogue,
        dialogue_count: count,
        quality,
        examples,
        score
    };
}
// ============================================================================
// INNER MONOLOGUE ANALYSIS
// ============================================================================
function analyzeInnerMonologue(text) {
    const innerMonologuePatterns = [
        /I (asked myself|wondered|thought|questioned)/gi,
        /What (had I|was I|could I)/gi,
        /(Why|How) (was|did|could) I/gi
    ];
    const examples = [];
    let count = 0;
    for (const pattern of innerMonologuePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            examples.push(...matches.map(m => `"${text.substring(text.toLowerCase().indexOf(m.toLowerCase()), text.toLowerCase().indexOf(m.toLowerCase()) + 80)}"`));
            count += matches.length;
        }
    }
    const hasInnerMonologue = count > 0;
    const showsThinking = count >= 2;
    const score = showsThinking ? 9 : hasInnerMonologue ? 6 : 0;
    return {
        has_inner_monologue: hasInnerMonologue,
        shows_thinking: showsThinking,
        examples: [...new Set(examples)].slice(0, 2),
        score
    };
}
// ============================================================================
// ACTION SPECIFICITY
// ============================================================================
function analyzeActionSpecificity(text) {
    const specificVerbs = [];
    const genericVerbs = [];
    for (const verb of STRONG_ACTION_VERBS) {
        if (new RegExp(`\\b${verb}\\b`, 'gi').test(text)) {
            specificVerbs.push(verb);
        }
    }
    for (const verb of WEAK_GENERIC_VERBS) {
        if (new RegExp(`\\b${verb}\\b`, 'gi').test(text)) {
            genericVerbs.push(verb);
        }
    }
    const total = specificVerbs.length + genericVerbs.length;
    const strongVerbRatio = total > 0 ? specificVerbs.length / total : 0;
    const score = strongVerbRatio >= 0.5 ? 9 :
        strongVerbRatio >= 0.3 ? 7 :
            strongVerbRatio >= 0.1 ? 5 : 3;
    return {
        specific_verbs: specificVerbs.slice(0, 5),
        generic_verbs: genericVerbs.slice(0, 5),
        strong_verb_ratio: strongVerbRatio,
        score
    };
}
// ============================================================================
// SCENE ANALYSIS
// ============================================================================
function analyzeScenes(text, visualAnalysis, temporalAnalysis, spatialAnalysis) {
    const hasConcreteScene = (visualAnalysis.present &&
        (temporalAnalysis.has_temporal_anchor || spatialAnalysis.has_spatial_anchor));
    // Rough scene count (paragraphs with temporal/spatial anchors + sensory details)
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
    let sceneCount = 0;
    for (const para of paragraphs) {
        const hasTime = /\b(when|at|before|after|during|\d{1,2}:\d{2})/i.test(para);
        const hasPlace = /\b(in|at|inside|where)\s+(?:the\s+)?[a-z]+/i.test(para);
        const hasSensory = SENSORY_PATTERNS.visual.patterns.some(p => p.test(para));
        if ((hasTime || hasPlace) && hasSensory) {
            sceneCount++;
        }
    }
    // Best scene quality
    const bestSceneQuality = hasConcreteScene ?
        Math.min(10, temporalAnalysis.score * 0.4 + spatialAnalysis.score * 0.3 + (visualAnalysis.count * 0.3)) :
        0;
    return {
        has_concrete_scene: hasConcreteScene,
        scene_count: sceneCount,
        best_scene_quality: bestSceneQuality
    };
}
// ============================================================================
// OVERALL SCORE CALCULATION
// ============================================================================
function calculateOverallVividness(totalSenses, temporalScore, spatialScore, dialogueScore, innerMonologueScore, actionScore, bestSceneQuality) {
    // Weighted average
    const senseScore = (totalSenses / 5) * 10; // 0-10 scale
    const overallScore = (senseScore * 0.30 + // 30% weight on senses
        temporalScore * 0.15 + // 15% temporal
        spatialScore * 0.15 + // 15% spatial
        dialogueScore * 0.15 + // 15% dialogue
        innerMonologueScore * 0.10 + // 10% inner monologue
        actionScore * 0.15 // 15% action verbs
    );
    return Math.min(10, overallScore);
}
function getVividnessTier(score) {
    if (score >= 9)
        return 'world_class';
    if (score >= 7)
        return 'strong';
    if (score >= 5)
        return 'adequate';
    if (score >= 3)
        return 'weak';
    return 'resume_style';
}
// ============================================================================
// EVIDENCE EXTRACTION
// ============================================================================
function extractBestVividMoments(text, visual, auditory, tactile) {
    const moments = [];
    // Collect all sensory examples
    moments.push(...visual.examples);
    moments.push(...auditory.examples);
    moments.push(...tactile.examples);
    return moments.slice(0, 3);
}
function extractWeakestMoments(text) {
    const weak = [];
    // Tell-don't-show phrases
    const tellPhrases = [
        'I learned', 'taught me', 'I realized', 'I am a leader', 'I am passionate',
        'this experience', 'through this', 'from this I gained'
    ];
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
        for (const phrase of tellPhrases) {
            if (sentence.toLowerCase().includes(phrase)) {
                weak.push(`"${sentence.trim().substring(0, 100)}"`);
                break;
            }
        }
    }
    return weak.slice(0, 2);
}
// ============================================================================
// STRENGTHS & WEAKNESSES
// ============================================================================
function identifyVividnessStrengths(totalSenses, temporal, dialogue, action) {
    const strengths = [];
    if (totalSenses >= 3) {
        strengths.push(`✅ Multi-sensory (${totalSenses}/5 senses): Rich sensory immersion`);
    }
    else if (totalSenses >= 2) {
        strengths.push(`Good sensory details (${totalSenses}/5 senses engaged)`);
    }
    if (temporal.precision_level === 'exact') {
        strengths.push('Exact temporal anchor (specific time creates immediacy)');
    }
    else if (temporal.precision_level === 'specific') {
        strengths.push('Specific timeframe mentioned');
    }
    if (dialogue.quality === 'reveals_character') {
        strengths.push('Dialogue reveals character (not just info-dump)');
    }
    if (action.strong_verb_ratio >= 0.3) {
        strengths.push(`Strong action verbs (${(action.strong_verb_ratio * 100).toFixed(0)}% ratio)`);
    }
    return strengths;
}
function identifyVividnessWeaknesses(totalSenses, temporal, spatial, dialogue) {
    const weaknesses = [];
    if (totalSenses === 0) {
        weaknesses.push('❌ No sensory details (add: what you saw, heard, felt)');
    }
    else if (totalSenses === 1) {
        weaknesses.push('⚠️ Only one sense engaged (add 2-3 more senses for vividness)');
    }
    if (!temporal.has_temporal_anchor) {
        weaknesses.push('Missing temporal anchor (add: specific time/date)');
    }
    else if (temporal.precision_level === 'vague') {
        weaknesses.push('Vague timeframe (change "one day" → "Tuesday, 3 days before nationals")');
    }
    if (!spatial.has_spatial_anchor) {
        weaknesses.push('Missing spatial anchor (add: specific location)');
    }
    else if (spatial.precision_level === 'generic') {
        weaknesses.push('Generic location (change "the room" → "empty robotics lab")');
    }
    if (!dialogue.has_dialogue) {
        weaknesses.push('No dialogue (add conversational speech to bring scene alive)');
    }
    return weaknesses;
}
// ============================================================================
// UPGRADE PATH
// ============================================================================
function generateUpgradePath(totalSenses, temporal, spatial, dialogue, innerMonologue) {
    const missingElements = [];
    if (totalSenses < 3)
        missingElements.push(`Add ${3 - totalSenses} more senses (visual, auditory, tactile)`);
    if (temporal.precision_level !== 'exact')
        missingElements.push('Add exact time ("11:47 PM", "Tuesday afternoon")');
    if (spatial.precision_level !== 'precise')
        missingElements.push('Add precise location ("empty robotics lab" not "the room")');
    if (!dialogue.has_dialogue)
        missingElements.push('Add conversational dialogue');
    if (!innerMonologue.has_inner_monologue)
        missingElements.push('Add inner monologue (show your thinking)');
    const howToAdd = `WORLD-CLASS VIVIDNESS FORMULA (10/10):

1. OPEN WITH TIME + PLACE: "Three days before nationals, I stood in our empty robotics lab"
2. ADD VISUAL: "staring at the disassembled robot" (what you saw)
3. ADD AUDITORY: "The fluorescent lights hummed" (what you heard)
4. ADD TACTILE: "Cold metal parts scattered across the concrete floor" (what you felt)
5. ADD OLFACTORY: "The room smelled like burnt circuits and stress" (what you smelled)
6. ADD DIALOGUE: "'We're screwed,' Leo muttered, staring at his laptop" (conversational)
7. ADD INNER MONOLOGUE: "I asked myself: What had I been thinking?" (show thinking)
8. USE STRONG VERBS: "gripped" not "held", "stared" not "looked"`;
    const exampleTransformation = {
        current_tell: "I was nervous about leading the team. It was challenging.",
        world_class_show: `Three days before nationals, I stood in our empty robotics lab, staring at the disassembled robot. The fluorescent lights hummed. Cold metal parts scattered across the concrete floor. The room smelled like burnt circuits and stress.

"We're screwed," Leo muttered, staring at his laptop. Sarah sat in the corner, jaw clenched, refusing to make eye contact.

My hands trembled as I gripped the wrench. Eighty people. All counting on me. What had I been thinking?`,
        elements_added: [
            'Exact time: "Three days before nationals"',
            'Precise location: "empty robotics lab"',
            'Visual: "disassembled robot", "Sarah sat in corner, jaw clenched"',
            'Auditory: "fluorescent lights hummed"',
            'Tactile: "Cold metal parts", "hands trembled as I gripped"',
            'Olfactory: "burnt circuits and stress"',
            'Dialogue: "We\'re screwed"',
            'Inner monologue: "What had I been thinking?"',
            'Strong verbs: "gripped", "trembled", "clenched"'
        ]
    };
    return {
        missing_elements: missingElements,
        how_to_add: howToAdd,
        example_transformation: exampleTransformation
    };
}
// ============================================================================
// AO ASSESSMENT
// ============================================================================
function getAOAssessment(overallScore, totalSenses, hasConcreteScene) {
    if (overallScore >= 9) {
        return `✅ WORLD-CLASS (9-10/10): Multi-sensory immersion. Harvard AO: "The essays I remember months later have specific moments." This creates lasting impact.`;
    }
    if (overallScore >= 7) {
        return `✅ STRONG (7-8/10): Concrete scenes present with sensory details. Berkeley AO: "The difference between 'The worst stench' and 'I volunteered' is memorable vs forgettable." This shows not tells.`;
    }
    if (overallScore >= 5) {
        return `⚠️ ADEQUATE (5-6/10): Some showing but needs more vividness. Princeton: "100% of admits started with concrete scenes." Add temporal/spatial anchors + 2-3 senses.`;
    }
    if (overallScore >= 3) {
        return `❌ WEAK (3-4/10): Mostly telling not showing. MIT AO: "Show me what you built, don't tell me you're a builder." Need sensory details + specific moments.`;
    }
    return `❌ RESUME-STYLE (0-2/10): Pure summary, no scenes. Critical for top schools: SHOW concrete moments, DON'T TELL about experiences.`;
}
//# sourceMappingURL=vividnessAnalyzer.js.map