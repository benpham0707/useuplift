# Round 8 Design Contract — Personalized Revision Planning

**Version:** 1.0 — 2026-04-17
**Status:** Contract (binding for Round 8 implementation). Implementation blocked on P0 PR merge (see [ROUND_7_HARDENING_PLAN.md](./ROUND_7_HARDENING_PLAN.md)).
**Source context:** [docs/ROUND_7_COMPREHENSIVE_AUDIT.md](./ROUND_7_COMPREHENSIVE_AUDIT.md) §Round 8 Readiness Assessment.
**Extensibility protocol:** [docs/SIGNAL_REGISTRATION_PROTOCOL.md](./SIGNAL_REGISTRATION_PROTOCOL.md).

---

## 0 — Purpose

Round 8 consumes 7a (historical), 7b (analytical), and 7c (strategic) signals plus coaching state to produce **personalized, per-draft revision plans**. The audit identified that, as currently scoped, Round 8 would inherit and compound five architectural defects of Round 7. This contract defines the invariants Round 8 MUST obey so it lands as a first-class capability, not more prompt content.

**If Round 8 is built in violation of this contract, it should not merge.**

---

## 1 — Output shape (binding)

### 1.1 RevisionPlan is a first-class object, not prose

```ts
// src/services/essayIntelligence/revisionPlanning/types.ts (new file)
export interface RevisionPlan {
  planId: string;              // UUID, stable across plan versions for the same draft
  essayId: string;              // FK to essays(id)
  draftVersion: number;         // monotonic; matches EssayProfile.metadata.draftVersion
  priorities: RevisionPriority[]; // max 3, ordered by impact
  rationale: string;            // ≤ 200 chars — "what this plan is trying to achieve"
  improvementPhase: ImprovementPhase;  // the phase this plan is calibrated for
  generatedAt: string;          // ISO 8601
  generatedBy: { model: 'haiku' | 'sonnet'; cost: number; cacheHit: boolean };
  consumedSignals: SignalReference[];  // enforces capability-not-inventory
  supersededPlanId: string | null;     // lineage when regenerated on edit
}

export interface RevisionPriority {
  id: string;                   // stable ID within the plan
  rank: 1 | 2 | 3;
  studentFacing: {
    oneLine: string;            // student language — "Your grandmother's hands moment tells instead of shows"
    whatToTry: string;          // 1-2 sentences, concrete move — "Rewrite P3 so we see her hands before we hear what she said"
    where: { paragraphIndex: number; sentenceRange?: [number, number] } | 'whole_essay';
  };
  analyticJustification: {
    signalName: string;         // MUST match a registered signal — see SIGNAL_REGISTRATION_PROTOCOL.md
    signalValue: unknown;       // structured payload from the profile
    quote: string | null;       // if applicable, exact quote from essay (evidence grounding)
    confidence: 'high' | 'medium' | 'low';
  };
  category: 'emotional_stakes' | 'evidence_anchoring' | 'craft_compression' |
            'admissions_framing' | 'thematic_coherence' | 'voice_authenticity' |
            'narrative_structure' | 'scene_grounding' | 'character_presence';
  estimatedEffort: 'single_sentence' | 'paragraph_rewrite' | 'structural';
}

export interface SignalReference {
  signalName: string;           // matches registered signal
  registryKey: string;          // EssayProfile path, e.g. "aoFirstRead.archetypePositioning"
  referencedAt: string;         // ISO 8601 — when the planner read it
  influence: 'primary' | 'corroborating';
}
```

### 1.2 The `consumedSignals` array is non-cosmetic

Every `RevisionPriority.analyticJustification.signalName` MUST appear in `consumedSignals`. The planner cannot cite a signal it didn't read. Enforced at build by `validateRevisionPlan(plan, profile) → Result<void, ValidationError[]>`.

This dissolves D3-H1 ("signals are inventory not capability") for Round 8: the plan is structurally incapable of ignoring a signal while claiming to have consumed it.

### 1.3 Priorities capped at 3

Hard cap. Justification: D3-H2 prompt overload + UX research showing 4+ parallel priorities cause paralysis. If the planner emits >3, validator truncates and logs a warning.

---

## 2 — Persistence (binding)

### 2.1 Separate table, not another blob field

