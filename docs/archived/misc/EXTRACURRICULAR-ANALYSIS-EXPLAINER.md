# Extracurricular Analysis System — Plain‑English Explainer

This guide explains how our extracurricular activity analysis system works, why its scores are trustworthy, and how to read your results. It’s written for non‑technical readers.

---

## What the system does (in one sentence)
It reads an activity description (like what you’d put on an application) and scores it the way an experienced admissions reader would—using an 11‑category rubric—then tells you exactly what to fix to improve your score.

---

## What gets scored
We compute a single overall score called the Narrative Quality Index (NQI, 0–100) using 11 categories that admissions readers actually care about:

- Voice Integrity (authentic, specific, not “template” voice)
- Specificity & Evidence (numbers, outcomes, concrete details)
- Transformative Impact (before/after changes in you and others)
- Role Clarity & Ownership (what you specifically did/decided)
- Narrative Arc & Stakes (obstacle, stakes, turning point)
- Initiative & Leadership (created momentum or solved problems)
- Community & Collaboration (credits others, shows interdependence)
- Reflection & Meaning (transferable insight, not clichés)
- Craft & Language Quality (clear, vivid writing; active verbs)
- Fit & Trajectory (connects to broader interests/learning)
- Time Investment & Consistency (sustained commitment)

Each category is scored 0–10 with short explanations and evidence quotes pulled from your text. NQI is a weighted combination of these categories (weights adapt by activity type—e.g., leadership vs. service vs. research). You also receive diagnostic flags (like “no metrics” or “underdeveloped”) and ranked suggestions that target the fastest path to a higher score.

Why this mirrors real readers: This rubric is derived from admissions‑proven criteria and is validated by running both strong and weak entries and verifying the separation and the rationale behind each score.

---

## How the analysis pipeline works
The system runs in four stages for both accuracy and speed:

1) Feature Extraction (fast, no API cost)
- Finds numbers/metrics, active vs. passive verbs, stakes, turning points, credit to others, reflection markers, and more.
- This gives us a factual “map” of your description before any AI scoring.

2) Parallel Category Scoring (11 categories, batched)
- We score all 11 rubric categories in three parallel batches to reduce latency while keeping each score evidence‑based and explainable (quotes + confidence).

3) Conditional Deep Reflection (only if needed)
- If reflection appears weak (<6/10), we run a deeper analysis to avoid under‑scoring thoughtful entries that are understated.

4) NQI + Diagnostics + Coaching
- We compute NQI with adaptive weights per activity type.
- We add authenticity‑aware adjustments (light boosts for genuinely conversational voice; penalties for robotic/essay voice).
- We generate flags and rank suggested fixes by estimated impact on NQI so you know what to do first.

---

## Why the scores are accurate and precise

1) Evidence‑first scoring
- Every category score is tied to direct quotes and evaluator notes. This makes the results explainable and auditable—no “black box” vibes.

2) Adaptive weighting by activity type
- Leadership, service, research, arts, work—each category emphasizes what matters for that context. This avoids unfairly penalizing entries for the wrong reasons.

3) Authenticity detection tuned for activities
- The system recognizes bland “application voice” and rewards natural, specific voice. It lightly boosts strong authenticity and penalizes robotic phrasing, aligning with how humans judge voice.

4) “Quiet Excellence” safeguard
- Some great entries are understated (steady, genuine, not dramatic). A small “quiet excellence” bonus ensures those don’t get punished for not being flashy—only applied when other fundamentals are strong.

5) Separation proven on strong vs. weak entries
- In live tests, a strong entry scored ~80+, a weak entry ~17, with appropriate flags and actionable fixes. This clear separation is what you’d expect from trained human raters.

6) Blind validation and comprehensive runs
- We also run “blind” tests where the system doesn’t know the expected quality, then check that it ranks them correctly and that scores cluster in realistic bands (80+ excellent, 70s strong, 55–69 medium, <55 weak).

7) Real‑world dataset alignment
- On a real 10‑activity set from an actual application, the system highlighted exactly what admissions readers flag in practice: too short (≈50 words), no metrics, generic phrasing, shallow reflection, missing stakes. This alignment is a strong external check.

---

## What a “trustworthy” result looks like
- You’ll see: your NQI, your 11 category scores with quotes, diagnostic flags (e.g., no_metrics, underdeveloped), and a short ranked list of fixes that will most efficiently boost your NQI.
- The suggestions map directly to the flagged issues—for example, “Add concrete outcomes (numbers, timeframes)” if the system couldn’t find any metrics in your text.

Tiers (how to interpret NQI quickly):
- 80–100: Excellent (elite‑competitive)
- 70–79: Strong (competitive)
- 55–69: Medium (needs targeted improvements)
- <55: Weak (rewrite with specificity, stakes, reflection)

---

## Example (condensed)
Entry excerpt (generic service):
> “I volunteered at a local nonprofit… I helped with various tasks… I learned valuable lessons about teamwork.”

What we detect:
- No numbers/metrics, generic phrasing, no stakes/turning point, minimal reflection, mostly passive voice.

What you’d see in results:
- Flags: no_metrics, underdeveloped, weak_evidence, superficial_reflection, weak_voice
- Top fixes (ranked): “Add concrete numbers/outcomes”, “Show specific before/after change”, “Clarify your role and decisions”
- Quick rationale: Admissions readers need proof (what changed, for whom, by how much) and your specific contribution.

---

## Proof points (where this is demonstrated in the repo)
- Live API run results with category tables, flags, and clear separation between strong and weak entries (e.g., ~80 vs. ~17), plus cost/latency: see “Phase 1 Success Report”.
- Blind validation and comprehensive test suites show stable scoring bands, category distributions, and sensible flags.
- Real‑world dataset analysis (10 activities) highlights admissions‑aligned issues (too short; no metrics; lacking reflection/arc), confirming practical applicability.

References (internal docs/tests):
- Core engine & 4‑stage pipeline: `src/core/analysis/engine.ts`
- Phase 1 results and performance: `docs/PHASE_1_SUCCESS_REPORT.md`
- Real‑world dataset summary: `REAL_WORLD_ANALYSIS_SUMMARY.md`
- Comprehensive validation: `tests/comprehensive-validation.ts`
- Blind validation: `tests/blind-validation.ts`
- Demo with suggestions & flags: `tests/analysis-engine-demo.ts`
- Coaching output with “From Draft” and specific fixes: `tests/test-coaching-output.ts`

---

## Why this helps applicants (and counselors)
- It’s fast (seconds), consistent (no rater drift), and specific (evidence‑based feedback).
- It shows not just “what’s wrong” but “what to change first” to unlock the biggest score gains.
- It reflects the same dimensions that human admissions readers look for, so improvements you make translate into stronger applications—not just stronger scores.

---

## Limitations and transparency
- If your description is extremely short or generic, the system will flag “underdeveloped” and focus on minimum viable improvements (length, specifics, outcomes) before higher‑order polish.
- Some deep‑dive capabilities require API credits (the system falls back gracefully; you’ll still get useful flags and targeted fixes).
- As with any rubric, niche or unconventional entries may need a quick human glance to contextualize impact (the system will still surface the right levers—metrics, clarity, arc, reflection).

---

## How to use your result
1) Read your NQI tier to understand where you stand.
2) Skim flags for a quick diagnosis.
3) Apply the top 1–3 suggested fixes in order (they’re ranked by expected NQI lift).
4) Re‑run the analysis to confirm your improvement and get the next set of targeted fixes.

That’s how you iterate quickly toward an admissions‑strong activity narrative. 







