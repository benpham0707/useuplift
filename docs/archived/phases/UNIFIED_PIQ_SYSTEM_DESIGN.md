# Unified PIQ Analysis System - Design Document

**Date**: 2025-11-14
**Goal**: Create world-class unified analysis system that works for ALL PIQs (activities, personal narratives, academic subjects, creative expressions, etc.)
**Approach**: Merge best of extracurricular analysis + essay analysis + enhance with broader understanding

---

## 🎯 VISION

### Create ONE Unified Service That:
1. **Analyzes ALL PIQ types** (all 8 UC prompts + extracurricular narratives)
2. **Adapts intelligently** based on content type detected
3. **Takes best from both systems**:
   - Activity rubric (11 dimensions) for leadership/impact focus
   - Essay rubric (12 dimensions) for narrative/reflection focus
   - Elite pattern detection (Harvard/Berkeley patterns)
   - Literary sophistication (10 advanced techniques)
   - Scene/dialogue/interiority detection
4. **Deepens understanding** beyond both current systems
5. **Maintains specialized tool** for pure activity analysis (existing system)

---

## 📊 CURRENT STATE ANALYSIS

### System 1: Extracurricular Analysis (11-dimension)
**Strengths**:
- ✅ Activity-specific dimensions (Initiative, Leadership, Time Investment)
- ✅ Community transformation focus
- ✅ Role clarity emphasis
- ✅ Quantified impact scoring
- ✅ Authenticity detection (100% accuracy)

**Limitations**:
- ❌ Misses narrative elements (scene, dialogue)
- ❌ Weak interiority detection
- ❌ No prompt-specific guidance
- ❌ Activity-centric (not broad enough)

### System 2: Essay Analysis (12-dimension)
**Strengths**:
- ✅ Narrative-focused dimensions (Scene Entry, Interiority, Vulnerability)
- ✅ Scene/dialogue/interiority detection
- ✅ Philosophical depth emphasis
- ✅ Training on 19 exemplar essays
- ✅ Interaction rules (dimension dependencies)

**Limitations**:
- ❌ Misses activity-specific elements (leadership, initiative)
- ❌ Less focus on community impact
- ❌ No time investment tracking
- ❌ Generic for all essays (not prompt-aware)

---

## 🌟 UNIFIED SYSTEM DESIGN

### The "Best of Both Worlds" Approach

**Core Insight**: Different PIQ types need different analytical lenses, but share common narrative elements.

### Architecture: Adaptive Multi-Lens Analysis

```
PIQ Input
    ↓
Content Type Detection (auto-detect or explicit)
├── Activity/Leadership focus?
├── Personal narrative focus?
├── Academic subject focus?
├── Creative expression focus?
└── Challenge/adversity focus?
    ↓
Unified Analysis Engine
├── LAYER 1: Universal Features (ALL PIQs)
│   ├── Scene Detection (temporal/spatial/sensory)
│   ├── Dialogue Extraction (quoted speech)
│   ├── Interiority Detection (emotion, vulnerability, inner debate)
│   ├── Authenticity Detection (manufactured vs genuine voice)
│   ├── Elite Pattern Detection (7 patterns)
│   └── Literary Sophistication (10 techniques)
│
├── LAYER 2: Adaptive Rubric (Smart Weighting)
│   ├── Core Dimensions (ALL PIQs): 8 dimensions
│   │   ├── Voice Authenticity & Specificity
│   │   ├── Narrative Arc & Stakes
│   │   ├── Vulnerability & Interiority
│   │   ├── Reflection & Meaning-Making
│   │   ├── Show-Don't-Tell Craft
│   │   ├── Intellectual Engagement
│   │   ├── Community Impact & Transformation
│   │   └── Context & Background Disclosure
│   │
│   ├── Activity-Enhanced Dimensions (when detected):
│   │   ├── Initiative & Leadership (weight↑)
│   │   ├── Role Clarity & Ownership (weight↑)
│   │   ├── Time Investment & Consistency (weight↑)
│   │   └── Quantified Impact (weight↑)
│   │
│   └── Narrative-Enhanced Dimensions (when detected):
│       ├── Opening Power & Scene Entry (weight↑)
│       ├── Character Development (weight↑)
│       ├── Philosophical Depth (weight↑)
│       └── Originality & Voice (weight↑)
│
└── LAYER 3: Prompt-Specific Analysis
    ├── Alignment scoring (0-10)
    ├── Required elements check
    ├── Missing components identification
    └── Prompt-tailored suggestions
    ↓
Unified PIQ Analysis Result
├── PQI Score (0-100)
├── Dynamic dimension scores (8-12 dimensions shown)
├── All feature detections
├── Content-aware coaching
└── Prompt-specific guidance
```

