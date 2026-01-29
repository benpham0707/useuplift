/**
 * Test Teaching Layer (Phase 19)
 *
 * Tests the teaching-layer edge function with sample workshop items
 * to validate output quality before full integration.
 */

// Sample essay
const SAMPLE_ESSAY = `Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club. I wanted to create a space where students could question authority and examine how power operates in our daily lives.

At first, only three students showed up. But I persisted, posting flyers and talking to people in the hallways. By spring semester, we had twenty-seven members. We analyzed everything from dress codes to district budget priorities. Our debates became so popular that the principal started attending.

Through debate, I learned that the most effective way to challenge power isn't through confrontation but through thoughtful questioning. Foucault would've loved our club - we embodied his ideas about discourse and resistance. This experience taught me that intellectual ideas only matter when they connect to real-world action.`;

// Sample voice fingerprint
const SAMPLE_VOICE_FINGERPRINT = {
  sentenceStructure: {
    pattern: "Mix of short declarative statements and longer analytical sentences",
    example: "At first, only three students showed up. But I persisted, posting flyers and talking to people in the hallways."
  },
  vocabulary: {
    level: "Academic with accessible explanations",
    signatureWords: ["power", "analyzed", "discourse", "embodied"]
  },
  pacing: {
    speed: "Moderate, deliberate",
    rhythm: "Builds from theory to action to reflection"
  },
  tone: {
    primary: "Intellectually curious",
    secondary: "Understated confidence"
  }
};

// Sample experience fingerprint
const SAMPLE_EXPERIENCE_FINGERPRINT = {
  unusualCircumstance: {
    description: "Founding a debate club focused on Foucauldian analysis of power",
    whyItMatters: "Bridges abstract philosophy with high school activism",
    specificDetail: "Starting with 3 members, growing to 27, principal attending"
  },
  specificSensoryAnchor: null,
  contraryInsight: {
    insight: "Challenge power through thoughtful questioning, not confrontation",
    againstWhat: "Typical activist approach of direct confrontation",
    whyAuthentic: "Learned through actual experience with debate club"
  },
  antiPatternFlags: {
    followsTypicalArc: true,
    hasGenericInsight: true,
    hasManufacturedBeat: false,
    hasCrowdPleaser: false,
    warnings: [
      "Opens with theory before human moment",
      "Generic conclusion about 'learning' and 'connection'"
    ]
  },
  qualityAnchors: [
    {
      sentence: "At first, only three students showed up. But I persisted, posting flyers and talking to people in the hallways.",
      whyItWorks: "Specific vulnerability (only 3) followed by concrete action",
      preservationPriority: "high"
    }
  ],
  confidenceScore: 6
};

// Sample rubric details
const SAMPLE_RUBRIC = [
  {
    dimension_name: "opening_hook",
    raw_score: 4,
    final_score: 4,
    evidence: {
      justification: "Opens with abstract theory rather than specific moment",
      strengths: ["Intellectually sophisticated"],
      weaknesses: ["Lacks immediate engagement", "No sensory details"]
    }
  },
  {
    dimension_name: "character_development",
    raw_score: 5,
    final_score: 5,
    evidence: {
      justification: "Shows persistence but limited interiority",
      strengths: ["Growth from 3 to 27 members is concrete"],
      weaknesses: ["Emotions not explored", "Internal struggle unclear"]
    }
  }
];

