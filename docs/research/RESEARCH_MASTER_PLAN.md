# PASS System Research Master Plan

## Organization System

```
docs/research/
├── RESEARCH_MASTER_PLAN.md          # This file - tracks everything
├── REVISED_RESEARCH_STRATEGY.md     # Overall approach
├── prompts/                          # Raw prompts to run
│   ├── PROMPT_A2_PORTFOLIO_EVALUATION.md  # Full A2 prompt
│   └── ...
├── outputs/                          # Raw Perplexity outputs
│   ├── PROMPT_A1_ACADEMIC_STANDARDS.md ✅
│   ├── PROMPT_A2_SECTIONS_1.1_1.2_1.3_RAW.md ✅
│   └── ...
└── synthesis/                        # Analyzed & structured findings
    └── ACTIVITY_EVALUATION_FOUNDATION.md ✅
```

**Codebase Integration:** `src/services/portfolioStrategy/data/`

---

## Research Phases

### PHASE 1: Admissions Perspective (What Colleges Want)
**Goal:** Understand how elite admissions officers evaluate applications

| Prompt | Section | Focus | Status | Output Location |
|--------|---------|-------|--------|-----------------|
| A1 | Full | Academic Standards (GPA, rigor, testing) | ✅ Complete | `academicStandards.ts` |
| A2 | 1.1 | Quality vs Quantity Framework | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.2 | Time Commitment Standards | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.3 | Depth vs Breadth Signals | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.4 | Leadership/Spike Concept | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.5 | Impact Assessment | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.6 | Context & Circumstances | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 1.7 | Activity Categories | ✅ Complete | `activityEvaluationStandards.ts` |
| A2 | 2 | Recommendations | 🔜 Run in Perplexity | - |
| A2 | 3.1 | Intellectual Curiosity | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.2 | Resilience and Grit | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.3 | Integrity and Ethics | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.4 | Community Contribution | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.5 | Leadership Potential | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.6 | Self-Awareness and Maturity | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 3.7 | Fit and Campus Contribution | ✅ Complete | `CHARACTER_ASSESSMENT_FOUNDATION.md` |
| A2 | 4.1 | Academic Red Flags | ✅ Complete | `RED_FLAGS_FOUNDATION.md` |
| A2 | 4.2-4.5 | Activity/Character/Inconsistency Red Flags | 🔜 Run in Perplexity | - |
| A2 | 5 | Holistic Review Process | 🔜 Run in Perplexity | - |

**Note:** Essays excluded - separate system exists

### PHASE 2: Student Action Guide (What Students Should Do)
**Goal:** Actionable guidance for strengthening portfolios

| Prompt | Focus | Status |
|--------|-------|--------|
| B1 | Activity Development Strategies by Interest Area | Pending |
| B2 | Award/Competition Pathways by Field | Pending |
| B3 | Leadership Development & Impact Creation | Pending |
| B4 | Summer Program & Research Opportunities | Pending |

### PHASE 3: Classification Standards (How We Evaluate)
**Goal:** Defensible tier systems for our evaluation engine

| Prompt | Focus | Status |
|--------|-------|--------|
| C1 | Activity Tier Classification Rubric | Pending |
| C2 | Award Recognition Hierarchy | Pending |
| C3 | Leadership & Impact Scoring | Pending |

### PHASE 4: School-Specific Tailoring (Minimal)
**Goal:** Only the differences that actually matter

| Prompt | Focus | Status |
|--------|-------|--------|
| D1 | Testing Policies (required/optional/blind) | Pending |
| D2 | Demonstrated Interest Policies | Pending |
| D3 | Institutional Values Keywords | Pending |

---

## Completed Research Integration

### A1: Academic Standards ✅
**Source:** Perplexity Deep Research, January 2026
**Integrated to:** `src/services/portfolioStrategy/data/academicStandards.ts`

**Key Findings:**
- GPA: 3.75+ is effective floor (93.69% of Harvard admits), 4.0 is norm (74%)
- Rigor: 8-12 APs expected at well-resourced schools
- Testing: 1500+ SAT / 33+ ACT for T20 consideration
- Two-stage model: Academic threshold (eliminates 75-90%) → Holistic differentiation

