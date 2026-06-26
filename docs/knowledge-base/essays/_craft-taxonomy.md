# Essay-Craft Dimension Taxonomy (the breadth scaffold)

> The palette a master writing teacher commands, derived from the ~200 moves named across the 14
> admit-essay human reviews (`tests/calibration/top-tier-reference/reviews/`). Our corpus currently
> tags only 8 of these as first-class `MoveDimension`s — the rest carry expert moves that are
> *under-indexed* (filed under voice/structure, invisible to retrieval). This scaffold defines the
> ~18-axis target; each cycle deepens the priority axes to verified KB depth. Coverage + surface/expert
> from the cycle-1c/1d breadth audit. Goal: a *plethora* of selectable EXPERT (non-surface) choices.

## The ~18 dimensions (★ = currently a first-class corpus MoveDimension)

| Axis | Expert sub-techniques (the non-surface layer we must build) | KB depth | Priority |
|------|------------------------------------------------------------|----------|----------|
| **Restraint / understatement** | name-central-fact-once-then-orbit-via-effects; reveal-through-consequence; end-on-image-delete-explanation; the "almost" that refuses closure; embodied-not-named emotion; single-bridge discipline | none | **P0 (building now)** |
| **Rhythm / sentence-music** | length-variation; beat-drop after buildup; parataxis/hypotaxis; meter-content congruence; sound-count↔list-length; chiasmus; cadenced close; white-space | none | **P0** |
| **Complexity / subtext / irony** | latent double-reading; silent pivot-word; harm-in-framing-not-footage; one-word distinction; paradox-self; insight voiced in the language of the problem | none | **P0** |
| **Tone / register modulation** | register-mismatch in one sentence; plain-voice-as-choice; scare-quote hinge that DROPS once accepted; counter-direction adjective pairs; register-escalation | none | **P0** |
| **Diction / word-precision** | load-bearing verb; ethical-inflection adjective; coined verb; adjacent-register borrowing; verb-as-tracker; double-payload vehicle | none | **P1** |
| **Syntax / grammar-as-craft** | subject-displacement; gerund-subject; reflexive-agency at loss-of-control; inversion-for-emphasis; demonstrative-distancing; hinge-fragment; weaponized connector | none | **P1** |
| **Pacing / time-control** | anti-dramatic transition; delayed naming; action/consequence isolation across a break; time-stamped ritual; one-sentence historical compression; age-tagging | none | **P1** |
| **Reflection / meaning-making** ★(argument/emotion) | so-what laddering; earned-abstraction; surprise-bar; outward pivot — SOLVED (8 verified entries) | **rich** | done (maintain) |
| **Imagery / figurative** ★(metaphor) | metaphor-literalization; recursive metaphor; verb-possession; earned-domain metaphor; double-connotation vehicle (NOT generic "extended metaphor") | thin | P1 |
| **Voice / persona** ★(voice) | childhood-voice bleed; interior-command; absorbed-vocabulary; metatextual title; deflective 2nd-person | corpus-rich, KB-none | P2 |
| **Motif / recurrence** | verb-migration; word-planting; threaded vocabulary; image-callback | none | P1 |
| **Juxtaposition** | disproportion-hook; object-pairing; asymmetric parallelism; literal-beside-figurative | none | P1 |
| **Dialogue** | thesis-as-dialogue; overheard-as-lens; group-sentiment-quote; tag-as-character; reveal-through-others'-language | thin | P2 |
| **Humor / wit** | dead-idiom literalization; register-joke; threshold-comedy; self-deprecating specificity; name-play | thin | P1 |
| **Opening craft** ★(opening) | subject-displacement; disproportion-hook; misdirection-hypothesis; dictionary-epigraph; time-before-subject (NOT "start with a scene") | corpus-rich | P2 (de-surface) |
| **Closing craft** ★(closing) | topic-object negation; anaphora-of-refusal; mirror-but-asymmetric; counterintuitive-close (NOT "circle back") | corpus-rich | P2 (de-surface) |
| **Macro-structure** ★(structure) | braided; frame; register-alternation; hinge-paragraph; bait-and-switch; coda | corpus-rich | P2 (de-surface) |
| **Detail / specificity** ★(specificity) | synecdoche; peripheral-fact; spec-as-voice; instant-character number (NOT "add specificity") | corpus-rich | P2 (de-surface) |
| **Typography / punctuation** | period-emphasis; scare-quote hinge+drop; section break; weight-bearing parenthetical; em-dash verdict | thin | P2 |

## The two structural upgrades (the highest-leverage integration moves)
1. **Expand corpus `MoveDimension` 8 → ~18** (`corpusTypes.ts`) and re-tag the 190 moves → the expert craft already captured becomes *retrievable by the axis that carries it*. (Integration step; do once the taxonomy is validated by ≥2 deep KB subtopics.)
2. **Add `surfaceVsExpert` to `CraftMove`** → coaching suppresses what the base LLM volunteers and leads with the non-obvious (operationalizes the "don't give surface techniques" requirement).

## Build order (deepen to verified KB depth, admit-bar standard, each benchmarked)
P0: **restraint** (now) → rhythm → subtext/complexity → tone-modulation.
P1: diction → syntax → pacing → imagery-rebalance → motif → juxtaposition → humor.
P2: de-surface the 5 rich-but-shallow corpus axes (specificity/opening/closing/structure/voice) + typography.
