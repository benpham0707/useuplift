# Migration-History Reconciliation

Date: 2026-08-01

This reconciliation is evidence and containment, not a migration repair. No
production migration row or schema object was changed.

## Read-only recovery result

The Supabase CLI fetched all 12 entries recorded in production's migration
history into an isolated temporary project. Six versions have no local file. The
six versions shared by Git and production all have different SHA-256 digests;
therefore a matching timestamp does not establish matching SQL.

| Version | Production bytes | Production SHA-256 | Repository state |
|---|---:|---|---|
| `20260221172252` | 2,837 | `1daaca469fd7e1aebfba509f597beb904c8136d4ef6debe3c66a83822d35233b` | Same version, different SQL |
| `20260221172703` | 2,719 | `7e9baa3f4bc9c89766f205522421d94abfbecf8d622555b1a37b5773c74adca0` | Same version, different SQL/name |
| `20260402000001` | 1,737 | `24f19d7f0c46769670e4e4f01a15ab7fe5422f7a8e0ff9e379fdefad3d1b295d` | Same version, different SQL |
| `20260428205857` | 9,488 | `6e1cead2c2ffaf073cc60885091e9e58b6554f15ffae3ba0f0cc1f5748bcbebd` | Remote only |
| `20260504002519` | 6,289 | `3a51f1871bede828074abf1d2d5146ff760f87e1351e44db1127c8797d82d2ae` | Remote only |
| `20260504024343` | 3,419 | `9307c7e99d2cce0bca2fa131d7f6770af4523daecfb32591839af5dc49b7a2f6` | Remote only |
| `20260504024356` | 312 | `e8e2fdfe43a7d0b27ab088cb2879d2200dde49721ad70e7c4afba40581b9c6b7` | Remote only |
| `20260504024418` | 2,680 | `50edb1a7468d14e2f3de08c944e80606e9513b5c78dcccc29411edaa0af5accf` | Remote only |
| `20260616164325` | 2 | `d8a957038679125d4840554fc43375697e662283121561afdefc2c3fbecaf729` | Same version; production record is only `;` plus newline |
| `20260616211500` | 4,797 | `eb7e02bfa8459efc3f91d0529ed1a14954069f46bb3a04835cc104feb49b83e7` | Same version, different bytes |
| `20260723230407` | 2,511 | `2e9637fa5d13d542776c8174258a9f477bcfa0eda1db32a0cfe00fd142d30419` | Same version, different bytes |
| `20260730050021` | 1,143 | `94bbd7a65f559d07d906f0393dcea1f746abedfd3a39a9d40580627af7d55222` | Remote only |

The production ledger remains the authoritative record of what production says
was applied. The schema-only production snapshot remains the authoritative shape
evidence; neither source proves that unrecorded local SQL was or was not run.

## Containment decision

- Do not run `supabase db push` from the legacy `supabase/migrations` directory.
- Do not rename historical files, replace local files with fetched files, or run
  `migration repair` merely to align lists.
- Milestone 2 foundation SQL must be additive and reviewed independently of the
  legacy ledger.
- Iterate on staging with `supabase db query` inside transactions. Once the SQL is
  stable, generate a clean migration using the supported CLI workflow and prove
  it on a fresh disposable database before recording it remotely.
- Production remains blocked until the additive migration is compared against a
  current production schema snapshot and the staging rollback/policy tests pass.

This resolves the Milestone 1 uncertainty by preserving it explicitly. It does
not pretend the legacy application migration chain is replayable.

## Git preview replay repair — 2026-08-01

PR #41 proved that Supabase Git branching reconstructs an empty preview database
from the SQL bodies stored in production's migration ledger. The replay failed
because two legacy prerequisites existed in production but were absent from that
ledger:

1. `20260504024343_expand_colleges_table_with_scorecard_fields` altered
   `public.colleges` without establishing the legacy table first.
2. `20260616211500_credits_integrity_hardening` expected three billing columns
   and the legacy `handle_new_user()` trigger function even when those objects
   were not part of the preview baseline.

The repair was deliberately limited to migration reproducibility:

- The recovered `20260504024343` migration now creates an empty,
  production-compatible legacy college table when absent, enables RLS, installs
  the two existing read policies, and then applies the historical expansion.
- The existing `20260428205857` profile baseline now includes
  `stripe_customer_id`, `subscription_status`, and `referral_discount_active`.
- The credits hardening migration conditionally revokes execute permission from
  `handle_new_user()` only when that legacy trigger function exists.
- The repaired migration bodies were recorded in production's migration ledger
  so newly created Supabase preview branches pull the corrected history.

No production application table, row, constraint, policy, function, or college
foundation object was changed by the ledger repair. The exact production college
row count was checked before and after the metadata update. The recovered files
are committed under `supabase/migrations/` so Git and the production ledger retain
the same preview prerequisites going forward.

Before preview recreation, the relevant production-ledger sequence was replayed
against an empty local database inside a transaction. It created both baselines,
ran the Scorecard expansion, credits hardening, and onboarding migration, and was
then rolled back successfully.
