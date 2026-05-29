# Design Doc v1.0 — "Asteria": Extracurriculars Grader & Story Coach

**Version:** 1.0.0
**Date:** 2025-11-04
**Status:** Phase 0 — Awaiting Human Sign-off
**Author:** AI Engineering Team (Claude)

---

## 0) Executive Summary

**Goal:** Build a production-quality system that analyzes and coaches students on their extracurricular/experience entries using a rigorous, human-designed rubric. The system produces:
1. **Objective Analysis**: 0-100 Narrative Quality Index (NQI) with category-level scoring and evidence
2. **Story Coaching**: Actionable, human-like feedback with concrete rewrites and prompts

**Key Principles:**
- Human-first output: authentic, non-templated coaching
- Test-driven development: all features ship with comprehensive tests
- Iterative self-improvement: automated loops that evaluate, fix, and optimize
- Privacy-first: PII handling with encryption and redaction
- Human checkpoints: mandatory approval gates at each phase boundary

---

## 1) Scope & System Boundaries

### 1.1 In Scope
- **Core Domain**: Extracurricular/experience entries only (essays, teacher recs out of scope for v1)
- **Analysis Engine**: Rubric-based scoring (11 categories) → NQI calculation → flags & prioritized fixes
- **Coaching Engine**: Micro-edits, 2-3 rewrite options, specificity/reflection/arc/fit prompts
- **API & CLI**: REST API (Express/TypeScript) + CLI for batch processing
- **Data Store**: PostgreSQL (Supabase) for entries, Vercel Blob/S3 for artifacts (drafts, diffs)
- **Frontend Integration**: Existing React components in `/src/components/portfolio/extracurricular/`
- **Testing**: Unit, integration, E2E, property-based tests; CI/CD automation
- **Monitoring**: Structured logging, OpenTelemetry traces, cost/latency dashboards

### 1.2 Out of Scope (for v1)
- Multi-entry cross-analysis (fit & trajectory across portfolio) → v1.2
- Real-time collaborative editing → future
- Mobile native apps → web-first
- Non-English language support → v1.1

### 1.3 Users
- **Primary**: High school students (ages 14-18) drafting college applications
- **Secondary**: Counselors reviewing student portfolios
- **Tertiary**: System administrators (monitoring, human-in-the-loop evaluation)

---

## 2) Data Model & Schema

### 2.1 Core Entities

#### `ExperienceEntry` (TypeScript/Zod)
```typescript
export const ExperienceEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),

  // Core content
  title: z.string().min(1).max(100),
  organization: z.string().optional(),
  role: z.string().optional(),
  description_original: z.string().min(50).max(700), // student's raw text

  // Time commitment
  time_span: z.string(), // e.g., "Sep 2023 – Jun 2025"
  hours_per_week: z.number().min(0).max(168).optional(),
  weeks_per_year: z.number().min(0).max(52).optional(),

  // Categorization
  category: z.enum(['leadership', 'service', 'research', 'athletics', 'arts', 'academic', 'work']),
  tags: z.array(z.string()).default([]),

  // Context (privacy-sensitive)
  constraints_context: z.string().optional(), // e.g., "caregiving, part-time job"

  // Versioning
  version: z.number().int().default(1),
});

export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
```

#### `RubricCategoryScore`
```typescript
export const RubricCategoryScoreSchema = z.object({
  name: z.string(), // e.g., "Voice Integrity"
  score_0_to_10: z.number().min(0).max(10),
  evidence_snippets: z.array(z.string()), // quoted sentences from entry
  evaluator_notes: z.string(), // neutral, diagnostic notes
});
```

#### `AnalysisReport`
```typescript
export const AnalysisReportSchema = z.object({
  entry_id: z.string().uuid(),
  rubric_version: z.string(), // e.g., "v1.0.0"
  created_at: z.string().datetime(),

  categories: z.array(RubricCategoryScoreSchema),
  weights: z.record(z.number()), // category_name → weight (must sum to 1.0)

  narrative_quality_index: z.number().min(0).max(100), // weighted avg * 10
  reader_impression_label: z.enum([
    'captivating_grounded',      // 90-100
    'strong_distinct_voice',     // 80-89
    'solid_needs_polish',        // 70-79
    'patchy_narrative',          // 60-69
    'generic_unclear',           // <60
  ]),

  flags: z.array(z.string()), // e.g., ["templated_phrasing", "no_metrics"]
  suggested_fixes_ranked: z.array(z.string()), // prioritized levers
});
```

