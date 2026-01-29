/**
 * Research-Backed Technique Selector
 *
 * Connects issue types to relevant research sources and principles
 * for enhanced workshop coaching. This service bridges the deep research
 * database with the workshop chat system.
 *
 * KEY CAPABILITIES:
 * 1. Maps issue types to relevant core writing principles
 * 2. Retrieves specific sources from research batches
 * 3. Provides contextual teaching approaches based on research
 * 4. Identifies performative writing red flags
 *
 * USAGE:
 * - Called by workshopChatMode.ts when building coaching responses
 * - Provides research context for welcome messages
 * - Enhances system prompts with expert insights
 */

import {
  CORE_WRITING_PRINCIPLES,
  TYPE_SPECIFIC_PRINCIPLES,
  PERFORMATIVE_INDICATORS,
  type WritingPrinciple,
  type TypeSpecificPrinciple,
  type PerformativeIndicator,
} from '../rubrics/writingPrinciples';

import {
  ESSAY_OPENINGS_SOURCES,
  ESSAY_ENDINGS_SOURCES,
  ALL_INTELLECTUAL_DEPTH_SOURCES,
  ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  ALL_SHOW_DONT_TELL_SOURCES,
  ALL_PROSE_QUALITY_SOURCES,
  type EnhancedLabeledSource,
} from '../data/sourceRegistry';

import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Issue categories that map to different research resources
 */
export type IssueCategory =
  | 'weak_opening'
  | 'weak_closing'
  | 'generic_insight'
  | 'technical_depth'
  | 'passive_agency'
  | 'impact_claims'
  | 'telling_not_showing'
  | 'cliche_language'
  | 'performative_writing'
  | 'default_storytelling';

/**
 * Research-backed teaching approach
 */
export interface ResearchTeachingApproach {
  /** Brief description of the approach */
  description: string;

  /** Step 2 instruction (after showing examples) */
  step2: string;

  /** Research-backed principles to teach */
  principles: string[];

  /** Socratic prompt to start the conversation */
  startingQuestion: string;

  /** Research context for deeper teaching */
  researchContext: {
    /** Expert quote to share with student */
    expertQuote?: string;
    /** Source attribution */
    expertSource?: string;
    /** Why this matters (from research) */
    readerEffect?: string;
    /** Common misconceptions to avoid */
    misconceptions?: string[];
    /** Key statistic or finding */
    keyFinding?: string;
  };

  /** Relevant techniques from research */
  techniques: Array<{
    name: string;
    description: string;
    whenToUse: string;
  }>;

  /** Red flags to watch for */
  redFlags: string[];
}

/**
 * Full technique selection result
 */
export interface TechniqueSelectionResult {
  issueCategory: IssueCategory;
  corePrinciples: WritingPrinciple[];
  relevantSources: EnhancedLabeledSource[];
  typeSpecificGuidance?: TypeSpecificPrinciple;
  performativeWarnings: PerformativeIndicator[];
  teachingApproach: ResearchTeachingApproach;
}

// ============================================================================
// ISSUE DETECTION
// ============================================================================

/**
 * Detect issue category from problem summary text
 */
