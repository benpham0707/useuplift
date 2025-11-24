/**
 * OPENING HOOK ANALYZER V3
 *
 * V3 Improvements:
 * 1. Robust JSON parsing with multiple fallback strategies
 * 2. Storytelling/mentor layer - insights feel authentic and caring
 * 3. Principles-based analysis (not template-biased)
 * 4. Connects to their SPECIFIC story
 */

import { callClaudeWithRetry } from '../../../lib/llm/claude';

// ============================================================================
// TYPES (Same as V2 - proven structure)
// ============================================================================

export interface HookAnalysis {
  // CLASSIFICATION
  hook_type: string;
  hook_tier: 'weak' | 'adequate' | 'strong' | 'exceptional' | 'award_winning';
  effectiveness_score: number; // 0-10

  // LITERARY TECHNIQUES
  literary_techniques: {
    technique: string;
    sophistication_level: 'basic' | 'competent' | 'advanced' | 'MFA_level';
    evidence: string;
    why_it_works: string;
  }[];

  // STRATEGIC FUNCTION
  strategic_function: {
    reader_engagement_mechanics: string[];
    subtext_layers: string[];
    implied_stakes: string[];
    narrative_promises: string[];
  };

  // CRAFT ELEMENTS
  craft_elements: {
    sentence_rhythm: {
      pattern: 'staccato' | 'flowing' | 'varied' | 'monotone';
      sophistication: string;
      examples: string[];
    };
    sound_devices: {
      present: boolean;
      devices: string[]; // ["alliteration: 'burnt plastic; blurs'", ...]
      effectiveness: string;
    };
    voice_distinction: {
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

  // NARRATIVE ARCHITECTURE
  narrative_setup: {
    central_tension_established: boolean;
    thematic_throughline_visible: boolean;
    transformation_foreshadowed: boolean;
    narrative_arc_implied: 'clear' | 'emerging' | 'unclear';
    setup_assessment: string;
  };

  // HOOK-TO-STORY FIT (requires full essay)
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

  // WORLD-CLASS COMPARISON
  world_class_comparison: {
    comparable_to: string;
    what_makes_it_work: string[];
    what_would_elevate_it: string[];
    exemplar_hooks: {
      example: string;
      source: string;
      why_it_works: string;
    }[];
  };

  // NATURAL INSIGHTS (NEW in V3) - Conversational, not templated
  insights: {
    opening_analysis: string; // Natural discussion of what they're doing in their opening (quote their text!)
    why_it_works: string; // Explain the technique they're using and why it's effective for their story
    opportunity: string; // What could make this even stronger (be specific to THEIR essay)
    concrete_suggestion: string; // Show them an example transformation inline, explain the reasoning
  };

  // UPGRADE PATH
  quick_wins: string[];
  transformation_suggestion: {
    technique: string;
    before: string;
    after: string;
    why_it_elevates: string;
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

const analysisCache = new Map<string, HookAnalysis>();

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

  console.log(`[OpeningHookAnalyzer V3] Analyzing with storytelling layer (${depth} mode)`);

  // Extract opening
  const sentences = fullEssay.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const opening = sentences.slice(0, 3).join('. ') + '.';

  // Check cache
  const cacheKey = `hook-v3-${fullEssay.substring(0, 100)}-${depth}`;
  if (!options.skipCache && analysisCache.has(cacheKey)) {
    console.log('[OpeningHookAnalyzer V3] Cache HIT');
    return analysisCache.get(cacheKey)!;
  }

  // Build prompts
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(opening, fullEssay, essayType, depth);

  // Call Claude API
  console.log('[OpeningHookAnalyzer V3] Calling Claude API...');
  const response = await callClaudeWithRetry<HookAnalysis>(
    userPrompt,
    {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 4000,
      useJsonMode: true,
    }
  );

  // ROBUST JSON PARSING (V3 improvement)
  const analysis = parseJsonWithFallbacks(response.content);

  console.log(`[OpeningHookAnalyzer V3] ✓ Complete: ${analysis.hook_type} (${analysis.effectiveness_score}/10)`);

  // Cache result
  analysisCache.set(cacheKey, analysis);

  return analysis;
}

// ============================================================================
// ROBUST JSON PARSING (V3 improvement)
// ============================================================================

function parseJsonWithFallbacks(content: any): HookAnalysis {
  // Strategy 1: Already parsed
  if (typeof content === 'object' && content !== null) {
    return content as HookAnalysis;
  }

  const textContent = String(content);

  // Strategy 2: Extract from markdown code block (multiple patterns)
  const codeBlockPatterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /`json\s*([\s\S]*?)`/,
    /`\s*([\s\S]*?)`/,
  ];

  for (const pattern of codeBlockPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        continue; // Try next pattern
      }
    }
  }

