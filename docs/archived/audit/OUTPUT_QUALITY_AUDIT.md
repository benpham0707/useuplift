# Deep Academic Report — Output Quality Audit

> **Auditor:** Output Quality Reviewer
> **Source file:** `docs/DEEP_ANALYSIS_OUTPUT_E2E.md` (231 lines)
> **Service file:** `deepAcademicReportService.ts` (1001 lines)
> **Date:** 2026-02-10

---

## Executive Summary

The report demonstrates strong domain knowledge and useful structure, but suffers from **severe cross-section repetition** (the same data points appear 3-4 times), **overlong Bottom Line bullets** (positioning and strength bullets are 60-70 words each), **AP exam stat / class GPA conflation** (the exact issue the prompt warns against), and a **low-relevance third challenge** (Social Studies for a CS applicant). The narrative arc is coherent but repetitive — the "story" gets told 3 times instead of building progressively.

---

## 1. ISSUES FOUND

### 1.1 Cross-Section Repetition (CRITICAL)

**Issue R1: Biggest Strength is verbatim identical in Bottom Line and Section 1**
- **Bottom Line (line 13):** "Computer Science excellence with Math foundation: Your 3.90 CS GPA (4.00 in AP CSA) paired with 3.77 Math average signals you're not just coding—you're thinking algorithmically. The 40% performance lift in CS and 35% lift in Math, both well above your 3.66 baseline, tells admissions officers you have the quantitative reasoning that separates students who complete CS programs from those who struggle."
- **Section 1, Notable Strengths (line 27):** Word-for-word identical text.
- **Root cause:** `buildBottomLine()` (service line 854-855) concatenates `notableStrengths[0].subject + ": " + notableStrengths[0].insight`, which produces the full text. The reader sees the SAME paragraph twice within ~15 lines of reading.
- **Severity:** Critical — undermines the entire "Bottom Line as executive summary" purpose.

**Issue R2: Biggest Risk is near-identical in Bottom Line and Section 2**
- **Bottom Line (line 14):** `challenges[0].title + ": " + challenges[0].tierImpact` = verbatim copy of Section 2 Challenge 1 tier impact.
- **Section 2, Challenge 1 Tier Impact (line 74):** Same text.
- **Root cause:** Same `buildBottomLine()` pattern (service line 857-858).
- **Severity:** Critical.

**Issue R3: Tier positioning repeated 5+ times**
- **Bottom Line (line 12):** "Selective (Top 30-80) (Boston University, Ohio State, UT Austin)..."
- **Section 1 narrative (line 21):** "upper edge of Selective tier (3.66 GPA, 78th percentile)"
- **Section 1 Tier Position (lines 46-54):** Full tier breakdown with same school names
- **Section 1 Uplift Rating (line 58):** "competitive for Selective/upper-Selective programs (UT Austin, Purdue, Ohio State)"
- **Section 2, Challenge 1 Tier Impact (line 74):** "pulls you from Highly Selective... down to Selective tier..."
- **Section 2, Challenge 2 Tier Impact (line 91):** "reinforces the Selective tier positioning (Boston University, Ohio State, UT Austin)"
- **Section 2, Challenge 3 Tier Impact (line 107):** "reinforces Selective tier positioning"
- **Severity:** High. The same tier framing appears in nearly every subsection. Each instance should add new information or it should be stated once and referenced.

**Issue R4: Chemistry GPA drop cited 3+ times**
- **Section 1 narrative (line 23):** "0.55 GPA drop from Chemistry Honors (3.70) to AP Chemistry (3.00)"
- **Section 1 weakness (line 41):** "0.55 GPA drop from Chemistry Honors (3.70) to AP Chemistry (3.00)"
- **Section 2, Challenge 2 (line 87):** "3.70 in Chemistry Honors → 3.00 in AP Chemistry (0.70 drop)"
- **Note:** The drop is **actually 0.70** (3.70 - 3.00 = 0.70). The "0.55" figure appears to be the overall typical difficulty impact, not the Chemistry-specific drop. This is an inconsistency (see I1 below).
- **Severity:** High (both repetition and numerical inconsistency).

