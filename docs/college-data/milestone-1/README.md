# Milestone 1: Safe Worktree and Remote-Schema Inventory

Status: **complete; production remains intentionally mutation-blocked until Milestone 2 gates pass**

Inventory date: 2026-08-01

## Readiness summary

| Gate | Result | Evidence / next action |
|---|---|---|
| Separate `benpham/college-database` worktree from latest `origin/main` | Pass | `/Users/beenpam/Desktop/Github/useuplift-college-database`, base `3ab1230` |
| Production project identified | Pass | Existing `zclaplpkuvxkrdwsgrul` (`uplift`, healthy, us-west-1) remains production |
| Preview/staging project identified | Pass | Created `ussnqsnuygqpgldyqtvv` (`uplift-staging`, healthy, us-west-1, micro) in the same `B&T` organization |
| Remote schema inventory | Pass | SELECT-only catalog inventory plus schema-only production dump completed; production received no writes |
| Migration history reconciled | Pass by evidence and containment | All 12 production records were fetched read-only and hashed; every same-version local file differs. Legacy `db push`/`repair` is prohibited; see `migration-reconciliation.md` |
| Transactional `COPY` connection | Pass on staging | Read-only transaction plus `COPY (SELECT ...) TO STDOUT` succeeded through staging's session pooler |
| CI/local secret protection | Pass | Password remains in macOS Keychain; access token, staging ref, and database password are environment-scoped GitHub secrets in `Preview`; preflight is fail-closed |
| Private source-artifact bucket | Pass on staging | Created private `college-source-releases` with 128 MB bucket cap and ZIP/CSV/JSON/octet-stream allowlist; production Storage remains unchanged |
| Artifact-size capacity | Pass on staging | Nine official 2023 final/revised component ZIPs (22,448,412 bytes total) were uploaded and round-trip verified; the 67,487,516-byte monolithic package remains over the global limit |
| Storage permissions | Pass on staging | Read-only role proof: `anon=0`, `authenticated=0`, `service_role=9`; see `storage-access-proof.md` |
| Rollback/recovery design | Pass as ADR; validation pending | `../../adr/0001-college-data-foundation-recovery.md` |
| Production mutation | Pass | None performed |

Do not run `supabase db push` from the legacy migration directory, `supabase db
reset --linked`, `supabase migration repair`, Storage creation, or any DDL against
production. Milestone 2 remains staging-only until its exit gate passes.

## Read-only commands used

```text
supabase projects list --output-format json
supabase migration list --linked
supabase db query --linked --file scripts/college-data/sql/milestone-1-inventory.sql
supabase db query --linked "SELECT ... catalog inventory ..."
```

The initial `supabase db dump --linked` attempt stopped before connection because
Docker was unavailable. After Docker started, the schema-only production dump
completed through the CLI's temporary login role. Earlier native `psql`/`pg_dump`
attempts stopped at password authentication and made no changes.

## Milestone 2 prerequisites

1. Keep client access to the private bucket at zero; if a narrower ingestion role
   replaces `service_role`, add and test only the exact object-path permissions it
   needs.
2. Build the additive foundation migration through reviewed staging SQL and prove
   clean replay without using the legacy migration directory as a deploy source.
3. Run the `College foundation preview preflight` workflow after this branch is
   pushed so GitHub, not just the local machine, proves the environment secrets.

The accepted component release and reproducible ingestion proof are recorded in
`ipeds-2023-final-ingestion.md` and pinned by
`../../../scripts/college-data/manifests/ipeds-2023-final.json`.

## Current official platform constraints

- Supabase recommends separate staging and production projects and encrypted CI
  secrets: <https://supabase.com/docs/guides/deployment/managing-environments>
- Direct connections are intended for `pg_dump`/migrations; session pooler is the
  IPv4 alternative: <https://supabase.com/docs/guides/database/connecting-to-postgres>
- Private buckets enforce access through RLS and are private by default:
  <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- The global file limit is at most 50 MB on Free and up to 500 GB on Pro/Team:
  <https://supabase.com/docs/guides/storage/uploads/file-limits>
- NCES lists the current package at 64 MB; its HTTP `Content-Length` measured
  67,487,516 bytes during this inventory:
  <https://nces.ed.gov/ipeds/use-the-data/download-access-database>

## Snapshots

- Production schema-only dump:
  `snapshots/production-schema-20260801.sql` — 188,129 bytes, SHA-256
  `2b0e2894a3089064c9ce149551743f47d3aa769f1caf6a22caf3bdf8ab94624f`.
- Fresh staging dump: `snapshots/staging-schema-initial-20260801.sql` — 49,827
  bytes, SHA-256
  `13aaf87c1d4a921a2b3b948f6e14ac089c56e14a5032821bec793ef6ee0ab87d`;
  it contains managed scaffolding but no application-defined foundation objects.

`supabase/config.toml`'s `project_id` is a local-stack identifier, not the hosted
environment ref. This repository incorrectly tracks generated `supabase/.temp/`
linkage files, so their checked-in production ref is not a safe deployment
selector. Durable refs and mandatory preflight commands are recorded in
`environment-registry.md` without credentials.
