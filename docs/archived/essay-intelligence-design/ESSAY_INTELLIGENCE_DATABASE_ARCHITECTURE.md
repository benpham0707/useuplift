# Essay Intelligence System — Database Architecture

> Conceptual architecture for a senior engineer who will write the SQL.
> Replaces the single `essay_understanding` table with a modular, specialized schema.

---

## Design Philosophy

### Principle 1: One Entity, One Table

Every distinct concept gets its own dedicated table. We do not cram sentence-level understanding, holistic voice analysis, cross-essay connections, conversation insights, and telemetry into a single JSONB column. When a concept has its own lifecycle, access pattern, or update cadence, it earns its own table.

Why: A coaching turn that updates one sentence's inferred intent should not require loading, deserializing, modifying, re-serializing, and writing back a 300KB JSONB blob. It should be a single row update on a focused table.

### Principle 2: JSONB Where Structure Varies, Columns Where Queries Need Speed

Each table has a clear boundary between "queryable scalar columns" (indexed, filterable, joinable) and "rich interior data" (JSONB, opaque to queries, loaded by the application layer). The split follows a simple test: if we will ever write `WHERE column = ...` or `ORDER BY column`, it is a scalar column. If we only read it as part of loading an entity, it is JSONB.

Example: A sentence's `effectiveness` score is a scalar column (we query "which sentences need work"). The `observedFunctions` array is JSONB (we load it whole, never filter by individual observations).

### Principle 3: The Profile Is Assembled, Not Fetched

The EssayProfile is not a single database row. It is a composite assembled from multiple focused tables. The Profile Router decides which tables to query based on the task at hand. A coaching turn about voice loads the `holistic_sections` table (voice row) and a few tagged sentences. A full L5 annotation pass loads everything. The database schema makes this selective loading natural — you query the tables you need, skip the rest.

### Principle 4: Write Frequency Drives Table Boundaries

Tables are split along write-frequency boundaries to minimize contention. The profile index (updated after every layer) is a separate table from paragraph profiles (updated once per paragraph during the walk, then rarely). Conversation insights (written on every coaching turn) are separate from analysis results (written once per analysis pass). Two concurrent processes — say, a coaching conversation and a background re-analysis — never contend for the same row.

### Principle 5: Soft Boundaries, Hard Ownership

Every row has a `user_id` (TEXT, Clerk format). RLS policies enforce that users see only their own data. The service role bypasses RLS for server-side pipeline operations. No table is accessible without either a valid user context or the service role.

---

## Domain Modules

The schema organizes into 6 domain modules. Each module owns a cluster of tables and can be queried independently. Cross-module joins happen only for assembly (building the full profile) and portfolio aggregation.

### Module 1: Essay Core

The essay itself — text, versions, metadata. Already exists. The Essay Intelligence System reads from here but does not own these tables.

**Tables (existing)**: `essays`, `essay_revision_history`

### Module 2: Essay Profile

The heart of the system. The multi-resolution understanding map decomposed into specialized tables that can be loaded independently.

**Tables**: `essay_profiles`, `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_sentence_analyses`, `essay_connections`, `essay_dna`

### Module 3: Analysis Lifecycle

Tracks what analysis work has been done, what it cost, what changed. The audit trail for the 8-layer pipeline.

**Tables**: `analysis_runs`, `analysis_checkpoints`

### Module 4: Conversation & Coaching

Everything that happens during L6 coaching — messages, insights extracted, focus detection results.

**Tables**: `coaching_sessions`, `coaching_messages`, `conversation_insights`

### Module 5: Feedback & Improvement

The progressive precision system — improvement phases, annotation deliveries, feedback quality tracking.

**Tables**: `improvement_phases`, `annotation_deliveries`, `feedback_quality`

### Module 6: Portfolio Intelligence

Cross-essay patterns, portfolio-level strategy, application-level coherence.

**Tables**: `portfolio_essay_index`, `portfolio_cross_patterns`, `portfolio_strategy`

---

## The 15 Core Tables

### 1. `essay_profiles` — The Central Anchor

**Purpose**: One row per essay. The hub that everything else foreign-keys to. Stores the profile index (always-loaded compact TOC), overall metadata, and concurrency control fields.

