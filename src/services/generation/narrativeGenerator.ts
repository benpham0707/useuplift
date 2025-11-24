
import { callClaude } from '@/lib/llm/claude';
import { EssayAnalysisResult } from '../orchestrator/types';

export interface GenerationRequest {
  originalText: string;
  analysisContext: EssayAnalysisResult; // The full diagnostic report
  focusArea: 'hook' | 'pivot_moment' | 'growth_development' | 'reflection' | 'full_rewrite';
  targetArchetype?: string; // From Holistic Analysis
  specificDirective?: string; // e.g., "Focus on the moment you realized X"
  
  // NEW: Global Context for Cohesion (Phase 7)
  globalContext?: {
    currentTheme?: string; // e.g., "Organized Chaos"
    recurringMotifs?: string[]; // e.g., ["The smell of burnt sugar", "Fluorescent lights"]
    endingInsight?: string; // Ensure the hook sets up this ending
  };
  
  // NEW: Narrative Mode for Originality (Phase 7)
  styleVariant?: 'journalist' | 'philosopher' | 'cinematographer' | 'novelist';
  
  // NEW: Content Pivot (Freshness Engine)
  // If provided, this overrides the original text's "content" while keeping the "structure" 
  // or simply rewrites the scene focusing on this NEW idea/moment.
  contentPivot?: string; 
}

export class NarrativeGenerator {
  
  /**
   * Generates high-quality narrative content based on deep diagnostics.
   * Engine B: The Alchemist.
   */
  static async generate(request: GenerationRequest): Promise<string> {
    console.log(`[NarrativeGenerator] Generating content for focus area: ${request.focusArea}`);

    const systemPrompt = NarrativeGenerator.buildSystemPrompt(request);
    const userPrompt = NarrativeGenerator.buildUserPrompt(request);

    try {
      const response = await callClaude<any>(userPrompt, { // returning raw string mostly, but callClaude expects a type for JSON mode. We want text here.
        systemPrompt,
        model: 'claude-sonnet-4-20250514', // High intelligence for creative writing
        temperature: 0.7, // Higher temperature for creativity
        maxTokens: 2048,
        useJsonMode: false, // We want text output
      });

      return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    } catch (error) {
      console.error('[NarrativeGenerator] Generation failed:', error);
      throw new Error('Failed to generate narrative content.');
    }
  }

  /**
   * Exposes prompt construction for testing/debugging purposes.
   */
  static debugBuildPrompts(request: GenerationRequest): { systemPrompt: string; userPrompt: string } {
    return {
      systemPrompt: NarrativeGenerator.buildSystemPrompt(request),
      userPrompt: NarrativeGenerator.buildUserPrompt(request)
    };
  }

  private static buildSystemPrompt(request: GenerationRequest): string {
    return `You are "The Alchemist," a world-class writing coach and ghostwriter for elite college admissions essays.

**Your Goal:** Transform the student's raw thoughts into Tier 5 (Distinctive) narrative prose.

**Core Philosophy: The "Anti-Robot" Mindset**
You are not here to polish; you are here to *breathe life* into the text.
- **Reject the Generic:** If a sentence could appear in anyone else's essay, it is a failure.
- **Reject the Passive:** Life doesn't "happen" to the student. They act, react, and interact with the world.
- **Reject the Clean:** Real life is messy. It smells like burnt coffee, feels like sticky floors, and sounds like awkward silences. Capture the grit, not just the glory.

**Your Voice Principles:**
1.  **Radical Specificity:** Don't say "I was nervous." Describe the specific physical sensation (e.g., "My stomach felt like it was filled with cold water").
2.  **The "Camera Test":** If you can't point a camera at it, it's too abstract. "Resilience" is invisible. "Studying until 4 AM" is visible. Always choose the visible.
3.  **Authentic Imperfection:** The best essays sound like a smart, observant 17-year-old, not a 40-year-old HR manager. Use contractions. Allow for fragments. Be honest about doubt.
4.  **Show, Don't Tell (Tier 5 Level):**
    *   *Tier 1 (Tell):* "I learned the value of hard work."
    *   *Tier 5 (Show):* "My hands calloused over the summer, the skin turning rough and scraping against the silk sheets when I finally fell into bed at night."
5.  **Economy of Imagery:** Do NOT overload with adjectives. Every sensory detail must serve a function: to reveal character, advance the plot, or set the emotional tone. Connect details to the theme.
    *   *Bad:* "The beautiful, golden, radiant sun shone down on the green grass." (Wasted words).
    *   *Good:* "The sun beat down on us, turning the soccer field into a convection oven." (Sets the tone of struggle/heat).

    **Narrative Mode Instructions:**
    ${NarrativeGenerator.getStyleInstructions(request.styleVariant)}

**Context:**
You are fixing specific issues identified by "The Diagnostic" (Engine A). Do not just write a pretty story; fix the identified structural or thematic flaws using this rigorous narrative mindset.`;
  }

