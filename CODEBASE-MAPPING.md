# UPLIFT CODEBASE: NARRATIVE GRADER & ESSAY GENERATOR MAPPING REPORT

## EXECUTIVE SUMMARY

This report documents the complete architecture for evaluating and generating extracurricular narratives. The system is organized into three layers:

1. **Narrative Grader (Evaluation)** - Analyzes essays using 11-category rubric, authenticity detection, elite patterns, and literary sophistication
2. **Essay Generator (AI Generation)** - Creates elite-tier essays using narrative angles and iterative improvement
3. **Related Services (Integration)** - Workshop APIs, frontend services, and UI components

---

# PART 1: NARRATIVE GRADER SERVICES

## 1.1 Core Rubric Scorer (v1.0.1)

### File: `/src/core/essay/analysis/features/rubricScorer.ts`

**Purpose**: Implements rubric v1.0.1 with full interaction rule support for essay scoring.

**Key Functions**:
- `scoreWithRubric()` - Main entry point for scoring
- `calculateEQI()` - Convert weighted dimension scores to 0-100 scale
- `getImpressionLabel()` - Assign impression label based on EQI
- `detectFlags()` - Identify critical deficiencies
- `generatePrioritizedLevers()` - Suggest ranked improvements
- `applyInteractionRules()` - Apply conditional scoring rules

**Input Types**:
```typescript
interface DimensionRawScores {
  dimension_name: string;
  score: number (0-10);
  evidence: DimensionEvidence;
}

interface DimensionEvidence {
  quotes: string[];
  justification: string;
  anchors_met: number[];
}
```

**Output Type**:
```typescript
interface RubricScoringResult {
  rubric_version: string;
  dimension_scores: DimensionScoreResult[]; // 12 dimensions
  essay_quality_index: number; // 0-100
  impression_label: ImpressionLabel;
  flags: string[];
  prioritized_levers: string[];
  assessment: string;
}
```

**Dependencies**:
- `RUBRIC_V1_0_1` - Rubric definitions with 12 dimensions
- Feature detection modules for evidence gathering

**Key Features**:
- **Interaction Rules**: Conditional scoring rules (cap_max, boost, reduce)
- **Weighted Scoring**: Each dimension has a weight (0-1)
- **EQI Calculation**: Weighted average × 10 = 0-100 scale
- **Flag Detection**: AI-sounding patterns, bragging, missing scenes, weak voice
- **Priority Ranking**: Levers ordered by impact (weight × gap)

---

## 1.2 Category Scorer

### File: `/src/core/analysis/scoring/categoryScorer.ts`

**Purpose**: Scores individual rubric categories using Claude with extracted features and rubric definitions.

**Key Functions**:
- `scoreAllCategories()` - Score all 11 categories in parallel batches
- `scoreCategoryBatch()` - Score a group of related categories
- `scoreSingleCategory()` - Score one category (for deep dives)
- `validateCategoryScores()` - Ensure scores are valid

**Processing Strategy**:
```
CATEGORY_BATCHES = {
  text_focused: ['voice_integrity', 'craft_language_quality', 'specificity_evidence'],
  outcome_focused: ['transformative_impact', 'initiative_leadership', 'community_collaboration', 'role_clarity_ownership'],
  narrative_focused: ['narrative_arc_stakes', 'reflection_meaning', 'fit_trajectory', 'time_investment_consistency']
}
```

**Input Types**:
```typescript
ExperienceEntry + ExtractedFeatures + AuthenticityAnalysis
```

**Output Type**:
```typescript
interface RubricCategoryScore {
  name: string;
  score_0_to_10: number;
  evidence_snippets: string[];
  evaluator_notes: string;
  confidence: number (0-1);
}
```

**Dependencies**:
- `callClaudeWithRetry()` - LLM calls
- `RUBRIC_CATEGORIES_DEFINITIONS` - Category definitions with anchors
- Feature extraction results

**Scoring Calibration**:
- Resume bullets with no story: 1-2
- Facts + numbers, no emotion: 2-3
- Decent storytelling: 5-6
- Exceptional narrative + vulnerability: 7-8
- Near-perfect literary craft: 9-10 (top 1% essays)

