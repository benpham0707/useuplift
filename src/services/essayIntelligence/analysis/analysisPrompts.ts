/**
 * Analysis Prompts — All LLM prompts for Layers 2-5
 *
 * System prompts are STATIC and CACHEABLE across calls.
 * User prompts contain per-request dynamic data.
 *
 * Prompt caching strategy:
 *   - System prompts are ~1000-1500 tokens each, cached via cacheSystemPrompt: true
 *   - For Layer 3, the essay text is included in the system prompt so it's
 *     cached across all paragraph calls (only RunningUnderstanding + per-paragraph
 *     data changes between calls)
 */

import type { WorkshopEssayType, ReadinessLevel } from '../types';

// ============================================================================
// LAYER 2: STRUCTURAL CARTOGRAPHY (Haiku)
// ============================================================================

export function buildStructuralMapSystemPrompt(): string {
  return `You are an expert structural analyst specializing in college application essays. Your task is to produce a structural map of the essay — identifying what each paragraph does, how they connect, and what the overall architecture looks like.

You analyze STRUCTURE, not quality. You map the terrain.

OUTPUT FORMAT: Respond with a single JSON object matching this schema exactly:

{
  "paragraphRoles": [
    {
      "index": 0,
      "role": "string — what this paragraph actually does (e.g., 'Sets the scene with sensory grounding')",
      "narrativeFunction": "string — what role it plays in the essay's arc (e.g., 'Establishes stakes before the turn')",
      "strengthContribution": "string — what this paragraph contributes most strongly (e.g., 'Strongest paragraph for specificity')",
      "weaknessFlag": "string | null — any structural concern (e.g., 'Summarizes when it should show')"
    }
  ],
  "arcType": "man_in_hole | cinderella | icarus | quest | rags_to_riches | ambiguous",
  "arcConfidence": 0.0-1.0,
  "arcVerification": "string — whether you agree/disagree with the heuristic arc detection and why",
  "transitions": [
    {
      "fromParagraph": 0,
      "toParagraph": 1,
      "quality": "seamless | functional | abrupt | missing",
      "mechanism": "string — how the transition works (e.g., 'Temporal shift', 'Emotional contrast')"
    }
  ],
  "centralTheme": "string — the central thematic through-line",
  "themeProgression": "string — how the theme develops across paragraphs",
  "thematicGaps": ["string — where the theme drops out or loses focus"],
  "pacingNotes": "string — overall pacing assessment",
  "flatSpots": [0] // paragraph indices where energy drops
}`;
}

export function buildStructuralMapUserPrompt(
  essayText: string,
  paragraphData: Array<{
    index: number;
    function: string;
    confidence: number;
    specificity: number;
    sceneOrSummary: string;
    tensionLevel: number;
    emotionalIntensity: number;
  }>,
  narrativeArcHeuristic: string,
  emotionalJourneySummary: string,
): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim());
  const markedEssay = paragraphs.map((p, i) => `[P${i + 1}] ${p.trim()}`).join('\n\n');

  const metricsBlock = paragraphData.map(p =>
    `P${p.index + 1}: function=${p.function}(${(p.confidence * 100).toFixed(0)}%), specificity=${p.specificity}/100, ${p.sceneOrSummary}, tension=${p.tensionLevel}/10, emotion_intensity=${(p.emotionalIntensity * 100).toFixed(0)}%`
  ).join('\n');

  return `ESSAY TEXT:
${markedEssay}

LAYER 1 METRICS (deterministic analysis):
${metricsBlock}

HEURISTIC ARC DETECTION: ${narrativeArcHeuristic}
EMOTIONAL JOURNEY: ${emotionalJourneySummary}

Produce the structural map as JSON.`;
}

// ============================================================================
// LAYER 3: SEQUENTIAL DEEP WALK (Sonnet)
// ============================================================================

/**
 * The system prompt for Layer 3 is THE MOST IMPORTANT prompt in the system.
 * It defines the output schema for both ParagraphDeepAnalysis and RunningUnderstanding.
 * It is CACHED across all paragraph calls for the same essay.
 */
