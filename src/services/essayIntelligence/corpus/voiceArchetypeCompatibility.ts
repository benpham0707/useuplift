/**
 * voiceArchetypeCompatibility.ts — THE SAFETY RAIL.
 *
 * For every voice register × every archetype combination, an explicit fit
 * level (`native` | `reachable` | `risky` | `forbidden`) and a citation-bearing
 * rationale. 7 voices × 14 archetypes = 98 cells. NO empty cells.
 *
 * Fit semantics:
 *   - `native`     — voice and archetype are mutually load-bearing; the corpus
 *                    exemplar uses this voice for this archetype.
 *   - `reachable`  — voice can execute the archetype with effort; some load-bearing
 *                    moves require register-stretching but are achievable.
 *   - `risky`      — voice can attempt the archetype but failure modes are likely;
 *                    coaching should flag the risk and offer alternatives.
 *   - `forbidden`  — coaching MUST NEVER suggest this archetype to a student with
 *                    this voice. Used DELIBERATELY and only with cited corpus
 *                    evidence demonstrating systematic incompatibility.
 *
 * Why this file matters: errors here cause downstream coaching malpractice.
 * A `native` mis-rating wastes a student's time on an archetype they can't
 * execute. A `forbidden` mis-rating denies a student access to an archetype
 * they could in fact reach. Every cell rated by careful read of the corpus.
 *
 * For Hopkins-reserved archetypes (provenance: 'pending-hopkins-reviews'),
 * fit ratings are provisional and conservative — `risky` for unverified
 * combinations, never `native`. These ratings will be refined when Hopkins
 * reviews land.
 */

import type { VoiceArchetypeMatch } from './corpusTypes';