```sql
-- supabase/migrations/2026MMDDHHMMSS_round8_revision_plans.sql
create table essay_revision_plans (
  plan_id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references essays(id) on delete cascade,
  clerk_user_id text not null,  -- RLS key; mirrors CLAUDE.md convention
  draft_version integer not null,
  plan_data jsonb not null,      -- full RevisionPlan object
  superseded_by uuid references essay_revision_plans(plan_id),
  created_at timestamptz not null default now(),
  -- covering index for "latest plan for this draft"
  unique (essay_id, draft_version, created_at)
);

create index idx_revision_plans_essay_draft on essay_revision_plans(essay_id, draft_version desc);
create index idx_revision_plans_user on essay_revision_plans(clerk_user_id);

alter table essay_revision_plans enable row level security;
create policy "users_see_own_plans" on essay_revision_plans
  for all using (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### 2.2 Rationale for separate table

- Profile JSONB already observed at 180-470KB (D4-M1). Appending plans compounds. At 3 plans/draft × 5 drafts/essay × 2KB/plan, that's +30KB per essay minimum in the blob.
- Queryable lifecycle independent of profile — "show me the user's last 10 plans across all essays" does not require decoding a 400KB JSONB.
- Plan history is naturally append-only + versioned; dedicated table matches the access pattern.

### 2.3 Access discipline (coordinator extension)

Round 8 adds two coordinator methods:

```ts
class EssayProfileCoordinator {
  // ... existing methods ...

  async applyRevisionPlan(plan: RevisionPlan): Promise<void> {
    // Validate
    const validation = validateRevisionPlan(plan, this.profile);
    if (!validation.ok) throw new RevisionPlanValidationError(validation.errors);

    // Persist to essay_revision_plans (NOT to profile_cache)
    await this.revisionPlanStore.save(plan);

    // Update latestPlanId pointer on profile (small, indexed lookup)
    this.profile.metadata.latestRevisionPlanId = plan.planId;
    this.bumpWriteVersion();
    this.recordMutation({ method: 'applyRevisionPlan', planId: plan.planId });
  }

  async getLatestRevisionPlan(): Promise<RevisionPlan | null> {
    if (!this.profile.metadata.latestRevisionPlanId) return null;
    return this.revisionPlanStore.load(this.profile.metadata.latestRevisionPlanId);
  }
}
```

**EssayProfile gets exactly one new field:** `metadata.latestRevisionPlanId: string | null`. The plan itself lives in the dedicated table. This prevents D4-M1 compounding.

### 2.4 Persistence invariant (test)

Integration test:
1. Generate plan → persist → reload via `getLatestRevisionPlan` → deep-equal.
2. Regenerate plan (edit triggers regen) → old plan's `superseded_by` set to new plan.planId → history chain queryable.
3. RLS test: user B cannot SELECT user A's plans.

---

## 3 — Delivery architecture (binding)

### 3.1 Frontend renders the plan directly; coach sees a compressed summary

**Anti-pattern we reject:** Inject the full plan into the coach system prompt and expect Sonnet to render it.

**Why we reject it:** Solves D3-H2 (prompt overload). Solves D6-M4 (phase filter inconsistency). Provides UX affordances (click-to-jump to paragraph, status checkbox per priority) that prose-in-chat cannot. Enables plan regeneration independently of coach turn.

**Architecture:**

```
┌──────────────────────────────────────────────────────┐
│ Client                                               │
│  ├── <RevisionPlanPanel>  ← renders RevisionPlan     │
│  │    - list of RevisionPriority cards               │
│  │    - click-to-scroll-to-paragraph                 │
│  │    - per-priority "mark addressed" checkbox       │
│  └── <CoachChat>  ← unchanged                        │
└──────────────────────────────────────────────────────┘
           ↑                            ↑
           │                            │
  GET /essay-revision-plan/:id     POST /essay-coaching/respond
           │                            │
           ▼                            ▼
    Returns full RevisionPlan   Coach receives compressed plan summary
                                (≤ 200 tokens) as one section of system
                                prompt. NOT the full plan.
