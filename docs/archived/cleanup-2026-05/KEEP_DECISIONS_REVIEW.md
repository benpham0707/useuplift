# Keep-Decision Review — codebase-cleanup branch

Generated for pre-push review. 53 docs kept at top-level.

- **A. Code-verified keeps:** 9 (swarm read src/ to confirm shipped/active)
- **B. Swarm live-keep:** 35 (referenced by code/memory/CLAUDE.md, or current design)
- **C. Uncertain (review):** 7
- **D. Session infra:** 2

---

## A. Code-verified keeps (src/ evidence)

**ACADEMIC_ANALYSIS_SYSTEM_ARCHITECTURE.md** · confidence=high
> trajectoryAnalyzer.ts is live at src/services/portfolioStrategy/services/trajectoryAnalyzer.ts; trajectory type names from the doc (strong_ascending, junior_dip, senior_decline, v_shape_recovery) appear in that file. Consumed by src/services/portfolioStrategy/services/academicRedFlagDetector.ts and exported from services/index.ts. Shipped academic analysis system.

**ACTIVITY_SCORING_FRONTEND_NOTES.md** · confidence=medium
> API contract is live: comparativeContextService.ts exists at src/services/portfolioStrategy/services/activityWorkshop/ and deepAcademicReport/generators/researchGenerator.ts references comparativeContext; scoring frontend exists at src/components/activity-scoring/ (ActivityScoreDashboard.tsx, MetricsPanel.tsx, OverviewPanel.tsx). Documents the shipped backend->frontend visualization contract.

**ACTIVITY_SCORING_HUMAN_UX_FLOW.md** · confidence=medium
> Describes the live activity scoring journey: stage pipeline exists at src/services/portfolioStrategy/services/activityWorkshop/stages/ (stage0-stage3) with scoring/descriptionScoringService.ts, and the frontend dashboard at src/components/activity-scoring/ActivityScoreDashboard.tsx. The iterative score->learn->edit->rescore loop matches the shipped system.

**ACTIVITY_WORKSHOP_CONVERSATION_UX.md** · confidence=high
> Fully shipped. src/services/portfolioStrategy/services/activityWorkshop/chat/types.ts defines ConversationTrigger with the exact doc triggers (system_detected_gap, high_potential_activity, time_investment_mismatch, spike_candidate, user_initiated, description_improvement, scoring_opportunity) plus OPENING_TEMPLATES, and ConversationPhase with the 8-phase model (opening, fact_gathering, story_exploration, meaning_reflection, impact_assessment, connection_mapping, synthesis, complete) plus PHASE_TRANSITION_TEMPLATES. chat/ dir has full impl (conversationManager.ts, activityProfileChatService.ts, questionGenerator.ts).

**COLLEGE_OVERLAY_TARGETED_ENHANCEMENT_DESIGN.md** · confidence=high
> src/services/commonAppWorkshop/services/collegeOverlayEnhancer.ts lines 77-78 explicitly state 'This is the implementation of the targeted enhancement approach from COLLEGE_OVERLAY_TARGETED_ENHANCEMENT_DESIGN.md', and implements the doc's Stage 2A->2B preserve-and-surgically-enhance design (PRESERVES core suggestion, ADDS college-specific targeting, change tracking). Doc references collegeOverlayEnhancer 5x. Live shipped design.

**LLM_FIRST_CONVERSATION_REDESIGN.md** · confidence=high
> Shipped in the academic conversational engine. buildDisclosureContext(memory: ConversationMemory) is defined at src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/dynamicResponseGenerator.ts:1309, with the unacknowledged-high/medium-significance disclosure logic the doc describes (62 matching references in that file). ConversationMemory type is used there. Matches the LLM-first rich-disclosure-context design.

**RESEARCH_BACKED_GUIDANCE_SYSTEM.md** · confidence=high
> Doc (self-dated 'Implemented: January 31, 2026') describes a ResearchBackedGuidanceLayer wiring academicDatabase/contextAdjustmentDatabase/schoolValueDatabase into the Capability Conversation System. CONFIRMED LIVE via grep: src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/researchBackedGuidanceLayer.ts exists and is exported from that dir's index.ts; capabilityConversationEngine.ts lives in the same dir; consumed knowledge bases exist at src/services/portfolioStrategy/knowledge/schoolValueDatabase.ts and contextAdjustmentDatabase.ts (also referenced by unifiedResearchAssemblyService.ts). Doc accurately documents shipped code.

