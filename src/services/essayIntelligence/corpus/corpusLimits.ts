/**
 * corpusLimits.ts — "What this move/archetype CANNOT be used to teach."
 *
 * Aggregated from each review's "What This Essay Cannot Be Used To Teach"
 * sections (Part V close in v2.1 reviews 09-14; equivalent guidance in
 * earlier reviews). Each limit names a detectable condition under which
 * the move or archetype fails, and gives detection guidance.
 *
 * Coaching MUST consult corpus limits before suggesting any move/archetype
 * to a student whose draft or context exhibits a limiting condition.
 */

import type { CorpusLimit } from './corpusTypes';

export const CORPUS_LIMITS: CorpusLimit[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // ARCHETYPE LIMITS
  // ─────────────────────────────────────────────────────────────────────────
  {
    targetId: 'interior-transformation-metaphor-possession',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student\'s natural register is plain or comedic, not literary-reflective', reason: 'The verb-possession architecture requires sustained literary register; plain-voice students attempting this archetype produce surface-imitation that lacks the load-bearing metaphoric craft.', detectionGuidance: 'Sample the student\'s drafts for metaphor-density, sentence-length variation, and material-specification habit. If the student\'s default sentences are short and direct, this archetype is wrong.' },
      { condition: 'Student cannot identify two domains where vocabulary can plausibly migrate', reason: 'The whole architecture depends on a verb-possession bridge between an abandoned and a new identity domain. Without genuinely-related domains, the metaphor reaches collapse.', detectionGuidance: 'Ask the student to name the metaphor-source verb and the target object. If the verb and object\'s literal motions are too distant (pencil sutures vs. pirouettes), the bridge will fail.' },
    ],
  },
  {
    targetId: 'peak-scene-community-integration',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student\'s emotional integration moments are diffuse rather than concentrated in one rendered scene', reason: 'The archetype depends on a single peak scene carrying the essay\'s weight; diffuse community-warmth essays lack the load-bearing concentrated moment.', detectionGuidance: 'Ask the student to name the single most specific moment of community-integration they remember. If they list multiple equal moments, this archetype won\'t work.' },
      { condition: 'Student cannot ethically render the other character\'s contribution to the scene', reason: 'Francisco withholds Izzy\'s specific content respectfully; some scenes can\'t be written without violating someone else\'s privacy.', detectionGuidance: 'If the peak scene\'s content is irreducibly someone else\'s personal disclosure, the archetype fails — the writer can\'t replace it without losing the scene\'s weight.' },
    ],
  },
  {
    targetId: 'strategic-balance-plain-prose',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student\'s overall application materials don\'t establish a strong one-dimensional trait that needs counterbalancing', reason: 'The archetype\'s strategic function REQUIRES other application materials portraying one strong trait. Without that context, the essay has no balancing work to do and reads as ordinary growth narrative.', detectionGuidance: 'Review the student\'s activities, awards, recommendations. If no single trait dominates, this archetype lacks its strategic purpose.' },
      { condition: 'Student\'s childhood scene doesn\'t actually illustrate a counter-capacity to the established trait', reason: 'The archetype REQUIRES the childhood scene to genuinely demonstrate the counter-capacity (Billy\'s spontaneity vs. his planning identity). A scene that merely happened in childhood without thematic relevance fails.', detectionGuidance: 'Ask: does the student\'s childhood scene literally show them doing the thing their other materials suggest they don\'t do?' },
    ],
  },
  {
    targetId: 'mundane-topic-multi-lens',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student has only surface familiarity with the chosen lenses', reason: 'The archetype REQUIRES genuine domain expertise in 2+ fields — the lens vocabularies must be deployed naturally, not name-dropped. Daniella\'s chemistry+music genuinely operate.', detectionGuidance: 'Ask the student to write three sentences in each lens vocabulary without consulting reference. If the vocabulary feels strained, the archetype will read as performance.' },
      { condition: 'Topic is dramatic enough that intellectualization would feel deflective', reason: 'The archetype works for INTENTIONALLY mundane topics. Applied to a serious topic (grief, illness), the multi-lens investigation reads as avoidance.', detectionGuidance: 'If the topic carries inherent emotional weight, this archetype is wrong; choose plain-voice or peak-scene archetype instead.' },
    ],
  },
  {
    targetId: 'bait-and-switch-foil-refutation',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student has only one significant biographical difference (not multiple)', reason: 'The triplet-anaphora-of-difference REQUIRES three or more layered identity-categories. Used by a student with a single biographical issue, the triplet feels stretched or false.', detectionGuidance: 'Ask the student to list distinct identity-categories the essay would need to carry. Fewer than three: choose a different archetype.' },
      { condition: 'Student\'s comedic voice is unstable', reason: 'The bait-and-switch ONLY works if the comedic opening is genuinely funny. Unstable comedic voice produces an opening that doesn\'t earn the heavy material that follows.', detectionGuidance: 'Sample the student\'s drafts for sustained comedic register. If humor lands inconsistently, choose a stable reflective archetype instead.' },
      { condition: 'Student\'s opposing-view foil is a straw-man (e.g., a teacher who was just mean)', reason: 'Foil-refutation requires lovable foils whose worldview is coherent. Straw-man antagonists make the refutation cheap and unearned.', detectionGuidance: 'Ask: can the student articulate the foil\'s worldview in the foil\'s own most-charitable terms? If not, the archetype fails.' },
    ],
  },
  {
    targetId: 'child-memory-extended-metaphor-prophecy',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student lacks a genuine childhood memory that contains the metaphor-source as literal scene', reason: 'The architecture depends on a real scene that can be rendered literal first; invented scenes will fail under close reading.', detectionGuidance: 'Ask the student for the specific year, location, and other people present in the candidate childhood scene. If the answer is vague, the scene is too thin.' },
      { condition: 'Student\'s harm experiences are diffuse social isolation rather than acute incidents', reason: 'The archetype works through one-scene-as-evidence. Years of slow social freezing-out can\'t be compressed into one rendered incident the way a specific bullying video can.', detectionGuidance: 'Ask: is there a single hour or single afternoon that captures the harm? If no, choose a different archetype.' },
      { condition: 'Student is still IN the crisis (still unsafe, still in the same school)', reason: 'The refusal-of-external-resolution requires that the writer\'s internal resolution is genuine. If they\'re still inside the harm, the refusal reads as avoidance not maturity.', detectionGuidance: 'Verify the writer has actually resolved the situation internally; if the harm is ongoing, this archetype is psychologically inappropriate.' },
    ],
  },
  {
    targetId: 'metaphor-literalization-scientific',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student lacks genuine engagement with a scientific or technical domain', reason: 'The scientific-literalization REQUIRES real domain knowledge. Domain-knowledgeable readers will detect fake mechanisms immediately.', detectionGuidance: 'Ask the student to explain the candidate mechanism in their own words without consulting sources. If they can\'t, the move will fail.' },
      { condition: 'The governing metaphor is purely poetic with no mechanistic correlate', reason: 'Not every metaphor has an underlying mechanism. The archetype only works when biology, physics, psychology, or mathematics ACTUALLY describes the writer\'s experience.', detectionGuidance: 'Ask: what real mechanism in any field would describe what the metaphor describes? If none exists, choose a different archetype.' },
    ],
  },
  {
    targetId: 'plain-voice-sacrifice-ritual',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student\'s content isn\'t dramatic enough to stand without decoration', reason: 'Plain voice REQUIRES strong content. Without a substantial sacrifice or relationship, plain prose has nothing to carry and reads as flat.', detectionGuidance: 'Sample the content as 3-sentence summary. If the summary needs adjectives to convey weight, plain voice won\'t work.' },
      { condition: 'Student\'s two identity framings (theirs vs. yours) are dramatically different rather than subtly distinct', reason: 'The one-word identity distinction works because "pride and joy" and "hope" are NEAR synonyms. Dramatically different framings (e.g., "smart kid" vs. "fraud") read as melodrama.', detectionGuidance: 'Ask the student to name the parent\'s framing and their own framing. If the framings are both loving but differ in emphasis, the move works; if the framings contradict, choose a different archetype.' },
      { condition: 'There is no specific ritual or pattern structuring the relationship', reason: 'The time-stamped ritual is the archetype\'s structural spine. Without a real ritual (specific times, named pattern, recurring content), the archetype lacks structure.', detectionGuidance: 'Ask: is there something that happens at specific times in this relationship, repeatedly? If no, choose a different archetype.' },
    ],
  },
  {
    targetId: 'obsession-intellectual-autobiography-maximalist',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student has surface familiarity rather than genuine domain expertise', reason: 'Maximalist domain-insider voice REQUIRES real fluency. Performed fluency is detected within the first paragraph by anyone who knows the domain.', detectionGuidance: 'Ask the student to write a paragraph in the domain register without preparation. If the vocabulary feels strained or the references feel tacked on, the archetype fails.' },
      { condition: 'Passion-to-conviction bridges are manufactured for the essay', reason: 'Art-to-policy specific bridging works only when the writer could defend the bridge in conversation. Generated bridges are hollow.', detectionGuidance: 'Ask the student to argue the policy position from the artwork in a 5-minute mock conversation. If they can\'t, the bridge will read as performance.' },
      { condition: 'Religious-framing-applied-to-art is the writer\'s preferred move but their passion isn\'t actually religion-sized', reason: 'Religious framing only works at religion-scale devotion. Applied to a casual interest, it reads as melodrama.', detectionGuidance: 'Ask: how many hours per week does the student engage with this passion? Casual hobbyists should not use religious framing.' },
    ],
  },
  {
    targetId: 'compressed-heritage',
    targetType: 'archetype',
    cannotTeachWhen: [
      { condition: 'Student doesn\'t genuinely have family history to carry', reason: 'Compression cannot be faked; readers can tell when the weight of compressed content isn\'t really there.', detectionGuidance: 'If the student is grasping for family-history beats, this archetype is wrong.' },
      { condition: 'Family history is ongoing trauma rather than survived trauma', reason: 'The compression honors closed history. Active trauma cannot be compressed without flattening.', detectionGuidance: 'Verify the family event is far enough in the past that the writer\'s relationship to it is reflective, not raw.' },
      { condition: 'Student\'s craft/practice doesn\'t support a closing-metaphor from within the essay\'s material', reason: 'Clara\'s "patchwork quilt of America" works because crochet is the essay\'s material. Without a craft-domain whose vocabulary supports the closing metaphor, the closing reaches outside.', detectionGuidance: 'Ask: what closing metaphor would come from within the essay\'s material? If none surfaces, the archetype is incomplete.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MOVE LIMITS
  // ─────────────────────────────────────────────────────────────────────────
  {
    targetId: 'verb-possession-of-specialized-register',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The verb is too alien to the object (e.g., "my pencil sutures")', reason: 'The verb\'s literal action must be at least compatible with the object\'s actual behavior; readers can\'t accept impossible possession.', detectionGuidance: 'Test: can the object plausibly perform a motion related to the verb\'s literal meaning? Pencils rotate (pirouette works). Pencils don\'t suture.' },
      { condition: 'No prior sentences have primed the metaphor', reason: 'Possession lands when the reader has been gradually prepared by extended-metaphor priming. Used cold, possession reads as overreach.', detectionGuidance: 'Check whether the essay has earlier paragraphs sprinkling Y-domain verbs onto non-Y objects.' },
    ],
  },
  {
    targetId: 'scientific-literalization-of-metaphor',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The mechanism is invented rather than real', reason: 'Domain readers will detect fabricated science. The move\'s entire weight depends on accuracy.', detectionGuidance: 'Verify the mechanism by independent search; if the writer can\'t cite a textbook or article, do not use this move.' },
      { condition: 'Mechanism is real but doesn\'t actually describe the writer\'s experience', reason: 'Forced fits read as cleverness rather than insight; the move depends on genuine correspondence.', detectionGuidance: 'Ask the student to describe how the mechanism literally happened in their life. If the answer is metaphorical not literal, the move fails.' },
    ],
  },
  {
    targetId: 'reveal-through-consequence',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The implied cause is too ambiguous', reason: 'Multiple plausible causes mean the reader can\'t reliably infer; the reveal fails.', detectionGuidance: 'Test: present the consequence sentence to a reader who doesn\'t know the central fact. If they reliably guess the fact, the move works. If they guess multiple things, it doesn\'t.' },
    ],
  },
  {
    targetId: 'name-central-fact-once',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The central fact is so unfamiliar that one mention isn\'t enough for the reader to track', reason: 'The "name once" rule assumes the fact is recognizable to the reader. Truly unfamiliar facts may need 2-3 mentions.', detectionGuidance: 'If the central fact is rare or technical, the reader may need more anchors; calibrate count to recognizability.' },
    ],
  },
  {
    targetId: 'one-word-identity-distinction',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The two framings are too dramatically different', reason: 'Near-synonymous framings produce the subtle distinction that IS the move; dramatically different framings produce melodrama.', detectionGuidance: 'Test: are both framings expressions of love (or both of expectation)? If they\'re categorically opposite, the move fails.' },
    ],
  },
  {
    targetId: 'shocking-opener-via-recognizable-source',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'The cultural source is too obscure for plausible reader-recognition', reason: 'If the reader can\'t recover the context, the shock reads as gratuitous rather than legitimated.', detectionGuidance: 'Ask: would a well-read but non-specialist AO recognize the source within seconds? If not, the move fails.' },
    ],
  },
  {
    targetId: 'art-to-policy-specific-bridging',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'Bridges are manufactured for the essay rather than genuinely held', reason: 'The move depends on bridges the writer could defend in conversation. Generated bridges read as performance.', detectionGuidance: 'Test: can the writer argue the bridge in a 5-minute mock seminar? If not, the bridge isn\'t real.' },
    ],
  },
  {
    targetId: 'religious-framing-applied-to-art',
    targetType: 'move',
    cannotTeachWhen: [
      { condition: 'Used heavy-handed rather than light-touch', reason: 'Religious framing works as playful exaggeration. Heavy-handed deployment tips into melodrama.', detectionGuidance: 'Count religious-vocabulary instances per paragraph. More than 2 per paragraph is heavy-handed.' },
    ],
  },
];
