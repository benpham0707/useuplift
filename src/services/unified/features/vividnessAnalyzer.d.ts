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
export interface VividnessAnalysis {
    overall_vividness_score: number;
    tier: 'world_class' | 'strong' | 'adequate' | 'weak' | 'resume_style';
    senses: {
        visual: SenseAnalysis;
        auditory: SenseAnalysis;
        tactile: SenseAnalysis;
        olfactory: SenseAnalysis;
        gustatory: SenseAnalysis;
        total_senses_engaged: number;
    };
    temporal: {
        has_temporal_anchor: boolean;
        precision_level: 'exact' | 'specific' | 'vague' | 'none';
        examples: string[];
        score: number;
    };
    spatial: {
        has_spatial_anchor: boolean;
        precision_level: 'precise' | 'specific' | 'generic' | 'none';
        examples: string[];
        score: number;
    };
    dialogue: {
        has_dialogue: boolean;
        dialogue_count: number;
        quality: 'reveals_character' | 'conversational' | 'info_dump' | 'formal' | 'none';
        examples: string[];
        score: number;
    };
    inner_monologue: {
        has_inner_monologue: boolean;
        shows_thinking: boolean;
        examples: string[];
        score: number;
    };
    action_specificity: {
        specific_verbs: string[];
        generic_verbs: string[];
        strong_verb_ratio: number;
        score: number;
    };
    scenes: {
        has_concrete_scene: boolean;
        scene_count: number;
        best_scene_quality: number;
    };
    best_vivid_moments: string[];
    weakest_moments: string[];
    strengths: string[];
    weaknesses: string[];
    upgrade_to_10: {
        missing_elements: string[];
        how_to_add: string;
        example_transformation: {
            current_tell: string;
            world_class_show: string;
            elements_added: string[];
        };
    };
    harvard_pattern_match: boolean;
    ao_assessment: string;
}
interface SenseAnalysis {
    present: boolean;
    count: number;
    examples: string[];
    quality: 'vivid' | 'adequate' | 'weak';
}
export declare function analyzeVividness(text: string): VividnessAnalysis;
export type { VividnessAnalysis, SenseAnalysis };
//# sourceMappingURL=vividnessAnalyzer.d.ts.map