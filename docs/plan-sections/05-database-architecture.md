# Database Architecture (Updated)

> New section for docs/specs/PLAN.md. Replaces Key Design Decision #10 ("JSONB document, not normalized tables").
> Incorporates 19-table modular schema, concurrency model, and migration strategy.

---

## Design Philosophy

Five principles govern every table boundary, column choice, and index decision.

**Principle 1 — One entity, one table.** Every distinct concept gets dedicated storage. Coaching turns updating one sentence shouldn't require loading a 300KB blob. Each concept with its own lifecycle, access pattern, or update cadence earns its own table.

**Principle 2 — JSONB where structure varies, columns where queries need speed.** If we will ever write `WHERE column = ...` or `ORDER BY column`, it is a scalar column. If we only read it as part of loading an entity, it is JSONB. A sentence's `effectiveness` score is scalar (we query "which sentences need work"). The `observedFunctions` array is JSONB (loaded whole, never filtered by individual observations).

**Principle 3 — The profile is assembled, not fetched.** The EssayProfile is a composite assembled from multiple tables by the Profile Router, which decides which tables to query per task. A coaching turn about voice loads the voice section + tagged sentences. Not everything. A full L5 pass loads everything. The schema makes selective loading natural.

**Principle 4 — Write frequency drives table boundaries.** The profile index (updated every layer) is separate from paragraph profiles (updated once per walk). Conversation insights (every coaching turn) are separate from analysis results (once per pass). Two concurrent processes never contend for the same row.

**Principle 5 — Hard ownership.** Every row has a `user_id` (TEXT, Clerk format) with RLS. Service role bypasses for pipeline operations. No table accessible without valid user context or service role.

---

## 6 Domain Modules (~19 Tables)

The schema organizes into 6 domain modules. Each module owns a cluster of tables and can be queried independently. Cross-module joins happen only for assembly (building the full profile) and portfolio aggregation.

| Module | Purpose | Tables |
|--------|---------|--------|
| **Essay Core** | Text, versions, metadata (existing) | `essays`, `essay_revision_history` |
| **Essay Profile** | Multi-resolution understanding map | `essay_profiles`, `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_sentence_analyses`, `essay_connections`, `essay_north_star` |
| **Analysis Lifecycle** | Pipeline audit trail and crash recovery | `analysis_runs`, `analysis_checkpoints` |
| **Conversation & Coaching** | L6 messages, insights, student-durable knowledge | `coaching_sessions`, `coaching_messages`, `conversation_insights`, `student_insights` |
| **Edit Tracking & Version Management** | Change log and rollback | `essay_version_records` |
| **Portfolio Intelligence** | Cross-essay patterns and strategy | `portfolio_essay_index`, `portfolio_cross_patterns` |

Additionally, two supporting structures exist outside the domain modules: `analysis_locks` and `essay_version_snapshots`. Total: **19 tables** (2 existing + 17 new).

---

## Table Specifications

### Module 1: Essay Core (existing)

These tables already exist. The Essay Intelligence System reads from them but does not own them.

**`essays`** — The essay text, type classification, and metadata. One row per essay. The cascade root for all essay-scoped data.

**`essay_revision_history`** — Full text snapshots at each save point. Managed by the existing essay CRUD layer.

---

### Module 2: Essay Profile

The heart of the system. The multi-resolution understanding map decomposed into specialized tables that can be loaded independently.

#### `essay_profiles` — Central Anchor

**Purpose**: One row per essay. The hub that everything else foreign-keys to. Stores the profile index (the always-loaded compact table of contents), overall metadata, and concurrency control fields.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Standard primary key |
| `essay_id` | UUID, FK → `essays`, UNIQUE | One profile per essay |
| `user_id` | TEXT | Clerk user ID, RLS anchor |
| `profile_index` | JSONB (~200-300 tokens, ~2-4KB) | Paragraph digests, topic tags, connection graph, section token counts, active concerns, improvement phase |
| `confidence_level` | TEXT (enum: initial/developing/deep/comprehensive) | Scalar for fast mode-selection queries |
| `improvement_phase` | JSONB | Current improvement phase and readiness scores |
| `write_version` | INTEGER | Optimistic concurrency lock, incremented on every update |
| `last_analysis_at` | TIMESTAMPTZ, nullable | When last analysis completed |
| `total_cost` | NUMERIC(8,4) | Accumulated analysis cost in USD |
| `staleness_summary` | JSONB, nullable | Which sections are stale and why |
| `legacy_profile` | BOOLEAN, default false | True for profiles migrated from old JSONB — triggers re-analysis to populate new structures (voice map, earned-ness, North Star), ~$0.50-1.00 per essay |
| `created_at` / `updated_at` | TIMESTAMPTZ | Standard timestamps |

**Key relationships**: One-to-one with `essays`. One-to-many parent of `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_connections`, `essay_north_star`, `analysis_runs`, `coaching_sessions`, `essay_version_records`. Deleting a profile cascades to all children.

**Primary query patterns**:
1. Load profile index by essay_id (every API call, <1ms)
2. Check confidence level for analysis mode selection
3. Optimistic concurrency check: `UPDATE ... SET write_version = write_version + 1 WHERE id = $1 AND write_version = $2`

**Update cadence**: Profile index recomputed and written after every layer and every coaching turn that deepens understanding. Write version incremented atomically with each update.

---

#### `essay_holistic_sections` — Voice, Theme, Narrative, Character, Craft, Emotion, Admissions, Entanglements, Voice Map, Earned-ness Map

**Purpose**: Stores each holistic understanding section as a separate row. Allows loading voice identity without loading admissions positioning. Each section has its own update cadence — voice might be updated by a coaching reinterpretation while themes remain stable.

**Section type enum**:

