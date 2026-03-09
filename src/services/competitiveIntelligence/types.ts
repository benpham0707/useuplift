/**
 * Competitive Intelligence Types
 * Overused phrase detection and AO fatigue pattern analysis.
 */

export interface CompetitiveAnalysisInput {
  text: string;
  essayType?: string;
}

export interface CompetitiveAnalysis {
  /** Overused phrases found in the text */
  overusedPhrases: OverusedPhraseMatch[];
  /** Structural fatigue patterns detected */
  fatiguePatterns: FatiguePattern[];
  /** Positive signals that set this essay apart */
  distinctiveElements: DistinctiveElement[];
  /** Distinctiveness score (0-100, higher = more original) */
  distinctivenessScore: number;
  /** How many of the 200 known phrases were found */
  clicheCount: number;
  /** Executive summary */
  summary: string;
}

export interface DistinctiveElement {
  /** Type of distinctive element */
  type: 'specific_detail' | 'dialogue' | 'unusual_structure' | 'sensory_language' | 'unique_metaphor' | 'counter_narrative';
  /** Brief description of what was found */
  description: string;
  /** Approximate position in text */
  position: number;
}

export interface OverusedPhraseMatch {
  /** The phrase found */
  phrase: string;
  /** Where in the text (character position) */
  position: number;
  /** Category of the phrase */
  category: PhraseCategory;
  /** How overused it is (1-10, 10 = extremely common) */
  frequency: number;
  /** AO fatigue level */
  aoFatigueLevel: 'low' | 'medium' | 'high' | 'extreme';
  /** A better alternative */
  betterAlternative: string;
  /** Why AOs notice this */
  whyAOsNotice: string;
}

export type PhraseCategory =
  | 'opener'
  | 'closer'
  | 'transition'
  | 'emotion'
  | 'achievement'
  | 'vulnerability'
  | 'motivation'
  | 'reflection';

export interface FatiguePattern {
  /** Pattern name */
  name: string;
  /** Description of the structural pattern */
  description: string;
  /** Where in the text this pattern appears */
  position: number;
  /** Severity */
  severity: 'low' | 'medium' | 'high';
  /** Teaching note */
  suggestion: string;
}