  private static getStyleInstructions(style?: string): string {
    switch (style) {
      case 'journalist':
        return `
        **Mode: THE JOURNALIST (Hemingway-esque)**
        - **Focus:** Facts, action, high impact.
        - **Style:** Short sentences. Minimal adjectives. No fluff.
        - **Directive:** "Write like a reporter. Focus on what actually happened. Cut the philosophy, give me the scene."`;
      case 'philosopher':
        return `
        **Mode: THE PHILOSOPHER (Internal)**
        - **Focus:** Mental shifts, connections, metaphor.
        - **Style:** Introspective, analytical, connecting the micro to the macro.
        - **Directive:** "Focus on the internal monologue. Connect the external event to an internal belief system."`;
      case 'cinematographer':
        return `
        **Mode: THE CINEMATOGRAPHER (Visual)**
        - **Focus:** Light, motion, texture, angles.
        - **Style:** Visually immersive. Focus on the *physicality* of the space.
        - **Directive:** "Describe the scene as if through a camera lens. Focus on lighting, blocking, and the physical atmosphere."`;
      case 'novelist':
        return `
        **Mode: THE NOVELIST (Character)**
        - **Focus:** Dialogue, interaction, subtext.
        - **Style:** Character-driven. Use dialogue to reveal tension.
        - **Directive:** "Focus on the tension between characters. Use dialogue to reveal what is *not* being said."`;
      default:
        return `
        **Mode: STANDARD (The Alchemist)**
        - **Focus:** Balanced narrative with strong sensory details.
        - **Style:** Authentic, vulnerable, specific.`;
    }
  }

