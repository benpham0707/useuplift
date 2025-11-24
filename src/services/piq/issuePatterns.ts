/**
 * PIQ ISSUE PATTERNS
 *
 * Defines specific, detectable issues for each PIQ rubric dimension.
 * Each pattern includes:
 * - Detection conditions
 * - Problem/why-it-matters templates
 * - Fix strategies
 */

import type { PIQIssuePattern, PIQRubricDimension } from './types';

// ============================================================================
// OPENING HOOK QUALITY ISSUES
// ============================================================================

const HOOK_ISSUES: PIQIssuePattern[] = [
  {
    id: 'hook-weak-generic',
    dimension: 'opening_hook_quality',
    title: 'Generic Opening - No Tension',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      keywordPatterns: [
        '^As (president|captain|leader|member) of',
        '^I (have always|always|never) been',
        '^Throughout my (life|time|experience)',
        '^(Many|Some) people',
      ],
      customCheck: 'check_hook_type_basic'
    },
    problemTemplate: 'Your opening starts with a generic statement that doesn\'t create immediate intrigue or tension. Phrases like "As president of..." or "I have always..." are common essay openings that don\'t grab attention.',
    whyMattersTemplate: 'Admissions officers read hundreds of PIQs. Generic openings cause readers to skim rather than engage. You have 3-5 seconds to hook them - a generic opening wastes that critical moment.',
    fixStrategies: [
      {
        technique: 'Start Mid-Action (In Medias Res)',
        description: 'Drop the reader into a specific, tense moment. Start with what you were doing, feeling, or experiencing at a critical point in your story.',
        estimatedImpact: '+2-3 points in Opening Hook'
      },
      {
        technique: 'Physical Vulnerability First',
        description: 'Open with a physical symptom of emotion (hands shaking, threw up, couldn\'t breathe). This creates immediate visceral engagement.',
        estimatedImpact: '+2-4 points in Opening Hook + Vulnerability'
      },
      {
        technique: 'Sensory Immersion',
        description: 'Start with vivid sensory details that place the reader in a specific moment (what you saw, heard, smelled, felt).',
        estimatedImpact: '+1-2 points in Opening Hook'
      }
    ]
  },

  {
    id: 'hook-missing-stakes',
    dimension: 'opening_hook_quality',
    title: 'Hook Missing Stakes',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 7,
      absencePatterns: ['stakes_visible_in_opening'],
      customCheck: 'check_stakes_established'
    },
    problemTemplate: 'While your opening creates some intrigue, it doesn\'t establish WHY this moment matters. The reader doesn\'t yet know what was at risk or why they should care.',
    whyMattersTemplate: 'Without stakes, even interesting moments feel disconnected. Readers need to understand what you stood to gain or lose to emotionally invest in your story.',
    fixStrategies: [
      {
        technique: 'Add "This was my last chance" Stakes',
        description: 'Add one sentence clarifying what was at risk: last opportunity, reputation on the line, relationship threatened, identity questioned, etc.',
        estimatedImpact: '+1-2 points in Opening Hook + Arc'
      },
      {
        technique: 'Show What You\'d Already Lost',
        description: 'Mention previous failures or losses to show this moment had consequences. "I\'d failed twice before" immediately raises stakes.',
        estimatedImpact: '+2-3 points in Opening Hook + Vulnerability'
      }
    ]
  },

  {
    id: 'hook-disconnected-from-body',
    dimension: 'opening_hook_quality',
    title: 'Hook Disconnected from Essay',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 7,
      customCheck: 'check_hook_body_connection'
    },
    problemTemplate: 'Your opening creates interest, but there\'s a jarring shift when transitioning to the essay body. The hook feels like a separate element rather than the organic start of your story.',
    whyMattersTemplate: 'Disconnected hooks break narrative flow and make the essay feel manufactured. The opening should be the natural entry point to your story, not a crafted "attention-grabber" pasted on top.',
    fixStrategies: [
      {
        technique: 'Bridge Sentence',
        description: 'Add 1-2 sentences after your hook that connect the opening moment to the broader story. Show how this moment fits into the larger narrative.',
        estimatedImpact: '+1-2 points in Opening Hook + Arc'
      },
      {
        technique: 'Foreshadowing Integration',
        description: 'Have your hook hint at the transformation or realization that comes later. Create a promise the essay delivers on.',
        estimatedImpact: '+2-3 points in Opening Hook + Arc'
      }
    ]
  },

  {
    id: 'hook-no-sensory-details',
    dimension: 'opening_hook_quality',
    title: 'Opening Lacks Sensory Details',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7.5,
      absencePatterns: ['sensory_details_present'],
      customCheck: 'check_sensory_in_opening'
    },
    problemTemplate: 'Your opening relies on abstract or summary statements rather than sensory, physical details that put the reader in the moment.',
    whyMattersTemplate: 'Sensory details make openings more immersive and memorable. Readers remember what they can "see" and "feel" more than what they\'re told.',
    fixStrategies: [
      {
        technique: 'Add One Sensory Detail',
        description: 'Add what you saw, heard, smelled, or physically felt in that opening moment. Just one vivid detail can transform the engagement.',
        estimatedImpact: '+1 point in Opening Hook + Craft'
      }
    ]
  }
];

// ============================================================================
// VULNERABILITY & AUTHENTICITY ISSUES
// ============================================================================

