/**
 * Sonnet Context Layer
 *
 * A SEPARATE, OPTIONAL quality layer for context gap detection.
 *
 * KEY DESIGN PRINCIPLES:
 * 1. Does NOT replace existing strategicSpecificityService or contextGapDetector
 * 2. Runs independently with its own bandwidth
 * 3. Can be enabled/disabled without affecting the current system
 * 4. Uses Sonnet for accuracy (not Haiku)
 * 5. Smart caching to minimize API costs
 *
 * COST: ~$0.0135 per call (acceptable for quality layer)
 *
 * INTEGRATION PATTERN:
 * - Call BEFORE generating suggestions (optional enhancement)
 * - Results cached by essay content hash
 * - Returns structured gaps that the chat interface can use for targeted questions
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { SupplementalType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextGap {
  /** Unique identifier for this gap */
  id: string;

  /** What type of context is missing */
  gap_type: 'missing_concrete_detail' | 'missing_emotional_depth' | 'missing_specific_example' |
            'missing_research' | 'missing_reflection' | 'missing_stakes' | 'missing_resolution';

  /** The exact text in the essay that needs more context */
  trigger_text: string;

  /** Why this gap matters for the essay's effectiveness */
  impact_explanation: string;

  /** A natural question to ask the student */
  suggested_question: string;

  /** How important is filling this gap (1-10) */
  priority: number;

  /** The zone this affects */
  impact_zone: 'anchor_moment' | 'emotional_stakes' | 'specific_detail' | 'research_depth' | 'reflection_insight';

  /** What CAN be done without this context (structural improvements) */
  workaround_suggestion?: string;
}

/**
 * Existing strengths in the essay that should be preserved/amplified
 */
export interface ExistingStrength {
  /** What's working well */
  strength_type: 'concrete_detail' | 'authentic_voice' | 'emotional_moment' | 'unique_perspective' | 'clear_structure';

  /** The specific text demonstrating this strength */
  evidence_text: string;

  /** Why this is effective */
  why_effective: string;

  /** How to amplify this in suggestions */
  amplification_hint: string;
}

export interface SonnetContextAnalysis {
  /** Hash of the essay used for caching */
  essay_hash: string;

  /** Existing strengths to preserve and amplify */
  strengths: ExistingStrength[];

  /** Detected essay type */
  detected_type: SupplementalType;

  /** Confidence in type detection (0-1) */
  type_confidence: number;

  /** All detected context gaps, sorted by priority */
  gaps: ContextGap[];

  /** Overall context quality score (0-100) */
  context_quality_score: number;

  /** Brief explanation of overall quality */
  quality_summary: string;

  /** Whether context gathering would significantly improve this essay */
  would_benefit_from_context: boolean;

  /** Token usage for cost tracking */
  tokens_used: { input: number; output: number };

  /** Processing time in ms */
  processing_time_ms: number;
}

export interface SonnetLayerOptions {
  /** Enable/disable the layer entirely */
  enabled: boolean;

  /** Maximum number of gaps to return */
  max_gaps?: number;

  /** Minimum priority threshold (1-10) */
  min_priority?: number;

  /** Cache TTL in seconds (default: 1 hour) */
  cache_ttl_seconds?: number;