### A2 Sections 1.1-1.3: Activity Evaluation Foundation ✅
**Source:** Perplexity Deep Research, January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTIONS_1.1_1.2_1.3_RAW.md`
**Synthesis:** `docs/research/synthesis/ACTIVITY_EVALUATION_FOUNDATION.md`
**Integrated to:** `src/services/portfolioStrategy/data/activityEvaluationStandards.ts`

**Key Findings by Section:**

#### Section 1.1: Quality vs Quantity
- **Optimal Core Activities:** 2-4 sustained 3-4 years
- **MIT Hard Cap:** 4 activities (institutional signal)
- **Stanford Dean Shaw:** "two to three things that they really care about"
- **Resume Padding Flags:** 40+ hrs/week across 10+ activities, 5+ simultaneous leadership roles
- **Cross-Validation:** Recommendation alignment, essay integration, temporal consistency
- **Special Circumstances:** Harvard Ratings 5-6 accommodate work/family obligations

#### Section 1.2: Time Commitment
- **Serious Commitment:** 5-10 hours/week per major activity
- **Casual Threshold:** Under 5 hours/week
- **Critical Formula:** Longevity × Intensity (4 years @ 5 hrs > 1 year @ 20 hrs)
- **Summer Hierarchy:** Traditional employment > Self-directed projects > Selective programs > Pay-to-play (LOW VALUE)
- **Fitzsimmons Quote:** "old-fashioned summer job...is often invaluable"

#### Section 1.3: Depth vs Breadth
- **Depth Signals:** Progressive leadership, quantifiable impact, specialized expertise
- **Breadth Signals:** Thematic coherence, 2-4-6 approach, four-domain coverage
- **Red Flags:** Chronological inconsistency, absence of leadership, generic descriptions, thematic incoherence
- **2024-25 Trend:** "Universities are prioritizing applicants who show depth, initiative, and impact over those who simply check boxes"

---

## Pending Research Integration

### A2 Sections 1.4-1.5: Spike and Impact ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTIONS_1.4_1.5_RAW.md`
**Synthesis:** `docs/research/synthesis/ACTIVITY_EVALUATION_FOUNDATION.md` (v2.0)
**Integrated to:** `src/services/portfolioStrategy/data/activityEvaluationStandards.ts`

**Key Findings from Section 1.4 (Spike Concept):**
- **False Dichotomy Resolved:** "Have a spike, not BE a spike" - need BOTH depth AND baseline breadth
- **Institutional Variations:** Stanford (balanced), Yale (well-rounded friendly), Harvard (spike advocacy), MIT (technical spike)
- **Quantitative Evidence:** 4 activities = 30% acceptance (HIGHEST), 6 activities = 7% (lower than 1!)
- **Well-Lopsided Framework:** ~4 activities, 4-8 hrs/week, exceptional achievement in ONE area
- **Recent Changes (2024-25):** 41% app increase, "Great Deferral Wave", contextual evaluation intensified

**Key Findings from Section 1.5 (Impact Assessment):**
- **Sara Harberson's 4-3-2-1 System:** National (4pts) → State (3pts) → Regional (2pts) → Local (1pt)
- **Contextual Modifier:** "Outsized local impact" valued similarly to national for under-resourced students
- **Verification Reality:** M-A Chronicle found "not a single coach was asked to verify" - selective verification
- **Credibility Spectrum:** Third-party validation, specific quantification, sustained trajectory = high credibility
- **Exaggeration Risk:** 40-50% of apps have exaggeration, but "risk-reward usually against you"

**Evaluation Functions Added:**
- `detectSpike()` - Spike detection with scoring algorithm
- `assessInstitutionalFit()` - School-specific profile fit assessment
- `calculateImpactTierPoints()` - Sara Harberson's tier system with contextual modifiers
- `assessClaimCredibility()` - Credibility evaluation with red flag detection
- `checkWellLopsidedAlignment()` - Profile alignment with recommended framework

### A2 Section 1.6: Context & Circumstances ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_1.6_RAW.md`
**Synthesis:** `docs/research/synthesis/ACTIVITY_EVALUATION_FOUNDATION.md` (v3.0)
**Integrated to:** `src/services/portfolioStrategy/data/activityEvaluationStandards.ts`

**Key Findings from Section 1.6 (Context & Circumstances):**
- **CRITICAL INSIGHT:** Achievement evaluated RELATIVE to opportunities, not absolute
- **Paid Work Valuation:** "The more hours, the better" - Sarah Harberson. Manual labor > office work
- **Family Responsibilities:** "The CORNERSTONE of college admissions...Nothing is more important than that, not even a perfect test score" - Sarah Harberson
- **Harvard Rating 5:** Dedicated tier for "family commitments or term-time work"
- **315 Deans Statement:** "We view substantial family contributions as very important"
- **School Context Calibration:** Rice system compares students to similar-resource peers (since 1992)
- **Geographic Limitations:** "Sparse country" term; rural underrepresented (7-10% vs 19% population)
- **Equivalence Principle:** Working students can equal privileged peers with traditional activities
- **Information Asymmetry:** Under-resourced students "unaware that caregiving or working can be listed"

