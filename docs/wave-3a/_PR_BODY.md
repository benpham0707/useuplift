## Summary

- **Phase 3B** — Structured JSONL telemetry persistence for corpus retrieval (replaces console-log-only). Feature-flag-gated, silent-fail, configurable path.
- **Phase 3C** — Corpus retrieval wired into L3 (walk), L3.75 (synthesis), L4 (crystallizer), L5 (annotations), L6 (coaching, opt-in). Each layer has independent feature flag with cascade semantics from the master `ENABLE_CORPUS_RETRIEVAL_L35`.
- **Architectural cleanups** — retrieval helpers accept stage-tag parameter (no post-hoc mutation); L3/L3.75 use new `buildDescriptiveArchetypesBlock` (no calibration language) to preserve Understanding-layer framing; attribution detection extended from L3.5 to L4/L5/L6.

## What's gated behind a flag

Everything. All wiring defaults OFF at merge → zero production behavior change. Per-layer flags in `src/services/essayIntelligence/analysis/corpusRetrievalBlocks.ts`:

| Env var | Default | Cascade |
|---|---|---|
| `ENABLE_CORPUS_RETRIEVAL_L35` | OFF | master — enables L3/L3.75/L3.5/L4/L5 when unset at layer level |
| `ENABLE_CORPUS_RETRIEVAL_L3` | inherit | set `false` = kill switch |
| `ENABLE_CORPUS_RETRIEVAL_L375` | inherit | set `false` = kill switch |
| `ENABLE_CORPUS_RETRIEVAL_L4` | inherit | set `false` = kill switch |
| `ENABLE_CORPUS_RETRIEVAL_L5` | inherit | set `false` = kill switch |
| `ENABLE_CORPUS_RETRIEVAL_L6` | OFF | **opt-in only** — does NOT inherit master (coaching latency) |

## Tests

- `tests/corpus/test-phase3a-blocks.ts` — 28/28 ✅ (pre-existing, re-verified)
- `tests/corpus/test-phase3b-telemetry-persistence.ts` — 29/29 ✅ (new)
- `tests/corpus/test-phase3c-wiring.ts` — 45/45 ✅ (new)
- Type check: `npx tsc --noEmit` ✅
- **Single-fixture Checkpoint 3 smoke**: ran against live API. Treatment arm completed L1→L3 with corpus retrieval firing (telemetry JSONL record written with correct schema, stage tags, latency). Caught a real bug in `runGrowthCycle` during the smoke (out-of-scope `input` reference — compile-clean due to project's `strict: false` tsconfig); fixed in this PR.

## Known blocker (not introduced by this PR)

Both control and treatment arms of Checkpoint 3 fail identically at `L3.75 Phase B` with `Missing sections: admissionsPositioning, entanglements`. This reproduces with the feature flag **OFF** → pre-existing bug unrelated to corpus work. Full diagnosis + fix candidates in `docs/wave-3a/PHASE_3B_3C_SMOKE_FINDINGS.md`. Once resolved (a separate ticket), the full 8-fixture Checkpoint 3 A/B runs via `tests/corpus/run-checkpoint3-ab.ts` with zero code changes on this branch.

## Observability

Once a flag is flipped on in any environment, structured telemetry lands at `logs/corpus-telemetry.jsonl` (or `$CORPUS_TELEMETRY_PATH`). Per-record schema includes: essayId, layer, retrievalAttempts (by stage), attributionTest (movesReferenced / antiPatternsReferenced / fabricatedReferences), fallbacksTriggered, totalLatencyMs, corpusBlockTokens. Aggregation with standard `jq` pipelines.

## Test plan

- [ ] Reviewer: read `docs/wave-3a/PHASE_3A_L35_INTEGRATION_SPEC.md` (updated with 3B + 3C sections) for the contract.
- [ ] Reviewer: skim `docs/wave-3a/PHASE_3B_3C_SMOKE_FINDINGS.md` for what the live smoke actually validated.
- [ ] Merge with flags OFF — verify zero behavior change in staging.
- [ ] (Post-L3.75 fix) Run `npx tsx tests/corpus/run-checkpoint3-ab.ts` for the full 8-fixture A/B. Budget: ~$16-32 in API cost.
- [ ] (Post-A/B) Read `tests/output/checkpoint3/report.md`. Make ship call on flags.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
