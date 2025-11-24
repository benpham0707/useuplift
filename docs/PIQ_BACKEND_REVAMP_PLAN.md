# PIQ Backend System - Revamp Plan

**Date**: 2025-11-14
**Goal**: Transform extracurricular-specific backend into generalized PIQ analysis system
**Approach**: Leverage Essay Analysis Engine (12-dimension rubric) for ALL PIQs

---

## 🎯 CLARIFIED OBJECTIVE

**NOT**: Building new UI
**YES**: Revamping backend analysis system to be PIQ-generic (not just extracurricular PIQs)

### What This Means:
- Current system analyzes **extracurricular narratives** (activity-focused, 11 dimensions)
- New system analyzes **ALL UC PIQs** (essay-focused, 12 dimensions, 350 words)
- All 8 UC PIQ prompts supported:
  1. Leadership experience
  2. Creative side
  3. Greatest talent/skill
  4. Significant educational opportunity or barrier
  5. Significant challenge faced
  6. Academic subject inspiration
  7. Community service/betterment
  8. Something distinguishes you

---

## 📊 CURRENT SYSTEM ARCHITECTURE

### `workshopAnalysisService.ts` (Current)
**Purpose**: Analyze extracurricular activities

**Flow**:
```
ExtracurricularItem
    ↓
Transform to ExperienceEntry
    ↓
Call /api/v1/analyze-entry (backend API)
    ↓
Returns: 11-dimension activity rubric scores
    ↓
Add elite pattern detection (frontend)
    ↓
Add literary sophistication (frontend)
    ↓
Transform to AnalysisResult format
```

**Problems**:
1. ❌ Calls backend API (requires server running)
2. ❌ Uses 11-dimension activity rubric (not essay rubric)
3. ❌ Extracurricular-specific transformations
4. ❌ Missing scene/dialogue/interiority detection
5. ❌ No UC PIQ prompt awareness

---

## ✅ NEW SYSTEM ARCHITECTURE

### `piqAnalysisService.ts` (New - Generalized)
**Purpose**: Analyze ANY UC PIQ (all 8 prompts, 350 words)

**Flow**:
```
PIQ Input {
  text: string (350w)
  prompt_id: 1-8 (UC PIQ prompt)
  context?: { major, background, voice }
}
    ↓
Essay Analysis Engine (Frontend - No Backend!)
    ├── Scene Detection (temporal/spatial/sensory)
    ├── Dialogue Extraction (quoted speech)
    ├── Interiority Detection (emotion naming, inner debate)
    ├── Elite Pattern Detection (7 patterns)
    ├── Literary Sophistication (10 techniques)
    └── 12-Dimension Rubric Scoring
    ↓
Returns: PIQAnalysisResult {
  piq_quality_index: 0-100
  dimension_scores: 12 dimensions
  scene_detection: {...}
  dialogue_extraction: {...}
  interiority_detection: {...}
  elite_patterns: {...}
  literary_sophistication: {...}
  flags: string[]
  improvement_levers: string[]
}
```

**Advantages**:
1. ✅ No backend API needed (runs in frontend)
2. ✅ Uses 12-dimension essay rubric (proper for PIQs)
3. ✅ Generic for ALL UC PIQ prompts
4. ✅ Includes scene/dialogue/interiority detection
5. ✅ Prompt-aware coaching
6. ✅ Faster (no network calls)

---

## 🏗️ IMPLEMENTATION PLAN

### Step 1: Create PIQ Analysis Service

**File**: `src/services/piqAnalysisService.ts`

**Purpose**: Unified analysis service for ALL UC PIQs

