/**
 * Quick test to demonstrate PIQ-quality teaching output
 */

import { Stage1ATeachingService } from './src/services/commonAppWorkshop/services/stage1ATeachingService';

const SAMPLE_ESSAY = `I have always been passionate about learning. Throughout my academic career, I've maintained
a 4.0 GPA and taken the most challenging courses available. I believe education is important
because it opens doors to opportunities. In the future, I want to use my education to make
a difference in the world. My intellectual curiosity drives me to excel in all my classes,
and I'm excited to continue this journey at Stanford.`;

const COLLEGE_RESEARCH = {
  college_name: 'Stanford University',
  relevant_core_values: [
    {
      valueId: 'intellectual_vitality',
      valueName: 'Intellectual Vitality',
      description: 'Stanford seeks students with genuine curiosity and love of learning for its own sake',
      evidence: [
        {
          text: 'We want students who lose track of time in the library',
          source: 'Stanford Admission Dean, 2024',
          type: 'direct_quote'
        }
      ]
    }
  ]
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PIQ-QUALITY TEACHING OUTPUT DEMONSTRATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const service = new Stage1ATeachingService();

  const result = await service.generateTeaching(
    SAMPLE_ESSAY,
    'What matters most to you, and why? (250 words)',
    COLLEGE_RESEARCH as any
  );

  console.log('\n📚 FULL PIQ-QUALITY TEACHING OUTPUT\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const cf = result.conceptual_foundation;

  console.log('🎯 OPENING REFLECTION:\n');
  console.log(cf.opening_reflection);
  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('✨ QUALITY ANCHORS (What is Working):\n');
  cf.quality_anchors.forEach((anchor, idx) => {
    console.log(`Anchor #${idx + 1}:`);
    console.log(`  Quote: "${anchor.quote}"`);
    console.log(`  Why it works: ${anchor.why_it_works}`);
    console.log(`  Strength: ${anchor.dimension_strength}`);
    console.log('');
  });
  console.log('─'.repeat(60) + '\n');

  console.log('🔥 VOICE FINGERPRINT (Their Superpower):\n');
  console.log(`  Writing Style: ${cf.voice_fingerprint.writing_style}`);
  console.log(`  Superpower: ${cf.voice_fingerprint.superpower}`);
  console.log(`  Phrases to Protect:`);
  cf.voice_fingerprint.authentic_phrases_to_protect.forEach(phrase => {
    console.log(`    - "${phrase}"`);
  });
  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('🎓 COLLEGE ALIGNMENT (Values Taught Through THEIR Essay):\n');
  cf.college_alignment.forEach((alignment, idx) => {
    console.log(`Value #${idx + 1}: ${alignment.value}`);
    console.log(`  How your essay shows it:`);
    console.log(`    ${alignment.how_your_essay_shows_it}`);
    console.log(`  Where to push deeper:`);
    console.log(`    ${alignment.where_to_push_deeper}`);
    console.log('');
  });
  console.log('─'.repeat(60) + '\n');

  console.log('🎬 NARRATIVE GAPS (What is Missing):\n');
  console.log(`  Main observation:`);
  console.log(`    ${cf.narrative_gaps.main_observation}`);
  console.log(`  Specific scene needed:`);
  console.log(`    ${cf.narrative_gaps.specific_scene_needed}`);
  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('📝 PROMPT CONNECTION:\n');
  console.log(`  Prompt: "${cf.prompt_connection.prompt}"`);
  console.log(`  Your current answer: ${cf.prompt_connection.your_current_answer}`);
  console.log(`  Why it works: ${cf.prompt_connection.why_it_works}`);
  console.log(`  How to sharpen: ${cf.prompt_connection.how_to_sharpen}`);
  console.log('\n' + '─'.repeat(60) + '\n');

  console.log('💰 COST & METRICS:\n');
  console.log(`  Cost: $${result.cost.toFixed(3)}`);
  console.log(`  Tokens: ${result.tokens_used.input} in, ${result.tokens_used.output} out`);
  console.log('\n═══════════════════════════════════════════════════════════');

  // Write to file as well
  const output = {
    opening_reflection: cf.opening_reflection,
    quality_anchors: cf.quality_anchors,
    voice_fingerprint: cf.voice_fingerprint,
    college_alignment: cf.college_alignment,
    narrative_gaps: cf.narrative_gaps,
    prompt_connection: cf.prompt_connection,
    cost: result.cost,
    tokens: result.tokens_used
  };

  require('fs').writeFileSync(
    'PIQ_TEACHING_OUTPUT.json',
    JSON.stringify(output, null, 2)
  );

  console.log('\n✅ Full output also saved to: PIQ_TEACHING_OUTPUT.json\n');
}

main().catch(console.error);
