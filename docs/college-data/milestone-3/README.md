# Milestone 3 — Typed foundation ingestion

Status: complete on college staging; production was not modified.

## Delivered

- Streaming, source-specific parsers for IPEDS HD and the College Scorecard
  institution release.
- A pinned source manifest with exact URL, byte size, SHA-256, and ZIP member.
- Immutable private artifact storage with a staging-project guard.
- Transactional PostgreSQL `COPY` into private staging tables.
- An atomic, idempotent promotion function that reconciles row counts and blocks
  promotion when unresolved blocking quality issues exist.
- Separate ingestion jobs and attempts so retry evidence is retained.
- Parser fixtures for nulls, privacy suppression, inactive institutions, schema
  drift, and conflicting identifiers.
- SQL tests for grants, atomic promotion, blocking issues, and idempotency.

The old `scripts/seed-colleges.ts` path is retained only for historical context
and is explicitly marked as superseded.

## Pinned releases

| Source | Release | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| IPEDS HD | 2023 final | 1,110,720 | `e11d35af6f50fbe2f51d8ddd5a9d4f49860abbab7d73beae1f8524f13ad8945b` |
| College Scorecard institution | 2026-06-10 | 23,559,465 | `f56a181b000ca4914e924c16b6b81dcc656e25aeb2ac68ab7d271ac0f29ffd58` |

The Scorecard artifact is stored in the staging project's private
`college-source-releases` bucket at
`scorecard/2026-06-10/Most-Recent-Cohorts-Institution.zip`. A download from that
path matched both the pinned byte count and SHA-256.

## Staging proof

| Source | Job | Read | Accepted | Rejected | Promoted institutions | Promoted metrics |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| IPEDS HD | `62168448-513a-4f00-bc01-cecd4ab6ccf4` | 6,163 | 6,163 | 0 | 2,694 | 0 |
| Scorecard | `5e68acda-f0bf-4180-b0cf-02a67ca6cb4d` | 6,273 | 6,273 | 0 | 4,455 | 31,698 |

The Scorecard job staged 37,738 metric observations. Promotion joined 31,698
to eligible institutions. Running promotion a second time returned
`already_succeeded` and left the fact count unchanged.

A deliberately truncated Scorecard ZIP failed checksum/byte validation before
any database write; the metric fact count remained unchanged.

## Operator commands

Set `COLLEGE_DATABASE_URL` to a direct PostgreSQL connection for the intended
environment. The CLI refuses storage operations unless the linked project is
the configured staging project.

```bash
npm run ingest:college -- validate --source ipeds-hd-2023 --artifact /path/to/HD2023.zip
npm run ingest:college -- load --source ipeds-hd-2023 --artifact /path/to/HD2023.zip --dry-run
npm run ingest:college -- load --source ipeds-hd-2023 --artifact /path/to/HD2023.zip
npm run ingest:college -- promote --job-id <job-uuid>
npm run ingest:college -- audit --job-id <job-uuid>
```

Use the `download` or `store` command with `--upload` only when deliberately
adding a pinned release to staging storage.

## Verification

```bash
npm run typecheck
npm run typecheck:college-ingestion
npm run test:college-ingestion
npm run db:college:reset
npm run test:college-schema
```

The preview workflow repeats the local schema, parser, promotion, grant, remote
migration, and generated-type checks against the staging boundary.

## Deferred

Program-level parent/child institution allocation is a follow-on data-modeling
task. This milestone intentionally establishes the institution foundation first.
