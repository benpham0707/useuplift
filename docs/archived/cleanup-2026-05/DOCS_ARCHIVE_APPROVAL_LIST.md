# Docs Archive — Approval List (needs your decision)

> **83 docs** the swarm flagged as *plausibly stale but ambiguous*. Generated 2026-05-28.
> Context: 142 docs were already auto-archived this session (high-confidence, zero live references); 37 are live-keep and untouched.
>
> **How to use:** skim each group. Tick `[x]` on the ones to ARCHIVE; leave unticked to KEEP live. Then tell me "archive the ticked ones" (or "archive all of group A and B", etc.) and I'll `git mv` them.
> `refs:` shows what currently links to each doc (— = nothing). Many are referenced only by other ambiguous docs in the same group, so they can move together safely.

---

## A. Generated output / E2E dumps (almost certainly archive)  — 18 docs

- [ ] **ACADEMIC_HISTORY_USER_EXPERIENCE.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Sample user-facing output of academic history analysis.
    - refs: —
- [ ] **ACTIVITY_SCORING_USER_EXPERIENCE.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Sample user-facing output of the 1-10 activity scoring rubric.
    - refs: ACTIVITY_WORKSHOP_AUDIT_PLAN
- [ ] **ACTIVITY_WORKSHOP_ANALYSIS_OUTPUT.md**  · _2026-02-09_ · → `docs/archived/misc`
    - Sample full analysis/insights output from the v4.2 activity pipeline (superseded by v4.3).
    - refs: —
- [ ] **ACTIVITY_WORKSHOP_OVERVIEW_UI_CONTEXT.md**  · _2026-02-20_ · → `docs/archived/misc`
    - Maps backend output fields to Overview UI locations for Lovable frontend.
    - refs: ACTIVITY_WORKSHOP_FRONTEND_HANDOFF
- [ ] **ANALYSIS_OUTPUT_E2E.md**  · _2026-02-09_ · → `docs/archived/misc`
    - Sample end-to-end academic analysis output report (System A, zero-LLM).
    - refs: DEEP_REPORT_CONTEXT_HANDOFF, CONVERSATION_UX_E2E, OUTPUT_QUALITY_AUDIT
- [ ] **DEEP_ANALYSIS_OUTPUT_E2E.md**  · _2026-02-12_ · → `docs/archived/completion-snapshots`
    - Sample deep academic analysis report output (E2E dump)
    - refs: DEEP_REPORT_CONTEXT_HANDOFF, OUTPUT_QUALITY_AUDIT
- [ ] **DEEP_REPORT_AUDIT_PLAN.md**  · _2026-02-10_ · → `docs/archived/pipeline-history`
    - Quality audit and prioritized action plan for the Deep Academic Report (audit complete)
    - refs: —
- [ ] **DEEP_REPORT_IMPLEMENTATION_SWARM.md**  · _2026-02-10_ · → `docs/archived/pipeline-history`
    - Swarm prompt for sequential implementation of the Deep Academic Report refactor
    - refs: —
- [ ] **DEEP_REPORT_REFACTOR_PLAN.md**  · _2026-02-10_ · → `docs/archived/pipeline-history`
    - Plan to refactor the Deep Academic Report monolith into modular architecture
    - refs: DEEP_REPORT_IMPLEMENTATION_SWARM
- [ ] **E2E_PIPELINE_OUTPUT_LATEST.md**  · _2026-03-09_ · → `docs/archived/completion-snapshots`
    - Full pipeline E2E test output dump (expert knowledge integration)
    - refs: —
- [ ] **FRONTEND_CAPABILITY_SETUP.md**  · _2026-02-20_ · → `docs/archived/misc`
    - Setup guide to maximize Claude Code frontend output quality for Uplift
    - refs: ACTIVITY_WORKSHOP_FRONTEND_HANDOFF
- [ ] **FUNCTIONAL_QUALITY_AUDIT_REPORT.md**  · _2026-03-15_ · → `docs/archived/misc`
    - Functional quality audit report for Essay Intelligence (chats 1,2,3,5)
    - refs: FUNCTIONAL_QUALITY_PROMPTS
