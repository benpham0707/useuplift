/**
 * Inline Editor Service
 *
 * Applies targeted text transformations using LLM-powered editing commands.
 * Each command generates two alternatives (primary=safe, creative=bolder)
 * plus a teaching note and transferable principle.
 *
 * Model strategy:
 * - Haiku for most commands (speed, < 2s)
 * - Sonnet for deepen_vulnerability and connect_to_theme (quality-critical)
 */

import { callClaude, calculateCost } from '@/lib/llm/claude';
import { styleConsistencyService } from '@/services/voiceProfile';
import { sessionContextService } from '@/services/sessionContext';
import { ragService } from '@/services/rag';
import { getCommandPrompt, SUGGEST_COMMANDS_PROMPT } from './commandPrompts';
import type { EditingCommand, InlineEditRequest, InlineEditResult } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929';

// ============================================================================
// TYPES
// ============================================================================

/** Suggestion returned by suggestCommands */
export interface CommandSuggestion {
  command: EditingCommand;
  reason: string;
  impact: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class InlineEditorService {

  /**
   * Apply an editing command to selected text.
   *
   * Builds context from the surrounding document, optionally injects voice profile,
   * calls the appropriate model, and returns two alternatives with teaching feedback.
   */
  async applyCommand(request: InlineEditRequest): Promise<InlineEditResult> {
    const { selectedText, fullDocument, selectionStart, selectionEnd, command, voiceProfile, essayType: requestEssayType, additionalContext, sessionId, ragContext, collegeId } = request;

    // Auto-retrieve RAG transformations when not explicitly provided
    let effectiveRagContext = ragContext;
    if (!effectiveRagContext) {
      try {
        const ragResults = await ragService.retrieveTransformations(selectedText, {
          technique: command,
          limit: 2,
        });
        if (ragResults.length > 0) {
          effectiveRagContext = ragService.formatTransformationsForPrompt(ragResults);
        }
      } catch (e) {
        console.warn('[InlineEditor] RAG auto-retrieval failed, proceeding without:', e instanceof Error ? e.message : e);
      }
    }

    // Get prompt template for this command (with optional ragContext injection).
    // Checks built-in commands first, then falls through to the command registry.
    const template = await getCommandPrompt(command, effectiveRagContext);

    // Build surrounding context — provide full paragraph context (up to 500 chars) so the LLM
    // can see paragraph structure, preceding arguments, and the essay's narrative arc.
    // 100 chars was too narrow to produce coherent edits that connect to surrounding text.
    const contextBefore = fullDocument.slice(Math.max(0, selectionStart - 500), selectionStart);
    const contextAfter = fullDocument.slice(selectionEnd, Math.min(fullDocument.length, selectionEnd + 500));

    // Build system prompt with optional voice constraint
    // Uses buildVoiceConstraintBlock (directive: MUST/BANNED) over getPromptSummary (descriptive).
    // Directive constraints produce measurably better voice preservation in LLM output.
    let systemPrompt = template.systemPrompt;
    if (voiceProfile) {
      const voiceConstraints = styleConsistencyService.buildVoiceConstraintBlock(voiceProfile);
      systemPrompt = systemPrompt.replace('{VOICE_SUMMARY}', voiceConstraints);
    } else {
      systemPrompt = systemPrompt.replace('\n\n{VOICE_SUMMARY}', '');
    }

    // Inject session context if sessionId is provided
    if (sessionId) {
      try {
        const contextBlock = sessionContextService.getDocumentContextBlock(sessionId);
        if (contextBlock && !contextBlock.includes('Session not found')) {
          systemPrompt += `\n\n## Session Context\n${contextBlock}`;
        }
      } catch (error) {
        console.warn('[InlineEditor] Failed to get session context:', error instanceof Error ? error.message : String(error));
        // Continue without session context — non-blocking
      }
    }

    // Inject admissions intelligence context (non-blocking, no LLM)
    try {
      const { buildAdmissionsContext } = await import('./admissionsContext');
      const admissionsCtx = buildAdmissionsContext(requestEssayType, collegeId);
      if (admissionsCtx) {
        systemPrompt += '\n\n## Admissions Intelligence\n' + admissionsCtx;
      }
    } catch (error) {
      console.warn('[InlineEditor] Admissions context injection failed:', error instanceof Error ? error.message : String(error));
      // Continue without admissions context — non-blocking
    }

    // Build user prompt
    const userPromptParts: string[] = [
      `CONTEXT BEFORE: "${contextBefore}"`,
      `SELECTED TEXT: "${selectedText}"`,
      `CONTEXT AFTER: "${contextAfter}"`,
    ];
    if (requestEssayType) {
      userPromptParts.push(`ESSAY TYPE: ${requestEssayType}`);
    }
    if (additionalContext) {
      userPromptParts.push(`ADDITIONAL CONTEXT: ${additionalContext}`);
    }
    userPromptParts.push(`\nApply the "${command}" command to the selected text.`);

    const userPrompt = userPromptParts.join('\n');

    // Select model based on command
    const model = template.model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;

    // Call LLM with retry on parse failure
    const result = await this.callWithRetry<InlineEditResult>(systemPrompt, userPrompt, model);

    // Post-generation heuristic voice check (non-blocking, < 10ms)
    if (voiceProfile && result.primary?.text && result.creative?.text) {
      try {
        const primaryCheck = styleConsistencyService.quickVoiceCheck(result.primary.text, voiceProfile);
        const creativeCheck = styleConsistencyService.quickVoiceCheck(result.creative.text, voiceProfile);
        result.voiceConsistency = {
          primary: primaryCheck,
          creative: creativeCheck,
        };
      } catch (error) {
        console.warn('[InlineEditor] Voice consistency check failed:', error instanceof Error ? error.message : String(error));
        // Continue without voice consistency — non-blocking
      }
    }

    return result;
  }

  /**
   * Suggest the best 2-3 editing commands for a text selection.
   * Uses Haiku for speed (target < 2s).
   */
  async suggestCommands(
    selectedText: string,
    fullDocument: string,
    essayType?: string
  ): Promise<CommandSuggestion[]> {
    const userPromptParts: string[] = [
      `FULL DOCUMENT (for context):\n"${fullDocument.slice(0, 1000)}${fullDocument.length > 1000 ? '...' : ''}"`,
      `\nSELECTED TEXT:\n"${selectedText}"`,
    ];
    if (essayType) {
      userPromptParts.push(`\nESSAY TYPE: ${essayType}`);
    }
    userPromptParts.push('\nRecommend 2-3 editing commands for the selected text.');

    const response = await callClaude<{ suggestions: CommandSuggestion[] }>({
      systemPrompt: SUGGEST_COMMANDS_PROMPT,
      userPrompt: userPromptParts.join('\n'),
      model: HAIKU_MODEL,
      temperature: 0.3,
      maxTokens: 1000,
      useJsonMode: true,
      cacheSystemPrompt: true,
    });

    return response.content.suggestions;
  }

  // ==========================================================================
  // PRIVATE
  // ==========================================================================

  /**
   * Call Claude with one retry on JSON parse failure.
   * On second failure, returns a helpful error result.
   */
  private async callWithRetry<T extends InlineEditResult>(
    systemPrompt: string,
    userPrompt: string,
    model: string
  ): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await callClaude<T>({
          systemPrompt,
          userPrompt,
          model,
          temperature: 0.7,
          maxTokens: 2000,
          useJsonMode: true,
          cacheSystemPrompt: true,
        });

        const result = response.content;

        // Validate required fields
        if (!result.primary?.text || !result.creative?.text) {
          if (attempt === 0) continue; // Retry once
          throw new Error('Missing required fields in LLM response');
        }

        // Attach cost
        result.cost = calculateCost(response.usage);

        return result;
      } catch (error) {
        if (attempt === 0) {
          console.warn('[InlineEditor] First attempt failed, retrying:', error instanceof Error ? error.message : String(error));
          continue;
        }
        // Second failure — return error result
        console.error('[InlineEditor] Both attempts failed:', error instanceof Error ? error.message : String(error));
        return {
          primary: {
            text: '',
            explanation: 'The editing service encountered an error. Please try again.',
          },
          creative: {
            text: '',
            explanation: 'The editing service encountered an error. Please try again.',
          },
          teachingNote: 'Unable to generate suggestions at this time.',
          principle: '',
          cost: 0,
        } as T;
      }
    }

    // Unreachable, but TypeScript needs it
    throw new Error('[InlineEditor] Unexpected code path');
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const inlineEditorService = new InlineEditorService();