export function detectIssueCategory(problemSummary: string): IssueCategory {
  const lower = problemSummary.toLowerCase();

  // WEAK HOOK / OPENING issues
  if (
    lower.includes('hook') ||
    lower.includes('opening') ||
    lower.includes('attention') ||
    lower.includes('first sentence') ||
    lower.includes('begin')
  ) {
    return 'weak_opening';
  }

  // WEAK CLOSING / ENDING issues
  if (
    lower.includes('closing') ||
    lower.includes('ending') ||
    lower.includes('conclusion') ||
    lower.includes('final')
  ) {
    return 'weak_closing';
  }

  // GENERIC INSIGHT issues
  if (
    lower.includes('insight') ||
    lower.includes('generic') ||
    lower.includes('everyone says') ||
    lower.includes('borrowed') ||
    lower.includes('cliche lesson') ||
    lower.includes('obvious')
  ) {
    return 'generic_insight';
  }

  // TECHNICAL DEPTH / WHY MAJOR / PASSION issues
  if (
    lower.includes('technical') ||
    lower.includes('why major') ||
    lower.includes('passion') ||
    lower.includes('motivation') ||
    lower.includes('depth') ||
    lower.includes('intellectual')
  ) {
    return 'technical_depth';
  }

  // IMPACT / CONTRIBUTION issues
  if (
    lower.includes('impact') ||
    lower.includes('contribution') ||
    lower.includes('achievement') ||
    lower.includes('difference')
  ) {
    return 'impact_claims';
  }

  // PASSIVE AGENCY issues
  if (
    lower.includes('passive') ||
    lower.includes('agency') ||
    lower.includes('victim') ||
    lower.includes('acted upon')
  ) {
    return 'passive_agency';
  }

  // TELLING NOT SHOWING issues
  if (
    lower.includes('telling') ||
    lower.includes('showing') ||
    lower.includes('abstract') ||
    lower.includes('claim')
  ) {
    return 'telling_not_showing';
  }

  // CLICHE issues
  if (
    lower.includes('cliche') ||
    lower.includes('overused') ||
    lower.includes('common phrase')
  ) {
    return 'cliche_language';
  }

  // PERFORMATIVE issues
  if (
    lower.includes('performative') ||
    lower.includes('fake') ||
    lower.includes('trying too hard')
  ) {
    return 'performative_writing';
  }

  // Default to storytelling approach
  return 'default_storytelling';
}

// ============================================================================
// RESEARCH TECHNIQUE SELECTOR
// ============================================================================

/**
 * Get relevant core principles for an issue category
 */
function getCorePrinciplesForIssue(category: IssueCategory): WritingPrinciple[] {
  const principleMap: Record<IssueCategory, string[]> = {
    weak_opening: ['tension_creates_engagement', 'specificity_creates_trust'],
    weak_closing: ['structure_serves_meaning', 'insight_reveals_depth'],
    generic_insight: ['insight_reveals_depth', 'voice_reveals_character'],
    technical_depth: ['specificity_creates_trust', 'insight_reveals_depth'],
    passive_agency: ['show_action_not_reflection', 'specificity_creates_trust'],
    impact_claims: ['specificity_creates_trust', 'show_action_not_reflection'],
    telling_not_showing: ['specificity_creates_trust', 'show_action_not_reflection'],
    cliche_language: ['voice_reveals_character', 'specificity_creates_trust'],
    performative_writing: ['voice_reveals_character', 'insight_reveals_depth'],
    default_storytelling: ['show_action_not_reflection', 'specificity_creates_trust', 'voice_reveals_character'],
  };

  const principleIds = principleMap[category] || principleMap.default_storytelling;
  return CORE_WRITING_PRINCIPLES.filter(p => principleIds.includes(p.id));
}

/**
 * Get relevant sources for an issue category
 */
function getSourcesForIssue(category: IssueCategory): EnhancedLabeledSource[] {
  switch (category) {
    case 'weak_opening':
      // Return top sources for openings
      return ESSAY_OPENINGS_SOURCES.slice(0, 8);

    case 'weak_closing':
      // Return top sources for endings
      return ESSAY_ENDINGS_SOURCES.slice(0, 8);

    case 'generic_insight':
    case 'technical_depth':
      // Return intellectual depth sources
      return ALL_INTELLECTUAL_DEPTH_SOURCES.slice(0, 8);

    case 'passive_agency':
    case 'telling_not_showing':
      // Return show don't tell sources
      return ALL_SHOW_DONT_TELL_SOURCES.slice(0, 8);

    case 'impact_claims':
      // Return emotional intelligence sources (for authentic impact)
      return ALL_EMOTIONAL_INTELLIGENCE_SOURCES.slice(0, 8);

    case 'cliche_language':
    case 'performative_writing':
      // Return prose quality sources
      return ALL_PROSE_QUALITY_SOURCES.slice(0, 8);

    default:
      // Mix of sources for general storytelling
      return [
        ...ALL_SHOW_DONT_TELL_SOURCES.slice(0, 3),
        ...ALL_EMOTIONAL_INTELLIGENCE_SOURCES.slice(0, 3),
      ];
  }
}

/**
 * Get relevant performative indicators for an issue category
 */
