# Phase 1J — Hopkins Integration Plan

Authored ahead of extraction-swarm completion so integration executes cleanly.

## Preconditions (all met)

- ✅ Tue gave verbal approval ("go ahead as long as it will make our system better")
- ✅ 3 Hopkins quality audits returned PASS (cross-consistency APPROVE)
- ✅ Top-20 correlation audit validated current v2 scoring (SHIP AS-IS)
- ⏳ 4 Hopkins extraction swarms running — output pending
- ⏳ Retrieval-sort audit pending — not blocking integration (Swarm 1 covered main quality question)

## Target files and update plan

### 1. `topTierCraftMoves.ts`
Current: 136 moves, all Harvard-attested.

Actions after extraction returns:
- Append new Hopkins-distinctive moves (~25-35 expected after dedup from 54 raw)
- Merge duplicate moves by adding Hopkins `SourceEssayCitation` entries to existing Harvard moves' `sourceEssays` arrays
- New move count projection: 160-175

### 2. `essayArchetypes.ts`
Current: 14 archetypes — 10 attested + 4 Hopkins `provenance: 'pending-hopkins-reviews'` with empty arrays.

Actions after extraction:
- Hydrate the 4 Hopkins slots (Emily/Shotaro/Nancy/Ellie) with:
  - `description` (1-2 sentences from review framing)
  - `structuralStages` (from review Part I paragraph analysis)
  - `loadBearingMoveIds` (from review Part III pattern cluster membership)
  - `voiceRequirements`
  - `contentRequirements`
  - `whenToUse`/`whenNotToUse`/`commonFailureModes`
  - Change `provenance` to `'fully-attested'`
- Update integrity test CHECK 9 — reserved-count should now be 0

### 3. `moveExcerpts.ts`
Current: 53 excerpts across Harvard moves.

Actions:
- Add 1-2 excerpts per Hopkins review for the highest-anchor moves
- Focus on architectural anchors (e.g., mirror-bookend for Emily, parenthetical-field-catalog for Shotaro, vocabulary-entry-section-header for Nancy, textbook-voice-opening for Ellie)
- Target: +20-40 excerpts

### 4. `voiceArchetypeCompatibility.ts`
Current: 98 cells — Hopkins cells are `reachable`/`risky` PROVISIONAL.

