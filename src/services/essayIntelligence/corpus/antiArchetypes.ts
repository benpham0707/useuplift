/**
 * antiArchetypes.ts — Named failure patterns the corpus avoided.
 *
 * Each anti-archetype names a default essay-pattern that fails for top-tier
 * admission, identifies its diagnostic signals, and proposes a corpus
 * archetype the student should reach for instead — with a transplant path.
 *
 * Coaching deployment: when a student\'s draft exhibits an anti-archetype\'s
 * diagnostic signals, surface the corpus alternative and the transplant
 * steps rather than rejecting the topic outright.
 */

import type { AntiArchetype } from './corpusTypes';

export const ANTI_ARCHETYPES: AntiArchetype[] = [
  {
    id: 'sports-injury-comeback',
    description: 'The athlete suffers a serious injury, undergoes rehab, returns to the sport, learns about resilience. Standard structure: injury → struggle → comeback → lesson.',
    diagnosticSignals: [
      'Opening describes the injury moment dramatically (the snap, the fall)',
      'Middle describes physical therapy or training montage',
      'Closing names abstract gains: resilience, determination, mental toughness',
      'No specific behavioral change beyond the sport itself',
    ],
    failureMode: 'AOs read thousands of these. The comeback narrative is a category, not an essay; the writer is indistinguishable from other injured athletes who recovered.',
    corpusAlternativeArchetypeId: 'strategic-balance-plain-prose',
    transplantPath: 'If the writer is genuinely a hyper-organized athlete, treat the injury as the spontaneity-counterbalance their controlled-athlete identity needs. Use proof-by-enumeration to demonstrate the planning identity in non-sport domains; let the injury moment be one specific scene of yielding-to-pull (agency-reversal personification of the injury). Close with additive-transformation framing: "I am still the captain who plans every drill, AND I have learned what happens when my body refuses the plan."',
  },
  {
    id: 'dead-grandparent-wisdom',
    description: 'The grandparent dies. The grandparent\'s wisdom is recalled. The writer carries the wisdom forward. Standard structure: scene with grandparent → death → reflection on lessons learned.',
    diagnosticSignals: [
      'Opening scene of grandparent + writer in cozy domestic setting',
      'Middle paragraph reports the death (often summarized)',
      'Closing names a "lesson" the grandparent taught',
      'Wisdom is generic ("treat everyone with kindness," "follow your dreams")',
    ],
    failureMode: 'The grandparent-wisdom essay is a deeply common framework that flattens specific relationships into universal moral lessons. The actual grandparent disappears.',
    corpusAlternativeArchetypeId: 'compressed-heritage',
    transplantPath: 'Compress the grandparent\'s biography into one sentence (Clara-style) — full life condensed without dwelling. Keep a single named-character anchor (a specific object the grandparent gave, an idiom they used). Plant their thesis as quoted dialogue (Marcus-style: their actual words become the essay\'s argument). Refuse the abstract "lesson learned" closing; instead, name a specific present-day behavior the grandparent shaped.',
  },
  {
    id: 'mission-trip-epiphany',
    description: 'The writer travels to a developing country, has an epiphany about privilege, returns home changed. Standard structure: arrival → encounter with poverty → epiphany → commitment to service.',
    diagnosticSignals: [
      'Geographic specificity that exoticizes the destination',
      'Self-positioning as savior or learner-from-the-poor',
      'Epiphany moment described as transformative',
      'Closing commits to "giving back" or "service"',
    ],
    failureMode: 'AOs flag this as the most performatively self-congratulatory essay archetype. The destination communities are reduced to backdrops for the writer\'s growth.',
    corpusAlternativeArchetypeId: 'strategic-balance-plain-prose',
    transplantPath: 'Drop the mission trip entirely. Find the spontaneity-counter-trait the writer\'s actual life demonstrates locally (Billy-style: a specific childhood scene of yielding-to-pull). Use proof-by-enumeration of cross-domain examples from the writer\'s actual community. The strategic-balance essay rewards self-knowledge in the writer\'s own context, not consumed observations of others\'.',
  },
  {
    id: 'academic-award-proving-myself',
    description: 'The writer wins an academic award, recounts the journey, names the award\'s significance. Standard structure: setup of competition → the competition → the win → reflection on what it proved.',
    diagnosticSignals: [
      'Award is named explicitly with capital letters',
      'Middle paragraphs describe preparation effort',
      'Closing claims the award proved something about the writer\'s character',
      'No content beyond the award itself',
    ],
    failureMode: 'Awards already appear in the application\'s honors section. Re-narrating them in the essay duplicates information AND signals the writer can\'t identify a richer self-portrait.',
    corpusAlternativeArchetypeId: 'mundane-topic-multi-lens',
    transplantPath: 'Pick a topic the application materials cannot cover — a daily practice, a small obsession, an ongoing puzzle. Apply Daniella\'s multi-lens architecture: investigate the small topic through 2+ intellectual lenses the writer genuinely inhabits. The essay\'s value comes from the THINKING, not the AWARDS that sit elsewhere in the application.',
  },
  {
    id: 'diversity-statement-as-essay',
    description: 'The writer\'s ethnic, racial, religious, or cultural identity becomes the essay\'s declared subject. Standard structure: identity statement → growing-up scene → struggle with representation → embrace of identity.',
    diagnosticSignals: [
      'Opening sentence explicitly names identity category',
      'Identity is treated as the essay\'s thesis rather than texture',
      'Middle describes representation struggles (often generic)',
      'Closing affirms pride in identity',
    ],
    failureMode: 'AOs distinguish "diversity statement" from "personal essay." Diversity statements report identity; personal essays demonstrate the writer through specifics that happen to include identity. The category-essay flattens.',
    corpusAlternativeArchetypeId: 'bait-and-switch-foil-refutation',
    transplantPath: 'Use Orlee\'s architecture: lead with comedy or specific scene that doesn\'t announce identity. Distribute identity across a triplet-anaphora-of-difference rather than centering one identity-category. Keep the foil (cultural expectation, grandparent\'s worldview) lovable. The identities should ARRIVE through lived texture, not be DECLARED in opening.',
  },
  {
    id: 'disability-overcoming-narrative',
    description: 'The writer has a disability or chronic condition; the essay narrates overcoming it. Standard structure: diagnosis → struggles → adaptation → triumph over disability.',
    diagnosticSignals: [
      'Disability named in opening and repeated throughout',
      'Struggles framed as the essay\'s thesis',
      'Closing claims the disability "made me stronger"',
      'No life beyond the disability rendered',
    ],
    failureMode: 'Treats disability as the essay\'s subject rather than as one fact about the writer\'s body. AOs read these as performative resilience narratives.',
    corpusAlternativeArchetypeId: 'interior-transformation-metaphor-possession',
    transplantPath: 'Use Sarika\'s architecture: name the disability EXACTLY ONCE. Surface it through CONSEQUENCE (Sarika\'s "ran over my friends\' toes" before naming wheelchair) rather than declaration. Identify a domain the disability foreclosed and a domain the writer reached instead; use verb-possession to migrate the foreclosed domain\'s vocabulary onto the new one. The essay is about possession of an alternative tool, not about overcoming the disability.',
  },
  {
    id: 'immigrant-parents-sacrifice-generic',
    description: 'The writer\'s parents immigrated; the essay narrates their sacrifice and the writer\'s gratitude. Standard structure: parents\' homeland → reasons for leaving → sacrifices made → writer\'s commitment to honor them.',
    diagnosticSignals: [
      'Geography and circumstances described in general terms',
      'Sacrifices listed as categories (long hours, language barriers, lost careers)',
      'Gratitude expressed abstractly',
      'Closing commits to making their sacrifice "worth it"',
    ],
    failureMode: 'The immigrant-parents narrative is so common AOs can predict its beats. Generic versions report parental archetype rather than specific parental relationship.',
    corpusAlternativeArchetypeId: 'plain-voice-sacrifice-ritual',
    transplantPath: 'Use Michael\'s architecture: choose plain voice (no metaphor — content carries weight). Name a specific time-stamped ritual that mediates the relationship (a 6 a.m. call, a specific weekly meal). Identify the one-word distinction between how the parent labels the writer and how the writer labels themselves. Close with mirror-but-not-symmetric commitment — promise to fill the specific GAP the sacrifice cost (loneliness, deferred education, lost career), not to mirror the sacrifice itself.',
  },
  {
    id: 'mental-health-overcoming',
    description: 'The writer struggled with depression, anxiety, or another mental-health condition; the essay narrates the journey to recovery. Standard structure: diagnosis or crisis → therapy/medication → recovery → commitment to advocacy.',
    diagnosticSignals: [
      'Opening crisis scene described in general terms',
      'Recovery framed as linear arrival',
      'Closing commits to mental-health advocacy or destigmatizing',
      'Strong-claim closure ("I am no longer anxious," "I have fully recovered")',
    ],
    failureMode: 'AOs flag these for risk both ways: too dark reads as instability, too clean reads as performance. The genre is well-trodden; specific craft is required.',
    corpusAlternativeArchetypeId: 'metaphor-literalization-scientific',
    transplantPath: 'If the writer has scientific or psychological domain expertise, use Michelle\'s architecture: open with the dictionary-epigraph of the mental-health term; mid-essay reveal the literal mechanism (cortisol regulation, prefrontal-cortex function, sleep architecture); collapse the metaphor into mechanism. Close with an internalized-metaphor identity ("inner anxious kid") rather than declaring full recovery. Use almost-qualifier closing ("most days the anxiety no longer runs the week").',
  },
  {
    id: 'community-service-savior',
    description: 'The writer volunteers at a tutoring program, soup kitchen, or shelter; the essay narrates their growth from helping others. Standard structure: arrival → encounter with those served → epiphany about privilege → ongoing commitment.',
    diagnosticSignals: [
      'Community served described as monolithic group',
      'Specific individuals appear only as triggers for the writer\'s growth',
      'Service framed as transformative for the writer',
      'Closing commits to lifelong service',
    ],
    failureMode: 'Savior framing centers the writer at the expense of the community served. AOs read these as self-positioning rather than self-portrait.',
    corpusAlternativeArchetypeId: 'peak-scene-community-integration',
    transplantPath: 'Use Francisco\'s architecture: choose a single peak scene where the writer was the RECEIVER of community care, not the GIVER. Render the peak scene at full sensory specificity (peripheral-vision framing, double-connotation metaphor). Map a fear-triplet to a resolution-triplet. The community is the agent of integration; the writer is integrated, not integrating others.',
  },
  {
    id: 'random-quirky-passion',
    description: 'The writer has an unusual hobby (extreme yo-yo, competitive eating, ferret breeding) and the essay celebrates the quirkiness. Standard structure: quirky introduction → development of the hobby → defense against skeptics → celebration of unique self.',
    diagnosticSignals: [
      'Opening leans on the hobby\'s strangeness',
      'Middle defends the hobby against imagined critics',
      'Closing celebrates being "different"',
      'No intellectual or emotional depth beyond the hobby itself',
    ],
    failureMode: 'Quirkiness alone isn\'t craft. The essay reports an unusual fact about the writer without demonstrating the writer\'s thinking, voice, or growth.',
    corpusAlternativeArchetypeId: 'mundane-topic-multi-lens',
    transplantPath: 'Reframe the quirky hobby as a mundane practice (Daniella\'s baking is just baking — no need to defend it). Apply multi-lens investigation: what does this hobby look like through chemistry? Through music? Through history? The intellectual range applied to the small topic does the work; the topic\'s quirkiness is incidental, not load-bearing.',
  },
  {
    id: 'meta-essay-about-writing-the-essay',
    description: 'The writer narrates their struggle to write the college essay. Standard structure: blank page → false starts → reflection on what to write about → realization that the struggle IS the essay.',
    diagnosticSignals: [
      'Opening sentence references the application or the essay itself',
      'Middle describes false starts',
      'Closing claims the meta-realization is the essay\'s subject',
    ],
    failureMode: 'Self-reference essays signal the writer couldn\'t find a subject. AOs read this as evasion of actual self-portrait.',
    corpusAlternativeArchetypeId: 'compressed-heritage',
    transplantPath: 'If the writer\'s family has substantial history, use Clara\'s compressed-heritage architecture instead. Compress family biography to one sentence; thread a consistent metaphor across paragraphs; anchor the essay with one richly-named character (an heirloom, a recipe, a habit). The essay\'s subject becomes specific inheritance rather than the writer\'s indecision.',
  },
];