```sql
CREATE TYPE holistic_section_type AS ENUM (
  'voice_identity',
  'voice_map',
  'emotional_topography',
  'earnedness_map',
  'thematic_architecture',
  'narrative_strategy',
  'character_revelation',
  'craft_assessment',
  'admissions_positioning',
  'cross_dimension_entanglements'
);
```

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `section_type` | `holistic_section_type` (enum: 10 values) | See enum above |
| `content` | JSONB | Full typed content per docs/specs/PLAN.md structures |
| `token_estimate` | INTEGER | For Profile Router budgeting (~3.2 chars/token for structured text, per M6) |
| `last_updated_layer` | INTEGER | Which layer last wrote this section |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. **Up to 10 rows per essay** (one per section type). Not all essays populate all sections — supplements may omit voice_map and earnedness_map.

**Primary query patterns**:
1. Load specific section(s): `WHERE essay_profile_id = $1 AND section_type IN ('voice_identity', 'thematic_architecture')`
2. Load all sections for comprehensive assembly
3. Token count lookups for budget planning: `SELECT section_type, token_estimate WHERE essay_profile_id = $1`

**Update cadence**: L3.75 holistic synthesis populates the core sections. L6 coaching may update individual sections on reinterpretation. Voice map and earned-ness map are populated by specialized analysis passes.

**Why individual rows instead of 10 JSONB columns on `essay_profiles`**:
1. Individual rows update independently — no read-modify-write on unaffected sections
2. TOAST compression per-row means loading one section never decompresses others
3. Profile Router's selective loading maps directly to `WHERE section_type IN (...)`
4. Adding an 11th section requires only a new enum value, not a schema migration

**Why entanglements is a section**: Entanglements record moments where dimensions intersect ("P2S3's voice shift IS the thematic pivot"). Not storable in voice or theme alone — it is a relationship between dimensions. Same lifecycle as other holistic sections.

---

#### `essay_paragraph_profiles` — Per-Paragraph Understanding + Analysis

**Purpose**: One row per paragraph. Contains paragraph-level understanding (role, function, narrative contribution, emotional register, craft profile) and paragraph-level analysis (effectiveness, verdict). Also holds the paragraph's text and text hash for change detection.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `paragraph_index` | INTEGER | Position in essay (0-based) |
| `paragraph_text` | TEXT | Current paragraph text |
| `text_hash` | TEXT | SHA-256 for fast change detection during re-analysis |
| `understanding` | JSONB | Role, function, narrative contribution, emotional register, craft profile, tags |
| `analysis` | JSONB, nullable | Effectiveness score, verdict. Null until L3.5 runs |
| `tags` | TEXT[] | Denormalized from understanding for array queries |
| `sentence_count` | INTEGER | For bounds validation |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `essay_sentence_analyses`. Composite unique constraint on (`essay_profile_id`, `paragraph_index`).

**Primary query patterns**:
1. Load single paragraph: `WHERE essay_profile_id = $1 AND paragraph_index = $2`
2. Load all paragraphs for comprehensive assembly
3. Check text hash for change detection during re-analysis

**Update cadence**: Written once per paragraph during L3 understanding walk, then rarely (only on re-analysis after edits or coaching reinterpretation).

---

#### `essay_sentence_analyses` — Per-Sentence Deep Understanding + Analysis