- [ ] **INSIGHT_DRIVEN_ADVISOR_E2E.md**  · _2026-02-06_ · → `docs/archived/completion-snapshots`
    - E2E user-experience demo output for the insight-driven academic advisor
    - refs: —
- [ ] **NATURAL_ADVISOR_E2E.md**  · _2026-02-06_ · → `docs/archived/training-data`
    - Feb 2026 E2E demo dump of the natural academic advisor with deep knowledge integration
    - refs: —
- [ ] **OUTPUT_QUALITY_AUDIT.md**  · _2026-02-10_ · → `docs/archived/deep-research`
    - Feb 2026 output-quality audit of the Deep Academic Report service
    - refs: DEEP_REPORT_IMPLEMENTATION_SWARM, DEEP_REPORT_AUDIT_PLAN
- [ ] **Prose Quality &amp; Voice at the Sentence Level.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Raw Jan 2025 Perplexity deep-research dump on sentence-level prose/voice (source for PROSE_QUALITY_COMPLETE_EXTRACTION).
    - refs: src/services/commonAppWorkshop/data/proseQualitySources.ts (topical comment only, not a path ref)
- [ ] **QUALITY_ITERATION_SWARM.md**  · _2026-02-10_ · → `docs/archived/workshop-history`
    - Swarm execution prompt to improve Deep Academic Report + Activity Workshop output quality.
    - refs: —
- [ ] **REPORT_ADVISOR_INTEGRATION_E2E.md**  · _2026-02-12_ · → `docs/archived/completion-snapshots`
    - E2E demonstration of deep academic report feeding the conversational advisor.
    - refs: —

## B. Audit / findings reports (archive if audit is closed)  — 6 docs

- [ ] **ACTIVITY_WORKSHOP_AUDIT_PLAN.md**  · _2026-02-10_ · → `docs/archived/misc`
    - v4.3 comprehensive audit and refactor plan (45+ findings, awaiting approval).
    - refs: ACTIVITY_WORKSHOP_IMPLEMENTATION_SWARM, ACTIVITY_SCORING_USER_EXPERIENCE
- [ ] **ACTIVITY_WORKSHOP_IMPLEMENTATION_SWARM.md**  · _2026-02-10_ · → `docs/archived/misc`
    - Agent-teams swarm implementation prompt for the v4.3 audit plan.
    - refs: —
- [ ] **AUDIT_CONTEXT_DATA_QUALITY.md**  · _2026-02-10_ · → `docs/archived/misc`
    - Audit of upstream data pipeline feeding deepAcademicReportService (Feb 2026).
    - refs: DEEP_REPORT_AUDIT_PLAN
- [ ] **COMPREHENSIVE_INTEGRITY_AUDIT.md**  · _2026-02-09_ · → `docs/archived/misc`
    - Full data+architecture integrity/accuracy audit of the extracurricular activity system
    - refs: —
- [ ] **DEEP_RESEARCH_CONSOLIDATION_AUDIT.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Honest assessment of deep research state (what works/broken/next)
    - refs: —
- [ ] **LAUNCH3_ITERATION_PROMPT.md**  · _2026-03-15_ · → `docs/archived/essay-intelligence`
    - One-time paste-into-chat fix list from a 4-agent audit of Launch 3 (Essay Intelligence, 5,683 lines)
    - refs: —

## C. Plans / handoffs / swarm prompts (archive if work shipped)  — 17 docs

- [ ] **ACTIVITY_WORKSHOP_FRONTEND_HANDOFF.md**  · _2026-02-21_ · → `docs/archived/misc`
    - Session handoff context for activity workshop frontend work (Feb 2026).
    - refs: —
- [ ] **CITATION_SYSTEM_CURRENT_STATE.md**  · _2026-01-08_ · → `docs/archived/citation`
    - Technical context snapshot of the citation system for a next-session optimization handoff
    - refs: —
- [ ] **CITATION_SYSTEM_OPTIMIZATION_PLAN.md**  · _2026-01-08_ · → `docs/archived/citation`
    - Plan to optimize citation system efficiency and dynamic source matching
    - refs: —