export const VOICE_ARCHETYPE_COMPATIBILITY: VoiceArchetypeMatch[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // PLAIN
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'plain',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'native', rationale: 'Emily\'s archetype REQUIRES plain voice as load-bearing — small-stakes topic + plain register is the architecture. Literary inflation would destroy the humility. Direct match.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'native', rationale: 'Shotaro\'s archetype IS flat/plain register — review framing: "The essay is voiced flatter than Emily\'s. The sentences are more matter-of-fact." Plain voice carries specifications-as-voice and flat-close moves. Direct match.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'reachable', rationale: 'Nancy\'s archetype mixes plain voice with literary-reflective moments. Plain-voice writers can execute the vocabulary-entry spine and the interior-command scenes; verb-pace-change-across-same-setting is the stretch that needs literary capacity.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'risky', rationale: 'Ellie\'s archetype requires sustained register-alternation (textbook-voice ↔ conversational). Plain-voice writers risk staying conversational without the textbook-register baseline that makes the alternation land.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'risky', rationale: 'Sarika\'s archetype requires sustained literary register to land verb-possession ("pencil pirouettes"). Plain voice cannot execute the load-bearing metaphor moves at the required density.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'reachable', rationale: 'Francisco\'s archetype works in plain register for surrounding paragraphs; only the peak scene requires literary capacity. A plain-voice writer can attempt this if they can rise to literary density for one paragraph.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'native', rationale: 'Billy\'s archetype IS plain prose — wry, plain-spoken, not literary. The corpus exemplar uses plain voice throughout. Direct match.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'risky', rationale: 'Daniella\'s archetype requires intellectual-playful or comedic voice to deploy multiple lens vocabularies. Plain voice can attempt but lacks the register-range.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'reachable', rationale: 'Orlee\'s archetype mixes comedic and plain registers. A plain-voice writer with reliable humor can execute, though the comedic load is heavy.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'native', rationale: 'Marcus\'s archetype uses plain voice with selective literary moments (peripheral vision, ambulance-on-chest equivalent). The opening child-memory and refusal-close both work in plain voice. Direct match.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'risky', rationale: 'Michelle\'s archetype requires domain-insider voice to deploy the scientific mechanism naturally. Plain voice can support the surrounding narrative but the scientific-literalization paragraph needs more.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'native', rationale: 'Michael\'s archetype IS plain voice — restraint is the craft choice. The corpus exemplar contains zero metaphors. Direct match.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'forbidden', rationale: 'Lauren\'s archetype REQUIRES maximalist domain-insider voice to land the reference density and religious-framing. Plain voice cannot sustain the load-bearing reference architecture; a plain-voice student attempting this archetype will produce surface-imitation that reads as performative. Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'compressed-heritage', fit: 'reachable', rationale: 'Clara\'s archetype mixes plain and literary-reflective. A plain-voice writer can execute the compressed-biography move and the named-character anchor; the consistent metaphor across paragraphs is the stretch.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LITERARY-REFLECTIVE
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'literary-reflective',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'native', rationale: 'Emily\'s mirror-bookend architecture, color-metaphor emotional-physical pun, and third-person-past-self-reference closing are literary-reflective core moves. Direct match.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'reachable', rationale: 'Shotaro\'s archetype prefers flat/plain voice; literary-reflective writer can support the inverted-syntax-for-emphasis moments but must restrain ornament.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'native', rationale: 'Nancy\'s verb-pace-change-across-same-setting, literal-setting-as-closing-metaphor, and thesis-as-mid-paragraph-observation are literary-reflective core moves.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'reachable', rationale: 'Ellie\'s archetype is primarily domain-insider + intellectual-playful; literary-reflective writer can support the compressed-thesis and idiom-with-scientific-second-reading closing.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'native', rationale: 'Sarika\'s archetype IS literary-reflective. The corpus exemplar uses metaphor-balanced register throughout; verb-possession requires this voice. Direct match.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'native', rationale: 'Francisco\'s peak-scene paragraph operates at literary-reflective density (ambulance metaphor, stingy breaths, peripheral vision). Voice supports the load-bearing scene.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'reachable', rationale: 'Billy\'s archetype prefers plain voice but a literary-reflective writer can downshift if needed; risk is that literary register undermines the wry self-analytical tone.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'reachable', rationale: 'Daniella\'s archetype mixes intellectual-playful and literary-reflective; literary writers can execute though the comedic moments require register flexibility.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'reachable', rationale: 'Orlee\'s archetype is comedic-led; literary-reflective writer must reach for humor to make the bait-and-switch work.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'native', rationale: 'Marcus\'s extended-metaphor architecture is literary-reflective\'s wheelhouse. The hinge, the double-naming, the refusal-close all benefit from this voice.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'native', rationale: 'Michelle\'s archetype mixes literary-reflective with domain-insider; the chiastic thesis line and the inner-fish identity move are literary-reflective core.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'risky', rationale: 'Michael\'s archetype REQUIRES restraint — literary-reflective voice risks decorating content that should stand bare. Coaching should flag the risk of overwriting.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'reachable', rationale: 'Lauren\'s archetype prefers maximalist; literary-reflective writers can attempt but typically lack the reference density.' },
      { archetypeId: 'compressed-heritage', fit: 'native', rationale: 'Clara\'s consistent metaphor and named-character anchor work in literary-reflective register. The compression itself is a literary-reflective craft choice.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MAXIMALIST
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'maximalist',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'risky', rationale: 'PROVISIONAL. Small-risk-growth narratives typically benefit from restraint; maximalism risks over-inflating modest events.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'reachable', rationale: 'PROVISIONAL (pending Hopkins review). Likely strong fit once attested; conservative until confirmed.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'reachable', rationale: 'Sarika\'s archetype tolerates maximalist register at peak metaphor moments; the restraint of name-central-fact-once is the stretch for maximalists.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'risky', rationale: 'Francisco\'s peak-scene is concentrated; maximalist voice tends to distribute density. Risk of dilution.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'forbidden', rationale: 'Billy\'s archetype REQUIRES plain prose as part of the strategic function — the essay must demonstrate restraint to balance the application\'s other ambition signals. Maximalist voice would defeat the strategic purpose, doubling down on what the essay is meant to counterweight. Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'native', rationale: 'Daniella\'s archetype welcomes maximalist register when the writer has multiple deep domains. The cross-domain sensory synthesis is a maximalist move.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'risky', rationale: 'Orlee\'s archetype balances comedy and identity-load; maximalism tips the comedic register and risks overwriting the difference triplet.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'risky', rationale: 'Marcus\'s archetype requires restraint at the hinge ("Until I became one") and the refusal-close; maximalist voice tends toward expansion that undermines these moments.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'reachable', rationale: 'Michelle\'s archetype tolerates maximalism when grounded in real domain expertise.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'forbidden', rationale: 'Michael\'s archetype is plain-voice as load-bearing craft choice. Maximalist voice would decorate content that should stand bare; the writer\'s mother\'s sacrifice and the time-stamped ritual lose their weight under literary expansion. Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'native', rationale: 'Lauren\'s archetype IS maximalist — the corpus exemplar uses high reference density and religious framing. Direct match.' },
      { archetypeId: 'compressed-heritage', fit: 'forbidden', rationale: 'Clara\'s archetype REQUIRES compression — five paragraphs, ~650 words, family trauma in one sentence. Maximalist voice cannot execute compression; it expands. The archetype\'s defining craft (one-sentence historical pivot, single-anchor named character) is structurally incompatible with maximalism. Coaching MUST NEVER suggest this combination.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMEDIC
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'comedic',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'risky', rationale: 'PROVISIONAL.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'risky', rationale: 'Sarika\'s archetype uses humor sparingly (the recorder paragraph) but is fundamentally literary-reflective. Comedic voice would undermine the verb-possession seriousness.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'risky', rationale: 'Francisco\'s peak emotional moment requires earned gravity; comedic register must give way at the Izzy scene.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'reachable', rationale: 'Billy\'s plain register accommodates light comedic moments; the wry voice is comedic-adjacent.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'native', rationale: 'Daniella\'s archetype welcomes comedic register — the literalized-idiom humor and self-aware philosophical escalation are comedic moves.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'native', rationale: 'Orlee\'s archetype LEADS with comedy. The bait-and-switch ONLY works if the comedic opening is genuinely funny; comedic voice is load-bearing.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'risky', rationale: 'Marcus\'s gravity-load (gender transition + bullying) is incompatible with sustained comedic register; risk of register-mismatch undermining the essay.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'reachable', rationale: 'Michelle\'s archetype tolerates comedic moments (the bathroom-control loop) within a primarily literary-reflective frame.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'forbidden', rationale: 'Michael\'s archetype carries serious sacrifice content. Comedic register would feel callous against the mother\'s 3-year live-in caregiver work. Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'reachable', rationale: 'Lauren\'s archetype includes comedic moments (Mrs. Lovett costume mistaken for Frankenstein\'s Bride); a comedic writer can execute if they can also sustain reference density.' },
      { archetypeId: 'compressed-heritage', fit: 'reachable', rationale: 'Clara\'s opening register-mismatch ("menagerie of critters") is comedic-adjacent; full comedic register works for the misdirection opener.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOMAIN-INSIDER
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'domain-insider',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'risky', rationale: 'Emily\'s archetype is about small-stakes social material; domain-insider voice has no natural domain in a mirror/blush/TikTok scene. Deployable only if the writer has a genuine separate domain (e.g., weather-reporting, Emily\'s anchor).' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'native', rationale: 'Shotaro\'s archetype REQUIRES domain-insider voice — specifications-as-voice + parenthetical-field-catalog both depend on natural use of specialized vocabulary. Direct match.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'native', rationale: 'Nancy\'s archetype uses code-switching-within-english-prose with Korean vocabulary treated as domain-insider would treat technical terms — introduced with gloss, then integrated natively. Direct match.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'native', rationale: 'Ellie\'s archetype REQUIRES domain-insider voice for textbook-voice-opening + scientifically-accurate-counter-intuition + calculus-limits-vocabulary-for-self-description. Direct match.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'reachable', rationale: 'Sarika\'s archetype uses ballet-domain vocabulary (pirouette, grand jeté); domain-insider voice can execute when the chosen domain is the metaphor source.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'reachable', rationale: 'Francisco\'s archetype tolerates domain-specific vocabulary in the surrounding paragraphs; the peak scene needs broader register.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'risky', rationale: 'Billy\'s archetype prefers plain register; domain-insider voice can be deployed in the cross-domain enumeration but should not dominate.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'native', rationale: 'Daniella\'s archetype REQUIRES domain-insider voice in EACH of the chosen lenses (chemistry, music). Direct match.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'risky', rationale: 'Orlee\'s archetype is voice-led not domain-led; domain-insider voice is not the load-bearing register.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'reachable', rationale: 'Marcus\'s archetype welcomes domain-insider vocabulary if the essay\'s topic happens to inhabit a domain (e.g., insider language about transition).' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'native', rationale: 'Michelle\'s archetype REQUIRES domain-insider voice to deploy the scientific mechanism naturally. The biological vocabulary (chyme, ATP synthase, osmoregulation) IS domain-insider voice. Direct match.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'forbidden', rationale: 'Michael\'s archetype is plain-voice as load-bearing craft choice (review 12 Pattern Cluster A: "restraint IS the craft decision"). Domain-insider vocabulary would shift register away from the content\'s emotional core. The sacrifice itself doesn\'t have a domain-vocabulary to insider into; the writer\'s relationship to the mother isn\'t a "domain." Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'native', rationale: 'Lauren\'s archetype REQUIRES domain-insider voice — the Sondheim references, the theatre vocabulary, the religious-framing. Direct match.' },
      { archetypeId: 'compressed-heritage', fit: 'reachable', rationale: 'Clara\'s archetype tolerates domain-insider vocabulary about the craft (crochet hook, doilies); the essay\'s primary register is wider than domain-insider.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INTELLECTUAL-PLAYFUL
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'intellectual-playful',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'reachable', rationale: 'Emily\'s color-metaphor-emotional-physical-pun and deferred-ironic-button are intellectual-playful adjacent; the archetype\'s emotional restraint is the stretch for this register.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'native', rationale: 'Shotaro\'s parenthetical-field-catalog, hobby-as-agent-of-curiosity, and flaws-then-pride architecture are intellectual-playful core moves. The flat voice is plain-adjacent but the intellectual stance is playfulness with depth.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'reachable', rationale: 'Nancy\'s absorbed-adult-vocabulary-in-childs-voice and realization-in-the-language-of-the-problem are intellectual-playful — self-aware register mixing. The heritage-reclamation core requires literary-reflective depth too.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'native', rationale: 'Ellie\'s archetype REQUIRES intellectual-playful register for the textbook-voice-alternation architecture + scientific-vocabulary-as-humor + specific-threshold-comedy. Direct match.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'reachable', rationale: 'Sarika\'s archetype prefers literary-reflective; intellectual-playful can execute but the gravity load (disability) requires register-shift at key moments.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'reachable', rationale: 'Francisco\'s peak scene needs gravity not playfulness; intellectual-playful must give way at the emotional core.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'reachable', rationale: 'Billy\'s archetype tolerates intellectual-playful in the proof-by-enumeration paragraph.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'native', rationale: 'Daniella\'s archetype IS intellectual-playful — the self-aware philosophical escalation, the cross-domain synthesis, the literalized idioms are all intellectual-playful moves. Direct match.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'reachable', rationale: 'Orlee\'s archetype mixes registers; intellectual-playful can execute the typographic pivot and the foil structure.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'risky', rationale: 'Marcus\'s gravity-load is incompatible with sustained playfulness.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'native', rationale: 'Michelle\'s archetype welcomes intellectual-playful — analytical-frame-for-childs-action and self-deprecating-parenthetical are intellectual-playful moves.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'forbidden', rationale: 'Michael\'s archetype requires plain-voice gravity (review 12 universal principle 1: "Plain voice is a choice, not a default. When the content is dramatic, plain voice is often the right craft choice"). Intellectual-playful register would feel inappropriate to the mother\'s 3-year sacrifice. Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'reachable', rationale: 'Lauren\'s archetype tolerates intellectual-playful in moments (parenthetical apology, self-described cognitive style); maximalist depth is the load-bearing register.' },
      { archetypeId: 'compressed-heritage', fit: 'native', rationale: 'Clara\'s register-mismatch and named-character anchor are intellectual-playful moves; the closing metaphor depends on intellectual-playful register to land.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LYRIC
  // ─────────────────────────────────────────────────────────────────────────
  {
    voiceRegister: 'lyric',
    archetypeCompatibility: [
      { archetypeId: 'splash-of-color-small-risk-growth', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'building-a-universe-interdisciplinary-obsession', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'korean-sticky-notes-cultural-reclamation', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'ordering-the-disorderly-intellectual-metaphor', fit: 'reachable', rationale: 'PROVISIONAL.' },
      { archetypeId: 'interior-transformation-metaphor-possession', fit: 'native', rationale: 'Sarika\'s archetype welcomes lyric register — the meter-content congruence, the rhythmic weaving across paragraphs, the sonic alliteration. Direct match for writers with rhythmic ear.' },
      { archetypeId: 'peak-scene-community-integration', fit: 'risky', rationale: 'Francisco\'s peak scene benefits from sensory specificity, not necessarily lyric rhythm. Lyric voice can succeed if the rhythm doesn\'t compete with the scene\'s urgency.' },
      { archetypeId: 'strategic-balance-plain-prose', fit: 'risky', rationale: 'Billy\'s plain register is incompatible with lyric voice; risk of overwriting the wry self-analytical tone.' },
      { archetypeId: 'mundane-topic-multi-lens', fit: 'reachable', rationale: 'Daniella\'s archetype tolerates lyric moments (sonic-density-sensory-description); analytical lens vocabularies must coexist with the lyric.' },
      { archetypeId: 'bait-and-switch-foil-refutation', fit: 'risky', rationale: 'Orlee\'s archetype is comedic-led; lyric voice is register-incompatible with the bait-and-switch comedy.' },
      { archetypeId: 'child-memory-extended-metaphor-prophecy', fit: 'reachable', rationale: 'Marcus\'s archetype welcomes lyric register at the opening memory and the refusal-close anaphora.' },
      { archetypeId: 'metaphor-literalization-scientific', fit: 'reachable', rationale: 'Michelle\'s archetype tolerates lyric register at the closing italicized line and inner-fish identity moves.' },
      { archetypeId: 'plain-voice-sacrifice-ritual', fit: 'forbidden', rationale: 'Michael\'s archetype is plain-voice as load-bearing craft choice. Lyric voice would decorate content that should stand bare; the rhythm would distract from the content\'s direct weight. Review 12 framing: "Decorating this essay would cheapen it." Coaching MUST NEVER suggest this combination.' },
      { archetypeId: 'obsession-intellectual-autobiography-maximalist', fit: 'risky', rationale: 'Lauren\'s archetype prefers maximalist domain-insider; lyric register can co-occur but is not the load-bearing voice.' },
      { archetypeId: 'compressed-heritage', fit: 'reachable', rationale: 'Clara\'s opening sonic density is lyric-adjacent; lyric voice can support the consistent metaphor and named-character anchor.' },
    ],
  },
];