**Data Structures Added:**
- `CONTEXTUAL_REVIEW_FOUNDATION` - Core evaluation principle
- `PAID_WORK_EVALUATION` - Work valuation standards
- `FAMILY_RESPONSIBILITIES_EVALUATION` - The cornerstone framework
- `SCHOOL_CONTEXT_CALIBRATION` - Rice/Princeton/Pomona approaches
- `GEOGRAPHIC_CONTEXT` - Sparse country and underrepresentation
- `CIRCUMSTANCE_DOCUMENTATION` - Three channels for reporting
- `EQUIVALENCE_PRINCIPLE` - Work/family equivalent to traditional activities
- `INFORMATION_ASYMMETRY` - Systemic challenges

**Updated Types:**
- `PortfolioEvaluationInput.contextualFactors` - Detailed context capture
- `ContextualModifierResult` - Evaluation adjustment output

### A2 Section 1.7: Activity Categories ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_1.7_RAW.md`
**Synthesis:** `docs/research/synthesis/ACTIVITY_EVALUATION_FOUNDATION.md` (v4.0)
**Integrated to:** `src/services/portfolioStrategy/data/activityEvaluationStandards.ts`

**Key Findings from Section 1.7 (Activity Categories):**
- **REVOLUTIONARY FINDING:** NO activity type hierarchy - passion and depth trump category
- **Chris Peterson (MIT):** "Maybe it's a sport... Napping. Hopscotch. Whatever it is, spend time on it."
- **Three Universal Dimensions:** Impact & Achievement, Depth & Trajectory, Institutional Fit
- **Ubiquity Problem:** Typical activities (NHS, student gov) = Rating 3 = "little to distinguish"
- **Standout Markers:** Depth, personal ownership, measurable impact, unique perspective
- **Endangered Species Concept:** Institutional need fulfillment (bassoonists, crew coxswains)
- **Harvard 1-6 Scale:** Full rating definitions with acceptance rates (Rating 1 = 48% acceptance)
- **CollegeVine 4-Tier:** Framework for activity classification
- **Virtual Activities:** Fully normalized post-pandemic
- **Holistic Review Process:** 90+ minutes for admitted students across 5 phases
- **Work as Premium EC:** "Top-tier extracurricular" for sustained employment

**Data Structures Added:**
- `ACTIVITY_TYPE_EVALUATION` - No hierarchy principle
- `UNIVERSAL_EVALUATION_DIMENSIONS` - Three assessment dimensions
- `FIELD_SPECIFIC_EVALUATION` - Arts/athletics/research exceptions
- `TYPICAL_ACTIVITIES_PROBLEM` - Ubiquity detection
- `STANDOUT_ACTIVITY_MARKERS` - Four markers of memorable activities
- `ENDANGERED_SPECIES_CONCEPT` - Institutional need fulfillment
- `PASSION_PROJECT_EVALUATION` - Authenticity detection
- `VIRTUAL_ACTIVITIES_EVALUATION` - Post-pandemic status
- `HARVARD_EXTRACURRICULAR_RATING_SCALE` - Full 1-6 scale with data
- `COLLEGEVINE_TIER_FRAMEWORK` - Four-tier system
- `SPIKE_VS_WELLROUNDED_EXTENDED` - Extended analysis
- `HOLISTIC_REVIEW_PROCESS` - 5-phase evaluation timeline
- `WORK_AS_PREMIUM_EC` - Reinforces Section 1.6
- `SECTION_1_7_IMPLEMENTATION` - Implementation summary

**Types Added:**
- `HarvardECRating` (1-6)
- `CollegeVineTier` (1-4)
- `ActivityTierAssessment` - Per-activity tier evaluation
- `PortfolioTierSummary` - Portfolio-level tier summary

---

### === SECTION 1 COMPLETE ===

All extracurricular activity evaluation research (Sections 1.1-1.7) has been integrated.

---

### A2 Section 2: Recommendations
**Status:** SKIPPED (Students have limited control over recommendations)

---