#### `CoachingPlan`
```typescript
export const CoachingPlanSchema = z.object({
  entry_id: z.string().uuid(),
  created_at: z.string().datetime(),

  goal_statement: z.string(), // 1-2 sentence summary

  // Edits & rewrites
  micro_edits: z.array(z.object({
    original: z.string(),
    replacement: z.string(),
    rationale: z.string(),
  })),
  rewrite_options: z.array(z.object({
    style: z.enum(['concise_operator', 'warm_reflective', 'action_arc']),
    text: z.string().max(700),
  })),

  // Elicitation prompts
  specificity_prompts: z.array(z.string()),
  reflection_prompts: z.array(z.string()),
  arc_prompts: z.array(z.string()),
  fit_prompts: z.array(z.string()),

  // Guardrails
  style_warnings: z.array(z.string()), // anti-robotic warnings
  word_budget_guidance: z.string(),
});
```

### 2.2 Database Schema (Supabase PostgreSQL)

**Table: `experience_entries`**
```sql
CREATE TABLE experience_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  title TEXT NOT NULL,
  organization TEXT,
  role TEXT,
  description_original TEXT NOT NULL,

  time_span TEXT NOT NULL,
  hours_per_week NUMERIC(5,2),
  weeks_per_year INTEGER,

  category TEXT NOT NULL CHECK (category IN ('leadership', 'service', 'research', 'athletics', 'arts', 'academic', 'work')),
  tags TEXT[] DEFAULT '{}',

  constraints_context TEXT, -- encrypted at rest

  version INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT valid_hours CHECK (hours_per_week >= 0 AND hours_per_week <= 168),
  CONSTRAINT valid_weeks CHECK (weeks_per_year >= 0 AND weeks_per_year <= 52)
);

CREATE INDEX idx_entries_user_id ON experience_entries(user_id);
CREATE INDEX idx_entries_category ON experience_entries(category);
```

**Table: `analysis_reports`**
```sql
CREATE TABLE analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES experience_entries(id) ON DELETE CASCADE,
  rubric_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  categories JSONB NOT NULL, -- array of RubricCategoryScore
  weights JSONB NOT NULL,

  narrative_quality_index NUMERIC(5,2) NOT NULL,
  reader_impression_label TEXT NOT NULL,

  flags TEXT[] DEFAULT '{}',
  suggested_fixes_ranked TEXT[] DEFAULT '{}',

  CONSTRAINT valid_nqi CHECK (narrative_quality_index >= 0 AND narrative_quality_index <= 100)
);

CREATE INDEX idx_reports_entry_id ON analysis_reports(entry_id);
CREATE INDEX idx_reports_rubric_version ON analysis_reports(rubric_version);
```

**Table: `coaching_plans`**
```sql
CREATE TABLE coaching_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES experience_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  goal_statement TEXT NOT NULL,

  micro_edits JSONB NOT NULL DEFAULT '[]',
  rewrite_options JSONB NOT NULL DEFAULT '[]',

  specificity_prompts TEXT[] DEFAULT '{}',
  reflection_prompts TEXT[] DEFAULT '{}',
  arc_prompts TEXT[] DEFAULT '{}',
  fit_prompts TEXT[] DEFAULT '{}',

  style_warnings TEXT[] DEFAULT '{}',
  word_budget_guidance TEXT
);

CREATE INDEX idx_coaching_entry_id ON coaching_plans(entry_id);
```

---

## 3) Rubric Integration

### 3.1 Rubric Version Registry
- Canonical rubrics stored in `/src/core/rubrics/`
- Versioned via semantic versioning (v1.0.0, v1.1.0, etc.)
- Each version includes:
  - Category definitions
  - 0/5/10 scoring anchors
  - Weights (must sum to 100%)
  - Warning signs list
  - Evaluator/writer prompts

**Current Rubric (v1.0.0):**
11 categories with weights:
1. Voice Integrity — 10%
2. Specificity & Evidence — 9%
3. Transformative Impact — 12%
4. Role Clarity & Ownership — 8%
5. Narrative Arc & Stakes — 10%
6. Initiative & Leadership — 10%
7. Community & Collaboration — 8%
8. Reflection & Meaning — 12%
9. Craft & Language Quality — 7%
10. Fit & Trajectory — 7%
11. Time Investment & Consistency — 7%