const VULNERABILITY_ISSUES: PIQIssuePattern[] = [
  {
    id: 'vuln-level-1-minimal',
    dimension: 'vulnerability_authenticity',
    title: 'Minimal Vulnerability - Generic Acknowledgment',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 5,
      keywordPatterns: [
        'this (taught|showed|helped) me',
        'i (learned|realized|discovered) that',
        'through this experience',
        'it was (difficult|hard|challenging) but',
      ],
      customCheck: 'check_vulnerability_level_1'
    },
    problemTemplate: 'Your essay acknowledges challenges in generic terms but doesn\'t show specific failures, physical symptoms of emotion, or genuine psychological vulnerability. Phrases like "it was difficult but I persevered" are defensive rather than revealing.',
    whyMattersTemplate: 'Generic acknowledgments don\'t differentiate you or reveal who you are under pressure. UC admissions looks for specific struggles, real failures, and how you actually processed them - not neat summaries.',
    fixStrategies: [
      {
        technique: 'Name a Specific Failure',
        description: 'Replace "it was difficult" with what actually went wrong. What did you mess up? What mistake did you make? What did you fail at? Be specific.',
        estimatedImpact: '+3-4 points in Vulnerability'
      },
      {
        technique: 'Add Physical Symptoms',
        description: 'Show what fear/shame/stress felt like in your body: hands shaking, couldn\'t sleep, stomach dropped, face flushed, etc.',
        estimatedImpact: '+2-3 points in Vulnerability + Hook'
      },
      {
        technique: 'Reveal Defense Mechanism',
        description: 'Show how you protected yourself (humor to deflect, over-preparing, avoiding certain people). This shows psychological depth.',
        estimatedImpact: '+3-5 points in Vulnerability (world-class move)'
      }
    ]
  },

  {
    id: 'vuln-manufactured-phrases',
    dimension: 'vulnerability_authenticity',
    title: 'Manufactured Vulnerability Phrases',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      keywordPatterns: [
        'vulnerability (is|can be) a strength',
        'asking for help (isn\'t|is not) (a|) weakness',
        'failure (is|can be) an opportunity',
        'growth (comes|happens) from (discomfort|struggle)',
      ],
      customCheck: 'check_manufactured_vulnerability'
    },
    problemTemplate: 'You\'re using phrases that TALK ABOUT vulnerability rather than SHOWING it. Statements like "vulnerability is a strength" or "asking for help isn\'t weakness" are generic lessons, not genuine vulnerability.',
    whyMattersTemplate: 'These phrases signal you\'re protecting yourself from real exposure. They sound like you googled "what to say in college essays" rather than revealing actual struggle. Admissions officers can instantly spot manufactured vulnerability.',
    fixStrategies: [
      {
        technique: 'Delete the Lesson, Show the Moment',
        description: 'Cut the manufactured phrase entirely. Instead, show the specific moment when you asked for help or admitted you were wrong. Let readers infer the lesson.',
        estimatedImpact: '+2-3 points in Vulnerability + Voice'
      },
      {
        technique: 'Reveal What You Actually Thought/Felt',
        description: 'Replace the neat lesson with what you genuinely thought in the moment: "I was terrified they\'d think I was incompetent" is more powerful than "asking for help isn\'t weakness."',
        estimatedImpact: '+3-4 points in Vulnerability'
      }
    ]
  },

  {
    id: 'vuln-defensive-retreat',
    dimension: 'vulnerability_authenticity',
    title: 'Defensive Retreat After Vulnerability',
    severity: 'major',
    triggerConditions: {
      customCheck: 'check_defensive_retreat_pattern'
    },
    problemTemplate: 'You open with vulnerability or struggle but quickly retreat to safety with redemptive language ("but I learned," "this made me stronger," "I\'m grateful for"). This pattern suggests you\'re uncomfortable staying in the discomfort.',
    whyMattersTemplate: 'Defensive retreat undermines your vulnerability. Real growth is messy and ongoing. When you immediately resolve tension with neat lessons, it signals the struggle wasn\'t that deep or you\'re protecting yourself from judgment.',
    fixStrategies: [
      {
        technique: 'Stay in the Complexity',
        description: 'Let the vulnerability breathe. After sharing a failure or struggle, add complexity rather than resolution: "I still don\'t know if..." or "Even now, I wonder..."',
        estimatedImpact: '+2-3 points in Vulnerability'
      },
      {
        technique: 'Replace "But" with "And"',
        description: 'Change "It was hard BUT I grew" to "It was hard AND I\'m still figuring it out." This maintains vulnerability while showing growth.',
        estimatedImpact: '+1-2 points in Vulnerability + Reflection'
      }
    ]
  },

  {
    id: 'vuln-no-specific-failure',
    dimension: 'vulnerability_authenticity',
    title: 'No Specific Failures Shown',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      absencePatterns: ['specific_failure_visible'],
      customCheck: 'check_has_specific_failure'
    },
    problemTemplate: 'You mention challenges or difficulties in general terms, but you don\'t share a specific moment when you failed, messed up, or got it wrong. Without specific failures, the essay feels safe and generic.',
    whyMattersTemplate: 'Specific failures are the price of admission for strong PIQs. They prove authenticity, create stakes, and give you something concrete to reflect on. Generic "challenges" make you forgettable.',
    fixStrategies: [
      {
        technique: 'Pick Your Worst Failure',
        description: 'Choose the most embarrassing, painful failure related to this story. Describe exactly what happened, what you did wrong, and who witnessed it.',
        estimatedImpact: '+3-5 points in Vulnerability + Arc'
      },
      {
        technique: 'Quantify the Failure',
        description: 'Add specific consequences: lost money ($X), people who quit (X members), ranking dropped (from X to Y), etc.',
        estimatedImpact: '+2-3 points in Vulnerability + Specificity'
      }
    ]
  },

  {
    id: 'vuln-transformation-imposed',
    dimension: 'vulnerability_authenticity',
    title: 'Transformation Feels Manufactured',
    severity: 'major',
    triggerConditions: {
      customCheck: 'check_transformation_credibility'
    },
    problemTemplate: 'Your transformation or growth feels too neat, sudden, or externally imposed. Real change is gradual, messy, and requires specific evidence to be credible.',
    whyMattersTemplate: 'Manufactured transformations ("and then I realized...") feel like you\'re writing what you think admissions wants to hear rather than sharing genuine change. This hurts credibility across your entire essay.',
    fixStrategies: [
      {
        technique: 'Show Multiple Attempts',
        description: 'Replace sudden epiphany with 2-3 failed attempts at change before something finally worked. This makes transformation feel earned.',
        estimatedImpact: '+2-3 points in Vulnerability + Arc'
      },
      {
        technique: 'Add Lingering Doubt',
        description: 'Show that even after "growth," you still struggle sometimes. "I still catch myself..." makes transformation more credible.',
        estimatedImpact: '+1-2 points in Vulnerability + Reflection'
      }
    ]
  }
];

