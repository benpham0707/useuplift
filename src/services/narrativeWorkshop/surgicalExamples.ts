/**
 * Surgical Editor Examples Library
 * 
 * A collection of "Gold Standard" transformations used for Few-Shot Prompting.
 * These examples demonstrate exactly how to fix specific issues while:
 * 1. Preserving word count (mostly).
 * 2. Adding specific texture/objects.
 * 3. Maintaining authentic voice.
 */

export interface SurgicalExample {
    rubricCategory: string;
    original: string;
    problem: string;
    fix: string;
    rationale: string;
    strategyUsed: string;
    voiceTypes: string[]; // Tags for voice alignment
    symptomTags?: string[]; // NEW: Tags for specific symptoms (e.g., "abstract_language", "passive_agency")
}

export const SURGICAL_EXAMPLES: SurgicalExample[] = [
    // ========================================================================
    // SHOW DON'T TELL
    // ========================================================================
    {
        rubricCategory: 'show_dont_tell_craft',
        original: "I was really nervous before the big speech.",
        problem: "Abstract emotion statement.",
        fix: "My hands shook so hard the index cards rattled against the microphone.",
        rationale: "Anchors 'nervousness' to a specific sound (rattle) and object (index cards).",
        strategyUsed: "Sensory Anchor",
        voiceTypes: ["Narrative", "Sensory", "Dramatic"],
        symptomTags: ["abstract_language", "telling_not_showing"]
    },
    {
        rubricCategory: 'show_dont_tell_craft',
        original: "The team worked hard all summer.",
        problem: "Generic summary.",
        fix: "We spent July pushing sleds until the grass stains on our knees turned permanent.",
        rationale: "Replaces 'worked hard' with specific action (pushing sleds) and evidence (grass stains).",
        strategyUsed: "Action Beat",
        voiceTypes: ["Narrative", "Gritty", "Team-Oriented"],
        symptomTags: ["telling_not_showing", "generic_pacing"]
    },

    // ========================================================================
    // NARRATIVE ARC / STAKES
    // ========================================================================
    {
        rubricCategory: 'narrative_arc_stakes_turn',
        original: "I realized I needed to change my leadership style.",
        problem: "Internal realization stated plainly.",
        fix: "Watching the freshman flinch when I shouted, I realized my voice was causing fear, not focus.",
        rationale: "Shows the trigger for change (freshman flinching) rather than just the conclusion.",
        strategyUsed: "Micro Stakes",
        voiceTypes: ["Reflective", "Leadership", "Empathetic"],
        symptomTags: ["telling_not_showing", "passive_agency"]
    },
    {
        rubricCategory: 'narrative_arc_stakes_turn',
        original: "The game was very important to us.",
        problem: "Telling the stakes.",
        fix: "Losing meant our seniors would graduate without ever touching the trophy.",
        rationale: "Defines 'important' by showing exactly what would be lost.",
        strategyUsed: "The Hypothetical",
        voiceTypes: ["Dramatic", "Team-Oriented", "High-Stakes"],
        symptomTags: ["abstract_language", "telling_not_showing"]
    },

    // ========================================================================
    // INTELLECTUAL VITALITY
    // ========================================================================
    {
        rubricCategory: 'intellectual_vitality_curiosity',
        original: "I learned a lot about history.",
        problem: "Generic learning statement.",
        fix: "I began to see history not as dates, but as a map of recurring human errors.",
        rationale: "Shows a conceptual shift in understanding, not just 'learning'.",
        strategyUsed: "The Definition",
        voiceTypes: ["Analytical", "Intellectual", "Philosophical"],
        symptomTags: ["abstract_language", "weak_verb"]
    },
    {
        rubricCategory: 'intellectual_vitality_curiosity',
        original: "Coding is like solving a puzzle.",
        problem: "Cliché simile.",
        fix: "Coding taught me that failure isn't an error message; it's the first step of iteration.",
        rationale: "Redefines failure through a specific intellectual lens.",
        strategyUsed: "Rhetorical Pivot",
        voiceTypes: ["Analytical", "Tech-Focused", "Resilient"],
        symptomTags: ["cliche_metaphor", "generic_pacing"]
    },

    // ========================================================================
    // ORIGINALITY / VOICE
    // ========================================================================
    {
        rubricCategory: 'originality_specificity_voice',
        original: "I have a passion for baking.",
        problem: "Generic 'passion' statement.",
        fix: "My kitchen is a laboratory where flour and yeast fight their weekly war.",
        rationale: "Uses a unique metaphor (war/lab) to describe the activity.",
        strategyUsed: "Object Symbolism",
        voiceTypes: ["Creative", "Metaphorical", "Whimsical"],
        symptomTags: ["cliche_metaphor", "abstract_language"]
    },
    {
        rubricCategory: 'originality_specificity_voice',
        original: "It was a beautiful sunset.",
        problem: "Generic description.",
        fix: "The sky turned the bruised purple of a healing shin.",
        rationale: "Uses unexpected, specific color imagery that fits a rougher voice.",
        strategyUsed: "Sensory Anchor",
        voiceTypes: ["Poetic", "Raw", "Imagery-Heavy"],
        symptomTags: ["telling_not_showing", "abstract_language"]
    },

    // ========================================================================
    // REFLECTION
    // ========================================================================
    {
        rubricCategory: 'reflection_meaning_making',
        original: "This taught me the value of hard work.",
        problem: "Generic lesson.",
        fix: "I learned that discipline is just choosing what you want most over what you want now.",
        rationale: "Definitions are stronger than labels. Defines the value specifically.",
        strategyUsed: "The Definition",
        voiceTypes: ["Reflective", "Philosophical", "Mature"],
        symptomTags: ["cliche_metaphor", "abstract_language"]
    },

    // ========================================================================
    // NEW: NARRATIVE DEPTH (Phase 10 Expansion)
    // ========================================================================
    {
        rubricCategory: 'narrative_arc_stakes_turn',
        original: "I was angry but I didn't say anything.",
        problem: "Telling the emotion directly.",
        fix: "I stared at my shoelaces, re-tying a knot that was already tight.",
        rationale: "Uses subtext (fidgeting) to convey suppressed anger without naming it.",
        strategyUsed: "Subtextual Action",
        voiceTypes: ["Narrative", "Subtle", "Understated"],
        symptomTags: ["telling_not_showing", "weak_verb"]
    },
    {
        rubricCategory: 'structure_pacing_flow',
        original: "I ran as fast as I could to the finish line. I was exhausted but happy.",
        problem: "Flat pacing.",
        fix: "Lungs burning. Legs numb. One step. Then another. The tape broke across my chest.",
        rationale: "Uses short fragments to mimic the breathless speed of the moment.",
        strategyUsed: "Staccato Pacing",
        voiceTypes: ["Action-Oriented", "Intense", "Fragmented"],
        symptomTags: ["generic_pacing", "telling_not_showing"]
    },
    {
        rubricCategory: 'originality_specificity_voice',
        original: "My grandmother's house was old and comfortable.",
        problem: "Generic adjectives.",
        fix: "The hallway smelled of mothballs and burnt toast, a scent that meant safety.",
        rationale: "Uses 'ugly' but real details (mothballs, burnt toast) to create authentic texture.",
        strategyUsed: "Raw Texture",
        voiceTypes: ["Nostalgic", "Sensory", "Authentic"],
        symptomTags: ["abstract_language", "telling_not_showing"]
    }
];

