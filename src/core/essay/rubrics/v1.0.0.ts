/**
 * Essay Rubric v1.0.0
 *
 * Scene-aware, literature-grade rubric for college application essays.
 * 12 dimensions with interaction rules, dependency caps, and human-aligned scoring.
 *
 * This rubric is designed specifically for essays (Personal Statement, UC PIQs,
 * supplements) and is fundamentally different from the extracurricular rubric.
 *
 * Key Features:
 * - Scene construction, interiority, and thematic coherence
 * - Interaction rules (e.g., no scene → reflection capped at 8)
 * - School-fit awareness (for "Why us" essays)
 * - Context-aware (constraints disclosure prevents prestige illusions)
 */

import { Rubric, RubricDimensionDefinition, InteractionRule } from "../types/rubric";

// ============================================================================
// RUBRIC DIMENSIONS
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
        text: 'Scene on page one',
        explanation: 'Drops into a specific moment with sensory detail: "The IV beeped like a metronome as I counted mom\'s breaths—four, hold, four."'
      }
    ],

    evaluator_prompts: [
      'Is there a scene or specific claim within first 2 sentences?',
      'Does it force curiosity?',
      'Can I visualize the moment or feel the urgency?'
    ],

    writer_prompts: [
      'What exact second are we in?',
      'What\'s on the table, wall, or phone screen?',
      'What sound, smell, or texture anchors this moment?'
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
        text: 'Clear obstacle, visible choice, outcome with cost',
        explanation: 'We see what was at stake, the decision point, and real consequences: "If I stayed silent, I\'d keep the team. If I spoke up, I\'d lose them—and maybe be right."'
      }
    ],

    evaluator_prompts: [
      'What almost broke?',
      'What did the writer risk?',
      'Where is the pivot moment—the turn?',
      'Do I feel genuine uncertainty about the outcome?'
    ],

    writer_prompts: [
      'What was genuinely at stake for you?',
      'What could you have lost?',
      'What was the moment you had to choose?',
      'What did that choice cost you?'
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
  // ==========================================================================
  {
    name: 'character_interiority_vulnerability',
    display_name: 'Character Interiority & Vulnerability',
    definition: 'We hear the mind on the page: emotions named, contradictions faced, limits admitted.',
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
        score: 10,
        text: 'Named fear/embarrassment + inner debate',
        explanation: 'Shows real vulnerability and internal conflict: "If I raise my hand, they\'ll hear my accent again. But if I don\'t, this whole equation stays wrong."'
      }
    ],

    evaluator_prompts: [
      'Do I hear the writer\'s actual thoughts?',
      'Are emotions named specifically (not just "happy" or "sad")?',
      'Is there contradiction or inner conflict?',
      'Does the writer admit what they don\'t know or got wrong?'
    ],

    writer_prompts: [
      'Which feeling did you avoid naming in the first draft?',
      'What belief cracked or shifted?',
      'What were you afraid would happen?',
      'What part of yourself surprised you in this moment?'
    ],

    warning_signs: [
      'Only positive emotions shown',
      'No admission of doubt or error',
      'Tells feelings instead of showing inner process',
      'Hero narrative with no vulnerability'
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
        text: 'At least one built scene',
        explanation: 'Full scene with setting + action + sensory detail, or purposeful dialogue: "She looked at the grant proposal, then at me. \'This budget line—it\'s all food?\' I nodded. \'They\'re hungry every day.\'"'
      }
    ],

    evaluator_prompts: [
      'Is there at least one fully constructed scene?',
      'Is dialogue (if present) doing narrative work?',
      'Can I see, hear, or feel the moment?',
      'Does imagery carry thematic weight?'
    ],

    writer_prompts: [
      'Which 2 sentences can become a full scene?',
      'What did it smell or sound like?',
      'What was said out loud (exact words)?',
      'What object or detail held meaning in that moment?'
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
        text: 'Portable insight that changes a lens',
        explanation: 'Reframes not just the event but how the writer sees other contexts: "Silence wasn\'t agreement; it was survival. Now I listen for what people aren\'t saying."'
      }
    ],

    evaluator_prompts: [
      'Is the insight specific to this experience?',
      'Does it avoid clichés (e.g., "never give up")?',
      'Is it portable—does it apply beyond this one event?',
      'Does it change how the writer sees the world?'
    ],

    writer_prompts: [
      'What do you now notice in other contexts because of this?',
      'What assumption or belief changed?',
      'How does this moment let you see something you couldn\'t before?',
      'What can you do now that you couldn\'t do before (intellectually or emotionally)?'
    ],

    warning_signs: [
      'Moral-of-the-story endings',
      'Cliché lessons (perseverance, teamwork, leadership)',
      'Reflection that\'s obvious or surface-level',
      'No connection between experience and broader insight'
    ],

    dependencies: ['show_dont_tell_craft'] // Hard to reflect deeply without grounding in scene
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
        text: 'Connects idea ↔ life with dexterity',
        explanation: 'Shows genuine intellectual play: "I started seeing my family\'s budget decisions through a game theory lens—every choice a Nash equilibrium of need and pride."'
      }
    ],

    evaluator_prompts: [
      'Is this idea genuinely alive in the writer\'s thinking?',
      'Do they use it as a tool or just mention it?',
      'Is there evidence of intellectual play or discovery?',
      'Does curiosity feel authentic (not performative)?'
    ],

    writer_prompts: [
      'Which idea changed your behavior or decisions?',
      'How did you test or apply this concept?',
      'What question kept you up at night?',
      'What did you read/watch/explore that you didn\'t have to?'
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
        text: 'Lines only this writer could produce',
        explanation: 'Unique phrasing, rhythm, or observations: "My abuela counts time in novelas—antes de la boda, después del accidente."'
      }
    ],

    evaluator_prompts: [
      'Could anyone else have written this sentence?',
      'Are there signature phrases or idioms?',
      'Does the rhythm feel like a real person speaking?',
      'What line would a friend recognize as the writer\'s?'
    ],

    writer_prompts: [
      'What line would your best friend recognize as yours?',
      'What phrase do you use that others don\'t?',
      'What micro-observation is uniquely yours?',
      'How would you say this out loud to a friend?'
    ],

    warning_signs: [
      'AI-generated or template phrasing',
      'Overly formal or "college essay" voice',
      'No sentence variety',
      'Buzzwords and clichés dominate'
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
        text: 'Clean beats; each paragraph advances the arc',
        explanation: 'Tight structure where each paragraph has a clear role and transitions are seamless'
      }
    ],

    evaluator_prompts: [
      'Can I follow the logic from paragraph to paragraph?',
      'Does each paragraph advance the story or idea?',
      'Are transitions smooth or jarring?',
      'Could paragraphs be reordered without breaking the essay?'
    ],

    writer_prompts: [
      'What is each paragraph\'s job?',
      'Can you move a paragraph without breaking the flow?',
      'Where does the reader need a transition?',
      'What\'s the spine of the essay—what holds it together?'
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
        text: 'Energetic prose with no bloat',
        explanation: 'Every word earns its place; strong verbs, varied sentence length, musical rhythm'
      }
    ],

    evaluator_prompts: [
      'Are there unnecessary words?',
      'Do verbs carry the weight (not adjectives)?',
      'Is sentence length varied?',
      'Does the prose have rhythm and energy?'
    ],

    writer_prompts: [
      'Cut 10% without losing meaning—what goes?',
      'Swap 2 adjectives for 2 verbs',
      'Which sentence is too long?',
      'Read it aloud—where do you stumble?'
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
  // ==========================================================================
  {
    name: 'context_constraints_disclosure',
    display_name: 'Context & Constraints Disclosure',
    definition: 'Honest context (work hours, caregiving, resource limits) shown, not excused, to calibrate achievement credibly.',
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
        text: 'We feel the constraint\'s texture',
        explanation: 'Shows systemic limits in concrete detail: "I coded between 6am shifts at the bakery—twenty minutes before the ovens, ten after closing, debugger open on a cracked phone."'
      }
    ],

    evaluator_prompts: [
      'Do I understand the writer\'s constraints?',
      'Are limits shown, not just told?',
      'Does context help me calibrate achievement?',
      'Is there texture (times, places, specific obstacles)?'
    ],

    writer_prompts: [
      'What systemic limit shaped this moment?',
      'What resources did you not have access to?',
      'What had to give (time, sleep, social life) to make this happen?',
      'How did constraint shape the solution?'
    ],

    warning_signs: [
      'Prestige flexing without context',
      'No mention of privilege or advantage',
      'Constraints mentioned as excuses rather than context',
      'Achievement narrative that assumes universal access'
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
        text: 'Names who taught/helped; reflects on limits',
        explanation: 'Credits others, shows awareness of what they still don\'t know: "Mrs. Chen taught me to read code like poetry. But I still don\'t know how to make the UI accessible for screen readers—that\'s my next learn."'
      }
    ],

    evaluator_prompts: [
      'Does the writer credit others genuinely?',
      'Is there awareness of privilege or positionality?',
      'Do they admit what they still don\'t know?',
      'Is there saviorism (helping "those people")?'
    ],

    writer_prompts: [
      'Who changed your mind or taught you something crucial?',
      'What do you still not understand?',
      'What privilege or advantage did you have?',
      'What tradeoff or cost did your choice create for others?'
    ],

    warning_signs: [
      'Savior narratives (especially across privilege lines)',
      'No credit given to mentors/collaborators',
      'Certainty without doubt',
      'Others portrayed as passive or needing rescue'
    ],

    dependencies: []
  }
];

