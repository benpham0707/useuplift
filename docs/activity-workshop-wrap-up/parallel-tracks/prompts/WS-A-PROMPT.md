You are producing the **target exemplar output** for the Activity Workshop wrap-up. This artifact becomes the rubric north star — every Phase 2 feature must reproduce it for the reference portfolio. Without it, "improvement" is unfalsifiable (this is review finding M4).

## Read first (in order)

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` — what the wrap-up is building
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — why this exemplar is needed
3. `tests/output/full-profile-14-harvard-2028-crochet.md` — the reference portfolio's CURRENT 3001-line output we are escaping
4. `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/essay-intelligence-counselor-gap.md` — what counselor-grade output looks like
5. `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/feedback_planning_preferences.md` Rule 3 — the requirement for concrete exemplars

## Produce

Hand-write the target post-wrap-up output for the Harvard 2028 crochet portfolio. Six sections, in order:

### 1. Executive Brief (≤300 words)
- 1-sentence competitive verdict ("Tier: 3.5 ± 0.4. Strong narrative cohesion; underexposed leadership signal.")
- Top-3 strengths, each cited to a specific activity (not "your work shows...")
- Top-3 actions, ranked by leverage with estimated effort ("≤30 min", "1 hr", "rewrite required")
- 1-sentence school-list read ("Reach: appropriate for stated Harvard target if action #1 lands; Stanford fit weaker due to ____")

### 2. Cut-List
- Ranked deletion candidates for portfolios >10 activities
- Each cut: activity name, deletion confidence (%), 1-line reason, what replaces the signal if removed
- Bottom: 1 activity to PROMOTE

### 3. Top-3 Model-Sentence Variants
For the single highest-leverage activity description, write 3 variants under 150 chars each:
- Variant 1: emphasizes impact/scope
- Variant 2: emphasizes specificity
- Variant 3: emphasizes agency/initiative
Each labeled with what it emphasizes + what it sacrifices.

### 4. Calibrated Competitive Verdict
- Harvard 1-6 scale + confidence interval
- 2-sentence rationale
- 3 named factors driving uncertainty

### 5. Advice-Trace Surface (multi-session mock)
Imagine 2 prior sessions. Show 1–2 advice changes with reasons that cite what changed between sessions ("We said X. Now Y because you added [fact] in session 2.")

### 6. Next-30-Minutes Panel
Top-3 actions a student could complete in 30 min. Each: 1-click deep, with verification step.

## Non-negotiable quality bar

- **Hand-edited prose.** LLM draft → human rewrites every sentence. The current 3000-line output is what LLM-only produces; that's the floor we're escaping.
- **No fabricated metrics.** If you need a number, mark `<student fills in>` or use facts already in the reference output.
- **Specific over generic.** "Add metrics" is banned. "Replace 'helped peers' with 'tutored 8 students through SAT math averaging +120 points'" is the bar.
- **Citable.** Every claim in the Executive Brief points to a sentence or activity in the source portfolio.

## Output

Write to: `docs/activity-workshop-wrap-up/exemplars/target-output.md`

Header:
```markdown
# Target Exemplar — Harvard 2028 Crochet Portfolio
> Hand-authored. Last edited by: <name>. Date: <date>.
> Source: `tests/output/full-profile-14-harvard-2028-crochet.md`
> This is the rubric north star for Activity Workshop wrap-up Phase 2.
```

## Bonus

If time permits: `docs/activity-workshop-wrap-up/exemplars/anti-exemplar.md` — current output vs target side-by-side with annotations. Becomes the "before/after" reference for the rubric.

Begin by reading the 5 files above, then draft the Executive Brief first (highest-leverage section).
