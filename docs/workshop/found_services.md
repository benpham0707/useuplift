# Phase 0: Service Discovery & Mapping Report

**Date**: 2025-11-11
**Status**: ✅ Discovery Complete
**Next Phase**: Adapter Design & UX Architecture

---

## Executive Summary

Successfully discovered all required services for the Extracurricular Narrative Workshop. The existing system has:
- ✅ **Comprehensive Analysis Engine** (Narrative Grader) with 11-dimension rubric
- ✅ **Essay Generation System** with literary techniques and angle generation
- ✅ **Issue Detection & Coaching** with structured feedback
- ✅ **Frontend Workshop Components** (partially implemented)

**Key Finding**: The existing infrastructure is robust and well-architected. We can integrate cleanly without major refactoring.

---

## 1. Narrative Grader (Analysis Engine)

### Location
- **Primary**: `src/core/analysis/engine.ts`
- **Issue Detector**: `src/core/analysis/coaching/issueDetector.ts`
- **Coaching Generator**: `src/core/analysis/coaching/index.ts`
- **Feature Extraction**: `src/core/analysis/features/extractor.ts`
- **Authenticity Detector**: `src/core/analysis/features/authenticityDetector.ts`

### Exported Interfaces

#### Main Entry Point
```typescript
// src/core/analysis/engine.ts
export async function analyzeEntry(
  entry: ExperienceEntry,
  options: AnalysisOptions = { depth: 'standard' }
): Promise<AnalysisResult>

interface AnalysisResult {
  report: AnalysisReport;              // Scores, NQI, flags, suggested fixes
  features: ExtractedFeatures;         // Voice, evidence, arc, etc.
  authenticity: AuthenticityAnalysis;  // Voice type, red/green flags
  coaching?: CoachingOutput;           // Issue detection (optional)
  performance: PerformanceMetrics;
}
```

#### Analysis Report Structure
```typescript
interface AnalysisReport {
  narrative_quality_index: number;     // 0-100 overall score
  reader_impression_label: string;     // 'captivating_grounded' | 'strong_distinct_voice' | ...
  categories: RubricCategoryScore[];   // 11 dimensions, each 0-10
  flags: string[];                     // Diagnostic flags (e.g., 'no_metrics', 'essay_voice_detected')
  suggested_fixes_ranked: string[];    // Top 3-5 improvement suggestions
}
```

#### Coaching Output Structure
```typescript
interface CoachingOutput {
  overall: {
    narrative_quality_index: number;
    score_tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
    total_issues: number;
    quick_summary: string;
  };
  categories: CategoryIssues[];       // Issues organized by rubric category
  top_priorities: Array<{             // Top 3 most impactful fixes
    category: string;
    issue_title: string;
    impact: string;
  }>;
}
```

#### Issue Detection Structure
```typescript
interface DetectedIssue {
  id: string;
  category: string;                   // Maps to rubric category
  severity: 'critical' | 'important' | 'helpful';

  // UI display
  title: string;
  from_draft: string;                 // Quote from their text

  // Explanation
  problem: string;                    // "The Problem"
  why_matters: string;                // "Why It Matters"

  // Fix suggestions (paginated in UI)
  suggested_fixes: SuggestedFix[];
}

interface SuggestedFix {
  fix_text: string;                   // The actual fix/rewrite
  why_this_works: string;             // Explanation
  teaching_example?: string;          // Optional: example from different context
  apply_type: 'replace' | 'add' | 'reframe' | 'elicit';
}
```

### Key Capabilities
- ✅ 11-dimension rubric scoring (Voice, Specificity, Reflection, etc.)
- ✅ NQI calculation (0-100 narrative quality index)
- ✅ Authenticity detection with red/green flags
- ✅ Issue detection with severity classification
- ✅ Multi-fix suggestions per issue (2-3 different approaches)
- ✅ Teaching examples included in some fixes
- ✅ Adaptive weights by activity category

### Quality Metrics
- **Coverage**: 11 dimensions across voice, evidence, arc, collaboration, reflection
- **Issue Detection**: 6 major categories (Voice, Specificity, Reflection, Narrative, Initiative, Collaboration)
- **Fix Suggestions**: 2-3 different strategies per issue
- **Examples**: Teaching examples for clarity (partially implemented)

---

## 2. Essay Generator

### Location
- **Primary**: `src/core/generation/essayGenerator.ts`
- **Angle Generator**: `src/core/generation/narrativeAngleGenerator.ts`
- **Angle Validator**: `src/core/generation/angleQualityValidator.ts`

### Exported Interfaces

