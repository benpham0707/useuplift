/**
 * System Comparison Test: Old vs New (with Experience Fingerprinting)
 *
 * This test runs both systems on the same essay and compares:
 * 1. Quality of suggestions generated
 * 2. Authenticity/uniqueness of output
 * 3. Whether fingerprint constraints actually improve results
 *
 * We use the Lego essay from Phase 14-15 tests for direct comparison.
 */

import { analyzeVoiceFingerprint } from '../src/services/narrativeWorkshop/analyzers/voiceFingerprintAnalyzer';
import { analyzeExperienceFingerprint, buildDivergenceConstraints, ExperienceFingerprint } from '../src/services/narrativeWorkshop/analyzers/experienceFingerprintAnalyzer';
import { callClaudeWithRetry } from '../src/lib/llm/claude';
import * as fs from 'fs';

// ============================================================================
// TEST ESSAY (Same as Phase 14-15 for direct comparison)
// ============================================================================

const LEGO_ESSAY = `I was always captivated by puzzles throughout my life. I loved the moment after spending hours trying to put together a 1000-piece jigsaw just to finally place in the last piece. As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage. I discovered new passions; I invested a fortune into building my first computer. After figuring out how to arrange all the components onto a motherboard and downloading, debugging, and coding small programs, I realized the connection to my childhood—I was playing with Legos again.

Throughout high school, I gained the knowledge necessary to build a portfolio of my work. Learning more programming languages like HTML, CSS, and JavaScript provided me with powerful tools. Although I had not possessed the best knowledge of HTML yet, I decided to challenge myself and create a website. Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions.

My website now has over 500 registered users, and this brings me immense joy. Some might view programming as a tedious task, but for me, it was building, creating, and overcoming. Each error message was just another puzzle piece to place. The satisfaction of finally solving a complex bug mirrors the exact feeling I had as a child completing that 1000-piece jigsaw. My garage still holds those old Lego sets, but now I've found a new way to build—one that has real-world impact.`;

// ============================================================================
// PROMPTS: OLD SYSTEM (Without Experience Fingerprint)
// ============================================================================

const OLD_SYSTEM_PROMPT = `You are a Narrative Editor helping improve college essays.

**YOUR TASK:**
Generate 3 suggestion options to improve this weak text passage.

**GUIDELINES:**
1. Eliminate passive voice
2. Replace generic language with specific details
3. Show, don't tell
4. Use active verbs
5. Add sensory details where possible

**OUTPUT FORMAT:**
JSON object with:
- "suggestions": array of 3 objects:
  - "text": string (The improved text)
  - "rationale": string (Why this is better - 30-50 words)
  - "type": "polished_original" | "voice_amplifier" | "divergent_strategy"
`;

// ============================================================================
// PROMPTS: NEW SYSTEM (With Experience Fingerprint)
// ============================================================================

const NEW_SYSTEM_PROMPT = `You are a Narrative Editor helping a student sound MORE LIKE THEMSELVES while BREAKING BEYOND typical essay patterns.

**YOUR CORE MISSION:**
The student's essay should read like THEY wrote it - their authentic voice processing their own experience.
Every suggestion should sound like something THIS SPECIFIC PERSON would write, not generic "good writing."

**THE AUTHENTICITY TEST:**
Before writing anything, ask: "Could this have ONLY been written by this person?"
- If yes → you've captured their voice
- If anyone could have written it → try again with more specificity to their experience

**ANTI-CONVERGENCE MANDATE:**
AI writing naturally drifts toward:
- The same narrative arc (setup → struggle → triumph → lesson)
- "Safe" phrasings that feel polished but generic
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats

You MUST actively RESIST these patterns. When in doubt, choose the more surprising, more specific, more uncomfortable option.

**WHAT TO AVOID:**
- Writing that sounds impressive but could be anyone's
- Insights that are generic life lessons rather than specific realizations
- Language that sounds like an AI or essay guide
- "Performed" vulnerability (struggle mentioned just to show triumph)
- The setup → struggle → triumph → lesson arc (unless it's subverted)

**YOUR MANDATE:**
1. Read the Experience Fingerprint carefully
2. Generate 3 options that sound like THIS PERSON wrote them
3. Each option MUST incorporate elements from the Experience Fingerprint
4. Rationales should teach writing principles

**OUTPUT FORMAT:**
JSON object with:
- "suggestions": array of 3 objects:
  - "text": string (The improved text - must incorporate fingerprint elements)
  - "rationale": string (Why this is better - 30-50 words)
  - "type": "polished_original" | "voice_amplifier" | "divergent_strategy"
  - "fingerprint_connection": string (How this connects to their unique experience)
`;

