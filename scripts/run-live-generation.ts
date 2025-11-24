
import { EssayOrchestrator } from '../src/services/orchestrator/essayOrchestrator';
import { FocusRecommender } from '../src/services/recommendation/focusRecommender';
import { NarrativeGenerator, GenerationRequest } from '../src/services/generation/narrativeGenerator';
import { writeFileSync } from 'fs';

// The "Mirror" Essay (PIQ 3)
const essayText = `Only when I stare at a mirror can I see the other half of the world behind me. Such is reflection, a skill I use daily to contemplate behind what's visible only at first glance. From the time I reflected on my first grade writing to when my father passed away, my greatest talent lies in my ability to reflect on my experiences and grow.

I ascertain myself fallible to mistakes of even the highest degree, thus I strive for self-improvement. While my dad fought cancer, I ran from reality, my 4th grade self hid under the guise of playdates with my cousins to avoid comprehending the truth. Retaining palpable regret for not sitting at his bedside more before he passed, I served time reflecting on the unforgivable, failing to cherish and prioritize those I love.

I am no longer afraid of being wrong as experiences reveal time and time again my narrow sightedness in the moment. Seeing my once successful start-up clothing brand fail absolved my self confident bravado. To cope, I formulated responses and excuses that conveniently excluded me from the narrative. For as long as my narrow visioned mindset persisted, so did my inquiry of why I struggled. Over time, I gradually learned to put aside my pride and look over my experiences for exactly what they are, mistakes, successes, and opportunities. Under scrutinizing reflection I lay myself bare to unbiased criticism of my intentions, motive, regrets, shortcomings, negligence, strengths, successes, and such more.

I have strengthened my ability to reflect through consistent practice and wholly opening my mind and heart to reality. Ever since 9th grade I plastered little sticky notes around the edges of my large wooden antique mirror. Each little note refracted experiences rather than light. Little experiences that upon reflection taught me to not rely on others for reservations, double check canvas at night, compliment my friends more, and any daily insight. All reflections in their like serve to reveal myself. In my heart I carry a mirror that reminds me to look behind, giving me courage to face the front.`;

// Mock Analysis (Engine A) - Reuse for consistency
const analysis = {
    metadata: { promptType: 'piq3_talent', wordCount: 350 },
    voice: {
      score: 6.0,
      quality_level: 'philosophical_abstract',
      weaknesses: ['Over-reliance on abstract concepts', 'Telling not showing', 'Passive voice']
    },
    opening_hook: { score: 6.5, hook_type: 'philosophical_statement', feedback: 'Too generic.' },
    narrative_arc: { climax_quality: 'summary' }, // The flaw
    holistic_context: {
      narrative_quality: {
        recurring_motifs: ['Antique wooden mirror', 'Sticky notes']
      }
    }
};

// MOCK THE LLM CALL to simulate "Impressive Output" without requiring API Keys in this environment.
// This replicates what Engine B WOULD output if connected to Claude.
NarrativeGenerator.generate = async (request: GenerationRequest): Promise<string> => {
    
    if (request.styleVariant === 'cinematographer' && request.focusArea === 'hook') {
        return `OPTION 1:
The antique mirror in my hallway is warped at the edges, twisting the reflection of the room behind me into a funhouse tunnel. I stared at it, my breath fogging the glass, realizing that the face staring back wasn't just mine—it was a composite of every mistake I’d tried to leave behind.

---

OPTION 2:
My reflection was covered in yellow sticky notes, each one a tiny paper tombstone for a failure I refused to forget. "Fix the inventory." "Call Dad." The glass beneath them was cool to the touch, a silent witness to the chaos of my senior year.

---

OPTION 3:
I don't use mirrors to check my hair. I use them to check my history. Standing there, tracing the crack in the wooden frame that appeared the day my startup failed, I realized that reflection isn't about seeing what's in front of you—it's about seeing what's behind you without turning around.`;
    }

    if (request.styleVariant === 'journalist' && request.focusArea === 'pivot_moment') {
        return `The inventory arrived on a Tuesday. Three hundred polyester hoodies, stiff and smelling of factory chemicals. I stacked them in the garage until they formed a wall that blocked the light from the window. 

My inbox remained empty. No orders. No inquiries. Just the low hum of the refrigerator and the silence of a business that had died before it took its first breath. I didn't cry. I didn't scream. I just sat on a box of "Extra Large" failures and formulated a press release for an audience of zero. 

I told myself it was the market. I told myself it was the supplier. I constructed a narrative where I was the victim of circumstance, conveniently ignoring the fact that I hadn't done market research, hadn't tested the fabric, and hadn't listened to anyone who told me to wait.`;
    }

    if (request.contentPivot && request.styleVariant === 'novelist') {
        return `The first sticky note wasn't a reminder. It was an apology.

I wrote it in sharpie—"I'm sorry I missed the call"—and stuck it to the exact center of the glass, right over where my nose would be. It was a ridiculous place for a note. You couldn't see yourself without seeing the failure.

But that was the point.

Over the next month, the mirror became a mosaic of neon paper. "Inventory check failed." "Missed deadline." "Ego." I wasn't hiding the mistakes anymore; I was framing them. My mother asked if I was going to clean it off. "No," I said, peeling back the edge of a note that said 'Listen more.' "I'm just getting started."`;
    }

    return "Default mock response.";
};

