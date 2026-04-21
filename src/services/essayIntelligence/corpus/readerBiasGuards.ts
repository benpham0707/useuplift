/**
 * readerBiasGuards.ts — Aggregated reader-bias self-checks from all 10 v2.1 reviews.
 *
 * Methodology v2.1 requires every review to name "the specific reader-bias most
 * likely to have skewed the analysis" and describe how it was adjusted. These
 * are the corrected biases — surfaced as guards that downstream pipeline layers
 * (L3/L3.5/L3.75/L4/L5/L6) should inject into their prompts to prevent the
 * same biases from misshaping coaching.
 *
 * Each guard's `correctiveInstruction` is plain prose, ready to inject directly
 * into an LLM prompt without further formatting.
 */

import type { BiasGuard } from './corpusTypes';

export const READER_BIAS_GUARDS: BiasGuard[] = [
  {
    id: 'over-rewarding-literary-prose-over-plain',
    biasDescription: 'Reviewers and pipeline layers tend to over-reward essays with high literary density (extended metaphor, ornate vocabulary, sustained sentence variation) and under-reward essays whose strength is plain-voice restraint.',
    correctiveInstruction: 'When evaluating an essay\'s craft, distinguish between LITERARY DENSITY (a specific register choice) and CRAFT EXECUTION (the actual demonstration of the chosen register). Plain-voice essays where restraint is the load-bearing craft choice can score equally with literary essays. Restraint is craft, not absence-of-craft. If the content is dramatic enough to stand without decoration, plain voice is often the CORRECT choice — decorating it would cheapen the material.',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'Billy\'s review (07) explicitly flagged this bias: "under-rewarding conventionally-written essays because I\'ve been trained on Sarika\'s literary density." Michael\'s review (12) is the corpus exemplar of plain-voice-as-craft-choice; over-rewarding literary density would have rejected this fully-attested Harvard admit.',
  },
  {
    id: 'under-rewarding-short-essays',
    biasDescription: 'Reviewers tend to penalize short essays as "thin" when in fact they are compressed. Long-form expansion of family history is rewarded; one-sentence compression is sometimes flagged as insufficient.',
    correctiveInstruction: 'Word count is not a quality signal. Compression is its own craft — Clara\'s 650-word essay carries a century of family history in 5 paragraphs. Evaluate density-of-content-per-word, not raw length. A short essay where every sentence carries multiple specifics is stronger than a long essay where most sentences are functional exposition.',
    appliesTo: ['L3.5', 'L3.75', 'L4'],
    evidenceFromCorpus: 'Clara\'s review (14) explicitly: "comparatively compact review for a comparatively compact essay — fewer named moves than the maximalist entries, but each move has been doing significant work in a small space." The corpus needed the compressed-heritage exemplar.',
  },
  {
    id: 'over-rewarding-structural-experiments',
    biasDescription: 'Reviewers tend to over-reward typographic experiments (section breaks, italicized lines, unusual punctuation) as inherently sophisticated. Such moves can be ornament rather than craft.',
    correctiveInstruction: 'Typographic moves (section breaks, italicized closings, period-emphasis) are evaluated by whether they earn their use. Ornamental experiments — typography deployed without structural function — should score lower than executed typography (Orlee\'s "Not. My. Idea." period-emphasis lands because it captures spoken cadence; the same move in another essay would feel performative). Ask: would removing the typographic move weaken the essay? If no, the move is decorative.',
    appliesTo: ['L3.5', 'L4', 'L5'],
    evidenceFromCorpus: 'Marcus\'s review (10) implicitly noted this: the one-sentence hinge paragraph ("Until I became one") works because it does structural work. The same move in another essay without the metaphor architecture would be a flourish.',
  },
  {
    id: 'bias-toward-minority-identity-essays-regardless-of-craft',
    biasDescription: 'Reviewers may unconsciously elevate essays with minority-identity content regardless of the essay\'s actual craft execution, OR conversely may over-skeptically read identity essays as "trying for diversity points."',
    correctiveInstruction: 'Identity content is texture, not thesis. Evaluate the CRAFT of how identity is rendered (named once vs. declared throughout; revealed through consequence vs. announced; distributed across multiple identities vs. centered in one) — not the FACT of identity content. Sarika\'s wheelchair, Marcus\'s gender transition, Orlee\'s lesbian moms, Michelle\'s ELL background, Clara\'s Vietnamese heritage all appear in the corpus — but they are evaluated by HOW they appear, not THAT they appear.',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4', 'L5', 'L6'],
    evidenceFromCorpus: 'Multiple reviews (Sarika, Orlee, Marcus) emphasize that the essay\'s strength is refusing to let identity become the essay\'s declared theme. The pipeline must reward the refusal-to-center, not the presence-of-identity.',
  },
  {
    id: 'over-skepticism-of-comedic-voice',
    biasDescription: 'Reviewers may treat comedic register as less "serious" than reflective register, under-rewarding essays that lead with humor.',
    correctiveInstruction: 'Comedic voice is not less serious than reflective voice. Orlee\'s bait-and-switch architecture uses comedy as load-bearing structure — the comedy EARNS the right to deliver heavy biographical content. Daniella\'s intellectual-playful register sustains philosophical depth. Evaluate whether the comedic register serves the essay\'s structural and emotional function, not whether comedy is "appropriate" for personal essays.',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4'],
    evidenceFromCorpus: 'Orlee\'s review (09): "Comedy earns the right to deliver gravity. Reflective-seriousness earns the right to deliver humor. What doesn\'t earn itself is hitting the heavy material in the first paragraph in heavy-material register."',
  },
  {
    id: 'pattern-matching-to-genre-cliche-templates',
    biasDescription: 'Pipeline layers tend to pattern-match essays to known cliche-templates (sports comeback, dead grandparent, mission trip) and either reject or under-score essays that resemble them — even when the essay genuinely subverts the template.',
    correctiveInstruction: 'Distinguish between template-as-failure and template-as-foundation. Many corpus essays START in template territory (Sarika could be a "disability essay," Michael could be an "immigrant sacrifice essay," Marcus could be a "transgender bullying essay") but execute moves that subvert the template. Look for the specific subversion: does the essay name the central fact only once? Does it refuse external resolution? Does it use the template\'s setup but invert the closing? Subverted templates are stronger than generic-distinct topics.',
    appliesTo: ['L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'All 10 corpus essays exhibit some template-resonance. The pipeline must recognize that template-resonance ≠ template-failure; the question is whether specific moves subvert the template.',
  },
  {
    id: 'over-weighting-weakness-analysis',
    biasDescription: 'Pre-v2.1 reviews over-weighted weakness analysis. Pipeline layers similarly tend to flag weaknesses heavily and under-weight strengths, producing coaching that focuses on what to fix rather than what to amplify.',
    correctiveInstruction: 'Identify weaknesses ONLY when they teach something the strengths don\'t. Default assumption: the essay is working; the prose serves the essay even when not every sentence is polished. Top-tier essays often have local weaknesses (Sarika\'s "glimmered" overwriting, Francisco\'s many abstractions) that the surrounding craft absorbs. Coaching weight: ~85% on what\'s working and how to amplify it; ~15% on weaknesses worth flagging.',
    appliesTo: ['L4', 'L5', 'L6'],
    evidenceFromCorpus: 'Methodology v2.1 (METHODOLOGY.md): "Identify weaknesses only when they teach something the strengths don\'t... Weakness sections in reviews should be ~10-15% of the review\'s content, not 30%." Francisco\'s review (06) was explicitly flagged as having over-weighted weakness analysis pre-v2.1.',
  },
  {
    id: 'over-rewarding-stem-content-in-mixed-essays',
    biasDescription: 'Pipeline layers may over-reward technical/STEM content in essays whose actual demonstration is humanistic, treating mixed-domain essays as more sophisticated even when the STEM content is tokenistic.',
    correctiveInstruction: 'STEM content in personal essays is evaluated by whether it does WORK in the essay, not by its presence. Michelle\'s biology vocabulary (chyme, ATP synthase) is load-bearing because it grounds the metaphor-literalization. Lauren\'s "statistical and logical brain" is one phrase signaling cognitive default — the essay correctly does NOT include token STEM content. Don\'t penalize humanistic essays for lacking STEM content; don\'t reward STEM content that\'s decorative.',
    appliesTo: ['L3.5', 'L3.75', 'L4'],
    evidenceFromCorpus: 'Lauren\'s review (13) explicitly notes the deliberate absence of STEM content as a craft choice — the self-description as "statistical and logical brain" appears once and the essay sticks to its humanistic demonstration.',
  },
  {
    id: 'consultant-commentary-halo-effect',
    biasDescription: 'Pipeline layers may give weight to consultant commentary attached to corpus essays as if it were authoritative craft analysis, when consultant commentary is often marketing-flavored and often misses the actual craft moves.',
    correctiveInstruction: 'Consultant commentary on corpus essays is attestation of admission, NOT authoritative craft reading. Most consultant commentary in the Harvard 2024 Crimson series catches surface qualities (voice, hook) and misses architectural moves (one-word identity distinctions, scientific literalizations, refutation-triplet mirrors). When the pipeline encounters consultant commentary, weight it as evidence of admission, not as evidence of craft analysis.',
    appliesTo: ['L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'Multiple reviews (Marcus, Michelle, Michael, Lauren) explicitly note what the attached consultant commentary missed — including the load-bearing structural moves of each essay.',
  },
  // ─────────────────────────────────────────────────────────────────────────
  // Hopkins-attested reader-bias guards (added 2026-04-20 post-integration)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'topic-bias-toward-seriousness',
    biasDescription: 'Reviewers and pipeline layers tend to privilege essays with dramatic stakes (grief, disability, sacrifice) over essays with apparently-small topics (appearance, social anxiety, small school activities).',
    correctiveInstruction: 'Read every sentence for what it is DOING, not what it is ABOUT. Small-topic essays deploying tight craft (verb inversions, color-metaphor pairs, bookended locations, demonstrative-pronoun arcs) can equal or exceed dramatic-topic essays in craft execution. Emily\'s splash-of-color essay has topic-lightness with craft-density that should NOT be discounted for stakes-size. Craft can exceed topic\'s apparent significance.',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'Emily review (01-hopkins-2029) explicitly: "The reader-bias most at risk in reviewing this essay was topic-bias toward seriousness. The correction: read Emily\'s sentences for what they are DOING, not what they are ABOUT." The essay\'s verb-inversions, color-stacks, and demonstrative-distances are sentence-level craft independent of topic-stakes.',
  },
  {
    id: 'over-rewarding-interdisciplinary-signal-over-voice-craft',
    biasDescription: 'Pipeline layers may over-reward essays displaying multiple academic-field breadth as if breadth alone proves intellectual seriousness, missing that subject-field signaling is not sentence-craft.',
    correctiveInstruction: 'Of each sentence, ask what it is doing at the sentence level — not what subject-field it is signaling. An essay that lists four fields without specific sub-questions is breadth-signaling; an essay that names sub-questions per field demonstrates integration. The sentence-craft test: does each sentence work when stripped of its field-name? If not, the sentence leans on subject-breadth rather than craft.',
    appliesTo: ['L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'Shotaro review (02-hopkins-2029) explicitly: "the reader-bias most likely to skew this review: over-rewarding interdisciplinary signal over voice-craft. The essay reads as intellectually serious; the temptation is to credit the writer with every craft move the AI could detect. The corrective: ask of each sentence what it is doing at the sentence level, not what subject-field it is signaling."',
  },
  {
    id: 'over-crediting-heritage-essays-with-topic-sincerity',
    biasDescription: 'Reviewers (human and algorithmic) tend to extend sympathy credit to heritage-reclamation essays independent of craft quality, rewarding topic-sincerity rather than sentence-level execution.',
    correctiveInstruction: 'Heritage essays benefit from reader sympathy regardless of craft. The corrective: check whether the essay\'s sentences are actually doing work at the sentence level, or whether the topic is carrying weight the prose has not earned. Specifically look for: is the code-switching architectural (introduced via gloss, integrated natively) or decorative? Is the register-shift tracked sentence-by-sentence or merely asserted? Is the vocabulary arc advancing understanding or just listing?',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4', 'L5', 'L6'],
    evidenceFromCorpus: 'Nancy review (03-hopkins-2028) explicitly: "The reader-bias most at risk: over-crediting heritage essays with emotional sincerity credit. Heritage-reclamation essays benefit from reader sympathy independent of craft quality. The corrective: check whether Nancy\'s sentences are actually doing work at the sentence level, or whether the topic is carrying weight the prose has not earned."',
  },
  {
    id: 'over-rewarding-scientific-literacy',
    biasDescription: 'Correct use of a scientific concept (entropy, osmoregulation, thermodynamics) is immediately impressive; reviewers may over-weight scientific correctness as proxy for craft quality.',
    correctiveInstruction: 'Read each sentence for what it does at the sentence level, not for whether it demonstrates domain mastery. Scientific correctness is a floor, not a ceiling — the essay\'s domain accuracy is necessary but not sufficient. Ask: do the sentences work as sentences? Does register alternate meaningfully? Does the scientific concept carry emotional weight or sit as ornament?',
    appliesTo: ['L3', 'L3.5', 'L3.75', 'L4', 'L5'],
    evidenceFromCorpus: 'Ellie review (04-hopkins-2027) explicitly: "over-rewarding scientific literacy. Ellie\'s correct use of entropy-as-concept is immediately impressive — adult readers who remember struggling with thermodynamics will reward her disproportionately for getting it right. The corrective: read each sentence for what it does at the sentence level, not for whether it demonstrates chemistry mastery. Ellie\'s sentences do plenty; the chemistry correctness is a floor, not a ceiling."',
  },

  {
    id: 'over-rewarding-explicit-thesis-statements',
    biasDescription: 'Pipeline layers may reward essays that state their thesis explicitly and penalize essays whose thesis is structural rather than declared.',
    correctiveInstruction: 'Hidden thesis (Sarika\'s longing-triplet, Marcus\'s mother\'s dialogue planted in paragraph 1, Michael\'s pride-vs-hope distinction) often produces stronger essays than declared thesis. The pipeline should detect structural thesis (triplets that resolve, callbacks that invert, dialogues that activate) and reward them equivalently with declared thesis. Declared thesis is one approach; planted thesis is another; planted-thesis essays should not be flagged as "lacking clear thesis."',
    appliesTo: ['L3.5', 'L3.75', 'L4'],
    evidenceFromCorpus: 'Sarika\'s longing-triplet, Michael\'s pride-vs-hope distinction, Marcus\'s mother\'s zoo-dialogue all carry the essay\'s argument structurally rather than declaratively.',
  },
];
