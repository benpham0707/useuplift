/**
 * Symptom Diagnoser Service
 * 
 * A specialized analyzer that identifies the specific NARRATIVE WEAKNESS in a target snippet.
 * This runs BEFORE generation to ensure the "Surgical Editor" knows exactly what problem to solve.
 * 
 * Instead of relying on the Rubric Category (which is broad), this identifies the Symptom (Specific).
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';

export interface SymptomDiagnosis {
    diagnosis: string; // "Passive voice masking agency"
    specific_weakness: string; // "The verb 'was captivated' is abstract."
    prescription: string; // "Convert to active verb showing the moment of fascination."
    symptom_type: 'abstract_language' | 'passive_agency' | 'cliche_metaphor' | 'telling_not_showing' | 'generic_pacing' | 'weak_verb';
    missing_elements: {
        sensory_details?: string[]; // What specific sensory anchors are missing?
        concrete_objects?: string[]; // What objects/numbers/specifics could ground this?
        micro_moment?: string; // What grounding scene/moment is missing?
        emotional_truth?: string; // What feeling is told but not shown?
    };
}

const DIAGNOSIS_SYSTEM_PROMPT = `You are a precise Narrative Diagnostician.
Your job is to look at a specific sentence from a college essay and identify its NARRATIVE WEAKNESS.
Do not rewrite it. Just diagnose it with DEPTH.

**Classification Types:**
1. **abstract_language**: Uses concepts (success, passion, values) without concrete anchors.
2. **passive_agency**: Things happen to the narrator ("I was tasked", "Ideas flowed") rather than narrator doing things.
3. **cliche_metaphor**: Overused comparisons (puzzles, journeys, unlocking).
4. **telling_not_showing**: Summarizing events ("I worked hard") instead of depicting them.
5. **generic_pacing**: Flat sentence structure that kills momentum.
6. **weak_verb**: Using "to be" verbs or static verbs instead of action.

**CRITICAL: Identify Missing Elements**

For EVERY diagnosis, you must identify what's MISSING that would make this brilliant:

1. **sensory_details**: What specific sights, sounds, textures, or physical details are absent?
   - Example: Instead of "I felt frustrated" → MISSING: "the blinking cursor", "the red error text", "crumpled paper"

2. **concrete_objects**: What numbers, ages, specific objects, or proper nouns would ground this?
   - Example: Instead of "many sets" → MISSING: "fourteen different Lego sets", "the Ninjago spacecraft"

3. **micro_moment**: What single grounding scene or moment would anchor this abstraction?
   - Example: Instead of "I lost interest" → MISSING: "The last time I touched my Legos, I tried to rebuild..."

4. **emotional_truth**: What specific feeling is being TOLD but not SHOWN through action/reaction?
   - Example: Instead of "I was passionate" → MISSING: "I'd been tracking Jordan 1 prices for months"

**Output Format:**
JSON with fields: {
  diagnosis,
  specific_weakness,
  prescription,
  symptom_type,
  missing_elements: {
    sensory_details: ["blinking cursor", "red error messages"],
    concrete_objects: ["line 47", "semicolon"],
    micro_moment: "The moment they first saw the error",
    emotional_truth: "The specific frustration of not understanding"
  }
}
`;

export async function diagnoseSymptom(quote: string, surroundingContext: string): Promise<SymptomDiagnosis> {
    const prompt = `
    Analyze this text snippet:
    "${quote}"
    
    Context:
    "...${surroundingContext.substring(0, 100)}..."

    Diagnose the specific narrative weakness.
    `;

    try {
        const response = await callClaudeWithRetry(prompt, {
            systemPrompt: DIAGNOSIS_SYSTEM_PROMPT,
            temperature: 0.1, // High precision
            maxTokens: 400, // Increased for missing_elements
            useJsonMode: true
        });

        const result = typeof response.content === 'string' ? JSON.parse(response.content) : response.content;
        return {
            diagnosis: result.diagnosis || "General weakness detected",
            specific_weakness: result.specific_weakness || "Text lacks impact",
            prescription: result.prescription || "Strengthen imagery",
            symptom_type: result.symptom_type || "abstract_language",
            missing_elements: result.missing_elements || {
                sensory_details: [],
                concrete_objects: [],
                micro_moment: undefined,
                emotional_truth: undefined
            }
        };
    } catch (e) {
        console.error("Error in Symptom Diagnoser:", e);
        return {
            diagnosis: "Analysis failed",
            specific_weakness: "Could not determine specific weakness",
            prescription: "Improve clarity and specificty",
            symptom_type: "abstract_language",
            missing_elements: {
                sensory_details: [],
                concrete_objects: [],
                micro_moment: undefined,
                emotional_truth: undefined
            }
        };
    }
}