---

## 1.3 Feature Detectors (Analysis Layer)

### 1.3.1 Authenticity Detector

**File**: `/src/core/analysis/features/authenticityDetector.ts`

**Purpose**: Identifies manufactured, essay-voice, or "trying too hard" content vs. genuine, conversational narratives.

**Key Function**:
- `analyzeAuthenticity()` - Analyze voice authenticity

**Output Type**:
```typescript
interface AuthenticityAnalysis {
  authenticity_score: number; // 0-10
  voice_type: 'conversational' | 'essay' | 'robotic' | 'natural';
  red_flags: string[]; // Manufactured phrases
  green_flags: string[]; // Authentic markers
  manufactured_signals: string[];
  authenticity_markers: string[];
  assessment: string;
}
```

**Manufactured Signals Detected**:
- Formulaic reflection: "I used to think", "In retrospect", "I came to realize"
- Essay-voice constructions: "This taught me that", "Through this I learned"
- Overly dramatic: "Changed my life", "Transformed who I am"
- SAT-word showing off: "Plethora", "Myriad", "Culmination"

**Authentic Voice Markers**:
- Questions and direct address
- Conversational starters: "No.", "Yes.", "But", "So"
- Contractions and casual grammar
- Personal pronouns and reflexive language

---

### 1.3.2 Elite Pattern Detector

**File**: `/src/core/analysis/features/elitePatternDetector.ts`

**Purpose**: Detects advanced narrative techniques from Harvard, Stanford, MIT, UC Berkeley, UCLA admitted students.

**Key Function**:
- `analyzeElitePatterns()` - Analyze presence of elite patterns

**Output Type**:
```typescript
interface ElitePatternAnalysis {
  overallScore: number; // 0-100
  tier: 1 | 2 | 3; // 1=Harvard/MIT, 2=Top UC, 3=Competitive
  
  vulnerability: { score: 0-10, hasPhysicalSymptoms, hasNamedEmotions, examples };
  dialogue: { score: 0-10, hasDialogue, isConversational, revealsCharacter, examples };
  communityTransformation: { score: 0-20, hasContrast, hasBefore, hasAfter };
  quantifiedImpact: { score: 0-10, hasMetrics, metrics, plausibilityScore };
  microToMacro: { score: 0-20, hasUniversalInsight, transcendsActivity };
  
  strengths: string[];
  gaps: string[];
}
```

**Elite Patterns Detected**:
1. **Vivid Opening** (specific time/place, sensory details, dialogue)
2. **Personal Stakes** (emotional fear, physical risk, time pressure, high stakes)
3. **Vulnerability** (physical symptoms, named emotions, before/after)
4. **Dialogue** (quoted conversation, character revelation)
5. **Community Transformation** (before state, change mechanism, after state)
6. **Quantified Impact** (specific metrics with plausibility check)
7. **Micro-to-Macro** (specific moment → universal insight)

---

### 1.3.3 Literary Sophistication Detector

**File**: `/src/core/analysis/features/literarySophisticationDetector.ts`

**Purpose**: Analyzes structural and stylistic literary elements.

**Output Type**:
```typescript
interface LiterarySophisticationAnalysis {
  overallScore: number; // 0-100
  tier: 1 | 2 | 3;
  
  extendedMetaphor: { score: 0-20, hasMetaphor, consistency, references };
  structuralInnovation: { score: 0-15, innovations, techniques };
  sentenceRhythm: { score: 0-15, hasVariety, veryShortCount, shortCount, longCount };
  sensoryImmersion: { score: 0-15, senseCount, senses, examples };
  activeVoice: { score: 0-10, dominance, passiveCount, activeCount };
  
  strengths: string[];
  improvements: string[];
}
```

**Literary Techniques Analyzed**:
- Extended metaphor (consistency across essay)
- Structural innovations (dual scenes, nonlinear, montage)
- Sentence variety (1-2 words, 3-5 words, 25+ words)
- Sensory immersion (touch, sound, sight, smell, taste)
- Active voice dominance

---

## 1.4 Analysis Engine (Orchestrator)

### File: `/src/core/analysis/engine.ts`

