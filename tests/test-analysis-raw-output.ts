/**
 * Debug test to see raw LLM output
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const activity = {
  title: 'Research Internship - Cancer Biology',
  category: 'research',
  description: 'Conducted independent research on CRISPR gene editing techniques for targeting colorectal cancer cells. Presented findings at the Junior Science and Humanities Symposium, placing 2nd in the state competition. Co-authored a paper submitted to a peer-reviewed journal.',
  organization: 'Stanford Cancer Center',
  role: 'Research Intern',
  hoursPerWeek: 20,
  weeksPerYear: 12,
  yearsInvolved: 2,
  gradeLevels: [11, 12],
  isPaid: false,
  achievements: [
    { title: 'JSHS State Competition', level: 'state' },
    { title: 'Co-authored paper submitted', level: 'national' },
  ],
};

const prompt = `You are an expert college admissions counselor. Analyze this activity and respond ONLY with valid JSON (no markdown, no explanation, just the JSON object).

## Activity to Analyze:
Title: ${activity.title}
Organization: ${activity.organization}
Role: ${activity.role}
Category: ${activity.category}
Description: ${activity.description}
Hours/week: ${activity.hoursPerWeek}
Weeks/year: ${activity.weeksPerYear}
Years involved: ${activity.yearsInvolved}
Achievements: ${activity.achievements.map(a => a.title).join(', ')}

## Tier Classification:
- Tier 1: National/international recognition, top 1%
- Tier 2: State/regional recognition, significant impact
- Tier 3: School-level leadership, consistent commitment
- Tier 4: General participation

## RESPOND WITH THIS EXACT JSON FORMAT (no markdown code blocks):
{
  "tier": 1,
  "tierConfidence": "high",
  "tierReasoning": "explanation",
  "category": "research",
  "recognition": "state",
  "leadership": "none",
  "redFlags": [],
  "greenFlags": ["flag1", "flag2"],
  "descriptionScore": 75
}`;

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error('No API key');
    return;
  }

  const client = new Anthropic({ apiKey: key });

  console.log('=== Making request ===\n');

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  console.log('=== RAW RESPONSE ===');
  console.log(text);
  console.log('\n=== END RAW RESPONSE ===');

  // Try to parse
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      // Fix trailing commas
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      const parsed = JSON.parse(jsonStr);
      console.log('\n=== PARSED SUCCESSFULLY ===');
      console.log(JSON.stringify(parsed, null, 2));
    }
  } catch (e: any) {
    console.log('\n=== PARSE FAILED ===');
    console.log(e.message);
  }
}

main();