```typescript
/**
 * PIQ Analysis Service
 *
 * Analyzes UC Personal Insight Questions (350 words) using the Essay Analysis Engine.
 * Supports all 8 UC PIQ prompts with prompt-aware coaching.
 *
 * Key Features:
 * - 12-dimension essay rubric scoring
 * - Scene/dialogue/interiority detection
 * - Elite pattern detection (7 patterns)
 * - Literary sophistication analysis (10 techniques)
 * - Prompt-specific guidance
 * - No backend API required (runs in frontend)
 */

import { detectScenes } from '@/core/essay/analysis/features/sceneDetector';
import { extractDialogue } from '@/core/essay/analysis/features/dialogueExtractor';
import { detectInteriority } from '@/core/essay/analysis/features/interiorityDetector';
import { detectElitePatterns } from '@/core/essay/analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '@/core/analysis/features/literarySophisticationDetector';
import { scoreWithRubric } from '@/core/essay/analysis/features/rubricScorer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PIQInput {
  /** PIQ text (350 words max) */
  text: string;

  /** UC PIQ prompt (1-8) */
  prompt_id: number;

  /** Optional prompt text (if custom/different wording) */
  prompt_text?: string;

  /** Student context for personalized analysis */
  context?: {
    intended_major?: string;
    cultural_background?: string;
    voice_preference?: 'concise' | 'warm' | 'understated';
    target_schools?: string[];
  };

  /** Analysis options */
  options?: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    include_coaching?: boolean;
  };
}

export interface PIQAnalysisResult {
  /** PIQ Quality Index (0-100) */
  piq_quality_index: number;

  /** Reader impression label */
  impression_label: 'arresting_deeply_human' | 'compelling_clear_voice' |
                   'competent_needs_texture' | 'readable_but_generic' |
                   'template_like_rebuild';

  /** 12-dimension scores */
  dimension_scores: Array<{
    name: string;
    score_0_to_10: number;
    weight: number;
    evidence_quotes: string[];
    evaluator_notes: string;
    suggestions: string[];
  }>;

  /** Scene detection results */
  scene_detection: {
    has_scenes: boolean;
    scene_count: number;
    scenes: Array<{
      paragraph_index: number;
      temporal_anchor?: string;
      spatial_anchor?: string;
      sensory_details: string[];
    }>;
  };

  /** Dialogue extraction results */
  dialogue_extraction: {
    has_dialogue: boolean;
    dialogue_count: number;
    dialogues: Array<{
      quote: string;
      speaker?: string;
      narrative_function: string;
    }>;
  };

  /** Interiority detection results */
  interiority_detection: {
    overall_score: number;
    vulnerability_count: number;
    vulnerability_moments: Array<{
      statement: string;
      type: 'physical' | 'emotional' | 'intellectual';
    }>;
    inner_debate_present: boolean;
    emotion_naming_count: number;
  };

  /** Elite pattern profile */
  elite_patterns: {
    overall_score: number;
    tier: 1 | 2 | 3 | 4;
    patterns: {
      micro_to_macro: number;
      confrontation_dialogue: number;
      vulnerability_cues: number;
      philosophical_insight: number;
      community_transformation: number;
      quantified_with_human: number;
      counter_narrative: number;
    };
  };

  /** Literary sophistication */
  literary_sophistication: {
    overall_score: number;
    tier: 'S' | 'A' | 'B' | 'C';
    techniques_detected: string[];
  };

  /** Word count analysis */
  word_count: {
    total: number;
    max: 350;
    within_limit: boolean;
    utilization_percent: number;
  };

  /** Flags detected */
  flags: string[];

  /** Prioritized improvement levers */
  improvement_levers: Array<{
    priority: number;
    lever: string;
    expected_impact: string; // e.g., "+3-5 points"
    actionable_suggestion: string;
  }>;

  /** Prompt-specific guidance */
  prompt_guidance: {
    prompt_id: number;
    prompt_text: string;
    alignment_score: number; // 0-10: How well does essay address prompt?
    missing_elements: string[];
    strengths: string[];
  };

  /** Metadata */
  analyzed_at: string;
  analysis_depth: 'quick' | 'standard' | 'comprehensive';
  rubric_version: string;
}

// ============================================================================
// UC PIQ PROMPTS
// ============================================================================

export const UC_PIQ_PROMPTS = {
  1: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.",
  2: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.",
  3: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?",
  4: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.",
  5: "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?",
  6: "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.",
  7: "What have you done to make your school or your community a better place?",
  8: "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?"
};

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function analyzePIQ(input: PIQInput): Promise<PIQAnalysisResult> {
  console.log('='.repeat(80));
  console.log('PIQ ANALYSIS SERVICE');
  console.log('='.repeat(80));
  console.log(`Prompt ID: ${input.prompt_id}`);
  console.log(`Text length: ${input.text.length} chars`);
  console.log(`Word count: ${input.text.split(/\s+/).length} words`);
  console.log(`Depth: ${input.options?.depth || 'standard'}`);
  console.log('');

  // Validate word count
  const words = input.text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount > 350) {
    console.warn(`⚠️  Word count (${wordCount}) exceeds 350-word limit`);
  }

  // Get prompt text
  const promptText = input.prompt_text || UC_PIQ_PROMPTS[input.prompt_id as keyof typeof UC_PIQ_PROMPTS];

  if (!promptText) {
    throw new Error(`Invalid prompt_id: ${input.prompt_id}. Must be 1-8.`);
  }

  // Run all analyses in parallel
  console.log('Running feature detections...');
  const [
    sceneDetection,
    dialogueExtraction,
    interiorityDetection,
    elitePatterns,
    literarySophistication
  ] = await Promise.all([
    detectScenes(input.text),
    extractDialogue(input.text),
    detectInteriority(input.text),
    detectElitePatterns(input.text),
    analyzeLiterarySophistication(input.text)
  ]);

  console.log('✅ Feature detections complete');
  console.log(`  - Scenes detected: ${sceneDetection.scene_count}`);
  console.log(`  - Dialogue instances: ${dialogueExtraction.dialogue_count}`);
  console.log(`  - Vulnerability moments: ${interiorityDetection.vulnerability_count}`);
  console.log(`  - Elite patterns tier: ${elitePatterns.tier}`);
  console.log(`  - Literary tier: ${literarySophistication.tier}`);
  console.log('');

  // Score with 12-dimension rubric
  console.log('Scoring with 12-dimension essay rubric...');
  const rubricScoring = await scoreWithRubric(
    input.text,
    {
      scenes: sceneDetection,
      dialogue: dialogueExtraction,
      interiority: interiorityDetection,
      elite_patterns: elitePatterns,
    }
  );

  console.log('✅ Rubric scoring complete');
  console.log(`  - EQI: ${rubricScoring.essay_quality_index}/100`);
  console.log(`  - Impression: ${rubricScoring.impression_label}`);
  console.log('');

  // Check prompt alignment
  console.log('Analyzing prompt alignment...');
  const promptGuidance = analyzePromptAlignment(
    input.text,
    input.prompt_id,
    promptText,
    {
      sceneDetection,
      dialogueExtraction,
      interiorityDetection,
      elitePatterns
    }
  );

  console.log('✅ Prompt alignment complete');
  console.log(`  - Alignment score: ${promptGuidance.alignment_score}/10`);
  console.log(`  - Missing elements: ${promptGuidance.missing_elements.length}`);
  console.log('');

  // Generate improvement levers
  const improvementLevers = generateImprovementLevers(
    rubricScoring,
    sceneDetection,
    dialogueExtraction,
    interiorityDetection,
    elitePatterns,
    promptGuidance
  );

  // Compile final result
  const result: PIQAnalysisResult = {
    piq_quality_index: rubricScoring.essay_quality_index,
    impression_label: rubricScoring.impression_label,
    dimension_scores: rubricScoring.dimension_scores.map(dim => ({
      name: dim.name,
      score_0_to_10: dim.score_0_to_10,
      weight: dim.weight,
      evidence_quotes: dim.evidence.quotes,
      evaluator_notes: dim.evidence.justification,
      suggestions: generateDimensionSuggestions(dim, input.text)
    })),

    scene_detection: {
      has_scenes: sceneDetection.has_scenes,
      scene_count: sceneDetection.scene_count,
      scenes: sceneDetection.scenes.map(s => ({
        paragraph_index: s.paragraph_index,
        temporal_anchor: s.temporal_anchor,
        spatial_anchor: s.spatial_anchor,
        sensory_details: s.sensory_details
      }))
    },

    dialogue_extraction: {
      has_dialogue: dialogueExtraction.has_dialogue,
      dialogue_count: dialogueExtraction.dialogue_count,
      dialogues: dialogueExtraction.dialogues.map(d => ({
        quote: d.quote,
        speaker: d.speaker,
        narrative_function: d.narrative_function
      }))
    },

    interiority_detection: {
      overall_score: interiorityDetection.overall_interiority_score,
      vulnerability_count: interiorityDetection.vulnerability_count,
      vulnerability_moments: interiorityDetection.vulnerability_moments,
      inner_debate_present: interiorityDetection.inner_debate_present,
      emotion_naming_count: interiorityDetection.emotion_naming_instances.length
    },

    elite_patterns: {
      overall_score: elitePatterns.overallScore,
      tier: elitePatterns.tier,
      patterns: {
        micro_to_macro: elitePatterns.micro_to_macro.score,
        confrontation_dialogue: elitePatterns.confrontation_dialogue.score,
        vulnerability_cues: elitePatterns.vulnerability.score,
        philosophical_insight: elitePatterns.philosophical_depth.score,
        community_transformation: elitePatterns.community_transformation.score,
        quantified_with_human: elitePatterns.quantified_impact.score,
        counter_narrative: elitePatterns.counter_narrative.score
      }
    },

    literary_sophistication: {
      overall_score: literarySophistication.overallScore,
      tier: literarySophistication.tier,
      techniques_detected: literarySophistication.techniques_detected.map(t => t.name)
    },

    word_count: {
      total: wordCount,
      max: 350,
      within_limit: wordCount <= 350,
      utilization_percent: Math.round((wordCount / 350) * 100)
    },

    flags: generateFlags(rubricScoring, sceneDetection, dialogueExtraction, interiorityDetection, wordCount),

    improvement_levers: improvementLevers,

    prompt_guidance: promptGuidance,

    analyzed_at: new Date().toISOString(),
    analysis_depth: input.options?.depth || 'standard',
    rubric_version: 'v1.0.1'
  };

  console.log('='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log(`PIQ Quality Index: ${result.piq_quality_index}/100`);
  console.log(`Impression: ${result.impression_label}`);
  console.log(`Top improvement levers: ${result.improvement_levers.slice(0, 3).map(l => l.lever).join(', ')}`);
  console.log('='.repeat(80));
  console.log('');

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Analyze how well the PIQ addresses the prompt
 */
function analyzePromptAlignment(
  text: string,
  promptId: number,
  promptText: string,
  features: {
    sceneDetection: any;
    dialogueExtraction: any;
    interiorityDetection: any;
    elitePatterns: any;
  }
): PIQAnalysisResult['prompt_guidance'] {
  // Prompt-specific requirements
  const requirements = getPromptRequirements(promptId);

  const missingElements: string[] = [];
  const strengths: string[] = [];
  let alignmentScore = 5; // Base

  // Check each requirement
  requirements.forEach(req => {
    const present = checkRequirement(req, text, features);
    if (present) {
      strengths.push(req.name);
      alignmentScore += req.weight;
    } else {
      missingElements.push(req.name);
      alignmentScore -= req.weight * 0.5;
    }
  });

  // Cap at 0-10
  alignmentScore = Math.max(0, Math.min(10, alignmentScore));

  return {
    prompt_id: promptId,
    prompt_text: promptText,
    alignment_score: alignmentScore,
    missing_elements: missingElements,
    strengths: strengths
  };
}

/**
 * Get prompt-specific requirements
 */
function getPromptRequirements(promptId: number): Array<{name: string; weight: number; check: string}> {
  const requirements: Record<number, Array<{name: string; weight: number; check: string}>> = {
    1: [ // Leadership
      { name: "Concrete leadership role/title", weight: 1, check: "role" },
      { name: "Specific influence on others", weight: 1.5, check: "influence" },
      { name: "Example of resolving conflict", weight: 1, check: "conflict" },
      { name: "Timeline/duration shown", weight: 0.5, check: "timeline" }
    ],
    2: [ // Creative side
      { name: "Specific creative expression described", weight: 1.5, check: "creative_act" },
      { name: "Process of creation shown", weight: 1, check: "process" },
      { name: "Unconventional thinking demonstrated", weight: 1, check: "unconventional" }
    ],
    3: [ // Talent/skill
      { name: "Talent/skill clearly named", weight: 1, check: "talent_name" },
      { name: "Development over time shown", weight: 1.5, check: "development" },
      { name: "Demonstration with examples", weight: 1, check: "demonstration" }
    ],
    4: [ // Educational opportunity/barrier
      { name: "Opportunity/barrier specifically described", weight: 1.5, check: "opportunity_barrier" },
      { name: "Actions taken explained", weight: 1.5, check: "actions" },
      { name: "Impact on learning shown", weight: 1, check: "learning_impact" }
    ],
    5: [ // Significant challenge
      { name: "Challenge clearly described", weight: 1.5, check: "challenge" },
      { name: "Steps to overcome explained", weight: 1.5, check: "steps" },
      { name: "Academic impact discussed", weight: 1, check: "academic_impact" }
    ],
    6: [ // Academic subject
      { name: "Subject clearly identified", weight: 1, check: "subject" },
      { name: "In-class work/projects described", weight: 1, check: "in_class" },
      { name: "Outside exploration shown", weight: 1, check: "outside_class" },
      { name: "Passion/curiosity evident", weight: 1, check: "passion" }
    ],
    7: [ // Community betterment
      { name: "Community/school identified", weight: 0.5, check: "community" },
      { name: "Specific actions taken", weight: 1.5, check: "actions" },
      { name: "Measurable impact shown", weight: 1.5, check: "impact" },
      { name: "Before/after contrast", weight: 0.5, check: "before_after" }
    ],
    8: [ // What distinguishes you
      { name: "Unique quality/experience named", weight: 1.5, check: "unique" },
      { name: "Not covered elsewhere confirmed", weight: 0.5, check: "new_info" },
      { name: "Relevance to UC explained", weight: 1.5, check: "relevance" }
    ]
  };

  return requirements[promptId] || [];
}

/**
 * Check if requirement is met
 */
function checkRequirement(
  req: {name: string; weight: number; check: string},
  text: string,
  features: any
): boolean {
  const textLower = text.toLowerCase();

  switch (req.check) {
    case "role":
      return /(?:president|captain|leader|founder|director|manager|coordinator)/i.test(text);
    case "influence":
      return features.elitePatterns.community_transformation.score > 5;
    case "conflict":
      return /(?:dispute|disagree|conflict|tension|resolve|mediate)/i.test(textLower);
    case "timeline":
      return /(?:year|month|week|throughout|over time|since)/i.test(textLower);
    case "creative_act":
      return features.sceneDetection.has_scenes;
    case "process":
      return /(?:first|then|next|finally|step|process|develop)/i.test(textLower);
    case "unconventional":
      return features.elitePatterns.counter_narrative.score > 5;
    case "talent_name":
      return true; // Assume present in PIQ 3
    case "development":
      return /(?:practice|improve|learn|develop|grow|year|month)/i.test(textLower);
    case "demonstration":
      return features.elitePatterns.quantified_impact.score > 5;
    case "opportunity_barrier":
      return /(?:opportunity|barrier|challenge|obstacle|access|lack|limited)/i.test(textLower);
    case "actions":
      return /(?:I|took|did|created|organized|applied|worked)/i.test(text);
    case "learning_impact":
      return /(?:learn|understand|realize|discover|insight|knowledge)/i.test(textLower);
    case "challenge":
      return /(?:challenge|difficult|struggle|obstacle|hardship)/i.test(textLower);
    case "steps":
      return /(?:first|step|strategy|approach|solution|address)/i.test(textLower);
    case "academic_impact":
      return /(?:grade|class|school|academic|study|performance)/i.test(textLower);
    case "subject":
      return true; // Assume present in PIQ 6
    case "in_class":
      return /(?:class|course|teacher|assignment|project|lab)/i.test(textLower);
    case "outside_class":
      return /(?:outside|beyond|home|research|read|explore|independent)/i.test(textLower);
    case "passion":
      return features.interiorityDetection.emotion_naming_count > 0;
    case "community":
      return /(?:school|community|neighborhood|club|organization)/i.test(textLower);
    case "impact":
      return features.elitePatterns.quantified_impact.score > 5;
    case "before_after":
      return features.elitePatterns.community_transformation.score > 5;
    case "unique":
      return features.elitePatterns.originality_score > 6;
    case "new_info":
      return true; // Assume yes for PIQ 8
    case "relevance":
      return /(?:university|uc|college|future|goal|contribute)/i.test(textLower);
    default:
      return false;
  }
}

/**
 * Generate prioritized improvement levers
 */
function generateImprovementLevers(
  rubricScoring: any,
  sceneDetection: any,
  dialogueExtraction: any,
  interiorityDetection: any,
  elitePatterns: any,
  promptGuidance: any
): PIQAnalysisResult['improvement_levers'] {
  const levers: PIQAnalysisResult['improvement_levers'] = [];

  // Check each dimension and feature
  if (!sceneDetection.has_scenes) {
    levers.push({
      priority: 1,
      lever: "Add concrete scene",
      expected_impact: "+5-8 points",
      actionable_suggestion: "Open with specific moment: temporal anchor (when) + spatial anchor (where) + sensory detail (what you saw/heard/felt)"
    });
  }

  if (!dialogueExtraction.has_dialogue) {
    levers.push({
      priority: 2,
      lever: "Include dialogue",
      expected_impact: "+3-5 points",
      actionable_suggestion: "Add one quoted conversation that reveals character or moves story forward"
    });
  }

  if (interiorityDetection.vulnerability_count === 0) {
    levers.push({
      priority: 1,
      lever: "Show vulnerability",
      expected_impact: "+5-10 points",
      actionable_suggestion: "Name a specific fear/doubt OR describe physical symptom (trembling hands, stomach ulcers, etc.)"
    });
  }

  if (elitePatterns.quantified_impact.score < 5) {
    levers.push({
      priority: 2,
      lever: "Quantify impact",
      expected_impact: "+3-5 points",
      actionable_suggestion: "Add specific numbers: people affected, time invested, measurable outcomes"
    });
  }

  if (elitePatterns.micro_to_macro.score < 5) {
    levers.push({
      priority: 3,
      lever: "Deepen reflection",
      expected_impact: "+5-7 points",
      actionable_suggestion: "Connect specific experience to universal insight about life, people, or learning"
    });
  }

  if (promptGuidance.alignment_score < 7) {
    levers.push({
      priority: 1,
      lever: "Address prompt more directly",
      expected_impact: "+3-5 points",
      actionable_suggestion: `Missing: ${promptGuidance.missing_elements.join(', ')}`
    });
  }

  // Sort by priority
  levers.sort((a, b) => a.priority - b.priority);

  return levers.slice(0, 5); // Top 5
}

/**
 * Generate dimension-specific suggestions
 */
function generateDimensionSuggestions(dimension: any, text: string): string[] {
  // TODO: Implement dimension-specific suggestion logic
  return [];
}

/**
 * Generate flags based on analysis
 */
function generateFlags(
  rubricScoring: any,
  sceneDetection: any,
  dialogueExtraction: any,
  interiorityDetection: any,
  wordCount: number
): string[] {
  const flags: string[] = [];

  if (wordCount > 350) {
    flags.push('over_word_limit');
  }

  if (!sceneDetection.has_scenes) {
    flags.push('no_scenes');
  }

  if (!dialogueExtraction.has_dialogue) {
    flags.push('no_dialogue');
  }

  if (interiorityDetection.vulnerability_count === 0) {
    flags.push('no_vulnerability');
  }

  if (rubricScoring.essay_quality_index < 60) {
    flags.push('needs_significant_work');
  }

  return flags;
}
```

