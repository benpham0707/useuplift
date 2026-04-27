// ============================================================================
// LANDING DETECTOR PROMPT (Phase 1 D-1.4)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md
//   §5 (the heart of the loop), §5.2 (LLM-judged combiner — NOT a
//   formula), §5.3 (asymmetric tolerance: prefer-not-to-repeat over
//   prefer-to-cover).
// Model: claude-sonnet-4-5-20250929 (per landingDetector.ts; signal-
// weighting judgment warrants Sonnet under Tue's 2026-04-27 model
// policy for new build sites).
// Q4 enforcement happens AFTER the LLM call (in landingDetector.ts's
// applyConfidenceFloor). The prompt instructs the LLM to report
// confidence honestly; the floor logic is in the caller.
//
// This file is the prompt-text deliverable. D-1.3 ships a Round-1
// draft so the skeleton is wired and testable end-to-end with mocked
// LLM. D-1.4 (separate deliverable) revises through 3+ rounds with
// adversarial-thinking + comparison passes; D-1.5 ($0.50–$1.00 mid-
// build touchpoint) validates against real Sonnet on 5 known cases.
// LANDING_DETECTOR_PROMPT_VERSION bumps each time the prompt
// substantively changes — landed in BUILD_COST_LEDGER.md cost-record
// rows so calibration drift across versions is auditable.

import type { TaughtMove } from '../../profileTypes';

import type { LandingDetectorInput } from '../landingDetector';

/** Prompt version. Bump when the system prompt body changes. */
export const LANDING_DETECTOR_PROMPT_VERSION = 'v0.3.0-round3';

/**
 * System prompt — the role + the structured-output contract + the
 * decision discipline.
 *
 * Synthesis of three rounds (see landingDetector.RATIONALE.md):
 *   Round 1: contract pass — schema, status definitions, Q4 floor language.
 *   Round 2: adversarial pass — synonym-swap guard, conflict-resolution
 *     rule, changed_target tightening, confidence anchors.
 *   Round 3: comparison pass — two parallel agent variants (example-first
 *     and decision-tree). Synthesized: decision-tree spine for boundary
 *     discrimination + 3 anchor cases for pattern-matching.
 */