// ============================================================================
// NARRATIVE ARC & STAKES ISSUES
// ============================================================================

const ARC_ISSUES: PIQIssuePattern[] = [
  {
    id: 'arc-flat-no-conflict',
    dimension: 'narrative_arc_stakes',
    title: 'Flat Arc - No Conflict or Tension',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 5.5,
      absencePatterns: ['conflict_visible', 'tension_maintained'],
      customCheck: 'check_has_narrative_conflict'
    },
    problemTemplate: 'Your essay reads like a summary of events without narrative tension. There\'s no clear problem, obstacle, or internal conflict driving the story forward.',
    whyMattersTemplate: 'Stories need tension to engage readers. Without conflict, your essay becomes a list of activities rather than a compelling narrative. Admissions officers remember stories with stakes and struggle, not event summaries.',
    fixStrategies: [
      {
        technique: 'Identify the Central Conflict',
        description: 'What was the problem you faced? What obstacle stood in your way? What internal conflict did you struggle with? Make this explicit early in the essay.',
        estimatedImpact: '+3-4 points in Arc'
      },
      {
        technique: 'Show What Could Go Wrong',
        description: 'Add stakes by showing what failure would have meant. What would you lose if things didn\'t work out?',
        estimatedImpact: '+2-3 points in Arc'
      }
    ]
  },

  {
    id: 'arc-unclear-stakes',
    dimension: 'narrative_arc_stakes',
    title: 'Stakes Never Clarified',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      absencePatterns: ['stakes_explicit'],
      customCheck: 'check_stakes_clarity'
    },
    problemTemplate: 'While your essay has activity and events, it never clarifies what was at risk or why the outcome mattered to you. The reader doesn\'t understand why you cared so much.',
    whyMattersTemplate: 'Without clear stakes, readers can\'t emotionally invest in your story. "Why does this matter?" is the question every reader has - you need to answer it explicitly.',
    fixStrategies: [
      {
        technique: 'One-Sentence Stakes Declaration',
        description: 'Add a sentence like "This was my last chance to prove..." or "If I failed, I\'d lose..." Make it crystal clear.',
        estimatedImpact: '+2-3 points in Arc'
      },
      {
        technique: 'Show Previous Consequences',
        description: 'Mention what happened before when stakes were similar. "I\'d already lost X, and now Y was on the line."',
        estimatedImpact: '+2-3 points in Arc + Vulnerability'
      }
    ]
  },

  {
    id: 'arc-no-turning-point',
    dimension: 'narrative_arc_stakes',
    title: 'Missing Turning Point or Moment of Change',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      absencePatterns: ['turning_point_visible'],
      customCheck: 'check_has_turning_point'
    },
    problemTemplate: 'Your essay describes a journey but lacks a specific moment when something shifted. The change feels gradual or implied rather than anchored to a concrete moment.',
    whyMattersTemplate: 'Turning points give essays structure and memorability. A specific moment of realization, decision, or change helps readers follow your growth and makes the transformation more credible.',
    fixStrategies: [
      {
        technique: 'Find the Specific Moment',
        description: 'Identify exactly when things changed: a conversation, a failure that forced new thinking, a question someone asked, etc. Make this moment a mini-scene.',
        estimatedImpact: '+2-3 points in Arc + Craft'
      },
      {
        technique: 'Use "That\'s When I..." Structure',
        description: 'Anchor your turning point with clear language: "That\'s when I realized..." or "In that moment, I understood..." This makes the shift explicit.',
        estimatedImpact: '+1-2 points in Arc'
      }
    ]
  },

  {
    id: 'arc-too-neat-resolved',
    dimension: 'narrative_arc_stakes',
    title: 'Arc Too Neat - Lacks Ongoing Complexity',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      keywordPatterns: [
        'now i (understand|know|realize)',
        'i (will|would) never',
        'i will always remember',
      ],
      customCheck: 'check_resolution_too_neat'
    },
    problemTemplate: 'Your essay wraps up too neatly, suggesting the challenge is completely resolved and you have all the answers now. Real growth is ongoing and complex.',
    whyMattersTemplate: 'Too-neat resolutions feel manufactured and make transformation less credible. Showing ongoing complexity and questions demonstrates maturity and authentic reflection.',
    fixStrategies: [
      {
        technique: 'Add "I Still..." Complexity',
        description: 'After your resolution, add what you\'re still figuring out: "I still struggle with..." or "I\'m still learning to..." This maintains authenticity.',
        estimatedImpact: '+1-2 points in Arc + Reflection'
      }
    ]
  },

  {
    id: 'arc-summary-not-scene',
    dimension: 'narrative_arc_stakes',
    title: 'Summary Instead of Scene',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6,
      customCheck: 'check_summary_vs_scene_ratio'
    },
    problemTemplate: 'Your essay relies heavily on summary ("I did X, then Y, then Z") rather than dropping readers into specific scenes with dialogue, action, and sensory detail.',
    whyMattersTemplate: 'Summary creates distance; scene creates immersion. Admissions officers remember essays that put them IN the moment, not essays that tell them ABOUT moments.',
    fixStrategies: [
      {
        technique: 'Turn One Key Moment into Scene',
        description: 'Pick your most important moment and expand it: What did you see? What did someone say? What did you do? What did you feel? Make it vivid.',
        estimatedImpact: '+2-4 points in Arc + Craft'
      },
      {
        technique: 'Add One Line of Dialogue',
        description: 'Include what someone actually said (or what you said). Dialogue makes scenes feel real and immediate.',
        estimatedImpact: '+1-2 points in Arc + Craft'
      }
    ]
  }
];

// ============================================================================
// SPECIFICITY & EVIDENCE ISSUES
// ============================================================================