**SHOW_DONT_TELL_SYSTEM_ENHANCEMENT_PLAN.md** · confidence=high
> Named a 'plan' but the capability it specifies is shipped across multiple subsystems. Scoring: src/workshop/scoring/narrativeAnalyzers.ts:676 exports analyzeShowVsTell(); ShowVsTellAnalysis type at narrativeAnalyzerTypes.ts:128 wired into narrativeAnalysis (:329) and scoring/index.ts (:20,48). Commands/signals: 'show_dont_tell' active in src/workshop/essay-profiles/{personal-statement,identity-background,community}.profile.ts and narrative-craft.signal.ts. Cliche/suggestion services from the plan exist live: src/services/commonAppWorkshop/services/semanticClicheAnalyzer.ts and typeSpecificSuggestionService.ts. Citation library shipped at src/services/commonAppWorkshop/data/showDontTellSources.ts. Documents shipped behavior.

**UC_ADMISSIONS_CALIBRATION.md** · confidence=high
> UC comprehensive-review / PIQ calibration doc whose subject is demonstrably live. src/workshop/essay-profiles/uc-piq.profile.ts is the 'UC Personal Insight Question' profile and contains dimensionWeightOverrides (line 20). src/services/essayIntelligence/rubrics/piqRubric.ts is the 'Port A3 — PIQ 13-Dimension Rubric at L3.5 + L4', deriving PRIMARY_DIMENSIONS_BY_PIQ from PIQ_WEIGHT_PROFILES and importing PIQ_RUBRIC_DIMENSIONS from src/services/piq/rubric. Dimensions narrative-structure.dim.ts:117 and narrative-dynamics.dim.ts:130 explicitly handle 'UC Personal Insight Question (250-350 words)'. Doc is the calibration knowledge behind the shipped UC PIQ scoring profile/rubric. (filename itself not imported by src — it is the knowledge source, not a module.) Confidence high that the system is live; not every numeric weight/tier in the doc was line-matched to the rubric.


## B. Swarm live-keep

**ACADEMIC_HISTORY_INTEGRITY_DESIGN.md**
- Implementation-ready design doc for academic history integrity/accuracy fixes.
- why kept: memory/MEMORY.md

**ACTIVITY_WORKSHOP_PIPELINE_CONTEXT.md**
- v4.3 comprehensive context doc for continuing activity workshop development.
- why kept: memory/MEMORY.md, memory/activity-workshop.md, docs/ACTIVITY_WORKSHOP_IMPLEMENTATION_SWARM.md

**ANNOTATION_PIPELINE_DECISIONS.md**
- Unified, authoritative decision record resolving conflicts across 4 annotation-pipeline research rounds.
- why kept: current design / no external ref

**ANNOTATION_PIPELINE_DEEP_RESEARCH_R1.md**
- Round 1 research synthesis (gap analysis) for the annotation pipeline V2.
- why kept: memory/MEMORY.md, docs/ANNOTATION_PIPELINE_DEEP_RESEARCH_R3.md

**ANNOTATION_PIPELINE_DEEP_RESEARCH_R3.md**
- Round 3 research synthesis (code verification + algorithms) for annotation pipeline V2.
- why kept: memory/MEMORY.md, docs/ANNOTATION_PIPELINE_DEEP_RESEARCH_R4.md

**ANNOTATION_PIPELINE_DEEP_RESEARCH_R4.md**
- Round 4 innovation synthesis (essay DNA, portfolio intelligence, moat) for annotation pipeline V2.
- why kept: memory/MEMORY.md

**ANNOTATION_PIPELINE_MIGRATION_PLAN.md**
- Migration plan for annotation pipeline V2 (Feb 2026, ready for implementation review).
- why kept: current design / no external ref

**ANNOTATION_PIPELINE_REGISTRY_DESIGNS.md**
- Full registry manifests (strategies, patterns, signals) for annotation pipeline V2.
- why kept: memory/MEMORY.md, docs/ANNOTATION_PIPELINE_DEEP_RESEARCH_R4.md

**AUDIT_RUBRIC_TIER_FINDINGS.md**
- Accuracy audit of tier benchmarks / Uplift Scale; cited by tierCalibration source code.
- why kept: src/services/portfolioStrategy/services/academicWorkshop/capability/deepAcademicReport/context/tierCalibration.ts, docs/DEEP_REPORT_IMPLEMENTATION_SWARM.md, docs/DEEP_REPORT_AUDIT_PLAN.md

**COGNITIVE_ARCHITECTURE_RESEARCH.md**
- Research synthesis on cognitive architecture of deep reading, grounded against the Essay Intelligence L1-L6 pipeline
- why kept: current design / no external ref

**DEEP_REPORT_CONTEXT_HANDOFF.md**
- Full context handoff for continuing Deep Academic Report development
- why kept: docs/DEEP_REPORT_REFACTOR_PLAN.md, docs/DEEP_REPORT_IMPLEMENTATION_SWARM.md, memory/MEMORY.md, memory/deep-report.md

