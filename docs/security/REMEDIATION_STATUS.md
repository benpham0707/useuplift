# RLS Security Remediation — Status Ledger

> Authoritative, evidence-backed status of the 8 Exit Criteria. Re-derived from
> live state each iteration. **A false "done" is worse than an honest "not yet."**
> Every status row cites the command run + key output + timestamp.

**Project:** `zclaplpkuvxkrdwsgrul` (Supabase) · repo `benpham0707/uplift-final-final-18698-62030`
(GitHub redirects the old name `benpham0707/useuplift` to this repo — same repo, single origin).
**Last full audit:** 2026-06-16T20:40Z

---

## Status Summary

| # | Criterion | Status | Last verified |
|---|-----------|--------|---------------|
| 1 | Security holds (RLS, anon probe, isolation, fns) | **PASS** | 2026-06-16T20:34Z |
| 2 | CI typecheck green (#37 merged, lint 0 violations) | **PASS** | 2026-06-16T20:40Z |
| 3 | Vercel deploys green | **BLOCKED(human)** | 2026-06-16T20:30Z |
| 4 | Client fix deployed + runtime-verified | **BLOCKED(human)** | 2026-06-16T20:30Z |
| 5 | P0 cleared (dashboard usable) | **BLOCKED(human)** | 2026-06-16T20:30Z |
| 6 | Supabase Preview resolved (Option C bridge) | **PASS** | 2026-06-16T20:40Z |
| 7 | Hardening backlog triaged | **PASS** (credits FIXED in prod) | 2026-06-16T21:25Z |
| 8 | Future-proofing recorded (migration reconciliation) | **IN-PROGRESS** | 2026-06-16T20:40Z |

Consecutive clean full audits: **0 / 2** required to stop.

> ✅ **RESOLVED (Exit 7):** credits self-inflation is **fixed in production**. Migration
> `20260616211500_credits_integrity_hardening` applied + recorded; direct `credits` UPDATE
> as authenticated now **DENIED(grant)** (re-verified on a fresh connection), the JWT-derived
> `deduct_credits` RPC works (577→576), benign updates + service_role intact. App refactor in
> **PR #38** (stacked on #36). Legacy uuid credit fns dropped; `handle_new_user`/`match_rag_*`
> anon EXECUTE revoked; safeClient cross-project fallback removed (fail-closed).

---

## Exit 1 — Security holds → **PASS**

Verification: `node .sec_audit.mjs` (direct pg ground-truth + real anon REST probe)
+ `node .sec_rag.mjs` (adversarial RPC leak test). Run 2026-06-16T20:34Z.

Evidence:
- **RLS status:** 40 public tables, **0 RLS-disabled**. (`pg_class.relrowsecurity`)
- **Policies:** all 40 tables have ≥1 policy.
- **SECURITY DEFINER fns:** 5 total, **0 anon-executable**.
- **Isolation sim** (`SET LOCAL ROLE` + `request.jwt.claims.sub`):
  - `profiles`: anon=**0**, auth(nobody)=0, auth(real sub)=**1 own row**, service_role=**134**.
  - `essays`: anon=0, service_role=176. `essay_analysis_reports`: anon=0, svc=196.
  - `credit_transactions`: anon=0, svc=12. `fraud_flags`: anon=0, svc=0.
- **Real anon REST probe** (`apikey`+`Bearer` = anon key, PostgREST):
  - PII tables (`profiles`,`essays`,`essay_analysis_reports`,`credit_transactions`,`fraud_flags`): HTTP 200, **0 rows**.
  - Reference (`colleges`,`cip_interest_mapping`): 3 rows — intended public.
  - `rag_essay_fragments`: HTTP **401** `42501 permission denied`.
- **`match_rag_*` RPCs:** anon has EXECUTE, BUT both are `prosecdef=false`
  (SECURITY INVOKER). Adversarial invoke `SET ROLE anon` → **"permission denied
  for table rag_essay_fragments"**. No data leak. (REVOKE EXECUTE FROM anon is an
  optional defense-in-depth item — see Exit 7.)

Adversarial review: anon path tested two ways (SQL role-sim AND real REST). Both
agree: 0 PII. Authenticated user sees only own row. service_role retains full
access. SECURITY INVOKER RAG fns fail closed at the table-grant layer.

