/**
 * Test: Inline Editing E2E — All 15 Commands x 3 Passages Each
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-inline-editing-e2e.ts
 * NEEDS API key — calls InlineEditorService.applyCommand() for all commands
 *
 * For each of the 15 editing commands:
 *   1. Tests against 3 carefully chosen passages (45 total calls)
 *   2. Applies command-specific quality checks (not just shape checks)
 *   3. Verifies result structure (primary, creative, teachingNote, principle)
 *   4. Tracks cost and latency per command
 *
 * Pass criteria:
 *   - Each command must pass quality checks on >= 2 of 3 passages (67%)
 *   - Overall: >= 12 of 15 commands must pass (80%)
 *   - Zero structural failures (valid JSON with all required fields)
 */

import { requireApiKey } from './utils/loadEnv';

const apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { InlineEditorService } from '../src/services/inlineEditor/inlineEditorService';
import type { EditingCommand, InlineEditRequest, InlineEditResult } from '../src/services/inlineEditor/types';

// ============================================================================
// TEST PASSAGES (5 distinct voices / essay types, 80-150 words each)
// ============================================================================

/**
 * PASSAGE_1: Common App narrative — casual voice, vague leadership moment,
 * summarizes instead of showing, no specifics or dialogue
 */
const PASSAGE_1 = `When I first started running our school's environmental club, I had no idea what I was getting into. I helped organize a bunch of events and worked with a lot of different people to get things done. We raised money for various causes and I learned a lot about what it means to be a leader. My advisor told me that I was doing a good job and that our efforts were making a difference. Looking back, the whole experience really shaped who I am. It taught me so much about responsibility and working with others, and I'm grateful for every moment of it.`;

/**
 * PASSAGE_2: PIQ response — formal voice, cliche-heavy, generic reflection,
 * weak opening, moralizing ending
 */
const PASSAGE_2 = `Ever since I was young, I have been passionate about connecting with people from different backgrounds. This experience taught me the value of empathy and understanding. When I volunteered at the refugee center, it opened my eyes to the struggles that many families face on a daily basis. I realized the importance of being a global citizen who gives back to the community. The tapestry of experiences I gathered along the way shaped who I am today. This journey of self-discovery was truly a transformative experience that left a profound impact on my worldview, and I believe that everyone should push themselves out of their comfort zone to grow.`;

/**
 * PASSAGE_3: Activity description — analytical voice, all claims no evidence,
 * vague roles, no measurable outcomes
 */
const PASSAGE_3 = `As captain of the Science Olympiad team, I significantly improved our team's performance and helped many students develop their skills. I coordinated practice sessions and worked with coaches to create a more structured training program. Our team demonstrated considerable growth throughout the season, and I played a key role in fostering a collaborative environment. Several members told me that the program was better than ever before. My leadership helped transform the team culture and the results we achieved were a testament to our collective hard work and dedication to excellence.`;

/**
 * PASSAGE_4: Supplemental "Why Us?" — emotional voice, compressed moments,
 * indirect dialogue, generic opening, rushed ending
 */
const PASSAGE_4 = `When I visited campus for the first time, I was immediately struck by the atmosphere. A professor in the engineering department told me that their program emphasized hands-on learning, which resonated with me deeply. Walking through the robotics lab, I saw students working on projects that seemed to combine everything I care about. The student ambassador mentioned that collaboration was at the heart of their experience. I knew right then that this was where I belonged, and I'm confident that attending this university will allow me to pursue my dreams and make meaningful contributions to the field.`;

/**
 * PASSAGE_5: Personal challenge — literary voice, over-written, filler-heavy,
 * cliche-heavy, emotions told not shown
 */
const PASSAGE_5 = `It was, in many ways, a roller coaster of emotions that I found myself navigating through during those difficult months. Against all odds, I managed to persevere through the health challenges that life threw my way. I felt incredibly overwhelmed at times, and there were moments when I genuinely questioned whether I would be able to continue with my studies. Nevertheless, I found the strength within myself to push forward, drawing on the support of my family and friends who were there for me through thick and thin. At the end of the day, this experience was truly a catalyst for change in my life and fostered my growth as a person.`;

// ============================================================================
// BANNED TERMS LIST (mirrors commandPrompts.ts BANNED_TERMS_LIST)
// ============================================================================

