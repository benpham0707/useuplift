/**
 * Test the EXPANDED teaching layer with hooks + depth structure
 */

const SAMPLE_ESSAY = `Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club. Through organizing weekly discussions and bringing in guest speakers, I learned how institutional frameworks can either enable or constrain student voice.`;

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

const SAMPLE_VOICE_FINGERPRINT = {
  dominant_mode: "understated_confidence",
  analytical_precision: "high",
  intellectual_sophistication: "advanced"
};

const SAMPLE_EXPERIENCE_FINGERPRINT = {
  irreplaceable_elements: ["debate club founding", "institutional power analysis"]
};

async function testExpandedTeaching() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING EXPANDED TEACHING LAYER (Hooks + Depth)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // Read the system prompt from the edge function file
    const fs = await import('fs/promises');
    const edgeFunctionContent = await fs.readFile(
      'supabase/functions/teaching-layer/index.ts',
      'utf-8'
    );

    // Extract the system prompt
    const promptMatch = edgeFunctionContent.match(
      /const TEACHING_LAYER_SYSTEM_PROMPT = `([\s\S]*?)`;/
    );

    if (!promptMatch) {
      throw new Error('Could not extract system prompt from edge function');
    }

    const systemPrompt = promptMatch[1];

    console.log('📝 System Prompt Length:', systemPrompt.length, 'chars');
    console.log('');

    // Build user message
    const userMessage = `Provide teaching guidance for these workshop suggestions.

**ESSAY CONTEXT:**
Prompt: Leadership Experience
Current NQI: 68/100

**ESSAY TEXT:**
${SAMPLE_ESSAY}

**VOICE FINGERPRINT:**
${JSON.stringify(SAMPLE_VOICE_FINGERPRINT, null, 2)}

**EXPERIENCE FINGERPRINT:**
${JSON.stringify(SAMPLE_EXPERIENCE_FINGERPRINT, null, 2)}

**RUBRIC ANALYSIS:**
{
  "opening_power_scene_entry": { "score": 5, "feedback": "Opens with theory, not scene" },
  "narrative_arc_stakes": { "score": 6, "feedback": "Stakes not immediately clear" }
}

**WORKSHOP SUGGESTIONS (Already provided to student):**
${JSON.stringify([SAMPLE_WORKSHOP_ITEM], null, 2)}

---

For each workshop item, generate comprehensive teaching guidance using the HOOK + DEPTH structure.

Follow the exact structure defined in the system prompt with these character requirements:

1. **The Problem** - Three parts:
   - hook: 80-120 chars (attention-grabbing opener)
   - description: 400-600 chars (deep analysis proving you understand their essay + their intent)
   - whyItMatters.preview: 100-150 chars (hook their attention about the stakes)
   - whyItMatters.fullExplanation: 300-500 chars (complete strategic analysis + admissions impact)

2. **Craft Principle** - Three parts:
   - hook: 80-120 chars (make them curious about the "magic")
   - fullTeaching: 400-600 chars (complete principle with psychology/neuroscience basis)
   - realWorldExample: 200-300 chars (concrete example from their essay)

3. **Application Strategy** - Three parts:
   - quickStart: 100-150 chars (immediate action they can take RIGHT NOW)
   - deepDive: 400-600 chars (comprehensive step-by-step process)
   - transferability: 200-300 chars (how to apply across ALL their writing)

4. **Personal Note**: 150-250 chars (make them feel SEEN and SPECIAL - validate their strengths)

5. **Magnitude Guidance**: 100-150 chars (honest expectations: surgical/moderate/structural)

CRITICAL: Validate before correcting. Make them feel their intelligence and effort are recognized. Teach the "why" behind the magic.`;

    console.log('🚀 Calling Anthropic API...');
    console.log('');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      })
    });

    const result = await response.json();
    const duration = (Date.now() - startTime) / 1000;

    console.log(`✅ API call complete (${duration.toFixed(1)}s)`);
    console.log('');

    console.log('📊 USAGE:');
    console.log(`   Input tokens: ${result.usage?.input_tokens || 'N/A'}`);
    console.log(`   Output tokens: ${result.usage?.output_tokens || 'N/A'}`);
    console.log(`   Total tokens: ${(result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)}`);
    console.log(`   Estimated cost: $${((result.usage?.input_tokens || 0) * 0.000003 + (result.usage?.output_tokens || 0) * 0.000015).toFixed(4)}`);
    console.log('');

    const responseText = result.content[0].text;

    // Parse JSON
    let parsed;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      console.error('Raw response:');
      console.error(responseText);
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📏 CHARACTER COUNT VALIDATION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    const item = parsed.enhancedItems?.[0];
    if (!item || !item.teaching) {
      console.error('❌ No teaching guidance found');
      process.exit(1);
    }

    const teaching = item.teaching;

    // Validate character counts
    const counts = {
      'problem.hook': teaching.problem?.hook?.length || 0,
      'problem.description': teaching.problem?.description?.length || 0,
      'problem.whyItMatters.preview': teaching.problem?.whyItMatters?.preview?.length || 0,
      'problem.whyItMatters.fullExplanation': teaching.problem?.whyItMatters?.fullExplanation?.length || 0,
      'craftPrinciple.hook': teaching.craftPrinciple?.hook?.length || 0,
      'craftPrinciple.fullTeaching': teaching.craftPrinciple?.fullTeaching?.length || 0,
      'craftPrinciple.realWorldExample': teaching.craftPrinciple?.realWorldExample?.length || 0,
      'applicationStrategy.quickStart': teaching.applicationStrategy?.quickStart?.length || 0,
      'applicationStrategy.deepDive': teaching.applicationStrategy?.deepDive?.length || 0,
      'applicationStrategy.transferability': teaching.applicationStrategy?.transferability?.length || 0,
      'personalNote': teaching.personalNote?.length || 0,
    };

    const requirements = {
      'problem.hook': [80, 120],
      'problem.description': [400, 600],
      'problem.whyItMatters.preview': [100, 150],
      'problem.whyItMatters.fullExplanation': [300, 500],
      'craftPrinciple.hook': [80, 120],
      'craftPrinciple.fullTeaching': [400, 600],
      'craftPrinciple.realWorldExample': [200, 300],
      'applicationStrategy.quickStart': [100, 150],
      'applicationStrategy.deepDive': [400, 600],
      'applicationStrategy.transferability': [200, 300],
      'personalNote': [150, 250],
    };

    let allPassed = true;

    for (const [field, count] of Object.entries(counts)) {
      const [min, max] = requirements[field];
      const passed = count >= min && count <= max;
      const status = passed ? '✅' : '❌';
      const padding = ' '.repeat(50 - field.length);

      console.log(`${status} ${field}:${padding}${count} chars (requires ${min}-${max})`);

      if (!passed) allPassed = false;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📄 FULL OUTPUT PREVIEW');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    console.log('🎯 THE PROBLEM');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('HOOK:', teaching.problem?.hook);
    console.log('');
    console.log('DESCRIPTION:', teaching.problem?.description);
    console.log('');
    console.log('WHY IT MATTERS (Preview):', teaching.problem?.whyItMatters?.preview);
    console.log('WHY IT MATTERS (Full):', teaching.problem?.whyItMatters?.fullExplanation);
    console.log('');

    console.log('✨ CRAFT PRINCIPLE');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('HOOK:', teaching.craftPrinciple?.hook);
    console.log('');
    console.log('FULL TEACHING:', teaching.craftPrinciple?.fullTeaching);
    console.log('');
    console.log('REAL-WORLD EXAMPLE:', teaching.craftPrinciple?.realWorldExample);
    console.log('');

    console.log('🚀 APPLICATION STRATEGY');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('QUICK START:', teaching.applicationStrategy?.quickStart);
    console.log('');
    console.log('DEEP DIVE:', teaching.applicationStrategy?.deepDive);
    console.log('');
    console.log('TRANSFERABILITY:', teaching.applicationStrategy?.transferability);
    console.log('');

    console.log('💝 PERSONAL NOTE');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(teaching.personalNote);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log(`Character Count Validation: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    console.log(`Estimated cost per item: $${((result.usage?.input_tokens || 0) * 0.000003 + (result.usage?.output_tokens || 0) * 0.000015).toFixed(4)}`);
    console.log('');

    // Save full output
    await fs.writeFile(
      'teaching-expanded-output.json',
      JSON.stringify(parsed, null, 2)
    );
    console.log('💾 Full output saved to: teaching-expanded-output.json');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testExpandedTeaching();
