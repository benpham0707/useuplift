
import * as dotenv from 'dotenv';
dotenv.config();

import { NarrativeGenerator } from '../src/services/generation/narrativeGenerator';
import { EssayAnalysisResult } from '../src/services/orchestrator/types';

async function testNarrativeGenerator() {
  // ============================================================================
  // SCENARIO 1: GROWTH DEVELOPMENT (Connecting the Dots)
  // ============================================================================
  console.log('\n================================================================');
  console.log('SCENARIO 1: GROWTH/PROGRESSION (Generic Coding -> The Journey)');
  console.log('================================================================');

  const mockOriginalText = "After fixing that bug, I kept coding. I made a few more apps. Some worked, some didn't. I joined a hackathon and we didn't win, but I learned a lot. Now I am much better at Python.";
  
  const mockAnalysis: EssayAnalysisResult = {
    metadata: { promptType: 'intellectual_vitality', timestamp: new Date().toISOString(), wordCount: 40 },
    voice: {
      score: 3,
      quality_level: 'resume_prose',
      weaknesses: ['List-like structure', 'No narrative arc', 'Telling not showing'],
    },
    craft: {}, specificity: {}, narrative_arc: {}, thematic_coherence: {}, opening_hook: {}, vulnerability: {}, primary_dimensions: {}, secondary_dimensions: {},
  };

  console.log('Input Text:', mockOriginalText);
  console.log('Focus: Growth Development (Connecting Experiences)\n');

  try {
    const growthResult = await NarrativeGenerator.generate({
      originalText: mockOriginalText,
      analysisContext: mockAnalysis,
      focusArea: 'growth_development',
      specificDirective: 'Connect the failure of the bug to the hackathon loss. Show the "messy middle" of improvement.',
      targetArchetype: 'The Resilient Builder',
    });
    console.log('>>> GENERATED OUTPUT (Tier 5):\n', growthResult);
  } catch (e) {
    console.error('Growth generation failed:', e);
  }

  // ============================================================================
  // SCENARIO 2: REFLECTION (The "So What?")
  // ============================================================================
  console.log('\n================================================================');
  console.log('SCENARIO 2: REFLECTION (Generic Insight -> Profound Realization)');
  console.log('================================================================');

  const mockOriginalText2 = "This experience taught me that even when things are hard, you have to keep going. Being a leader means staying strong for your team.";

  console.log('Input Text:', mockOriginalText2);
  console.log('Focus: Reflection (Insight)\n');

  try {
    const reflectionResult = await NarrativeGenerator.generate({
      originalText: mockOriginalText2,
      analysisContext: mockAnalysis,
      focusArea: 'reflection',
      specificDirective: 'Use the "I don\'t know" example style: Vulnerability -> Counter-intuitive wisdom.',
      targetArchetype: 'The Servant Leader',
    });
    console.log('>>> GENERATED OUTPUT (Tier 5):\n', reflectionResult);
  } catch (e) {
    console.error('Reflection generation failed:', e);
  }
}

testNarrativeGenerator().catch(console.error);
