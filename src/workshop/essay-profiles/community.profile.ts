/**
 * Community Supplemental Profile
 *
 * Analytical + personal — specificity over generality. Must show
 * genuine connection to a community, specific contributions, and
 * what the student brings/takes from that community.
 *
 * Weight philosophy: Authenticity and specificity are critical —
 * generic "diversity" language is a red flag. Thematic depth
 * matters because AOs want to see genuine reflection on belonging
 * and contribution, not a surface-level summary.
 */

import { essayProfileRegistry } from '../registry/essayProfileRegistry';
import type { EssayProfileManifest } from '../shared/types';

const profile: EssayProfileManifest = {
  id: 'community',
  displayName: 'Community Supplemental',

  dimensionWeightOverrides: {
    authenticity_specificity_detail: 0.11,   // +3% — specificity is everything
    thematic_depth_reflection: 0.11,         // +2% — deep reflection on belonging
    argument_rhetorical_craft: 0.09,         // +2% — structured case for contribution
    narrative_craft_storytelling: 0.06,       // -2% — some narrative, not primary
    emotional_resonance_vulnerability: 0.07, // -1% — genuine but not overwrought
    opening_hook_engagement: 0.05,           // -1% — substance over hook
    closing_impact_resolution: 0.05,         // -1% — less arc emphasis
    growth_transformation_arc: 0.07,         // -1% — contribution > personal growth
    // Others keep defaults: intellectual 0.09, originality 0.10,
    // structural 0.08, word_economy 0.07, tonal 0.06
  },

  preferredCommands: [
    'add_evidence',
    'make_concrete',
    'deepen_analysis',
    'connect_to_theme',
    'sharpen_claim',
    'show_dont_tell',
    'cut_filler',
    'improve_transition',
    'strengthen_voice',
    'clarify_learning',
  ],

  macroStrategies: [
    {
      id: 'strengthen_argument',
      name: 'Strengthen Argument',
      commands: ['sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'connect_to_theme'],
      description: 'Build a persuasive case for your role in and impact on the community.',
      bestFor: ['community'],
    },
    {
      id: 'ao_ready_polish',
      name: 'AO-Ready Polish',
      commands: ['scan_audience_awareness', 'sharpen_claim', 'add_evidence', 'cut_filler'],
      description: 'Polish for AO readability with concrete community evidence.',
      bestFor: ['community'],
    },
    {
      id: 'polish_prose',
      name: 'Polish Prose',
      commands: ['sharpen_diction', 'improve_rhythm', 'cut_filler', 'improve_transition'],
      description: 'Final-pass prose polish for clarity and flow.',
      bestFor: ['community'],
    },
  ],

  antiPatterns: [
    'Vague community references ("my community has shaped me")',
    'Savior narrative — positioning yourself as rescuing a community',
    'Not explaining your specific personal connection to the community',
    'Generic diversity language without concrete examples',
    'Listing community service activities instead of reflecting on impact',
    'Defining community too broadly (e.g., "the human community")',
    'Focusing only on what you gave without what you received',
    'Surface-level description without exploring WHY this community matters to you',
  ],

  teachingTone: {
    formality: 'balanced',
    encouragement: 'high',
    directness: 'gentle',
  },
};

essayProfileRegistry.register(profile);