**Purpose**: Central orchestrator combining all feature detectors into comprehensive analysis report.

**Key Functions**:
- `analyzeEntry()` - Main entry point for complete analysis
- `scoreOpeningPower()` - Score dimension 1
- (Other dimension scoring functions...)

**Architecture**:
```
Input: Experience description
  ↓
Feature Detectors (parallel):
  - Scene detector
  - Dialogue extractor
  - Interiority detector
  - Elite pattern detector
  ↓
Rubric Scorer (with interaction rules)
  ↓
Output: Complete AnalysisReport with EQI, dimensions, flags, levers
```

---

# PART 2: ESSAY GENERATOR SERVICES

## 2.1 Essay Generator (Main)

### File: `/src/core/generation/essayGenerator.ts`

**Purpose**: Generates elite-level extracurricular narratives with iterative improvement loop.

**Key Functions**:
- `generateEssay()` - Main generation function with iteration loop
- `transformEssay()` - Transform weak essay to elite
- `buildGenerationPrompt()` - Construct detailed generation prompt
- `selectLiteraryTechniques()` - Choose techniques based on profile
- `selectOptimalAngle()` - Multi-stage angle validation

**GenerationProfile Input**:
```typescript
interface GenerationProfile {
  // Student context
  studentVoice: 'formal' | 'conversational' | 'quirky' | 'introspective';
  riskTolerance: 'low' | 'medium' | 'high';
  academicStrength: 'strong' | 'moderate' | 'weak';
  
  // Activity details
  activityType: 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy';
  role: string;
  duration: string;
  hoursPerWeek: number;
  
  // Content to work with
  achievements: string[];
  challenges: string[];
  relationships: string[];
  impact: string[];
  
  // Generation preferences
  targetTier: 1 | 2 | 3; // 1=Harvard, 2=Top UC, 3=UC-competitive
  literaryTechniques: string[];
  avoidClichés: boolean;
  narrativeAngle?: NarrativeAngle;
  generateAngle?: boolean;
}
```

**GenerationResult Output**:
```typescript
interface GenerationResult {
  essay: string;
  
  // Quality scores
  authenticityScore: number; // 0-10
  elitePatternsScore: number; // 0-100
  literarySophisticationScore: number; // 0-100
  combinedScore: number; // 0-100
  
  // Analysis details
  strengths: string[];
  gaps: string[];
  
  // Generation metadata
  iteration: number;
  techniquesUsed: string[];
  warningFlags: string[];
  narrativeAngle?: NarrativeAngle;
}
```

**Literary Techniques**:
1. **Extended Metaphor** (medium risk) - Central metaphor sustained throughout
2. **In Medias Res** (low risk) - Start in middle of dramatic action
3. **Dual Scene Parallelism** (low risk) - Two contrasting scenes
4. **Definition Opening** (medium risk) - Begin with term definition
5. **Philosophical Inquiry** (high risk) - Open with philosophical questions
6. **Montage Structure** (low risk) - Organize around object or moments
7. **Perspective Shift** (high risk) - Start in third person, reveal first person

**Generation Strategy**:
```
1. Select literary techniques based on:
   - Risk tolerance (high risk → sophisticated techniques)
   - Student voice (quirky → montage, introspective → extended metaphor)
   - Target tier (tier 1 → extended metaphor always included)

2. Generate initial essay with all requirements:
   - Vivid opening (sensory, dialogue, or specific time/place)
   - Vulnerability (named emotions, physical symptoms, before/after)
   - Dialogue (quoted conversation)
   - Community transformation (before/after contrast)
   - Quantified impact (specific metrics)
   - Universal insight (micro-to-macro)
   - Sentence variety (very short, short, long)
   - Sensory immersion (3+ senses)

3. Analyze generated essay:
   - Authenticity (0-10)
   - Elite patterns (0-100)
   - Literary sophistication (0-100)
   - Combined score = (auth/10)*20 + (elite/100)*40 + (literary/100)*40

4. Iterate if below target score:
   - Identify gaps from analysis
   - Regenerate with gap focus
   - Track best result
   - Exit on target reached or max iterations

Target Scores:
- Tier 1 (Harvard/MIT): 85+
- Tier 2 (Top UC): 75+
- Tier 3 (Competitive): 65+
```