### A2 Section 3.1: Intellectual Curiosity ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.1_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v1.0)

**Key Findings from Section 3.1:**
- **SEPARATELY RATED:** Stanford uses independent 1-6 Intellectual Vitality scale
- **8X ADVANTAGE:** Harvard 2023 - "significant academic creativity" = eightfold advantage over perfect grades alone
- **THE OOZE STANDARD:** Dr. Irena Smith: "Intellectual vitality must OOZE from the file"
- **FIVE EVIDENTIARY DOMAINS:** Self-directed inquiry, classroom behavior, risk-taking, trajectory, interview
- **AUTHENTICITY MARKERS:** Organic origin, intellectual coherence, process orientation
- **PERFORMANCE FLAGS:** Mismatched sophistication, checklist diversity, bought experiences
- **TIER SYSTEM:** Research+publication (T1), Dual enrollment (T2), Summer programs (T3)
- **RISK FRAMEWORK:** Reward calculated depth, PENALIZE strategic safety

**Identified Gaps:**
- Harvard SFFA personal rating rubric details
- MIT detailed evaluation framework
- Interview protocols for Yale, Princeton, MIT, Stanford
- Truncated Richard Shaw quote
- Specific summer programs that are discounted vs valued

---

### A2 Section 3.2: Resilience and Grit ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.2_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v2.0)
**Quality Assessment:** A- (Excellent - best section so far with strong equity framework)

**Key Findings from Section 3.2:**
- **PRIVILEGE QUANTIFIED:** Top 1% = 34% more likely; Top 0.1% = 2x+ advantage
- **ADVANTAGE SOURCES:** Legacy (46%), Athletics (24%), Non-academic credentials (30%)
- **FAILURE ESSAYS EVOLVED:** Authentic struggle now OUTCOMPETES achievement narratives
- **PERSONAL RATING CRITICAL:** "Low personal CAN SINK otherwise strong application"
- **THREE-LENS FRAMEWORK:** Narrative framing + Self-explanatory style + Corroboration
- **CONTEXT IS EVERYTHING:** Same challenge evaluated differently based on privilege context
- **AGENCY ESSENTIAL:** Most resilient students demonstrate CONTROL over trajectory
- **NO-ADVERSITY PATH:** Character via leadership, intellectual engagement, empathy
- **PENN CASE:** Fabrication of mother's death = immediate rescission (verification happens)

**Identified Gaps:**
- Yale/Princeton resilience frameworks (Harvard depth only)
- International student adversity contextualization
- Mental health vs physical/economic adversity weighting
- COVID-era adversity saturation
- Family vs personal adversity distinctions
- Quantified personal rating acceptance rates

---

### A2 Section 3.3: Integrity and Ethics ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.3_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v3.0)
**Quality Assessment:** A (Excellent - most comprehensive and actionable section, 78 citations)

**Key Findings from Section 3.3:**
- **VERIFIABLE VS VERIFIED:** Officers don't fact-check everything but look for INTERNAL CONSISTENCY (Boeckenstedt)
- **60% AI DETECTION:** Colleges use AI detection tools as initial screening only - human review required
- **FIVE-POINT INTEGRITY CHECK:** Narrative coherence + Voice authenticity + Recommendation alignment + Behavioral evidence + Contextual verification
- **FOUR-DIMENSION CONSISTENCY CHECK:** Activity-Essay, Activity-Recommendation, Grade-Narrative, Test-Writing alignment
- **VOICE AUTHENTICITY MARKERS:** Natural tone, specific details, occasional imperfection, cross-component consistency
- **RESUME PADDING FLAGS:** Implausible time, role inflation ("Independent child-care provider" = babysitting), fake organizations
- **AI DETECTION SIGNALS:** Lack of narrative risk, flat sentence variation, overly polished conclusions
- **RESCISSION REALITY:** Yale, Stanford 2019 cases; can occur years post-graduation
- **AUTHENTIC REC MARKERS:** Specific anecdotes, honest limitations, contextual insights, personality evident

**Data Structures Added:**
- `IntegrityAndEthicsAssessment` - Complete interface with:
  - Four-dimension consistency check
  - Voice authenticity assessment
  - Resume padding detection flags
  - AI detection signals
  - Five-point integrity framework
  - Recommendation authenticity markers
  - Integrity concerns with severity levels
  - Overall integrity rating and verification recommendation

