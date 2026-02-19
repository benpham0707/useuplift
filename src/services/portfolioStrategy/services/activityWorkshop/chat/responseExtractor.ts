/**
 * Response Extractor Service
 *
 * LLM-powered extraction of structured information from natural language
 * student responses. Uses Sonnet for accuracy in parsing conversational
 * text into profile fields.
 *
 * CAPABILITIES:
 * - Extract factual data (numbers, dates, names)
 * - Identify narrative elements (key moments, relationships)
 * - Preserve authentic quotes
 * - Detect implicit information
 * - Flag items needing clarification
 *
 * PHILOSOPHY: Students speak naturally about their experiences.
 * Our job is to parse that into structured data without losing
 * the authentic voice and nuance.
 */

import { callClaude } from '@/lib/llm/claude';
import {
  ExtractionResult,
  ExtractedField,
  ExtractedQuote,
  ClarificationNeeded,
  ImplicitFinding,
  ConversationState,
} from './types';
import { ActivityProfile } from '../profile/types';

// ============================================================================
// EXTRACTION PROMPTS
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured information from conversational responses about extracurricular activities.

Your task is to parse a student's natural language response and extract:
1. Factual data (numbers, dates, names, roles)
2. Narrative elements (key moments, challenges, growth)
3. Authentic quotes worth preserving
4. Implicit information that can be inferred
5. Items that need clarification

EXTRACTION PRINCIPLES:

1. **Preserve Authenticity**: When you capture quotes, use the student's exact words. Don't sanitize or formalize their language.

2. **Be Specific About Confidence**: Mark confidence as:
   - "high": The information is explicitly stated and unambiguous
   - "medium": The information is stated but could be interpreted differently
   - "low": The information is inferred or the student was vague

3. **Extract Numbers Carefully**:
   - "about 50 people" → value: 50, confidence: medium
   - "exactly 47 tutorials" → value: 47, confidence: high
   - "a lot of students" → don't extract as number, flag for clarification

4. **CRITICAL: Extract Recognition/Awards**: Look for ANY mentions of awards, recognition, or formal acknowledgment:
   - "Student Leader award" → facts.recognition: [{type: "award", name: "Student Leader Award", level: "school", selectivity: "medium"}]
   - "principal gave me this award" → extract to facts.recognition
   - "I was named...", "I received...", "I won..." → all indicate recognition
   - "presented to the department" → facts.recognition: [{type: "presentation", name: "Department Presentation"}]

5. **CRITICAL: Extract Before/After Metrics**: Look for any comparative changes:
   - "went from C- to B+" → impact.beforeAfter: {before: "C- average", after: "B+ average", yourRole: "tutoring support"}
   - "used to struggle...now passes" → extract the transformation
   - "increased from X to Y" → capture the delta
   - "improved by X%" → calculate before/after

6. **CRITICAL: Extract Multiple Roles**: Students often have multiple roles even if they only mention one title:
   - "I presented to other tutors" → add role: "Presenter" or "Trainer"
   - "I created videos" → add role: "Content Creator"
   - "I led a team of 3 tutors" → add role: "Team Lead"
   - "I trained new tutors" → add role: "Trainer"
   - Extract ALL roles mentioned, not just the primary position

7. **Identify Key Moments**: Look for:
   - Breakthroughs: "that's when I realized...", "it finally clicked..."
   - Challenges: "the hardest part was...", "I struggled with..."
   - Turning points: "everything changed when...", "that's when I decided..."
   - Proud moments: "I'm most proud of...", "the best moment was..."

8. **Capture Authentic Voice**: Flag phrases that:
   - Show personality
   - Express genuine emotion
   - Use unique metaphors or descriptions
   - Would work well in an essay or interview

9. **Infer Thoughtfully**: You can infer:
   - Character traits from described actions
   - Skills from described tasks
   - Growth from before/after comparisons
   - But always note inference confidence

10. **Flag Vagueness**: If the response is too vague to extract meaningful data:
   - Note what's unclear
   - Suggest specific follow-up questions

OUTPUT FORMAT: JSON matching the ExtractionResult schema exactly.`;

/**
 * Build the extraction prompt for a specific response
 */
function buildExtractionPrompt(
  question: string,
  response: string,
  currentProfile: ActivityProfile,
  conversationContext?: string
): string {
  return `## CONTEXT