// ============================================================================
// QUALITY EVALUATION PROMPT
// ============================================================================

const QUALITY_EVAL_PROMPT = `You are an expert college admissions essay evaluator. Rate each suggestion on these criteria:

**SCORING CRITERIA (0-10 each):**

1. **Authenticity** - Does this sound like a real teenager wrote it, or like an AI/essay guide?
   - 0-3: Clearly AI/template
   - 4-6: Generic but passable
   - 7-10: Genuinely human voice

2. **Specificity** - Are details specific to THIS person's experience?
   - 0-3: Could be anyone's story
   - 4-6: Has some specific elements
   - 7-10: Irreplaceable to this person

3. **Originality** - Does this avoid common essay patterns and clichés?
   - 0-3: Uses typical arc/language
   - 4-6: Somewhat fresh
   - 7-10: Surprising and unique angle

4. **Craft** - Is the writing technically strong?
   - 0-3: Awkward or weak
   - 4-6: Competent
   - 7-10: Polished and powerful

5. **Voice Preservation** - Does this match the student's original voice?
   - 0-3: Different voice entirely
   - 4-6: Somewhat consistent
   - 7-10: Amplifies their natural voice

**OUTPUT FORMAT:**
{
  "scores": {
    "authenticity": number,
    "specificity": number,
    "originality": number,
    "craft": number,
    "voicePreservation": number
  },
  "totalScore": number (out of 50),
  "strengths": ["..."],
  "weaknesses": ["..."],
  "wouldStandOut": boolean (Would this actually stand out to admissions officers?)
}
`;

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runSystemComparison() {
  console.log('='.repeat(80));
  console.log('SYSTEM COMPARISON: OLD vs NEW (with Experience Fingerprinting)');
  console.log('='.repeat(80));
  console.log();

  const results: any = {
    essay: 'LEGO_ESSAY',
    targetPassage: '',
    oldSystem: { suggestions: [], evaluations: [], avgScore: 0 },
    newSystem: { suggestions: [], evaluations: [], avgScore: 0 },
    fingerprint: null,
    winner: ''
  };

  // Target passage to improve
  const targetPassage = "I was always captivated by puzzles throughout my life. I loved the moment after spending hours trying to put together a 1000-piece jigsaw just to finally place in the last piece.";
  results.targetPassage = targetPassage;

  console.log('📝 Target Passage to Improve:');
  console.log(`"${targetPassage}"`);
  console.log();

  // Step 1: Get Voice Fingerprint (used by both)
  console.log('━'.repeat(80));
  console.log('STEP 1: Extracting Voice Fingerprint');
  console.log('━'.repeat(80));
  const voice = await analyzeVoiceFingerprint(LEGO_ESSAY);
  console.log(`   Voice Tone: ${voice.tone}`);
  console.log(`   Voice Markers: ${voice.markers.join(', ')}`);
  console.log();

  // Step 2: Get Experience Fingerprint (only for new system)
  console.log('━'.repeat(80));
  console.log('STEP 2: Extracting Experience Fingerprint (NEW SYSTEM ONLY)');
  console.log('━'.repeat(80));
  const experienceFingerprint = await analyzeExperienceFingerprint(LEGO_ESSAY, voice);
  results.fingerprint = experienceFingerprint;

  // Log key fingerprint elements
  console.log('\n   📍 UNIQUE ELEMENTS EXTRACTED:');
  if (experienceFingerprint.unusualCircumstance?.description) {
    console.log(`   • Unusual Circumstance: ${experienceFingerprint.unusualCircumstance.description}`);
  }
  if (experienceFingerprint.unexpectedEmotion?.emotion) {
    console.log(`   • Unexpected Emotion: ${experienceFingerprint.unexpectedEmotion.emotion}`);
  }
  if (experienceFingerprint.contraryInsight?.insight) {
    console.log(`   • Contrary Insight: ${experienceFingerprint.contraryInsight.insight}`);
  }
  if (experienceFingerprint.specificSensoryAnchor?.sensory) {
    console.log(`   • Sensory Anchor: ${experienceFingerprint.specificSensoryAnchor.sensory}`);
  }

  console.log('\n   📋 DIVERGENCE REQUIREMENTS:');
  const divergenceConstraints = buildDivergenceConstraints(experienceFingerprint);
  console.log(divergenceConstraints.substring(0, 500) + '...');
  console.log();

  // Step 3: Generate suggestions with OLD system
  console.log('━'.repeat(80));
  console.log('STEP 3: Generating Suggestions - OLD SYSTEM (no fingerprint)');
  console.log('━'.repeat(80));

  const oldPrompt = `
**VOICE CONTEXT:**
- Tone: ${voice.tone}
- Markers: ${voice.markers.join(', ')}

**TEXT TO IMPROVE:**
"${targetPassage}"

Generate 3 suggestions to improve this opening.
`;

  const oldResponse = await callClaudeWithRetry(oldPrompt, {
    systemPrompt: OLD_SYSTEM_PROMPT,
    temperature: 0.7,
    useJsonMode: true,
    maxTokens: 1500
  });

  let oldSuggestions: any[] = [];
  try {
    const content = typeof oldResponse.content === 'string'
      ? JSON.parse(oldResponse.content.match(/\{[\s\S]*\}/)?.[0] || '{}')
      : oldResponse.content;
    oldSuggestions = content.suggestions || [];
  } catch (e) {
    console.error('Failed to parse old system response');
  }

  results.oldSystem.suggestions = oldSuggestions;

  console.log('\n   OLD SYSTEM SUGGESTIONS:');
  oldSuggestions.forEach((s: any, i: number) => {
    console.log(`\n   ${i + 1}. [${s.type}]`);
    console.log(`      "${s.text?.substring(0, 100)}..."`);
    console.log(`      Rationale: ${s.rationale?.substring(0, 80)}...`);
  });

  // Step 4: Generate suggestions with NEW system
  console.log('\n━'.repeat(80));
  console.log('STEP 4: Generating Suggestions - NEW SYSTEM (with fingerprint)');
  console.log('━'.repeat(80));

  const newPrompt = `
## EXPERIENCE FINGERPRINT (THE IRREPLACEABLE ELEMENTS)
${divergenceConstraints}

---

**VOICE CONTEXT:**
- Tone: ${voice.tone}
- Markers: ${voice.markers.join(', ')}

**TEXT TO IMPROVE:**
"${targetPassage}"

Generate 3 suggestions that incorporate the student's unique experience fingerprint.
`;

  const newResponse = await callClaudeWithRetry(newPrompt, {
    systemPrompt: NEW_SYSTEM_PROMPT,
    temperature: 0.7,
    useJsonMode: true,
    maxTokens: 1500
  });

  let newSuggestions: any[] = [];
  try {
    const content = typeof newResponse.content === 'string'
      ? JSON.parse(newResponse.content.match(/\{[\s\S]*\}/)?.[0] || '{}')
      : newResponse.content;
    newSuggestions = content.suggestions || [];
  } catch (e) {
    console.error('Failed to parse new system response');
  }

  results.newSystem.suggestions = newSuggestions;

  console.log('\n   NEW SYSTEM SUGGESTIONS:');
  newSuggestions.forEach((s: any, i: number) => {
    console.log(`\n   ${i + 1}. [${s.type}]`);
    console.log(`      "${s.text?.substring(0, 100)}..."`);
    console.log(`      Rationale: ${s.rationale?.substring(0, 80)}...`);
    if (s.fingerprint_connection) {
      console.log(`      Fingerprint: ${s.fingerprint_connection?.substring(0, 60)}...`);
    }
  });

  // Step 5: Evaluate ALL suggestions with blind scoring
  console.log('\n━'.repeat(80));
  console.log('STEP 5: Blind Quality Evaluation');
  console.log('━'.repeat(80));

  // Evaluate old system suggestions
  console.log('\n   Evaluating OLD SYSTEM suggestions...');
  for (let i = 0; i < oldSuggestions.length; i++) {
    const suggestion = oldSuggestions[i];
    const evalPrompt = `
**ORIGINAL TEXT:**
"${targetPassage}"

**IMPROVED VERSION:**
"${suggestion.text}"

Evaluate this improvement against the criteria.
`;

    const evalResponse = await callClaudeWithRetry(evalPrompt, {
      systemPrompt: QUALITY_EVAL_PROMPT,
      temperature: 0.1,
      useJsonMode: true,
      maxTokens: 800
    });

    try {
      const content = typeof evalResponse.content === 'string'
        ? JSON.parse(evalResponse.content.match(/\{[\s\S]*\}/)?.[0] || '{}')
        : evalResponse.content;
      results.oldSystem.evaluations.push(content);
      console.log(`      Suggestion ${i + 1}: ${content.totalScore || 0}/50`);
    } catch (e) {
      console.log(`      Suggestion ${i + 1}: Failed to evaluate`);
    }
  }

  // Evaluate new system suggestions
  console.log('\n   Evaluating NEW SYSTEM suggestions...');
  for (let i = 0; i < newSuggestions.length; i++) {
    const suggestion = newSuggestions[i];
    const evalPrompt = `
**ORIGINAL TEXT:**
"${targetPassage}"

**IMPROVED VERSION:**
"${suggestion.text}"

Evaluate this improvement against the criteria.
`;

    const evalResponse = await callClaudeWithRetry(evalPrompt, {
      systemPrompt: QUALITY_EVAL_PROMPT,
      temperature: 0.1,
      useJsonMode: true,
      maxTokens: 800
    });

    try {
      const content = typeof evalResponse.content === 'string'
        ? JSON.parse(evalResponse.content.match(/\{[\s\S]*\}/)?.[0] || '{}')
        : evalResponse.content;
      results.newSystem.evaluations.push(content);
      console.log(`      Suggestion ${i + 1}: ${content.totalScore || 0}/50`);
    } catch (e) {
      console.log(`      Suggestion ${i + 1}: Failed to evaluate`);
    }
  }

  // Step 6: Calculate final scores
  console.log('\n━'.repeat(80));
  console.log('STEP 6: FINAL RESULTS');
  console.log('━'.repeat(80));

  const oldAvg = results.oldSystem.evaluations.length > 0
    ? results.oldSystem.evaluations.reduce((sum: number, e: any) => sum + (e.totalScore || 0), 0) / results.oldSystem.evaluations.length
    : 0;
  const newAvg = results.newSystem.evaluations.length > 0
    ? results.newSystem.evaluations.reduce((sum: number, e: any) => sum + (e.totalScore || 0), 0) / results.newSystem.evaluations.length
    : 0;

  results.oldSystem.avgScore = oldAvg;
  results.newSystem.avgScore = newAvg;
  results.winner = newAvg > oldAvg ? 'NEW SYSTEM' : (oldAvg > newAvg ? 'OLD SYSTEM' : 'TIE');

  console.log(`
   ┌─────────────────────────────────────────────────┐
   │              FINAL COMPARISON                   │
   ├─────────────────────────────────────────────────┤
   │  OLD SYSTEM (no fingerprint):  ${oldAvg.toFixed(1)}/50 avg      │
   │  NEW SYSTEM (with fingerprint): ${newAvg.toFixed(1)}/50 avg      │
   ├─────────────────────────────────────────────────┤
   │  WINNER: ${results.winner.padEnd(38)}│
   └─────────────────────────────────────────────────┘
  `);

  // Detailed breakdown
  console.log('\n   📊 DETAILED BREAKDOWN:');
  console.log('\n   OLD SYSTEM:');
  results.oldSystem.evaluations.forEach((e: any, i: number) => {
    if (e.scores) {
      console.log(`      ${i + 1}. Auth:${e.scores.authenticity}/10 Spec:${e.scores.specificity}/10 Orig:${e.scores.originality}/10 Craft:${e.scores.craft}/10 Voice:${e.scores.voicePreservation}/10 = ${e.totalScore}/50`);
    }
  });

  console.log('\n   NEW SYSTEM:');
  results.newSystem.evaluations.forEach((e: any, i: number) => {
    if (e.scores) {
      console.log(`      ${i + 1}. Auth:${e.scores.authenticity}/10 Spec:${e.scores.specificity}/10 Orig:${e.scores.originality}/10 Craft:${e.scores.craft}/10 Voice:${e.scores.voicePreservation}/10 = ${e.totalScore}/50`);
    }
  });

  // Calculate dimension averages
  if (results.oldSystem.evaluations.length > 0 && results.newSystem.evaluations.length > 0) {
    const calcAvg = (evals: any[], dimension: string) => {
      const valid = evals.filter((e: any) => e.scores?.[dimension] !== undefined);
      return valid.length > 0
        ? valid.reduce((sum: number, e: any) => sum + (e.scores?.[dimension] || 0), 0) / valid.length
        : 0;
    };

    console.log('\n   📈 DIMENSION COMPARISON:');
    console.log('   ┌────────────────────┬──────────┬──────────┬─────────┐');
    console.log('   │ Dimension          │ OLD      │ NEW      │ DELTA   │');
    console.log('   ├────────────────────┼──────────┼──────────┼─────────┤');

    const dimensions = ['authenticity', 'specificity', 'originality', 'craft', 'voicePreservation'];
    dimensions.forEach(dim => {
      const oldVal = calcAvg(results.oldSystem.evaluations, dim);
      const newVal = calcAvg(results.newSystem.evaluations, dim);
      const delta = newVal - oldVal;
      const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
      const winner = delta > 0.5 ? '✅' : (delta < -0.5 ? '❌' : '➖');
      console.log(`   │ ${dim.padEnd(18)} │ ${oldVal.toFixed(1).padStart(8)} │ ${newVal.toFixed(1).padStart(8)} │ ${deltaStr.padStart(5)} ${winner} │`);
    });
    console.log('   └────────────────────┴──────────┴──────────┴─────────┘');
  }

  // Save results
  const outputPath = 'TEST_OUTPUT_SYSTEM_COMPARISON.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${outputPath}`);

  // Print actual suggestions for manual review
  console.log('\n━'.repeat(80));
  console.log('ACTUAL SUGGESTIONS FOR MANUAL REVIEW');
  console.log('━'.repeat(80));

  console.log('\n🔴 OLD SYSTEM SUGGESTIONS:');
  oldSuggestions.forEach((s: any, i: number) => {
    console.log(`\n${i + 1}. "${s.text}"`);
  });

  console.log('\n🟢 NEW SYSTEM SUGGESTIONS:');
  newSuggestions.forEach((s: any, i: number) => {
    console.log(`\n${i + 1}. "${s.text}"`);
  });
}

// Run test
runSystemComparison().catch(console.error);