**Purpose**: One row per sentence. The most granular table — stores the full `SentenceDeepAnalysis` structure with understanding and analysis as separate JSONB sub-objects. This is the highest row-count table (~25 rows per essay for 5 paragraphs x ~5 sentences).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | For direct profile-level queries |
| `essay_id` | UUID, FK → `essays` | Denormalized for direct essay-scoped queries |
| `paragraph_profile_id` | UUID, FK → `essay_paragraph_profiles` | Parent paragraph |
| `paragraph_index` | INTEGER | Denormalized for query convenience |
| `sentence_index` | INTEGER | Position within paragraph (0-based) |
| `sentence_text` | TEXT | Current sentence text |
| `understanding` | JSONB | observedFunctions, inferredIntents, rhetoricalFunctions, narrativeContributions, paragraphContribution, rhythmContribution, voiceAlignment, techniques, significantChoices |
| `analysis` | JSONB, nullable | Effectiveness score, effectivenessReasoning, strengths, weaknesses. Null until L3.5 |
| `effectiveness` | SMALLINT, nullable | **Scalar copy** of `analysis.effectiveness` for fast filtering |
| `is_problem` | BOOLEAN, nullable | **Scalar copy** for quick flag queries |
| `is_strength` | BOOLEAN, nullable | **Scalar copy** for quick flag queries |
| `priority` | SMALLINT, nullable | **Scalar copy** for sorting/filtering |
| `tags` | TEXT[] | Denormalized from understanding for array queries and tag-based routing |
| `connection_refs` | TEXT[] | References to `essay_connections.connection_id` — lightweight refs, not embedded descriptions |
| `staleness` | JSONB, nullable | Staleness markers for change detection |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_paragraph_profiles`. Composite unique constraint on (`essay_profile_id`, `paragraph_index`, `sentence_index`).

**Primary query patterns**:
1. Load all sentences for a paragraph: `WHERE essay_profile_id = $1 AND paragraph_index = $2 ORDER BY sentence_index`
2. Load specific sentence: `WHERE essay_profile_id = $1 AND paragraph_index = $2 AND sentence_index = $3`
3. Load problem sentences: `WHERE essay_profile_id = $1 AND is_problem = true ORDER BY effectiveness ASC`
4. Load sentences by tag: `WHERE essay_profile_id = $1 AND tags @> ARRAY['metaphor:diamond']`
5. Load understanding-only (L3.5 analysis pass needs understanding but no prior analysis)

**Update cadence**: Understanding written during L3 walk (one initial write per sentence, plus back-propagation updates from later paragraphs). Analysis written once during L3.5 pass. Scalar copies (`effectiveness`, `is_problem`, `is_strength`, `priority`) written alongside analysis.

**Why individual rows**: Back-propagation from P5 to P1S1 updates one row, not the entire P1 array. Tag/score queries avoid JSONB traversal. Light-touch Pathway 1 updates use per-sentence rows with no profile-level lock needed (per M8).

---

#### `essay_connections` — Cross-Sentence Relationships

**Purpose**: The single canonical store for all cross-paragraph connections. Each connection is stored once. Sentences reference connections by ID (stored in their `connection_refs` TEXT array). This eliminates the duplication problem described in the anti-repetition architecture.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `connection_id` | TEXT, UNIQUE | Human-readable: "conn_001", "conn_002", etc. |
| `from_paragraph` | INTEGER | Source paragraph index |
| `from_sentence` | INTEGER | Source sentence index |
| `to_paragraph` | INTEGER | Target paragraph index |
| `to_sentence` | INTEGER | Target sentence index |
| `connection_type` | TEXT | callback, echo, contrast, setup_payoff, escalation, thread_continuation, image_recurrence, arc_role, redundancy |
| `description` | TEXT | One canonical description of this connection |
| `discovered_at_layer` | INTEGER | Which layer discovered it |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. Referenced by `essay_sentence_analyses` via `connection_refs`.

**Primary query patterns**:
1. Load all connections for a profile (comprehensive assembly)
2. Load connections involving a specific paragraph: `WHERE essay_profile_id = $1 AND (from_paragraph = $2 OR to_paragraph = $2)`
3. Load by type: `WHERE essay_profile_id = $1 AND connection_type = 'image_recurrence'`
4. Load connection graph summary for profile index rebuilding

**Update cadence**: New connections added during L3 understanding walk (one to several per paragraph). Rarely updated after initial creation.

**Why a separate table**: Connections are the most duplication-prone data in the system. Without a canonical store, P1S1 would embed a description of its link to P3S4, and P3S4 would embed a (rephrased) description of the same link. The separate table stores each connection exactly once. Sentences carry only lightweight `connection_refs: ["conn_001"]`. The Profile Router resolves refs when building prompt context.

---

#### `essay_north_star` — Holistic Vision (replaces `essay_dna`)

**Purpose**: The system's understanding of how an essay **means** — the architecture by which individual moments compose into a unified act of self-revelation. Five dimensions stored as JSONB, scaled by essay type. Separate from holistic sections because it is populated by a different layer (L4 vs L3.75) and loaded for different purposes (edit interpretation, portfolio strategy, coaching context vs. per-dimension understanding).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `essay_profile_id` | UUID, FK → `essay_profiles`, UNIQUE | One North Star per essay |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `essay_type` | TEXT | personal_statement, piq, supplement — drives dimension scaling |
| `through_line_map` | JSONB, nullable | Central element's transformation arc across the essay |
| `structural_roles_map` | JSONB | What each section IS in the architecture of meaning (fulcrum, frame, catalyst, etc.) |
| `trajectory` | JSONB, nullable | Where the essay IS and where it's TRYING to go. Multiple plausible paths |
| `distinctiveness_signature` | JSONB | What makes this essay non-interchangeable |
| `intent_bridge` | JSONB | Student's stated understanding alongside system's |
| `confidence` | SMALLINT | 0-100 confidence in the North Star |
| `token_estimate` | INTEGER | For Profile Router budgeting (~3.2 chars/token) |
| `updated_at` | TIMESTAMPTZ | |

**Scaling by essay type**: Supplements (<250 words) populate only `structural_roles_map` and `distinctiveness_signature`. PIQs (~350 words) add `trajectory`. Personal statements (~650 words) populate all five dimensions. Unpopulated dimensions are null JSONB, not absent columns.

**Key relationships**: One-to-one with `essay_profiles`.

**Primary query patterns**:
1. Load by essay_profile_id (coaching, edit interpretation, portfolio)
2. Load structural_roles only (edit understanding pipeline — is this the fulcrum?)

**Update cadence**: Crystallized at L4. Refined when L6 conversation populates the intent bridge or shifts trajectory. Full rewrite on comprehensive re-analysis.

**Why separate from holistic sections**: The North Star is populated by L4 (crystallization), while holistic sections are populated by L3.75 (synthesis). The North Star is consumed by completely different systems — edit interpretation, portfolio strategy, coaching orientation — not by per-dimension analysis. Different layer, different consumers, different update cadence.

---

### Module 3: Analysis Lifecycle

#### `analysis_runs` — Pipeline Execution Audit Trail

**Purpose**: One row per analysis execution (initial full pass, comprehensive re-analysis, focused re-analysis). Tracks what layers ran, what they cost, what changed, how long they took.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `run_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Parent reference |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | For cost aggregation queries |
| `mode` | TEXT (enum) | comprehensive, focused, edit_understanding |
| `status` | TEXT (enum) | running, completed, failed, cancelled |
| `started_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ, nullable | |
| `cost` | NUMERIC(8,4) | Total cost in USD |
| `layers_completed` | INTEGER[] | Which layers finished |
| `error_details` | TEXT, nullable | If any layer failed |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `analysis_checkpoints`.

**Primary query patterns**:
1. Load latest run: `WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1` (resumption after crash)
2. Aggregate cost per user: `SELECT SUM(cost) WHERE user_id = $1`
3. Performance monitoring: average L3 walk duration, average re-analysis cost

**Update cadence**: One row created per analysis execution. Updated during the run (status transitions). Never modified after completion.

---

#### `analysis_checkpoints` — Crash Recovery Snapshots

**Purpose**: Strategic database saves at natural pipeline boundaries. If the server crashes mid-L3-walk, we resume from the last checkpoint instead of restarting the entire pipeline.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `run_id` | UUID, FK → `analysis_runs` | Parent run |
| `paragraph_index` | INTEGER | Which paragraph this checkpoint is after |
| `profile_snapshot` | JSONB | Profile state at this point — pending back-propagations, completed sections |
| `completed_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `analysis_runs`.

