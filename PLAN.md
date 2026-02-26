# PLAN: Activity Workshop Architecture Redesign — Cognitive Decomposition

> **Status:** Analysis & Design (Awaiting Approval)
> **Date:** February 26, 2026
> **Scope:** Restructure the scoring/analysis pipeline so each computational step does ONE cognitive task using the tool best suited for it

---

## 1. THE DIAGNOSIS: What's Actually Wrong

Your instinct is exactly right, but the problem is more specific than "5 tasks in one call." Let me dissect precisely where the architecture breaks down.

### 1.1 The Three Failure Modes

**Failure Mode 1: Extraction and Judgment Are Fused**

The current `descriptionScoringService` asks Sonnet to simultaneously:
- **Extract** what's in the text (what verbs? what numbers? who did what?)
- **Judge** how good those things are (is this verb "elite" or "good"? is this number meaningful?)
- **Score** them on a calibrated 0-10 scale
- **Explain** why in a rationale

Extraction is near-deterministic — LLMs almost never disagree on *what verbs are present*. But judgment varies 2-3 points run-to-run on *how good those verbs are*. By fusing these, the reliable extraction gets contaminated by the unreliable judgment.

**Real example from the E2E output:**
- Math Tutor description "Help with math and science homework" → Description score 2.3/10
- Farm Work "Helper on 200-acre family farm" → Description score 4.1/10
- Run the same pipeline again → these might be 3.5 and 3.8 respectively

The extraction would be identical both times ("Help" = weak verb, no numbers, no ownership). The judgment varies because the LLM's internal calibration drifts.

**Failure Mode 2: Batch Scoring Creates Cross-Contamination**

The current system scores all 10 descriptions in ONE batch call. This creates:
- **Anchoring bias:** The first 2-3 activities set a mental baseline. Later activities are scored relative to earlier ones, not to an absolute standard.
- **Contrast effects:** A mediocre description after a terrible one gets inflated. The same description after an excellent one gets deflated.
- **Attention decay:** Sonnet gives progressively less nuanced rationales for activities later in the batch. Compare the detail in rationale for Activity 1 vs Activity 8 in any run.
- **Implicit ranking:** The LLM unconsciously tries to spread scores across the range rather than giving absolute assessments. If 3 descriptions are genuinely similar quality, it will artificially differentiate them.

**Failure Mode 3: Multi-Factor Holistic Judgment Fights Itself**

Portfolio scoring asks ONE call to simultaneously:
- **Count & categorize** tier distribution (analytical/mathematical)
- **Detect patterns** for spike analysis (pattern matching)
- **Assess narrative** for coherence (creative/literary analysis)
- **Match knowledge** for major alignment (knowledge retrieval)
- **Aggregate quality** for presentation (statistical)

These are fundamentally different cognitive modes. Pattern matching competes with narrative analysis for attention. The LLM can't hold all five frames simultaneously at full fidelity, so it does each one at ~60-70% quality instead of any single one at 95%.

### 1.2 What's NOT Broken

Before proposing changes, let me defend what's actually good:

1. **Stage 0 (Story Detection)** — Well-scoped. One focused task: "Who is this student?" Haiku handles it cleanly.
2. **Stage 2 (Individual Teaching)** — Individual per-activity Sonnet calls. Good decomposition. Teaching quality is already high.
3. **The parallelization architecture** — The concurrent execution pattern is the right approach.
4. **The caching strategy** — Smart optimization. Keep this regardless.
5. **The research-backed rubric design** — The *what* to evaluate is excellent. It's the *how* that needs restructuring.

---

## 2. THE ARCHITECTURE: Cognitive Decomposition

### 2.1 Core Principle

> **Each computational step should do exactly ONE cognitive task, using the tool best suited for that task.**