#### Main Entry Point
```typescript
// src/core/generation/essayGenerator.ts
export async function generateEssay(
  profile: GenerationProfile,
  maxIterations: number = 3
): Promise<GenerationResult>

export async function transformEssay(
  weakEssay: string,
  profile: GenerationProfile
): Promise<GenerationResult>
```

#### Generation Profile
```typescript
interface GenerationProfile {
  // Student info
  studentVoice: 'formal' | 'conversational' | 'quirky' | 'introspective';
  riskTolerance: 'low' | 'medium' | 'high';
  academicStrength: 'strong' | 'moderate' | 'weak';

  // Activity details
  activityType: 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy';
  role: string;
  duration: string;
  hoursPerWeek: number;

  // Content
  achievements: string[];
  challenges: string[];
  relationships: string[];
  impact: string[];

  // Generation preferences
  targetTier: 1 | 2 | 3;               // 1=Harvard, 2=Top UC, 3=UC-competitive
  literaryTechniques: string[];
  avoidClichés: boolean;

  // Narrative angle (optional)
  narrativeAngle?: NarrativeAngle;
  generateAngle?: boolean;
}
```

#### Narrative Angle Generation
```typescript
// src/core/generation/narrativeAngleGenerator.ts
export async function generateNarrativeAngles(
  options: AngleGenerationOptions
): Promise<NarrativeAngle[]>

interface NarrativeAngle {
  title: string;                       // e.g., "The Bug as Teacher"
  hook: string;                        // Opening sentence
  throughline: string;                 // Central idea
  unusualConnection: string;           // What unexpected thing are you connecting?
  philosophicalDepth: string;          // Universal truth revealed
  freshMetaphor?: string;              // Original metaphor
  openingScene: string;
  turningPoint: string;
  universalInsight: string;
  originality: number;                 // 1-10
  riskLevel: 'safe' | 'moderate' | 'bold';
  expectedImpact: 'good' | 'excellent' | 'extraordinary';
}
```

### Key Capabilities
- ✅ Iterative generation (generate → analyze → refine loop)
- ✅ Literary technique selection (extended metaphor, perspective shift, etc.)
- ✅ Narrative angle generation (10+ unique angles per activity)
- ✅ Angle quality validation with grounding/authenticity checks
- ✅ Voice adaptation (conversational, formal, quirky, introspective)
- ✅ Target tier customization (Ivy/Top UC/Competitive)
- ✅ Weak → Elite transformation

---

## 3. Frontend Service (API Integration)

### Location
- **Primary**: `src/services/extracurricularAnalysis.ts`

### Exported Interfaces
```typescript
export async function analyzeExtracurricular(
  entry: ExperienceEntry,
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
  } = {}
): Promise<AnalysisResponse>

interface AnalysisResponse {
  report: {
    narrative_quality_index: number;
    reader_impression_label: string;
    categories: RubricCategoryScore[];
    flags: string[];
    suggested_fixes_ranked: string[];
  };
  authenticity: {
    authenticity_score: number;
    voice_type: string;
    red_flags: string[];
    green_flags: string[];
  };
  coaching?: CoachingOutput;
  performance: { total_ms: number };
}
```

### Key Features
- ✅ HTTP API integration (via `/api/analyze-entry`)
- ✅ Timeout handling (30s)
- ✅ Error handling with fallbacks
- ✅ Direct import fallback for development

---

## 4. Existing Workshop Components

### Location
- **Unified Workshop**: `src/components/portfolio/extracurricular/workshop/ExtracurricularWorkshopUnified.tsx`
- **Workshop (older)**: `src/components/portfolio/extracurricular/workshop/ExtracurricularWorkshop.tsx`
- **Workshop New**: `src/components/portfolio/extracurricular/workshop/ExtracurricularWorkshopNew.tsx`

### Current State
- ⚠️ **Multiple versions exist** (suggests ongoing iteration)
- ✅ Basic structure in place (draft versions, dimensions, issues)
- ⚠️ **Gap**: No teaching examples or pedagogical flow implemented
- ⚠️ **Gap**: No guided exploration/reflection prompts
- ⚠️ **Gap**: No generator integration for rewrite suggestions
- ⚠️ **Gap**: No before/after examples or learning summaries

### Existing Types
```typescript
// src/components/portfolio/extracurricular/workshop/types.ts
interface WritingIssue {
  id: string;
  dimensionId: string;
  title: string;
  excerpt: string;
  analysis: string;
  impact: string;
  suggestions: EditSuggestion[];
  status: 'not_fixed' | 'in_progress' | 'fixed';
  currentSuggestionIndex: number;
  expanded: boolean;
}

interface RubricDimension {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  status: 'critical' | 'needs_work' | 'good' | 'excellent';
  overview: string;
  weight: number;
  issues: WritingIssue[];
}
```

