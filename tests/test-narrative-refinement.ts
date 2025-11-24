
import { NarrativeGenerator, GenerationRequest } from '../src/services/generation/narrativeGenerator';
import { EssayAnalysisResult } from '../src/services/orchestrator/types';

// Mock Analysis Result
const mockAnalysis: EssayAnalysisResult = {
  voice: {
    quality_level: 'authentic_voice',
    weaknesses: ['Lack of sensory detail', 'Telling not showing'],
    score: 6.5
  },
  narrative_arc: {
    present: true,
    climax_quality: 'summary',
    score: 7.0
  },
  holistic_context: {
    narrative_quality: {
      blind_spots: [
        { text: ["Abstract descriptions of resilience"] }
      ]
    }
  },
  primary_dimensions: {
      intellectual_vitality: { score: 0, evidence: [] },
      community_contribution: { score: 0, evidence: [] },
      personal_growth: { score: 0, evidence: [] }
  }
};

const baseRequest: GenerationRequest = {
  originalText: "I realized that making mistakes was part of the process. I burned the cake but I learned to be patient.",
  analysisContext: mockAnalysis,
  focusArea: 'pivot_moment',
};

function runTests() {
  console.log('=== TEST 1: The Stitcher (Global Context) ===');
  const stitchingRequest: GenerationRequest = {
    ...baseRequest,
    globalContext: {
      currentTheme: "Perfectionism vs. Progress",
      recurringMotifs: ["The smell of burnt sugar", "The ticking kitchen timer"],
      endingInsight: "Mistakes are the main ingredient of success"
    }
  };
  
  const prompts1 = NarrativeGenerator.debugBuildPrompts(stitchingRequest);
  
  // assertions
  const hasTheme = prompts1.userPrompt.includes('Core Theme:** "Perfectionism vs. Progress"');
  const hasMotif = prompts1.userPrompt.includes('The smell of burnt sugar');
  const hasEnding = prompts1.userPrompt.includes('Mistakes are the main ingredient of success');

  console.log('Contains Theme?', hasTheme);
  console.log('Contains Motif?', hasMotif);
  console.log('Contains Ending?', hasEnding);

  if (!hasTheme || !hasMotif || !hasEnding) {
    console.error('FAILED: Missing Global Context elements in prompt.');
    console.log(prompts1.userPrompt);
  } else {
    console.log('PASSED: Global Context injected correctly.');
  }


  console.log('\n\n=== TEST 2: The Journalist Style ===');
  const journalistRequest: GenerationRequest = {
    ...baseRequest,
    styleVariant: 'journalist',
    specificDirective: 'Describe the moment the cake burned.'
  };

  const prompts2 = NarrativeGenerator.debugBuildPrompts(journalistRequest);
  
  const hasJournalistMode = prompts2.systemPrompt.includes('Mode: THE JOURNALIST');
  const hasJournalistDirective = prompts2.systemPrompt.includes('Write like a reporter');
  const hasUserModeConfirmation = prompts2.userPrompt.includes('(Mode: journalist)');

  console.log('System Prompt has Journalist Mode?', hasJournalistMode);
  console.log('System Prompt has Journalist Directive?', hasJournalistDirective);
  console.log('User Prompt confirms Mode?', hasUserModeConfirmation);

  if (!hasJournalistMode || !hasJournalistDirective || !hasUserModeConfirmation) {
    console.error('FAILED: Journalist Style not injected correctly.');
    console.log(prompts2.systemPrompt);
  } else {
    console.log('PASSED: Journalist Style injected correctly.');
  }

    console.log('\n\n=== TEST 3: The Cinematographer Style ===');
  const cinemaRequest: GenerationRequest = {
    ...baseRequest,
    styleVariant: 'cinematographer',
    specificDirective: 'Describe the kitchen scene.'
  };

  const prompts3 = NarrativeGenerator.debugBuildPrompts(cinemaRequest);
  const hasCinemaMode = prompts3.systemPrompt.includes('Mode: THE CINEMATOGRAPHER');
  
  console.log('System Prompt has Cinematographer Mode?', hasCinemaMode);

  if (!hasCinemaMode) {
     console.error('FAILED: Cinematographer Style not injected correctly.');
  } else {
     console.log('PASSED: Cinematographer Style injected correctly.');
  }

  console.log('\n\n=== TEST 4: The Freshness Engine (Content Pivot) ===');
  const pivotRequest: GenerationRequest = {
    ...baseRequest,
    contentPivot: "Forget the cake. Focus on the time I had to fix the car engine in the rain."
  };

  const prompts4 = NarrativeGenerator.debugBuildPrompts(pivotRequest);
  const hasPivotNote = prompts4.userPrompt.includes('CRITICAL: FRESH IDEA INJECTION');
  const hasNewContent = prompts4.userPrompt.includes('fix the car engine');

  console.log('Contains Fresh Idea Warning?', hasPivotNote);
  console.log('Contains New Content?', hasNewContent);

  if (!hasPivotNote || !hasNewContent) {
    console.error('FAILED: Content Pivot not injected correctly.');
    console.log(prompts4.userPrompt);
  } else {
    console.log('PASSED: Content Pivot injected correctly.');
  }
}

runTests();
