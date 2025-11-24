
import { EssayAnalysisResult } from '../src/services/orchestrator/types';
import { FocusRecommender } from '../src/services/recommendation/focusRecommender';
import { NarrativeGenerator, GenerationRequest } from '../src/services/generation/narrativeGenerator';

// 1. The Input Essay
const essayText = `Only when I stare at a mirror can I see the other half of the world behind me. Such is reflection, a skill I use daily to contemplate behind what's visible only at first glance. From the time I reflected on my first grade writing to when my father passed away, my greatest talent lies in my ability to reflect on my experiences and grow.

I ascertain myself fallible to mistakes of even the highest degree, thus I strive for self-improvement. While my dad fought cancer, I ran from reality, my 4th grade self hid under the guise of playdates with my cousins to avoid comprehending the truth. Retaining palpable regret for not sitting at his bedside more before he passed, I served time reflecting on the unforgivable, failing to cherish and prioritize those I love.

I am no longer afraid of being wrong as experiences reveal time and time again my narrow sightedness in the moment. Seeing my once successful start-up clothing brand fail absolved my self confident bravado. To cope, I formulated responses and excuses that conveniently excluded me from the narrative. For as long as my narrow visioned mindset persisted, so did my inquiry of why I struggled. Over time, I gradually learned to put aside my pride and look over my experiences for exactly what they are, mistakes, successes, and opportunities. Under scrutinizing reflection I lay myself bare to unbiased criticism of my intentions, motive, regrets, shortcomings, negligence, strengths, successes, and such more.

I have strengthened my ability to reflect through consistent practice and wholly opening my mind and heart to reality. Ever since 9th grade I plastered little sticky notes around the edges of my large wooden antique mirror. Each little note refracted experiences rather than light. Little experiences that upon reflection taught me to not rely on others for reservations, double check canvas at night, compliment my friends more, and any daily insight. All reflections in their like serve to reveal myself. In my heart I carry a mirror that reminds me to look behind, giving me courage to face the front.`;

// 2. Simulated Engine A Output (Diagnostic)
// Based on expert analysis of the text provided
const mockAnalysis: EssayAnalysisResult = {
  metadata: {
    promptType: 'piq3_talent',
    timestamp: new Date().toISOString(),
    wordCount: 350
  },
  voice: {
    score: 6.0,
    quality_level: 'philosophical_abstract',
    weaknesses: [
      'Over-reliance on abstract concepts ("ascertain myself fallible")',
      'Telling not showing ("retained palpable regret")',
      'Passive voice in key moments'
    ]
  },
  opening_hook: {
    score: 6.5,
    hook_type: 'philosophical_statement',
    feedback: 'The mirror metaphor is a bit cliché. It starts with a generalization rather than a specific scene.'
  },
  narrative_arc: {
    present: true,
    climax_quality: 'summary', // The clothing brand failure is summarized, not shown as a scene
    score: 6.0
  },
  thematic_coherence: {
    score: 8.5, // The mirror motif is actually consistent
    feedback: 'Strong use of the mirror motif throughout.'
  },
  primary_dimensions: {
    personal_growth: { score: 7.0, evidence: ['Clothing brand failure', 'Father\'s passing'] },
    identity: { score: 6.5, evidence: ['Reflective thinker'] }
  },
  secondary_dimensions: {},
  craft: {},
  specificity: {},
  vulnerability: {},
  holistic_context: {
    narrative_quality: {
      coherence_score: 85,
      recurring_motifs: ['Antique wooden mirror', 'Sticky notes', 'The reflection of the room behind'], // Extracted by Holistic Analyzer
      spine: [],
      spike: [],
      lift: [],
      blind_spots: []
    }
  } as any
};

