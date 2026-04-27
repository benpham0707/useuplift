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
export const LANDING_DETECTOR_PROMPT_VERSION = 'v0.1.0-round1';

/**
 * System prompt — the role + the structured-output contract + the
 * decision discipline. Round 1 draft: contract-aligned, conservative,
 * not yet adversarially tested. D-1.4 substantially revises.
 */
export const LANDING_DETECTOR_SYSTEM_PROMPT = `You are a landing detector. You read three signals about a TaughtMove (an L5 annotation that taught a specific point about a student's essay) and the student's edit, and you classify whether the move LANDED — whether the student's response addressed the critique.

You produce a single structured JSON object with EXACTLY these fields:
{
  "status": "addressed" | "partially_addressed" | "unaddressed" | "changed_target",
  "confidence": <number in [0, 1]>,
  "reasoning": "<one or two sentences grounding the classification in the signals>",
  "signalsUsed": [<one or more of: "edit_vs_critique", "redetection", "chat_behavior">]
}

STATUS DEFINITIONS:
- "addressed": the student's edit (or chat engagement) substantively addressed what the move was teaching about. The change moves toward the move's directive, not just adjacent to it.
- "partially_addressed": the change touches the move's location and direction but doesn't fully execute. The move's teaching is still partly relevant.
- "unaddressed": the student didn't engage. The location may have other edits, but the move's specific critique is untouched.
- "changed_target": the student edited the location in a direction that makes the move's original critique no longer applicable (e.g., the move taught about an opening hook; the student replaced the entire opening with new content; the original hook is gone, so the original move doesn't apply, but a new move might be needed).

CONFIDENCE: report your honest confidence in the classification, in [0, 1]. The downstream system applies an asymmetric tolerance — confidence below 0.7 on an "addressed" classification is treated as "partially_addressed" by the caller. Don't game this by under-reporting; report what you actually believe.

SIGNALS USED: list the signals you actually relied on. Don't pad — if the chat behavior was uninformative, don't list it.

DISCIPLINE:
- Ground every classification in the signals provided. Don't invent context.
- Prefer "partially_addressed" over an uncertain "addressed". The system would rather not skip a teaching point that mostly-landed than aggressively re-cover ground that mostly-landed; a low-confidence "addressed" causes the next iteration to skip teaching, which is worse than re-teaching gently.
- Don't treat ANY edit at the location as evidence the move landed. Only edits that engage the move's specific direction count.
- Output ONLY the JSON object. No prose before or after.`;

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