**Issue R5: "62% of AP Statistics test-takers" cited 3 times**
- **Section 2, Challenge 1 (line 72):** Used in STEM Breadth context
- **Section 2, Challenge 3 (line 105):** Used in Social Studies context
- **Section 4, Research Context (line 201):** AP Stats table entry
- **Severity:** Medium — the stat itself is fine, but seeing it three times in one report is excessive.

---

### 1.2 AP Exam Stats / Class GPA Conflation (CRITICAL)

**Issue C1: AP Statistics exam rate used to evaluate AP Chemistry class performance**
- **Section 2, Challenge 1 (line 72):** "62% of AP Statistics test-takers nationwide score 3+ on the exam, yet you earned a 3.30 in that class — suggesting the AP Chem grade reflects genuine difficulty with chemistry concepts"
- **Problems:**
  1. This cites the AP *Statistics* exam pass rate but draws a conclusion about AP *Chemistry*
  2. Even if the right course, comparing an exam pass rate (score of 3+) to a class GPA (3.30 on 4.0 scale) is meaningless — these are completely different metrics on different scales
  3. The prompt (service line 511-512) explicitly says: "Do not compare a student's CLASS GPA (e.g. 3.30) directly to an AP exam pass rate (e.g. '62% pass'). These are different metrics."
- **Severity:** Critical — this is factually misleading and the exact error the prompt was designed to prevent.

**Issue C2: Same conflation repeated in Challenge 3**
- **Section 2, Challenge 3 (lines 105-106):** "62% of AP Statistics test-takers nationwide score 3+ on the exam, yet you earned a 3.30 in the class"
- **Same two problems:** wrong metric comparison, and the logic ("suggesting the grading environment may not fully explain the pattern") is a non-sequitur.
- **Severity:** Critical.

**Issue C3: Physics C pass rate used adjacent to class grade**
- **Section 2 Research Backing (line 80):** "AP Physics C Mechanics has high pass rates, making lower grades more visible: 76% of test-takers score 3+ on the AP exam"
- **Assessment:** This is less directly conflated — it's positioned as "research backing" rather than a direct comparison — but the framing "making lower grades more visible" implies the exam rate tells us something about class grading, which it doesn't.
- **Severity:** Medium.

---

### 1.3 Numerical Inconsistency (HIGH)

**Issue I1: Chemistry drop is 0.70, not 0.55**
- **Section 1 (lines 23, 41):** "0.55 GPA drop from Chemistry Honors (3.70) to AP Chemistry (3.00)"
- **Section 2 (line 87):** "0.70 drop" (correct)
- **Actual math:** 3.70 - 3.00 = 0.70. The 0.55 is the average difficulty impact across ALL subjects (from `transitionAnalysis.typicalImpact`), not the Chemistry-specific drop.
- **Section 2 line 87 uses BOTH:** "0.55-0.70 GPA drop" — mixing the average and the specific in a confusing range.
- **Severity:** High — factual error that could undermine trust in the report.

---

### 1.4 Vague / Low-Information Language (MEDIUM)

**Issue V1: Unexplained metrics**
- **Line 23:** "65% strength signal and 73% consistency" — what do these numbers mean? What's the scale? What's good vs. bad? No benchmarks provided.
- **Line 58:** "65% strength signal" again, still unexplained.
- **Line 21:** "78th percentile" — percentile of what? Among all US high schoolers? Among college-bound students? AP students?
- **Severity:** Medium — these numbers are dropped to look data-rich but teach nothing without context.

**Issue V2: Generic statements that don't teach**
- **Line 31:** "well-rounded CS graduates" — what does this mean operationally?
- **Line 33:** "visible upside if you optimize your remaining schedule" — optimize how? This is Section 1 (identity), not Section 3 (roadmap), so it shouldn't be previewing strategy.
- **Line 76:** "critical for proving CS readiness to selective programs" — generic; what would "proving readiness" look like?
- **Severity:** Low-Medium.

---

### 1.5 Claims Without Grounding (MEDIUM)

