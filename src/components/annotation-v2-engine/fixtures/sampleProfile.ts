// Workstream L — hand-built `EssayProfile` fixture.
//
// The essay: a high-school junior reflecting on a failed robotics
// competition. Subject matter chosen because:
//   - it's a relatable junior/senior archetype, not a rare niche;
//   - the arc has a clear fulcrum (the failure) and a clear resolution
//     (what the failure taught), so role labels render cleanly;
//   - it lets us demonstrate every tier naturally — stumbling hook,
//     functional middle, a genuinely-exceptional observational line,
//     a masterful image at the end.
//
// Tier distribution (required by task spec, realistic left-tilted):
//   CRITICAL     ×  2   (the hook's first line + a cliché in P2)
//   NEEDS_WORK   ×  3   (vague claim in P2, flat summary in P4, weak
//                        conclusion restatement in P5)
//   FUNCTIONAL   × 23   (connective prose, establishing context)
//   STRONG       ×  8   (concrete moments, verb choices)
//   EXCEPTIONAL  ×  3   (the three thesis / aphorism lines in P3/P4)
//   MASTERFUL    ×  1   (the "hex key I could not remember picking up")
//   -------
//   TOTAL        × 40
//
// Cross-refs (5 total):
//   xref-1  ¶3 s4 → ¶1 s2    (fulcrum paragraph echoing the hook's claim)
//   xref-2  ¶3 s7 → ¶2 s3    (the failure callback to the pre-failure cockiness)
//   xref-3  ¶4 s3 → ¶3 s6    (resolution referring to the fulcrum insight)
//   xref-4  ¶5 s2 → ¶1 s1    (closing returns to opening image, transformed)
//   xref-5  ¶4 s5 → ¶2 s5    (what "practice" meant then vs. now)
//
// Improvement phase: 'Architecture' — mid-journey student. The essay
// has a voice and a through-line; the work now is paragraph-level
// shape and connective tissue.

import type {
  EssayProfile,
  Paragraph,
  SentenceProfile,
  Annotation,
  CrossRef,
  HolisticSynthesis,
  NorthStar,
  OverviewData,
  Understanding,
} from '../types/profile';

// ---------------------------------------------------------------------------
// Helper — build an Understanding block without all the `readonly`
// boilerplate at call sites. The type itself stays readonly.
// ---------------------------------------------------------------------------

const u = (
  observedFunctions: string[],
  inferredIntents: string[],
  narrativeContributions: string[],
  craftDetails: string[],
  significantChoices: string[],
): Understanding => ({
  observedFunctions,
  inferredIntents,
  narrativeContributions,
  craftDetails,
  significantChoices,
});

// ---------------------------------------------------------------------------
// Paragraph texts.
// Kept as concatenations of the sentence strings so offsets stay in
// sync with the `SentenceProfile` entries below.
// ---------------------------------------------------------------------------

/* Paragraph 1 — HOOK (6 sentences, ~100 words). */
const P1_SENTENCES: string[] = [
  'I lost a robotics match in ninety seconds.',
  'That number sounds small until you imagine the sound of a servo stripping its gears while your team captain looks at you from across the arena.',
  'We were ranked third in the state going into that regional.',
  'Our drivetrain had survived thirty practice runs.',
  'Our autonomous script had passed every bench test the night before.',
  'And then, in a cafeteria gym in Hayward, everything I thought I understood about building things quietly came apart.',
];

/* Paragraph 2 — BUILDUP (9 sentences, ~155 words). */
const P2_SENTENCES: string[] = [
  'For most of the season I believed I was the careful one on the team.',
  'I was the student who checked torque values twice and labeled every wire with color-coded shrink tubing.',
  'When the older kids teased me for being slow, I told myself I was slow on purpose.',
  'Precision is its own kind of speed, I liked to say, which now strikes me as the sort of line a sixteen-year-old uses to avoid admitting fear.',
  'Practice, for me, had become a performance of being prepared.',
  'I arrived early and stayed late, I ran the same three drills until the battery died, and I assumed that this repetition was the same thing as understanding.',
  'What I did not do was take the chassis apart once all season.',
  'I had tightened it, I had tested it, I had photographed it for our engineering notebook.',
  'But I had never once asked the robot to show me what I had not thought of.',
];

/* Paragraph 3 — FULCRUM (10 sentences, ~170 words). */
const P3_SENTENCES: string[] = [
  'Ninety seconds into our first qualifying match, the front-left motor mount sheared clean off the frame.',
  'The bot dragged sideways into the low goal and froze.',
  'I knew immediately what had happened because I had torqued that bolt myself the week before, and I had torqued it too much.',
  'What I had thought was carefulness was actually a form of pressure I did not know how to measure.',
  'The referee waved us off the field, and for a few seconds I stood at the alliance station with a hex key I could not remember picking up.',
  'The failure was not that the bolt had failed — bolts fail, that is why we carry spares.',
  'The failure was that every inspection I had ever done had been designed to confirm that things were fine, not to discover whether they were.',
  'Our captain did not yell at me.',
  'She crouched next to the robot on the carpet and asked me, very calmly, what I thought we should try first.',
  'It is the first time in my life someone gave me a problem instead of a verdict.',
];

/* Paragraph 4 — RESOLUTION (8 sentences, ~140 words). */
const P4_SENTENCES: string[] = [
  'We did not win that competition.',
  'We did not even make it out of qualifiers.',
  'But we rebuilt the mount between matches using a spare plate and two zip ties, and in the last match of the day the robot held together long enough to score one cycle.',
  'That one cycle mattered to me in a way the thirty clean practice runs never had.',
  'I began, after that weekend, to practice differently.',
  'I started taking things apart on purpose, not to find problems, but to learn what a working system felt like under my hands when I was not trying to prove it worked.',
  'It is a small distinction that changed how I study for physics tests and how I write drafts of essays like this one.',
  'I learned that curiosity is louder than confidence, and that the two can be mistaken for each other only until the first thing breaks.',
];

/* Paragraph 5 — CLOSING (7 sentences, ~120 words). */
const P5_SENTENCES: string[] = [
  'I keep the sheared bolt in a film canister on my desk.',
  'I do not need it to remember that ninety seconds in Hayward, because I think about that match every time I am about to say I am ready for something.',
  'I keep it because of the hex key.',
  'It is green, the small kind that comes in bulk packs at the hardware store, and it lives in my pencil case now between a dull mechanical pencil and a charger.',
  'Every few weeks I pull it out to tighten the spine of a notebook or a friend\'s eyeglasses.',
  'It weighs almost nothing.',
  'It reminds me that carefulness is not the opposite of surprise, and that the most useful tool I own is the one that asks me to stop and look.',
];

/* Build paragraph text by joining sentences with single spaces. */
const joinSentences = (ss: readonly string[]): string => ss.join(' ');

const P1_TEXT = joinSentences(P1_SENTENCES);
const P2_TEXT = joinSentences(P2_SENTENCES);
const P3_TEXT = joinSentences(P3_SENTENCES);
const P4_TEXT = joinSentences(P4_SENTENCES);
const P5_TEXT = joinSentences(P5_SENTENCES);

const ESSAY_TEXT = [P1_TEXT, P2_TEXT, P3_TEXT, P4_TEXT, P5_TEXT].join('\n\n');

// ---------------------------------------------------------------------------
// Offset computation — within-paragraph offsets for each sentence.
// ---------------------------------------------------------------------------

function computeParagraphOffsets(
  sentences: readonly string[],
): readonly { readonly start: number; readonly end: number }[] {
  const out: { start: number; end: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i]!;
    const start = cursor;
    const end = start + s.length;
    out.push({ start, end });
    // Joiner is a single space (except after last sentence in the paragraph).
    cursor = end + (i < sentences.length - 1 ? 1 : 0);
  }
  return out;
}

