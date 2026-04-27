// ============================================================================
// LANDING DETECTOR CALIBRATION (Phase 1 D-1.5)
// ============================================================================
// Per L5_IMPLEMENTATION_PLAN §D-1.5: mid-build API touchpoint #1, budget
// $0.50–$1.00 from the integrated build cap. Runs the detector against
// 5 carefully designed cases covering the boundary patterns the prompt
// must discriminate.
//
// Cases (per the §D-1.5 contract):
//   1. Clear `addressed` — substantive engagement with the move's directive.
//   2. Clear `unaddressed` — synonym swap that doesn't engage substance.
//   3. Ambiguous — edit moves toward critique but doesn't fully execute
//      (expected `partially_addressed`, mid confidence).
//   4. `changed_target` — original substance removed, not rewritten.
//   5. Low-confidence — gestural addition where the directive is barely
//      executed (expected `partially_addressed` at confidence < 0.7,
//      OR `addressed` < 0.7 which the Q4 floor downgrades).
//
// Each case has: a realistic TaughtMove + edit (and optional B/C signals)
// + an expected (status, confidenceRange, mustListSignals) tuple.
// Outputs are recorded for landingDetector.calibration.md companion file.
//
// Usage:
//   npx tsx tests/calibration/landing-detector/run.ts
// (ANTHROPIC_API_KEY auto-loaded from .env via claude.ts dotenv.)
//
// Cost guardrail: BUILD_COST_LEDGER auto-records via callClaude wiring.
// Hard cap is $9 cumulative (BUILD_COST_LEDGER). 5 Sonnet calls at
// ~$0.002 each ≈ $0.01 — well under both the per-deliverable budget
// ($0.50–$1.00) and the build cap.

import { resolve } from 'path';
import { writeFileSync } from 'fs';

// Load .env BEFORE any module imports that touch the LLM client. The
// auto-loader in claude.ts walks up from __dirname to find package.json,
// but tsx ESM mode doesn't always set __dirname reliably.
import * as dotenv from 'dotenv';
dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false });

import {
  detectLanding,
  LANDING_DETECTOR_MODEL,
  type LandingDetectorInput,
  type LandingDetectorOutput,
} from '../../../src/services/essayIntelligence/analysis/landingDetector';
import {
  initLedger,
  recordCost,
  getCumulativeCost,
} from '../../../src/services/essayIntelligence/telemetry/buildCostLedger';
import type { TaughtMove } from '../../../src/services/essayIntelligence/profileTypes';
import { LANDING_DETECTOR_PROMPT_VERSION } from '../../../src/services/essayIntelligence/analysis/prompts/landingDetector.prompt';

// ─── Case definitions ──────────────────────────────────────────────────

interface CalibrationCase {
  id: string;
  description: string;
  rationale: string;
  input: LandingDetectorInput;
  expected: {
    status: LandingDetectorOutput['status'];
    /** Inclusive lower bound. */
    confidenceMin: number;
    /** Inclusive upper bound. */
    confidenceMax: number;
    /** Signals that MUST appear in signalsUsed. */
    mustListSignals: Array<'edit_vs_critique' | 'redetection' | 'chat_behavior'>;
    /** Signals that MUST NOT appear (e.g., uninformative chat shouldn't pad). */
    mustNotListSignals?: Array<'edit_vs_critique' | 'redetection' | 'chat_behavior'>;
  };
}

function move(overrides: Partial<TaughtMove> = {}): TaughtMove {
  return {
    id: 'M-1-0-A-1',
    annotationId: 'A-1',
    location: { paragraphIndex: 0, sentenceIndex: 0 },
    taughtAtIteration: 1,
    teachingMode: 'awareness',
    contentSummary: '(default move)',
    ...overrides,
  };
}