### 3.2 Feature Extraction Pipeline
Before scoring, extract features:
- **Voice markers**: passive vs. active verbs, buzzword density, sentence variety
- **Evidence markers**: concrete numbers, outcome statements, before/after comparisons
- **Arc markers**: stakes indicators, turning points, temporal structure
- **Collaboration markers**: "we" usage, credit-giving, named partners
- **Reflection markers**: insight depth, transferable learning, belief shifts

### 3.3 LLM-Powered Scoring (Claude via Anthropic API)
**Prompt Strategy:**
- System: "You are an elite admissions evaluator. Score strictly per rubric. Never invent facts. Return JSON."
- User: Rubric JSON + entry + 3-5 calibration exemplars per category
- Temperature: 0.2-0.3 for analysis (determinism)
- Output: Structured JSON with scores + quoted evidence

**Determinism Guarantees:**
- Seed-based random number generation
- Frozen few-shot exemplars per rubric version
- JSON mode with strict schema validation
- Post-hoc normalization against gold set

---

## 3.5) Optimization Strategy: Maximum Depth + Efficiency

### Philosophy
**"Comprehensive analysis through intelligent orchestration, not brute force."**

We achieve depth WITHOUT token waste by:

### 3.5.1 Smart Prompt Architecture

**Multi-Stage Analysis (Sequential Deep Dive):**
```
Stage 1: Feature Extraction (Fast Pass)
  - Extract structural features: verb types, metrics, temporal markers
  - Identify missing elements (no stakes, no metrics, no reflection)
  - Token cost: ~1.5k input, ~500 output
  - Duration: ~1-2s

Stage 2: Category Scoring (Parallel Batch)
  - Group categories by context needs:
    Batch A: Voice, Craft, Evidence (text-focused) → Single LLM call
    Batch B: Impact, Leadership, Collaboration (outcome-focused) → Single LLM call
    Batch C: Arc, Reflection, Fit (narrative-focused) → Single LLM call
  - Token cost per batch: ~2k input, ~800 output × 3 batches = 2.4k output
  - Duration: ~2-3s (parallel execution)

Stage 3: Deep Reflection Analysis (Conditional)
  - ONLY if Reflection score < 6 OR student requests deep coaching
  - Dedicated prompt for meaning-making, transferable insights
  - Token cost: ~2k input, ~600 output
  - Duration: ~1.5s

Stage 4: Coaching Generation (Targeted)
  - Focus on top 2-3 levers from NQI simulation
  - Generate rewrites ONLY for weak sections (not entire entry)
  - Token cost: ~2.5k input, ~1.8k output
  - Duration: ~2-3s
```

**Total Token Budget:**
- Light analysis (no deep coaching): ~4k input, ~1.5k output (~$0.03)
- Full depth (all stages): ~8k input, ~4.8k output (~$0.08)

**Latency:**
- Light: ~4-5s
- Full depth: ~7-9s (within P95 target)

### 3.5.2 Intelligent Caching Strategy

**Level 1: Exact Match Cache (Redis)**
- Key: `hash(description_original + rubric_version)`
- TTL: 24 hours
- Hit rate target: 15-20% (students iterate on same text)

**Level 2: Feature Cache (In-Memory)**
- Cache extracted features (voice markers, metrics, arc structure)
- Reuse across rubric version updates if text unchanged
- Reduces Stage 1 cost by 80%

**Level 3: Prompt Cache (Anthropic Native)**
- Use Anthropic's prompt caching for:
  - Rubric definitions (static across requests)
  - Few-shot exemplars (frozen per version)
  - System instructions
- Reduces input tokens by ~40% on cache hits

### 3.5.3 Parallel Execution Architecture

```typescript
// Pseudo-code for orchestrator
async function analyzeEntry(entry: ExperienceEntry): Promise<AnalysisReport> {
  // Stage 1: Feature extraction (required)
  const features = await extractFeatures(entry);

  // Stage 2: Parallel category scoring
  const [batchA, batchB, batchC] = await Promise.all([
    scoreCategories(['voice', 'craft', 'evidence'], entry, features),
    scoreCategories(['impact', 'leadership', 'collaboration'], entry, features),
    scoreCategories(['arc', 'reflection', 'fit', 'consistency'], entry, features),
  ]);

  // Merge scores
  const allScores = mergeBatches(batchA, batchB, batchC);

  // Compute NQI
  const nqi = computeNQI(allScores, RUBRIC_WEIGHTS);

  // Stage 3: Conditional deep reflection (only if needed)
  if (allScores.reflection < 6) {
    allScores.reflection = await deepReflectionAnalysis(entry, features);
  }

  // Generate report
  return buildReport(entry, allScores, nqi, features);
}
```