const BANNED_TERMS: string[] = [
  'delve into', 'tapestry of', 'beacon of', 'myriad of', 'multifaceted',
  'furthermore', 'moreover', 'nevertheless', 'henceforth', 'aforementioned',
  'testament to', 'harbinger of', 'embodiment of', 'microcosm of', 'epitome of',
  'manifestation of', 'culmination of', 'catalyst for change', 'pillar of strength',
  'mosaic of cultures', 'symphony of voices', 'kaleidoscope of emotions',
  'journey of self-discovery', 'passionate about', 'ever since I was young',
  'for as long as I can remember', 'sparked my passion', 'this experience taught me',
  'I learned that', 'it opened my eyes', 'I realized the importance of',
  'little did I know', 'it made me who I am today', 'I grew as a person',
  'I found my voice', 'it was a turning point',
  'in today\'s society', 'throughout my life', 'in conclusion',
  'at the end of the day', 'all in all', 'it is important to note that',
  'I believe that', 'in my opinion',
  'global citizen', 'make a difference', 'pushed me out of my comfort zone',
  'think outside the box', 'gave back to the community', 'truly humbling experience',
  'changed my perspective', 'opened my eyes to', 'against all odds',
  'transformative experience', 'profound impact', 'invaluable lesson',
  'fostered my growth', 'cultivated my passion', 'instilled in me',
  'galvanized', 'transcended', 'coalesced into', 'crystallized into',
];

// ============================================================================
// COMMAND → PASSAGE MAPPING (3 passages per command, with selected excerpts)
// ============================================================================

interface TestCase {
  passageLabel: string;
  fullDocument: string;
  selectedText: string;
  essayType: string;
}

const COMMAND_TESTS: Record<EditingCommand, TestCase[]> = {
  make_concrete: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'I helped organize a bunch of events and worked with a lot of different people to get things done.', essayType: 'common_app' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'I significantly improved our team\'s performance and helped many students develop their skills.', essayType: 'activity' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'I managed to persevere through the health challenges that life threw my way.', essayType: 'common_app' },
  ],
  show_dont_tell: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'the whole experience really shaped who I am. It taught me so much about responsibility and working with others', essayType: 'common_app' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'I was immediately struck by the atmosphere.', essayType: 'supplemental' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'I felt incredibly overwhelmed at times, and there were moments when I genuinely questioned whether I would be able to continue', essayType: 'common_app' },
  ],
  clarify_learning: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'I learned a lot about what it means to be a leader.', essayType: 'common_app' },
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'This experience taught me the value of empathy and understanding.', essayType: 'piq' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'this experience was truly a catalyst for change in my life and fostered my growth as a person.', essayType: 'common_app' },
  ],
  add_stakes: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'I had no idea what I was getting into. I helped organize a bunch of events', essayType: 'common_app' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'I coordinated practice sessions and worked with coaches to create a more structured training program.', essayType: 'activity' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'I\'m confident that attending this university will allow me to pursue my dreams and make meaningful contributions', essayType: 'supplemental' },
  ],
  strengthen_voice: [
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'I realized the importance of being a global citizen who gives back to the community.', essayType: 'piq' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'My leadership helped transform the team culture and the results we achieved were a testament to our collective hard work', essayType: 'activity' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'I found the strength within myself to push forward, drawing on the support of my family and friends', essayType: 'common_app' },
  ],
  cut_filler: [
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'This journey of self-discovery was truly a transformative experience that left a profound impact on my worldview, and I believe that everyone should push themselves out of their comfort zone to grow.', essayType: 'piq' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'It was, in many ways, a roller coaster of emotions that I found myself navigating through during those difficult months.', essayType: 'common_app' },
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'and I\'m grateful for every moment of it.', essayType: 'common_app' },
  ],
  add_evidence: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'We raised money for various causes', essayType: 'common_app' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'Our team demonstrated considerable growth throughout the season, and I played a key role in fostering a collaborative environment.', essayType: 'activity' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'I saw students working on projects that seemed to combine everything I care about.', essayType: 'supplemental' },
  ],
  deepen_vulnerability: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'I had no idea what I was getting into.', essayType: 'common_app' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'I knew right then that this was where I belonged', essayType: 'supplemental' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'I felt incredibly overwhelmed at times, and there were moments when I genuinely questioned whether I would be able to continue', essayType: 'common_app' },
  ],
  connect_to_theme: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'We raised money for various causes and I learned a lot about what it means to be a leader.', essayType: 'common_app' },
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'When I volunteered at the refugee center, it opened my eyes to the struggles that many families face', essayType: 'piq' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'their program emphasized hands-on learning, which resonated with me deeply.', essayType: 'supplemental' },
  ],
  fix_hook: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'When I first started running our school\'s environmental club, I had no idea what I was getting into.', essayType: 'common_app' },
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'Ever since I was young, I have been passionate about connecting with people from different backgrounds.', essayType: 'piq' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'When I visited campus for the first time, I was immediately struck by the atmosphere.', essayType: 'supplemental' },
  ],
  sharpen_ending: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'and I\'m grateful for every moment of it.', essayType: 'common_app' },
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'and I believe that everyone should push themselves out of their comfort zone to grow.', essayType: 'piq' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'this experience was truly a catalyst for change in my life and fostered my growth as a person.', essayType: 'common_app' },
  ],
  expand_moment: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'My advisor told me that I was doing a good job and that our efforts were making a difference.', essayType: 'common_app' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'I knew right then that this was where I belonged', essayType: 'supplemental' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'there were moments when I genuinely questioned whether I would be able to continue with my studies.', essayType: 'common_app' },
  ],
  compress: [
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'This journey of self-discovery was truly a transformative experience that left a profound impact on my worldview, and I believe that everyone should push themselves out of their comfort zone to grow.', essayType: 'piq' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'It was, in many ways, a roller coaster of emotions that I found myself navigating through during those difficult months. Against all odds, I managed to persevere through the health challenges that life threw my way.', essayType: 'common_app' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'My leadership helped transform the team culture and the results we achieved were a testament to our collective hard work and dedication to excellence.', essayType: 'activity' },
  ],
  add_dialogue: [
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'My advisor told me that I was doing a good job and that our efforts were making a difference.', essayType: 'common_app' },
    { passageLabel: 'P3 (Activity)', fullDocument: PASSAGE_3, selectedText: 'Several members told me that the program was better than ever before.', essayType: 'activity' },
    { passageLabel: 'P4 (Supplemental)', fullDocument: PASSAGE_4, selectedText: 'A professor in the engineering department told me that their program emphasized hands-on learning, which resonated with me deeply.', essayType: 'supplemental' },
  ],
  remove_cliche: [
    { passageLabel: 'P2 (PIQ)', fullDocument: PASSAGE_2, selectedText: 'The tapestry of experiences I gathered along the way shaped who I am today. This journey of self-discovery was truly a transformative experience', essayType: 'piq' },
    { passageLabel: 'P5 (Challenge)', fullDocument: PASSAGE_5, selectedText: 'Against all odds, I managed to persevere through the health challenges that life threw my way.', essayType: 'common_app' },
    { passageLabel: 'P1 (Common App)', fullDocument: PASSAGE_1, selectedText: 'the whole experience really shaped who I am. It taught me so much about responsibility', essayType: 'common_app' },
  ],
};

