# Supabase Environment Registry

No credentials belong in this file.

| Role | Project name | Project ref | Organization | Region | Compute | Mutation policy |
|---|---|---|---|---|---|---|
| Production | `uplift` | `zclaplpkuvxkrdwsgrul` | `B&T` | `us-west-1` | existing | No college-foundation mutation until every preview gate passes |
| Staging | `uplift-staging` | `ussnqsnuygqpgldyqtvv` | `B&T` | `us-west-1` | micro | College migrations, ingestion proofs, and destructive reset tests occur here first |

Staging is the required target for `benpham/college-database`, but this repository
incorrectly tracks generated `supabase/.temp/` files whose branch baseline points
to production. Never infer the target from checked-in temp state. Explicitly link
and verify staging immediately before any remote command, then keep generated temp
changes out of commits. Removing `.temp/` from Git tracking requires a separately
reviewed repository-hygiene change.

## Secret locations

- Staging database password: macOS Keychain service
  `com.useuplift.supabase.staging.db-password`, account
  `ussnqsnuygqpgldyqtvv`.
- GitHub Actions `Preview` environment: encrypted `SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_PROJECT_ID`, and `SUPABASE_DB_PASSWORD` are configured. Values are not
  repository secrets and are not committed.
- Frontend publishable keys and server secret/service keys must remain distinct;
  never expose a secret/service key through a `VITE_` variable.

## Staging resources

- Private bucket: `college-source-releases`
- Bucket object limit: 128 MB
- Allowed MIME types: ZIP, CSV, JSON, and generic binary
- Effective global upload limit: below 67,487,516 bytes, proven by HTTP 413
- Current retained source objects: 9 immutable IPEDS 2023 final/revised component
  ZIPs under `ipeds/2023-final/`, totaling 22,448,412 bytes
- Capacity result: component strategy passed; the 67,487,516-byte monolithic
  package remains intentionally excluded after the measured HTTP 413

## Local commands

Retrieve the staging database password without printing it:

```bash
security find-generic-password \
  -a ussnqsnuygqpgldyqtvv \
  -s com.useuplift.supabase.staging.db-password \
  -w
```

Do not paste the result into documentation, shell history, issue trackers, or chat.

Before any staging operation:

```bash
STAGING_DB_PASSWORD="$(security find-generic-password \
  -a ussnqsnuygqpgldyqtvv \
  -s com.useuplift.supabase.staging.db-password \
  -w)"
supabase link \
  --project-ref ussnqsnuygqpgldyqtvv \
  --password "$STAGING_DB_PASSWORD"
test "$(sed -n '1p' supabase/.temp/project-ref)" = "ussnqsnuygqpgldyqtvv"
```

This preflight is mandatory before `db query`, `db dump`, Storage, migration, or
function commands. Production mutations remain prohibited by the milestone gate.