- [ ] **COMMON_APP_WORKSHOP_CONTEXT.md**  · _2025-12-22_ · → `docs/archived/workshop-history`
    - Complete context handoff for Common App Workshop development continuation
    - refs: —
- [ ] **EI_RESEARCH_COMPLETE_EXTRACTION.md**  · _2026-01-08_ · → `docs/archived/college-research`
    - Emotional Intelligence deep-research extraction + integration plan (Perplexity source)
    - refs: DEEP_RESEARCH_INTEGRATION_MASTER_PLAN, FUTURE_DEEP_INTEGRATIONS
- [ ] **FULL_HANDOFF_CONTEXT.md**  · _2026-02-10_ · → `docs/archived/workshop-history`
    - Handoff context for new agents on Activity Workshop pipeline v4.3
    - refs: —
- [ ] **INTEGRITY_ACCURACY_IMPLEMENTATION_PLAN.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Implementation blueprint for fixing integrity/accuracy issues in academic advising
    - refs: EXTRACURRICULAR_INTEGRITY_DEEP_ANALYSIS
- [ ] **LOVABLE_ACTIVITY_WORKSHOP_ROADMAP.md**  · _2026-02-12_ · → `docs/archived/workshop-history`
    - Lovable frontend roadmap for the Activity Workshop results page with data-model reference
    - refs: —
- [ ] **OBSERVATION_ELIMINATION_PLAN.md**  · _2026-03-15_ · → `docs/archived/essay-intelligence`
    - Migration plan to replace flat ObservationEntry[] arrays with the Finding system in the Essay Intelligence walk
    - refs: —
- [ ] **OVERLAY_INTEGRATION_STRATEGY.md**  · _2026-01-08_ · → `docs/archived/overlay`
    - Dec 2024 strategic plan to turn 13 college overlays into a competitive advantage
    - refs: —
- [ ] **PASS_KNOWLEDGE_BASE_CONTEXT.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Jan 2026 handoff doc for building eval engines on the PASS modular research knowledge base
    - refs: —
- [ ] **PASS_SYSTEM_BUILD_GUIDE.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Jan 2026 build guide for the PASS (Portfolio & Application Strategy System), Phase 1 research in progress
    - refs: —
- [ ] **PLAN_GAPS_IMPLEMENTATION_PROPOSALS.md**  · _2026-03-09_ · → `docs/archived/deep-research`
    - Mar 2026 6-agent swarm gap analysis with implementation proposals against PLAN.md (Essay Intelligence).
    - refs: —
- [ ] **SHOW_DONT_TELL_SYSTEM_ENHANCEMENT_PLAN.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - System-wide enhancement plan applying Show-Don't-Tell research across scoring/cliche/suggestions.
    - refs: DEEP_RESEARCH_INTEGRATION_MASTER_PLAN
- [ ] **SWARM_IMPLEMENTATION_PROMPTS.md**  · _2026-03-09_ · → `docs/archived/workshop-history`
    - Copy-paste 4-swarm implementation prompts for the writing-system improvement initiative.
    - refs: —
- [ ] **TECHNICAL_OPTIMIZATION_SWARM.md**  · _2026-02-10_ · → `docs/archived/workshop-history`
    - Swarm prompt for Activity Workshop technical efficiency (caching, JSON parsing, parallelism).
    - refs: —
- [ ] **TREE_ARCHITECTURE_IMPLEMENTATION_PROMPT.md**  · _2026-03-15_ · → `docs/archived/deep-research`
    - Mar 2026 implementation prompt for Essay Intelligence V2 tree-based progressive deepening architecture
    - refs: —

## D. Design / architecture / UX (KEEP if it describes shipped system)  — 17 docs

- [ ] **ACADEMIC_ANALYSIS_SYSTEM_ARCHITECTURE.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Architecture doc for the academic history analysis system (heuristic + LLM teaching).
    - refs: —
- [ ] **ACTIVITY_SCORING_HUMAN_UX_FLOW.md**  · _2026-01-28_ · → `docs/archived/misc`
    - End-to-end human UX flow map for the activity scoring system.
    - refs: —
