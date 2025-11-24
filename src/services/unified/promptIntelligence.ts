/**
 * Prompt Intelligence System
 *
 * Deep understanding of all 8 UC PIQ prompts:
 * - Required elements per prompt
 * - Alignment scoring (0-10)
 * - Missing critical components identification
 * - Prompt-tailored suggestions
 *
 * Sources: UC Berkeley admissions rubric, analysis of 19 exemplar essays
 */

export type UCPromptID = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PromptRequirement {
  element: string;
  description: string;
  weight: number; // 0-1, importance in this prompt
  detection_patterns: string[]; // Keywords/phrases that indicate presence
}

export interface PromptIntelligenceResult {
  prompt_id: UCPromptID;
  prompt_text: string;
  alignment_score: number; // 0-10
  alignment_label: string;
  requirements_met: Array<{
    element: string;
    met: boolean;
    evidence?: string;
    suggestion?: string;
  }>;
  critical_missing: string[]; // High-weight requirements not met
  prompt_tailored_suggestions: string[];
  exemplar_patterns: string[]; // What successful essays for this prompt did
}

// ============================================================================
// UC PIQ PROMPT DEFINITIONS
// ============================================================================

const UC_PROMPTS: Record<UCPromptID, {
  text: string;
  short_name: string;
  requirements: PromptRequirement[];
  exemplar_patterns: string[];
}> = {
  1: {
    text: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.",
    short_name: "Leadership",
    requirements: [
      {
        element: "Specific leadership role",
        description: "Name your position/role explicitly",
        weight: 0.20,
        detection_patterns: [
          'president', 'captain', 'founder', 'director', 'lead', 'organizer',
          'my role as', 'served as', 'position of', 'as the'
        ]
      },
      {
        element: "Positive influence on others",
        description: "Show how you affected individuals or group",
        weight: 0.25,
        detection_patterns: [
          'helped', 'taught', 'mentored', 'guided', 'inspired', 'motivated',
          'members', 'team', 'peers', 'students', 'others'
        ]
      },
      {
        element: "Specific actions taken",
        description: "What you actually did (not just what you oversaw)",
        weight: 0.20,
        detection_patterns: [
          'I created', 'I organized', 'I implemented', 'I designed', 'I started',
          'I coordinated', 'I planned', 'I led'
        ]
      },
      {
        element: "Over time (duration)",
        description: "Show sustained involvement, not one-time event",
        weight: 0.15,
        detection_patterns: [
          'year', 'years', 'months', 'throughout', 'every week', 'regularly',
          'consistently', 'continued', 'ongoing'
        ]
      },
      {
        element: "Measurable impact",
        description: "Quantify results (numbers, growth, change)",
        weight: 0.20,
        detection_patterns: [
          '\\d+\\s*(people|members|students|participants)',
          '\\d+%', 'increased', 'grew', 'expanded', 'from \\d+ to \\d+'
        ]
      }
    ],
    exemplar_patterns: [
      "Started with problem/need in community → Role taken → Specific actions → Measurable results",
      "Used dialogue to show leadership style (collaborative vs directive)",
      "Showed vulnerability in leadership challenges",
      "Credited team members while owning specific contributions"
    ]
  },

  2: {
    text: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.",
    short_name: "Creative Expression",
    requirements: [
      {
        element: "Specific creative outlet",
        description: "Name what you create (art, music, code, writing, etc.)",
        weight: 0.20,
        detection_patterns: [
          'paint', 'draw', 'write', 'compose', 'design', 'code', 'build',
          'photography', 'music', 'dance', 'theater', 'film'
        ]
      },
      {
        element: "Creative process shown",
        description: "How you actually create (not just what you make)",
        weight: 0.30,
        detection_patterns: [
          'process', 'start with', 'first I', 'then I', 'iterate', 'experiment',
          'try', 'revise', 'draft', 'sketch'
        ]
      },
      {
        element: "Originality/innovation",
        description: "What makes your approach unique",
        weight: 0.20,
        detection_patterns: [
          'unique', 'unusual', 'different', 'unconventional', 'original',
          'never seen', 'first', 'new approach', 'combined'
        ]
      },
      {
        element: "Why it matters to you",
        description: "Personal meaning, not just skill display",
        weight: 0.15,
        detection_patterns: [
          'means to me', 'allows me to', 'helps me', 'through this I',
          'important because', 'matters', 'significant'
        ]
      },
      {
        element: "Examples of work",
        description: "Specific pieces/projects described",
        weight: 0.15,
        detection_patterns: [
          'piece', 'project', 'series', 'portfolio', 'collection',
          'created', 'made', 'built', 'designed'
        ]
      }
    ],
    exemplar_patterns: [
      "Opened with creative process in action (sensory details)",
      "Showed evolution of creative thinking over time",
      "Connected creativity to identity or worldview",
      "Avoided generic 'art is my passion' - showed through specific work"
    ]
  },

  3: {
    text: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?",
    short_name: "Talent/Skill",
    requirements: [
      {
        element: "Specific talent named",
        description: "Clearly identify the skill (not vague)",
        weight: 0.15,
        detection_patterns: [
          'skill', 'talent', 'ability', 'strength', 'excel at',
          'good at', 'master', 'expertise in'
        ]
      },
      {
        element: "Development process",
        description: "How you built this skill (progression shown)",
        weight: 0.30,
        detection_patterns: [
          'started', 'began', 'first', 'learned', 'practiced', 'trained',
          'improved', 'developed', 'from', 'to', 'progress'
        ]
      },
      {
        element: "Demonstration/application",
        description: "Specific instances where you used this skill",
        weight: 0.25,
        detection_patterns: [
          'used', 'applied', 'demonstrated', 'showed', 'competed',
          'performed', 'implemented', 'solved'
        ]
      },
      {
        element: "Challenges overcome",
        description: "What was difficult in developing this skill",
        weight: 0.15,
        detection_patterns: [
          'challenge', 'difficult', 'struggle', 'obstacle', 'setback',
          'failed', 'didn\'t work', 'had to'
        ]
      },
      {
        element: "Recognition/results",
        description: "Evidence of skill level (awards, impact, outcomes)",
        weight: 0.15,
        detection_patterns: [
          'award', 'recognition', 'selected', 'won', 'achieved',
          'result', 'outcome', 'success', '\\d+\\s*place'
        ]
      }
    ],
    exemplar_patterns: [
      "Showed skill in action before naming it",
      "Emphasized growth mindset over innate talent",
      "Used specific examples (competitions, projects, performances)",
      "Connected skill to broader impact or future goals"
    ]
  },

  4: {
    text: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.",
    short_name: "Educational Journey",
    requirements: [
      {
        element: "Specific opportunity OR barrier",
        description: "Name what it was (research program, lack of resources, etc.)",
        weight: 0.25,
        detection_patterns: [
          'opportunity', 'program', 'course', 'research', 'internship',
          'barrier', 'lack of', 'limited', 'no access', 'couldn\'t'
        ]
      },
      {
        element: "Context/circumstances",
        description: "Why this was significant for YOU",
        weight: 0.20,
        detection_patterns: [
          'first in my family', 'school didn\'t offer', 'only available',
          'rare', 'competitive', 'difficult to access', 'had to'
        ]
      },
      {
        element: "Actions taken",
        description: "How you seized opportunity or overcame barrier",
        weight: 0.25,
        detection_patterns: [
          'I applied', 'I sought out', 'I taught myself', 'I found',
          'I created', 'I worked', 'I overcame'
        ]
      },
      {
        element: "Intellectual growth",
        description: "What you learned academically/intellectually",
        weight: 0.15,
        detection_patterns: [
          'learned', 'discovered', 'understood', 'realized', 'explored',
          'questioned', 'researched', 'studied'
        ]
      },
      {
        element: "Impact on trajectory",
        description: "How this shaped your academic path",
        weight: 0.15,
        detection_patterns: [
          'led me to', 'sparked', 'inspired', 'changed my', 'now I',
          'because of this', 'influenced', 'shaped'
        ]
      }
    ],
    exemplar_patterns: [
      "Showed resourcefulness in seeking/creating opportunities",
      "Emphasized intellectual curiosity over resume-building",
      "Connected opportunity/barrier to larger context (first-gen, school resources)",
      "Showed specific academic/intellectual transformation"
    ]
  },

  5: {
    text: "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?",
    short_name: "Challenge/Adversity",
    requirements: [
      {
        element: "Specific challenge described",
        description: "Name what happened (not vague 'struggle')",
        weight: 0.20,
        detection_patterns: [
          'challenge', 'difficult', 'problem', 'obstacle', 'adversity',
          'crisis', 'setback', 'loss', 'illness'
        ]
      },
      {
        element: "Emotional/personal impact",
        description: "How it affected you (vulnerability)",
        weight: 0.20,
        detection_patterns: [
          'felt', 'afraid', 'worried', 'struggled', 'questioned',
          'doubted', 'couldn\'t', 'hard to'
        ]
      },
      {
        element: "Specific steps taken",
        description: "Actions to overcome (not just 'persevered')",
        weight: 0.25,
        detection_patterns: [
          'I decided', 'I started', 'I reached out', 'I sought',
          'I created', 'I changed', 'I worked'
        ]
      },
      {
        element: "Academic connection",
        description: "How it affected grades/coursework/school",
        weight: 0.20,
        detection_patterns: [
          'grade', 'class', 'course', 'school', 'academic', 'study',
          'homework', 'test', 'GPA', 'learning'
        ]
      },
      {
        element: "Growth/resilience shown",
        description: "What changed in you (character development)",
        weight: 0.15,
        detection_patterns: [
          'learned', 'grew', 'became', 'now I', 'understand',
          'stronger', 'resilient', 'changed how I'
        ]
      }
    ],
    exemplar_patterns: [
      "Opened with moment of challenge (sensory details, vulnerability)",
      "Showed resilience through specific actions, not statements",
      "Admitted ongoing struggle or imperfect resolution (authenticity)",
      "Connected to academic impact explicitly"
    ]
  },

  6: {
    text: "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.",
    short_name: "Academic Passion",
    requirements: [
      {
        element: "Specific academic subject",
        description: "Name the field/subject clearly",
        weight: 0.15,
        detection_patterns: [
          'math', 'science', 'biology', 'chemistry', 'physics', 'history',
          'literature', 'computer science', 'engineering', 'psychology'
        ]
      },
      {
        element: "Why it inspires you",
        description: "Intellectual curiosity, not career goals",
        weight: 0.25,
        detection_patterns: [
          'fascinated', 'curious', 'wondered', 'questioned', 'intrigued',
          'amazed', 'captivated', 'drawn to', 'love'
        ]
      },
      {
        element: "Inside classroom",
        description: "Coursework, projects, class engagement",
        weight: 0.15,
        detection_patterns: [
          'class', 'course', 'teacher', 'assignment', 'project',
          'learned', 'studied', 'AP', 'honors'
        ]
      },
      {
        element: "Outside classroom",
        description: "Self-directed learning, research, reading",
        weight: 0.25,
        detection_patterns: [
          'own time', 'research', 'read', 'explored', 'taught myself',
          'online course', 'books', 'articles', 'videos', 'experimented'
        ]
      },
      {
        element: "Intellectual depth",
        description: "Specific concepts/questions you explored",
        weight: 0.20,
        detection_patterns: [
          'concept', 'theory', 'question', 'problem', 'idea',
          'how', 'why', 'what if', 'mechanism', 'principle'
        ]
      }
    ],
    exemplar_patterns: [
      "Opened with specific question or moment of intellectual curiosity",
      "Showed progression from classroom to independent exploration",
      "Avoided career-focused justification ('will help me become...')",
      "Demonstrated genuine intellectual engagement with specific concepts"
    ]
  },

  7: {
    text: "What have you done to make your school or your community a better place?",
    short_name: "Community Service",
    requirements: [
      {
        element: "Specific problem identified",
        description: "What need/gap did you see",
        weight: 0.20,
        detection_patterns: [
          'problem', 'issue', 'need', 'lack of', 'missing', 'gap',
          'wanted to', 'saw that', 'noticed'
        ]
      },
      {
        element: "Action taken",
        description: "What you actually did (not just 'volunteered')",
        weight: 0.25,
        detection_patterns: [
          'I created', 'I organized', 'I started', 'I built', 'I designed',
          'I implemented', 'I led', 'I coordinated'
        ]
      },
      {
        element: "Community defined",
        description: "Who specifically benefited",
        weight: 0.15,
        detection_patterns: [
          'school', 'community', 'neighborhood', 'students', 'peers',
          'residents', 'members', 'people', 'families'
        ]
      },
      {
        element: "Measurable impact",
        description: "How community is better (observable change)",
        weight: 0.25,
        detection_patterns: [
          '\\d+\\s*people', 'increased', 'grew', 'now', 'before',
          'improved', 'reduced', 'created', 'established'
        ]
      },
      {
        element: "Sustainability/continuation",
        description: "Will it continue after you (legacy)",
        weight: 0.15,
        detection_patterns: [
          'continue', 'ongoing', 'will', 'future', 'next year',
          'established', 'foundation', 'system', 'tradition'
        ]
      }
    ],
    exemplar_patterns: [
      "Showed community before and after (transformation)",
      "Emphasized systemic change over one-time service",
      "Used specific examples of individuals helped",
      "Showed initiative (started something) vs joining existing program"
    ]
  },

  8: {
    text: "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?",
    short_name: "Personal Distinction",
    requirements: [
      {
        element: "Unique quality/perspective",
        description: "What sets you apart (not in other PIQs)",
        weight: 0.30,
        detection_patterns: [
          'unique', 'different', 'perspective', 'background', 'experience',
          'unlike', 'distinct', 'special', 'rare'
        ]
      },
      {
        element: "Specific example/story",
        description: "Don't just claim - show through narrative",
        weight: 0.25,
        detection_patterns: [
          'when', 'one time', 'for example', 'instance', 'moment',
          'day', 'experience', 'story'
        ]
      },
      {
        element: "Connection to UC values",
        description: "How you'll contribute to campus",
        weight: 0.20,
        detection_patterns: [
          'contribute', 'bring', 'offer', 'share', 'add',
          'community', 'campus', 'UC', 'university'
        ]
      },
      {
        element: "Not redundant",
        description: "Doesn't repeat other PIQs",
        weight: 0.15,
        detection_patterns: []
      },
      {
        element: "Authentic voice",
        description: "Genuine, not 'selling yourself'",
        weight: 0.10,
        detection_patterns: []
      }
    ],
    exemplar_patterns: [
      "Used narrative to show quality rather than stating it",
      "Avoided generic 'diversity' or 'leadership' claims",
      "Connected personal distinction to intellectual or community contribution",
      "Showed self-awareness and humility"
    ]
  }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function analyzePromptAlignment(
  text: string,
  promptId: UCPromptID
): Promise<PromptIntelligenceResult> {

  const prompt = UC_PROMPTS[promptId];
  if (!prompt) {
    throw new Error(`Invalid prompt ID: ${promptId}`);
  }

  // Check each requirement
  const requirementsMet = await checkRequirements(text, prompt.requirements);

  // Calculate alignment score (0-10)
  const alignmentScore = calculateAlignmentScore(requirementsMet);

  // Identify critical missing elements
  const criticalMissing = requirementsMet
    .filter(r => !r.met && r.element.includes('Specific'))
    .map(r => r.element);

  // Generate prompt-tailored suggestions
  const suggestions = generatePromptSuggestions(requirementsMet, promptId);

  // Alignment label
  const alignmentLabel = getAlignmentLabel(alignmentScore);

  return {
    prompt_id: promptId,
    prompt_text: prompt.text,
    alignment_score: alignmentScore,
    alignment_label: alignmentLabel,
    requirements_met: requirementsMet,
    critical_missing: criticalMissing,
    prompt_tailored_suggestions: suggestions,
    exemplar_patterns: prompt.exemplar_patterns
  };
}

// ============================================================================
// REQUIREMENT CHECKING
// ============================================================================

async function checkRequirements(
  text: string,
  requirements: PromptRequirement[]
): Promise<Array<{
  element: string;
  met: boolean;
  evidence?: string;
  suggestion?: string;
}>> {

  const results = [];
  const lowerText = text.toLowerCase();

  for (const req of requirements) {
    let met = false;
    let evidence: string | undefined;

    // Check detection patterns
    for (const pattern of req.detection_patterns) {
      // Handle regex patterns (for numbers, etc.)
      if (pattern.includes('\\')) {
        const regex = new RegExp(pattern, 'gi');
        const match = text.match(regex);
        if (match) {
          met = true;
          evidence = `"${match[0]}"`;
          break;
        }
      } else {
        // Simple keyword match
        if (lowerText.includes(pattern.toLowerCase())) {
          met = true;
          // Extract context around keyword
          const index = lowerText.indexOf(pattern.toLowerCase());
          const start = Math.max(0, index - 20);
          const end = Math.min(text.length, index + pattern.length + 30);
          evidence = `"...${text.substring(start, end)}..."`;
          break;
        }
      }
    }

    // Generate suggestion if not met
    const suggestion = !met ? generateRequirementSuggestion(req) : undefined;

    results.push({
      element: req.element,
      met,
      evidence,
      suggestion
    });
  }

  return results;
}

function generateRequirementSuggestion(req: PromptRequirement): string {
  const suggestions: Record<string, string> = {
    "Specific leadership role": "Name your exact role/position in the first paragraph",
    "Positive influence on others": "Show how you affected specific people (use names or descriptions)",
    "Specific actions taken": "Use action verbs: 'I created...', 'I organized...', 'I designed...'",
    "Over time (duration)": "Mention how long you were involved (months, years, weekly commitment)",
    "Measurable impact": "Add numbers: How many people? What % increase? Specific metrics?",
    "Specific creative outlet": "Name what you create: painting, coding, writing, music, etc.",
    "Creative process shown": "Describe HOW you create, not just WHAT you make",
    "Originality/innovation": "Explain what makes your approach unique or unconventional",
    "Why it matters to you": "Connect to personal meaning, not just skill display",
    "Examples of work": "Describe 1-2 specific pieces/projects in detail",
    "Specific talent named": "Clearly identify the skill in first paragraph",
    "Development process": "Show progression: How did you go from beginner to skilled?",
    "Demonstration/application": "Give specific examples of when/where you used this skill",
    "Challenges overcome": "Admit what was difficult - shows growth mindset",
    "Recognition/results": "Mention awards, outcomes, or measurable achievements",
    "Specific opportunity OR barrier": "Name it explicitly in first paragraph",
    "Context/circumstances": "Explain why this was significant for YOUR situation",
    "Actions taken": "Show initiative: What specific steps did YOU take?",
    "Intellectual growth": "What specific academic concept/idea did you learn?",
    "Impact on trajectory": "How did this shape your academic interests going forward?",
    "Specific challenge described": "Name what happened - avoid vague 'struggle'",
    "Emotional/personal impact": "Show vulnerability: How did you feel? Physical symptoms?",
    "Specific steps taken": "List concrete actions, not just 'I persevered'",
    "Academic connection": "Explicitly connect to grades, courses, or learning",
    "Growth/resilience shown": "Show character change through behavior, not statements",
    "Specific academic subject": "Name the field clearly (not just 'science')",
    "Why it inspires you": "Focus on intellectual curiosity, not career goals",
    "Inside classroom": "Mention specific courses, projects, or class moments",
    "Outside classroom": "Show self-directed learning: research, reading, experimentation",
    "Intellectual depth": "Discuss specific concepts, theories, or questions you explored",
    "Specific problem identified": "What need/gap did you notice?",
    "Action taken": "What did you DO (not just 'I volunteered')",
    "Community defined": "Who specifically benefited? Be precise",
    "Sustainability/continuation": "Will this continue after you? How?",
    "Unique quality/perspective": "What sets you apart that wasn't in other PIQs?",
    "Specific example/story": "Show through narrative, don't just claim",
    "Connection to UC values": "How will you contribute to UC campus community?",
    "Not redundant": "Ensure this doesn't repeat content from other PIQs",
    "Authentic voice": "Be genuine - avoid 'selling yourself'"
  };

  return suggestions[req.element] || `Address: ${req.description}`;
}

// ============================================================================
// ALIGNMENT SCORING
// ============================================================================

function calculateAlignmentScore(
  requirementsMet: Array<{ element: string; met: boolean }>
): number {
  // Get the original requirements with weights
  const allRequirements = Object.values(UC_PROMPTS)
    .flatMap(p => p.requirements);

  let totalWeight = 0;
  let metWeight = 0;

  for (const result of requirementsMet) {
    const req = allRequirements.find(r => r.element === result.element);
    if (req) {
      totalWeight += req.weight;
      if (result.met) {
        metWeight += req.weight;
      }
    }
  }

  // Score 0-10 based on weighted percentage
  return Math.round((metWeight / totalWeight) * 10 * 10) / 10;
}

function getAlignmentLabel(score: number): string {
  if (score >= 9) return "Excellent Alignment";
  if (score >= 7.5) return "Strong Alignment";
  if (score >= 6) return "Good Alignment";
  if (score >= 4.5) return "Partial Alignment";
  return "Weak Alignment";
}

// ============================================================================
// PROMPT-TAILORED SUGGESTIONS
// ============================================================================

function generatePromptSuggestions(
  requirementsMet: Array<{ element: string; met: boolean; suggestion?: string }>,
  promptId: UCPromptID
): string[] {

  const suggestions: string[] = [];

  // Add requirement-based suggestions
  const unmetRequirements = requirementsMet
    .filter(r => !r.met && r.suggestion)
    .slice(0, 3); // Top 3 priority

  for (const req of unmetRequirements) {
    if (req.suggestion) {
      suggestions.push(req.suggestion);
    }
  }

  // Add prompt-specific strategic advice
  const promptAdvice: Record<UCPromptID, string[]> = {
    1: [
      "Leadership PIQ: Focus on HOW you led, not just WHAT you accomplished",
      "Show your leadership style through dialogue or specific decisions",
      "Quantify impact: How many people? What changed?"
    ],
    2: [
      "Creative PIQ: Show your process, not just your product",
      "Use sensory details to bring creative moment to life",
      "Avoid generic 'art is my passion' - be specific about your medium"
    ],
    3: [
      "Talent PIQ: Emphasize GROWTH over innate ability",
      "Show specific moments of development (setbacks → breakthroughs)",
      "Connect skill to broader impact beyond personal achievement"
    ],
    4: [
      "Educational PIQ: Show intellectual curiosity, not resume-building",
      "Emphasize resourcefulness in seeking/creating opportunities",
      "Connect to academic transformation, not just participation"
    ],
    5: [
      "Challenge PIQ: Start with vulnerable moment (physical symptoms, emotion)",
      "Show resilience through ACTIONS, not statements like 'I persevered'",
      "Explicitly connect to academic impact (grades, courses, learning)"
    ],
    6: [
      "Academic Passion PIQ: Ask questions, don't just list achievements",
      "Show self-directed learning OUTSIDE classroom (research, reading)",
      "Avoid career justification - focus on intellectual curiosity"
    ],
    7: [
      "Community PIQ: Show TRANSFORMATION (before → after state)",
      "Emphasize systemic change over one-time service",
      "Quantify reach and show sustainability (will it continue?)"
    ],
    8: [
      "Distinction PIQ: Choose something NOT covered in other PIQs",
      "Show through narrative, don't just claim 'I'm unique'",
      "Connect to how you'll contribute to UC campus"
    ]
  };

  // Add prompt-specific advice (avoid duplicates)
  const specificAdvice = promptAdvice[promptId] || [];
  for (const advice of specificAdvice) {
    if (!suggestions.some(s => s.toLowerCase().includes(advice.toLowerCase()))) {
      suggestions.push(advice);
    }
  }

  return suggestions.slice(0, 5); // Max 5 suggestions
}

// ============================================================================
// HELPER: Get prompt info by ID
// ============================================================================

export function getPromptInfo(promptId: UCPromptID) {
  return UC_PROMPTS[promptId];
}

export function getAllPrompts() {
  return UC_PROMPTS;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { analyzePromptAlignment, UC_PROMPTS };
export type { PromptIntelligenceResult, PromptRequirement };
