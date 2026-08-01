# IPEDS 2023 Final Component Ingestion

Ingested to staging on 2026-08-01.

- Project: `ussnqsnuygqpgldyqtvv` (`uplift-staging`)
- Private bucket: `college-source-releases`
- Prefix: `ipeds/2023-final/`
- Objects: 9
- Total compressed bytes: 22,448,412
- Largest object: `C2023_A.zip`, 9,294,160 bytes
- Integrity: exact NCES HTTP size, ZIP test, local SHA-256, remote download
  round-trip SHA-256
- Production mutations: none

The pinned machine-readable manifest is
`scripts/college-data/manifests/ipeds-2023-final.json`.

## Included components

| Component | Purpose | Reporting context | Bytes | SHA-256 |
|---|---|---|---:|---|
| `HD2023` | identity and location | 2023 directory | 1,110,720 | `e11d35af6f50fbe2f51d8ddd5a9d4f49860abbab7d73beae1f8524f13ad8945b` |
| `IC2023` | characteristics and offerings | 2023–24 collection | 381,806 | `1454ab8fc5df34aafb04566351c29ed313350f41bc2a241a33fb4f7b93a044a1` |
| `ADM2023` | admissions/test-score context | fall 2023 | 97,321 | `670ecc7c4313f044dcdf740a42ef10c6d2927eb9f890fb405e3569c8442aca27` |
| `EFFY2023` | 12-month enrollment | 2022–23 | 7,295,855 | `bfc36572b930551f784ebb9c1e428b8f985fa70a80dab2e7c7121bd2c6feb433` |
| `EF2023D` | entering class and retention | fall 2023 | 94,562 | `cfe4267b5b2e2a2ce6ea8c079c64707868c8c5b22372d578959e1726969e0c8c` |
| `C2023_A` | historical program completions | 2022-07-01 to 2023-06-30 | 9,294,160 | `651d95b6405bb86c6c14884ed54225a27492199d21d8acd63cda2581aa60838a` |
| `SFA2223` | aid and net-price context | 2022–23 | 1,913,114 | `144f97dc24492febc772e2aed6c7eb543037ed56274a49cbae0e743cf717e2df` |
| `GR2023` | graduation-rate context | component-defined entry cohorts | 913,058 | `f00c7140d4dbbb056043689aa82835eec5f6101b907b047a2933372505fa54bd` |
| `OM2023` | outcome-measure context | component-defined entering cohort | 1,347,816 | `60a619776e8da60542c9a728b2c2122bcdef6825c76b5b36a40ab243a5d0b504` |

ZIPs containing `_RV` members retain both base and revised CSVs; typed parsing
selects the revised member and records that choice in release metadata. Raw
objects are immutable and are never silently overwritten when NCES changes a
file at the same URL.

## Reproduce

Download and verify without remote writes:

```bash
npm run ingest:ipeds
```

Upload and round-trip verify only after explicitly linking staging:

```bash
npm run ingest:ipeds -- --upload
```

The command refuses remote operations unless `supabase/.temp/project-ref` equals
the staging ref. A byte, SHA-256, ZIP-member, source-domain, or target-ref mismatch
fails closed.