Actions:
- Now that Hopkins archetypes are attested, raise cell ratings per actual review evidence
- Specific upgrades expected:
  - `domain-insider` × `building-a-universe-interdisciplinary-obsession` → `native` (Shotaro's specifications-as-voice is domain-insider)
  - `intellectual-playful` × `ordering-the-disorderly-intellectual-metaphor` → `native` (Ellie's textbook-voice-alternation)
  - `literary-reflective` × `splash-of-color-small-risk-growth` → `native` or `reachable` (Emily's mirror-bookend is literary)
  - `literary-reflective` × `korean-sticky-notes-cultural-reclamation` → `native` or `reachable` (Nancy's verb-pace-change is literary)
- Strengthen rationales from "PROVISIONAL" to cite specific review evidence
- Preserve integrity CHECK 9b — no Hopkins-native was allowed pre-attestation; now that provenance is `fully-attested`, native is permitted

### 5. `readerBiasGuards.ts`
Current: 10 Harvard-aggregated guards.

Actions per Hopkins review reader-bias self-check:
- Emily: topic-bias toward seriousness → new guard if not already covered
- Shotaro: over-rewarding interdisciplinary signal over voice-craft → new guard (distinct from existing "over-rewarding STEM in mixed essays")
- Nancy: over-crediting heritage essays with topic-sincerity → possibly merges with existing "bias toward minority-identity essays regardless of craft"
- Ellie: over-rewarding scientific literacy → new guard or merge with Shotaro's interdisciplinary-signal bias
- Target count: 12-14 total after dedup

### 6. `deliberateAbsences.ts`
Current: 16 absences.

Actions:
- Review each Hopkins essay for absences the reviews name
- Add where distinctive. Examples anticipated:
  - Shotaro never claims mastery — flaws-then-pride architecture
  - Ellie never drops scientific register without signal
  - Nancy's heritage essay never uses "cultural reclamation" or "heritage" as language

### 7. `corpusLimits.ts`
Current: 18 limits.

Actions:
- Each Hopkins archetype gets its `cannotTeachWhen` section (students without matching content/context)
- Expected: +4 archetype-level limits + 2-5 move-level limits for Hopkins-specific moves

### 8. `contextualValidity.ts`
Current: 21 patterns.

Actions:
- Check Hopkins essays for patterns that are clichés elsewhere but earned in context
- Examples to verify in reviews: "splash of color" (cliché generally, earned only in a cosmetics/color context), "building a universe" (cliché, earned only in world-building context)

### 9. `antiArchetypes.ts`
Current: 11.

Actions:
- Review whether Hopkins reviews identified new genre anti-patterns beyond the 11 listed
- Likely few/no additions — these are failure patterns, and Hopkins exemplars don't introduce new failure modes

### 10. `schoolFitVectors.ts`
Current: 15 (2 attested: Harvard + Hopkins).

Actions:
- Hopkins vector already attested — strengthen with specific archetype-affinity scores per review Part V
- Add cross-references: Hopkins archetypes might also fit Stanford (interdisciplinary), UChicago (formal experimentation)
- Update inferred vectors where Hopkins evidence changes the inference

### 11. `derivedCorrelations.json` + `derivedCorrelationsByMove.json`
Regenerate after all moves/archetypes land. Expected outcome:
- New correlations from Hopkins co-occurrence (e.g., Shotaro's parenthetical-field-catalog + specifications-as-voice)
- Cross-corpus correlations where a Hopkins move and a Harvard move co-occur in the same archetype via shared cluster logic
- Strong-tier count will rise (Hopkins load-bearing pairs auto-promote)

### 12. `CORPUS_MANIFEST.md`
Update totals, archetypes-attested count, mark Hopkins integration date.

### 13. Tests
- `test-corpus-integrity.ts`: CHECK 9 updates (no more Hopkins reserved archetypes)
- `test-derivation-correctness.ts`: strong-tier count range bump (new pairs)
- Add CHECK 10: all 14 archetypes are fully-attested

## Consolidation logic (dedup decision tree)

For each Hopkins move, decide:

1. **Same mechanism as existing Harvard move?**
   - YES → merge: add Hopkins `SourceEssayCitation` to existing move's `sourceEssays`
   - NO → continue

2. **Similar to existing move but with distinct specificity?**
   - YES → keep separate with a `relatedMoveIds` note (future schema addition if needed)
   - NO → continue

3. **Genuinely new move?**
   - YES → add as new `CraftMove` entry

## Risk register + mitigations

| Risk | Mitigation |
|---|---|
| Move ID collisions (Hopkins agent proposes ID that already exists) | Extraction prompts include existing ID list; post-merge integrity check validates uniqueness |
| Hopkins moves get added but archetype's `loadBearingMoveIds` references old typo'd IDs | Integrity test CHECK 1 catches |
| Hopkins-attestation correlations regress Harvard strong-tier | Top-20 re-audit after integration (Phase 1K swarm) |
| Reserved-archetype invariant broken during hydration | CHECK 9b still guards against Hopkins × native unless provenance is fully-attested |
| Voice×archetype matrix now under-rates Hopkins cells | Post-integration swarm audits the 28 Hopkins cells against new attested evidence |

## Success criteria (Phase 1J done)

1. All 14 archetypes `provenance: 'fully-attested'`
2. Move catalog grew to 160-175 (projected)
3. Voice×archetype matrix has no remaining PROVISIONAL labels
4. Derivation produces ≥280 strong correlations (current 228 + Hopkins additions)
5. All integrity + derivation + correctness tests pass
6. `tsc --noEmit` clean
7. Post-integration audit swarm returns no regression

## Estimated scope

- 4 extraction swarms return: ~30-45 min total
- Manual integration + dedup: ~2-3 hours of focused editing
- Regenerate + re-test: 10 minutes
- Post-integration audit swarm: 30 min
- Total: ~4 hours from extraction-complete to gates-green
