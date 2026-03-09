/**
 * Pre-Analysis Service — Haiku Smart Detection Layer
 *
 * Runs a single Haiku call that detects patterns deterministic heuristics miss:
 * metaphors, conceptual echoes, tonal shifts, irony, insight mechanisms,
 * performed vulnerability, and character-revealing details.
 *
 * Haiku acts as a BETTER HEURISTIC — it reports WHAT it finds, not WHETHER
 * it's good. All quality judgment is reserved for the Sonnet annotation call.
 *
 * Input:  essay text + heuristic findings (features + Wave 2 deep content analysis)
 * Output: PreAnalysisResult — structured detection findings
 */

import { callClaude } from '../lib/llm/claude';
import type { ExtractedFeatures } from '../workshop/shared/types';
import type { DeepContentAnalysis } from './contentAnalysisTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface MetaphorDetection {
  text: string;
  paragraphs: number[];
  type: 'extended' | 'isolated';
}

export interface ImageryPattern {
  image: string;
  paragraphs: number[];
}

export interface ConceptualEcho {
  opening: string;
  closing: string;
  connection: string;
}

export interface ToneShift {
  location: string;
  from: string;
  to: string;
  evidence: string;
}

export interface IronyOrHumor {
  text: string;
  paragraph: number;
  type: 'irony' | 'humor' | 'understatement';
}

export interface PerformedVulnerability {
  text: string;
  paragraph: number;
}

export interface IntentionalBrevity {
  paragraph: number;
  purpose: string;
}

export interface BehavioralGrowth {
  text: string;
  paragraph: number;
}

export interface CharacterRevealingDetail {
  text: string;
  paragraph: number;
  whatItReveals: string;
}