**Issue G1: "Harvard/Stanford/MIT range" claim**
- **Line 50:** "Your Computer Science GPA (3.90) would place you in Harvard/Stanford/MIT range if evaluated in isolation"
- **Problem:** A 3.90 in ONE AP course (AP CS A) at a suburban public school does not place you in Harvard/Stanford/MIT range by any reasonable metric. This conflates subject GPA with an overall profile assessment. Many applicants to these schools have 4.0 across ALL subjects.
- **Severity:** Medium-High — could set unrealistic expectations.

**Issue G2: AO claims without citation**
- **Line 39:** "Highly Selective CS programs (Northwestern, UCLA, Georgia Tech) will notice you're missing the AP Physics C: E&M" — is there data that these specific programs track Physics C: E&M specifically?
- **Line 89:** "potential gaps in mathematical maturity and problem-solving transfer" — ungrounded inference from a data pattern.
- **Severity:** Medium.

**Issue G3: "3.7+ across all STEM" claim for admitted CS students**
- **Lines 74, 91:** "admitted CS students typically show 3.7+ across all STEM"
- **Problem:** No citation provided. This appears fabricated. Even if directionally true, "typically" is vague.
- **Severity:** Medium — unsourced claim presented as fact.

---

### 1.6 Section Scope Violations (MEDIUM)

**Issue S1: Section 1 weakness previews are too detailed**
- **Prompt says:** "1 sentence for the gap and 1 sentence for the consequence"
- **Actual output (lines 38-42):** Each weakness is 2-3 sentences with specific course names, GPA drops, and mini-analyses. The weakness at line 38 is practically a Challenge entry — it mentions specific courses (AP Physics C: E&M), school names (Northwestern, UCLA, Georgia Tech), and an implication about "hardware, systems, or interdisciplinary CS work."
- **Severity:** Medium — the weakness previews overlap significantly with Section 2 challenges.

**Issue S2: "Taking Control of the Narrative" gives roadmap-level advice**
- **Section 2 (lines 121-123):** "Reframe from... Senior year needs to show recovery... strategic course selection (depth in physics/math rather than breadth in AP Bio)..."
- **This crosses into Section 3 territory** — specific course strategy belongs in the Roadmap.
- **Severity:** Low-Medium.

---

### 1.7 Challenge Relevance (HIGH — see Section 3 for full analysis)

**Issue CH1: Social Studies as Challenge 3 for a CS applicant**
- **Section 2, Challenge 3 (lines 101-113):** "Social Studies Consistency Gap Creates Narrative Confusion"
- **Assessment:** This is the weakest challenge. For a CS applicant, Social Studies performance is a minor concern. The argument that 3.30 grades in APUSH + AP Stats + AP Physics C create a "broad AP struggle pattern" is undermined by:
  1. AP Stats is Math, not Social Studies — grouping it with APUSH is misleading
  2. The student has a 3.70 in AP English Lang, which BREAKS the "broad AP struggle" narrative (not acknowledged)
  3. AOs for CS programs will not weigh Social Studies heavily
- **Better alternative for Challenge 3:** "Lack of post-AP CS progression" — the student has one AP CS course and nothing beyond it. This is more relevant to CS admissions.
- **Severity:** High — a challenge slot is wasted on a low-relevance concern.

---

## 2. BOTTOM LINE REWRITE PROPOSALS

### Current State

| Bullet | Current Length | Target Length |
|--------|--------------|---------------|
| Rating | 28 chars | Fine |
| Position | ~350 chars (~68 words) | 120-150 chars max |
| Strength | ~370 chars (~69 words) | 120-150 chars max |
| Risk | ~390 chars (~70 words) | 120-150 chars max |
| Action | ~95 chars | Fine |

### Problem: buildBottomLine() Pulls Full Text

The code at service lines 852-863 creates Bottom Line bullets by concatenating LLM-generated section content. This means:
- **Positioning** = `tierPosition.currentTier + tierExamples + tierGap` (tierGap is already a full sentence with tactical details)
- **Strength** = `notableStrengths[0].subject + ": " + notableStrengths[0].insight` (insight is 2-3 sentences)
- **Risk** = `challenges[0].title + ": " + challenges[0].tierImpact` (tierImpact is 2-3 sentences)