---

## 🏗️ IMPLEMENTATION STRUCTURE

### File: `src/services/unifiedPIQAnalysis.ts`

```typescript
/**
 * UNIFIED PIQ ANALYSIS SYSTEM
 *
 * World-class analysis for ALL UC PIQs (350 words):
 * - All 8 UC PIQ prompts
 * - Extracurricular narratives
 * - Personal stories
 * - Academic passions
 * - Creative expressions
 * - Challenges overcome
 *
 * ADAPTIVE INTELLIGENCE:
 * - Auto-detects content type
 * - Adjusts rubric weights dynamically
 * - Provides prompt-specific guidance
 * - Synthesizes best of activity + essay analysis
 *
 * TRAINING SOURCES:
 * - 19 exemplar essays (Harvard/Princeton/MIT/Yale/Berkeley)
 * - 5 elite activity narratives (Harvard/UCLA/Berkeley Class of 2029)
 * - Session 19 breakthrough patterns
 * - Narrative Workshop 5-stage pipeline insights
 */

// ============================================================================
// TYPES
// ============================================================================

export type PIQContentType =
  | 'activity_leadership'      // Prompt 1, 7
  | 'creative_expression'      // Prompt 2
  | 'talent_skill'            // Prompt 3
  | 'educational_journey'     // Prompt 4
  | 'challenge_adversity'     // Prompt 5
  | 'academic_passion'        // Prompt 6
  | 'personal_distinction'    // Prompt 8
  | 'general_narrative';      // Auto-detected

export interface UnifiedPIQInput {
  /** PIQ text (350 words max) */
  text: string;

  /** UC PIQ prompt ID (1-8) or null for auto-detect */
  prompt_id?: number | null;

  /** Optional custom prompt text */
  prompt_text?: string;

  /** Optional content type (auto-detected if not provided) */
  content_type?: PIQContentType;

  /** Student context */
  context?: {
    intended_major?: string;
    cultural_background?: string;
    voice_preference?: 'concise' | 'warm' | 'understated';
    activity_category?: string; // If it's an activity
    target_schools?: string[];
  };

  /** Analysis options */
  options?: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    include_generation_suggestions?: boolean;
  };
}

export interface UnifiedPIQResult {
  // Core scoring
  piq_quality_index: number; // 0-100
  impression_label: string;
  tier: 1 | 2 | 3 | 4; // 1=Harvard, 2=Top UC, 3=Competitive, 4=Needs work

  // Content classification
  detected_content_type: PIQContentType;
  confidence: number; // 0-1

  // Adaptive dimension scores (8-12 shown based on content)
  dimension_scores: Array<{
    name: string;
    display_name: string;
    score_0_to_10: number;
    weight: number; // Adjusted based on content type
    evidence_quotes: string[];
    evaluator_notes: string;
    suggestions: string[];
    relevant_for_content_type: boolean; // Some dims may not apply
  }>;

  // Universal feature detections
  features: {
    scenes: {
      has_scenes: boolean;
      count: number;
      details: Array<{
        paragraph: number;
        temporal_anchor?: string;
        spatial_anchor?: string;
        sensory_details: string[];
      }>;
    };
    dialogue: {
      has_dialogue: boolean;
      count: number;
      quotes: Array<{
        text: string;
        speaker?: string;
        function: string;
      }>;
    };
    interiority: {
      score: number;
      vulnerability_count: number;
      vulnerability_moments: Array<{
        text: string;
        type: 'physical' | 'emotional' | 'intellectual';
      }>;
      inner_debate: boolean;
      emotion_naming: number;
    };
    authenticity: {
      score: number;
      voice_type: string;
      red_flags: string[];
      green_flags: string[];
    };
    elite_patterns: {
      score: number;
      tier: 1 | 2 | 3 | 4;
      patterns: {
        vulnerability: number;
        dialogue: number;
        community_transformation: number;
        quantified_impact: number;
        micro_to_macro: number;
        philosophical_depth: number;
        counter_narrative: number;
      };
    };
    literary_sophistication: {
      score: number;
      tier: 'S' | 'A' | 'B' | 'C';
      techniques: string[];
    };
  };

  // Activity-specific analysis (if applicable)
  activity_analysis?: {
    role_clarity: number;
    initiative_shown: boolean;
    leadership_demonstrated: boolean;
    time_investment_clear: boolean;
    impact_quantified: boolean;
  };

  // Prompt-specific analysis
  prompt_analysis: {
    prompt_id?: number;
    prompt_text: string;
    alignment_score: number; // 0-10
    required_elements: Array<{
      element: string;
      present: boolean;
      evidence?: string;
    }>;
    missing_critical: string[];
    strengths: string[];
  };

  // Prioritized improvements
  improvement_roadmap: {
    quick_wins: Array<{ // 5-10 min, +1-3 pts
      action: string;
      expected_impact: string;
      how_to: string;
    }>;
    strategic_moves: Array<{ // 20-30 min, +3-5 pts
      action: string;
      expected_impact: string;
      how_to: string;
    }>;
    transformative_changes: Array<{ // 45-60 min, +5-10 pts
      action: string;
      expected_impact: string;
      how_to: string;
    }>;
  };

  // Word count
  word_count: {
    total: number;
    max: 350;
    within_limit: boolean;
    utilization: number; // percentage
  };

  // Flags
  flags: string[];

  // Metadata
  analyzed_at: string;
  analysis_version: string;
  rubric_version: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function analyzeUnifiedPIQ(
  input: UnifiedPIQInput
): Promise<UnifiedPIQResult> {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'UNIFIED PIQ ANALYSIS SYSTEM' + ' '.repeat(20) + '║');
  console.log('║' + ' '.repeat(15) + 'Best of Both Worlds + Enhanced' + ' '.repeat(15) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');

  // Step 1: Content Type Detection
  const contentType = input.content_type || await detectContentType(input.text, input.prompt_id);
  console.log(`📝 Content Type: ${contentType}`);

  // Step 2: Run Universal Feature Detection (parallel)
  console.log('🔍 Running universal feature detection...');
  const features = await runUniversalFeatureDetection(input.text);
  console.log('✅ Features detected');

  // Step 3: Adaptive Rubric Scoring
  console.log('📊 Scoring with adaptive rubric...');
  const dimensionScores = await scoreWithAdaptiveRubric(
    input.text,
    contentType,
    features,
    input.context
  );
  console.log('✅ Rubric scoring complete');

  // Step 4: Activity-Specific Analysis (if applicable)
  let activityAnalysis;
  if (isActivityContent(contentType)) {
    console.log('⚙️  Running activity-specific analysis...');
    activityAnalysis = await analyzeActivitySpecifics(input.text, features);
    console.log('✅ Activity analysis complete');
  }

  // Step 5: Prompt-Specific Analysis
  console.log('🎯 Analyzing prompt alignment...');
  const promptAnalysis = await analyzePromptAlignment(
    input.text,
    input.prompt_id,
    input.prompt_text,
    contentType,
    features
  );
  console.log('✅ Prompt analysis complete');

  // Step 6: Calculate Overall PQI
  const pqi = calculatePQI(dimensionScores, features, promptAnalysis);
  console.log(`📈 PQI Score: ${pqi}/100`);

  // Step 7: Generate Improvement Roadmap
  console.log('🗺️  Generating improvement roadmap...');
  const improvementRoadmap = await generateImprovementRoadmap(
    dimensionScores,
    features,
    promptAnalysis,
    contentType,
    pqi
  );
  console.log('✅ Roadmap generated');

  // Compile result
  const result: UnifiedPIQResult = {
    piq_quality_index: pqi,
    impression_label: getImpressionLabel(pqi),
    tier: getTier(pqi),
    detected_content_type: contentType,
    confidence: 0.85, // TODO: Implement confidence calculation

    dimension_scores: dimensionScores,
    features: features,
    activity_analysis: activityAnalysis,
    prompt_analysis: promptAnalysis,
    improvement_roadmap: improvementRoadmap,

    word_count: analyzeWordCount(input.text),
    flags: generateFlags(input.text, features, promptAnalysis, dimensionScores),

    analyzed_at: new Date().toISOString(),
    analysis_version: '2.0.0-unified',
    rubric_version: 'adaptive-v1.0.0'
  };

  console.log('');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(30) + 'ANALYSIS COMPLETE' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log(`  PQI: ${result.piq_quality_index}/100 (${result.impression_label})`);
  console.log(`  Tier: ${result.tier} (${getTierLabel(result.tier)})`);
  console.log(`  Content Type: ${contentType}`);
  console.log(`  Top Improvement: ${result.improvement_roadmap.quick_wins[0]?.action || 'None'}`);
  console.log('');

  return result;
}

// ============================================================================
// CONTENT TYPE DETECTION
// ============================================================================

async function detectContentType(
  text: string,
  promptId?: number | null
): Promise<PIQContentType> {
  // If prompt ID provided, use prompt-to-type mapping
  if (promptId) {
    const promptTypeMap: Record<number, PIQContentType> = {
      1: 'activity_leadership',
      2: 'creative_expression',
      3: 'talent_skill',
      4: 'educational_journey',
      5: 'challenge_adversity',
      6: 'academic_passion',
      7: 'activity_leadership',
      8: 'personal_distinction'
    };
    return promptTypeMap[promptId] || 'general_narrative';
  }

  // Auto-detect based on content
  const textLower = text.toLowerCase();

  // Leadership/Activity markers
  const leadershipMarkers = [
    'president', 'captain', 'leader', 'founder', 'organized', 'led',
    'team', 'club', 'volunteer', 'community service', 'hours per week'
  ];
  const leadershipScore = leadershipMarkers.filter(m => textLower.includes(m)).length;

  // Creative markers
  const creativeMarkers = [
    'create', 'design', 'art', 'music', 'write', 'build', 'express',
    'innovative', 'original', 'imagination'
  ];
  const creativeScore = creativeMarkers.filter(m => textLower.includes(m)).length;

  // Academic markers
  const academicMarkers = [
    'research', 'study', 'learn', 'discover', 'theory', 'science',
    'math', 'history', 'literature', 'curious', 'question'
  ];
  const academicScore = academicMarkers.filter(m => textLower.includes(m)).length;

  // Challenge markers
  const challengeMarkers = [
    'challenge', 'struggle', 'obstacle', 'overcome', 'difficult',
    'barrier', 'adversity', 'hardship'
  ];
  const challengeScore = challengeMarkers.filter(m => textLower.includes(m)).length;

  // Select highest scoring type
  const scores = {
    activity_leadership: leadershipScore,
    creative_expression: creativeScore,
    academic_passion: academicScore,
    challenge_adversity: challengeScore
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'general_narrative';

  return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as PIQContentType || 'general_narrative';
}

// ============================================================================
// UNIVERSAL FEATURE DETECTION
// ============================================================================

async function runUniversalFeatureDetection(text: string) {
  // Import all detectors
  const { detectScenes } = await import('@/core/essay/analysis/features/sceneDetector');
  const { extractDialogue } = await import('@/core/essay/analysis/features/dialogueExtractor');
  const { detectInteriority } = await import('@/core/essay/analysis/features/interiorityDetector');
  const { analyzeAuthenticity } = await import('@/core/analysis/features/authenticityDetector');
  const { analyzeElitePatterns } = await import('@/core/analysis/features/elitePatternDetector');
  const { analyzeLiterarySophistication } = await import('@/core/analysis/features/literarySophisticationDetector');

  // Run all in parallel
  const [scenes, dialogue, interiority, authenticity, elitePatterns, literary] = await Promise.all([
    detectScenes(text),
    extractDialogue(text),
    detectInteriority(text),
    analyzeAuthenticity(text),
    analyzeElitePatterns(text),
    analyzeLiterarySophistication(text)
  ]);

  return {
    scenes: {
      has_scenes: scenes.has_scenes,
      count: scenes.scene_count,
      details: scenes.scenes
    },
    dialogue: {
      has_dialogue: dialogue.has_dialogue,
      count: dialogue.dialogue_count,
      quotes: dialogue.dialogues
    },
    interiority: {
      score: interiority.overall_interiority_score,
      vulnerability_count: interiority.vulnerability_count,
      vulnerability_moments: interiority.vulnerability_moments,
      inner_debate: interiority.inner_debate_present,
      emotion_naming: interiority.emotion_naming_instances.length
    },
    authenticity: {
      score: authenticity.authenticity_score,
      voice_type: authenticity.voice_type,
      red_flags: authenticity.red_flags,
      green_flags: authenticity.green_flags
    },
    elite_patterns: {
      score: elitePatterns.overallScore,
      tier: elitePatterns.tier,
      patterns: {
        vulnerability: elitePatterns.vulnerability.score,
        dialogue: elitePatterns.dialogue.score,
        community_transformation: elitePatterns.communityTransformation.score,
        quantified_impact: elitePatterns.quantifiedImpact.score,
        micro_to_macro: elitePatterns.microToMacro.score,
        philosophical_depth: elitePatterns.philosophicalDepth?.score || 0,
        counter_narrative: elitePatterns.counterNarrative?.score || 0
      }
    },
    literary_sophistication: {
      score: literary.overallScore,
      tier: literary.tier,
      techniques: literary.techniques_detected.map((t: any) => t.name)
    }
  };
}

// ============================================================================
// ADAPTIVE RUBRIC SCORING
// ============================================================================

async function scoreWithAdaptiveRubric(
  text: string,
  contentType: PIQContentType,
  features: any,
  context?: any
): Promise<UnifiedPIQResult['dimension_scores']> {
  // Define core dimensions (ALL PIQs)
  const coreDimensions = [
    'voice_authenticity_specificity',
    'narrative_arc_stakes',
    'vulnerability_interiority',
    'reflection_meaning_making',
    'show_dont_tell_craft',
    'intellectual_engagement',
    'community_impact',
    'context_disclosure'
  ];

  // Define activity-enhanced dimensions
  const activityDimensions = [
    'initiative_leadership',
    'role_clarity_ownership',
    'time_investment_consistency',
    'quantified_impact'
  ];

  // Define narrative-enhanced dimensions
  const narrativeDimensions = [
    'opening_power_scene',
    'character_development',
    'philosophical_depth',
    'originality_voice'
  ];

  // Determine which dimensions to include and their weights
  const isActivity = isActivityContent(contentType);
  const isNarrative = true; // All PIQs are narratives

  const activeDimensions = [
    ...coreDimensions,
    ...(isActivity ? activityDimensions : []),
    ...(isNarrative ? narrativeDimensions : [])
  ];

  // Calculate base weights
  const baseWeight = 1.0 / activeDimensions.length;

  // Adjust weights based on content type
  const adjustedWeights = activeDimensions.map(dim => {
    let weight = baseWeight;

    if (isActivity && activityDimensions.includes(dim)) {
      weight *= 1.3; // Boost activity dimensions
    }

    if (isNarrative && narrativeDimensions.includes(dim)) {
      weight *= 1.2; // Boost narrative dimensions
    }

    return weight;
  });

  // Normalize weights to sum to 1.0
  const totalWeight = adjustedWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = adjustedWeights.map(w => w / totalWeight);

  // Score each dimension
  const dimensionScores = await Promise.all(
    activeDimensions.map(async (dim, idx) => {
      const score = await scoreDimension(dim, text, features, context);
      return {
        name: dim,
        display_name: getDimensionDisplayName(dim),
        score_0_to_10: score.score,
        weight: normalizedWeights[idx],
        evidence_quotes: score.evidence_quotes,
        evaluator_notes: score.evaluator_notes,
        suggestions: score.suggestions,
        relevant_for_content_type: true
      };
    })
  );

  return dimensionScores;
}

// ============================================================================
// DIMENSION SCORING (Unified Best of Both Worlds)
// ============================================================================

async function scoreDimension(
  dimension: string,
  text: string,
  features: any,
  context?: any
): Promise<{
  score: number;
  evidence_quotes: string[];
  evaluator_notes: string;
  suggestions: string[];
}> {
  // TODO: Implement comprehensive dimension scoring
  // This will merge:
  // - Activity rubric scoring logic
  // - Essay rubric scoring logic
  // - Enhanced with Session 19 insights
  // - Narrative Workshop patterns

  return {
    score: 7,
    evidence_quotes: [],
    evaluator_notes: 'Placeholder',
    suggestions: []
  };
}

// Helper functions
function isActivityContent(contentType: PIQContentType): boolean {
  return contentType === 'activity_leadership';
}

function getDimensionDisplayName(dim: string): string {
  const names: Record<string, string> = {
    voice_authenticity_specificity: 'Voice Authenticity & Specificity',
    narrative_arc_stakes: 'Narrative Arc & Stakes',
    vulnerability_interiority: 'Vulnerability & Interiority',
    reflection_meaning_making: 'Reflection & Meaning-Making',
    show_dont_tell_craft: 'Show-Don\'t-Tell Craft',
    intellectual_engagement: 'Intellectual Engagement',
    community_impact: 'Community Impact & Transformation',
    context_disclosure: 'Context & Background Disclosure',
    initiative_leadership: 'Initiative & Leadership',
    role_clarity_ownership: 'Role Clarity & Ownership',
    time_investment_consistency: 'Time Investment & Consistency',
    quantified_impact: 'Quantified Impact',
    opening_power_scene: 'Opening Power & Scene Entry',
    character_development: 'Character Development',
    philosophical_depth: 'Philosophical Depth',
    originality_voice: 'Originality & Voice'
  };
  return names[dim] || dim;
}

// TODO: Implement remaining helper functions
async function analyzeActivitySpecifics(text: string, features: any) { return undefined; }
async function analyzePromptAlignment(text: string, promptId: any, promptText: any, contentType: any, features: any) { return {} as any; }
function calculatePQI(dims: any, features: any, prompt: any) { return 75; }
function getImpressionLabel(pqi: number) { return 'compelling_clear_voice'; }
function getTier(pqi: number): 1 | 2 | 3 | 4 { return pqi >= 85 ? 1 : pqi >= 75 ? 2 : pqi >= 65 ? 3 : 4; }
function getTierLabel(tier: number) { return ['Harvard/MIT', 'Top UC', 'Competitive', 'Needs Work'][tier - 1]; }
async function generateImprovementRoadmap(dims: any, features: any, prompt: any, contentType: any, pqi: number) { return { quick_wins: [], strategic_moves: [], transformative_changes: [] }; }
function analyzeWordCount(text: string) { return { total: text.split(/\s+/).length, max: 350, within_limit: true, utilization: 85 }; }
function generateFlags(text: string, features: any, prompt: any, dims: any) { return []; }
```

