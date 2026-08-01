# Milestone 4 — Versioned college serving layer

Status: complete on local and staging; production remains unchanged.

Validation date: 2026-08-01

Milestone 4 turns promoted federal facts into a narrow product-serving contract.
The field contract remains provisional until Milestone 0's five student sessions
and review gate are complete.

## Scope

- Deterministic, immutable college-profile builds from accepted facts.
- Explicit build validation followed by atomic activation.
- Field-level provenance for identity, location, institutional type, and metrics.
- Authenticated backend-only list and detail endpoints.
- Keyset pagination and bounded filters.
- No direct `anon` or `authenticated` database access.

## API contract

Both endpoints require a valid Clerk bearer token:

```text
GET /api/v1/colleges
GET /api/v1/colleges/:slug
```

List parameters are `q`, `state`, `ownership`, `level`,
`admissionRateMin`, `admissionRateMax`, `enrollmentMin`, `enrollmentMax`,
`limit`, and opaque `cursor`.

The list is ordered by stable slug and uses keyset pagination. `limit` is bounded
to 1–100. Both responses include the active projection version and
`fieldContractStatus: provisional_pending_milestone_0`.

The detail response includes one provenance object per available displayed
field, including source producer, source release, reporting period or academic
year, quality status, suppression state, and retrieval date. Suppressed values
remain null and are labeled `suppressed`.

## Security boundary

- Foundation and projection tables retain RLS and have no client-role grants.
- Projection control functions are private to `service_role`.
- The browser calls the Express backend; the backend verifies Clerk JWTs before
  using its server-only Supabase client.
- The service-role key is never returned to or bundled into the browser.

## Operator commands

```bash
export COLLEGE_DATABASE_URL='<direct-or-session-pooler-postgres-url>'

npm run ingest:college -- project \
  --build-id college-foundation-2026-08-01 \
  --field-manifest-version m0-provisional-v1

npm run ingest:college -- activate-projection \
  --projection-version-id <validated-projection-uuid>
```

Building is idempotent by build ID. Activation takes a row lock on the singleton
control record, retires the prior active version, activates the validated target,
and switches the pointer in one transaction.

## Local verification

```bash
npm run db:college:reset
npm run test:college-schema
npm run test:college-ingestion
npm run test:college-serving
npm run typecheck
npm run typecheck:college-ingestion
```

## Exit gate

Milestone 4 is complete when:

1. The migration replays on a fresh local database.
2. A projection of the real staging releases validates and activates.
3. Profile and provenance counts reconcile and suppressed values remain null.
4. Search/detail queries use bounded, indexed access and meet the staging latency
   budget recorded here.
5. Anonymous and direct authenticated database reads remain blocked.
6. Authenticated API behavior is covered by automated tests.
7. Generated staging types and CI preflight pass.
8. Production remains unchanged pending a separate rollout approval.

## Staging evidence

- Active projection: `abcac548-43d6-43c2-af1d-2313bd7a3eba`
- Build: `college-foundation-2026-08-01-m4-v3`
- Active four-year profiles: 2,706
- Displayed field/provenance records: 43,016, exactly reconciled
- Invalid suppressed values published: 0
- Rejected facts published: 0
- Range anomalies retained in the quality ledger: 8, across one release
- Indexed California list query: 0.493 ms execution on staging
- Indexed detail-plus-provenance query: 0.070 ms execution on staging
- Direct `authenticated` table read: permission denied, as designed

The real-data build exposed and corrected two pre-publication issues: negative
Scorecard values are now retained as rejected `range_error` evidence, and IPEDS
and Scorecard institution-level codes now use source-specific decoders. IPEDS
Directory remains authoritative for canonical identity and institutional level;
Scorecard enriches the metric layer. Both official releases were reprocessed
after the decoder correction before the final projection was activated.

The final 2,706 profiles consist of the 2,694 eligible IPEDS 2023 institutions
plus 12 active four-year Scorecard institutions not present in that older IPEDS
release. The prior projection was atomically retired; an intermediate validated
projection was never activated.