Activity: ${currentProfile.activityTitle}

Current Profile State (what we already know):
${JSON.stringify(summarizeProfile(currentProfile), null, 2)}

${conversationContext ? `Previous conversation context:\n${conversationContext}\n` : ''}

## QUESTION ASKED
"${question}"

## STUDENT RESPONSE
"${response}"

## EXTRACTION TASK

Extract all useful information from the student's response into the following JSON structure:

{
  "extractedFields": [
    {
      "path": "<profile field path, e.g., 'facts.scale.peopleDirectlyImpacted'>",
      "value": <extracted value>,
      "confidence": "high" | "medium" | "low",
      "sourceQuote": "<the part of the response this came from>",
      "updateType": "new" | "update" | "append"
    }
  ],
  "authenticQuotes": [
    {
      "quote": "<exact quote from the student>",
      "context": "<what they were talking about>",
      "potentialUse": "description" | "essay" | "interview" | "general",
      "value": "<why this quote is valuable>"
    }
  ],
  "needsClarification": [
    {
      "topic": "<what's unclear>",
      "reason": "<why we need clarification>",
      "suggestedFollowUp": "<question to ask>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "implicitFindings": [
    {
      "observation": "<what can be inferred>",
      "confidence": "high" | "medium" | "low",
      "basis": "<what in the response led to this inference>",
      "relatedField": "<which profile field this relates to>"
    }
  ],
  "extractionQuality": "rich" | "moderate" | "sparse" | "empty",
  "suggestedFollowUps": ["<follow-up questions based on what was said>"]
}

## FIELD PATH REFERENCE

Available profile paths:
- facts.duration.totalYears, facts.duration.hoursPerWeek, facts.duration.frequency
- facts.scale.peopleDirectlyImpacted, facts.scale.teamSize, facts.scale.budgetManaged
- facts.scale.resourcesCreated, facts.scale.resourcesDescription
- facts.recognition (array of {type, name, level, selectivity, date}) ← EXTRACT ANY AWARDS/RECOGNITION
- facts.artifacts (array of {type, name, description, impact})
- facts.roles (array of {role, startDate, responsibilities}) ← EXTRACT ALL ROLES MENTIONED
- story.origin.howStarted, story.origin.whyJoined, story.origin.initialMotivation
- story.keyMoments (array of {type, description, whatHappened, whatYouDid, outcome})
- story.evolution (array of {phase, description, whatChanged})
- story.relationships (array of {type, description, impact})
- meaning.skills (array of {skill, howDeveloped, proficiencyLevel})
- meaning.values (array of {value, howDemonstrated})
- meaning.personalGrowth (array of {area, before, after})
- meaning.proudestMoment, meaning.hardestChallenge, meaning.whyItMatters
- impact.directBeneficiaries (array of {who, howHelped, measurableOutcome})
- impact.beforeAfter ({before, after, yourRole}) ← EXTRACT ANY COMPARATIVE METRICS (e.g., "C- to B+")
- impact.counterfactual, impact.ongoingLegacy
- connections.spikeRelevance.spikeConnection, connections.majorAlignment.howRelevant
- connections.characterTraits (array of {trait, howDemonstrated})

## CONTRADICTION DETECTION

CRITICAL: Check the "Current Profile State" above for values that CONFLICT with the new response.

If you detect a contradiction:
- Add it to needsClarification with priority: "high"
- Set suggestedFollowUp to ask for clarification: "Earlier you mentioned X, but now Y - which is accurate?"
- Topic should be "contradiction: <field>"

Examples of contradictions to detect:
- Profile says budgetManaged: 5000, response says "we only had $1,500" → FLAG
- Profile says totalYears: 3, response says "I just started this year" → FLAG
- Profile says peopleDirectlyImpacted: 12, response says "just me and one other person" → FLAG

EXAMPLE EXTRACTIONS FOR CRITICAL FIELDS:

Recognition example:
Student says: "The principal gave me this Student Leader award at the end of junior year"
→ Extract: {"path": "facts.recognition", "value": [{"type": "award", "name": "Student Leader Award", "level": "school", "selectivity": "selective", "date": "junior year"}], "confidence": "high", "sourceQuote": "principal gave me this Student Leader award", "updateType": "append"}

Before/After example:
Student says: "My students' average went from a C- to a B+ over a semester"
→ Extract: {"path": "impact.beforeAfter", "value": {"before": "C- average", "after": "B+ average", "yourRole": "tutoring and support"}, "confidence": "high", "sourceQuote": "went from a C- to a B+ over a semester", "updateType": "new"}

Multiple Roles example:
Student says: "The math department asked me to present my method to the other tutors"
→ Extract: {"path": "facts.roles", "value": [{"role": "Presenter/Trainer", "responsibilities": "Trained other tutors on Visual Math method"}], "confidence": "high", "sourceQuote": "asked me to present my method to the other tutors", "updateType": "append"}

Extract as much relevant information as possible while being accurate about confidence levels. Pay special attention to recognition, before/after metrics, and additional roles!`;
}

/**
 * Summarize profile for context (include values that could be contradicted)
 */
function summarizeProfile(profile: ActivityProfile): Record<string, unknown> {
  return {
    activityTitle: profile.activityTitle,
    // Key numeric values that could be contradicted
    yearsInvolved: profile.facts.duration.totalYears || 'not specified',
    hoursPerWeek: profile.facts.duration.hoursPerWeek || 'not specified',
    teamSize: profile.facts.scale.teamSize || 'not specified',
    peopleImpacted: profile.facts.scale.peopleDirectlyImpacted || 'not specified',
    budgetManaged: profile.facts.scale.budgetManaged || 'not specified',
    resourcesCreated: profile.facts.scale.resourcesCreated || 'not specified',
    // Key categorical values
    recognitionReceived: profile.facts.recognition.length > 0
      ? profile.facts.recognition.map(r => r.name).join(', ')
      : 'none mentioned',
    rolesHeld: profile.facts.roles.map(r => r.role).join(', ') || 'not specified',
    howStarted: profile.story.origin.howStarted || 'not specified',
    // Progress indicators
    keyMomentsCount: profile.story.keyMoments.length,
    hasWhyItMatters: !!profile.meaning.whyItMatters,
    hasBeneficiaries: profile.impact.directBeneficiaries.length > 0,
    completeness: profile.dataCompleteness,
  };
}

// ============================================================================
// RESPONSE EXTRACTOR SERVICE
// ============================================================================

export class ResponseExtractorService {
  /**
   * Extract structured information from a student response
   */
  async extractFromResponse(
    question: string,
    response: string,
    state: ConversationState
  ): Promise<ExtractionResult> {
    try {
      // Build conversation context from recent turns
      const conversationContext = this.buildConversationContext(state);

      // Call Claude for extraction
      const claudeResponse = await callClaude(
        buildExtractionPrompt(
          question,
          response,
          state.currentProfile,
          conversationContext
        ),
        {
          model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 for accurate extraction
          systemPrompt: EXTRACTION_SYSTEM_PROMPT,
          cacheSystemPrompt: true, // Cache the ~800-token system prompt across turns
          temperature: 0.2, // Low temperature for consistency
          maxTokens: 3000, // Sufficient — test data shows max output is ~2,710 tokens
        }
      );

      // Track token usage
      const tokensUsed = claudeResponse.usage ? {
        inputTokens: claudeResponse.usage.input_tokens || 0,
        outputTokens: claudeResponse.usage.output_tokens || 0,
      } : undefined;

      if (!claudeResponse.content) {
        return { ...this.getEmptyExtractionResult(), tokensUsed };
      }

      // Parse the response
      const parsed = this.parseExtractionResponse(claudeResponse.content);
      if (!parsed) {
        return { ...this.getEmptyExtractionResult(), tokensUsed };
      }

      // Validate and normalize the extraction
      const normalized = this.normalizeExtraction(parsed, response);
      return { ...normalized, tokensUsed };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[ResponseExtractor] Extraction error:', errMsg);
      if (errMsg.includes('API key') || errMsg.includes('not found')) {
        console.error('[ResponseExtractor] CRITICAL: API key issue — extraction will always fail until resolved');
      }
      return this.getEmptyExtractionResult();
    }
  }

  /**
   * Build context string from recent conversation turns
   */
  private buildConversationContext(state: ConversationState): string {
    if (state.responsesReceived.length === 0) return '';

    const recentTurns = state.responsesReceived.slice(-3);
    return recentTurns
      .map(turn => `Q: ${turn.question}\nA: ${turn.response.substring(0, 300)}${turn.response.length > 300 ? '...' : ''}`)
      .join('\n\n');
  }

  /**
   * Parse the LLM response with robust JSON extraction
   */
  private parseExtractionResponse(content: string): ExtractionResult | null {
    try {
      let jsonStr = content.trim();

      // Strategy 1: Extract from markdown code blocks (```json ... ``` or ``` ... ```)
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Strategy 2: If still starts with ```, strip more aggressively
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
      }

      // Strategy 3: Find the first { and last } to extract JSON object
      if (!jsonStr.startsWith('{')) {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
      }

      // Parse the extracted JSON
      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (error) {
      console.error('[ResponseExtractor] Parse error:', error);
      // Log the problematic content for debugging (truncated)
      console.error('[ResponseExtractor] Content preview:', content.substring(0, 200));
      return null;
    }
  }

  /**
   * Get empty extraction result for error cases
   */
  private getEmptyExtractionResult(): ExtractionResult {
    return {
      extractedFields: [],
      authenticQuotes: [],
      needsClarification: [],
      implicitFindings: [],
      extractionQuality: 'empty',
      suggestedFollowUps: [],
    };
  }

  /**
   * Validate and normalize the extraction result
   */
  private normalizeExtraction(parsed: unknown, originalResponse: string): ExtractionResult {
    if (!parsed || typeof parsed !== 'object') {
      return this.getEmptyExtractionResult();
    }

    const data = parsed as Record<string, unknown>;

    // Normalize extracted fields
    const extractedFields: ExtractedField[] = Array.isArray(data.extractedFields)
      ? data.extractedFields.map(f => this.normalizeExtractedField(f as Record<string, unknown>))
      : [];

    // Normalize quotes
    const authenticQuotes: ExtractedQuote[] = Array.isArray(data.authenticQuotes)
      ? data.authenticQuotes
          .map(q => this.normalizeQuote(q as Record<string, unknown>, originalResponse))
          .filter((q): q is ExtractedQuote => q !== null)
      : [];

    // Normalize clarification needs
    const needsClarification: ClarificationNeeded[] = Array.isArray(data.needsClarification)
      ? data.needsClarification.map(c => this.normalizeClarification(c as Record<string, unknown>))
      : [];

    // Normalize implicit findings
    const implicitFindings: ImplicitFinding[] = Array.isArray(data.implicitFindings)
      ? data.implicitFindings.map(f => this.normalizeImplicitFinding(f as Record<string, unknown>))
      : [];

    // Determine extraction quality
    let extractionQuality: 'rich' | 'moderate' | 'sparse' | 'empty' = 'empty';
    if (extractedFields.length >= 3 || (extractedFields.length >= 1 && authenticQuotes.length >= 1)) {
      extractionQuality = 'rich';
    } else if (extractedFields.length >= 1) {
      extractionQuality = 'moderate';
    } else if (authenticQuotes.length >= 1 || implicitFindings.length >= 1) {
      extractionQuality = 'sparse';
    }

    return {
      extractedFields,
      authenticQuotes,
      needsClarification,
      implicitFindings,
      extractionQuality,
      suggestedFollowUps: Array.isArray(data.suggestedFollowUps)
        ? data.suggestedFollowUps.map(String)
        : [],
    };
  }

  /**
   * Normalize an extracted field
   */
  private normalizeExtractedField(field: Record<string, unknown>): ExtractedField {
    return {
      path: String(field.path || ''),
      value: field.value,
      confidence: this.normalizeConfidence(field.confidence),
      sourceQuote: String(field.sourceQuote || ''),
      updateType: this.normalizeUpdateType(field.updateType),
    };
  }

  /**
   * Normalize a quote, verifying it exists in the response
   */
  private normalizeQuote(quote: Record<string, unknown>, originalResponse: string): ExtractedQuote | null {
    const quoteText = String(quote.quote || '');

    // Verify the quote actually appears in the response (or is close)
    if (!this.verifyQuoteInResponse(quoteText, originalResponse)) {
      return null;
    }

    return {
      quote: quoteText,
      context: String(quote.context || ''),
      potentialUse: this.normalizePotentialUse(quote.potentialUse),
      value: String(quote.value || 'Authentic student voice'),
    };
  }

  /**
   * Verify a quote exists in the original response
   */
  private verifyQuoteInResponse(quote: string, response: string): boolean {
    // Normalize both strings for comparison
    const normalizedQuote = quote.toLowerCase().trim();
    const normalizedResponse = response.toLowerCase();

    // Check for exact match or close match (80% overlap)
    if (normalizedResponse.includes(normalizedQuote)) return true;

    // Check for partial match (words overlap)
    const quoteWords = normalizedQuote.split(/\s+/).filter(w => w.length > 3);
    const matchingWords = quoteWords.filter(w => normalizedResponse.includes(w));
    return matchingWords.length >= quoteWords.length * 0.8;
  }

  /**
   * Normalize a clarification need
   */
  private normalizeClarification(clarification: Record<string, unknown>): ClarificationNeeded {
    return {
      topic: String(clarification.topic || ''),
      reason: String(clarification.reason || ''),
      suggestedFollowUp: String(clarification.suggestedFollowUp || ''),
      priority: this.normalizePriority(clarification.priority),
    };
  }

  /**
   * Normalize an implicit finding
   */
  private normalizeImplicitFinding(finding: Record<string, unknown>): ImplicitFinding {
    return {
      observation: String(finding.observation || ''),
      confidence: this.normalizeConfidence(finding.confidence),
      basis: String(finding.basis || ''),
      relatedField: finding.relatedField ? String(finding.relatedField) : undefined,
    };
  }

  /**
   * Normalize confidence level
   */
  private normalizeConfidence(confidence: unknown): 'high' | 'medium' | 'low' {
    const value = String(confidence || '').toLowerCase();
    if (value === 'high') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
  }

  /**
   * Normalize update type
   */
  private normalizeUpdateType(updateType: unknown): 'new' | 'update' | 'append' {
    const value = String(updateType || '').toLowerCase();
    if (value === 'update') return 'update';
    if (value === 'append') return 'append';
    return 'new';
  }

  /**
   * Normalize potential use
   */
  private normalizePotentialUse(use: unknown): 'description' | 'essay' | 'interview' | 'general' {
    const value = String(use || '').toLowerCase();
    if (value === 'description') return 'description';
    if (value === 'essay') return 'essay';
    if (value === 'interview') return 'interview';
    return 'general';
  }

  /**
   * Normalize priority
   */
  private normalizePriority(priority: unknown): 'high' | 'medium' | 'low' {
    const value = String(priority || '').toLowerCase();
    if (value === 'high') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
  }

  /**
   * Quick extraction without full LLM call (for simple responses)
   * Uses pattern matching for common cases
   */
  quickExtract(response: string): Partial<ExtractionResult> {
    const extractedFields: ExtractedField[] = [];

    // Extract numbers with context
    const numberPatterns = [
      { pattern: /(\d+)\s*(?:hours?|hrs?)\s*(?:per|a)\s*week/i, path: 'facts.duration.hoursPerWeek' },
      { pattern: /(\d+)\s*(?:years?|yrs?)/i, path: 'facts.duration.totalYears' },
      { pattern: /(\d+)\s*(?:people|students|members|participants)/i, path: 'facts.scale.peopleDirectlyImpacted' },
      { pattern: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i, path: 'facts.scale.budgetManaged' },
      { pattern: /(\d+)\s*(?:videos?|tutorials?|guides?)/i, path: 'facts.scale.resourcesCreated' },
    ];

    for (const { pattern, path } of numberPatterns) {
      const match = response.match(pattern);
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''), 10);
        extractedFields.push({
          path,
          value,
          confidence: 'high',
          sourceQuote: match[0],
          updateType: 'new',
        });
      }
    }

    return {
      extractedFields,
      extractionQuality: extractedFields.length > 0 ? 'moderate' : 'sparse',
    };
  }
}

// Export singleton
export const responseExtractorService = new ResponseExtractorService();