### 3.5.4 Quality-Optimized Prompting

**Techniques to maximize output quality per token:**

1. **Anchor-Based Scoring**: Provide 3 concrete examples per category (0, 5, 10) → reduces ambiguity, improves calibration
2. **Evidence-First Prompting**: "Quote the exact phrase that justifies your score" → forces close reading
3. **Contrastive Examples**: "Here's a 4/10 example. Here's an 8/10 example. How does this compare?" → improves discrimination
4. **Chain-of-Thought Lite**: "Score, then explain in one sentence" → balances reasoning depth with token cost
5. **JSON Mode**: Strict schema enforcement → eliminates parsing errors, reduces retry overhead

### 3.5.5 Adaptive Depth Control

**Student Control Panel:**
```typescript
interface AnalysisOptions {
  depth: 'quick' | 'standard' | 'comprehensive';
  focus_areas?: Array<RubricCategory>; // e.g., ['voice', 'reflection']
  coaching_style?: 'concise_operator' | 'warm_reflective' | 'action_arc';
}
```

**Depth Modes:**
- **Quick** (~$0.03, ~4s): Feature extraction + batch scoring only
- **Standard** (~$0.06, ~6s): Full analysis + top 2 levers coaching
- **Comprehensive** (~$0.10, ~8s): Full analysis + 3-style rewrites + deep reflection + all prompts

### 3.5.6 Incremental Refinement (Future Optimization)

**For v1.1:**
- Fine-tuned Claude model on gold set → reduces prompt length by 50%
- Lightweight local model for feature extraction → offload from API
- Batch processing mode → amortize prompt cache hits across multiple students

---

## 4) API Contracts

### 4.1 REST Endpoints (Express + TypeScript)

**Base URL:** `http://localhost:8789/api/v1/extracurricular`

#### `POST /entries`
Create or update an experience entry.

**Request:**
```json
{
  "user_id": "uuid",
  "title": "Clinic Volunteer",
  "description_original": "I was responsible for...",
  "time_span": "Sep 2023 – Jun 2025",
  "hours_per_week": 3,
  "weeks_per_year": 40,
  "category": "service",
  "constraints_context": "Evening shifts due to sibling care"
}
```

**Response:**
```json
{
  "entry": { /* full ExperienceEntry */ },
  "created": true
}
```

#### `POST /analyze/:entry_id`
Run analysis engine on an entry.

**Query Params:**
- `rubric_version` (optional, defaults to latest)

**Response:**
```json
{
  "report": { /* AnalysisReport */ }
}
```

#### `POST /coach/:entry_id`
Generate coaching plan.

**Request Body (optional):**
```json
{
  "analysis_report_id": "uuid", // if omitted, runs analysis first
  "style_preferences": ["warm_reflective", "concise_operator"]
}
```

**Response:**
```json
{
  "plan": { /* CoachingPlan */ }
}
```

#### `POST /simulate-nqi/:entry_id`
Simulate NQI gains from fixing top levers.

**Response:**
```json
{
  "current_nqi": 62.0,
  "simulations": [
    {
      "lever": "Specificity & Evidence",
      "improvement": "+2 points",
      "projected_nqi": 66.8,
      "gain": 4.8
    },
    ...
  ]
}
```

#### `GET /versions/rubric`
List available rubric versions.

**Response:**
```json
{
  "current": "v1.0.0",
  "versions": ["v1.0.0", "v0.9.0"]
}
```

### 4.2 CLI Interface
```bash
# Analyze single entry
asteria analyze --entry-id=<uuid> --rubric-version=v1.0.0

# Coach single entry
asteria coach --entry-id=<uuid> --output=json

# Batch process
asteria batch --input=entries.json --output-dir=./results

# Run self-improvement loop
asteria loop --max-iterations=5 --dry-run
```

---

## 5) Testing Strategy

