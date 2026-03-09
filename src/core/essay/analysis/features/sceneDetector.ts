// @ts-nocheck - Legacy analysis file with type mismatches
/**
 * Scene Detector for Essay Analysis
 *
 * Detects concrete scenes in essays: time/place anchors, sensory details,
 * action sequences, and immersive moments that "put us there."
 *
 * A "scene" requires:
 * - Temporal/spatial anchor (when/where)
 * - Sensory detail (see/hear/feel/smell/taste)
 * - Action or movement (not just reflection)
 *
 * Quality Framework Alignment:
 * - Depth over speed: Comprehensive pattern matching
 * - Explainability: Returns evidence quotes for every detection
 * - Test-first: Designed with unit testing in mind
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SceneDetection {
  has_scene: boolean;
  scene_count: number;
  scenes: DetectedScene[];
  overall_scene_score: number; // 0-10
  evidence_summary: string;
}

export interface DetectedScene {
  type: 'full_scene' | 'partial_scene' | 'sensory_detail';
  location_in_essay: {
    paragraph_index: number;
    sentence_indices: number[];
  };
  evidence: {
    temporal_spatial_anchor?: string;
    sensory_details: string[];
    action_verbs: string[];
    dialogue?: string;
  };
  quality_score: number; // 0-10 for this scene
  excerpt: string; // The actual text of the scene
}

// ============================================================================
// PATTERNS
// ============================================================================

// Temporal markers (anchors in time)
const TEMPORAL_MARKERS = [
  // Specific times
  /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/,
  /\b(morning|afternoon|evening|night|midnight|dawn|dusk)\b/i,
  /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,

  // Relative time
  /\b(yesterday|today|tomorrow|last (week|month|year|night))\b/i,
  /\b(that (morning|afternoon|evening|night|day))\b/i,
  /\b(the (next|following|previous) (day|week|month|year))\b/i,

  // Temporal sequences
  /\b(first|then|next|after|before|finally|eventually)\b/i,
  /\b(when|while|as|during)\b/i,
];

// Spatial markers (anchors in place)
const SPATIAL_MARKERS = [
  // Specific locations
  /\b(in the|at the|on the|inside|outside|beneath|above|beside|behind)\s+\w+/i,
  /\b(room|kitchen|bedroom|office|hallway|street|park|school|library|hospital|home)\b/i,

  // Positioning
  /\b(left|right|front|back|top|bottom|corner|edge|center)\b/i,
  /\b(here|there|where)\b/i,
];

// Sensory detail patterns
const SENSORY_PATTERNS = {
  visual: [
    /\b(saw|looked|watched|noticed|observed|glimpsed|stared)\b/i,
    /\b(red|blue|green|yellow|orange|purple|black|white|gray|bright|dark|pale)\b/i,
    /\b(shiny|dull|glowing|gleaming|flickering|blinking)\b/i,
  ],
  auditory: [
    /\b(heard|listened|sound of|noise|voice|whisper|shout|scream|bang|crash|rustle)\b/i,
    /\b(loud|quiet|silent|deafening|murmur|echo|ring|buzz|hum)\b/i,
  ],
  tactile: [
    /\b(felt|touched|grabbed|held|pressed|squeezed|cold|warm|hot|rough|smooth|soft|hard)\b/i,
    /\b(texture|surface|grip|pressure)\b/i,
  ],
  olfactory: [
    /\b(smelled|scent|aroma|fragrance|stench|odor|perfume|smoke)\b/i,
  ],
  gustatory: [
    /\b(tasted|flavor|bitter|sweet|sour|salty|savory)\b/i,
  ],
};

// Action verbs (movement, physical action)
const ACTION_VERB_PATTERNS = [
  /\b(ran|walked|jumped|climbed|fell|stumbled|rushed|stepped|moved|turned|grabbed|threw|pushed|pulled|opened|closed)\b/i,
  /\b(sat|stood|knelt|leaned|reached|stretched|bent)\b/i,
];

// Dialogue markers
const DIALOGUE_PATTERNS = [
  /"[^"]+"/g, // Direct quotes
  /'[^']+'/g, // Single quotes
  /\bsaid\b|\basked\b|\breplied\b|\bwhispered\b|\bshouted\b|\bexplained\b/i,
];

// ============================================================================
// DETECTOR FUNCTIONS
// ============================================================================

/**
 * Main scene detection function
 */
export function detectScenes(essayText: string): SceneDetection {
  const paragraphs = splitIntoParagraphs(essayText);
  const scenes: DetectedScene[] = [];

  paragraphs.forEach((para, paraIndex) => {
    const sentences = splitIntoSentences(para);

    // Check for full scenes (temporal + spatial + sensory + action)
    const sceneData = analyzeForScene(para, paraIndex, sentences);

    if (sceneData) {
      scenes.push(sceneData);
    }
  });

  // Calculate overall score
  const overall_scene_score = calculateSceneScore(scenes);

  return {
    has_scene: scenes.length > 0,
    scene_count: scenes.length,
    scenes,
    overall_scene_score,
    evidence_summary: generateSceneSummary(scenes),
  };
}

/**
 * Analyze a paragraph for scene elements
 */
