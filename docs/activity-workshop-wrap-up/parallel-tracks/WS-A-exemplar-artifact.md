# WS-A: Exemplar Target Artifact

> **Purpose**: Produce the hand-authored target output that every Phase 2 feature must reproduce. This is the truth signal for the entire wrap-up. Without it, "improvement" is unfalsifiable.
> **Owner**: Tue (or writing-focused agent under Tue's review — output must be human-edited, not LLM-generated end-to-end)
> **Estimated time**: 1–2 days
> **Output location**: `docs/activity-workshop-wrap-up/exemplars/target-output.md`

---

## Paste this prompt into a fresh session

You are producing the **target exemplar output** for the Activity Workshop wrap-up. This artifact becomes the rubric north star — every Phase 2 feature must reproduce it for the reference portfolio.

### What to read first

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` — what the wrap-up is building
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — why this exemplar is needed (finding M4)
3. `tests/output/full-profile-14-harvard-2028-crochet.md` — the reference portfolio's CURRENT output (the 3001-line monster the wrap-up is trying to humanize)
4. Memory: `essay-intelligence-counselor-gap.md` — what counselor-grade output looks like across waves
5. Memory: `feedback_planning_preferences.md` Rule 3 — the requirement for concrete exemplars

### What to produce

For the reference portfolio (Harvard 2028, crochet activity headliner, 491-word essay), hand-write the **target post-wrap-up output**. Six sections, in order:

#### 1. Executive Brief (≤300 words)
- 1-sentence competitive verdict ("Tier: 3.5 ± 0.4. Strong narrative cohesion; underexposed leadership signal.")
- Top-3 strengths, each cited to a specific activity (not "your work shows...")
- Top-3 actions, ranked by leverage with estimated effort ("≤30 min", "1 hr", "rewrite required")
- 1-sentence school-list read ("Reach: appropriate for stated Harvard target if action #1 lands; Stanford fit weaker due to ____")

#### 2. Cut-List
- Ranked deletion candidates for any portfolio >10 activities
- Each cut: activity name, deletion confidence (%), 1-line reason, what replaces the signal if removed
- Bottom of cut-list: 1 activity to PROMOTE (move up the ordering)

#### 3. Top-3 Model-Sentence Variants
For the single highest-leverage activity description, write 3 variants under 150 chars each:
- Variant 1: emphasizes impact/scope ("Led 12-person...")
- Variant 2: emphasizes specificity ("Built Python pipeline classifying 4K patient records...")
- Variant 3: emphasizes agency/initiative ("Designed and shipped...")
Each labeled with what it emphasizes + what it sacrifices.

#### 4. Calibrated Competitive Verdict
- Harvard 1-6 scale + confidence interval
- 2-sentence rationale
- 3 named factors driving uncertainty (data completeness, constraint context, etc.)

#### 5. Advice-Trace Surface (mock multi-session view)
Show what the UI text looks like for "We said X last session; now Y":
- Imagine 2 prior sessions: Session 1 baseline, Session 2 after user edited activity 3
- Surface 1–2 advice changes with reasons that cite what changed

#### 6. Next-30-Minutes Panel
- Top-3 specific actions a student could complete in 30 minutes
- Each: 1-click-deep ("open activity 3 → replace description with variant 2 above")
- Verification: how the student knows it landed

### Quality bar — non-negotiable

- **Hand-edited prose.** LLM draft → Tue or human writer rewrites every sentence. The current 3000-line output is what LLM-only produces; that's the floor we're escaping.
- **No fabricated metrics.** If you need a number, mark it `<student fills in>` or use the verified facts visible in the reference output.
- **Specific over generic.** "Add metrics" is banned. "Replace 'helped peers' with 'tutored 8 students through SAT math averaging +120 points'" is the bar.
- **Citable.** Every claim in the Executive Brief points to a sentence or activity in the source portfolio.

### Output structure

Write to `docs/activity-workshop-wrap-up/exemplars/target-output.md` with this header:

```markdown
# Target Exemplar — Harvard 2028 Crochet Portfolio
> Hand-authored. Last edited by: <name>. Date: <date>.
> Source portfolio: `tests/output/full-profile-14-harvard-2028-crochet.md`
> This artifact is the rubric north star for Activity Workshop wrap-up Phase 2.
```

Then the 6 sections above.

### Bonus deliverable (if time permits)

`docs/activity-workshop-wrap-up/exemplars/anti-exemplar.md` — a parallel file showing the CURRENT system output side-by-side with the target, with annotations of what's wrong. This becomes the "before/after" reference for the rubric.

---

## Status

- [ ] Started
- [ ] First draft (LLM-assisted)
- [ ] Human edit pass
- [ ] Reviewed against `counselor-gap.md` waves
- [ ] Committed
- [ ] Anti-exemplar produced (bonus)
