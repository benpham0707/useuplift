import { RecognitionItem } from '../RecognitionCard';

export type IssueStatus = 'not_fixed' | 'in_progress' | 'fixed';

export type IssueCategory = 
  | 'selectivity' 
  | 'theme' 
  | 'causality' 
  | 'reflection' 
  | 'buzzwords' 
  | 'agency' 
  | 'numbers' 
  | 'length';

export interface EditSuggestion {
  text: string;
  rationale: string;
}

export interface WritingIssue {
  id: string;
  category: IssueCategory;
  title: string;
  excerpt: string;
  explanation: string;
  whyItMatters: string;
  suggestions: EditSuggestion[];
  status: IssueStatus;
  currentSuggestionIndex: number;
  expanded: boolean;
}

export interface NarrativeFitWorkshopProps {
  recognition: RecognitionItem;
}
