/**
 * "Why Us" Supplemental Profile
 *
 * Research-intensive, program-specific, authentic enthusiasm.
 * Must demonstrate genuine fit between student and school through
 * specific programs, professors, courses, and opportunities.
 *
 * Weight philosophy: Argument and authenticity are king — the essay
 * must make a persuasive case for fit with real evidence. Lower
 * narrative and emotional dimensions. Intellectual vitality matters
 * because curious students research deeply.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'why_us',
  displayName: '"Why Us" Supplemental',

  dimensionWeightOverrides: {
    argument_rhetorical_craft: 0.12,         // +5% — must persuade fit
    authenticity_specificity_detail: 0.11,   // +3% — generic = rejection
    intellectual_vitality_curiosity: 0.11,   // +2% — deep research signals
    narrative_craft_storytelling: 0.04,       // -4% — not story-driven
    emotional_resonance_vulnerability: 0.05, // -3% — enthusiasm > emotion
    growth_transformation_arc: 0.05,         // -3% — forward-looking, not past growth
    closing_impact_resolution: 0.05,         // -1% — less emphasis on arc resolution
    opening_hook_engagement: 0.05,           // -1% — hook less critical here
    word_economy_craft: 0.08,                // +1% — usually short form
    // Others keep defaults: originality 0.10, structural 0.08,
    // thematic 0.09, tonal 0.06
  },

  preferredCommands: [
    'scan_audience_awareness',
    'add_evidence',
    'sharpen_claim',
    'thread_metaphor',
    'make_concrete',
    'cut_filler',
    'deepen_analysis',
    'improve_transition',
    'connect_to_theme',
    'compress',
  ],

  macroStrategies: [
    {
      id: 'why_us_overhaul',
      name: '"Why Us" Overhaul',
      commands: ['scan_audience_awareness', 'add_evidence', 'sharpen_claim', 'thread_metaphor'],
      description: 'Full overhaul: evaluate audience fit, add school-specific evidence, sharpen thesis, weave thematic cohesion.',
      bestFor: ['why_us'],
    },
    {
      id: 'ao_ready_polish',
      name: 'AO-Ready Polish',
      commands: ['scan_audience_awareness', 'sharpen_claim', 'add_evidence', 'cut_filler'],
      description: 'Polish for AO readability: audience awareness, sharp claims, concrete evidence, no filler.',
      bestFor: ['why_us'],
    },
    {
      id: 'strengthen_argument',
      name: 'Strengthen Argument',
      commands: ['sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'connect_to_theme'],
      description: 'Build a more persuasive case for fit through structured argumentation.',
      bestFor: ['why_us'],
    },
  ],

  antiPatterns: [
    'Generic praise that could apply to any school ("prestigious", "diverse community")',
    'Only citing information from the school\'s homepage',
    'Not mentioning specific programs, professors, research labs, or courses',
    'The "reverse brochure" — restating what the school already knows about itself',
    'Focusing on rankings or reputation instead of personal fit',
    '"I\'ve always dreamed of attending..." without substance',
    'Listing school features without connecting them to your goals',
    'Missing the "why YOU at THIS school" — the intersection matters',
  ],

  teachingTone: {
    formality: 'balanced',
    encouragement: 'moderate',
    directness: 'direct',
  },
};

essayProfileRegistry.register(profile);