export function buildDeepWalkSystemPrompt(essayType: WorkshopEssayType): string {
  const essayTypeContext = getEssayTypeContext(essayType);

  return `You are the world's most perceptive essay reader — an expert who has reviewed thousands of college application essays and can detect nuance that others miss. You analyze essays paragraph by paragraph, building a compounding understanding.

ESSAY TYPE CONTEXT: ${essayTypeContext}

YOUR TASK: Analyze the specified paragraph in depth (5 angles), then update your running understanding of the entire essay.

You will receive:
1. The full essay text (with paragraph markers)
2. Which paragraph to analyze
3. Deterministic metrics for that paragraph
4. Structural information about that paragraph's role
5. Your running understanding from all previously analyzed paragraphs

You must produce a JSON response with exactly two top-level keys:

{
  "paragraphAnalysis": {
    "paragraphIndex": number,
    "structural": {
      "actualRole": "What this paragraph actually does",
      "intendedRole": "What it seems to be trying to do",
      "roleEffectiveness": 0-100,
      "placementVerdict": "Is this paragraph in the right place?",
      "essentialContent": "What must this paragraph contain?",
      "currentGaps": ["What's missing"],
      "connectionToPrior": "How it links to previous paragraph" | null,
      "connectionToNext": "What it sets up" | null
    },
    "rhetoric": {
      "primaryClaim": "What is this paragraph arguing/showing?" | null,
      "evidenceQuality": 0-100,
      "evidenceTypes": ["anecdotal", "quantitative", "sensory", "emotional"],
      "persuasiveness": 0-100,
      "redundancyWithOtherParagraphs": "description" | null,
      "uniqueContribution": "What this paragraph adds that no other does"
    },
    "emotional": {
      "emotionalRegister": "e.g., quiet determination, raw vulnerability",
      "voiceAuthenticity": 0-100,
      "emotionalDepth": 0-100,
      "showVsTellVerdict": "Does it SHOW emotion or just state it?",
      "strongestEmotionalMoment": "Quote the most powerful line" | null,
      "emotionalGap": "Where emotion is claimed but not earned" | null
    },
    "craft": {
      "sentenceRhythmAssessment": "Varied and purposeful, or monotonous?",
      "wordChoiceHighlights": [
        {"word": "string", "verdict": "excellent|adequate|weak|wrong", "reason": "string", "alternative": "string" | null}
      ],
      "imageQuality": 0-100,
      "voiceConsistency": 0-100,
      "craftStandout": "Best craft moment" | null,
      "craftWeakness": "Worst craft moment" | null
    },
    "sentences": [
      {
        "index": 0,
        "text": "The sentence text",
        "role": "What this sentence does in the paragraph",
        "effectiveness": 0-100,
        "isStrength": true|false,
        "issue": "Primary issue" | null,
        "suggestion": "How to improve" | null,
        "rewriteExample": "Concrete alternative" | null,
        "wordFlags": [{"word": "string", "issue": "string", "alternative": "string"}]
      }
    ],
    "overallScore": 0-100,
    "topStrength": "The best thing about this paragraph",
    "topImprovement": "The single highest-ROI change",
    "admissionsImpact": "How an AO would read this paragraph"
  },
  "updatedUnderstanding": {
    "emergingThesis": "Updated thesis after this paragraph",
    "thesisConfidence": 0-100,
    "thematicThreads": [
      {"thread": "string", "introducedAt": 0, "lastSeenAt": 0, "strength": "dominant|supporting|hinted|dropped"}
    ],
    "arcSoFar": "e.g., Grounding → Stakes → Escalation",
    "arcType": "man_in_hole|cinderella|icarus|quest|rags_to_riches|ambiguous" | null,
    "currentMomentum": "building|sustaining|releasing|stalling",
    "turningPointDetected": null | paragraph_index,
    "voiceFingerprint": {
      "dominantRegister": "e.g., earnest and reflective",
      "authenticMoments": ["Best quotes across paragraphs"],
      "voiceDrifts": [{"paragraph": 0, "from": "string", "to": "string"}],
      "consistencyScore": 0-100
    },
    "emotionalArc": [
      {"paragraph": 0, "register": "string", "depth": 0-100, "isEarned": true|false}
    ],
    "emotionalPeak": {"paragraph": 0, "moment": "string"} | null,
    "strengthsFound": [
      {"quality": "string", "paragraph": 0, "evidence": "specific quote"}
    ],
    "weaknessesFound": [
      {"quality": "string", "paragraph": 0, "description": "string", "severity": "critical|significant|minor"}
    ],
    "connections": [
      {"type": "callback|contrast|escalation|parallel|contradiction", "paragraphs": [0, 1], "description": "string"}
    ],
    "redundancies": [
      {"paragraphs": [0, 1], "overlappingContent": "string"}
    ],
    "aoTakeaway": "Updated AO takeaway after reading through this paragraph",
    "memorabilityFactor": "string" | null,
    "revealedQualities": ["qualities the student has shown so far"]
  }
}

CRITICAL INSTRUCTIONS:
- The updatedUnderstanding MUST include ALL information from previous paragraphs plus new insights from this one. It GROWS, never shrinks.
- Be specific: quote actual text, cite specific sentences, reference paragraph numbers.
- For the first paragraph, everything is new. For later paragraphs, UPDATE existing entries and ADD new ones.
- Voice authenticity: Does this sound like a real 17-year-old? Or does it sound "written by AI" or "polished by an adult"?
- AO perspective: What would an admissions officer think after reading this paragraph in context of everything before it?
- Score honestly: 50 is average, not bad. 70+ is genuinely good. 90+ is exceptional and rare.`;
}