**Identified Gaps:**
- AI detection tool accuracy comparison (GPTZero vs Turnitin vs Copyleaks)
- International student verification challenges
- False positive rates for multilingual/advanced writers
- Recommendation contradiction weighting (one negative vs two positive)
- Nonprofit registry verification processes
- Verification timeline (pre-admission vs post-enrollment percentages)
- Voice consistency quantification metrics

---

### A2 Section 3.4: Community Contribution and Service ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.4_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v4.0)
**Quality Assessment:** B+ (Strong authority citations, quantified findings, clear frameworks)

**Key Findings from Section 3.4:**
- **INTERNATIONAL SERVICE TRIPS = RED FLAG:** "Expensive mission trips reek of privilege" — Ivy Coach
- **70% PREFER SINGLE CAUSE:** DoSomething survey (264 AOs) — majority recommend ONE cause over years
- **LOCAL > INTERNATIONAL:** "Act locally, think globally" — sustained local work beats exotic trips
- **DOING WITH NOT FOR:** Harvard "Turning the Tide" framework emphasizes partnership over charity
- **PERSONAL CONNECTION VALUED:** Service tied to identity > detached volunteering
- **2-3 YEARS MINIMUM:** Meaningful duration with increasing responsibility
- **53% TIEBREAKER:** Service is critical differentiator when academics equal (IESD survey)
- **VERIFICATION IS REAL:** AOs call counselors, contact orgs, check social media

**Data Structures Added:**
- `CommunityContributionAssessment` - Complete interface with:
  - Harvard "Turning the Tide" three-dimension framework
  - Local vs international geography evaluation
  - "Doing with" vs "doing for" assessment
  - Duration and depth indicators
  - Personal connection evaluation
  - Verification signals (parallels Section 3.3)
  - Four-dimension character indicators

**Identified Gaps:**
- Service duration thresholds (what duration = what rating?)
- International program whitelist/blacklist (no program names)
- Service hours quantification (is 500 > 200?)
- Organization tier system (are some orgs favored?)
- Service-to-essay language patterns
- Family responsibility vs formal service comparison
- Virtual service post-COVID status

---

### A2 Section 3.5: Leadership Potential ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.5_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v5.0)
**Quality Assessment:** A- (26 citations, strong institutional frameworks, excellent authority citations)

**Key Findings from Section 3.5:**
- **BEYOND TITLES:** "They don't want to know THAT you were president — they want to know WHAT HAPPENED because you were president"
- **HARVARD PERSONAL RATING SCALE (1-4):** Specific behavioral indicators for each level
- **SEDLACEK NCQ FRAMEWORK:** 8 noncognitive variables predict success better than grades
- **INTROVERTED LEADERSHIP:** Must conscientiously package abilities; contribution-over-visibility path
- **NON-TRADITIONAL LEADERSHIP:** Work, family caregiving, informal peer influence all count
- **TITLE INFLATION = INTEGRITY CONCERN:** Cross-references Section 3.3

**Data Structures Added:**
- `LeadershipPotentialAssessment` - Complete interface with beyond-titles evaluation, leadership style, Harvard rating alignment, NCQ variables

---

### A2 Section 3.6: Self-Awareness and Maturity ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.6_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v6.0)
**Quality Assessment:** A+ (73 citations - most comprehensive section)

**Key Findings from Section 3.6:**
- **DEE LEOPOLD'S THREE DIMENSIONS:** HOW you tell the story (accomplishment discernment, setback learning, strengths/weaknesses balance)
- **BEFORE-DURING-AFTER ARCHITECTURE:** The DURING (internal process) is critical and most often missing
- **VULNERABILITY PARADOX:** Strength demonstrated THROUGH imperfection, not despite it
- **70%/80% NACAC DATA:** 70% of AOs value empathy; 80% look for resilience
- **FOUR INDEPENDENCE MARKERS:** Self-advocacy, self-management, life skills, emotional resilience
- **META-SKILL:** Self-awareness ENABLES authentic demonstration of ALL other dimensions

**Data Structures Added:**
- `SelfAwarenessMaturityAssessment` - Complete interface with Dee Leopold framework, essay architecture, EQ components, independence markers

---

### A2 Section 3.7: Fit and Campus Contribution ✅
**Status:** Complete - fully integrated January 2026
**Raw Output:** `docs/research/outputs/PROMPT_A2_SECTION_3.7_RAW.md`
**Synthesis:** `docs/research/synthesis/CHARACTER_ASSESSMENT_FOUNDATION.md` (v7.0)
**Quality Assessment:** A+ (75 citations - peer-reviewed research, quantified findings)

