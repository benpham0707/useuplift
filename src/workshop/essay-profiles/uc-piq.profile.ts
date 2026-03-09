/**
 * UC Personal Insight Question (PIQ) Profile
 *
 * Concise and insight-dense — 350-word hard limit means every
 * sentence must earn its place. Less about storytelling, more
 * about clarity of thought, self-awareness, and originality.
 *
 * Weight philosophy: Boost word economy heavily (every word
 * matters at 350). Boost originality and thematic depth.
 * Lower narrative craft — PIQs rarely need full scenes.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'uc_piq',
  displayName: 'UC Personal Insight Question',

  dimensionWeightOverrides: {
    word_economy_craft: 0.12,                // +5% — 350 words, every one counts
    originality_voice_authenticity: 0.11,    // +1% — must differentiate
    thematic_depth_reflection: 0.10,         // +1% — insight over narrative
    narrative_craft_storytelling: 0.04,       // -4% — not scene-driven
    opening_hook_engagement: 0.04,           // -2% — less opening fanfare at 350 words
    emotional_resonance_vulnerability: 0.07, // -1% — insight > emotion here
    closing_impact_resolution: 0.07,         // +1% — strong finish in short form
    growth_transformation_arc: 0.09,         // +1% — show what you gained
    // Others keep defaults: intellectual 0.09, structural 0.08,
    // authenticity 0.08, tonal 0.06, argument 0.07
  },

  preferredCommands: [
    'cut_filler',
    'compress',
    'clarify_learning',
    'sharpen_diction',
    'strengthen_voice',
    'make_concrete',
    'connect_to_theme',
    'sharpen_ending',
    'remove_cliche',
    'improve_rhythm',
  ],

  macroStrategies: [
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['cut_filler', 'compress', 'sharpen_diction', 'improve_rhythm'],
      description: 'Maximize every word in the 350-word constraint. Cut bloat, sharpen diction, vary rhythm.',
      bestFor: ['uc_piq'],
    },
    {
      id: 'emotional_arc_repair',
      name: 'Emotional Arc Repair',
      commands: ['map_emotional_arc', 'shift_tone', 'clarify_learning', 'sharpen_ending'],
      description: 'Ensure emotional trajectory lands in compact form — fix flat spots, deepen insight.',
      bestFor: ['uc_piq'],
    },
  ],

  antiPatterns: [
    'Exceeding 350 words (UC has a hard word limit)',
    'Burying the insight in the last sentence',
    'Spending 200+ words on setup before getting to the point',
    'Generic reflections that could apply to anyone',
    'Listing activities or achievements instead of reflecting',
    'Repeating information already in the UC application',
    'Using flowery language that wastes precious word count',
    'Trying to cram a full narrative arc into 350 words',
  ],

  teachingTone: {
    formality: 'balanced',
    encouragement: 'moderate',
    directness: 'direct',
  },
};

essayProfileRegistry.register(profile);