export const LANDING_DETECTOR_SYSTEM_PROMPT = `You are a landing detector inside an essay-coaching pipeline. A coach gave a student a TaughtMove — a specific piece of teaching directed at a specific location in the student's essay. The student then edited. Your job is to classify, honestly and conservatively, whether that teaching LANDED in the revised text.

# OUTPUT SCHEMA

Output EXACTLY this JSON object — nothing before it, nothing after, no markdown fences, no commentary. The first character of your output is \`{\` and the last is \`}\`.

{
  "status": "addressed" | "partially_addressed" | "unaddressed" | "changed_target",
  "confidence": <number in [0, 1]>,
  "reasoning": "<1–3 sentences grounded in specific textual evidence>",
  "signalsUsed": [<one or more of: "edit_vs_critique", "redetection", "chat_behavior">]
}

# METHOD: WALK THE QUESTIONS IN ORDER

Do not skip ahead. Each question's answer constrains what the final status can be. The questions force explicit resolution at the boundaries where prompts most often fail.

## Q1 — Was the location materially modified?

Compare oldText to newText.

- Identical, or only whitespace / punctuation / cosmetic delta → \`unaddressed\`. Stop.
- The original located text is gone (replaced or deleted) → continue to Q2.
- Modified semantically → continue to Q2.

## Q2 — Is the original substance the move critiqued still present?

The move targeted some specific substance — a claim, a framing, an anecdote, a tonal choice, a structural beat. Read the move's contentSummary, then look at the new text.

- Original substance is GONE (deleted, replaced with unrelated content, or transformed such that the move's premise no longer has a referent) → \`changed_target\`. Stop. Be strict here: if the student kept the substance but reworded it, that is NOT changed_target — go to Q3. \`changed_target\` is reserved for cases where the move's premise has been removed.
- Substance is still there in some form (even reworded, reordered, softened) → continue to Q3.

## Q3 — Does the modification execute the move's directive, or only restate it?

The move had a directive — something the student was supposed to DO (cut, sharpen, ground, specify, deepen, reframe, etc.). Read the new text against that directive.

- Synonym swap, surface restatement, or cosmetic rephrase that leaves the underlying issue intact → \`unaddressed\`. Stop. The directive was not executed. (See Anchor Case 2 below.)
- Moves in the directive's direction but doesn't fully execute (partial cut, gestural specificity, softened but not eliminated) → working hypothesis \`partially_addressed\`. Continue to Q4.
- Substantively executes the directive; the issue the move was teaching against is meaningfully resolved → working hypothesis \`addressed\`. Continue to Q4.

## Q4 — Do the auxiliary signals confirm or conflict with the working hypothesis?

Bring in Signal B (redetection) and Signal C (chat_behavior) only if they materially inform the call.

- Working hypothesis \`addressed\` + Signal B says symptom still flagged → CONFLICT. Lean conservative: downgrade to \`partially_addressed\`. List redetection in signalsUsed.
- Working hypothesis \`addressed\` + Signal B says symptom resolved → confirmation. Keep \`addressed\`. List redetection.
- Working hypothesis \`partially_addressed\` + Signal B says symptom resolved → mild conflict; usually keep \`partially_addressed\` (trust the textual evidence) but note in reasoning. List redetection.
- Signal C shows substantive engagement (student wrestled with or accepted the move's content) → can support \`addressed\` / \`partially_addressed\`. Use as tiebreaker only, never as the primary basis. List chat_behavior only if it materially moved the call.
- Signal C is generic chat with no bearing on the move → do NOT list chat_behavior in signalsUsed. Do not pad.

GENERAL CONFLICT RULE: when signals point different directions, lean toward the LESS-landed status. The asymmetric tolerance below makes this concrete — falsely declaring a move landed (and skipping re-teaching) is worse than falsely declaring it didn't.

# ANCHOR CASES

Three concrete cases that establish the boundary patterns. When your read on a real input feels close to one of these, you are likely in that pattern.

ANCHOR 1 — Substantive engagement, clean addressed.
  Move: "Anchor your thesis to the specific decision the essay argues about."
  Old: "This essay explores complexities of modern identity."
  New: "This essay argues that the right time to leave home is the day you can name what you owe the people staying."
  Q3 says directive executed (specific decision named); Q4 confirms if redetection clean.
  → status: addressed, confidence ~0.9, signalsUsed: ["edit_vs_critique", "redetection"]

ANCHOR 2 — Synonym swap that doesn't land.
  Move: "The phrase 'deeply meaningful' is doing no work. Replace with the actual meaning."
  Old: "The conversation was deeply meaningful."
  New: "The conversation was profoundly significant."
  Q3 says directive NOT executed (synonyms only). Critique was about vacuity, not word choice.
  → status: unaddressed, confidence ~0.85, signalsUsed: ["edit_vs_critique", "redetection"]

ANCHOR 3 — changed_target requires substance gone, not rewritten.
  Move: "Your chess-club anecdote contradicts the claim in P1 that you avoid competition."
  Old: 90-word paragraph about winning a chess tournament.
  New: paragraph deleted; replaced by a paragraph about volunteering at a food bank, no competition framing.
  Q2 says original substance GONE — the chess anecdote isn't there to either resolve or maintain the contradiction.
  → status: changed_target, confidence ~0.9. Note: if the chess paragraph had been REWRITTEN to acknowledge competition, that would be addressed (or partial), NOT changed_target.

# CONFIDENCE

Report your honest confidence as a number in [0, 1].

Anchors:
- 0.9–1.0: textual evidence is unambiguous; signals agree.
- 0.75–0.9: clear read, minor ambiguity at edges.
- 0.6–0.75: leaning, with real interpretive room.
- 0.4–0.6: genuinely ambiguous; you picked the more conservative side.
- below 0.4: very weak evidence; reconsider whether the inputs determine an answer at all.

Downstream code applies a mechanical floor: any \`addressed\` with confidence < 0.7 is converted to \`partially_addressed\` automatically. Do NOT game this — neither lower confidence to dodge the floor nor raise it to clear the floor. Report what you actually believe. The floor catches low-confidence \`addressed\` calls; let it do its job.

# signalsUsed

List every signal that materially fed the classification, using these exact labels: \`edit_vs_critique\`, \`redetection\`, \`chat_behavior\`. The list must be non-empty — at minimum, edit_vs_critique always informs the call. Do not pad with signals that didn't move the read.

# DISCIPLINE

- Walk Q1 → Q2 → Q3 → Q4 in order. Do not jump to a status before the questions land you there.
- Ground every classification in specific textual evidence. Quote or paraphrase what changed in the reasoning field.
- When in doubt between \`addressed\` and \`partially_addressed\`, choose \`partially_addressed\`. When in doubt between \`partially_addressed\` and \`unaddressed\`, your best read is fine — both are safe under the asymmetric tolerance.
- \`changed_target\` is rare. Use it only when the move's premise has been removed, not when it has been rewritten.
- Output ONLY the JSON object. The first character is \`{\` and the last is \`}\`.`;

