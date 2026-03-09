/**
 * Analytical Essay Profile
 *
 * Argument-first, evidence-driven, logical flow. For essays that
 * require making a structured case — academic interest essays,
 * intellectual vitality prompts, research-focused supplementals.
 *
 * Weight philosophy: Argument and intellectual vitality dominate.
 * Structural coherence elevated because logical flow is critical.
 * Narrative and emotional dimensions significantly reduced — this
 * is about thinking, not feeling.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'analytical',
  displayName: 'Analytical Essay',

  dimensionWeightOverrides: {
    argument_rhetorical_craft: 0.13,         // +6% — the core competency
    intellectual_vitality_curiosity: 0.12,   // +3% — thinking depth matters
    structural_coherence_flow: 0.10,         // +2% — logical flow is critical
    thematic_depth_reflection: 0.10,         // +1% — depth of analysis
    narrative_craft_storytelling: 0.03,       // -5% — minimal narrative
    emotional_resonance_vulnerability: 0.04, // -4% — logic > emotion
    growth_transformation_arc: 0.05,         // -3% — insight > personal growth
    tonal_sophistication: 0.05,              // -1% — consistent analytical tone
    opening_hook_engagement: 0.05,           // -1% — thesis > hook
    closing_impact_resolution: 0.05,         // -1% — synthesis > emotional resolution
    // Others keep defaults: originality 0.10, word_economy 0.07,
    // authenticity 0.08
  },

  preferredCommands: [
    'sharpen_claim',
    'add_counterpoint',
    'deepen_analysis',
    'add_evidence',
    'improve_transition',
    'make_concrete',
    'cut_filler',
    'sharpen_diction',
    'connect_to_theme',
    'scan_audience_awareness',
  ],

  macroStrategies: [
    {
      id: 'strengthen_argument',
      name: 'Strengthen Argument',
      commands: ['sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'connect_to_theme'],
      description: 'Build a rigorous argument: sharpen thesis, add nuance, deepen the "so what?".',
      bestFor: ['analytical'],
    },
    {
      id: 'ao_ready_polish',
      name: 'AO-Ready Polish',
      commands: ['scan_audience_awareness', 'sharpen_claim', 'add_evidence', 'cut_filler'],
      description: 'Ensure the argument reads clearly and persuasively for admissions context.',
      bestFor: ['analytical'],
    },
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['sharpen_diction', 'improve_rhythm', 'cut_filler', 'improve_transition'],
      description: 'Tighten analytical prose for maximum clarity and flow.',
      bestFor: ['analytical'],
    },
  ],

  antiPatterns: [
    'Unsupported claims — assertions without evidence or reasoning',
    'Logical gaps — jumping from premise to conclusion without connecting steps',
    'Missing counterarguments — appearing one-dimensional or naive',
    'Weak thesis — vague or unfalsifiable central claim',
    'Evidence without analysis — presenting facts without interpreting them',
    'Overly academic tone that loses the personal connection',
    'Name-dropping theories or thinkers without demonstrating understanding',
    'Conclusion that merely restates the introduction',
  ],

  teachingTone: {
    formality: 'formal',
    encouragement: 'moderate',
    directness: 'direct',
  },
};

essayProfileRegistry.register(profile);