---

## 🔄 MIGRATION PLAN

### Phase 1: Create New PIQ Service (Core)
**File**: `src/services/piqAnalysisService.ts`

**Tasks**:
- [ ] Create main `analyzePIQ()` function
- [ ] Integrate Essay Analysis Engine features
- [ ] Implement prompt alignment checking
- [ ] Generate improvement levers
- [ ] Test with all 8 UC PIQ prompts

### Phase 2: Update Workshop Backend Types
**File**: `src/components/portfolio/essay/piq/backendTypes.ts`

**Tasks**:
- [ ] Define `PIQAnalysisResult` type
- [ ] Map to existing workshop component types
- [ ] Ensure backwards compatibility

### Phase 3: Create Teaching Transformer
**File**: `src/services/piqTeachingTransformer.ts`

**Tasks**:
- [ ] Convert 12-dimension scores → teaching issues
- [ ] Generate dimension-specific coaching
- [ ] Create fix strategies
- [ ] Generate reflection prompts

### Phase 4: Update Workshop Service
**Option A**: Keep both services
- `workshopAnalysisService.ts` - For extracurricular activities
- `piqAnalysisService.ts` - For UC PIQs

**Option B**: Unified service with type detection
- Auto-detect if input is activity or PIQ
- Route to appropriate analysis engine

---

## ✅ SUCCESS CRITERIA

### Functional:
- ✅ Can analyze 350w PIQ for all 8 prompts
- ✅ Returns 12-dimension essay scores
- ✅ Detects scenes, dialogue, interiority
- ✅ Provides prompt-specific guidance
- ✅ Generates prioritized improvement levers
- ✅ No backend API dependency

### Quality:
- ✅ Scene detection ≥90% accuracy
- ✅ Dialogue extraction ≥95% accuracy
- ✅ Interiority detection ≥90% accuracy
- ✅ Rubric scoring aligned with exemplar essays
- ✅ Prompt alignment score correlates with human judgment

### Performance:
- ✅ Analysis completes in <3 seconds
- ✅ No network latency (frontend-only)
- ✅ Memory efficient (no caching issues)

---

## 🚀 NEXT STEPS

### Immediate:
1. Start implementing `piqAnalysisService.ts`
2. Test with sample 350w PIQ
3. Validate all 8 prompts work

### Questions for You:
1. Should I keep `workshopAnalysisService.ts` for activities, or merge everything into one service?
2. Do you want generation integration (19-iteration system) in this phase, or later?
3. Any specific UC PIQ examples you want me to test with?

**Ready to start implementation! Let me know and I'll begin building.** 🚀
