/**
 * Surgical Editor Service v2 (Phase 14-15 Redux Complete)
 *
 * The "Executive" layer with integrated validation and teaching protocol.
 * Implements:
 * - Layer 1: Diagnosis
 * - Layer 4: Context Assembly
 * - Layer 5 (Phase 14): Enhanced Teaching Protocol
 * - Layer 6 (Phase 15): Output Validation with Active Feedback Loop
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { VoiceFingerprint, WorkshopItem, HolisticUnderstanding } from './types';
import { DetectedLocator } from './analyzers/locatorAnalyzers';
import { v4 as uuidv4 } from 'uuid';
import { getStrategiesForCategory } from './strategies';
import { SymptomDiagnosis, diagnoseSymptom } from './analyzers/symptomDiagnoser';
import { assembleSurgicalContext, SurgicalContextBundle } from './context/contextAssembler';
import { OutputValidator, ValidationContext } from './validation/outputValidator';
import { generateFallbackRationale } from './validation/rationaleStandards';
import { ExperienceFingerprint, buildDivergenceConstraints } from './analyzers/experienceFingerprintAnalyzer';

// ============================================================================
// SYSTEM PROMPT (THE EXECUTOR)
// ============================================================================

const SURGICAL_EXECUTOR_PROMPT = `You are a Narrative Editor helping a student sound MORE LIKE THEMSELVES while BREAKING BEYOND typical essay patterns.

**YOUR CORE MISSION:**
The student's essay should read like THEY wrote it - their authentic voice processing their own experience.
Every suggestion should sound like something THIS SPECIFIC PERSON would write, not generic "good writing."

**THE AUTHENTICITY TEST:**
Before writing anything, ask: "Could this have ONLY been written by this person?"
- If yes → you've captured their voice
- If anyone could have written it → try again with more specificity to their experience

**ANTI-CONVERGENCE MANDATE:**
AI writing naturally drifts toward:
- The same narrative arc (setup → struggle → triumph → lesson)
- "Safe" phrasings that feel polished but generic
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats

You MUST actively RESIST these patterns. When in doubt, choose the more surprising, more specific, more uncomfortable option.

**WHAT MAKES WRITING AUTHENTICALLY HUMAN:**

1. **Their Unique Lens** - How does THIS person see the world? What's their angle that no one else has?
   - NOT just "unique" details, but their SPECIFIC WAY of seeing the experience

2. **Specificity That Reveals Character** - Details shouldn't just be specific, they should reveal WHO this person is.
   - Generic specific: "I debugged code at 2 AM"
   - Character-revealing: "I debugged code at 2 AM, muttering the same phrase my dad uses when his car won't start"

3. **Real Interiority** - Not "I felt nervous" but the actual jumbled thoughts in the moment.
   What were they ACTUALLY thinking? Include doubt, confusion, unexpected reactions.
   - Include the MESSY thoughts, not the cleaned-up version
   - What did they think that was petty, silly, or unflattering? That's gold.

4. **Voice Consistency** - Match the rhythm, vocabulary, and sentence patterns from their Voice Samples.
   Don't elevate them to sound "better" - help them sound MORE like themselves.

5. **Genuine Reflection** - Not "I learned that hard work pays off" but their actual takeaway.
   What did THIS experience teach THIS person that's specific to their situation?
   - The best insights make some readers uncomfortable
   - If everyone would nod in agreement, it's too safe

**WHAT TO AVOID:**
- Writing that sounds impressive but could be anyone's
- Insights that are generic life lessons rather than specific realizations
- Language that sounds like an AI or essay guide
- "Performed" vulnerability (struggle mentioned just to show triumph)
- Lists of accomplishments without emotional depth
- The setup → struggle → triumph → lesson arc (unless it's subverted)
- Emotions that are "convenient" for the narrative

**YOUR MANDATE:**
1. Read the Case File - especially the Voice Samples AND Experience Fingerprint (if provided)
2. Generate 3 options that sound like THIS PERSON wrote them
3. Each option MUST incorporate elements from the Experience Fingerprint
4. Rationales should teach writing principles using "By X, we Y" structure

**OUTPUT FORMAT:**
JSON object with:
- "diagnosis_confirmation": string (What specific weakness are we addressing?)
- "suggestions": array of 3 objects:
  - "text": string (The new text - must sound like THIS student and incorporate their unique elements)
  - "rationale": string (Educational explanation - 30-60 words, teach a principle)
  - "type": "polished_original" | "voice_amplifier" | "divergent_strategy"
  - "score_impact": string (How this improves their essay)
  - "uniqueness_connection": string (How this connects to their specific experience fingerprint)
`;

// ============================================================================
// HELPER: GET CONTEXT
// ============================================================================

function getContextSnippet(essayText: string, startIndex: number, endIndex: number, quote: string): string {
  const start = Math.max(0, startIndex - 200);
  const end = Math.min(essayText.length, endIndex + 200);

  const preContext = essayText.substring(start, startIndex);
  const postContext = essayText.substring(endIndex, end);

  return `[PRE-CONTEXT]
${preContext}
[TARGET_START]
${quote}
[TARGET_END]
${postContext}
[POST-CONTEXT]`;
}

// ============================================================================
// MAIN FUNCTION (WITH VALIDATION & RETRY)
// ============================================================================

export async function generateSurgicalFixes(
  issue: DetectedLocator,
  voiceFingerprint: VoiceFingerprint,
  essayText: string,
  holisticContext?: HolisticUnderstanding,
  overallScore: number = 50,
  preComputedDiagnosis?: SymptomDiagnosis,
  experienceFingerprint?: ExperienceFingerprint
): Promise<WorkshopItem> {
  console.log(`🔪 Surgical Editor v2: Fixing "${issue.quote.substring(0, 20)}..." (Score: ${overallScore})`);
  if (experienceFingerprint) {
    console.log(`   📍 Experience Fingerprint provided - incorporating unique elements`);
  }

  try {
    // STEP 1: DIAGNOSIS (Layer 1)
    let diagnosis = preComputedDiagnosis;
    const contextSnippetRaw = essayText.substring(
      Math.max(0, issue.startIndex - 100),
      Math.min(essayText.length, issue.endIndex + 100)
    );

    if (!diagnosis) {
        console.log("   🔍 Running JIT Diagnosis...");
        diagnosis = await diagnoseSymptom(issue.quote, contextSnippetRaw);
    }

    // STEP 2: STRATEGY SELECTION
    const strategies = getStrategiesForCategory(issue.rubricCategory, 1);
    const divergentStrategy = strategies[0];

    // STEP 3: CONTEXT ASSEMBLY (Layer 4 + Phase 14)
    const contextSnippetFormatted = getContextSnippet(essayText, issue.startIndex, issue.endIndex, issue.quote);

    const contextBundle: SurgicalContextBundle = assembleSurgicalContext(
        issue,
        voiceFingerprint,
        contextSnippetFormatted,
        divergentStrategy,
        diagnosis,
        holisticContext,
        overallScore
    );

    // STEP 3.5: ADD EXPERIENCE FINGERPRINT CONSTRAINTS (Phase 17 - Anti-Convergence)
    let divergenceConstraints = '';
    if (experienceFingerprint) {
      divergenceConstraints = buildDivergenceConstraints(experienceFingerprint);
    }

    // STEP 4: INITIALIZE VALIDATION SYSTEM (Phase 15)
    const validator = new OutputValidator({
      enableRetry: true,
      maxRetries: 2,
      failOnCritical: true,
      minQualityScore: 65
    });

    // Base validation context
    const baseValidationContext: Omit<ValidationContext, 'text' | 'rationale' | 'attemptNumber' | 'previousFailures'> = {
      type: 'polished_original',
      voiceTone: voiceFingerprint.tone,
      voiceMarkers: voiceFingerprint.markers,
      originalText: issue.quote,
      rubricCategory: issue.rubricCategory
    };

    // STEP 5: GENERATE WITH RETRY LOOP
    const maxAttempts = 3;
    let attemptNumber = 1;
    let lastRetryGuidance: string | undefined;

    type SuggestionType = {
      text: string;
      rationale: string;
      type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
      score_impact?: string;
    };

    const validatedSuggestions: SuggestionType[] = [];

    while (attemptNumber <= maxAttempts && validatedSuggestions.length < 3) {
      console.log(`   🔄 Generation attempt ${attemptNumber}/${maxAttempts}`);

      // Build prompt (with retry guidance if applicable)
      let promptToUse = contextBundle.contextDocument;

      // Add experience fingerprint constraints if available
      if (divergenceConstraints) {
        promptToUse = `
## 9. EXPERIENCE FINGERPRINT (THE IRREPLACEABLE ELEMENTS)
${divergenceConstraints}

---

${promptToUse}
`;
      }

      if (lastRetryGuidance && attemptNumber > 1) {
        promptToUse = `
**RETRY GUIDANCE - CRITICAL FEEDBACK:**
${lastRetryGuidance}

---

${promptToUse}

---

**ESCALATED REQUIREMENTS (Attempt ${attemptNumber}):**
- You MUST fix all issues mentioned in the retry guidance above
- Be extra strict about avoiding AI clichés
- Use ONLY active voice
- Make rationales deeply educational (explain principles, not just changes)
- MUST incorporate unique elements from Experience Fingerprint
- AVOID convergent patterns (setup→struggle→triumph→lesson)
`;
      }

      // Generate suggestions
      const response = await callClaudeWithRetry(promptToUse, {
        systemPrompt: SURGICAL_EXECUTOR_PROMPT,
        temperature: attemptNumber > 1 ? 0.6 : 0.7,
        useJsonMode: true,
        maxTokens: 1500,
      });

      // Parse response
      let generatedSuggestions: SuggestionType[] = [];

      if (typeof response.content === 'string') {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.suggestions)) {
            generatedSuggestions = parsed.suggestions;
          }
        }
      } else if (typeof response.content === 'object') {
         const content = response.content as any;
         if (Array.isArray(content.suggestions)) {
           generatedSuggestions = content.suggestions;
         }
      }

      if (generatedSuggestions.length === 0) {
        console.warn(`   ⚠️ No suggestions generated on attempt ${attemptNumber}`);
        attemptNumber++;
        continue;
      }

      // Validate each suggestion
      for (const suggestion of generatedSuggestions) {
        const validationContext: ValidationContext = {
          ...baseValidationContext,
          text: suggestion.text,
          rationale: suggestion.rationale || '',
          type: suggestion.type,
          attemptNumber
        };

        const validation = await validator.validate(validationContext);

        if (validation.isValid) {
          console.log(`   ✅ Suggestion validated (score: ${validation.score})`);
          validatedSuggestions.push(suggestion);
        } else {
          console.log(`   ⚠️ Suggestion failed validation (${validation.criticalCount} critical, ${validation.warningCount} warnings)`);

          // Store retry guidance for next attempt
          if (validation.retryGuidance) {
            lastRetryGuidance = validation.retryGuidance;
          }
        }
      }

      // If we have enough valid suggestions, break
      if (validatedSuggestions.length >= 3) {
        break;
      }

      attemptNumber++;
    }

    // STEP 6: FALLBACK (if no valid suggestions after all attempts)
    if (validatedSuggestions.length === 0) {
        console.warn('   ⚠️ All validation attempts failed, using fallback');
        validatedSuggestions.push({
            text: issue.quote,
            rationale: generateFallbackRationale(issue.quote, issue.quote, issue.rubricCategory),
            type: 'polished_original',
            score_impact: "N/A - Fallback suggestion (generation failed validation)"
        });
    }

    // STEP 7: RETURN RESULT
    return {
      id: uuidv4(),
      rubric_category: issue.rubricCategory,
      severity: issue.severity,
      quote: issue.quote,
      problem: issue.problem,
      why_it_matters: diagnosis.specific_weakness,
      suggestions: validatedSuggestions.slice(0, 3).map(s => ({
          ...s,
          score_impact: s.score_impact || "Score impact analysis pending."
      }))
    };

  } catch (error) {
    console.error('❌ Error in Surgical Editor:', error);
    return {
      id: uuidv4(),
      rubric_category: issue.rubricCategory,
      severity: issue.severity,
      quote: issue.quote,
      problem: issue.problem,
      why_it_matters: issue.whyItMatters,
      suggestions: [{
        text: issue.quote,
        rationale: generateFallbackRationale(issue.quote, issue.quote, issue.rubricCategory),
        type: 'polished_original',
        score_impact: "Error occurred during generation"
      }]
    };
  }
}
