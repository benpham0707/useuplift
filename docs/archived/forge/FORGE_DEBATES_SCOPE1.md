# FORGE DEBATES — Scope 1: Surgical Prompt/Schema Cleanup

Forced-choice decisions per gap. For each: the Direct position (Agent A: cut dead fields, cap prose), the Rethink position (Agent B: existing infrastructure + compress-then-activate), the decisive evidence from code verification, and the final pick.

---

## GAP-1 — L3 walk sentence craft fields (`craft.rhythm`, `craft.voiceAlignment`)

**Direct position**: Remove both `rhythm` and `voiceAlignment` from the L3 walk schema. L3.75 `voiceMap` subsumes them holistically.

**Rethink position**: `craft.rhythm` IS read downstream; convert from prose description to a compact enum tag taxonomy. Remove only `voiceAlignment`.

**Decisive evidence**:
- `deepAnnotationService.ts:910` actively reads `s.understanding.craft.rhythm`:
  ```typescript
  parts.push(`    Craft: [${s.understanding.craft.techniques.join(', ')}] rhythm=${s.understanding.craft.rhythm ?? 'uncharacterized'}`);
  ```
  This injects the rhythm label into the L5 paragraph prompt when the essay is in craft/polish/distinction phase. The value is used as a label, not parsed — an enum tag fits the consumption exactly.
- `voiceAlignment` grep across `/src` finds ZERO downstream reads (only the parser at `sequentialDeepWalk.ts:1142`, the initializer at line 1137, the fullContextReReader parser at `fullContextReReader.ts:610`, and the mutator write at `sentenceMutator.ts:155-156`). No LLM context builder, no rendering function, no analysis consumer ever reads the stored value.

**Choice**: **hybrid** — convert `rhythm` to a fixed enum vocabulary (`short_punch | medium_flow | long_build | fragment | staccato | anaphora_series | parallel_build | subordinate_delay`), remove `voiceAlignment` from prompt + initializer + parser (keep the field optional on the type for backward compat with stored profiles).

**Rationale (2-3 sentences)**: The strong prior is correct — `rhythm` is only "dead" as a prose description, not as a label. The consumption site already treats it as a single token, so an enum is a pure token reduction with zero information loss at the consumer. `voiceAlignment` has no consumers at all and can be cleanly removed.

---

## GAP-2 — L3.75 voice/emotional fields (`codeSwitching`, `authenticityAssessment`, `emotionalProgression`, `voiceMap.*.observations[]`)

**Direct position**: Remove `codeSwitching`, `authenticityAssessment`, `emotionalProgression`, `showVsTell[]` from the L3.75 schema. Use `peakMoments` count in `phaseAssessment.ts` instead of `showVsTell` count.

**Rethink position**: `emotionalProgression` is NOT dead — it's read at `analysisContextBuilder.ts:248-251` and used substantively in L5 per-paragraph context. Don't remove it. Gate `codeSwitching` generation with a deterministic foreign-text check. Compress `authenticityAssessment` to a single sentence. Cap `showVsTell[]` to a maximum of 4 diagnostic entries.

**Decisive evidence**:
- `analysisContextBuilder.ts:248-264` genuinely consumes `emotionalProgression[]`:
  ```typescript
  const emotionalProg = profile.emotionalTopography?.emotionalProgression ?? [];
  const prevEmotion = emotionalProg.find(p => p.paragraph === pi - 1);
  const hereEmotion = emotionalProg.find(p => p.paragraph === pi);
  const nextEmotion = emotionalProg.find(p => p.paragraph === pi + 1);
  // ...
  if (prevEmotion) arcParts.push(`P${pi - 1}: ${prevEmotion.register}`);
  if (hereEmotion) arcParts.push(`P${pi}: ${hereEmotion.register}${hereEmotion.shift ? ` (${hereEmotion.shift})` : ''}`);
  if (nextEmotion) arcParts.push(`P${pi + 1}: ${nextEmotion.register}`);
  ```
  This feeds into both L3.5 (analysis) and L5 (annotation) paragraph-level context.
- `analysisContextBuilder.ts:253-254` reads `showVsTell[]` content for per-paragraph display:
  ```typescript
  const showTellHere = (profile.emotionalTopography?.showVsTell ?? []).filter(s => s.location[0] === pi);
  ```