const SPECIFICITY_ISSUES: PIQIssuePattern[] = [
  {
    id: 'spec-no-numbers',
    dimension: 'specificity_evidence',
    title: 'Missing Quantified Evidence',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      absencePatterns: ['numbers_present'],
      customCheck: 'check_has_numbers'
    },
    problemTemplate: 'Your essay lacks concrete numbers and quantified evidence. Phrases like "many," "often," "significant," and "a lot" are vague and don\'t build credibility.',
    whyMattersTemplate: 'Numbers prove scale and commitment. "I tutored students" vs "I tutored 12 students across 8 months" - the second creates credibility and helps admissions officers gauge your impact.',
    fixStrategies: [
      {
        technique: 'Add Time Metrics',
        description: 'Specify hours per week, total months/years, or total hours invested. Break down by week, month, and total.',
        estimatedImpact: '+2-3 points in Specificity'
      },
      {
        technique: 'Add Impact Metrics',
        description: 'Quantify outcomes: number of people affected, money raised, percentage improvement, items created, etc.',
        estimatedImpact: '+2-3 points in Specificity'
      },
      {
        technique: 'Add Before/After Metrics',
        description: 'Show growth with numbers: "Started at X, reached Y" or "First attempt: X record, final: Y record"',
        estimatedImpact: '+2-4 points in Specificity + Arc'
      }
    ]
  },

  {
    id: 'spec-vague-descriptions',
    dimension: 'specificity_evidence',
    title: 'Vague Descriptions Without Concrete Details',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      keywordPatterns: [
        'many (people|times|ways)',
        'a lot of',
        'very (important|significant|meaningful)',
        'lots of',
        'various',
        'several',
      ],
      customCheck: 'check_vague_language'
    },
    problemTemplate: 'You\'re using vague qualifiers ("many," "various," "significant") instead of specific details. This makes your essay feel generic and less credible.',
    whyMattersTemplate: 'Vague language signals you either don\'t remember the details or are making things sound bigger than they were. Specific details prove authenticity and create vivid mental images.',
    fixStrategies: [
      {
        technique: 'Replace Each Vague Word',
        description: 'Find every "many," "various," "significant" and replace with exact counts, names, or specific examples.',
        estimatedImpact: '+1-2 points in Specificity + Voice'
      },
      {
        technique: 'Add Proper Nouns',
        description: 'Add names of people, places, organizations, tools, or concepts. Proper nouns instantly increase specificity.',
        estimatedImpact: '+1-2 points in Specificity'
      }
    ]
  },

  {
    id: 'spec-missing-sensory',
    dimension: 'specificity_evidence',
    title: 'Missing Sensory Details',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 7,
      absencePatterns: ['sensory_details_present'],
      customCheck: 'check_sensory_details'
    },
    problemTemplate: 'Your essay lacks sensory information - what you saw, heard, smelled, touched, or tasted. This makes moments feel abstract rather than lived.',
    whyMattersTemplate: 'Sensory details transport readers into your experience. They make essays immersive and memorable. "I was nervous" vs "My hands were shaking, and I could hear my own breathing" - the second is far more powerful.',
    fixStrategies: [
      {
        technique: 'Add Physical Symptoms',
        description: 'Describe what you felt in your body during key moments: hands shaking, stomach churning, face flushing, etc.',
        estimatedImpact: '+2-3 points in Specificity + Vulnerability'
      },
      {
        technique: 'Add Visual Details',
        description: 'Describe what you saw: colors, lighting, specific objects, facial expressions, spatial layout.',
        estimatedImpact: '+1-2 points in Specificity + Craft'
      },
      {
        technique: 'Add Sound Details',
        description: 'What did you hear? Voices, silence, background noise, specific sounds that stick in memory.',
        estimatedImpact: '+1-2 points in Specificity + Craft'
      }
    ]
  },

  {
    id: 'spec-no-time-specificity',
    dimension: 'specificity_evidence',
    title: 'Missing Time Specificity',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      absencePatterns: ['time_details_present'],
      customCheck: 'check_time_specificity'
    },
    problemTemplate: 'You mention events without anchoring them in time. Specific timeframes (dates, durations, sequences) help readers follow your journey.',
    whyMattersTemplate: 'Time details show commitment depth and help structure your narrative. "I volunteered" vs "Every Tuesday 6-9pm for 18 months" - the second proves sustained dedication.',
    fixStrategies: [
      {
        technique: 'Add Exact Times/Dates',
        description: 'Specify when things happened: "Tuesday at 2 AM," "three days before the deadline," "my junior year fall."',
        estimatedImpact: '+1 point in Specificity'
      },
      {
        technique: 'Add Duration Details',
        description: 'Show how long things took: hours, days, weeks, months. This builds credibility.',
        estimatedImpact: '+1 point in Specificity'
      }
    ]
  }
];

// ============================================================================
// VOICE INTEGRITY ISSUES
// ============================================================================