function runPhase7Test() {
  console.log('=== PHASE 7 SYSTEM TEST: PIQ3 (Talent/Skill) ===\n');

  // STEP 1: Auto-Focus Recommendation
  console.log('--- Step 1: Engine A (Diagnostics) -> Recommender ---');
  const recommendations = FocusRecommender.recommend(mockAnalysis);
  
  console.log('Top Recommendations:');
  recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`${i + 1}. [${rec.focusArea.toUpperCase()}] ${rec.reason} -> Strategy: ${rec.strategy}`);
  });

  // Let's assume the user chooses to fix the "Pivot Moment" (Clothing Brand Failure)
  // because it was identified as a "summary" instead of a scene.
  const selectedFocus = 'pivot_moment';
  console.log(`\nUser Selects: ${selectedFocus}`);


  // STEP 2: The Stitcher (Global Context Injection)
  console.log('\n--- Step 2: The Stitcher (Context Injection) ---');
  const stitcherContext = {
    currentTheme: "Reflection as a tool for radical honesty",
    recurringMotifs: mockAnalysis.holistic_context!.narrative_quality.recurring_motifs, // ["Antique wooden mirror", "Sticky notes"]
    endingInsight: "The mirror doesn't just show me; it shows me where I've been."
  };
  console.log('Injected Motifs:', stitcherContext.recurringMotifs);


  // STEP 3: The Originality Engine (Mode Selection)
  console.log('\n--- Step 3: The Originality Engine (Mode Selection) ---');
  // User wants to make the failure sound more visceral/real, so they choose 'Journalist' or 'Cinematographer'
  // Let's try 'Cinematographer' to focus on the visual of the failed brand/inventory.
  const selectedMode = 'cinematographer'; 
  console.log(`User Selects Mode: ${selectedMode}`);


  // STEP 4: Generation Request Construction
  console.log('\n--- Step 4: Generating Prompts for Engine B ---');
  const request: GenerationRequest = {
    originalText: "Seeing my once successful start-up clothing brand fail absolved my self confident bravado. To cope, I formulated responses and excuses that conveniently excluded me from the narrative.",
    analysisContext: mockAnalysis,
    focusArea: selectedFocus,
    globalContext: stitcherContext,
    styleVariant: selectedMode,
    specificDirective: "Focus on the physical evidence of the failure (piles of unsold clothes, the silence of the inbox)."
  };

  const prompts = NarrativeGenerator.debugBuildPrompts(request);

  // Validation / Inspection
  console.log('\n[System Prompt Snippet]:');
  console.log(prompts.systemPrompt.split('**Narrative Mode Instructions:**')[1].split('**Context:**')[0].trim());
  
  console.log('\n[User Prompt - Global Context Snippet]:');
  const contextPart = prompts.userPrompt.match(/\*\*Global Narrative Context[\s\S]*?(\n\n|$)/);
  console.log(contextPart ? contextPart[0] : 'ERROR: Context not found');

  console.log('\n[User Prompt - Task Snippet]:');
  const taskPart = prompts.userPrompt.match(/\*\*Your Task:\*\*[\s\S]*?\(Mode:.*?\)/);
  console.log(taskPart ? taskPart[0] : 'ERROR: Task not found');


  // STEP 5: Freshness Engine Test (Hypothetical)
  console.log('\n--- Step 5: Freshness Engine Pivot ---');
  console.log('User feedback: "Actually, I want to write about the specific moment I put the first sticky note on the mirror."');
  
  const pivotRequest: GenerationRequest = {
    ...request,
    focusArea: 'growth_development',
    contentPivot: "The specific moment I put the first sticky note on the mirror after a big mistake."
  };
  
  const pivotPrompts = NarrativeGenerator.debugBuildPrompts(pivotRequest);
  const hasPivotWarning = pivotPrompts.userPrompt.includes('CRITICAL: FRESH IDEA INJECTION');
  console.log(`Pivot Prompt Includes Critical Warning? ${hasPivotWarning ? 'YES' : 'NO'}`);

  console.log('\n=== TEST COMPLETE ===');
}

runPhase7Test();