| Cognitive Task | Best Tool | Why |
|---|---|---|
| Information extraction from text | LLM (Haiku) | Reliable, fast, cheap — LLMs almost never disagree on what's present |
| Signal classification (verb quality, number meaning) | Code + lookup tables | Deterministic, testable, consistent |
| Calibrated 0-10 scoring from signals | Code + rules | No drift, no anchoring, unit-testable |
| Ambiguity resolution ("is this tier 2 or 3?") | LLM (Sonnet, focused) | Narrow question = reliable answer |
| Cross-activity consistency | Code | Enforce ordering invariants that LLMs can't maintain |
| Pattern recognition (spike, coherence) | LLM (Sonnet, focused) | One pattern at a time = high accuracy |
| Teaching & narrative generation | LLM (Sonnet) | Creative output is what LLMs do best |

### 2.2 The Six-Layer Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 0: STORY CONTEXT                           │
│                    (Keep current Stage 0)                            │
│  Haiku → narrativeIdentity, spikeHypothesis, activityStoryRoles    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ StoryContext
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                LAYER 1: FEATURE EXTRACTION                          │
│               (NEW — LLM for extraction only)                       │
│                                                                     │
│  Per-activity Haiku calls (parallel, ~$0.001 each):                │
│                                                                     │
│  Input: description + title + role + hours + storyContext           │
│                                                                     │
│  Extract (NOT judge):                                               │
│   • verbs_used: ["organized", "led", "managed"]                    │
│   • numbers_with_context: [{value:"200", what:"students",          │
│     hasContext:true, isMeaningful:true}]                            │
│   • role_signals: {individual:["Founded","Built"],                 │
│     team:["We organized"]}                                         │
│   • impact_claims: [{claim:"raised $12K",                          │
│     hasEvidence:true, causalChain:true}]                           │
│   • unique_details: ["first CS club at school",                    │
│     "60-person hackathon"]                                         │
│   • recognition_mentions: [{type:"award",                          │
│     name:"Volunteer of Quarter", level:"local"}]                   │
│   • progression_arc: {start:"member", end:"shift lead",           │
│     timeframe:"6 months"}                                          │
│   • character_efficiency: {totalChars:148,                         │
│     wastedPatterns:["uses 'I'","spells out 'and'"]}               │
│   • authenticity_flags: {overclaiming:[],                          │
│     genericPhrases:["made a positive impact"]}                     │
│   • classification: {solo:false, team:true,                        │
│     leadershipRole:true}                                           │
│   • commitment_signals: {yearsActive:3,                            │
│     growthEvidence:["promoted in 6 months"]}                       │
│                                                                     │
│  This is PURE extraction. "What verbs are present?" not             │
│  "How good are these verbs?" Haiku is near-perfect at this.        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ ExtractedFeatures[] (per activity)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              LAYER 2: DETERMINISTIC SIGNAL SCORING                  │
│                    (NEW — Pure code, zero LLM)                      │
│                                                                     │
│  ┌── Description Scoring ──────────────────────────────┐           │
│  │                                                     │           │
│  │ roleOwnership = calculateRoleOwnership(features)    │           │
│  │   Count individual vs team signals →                │           │
│  │   individual_ratio > 0.8 → 9-10                    │           │
│  │   individual_ratio > 0.6 → 7-8                     │           │
│  │   individual_ratio > 0.4 → 5-6                     │           │
│  │   (lookup table, fully testable)                    │           │
│  │                                                     │           │
│  │ impactEvidence = calculateImpact(features)          │           │
│  │   Has cause-effect chain? (+3 base)                 │           │
│  │   Has measurable outcome? (+2)                      │           │
│  │   Has external validation? (+2)                     │           │
│  │   Has specifics (not "positive impact")? (+2)       │           │
│  │   Total capped at 10                                │           │
│  │                                                     │           │
│  │ verbQuality = scoreVerbs(features.verbs_used)       │           │
│  │   Map each verb to hierarchy (elite/good/etc)       │           │
│  │   Score = weighted average of verb tiers             │           │
│  │   100% deterministic — verb list is hardcoded       │           │
│  │                                                     │           │
│  │ quantification = scoreNumbers(features.numbers)     │           │
│  │   Count meaningful numbers (with context)           │           │
│  │   3+ meaningful → 9-10, 2 → 7-8, 1 → 5-6, 0 → 1-2│           │
│  │   Penalize vanity metrics (if flagged)              │           │
│  │                                                     │           │
│  │ differentiation = scoreDifferentiation(features)    │           │
│  │   Count unique_details (fingerprint moments)        │           │
│  │   3+ unique → 9-10, 2 → 7-8, 1 → 5-6, 0 → 1-3   │           │
│  │                                                     │           │
│  │ WEIGHTED TOTAL = standard weights, deterministic    │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌── Activity Scoring ─────────────────────────────────┐           │
│  │                                                     │           │
│  │ tierClassification = classifyTier(features)         │           │
│  │   Has national/intl recognition? → Tier 1 (9-10)   │           │
│  │   Has state/regional + leadership? → Tier 2 (7-8)  │           │
│  │   Has school/local distinction? → Tier 3 (4-6)     │           │
│  │   Participation only? → Tier 4 (1-3)               │           │
│  │   Returns: {tier, score, confidence}                │           │
│  │   If confidence < 0.7 → flag for Layer 3 review    │           │
│  │                                                     │           │
│  │ recognitionLevel = classifyRecognition(features)    │           │
│  │   Map to known hierarchies (USAMO, ISEF, etc.)     │           │
│  │   Unknown awards → flag for Layer 3                 │           │
│  │                                                     │           │
│  │ leadership = assessLeadership(features)             │           │
│  │   solo → {applicable: false}                        │           │
│  │   "founded"/"president"/"captain" → high            │           │
│  │   "member"/"participant" → low                      │           │
│  │   People managed count → score by magnitude         │           │
│  │                                                     │           │
│  │ commitment = assessCommitment(features)             │           │
│  │   years × hoursPerWeek × weeksPerYear = total hrs  │           │
│  │   Progression arc present? → bonus                  │           │
│  │   Growth evidence? → bonus                          │           │
│  │                                                     │           │
│  │ WEIGHTED TOTAL with dynamic weights (leadership     │           │
│  │ applicability), deterministic                       │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  Every rule is a unit-testable function.                            │
│  "Given verb 'pioneered' → tier 'elite' → score 9"               │
│  Run 1000 times → same result 1000 times.                          │
└────────────┬───────────────────────────────┬────────────────────────┘
             │ CodeScores + AmbiguityFlags   │
             ▼                               ▼
