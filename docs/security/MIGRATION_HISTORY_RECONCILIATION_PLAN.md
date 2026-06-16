# Migration-History Reconciliation Plan

> **Status:** DRAFT / planning only — **no execution**. This is the detailed
> follow-up referenced by `RLS_LOCKDOWN_DEPLOY_GUIDE.md` §7.4. It surfaced from
> the June 2026 RLS security incident, but is an independent database-infrastructure
> effort. Nothing here should be run until a human owner reviews and approves a
> chosen option, and a backup/staging rehearsal is in place.

> ⚠️ This concerns the **production** database holding life-stakes student PII.
> No step in the recommended path is destructive to data; several *candidate*
> steps touch `schema_migrations` and migration files, which is why this is a
> reviewed plan, not an autonomous change.

---

## 1. The functional capability this unblocks

Today the migration folder cannot be replayed onto a fresh database. Concrete
things that are therefore broken or unsafe:

- **PR Supabase preview branches fail** on every PR (they replay the full chain
  from scratch and die — see §3). Reviewers get a permanent red check and no
  working preview DB.
- **Provisioning a new environment** (`supabase db reset`, a new staging project,
  a new developer machine) does not produce prod's schema.
- **`supabase db push` is unusable** against prod — it would try to apply ~45
  untracked migrations.
- The migration files are not a trustworthy source of truth for the schema, so
  schema review / change management has no reliable baseline.

The goal is a migration history that **replays cleanly from zero to exactly
prod's schema**, with `schema_migrations` that tells the truth.

## 2. Ground truth (audited 2026-06-16, live prod `zclaplpkuvxkrdwsgrul`)

| Fact | Value |
|---|---|
| Migration files | **49** (`supabase/migrations/*.sql`, excl. `schema.sql`) |
| Conforming `<14-digit>_name.sql` | 29 |
| Non-conforming filenames | **20** — 7 use a dash date (`2025-08-23_*`) that Supabase **skips entirely**; 13 use an 8-digit prefix (`20251122_*`) that runs but with a short, non-standard version |
| Versions recorded in `schema_migrations` | **9** |
| Local files whose version is recorded | **4 of 49** |
| Local files **not** recorded (would all be "new" on a push/replay) | **45 of 49** |
| Versions recorded on prod with **no local file** (orphans — files lost from repo) | **5** |
| Tables defined in migrations but **missing on prod** | **14** (see below) |
| Tables on prod with **no CREATE in any current migration file** | **9** |

The history is divergent in **three** independent directions at once:

1. **45 of 49 files are untracked** — on any fresh replay or `db push` they are all
   treated as "new" and run.
2. **5 recorded versions have no file in the repo** — `20260428205857`,
   `20260504002519`, `20260504024343`, `20260504024356`, `20260504024418`. These ran
   on prod but their `.sql` files are **gone from the repo** (e.g. `20260504024343`
   created `cip_interest_mapping`; its definition now exists *only* in prod).
3. **Tables and files disagree on the schema** (the two lists below).

**Defined in migration files, absent on prod (14):** `essay_understanding`,
`voice_profiles`, `scoring_telemetry`, `writing_analytics`, `prompt_effectiveness`,
`corpus_embeddings`, `editing_sessions`, `enhancement_runs`,
`essay_chat_conversations`, `essay_ground_truth`, `essay_set_membership`,
`application_sets`, `prestige_research_cache`, `activity_scoring_cache`
(the raw scan also lists `below`/`so` — regex false-positives, not tables).

**On prod, no CREATE in any current migration file (9):** `character_stats`,
`colleges`, `cip_interest_mapping`, `college_reports`, `daily_quests`,
`dashboard_events`, `portfolio_suggestions`, `user_college_list`, `user_streaks`.
These were created either via the dashboard or by the **5 lost/orphan migrations**
above — so their authoritative definition lives in **prod**, not the repo. A
prod-derived baseline (Option A) is what recovers them.

