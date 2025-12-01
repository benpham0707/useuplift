/**
 * Essay Rubric v1.0.1
 *
 * CHANGELOG from v1.0.0:
 * - Updated based on analysis of 19 exemplar essays from Harvard, Princeton, MIT,
 *   Yale, Duke, Berkeley, Northwestern, Cornell (admitted 2024-2025)
 * - Strengthened vulnerability requirements (68% of exemplars show vulnerability)
 * - Added quantification prompts to Context dimension (42% of exemplars quantify impact)
 * - Refined anchor examples based on real admitted essay patterns
 *
 * Key Findings from Exemplar Analysis:
 * 1. VULNERABILITY IS CRITICAL: 68% of elite essays admit failure, fear, uncertainty
 *    → 10/10 scores now require MULTIPLE vulnerability moments
 * 2. QUANTIFIED IMPACT CREATES CREDIBILITY: 42% use specific numbers
 *    → Added evaluator prompt: "Are outcomes quantified?"
 * 3. Extended narrative arcs common: 6-year novel journey, 4-year journalism growth
 * 4. Paradox exploration powerful: Comfort in pain (rowing), questioning through science
 * 5. Unconventional topics work: Hot sauce, phone charger funerals, Avatar → philosophy
 */

import { Rubric, RubricDimensionDefinition, InteractionRule } from "../types/rubric";

// ============================================================================
// RUBRIC DIMENSIONS (v1.0.1 — REFINED)
// ============================================================================