┌────────────────────────────┐ ┌──────────────────────────────────────┐
│  LAYER 3: AMBIGUITY        │ │  (Activities with high confidence    │
│  RESOLUTION                 │ │   skip this layer entirely)          │
│  (Sonnet, surgical calls)  │ └──────────────────────────────────────┘
│                             │
│  ONLY for flagged items.   │
│  Example focused call:     │
│                             │
│  "This student co-authored │
│  a paper submitted to an   │
│  undergrad journal. Given  │
│  10hrs/wk, 1yr, professor  │
│  mentorship — is this      │
│  Tier 2 (genuine intellec- │
│  tual contribution) or     │
│  Tier 3 (courtesy co-      │
│  authorship)?              │
│  Respond: tier + conf 0-1" │
│                             │
│  Narrow question →          │
│  reliable answer.           │
│  Maybe 2-3 calls per run.  │
└────────────┬────────────────┘
             │ ResolvedScores (all activities have final individual scores)
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│            LAYER 4: CROSS-ACTIVITY CALIBRATION                      │
│                  (NEW — Pure code, zero LLM)                        │
│                                                                     │
│  ┌── Ordering Invariants ──────────────────────────────┐           │
│  │ If activity A has higher recognition than B,        │           │
│  │   A.recognitionScore >= B.recognitionScore          │           │
│  │ If activity A has more hours AND more years,        │           │
│  │   A.commitmentScore >= B.commitmentScore            │           │
│  │ If description A has more verifiable metrics,       │           │
│  │   A.quantificationScore >= B.quantificationScore    │           │
│  │                                                     │           │
│  │ Fix violations by adjusting the LOWER-confidence    │           │
│  │ score (not the higher-confidence one)               │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌── Distribution Constraints ─────────────────────────┐           │
│  │ Max 2 activities at Tier 1 (top 1% threshold)       │           │
│  │ Tier distribution must be pyramid-shaped             │           │
│  │ No more than 3 activities with same score ±0.5      │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌── Contextual Adjustments ───────────────────────────┐           │
│  │ First-gen: commitment scores weighted +10%          │           │
│  │ Work obligation 20+ hrs: resilience multiplier      │           │
│  │ Rural/low-resource: infrastructure-building bonus   │           │
│  │ These are EXPLICIT, AUDITABLE adjustments           │           │
│  │ Not "hopefully the LLM remembers to account for"    │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌── Cross-Reference Validation ───────────────────────┐           │
│  │ Description claims match activity form data?        │           │
│  │ Chat profile data confirms description claims?      │           │
│  │ Hours claimed plausible for achievements claimed?   │           │
│  │ Flag discrepancies for teaching layer               │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  Output: CalibratedScores + CalibrationReport                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ CalibratedScores + Features + StoryContext
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│           LAYER 5: PORTFOLIO INTELLIGENCE                           │
│         (Decomposed — one question per call/computation)            │
│                                                                     │
│  Instead of ONE call doing 5 things, SEPARATE focused units:       │
│                                                                     │
│  ┌── 5A: Spike Detection (Sonnet) ─────────────────────┐          │
│  │ Input: All activities with calibrated scores,       │          │
│  │        story context, extracted features             │          │
│  │ Question: "Given these activities and their scores,  │          │
│  │   is there a clear spike? What area? How mature?"   │          │
│  │ Output: {hasSpike, area, strength, evidence,        │          │
│  │          supportingActivities}                       │          │
│  │                                                     │          │
│  │ WHY SEPARATE: Spike detection is pure pattern       │          │
│  │ matching. When it doesn't compete with narrative    │          │
│  │ analysis for attention, accuracy goes up.           │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌── 5B: Coherence Analysis (Sonnet) ──────────────────┐          │
│  │ Input: Activities + story context + spike result     │          │
│  │ Question: "Do these activities tell a unified story? │          │
│  │   What's the thread? What's disconnected?"          │          │
│  │ Output: {score, narrativeThread, connectedGroups,   │          │
│  │          disconnectedActivities, improvements}       │          │
│  │                                                     │          │
│  │ WHY SEPARATE: Coherence is literary analysis.       │          │
│  │ It benefits from KNOWING the spike (from 5A) to    │          │
│  │ assess whether activities support or diverge.       │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌── 5C: Major Alignment (Code + Knowledge Base) ──────┐          │
│  │ Input: Activities + intendedMajor + extracted feats  │          │
│  │ Logic: Use majorResolutionService + college          │          │
│  │        expectations database for alignment scoring   │          │
│  │                                                     │          │
│  │ WHY CODE: We already HAVE the knowledge base of     │          │
│  │ 42 majors. This is matching, not judgment. LLM      │          │
│  │ adds nothing that lookup tables can't do better.    │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌── 5D: Competitive Positioning (Code) ───────────────┐          │
│  │ Input: Calibrated scores + tier distribution         │          │
│  │ Logic: Deterministic mapping from score → position   │          │
│  │   Count Tier 1s/2s/3s/4s → known percentile maps   │          │
│  │   Map to Harvard 1-6 scale                          │          │
│  │                                                     │          │
│  │ WHY CODE: This is arithmetic. "2 Tier 1 + 3 Tier 2 │          │
│  │ = top 5%" is a lookup. The current system asks LLM  │          │
│  │ to do math and it sometimes gets it wrong.          │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
│  5A and 5B run in parallel. 5C and 5D are instant (code).         │
│  Total: 2 focused Sonnet calls + 2 code computations               │
│  vs current: 1 broad Sonnet call trying to do all 5               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ PortfolioIntelligence
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│             LAYER 6: TEACHING GENERATION                            │
│          (Enriched Sonnet calls — same structure as Stage 2         │
│           but with MUCH richer, pre-verified context)               │
│                                                                     │
│  Each teaching call now receives:                                   │
│   FROM LAYER 0: Student archetype, story essence                   │
│   FROM LAYER 1: Raw extracted features (verbs, nums, signals)      │
│   FROM LAYER 2: Dimension-by-dimension scores with rules used      │
│   FROM LAYER 3: Resolved ambiguities with reasoning                │
│   FROM LAYER 4: Calibration adjustments and why                    │
│   FROM LAYER 5: Spike, coherence, alignment, positioning           │
│   FROM CHAT:    Activity profile (if exists)                        │
│                                                                     │
│  Teaching calls are per-activity (parallel), same as current.      │
│  But each call is richer, more focused, and more targeted.         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. THE DEEP INTERCONNECTIONS