---

## 5. Data Models & Types

### Location
- **Core Types**: `src/core/types/experience.ts`
- **Workshop Types**: `src/components/portfolio/extracurricular/workshop/types.ts`

### Key Schemas
```typescript
// Experience Entry
interface ExperienceEntry {
  id: string;
  title: string;
  description_original: string;
  category: 'leadership' | 'service' | 'research' | 'athletics' | 'arts' | 'academic' | 'work';
  hours_per_week?: number;
  weeks_per_year?: number;
  // ... other fields
}

// Rubric Categories (11 dimensions)
type RubricCategory =
  | 'voice_integrity'
  | 'specificity_evidence'
  | 'transformative_impact'
  | 'role_clarity_ownership'
  | 'narrative_arc_stakes'
  | 'initiative_leadership'
  | 'community_collaboration'
  | 'reflection_meaning'
  | 'craft_language_quality'
  | 'fit_trajectory'
  | 'time_investment_consistency';
```

---

## 6. Proposed Adapter Interfaces

To enable clean integration without modifying core services, we propose the following adapter layer:

### 6.1 Workshop Analyzer Adapter
```typescript
// Location: src/services/workshop/adapters/analyzerAdapter.ts

export interface WorkshopAnalysisInput {
  entry: ExperienceEntry;
  depth?: 'quick' | 'standard' | 'comprehensive';
}

export interface WorkshopAnalysisOutput {
  overallScore: number;                  // NQI 0-100
  scoreTier: string;                     // 'excellent' | 'strong' | ...

  issues: WorkshopIssue[];               // Prioritized, max 3-5
  dimensions: DimensionScore[];          // All 11 dimensions

  teachingExamples: TeachingExample[];   // Human-written examples per issue
  reflectionPrompts: ReflectionPrompt[]; // Adaptive guided questions
}

export async function analyzeForWorkshop(
  input: WorkshopAnalysisInput
): Promise<WorkshopAnalysisOutput> {
  // 1. Call existing analyzeEntry()
  // 2. Transform to workshop-friendly format
  // 3. Attach teaching examples
  // 4. Generate reflection prompts
  // 5. Return structured output
}
```

### 6.2 Workshop Generator Adapter
```typescript
// Location: src/services/workshop/adapters/generatorAdapter.ts

export interface RewriteRequest {
  originalText: string;
  issueId: string;
  selectedFix: string;
  userReflections?: Record<string, string>; // Answers to prompts
  profile: Partial<GenerationProfile>;
}

export interface RewriteOutput {
  candidates: Array<{
    text: string;
    rationale: string;
    estimatedScoreGain: number;
    literaryTechniques: string[];
  }>;
  comparisonView: {
    before: string;
    after: string;
    highlightedChanges: Change[];
  };
}

export async function generateRewriteCandidates(
  request: RewriteRequest
): Promise<RewriteOutput> {
  // 1. Build GenerationProfile from request
  // 2. Call generateEssay() or transformEssay()
  // 3. Generate 2-3 variants
  // 4. Create comparison view
  // 5. Return structured candidates
}
```

### 6.3 Teaching Example Manager
```typescript
// Location: src/services/workshop/teachingExamples.ts

export interface TeachingExample {
  issueType: string;                     // Maps to DetectedIssue.id pattern
  weakExample: string;
  strongExample: string;
  explanation: string;
  diffHighlights: string[];              // What changed?
  applicableCategories: string[];        // Which activity types?
}

export class TeachingExampleManager {
  // Seed with human-written examples
  private examples: Map<string, TeachingExample[]>;

  getExamplesForIssue(issueId: string): TeachingExample[];
  addExample(example: TeachingExample): void;
  markForHumanReview(syntheticExample: TeachingExample): void;
}
```

### 6.4 Reflection Prompt Generator
```typescript
// Location: src/services/workshop/reflectionPrompts.ts

export interface ReflectionPrompt {
  id: string;
  issueId: string;
  question: string;
  purpose: string;                       // Why we're asking this
  expectedLength: 'short' | 'medium';    // 1-2 sentences vs 3-4
}

export function generateReflectionPrompts(
  issue: DetectedIssue,
  entry: ExperienceEntry,
  count: number = 3
): ReflectionPrompt[] {
  // Adaptive: based on issue type and entry content
  // Examples:
  // - "Who specifically benefited from this action and how?"
  // - "What was the hardest part of this work?"
  // - "What concrete outcome can you point to?"
}
```

---

## 7. Integration Plan