**Primary query patterns**:
1. Load latest checkpoint for an essay (crash recovery)
2. Delete old checkpoints after successful run completion

**Lifecycle**: Ephemeral. After a successful analysis run, all checkpoints for that run can be deleted. Only the most recent run's checkpoints matter. Circuit breaker: max 3 retries per checkpoint. After 3 failures, the run is marked failed with error details.

---

### Module 4: Conversation & Coaching

#### `coaching_sessions` — Conversation Container

**Purpose**: One row per coaching session. A session starts when the student enters the coaching interface and may span many messages.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `session_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | |
| `started_at` | TIMESTAMPTZ | |
| `ended_at` | TIMESTAMPTZ, nullable | Null while active |
| `turn_count` | INTEGER, default 0 | |
| `total_cost` | NUMERIC(8,4), default 0 | |

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `coaching_messages` and `conversation_insights`.

**Primary query patterns**:
1. Load active session: `WHERE essay_profile_id = $1 AND ended_at IS NULL`
2. Load session history for a student
3. Aggregate coaching cost per essay

**Update cadence**: Created on session start. `turn_count`, `total_cost` updated per coaching turn. `ended_at` set on session close.

---

#### `coaching_messages` — Conversation History

**Purpose**: Immutable log of every message in a coaching session. Both student messages and system responses. Ordered by turn index within a session.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `session_id` | UUID, FK → `coaching_sessions` | Parent session |
| `turn_index` | INTEGER | Ordering within session |
| `role` | TEXT (enum) | student, coach |
| `content` | TEXT | Message text |
| `focus_detection` | JSONB, nullable | Which paragraph/sentence the student is focused on, which profile sections were loaded |
| `insight_extracted` | BOOLEAN, default false | Whether this turn produced a conversation insight |
| `cost` | NUMERIC(8,4), nullable | Cost of LLM calls for this turn |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `coaching_sessions`.

**Primary query patterns**:
1. Load messages for a session in order: `WHERE session_id = $1 ORDER BY turn_index`
2. Load most recent N messages for coaching context
3. Count messages per session

**Update cadence**: Immutable — insert-only. One row per message in the conversation.

---

#### `conversation_insights` — Extracted Student Intent (Essay-Scoped)

**Purpose**: When a student reveals something about their essay's intent — confirming an interpretation, correcting a misunderstanding, providing new context — the insight is extracted and stored here. Each insight has a category, scope, and durability. Scoped to a single essay.

**Insight category enum**:

```sql
CREATE TYPE insight_category AS ENUM (
  'confirmation',
  'reinterpretation',
  'new_context',
  'preference',
  'clarification',
  'correction',
  'emotional_reaction',
  'resistance'
);
```

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `insight_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | Essay scope |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `user_id` | TEXT | |
| `category` | `insight_category` (enum) | See enum above |
| `content` | TEXT | What the system learned |
| `scope` | JSONB | Where this insight applies: `{level: "essay"|"paragraph"|"sentence", paragraph?: int, sentence?: int}` |
| `secondary_attributes` | JSONB, nullable | Additional context that doesn't fit standard columns |
| `durability` | TEXT (enum) | ephemeral, draft_durable, essay_durable |
| `supersedes` | UUID, nullable, FK → self | If this insight replaces a previous one |
| `version_context` | TEXT, nullable | Essay text hash when insight was captured — for staleness detection after edits |
| `created_at` | TIMESTAMPTZ | |
| `invalidated_at` | TIMESTAMPTZ, nullable | When this insight was superseded or invalidated |

**Key relationships**: Many-to-one with `essay_profiles`. Self-referential for supersession chains.

**Primary query patterns**:
1. Load active insights: `WHERE essay_profile_id = $1 AND invalidated_at IS NULL`
2. Load by scope: `WHERE essay_profile_id = $1 AND scope->>'paragraph' = $2`
3. Load by category: `WHERE essay_profile_id = $1 AND category = 'reinterpretation'`

**Update cadence**: Inserted after every significant coaching turn. `invalidated_at` set when superseded. Soft deletes only (supersession chains preserved for audit).

---

#### `student_insights` — Student-Durable Knowledge (Cross-Essay)

**Purpose**: Insights that persist across all essays for a student. "I'm a perfectionist and that's part of what I'm writing about" — this affects every essay, not just the one where it was revealed. Separate from essay-scoped `conversation_insights` because it has no `essay_profile_id` dependency and must survive essay deletion. Durability is always `student_durable` (per C1).

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `insight_id` |
| `user_id` | TEXT | Student-level, not essay-level |
| `content` | TEXT | What the system learned |
| `source_essay_id` | UUID, nullable | Which essay the insight came from (for provenance) |
| `durability` | TEXT | Always 'student_durable' |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Belongs to user only. No cascade dependency on essay deletion.

**Primary query patterns**:
1. Load all active student insights: `WHERE user_id = $1`
2. Filter by source essay

**Update cadence**: Rare — only when coaching reveals something student-durable. The re-analysis brief pulls from both essay-level (`conversation_insights`) and student-level (`student_insights`) stores.

---

### Module 5: Edit Tracking & Version Management

#### `essay_version_records` — Running Change Log