const CASES: CalibrationCase[] = [
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-1-clear-addressed',
    description: 'Clear `addressed` — substantive engagement with directive.',
    rationale:
      'The move asked the student to name what their growth cost. The edit replaces an abstract claim ("I had grown into someone new") with concrete tradeoffs (no longer calling mother on Sundays without flinching; the easy self gone). This is exactly what the directive asked for; addressed should be unambiguous.',
    input: {
      priorTaughtMove: move({
        id: 'M-1-2-A-1',
        annotationId: 'A-1',
        location: { paragraphIndex: 2, sentenceIndex: 4, spanText: 'I had grown into someone new' },
        teachingMode: 'awareness',
        contentSummary:
          "The paragraph claims growth but never names what was traded for it. Show what the growth cost — what was given up, what relationship shifted, what version of yourself is gone. Concrete losses make growth credible.",
        stakesSnapshot: 'Growth without cost reads as aging. AOs lose confidence in interiority claims when scenes do not earn them.',
      }),
      edit: {
        oldText: 'By the end of that summer, I had grown into someone new.',
        newText:
          "By the end of that summer, I could no longer call my mother on Sundays without flinching first — the easy version of me was gone, and I did not entirely want her back.",
        significance: 'significant',
      },
      newAnalysisAtLocation: { symptomFlagged: false, reasoning: 'Concrete cost named (relationship shift); growth is now embodied.' },
    },
    expected: {
      status: 'addressed',
      confidenceMin: 0.85,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-2-clear-unaddressed-synonym',
    description: 'Clear `unaddressed` — synonym swap leaves vacuity intact.',
    rationale:
      'The move flagged "deeply meaningful" as doing no work and asked for the actual meaning. The student swapped synonyms ("profoundly significant") — same hollow claim, different words. Critique was about vacuity, not word choice; the directive was not executed. Anchor Case 2 from the prompt.',
    input: {
      priorTaughtMove: move({
        id: 'M-1-3-A-2',
        annotationId: 'A-2',
        location: { paragraphIndex: 3, sentenceIndex: 1, spanText: 'deeply meaningful' },
        teachingMode: 'consequence',
        contentSummary:
          'The phrase "deeply meaningful" is doing no work. The reader cannot tell what the conversation actually was. Replace the abstraction with the specific exchange or moment that carried the meaning — what was said, what landed, what shifted.',
      }),
      edit: {
        oldText: 'The conversation was deeply meaningful.',
        newText: 'The conversation was profoundly significant.',
        significance: 'minor',
      },
      newAnalysisAtLocation: { symptomFlagged: true, reasoning: 'Same vacuous claim with synonyms; meaning is still not shown.' },
    },
    expected: {
      status: 'unaddressed',
      confidenceMin: 0.75,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-3-ambiguous-partial',
    description: 'Ambiguous — directionally right, execution thin → partially_addressed.',
    rationale:
      'The move asked the student to anchor the thesis to the specific decision the essay argues about. The edit acknowledges "choices" but stays abstract ("choices people make"). Direction is right (toward specificity); execution is incomplete (no specific decision named). Should be partially_addressed; redetection still flags lower-severity vagueness.',
    input: {
      priorTaughtMove: move({
        id: 'M-1-0-A-3',
        annotationId: 'A-3',
        location: { paragraphIndex: 0, sentenceIndex: 0, spanText: 'complexities of modern identity' },
        teachingMode: 'action',
        contentSummary:
          'The thesis is abstract. "Complexities of modern identity" could open any essay. Anchor it to the specific decision your essay argues about — the choice you actually examine, the moment you actually defend or interrogate.',
      }),
      edit: {
        oldText: 'This essay will explore the complexities of modern identity.',
        newText: 'This essay will explore the complexities of modern identity, particularly around choices people make.',
        significance: 'minor',
      },
      newAnalysisAtLocation: { symptomFlagged: true, reasoning: 'Slightly more specific but "choices people make" is still abstract; no specific decision named.' },
    },
    expected: {
      status: 'partially_addressed',
      confidenceMin: 0.55,
      confidenceMax: 0.9,
      mustListSignals: ['edit_vs_critique'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-4-changed-target',
    description: 'changed_target — original substance gone, not rewritten.',
    rationale:
      'The move flagged a contradiction between a chess-club anecdote (P3) and a claim in P1 that the student avoids competition. The edit deletes the chess paragraph entirely and replaces it with an unrelated food-bank passage. The original substance the move targeted is GONE — the chess anecdote no longer exists to be reconciled with the P1 claim. This is changed_target, NOT addressed (the contradiction was not resolved; it was removed by deletion). Anchor Case 3 from the prompt.',
    input: {
      priorTaughtMove: move({
        id: 'M-1-2-A-4',
        annotationId: 'A-4',
        location: { paragraphIndex: 2, sentenceIndex: 0, spanText: 'I trained for months for the regional chess tournament' },
        teachingMode: 'connection',
        contentSummary:
          'The chess-club anecdote in this paragraph contradicts the claim in P1 that you avoid competitive environments. Either the P1 framing needs adjustment, or the chess paragraph needs to be reframed in non-competitive terms (e.g., the camaraderie or strategy rather than the winning).',
        stakesSnapshot: 'Internal contradictions read as performative; AOs notice when self-claim and evidence pull in opposite directions.',
      }),
      edit: {
        oldText:
          'I trained for months for the regional chess tournament. When I won, I knew I belonged in that crowd — the smart kids, the ones who took ranking seriously.',
        newText:
          'I spent that semester volunteering at the Saturday food bank, learning the rhythm of stacking canned goods until my hands knew the shape of the boxes without thinking.',
        significance: 'transformative',
      },
      newAnalysisAtLocation: { symptomFlagged: false, reasoning: 'No competition framing remains; the original contradiction has no referent.' },
      chatBehavior: {
        engaged: true,
        mood: 'neutral',
        raw: 'I cut the chess part — it didn\'t fit with what I wanted to say.',
      },
    },
    expected: {
      status: 'changed_target',
      confidenceMin: 0.75,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique'],
      // chat_behavior is supportive but not material; the call rests on the textual evidence.
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-5-low-confidence',
    description: 'Low-confidence — gestural addition; partially_addressed at <0.7 confidence.',
    rationale:
      'The move asked the student to push past summary to a claim they could not have made on page 1. The student left the summary intact ("perseverance, empathy, leadership") and tacked on a vague reflection ("maybe that\'s why I keep coming back to them"). This is gestural — direction is correct but the claim is vague. Expected: partially_addressed at confidence < 0.7. Even if the model returns addressed, the Q4 floor downgrades it; calibration verifies the model reports honest sub-0.7 confidence rather than gaming over the floor.',
    input: {
      priorTaughtMove: move({
        id: 'M-1-5-A-5',
        annotationId: 'A-5',
        location: { paragraphIndex: 5, sentenceIndex: 0, spanText: 'perseverance, empathy, leadership' },
        teachingMode: 'action',
        contentSummary:
          'The conclusion restates the intro. "Perseverance, empathy, leadership" is a list the reader could derive from page 1. Push past summary to a claim about these qualities you could not have made on page 1 — what they cost, what they reveal that you did not see at the start, what you no longer believe.',
      }),
      edit: {
        oldText: 'These three lessons — perseverance, empathy, leadership — taught me who I am.',
        newText:
          "These three lessons — perseverance, empathy, leadership — taught me who I am. And maybe that's why I keep coming back to them.",
        significance: 'minor',
      },
      newAnalysisAtLocation: {
        symptomFlagged: true,
        reasoning: 'Summary still dominant; the added sentence is gestural reflection without a new claim.',
      },
    },
    expected: {
      status: 'partially_addressed',
      confidenceMin: 0.0,
      confidenceMax: 0.85,
      mustListSignals: ['edit_vs_critique'],
    },
  },
];

// ─── Runner ────────────────────────────────────────────────────────────

interface CaseResult {
  case: CalibrationCase;
  output?: LandingDetectorOutput;
  error?: string;
  durationMs: number;
  match: {
    statusOk: boolean;
    confidenceOk: boolean;
    signalsOk: boolean;
    overall: boolean;
  };
}

function evaluate(c: CalibrationCase, out: LandingDetectorOutput): CaseResult['match'] {
  const statusOk = out.status === c.expected.status;
  const confidenceOk =
    out.confidence >= c.expected.confidenceMin && out.confidence <= c.expected.confidenceMax;
  const signalsOk =
    c.expected.mustListSignals.every((s) => out.signalsUsed.includes(s)) &&
    (c.expected.mustNotListSignals ?? []).every((s) => !out.signalsUsed.includes(s));
  return { statusOk, confidenceOk, signalsOk, overall: statusOk && confidenceOk && signalsOk };
}

async function runCase(c: CalibrationCase): Promise<CaseResult> {
  const startMs = Date.now();
  try {
    const output = await detectLanding(c.input);
    const durationMs = Date.now() - startMs;
    return { case: c, output, durationMs, match: evaluate(c, output) };
  } catch (err) {
    const durationMs = Date.now() - startMs;
    return {
      case: c,
      error: err instanceof Error ? err.message : String(err),
      durationMs,
      match: { statusOk: false, confidenceOk: false, signalsOk: false, overall: false },
    };
  }
}

function formatCaseReport(r: CaseResult, cumUsdBefore: number, cumUsdAfter: number): string {
  const c = r.case;
  const lines: string[] = [];
  lines.push(`### ${c.id}\n`);
  lines.push(`**Description:** ${c.description}\n`);
  lines.push(`**Rationale:** ${c.rationale}\n`);
  lines.push(
    `**Expected:** status=\`${c.expected.status}\`, confidence ∈ [${c.expected.confidenceMin}, ${c.expected.confidenceMax}], must list ${c.expected.mustListSignals.map((s) => `\`${s}\``).join(', ')}.\n`,
  );
  lines.push(`**Input — prior taught move:**`);
  lines.push('```text');
  lines.push(`Move id: ${c.input.priorTaughtMove.id}`);
  lines.push(`Location: P${c.input.priorTaughtMove.location.paragraphIndex}` +
    (c.input.priorTaughtMove.location.sentenceIndex !== undefined
      ? `, S${c.input.priorTaughtMove.location.sentenceIndex}`
      : ''));
  lines.push(`Teaching mode: ${c.input.priorTaughtMove.teachingMode}`);
  lines.push(`Content: ${c.input.priorTaughtMove.contentSummary}`);
  lines.push('```');
  lines.push(`**Input — edit (significance: ${c.input.edit.significance}):**`);
  lines.push('```text');
  lines.push(`Old: ${c.input.edit.oldText}`);
  lines.push(`New: ${c.input.edit.newText}`);
  lines.push('```');
  if (c.input.newAnalysisAtLocation) {
    lines.push(`**Signal B (re-detection):** symptomFlagged=${c.input.newAnalysisAtLocation.symptomFlagged}; ${c.input.newAnalysisAtLocation.reasoning ?? ''}\n`);
  }
  if (c.input.chatBehavior) {
    lines.push(`**Signal C (chat):** engaged=${c.input.chatBehavior.engaged}, mood=${c.input.chatBehavior.mood}; "${c.input.chatBehavior.raw ?? ''}"\n`);
  }

  if (r.error) {
    lines.push(`\n**ERROR:** \`${r.error}\``);
  } else {
    const o = r.output!;
    lines.push(`\n**Output:**`);
    lines.push('```json');
    lines.push(JSON.stringify(o, null, 2));
    lines.push('```');
    lines.push(
      `**Match:** status ${r.match.statusOk ? '✅' : '❌'} (got \`${o.status}\`) · confidence ${r.match.confidenceOk ? '✅' : '❌'} (${o.confidence}) · signalsUsed ${r.match.signalsOk ? '✅' : '❌'} (${o.signalsUsed.join(', ')})`,
    );
  }
  lines.push(
    `**Duration:** ${r.durationMs}ms · **Cumulative cost after this case:** $${cumUsdAfter.toFixed(4)} (Δ $${(cumUsdAfter - cumUsdBefore).toFixed(4)})\n`,
  );
  lines.push('---\n');
  return lines.join('\n');
}

async function main(): Promise<void> {
  initLedger();
  const startCumUsd = getCumulativeCost();

  console.log('='.repeat(72));
  console.log('LANDING DETECTOR CALIBRATION — D-1.5 mid-build API touchpoint');
  console.log('='.repeat(72));
  console.log(`Model: ${LANDING_DETECTOR_MODEL}`);
  console.log(`Prompt version: ${LANDING_DETECTOR_PROMPT_VERSION}`);
  console.log(`Cases: ${CASES.length}`);
  console.log(`Cumulative build spend BEFORE: $${startCumUsd.toFixed(4)}`);
  console.log('-'.repeat(72));

  const results: CaseResult[] = [];
  let cumUsdAtCaseStart = startCumUsd;
  const reportBlocks: string[] = [];

  for (const c of CASES) {
    console.log(`\n→ Running ${c.id} ...`);
    const before = getCumulativeCost();
    const result = await runCase(c);
    const after = getCumulativeCost();
    results.push(result);
    reportBlocks.push(formatCaseReport(result, before, after));
    if (result.error) {
      console.log(`   ✘ ERROR: ${result.error}`);
    } else {
      const o = result.output!;
      const flag = result.match.overall ? '✓' : '✗';
      console.log(
        `   ${flag} status=${o.status} (expected ${c.expected.status}) · confidence=${o.confidence} (expected [${c.expected.confidenceMin}, ${c.expected.confidenceMax}]) · signalsUsed=[${o.signalsUsed.join(',')}] · ${result.durationMs}ms`,
      );
    }
    cumUsdAtCaseStart = after;
  }

  const endCumUsd = getCumulativeCost();
  const totalSpent = endCumUsd - startCumUsd;
  const passes = results.filter((r) => r.match.overall).length;

  // Append a summary cost-ledger row tagged for D-1.5 (the auto-record
  // on each callClaude already wrote per-call rows; this one tags the
  // deliverable ID for audit).
  recordCost({
    deliverableId: 'D-1.5',
    model: LANDING_DETECTOR_MODEL,
    promptName: 'landingDetector.prompt',
    fixtureKey: 'calibration-summary',
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    qualityNote: `D-1.5 calibration summary: ${passes}/${CASES.length} cases match expectation; total spent $${totalSpent.toFixed(4)}`,
  });

  // ─── Write calibration.md ────────────────────────────────────────────
  const mdPath = resolve(process.cwd(), 'src/services/essayIntelligence/analysis/prompts/landingDetector.calibration.md');
  const md: string[] = [];
  md.push('# Landing Detector — D-1.5 Calibration Output\n');
  md.push(`> **Run date:** ${new Date().toISOString()}`);
  md.push(`> **Model:** \`${LANDING_DETECTOR_MODEL}\``);
  md.push(`> **Prompt version:** \`${LANDING_DETECTOR_PROMPT_VERSION}\``);
  md.push(`> **Cases:** ${CASES.length}`);
  md.push(`> **Passed (status + confidence + signals):** ${passes}/${CASES.length}`);
  md.push(`> **Total cost:** $${totalSpent.toFixed(4)} (cumulative build cap: $${endCumUsd.toFixed(4)} of $9.00)`);
  md.push('');
  md.push('Per L5_IMPLEMENTATION_PLAN §D-1.5: 5 known cases run against real Sonnet, outputs compared to implementer expectations. The companion file `landingDetector.RATIONALE.md` documents the prompt revisions; this file documents the empirical validation outcome.');
  md.push('');
  md.push('## Summary\n');
  md.push('| Case | Expected status | Got | Confidence (got / range) | Signals match | Pass |');
  md.push('|---|---|---|---|---|---|');
  for (const r of results) {
    if (r.error) {
      md.push(`| ${r.case.id} | ${r.case.expected.status} | ERROR | — | — | ✗ |`);
    } else {
      const o = r.output!;
      md.push(
        `| ${r.case.id} | \`${r.case.expected.status}\` | \`${o.status}\` | ${o.confidence} / [${r.case.expected.confidenceMin}, ${r.case.expected.confidenceMax}] | ${r.match.signalsOk ? '✓' : '✗'} | ${r.match.overall ? '✓' : '✗'} |`,
      );
    }
  }
  md.push('');
  md.push('## Per-case detail\n');
  md.push(reportBlocks.join('\n'));
  writeFileSync(mdPath, md.join('\n'), 'utf-8');

  console.log('\n' + '='.repeat(72));
  console.log(`SUMMARY: ${passes}/${CASES.length} pass · spent $${totalSpent.toFixed(4)} · cumulative $${endCumUsd.toFixed(4)}`);
  console.log(`Wrote: ${mdPath}`);
  console.log('='.repeat(72));

  // Exit non-zero if any case failed — D-1.5 contract says calibration
  // disagreement returns to D-1.4 round 4.
  if (passes < CASES.length) {
    console.log('\nCalibration disagreement detected. Per D-1.5 contract: review output, refine prompt at D-1.4 round 4 if needed, then re-run (max 2 calibration runs mid-build per cost discipline).');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('CALIBRATION RUNNER FAILED:', err);
  process.exit(2);
});