function getPerformativeWarningsForIssue(category: IssueCategory): PerformativeIndicator[] {
  // All categories should be aware of performative writing
  // but some have more relevant warnings
  const relevantIndicators: Record<IssueCategory, string[]> = {
    weak_opening: ['trying_to_impress', 'overpolished'],
    weak_closing: ['saying_what_they_want_to_hear', 'overpolished'],
    generic_insight: ['virtue_signaling', 'saying_what_they_want_to_hear'],
    technical_depth: ['showing_off', 'false_modesty'],
    passive_agency: ['emotional_manipulation', 'trying_to_impress'],
    impact_claims: ['showing_off', 'false_modesty'],
    telling_not_showing: ['trying_to_impress', 'overpolished'],
    cliche_language: ['trying_to_impress', 'overpolished'],
    performative_writing: ['trying_to_impress', 'showing_off', 'virtue_signaling', 'false_modesty'],
    default_storytelling: ['trying_to_impress', 'emotional_manipulation'],
  };

  const indicatorIds = relevantIndicators[category] || relevantIndicators.default_storytelling;
  return PERFORMATIVE_INDICATORS.filter(p => indicatorIds.includes(p.id));
}

// ============================================================================
// TEACHING APPROACH BUILDERS
// ============================================================================

/**
 * Build research-backed teaching approach for weak openings
 */
function buildOpeningTeachingApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to find the most compelling moment or detail to lead with. Research shows admissions officers form impressions in the first 8 seconds (roughly 17 words), so your opening must create immediate tension, curiosity, or surprise.",

    step2: "We'll identify the most dramatic, surprising, or intriguing moment from your experience—the scene a movie director would choose for the opening shot",

    principles: [
      "Lead with tension, conflict, or surprise—not summary",
      "Drop readers into a moment, not an explanation",
      "Make them curious about what happens next",
      "The first sentence determines if they read carefully or skim",
    ],

    startingQuestion: "What's the most intense, surprising, or unexpected moment from this experience? The moment a movie director would choose for the opening scene?",

    researchContext: {
      expertQuote: "At highly selective schools, 90 seconds or less may be devoted to the first-round reading, with the first few sentences being 'immensely telling' about whether an applicant's voice resonates with the institution's ethos.",
      expertSource: "The Ivy Institute",
      readerEffect: "Your opening determines whether the reader leans forward with curiosity or settles into passive skimming. In a 4-minute review window, you have about 8 seconds to earn their full attention.",
      keyFinding: "60% of elite essays use sensory/visceral openings. 0% use generic openings like 'ever since I was young.'",
      misconceptions: [
        "WRONG: Start with context so they understand your story",
        "WRONG: Dictionary definitions grab attention",
        "RIGHT: Drop them into the most compelling moment first",
      ],
    },

    techniques: [
      {
        name: "In Medias Res",
        description: "Start mid-action, bypassing exposition",
        whenToUse: "When you have a dramatic or pivotal moment",
      },
      {
        name: "Sensory Immersion",
        description: "Open with a specific sensory detail that anchors the reader",
        whenToUse: "When visual or physical details are vivid",
      },
      {
        name: "Dialogue Hook",
        description: "Start with a line of dialogue that reveals character",
        whenToUse: "When a conversation captures the essence of your story",
      },
    ],

    redFlags: [
      "Dictionary definition opening",
      "'Ever since I was young...'",
      "Generic question opening",
      "Summary before story",
    ],
  };
}

/**
 * Build research-backed teaching approach for weak closings
 */
function buildClosingTeachingApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to find a resonant way to close—a lingering question, a specific image, or forward momentum. The peak-end rule shows that endings disproportionately shape how your entire essay is remembered.",

    step2: "We'll identify the insight, question, or image that should stay with the reader—the moment that captures transformation without stating it directly",

    principles: [
      "End with resonance, not summary",
      "A question you're still thinking about",
      "An image that captures the transformation",
      "Forward momentum, not a period on the past",
    ],

    startingQuestion: "What question from this experience are you still thinking about? Or what moment marked a real shift in how you see something?",

    researchContext: {
      expertQuote: "Many readers skim the first and last paragraphs and will only revisit the body if those sections grab their attention. Otherwise, your essay risks blending in with countless others.",
      expertSource: "Rick Clark, Executive Director of Strategic Student Access, Georgia Tech",
      readerEffect: "The peak-end rule demonstrates that people judge entire experiences based on two moments: the emotional peak and the conclusion. A weak ending can undermine an otherwise strong essay.",
      keyFinding: "A mediocre essay with a powerful ending can sometimes outperform a consistently good essay with a weak conclusion.",
      misconceptions: [
        "WRONG: Summarize your key points at the end",
        "WRONG: State what you learned explicitly",
        "RIGHT: Echo the opening with transformed perspective",
      ],
    },

    techniques: [
      {
        name: "Circular Return (Bookend)",
        description: "Echo an element from your opening, but transformed",
        whenToUse: "When you have a clear before/after transformation",
      },
      {
        name: "Forward Momentum",
        description: "End looking ahead, not summarizing the past",
        whenToUse: "For Why College essays or future-oriented pieces",
      },
      {
        name: "Lingering Image",
        description: "Close with a specific, evocative image",
        whenToUse: "When a visual can capture your insight without stating it",
      },
    ],

    redFlags: [
      "Summary of main points",
      "'In conclusion...'",
      "Restating the thesis",
      "Generic lesson learned",
    ],
  };
}

/**
 * Build research-backed teaching approach for generic insights
 */
function buildInsightTeachingApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to find what YOU specifically learned that others might not have noticed. Unique insights come from what surprised you or contradicted your expectations—not borrowed wisdom.",

    step2: "We'll dig into what specifically surprised you or changed your understanding—the moment when your assumptions were challenged",

    principles: [
      "Insights must be earned through specific experience",
      "What contradicted your expectations?",
      "What did you notice that others might have missed?",
      "Show the shift in understanding, not just the conclusion",
    ],

    startingQuestion: "What surprised you most about this experience—something that contradicted what you expected? Or who did you meet that changed how you think about this?",

    researchContext: {
      expertQuote: "Rather than concluding with simplistic lessons, strong essays leave space for ongoing questions. Essays should show 'you've wrestled with hard questions' without needing to 'have all the answers'.",
      expertSource: "Stanford Admissions Officer",
      readerEffect: "Admissions officers want students who THINK—who notice things others miss, who make unexpected connections. The moment when a reader thinks 'I've never thought about it that way' is worth more than any tidy lesson.",
      keyFinding: "Successful essays demonstrate comfort with ambiguity rather than forcing resolution.",
      misconceptions: [
        "WRONG: Every essay needs a clear lesson learned",
        "WRONG: Insights should be universally applicable",
        "RIGHT: Your unique observation is more valuable than borrowed wisdom",
      ],
    },

    techniques: [
      {
        name: "Contradiction Insight",
        description: "What challenged or contradicted what you expected?",
        whenToUse: "When your experience defied assumptions",
      },
      {
        name: "Specific Notice",
        description: "What did you notice that others might have missed?",
        whenToUse: "When small details revealed larger truths",
      },
      {
        name: "Ongoing Question",
        description: "What question are you still thinking about?",
        whenToUse: "When the experience raised more questions than answers",
      },
    ],

    redFlags: [
      "'Hard work pays off'",
      "'I learned to be grateful'",
      "'This experience taught me...' (generic)",
      "Borrowed motivational wisdom",
    ],
  };
}

/**
 * Build research-backed teaching approach for technical depth
 */
function buildTechnicalDepthApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to surface your actual technical engagement and intellectual obsessions. Stanford rejects 69% of perfect SAT scorers—what differentiates admitted students is intellectual vitality: genuine curiosity that you can't fake.",

    step2: "We'll identify specific projects, questions, or concepts you've already engaged with—evidence of existing curiosity, not just future interest",

    principles: [
      "Show existing engagement, not just future interest",
      "Name specific concepts, projects, or questions",
      "Demonstrate intellectual curiosity through specifics",
      "Density over narrative—every sentence proves something",
    ],

    startingQuestion: "What have you actually built, researched, read, or explored in this field? What specific problem or question keeps pulling you back?",

    researchContext: {
      expertQuote: "MIT seeks students who 'embody intellectual vitality and demonstrate a passion for exploring the unknown—traits that transcend test scores and titles'.",
      expertSource: "Stu Schmill, MIT Dean of Admissions",
      readerEffect: "Admissions officers can tell the difference between genuine intellectual obsession and performed interest. They're looking for evidence that you've already started the journey, not just that you want to.",
      keyFinding: "Stanford's separate Intellectual Vitality rating rejects 69% of perfect SAT scorers. IQ does not equal intellectual vitality.",
      misconceptions: [
        "WRONG: Express future passion and career goals",
        "WRONG: Name-drop professors or courses",
        "RIGHT: Show what you've ALREADY done because you couldn't help it",
      ],
    },

    techniques: [
      {
        name: "Rabbit Hole",
        description: "Describe a question you fell into and couldn't stop exploring",
        whenToUse: "When curiosity drove self-directed learning",
      },
      {
        name: "Project Evidence",
        description: "Name specific things you've built, written, or created",
        whenToUse: "When you have tangible evidence of engagement",
      },
      {
        name: "Intellectual Community",
        description: "Who do you discuss these ideas with? What do you read?",
        whenToUse: "When your curiosity has connected you to others",
      },
    ],

    redFlags: [
      "'I've always been passionate about...'",
      "Generic career goals",
      "Name-dropping without depth",
      "Future-focused without present evidence",
    ],
  };
}

/**
 * Build research-backed teaching approach for passive agency
 */
function buildPassiveAgencyApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to find a specific moment from YOUR life that *shows* this quality through action. The goal is to replace passive construction ('I was taught', 'it shaped me') with active scenes where you're making choices.",

    step2: "We'll dig into YOUR memories to find the right moment—a scene where your actions reveal who you are",

    principles: [
      "A specific moment instead of a general claim",
      "Visible action, not just internal feeling",
      "A choice that reveals character",
      "Details only you would know",
    ],

    startingQuestion: "Think of a specific moment when this quality was *visible* in your life. Where were you? What were you doing? What choice did you make?",

    researchContext: {
      expertQuote: "Colleges want students who DO things, not just think about things. When an essay shows action—specific choices, attempts, failures, adjustments—the reader sees evidence of agency.",
      expertSource: "Core Writing Principles Research",
      readerEffect: "When you use passive voice ('I was taught', 'it shaped me'), readers wonder: 'Did anything actually change? Or did they just have a thought?' Active scenes create trust.",
      keyFinding: "The best essays show action AND reflection, with the reflection earned through action—not just claimed.",
      misconceptions: [
        "WRONG: Explain what the experience taught you",
        "WRONG: Describe how circumstances shaped you",
        "RIGHT: Show what YOU DID in response to circumstances",
      ],
    },

    techniques: [
      {
        name: "Scene Construction",
        description: "Build a specific moment with time, place, and action",
        whenToUse: "When you need to ground an abstract quality",
      },
      {
        name: "Choice Point",
        description: "Identify a moment where you made a decision",
        whenToUse: "When demonstrating agency and initiative",
      },
      {
        name: "Sensory Anchor",
        description: "Use physical details to make the moment vivid",
        whenToUse: "When the scene needs to feel real and specific",
      },
    ],

    redFlags: [
      "'This experience taught me...'",
      "'I was shaped by...'",
      "'Growing up, I learned...'",
      "Passive voice throughout",
    ],
  };
}

/**
 * Build research-backed teaching approach for impact claims
 */
function buildImpactClaimsApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to surface the specific, measurable impact of your work. Vague claims of 'helping' or 'making a difference' need to become concrete evidence of change you created.",

    step2: "We'll identify specific evidence of the difference you made—numbers, names, systems, or outcomes that prove impact",

    principles: [
      "Specific numbers or outcomes over vague claims",
      "Show what changed because of your actions",
      "Evidence others could verify",
      "Impact on real people or real systems",
    ],

    startingQuestion: "What specifically changed because of your involvement? Can you point to something concrete—a number, a person, a system—that's different because of you?",

    researchContext: {
      expertQuote: "When a writer uses specific details, the reader's brain shifts from 'evaluating' to 'experiencing.' Specificity signals: 'This person was actually there. This actually happened. I can trust what they're telling me.'",
      expertSource: "Core Writing Principles Research",
      readerEffect: "Vague impact claims trigger skepticism. Specific evidence creates trust. Admissions officers read thousands of essays claiming to 'help' people—the specific ones stand out.",
      keyFinding: "Numbers and metrics, sensory details that only someone present would notice, and proper nouns all signal authenticity.",
      misconceptions: [
        "WRONG: 'I helped many people'",
        "WRONG: 'I made a significant impact'",
        "RIGHT: 'I tutored 12 students; 8 passed the exam after failing twice'",
      ],
    },

    techniques: [
      {
        name: "Before/After Evidence",
        description: "What was the situation before and after your involvement?",
        whenToUse: "When you can show measurable change",
      },
      {
        name: "Name One Person",
        description: "Tell the story of one specific person you impacted",
        whenToUse: "When individual stories are more powerful than numbers",
      },
      {
        name: "Verifiable Outcome",
        description: "What could someone else confirm?",
        whenToUse: "When building credibility for your claims",
      },
    ],

    redFlags: [
      "'Helped many people'",
      "'Made a significant difference'",
      "'Impacted the community'",
      "Vague scale claims without evidence",
    ],
  };
}

/**
 * Build default storytelling approach (for general issues)
 */
