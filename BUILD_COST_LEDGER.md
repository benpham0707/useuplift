# Build Cost Ledger

> Append-only record of every Claude API call made during the integrated
> pipeline build (`feat/integrated-pipeline-build`). Enforced by
> `src/services/essayIntelligence/telemetry/buildCostLedger.ts` (D-0.10).
> Cap: $9.00 hard halt, $7.00 warn.

| timestamp | deliverable | model | prompt | fixture | input_tokens | output_tokens | cache_read | cache_write | cost_usd | quality_note | cumulative_usd |
| --------- | ----------- | ----- | ------ | ------- | ------------ | ------------- | ---------- | ----------- | -------- | ------------ | -------------- |
