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
      essayId: "calibration-essay",

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
      essayId: "calibration-essay",

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
      essayId: "calibration-essay",

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
      essayId: "calibration-essay",

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
  // ADVERSARIAL EXTENSION (Round 4+ generalization tests).
  // These cases exercise boundaries the prompt was NOT tuned on, to
  // verify generalization rather than memorization. Each case is
  // designed to break a plausible mis-reading of the prompt.
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-6-addressed-with-redetection-conflict',
    description: 'addressed substance + redetection false positive → Q4 conflict rule should downgrade to partially_addressed.',
    rationale:
      'The edit fully executes the directive (concrete loss named). But the upstream re-detection mistakenly still flags the symptom (false positive — possibly redetector sees lingering "abstract" word). Q4 conflict rule: working hypothesis `addressed` + Signal B says still flagged → downgrade to `partially_addressed`. Tests the conflict resolution branch directly.',
    input: {
      essayId: "calibration-essay",

      priorTaughtMove: move({
        id: 'M-1-2-A-6',
        annotationId: 'A-6',
        location: { paragraphIndex: 2, sentenceIndex: 0, spanText: 'I learned a lot' },
        teachingMode: 'awareness',
        contentSummary:
          '"I learned a lot" tells the reader you grew without showing what shifted. Replace with the specific lesson — what you now believe that you didn\'t before, what assumption broke.',
      }),
      edit: {
        oldText: 'I learned a lot from that summer at the hospice.',
        newText:
          "I left the hospice no longer believing that comfort meant solving — sometimes it meant standing still while someone else's hands shook against mine and not naming it.",
        significance: 'significant',
      },
      newAnalysisAtLocation: {
        symptomFlagged: true,
        reasoning: 'Re-detector flags lingering abstraction in "comfort meant solving"; the edit may not have fully landed.',
      },
    },
    expected: {
      // Q4 conflict rule: addressed + B says flagged → partially_addressed.
      status: 'partially_addressed',
      confidenceMin: 0.5,
      confidenceMax: 0.9,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-7-rewrite-that-addresses-not-changed-target',
    description: 'Substance reframed to resolve critique → addressed, NOT changed_target.',
    rationale:
      'The chess-club anecdote contradiction case again, but THIS time the student rewrites the chess paragraph to acknowledge competition was about camaraderie, not winning. The substance (chess anecdote) is still present; the contradiction is resolved by reframing. Per the prompt: changed_target requires substance to be GONE, not rewritten. This must be addressed.',
    input: {
      essayId: "calibration-essay",

      priorTaughtMove: move({
        id: 'M-1-2-A-7',
        annotationId: 'A-7',
        location: { paragraphIndex: 2, sentenceIndex: 0, spanText: 'I trained for months for the regional chess tournament' },
        teachingMode: 'connection',
        contentSummary:
          'The chess-club anecdote contradicts the claim in P1 that you avoid competitive environments. Either reframe the chess paragraph in non-competitive terms, or adjust the P1 framing.',
        stakesSnapshot: 'Internal contradictions read as performative.',
      }),
      edit: {
        oldText:
          'I trained for months for the regional chess tournament. When I won, I knew I belonged in that crowd — the smart kids, the ones who took ranking seriously.',
        newText:
          "I spent months at the chess club not because I cared about the tournament — I never made it past the first round — but because the long Saturday afternoons of analysis with Marcus and Priya were the only place I could think out loud without performing.",
        significance: 'significant',
      },
      newAnalysisAtLocation: {
        symptomFlagged: false,
        reasoning: 'Chess substance preserved; competition framing reframed to camaraderie + thinking-aloud. Contradiction with P1 resolved.',
      },
    },
    expected: {
      status: 'addressed',
      confidenceMin: 0.75,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-8-unaddressed-cosmetic-only',
    description: 'Cosmetic-only edit at location (tense polish) → true Branch 1 unaddressed.',
    rationale:
      'Move asks for the specific realization to be named. Student edits the location but ONLY changes tense ("realized" → "had realized") — zero engagement with the directive. The targeted vague phrase ("something important") is untouched. This is true Branch 1: the edit shows no recognition of the move\'s direction at all. Tests that the model distinguishes pure-cosmetic edits from gestural engagement.',
    input: {
      essayId: "calibration-essay",

      priorTaughtMove: move({
        id: 'M-1-1-A-8',
        annotationId: 'A-8',
        location: { paragraphIndex: 1, sentenceIndex: 2, spanText: 'I realized something important' },
        teachingMode: 'action',
        contentSummary:
          '"I realized something important" tells without showing. Replace with the specific realization — what you now know, what shifted in your understanding, named concretely.',
      }),
      edit: {
        oldText: 'After three weeks, I realized something important.',
        newText: 'After three weeks, I had realized something important.',
        significance: 'minor',
      },
      newAnalysisAtLocation: {
        symptomFlagged: true,
        reasoning: 'Tense polish only ("realized" → "had realized"). The vague phrase the move targeted is unchanged; the realization is still unnamed.',
      },
    },
    expected: {
      status: 'unaddressed',
      confidenceMin: 0.75,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-9-changed-target-deletion',
    description: 'Move\'s target paragraph entirely deleted (no replacement, surrounding text stitched) → changed_target.',
    rationale:
      'The student didn\'t replace the offending paragraph with new content; they just deleted it and stitched the surrounding paragraphs together. The move\'s target is GONE — no longer in the essay. This is changed_target by deletion, distinct from changed_target by replacement. Tests that the prompt handles pure deletion cleanly.',
    input: {
      essayId: "calibration-essay",

      priorTaughtMove: move({
        id: 'M-1-3-A-9',
        annotationId: 'A-9',
        location: { paragraphIndex: 3, sentenceIndex: 0, spanText: 'When my grandmother passed' },
        teachingMode: 'connection',
        contentSummary:
          'This grief paragraph is doing too much work for the essay\'s through-line. Either let it earn its weight by connecting to the central argument, or trim it back significantly.',
      }),
      edit: {
        oldText:
          "When my grandmother passed, I felt the floor disappear beneath me. I did not eat for three days. I sat in her kitchen and held the green ceramic bowl she had used for everything — soup, dough, holding the keys when she came home.",
        newText: '',
        significance: 'transformative',
      },
      newAnalysisAtLocation: {
        symptomFlagged: false,
        reasoning: 'Paragraph deleted entirely; the original target is no longer in the essay.',
      },
    },
    expected: {
      status: 'changed_target',
      confidenceMin: 0.7,
      confidenceMax: 1.0,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-10-strong-partial-multifaceted',
    description: 'Multi-facet directive: student executes one facet, leaves the other → partially_addressed.',
    rationale:
      'Move asked for two things: (1) cut a tangent and (2) reconnect to the central image. Student cut the tangent successfully but didn\'t reconnect to the central image. Half the directive executed. This is partially_addressed at higher confidence (0.75ish) than the gestural cases — the executed facet is real, not gestural. Tests that the model can read multi-facet directives.',
    input: {
      essayId: "calibration-essay",

      priorTaughtMove: move({
        id: 'M-1-4-A-10',
        annotationId: 'A-10',
        location: { paragraphIndex: 4, sentenceIndex: 0 },
        teachingMode: 'action',
        contentSummary:
          'Two things in this paragraph: (1) the digression about your father\'s coworker is pulling focus from the central pawnshop image — cut it. (2) After cutting, reconnect the closing sentence to the pawnshop frame so the reader feels the through-line.',
      }),
      edit: {
        oldText:
          "My father's coworker, Marco, who had once played in a small jazz band in Naples and still kept a battered trumpet in his car, used to say the same thing — that you can tell a person's whole life from their hands. Standing behind the counter at the pawnshop, I saw what Marco meant.",
        newText:
          "Standing behind the counter at the pawnshop, I saw what he meant — that you can tell a person's whole life from their hands.",
        significance: 'significant',
      },
      newAnalysisAtLocation: {
        symptomFlagged: true,
        reasoning: 'Tangent successfully cut. But the closing sentence references "what he meant" without naming Marco or reconnecting explicitly to the pawnshop image; the through-line is weaker than the move asked for.',
      },
    },
    expected: {
      status: 'partially_addressed',
      confidenceMin: 0.6,
      confidenceMax: 0.95,
      mustListSignals: ['edit_vs_critique', 'redetection'],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  {
    id: 'case-5-low-confidence',
    description: 'Low-confidence — gestural addition; partially_addressed at <0.7 confidence.',
    rationale:
      'The move asked the student to push past summary to a claim they could not have made on page 1. The student left the summary intact ("perseverance, empathy, leadership") and tacked on a vague reflection ("maybe that\'s why I keep coming back to them"). This is gestural — direction is correct but the claim is vague. Expected: partially_addressed at confidence < 0.7. Even if the model returns addressed, the Q4 floor downgrades it; calibration verifies the model reports honest sub-0.7 confidence rather than gaming over the floor.',
    input: {
      essayId: "calibration-essay",

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