// Sample workshop items (what Phase 17 would generate)
const SAMPLE_WORKSHOP_ITEMS = [
  {
    id: "opening_hook_001",
    quote: "Michel Foucault argued that power structures are inherently embedded in social institutions. This theory resonated with me when I founded my school's debate club.",
    severity: "high" as const,
    rubric_category: "opening_hook",
    suggestions: [
      {
        type: "polished_original",
        text: "I stood in front of forty blank faces in room 214, my handmade 'Debate Club' flyer trembling slightly. 'Who wants to argue about whether our student council actually has power?' Three hands went up. That was September. By March, twenty-seven of us were dissecting everything from dress code policies to district budget allocations. Our principal started showing up to watch. Foucault would've loved it - we were living proof that questioning authority starts with, well, questions.",
        rationale: "Opens with specific scene (you, nervous, room 214, forty faces) before introducing intellectual framework. The theory becomes the conclusion ('Foucault would've loved it'), not the premise - showing you discovered it through experience rather than applying it from a textbook. This reversal makes readers invest in you first, then care about your ideas.",
        fingerprint_connection: "Preserves your understated voice ('would've loved it' vs 'perfectly illustrated') while grounding abstract concepts in concrete moments (trembling flyer, room 214, specific member count growth)."
      },
      {
        type: "voice_amplifier",
        text: "Three people showed up to my first debate club meeting. Three. I'd spent two weeks making flyers, practicing my pitch about 'democratizing discourse' - a phrase I'd stolen from Foucault without really understanding what it meant. 'So... dress codes?' I said, desperate to fill the silence. That awkward question launched six months of the most intense intellectual community I'd ever experienced. By spring, we had twenty-seven members and the principal as a regular attendee.",
        rationale: "Amplifies your natural voice pattern of building from humble beginnings to impact. The admission of not understanding Foucault ('without really understanding') adds vulnerability that makes the later intellectual growth more earned. Mirrors your sentence rhythm of short declarative beats followed by longer explanatory flows.",
        fingerprint_connection: "Matches your vocabulary level (accessible with precise terms like 'democratizing discourse') and uses your tonal pattern of understated confidence mixed with honest reflection."
      },
      {
        type: "divergent_strategy",
        text: "The principal's face when I said we were starting a club to 'interrogate institutional power structures' - I'll never forget it. Not angry, just... confused. 'Like student government?' she asked. 'More like questioning whether student government is real power or just the appearance of it,' I said, probably sounding more confident than I felt. She approved it anyway. That confusion-to-curiosity shift happened with every new member: first they came for the college resume line, then they stayed because we were actually talking about stuff that mattered.",
        rationale: "Divergent opening that starts with power dynamic (you vs principal) rather than club formation. Shows intellectual courage through dialogue and creates immediate stakes. The meta-commentary about resume motivation vs genuine engagement directly addresses typical 'club founding' essay pitfalls.",
        fingerprint_connection: "Uses your contrarian insight (question authority through questioning) as the structural organizing principle. Opens with the tension of challenging power directly, which is more narratively risky but more memorable."
      }
    ]
  },
  {
    id: "reflection_001",
    quote: "This experience taught me that intellectual ideas only matter when they connect to real-world action.",
    severity: "medium" as const,
    rubric_category: "reflection_meaning",
    suggestions: [
      {
        type: "polished_original",
        text: "I used to think reading Foucault made me an intellectual. Now I know the real test is whether you can get seventeen-year-olds to care about municipal budget line items. Theory without practice is just performance - something I learned when my most abstract debate proposal (on the semiotics of school uniforms) got zero interest, but my question about why student parking fees subsidize faculty salaries packed the room.",
        rationale: "Replaces generic insight ('ideas need action') with specific, earned realization tied to actual club experience. The concrete examples (budget line items, parking fee debate) prove the insight rather than stating it. Shows growth from performative intellectualism to genuine engagement.",
        fingerprint_connection: "Connects to your experience of starting with theory (Foucault opening) and discovering its limits through practice. Uses your specific club topics as evidence."
      },
      {
        type: "voice_amplifier",
        text: "The Foucault books I read in August made me feel smart. The debates we had in March made me actually think. There's a difference between intellectual performance and intellectual community - one makes you look good, the other makes you uncomfortable and better. I'm still not sure I fully understand 'discourse and resistance,' but I know what it looks like when twenty-seven people realize they can question the rules everyone else accepts.",
        rationale: "Uses temporal contrast (August vs March) to show evolution. The distinction between 'feeling smart' and 'actually thinking' captures intellectual humility. Admission of still not fully understanding Foucault is vulnerable and authentic.",
        fingerprint_connection: "Matches your tonal pattern of understated reflection mixed with honest limitation. The final image (27 people questioning rules) circles back to opening energy without repeating it."
      },
      {
        type: "divergent_strategy",
        text: "Foucault never founded a high school debate club, but I think he'd understand why ours mattered more than I expected. Power isn't just about who makes the rules - it's about who feels entitled to question them. When Sarah, who'd never spoken in class, stood up and challenged our assistant principal about the new phone policy using arguments we'd practiced, I realized we weren't teaching debate techniques. We were redistributing confidence.",
        rationale: "Divergent approach that makes Foucault a character rather than just a reference. 'Redistributing confidence' is a much sharper insight than 'ideas need action' - it reframes the club's impact in power-structure terms that align with the Foucault framing. The Sarah example provides human evidence.",
        fingerprint_connection: "Uses your philosophical lens (power structures, discourse) as the analytical framework for understanding club impact, which is more sophisticated than separating theory from practice."
      }
    ]
  }
];