function buildDefaultStorytellingApproach(): ResearchTeachingApproach {
  return {
    description: "We're going to find a specific moment from YOUR life that *shows* this quality instead of claiming it. The goal is to replace abstract statements with concrete scenes—something an admissions officer can actually picture.",

    step2: "We'll dig into YOUR memories to find the right moment",

    principles: [
      "A specific moment instead of a general claim",
      "Visible action, not just internal feeling",
      "A choice that reveals character",
      "Details only you would know",
    ],

    startingQuestion: "Think of a specific moment when this quality was *visible* in your life. Where were you? What were you doing?",

    researchContext: {
      expertQuote: "Admissions officers read thousands of essays. They're not just evaluating content—they're trying to hear the PERSON. Voice is the quality that makes a reader feel like they're sitting across from you, not reading a document.",
      expertSource: "Core Writing Principles Research",
      readerEffect: "Vague language triggers skepticism: 'Are they making this up? Exaggerating? Hiding something?' Specific details signal authenticity.",
      misconceptions: [
        "WRONG: Explain what qualities you have",
        "WRONG: Tell what you learned",
        "RIGHT: Show the moment that reveals the quality",
      ],
    },

    techniques: [
      {
        name: "Scene Construction",
        description: "Build a specific moment with time, place, and action",
        whenToUse: "When grounding any abstract claim",
      },
      {
        name: "Sensory Details",
        description: "Add details that only someone present would notice",
        whenToUse: "When creating authenticity and vivid imagery",
      },
      {
        name: "Micro-Moment",
        description: "Zoom in on 30 seconds instead of summarizing months",
        whenToUse: "When depth is more valuable than breadth",
      },
    ],

    redFlags: [
      "Abstract claims without scenes",
      "Telling emotions instead of showing them",
      "Generic details anyone could have",
      "Summary instead of moments",
    ],
  };
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Research-backed technique selector service
 *
 * Connects issue types to relevant research sources and principles
 * for enhanced workshop coaching.
 */
export class ResearchTechniqueSelector {
  /**
   * Get complete technique selection for an issue
   */
  getTechniquesForIssue(
    problemSummary: string,
    essayType?: SupplementalType
  ): TechniqueSelectionResult {
    const category = detectIssueCategory(problemSummary);

    return {
      issueCategory: category,
      corePrinciples: getCorePrinciplesForIssue(category),
      relevantSources: getSourcesForIssue(category),
      typeSpecificGuidance: essayType ? TYPE_SPECIFIC_PRINCIPLES[essayType] : undefined,
      performativeWarnings: getPerformativeWarningsForIssue(category),
      teachingApproach: this.getTeachingApproachForCategory(category),
    };
  }

  /**
   * Get teaching approach for a specific issue category
   */
  getTeachingApproachForCategory(category: IssueCategory): ResearchTeachingApproach {
    switch (category) {
      case 'weak_opening':
        return buildOpeningTeachingApproach();
      case 'weak_closing':
        return buildClosingTeachingApproach();
      case 'generic_insight':
        return buildInsightTeachingApproach();
      case 'technical_depth':
        return buildTechnicalDepthApproach();
      case 'passive_agency':
        return buildPassiveAgencyApproach();
      case 'impact_claims':
        return buildImpactClaimsApproach();
      case 'telling_not_showing':
        return buildPassiveAgencyApproach(); // Similar approach
      case 'cliche_language':
        return buildDefaultStorytellingApproach(); // Focus on specificity
      case 'performative_writing':
        return buildDefaultStorytellingApproach(); // Focus on authenticity
      default:
        return buildDefaultStorytellingApproach();
    }
  }

  /**
   * Get opening-specific techniques and sources
   */
  getOpeningTechniques(): {
    scienceOfFirstImpressions: EnhancedLabeledSource[];
    techniquesThatWork: EnhancedLabeledSource[];
    aoInsights: EnhancedLabeledSource[];
  } {
    const sources = ESSAY_OPENINGS_SOURCES;

    return {
      scienceOfFirstImpressions: sources.filter(s =>
        s.source_id.includes('science') || s.taxonomy.secondary_categories?.includes('cognitive_psychology')
      ),
      techniquesThatWork: sources.filter(s =>
        s.source_id.includes('technique') && !s.source_id.includes('fail')
      ),
      aoInsights: sources.filter(s =>
        s.authority === 'admissions_officer'
      ),
    };
  }

  /**
   * Get ending-specific techniques and sources
   */
  getEndingTechniques(): {
    peakEndRule: EnhancedLabeledSource[];
    circularReturn: EnhancedLabeledSource[];
    aoInsights: EnhancedLabeledSource[];
  } {
    const sources = ESSAY_ENDINGS_SOURCES;

    return {
      peakEndRule: sources.filter(s =>
        s.source_id.includes('peak') || s.source_id.includes('science')
      ),
      circularReturn: sources.filter(s =>
        s.source_id.includes('circular') || s.source_id.includes('bookend')
      ),
      aoInsights: sources.filter(s =>
        s.authority === 'admissions_officer'
      ),
    };
  }

  /**
   * Get intellectual depth techniques and sources
   */
  getIntellectualDepthTechniques(): {
    institutionalFrameworks: EnhancedLabeledSource[];
    complexityNuance: EnhancedLabeledSource[];
    systemsAwareness: EnhancedLabeledSource[];
  } {
    const sources = ALL_INTELLECTUAL_DEPTH_SOURCES;

    return {
      institutionalFrameworks: sources.filter(s =>
        s.source_id.includes('stanford') || s.source_id.includes('mit') || s.source_id.includes('harvard')
      ),
      complexityNuance: sources.filter(s =>
        s.source_id.includes('paradox') || s.source_id.includes('ambiguity') || s.source_id.includes('nuance')
      ),
      systemsAwareness: sources.filter(s =>
        s.source_id.includes('systems')
      ),
    };
  }

  /**
   * Get a research quote suitable for sharing with students
   */
  getStudentFacingQuote(category: IssueCategory): { quote: string; source: string } | null {
    const approach = this.getTeachingApproachForCategory(category);

    if (approach.researchContext.expertQuote && approach.researchContext.expertSource) {
      return {
        quote: approach.researchContext.expertQuote,
        source: approach.researchContext.expertSource,
      };
    }

    return null;
  }

  /**
   * Get key finding for an issue category
   */
  getKeyFinding(category: IssueCategory): string | null {
    const approach = this.getTeachingApproachForCategory(category);
    return approach.researchContext.keyFinding || null;
  }

  /**
   * Get misconceptions for an issue category
   */
  getMisconceptions(category: IssueCategory): string[] {
    const approach = this.getTeachingApproachForCategory(category);
    return approach.researchContext.misconceptions || [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const researchTechniqueSelector = new ResearchTechniqueSelector();