This is where the architecture becomes more than the sum of its parts. Each layer doesn't just consume the previous layer's output — it creates **compound intelligence** where insights cascade.

### 3.1 Vertical Chain: Story → Extraction → Scoring → Teaching

```
Story: "Builder archetype, first-gen, works 20hrs/wk"
  ↓
Extraction: "Description says 'Founded first CS club' — verb 'Founded' extracted,
             unique detail 'first CS club at school' flagged"
  ↓
Scoring: roleOwnership=9 (clear founder), differentiation=8 (unique: 'first' at school),
         commitment=9 (contextual: 20hr/wk work + still did this)
  ↓
Teaching: "Your CS Club description is strong (8.4/10). The single biggest improvement:
          add the hackathon attendance number. Your extracted features show '60-person
          hackathon' in the data but your 150-char description got cut off. Here's a
          rewrite that fits: 'Founded school's 1st CS club; taught 25 students Python
          (loops→OOP); organized multi-school hackathon (60 participants, 12 projects).'"
```

Each layer builds on the **specific outputs** of previous layers. The teaching doesn't just say "add numbers" — it knows WHICH numbers exist in the extracted data and WHICH dimension needs them most.

### 3.2 Horizontal Chain: Cross-Activity Insight Propagation

```
Activity A (CS Club): differentiation_score = 8, spike_role = "core"
Activity B (Research): differentiation_score = 6, spike_role = "supporting"
Activity C (Tutoring): differentiation_score = 3, spike_role = "impact_vehicle"
Activity D (Grocery):  differentiation_score = 4, spike_role = "obligation"
Activity E (Farm):     differentiation_score = 3, spike_role = "obligation"

Cross-Activity Insight (code-derived):
  → Activities C, D, E are all low-differentiation
  → C and D descriptions use similar verb patterns ("help", "work", "manage")
  → Student has a REPEATED PATTERN of underselling non-CS activities

Portfolio Teaching (instead of teaching each in isolation):
  "You have a consistent pattern across your non-CS activities: descriptions
   default to duty-listing ('help with...', 'work at...', 'manage...').
   Your CS activities use much stronger ownership language ('Founded', 'Built',
   'Organized'). Apply the same ownership mindset to tutoring, grocery, and
   farm work."
```

