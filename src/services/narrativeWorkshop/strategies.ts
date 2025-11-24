/**
 * Narrative Strategy Library
 * 
 * A collection of distinct narrative techniques used to inject diversity 
 * into the Surgical Editor's output.
 * 
 * Purpose: Prevent "mode collapse" where the AI always suggests the same type of fix.
 */

export type NarrativeStrategyType = 
  | 'sensory_anchor' 
  | 'in_media_res' 
  | 'internal_monologue' 
  | 'dialogue_hook' 
  | 'contrast_frame' 
  | 'object_symbolism' 
  | 'action_beat' 
  | 'rhetorical_pivot' 
  | 'micro_stakes'
  | 'retroactive_realization'
  | 'the_zoom_out'
  | 'the_hypothetical'
  | 'the_definition';

export interface NarrativeStrategy {
  id: NarrativeStrategyType;
  name: string;
  instruction: string;
  example_concept: string;
  rubric_affinity: string[]; // Which rubric categories this strategy serves best
}

export const NARRATIVE_STRATEGIES: NarrativeStrategy[] = [
  {
    id: 'sensory_anchor',
    name: 'Sensory Anchor',
    instruction: "Start with a vivid, physical detail (smell, sound, texture) that grounds the abstract concept.",
    example_concept: "Instead of 'I was nervous,' say 'The smell of whiteboard markers made my stomach turn.'",
    rubric_affinity: ['show_dont_tell_craft', 'opening_power_scene_entry', 'dialogue_action_texture']
  },
  {
    id: 'in_media_res',
    name: 'In Media Res',
    instruction: "Drop the reader directly into the middle of the action or conflict, bypassing the setup.",
    example_concept: "Start with the moment the server crashed, not the coding that led up to it.",
    rubric_affinity: ['opening_power_scene_entry', 'narrative_arc_stakes_turn', 'structure_pacing_coherence']
  },
  {
    id: 'internal_monologue',
    name: 'Internal Monologue',
    instruction: "Reveal the specific thought or doubt running through your head at that exact second.",
    example_concept: "Show the specific question you asked yourself, not just 'I wondered'.",
    rubric_affinity: ['character_interiority_vulnerability', 'reflection_meaning_making', 'ethical_awareness_humility']
  },
  {
    id: 'dialogue_hook',
    name: 'Dialogue Hook',
    instruction: "Use a snippet of spoken dialogue (yours or someone else's) to launch the idea.",
    example_concept: "'You're doing it wrong'—three words that changed my approach.",
    rubric_affinity: ['dialogue_action_texture', 'show_dont_tell_craft', 'opening_power_scene_entry']
  },
  {
    id: 'contrast_frame',
    name: 'Contrast Frame',
    instruction: "Juxtapose two opposing ideas or realities to create immediate tension.",
    example_concept: "The plan was perfect on paper, but the room was on fire.",
    rubric_affinity: ['narrative_arc_stakes_turn', 'intellectual_vitality_curiosity', 'structure_pacing_coherence']
  },
  {
    id: 'object_symbolism',
    name: 'Object Symbolism',
    instruction: "Focus on a specific physical object that represents the larger conflict or theme.",
    example_concept: "The broken violin string represented my snapped patience.",
    rubric_affinity: ['originality_specificity_voice', 'show_dont_tell_craft', 'reflection_meaning_making']
  },
  {
    id: 'action_beat',
    name: 'Action Beat',
    instruction: "Describe a specific physical movement or action that reveals emotion.",
    example_concept: "I didn't just say no; I slammed the laptop shut.",
    rubric_affinity: ['show_dont_tell_craft', 'dialogue_action_texture', 'character_interiority_vulnerability']
  },
  {
    id: 'rhetorical_pivot',
    name: 'Rhetorical Pivot',
    instruction: "Use a question or statement that challenges a common assumption.",
    example_concept: "Why do we assume leadership means loud voices?",
    rubric_affinity: ['intellectual_vitality_curiosity', 'originality_specificity_voice', 'opening_power_scene_entry']
  },
  {
    id: 'micro_stakes',
    name: 'Micro Stakes',
    instruction: "Zoom in on a tiny, immediate consequence to illustrate the larger risk.",
    example_concept: "If I dropped this beaker, three weeks of data—and my grade—would vanish.",
    rubric_affinity: ['narrative_arc_stakes_turn', 'context_constraints_disclosure', 'character_interiority_vulnerability']
  },
  {
    id: 'retroactive_realization',
    name: 'Retroactive Realization',
    instruction: "Describe a past action with the insight you have now (but didn't have then).",
    example_concept: "I thought I was helping, but I was actually just taking over.",
    rubric_affinity: ['reflection_meaning_making', 'ethical_awareness_humility', 'personal_growth_trajectory']
  },
  {
    id: 'the_zoom_out',
    name: 'The Zoom Out',
    instruction: "Connect this small, specific moment to a broader historical, social, or scientific context.",
    example_concept: "My burnt cookies weren't just a failure; they were a lesson in thermodynamics.",
    rubric_affinity: ['intellectual_vitality_curiosity', 'context_constraints_disclosure', 'reflection_meaning_making']
  },
  {
    id: 'the_hypothetical',
    name: 'The Hypothetical',
    instruction: "Briefly imagine a different path or outcome to highlight the significance of what actually happened.",
    example_concept: "If I had stayed silent, the team would have failed. Speaking up changed the trajectory.",
    rubric_affinity: ['narrative_arc_stakes_turn', 'character_interiority_vulnerability', 'leadership_growth']
  },
  {
    id: 'the_definition',
    name: 'The Definition',
    instruction: "Redefine a common word or concept based on your specific experience.",
    example_concept: "To me, 'silence' isn't empty; it's where the best ideas are born.",
    rubric_affinity: ['originality_specificity_voice', 'intellectual_vitality_curiosity', 'opening_power_scene_entry']
  }
];

/**
 * Selects 3 unique strategies, prioritizing those relevant to the rubric category.
 * 
 * Logic:
 * 1. Find all strategies that match the rubric category.
 * 2. Pick up to 2 from the matching set (to ensure relevance).
 * 3. Fill the rest from the non-matching set (to ensure diversity).
 * 4. Shuffle final result.
 */
export function getStrategiesForCategory(category: string, count: number = 3): NarrativeStrategy[] {
  const matching = NARRATIVE_STRATEGIES.filter(s => s.rubric_affinity.includes(category));
  const others = NARRATIVE_STRATEGIES.filter(s => !s.rubric_affinity.includes(category));
  
  // Shuffle both lists
  const shuffle = (arr: NarrativeStrategy[]) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledMatching = shuffle(matching);
  const shuffledOthers = shuffle(others);

  // Pick 2 from matching (if available), fill rest with others
  // We typically want at least 1 or 2 "relevant" strategies, but definitely 1 "wildcard" to prevent tunnel vision.
  const selection: NarrativeStrategy[] = [];
  
  // Take up to 2 matching
  selection.push(...shuffledMatching.slice(0, 2));
  
  // Fill remainder
  const remainingNeeded = count - selection.length;
  selection.push(...shuffledOthers.slice(0, remainingNeeded));

  return shuffle(selection);
}