const VOICE_ISSUES: PIQIssuePattern[] = [
  {
    id: 'voice-essay-speak',
    dimension: 'voice_integrity',
    title: 'Essay-Speak Phrases',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      keywordPatterns: [
        'this (taught|showed|helped|allowed) me',
        'through this (experience|opportunity)',
        'i (came to|learned to) (realize|understand)',
        'from this (experience|I learned)',
        'this (experience|opportunity) (allowed|enabled|helped)',
      ],
      customCheck: 'check_essay_speak'
    },
    problemTemplate: 'You\'re using manufactured "college essay voice" phrases that no one says in real life. Phrases like "this taught me that" and "through this experience" signal you\'re writing what you think admissions wants rather than your authentic voice.',
    whyMattersTemplate: 'Essay-speak makes you sound like everyone else. Admissions officers read thousands of essays with identical phrasing. Your authentic voice is your competitive advantage - essay-speak erases it.',
    fixStrategies: [
      {
        technique: 'Delete and Rephrase Naturally',
        description: 'Cut the essay-speak phrase entirely. Rephrase in how you\'d actually tell this story to a friend.',
        estimatedImpact: '+2-3 points in Voice'
      },
      {
        technique: 'Show Instead of State',
        description: 'Instead of "this taught me leadership," show the moment when you learned something through a specific scene.',
        estimatedImpact: '+2-3 points in Voice + Arc'
      }
    ]
  },

  {
    id: 'voice-passive',
    dimension: 'voice_integrity',
    title: 'Excessive Passive Voice',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      keywordPatterns: [
        'was (organized|created|developed|designed|implemented) by',
        'were (chosen|selected|picked)',
        'has been',
        'had been',
      ],
      customCheck: 'check_passive_voice_ratio'
    },
    problemTemplate: 'You\'re using passive voice ("was organized by," "were chosen") which obscures your agency and makes you sound distant from your own story.',
    whyMattersTemplate: 'Passive voice weakens impact and makes it unclear what YOU did vs what happened around you. Active voice puts you at the center of your story and demonstrates ownership.',
    fixStrategies: [
      {
        technique: 'Convert to Active Voice',
        description: 'Change "The event was organized by our team" to "I coordinated our team to organize the event." Put yourself as the subject.',
        estimatedImpact: '+1-2 points in Voice + Role Clarity'
      },
      {
        technique: 'Clarify Your Specific Role',
        description: 'When describing team efforts, specify what YOU personally did within the larger project.',
        estimatedImpact: '+1-2 points in Voice'
      }
    ]
  },

  {
    id: 'voice-vocabulary-showing-off',
    dimension: 'voice_integrity',
    title: 'Vocabulary Showing Off',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      keywordPatterns: [
        'plethora',
        'myriad',
        'multifaceted',
        'paradigm',
        'utilize',
        'endeavor',
        'facilitate',
      ],
      customCheck: 'check_fancy_vocabulary'
    },
    problemTemplate: 'You\'re using unnecessarily complex vocabulary ("plethora," "multifaceted," "paradigm") that makes you sound like you\'re trying to impress rather than communicate.',
    whyMattersTemplate: 'Fancy vocabulary backfires - it signals insecurity and makes your voice less authentic. The strongest essays use simple, precise language. Confidence = clarity.',
    fixStrategies: [
      {
        technique: 'Replace with Simple Language',
        description: 'Change "plethora" to a specific number, "multifaceted" to "different," "utilize" to "use." Simple = powerful.',
        estimatedImpact: '+1-2 points in Voice'
      }
    ]
  },

  {
    id: 'voice-sounds-like-ai',
    dimension: 'voice_integrity',
    title: 'Sounds Like AI/ChatGPT',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      keywordPatterns: [
        'delve into',
        'it is important to note',
        'in conclusion',
        'in summary',
        'furthermore',
        'moreover',
        'it should be noted',
      ],
      customCheck: 'check_ai_patterns'
    },
    problemTemplate: 'Your essay has phrases commonly generated by AI ("delve into," "it is important to note," "furthermore"). Whether AI-written or not, this damages authenticity.',
    whyMattersTemplate: 'Admissions officers are trained to spot AI writing. Even if you wrote it yourself, AI-like phrasing raises red flags and makes them question authenticity of your entire application.',
    fixStrategies: [
      {
        technique: 'Delete Formal Transitions',
        description: 'Cut "furthermore," "moreover," "in conclusion" entirely. Your essay should flow naturally without formal transitions.',
        estimatedImpact: '+2-3 points in Voice'
      },
      {
        technique: 'Read Aloud Test',
        description: 'Read your essay aloud. If a sentence sounds like something you\'d never say, rewrite it.',
        estimatedImpact: '+1-2 points in Voice'
      }
    ]
  },

  {
    id: 'voice-monotone-rhythm',
    dimension: 'voice_integrity',
    title: 'Monotone Sentence Rhythm',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      customCheck: 'check_sentence_rhythm_variety'
    },
    problemTemplate: 'Your sentences follow a repetitive pattern in length and structure. This creates a monotone rhythm that feels robotic.',
    whyMattersTemplate: 'Varied rhythm keeps readers engaged. Mixing short punchy sentences with longer complex ones creates musicality and emphasizes key moments.',
    fixStrategies: [
      {
        technique: 'Add Short Sentences for Emphasis',
        description: 'After a long sentence, add a 3-5 word sentence. "I threw up. My hands shook. This was it."',
        estimatedImpact: '+1-2 points in Voice + Craft'
      },
      {
        technique: 'Vary Sentence Openings',
        description: 'Don\'t start every sentence with "I." Use different structures to create variety.',
        estimatedImpact: '+1 point in Craft'
      }
    ]
  }
];

// ============================================================================
// REFLECTION & INSIGHT ISSUES
// ============================================================================