**Purpose**: The running change log for the Conversational Edit Workshop (Pathway 1). One row per version checkpoint — tracks what changed, where, and optionally why (if the student discussed it). This is the version record that the re-analysis brief reads.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | Also serves as `version_id` |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `essay_id` | UUID, FK → `essays` | Denormalized |
| `change_entries` | JSONB | Array of `{timestamp, paragraph, sentence, old_text, new_text, change_type, intent_annotation}` |
| `conversation_insights_since_last` | JSONB | Insights captured since the previous version record |
| `light_touch_adjustments` | JSONB | Staleness markers and sentence-level updates since last analysis |
| `essay_text_snapshot` | TEXT | Full essay text at this version point |
| `analysis_run_id` | UUID, nullable, FK → `analysis_runs` | If this version triggered a re-analysis |
| `created_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with `essay_profiles`. Optionally references `analysis_runs`.

**Primary query patterns**:
1. Load latest version record: `WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1`
2. Load version record for re-analysis brief: join with analysis_run to find what changed since last analysis
3. Count changes by significance (for re-analysis suggestion threshold)

**Update cadence**: New row inserted at version checkpoints — when the student finishes an editing session or when re-analysis is triggered. The `change_entries` JSONB accumulates individual edits within a version.

---

### Module 6: Portfolio Intelligence

#### `portfolio_essay_index` — Cross-Essay Lightweight Lookup

**Purpose**: A denormalized, lightweight index of all essays in a student's portfolio. Enables portfolio-level queries without joining through the full profile tables. One row per essay, carrying the North Star fields that matter for cross-essay comparison.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `user_id` | TEXT | Portfolio belongs to user |
| `essay_id` | UUID, FK → `essays` | |
| `essay_profile_id` | UUID, FK → `essay_profiles` | |
| `north_star_summary` | JSONB | Compact summary of through-line, distinctiveness, trajectory |
| `voice_fingerprint` | JSONB | Voice identity signature for cross-essay comparison |
| `thematic_tags` | TEXT[] | Top themes for overlap detection |
| `maturity_level` | TEXT, nullable | Quality tier derived from analysis |
| `updated_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with user. One-to-one with `essays` and `essay_profiles`.

**Primary query patterns**:
1. Load all essays for a user: `WHERE user_id = $1` (portfolio dashboard)
2. Find essays by theme overlap
3. Compare voice signatures across essays

**Update cadence**: Updated whenever an essay's North Star or improvement phase changes.

---

#### `portfolio_cross_patterns` — Cross-Essay Intelligence

**Purpose**: Stores patterns detected across multiple essays in a student's portfolio. Theme repetition, voice consistency, narrative strategy diversity, gap analysis. Updated whenever a new essay is analyzed or an existing essay's profile changes significantly.

**Key columns**:

| Column | Type | Why |
|--------|------|-----|
| `id` | UUID, PK | |
| `user_id` | TEXT | |
| `pattern_type` | TEXT (enum) | theme_overlap, voice_consistency, strategy_diversity, strength_concentration, gap_identified, portfolio_narrative |
| `description` | TEXT | |
| `essay_ids` | TEXT[] | Which essays participate in this pattern |
| `confidence` | SMALLINT | 0-100 confidence in the pattern |
| `detected_at` | TIMESTAMPTZ | |

**Key relationships**: Many-to-one with user. References multiple essays.

**Primary query patterns**:
1. Load all active patterns: `WHERE user_id = $1`
2. Load patterns involving a specific essay
3. Load patterns by type

**Update cadence**: Recomputed when any essay in the portfolio reaches "deep" confidence level or higher.

---

### Supporting Tables

#### `analysis_locks` — Concurrent Analysis Prevention

**Purpose**: Prevents concurrent full analysis runs on the same essay. Advisory lock semantics with heartbeat.

**Key columns**: `id` (UUID, PK), `essay_profile_id` (UUID, FK, UNIQUE), `analysis_run_id` (UUID), `heartbeat_at` (TIMESTAMPTZ — updated every 10 seconds), `acquired_at` (TIMESTAMPTZ).

**Stale lock detection**: A lock with no heartbeat update in 60+ seconds is considered stale (crashed process). The recovery process can acquire a new lock after clearing the stale one.

**Primary query patterns**: Acquire lock (INSERT), update heartbeat, check for stale locks, release lock (DELETE).

---

#### `essay_version_snapshots` — Pre-Analysis Rollback Point

**Purpose**: Before any re-analysis, the current profile state is captured here. If a re-analysis produces worse results, the snapshot can be restored. Not a full version history — just a single rollback point per essay, overwritten each time.

**Key columns**: `id` (UUID, PK), `essay_profile_id` (UUID, FK, UNIQUE), `profile_snapshot` (JSONB — the complete assembled profile as a monolithic blob, the one place where a monolithic snapshot is appropriate), `text_hash` (TEXT), `created_at` (TIMESTAMPTZ).

**Primary query patterns**: Load snapshot for rollback. Overwrite before each re-analysis.

**Update cadence**: Overwritten before each re-analysis. One row per essay maximum.

---

## Key Table Design Decisions

### Why `essay_holistic_sections` uses individual rows (not JSONB columns)

1. **Independent update cadence.** A coaching reinterpretation may update voice_identity and thematic_architecture without touching narrative_strategy. Individual rows mean individual UPDATE statements with no read-modify-write cycle on unaffected sections.

2. **TOAST compression per-row.** Loading voice_identity (~400 tokens of JSONB) never decompresses admissions_positioning (~300 tokens). With JSONB columns on a single row, PostgreSQL may need to decompress the entire TOAST chunk even if only one column is requested.

3. **Profile Router's selective loading.** "Load voice and themes" maps directly to `WHERE section_type IN ('voice_identity', 'thematic_architecture')`. No application-layer column selection needed.

4. **Schema evolution.** Adding an 11th section type requires only a new enum value, not a schema migration.

