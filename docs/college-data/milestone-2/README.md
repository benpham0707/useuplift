# Milestone 2: Foundation Migrations

Status: **complete on local and staging; production unchanged**

Validation date: 2026-08-01

## Delivered schema

The foundation is isolated from the non-replayable legacy migration directory at
`infra/college-foundation/supabase/`. Its two CLI-generated migrations create:

- source and immutable release ledgers;
- private logical ingestion jobs and retry-level attempts;
- canonical institutions, external identifiers, and relationships;
- immutable typed attribute and numeric metric facts;
- metric definitions and field-specific precedence metadata;
- data-quality issues;
- versioned projections, normalized release membership, and a single active
  projection pointer;
- query-ready college profiles, displayed-field provenance, conflict candidates,
  and versioned institution lookup;
- nullable `institution_id` bridges for legacy saved-list/report tables when
  those relations exist.

Program-detail tables remain intentionally deferred to federal enrichment, as the
approved plan permits.

## Security contract

- `college_ingest` is private: `anon` and `authenticated` have no schema usage.
- Every foundation table has RLS enabled.
- Client roles have no direct table privileges on the ledger or projections.
- `service_role` has insert-only access to immutable source/fact ledgers, mutable
  access to ingestion state/current institution cache, and build/replace access
  to projection tables.
- No public policies, views, or `security definer` functions were introduced.
- Every foreign-key access path has a supporting index.

Product reads will go through the authenticated backend service in Milestone 4;
the browser cannot query these tables directly.

## Verification evidence

| Gate | Result |
|---|---|
| Fresh local migration replay | Pass |
| Foundation table/RLS/grant assertions | Pass |
| Valid ledger → fact → projection fixture | Pass, rolled back |
| Invalid suppression/value and multi-value facts | Correctly rejected |
| Legacy bridge fixture | Pass; rows preserved, nullable columns and restrict FKs added |
| Local Supabase security/performance advisors | No issues |
| Staging migration application | Pass |
| Staging transactional assertions | Pass, rolled back |
| Staging Supabase security/performance advisors | No issues |
| Local and staging migration versions | Exact match: `20260801201006`, `20260801202206` |
| Generated TypeScript types | 1,090 lines generated from staging; `npx tsc --noEmit` passes |
| Production mutation | None |

## Commands

```bash
npm run db:college:start
npm run db:college:reset
npm run test:college-schema
npm run types:college
```

The legacy bridge test uses:

```bash
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres \
  -X -f tests/college-data/legacy-bridge-fixture.sql
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres \
  -X -f infra/college-foundation/supabase/migrations/20260801202206_add_legacy_college_bridges.sql
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres \
  -X -f tests/college-data/legacy-bridge-assertions.sql
```

Never run these isolated migrations against production until a current schema
comparison, rollback test, and explicit production approval are complete.