**Dependencies**:
- `analyzeAuthenticity()`
- `analyzeElitePatterns()`
- `analyzeLiterarySophistication()`
- `generateNarrativeAngles()`
- `selectOptimalAngle()`
- `callClaudeWithRetry()`

---

## 2.2 Narrative Angle Generator

### File: `/src/core/generation/narrativeAngleGenerator.ts`

**Purpose**: Transforms ordinary experiences into unique, compelling narrative angles.

**Key Functions**:
- `generateNarrativeAngles()` - Generate 10+ unique angles
- `selectBestAngle()` - Select best angle from candidates
- `scoreAngle()` - Score angle on originality, risk alignment, impact

**NarrativeAngle Output**:
```typescript
interface NarrativeAngle {
  // Core concept
  title: string; // e.g., "The Bug as Oracle"
  hook: string; // Opening sentence (15-20 words)
  throughline: string; // Central idea unifying essay
  
  // Unique perspective
  unusualConnection: string; // What unexpected thing are you connecting?
  philosophicalDepth: string; // What universal truth does this reveal?
  freshMetaphor?: string; // Original metaphor (not clichéd)
  
  // Narrative structure
  openingScene: string; // Where to start
  turningPoint: string; // Moment of realization
  universalInsight: string; // How this applies beyond activity
  
  // Quality indicators
  originality: number; // 1-10
  riskLevel: 'safe' | 'moderate' | 'bold';
  expectedImpact: 'good' | 'excellent' | 'extraordinary';
}
```

**System Prompt Philosophy**:
- Avoid common tropes: "learned leadership", "overcame adversity", "found my passion"
- Look for LEAST obvious connection (robotics → philosophy, not robotics → engineering)
- Find philosophical depth (what does this reveal about human nature?)
- Make hook make readers think "Wait, WHAT?"

**Proven Success Archetypes** (from Session 18 research):
1. **The Awakening** (7/10 originality) - Observing someone → Personal realization → Changed trajectory
2. **The Visceral Truth** (7-8/10) - Shocking sensory experience → Deeper understanding → Philosophical insight
3. **The Systems Thinker** (8/10) - Multiple experiences → Unifying principle → Broader application
4. **Vulnerability as Strength** (7-8/10) - Personal struggle → Creative response → Helping others
5. **Failure → Growth** (7/10) - Dramatic failure → External support → Overcoming deeper fear
6. **Technical → Human Bridge** (7/10) - Technical work reveals human insight (BEST FOR STEM)

**Target Originality**: 7/10 (moderate risk - optimal balance of memorable + authentic)

**Critical Requirements**:
- Start with specific visualizable moment (not abstract concept)
- Include sensory detail potential
- Show external catalyst (person, event, observation - not pure introspection)
- Bridge concrete experience → universal insight clearly
- Use grounded verbs (build, debug, create, fix) NOT abstract nouns (curator, oracle, conspiracy)

---

## 2.3 Angle Quality Validator

### File: `/src/core/generation/angleQualityValidator.ts`

**Purpose**: Comprehensive validation system for narrative angle quality based on Session 18 findings.

**Key Functions**:
- `validateAndRankAngles()` - Score and rank all angles
- `selectBestValidatedAngle()` - Choose best with detailed reporting
- (Various scoring functions for quality dimensions)

**AngleQualityScore Output**:
```typescript
interface AngleQualityScore {
  angle: NarrativeAngle;
  
  // Overall quality (0-100)
  overallQuality: number;
  
  // Dimensional scores
  groundingScore: number;        // 0-100: Concrete vs abstract
  bridgeScore: number;           // 0-100: Technical-human connection
  authenticityPotential: number; // 0-100: Predicted authenticity score
  implementabilityScore: number; // 0-100: How easy to execute well
  
  // Flags and recommendations
  redFlags: string[];            // Deal-breakers
  warnings: string[];            // Concerns
  strengths: string[];           // What makes it good
  recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'avoid';
  confidence: number;            // 0-1
}
```