### Why `essay_sentence_analyses` uses individual rows (not arrays)

1. **Back-propagation is surgical.** When L3's walk of paragraph 5 deepens understanding of P1S1, the Profile Manager updates exactly one row. With a JSONB array on the paragraph, it would load the entire array, parse it, modify one element, serialize the whole thing, and write it back.

2. **Scalar columns enable fast filtering.** `WHERE is_problem = true ORDER BY effectiveness ASC` returns the weakest sentences without any JSONB traversal. This query powers annotation generation. `effectiveness` and `is_problem` as scalar columns make this possible.

3. **Tag-based queries without JSONB traversal.** Tags promoted to a TEXT[] column enable `WHERE tags @> ARRAY['metaphor:diamond']` with GIN index support.

4. **Light-touch updates during editing are row-level.** Pathway 1 editing updates sentence text references and staleness markers per-sentence, with no profile-level optimistic lock needed (per M8). Two browser tabs editing different paragraphs never contend.

### Why `essay_connections` is a separate table (single canonical store)

Connections are the most duplication-prone data in the system. Without a canonical store, P1S1 would embed a description of its link to P3S4, and P3S4 would embed a (rephrased) description of the same link. The separate table stores each connection exactly once. Sentences carry only lightweight `connection_refs: ["conn_001"]` in their TEXT array column. The Profile Router resolves refs when building prompt context. This eliminates duplication completely.

### Why `essay_north_star` is separate from holistic sections

The North Star is populated by a different layer (L4 crystallization vs L3.75 holistic synthesis) and loaded for different purposes (edit interpretation, portfolio strategy, coaching orientation vs. per-dimension understanding). The five dimensions of the North Star (through-line map, structural roles, trajectory, distinctiveness, intent bridge) represent how an essay **means**, not what individual dimensions say about it. Different layer, different consumers, different update cadence — different table.

---

## Concurrency Model

### Optimistic Concurrency on `essay_profiles.write_version`

Every update to the profile index includes `WHERE write_version = $expected`. If it fails (another process incremented the version), the caller reloads and retries. This handles the common case of two coaching turns racing on the same profile.

### Analysis Locks with Heartbeat

The `analysis_locks` table prevents concurrent full analysis runs on the same essay. The orchestrator acquires a lock before starting; releases it on completion. Heartbeat updated every 10 seconds. Stale lock detection: no heartbeat in 60 seconds means the process crashed. Recovery clears the stale lock and acquires a new one.

### Coaching During Re-Analysis — No Contention

They write to different tables. Coaching writes to `coaching_messages` and `conversation_insights`. Re-analysis writes to `essay_sentence_analyses`, `essay_holistic_sections`, and `essay_paragraph_profiles`. The profile index is updated atomically at analysis completion. The coaching session reads the profile index (read-only during analysis).

At completion, the re-analysis does an optimistic update of `essay_profiles.profile_index`. If the coaching session also updated the profile (e.g., a reinterpretation that changed inferredIntents), the optimistic lock detects the conflict and the later writer retries with merged state.

### Light-Touch Updates (Pathway 1) — No Profile Lock

During active editing (Pathway 1), text reference updates and staleness markers use per-sentence row-level updates on `essay_sentence_analyses`. These do not touch `essay_profiles.write_version` and therefore do not conflict with concurrent coaching or analysis. Only the Profile Manager's analytical mutations (understanding/analysis updates that change the profile index) use the optimistic lock (per M8).

### Circuit Breaker

Max 3 retries per checkpoint. After 3 failures on the same checkpoint label, the analysis run is marked `status = 'failed'` with error details. The student sees: "We're having trouble analyzing this section." No infinite crash-resume loops.

---

## 15 Most Common Queries

These queries drive index design. Listed by frequency, most common first.

| # | Description | Access Pattern |
|---|-------------|---------------|
| 1 | Load profile index for routing | `SELECT profile_index FROM essay_profiles WHERE essay_id = $1` |
| 2 | Load specific holistic section(s) | `SELECT content FROM essay_holistic_sections WHERE essay_profile_id = $1 AND section_type IN ($2, $3)` |
| 3 | Load paragraph understanding for walk | `SELECT understanding FROM essay_paragraph_profiles WHERE essay_profile_id = $1 AND paragraph_index = $2` |
| 4 | Load sentence analysis for feedback | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND paragraph_index = $2 ORDER BY sentence_index` |
| 5 | Load connections involving a paragraph | `SELECT * FROM essay_connections WHERE essay_profile_id = $1 AND (from_paragraph = $2 OR to_paragraph = $2)` |
| 6 | Update sentence understanding (back-propagation) | `UPDATE essay_sentence_analyses SET understanding = $2 WHERE essay_profile_id = $1 AND paragraph_index = $3 AND sentence_index = $4` |
| 7 | Update holistic section | `UPDATE essay_holistic_sections SET content = $2, token_estimate = $3 WHERE essay_profile_id = $1 AND section_type = $4` |
| 8 | Create/update connection | `INSERT INTO essay_connections (...) ON CONFLICT (connection_id) DO UPDATE SET description = $2` |
| 9 | Load North Star for coaching | `SELECT * FROM essay_north_star WHERE essay_profile_id = $1` |
| 10 | Record coaching turn | `INSERT INTO coaching_messages (session_id, turn_index, role, content, focus_detection, cost, ...)` |
| 11 | Store conversation insight | `INSERT INTO conversation_insights (essay_profile_id, category, content, scope, ...)` |
| 12 | Load version record for re-analysis brief | `SELECT * FROM essay_version_records WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1` |
| 13 | Query sentences by tag | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND tags @> ARRAY[$2]` |
| 14 | Query sentences with problems (effectiveness < threshold) | `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND is_problem = true ORDER BY effectiveness ASC` |
| 15 | Load portfolio index for cross-essay analysis | `SELECT * FROM portfolio_essay_index WHERE user_id = $1` |

