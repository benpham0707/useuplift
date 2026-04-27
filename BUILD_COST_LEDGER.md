# Build Cost Ledger

> Append-only record of every Claude API call made during the integrated
> pipeline build (`feat/integrated-pipeline-build`). Enforced by
> `src/services/essayIntelligence/telemetry/buildCostLedger.ts` (D-0.10).
> Cap: $9.00 hard halt, $7.00 warn.

| timestamp | deliverable | model | prompt | fixture | input_tokens | output_tokens | cache_read | cache_write | cost_usd | quality_note | cumulative_usd |
| --------- | ----------- | ----- | ------ | ------- | ------------ | ------------- | ---------- | ----------- | -------- | ------------ | -------------- |
| 2026-04-27T12:12:00.842Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 0/5 cases match expectation; total spent $0.0000 | 0.0000 |
| 2026-04-27T12:12:25.287Z |   | claude-sonnet-4-5-20250929 |   |   | 2191 | 148 | 0 | 0 | 0.0088 |   | 0.0088 |
| 2026-04-27T12:12:28.710Z |   | claude-sonnet-4-5-20250929 |   |   | 2119 | 141 | 0 | 0 | 0.0085 |   | 0.0173 |
| 2026-04-27T12:12:32.442Z |   | claude-sonnet-4-5-20250929 |   |   | 2140 | 126 | 0 | 0 | 0.0083 |   | 0.0256 |
| 2026-04-27T12:12:36.271Z |   | claude-sonnet-4-5-20250929 |   |   | 2260 | 154 | 0 | 0 | 0.0091 |   | 0.0347 |
| 2026-04-27T12:12:40.724Z |   | claude-sonnet-4-5-20250929 |   |   | 2189 | 158 | 0 | 0 | 0.0089 |   | 0.0436 |
| 2026-04-27T12:12:40.725Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 0/5 cases match expectation; total spent $0.0436 | 0.0436 |
| 2026-04-27T12:14:44.911Z |   | claude-sonnet-4-5-20250929 |   |   | 2191 | 140 | 0 | 0 | 0.0087 |   | 0.0523 |
| 2026-04-27T12:14:52.642Z |   | claude-sonnet-4-5-20250929 |   |   | 2119 | 125 | 0 | 0 | 0.0082 |   | 0.0605 |
| 2026-04-27T12:14:56.682Z |   | claude-sonnet-4-5-20250929 |   |   | 2140 | 126 | 0 | 0 | 0.0083 |   | 0.0688 |
| 2026-04-27T12:15:02.566Z |   | claude-sonnet-4-5-20250929 |   |   | 2260 | 154 | 0 | 0 | 0.0091 |   | 0.0779 |
| 2026-04-27T12:15:07.166Z |   | claude-sonnet-4-5-20250929 |   |   | 2189 | 158 | 0 | 0 | 0.0089 |   | 0.0868 |
| 2026-04-27T12:15:07.167Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 3/5 cases match expectation; total spent $0.0432 | 0.0868 |
