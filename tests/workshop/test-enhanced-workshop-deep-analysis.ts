/**
 * Enhanced Workshop — Deep Analysis of Orchestrator Output
 *
 * Runs the full enhancement loop and then does a thorough qualitative
 * analysis of what happened: the exact edits, why they were chosen,
 * how the guard evaluated them, and the final text quality.
 *
 * Run:
 *   npx tsx tests/test-enhanced-workshop-deep-analysis.ts
 */

import '../utils/loadEnv';
import { requireApiKey } from '../utils/loadEnv';
const _apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { preAnalyze } from '../../src/services/enhancedWorkshop/preAnalyzer';
import { writingEnhancementOrchestrator } from '../../src/services/enhancedWorkshop/writingEnhancementOrchestrator';
import type { EnhanceResult, EnhancementStepResult, EssaySnapshot } from '../../src/services/enhancedWorkshop/types';

// ============================================================================
// TEST ESSAY
// ============================================================================

const TEST_ESSAY = `The summer before junior year, I decided to start a community garden in my neighborhood. I had always been interested in gardening and thought it would be a good way to bring people together. It was harder than I expected.

First, I had to find a vacant lot that the city would let us use. I spent weeks calling different offices and going to meetings. Eventually, the parks department gave us permission to use a small lot on Oak Street. It was covered in trash and weeds, but I was excited.

Getting volunteers was also challenging. I put up flyers and posted on social media, but only a few people showed up at first. I felt discouraged but kept going. My mom told me to be patient, and she was right. Over the next few weeks, more neighbors started coming. Some brought their kids, and others brought tools and seeds from their own gardens.

The garden taught me a lot about leadership and community. I learned that you can't force people to participate — you have to create something they want to be part of. I also learned about patience, because plants don't grow overnight and neither do communities. By the end of the summer, we had tomatoes, peppers, and sunflowers growing in what used to be an empty lot.

This experience made me who I am today. It showed me that one person can make a difference if they're willing to put in the work. I want to continue creating spaces where people can come together and grow, both literally and figuratively, in college and beyond.`;

// ============================================================================
// LOGGING
// ============================================================================

function log(msg: string) { console.log(msg); }

function divider(title: string) {
  console.log(`\n${'═'.repeat(74)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(74)}\n`);
}

function section(title: string) {
  console.log(`\n${'─'.repeat(74)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(74)}\n`);
}

function indent(text: string, prefix = '  '): string {
  return text.split('\n').map(line => prefix + line).join('\n');
}

// ============================================================================
// DIFF DISPLAY
// ============================================================================

/**
 * Show a simple before/after diff of the specific passage that was edited.
 */
