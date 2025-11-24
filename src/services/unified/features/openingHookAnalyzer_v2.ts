/**
 * WORLD-CLASS OPENING HOOK ANALYZER (LLM-Powered)
 *
 * Goes beyond basic hook detection to provide analysis at the level of:
 * - Pulitzer Prize-winning memoirists
 * - New Yorker essay editors
 * - Top literary magazine editors
 * - Harvard admissions officers who read 50,000+ essays
 *
 * This is NOT what a student could get from ChatGPT. This is sophisticated,
 * iteratively refined analysis based on:
 * - Award-winning memoir openings (Educated, The Glass Castle, Know My Name, etc.)
 * - New Yorker personal essay craft
 * - Atlantic / Harper's / Paris Review essay techniques
 * - UC Berkeley / Harvard / Stanford exemplar essays
 * - Literary craft from MFA programs
 *
 * Key Enhancements over V1:
 * 1. Analyzes FULL ESSAY context, not just opening sentence
 * 2. Evaluates hook-to-story arc coherence
 * 3. Assesses tonal consistency throughout
 * 4. Identifies advanced literary techniques
 * 5. Provides world-class hook examples across 20+ types
 * 6. Evaluates narrative architecture and thematic setup
 * 7. Analyzes craft elements (rhythm, sound, voice, subtext)
 * 8. Strategic function assessment (promise, delivery, payoff)
 */

import { callClaudeWithRetry } from '../../../lib/llm/claude';

// ============================================================================
// TYPES
// ============================================================================

export type HookType =
  // BASIC (What V1 Had)
  | 'paradox'                    // "Should have been X, but was Y"
  | 'scene_tension'              // Drop into crisis moment
  | 'provocative_question'       // Question that demands engagement
  | 'sensory_immersion'          // Vivid sensory opening
  | 'vulnerability_first'        // Raw emotion upfront
  | 'philosophical_frame'        // Universal truth opening
  | 'backstory'                  // Chronological context
  | 'generic_resume'             // Weak, credential-focused

  // ADVANCED (Literary Techniques)
  | 'in_medias_res'              // Start in middle of action (true literary technique)
  | 'dual_timeline'              // Past and present interwoven from first line
  | 'second_person_immersion'    // "You don't expect..." pulls reader in
  | 'epistolary_opening'         // Letter/address format
  | 'internal_external_contrast' // Inner thought vs outer reality
  | 'anaphora_opening'           // Repetition for rhythm ("I am... I am... I am...")
  | 'negative_space'             // What's NOT said defines the opening
  | 'dialogue_cold_open'         // Start with dialogue (risky but powerful)
  | 'false_certainty'            // Statement that will be undermined
  | 'catalog_opening'            // List that builds to revelation
  | 'sensory_deprivation'        // Absence of expected senses
  | 'metaphor_architecture'      // Extended metaphor that structures whole essay

  // WORLD-CLASS (Award-Winning Memoir Techniques)
  | 'present_tense_urgency'      // Present tense for immediacy
  | 'fragmented_memory'          // Incomplete memory that reveals psychology
  | 'object_as_lens'             // Physical object as entry point
  | 'temporal_disruption'        // Time moves non-linearly from start
  | 'voice_as_hook'              // Distinctive voice is the hook itself
  | 'thematic_image'             // Image that encodes essay's meaning
  | 'circular_structure_signal'  // Opening hints at circular return;

export type HookTier = 'world_class' | 'strong' | 'adequate' | 'weak' | 'generic';

export interface HookAnalysis {
  // BASIC CLASSIFICATION
  hook_type: HookType;
  hook_tier: HookTier;
  effectiveness_score: number; // 0-10

  // ADVANCED ANALYSIS (NEW)
  literary_techniques: {
    technique: string;
    sophistication_level: 'MFA' | 'advanced' | 'competent' | 'basic';
    evidence: string;
  }[];

