# Quality Iteration Swarm — Deep Output Quality & Prompt Engineering

> **Goal**: Transform both the Deep Academic Report and Activity Workshop from "good architecture, inconsistent output" to "production-grade output quality that students and parents trust."
>
> **Context**: Architecture is clean. Bugs are fixed. Parallelization is done. Now we're optimizing the QUALITY of what the student actually reads — prompt engineering, output validation, deduplication, calibration, and user experience.

---

## HOW TO RUN

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

Then paste the teammate sections below. Teammates run sequentially — each builds on the previous.

---

## TEAMMATE 1: Prompt Engineering — Deep Academic Report

**You are a prompt engineering specialist.** Your job is to improve every LLM prompt in the Deep Academic Report module so outputs are more specific, less generic, better calibrated, and free of known failure modes.

### Files You Own
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/generators/identityGenerator.ts` (176 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/generators/challengesGenerator.ts` (183 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/generators/roadmapGenerator.ts` (169 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/generators/bottomLineGenerator.ts` (110 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/generators/researchGenerator.ts` (107 lines)

### Fix IDs and Exact Changes

#### Q1: Strengthen Tier Illustration Disclaimer (identityGenerator.ts)
The current rule about strengthTier/weaknessTier being "ILLUSTRATIVE" is buried in a 5-rule block and LLMs still write "Your CS GPA places you at Harvard." Move the disclaimer into the output format spec AND add to the user prompt:

In the system prompt output format section for `tierPosition`, add this constraint:
```
"strengthTier": "ILLUSTRATIVE ONLY — must be prefixed with 'If your entire transcript matched your [subject] performance, you would be in [tier].' NEVER write '[subject] GPA places you at [school]' — that is factually misleading. A single-subject GPA does not determine admissions."
"weaknessTier": "Same rule — illustrative spread indicator, not a prediction."
```

#### Q2: Add Uplift Grade Weighting Rubric (identityGenerator.ts)
The LLM doesn't know how to weight the 5 factors. After the instruction about "HOLISTIC letter grade considering rigor, major alignment, trends, difficulty sensitivity, school context," add:

```
Approximate weighting guidance:
- GPA baseline: 40% (raw numbers matter, but are insufficient alone)
- Course rigor: 25% (a 3.7 in all-AP is fundamentally different from 3.7 in regular)
- Major alignment: 15% (courses relevant to intended major weighted more heavily)
- Trajectory: 10% (improving trend can add half a grade; declining subtracts)
- School context: 10% (under-resourced school with 5 APs available vs. elite prep with 30)

A 3.7 all-AP student should be at LEAST a half-grade higher than a 3.7 regular-classes student.
```

#### Q3: Fix Notable Strengths "majorRelevance" (identityGenerator.ts)
The instruction "Why it matters for their path. 1 sentence." produces boilerplate like "This connects to Computer Science." Change to:

```
"majorRelevance": "The hidden MECHANISM — what this strength actually signals for their path. NOT 'this is relevant to CS.' Instead: 'Your consistent 3.9+ in proof-based math signals abstract reasoning ability — the skill that separates students who thrive in theoretical CS from those who struggle after sophomore year.' Show the WHY behind the connection."
```

#### Q4: Fix Trajectory Framing (identityGenerator.ts)
"Between tiers" makes trajectory binary. Change the paragraph 2 instruction from "are they climbing, plateauing, or declining between tiers?" to:

```
"Paragraph 2: Their trajectory and what it means WITHIN their current tier. Are they climbing toward the top of their tier, plateauing in the middle, or at risk of dropping? A 0.10 GPA improvement within a tier is significant even if it doesn't cross a boundary — frame it positively. Conversely, a 0.02 decline that crosses a boundary does NOT mean their world is ending."
```

#### Q5: Strengthen "firstGlance" Prompt (challengesGenerator.ts)
Replace the current vague "Candid and specific" instruction with:

```
"firstGlance": "2-3 sentences: What an AO NOTICES in the first 30 seconds scanning this transcript — focus on what jumps off the page VISUALLY (GPA trend direction, rigor level, grade drops, missing expected courses, unusual course sequence). Be unflinching. Example: 'First thing: a 3.30 overall with only 2 APs by junior year. For a CS applicant to selective schools, this is below the curve.' Do NOT write about character, work ethic, or potential — AOs cannot see those from a transcript."
```

#### Q6: Add tierImpact FROM→TO Requirement (challengesGenerator.ts)
Change the tierImpact instruction from "How this shifts their school positioning" to:

```
"tierImpact": "How this shifts their school positioning — MUST show FROM→TO movement with specific school names. Example: 'This drops you from the Highly Selective range (UCLA, Georgetown) to mid-Selective range (Boston U, Purdue).' NEVER just say 'This affects your positioning at X level' — always show the directional shift."
```

#### Q7: Enforce researchBacking Population (challengesGenerator.ts)
Add after the output format spec:

```
CRITICAL: Every challenge MUST have at least 1 entry in the researchBacking array using data from VERIFIED STATISTICS. Do NOT only inline statistics into issue/aoImpact text — you MUST ALSO populate the structured researchBacking array so the frontend can render citations separately.
```

#### Q8: Add Difficulty Transition Benchmarks (roadmapGenerator.ts)
Add to the user prompt after the performance data section:

```
DIFFICULTY TRANSITION BENCHMARKS (use these to calibrate expectedOutcome):
- Regular → Honors: typically -0.10 to -0.20 GPA impact
- Honors → AP: typically -0.25 to -0.40 GPA impact
- Regular → AP: typically -0.40 to -0.60 GPA impact
- AP → AP (same subject, higher level): typically -0.10 to -0.20 GPA impact
Calibrate the student's specific expectedOutcome using THEIR observed difficulty sensitivity pattern AND these benchmarks.
```

#### Q9: Add majorAlignment Score Interpretation (roadmapGenerator.ts)
Add to the output format spec for majorAlignment:

```
Score interpretation bands (MUST state which band applies in your assessment):
- 0-30: Major misalignment — seriously consider alternatives or radical curriculum change
- 30-55: Developing alignment — significant gaps to address, but salvageable
- 55-75: Moderate alignment — on track but missing key pieces
- 75-90: Strong alignment — minor gaps, strong foundation
- 90-100: Exceptional alignment — profile tells a clear major story
```

#### Q10: Constrain Priority Impact Levels (roadmapGenerator.ts)
Add to the output format spec:

```
CONSTRAINT: EXACTLY 1 priority may be 'critical'. The other 2 MUST be 'high' or 'moderate'. If everything is critical, nothing is — force yourself to identify the SINGLE most impactful action.
```

#### Q11: Increase Bottom Line Word Limit (bottomLineGenerator.ts)
Change `MAX 30 words` to `MAX 50 words` in the system prompt. 30 words forces an impossible tradeoff between specificity and completeness. 50 words allows meaningful synthesis while still being punchy.

#### Q12: Make "rating" Bullet Actionable (bottomLineGenerator.ts)
Change the rating instruction from "states the grade and one sentence of what it means" to:

```
"rating": "States the grade, names the corresponding tier, and states the ONE thing that would change the grade. Example: 'B+ (Very Good) — Selective tier. Moving to A- requires stronger AP STEM performance, where you currently average 3.2.' NEVER just restate the grade description."
```

#### Q13: Fix Research Generator AP/GPA Conflation (researchGenerator.ts)
The `studentContext` strings at lines 31-43 juxtapose class GPA with AP exam pass rates — the exact conflation the challenges generator forbids. Rewrite the context logic:

```typescript
// GOOD: Separate student performance from national statistics
if (studentGrade >= 3.7) {
  studentContext = `You earned ${studentGrade.toFixed(2)} in this course — strong performance at the AP level.`;
} else if (studentGrade >= 3.3) {
  studentContext = `You earned ${studentGrade.toFixed(2)} — solid AP-level performance.`;
} else if (studentGrade >= 3.0) {
  studentContext = `You earned ${studentGrade.toFixed(2)} — this was a stretch course for you, which is worth noting.`;
} else {
  studentContext = `You earned ${studentGrade.toFixed(2)} — this course was significantly challenging. See the Challenges section for context.`;
}
// National pass rate is presented separately in the table column — do NOT mix it into studentContext.
```

### Verification
After all changes:
1. Run `npx tsc --noEmit` — must be zero errors
2. Read through each modified prompt end-to-end and verify it's coherent (no contradictory instructions, no broken JSON format specs)
3. Tag every change with a comment `// Q{N}: {description}` at the insertion point

---

## TEAMMATE 2: Prompt Engineering — Activity Workshop

**You are a prompt engineering specialist.** Your job is to improve every LLM prompt in the Activity Workshop pipeline so outputs are more specific, more student-friendly, better calibrated, and produce genuinely useful teaching.

### Files You Own
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage0StoryDetectionService.ts` (456 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts` (845 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts` (2258 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage3PortfolioSynthesisService.ts` (674 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/stages/portfolioNarrativeService.ts` (685 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/portfolioScoringService.ts` (605 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/activityScoringService.ts` (810 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/descriptionScoringService.ts` (787 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/batchActivityAnalysisService.ts` (1171 lines)
- `src/services/portfolioStrategy/services/activityWorkshop/expertSystemPrompts.ts` (453 lines)

### Fix IDs and Exact Changes

#### A1: Improve Stage 0 Archetype Fallback (stage0StoryDetectionService.ts)
Find the archetype validation that defaults to `'explorer'` when unrecognized. Change the default to use a simple heuristic:

```typescript
// A1: Better fallback than always 'explorer'
const defaultArchetype = activities.some(a =>
  a.position?.toLowerCase().includes('founder') || a.position?.toLowerCase().includes('president')
) ? 'leader'
  : activities.some(a => a.type?.toLowerCase().includes('research') || a.type?.toLowerCase().includes('academic'))
  ? 'scholar'
  : 'explorer';
```

#### A2: Strengthen Stage 1 Story Adjustment Constraints (stage1ContextAwareAnalysisService.ts)
Find the story adjustment prompt. Add after the tier adjustment rules:

```
CALIBRATION RULES:
- A tier adjustment is a BIG deal. Only adjust when the story context provides CLEAR, SPECIFIC evidence that the standard tier doesn't capture the full picture.
- Work obligations (20+ hours/week) justify +1 tier adjustment for PARTICIPATION activities, but NOT for quality of output.
- First-generation status justifies +1 for ACCESS to resources, but NOT for the quality of work done with those resources.
- Geographic constraints justify +1 for limited OPPORTUNITY, but the student's actual achievements must still be evaluated on merit.
- NEVER adjust more than 1 tier. NEVER adjust a Tier 1 activity up (it's already the top).
- When in doubt, DO NOT adjust. The scoring system handles nuance better than a blunt tier bump.
```

#### A3: Improve Teaching Prompt Anti-Generic Instructions (stage2ConditionalTeachingService.ts)
Find the main teaching system prompt. Add these constraints:

```
ANTI-GENERIC CHECKLIST (apply to every piece of teaching you write):
1. Could this feedback apply to ANY student? If yes, rewrite with THIS student's specific data.
2. Does the improvement suggestion include a concrete BEFORE/AFTER example using THEIR actual description text? If not, add one.
3. Does the celebration reference a SPECIFIC detail from their activity, not just "great leadership"?
4. Is the tier explanation grounded in what SPECIFICALLY makes this a Tier [N] activity vs Tier [N±1]?

BANNED PHRASES (never use these — they are meaningless filler):
- "Great job!" / "Well done!" / "Impressive!"
- "Consider adding more detail"
- "This shows your dedication"
- "Think about how you can..."
- "This is a strong activity" (without saying WHY)
```

#### A4: Improve Stage 3 Harvard Scale Descriptions (stage3PortfolioSynthesisService.ts)
The current HARVARD_SCALE object has brief 1-line descriptions. Expand to include concrete examples so the LLM can calibrate:

```typescript
const HARVARD_SCALE = {
  1: 'Exceptional (top 1%): National/international distinction. Examples: Intel Science Talent Search finalist, nationally ranked debater, published researcher, recruited Division I athlete, professional-level musician.',
  2: 'Outstanding (top 5%): Strong regional/state impact with clear spike. Examples: State science fair winner, regional debate champion, founded nonprofit with measurable community impact, varsity captain with all-state recognition.',
  3: 'Good (top 15%): Meaningful local/school impact with developing focus. Examples: Student body president, editor-in-chief of school paper, Eagle Scout, varsity starter with team leadership, club founder with sustained growth.',
  4: 'Average (top 40%): Solid participation with some distinction. Examples: Active club member with one leadership role, JV athlete, volunteer with 100+ hours, academic team participant.',
  5: 'Below Average: Limited engagement or impact. Examples: 2-3 activities with minimal involvement, no leadership, sporadic attendance.',
  6: 'Weak: Minimal meaningful activity. Examples: Only required activities, no voluntary engagement, possible padding.',
};
```

#### A5: Add Narrative Service Anti-Archetype Specificity (portfolioNarrativeService.ts)
The narrative service already has anti-archetype philosophy. Strengthen with:

```
When generating the story pitch, follow the ANTI-ARCHETYPE RULE:
- WRONG: "Sarah is a natural leader and community builder."
- RIGHT: "Sarah built a tutoring program from 3 students to 47 by converting her family's restaurant storage room into a study space — leadership born from necessity, not ambition."
- The pitch must include at least ONE specific detail that could only be true of THIS student.
- NEVER use archetype labels (leader, innovator, scholar) as the pitch — use them as underlying structure only.
```

#### A6: Improve Scoring Prompt Tier Calibration (activityScoringService.ts)
Find the tier assessment section of the scoring prompt. Add calibration examples:

```
TIER CALIBRATION EXAMPLES (use these to anchor your assessments):
- Tier 1 Example: "Founded coding bootcamp that trained 200+ underserved students, featured in local news, invited to present at state education conference" → National/regional impact, sustained commitment, recognized externally
- Tier 2 Example: "Captain of varsity debate team, won 3 regional tournaments, mentored JV debaters" → Clear spike in one area with external recognition at regional level
- Tier 3 Example: "Vice President of Science Club, organized monthly speaker events, member for 3 years" → School-level leadership and commitment but no external recognition
- Tier 4 Example: "Member of Spanish Club, participated in cultural events" → Participation without distinction or progression

COMMON MISCALIBRATION: Activities involving disadvantaged backgrounds or overcoming hardship get inflated tiers. Evaluate the ACHIEVEMENT, not the circumstances. Context matters for teaching, but tier assessment must be based on demonstrated impact and recognition.
```

#### A7: Strengthen Description Scoring Rubric (descriptionScoringService.ts)
Find the scoring rubric. Add this constraint to the "Differentiation Signal" dimension:

```
DIFFERENTIATION SIGNAL — CALIBRATION:
- 9-10: Uses language that could ONLY describe THIS person's experience. Contains a "fingerprint moment" — a detail so specific no other applicant could write it.
- 7-8: Mostly specific but 1-2 phrases could apply to anyone in this role.
- 5-6: Mix of specific and generic. The description shows knowledge but not personality.
- 3-4: Mostly generic. Could be any club president / team member / volunteer.
- 1-2: Completely interchangeable. Zero unique details.

EXAMPLE OF "FINGERPRINT MOMENT":
Instead of "Managed team of 15 volunteers" → "Recruited 15 volunteers from 3 different churches by personally pitching at Sunday services, then tracked retention through a spreadsheet I built after losing 5 volunteers in week 2"
```

### Verification
After all changes:
1. Run `npx tsc --noEmit` — must be zero errors
2. Read through each modified prompt end-to-end — verify coherence
3. Tag every change with `// A{N}: {description}`

---

## TEAMMATE 3: Validation & Post-Processing

**You are a validation specialist.** Your job is to strengthen the post-processing, cross-section validation, and output quality checks across both systems.

### Files You Own
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/validation/postProcessing.ts` (155 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/orchestrator.ts` (140 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/context/contextAssembly.ts` (201 lines)
- `src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/context/tierCalibration.ts` (126 lines)

### Fix IDs and Exact Changes

#### V1: Expand Conflation Regex (postProcessing.ts)
The current regexes miss common LLM phrasings. Replace the `examLanguage` and `classGPA` patterns:

```typescript
// V1: Expanded conflation detection — catches more LLM phrasing patterns
const examLanguage = /test.?taker|scores?\s+[1-5]|scores?\s+3|pass\s*rate|passing\s+score|exam\s+performance|AP\s+exam|national.+pass|percent.+score|nationwide.+score/i;
const classGPA = /(earned|received|got|achieved|your)\s+(a\s+)?[0-9]\.[0-9]|GPA\s+of\s+[0-9]\.[0-9]|[0-9]\.[0-9]{1,2}\s+in\s+the\s+(class|course)|their\s+[0-9]\.[0-9]|you\s+earned/i;
```

#### V2: Fix Full-Field Conflation Fallback (postProcessing.ts)
When ALL sentences in a field are conflated, `stripConflatedSentences` returns the original text unchanged. Fix:

```typescript
function stripConflatedSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const cleaned = sentences.filter(s => !hasAPGPAConflation(s));
  if (cleaned.length === 0) {
    // V2: All sentences conflated — return a safe replacement instead of the original
    return '[This analysis contained a statistical comparison error and was simplified. See Research Context for verified data.]';
  }
  return cleaned.join(' ');
}
```

#### V3: Make Stat Dedup Actually Fix (postProcessing.ts)
Currently stat dedup only flags. Make it strip the duplicate stat from later challenges:

```typescript
// V3: Strip duplicate stats from later challenges (keep first occurrence)
for (const [pct, challengeIndices] of statUsage.entries()) {
  if (challengeIndices.length > 1) {
    issues.push({
      type: 'stat_duplication',
      severity: 'warning',
      section: `challenges[${challengeIndices.join(',')}]`,
      description: `Statistic "${pct}" cited in ${challengeIndices.length} different challenges — removed from later occurrences`,
      action: 'stripped',
    });
    // Remove the duplicate stat from all challenges after the first
    for (let k = 1; k < challengeIndices.length; k++) {
      const idx = challengeIndices[k];
      const challenge = cleanedChallenges.challenges[idx];
      challenge.issue = stripPercentage(challenge.issue, pct);
      challenge.aoImpact = stripPercentage(challenge.aoImpact, pct);
      challenge.tierImpact = stripPercentage(challenge.tierImpact, pct);
    }
  }
}
```

Add the helper:
```typescript
function stripPercentage(text: string, pct: string): string {
  // Remove sentences containing the specific percentage
  const sentences = text.split(/(?<=[.!?])\s+/);
  const cleaned = sentences.filter(s => !s.includes(pct));
  return cleaned.length > 0 ? cleaned.join(' ') : text;
}
```

#### V4: Add Cross-Section Consistency Check (orchestrator.ts)
After the `validateReportOutput` call in the orchestrator, add a lightweight consistency check:

```typescript
// V4: Cross-section consistency validation
function validateCrossSectionConsistency(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  roadmap: StrategicRoadmapSection
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check: roadmap doesn't recommend courses that challenges warns about
  const challengeSubjects = challenges.challenges.map(c => c.title.toLowerCase());
  for (const rec of roadmap.courseStrategy.recommended) {
    const courseLower = rec.course.toLowerCase();
    for (const challengeTitle of challengeSubjects) {
      if (courseLower.includes(challengeTitle.split(' ')[0]) && rec.risk === 'low') {
        issues.push({
          type: 'cross_section_contradiction' as any,
          severity: 'warning',
          section: `roadmap.courseStrategy.recommended: ${rec.course}`,
          description: `Course recommended as "low risk" but related challenge "${challengeTitle}" exists — consider marking as "medium" risk`,
          action: 'flagged',
        });
      }
    }
  }

  // Check: all priorities marked 'critical' — max 1 should be critical
  const criticalCount = roadmap.priorities.filter(p => p.impact === 'critical').length;
  if (criticalCount > 1) {
    issues.push({
      type: 'cross_section_contradiction' as any,
      severity: 'warning',
      section: 'roadmap.priorities',
      description: `${criticalCount} priorities marked 'critical' — only 1 should be critical for clear prioritization`,
      action: 'flagged',
    });
  }

  return issues;
}
```

Call this after `validateReportOutput` in the orchestrator and log any issues.

#### V5: Soften Tier Boundary Cliff Edges (tierCalibration.ts)
The `getTierForGPA` function has hard cliffs at 3.90/3.80/3.60/3.20. Add boundary softening:

```typescript
export function getTierForGPA(gpa: number): TierInfo & { nearBoundary?: string } {
  const tiers = COLLEGE_TIER_BENCHMARKS;
  // V5: Detect near-boundary positions (within 0.03 of a threshold)
  const BOUNDARY_TOLERANCE = 0.03;

  if (gpa >= 3.90) return tiers[0]; // Ivy/Elite
  if (gpa >= 3.90 - BOUNDARY_TOLERANCE) return { ...tiers[1], nearBoundary: `Just ${(3.90 - gpa).toFixed(2)} points below Ivy/Elite threshold — at the very top of Highly Selective` };
  if (gpa >= 3.80) return tiers[1]; // Highly Selective
  if (gpa >= 3.80 - BOUNDARY_TOLERANCE) return { ...tiers[2], nearBoundary: `Just ${(3.80 - gpa).toFixed(2)} points below Highly Selective — at the top of Selective range` };
  if (gpa >= 3.60) return tiers[2]; // Selective
  if (gpa >= 3.60 - BOUNDARY_TOLERANCE) return { ...tiers[3], nearBoundary: `Just ${(3.60 - gpa).toFixed(2)} points below Selective — at the top of Competitive range` };
  if (gpa >= 3.20) return tiers[3]; // Competitive
  return tiers[4]; // Accessible
}
```

Then update the `calculateTierPosition` function to include `nearBoundary` in the `gpaPosition` output when present.

#### V6: Fix Haiku Cost Tracking (orchestrator.ts)
The cost accumulation uses Sonnet pricing for all calls including the Haiku bottom line. Fix:

```typescript
// V6: Model-aware cost tracking
const trackUsage = (model: string, inp: number, out: number) => {
  accumulatedTokens.input += inp;
  accumulatedTokens.output += out;
  if (model.includes('haiku')) {
    // Haiku pricing: $0.80/M input, $4/M output
    accumulatedCost += (inp / 1_000_000) * 0.80 + (out / 1_000_000) * 4;
  } else {
    // Sonnet pricing: $3/M input, $15/M output
    accumulatedCost += (inp / 1_000_000) * 3 + (out / 1_000_000) * 15;
  }
};
```

Update the generators to pass their model name when calling `trackUsage`.

#### V7: Fix Context Assembly School Data (contextAssembly.ts)
The planning advice input hardcodes empty arrays. Pass through what we have:

```typescript
schoolContext: {
  type: input.schoolContext.type,
  apCoursesAvailable: input.schoolContext.apCoursesAvailable
    ? Array.isArray(input.schoolContext.apCoursesAvailable)
      ? input.schoolContext.apCoursesAvailable
      : []
    : [],
  honorsCoursesAvailable: [],
  dualEnrollmentAvailable: false,
},
```

### Verification
After all changes:
1. Run `npx tsc --noEmit` — must be zero errors
2. Read through the full orchestrator pipeline flow and verify all validations chain correctly
3. Tag every change with `// V{N}: {description}`

---

## TEAMMATE 4: Test Coverage & Output Verification

**You are a test engineer.** Your job is to add meaningful output quality assertions to the existing test files. The current tests check structure and length but NOT accuracy, deduplication, or quality.

### Files You Own
- `tests/test-deep-academic-report.ts`
- `tests/generate-deep-report-output.ts`
- `tests/test-full-pipeline-e2e-output.ts`

### Fix IDs and Exact Changes

#### T1: Add Bottom Line Dedup Check (test-deep-academic-report.ts)
After the existing bottom line structure checks, add:

```typescript
// T1: Bottom line should NOT be verbatim copy of section content
const blStrength = report.bottomLine.biggestStrength.toLowerCase();
const blRisk = report.bottomLine.biggestRisk.toLowerCase();

for (const strength of report.academicIdentity.notableStrengths) {
  const sInsight = strength.insight.toLowerCase();
  // Allow partial overlap but flag >80% character overlap
  const overlapRatio = longestCommonSubstring(blStrength, sInsight).length / Math.min(blStrength.length, sInsight.length);
  console.assert(overlapRatio < 0.8, `[QUALITY] Bottom line biggestStrength has ${(overlapRatio * 100).toFixed(0)}% overlap with notable strength "${strength.subject}" — should be a synthesis, not a copy`);
}

for (const challenge of report.challengesAndReality.challenges) {
  const cImpact = challenge.tierImpact.toLowerCase();
  const overlapRatio = longestCommonSubstring(blRisk, cImpact).length / Math.min(blRisk.length, cImpact.length);
  console.assert(overlapRatio < 0.8, `[QUALITY] Bottom line biggestRisk has ${(overlapRatio * 100).toFixed(0)}% overlap with challenge "${challenge.title}" tierImpact — should be a synthesis, not a copy`);
}
```

Add the helper:
```typescript
function longestCommonSubstring(a: string, b: string): string {
  let longest = '';
  for (let i = 0; i < a.length; i++) {
    for (let len = 1; len <= a.length - i; len++) {
      const sub = a.substring(i, i + len);
      if (b.includes(sub) && sub.length > longest.length) longest = sub;
      if (!b.includes(sub)) break;
    }
  }
  return longest;
}
```

#### T2: Add AP/GPA Conflation Detection (test-deep-academic-report.ts)
After the challenges checks, add:

```typescript
// T2: No AP exam rate / class GPA conflation in challenges
const conflationRegex = /(test.?taker|pass\s*rate|score\s+3|nationwide.+score).{0,100}(earned|received|got|GPA|[0-9]\.[0-9]{1,2}\s+in\s+the\s+class)/i;
const conflationRegex2 = /(earned|you\s+earned|GPA\s+of)\s+[0-9]\.[0-9].{0,100}(test.?taker|pass\s*rate|score\s+3)/i;

for (const challenge of report.challengesAndReality.challenges) {
  const fullText = `${challenge.issue} ${challenge.aoImpact} ${challenge.tierImpact}`;
  const hasConflation = conflationRegex.test(fullText) || conflationRegex2.test(fullText);
  console.assert(!hasConflation, `[QUALITY] Challenge "${challenge.title}" may conflate AP exam pass rates with class GPA — these are different metrics on different scales`);
}
```

#### T3: Add Cross-Section Repetition Check (test-deep-academic-report.ts)
Add:

```typescript
// T3: Check for excessive repetition of tier positioning across sections
const tierMentions: string[] = [];
const tierRegex = /(ivy|elite|highly selective|selective|competitive|accessible)/gi;

const allText = JSON.stringify(report);
let match;
while ((match = tierRegex.exec(allText)) !== null) {
  tierMentions.push(match[1].toLowerCase());
}

// Each specific tier should appear at most 4 times across the full report
const tierCounts = tierMentions.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
for (const [tier, count] of Object.entries(tierCounts)) {
  if (count > 5) {
    console.warn(`[QUALITY] Tier "${tier}" appears ${count} times across the report — consider reducing repetition`);
  }
}
```

#### T4: Add Challenge Major-Relevance Check (test-deep-academic-report.ts)
Add:

```typescript
// T4: At least 2 of 3 challenges should be relevant to intended major
if (input.intendedMajor) {
  const majorLower = input.intendedMajor.toLowerCase();
  const majorKeywords: Record<string, string[]> = {
    'computer science': ['cs', 'computer', 'stem', 'math', 'science', 'physics', 'programming', 'data'],
    'engineering': ['engineering', 'stem', 'math', 'physics', 'science', 'technical'],
    'pre-med': ['science', 'biology', 'chemistry', 'stem', 'research', 'medical'],
    'business': ['business', 'economics', 'math', 'leadership', 'entrepreneurship'],
  };

  const keywords = Object.entries(majorKeywords).find(([key]) => majorLower.includes(key))?.[1] || [];

  if (keywords.length > 0) {
    let relevantCount = 0;
    for (const challenge of report.challengesAndReality.challenges) {
      const challengeText = `${challenge.title} ${challenge.issue} ${challenge.aoImpact}`.toLowerCase();
      if (keywords.some(kw => challengeText.includes(kw))) {
        relevantCount++;
      }
    }
    console.assert(relevantCount >= 2, `[QUALITY] Only ${relevantCount}/${report.challengesAndReality.challenges.length} challenges appear relevant to intended major "${input.intendedMajor}" — challenges should prioritize major-relevant concerns`);
  }
}
```

#### T5: Add Activity Workshop Teaching Quality Checks (test-full-pipeline-e2e-output.ts)
After the existing Stage 2 checks, add:

```typescript
// T5: Teaching quality — no generic celebrations or improvements
const genericPhrases = ['great job', 'well done', 'impressive', 'consider adding more detail', 'shows your dedication', 'think about how you can', 'this is a strong activity'];

for (const teaching of result.stage2.teachingDelivered) {
  const fullTeachingText = JSON.stringify(teaching).toLowerCase();
  for (const phrase of genericPhrases) {
    console.assert(!fullTeachingText.includes(phrase), `[QUALITY] Teaching for activity "${teaching.activityId}" contains generic phrase "${phrase}" — teaching should be specific to this student's activity`);
  }

  // Every improvement should include a before/after or specific example
  if (teaching.improvements && teaching.improvements.length > 0) {
    for (const imp of teaching.improvements) {
      const hasExample = imp.fix?.includes('"') || imp.fix?.includes('→') || imp.fix?.includes('before') || imp.fix?.includes('after') || imp.fix?.includes('Instead');
      console.assert(hasExample, `[QUALITY] Improvement "${imp.issue}" for activity "${teaching.activityId}" lacks a concrete example or before/after — add one`);
    }
  }
}
```

#### T6: Add Scoring Calibration Checks (test-full-pipeline-e2e-output.ts)
After the scoring checks, add:

```typescript
// T6: Scoring calibration — Harvard scale should be consistent with overall score
if (result.scoring?.portfolioRubric) {
  const rubric = result.scoring.portfolioRubric;
  const overallScore = rubric.overallScore.total;
  const harvardRating = rubric.harvardScale.rating;

  // Harvard scale mapping: 1=9-10, 2=7.5-8.9, 3=6-7.4, 4=4-5.9, 5=2.5-3.9, 6=1-2.4
  const expectedHarvard = overallScore >= 9 ? 1 : overallScore >= 7.5 ? 2 : overallScore >= 6 ? 3 : overallScore >= 4 ? 4 : overallScore >= 2.5 ? 5 : 6;

  console.assert(Math.abs(harvardRating - expectedHarvard) <= 1, `[CALIBRATION] Harvard rating ${harvardRating} inconsistent with overall score ${overallScore} (expected ~${expectedHarvard}). Off by more than 1 point.`);

  // Weighted formula check
  const b = rubric.breakdown;
  const expectedTotal = (
    b.tierDistribution.score * 0.25 +
    b.spikeDetection.score * 0.25 +
    b.coherence.score * 0.20 +
    b.majorAlignment.score * 0.15 +
    b.presentationQuality.score * 0.15
  );
  console.assert(Math.abs(overallScore - expectedTotal) < 1.5, `[CALIBRATION] Overall score ${overallScore} differs from weighted formula ${expectedTotal.toFixed(1)} by more than 1.5 points`);
}
```

### Verification
After all changes:
1. Run `npx tsc --noEmit` — must be zero errors
2. Do NOT run the E2E tests (they cost money and take time). Just verify the test file compiles.
3. Tag every change with `// T{N}: {description}`

---

## VERIFICATION CHECKLIST (For Human Review)

After all 4 teammates complete:

1. **TypeScript compilation**: `npx tsc --noEmit` must show zero errors
2. **No broken JSON format specs**: Each prompt that requests JSON output should have its format spec consistent with the changes
3. **Tag audit**: Every change should have a `// Q{N}`, `// A{N}`, `// V{N}`, or `// T{N}` comment
4. **Prompt coherence**: No prompt should have contradictory instructions after edits
5. **No regressions**: Changes should be additive (strengthening constraints, expanding validation) — not removing existing safeguards

### Summary of All Fix IDs

| ID | Description | File(s) | Teammate |
|----|-------------|---------|----------|
| Q1 | Strengthen tier illustration disclaimer | identityGenerator.ts | 1 |
| Q2 | Add Uplift grade weighting rubric | identityGenerator.ts | 1 |
| Q3 | Fix notable strengths majorRelevance | identityGenerator.ts | 1 |
| Q4 | Fix trajectory framing | identityGenerator.ts | 1 |
| Q5 | Strengthen firstGlance prompt | challengesGenerator.ts | 1 |
| Q6 | Add tierImpact FROM→TO | challengesGenerator.ts | 1 |
| Q7 | Enforce researchBacking population | challengesGenerator.ts | 1 |
| Q8 | Add difficulty transition benchmarks | roadmapGenerator.ts | 1 |
| Q9 | Add majorAlignment interpretation | roadmapGenerator.ts | 1 |
| Q10 | Constrain priority impact levels | roadmapGenerator.ts | 1 |
| Q11 | Increase bottom line word limit | bottomLineGenerator.ts | 1 |
| Q12 | Make rating bullet actionable | bottomLineGenerator.ts | 1 |
| Q13 | Fix research AP/GPA conflation | researchGenerator.ts | 1 |
| A1 | Improve Stage 0 archetype fallback | stage0StoryDetectionService.ts | 2 |
| A2 | Strengthen story adjustment constraints | stage1ContextAwareAnalysisService.ts | 2 |
| A3 | Anti-generic teaching instructions | stage2ConditionalTeachingService.ts | 2 |
| A4 | Expand Harvard scale descriptions | stage3PortfolioSynthesisService.ts | 2 |
| A5 | Anti-archetype narrative specificity | portfolioNarrativeService.ts | 2 |
| A6 | Scoring tier calibration examples | activityScoringService.ts | 2 |
| A7 | Description differentiation calibration | descriptionScoringService.ts | 2 |
| V1 | Expand conflation regex | postProcessing.ts | 3 |
| V2 | Fix full-field conflation fallback | postProcessing.ts | 3 |
| V3 | Make stat dedup fix (not just flag) | postProcessing.ts | 3 |
| V4 | Add cross-section consistency check | orchestrator.ts | 3 |
| V5 | Soften tier boundary cliff edges | tierCalibration.ts | 3 |
| V6 | Fix Haiku cost tracking | orchestrator.ts | 3 |
| V7 | Fix context assembly school data | contextAssembly.ts | 3 |
| T1 | Bottom line dedup check | test-deep-academic-report.ts | 4 |
| T2 | AP/GPA conflation detection test | test-deep-academic-report.ts | 4 |
| T3 | Cross-section repetition check | test-deep-academic-report.ts | 4 |
| T4 | Challenge major-relevance check | test-deep-academic-report.ts | 4 |
| T5 | Teaching quality checks | test-full-pipeline-e2e-output.ts | 4 |
| T6 | Scoring calibration checks | test-full-pipeline-e2e-output.ts | 4 |