export function buildDeepWalkUserPrompt(
  essayText: string,
  paragraphIndex: number,
  paragraphText: string,
  layer1Metrics: string,
  layer2Info: string,
  runningUnderstandingText: string,
  voiceProfileBlock: string | null,
  totalParagraphs: number,
): string {
  const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim());
  const markedEssay = paragraphs.map((p, i) => {
    const marker = i === paragraphIndex ? `>>> [P${i + 1}] <<<` : `[P${i + 1}]`;
    return `${marker} ${p.trim()}`;
  }).join('\n\n');

  let prompt = `FULL ESSAY (${totalParagraphs} paragraphs):
${markedEssay}

=== ANALYZING PARAGRAPH ${paragraphIndex + 1} OF ${totalParagraphs} ===
${paragraphText}

LAYER 1 METRICS FOR THIS PARAGRAPH:
${layer1Metrics}

STRUCTURAL ROLE (Layer 2):
${layer2Info}

${runningUnderstandingText}`;

  if (voiceProfileBlock) {
    prompt += `\n\nVOICE PROFILE:\n${voiceProfileBlock}`;
  }

  prompt += '\n\nProduce the JSON analysis for this paragraph and update the running understanding.';
  return prompt;
}

// ============================================================================
// LAYER 4: CRYSTALLIZATION (Sonnet)
// ============================================================================

export function buildCrystallizationSystemPrompt(): string {
  return `You are crystallizing a deep, multi-paragraph essay analysis into a compressed "Essay DNA" profile. This profile will be used in every future interaction about this essay, so it must be precise, specific, and high-signal.

You will receive:
1. The complete running understanding (accumulated from paragraph-by-paragraph analysis)
2. Paragraph score summaries
3. Structural map summary

Your job is NOT to re-analyze. The analysis is done. Your job is to FORMALIZE it into the Essay DNA structure.

OUTPUT FORMAT: Respond with a single JSON object:

{
  "thesis": "What this essay is really about (1 sentence)",
  "emotionalCore": "The feeling driving the essay",
  "studentIntent": "What the student is trying to say",
  "committeePitch": "What an AO would tell the committee",
  "memorabilityFactor": "What makes this unforgettable (or what's missing)",
  "structuralStrategy": "e.g., Circular narrative with sensory grounding",
  "arcType": "man_in_hole|cinderella|icarus|quest|rags_to_riches|ambiguous",
  "bestBeat": "The strongest narrative moment",
  "missingBeat": "What the arc needs" | null,
  "voiceSignature": "e.g., Direct, visceral, fragmented sentences",
  "authenticPhrases": ["3-5 phrases that are genuinely this student"],
  "voiceRisks": ["Where voice slips into generic"],
  "topStrengths": [
    {"quality": "string", "evidence": "specific quote", "paragraphs": [0, 1]}
  ],
  "topImprovements": [
    {
      "quality": "string",
      "currentState": "How it is now",
      "targetState": "How it should be",
      "suggestedPath": "How to get there",
      "paragraphs": [0],
      "expectedImpact": "transformative|significant|moderate"
    }
  ],
  "applicationFit": "How well this essay works for college applications",
  "uniqueReveals": ["What qualities this essay reveals about the student"],
  "redundancyRisks": ["What this essay overlaps with in a typical portfolio"],
  "overallEQI": 0-100,
  "impressionLabel": "arresting_deeply_human|compelling_clear_voice|competent_needs_texture|readable_but_generic|template_like_rebuild",
  "readinessLevel": "needs_major_revision|developing|solid_draft|near_final|polished"
}

Be honest and specific. Avoid platitudes. Quote actual text. The best Essay DNAs are ones where you could reconstruct the essay's essence from just this profile.`;
}

export function buildCrystallizationUserPrompt(
  finalRunningUnderstanding: string,
  paragraphScores: string,
  structuralSummary: string,
): string {
  return `ACCUMULATED UNDERSTANDING (from paragraph-by-paragraph deep analysis):
${finalRunningUnderstanding}

PARAGRAPH SCORES:
${paragraphScores}

STRUCTURAL SUMMARY:
${structuralSummary}

Crystallize this into the Essay DNA JSON.`;
}

