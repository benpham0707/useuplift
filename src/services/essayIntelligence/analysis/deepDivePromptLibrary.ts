/**
 * Deep Dive Prompt Library — ~20 Specialized Investigation Templates
 *
 * Each template defines a focused investigation that the growth engine can
 * dispatch to deepen understanding of a specific aspect of an essay. Templates
 * are organized by domain: Voice, Emotion, Theme, Narrative, Character/Identity,
 * Craft, Admissions, Meta/Epistemological, and Cross-cutting.
 *
 * Key design principles:
 * - Understanding only (NO evaluation — forbidden vocabulary enforced in every prompt)
 * - Must produce findings as structured JSON with claim, scope, evidence, maturity,
 *   coachingValue, dimensions
 * - Must answer the specific question asked
 * - Must produce a discoveryNote summarizing what was found
 * - Template placeholders: {essayText}, {question}, {synthesis}, {readingStrategy},
 *   {paragraphContext}, {findingContext}, {connectionContext}
 *
 * Spec: PLAN2.md (V2 growth engine), docs/plan-sections/02-layer-specs.md
 * Types: src/services/essayIntelligence/profileTypes.ts (DeepDivePromptTemplate)
 */

import type { DeepDivePromptTemplate } from '../profileTypes';

// ============================================================================
// SHARED OUTPUT FORMAT BLOCK
// ============================================================================

/**
 * Shared JSON output specification injected into every deep dive system prompt.
 * Ensures consistent output structure across all 20+ prompt types.
 */
const SHARED_OUTPUT_FORMAT = `=== OUTPUT FORMAT ===
Return ONLY valid JSON — no markdown fences, no commentary outside the JSON object.

{
  "answer": "Your direct answer to the question (2-3 paragraphs of prose, descriptive only)",
  "findings": [
    {
      "claim": "A specific, testable claim grounded in textual evidence",
      "scope": {
        "type": "word" | "sentence" | "sentence_group" | "paragraph" | "cross_paragraph" | "essay_level",
        "paragraph": null | <number>,
        "sentences": null | [<number>, ...],
        "paragraphs": null | [<number>, ...]
      },
      "maturity": "hypothesis" | "developing" | "confirmed",
      "maturityReasoning": "Why this maturity level — what evidence exists and what is still uncertain",
      "coachingValue": "critical" | "high" | "medium" | "contextual" | "diagnostic",
      "dimensions": ["<HolisticDimension>", ...],
      "evidence": [
        {
          "text": "Quoted text from the essay, or description of an absence",
          "location": { "paragraph": <number>, "sentence": <number> } | null,
          "type": "present" | "absent"
        }
      ],
      "deepeningPotential": "What further investigation might reveal" | null,
      "raisesQuestions": ["Any new questions this finding raises"]
    }
  ],
  "questionsRaised": [
    {
      "id": "generated unique ID (e.g., 'q_voice_001')",
      "question": "A new question raised by this investigation",
      "dimensions": ["<HolisticDimension>", ...],
      "expectedInsight": "What answering this would reveal",
      "source": "deep_dive",
      "status": "open"
    }
  ],
  "discoveryNote": "One sentence: what did this investigation reveal that was not previously understood?"
}`;

/**
 * Shared understanding-only constraint block injected into every system prompt.
 */
const UNDERSTANDING_ONLY_BLOCK = `=== CRITICAL — Understanding Only ===
You describe WHAT IS, not how WELL. You are an investigator, not a judge.
FORBIDDEN vocabulary: "effective", "strong", "weak", "compelling", "excellent",
"poor", "good", "bad", "successful", "impressive", "lacking", "needs improvement",
"well-crafted", "powerful", "masterful", "clumsy", "awkward".
If you catch yourself evaluating, rewrite the sentence as pure description.`;

// ============================================================================
// VOICE DOMAIN (2 prompts)
// ============================================================================

