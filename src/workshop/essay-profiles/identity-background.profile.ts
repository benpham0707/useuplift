/**
 * Identity/Background Essay Profile
 *
 * Balanced narrative + reflection. Explores who you are through
 * the lens of identity, culture, family, or lived experience.
 * Requires emotional honesty without being performative.
 *
 * Weight philosophy: Emotional resonance and originality are
 * paramount — this is deeply personal territory. Growth arc
 * matters because AOs want to see self-awareness. Tonal
 * sophistication elevated because navigating identity requires
 * nuanced emotional register.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'identity_background',
  displayName: 'Identity/Background Essay',

  dimensionWeightOverrides: {
    emotional_resonance_vulnerability: 0.10, // +2% — emotional honesty is central
    originality_voice_authenticity: 0.11,    // +1% — your unique perspective
    growth_transformation_arc: 0.10,         // +2% — self-awareness through identity
    tonal_sophistication: 0.08,              // +2% — nuanced emotional register
    narrative_craft_storytelling: 0.09,       // +1% — scene-driven identity moments
    argument_rhetorical_craft: 0.04,         // -3% — not argument-driven
    intellectual_vitality_curiosity: 0.07,   // -2% — nice but not primary
    word_economy_craft: 0.06,                // -1% — room for depth over brevity
    opening_hook_engagement: 0.05,           // -1% — substance over hook
    // Others keep defaults: structural 0.08, thematic 0.09,
    // closing 0.06, authenticity 0.08
  },

  preferredCommands: [
    'show_dont_tell',
    'deepen_vulnerability',
    'expand_moment',
    'shift_tone',
    'connect_to_theme',
    'strengthen_voice',
    'add_dialogue',
    'clarify_learning',
    'sharpen_ending',
    'improve_rhythm',
  ],

  macroStrategies: [
    {
      id: 'deepen_scene',
      name: 'Deepen Scene',
      commands: ['show_dont_tell', 'expand_moment', 'deepen_vulnerability', 'add_dialogue'],
      description: 'Bring identity moments to life through sensory detail, expanded scenes, and dialogue.',
      bestFor: ['identity_background'],
    },
    {
      id: 'emotional_arc_repair',
      name: 'Emotional Arc Repair',
      commands: ['map_emotional_arc', 'shift_tone', 'deepen_vulnerability', 'sharpen_ending'],
      description: 'Fix emotional flat spots, navigate tonal shifts, and strengthen the resolution.',
      bestFor: ['identity_background'],
    },
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['sharpen_diction', 'improve_rhythm', 'cut_filler', 'improve_transition'],
      description: 'Final polish to ensure the prose matches the emotional depth of the content.',
      bestFor: ['identity_background'],
    },
  ],

  antiPatterns: [
    'Trauma narrative without growth or self-awareness',
    'Defining yourself entirely by a single trait or experience',
    'Performative vulnerability — sharing to shock rather than illuminate',
    'Stereotypical cultural narratives without personal specificity',
    'Listing identity markers without exploring what they mean to you',
    'Using identity as a qualification rather than a lens for self-understanding',
    'Ending with generic "I am the sum of my experiences" conclusions',
    'Appropriating struggle — inflating hardship for sympathy',
  ],

  teachingTone: {
    formality: 'casual',
    encouragement: 'high',
    directness: 'gentle',
  },
};

essayProfileRegistry.register(profile);