### 5.1 Test Pyramid

**Unit Tests (70% coverage target):**
- Rubric category scoring functions
- Feature extraction (voice, evidence, arc, collaboration)
- NQI calculation with varied inputs
- Data validation (schema conformance)
- Edge cases: empty strings, extreme values, unicode

**Integration Tests (20% coverage target):**
- API endpoint contracts
- Database CRUD operations
- LLM call mocking (deterministic responses)
- Full analysis → coaching pipeline
- Error handling (malformed input, API failures)

**End-to-End Tests (10% coverage target):**
- Realistic dataset (100 synthetic entries covering distributional cases)
- Multi-step flows: create entry → analyze → coach → simulate
- Performance benchmarks: P95 latency < 8s
- Cost tracking: token usage per request

**Property-Based Tests:**
- Fuzz input shapes to detect parser bugs
- Invariants: NQI always 0-100, weights always sum to 1.0

**Regression Tests:**
- Golden outputs for fixed sample entries
- Detect unintended changes across rubric versions

### 5.2 Synthetic Test Data
Generate 100 diverse entries:
- **Strong (20)**: High voice, evidence, arc, reflection
- **Weak (20)**: Templated, vague, no metrics
- **Generic (20)**: Competent but flat
- **Reflective (20)**: Strong meaning but weak evidence
- **International (10)**: Non-US contexts, cultural nuances
- **Edge cases (10)**: Very short, very long, multilingual fragments

**Data Generation:**
- Use Claude to generate entries from prompts
- Hand-label 30 entries as "gold set" for calibration
- Store in `/tests/fixtures/synthetic_entries.json`

### 5.3 Human-in-the-Loop Testing
- **Nightly human eval**: Random sample of 10 outputs reviewed by human
- **Agreement metrics**: Cohen's kappa for category scores
- **Accept/modify/reject** labels tracked in DB

---

## 6) CI/CD & DevOps

### 6.1 CI Pipeline (GitHub Actions)

**On PR:**
1. Lint (ESLint) + type check (TypeScript)
2. Run unit tests (Jest/Vitest)
3. Run integration tests (with mocked LLM)
4. Compute coverage (fail if < 85% for core modules)
5. Static analysis (SonarQube optional)

**On Merge to Main:**
1. All PR checks
2. Build Docker image
3. Run E2E tests against staging DB
4. Deploy to staging environment
5. Run smoke tests
6. Manual approval gate → deploy to production

**Nightly:**
1. Run self-improvement loop in sandbox
2. Generate summary report
3. Open GitHub issue if regressions detected

### 6.2 Observability

**Logging:**
- Structured JSON logs (Winston/Pino)
- Log levels: DEBUG, INFO, WARN, ERROR
- PII redaction in logs (replace names/orgs with tokens)

**Tracing:**
- OpenTelemetry spans for:
  - API gateway → orchestrator → LLM call → post-process
  - Database queries
  - External API calls (Anthropic)

**Metrics:**
- Request latency (P50, P95, P99)
- Error rates by endpoint
- LLM token usage & cost
- NQI distribution histogram

**Dashboards:**
- Grafana: system health, request rates, latency
- Custom: NQI trends, flag frequency, coaching accept rates

### 6.3 Cost & Latency Budgets

**Latency:**
- Analysis pass: P95 ≤ 4s
- Coaching pass: P95 ≤ 5s
- Full pipeline: P95 ≤ 8s

**Token Budget (per request):**
- Analysis: ≤ 3k input, ≤ 1k output
- Coaching: ≤ 2k input, ≤ 2k output (for 2-3 rewrites)

**Cost:**
- Target: ≤ $0.10 per full analysis + coaching cycle (Claude Sonnet 3.5)
- Caching: memoize analysis for identical (entry text + rubric version) pairs

---

## 7) Privacy, Security & Compliance

### 7.1 PII Handling
**Sensitive Fields:**
- `description_original` (may contain names, locations)
- `constraints_context` (caregiving, financial hardship)

**Safeguards:**
1. **Envelope encryption** for `constraints_context` (AWS KMS/Supabase Vault)
2. **Redaction before LLM calls**: strip names/orgs unless necessary
3. **Audit logs**: track all access to PII fields
4. **Retention policy**: purge drafts/diffs after 12 months; honor deletion requests