  craft_elements: {
    sentence_rhythm: {
      assessment: string;  // "Staccato punches" vs "Flowing cadence" etc.
      word_count: number;
      avg_sentence_length: number;
      rhythm_pattern: 'varied' | 'monotonous' | 'strategic';
      evidence: string;
    };
    sound_devices: {
      alliteration: string[];
      assonance: string[];
      consonance: string[];
      overall_quality: 'masterful' | 'effective' | 'subtle' | 'absent';
    };
    voice_distinction: {
      authentic: boolean;
      distinctive: boolean;
      voice_quality: string; // Description of voice
      comparable_to: string; // "Reminiscent of Tara Westover's directness" etc.
    };
    imagery_sophistication: {
      concrete_abstract_ratio: string;
      specificity_level: 'hyperspecific' | 'specific' | 'general' | 'vague';
      sensory_layers: number; // How many senses engaged
      examples: string[];
    };
  };

  // NARRATIVE ARCHITECTURE ANALYSIS (NEW)
  narrative_setup: {
    central_tension_established: boolean;
    thematic_throughline_visible: boolean;
    transformation_foreshadowed: boolean;
    narrative_arc_implied: 'clear' | 'emerging' | 'unclear';
    setup_assessment: string;
  };

  // HOOK-TO-STORY COHERENCE (NEW)
  hook_story_fit: {
    tonal_consistency: {
      score: number; // 0-10
      assessment: string;
      tone_shifts: string[]; // Where tone breaks
    };
    opening_to_body_flow: {
      score: number; // 0-10
      transition_quality: 'seamless' | 'smooth' | 'jarring' | 'disconnected';
      flow_assessment: string;
    };
    hook_promise_delivered: {
      promise: string; // What the hook promises
      delivery: boolean; // Does essay deliver?
      delivery_assessment: string;
    };
    opening_conclusion_relationship: {
      structure: 'circular' | 'evolved' | 'contrasted' | 'disconnected';
      sophistication: string;
    };
  };

  // WORLD-CLASS COMPARISON (NEW)
  world_class_comparison: {
    comparable_to: string; // "This hook recalls Chanel Miller's opening in Know My Name..."
    what_makes_it_work: string[];
    what_would_elevate_it: string[];
    exemplar_hooks: {
      type: HookType;
      example: string;
      source: string; // "Educated by Tara Westover", "New Yorker essay", etc.
      why_it_works: string;
    }[];
  };

  // STRATEGIC FUNCTION (NEW)
  strategic_assessment: {
    reader_engagement_mechanics: string[];
    subtext_layers: string[];
    implied_stakes: string[];
    narrative_promises: string[];
  };

  // ORIGINAL V1 FIELDS (Enhanced)
  components: {
    specificity: boolean;
    immediacy: boolean;
    tension: boolean;
    sensory_details: boolean;
    concise: boolean;
  };

  strengths: string[];
  weaknesses: string[];

  // ENHANCED UPGRADE PATH
  upgrade_path: {
    quick_fix: string;
    strategic_rewrite: string;
    world_class_transformation: {
      technique_to_add: string;
      literary_device: string;
      craft_enhancement: string;
      example_before: string;
      example_after: string;
      why_this_elevates: string;
    };
  };