### Phase 1: Core Adapters (Week 1)
1. ✅ Create `analyzerAdapter.ts` wrapping existing `analyzeEntry()`
2. ✅ Create `generatorAdapter.ts` wrapping existing `generateEssay()`
3. ✅ Seed `teachingExamples.ts` with 20-30 human-written examples
4. ✅ Implement `reflectionPrompts.ts` with adaptive logic
5. ✅ Write unit tests for all adapters (mocked dependencies)

### Phase 2: Workshop UI (Week 2)
1. ✅ Build Teaching Unit component (issue → explanation → examples → fixes)
2. ✅ Build Reflection Panel component (3 adaptive questions)
3. ✅ Build Rewrite Assist component (inline hints + generator integration)
4. ✅ Build Delta Visualization component (before/after with scores)
5. ✅ Integration tests with real API calls

### Phase 3: Iteration & Testing (Week 3)
1. ✅ Run golden test suite (200+ seed entries)
2. ✅ Human eval pipeline (N≥30 outputs, 80% accept rate)
3. ✅ Performance optimization (latency < 5s per analysis)
4. ✅ Hardening & edge case handling
5. ✅ Final staging deployment

---

## 8. Gaps & Decisions Required

### Gap 1: Teaching Example Corpus
- **Status**: ⚠️ Not yet created
- **Requirement**: 20-30 human-written weak→strong pairs
- **Decision Needed**: Who writes/reviews these? Use existing student work?
- **Recommendation**: Start with 10 core examples (voice, metrics, reflection) and expand iteratively

### Gap 2: Reflection Prompt Logic
- **Status**: ⚠️ Not implemented
- **Requirement**: Adaptive questions based on issue type + entry content
- **Decision Needed**: Rule-based or LLM-generated? Balance cost vs. quality
- **Recommendation**: Rule-based templates with LLM fill-in for context-specific details

### Gap 3: Generator Constraints
- **Status**: ⚠️ Needs tuning
- **Requirement**: Prevent generator from inventing false details (names, numbers, events)
- **Decision Needed**: How strict? Mark synthetic additions for human review?
- **Recommendation**: Generator should ONLY rearrange/rephrase existing facts; flag any new claims as "needs verification"

### Gap 4: Workshop Versioning Strategy
- **Status**: ⚠️ Multiple workshop components exist
- **Decision Needed**: Consolidate or deprecate older versions?
- **Recommendation**: Use `ExtracurricularWorkshopUnified.tsx` as base, deprecate others

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Generator invents false details | High | Constrain prompts; mark synthetic additions; human review queue |
| Teaching examples feel generic | Medium | Start with human-written corpus; A/B test synthetic vs human |
| Reflection prompts don't adapt | Medium | Implement rule-based logic; monitor user engagement metrics |
| Integration breaks existing features | Low | Adapters decouple new code; comprehensive test coverage |
| Performance degrades (>5s latency) | Medium | Cache analysis results; optimize LLM calls; parallel processing |

---

## 10. Success Metrics (Phase 0 → Phase 3)

### Quality Metrics
- [ ] Teaching examples: 80%+ human reviewer acceptance rate
- [ ] Reflection prompts: 70%+ user completion rate (users answer ≥2/3 questions)
- [ ] Generator candidates: 80%+ acceptance rate (users keep ≥1 candidate)
- [ ] Overall improvement: +10 NQI average gain per session

### Technical Metrics
- [ ] Test coverage: ≥90% for adapter layer
- [ ] Latency: <5s for analysis + teaching examples
- [ ] Error rate: <1% (graceful degradation on failures)
- [ ] Human eval agreement: κ ≥ 0.6 (inter-rater reliability)

---

## 11. Human Checkpoint — Approve to Proceed

### Deliverables Complete ✅
- [x] Service discovery mapping
- [x] Interface documentation
- [x] Adapter contract proposals
- [x] Integration plan (3 phases)
- [x] Risk assessment
- [x] Success metrics

### Questions for Human Review
1. **Teaching Examples**: Should we start with 10 core examples or wait for 30?
2. **Reflection Prompts**: Rule-based templates or LLM-generated?
3. **Generator Constraints**: How strict on preventing false details?
4. **Workshop Versioning**: Consolidate to `ExtracurricularWorkshopUnified.tsx`?

### Ready to Proceed?
- **Next Phase**: Implement adapter interfaces + seed teaching examples
- **ETA**: Phase 1 complete in 3-5 days (with tests)

---

**Prepared by**: Claude Code
**Review Status**: ⏳ Awaiting Human Approval
**Next Action**: Proceed to Phase 1 implementation upon sign-off
