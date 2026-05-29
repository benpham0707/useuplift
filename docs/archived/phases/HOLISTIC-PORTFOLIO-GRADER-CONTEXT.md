# Holistic Portfolio Grader & Analysis — Context Document (Asteria)

Version: 1.0.0
Date: 2025-11-06
Status: Working Draft (Comprehensive overview for implementation)

---

## Goals
- Build a holistic grader that evaluates a student's entire application portfolio: essays (incl. UC PIQs and supplements), extracurriculars/experiences, academics, personal info/context, goals/aspirations, recognitions/support, and growth.
- Provide rigorous, explainable scoring and coaching across the whole portfolio, not just single artifacts.
- Ensure data integrity, privacy, and explainability. Use deterministic evaluation where possible and track rubric/prompt versions.

## Scope
- In scope: Data ingestion, normalization, schema-driven storage, analysis engines (essay + extracurricular + cross-portfolio), coaching outputs, caching, history, and API/Edge integrations.
- Out of scope (initially): Teacher recommendations and third-party uploads unless represented in existing schema; real-time collaborative editing.

---

## Data Model Overview (Supabase/Postgres)

Key tables and enums (see migrations for full definitions):

- essays (essay drafts, metadata, versioning)
- essay_analysis_reports (rubric scores, EQI, flags, elite patterns)
- essay_coaching_plans (outlines, micro-edits, rewrites, elicitation, guardrails)
- application_sets (grouping essays for cross-essay coherence)
- essay_set_membership (junction between essays and sets)
- essay_revision_history (audit trail of versions)
- profiles (user-level profile, demographics, completion tracking)
- personal_information (normalized personal info)
- academic_journey (courses/tests/GPAs etc.)
- experiences_activities (work, volunteer, extracurriculars, projects, honors)
- family_responsibilities (context & constraints)
- goals_aspirations (target goals, majors, preferences)
- personal_growth (meaningful experiences, context)
- support_network (teachers, counselors, docs)
- portfolio_analytics (holistic portfolio assessment cache)
- portfolio_analytics_history (append-only changes over time)

Reference migrations:
- 2025-11-05_create_essay_system.sql
- 2025-08-24_expand_profiles_for_wizards.sql
- 2025-08-31_create_portfolio_analytics.sql
- 2025-08-31_create_portfolio_analytics_history.sql
- schema.sql (context reference)

Row Level Security (RLS) policies are enabled on key tables. Ensure API access patterns respect those constraints.

### Essays and Analysis
- Enum types: essay_type, impression_label, voice_style, analysis_depth
- essays: draft_original, draft_current, essay_type (includes 'uc_piq'), target_school, intended_major, versioning, indices, FTS, RLS.
- essay_analysis_reports: stores rubric version, analysis depth, EQI (0–100), impression_label, dimension_scores (array), weights, flags, prioritized_levers, elite_pattern_profile, token_usage; indices and RLS.
- essay_coaching_plans: stores goal statement, coaching depth, outline_variants, micro_edits, rewrites_by_style, elicitation_prompts, guardrails, word_budget_guidance, token_usage, acceptance/feedback; indices and RLS.
- application_sets + essay_set_membership: supports cross-essay coherence (voice fingerprint, fact graph, motif map, cohesion score and alerts).
- essay_revision_history: auto-incremented versioning with content snapshot, word counts, linkage to coaching plans.
- Views: essay_latest_analysis, essay_latest_coaching, essays_with_latest_reports for efficient reads.

### Experiences & Activities
- experiences_activities: jsonb columns for work_experiences, volunteer_service, extracurriculars, personal_projects, academic_honors, formal_recognition, leadership_roles; FK to profiles; timestamps.
- Frontend types mirror these payloads and are used in the wizards and portfolio UIs.

### Portfolio Analytics Cache
- portfolio_analytics: profile_id unique cache with input_signature, overall, dimensions, detailed JSON; updated_at trigger.
- portfolio_analytics_history: append-only diffs for audit and evolution tracking.

---

## TypeScript/Zod Domain Types (selected)

- Essay/core types: `src/core/essay/types/essay.ts`
  - `EssayType`, `AnalysisDepth`, `EssaySchema`, `RubricDimensionNames`, etc.
- Rubric types: `src/core/essay/types/rubric.ts`
  - `Rubric`, `RubricDimensionDefinition`, `InteractionRule`, impression label bands.
- Extracurricular/experience: `src/core/types/experience.ts` and UI types in `src/components/portfolio/...`
- Supabase Database types for typed clients: `src/integrations/supabase/types.ts`

---

## Engines & Pipelines