const REFLECTION_ISSUES: PIQIssuePattern[] = [
  {
    id: 'reflect-generic-lessons',
    dimension: 'reflection_insight',
    title: 'Generic Lessons',
    severity: 'critical',
    triggerConditions: {
      scoreThreshold: 6,
      keywordPatterns: [
        'i learned (the importance of|about|that)',
        'this taught me (teamwork|leadership|perseverance)',
        'i (discovered|realized) the value of',
        'i now (understand|know|appreciate)',
      ],
      customCheck: 'check_generic_lessons'
    },
    problemTemplate: 'You\'re stating generic lessons ("I learned teamwork," "I discovered leadership") that could apply to anyone\'s experience. These insights don\'t differentiate you or reveal unique thinking.',
    whyMattersTemplate: 'Generic lessons signal surface reflection. Admissions officers want to see YOUR specific insights that reveal how you think, not universal truths everyone learns.',
    fixStrategies: [
      {
        technique: 'Show Belief Shift',
        description: 'Replace generic lesson with a before/after belief: "I used to think X, but now I understand Y." This shows actual cognitive change.',
        estimatedImpact: '+3-4 points in Reflection'
      },
      {
        technique: 'Make It Specific to YOU',
        description: 'Instead of "I learned leadership," say what specific aspect of leadership you discovered and why it matters for YOUR goals/values.',
        estimatedImpact: '+2-3 points in Reflection'
      },
      {
        technique: 'Delete the Lesson Entirely',
        description: 'Show the insight through story/action rather than stating it. Let readers infer the learning.',
        estimatedImpact: '+2-3 points in Reflection + Voice'
      }
    ]
  },

  {
    id: 'reflect-no-belief-shift',
    dimension: 'reflection_insight',
    title: 'No Belief Shift Shown',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      absencePatterns: ['belief_shift_visible'],
      customCheck: 'check_has_belief_shift'
    },
    problemTemplate: 'Your reflection describes what you learned but doesn\'t show how your thinking changed. Strong reflection reveals shifts in beliefs, assumptions, or worldview.',
    whyMattersTemplate: 'Belief shifts prove deep learning. "I used to think leaders had all the answers; now I know leadership is about asking the right questions" shows cognitive sophistication that admissions officers value.',
    fixStrategies: [
      {
        technique: 'Use "I Used to Think... Now I..." Structure',
        description: 'Explicitly contrast your old belief with your new understanding. Make the shift visible.',
        estimatedImpact: '+2-3 points in Reflection'
      },
      {
        technique: 'Show What Assumption Broke',
        description: 'Identify what assumption or belief this experience challenged. What did you have to unlearn?',
        estimatedImpact: '+2-3 points in Reflection + Vulnerability'
      }
    ]
  },

  {
    id: 'reflect-surface-observations',
    dimension: 'reflection_insight',
    title: 'Surface-Level Observations',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      customCheck: 'check_insight_depth'
    },
    problemTemplate: 'Your reflections stay at the surface level - describing what happened or how you felt without digging into WHY or what it means beyond this specific situation.',
    whyMattersTemplate: 'Surface observations don\'t demonstrate intellectual depth. Admissions officers want to see you extract transferable insights and connect specific experiences to universal principles.',
    fixStrategies: [
      {
        technique: 'Add "And That Matters Because..." Layer',
        description: 'After stating an observation, ask yourself "Why does this matter?" and "What does this reveal about me/the world?" Go one layer deeper.',
        estimatedImpact: '+2-3 points in Reflection'
      },
      {
        technique: 'Connect Specific to Universal',
        description: 'Show how this specific experience taught you something applicable beyond this situation. Make the insight transferable.',
        estimatedImpact: '+2-3 points in Reflection'
      }
    ]
  },

  {
    id: 'reflect-prescriptive-takeaway',
    dimension: 'reflection_insight',
    title: 'Prescriptive Takeaway Instead of Earned Insight',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      keywordPatterns: [
        'we should (all|always)',
        'people should',
        'it is important to',
        'we must',
        'everyone needs to',
      ],
      customCheck: 'check_prescriptive_language'
    },
    problemTemplate: 'You\'re ending with prescriptive advice or universal statements ("everyone should," "we must") rather than personal insight earned through your specific experience.',
    whyMattersTemplate: 'Prescriptive language sounds preachy and disconnects from YOUR story. Strong essays stay personal and specific, letting readers draw their own universal lessons.',
    fixStrategies: [
      {
        technique: 'Make It About YOU',
        description: 'Change "People should ask for help" to "I\'m learning to ask for help even when it terrifies me." Keep it personal.',
        estimatedImpact: '+2-3 points in Reflection'
      },
      {
        technique: 'Show Ongoing Application',
        description: 'Instead of universal advice, show how you\'re still applying this insight: "Now when I face X, I remember Y..."',
        estimatedImpact: '+1-2 points in Reflection'
      }
    ]
  },

  {
    id: 'reflect-missing-self-realization',
    dimension: 'reflection_insight',
    title: 'Missing Self-Realization',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      absencePatterns: ['self_discovery_present'],
      customCheck: 'check_self_realization'
    },
    problemTemplate: 'Your essay focuses on external events or lessons without revealing what you learned about YOURSELF - your values, capabilities, limitations, or identity.',
    whyMattersTemplate: 'Self-realization is the heart of strong PIQs. Admissions officers want to understand who you are and how you think. Without self-discovery, the essay feels incomplete.',
    fixStrategies: [
      {
        technique: 'Add "I Realized I\'m Someone Who..." Statement',
        description: 'Include a moment of self-discovery: what you learned about your own values, strengths, fears, or patterns.',
        estimatedImpact: '+3-4 points in Reflection + Identity'
      },
      {
        technique: 'Reveal an Uncomfortable Truth',
        description: 'Share something you learned about yourself that wasn\'t flattering or easy to accept. This creates depth.',
        estimatedImpact: '+3-5 points in Reflection + Vulnerability'
      }
    ]
  }
];

// ============================================================================
// IDENTITY & SELF-DISCOVERY ISSUES
// ============================================================================

