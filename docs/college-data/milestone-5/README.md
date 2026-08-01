# Milestone 5 — Student-facing college discovery

Status: implementation and automated validation complete; signed-in responsive
browser QA remains pending. The field contract is provisional pending Milestone 0
student-session review.

Validation date: 2026-08-01

Milestone 5 connects the versioned serving layer to Uplift's authenticated college
catalog and detail pages. The experience presents official reported facts with
their source context and intentionally makes no ranking, match, or admission
prediction claims.

## Delivered experience

- Authenticated server-side search across college name, city, and state.
- State, ownership, admission-rate, and undergraduate-enrollment filters.
- Stable keyset pagination with a 24-college initial page.
- Responsive college cards using only supported foundation fields.
- Detail pages with field-level source release, reporting period, quality state,
  suppression state, and retrieval provenance.
- Explicit loading, error, empty, unavailable, and suppressed-value states.
- A provisional-field notice while Milestone 0 research is still open.

## Data and security boundary

The browser requests `GET /api/v1/colleges` and
`GET /api/v1/colleges/:slug` with a Clerk bearer token. It never reads the
foundation or projection tables directly. The API resolves the active immutable
projection and returns the official releases attached to that projection.

Missing values are shown as `Unavailable`; suppressed values are labeled as
suppressed. The UI does not estimate either. Institution logos, rankings,
reach/match/safety labels, and manually asserted program strengths are outside
this milestone because the current source contract does not support them.

## Routes

```text
/dashboard/colleges
/dashboard/colleges/:slug
```

The existing saved-college route is not part of Milestone 5 and is not linked
from the new catalog. Saved lists can be reconnected in a later milestone after
their schema and product contract are aligned with the foundation.

## Verification

```bash
npm run typecheck
npm run typecheck:college-ingestion
npm run test:college-schema
npm run test:college-ingestion
npm run test:college-serving
npm run build
```

All six commands passed locally on 2026-08-01. The unauthenticated browser path
was also verified to redirect to Clerk sign-in without exposing catalog data.
Neither available development browser had an active Uplift session, so the
signed-in desktop/mobile visual pass remains the only open Milestone 5 exit gate.

The preview workflow now watches the college UI, API, types, service, tests, and
documentation paths. It replays the database, runs all serving tests, typechecks
the application, builds the production bundle, verifies staging linkage, checks
migration drift, and compares generated staging types.

## Exit gate

Milestone 5 is complete when:

1. The catalog and detail routes consume the authenticated M4 API only.
2. Search, filters, pagination, loading, empty, and failure states work locally.
3. Every detailed fact retains visible source and reporting context.
4. Missing and suppressed values are never silently filled or estimated.
5. Automated schema, ingestion, serving, formatter, type, and build checks pass.
6. The responsive browser experience is visually checked at desktop and mobile
   widths.
7. The staging preview preflight passes without touching production.
8. Milestone 0's field contract is still labeled provisional until its separate
   student-session gate closes.
