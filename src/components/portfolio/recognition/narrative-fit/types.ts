import { RecognitionItem } from '../RecognitionCard';

export interface DraftVersion {
  id: string;
  text: string;
  timestamp: number;
  appliedIssueId?: string;
}

export interface EditSuggestion {
  text: string;
  rationale: string;
  type: 'replace' | 'insert_before' | 'insert_after';
}

export interface WritingIssue {
  id: string;
  dimensionId: string;
  title: string;
  excerpt: string;
  analysis: string;
  impact: string;
  suggestions: EditSuggestion[];
  status: 'not_fixed' | 'in_progress' | 'fixed';
  currentSuggestionIndex: number;
  expanded: boolean;
}

export interface RubricDimension {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  status: 'critical' | 'needs_work' | 'good' | 'excellent';
  overview: string;
  weight: number;
  issues: WritingIssue[];
}

export interface WorkshopState {
  draftVersions: DraftVersion[];
  currentVersionIndex: number;
  dimensions: RubricDimension[];
  overallScore: number;
}

export interface NarrativeFitWorkshopProps {
  recognition: RecognitionItem;
}