**DEEP AUDIT (2026-06-16T21:05Z) — see `docs/security/DEEP_AUDIT_2026-06-16.md`:**
expanded to ALL 40 tables + two-real-user cross-tenant matrix. Additional proofs:
- Anon REST on **all 40 tables** → 0 PII (4 tables even HTTP 401-locked).
- **Cross-tenant read isolation** (userA vs userB): 0 rows of userB's profiles/essays/
  personal_information/academic_journey/credit_transactions/fraud_flags; join-based
  `essay_analysis_reports` returns 12 reports, **all 12 tied to userA's essays, 0 others**.
- **Adversarial write matrix** (BEGIN/ROLLBACK): cross-tenant writes (W2/W3/W6b) rls-filtered;
  reference INSERT/UPDATE (W4) denied; **fraud_flags** delete/insert (W5) denied (fraud
  integrity); **fake credit_transactions** (W6a) denied (ledger integrity); cross-tenant
  essay INSERT (W7, valid enum) DENIED(rls-check). **Only W1 (own credits) succeeds** = 7a.
- No `auth.uid()` policies remain; no views; no storage buckets; no realtime publication;
  roles anon/authenticated bypassrls=false; 5 SECDEF fns all search-path-set, 0 anon-exec.
- App layer: `tsc --noEmit` 0 errors; `npm test` 11/11; `vitest` 927 pass / 0 fail.

**Re-run command:** `node .sec_audit.mjs && node .sec_rag.mjs && node .sec_deep1.mjs && node .sec_deep2.mjs`

---

## Exit 2 — CI typecheck green → **PASS**

- PR **#37** merged to `main` 2026-06-16T20:35:49Z (squash commit `f749cd0b`).
- `git show origin/main:…/holisticSynthesis.ts | sed -n 658p` → "…conspicuously
  **leaves unevidenced**…"; `grep -c "fails to"` → **0**.
- `gh run view 27646467247` (main, push of #37 merge): "Typecheck + unit tests" =
  **success** — that job runs `test-descriptive-contract-lint.ts`, so 0 violations on main.
- Note: running the lint test in *this* working tree (`chore/codebase-cleanup`) still
  shows 1 violation — expected, that branch predates #37 and is not `main`. The criterion
  is about `main`, which is clean.
- PR **#36** typecheck was failing **only** on this same lint line (confirmed via
  `gh run view 27645212810 --log-failed`); it will go green once rebased onto current `main`.

---

## Operator decisions
- **2026-06-16T20:45Z:** DEFER Vercel (Exit 3) + Clerk smoke test (Exit 4); credits fix
  documented-only.
- **2026-06-16T21:10Z — UPDATED:** operator instructed "**fix in full**". Exit 7 credits +
  safeClient fixes **implemented and applied to prod** (DB) + **PR #38** (app). Exit 3/4/5
  remain operator-deferred (Vercel/Clerk runtime).

---

## Exit 3 — Vercel deploys green → **BLOCKED(human)**