**DEEP_RESEARCH_INTEGRATION_MASTER_PLAN.md**
- Master tracking plan for integrating Perplexity deep research batches into the citation system
- why kept: src/services/commonAppWorkshop/data/_sourceFileTemplate.md, docs/DEEP_RESEARCH_SOURCE_INTEGRATION_GUIDE.md

**DEEP_RESEARCH_SOURCE_INTEGRATION_GUIDE.md**
- Step-by-step process guide for integrating new deep research source batches into the citation system
- why kept: src/services/commonAppWorkshop/data/proseQualitySources.ts

**DESIGN_TYPE_SYSTEM_PROFILE_MANAGER_VOICE_EMOTION.md**
- Conceptual type architecture, voice/emotion tracking, and profile manager design for Essay Intelligence
- why kept: docs/PLAN_GAPS_IMPLEMENTATION_PROPOSALS.md

**FRONTEND_STANDARDS.md**
- Canonical Uplift frontend design standards (auto-referenced in frontend sessions)
- why kept: docs/ACTIVITY_WORKSHOP_FRONTEND_HANDOFF.md, docs/FRONTEND_CAPABILITY_SETUP.md

**FULL_TECHNICAL.md**
- Uplift complete technical architecture reference for technical leadership (current)
- why kept: current design / no external ref

**GIT_WORKFLOW.md**
- Canonical git workflow & branching strategy (referenced from CLAUDE.md)
- why kept: CLAUDE.md, docs/analysis/COST_CUT_IMPLEMENTATION_PROMPT.md

**HOW_UPLIFT_WORKS.md**
- Plain-language guide to how the Uplift system works (current canonical overview)
- why kept: current design / no external ref

**INLINE_ANNOTATION_UX_PLAN.md**
- Comprehensive UX implementation plan for inline annotation editor (depends on L1-L5 Essay Intelligence)
- why kept: src/components/annotation-v2-engine/workshop.css, src/components/annotation-v2-engine/tokens.ts, docs/ux_phases/phase_10_navigation.md, docs/ux_phases/phase_11_list_map.md, docs/ux_phases/phase_7_click_panel_open.md, docs/ux_phases/phase_4_loading_state.md, docs/ux_phases/phase_8_reading_insight.md, docs/ux_phases/phase_9_rewrite_suggestion.md, docs/ux_phases/phase_5_first_reveal.md, docs/ux_phases/phase_6_orientation.md

**LUNA_MASCOT_PROMPT_SHEET.md**
- Nano Banana 2 prompt sheet for generating consistent Luna cloud-mascot emotion variants
- why kept: memory/premium-website-pipeline.md, memory/MEMORY.md (Luna mascot concept, not filename)

**PHASE_3_LLM_ANALYZER_ARCHITECTURE.md**
- Defines the gold-standard v4 LLM analyzer architecture (tiers) for PIQ dimensions.
- why kept: src/services/unified/features/contextCircumstancesAnalyzer_llm.ts, src/services/unified/features/communityImpactAnalyzer_llm.ts, src/services/unified/features/fitTrajectoryAnalyzer_llm.ts, src/services/unified/features/roleClarityAnalyzer_llm.ts, src/services/unified/features/intellectualVitalityAnalyzer_llm.ts, src/services/unified/features/personalGrowthAnalyzer_llm.ts, docs/README_PORTFOLIO_SCANNER_DOCS.md

**PIPELINE_ARCHITECTURE_AUDIT.md**
- Architecture audit feeding the current pipeline-evolution master integration plan.
- why kept: docs/pipeline-evolution/04-pipeline-architecture/MASTER_INTEGRATION_PLAN.md, docs/pipeline-evolution/04-pipeline-architecture/MASTER_PLAN_CONSOLIDATION_HANDOFF.md, docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md, docs/pipeline-evolution/00-index/UNIFIED_PLAN_HOLD_2026_05_10.md, docs/pipeline-evolution/shared/CHANGE_LOG.md, memory/sprint-status.md

**PREMIUM_WEBSITE_MASTER_GUIDE.md**
- Master guide for the Nano Banana 2 + Kling premium scroll-driven website pipeline.
- why kept: memory/MEMORY.md, memory/premium-website-pipeline.md, docs/LUNA_MASCOT_PROMPT_SHEET.md

**PROFILE_DUMP_RECURRING_FIXES.md**
- Active tracker of recurring full-profile-dump issues (R1-R6) and their fix status.
- why kept: current design / no external ref

**PROFILE_RENDERING_AND_CACHING_STRATEGY.md**
- Current design doc for the Essay Intelligence Profile Router rendering + prompt-caching layer.
- why kept: current design / no external ref

**QUALITY_GAP1_CALIBRATION.md**
- May 2026 single-essay (Crochet) calibration deep-dive for signature-move quality gap.
- why kept: current design / no external ref