These are fine for their original contexts but too long for an executive summary.

### Proposed Rewrites

**Position (current — 68 words):**
> Selective (Top 30-80) (Boston University, Ohio State, UT Austin). To reach Highly Selective tier (Northwestern, UCLA, Georgetown), you need 3.70+ overall GPA—practically, this means earning 3.85+ across your next 6-8 courses to pull your cumulative average above the threshold, which requires avoiding Science courses where you've shown 0.55 GPA drops and doubling down on CS/Math/English where you consistently hit 3.70-4.00.

**Proposed (27 words):**
> Selective tier (Boston U, Ohio State, UT Austin). Just 0.04 GPA points from Highly Selective (Northwestern, UCLA) — a strong senior year could close the gap.

**Strength (current — 69 words):**
> Computer Science excellence with Math foundation: Your 3.90 CS GPA (4.00 in AP CSA) paired with 3.77 Math average signals you're not just coding—you're thinking algorithmically. The 40% performance lift in CS and 35% lift in Math, both well above your 3.66 baseline, tells admissions officers you have the quantitative reasoning that separates students who complete CS programs from those who struggle.

**Proposed (31 words):**
> CS + Math excellence: 3.90 CS GPA paired with 3.77 Math (both 35-40% above baseline) signals the algorithmic thinking and quantitative depth that CS programs value most.

**Risk (current — 70 words):**
> STEM Breadth Weakness in Core CS Prerequisites: This STEM unevenness pulls you from Highly Selective CS programs (UCLA, Georgia Tech — where admitted CS students typically show 3.7+ across all STEM) down to Selective tier CS programs (Purdue, UMass Amherst — where a 3.66 overall with strong CS focus is competitive). Your CS GPA alone would position you for Ivy/Elite consideration, but the supporting STEM grades limit your ceiling.

**Proposed (32 words):**
> STEM breadth gap: 3.43 Science GPA (vs. 3.90 CS) pulls you from Highly Selective CS programs (UCLA, Georgia Tech) to Selective tier. Strong CS alone isn't enough without supporting STEM.

**Action (current — fine as-is):**
> #1 Priority: Bridge the Physics Gap for CS Major Credibility — Enroll in AP Physics C: Electricity & Magnetism for senior year

### Self-Containment Check
- **Rating:** Self-contained. Reads fine alone.
- **Position (proposed):** Self-contained. Tells you where you are and how close you are to the next level.
- **Strength (proposed):** Self-contained. Tells you what and why.
- **Risk (proposed):** Self-contained. Tells you what and the consequence.
- **Action:** Self-contained. Clear directive.

---

## 3. CHALLENGE RELEVANCE ANALYSIS (Social Studies — Challenge 3)

### Is Social Studies a meaningful challenge for a CS applicant?

**No.** Here's why:

1. **AO weighting for CS:** CS admissions officers care about (in order): STEM rigor, Math depth, CS coursework, overall GPA, and rigor of schedule. Social Studies is evaluated only as part of "overall rigor" — not as a standalone signal. A 3.30 in APUSH would not be flagged for a CS applicant.

2. **The "broad AP struggle" argument is flawed:**
   - The argument (lines 103-107) groups AP US History (3.30), AP Statistics (3.30), and AP Physics C (3.30) together to claim "broad AP-level struggle across multiple disciplines."
   - But AP Statistics is MATH, not Social Studies. Grouping it under Social Studies is misleading.
   - The student earned 3.70 in AP English Language — this counter-evidence BREAKS the "broad AP struggle" narrative but is never acknowledged.
   - The student also earned 4.00 in AP CS A — another counter-point.
   - With 2 APs at 3.70-4.00 and 4 APs at 3.00-3.30, the pattern is more "uneven AP performance" than "broad AP struggle."