**Grounded Keywords** (high quality):
```
Actions: build, debug, code, create, fix, design, construct, measure, test, prototype
Objects: vision, system, circuit, sensor, tool, robot, machine, code, algorithm
Human: guide, conversation, page, document, team, people, friend, mentor, collaboration
Results: working, functional, operational, running, successful, complete, deployed
```

**Abstract Keywords** (risky):
```
Mystical: oracle, prophecy, spiritual, sacred, reverence, divine, transcendent
Poetic: cartography, territories, invisible, ephemeral, gossamer, luminous
Concepts: conspiracy, curator, alchemy, archaeology, mythology, symphony, tapestry
Jargon: paradigm, dialectic, ontological, phenomenological, hermeneutic
```

**Session 18 Findings**:
- **7/10 originality > 8/10 > 9/10** - Moderate risk sweet spot
- **Grounded > Abstract** - Use concrete technical terms (build, debug, vision, system)
- **Bridge Technical + Human** - Connect technical work to human insight explicitly
- **Authenticity Matters Most** - Students must be able to tell story genuinely

---

# PART 3: RELATED SERVICES

## 3.1 Workshop Analysis Service

### File: `/src/services/workshopAnalysisService.ts`

**Purpose**: Bridges frontend ExtracurricularWorkshop with backend analysis engine.

**Key Function**:
- `analyzeExtracurricularEntry()` - Main analysis function

**Input Transformation**:
- ExtracurricularItem → ExperienceEntry (backend format)
- Extracts achievements, challenges, relationships, impact

**Output Type**:
```typescript
interface AnalysisResult {
  analysis: {
    id: string;
    entry_id: string;
    rubric_version: string;
    created_at: string;
    categories: CategoryScore[];
    weights: Record<string, number>;
    narrative_quality_index: number;
    reader_impression_label: string;
    flags: string[];
    suggested_fixes_ranked: string[];
    analysis_depth: 'quick' | 'standard' | 'comprehensive';
  };
  
  authenticity: {
    authenticity_score: number;
    voice_type: 'conversational' | 'essay' | 'robotic' | 'natural';
    red_flags: string[];
    green_flags: string[];
    manufactured_signals: string[];
    authenticity_markers: string[];
    assessment: string;
  };
  
  elite_patterns: ElitePatternAnalysis;
  literary_sophistication: LiterarySophisticationAnalysis;
  
  coaching?: {
    prioritized_issues: CoachingIssue[];
    quick_wins: QuickWin[];
    strategic_guidance: StrategicGuidance;
  };
}
```

**Features**:
- Runs elite pattern detection locally
- Runs literary sophistication detection locally
- Calls backend API for rubric analysis
- Maps category names to frontend keys
- Extracts suggestions from evaluator notes
- Returns comprehensive analysis result

**Dependencies**:
- Backend: `/api/analyze-entry`
- Local detectors: `analyzeElitePatterns()`, `analyzeLiterarySophistication()`

---

## 3.2 Extracurricular Analysis Service

### File: `/src/services/extracurricularAnalysis.ts`

**Purpose**: API service for calling backend analysis engine.

**Key Function**:
- `analyzeExtracurricular()` - Call backend API (30s timeout)
- `analyzeExtracurricularDirect()` - Direct import for server-side usage
- `analyzeExtracurricularEntry` - Smart routing based on environment

**API Endpoint**:
```
POST /api/analyze-entry
Body: { entry: ExperienceEntry, options: { depth, skip_coaching } }
Response: AnalysisResponse { report, authenticity, coaching, performance }
```

**Configuration**:
- API Base URL: `/api` (proxied by Vite in dev)
- Timeout: 30 seconds to avoid UI hangs
- Production: Same-origin requests

---

## 3.3 Workshop API Layer

### File: `/src/components/portfolio/extracurricular/workshop/workshopApi.ts`

**Purpose**: Complete typed interface to all backend analysis and generation services.

