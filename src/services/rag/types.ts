/**
 * RAG (Retrieval-Augmented Generation) Types
 * Phase 3 implementation — pgvector-powered example retrieval
 */

/** A retrieved essay fragment with similarity score */
export interface RAGResult {
  id: string;
  content: string;
  essayType?: string;
  promptType?: string;
  dimension?: string;
  qualityTier: 'excellent' | 'strong' | 'needs_work';
  college?: string;
  technique?: string;
  whyItWorks: string;
  transferablePrinciple: string;
  sourceInfo: string;
  similarityScore: number;
}

/** A before/after transformation pair */
export interface RAGTransformation {
  id: string;
  beforeText: string;
  afterText: string;
  dimension?: string;
  technique?: string;
  whyItWorks: string;
  principle: string;
  effectivenessScore: number;
  similarityScore: number;
}

/** Stored essay fragment with embedding */
export interface RAGEssayFragment {
  id: string;
  content: string;
  embedding?: number[];
  essayType?: string;
  promptType?: string;
  dimension?: string;
  qualityTier: 'excellent' | 'strong' | 'needs_work';
  college?: string;
  technique?: string;
  whyItWorks: string;
  transferablePrinciple: string;
  sourceInfo: string;
}