function analyzeForScene(
  paragraph: string,
  paraIndex: number,
  sentences: string[]
): DetectedScene | null {
  // Check for temporal/spatial anchors
  const temporal = findMatches(paragraph, TEMPORAL_MARKERS);
  const spatial = findMatches(paragraph, SPATIAL_MARKERS);

  // Check for sensory details
  const sensory = detectSensoryDetails(paragraph);

  // Check for action verbs
  const actions = findMatches(paragraph, ACTION_VERB_PATTERNS);

  // Check for dialogue
  const dialogue = findDialogue(paragraph);

  // Scoring logic
  let quality_score = 0;
  const evidence: DetectedScene['evidence'] = {
    sensory_details: [],
    action_verbs: [],
  };

  // Temporal/spatial anchor (required for scene)
  const has_anchor = temporal.length > 0 || spatial.length > 0;
  if (!has_anchor) return null;

  if (temporal.length > 0) {
    quality_score += 2;
    evidence.temporal_spatial_anchor = temporal[0];
  }
  if (spatial.length > 0) {
    quality_score += 2;
    evidence.temporal_spatial_anchor = spatial[0];
  }

  // Sensory details (key for immersion)
  const sensory_count = Object.values(sensory).flat().length;
  if (sensory_count > 0) {
    quality_score += Math.min(3, sensory_count);
    evidence.sensory_details = Object.values(sensory).flat().slice(0, 3);
  }

  // Action verbs (movement and physicality)
  if (actions.length > 0) {
    quality_score += Math.min(2, actions.length);
    evidence.action_verbs = actions.slice(0, 3);
  }

  // Dialogue (adds voice and immediacy)
  if (dialogue.length > 0) {
    quality_score += 1;
    evidence.dialogue = dialogue[0];
  }

  // Must have at least a basic scene (anchor + one other element)
  const element_count = [
    temporal.length > 0,
    spatial.length > 0,
    sensory_count > 0,
    actions.length > 0,
    dialogue.length > 0,
  ].filter(Boolean).length;

  if (element_count < 2) return null;

  // Determine scene type
  let type: DetectedScene['type'];
  if (element_count >= 4) {
    type = 'full_scene';
  } else if (element_count === 3) {
    type = 'partial_scene';
  } else {
    type = 'sensory_detail';
  }

  return {
    type,
    location_in_essay: {
      paragraph_index: paraIndex,
      sentence_indices: Array.from({ length: sentences.length }, (_, i) => i),
    },
    evidence,
    quality_score: Math.min(10, quality_score),
    excerpt: paragraph.slice(0, 200) + (paragraph.length > 200 ? '...' : ''),
  };
}

/**
 * Detect sensory details by category
 */
function detectSensoryDetails(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [sense, patterns] of Object.entries(SENSORY_PATTERNS)) {
    const matches = findMatches(text, patterns);
    if (matches.length > 0) {
      result[sense] = matches;
    }
  }

  return result;
}

/**
 * Find dialogue in text
 */
function findDialogue(text: string): string[] {
  const quotes: string[] = [];

  for (const pattern of DIALOGUE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      quotes.push(...matches);
    }
  }

  return quotes.filter(q => q.length > 5); // Filter out short quotes
}

/**
 * Find matches for multiple patterns
 */
function findMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];

  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  return [...new Set(matches)]; // Deduplicate
}

/**
 * Calculate overall scene score (0-10)
 */
function calculateSceneScore(scenes: DetectedScene[]): number {
  if (scenes.length === 0) return 0;

  // Base score from having scenes
  let score = Math.min(4, scenes.length * 2);

  // Quality bonus from best scene
  const best_scene_quality = Math.max(...scenes.map(s => s.quality_score));
  score += best_scene_quality * 0.6;

  return Math.round(Math.min(10, score) * 10) / 10;
}

/**
 * Generate human-readable summary
 */
function generateSceneSummary(scenes: DetectedScene[]): string {
  if (scenes.length === 0) {
    return 'No concrete scenes detected. Essay is primarily exposition.';
  }

  const full_scenes = scenes.filter(s => s.type === 'full_scene').length;
  const partial_scenes = scenes.filter(s => s.type === 'partial_scene').length;
  const sensory_moments = scenes.filter(s => s.type === 'sensory_detail').length;

  const parts: string[] = [];

  if (full_scenes > 0) {
    parts.push(`${full_scenes} full scene${full_scenes > 1 ? 's' : ''} with time/place anchor, sensory detail, and action`);
  }
  if (partial_scenes > 0) {
    parts.push(`${partial_scenes} partial scene${partial_scenes > 1 ? 's' : ''}`);
  }
  if (sensory_moments > 0) {
    parts.push(`${sensory_moments} sensory moment${sensory_moments > 1 ? 's' : ''}`);
  }

  return parts.join('; ') + '.';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Split essay into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Split paragraph into sentences
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ============================================================================
// SCORING HELPERS
// ============================================================================

/**
 * Map scene detection results to rubric score (0-10)
 * Used by rubricScorer.ts
 */
export function sceneDetectionToRubricScore(detection: SceneDetection): number {
  return detection.overall_scene_score;
}

/**
 * Get evidence quotes for rubric dimension
 */
export function getSceneEvidence(detection: SceneDetection): string[] {
  return detection.scenes
    .slice(0, 3) // Top 3 scenes
    .map(scene => scene.excerpt);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default detectScenes;
