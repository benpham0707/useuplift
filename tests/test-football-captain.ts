import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

// Sample Essay: Football Captain
const SAMPLE_ESSAY = `
It hurt to cap off a rough junior year football campaign with a losing record of 1-9 knowing the amount of people we disappointed. Walking around school with the title of captain of the football team possessed little to no value and was merely an embarrassment. The irritation of peers constantly remarking, "Why are you guys so bad?" lingered in my mind since the end of that season. The entirety of the backlash became a motivation for me to improve the next season, especially since it was possibly also going to be the last time I could play the sport.

With this goal in mind, I understood that the beginning to a winning season would require the individual efforts of every player on the team. Thus, I made sure the schedule of every teammate during the off-season consisted of captain-led weight-room practices, conditioning, and field work. It was apparent by our hard work that the common goal for me and everyone else on the team was to make it to the postseason because it would mean we can continue to play. The worst feeling was the thought of not playing football again, so I strove to support my team with training and motivation. Over the course of the off-season, good days were stacked with better days and great days were topped by our best days.

Nearing the beginning of my senior year, team morale elevated; steady anticipation of our untouched potential surged through the spirit of everybody in our program. As time until the kickoff came to an end, I could not help but to take a moment to acknowledge my blood, sweat, and tears with this team. I have learned to lead more effectively than I have before to prepare us for this rewarding season. I anticipated my ameliorated team to dominate the entire game, and as it played out, my expectations were exceeded with a win of 52-14. I was glad the training during the off-season, all the drills I had led, translated to our accomplishments on the field and the values we will possess in the future.
`;

const PROMPT_TEXT = "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.";

async function runFootballTest() {
  console.log('🧪 REAL-WORLD TEST: Football Captain Essay');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found.');
    return;
  }

  const input: NarrativeEssayInput = {
    essayText: SAMPLE_ESSAY,
    essayType: 'personal_statement', // or 'activity_essay', but sticking to generic for now
    promptText: PROMPT_TEXT
  };

  try {
    // Run the full system (Surgical Workshop Orchestrator)
    const result = await runSurgicalWorkshop(input);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 FULL SYSTEM RESULTS (FOOTBALL CAPTAIN)');
    console.log('='.repeat(80));
    
    // 1. Save Full JSON Output
    const jsonOutput = JSON.stringify(result, null, 2);
    await fs.writeFile('FULL_SYSTEM_TEST_FOOTBALL.json', jsonOutput);
    console.log('✅ Full JSON saved to: FULL_SYSTEM_TEST_FOOTBALL.json');

    // 2. Generate Comprehensive Markdown Report
    let mdOutput = `# Full System Analysis Report: Football Captain\n\n`;
    mdOutput += `**Overall EQI Score:** ${result.overallScore}/100\n`;
    mdOutput += `**Analysis ID:** ${result.analysisId}\n\n`;

    mdOutput += `## 🧠 Voice Fingerprint\n`;
    mdOutput += `- **Tone:** ${result.voiceFingerprint.tone}\n`;
    mdOutput += `- **Cadence:** ${result.voiceFingerprint.cadence}\n`;
    mdOutput += `- **Vocabulary:** ${result.voiceFingerprint.vocabulary}\n`;
    mdOutput += `- **Markers:**\n${result.voiceFingerprint.markers.map((m: string) => `  - ${m}`).join('\n')}\n\n`;

    mdOutput += `## 📊 Rubric Scoring\n`;
    mdOutput += `| Dimension | Score | Weighted |\n`;
    mdOutput += `|---|---|---|\n`;
    result.rubricResult.dimension_scores.forEach((d: any) => {
      mdOutput += `| ${d.dimension_name} | ${d.final_score}/10 | ${d.weighted_score.toFixed(2)} |\n`;
    });
    mdOutput += `\n**Impression Label:** ${result.rubricResult.impression_label}\n`;
    mdOutput += `**Assessment:**\n> ${result.rubricResult.assessment.replace(/\n/g, '\n> ')}\n\n`;

    mdOutput += `## ✂️ Trimming Suggestions (Cuts & Fluff)\n\n`;
    if (result.trimmingSuggestions && result.trimmingSuggestions.length > 0) {
        result.trimmingSuggestions.forEach((cut, i) => {
            mdOutput += `### ${i + 1}. [${cut.type.toUpperCase()}]\n`;
            mdOutput += `> "${cut.original_text}"\n\n`;
            if (cut.trimmed_text) {
                mdOutput += `**Suggestion:** ${cut.trimmed_text}\n`;
            } else {
                mdOutput += `**Suggestion:** DELETE completely.\n`;
            }
            mdOutput += `**Rationale:** ${cut.rationale}\n\n`;
        });
    } else {
        mdOutput += `*No significant cuts suggested.*\n\n`;
    }

    mdOutput += `## 🎯 Surgical Workshop Items (Prioritized Fixes)\n\n`;
    result.workshopItems.forEach((item, i) => {
      mdOutput += `### ${i + 1}. [${item.severity.toUpperCase()}] ${item.rubric_category}\n`;
      mdOutput += `> "${item.quote}"\n\n`;
      mdOutput += `**⚠️ Problem:** ${item.problem}\n\n`;
      mdOutput += `**💡 Why it matters:** ${item.why_it_matters}\n\n`;
      mdOutput += `**🛠️ Suggestions:**\n`;
      item.suggestions.forEach((s: any) => {
        const typeLabel = s.type.replace(/_/g, ' ').toUpperCase();
        mdOutput += `- **[${typeLabel}]** ${s.text}\n`;
        mdOutput += `  - *Rationale:* ${s.rationale}\n`;
        if (s.score_impact) {
            mdOutput += `  - *Score Impact:* ${s.score_impact}\n`;
        }
      });
      mdOutput += `\n---\n\n`;
    });

    await fs.writeFile('FULL_SYSTEM_TEST_FOOTBALL.md', mdOutput);
    console.log('✅ Human-readable Report saved to: FULL_SYSTEM_TEST_FOOTBALL.md');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runFootballTest().catch(console.error);