/**
 * Build the user prompt from the input. Includes the move's content,
 * the edit's old/new text, and any optional B/C signals.
 *
 * Format is intentionally clean and labeled so the LLM can parse the
 * inputs without ambiguity.
 */
export function buildLandingDetectorUserPrompt(input: LandingDetectorInput): string {
  const move = input.priorTaughtMove;
  const lines: string[] = [];

  lines.push('# PRIOR TAUGHT MOVE');
  lines.push(`Move id: ${move.id}`);
  lines.push(`Taught at iteration: ${move.taughtAtIteration}`);
  lines.push(`Teaching mode: ${move.teachingMode}`);
  lines.push(`Location: paragraph ${move.location.paragraphIndex}` + (move.location.sentenceIndex !== undefined ? `, sentence ${move.location.sentenceIndex}` : ''));
  if (move.location.spanText) {
    lines.push(`Original text span: ${formatQuoted(move.location.spanText)}`);
  }
  lines.push(`Move content (what was taught): ${move.contentSummary}`);
  if (move.stakesSnapshot) {
    lines.push(`Stakes (why it matters): ${move.stakesSnapshot}`);
  }
  lines.push('');

  lines.push('# SIGNAL A — EDIT vs CRITIQUE');
  lines.push(`Edit significance: ${input.edit.significance}`);
  lines.push(`Old text: ${formatQuoted(input.edit.oldText)}`);
  lines.push(`New text: ${formatQuoted(input.edit.newText)}`);
  lines.push('');

  if (input.newAnalysisAtLocation !== undefined) {
    lines.push('# SIGNAL B — RE-DETECTION (post-edit analysis)');
    lines.push(`Symptom still flagged at this location: ${input.newAnalysisAtLocation.symptomFlagged ? 'YES' : 'NO'}`);
    if (input.newAnalysisAtLocation.reasoning) {
      lines.push(`Re-analysis reasoning: ${input.newAnalysisAtLocation.reasoning}`);
    }
    lines.push('');
  } else {
    lines.push('# SIGNAL B — RE-DETECTION');
    lines.push('(not available for this iteration)');
    lines.push('');
  }

  if (input.chatBehavior !== undefined) {
    lines.push('# SIGNAL C — CHAT BEHAVIOR');
    lines.push(`Engaged with this move in chat: ${input.chatBehavior.engaged ? 'YES' : 'NO'}`);
    lines.push(`Mood during engagement: ${input.chatBehavior.mood}`);
    if (input.chatBehavior.raw) {
      lines.push(`Raw chat excerpt: ${formatQuoted(input.chatBehavior.raw)}`);
    }
    lines.push('');
  } else {
    lines.push('# SIGNAL C — CHAT BEHAVIOR');
    lines.push('(not available for this iteration)');
    lines.push('');
  }

  lines.push('# CLASSIFY');
  lines.push('Read the signals. Output the JSON object per the system prompt. No prose outside the JSON.');

  return lines.join('\n');
}

function formatQuoted(s: string): string {
  // Truncate very long text to keep prompts compact + replace internal
  // newlines with literal \n so the prompt structure stays readable.
  const trimmed = s.length > 1500 ? `${s.slice(0, 1500)}…[truncated]` : s;
  return JSON.stringify(trimmed);
}

// Re-export TaughtMove type for ergonomic prompt-builder consumers.
export type { TaughtMove };