**The specific failure the preview hits:** `20260304000002_add_essay_understanding.sql`
(CREATE, **not recorded**) vs `20260402000001_add_coaching_persistence_columns.sql`
(ALTER, **recorded as applied**). On a fresh replay the CREATE never succeeds
(its FK target `essays` comes from a *skipped* dash-file), so the recorded-but-
never-really-applied ALTER fails with `relation "essay_understanding" does not
exist`. Prior patches (`20260402000000` bootstrap, `20260418000000` preview repair)
treated symptoms; the root cause is the divergence in this table.

## 3. Why the obvious quick fixes don't work (already tested)

- **Rename the 7 dash files to 14-digit** → conforms the filenames but does **not**
  fix the preview: a fresh branch still fails at the same ALTER (verified on PR
  #37 by close/reopen). And merging renames to `main` risks the main→prod sync
  attempting to apply foundational migrations to prod. **Reverted.**
- **Edit the failing middle migration** → the Supabase branch integration only
  pushes *new* migration files; edits to existing files are not re-applied.
- **Add a new (June) migration to create the table first** → new migrations sort
  *after* the April failure point, so the replay aborts before reaching them.

A middle-of-history failure on a chain that doesn't match prod cannot be patched
forward. The history must be reconciled.

## 4. Decision the team must make first (blocking)

The 16 "defined-but-absent" tables are the crux. For each cluster, decide
**intended state on prod**:

- **Essay-intelligence / coaching** (`essay_understanding`, `essay_chat_conversations`,
  `essay_ground_truth`, `essay_set_membership`, `application_sets`, `editing_sessions`,
  `enhancement_runs`, `corpus_embeddings`): are these features meant to be live on
  prod? If yes, their tables must actually be created on prod (they aren't today,
  so those features are presumably failing/unused in prod). If no/not-yet, the
  migrations should be archived out of the active set.
- **Telemetry / caches** (`scoring_telemetry`, `writing_analytics`,
  `prompt_effectiveness`, `prestige_research_cache`, `activity_scoring_cache`,
  `voice_profiles`): same question — provision on prod, or archive.

Reconciliation cannot be correct until "what *should* prod's schema be?" is
answered. This is a product/eng call, not a mechanical one.

## 5. Options

### Option A — Baseline squash (RECOMMENDED)
Collapse the divergent history into one authoritative baseline that equals the
agreed-upon target schema, then build forward.

**Pros:** definitively fixes replay/preview/new-env; eliminates the 49-file
minefield; `schema_migrations` becomes truthful; standard Supabase remedy
(`supabase migration squash` / dump-based baseline). **Cons:** one large reviewed
change; must verify the baseline equals target exactly; coordinate so all envs
adopt the new baseline.

### Option B — Surgical idempotent repair
Rename the 7 dash files, make all 49 idempotent (`IF NOT EXISTS`, `OR REPLACE`,
guards), fix ordering/FKs, then reconcile `schema_migrations`.
**Pros:** preserves granular history. **Cons:** must audit/repair 49 files
(one has 47 `CREATE`s); whack-a-mole — `essay_understanding` was only the *first*
replay error; high effort, high regression risk; and it **cannot recover the 5
lost/orphan migrations** (§2 dimension 2) — their `.sql` is gone, so a file-based
repair can never reproduce prod from zero. This alone disqualifies B as a complete
fix.

### Option C — Accept + isolate (interim, not a fix)
Document the preview check as known-red; disable it as a *required* check so it
doesn't block merges; defer A/B. **Pros:** unblocks PRs today (the security PR
merges on its real checks). **Cons:** no working preview DBs; new-env provisioning
still broken. Reasonable **bridge** while A is scheduled.

