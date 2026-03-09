/**
 * Inline Editing Commands — targeted text transformations
 * Phase 2 implementation
 */

import type { StudentVoiceProfile } from '../voiceProfile/types';
import type { QuickVoiceCheckResult } from '../voiceProfile/styleConsistencyService';

/** Well-known editing commands (hardcoded in commandPrompts.ts) */
export type BuiltInEditingCommand =
  | 'make_concrete'        // Replace vague language with specific details
  | 'show_dont_tell'       // Convert telling to showing (scene, dialogue, sensory)
  | 'clarify_learning'     // Deepen reflection/insight
  | 'add_stakes'           // Raise the stakes — what's at risk?
  | 'strengthen_voice'     // Make it sound more like THEM
  | 'cut_filler'           // Remove unnecessary words
  | 'add_evidence'         // Add specific metrics/results/proof
  | 'deepen_vulnerability' // Move past surface-level emotion
  | 'connect_to_theme'     // Link this passage to the essay's main theme
  | 'fix_hook'             // Strengthen an opening
  | 'sharpen_ending'       // Strengthen a conclusion
  | 'expand_moment'        // Slow down and expand a key moment
  | 'compress'             // Say the same thing in fewer words
  | 'add_dialogue'         // Convert summary to scene with dialogue
  | 'remove_cliche';       // Replace clichéd language

/**
 * Any editing command — built-in (hardcoded) or from the command registry.
 * The `(string & {})` trick preserves autocomplete for known commands
 * while allowing any registry command ID at runtime.
 */
export type EditingCommand = BuiltInEditingCommand | (string & {});

/** Request to apply an inline editing command */
export interface InlineEditRequest {
  /** The selected text to edit */
  selectedText: string;
  /** Full document for context */
  fullDocument: string;
  /** Position in document */
  selectionStart: number;
  selectionEnd: number;
  /** The command to apply */
  command: EditingCommand;
  /** Student's voice profile (for voice preservation) */
  voiceProfile?: StudentVoiceProfile;
  /** Essay type context */
  essayType?: string;
  /** Additional context */
  additionalContext?: string;
  /** Session ID for document context injection (Phase 2) */
  sessionId?: string;
  /** RAG-sourced example fragments to inject into the system prompt */
  ragContext?: string;
  /** Target college ID for admissions-specific context */
  collegeId?: string;
}

/** Result from applying an inline editing command */
export interface InlineEditResult {
  /** Primary suggestion (safe, incremental) */
  primary: {
    text: string;
    explanation: string;
  };
  /** Creative alternative (bolder) */
  creative: {
    text: string;
    explanation: string;
  };
  /** What changed and why */
  teachingNote: string;
  /** Transferable principle */
  principle: string;
  /** Token cost */
  cost: number;
  /** Post-generation heuristic voice consistency checks (present when voiceProfile provided) */
  voiceConsistency?: {
    primary: QuickVoiceCheckResult;
    creative: QuickVoiceCheckResult;
  };
}
