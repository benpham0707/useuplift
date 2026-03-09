/**
 * Macro Strategies — Named command sequences for essay improvement
 *
 * Each strategy is an ordered sequence of commands designed for
 * a specific improvement goal and essay type.
 */

import type { MacroStrategy } from '../shared/types';

export const MACRO_STRATEGIES: MacroStrategy[] = [
  {
    id: 'strengthen_argument',
    name: 'Strengthen Argument',
    commands: ['sharpen_claim', 'add_counterpoint', 'deepen_analysis', 'connect_to_theme'],
    description: 'Sharpen the thesis, add nuance through counterpoints, then deepen the "so what?" analysis. Best for essays that need more intellectual rigor.',
    bestFor: ['why_us', 'community', 'analytical', 'intellectual_vitality'],
  },
  {
    id: 'deepen_scene',
    name: 'Deepen Scene',
    commands: ['show_dont_tell', 'add_sensory', 'deepen_vulnerability', 'expand_moment'],
    description: 'Transform telling into showing with sensory detail, emotional depth, and expanded key moments. Best for narratives that feel surface-level.',
    bestFor: ['personal_statement', 'challenge_adversity', 'identity_background'],
  },
  {
    id: 'polish_prose',
    name: 'Polish Prose',
    commands: ['sharpen_diction', 'improve_rhythm', 'cut_filler', 'improve_transition'],
    description: 'Tighten word choice, vary sentence cadence, remove bloat, and smooth transitions. Universal final-pass polish for any essay type.',
    bestFor: ['personal_statement', 'uc_piq', 'why_us', 'community', 'challenge_adversity', 'intellectual_vitality', 'activity_to_essay', 'identity_background', 'analytical', 'other'],
  },
  {
    id: 'emotional_arc_repair',
    name: 'Emotional Arc Repair',
    commands: ['map_emotional_arc', 'shift_tone', 'deepen_vulnerability', 'sharpen_ending'],
    description: 'Map the emotional trajectory, fix flat spots with tonal shifts, deepen vulnerability, and strengthen the closing. For essays with uneven emotional pacing.',
    bestFor: ['personal_statement', 'uc_piq', 'challenge_adversity', 'identity_background'],
  },
  {
    id: 'ao_ready_polish',
    name: 'AO-Ready Polish',
    commands: ['scan_audience_awareness', 'sharpen_claim', 'add_evidence', 'cut_filler'],
    description: 'Evaluate AO-readiness, sharpen the core claim, add supporting evidence, then tighten prose. For essays that need to be more reader-aware.',
    bestFor: ['why_us', 'community', 'activity_to_essay', 'analytical'],
  },
  {
    id: 'why_us_overhaul',
    name: '"Why Us" Overhaul',
    commands: ['scan_audience_awareness', 'add_evidence', 'sharpen_claim', 'thread_metaphor'],
    description: 'Full overhaul for "Why Us" essays: evaluate audience fit, add school-specific evidence, sharpen the thesis, weave thematic cohesion.',
    bestFor: ['why_us'],
  },
];

/**
 * Get a macro strategy by ID.
 */
export function getMacroStrategy(id: string): MacroStrategy | undefined {
  return MACRO_STRATEGIES.find(s => s.id === id);
}

/**
 * Get all macro strategies suitable for an essay type.
 */
export function getStrategiesForEssayType(essayType: string): MacroStrategy[] {
  return MACRO_STRATEGIES.filter(s => s.bestFor.includes(essayType as any));
}