**What it stores**: Profile index (JSONB, ~2-4KB — paragraph digests, topic tags, connection graph, section token counts, active concerns, improvement phase). Confidence level (scalar — initial/developing/deep/comprehensive). Write version number (integer, incremented on every update for optimistic concurrency). Overall quality snapshot scalars (essay quality score, impression label, readiness level) for dashboard queries without loading profile data. Last analysis layer completed. Total accumulated cost.

**Key relationships**: One-to-one with `essays`. One-to-many parent of `essay_holistic_sections`, `essay_paragraph_profiles`, `essay_connections`, `essay_dna`, `analysis_runs`, `coaching_sessions`.

**Primary query patterns**: Load profile index by essay_id (every API call). Check confidence level (mode selection). Dashboard queries on quality/impression scalars. Optimistic concurrency check on write version.

**Concurrency model**: The write version column is the optimistic lock. Every UPDATE includes `WHERE write_version = $expected`. If it fails (version mismatch), the caller reloads and retries. This handles the common case of two coaching turns racing on the same profile.

### 2. `essay_holistic_sections` — Voice, Theme, Narrative, Character, Craft, Emotion, Admissions

**Purpose**: Stores each of the 7 holistic understanding sections as a separate row. Allows loading voice identity without loading admissions positioning. Each section has its own update cadence — voice might be updated by a coaching reinterpretation while themes remain stable.

**What it stores**: Section type (enum: voice_identity, emotional_topography, thematic_architecture, narrative_strategy, character_revelation, craft_assessment, admissions_positioning). Section data (JSONB — the full typed content per the PLAN.md structures). Token count estimate (integer — for Profile Router budgeting). Layer that last updated it. Updated timestamp.

**Key relationships**: Many-to-one with `essay_profiles`. Seven rows per essay (one per section type).

**Primary query patterns**: Load specific section(s) by essay_profile_id + section_type. Load all sections for comprehensive assembly. Token count lookups for budget planning.

**Why 7 rows instead of 7 JSONB columns on essay_profiles**: Individual rows can be updated independently without touching the other 6. PostgreSQL TOAST compression works per-row, so loading one section never decompresses the others. Different sections can have different last-updated timestamps. And the Profile Router's "load sections X, Y, Z" maps directly to `WHERE section_type IN ('X', 'Y', 'Z')`.

### 3. `essay_paragraph_profiles` — Per-Paragraph Understanding + Analysis

**Purpose**: One row per paragraph. Contains the paragraph-level understanding (role, function, narrative contribution, emotional register, craft profile) and paragraph-level analysis (effectiveness, verdict). Also holds the paragraph's text and text hash for change detection.

**What it stores**: Paragraph index (integer). Paragraph text (text). Text hash (text — for diff detection). Understanding data (JSONB — role, function, narrative contribution, emotional register, craft profile, tags). Analysis data (JSONB, nullable — effectiveness score, verdict; null until L3.5 runs). Layer that last updated understanding vs analysis (separate timestamps). Sentence count (integer — for bounds validation).

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `essay_sentence_analyses`.

**Primary query patterns**: Load single paragraph by profile_id + paragraph_index (L3 walk, coaching about specific paragraph). Load all paragraphs (comprehensive assembly). Load only understanding fields (L3.5 analysis needs understanding but not prior analysis). Check text hash for change detection during re-analysis.

### 4. `essay_sentence_analyses` — Per-Sentence Deep Understanding + Analysis

**Purpose**: One row per sentence. The most granular table — stores the full `SentenceDeepAnalysis` structure with understanding and analysis as separate JSONB sub-objects. This is the "big data" table in terms of row count (5 paragraphs x ~5 sentences = ~25 rows per essay).

**What it stores**: Paragraph index + sentence index (composite key within essay). Sentence text (text). Understanding (JSONB — observedFunctions, inferredIntents, rhetoricalFunctions, narrativeContributions, paragraphContribution, rhythmContribution, voiceAlignment, techniques, significantChoices, connectionRefs, tags). Analysis (JSONB, nullable — effectiveness score, effectivenessReasoning, strengths, weaknesses, isStrength, isProblem, priorityForImprovement). Effectiveness score also as a scalar column (for querying "weakest sentences"). isStrength and isProblem as scalar boolean columns (for quick filtering).