- [ ] **ACTIVITY_WORKSHOP_CONVERSATION_UX.md**  · _2026-02-09_ · → `docs/archived/misc`
    - Student-perspective UX of chat-based activity profile building.
    - refs: —
- [ ] **CAPABILITY_SYSTEM_ANALYSIS.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Analysis of capability conversation system AO-perception vs internal-understanding separation.
    - refs: —
- [ ] **CITATION_SYSTEM_ARCHITECTURE_V2.md**  · _2026-01-08_ · → `docs/archived/misc`
    - Architecture design for citation system V2 addressing source-attribution gaps (Jan 2026).
    - refs: FUTURE_DEEP_INTEGRATIONS
- [ ] **COLLEGE_OVERLAY_TARGETED_ENHANCEMENT_DESIGN.md**  · _2026-01-08_ · → `docs/archived/overlay`
    - Design doc for surgical college-specific overlay enhancements (Phase 1 complete, Phase 2 in progress)
    - refs: HANDOFF_COLLEGE_OVERLAY_PHASE_2
- [ ] **COMPLETE_INTERCONNECTED_SYSTEM_MAP.md**  · _2026-01-08_ · → `docs/archived/pipeline-history`
    - Documentation of activity pipeline stage interconnection and quality-compounding points
    - refs: —
- [ ] **DESCRIPTION_TAB_REDESIGN.md**  · _2026-02-24_ · → `docs/archived/workshop-history`
    - Design/implementation brief for unifying the Activity Workshop Description tab UI
    - refs: —
- [ ] **EDIT_UNDERSTANDING_SYSTEM_DESIGN.md**  · _2026-03-09_ · → `docs/archived/misc`
    - Conceptual design (v2) for edit understanding & change mapping in Essay Intelligence
    - refs: PLAN_GAPS_IMPLEMENTATION_PROPOSALS
- [ ] **ESSAY_INTELLIGENCE_DATABASE_ARCHITECTURE.md**  · _2026-03-09_ · → `docs/archived/misc`
    - Conceptual DB architecture for Essay Intelligence (modular schema replacing essay_understanding)
    - refs: PLAN_GAPS_IMPLEMENTATION_PROPOSALS
- [ ] **INTEGRITY_SYSTEM_DESIGN.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Research foundation + design for integrity/accuracy of advising (verified vs estimated data)
    - refs: —
- [ ] **LLM_FIRST_CONVERSATION_REDESIGN.md**  · _2026-02-06_ · → `docs/archived/phases`
    - Redesign of Capability Conversation System to be LLM-first (templates as emergency fallback only), implemented Jan 31 2026
    - refs: —
- [ ] **MULTI_LAYERED_SUGGESTION_ARCHITECTURE.md**  · _2026-01-08_ · → `docs/archived/phases`
    - Dec 2025 vision doc for layered suggestion-quality architecture where each stage builds on the prior
    - refs: —
- [ ] **PORTFOLIO_STRATEGY_SYSTEM_DESIGN.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Jan 2026 v1.0 design doc for the Holistic Portfolio Analysis & Strategy System (HPASS).
    - refs: —
- [ ] **RESEARCH_BACKED_GUIDANCE_SYSTEM.md**  · _2026-02-06_ · → `docs/archived/completion-snapshots`
    - Describes integration of research knowledge bases into the Capability Conversation System (implemented Jan 2026).
    - refs: —
- [ ] **SEMANTIC_IDENTITY_DESIGN.md**  · _2026-03-15_ · → `docs/archived/deep-research`
    - Track B design doc for Semantic Identity Architecture within the Essay Intelligence system.
    - refs: —
- [ ] **SYNERGISTIC_CONTEXT_ARCHITECTURE.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Dec 2025 design principle doc on layered synergistic context architecture.
    - refs: —

## E. Research / data (keep if still feeding the system)  — 12 docs

- [ ] **ADMISSIONS_OFFICER_RESEARCH.md**  · _2025-11-24_ · → `docs/archived/misc`
    - Research into what top-school AOs grade in PIQs (pre-EI era, Nov 2025).
    - refs: UNIFIED_PIQ_IMPLEMENTATION_COMPLETE, PIQ_DIMENSION_VALIDATION