### 7.2 Access Control
- **Student**: CRUD on own entries; read own analysis/coaching
- **Counselor**: read-only access to assigned students
- **Admin**: full access + human eval workflow

**RLS (Row Level Security):**
```sql
ALTER TABLE experience_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_own_entries ON experience_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY counselor_assigned_students ON experience_entries
  FOR SELECT USING (
    auth.uid() IN (SELECT counselor_id FROM student_counselor_assignments WHERE student_id = user_id)
  );
```

### 7.3 GDPR/CCPA Compliance
- **Right to access**: export all user data via `/api/v1/users/:id/export`
- **Right to deletion**: hard delete user + cascade to entries/reports/plans
- **Right to rectification**: update endpoint with audit trail
- **Consent**: require explicit opt-in for marketing; separate from product usage

### 7.4 Content Authenticity
**Rule:** Coach never fabricates outcomes or achievements.

**Enforcement:**
1. Content-lock middleware: compare rewrite claims against original
2. If missing data, output specificity prompts instead of guessing
3. Red-team tests: detect fabrication attempts

---

## 8) Failure Modes & Mitigations

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| LLM returns non-JSON | Analysis fails | Fallback parser; retry with stricter guard; log + alert |
| Coach invents facts | Student trust loss | Content-lock middleware; strip unverified claims; re-prompt |
| Score drift across calls | Inconsistent NQI | Pin few-shots; reduce temp; post-hoc normalization |
| Student writes < 50 chars | Analysis impossible | Switch to elicitation mode (scaffolding prompts) |
| Tone mismatch (too formal) | Student disengagement | Offer 3 style options; slider for warm ↔ concise |
| API rate limit (Anthropic) | Service degradation | Exponential backoff; queue system; upgrade tier |
| Database outage | Service down | Read replicas; graceful degradation (serve cached results) |
| PII leak in logs | Compliance violation | Automated log scanning; redaction pipeline; rotate logs daily |

---

## 9) Acceptance Criteria (Phase 0 → Phase 5)

### Phase 0 (Design Doc) — ✅ Ready for Sign-off
- [ ] Design doc covers all required sections
- [ ] Data model aligns with existing frontend (`ExtracurricularItem`)
- [ ] Rubric integration strategy is clear
- [ ] Testing strategy defines coverage targets
- [ ] CI/CD plan includes human checkpoints
- [ ] Privacy safeguards address PII handling

### Phase 1 (Production-Grade Evaluator — Full Depth)
- [ ] **Complete Analysis Engine**: All 11 categories with deep feature extraction, multi-pass analysis for complex entries
- [ ] **Complete Coaching Engine**: Full rewrite generation (3 styles), micro-edits with rationale, comprehensive prompt packs
- [ ] **Optimization Layer**: Intelligent prompt caching, parallel LLM calls where possible, token budget enforcement
- [ ] **Quality Assurance**: Multi-model validation (cross-check scores), confidence intervals, uncertainty flags
- [ ] Unit + integration tests for all modules (≥ 90% coverage for core)
- [ ] 30 synthetic entries across full distributional spectrum + 10 gold-labeled entries
- [ ] Pre-commit hooks + automated quality gates

### Phase 2 (Robust Pipeline)
- [ ] Input validation with JSON Schema
- [ ] PII redaction safeguards active
- [ ] Expanded test suite with edge cases
- [ ] CLI + REST API functional
- [ ] CI runs tests + linters automatically

### Phase 3 (Quality Metrics)
- [ ] Automated checks: AI phrasing detector, active voice, word count
- [ ] Quality metrics: rubric consistency, fluency, structural completeness
- [ ] Results analyzer: collects failures, prioritizes fixes
- [ ] Metrics dashboard (static HTML or CSV)

### Phase 4 (Self-Improvement Loop)
- [ ] Orchestrator runs: build → test → analyze → propose → implement → measure
- [ ] Auto-fix for low-risk changes; PR for high-risk
- [ ] Human approval gates for rubric/privacy changes
- [ ] Example auto-fix PR with annotated logs

### Phase 5 (Hardening)
- [ ] Logging, error tracking, fallback behavior
- [ ] Secure storage guidelines + retention policy
- [ ] Runbooks for common failure modes
- [ ] Migration plan for larger application integration

---

## 10) Roadmap & Timeline

