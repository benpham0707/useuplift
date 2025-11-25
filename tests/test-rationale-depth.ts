import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

const SAMPLE_ESSAY = `
I was always captivated by puzzles throughout my life. When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets.
`;

const PROMPT_TEXT = "Describe how you express your creative side.";

async function runTest() {
  console.log('🧪 TESTING: Phase 14 (Rationale Deepening)');
  
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
    const result = await runSurgicalWorkshop(input);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING RATIONALE DEPTH');
    console.log('='.repeat(80));
    
    result.workshopItems.forEach((item, i) => {
      console.log(`\n### Issue ${i + 1}: ${item.rubric_category}`);
      console.log(`Quote: "${item.quote}"`);
      
      item.suggestions.forEach((s, j) => {
          console.log(`\n  Suggestion ${j+1} [${s.type}]:`);
          console.log(`  Text: "${s.text}"`);
          console.log(`  Rationale: ${s.rationale}`);
      });
    });

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runTest().catch(console.error);