**Key Findings from Section 3.7:**
- **BILLIONS OF COMBINATIONS:** Hargadon explains mathematical necessity of holistic review
- **DUAL LENS FRAMEWORK:** Individual success + Collective contribution to peers
- **PEER IMPACT > GPA:** Character traits 2x more impactful on peer outcomes than academic ability (Journal of U Chicago)
- **THREE-CATEGORY INTERSECTION:** Academic, Personal, Contextual factors evaluated TOGETHER, not separately
- **MISSION ALIGNMENT:** Each institution has distinct values defining "fit"
- **CHARACTER SKILLS SNAPSHOT:** 7-skill standardized assessment framework (already in use)
- **CONTEXT RESHAPES MEANING:** Same achievement evaluated differently based on opportunity
- **INTEGRATION LAYER:** How all character dimensions (3.1-3.6) connect to class building

**Data Structures Added:**
- `FitAndCampusContributionAssessment` - Complete interface with dual lens, three-category intersection, mission alignment, Character Skills Snapshot estimate

---

### A2 Sections 4, 5
**Status:** Prompts ready to run in Perplexity
**Full Prompt:** `docs/research/prompts/PROMPT_A2_PORTFOLIO_EVALUATION.md`

**Expected Topics:**
- Section 4: Red Flags (academic, activity, character, inconsistency)
- Section 5: Holistic Review Process (reading process, rating systems, committee decisions)

---

## Data Integration Workflow

After each research output:

1. **Save raw output** → `docs/research/outputs/PROMPT_X_SECTION_Y.md`
2. **Create synthesis document** → `docs/research/synthesis/TOPIC_NAME.md`
   - Structured analysis
   - Authority quotes preserved
   - Implementation guidelines
   - Cross-references to related sections
3. **Update TypeScript data file** → `src/services/portfolioStrategy/data/`
   - Clear section markers
   - Source citations in code
   - Placeholder comments for pending sections
4. **Update type definitions if needed** → `src/services/portfolioStrategy/types/`
5. **Update this master plan** → Mark status, note key findings

---

## Section Dependencies Map

```
Section 1.1 (Quantity Standards)
    ↓ Foundation - establishes activity count thresholds
Section 1.2 (Time Commitment)
    ↓ Builds on 1.1 - adds time dimension to evaluation
Section 1.3 (Depth vs Breadth)
    ↓ Builds on 1.1, 1.2 - provides evaluation criteria
Section 1.4 (Spike Concept)
    ↓ Builds on 1.1-1.3 - exceptional depth detection
Section 1.5 (Impact Assessment)
    ↓ Builds on 1.1-1.4 - tiered achievement scoring
Section 1.6 (Context)
    ↓ Modifies all above - contextual adjustments
Section 1.7 (Categories)
    ↓ Categorizes activities for domain-specific evaluation
Section 2 (Recommendations)
    → Cross-validates activity claims
Section 3 (Character)
    → Informs holistic assessment
Section 4 (Red Flags)
    → Overlays detection on all components
Section 5 (Holistic Process)
    → Synthesizes everything into final evaluation
```

---

## Authority Quotes Bank

Key quotes preserved for system feedback (full list in synthesis docs):