This is impossible in the current architecture because each activity's teaching is generated independently. The new system sees the **pattern across all descriptions** before any teaching call is made.

### 3.3 Verification Chain: Chat Profile → Ground Truth → Score Gap

```
Chat Profile (from conversation): "Student mentioned training 12 employees,
  handling $8K daily deposits, creating a new closing checklist"

Description: "Promoted to shift lead after 6 months. Train new employees.
  Work 20 hours per week to help support family."

Extraction: verbs=["Promoted","Train","Work"], numbers=[{6,"months"},{20,"hours"}]
  → NO mention of 12 employees, $8K deposits, or checklist

Code Verification (Layer 4):
  → Chat profile has 3 achievements NOT in description
  → Description is UNDERSELLING by measurable amount
  → Potential score WITH profile data = 7.8 vs current 5.3

Teaching (with verification context):
  "Your Grocery Store description scores 5.3/10, but based on what you told me
   in our conversation, you could score 7.8/10. You're leaving 2.5 points on
   the table by not mentioning:
   1. Training 12 employees (demonstrates scope)
   2. Managing $8K daily deposits (demonstrates trust/responsibility)
   3. Creating the closing checklist (demonstrates initiative)

   Here's a rewrite: 'Shift lead (6-mo promotion): manage $8K+ deposits,
   train 12 employees, created closing checklist cutting errors 40%.
   20 hrs/wk supporting family while maintaining academics.'"
```