  /** Force fresh analysis (bypass cache) */
  bypass_cache?: boolean;
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry {
  analysis: SonnetContextAnalysis;
  timestamp: number;
}

const analysisCache = new Map<string, CacheEntry>();

function hashEssay(essay: string, essayType?: SupplementalType): string {
  const content = `${essay}|${essayType || 'auto'}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function getCachedAnalysis(hash: string, ttlSeconds: number): SonnetContextAnalysis | null {
  const entry = analysisCache.get(hash);
  if (!entry) return null;

  const ageMs = Date.now() - entry.timestamp;
  if (ageMs > ttlSeconds * 1000) {
    analysisCache.delete(hash);
    return null;
  }

  return entry.analysis;
}

function cacheAnalysis(hash: string, analysis: SonnetContextAnalysis): void {
  // Limit cache size to prevent memory issues
  if (analysisCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(analysisCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 500; i++) {
      analysisCache.delete(entries[i][0]);
    }
  }

  analysisCache.set(hash, {
    analysis,
    timestamp: Date.now()
  });
}

// ============================================================================
// TYPE-SPECIFIC GUIDANCE (What matters for each essay type)
// ============================================================================

const TYPE_CONTEXT_PRIORITIES: Record<SupplementalType, {
  critical_zones: string[];
  key_questions: string[];
  red_flags: string[];
}> = {
  why_us: {
    critical_zones: ['research_depth', 'specific_detail'],
    key_questions: [
      'What SPECIFIC program, professor, or resource excites you?',
      'Have you visited campus or talked to students/alumni?',
      'What would you DO at this school that you couldn\'t do elsewhere?'
    ],
    red_flags: ['Generic praise', 'Ranking mentions', 'Location-only focus', 'No specific programs named']
  },

  extracurricular: {
    critical_zones: ['anchor_moment', 'emotional_stakes'],
    key_questions: [
      'What was the MOMENT you realized this activity mattered?',
      'What specific challenge did you overcome?',
      'How did your role evolve over time?'
    ],
    red_flags: ['List of achievements', 'No specific story', 'Generic impact claims']
  },

  community: {
    critical_zones: ['specific_detail', 'reflection_insight'],
    key_questions: [
      'What specific contribution did YOU make?',
      'How did you see the community change?',
      'What did you learn from the people there?'
    ],
    red_flags: ['Savior complex', 'No specific interactions', 'Generic "helped others"']
  },

  challenge: {
    critical_zones: ['anchor_moment', 'emotional_stakes', 'reflection_insight'],
    key_questions: [
      'What was the hardest MOMENT of this challenge?',
      'How did you feel at your lowest point?',
      'What specifically changed in you afterward?'
    ],
    red_flags: ['Vague struggle', 'Instant resolution', 'No emotional depth', 'Growth without process']
  },

  intellectual: {
    critical_zones: ['specific_detail', 'research_depth'],
    key_questions: [
      'What was the specific question or problem that captivated you?',
      'What did you DO to explore it beyond class?',
      'What surprising thing did you discover?'
    ],
    red_flags: ['Just describing a class', 'No independent exploration', 'Passion claimed not shown']
  },

  diversity: {
    critical_zones: ['specific_detail', 'emotional_stakes', 'reflection_insight'],
    key_questions: [
      'What specific experience shaped this identity?',
      'How does this perspective show up in daily life?',
      'What have you learned from navigating this identity?'
    ],
    red_flags: ['Surface-level description', 'No specific stories', 'Identity without impact']
  },

  creative: {
    critical_zones: ['anchor_moment', 'specific_detail'],
    key_questions: [
      'What was your creative breakthrough moment?',
      'What specific technique or approach defines your work?',
      'How has your creative vision evolved?'
    ],
    red_flags: ['Just listing works', 'No process description', 'Generic passion statements']
  },

  values: {
    critical_zones: ['anchor_moment', 'reflection_insight'],
    key_questions: [
      'What MOMENT crystallized this value for you?',
      'When was this value tested?',
      'How do you live this value in small, daily ways?'
    ],
    red_flags: ['Abstract philosophy', 'No specific examples', 'Values stated not demonstrated']
  },

  goals: {
    critical_zones: ['specific_detail', 'research_depth'],
    key_questions: [
      'What sparked this specific goal?',
      'What have you already done toward this goal?',
      'What resources at this school will help?'
    ],
    red_flags: ['Generic career aspirations', 'No concrete steps', 'Disconnected from experiences']
  },

  leadership: {
    critical_zones: ['anchor_moment', 'specific_detail'],
    key_questions: [
      'What was a specific difficult decision you made as a leader?',
      'How did you handle disagreement or conflict?',
      'What would your team say about your leadership?'
    ],
    red_flags: ['Title-focused', 'No specific decisions', 'No team perspective']
  },

  failure: {
    critical_zones: ['anchor_moment', 'emotional_stakes', 'reflection_insight'],
    key_questions: [
      'What was the exact moment you realized you failed?',
      'How did it feel in that moment?',
      'What specifically did you do differently after?'
    ],
    red_flags: ['Humble brag', 'No real failure', 'Instant recovery', 'No emotional honesty']
  },

  influence: {
    critical_zones: ['specific_detail', 'emotional_stakes'],
    key_questions: [
      'What specific moment with this person changed you?',
      'What did they SAY or DO that stuck with you?',
      'How do you see their influence in your current actions?'
    ],
    red_flags: ['Generic praise', 'No specific interactions', 'Person not individual described']
  },

  quirky: {
    critical_zones: ['specific_detail', 'reflection_insight'],
    key_questions: [
      'What specific aspect of this topic fascinates you?',
      'What\'s the weirdest rabbit hole you\'ve gone down?',
      'What does this interest reveal about how you think?'
    ],
    red_flags: ['Surface enthusiasm', 'No depth', 'Trying too hard to be unique']
  },

  open: {
    critical_zones: ['anchor_moment', 'specific_detail', 'reflection_insight'],
    key_questions: [
      'What moment or experience is central to this story?',
      'What specific details make this uniquely yours?',
      'What insight did you gain from this?'
    ],
    red_flags: ['Unfocused narrative', 'Multiple topics', 'No clear throughline']
  }
};

// ============================================================================
// SONNET CONTEXT LAYER SERVICE
// ============================================================================

export class SonnetContextLayer {
  private anthropic: Anthropic;
  private defaultOptions: Required<SonnetLayerOptions> = {
    enabled: true,
    max_gaps: 5,
    min_priority: 3,
    cache_ttl_seconds: 3600, // 1 hour
    bypass_cache: false
  };

  constructor() {
    this.anthropic = new Anthropic();
  }

  /**
   * Analyze an essay for context gaps using Sonnet.
   * This is a SEPARATE layer that doesn't affect the existing system.
   *
   * @param essay The student's essay draft
   * @param knownType Optional: if type is already known, skip detection
   * @param options Configuration options
   */
  async analyzeContextGaps(
    essay: string,
    knownType?: SupplementalType,
    options: Partial<SonnetLayerOptions> = {}
  ): Promise<SonnetContextAnalysis> {
    const opts = { ...this.defaultOptions, ...options };

    // Layer disabled - return empty result
    if (!opts.enabled) {
      return this.createEmptyResult(essay, knownType);
    }

    const essayHash = hashEssay(essay, knownType);

    // Check cache first
    if (!opts.bypass_cache) {
      const cached = getCachedAnalysis(essayHash, opts.cache_ttl_seconds);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();

    // Build the analysis prompt
    const typeGuidance = knownType ? TYPE_CONTEXT_PRIORITIES[knownType] : null;

    const systemPrompt = `You are an expert college admissions essay analyst. Your task is to identify SPECIFIC context gaps in student essays - places where more concrete details, specific examples, or deeper reflection would significantly strengthen the essay.

CRITICAL: You are NOT rewriting or suggesting changes. You are identifying what INFORMATION is missing that would make the essay more compelling.

${typeGuidance ? `
ESSAY TYPE: ${knownType}
CRITICAL ZONES FOR THIS TYPE: ${typeGuidance.critical_zones.join(', ')}
KEY QUESTIONS TO CONSIDER:
${typeGuidance.key_questions.map(q => `- ${q}`).join('\n')}
RED FLAGS TO WATCH FOR:
${typeGuidance.red_flags.map(f => `- ${f}`).join('\n')}
` : ''}

For each gap you identify, provide:
1. The exact text that indicates the gap
2. What type of context is missing
3. Why filling this gap matters
4. A natural question to ask the student
5. Priority (1-10, where 10 is most critical)
6. What structural improvements CAN be made without this context

ALSO identify what's WORKING in the essay - strengths to preserve and amplify.

Output as JSON matching this structure:
{
  "detected_type": "the essay type if not provided",
  "type_confidence": 0.0-1.0,
  "strengths": [
    {
      "strength_type": "concrete_detail|authentic_voice|emotional_moment|unique_perspective|clear_structure",
      "evidence_text": "quote from essay showing the strength",
      "why_effective": "why this works",
      "amplification_hint": "how to build on this in suggestions"
    }
  ],
  "gaps": [
    {
      "id": "unique_id",
      "gap_type": "missing_concrete_detail|missing_emotional_depth|missing_specific_example|missing_research|missing_reflection|missing_stakes|missing_resolution",
      "trigger_text": "exact quote from essay",
      "impact_explanation": "why this matters",
      "suggested_question": "natural question for student",
      "priority": 1-10,
      "impact_zone": "anchor_moment|emotional_stakes|specific_detail|research_depth|reflection_insight",
      "workaround_suggestion": "what CAN be improved structurally without inventing content"
    }
  ],
  "context_quality_score": 0-100,
  "quality_summary": "brief explanation",
  "would_benefit_from_context": true/false
}`;

    const userPrompt = `Analyze this essay for context gaps:

---
${essay}
---

Identify the most important gaps where gathering more context from the student would significantly improve the essay. Focus on gaps that, if filled, would transform vague claims into vivid, specific stories.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build result
      const analysis: SonnetContextAnalysis = {
        essay_hash: essayHash,
        strengths: (parsed.strengths || []).slice(0, 3).map((s: any) => ({
          strength_type: s.strength_type || 'authentic_voice',
          evidence_text: s.evidence_text || '',
          why_effective: s.why_effective || '',
          amplification_hint: s.amplification_hint || ''
        })),
        detected_type: knownType || parsed.detected_type || 'open',
        type_confidence: parsed.type_confidence || 0.8,
        gaps: (parsed.gaps || [])
          .filter((g: any) => g.priority >= opts.min_priority)
          .slice(0, opts.max_gaps)
          .map((g: any, i: number) => ({
            id: g.id || `gap_${i}`,
            gap_type: g.gap_type,
            trigger_text: g.trigger_text,
            impact_explanation: g.impact_explanation,
            suggested_question: g.suggested_question,
            priority: g.priority,
            impact_zone: g.impact_zone,
            workaround_suggestion: g.workaround_suggestion
          })),
        context_quality_score: parsed.context_quality_score || 50,
        quality_summary: parsed.quality_summary || '',
        would_benefit_from_context: parsed.would_benefit_from_context !== false,
        tokens_used: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens
        },
        processing_time_ms: Date.now() - startTime
      };