const IDENTITY_ISSUES: PIQIssuePattern[] = [
  {
    id: 'identity-missing-thread',
    dimension: 'identity_self_discovery',
    title: 'Missing Identity Thread',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6,
      absencePatterns: ['identity_thread_visible'],
      customCheck: 'check_identity_presence'
    },
    problemTemplate: 'Your essay describes activities and events but doesn\'t reveal who you ARE - your core values, what drives you, or how this experience relates to your identity.',
    whyMattersTemplate: 'PIQs are ultimately about helping admissions officers understand who you are as a person. Without an identity thread, the essay feels like a resume bullet expanded into paragraphs.',
    fixStrategies: [
      {
        technique: 'Name Your Core Value',
        description: 'Identify what value this experience connects to (curiosity, justice, connection, creation, etc.) and make it visible.',
        estimatedImpact: '+2-3 points in Identity'
      },
      {
        technique: 'Show Identity Evolution',
        description: 'Describe how this experience changed or confirmed your sense of who you are. "I used to see myself as X, but now..."',
        estimatedImpact: '+3-4 points in Identity + Reflection'
      }
    ]
  },

  {
    id: 'identity-told-not-shown',
    dimension: 'identity_self_discovery',
    title: 'Identity Stated, Not Demonstrated',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      keywordPatterns: [
        'i am (a|an) (curious|passionate|dedicated|driven)',
        'i am someone who',
        'as a (curious|passionate|dedicated) person',
      ],
      customCheck: 'check_identity_shown_vs_told'
    },
    problemTemplate: 'You\'re telling readers about your identity ("I am curious," "I am passionate") rather than demonstrating it through actions, choices, and moments.',
    whyMattersTemplate: '"Show, don\'t tell" is especially critical for identity. Saying "I\'m curious" is weak; showing yourself staying up until 3 AM researching something proves curiosity.',
    fixStrategies: [
      {
        technique: 'Delete the Statement, Add a Moment',
        description: 'Cut "I am curious" and instead show a moment when your curiosity drove you to do something specific.',
        estimatedImpact: '+2-3 points in Identity'
      },
      {
        technique: 'Prove Through Pattern',
        description: 'Show the same value appearing multiple times in different contexts within this story.',
        estimatedImpact: '+2-3 points in Identity + Coherence'
      }
    ]
  },

  {
    id: 'identity-inconsistent',
    dimension: 'identity_self_discovery',
    title: 'Inconsistent Self-Portrayal',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      customCheck: 'check_identity_consistency'
    },
    problemTemplate: 'Your essay presents conflicting or unclear aspects of your identity without acknowledging the complexity. This creates confusion about who you are.',
    whyMattersTemplate: 'Identity can be complex, but the essay should acknowledge contradictions rather than leaving them unresolved. Unexplained inconsistencies make you seem unreliable.',
    fixStrategies: [
      {
        technique: 'Acknowledge the Contradiction',
        description: 'If your identity contains contradictions (shy but leader, logical but creative), name and explore them.',
        estimatedImpact: '+1-2 points in Identity + Reflection'
      }
    ]
  },

  {
    id: 'identity-no-values-visible',
    dimension: 'identity_self_discovery',
    title: 'Core Values Not Visible',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      absencePatterns: ['values_demonstrated'],
      customCheck: 'check_values_presence'
    },
    problemTemplate: 'Your essay doesn\'t reveal what you value or what matters to you. Without visible values, admissions officers can\'t understand what drives your decisions.',
    whyMattersTemplate: 'Values are the foundation of identity. Admissions officers need to see what principles guide you - this helps them predict how you\'ll contribute to campus.',
    fixStrategies: [
      {
        technique: 'Show a Value-Based Choice',
        description: 'Include a moment when you chose something because it aligned with what you value, even if it was harder.',
        estimatedImpact: '+2-3 points in Identity'
      },
      {
        technique: 'Name What You Protected',
        description: 'What did you refuse to compromise on in this story? That reveals your values.',
        estimatedImpact: '+2-3 points in Identity + Reflection'
      }
    ]
  },

  {
    id: 'identity-superficial-discovery',
    dimension: 'identity_self_discovery',
    title: 'Superficial Self-Discovery',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6.5,
      keywordPatterns: [
        'i discovered my passion for',
        'i found out i love',
        'i realized i want to',
      ],
      customCheck: 'check_discovery_depth'
    },
    problemTemplate: 'Your self-discovery stays surface level - "I found my passion" or "I discovered I love X" without exploring WHY or what specifically drew you.',
    whyMattersTemplate: 'Generic discoveries don\'t reveal much about you. The WHY behind your passion is more interesting than the passion itself. It shows how you think and what you value.',
    fixStrategies: [
      {
        technique: 'Explore the WHY',
        description: 'Instead of "I discovered my passion for biology," ask: What specifically drew you? What need does it fulfill? What does it reveal about you?',
        estimatedImpact: '+2-3 points in Identity + Reflection'
      },
      {
        technique: 'Show the Before/After Identity Shift',
        description: 'How did you see yourself before vs after this discovery? Make the identity change concrete.',
        estimatedImpact: '+2-3 points in Identity'
      }
    ]
  }
];

// ============================================================================
// CRAFT & LANGUAGE QUALITY ISSUES
// ============================================================================

const CRAFT_ISSUES: PIQIssuePattern[] = [
  {
    id: 'craft-no-dialogue',
    dimension: 'craft_language_quality',
    title: 'Missing Dialogue',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      absencePatterns: ['dialogue_present'],
      customCheck: 'check_has_dialogue'
    },
    problemTemplate: 'Your essay doesn\'t include any dialogue - what people actually said. This makes scenes less vivid and immediate.',
    whyMattersTemplate: 'Dialogue brings essays to life. It shows voice, creates immediacy, and makes moments feel real. Even one line of dialogue can transform a paragraph.',
    fixStrategies: [
      {
        technique: 'Add One Key Line',
        description: 'Include what someone actually said at a pivotal moment. Quote them exactly.',
        estimatedImpact: '+1-2 points in Craft'
      },
      {
        technique: 'Replace Summary with Conversation',
        description: 'Turn "My mentor gave me advice" into "My mentor said: \'[actual quote]\'"',
        estimatedImpact: '+1-2 points in Craft + Specificity'
      }
    ]
  },

  {
    id: 'craft-weak-verbs',
    dimension: 'craft_language_quality',
    title: 'Weak Generic Verbs',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      keywordPatterns: [
        'was|were',
        'did|done',
        'had|has|have',
        'went|go|going',
        'got|get|getting',
      ],
      customCheck: 'check_verb_strength'
    },
    problemTemplate: 'You\'re relying on generic verbs (was, did, had, went, got) instead of specific, vivid action verbs that create stronger images.',
    whyMattersTemplate: 'Precise verbs create clarity and energy. "I went to the lab" vs "I rushed to the lab" - the second verb adds urgency and emotion.',
    fixStrategies: [
      {
        technique: 'Upgrade Key Verbs',
        description: 'Find the 5-10 most important action moments and upgrade the verbs. Use verbs that convey how you did something, not just that you did it.',
        estimatedImpact: '+1-2 points in Craft'
      }
    ]
  },

  {
    id: 'craft-no-imagery',
    dimension: 'craft_language_quality',
    title: 'Missing Imagery and Metaphor',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7.5,
      absencePatterns: ['imagery_present'],
      customCheck: 'check_has_imagery'
    },
    problemTemplate: 'Your essay is purely literal without metaphor, simile, or vivid imagery. This makes it feel dry and less engaging.',
    whyMattersTemplate: 'Imagery makes abstract concepts concrete and memorable. A well-chosen metaphor can communicate complexity quickly and beautifully.',
    fixStrategies: [
      {
        technique: 'Add One Metaphor',
        description: 'Find one place where you can compare your experience to something else that illuminates its meaning.',
        estimatedImpact: '+1 point in Craft'
      },
      {
        technique: 'Create Visual Comparisons',
        description: 'Use simile to make descriptions more vivid: "like," "as if," "reminded me of."',
        estimatedImpact: '+1 point in Craft'
      }
    ]
  },

  {
    id: 'craft-cliched-language',
    dimension: 'craft_language_quality',
    title: 'Clichéd Phrases and Metaphors',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      keywordPatterns: [
        'at the end of the day',
        'think outside the box',
        'step outside (my|your) comfort zone',
        'push (myself|yourself) to the limit',
        'light at the end of the tunnel',
      ],
      customCheck: 'check_cliches'
    },
    problemTemplate: 'You\'re using clichéd phrases that feel overused and don\'t add original thinking ("step outside my comfort zone," "think outside the box").',
    whyMattersTemplate: 'Clichés signal lazy thinking. Every cliché is a missed opportunity for original expression that reveals how YOU think.',
    fixStrategies: [
      {
        technique: 'Replace with Specific Description',
        description: 'Instead of "step outside my comfort zone," describe specifically what made you uncomfortable and how it felt.',
        estimatedImpact: '+1 point in Craft + Voice'
      }
    ]
  }
];