| Topic | Quote | Source |
|-------|-------|--------|
| Activity Count | "It's okay if they do two to three things that they really care about" | Stanford Dean Shaw |
| Depth vs Breadth | "Depth of involvement is more impressive than breadth" | College Board |
| Summer Activities | "An old-fashioned summer job...is often invaluable" | Harvard Dean Fitzsimmons |
| Pay-to-Play | "Turned off when experiences repeatedly appear to be bought" | Former Ivy AO |
| 2024-25 Trend | "Universities are prioritizing applicants who show depth, initiative, and impact" | College MatchPoint |
| Thematic Coherence | "Define a common theme between all their interests" | InGenius Prep |
| Balance | "We embrace the idea of 'and' rather than 'or'" | Yale Admissions |
| **Context Principle** | "Given unequal educational opportunity, it is incumbent upon admissions to understand the conditions under which each applicant has performed" | Jerome A. Lucido |
| **Family Cornerstone** | "Family responsibilities are the CORNERSTONE of college admissions...Nothing is more important than that, not even a perfect test score" | Sarah Harberson |
| **Paid Work Value** | "The more hours, the better, especially for the summer" | Sarah Harberson |
| **315 Deans** | "We view substantial family contributions as very important...It will only positively impact" | 315 Deans Statement |
| **School Calibration** | "Students are compared with other students from similar high schools and not against students who attended more affluent schools" | Rice University |
| **Equivalence** | "Differences may be weighed as equivalent in accomplishment (or not) depending on the context" | College Board |
| **No Hierarchy** | "Maybe it's a sport... Napping. Hopscotch. Whatever it is, spend time on it." | Chris Peterson, MIT |
| **Building Classes** | "Building a community; they're not just building a classroom" | Former Harvard AO |
| **Typical Activities** | "Standard accolades like NHS... are a dime a dozen" | Princeton Guidance |
| **Work as EC** | "A job - even flipping burgers - can have a bigger impact than fancy EC's" | Reddit AO prsehgal |
| **Review Time** | "Often exceeds 90 minutes across all stages" for admitted students | AdmitReport/Yale |
| **Ooze Standard** | "Intellectual vitality must OOZE from the file" | Dr. Irena Smith, Stanford |
| **8x Advantage** | "Significant academic creativity" = eightfold advantage over perfect grades | Harvard 2023 |
| **Privilege Quantified** | "Top 1% are 34% more likely... top 0.1% more than doubles" | NYT/Chetty Study |
| **Failure Evolution** | "Authentic struggle often OUTCOMPETES standard achievement narratives" | Research Synthesis |
| **Personal Sink** | "High personal cannot compensate for low intellectual, but low personal CAN SINK" | Ivy Scholars |
| **Resilience Rating 1** | "May display enormous courage in face of seemingly insurmountable obstacles" | Harvard Rubric |
| **Privilege Context** | "Trained to understand within context of privilege afforded the individual" | College Board |
| **Stanford Donors** | "If not highly competitive academically, family connection or giving mean nothing" | Stanford News |
| **Verifiable vs Verified** | Officers don't fact-check everything but look for INTERNAL CONSISTENCY | Jon Boeckenstedt |
| **Recommendations Beyond** | "Recommendations can help us see well beyond test scores and grades" | William Fitzsimmons, Harvard |
| **Inauthentic Voice** | "Fancy words used incorrectly immediately show me student isn't writing in authentic voice" | Former Ivy AO |
| **AI Narrative Risk** | "Lack of narrative risk—genuine essays include vulnerable moments, unsure reflections" | Research Synthesis |
| **Resume Padding** | "Every student I've had who pads resume is truly obsessed and equally anxious" | Admissions Consultant |
| **Authenticity Shows** | "When students are authentically themselves through admissions process, it shows" | Melea Tejedas, Oregon |
| **MIT Character** | "How have you improved the lives of others in your community?" | MIT Essay Prompt |
| **Depth vs Breadth (Yale)** | "We'd much rather see a student deeply committed to one or two activities than dabbled in 10 or 12" | Jeffrey Brenzel, Yale Dean |
| **Mission Trips** | "Expensive mission trips to exotic locales work against applicants...reek of privilege" | Ivy Coach |
| **Single Cause** | "70% prefer sustained commitment to a single cause over more glamorous short-term" | DoSomething survey |
| **Doing With** | "Doing with rather than doing for — genuine partnership and understanding" | Harvard Turning the Tide |
| **Service Tiebreaker** | "53% of officers rate community service as important decision factor" | IESD Survey |
| **Local Service** | "Act locally, think globally" | Elite admissions advisors |
| **Beyond Titles** | "They don't want to know THAT you were president — they want to know WHAT HAPPENED because you were president" | Harvard Rubric |
| **Peer Influence** | "Peer influence through informal networks often carries more weight than titles" | Delta Institute |
| **NCQ Predictive** | "Noncognitive variables have been better predictors of retention than grades" | Dr. William Sedlacek |
| **Introverts** | "Introverts should not rely on admissions officers to see their value without conscientiously packaging abilities" | Command Education |
| **Work/Family** | "Work and family responsibilities" as evidence of mature leadership | Harvard Guidance |
| **Impact Focus** | "Quantify outcomes, explain your role, and highlight initiative" | Harvard Guidance |
| **Self-Awareness** | "Self-awareness isn't demonstrated by telling a story, rather it has to do with how you tell the story" | Dee Leopold, HBS |
| **Maturity Test** | "What have you learned from a mistake?" | Harvard Admissions Prompt |
| **Vulnerability** | "Authentic connection requires willingness to be imperfect" | Brené Brown |
| **Empathy/EQ** | "70% of admissions officers value empathy and community engagement" | NACAC Survey |
| **Resilience Data** | "80% of admissions officers specifically look for signs of resilience" | NACAC Survey |
| **Flawless Trap** | "Students who present themselves as flawlessly perfect often struggle in college" | Research |
| **Building a Class** | "Think about the range of criteria it needs IN A CLASS, not just in individual applicants" | Fred Hargadon, Princeton |
| **Billions of Combinations** | "Literally billions and billions of different combinations of 1,130 people you could put together" | Fred Hargadon, Princeton |
| **Dual Inquiry** | "A two-part inquiry: ability to succeed AND potential to contribute to teaching and learning of peers" | College Board |
| **Peer Impact Quantified** | "1 standard deviation increase in peer persistence raised grades by 1.8% std dev, twice effect of peer GPA" | Journal of U Chicago |
| **Yale Collaboration** | "Don't just succeed individually, but make people around them better" | Yale Admissions |
| **MIT No Tension** | "Diversity and merit are not in tension" | MIT Admissions |
| **Context Intersection** | "Factors are not weighted separately or in isolation. They intersect and inform one another" | College Board |
| **Character Difficult** | "Character assessment remains 'notoriously difficult to measure'" | Harvard Analysis |

