/**
 * Deep Dive Service — Phase 5 on-demand annotation expansion
 *
 * When a student clicks on an annotation for deeper teaching,
 * this service builds a focused Sonnet prompt that expands on
 * the annotation's insight with alternatives, exemplars, and
 * craft principles.
 *
 * Integration points:
 * - callClaude: single Sonnet call with prompt caching
 * - commandRegistry: loads detailedPrompt for craft-specific teaching
 * - types: DeepDiveResult, EssayAnnotation
 */

import { callClaude, calculateCost } from '../lib/llm/claude';
import { commandRegistry } from '../workshop';
import type { WorkshopEssayType } from '../workshop/shared/types';
import type { EssayAnnotation, DeepDiveResult } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 2048;
const CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `You are providing deeper teaching on a specific essay annotation. Your role is to help the student truly understand the craft principle at play — not just what to fix, but WHY it matters and HOW to think about it.

Your teaching should be:
- Conversational and encouraging, like a skilled writing mentor
- Concrete with specific alternatives, not abstract advice
- Grounded in the student's actual text, not generic examples

Respond with valid JSON in this exact format:
{
  "expandedTeaching": "3-5 sentences of deeper explanation...",
  "alternatives": [{"text": "alternative rewrite...", "tradeoff": "what this version gains/loses..."}],
  "exemplar": {"text": "exemplar passage...", "whyItWorks": "explanation..."} | null,
  "craftPrinciple": {"name": "principle name", "explanation": "how it works...", "beforeAfter": {"before": "original pattern...", "after": "improved pattern..."}} | null
}

Rules:
- "alternatives" must have 2-3 entries showing genuinely different approaches
- "exemplar" should be from elite college essays if relevant, otherwise null
- "craftPrinciple" should name the underlying writing principle if one applies, otherwise null
- Keep all text natural and student-friendly — no jargon`;

// ============================================================================
// SERVICE
// ============================================================================

class DeepDiveService {
  /**
   * Generate a deep dive expansion for a specific annotation.
   *
   * Builds a focused prompt with the annotation context and surrounding
   * essay text, calls Sonnet, and returns structured teaching content.
   */
  async deepDive(
    annotation: EssayAnnotation,
    essayText: string,
    essayType: WorkshopEssayType,
  ): Promise<DeepDiveResult> {
    const userPrompt = this.buildUserPrompt(annotation, essayText, essayType);

    const response = await callClaude<string>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      model: SONNET_MODEL,
      maxTokens: MAX_TOKENS,
      cacheSystemPrompt: true,
    });

    const parsed = this.parseResponse(response.content);
    const costUSD = calculateCost(response.usage, SONNET_MODEL);

    return {
      annotationId: annotation.id,
      expandedTeaching: parsed.expandedTeaching,
      alternatives: parsed.alternatives,
      exemplar: parsed.exemplar ?? undefined,
      craftPrinciple: parsed.craftPrinciple ?? undefined,
      costUSD,
    };
  }

  /**
   * Build the user prompt with annotation details and surrounding context.
   */
  private buildUserPrompt(
    annotation: EssayAnnotation,
    essayText: string,
    essayType: WorkshopEssayType,
  ): string {
    // Extract surrounding context
    const { startOffset, endOffset } = annotation.span;
    const contextStart = Math.max(0, startOffset - CONTEXT_CHARS);
    const contextEnd = Math.min(essayText.length, endOffset + CONTEXT_CHARS);
    const surroundingText = essayText.slice(contextStart, contextEnd);

    const parts: string[] = [
      `Essay type: ${essayType}`,
      ``,
      `## Annotation Details`,
      `- Dimension: ${annotation.dimensionId}`,
      `- Severity: ${annotation.severity}`,
      `- Is strength: ${annotation.isStrength}`,
      ``,
      `## The Annotated Text`,
      `"${annotation.span.text}"`,
      ``,
      `## Surrounding Context`,
      `"...${surroundingText}..."`,
      ``,
      `## Current Insight`,
      annotation.insight,
      ``,
      `## Current Suggestion`,
      annotation.suggestion,
    ];

    // If annotation has an applicable command, load its detailed prompt
    if (annotation.applicableCommand) {
      const command = commandRegistry.getCommand(annotation.applicableCommand);
      if (command) {
        parts.push(
          ``,
          `## Craft-Specific Teaching Reference (${command.displayName})`,
          command.detailedPrompt,
        );
      }
    }

    parts.push(
      ``,
      `Provide deeper teaching on this annotation. Help the student understand the underlying craft principle and see concrete alternatives.`,
    );

    return parts.join('\n');
  }

  /**
   * Parse the JSON response from Claude, handling code fences.
   */
  private parseResponse(raw: string): ParsedDeepDive {
    let jsonString = raw.trim();

    // Strip markdown code fences
    const fenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonString = fenceMatch[1].trim();
    } else {
      // Find outermost JSON object
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(jsonString) as ParsedDeepDive;

    // Validate required fields
    if (!parsed.expandedTeaching || typeof parsed.expandedTeaching !== 'string') {
      throw new Error('Deep dive response missing expandedTeaching');
    }
    if (!Array.isArray(parsed.alternatives) || parsed.alternatives.length === 0) {
      throw new Error('Deep dive response missing alternatives array');
    }

    return parsed;
  }
}

/** Shape of the parsed LLM JSON response */
interface ParsedDeepDive {
  expandedTeaching: string;
  alternatives: Array<{ text: string; tradeoff: string }>;
  exemplar: { text: string; whyItWorks: string } | null;
  craftPrinciple: {
    name: string;
    explanation: string;
    beforeAfter: { before: string; after: string };
  } | null;
}

/** Singleton export */
export const deepDiveService = new DeepDiveService();