**QUALITY_GAP1_SIGNATURE_MOVE_PLAN.md**
- May 2026 v2 plan to close Gap 1 (signature-move identification) in the output-quality cycle.
- why kept: current design / no external ref

**ROUND_7_COMPREHENSIVE_AUDIT.md**
- Round 7 end-to-end audit of the Essay Intelligence system; source diagnosis for hardening + Round 8.
- why kept: docs/ROUND_7_OPEN_ITEMS.md, docs/pipeline-evolution/00-index/COST_QUALITY_AUDIT_2026_05_22.md, docs/ROUND_7_HARDENING_PLAN.md, docs/ROUND_8_DESIGN_CONTRACT.md, memory/sprint-status.md

**ROUND_7_HARDENING_PLAN.md**
- Execution plan for Round 7 hardening (P0/P1) of the Essay Intelligence pipeline.
- why kept: docs/SIGNAL_REGISTRATION_PROTOCOL.md, docs/ROUND_8_DESIGN_CONTRACT.md, docs/ROUND_7_COMPREHENSIVE_AUDIT.md

**ROUND_8_DESIGN_CONTRACT.md**
- Binding design contract for Round 8 personalized revision planning (current roadmap).
- why kept: docs/ROUND_7_HARDENING_PLAN.md, docs/ROUND_7_COMPREHENSIVE_AUDIT.md, docs/SIGNAL_REGISTRATION_PROTOCOL.md

**SIGNAL_REGISTRATION_PROTOCOL.md**
- Binding protocol (Round 8 forward) to prevent inventory-not-capability drift in the pipeline.
- why kept: docs/ROUND_8_DESIGN_CONTRACT.md, docs/ROUND_7_HARDENING_PLAN.md

**SWARM_GUIDE.md**
- Agent-teams/swarm decision framework and rules; cited from CLAUDE.md.
- why kept: docs/activity-workshop-wrap-up/parallel-tracks/00-INDEX.md, docs/activity-workshop-wrap-up/parallel-tracks/prompts/README.md, CLAUDE.md

**TECHNICAL_ARCHITECTURE.md**
- Current service-layer reference for Essay Intelligence V2 + Writing Workshop (co-founder onboarding).
- why kept: current design / no external ref

**VERSION_BASED_REANALYSIS_AND_EDIT_WORKSHOP_DESIGN.md**
- Mar 2026 conceptual design for dual-pathway version-based re-analysis + conversational edit workshop
- why kept: docs/PLAN_GAPS_IMPLEMENTATION_PROPOSALS.md

**WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md**
- Mar 2026 master synthesis of 8-agent writing-system deep research swarm
- why kept: MEMORY.md, docs/writing-system-research.md (memory), docs/pipeline-evolution/03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md, docs/pipeline-evolution/04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md, docs/pipeline-evolution/04-pipeline-architecture/L5/COACHING_MODE_DESIGN.md, docs/pipeline-evolution/02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md, docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/CALIBRATION_FEWSHOT_DESIGN.md, docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md


## C. ⚠ Uncertain keeps — confirm these

- [ ] **COMPLETE_INTERCONNECTED_SYSTEM_MAP.md** _(2026-01-08)_ — Documentation of activity pipeline stage interconnection and quality-compounding points  →  kept: could not prove dead vs code
- [ ] **ESSAY_NORTH_STAR_DESIGN.md** _(2026-03-09)_ — Empty/deleted file (staged for deletion) — formerly Essay Intelligence north-star design doc  →  review
- [ ] **OBSERVATION_ELIMINATION_PLAN.md** _(2026-03-15)_ — Migration plan to replace flat ObservationEntry[] arrays with the Finding system in the Essay Intelligence walk  →  kept: could not prove dead vs code
- [ ] **OPUS_REWRITE_PROMPTS.md** _(2026-03-15)_ — 3 self-contained paste-into-chat Opus prompts for rewriting Essay Intelligence prompting/context/data-flow  →  kept: could not prove dead vs code
- [ ] **RE_ANALYSIS_LIFECYCLE_DESIGN.md** _(2026-03-09)_ — Re-analysis lifecycle design (incremental update / focused-mode pipeline) for Essay Intelligence.  →  review
- [ ] **ROUND_7B_PROMPT.md** _(2026-04-16)_ — Session-launch prompt for Round 7b analytical-layer deepening of the Essay Intelligence pipeline.  →  kept: could not prove dead vs code
- [ ] **supplementals.md** _(2025-12-15)_ — 2025-2026 supplemental essay requirements database for top 30 US universities  →  kept: could not prove dead vs code

## D. Session infra

- README.md — session infra
- REPO_ORGANIZATION.md — session infra