3. **The AP Stats citation is misplaced:**
   - Lines 105-106: "62% of AP Statistics test-takers nationwide score 3+ on the exam, yet you earned a 3.30 in the class"
   - This appears in the **Social Studies** challenge — but AP Stats is a Math course.
   - The citation compares exam pass rate to class grade (the exact conflation the prompt warns against).

4. **A better third challenge exists:** "Lack of post-AP CS progression." The student's ONLY CS course is AP CS A (a single course). For CS admissions, demonstrating depth beyond intro-level CS (data structures, algorithms, independent projects, dual enrollment) is critical. This is a more impactful challenge than Social Studies.

### Should the prompt weight challenges by major relevance?

**YES.** The current Challenges prompt (service lines 501-543) says "Focus on 2-3 DISTINCT challenges" but gives no instruction about prioritizing challenges that matter most for the student's intended major. Adding a major-relevance filter would prevent wasting a challenge slot on Social Studies for a CS applicant.

---

## 4. NARRATIVE ARC ASSESSMENT

### The Throughline

The intended story: *"CS specialist with strong Math foundation positioned at the cusp of Selective/Highly Selective — STEM breadth weakness is the barrier, and strategic senior-year choices can address it."*

This throughline IS present and coherent. The problem is execution — the story gets re-told in each section rather than building progressively.

### Section-by-Section Flow

| Transition | Quality | Issue |
|-----------|---------|-------|
| Bottom Line → Section 1 | Poor (3/10) | Bottom Line pulls verbatim text FROM Section 1, so reading both feels like reading the same content twice. |
| Section 1 → Section 2 | Mediocre (5/10) | Weakness previews in Section 1 significantly overlap with Challenge details in Section 2. The Chemistry drop, Science gap, and difficulty sensitivity are all covered in both. |
| Section 2 → Section 3 | Good (7/10) | Challenges set up problems, Roadmap provides solutions. The `roadmapConnection` field in each challenge creates a nice bridge. |
| Section 3 → Section 4 | Fine (6/10) | Section 4 is reference material. No narrative connection needed, but it functions as an appendix. |

### What "Progressive Building" Should Look Like

- **Bottom Line:** The headline — what tier, what grade, what to do. 5 punchy bullets.
- **Section 1:** The portrait — who you are, your academic identity, where you stand. No challenges or solutions.
- **Section 2:** The reality check — what AOs actually see, and why it matters. NEW information that Section 1 didn't cover.
- **Section 3:** The action plan — what to do about it. Builds on Section 2's challenges with specific solutions.

Currently, Sections 1 and 2 have ~40% content overlap because Section 1's weakness previews ARE mini-versions of Section 2's challenges.

### Disconnected Elements

1. **Challenge 3 (Social Studies)** feels disconnected from the CS applicant narrative. The throughline is about STEM readiness; Social Studies breaks this thread.
2. **"Unintended Narrative" (line 117-119)** re-summarizes all three challenges in a single paragraph — useful but redundant if you've just read all three.
3. **"Taking Control of the Narrative" (line 121-123)** crosses into Roadmap territory with specific course strategy advice.

### Coherence Score: 5.5/10

The story is there, but it's told 3x instead of building progressively. A reader going top-to-bottom would feel significant deja vu by Section 2.

---

## 5. PROPOSED PROMPT ENGINEERING IMPROVEMENTS

### Fix F1: Bottom Line Truncation (Code change, not prompt)

**File:** `deepAcademicReportService.ts`
**Lines:** 844-863 (`buildBottomLine()`)

**Problem:** `buildBottomLine()` concatenates full LLM-generated text. The strength insight and challenge tierImpact are 2-3 sentences each — too long for executive summary bullets.

