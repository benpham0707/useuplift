import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';
import path from 'path';

// Sample Essay (The Leadership Example provided)
const SAMPLE_ESSAY = `
In "Classic Views on Entrepreneurship," an article of De Economist, Joseph Schumpeter suggested that entrepreneurs were responsible for innovations in search of profit. Meanwhile, Frank Knight presented them as the bearers of uncertainty responsible for risk premiums in financial markets, and Israel Kirszner thought of entrepreneurship as a process that leads to the discovery. When I created Polytechnic High School's Young Entrepreneur Society and led as the club president, I learned how all three of these ideas were reflected in this role and the community I had aspired to initiate.

What was the "profit" I was looking for? My peers were tremendous motivators, not just to me. I knew the best structure would be a system which our club recruits could allocate into smaller teams based on interests, skill sets, and resources. Even if our mock business projects differed, the diversity of our ideas inspired fellow members to be flexible and diligent in planning strategies. We could all be the expert in the room because we could gain from each other what we lacked individually.

What were the "risks" I was undertaking? We invested our time and labor, often being uncertain whether our innovations or products aligned with the market's interest. However, the risk premiums presented itself in the form of invaluable branding, marketing, and networking skills, something few could develop in a typical highschool setting. As students, we rested the entrepreneur's desperate needs to be financially profitable, and instead focused on learning how to be more approachable and serviceable to those around us.

And what was the "discovery" I came upon? Every young entrepreneur dreams to be a builder-someone able to create a scalable business within a short time frame through hiring the best talents or seeking most suitable investors-or an opportunist-the one who participates during the greatest growth and jumps out when a business hits its peak. However, I realized I was most fit to be a specialist-someone who deeply cares for the needs of customers-making sure the members of our club grew confident in knowing how to manifest their passion and hobbies into real life applications.
`;

const PROMPT_TEXT = "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.";

async function runRealWorldTest() {
  console.log('🧪 REAL-WORLD TEST: Leadership Essay');
  console.log('Essay Length:', SAMPLE_ESSAY.length);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found. Cannot run real-world test.');
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
    console.log('🔍 SURGICAL WORKSHOP RESULTS');
    console.log('='.repeat(80));
    
    // 1. Save Full JSON
    const jsonOutput = JSON.stringify(result, null, 2);
    await fs.writeFile('PHASE_8_TEST_OUTPUT.json', jsonOutput);
    console.log('\n✅ Full JSON output saved to: PHASE_8_TEST_OUTPUT.json');

    // 2. Generate Markdown Report
    let mdOutput = `# Surgical Workshop Analysis Report\n\n`;
    mdOutput += `**Overall Score:** ${result.overallScore}/100\n`;
    mdOutput += `**Analysis ID:** ${result.analysisId}\n\n`;

    mdOutput += `## 🧠 Voice Fingerprint\n`;
    mdOutput += `- **Tone:** ${result.voiceFingerprint.tone}\n`;
    mdOutput += `- **Cadence:** ${result.voiceFingerprint.cadence}\n`;
    mdOutput += `- **Markers:**\n${result.voiceFingerprint.markers.map(m => `  - ${m}`).join('\n')}\n\n`;

    mdOutput += `## 🎯 Prioritized Fixes (Top ${result.workshopItems.length})\n\n`;
    
    result.workshopItems.forEach((item, i) => {
      mdOutput += `### ${i + 1}. [${item.severity.toUpperCase()}] ${item.rubric_category}\n`;
      mdOutput += `> "${item.quote}"\n\n`;
      mdOutput += `**⚠️ Problem:** ${item.problem}\n\n`;
      mdOutput += `**💡 Why it matters:** ${item.why_it_matters}\n\n`;
      mdOutput += `**🛠️ Suggestions:**\n`;
      item.suggestions.forEach(s => {
        mdOutput += `- **[${s.type}]** ${s.text}\n`;
        mdOutput += `  - *Rationale:* ${s.rationale}\n`;
      });
      mdOutput += `\n---\n\n`;
    });

    await fs.writeFile('PHASE_8_TEST_OUTPUT.md', mdOutput);
    console.log('✅ Readable Report saved to: PHASE_8_TEST_OUTPUT.md');

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runRealWorldTest().catch(console.error);
