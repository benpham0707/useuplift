/**
 * Activity-to-Essay Profile
 *
 * Impact-focused, outcome-driven, brief. Transforms an activity
 * description into a compelling essay about what you DID, the
 * IMPACT you had, and what it reveals about WHO YOU ARE.
 *
 * Weight philosophy: Authenticity and word economy are critical —
 * short form demands precision. Argument/rhetoric matters because
 * the essay must make a case for significance. Lower narrative
 * and emotional dimensions — this isn't a personal story.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'activity_to_essay',
  displayName: 'Activity Essay',

  dimensionWeightOverrides: {
    authenticity_specificity_detail: 0.12,   // +4% — concrete outcomes or bust
    word_economy_craft: 0.10,                // +3% — usually very short form
    argument_rhetorical_craft: 0.10,         // +3% — must argue significance
    narrative_craft_storytelling: 0.04,       // -4% — not narrative-driven
    emotional_resonance_vulnerability: 0.04, // -4% — impact > feelings
    growth_transformation_arc: 0.06,         // -2% — outcome-focused
    opening_hook_engagement: 0.05,           // -1% — substance over hook
    closing_impact_resolution: 0.05,         // -1% — less arc resolution
    tonal_sophistication: 0.05,              // -1% — straightforward tone
    // Others keep defaults: intellectual 0.09, originality 0.10,
    // structural 0.08, thematic 0.09
  },

  preferredCommands: [
    'add_evidence',
    'cut_filler',
    'sharpen_claim',
    'make_concrete',
    'compress',
    'deepen_analysis',
    'sharpen_diction',
    'connect_to_theme',
    'scan_audience_awareness',
    'improve_transition',
  ],

  macroStrategies: [
    {
      id: 'ao_ready_polish',
      name: 'AO-Ready Polish',
      commands: ['scan_audience_awareness', 'sharpen_claim', 'add_evidence', 'cut_filler'],
      description: 'Optimize for AO readability: clear impact claims, concrete evidence, no wasted words.',
      bestFor: ['activity_to_essay'],
    },
    {
      id: 'strengthen_argument',
      name: 'Strengthen Argument',
      commands: ['sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'connect_to_theme'],
      description: 'Build the case for why this activity matters and what it reveals about you.',
      bestFor: ['activity_to_essay'],
    },
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['sharpen_diction', 'cut_filler', 'compress', 'improve_rhythm'],
      description: 'Tighten every sentence — maximum impact per word.',
      bestFor: ['activity_to_essay'],
    },
  ],

  antiPatterns: [
    'Listing responsibilities without showing impact ("I was president of...")',
    'Tech name-dropping without explaining the problem solved (e.g., "used Python and pandas")',
    'Vague leadership claims without specific outcomes or scale',
    'No quantifiable results — missing numbers, percentages, or concrete metrics',
    'Restating what\'s already in the activity section of the application',
    'Focusing on what you learned rather than what you accomplished',
    'Generic team-player language without specific contribution',
    'Describing the activity instead of your unique role and impact',
  ],

  teachingTone: {
    formality: 'balanced',
    encouragement: 'moderate',
    directness: 'direct',
  },
};

essayProfileRegistry.register(profile);