**Before (lines 852-861):**
```typescript
return {
  rating: `Uplift Rating: ${identity.upliftRating.grade}${gradeDescriptor ? ` — ${gradeDescriptor.label}` : ''}`,
  positioning: `${identity.tierPosition.currentTier} (${identity.tierPosition.tierExamples.slice(0, 3).join(', ')}). ${identity.tierPosition.tierGap}`,
  biggestStrength: identity.notableStrengths.length > 0
    ? `${identity.notableStrengths[0].subject}: ${identity.notableStrengths[0].insight}`
    : 'No standout strength identified.',
  biggestRisk: challenges.challenges.length > 0
    ? `${challenges.challenges[0].title}: ${challenges.challenges[0].tierImpact}`
    : 'No critical risks identified.',
  topAction: roadmap.priorities.length > 0
    ? `#1 Priority: ${roadmap.priorities[0].title} — ${roadmap.priorities[0].actionItems[0] || roadmap.priorities[0].description}`
    : 'Continue current trajectory.',
};
```

**After — Option A (truncate at sentence boundary):**
```typescript
function truncateToSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > maxChars * 0.5 ? truncated.slice(0, lastPeriod + 1) : truncated + '...';
}

return {
  rating: `Uplift Rating: ${identity.upliftRating.grade}${gradeDescriptor ? ` — ${gradeDescriptor.label}` : ''}`,
  positioning: truncateToSentence(
    `${identity.tierPosition.currentTier} (${identity.tierPosition.tierExamples.slice(0, 3).join(', ')}). ${identity.tierPosition.tierGap}`,
    150
  ),
  biggestStrength: identity.notableStrengths.length > 0
    ? truncateToSentence(`${identity.notableStrengths[0].subject}: ${identity.notableStrengths[0].insight}`, 150)
    : 'No standout strength identified.',
  biggestRisk: challenges.challenges.length > 0
    ? truncateToSentence(`${challenges.challenges[0].title}: ${challenges.challenges[0].tierImpact}`, 150)
    : 'No critical risks identified.',
  topAction: roadmap.priorities.length > 0
    ? `#1 Priority: ${roadmap.priorities[0].title} — ${roadmap.priorities[0].actionItems[0] || roadmap.priorities[0].description}`
    : 'Continue current trajectory.',
};
```

**After — Option B (add `bottomLineSummary` field to LLM outputs):**
Add a dedicated one-sentence summary field to each LLM section's JSON schema, specifically for Bottom Line use. This avoids truncation heuristics and lets the LLM write the summary at the appropriate length.

**Recommendation:** Option B is better long-term (LLM writes purpose-specific text), but Option A is faster to implement and doesn't require re-running LLM calls.

---

### Fix F2: Major-Relevance Filter for Challenges

**File:** `deepAcademicReportService.ts`
**Lines:** 501-543 (Challenges system prompt)

**Problem:** The prompt says "Focus on 2-3 DISTINCT challenges" but doesn't instruct the LLM to prioritize challenges relevant to the student's intended major. Result: Social Studies becomes Challenge 3 for a CS applicant.

**Before (line 525):**
```
Focus on 2-3 DISTINCT challenges. Each should cover a genuinely different concern — not different angles on the same issue.
```

**After:**
```
Focus on 2-3 DISTINCT challenges. Each should cover a genuinely different concern — not different angles on the same issue. PRIORITIZE challenges that matter most for the student's intended major. For example, a CS applicant's challenges should focus on STEM readiness, CS progression, and math depth — not Social Studies performance. Only include non-major-relevant challenges if they rise to the level of a truly concerning pattern (e.g., failing grades across multiple areas).
```

**Why:** Forces the LLM to use the third challenge slot for something more impactful — like lack of post-AP CS progression, which directly matters for CS admissions.

---

### Fix F3: Strengthen AP Stat / GPA Conflation Guard

**File:** `deepAcademicReportService.ts`
**Lines:** 511-513 (Challenges system prompt, DATA ACCURACY section)

**Problem:** Despite the existing instruction, the LLM still compares "62% of AP Statistics test-takers score 3+" to the student's 3.30 class grade. The current guard is instructional but not firm enough — the LLM treats it as a suggestion.

**Before (lines 511-513):**
```
DATA ACCURACY:
- AP pass rates and five rates measure AP EXAM performance (scores of 3+). They are NOT class grades. Do not compare a student's CLASS GPA (e.g. 3.30) directly to an AP exam pass rate (e.g. "62% pass"). These are different metrics.
- When citing statistics, be precise about what they measure. "76% of AP Physics C test-takers score 3+" is about the exam, not classroom grades.
- Only cite statistics from the VERIFIED STATISTICS section provided. Do not invent or extrapolate statistics.
```

**After:**
```
DATA ACCURACY — HARD RULES (violations make the report factually incorrect):
- AP pass rates measure AP EXAM performance (scores 1-5, where 3+ = passing). Class GPA is on a 4.0 scale. These are COMPLETELY UNRELATED metrics.
- NEVER write a sentence that puts an AP exam pass rate and a student's class GPA in the same paragraph or logical chain. Example of what NOT to do: "62% of AP Statistics test-takers score 3+ on the exam, yet you earned a 3.30 in the class." This sentence is MEANINGLESS — a 3.30 class GPA and a score of 3+ on the AP exam are not comparable.
- When citing AP statistics, ONLY use them to characterize course difficulty (e.g., "AP Physics C has a 76% exam pass rate, indicating it's an accessible AP for prepared students") — NOT to evaluate a student's class grade.
- Only cite statistics from the VERIFIED STATISTICS section provided. Do not invent or extrapolate statistics.
- Do not cite the same statistic more than once across all challenges.
```

**Why:** The current instruction tells the LLM what not to do but doesn't give a concrete bad example that matches what it's actually generating. Adding the exact bad pattern and labeling it "MEANINGLESS" creates stronger aversion.

---

### Fix F4: Section 1 Weakness Brevity Enforcement

**File:** `deepAcademicReportService.ts`
**Lines:** 376-382 (Identity system prompt, notableWeaknesses JSON schema)

**Problem:** The prompt says "1 sentence for the gap and 1 sentence for the consequence" but the LLM produces 2-3 sentences per weakness with specific course names, school examples, and mini-analyses that overlap with Section 2.

**Before (lines 376-382):**
```json
"notableWeaknesses": [
  {
    "area": "Subject or pattern name",
    "gap": "The gap with tier context. 1 sentence.",
    "consequence": "Why it matters. 1 sentence."
  }
]
```

**After:**
```json
"notableWeaknesses": [
  {
    "area": "Subject or pattern name",
    "gap": "MAX 25 WORDS. The gap stated as a fact. Example: 'Your 3.43 Science GPA sits 0.47 points below your CS peak, placing it in mid-Selective tier.'",
    "consequence": "MAX 20 WORDS. The cost, briefly. Example: 'This gap limits your ceiling at STEM-focused Highly Selective programs.' Do NOT mention specific schools or courses — Section 2 covers those details."
  }
]
```

**Why:** Adding word limits and explicit "do NOT mention specific schools or courses" prevents scope creep into Section 2 territory.

---

### Fix F5: Chemistry Drop Numerical Accuracy

**File:** `deepAcademicReportService.ts`
**Lines:** 455-456 (Identity user prompt, DIFFICULTY IMPACT section)

**Problem:** The LLM confuses the overall typical difficulty impact (0.55 from `transitionAnalysis.typicalImpact`) with the specific Chemistry Honors → AP Chemistry drop (0.70). Section 1 says "0.55 GPA drop from Chemistry Honors to AP Chemistry" (wrong); Section 2 says "0.70 drop" (correct) and "0.55-0.70" (confused).

**Before (line 455):**
```
DIFFICULTY IMPACT: Typical ${quant.challengeResponse.transitionAnalysis.typicalImpact.toFixed(2)} GPA drop when increasing level
```

**After:**
```
DIFFICULTY IMPACT: Typical ${quant.challengeResponse.transitionAnalysis.typicalImpact.toFixed(2)} GPA drop when increasing level (this is the AVERAGE across all subjects — individual subjects may differ. Always calculate subject-specific drops from the actual course grades listed above, e.g., Chemistry Honors 3.70 → AP Chemistry 3.00 = 0.70 drop, NOT 0.55.)
```

**Why:** Explicitly distinguishes the average impact from subject-specific drops and shows the correct calculation.

---

### Fix F6: Explain Opaque Metrics

**File:** `deepAcademicReportService.ts`
**Lines:** 347-395 (Identity system prompt)

**Problem:** The output drops "65% strength signal" and "73% consistency" without explaining what these numbers mean.

**Add to system prompt after line 352 ("Every sentence must contain..."):**
```
4. When using metrics like "consistency score," "strength signal," or "percentile," ALWAYS explain what the number measures and provide a benchmark. Example: "Your 73% consistency score (above the 60% threshold for 'predictable under pressure') means..." Do NOT drop raw numbers without context.
```

**Why:** The LLM needs explicit instruction to contextualize opaque metrics for a student audience.

---

### Fix F7: Tone Down Speculative Tier Claims

**File:** `deepAcademicReportService.ts`
**Lines:** 347-395 (Identity system prompt)

**Problem:** "Your Computer Science GPA (3.90) would place you in Harvard/Stanford/MIT range if evaluated in isolation" is misleading. A 3.90 in a single AP course does not equate to Ivy admission range.

**Add to system prompt, CRITICAL RULES section (after rule 3):**
```
4. The "strengthTier" and "weaknessTier" are ILLUSTRATIVE comparisons to show the spread in their profile — NOT predictions of admission outcomes. Frame them as "if your entire transcript matched your CS performance" rather than "your CS GPA places you at Harvard." One subject's GPA does not predict admission to any specific school.
```

**Why:** Prevents the LLM from making speculative claims that could mislead students.

---

### Fix F8: Deduplicate Stats Across Challenges

**File:** `deepAcademicReportService.ts`
**Lines:** 525-543 (Challenges system prompt, near "Focus on 2-3 DISTINCT challenges")

**Problem:** The same AP Statistics "62%" citation appears in multiple challenges.

**Add to CRITICAL RULES:**
```
6. Each statistic from the VERIFIED STATISTICS section may be cited in AT MOST ONE challenge. Do not reuse the same data point across challenges — each challenge should have its own distinct supporting evidence.
```

---

## 6. QUESTIONS FOR THE LEAD

1. **Bottom Line approach:** Should we implement Option A (truncation helper) or Option B (dedicated LLM summary fields) for bottom line brevity? Option A is quick; Option B is better quality but adds to the JSON schema and prompt complexity.

2. **Challenge relevance weighting:** Should we add a hard rule like "at least 2 of 3 challenges must be directly relevant to the student's intended major" or a softer "prioritize major-relevant challenges"?

3. **AP stat / GPA conflation:** The current guard failed. Beyond strengthening the prompt, should we add a **post-processing validation** step that detects sentences containing both "test-takers" (exam context) and class GPA numbers, and flags/removes them?

4. **Chemistry drop inconsistency (0.55 vs 0.70):** Should we pre-calculate per-subject drops and inject them into the prompts as pre-computed facts (like we do for tier position), so the LLM doesn't have to do the math?

5. **Strength tier claim ("Harvard/Stanford/MIT"):** How far should we tone this down? Options:
   - a) Remove strengthTier entirely from the Bottom Line
   - b) Keep it but reframe ("if your entire transcript matched this performance...")
   - c) Only show strengthTier when it's within one tier of the current tier (not a 2+ tier jump)

6. **Third challenge slot:** If Social Studies is dropped, should we prompt for "lack of CS progression beyond AP CS A" as a default challenge for CS applicants, or leave it to the LLM to identify the most relevant third concern?

---

## APPENDIX: Summary of Issues by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 4 | R1 (verbatim Bottom Line/Section 1), R2 (verbatim Bottom Line/Section 2), C1 (Stats exam rate for Chem grade), C2 (Stats conflation repeated) |
| High | 4 | R3 (tier repeated 5+ times), R4 (Chem drop 3+ times), I1 (0.55 vs 0.70), CH1 (Social Studies relevance) |
| Medium | 6 | R5 (62% cited 3x), C3 (Physics rate framing), V1 (unexplained metrics), G1 (Harvard claim), G2 (unsourced AO claims), G3 (3.7+ STEM claim) |
| Low | 2 | V2 (generic statements), S2 (narrative control crosses into roadmap) |

**Total: 16 distinct issues identified.**
