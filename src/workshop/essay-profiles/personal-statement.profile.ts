/**
 * Personal Statement Profile (Common App)
 *
 * Narrative-heavy, emotional arc focus, longer form (~650 words).
 * The core college essay — a deeply personal story that reveals
 * character, growth, and self-awareness through vivid storytelling.
 *
 * Weight philosophy: Boost narrative craft, emotional depth, and
 * growth arc. Originality/voice gets highest weight because AOs
 * read thousands — standing out matters most.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'personal_statement',
  displayName: 'Personal Statement (Common App)',

  dimensionWeightOverrides: {
    narrative_craft_storytelling: 0.10,     // +2% — storytelling is central
    emotional_resonance_vulnerability: 0.10, // +2% — emotional depth matters
    originality_voice_authenticity: 0.11,    // +1% — must stand out
    growth_transformation_arc: 0.10,         // +2% — AOs want growth evidence
    closing_impact_resolution: 0.07,         // +1% — ending must land
    argument_rhetorical_craft: 0.04,         // -3% — not argument-driven
    word_economy_craft: 0.06,                // -1% — longer form, less pressure
    intellectual_vitality_curiosity: 0.07,   // -2% — nice but not primary
    // Others keep defaults: structural 0.08, thematic 0.09, opening 0.06,
    // authenticity 0.08, tonal 0.06
  },

  preferredCommands: [
    'show_dont_tell',
    'deepen_vulnerability',
    'expand_moment',
    'connect_to_theme',
    'sharpen_ending',
    'add_dialogue',
    'shift_tone',
    'strengthen_voice',
    'fix_hook',
    'improve_rhythm',
  ],

  macroStrategies: [
    {
      id: 'deepen_scene',
      name: 'Deepen Scene',
      commands: ['show_dont_tell', 'expand_moment', 'deepen_vulnerability', 'add_dialogue'],
      description: 'Transform telling into showing with sensory detail, emotional depth, and expanded key moments.',
      bestFor: ['personal_statement', 'identity_background', 'challenge_adversity'],
    },
    {
      id: 'emotional_arc_repair',
      name: 'Emotional Arc Repair',
      commands: ['map_emotional_arc', 'shift_tone', 'deepen_vulnerability', 'sharpen_ending'],
      description: 'Map the emotional trajectory, fix flat spots, deepen vulnerability, and strengthen the closing.',
      bestFor: ['personal_statement', 'uc_piq', 'challenge_adversity', 'identity_background'],
    },
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['sharpen_diction', 'improve_rhythm', 'cut_filler', 'improve_transition'],
      description: 'Final-pass polish: tighten word choice, vary cadence, remove bloat, smooth transitions.',
      bestFor: ['personal_statement'],
    },
  ],

  antiPatterns: [
    'Opening with a famous quote or dictionary definition',
    'Ending with "This experience taught me..." or "I learned that..."',
    'Listing achievements instead of telling a story',
    'Telling emotions instead of showing them through scene and action',
    'Summarizing years of experience rather than zooming into one moment',
    'Using the essay to restate the resume or activity list',
    'Forced epiphany that feels unearned by the narrative',
    'Starting too far back in time — "Ever since I was a child..."',
  ],

  teachingTone: {
    formality: 'balanced',
    encouragement: 'high',
    directness: 'gentle',
  },
};

essayProfileRegistry.register(profile);