---

## 🎯 KEY INNOVATIONS

### 1. Content-Aware Adaptation
**Problem**: Different PIQ types need different emphasis
**Solution**: Detect content type → adjust rubric weights dynamically

Example:
- Leadership PIQ: Initiative (weight ↑30%), Role Clarity (weight ↑30%)
- Academic PIQ: Intellectual Engagement (weight ↑40%), Philosophical Depth (weight ↑30%)
- Creative PIQ: Originality (weight ↑40%), Show-Don't-Tell (weight ↑30%)

### 2. Merged Dimension Framework
**Core 8 Dimensions** (ALL PIQs):
1. Voice Authenticity & Specificity (Activity + Essay)
2. Narrative Arc & Stakes (Essay)
3. Vulnerability & Interiority (Essay)
4. Reflection & Meaning-Making (Activity + Essay)
5. Show-Don't-Tell Craft (Essay)
6. Intellectual Engagement (Essay)
7. Community Impact & Transformation (Activity + Essay)
8. Context & Background Disclosure (Essay)

**Activity-Enhanced** (4 dimensions, when detected):
9. Initiative & Leadership (Activity)
10. Role Clarity & Ownership (Activity)
11. Time Investment & Consistency (Activity)
12. Quantified Impact (Activity)

**Narrative-Enhanced** (4 dimensions, always):
13. Opening Power & Scene Entry (Essay)
14. Character Development (Essay)
15. Philosophical Depth (Essay)
16. Originality & Voice (Essay + Activity)