---

## Indexes

### B-tree Indexes (equality and range lookups)

| Table | Index | Columns | Why |
|-------|-------|---------|-----|
| `essay_profiles` | PK | `id` | Standard |
| `essay_profiles` | UNIQUE | `essay_id` | One profile per essay |
| `essay_profiles` | | `user_id` | RLS + dashboard queries |
| `essay_holistic_sections` | UNIQUE | `(essay_profile_id, section_type)` | Primary access pattern — composite covers both "load specific" and "load all" |
| `essay_paragraph_profiles` | UNIQUE | `(essay_profile_id, paragraph_index)` | Primary access pattern, enforces uniqueness |
| `essay_sentence_analyses` | UNIQUE | `(essay_profile_id, paragraph_index, sentence_index)` | Primary access pattern, covers paragraph-scoped queries |
| `essay_sentence_analyses` | PARTIAL | `(essay_profile_id) WHERE is_problem = true` | Weak sentence queries — partial index keeps it small |
| `essay_sentence_analyses` | | `(essay_profile_id, effectiveness)` | Sorting by effectiveness |
| `essay_connections` | UNIQUE | `connection_id` | Human-readable unique identifier |
| `essay_connections` | | `(essay_profile_id)` | Load all connections for a profile |
| `essay_connections` | | `(essay_profile_id, from_paragraph)` | Paragraph-scoped connection queries |
| `essay_connections` | | `(essay_profile_id, to_paragraph)` | Paragraph-scoped connection queries (reverse direction) |
| `essay_north_star` | UNIQUE | `essay_profile_id` | One-to-one |
| `analysis_runs` | | `(essay_profile_id, created_at DESC)` | Latest run query |
| `analysis_runs` | | `user_id` | Cost aggregation |
| `analysis_checkpoints` | | `(run_id, completed_at DESC)` | Latest checkpoint query |
| `coaching_sessions` | | `(essay_profile_id, ended_at)` | Active session lookup (ended_at IS NULL) |
| `coaching_messages` | | `(session_id, turn_index)` | Ordered message retrieval |
| `conversation_insights` | | `(essay_profile_id, invalidated_at)` | Active insights (invalidated_at IS NULL) |
| `student_insights` | | `user_id` | Student-level insights |
| `essay_version_records` | | `(essay_profile_id, created_at DESC)` | Latest version record |
| `portfolio_essay_index` | | `user_id` | Portfolio dashboard |
| `portfolio_cross_patterns` | | `user_id` | Active patterns |
| `analysis_locks` | UNIQUE | `essay_profile_id` | One lock per essay |

### GIN Indexes (array and JSONB path queries)

| Table | Index | Column | Why |
|-------|-------|--------|-----|
| `essay_sentence_analyses` | GIN | `tags` | Tag-based queries: `tags @> ARRAY['metaphor:diamond']` |
| `essay_sentence_analyses` | GIN | `understanding` using `jsonb_path_ops` | Deep JSONB queries on understanding sub-fields |
| `essay_profiles` | GIN | `profile_index` using `jsonb_path_ops` | Rare but needed for topic tag searches across essays |
| `essay_paragraph_profiles` | GIN | `tags` | Paragraph-level tag queries |

GIN indexes are expensive to maintain on write-heavy columns. The sentence `tags` GIN index is justified because tag-based routing is a high-frequency read path. The profile index GIN is a judgment call — it can be deferred if writes become a bottleneck.

---

## RLS Policy

**Users**: Read-only on their own data across all tables. Every table has `user_id` (either directly or via foreign key chain to `essay_profiles`). Policy: `USING (user_id = auth.uid())` for SELECT. No INSERT/UPDATE/DELETE for users on profile tables.

**Service role**: Full access for pipeline operations. All analysis writes, profile mutations, and insight processing happen server-side under the service role.

**No client-side writes to profile tables**: The client can write to `coaching_messages` (student messages) and can trigger analysis via API endpoints, but never directly writes to `essay_profiles`, `essay_holistic_sections`, `essay_sentence_analyses`, or any profile structure. All mutations go through the Profile Manager on the server.

**Cross-table RLS**: Tables without a direct `user_id` column (e.g., `coaching_messages` which has `session_id`) use a foreign-key-based policy joining to the parent table's `user_id`. PostgreSQL RLS supports this via subquery policies.

---

## Migration Strategy: 3-Phase, Zero Data Loss

### Current State

One table: `essay_understanding` with a single `understanding` JSONB column holding the entire profile as a monolithic blob. Plus extracted scalars (`overall_eqi`, `impression_label`, `readiness_level`).

### Phase A — Additive (no data loss, both schemas live)

1. Create all 17 new tables alongside `essay_understanding`. No drops, no renames.
2. Update the Essay Intelligence service to write to BOTH the old monolithic column AND the new decomposed tables (dual-write).
3. Read from the new tables when they have data, fall back to the old column for legacy data.
4. New features (North Star, student insights, version records) write only to new tables — no backport to old schema.

**Duration**: As long as needed. No urgency to move off Phase A.

### Phase B — Backfill (decompose existing data)

5. Run a migration script that reads each `essay_understanding` row, decomposes its JSONB into the new tables, and marks it as migrated.
6. Verify data integrity: assembled profile from new tables matches the original JSONB blob (field-by-field comparison, not byte-equality since ordering may differ).
7. Set `legacy_profile = true` on migrated profiles. These have the old data decomposed into new tables but lack new structures (voice map, earned-ness map, North Star). They need a re-analysis pass to populate those sections. Estimated cost: ~$0.50-1.00 per essay (per M9).
8. Legacy re-analysis can be done lazily (triggered when the student next opens the essay) or batched (background job during off-peak).