- [ ] **ADMISSIONS_REALITY_CALIBRATION_DATABASE.md**  · _2025-11-24_ · → `docs/archived/misc`
    - Research-backed admissions statistics database for portfolio scanner calibration (Nov 2025).
    - refs: RESEARCH_SUMMARY_ACCURACY_CALIBRATION, README_PORTFOLIO_SCANNER_DOCS
- [ ] **COLLECTED_TRAINING_DATA_ESSAYS.md**  · _2025-11-24_ · → `docs/archived/training-data`
    - Collected UC PIQ training-data essays from verified admits
    - refs: TRAINING_DATA_COLLECTION_SUMMARY
- [ ] **DATA_DRIVEN_PROMPT_CALIBRATION.md**  · _2025-11-24_ · → `docs/archived/college-research`
    - Guide to calibrate system prompts with real admissions data
    - refs: README_PORTFOLIO_SCANNER_DOCS, RESEARCH_SUMMARY_ACCURACY_CALIBRATION
- [ ] **DEEP_RESEARCH_AGENDA.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Research agenda enumerating citation/scoring/college knowledge gaps
    - refs: —
- [ ] **EI_SUPPLEMENTAL_EXTRACTION.md**  · _2026-01-08_ · → `docs/archived/college-research`
    - Supplemental Emotional Intelligence research extraction (new sources)
    - refs: —
- [ ] **FUTURE_DEEP_INTEGRATIONS.md**  · _2026-01-08_ · → `docs/archived/college-research`
    - Tracker of future deep integrations to leverage deep-research knowledge
    - refs: DEEP_RESEARCH_INTEGRATION_MASTER_PLAN