const P1_OFFSETS = computeParagraphOffsets(P1_SENTENCES);
const P2_OFFSETS = computeParagraphOffsets(P2_SENTENCES);
const P3_OFFSETS = computeParagraphOffsets(P3_SENTENCES);
const P4_OFFSETS = computeParagraphOffsets(P4_SENTENCES);
const P5_OFFSETS = computeParagraphOffsets(P5_SENTENCES);

// ---------------------------------------------------------------------------
// Cross-references (defined here so the sentence-profile table can
// embed the correct `inboundRefs`).
// ---------------------------------------------------------------------------

const XREFS: readonly CrossRef[] = [
  {
    id: 'xref-1',
    targetSentenceId: 'p1s2',
    label: '¶1 · s2',
    direction: 'back',
    preview: '"servo stripping its gears while your team captain looks at you" — the hook\'s moment of dread.',
  },
  {
    id: 'xref-2',
    targetSentenceId: 'p2s3',
    label: '¶2 · s3',
    direction: 'back',
    preview: '"I told myself I was slow on purpose" — the cockiness the failure exposes.',
  },
  {
    id: 'xref-3',
    targetSentenceId: 'p3s6',
    label: '¶3 · s6',
    direction: 'back',
    preview: '"bolts fail, that is why we carry spares" — the reframing the resolution builds on.',
  },
  {
    id: 'xref-4',
    targetSentenceId: 'p1s1',
    label: '¶1 · s1',
    direction: 'back',
    preview: '"I lost a robotics match in ninety seconds." — the opening claim the closing re-enters.',
  },
  {
    id: 'xref-5',
    targetSentenceId: 'p2s5',
    label: '¶2 · s5',
    direction: 'back',
    preview: '"Practice, for me, had become a performance of being prepared."',
  },
];

/** Build a per-target inbound map so `SentenceProfile.inboundRefs` is accurate. */
const INBOUND_BY_TARGET: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  // Each xref's SOURCE sentence is encoded by the build-plan above;
  // we re-encode it here as a table keyed by `xref.id`.
  const source: Record<string, string> = {
    'xref-1': 'p3s4',
    'xref-2': 'p3s7',
    'xref-3': 'p4s3',
    'xref-4': 'p5s2',
    'xref-5': 'p4s5',
  };
  for (const x of XREFS) {
    const src = source[x.id];
    if (!src) continue;
    const arr = map.get(x.targetSentenceId) ?? [];
    arr.push(src);
    map.set(x.targetSentenceId, arr);
  }
  return map;
})();

const inboundRefsFor = (sentenceId: string): readonly string[] =>
  INBOUND_BY_TARGET.get(sentenceId) ?? [];

// ---------------------------------------------------------------------------
// Sentence profiles.
// One entry per sentence, in reading order. IDs are `p{N}s{M}` with both
// indices 1-based for student-facing parity (p1s1 = "first sentence of
// first paragraph").
// ---------------------------------------------------------------------------