export interface PreAnalysisResult {
  metaphors: MetaphorDetection[];
  imageryPatterns: ImageryPattern[];
  conceptualEchoes: ConceptualEcho[];
  toneShifts: ToneShift[];
  ironyOrHumor: IronyOrHumor[];
  insightMechanism: 'metaphor' | 'reflection' | 'behavior_change' | 'choice' | 'none';
  insightEvidence?: string;
  performedVulnerability: PerformedVulnerability[];
  intentionalBrevity: IntentionalBrevity[];
  behavioralGrowth: BehavioralGrowth[];
  characterRevealingDetails: CharacterRevealingDetail[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1500;

// ============================================================================
// SYSTEM PROMPT (cacheable — same across all essays)
// ============================================================================

const PRE_ANALYSIS_SYSTEM_PROMPT = `You detect patterns in college application essays that text analysis misses. You are a pattern detector, not an evaluator.

Rules:
- Report WHAT you find with exact text references
- Do NOT evaluate quality, effectiveness, or whether something "works"
- Quote exact text from the essay as evidence
- If a pattern is absent, return an empty array for that field
- Output structured JSON only, no commentary`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function formatEssayWithParagraphs(text: string): string {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.map((p, i) => `[P${i}] ${p.trim()}`).join('\n\n');
}

/**
 * Build a concise summary of what heuristics + Wave 2 analyzers already found.
 * This tells Haiku what's already been detected so it focuses on GAPS.
 */
function buildHeuristicContext(
  features: ExtractedFeatures,
  deepContent?: DeepContentAnalysis,
): string {
  const lines: string[] = ['## What Text Analysis Already Found'];

  // Basic stats
  lines.push(`Words: ${features.wordCount}, Paragraphs: ${features.paragraphCount}`);
  lines.push(`Sensory details: ${features.sensoryDetailCount}, Dialogue: ${features.dialogueCount}`);
  lines.push(`Cliches: ${features.clicheCount}, Reflection markers: ${features.reflectionMarkerCount}`);

  if (!deepContent) return lines.join('\n');

  // Structure findings
  const s = deepContent.structure;
  lines.push(`Arc: ${s.detectedArc} (${Math.round(s.arcConfidence * 100)}% conf)`);
  if (s.beats.length > 0) {
    lines.push(`Beats: ${s.beats.map(b => b.beatType).join(' > ')}`);
  }
  lines.push(`Pacing: ${s.pacing.balance}`);

  // Theme findings
  const t = deepContent.theme;
  lines.push(`Show ratio: ${Math.round(t.showDontTell.showRatio * 100)}%`);
  if (t.clicheDetection.clicheDetected) {
    lines.push(`Cliche topic: ${t.clicheDetection.matchedThemes.map(m => m.label).join(', ')} (${t.clicheDetection.verdict})`);
  }
  lines.push(`Thematic coherence: ${Math.round(t.thematicCoherence.overallCoherence * 100)}%`);

  // Character findings
  const c = deepContent.character;
  lines.push(`Character peak: ${c.peakLevel} at P${c.peakParagraphIndex}`);
  if (c.vulnerability.vulnerabilityMarkerCount > 0) {
    lines.push(`Vulnerability: ${c.vulnerability.isEarned ? 'earned' : 'performed'} (heuristic)`);
  }

  // Insight findings
  const i = deepContent.insight;
  lines.push(`Insight depth: ${i.depth.level} (${i.depth.insightLocation})`);
  if (i.uniqueness.hasCallbackStructure) {
    lines.push(`Callback structure: detected`);
  }

  return lines.join('\n');
}

function buildPreAnalysisUserPrompt(
  text: string,
  features: ExtractedFeatures,
  deepContent?: DeepContentAnalysis,
): string {
  const heuristicContext = buildHeuristicContext(features, deepContent);

  return `## Essay

${formatEssayWithParagraphs(text)}

${heuristicContext}

## Detect These Patterns (focus on what text analysis MISSED)

1. METAPHORS: Any metaphors or extended metaphors? Quote the text. Note if sustained across paragraphs or isolated.
2. IMAGERY PATTERNS: Recurring images or sensory clusters that appear in multiple paragraphs?
3. CONCEPTUAL ECHOES: Opening and closing connected by concept, idea, or emotional resonance (not just shared words)?
4. TONE SHIFTS: Where does tone change between paragraphs? What changes? (formal/informal, serious/playful, distant/intimate, reflective/active)
5. IRONY/HUMOR: Any irony, humor, self-deprecation, or understatement? Quote it.
6. INSIGHT MECHANISM: How is the essay's insight delivered? Through metaphor, standard reflection phrases, shown behavior change, or a specific choice/decision? If none, say "none".
7. PERFORMED VULNERABILITY: Any vulnerability that sounds generic or performed rather than grounded in specific detail? Quote it.
8. INTENTIONAL BREVITY: Any deliberately short paragraphs (1-2 sentences) that serve emphasis, pacing, or contrast?
9. BEHAVIORAL GROWTH: Any change in behavior SHOWN (not stated) — the writer doing something differently now?
10. CHARACTER-REVEALING DETAILS: Specific details that could only come from THIS person's lived experience? What does each reveal?

Return JSON:
{
  "metaphors": [{"text": "exact quote", "paragraphs": [0, 3], "type": "extended"}],
  "imageryPatterns": [{"image": "description", "paragraphs": [0, 2, 5]}],
  "conceptualEchoes": [{"opening": "quote from opening", "closing": "quote from closing", "connection": "what links them"}],
  "toneShifts": [{"location": "P2>P3", "from": "reflective", "to": "urgent", "evidence": "quote"}],
  "ironyOrHumor": [{"text": "quote", "paragraph": 3, "type": "humor"}],
  "insightMechanism": "metaphor",
  "insightEvidence": "quote or brief description",
  "performedVulnerability": [{"text": "quote", "paragraph": 2}],
  "intentionalBrevity": [{"paragraph": 4, "purpose": "emphasis"}],
  "behavioralGrowth": [{"text": "quote", "paragraph": 5}],
  "characterRevealingDetails": [{"text": "quote", "paragraph": 1, "whatItReveals": "brief description"}]
}`;
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parsePreAnalysisResponse(raw: string): PreAnalysisResult {
  const empty: PreAnalysisResult = {
    metaphors: [],
    imageryPatterns: [],
    conceptualEchoes: [],
    toneShifts: [],
    ironyOrHumor: [],
    insightMechanism: 'none',
    performedVulnerability: [],
    intentionalBrevity: [],
    behavioralGrowth: [],
    characterRevealingDetails: [],
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return empty;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      metaphors: Array.isArray(parsed.metaphors) ? parsed.metaphors : [],
      imageryPatterns: Array.isArray(parsed.imageryPatterns) ? parsed.imageryPatterns : [],
      conceptualEchoes: Array.isArray(parsed.conceptualEchoes) ? parsed.conceptualEchoes : [],
      toneShifts: Array.isArray(parsed.toneShifts) ? parsed.toneShifts : [],
      ironyOrHumor: Array.isArray(parsed.ironyOrHumor) ? parsed.ironyOrHumor : [],
      insightMechanism: ['metaphor', 'reflection', 'behavior_change', 'choice', 'none'].includes(parsed.insightMechanism)
        ? parsed.insightMechanism
        : 'none',
      insightEvidence: typeof parsed.insightEvidence === 'string' ? parsed.insightEvidence : undefined,
      performedVulnerability: Array.isArray(parsed.performedVulnerability) ? parsed.performedVulnerability : [],
      intentionalBrevity: Array.isArray(parsed.intentionalBrevity) ? parsed.intentionalBrevity : [],
      behavioralGrowth: Array.isArray(parsed.behavioralGrowth) ? parsed.behavioralGrowth : [],
      characterRevealingDetails: Array.isArray(parsed.characterRevealingDetails) ? parsed.characterRevealingDetails : [],
    };
  } catch {
    console.warn('[PreAnalysis] Failed to parse Haiku response, returning empty result');
    return empty;
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Run Haiku pre-analysis on an essay.
 *
 * Detects patterns that deterministic heuristics miss: metaphors, conceptual
 * echoes, tonal shifts, irony, insight mechanisms, and character-revealing details.
 *
 * Returns empty result on failure — never blocks the pipeline.
 */
export async function runPreAnalysis(
  text: string,
  features: ExtractedFeatures,
  deepContent?: DeepContentAnalysis,
): Promise<PreAnalysisResult> {
  const userPrompt = buildPreAnalysisUserPrompt(text, features, deepContent);

  try {
    const response = await callClaude<string>({
      systemPrompt: PRE_ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      model: HAIKU_MODEL,
      maxTokens: MAX_TOKENS,
      cacheSystemPrompt: true,
    });

    return parsePreAnalysisResponse(response.content);
  } catch (error) {
    console.warn(
      '[PreAnalysis] Haiku call failed, proceeding without pre-analysis:',
      error instanceof Error ? error.message : String(error),
    );
    return {
      metaphors: [],
      imageryPatterns: [],
      conceptualEchoes: [],
      toneShifts: [],
      ironyOrHumor: [],
      insightMechanism: 'none',
      performedVulnerability: [],
      intentionalBrevity: [],
      behavioralGrowth: [],
      characterRevealingDetails: [],
    };
  }
}
