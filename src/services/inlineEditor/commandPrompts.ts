/**
 * Command Prompt Templates for Inline Editing
 *
 * Each command has a system prompt template, description, and model assignment.
 * All commands use Haiku except deepen_vulnerability and connect_to_theme (Sonnet).
 *
 * Top-5 commands have expanded `detailedPrompt` fields (P1-1) providing
 * 150-250 token instruction blocks with before/after examples and
 * anti-fabrication guardrails. buildSystemPrompt() prefers detailedPrompt
 * when available, falling back to the short description.
 */

import type { BuiltInEditingCommand } from './types';
import type { CommandManifest } from '../../workshop/shared/types';
import { buildFabricationGuardBlock } from '../../lib/llm/fabricationGuard';

// ============================================================================
// TYPES
// ============================================================================

export interface CommandPromptTemplate {
  /** System prompt for the LLM call */
  systemPrompt: string;
  /** Human-readable description of what this command does */
  commandDescription: string;
  /** Which model to use: haiku for speed, sonnet for quality-critical commands */
  model: 'haiku' | 'sonnet';
}

/** Internal config shape for each editing command */
interface CommandConfig {
  /** Short description for UI display and fallback prompt */
  description: string;
  /** Expanded instruction block (150-250 tokens) for LLM prompt. Used by buildSystemPrompt when present. */
  detailedPrompt?: string;
  /** Which model to use */
  model: 'haiku' | 'sonnet';
}

// ============================================================================
// SHARED PROMPT FRAGMENTS
// ============================================================================

/**
 * Comprehensive banned terms list aggregated from:
 * - semanticClicheAnalyzer.ts (ai_convergence_phrases, essay_cliche_phrases, over_polished_markers)
 * - batchGenerationService.ts (BANNED_TERMS)
 * - PIQ issuePatterns.ts (cliché language patterns)
 * - Activity workshop expertSystemPrompts.ts
 *
 * Categories:
 * 1. AI-convergence vocabulary (words AI models overuse)
 * 2. Overused college essay phrases
 * 3. Generic filler and hedging
 * 4. Admissions clichés
 * 5. Over-polished / adult-edited markers
 */
const BANNED_TERMS_LIST: string[] = [
  // --- AI-convergence vocabulary ---
  'delve into',
  'tapestry of',
  'beacon of',
  'myriad of',
  'multifaceted',
  'furthermore',
  'moreover',
  'nevertheless',
  'henceforth',
  'aforementioned',
  'testament to',
  'harbinger of',
  'embodiment of',
  'microcosm of',
  'epitome of',
  'manifestation of',
  'culmination of',
  'catalyst for change',
  'pillar of strength',
  'mosaic of cultures',
  'symphony of voices',
  'kaleidoscope of emotions',

  // --- Overused college essay phrases ---
  'journey of self-discovery',
  'passionate about',
  'ever since I was young',
  'for as long as I can remember',
  'sparked my passion',
  'this experience taught me',
  'I learned that',
  'it opened my eyes',
  'I realized the importance of',
  'little did I know',
  'it made me who I am today',
  'I grew as a person',
  'I found my voice',
  'it was a turning point',

  // --- Generic filler and hedging ---
  'in today\'s society',
  'throughout my life',
  'in conclusion',
  'at the end of the day',
  'all in all',
  'it is important to note that',
  'I believe that',
  'in my opinion',

  // --- Admissions clichés ---
  'global citizen',
  'make a difference',
  'pushed me out of my comfort zone',
  'think outside the box',
  'gave back to the community',
  'truly humbling experience',
  'changed my perspective',
  'opened my eyes to',
  'against all odds',

  // --- Over-polished / thesaurus-syndrome markers ---
  'transformative experience',
  'profound impact',
  'invaluable lesson',
  'fostered my growth',
  'cultivated my passion',
  'instilled in me',
  'galvanized',
  'transcended',
  'coalesced into',
  'crystallized into',
];

const BANNED_TERMS = `BANNED TERMS — Never use these phrases in rewrites:\n${BANNED_TERMS_LIST.map(t => `"${t}"`).join(', ')}`;

const OUTPUT_FORMAT = `Output STRICTLY VALID JSON:
{
  "primary": { "text": "...", "explanation": "..." },
  "creative": { "text": "...", "explanation": "..." },
  "teachingNote": "...",
  "principle": "..."
}`;

/**
 * Build the full system prompt for an editing command.
 * Prefers `detailedPrompt` (expanded instruction block) when available,
 * falling back to the short `description`.
 *
 * @param commandInstruction - The instruction text to embed (detailedPrompt or description)
 * @param voiceSlot - Whether to include the {VOICE_SUMMARY} placeholder
 * @param ragContext - Optional RAG-sourced example fragments to inject
 */