### Essay Analysis Engine
- Location: `src/core/essay/analysis/`
- Inputs: Essay text, type, max_words, optional target school/constraints.
- Feature extraction:
  - `sceneDetector`, `dialogueExtractor`, `interiorityDetector`, `elitePatternDetector` (essay-specific)
- Scoring:
  - `features/rubricScorer.ts` applies rubric v1.x with interaction rules, EQI calc, impression labels, flags, prioritized levers, assessment text.
- Outputs: `AnalysisReport` persisted to `essay_analysis_reports`.
- Determinism: low-temperature, JSON mode; rule-based post-processing.

### Essay Story Coach Engine
- Location: `src/core/essay/coaching/`
- Inputs: `Essay` + `AnalysisReport`
- Strategies: Outliner (2–3 structures), MicroEditor (targeted edits), Rewriter (style variants), Elicitation Builder (questions), GuardRails.
- Outputs: `CoachingPlan` persisted to `essay_coaching_plans` (with acceptance/feedback lifecycle).

### Essay Rubrics
- Versions under `src/core/essay/rubrics/` (e.g., `v1.0.0.ts`, `v1.0.1.ts`).
- Dimensions cover opening, arc, interiority, show-vs-tell, reflection, curiosity, voice/originality, structure/pacing, sentence craft/word economy, context/constraints, school/program fit, ethics/humility.
- Interaction rules enforce dependency caps (e.g., no scene → reflection cap) and calibrated boosts.
- Impression labels map EQI bands to readable labels.

### Extracurriculars/Experiences Analysis
- Core rubric (categories like commitment depth, leadership trajectory, impact scale, narrative alignment) — implemented across analysis modules and UI helpers.
- `src/core/analysis/` contains category scorers, authenticity analysis, feature extraction, and NQI calculation utilities (`src/core/rubrics/v1.0.0.ts`).
- UI flows in `src/components/portfolio/extracurricular/*` provide interactive scoring displays and guidance, with local rubric heuristics (`ExtracurricularModal.tsx`).

### Generation & Workshop Systems
- Essay generation engine: `src/core/generation/essayGenerator.ts`
  - Builds prompts from a GenerationProfile (student voice, risk tolerance, activity type, impact, techniques) and enforces literary constraints (sentence variety, sensory immersion, vulnerability, dialogue, community transformation, universal insight).
  - Iterative improvement loop hooks: `src/core/generation/iterativeImprovement.ts` (analyze → refine → repeat until threshold).
- Intelligent prompting helper: `src/core/generation/intelligentPrompting.ts` for dynamic prompt assembly.

### Cross-Portfolio Analytics (Holistic)
- Server module: `src/modules/analytics/portfolio.ts`
  - Bundles profile + academic + experiences + personal info + family + goals + growth + support.
  - Uses input signature to cache results in `portfolio_analytics`.
  - Calls LLM (OpenAI) for structured JSON with dimension scores and prioritized recommendations when cache miss or forced.
- Edge Function: `supabase/functions/analyze-portfolio/`
  - Alternative flow using Gemini via Lovable gateway; same output envelope (overall, dimensions, detailed).
- Dimensions typically include: Academic Excellence, Leadership Potential, Intellectual Curiosity, Community Impact, Future Readiness, plus holistic narrative summary and prioritized actions.

---

## API Surface (current and planned)

Server routes (Express): `src/http/routes.ts`
- POST `/assessment/complete` — mark assessment complete
- POST `/personal/complete` — persist personal info
- POST `/analytics/portfolio/compute` (see module) — compute and cache holistic portfolio analysis

Essay system (planned per docs):
- POST `/api/essays`
- POST `/api/essays/:id/analyze`
- POST `/api/essays/:id/coach`
- POST `/api/essays/:id/simulate-eqi`
- GET `/api/essays/:id/report`
- POST `/api/applications/:user_id/coherence`
- GET `/api/applications/:user_id/essays`
- GET `/api/rubrics`

Edge:
- POST `/functions/v1/analyze-portfolio` — Supabase Edge Function for portfolio analysis

Auth: `src/http/middleware/auth.ts` requires bearer token; integrates with Supabase auth.

---

## Supabase Setup

Clients:
- Server admin: `src/supabase/admin.ts` (requires SUPABASE_URL + service key)
- Browser client: `src/integrations/supabase/client.ts` (publishable key, persisted session)

Migrations:
- Located under `supabase/migrations/` (idempotent patterns where possible; triggers for updated_at)
- RLS policies defined for essays, analysis reports, coaching plans, profiles, academic_records, and membership tables.

