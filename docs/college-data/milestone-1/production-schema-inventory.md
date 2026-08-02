# Production College Schema Inventory

Source: SELECT-only catalog queries against linked project
`zclaplpkuvxkrdwsgrul` on 2026-08-01.

This is recovery evidence, not authorization to change production.

## Legacy relations and row counts

| Relation | Exact rows | RLS | Notes |
|---|---:|---|---|
| `public.colleges` | 2,607 | enabled | 66 columns; UUID primary key; `scorecard_id` unique; `unitid` nullable and not unique |
| `public.user_college_list` | 0 | enabled | References `colleges(id)` with cascade delete |
| `public.college_reports` | 0 | enabled | References `colleges(id)` with cascade delete |
| `public.cip_interest_mapping` | not counted | enabled | Existing mapping relation; must be inventoried before reuse |

The empty saved/report tables reduce current backfill risk but do not remove the
need for an additive compatibility path: data may appear between inventory and
cutover.

## Legacy college shape

The table combines at least three generations of fields:

- duplicate size fields: `enrollment_size`, `undergrad_enrollment`,
  `total_enrollment`, `size`, and `size_category`;
- duplicate setting fields: `campus_setting` and `setting`;
- duplicate outcome/admissions families: `avg_*` and percentile-specific SAT/ACT
  fields;
- source-derived fields with only one coarse `data_year` and one
  `last_synced_at`, so field-level cohort/provenance cannot be reconstructed;
- unsupported curated fields: `description`, `logo_url`, `image_url`, brand
  colors, `popular_majors`, `program_strengths`, `interest_tags`, deadlines, and
  required materials.

The foundation must not promote this table into the new source of truth. Preserve
it for compatibility and build versioned identity, fact, provenance, release,
quality, and projection tables alongside it.

## Identity and constraint findings

- `id` is a generated UUID primary key.
- `scorecard_id` is nullable but unique; `unitid` is nullable without a uniqueness
  constraint.
- `name` and `slug` are unique, but neither is a sufficient institutional identity
  across renames, closures, merges, or multi-campus allocations.
- `user_college_list` has unique `(user_id, college_id)` and still permits
  `reach`, `match`, or `safety` categories.
- Both saved rows and reports cascade-delete when a legacy college is deleted.
- Reports and saves reference Clerk `sub` text through `auth.jwt()` policies.

## Access-control findings

- All three college relations have RLS enabled.
- `colleges` allows active rows to `anon` and `authenticated` through SELECT
  policies.
- Saved-list CRUD is scoped to `user_id = auth.jwt()->>'sub'`; UPDATE includes
  both `USING` and `WITH CHECK`.
- Reports permit own INSERT/SELECT; service role has all operations.
- Base table grants are broad (`anon` and `authenticated` have all table
  privileges), relying on RLS to block unauthorized operations. New v2 relations
  must use least-privilege grants plus RLS, not copy these grants mechanically.

## Migration-history divergence

| Category | Count | Meaning |
|---|---:|---|
| Local SQL files | 55 | Files present in `supabase/migrations/` |
| CLI-valid local files | 47 | Eight names are ignored by the CLI |
| Shared local/remote versions | 6 | Only these align with remote history |
| Local-only valid versions | 41 | Presence does not prove they are absent from schema; they may have been applied outside migration history |
| Remote-only versions | 6 | No matching repository migration exists |
| Remote versions total | 12 | Remote migration ledger is not reproducible from Git |

Remote-only versions observed:

- `20260428205857`
- `20260504002519`
- `20260504024343`
- `20260504024356`
- `20260504024418`
- `20260730050021`

CLI-ignored local files:

- `2025-08-23_add_has_completed_assessment.sql`
- `2025-08-24_expand_profiles_for_wizards.sql`
- `2025-08-31_add_update_triggers.sql`
- `2025-08-31_create_portfolio_analytics.sql`
- `2025-08-31_create_portfolio_analytics_history.sql`
- `2025-10-11_auth_devices_and_policies.sql`
- `2025-11-05_create_essay_system.sql`
- `schema.sql`

Duplicate coarse timestamps such as `20251125`, `20251127`, `20251130`, and
`20260503` also make ordering ambiguous. No migration repair is authorized by
this inventory.

## Storage and connection findings

- Production has zero Storage buckets and therefore no private source-release
  bucket, file limit, MIME allowlist, object policy, or upload proof.
- The cached endpoint is the Supavisor session pooler in `us-west-1` on port 5432.
- CLI Management API SELECT queries work.
- Production native `psql` still lacks a separately stored database password;
  this inventory did not add one.
- With Docker running, the CLI's temporary login role produced the committed
  schema-only snapshot without a production write.
- Staging session-pooler authentication and transactional outbound `COPY` passed.
- Staging has a private `college-source-releases` bucket, but its global upload
  limit rejected a 67,487,516-byte capacity probe with HTTP 413.

## Repeatability

The SELECT-only inventory lives at
`scripts/college-data/sql/milestone-1-inventory.sql`. Its catalog sections should
be run individually when machine-readable output is required because the CLI
returns only one result set for a multi-statement query.

The complete schema-only snapshot lives at
`docs/college-data/milestone-1/snapshots/production-schema-20260801.sql` with
SHA-256 `2b0e2894a3089064c9ce149551743f47d3aa769f1caf6a22caf3bdf8ab94624f`.
