/**
 * Coaching-specific types for the block composition system.
 *
 * BlockContext drives prompt block selection — each block function receives
 * this context and returns mode-appropriate coaching prompt content.
 */

import type { CoachingMode, ImprovementPhaseLevel } from '../profileTypes';

// Re-export for convenience
export type { CoachingMode } from '../profileTypes';

/**
 * Context passed to every prompt block function for mode-aware composition.
 */
export interface BlockContext {
  /** Current coaching mode — determines which block variant is used */
  mode: CoachingMode;
  /** Current improvement phase of the essay */
  phase: ImprovementPhaseLevel;
  /** For iteration_deep: how many times the focused section has been revised */
  iterationRound?: number;
  /** For revision_response: significance of the edit (from EditUnderstanding) */
  editSignificance?: 'minor' | 'moderate' | 'significant' | 'transformative';
}
