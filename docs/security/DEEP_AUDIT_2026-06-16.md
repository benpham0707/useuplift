# Deep Security Audit — 2026-06-16 (post-RLS-lockdown)

Exhaustive re-verification of the RLS lockdown on Supabase `zclaplpkuvxkrdwsgrul`,
**excluding Vercel** (operator-deferred). Every line below is backed by a command that
was run against the **live production DB** (direct `pg` via `DATABASE_URL`) and the real
anon REST endpoint. All write probes ran inside `BEGIN … ROLLBACK` (zero data mutated).

Scripts (re-runnable): `.sec_deep1.mjs` (structural), `.sec_deep2.mjs` (adversarial
probes), `.sec_audit.mjs` / `.sec_rag.mjs` / `.sec_harden.mjs`.

## Verdict
**The lockdown is sound.** Anon reaches **0 PII** across all 40 tables; cross-tenant read
and write isolation hold on every table tested (including join-based policies); fraud and
billing-ledger integrity hold; no Storage/Realtime/View/SECURITY-DEFINER bypass exists.
**One real exploitable hole remains: credits self-inflation** (own-row `credits` column
writable — Exit 7a, fix prepared). Plus one cleanup: drop legacy `uuid` credit fns.

---

## 1. Roles & engine (`.sec_deep1.mjs` §A)
| role | superuser | bypassrls | login |
|---|---|---|---|
| anon | false | **false** | false |
| authenticated | false | **false** | false |
| service_role | false | true | false |
| postgres | false | true | true |

→ Neither `anon` nor `authenticated` can bypass RLS. ✓

## 2. RLS coverage & policy hygiene (§B)
- 40 public tables, **0 RLS-disabled**, 122 policies.
- **0 policies use `auth.uid()`** — the Clerk-broken pattern from legacy gamification
  tables (character_stats, daily_quests, dashboard_events, user_streaks, etc.) is gone;
  all ownership predicates are `user_id = (select auth.jwt() ->> 'sub')` or a
  `profile_id IN (SELECT id FROM profiles WHERE user_id = …sub…)` join.
- "Service role full access" policies expressed as `roles={public} USING (auth.role() =
  'service_role')` are permissive but evaluate FALSE for anon/authenticated callers — not
  a bypass (confirmed by the write matrix below).

## 3. Anon REST probe — ALL 40 tables (`.sec_deep2.mjs` §C)
- Every PII/user table → **HTTP 200, 0 rows**.
- `colleges`, `cip_interest_mapping` → 2 rows each (intended public reference).
- `essay_duplicates`, `ip_usage_tracking`, `rag_essay_fragments`, `rag_transformations`
  → **HTTP 401 (42501 permission denied)** — anon lacks even table SELECT grant.
- **No unexpected anon-readable PII.** ✓

## 4. Cross-tenant READ isolation (§D) — userA cannot see userB
Two real Clerk users: A=`user_35xg…58B` (4 essays), B=`user_360g…CYa`.
| query (as userA) | result |
|---|---|
| profiles own / userB | 1 / **0** |
| essays own / userB | 4 / **0** |
| personal_information(userB) | **0** |
| academic_journey(userB) | **0** |
| credit_transactions(userB) | **0** |
| fraud_flags(userB) | **0** |
| essay_analysis_reports visible / tied-to-userA / NOT-userA | 12 / 12 / **0** |

→ The join-based report policy returns **only** reports for userA's own essays (0 cross-
tenant). Isolation holds. ✓