**Key Functions**:
```typescript
// Analysis
- analyzeEntry() - Full 11-category rubric analysis + coaching
- checkApiHealth() - Check if API is available

// Narrative Angle Generation
- generateNarrativeAngles() - Create 10+ unique angles (Session 18 system)

// Essay Generation
- generateEssay() - AI-assisted essay generation with iteration

// Iterative Improvement
- iterativeImprovement() - Multi-iteration refinement loop

// Helper
- buildGenerationProfile() - Create profile from ExtracurricularItem
- extractAchievements(), extractChallenges(), extractRelationships(), extractImpact()
```

**Error Handling**:
```typescript
class WorkshopApiError extends Error {
  code: string; // HTTP_400, ANALYSIS_FAILED, NETWORK_ERROR, etc.
  details?: any;
}
```

**Retry Strategy**:
- Exponential backoff: start 1s, double on each retry
- 2 retries maximum
- Per-function timeout: 60-180 seconds depending on operation

**API Endpoints**:
```
POST /api/analyze-entry - Analysis with 11 categories
POST /api/generate-narrative-angles - Generate 10+ angles
POST /api/generate-essay - Generate essay with iteration
POST /api/iterative-improvement - Multi-iteration loop
GET /api/health - Health check
```

---

## 3.4 Workshop UI Components

### Component: ExtracurricularWorkshop

**File**: `/src/components/portfolio/extracurricular/workshop/ExtracurricularWorkshop.tsx`

**Purpose**: Main workshop interface for extracurricular narratives.

**Key Features**:
- Draft editor for description input
- Real-time analysis with NQI display
- Category scoring dashboard
- Coaching issues with actionable suggestions
- Narrative angle generation and selection
- Essay generation with iteration tracking
- Version history and comparison

**Related Components**:
- `OverallScoreCard` - Displays NQI and impression
- `RubricDimensionCard` - Shows individual category scores
- `IssueCard` - Coaching issues with fixes
- `DraftEditor` - Text input for description
- `VersionHistory` - Track changes across iterations
- `WorkshopComplete` - Completion state

---

## 3.5 Extracurricular Data Models

### File: `/src/core/types/experience.ts`

**Core Types**:
```typescript
ExperienceEntry {
  id: string (UUID);
  user_id: string;
  created_at, updated_at: string (ISO datetime);
  
  // Core content
  title: string (1-100 chars);
  organization?: string;
  role?: string;
  description_original: string (50-700 chars);
  
  // Time commitment
  time_span?: string;
  start_date?, end_date?: string;
  hours_per_week?: number (0-168);
  weeks_per_year?: number (0-52);
  
  // Categorization
  category: 'leadership' | 'service' | 'research' | 'athletics' | 'arts' | 'academic' | 'work';
  tags?: string[];
  
  // Context
  constraints_context?: string;
  version: number;
}

RubricCategoryScore {
  name: string;
  score_0_to_10: number;
  evidence_snippets: string[];
  evaluator_notes: string;
  confidence?: number (0-1);
}

AnalysisReport {
  id?: string;
  entry_id: string;
  rubric_version: string;
  created_at?: string;
  
  categories: RubricCategoryScore[];
  weights: Record<string, number>;
  
  narrative_quality_index: number (0-100);
  reader_impression_label: 'captivating_grounded' | 'strong_distinct_voice' | 'solid_needs_polish' | 'patchy_narrative' | 'generic_unclear';
  
  flags: string[];
  suggested_fixes_ranked: string[];
  analysis_depth?: 'quick' | 'standard' | 'comprehensive';
}
```

---

# PART 4: INTEGRATION POINTS

## 4.1 Analysis Pipeline

```
User Input: Extracurricular Description
  ↓
workshopAnalysisService.analyzeExtracurricularEntry()
  ↓
Transform to ExperienceEntry
  ↓
Call Backend API: /api/analyze-entry
  ↓
Backend Analysis Engine:
  1. Extract features (authent, elite patterns, literary)
  2. Score categories (11-category rubric)
  3. Apply interaction rules
  4. Calculate NQI
  5. Detect flags and generate levers
  ↓
Frontend transformation:
  - Map category names to keys
  - Extract suggestions from notes
  - Combine with local detectors
  ↓
Return AnalysisResult to UI components
```

## 4.2 Generation Pipeline