**Phase 0 (Design Doc):** 1-2 days
**Phase 1 (Production-Grade Evaluator — Full Depth):** 7-10 days
  - Complete analysis engine with all 11 categories
  - Complete coaching engine with all rewrite styles
  - Optimization layer with caching and parallel processing
  - Comprehensive test suite
**Phase 2 (Robust Pipeline & API):** 5-7 days
  - Full validation, PII handling, API with rate limiting
  - CLI with all features, batch processing
**Phase 3 (Quality Metrics & Analyzer):** 5-7 days
  - All quality metrics, automated checks
  - Results analyzer with prioritization engine
**Phase 4 (Self-Improvement Loop):** 7-10 days
  - Complete orchestrator with smart auto-fix
  - Human approval workflow
**Phase 5 (Hardening & Production):** 5-7 days
  - Security, monitoring, runbooks
  - Production deployment

**Total:** ~5-7 weeks for production-ready v1.0

---

## 11) Dependencies & Risks

### Dependencies
- **Anthropic Claude API**: Primary LLM (Sonnet 3.5)
  - Mitigation: OpenAI GPT-4 as fallback
- **Supabase**: Database + auth
  - Mitigation: Self-hosted PostgreSQL + Clerk/Auth0
- **Existing Frontend**: React components in `/src/components/portfolio/extracurricular/`
  - Mitigation: Minimal breaking changes; extend `ExtracurricularItem` interface

### Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Rubric subjective disagreement | Medium | High | Gold set calibration; human-in-the-loop eval |
| LLM hallucination (invented facts) | Medium | High | Content-lock middleware; red-team tests |
| Performance (latency > 8s) | Low | Medium | Caching; parallel LLM calls; lightweight feature extraction |
| Cost overrun (> $0.10/request) | Low | Medium | Token budget enforcement; prompt optimization |
| PII leak | Low | Critical | Encryption; redaction; automated scanning; audit logs |

---

## 12) Open Questions (for Human Review)

1. **Rubric Weights**: Are the current 11-category weights acceptable, or should we adjust based on college tier (e.g., Ivy+ vs. LAC)?
2. **Coaching Tone**: Should we bias toward "warm reflective" by default, or offer equal weight to all 3 styles?
3. **Human Eval Frequency**: Nightly sample of 10 outputs, or weekly batch of 50?
4. **Auto-Fix Threshold**: What counts as "low risk" for automatic implementation without PR? (e.g., fixing typos, removing buzzwords)
5. **Data Retention**: 12 months for drafts/diffs acceptable, or shorter (6 months)?
6. **Integration Timeline**: Should Phase 1 wait for frontend updates, or proceed with backend-only testing?

---

## 13) Appendix

### A. Technology Stack Summary
- **Language**: TypeScript (Node.js 20+)
- **Framework**: Express 5.x
- **Database**: PostgreSQL 15 (Supabase)
- **Storage**: Vercel Blob / AWS S3
- **LLM**: Anthropic Claude 3.5 Sonnet
- **Testing**: Vitest (unit), Supertest (integration), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Observability**: Winston (logs), OpenTelemetry (traces), Grafana (dashboards)

### B. File Structure (Proposed)
```
/src
  /core
    /rubrics
      v1.0.0.ts          # Current rubric definition
    /analysis
      engine.ts          # Analysis orchestrator
      features.ts        # Feature extraction
      scoring.ts         # Category scoring logic
    /coaching
      engine.ts          # Coaching orchestrator
      rewrites.ts        # Rewrite generators
      prompts.ts         # Elicitation prompts
  /api
    /routes
      entries.ts
      analyze.ts
      coach.ts
      simulate.ts
    middleware.ts
    server.ts
  /db
    schema.sql
    migrations/
    seed.ts
  /tests
    /unit
    /integration
    /e2e
    /fixtures
      synthetic_entries.json
      gold_set.json
  /tools
    /analyzer
      quality-metrics.ts
      self-improve.ts
    /cli
      index.ts
  /ci
    github-actions.yml
```

### C. References
- [Master Prompt (this project)](#)
- [Rubric Draft v1.0.0](#)
- [Design Doc — Asteria (Narrative System)](#)
- [Existing Frontend Types](/src/components/portfolio/extracurricular/ExtracurricularCard.tsx)
- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

---

**End of Design Doc v1.0.0**

**Next Step:** Human checkpoint — review & approve before proceeding to Phase 1.
