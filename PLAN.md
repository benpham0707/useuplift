# Wave 2: Deep Content Analysis — Implementation Plan

## New Files
1. `src/pipeline/contentAnalysisTypes.ts` — Types for structure, theme, character, insight analysis
2. `src/pipeline/structureAnalyzer.ts` — Arc detection, beat mapping, pacing
3. `src/pipeline/themeAnalyzer.ts` — Show-don't-tell ratio, cliché detection, thematic coherence
4. `src/pipeline/characterAnalyzer.ts` — Character revelation hierarchy, vulnerability
5. `src/pipeline/insightAnalyzer.ts` — Insight depth scoring, uniqueness
6. `tests/test-wave2-smoke.ts` — Smoke tests (strong + weak essays)

## Modified Files
1. `src/pipeline/types.ts` — Add Wave 2 analysis to `EnrichedFeatures`
2. `src/pipeline/promptBuilder.ts` — Inject deep content analysis into Sonnet prompt
3. `src/pipeline/annotationPipeline.ts` — Run Wave 2 analyzers in Phase 2

## Principles
- Heuristics for counting ONLY — no judgment heuristics
- Build on existing: narrativeAnalyzers, paragraphFunctionClassifier, structuralPatternDetector
- Types first, implementation second
- Signal files (`src/workshop/signals/`) deferred to Wave 3 registry

## Order: Types → Structure → Theme → Character+Insight → Integration → Test