```
User Input: GenerationProfile + Optional NarrativeAngle
  ↓
generateEssay(profile, maxIterations = 3)
  ↓
If angle needed:
  1. generateNarrativeAngles(profile, numAngles = 10)
  2. validateAndRankAngles() → quality scores
  3. selectOptimalAngle() → best angle
  ↓
For each iteration:
  1. selectLiteraryTechniques(profile)
  2. buildGenerationPrompt(profile, techniques, angle)
  3. callClaudeWithRetry() → generate essay
  4. analyzeAuthenticity()
  5. analyzeElitePatterns()
  6. analyzeLiterarySophistication()
  7. combinedScore = (auth/10)*20 + (elite/100)*40 + (literary/100)*40
  ↓
If combinedScore >= targetScore or iteration >= maxIterations:
  Return GenerationResult
Else:
  Continue iteration with gaps focus
```

## 4.3 Current Usage in Application

### Where Grader is Used:
1. **ExtracurricularWorkshop** - Real-time analysis as user types
2. **Dashboard Cards** - Display NQI and category scores
3. **Coaching Issues** - Prioritized improvements based on analysis
4. **Comparison View** - Show before/after analysis

### Where Generator is Used:
1. **Workshop Angle Tab** - Generate and select narrative angles
2. **Essay Generation Modal** - AI-assisted essay creation
3. **Iterative Improvement** - Multi-iteration refinement with tracking
4. **Version History** - Compare generated versions

---

# PART 5: KEY TECHNICAL CHARACTERISTICS

## 5.1 Scoring Logic

**NQI Calculation**:
```
NQI = Σ(final_dimension_score × dimension_weight) × 10
     (Each dimension scored 0-10, weights sum to 1)
     Final NQI: 0-100
```

**Combined Generation Score**:
```
Combined = (authenticity_score/10) × 20% +
           (elite_patterns_score/100) × 40% +
           (literary_sophistication_score/100) × 40%
Final: 0-100
```

## 5.2 State Management

**Frontend State**:
- Selected activity
- Description text
- Analysis result (NQI, categories, coaching)
- Generated narrative angles
- Selected angle
- Generated essay versions
- Version history

**Backend State**:
- Entry metadata (id, timestamps, category)
- Analysis report (cached)
- LLM token usage
- Performance metrics

## 5.3 Error Handling

**Analysis Errors**:
- Server not reachable: Fast-fail with helpful message
- Analysis timeout: 30-second timeout
- API errors: Transform to user-friendly messages

**Generation Errors**:
- LLM call failures: Retry with exponential backoff
- Angle generation failures: Fallback to default angles
- Essay generation: Return best result from iterations

## 5.4 Performance Optimizations

**Caching**:
- System prompts cached in LLM calls
- Category batches executed in parallel (3 batches)
- Feature detection runs locally (not API calls)

**Timeouts**:
- Analysis: 30 seconds (avoid UI hangs)
- Essay generation: 120 seconds
- Iterative improvement: 180 seconds

---

# PART 6: CONFIGURATION & CONSTANTS

## Literary Techniques Mapping

```typescript
{
  extendedMetaphor: { risk: 'medium', bestFor: ['introspective', 'conversational'] },
  inMediasRes: { risk: 'low', bestFor: ['conversational', 'quirky'] },
  dualScene: { risk: 'low', bestFor: ['all'] },
  definitionOpening: { risk: 'medium', bestFor: ['formal', 'introspective'] },
  philosophicalInquiry: { risk: 'high', bestFor: ['introspective', 'formal'] },
  montageStructure: { risk: 'low', bestFor: ['conversational', 'quirky'] },
  perspectiveShift: { risk: 'high', bestFor: ['quirky', 'conversational'] },
}
```

## Voice Types

```typescript
'formal' → Sophisticated but not pretentious, elevated vocabulary where natural
'conversational' → Parentheticals, rhetorical questions, informal asides
'quirky' → Humor, unexpected phrasing, personality
'introspective' → Internal monologue, reflection, contemplative tone
```

## Target Tiers

```
Tier 1: Harvard, Stanford, MIT (target score: 85+)
Tier 2: Top UC (Berkeley, UCLA) (target score: 75+)
Tier 3: UCLA/Competitive (target score: 65+)
```

---

