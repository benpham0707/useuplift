/**
 * deliberateAbsences.ts — What top-tier essays systematically DON'T do.
 *
 * Drawn from review observations across all 10 attested essays. Each absence
 * is load-bearing — the essay's strength depends on the writer's restraint
 * from a default move other essays would deploy.
 *
 * These absences are coachable as principles: "consider what your essay
 * REFUSES to do as much as what it does."
 */

import type { DeliberateAbsence } from './corpusTypes';

export const DELIBERATE_ABSENCES: DeliberateAbsence[] = [
  {
    id: 'never-state-disability-as-thesis',
    description: 'Sarika never states "disability" as the essay\'s thesis. The wheelchair is named exactly once and the word "disability" never appears. The essay orbits the fact through consequences, not declarations.',
    why: 'Naming the central fact 5+ times turns the essay INTO that fact. Naming it once preserves the writer\'s identity as larger than the fact.',
    appliesToArchetypeIds: ['interior-transformation-metaphor-possession'],
    exemplars: [{ essayId: '05-harvard-2028-i-too-can-dance', demonstration: '"How could I share my stories with others if I managed to injure them with my wheelchair before the story even began?" — the only mention of "wheelchair" in the entire essay; "disability" never appears.' }],
  },
  {
    id: 'never-uses-metaphor',
    description: 'Michael\'s plain-voice sacrifice essay contains zero literary metaphors. No "weight on my shoulders" decoration; the content carries weight on its own. The absence is load-bearing — decorating would cheapen the material.',
    why: 'Strong content + decorated voice = decorated insufficient material. Strong content + plain voice = trust the reader. Restraint IS the craft choice.',
    appliesToArchetypeIds: ['plain-voice-sacrifice-ritual'],
    exemplars: [{ essayId: '12-harvard-2028-three-years-alone', demonstration: 'Throughout 6 paragraphs about a mother\'s 3-year sacrifice as live-in caregiver, no extended metaphor appears. "Broken her back" is the closest to figurative language — and it is plain idiom, not literary reach.' }],
  },
  {
    id: 'compressed-trauma-into-one-sentence',
    description: 'Clara compresses her grandfather\'s 13-year imprisonment in a Viet Cong labor camp into a single sentence, then moves on. The trauma is acknowledged but does not become the essay\'s subject.',
    why: 'Heritage essays commonly fail by becoming family-biography essays. Honoring family history fully means letting it carry maximum significance in minimum words.',
    appliesToArchetypeIds: ['compressed-heritage'],
    exemplars: [{ essayId: '14-harvard-2028-crochet', demonstration: '"The Viet Cong imprisoned my grandfather, a colonel in the South Vietnam Air Force, in a grueling labor camp for thirteen years." — full geopolitical context in one sentence.' }],
  },
  {
    id: 'no-external-resolution-of-bullying',
    description: 'Marcus does NOT tell us whether the administration punished the bullies, whether the video was removed, whether classmates apologized. The external situation is left unresolved.',
    why: 'Personal essays often feel saccharine because they resolve external situations artificially. Internal resolutions feel truer; external resolution would falsify what actually happened.',
    appliesToArchetypeIds: ['child-memory-extended-metaphor-prophecy'],
    exemplars: [{ essayId: '10-harvard-2028-the-zoo', demonstration: 'After describing the bullying video, Marcus describes specific actions HE took (joining SAGE, speaking to administration, saving the video) but never reports their outcomes. Resolution is "I took control" — internal, not external.' }],
  },
  {
    id: 'no-foreshadowing-of-childhood-significance',
    description: 'Marcus inhabits the eight-year-old\'s zoo memory fully — without any sentence that winks at the future meaning the memory will acquire. The hinge ("Until I became one") works because the opening did not foreshadow.',
    why: 'Foreshadowing childhood significance in retrospective narration tells the reader to brace; the unbraced reader is more available for the structural turn that follows.',
    appliesToArchetypeIds: ['child-memory-extended-metaphor-prophecy'],
    exemplars: [{ essayId: '10-harvard-2028-the-zoo', demonstration: 'Paragraph 1 reports the otter scene as literal childhood memory with no sentence like "I would later understand what my mother meant" or "those words stayed with me." The flat closing sentence ("I didn\'t think much of the otters after that") deliberately refuses foreshadowing.' }],
  },
  {
    id: 'no-explicit-gain-list-in-closing',
    description: 'Sarika\'s closing does NOT list abstract gains ("confidence, creativity, perseverance"). The closing returns to specific imagery (eyes dry with euphoria, smile, dancing across the page). Specifics carry the resolution; abstractions are absent.',
    why: 'Abstract gain-lists are unverifiable and indistinguishable from any other applicant\'s. AOs see thousands of "I learned X, Y, and Z" closings.',
    appliesToArchetypeIds: ['interior-transformation-metaphor-possession'],
    exemplars: [{ essayId: '05-harvard-2028-i-too-can-dance', demonstration: 'Closing paragraphs feature specific scene-objects (parched paper, midnight-induced euphoria) and possession-claims (I can dance across the page) — no list of "gained skills."' }],
  },
  {
    id: 'no-unfair-rendering-of-opposing-view',
    description: 'Orlee\'s grandmother — whose worldview the essay refutes — is rendered with full sympathy. She is loving, old, worried; her concern ("I just don\'t want her to feel different") is the most sympathetic possible version of the worry.',
    why: 'Refuting a flat antagonist is a cheap victory. Earned refutations require lovable foils; the disagreement matters because the relationship matters.',
    appliesToArchetypeIds: ['bait-and-switch-foil-refutation'],
    exemplars: [{ essayId: '09-harvard-2028-bra-shopping', demonstration: 'The grandmother volunteers (love), pays attention to Orlee\'s worry about Deerfield (love), is given the most sympathetic worry (not "she wants to control me" but "she doesn\'t want me to feel different").' }],
  },
  {
    id: 'no-soft-language-for-bullying-incident',
    description: 'Marcus does not soften the bullying — calls it humiliation, names the phone, names the laughter, voices the bullies\' framing ("Look at the freak"). But he also does not dwell or pity-seek. The honesty is calibrated.',
    why: 'Softening bullying ("an unfortunate incident") loses the reader\'s stake in the writer\'s response. Wallowing in bullying loses the reader\'s respect for the writer\'s agency. Calibration matters.',
    appliesToArchetypeIds: ['child-memory-extended-metaphor-prophecy'],
    exemplars: [{ essayId: '10-harvard-2028-the-zoo', demonstration: '"In an instant I knew they were laughing at me." Direct. Then specific actions (turned, walked away, video posted, refused to check). No "and then I cried for hours" or "I felt destroyed."' }],
  },
  {
    id: 'no-stem-content-in-mostly-humanistic-essays',
    description: 'Lauren self-describes as "statistical and logical brain" but the essay shows zero statistical or logical content. The essay is entirely humanistic. The deliberate absence of STEM content keeps the essay focused on its actual demonstration (passion-to-policy via art).',
    why: 'Including token STEM content to "balance" the essay would split the focus and weaken the actual demonstration. The self-description is enough to signal the writer has STEM in their broader portfolio.',
    appliesToArchetypeIds: ['obsession-intellectual-autobiography-maximalist'],
    exemplars: [{ essayId: '13-harvard-2028-sondheim', demonstration: 'The phrase "my statistical and logical brain" appears once, naming the writer\'s default cognitive register. The rest of the essay demonstrates only the humanistic complement — no equations, no datasets, no STEM examples.' }],
  },
  {
    id: 'no-resume-style-list-of-projects',
    description: 'Sarika lists three writing projects in paragraph 6 (cancer research article, Spanish poem, autobiographical story) but each is thematically linked rather than stacked. The list is not a resume of accomplishments; it is a portrait of an intellectual ecosystem.',
    why: 'Resume-style accomplishment lists in essays read as application material, not literary work. Thematically-linked lists demonstrate cognitive coherence.',
    appliesToArchetypeIds: ['interior-transformation-metaphor-possession'],
    exemplars: [{ essayId: '05-harvard-2028-i-too-can-dance', demonstration: '"a Spanish poem about the beauty of unspoken moments" thematically mirrors the essay\'s own restraint about the wheelchair. The three projects are in conversation, not parallel.' }],
  },
  {
    id: 'no-explicit-naming-of-vietnam-as-country',
    description: 'Michelle\'s essay never names Korea as her country of origin, though the essay is identifiably Korean (Konglish, "rural" as the unpronounceable word, the SpongeBob/childhood-English trajectory). The country is implicit.',
    why: 'Explicitly naming the heritage country can tip an essay toward "diversity statement" framing. Letting the heritage be implicit allows the essay\'s subject to remain the writer\'s relationship to language.',
    appliesToArchetypeIds: ['metaphor-literalization-scientific'],
    exemplars: [{ essayId: '11-harvard-2028-fish-out-of-water', demonstration: 'The essay says "moving 6000 miles" and references Konglish (Korean-English pidgin) but never says "I was born in Korea" or "my family is Korean." Heritage is felt through specifics.' }],
  },
  {
    id: 'no-detailed-description-of-friend-family-interactions',
    description: 'Michael writes "When around friends and their families, I would often put my head down and smile because their interactions would remind me so much of when my mother was with me every day" without describing any specific friend-family dinner or car ride. The interactions are gestured at abstractly.',
    why: 'The reader knows what friend-family interactions look like; describing one would slow the paragraph for no benefit. Strategic abstraction works when the abstraction\'s referent is universally familiar.',
    appliesToArchetypeIds: ['plain-voice-sacrifice-ritual'],
    exemplars: [{ essayId: '12-harvard-2028-three-years-alone', demonstration: 'The essay trusts the reader to fill in "their interactions" — every reader has seen friends\' families being families. Specifying would be redundant.' }],
  },
  {
    id: 'no-sweeney-todd-explanation',
    description: 'Lauren never explains what Sweeney Todd is, who Mrs. Lovett is, or what "stringy meat" refers to. She trusts readers either know or will infer; she selects her reader by the references.',
    why: 'Explaining domain-references signals outsider status. Maximalist domain-insider voice REQUIRES not explaining — the unexplained references are the voice.',
    appliesToArchetypeIds: ['obsession-intellectual-autobiography-maximalist'],
    exemplars: [{ essayId: '13-harvard-2028-sondheim', demonstration: 'No parenthetical "(the 19th-century murderous barber)" or "(Sondheim\'s Mrs. Lovett, who bakes the corpses into meat pies)." The references are presented as if everyone knows.' }],
  },
  {
    id: 'no-resolution-of-paradox-in-cookies-essay',
    description: 'Daniella never solves the cookie mystery. After investigating chemistry and music lenses, the essay does NOT report finally figuring out why each batch turns out differently. The mystery remains.',
    why: 'The essay\'s subject is the WONDERING, not the answering. Resolving the mystery would close down what the essay claims is its source of value.',
    appliesToArchetypeIds: ['mundane-topic-multi-lens'],
    exemplars: [{ essayId: '08-harvard-2028-cookies', demonstration: '"However the cookie crumbles in my future, I will approach my work with curiosity, creativity, and earnestness." The closing accepts ongoing mystery as the practice\'s value.' }],
  },
  {
    id: 'no-mention-of-bullies-faces-or-names',
    description: 'Marcus describes "a rowdy group of boys" and "one had his phone up" but gives no names, no facial descriptions, no specific identifying details. The bullies remain a category.',
    why: 'Naming or describing the bullies would make them characters in the essay. The essay\'s point is that the bullies\' specific identities don\'t matter — what matters is what they tried to do and the writer\'s response.',
    appliesToArchetypeIds: ['child-memory-extended-metaphor-prophecy'],
    exemplars: [{ essayId: '10-harvard-2028-the-zoo', demonstration: '"a rowdy group of boys" — anonymous. "One had his phone up" — unnamed. "Their laughs" — collective. The bullies remain a function in the essay, not characters.' }],
  },
  {
    id: 'no-explicit-bridge-between-childhood-and-political-positions',
    description: 'Lauren names specific causal links from specific Sondheim works to specific policy positions, but does NOT say "and then in eighth grade I joined a political group" or trace the school-by-school development of her politics. The intellectual formation is the through-line.',
    why: 'Tracing political-organization involvement would shift the essay toward extracurricular-narrative. Keeping the through-line intellectual (works → convictions) preserves the essay\'s argument.',
    appliesToArchetypeIds: ['obsession-intellectual-autobiography-maximalist'],
    exemplars: [{ essayId: '13-harvard-2028-sondheim', demonstration: 'The ladder is: West Side Story → urban gun violence policy. Assassins → critique of American individualism → climate/gun-violence/pandemic response. No mention of clubs joined or campaigns volunteered for.' }],
  },
];