**Total**: 8-16 dimensions shown (adaptive)

### 3. Universal Feature Layer
**Every PIQ gets** (regardless of type):
- Scene detection
- Dialogue extraction
- Interiority detection
- Authenticity detection
- Elite pattern detection
- Literary sophistication

**Why**: Even leadership PIQs benefit from narrative elements

### 4. Prompt-Specific Intelligence
**For each of 8 UC prompts**:
- Required elements checklist
- Alignment scoring (0-10)
- Missing critical components
- Prompt-tailored suggestions

### 5. Three-Tier Improvement Roadmap
**Quick Wins** (5-10 min, +1-3 pts):
- Add specific number
- Name emotion
- Include time marker

**Strategic Moves** (20-30 min, +3-5 pts):
- Add concrete scene
- Include dialogue
- Show vulnerability

**Transformative Changes** (45-60 min, +5-10 pts):
- Restructure narrative arc
- Add extended metaphor
- Deepen philosophical reflection

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Core Unified Service (Week 1)
- [ ] Create `unifiedPIQAnalysis.ts`
- [ ] Implement content type detection
- [ ] Implement universal feature layer
- [ ] Implement adaptive rubric scoring
- [ ] Test with sample PIQs (all 8 prompts)

### Phase 2: Activity-Specific Enhancements (Week 1)
- [ ] Implement activity detection logic
- [ ] Add activity-specific dimensions
- [ ] Test with extracurricular PIQs

