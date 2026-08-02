# Staging Storage Access Proof

Date: 2026-08-01

Bucket: private `college-source-releases` in staging
`ussnqsnuygqpgldyqtvv`.

A read-only database transaction assumed each API database role and counted the
nine retained IPEDS objects through `storage.objects`:

| Role | Visible objects | Expected |
|---|---:|---:|
| `anon` | 0 | 0 |
| `authenticated` | 0 | 0 |
| `service_role` | 9 | 9 |

There are no permissive policies on `storage.objects`. The private bucket remains
inaccessible to client roles, while the backend role can access the complete
artifact set. The ingestion command additionally refuses remote work unless the
linked project ref is the staging ref and refuses to overwrite an object whose
size or SHA-256 differs from the manifest.

No policy was added to make this test pass, and production Storage was untouched.