- `phaseAssessment.ts:274-276` counts `showVsTell[]` where `assessment === 'shown'`. The count depends on the `assessment` field content.
- `holisticSynthesis.ts:2873` reads `authenticityAssessment` into the understanding prose synthesis context: `EMOTION: ${arcTrajectory}. Authenticity: ${authenticityAssessment || 'not assessed'}`. That prose synthesis is a Sonnet call, so the field is consumed by an LLM.
- `codeSwitching` across `/src/services/essayIntelligence`: only read at `intraDomainValidation.ts:264` for index bounds checking (`loc.paragraph`, `loc.sentence`). The rich content (`language`, `trigger`, `culturalFunction`, `text`) is NEVER surfaced to any LLM or student.
- `voiceMap.register.observations[]` and `voiceMap.sentenceRhythm.observations[]`: only read at `readinessScoring.ts:107-108` as a length check (`> 0` → +5 points).

**Choice**: **refined** — a surgical mix:
- KEEP `emotionalProgression[]` as-is (substantive L5 consumer).
- KEEP `showVsTell[]` but cap to 4 entries (2 best "shown" + 2 worst "told") via prompt instruction — both `analysisContextBuilder.ts` (per-paragraph filter) and `phaseAssessment.ts` (count) still work with 4 entries.
- DROP `codeSwitching[]` from the prompt entirely. Keep the field optional on the type for backward compat. Keep a `?? []` guard in the validator.
- COMPRESS `authenticityAssessment` from a paragraph to a single sentence via prompt instruction (it's still consumed, just over-generated).
- CAP `voiceMap.*.observations[]` to a maximum of 2 entries per dimension via prompt instruction — the readiness check only needs `> 0`.

**Rationale**: The Direct Path would break `analysisContextBuilder.ts` by removing `emotionalProgression` — a silent regression. The Rethink's "keep but compress/gate" strategy preserves all live consumers while cutting over-generation. `codeSwitching` is the one field where full removal is safe because the only reader is a bounds check.

---

## GAP-3 (CRITICAL) — L3.5 `effectivenessReasoning` over-generation

**Direct position**: Add a 2-3 sentence / 60 word cap to `effectivenessReasoning` in the analysis pass prompt. The field is truncated to 120/150 chars at consumption — cut the generation to match.

**Rethink position**: DO NOT cap generation. `effectivenessReasoning` is load-bearing for multiple downstream LLM calls: (a) the anchor calibration re-injection at `analysisPass.ts:212-229`, (b) the full-text `activeConcerns` rendering at `coachingService.ts:2355` (critical concerns surfaced to the coaching LLM), (c) storage for focused re-analysis. The waste is in the re-injection truncation, not in the generation.

**Decisive evidence**:
- `analysisPass.ts:212-213` truncates at 120 chars for anchor display:
  ```typescript
  const reasoning = sa.effectivenessReasoning.slice(0, 120);
  lines.push(`  S${sa.sentenceIndex}: effectiveness=${sa.effectiveness} — "${reasoning}${sa.effectivenessReasoning.length > 120 ? '...' : ''}"`);
  ```
- `analysisPass.ts:227, 229` truncates at 150 chars for strongest/weakest example display.
- BUT `essayProfileManager.ts:2503` stores the FULL text as `concern: analysis.effectivenessReasoning`.
- THEN `coachingService.ts:2355` renders the full `concern` text into the coaching LLM prompt:
  ```typescript
  `  P${c.location[0] + 1}${c.location[1] !== null ? `S${(c.location[1] ?? 0) + 1}` : ''}: ${c.concern}`
  ```
  No truncation here — the full prose is paid for and consumed.
- The scoring prompt at `analysisPass.ts:358-374` explicitly instructs "Reason about effectiveness — AFTER reasoning, not before" — the full reasoning IS the chain of thought that produces the score. Capping it risks degrading scoring accuracy, which propagates to everything downstream.

**Choice**: **rethink** — fix the anchor re-injection, preserve generation. Cap only the two truncation sites (`analysisPass.ts:212-213` and `analysisPass.ts:227, 229`) to use the first sentence (`indexOf('. ')`) instead of a char count. Do NOT add a length cap to the `effectivenessReasoning` prompt instruction.

**Rationale**: The Direct Path would silently degrade L3.5 scoring accuracy by cutting the chain-of-thought, which is then consumed at full length by the coaching LLM anyway. The Rethink is correct: the waste is in the re-injection truncation (which produces mid-word cutoffs), not in the generation. Additionally, cap `strengths[].evidence` and `strengthSignatures[].evidence` in the prompt because those truncations at consumption ARE aligned with the waste (e.g., `renderAnalysisForStudent.ts:209` slices at 60 chars).

---

## GAP-4 — L4 dead score matrix fields (`crossParagraphPatterns`, `emergentPatterns`, `scoreTensions`)

**Direct position**: Remove `crossParagraphPatterns`, `emergentPatterns`, `scoreTensions` from L4 prompts entirely. They have zero downstream reads.

**Rethink position**: These fields are dead at their current prose volume (100-200 tokens each with 4 sub-fields), but could be valuable coaching signals at 10-15 tokens each. Compress to `string[]` format AND activate them as coaching hooks by wiring them into the L5 paragraph prompt.

**Decisive evidence**:
- `crossParagraphPatterns`: grep finds ZERO downstream readers outside `crystallizer.ts` itself. `crystallizer.ts:2030` only logs `.length` for metrics.
- `emergentPatterns` and `scoreTensions`: `crystallizer.ts:2101-2102` only reads `.length > 0` for logging. Content is stored but never rendered anywhere. No L5, no coaching, no render consumer.
- Generation cost per essay (from analysis prompts at `crystallizer.ts:605-607`):
  - `emergentPatterns`: ~3 items × 3 fields × ~25-35 tokens each = 225-315 output tokens
  - `scoreTensions`: ~3 items × 4 fields × ~30-50 tokens each = 360-600 output tokens
  - `crossParagraphPatterns`: ~3 items × 30-50 token prose = 90-150 output tokens

**Choice**: **rethink** — compress and activate.
- `crossParagraphPatterns`: constrain prompt to "max 3 items, each ≤15 words". Wire the array into the L5 `sharedContext` (`deepAnnotationService.ts:711+`) as a coaching signal.
- `emergentPatterns`: change the schema from object array to `string[]`, constrain to "max 3 items, each ≤20 words, format: `'Pattern: {name} — {observation with P refs}'`". Wire into L5 sharedContext.
- `scoreTensions`: change the schema from object array to `string[]`, constrain to "max 3 items, each ≤15 words, format: `'P{n}: {dim1}({score}) >> {dim2}({score}) — {coaching hook}'`". Wire into L5 sharedContext.
- Update `parseCoachingMap()` in `crystallizer.ts:1318-1336` to parse the new string shapes.
- Update `CoachingMap` interface in `profileTypes.ts:1957-1968`.

**Rationale**: The Direct Path throws away signal that was already paid for (L4 spent Sonnet tokens generating it). The Rethink converts waste into utility at ~85% cost reduction per field. This matches the Rule 2 principle from the design docs: "no discarding paid output."

---

## GAP-5 — L5 lacks `stakes` field (AO-framed impact)

**Direct position**: Add a new `stakes: string | null` field to L5Annotation. Have the LLM generate AO-phenomenological framing per annotation.

**Rethink position**: Don't add a new field. `AdmissionsPositioning.archetypeContext` already holds the AO framing (archetype, poolDensity, differentiator). Inject it into the L5 paragraph prompt as CONTEXT and let the LLM reference it in `northStarConnection`.

**Decisive evidence**:
- `profileTypes.ts:921` defines `archetypeContext`:
  ```typescript
  archetypeContext?: {
    archetype: string;           // "sports injury comeback", etc.
    poolDensity: 'saturated' | 'common' | 'moderate' | 'uncommon' | 'rare';
    differentiator: string | null;
  };
  ```
- This is STRUCTURAL admissions data (pool saturation, differentiator), not phenomenological experience. It grounds AO framing but does NOT itself answer "what happens in the AO's head when this sentence is present."
- `ImprovementEntry` at `profileTypes.ts:2390` has `stakes: string` as a first-class field, actively read at `coachingService.ts:4165` into the coaching LLM prompt: `(current.stakes ? \`\n  STAKES: ${current.stakes}\` : '')`. The pattern is ESTABLISHED: `stakes` is a real field that ships to the coaching LLM.
- `renderHolisticContext()` in `deepAnnotationService.ts:1026-1102` does NOT currently render `archetypeContext` — only `tellabilitySummary` and `distinctivenessFactors`. So `archetypeContext` is NOT currently reaching the L5 LLM.

**Choice**: **hybrid** — both inject AND add the field:
1. Render `archetypeContext` into `renderHolisticContext()` so the L5 LLM sees it as grounding context.
2. Add `stakes: string | null` to `L5Annotation` + `RawAnnotation`, mirroring `ImprovementEntry.stakes`.
3. In the L5 system prompt, instruct: "When the archetypeContext is present, frame `stakes` as a phenomenological AO reading experience grounded in the archetype/poolDensity/differentiator. Null for pure strength annotations."

**Rationale**: The Rethink is right that `archetypeContext` should be injected — it's currently orphaned structural data. But the Rethink is wrong that this replaces a generated `stakes` field: `archetypeContext` is static structural data (what GENRE this essay is) while `stakes` is per-annotation phenomenological framing (what the AO experiences AT THIS sentence). They complement each other. Mirroring `ImprovementEntry`'s existing `stakes` field pattern keeps the system consistent.

---

## GAP-6 — L5 `rewriteExample` only 30-50% coverage for ACTION mode

**Direct position**: Add a prompt rule: "For ACTION mode, rewriteExample is REQUIRED; if you can't produce one, change the mode to CONSEQUENCE." Inject `detectTellingPhrases` matches as scaffolds.

**Rethink position**: The LLM fails to produce rewrites because it's inventing from scratch. Pre-enrich the L5 paragraph prompt with `TRANSFORMATION_EXAMPLES` scaffolds matched by the paragraph's telling phrases. The LLM's job becomes "adapt this scaffold" instead of "invent a rewrite."

**Decisive evidence**:
- `teachingContentRouter.ts:198-247` exports `detectTellingPhrases(essayText, maxMatches)` that returns `TeachingContentMatch[]` — each match's `content` field ALREADY contains a BEFORE/AFTER/TECHNIQUE block assembled from `TRANSFORMATION_EXAMPLES`:
  ```typescript
  let content = `TELLING PHRASE DETECTED: "${phrase}" (${category.replace(/_/g, ' ')})`;
  if (example) {
    content += `\n  BEFORE: "${example.before.text}"` +
               `\n  AFTER: "${example.after.text}"` +
               `\n  TECHNIQUE: ${example.primaryCraftMove.replace(/_/g, ' ')}`;
  }
  ```
- `TRANSFORMATION_EXAMPLES` at `commonAppWorkshop/data/transformationExamples.ts` has 14 concrete before/after pairs tagged with `primaryCraftMove`, `tellingIndicators[]`, etc.
- The function is already lazy-loaded and cached; zero LLM cost.
- The current L5 prompt at `deepAnnotationService.ts:594-595` contains the escape hatch: "A null rewrite with strong teachingRationale beats a generic rewrite."
- Neither `detectTellingPhrases` nor `TRANSFORMATION_EXAMPLES` are currently imported anywhere in `deepAnnotationService.ts` — the infrastructure exists but is not wired.

**Choice**: **rethink** — pre-call enrichment via `detectTellingPhrases`.
- In `annotateParagraph()`, call `await detectTellingPhrases(paraText, 2)` before building the paragraph prompt.
- If matches exist, inject them into the paragraph prompt as `REWRITE SCAFFOLDS`.
- In the system prompt, change the rewriteExample instruction: "If DETECTED TELLING PHRASES are present above for this paragraph, your rewriteExample MUST adapt one of those scaffolds. For ACTION mode without detected phrases, still produce a rewrite — do not fall back to null."
- Keep the "change mode to CONSEQUENCE" escape hatch as a softer constraint (the LLM still has a fallback) but remove the "null beats generic" permission.

**Rationale**: The problem isn't that the LLM refuses to write rewrites — it's that inventing a structurally aware rewrite is genuinely hard. Pre-enrichment turns the task from "invent" to "adapt," which LLMs do reliably. Zero marginal LLM cost; the infrastructure already exists and is idle.

---

## GAP-7 — L5 lacks `wordEconomyCut` field

**Direct position**: Add `wordEconomyCut: string | null` to `L5Annotation`, generated by the LLM per annotation when the rewrite adds net words.

**Rethink position**: `wordEconomyCut` should be computed deterministically, not LLM-generated. Build a `computeWordEconomyDiagnostics()` function that detects filler patterns and long sentences and injects hints into the L5 paragraph prompt for Polish/Distinction phases only.

**Decisive evidence**:
- `ImprovementEntry.wordEconomyCut` already exists at `profileTypes.ts:2396` as `string | null`.
- `analysisOrchestrator.ts:1616-1622` already computes `wordEconomyCut` DETERMINISTICALLY for improvement items:
  ```typescript
  if (role.weight === 'supporting' || role.role.toLowerCase().includes('redundant')) {
    for (const item of items) {
      if (!item.wordEconomyCut && item.paragraph !== role.paragraphs[0]) {
        const cutParaIdx = role.paragraphs[0];
        const cutParaWords = profile.paragraphs[cutParaIdx]?.text.split(/\s+/).length ?? 0;
        item.wordEconomyCut = `Cut P${cutParaIdx + 1} (${cutParaWords} words — ${role.role}). Use the space for this improvement.`;
        break;
      }
    }
  }
  ```
- `coachingService.ts:4146-4148` reads `current.wordEconomyCut` into the coaching LLM prompt, establishing the pattern.
- The deterministic approach has one clear advantage: it can reference the actual paragraph text and word count, which the L5 LLM does not always know (word count isn't currently injected).

**Choice**: **hybrid** — both a deterministic pre-call hint AND a field on `L5Annotation`.
1. Add `wordEconomyCut: string | null` to `L5Annotation` and `RawAnnotation` (mirrors `ImprovementEntry`).
2. Compute filler-pattern detection and sentence-length diagnostics pre-call for Polish/Distinction phases (`computeWordEconomyDiagnostics()` per-paragraph).
3. Inject the diagnostics into the paragraph prompt as context: "Pre-detected wordiness signals for this paragraph: {list}. When your rewriteExample adds net words, populate wordEconomyCut with a specific cut suggestion."
4. Leave the actual `wordEconomyCut` string generation to the LLM (the LLM can combine the diagnostic + the rewrite context to propose a meaningful cut targeting a sentence the rewrite renders redundant).

**Rationale**: Pure-deterministic (Rethink) misses the key insight — the cut should be chosen based on what the rewrite makes redundant, which is semantic judgment the LLM is better at. Pure-LLM (Direct) wastes tokens on wordiness detection the system can do for free. The hybrid uses deterministic detection as a PROMPT HINT while the LLM makes the semantic cut decision.

---

## GAP-8 — L5 lacks `antiPatternExample` field

**Direct position**: Add `antiPatternExample: string | null` to `L5Annotation`. The LLM quotes the exact 5-12 word bad phrase.

**Rethink position**: The matched phrase from `detectTellingPhrases()` IS the anti-pattern. No new field needed — inject the detected phrase as prompt context that shapes the annotation's `content`.

**Decisive evidence**:
- `detectTellingPhrases()` returns exact matched phrases from `TELLING_PHRASE_PATTERNS` (33 patterns like `'taught me resilience'`, `'deeply passionate'`, `'fingers danced'`).
- The matched phrase is verified to be in the essay text via the `textLower.includes(phrase)` check.
- The Rethink's "no field" approach loses the structured surfacing: an anti-pattern baked into `content` prose cannot be highlighted/styled in the UI separately from the teaching text.
- `ImprovementEntry` does NOT have an anti-pattern field — but `ImprovementEntry.observation` is plain prose, not a structured UI element. L5 annotations have rich UI rendering that benefits from structured fields.

**Choice**: **hybrid** — pre-call enrichment (from Rethink) + schema field (from Direct).
1. Add `antiPatternExample: string | null` to `L5Annotation` + `RawAnnotation`.
2. In the pre-call enrichment (GAP-6 infrastructure), extract the matched phrase separately (not buried in `content`) and inject as: `DETECTED ANTI-PATTERN PHRASES: '${phrase1}', '${phrase2}' — if you annotate at a location containing one of these, set antiPatternExample to the exact phrase.`
3. In the system prompt: "antiPatternExample: quote the exact 5-12 word problematic phrase. Use pre-detected phrases from the enrichment block when present. Null for strength/structural annotations."

**Rationale**: The matched phrase is already being computed (shared infrastructure with GAP-6); surfacing it as a distinct annotation field costs ~5-10 tokens and gives the UI a structured element to render. The Rethink's "no field" approach wastes the structured data by burying it in prose.

---

## GAP-9 — L5 lacks `transferablePrinciple` field (named technique vocabulary)

**Direct position**: Inject the 20 `TECHNIQUE_ROUTES` names into the L5 system prompt (Block 1, cached) as a controlled vocabulary. Have the LLM self-match each annotation to the closest technique.

**Rethink position**: Don't inject vocabulary into the prompt — use `TECHNIQUE_ROUTES` as a POST-CALL tagger. Run the existing `matchClaimToTechnique()` routing logic on the generated `content` field and prepend the technique name to `capacityBuildingNote`.

**Decisive evidence**:
- `TECHNIQUE_ROUTES` at `coachingService.ts:104-232` has 20 named techniques with `claimKeywords: string[]` for matching.
- `analysisOrchestrator.ts:1639-1664` already has a private `matchClaimToTechnique()` function that does keyword routing — used to populate `ImprovementEntry.technique`. But it's a SUBSET (14 routes) of the full 20 in coachingService.
- `ImprovementEntry.technique: string | null` at `profileTypes.ts:2392` is the established pattern; it's actively read at `coachingService.ts:4151, 4166`.
- The routing logic is pure keyword matching — ~15 lines of code. No LLM cost.
- Post-call tagging has one clear downside: keyword matching misses semantic matches (e.g., "narrating from the clouds" would not match the `summary` keyword route even though it's semantically `SUMMARY-TO-SCENE`). LLM self-matching with a vocabulary list would catch these.
- However, the LLM might also make semantic drift errors (applying `VOICE COMPARISON` when the annotation is about voice consistency, not two-sentence comparison).

**Choice**: **rethink** — post-call tagger.
1. Extract the `matchClaimToTechnique()` pattern (keyword-based) into a shared helper `src/services/essayIntelligence/coaching/techniqueMatcher.ts` that exports a pure function based on the full 20-route list.
2. Add `transferablePrinciple: string | null` to `L5Annotation` (mirrors `ImprovementEntry.technique`).
3. In `validateAnnotations()` at `deepAnnotationService.ts:1493-1524`, after building each L5Annotation, run the matcher against `ann.content + ' ' + (ann.capacityBuildingNote ?? '')` and populate `transferablePrinciple` with the result.
4. No prompt injection, no new LLM cost, no vocabulary bloat in Block 1.

**Rationale**: The Rethink is correct that this is a routing problem, not a generation problem. The routing is already established (`analysisOrchestrator` uses it for `ImprovementEntry`). Extending the existing helper to cover all 20 routes and running it post-call on L5 annotations is the lowest-cost, most consistent approach. Keyword matching misses some semantic cases, but the `capacityBuildingNote` field already carries the freeform transferable insight — `transferablePrinciple` is just the named label, which is fine as a tag.

---

## GAP-10 — L3.5 `effectivenessReasoning` over-generation (duplicate of GAP-3)

**Direct position**: Subsumed by GAP-3. Same cap strategy.

**Rethink position**: Subsumed by GAP-3. Same consumption-site fix.

**Choice**: **covered by GAP-3**. No separate implementation. GAP-3's anchor re-injection fix handles the waste at the consumption site without degrading L3.5 scoring accuracy or breaking the `activeConcerns` coaching consumer.

---

## Summary table

| Gap | Direct | Rethink | Choice | Decisive evidence |
|-----|--------|---------|--------|-------------------|
| 1   | Remove both | Enum rhythm, drop voiceAlignment | **hybrid** | deepAnnotationService.ts:910 reads rhythm |
| 2   | Remove 4 fields | Keep emotionalProgression, gate/compress others | **refined** | analysisContextBuilder.ts:248-264 reads emotionalProgression |
| 3   | Cap generation | Fix anchor re-injection | **rethink** | coachingService.ts:2355 consumes full reasoning |
| 4   | Delete dead fields | Compress + activate | **rethink** | Only used in .length logging |
| 5   | New stakes field | Inject archetypeContext | **hybrid** | ImprovementEntry.stakes is established pattern |
| 6   | Prompt rule | Pre-call TRANSFORMATION_EXAMPLES enrichment | **rethink** | detectTellingPhrases already has scaffolds |
| 7   | New LLM field | Deterministic post-processor | **hybrid** | ImprovementEntry.wordEconomyCut is established |
| 8   | New LLM field | Inject detected phrase | **hybrid** | detectTellingPhrases produces exact matches |
| 9   | Vocabulary in prompt | Post-call routing | **rethink** | matchClaimToTechnique already exists |
| 10  | — | — | Subsumed by GAP-3 | Same field |