// ============================================================================
// LAYER 5: TARGETED ANNOTATION (Sonnet)
// ============================================================================

export function buildAnnotationSystemPrompt(readinessLevel: ReadinessLevel): string {
  const densityGuide = getAnnotationDensityGuide(readinessLevel);

  return `You are generating precise, actionable inline annotations for a college application essay. Your annotations are informed by a deep analysis that has already been completed — you reference specific findings from that analysis.

ANNOTATION DENSITY: ${densityGuide}

Each annotation must:
1. Target a SPECIFIC text span (quote it exactly)
2. Reference the deeper analysis ("The paragraph analysis identified this as...")
3. Be actionable — not just "this could be better" but "do THIS specifically"
4. Include a granularity level: "paragraph" (restructure), "sentence" (rewrite), or "word" (swap)

OUTPUT FORMAT: Respond with a JSON array of annotations:

[
  {
    "span": {
      "text": "exact quoted text from the essay",
      "paragraphIndex": 0
    },
    "dimensionId": "one of the 13 essay dimensions",
    "severity": "critical|important|suggestion|strength",
    "isStrength": false,
    "insight": "What you observe + why it matters (1-3 sentences, mentor voice)",
    "suggestion": "Concrete direction to improve (1-2 sentences)",
    "rewriteExample": "Optional concrete rewrite" | null,
    "confidence": 0.0-1.0,
    "granularityLevel": "paragraph|sentence|word",
    "sourceAnalysis": "Reference to the deeper analysis finding that informs this",
    "priorityRank": 1-N | null
  }
]

DIMENSION IDS: argument_rhetorical_craft, narrative_engagement, emotional_authenticity, concrete_specificity, language_precision, structural_coherence, voice_distinctiveness, reflective_depth, cultural_awareness, audience_calibration, intellectual_vitality, creative_risk, thematic_unity

RULES:
- Strengths first: lead with 2-3 genuine strengths before issues
- Prioritize: the most impactful changes first
- Be specific: "Replace 'made an impact' with what you actually did" not "use stronger verbs"
- No meta-commentary: don't say "this annotation targets..." — just give the feedback
- Match the student's maturity level in your tone`;
}

export function buildAnnotationUserPrompt(
  contextBlock: string,
  essayText: string,
): string {
  return `ANALYSIS CONTEXT:
${contextBlock}

ESSAY TEXT:
${essayText}

Generate the annotation array as JSON.`;
}

// ============================================================================
// HELPERS
// ============================================================================

function getEssayTypeContext(essayType: WorkshopEssayType): string {
  const contexts: Record<WorkshopEssayType, string> = {
    personal_statement: 'Common App personal statement (650 words max). Should reveal character, values, and growth through a specific narrative. Voice and authenticity matter most.',
    uc_piq: 'UC Personal Insight Question (350 words max). Concise, focused, and specific. Should demonstrate a single quality or experience clearly.',
    why_us: '"Why Us" supplemental essay. Must show genuine, specific knowledge of the school and articulate mutual fit.',
    community: 'Community/belonging essay. Should show how the student contributes to and is shaped by their communities.',
    challenge_adversity: 'Challenge/adversity essay. Must show growth without being trauma-focused. AOs look for resilience and reflection.',
    intellectual_vitality: 'Intellectual vitality/curiosity essay. Should show genuine passion and depth of engagement with ideas.',
    activity_to_essay: 'Activity description expanded into essay form. Should go beyond resume-listing to show meaning and impact.',
    identity_background: 'Identity/background essay. Should show how identity shapes perspective without being reductive.',
    analytical: 'Analytical/academic essay. Should demonstrate critical thinking and intellectual engagement.',
    other: 'General essay.',
  };
  return contexts[essayType] || contexts.other;
}

function getAnnotationDensityGuide(readinessLevel: ReadinessLevel): string {
  switch (readinessLevel) {
    case 'needs_major_revision':
      return '6-8 annotations. Focus on paragraph-level structural issues. Do NOT nitpick sentences when the foundation needs work.';
    case 'developing':
      return '8-10 annotations. Mix of paragraph-level and sentence-level. Address both structural and craft issues.';
    case 'solid_draft':
      return '10-14 annotations. Mostly sentence-level. The structure works — now refine the execution.';
    case 'near_final':
      return '12-16 annotations. Surgical sentence and word-level changes. Polish, don\'t restructure.';
    case 'polished':
      return '12-16 annotations. Surgical word-level refinements. This essay is strong — find the last 5% improvements.';
    default:
      return '8-12 annotations. Mix of paragraph and sentence level.';
  }
}