// ============================================================================
// INTERACTION RULES
// ============================================================================

const interaction_rules: InteractionRule[] = [
  // Rule 1: Scene power amplifies reflection
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

  // Rule 2: Specific fit unlocks "Why us" ceiling
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

  // Rule 3: Context disclosure prevents prestige illusions
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

  // Rule 4: Interiority can redeem modest outcomes
  // (This is more of a scoring philosophy than a hard cap—implemented in scorer)
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

  // Rule 5: Humility moderates impact claims
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

  // Rule 6: Opening must earn the read
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
// IMPRESSION LABELS
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
// RUBRIC OBJECT
// ============================================================================

export const ESSAY_RUBRIC_V1: Rubric = {
  version: 'v1.0.0',
  name: 'Essay Rubric v1.0.0 — Scene-Aware, Literature-Grade',
  description: 'Comprehensive rubric for college application essays with 12 dimensions, interaction rules, and human-aligned scoring',

  dimensions,
  interaction_rules,
  impression_labels,

  created_at: new Date('2025-11-05').toISOString(),
  author: 'Asteria-E System',
  changelog: 'Initial release: 12 dimensions covering opening, arc, interiority, craft, reflection, curiosity, voice, structure, economy, context, fit, and ethics'
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ESSAY_RUBRIC_V1;

// Export dimension names as constant array for validation
export const DIMENSION_NAMES = dimensions.map(d => d.name);

// Export weights map
export const DIMENSION_WEIGHTS = dimensions.reduce((acc, dim) => {
  acc[dim.name] = dim.weight;
  return acc;
}, {} as Record<string, number>);

// Validate weights sum to 1.0
const total_weight = dimensions.reduce((sum, dim) => sum + dim.weight, 0);
if (Math.abs(total_weight - 1.0) > 0.001) {
}