**Key relationships**: Many-to-one with `essay_paragraph_profiles`.

**Primary query patterns**: Load all sentences for a paragraph (understanding walk context). Load specific sentence by paragraph + sentence index (focused analysis, coaching). Load sentences flagged isProblem=true (annotation generation). Load sentences by tag match (coaching routing — "find sentences tagged metaphor:diamond"). Load understanding-only (L3.5 analysis pass needs understanding but no prior analysis).

**Why individual rows instead of a JSONB array on paragraph_profiles**: A back-propagation from P5 to P1S1 should update one row, not load/deserialize/modify/serialize the entire P1 sentence array. Individual rows also enable tag-based and score-based queries without JSONB traversal. And a focused analysis that touches P2S4 reads one row, not 5.

### 5. `essay_connections` — Cross-Sentence Relationships

**Purpose**: The single canonical store for all cross-paragraph connections. Each connection is stored once. Sentences reference connections by ID (stored in their `connectionRefs` JSONB array). Eliminates the duplication problem described in the PLAN's anti-repetition architecture.

**What it stores**: Connection ID (text — "conn_001" etc.). From location (paragraph, sentence). To location (paragraph, sentence). Connection type (text — callback, echo, contrast, setup-payoff, escalation, thread_continuation). Description (text). Layer that discovered it. Image recurrences (separate rows, typed as image_recurrence). Narrative arc roles (separate rows, typed as arc_role). Redundancies (separate rows, typed as redundancy).

**Key relationships**: Many-to-one with `essay_profiles`. Referenced by `essay_sentence_analyses` via connectionRefs.

**Primary query patterns**: Load all connections for a profile (comprehensive assembly). Load connections involving a specific paragraph/sentence (focused analysis, coaching). Load by type (load all callbacks, load all image recurrences). Load connection graph summary for profile index rebuilding.

### 6. `essay_dna` — Compressed Identity Card

**Purpose**: The ~500-token crystallized identity produced by L4. Separate from the profile because it is consumed by completely different systems (RAG queries, portfolio comparisons, coaching context preamble) and has a different update cadence (only regenerated on full L4 crystallization).

**What it stores**: Thesis statement. Emotional core. 30-second AO pitch. Voice signature summary. Distinctiveness signature. Top strengths. Growth areas. Quality snapshot. Paragraph score matrix (JSONB — per-paragraph scores with cross-paragraph patterns). Coherence report (JSONB — any contradictions found during crystallization).

**Key relationships**: One-to-one with `essay_profiles`.

**Primary query patterns**: Load by essay_profile_id (RAG, portfolio, coaching preamble). Load paragraph score matrix only (dashboard, improvement tracking). Load coherence report (quality monitoring).

### 7. `analysis_runs` — Pipeline Execution Audit Trail

**Purpose**: One row per analysis execution (initial full pass, comprehensive re-analysis, focused re-analysis). Tracks what layers ran, what they cost, what changed, how long they took. This is the cost and performance telemetry table.

**What it stores**: Run type (enum: initial_full, comprehensive_reanalysis, focused_reanalysis, fresh_restart). Trigger (text — what caused this run: first_upload, text_edit, coaching_reinterpretation). Mode selection reasoning (text — why comprehensive vs focused was chosen). Per-layer breakdown (JSONB — for each layer: did it run, cost in USD, duration in ms, tokens used, what changed). Total cost. Total duration. Essay version at start and end. Error details if any layer failed. Checkpoint state.

**Key relationships**: Many-to-one with `essay_profiles`.

**Primary query patterns**: Load latest run for an essay (resumption after crash). Load all runs for cost reporting. Aggregate cost per user. Performance monitoring (average L3 walk duration, average re-analysis cost).

### 8. `analysis_checkpoints` — Crash Recovery Snapshots

**Purpose**: Strategic database saves at natural pipeline boundaries. If the server crashes mid-L3-walk, we resume from the last checkpoint instead of restarting the entire pipeline. One row per checkpoint within an analysis run.