Every deployment fails at **0s** (before build): `dpl_4UH13FgneTb8wPWisbXaSGpLZdTU`
(#37), `dpl_EgpkB4ThvYRPJeuNvPFWBfEJV7E2` (#36). `npm ci` + `vite build` pass on a
clean tree → platform/wiring issue, not code.

**Operator actions required (run via `!` or dashboard):**
1. `npx vercel inspect dpl_4UH13FgneTb8wPWisbXaSGpLZdTU --logs` — get the real 0s error.
2. Vercel → Project `useuplift` → Settings → **Git**: confirm `benpham0707/useuplift`
   connected, production branch = `main`.
3. **Build & Output**: Framework=Vite, Build=`vite build`, Output=`dist`, Install=`npm ci`.
4. **Environment Variables**: all `VITE_*` present (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
   VITE_CLERK_PUBLISHABLE_KEY, VITE_API_BASE, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY).
5. **Billing/usage**: a 0s "Error" is classically a spend-limit / paused-plan / blocked deploy.
6. Check https://vercel-status.com.

---

## Exit 4 — Client fix deployed + runtime-verified → **BLOCKED(human)**

Depends on Exit 3 (Vercel) + a Clerk **test login** from operator. After #36 merges &
deploys: logged-in smoke test (terms gate passes, credits/profile render, wizard saves;
DevTools shows `Authorization: Bearer <Clerk JWT>` + `apikey`=anon on `/rest/v1/`).
Logged-out: public pages load, 0 PII.

---

## Exit 5 — P0 cleared → **BLOCKED(human)** (follows from 3+4)

`RequireTermsAccepted` wraps `DashboardLayout`, reads via still-deployed **anon** client →
empty under locked RLS → users stuck at terms gate. Cleared only by deploying #36.

---

## Exit 6 — Supabase Preview resolved → **PASS** (Option C bridge, documented)

Verified the check is **already non-blocking** and now consciously documented (not silently ignored):
- `gh api repos/.../branches/main/protection` → **404** (no classic branch protection).
- `gh api graphql … branchProtectionRules` → **`nodes: []`** (no protection rules).
- `gh api repos/.../rulesets` → one ruleset "Trojan", **`enforcement: "disabled"`**.
- **Empirical proof:** PR #37 merged to `main` while "Supabase Preview" was **red** —
  i.e. the failing preview did not block the merge.

**Option C rationale (documented):** "Supabase Preview" fails on PR branches due to the
migration-history 3-way drift (see `MIGRATION_HISTORY_RECONCILIATION_PLAN.md`), not due to
real schema problems — `main`'s preview is green (prod-synced). It is intentionally **not a
required check**. **Residual / operator guardrail:** do NOT add "Supabase Preview" as a
*required* status check (branch protection / ruleset) until the migration reconciliation
(Exit 8) is executed — doing so would block all PR merges. This decision supersedes any
later attempt to require it before reconciliation.

---

## Exit 7 — Hardening backlog triaged → **PASS** (core vuln FIXED in prod)

**APPLIED 2026-06-16T21:20Z:** migration `20260616211500_credits_integrity_hardening`
committed to prod via verify-before-commit (`.sec_apply.mjs`, 9/9 assertions) + recorded in
`schema_migrations`. App refactor + safeClient fail-closed in **PR #38** (base #36). Re-audit
(`.sec_deep2.mjs`) confirms **W1 own-credits UPDATE → DENIED(grant)**; everything else intact.

Evidence: `node .sec_harden.mjs` (policy/grant inspection + adversarial inflation test),
`grep` of client write paths, `node .sec_apply.mjs` (apply+verify). Run 2026-06-16T20:40–21:25Z.

### 7a. Credits self-inflation — **FIXED in prod** (was CONFIRMED LIVE & EXPLOITABLE)
- `profiles` has table-level `UPDATE` granted to **both** `authenticated` and `anon`, with
  column-level `UPDATE` on `credits`, `subscription_status`, `stripe_customer_id`,
  `referral_discount_active` for `authenticated` (and `anon`).
- `profiles_update_own` (UPDATE, role authenticated): USING & CHECK = `user_id = auth.jwt()->>'sub'`
  — lets a user write ANY column on their own row, including `credits`.
- **Adversarial test (rolled back):** `SET ROLE authenticated` + jwt sub = real user →
  `UPDATE profiles SET credits = credits + 1000000` **SUCCEEDED** (10 → 1000010).
- **Root cause:** `creditsService.deductCredits()` (`src/services/credits/creditsService.ts:191`)
  computes `newBalance` client-side and writes it via `getAuthenticatedClient(token)` (the
  browser Clerk client). Legit deduction and malicious inflation use the *same* privilege.
- **`anon` cannot exploit** (no anon UPDATE *policy* → RLS fails closed; verified anon=0 rows),
  but the broad anon table grants are sloppy and should be revoked too.
- **Fix (prepared, must ship together):** (1) SECURITY DEFINER RPC `deduct_credits(amount,type,desc)`
  that re-reads balance, checks sufficiency, decrements atomically, validates caller via
  `auth.jwt()->>'sub'`; (2) refactor `deductCredits()` to call the RPC; (3)
  `REVOKE UPDATE(credits, subscription_status, stripe_customer_id, referral_discount_active)
  ON profiles FROM authenticated, anon`. **Deploy ordering:** RPC+REVOKE+app refactor must
  deploy as one unit (a bare REVOKE alone breaks legit deduction once the Clerk client is live).
  Since the RLS lockdown is already applied and the *old anon* client is still deployed,
  user-scoped writes are **already failing in prod** (the P0) — so this is not a new regression.
  → **Status: FIXED. Migration `20260616211500` applied to prod (verify-before-commit, 9/9) +
  recorded. App refactor (`deductCredits`→RPC) in PR #38. Fresh re-verify: direct credits UPDATE
  DENIED(grant), RPC works (577→576), benign updates + service_role intact, userA credits
  unchanged. Runtime smoke test (Exit 4) still pending the Vercel-gated deploy.**

> **Status:** 7a/7b/7c/7d/7e **FIXED** (DB applied to prod + PR #38). 7f = won't-fix (no-op).

### 7b. `safeClient` wrong-project fallback — **FIXED (PR #38)**
- `src/integrations/supabase/safeClient.ts:13` `FALLBACK_URL = 'https://wrppjajhxiftzddeeqsk.supabase.co'`
  + `FALLBACK_KEY` (a different project's anon JWT, ref `wrppjajhxiftzddeeqsk`). If
  `VITE_SUPABASE_URL`/`ANON_KEY` are missing at load, the app silently connects to the WRONG
  project. (`creditsService.ts:14` has the same fallback constant.) This is exactly the
  missing-env condition suspected for Vercel (Exit 3) — it would mask the misconfig.
- **Fix authored:** `docs/security/prepared_safeclient_failclosed.md` — remove the
  cross-project fallback; **fail closed** (throw a clear error) when env is absent. Aligns
  with CLAUDE.md "no degraded fallbacks." Fold into #36 or follow-up PR. → Not applied.

### 7c. `handle_new_user` `authenticated` EXECUTE grant — **LOW RISK / hygiene**
- Inspected (`pg_get_functiondef`): `RETURNS trigger`, SECURITY DEFINER, body =
  `INSERT INTO public.profiles (user_id, user_context) VALUES (NEW.id, 'high_school_11th')`.
- Wired as trigger `on_auth_user_created` on `auth.users` only. A direct
  `SELECT handle_new_user()` errors (no `NEW` outside trigger context) → **not directly
  exploitable**. The `authenticated` EXECUTE grant is unnecessary. → **Decision: REVOKE
  EXECUTE FROM authenticated, anon, public as hygiene (included in prepared hardening SQL).
  No urgency.**

### 7e. Legacy `deduct_credits(uuid,…)` / `check_credits(uuid,…)` — **DROP (dead + wrong model)**
- Deep audit found two SECURITY DEFINER fns that take `p_user_id uuid` as a **caller-supplied
  parameter** (not JWT-derived) and compare to `profiles.user_id` (TEXT/Clerk). Adversarial
  call as authenticated → `operator does not exist: text = uuid` → dead code. Wrong identity
  model regardless. → **DROP both** — added to `prepared_credits_hardening.sql` §0.

### 7f. Blanket anon table DML grants (defense-in-depth) — no-op under RLS
- Every public table grants anon INSERT/UPDATE/DELETE at the table level. The write matrix
  (§5) proves RLS denies all of them (no matching permissive anon write policy anywhere). Not
  exploitable; optional `REVOKE … FROM anon` for belt-and-suspenders. **Won't-fix acceptable.**

### 7d. `match_rag_*` anon EXECUTE (defense-in-depth) — data already safe
- Both `prosecdef=false` (SECURITY INVOKER); anon invoke → "permission denied for table
  rag_essay_fragments". No leak (see Exit 1). → **Optional: `REVOKE EXECUTE … FROM anon`.**

---

## Exit 8 — Future-proofing recorded → **IN-PROGRESS (decision pending owner)**

- The reconciliation plan exists: `docs/security/MIGRATION_HISTORY_RECONCILIATION_PLAN.md`
  (Option A baseline squash) — **plan-only**, gated on owner sign-off + staging rehearsal +
  backup/PITR (standing guardrail; never squash without rehearsal).
- **Recommended interim decision:** stay on the **Option C bridge** (Exit 6) — Supabase Preview
  is non-required and documented — until the owner schedules the Option A rehearsal. This
  unblocks merges today without touching prod migration history.
- **Owner sign-off required** to either (a) schedule the Option A rehearsal+squash, or (b)
  formally adopt Option C as the standing state. Recorded here pending that decision.
- Memory `supabase-rls-clerk-model` to be updated with the new credits-inflation finding +
  the verified anon/isolation posture once the credits fix lands.

---

## Human Blockers (operator must own)

1. **Vercel access** — run `vercel inspect --logs` + dashboard Git/Build/Env/Billing checks (Exit 3).
2. **Clerk test login** — for the logged-in runtime smoke test (Exit 4).
3. **Prod migration approval** — for any Option A squash (Exit 8), with staging rehearsal + backup.