// Paragraph 1 — HOOK
const P1: readonly SentenceProfile[] = [
  {
    id: 'p1s1',
    paragraphIndex: 0,
    indexWithinParagraph: 0,
    text: P1_SENTENCES[0]!,
    startOffset: P1_OFFSETS[0]!.start,
    endOffset: P1_OFFSETS[0]!.end,
    tier: 'CRITICAL',
    effectiveness: 34,
    understanding: u(
      ['announces a loss', 'compresses a stakes-claim into nine words'],
      ['wants immediacy', 'avoids setup'],
      ['opens the arc with the outcome, not the build-up'],
      ['declarative syntax', 'no adjectives', 'flat affect'],
      ['picks "lost" over "blew" — the verb is emotionally thin for a hook'],
    ),
    strengths: ['compactness', 'willingness to open with a loss'],
    weaknesses: ['no sensory detail', 'no specificity about what the match was', 'emotionally flat'],
    annotationIds: ['ann-1'],
    inboundRefs: inboundRefsFor('p1s1'),
  },
  {
    id: 'p1s2',
    paragraphIndex: 0,
    indexWithinParagraph: 1,
    text: P1_SENTENCES[1]!,
    startOffset: P1_OFFSETS[1]!.start,
    endOffset: P1_OFFSETS[1]!.end,
    tier: 'STRONG',
    effectiveness: 81,
    understanding: u(
      ['renders the moment of failure sonically', 'places a witness inside the frame'],
      ['earns the hook\'s bluntness by following it with specificity'],
      ['recovers the sensory detail the opener skipped'],
      ['gerund chain ("stripping... looks")', 'aural imagery before visual'],
      ['chooses the team captain\'s gaze over the crowd — intimate scale'],
    ),
    strengths: ['sound-first rendering', 'the captain\'s gaze grounds the scene'],
    weaknesses: ['sentence runs long; could break after "gears"'],
    annotationIds: ['ann-2'],
    inboundRefs: inboundRefsFor('p1s2'),
  },
  {
    id: 'p1s3',
    paragraphIndex: 0,
    indexWithinParagraph: 2,
    text: P1_SENTENCES[2]!,
    startOffset: P1_OFFSETS[2]!.start,
    endOffset: P1_OFFSETS[2]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 66,
    understanding: u(
      ['establishes stakes via ranking'],
      ['wants the reader to know the loss mattered'],
      ['gives the essay external context before moving inward'],
      ['specific noun phrase "third in the state"'],
      [],
    ),
    strengths: ['concrete ranking number'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p1s3'),
  },
  {
    id: 'p1s4',
    paragraphIndex: 0,
    indexWithinParagraph: 3,
    text: P1_SENTENCES[3]!,
    startOffset: P1_OFFSETS[3]!.start,
    endOffset: P1_OFFSETS[3]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 62,
    understanding: u(
      ['establishes preparation via practice-run count'],
      ['wants to set up the "but" of the failure'],
      ['part of the paired setup (practice / script) that the failure undoes'],
      ['concrete number "thirty"'],
      [],
    ),
    strengths: ['concrete number'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p1s4'),
  },
  {
    id: 'p1s5',
    paragraphIndex: 0,
    indexWithinParagraph: 4,
    text: P1_SENTENCES[4]!,
    startOffset: P1_OFFSETS[4]!.start,
    endOffset: P1_OFFSETS[4]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 63,
    understanding: u(
      ['paired with previous sentence — doubles down on preparedness'],
      ['reinforces the setup'],
      ['sets up dramatic irony'],
      ['parallel structure with s4'],
      [],
    ),
    strengths: ['parallel structure with previous sentence'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p1s5'),
  },
  {
    id: 'p1s6',
    paragraphIndex: 0,
    indexWithinParagraph: 5,
    text: P1_SENTENCES[5]!,
    startOffset: P1_OFFSETS[5]!.start,
    endOffset: P1_OFFSETS[5]!.end,
    tier: 'STRONG',
    effectiveness: 84,
    understanding: u(
      ['names the thematic stakes', 'moves from event to epistemology'],
      ['wants the reader to know this essay is about how the student knows what they know'],
      ['turns the hook from anecdote into thesis without stating it directly'],
      ['phrase "quietly came apart" — understatement; reuse of "quietly" motif'],
      ['specific place name "Hayward" grounds the abstraction'],
    ),
    strengths: [
      'specific place name grounds the abstraction',
      '"quietly came apart" lands the stakes without overstating',
    ],
    weaknesses: [],
    annotationIds: ['ann-3'],
    inboundRefs: inboundRefsFor('p1s6'),
  },
];

// Paragraph 2 — BUILDUP
const P2: readonly SentenceProfile[] = [
  {
    id: 'p2s1',
    paragraphIndex: 1,
    indexWithinParagraph: 0,
    text: P2_SENTENCES[0]!,
    startOffset: P2_OFFSETS[0]!.start,
    endOffset: P2_OFFSETS[0]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 64,
    understanding: u(
      ['introduces self-characterization'],
      ['wants to contrast self-image with upcoming failure'],
      ['opens the buildup with a claim the paragraph will undo'],
      ['possessive-of-role phrasing ("the careful one")'],
      [],
    ),
    strengths: ['sets up paragraph-level reversal'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p2s1'),
  },
  {
    id: 'p2s2',
    paragraphIndex: 1,
    indexWithinParagraph: 1,
    text: P2_SENTENCES[1]!,
    startOffset: P2_OFFSETS[1]!.start,
    endOffset: P2_OFFSETS[1]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 72,
    understanding: u(
      ['provides specific evidence for the "careful" claim'],
      ['earns the characterization with texture'],
      ['makes the later reversal more painful because the preparation was real'],
      ['concrete "color-coded shrink tubing"', 'two specific habits'],
      [],
    ),
    strengths: ['specific habit detail ("color-coded shrink tubing")'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p2s2'),
  },
  {
    id: 'p2s3',
    paragraphIndex: 1,
    indexWithinParagraph: 2,
    text: P2_SENTENCES[2]!,
    startOffset: P2_OFFSETS[2]!.start,
    endOffset: P2_OFFSETS[2]!.end,
    tier: 'STRONG',
    effectiveness: 80,
    understanding: u(
      ['names the cockiness the failure later exposes'],
      ['wants to show the reader the self-deception in real time'],
      ['plants the exact claim ¶3 will revisit as cross-reference'],
      ['colloquial register ("teased me")', 'past-tense confession'],
      ['the student outs themselves rather than being exposed'],
    ),
    strengths: ['lands the self-deception in the student\'s own words'],
    weaknesses: [],
    annotationIds: ['ann-5'],
    inboundRefs: inboundRefsFor('p2s3'),
  },
  {
    id: 'p2s4',
    paragraphIndex: 1,
    indexWithinParagraph: 3,
    text: P2_SENTENCES[3]!,
    startOffset: P2_OFFSETS[3]!.start,
    endOffset: P2_OFFSETS[3]!.end,
    tier: 'CRITICAL',
    effectiveness: 37,
    understanding: u(
      ['delivers an aphorism plus a self-puncture'],
      ['wants to sound older than 16 while also mocking the instinct'],
      ['leans on the "sort of line a sixteen-year-old uses" joke'],
      ['abstract "Precision is its own kind of speed"', 'tonally unstable'],
      ['tries to do too many jobs — aphorism, confession, self-deprecation — in one sentence'],
    ),
    strengths: ['self-awareness about the cliché'],
    weaknesses: [
      '"Precision is its own kind of speed" is a flat cliché, not a student voice',
      'sentence overloads three moves at once',
      'self-deprecation telegraphs the reversal too early',
    ],
    annotationIds: ['ann-6', 'ann-7'],
    inboundRefs: inboundRefsFor('p2s4'),
  },
  {
    id: 'p2s5',
    paragraphIndex: 1,
    indexWithinParagraph: 4,
    text: P2_SENTENCES[4]!,
    startOffset: P2_OFFSETS[4]!.start,
    endOffset: P2_OFFSETS[4]!.end,
    tier: 'STRONG',
    effectiveness: 82,
    understanding: u(
      ['names the central metaphor: practice as performance'],
      ['wants the reader to register that the preparation was a pose'],
      ['sets up the resolution\'s reframing of what practice means'],
      ['precise noun "performance" (theatrical connotation)'],
      [],
    ),
    strengths: [
      '"performance of being prepared" names the self-deception cleanly',
      'one clear metaphor per sentence — not overloaded',
    ],
    weaknesses: [],
    annotationIds: ['ann-8'],
    inboundRefs: inboundRefsFor('p2s5'),
  },
  {
    id: 'p2s6',
    paragraphIndex: 1,
    indexWithinParagraph: 5,
    text: P2_SENTENCES[5]!,
    startOffset: P2_OFFSETS[5]!.start,
    endOffset: P2_OFFSETS[5]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 68,
    understanding: u(
      ['provides evidence for the "performance" claim'],
      ['wants the reader to picture the behavior, not just hear the abstraction'],
      ['extends the paragraph\'s evidence layer'],
      ['triad structure ("arrived early... stayed late... ran... until")'],
      [],
    ),
    strengths: ['triadic rhythm', 'concrete evidence of the behavior'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p2s6'),
  },
  {
    id: 'p2s7',
    paragraphIndex: 1,
    indexWithinParagraph: 6,
    text: P2_SENTENCES[6]!,
    startOffset: P2_OFFSETS[6]!.start,
    endOffset: P2_OFFSETS[6]!.end,
    tier: 'STRONG',
    effectiveness: 83,
    understanding: u(
      ['delivers the buildup\'s thesis via an absence'],
      ['wants the reader to feel the omission as a character trait'],
      ['the missing action becomes the paragraph\'s center of gravity'],
      ['negative construction ("What I did not do")', 'direct, unadorned'],
      ['names what\'s missing rather than what\'s present'],
    ),
    strengths: [
      'names the absence, which lands harder than naming presence',
      'one action, one sentence — earns its weight',
    ],
    weaknesses: [],
    annotationIds: ['ann-9'],
    inboundRefs: inboundRefsFor('p2s7'),
  },
  {
    id: 'p2s8',
    paragraphIndex: 1,
    indexWithinParagraph: 7,
    text: P2_SENTENCES[7]!,
    startOffset: P2_OFFSETS[7]!.start,
    endOffset: P2_OFFSETS[7]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 65,
    understanding: u(
      ['provides a triadic follow-on to s7\'s claim'],
      ['wants the reader to register the substitutes for the real work'],
      ['reinforces the "performance" metaphor through an action list'],
      ['tricolon ("tightened... tested... photographed")', 'parallel verbs'],
      [],
    ),
    strengths: ['tricolon rhythm'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p2s8'),
  },
  {
    id: 'p2s9',
    paragraphIndex: 1,
    indexWithinParagraph: 8,
    text: P2_SENTENCES[8]!,
    startOffset: P2_OFFSETS[8]!.start,
    endOffset: P2_OFFSETS[8]!.end,
    tier: 'NEEDS_WORK',
    effectiveness: 48,
    understanding: u(
      ['articulates the missing-stance as a negative sentence'],
      ['wants to close the paragraph on the core failure'],
      ['introduces the "ask the robot to show me" frame that resolution picks up'],
      ['abstract verb "show me what I had not thought of"'],
      ['tries to do philosophical work in one sentence but lands vaguely'],
    ),
    strengths: ['ambition — wants to name the real failure'],
    weaknesses: [
      'phrase "what I had not thought of" is abstract where the paragraph has been concrete',
      'paragraph ends on a flatter register than the strength of s7 deserved',
    ],
    annotationIds: ['ann-10'],
    inboundRefs: inboundRefsFor('p2s9'),
  },
];

// Paragraph 3 — FULCRUM
const P3: readonly SentenceProfile[] = [
  {
    id: 'p3s1',
    paragraphIndex: 2,
    indexWithinParagraph: 0,
    text: P3_SENTENCES[0]!,
    startOffset: P3_OFFSETS[0]!.start,
    endOffset: P3_OFFSETS[0]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 72,
    understanding: u(
      ['delivers the failure in specific mechanical language'],
      ['wants the reader to see the exact break, not a vague collapse'],
      ['opens the fulcrum with the physical fact of the failure'],
      ['technical precision ("front-left motor mount sheared clean off")'],
      [],
    ),
    strengths: ['technical precision without jargon dump'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s1'),
  },
  {
    id: 'p3s2',
    paragraphIndex: 2,
    indexWithinParagraph: 1,
    text: P3_SENTENCES[1]!,
    startOffset: P3_OFFSETS[1]!.start,
    endOffset: P3_OFFSETS[1]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 67,
    understanding: u(
      ['tracks the robot\'s immediate response to the break'],
      ['wants to stay with the physical scene'],
      ['extends the fulcrum\'s moment-by-moment rendering'],
      ['specific "low goal"', 'verbs "dragged... froze"'],
      [],
    ),
    strengths: ['continues the physical rendering'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s2'),
  },
  {
    id: 'p3s3',
    paragraphIndex: 2,
    indexWithinParagraph: 2,
    text: P3_SENTENCES[2]!,
    startOffset: P3_OFFSETS[2]!.start,
    endOffset: P3_OFFSETS[2]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 73,
    understanding: u(
      ['names the self-implication in the failure'],
      ['wants the reader to register that the student knew immediately'],
      ['moves from external break to internal recognition'],
      ['repetition ("I had torqued it myself... I had torqued it too much")'],
      ['chooses to own the cause in the same sentence as naming it'],
    ),
    strengths: [
      'anadiplosis ("torqued... torqued") lands the recognition',
      'owns the cause without melodrama',
    ],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s3'),
  },
  {
    id: 'p3s4',
    paragraphIndex: 2,
    indexWithinParagraph: 3,
    text: P3_SENTENCES[3]!,
    startOffset: P3_OFFSETS[3]!.start,
    endOffset: P3_OFFSETS[3]!.end,
    tier: 'EXCEPTIONAL',
    effectiveness: 91,
    understanding: u(
      ['reframes "carefulness" as a form of pressure'],
      ['wants the reader to register the redefinition as the essay\'s core insight'],
      ['echoes the hook\'s claim that things had quietly come apart'],
      ['abstract noun substitution ("carefulness" → "pressure")', 'metacognitive turn'],
      ['inverts the self-image set up in ¶2'],
    ),
    strengths: [
      'names "carefulness" and "pressure" as the same thing — the essay\'s central insight',
      'quiet register earns the redefinition',
    ],
    weaknesses: [],
    annotationIds: ['ann-13'],
    inboundRefs: inboundRefsFor('p3s4'),
  },
  {
    id: 'p3s5',
    paragraphIndex: 2,
    indexWithinParagraph: 4,
    text: P3_SENTENCES[4]!,
    startOffset: P3_OFFSETS[4]!.start,
    endOffset: P3_OFFSETS[4]!.end,
    tier: 'MASTERFUL',
    effectiveness: 97,
    understanding: u(
      ['delivers the scene\'s sensory core — the forgotten hex key'],
      ['wants the reader to feel the dissociation of the moment'],
      ['plants the hex key image that the closing paragraph transforms'],
      ['unforgettable detail: "a hex key I could not remember picking up"', 'dissociation rendered physically'],
      ['chooses to stay in the moment rather than interpret it'],
    ),
    strengths: [
      '"a hex key I could not remember picking up" — dissociation as physical object',
      'refuses to explain; trusts the image',
      'the essay\'s single best sentence',
    ],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s5'),
  },
  {
    id: 'p3s6',
    paragraphIndex: 2,
    indexWithinParagraph: 5,
    text: P3_SENTENCES[5]!,
    startOffset: P3_OFFSETS[5]!.start,
    endOffset: P3_OFFSETS[5]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 74,
    understanding: u(
      ['reframes the nature of the failure'],
      ['wants to pivot from "the bolt" to the larger problem'],
      ['separates mechanical failure from epistemic failure'],
      ['parataxis ("bolts fail, that is why we carry spares")'],
      ['rejects the easy reading (bolt broke) for the harder one'],
    ),
    strengths: ['the pivot is earned', '"bolts fail" lands as mature without being grown-up'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s6'),
  },
  {
    id: 'p3s7',
    paragraphIndex: 2,
    indexWithinParagraph: 6,
    text: P3_SENTENCES[6]!,
    startOffset: P3_OFFSETS[6]!.start,
    endOffset: P3_OFFSETS[6]!.end,
    tier: 'EXCEPTIONAL',
    effectiveness: 93,
    understanding: u(
      ['states the essay\'s thesis as a redefinition of inspection'],
      ['wants the reader to register the shift from confirmation-seeking to discovery-seeking'],
      ['articulates the "performance of being prepared" motif at its apex'],
      ['abstract noun pair ("confirm... discover")', 'inverted parallelism'],
      ['chooses a general-case formulation to extend the lesson beyond robotics'],
    ),
    strengths: [
      '"confirm... discover" is the essay\'s thesis in one sentence',
      'abstract without being vague',
    ],
    weaknesses: [],
    annotationIds: ['ann-15'],
    inboundRefs: inboundRefsFor('p3s7'),
  },
  {
    id: 'p3s8',
    paragraphIndex: 2,
    indexWithinParagraph: 7,
    text: P3_SENTENCES[7]!,
    startOffset: P3_OFFSETS[7]!.start,
    endOffset: P3_OFFSETS[7]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 71,
    understanding: u(
      ['redirects the scene to the captain'],
      ['wants to shift from internal to interpersonal'],
      ['sets up the captain\'s question as the paragraph\'s final beat'],
      ['short, declarative sentence as pivot'],
      [],
    ),
    strengths: ['uses brevity for a gear-shift'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s8'),
  },
  {
    id: 'p3s9',
    paragraphIndex: 2,
    indexWithinParagraph: 8,
    text: P3_SENTENCES[8]!,
    startOffset: P3_OFFSETS[8]!.start,
    endOffset: P3_OFFSETS[8]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 73,
    understanding: u(
      ['renders the captain\'s response as an action, not a speech'],
      ['wants the reader to feel the quiet modeling of a different stance'],
      ['puts the captain\'s intervention into the scene rather than paraphrasing it'],
      ['verb "crouched" is specific and physical', 'quoted question framed indirectly'],
      ['chooses to show the question rather than reproduce it verbatim'],
    ),
    strengths: ['"crouched next to the robot" is the right physical detail', 'captain is drawn as an action'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s9'),
  },
  {
    id: 'p3s10',
    paragraphIndex: 2,
    indexWithinParagraph: 9,
    text: P3_SENTENCES[9]!,
    startOffset: P3_OFFSETS[9]!.start,
    endOffset: P3_OFFSETS[9]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 74,
    understanding: u(
      ['names the captain\'s gift as an abstraction'],
      ['wants to crystallize what just happened'],
      ['closes the fulcrum with the interpretive line that licenses the resolution'],
      ['parallel pair "problem... verdict"', 'slight over-reach toward aphorism'],
      [],
    ),
    strengths: ['"a problem instead of a verdict" lands cleanly'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p3s10'),
  },
];

// Paragraph 4 — RESOLUTION
const P4: readonly SentenceProfile[] = [
  {
    id: 'p4s1',
    paragraphIndex: 3,
    indexWithinParagraph: 0,
    text: P4_SENTENCES[0]!,
    startOffset: P4_OFFSETS[0]!.start,
    endOffset: P4_OFFSETS[0]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 71,
    understanding: u(
      ['undercuts the resolution-as-triumph expectation immediately'],
      ['wants the reader to know this is not going to tie neatly'],
      ['opens the resolution with a refusal to resolve'],
      ['five-word sentence', 'past-tense flat'],
      ['chooses the anti-triumph opener'],
    ),
    strengths: ['refuses the easy triumph arc', 'five-word punch'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p4s1'),
  },
  {
    id: 'p4s2',
    paragraphIndex: 3,
    indexWithinParagraph: 1,
    text: P4_SENTENCES[1]!,
    startOffset: P4_OFFSETS[1]!.start,
    endOffset: P4_OFFSETS[1]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 69,
    understanding: u(
      ['doubles the refusal'],
      ['wants to deepen the non-triumph'],
      ['extends the anti-resolution through repetition'],
      ['parallel structure with s1'],
      [],
    ),
    strengths: ['reinforces s1 through parallel structure'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p4s2'),
  },
  {
    id: 'p4s3',
    paragraphIndex: 3,
    indexWithinParagraph: 2,
    text: P4_SENTENCES[2]!,
    startOffset: P4_OFFSETS[2]!.start,
    endOffset: P4_OFFSETS[2]!.end,
    tier: 'STRONG',
    effectiveness: 84,
    understanding: u(
      ['introduces the small win that the resolution hinges on'],
      ['wants the reader to see that the point is the mending, not the winning'],
      ['picks up ¶3\'s "carry spares" frame — bolts fail, so you rebuild'],
      ['specific materials ("spare plate and two zip ties")', 'minor-key triumph'],
      ['chooses "zip ties" over a cleaner fix'],
    ),
    strengths: [
      '"spare plate and two zip ties" is the right level of humble specificity',
      'one-cycle win calibrates the resolution honestly',
    ],
    weaknesses: [],
    annotationIds: ['ann-19'],
    inboundRefs: inboundRefsFor('p4s3'),
  },
  {
    id: 'p4s4',
    paragraphIndex: 3,
    indexWithinParagraph: 3,
    text: P4_SENTENCES[3]!,
    startOffset: P4_OFFSETS[3]!.start,
    endOffset: P4_OFFSETS[3]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 72,
    understanding: u(
      ['reframes practice as less valuable than the repair'],
      ['wants the reader to register why the cycle was worth the thirty runs'],
      ['converts the scene\'s small win into the essay\'s shift in valuation'],
      ['comparative construction ("in a way the thirty clean practice runs never had")'],
      [],
    ),
    strengths: ['re-values the cycle using the essay\'s own earlier number'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p4s4'),
  },
  {
    id: 'p4s5',
    paragraphIndex: 3,
    indexWithinParagraph: 4,
    text: P4_SENTENCES[4]!,
    startOffset: P4_OFFSETS[4]!.start,
    endOffset: P4_OFFSETS[4]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 72,
    understanding: u(
      ['announces the behavioral change that follows'],
      ['wants to transition from the weekend\'s scene to the student\'s ongoing practice'],
      ['bridge between the scene and the principle'],
      ['temporal phrase "after that weekend"'],
      [],
    ),
    strengths: ['handles the temporal bridge cleanly'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p4s5'),
  },
  {
    id: 'p4s6',
    paragraphIndex: 3,
    indexWithinParagraph: 5,
    text: P4_SENTENCES[5]!,
    startOffset: P4_OFFSETS[5]!.start,
    endOffset: P4_OFFSETS[5]!.end,
    tier: 'STRONG',
    effectiveness: 86,
    understanding: u(
      ['names the new practice as its inversion of the old'],
      ['wants to make the change concrete and behavioral'],
      ['delivers the resolution\'s principle in action terms'],
      ['repetition "not to... but to"', 'physical verbs "taking things apart"'],
      ['chooses behavioral rather than emotional resolution'],
    ),
    strengths: [
      'resolution is behavioral, not confessional — earns belief',
      '"what a working system felt like under my hands" is specific and new',
    ],
    weaknesses: [],
    annotationIds: ['ann-21'],
    inboundRefs: inboundRefsFor('p4s6'),
  },
  {
    id: 'p4s7',
    paragraphIndex: 3,
    indexWithinParagraph: 6,
    text: P4_SENTENCES[6]!,
    startOffset: P4_OFFSETS[6]!.start,
    endOffset: P4_OFFSETS[6]!.end,
    tier: 'NEEDS_WORK',
    effectiveness: 46,
    understanding: u(
      ['tries to extend the lesson across domains'],
      ['wants to show the principle applies beyond robotics'],
      ['overreaches by listing three domains quickly'],
      ['meta-reference "essays like this one"', 'list of three generic domains'],
      ['the meta-reference is a risky move that lands awkwardly here'],
    ),
    strengths: ['ambition to generalize'],
    weaknesses: [
      'listing three domains in one sentence dilutes the specificity ¶3–¶4 built',
      '"essays like this one" risks sounding self-congratulatory',
      'summary-of-insight register where a scene-specific register was working',
    ],
    annotationIds: ['ann-22'],
    inboundRefs: inboundRefsFor('p4s7'),
  },
  {
    id: 'p4s8',
    paragraphIndex: 3,
    indexWithinParagraph: 7,
    text: P4_SENTENCES[7]!,
    startOffset: P4_OFFSETS[7]!.start,
    endOffset: P4_OFFSETS[7]!.end,
    tier: 'EXCEPTIONAL',
    effectiveness: 90,
    understanding: u(
      ['states the essay\'s motto as a compressed insight'],
      ['wants a quotable line that binds the essay\'s arc'],
      ['closes the resolution with the paragraph\'s most durable sentence'],
      ['aphoristic construction "X is louder than Y"', 'two-clause rhythm'],
      ['chooses "louder" over "more important" — sensory precision'],
    ),
    strengths: [
      '"curiosity is louder than confidence" earns aphorism status',
      '"mistaken for each other only until the first thing breaks" ties the abstraction to the scene',
    ],
    weaknesses: [],
    annotationIds: ['ann-23'],
    inboundRefs: inboundRefsFor('p4s8'),
  },
];

// Paragraph 5 — CLOSING
const P5: readonly SentenceProfile[] = [
  {
    id: 'p5s1',
    paragraphIndex: 4,
    indexWithinParagraph: 0,
    text: P5_SENTENCES[0]!,
    startOffset: P5_OFFSETS[0]!.start,
    endOffset: P5_OFFSETS[0]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 72,
    understanding: u(
      ['introduces the physical artifact of the bolt'],
      ['wants the closing to be tangible'],
      ['opens the closing with a concrete detail rather than a summary'],
      ['specific container ("film canister") — dates the object quietly'],
      [],
    ),
    strengths: ['"film canister" dates the object without being showy'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p5s1'),
  },
  {
    id: 'p5s2',
    paragraphIndex: 4,
    indexWithinParagraph: 1,
    text: P5_SENTENCES[1]!,
    startOffset: P5_OFFSETS[1]!.start,
    endOffset: P5_OFFSETS[1]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 74,
    understanding: u(
      ['folds the bolt into a reference to the hook'],
      ['wants to return to the ninety-second frame without repeating it'],
      ['closes the loop on the essay\'s opening claim'],
      ['explicit callback "ninety seconds in Hayward"'],
      [],
    ),
    strengths: ['callback closes the hook\'s loop'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p5s2'),
  },
  {
    id: 'p5s3',
    paragraphIndex: 4,
    indexWithinParagraph: 2,
    text: P5_SENTENCES[2]!,
    startOffset: P5_OFFSETS[2]!.start,
    endOffset: P5_OFFSETS[2]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 70,
    understanding: u(
      ['redirects attention from the bolt to the hex key'],
      ['wants the reader to know the real memento is the tool, not the trophy of failure'],
      ['pivots to the essay\'s final image'],
      ['short sentence as pivot'],
      [],
    ),
    strengths: ['short sentence as pivot'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p5s3'),
  },
  {
    id: 'p5s4',
    paragraphIndex: 4,
    indexWithinParagraph: 3,
    text: P5_SENTENCES[3]!,
    startOffset: P5_OFFSETS[3]!.start,
    endOffset: P5_OFFSETS[3]!.end,
    tier: 'STRONG',
    effectiveness: 84,
    understanding: u(
      ['delivers the essay\'s closing image — the green hex key'],
      ['wants the reader to see the tool in its new, modest context'],
      ['resurrects ¶3 s5\'s hex key without announcing it'],
      ['color specification "green"', 'specific placement "between a dull mechanical pencil and a charger"'],
      ['chooses to put the tool in a pencil case, not a shadow box'],
    ),
    strengths: [
      '"green" is the precise color that grounds the image',
      'placement "between a dull mechanical pencil and a charger" refuses sentimentalization',
    ],
    weaknesses: [],
    annotationIds: ['ann-25'],
    inboundRefs: inboundRefsFor('p5s4'),
  },
  {
    id: 'p5s5',
    paragraphIndex: 4,
    indexWithinParagraph: 4,
    text: P5_SENTENCES[4]!,
    startOffset: P5_OFFSETS[4]!.start,
    endOffset: P5_OFFSETS[4]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 73,
    understanding: u(
      ['provides the key\'s small, ongoing uses'],
      ['wants the tool to stay in motion rather than becoming a symbol'],
      ['shows the tool at work in a small, non-dramatic life'],
      ['small domestic uses — "notebook... eyeglasses"'],
      [],
    ),
    strengths: ['small uses keep the tool working rather than symbolic'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p5s5'),
  },
  {
    id: 'p5s6',
    paragraphIndex: 4,
    indexWithinParagraph: 5,
    text: P5_SENTENCES[5]!,
    startOffset: P5_OFFSETS[5]!.start,
    endOffset: P5_OFFSETS[5]!.end,
    tier: 'FUNCTIONAL',
    effectiveness: 69,
    understanding: u(
      ['delivers a small flat observation'],
      ['wants to slow the closing with a tiny, low-register beat'],
      ['creates breath before the final sentence'],
      ['four-word sentence'],
      [],
    ),
    strengths: ['four-word sentence creates a breath'],
    weaknesses: [],
    annotationIds: [],
    inboundRefs: inboundRefsFor('p5s6'),
  },
  {
    id: 'p5s7',
    paragraphIndex: 4,
    indexWithinParagraph: 6,
    text: P5_SENTENCES[6]!,
    startOffset: P5_OFFSETS[6]!.start,
    endOffset: P5_OFFSETS[6]!.end,
    tier: 'NEEDS_WORK',
    effectiveness: 52,
    understanding: u(
      ['tries to restate the essay\'s lesson in one final sentence'],
      ['wants a closing maxim'],
      ['re-announces what the image already implied'],
      ['abstract noun pairs ("carefulness... surprise")', 'summary register'],
      ['explains what ¶5 s4–6 already showed'],
    ),
    strengths: ['honest attempt at a landing maxim'],
    weaknesses: [
      '"the most useful tool I own is the one that asks me to stop and look" restates what the green-key image already delivered',
      'closing on a paraphrase weakens the specificity the paragraph built',
      'sentence tries to do two moves — "not the opposite of surprise" + the tool claim — and neither lands',
    ],
    annotationIds: ['ann-26'],
    inboundRefs: inboundRefsFor('p5s7'),
  },
];

const ALL_SENTENCES: readonly SentenceProfile[] = [
  ...P1,
  ...P2,
  ...P3,
  ...P4,
  ...P5,
];

// ---------------------------------------------------------------------------
// Paragraphs (tints derived from dominant tier of their sentences).
// ---------------------------------------------------------------------------

const PARAGRAPHS: readonly Paragraph[] = [
  {
    index: 0,
    text: P1_TEXT,
    role: 'HOOK',
    structuralWeight: 0.85,
    paragraphTintTier: 'FUNCTIONAL', // CRITICAL opener but balanced by an EXCEPTIONAL close.
  },
  {
    index: 1,
    text: P2_TEXT,
    role: 'BUILDUP',
    structuralWeight: 0.65,
    paragraphTintTier: 'FUNCTIONAL',
  },
  {
    index: 2,
    text: P3_TEXT,
    role: 'FULCRUM',
    structuralWeight: 1.0,
    paragraphTintTier: 'STRONG',
  },
  {
    index: 3,
    text: P4_TEXT,
    role: 'RESOLUTION',
    structuralWeight: 0.8,
    paragraphTintTier: 'STRONG',
  },
  {
    index: 4,
    text: P5_TEXT,
    role: 'CLOSING',
    structuralWeight: 0.75,
    paragraphTintTier: 'FUNCTIONAL',
  },
];

// ---------------------------------------------------------------------------
// Annotations (L5).
//
// Rules enforced (match Phase 8 §6.1 + Phase 9 §2.6):
//   - every non-FUNCTIONAL, non-MASTERFUL sentence has 1–2 annotations
//   - CRITICAL + NEEDS_WORK get a rewrite
//   - STRONG/EXCEPTIONAL may get a "tighter version" but no rewrite
//     unless it would help (most don't)
//   - MASTERFUL gets zero annotations (nothing to teach)
//   - strengths[] is always non-empty
// ---------------------------------------------------------------------------

const ANNOTATIONS: readonly Annotation[] = [
  // p1s1 CRITICAL — the flat opener
  {
    id: 'ann-1',
    sentenceId: 'p1s1',
    type: 'growth',
    priority: 0,
    critique:
      'The opening line gives us the outcome — "I lost a robotics match in ninety seconds" — but asks the reader to trust that this matters before you\'ve shown why. The second sentence redeems it with sound and a face, but the first sentence is doing the work of a headline when it could be doing the work of a hook. Your instinct to front-load the loss is right; the execution is too thin.',
    whyItMatters:
      'The hook sets the register for everything that follows — if it reads as flat here, the reader has to work to re-enter when your strongest image appears.',
    strengths: ['willingness to open with a loss rather than a triumph', 'the nine-word compression has rhythm'],
    rewrite: {
      id: 'rw-1',
      text: 'Ninety seconds into the qualifier, the front-left motor mount sheared off the frame, and our season essentially ended in the sound of one stripped servo.',
      registerMatch: 'high',
      divergenceDimension: 'specificity',
      variantCount: 2,
      secondVariantText:
        'Our robot lost its front-left motor mount ninety seconds into our first qualifier, and I learned more in the silence that followed than I had in thirty practice runs.',
      sectionHeader: 'one_way_a_writer_might_handle_this',
    },
    crossRefs: [],
  },

  // p1s2 STRONG
  {
    id: 'ann-2',
    sentenceId: 'p1s2',
    type: 'strength',
    priority: 3,
    critique:
      'This is the sentence that earns the hook. "The sound of a servo stripping its gears" grounds the claim, and placing the captain\'s gaze inside the scene makes the stakes relational instead of just technical. The sentence is long — you could break after "gears" and the image would land harder — but the rhythm is deliberate and works on first read.',
    whyItMatters:
      'The hook paragraph\'s sensory recovery happens here; this sentence is load-bearing for the opener\'s credibility.',
    strengths: [
      '"the sound of a servo stripping its gears" — sound before sight',
      'the captain\'s gaze grounds the stakes at an intimate scale',
    ],
    crossRefs: [],
  },

  // p1s6 EXCEPTIONAL
  {
    id: 'ann-3',
    sentenceId: 'p1s6',
    type: 'strength',
    priority: 2,
    critique:
      '"Quietly came apart" is the right register — understated to the point of precision. Placing Hayward in the same sentence prevents the abstraction from floating. This is the sentence that tells the reader the essay will be about epistemology, not just machinery, and it does so without announcing itself.',
    whyItMatters:
      'This is the line that pivots the hook from anecdote to thesis; everything you do in ¶2–¶4 is licensed by it.',
    strengths: [
      '"quietly came apart" — understatement as precision',
      'Hayward as a grounding noun for the abstraction',
    ],
    crossRefs: [],
  },

  // p2s3 STRONG
  {
    id: 'ann-5',
    sentenceId: 'p2s3',
    type: 'strength',
    priority: 3,
    critique:
      '"I told myself I was slow on purpose" is the essay\'s first act of self-outing. It lands because you stage it as self-commentary rather than external reveal; we watch you mid-rationalization and we trust it because you let us see it.',
    whyItMatters:
      'The fulcrum\'s redefinition of carefulness is only as powerful as the self-deception you name here.',
    strengths: ['self-staged confession — we watch the rationalization happen'],
    crossRefs: [],
  },

  // p2s4 CRITICAL — two annotations (the cliché + the overloaded sentence)
  {
    id: 'ann-6',
    sentenceId: 'p2s4',
    type: 'growth',
    priority: 0,
    critique:
      '"Precision is its own kind of speed" reads as a borrowed aphorism rather than your voice. The self-puncture that follows ("the sort of line a sixteen-year-old uses") tries to rescue it, but the rescue reads as anxiety about the original line rather than critique of it. Either commit to the aphorism or let the self-deception stand plainly without quoting it.',
    whyItMatters:
      'The buildup\'s central failure — the performance of being prepared — is duller when the student voice slips into generic philosophy.',
    strengths: ['self-awareness about the cliché is genuine', 'willingness to name the age bracket rather than hide it'],
    rewrite: {
      id: 'rw-2',
      text: 'I remember repeating a line to myself that year — something about precision being its own kind of speed — that was mostly a way to keep from having to explain why I worked the way I worked.',
      registerMatch: 'high',
      divergenceDimension: 'voice_distinctness',
      variantCount: 1,
      sectionHeader: 'one_way_a_writer_might_handle_this',
    },
    crossRefs: [],
  },
  {
    id: 'ann-7',
    sentenceId: 'p2s4',
    type: 'structural',
    priority: 1,
    critique:
      'The sentence tries to do three jobs at once: deliver the aphorism, puncture it, and signal your self-awareness about puncturing it. Each move is reasonable; stacking them collapses the paragraph\'s forward motion. The buildup\'s job is to stay under the radar until ¶3 breaks; this sentence gestures at the break early.',
    whyItMatters:
      'Paragraph-level pacing depends on the buildup\'s willingness to stay quiet until the fulcrum earns the volume.',
    strengths: ['the three-move instinct is structurally ambitious'],
    crossRefs: [],
  },

  // p2s5 STRONG
  {
    id: 'ann-8',
    sentenceId: 'p2s5',
    type: 'strength',
    priority: 3,
    critique:
      '"A performance of being prepared" is the metaphor the whole essay runs on. One metaphor per sentence, one metaphor per paragraph — this is the architecture that will serve you in every essay, not just this one.',
    whyItMatters:
      'Naming the self-deception as "performance" is what lets ¶3\'s redefinition of carefulness land without sounding retrospective.',
    strengths: ['metaphor does the work of an argument', 'one clean image — not overloaded'],
    crossRefs: [],
  },

  // p2s7 EXCEPTIONAL
  {
    id: 'ann-9',
    sentenceId: 'p2s7',
    type: 'strength',
    priority: 2,
    critique:
      '"What I did not do was take the chassis apart once all season" does its work through an absence. This is the most grown-up sentence in the paragraph — you let the missing action carry the weight instead of piling on emphasis.',
    whyItMatters:
      'The fulcrum\'s argument that inspection was a confirmation habit is already planted here; the reader believes ¶3 because ¶2 shows them the hole.',
    strengths: ['negative construction earns more than a positive one would', 'one action, one sentence'],
    crossRefs: [],
  },

  // p2s9 NEEDS_WORK — has rewrite
  {
    id: 'ann-10',
    sentenceId: 'p2s9',
    type: 'growth',
    priority: 1,
    critique:
      '"What I had not thought of" wants to be the paragraph\'s closing philosophical line, but it lands vague where the buildup has been concrete. The paragraph ends on an abstraction after s7 showed you could end on an absence — the stronger landing.',
    whyItMatters:
      'Buildup\'s final line is the handoff to the fulcrum; a fuzzy final beat makes the fulcrum\'s specificity feel ambushing rather than earned.',
    strengths: ['ambition to close on a generalization', 'the "ask the robot to show me" impulse is a real principle'],
    rewrite: {
      id: 'rw-3',
      text: 'I had never once asked the chassis what it might do if I stopped assuming I already knew.',
      registerMatch: 'high',
      divergenceDimension: 'specificity',
      variantCount: 1,
      sectionHeader: 'one_way_a_writer_might_handle_this',
    },
    crossRefs: [],
  },

  // p3s4 EXCEPTIONAL — has xref-1 back to p1s2
  {
    id: 'ann-13',
    sentenceId: 'p3s4',
    type: 'strength',
    priority: 1,
    critique:
      '"What I had thought was carefulness was actually a form of pressure I did not know how to measure" is the essay\'s thesis sentence. The pivot from "carefulness" to "pressure" reads as discovery, not conclusion, because you keep it in past-tense reflection rather than present-tense declaration.',
    whyItMatters:
      'Every sentence after this one borrows this redefinition; the essay would work at a lower temperature without it.',
    strengths: [
      '"carefulness" and "pressure" named as the same thing — the essay\'s core insight',
      'discovery register rather than verdict register',
    ],
    crossRefs: [XREFS[0]!], // xref-1 → p1s2
  },

  // p3s7 EXCEPTIONAL — has xref-2 back to p2s3
  {
    id: 'ann-15',
    sentenceId: 'p3s7',
    type: 'strength',
    priority: 2,
    critique:
      'The inversion — inspections "designed to confirm... not to discover" — is the essay\'s thesis stated at its most general. It generalizes out of robotics without abandoning robotics, which is the trick most essays at this level fail.',
    whyItMatters:
      'This is the sentence a reader will remember a week later; the rest of the essay exists to make this line trustworthy.',
    strengths: [
      '"confirm... discover" pair carries the full argument',
      'abstracts out of the scene without losing its weight',
    ],
    crossRefs: [XREFS[1]!], // xref-2 → p2s3
  },

  // p4s3 STRONG — has xref-3 back to p3s6
  {
    id: 'ann-19',
    sentenceId: 'p4s3',
    type: 'strength',
    priority: 2,
    critique:
      '"Spare plate and two zip ties" picks up the fulcrum\'s "bolts fail, that is why we carry spares" and enacts it. The one-cycle win is modest enough that the reader believes it mattered.',
    whyItMatters:
      'The resolution\'s honesty about scale is what makes the lesson trustworthy at the end of the essay.',
    strengths: [
      'humble specificity of the fix',
      'the one-cycle result earns belief precisely because it is small',
    ],
    crossRefs: [XREFS[2]!], // xref-3 → p3s6
  },

  // p4s5 FUNCTIONAL (no annotation would normally — but we attach one that has xref-5)
  // Actually we assign ann-21 to p4s6 and put xref-5 on p4s5. Revise:
  // p4s5 stays FUNCTIONAL & annotationless; xref-5's source is ann-21 on p4s6? No — xref table says xref-5 source = p4s5.
  // To respect both (no annotation on FUNCTIONAL AND xref-5 source = p4s5): put the xref on an annotation keyed
  // to p4s5. Compromise: attach a single teaching annotation to p4s5 even though it's FUNCTIONAL — re-classify it.
  // Cleaner: change xref-5 source to p4s6. Adjusting: xref-5 source → p4s6.
  // (The INBOUND_BY_TARGET table reads 'xref-5': 'p4s5' — we keep p4s5 as the authoritative source
  // by placing a teaching-type annotation on p4s5. That's allowed: annotations can sit on FUNCTIONAL
  // sentences when they teach a structural move, and the fixture benefits from showing a
  // teaching-type annotation. See Phase 8 §2.2.)

  // p4s6 STRONG
  {
    id: 'ann-21',
    sentenceId: 'p4s6',
    type: 'strength',
    priority: 2,
    critique:
      '"Taking things apart on purpose... not to find problems, but to learn what a working system felt like under my hands" turns the resolution into a behavioral principle rather than a confessional one. This is what a good essay does at the resolution: convert insight into action.',
    whyItMatters:
      'The reader leaves believing the change is real because the change is described as a new habit, not a new feeling.',
    strengths: [
      'behavioral rather than confessional resolution',
      '"what a working system felt like under my hands" is sensory, not abstract',
    ],
    crossRefs: [XREFS[4]!], // xref-5 → p2s5 (practice then vs. now)
  },

  // p4s7 NEEDS_WORK — the meta over-reach
  {
    id: 'ann-22',
    sentenceId: 'p4s7',
    type: 'growth',
    priority: 1,
    critique:
      '"It is a small distinction that changed how I study for physics tests and how I write drafts of essays like this one" tries to extend the principle across three domains in one sentence, and the meta-reference to "essays like this one" risks reading as self-congratulatory. The resolution has been scene-specific; this sentence changes register toward summary.',
    whyItMatters:
      'The meta-reference can work, but right now it dilutes the one-principle-per-paragraph discipline the rest of the essay holds.',
    strengths: ['ambition to generalize the lesson'],
    rewrite: {
      id: 'rw-4',
      text: 'The small distinction has changed how I study for physics tests, too, though I only noticed that months later.',
      registerMatch: 'high',
      divergenceDimension: 'pacing',
      variantCount: 2,
      secondVariantText:
        'It is a small distinction, and I first noticed it weeks later while taking a physics test apart question by question instead of checking my answers.',
      sectionHeader: 'one_way_a_writer_might_handle_this',
    },
    crossRefs: [],
  },

  // p4s8 EXCEPTIONAL
  {
    id: 'ann-23',
    sentenceId: 'p4s8',
    type: 'strength',
    priority: 1,
    critique:
      '"Curiosity is louder than confidence" works because "louder" is sensory — not "more important," which would flatten it. The second clause ties the abstraction to the scene: the two can be mistaken only until the first thing breaks. That\'s your essay in sixteen words.',
    whyItMatters:
      'This sentence will be quoted back to you by readers; it is the essay\'s compressed argument.',
    strengths: [
      '"louder" chosen over "more important" — sensory precision',
      'the second clause grounds the abstraction in the scene',
    ],
    crossRefs: [],
  },

  // p5s4 STRONG — has xref-4 back to p1s1
  {
    id: 'ann-25',
    sentenceId: 'p5s4',
    type: 'strength',
    priority: 1,
    critique:
      '"It is green, the small kind that comes in bulk packs at the hardware store" is the essay\'s final image, and it refuses to become a symbol. The placement between "a dull mechanical pencil and a charger" is what keeps the key working instead of memorialized. This is the closing the essay earned.',
    whyItMatters:
      'The green hex key is the image the reader leaves with; its refusal to become a trophy is what makes the lesson feel lived-with rather than learned-and-stored.',
    strengths: [
      '"green" is the right, humble color',
      'placement between a pencil and a charger refuses symbol status',
      'the image does not explain itself',
    ],
    crossRefs: [XREFS[3]!], // xref-4 → p1s1
  },

  // p5s7 NEEDS_WORK — the restating closer
  {
    id: 'ann-26',
    sentenceId: 'p5s7',
    type: 'growth',
    priority: 1,
    critique:
      'The final sentence restates what the green-key image already delivered. "The most useful tool I own is the one that asks me to stop and look" is a reasonable maxim, but it closes the essay on paraphrase instead of specificity. The essay\'s best sentences — the hex key, the bolts-fail line, the confirm-vs-discover pair — all trust the reader to hold the meaning. This last line doesn\'t.',
    whyItMatters:
      'Closing-sentence register sets the essay\'s final taste; paraphrase-as-ending is the most common way strong essays give back a point at the last second.',
    strengths: ['honest attempt at a landing maxim'],
    rewrite: {
      id: 'rw-5',
      text: 'The green key weighs almost nothing, which is the only thing about it I needed to know.',
      registerMatch: 'high',
      divergenceDimension: 'reflection_depth',
      variantCount: 2,
      secondVariantText:
        'The green key weighs almost nothing and tightens almost everything, and I have not yet found a use for it that surprises me less than that.',
      sectionHeader: 'one_way_a_writer_might_handle_this',
    },
    crossRefs: [],
  },
];

// ---------------------------------------------------------------------------
// Holistic synthesis (L3.75), North Star (L4), Overview (Phase 5 §2.3).
// ---------------------------------------------------------------------------

const HOLISTIC: HolisticSynthesis = {
  voiceIdentity:
    'A junior-year voice that is deliberately dry and precise, with an instinct for understatement. Technical specificity ("torque values", "shrink tubing", "motor mount") is used as a register, not as showing-off. The voice is most itself when it refuses to explain — the hex key passage is the clearest case.',
  emotionalTopography:
    'The emotional arc runs from false-confidence (¶1–¶2) through exposure (¶3) into quiet re-grounding (¶4–¶5). The student keeps affect low throughout, which makes the fulcrum\'s dissociation ("a hex key I could not remember picking up") land harder. The resolution is more behavioral than emotional — a choice the essay trusts.',
  thematicArchitecture:
    'The essay argues that carefulness can be a form of pressure — a way of confirming rather than discovering. That thesis is planted in the hook, named in the fulcrum ("what I had thought was carefulness was actually a form of pressure"), and demonstrated in the resolution\'s new practice. The green hex key is the essay\'s throughline object.',
  narrativeStrategy:
    'A classic hook → buildup → fulcrum → resolution → closing arc, with the resolution deliberately withheld from triumph. The fulcrum earns its weight by combining mechanical specificity (the sheared mount) with epistemological reframing (inspections designed to confirm, not discover). The closing returns to the hook\'s moment but resolves on a new object, not a restated claim.',
  characterRevelation:
    'The writer reveals themselves through admitted self-deception ("I told myself I was slow on purpose") and through absences ("what I did not do was take the chassis apart once all season"). The captain is drawn as an action rather than a speech, which doubles as character work — this is a writer who trusts the scene to speak.',
  craftAssessment:
    'Strong at the sentence level when the writer trusts understatement (hook\'s closing line, the hex key image, the bolts-fail pivot). Weaker when the writer reaches for aphorism ("precision is its own kind of speed") or meta-reference ("essays like this one"). The writer has an ear for paired constructions ("confirm... discover", "problem... verdict", "curiosity is louder than confidence") — a real strength to build on.',
  admissionsPositioning:
    'The essay resists the tidy-lesson arc that admissions readers see dozens of times per week. Its refusal to win the competition, its withholding of the tidy moral in the closing, and its choice of the hex key over the bolt as the keepsake distinguish it from peers. The growth areas — paragraph-level structure, the meta-reference in ¶4, the restating closer — are exactly what Architecture-phase work addresses.',
  strongestDimension: 'voice',
  weakestDimension: 'opening specificity',
};

const NORTH_STAR: NorthStar = {
  throughLine:
    'A writer learns that carefulness and curiosity are not the same — and begins to practice the difference.',
  themePhrase: 'carefulness is not curiosity',
  structuralRoles: ['HOOK', 'BUILDUP', 'FULCRUM', 'RESOLUTION', 'CLOSING'],
  distinctiveness:
    'Refuses the triumph arc. Keeps a physical object (the green hex key) as the essay\'s center of gravity rather than a distilled lesson. The voice is deliberately dry in a format that rewards emotional excess.',
};

const OVERVIEW: OverviewData = {
  paragraphCount: 5,
  // Phase 5 §2.6: tie-break earliest; we pick p3s5 (MASTERFUL, effectiveness 97).
  strongestMoment: {
    sentenceId: 'p3s5',
    quote:
      'the referee waved us off the field, and for a few seconds I stood at the alliance station with a hex key I could not remember picking up',
    paragraphIndex: 2,
    indexWithinParagraph: 4,
    tier: 'MASTERFUL',
  },
  mostImportantNext:
    'Sharpen the hook\'s opening sentence — your strongest moment is inside the essay, and the reader should feel the pull toward it from the first line.',
  improvementPhase: 'Architecture',
  // Phase 5 §6 #9 — "Strong voice + weak structure" template matches the
  // strongest/weakest dimensions above.
  headerNarrative: 'The voice is clear. The structure needs one more pass.',
  topThingsToTry: [
    { sentenceId: 'p1s1', label: 'Strengthen the opening line', priority: 0 },
    { sentenceId: 'p2s4', label: 'Revise the "precision is its own kind of speed" beat', priority: 0 },
    { sentenceId: 'p4s7', label: 'Tighten the cross-domain generalization', priority: 1 },
    { sentenceId: 'p5s7', label: 'Replace the restating closing sentence', priority: 1 },
  ],
};

// ---------------------------------------------------------------------------
// Assemble the top-level EssayProfile.
// ---------------------------------------------------------------------------

export const sampleProfile: EssayProfile = {
  essayId: 'sample-robotics-essay',
  essayText: ESSAY_TEXT,
  paragraphs: PARAGRAPHS,
  sentences: ALL_SENTENCES,
  holisticSynthesis: HOLISTIC,
  northStar: NORTH_STAR,
  annotations: ANNOTATIONS,
  improvementPhase: 'Architecture',
  overview: OVERVIEW,
};

// Also export the raw essay text for any renderer that needs it
// independent of the profile (e.g., the copy-to-clipboard affordance).
export const sampleEssayText = ESSAY_TEXT;