**What it stores**: Checkpoint label (text — "after_L1_L2", "after_L3_paragraph_3", "after_L3_complete", "after_L3.75", "after_L3.5", "after_L4_L5"). Pipeline state (JSONB — which paragraphs completed, the profile snapshot at this point, any pending back-propagations). The analysis run it belongs to. Timestamp.

**Key relationships**: Many-to-one with `analysis_runs`.

**Primary query patterns**: Load latest checkpoint for an essay (crash recovery). Delete old checkpoints after successful run completion.

**Lifecycle**: Checkpoints are ephemeral. After a successful analysis run completes, all checkpoints for that run can be deleted. Only the most recent run's checkpoints matter.

### 9. `coaching_sessions` — Conversation Container

**Purpose**: One row per coaching session. A session starts when the student enters the coaching interface and may span many messages. Tracks session-level state: what the student's goals are, current focus area, improvement phase at session start.

**What it stores**: Session start time, end time (nullable — null while active). Student's stated goals (text array). Improvement phase at session start and current (for tracking phase progression within a session). Message count. Total cost for this session. Active flag.

**Key relationships**: Many-to-one with `essay_profiles`. One-to-many parent of `coaching_messages` and `conversation_insights`.

**Primary query patterns**: Load active session for an essay. Load session history for a student. Aggregate coaching cost per essay.

### 10. `coaching_messages` — Conversation History

**Purpose**: Immutable log of every message in a coaching session. Both student messages and system responses. Ordered by sequence number within a session.

**What it stores**: Sequence number within session. Role (student, coach, system). Content (text). Message classification (enum: simple_confirmation, significant_reinterpretation, new_context, question_only, revision_request — for student messages). Focus detection result (JSONB — which paragraph/sentence the student is focused on, which profile sections were loaded). Cost of this turn (if it involved LLM calls). Timestamp.

**Key relationships**: Many-to-one with `coaching_sessions`.

**Primary query patterns**: Load messages for a session in order. Load most recent N messages for coaching context. Count messages per session.

### 11. `conversation_insights` — Extracted Student Intent

**Purpose**: When a student reveals something about their essay's intent — confirming an interpretation, correcting a misunderstanding, providing new context — the insight is extracted and stored here. Each insight has a category, scope, and a record of how it impacted the profile.

**What it stores**: Category (enum: confirmation, reinterpretation, new_context, preference, clarification). Scope (enum: essay, paragraph, sentence — plus paragraph/sentence indices when applicable). Source quote (text — the student's exact words that triggered this insight). Extracted understanding (text — what the system learned from the student's statement). Profile impact description (text — what changed in the profile as a result). Superseded insight ID (nullable — if this insight replaces a prior one). Active flag (boolean — false when superseded). Coaching message that triggered it. Timestamp.

**Key relationships**: Many-to-one with `coaching_sessions` and `essay_profiles`. Self-referential (superseded_by).

**Primary query patterns**: Load active insights for an essay (coaching context). Load insights by scope (all insights about paragraph 2). Load insights by category (all reinterpretations). Check for supersession chains.

### 12. `improvement_phases` — Progressive Precision History

**Purpose**: Tracks the essay's journey through improvement phases. Every time the phase is recomputed (after each analysis pass), a new row is created. The current phase lives in the profile index, but the history lives here — enabling "show me how this essay has improved over time."

**What it stores**: Phase level (enum: foundation, architecture, craft, polish, distinction). Reasoning (text). Focus areas (text array). Deferred areas (text array). Readiness scores (4 integers: essay, paragraph, sentence, word level). What triggered the phase computation (analysis run ID). Timestamp. Is-current flag.

**Key relationships**: Many-to-one with `essay_profiles`. References `analysis_runs`.

**Primary query patterns**: Load current phase for an essay. Load phase history (improvement journey). Compare readiness scores across time.

### 13. `annotation_deliveries` — What Feedback Was Given

**Purpose**: Tracks every annotation/feedback delivery to the student. L5 generates annotations; this table records what was delivered, at what phase, and (later) whether the student acted on it. Feedback itself is ephemeral (not stored in the profile), but the delivery RECORD is persistent for quality tracking.