// ============================================================================
// QUALITY CHECK FUNCTIONS
// ============================================================================

function countSpecifics(text: string): number {
  return (text.match(/\d+|specific|exactly|\[.*?\]/gi) || []).length;
}

function countSensoryAction(text: string): number {
  return (text.match(/\b(saw|heard|felt|touched|tasted|smelled|grabbed|ran|whispered|shouted|cold|warm|rough|sharp|bright|dark|silence|echo|crunch|click|buzz)\b/gi) || []).length;
}

function countTellingWords(text: string): number {
  return (text.match(/\b(felt|learned|was|realized|understood|knew|experienced|became)\b/gi) || []).length;
}

function hasFirstPersonInsight(text: string): boolean {
  return /I realized|I discovered|I didn't expect|what I|before I|I assumed|I noticed|I began to|I understood|I recognized|I saw that/i.test(text);
}

function hasRiskLanguage(text: string): boolean {
  return /\b(if|without|could have|at risk|would|unless|threat|risk|fail|lose|jeopardize|danger|stakes)\b/i.test(text);
}

function countEvidence(text: string): number {
  return (text.match(/\d+|%|\[.*?\]|\$\d/g) || []).length;
}

function hasVulnerability(text: string): boolean {
  return /afraid|confused|ashamed|anxious|doubt|uncertain|stomach|chest|throat|breath|trembl|sweat|panic|froze|numb|sting|ache|sick|dizzy|hollow|tight/i.test(text);
}

function countQuotationMarks(text: string): number {
  return (text.match(/[""\u201C\u201D]/g) || []).length;
}

function countBannedTerms(text: string): number {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter(term => lower.includes(term.toLowerCase())).length;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text;
}

function lastSentence(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]/g);
  return sentences ? sentences[sentences.length - 1].trim() : text;
}

// ============================================================================
// PER-COMMAND QUALITY CHECK DISPATCH
// ============================================================================

interface QualityCheckResult {
  passed: boolean;
  detail: string;
}

