# RLS Lockdown — Deploy & Verification Guide

Companion to PR #36 / migration `20260616164325_secure_rls_lockdown_clerk.sql`.

The **database fix is already applied to production** and verified with real
queries (anon can no longer read/write PII; per-user isolation holds; the
backend service_role is unaffected). What remains needs either your credentials
(a real Clerk login, the Supabase dashboard) or a deploy — things I could not do
from here. Do them **in order**.

---

## ⏱️ Why this is time-sensitive

The DB is locked **now**. The frontend currently in production still uses the
old anon client, so its `profiles` reads (credits display, onboarding, profile
widgets) now return **empty** until the client change in this PR ships. There is
**no data leak** in the interim — only empty reads in those legacy spots.
**Merging + deploying this PR closes that gap.**

---

## 1. Merge & deploy the frontend  ✅ required

1. Merge PR #36 into `main`.
2. Deploy the frontend the usual way (Vite build → host). The migration file is
   already applied to prod and recorded in migration history, so `supabase db
   push` will report nothing to apply — that's expected.
3. **Do not** roll the migration back without rolling back the client (see §6).

---

## 2. Logged-in smoke test  ✅ required (the runtime check I couldn't run)

I verified everything at the DB layer and unit-tested the token wrapper, but I
have no Clerk login, so the one thing left is confirming the real Clerk
`supabase` JWT flows end-to-end. After deploy, **sign in as a real user** and
confirm:

- [ ] Credits balance shows in the top nav / sidebar (reads `profiles`).
- [ ] Dashboard / onboarding loads your profile.
- [ ] A portfolio wizard (e.g. Basic Information, Activities) loads **and saves**.
- [ ] Open DevTools → Network → a `…supabase.co/rest/v1/…` request →
      **Request Headers** show `Authorization: Bearer eyJ…` (a Clerk JWT, not the
      anon key) and `apikey: <anon key>`.
- [ ] Sign out → public pages still load; no console errors.

If profile data is empty **only when logged in**, the Clerk JWT isn't reaching
Supabase — jump to §4.

---

## 3. Confirm the advisory cleared  ✅ required

I proved the underlying condition is zero (`rls_disabled = 0`) with direct SQL,
but the official advisor must be re-scanned to clear the email:

- Supabase Dashboard → **Advisors → Security** → **Refresh**. The
  `rls_disabled_in_public` finding should be gone. (Or click **Resolve issue** in
  the alert email and let it re-scan.)
- You may now see **lower-severity** advisories that were always there
  (e.g. `function_search_path_mutable` on other functions, leaked-password
  protection). Those are not part of this incident; triage separately.

To re-run advisors via MCP instead: complete the Supabase MCP OAuth (select the
org that owns `zclaplpkuvxkrdwsgrul`) and run `get_advisors(type: "security")`.

---

## 4. Verify the Clerk `supabase` JWT template  ⚠️ if §2 shows empty data

The fix assumes Clerk issues a JWT (template name **`supabase`**) whose `sub`
claim is the Clerk user id. This is already used by `getAuthenticatedSupabaseClient`
(PIQ/Activity workshops), so it should be configured — but verify:

- Clerk Dashboard → **JWT Templates** → a template named `supabase` exists.
- It is signed so Supabase accepts it (Supabase project configured with Clerk as
  a Third-Party Auth provider, **or** the template signs with the Supabase JWT
  secret — match whatever the existing workshops rely on).
- Decode a token (DevTools → the request → copy the Bearer → jwt.io): `sub`
  must equal the user's Clerk id (`user_2…`) and match `profiles.user_id`.

---

## 5. Re-verify enforcement yourself (optional, anytime)

**Anon probe** — paste into a scratch Node script with the anon key (must return
0 rows / errors):
```js
import { createClient } from '@supabase/supabase-js';
const sb = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
for (const t of ['profiles','rag_essay_fragments','personal_information','portfolio_analytics'])
  console.log(t, await sb.from(t).select('*', { count: 'exact' }).limit(1));
```

**In the Supabase SQL editor** (service role) — confirm no table is RLS-disabled:
```sql
select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;
-- expect: 0 rows
```

**Simulate a logged-in user** (SQL editor) — sees only their own rows:
```sql
begin;
  select set_config('request.jwt.claims',
         json_build_object('sub', '<a real profiles.user_id>')::text, true);
  set local role authenticated;
  select count(*) from profiles;            -- expect 1 (their own)
  select count(*) from personal_information; -- expect only their own children
rollback;
```

---

## 6. Rollback plan (only if the app breaks and you must)

The secure state is correct; prefer fixing forward (§4). If you must roll back
**temporarily**, roll back *together* to avoid reopening the hole:

- Revert the frontend deploy **and** the DB at the same time. Reverting only one
  leaves you either (a) exposed again, or (b) with empty profile reads.
- A DB rollback would mean recreating the old wide-open policies — **do not** do
  this except as a last resort, and re-secure within hours. There is no clean
  "safe" rollback of the DB half; the right move is forward-fix §4.

---

## 7. Follow-up hardening backlog (separate PRs — not blockers)

These are pre-existing issues surfaced during the audit, out of scope for the
incident fix:

1. **Credits self-inflation (billing integrity).** `creditsService.deductCredits`
   writes `profiles.credits` from the *client*, so a logged-in user can set their
   own balance. (This PR already removed the far worse "anyone can edit anyone's
   credits.") Fix: move credit writes to a `SECURITY DEFINER` function / backend
   route and `REVOKE UPDATE (credits) ON profiles FROM authenticated`.
2. **`safeClient.ts` fallback points at the wrong project.** If env vars are
   missing it falls back to `wrppjajhxiftzddeeqsk.supabase.co` (a different
   project). Remove the hardcoded fallback or fail loudly instead.
3. **`handle_new_user` retains an `authenticated` EXECUTE grant.** Inert (it's a
   trigger function that errors if called directly), but tidy with
   `REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated`.
4. **Migration drift.** The live DB had only 40 tables; many local migrations
   (`voice_profiles`, `essay_understanding`, telemetry, caches, …) are not applied
   to prod. Reconcile `supabase migration list` (Local vs Remote) so future RLS is
   guaranteed on those tables too. The Step-1 loop in this migration will cover
   them automatically *once they exist*, but confirm intentionally.
5. **Verify other `SECURITY DEFINER` functions** added later (vector match, fraud
   RPCs) have internal auth checks or are service-role-only.