// Build test request
const testRequest = {
  workshopItems: SAMPLE_WORKSHOP_ITEMS,
  essayText: SAMPLE_ESSAY,
  promptText: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.",
  promptTitle: "UC PIQ #1 - Leadership",
  voiceFingerprint: SAMPLE_VOICE_FINGERPRINT,
  experienceFingerprint: SAMPLE_EXPERIENCE_FINGERPRINT,
  rubricDimensionDetails: SAMPLE_RUBRIC,
  currentNQI: 58
};

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function testTeachingLayer() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING TEACHING LAYER (Phase 19)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    console.error('   Set it with: export ANTHROPIC_API_KEY="your-key"');
    process.exit(1);
  }

  console.log('📝 Test Configuration:');
  console.log(`   Essay length: ${SAMPLE_ESSAY.length} chars`);
  console.log(`   Workshop items: ${SAMPLE_WORKSHOP_ITEMS.length}`);
  console.log(`   Current NQI: ${testRequest.currentNQI}/100`);
  console.log('');

  try {
    console.log('🚀 Calling teaching-layer function...');
    console.log('');

    const startTime = Date.now();

    // Import and call the teaching layer logic directly
    // (We'll test via API call to localhost when deployed, but for now test logic directly)

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
        system: `You are a master writing coach who teaches through deep understanding and transferable principles.

Your students have already received specific revision suggestions. Your job is NOT to repeat those suggestions, but to help them understand:

1. THE PROBLEM (What's happening + Why it matters)
2. THE WRITING PRINCIPLE AT PLAY (Teach the craft, not just the fix)
3. HOW TO APPLY THIS STRATEGY (Empower them to use it elsewhere)
4. THE MAGNITUDE OF CHANGE (Surgical tweak vs fundamental rethinking)

Generate teaching guidance with:
- problem.description (200-350 chars): Deep understanding of what's happening + why it's not working
- problem.whyItMatters (150-250 chars): Strategic consequence + admissions impact
- craftPrinciple (150-300 chars): Transferable writing principle
- applicationStrategy (150-300 chars): How to identify this pattern elsewhere
- changeMagnitude: surgical | moderate | structural
- magnitudeGuidance (100-150 chars): Setting expectations

Return ONLY valid JSON matching the EnhancedWorkshopItem structure.`,
        messages: [
          {
            role: 'user',
            content: `Provide teaching guidance for these workshop suggestions.

**ESSAY CONTEXT:**
Prompt: ${testRequest.promptTitle}
Current NQI: ${testRequest.currentNQI}/100

**ESSAY TEXT:**
${testRequest.essayText}

**VOICE FINGERPRINT:**
${JSON.stringify(testRequest.voiceFingerprint, null, 2)}

**EXPERIENCE FINGERPRINT:**
${JSON.stringify(testRequest.experienceFingerprint, null, 2)}

**RUBRIC ANALYSIS:**
${JSON.stringify(testRequest.rubricDimensionDetails, null, 2)}

**WORKSHOP SUGGESTIONS:**
${JSON.stringify(testRequest.workshopItems, null, 2)}

For each workshop item, generate teaching guidance that teaches writing craft, not just prescribing edits.`,
          },
        ],
      }),
    });

    const result = await response.json();
    const responseText = result.content[0].text;

    const duration = (Date.now() - startTime) / 1000;

    console.log(`✅ API call complete (${duration.toFixed(1)}s)`);
    console.log('');

    // Show raw response for debugging
    console.log('RAW RESPONSE (first 1000 chars):');
    console.log(responseText.substring(0, 1000));
    console.log('');

    // Parse response
    let enhancedData;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      enhancedData = JSON.parse(jsonString);
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      console.error('Raw response:');
      console.error(responseText);
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 TEACHING LAYER OUTPUT ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    const items = enhancedData.enhancedItems || [];

    if (items.length === 0) {
      console.error('❌ No enhanced items returned');
      process.exit(1);
    }

    console.log(`✅ Enhanced ${items.length} workshop items`);
    console.log('');

    // Analyze each item
    items.forEach((item: any, idx: number) => {
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`ITEM ${idx + 1}: ${item.id || 'unknown'}`);
      console.log('─────────────────────────────────────────────────────────────');
      console.log('');

      // THE PROBLEM
      console.log('📌 THE PROBLEM:');
      if (item.teaching?.problem?.description) {
        console.log(`   Description: ${item.teaching.problem.description.length} chars`);
        console.log(`   "${item.teaching.problem.description}"`);
        console.log('');

        if (item.teaching.problem.description.length < 200) {
          console.log('   ⚠️  TOO SHORT - needs 200+ chars');
        } else if (item.teaching.problem.description.length > 350) {
          console.log('   ⚠️  TOO LONG - keep under 350 chars');
        } else {
          console.log('   ✅ Good length');
        }
      } else {
        console.log('   ❌ MISSING problem.description');
      }
      console.log('');

      if (item.teaching?.problem?.whyItMatters) {
        console.log(`   Why It Matters: ${item.teaching.problem.whyItMatters.length} chars`);
        console.log(`   "${item.teaching.problem.whyItMatters}"`);
        console.log('');

        if (item.teaching.problem.whyItMatters.length < 150) {
          console.log('   ⚠️  TOO SHORT - needs 150+ chars');
        } else if (item.teaching.problem.whyItMatters.length > 250) {
          console.log('   ⚠️  TOO LONG - keep under 250 chars');
        } else {
          console.log('   ✅ Good length');
        }
      } else {
        console.log('   ❌ MISSING problem.whyItMatters');
      }
      console.log('');

      // CRAFT PRINCIPLE
      console.log('📚 CRAFT PRINCIPLE:');
      if (item.teaching?.craftPrinciple) {
        console.log(`   ${item.teaching.craftPrinciple.length} chars`);
        console.log(`   "${item.teaching.craftPrinciple}"`);
        console.log('');

        if (item.teaching.craftPrinciple.length < 150) {
          console.log('   ⚠️  Could be deeper - aim for 250+ chars');
        } else {
          console.log('   ✅ Good depth');
        }
      } else {
        console.log('   ❌ MISSING');
      }
      console.log('');

      // APPLICATION STRATEGY
      console.log('🎯 APPLICATION STRATEGY:');
      if (item.teaching?.applicationStrategy) {
        console.log(`   ${item.teaching.applicationStrategy.length} chars`);
        console.log(`   "${item.teaching.applicationStrategy}"`);
        console.log('');

        if (item.teaching.applicationStrategy.length < 150) {
          console.log('   ⚠️  Could be more actionable - aim for 250+ chars');
        } else {
          console.log('   ✅ Good actionability');
        }
      } else {
        console.log('   ❌ MISSING');
      }
      console.log('');

      // MAGNITUDE
      console.log('⚙️  MAGNITUDE:');
      if (item.teaching?.changeMagnitude) {
        console.log(`   Type: ${item.teaching.changeMagnitude}`);
        console.log(`   Guidance: "${item.teaching.magnitudeGuidance}"`);

        const magnitudes = ['surgical', 'moderate', 'structural'];
        if (!magnitudes.includes(item.teaching.changeMagnitude)) {
          console.log('   ❌ Invalid magnitude - must be surgical/moderate/structural');
        } else {
          console.log('   ✅ Valid magnitude');
        }
      } else {
        console.log('   ❌ MISSING changeMagnitude');
      }
      console.log('');

      // METADATA
      console.log('📈 METADATA:');
      console.log(`   Teaching Depth: ${item.teachingDepth || 'MISSING'}`);
      console.log(`   Estimated NQI Gain: ${item.estimatedImpact?.nqiGain || 'MISSING'}`);
      console.log(`   Dimensions Affected: ${item.estimatedImpact?.dimensionsAffected?.length || 0}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`   Items enhanced: ${items.length}`);
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    console.log('');
    console.log('💾 Full output saved to: teaching-layer-output.json');

    // Save full output for review
    const fs = await import('fs/promises');
    await fs.writeFile(
      'teaching-layer-output.json',
      JSON.stringify(enhancedData, null, 2)
    );

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testTeachingLayer();