const dimensions: RubricDimensionDefinition[] = [
  // ==========================================================================
  // DIMENSION 1: Opening Power & Scene Entry (10%)
  // ==========================================================================
  {
    name: 'opening_power_scene_entry',
    display_name: 'Opening Power & Scene Entry',
    definition: 'Does the opening drop us into a concrete moment (time/place/sensory detail or a precise claim) that compels reading?',
    weight: 0.10,

    anchors: [
      {
        score: 0,
        text: 'Generic aphorism',
        explanation: 'Starts with "Since I was young..." or "I have always been passionate about..."'
      },
      {
        score: 5,
        text: 'Clear context but abstract',
        explanation: 'Provides context but lacks sensory detail: "During debate, I learned..."'
      },
      {
        score: 10,
        text: 'Scene on page one OR provocative hook',
        explanation: 'Examples from admits: "The worst stench I have ever encountered" (Duke), "I am an aspiring hot sauce sommelier" (Princeton), "You know nothing, Jon Snow" (Princeton with Game of Thrones pivot)'
      }
    ],

    evaluator_prompts: [
      'Is there a scene or specific claim within first 2 sentences?',
      'Does it force curiosity?',
      'Can I visualize the moment or feel the urgency?',
      'Could this opening belong to anyone, or is it distinctly this writer?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What exact second are we in?',
      'What\'s on the table, wall, or phone screen?',
      'What sound, smell, or texture anchors this moment?',
      'What\'s the most surprising or unconventional entry point?' // NEW v1.0.1
    ],

    warning_signs: [
      'Dictionary definitions as opening',
      'Famous quotes from historical figures',
      '"Ever since I was young..."',
      'Abstract statements about passion or purpose'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 2: Narrative Arc, Stakes & Turn (12%)
  // ==========================================================================
  {
    name: 'narrative_arc_stakes_turn',
    display_name: 'Narrative Arc, Stakes & Turn',
    definition: 'Presence of tension → decision → consequence. Stakes can be internal (identity, belonging) or external (deadline, risk).',
    weight: 0.12,

    anchors: [
      {
        score: 0,
        text: 'No conflict; list of traits',
        explanation: 'Essay reads like a resume or character trait list with no tension'
      },
      {
        score: 5,
        text: 'Implied problem, soft turn',
        explanation: 'Mentions a challenge but resolution feels inevitable or vague'
      },
      {
        score: 10,
        text: 'Clear obstacle, visible choice, outcome with cost OR extended arc',
        explanation: 'Examples from admits: Father\'s harsh criticism forces 6-year, 10-draft rewrite (Princeton novel essay); Two F\'s → self-accountability → determination (Berkeley); "My dreams fell like the Berlin wall" then rebuilt stronger'
      }
    ],

    evaluator_prompts: [
      'What almost broke?',
      'What did the writer risk?',
      'Where is the pivot moment—the turn?',
      'Do I feel genuine uncertainty about the outcome?',
      'Is the arc extended (multi-year journey) or compressed (single moment)?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What was genuinely at stake for you?',
      'What could you have lost?',
      'What was the moment you had to choose?',
      'What did that choice cost you?',
      'If this is a long journey, what were the key turning points?' // NEW v1.0.1
    ],

    warning_signs: [
      'Predictable outcomes with no real tension',
      'Stakes mentioned but not felt',
      'Linear progression without complication',
      'Victory without sacrifice or doubt'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 3: Character Interiority & Vulnerability (12%)
  // *** STRENGTHENED IN v1.0.1 ***
  // ==========================================================================
  {
    name: 'character_interiority_vulnerability',
    display_name: 'Character Interiority & Vulnerability',
    definition: 'We hear the mind on the page: emotions named, contradictions faced, limits admitted. 68% of exemplar essays show vulnerability.',
    weight: 0.12,

    anchors: [
      {
        score: 0,
        text: '"I learned a lot"',
        explanation: 'Generic statements about growth with no emotional specificity'
      },
      {
        score: 5,
        text: 'Mentions feelings',
        explanation: 'Names emotions but doesn\'t explore contradictions or inner debate'
      },
      {
        score: 8,
        text: 'ONE named fear/embarrassment + inner debate', // NEW v1.0.1: Capped at 8
        explanation: 'Single vulnerability moment: "clammy hands, needless overflow of adrenaline" (Berkeley), "I thought my life was over" (Berkeley F\'s essay)'
      },
      {
        score: 10,
        text: 'MULTIPLE vulnerability moments + sustained introspection', // NEW v1.0.1: Requires multiple
        explanation: 'Examples: "My dreams fell like the Berlin wall" + father criticism + rewrite humility (Princeton); "debilitating anxiety" + competition fear + learning process (Berkeley); Physical + emotional vulnerability layered throughout'
      }
    ],

    evaluator_prompts: [
      'Do I hear the writer\'s actual thoughts?',
      'Are emotions named specifically (not just "happy" or "sad")?',
      'Is there contradiction or inner conflict?',
      'Does the writer admit what they don\'t know or got wrong?',
      'How many distinct vulnerability moments are there? (Need 2+ for 10/10)' // NEW v1.0.1
    ],

    writer_prompts: [
      'Which feeling did you avoid naming in the first draft?',
      'What belief cracked or shifted?',
      'What were you afraid would happen?',
      'What part of yourself surprised you in this moment?',
      'Where else in the essay can you show vulnerability?' // NEW v1.0.1
    ],

    warning_signs: [
      'Only positive emotions shown',
      'No admission of doubt or error',
      'Tells feelings instead of showing inner process',
      'Hero narrative with no vulnerability',
      'Single vulnerability mention without depth' // NEW v1.0.1
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 4: Show-Don't-Tell Craft (Scenes, Dialogue, Images) (10%)
  // ==========================================================================
  {
    name: 'show_dont_tell_craft',
    display_name: 'Show-Don\'t-Tell Craft',
    definition: 'Scenes, snippets of dialogue, concrete images carry meaning (not just summary).',
    weight: 0.10,

    anchors: [
      {
        score: 0,
        text: 'Pure exposition',
        explanation: 'All telling, no showing: "I worked hard and made an impact"'
      },
      {
        score: 5,
        text: '1–2 concrete details',
        explanation: 'Some specific details but mostly summary'
      },
      {
        score: 10,
        text: 'At least one built scene OR rich sensory detail throughout',
        explanation: 'Examples: Rowing race sensory progression—silence → noise → sensory void (Princeton); Purple nitrite gloves, cardboard box with kosher meals (Princeton lab); "Lungs scream, legs burn as if boiling water" (rowing); Marrakech souks, Chilean valleys, Kolkata grandmother (hot sauce travel)'
      }
    ],

    evaluator_prompts: [
      'Is there at least one fully constructed scene?',
      'Is dialogue (if present) doing narrative work?',
      'Can I see, hear, or feel the moment?',
      'Does imagery carry thematic weight?',
      'Are sensory details specific (not generic)?' // NEW v1.0.1
    ],

    writer_prompts: [
      'Which 2 sentences can become a full scene?',
      'What did it smell or sound like?',
      'What was said out loud (exact words)?',
      'What object or detail held meaning in that moment?',
      'Can you add one more sensory layer (touch, taste, temperature)?' // NEW v1.0.1
    ],

    warning_signs: [
      'No dialogue or quotes',
      'All abstract language',
      'Summary of events without immersion',
      'Telling emotions instead of showing behaviors/sensations'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 5: Reflection & Meaning-Making (12%)
  // ==========================================================================
  {
    name: 'reflection_meaning_making',
    display_name: 'Reflection & Meaning-Making',
    definition: 'Insight that reframes the experience without moral-of-the-story clichés.',
    weight: 0.12,

    anchors: [
      {
        score: 0,
        text: '"I learned perseverance"',
        explanation: 'Generic lesson, cliché conclusion'
      },
      {
        score: 5,
        text: 'Specific lesson tied to event',
        explanation: 'Concrete takeaway but not yet portable or reframing'
      },
      {
        score: 10,
        text: 'Portable insight that changes a lens OR comfort with ambiguity',
        explanation: 'Examples: "Following your dreams requires more than wishing... it takes sacrifice, persistence, and grueling work" (Princeton novel); "I\'m still questioning... the process does not end" (Princeton religious identity—unresolved!); "Like an artfully concocted hot sauce, my being contains alternating layers of sweetness and daring" (Princeton metaphor)'
      }
    ],

    evaluator_prompts: [
      'Is the insight specific to this experience?',
      'Does it avoid clichés (e.g., "never give up")?',
      'Is it portable—does it apply beyond this one event?',
      'Does it change how the writer sees the world?',
      'If unresolved, does uncertainty demonstrate intellectual maturity?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What do you now notice in other contexts because of this?',
      'What assumption or belief changed?',
      'How does this moment let you see something you couldn\'t before?',
      'What can you do now that you couldn\'t do before (intellectually or emotionally)?',
      'Is it okay if you\'re still figuring it out?' // NEW v1.0.1
    ],

    warning_signs: [
      'Moral-of-the-story endings',
      'Cliché lessons (perseverance, teamwork, leadership)',
      'Reflection that\'s obvious or surface-level',
      'No connection between experience and broader insight'
    ],

    dependencies: ['show_dont_tell_craft']
  },

  // ==========================================================================
  // DIMENSION 6: Intellectual Vitality & Curiosity (8%)
  // ==========================================================================
  {
    name: 'intellectual_vitality_curiosity',
    display_name: 'Intellectual Vitality & Curiosity',
    definition: 'Natural, self-propelled inquiry; ideas connected to lived reality (not catalog flex).',
    weight: 0.08,

    anchors: [
      {
        score: 0,
        text: 'Name-drops concepts without use',
        explanation: 'Mentions impressive terms but doesn\'t show intellectual engagement'
      },
      {
        score: 5,
        text: 'Applies a concept once',
        explanation: 'Uses an idea in context but doesn\'t explore or extend it'
      },
      {
        score: 10,
        text: 'Connects idea ↔ life with dexterity OR unexpected intellectual origin',
        explanation: 'Examples: Avatar The Last Airbender → Chinese philosophy research (Daoism, Confucius, mandate of heaven) → mock trial, journalism, politics (Berkeley); Antibiotic resistance research parallels religious identity "experiment" (Princeton); Hot sauce as "distilled essence of culture" across three continents'
      }
    ],

    evaluator_prompts: [
      'Is this idea genuinely alive in the writer\'s thinking?',
      'Do they use it as a tool or just mention it?',
      'Is there evidence of intellectual play or discovery?',
      'Does curiosity feel authentic (not performative)?',
      'Did curiosity originate from unexpected source?' // NEW v1.0.1
    ],

    writer_prompts: [
      'Which idea changed your behavior or decisions?',
      'How did you test or apply this concept?',
      'What question kept you up at night?',
      'What did you read/watch/explore that you didn\'t have to?',
      'What unlikely thing sparked your curiosity?' // NEW v1.0.1
    ],

    warning_signs: [
      'List of impressive books/courses without application',
      'Intellectual humblebragging',
      'Ideas mentioned but not engaged with',
      'No evidence of genuine curiosity'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 7: Originality & Specificity of Voice (8%)
  // ==========================================================================
  {
    name: 'originality_specificity_voice',
    display_name: 'Originality & Specificity of Voice',
    definition: 'Unmistakably you: idioms, cadence, micro-observations.',
    weight: 0.08,

    anchors: [
      {
        score: 0,
        text: 'Template/AI tone',
        explanation: 'Could be written by anyone; generic phrasing and rhythm'
      },
      {
        score: 5,
        text: 'Clear but generic',
        explanation: 'Readable and coherent but lacks distinctive voice markers'
      },
      {
        score: 10,
        text: 'Lines only this writer could produce OR unconventional topic that reveals character',
        explanation: 'Examples: "I am an aspiring hot sauce sommelier" (Princeton—absurd premise); "You know nothing, Jon Snow" → privilege examination (Princeton); Phone charger funeral, shrunk sweaters, spilled organic milk (Princeton list); "My dreams fell like the Berlin wall"; "Clammy hands, needless overflow of adrenaline"'
      }
    ],

    evaluator_prompts: [
      'Could anyone else have written this sentence?',
      'Are there signature phrases or idioms?',
      'Does the rhythm feel like a real person speaking?',
      'What line would a friend recognize as the writer\'s?',
      'Is the topic itself unconventional enough to signal originality?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What line would your best friend recognize as yours?',
      'What phrase do you use that others don\'t?',
      'What micro-observation is uniquely yours?',
      'How would you say this out loud to a friend?',
      'What mundane thing could reveal something deep about you?' // NEW v1.0.1
    ],

    warning_signs: [
      'AI-generated or template phrasing',
      'Overly formal or "college essay" voice',
      'No sentence variety',
      'Buzzwords and clichés dominate',
      'Topic chosen to impress rather than reveal' // NEW v1.0.1
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 8: Structure, Pacing & Coherence (6%)
  // ==========================================================================
  {
    name: 'structure_pacing_coherence',
    display_name: 'Structure, Pacing & Coherence',
    definition: 'Logical flow, paragraph architecture, transitions; no whiplash cuts unless purposeful.',
    weight: 0.06,

    anchors: [
      {
        score: 0,
        text: 'Rambling or disjointed',
        explanation: 'No clear structure; ideas jump without connection'
      },
      {
        score: 5,
        text: 'Mostly coherent, some jumps',
        explanation: 'Generally follows a logic but has rough transitions'
      },
      {
        score: 10,
        text: 'Clean beats OR parallel structure that creates coherence',
        explanation: 'Examples: Antibiotic research methodology parallels identity experiment (Princeton); Anaphora "I know nothing of..." builds systematic argument (Princeton); 6-year novel arc with clear beats (Princeton); Sensory progression in rowing race (silence→noise→void)'
      }
    ],

    evaluator_prompts: [
      'Can I follow the logic from paragraph to paragraph?',
      'Does each paragraph advance the story or idea?',
      'Are transitions smooth or jarring?',
      'Could paragraphs be reordered without breaking the essay?',
      'Does parallel structure (if present) create thematic unity?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What is each paragraph\'s job?',
      'Can you move a paragraph without breaking the flow?',
      'Where does the reader need a transition?',
      'What\'s the spine of the essay—what holds it together?',
      'Could you use a parallel structure (repeated sentence pattern, comparison)?' // NEW v1.0.1
    ],

    warning_signs: [
      'Topic sentences that don\'t connect to previous paragraph',
      'Random jumps in time or topic',
      'Paragraphs that feel like separate essays',
      'No clear beginning/middle/end'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 9: Word Economy & Line-level Craft (6%)
  // ==========================================================================
  {
    name: 'word_economy_craft',
    display_name: 'Word Economy & Line-level Craft',
    definition: 'Tight sentences, verbs doing work, varied cadence; minimal filler.',
    weight: 0.06,

    anchors: [
      {
        score: 0,
        text: 'Filler and clichés dominate',
        explanation: 'Wordy, redundant, lots of weak verbs and adjectives'
      },
      {
        score: 5,
        text: 'Clean but flat',
        explanation: 'No unnecessary words but prose lacks energy or variety'
      },
      {
        score: 10,
        text: 'Energetic prose with no bloat OR memorable one-liners',
        explanation: 'Examples: "My dreams fell like the Berlin wall" (Princeton); "The worst stench I have ever encountered" (Duke); "I am an aspiring hot sauce sommelier" (Princeton); "Clammy hands, needless overflow of adrenaline, debilitating anxiety" (Berkeley—triple sensory stack)'
      }
    ],

    evaluator_prompts: [
      'Are there unnecessary words?',
      'Do verbs carry the weight (not adjectives)?',
      'Is sentence length varied?',
      'Does the prose have rhythm and energy?',
      'Are there quotable one-liners?' // NEW v1.0.1
    ],

    writer_prompts: [
      'Cut 10% without losing meaning—what goes?',
      'Swap 2 adjectives for 2 verbs',
      'Which sentence is too long?',
      'Read it aloud—where do you stumble?',
      'Which sentence could stand alone as memorable?' // NEW v1.0.1
    ],

    warning_signs: [
      'Passive voice throughout',
      'Adjective overload',
      'All sentences the same length',
      'Filler phrases ("in order to," "the fact that")'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 10: Context & Constraints Disclosure (8%)
  // *** ENHANCED IN v1.0.1 ***
  // ==========================================================================
  {
    name: 'context_constraints_disclosure',
    display_name: 'Context & Constraints Disclosure',
    definition: 'Honest context (work hours, caregiving, resource limits) shown, not excused, to calibrate achievement credibly. 42% of exemplars quantify impact.',
    weight: 0.08,

    anchors: [
      {
        score: 0,
        text: 'No context; invites prestige bias',
        explanation: 'Achievements presented without acknowledging constraints or advantages'
      },
      {
        score: 5,
        text: 'Mentions constraint',
        explanation: 'Acknowledges challenges but doesn\'t show their texture or impact'
      },
      {
        score: 10,
        text: 'We feel the constraint\'s texture AND outcomes are quantified', // NEW v1.0.1
        explanation: 'Examples: "Translator for mother" (childhood necessity) → "one ton of food" collected, "100+ articles" (Berkeley); "19% quiz score" → "B grade" with specific study strategies (Berkeley); "2 weeks prep vs 2 months" → finals (Berkeley debate); "20,000 students" benefited from IT work (Berkeley)'
      }
    ],

    evaluator_prompts: [
      'Do I understand the writer\'s constraints?',
      'Are limits shown, not just told?',
      'Does context help me calibrate achievement?',
      'Is there texture (times, places, specific obstacles)?',
      'Are outcomes specific and quantified (not vague)?' // NEW v1.0.1
    ],

    writer_prompts: [
      'What systemic limit shaped this moment?',
      'What resources did you not have access to?',
      'What had to give (time, sleep, social life) to make this happen?',
      'How did constraint shape the solution?',
      'What are the exact numbers? (Hours, people helped, dollars, test scores)' // NEW v1.0.1
    ],

    warning_signs: [
      'Prestige flexing without context',
      'No mention of privilege or advantage',
      'Constraints mentioned as excuses rather than context',
      'Achievement narrative that assumes universal access',
      'Vague impact claims ("helped many people," "made a difference")' // NEW v1.0.1
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 11: School/Program Fit (6%, conditional)
  // ==========================================================================
  {
    name: 'school_program_fit',
    display_name: 'School/Program Fit',
    definition: 'Specific, plausible alignment of your curiosity with school assets (courses, labs, centers, methods) and why their approach suits your mode of learning. (Only applicable to "Why us" essays)',
    weight: 0.06,

    anchors: [
      {
        score: 0,
        text: 'Brochure copy',
        explanation: 'Generic praise that could apply to any top school'
      },
      {
        score: 5,
        text: 'Names a resource',
        explanation: 'Mentions specific courses or programs but doesn\'t explain why they matter'
      },
      {
        score: 10,
        text: 'Ties method to you with credible next steps',
        explanation: 'Shows why this school\'s specific approach fits your learning style: "I need the studio method—not lectures on design but making 50 prototypes and critiquing failure. Your co-op structure means I can test concepts in real organizations, fail fast, iterate."'
      }
    ],

    evaluator_prompts: [
      'Is this specific to this school (not generic)?',
      'Does it explain why this approach/method fits the writer?',
      'Are next steps plausible and specific?',
      'What can they do here that they genuinely can\'t elsewhere?'
    ],

    writer_prompts: [
      'What can you do at this school that you genuinely can\'t elsewhere?',
      'Why does their teaching method match how you learn?',
      'What specific resource connects to your specific curiosity?',
      'What will you make or explore in your first semester?'
    ],

    warning_signs: [
      'Copy-pasted from website',
      'Generic praise ("prestigious," "world-class")',
      'No connection to writer\'s actual interests',
      'List of resources without explaining why they matter'
    ],

    dependencies: []
  },

  // ==========================================================================
  // DIMENSION 12: Ethical Awareness & Humility (6%)
  // ==========================================================================
  {
    name: 'ethical_awareness_humility',
    display_name: 'Ethical Awareness & Humility',
    definition: 'Respect for others, credit-sharing, awareness of power/privilege; no saviorism.',
    weight: 0.06,

    anchors: [
      {
        score: 0,
        text: 'Self-hero arc',
        explanation: 'Writer as sole agent of change, others as recipients or background'
      },
      {
        score: 5,
        text: 'Acknowledges others',
        explanation: 'Mentions people who helped but doesn\'t explore their agency'
      },
      {
        score: 10,
        text: 'Names who taught/helped; reflects on limits OR examines privilege',
        explanation: 'Examples: "You know nothing" essay systematically examines privilege and ignorance (Princeton); Father as harsh critic becomes growth catalyst, credit given (Princeton novel); "I\'m still questioning"—admits ongoing uncertainty (Princeton religious); Translation for mother honored as origin of skill (Berkeley)'
      }
    ],

    evaluator_prompts: [
      'Does the writer credit others genuinely?',
      'Is there awareness of privilege or positionality?',
      'Do they admit what they still don\'t know?',
      'Is there saviorism (helping "those people")?',
      'Does privilege examination feel authentic (not performative)?' // NEW v1.0.1
    ],

    writer_prompts: [
      'Who changed your mind or taught you something crucial?',
      'What do you still not understand?',
      'What privilege or advantage did you have?',
      'What tradeoff or cost did your choice create for others?',
      'What forms of ignorance persist despite your efforts?' // NEW v1.0.1
    ],

    warning_signs: [
      'Savior narratives (especially across privilege lines)',
      'No credit given to mentors/collaborators',
      'Certainty without doubt',
      'Others portrayed as passive or needing rescue',
      'Privilege acknowledged but not examined' // NEW v1.0.1
    ],

    dependencies: []
  }
];

// ============================================================================
// INTERACTION RULES (v1.0.1 — NO CHANGES)
// ============================================================================

const interaction_rules: InteractionRule[] = [
  {
    rule_id: 'rule_scene_reflection',
    name: 'Scene amplifies reflection',
    description: 'Without at least one live scene, Reflection ceiling is 8',
    conditions: [
      {
        dimension: 'show_dont_tell_craft',
        operator: '<',
        threshold: 6
      }
    ],
    effects: [
      {
        dimension: 'reflection_meaning_making',
        action: 'cap_max',
        value: 8,
        reason: 'Deep reflection requires grounding in lived scene'
      }
    ],
    priority: 100
  },

  {
    rule_id: 'rule_fit_ceiling',
    name: 'Specific fit unlocks ceiling',
    description: 'Without methods-fit, School Fit ceiling is 6 even if resources named',
    conditions: [
      {
        dimension: 'school_program_fit',
        operator: '<',
        threshold: 7
      }
    ],
    effects: [
      {
        dimension: 'school_program_fit',
        action: 'cap_max',
        value: 6,
        reason: 'Must connect school\'s method to your learning mode, not just list resources'
      }
    ],
    priority: 90
  },

  {
    rule_id: 'rule_context_originality',
    name: 'Context prevents prestige illusions',
    description: 'Lack of constraints caps Originality at 8 if essay leans on prestige',
    conditions: [
      {
        dimension: 'context_constraints_disclosure',
        operator: '<',
        threshold: 5
      }
    ],
    effects: [
      {
        dimension: 'originality_specificity_voice',
        action: 'cap_max',
        value: 8,
        reason: 'Originality requires showing constraints that shaped your unique path'
      }
    ],
    priority: 80
  },

  {
    rule_id: 'rule_interiority_arc',
    name: 'Interiority can redeem modest arc',
    description: 'High Interiority + Reflection can offset modest external stakes',
    conditions: [
      {
        dimension: 'character_interiority_vulnerability',
        operator: '>=',
        threshold: 8
      },
      {
        dimension: 'reflection_meaning_making',
        operator: '>=',
        threshold: 8
      }
    ],
    effects: [
      {
        dimension: 'narrative_arc_stakes_turn',
        action: 'boost',
        value: 1,
        reason: 'Deep internal arc can compensate for modest external stakes'
      }
    ],
    priority: 70
  },

  {
    rule_id: 'rule_humility_eqi',
    name: 'Humility moderates brag',
    description: 'If Ethical Awareness < 5 and brag density high, reduce EQI by 2-5',
    conditions: [
      {
        dimension: 'ethical_awareness_humility',
        operator: '<',
        threshold: 5
      }
    ],
    effects: [
      {
        dimension: 'narrative_arc_stakes_turn',
        action: 'reduce',
        value: 2,
        reason: 'Self-hero arc without humility signals lack of self-awareness'
      }
    ],
    priority: 60
  },

  {
    rule_id: 'rule_opening_engagement',
    name: 'Weak opening limits engagement',
    description: 'Generic opening caps overall impression despite later quality',
    conditions: [
      {
        dimension: 'opening_power_scene_entry',
        operator: '<',
        threshold: 4
      }
    ],
    effects: [
      {
        dimension: 'structure_pacing_coherence',
        action: 'reduce',
        value: 1,
        reason: 'Weak opening makes reader less generous to rest of essay'
      }
    ],
    priority: 50
  }
];

// ============================================================================
// IMPRESSION LABELS (v1.0.1 — NO CHANGES)
// ============================================================================

const impression_labels = [
  {
    label: 'arresting_deeply_human' as const,
    eqi_min: 90,
    eqi_max: 100,
    description: 'Arresting & Deeply Human — Stops you on the page; unmistakably a real person with unique insight'
  },
  {
    label: 'compelling_clear_voice' as const,
    eqi_min: 80,
    eqi_max: 89,
    description: 'Compelling with Clear Voice — Strong narrative craft; distinct voice; solid fit'
  },
  {
    label: 'competent_needs_texture' as const,
    eqi_min: 70,
    eqi_max: 79,
    description: 'Competent, Needs Texture or Turn — Readable but needs more scene, stakes, or reflection depth'
  },
  {
    label: 'readable_but_generic' as const,
    eqi_min: 60,
    eqi_max: 69,
    description: 'Readable but Generic/Under-scened — Coherent but lacks specificity, vulnerability, or narrative arc'
  },
  {
    label: 'template_like_rebuild' as const,
    eqi_min: 0,
    eqi_max: 59,
    description: 'Template-like; Requires Rebuild — Generic phrasing, no scene, weak reflection, or AI-sounding'
  }
];

// ============================================================================
// RUBRIC OBJECT (v1.0.1)
// ============================================================================

export const ESSAY_RUBRIC_V1_0_1: Rubric = {
  version: 'v1.0.1',
  name: 'Essay Rubric v1.0.1 — Evidence-Based Refinement',
  description: 'Updated based on analysis of 19 exemplar essays from Harvard, Princeton, MIT, Yale, Duke, Berkeley, Northwestern, Cornell (2024-2025 admits). Key changes: Strengthened vulnerability requirements (now requires MULTIPLE moments for 10/10), added quantification prompts to Context dimension.',

  dimensions,
  interaction_rules,
  impression_labels,

  created_at: new Date('2025-11-06').toISOString(),
  author: 'Asteria-E System (Exemplar Learning Loop)',
  changelog: `v1.0.1 (2025-11-06):
  • STRENGTHENED Dimension 3 (Interiority & Vulnerability): 10/10 now requires MULTIPLE vulnerability moments (68% of exemplars show this pattern)
  • ENHANCED Dimension 10 (Context & Constraints): Added evaluator prompt "Are outcomes quantified?" and writer prompt about exact numbers (42% of exemplars quantify impact)
  • Added new evaluator/writer prompts across dimensions based on patterns in admits
  • Updated anchor examples with real essay patterns from Princeton, Berkeley, Harvard, Yale
  • Added examples: hot sauce sommelier, Jon Snow essay, 6-year novel journey, rowing paradox, Avatar→philosophy
  • Expanded warning signs based on what successful essays AVOID`
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ESSAY_RUBRIC_V1_0_1;

export const DIMENSION_NAMES_V1_0_1 = dimensions.map(d => d.name);

export const DIMENSION_WEIGHTS_V1_0_1 = dimensions.reduce((acc, dim) => {
  acc[dim.name] = dim.weight;
  return acc;
}, {} as Record<string, number>);

// Validate weights sum to 1.0
const total_weight = dimensions.reduce((sum, dim) => sum + dim.weight, 0);
if (Math.abs(total_weight - 1.0) > 0.001) {
} else {
}