**What it stores**: Delivery context (enum: initial_analysis, re_analysis, coaching_turn). Improvement phase at delivery time. Annotations delivered (JSONB — the array of annotation objects with locations, suggestions, teaching rationales). Annotation count. Target paragraph/sentence locations. Analysis run that generated these (nullable — null for coaching-generated feedback). Student acted on it (boolean, updated later). Timestamp.

**Key relationships**: Many-to-one with `essay_profiles`. Optionally references `analysis_runs`.

**Primary query patterns**: Load latest annotations for an essay. Track acted-on rate per phase. Aggregate annotation quality metrics.

### 14. `portfolio_essay_index` — Cross-Essay Lightweight Lookup

**Purpose**: A denormalized, lightweight index of all essays in a student's portfolio. Enables portfolio-level queries without joining through the full profile tables. One row per essay, carrying the EssayDNA fields that matter for cross-essay comparison.

**What it stores**: Essay ID. Essay type. Thesis summary (from DNA). Voice signature summary (from DNA). Top themes (text array). Distinctiveness factors (text array). Quality snapshot (score, impression). Improvement phase. Last analyzed timestamp.

**Key relationships**: Many-to-one with user (via user_id). One-to-one with `essays` and `essay_profiles`.

**Primary query patterns**: Load all essays for a user (portfolio dashboard). Find essays by theme overlap. Compare voice signatures across essays. Sort by quality score.

### 15. `portfolio_cross_patterns` — Cross-Essay Intelligence

**Purpose**: Stores patterns detected across multiple essays in a student's portfolio. Theme repetition, voice consistency, narrative strategy diversity, gap analysis. Updated whenever a new essay is analyzed or an existing essay's profile changes significantly.

**What it stores**: Pattern type (enum: theme_overlap, voice_consistency, strategy_diversity, strength_concentration, gap_identified, portfolio_narrative). Involved essays (UUID array). Pattern description (text). Severity/significance (enum). Recommendation (text — what the student should do about this pattern). Detected at timestamp. Still active flag.

**Key relationships**: Many-to-one with user. References multiple essays.

**Primary query patterns**: Load all active patterns for a user. Load patterns involving a specific essay. Load patterns by type.

---

## Supporting Tables

### `prompt_cache_metadata`

Tracks prompt caching effectiveness. One row per cacheable prompt block (system instructions, essay-specific context). Stores cache key hash, hit count, miss count, token savings estimate, last hit timestamp. Pruned periodically (delete blocks not hit in 7+ days).

**Primary use**: Optimize caching strategy. Identify which prompt blocks save the most tokens. No user-facing queries.

### `feedback_quality`

Aggregates feedback quality signals. One row per feedback delivery with metrics: was the student's next edit aligned with the suggestion? Did the improvement phase advance? Was the feedback acknowledged in conversation? Links back to `annotation_deliveries`.

**Primary use**: Prompt iteration — identify which types of feedback lead to actual improvement.

### `essay_version_snapshots`

Pre-analysis profile snapshots. Before any re-analysis, the current profile state is captured here (one row per essay, overwritten each time). If a re-analysis produces worse results, the snapshot can be restored. Not a full version history — just a single rollback point.

**What it stores**: The complete assembled profile as a JSONB blob (this is the one place where a monolithic snapshot is appropriate — it is a backup, not a working store). The essay text hash at snapshot time. Timestamp.

### `analysis_locks`

Prevents concurrent full analysis runs on the same essay. One row per active lock. The analysis orchestrator acquires a lock before starting; releases it on completion or timeout. Advisory lock semantics — the lock row includes a heartbeat timestamp updated every 10 seconds, so stale locks from crashed processes can be detected (stale = no heartbeat update in 60+ seconds).

---

## Access Patterns: The 15 Most Common Queries

