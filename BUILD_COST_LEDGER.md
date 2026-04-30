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
| 2026-04-27T12:54:51.696Z |   | claude-sonnet-4-5-20250929 |   |   | 3228 | 141 | 0 | 0 | 0.0118 |   | 0.0986 |
| 2026-04-27T12:54:55.110Z |   | claude-sonnet-4-5-20250929 |   |   | 3156 | 138 | 0 | 0 | 0.0115 |   | 0.1101 |
| 2026-04-27T12:54:58.833Z |   | claude-sonnet-4-5-20250929 |   |   | 3177 | 125 | 0 | 0 | 0.0114 |   | 0.1215 |
| 2026-04-27T12:55:03.822Z |   | claude-sonnet-4-5-20250929 |   |   | 3297 | 139 | 0 | 0 | 0.0120 |   | 0.1335 |
| 2026-04-27T12:55:08.058Z |   | claude-sonnet-4-5-20250929 |   |   | 3226 | 148 | 0 | 0 | 0.0119 |   | 0.1454 |
| 2026-04-27T12:55:08.059Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 5/5 cases match expectation; total spent $0.0586 | 0.1454 |
| 2026-04-27T12:56:34.278Z |   | claude-sonnet-4-5-20250929 |   |   | 3228 | 141 | 0 | 0 | 0.0118 |   | 0.1572 |
| 2026-04-27T12:56:38.064Z |   | claude-sonnet-4-5-20250929 |   |   | 3156 | 136 | 0 | 0 | 0.0115 |   | 0.1687 |
| 2026-04-27T12:56:41.627Z |   | claude-sonnet-4-5-20250929 |   |   | 3177 | 125 | 0 | 0 | 0.0114 |   | 0.1801 |
| 2026-04-27T12:56:45.134Z |   | claude-sonnet-4-5-20250929 |   |   | 3297 | 144 | 0 | 0 | 0.0121 |   | 0.1922 |
| 2026-04-27T12:56:51.295Z |   | claude-sonnet-4-5-20250929 |   |   | 3186 | 170 | 0 | 0 | 0.0121 |   | 0.2043 |
| 2026-04-27T12:56:55.360Z |   | claude-sonnet-4-5-20250929 |   |   | 3260 | 169 | 0 | 0 | 0.0123 |   | 0.2166 |
| 2026-04-27T12:57:00.576Z |   | claude-sonnet-4-5-20250929 |   |   | 3175 | 135 | 0 | 0 | 0.0115 |   | 0.2281 |
| 2026-04-27T12:57:03.503Z |   | claude-sonnet-4-5-20250929 |   |   | 3187 | 116 | 0 | 0 | 0.0113 |   | 0.2394 |
| 2026-04-27T12:57:08.123Z |   | claude-sonnet-4-5-20250929 |   |   | 3276 | 176 | 0 | 0 | 0.0125 |   | 0.2519 |
| 2026-04-27T12:57:13.639Z |   | claude-sonnet-4-5-20250929 |   |   | 3226 | 155 | 0 | 0 | 0.0120 |   | 0.2639 |
| 2026-04-27T12:57:13.640Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 9/10 cases match expectation; total spent $0.1185 | 0.2639 |
| 2026-04-27T13:32:48.303Z |   | claude-sonnet-4-5-20250929 |   |   | 3414 | 140 | 0 | 0 | 0.0123 |   | 0.2762 |
| 2026-04-27T13:32:51.874Z |   | claude-sonnet-4-5-20250929 |   |   | 3342 | 138 | 0 | 0 | 0.0121 |   | 0.2883 |
| 2026-04-27T13:32:55.625Z |   | claude-sonnet-4-5-20250929 |   |   | 3363 | 119 | 0 | 0 | 0.0119 |   | 0.3002 |
| 2026-04-27T13:32:59.370Z |   | claude-sonnet-4-5-20250929 |   |   | 3483 | 146 | 0 | 0 | 0.0126 |   | 0.3128 |
| 2026-04-27T13:33:05.395Z |   | claude-sonnet-4-5-20250929 |   |   | 3372 | 185 | 0 | 0 | 0.0129 |   | 0.3257 |
| 2026-04-27T13:33:11.189Z |   | claude-sonnet-4-5-20250929 |   |   | 3446 | 172 | 0 | 0 | 0.0129 |   | 0.3386 |
| 2026-04-27T13:33:14.933Z |   | claude-sonnet-4-5-20250929 |   |   | 3361 | 149 | 0 | 0 | 0.0123 |   | 0.3509 |
| 2026-04-27T13:33:17.850Z |   | claude-sonnet-4-5-20250929 |   |   | 3373 | 112 | 0 | 0 | 0.0118 |   | 0.3627 |
| 2026-04-27T13:33:26.487Z |   | claude-sonnet-4-5-20250929 |   |   | 3462 | 148 | 0 | 0 | 0.0126 |   | 0.3753 |
| 2026-04-27T13:33:30.952Z |   | claude-sonnet-4-5-20250929 |   |   | 3412 | 161 | 0 | 0 | 0.0127 |   | 0.3880 |
| 2026-04-27T13:33:30.953Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 9/10 cases match expectation; total spent $0.1241 | 0.3880 |
| 2026-04-27T14:39:25.070Z |   | claude-sonnet-4-5-20250929 |   |   | 3414 | 142 | 0 | 0 | 0.0124 |   | 0.4004 |
| 2026-04-27T14:39:28.346Z |   | claude-sonnet-4-5-20250929 |   |   | 3342 | 142 | 0 | 0 | 0.0122 |   | 0.4126 |
| 2026-04-27T14:39:31.441Z |   | claude-sonnet-4-5-20250929 |   |   | 3363 | 119 | 0 | 0 | 0.0119 |   | 0.4245 |
| 2026-04-27T14:39:38.223Z |   | claude-sonnet-4-5-20250929 |   |   | 3483 | 153 | 0 | 0 | 0.0127 |   | 0.4372 |
| 2026-04-27T14:39:42.115Z |   | claude-sonnet-4-5-20250929 |   |   | 3372 | 136 | 0 | 0 | 0.0122 |   | 0.4494 |
| 2026-04-27T14:39:45.799Z |   | claude-sonnet-4-5-20250929 |   |   | 3446 | 152 | 0 | 0 | 0.0126 |   | 0.4620 |
| 2026-04-27T14:39:49.273Z |   | claude-sonnet-4-5-20250929 |   |   | 3352 | 119 | 0 | 0 | 0.0118 |   | 0.4738 |
| 2026-04-27T14:39:55.629Z |   | claude-sonnet-4-5-20250929 |   |   | 3373 | 116 | 0 | 0 | 0.0119 |   | 0.4857 |
| 2026-04-27T14:40:00.303Z |   | claude-sonnet-4-5-20250929 |   |   | 3462 | 148 | 0 | 0 | 0.0126 |   | 0.4983 |
| 2026-04-27T14:40:04.646Z |   | claude-sonnet-4-5-20250929 |   |   | 3412 | 161 | 0 | 0 | 0.0127 |   | 0.5110 |
| 2026-04-27T14:40:04.647Z | D-1.5 | claude-sonnet-4-5-20250929 | landingDetector.prompt | calibration-summary | 0 | 0 |   |   | 0.0000 | D-1.5 calibration summary: 10/10 cases match expectation; total spent $0.1230 | 0.5110 |
| 2026-04-30T07:55:00.000Z | D-1.18 | n/a | n/a | phase-1-closure | 0 | 0 |   |   | 0.0000 | Phase 1 closure: cumulative API spend $0.5110 / $1.00 mid-Phase-1 threshold (51.1%); $9.00 hard cap untouched (5.7%). Only D-1.5 was API-touching across 18 deliverables + 5 audit-driven prerequisites. D-1.6.5 / D-1.6.6 / D-1.16-prefix / D-1.15.0 / D-1.15.x / D-1.16 / D-1.17 all zero-API per the mock-LLM + integration-spine architectural decisions ratified in their respective audits. | 0.5110 |