### Phase 3: Prompt Intelligence (Week 2)
- [ ] Implement prompt alignment for all 8 prompts
- [ ] Create required elements checklists
- [ ] Generate prompt-specific suggestions
- [ ] Test alignment accuracy

### Phase 4: Improvement Roadmap (Week 2)
- [ ] Implement three-tier improvement generation
- [ ] Prioritize by expected impact
- [ ] Test with weak → strong transformations

### Phase 5: Specialized Activity Service (Week 2)
- [ ] Keep `workshopAnalysisService.ts` as-is
- [ ] Document when to use specialized vs unified
- [ ] Create routing logic

---

## ✅ SUCCESS CRITERIA

### Accuracy:
- ✅ Content type detection ≥90% accurate
- ✅ Rubric scoring aligns with exemplar essays
- ✅ Prompt alignment correlates with human judgment
- ✅ Improvement suggestions lead to score gains

### Breadth:
- ✅ Works for all 8 UC PIQ prompts
- ✅ Works for extracurricular narratives
- ✅ Adapts to creative, academic, challenge, leadership types

### Depth:
- ✅ Detects nuanced narrative elements (scene, dialogue, interiority)
- ✅ Identifies elite patterns (vulnerability, transformation, etc.)
- ✅ Provides prompt-specific, actionable guidance

### Performance:
- ✅ Analysis completes in <5 seconds
- ✅ No backend dependency
- ✅ Memory efficient

---

## 🚀 NEXT STEPS

**Ready to start implementation!**

Should I:
1. Begin with Phase 1 (Core Unified Service)?
2. Start with content type detection and adaptive rubric?
3. Build incrementally with tests for each phase?

Let me know and I'll start building! 🎯