1. **Load profile index for routing** — `SELECT profile_index FROM essay_profiles WHERE essay_id = $1` (every API call, <1ms)
2. **Load specific holistic sections** — `SELECT section_data FROM essay_holistic_sections WHERE essay_profile_id = $1 AND section_type IN ($2, $3)` (L6 coaching, L3.5 analysis)
3. **Load all sentences for a paragraph** — `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND paragraph_index = $2 ORDER BY sentence_index` (L3 walk context, coaching about paragraph)
4. **Load sentences by tag** — `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND understanding->'tags' ? $2` (coaching routing — "find metaphor:diamond")
5. **Load weak sentences** — `SELECT * FROM essay_sentence_analyses WHERE essay_profile_id = $1 AND is_problem = true ORDER BY effectiveness ASC` (annotation generation)
6. **Load connections for a paragraph** — `SELECT * FROM essay_connections WHERE essay_profile_id = $1 AND (from_paragraph = $2 OR to_paragraph = $2)` (focused analysis, coaching context)
7. **Update single sentence understanding** — `UPDATE essay_sentence_analyses SET understanding = $2 WHERE essay_profile_id = $1 AND paragraph_index = $3 AND sentence_index = $4` (back-propagation)
8. **Optimistic profile update** — `UPDATE essay_profiles SET profile_index = $2, write_version = write_version + 1 WHERE id = $1 AND write_version = $3` (after every layer)
9. **Load essay DNA** — `SELECT * FROM essay_dna WHERE essay_profile_id = $1` (RAG, portfolio, coaching preamble)
10. **Load coaching messages** — `SELECT * FROM coaching_messages WHERE coaching_session_id = $1 ORDER BY sequence_number` (L6 context)
11. **Insert conversation insight** — `INSERT INTO conversation_insights (...)` (after every significant coaching turn)
12. **Load active insights** — `SELECT * FROM conversation_insights WHERE essay_profile_id = $1 AND active = true` (coaching context enrichment)
13. **Load portfolio essay index** — `SELECT * FROM portfolio_essay_index WHERE user_id = $1` (portfolio dashboard, cross-essay routing)
14. **Load latest analysis run** — `SELECT * FROM analysis_runs WHERE essay_profile_id = $1 ORDER BY created_at DESC LIMIT 1` (crash recovery, cost display)
15. **Load improvement phase history** — `SELECT * FROM improvement_phases WHERE essay_profile_id = $1 ORDER BY created_at` (improvement journey visualization)

---

## Concurrency & Integrity

### Scenario: Coaching Conversation During Background Re-Analysis

The student is chatting with the coach (L6, writing to `coaching_messages` and `conversation_insights`) while a triggered re-analysis is running (writing to `essay_sentence_analyses`, `essay_holistic_sections`, `essay_paragraph_profiles`).

**No contention**: They write to different tables. The coaching session reads the profile index (read-only during analysis — the index is updated atomically at the end). The re-analysis does not read coaching messages.

**At completion**: The re-analysis finishes and does an optimistic update of `essay_profiles.profile_index` with the new index. If the coaching session also updated the profile (e.g., a reinterpretation that changed inferredIntents), the optimistic lock detects the conflict and the later writer retries with the merged state.

### Scenario: Rapid Successive Edits

Student makes 3 edits in 5 seconds. The debounce layer (application-side, 1.5s) collapses these into one analysis trigger. The `analysis_locks` table prevents a second analysis from starting while the first is running. If the student edits again while analysis is in progress, the new edit is queued and processed after the current run completes (with the cumulative diff).

### Scenario: Server Crash Mid-Analysis

The L3 walk completed paragraphs 0-2 and wrote a checkpoint. The server crashes during paragraph 3. On restart, the system finds the latest checkpoint in `analysis_checkpoints`, loads the profile state from that checkpoint, and resumes the walk from paragraph 3. Paragraphs 0-2's understanding is preserved.

The `analysis_locks` table's heartbeat mechanism detects the stale lock (no heartbeat in 60s) and allows the recovery process to acquire a new lock.

### Integrity Rules

- `essay_profiles` is the cascade root. Deleting an essay profile cascades to all child tables (holistic sections, paragraphs, sentences, connections, DNA, analysis runs, coaching sessions, insights, phases, annotations).
- `essays` deletion cascades to `essay_profiles` (which cascades everything else).
- No orphan rows. Every table with a foreign key uses `ON DELETE CASCADE`.
- Soft deletes are used only for `conversation_insights` (the `active` flag and supersession chain) — everything else uses hard deletes because the data is derived and can be regenerated.