function qualityCheck(command: EditingCommand, input: string, output: string, fullDoc: string): QualityCheckResult {
  switch (command) {
    case 'make_concrete': {
      const inCount = countSpecifics(input);
      const outCount = countSpecifics(output);
      const passed = outCount > inCount;
      return { passed, detail: `specifics ${inCount} -> ${outCount}` };
    }
    case 'show_dont_tell': {
      const inTelling = countTellingWords(input);
      const outSensory = countSensoryAction(output);
      const passed = outSensory > 0 || countTellingWords(output) < inTelling;
      return { passed, detail: `telling: ${inTelling} -> ${countTellingWords(output)}, sensory: ${outSensory}` };
    }
    case 'clarify_learning': {
      const passed = hasFirstPersonInsight(output);
      return { passed, detail: passed ? 'has first-person insight markers' : 'missing insight markers' };
    }
    case 'add_stakes': {
      const passed = hasRiskLanguage(output);
      return { passed, detail: passed ? 'has risk/stakes language' : 'missing risk language' };
    }
    case 'strengthen_voice': {
      const passed = output !== input && output.length > 0;
      return { passed, detail: passed ? 'text was transformed' : 'text unchanged' };
    }
    case 'cut_filler': {
      const inWc = wordCount(input);
      const outWc = wordCount(output);
      const ratio = outWc / inWc;
      const passed = ratio < 0.85;
      return { passed, detail: `words ${inWc} -> ${outWc} (${(ratio * 100).toFixed(0)}%)` };
    }
    case 'add_evidence': {
      const inCount = countEvidence(input);
      const outCount = countEvidence(output);
      const passed = outCount > inCount;
      return { passed, detail: `evidence ${inCount} -> ${outCount}` };
    }
    case 'deepen_vulnerability': {
      const passed = hasVulnerability(output);
      return { passed, detail: passed ? 'has vulnerability markers' : 'missing vulnerability markers' };
    }
    case 'connect_to_theme': {
      // Check that output shares keywords with the full document (theme connection)
      const docWords = new Set(fullDoc.toLowerCase().split(/\s+/).filter(w => w.length > 4));
      const outWords = output.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const shared = outWords.filter(w => docWords.has(w)).length;
      const passed = shared >= 2;
      return { passed, detail: `shared keywords with doc: ${shared}` };
    }
    case 'fix_hook': {
      const first = firstSentence(output);
      const wc = wordCount(first);
      const passed = wc <= 15;
      return { passed, detail: `first sentence: ${wc} words (max 15)` };
    }
    case 'sharpen_ending': {
      const last = lastSentence(output);
      const wc = wordCount(last);
      const passed = wc <= 15;
      return { passed, detail: `last sentence: ${wc} words (max 15)` };
    }
    case 'expand_moment': {
      const inWc = wordCount(input);
      const outWc = wordCount(output);
      const ratio = outWc / inWc;
      const hasSensory = countSensoryAction(output) > 0;
      const passed = ratio > 1.3 && hasSensory;
      return { passed, detail: `words ${inWc} -> ${outWc} (${(ratio * 100).toFixed(0)}%), sensory: ${hasSensory}` };
    }
    case 'compress': {
      const inWc = wordCount(input);
      const outWc = wordCount(output);
      const ratio = outWc / inWc;
      const passed = ratio < 0.80;
      return { passed, detail: `words ${inWc} -> ${outWc} (${(ratio * 100).toFixed(0)}%)` };
    }
    case 'add_dialogue': {
      const inQuotes = countQuotationMarks(input);
      const outQuotes = countQuotationMarks(output);
      const passed = outQuotes > inQuotes;
      return { passed, detail: `quotes ${inQuotes} -> ${outQuotes}` };
    }
    case 'remove_cliche': {
      const inBanned = countBannedTerms(input);
      const outBanned = countBannedTerms(output);
      const passed = outBanned < inBanned;
      return { passed, detail: `banned terms ${inBanned} -> ${outBanned}` };
    }
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

interface CommandResult {
  command: EditingCommand;
  passageResults: Array<{
    label: string;
    passed: boolean;
    detail: string;
    structuralOk: boolean;
    cost: number;
    latencyMs: number;
  }>;
  commandPassed: boolean;
  avgCost: number;
  avgLatencyMs: number;
}

async function testCommandOnPassage(
  svc: InlineEditorService,
  command: EditingCommand,
  testCase: TestCase,
): Promise<{ passed: boolean; detail: string; structuralOk: boolean; cost: number; latencyMs: number }> {
  const { fullDocument, selectedText, essayType } = testCase;
  const selectionStart = fullDocument.indexOf(selectedText);
  const selectionEnd = selectionStart + selectedText.length;

  const request: InlineEditRequest = {
    selectedText,
    fullDocument,
    selectionStart,
    selectionEnd,
    command,
    essayType,
  };

  const start = Date.now();
  try {
    const result: InlineEditResult = await svc.applyCommand(request);
    const latencyMs = Date.now() - start;

    // Structural validation
    const structuralOk =
      typeof result.primary?.text === 'string' && result.primary.text.length > 0 &&
      typeof result.primary?.explanation === 'string' &&
      typeof result.creative?.text === 'string' && result.creative.text.length > 0 &&
      typeof result.creative?.explanation === 'string' &&
      typeof result.teachingNote === 'string' && result.teachingNote.length > 10 &&
      typeof result.principle === 'string' && result.principle.length > 5;

    if (!structuralOk) {
      return { passed: false, detail: 'STRUCTURAL FAILURE — missing/empty fields', structuralOk: false, cost: result.cost || 0, latencyMs };
    }

    // Quality check using primary result
    const qc = qualityCheck(command, selectedText, result.primary.text, fullDocument);
    return { passed: qc.passed, detail: qc.detail, structuralOk: true, cost: result.cost || 0, latencyMs };
  } catch (error: unknown) {
    const latencyMs = Date.now() - start;
    const msg = error instanceof Error ? error.message : String(error);
    return { passed: false, detail: `ERROR: ${msg}`, structuralOk: false, cost: 0, latencyMs };
  }
}

async function main() {
  console.log('\n\u2550\u2550\u2550 INLINE EDITING E2E TEST RESULTS \u2550\u2550\u2550\n');

  const svc = new InlineEditorService();
  const commands = Object.keys(COMMAND_TESTS) as EditingCommand[];
  const allResults: CommandResult[] = [];
  let structuralFailures = 0;

  for (const command of commands) {
    const testCases = COMMAND_TESTS[command];
    const passageResults: CommandResult['passageResults'] = [];

    console.log(`Command: ${command}`);

    for (const tc of testCases) {
      const result = await testCommandOnPassage(svc, command, tc);
      passageResults.push({ label: tc.passageLabel, ...result });

      const icon = result.passed ? '\u2705' : '\u26A0\uFE0F';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`  ${tc.passageLabel}: ${icon} ${status} \u2014 ${result.detail}`);

      if (!result.structuralOk) structuralFailures++;

      // Delay between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    const passingCount = passageResults.filter(r => r.passed).length;
    const commandPassed = passingCount >= 2;
    const avgCost = passageResults.reduce((s, r) => s + r.cost, 0) / passageResults.length;
    const avgLatencyMs = passageResults.reduce((s, r) => s + r.latencyMs, 0) / passageResults.length;

    const cmdIcon = commandPassed ? '\u2705' : '\u274C';
    console.log(`  Result: ${cmdIcon} ${commandPassed ? 'PASS' : 'FAIL'} (${passingCount}/3)`);
    console.log(`  Avg cost: $${avgCost.toFixed(4)} | Avg latency: ${(avgLatencyMs / 1000).toFixed(1)}s\n`);

    allResults.push({ command, passageResults, commandPassed, avgCost, avgLatencyMs });
  }

  // ===== SUMMARY =====
  console.log('\u2550\u2550\u2550 SUMMARY \u2550\u2550\u2550\n');

  const commandsPassing = allResults.filter(r => r.commandPassed).length;
  const totalCost = allResults.reduce((s, r) => s + r.passageResults.reduce((ss, pr) => ss + pr.cost, 0), 0);
  const totalTests = allResults.reduce((s, r) => s + r.passageResults.length, 0);
  const allLatencies = allResults.flatMap(r => r.passageResults.map(pr => pr.latencyMs));
  const meanLatency = allLatencies.reduce((s, l) => s + l, 0) / allLatencies.length;

  console.log(`Commands passing: ${commandsPassing}/15 (${Math.round(commandsPassing / 15 * 100)}%)`);
  console.log(`Structural failures: ${structuralFailures}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Mean latency: ${(meanLatency / 1000).toFixed(1)}s`);
  console.log(`Total API calls: ${totalTests}`);

  const overallPass = commandsPassing >= 12 && structuralFailures === 0;
  console.log(`\nOVERALL: ${overallPass ? 'PASS \u2705' : 'FAIL \u274C'}`);

  if (!overallPass) {
    if (structuralFailures > 0) {
      console.log(`\n\u274C ${structuralFailures} structural failure(s) — API returned invalid/empty response`);
    }
    if (commandsPassing < 12) {
      const failing = allResults.filter(r => !r.commandPassed).map(r => r.command);
      console.log(`\n\u274C Failing commands: ${failing.join(', ')}`);
    }
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