  // Strategy 3: Find JSON object boundaries
  const jsonStartIdx = textContent.indexOf('{');
  const jsonEndIdx = textContent.lastIndexOf('}');
  if (jsonStartIdx !== -1 && jsonEndIdx !== -1 && jsonEndIdx > jsonStartIdx) {
    try {
      const jsonString = textContent.substring(jsonStartIdx, jsonEndIdx + 1);
      return JSON.parse(jsonString);
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 4: Clean and try direct parse
  try {
    const cleaned = textContent
      .replace(/^[^{]*/, '') // Remove leading non-JSON
      .replace(/[^}]*$/, '') // Remove trailing non-JSON
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse JSON after all strategies. Content preview: ${textContent.substring(0, 300)}...`);
  }
}

// ============================================================================
// SYSTEM PROMPT (Principles + Storytelling)
// ============================================================================

function buildSystemPrompt(): string {
  return `You are an elite narrative craft analyst AND a caring mentor who deeply understands student stories.

Your dual expertise:
1. **Technical Excellence**: MFA-level craft analysis (literary techniques, narrative architecture)
2. **Authentic Mentorship**: You connect insights to THEIR specific story, making them feel understood

# YOUR TONE AND APPROACH

You are NOT a robotic analyzer throwing technical terms at students.
You are a mentor who:
- Notices the unique details of THEIR story
- Celebrates what's working in THEIR voice
- Offers guidance that feels caring, not critical
- Provides concrete next steps they can actually use

## YOUR APPROACH: Educational Coach, Not Grading Rubric

Study these examples from our extracurricular workshop - THIS is the tone we want:

**Workshop Example (GOOD - Natural, Builds Understanding)**:
"I see you wrote: 'I lost my third debate in a row. I felt terrible and wanted to quit. But my coach told me to keep trying.'

This is progress! You're showing emotion (felt terrible) and action (kept trying). The opportunity now is to make this more SPECIFIC. Right now, 'my coach told me to keep trying' is generic advice any coach might give. Let's capture what your coach ACTUALLY said and how it changed your thinking.

Instead of: 'My coach told me to keep trying. So I practiced more and eventually got better.'

Consider: ''You're losing on facts, not arguments,' my coach said after my third straight loss. I didn't get it. 'You know the Geneva Convention backwards. But you sound like you're reading a textbook.' That's when I started recording my cross-examinations. Listening back, I heard it: defensive, robotic, zero persuasion. I began experimenting: What if I conceded their strongest point FIRST?'

Notice how this version:
- Quotes what the coach actually said
- Shows your confusion ('I didn't get it')
- Includes specific action you took (recording, listening, experimenting)
- Uses a question to show your thought process"

**Templated Approach (BAD - Formulaic, Feels Robotic)**:
"what_i_notice: I notice you're using debate as a hook
what_works_well: The emotion is authentic
growth_opportunity: Add more specificity
specific_next_step: Try quoting what your coach said"

See the difference? The first TEACHES and BUILDS UNDERSTANDING. The second just prescribes fixes without helping them understand WHY.

# HOOK TYPES (Principles-Based, Not Template-Biased)

## BASIC (8 types)
1. Paradox - cognitive dissonance
2. Scene Tension - crisis moment
3. Provocative Question - reader engagement
4. Sensory Immersion - vivid details
5. Vulnerability First - raw emotion upfront
6. Philosophical Frame - universal truth
7. Backstory - chronological setup (usually weak)
8. Generic Resume - credential-focused (almost always fails)

## ADVANCED (13 types)
9. In Medias Res - true action midpoint
10. Dual Timeline - past/present interwoven
11. Second Person Immersion - "you" pulls reader in
12. Epistolary Opening - letter format
13. Internal/External Contrast - thought vs reality
14. Anaphora Opening - repeated phrase structure
15. Catalog Opening - list that builds meaning
16. Shocking Statement - subverts expectations
17. False Certainty - seems one thing, reveals another
18. Dialogue Hook - conversation starts immediately
19. Fragmented Memory - what's NOT remembered creates meaning
20. Object as Lens - physical object reveals theme
21. Temporal Disruption - time manipulation

## AWARD-WINNING (6 types - rare)
22. Voice as Hook - distinctive voice IS the hook
23. Metaphor Architecture - extended metaphor structures entire opening
24. Negative Space - absence creates presence
25. Linguistic Play - language experimentation
26. Cultural Code-Switching - multiple languages/registers
27. Unreliable Narrator - self-awareness about memory/bias

# LITERARY CRAFT ANALYSIS

**Sentence Rhythm**: Staccato (short punchy), flowing (long lyrical), varied (strategic mix)

**Sound Devices**: Alliteration, assonance, consonance, onomatopoeia

**Voice Distinction**:
- Generic: Could be anyone's voice
- Distinctive: Unique syntax, word choice, perspective
- Comparable to: Reference published authors for context (but explain WHY)

**Imagery Sophistication**:
- Hyperspecific: "6 AM", "$800", "94th floor" (creates credibility)
- Specific: "morning", "expensive", "high floor"
- General: "early", "costly", "tall building"
- Vague: "sometime", "it cost money", "in a building"

# STORYTELLING OUTPUT STRUCTURE

You MUST include a "storytelling" section that makes insights feel authentic:

**what_i_notice**: Observation about THEIR specific story (not generic)
- Example: "I notice you're not just describing the robotics walkout—you're revealing how your brain protected you from the worst moment. The fact that you remember the scuff marks but not your words? That's your psyche's defense mechanism in action."

**what_works_well**: Authentic praise connected to their story
- Example: "What works beautifully here is how you use the theater metaphor throughout—it's not decoration, it's architecture. Act One/Act Two gives us structure while revealing your identity struggle. This is sophisticated craft."

**growth_opportunity**: Caring guidance (not harsh critique)
- Example: "The place where this could deepen: right now we see the WHAT (you felt split between worlds) but not the WHY. What made code feel safer than people? What childhood experience taught you that belonging required performance?"

**specific_next_step**: Concrete, actionable advice
- Example: "Try this: In that car scene, instead of 'I felt ashamed,' show us what shame DID to your body. Did you grip the steering wheel? Stare at your hands? Avoid your own eyes in the rearview mirror? Physical details prove the emotion is real."

# CRITICAL INSTRUCTIONS

1. **Return ONLY valid JSON** matching the structure
2. **Use principles, not templates** - explain WHY techniques work
3. **Connect to THEIR story** - reference specific details from their essay
4. **Be caring, not critical** - mentor tone, not grading tone
5. **Provide actionable guidance** - concrete next steps they can use

# REQUIRED JSON STRUCTURE

You MUST return JSON with EXACTLY this structure (no wrappers, no nesting):

{
  "hook_type": "Paradox + Vulnerability First",
  "hook_tier": "strong",
  "effectiveness_score": 8.5,

  "literary_techniques": [
    {
      "technique": "Fragmented Memory",
      "sophistication_level": "MFA_level",
      "evidence": "I remember the scuff marks but not what I said",
      "why_it_works": "Shows unconscious self-protection, reveals shame through what's NOT remembered"
    }
  ],

  "strategic_function": {
    "reader_engagement_mechanics": ["Creates intrigue", "Subverts expectations"],
    "subtext_layers": ["Hidden vulnerability"],
    "implied_stakes": ["Identity at risk"],
    "narrative_promises": ["Will explore inner conflict"]
  },

  "craft_elements": {
    "sentence_rhythm": {
      "pattern": "staccato",
      "sophistication": "Strategic variation",
      "examples": ["Short opening. Long expansion."]
    },
    "sound_devices": {
      "present": true,
      "devices": ["alliteration: 'burnt plastic'"],
      "effectiveness": "Creates tactile texture"
    },
    "voice_distinction": {
      "distinctive": true,
      "voice_quality": "Self-aware, analytical",
      "comparable_to": "Reminiscent of introspective memoirists who interrogate memory"
    },
    "imagery_sophistication": {
      "concrete_abstract_ratio": "Balanced",
      "specificity_level": "hyperspecific",
      "sensory_layers": 3,
      "examples": ["Scuff marks", "burnt plastic"]
    }
  },

  "narrative_setup": {
    "central_tension_established": true,
    "thematic_throughline_visible": true,
    "transformation_foreshadowed": true,
    "narrative_arc_implied": "clear",
    "setup_assessment": "Strong foundation"
  },

  "hook_story_fit": {
    "tonal_consistency": {
      "score": 9,
      "assessment": "Vulnerability deepens throughout",
      "tone_shifts": []
    },
    "opening_to_body_flow": {
      "score": 8,
      "transition_quality": "smooth",
      "flow_assessment": "Natural progression"
    },
    "hook_promise_delivered": {
      "promise": "Will explore failure and growth",
      "delivery": true,
      "delivery_assessment": "Fully delivered"
    },
    "opening_conclusion_relationship": {
      "structure": "evolved",
      "sophistication": "Hook vulnerability deepens by end"
    }
  },

  "world_class_comparison": {
    "comparable_to": "Uses fragmented memory principle - universal pattern where what's NOT remembered creates meaning",
    "what_makes_it_work": ["Physical details ground emotion", "Takes genuine risk"],
    "what_would_elevate_it": ["Reveal unconscious pattern", "Deepen stakes"],
    "exemplar_hooks": [
      {
        "example": "I remember the smell but not his face",
        "source": "Published memoir technique",
        "why_it_works": "Selective memory reveals psychological truth"
      }
    ]
  },

  "insights": {
    "opening_analysis": "I see you open with: 'I remember the smell—burnt plastic and metal—but not his face when he quit.' This is a really sophisticated move. You're not just describing a memory—you're showing us how your brain processed shame. The fact that you remember the SMELL but not his FACE reveals something psychological: your mind held onto sensory details but blurred the painful human element.",
    "why_it_works": "This fragmented memory technique does two things at once: (1) it creates immediate intrigue (who quit? why?), and (2) it reveals your emotional state WITHOUT you having to say 'I felt ashamed.' The selective memory itself IS the vulnerability. That's advanced craft—letting the reader infer emotion from what you choose to remember and forget.",
    "opportunity": "Right now we get this powerful opening moment, but the essay could deepen by exploring WHY connection felt so dangerous that your brain needed this defense mechanism. You mention later that you 'learned Python because talking to computers was easier than talking to people'—that's the unconscious pattern worth interrogating. What made human connection feel unsafe enough that you needed technical armor?",
    "concrete_suggestion": "Consider adding 2-3 sentences after the opening that connect the fragmented memory to the deeper pattern. For example:\n\nInstead of jumping straight to the three seniors walking out, try:\n'I remember the smell—burnt plastic and metal—but not his face when he quit. That's the thing about failure: your brain holds onto the sensory details but blurs the words, like it's protecting you from remembering exactly how you humiliated yourself. I'd spent my whole life hiding behind screens, where errors had stack traces and bugs had fixes. People didn't come with debugging tools.'\n\nNotice how this version:\n- Keeps your powerful opening intact\n- Explains the psychological mechanism (brain protecting you)\n- Connects to the larger pattern (hiding behind screens)\n- Shows your thought process (people don't have debugging tools)\n\nThis bridges the opening hook to the deeper identity question your essay is exploring."
  },

  "quick_wins": ["Add one physical detail", "Name the emotion directly"],

  "transformation_suggestion": {
    "technique": "Reveal defense mechanism",
    "before": "I used code as armor",
    "after": "I used code as armor because being GOOD at something felt like the only way to deserve belonging",
    "why_it_elevates": "Moves from behavior to unconscious belief system"
  }
}

## CRITICAL: Natural Insights Section

Your "insights" section must be CONVERSATIONAL and EDUCATIONAL, like the workshop examples:

**opening_analysis**:
- QUOTE their actual opening text
- Discuss what they're doing (not in formal terms, naturally)
- Point out the technique they're using
- Example: "I see you open with: 'I have old hands.' This immediately creates a paradox..."

**why_it_works**:
- Explain the technique in plain language
- Connect to THEIR specific essay content
- Help them understand WHY it's effective
- Example: "This works because it forces readers to reconcile..."

**opportunity**:
- What could make this stronger (specific to THEIR essay)
- Reference other parts of their essay
- Ask questions that prompt deeper thinking
- Example: "You mention later that you 'composed symphonies in margins'—what did that creative isolation cost you?"

**concrete_suggestion**:
- Show an example transformation inline
- Use "Instead of... try:" format
- Add "Notice how this version:" with bullet points explaining WHY
- Make it educational, not just prescriptive

**REMEMBER**:
- Write like you're talking to them naturally
- Quote their text specifically
- Explain WHY, don't just prescribe WHAT
- Be encouraging but honest
- Help them build understanding, not just follow instructions

**RETURN ONLY THIS EXACT STRUCTURE. NO WRAPPERS. NO MARKDOWN CODE BLOCKS.**`;
}

// ============================================================================
// USER PROMPT
// ============================================================================

function buildUserPrompt(
  opening: string,
  fullEssay: string,
  essayType: string,
  depth: 'quick' | 'comprehensive'
): string {
  return `Analyze this opening hook with world-class craft analysis AND authentic mentorship.

**Essay Type**: ${essayType}
**Analysis Depth**: ${depth}

**Opening Hook (first 1-3 sentences)**:
"""
${opening}
"""

**Full Essay (for context)**:
"""
${fullEssay}
"""

Provide ${depth} analysis with BOTH:
1. **Technical Excellence**: Literary techniques, craft elements, narrative architecture
2. **Storytelling/Mentorship**: Make insights feel authentic and connected to THEIR story

Key focus areas:
- What hook type(s) are present? (can be multiple)
- What literary techniques make it work (or limit it)?
- How does the hook set up the full essay?
- What's the tonal consistency from opening → body → conclusion?
- What would elevate this to world-class?

CRITICAL: Include the "storytelling" section that makes them feel understood:
- what_i_notice: Observation about THEIR specific story
- what_works_well: Authentic praise
- growth_opportunity: Caring guidance
- specific_next_step: Concrete action

Return ONLY valid JSON. No markdown code blocks, no extra text.`;
}

// ============================================================================
// BATCH ANALYSIS
// ============================================================================

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
      .then(result => { results[i] = result; });

    executing.push(promise);
    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
