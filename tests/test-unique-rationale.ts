import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

const SAMPLE_ESSAY = `
I was always captivated by puzzles throughout my life. When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets.
`;

const PROMPT_TEXT = "Describe how you express your creative side.";

async function runTest() {
  console.log('🧪 TESTING: Unique Rationale Generation (Phase 11)');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found.');
    return;
  }

  const input: NarrativeEssayInput = {
    essayText: SAMPLE_ESSAY,
    essayType: 'uc_piq',
    promptText: PROMPT_TEXT
  };

  try {
    // We'll just run the workshop on this short snippet to see the rationales
    const result = await runSurgicalWorkshop(input);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSIS RESULT');
    console.log('='.repeat(80));
    
    result.workshopItems.forEach((item, i) => {
      console.log(`\n### Issue ${i + 1}: ${item.rubric_category}`);
      console.log(`Quote: "${item.quote}"`);
      console.log(`Problem (Upstream): ${item.problem}`);
      console.log(`Why It Matters (Upstream): ${item.why_it_matters}`); // This might still be generic
      
      // Check suggestions for specific rationales
      item.suggestions.forEach((s, j) => {
          console.log(`\n  Suggestion ${j+1} [${s.type}]:`);
          console.log(`  Text: "${s.text}"`);
          console.log(`  Rationale: ${s.rationale}`);
          console.log(`  Impact: ${s.score_impact}`);
      });
    });

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runTest().catch(console.error);