Environment:
- Server: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Client: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (or variants)
- LLM: OPENAI key for server module; LOVABLE_API_KEY for Edge function (Gemini gateway)

---

## Frontend Surfaces (selected)

- Portfolio Wizards: Basic info, Academic Journey, Personal Growth, Experiences/Activities, Recognition, Support (under `src/components/portfolio/*`)
- Extracurriculars UI: `ExtracurricularCard`, `ExtracurricularOverview`, `ExtracurricularModal`, `ExtracurricularTab`
- Assessment/Insights: `AssessmentDashboard`, `portfolioInsightsData.tsx` types for OverarchingInsight and HolisticSummary

These surfaces supply and consume normalized data that feeds the holistic analysis.

---

## PIQ Handling

- UC PIQs are treated as an `essay_type` variant (`'uc_piq'`), so analysis and coaching support them via the same essay pipeline; prompts and max word thresholds can be set per essay record (e.g., 350 max words).
- Application sets can group PIQs with the personal statement + supplements for cross-essay coherence, voice fingerprinting, and motif/claims consistency.

---

## Scoring, Explainability, and History

- Essay EQI is computed from weighted dimensions with interaction rules. Each dimension includes evidence (quotes, anchors met) for traceability.
- Impression labels present a qualitative banding for human readability.
- Extracurricular NQI (category-based) and portfolio dimensions produce concise strengths/growth areas with evidence-driven notes.
- `portfolio_analytics_history` and `essay_revision_history` track evolution over time.

---

## Privacy, Security, and Governance

- RLS ensures users only access their own data.
- Avoid storing raw PII in logs; structured logging preferred.
- Token usage stored per analysis/coaching plan as JSON for cost observability.
- Rubric and prompt versions are explicit to maintain auditability and reproducibility.

---

## Implementation Notes & Next Steps

- Confirm rubric versioning policy (essay v1.0.x, extracurricular v1.0.x) and publish a `/api/rubrics` discovery endpoint.
- Finalize cross-portfolio dimension set and mapping from artifacts to dimensions (how each essay/extracurricular contributes).
- Add a coherence checker API for `application_sets` (voice drift, fact conflicts, motif overlaps) wired to views.
- Ensure idempotent cache checks via `input_signature` before LLM calls.
- Extend portfolio analytics to reference essay EQIs and extracurricular NQIs as explicit inputs, not just raw text summaries, for explainable aggregation.
- Add E2E tests for: end-to-end essay (create → analyze → coach), extracurricular analyze/coach, portfolio compute with cache, and cross-essay coherence.

---

## Quick File Index (for engineers)

- Migrations (DB): `supabase/migrations/*`
- Essay Types: `src/core/essay/types/essay.ts`, `src/core/essay/types/rubric.ts`
- Essay Rubrics: `src/core/essay/rubrics/*`
- Essay Analysis: `src/core/essay/analysis/*`
- Essay Coaching: `src/core/essay/coaching/*`
- Experience Rubrics & Analysis: `src/core/analysis/*`, `src/core/rubrics/*`
- Generation: `src/core/generation/*`
- Portfolio Analytics (server): `src/modules/analytics/portfolio.ts`
- Portfolio Analytics (edge): `supabase/functions/analyze-portfolio/`
- Supabase Admin: `src/supabase/admin.ts`
- Auth Middleware: `src/http/middleware/auth.ts`
- Frontend Portfolio: `src/components/portfolio/*`

---

## Appendices (Selected References)

Below are selected distilled references. See the source files for full content.

```sql
-- essays table (excerpt)
-- supabase/migrations/2025-11-05_create_essay_system.sql
CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  essay_type essay_type NOT NULL,
  draft_original TEXT NOT NULL,
  draft_current TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

```ts
// Rubric version object (excerpt)
// src/core/essay/rubrics/v1.0.0.ts
export const ESSAY_RUBRIC_V1: Rubric = {
  version: 'v1.0.0',
  dimensions: [ /* 12 dimensions with weights and anchors */ ],
  interaction_rules: [ /* dependency caps & boosts */ ],
  impression_labels: [ /* EQI bands → labels */ ]
};
```

```ts
// Portfolio analytics server (excerpt)
// src/modules/analytics/portfolio.ts
export async function computePortfolioStrength(req: Request, res: Response, next: NextFunction) {
  const bundle = await loadBundle(userId);
  const inputSignature = signatureFromBundle(bundle);
  // Cache check → LLM call → upsert portfolio_analytics
}
```

---

This document should be used as the single source of truth while building the holistic portfolio grader and associated workflows. Update as the schema, engines, and APIs evolve.