function showPassageDiff(beforeText: string, afterText: string, targetPassage: string): void {
  const idx = beforeText.indexOf(targetPassage);
  if (idx === -1) {
    log('  (target passage not found in before text — may have been edited by a prior step)');
    return;
  }

  // Show surrounding context (50 chars before and after)
  const contextBefore = Math.max(0, idx - 50);
  const contextAfter = Math.min(beforeText.length, idx + targetPassage.length + 50);

  const beforeSlice = beforeText.slice(contextBefore, contextAfter);
  const prefix = beforeText.slice(contextBefore, idx);
  const suffix = beforeText.slice(idx + targetPassage.length, contextAfter);

  // Find the replacement in the after text
  const afterIdx = afterText.indexOf(prefix);
  if (afterIdx !== -1) {
    const suffixIdx = afterText.indexOf(suffix, afterIdx + prefix.length);
    if (suffixIdx !== -1) {
      const replacement = afterText.slice(afterIdx + prefix.length, suffixIdx);
      log('  BEFORE (original passage):');
      log(indent(`"${targetPassage}"`, '    '));
      log('');
      log('  AFTER (edited passage):');
      log(indent(`"${replacement}"`, '    '));
      return;
    }
  }

  // Fallback: just show the targeted passage
  log('  TARGET PASSAGE:');
  log(indent(`"${targetPassage}"`, '    '));
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeSnapshot(label: string, snapshot: EssaySnapshot): void {
  section(`${label} Snapshot`);

  log(`  EQI: ${snapshot.eqi.toFixed(1)}/100 — ${snapshot.impressionLabel}`);
  log(`  Word Count: ${snapshot.wordCount}`);
  log(`  Weakest: ${snapshot.weakestDimensions.join(', ')}`);
  if (snapshot.flags.length > 0) {
    log(`  Flags: ${snapshot.flags.join(', ')}`);
  }

  log('');
  log('  Dimension Breakdown:');
  const sorted = Object.entries(snapshot.dimensionScores)
    .sort(([, a], [, b]) => b - a);

  for (const [dim, score] of sorted) {
    const bar = '█'.repeat(Math.round(score));
    const empty = '░'.repeat(10 - Math.round(score));
    const label = score <= 2 ? 'CRITICAL' : score <= 4 ? 'Weak' : score <= 6 ? 'Average' : score <= 8 ? 'Good' : 'Strong';
    log(`    ${dim.padEnd(42)} ${score.toFixed(1).padStart(5)} ${bar}${empty} ${label}`);
  }
}

function analyzeStep(
  stepNum: number,
  step: EnhancementStepResult,
  beforeText: string,
  afterText: string,
  isRejected = false
): void {
  const status = isRejected ? 'REJECTED' : 'ACCEPTED';
  section(`Step ${stepNum}: ${step.action.command} → ${step.action.dimension} [${status}]`);

  // Action details
  log(`  Dimension: ${step.action.dimension}`);
  log(`  Command:   ${step.action.command}`);
  log(`  Rank:      #${step.action.rank}`);
  log(`  Expected:  +${step.action.expectedGain.toFixed(1)} EQI | Difficulty: ${step.action.difficulty}`);
  log(`  Cost:      $${step.cost.toFixed(4)}`);
  log('');

  // Rationale
  log('  WHY this edit was chosen:');
  log(indent(step.action.rationale, '    '));
  log('');

  // Passage diff
  log('  WHAT changed:');
  showPassageDiff(beforeText, step.editedText, step.action.targetPassage);
  log('');

  // Guard verdict
  const j = step.regressionCheck.llmJudgment;
  log('  GUARD VERDICT:');
  log(`    LLM Verdict:     ${j.verdict} (confidence: ${j.confidence.toFixed(2)})`);
  log(`    Voice OK:        ${j.voiceConsistent ? 'Yes' : 'NO — voice changed'}`);
  log(`    Specificity:     ${j.specificityChange}`);
  log(`    Authenticity:    ${j.authenticityChange}`);
  log(`    Explanation:     ${j.explanation}`);

  if (step.regressionCheck.rejectionReason) {
    log('');
    log(`    REJECTION REASON: ${step.regressionCheck.rejectionReason}`);
  }

  // Heuristic signals
  const rc = step.regressionCheck;
  if (rc.improvements.length > 0 || rc.regressions.length > 0) {
    log('');
    log('  HEURISTIC SIGNALS:');
    log(`    EQI delta: ${rc.eqiDelta > 0 ? '+' : ''}${rc.eqiDelta.toFixed(1)}`);
    for (const imp of rc.improvements) {
      log(`    [UP]   ${imp.dimension}: ${imp.before.toFixed(1)} → ${imp.after.toFixed(1)} (${imp.delta > 0 ? '+' : ''}${imp.delta.toFixed(1)})`);
    }
    for (const reg of rc.regressions) {
      log(`    [DOWN] ${reg.dimension}: ${reg.before.toFixed(1)} → ${reg.after.toFixed(1)} (${reg.delta.toFixed(1)})`);
    }
  }

  // Teaching note
  if (step.teachingNote && step.teachingNote.length > 0) {
    log('');
    log('  TEACHING NOTE (shown to student):');
    log(indent(step.teachingNote, '    '));
  }
}

function analyzeFullTextComparison(original: string, improved: string): void {
  section('Full Text Comparison');

  const origWords = original.split(/\s+/).length;
  const impWords = improved.split(/\s+/).length;
  const origSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const impSentences = improved.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const origParas = original.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  const impParas = improved.split(/\n\n+/).filter(p => p.trim().length > 0).length;

  log('  Structural Stats:');
  log(`    Words:      ${origWords} → ${impWords} (${impWords > origWords ? '+' : ''}${impWords - origWords})`);
  log(`    Sentences:  ${origSentences} → ${impSentences} (${impSentences > origSentences ? '+' : ''}${impSentences - origSentences})`);
  log(`    Paragraphs: ${origParas} → ${impParas} (${impParas > origParas ? '+' : ''}${impParas - origParas})`);

  // Show the full final text
  log('');
  log('  ┌──────────────────────────────────────────────────────────────────────┐');
  log('  │ ORIGINAL TEXT                                                        │');
  log('  └──────────────────────────────────────────────────────────────────────┘');
  log('');
  log(indent(original, '    '));

  log('');
  log('  ┌──────────────────────────────────────────────────────────────────────┐');
  log('  │ IMPROVED TEXT                                                        │');
  log('  └──────────────────────────────────────────────────────────────────────┘');
  log('');
  log(indent(improved, '    '));
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  divider('ENHANCED WORKSHOP — DEEP ORCHESTRATOR ANALYSIS');

  log('Running the full enhancement loop with maxSteps=3...');
  log(`Essay: ${TEST_ESSAY.split(/\s+/).length} words, ${TEST_ESSAY.split(/\n\n+/).length} paragraphs`);
  log('');

  const overallStart = Date.now();

  // Run the orchestrator
  const result: EnhanceResult = await writingEnhancementOrchestrator.enhance({
    text: TEST_ESSAY,
    essayType: 'common_app',
    maxSteps: 3,
  });

  const totalDuration = Date.now() - overallStart;

  // ═══════════════════════════════════════════════════════════════════════
  // OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════

  divider('OVERVIEW');

  log(`  Duration:        ${(totalDuration / 1000).toFixed(1)}s`);
  log(`  Total LLM Cost:  $${result.totalCost.toFixed(4)}`);
  log(`  Steps Attempted: ${result.steps.length + result.rejectedSteps.length}`);
  log(`  Steps Accepted:  ${result.steps.length}`);
  log(`  Steps Rejected:  ${result.rejectedSteps.length}`);
  log(`  EQI Gain:        ${result.eqiGain > 0 ? '+' : ''}${result.eqiGain.toFixed(1)} (${result.before.eqi.toFixed(1)} → ${result.after.eqi.toFixed(1)})`);

  // ═══════════════════════════════════════════════════════════════════════
  // BEFORE/AFTER SNAPSHOTS
  // ═══════════════════════════════════════════════════════════════════════

  analyzeSnapshot('BEFORE', result.before);
  analyzeSnapshot('AFTER', result.after);

  // Dimension comparison
  section('Dimension Delta Summary');
  const allDims = [...new Set([
    ...Object.keys(result.before.dimensionScores),
    ...Object.keys(result.after.dimensionScores),
  ])].sort();

  let totalGain = 0;
  let dimsImproved = 0;
  let dimsRegressed = 0;
  let dimsUnchanged = 0;

  for (const dim of allDims) {
    const before = result.before.dimensionScores[dim] ?? 0;
    const after = result.after.dimensionScores[dim] ?? 0;
    const delta = after - before;
    totalGain += delta;
    if (delta > 0.1) dimsImproved++;
    else if (delta < -0.1) dimsRegressed++;
    else dimsUnchanged++;

    const sign = delta > 0 ? '+' : '';
    const arrow = delta > 0.3 ? ' >>>' : delta < -0.3 ? ' <<<' : '';
    log(`    ${dim.padEnd(42)} ${before.toFixed(1)} → ${after.toFixed(1)} (${sign}${delta.toFixed(1)})${arrow}`);
  }

  log('');
  log(`  Summary: ${dimsImproved} improved, ${dimsRegressed} regressed, ${dimsUnchanged} unchanged`);
  log(`  Net dimension gain: ${totalGain > 0 ? '+' : ''}${totalGain.toFixed(1)} across ${allDims.length} dimensions`);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP-BY-STEP ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  divider('STEP-BY-STEP ANALYSIS');

  // Track running text so we can show accurate diffs
  let runningText = result.originalText;
  let stepCounter = 0;

  // Interleave accepted and rejected steps in execution order
  // We'll show all accepted steps first, then rejected
  for (const step of result.steps) {
    stepCounter++;
    analyzeStep(stepCounter, step, runningText, step.editedText, false);
    runningText = step.editedText; // Update running text after accepted step
  }

  for (const step of result.rejectedSteps) {
    stepCounter++;
    analyzeStep(stepCounter, step, runningText, step.editedText, true);
    // Don't update runningText — rejected steps don't change the text
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FULL TEXT COMPARISON
  // ═══════════════════════════════════════════════════════════════════════

  divider('FULL TEXT COMPARISON');

  analyzeFullTextComparison(result.originalText, result.improvedText);

  // ═══════════════════════════════════════════════════════════════════════
  // RE-ANALYZE IMPROVED TEXT (independent verification)
  // ═══════════════════════════════════════════════════════════════════════

  divider('INDEPENDENT VERIFICATION — Re-analyze improved text');

  const verifySnapshot = await preAnalyze(result.improvedText, 'common_app');

  log(`  Re-analyzed EQI:  ${verifySnapshot.eqi.toFixed(1)}/100`);
  log(`  Reported EQI:     ${result.after.eqi.toFixed(1)}/100`);
  log(`  Match:            ${Math.abs(verifySnapshot.eqi - result.after.eqi) < 0.1 ? 'YES' : 'NO — MISMATCH'}`);
  log(`  Impression:       ${verifySnapshot.impressionLabel}`);
  log(`  Weakest:          ${verifySnapshot.weakestDimensions.join(', ')}`);

  // ═══════════════════════════════════════════════════════════════════════
  // QUALITY ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════

  divider('QUALITY ASSESSMENT');

  // Check for common failure modes
  const checks: Array<{ label: string; pass: boolean; detail: string }> = [];

  // 1. Did the text actually change?
  const textChanged = result.originalText !== result.improvedText;
  checks.push({ label: 'Text changed', pass: textChanged, detail: textChanged ? 'Edits were applied' : 'No changes made' });

  // 2. Is EQI higher or at least not lower?
  checks.push({
    label: 'EQI non-negative',
    pass: result.eqiGain >= 0,
    detail: `${result.eqiGain > 0 ? '+' : ''}${result.eqiGain.toFixed(1)} EQI`
  });

  // 3. No dimension regressed significantly
  const significantRegressions = allDims.filter(dim => {
    const before = result.before.dimensionScores[dim] ?? 0;
    const after = result.after.dimensionScores[dim] ?? 0;
    return (after - before) < -1.0;
  });
  checks.push({
    label: 'No major regressions',
    pass: significantRegressions.length === 0,
    detail: significantRegressions.length === 0
      ? 'No dimension dropped >1.0'
      : `Regressions: ${significantRegressions.join(', ')}`
  });

  // 4. All accepted steps had real LLM judgments
  const allHaveLLM = result.steps.every(s => s.regressionCheck.llmJudgment?.verdict);
  checks.push({
    label: 'All steps LLM-judged',
    pass: allHaveLLM,
    detail: allHaveLLM ? 'No heuristic-only fallbacks' : 'Some steps missing LLM judgment'
  });

  // 5. Voice was preserved in accepted steps
  const voicePreserved = result.steps.every(s => s.regressionCheck.llmJudgment?.voiceConsistent !== false);
  checks.push({
    label: 'Voice preserved',
    pass: voicePreserved,
    detail: voicePreserved ? 'All accepted edits maintained voice' : 'Some accepted edits changed voice'
  });

  // 6. Teaching notes present
  const hasTeaching = result.steps.some(s => s.teachingNote && s.teachingNote.length > 20);
  checks.push({
    label: 'Teaching notes',
    pass: hasTeaching,
    detail: hasTeaching ? 'Students get explanations' : 'No teaching notes generated'
  });

  // 7. Cost within expected range
  const costReasonable = result.totalCost < 0.15;
  checks.push({
    label: 'Cost reasonable',
    pass: costReasonable,
    detail: `$${result.totalCost.toFixed(4)} (limit: $0.15)`
  });

  // 8. Word count didn't explode or collapse
  const origWordCount = result.originalText.split(/\s+/).length;
  const newWordCount = result.improvedText.split(/\s+/).length;
  const wordRatio = newWordCount / origWordCount;
  checks.push({
    label: 'Word count stable',
    pass: wordRatio > 0.7 && wordRatio < 1.5,
    detail: `${origWordCount} → ${newWordCount} (ratio: ${wordRatio.toFixed(2)})`
  });

  // 9. No cliche injection
  const cliches = [
    'transformative journey', 'passionate about', 'made me who I am',
    'in today\'s society', 'since the dawn of time', 'last but not least',
    'at the end of the day', 'needless to say', 'it goes without saying',
  ];
  const clicheFound = cliches.filter(c => result.improvedText.toLowerCase().includes(c));
  const noCliches = clicheFound.length === 0;
  checks.push({
    label: 'No cliche injection',
    pass: noCliches,
    detail: noCliches ? 'Clean' : `Found: ${clicheFound.join(', ')}`
  });

  // 10. Original essay's best content preserved
  const keyPhrases = [
    'Oak Street',
    'tomatoes, peppers, and sunflowers',
    'plants don\'t grow overnight',
  ];
  const preserved = keyPhrases.filter(p => result.improvedText.includes(p));
  const allPreserved = preserved.length === keyPhrases.length;
  checks.push({
    label: 'Key content preserved',
    pass: allPreserved,
    detail: allPreserved
      ? `All ${keyPhrases.length} key phrases retained`
      : `${preserved.length}/${keyPhrases.length} retained. Missing: ${keyPhrases.filter(p => !result.improvedText.includes(p)).join(', ')}`
  });

  log('  Quality Checklist:');
  log('');
  let passCount = 0;
  for (const check of checks) {
    const icon = check.pass ? '[PASS]' : '[FAIL]';
    log(`    ${icon} ${check.label.padEnd(25)} ${check.detail}`);
    if (check.pass) passCount++;
  }

  log('');
  log(`  Score: ${passCount}/${checks.length} quality checks passed`);

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════

  divider('FINAL SUMMARY');

  log(`  Input:          ${origWordCount}-word mid-quality Common App essay (EQI ${result.before.eqi.toFixed(1)})`);
  log(`  Output:         ${newWordCount}-word enhanced essay (EQI ${result.after.eqi.toFixed(1)})`);
  log(`  EQI Change:     ${result.eqiGain > 0 ? '+' : ''}${result.eqiGain.toFixed(1)} points`);
  log(`  Steps:          ${result.steps.length} accepted, ${result.rejectedSteps.length} rejected`);
  log(`  Duration:       ${(totalDuration / 1000).toFixed(1)}s`);
  log(`  LLM Cost:       $${result.totalCost.toFixed(4)}`);
  log(`  Quality Score:  ${passCount}/${checks.length}`);
  log(`  Impression:     ${result.before.impressionLabel} → ${result.after.impressionLabel}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