---

## Modularity & Evolution

### Adding a New Holistic Section

If we add an 8th holistic section (e.g., "cultural context analysis"), we add a new enum value to the section_type column on `essay_holistic_sections`. No schema migration needed beyond the enum update. No existing queries break. The Profile Router adds a new loading rule.

### Adding a New Analysis Layer

If we add Layer 3.25 (some intermediate analysis step), we add rows to `analysis_runs` with the new layer in the per-layer breakdown JSONB. No schema changes. The orchestrator's checkpoint logic adds a new checkpoint label.

### Moving from JSONB to Structured Columns

If `essay_sentence_analyses.understanding` becomes a performance bottleneck because we query `observedFunctions` frequently, we can extract `observedFunctions` into its own table (one row per observation entry) without touching any other table. The JSONB-to-table migration is local to one module.

### Portfolio Intelligence Growth

The `portfolio_cross_patterns` table is designed as a generic pattern store. New pattern types (e.g., "recommendation_letter_alignment", "school_fit_scoring") are just new enum values. The table structure does not change.

---

## Migration Strategy: From Current Schema to New

### Current State

One table: `essay_understanding` with a single `understanding` JSONB column holding the entire profile as a monolithic blob. Plus extracted scalars (overall_eqi, impression_label, readiness_level).

### Migration Path

**Phase A — Additive (no data loss, both schemas live):**
1. Create all new tables alongside `essay_understanding`.
2. Update the Essay Intelligence service to write to BOTH the old monolithic column AND the new decomposed tables.
3. Read from the new tables when they have data, fall back to the old column for legacy data.

**Phase B — Backfill:**
4. Run a migration script that reads each `essay_understanding` row, decomposes its JSONB into the new tables, and marks it as migrated.
5. Verify data integrity: assembled profile from new tables matches the original JSONB blob.

**Phase C — Cutover:**
6. Switch all reads to the new tables exclusively.
7. Stop writing to the old `understanding` column.
8. After a confidence period (1-2 weeks), drop the `essay_understanding` table.

No data loss at any step. Both schemas coexist during migration.

---

## Risks & Mitigations

### Risk: Too Many Tables = Join Overhead

With 15+ tables, assembling a full profile requires multiple queries. But: (1) we NEVER assemble the full profile in one query — the Profile Router always loads selectively, (2) the most common query (load profile index) is a single-table single-row read, (3) parallel queries to independent tables are faster than deserializing a 300KB JSONB blob.

**Mitigation**: The Profile Router batches related queries. Loading "paragraph 2's sentences + their connections" is two parallel queries, not N sequential ones.

### Risk: Row-Per-Sentence Storage Growth

25 sentences per essay x many essays = many rows. But: each row is small (2-5KB of JSONB). PostgreSQL handles millions of rows trivially. The composite index on (essay_profile_id, paragraph_index, sentence_index) makes lookups O(log N).

**Mitigation**: Partition `essay_sentence_analyses` by essay_profile_id if row count exceeds millions (unlikely for a college application platform — each user has at most ~10-15 essays).

### Risk: Profile Index Stale Between Updates

The profile index in `essay_profiles` is a denormalized cache of the full profile state. If a sentence is updated but the index is not recomputed, the index's tags, concern list, and connection graph may be stale.

**Mitigation**: The Profile Manager always recomputes the index after any mutation and writes it atomically with the optimistic concurrency check. The index is never independently updated.

### Risk: Optimistic Concurrency Retry Storms

If many processes update the same essay simultaneously, optimistic lock retries could cascade.

**Mitigation**: In practice, only 2 processes ever touch the same essay (coaching + re-analysis). The analysis lock prevents concurrent analysis runs. Coaching turns are serialized by the student's typing speed. The retry window is small (1-2 retries max).

### Risk: JSONB Column Evolution

If the internal structure of a JSONB column changes (e.g., `observedFunctions` gains a new field), old rows have the old shape.

**Mitigation**: The application layer treats JSONB as typed but tolerant — missing fields get defaults at read time. No database-level JSONB schema enforcement. TypeScript interfaces define the canonical shape; the deserializer handles version differences.