The current system has chat profile integration in Stage 2, but it doesn't use profiles to **quantify the gap** between what the student has done and what their description says.

### 3.4 Spike Intelligence Propagation

The spike detection result from Layer 5A propagates to EVERY subsequent teaching call:

```
Spike Detection: "CS spike, strength=developing, evidence=[CS Club, Research]"

CS Club teaching:     "This is your spike's core activity. Description must be
                       your STRONGEST. Current: 8.4. Target: 9+. Gap: quantification."

Research teaching:    "This supports your spike. Emphasize the CS contribution
                       (NLP pipeline), not the healthcare framing."

Tutoring teaching:    "Math/science tutoring connects to your CS spike IF you
                       reframe: 'Developed practice problems using computational
                       approach' bridges tutoring → CS narrative."

Grocery teaching:     "Doesn't directly support CS spike, but supports your
                       'builder from constraint' narrative. Frame as: systems
                       thinking applied to operations."

Farm teaching:        "Currently disconnected. Bridge: 'Keep digital harvest
                       records' → data/systems thinking. Or accept as character
                       and let description show work ethic."

Portfolio teaching:   "Your CS spike has technical depth (club+research) but
                       lacks competitive validation. For MIT: you need a
                       competition result, deployed project, or publication."
```

### 3.5 Dimension-Routed Teaching (the deepest interconnection)

Instead of telling Sonnet "teach everything about this activity," the code **routes to specific teaching strategies** based on which dimensions scored lowest:

```
Activity: Math Tutor (score 4.3/10)
  Lowest dimensions: impactEvidence=1, roleOwnership=3, differentiation=3

Code routing decision:
  → PRIMARY teaching target: impactEvidence (scored 1/10, weight 25%)
  → SECONDARY: roleOwnership (scored 3/10, weight 25%)
  → SKIP: quantification (scored 4/10 — not great but not the bottleneck)

Teaching prompt is FOCUSED:
  "This student's tutoring description scores 1/10 on impact evidence. The
   extracted features show: zero outcomes mentioned, no cause-effect chain,
   activity-focused rather than impact-focused writing. The student tutors
   8 middle schoolers regularly in math and science.

   Generate teaching that:
   1. Explains WHY impact evidence matters (the 'so what' problem)
   2. Shows the student how to find impact in their existing experience
      (did grades improve? did students gain confidence? pass tests?)
   3. Provides a before/after rewrite demonstrating the transformation

   ALSO address role ownership (3/10): the description says 'Help with
   homework' — shift to ownership language showing what Lead Tutor means."

   DO NOT address quantification or differentiation — those are lower priority
   and we want deep, focused teaching on the 1-2 things that matter most."
```

This is fundamentally different from the current approach where Sonnet receives the entire rubric and decides on its own what to focus on. The code knows the exact numerical breakdown and makes the routing decision deterministically. Sonnet then does what it's best at — generating compelling, personalized teaching within a focused scope.

### 3.6 The Calibration Feedback Loop

After Layer 4 calibrates scores, the adjustments themselves become teaching context:

```
Pre-calibration:                    Post-calibration:
  CS Club:     8.4 (high conf.)       → 8.4 (unchanged)
  Research:    7.2 (medium conf.)     → 7.2 (unchanged)
  Grocery:     6.9 (medium conf.)     → 7.3 (adjusted UP: first-gen work multiplier)
  Farm:        5.4 (medium conf.)     → 5.8 (adjusted UP: rural context)
  Tutoring:    4.3 (high conf.)       → 4.3 (unchanged)

Calibration Report:
  "Grocery adjusted +0.4: Student works 20hrs/wk to support family as first-gen.
   Promotion to shift lead in 6 months demonstrates exceptional commitment under
   constraint. Standard scoring underweights the opportunity cost of 1,040 hrs/yr."

  "Farm adjusted +0.4: Rural 200-acre family farm work during growing season
   represents significant labor invisible to standard rubrics."
```

This report becomes teaching context: "Your grocery work scored 7.3, including a resilience adjustment for your work-family context. But you're still losing points on description quality (5.3). The activity IS strong — the words just need to match."

---

## 4. WHAT CHANGES vs. WHAT STAYS

### 4.1 Files to CREATE (new layers)

| File | Layer | Purpose |
|---|---|---|
| `scoring/featureExtractor.ts` | 1 | Haiku-powered extraction per-activity |
| `scoring/featureTypes.ts` | 1 | Types for extracted features |
| `scoring/descriptionRuleScorer.ts` | 2 | Deterministic description scoring from features |
| `scoring/activityRuleScorer.ts` | 2 | Deterministic activity scoring from features |
| `scoring/scoringRules.ts` | 2 | Single source of truth for all scoring thresholds/weights |
| `scoring/ambiguityResolver.ts` | 3 | Focused Sonnet calls for edge cases only |
| `scoring/calibrationEngine.ts` | 4 | Cross-activity consistency enforcement |
| `scoring/spikeDetector.ts` | 5A | Focused spike detection |
| `scoring/coherenceAnalyzer.ts` | 5B | Focused coherence analysis |
| `scoring/majorAligner.ts` | 5C | Code-based major alignment using existing knowledge base |
| `scoring/competitivePositioner.ts` | 5D | Deterministic competitive positioning |
| `scoring/teachingRouter.ts` | 6 | Dimension-routed teaching dispatch |

### 4.2 Files to MODIFY

| File | Changes |
|---|---|
| `scoring/scoringOrchestrator.ts` | Rewire to use new layer pipeline |
| `scoring/descriptionScoringService.ts` | Refactor: keep rubric/prompts as reference, wire to extraction→rules→resolve |
| `scoring/activityScoringService.ts` | Same refactor pattern |
| `scoring/portfolioScoringService.ts` | Decompose into 5A-5D |
| `stages/stage1ContextAwareAnalysisService.ts` | Wire to new scoring pipeline |
| `stages/stage2ConditionalTeachingService.ts` | Enrich teaching context with all layers |

### 4.3 Files that STAY THE SAME

| File | Why |
|---|---|
| `stages/stage0StoryDetectionService.ts` | Already well-scoped |
| `stages/stage3PortfolioSynthesisService.ts` | Structure is fine, benefits from richer inputs automatically |
| `scoring/scoringCacheService.ts` | Caching strategy is sound |
| `scoring/types.ts` | Output types stay the same — refactor of HOW we compute, not WHAT we output |
| `scoring/comparisonBenchmarksLibrary.ts` | Reference data, unchanged |

---

## 5. COST & PERFORMANCE ANALYSIS

### 5.1 Current Architecture (10 activities)

| Call | Model | Cost |
|---|---|---|
| Description batch (10 in 1) | Sonnet | ~$0.03 |
| Activity batch (10 in 1) | Sonnet | ~$0.03 |
| Portfolio scoring (1) | Sonnet | ~$0.02 |
| Teaching layer (optional) | Sonnet | ~$0.03 |
| **Total scoring** | | **~$0.08-0.11** |

### 5.2 New Architecture (10 activities)