      // Cache the result
      cacheAnalysis(essayHash, analysis);

      return analysis;

    } catch (error) {
      console.error('[SonnetContextLayer] Analysis failed:', error);
      return this.createEmptyResult(essay, knownType);
    }
  }

  /**
   * Get statistics about the cache
   */
  getCacheStats(): { size: number; oldest_entry_age_ms: number | null } {
    if (analysisCache.size === 0) {
      return { size: 0, oldest_entry_age_ms: null };
    }

    let oldestTime = Date.now();
    for (const entry of analysisCache.values()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
    }

    return {
      size: analysisCache.size,
      oldest_entry_age_ms: Date.now() - oldestTime
    };
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    analysisCache.clear();
  }

  /**
   * Estimate cost for analyzing an essay
   */
  estimateCost(essayLength: number): { estimated_input_tokens: number; estimated_output_tokens: number; estimated_cost_usd: number } {
    // Rough token estimation: 1 token ≈ 4 characters for English
    const essayTokens = Math.ceil(essayLength / 4);
    const systemPromptTokens = 1500; // Approximate
    const inputTokens = essayTokens + systemPromptTokens;
    const outputTokens = 500; // Typical output size

    const cost = (inputTokens * 3 / 1_000_000) + (outputTokens * 15 / 1_000_000);

    return {
      estimated_input_tokens: inputTokens,
      estimated_output_tokens: outputTokens,
      estimated_cost_usd: cost
    };
  }

  private createEmptyResult(essay: string, knownType?: SupplementalType): SonnetContextAnalysis {
    return {
      essay_hash: hashEssay(essay, knownType),
      strengths: [], // No strengths detected when analysis skipped
      detected_type: knownType || 'open',
      type_confidence: knownType ? 1.0 : 0,
      gaps: [],
      context_quality_score: 100, // Assume good if we can't analyze
      quality_summary: 'Analysis skipped or failed',
      would_benefit_from_context: false,
      tokens_used: { input: 0, output: 0 },
      processing_time_ms: 0
    };
  }
}

// Export singleton instance
export const sonnetContextLayer = new SonnetContextLayer();

// Export type priorities for external use
export { TYPE_CONTEXT_PRIORITIES };