**Duration**: One-time script, runs in minutes for current data volume.

### Phase C — Cutover (switch reads, stop old writes)

9. Switch all reads to the new tables exclusively. Remove the old-table fallback code.
10. Stop writing to the old `understanding` column. Remove dual-write code.
11. After a 1-2 week confidence period with monitoring, drop the `essay_understanding` table.

**Data safety**: No data is lost at any step. Both schemas coexist during migration. The old table is dropped only after verified confidence in the new schema.

---

## Updated Key Design Decision #10

**Old**: "JSONB document, not normalized tables — 200-500KB+ of JSON per essay. One query to load, one to save. Profile Index enables partial retrieval without loading the full document."

**New**: "Split-table architecture with JSONB for complex structures."

The one-table JSONB approach created three problems that could not be resolved within a monolithic schema:

1. **Contention**: Coaching updates lock the whole profile. A coaching reinterpretation that touches voice identity must load, modify, and write back the entire 300KB+ blob — blocking any concurrent analysis or other coaching process writing to the same row.

2. **No selective loading at the DB level**: The Profile Router could select which fields to include in prompts, but PostgreSQL still decompressed the full TOAST blob on every read. Loading voice identity for a quick coaching turn always paid the I/O cost of loading admissions positioning, craft assessment, and every sentence's analysis.

3. **Schema evolution was painful**: Adding a new section (voice map, earned-ness map) meant modifying the shape of a deeply nested JSONB structure. No migration tooling. No ability to add an index on a new field without a GIN index on the entire blob. No ability to query the new structure without full-document traversal.

The split-table architecture solves all three:
- **Surgical updates**: Update one sentence, one holistic section, or one connection without touching anything else.
- **Selective loading**: `WHERE section_type IN ('voice_identity')` loads only voice. The DB never decompresses unneeded sections.
- **Proper indexing**: Scalar columns (`effectiveness`, `is_problem`, `priority`) enable B-tree indexes. Tags as TEXT[] enable GIN arrays. No JSONB path traversal for common queries.
- **Independent concurrency**: Coaching writes to `coaching_messages`. Analysis writes to `essay_sentence_analyses`. Different tables, no contention, no locking conflict.
- **JSONB preserved where it belongs**: Deeply nested structures within each table (sentence understanding, holistic section content, North Star dimensions) remain JSONB — loaded as a unit, never partially queried.

---

## Risks & Mitigations

### Join Overhead (Too Many Tables)

With 19 tables, assembling a full profile requires multiple queries. But we NEVER assemble the full profile in one query — the Profile Router always loads selectively. The most common query (load profile index) is a single-table single-row read. When multiple tables are needed, the Profile Router batches related queries in parallel. Loading "paragraph 2's sentences + their connections" is two parallel queries, not N sequential ones.

### Row Growth Per Sentence

~25 sentences per essay x many essays = many rows. Each row is small (2-5KB of JSONB). PostgreSQL handles millions of rows with the composite index on (`essay_profile_id`, `paragraph_index`, `sentence_index`) providing O(log N) lookups. For a college application platform where each user has at most ~10-15 essays, the total row count stays well within single-digit millions even at scale. If it ever becomes a concern, partition `essay_sentence_analyses` by `essay_profile_id`.

### Stale Profile Index

The profile index in `essay_profiles` is a denormalized cache of the full profile state. If a sentence is updated but the index is not recomputed, tags, concerns, and the connection graph may be stale. The Profile Manager always recomputes the index after any mutation and writes it atomically with the optimistic concurrency check. The index is never independently updated — every index write accompanies a write_version increment.

### Optimistic Retry Storms

If many processes update the same essay simultaneously, optimistic lock retries could cascade. In practice, only 2 processes ever touch the same essay concurrently (coaching + re-analysis), and they write to different tables. The analysis lock prevents concurrent analysis runs. Coaching turns are serialized by the student's typing speed. Maximum expected retries: 1-2.

### JSONB Column Evolution

If the internal structure of a JSONB column changes (e.g., `observedFunctions` gains a new field), old rows have the old shape. The application layer treats JSONB as typed but tolerant — missing fields get defaults at read time. No database-level JSONB schema enforcement. TypeScript interfaces define the canonical shape; the deserializer handles version differences gracefully.

### Token Estimation Drift (Review M6)

The `token_estimate` column on `essay_holistic_sections` uses a ratio of ~3.2 chars/token for structured text (accounting for the ~15-20% overhead from labels and headers). If rendering format changes, the ratio must be recalibrated. Incorrect estimates cause the Profile Router to over- or under-load sections. Mitigation: recalibrate against the actual rendered format, not raw JSONB content.

---

## Modularity & Evolution

The architecture supports organic growth without structural upheaval.

**Adding a new holistic section**: Add a new enum value to `holistic_section_type`. No schema migration beyond the enum update. No existing queries break. The Profile Router adds a new loading rule. The "10 rows per essay" becomes "11 rows per essay."

**Adding a new analysis layer**: Add rows to `analysis_runs` with the new layer in the `layers_completed` array. No schema changes. The orchestrator's checkpoint logic adds a new checkpoint label.

**Extracting a JSONB field to its own table**: If `essay_sentence_analyses.understanding` becomes a bottleneck because we query `observedFunctions` frequently, we can extract `observedFunctions` into its own table (one row per observation entry) without touching any other table. The JSONB-to-table migration is local to one module.

**New portfolio pattern types**: Just new enum values on `portfolio_cross_patterns.pattern_type`. The table structure does not change.

**New insight categories**: New enum values on `insight_category`. The Profile Manager's insight handling extends naturally.