  // RESEARCH ALIGNMENT
  ao_research_alignment: string;
  award_winning_patterns: string[];
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze opening hook with world-class depth
 * Now requires FULL essay for context analysis
 */
export async function analyzeOpeningHook(
  fullEssay: string,
  options: {
    depth?: 'quick' | 'comprehensive';
    skipCache?: boolean;
    essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth';
  } = {}
): Promise<HookAnalysis> {
  const depth = options.depth || 'comprehensive';
  const essayType = options.essayType || 'leadership';

  console.log(`[OpeningHookAnalyzer v2] Analyzing hook with FULL ESSAY context (${depth} mode)`);

  // Extract opening (first 1-3 sentences for focused analysis)
  const sentences = fullEssay.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const opening = sentences.slice(0, 3).join('. ') + '.';

  // Check cache
  const cacheKey = getCacheKey(fullEssay, depth);
  if (!options.skipCache && analysisCache.has(cacheKey)) {
    console.log('[OpeningHookAnalyzer v2] Cache HIT');
    return analysisCache.get(cacheKey)!;
  }

  // Build prompts with FULL essay context
  const systemPrompt = buildWorldClassSystemPrompt();
  const userPrompt = buildWorldClassUserPrompt(opening, fullEssay, essayType, depth);

  // Call Claude API
  console.log('[OpeningHookAnalyzer v2] Calling Claude API for world-class analysis...');
  const response = await callClaudeWithRetry<HookAnalysisResponse>(
    userPrompt,
    {
      systemPrompt,
      temperature: 0.4, // Slightly higher for creative literary analysis
      maxTokens: 4000,  // Need more tokens for deep analysis
      useJsonMode: true,
    }
  );

  // Parse response
  const analysisData = typeof response.content === 'string'
    ? JSON.parse(response.content)
    : response.content;

  console.log(`[OpeningHookAnalyzer v2] ✓ Analysis complete: ${analysisData.hook_type} (${analysisData.effectiveness_score}/10)`);

  // Structure final analysis
  const analysis: HookAnalysis = analysisData;

  // Cache result
  analysisCache.set(cacheKey, analysis);

  return analysis;
}

// ============================================================================
// SYSTEM PROMPT (World-Class Analysis Framework)
// ============================================================================

function buildWorldClassSystemPrompt(): string {
  return `You are an ELITE narrative craft analyst combining expertise from:
- Pulitzer Prize-winning memoirists (Tara Westover, Chanel Miller, Mary Karr)
- New Yorker essay editors who see 10,000+ submissions yearly
- Top literary magazine editors (The Atlantic, Harper's, Paris Review)
- Harvard/Stanford admissions officers who read 50,000+ essays
- MFA creative writing faculty specializing in personal essay

Your task is to analyze opening hooks at a level FAR BEYOND what ChatGPT provides.

# WORLD-CLASS HOOK REPERTOIRE

## BASIC HOOKS (8 types - what most students/analyzers know)
1. **Paradox**: "Should have been X, instead Y" - Creates cognitive dissonance
2. **Scene Tension**: Drop into crisis moment - Generates urgency
3. **Provocative Question**: Forces reader engagement - But often weak if rhetorical
4. **Sensory Immersion**: Vivid sensory details - Engages reader's senses immediately
5. **Vulnerability First**: Raw emotion upfront - Risky; can feel manufactured
6. **Philosophical Frame**: Universal truth - Can be generic without specificity
7. **Backstory**: Chronological setup - Usually weak; delays engagement
8. **Generic Resume**: Credential-focused - Almost always fails

## ADVANCED LITERARY TECHNIQUES (13 types - MFA level)
9. **In Medias Res**: True middle-of-action start - Not just "crisis moment" but actual narrative midpoint
   - Example: "The server crashed at 11:47 PM" (but only if essay doesn't explain backstory for paragraphs)

10. **Dual Timeline**: Past/present interwoven from first line
    - Example: "I'm standing at the podium now, but I'm also back in that library, alone"

11. **Second Person Immersion**: "You" pulls reader into experience
    - Risky: Can feel gimmicky if not sustained

12. **Epistolary Opening**: Letter/address format
    - Example: "Dear whoever finds this robot in the rubble..."

13. **Internal/External Contrast**: Inner thought vs. outer reality in same opening
    - Example: "I smiled at the team. Inside, I was screaming."

14. **Anaphora Opening**: Repetition for rhythm
    - Example: "I am the girl who... I am the student who... I am the leader who..."

15. **Negative Space**: What's NOT said defines opening
    - Example: "Nobody talks about what happens after you win."

16. **Dialogue Cold Open**: Start with dialogue (risky but can be powerful)
    - Example: '"We\'re screwed," Leo said, and I knew he was right.'

17. **False Certainty**: Statement that essay will undermine
    - Example: "I knew exactly how to be a leader. I was wrong."

18. **Catalog Opening**: List that builds to revelation
    - Example: "Three wires. Two motors. One microcontroller. Zero idea what went wrong."

19. **Sensory Deprivation**: Absence of expected senses
    - Example: "The robotics lab was silent. That's how I knew we'd lost."

20. **Metaphor Architecture**: Extended metaphor structures whole essay
    - Example: "Leadership is debugging. You don't start with the error message; you start with what works."

21. **Present Tense Urgency**: Present tense for immediacy even describing past
    - Example: "I am staring at the code. It stares back."

## WORLD-CLASS MEMOIR TECHNIQUES (6 types - Award-winning)
22. **Fragmented Memory**: Incomplete memory reveals psychology
    - Example: "I remember the smell—burnt plastic—but not his face when he quit."
    - Why it works: The gaps ARE the meaning

23. **Object as Lens**: Physical object as entry point to larger meaning
    - Example: "The robot's left wheel still spins when I touch it."
    - See: "Educated" (Tara Westover's opening with the mountain)

24. **Temporal Disruption**: Time moves non-linearly from first line
    - Example: "This moment—now—will matter in three months. But I don't know that yet."

25. **Voice as Hook**: Distinctive voice IS the hook
    - Example: "Look. I'm not a natural leader. I'm the kid who debugs alone."
    - See: Chanel Miller's "Know My Name" opening

26. **Thematic Image**: Image encodes essay's whole meaning
    - Example: "The circuit board looked like a city from above: tiny paths leading nowhere."

27. **Circular Structure Signal**: Opening hints at circular return
    - Example: "I'm back in the supply closet. But this time, it's different."

# NARRATIVE ARCHITECTURE ANALYSIS

Evaluate how the hook sets up the essay's architecture:

1. **Central Tension Establishment**
   - Does the hook establish the core conflict/question the essay explores?
   - Is there a clear "before/after" implied or a transformation promised?

2. **Thematic Throughline**
   - Can you identify the essay's theme from the opening?
   - Does the hook encode the essay's meaning, not just its content?

3. **Transformation Foreshadowing**
   - Does the opening hint at the change/growth to come?
   - Is there dramatic irony (reader knows more than narrator did)?

4. **Tonal Consistency**
   - Read the FULL essay: Does tone shift jarring or evolve naturally?
   - Is the voice in the opening sustained throughout?

# CRAFT ELEMENT ANALYSIS

## Sentence Rhythm
- **Staccato**: Short, punchy sentences (3-5 words) create urgency
  - Example: "The server crashed. My code—gone. Competition in 13 hours."
- **Flowing**: Longer sentences (15-25 words) create immersion
  - Example: "I had spent seventeen years believing leadership meant having all the answers, never showing weakness."
- **Strategic Variation**: Mix for emphasis and control

## Sound Devices
- **Alliteration**: "The server crashed at 11:47 PM, taking three months of code with it."
  - Listen for: Repeated consonant sounds
- **Assonance**: "I froze, knowing the code was broken beyond hope."
  - Listen for: Repeated vowel sounds
- **Consonance**: "The robot limped across the mat, its left wheel scraping."
  - Listen for: Repeated consonant sounds in middle/end

## Voice Distinction
- Is this voice distinctive enough to identify this writer from 50 others?
- Does it sound like a real 17-year-old or a 40-year-old trying to sound young?
- Comparable to which published memoirist/essayist?

## Imagery Sophistication
- **Hyperspecific**: "11:47 PM", "$800", "three seniors walked out"
- **Concrete/Abstract Balance**: Physical details vs. conceptual framing
- **Sensory Layers**: How many senses engaged? (Award-winning: 3+)

# WORLD-CLASS COMPARISON

Compare to actual award-winning hooks:

**"Educated" by Tara Westover**:
"My strongest memory is not a memory. It's something I imagined, then came to remember as if it had happened."
- Why it works: Paradox + fragmented memory + voice + thematic image (unreliable memory)

**"Know My Name" by Chanel Miller**:
"My name is Chanel. I am a victim, and I am an artist."
- Why it works: False certainty (she'll redefine "victim") + voice as hook + anaphora

**"The Glass Castle" by Jeannette Walls**:
"I was sitting in a taxi, wondering if I had overdressed for the evening, when I looked out the window and saw Mom rooting through a Dumpster."
- Why it works: Dual timeline + internal/external contrast + sensory immersion

**New Yorker Essay Style**:
Often: Object as lens + thematic image + literary present tense
Example pattern: "The [object] sits on my desk. It [action]. I [present tense reflection]."

# YOUR ANALYSIS MUST INCLUDE

Return comprehensive JSON with:

{
  "hook_type": "One of 27 types listed above",
  "hook_tier": "world_class | strong | adequate | weak | generic",
  "effectiveness_score": 0-10,

  "literary_techniques": [
    {
      "technique": "Specific technique name",
      "sophistication_level": "MFA | advanced | competent | basic",
      "evidence": "Quote showing this technique"
    }
  ],

  "craft_elements": {
    "sentence_rhythm": {
      "assessment": "Describe rhythm pattern",
      "word_count": number,
      "avg_sentence_length": number,
      "rhythm_pattern": "varied | monotonous | strategic",
      "evidence": "Quote"
    },
    "sound_devices": {
      "alliteration": ["examples"],
      "assonance": ["examples"],
      "consonance": ["examples"],
      "overall_quality": "masterful | effective | subtle | absent"
    },
    "voice_distinction": {
      "authentic": true/false,
      "distinctive": true/false,
      "voice_quality": "Description",
      "comparable_to": "Which published author/style"
    },
    "imagery_sophistication": {
      "concrete_abstract_ratio": "Describe",
      "specificity_level": "hyperspecific | specific | general | vague",
      "sensory_layers": number,
      "examples": ["quotes"]
    }
  },

  "narrative_setup": {
    "central_tension_established": true/false,
    "thematic_throughline_visible": true/false,
    "transformation_foreshadowed": true/false,
    "narrative_arc_implied": "clear | emerging | unclear",
    "setup_assessment": "Detailed assessment"
  },

  "hook_story_fit": {
    "tonal_consistency": {
      "score": 0-10,
      "assessment": "Detailed assessment",
      "tone_shifts": ["Where tone breaks"]
    },
    "opening_to_body_flow": {
      "score": 0-10,
      "transition_quality": "seamless | smooth | jarring | disconnected",
      "flow_assessment": "Detailed"
    },
    "hook_promise_delivered": {
      "promise": "What hook promises reader",
      "delivery": true/false,
      "delivery_assessment": "Does essay deliver?"
    },
    "opening_conclusion_relationship": {
      "structure": "circular | evolved | contrasted | disconnected",
      "sophistication": "Describe sophistication"
    }
  },

  "world_class_comparison": {
    "comparable_to": "Which award-winning work",
    "what_makes_it_work": ["Specific elements"],
    "what_would_elevate_it": ["Specific improvements"],
    "exemplar_hooks": [
      {
        "type": "hook_type",
        "example": "Full example hook",
        "source": "Book/publication",
        "why_it_works": "Detailed explanation"
      }
    ]
  },

  "strategic_assessment": {
    "reader_engagement_mechanics": ["How it hooks reader"],
    "subtext_layers": ["What's implied but not stated"],
    "implied_stakes": ["What's at risk"],
    "narrative_promises": ["What essay promises to explore"]
  },

  "components": {
    "specificity": true/false,
    "immediacy": true/false,
    "tension": true/false,
    "sensory_details": true/false,
    "concise": true/false
  },

  "strengths": ["Detailed strength with WHY"],
  "weaknesses": ["Detailed weakness with WHY"],

  "upgrade_path": {
    "quick_fix": "Immediate improvement",
    "strategic_rewrite": "Deeper structural change",
    "world_class_transformation": {
      "technique_to_add": "Specific literary technique",
      "literary_device": "Device to employ",
      "craft_enhancement": "Craft element to improve",
      "example_before": "Current hook",
      "example_after": "Transformed hook",
      "why_this_elevates": "What makes this world-class"
    }
  },

  "ao_research_alignment": "How this matches/violates AO preferences",
  "award_winning_patterns": ["Which patterns from award-winning works present"]
}

Return ONLY valid JSON, no markdown.`;
}

// ============================================================================
// USER PROMPT
// ============================================================================

function buildWorldClassUserPrompt(
  opening: string,
  fullEssay: string,
  essayType: string,
  depth: 'quick' | 'comprehensive'
): string {
  const depthGuidance = {
    quick: 'Focus on hook classification, top 3 craft elements, and primary upgrade path.',
    comprehensive: 'Provide exhaustive analysis of all 27 hook types, all craft elements, full narrative architecture assessment, and comprehensive world-class comparisons.',
  };

  return `Analyze this opening hook with the sophistication of a Pulitzer Prize-winning memoirist + New Yorker editor + Harvard AO.

**Opening (First 1-3 Sentences)**:
"""
${opening}
"""

**Full Essay Context** (Read carefully - you'll evaluate hook-to-story fit):
"""
${fullEssay}
"""

**Essay Type**: ${essayType}
**Analysis Depth**: ${depth}
${depthGuidance[depth]}

# YOUR TASK

Provide analysis that goes FAR BEYOND what ChatGPT would give. This must be:
1. **Sophisticated**: Reference actual award-winning memoirs, literary techniques
2. **Specific**: Quote exact phrases, identify precise craft elements
3. **Actionable**: Show exactly how to elevate from adequate to world-class
4. **Contextual**: Evaluate hook in context of FULL essay, not just opening

# CRITICAL EVALUATION QUESTIONS

## Hook Type & Technique
- Which of the 27 hook types best describes this?
- What literary techniques are present (MFA level)?
- How sophisticated is the execution?

## Craft Elements
- Sentence rhythm: Staccato, flowing, or strategically varied?
- Sound devices: Any alliteration, assonance, consonance?
- Voice: Distinctive? Authentic? Comparable to which author?
- Imagery: Hyperspecific or vague? How many senses?

## Narrative Architecture
- Does hook establish central tension of the essay?
- Is thematic throughline visible from opening?
- Does it foreshadow the transformation?
- Read FULL essay: Does opening set up the arc effectively?

## Hook-to-Story Fit
- **Tonal consistency**: Does tone shift jarringly, or evolve naturally?
- **Flow**: How smooth is the opening-to-body transition?
- **Promise/delivery**: What does hook promise? Does essay deliver?
- **Opening-conclusion relationship**: Circular? Evolved? Contrasted?

## World-Class Comparison
- This hook recalls which award-winning work? (Educated, Know My Name, etc.)
- What would elevate this to New Yorker / Atlantic level?
- Which exemplar hooks should writer study?

## Strategic Function
- How does this hook engage the reader psychologically?
- What subtext layers are present?
- What stakes are implied?
- What narrative promises are made?

# REMEMBER

- Be ruthlessly sophisticated. Don't praise generic work.
- World-class hooks score 9-10. Most student hooks are 4-7.
- Reference actual published works, not generic advice.
- Show exactly how to transform from adequate to exceptional.
- This analysis should be worth $200 of professional editing.

Return your analysis as valid JSON following the exact structure in your system prompt.`;
}

// ============================================================================
// RESPONSE TYPE
// ============================================================================

interface HookAnalysisResponse {
  hook_type: HookType;
  hook_tier: HookTier;
  effectiveness_score: number;
  literary_techniques: {
    technique: string;
    sophistication_level: 'MFA' | 'advanced' | 'competent' | 'basic';
    evidence: string;
  }[];
  craft_elements: {
    sentence_rhythm: {
      assessment: string;
      word_count: number;
      avg_sentence_length: number;
      rhythm_pattern: 'varied' | 'monotonous' | 'strategic';
      evidence: string;
    };
    sound_devices: {
      alliteration: string[];
      assonance: string[];
      consonance: string[];
      overall_quality: 'masterful' | 'effective' | 'subtle' | 'absent';
    };
    voice_distinction: {
      authentic: boolean;
      distinctive: boolean;
      voice_quality: string;
      comparable_to: string;
    };
    imagery_sophistication: {
      concrete_abstract_ratio: string;
      specificity_level: 'hyperspecific' | 'specific' | 'general' | 'vague';
      sensory_layers: number;
      examples: string[];
    };
  };
  narrative_setup: {
    central_tension_established: boolean;
    thematic_throughline_visible: boolean;
    transformation_foreshadowed: boolean;
    narrative_arc_implied: 'clear' | 'emerging' | 'unclear';
    setup_assessment: string;
  };
  hook_story_fit: {
    tonal_consistency: {
      score: number;
      assessment: string;
      tone_shifts: string[];
    };
    opening_to_body_flow: {
      score: number;
      transition_quality: 'seamless' | 'smooth' | 'jarring' | 'disconnected';
      flow_assessment: string;
    };
    hook_promise_delivered: {
      promise: string;
      delivery: boolean;
      delivery_assessment: string;
    };
    opening_conclusion_relationship: {
      structure: 'circular' | 'evolved' | 'contrasted' | 'disconnected';
      sophistication: string;
    };
  };
  world_class_comparison: {
    comparable_to: string;
    what_makes_it_work: string[];
    what_would_elevate_it: string[];
    exemplar_hooks: {
      type: HookType;
      example: string;
      source: string;
      why_it_works: string;
    }[];
  };
  strategic_assessment: {
    reader_engagement_mechanics: string[];
    subtext_layers: string[];
    implied_stakes: string[];
    narrative_promises: string[];
  };
  components: {
    specificity: boolean;
    immediacy: boolean;
    tension: boolean;
    sensory_details: boolean;
    concise: boolean;
  };
  strengths: string[];
  weaknesses: string[];
  upgrade_path: {
    quick_fix: string;
    strategic_rewrite: string;
    world_class_transformation: {
      technique_to_add: string;
      literary_device: string;
      craft_enhancement: string;
      example_before: string;
      example_after: string;
      why_this_elevates: string;
    };
  };
  ao_research_alignment: string;
  award_winning_patterns: string[];
}

// ============================================================================
// CACHING
// ============================================================================

const analysisCache = new Map<string, HookAnalysis>();

function getCacheKey(text: string, depth: string): string {
  return `hook-v2-${text.substring(0, 150)}-${depth}`;
}

// ============================================================================
// BATCH ANALYSIS
// ============================================================================

/**
 * Analyze opening hooks for multiple essays in parallel
 */
export async function analyzeOpeningHookBatch(
  essays: string[],
  options: {
    depth?: 'quick' | 'comprehensive';
    essayType?: 'leadership' | 'challenge' | 'creative' | 'academic' | 'growth';
    concurrencyLimit?: number;
  } = {}
): Promise<HookAnalysis[]> {
  const concurrencyLimit = options.concurrencyLimit || 3;
  const results: HookAnalysis[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < essays.length; i++) {
    const essay = essays[i];

    const promise = analyzeOpeningHook(essay, options)
      .then(result => {
        results[i] = result;
      });

    executing.push(promise);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