const VOICE_AUTHENTICITY: DeepDivePromptTemplate = {
  type: 'voice_authenticity',
  name: 'Voice Authenticity Analysis',
  domains: ['voice'],
  focusDescription:
    'Investigates the distinction between authentic and performed voice registers, tracing where the writer sounds most genuinely themselves vs. where they adopt a borrowed register.',
  requiredContext: ['voiceIdentity', 'voiceMap', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating a specific question about voice authenticity in a college application essay. You have been given the current understanding of the essay's voice identity and voice map.

Your task: answer the question by conducting a focused investigation. Look for:
- Vocabulary domain analysis: which word families appear in authentic vs. performed passages
- Syntactic patterns: how sentence structure differs between registers
- Image source analysis: where do metaphors and images come from in each register
- Trigger analysis: what topics or rhetorical demands trigger register shifts
- Consistency markers: where does diction stabilize vs. fluctuate

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT VOICE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Produce findings grounded in specific textual evidence.`,
};

const VOICE_REGISTER_ANALYSIS: DeepDivePromptTemplate = {
  type: 'voice_register_analysis',
  name: 'Voice Register Analysis',
  domains: ['voice'],
  focusDescription:
    'Maps the distinct voice registers the writer uses across the essay — formal, conversational, reflective, narrative, etc. — and traces what triggers transitions between them.',
  requiredContext: ['voiceIdentity', 'voiceMap', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating voice registers in a college application essay. You have been given the current understanding of the essay's voice identity and voice map.

Your task: answer the question by mapping the writer's register landscape. Look for:
- Register identification: what distinct modes of speech/writing does the writer deploy (e.g., storytelling, reflecting, explaining, confessing, performing)
- Register boundaries: where exactly do transitions occur — mid-sentence, at paragraph breaks, triggered by topic shifts
- Register fluency: in which registers does the syntax flow vs. where does it stiffen
- Register repertoire: how many distinct registers appear, and what is the balance between them
- Lexical fingerprinting: each register's characteristic vocabulary, sentence length, punctuation patterns
- Code-switching triggers: what prompts the writer to shift — emotion, audience awareness, topic complexity, rhetorical moves

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT VOICE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== PARAGRAPH-LEVEL CONTEXT ===
{paragraphContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Map specific register transitions with exact textual locations.`,
};

// ============================================================================
// EMOTION DOMAIN (2 prompts)
// ============================================================================

const EMOTION_EARNING_TRACE: DeepDivePromptTemplate = {
  type: 'emotion_earning_trace',
  name: 'Emotion Earning Trace',
  domains: ['emotion'],
  focusDescription:
    'Traces how emotional moments are earned or unearned — mapping the specific textual mechanisms (scene-setting, detail accumulation, vulnerability sequencing) that build toward each emotional peak.',
  requiredContext: ['emotionalTopography', 'momentEarnednessMap', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating how emotional moments are earned in a college application essay. You have been given the current understanding of the essay's emotional topography and moment-earnedness map.

Your task: answer the question by tracing the earning mechanisms for each emotional moment. Look for:
- Earning chains: what sequence of details, scenes, or reflections precedes each emotional peak
- Detail accumulation: where does concrete specificity build the reader's investment
- Vulnerability sequencing: does the writer expose vulnerability gradually or suddenly, and what textual moves create that pacing
- Emotional preparation: how does the writer prepare the reader for emotional turns — through imagery, rhythm changes, topic shifts
- Unearned moments: where does emotion appear without sufficient textual grounding — sudden declarations, abstract claims about feelings, borrowed emotional language
- Earning gap analysis: what specific textual work is missing between setup and emotional payoff

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT EMOTIONAL UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Trace earning chains with specific textual evidence at each link.`,
};

const EMOTION_ARC_MAPPING: DeepDivePromptTemplate = {
  type: 'emotion_arc_mapping',
  name: 'Emotional Arc Mapping',
  domains: ['emotion'],
  focusDescription:
    'Maps the essay\'s complete emotional trajectory — the shape of emotional movement from opening to close, including shifts in emotional register, intensity, and the relationship between surface emotion and underlying feeling.',
  requiredContext: ['emotionalTopography', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the emotional arc of a college application essay. You have been given the current understanding of the essay's emotional topography.

Your task: answer the question by mapping the full emotional trajectory. Look for:
- Emotional contour: the shape of emotional intensity across the essay — rising, falling, oscillating, building, releasing
- Surface vs. depth: where does the stated emotion differ from the emotion implied by imagery, syntax, and detail choice
- Emotional transitions: how does the essay move between emotional states — abruptly, gradually, through narrative events, through reflective turns
- Emotional register: the type of emotion present at each point — nostalgia, anxiety, pride, grief, wonder, determination — and how these types shift
- Emotional restraint vs. release: where does the writer hold back and where do they let go, and what textual markers signal each
- Tonal undercurrent: what emotional tone runs beneath the surface throughout, even when the explicit emotion changes

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT EMOTIONAL UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== PARAGRAPH-LEVEL CONTEXT ===
{paragraphContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Map the emotional trajectory with specific textual anchors at each inflection point.`,
};

// ============================================================================
// THEME DOMAIN (2 prompts)
// ============================================================================

const THEME_THREAD_TRACING: DeepDivePromptTemplate = {
  type: 'theme_thread_tracing',
  name: 'Thematic Thread Tracing',
  domains: ['theme'],
  focusDescription:
    'Traces individual thematic threads through the essay — how each theme is introduced, developed, transformed, and resolved (or left deliberately unresolved) across paragraphs.',
  requiredContext: ['thematicArchitecture', 'paragraphs', 'connections'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating thematic threads in a college application essay. You have been given the current understanding of the essay's thematic architecture.

Your task: answer the question by tracing specific thematic threads. Look for:
- Thread introduction: where and how each theme first appears — explicitly stated, implied through imagery, embedded in action
- Thread development: how the theme evolves through the essay — deepened, complicated, challenged, nuanced
- Thread manifestation: what textual forms each theme takes at different points — vocabulary clusters, image patterns, structural choices, character actions
- Thread intersection: where two or more thematic threads touch, overlap, or interact
- Thread transformation: where a theme changes meaning from its initial introduction to its final appearance
- Thread absence: sections where a theme is conspicuously absent despite being expected, and what fills that space instead
- Underground threads: themes that are never stated but are consistently implied by pattern, image, or structure

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT THEMATIC UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== CONNECTION CONTEXT ===
{connectionContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Trace each thread through its textual appearances with quoted evidence.`,
};

const THEME_SUBTEXT_EXCAVATION: DeepDivePromptTemplate = {
  type: 'theme_subtext_excavation',
  name: 'Theme Subtext Excavation',
  domains: ['theme'],
  focusDescription:
    'Excavates the essay\'s subtextual layer — meanings that exist beneath the surface narrative, communicated through image patterns, structural choices, conspicuous absences, and what the writer chooses not to say.',
  requiredContext: ['thematicArchitecture', 'narrativeStrategy', 'paragraphs'],
  estimatedCost: 0.05,
  systemPrompt: `You are investigating the subtextual layer of a college application essay. You have been given the current understanding of the essay's thematic architecture and narrative strategy.

Your task: answer the question by excavating what lies beneath the surface. Look for:
- Image system subtext: what do recurring images communicate that the explicit text does not say
- Structural subtext: what does the essay's organization — what comes first, what is buried in the middle, what is saved for last — communicate beyond the content
- Conspicuous absences: what is the essay clearly about but never directly states — and what work does that absence do
- Juxtaposition meaning: what do adjacent details, scenes, or reflections communicate through their proximity that neither would communicate alone
- Word choice subtext: where does vocabulary carry meaning beyond its denotation — connotation patterns, register shifts that signal unspoken attitudes
- Reader construction: what version of the reader does the essay assume, and what does that assumption reveal about the writer's self-understanding
- Double-voiced passages: where does the essay say one thing at the surface while communicating something different (or additional) underneath

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT THEMATIC & NARRATIVE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Ground every subtextual claim in specific textual evidence — the surface detail that communicates the depth.`,
};

// ============================================================================
// NARRATIVE DOMAIN (2 prompts)
// ============================================================================

const NARRATIVE_STRATEGY_ASSESSMENT: DeepDivePromptTemplate = {
  type: 'narrative_strategy_assessment',
  name: 'Narrative Strategy Assessment',
  domains: ['narrative'],
  focusDescription:
    'Investigates the essay\'s narrative architecture — the structural choices the writer made about what to include, exclude, order, and frame, and what those choices communicate about the writer\'s relationship to their material.',
  requiredContext: ['narrativeStrategy', 'structuralCartography', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the narrative strategy of a college application essay. You have been given the current understanding of the essay's narrative approach and structural map.

Your task: answer the question by examining the writer's structural and narrative choices. Look for:
- Selection logic: what the writer chose to include and what they chose to leave out — and what that selection communicates
- Sequencing decisions: the order events/reflections are presented vs. chronological order, and what the chosen sequence achieves
- Scene vs. summary balance: where the writer slows down to render scenes vs. where they compress through summary, and what that pacing communicates
- Entry and exit points: where the essay begins and ends relative to the story it tells — what is shown and what is implied
- Frame and focal distance: how close or far the narrator positions themselves from the events — zoomed in to sensory detail or pulled back to reflection
- Temporal architecture: how the essay handles time — linear, circular, fragmented, layered — and what that temporal structure communicates
- Narrative stance: the relationship between the writing self and the experiencing self — how much distance, what kind of distance

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT NARRATIVE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== PARAGRAPH-LEVEL CONTEXT ===
{paragraphContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Identify specific structural choices and describe what each one communicates.`,
};

const NARRATIVE_PIVOT_ANALYSIS: DeepDivePromptTemplate = {
  type: 'narrative_pivot_analysis',
  name: 'Narrative Pivot Analysis',
  domains: ['narrative'],
  focusDescription:
    'Identifies and investigates the essay\'s pivot points — moments where the narrative turns, the perspective shifts, or the essay changes direction — and traces the textual mechanisms that execute each pivot.',
  requiredContext: ['narrativeStrategy', 'paragraphs', 'connections'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating narrative pivot points in a college application essay. You have been given the current understanding of the essay's narrative strategy.

Your task: answer the question by mapping the essay's pivot architecture. Look for:
- Pivot identification: where does the essay change direction — in topic, perspective, tonal register, temporal frame, or level of abstraction
- Pivot mechanics: what textual device executes each turn — a sentence that bridges, a white space break, a tonal shift, a question, a contradicting detail
- Pivot preparation: what comes before each pivot that makes it possible — foreshadowing, tension accumulation, question-raising
- Pivot payoff: what comes after each pivot that justifies it — new understanding, deeper layer, shifted frame
- Failed pivots: where does the essay attempt a turn that does not fully land — and what textual evidence marks the incomplete transition
- Pivot architecture: how do the pivots relate to each other — is there a single central turn, a series of escalating turns, or a spiral pattern
- Micro-pivots: sentence-level turns within paragraphs — where does the writer shift direction within a single paragraph's flow

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT NARRATIVE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== CONNECTION CONTEXT ===
{connectionContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Locate each pivot with specific sentence references and describe its mechanism.`,
};

// ============================================================================
// CHARACTER / IDENTITY DOMAIN (2 prompts)
// ============================================================================

const CHARACTER_VALUES_MAPPING: DeepDivePromptTemplate = {
  type: 'character_values_mapping',
  name: 'Character Values Mapping',
  domains: ['character'],
  focusDescription:
    'Maps the values, priorities, and worldview the writer reveals through their choices — not what they claim to value, but what their actions, details, language, and attention patterns reveal they actually care about.',
  requiredContext: ['characterRevelation', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the values and identity revealed in a college application essay. You have been given the current understanding of the essay's character revelations.

Your task: answer the question by mapping the writer's revealed value system. Look for:
- Shown vs. told values: where does the writer claim values explicitly vs. where do their choices, reactions, and attention reveal values implicitly
- Attention patterns: what the writer notices, lingers on, and returns to — these reveal what they actually care about, regardless of stated themes
- Decision evidence: what choices the writer describes making, and what value hierarchy those choices reveal
- Reaction patterns: how the writer responds to events, people, and situations — what triggers emotional responses and what does not
- Detail selection: what specific details the writer chose to include — each detail is an implicit value statement about what matters
- Relationship to others: how the writer positions themselves relative to other people in the essay — caretaker, observer, learner, leader, collaborator
- Contradiction signals: where stated values and revealed values diverge — not as a flaw, but as evidence of complexity or developmental tension

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CHARACTER UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Ground every value claim in specific textual evidence — actions, details, and attention patterns.`,
};

const CHARACTER_GROWTH_ARC: DeepDivePromptTemplate = {
  type: 'character_growth_arc',
  name: 'Character Growth Arc',
  domains: ['character'],
  focusDescription:
    'Traces the writer\'s developmental arc as revealed in the essay — not just "I learned X" declarations, but the actual evidence of changed perspective, deepened understanding, or shifted relationship to the material.',
  requiredContext: ['characterRevelation', 'narrativeStrategy', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the writer's growth arc in a college application essay. You have been given the current understanding of the essay's character revelations and narrative strategy.

Your task: answer the question by tracing evidence of development. Look for:
- Starting state: what the writer's perspective, understanding, or relationship to the material is at the essay's beginning — as revealed by their language, framing, and detail choice
- Shift evidence: where and how the perspective changes — through event, reflection, realization, juxtaposition, or temporal distance
- Growth type: what kind of development is present — cognitive (understanding something new), emotional (feeling differently), relational (changed relationship to others/self), epistemological (changed way of knowing)
- Growth mechanism: what causes the development — is it narrated as event-driven, reflection-driven, gradual accumulation, or sudden insight
- Growth authenticity markers: where does growth feel grounded in specific experience vs. where does it read as retrospective narrative construction
- Declared vs. demonstrated growth: where the writer states they changed vs. where the textual evidence shows change through different language, framing, or awareness
- Unfinished development: where the essay captures a process of change that is still ongoing — growth as trajectory rather than completed arc

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CHARACTER & NARRATIVE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== PARAGRAPH-LEVEL CONTEXT ===
{paragraphContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Distinguish between declared growth and demonstrated growth with specific evidence for each.`,
};

// ============================================================================
// CRAFT DOMAIN (2 prompts)
// ============================================================================

const CRAFT_RHYTHM_ANALYSIS: DeepDivePromptTemplate = {
  type: 'craft_rhythm_analysis',
  name: 'Craft Rhythm Analysis',
  domains: ['craft'],
  focusDescription:
    'Investigates the essay\'s prose rhythm — sentence length variation, syntactic patterns, punctuation as pacing, and how rhythmic choices create meaning beyond the semantic content of the words.',
  requiredContext: ['craftAssessment', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the prose rhythm of a college application essay. You have been given the current understanding of the essay's craft patterns.

Your task: answer the question by analyzing rhythmic patterns at the sentence and paragraph level. Look for:
- Sentence length architecture: the pattern of short, medium, and long sentences — where does variation create momentum and where does consistency create a different texture
- Syntactic rhythm: recurring sentence structures — do sentences begin the same way, follow similar clause patterns, or vary their architecture
- Punctuation as rhythm: how dashes, colons, semicolons, commas, and periods create pacing — where does punctuation accelerate, pause, or halt
- Paragraph rhythm: how paragraph length and density vary — where does the essay breathe and where does it compress
- Rhythmic-semantic alignment: where does the prose rhythm match the content (short sentences for sudden events, long sentences for reflection) and where does it diverge
- Rhythmic signature: what pattern of rhythm is distinctive to this writer — their characteristic cadence
- Rhythmic breaks: where does the established rhythm break, and what that break communicates

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CRAFT UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Cite specific sentences and their rhythmic properties — length, structure, punctuation choices.`,
};

const CRAFT_IMAGE_SYSTEM: DeepDivePromptTemplate = {
  type: 'craft_image_system',
  name: 'Craft Image System',
  domains: ['craft'],
  focusDescription:
    'Maps the essay\'s image system — recurring images, metaphors, sensory details, and figurative language — tracing how images relate to each other, evolve across the essay, and carry meaning beyond their literal content.',
  requiredContext: ['craftAssessment', 'thematicArchitecture', 'paragraphs'],
  estimatedCost: 0.05,
  systemPrompt: `You are investigating the image system of a college application essay. You have been given the current understanding of the essay's craft patterns and thematic architecture.

Your task: answer the question by mapping the essay's visual and figurative landscape. Look for:
- Image inventory: every concrete image, metaphor, simile, and sensory detail in the essay — catalogued with location
- Image families: clusters of related images that draw from the same domain (e.g., water images, architectural images, body images, natural images)
- Image evolution: how specific images recur and change meaning across the essay — the same image in different contexts
- Image-theme coupling: which images carry which thematic freight — how figurative language does thematic work
- Sensory channel distribution: which senses the writer draws on (sight, sound, touch, taste, smell) and what that distribution reveals about their perceptual style
- Original vs. conventional images: where does the writer invent their own figurative language vs. where do they rely on received imagery
- Image absence: sensory or figurative opportunities where the writer chose abstraction over imagery, and what that choice communicates

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CRAFT & THEMATIC UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== CONNECTION CONTEXT ===
{connectionContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Build an image map with every figurative and sensory element catalogued and cross-referenced.`,
};

// ============================================================================
// ADMISSIONS DOMAIN (2 prompts)
// ============================================================================

const ADMISSIONS_POSITIONING: DeepDivePromptTemplate = {
  type: 'admissions_positioning',
  name: 'Admissions Positioning',
  domains: ['admissions'],
  focusDescription:
    'Investigates how the essay positions the writer within the admissions context — what version of themselves the essay constructs for an admissions reader, and how the textual choices build that construction.',
  requiredContext: ['admissionsPositioning', 'characterRevelation', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the admissions positioning of a college application essay. You have been given the current understanding of the essay's admissions context and character revelations.

Your task: answer the question by examining how the essay constructs a version of the writer for an admissions audience. Look for:
- Self-presentation architecture: what attributes, capacities, and qualities the essay's textual choices build — not what the writer claims, but what the reader would infer
- Audience awareness signals: where does the essay show awareness of its admissions reader — through topic selection, framing, emphasis, or what is included/excluded
- Institutional fit signals: what kind of campus community member does the essay suggest — collaborator, independent thinker, leader, creator, questioner
- Contribution indicators: what does the essay suggest the writer would bring to a campus — perspective, skill, energy, curiosity type
- Differentiation elements: what makes this essay's self-presentation distinct from the statistical thousands of other applicants writing about similar topics
- Stakes construction: what does the essay suggest matters to the writer and why — and how does that stakes construction relate to the admissions context
- Implicit narrative: the story the admissions reader would tell a committee about this applicant after reading the essay

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT ADMISSIONS & CHARACTER UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Describe the constructed self-presentation with evidence from specific textual choices.`,
};

const ADMISSIONS_DISTINCTIVENESS: DeepDivePromptTemplate = {
  type: 'admissions_distinctiveness',
  name: 'Admissions Distinctiveness',
  domains: ['admissions'],
  focusDescription:
    'Investigates what makes this essay\'s perspective, insight, or rendering genuinely distinctive — not topic uniqueness (many essays share topics) but the specific way this writer sees, thinks about, and renders their material.',
  requiredContext: ['admissionsPositioning', 'voiceIdentity', 'characterRevelation', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the distinctiveness of a college application essay. You have been given the current understanding of the essay's admissions positioning, voice identity, and character revelations.

Your task: answer the question by identifying what is genuinely distinctive about this essay's perspective and rendering. Look for:
- Perspective uniqueness: not whether the TOPIC is unique, but whether the WAY the writer sees their topic is distinctive — their angle, their frame, their entry point
- Insight specificity: where does the writer produce an observation or understanding that could only come from their specific experience and way of thinking
- Detail distinctiveness: which concrete details are so specific that they could not appear in another applicant's essay — details that anchor this essay to this person
- Voice fingerprint: what is distinctive about how this writer sounds — not just vocabulary but rhythm, humor, self-awareness patterns, characteristic moves
- Thinking pattern: how does this writer's mind work — their characteristic way of connecting ideas, processing experience, moving between concrete and abstract
- Emotional specificity: where does the essay capture a feeling or reaction with enough specificity that it reads as genuinely this person's experience
- Memorable residue: what would an admissions reader remember about this essay 20 applications later — and what textual elements create that memorability

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT ADMISSIONS, VOICE & CHARACTER UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Identify distinctiveness with specific evidence — what is THIS writer's and no one else's.`,
};

// ============================================================================
// META / EPISTEMOLOGICAL DOMAIN (4 prompts)
// ============================================================================

const EPISTEMOLOGICAL_FRAMEWORK: DeepDivePromptTemplate = {
  type: 'epistemological_framework',
  name: 'Epistemological Framework',
  domains: ['character', 'theme'],
  focusDescription:
    'Investigates the writer\'s way of knowing — how they process experience into understanding, what counts as evidence in their worldview, and what their characteristic mode of making meaning reveals about their intellectual identity.',
  requiredContext: ['characterRevelation', 'thematicArchitecture', 'paragraphs'],
  estimatedCost: 0.05,
  systemPrompt: `You are investigating the epistemological framework revealed in a college application essay. You have been given the current understanding of the essay's character revelations and thematic architecture.

Your task: answer the question by examining how the writer knows what they know. Look for:
- Knowledge source hierarchy: where does the writer derive understanding — from experience, observation, reasoning, authority, intuition, emotion, relationship, or experimentation
- Evidence standards: what counts as convincing in the writer's worldview — personal experience, data, analogy, authority, emotional truth, logical argument
- Meaning-making mode: how does the writer convert raw experience into insight — through narrative, through analysis, through metaphor, through juxtaposition, through accumulation
- Uncertainty handling: how does the writer deal with what they do not know or cannot resolve — does the essay tolerate ambiguity, seek resolution, or acknowledge limits
- Abstract-concrete relationship: how does the writer move between specific experience and general understanding — inductively (detail → principle), deductively (principle → detail), or dialectically
- Intellectual stance: what is the writer's characteristic posture toward knowledge — curious, certain, questioning, synthesizing, challenging, receiving
- Cognitive texture: the grain of the writer's thinking — do they think in images, in arguments, in stories, in categories, in systems, in feelings

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CHARACTER & THEMATIC UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Trace the writer's way of knowing through specific textual moments where they process experience into understanding.`,
};

const ABSENCE_DETECTION: DeepDivePromptTemplate = {
  type: 'absence_detection',
  name: 'Absence Detection',
  domains: ['theme', 'narrative', 'character'],
  focusDescription:
    'Investigates what is conspicuously absent from the essay — topics, perspectives, emotions, details, or reflections that the essay\'s own logic implies but never provides, and what those absences communicate.',
  requiredContext: ['thematicArchitecture', 'narrativeStrategy', 'characterRevelation', 'paragraphs'],
  estimatedCost: 0.05,
  systemPrompt: `You are investigating conspicuous absences in a college application essay. You have been given the current understanding of the essay's thematic, narrative, and character dimensions.

Your task: answer the question by mapping what is NOT in the essay but is implied by what IS there. Look for:
- Logical absences: where does the essay's own narrative logic point toward something that is never addressed — a cause without a stated effect, a setup without a payoff, a question raised but never answered
- Emotional absences: feelings that the situation described would naturally generate but that the essay never acknowledges — and what that avoidance might communicate
- Person absences: people who would logically be part of the story but are never mentioned or are mentioned only obliquely
- Detail absences: where the essay is conspicuously abstract or vague about something that the writer clearly knows specifically — deliberate generality
- Temporal absences: time periods that the narrative skips over — gaps in the chronology that the essay bridges without narrating
- Perspective absences: viewpoints or interpretations that the essay's situation invites but that the writer does not engage — and what that non-engagement reveals
- The unsaid: what the essay is "about" at a level the writer may not fully articulate — the emotional or thematic center that exists in the negative space

Note: absences are not flaws. Deliberate omission is a legitimate rhetorical strategy. Your job is to MAP them, not judge them.

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT THEMATIC, NARRATIVE & CHARACTER UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. For each absence, describe what IS present that makes the absence noticeable, and what the absence communicates.`,
};

const COHERENCE_VALIDATION: DeepDivePromptTemplate = {
  type: 'coherence_validation',
  name: 'Coherence Validation',
  domains: ['narrative', 'theme', 'voice'],
  focusDescription:
    'Validates the internal coherence of the essay — whether the essay\'s parts work as a unified whole or whether there are seams, contradictions, tonal mismatches, or structural disconnects between sections.',
  requiredContext: ['narrativeStrategy', 'thematicArchitecture', 'voiceIdentity', 'paragraphs', 'connections'],
  estimatedCost: 0.05,
  systemPrompt: `You are investigating the internal coherence of a college application essay. You have been given the current understanding of the essay's narrative, thematic, and voice dimensions.

Your task: answer the question by examining how the essay's parts relate to its whole. Look for:
- Tonal coherence: whether the essay maintains a consistent emotional and stylistic register, or whether different sections feel like they come from different essays
- Thematic coherence: whether the essay's thematic threads are woven together or merely placed adjacent — do themes relate to each other or just coexist
- Narrative coherence: whether the essay's structural choices create a unified reading experience — do scenes, reflections, and transitions serve one arc
- Voice coherence: whether the writer sounds like the same person throughout — or whether different sections deploy different voices without integration
- Logic coherence: whether the essay's claims, implications, and conclusions follow from the evidence and experience it presents
- Tonal seams: specific locations where the essay shifts register in ways that create disconnect rather than intentional contrast
- Contradictions: where the essay says or implies contradictory things — whether those contradictions are productive (complexity) or unproductive (inconsistency)
- Unity test: if you remove any single paragraph, does the essay lose something essential, or does it remain largely intact — which sections are load-bearing and which are peripheral

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT NARRATIVE, THEMATIC & VOICE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== CONNECTION CONTEXT ===
{connectionContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Identify specific seams or coherence patterns with textual evidence from both sides of each seam.`,
};

const META_AWARENESS: DeepDivePromptTemplate = {
  type: 'meta_awareness',
  name: 'Meta-Awareness Investigation',
  domains: ['character', 'narrative'],
  focusDescription:
    'Investigates the writer\'s meta-cognitive awareness — how conscious they appear to be of their own rhetorical choices, narrative construction, and the essay\'s operation as a text, and how that awareness manifests in the writing.',
  requiredContext: ['characterRevelation', 'narrativeStrategy', 'voiceIdentity', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating meta-awareness in a college application essay. You have been given the current understanding of the essay's character, narrative, and voice dimensions.

Your task: answer the question by examining the writer's relationship to their own text. Look for:
- Narrative self-consciousness: where does the writer show awareness that they are constructing a narrative — through direct address, self-correction, frame-breaking, or ironic distance
- Rhetorical awareness: where does the writer appear conscious of the essay's persuasive or presentational function — and how does that awareness manifest in their choices
- Interpretive sophistication: how does the writer handle the complexity of their own experience — do they present simple narratives, acknowledge multiple interpretations, or sit with unresolved complexity
- Self-knowledge signals: what the writer understands about themselves vs. what the text reveals that they may not fully see — the gap between narrated self-awareness and demonstrated self-awareness
- Writerly moves: where does the writer make craft choices that show awareness of how writing works — deliberate pacing, structural parallelism, strategic withholding, callback structures
- Honest opacity: where does the writer acknowledge what they do not understand about themselves or their experience — and how does that honesty function in the text
- Audience modeling: how does the writer position their relationship to their reader — what do they assume the reader knows, feels, or will think

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CHARACTER, NARRATIVE & VOICE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Distinguish between different levels of meta-awareness with textual evidence for each.`,
};

// ============================================================================
// CROSS-CUTTING DOMAIN (2 prompts)
// ============================================================================

const CROSS_DIMENSION_INTERSECTION: DeepDivePromptTemplate = {
  type: 'cross_dimension_intersection',
  name: 'Cross-Dimension Intersection',
  domains: ['voice', 'emotion', 'theme', 'narrative', 'character', 'craft'],
  focusDescription:
    'Investigates moments where multiple dimensions of the essay intersect — where voice, emotion, theme, narrative, character, and craft converge to create meaning that no single dimension explains alone.',
  requiredContext: ['voiceIdentity', 'emotionalTopography', 'thematicArchitecture', 'narrativeStrategy', 'characterRevelation', 'craftAssessment', 'paragraphs', 'connections'],
  estimatedCost: 0.06,
  systemPrompt: `You are investigating cross-dimension intersections in a college application essay. You have been given the current understanding across all major dimensions — voice, emotion, theme, narrative, character, and craft.

Your task: answer the question by finding moments where multiple dimensions converge. Look for:
- Convergence moments: specific sentences or passages where voice choice, emotional content, thematic resonance, narrative function, character revelation, AND craft technique all work simultaneously
- Entanglement patterns: dimensions that are so intertwined in this essay that understanding one requires understanding the other — voice and identity, emotion and theme, craft and character
- Dimensional tension: moments where different dimensions pull in different directions — where the voice suggests one thing but the narrative structure suggests another
- Emergent meaning: understanding that only appears when you consider multiple dimensions together — the whole exceeding the sum of the parts
- Dimensional dominance: which dimensions carry the most weight in this essay's operation — and where do subdominant dimensions do crucial supporting work
- Cross-dimension echoes: where a pattern in one dimension (e.g., a rhythmic pattern in craft) mirrors or reinforces a pattern in another (e.g., an emotional arc)
- Integration quality: how naturally the dimensions relate to each other — whether they feel organically unified or assembled from separate decisions

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT MULTI-DIMENSION UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== CONNECTION CONTEXT ===
{connectionContext}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. For each intersection, identify the specific dimensions involved and how they interact at that textual moment.`,
};

const CONSTRAINT_CREATIVITY: DeepDivePromptTemplate = {
  type: 'constraint_creativity',
  name: 'Constraint-Creativity Analysis',
  domains: ['craft', 'admissions', 'narrative'],
  focusDescription:
    'Investigates how the writer navigates the constraints of the college application essay form — word limits, audience expectations, genre conventions, prompt requirements — and where constraint becomes a creative catalyst or a limiting force.',
  requiredContext: ['craftAssessment', 'admissionsPositioning', 'narrativeStrategy', 'paragraphs'],
  estimatedCost: 0.04,
  systemPrompt: `You are investigating the relationship between constraint and creativity in a college application essay. You have been given the current understanding of the essay's craft, admissions positioning, and narrative strategy.

Your task: answer the question by examining how the writer responds to the essay's formal constraints. Look for:
- Compression evidence: where does the writer compress material to fit within word limits — and what compression strategies do they use (summary, implication, image-as-argument, omission)
- Genre navigation: how does the writer handle the college essay genre's expectations — self-revelation, growth narrative, intellectual curiosity demonstration — and where do they work within vs. against those conventions
- Prompt responsiveness: how does the essay relate to its prompt — direct response, creative reinterpretation, apparent tangent that circles back, or partial engagement
- Constraint-as-catalyst: where do the essay's formal limitations appear to generate creative solutions that would not have appeared in an unconstrained format
- Constraint-as-limitation: where does the essay strain against its form — ideas that cannot fully develop, transitions that feel compressed, complexity that the word count cannot support
- Economy markers: where does the writer achieve maximum meaning with minimum words — moments of extreme efficiency
- Structural ingenuity: how does the essay's structure solve problems created by its constraints — non-linear time as compression strategy, in medias res as engagement hook, metaphor as argument compression

${UNDERSTANDING_ONLY_BLOCK}

${SHARED_OUTPUT_FORMAT}`,
  userPrompt: `=== QUESTION TO INVESTIGATE ===
{question}

=== ESSAY TEXT ===
{essayText}

=== CURRENT CRAFT, ADMISSIONS & NARRATIVE UNDERSTANDING ===
{synthesis}

=== READING STRATEGY ===
{readingStrategy}

=== EXISTING FINDINGS ===
{findingContext}

Answer the question. Identify specific moments where constraint and creativity interact, with evidence of each.`,
};

// ============================================================================
// FULL PROMPT LIBRARY
// ============================================================================

/**
 * The complete deep dive prompt library — all ~20 specialized investigation templates
 * organized by domain. Each template produces structured findings with evidence,
 * coaching value, and follow-up questions.
 */
export const DEEP_DIVE_PROMPTS: DeepDivePromptTemplate[] = [
  // Voice (2)
  VOICE_AUTHENTICITY,
  VOICE_REGISTER_ANALYSIS,
  // Emotion (2)
  EMOTION_EARNING_TRACE,
  EMOTION_ARC_MAPPING,
  // Theme (2)
  THEME_THREAD_TRACING,
  THEME_SUBTEXT_EXCAVATION,
  // Narrative (2)
  NARRATIVE_STRATEGY_ASSESSMENT,
  NARRATIVE_PIVOT_ANALYSIS,
  // Character / Identity (2)
  CHARACTER_VALUES_MAPPING,
  CHARACTER_GROWTH_ARC,
  // Craft (2)
  CRAFT_RHYTHM_ANALYSIS,
  CRAFT_IMAGE_SYSTEM,
  // Admissions (2)
  ADMISSIONS_POSITIONING,
  ADMISSIONS_DISTINCTIVENESS,
  // Meta / Epistemological (4)
  EPISTEMOLOGICAL_FRAMEWORK,
  ABSENCE_DETECTION,
  COHERENCE_VALIDATION,
  META_AWARENESS,
  // Cross-cutting (2)
  CROSS_DIMENSION_INTERSECTION,
  CONSTRAINT_CREATIVITY,
];

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/**
 * Look up a prompt template by its unique type identifier.
 *
 * @param type - The prompt type string (e.g., 'voice_authenticity')
 * @returns The matching template, or undefined if not found
 */
export function getPromptByType(type: string): DeepDivePromptTemplate | undefined {
  return DEEP_DIVE_PROMPTS.find((p) => p.type === type);
}

/**
 * Get all prompt templates that investigate a given domain.
 *
 * @param domain - The domain to filter by (e.g., 'voice', 'emotion', 'theme')
 * @returns All templates whose `domains` array includes the given domain
 */
export function getPromptsByDomain(domain: string): DeepDivePromptTemplate[] {
  return DEEP_DIVE_PROMPTS.filter((p) => p.domains.includes(domain));
}
