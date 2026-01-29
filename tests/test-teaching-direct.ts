/**
 * Direct API test with FULL system prompt from edge function
 */

const FULL_SYSTEM_PROMPT = `You are a master writing coach who teaches through deep understanding and transferable principles.

Your students have already received specific revision suggestions. Your job is NOT to repeat those suggestions, but to help them understand:

1. THE PROBLEM (What's happening + Why it matters)
2. THE WRITING PRINCIPLE AT PLAY (Teach the craft, not just the fix)
3. HOW TO APPLY THIS STRATEGY (Empower them to use it elsewhere)
4. THE MAGNITUDE OF CHANGE (Surgical tweak vs fundamental rethinking)

**YOUR TEACHING PHILOSOPHY:**

"Pass knowledge, not fixes."

Don't say: "This lacks specificity. Add concrete details."
Instead say: "You're writing in summary mode ('I learned leadership') when the reader's brain is wired for scene mode ('I stood in front of 40 blank faces'). Summary tells conclusions. Scenes show evidence. In a 350-word PIQ, every sentence either builds evidence or wastes space."

**THE PROBLEM - TWO PARTS:**

1. **Description** (200-350 chars): Prove you deeply understand their specific essay
2. **Why It Matters** (150-250 chars): Strategic consequence + admissions impact

**OUTPUT FORMAT:**

Return ONLY valid JSON:
{
  "enhancedItems": [
    {
      "id": "workshop_item_id",
      "teaching": {
        "problem": {
          "description": "200-350 chars",
          "whyItMatters": "150-250 chars"
        },
        "craftPrinciple": "150-300 chars",
        "applicationStrategy": "150-300 chars",
        "changeMagnitude": "surgical" | "moderate" | "structural",
        "magnitudeGuidance": "100-150 chars"
      },
      "teachingDepth": "foundational" | "craft" | "polish",
      "estimatedImpact": {
        "nqiGain": number,
        "dimensionsAffected": ["dimension1"]
      }
    }
  ]
}`;

const SAMPLE_ESSAY = `Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club.`;

const SAMPLE_WORKSHOP_ITEM = {
  id: "opening_001",
  quote: "Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club.",
  severity: "high",
  rubric_category: "opening_hook",
  suggestions: [
    {
      type: "polished_original",
      text: "I stood in front of forty blank faces in room 214, my handmade 'Debate Club' flyer trembling slightly.",
      rationale: "Opens with specific scene before introducing intellectual framework.",
      fingerprint_connection: "Preserves understated voice while grounding abstract concepts."
    }
  ]
};

async function test() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('🧪 Testing Teaching Layer with FULL system prompt...\n');

  const start = Date.now();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: FULL_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Provide teaching guidance for this workshop item.

**ESSAY:** ${SAMPLE_ESSAY}

**WORKSHOP ITEM:**
${JSON.stringify(SAMPLE_WORKSHOP_ITEM, null, 2)}

Generate deep teaching guidance with problem/whyItMatters/craftPrinciple/applicationStrategy.`
      }]
    })
  });

  const result = await response.json();
  const duration = (Date.now() - start) / 1000;

  console.log(`✅ API call complete (${duration.toFixed(1)}s)\n`);
  console.log('📊 USAGE:');
  console.log(`   Input tokens: ${result.usage?.input_tokens || 'N/A'}`);
  console.log(`   Output tokens: ${result.usage?.output_tokens || 'N/A'}`);
  console.log(`   Total tokens: ${(result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)}`);
  console.log(`   Estimated cost: $${((result.usage?.input_tokens || 0) * 0.000003 + (result.usage?.output_tokens || 0) * 0.000015).toFixed(4)}\n`);

  const responseText = result.content[0].text;
  console.log('📝 RAW RESPONSE:\n');
  console.log(responseText);
  console.log('\n' + '='.repeat(80) + '\n');

  // Parse JSON
  try {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
    const parsed = JSON.parse(jsonString);

    console.log('✅ PARSED SUCCESSFULLY\n');
    console.log(JSON.stringify(parsed, null, 2));

    // Validate
    const item = parsed.enhancedItems?.[0];
    if (item) {
      console.log('\n📏 CHARACTER COUNTS:');
      console.log(`   problem.description: ${item.teaching?.problem?.description?.length || 0} chars`);
      console.log(`   problem.whyItMatters: ${item.teaching?.problem?.whyItMatters?.length || 0} chars`);
      console.log(`   craftPrinciple: ${item.teaching?.craftPrinciple?.length || 0} chars`);
      console.log(`   applicationStrategy: ${item.teaching?.applicationStrategy?.length || 0} chars`);
      console.log(`   magnitudeGuidance: ${item.teaching?.magnitudeGuidance?.length || 0} chars`);
    }
  } catch (e) {
    console.error('❌ Failed to parse JSON:', e);
  }
}

test();
