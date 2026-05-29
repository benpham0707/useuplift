export type AnnotationPerspective = "ao" | "dean" | "counselor";

export type SourceCredibility = "S" | "A" | "B";

export interface SourceRecord {
  id: string;
  name: string;
  url: string;
  type: "school_publication" | "book" | "video" | "podcast" | "official_blog" | "magazine";
  author_role: "former_ao" | "current_ao" | "dean" | "school_admissions_office" | "counselor";
  author_name: string;
  school_affiliation?: string;
  credibility: SourceCredibility;
  ingested_at: string;
}

export interface AOCommentary {
  text: string;
  attributed_to: string;
  scope: "essay" | "paragraph" | "sentence";
  paragraph_index?: number;
  sentence_index?: number;
}

export interface EssayRecord {
  id: string;
  source_id: string;
  school_destination: string;
  year?: number;
  prompt?: string;
  essay_text: string;
  ao_commentary: AOCommentary[];
  annotation_perspective: AnnotationPerspective;
  archetype_hints: string[];
  outcome: "admitted" | "rejected" | "unknown";
  source_url: string;
}

export type HeuristicTag =
  | "opener"
  | "closer"
  | "voice"
  | "structure"
  | "authenticity"
  | "school_fit"
  | "ao_fatigue"
  | "ao_delight"
  | "ao_suspicion"
  | "howler"
  | "landing"
  | "cliche"
  | "anti_pattern";

export interface HeuristicRecord {
  id: string;
  source_id: string;
  applies_to: HeuristicTag[];
  pattern: string;
  judgment: string;
  school_specific?: string;
  confidence: number;
  quote: string;
  source_url: string;
  perspective: AnnotationPerspective;
}
