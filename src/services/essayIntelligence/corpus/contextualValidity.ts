/**
 * contextualValidity.ts — Patterns clichéd in isolation but earned in context.
 *
 * Some phrases, structures, or moves are clichés when used generically but
 * become legitimate craft when used in specific contexts that earn them.
 * The pipeline must distinguish "writer reached for cliché" from "writer used
 * cliché whose context legitimates it."
 *
 * Each entry: the default classification (cliché/overused/generic), the
 * validating context that earns the use, the detection rule for the
 * validating context, and corpus exemplars.
 */

import type { ContextualPattern } from './corpusTypes';

export const CONTEXTUAL_VALIDITY_PATTERNS: ContextualPattern[] = [
  {
    id: 'patchwork-quilt-of-america',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s primary material is fiber arts, sewing, weaving, or textile work. The metaphor is from the writer\'s domain.',
    detectionRule: 'Essay paragraphs 1-N contain ≥3 references to fiber/textile vocabulary (yarn, thread, stitch, weave, hem). Closing metaphor "patchwork quilt of America" or similar then earns its use.',
    exemplars: [{ essayId: '14-harvard-2028-crochet', earningContext: 'Clara\'s entire essay is about crochet inheritance. "I am eager to weave my own mark into the great patchwork quilt that is America" lands because the metaphor is from inside the essay\'s craft, not reached for from outside.' }],
  },
  {
    id: 'shrouded-in-mystery',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase is planted in opening as deliberate over-formal register, then converted by callback at close.',
    detectionRule: 'Phrase appears in paragraph 1-2 with slight register-mismatch from surrounding prose; phrase reappears verbatim in final paragraph in transformed meaning.',
    exemplars: [{ essayId: '09-harvard-2028-bra-shopping', earningContext: 'Orlee plants "Bra shopping has always been shrouded in mystery for me" in paragraph 1; the phrase returns at the close converted from comedic-over-register to genuine acceptance.' }],
  },
  {
    id: 'broken-her-back',
    defaultClassification: 'cliché',
    validatingContext: 'Subject of the verb is a person doing genuine physical labor (live-in caregiver, factory worker, agricultural worker). The phrase grounds in real bodily wear.',
    detectionRule: 'The "back" referent is doing identifiable physical work in the essay. Not an academic worker, not a metaphorical "back."',
    exemplars: [{ essayId: '12-harvard-2028-three-years-alone', earningContext: 'Michael\'s mother is a live-in caregiver. "The woman that has broken her back for me" — the back IS broken because the labor IS physical. Plain idiom carries plain truth.' }],
  },
  {
    id: 'walking-on-eggshells',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s topic literally involves eggs (cooking, baking, farming). The dead idiom is literalized by the topic.',
    detectionRule: 'Idiom appears with literal-world consequence the essay\'s context can produce. Daniella\'s "and I have an empty egg carton to prove it."',
    exemplars: [{ essayId: '08-harvard-2028-cookies', earningContext: 'Walking on eggshells + baking = literal egg consumption. The dead idiom is converted into joke by the topic\'s real-world consequence.' }],
  },
  {
    id: 'find-your-voice',
    defaultClassification: 'overused',
    validatingContext: 'Essay\'s subject is literally voice (singing, speaking, ELL acquisition). The metaphor collapses into literal description.',
    detectionRule: 'Essay contains ≥5 references to literal voice (vocal, speaking, accent, pronunciation, vowels). Closing references to "voice" then operate at both literal and figurative level.',
    exemplars: [{ essayId: '11-harvard-2028-fish-out-of-water', earningContext: 'Michelle\'s essay is literally about her ELL voice (vowels, tongue, lubrication, accent). "Voice and self-expression" carries both meanings simultaneously.' }],
  },
  {
    id: 'follow-your-dreams',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase appears in quoted dialogue from a family member whose worldview the essay is engaging with charitably or critiquing — never in narrator\'s own voice.',
    detectionRule: 'If "follow your dreams" appears in narrator voice → cliché. If it appears in quoted family-member dialogue → context-dependent.',
    exemplars: [],
  },
  {
    id: 'i-found-myself',
    defaultClassification: 'cliché',
    validatingContext: 'The "myself" is grammatically reflexive in a context where the writer is literally being placed somewhere by external force. Used at the moment of locating oneself in a new physical or social environment.',
    detectionRule: 'Phrase appears in scene-locating sentence describing literal placement (in a room, in a class, on a bus). Avoid in metaphorical "I found myself realizing" usage.',
    exemplars: [],
  },
  {
    id: 'changed-my-life',
    defaultClassification: 'overused',
    validatingContext: 'Phrase is used by the writer\'s YOUNGER SELF in retrospective reflection — the older narrator preserves the cliché as authentic to the moment.',
    detectionRule: 'Phrase appears in italicized or quoted reported-thought attributed to a past self, not in adult narrator\'s voice.',
    exemplars: [],
  },
  {
    id: 'taught-me-the-meaning-of',
    defaultClassification: 'cliché',
    validatingContext: 'The "meaning" being taught is a SPECIFIC concept the essay defines through the experience, not a generic abstraction.',
    detectionRule: 'If followed by abstract noun (resilience, perseverance, hope) → cliché. If followed by an essay-specific term the writer has defined through scene → context-dependent.',
    exemplars: [],
  },
  {
    id: 'opened-my-eyes',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s subject involves literal vision (visual art, optometry, blindness, microscopy). The metaphor collapses into literal.',
    detectionRule: 'Essay contains ≥3 references to literal seeing (visual, sight, eyes, lens, microscope). Closing "opened my eyes" then operates at both levels.',
    exemplars: [],
  },
  {
    id: 'never-give-up',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase is voiced by an antagonist or foil character in a context where the writer is COMPLICATING rather than affirming the maxim.',
    detectionRule: 'Phrase appears in quoted dialogue from a character the essay is critiquing or in narrator\'s voice with explicit complication.',
    exemplars: [],
  },
  {
    id: 'against-all-odds',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase is preceded by SPECIFIC odds (numerical: "with 12% acceptance," "as one of 3 girls in a class of 47"). Specificity earns the cliché.',
    detectionRule: 'Sentence preceding contains a specific number or fraction; "against all odds" then becomes shorthand for the specifics.',
    exemplars: [],
  },
  {
    id: 'spread-my-wings',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s subject is literally about flight, birds, aviation, or pilot training. The metaphor collapses into literal.',
    detectionRule: 'Essay context literally involves wings or flight. Otherwise: cliché.',
    exemplars: [],
  },
  {
    id: 'eyes-wide-open',
    defaultClassification: 'overused',
    validatingContext: 'Phrase is preceded or followed by what specifically the eyes saw — sensory specificity earns the otherwise-generic phrase.',
    detectionRule: 'Sentence pair: "eyes wide open" + specific sensory inventory of what was seen.',
    exemplars: [],
  },
  {
    id: 'turned-the-page',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s subject involves literal pages (writing, reading, book-binding, calligraphy). Metaphor collapses into literal.',
    detectionRule: 'Essay paragraphs contain ≥3 references to literal pages, books, or writing surfaces.',
    exemplars: [{ essayId: '05-harvard-2028-i-too-can-dance', earningContext: 'Sarika\'s essay is about writing-as-dancing-across-the-page. Literal pages everywhere; "dance across the page" earns the metaphor.' }],
  },
  {
    id: 'world-came-crashing-down',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase appears in voiced antagonist framing (Marcus-style "voicing the bullies\' framing") rather than narrator\'s own voice. Narrator quotes the cliché to control it.',
    detectionRule: 'Cliché appears italicized or in quoted-thought form attributed to others or to a younger self.',
    exemplars: [],
  },
  {
    id: 'silver-lining',
    defaultClassification: 'cliché',
    validatingContext: 'Phrase is critiqued or rejected by the narrator, not endorsed. The cliché is named to be refused.',
    detectionRule: 'Phrase preceded by negation or skepticism marker ("the so-called," "the supposed," "what they called the").',
    exemplars: [],
  },
  {
    id: 'journey-of-a-thousand-miles',
    defaultClassification: 'cliché',
    validatingContext: 'Essay\'s subject involves literal long-distance travel, walking, migration, or journey. The Lao Tzu allusion earns its use.',
    detectionRule: 'Essay paragraphs reference literal miles traveled, footsteps, or migration distance.',
    exemplars: [],
  },
  {
    id: 'made-me-who-i-am',
    defaultClassification: 'cliché',
    validatingContext: 'Followed by SPECIFIC identity contents the essay has demonstrated, not abstract self-claims. Sarika could close with "made me who I am" — a writer — because the essay has demonstrated the writing-self in scene.',
    detectionRule: 'Phrase is followed by specific contents (a verb, a domain, a relationship), not abstract claims (a person who cares, someone who believes).',
    exemplars: [],
  },
  {
    id: 'every-step-of-the-way',
    defaultClassification: 'cliché',
    validatingContext: 'Essay literally involves stepping (walking, climbing, running, dancing). Or the steps are specifically counted earlier in the essay.',
    detectionRule: 'Earlier paragraphs contain literal step-counting or step-imagery.',
    exemplars: [{ essayId: '07-harvard-2028-peabody-skatepark', earningContext: 'Billy\'s essay has literal steps up the ramp (halfway, two-thirds, three-quarters). Closing references to progress can earn step-vocabulary because the essay has rendered actual steps.' }],
  },
  {
    id: 'looked-back-now',
    defaultClassification: 'overused',
    validatingContext: 'Phrase appears in service of a SPECIFIC retrospective insight that the essay has earned through preceding paragraphs, not as a generic transition device.',
    detectionRule: 'Phrase is followed by a non-generic insight specific to the essay\'s actual content.',
    exemplars: [],
  },
];