- [ ] **INTELLECTUAL_DEPTH_COMPLETE_EXTRACTION.md**  · _2026-01-08_ · → `docs/archived/college-research`
    - Deep-research extraction on intellectual depth/nuanced thinking sources (Perplexity prompt #3)
    - refs: —
- [ ] **PERPLEXITY_PROMPTS_PRIORITY_2.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Perplexity deep-research prompt set (Priority 2: Writing Craft Mastery) for knowledge gathering
    - refs: FUTURE_DEEP_INTEGRATIONS, DEEP_RESEARCH_SOURCE_INTEGRATION_GUIDE
- [ ] **PROMPT_MICRO_OPTIMIZATIONS_RESEARCH.md**  · _2026-03-15_ · → `docs/archived/deep-research`
    - Mar 2026 research deliverable: prompt-level micro-optimizations grounded in current EI codebase files.
    - refs: —
- [ ] **PROSE_QUALITY_COMPLETE_EXTRACTION.md**  · _2026-01-08_ · → `docs/archived/deep-research`
    - Jan 2025 Perplexity deep-research extraction of prose-quality/voice insights; content since baked into commonAppWorkshop source data.
    - refs: —
- [ ] **UC_ADMISSIONS_CALIBRATION.md**  · _2025-11-24_ · → `docs/archived/college-research`
    - Nov 2025 calibration notes on what UC comprehensive review values (14 factors)
    - refs: —

## F. Other  — 13 docs

- [ ] **ACTIVITY_SCORING_FRONTEND_NOTES.md**  · _2026-01-28_ · → `docs/archived/misc`
    - Frontend UI/UX implementation notes for the activity scoring system.
    - refs: —
- [ ] **CAPABILITY_CONVERSATION_DEEP_ANALYSIS.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Performance review / improvement roadmap for conversational capability profiling (Jan 2026).
    - refs: —
- [ ] **EXTRACURRICULAR-ANALYSIS-EXPLAINER.md**  · _2025-11-24_ · → `docs/archived/workshop-history`
    - Plain-English explainer of the extracurricular activity analysis system (11-category rubric)
    - refs: —
- [ ] **EXTRACURRICULAR_INTEGRITY_DEEP_ANALYSIS.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Maps where integrity issues manifest in the activity workshop pipeline
    - refs: INTEGRITY_ACCURACY_IMPLEMENTATION_PLAN
- [ ] **FUNCTIONAL_QUALITY_PROMPTS.md**  · _2026-03-15_ · → `docs/archived/misc`
    - 6 self-contained deep-dive prompts for Essay Intelligence functional-quality investigations
    - refs: FUNCTIONAL_QUALITY_AUDIT_REPORT
- [ ] **INTEGRITY_QUICK_REFERENCE.md**  · _2026-02-06_ · → `docs/archived/misc`
    - Quick reference for integrity system context-adjustment values (Harvard scale)
    - refs: —
- [ ] **ITERATION_LOG.md**  · _2026-01-08_ · → `docs/archived/pipeline-history`
    - Iteration log tracking improvements to the college tailoring system with before/after metrics
    - refs: —
- [ ] **OPUS_REWRITE_PROMPTS.md**  · _2026-03-15_ · → `docs/archived/essay-intelligence`
    - 3 self-contained paste-into-chat Opus prompts for rewriting Essay Intelligence prompting/context/data-flow
    - refs: —
- [ ] **OVERLAY_INTEGRATION_COMPLETE.md**  · _2026-01-08_ · → `docs/archived/overlay`
    - Dec 30 2025 completion report for college overlay integration into typeSpecificSuggestionService
    - refs: —
- [ ] **OVERLAY_WORKFLOW_COMPLETE.md**  · _2026-01-08_ · → `docs/archived/overlay`
    - Dec 30 2025 doc of complete essay→college-tailored-suggestion overlay workflow/logic
    - refs: —
- [ ] **ROUND_7B_PROMPT.md**  · _2026-04-16_ · → `docs/archived/phases`
    - Session-launch prompt for Round 7b analytical-layer deepening of the Essay Intelligence pipeline.
    - refs: —
- [ ] **UX_PHASE_PROMPTS.md**  · _2026-03-15_ · → `docs/archived/deep-research`
    - Mar 2026 multi-phase chat prompt playbook for UX deep-dive deliverables
    - refs: —
- [ ] **supplementals.md**  · _2025-12-15_ · → `docs/archived/college-research`
    - 2025-2026 supplemental essay requirements database for top 30 US universities
    - refs: archived/plans/BROWN_OVERLAY_DRAFT, archived/summaries/IMPLEMENTATION_GUIDE

## ⚠ Rewire-needed — 2 docs

- [ ] **ESSAY_NORTH_STAR_DESIGN.md** — Empty/deleted file (staged for deletion) — formerly Essay Intelligence north-star design doc
    - fix: File is empty and staged for deletion (git status: D) yet 10+ live pipeline-evolution docs + memory/sprint-status.md still reference docs/ESSAY_NORTH_STAR_DESIGN.md. Confirm whether content was migrated (likely into pipeline-evolution/04-pipeline-architecture/MASTER_INTEGRATION_PLAN.md) and repoint those references, or restore the file.
- [ ] **RE_ANALYSIS_LIFECYCLE_DESIGN.md** — Re-analysis lifecycle design (incremental update / focused-mode pipeline) for Essay Intelligence.
    - fix: File is deleted on this branch (git status shows 'D') but is still referenced by multiple live pipeline-evolution docs, an audit doc, and memory/sprint-status.md. Either restore the doc or update those references to its successor in pipeline-evolution/04-pipeline-architecture.

---

## Note on the 2 rewire-needed items (in-flight migration — not auto-fixed)

`ESSAY_NORTH_STAR_DESIGN.md` and `RE_ANALYSIS_LIFECYCLE_DESIGN.md` were **deleted at
the top level** and their content **relocated into `pipeline-evolution/`** (still
untracked — part of your active pipeline-evolution reorganization):

- `docs/ESSAY_NORTH_STAR_DESIGN.md` → `docs/pipeline-evolution/04-pipeline-architecture/L4/ESSAY_NORTH_STAR_DESIGN.md` (150 lines)
- `docs/RE_ANALYSIS_LIFECYCLE_DESIGN.md` → `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` (1145 lines)

But **10+ docs + `memory/sprint-status.md` still link to the old top-level paths.**
Left untouched because this is mid-migration in-flight work. When you finalize the
pipeline-evolution reorg, decide: commit the relocated copies + repoint these
references to the new paths (recommended), or restore the originals.