// ============================================================================
// THEMATIC COHERENCE ISSUES
// ============================================================================

const COHERENCE_ISSUES: PIQIssuePattern[] = [
  {
    id: 'coherence-scattered-themes',
    dimension: 'thematic_coherence',
    title: 'Scattered Themes Without Clear Throughline',
    severity: 'major',
    triggerConditions: {
      scoreThreshold: 6,
      customCheck: 'check_thematic_coherence'
    },
    problemTemplate: 'Your essay touches on multiple themes without a clear central throughline connecting them. This makes the essay feel unfocused.',
    whyMattersTemplate: 'Thematic coherence creates unity and impact. When every part reinforces the same central idea, the essay feels purposeful and sophisticated.',
    fixStrategies: [
      {
        technique: 'Identify One Central Theme',
        description: 'Choose the most important theme and make it the throughline. Cut or reframe sections that don\'t support it.',
        estimatedImpact: '+2-3 points in Coherence'
      },
      {
        technique: 'Create Thematic Bookends',
        description: 'Echo your opening theme in your conclusion to create circular structure.',
        estimatedImpact: '+1-2 points in Coherence + Arc'
      }
    ]
  },

  {
    id: 'coherence-disconnected-paragraphs',
    dimension: 'thematic_coherence',
    title: 'Disconnected Paragraphs',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      customCheck: 'check_paragraph_connections'
    },
    problemTemplate: 'Your paragraphs feel like separate blocks rather than flowing naturally into each other. Transitions are missing or mechanical.',
    whyMattersTemplate: 'Smooth flow keeps readers engaged. Jarring transitions break immersion and make the essay feel choppy.',
    fixStrategies: [
      {
        technique: 'Add Connective Tissue',
        description: 'Link paragraphs by having each one pick up an idea from the previous one. Create bridges.',
        estimatedImpact: '+1 point in Coherence'
      },
      {
        technique: 'Use Thematic Threads',
        description: 'Repeat key images, phrases, or concepts across paragraphs to create thematic connections.',
        estimatedImpact: '+1-2 points in Coherence'
      }
    ]
  },

  {
    id: 'coherence-theme-drift',
    dimension: 'thematic_coherence',
    title: 'Theme Drift - Losing Focus',
    severity: 'minor',
    triggerConditions: {
      scoreThreshold: 7,
      customCheck: 'check_theme_drift'
    },
    problemTemplate: 'Your essay starts with one theme but drifts to different ideas without intentionally evolving the original theme.',
    whyMattersTemplate: 'Theme drift confuses readers about what your essay is really about. Either commit to evolution or maintain focus.',
    fixStrategies: [
      {
        technique: 'Cut Tangential Content',
        description: 'Remove paragraphs or sections that don\'t serve your central theme.',
        estimatedImpact: '+1 point in Coherence'
      },
      {
        technique: 'Show Intentional Evolution',
        description: 'If theme changes, make it explicit: "I thought this was about X, but I learned it was really about Y."',
        estimatedImpact: '+1-2 points in Coherence + Reflection'
      }
    ]
  }
];

// ============================================================================
// EXPORT ALL PATTERNS
// ============================================================================

export const PIQ_ISSUE_PATTERNS: PIQIssuePattern[] = [
  ...HOOK_ISSUES,
  ...VULNERABILITY_ISSUES,
  ...ARC_ISSUES,
  ...SPECIFICITY_ISSUES,
  ...VOICE_ISSUES,
  ...REFLECTION_ISSUES,
  ...IDENTITY_ISSUES,
  ...CRAFT_ISSUES,
  ...COHERENCE_ISSUES,
];

console.log(`✓ PIQ Issue Patterns loaded: ${PIQ_ISSUE_PATTERNS.length} total patterns across 9 dimensions`);

/**
 * Get all issue patterns for a specific dimension
 */
export function getPatternsByDimension(dimension: PIQRubricDimension): PIQIssuePattern[] {
  return PIQ_ISSUE_PATTERNS.filter(p => p.dimension === dimension);
}

/**
 * Get issue pattern by ID
 */
export function getPattern(patternId: string): PIQIssuePattern | undefined {
  return PIQ_ISSUE_PATTERNS.find(p => p.id === patternId);
}