export function getExamplesForCategory(category: string, count: number = 2, targetVoice?: string, targetSymptom?: string): SurgicalExample[] {
    // 1. Filter by category
    let candidates = SURGICAL_EXAMPLES.filter(e => e.rubricCategory === category);
    
    // 2. Score matches based on Voice AND Symptom
    if (candidates.length > 0) {
        const normalizedVoice = targetVoice ? targetVoice.toLowerCase() : "";
        
        candidates.sort((a, b) => {
            // Score Voice
            let scoreA = targetVoice ? calculateVoiceMatch(a.voiceTypes, normalizedVoice) : 0;
            let scoreB = targetVoice ? calculateVoiceMatch(b.voiceTypes, normalizedVoice) : 0;

            // Score Symptom (Weight higher than voice for problem-relevance)
            if (targetSymptom) {
                if (a.symptomTags?.includes(targetSymptom)) scoreA += 5;
                if (b.symptomTags?.includes(targetSymptom)) scoreB += 5;
            }

            return scoreB - scoreA; // Descending
        });
    }

    // 3. If not enough, fallback to 'show_dont_tell_craft' (universally useful)
    if (candidates.length < count) {
        const fallbacks = SURGICAL_EXAMPLES.filter(e => 
            e.rubricCategory === 'show_dont_tell_craft' && 
            !candidates.includes(e)
        );
        
        // Also sort fallbacks
        if (targetVoice || targetSymptom) {
             const normalizedVoice = targetVoice ? targetVoice.toLowerCase() : "";
             fallbacks.sort((a, b) => {
                let scoreA = targetVoice ? calculateVoiceMatch(a.voiceTypes, normalizedVoice) : 0;
                let scoreB = targetVoice ? calculateVoiceMatch(b.voiceTypes, normalizedVoice) : 0;
                
                if (targetSymptom) {
                    if (a.symptomTags?.includes(targetSymptom)) scoreA += 5;
                    if (b.symptomTags?.includes(targetSymptom)) scoreB += 5;
                }
                return scoreB - scoreA;
            });
        }
        
        candidates = [...candidates, ...fallbacks];
    }

    // 4. Return slice
    return candidates.slice(0, count);
}

function calculateVoiceMatch(tags: string[], targetVoice: string): number {
    let score = 0;
    for (const tag of tags) {
        if (targetVoice.includes(tag.toLowerCase())) {
            score += 2; // Strong match
        }
        // Partial match logic could go here
    }
    return score;
}