---

## Quick Reference: What We're Building

```
Student Input (from Portfolio Scanner)
         ↓
┌─────────────────────────────────────────┐
│     PASS Evaluation Engines             │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  Academic   │  │  Activity   │      │
│  │  Evaluator  │  │  Analyzer   │      │ ← Sections 1.1-1.7
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   Award     │  │  Holistic   │      │ ← Sections 3, 5
│  │  Evaluator  │  │ Synthesizer │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ School Fit  │  │  Guidance   │      │ ← Phase 2, 4
│  │   Engine    │  │   Engine    │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
         ↓
Personalized Strategy Report
```

**Research powers the evaluation logic inside each engine.**

---

## Next Steps

### SECTIONS 1 & 3 COMPLETE ✅

1. **✅ COMPLETE:** Sections 1.1-1.7 (Extracurricular Activity Evaluation) fully integrated
2. **SKIPPED:** Section 2 (Recommendations) - students have limited control
3. **✅ COMPLETE:** Section 3.1 (Intellectual Curiosity) fully integrated
4. **✅ COMPLETE:** Section 3.2 (Resilience and Grit) fully integrated
5. **✅ COMPLETE:** Section 3.3 (Integrity and Ethics) fully integrated
6. **✅ COMPLETE:** Section 3.4 (Community Contribution) fully integrated
7. **✅ COMPLETE:** Section 3.5 (Leadership Potential) fully integrated
8. **✅ COMPLETE:** Section 3.6 (Self-Awareness and Maturity) fully integrated
9. **✅ COMPLETE:** Section 3.7 (Fit and Campus Contribution) fully integrated
10. **NEXT:** Section 4 (Red Flags), Section 5 (Holistic Process)
11. **FINALLY:** Claude Deep Research Pass → Build evaluation engines

### Gap Research Prompts (Optional - To Deepen Understanding)

Based on Section 1.7 analysis, the following areas could benefit from additional research:

**GAP 1: Field-Specific Portfolio Evaluation**
> "How do elite universities evaluate field-specific portfolios (arts, music, athletics, STEM research)? What are the specific criteria for each domain? How do specialized reviews integrate with holistic admissions?"

**GAP 2: Institutional "Endangered Species" Needs**
> "What specific 'niche' or 'endangered species' skills are most valued at elite universities? How do institutional needs (orchestra, sports teams, specific programs) influence admissions decisions?"

**GAP 3: Pay-to-Play Detection Methods**
> "How do admissions officers specifically detect pay-to-play programs vs legitimate opportunities? What verification methods exist? What programs are known to be authentic vs problematic?"

**GAP 4: International Student Activity Evaluation**
> "How do elite US universities evaluate extracurricular activities from international students? How are non-US competitions, awards, and activities contextualized?"

**GAP 5: Activity Description Optimization**
> "What are the most effective ways to describe extracurricular activities in the Common App 150-character limit? What language patterns do successful applicants use?"

These gaps can be addressed either through additional Perplexity prompts or during Sections 2-5 research (some overlap expected).

---

*Last Updated: January 2026*
*Status: SECTIONS 1 & 3 COMPLETE - Ready for Sections 4, 5 Research*