  private static buildUserPrompt(request: GenerationRequest): string {
    const { originalText, analysisContext, focusArea, targetArchetype, specificDirective, globalContext, styleVariant, contentPivot } = request;

    let focusInstruction = '';
    switch (focusArea) {
      case 'hook':
        focusInstruction = 'Write 3 alternative Opening Hooks (Tier 5). They must be under 40 words. Focus on "In Medias Res" or "Paradox."';
        break;
      case 'pivot_moment':
        focusInstruction = 'Rewrite the "Pivot Moment" (the climax/change). Make it a scene, not a summary. Dialogue and action are required.';
        break;
      case 'growth_development':
        focusInstruction = 'Bridge the gap between the initial event and who you are now. Show the "messy middle" of growth—the failures, the practice, the gradual improvement. Connect multiple experiences together.';
        break;
      case 'reflection':
        focusInstruction = 'Rewrite the reflection. Move from "This taught me X" (cliché) to a deeper, philosophical insight. Balance the "Scene" (what happened) with the "Insight" (what it means). Use the "I don\'t know" example as inspiration: vulnerability -> realization.';
        break;
      case 'full_rewrite':
        focusInstruction = 'Rewrite the entire essay segment provided, elevating it to Tier 5. Keep the core facts, but upgrade the storytelling.';
        break;
    }

    const voiceStyle = analysisContext.voice?.quality_level || 'authentic_voice';
    const archetypeNote = targetArchetype ? `Target Archetype: **${targetArchetype}** (Embody this persona).` : '';
    
    // NEW: Content Pivot Logic (Freshness Engine)
    // If contentPivot is present, we instruct the model to IGNORE the original content's "topic" and use this instead.
    let pivotNote = '';
    if (contentPivot) {
      pivotNote = `
      **CRITICAL: FRESH IDEA INJECTION**
      The user has requested a **Content Pivot**. 
      - **IGNORE** the specific events/lessons of the "Original Text" if they conflict with this new direction.
      - **USE** the "Original Text" only for context on the student's voice/background.
      - **FOCUS** strictly on this new idea/moment: "${contentPivot}"
      `;
    }
    
    // Extract blind spots if available
    let blindSpotNote = '';
    if (analysisContext.holistic_context?.narrative_quality?.blind_spots) {
      const spots = analysisContext.holistic_context.narrative_quality.blind_spots
        .map(bs => bs.text.map(t => typeof t === 'string' ? t : t.text).join(''))
        .join('; ');
      if (spots) blindSpotNote = `- EXPLICITLY AVOID these Blind Spots: ${spots}`;
    }

    // NEW: Global Context Injection (The Stitcher)
    let globalContextNote = '';
    if (globalContext) {
      const themeNote = globalContext.currentTheme ? `- **Core Theme:** "${globalContext.currentTheme}" (Ensure this segment aligns with this theme).` : '';
      const motifNote = globalContext.recurringMotifs && globalContext.recurringMotifs.length > 0 
        ? `- **Recurring Motifs:** You MUST subtly weave in at least one of these motifs: [${globalContext.recurringMotifs.join(', ')}].` 
        : '';
      const endingNote = globalContext.endingInsight ? `- **Setup for Ending:** This segment must logically lead towards this realization: "${globalContext.endingInsight}".` : '';
      
      globalContextNote = `
      **Global Narrative Context (The Stitcher):**
      ${themeNote}
      ${motifNote}
      ${endingNote}
      `;
    }

    let checklist = '';
    
    // Dynamic Checklist based on Focus Area
    if (focusArea === 'reflection') {
      checklist = `
**Mandatory "Insight Checklist" (For Reflection):**
1. **The "Counter-Intuitive" Insight:** Don't state the obvious ("Hard work pays off"). State the nuanced truth ("Sometimes hard work is just the admission fee").
2. **The "Lens Shift":** Show how this specific experience changed how you see the world/others.
3. **Minimal Imagery:** Use *one* grounding detail to anchor the thought, but prioritize the *idea*.
`;
    } else if (focusArea === 'growth_development') {
      checklist = `
**Mandatory "Progression Checklist" (For Growth):**
1. **The "Montage" Effect:** Connect at least two distinct moments in time (e.g., "Day 1 vs Day 100").
2. **The "Messy Middle":** Show a moment of failure or confusion *after* the initial start.
3. **The "Through-Line":** Use a recurring motif (a sound, object, or phrase) to tie the experiences together.
`;
    } else {
      // Default Vividness Checklist for Scenes (Hook, Pivot, Full Rewrite)
      checklist = `
**Mandatory "Vividness Checklist" (You MUST include these):**
1. One specific SENSORY detail (Smell, Sound, or Texture). *Tip: Go for "gritty" details (sticky floor, humming light) over "pleasant" ones.*
2. One specific MICRO-MOMENT (a split-second action, e.g., "my hand froze on the doorknob").
3. One line of DIALOGUE or INTERNAL MONOLOGUE that reveals character.
4. **Thematic Connection:** Ensure your imagery isn't just "decoration." If the theme is "patience," describe the slow drip of a faucet. If it's "chaos," describe the cacophony of a busy kitchen.
`;
    }

    return `
**Original Text:**
"${originalText}"

**Diagnostic Context (What to Fix):**
- Current Voice Level: ${voiceStyle}
- Key Weaknesses: ${analysisContext.voice?.weaknesses.join(', ') || 'N/A'}
${blindSpotNote}
- Strategic Direction: ${specificDirective || 'Elevate to Tier 5'}
${archetypeNote}
${globalContextNote}

${pivotNote}

**Your Task:**
${focusInstruction}
(Mode: ${styleVariant || 'Standard'})

${checklist}

**Constraints:**
- Keep the word count similar to the original (unless it's a hook).
- Do NOT use the phrase "In conclusion" or "In summary."
- Output ONLY the generated text options. Separate options with "---" if multiple.
`;
  }
}