function buildSystemPrompt(commandInstruction: string, voiceSlot: boolean = true, ragContext?: string): string {
  const voiceLine = voiceSlot ? '\n\n{VOICE_SUMMARY}' : '';
  const ragSection = ragContext
    ? `\n\n## Relevant Examples from Strong Essays\n${ragContext}`
    : '';
  return `You are a college essay writing coach. Your task:

${commandInstruction}

RULES:
- Preserve the student's authentic voice
- Generate exactly 2 alternatives: one "primary" (safe, minimal change), one "creative" (bolder)
- Each must fit naturally in the surrounding context
- Explain what changed and why (one sentence each)
- State ONE transferable writing principle${voiceLine}${ragSection}

${BANNED_TERMS}

${OUTPUT_FORMAT}

${buildFabricationGuardBlock()}`;
}

// ============================================================================
// COMMAND DEFINITIONS
// ============================================================================

const COMMAND_CONFIGS: Record<BuiltInEditingCommand, CommandConfig> = {
  make_concrete: {
    description: 'Replace vague, abstract language with specific, concrete details. Add names, numbers, places, sensory details.',
    detailedPrompt: `Replace vague, abstract language with specific, concrete details.

WHAT TO LOOK FOR:
- Abstract nouns: experience, growth, perspective, situation, environment, opportunity
- Generic modifiers: incredible, amazing, significant, important, interesting
- Unnamed people, places, or objects: "my mentor", "the place", "that time"
- Round or vague numbers: "many", "a lot of", "several"

HOW TO FIX:
- Replace abstract nouns with the exact thing: "experience at the lab" → "three months calibrating the mass spectrometer in Dr. Patel's biochemistry lab"
- Replace generic modifiers with sensory detail: "amazing view" → "view of the Santa Cruz Mountains fading from green to blue in the afternoon haze"
- Name the people, places, and objects: "my mentor" → "Ms. Rivera, the ER charge nurse"

BEFORE: "I helped at the hospital and it was a meaningful experience."
AFTER: "I restocked gauze in the ER supply closet at Mount Sinai every Tuesday at 6 AM."

ANTI-FABRICATION: Only concretize details the student could plausibly know from their text. Do NOT invent names, dates, statistics, or locations the student did not provide or imply. If the text says "my teacher," you may prompt for a name but do not fabricate one — use a placeholder like "[Teacher's name]" or keep the original if no plausible detail exists.

OUTPUT GUIDANCE: The rewrite MUST contain at least one specific number, named entity, or [bracketed placeholder]. Primary = add specificity with [brackets] for unknown details (e.g., [number of events], [teacher's name], [specific location]). Creative = bolder concrete details, still using [brackets] for anything unverified. Every rewrite must be MORE specific than the input — vague words replaced with numbers, names, or sensory specifics.`,
    model: 'haiku',
  },
  show_dont_tell: {
    description: "Convert telling (stating emotions/lessons) to showing (scenes, dialogue, actions, sensory details). Instead of 'I was nervous', show physical symptoms.",
    detailedPrompt: `Convert TELLING (stating emotions, conclusions, or lessons) into SHOWING (scenes, body language, dialogue, sensory detail, or action that lets the reader draw the conclusion).

WHAT TO LOOK FOR:
- Emotion labels: "I was nervous", "I felt happy", "I was scared", "I struggled"
- Lesson statements: "I learned that", "I realized", "This taught me", "I grew as a person"
- Summary phrases: "It was a great experience", "The trip changed me", "I became more confident"
- Character claims: "I am a hard worker", "I'm passionate about", "I'm a natural leader"

HOW TO FIX:
- Replace emotion labels with physical symptoms, involuntary actions, or sensory snapshots
- Replace lesson statements with a scene that DEMONSTRATES the lesson without naming it
- Replace summary with a single concrete moment that carries the same meaning

BEFORE: "I was nervous before the speech."
AFTER: "My palms left wet prints on the podium. I opened my mouth but the first word stuck somewhere behind my teeth."

ANTI-FABRICATION: Keep all events and emotions truthful to the original. Only change HOW they are expressed, not WHAT happened. If the student says "I was happy at graduation," show happiness through a plausible physical detail — do not add events, people, or dialogue the student did not reference.

OUTPUT GUIDANCE: Primary should be a minimal showing rewrite — convert the most obvious tell into a show. Creative can use more vivid or literary technique (extended metaphor, dialogue, slow-motion scene) but must stay grounded in the student's actual experience.`,
    model: 'haiku',
  },
  clarify_learning: {
    description: "Deepen the reflection. Move from surface-level 'I learned...' to specific, surprising insight. What did you understand that you didn't before?",
    detailedPrompt: `Deepen the reflection from a generic lesson to a specific, surprising insight grounded in the student's own experience.

WHAT TO LOOK FOR:
- Generic takeaways: "I learned that hard work pays off", "This taught me perseverance", "I realized the importance of teamwork"
- Copy-paste reflections that could appear in any student's essay without change
- Missing the BEFORE vs AFTER: the student states the lesson but not what they believed before it

HOW TO FIX:
- Identify the SPECIFIC moment the insight occurred — anchor it to a scene, not a summary
- Name what the student believed BEFORE vs AFTER: "I used to think X, but then Y happened and I understood Z"
- Include the internal resistance or surprise: "I expected X but discovered Y"
- Ground the insight in a concrete detail from the experience — a specific object, person, or sensation

EXAMPLE:
Before: "I learned that leadership isn't about being in charge."
After: "Standing in that empty gym at 6am, I realized I'd been confusing volume for authority — the freshmen didn't need me louder, they needed me listening."

WHAT NOT TO DO:
- Do not replace the student's insight with a different one — only deepen and specify
- Do not add philosophical generalizations ("In life, we all must...")
- Do not use banned cliché reflections ("opened my eyes", "grew as a person")

ANTI-FABRICATION:
Never invent what the student learned. Only deepen and specify reflections they've already expressed. If the student says "I learned responsibility," you may add specificity about HOW they learned it, but not change WHAT they learned.

OUTPUT GUIDANCE:
Primary = deepen the existing reflection with specificity and a concrete anchor. Creative = reframe the insight from a different angle or add the contrasting "before" belief to create a sharper arc.`,
    model: 'haiku',
  },
  add_stakes: {
    description: 'Raise the stakes. What was at risk? What would happen if things went wrong? Add consequence and tension.',
    detailedPrompt: `Raise the stakes by surfacing what was at risk, what could go wrong, and what the student stood to lose.

WHAT TO LOOK FOR:
- Actions described without consequences: "I worked hard on the project" — but what if you failed?
- Events without tension: "I organized the fundraiser" — with no sense of what failure would mean
- Efforts without personal risk: "I applied to the program" — but what was riding on it?

HOW TO FIX:
- Name what could go wrong — specific, not generic fear ("If I couldn't debug this by Friday, the team demo would fail in front of the Dean")
- Add conditional tension: "If I couldn't figure this out...", "Without this working..."
- Show what the student stood to lose PERSONALLY — identity, relationships, a promise made
- Layer stakes: personal (self-image) + external (others depending on you) + internal (what you'd have to admit about yourself)

EXAMPLE:
Before: "I decided to organize the fundraiser."
After: "If the fundraiser failed, the shelter would close its doors in March — and the 14 dogs I'd named wouldn't have anywhere to go."

WHAT NOT TO DO:
- Do not manufacture life-or-death drama where none exists
- Do not add generic fear ("I was scared of failure") — name the SPECIFIC failure
- Do not overwrite what actually happened with hypothetical catastrophe

ANTI-FABRICATION:
Never invent stakes the student hasn't implied. If they mention a project, you can surface reasonable consequences of failure, but don't fabricate dramatic outcomes. Use [brackets] for specific details you're uncertain about.

OUTPUT GUIDANCE:
Primary = surface the most natural stakes already implied by the context. Creative = find unexpected or internal stakes — reputation, identity, or a relationship at risk that the student hasn't explicitly named but the situation implies.`,
    model: 'haiku',
  },
  strengthen_voice: {
    description: "Make this sound more like the student's authentic voice. Adjust formality, energy, and word choice to match their natural register.",
    detailedPrompt: `Make this passage sound like THIS student wrote it — match their authentic voice, rhythm, and register.

WHAT TO LOOK FOR:
- Passages that sound "written" rather than "spoken by this student" — over-formal language from a casual writer, or simplistic phrasing from a sophisticated one
- Vocabulary mismatches: a 16-year-old wouldn't say "furthermore" or "profoundly impactful" unless that's genuinely their style
- Missing signature rhythms: fragments, compound sentences, rhetorical questions, slang, or humor that appear elsewhere but vanish here

HOW TO FIX:
- Match sentence length and structure to the student's pattern elsewhere in the essay
- Replace vocabulary that doesn't match their demonstrated level — up OR down
- Inject their characteristic rhythm (fragments? long flowing sentences? dry humor? earnest directness?)
- If a voice profile is provided, follow its formality, register, and avoidWords strictly

EXAMPLE (student is casual/direct):
Before: "Furthermore, this experience was profoundly impactful on my personal development."
After: "That day changed something in me. I just didn't have the words for it yet."

WHAT NOT TO DO:
- Do not change the MEANING — only the voice/style wrapper. Same idea, their words.
- Do not impose a "better" voice — match THEIR voice, even if it's informal or unconventional
- Do not add slang or informality if the student's authentic register is formal

ANTI-FABRICATION:
Never alter what the student is saying — only HOW they say it. The same idea, repackaged in their natural rhythm. Do not add new content, opinions, or events.

OUTPUT GUIDANCE:
Primary = adjust voice while keeping sentence structure mostly intact. Creative = fully rewrite in their natural speaking rhythm, even if it means fragments or unconventional syntax. CRITICAL: If a voice profile is provided, both alternatives MUST respect it.`,
    model: 'haiku',
  },
  cut_filler: {
    description: 'Remove unnecessary words, redundant phrases, and filler. Every word should earn its place. Target 15-25% word count reduction.',
    detailedPrompt: `Remove unnecessary words, redundant phrases, and filler while preserving every specific detail, name, number, and sensory image.

WHAT TO TARGET:
- Hedge words: very, really, quite, somewhat, basically, actually, honestly, literally, definitely, certainly, essentially, generally
- Redundant phrases: each and every, past experience, future plans, end result, true fact, completely eliminate, absolutely essential, added bonus, close proximity, final outcome
- Empty qualifiers: incredibly, extremely, absolutely, truly, deeply, highly, remarkably, particularly
- Throat-clearing: "It is important to note that", "I believe that", "In my opinion", "What I mean is", "The thing is", "I would say that", "To be honest", "As a matter of fact"
- Weasel constructions: "was able to" → did; "made the decision to" → decided; "had the opportunity to" → could; "came to the realization" → realized

WHAT TO PRESERVE:
- Every specific detail, proper noun, date, number, and metric
- Sensory images and concrete descriptions
- Dialogue and quoted speech
- The student's distinctive word choices and sentence rhythms
- Emotional content (just delivered more efficiently)

BEFORE: "I honestly believe that this incredibly transformative experience really taught me so much about the true value of genuine empathy in professional settings."
AFTER: "This experience taught me empathy."

ANTI-FABRICATION: Never remove specific details, names, dates, or evidence while cutting filler. Only remove words that add zero meaning. Do not rephrase in a way that changes the student's intended meaning.

OUTPUT GUIDANCE: Target 15-25% word count reduction. Primary should be conservative — remove only the most obvious filler. Creative should be aggressive — the tightest possible version that preserves all meaning and evidence.`,
    model: 'haiku',
  },
  add_evidence: {
    description: 'Add specific metrics, numbers, results, or proof. Replace vague claims with quantified impact.',
    detailedPrompt: `Replace vague claims with specific metrics, numbers, names, and measurable outcomes.

WHAT TO LOOK FOR:
- Vague quantity words: "helped many people", "raised a lot of money", "significant improvement", "made an impact"
- Unnamed beneficiaries or organizations: "the community", "those in need", "the team"
- Unquantified results: "improved performance", "increased participation", "great results"

HOW TO FIX:
- Add specific numbers where implied: "many" → "[N]", "a lot" → "$[amount]"
- Name specific people, places, organizations where the student has implied them
- Add measurable outcomes: "improved" → "improved [metric] by [amount]"
- Use [brackets] for ANY number or detail you don't know — never guess

EXAMPLE:
Before: "Our team raised a lot of money for the cause."
After: "Our 12-person team raised $[amount] — enough to fund three months of after-school tutoring at [school name]."

WHAT NOT TO DO:
- Do not fabricate specific numbers without brackets — "$5,000" when you don't know the amount
- Do not invent organization names, people's names, or locations
- Do not add evidence that contradicts or goes beyond what the student described

ANTI-FABRICATION:
CRITICAL — Use [brackets] for ANY number, name, or result you don't know for certain. It is better to write "$[amount]" than to guess "$5,000". Never fabricate statistics, names, or outcomes. The student must fill in the specifics.

OUTPUT GUIDANCE:
Primary = add evidence with [brackets] for unknown specifics, keeping the sentence structure close to the original. Creative = restructure the passage to lead with the most impressive evidence, still using [brackets] for unknowns.`,
    model: 'haiku',
  },
  deepen_vulnerability: {
    description: 'Move past surface-level emotion to specific, honest vulnerability. Name the exact fear, failure, or confusion. Show physical/emotional symptoms.',
    detailedPrompt: `Move past surface-level emotion to specific, honest vulnerability. Name the EXACT fear, internal contradiction, or moment of confusion.

WHAT TO LOOK FOR:
- Surface-level emotion labels: "it was hard", "I struggled", "I felt lost", "I was overwhelmed"
- Performed vulnerability: "I'm not afraid to admit", "to be vulnerable for a moment", "in the spirit of authenticity"
- Generic hardship: "I faced many challenges", "it wasn't easy", "there were obstacles"
- Lesson-first framing: "I learned that vulnerability is strength" (thesis statement, not vulnerability)

HOW TO DEEPEN:
- Name the EXACT fear, not the category: "I was afraid" → "I was afraid that if I asked for help, Mrs. Chen would realize I'd been pretending to understand derivatives for three weeks"
- Name the internal contradiction: "I wanted to quit, but I also wanted them to see me as someone who doesn't quit — and I couldn't figure out which want was real"
- ALWAYS include a physical body response: tight chest, stomach dropping, throat closing, hands trembling, sweat on palms, breath catching, going numb, jaw clenching, ache behind the eyes
- Move from summary to a single granular instant

BEFORE: "I felt like I didn't belong."
AFTER: "My stomach dropped every time I walked into that room. I'd count the ceiling tiles rather than look for an empty seat — twenty-three tiles, every day, twenty-three."

BEFORE: "I had no idea what I was getting into."
AFTER: "My chest went tight the first time I stood in front of them. I didn't know what I was doing, and I was afraid they could tell."

ANTI-FABRICATION: Only deepen emotions ALREADY PRESENT in the student's text. Never add trauma, hardship, mental health struggles, or negative experiences the student did not express. If the student mentions a challenge, you may deepen the emotional texture of THAT challenge, but do not escalate its severity or invent additional pain.

OUTPUT GUIDANCE: Both alternatives MUST include at least one physical/somatic vulnerability marker — body sensations like stomach, chest, throat, breath, trembling, sweat, numb, ache, tight, hollow, dizzy, or froze. Primary = gently deepen with one specific fear and one physical sensation. Creative = raw, unflinching — vivid physical detail, internal monologue, or the exact thought at the worst moment. Emotional labels alone ("I was scared") do NOT count as vulnerability — name the body's response.`,
    model: 'sonnet',
  },
  connect_to_theme: {
    description: "Link this passage to the essay's central theme or argument. Create an echo or callback that strengthens coherence.",
    detailedPrompt: `Link this passage to the essay's central theme or argument by creating an echo, callback, or metaphor extension that strengthens coherence.

WHAT TO DO:
1. Identify the essay's central argument or theme from the FULL DOCUMENT context (not just the selected text).
2. Find or create a specific image, phrase, or idea in this passage that echoes or extends that theme.
3. Use one of these techniques:
   - Callback: reference an image or phrase from earlier in the essay
   - Metaphor extension: extend a metaphor already established in the essay
   - Structural parallel: mirror the syntax or structure of a key earlier passage
   - Motif threading: weave a recurring detail (object, color, sound) through this passage

EXAMPLE (if the essay's theme is "finding voice through music"):
BEFORE: "I finally felt confident."
AFTER: "The same way my fingers found the right chord without looking, the words came on their own."

WHAT NOT TO DO:
- Do not introduce new themes or metaphors unrelated to the existing essay
- Do not force a connection that feels artificial — subtlety beats heavy-handedness
- Do not add concluding statements like "this relates to my larger theme of..."
- Do not repeat the essay's thesis verbatim; ECHO it through imagery or action

ANTI-FABRICATION: The thematic connection must emerge from existing essay content. Reference images, events, or language the student has already used elsewhere in the document. Do not introduce metaphors or symbols from outside the student's world.

OUTPUT GUIDANCE: Primary should create a subtle thematic echo — a single word choice, image, or structural callback. Creative can use a bolder metaphorical connection or an extended parallel, but must feel organic to the student's existing essay.`,
    model: 'sonnet',
  },
  fix_hook: {
    description: 'Strengthen the opening. Start with action, a surprising detail, dialogue, or a specific sensory moment instead of a generic statement.',
    detailedPrompt: `Strengthen the opening by starting in the middle of a moment — action, dialogue, sensory detail, or a surprising image.

WHAT TO LOOK FOR:
- Backstory openings: "Ever since I was young...", "Growing up, I always..."
- Definition openings: "Leadership is...", "Resilience means..."
- Generic statement openings: "Everyone faces challenges...", "In today's world..."
- Chronological setup: "Last summer, I decided to...", "It all started when..."

HOW TO FIX:
- Start IN MEDIAS RES — drop the reader into a specific moment mid-action
- Create a curiosity gap: make the reader ask "wait, what's happening?" within the first line
- Use a specific, unexpected detail that only THIS student would know
- First sentence should be 15 words or fewer — punch, then context

EXAMPLE:
Before: "Last summer, I volunteered at a local animal shelter, which taught me responsibility."
After: "The pit bull wouldn't stop shaking. I'd been at the shelter forty minutes and already wanted to quit."

WHAT NOT TO DO:
- Do not start with a rhetorical question unless it's genuinely surprising ("Have you ever...?" is NOT surprising)
- Do not start with a dictionary definition or famous quote
- Do not front-load context — trust the reader to catch up

ANTI-FABRICATION:
Never invent scenes or details. Reframe what the student has already described — same facts, more vivid arrangement. If you need a sensory detail they haven't provided, use [brackets].

OUTPUT GUIDANCE:
CRITICAL CONSTRAINT: The FIRST SENTENCE of both alternatives MUST be 15 words or fewer. Count the words — if it exceeds 15, split it or cut it down. Short punch first, context after.
Primary = in-medias-res rewrite — start with a short, punchy first sentence (under 15 words) then add context. Creative = unconventional opening — a single image, a fragment, a line of dialogue, or a contradiction. Both MUST open with a short sentence.`,
    model: 'haiku',
  },
  sharpen_ending: {
    description: 'Strengthen the conclusion. Create resonance by echoing the opening, landing on a specific image, or crystallizing the insight.',
    detailedPrompt: `Strengthen the conclusion by ending on a specific image, echoing the opening, or crystallizing the insight without explaining it.

WHAT TO LOOK FOR:
- Summary endings: "In conclusion, I learned...", "Overall, this experience..."
- Moralizing endings: "This taught me that everyone should...", "I now understand the value of..."
- Trailing-off endings that lose energy and don't land with resonance
- Endings that restate the thesis without adding anything new

HOW TO FIX:
- Echo the opening image or moment with a twist that shows growth — same detail, different meaning
- End on a specific image, not an abstract statement — let the image carry the emotion
- Last sentence should be 15 words or fewer — punch, don't explain
- Show the "after" that mirrors the "before" — the reader sees the change without being told

EXAMPLE:
Before: "This experience taught me the value of perseverance and I will carry these lessons with me."
After: "The pit bull stopped shaking. I sat down next to him. Neither of us wanted to leave."

WHAT NOT TO DO:
- Do not summarize the essay's argument in the final lines
- Do not introduce new information or a new theme in the ending
- Do not moralize or generalize ("Everyone should...", "Life is about...")

ANTI-FABRICATION:
The ending must grow from details already in the essay. Never invent a new scene for the ending. Rearrange, echo, and reframe existing material to create resonance.

OUTPUT GUIDANCE:
Primary = echo technique — mirror the opening image or detail with a twist showing growth. Creative = try ending on a single image, a question, an unexpected pivot, or a fragment that lingers.`,
    model: 'haiku',
  },
  expand_moment: {
    description: 'Slow down time on this moment. Add sensory detail, internal thought, physical sensation. Make the reader feel present.',
    detailedPrompt: `Slow down time on this pivotal moment. Add sensory layers, internal monologue, and micro-physical reactions to make the reader feel present.

WHAT TO LOOK FOR:
- Pivotal moments told in one sentence when they deserve a paragraph — decisions, emotional peaks, realizations, confrontations
- Key events compressed into summary: "When I heard the news, I was devastated"
- Missing senses: the passage only tells what happened, not what it felt/sounded/looked like

HOW TO FIX:
- Add at least 2 senses beyond visual — sound, texture, temperature, smell, taste
- Add internal monologue: "I thought...", "Part of me wanted to...", "I kept telling myself..."
- Add micro-physical reactions: hands, breath, stomach, jaw, throat, shoulders
- Slow the pacing — one action per sentence, fragment sentences for emphasis

EXAMPLE:
Before: "When I heard the news, I was devastated."
After: "The email loaded in three lines. I read them twice. My thumbs hovered — I couldn't scroll, couldn't close it. The cafeteria noise went tinny and distant. I pressed my phone face-down against the table."

WHAT NOT TO DO:
- Do not add melodrama — expand the real emotion, don't amplify it
- Do not add so much detail that the pacing drags — 3-5 sentences, not a full page
- Do not invent events or reactions the student didn't imply

ANTI-FABRICATION:
Only add sensory details plausible for the described situation. Never invent what the student felt — expand what they've already implied. Use [brackets] for any specific detail you're guessing at.

OUTPUT GUIDANCE:
Both alternatives MUST include at least one sensory verb or adjective from this set: saw, heard, felt, touched, smelled, tasted, grabbed, whispered, shouted, cold, warm, rough, sharp, bright, dark, silence, echo, crunch, click, buzz. These exact words anchor the reader in the physical moment. Primary = expand with 2-3 sensory layers and one internal thought. Creative = full cinematic expansion with pacing shifts — short fragments, then a longer breath, then a punch.`,
    model: 'haiku',
  },
  compress: {
    description: 'Say the same thing in fewer words. Preserve meaning and voice while cutting 20%+ of word count. Prefer active voice and strong verbs.',
    detailedPrompt: `Say the same thing in fewer words. Preserve every specific detail while cutting redundancy, filler, and throat-clearing.

WHAT TO LOOK FOR:
- Redundant phrases: "I personally feel that", "each and every", "past experience", "end result"
- Throat-clearing sentences that delay the point: "What I mean to say is...", "The thing is..."
- Said-nothing qualifiers: "very", "really", "quite", "somewhat", "truly", "definitely"
- Stated-twice ideas: two consecutive sentences making the same point in different words
- Obvious statements that add no information

HOW TO FIX:
- Remove hedge words and qualifiers that add zero meaning
- Combine sentences that say the same thing twice into one stronger sentence
- Replace phrases with single words: "due to the fact that" → "because", "was able to" → "could"
- Cut setup sentences that delay the point — start with the point itself
- PRESERVE every name, number, specific detail, sensory image, and unique word choice

EXAMPLE:
Before: "I personally believe that the experience of volunteering at the shelter really truly helped me to understand what it really means to be responsible." (25 words)
After: "Volunteering at the shelter taught me what responsibility actually means." (10 words)

WHAT NOT TO DO:
- NEVER remove specific details, names, numbers, or meaningful content
- Do not compress dialogue or quoted speech
- Do not sacrifice the student's voice for brevity — keep their rhythm

ANTI-FABRICATION:
Only remove filler, redundancy, and fluff. Never remove or alter specific details, evidence, or content. If in doubt whether something is filler or substance, keep it.

OUTPUT GUIDANCE:
Primary = conservative trim (15-20% reduction) — remove only the most obvious filler, safe and reliable. Creative = aggressive trim (25-35% reduction) — the tightest possible version that preserves all meaning, punchier but riskier.`,
    model: 'haiku',
  },
  add_dialogue: {
    description: 'Convert summary into a scene with quoted dialogue. Use dialogue tags that reveal character. Show the interaction.',
    detailedPrompt: `Convert reported or summarized speech into a scene with direct quoted dialogue that reveals character.

WHAT TO LOOK FOR:
- Reported speech: "My mom told me I should try harder", "My coach said I needed more practice"
- Summarized conversations: "We discussed the issue and agreed to...", "After talking it over..."
- Indirect dialogue: "She said that she understood", "He mentioned that he was proud"

HOW TO FIX:
- Convert indirect speech to direct quotes with quotation marks
- Add action beats instead of just "she said": "she said, setting down her fork", "he muttered, not looking up"
- Keep dialogue SHORT — real people speak in 5-15 word bursts, not paragraphs
- Include the student's internal reaction BETWEEN dialogue lines — what they thought but didn't say

EXAMPLE:
Before: "My dad told me that he was proud of what I had accomplished."
After: "'You did that?' Dad said. He set down the newspaper. 'You actually did that.' It wasn't a question."

WHAT NOT TO DO:
- Do not create long speeches — real conversation is short, interrupted, incomplete
- Do not add "he said wisely" or "she exclaimed passionately" — action beats over adverb tags
- Do not invent entire conversations from a single mention

ANTI-FABRICATION:
Only create dialogue that reflects what was ACTUALLY said or could reasonably have been said based on context. Never invent entire conversations. Use [brackets] for specific words you're uncertain about: "[something like: 'I'm proud of you']".

OUTPUT GUIDANCE:
Primary = convert the clearest indirect speech to direct quotes with one action beat. Creative = build a mini-scene around the dialogue — setting, body language, the student's unspoken reaction.`,
    model: 'haiku',
  },
  remove_cliche: {
    description: 'Replace clichéd language with fresh, specific alternatives. Find the image or phrase that only THIS student would use.',
    detailedPrompt: `Replace clichéd, overused, or generic language with fresh, specific alternatives drawn from the student's own experience.

WHAT TO LOOK FOR:
- Any phrase from the BANNED TERMS list above — these are automatic flags
- Dead metaphors: "light at the end of the tunnel", "roller coaster of emotions", "weight off my shoulders"
- Overused college essay moves: "sparked my passion", "opened my eyes", "changed my perspective", "pushed me out of my comfort zone"
- Any phrase that could appear word-for-word in 1,000 other essays

HOW TO FIX:
- Replace with a SPECIFIC image from the student's own experience — what did THEY see, hear, feel?
- If no specific replacement comes naturally, simplify to plain language — boring-but-real beats creative-but-cliché
- Check the replacement against BANNED TERMS — don't replace one cliché with another
- Match the student's vocabulary level — don't swap a cliché for a thesaurus word

EXAMPLE:
Before: "This experience opened my eyes to a whole new world of possibilities."
After: "After that, I started noticing things I'd walked past for years — the tutoring sign in the library, the volunteer board outside the gym."

WHAT NOT TO DO:
- Do not replace a cliché with an even more ornate phrase ("tapestry of understanding")
- Do not strip all figurative language — fresh metaphors are fine, dead ones are not
- Do not use any word from the BANNED TERMS list in the replacement

ANTI-FABRICATION:
Replacement images should come from details already in the essay or be generic enough to be plausible for any student. Use [brackets] for specific details you're inventing that the student would need to verify.

OUTPUT GUIDANCE:
Primary = replace clichés with plain, specific language grounded in what the student has described. Creative = replace clichés with vivid original imagery drawn from the essay's own world — objects, places, and sensations unique to this student.`,
    model: 'haiku',
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Convert a CommandManifest (from the registry) to the internal CommandConfig shape.
 * Registry commands use sonnet by default (they are analytical/rhetorical commands
 * that benefit from higher-quality reasoning).
 */
function manifestToConfig(manifest: CommandManifest): CommandConfig {
  return {
    description: manifest.description,
    detailedPrompt: manifest.detailedPrompt,
    model: 'sonnet',
  };
}

/**
 * Get the prompt template for a given editing command.
 *
 * Resolution order:
 * 1. Check built-in hardcoded commands (COMMAND_CONFIGS) — instant, no I/O
 * 2. Fall through to the command registry (auto-imports *.cmd.ts files on first call)
 * 3. Throw if the command is not found anywhere
 *
 * Uses the expanded `detailedPrompt` when available for richer LLM instructions,
 * falling back to the short `description` for commands that haven't been expanded yet.
 *
 * @param command - The editing command to retrieve (built-in ID or registry ID)
 * @param ragContext - Optional RAG-sourced example fragments to inject into the system prompt.
 */
export async function getCommandPrompt(command: string, ragContext?: string): Promise<CommandPromptTemplate> {
  // 1. Check hardcoded built-in commands first (fast path)
  const builtInConfig = COMMAND_CONFIGS[command as BuiltInEditingCommand];
  if (builtInConfig) {
    const promptInstruction = builtInConfig.detailedPrompt ?? builtInConfig.description;
    return {
      systemPrompt: buildSystemPrompt(promptInstruction, true, ragContext),
      commandDescription: builtInConfig.description,
      model: builtInConfig.model,
    };
  }

  // 2. Fall through to the command registry
  const { commandRegistry } = await import('../../workshop');
  await commandRegistry.autoImport();
  const manifest = commandRegistry.getCommand(command);
  if (manifest) {
    const config = manifestToConfig(manifest);
    const promptInstruction = config.detailedPrompt ?? config.description;
    return {
      systemPrompt: buildSystemPrompt(promptInstruction, true, ragContext),
      commandDescription: config.description,
      model: config.model,
    };
  }

  // 3. Not found anywhere
  throw new Error(
    `[getCommandPrompt] Unknown command: "${command}". ` +
    `Not found in built-in commands or command registry.`
  );
}

// ============================================================================
// SUGGEST COMMANDS PROMPT
// ============================================================================

export const SUGGEST_COMMANDS_PROMPT = `You are a college essay writing coach analyzing a text selection to recommend editing commands.

Available commands and when to recommend them:
- make_concrete: Text is vague, uses abstract language, lacks specific details
- show_dont_tell: Text states emotions or lessons directly instead of showing through scenes
- clarify_learning: Reflection is surface-level ("I learned...", "This taught me...")
- add_stakes: Text lacks tension, consequence, or urgency
- strengthen_voice: Text sounds generic, not like the student's authentic voice
- cut_filler: Text has unnecessary words, redundancy, or padding
- add_evidence: Claims lack specific metrics, numbers, or proof
- deepen_vulnerability: Emotion is surface-level, doesn't name specific fears or failures
- connect_to_theme: Passage feels disconnected from the essay's central argument
- fix_hook: Opening is generic or weak
- sharpen_ending: Conclusion doesn't resonate or crystallize insight
- expand_moment: A key moment passes too quickly without sensory detail
- compress: Text is wordy and could say the same thing more tightly
- add_dialogue: A described interaction would be stronger as a scene with dialogue
- remove_cliche: Text uses clichéd or overused language

Analyze the selected text and recommend 2-3 commands that would most improve it.

Output STRICTLY VALID JSON:
{
  "suggestions": [
    { "command": "command_name", "reason": "Why this text needs this edit", "impact": "How it would improve the essay" }
  ]
}`;