## 5. Adversarial WRITE matrix (§E) — as userA, rolled back
| # | attempt | result | meaning |
|---|---|---|---|
| W1 | own `credits += 1e6` | **ALLOWED (1 row)** | 🚨 self-inflation (Exit 7a) |
| W2 | userB `credits = 0` | 0 rows (rls-filtered) | ✓ no cross-tenant credit theft |
| W3 | userB essay `draft_current='HACKED'` | 0 rows (rls-filtered) | ✓ |
| W4a | `colleges` UPDATE | 0 rows (rls-filtered) | ✓ ref read-only |
| W4b | `colleges` INSERT | DENIED(rls-check) | ✓ |
| W4c | `cip_interest_mapping` INSERT | DENIED(rls-check) | ✓ |
| W5a | DELETE own `fraud_flags` | 0 rows (rls-filtered) | ✓ can't clear own fraud |
| W5b | INSERT own `fraud_flags` | DENIED(rls-check) | ✓ can't fabricate |
| W6a | INSERT fake `credit_transactions +99999` self | DENIED(rls-check) | ✓ ledger integrity |
| W6b | INSERT `credit_transactions` for userB | DENIED(rls-check) | ✓ |
| W7 | INSERT `essays` owned by userB (valid enum) | DENIED(rls-check) | ✓ WITH CHECK works |

→ The **only** successful write outside a user's own benign data is **W1** (own credits).
Everything cross-tenant, all reference data, fraud flags, and the credit ledger are
protected by RLS even though anon/authenticated hold broad table-level DML grants (the
grants are a no-op without a matching permissive policy).

## 6. SECURITY DEFINER functions (§G)
5 functions, all `SET search_path = public, pg_temp`, **0 anon-executable**:
`check_credits`, `current_clerk_user_id`, `deduct_credits`, `handle_new_user`,
`recalculate_completion_score`.
- `current_clerk_user_id()` correctly returns `auth.jwt() ->> 'sub'`.
- `handle_new_user()` is a trigger fn (`on_auth_user_created` on `auth.users`); direct
  call errors on `NEW` → not exploitable (REVOKE EXECUTE recommended as hygiene).
- **NEW FINDING — legacy `deduct_credits(uuid,…)` & `check_credits(uuid,…)`:** take a
  caller-supplied `p_user_id uuid` (wrong identity model — should derive from the JWT) and
  compare it to `profiles.user_id` which is **TEXT**. Adversarial call as authenticated →
  `operator does not exist: text = uuid` (errors out → dead code, not exploitable today,
  but the design is wrong). **Action: DROP both** (added to `prepared_credits_hardening.sql`).

## 7. RAG RPCs (`.sec_rag.mjs`)
`match_rag_fragments` / `match_rag_transformations` are `SECURITY INVOKER`. anon has
EXECUTE but invoking as anon → "permission denied for table rag_essay_fragments" (the
underlying table grant denies). No leak. Optional defense-in-depth REVOKE in hardening SQL.

## 8. Storage / Realtime / Views (§H/I/J)
- **No views** in `public`.
- **No storage buckets**, **0 `storage.objects` policies** → no public-bucket file leak.
- **No tables in the `supabase_realtime` publication** → no realtime bypass.

## 9. App-layer verification (no API cost)
- `npx tsc --noEmit` → **0 errors** (incl. client.ts / safeClient.ts / clerkAuthFetch.ts /
  creditsService.ts).
- `npm test` (tsx unit runner) → **11/11 pass**.
- `npm run test:vitest` → **43 files, 927 tests pass, 0 fail** (5 skipped).
- `clerkAuthFetch` verified by reading: sets `Authorization: Bearer <Clerk 'supabase' JWT>`
  when a session exists, leaves the anon `apikey`, falls back to anon when logged out —
  matches the `auth.jwt() ->> 'sub'` RLS predicate.

---

## Outstanding (unchanged by this audit)
1. **🚨 Credits self-inflation (W1)** — fix prepared (`prepared_credits_hardening.sql`):
   JWT-derived `deduct_credits(int,text,text)` RPC + `REVOKE UPDATE(credits,…)` + app
   refactor + DROP of legacy uuid fns. Ship bundled with the #36 deploy. Operator-deferred.
2. **safeClient wrong-project fallback** — fix prepared (`prepared_safeclient_failclosed.md`).
3. **Defense-in-depth (optional):** REVOKE anon's blanket table-level INSERT/UPDATE/DELETE
   grants (currently no-ops under RLS, proven by §5) and REVOKE EXECUTE on
   `handle_new_user` / `match_rag_*` from anon/authenticated.

**Everything above is verification-only — no production data or schema was modified.**