```

### 3.2 Compressed plan summary for coach

```ts
function compressPlanForCoach(plan: RevisionPlan): string {
  // ≤ 200 tokens target; enforced by test.
  const lines = plan.priorities.map((p, i) =>
    `${i+1}. ${p.studentFacing.oneLine} (${p.category}, P${p.where === 'whole_essay' ? '*' : p.where.paragraphIndex+1})`
  );
  return [
    '=== ACTIVE REVISION PLAN ===',
    `Phase: ${plan.improvementPhase} · Generated ${plan.generatedAt}`,
    ...lines,
    `Plan rationale: ${plan.rationale}`,
  ].join('\n');
}
```

Coach uses this as its **frame** — aware of the plan, can reference it, but not responsible for rendering it. Reduces coach's system prompt by 1-2k tokens vs full-plan injection.

---

## 4 — Generation (binding)

### 4.1 Haiku-first, Sonnet-on-conflict

```ts
async function generateRevisionPlan(profile: EssayProfile): Promise<RevisionPlan> {
  // Short-circuit: distinction phase with clean profile returns empty plan
  if (profile.improvementPhase === 'distinction' && !hasSalientSignals(profile)) {
    return emptyPlan(profile);  // no LLM call
  }

  // First pass: Haiku planner
  const haikuResult = await runHaikuPlanner(profile);

  // Consistency check: do signals contradict?
  const conflicts = detectSignalConflicts(profile);
  if (conflicts.length > 0) {
    // Escalate to Sonnet for tiebreaker reasoning
    return await runSonnetPlannerWithConflicts(profile, haikuResult, conflicts);
  }

  return haikuResult;
}
```

### 4.2 Signal conflict detection

Examples from the audit (D3-M1):
- `strongestBreakoutDimension === 'claim'` AND `claimEarnednessMap[X].verdict === 'UNEARNED'`
- `archetypeDistance.band === 'edging_out'` AND `clichéFlags.length >= 2`
- `voiceEvolution.stabilityTrend === 'strengthening'` AND `rhetoricalInventory.diversityScore < 0.3`

`detectSignalConflicts(profile) → ConflictReport[]`. Pure code, no LLM. If non-empty, escalate.

### 4.3 Cost budget (binding)

| Path | Budget | Test |
|------|--------|------|
| Empty plan (short-circuit) | $0 | Unit: no LLM call |
| Haiku-only | ≤ $0.03 | Cost-budget test |
| Haiku + Sonnet escalation | ≤ $0.15 | Cost-budget test |

Budget tests ship with the Round 8 PR. Ceilings enforced; test fails if exceeded.

### 4.4 Feature flag

```ts
const ROUND_8_ENABLED = process.env.UPLIFT_ROUND_8_REVISION_PLAN === 'true';
```

Ship with flag off in production for first week. Toggle on for internal users, measure conflict-escalation rate, plan-regeneration rate, student-thumbs-up on priorities. Then roll out.

---

## 5 — Lifecycle (binding)

### 5.1 Plans are versioned per draft

`draftVersion` monotonic. On edit:

1. `reanalysisOrchestrator` runs focused/comprehensive analysis.
2. After analysis completes, check whether plan regen is warranted:
   - Any P0 priority's referenced signal changed significantly? → regen.
   - Any priority's `where.paragraphIndex` now out of bounds (structural edit)? → regen.
   - Analysis mode was `focused` and only touched unrelated paragraphs? → keep plan.
3. If regen: call `generateRevisionPlan`, persist new plan with `supersededPlanId = oldPlan.planId`.
4. If keep: `latestRevisionPlanId` unchanged, plan continues to apply.

### 5.2 "Did the revision land?" feedback loop

When a priority's `where` paragraph is edited AND the referenced signal's new value differs from its prior value (e.g., claim moved from UNEARNED → MODERATELY_EARNED), the plan's priority is marked `addressed: true`. This closes the audit's D5 concern about revision acknowledgment.

Schema extension:
```ts
interface RevisionPriority {
  // ... existing fields ...
  addressed: boolean;
  addressedAt: string | null;
  addressmentEvidence: { priorSignalValue: unknown; newSignalValue: unknown } | null;
}
```

### 5.3 Stale plan on structural edit

If a structural edit (paragraph insert/delete/reorder) invalidates paragraph indices in the plan, the plan is marked `stale: true` and frontend hides the stale-indexed priorities until regen completes.

---

## 6 — Signal translation (binding)

### 6.1 Two-tier: deterministic first, LLM fallback

**Tier 1 — deterministic mapping table.** Covers the known 7b/7c signal shapes:

```ts
// src/services/essayIntelligence/revisionPlanning/signalTranslator.ts
const DETERMINISTIC_TRANSLATIONS: Record<string, (v: unknown, ctx: Context) => StudentFacing> = {
  'claimEarnednessMap.unearned': (v, ctx) => ({
    oneLine: `Your claim in ${ctx.locationLabel} lacks the evidence to back it up`,
    whatToTry: `Anchor the claim with a specific moment — what you saw, heard, or did that made you believe it`,
  }),
  'archetypeDistance.clichéFlag': (v, ctx) => ({
    oneLine: `"${v.quoted}" lands as the expected move for ${ctx.archetype} essays`,
    whatToTry: `Swap in something only you could have written — what happened that a reader wouldn't predict?`,
  }),
  'rhetoricalInventory.overreliance': (v, ctx) => ({
    oneLine: `You're leaning hard on ${v.device} — ${v.count} instances in ${ctx.totalParagraphs} paragraphs`,
    whatToTry: `Swap some for ${v.suggestedAlternatives.join(' or ')} to widen your range`,
  }),
  // ... ~15-20 mappings covering the bulk of signal shapes from 7a/7b/7c
};
```

**Tier 2 — Haiku fallback.** When the signal doesn't match a known shape, call Haiku with a tight prompt: *"Translate this analytical observation to one-line student-facing language: {signal}"*. Result is cached in the signal's own metadata so the same signal-value never re-translates.

Rationale: deterministic table is fast + free + consistent. Haiku fallback handles signals we haven't yet fingerprinted. Round 9+ signals register their own translator (see SIGNAL_REGISTRATION_PROTOCOL §3).

### 6.2 Translation test (binding)

Golden-file tests for all Tier 1 translations. A change to a translation string shows up as a diff and requires explicit approval. Prevents accidental regression to analytic jargon.

---

## 7 — Round 9+ extensibility (binding)

See [docs/SIGNAL_REGISTRATION_PROTOCOL.md](./SIGNAL_REGISTRATION_PROTOCOL.md) for the full protocol. Round 8 is the **first consumer** of `registerSignal` and MUST build against it:

- The planner does not directly read `profile.aoFirstRead.archetypePositioning`. It reads via `signalRegistry.get('archetypePositioning').read(profile)`.
- Round 9's new signals plug into the registry; the planner automatically sees them if their translator + consumer metadata are declared.

Round 8 validates this protocol by being its own first test case.

---

## 8 — Testing matrix (binding)

| Test class | Assertion | File |
|------------|-----------|------|
| Unit: schema | RevisionPlan validates against Zod schema | `tests/unit/revision-plan-schema.test.ts` |
| Unit: translator | All Tier 1 translations produce non-analytic student language (no words: claim, rhetorical, archetype, earnedness) | `tests/unit/signal-translator.test.ts` |
| Unit: conflict detector | Known conflict fixtures produce ConflictReport[]; clean profile produces empty | `tests/unit/signal-conflict-detector.test.ts` |
| Unit: planner (mocked LLM) | Haiku path produces ≤3 priorities, each cites a consumed signal | `tests/unit/revision-planner.test.ts` |
| Integration: persistence | Plan round-trips Supabase, RLS isolates users | `tests/integration/revision-plan-persistence.test.ts` |
| Integration: lifecycle | Edit → regen, structural-edit → stale-flag, address detection | `tests/integration/revision-plan-lifecycle.test.ts` |
| Cost budget | Haiku ≤$0.03, Haiku+Sonnet ≤$0.15 | `tests/unit/revision-plan-cost-budget.test.ts` |
| E2E | Full comprehensive analysis → plan generated → compressed summary in coach prompt ≤200 tokens | `tests/integration/round8-e2e.test.ts` |

All tests ship with the Round 8 PR. All must be green before merge.

---

## 9 — Non-goals (explicitly out of scope)

- **Automatic revision application.** Plan recommends; student still writes. No "apply this change for me."
- **Multi-essay plan coordination.** One plan per essay per draft. Portfolio-level planning is a later round.
- **Plan confidence interval UI.** `confidence` field exists; rendering as "high/medium/low" badge is enough for v1.
- **Plan export (PDF, email).** Roadmap item, not Round 8.

---

## 10 — Contract review

Before Round 8 implementation opens:

1. This doc is reviewed by Lead + Tue.
2. Any binding invariant changed requires explicit version bump (v1.1, v2.0) with migration plan for in-flight work.
3. "v1.0 frozen" marker goes on this doc when P0 PR lands; downstream PRs gate against frozen contract.

---

*The audit's central risk: Round 8 shipped without a contract would inherit every Round 7 defect. This contract is the firewall.*
