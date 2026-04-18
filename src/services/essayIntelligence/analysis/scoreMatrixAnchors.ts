/**
 * Port G3 — Few-shot calibration for L4 ScoreMatrix (4 dimensions).
 *
 * The crystallizer's ScoreMatrix prompt defines bands for its four new
 * dimensions (structural, voice, emotional, thematic) but carries ZERO
 * concrete text examples — just the FULL-RANGE ANCHORS band definitions
 * at `crystallizer.ts:490-496`. Without anchored examples the model
 * compresses into the 70-85 band regardless of essay quality (the exact
 * failure mode the anti-clustering protocol tries to prevent).
 *
 * This block adds 3 paragraph-level exemplars that span the 0-100 range
 * across all 4 dimensions. Each exemplar demonstrates what the dimension
 * scores would look like on a real paragraph, with rationale tied to
 * visible craft moves. The gold standard is L3.5's anchored-score
 * examples at `analysisPass.ts:470-482` (SCORE 38/52/72/88/78).
 *
 * Block slot: G3_FEW_SHOT_CALIBRATION @ v1.0.0 (evaluative — L4 territory,
 * forbidden-vocab lint does NOT scan this body).
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port G3.
 */

import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// @prompt-block G3_FEW_SHOT_CALIBRATION
const SCORE_MATRIX_ANCHORS_BODY = `DIMENSION-WISE ANCHOR EXEMPLARS (concrete paragraph scores across the 4 new dimensions)

Use these exemplars to calibrate your paragraph scoring. Each shows how a real paragraph lands across structural / voice / emotional / thematic dimensions, and WHY those specific numbers (not a narrow 70-85 band).

EXEMPLAR A — mid-essay transition paragraph, strong narrative essay
Paragraph: "Three weeks later, I opened the case again. The rosin was cracked. My mother was asleep on the couch, the lamp still on. I closed the lid without playing."
Scores: structural=78, voice=84, emotional=72, thematic=68
WHY:
  structural=78 — Clean transition paragraph doing transition work: establishes time jump, returns to the load-bearing object (the violin case), sets up the next scene. Competent architectural execution but not architecturally distinctive — a transition paragraph rarely scores 90+.
  voice=84 — Spare, concrete, trust-the-reader cadence. Four short declaratives. No modifiers. The restraint IS the voice. Higher than structural because the voice is doing more than the structure requires.
  emotional=72 — Earned muted sadness via environmental detail (cracked rosin, sleeping mother). Functional emotional work without the peak the essay builds toward in later paragraphs.
  thematic=68 — Contributes to the "silence after the injury" through-line but doesn't advance it — just maintains. Thematic scores land below emotional when a paragraph carries the theme without deepening it.
The 16-point spread between voice (84) and thematic (68) is diagnostic: this paragraph's craft outperforms its thematic contribution, which is expected for a transition beat but would be a red flag for a climax paragraph.

EXEMPLAR B — opening paragraph, manufactured sports-injury essay
Paragraph: "The moment I tore my ACL was the moment everything changed. I had been preparing for the state championship for months, training harder than ever before. But in an instant, my dreams were shattered and I was forced to reinvent myself."
Scores: structural=45, voice=32, emotional=38, thematic=40
WHY:
  structural=45 — Opening gets its job half-right (establishes stakes, names the injury) but the "everything changed" + "in an instant" frame is an opening-template architectural move — the paragraph is fulfilling a genre convention rather than architecting this essay.
  voice=32 — Three stock phrases in three sentences: "the moment [X] was the moment [Y]", "training harder than ever before", "dreams were shattered and I was forced to reinvent myself". The voice is the essay genre's voice, not this writer's.
  emotional=38 — Claimed emotions (dreams shattered, forced to reinvent) without bodied-in evidence — no sensation, no specific moment, no physical detail. Emotional assertions without emotional proof land below 40.
  thematic=40 — The paragraph announces a transformation theme but doesn't yet earn any of it. Not broken, just premature — the reader has to take the transformation on faith for three more paragraphs.
The cluster in the 32-45 band is the hallmark of a manufactured opening — all four dimensions fail together because the genre conventions span all four. Do NOT average this into the 55-65 "competent" band; that would be scoring compression.

EXEMPLAR C — late-essay revelation paragraph, distinctive essay
Paragraph: "I did not tell my grandmother I was the one who broke the bowl. She died three months later. When my mother asked, at the funeral, whose plate was left on the kitchen table that morning, I said I didn't know. I still don't know if I was protecting her or protecting myself."
Scores: structural=92, voice=88, emotional=94, thematic=90
WHY:
  structural=92 — Load-bearing revelation paragraph arriving exactly where the essay's architecture demands a reveal. Structural scores above 90 belong to paragraphs whose position in the essay is as load-bearing as their content.
  voice=88 — Plain-register restraint carrying heavy emotional weight without melodrama. "I still don't know" as the closing line refuses resolution — the voice is the stance.
  emotional=94 — Earned moral ambivalence. The writer doesn't tell the reader what to feel; the contradiction ("protecting her or protecting myself") is the emotion. Emotional scores above 90 require BOTH specific evidence AND earned ambiguity.
  thematic=90 — Advances the silence-as-protection through-line and complicates it (silence-as-self-protection). A paragraph that both deepens AND complicates its theme earns 90+.
All four dimensions cluster in the 88-94 band because all four are simultaneously executing — that IS the definition of an exceptional paragraph. Do NOT dampen the cluster to "avoid 90s" — the anti-clustering protocol forbids cluster in the middle bands, not at the extremes.

CALIBRATION RULE: When you find yourself scoring a paragraph 72/74/71/73 across all four dimensions, stop. Either one of those scores is wrong (you are compressing) or this paragraph is genuinely balanced-competent across all four — in which case document that reasoning explicitly, don't just let the numbers ride.`;

/**
 * Build the G3 ScoreMatrix anchors block for L4 crystallizer injection.
 * Wrapped via `withPromptBlockVersion(..., 'G3_FEW_SHOT_CALIBRATION')` so
 * cache-key divergence is seeded per block version.
 */
export function buildScoreMatrixAnchorsBlock(): string {
  return withPromptBlockVersion(SCORE_MATRIX_ANCHORS_BODY, 'G3_FEW_SHOT_CALIBRATION');
}