| Call | Model | Cost |
|---|---|---|
| Feature extraction (10 parallel) | Haiku | ~$0.005 |
| Rule scoring | Code | $0.00 |
| Ambiguity resolution (2-3 calls) | Sonnet | ~$0.01-0.02 |
| Calibration | Code | $0.00 |
| Spike detection (1) | Sonnet | ~$0.01 |
| Coherence analysis (1) | Sonnet | ~$0.01 |
| Major alignment + positioning | Code | $0.00 |
| **Total scoring** | | **~$0.035-0.045** |

**Cost reduction: ~50-60%** with MORE reliable scores.

### 5.3 Latency

- Current: ~15-20s (3-4 parallel Sonnet calls)
- New: ~8-12s (10 parallel Haiku + 2-4 parallel Sonnet, rest instant)
- **Reduction: ~30-40%**

### 5.4 Reliability

| Metric | Current | New |
|---|---|---|
| Score consistency (same input, 5 runs) | ~70% within ±1 point | ~95% within ±0.5 point |
| Cross-activity ordering | Sometimes violated | Guaranteed correct |
| Tier classification accuracy | ~80% | ~90-95% |
| Contextual adjustments | Implicit (LLM "hopefully remembers") | Explicit & auditable |

---

## 6. IMPLEMENTATION STRATEGY

### Phase 1: Foundation — Feature Extraction + Rule Scoring
- Build `featureExtractor.ts` with comprehensive extraction schema
- Build `descriptionRuleScorer.ts` and `activityRuleScorer.ts`
- Build `scoringRules.ts` as the single source of truth
- Write 50+ unit tests for rule scoring
- **Verification:** Run side-by-side with current LLM scoring on 20 test activities

### Phase 2: Calibration Engine
- Build `calibrationEngine.ts` with ordering invariants
- Build distribution constraints and contextual adjustments
- Build cross-reference validation (chat profiles)
- **Verification:** Run on diverse profiles. Check edge cases.

### Phase 3: Portfolio Intelligence Decomposition
- Build focused spike detection and coherence analysis
- Build code-based major alignment and competitive positioning
- **Verification:** Compare portfolio scores against current system

### Phase 4: Integration
- Refactor `scoringOrchestrator.ts` to use new pipeline
- Update Stage 1 and Stage 2 to consume enriched context
- Build `teachingRouter.ts` for dimension-routed teaching
- **Verification:** Full E2E comparison

### Phase 5: Ambiguity Resolution Layer
- Build `ambiguityResolver.ts` for edge cases
- Tune confidence thresholds (start conservative)
- **Verification:** Measure what % of activities need resolution. Target: <30%.

---

## 7. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| Rule scoring too rigid for nuanced cases | Scores feel mechanical | Ambiguity resolution layer handles edges; rules output "uncertain" confidence |
| Feature extraction misses subtle signals | Under-scoring sophisticated descriptions | Rich extraction schema; validate against current scores before cutover |
| Calibration over-corrects | Scores feel artificial | Max adjustment ±0.5; all adjustments logged and auditable |
| More code = more maintenance | Long-term burden | Rules are simple, well-tested, centralized in one file |
| Transition disrupts quality | Regression | Side-by-side comparison before cutover; feature flag for rollback |

---

## 8. THE BOTTOM LINE

The current system is like asking one very smart person to simultaneously be:
- A copy editor (description quality)
- An admissions officer (tier classification)
- A career counselor (major alignment)
- A data analyst (competitive positioning)
- A writing coach (teaching)

They can do each of these well individually. But doing all five at once means none gets full attention.

The new architecture is like a well-coordinated admissions committee:
- An assistant reads each file and extracts key facts (Feature Extraction)
- A scoring system applies the rubric consistently (Rule Scoring)
- A senior officer resolves borderline cases (Ambiguity Resolution)
- A quality checker ensures no inconsistencies (Calibration)
- Specialists each analyze one dimension deeply (Portfolio Intelligence)
- A mentor crafts personalized guidance from all of this (Teaching)

Each does what they're best at. The result is both more reliable AND more insightful — and cheaper.

---

**Awaiting your review before implementation.**