**Recommendation:** **C now** (so PRs aren't blocked) → **A** as the real fix.

## 6. Recommended path (Option A), phased — review-gated, no autonomous run

> Rehearse every phase on a **throwaway branch/preview or staging project first.**
> Take a fresh prod backup before anything that touches prod `schema_migrations`.

**Phase 0 — Backup & freeze.** Snapshot prod (PITR checkpoint + `pg_dump`
schema-only). Announce a short migration freeze so the baseline can't drift mid-effort.

**Phase 1 — Resolve §4.** Get written sign-off on the target schema: which of the
16 absent tables are in-scope for prod. Output: an explicit target table list.

**Phase 2 — Capture the target baseline.** From the agreed target (prod schema
**plus** any §4 tables to be added), produce one `00000000000000_baseline.sql` via
`supabase db dump --schema-only` against prod, reconciled with the §4 additions.
Because it is **derived from prod**, the baseline automatically recovers (a) the 9
dashboard-only tables, (b) the schema created by the **5 lost/orphan migrations**
(whose files are gone but whose effects live in prod), and (c) the RLS/policies
from `20260616164325_secure_rls_lockdown_clerk.sql`. Diff the dump against a
fresh-replay of the *current* file set to make the divergence explicit and
reviewable before adopting it.

**Phase 3 — Archive the old history.** Move the 49 existing files to
`supabase/migrations/_archived_pre_baseline/` (retain for provenance; do not
delete). The active set becomes: baseline + any genuinely-new migrations.

**Phase 4 — Reconcile `schema_migrations` on prod.** Mark the baseline as applied
on prod **without running it** (`supabase migration repair --status applied <baseline>`,
or the equivalent insert) so the main→prod sync treats prod as already at baseline.
Then reconcile the existing ledger to a consistent set: the **9 legacy recorded
versions** (4 with files, **5 orphans with no file**) must either be retained as
historical no-ops *after* the baseline or cleared, so that `migration list` shows
Local == Remote with no orphan rows. Decide explicitly what happens to the 5 orphan
versions — they cannot be "reverted" (no file), so they are either kept as inert
historical markers behind the baseline or removed from the ledger. Capture the SQL
for this step and **dry-run it against the staging rehearsal first**; this is the
one step that can corrupt the ledger further if done wrong.

**Phase 5 — Verify replay.** On a fresh preview branch / `supabase db reset`,
confirm the chain replays 0→baseline→new with **zero errors**, and that the
resulting schema diff against prod is empty (`supabase db diff` clean).

**Phase 6 — Roll out.** Update local-dev docs; have each developer reset to the
baseline. Re-enable the Supabase Preview required check once it's green.

## 7. Risks & safeguards

- **Production data:** none of A's steps drop or rewrite table *data*; they touch
  migration files and the `schema_migrations` ledger only. Still: full backup +
  PITR checkpoint before Phase 4.
- **Mismarking applied state:** if Phase 4 marks the baseline applied but prod
  actually lacks a baseline table, future migrations could fail. Mitigate with the
  Phase 5 `db diff` (must be empty) **before** trusting the reconciliation.
- **RLS regression:** the baseline must reproduce the exact policies from the
  security migration. Re-run the §5 enforcement checks from the deploy guide
  against a fresh baseline DB as an exit gate.
- **Multi-environment drift:** all envs must adopt the baseline together; a
  straggler on the old history will conflict. Coordinate via the Phase 0 freeze.

## 8. Exit criteria

- [ ] Fresh `supabase db reset` / preview branch replays with 0 errors.
- [ ] `supabase db diff` against prod is empty.
- [ ] `supabase migration list` shows Local == Remote.
- [ ] Anon/auth RLS enforcement checks (deploy guide §5) pass on a fresh baseline DB.
- [ ] Supabase Preview check green on a test PR; re-enabled as required.

## 9. Rollback

The effort is reversible until Phase 6: the archived `_archived_pre_baseline/`
history and the prod backup allow restoring the prior (broken-but-known) state.
After Phase 6, forward-fix from the baseline.

## 10. Effort

Phase 1 (decision) is the long pole. Phases 2–5 are ~1–2 focused engineering days
**with** a staging rehearsal. Do not compress the staging rehearsal — Phase 4 is
the only step that can damage the migration ledger, and the rehearsal is what makes
it safe.
