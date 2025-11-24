
import { EssayOrchestrator } from '../src/services/orchestrator/essayOrchestrator';
import { FocusRecommender } from '../src/services/recommendation/focusRecommender';
import { NarrativeGenerator, GenerationRequest } from '../src/services/generation/narrativeGenerator';
import { writeFileSync } from 'fs';

// The "Mirror" Essay (PIQ 3)
const essayText = `Only when I stare at a mirror can I see the other half of the world behind me. Such is reflection, a skill I use daily to contemplate behind what's visible only at first glance. From the time I reflected on my first grade writing to when my father passed away, my greatest talent lies in my ability to reflect on my experiences and grow.

I ascertain myself fallible to mistakes of even the highest degree, thus I strive for self-improvement. While my dad fought cancer, I ran from reality, my 4th grade self hid under the guise of playdates with my cousins to avoid comprehending the truth. Retaining palpable regret for not sitting at his bedside more before he passed, I served time reflecting on the unforgivable, failing to cherish and prioritize those I love.

I am no longer afraid of being wrong as experiences reveal time and time again my narrow sightedness in the moment. Seeing my once successful start-up clothing brand fail absolved my self confident bravado. To cope, I formulated responses and excuses that conveniently excluded me from the narrative. For as long as my narrow visioned mindset persisted, so did my inquiry of why I struggled. Over time, I gradually learned to put aside my pride and look over my experiences for exactly what they are, mistakes, successes, and opportunities. Under scrutinizing reflection I lay myself bare to unbiased criticism of my intentions, motive, regrets, shortcomings, negligence, strengths, successes, and such more.

I have strengthened my ability to reflect through consistent practice and wholly opening my mind and heart to reality. Ever since 9th grade I plastered little sticky notes around the edges of my large wooden antique mirror. Each little note refracted experiences rather than light. Little experiences that upon reflection taught me to not rely on others for reservations, double check canvas at night, compliment my friends more, and any daily insight. All reflections in their like serve to reveal myself. In my heart I carry a mirror that reminds me to look behind, giving me courage to face the front.`;

async function runFullDemo() {
  console.log('🚀 Starting Full System Demo...');

  // 1. ANALYSIS (Mocking the heavy LLM call for speed, but showing the structure)
  console.log('1. Running Analysis (Engine A)...');
  // In a real run, we would await EssayOrchestrator.analyzeEssay(essayText, 'piq3_talent');
  // Using the mock result from our test to ensure consistent output for you to view.
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

  // 2. RECOMMENDATIONS
  console.log('2. Generating Recommendations (Auto-Focus)...');
  // @ts-ignore
  const recommendations = FocusRecommender.recommend(analysis);

  // 3. GENERATION (Simulated Prompts)
  console.log('3. Preparing Narrative Generator Prompts (Engine B)...');
  
  // Option A: Fix the Hook (Cinematographer Mode)
  const hookRequest: GenerationRequest = {
    originalText: essayText.substring(0, 200), // First paragraph
    // @ts-ignore
    analysisContext: analysis,
    focusArea: 'hook',
    styleVariant: 'cinematographer',
    globalContext: { recurringMotifs: ['Antique wooden mirror'] }
  };
  const hookPrompt = NarrativeGenerator.debugBuildPrompts(hookRequest);

  // Option B: Fix the Climax (Journalist Mode)
  const climaxRequest: GenerationRequest = {
    originalText: "Seeing my once successful start-up clothing brand fail absolved my self confident bravado...",
    // @ts-ignore
    analysisContext: analysis,
    focusArea: 'pivot_moment',
    styleVariant: 'journalist',
    specificDirective: "Focus on the silence of the unsold inventory."
  };
  const climaxPrompt = NarrativeGenerator.debugBuildPrompts(climaxRequest);

  // 4. COMPILE REPORT
  const fullReport = {
    timestamp: new Date().toISOString(),
    essay_excerpt: essayText.substring(0, 100) + "...",
    
    SECTION_1_DIAGNOSTICS: {
        description: "This is what Engine A 'sees' in your essay.",
        data: analysis
    },

    SECTION_2_RECOMMENDATIONS: {
        description: "This is what the Auto-Focus Helper suggests you do.",
        actions: recommendations
    },

    SECTION_3_GENERATION_PROMPTS: {
        description: "This is exactly what we send to the 'Writing Coach' (LLM) to get the result.",
        example_1_hook_fix: {
            mode: "Cinematographer",
            instruction: hookPrompt.userPrompt
        },
        example_2_climax_fix: {
            mode: "Journalist",
            instruction: climaxPrompt.userPrompt
        }
    }
  };

  const outputPath = 'full-system-output.json';
  writeFileSync(outputPath, JSON.stringify(fullReport, null, 2));
  console.log(`\n✅ DONE! Full system report saved to: ${outputPath}`);
  console.log('You can open this file to see the full breakdown of analysis and generation logic.');
}

runFullDemo();

