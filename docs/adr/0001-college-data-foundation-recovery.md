# ADR 0001: Recover the College Data Foundation Additively

- Status: accepted; preview database and component-artifact validation passed
- Date: 2026-08-01
- Decision owners: product and engineering

## Context

Production contains a manually evolved `colleges` table with 2,607 rows and 66
columns, plus empty `user_college_list` and `college_reports` tables that reference
its UUID key. Git cannot reproduce production migration history: 41 CLI-valid
local versions are absent from the remote ledger, six remote versions have no
local file, and eight SQL files are ignored by CLI naming rules.

The legacy table mixes federal facts, duplicate field families, manually curated
content, and coarse provenance. It cannot satisfy the approved field-level source,
cohort, suppression, conflict, and release requirements.

## Decision

1. Treat `public.colleges` as a legacy compatibility source, never as the new
   canonical fact store.
2. Add versioned v2 identity, release, artifact, fact/provenance, conflict,
   quality, and projection relations alongside legacy tables.
3. Use an internal stable `institution_id`; map external identity through reviewed
   identifiers beginning with IPEDS UNITID and Scorecard/OPEID allocation data.
4. Add nullable `institution_id` bridges to saved rows and reports. Backfill only
   through a deterministic mapping with explicit unresolved records.
5. Switch reads/writes only after count, duplicate, orphan, and policy checks pass.
6. Retain legacy identifiers and the old read path for one release. Remove them in
   a separately approved destructive cleanup.
7. Build and test all migrations on a separate preview project. Production
   receives no mutation until the preview schema dump, connection, Storage,
   rollback, security, and performance gates pass.
8. Reconcile migration history as its own reviewed recovery operation. Do not run
   `migration repair`, rename historical files, or mark versions applied merely to
   make the ledger look aligned.

## Legacy-to-v2 mapping

| Legacy field/relation | V2 destination | Rule |
|---|---|---|
| `colleges.id` | compatibility mapping only | Preserve UUID; never reinterpret as federal identity |
| `colleges.unitid` | institution external identifier | Accept only after integer/range/uniqueness and IPEDS identity review |
| `colleges.scorecard_id` | source identifier/crosswalk | Verify semantics; do not assume it always equals UNITID |
| `name`, `city`, `state`, `zip_code` | versioned identity facts | Re-source from accepted IPEDS release; legacy values are comparison evidence only |
| federal metric columns | versioned facts/projection | Re-ingest from accepted release with field-level cohort and provenance; do not copy blindly |
| curated descriptions/media/tags | no automatic migration | Excluded until rights and source contracts exist |
| `user_college_list.college_id` | nullable `institution_id` bridge | Map through reviewed legacy UUID → external ID → canonical institution chain |
| `college_reports.college_id` | nullable `institution_id` bridge | Same mapping and reconciliation gate |
| legacy category/status/notes | rollback reader only | Foundation UI exposes only evidence-neutral Save; do not translate predictive labels |

## Rollback

- Foundation migrations are additive; legacy tables and columns remain intact.
- New API reads are feature-flagged by projection release.
- Rollback disables the new projection reader and returns to the legacy reader;
  it does not drop v2 data.
- Dual-write, if later approved, must be idempotent and observable. The initial
  migration does not assume it.
- Any unresolved identity mapping blocks cutover while preserving existing rows.

## Consequences

This costs more schema and compatibility work than altering `colleges` in place,
but it gives Uplift reproducible releases, truthful provenance, rollback without
data loss, and a safe boundary around unsupported legacy content.

## Validation still required before production

- keep the accepted component manifest immutable and re-verify every object before
  parsing; the nine-object, 22,448,412-byte staging round trip has passed;
- keep private-bucket client visibility at zero; the staging role proof passed
  with `anon=0`, `authenticated=0`, and `service_role=9`;
- migration replay, RLS, grants, backfill, orphan, duplicate, and rollback tests
  passing before any production change.

Preview is `ussnqsnuygqpgldyqtvv`; production remains
`zclaplpkuvxkrdwsgrul`. A staging read-only transaction with outbound `COPY`
passed through Supavisor session mode, and a schema-only production snapshot was
captured through the CLI's temporary login role. Production remained read only.
