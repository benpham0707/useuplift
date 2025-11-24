/**
 * Surgical Editor Service (Redux Architecture)
 *
 * The "Executive" layer that orchestrates the narrative repair process.
 * Instead of a monolithic prompt, it uses a "System of Systems" approach:
 * 1. Diagnoser (Layer 1)
 * 2. Context Assembler (Layer 4)
 * 3. Generator (Claude)
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { VoiceFingerprint, WorkshopItem, HolisticUnderstanding } from './types';
import { DetectedLocator } from './analyzers/locatorAnalyzers';
import { v4 as uuidv4 } from 'uuid';
import { getStrategiesForCategory, NarrativeStrategy } from './strategies';
import { SymptomDiagnosis, diagnoseSymptom } from './analyzers/symptomDiagnoser';
import { assembleSurgicalContext, SurgicalContextBundle } from './context/contextAssembler';

// ============================================================================
// SYSTEM PROMPT (THE EXECUTOR)
// ============================================================================

const SURGICAL_EXECUTOR_PROMPT = `You are an elite Narrative Editor executing a specific "Surgical Repair".
You will receive a "NARRATIVE CASE FILE" containing a clinical diagnosis, voice profile, and strict directives.

**YOUR MANDATE:**
1. Read the Case File.
2. Execute the 3 requested options (Polished Original, Voice Amplifier, Divergent Strategy).
3. Follow the "Teaching Protocol" for rationales.
4. Adhere strictly to the "Writing Protocol".

**CONSTRAINT CHECKLIST:**
- [ ] Do NOT use generic AI phrases ("tapestry", "testament", "showcase").
- [ ] Do NOT repeat the [PRE-CONTEXT] or [POST-CONTEXT] in your output.
- [ ] Maintain word count neutrality (concise & dense).
- [ ] MIMIC the specific Voice Samples provided.
- [ ] Ensure "Show Don't Tell" (Active Agents, Specific Nouns).

**OUTPUT FORMAT:**
JSON object with:
- "diagnosis_confirmation": string (Confirm you understand the specific weakness)
- "suggestions": array of 3 objects:
  - "text": string (The new text)
  - "rationale": string (The educational explanation)
  - "type": "polished_original" | "voice_amplifier" | "divergent_strategy"
  - "score_impact": string (How this improves the score)
`;

// ============================================================================
// HELPER: GET CONTEXT
// ============================================================================

function getContextSnippet(essayText: string, startIndex: number, endIndex: number, quote: string): string {
  // Get ~200 chars before and after
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
// MAIN FUNCTION
// ============================================================================

export async function generateSurgicalFixes(
  issue: DetectedLocator,
  voiceFingerprint: VoiceFingerprint,
  essayText: string,
  holisticContext?: HolisticUnderstanding,
  overallScore: number = 50,
  preComputedDiagnosis?: SymptomDiagnosis // Optional: Allow external diagnosis
): Promise<WorkshopItem> {
  console.log(`🔪 Surgical Editor: Fixing "${issue.quote.substring(0, 20)}..." (Score Tier: ${overallScore})`);

  try {
    // STEP 1: DIAGNOSIS (Layer 1)
    // If not provided by orchestrator, run it now.
    let diagnosis = preComputedDiagnosis;
    const contextSnippetRaw = essayText.substring(Math.max(0, issue.startIndex - 100), Math.min(essayText.length, issue.endIndex + 100));
    
    if (!diagnosis) {
        console.log("   🔍 Running JIT Diagnosis...");
        diagnosis = await diagnoseSymptom(issue.quote, contextSnippetRaw);
    }

    // STEP 2: STRATEGY SELECTION
    const strategies = getStrategiesForCategory(issue.rubricCategory, 1);
    const divergentStrategy = strategies[0];

    // STEP 3: CONTEXT ASSEMBLY (Layer 4)
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

    // STEP 4: GENERATION
    const response = await callClaudeWithRetry(
      contextBundle.contextDocument, // Pass the Case File as the user prompt
      {
        systemPrompt: SURGICAL_EXECUTOR_PROMPT,
        temperature: 0.7,
        useJsonMode: true,
        maxTokens: 1500,
      }
    );

    // STEP 5: PARSING & FILTERING
    let suggestions: Array<{ 
      text: string; 
      rationale: string; 
      type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
      score_impact?: string;
    }> = [];

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions;
        }
      }
    } else if (typeof response.content === 'object') {
       const content = response.content as any;
       if (Array.isArray(content.suggestions)) {
         suggestions = content.suggestions;
       }
    }

    // Banned Terms Filter (Phase 15 Prep)
    const BANNED_TERMS = [
        'tapestry', 'realm', 'unwavering', 'testament', 'delve', 'showcase', 
        'underscore', 'something', 'legs burning', 'gave 110%'
    ];
    
    suggestions = suggestions.filter(s => {
        const hasBanned = BANNED_TERMS.some(term => s.text.toLowerCase().includes(term));
        if (hasBanned) console.warn(`⚠️ Filtered suggestion with banned term: "${s.text.substring(0, 20)}..."`);
        return !hasBanned;
    });

    // Fallback
    if (suggestions.length === 0) {
        suggestions = [{
            text: issue.quote,
            rationale: "We couldn't generate a unique suggestion here. Try to make this part more concrete.",
            type: 'polished_original',
            score_impact: "N/A"
        }];
    }

    // Return Result
    return {
      id: uuidv4(),
      rubric_category: issue.rubricCategory,
      severity: issue.severity,
      quote: issue.quote,
      problem: issue.problem,
      why_it_matters: diagnosis.specific_weakness, // Use the precise diagnosis
      suggestions: suggestions.map(s => ({
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
      suggestions: []
    };
  }
}
