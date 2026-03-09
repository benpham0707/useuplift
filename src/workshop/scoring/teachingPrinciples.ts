/**
 * Teaching Principles — Replaces EMOTION_PHYSICAL_MAP suggestion engine
 *
 * Instead of prescribing specific physical reactions ("sweating palms"),
 * these principles teach the writer HOW to improve, then ask them to
 * reach into their own experience. The LLM evaluates context; the
 * heuristic only references the principle name.
 */

import type { TeachingPrinciple } from './narrativeAnalyzerTypes';

export const TEACHING_PRINCIPLES: Record<string, TeachingPrinciple> = {
  embodiment: {
    name: 'embodiment',
    concept: 'Ground emotions in YOUR body, in THAT moment — not generic physical reactions.',
    questionToWriter: 'What did this feel like in your body, in that specific moment?',
  },
  specificity_as_meaning: {
    name: 'specificity_as_meaning',
    concept: 'Every detail should reveal something about you that no one else could write.',
    questionToWriter: 'What does this detail say about you that no one else could write?',
  },
  earned_abstraction: {
    name: 'earned_abstraction',
    concept: 'Abstract insight is only powerful after concrete scenes have earned the reader\'s trust.',
    questionToWriter: 'Has this been demonstrated in a scene, or does it feel disconnected?',
  },
  purposeful_pacing: {
    name: 'purposeful_pacing',
    concept: 'Slow down for moments that matter, speed through transitions.',
    questionToWriter: 'Is time proportional to importance here?',
  },
  functional_tension: {
    name: 'functional_tension',
    concept: 'Tension builds when the reader cares about what happens next.',
    questionToWriter: 'What is at stake? What is the reader waiting for?',
  },
  authentic_voice: {
    name: 'authentic_voice',
    concept: 'Voice comes from how you see the world, not vocabulary.',
    questionToWriter: 'Does this sound like you, or could anyone have written it?',
  },
};

/**
 * Get a teaching principle by name.
 * Returns the principle or a generic fallback.
 */
export function getPrinciple(name: string): TeachingPrinciple {
  return TEACHING_PRINCIPLES[name] ?? {
    name: 'embodiment',
    concept: 'Ground emotions in YOUR body, in THAT moment.',
    questionToWriter: 'What did this feel like in your body?',
  };
}

/**
 * Select the best teaching principle for a told emotion.
 * Maps emotion types to the most relevant principle.
 */
export function selectPrincipleForEmotion(emotionWord: string): TeachingPrinciple {
  const lower = emotionWord.toLowerCase();

  // Physical/visceral emotions → embodiment
  const bodyEmotions = new Set([
    'nervous', 'anxious', 'scared', 'terrified', 'angry', 'frustrated',
    'overwhelmed', 'panicked', 'excited', 'thrilled',
  ]);
  if (bodyEmotions.has(lower)) return TEACHING_PRINCIPLES.embodiment;

  // Reflective/abstract emotions → earned_abstraction
  const abstractEmotions = new Set([
    'realized', 'understood', 'learned', 'grateful', 'proud', 'hopeful',
  ]);
  if (abstractEmotions.has(lower)) return TEACHING_PRINCIPLES.earned_abstraction;

  // Emotions about connection/vulnerability → specificity_as_meaning
  const connectionEmotions = new Set([
    'lonely', 'sad', 'heartbroken', 'devastated', 'ashamed', 'embarrassed',
    'vulnerable', 'guilty',
  ]);
  if (connectionEmotions.has(lower)) return TEACHING_PRINCIPLES.specificity_as_meaning;

  // Default: embodiment is the most universally applicable
  return TEACHING_PRINCIPLES.embodiment;
}