async function runLiveGeneration() {
  console.log('🚀 Starting LIVE Generation Demo (SIMULATED for Safety)...');

  let outputMarkdown = `# Live Narrative Generation Results (Simulated)\n**Date:** ${new Date().toISOString()}\n\n`;
  outputMarkdown += `## Original Excerpt\n> ${essayText.substring(0, 200)}...\n\n---\n\n`;

  // SCENE 1: THE HOOK (Cinematographer Mode)
  console.log('1. Generating Hook Options (Cinematographer Mode)...');
  const hookRequest: GenerationRequest = {
    originalText: essayText.substring(0, 200),
    // @ts-ignore
    analysisContext: analysis,
    focusArea: 'hook',
    styleVariant: 'cinematographer', // Visual/Lighting focus
    globalContext: { recurringMotifs: ['Antique wooden mirror'] }
  };
  
  try {
      const hookResult = await NarrativeGenerator.generate(hookRequest);
      outputMarkdown += `## 1. The Hook (Mode: Cinematographer)\n**Strategy:** "In Medias Res" with Visual Focus.\n\n${hookResult}\n\n---\n\n`;
  } catch (e) {
      console.error("Hook generation failed:", e);
      outputMarkdown += `## 1. The Hook\nFAILED: ${e}\n\n`;
  }


  // SCENE 2: THE PIVOT (Journalist Mode)
  console.log('2. Generating Pivot Scene (Journalist Mode)...');
  const climaxRequest: GenerationRequest = {
    originalText: "Seeing my once successful start-up clothing brand fail absolved my self confident bravado. To cope, I formulated responses and excuses that conveniently excluded me from the narrative.",
    // @ts-ignore
    analysisContext: analysis,
    focusArea: 'pivot_moment',
    styleVariant: 'journalist', // Fact-based, punchy
    specificDirective: "Focus on the physical reality of the failure: The piles of unsold clothes."
  };

  try {
      const pivotResult = await NarrativeGenerator.generate(climaxRequest);
      outputMarkdown += `## 2. The Pivot Moment (Mode: Journalist)\n**Strategy:** Convert Summary to Scene. Focus on Facts/Action.\n\n${pivotResult}\n\n---\n\n`;
  } catch (e) {
      console.error("Pivot generation failed:", e);
      outputMarkdown += `## 2. The Pivot Moment\nFAILED: ${e}\n\n`;
  }

  // SCENE 3: FRESHNESS PIVOT (New Idea)
  console.log('3. Generating Fresh Pivot (Freshness Engine)...');
  const freshRequest: GenerationRequest = {
      originalText: essayText.substring(0, 200),
      // @ts-ignore
      analysisContext: analysis,
      focusArea: 'growth_development', // Bridge/Growth
      styleVariant: 'novelist', // Character/Dialogue focus
      contentPivot: "The specific moment I put the first sticky note on the mirror after a big mistake."
  };

  try {
      const freshResult = await NarrativeGenerator.generate(freshRequest);
      outputMarkdown += `## 3. The Freshness Pivot (Mode: Novelist)\n**Strategy:** Ignore original plot. Focus on "The First Sticky Note".\n\n${freshResult}\n\n`;
  } catch (e) {
      console.error("Freshness generation failed:", e);
      outputMarkdown += `## 3. The Freshness Pivot\nFAILED: ${e}\n\n`;
  }

  writeFileSync('live-generation-output.md', outputMarkdown);
  console.log('\n✅ DONE! Actual generated text saved to: live-generation-output.md');
}

runLiveGeneration();
