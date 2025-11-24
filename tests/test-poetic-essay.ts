import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

// Sample Essay: Poetic but vague, high sensory, low clarity
const SAMPLE_ESSAY = `
The soil breathes. I can feel it under my fingernails, dark and rich and heavy with the promise of August tomatoes. My grandfather always said that patience is a color, and in his garden, it was the green of slow-climbing vines. I spent my summers there, lost in the humidity and the buzzing of cicadas, watching him work with hands that looked like tree bark.

I remember the day the drought came. The sky turned a pale, sick white. The leaves curled up like burning paper. I was afraid. I didn't know what to do. I just watched the green fade to brown. My grandfather didn't say anything. He just carried buckets. Back and forth. From the creek to the garden. 

I think that's when I learned about resilience. It's not a big loud thing. It's just carrying buckets. I try to bring that to my schoolwork now. When calculus feels like a drought, I just carry buckets. When the debate team loses, I carry buckets. It's a metaphor, I know, but it feels real to me. The soil remembers the water you give it.
`;

const PROMPT_TEXT = "Describe a place or environment where you are perfectly content. What do you do or experience there, and why is it meaningful to you?";

async function runPoeticTest() {
  console.log('🧪 REAL-WORLD TEST: Poetic/Vague Essay');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found.');
    return;
  }

  const input: NarrativeEssayInput = {
    essayText: SAMPLE_ESSAY,
    essayType: 'personal_statement',
    promptText: PROMPT_TEXT
  };

  try {
    const result = await runSurgicalWorkshop(input);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SURGICAL WORKSHOP RESULTS (POETIC ESSAY)');
    console.log('='.repeat(80));
    
    // Save results
    await fs.writeFile('TEST_OUTPUT_POETIC.json', JSON.stringify(result, null, 2));
    
    let mdOutput = `# Analysis Report: Poetic Essay\n\n`;
    mdOutput += `**Voice Tone:** ${result.voiceFingerprint.tone}\n`;
    mdOutput += `**Voice Markers:** ${result.voiceFingerprint.markers.join(', ')}\n\n`;
    
    result.workshopItems.forEach((item, i) => {
      mdOutput += `### ${i + 1}. ${item.rubric_category}\n`;
      mdOutput += `> "${item.quote}"\n`;
      mdOutput += `**Problem:** ${item.problem}\n`;
      mdOutput += `**Suggestions:**\n`;
      item.suggestions.forEach(s => {
        mdOutput += `- **[${s.type}]** ${s.text}\n`;
        mdOutput += `  *Rationale:* ${s.rationale}\n`;
      });
      mdOutput += `\n---\n`;
    });

    await fs.writeFile('TEST_OUTPUT_POETIC.md', mdOutput);
    console.log('✅ Saved to TEST_OUTPUT_POETIC.md');

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runPoeticTest().catch(console.error);

